import { ImageResponse } from 'next/og'
import { MLAService } from '@/lib/services/mla.service'


export const alt = 'MLA Profile'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

// Helper to format currency
function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹ ${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹ ${(amount / 100000).toFixed(2)} Lakh`;
  return `₹ ${amount.toLocaleString('en-IN')}`;
}

// Helper to normalize education
function normalizeEducation(edu: string | null | undefined): string {
  if (!edu) return "Graduate";
  let cleaned = edu;
  if (edu.includes("Category:")) {
    cleaned = edu.split(":")[1].trim();
  }
  return cleaned.split(" ")[0].replace(/,/g, "");
}

// Helper for initials fallback
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const decodedSlug = decodeURIComponent(slug)
  const service = new MLAService()

  try {
    const profile = await service.getMLAProfile(decodedSlug)
    const person = profile.person
    const latestHistory = profile.history[0]
    const constituency = latestHistory?.constituency || 'Unknown'
    const district = latestHistory?.district_name || 'Tamil Nadu'
    const party = latestHistory?.party || 'Independent'
    const partyColor = latestHistory?.party_color_bg || '#64748b'
    const isWinner = latestHistory?.winner === true
    const isCurrent = latestHistory?.year === 2021 && isWinner

    const latestAssets = profile.analytics?.asset_growth?.length > 0
      ? profile.analytics.asset_growth[profile.analytics.asset_growth.length - 1]?.assets
      : 0

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            backgroundColor: '#ffffff',
            backgroundImage: 'linear-gradient(to bottom right, #f8fafc, #f1f5f9)',
            padding: '40px',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Card Container */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              width: '100%',
              height: '100%',
              backgroundColor: 'white',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e2e8f0',
            }}
          >
            {/* Left Column (40%) */}
            <div
              style={{
                display: 'flex',
                width: '40%',
                height: '100%',
                position: 'relative',
                backgroundColor: '#f8fafc',
              }}
            >
              {person.image_url ? (
                <img
                  src={person.image_url}
                  alt={person.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div
                  style={{
                    display: 'flex',
                    width: '100%',
                    height: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: partyColor,
                    color: 'white',
                    fontSize: '120px',
                    fontWeight: 'bold',
                  }}
                >
                  {getInitials(person.name)}
                </div>
              )}
              {/* Subtle Gradient Overlay */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundImage: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.4))',
                }}
              />
              {/* Thin side accent line */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  right: 0,
                  width: '4px',
                  backgroundColor: partyColor,
                }}
              />
            </div>

            {/* Right Column (60%) */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '60%',
                padding: '60px 50px',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Top Badge */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#f1f5f9',
                    padding: '6px 16px',
                    borderRadius: '9999px',
                    marginBottom: '24px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: isCurrent ? '#10b981' : '#64748b',
                      marginRight: '8px',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#475569',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {isCurrent ? 'Current MLA' : 'Candidate Profile'}
                  </span>
                </div>

                {/* Name */}
                <h1
                  style={{
                    fontSize: '56px',
                    fontWeight: '900',
                    color: '#0f172a',
                    margin: '0 0 12px 0',
                    lineHeight: '1.1',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {person.name}
                </h1>

                {/* Constituency & District */}
                <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '24px' }}>
                  <span
                    style={{
                      fontSize: '28px',
                      fontWeight: '700',
                      color: '#1e293b',
                    }}
                  >
                    {constituency}
                  </span>
                  <span
                    style={{
                      fontSize: '20px',
                      color: '#64748b',
                      fontWeight: '500',
                    }}
                  >
                    {district}, Tamil Nadu
                  </span>
                </div>

                {/* Party Chip */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: partyColor + '15', // 15% opacity version
                    padding: '8px 20px',
                    borderRadius: '12px',
                    border: `1px solid ${partyColor}40`,
                  }}
                >
                  <span
                    style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: partyColor,
                      textTransform: 'uppercase',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {party}
                  </span>
                </div>
              </div>

              {/* Bottom Section */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Metadata Strip */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '18px',
                    color: '#475569',
                    fontWeight: '600',
                    marginBottom: '40px',
                    padding: '16px 0',
                    borderTop: '1px solid #f1f5f9',
                  }}
                >
                  {person.age && (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span>Age {person.age}</span>
                      <span style={{ margin: '0 12px', color: '#cbd5e1' }}>•</span>
                    </div>
                  )}
                  <span>{normalizeEducation(person.education)}</span>
                  <span style={{ margin: '0 12px', color: '#cbd5e1' }}>•</span>
                  <span style={{ color: '#0f172a' }}>{formatCurrency(latestAssets)}</span>
                </div>

                {/* Footer Branding */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    opacity: 0.6,
                  }}
                >
                  <span
                    style={{
                      fontSize: '16px',
                      fontWeight: '900',
                      color: '#0f172a',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}
                  >
                    KnowYourMLA
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
                      color: '#64748b',
                      fontWeight: '500',
                    }}
                  >
                    Public profile & constituency insights
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        ...size,
      }
    )
  } catch (error) {
    console.error('Error generating OG image:', error)
    // Fallback Error Card
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
            padding: '40px',
            fontFamily: 'sans-serif',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: 'white',
              borderRadius: '24px',
              padding: '60px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0',
            }}
          >
            <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '20px' }}>MLA Profile</h1>
            <span style={{ fontSize: '24px', color: '#64748b' }}>KnowYourMLA</span>
          </div>
        </div>
      ),
      {
        ...size,
      }
    )
  }
}
