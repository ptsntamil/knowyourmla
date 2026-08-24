export function categorizeVehicle(name: string): "2-Wheeler" | "4-Wheeler" | "Heavy/Commercial" | "Others" {
  const lowerName = name.toLowerCase();
  
  if (lowerName.match(/(car|jeep|suv|innova|scorpio|fortuner|bolero|swift|creta|audi|bmw|benz|honda city|xuv|safari|alto|maruti|hyundai|toyota|kia|mahindra|tata)/)) {
    return "4-Wheeler";
  }
  
  if (lowerName.match(/(bike|scooter|motorcycle|tvs|bullet|splendor|activa|honda|bajaj|yamaha|royal enfield|pulsar|dio|jupiter|apache)/)) {
    return "2-Wheeler";
  }
  
  if (lowerName.match(/(tractor|lorry|truck|jcb|bus|crane|dumper)/)) {
    return "Heavy/Commercial";
  }
  
  return "Others";
}

export function extractVehicles(mla: any) {
  const assets = mla.vehicle_assets || {};
  let allVehicles: any[] = [];
  
  ['self', 'spouse', 'dependent1', 'dependent2', 'dependent3'].forEach(owner => {
    if (assets[owner] && Array.isArray(assets[owner])) {
      const ownerVehicles = assets[owner].map((v: any) => ({
        ...v,
        ownerType: owner,
        category: categorizeVehicle(v.name || v.raw_text || "")
      }));
      allVehicles = [...allVehicles, ...ownerVehicles];
    }
  });
  
  return allVehicles;
}
