#!/usr/bin/env python3
"""
Polling-station PDF -> clean JSON -> DynamoDB items.

Every step reads the previous step's JSON from disk and writes its own JSON,
so you can inspect / fix / resume at any point.

  01_raw_pages.json            text + table rows per PDF page            (pdfplumber)
  02_stations_raw.json         one record per station, raw cell strings
  03_parsed.json               regex-parsed building + polling areas
  04_normalized.json           overrides + aliases applied, filter keys derived
  04_alias_suggestions.json    possible spelling variants of village names (review!)
  05_validated.json            validation result per station
  05_review_queue.json/.csv    stations that need a human look
  05_override_templates.json   pre-filled snippets to paste into manual_overrides.json
  06_gemini_results.json       (optional) Gemini second opinion on flagged stations
  gemini_overrides.json        (optional) fixes Gemini proposed that passed the guard
  07_final_stations.json       final stations (+ review status)
  08_dynamodb_items.json/.ndjson   station + index + lookup items

Manual verification: edit  manual_overrides.json  and re-run (see its _help).
Gemini (optional): export GOOGLE_GEMINI_API_KEY=... and add --gemini
"""
import argparse, copy, csv, difflib, hashlib, json, os, re, sys, time
from collections import Counter, defaultdict
from pathlib import Path

# ----------------------------------------------------------------- helpers
def clean(s):
    s = (s or "").replace("\u00a0", " ").replace("\n", " ")
    return re.sub(r"\s+", " ", s).strip()

def slugify(s):
    return re.sub(r"[^a-z0-9]+", "", (s or "").lower())

def save(out, name, data):
    p = Path(out) / name
    p.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"   saved {p}")
    return p

def load(out, name):
    p = Path(out) / name
    if not p.exists():
        sys.exit(f"Missing {p}. Run the earlier step first.")
    return json.loads(p.read_text(encoding="utf-8"))

def flag(code, severity, kind, message, area_no=None):
    """severity: error|warn|info ; kind: parse (our regex unsure) | source (the PDF itself is odd)"""
    return {"code": code, "severity": severity, "kind": kind, "message": message, "area_no": area_no}

def deep_merge(a, b):
    out = copy.deepcopy(a)
    for k, v in (b or {}).items():
        if isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k] = deep_merge(out[k], v)
        else:
            out[k] = copy.deepcopy(v)
    return out

def raw_hash(st):
    h = hashlib.sha1((st["raw"]["building"] + "||" + st["raw"]["areas"]).encode()).hexdigest()
    return h[:12]

# ------------------------------------------------------------ STEP 1: extract
HEADER_RE = re.compile(
    r"(?:for\s+|-|\b)\s*(\d+)[\.\-\s]+([A-Za-z0-9\.\s\-\'\&]+?)\s*(?:\([^\)]*\))?\s*"
    r"(?:(?:Legislative\s+)?Assembly\s+(?:Segm[a-z]*|Const[a-z]*)|LEGISLATIVE\s+ASSEMBLY\s+CONSTITUENCY)\s*"
    r"(?:(?:comprised\s+)?with\s*in\s+the\s*)"
    r"(?:(\d+)[\.\-\s]+)?([A-Za-z0-9\.\s\-\'\&]+?)\s*(?:\(\s*([A-Za-z]+)\s*\))?\s*"
    r"P[a-z]*li[a-z]*\s*Cons?t?ituenc[a-z]*",
    re.I
)

AC_ONLY_RE = re.compile(
    r"(?:for\s+|-|\b)\s*(\d+)[\.\-\s]+([A-Za-z0-9\.\s\-\'\&]+?)\s*(?:\([^\)]*\))?\s*"
    r"(?:(?:Legislative\s+)?Assembly\s+(?:Segm[a-z]*|Const[a-z]*)|LEGISLATIVE\s+ASSEMBLY\s+CONSTITUENCY)",
    re.I
)

def extract_ac_no_from_filename(path_or_name):
    """Extracts AC number from filename or path (e.g. 'ac003' -> 3, 'AC003.pdf' -> 3)."""
    base = os.path.basename(path_or_name or "")
    m = re.search(r"ac[-_]?(\d+)", base, re.I)
    if m:
        return int(m.group(1))
    m = re.search(r"(\d+)", base)
    if m:
        return int(m.group(1))
    return None

def ensure_meta(meta, fallback_path=None):
    """Guarantees required metadata keys exist with sensible defaults."""
    if meta.get("ac_no") is None and fallback_path:
        meta["ac_no"] = extract_ac_no_from_filename(fallback_path)
    if meta.get("ac_no") is not None and not meta.get("ac_name"):
        meta["ac_name"] = f"AC {meta['ac_no']:03d}"
    meta.setdefault("ac_no", None)
    meta.setdefault("ac_name", None)
    meta.setdefault("pc_no", None)
    meta.setdefault("pc_name", None)
    meta.setdefault("pc_category", "GEN")
    if fallback_path and not meta.get("source_file"):
        meta["source_file"] = os.path.basename(fallback_path)
    return meta

def open_pdf_safely(pdf_path: str):
    """Opens PDF with pdfplumber, falling back to pypdf stream rebuild if xref parsing fails.

    Args:
        pdf_path: Path to PDF file.

    Returns:
        Tuple of (pdfplumber.PDF instance, int total_pages).
    """
    import pdfplumber
    doc = pdfplumber.open(pdf_path)
    if len(doc.pages) > 0:
        return doc, len(doc.pages)

    import io, pypdf
    try:
        reader = pypdf.PdfReader(pdf_path)
        page_count = len(reader.pages)
        if page_count > 0:
            writer = pypdf.PdfWriter()
            for page in reader.pages:
                writer.add_page(page)
            buf = io.BytesIO()
            writer.write(buf)
            buf.seek(0)
            doc.close()
            return pdfplumber.open(buf), page_count
    except Exception:
        pass

    return doc, len(doc.pages)

def _read_pdf_pages(pdf_path):
    doc, page_count = open_pdf_safely(pdf_path)
    pages = []
    with doc:
        for i, page in enumerate(doc.pages, 1):
            text = page.extract_text() or ""
            rows = [[(c or "") for c in r] for t in page.extract_tables() for r in t]
            pages.append({"page": i, "text": text, "rows": rows})

    if not pages:
        raise ValueError(f"No pages could be extracted from {pdf_path} (0 bytes or unreadable file)")

    has_text = any(bool(p["text"].strip()) for p in pages)
    has_rows = any(bool(p["rows"]) for p in pages)
    if not has_text and not has_rows:
        raise ValueError(
            f"{pdf_path} contains {page_count} scanned bitmap image pages with no digital text or vector tables. "
            f"Scanned paper PDFs require OCR or Gemini vision extraction (use helper/polling_station_details_extracter.py)."
        )
    return pages


def _extract_meta_from_pages(pages, pdf_path):
    meta = {"ac_no": None, "ac_name": None, "pc_no": None, "pc_name": None, "pc_category": "GEN"}
    for p in pages:
        txt = clean(p["text"])
        m = HEADER_RE.search(txt)
        if m:
            meta["ac_no"] = int(m.group(1))
            meta["ac_name"] = m.group(2).strip(" .-").title()
            meta["pc_no"] = int(m.group(3)) if m.group(3) else None
            meta["pc_name"] = m.group(4).strip(" .-").title() if m.group(4) else None
            meta["pc_category"] = (m.group(5) or "GEN").upper()
            break
        if not meta["ac_no"]:
            m_ac = AC_ONLY_RE.search(txt)
            if m_ac:
                meta["ac_no"] = int(m_ac.group(1))
                meta["ac_name"] = m_ac.group(2).strip(" .-").title()

    if not meta.get("ac_no"):
        fallback_ac = extract_ac_no_from_filename(pdf_path)
        if fallback_ac is not None:
            meta["ac_no"] = fallback_ac
            if not meta.get("ac_name"):
                meta["ac_name"] = f"AC {meta['ac_no']:03d}"
            print(f"   [warn] Header metadata not found in text; fell back to AC number {meta['ac_no']:03d} from '{pdf_path}'")
        else:
            raise ValueError(f"Could not determine AC number from header or filename: {pdf_path}")

    ensure_meta(meta, fallback_path=pdf_path)
    pm = re.search(r"Page Number\s*:\s*\d+\s+of\s+(\d+)", pages[-1]["text"]) if pages else None
    meta["pdf_pages_declared"] = int(pm.group(1)) if pm else None
    meta["pdf_pages_read"] = len(pages)
    meta["source_file"] = os.path.basename(pdf_path)
    return meta


