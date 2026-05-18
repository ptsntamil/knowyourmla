import { PersonDetail, ElectionHistoryRecord } from "@/types/models";

export interface OGTemplateProps {
  person: PersonDetail;
  latestHistory?: ElectionHistoryRecord;
}

export function formatCurrency(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === 0 || value === "0") return 'N/A';
  
  if (typeof value === 'string' && (value.includes('Cr') || value.includes('Lacs'))) {
    return value.replace('₹', 'Rs. ');
  }

  const num = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
  if (isNaN(num)) return 'N/A';

  if (num >= 10000000) return `Rs. ${(num / 10000000).toFixed(1)} Cr`;
  if (num >= 100000) return `Rs. ${(num / 100000).toFixed(1)} Lacs`;
  return `Rs. ${num.toLocaleString('en-IN')}`;
}

export function normalizeEducation(edu: string | null | undefined): string {
  if (!edu) return "Graduate";
  let cleaned = edu;
  if (edu.includes("Category:")) {
    cleaned = edu.split("Category:")[1].split(")")[0].trim();
  }
  const parts = cleaned.split(/[\s,]+/);
  return parts.slice(0, 2).join(" ");
}

export function getInitials(name: string): string {
  if (!name) return "MLA";
  return name
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

export const OG_SIZE = {
  width: 1200,
  height: 630,
};

// Note: This function returns a JSX-like object that ImageResponse expects.
export function generateMLACard(profile: { person: PersonDetail, history: ElectionHistoryRecord[] }) {
  const { person, history } = profile;
  const latestHistory = history && history.length > 0 ? history[0] : undefined;
  
  const constituency = latestHistory?.constituency || 'Unknown';
  const district = latestHistory?.district_name || 'Tamil Nadu';
  
  const partyRaw = (latestHistory?.party && latestHistory.party.trim() !== "") ? latestHistory.party : 'INDEPENDENT';
  const partyName = partyRaw.toUpperCase();
  const partyColor = latestHistory?.party_color_bg || '#64748b';

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: '#fff',
        fontFamily: 'sans-serif',
      }}
    >
      {/* Left Column: Image (40%) */}
      <div
        style={{
          width: '40%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#000', // Black background for image column
        }}
      >
        {person.image_url ? (
          <img
            src={person.image_url}
            alt={person.name}
            width="480"
            height="630"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.9, // Slight opacity for a moodier look
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#1e293b',
              fontSize: '120px',
              fontWeight: 900,
              color: '#fff',
            }}
          >
            {getInitials(person.name)}
          </div>
        )}
        
        {/* Party Accent Bar - The only touch of color on the left */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: '12px',
            backgroundColor: partyColor,
          }}
        />
      </div>

      {/* Right Column: Info (60%) */}
      <div
        style={{
          width: '60%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '60px',
          justifyContent: 'center',
          backgroundColor: '#fff',
        }}
      >
        {/* Top Badge - B&W Style */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            alignSelf: 'flex-start',
            width: 'auto',
            backgroundColor: '#000', // Solid Black
            padding: '8px 20px',
            borderRadius: '4px', // Editorial sharp corners
            marginBottom: '28px',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10b981', // Only active indicator stays color
              marginRight: '10px',
            }}
          />
          <span
            style={{
              fontSize: '14px',
              fontWeight: 900,
              color: '#fff',
              letterSpacing: '0.15em',
            }}
          >
            CURRENT MLA
          </span>
        </div>

        {/* Name */}
        <h1
          style={{
            fontSize: '72px',
            fontWeight: 900,
            color: '#000', // Pure Black
            margin: '0 0 12px 0',
            lineHeight: 1,
            letterSpacing: '-0.03em',
            textTransform: 'uppercase',
          }}
        >
          {person.name}
        </h1>

        {/* Constituency & District */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginBottom: '40px',
            borderLeft: '4px solid #000',
            paddingLeft: '20px',
          }}
        >
          <span
            style={{
              fontSize: '32px',
              fontWeight: '800',
              color: '#000',
            }}
          >
            {constituency}
          </span>
          <span
            style={{
              fontSize: '22px',
              fontWeight: '500',
              color: '#64748b',
            }}
          >
            {district}, Tamil Nadu
          </span>
        </div>

        {/* Party Chip - High Contrast B&W with Color Accent */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            alignSelf: 'flex-start',
            width: 'auto',
            backgroundColor: '#000', // Solid Black
            padding: '12px 28px',
            borderRadius: '0', 
            marginBottom: '48px',
            borderLeft: `8px solid ${partyColor}`, // The Color Pop
          }}
        >
          <span
            style={{
              fontSize: '22px',
              fontWeight: 900,
              color: '#fff', // White on Black
              letterSpacing: '0.1em',
            }}
          >
            {partyName}
          </span>
        </div>

        {/* Metadata Strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            paddingTop: '36px',
            borderTop: '2px solid #000',
            gap: '40px',
          }}
        >
          {person.age && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '13px', fontWeight: 900, color: '#94a3b8', marginBottom: '6px' }}>AGE</span>
              <span style={{ fontSize: '22px', fontWeight: 800, color: '#000' }}>{person.age} Yrs</span>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13px', fontWeight: 900, color: '#94a3b8', marginBottom: '6px' }}>EDUCATION</span>
            <span style={{ fontSize: '22px', fontWeight: 800, color: '#000' }}>{normalizeEducation(person.education)}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13px', fontWeight: 900, color: '#94a3b8', marginBottom: '6px' }}>ASSETS</span>
            <span style={{ fontSize: '22px', fontWeight: 800, color: '#000' }}>{formatCurrency(latestHistory?.assets)}</span>
          </div>
        </div>

        {/* Branding Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            right: '60px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '16px', fontWeight: 900, color: '#000', letterSpacing: '0.2em' }}>
            KNOWYOURMLA
          </span>
        </div>
      </div>
    </div>
  );
}
