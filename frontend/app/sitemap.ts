import { MetadataRoute } from 'next';
import { fetchDistricts, fetchConstituencies } from '@/services/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://knowyourmla-info.vercel.app/tn';

  const [districts, constituencies] = await Promise.all([
    fetchDistricts(),
    fetchConstituencies()
  ]);

  const districtUrls = districts.map((d: any) => ({
    url: `${baseUrl}/districts/${d.id.replace("DISTRICT#", "").toLowerCase()}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const constituencyUrls = constituencies.map((c: any) => ({
    url: `${baseUrl}/constituency/${c.id.replace("CONSTITUENCY#", "").toLowerCase()}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // For MLAs, we'd ideally fetch all persons, but since we don't have a simple "all persons" list endpoint in API_REFERENCE.md beyond fetching them all
  // We can at least include the major ones or those discovered via constituencies if needed.
  // For now, I'll stick to districts and constituencies as defined in the sitemap requirements.

  const staticPages = [
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/mla/list`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/news/tamil-nadu-mlas-100-percent-attendance-2021-2026`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ];

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    ...districtUrls,
    ...constituencyUrls,
    ...staticPages,
  ];
}
