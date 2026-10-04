import os
import time
import json
import logging
from google import genai
from google.genai import types

# Import the land parser correctly
from land_parser import parse_land_data

logger = logging.getLogger(__name__)

class AffidavitExtractor:
    def __init__(self, api_key: str):
        # Initialize the new Google GenAI client
        self.client = genai.Client(api_key=api_key)
        # Reverting to 3.8-flash since pro is not supported. The batch script's backoff logic will handle any high demand.
        self.model_name = "gemini-3.5-flash"
        
    def process_land_data(self, text_or_dict):
        """
        Parses raw land text into structured JSON.
        Handles regression where raw text might accidentally be a dict.
        """
        if isinstance(text_or_dict, dict):
            if "self" in text_or_dict:
                text_or_dict = str(text_or_dict["self"])
            else:
                text_or_dict = json.dumps(text_or_dict)
                
        if not text_or_dict:
            return {"entries": [], "total": {"acres": 0.0, "cents": 0.0}}
            
        # Pass to the production-grade land data extraction engine
        return parse_land_data(str(text_or_dict))
        
    def upload_pdf(self, file_path: str):
        """Uploads the PDF to the Gemini File API."""
        logger.info(f"Uploading {file_path} to Gemini...")
        return self.client.files.upload(file=file_path)
        
    def run(self, pdf_path: str, candidate_info: dict = None) -> dict:
        """Main extraction pipeline for a single PDF."""
        uploaded_file = self.upload_pdf(pdf_path)
        
        # Wait for file processing if needed
        while uploaded_file.state.name == "PROCESSING":
            logger.info("Waiting for PDF to be processed by Gemini...")
            time.sleep(2)
            uploaded_file = self.client.files.get(name=uploaded_file.name)
            
        prompt = """
        You are an expert at extracting structured information from Indian election affidavit PDFs (Form 26).
        IMPORTANT: If the document is in Tamil, translate all extracted content to English.
        
        Extract the following information:
        - candidate_name: Name of the candidate.
        - age: Age of the candidate (string or integer).
        - father_name: Father's/Husband's name.
        - address: Full residential address.
        - pan_number: PAN card number (if provided, otherwise null).
        - education: List of educational qualifications, with year and institution.
        - profession: List of professions/occupations for the candidate.
        - party_name: Political party affiliation.
        - constituency_name: Name of the constituency.
        - voter_details: Electoral roll details (constituency name, serial number, part number).
        - contact_details: Email and social media handles (Facebook, Twitter/X, Instagram).
        - total_assets: Total value of all assets (float) as explicitly declared.
        - total_liabilities: Total value of all liabilities (float) as explicitly declared.
        - total_assets_details: Total assets broken down by self, spouse, and dependents as explicitly declared.
        - total_liabilities_details: Total liabilities broken down by self, spouse, and dependents as explicitly declared.
        - asset_breakup: Detailed breakdown of asset categories for self, spouse, and dependents. Extract:
          - cash_in_hand: Exact amount of cash in hand.
          - bank_deposits: Total value of deposits in banks and financial institutions.
          - total_movable_assets: The declared Gross Total Value of all movable assets.
          - total_immovable_assets: The declared Approximate Current Market Price of all immovable assets.
        - criminal_cases: Number of pending criminal cases (integer).
        - income_itr: Most recent income declared in ITR for self, spouse, and dependents.
        - itr_history: Income tax return history for self, spouse, dependents grouped by year (e.g., "2023-2024": value).
        - gold_assets: Description, weight in grams, and value of gold/jewellery owned by self, spouse, and dependents.
        - silver_assets: Description, weight in grams, and value of silver owned by self, spouse, and dependents.
        - vehicle_assets: Details of motor vehicles, aircrafts, yachts owned by self, spouse, and dependents.
        - land_assets_raw: Raw text description of all land assets owned by the candidate (self). Include all village names, survey numbers, areas, and purchase costs exactly as written.
        - land_assets_gemini: Structured array of land assets owned by the candidate (self) including village, survey_no, area, unit, purchase_cost, and current_market_value.
        
        Return the data strictly in JSON format matching this schema:
        {
            "candidate_name": "string",
            "age": "string",
            "father_name": "string",
            "address": "string",
            "pan_number": "string",
            "education": [{"qualification": "string", "year": "string", "institution": "string"}],
            "profession": ["string"],
            "party_name": "string",
            "constituency_name": "string",
            "voter_details": {"constituency": "string", "serial_no": "string", "part_no": "string"},
            "contact_details": {"email": "string", "facebook": "string", "twitter_x": "string", "instagram": "string"},
            "total_assets": 0.0,
            "total_liabilities": 0.0,
            "total_assets_details": {"self": 0.0, "spouse": 0.0, "dependents": 0.0},
            "total_liabilities_details": {"self": 0.0, "spouse": 0.0, "dependents": 0.0},
            "asset_breakup": {
                "self": {"cash_in_hand": 0.0, "bank_deposits": 0.0, "total_movable_assets": 0.0, "total_immovable_assets": 0.0},
                "spouse": {"cash_in_hand": 0.0, "bank_deposits": 0.0, "total_movable_assets": 0.0, "total_immovable_assets": 0.0},
                "dependents": [{"cash_in_hand": 0.0, "bank_deposits": 0.0, "total_movable_assets": 0.0, "total_immovable_assets": 0.0}]
            },
            "criminal_cases": 0,
            "income_itr": {"self": "string", "spouse": "string", "dependents": "string"},
            "itr_history": {"self": {"YYYY-YYYY": 0}, "spouse": {}, "dependents": {}},
            "land_assets_raw": "string",
            "land_assets_gemini": [{"village": "string", "survey_no": "string", "area": 0.0, "unit": "string", "purchase_cost": 0.0, "current_market_value": 0.0}],
            "gold_assets": {
                "self": {"weight": 0.0, "weight_grms": 0.0, "value": 0.0},
                "spouse": {"weight": 0.0, "weight_grms": 0.0, "value": 0.0},
                "dependents": [{"weight": 0.0, "weight_grms": 0.0, "value": 0.0}]
            },
            "silver_assets": {
                "self": {"weight": 0.0, "weight_grms": 0.0, "value": 0.0},
                "spouse": {"weight": 0.0, "weight_grms": 0.0, "value": 0.0},
                "dependents": [{"weight": 0.0, "weight_grms": 0.0, "value": 0.0}]
            },
            "vehicle_assets": {
                "self": [{"name": "string", "registration_no": "string", "year_of_purchase": "string", "value": 0.0}],
                "spouse": [{"name": "string", "registration_no": "string", "year_of_purchase": "string", "value": 0.0}],
                "dependents": [{"name": "string", "registration_no": "string", "year_of_purchase": "string", "value": 0.0}]
            }
        }
        """
        
        logger.info("Prompting Gemini model...")
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=[uploaded_file, prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1
            )
        )
        
        try:
            extracted = json.loads(response.text)
        except Exception as e:
            logger.error(f"Failed to parse JSON response: {e}")
            extracted = {}
            
        # Clean up file immediately to manage quota
        try:
            self.client.files.delete(name=uploaded_file.name)
        except Exception as e:
            logger.warning(f"Failed to delete remote file: {e}")
            
        # Post-process land data using the project's strict parsing rules
        raw_land = extracted.pop("land_assets_raw", "")
        gemini_land = extracted.pop("land_assets_gemini", [])
        
        land_data = self.process_land_data(raw_land)
        land_data["gemini_extracted"] = gemini_land
        
        extracted["land_assets"] = {
            "self": land_data,
            "spouse": None,
            "dependents": None
        }
        
        # Ensure fields exist
        if "itr_history" not in extracted:
            extracted["itr_history"] = {}
            
        if candidate_info:
            extracted["candidate_name"] = candidate_info.get("name")
            
        return extracted