def step1_extract(pdf_path, out):
    pages = _read_pdf_pages(pdf_path)
    meta = _extract_meta_from_pages(pages, pdf_path)
    save(out, "01_raw_pages.json", {"meta": meta, "pages": pages})

# ------------------------------------------------------- STEP 2: split rows
def step2_split(out):
    d = load(out, "01_raw_pages.json")
    stations, skipped = [], []
    for p in d["pages"]:
        for r in p["rows"]:
            r = [clean(c) for c in r]
            if len(r) == 6 and (re.fullmatch(r"\d+", r[0]) or not r[0]):
                r = r[1:]
            if len(r) != 5:
                skipped.append({"page": p["page"], "row": r, "why": "not 5 columns"}); continue
            sl, ps, bld, areas, typ = r
            if re.fullmatch(r"\d+", sl) and re.fullmatch(r"\d+[A-Za-z]?", ps) and not re.fullmatch(r"\d+", bld):
                stations.append({"page": p["page"], "sl_no": int(sl), "ps_no_raw": ps,
                                 "building_raw": bld, "areas_raw": areas, "station_type_raw": typ})
            elif not sl and not ps and stations and (bld or areas):      # row continued from previous page
                stations[-1]["building_raw"] = clean(stations[-1]["building_raw"] + " " + bld)
                stations[-1]["areas_raw"] = clean(stations[-1]["areas_raw"] + " " + areas)
                skipped.append({"page": p["page"], "row": r, "why": "continuation row merged into previous station"})
            else:
                skipped.append({"page": p["page"], "row": r, "why": "header/other"})
    save(out, "02_stations_raw.json", {"meta": d["meta"], "stations": stations,
                                       "skipped_rows": [s for s in skipped if "header" not in s["why"]]})

# ------------------------------------------------------- STEP 3: parse
DIR = r"(?:north|south|east|west|esat|sorth|centre|center)(?:ern|en)?"
FACING_RE = re.compile(r"\b(" + DIR + r"(?:[\s-]*" + DIR + r")?)\s*f[a-z]{2,6}ng", re.I)
PIN_RE = re.compile(r"[-\s.]*(\d{6})\s*[.,]?\s*$")
ROOM_RE = re.compile(r"\(?\s*room\s*(?:no\.?)?\s*[-:]?\s*(\d+)\s*\)?", re.I)
NAME_CUT_RE = re.compile(
    r"\s+(?=(?:(?:north|south|east|west|centre|center|left|right)\w*\s+(?:side\s+)?(?:new\s+|old\s+)?"
    r"(?:building|buliding|buildng|wing|portion|side|block|facing|room)\b|new\s+(?:building|buliding|ssa)\b|"
    r"old\s+(?:building|buliding)\b|s\s*\.?\s*s\s*\.?\s*a\b|j\s*\.?\s*s\s*\.?\s*y\b|room\b|\())", re.I)
WARD_RE = re.compile(r"\(?\s*wards?\s*(?:no\.?)?\s*-?\s*(\d+(?:\s*(?:,|&|and|\.)\s*\d+)*)\s*\)?", re.I)
WARD_PRE_RE = re.compile(r"(?<!\d)(\d+)\s*(?:st|nd|rd|th)?\s*ward\b", re.I)
WARD_PAREN_RE = re.compile(r"\(\s*(\d+(?:\s*[,&]\s*\d+)*)\s*\)")
DOOR_RE = re.compile(r"D?door\s*no\.?\s*(?:from)?\s*-?\s*(\d+)(?:\s*(?:to|-)\s*(\d+))?", re.I)
RV_RE = re.compile(r"R\s*[.,]?\s*V|P\.V", re.I)

def norm_dir(tok):
    tok = tok.lower()
    tok = {"esat": "east", "sorth": "south", "centre": "center"}.get(tok, tok)
    return re.sub(r"(ern|en)$", "", tok).upper()

CATEGORY_RULES = [
    (r"anganwadi", "ANGANWADI"), (r"community hall", "COMMUNITY_HALL"),
    (r"service cent|grama sevai", "PANCHAYAT_SERVICE_CENTRE"), (r"higher sec", "HIGHER_SECONDARY_SCHOOL"),
    (r"high\s*school", "HIGH_SCHOOL"), (r"middle", "MIDDLE_SCHOOL"),
    (r"primary|elementry|elementary|nursery", "PRIMARY_SCHOOL"), (r"matric", "MATRIC_SCHOOL"),
    (r"welfare", "WELFARE_SCHOOL"), (r"school", "OTHER_SCHOOL")]
MGMT_RULES = [
    (r"(?:pan|pac)[a-z]*\s*u(?:ni|in)on", "PANCHAYAT_UNION"), (r"village panchayat|block panchayat", "PANCHAYAT"),
    (r"adi dravid|adi dravida|welfare", "ADI_DRAVIDAR_WELFARE"), (r"gov", "GOVERNMENT"),
    (r"c\.?\s*s\.?\s*i\b", "CSI"), (r"bosco|karunya|elite|antony|kothandaraman|matric", "PRIVATE_OR_AIDED")]

def first_rule(text, rules, default):
    for pat, val in rules:
        if re.search(pat, text, re.I):
            return val
    return default

def parse_building(raw):
    flags = []
    t = clean(raw)
    pin = None
    m = PIN_RE.search(t)
    if m:
        pin, t = m.group(1), t[:m.start()]
    else:
        m2 = re.search(r"\b(\d{6})\b", t)
        if m2:
            pin = m2.group(1)
    t = re.sub(r"\s+-\s+", ", ", t).strip(" ,.-")
    segs = [s.strip(" .-") for s in t.split(",") if s.strip(" .-")]
    room = ROOM_RE.search(t)
    facing, f_idx, f_match = None, None, None
    for i, s in enumerate(segs):
        fm = FACING_RE.search(s)
        if fm:
            facing = "_".join(norm_dir(x) for x in re.split(r"[\s-]+", fm.group(1)) if x)
            f_idx, f_match = i, fm
            break
    location, wing = None, []
    if segs:
        last = len(segs) - 1
        if f_idx == last:
            tail = segs[last][f_match.end():]
            wing_head = segs[last][:f_match.end()]
            location = tail
            body = segs[:last] + [wing_head]
            if last == 0:
                body = [wing_head]
        elif last >= 1:
            location = segs[last]
            body = segs[:last]
        else:
            body = segs[:]
        first = body[0] if body else ""
        cut = NAME_CUT_RE.search(first)
        name = first[:cut.start()].strip() if cut else first
        if cut:
            wing.append(first[cut.start():].strip())
        wing += body[1:]
    else:
        name = ""
    if location:
        location = ROOM_RE.sub("", location)
        location = re.sub(r"^\d+\s*\.\s*", "", location).strip(" ,.-")
        if location.count(")") > location.count("("): location = location.rstrip(") ")
        if location.count("(") > location.count(")"): location = location.lstrip("( ")
        if re.search(r"\b(building|buliding|facing|side|wing)\b", location, re.I) or not location:
            location = None
    wing_portion = ", ".join(w for w in wing if w) or None
    if not name:
        flags.append(flag("no_building_name", "error", "parse", "Could not extract building name"))
    elif re.search(r"building|buliding|facing", name, re.I) or len(name) > 70:
        flags.append(flag("suspicious_building_name", "warn", "parse", f"Building name looks wrong: '{name}'"))
    if not location:
        flags.append(flag("no_location", "warn", "parse", "Could not extract building location/village"))
    if not pin:
        flags.append(flag("no_pincode", "warn", "source", "No 6-digit pincode in building text"))
    if not facing:
        flags.append(flag("no_facing", "info", "source", "No facing direction in building text"))
    b = {"raw_text": clean(raw), "name": name or None,
         "category": first_rule(name, CATEGORY_RULES, "OTHER"),
         "management": first_rule(name, MGMT_RULES, "OTHER"),
         "wing_portion": wing_portion, "facing": facing,
         "room_no": room.group(1) if room else None, "location": location, "pincode": pin}
    return b, flags

