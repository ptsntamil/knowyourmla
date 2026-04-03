import { MetadataRoute } from 'next';
import { fetchDistricts, fetchConstituencies, fetchParties, fetchMLAs } from '@/services/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const domain = process.env.NEXT_PUBLIC_BASE_URL || 'https://knowyourmla-info.vercel.app';
  const tnBaseUrl = `${domain}/tn`;

  let districts: any[] = [];
  let constituencies: any[] = [];
  let parties: any[] = [];
  let mlas2021: any = { mlas: [] };
  let mlas2016: any = { mlas: [] };
  let mlas2011: any = { mlas: [] };

  try {
    const results = await Promise.allSettled([
      fetchDistricts(),
      fetchConstituencies(),
      fetchParties(),
      fetchMLAs(2021),
      fetchMLAs(2016),
      fetchMLAs(2011)
    ]);

    if (results[0].status === 'fulfilled') districts = results[0].value;
    if (results[1].status === 'fulfilled') constituencies = results[1].value;
    if (results[2].status === 'fulfilled') parties = results[2].value;
    if (results[3].status === 'fulfilled') mlas2021 = results[3].value;
    if (results[4].status === 'fulfilled') mlas2016 = results[4].value;
    if (results[5].status === 'fulfilled') mlas2011 = results[5].value;

  } catch (error) {
    console.error('Sitemap data fetch error:', error);
  }

  const slugify = (text: string) => {
    return (text || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters like &
      .replace(/\s+/g, '-');        // Replace spaces with dashes
  };

  const districtUrls = (districts || []).map((d: any) => ({
    url: `${tnBaseUrl}/districts/${slugify(d.slug || d.name)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  })).filter(u => u.url.split('/').pop());

  const constituencyUrls = (constituencies || []).map((c: any) => ({
    url: `${tnBaseUrl}/constituency/${slugify(c.slug || c.name)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  })).filter(u => u.url.split('/').pop());

  const partyUrls = (parties || []).map((p: any) => ({
    url: `${domain}/parties/${slugify(p.slug || p.short_name || p.name)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  })).filter((u: any) => u.url.split('/').pop());

  // Combine MLAs from different years and ensure unique slugs
  const allMlas = [
    ...(mlas2021?.mlas || []),
    ...(mlas2016?.mlas || []),
    ...(mlas2011?.mlas || [])
  ];

  const uniqueMlas = Array.from(new Map(allMlas.map(m => [m.slug, m])).values());

  const mlaUrls = (uniqueMlas || []).map((m: any) => ({
    url: `${tnBaseUrl}/mla/${m.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  })).filter((u: any) => u.url.split('/').pop());

  const staticPages = [
    {
      url: `${tnBaseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
    {
      url: `${tnBaseUrl}/mla/list`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${tnBaseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
    {
      url: `${tnBaseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${domain}/parties`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${tnBaseUrl}/news/tamil-nadu-mlas-100-percent-attendance-2021-2026`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ];

  return [
    {
      url: domain,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: tnBaseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    ...districtUrls,
    // ...constituencyUrls,
    ...partyUrls,
    ...mlaUrls,
    ...staticPages,
  ];
}
