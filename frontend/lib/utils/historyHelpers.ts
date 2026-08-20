export function inferGovernmentAndCabinet(startDate: string, gov: string, cab: string) {
  let government = (gov || '').trim();
  let cabinet = (cab || '').trim();
  
  const govLower = government.toLowerCase();
  if (govLower === 'unknown assembly' || govLower === 'unknown' || !government) {
    if (startDate && startDate.length >= 4) {
      const year = parseInt(startDate.substring(0, 4), 10);
      if (year >= 2021) {
        government = "16th Assembly";
        cabinet = "M.K. Stalin Cabinet";
      } else if (year >= 2016) {
        government = "15th Assembly";
        if (startDate >= "2017-02-16") {
          cabinet = "Edappadi K. Palaniswami Cabinet";
        } else if (startDate >= "2016-12-06") {
          cabinet = "O. Panneerselvam Cabinet";
        } else {
          cabinet = "J. Jayalalithaa Cabinet";
        }
      } else if (year >= 2011) {
        government = "14th Assembly";
        if (startDate >= "2014-09-29" && startDate <= "2015-05-22") {
          cabinet = "O. Panneerselvam Cabinet";
        } else {
          cabinet = "J. Jayalalithaa Cabinet";
        }
      } else if (year >= 2006) {
        government = "13th Assembly";
        cabinet = "M. Karunanidhi Cabinet";
      } else {
        government = "Unknown Assembly";
      }
    } else {
      government = "Unknown Assembly";
    }
  }

  return { government, cabinet };
}

export function formatPortfolioName(name: string): string {
  // basic mappings for normalized names
  const mappings: Record<string, string> = {
    "publicworks": "Public Works",
    "youthwelfare": "Youth Welfare",
    "sportsdevelopment": "Sports Development",
    "waterresources": "Water Resources",
    "municipaladministration": "Municipal Administration",
    "ruraldevelopment": "Rural Development",
    "highereducation": "Higher Education",
    "schooleducation": "School Education",
    "commercialtaxes": "Commercial Taxes",
    "registration": "Registration",
    "informationtechnology": "Information Technology",
    "transport": "Transport",
    "socialwelfare": "Social Welfare",
    "womenempowerment": "Women Empowerment",
    "hindureligious": "Hindu Religious & Charitable Endowments",
    "msme": "Micro, Small and Medium Enterprises",
    "animalhusbandry": "Animal Husbandry",
    "dairydevelopment": "Dairy Development",
    "backwardclasses": "Backward Classes Welfare",
    "mostbackwardclasses": "Most Backward Classes Welfare",
    "adiDravidar": "Adi Dravidar Welfare",
    "tribalwelfare": "Tribal Welfare",
    "handlooms": "Handlooms and Textiles",
    "medicalandfamilywelfare": "Medical and Family Welfare",
    "health": "Health",
    "agriculture": "Agriculture",
    "farmerswelfare": "Farmers Welfare",
    "cooperation": "Co-operation",
    "foodandcivilsupplies": "Food and Civil Supplies",
    "law": "Law",
    "housing": "Housing and Urban Development",
    "environment": "Environment",
    "climatechange": "Climate Change",
    "forests": "Forests",
    "laborwelfare": "Labor Welfare",
    "skilldevelopment": "Skill Development",
    "tourism": "Tourism",
    "artandculture": "Art and Culture",
    "finance": "Finance",
    "humanresourcesmanagement": "Human Resources Management",
    "energy": "Energy",
    "prohibition": "Prohibition and Excise"
  };
  
  if (mappings[name.toLowerCase()]) {
    return mappings[name.toLowerCase()];
  }
  
  // generic fallback: split pascal case or just capitalize
  let formatted = name.replace(/([A-Z])/g, ' $1').trim();
  if (formatted === name) {
    // If it's all lowercase, try to find boundaries or just capitalize
    formatted = name.replace(/\b\w/g, l => l.toUpperCase());
  }
  
  return formatted;
}
