import re
import subprocess
from typing import List, Dict, Optional, Any, Union
from bs4 import BeautifulSoup
from scraper.utils import clean_currency_to_int, logger
from scraper.land_parser import parse_land_data

class AssetParser:
    """Parses detailed asset information from MyNeta candidate pages."""

    def __init__(self, soup_or_html: Any):
        if isinstance(soup_or_html, str):
            html = self._deobfuscate_page(soup_or_html)
            self.soup = BeautifulSoup(html, "lxml")
        else:
            self.soup = soup_or_html

    def _deobfuscate_page(self, html: str) -> str:
        """Deobfuscate MyNeta's packed JS content using node.js."""
        soup = BeautifulSoup(html, "lxml")
        scripts = soup.find_all("script")
        for script in scripts:
            js_text = script.string
            if not js_text: continue
            
            # Pattern 1: eval(function(...)
            if "eval(function" in js_text:
                js_code = js_text.replace("eval(function", "console.log(function", 1)
            # Pattern 2: document.write(_0x...)
            elif "document.write" in js_text and "_0x" in js_text:
                js_code = js_text.replace("document.write", "console.log")
            else:
                continue

            try:
                res = subprocess.run(["node", "-e", js_code], capture_output=True, text=True, timeout=5)
                if res.returncode == 0:
                    outputs = res.stdout.strip().split('\n')
                    for deobf_fragment in outputs:
                        if not deobf_fragment.strip(): continue
                        # Clean up common JS artifacts
                        deobf_fragment = deobf_fragment.replace("document.write('", "").replace("');", "").replace("\\'", "'").replace('\\"', '"')
                        new_tag = soup.new_tag("div")
                        new_tag.append(BeautifulSoup(deobf_fragment, "lxml"))
                        script.insert_before(new_tag)
                    script.decompose()
            except Exception: continue
        return str(soup)

    def parse_all(self) -> Dict[str, Any]:
        """Extract all requested assets."""
        return {"gold": self.parse_gold(), "vehicle": self.parse_vehicles(), "land": self.parse_land()}

    def _get_table_by_heading(self, heading_text: str) -> Optional[BeautifulSoup]:
        """Find the table following a specific heading text."""
        # Search for any tag containing the heading text
        header = self.soup.find(lambda t: t.name in ["h1", "h2", "h3", "h4", "b", "div"] and heading_text.lower() in t.get_text().lower())
        if header:
            # Look for the next table in the document
            return header.find_next("table")
        return None

    def parse_gold(self) -> Dict[str, Dict[str, str]]:
        table = self._get_table_by_heading("Movable Assets")
        gold_data = {"self": {"gold": "0", "value": "0"}, "spouse": {"gold": "0", "value": "0"}, "dep1": {"gold": "0", "value": "0"}}
        if not table: return gold_data
        
        for row in table.find_all("tr"):
            cells = [cell.get_text(strip=True) for cell in row.find_all("td")]
            if len(cells) > 1 and "Jewellery" in cells[1]:
                if len(cells) > 2: gold_data["self"] = self._extract_gold_info(cells[2])
                if len(cells) > 3: gold_data["spouse"] = self._extract_gold_info(cells[3])
                if len(cells) > 5: gold_data["dep1"] = self._extract_gold_info(cells[5])
                break
        return gold_data

    def _extract_gold_info(self, text: str) -> Dict[str, str]:
        val_match = re.search(r'Rs\s*([\d,.]+)', text)
        val = val_match.group(1).replace(',', '') if val_match else "0"
        gold_match = re.search(r'([\d.]+)\s*(?:Gram|gm|kg|Sovereign|Pavan|grm)', text, re.I)
        gold = gold_match.group(0) if gold_match else "0"
        return {"gold": gold, "value": f"{int(float(val)):,}" if val != "0" else "0", "raw_text": text.strip()}

    def parse_vehicles(self) -> Dict[str, List[Dict]]:
        table = self._get_table_by_heading("Movable Assets")
        vehicle_data = {"self": [], "spouse": [], "dep1": []}
        if not table: return vehicle_data
        
        for row in table.find_all("tr"):
            cells = [cell.get_text(separator='\n', strip=True) for cell in row.find_all("td")]
            if len(cells) > 1 and "Motor Vehicles" in cells[1]:
                if len(cells) > 2: vehicle_data["self"] = self._extract_vehicle_list(cells[2])
                if len(cells) > 3: vehicle_data["spouse"] = self._extract_vehicle_list(cells[3])
                if len(cells) > 5: vehicle_data["dep1"] = self._extract_vehicle_list(cells[5])
                break
        return vehicle_data

    def _extract_vehicle_list(self, text: str) -> List[Dict]:
        if "Nil" in text or not text.strip(): return []
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        vehicles = []
        i = 0
        while i < len(lines):
            line = lines[i]
            if re.match(r'^[\d,.\s]+(?:Lacs|Thou|Crore|Lak)?\+?$', line, re.I) or not any(c.isalpha() for c in line):
                 i += 1; continue
            v_match = re.search(r'([A-Z]{2}\s*\d{1,2}[A-Z\s]*\d{3,4}(?:\s*\(\d{4}\))?)', line)
            v_no = v_match.group(1).strip() if v_match else "N/A"
            name = line.replace(v_no, '').strip().strip(',').strip()
            val = "0"
            if i + 1 < len(lines):
                nk = lines[i+1].replace(',', '').replace('Rs', '').strip()
                if re.match(r'^\d+(\.\d+)?$', nk):
                    val = f"{int(float(nk)):,}"
                    i += 2
                else: i += 1
            else: i += 1
            vehicles.append({"name": name if name else "Vehicle", "vehicle": v_no, "value": val, "raw_text": line})
        return vehicles

    def parse_land(self) -> Dict[str, Any]:
        """Extract land details for Self, Spouse, and Dependent 1 using land_parser engine."""
        table = self._get_table_by_heading("Immovable Assets")
        if not table: return {"self": {"entries":[], "total":{}}, "spouse": {"entries":[], "total":{}}, "dep1": {"entries":[], "total":{}}}
        
        mappings = {"self": 2, "spouse": 3, "dep1": 5}
        land_data = {}
        for owner_key, col_idx in mappings.items():
            if len(table.find_all("tr")[0].find_all("td")) <= col_idx: continue
            combined_text = ""
            for row in table.find_all("tr"):
                cells = [cell.get_text(separator='\n', strip=True) for cell in row.find_all("td")]
                if cells and len(cells) > col_idx:
                    row_indicator = (cells[0] + " " + cells[1]).lower()
                    if any(k in row_indicator for k in ["(i)", "(ii)", "land", "total area"]):
                        combined_text += "\n" + cells[col_idx]
            
            if combined_text.strip():
                result = parse_land_data(combined_text.strip())
                for e in result["entries"]:
                    e["name"] = f"{e['village']} (S.No: {e['survey_no']})"
                    e["area"] = f"{e['acres']} Acres {e['cents']} Cents" if e['acres'] or e['cents'] else e['raw_area']
                    e["value"] = f"{int(e['purchase_cost']):,}" if e['purchase_cost'] else "0"
                if owner_key not in ["self", "spouse"]:
                    result.pop("full_text", None)
                land_data[owner_key] = result
            else:
                land_data[owner_key] = {"entries": [], "total": {"calculated": {"acres": 0.0, "cents": 0.0}, "declared": {"acres": 0.0, "cents": 0.0}, "total_purchase_cost": 0.0, "mismatch": False}}
        return land_data
