import os
import sys
import boto3
from boto3.dynamodb.conditions import Key
import re


dynamodb = boto3.resource('dynamodb', region_name='ap-south-2')
persons_table = dynamodb.Table('knowyourmla_persons')
districts_table = dynamodb.Table('knowyourmla_districts')

overrides = {
    'aadhavarjuna': 'PERSON#aadhavarjuna_rajendran',
    'nanand': 'PERSON#anandn_narayanasamy',
    'mariawilson': 'PERSON#UNKNOWN_mariawilson',
    'pvenkatraman': 'PERSON#UNKNOWN_pvenkataramanan',
    'vanniarasu': 'PERSON#24c12f8c3d4a78a3a6370c4da630ae92',
    'kasengotaiyan': 'PERSON#UNKNOWN_kasengottaiyan',
    'skirthana': 'PERSON#UNKNOWN_skeerthana',
    'kgarunraj': 'PERSON#arunrajkg_ganesankp',
    'vishwanath': 'PERSON#UNKNOWN_pviswanathan',
    'srajeshkumar': 'PERSON#e2b083ad4b0e41423f2ce5c04ba01e45',
    'rnirmalkumar': 'PERSON#nirmalkumarr_raja',
    'rajmohan': 'PERSON#rajmohan_arumugam',
    'rkumar': 'PERSON#752b75a238a75c162075b24b6b59330f',
    'kthennarasu': 'PERSON#thennarasuk_kanniyappan',
    'rvranjitkumar': 'PERSON#UNKNOWN_rvranjithkumar',
    'tsarathkumar': 'PERSON#UNKNOWN_tsarathkumar',
    'vgandhiraj': 'PERSON#vgandhiraj_vadivel',
    'vinoth': 'PERSON#anot_2',
    'ramesh': 'PERSON#ramesh_srinivasan',
    'cvijayalakshmi': 'PERSON#cvijayalakshmi_balaraman',
    'tlokeshtamilselvan': 'PERSON#logeshtamilselvand_dhanabal',
    'kamali': 'PERSON#UNKNOWN_skamali',
    'mvijaybalaji': 'PERSON#mvijaybalaji_mathialagan',
    'vsampathkumar': 'PERSON#vsampathkumar_mvelayutham',
    'jmohamedfarvez': 'PERSON#UNKNOWN_jmohamedfarvas',
    'tkprabhu': 'PERSON#drprabhutk_thuraikarunanidhi',
    'kjagedeeswari': 'PERSON#jegadeshwarik_kumaravel',
    'srinath': 'PERSON#srinath_alnath',
    'madanraja': 'PERSON#UNKNOWN_madanraja',
    'vijaytamilanparthiban': 'PERSON#UNKNOWN_avijaytamilanparthiban',
    'rajiv': 'PERSON#UNKNOWN_vkrajeev',
    'kvignesh': 'PERSON#vigneshk_kathirvelpandian'
}

data = """
Chennai and Tiruvannamalai districts -Aadhav Arjuna
Villupuram and Cuddalore - N Anand
Tirunelveli - Maria Wilson
Mayiladuthurai - P Venkatraman
Kallakurichi - Vanni Arasu
Erode - K A Sengotaiyan
Krishnagiri - S Kirthana 
Tiruppur - K G Arunraj 
Tiruvarur - Vishwanath
Kanyakumari - S Rajesh Kumar 
Madurai and Theni - R Nirmal Kumar
Perambalur – Rajmohan
Tiruvallur – R Kumar
Kanchipuram – K Thennarasu
Tirupattur – R V Ranjitkumar
Chengalpattu – T Sarathkumar
Ranipet – V Gandhiraj
Thanjavur – Vinoth
Trichy – Ramesh
Karur – C Vijayalakshmi
Namakkal – T Lokesh Tamil Selvan
Niligiris – Kamali
Vellore – M Vijay Balaji
Coimbatore – V Sampathkumar
Pudukkottai – J Mohamed farvez
Sivaganga – T K Prabhu
Virudhunagar – K Jagedeeswari
Thoothukudi – Srinath
Ramanathapuram – Madan Raja
Salem – Vijay Tamilan Parthiban
Tenkasi – Rajiv  
Dindigul - K Vignesh
"""

def normalize_name(name):
    name = re.sub(r'^(dr|mr|mrs|ms|thiru|tmt|selvi)\.?\s+', '', name, flags=re.IGNORECASE)
    name = re.sub(r'[^a-zA-Z0-9]', '', name).lower()
    return name

lines = [l.strip() for l in data.strip().split('\n') if l.strip()]

for line in lines:
    line = line.replace('–', '-').strip(', ')
    if '-' in line:
        parts = line.split('-')
        district_part = parts[0].strip()
        person_name = parts[1].strip()
    else:
        parts = line.split(' ')
        district_part = parts[0].strip()
        person_name = ' '.join(parts[1:]).strip()
    
    # Process districts (some are "Chennai and Tiruvannamalai districts")
    district_part = district_part.replace(' districts', '').replace(' district', '')
    districts = [d.strip() for d in district_part.split(' and ')]
    
    norm = normalize_name(person_name)
    person_id = overrides.get(norm)
    
    if not person_id:
        print(f"ERROR: No override for {person_name} ({norm})")
        continue

    rep_obj = {
        'name': person_name,
        'person_id': person_id
    }

    for d in districts:
        d_norm = normalize_name(d)
        
        # Mappings of the incorrect spelling to the correct PK string
        CORRECTIONS = {
            'kanchipuram': 'kancheepuram',
            'tiruvallur': 'thiruvallur',
            'tiruvarur': 'thiruvarur',
            'kanyakumari': 'kanniyakumari',
            'trichy': 'tiruchirappalli',
            'villupuram': 'villuppuram',
            'tirupattur': 'tirupathur',
            'niligiris': 'thenilgiris',
            'nilgiris': 'thenilgiris'
        }
        
        if d_norm in CORRECTIONS:
            d_norm = CORRECTIONS[d_norm]
        
        # update district
        pk = f"DISTRICT#{d_norm}"
        
        try:
            districts_table.update_item(
                Key={'PK': pk, 'SK': 'METADATA'},
                UpdateExpression="SET representatives = list_append(if_not_exists(representatives, :empty_list), :rep)",
                ExpressionAttributeValues={
                    ':rep': [rep_obj],
                    ':empty_list': []
                }
            )
            print(f"Updated {d} ({pk}) with representative {person_name}")
        except Exception as e:
            print(f"Failed to update {d}: {e}")

print("Done")