HEAD_TYPE_RE = re.compile(
    r"^([^,(]+?\s*\(\s*(?:R\s*[.,]?\s*V|P\.V|Spl\s*P|TP|PT|P)\s*\)"
    r"(?:\s*and\s*\(*\s*(?:Spl\s*P|TP|P)\s*\)?)?)", re.I)

def split_head_rest(chunk):
    m = HEAD_TYPE_RE.match(chunk)
    if m and chunk[m.end():].strip(" ,"):
        return m.group(1).strip(), chunk[m.end():].strip(" ,")
    depth = 0
    for i, ch in enumerate(chunk):
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth = max(0, depth - 1)
        elif ch == "," and depth == 0:
            return chunk[:i].strip(), chunk[i + 1:].strip()
    i = chunk.find(",")                       # unbalanced brackets like "((P)," -> first comma
    return (chunk[:i].strip(), chunk[i + 1:].strip()) if i >= 0 else (chunk.strip(), "")

def split_tokens(s):
    return [x for x in re.split(r"\s*(?:,|&|and|\.)\s*", s) if x]

def parse_area_chunk(chunk, area_no):
    flags = []
    chunk = clean(chunk).strip(" ,")
    head, rest = split_head_rest(chunk)
    name = re.split(r"\s*\(", head, maxsplit=1)[0].strip(" ,.-")
    tail = head[len(re.split(r"\s*\(", head, maxsplit=1)[0]):]
    tu = tail.upper()
    is_rv = bool(RV_RE.search(tu))
    if re.search(r"P\.V", tu) and not re.search(r"R\s*[.,]?\s*V", tu):
        flags.append(flag("rv_marker_pv", "info", "source", "'(P.V)' treated as Revenue Village (R.V) typo", area_no))
    letters = re.sub(r"[^A-Z]", "", RV_RE.sub("", tu).replace("AND", ""))
    ltype = {"P": "P", "PT": "P", "SPLP": "SPL_P", "TP": "TP"}.get(letters)
    if letters and ltype is None and "WARD" not in letters:
        flags.append(flag("unknown_local_body_type", "warn", "parse", f"Unrecognised type token '{tail.strip()}'", area_no))

    wards, door_from, door_to = [], None, None
    locality = rest
    src = rest if rest else ""
    wm = WARD_RE.search(src) or WARD_RE.search(head)
    ward_text_is_in_head = bool(wm) and not WARD_RE.search(src)
    if wm:
        wards = split_tokens(wm.group(1))
        g = wm.group(0).strip()
        if g.startswith("(") and not g.endswith(")"):
            if len(wards[-1]) > 1 and wards[-1].endswith("0"):
                old = wards[-1]; wards[-1] = old[:-1]
                flags.append(flag("ward_typo_autofixed", "warn", "parse",
                                  f"Unclosed '(Ward {old}' - looks like '{wards[-1]})' ; auto-corrected {old}->{wards[-1]}", area_no))
            else:
                flags.append(flag("unclosed_ward_paren", "info", "parse", "Unclosed '(Ward ...' bracket in source", area_no))
        locality = src.replace(wm.group(0), " ") if not ward_text_is_in_head else rest
    else:
        pm = WARD_PRE_RE.search(src)
        if pm:
            wards = [pm.group(1)]; locality = src.replace(pm.group(0), " ")
        elif not re.search(r"ward", chunk, re.I):
            pp = WARD_PAREN_RE.search(src)
            if pp:
                wards = split_tokens(pp.group(1)); locality = src.replace(pp.group(0), " ")
    if re.search(r"ward", chunk, re.I) and not wards:
        flags.append(flag("ward_word_without_number", "warn", "parse", "Text mentions 'ward' but no ward number parsed", area_no))
    dm = DOOR_RE.search(locality)
    if dm:
        door_from = int(dm.group(1)); door_to = int(dm.group(2)) if dm.group(2) else None
        locality = locality.replace(dm.group(0), " ")
    locality = re.sub(r"\(\s*\)", "", locality)
    locality = clean(locality).strip(" ,.-") or None
    if not name:
        flags.append(flag("no_local_body", "error", "parse", "Could not extract local body (village/panchayat) name", area_no))
    return {"area_no": area_no, "raw_text": chunk, "local_body_name": name or None, "local_body_type": ltype,
            "is_revenue_village": is_rv, "locality": locality, "ward_nos": wards,
            "door_from": door_from, "door_to": door_to}, flags

def parse_areas(raw):
    parts = re.split(r"(?:\[|(?<!\w))(\d+)(?:\]|\.)\s*-?\s*", clean(raw))
    areas, flags, overseas = [], [], False
    for i in range(1, len(parts) - 1, 2):
        n, chunk = int(parts[i]), parts[i + 1].strip(" ,")
        if n == 99 or n == 999 or re.search(r"overseas", chunk, re.I):
            overseas = True; continue
        a, f = parse_area_chunk(chunk, n)
        areas.append(a); flags += f
    if not areas:
        flags.append(flag("no_areas", "error", "parse", "No polling areas parsed"))
    return areas, flags, overseas

def step3_parse(out):
    d = load(out, "02_stations_raw.json")
    stations = []
    for r in d["stations"]:
        m = re.fullmatch(r"(\d+)([A-Za-z]?)", r["ps_no_raw"])
        building, bflags = parse_building(r["building_raw"])
        areas, aflags, overseas = parse_areas(r["areas_raw"])
        stations.append({
            "ps_no": int(m.group(1)), "ps_no_suffix": m.group(2).upper() or None, "sl_no": r["sl_no"], "page": r["page"],
            "station_type": r["station_type_raw"].upper() or None, "has_overseas_electors": overseas,
            "building": building, "areas": areas, "parse_flags": bflags + aflags,
            "raw": {"building": r["building_raw"], "areas": r["areas_raw"]}})
    save(out, "03_parsed.json", {"meta": d["meta"], "stations": stations})

# ------------------------------------------------------- STEP 4: normalize
def load_overrides(out, manual_path=None):
    manual_p = Path(manual_path) if manual_path else Path(out) / "manual_overrides.json"
    if not manual_p.exists():
        manual_p.write_text(json.dumps(OVERRIDE_TEMPLATE, indent=2), encoding="utf-8")
        print(f"   created {manual_p} (empty template)")
    manual = json.loads(manual_p.read_text(encoding="utf-8"))
    gem_p = Path(out) / "gemini_overrides.json"
    gem = json.loads(gem_p.read_text(encoding="utf-8")) if gem_p.exists() else {}
    return {"aliases": {**gem.get("aliases", {}), **manual.get("aliases", {})},
            "stations": deep_merge(gem.get("stations", {}), manual.get("stations", {}))}

OVERRIDE_TEMPLATE = {
    "_help": [
        "Edit this file, then re-run the script (steps 4-8). Station keys are the polling station numbers.",
        "aliases: merge spelling variants into one village id. Key = variant name (or 'variant|pincode'), value = canonical name.",
        "  e.g. \"Obasamuthiram\": \"Obasamudram\"   or   \"Athupakkam|601102\": \"Athupakkam (Uthukottai)\"",
        "stations.<ps_no> may contain:",
        "  approved: true            -> you checked it; clears the parse warnings for that station",
        "  note: \"free text\"",
        "  building: {pincode, name, location, facing, room_no, wing_portion, category}",
        "  areas: {\"<area_no>\": {local_body_name, locality, ward_nos:[\"2\"], door_from, door_to, local_body_type, is_revenue_village}}",
        "  areas_raw: [\"Chunk text for area 1\", \"Chunk text for area 2\"]   -> replaces & re-parses all areas",
        "  building_raw: \"full building text\"                              -> re-parses the building",
        "  has_overseas_electors / station_type"],
    "aliases": {}, "stations": {}}

