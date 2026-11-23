/**
 * Mapping of Tamil Nadu Assembly Constituency slugs to AC numbers (1-234).
 * Used to locate ECI polling station assets (AC001, AC052, etc.).
 */
export const TN_SLUG_TO_AC_NO: Record<string, number> = {
  "gummidipoondi": 1, // Gummidipoondi
  "ponneri": 2, // Ponneri
  "tiruttani": 3, // Tiruttani
  "thiruvallur": 4, // Thiruvallur
  "poonamallee": 5, // Poonamallee
  "avadi": 6, // Avadi
  "maduravoyal": 7, // Maduravoyal
  "ambattur": 8, // Ambattur
  "madavaram": 9, // Madavaram
  "thiruvottiyur": 10, // Thiruvottiyur
  "dr-radhakrishnan-nagar": 11, // Dr.Radhakrishnan Nagar
  "perambur": 12, // Perambur
  "kolathur": 13, // Kolathur
  "villivakkam": 14, // Villivakkam
  "thiru-vi-ka-nagar": 15, // Thiru-Vi-Ka-Nagar
  "egmore": 16, // Egmore
  "royapuram": 17, // Royapuram
  "harbour": 18, // Harbour
  "chepauk-thiruvallikeni": 19, // Chepauk-Thiruvallikeni
  "thousand-lights": 20, // Thousand Lights
  "anna-nagar": 21, // Anna Nagar
  "virugampakkam": 22, // Virugampakkam
  "saidapet": 23, // Saidapet
  "thiyagarayanagar": 24, // Thiyagarayanagar
  "mylapore": 25, // Mylapore
  "velachery": 26, // Velachery
  "shozhinganallur": 27, // Shozhinganallur
  "alandur": 28, // Alandur
  "sriperumbudur": 29, // Sriperumbudur
  "pallavaram": 30, // Pallavaram
  "tambaram": 31, // Tambaram
  "chengalpattu": 32, // Chengalpattu
  "thiruporur": 33, // Thiruporur
  "cheyyur": 34, // Cheyyur
  "madurantakam": 35, // Madurantakam
  "uthiramerur": 36, // Uthiramerur
  "kancheepuram": 37, // Kancheepuram
  "arakkonam": 38, // Arakkonam
  "sholingur": 39, // Sholingur
  "katpadi": 40, // Katpadi
  "ranipet": 41, // Ranipet
  "arcot": 42, // Arcot
  "vellore": 43, // Vellore
  "anaikattu": 44, // Anaikattu
  "kilvaithinankuppam": 45, // Kilvaithinankuppam
  "gudiyattam": 46, // Gudiyattam
  "vaniyambadi": 47, // Vaniyambadi
  "ambur": 48, // Ambur
  "jolarpet": 49, // Jolarpet
  "tiruppattur": 50, // Tiruppattur
  "uthangarai": 51, // Uthangarai
  "bargur": 52, // Bargur
  "krishnagiri": 53, // Krishnagiri
  "veppanahalli": 54, // Veppanahalli
  "hosur": 55, // Hosur
  "thalli": 56, // Thalli
  "palacodu": 57, // Palacodu
  "pennagaram": 58, // Pennagaram
  "dharmapuri": 59, // Dharmapuri
  "pappireddipatti": 60, // Pappireddipatti
  "harur": 61, // Harur
  "chengam": 62, // Chengam
  "tiruvannamalai": 63, // Tiruvannamalai
  "kilpennathur": 64, // Kilpennathur
  "kalasapakkam": 65, // Kalasapakkam
  "polur": 66, // Polur
  "arani": 67, // Arani
  "cheyyar": 68, // Cheyyar
  "vandavasi": 69, // Vandavasi
  "gingee": 70, // Gingee
  "mailam": 71, // Mailam
  "tindivanam": 72, // Tindivanam
  "vanur": 73, // Vanur
  "viluppuram": 74, // Viluppuram
  "vikravandi": 75, // Vikravandi
  "tirukkoyilur": 76, // Tirukkoyilur
  "ulundurpettai": 77, // Ulundurpettai
  "rishivandiyam": 78, // Rishivandiyam
  "sankarapuram": 79, // Sankarapuram
  "kallakurichi": 80, // Kallakurichi
  "gangavalli": 81, // Gangavalli
  "attur": 82, // Attur
  "yercaud": 83, // Yercaud
  "omalur": 84, // Omalur
  "mettur": 85, // Mettur
  "edappadi": 86, // Edappadi
  "sankari": 87, // Sankari
  "salem-west": 88, // Salem (West)
  "salem-north": 89, // Salem (North)
  "salem-south": 90, // Salem (South)
  "veerapandi": 91, // Veerapandi
  "rasipuram": 92, // Rasipuram
  "senthamangalam": 93, // Senthamangalam
  "namakkal": 94, // Namakkal
  "paramathi-velur": 95, // Paramathi-Velur
  "tiruchengodu": 96, // Tiruchengodu
  "kumarapalayam": 97, // Kumarapalayam
  "erode-east": 98, // Erode (East)
  "erode-west": 99, // Erode (West)
  "modakkurichi": 100, // Modakkurichi
  "dharapuram": 101, // Dharapuram
  "kangayam": 102, // Kangayam
  "perundurai": 103, // Perundurai
  "bhavani": 104, // Bhavani
  "anthiyur": 105, // Anthiyur
  "gobichettipalayam": 106, // Gobichettipalayam
  "bhavanisagar": 107, // Bhavanisagar
  "udhagamandalam": 108, // Udhagamandalam
  "gudalur": 109, // Gudalur
  "coonoor": 110, // Coonoor
  "mettuppalayam": 111, // Mettuppalayam
  "avanashi": 112, // Avanashi
  "tiruppur-north": 113, // Tiruppur (North)
  "tiruppur-south": 114, // Tiruppur (South)
  "palladam": 115, // Palladam
  "sulur": 116, // Sulur
  "kavundampalayam": 117, // Kavundampalayam
  "coimbatore-north": 118, // Coimbatore (North)
  "thondamuthur": 119, // Thondamuthur
  "coimbatore-south": 120, // Coimbatore (South)
  "singanallur": 121, // Singanallur
  "kinathukadavu": 122, // Kinathukadavu
  "pollachi": 123, // Pollachi
  "valparai": 124, // Valparai
  "udumalaipettai": 125, // Udumalaipettai
  "madathukulam": 126, // Madathukulam
  "palani": 127, // Palani
  "oddanchatram": 128, // Oddanchatram
  "athoor": 129, // Athoor
  "nilakkottai": 130, // Nilakkottai
  "natham": 131, // Natham
  "dindigul": 132, // Dindigul
  "vedasandur": 133, // Vedasandur
  "aravakurichi": 134, // Aravakurichi
  "karur": 135, // Karur
  "krishnarayapuram": 136, // Krishnarayapuram
  "kulithalai": 137, // Kulithalai
  "manapparai": 138, // Manapparai
  "srirangam": 139, // Srirangam
  "tiruchirappalli-west": 140, // Tiruchirappalli (West)
  "tiruchirappalli-east": 141, // Tiruchirappalli (East)
  "thiruverumbur": 142, // Thiruverumbur
  "lalgudi": 143, // Lalgudi
  "manachanallur": 144, // Manachanallur
  "musiri": 145, // Musiri
  "thuraiyur": 146, // Thuraiyur
  "perambalur": 147, // Perambalur
  "kunnam": 148, // Kunnam
  "ariyalur": 149, // Ariyalur
  "jayankondam": 150, // Jayankondam
  "tittakudi": 151, // Tittakudi
  "vriddhachalam": 152, // Vriddhachalam
  "neyveli": 153, // Neyveli
  "panruti": 154, // Panruti
  "cuddalore": 155, // Cuddalore
  "kurinjipadi": 156, // Kurinjipadi
  "bhuvanagiri": 157, // Bhuvanagiri
  "chidambaram": 158, // Chidambaram
  "kattumannarkoil": 159, // Kattumannarkoil
  "sirkazhi": 160, // Sirkazhi
  "mayiladuthurai": 161, // Mayiladuthurai
  "poompuhar": 162, // Poompuhar
  "nagapattinam": 163, // Nagapattinam
  "kilvelur": 164, // Kilvelur
  "vedaranyam": 165, // Vedaranyam
  "thiruthuraipoondi": 166, // Thiruthuraipoondi
  "mannargudi": 167, // Mannargudi
  "thiruvarur": 168, // Thiruvarur
  "nannilam": 169, // Nannilam
  "thiruvidaimarudur": 170, // Thiruvidaimarudur
  "kumbakonam": 171, // Kumbakonam
  "papanasam": 172, // Papanasam
  "thiruvaiyaru": 173, // Thiruvaiyaru
  "thanjavur": 174, // Thanjavur
  "orathanadu": 175, // Orathanadu
  "pattukkottai": 176, // Pattukkottai
  "peravurani": 177, // Peravurani
  "gandharvakottai": 178, // Gandharvakottai
  "viralimalai": 179, // Viralimalai
  "pudukkottai": 180, // Pudukkottai
  "thirumayam": 181, // Thirumayam
  "alangudi": 182, // Alangudi
  "aranthangi": 183, // Aranthangi
  "karaikudi": 184, // Karaikudi
  "tiruppattur-185": 185, // Tiruppattur
  "sivaganga": 186, // Sivaganga
  "manamadurai": 187, // Manamadurai
  "melur": 188, // Melur
  "madurai-east": 189, // Madurai East
  "sholavandan": 190, // Sholavandan
  "madurai-north": 191, // Madurai North
  "madurai-south": 192, // Madurai South
  "madurai-central": 193, // Madurai Central
  "madurai-west": 194, // Madurai West
  "thiruparankundram": 195, // Thiruparankundram
  "thirumangalam": 196, // Thirumangalam
  "usilampatti": 197, // Usilampatti
  "andipatti": 198, // Andipatti
  "periyakulam": 199, // Periyakulam
  "bodinayakanur": 200, // Bodinayakanur
  "cumbum": 201, // Cumbum
  "rajapalayam": 202, // Rajapalayam
  "srivilliputhur": 203, // Srivilliputhur
  "sattur": 204, // Sattur
  "sivakasi": 205, // Sivakasi
  "virudhunagar": 206, // Virudhunagar
  "aruppukkottai": 207, // Aruppukkottai
  "tiruchuli": 208, // Tiruchuli
  "paramakudi": 209, // Paramakudi
  "tiruvadanai": 210, // Tiruvadanai
  "ramanathapuram": 211, // Ramanathapuram
  "mudhukulathur": 212, // Mudhukulathur
  "vilathikulam": 213, // Vilathikulam
  "thoothukkudi": 214, // Thoothukkudi
  "tiruchendur": 215, // Tiruchendur
  "srivaikuntam": 216, // Srivaikuntam
  "ottapidaram": 217, // Ottapidaram
  "kovilpatti": 218, // Kovilpatti
  "sankarankovil": 219, // Sankarankovil
  "vasudevanallur": 220, // Vasudevanallur
  "kadayanallur": 221, // Kadayanallur
  "tenkasi": 222, // Tenkasi
  "alangulam": 223, // Alangulam
  "tirunelveli": 224, // Tirunelveli
  "ambasamudram": 225, // Ambasamudram
  "palayamkottai": 226, // Palayamkottai
  "nanguneri": 227, // Nanguneri
  "radhapuram": 228, // Radhapuram
  "kanniyakumari": 229, // Kanniyakumari
  "nagercoil": 230, // Nagercoil
  "colachal": 231, // Colachal
  "padmanabhapuram": 232, // Padmanabhapuram
  "vilavancode": 233, // Vilavancode
  "killiyoor": 234, // Killiyoor
};

/**
 * Resolves AC number from constituency slug or ID.
 * e.g. "bargur" -> 52, "CONSTITUENCY#bargur" -> 52
 */
export function getAcNoFromSlug(slugOrId: string): number | null {
  if (!slugOrId) return null;
  const clean = slugOrId.replace(/^CONSTITUENCY#/i, "").toLowerCase().trim();
  if (TN_SLUG_TO_AC_NO[clean]) return TN_SLUG_TO_AC_NO[clean];
  // Try match with hyphens removed
  const noHyphen = clean.replace(/-/g, "");
  for (const [k, v] of Object.entries(TN_SLUG_TO_AC_NO)) {
    if (k.replace(/-/g, "") === noHyphen) return v;
  }
  return null;
}
