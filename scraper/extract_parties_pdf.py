import pytesseract
from pdf2image import convert_from_path
import pandas as pd
import os
import re
from PIL import Image

def extract_party_data_ocr(pdf_path):
    print(f"Converting {pdf_path} to images...")
    images = convert_from_path(pdf_path, first_page=5, dpi=300)
    
    all_parties = []
    
    for i, image in enumerate(images):
        page_num = i + 5
        print(f"Processing Page {page_num}...")
        
        # Get data with coordinates
        data = pytesseract.image_to_data(image, lang='eng+tam', output_type=pytesseract.Output.DICT)
        
        # Table column approximate boundaries (based on 300 DPI)
        # We can refine these by looking at the data
        # Typical boundaries: 
        # Col 0: 0-300 (Sl No)
        # Col 1: 300-1100 (Name)
        # Col 2: 1100-1700 (Symbol)
        # Col 3: 1700-end (Address)
        
        rows = {}
        for j in range(len(data['text'])):
            text = data['text'][j].strip()
            if not text:
                continue
                
            y = data['top'][j] // 30  # Increased grouping threshold
            x = data['left'][j]
            
            if y not in rows:
                rows[y] = []
            rows[y].append((x, text))
            
        sorted_y = sorted(rows.keys())
        
        current_party = None
        
        for y in sorted_y:
            row_items = sorted(rows[y])
            
            name_parts = []
            symbol_parts = []
            address_parts = []
            sl_no = ""
            
            for x, text in row_items:
                if x < 250: # Sl No
                    if re.match(r'^\d+\.?$', text):
                        sl_no = text.strip('.')
                    else:
                        name_parts.append(text)
                elif x < 1000: # Name
                    name_parts.append(text)
                elif x < 1600: # Symbol
                    symbol_parts.append(text)
                else: # Address
                    address_parts.append(text)
            
            # If we find a new Sl No, start a new party
            if sl_no:
                if current_party:
                    all_parties.append(current_party)
                current_party = {
                    "sl_no": sl_no,
                    "name": " ".join(name_parts),
                    "symbol": " ".join(symbol_parts),
                    "address": " ".join(address_parts),
                    "page": page_num
                }
            elif current_party:
                # Continuation of previous party
                if name_parts: current_party["name"] += " " + " ".join(name_parts)
                if symbol_parts: current_party["symbol"] += " " + " ".join(symbol_parts)
                if address_parts: current_party["address"] += " " + " ".join(address_parts)
            else:
                # No Sl No yet, maybe header or noise
                pass
                
        if current_party:
            all_parties.append(current_party)
            
    return pd.DataFrame(all_parties)

if __name__ == "__main__":
    # Path relative to the script location
    script_dir = os.path.dirname(os.path.abspath(__file__))
    pdf_path = os.path.join(script_dir, "assets", "SO0012-2025.pdf")
    
    if not os.path.exists(pdf_path):
        print(f"Error: PDF not found at {pdf_path}")
    else:
        df = extract_party_data_ocr(pdf_path)
        output_path = "ocr_parties_final.csv"
        df.to_csv(output_path, index=False)
        print(f"Successfully extracted {len(df)} entries to {output_path}")