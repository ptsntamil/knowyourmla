from bs4 import BeautifulSoup
from typing import List, Dict, Optional
import re
from scraper.config import logger, BASE_URL
from scraper.utils import clean_name, extract_gender, clean_currency_to_int, clean_percentage_to_float

class MynetaParser:
    @staticmethod
    def get_constituency_links(html: str) -> List[Dict[str, str]]:
        """Extract constituency URLs from the election year main page."""
        soup = BeautifulSoup(html, "lxml")
        constituencies = []
        links = soup.find_all("a", href=lambda href: href and "action=show_candidates&constituency_id=" in href)
        
        for link in links:
            name = link.text.strip()
            if name:
                constituencies.append({
                    "name": clean_name(name),
                    "url": BASE_URL + "/" + link["href"].strip() if link["href"].startswith("/") else BASE_URL + "/tamilnadu2021/" + link["href"] if "tamilnadu2021" not in link["href"].lower() else BASE_URL + "/" + link["href"] # Will fix this with proper URL joining in main, just basic joining here if it's relative
                })
        return constituencies

    @staticmethod
    def get_winner_links(html: str, year_slug: str) -> List[Dict[str, str]]:
        """Extract candidate URLs from the winners page by decoding packed JS."""
        import subprocess
        import urllib.parse
        soup = BeautifulSoup(html, "lxml")
        candidates = []
        links = soup.find_all("a", href=lambda href: href and "candidate.php?candidate_id=" in href)
        
        decoded_html = ""
        for script in soup.find_all("script"):
            if script.string and "eval(function" in script.string:
                js_code = script.string.replace("eval(function", "console.log(function", 1)
                try:
                    res = subprocess.run(["node", "-e", js_code], capture_output=True, text=True, check=True)
                    decoded_html += res.stdout
                except Exception as e:
                    logger.error(f"Failed to decode JS: {e}")
                    
        if decoded_html:
            decoded_soup = BeautifulSoup(decoded_html, "lxml")
            js_links = decoded_soup.find_all("a", href=lambda h: h and "candidate.php?candidate_id=" in h)
            links.extend(js_links)
            
        seen_urls = set()
        for link in links:
            name = link.text.strip()
            if not name or "Comparison" in name:
                continue
                
            href = link["href"].strip()
            # Construct standard Absolute URL using urljoin
            base_year_url = f"{BASE_URL}/{year_slug}/"
            url = urllib.parse.urljoin(base_year_url, href)
                
            if url not in seen_urls:
                seen_urls.add(url)
                candidates.append({
                    "name": clean_name(name).replace("(Winner)", "").strip(),
                    "url": url
                })
        return candidates

    @staticmethod
    def parse_candidate_details(html: str, source_url: str, election_year: str, details: Optional[Dict] = None) -> Optional[Dict]:
        """Parse detailed candidate info from the profile page."""
        details = details or {}
        soup = BeautifulSoup(html, "lxml")
        
        try:
            # Main Info Block
            main_info = soup.select_one("div.w3-twothird")
            if not main_info:
                logger.warning(f"Could not find main info block for {source_url}")
                return None

            raw_name = main_info.find("h2").text
            result = "Won" if "(Winner)" in raw_name else "Lost"
            full_name = clean_name(raw_name.replace("(Winner)", ""))
            constituency = clean_name(main_info.find("h5").text)
            
            # Age and Party are usually in b tags inside the main info
            age_text = soup.find("b", string=lambda x: x and "Age:" in x)
            age = int(re.sub(r'[^\d]', '', age_text.parent.get_text())) if age_text else None
            
            party_text = soup.find("b", string=lambda x: x and "Party:" in x)
            party = clean_name(party_text.parent.get_text().replace("Party:", "")) if party_text else "IND"

            # Gender inference
            parent_info = soup.find("b", string=lambda x: x and any(m in x for m in ["S/o", "D/o", "W/o"]))
            gender = extract_gender(parent_info.parent.get_text()) if parent_info else "Not Specified"

            # Education
            edu_text = soup.find("b", string=lambda x: x and "Education:" in x) or soup.find("b", string=lambda x: x and "Category:" in x)
            education = clean_name(edu_text.parent.get_text().split(":")[-1]) if edu_text else None

            # Profession
            prof_text = soup.find("b", string=lambda x: x and "Self Profession:" in x)
            profession = clean_name(prof_text.parent.get_text().split(":")[-1]) if prof_text else None

            # Assets & Liabilities
            assets_div = soup.find("div", string=lambda x: x and "Total Assets:" in x)
            assets = clean_currency_to_int(assets_div.find_next_sibling("div").find("b").text) if assets_div else 0
            
            liab_div = soup.find("div", string=lambda x: x and "Total Liabilities:" in x)
            liab = clean_currency_to_int(liab_div.find_next_sibling("div").find("b").text) if liab_div else 0

            # Criminal Cases (from summary or badge)
            criminal_badge = soup.select_one("div.w3-red")
            criminal_count = 0
            if criminal_badge:
                match = re.search(r'(\d+)', criminal_badge.text)
                criminal_count = int(match.group(1)) if match else 0

            # Affidavit
            aff_link = soup.find("a", string=lambda x: x and "Affidavit" in x)
            affidavit_url = aff_link["href"] if aff_link else None

            # Election Meta Context
            # If the constituency string contains "BYE ELECTION", extract candidacy_type and date
            cand_type = "General"
            elec_date = None
            
            # Example: "VILAVANCODE : BYE ELECTION ON 19-04-2024"
            if "BYE ELECTION" in constituency.upper():
                cand_type = "Bye-Election"
                # Extract date using regex
                date_match = re.search(r'(\d{2}-\d{2}-\d{4})', constituency)
                if date_match:
                    elec_date = date_match.group(1)
                
                # Clean constituency name to just the name part if possible
                # e.g. "VILAVANCODE : BYE ELECTION..." -> "VILAVANCODE"
                constituency = constituency.split(":")[0].strip()

            # Profile Pic
            import urllib.parse
            pic_img = soup.find("img", src=lambda s: s and ("photos" in s or "images_candidate" in s))
            profile_pic = None
            if pic_img:
                profile_pic = urllib.parse.urljoin(source_url, pic_img['src'])

            # Placeholder for votes
            votes_received = 0
            total_votes = 0
            vote_percent = 0.0
            margin = 0

            return {
                "full_name": full_name,
                "age": age,
                "gender": gender,
                "party": party,
                "constituency": constituency,
                "election_year": election_year,
                "election_type": details.get('election_type', "Assembly"),
                "candidacy_type": cand_type,
                "election_date": elec_date,
                "result": result,
                "votes_received": votes_received,
                "total_votes": total_votes,
                "vote_percentage": vote_percent,
                "winning_margin": margin,
                "education": education,
                "profession": profession,
                "total_assets": assets,
                "total_liabilities": liab,
                "criminal_cases_count": criminal_count,
                "affidavit_link": affidavit_url,
                "profile_pic": profile_pic,
                "source_url": source_url
            }

        except Exception as e:
            logger.error(f"Error parsing candidate {source_url}: {e}")
            return None
