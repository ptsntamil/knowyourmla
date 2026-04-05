import { ImageResponse } from 'next/og'
import { MLAService } from '@/lib/services/mla.service'
import { generateMLACard, OG_SIZE } from '@/lib/seo/og-templates'

export const alt = 'MLA Profile'
export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const decodedSlug = decodeURIComponent(slug)
  const service = new MLAService()

  try {
    const profile = await service.getMLAProfile(decodedSlug)
    return new ImageResponse(generateMLACard(profile), { ...size })
  } catch (error) {
    console.error('Error generating OG image:', error)
    // Minimal fallback card just in case
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
            MLA Profile
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
