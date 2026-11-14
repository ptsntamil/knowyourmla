import { ImageResponse } from 'next/og';
import { OG_SIZE } from '@/lib/seo/og-templates';

export const alt = 'Tamil Nadu MLAs Vehicle Dashboard';
export const size = OG_SIZE;
export const contentType = 'image/png';
export const revalidate = 86400;

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#16232E',
          padding: '60px 80px',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Decorative Top Accent Bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '12px',
            backgroundColor: '#D4AF37',
          }}
        />

        {/* Top Header: Brand & Badge */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                fontSize: '32px',
                fontWeight: 900,
                color: '#FFFFFF',
                letterSpacing: '-0.03em',
              }}
            >
              KnowYour<span style={{ color: '#D4AF37' }}>MLA</span>
            </span>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 800,
                color: '#94A3B8',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                borderLeft: '2px solid #334155',
                paddingLeft: '12px',
              }}
            >
              Political Intelligence
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(212, 175, 55, 0.15)',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              padding: '8px 20px',
              borderRadius: '9999px',
            }}
          >
            <span
              style={{
                fontSize: '13px',
                fontWeight: 900,
                color: '#D4AF37',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
              }}
            >
              Elected Members
            </span>
          </div>
        </div>

        {/* Center: Title & Description */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontSize: '15px',
              fontWeight: 900,
              color: '#D4AF37',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}
          >
            Tamil Nadu Assembly
          </span>
          <h1
            style={{
              fontSize: '56px',
              fontWeight: 900,
              color: '#FFFFFF',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              margin: '0 0 16px 0',
              textTransform: 'uppercase',
            }}
          >
            MLAs Vehicle Dashboard
          </h1>
          <p
            style={{
              fontSize: '22px',
              color: '#CBD5E1',
              fontWeight: 500,
              lineHeight: 1.4,
              margin: 0,
              maxWidth: '920px',
            }}
          >
            Declared personal and family vehicles, luxury SUVs, and commercial assets owned by Tamil Nadu MLAs.
          </p>
        </div>

        {/* Bottom Stats Grid */}
        <div style={{ display: 'flex', gap: '20px' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#1E293B',
              borderRadius: '16px',
              padding: '16px 24px',
              border: '1px solid #334155',
              flex: 1,
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Coverage
            </span>
            <span style={{ fontSize: '28px', fontWeight: 900, color: '#FFFFFF', marginTop: '4px' }}>
              234 MLAs
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#1E293B',
              borderRadius: '16px',
              padding: '16px 24px',
              border: '1px solid #334155',
              flex: 1,
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Vehicle Categories
            </span>
            <span style={{ fontSize: '28px', fontWeight: 900, color: '#FFFFFF', marginTop: '4px' }}>
              Cars, SUVs &amp; Bikes
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#1E293B',
              borderRadius: '16px',
              padding: '16px 24px',
              border: '1px solid #334155',
              flex: 1,
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Data Source
            </span>
            <span style={{ fontSize: '28px', fontWeight: 900, color: '#D4AF37', marginTop: '4px' }}>
              Official Affidavits
            </span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid #334155',
            paddingTop: '20px',
          }}
        >
          <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 700 }}>
            Election Commission Affidavits Analysis
          </span>
          <span style={{ fontSize: '14px', color: '#D4AF37', fontWeight: 800, letterSpacing: '0.05em' }}>
            knowyourmla.in/tn/vehicles
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
