import os
import json
import time
import logging
from typing import Dict, Any
from google import genai
from land_parser import parse_land_data
import json_repair

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logging.getLogger("httpx").setLevel(logging.WARNING)
logger = logging.getLogger(__name__)

class AffidavitExtractor:
    """Extracts candidate data from affidavit PDFs using the modern google-genai SDK."""

    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)
        self.model_id = "models/gemini-2.5-flash-lite"  # Verified active ID

    def upload_pdf(self, file_path: str) -> Any:
        """Uploads PDF to Google AI File API using the new SDK."""
        # logger.info(f"Uploading file: {file_path}")
        file = self.client.files.upload(file=file_path)
        
        # In the new SDK, we might still need to wait for state if using for certain models
        # but usually for 'generate_content' it's handled or we check metadata.
        # For safety, we'll check if it's active.
        while file.state.name == "PROCESSING":
            time.sleep(2)
            file = self.client.files.get(name=file.name)
        
        if file.state.name != "ACTIVE":
            raise Exception(f"File {file.name} failed to process")
        
        logger.info(f"File uploaded and active: {file.name}")
        return file

    def extract_data(self, file: Any) -> Dict[str, Any]:
        """Extracts structured data using the new SDK's generate_content."""
        prompt = """
        You are an expert Data Extraction agent specializing in Indian Election Affidavits (Form 26). 
        Your task is to deeply parse the provided PDF and extract structured information into JSON.
        
        ### EXTRACTION STRATEGY:
        1. **Locate Sections**: Find Section 7 (Movable Assets), Section 8 (Immovable Assets), Section 9 (Liabilities), and the Summary Abstract (usually Item 11 at the end).
        2. **Family Columns**: Most tables have columns for Self, Spouse, Dependent-1, Dependent-2, etc. You MUST extract data for ALL columns.
        3. **ITR History**: Look at Item 4 or the Summary Table for the last 5 years of Income Tax Return filings and reported income.
        
        ### DATA FIELDS TO EXTRACT:
        1. pan_number
        2. education: {qualification, year, institution}
        3. profession
        4. party_name
        5. constituency_name
        6. voter_details: {constituency, serial_no, part_no}
        7. contact_details: {email, facebook, twitter_x, instagram}
        8. total_assets: {self, spouse, dependents} - Grand total of Movable + Immovable.
        9. total_liabilities: {self, spouse, dependents}
        10. criminal_cases_count
        11. income_tax_details: {self, spouse, dependents}
        12. itr_history: {self, spouse, dependents} - Map financial years (e.g., "2023-24") to numeric income amounts.
        13. vehicle_assets: {self, spouse, dependents} list of {name, registration_no, value}
        14. gold_details: {self, spouse, dependents} {weight_grms, value}
        15. silver_details: {self, spouse, dependents} {weight_grms, value}
        16. land_assets: Dictionary with keys 'self', 'spouse', 'dependents'.
            Each member must be an object: 
            {
              "raw_text_block": "Deeply summarized English description of all land entries including Village, Survey No, Area, and Purchase Cost",
              "parsed_entries": [{village, survey_no, area, unit, purchase_cost, current_market_value}]
            }

        ### CRITICAL RULES:
        - **UNIVERSAL TRANSLATION**: Translate ALL Tamil text (names, villages, parties) to English.
        - **NUMERIC PRECISION**: Do NOT round or approximate monetary values. Use exact figures from the PDF.
        - **THINK STEP-BY-STEP**: Analyze the table headers and row labels in Sections 7 and 8 carefully before outputting.
        - **NULL HANDLING**: Use null for missing text and 0 for missing numeric values.
        """
        # Note for Land Assets: parsed_entries must be populated if data exists. raw_text_block must be translated to English.
        # Note: raw_text_block in land_assets should follow format: [number]) [village] Village: Survey No: [numbers], [value] [unit], Cost of Purchase: [value].

        logger.info("Sending request to Gemini (via google-genai)...")
        response = self.client.models.generate_content(
            model=self.model_id,
            contents=[file, prompt],
            config={
                'temperature': 0.1,
                'response_mime_type': 'application/json',
                'max_output_tokens': 8192
            }
        )
        
        try:
            json_text = response.text.strip()
            # Use json_repair to handle malformed JSON
            data = json_repair.loads(json_text)
            
            # Unwrapping logic: if Gemini/json-repair returns a list containing a dict, use the dict
            if isinstance(data, list) and len(data) > 0 and isinstance(data[0], dict):
                return data[0]
            
            return data if isinstance(data, dict) else {"error": "Invalid structure", "raw": json_text}
            
        except Exception as e:
            logger.error(f"Failed to parse Gemini response: {e}")
            logger.error(f"Full raw response for debugging:\n{response.text}")
            return {"error": str(e), "raw_response": response.text}

    def process_land_data(self, raw_land_text: Any) -> Dict[str, Any]:
        """Uses local land_parser to normalize land data according to rules."""
        if not raw_land_text:
            return {"entries": [], "total": {"acres": 0.0, "cents": 0.0, "total_purchase_cost": 0.0}}
        
        # Robust type handling: ensure we pass a string to parse_land_data
        if isinstance(raw_land_text, (dict, list)):
            raw_land_text = str(raw_land_text)
            
        return parse_land_data(raw_land_text)

    def run(self, pdf_path: str, output_path: str = None, candidate_info: Dict[str, Any] = None) -> Dict[str, Any]:
        """Orchestrates the extraction process. Returns the extracted data."""
        try:
            file = self.upload_pdf(pdf_path)
            raw_data = self.extract_data(file)
            
            # Safety check: if raw_data is not a dict, mapping will fail
            if not isinstance(raw_data, dict):
                logger.error(f"Expected dict from Gemini, got {type(raw_data)}. Raw: {raw_data}")
                raise ValueError(f"Gemini returned invalid data structure: {type(raw_data)}")
            
            # Helper to sum up categorized numeric assets for top-level fields
            def get_grand_total(data: Any) -> float:
                if isinstance(data, (int, float)):
                    return float(data)
                if isinstance(data, dict):
                    total = 0.0
                    for val in data.values():
                        if isinstance(val, (int, float)):
                            total += val
                        elif isinstance(val, list): # Handle dependent lists if Gemini returns them
                            for subval in val:
                                if isinstance(subval, (int, float)):
                                    total += subval
                    return total
                return 0.0

            # Post-process land data (Handling dual format from Gemini)
            land_assets = {}
            raw_land_map = raw_data.get("land_assets", {})
            
            # Normalize: If Gemini returned a flat structure (missing owner key), wrap it in 'self'
            if isinstance(raw_land_map, dict):
                if "raw_text_block" in raw_land_map or "parsed_entries" in raw_land_map:
                    raw_land_map = {"self": raw_land_map}
                
                for owner, data in raw_land_map.items():
                    if isinstance(data, dict):
                        raw_text = data.get("raw_text_block", "")
                        gemini_json = data.get("parsed_entries", [])
                        
                        if raw_text:
                            parsed = self.process_land_data(raw_text)
                            parsed["gemini_extracted"] = gemini_json
                            land_assets[owner] = parsed
                        elif gemini_json:
                            # Fallback if raw_text is missing but JSON exists
                            land_assets[owner] = {
                                "full_text": "extracted from gemini json",
                                "entries": gemini_json,
                                "gemini_extracted": gemini_json,
                                "total": {"calculated": {"acres": 0, "cents": 0}, "total_purchase_cost": 0}
                            }
                    elif isinstance(data, str):
                        # Backward compatibility if Gemini only returns a string
                        parsed = self.process_land_data(data)
                        parsed["gemini_extracted"] = []
                        land_assets[owner] = parsed
            
            # Extract detailed gold/silver assets correctly
            def map_precious_metal(metal_data: Any) -> Dict[str, Any]:
                if not isinstance(metal_data, dict):
                    return metal_data
                result = {}
                for owner, info in metal_data.items():
                    if isinstance(info, dict):
                        result[owner] = {
                            "weight": info.get("weight_grms", 0),
                            "weight_grms": info.get("weight_grms", 0),
                            "value": info.get("value", 0)
                        }
                    else:
                        result[owner] = info
                return result

            # Final structure mapping to DB schema
            # Fall back to candidate_info (the existing record) if Gemini didn't return these fields
            if not candidate_info:
                candidate_info = {}
                
            final_data = {
                "candidate_name": raw_data.get("candidate_name") or candidate_info.get("name"),
                "age": raw_data.get("age") or candidate_info.get("age"),
                "father_name": raw_data.get("father_name") or candidate_info.get("Father's / Husband's Name"),
                "address": raw_data.get("address") or candidate_info.get("address"),
                "pan_number": raw_data.get("pan_number"),
                "education": raw_data.get("education"),
                "profession": raw_data.get("profession"),
                "party_name": raw_data.get("party_name") or candidate_info.get("party_name"),
                "constituency_name": raw_data.get("constituency_name") or candidate_info.get("constituency"),
                "voter_details": raw_data.get("voter_details"),
                "contact_details": raw_data.get("contact_details"),
                "total_assets": get_grand_total(raw_data.get("total_assets", 0)),
                "total_liabilities": get_grand_total(raw_data.get("total_liabilities", 0)),
                "total_assets_details": raw_data.get("total_assets"),
                "total_liabilities_details": raw_data.get("total_liabilities"),
                "criminal_cases": raw_data.get("criminal_cases_count", 0),
                "income_itr": raw_data.get("income_tax_details"),
                "itr_history": raw_data.get("itr_history"),
                "vehicle_assets": raw_data.get("vehicle_assets"),
                "gold_assets": map_precious_metal(raw_data.get("gold_details")),
                "silver_assets": map_precious_metal(raw_data.get("silver_details")),
                "land_assets": land_assets
            }

            # Save to file if output_path provided
            if output_path:
                os.makedirs(os.path.dirname(output_path), exist_ok=True)
                with open(output_path, 'w', encoding='utf-8') as f:
                    json.dump(final_data, f, indent=2, ensure_ascii=False)
                logger.info(f"Extraction complete. Data saved to {output_path}")
            
            return final_data

        except Exception as e:
            logger.error(f"Extraction workflow failed: {e}")
            raise

if __name__ == "__main__":
    from dotenv import load_dotenv
    # Loading new key from .env.local
    load_dotenv(dotenv_path=".env.local")
    #ptsn - AIzaSyAWyaQlLwajtuyZIHJwQQ78HYfLJHpoq5s
    #ptsn1 - AIzaSyDhDmtVkNG0O6nHdC9y8XpZOwAX_2lEI4A
    #krishaa - AIzaSyCUP-kQRftEP_B9ZKj19HwH6l54mbBHH-U
    # api_key = os.environ.get("GOOGLE_GEMINI_API_KEY", "AIzaSyDhDmtVkNG0O6nHdC9y8XpZOwAX_2lEI4A")
    
    pdf_file = "/Users/ideas2it/Projects/personal/knowyourmla/scraper/assets/2026/affidavits/Constituency__MANACHANALLUR_KATHIRAVAN._S_Affidavit-1775838543.pdf"
    output_file = "/Users/ideas2it/Projects/personal/knowyourmla/scraper/assets/2026/extracted/Constituency__MANACHANALLUR_KATHIRAVAN._S_Extracted.json"
    
    # extractor = AffidavitExtractor(api_key)
    # extractor.run(pdf_file, output_file)
