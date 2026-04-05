import { ImageResponse } from 'next/og'
import { MLAService } from '@/lib/services/mla.service'
import { generateMLACard, OG_SIZE } from '@/lib/seo/og-templates'
import { fetchConstituencyWinners } from '@/services/api'

export const alt = 'Constituency MLA Profile'
export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const decodedSlug = decodeURIComponent(slug)
  const constituencyId = `CONSTITUENCY#${decodedSlug}`
  
  try {
    // 1. Fetch constituency winners to find the current MLA
    const data = await fetchConstituencyWinners(constituencyId).catch(() => ({ history: [] }))
    const currentWinner = data.history[0]
    
    if (!currentWinner) {
      throw new Error("No current MLA found for this constituency")
    }

    // 2. Fetch the full MLA profile to get refined data (age, education, assets)
    const mlaIdentifier = currentWinner.person_id 
      ? currentWinner.person_id.replace("PERSON#", "") 
      : currentWinner.slug;

    if (!mlaIdentifier) {
      throw new Error("No MLA identifier found for this constituency")
    }

    const service = new MLAService()
    const profile = await service.getMLAProfile(mlaIdentifier)

    // 3. Generate the premium card
    return new ImageResponse(generateMLACard(profile), { ...size })
  } catch (error) {
    console.error('Error generating Constituency OG image:', error)
    // Fallback card
    return new ImageResponse(
      (
        <div style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fff',
          fontFamily: 'sans-serif',
        }}>
          <h1 style={{ fontSize: '64px', fontWeight: 900, color: '#0f172a', marginBottom: '20px' }}>
            {decodedSlug.toUpperCase()}
          </h1>
          <p style={{ fontSize: '24px', color: '#64748b', fontWeight: 700 }}>
            KnowYourMLA
          </p>
        </div>
      ),
      { ...size }
    )
  }
}
