const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://knowyourmla-info.vercel.app";

/**
 * Generates a clean canonical URL for a given path.
 * Ensures production domain, removes query parameters, and handles slashes.
 */
export function getCanonicalUrl(path: string): string {
  if (!path) return BASE_URL;
  
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  try {
    const url = new URL(cleanPath, BASE_URL);
    // Remove query params and trailing slash for consistency
    let canonical = url.origin + url.pathname;
    
    // Normalize trailing slash (remove it unless it's just the domain)
    if (canonical.endsWith('/') && canonical !== `${BASE_URL}/` && canonical !== `${BASE_URL}`) {
      canonical = canonical.slice(0, -1);
    }
    
    return canonical;
  } catch (e) {
    console.error("Invalid path for canonical URL:", path);
    return `${BASE_URL}${cleanPath}`;
  }
}
