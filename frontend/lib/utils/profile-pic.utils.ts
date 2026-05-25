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
    return `/candidate/${assetsMatch[1]}/photos/${assetsMatch[2]}`;
  }

  // Case 2: "candidate/<year>/photos/…" (missing leading slash)
  if (/^candidate\/\d{4}\/photos\//.test(raw)) {
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
