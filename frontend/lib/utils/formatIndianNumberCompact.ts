/**
 * Formats a number into Indian compact notation (Lakh/Cr).
 * 
 * @param value - The numeric value to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "1.74 Cr", "87.5 Lakh")
 */
export function formatIndianNumberCompact(value: number, decimals: number = 2): string {
  if (!value || isNaN(value)) return "0";

  if (value >= 10000000) {
    const crValue = value / 10000000;
    return `${crValue.toFixed(decimals)} Cr`;
  } else if (value >= 100000) {
    const lakhValue = value / 100000;
    return `${lakhValue.toFixed(decimals)} Lakh`;
  }
  
  return value.toLocaleString('en-IN');
}
