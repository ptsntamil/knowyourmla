import manifestoData from '../../data/tvk_manifesto.json';

export interface ManifestoPromise {
  Promise_ID: string;
  Category: string;
  Promise_Title: string;
  Description: string;
  Target_Beneficiaries: string;
  Implementation_Status: string;
  Policy_Instrument_or_Budget: string;
  Effective_Date_or_Timeline: string;
  Notes: string;
}

export async function getTVKManifestoPromises(): Promise<ManifestoPromise[]> {
  // Using direct JSON import ensures Next.js bundles the data at build time.
  // The CSV is no longer required at runtime in Vercel.
  return manifestoData as ManifestoPromise[];
}
