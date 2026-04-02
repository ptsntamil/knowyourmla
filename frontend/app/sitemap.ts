import { MetadataRoute } from 'next';
import { fetchDistricts, fetchConstituencies, fetchParties, fetchMLAs } from '@/services/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const domain = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.knowyourmla.com';
  const tnBaseUrl = `${domain}/tn`;

  let districts: any[] = [];
  let constituencies: any[] = [];
  let parties: any[] = [];
  let mlasData: any = { mlas: [] };

  try {
    const results = await Promise.allSettled([
      fetchDistricts(),
      fetchConstituencies(),
      fetchParties(),
      fetchMLAs()
    ]);

    if (results[0].status === 'fulfilled') districts = results[0].value;
    if (results[1].status === 'fulfilled') constituencies = results[1].value;
    if (results[2].status === 'fulfilled') parties = results[2].value;
    if (results[3].status === 'fulfilled') mlasData = results[3].value;

  } catch (error) {
    console.error('Sitemap data fetch error:', error);
  }

  const districtUrls = (districts || []).map((d: any) => ({
    url: `${tnBaseUrl}/districts/${(d.slug || d.name || "").toLowerCase().replace(/\s+/g, '-')}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  })).filter(u => u.url.split('/').pop());

  const constituencyUrls = (constituencies || []).map((c: any) => ({
    url: `${tnBaseUrl}/constituency/${(c.slug || c.name || "").toLowerCase().replace(/\s+/g, '-')}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  })).filter(u => u.url.split('/').pop());

  const partyUrls = (parties || []).map((p: any) => ({
    url: `${domain}/parties/${(p.slug || p.short_name || p.name || "").toLowerCase().replace(/\s+/g, '-')}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  })).filter((u: any) => u.url.split('/').pop());

  const mlaUrls = (mlasData?.mlas || []).map((m: any) => ({
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
    ...constituencyUrls,
    ...partyUrls,
    ...mlaUrls,
    ...staticPages,
  ];
}