def apply_station_override(st, ov):
    st = copy.deepcopy(st)
    if "building_raw" in ov:
        st["building"], _ = parse_building(ov["building_raw"]); st["raw"]["building"] = ov["building_raw"]
    if "areas_raw" in ov:
        st["areas"] = [parse_area_chunk(c, i)[0] for i, c in enumerate(ov["areas_raw"], 1)]
    if "building" in ov:
        st["building"].update(ov["building"])
    for k, patch in (ov.get("areas") or {}).items():
        for a in st["areas"]:
            if str(a["area_no"]) == str(k):
                a.update(patch); a["manually_edited"] = True
    for k in ("has_overseas_electors", "station_type"):
        if k in ov:
            st[k] = ov[k]
    st["manual"] = {"approved": bool(ov.get("approved")), "note": ov.get("note"), "edited": True}
    return st

def derive(st, aliases):
    pin = st["building"].get("pincode")
    for a in st["areas"]:
        nm = a.get("local_body_name") or ""
        canon = aliases.get(f"{nm}|{pin}") or aliases.get(f"{slugify(nm)}|{pin}") or aliases.get(nm) or aliases.get(slugify(nm)) \
            or next((v for k, v in aliases.items() if slugify(k) == slugify(nm)), None)
        a["local_body_canonical"] = canon or nm or None
        a["local_body_id"] = slugify(a["local_body_canonical"]) or None
        a["locality_id"] = slugify(a.get("locality")) or None
        a["ward_nos"] = [str(w) for w in (a.get("ward_nos") or [])]
    uniq = lambda xs: sorted({x for x in xs if x})
    lb = uniq(a["local_body_id"] for a in st["areas"])
    st["filters"] = {
        "pincodes": uniq([pin]), "local_body_ids": lb,
        "rv_ids": uniq(a["local_body_id"] for a in st["areas"] if a.get("is_revenue_village")),
        "ward_nos": sorted({w for a in st["areas"] for w in a["ward_nos"]}, key=lambda x: (len(x), x)),
        "ward_keys": uniq(f'{a["local_body_id"]}#{w}' for a in st["areas"] for w in a["ward_nos"] if a["local_body_id"]),
        "locality_ids": uniq(f'{a["local_body_id"]}#{a["locality_id"]}' for a in st["areas"] if a["locality_id"] and a["local_body_id"]),
        "building_category": st["building"].get("category")}
    words = [st["building"].get("name"), st["building"].get("location"), pin] + \
            [a.get("local_body_canonical") for a in st["areas"]] + [a.get("locality") for a in st["areas"]]
    st["search_text"] = " ".join(sorted({w.lower() for w in words if w}))
    return st

def phonetic(s):
    s = re.sub(r"[^a-z]", "", s.lower())
    for a, b in (("zh", "l"), ("dh", "d"), ("th", "t"), ("ph", "p"), ("sh", "s"), ("ee", "i"), ("oo", "u")):
        s = s.replace(a, b)
    s = s.translate(str.maketrans("bgdjwv", "pktcuu"))
    s = re.sub(r"(.)\1+", r"\1", s)
    return s[:1] + re.sub(r"[aeiou]", "", s[1:])

def alias_suggestions(stations):
    names = defaultdict(lambda: {"names": Counter(), "pins": set(), "stations": []})
    for st in stations:
        for a in st["areas"]:
            if a.get("local_body_name"):
                x = names[slugify(a["local_body_name"])]
                x["names"][a["local_body_name"]] += 1; x["pins"].add(st["building"].get("pincode")); x["stations"].append(st["ps_no"])
    ids = list(names)
    groups, seen = [], set()
    for i, s1 in enumerate(ids):
        if s1 in seen: continue
        grp = [s1]
        for s2 in ids[i + 1:]:
            if s2 in seen: continue
            if phonetic(s1) == phonetic(s2) or difflib.SequenceMatcher(None, s1, s2).ratio() >= 0.9:
                grp.append(s2)
        if len(grp) > 1:
            seen.update(grp)
            pins = [names[g]["pins"] - {None} for g in grp]
            disjoint = all(not (pins[i] & pins[j]) for i in range(len(pins)) for j in range(i + 1, len(pins)))
            groups.append({
                "variants": [{"id": g, "spellings": dict(names[g]["names"]), "pincodes": sorted(names[g]["pins"] - {None}),
                              "stations": sorted(set(names[g]["stations"]))} for g in grp],
                "advice": "probably DIFFERENT villages (pincodes differ) - only merge if you are sure" if disjoint
                          else "likely the same village - add to manual_overrides.json aliases"})
    homonyms = [{"id": k, "pincodes": sorted(v["pins"] - {None}), "stations": sorted(set(v["stations"]))}
                for k, v in names.items() if len(v["pins"] - {None}) > 1]
    return {"possible_spelling_variants": groups,
            "same_name_in_several_pincodes": homonyms,
            "how_to_use": "Add aliases to manual_overrides.json -> aliases, e.g. {\"Obasamuthiram\": \"Obasamudram\"}"}

def step4_normalize(out, manual_path=None):
    d = load(out, "03_parsed.json")
    ov = load_overrides(out, manual_path)
    stations = []
    for st in d["stations"]:
        o = ov["stations"].get(str(st["ps_no"]))
        st = apply_station_override(st, o) if o else st
        stations.append(derive(st, ov["aliases"]))
    save(out, "04_normalized.json", {"meta": d["meta"], "stations": stations})
    save(out, "04_alias_suggestions.json", alias_suggestions(stations))

# ------------------------------------------------------- STEP 5: validate
PLACEHOLDER_RE = re.compile(r"\bz{2,}\b", re.I)

def validate_station(st, gem):
    reasons = list(st.get("parse_flags", []))
    b = st["building"]
    if not b.get("pincode") and not any(r["code"] == "no_pincode" for r in reasons):
        reasons.append(flag("no_pincode", "warn", "source", "No pincode"))
    if b.get("pincode") and not re.fullmatch(r"\d{6}", b["pincode"]):
        reasons.append(flag("bad_pincode", "error", "source", f"Pincode '{b['pincode']}' is not 6 digits"))
    nums = [a["area_no"] for a in st["areas"]]
    if nums and nums != list(range(1, len(nums) + 1)):
        reasons.append(flag("area_numbering", "warn", "parse", f"Area numbers not 1..n: {nums}"))
    seen = set()
    for a in st["areas"]:
        if PLACEHOLDER_RE.search(a["raw_text"]) or PLACEHOLDER_RE.search(a.get("locality") or ""):
            reasons.append(flag("placeholder_text", "error", "source", "Placeholder 'zzz' in source area text - real name unknown", a["area_no"]))
        if a.get("locality") and len(a["locality"]) < 3:
            reasons.append(flag("short_locality", "warn", "parse", f"Very short locality '{a['locality']}'", a["area_no"]))
        for w in a["ward_nos"]:
            if not w.isdigit() or int(w) > 30:
                reasons.append(flag("ward_out_of_range", "warn", "parse", f"Odd ward '{w}'", a["area_no"]))
        if not a["ward_nos"]:
            reasons.append(flag("no_ward", "info", "source", "No ward number", a["area_no"]))
        if a["raw_text"] in seen:
            reasons.append(flag("duplicate_area", "info", "source", "Same area text repeated in this station", a["area_no"]))
        seen.add(a["raw_text"])
    if st["sl_no"] != st["ps_no"]:
        reasons.append(flag("slno_ne_psno", "info", "source", f"Sl.No {st['sl_no']} != PS No {st['ps_no']}"))
    # resolution
    g = gem.get(str(st["ps_no"]))
    g_ok = bool(g) and g.get("hash") == raw_hash(st) and g.get("status") in ("confirmed", "diff_applied")
    approved = bool(st.get("manual", {}).get("approved"))
    for r in reasons:
        r["resolved_by"] = None
        if r["severity"] == "info":
            r["resolved_by"] = "info"
        elif approved:
            r["resolved_by"] = "manual_approved"
        elif g_ok and r["kind"] == "parse":
            r["resolved_by"] = "gemini_confirmed" if g["status"] == "confirmed" else "gemini_fixed"
    open_ = [r for r in reasons if not r["resolved_by"]]
    status = "needs_review" if open_ else ("approved" if approved else "gemini_checked" if g_ok and any(
        r["resolved_by"].startswith("gemini") for r in reasons) else "ok")
    return {"status": status, "reasons": reasons}

