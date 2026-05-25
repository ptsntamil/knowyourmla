/**
 * Normalises a raw `profile_pic` / `image_url` value from DynamoDB into a
 * browser-ready URL.
 *
 * Handles three formats that exist in the DB:
 *
 *  1. `assets/2026/photos/<file>.jpg`        – relative with "assets/" prefix
 *     → converted to `/candidate/2026/photos/<file>.jpg`
 *
 *  2. `candidate/2026/photos/<file>.jpg`     – relative without leading "/"
 *     → converted to `/candidate/2026/photos/<file>.jpg`
 *
 *  3. Any fully-qualified URL (http / https)  – older years (Myneta CDN etc.)
 *     → returned as-is
 *
 *  4. `null` / `undefined` / empty string    – returned as `null`
 *
 * @param raw - The raw profile pic string from the database.
 * @returns A browser-ready URL string, or `null` when no image is available.
 */
export function normalizeCandidateProfilePic(raw: string | null | undefined): string | null {
  if (!raw) return null;

  // Case 1: "assets/<year>/photos/…" → "/candidate/<year>/photos/…"
  const assetsMatch = raw.match(/^assets\/(\d{4})\/photos\/(.+)$/);
  if (assetsMatch) {
    const year = assetsMatch[1];
    const file = assetsMatch[2];
    
    if (year === '2026') {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dioopnzii';
      // Our upload script stripped the extension for the public ID
      const filenameWithoutExt = file.replace(/\.[^/.]+$/, "");
      return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/v1/knowyourmla/candidates/2026/${filenameWithoutExt}`;
    }
    return `/candidate/${year}/photos/${file}`;
  }

  // Case 2: "candidate/<year>/photos/…" (missing leading slash)
  const candidateMatch = raw.match(/^candidate\/(\d{4})\/photos\/(.+)$/);
  if (candidateMatch) {
    const year = candidateMatch[1];
    const file = candidateMatch[2];
    
    if (year === '2026') {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dioopnzii';
      const filenameWithoutExt = file.replace(/\.[^/.]+$/, "");
      return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/v1/knowyourmla/candidates/2026/${filenameWithoutExt}`;
    }
    return `/${raw}`;
  }

  // Case 3: already a fully-qualified URL – return unchanged
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw;
  }

  // Case 4: path that already starts with "/" – return unchanged
  if (raw.startsWith('/')) {
    return raw;
  }

  // Unknown format – return as-is so we don't silently swallow data
  return raw;
}
