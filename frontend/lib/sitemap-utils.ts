export function generateXml(urls: any[]) {
  const urlEntries = urls.map(u => `  <url>
    <loc>${u.url}</loc>
    <lastmod>${u.lastModified.toISOString()}</lastmod>
    <changefreq>${u.changeFrequency}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

export const slugify = (text: string) => {
  return (text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
};