def step5_validate(out):
    d = load(out, "04_normalized.json")
    gp = Path(out) / "06_gemini_results.json"
    gem = json.loads(gp.read_text())["results"] if gp.exists() else {}
    stations = d["stations"]
    for st in stations:
        st["review"] = validate_station(st, gem)
    # global checks
    gl, nums = [], [s["ps_no"] for s in stations]
    c = Counter(nums)
    dups = sorted(k for k, v in c.items() if v > 1)
    missing = sorted(set(range(1, max(nums) + 1)) - set(nums)) if nums else []
    if dups: gl.append(f"Duplicate station numbers: {dups}")
    if missing: gl.append(f"Missing station numbers: {missing}")
    if d["meta"].get("pdf_pages_declared") not in (None, d["meta"].get("pdf_pages_read")):
        gl.append("PDF page count differs from the 'Page Number: x of N' footer")
    per_page = Counter(s["page"] for s in stations)
    for p in range(1, (d["meta"].get("pdf_pages_read") or 0) + 1):
        if per_page[p] == 0: gl.append(f"No stations found on page {p}")
    queue, tmpl = [], {}
    for st in stations:
        rv = st["review"]
        open_ = [r for r in rv["reasons"] if not r["resolved_by"]]
        if not open_: continue
        queue.append({"ps_no": st["ps_no"], "page": st["page"], "building_raw": st["raw"]["building"],
                      "areas_raw": st["raw"]["areas"], "reasons": open_,
                      "parsed_building": {k: st["building"][k] for k in ("name", "location", "pincode", "facing")},
                      "parsed_areas": [{k: a[k] for k in ("area_no", "local_body_name", "locality", "ward_nos", "door_from", "door_to")} for a in st["areas"]]})
        bad_areas = {r["area_no"] for r in open_ if r["area_no"]}
        tmpl[str(st["ps_no"])] = {
            "approved": False, "note": "",
            "building": {k: st["building"][k] for k in ("name", "location", "pincode")},
            "areas": {str(a["area_no"]): {k: a[k] for k in ("local_body_name", "locality", "ward_nos", "door_from", "door_to")}
                      for a in st["areas"] if a["area_no"] in bad_areas}}
    sev = Counter(r["severity"] for q in queue for r in q["reasons"])
    summary = {"total_stations": len(stations), "ok": sum(s["review"]["status"] == "ok" for s in stations),
               "gemini_checked": sum(s["review"]["status"] == "gemini_checked" for s in stations),
               "approved": sum(s["review"]["status"] == "approved" for s in stations),
               "needs_review": len(queue), "open_reasons_by_severity": dict(sev), "global_issues": gl}
    save(out, "05_validated.json", {"meta": d["meta"], "summary": summary, "stations": stations})
    save(out, "05_review_queue.json", {"summary": summary, "queue": queue})
    save(out, "05_override_templates.json", {"_help": "Copy an entry into manual_overrides.json -> stations, fix values, set approved:true", **tmpl})
    with open(Path(out) / "05_review_queue.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["ps_no", "page", "severity", "code", "kind", "area_no", "message", "building_raw", "areas_raw"])
        for q in queue:
            for r in q["reasons"]:
                w.writerow([q["ps_no"], q["page"], r["severity"], r["code"], r["kind"], r["area_no"], r["message"], q["building_raw"], q["areas_raw"]])
    print(f"   summary: {json.dumps(summary)}")

# ------------------------------------------------------- STEP 6: gemini (optional)
GEMINI_FIELDS_B = ("name", "wing_portion", "facing", "room_no", "location", "pincode")
GEMINI_FIELDS_A = ("local_body_name", "local_body_type", "is_revenue_village", "locality", "ward_nos", "door_from", "door_to")

def call_gemini(prompt, model, key):
    import requests
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    body = {"contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0, "responseMimeType": "application/json"}}
    for attempt in range(4):
        r = requests.post(url, headers={"x-goog-api-key": key, "Content-Type": "application/json"}, json=body, timeout=90)
        if r.status_code in (429, 500, 502, 503):
            time.sleep(2 ** attempt * 2); continue
        r.raise_for_status()
        text = r.json()["candidates"][0]["content"]["parts"][0]["text"]
        return json.loads(re.sub(r"^```(?:json)?|```$", "", text.strip(), flags=re.M).strip())
    raise RuntimeError("Gemini unavailable after retries")

def gemini_prompt(st, reasons):
    cur = {"building": {k: st["building"].get(k) for k in GEMINI_FIELDS_B},
           "areas": [{"area_no": a["area_no"], **{k: a.get(k) for k in GEMINI_FIELDS_A}} for a in st["areas"]]}
    return f"""You are verifying a regex parse of one row of an Indian electoral-roll "List of Polling Stations" table.
RAW building cell: {json.dumps(st['raw']['building'])}
RAW polling-areas cell: {json.dumps(st['raw']['areas'])}
Current parse: {json.dumps(cur)}
Problems detected: {json.dumps([r['message'] for r in reasons])}

Rules:
- Return corrected values using ONLY text that appears in the RAW cells. Do NOT fix spelling, translate, or invent anything. Use null when absent.
- building.name = institution name only (no wing/facing/room). building.wing_portion = building/wing/room description. building.location = village/locality of the building. building.pincode = 6 digits.
- Each polling area is "[n] -<local body> (R.V)and(P|Spl P|TP), <locality> (Ward - x) Door No From a to b".
  local_body_name = name before the bracket; local_body_type one of "P","SPL_P","TP" or null; is_revenue_village = true if "(R.V)" present;
  ward_nos = list of ward numbers as strings; door_from/door_to = integers or null.
- A source typo like "(Ward 20," usually means "(Ward 2)".
Return JSON only: {{"building": {{...}}, "areas": [{{"area_no": n, ...}}], "notes": "short"}}"""

def norm_val(v):
    if isinstance(v, list): return sorted(str(x) for x in v)
    if isinstance(v, str): return re.sub(r"\s+", " ", v).strip().casefold() or None
    return v

def guard_and_diff(st, sug):
    problems, diff_b, diff_a = [], {}, {}
    raw_b = slugify(st["raw"]["building"])
    b = sug.get("building") or {}
    for k in GEMINI_FIELDS_B:
        v = b.get(k)
        if v is not None and k in ("name", "location", "wing_portion", "room_no", "pincode") and slugify(str(v)) not in raw_b:
            problems.append(f"building.{k}='{v}' not found in raw text")
        if k in b and norm_val(v) != norm_val(st["building"].get(k)):
            diff_b[k] = v
    if b.get("pincode") and not re.fullmatch(r"\d{6}", str(b["pincode"])):
        problems.append("pincode not 6 digits")
    by_no = {a["area_no"]: a for a in st["areas"]}
    got = {int(a["area_no"]): a for a in (sug.get("areas") or []) if str(a.get("area_no", "")).isdigit()}
    if set(got) != set(by_no):
        problems.append(f"area numbers differ: ours {sorted(by_no)} vs gemini {sorted(got)}")
    for n, ga in got.items():
        if n not in by_no: continue
        raw = by_no[n]["raw_text"]
        digits = set(re.findall(r"\d+", raw))
        for k in ("local_body_name", "locality"):
            if ga.get(k) and slugify(ga[k]) not in slugify(raw):
                problems.append(f"area {n} {k}='{ga[k]}' not in raw text")
        for w in ga.get("ward_nos") or []:
            if str(w) not in digits and str(w) + "0" not in digits:
                problems.append(f"area {n} ward '{w}' not in raw text")
        for k in ("door_from", "door_to"):
            if ga.get(k) is not None and str(ga[k]) not in digits:
                problems.append(f"area {n} {k}={ga[k]} not in raw text")
        if ga.get("local_body_type") not in (None, "P", "SPL_P", "TP"):
            problems.append(f"area {n} bad local_body_type")
        d = {k: ga.get(k) for k in GEMINI_FIELDS_A if k in ga and norm_val(ga.get(k)) != norm_val(by_no[n].get(k))}
        if "ward_nos" in d: d["ward_nos"] = [str(x) for x in d["ward_nos"] or []]
        if d: diff_a[str(n)] = d
    return problems, diff_b, diff_a

def step6_gemini(out, model, accept, max_n, delay=0.5):
    key = os.environ.get("GOOGLE_GEMINI_API_KEY")
    if not key:
        print("   GOOGLE_GEMINI_API_KEY not set -> skipping Gemini step"); return False
    d = load(out, "05_validated.json")
    prev_p = Path(out) / "06_gemini_results.json"
    results = json.loads(prev_p.read_text())["results"] if prev_p.exists() else {}
    todo = [s for s in d["stations"] if any(r["kind"] == "parse" and not r["resolved_by"] for r in s["review"]["reasons"])]
    print(f"   {len(todo)} stations have unresolved parse doubts -> asking Gemini ({model})")
    overrides = {}
    for i, st in enumerate(todo[:max_n]):
        reasons = [r for r in st["review"]["reasons"] if not r["resolved_by"]]
        h = raw_hash(st)
        try:
            sug = call_gemini(gemini_prompt(st, reasons), model, key)
            problems, db, da = guard_and_diff(st, sug)
            if problems: status = "rejected_by_guard"
            elif not db and not da: status = "confirmed"
            else: status = "diff_applied" if accept else "diff_suggested"
            results[str(st["ps_no"])] = {"hash": h, "status": status, "guard_problems": problems,
                                         "building_diff": db, "area_diff": da, "notes": sug.get("notes")}
            if status == "diff_applied":
                overrides[str(st["ps_no"])] = {k: v for k, v in (("building", db), ("areas", da)) if v}
        except Exception as e:                                     # keep going, record the failure
            results[str(st["ps_no"])] = {"hash": h, "status": "error", "error": str(e)}
        print(f"   [{i+1}/{min(len(todo), max_n)}] PS {st['ps_no']}: {results[str(st['ps_no'])]['status']}")
        time.sleep(delay)
    save(out, "06_gemini_results.json", {"model": model, "results": results})
    sug_ov = {k: {"building": v["building_diff"], "areas": v["area_diff"]} for k, v in results.items() if v["status"] in ("diff_suggested", "diff_applied")}
    save(out, "06_gemini_suggested_overrides.json", sug_ov)
    if accept:
        old = json.loads((Path(out) / "gemini_overrides.json").read_text()) if (Path(out) / "gemini_overrides.json").exists() else {}
        save(out, "gemini_overrides.json", {"stations": deep_merge(old.get("stations", {}), overrides)})
    return True

# ------------------------------------------------------- STEP 7: final
def step7_final(out, strict):
    d = load(out, "05_validated.json")
    open_n = d["summary"]["needs_review"]
    if strict and open_n:
        sys.exit(f"--strict: {open_n} stations still need review (see 05_review_queue.csv)")
    for st in d["stations"]:
        st["needs_review"] = st["review"]["status"] == "needs_review"
        st.pop("parse_flags", None)
    save(out, "07_final_stations.json", {"meta": d["meta"], "summary": d["summary"], "stations": d["stations"]})

# ------------------------------------------------------- STEP 8: DynamoDB items
def step8_dynamodb(out, state_code, state_name):
    d = load(out, "07_final_stations.json")
    meta = ensure_meta(d["meta"], fallback_path=d["meta"].get("source_file") or out)
    pk = f"AC#{state_code}#{meta['ac_no']:03d}"
    items, lb_info, pin_map = [], {}, defaultdict(list)
    for st in d["stations"]:
        sk = f"PS#{st['ps_no']:04d}{st['ps_no_suffix'] or ''}"
        b = st["building"]
        items.append({
            "PK": pk, "SK": sk, "entity": "STATION", "state_code": state_code, "state_name": state_name,
            "ac_no": meta["ac_no"], "ac_name": meta["ac_name"], "pc_no": meta["pc_no"], "pc_name": meta["pc_name"],
            "pc_category": meta["pc_category"], "ps_no": st["ps_no"], "ps_no_suffix": st["ps_no_suffix"], "sl_no": st["sl_no"],
            "station_type": st["station_type"], "has_overseas_electors": st["has_overseas_electors"],
            "source": {"file": meta["source_file"], "page": st["page"]},
            "building": b, "areas": [{k: v for k, v in a.items() if k != "manually_edited"} for a in st["areas"]],
            "filters": st["filters"], "search_text": st["search_text"],
            "needs_review": st["needs_review"], "review_status": st["review"]["status"],
            "review_codes": sorted({r["code"] for r in st["review"]["reasons"] if r["severity"] != "info"})})
        proj = {"ps_no": st["ps_no"], "building_name": b["name"], "location": b["location"],
                "category": b["category"], "areas": len(st["areas"])}
        if b.get("pincode"):
            proj["pincode"] = b["pincode"]
        idx = defaultdict(list)
        idx["PIN"] += st["filters"]["pincodes"]; idx["LB"] += st["filters"]["local_body_ids"]
        idx["RV"] += st["filters"]["rv_ids"]; idx["WARD"] += st["filters"]["ward_keys"]
        idx["LOC"] += st["filters"]["locality_ids"]; idx["CAT"] += [st["filters"]["building_category"]]
        if st["has_overseas_electors"]: idx["OVERSEAS"].append("Y")
        for kind, vals in idx.items():
            for v in sorted({x for x in vals if x}):
                items.append({"PK": pk, "SK": f"IDX#{kind}#{v}#{sk}", "entity": "INDEX", "kind": kind, "value": v,
                              "GSI1PK": f"{pk}#{kind}#{v}", "GSI1SK": sk, **proj})
        pin_map[b["pincode"] or "UNKNOWN"].append(st["ps_no"])
        for a in st["areas"]:
            li = lb_info.setdefault(a["local_body_id"] or "unknown", {"names": set(), "types": set(), "wards": set(), "pins": set(), "stations": set(), "rv": False})
            li["names"].add(a["local_body_canonical"] or ""); li["types"].add(a["local_body_type"] or "")
            li["wards"].update(a["ward_nos"]); li["pins"].add(b["pincode"] or ""); li["stations"].add(st["ps_no"])
            li["rv"] = li["rv"] or bool(a["is_revenue_village"])
    for lid, li in sorted(lb_info.items()):
        items.append({"PK": pk, "SK": f"LB#{lid}", "entity": "LOCAL_BODY", "id": lid, "names": sorted(n for n in li["names"] if n),
                      "types": sorted(t for t in li["types"] if t), "is_revenue_village": li["rv"],
                      "wards": sorted(li["wards"], key=lambda x: (len(x), x)), "pincodes": sorted(p for p in li["pins"] if p),
                      "station_nos": sorted(li["stations"])})
    for pin, nos in sorted(pin_map.items()):
        items.append({"PK": pk, "SK": f"PIN#{pin}", "entity": "PINCODE", "pincode": pin, "station_nos": sorted(nos), "count": len(nos)})
    items.append({"PK": pk, "SK": "META", "entity": "AC_META", **{k: meta[k] for k in ("ac_no", "ac_name", "pc_no", "pc_name", "pc_category")},
                  "state_code": state_code, "state_name": state_name, "total_stations": len(d["stations"]),
                  "pincodes": sorted(pin_map), "local_body_count": len(lb_info), "needs_review_count": d["summary"]["needs_review"],
                  "source_file": meta["source_file"]})
    save(out, "08_dynamodb_items.json", items)
    with open(Path(out) / "08_dynamodb_items.ndjson", "w", encoding="utf-8") as f:
        for it in items: f.write(json.dumps(it, ensure_ascii=False) + "\n")
    print(f"   {len(items)} items  ({Counter(i['entity'] for i in items)})")

# ------------------------------------------------------- STEP 9: one JSON per constituency
def step9_bundle(out, state_code, state_name):
    d = load(out, "07_final_stations.json")
    meta = ensure_meta(d["meta"], fallback_path=d["meta"].get("source_file") or out)
    pin_map, lb, wards, locs = defaultdict(list), {}, defaultdict(lambda: defaultdict(list)), defaultdict(list)
    stations = []
    for st in d["stations"]:
        b, f = st["building"], st["filters"]
        pin_map[b.get("pincode") or "UNKNOWN"].append(st["ps_no"])
        for a in st["areas"]:
            lid = a["local_body_id"] or "unknown"
            x = lb.setdefault(lid, {"id": lid, "names": set(), "types": set(), "is_revenue_village": False,
                                    "wards": set(), "pincodes": set(), "station_nos": set()})
            x["names"].add(a["local_body_canonical"] or ""); x["types"].add(a["local_body_type"] or "")
            x["is_revenue_village"] |= bool(a["is_revenue_village"]); x["wards"].update(a["ward_nos"])
            x["pincodes"].add(b.get("pincode") or ""); x["station_nos"].add(st["ps_no"])
        for k in f["ward_keys"]:
            l, w = k.split("#", 1); wards[l][w].append(st["ps_no"])
        for k in f["locality_ids"]:
            locs[k].append(st["ps_no"])
        stations.append({
            "ps_no": st["ps_no"], "ps_no_suffix": st["ps_no_suffix"], "sl_no": st["sl_no"], "page": st["page"],
            "station_type": st["station_type"], "has_overseas_electors": st["has_overseas_electors"],
            "building": b,
            "areas": [{k: v for k, v in a.items() if k != "manually_edited"} for a in st["areas"]],
            "filters": f, "search_text": st["search_text"],
            "review": {"status": st["review"]["status"], "needs_review": st["needs_review"],
                       "open_codes": sorted({r["code"] for r in st["review"]["reasons"] if not r["resolved_by"]}),
                       "note": (st.get("manual") or {}).get("note")}})
    srt = lambda xs, key=None: sorted((x for x in xs if x), key=key)
    wkey = lambda x: (len(x), x)
    bundle = {
        "schema_version": "1.0",
        "meta": {"state_code": state_code, "state_name": state_name, "ac_no": meta["ac_no"], "ac_name": meta["ac_name"],
                 "pc_no": meta["pc_no"], "pc_name": meta["pc_name"], "pc_category": meta["pc_category"],
                 "source_file": meta["source_file"], "total_stations": len(stations)},
        "summary": d["summary"],
        "lookups": {
            "pincodes": {k: sorted(v) for k, v in sorted(pin_map.items())},
            "building_categories": sorted({s["building"]["category"] for s in stations if s["building"].get("category")}),
            "local_bodies": [{"id": k, "names": srt(v["names"]), "types": srt(v["types"]),
                              "is_revenue_village": v["is_revenue_village"], "wards": srt(v["wards"], wkey),
                              "pincodes": srt(v["pincodes"]), "station_nos": sorted(v["station_nos"])}
                             for k, v in sorted(lb.items())],
            "wards": {l: {w: sorted(set(n)) for w, n in sorted(ws.items(), key=lambda kv: wkey(kv[0]))} for l, ws in sorted(wards.items())},
            "localities": {k: sorted(set(v)) for k, v in sorted(locs.items())},
            "overseas_station_nos": [s["ps_no"] for s in stations if s["has_overseas_electors"]]},
        "stations": stations}
    name = f"AC{meta['ac_no']:03d}.json"
    p = save(out, name, bundle)
    print(f"   {name}: {len(stations)} stations, {p.stat().st_size/1024:.0f} KB")

# ------------------------------------------------------- batch & routing helpers
def find_default_assets_dir() -> Path:
    """Finds default assets/polling_stations directory across common root layouts.

    Returns:
        Path to assets/polling_stations directory.
    """
    candidates = [
        Path("assets/polling_stations"),
        Path("scraper/assets/polling_stations"),
        Path(__file__).resolve().parent.parent / "assets" / "polling_stations",
    ]
    for c in candidates:
        if (c / "pdf").exists() or c.exists():
            return c
    return Path("assets/polling_stations")


def resolve_output_dir(pdf_path, out_arg=None, base_out=None) -> Path:
    """Resolves output directory for constituency processing.

    Args:
        pdf_path: Path to input PDF file (if any).
        out_arg: Explicit --out argument provided by user.
        base_out: Explicit --base-out base folder (if any).

    Returns:
        Resolved output directory Path.
    """
    if out_arg:
        return Path(out_arg)

    ac_no = extract_ac_no_from_filename(pdf_path) if pdf_path else None
    folder_name = f"AC{ac_no:03d}" if ac_no is not None else (Path(pdf_path).stem if pdf_path else "out")

    if base_out:
        return Path(base_out) / folder_name

    if pdf_path:
        p = Path(pdf_path)
        if p.parent.name.lower() == "pdf":
            return p.parent.parent / folder_name

    default_base = find_default_assets_dir()
    return default_base / folder_name


def _parse_ac_token(part: str):
    part = part.strip()
    if not part:
        return None
    if "-" in part:
        lo, _, hi = part.partition("-")
        if lo.strip().isdigit() and hi.strip().isdigit():
            return range(int(lo.strip()), int(hi.strip()) + 1)
    if part.isdigit():
        return int(part)
    return extract_ac_no_from_filename(part)


def parse_ac_filter(ac_str=None, start_ac=None, end_ac=None):
    """Parses AC selection strings and ranges into a set of integers.

    Args:
        ac_str: Comma-separated or hyphenated list (e.g. '6', '1,2,3', '1-10').
        start_ac: Starting AC number.
        end_ac: Ending AC number.

    Returns:
        Set of integer AC numbers, or None if no filter applied.
    """
    selected = set()
    if start_ac or end_ac:
        selected.update(range(start_ac or 1, (end_ac or 234) + 1))

    if ac_str:
        for part in ac_str.split(","):
            val = _parse_ac_token(part)
            if isinstance(val, range):
                selected.update(val)
            elif val is not None:
                selected.add(val)

    return selected if (selected or ac_str or start_ac or end_ac) else None


def _execute_steps(want, pdf_path, out_dir, overrides, strict, state_code, state_name,
                   gemini, gemini_model, accept_gemini, gemini_max, hi):
    if want(1):
        if not pdf_path:
            sys.exit("PDF path required for step 1")
        print(f"[1] extract: {pdf_path} -> {out_dir}")
        step1_extract(pdf_path, out_dir)
    if want(2): print("[2] split"); step2_split(out_dir)
    if want(3): print("[3] parse"); step3_parse(out_dir)
    if want(4): print("[4] normalize"); step4_normalize(out_dir, overrides)
    if want(5): print("[5] validate"); step5_validate(out_dir)
    if gemini and (want(6) or hi >= 6):
        print("[6] gemini")
        if step6_gemini(out_dir, gemini_model, accept_gemini, gemini_max):
            print("[4] normalize (again, with Gemini fixes)"); step4_normalize(out_dir, overrides)
            print("[5] validate (again)"); step5_validate(out_dir)
    if want(7): print("[7] final"); step7_final(out_dir, strict)
    if want(8): print("[8] dynamodb items"); step8_dynamodb(out_dir, state_code, state_name)
    if want(9): print("[9] constituency bundle"); step9_bundle(out_dir, state_code, state_name)


def process_constituency(pdf_path, out_dir, steps="1-9", state_code="TN", state_name="Tamil Nadu",
                         overrides=None, gemini=False, accept_gemini=False, gemini_model="gemini-2.5-flash",
                         gemini_max=60, strict=False):
    """Runs pipeline steps for a single constituency.

    Args:
        pdf_path: Polling station PDF path.
        out_dir: Output folder to store artifacts.
        steps: Step range string (e.g. '1-9').
        state_code: State abbreviation.
        state_name: State display name.
        overrides: Path to overrides file.
        gemini: Whether to run Gemini step.
        accept_gemini: Automatically accept suggested diffs.
        gemini_model: Gemini model identifier.
        gemini_max: Max stations to prompt.
        strict: Whether to abort if reviews remain.

    Returns:
        Summary dict of processing outcomes.
    """
    lo, _, hi = steps.partition("-")
    lo, hi = int(lo), int(hi or lo)
    out_path = Path(out_dir)
    out_path.mkdir(parents=True, exist_ok=True)
    want = lambda n: lo <= n <= hi

    _execute_steps(want, pdf_path, out_dir, overrides, strict, state_code, state_name,
                   gemini, gemini_model, accept_gemini, gemini_max, hi)

    needs_review = 0
    q = out_path / "05_review_queue.json"
    if q.exists():
        try:
            needs_review = json.loads(q.read_text())["summary"]["needs_review"]
        except Exception:
            pass

    total_stations = 0
    f = out_path / "07_final_stations.json"
    if f.exists():
        try:
            total_stations = len(json.loads(f.read_text()).get("stations", []))
        except Exception:
            pass

    return {
        "total_stations": total_stations,
        "needs_review": needs_review,
        "out_dir": str(out_dir),
    }


def _process_batch_item(idx, total, pdf_path, base_out, skip_existing, steps,
                        state_code, state_name, overrides_path, gemini,
                        accept_gemini, gemini_model, gemini_max, strict):
    ac_num = extract_ac_no_from_filename(pdf_path.name)
    ac_name = f"AC{ac_num:03d}" if ac_num is not None else pdf_path.stem
    out_folder = base_out / ac_name

    if skip_existing and (out_folder / f"{ac_name}.json").exists():
        print(f"[{idx}/{total}] Skipping {ac_name} (bundle already exists in {out_folder})")
        return "skipped", ac_name, None

    print(f"\n>>> [{idx}/{total}] Processing {ac_name} ({pdf_path.name}) -> {out_folder}")
    try:
        res = process_constituency(
            pdf_path=str(pdf_path),
            out_dir=str(out_folder),
            steps=steps,
            state_code=state_code,
            state_name=state_name,
            overrides=overrides_path,
            gemini=gemini,
            accept_gemini=accept_gemini,
            gemini_model=gemini_model,
            gemini_max=gemini_max,
            strict=strict,
        )
        print(f"    Done {ac_name}: {res['total_stations']} stations ({res['needs_review']} needing review)")
        return "success", ac_name, res
    except Exception as e:
        print(f"    Failed {ac_name}: {e}")
        return "failed", ac_name, str(e)


def run_batch(pdf_dir, base_out, ac_filter=None, skip_existing=False, steps="1-9",
              state_code="TN", state_name="Tamil Nadu", overrides_path=None,
              gemini=False, accept_gemini=False, gemini_model="gemini-2.5-flash",
              gemini_max=60, strict=False):
    """Processes multiple constituency PDFs in batch.

    Args:
        pdf_dir: Directory containing input PDF files.
        base_out: Base directory where output folders are stored.
        ac_filter: Optional set of AC numbers to filter by.
        skip_existing: Whether to skip already generated constituency bundles.
        steps: Step range string (e.g. '1-9').
        state_code: State abbreviation.
        state_name: State display name.
        overrides_path: Path to overrides file.
        gemini: Whether to run Gemini step.
        accept_gemini: Automatically accept suggested diffs.
        gemini_model: Gemini model identifier.
        gemini_max: Max stations to prompt.
        strict: Whether to abort if reviews remain.
    """
    pdf_dir, base_out = Path(pdf_dir), Path(base_out)
    if not pdf_dir.exists():
        sys.exit(f"PDF directory does not exist: {pdf_dir}")

    all_pdfs = sorted(pdf_dir.glob("*.pdf"), key=lambda p: extract_ac_no_from_filename(p.name) or 9999)
    pdfs = [p for p in all_pdfs if extract_ac_no_from_filename(p.name) in ac_filter] if ac_filter else all_pdfs
    if not pdfs:
        sys.exit(f"No matching PDF files found in {pdf_dir}")

    total = len(pdfs)
    successful, skipped, failed = [], [], []

    print(f"\n============================================================")
    print(f"BATCH PROCESSING: {total} Constituencies")
    print(f"PDF Source:  {pdf_dir}\nBase Output: {base_out}\nSteps:       {steps}")
    print(f"============================================================\n")

    for idx, pdf_path in enumerate(pdfs, 1):
        status, name, info = _process_batch_item(
            idx, total, pdf_path, base_out, skip_existing, steps,
            state_code, state_name, overrides_path, gemini,
            accept_gemini, gemini_model, gemini_max, strict
        )
        if status == "skipped":
            skipped.append(name)
        elif status == "success":
            successful.append((name, info))
        else:
            failed.append((name, info))

    print(f"\n============================================================")
    print(f"BATCH RUN COMPLETE: {len(successful)} OK, {len(skipped)} Skipped, {len(failed)} Failed")
    if failed:
        for ac, err in failed:
            print(f"  - {ac}: {err}")
    print(f"============================================================\n")


def _run_single(a, out_path):
    res = process_constituency(
        pdf_path=a.pdf,
        out_dir=str(out_path),
        steps=a.steps,
        state_code=a.state_code,
        state_name=a.state_name,
        overrides=a.overrides,
        gemini=a.gemini,
        accept_gemini=a.accept_gemini,
        gemini_model=a.gemini_model,
        gemini_max=a.gemini_max,
        strict=a.strict,
    )
    q = out_path / "05_review_queue.json"
    if q.exists():
        n = res["needs_review"]
        print(f"\nDONE. Stations needing manual review: {n}  -> {out_path}/05_review_queue.csv")
        if n:
            print(f"Fix them in {out_path}/manual_overrides.json, then run: python {sys.argv[0]} {a.pdf or ''} --out {out_path} --steps 4-9")


# ------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("pdf", nargs="?", help="Polling station PDF, or directory of PDFs, or omit when using --all")
    ap.add_argument("--out", help="Output folder (default: assets/polling_stations/ACxxx)")
    ap.add_argument("--all", action="store_true", help="Process all constituencies in batch")
    ap.add_argument("--pdf-dir", help="Directory of PDFs for batch mode (default: assets/polling_stations/pdf)")
    ap.add_argument("--base-out", help="Base output directory for batch mode (default: assets/polling_stations)")
    ap.add_argument("--ac", help="Specific AC number(s) to process, e.g. '6', '1-5', '1,2,3'")
    ap.add_argument("--start-ac", type=int, help="Start AC number for batch mode (e.g. 1)")
    ap.add_argument("--end-ac", type=int, help="End AC number for batch mode (e.g. 234)")
    ap.add_argument("--skip-existing", action="store_true", help="Skip constituencies whose output bundle already exists")
    ap.add_argument("--steps", default="1-9", help="Pipeline steps to execute, e.g. 1-9, 4-8, 5")
    ap.add_argument("--state-code", default="TN")
    ap.add_argument("--state-name", default="Tamil Nadu")
    ap.add_argument("--overrides", help="Path to manual_overrides.json")
    ap.add_argument("--gemini", action="store_true", help="Step 6: ask Gemini about flagged stations")
    ap.add_argument("--accept-gemini", action="store_true", help="Apply Gemini fixes that pass the anti-hallucination guard")
    ap.add_argument("--gemini-model", default="gemini-2.5-flash")
    ap.add_argument("--gemini-max", type=int, default=60)
    ap.add_argument("--strict", action="store_true", help="Step 7 aborts if any station still needs review")
    a = ap.parse_args()

    default_assets = find_default_assets_dir()
    pdf_dir = Path(a.pdf_dir) if a.pdf_dir else default_assets / "pdf"
    base_out = Path(a.base_out) if a.base_out else default_assets

    # Determine whether batch mode or single constituency mode
    is_batch = a.all or (a.pdf and Path(a.pdf).is_dir()) or bool(a.ac or a.start_ac or a.end_ac)
    if not is_batch and not a.pdf:
        lo, _, _ = a.steps.partition("-")
        is_batch = not (int(lo or 1) > 1 and a.out)

    if is_batch:
        if a.pdf and Path(a.pdf).is_dir():
            pdf_dir = Path(a.pdf)
        ac_filter = parse_ac_filter(a.ac, a.start_ac, a.end_ac)
        run_batch(
            pdf_dir=pdf_dir,
            base_out=base_out,
            ac_filter=ac_filter,
            skip_existing=a.skip_existing,
            steps=a.steps,
            state_code=a.state_code,
            state_name=a.state_name,
            overrides_path=a.overrides,
            gemini=a.gemini,
            accept_gemini=a.accept_gemini,
            gemini_model=a.gemini_model,
            gemini_max=a.gemini_max,
            strict=a.strict,
        )
    else:
        out_path = resolve_output_dir(a.pdf, out_arg=a.out, base_out=a.base_out)
        _run_single(a, out_path)


if __name__ == "__main__":
    main()
