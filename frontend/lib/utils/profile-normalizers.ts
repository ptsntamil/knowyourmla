export function normalizeProfileEducation(education: any): string | undefined {
  if (!education) return undefined;
  if (typeof education === "string") return education.trim() || undefined;

  if (Array.isArray(education)) {
    if (education.length === 0) return undefined;

    const hasStructuredEducation = education.some(
      (item) => item && typeof item === "object" && ("qualification" in item || "degree" in item)
    );
    if (hasStructuredEducation) {
      const sorted = [...education].sort((a: any, b: any) => Number(b?.year || 0) - Number(a?.year || 0));
      for (const item of sorted) {
        const normalized = normalizeProfileEducation(item);
        if (normalized) return normalized;
      }
      return undefined;
    }

    for (const item of education) {
      const normalized = normalizeProfileEducation(item);
      if (normalized) return normalized;
    }
    return undefined;
  }

  if (typeof education === "object") {
    if ("self" in education || "spouse" in education || "dependents" in education) {
      return (
        normalizeProfileEducation(education.self) ||
        normalizeProfileEducation(education.spouse) ||
        normalizeProfileEducation(education.dependents)
      );
    }

    if (typeof education.qualification === "string" && education.qualification.trim()) {
      return education.qualification.trim();
    }
    if (typeof education.degree === "string" && education.degree.trim()) {
      return education.degree.trim();
    }

    const institution = typeof education.institution === "string" ? education.institution.trim() : "";
    const year = education.year ? String(education.year).trim() : "";
    const combined = [institution, year].filter(Boolean).join(" ");
    if (combined) return combined;
  }

  return undefined;
}

export function normalizeProfileProfession(profession: any): string | undefined {
  if (!profession) return undefined;
  if (typeof profession === "string") return profession.trim() || undefined;

  if (Array.isArray(profession)) {
    for (const item of profession) {
      const normalized = normalizeProfileProfession(item);
      if (normalized) return normalized;
    }
    return undefined;
  }

  if (typeof profession === "object") {
    if ("self" in profession || "spouse" in profession || "dependents" in profession) {
      return (
        normalizeProfileProfession(profession.self) ||
        normalizeProfileProfession(profession.spouse) ||
        normalizeProfileProfession(profession.dependents)
      );
    }

    if (typeof profession.profession === "string" && profession.profession.trim()) {
      return profession.profession.trim();
    }

    const firstStringValue = Object.values(profession).find(
      (val) => typeof val === "string" && val.trim().length > 0
    ) as string | undefined;
    if (firstStringValue) return firstStringValue.trim();
  }

  return undefined;
}

export function normalizeTotalAssets(assets: any): number {
  if (!assets) return 0;
  if (typeof assets === "number") return assets;
  if (typeof assets === "string") {
    const cleaned = assets.toLowerCase().trim();
    if (cleaned === "nil" || cleaned === "none" || cleaned === "") return 0;
    return parseFloat(assets.replace(/,/g, "")) || 0;
  }
  if (typeof assets === "object") {
    let total = 0;
    if (assets.self) total += normalizeTotalAssets(assets.self);
    if (assets.spouse) total += normalizeTotalAssets(assets.spouse);
    if (assets.huf) total += normalizeTotalAssets(assets.huf);
    if (assets.dependents) {
      if (Array.isArray(assets.dependents)) {
        assets.dependents.forEach((d: any) => {
          total += normalizeTotalAssets(d);
        });
      } else if (typeof assets.dependents === "object") {
        Object.values(assets.dependents).forEach((v: any) => {
          total += normalizeTotalAssets(v);
        });
      }
    }
    return total;
  }
  return 0;
}

export function normalizeIncome(income: any): number {
  if (!income) return 0;
  if (typeof income === "number") return income;
  if (typeof income === "string") {
    const cleaned = income.toLowerCase().trim();
    if (cleaned === "nil" || cleaned === "none" || cleaned === "") return 0;
    return parseFloat(income.replace(/,/g, "")) || 0;
  }
  if (typeof income === "object") {
    let total = 0;
    Object.values(income).forEach((v: any) => {
      total += normalizeIncome(v);
    });
    return total;
  }
  return 0;
}

export function normalizeCriminalCases(cases: any): number {
  if (!cases) return 0;
  if (typeof cases === "number") return cases;
  if (typeof cases === "string") return parseInt(cases) || 0;
  if (typeof cases === "object") {
    return parseInt(cases.count || "0") || 0;
  }
  return 0;
}

