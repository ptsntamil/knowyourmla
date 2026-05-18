import React from "react";
import { ElectionSummary, PartySeatShare, ConstituencyResult, CandidateInsight, WomenRepresentation } from "../services/election-analytics.service";

export const OG_SIZE = {
  width: 1200,
  height: 630,
};

// Common Layout Primitive
function SharedOGLayout({ 
  children, 
  title, 
  subtitle, 
  year,
  context = "TN", 
  state = "Tamil Nadu",
  accentColor = "#EAB308" // Brand Gold
}: { 
  children: React.ReactNode; 
  title: string; 
  subtitle?: string;
  year?: number;
  context?: string;
  state?: string;
  accentColor?: string;
}) {
  const headerLabel = year ? `${state} Election ${year}` : `${state} ${context}`;
  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff',
        fontFamily: 'sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Accent */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '12px',
          backgroundColor: accentColor,
        }}
      />

      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '60px 80px 40px 80px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '18px', fontWeight: 900, color: accentColor, letterSpacing: '0.3em', textTransform: 'uppercase' }}>
            {headerLabel}
          </span>
        </div>
        <h1
          style={{
            fontSize: '64px',
            fontWeight: 900,
            color: '#000',
            margin: 0,
            lineHeight: 1.1,
            letterSpacing: '-0.04em',
            textTransform: 'uppercase',
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              fontSize: '24px',
              fontWeight: 500,
              color: '#64748b',
              margin: '12px 0 0 0',
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          padding: '0 80px 80px 80px',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {children}
      </div>

      {/* Branding Footer */}
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          right: '80px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '16px', fontWeight: 900, color: '#000', letterSpacing: '0.2em' }}>
          KNOWYOURMLA
        </span>
      </div>
    </div>
  );
}

// 1. Election Summary Card
export function generateElectionSummaryCard(summary: ElectionSummary, seats: PartySeatShare[]) {
  const topParties = seats.slice(0, 3);
  
  return (
    <SharedOGLayout 
      title="Election Results" 
      subtitle={summary.summarySentence}
      year={summary.year}
    >
      <div style={{ display: 'flex', gap: '40px', marginTop: '20px', width: '100%' }}>
        {topParties.map((party, i) => (
          <div 
            key={party.shortName || i}
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              flex: 1,
              backgroundColor: '#f8fafc',
              padding: '32px',
              borderRadius: '16px',
              borderLeft: `12px solid ${party.colorBg || '#64748b'}`
            }}
          >
            <span style={{ fontSize: '16px', fontWeight: 900, color: '#94a3b8', marginBottom: '8px', letterSpacing: '0.1em' }}>{party.shortName}</span>
            <span style={{ fontSize: '48px', fontWeight: 900, color: '#0f172a' }}>{party.seatsWon}</span>
            <span style={{ fontSize: '18px', fontWeight: 600, color: '#64748b' }}>Seats Won</span>
          </div>
        ))}
      </div>
    </SharedOGLayout>
  );
}

// 2. Winning Party Card
export function generateWinningPartyCard(summary: ElectionSummary, seats: PartySeatShare[]) {
  const winner = seats[0] || {} as PartySeatShare;
  
  return (
    <SharedOGLayout 
      title="Election Winner" 
      year={summary.year}
      accentColor={winner?.colorBg}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%' }}>
        <div 
          style={{ 
            display: 'flex', 
            flexDirection: 'column',
            backgroundColor: '#000',
            padding: '48px 80px',
            borderRadius: '24px',
            borderBottom: `20px solid ${winner?.colorBg || '#EAB308'}`,
            marginBottom: '40px'
          }}
        >
          <span style={{ fontSize: '24px', fontWeight: 900, color: '#94a3b8', marginBottom: '16px', letterSpacing: '0.2em' }}>WINNING PARTY</span>
          <span style={{ fontSize: '84px', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{winner?.name || 'Unknown'}</span>
        </div>
        <div style={{ display: 'flex', gap: '60px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '48px', fontWeight: 900, color: '#000' }}>{winner?.seatsWon || 0}</span>
            <span style={{ fontSize: '18px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Seats Won</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '48px', fontWeight: 900, color: '#000' }}>{summary.majorityMark}</span>
            <span style={{ fontSize: '18px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Majority Mark</span>
          </div>
        </div>
      </div>
    </SharedOGLayout>
  );
}

// 3. Closest Contests Card
export function generateClosestContestsCard(year: number, contests: ConstituencyResult[]) {
  return (
    <SharedOGLayout title="Closest Contests" year={year} subtitle="The tightest political battles in the state">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
        {contests.slice(0, 4).map((c, i) => (
          <div 
            key={c.constituencyId || i}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              backgroundColor: '#f8fafc',
              padding: '20px 32px',
              borderRadius: '12px',
              justifyContent: 'space-between',
              width: '100%'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a' }}>{c.constituencyName}</span>
              <span style={{ fontSize: '16px', fontWeight: 500, color: '#64748b' }}>{c.districtName}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
                <span style={{ fontSize: '14px', fontWeight: 900, color: '#94a3b8' }}>WINNER</span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#000' }}>{c.winnerName} ({c.winnerPartyShort})</span>
              </div>
              <div 
                style={{ 
                  backgroundColor: '#000', 
                  color: '#fff', 
                  padding: '8px 16px', 
                  borderRadius: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: '120px'
                }}
              >
                <span style={{ fontSize: '10px', fontWeight: 900 }}>MARGIN</span>
                <span style={{ fontSize: '20px', fontWeight: 900 }}>{c.margin.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SharedOGLayout>
  );
}

// 4. Biggest Victories Card
export function generateBiggestVictoriesCard(year: number, victories: ConstituencyResult[]) {
  return (
    <SharedOGLayout title="Biggest Victories" year={year} subtitle="Landslide wins with massive margins">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
        {victories.slice(0, 4).map((v, i) => (
          <div 
            key={v.constituencyId || i}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              backgroundColor: '#f8fafc',
              padding: '20px 32px',
              borderRadius: '12px',
              justifyContent: 'space-between',
              width: '100%'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a' }}>{v.constituencyName}</span>
              <span style={{ fontSize: '16px', fontWeight: 500, color: '#64748b' }}>{v.districtName}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
                <span style={{ fontSize: '14px', fontWeight: 900, color: '#94a3b8' }}>WINNER</span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#000' }}>{v.winnerName} ({v.winnerPartyShort})</span>
              </div>
              <div 
                style={{ 
                  backgroundColor: '#164C45', 
                  color: '#fff', 
                  padding: '8px 16px', 
                  borderRadius: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: '120px'
                }}
              >
                <span style={{ fontSize: '10px', fontWeight: 900 }}>MARGIN</span>
                <span style={{ fontSize: '20px', fontWeight: 900 }}>{v.margin.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SharedOGLayout>
  );
}

// 5. Highest Turnout Card
export function generateTurnoutCard(year: number, turnout: ConstituencyResult[]) {
  return (
    <SharedOGLayout title="Highest Turnout" year={year} subtitle="Highest voter participation by constituency">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
        {turnout.slice(0, 4).map((t, i) => (
          <div 
            key={t.constituencyId || i}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              backgroundColor: '#f8fafc',
              padding: '24px 40px',
              borderRadius: '16px',
              justifyContent: 'space-between',
              width: '100%'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a' }}>{t.constituencyName}</span>
              <span style={{ fontSize: '18px', fontWeight: 500, color: '#64748b' }}>{t.districtName}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
               <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'center' }}>
                <span style={{ fontSize: '56px', fontWeight: 900, color: '#164C45', lineHeight: 1 }}>{t.turnoutPercent}%</span>
                <span style={{ fontSize: '14px', fontWeight: 900, color: '#94a3b8', letterSpacing: '0.1em' }}>VOTER TURNOUT</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SharedOGLayout>
  );
}

// 6. Women Representation Card
export function generateWomenRepresentationCard(year: number, data: WomenRepresentation) {
  return (
    <SharedOGLayout title="Women Representation" year={year} subtitle="Participation and success of women candidates">
      <div style={{ display: 'flex', gap: '30px', width: '100%' }}>
        <div 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            flex: 1,
            backgroundColor: '#000',
            padding: '40px',
            borderRadius: '24px',
            color: '#fff',
            justifyContent: 'center'
          }}
        >
          <span style={{ fontSize: '18px', fontWeight: 900, color: '#94a3b8', marginBottom: '12px', letterSpacing: '0.2em' }}>TOTAL WINNERS</span>
          <span style={{ fontSize: '84px', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{data.totalWinners}</span>
          <div style={{ height: '4px', width: '60px', backgroundColor: '#EAB308', margin: '24px 0' }} />
          <span style={{ fontSize: '20px', fontWeight: 500, color: '#cbd5e1' }}>out of {data.totalCandidates} candidates</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '20px' }}>
          <div 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              backgroundColor: '#f8fafc',
              padding: '30px',
              borderRadius: '20px',
              border: '1px solid #e2e8f0'
            }}
          >
            <span style={{ fontSize: '56px', fontWeight: 900, color: '#000', lineHeight: 1 }}>{data.winRate.toFixed(1)}%</span>
            <span style={{ fontSize: '16px', fontWeight: 900, color: '#64748b', marginTop: '8px', letterSpacing: '0.1em' }}>WIN RATE</span>
          </div>
          <div 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              backgroundColor: '#f8fafc',
              padding: '30px',
              borderRadius: '20px',
              border: '1px solid #e2e8f0'
            }}
          >
            <span style={{ fontSize: '56px', fontWeight: 900, color: '#000', lineHeight: 1 }}>{data.contestantPercentage.toFixed(1)}%</span>
            <span style={{ fontSize: '16px', fontWeight: 900, color: '#64748b', marginTop: '8px', letterSpacing: '0.1em' }}>CONTESTANT SHARE</span>
          </div>
        </div>
      </div>
    </SharedOGLayout>
  );
}

// 7. Richest Contestants Card
export function generateRichestContestantsCard(year: number, candidates: CandidateInsight[]) {
  return (
    <SharedOGLayout title="Richest Contestants" year={year} subtitle="Top candidates by declared assets">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
        {candidates.slice(0, 4).map((c, i) => (
          <div 
            key={c.name || i}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              backgroundColor: '#f8fafc',
              padding: '20px 32px',
              borderRadius: '12px',
              justifyContent: 'space-between',
              borderLeft: `8px solid ${c.partyColorBg || '#64748b'}`,
              width: '100%'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a' }}>{c.name}</span>
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#64748b' }}>{c.partyShort} • {c.constituencyName}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
              <span style={{ fontSize: '32px', fontWeight: 900, color: '#b45309' }}>{c.formattedValue}</span>
              <span style={{ fontSize: '12px', fontWeight: 900, color: '#94a3b8', letterSpacing: '0.1em' }}>TOTAL ASSETS</span>
            </div>
          </div>
        ))}
      </div>
    </SharedOGLayout>
  );
}

// 8. Youngest Contestants Card
export function generateYoungestContestantsCard(year: number, candidates: CandidateInsight[]) {
  return (
    <SharedOGLayout title="Youngest Contestants" year={year} subtitle="Young emerging leaders in the election">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
        {candidates.slice(0, 4).map((c, i) => (
          <div 
            key={c.name || i}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              backgroundColor: '#f8fafc',
              padding: '24px 40px',
              borderRadius: '16px',
              justifyContent: 'space-between',
              borderLeft: `8px solid ${c.partyColorBg || '#64748b'}`,
              width: '100%'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a' }}>{c.name}</span>
              <span style={{ fontSize: '18px', fontWeight: 600, color: '#64748b' }}>{c.partyShort} • {c.constituencyName}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'center' }}>
              <span style={{ fontSize: '56px', fontWeight: 900, color: '#000', lineHeight: 1 }}>{c.value}</span>
              <span style={{ fontSize: '14px', fontWeight: 900, color: '#94a3b8', letterSpacing: '0.1em' }}>YEARS OLD</span>
            </div>
          </div>
        ))}
      </div>
    </SharedOGLayout>
  );
}
// --- District Specific Generators ---

export function generateDistrictDominantPartyCard(district: string, dominantParty: { party: string; seats: number; totalSeats: number }) {
  return (
    <SharedOGLayout 
      title={`${dominantParty.party} dominates ${district}`} 
      subtitle={`${dominantParty.seats}/${dominantParty.totalSeats} seats won in the district`}
      context="District"
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%', marginTop: '20px' }}>
        <div 
          style={{ 
            display: 'flex', 
            flexDirection: 'column',
            backgroundColor: '#000',
            padding: '48px 80px',
            borderRadius: '24px',
            borderBottom: '20px solid #EAB308',
            marginBottom: '40px'
          }}
        >
          <span style={{ fontSize: '24px', fontWeight: 900, color: '#94a3b8', marginBottom: '16px', letterSpacing: '0.2em' }}>DOMINANT PARTY</span>
          <span style={{ fontSize: '84px', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{dominantParty.party}</span>
        </div>
        <div style={{ display: 'flex', gap: '60px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '48px', fontWeight: 900, color: '#000' }}>{dominantParty.seats}</span>
            <span style={{ fontSize: '18px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Seats Won</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '48px', fontWeight: 900, color: '#000' }}>{dominantParty.totalSeats}</span>
            <span style={{ fontSize: '18px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Total Seats</span>
          </div>
        </div>
      </div>
    </SharedOGLayout>
  );
}

export function generateDistrictRichestMLACard(district: string, mla: { name: string; formattedAssets: string; partyShort: string; partyColor?: string }) {
  return (
    <SharedOGLayout 
      title={mla.formattedAssets} 
      subtitle={`Richest MLA in ${district} District`}
      context="District"
      accentColor={mla.partyColor}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%' }}>
        <div 
          style={{ 
            display: 'flex', 
            flexDirection: 'column',
            backgroundColor: '#f8fafc',
            padding: '48px 80px',
            borderRadius: '24px',
            borderLeft: `20px solid ${mla.partyColor || '#EAB308'}`,
            marginBottom: '40px',
            alignItems: 'center'
          }}
        >
          <span style={{ fontSize: '24px', fontWeight: 900, color: '#94a3b8', marginBottom: '16px', letterSpacing: '0.2em' }}>{mla.partyShort}</span>
          <span style={{ fontSize: '84px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{mla.name}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
           <span style={{ fontSize: '18px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Declared Assets</span>
           <span style={{ fontSize: '48px', fontWeight: 900, color: '#b45309' }}>{mla.formattedAssets}</span>
        </div>
      </div>
    </SharedOGLayout>
  );
}

export function generateDistrictYoungestMLACard(district: string, mla: { name: string; age: number; partyShort: string; partyColor?: string }) {
  return (
    <SharedOGLayout 
      title={`Age ${mla.age}`} 
      subtitle={`Youngest MLA in ${district} District`}
      context="District"
      accentColor={mla.partyColor}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%' }}>
        <div 
          style={{ 
            display: 'flex', 
            flexDirection: 'column',
            backgroundColor: '#f8fafc',
            padding: '48px 80px',
            borderRadius: '24px',
            borderLeft: `20px solid ${mla.partyColor || '#EAB308'}`,
            marginBottom: '40px',
            alignItems: 'center'
          }}
        >
          <span style={{ fontSize: '24px', fontWeight: 900, color: '#94a3b8', marginBottom: '16px', letterSpacing: '0.2em' }}>{mla.partyShort}</span>
          <span style={{ fontSize: '84px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{mla.name}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
           <span style={{ fontSize: '18px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Member Age</span>
           <span style={{ fontSize: '56px', fontWeight: 900, color: '#000' }}>{mla.age} Years</span>
        </div>
      </div>
    </SharedOGLayout>
  );
}

export function generateDistrictWomenStatsCard(district: string, femaleCount: number, totalSeats: number) {
  const percentage = ((femaleCount / totalSeats) * 100).toFixed(1);
  return (
    <SharedOGLayout 
      title={`${percentage}% Women MLAs`} 
      subtitle={`${femaleCount}/${totalSeats} seats in ${district} district`}
      context="District"
      accentColor="#db2777" // Pink for women representation
    >
       <div style={{ display: 'flex', gap: '30px', width: '100%' }}>
        <div 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            flex: 1,
            backgroundColor: '#000',
            padding: '40px',
            borderRadius: '24px',
            color: '#fff',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <span style={{ fontSize: '18px', fontWeight: 900, color: '#94a3b8', marginBottom: '12px', letterSpacing: '0.2em' }}>WOMEN REPRESENTATION</span>
          <span style={{ fontSize: '120px', fontWeight: 900, color: '#db2777', lineHeight: 1 }}>{femaleCount}</span>
          <div style={{ height: '4px', width: '60px', backgroundColor: '#db2777', margin: '24px 0' }} />
          <span style={{ fontSize: '20px', fontWeight: 500, color: '#cbd5e1' }}>MLAs in {district} district</span>
        </div>
        
        <div 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            flex: 1, 
            backgroundColor: '#f8fafc',
            padding: '40px',
            borderRadius: '24px',
            border: '1px solid #e2e8f0',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <span style={{ fontSize: '84px', fontWeight: 900, color: '#000', lineHeight: 1 }}>{percentage}%</span>
          <span style={{ fontSize: '24px', fontWeight: 900, color: '#64748b', marginTop: '16px', letterSpacing: '0.1em' }}>OF TOTAL SEATS</span>
        </div>
      </div>
    </SharedOGLayout>
  );
}

export function generateDistrictProfileCard(district: string, topParties: { party: string; seats: number; color?: string }[]) {
  const headline = topParties.length >= 2 ? `${topParties[0].party} vs ${topParties[1].party}` : `${district} District Profile`;
  return (
    <SharedOGLayout 
      title={headline} 
      subtitle="District political profile and representation insights"
      context="District"
    >
      <div style={{ display: 'flex', gap: '40px', width: '100%', marginTop: '20px' }}>
        {topParties.slice(0, 3).map((p, i) => (
          <div 
            key={p.party || i}
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              flex: 1,
              backgroundColor: '#f8fafc',
              padding: '32px',
              borderRadius: '24px',
              borderLeft: `12px solid ${p.color || '#64748b'}`
            }}
          >
            <span style={{ fontSize: '16px', fontWeight: 900, color: '#94a3b8', marginBottom: '8px', letterSpacing: '0.1em' }}>{p.party}</span>
            <span style={{ fontSize: '48px', fontWeight: 900, color: '#0f172a' }}>{p.seats}</span>
            <span style={{ fontSize: '18px', fontWeight: 600, color: '#64748b' }}>Seats</span>
          </div>
        ))}
      </div>
    </SharedOGLayout>
  );
}

// --- Party Specific Generators ---

export function generatePartyStatsCard(partyName: string, stats: { totalContested: number; totalWins: number; winRate: string }) {
  return (
    <SharedOGLayout 
      title={`${partyName} Performance`} 
      subtitle="Election performance and success metrics"
      context="Party"
    >
      <div style={{ display: 'flex', gap: '30px', width: '100%', marginTop: '20px' }}>
        <div 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            flex: 1.5,
            backgroundColor: '#000',
            padding: '40px',
            borderRadius: '24px',
            color: '#fff',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <span style={{ fontSize: '18px', fontWeight: 900, color: '#94a3b8', marginBottom: '12px', letterSpacing: '0.2em' }}>WIN RATE</span>
          <span style={{ fontSize: '120px', fontWeight: 900, color: '#EAB308', lineHeight: 1 }}>{stats.winRate}%</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '20px' }}>
          <div 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              backgroundColor: '#f8fafc',
              padding: '30px',
              borderRadius: '20px',
              border: '1px solid #e2e8f0'
            }}
          >
            <span style={{ fontSize: '48px', fontWeight: 900, color: '#000', lineHeight: 1 }}>{stats.totalWins}</span>
            <span style={{ fontSize: '16px', fontWeight: 900, color: '#64748b', marginTop: '8px', letterSpacing: '0.1em' }}>SEATS WON</span>
          </div>
          <div 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              backgroundColor: '#f8fafc',
              padding: '30px',
              borderRadius: '20px',
              border: '1px solid #e2e8f0'
            }}
          >
            <span style={{ fontSize: '48px', fontWeight: 900, color: '#000', lineHeight: 1 }}>{stats.totalContested}</span>
            <span style={{ fontSize: '16px', fontWeight: 900, color: '#64748b', marginTop: '8px', letterSpacing: '0.1em' }}>CONTESTED</span>
          </div>
        </div>
      </div>
    </SharedOGLayout>
  );
}

export function generatePartyAssetsCard(partyName: string, assets: { crorepatiCount: number; crorepatiPercentage: string; highestName: string; highestValue: string }) {
  return (
    <SharedOGLayout 
      title="Financial Profile" 
      subtitle={`Wealth distribution for ${partyName} candidates`}
      context="Party"
      accentColor="#b45309"
    >
      <div style={{ display: 'flex', gap: '30px', width: '100%', marginTop: '20px' }}>
        <div 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            flex: 1,
            backgroundColor: '#fffbeb',
            padding: '40px',
            borderRadius: '24px',
            border: '2px solid #fde68a',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <span style={{ fontSize: '16px', fontWeight: 900, color: '#b45309', marginBottom: '12px', letterSpacing: '0.1em' }}>CROREPATI CANDIDATES</span>
          <span style={{ fontSize: '84px', fontWeight: 900, color: '#92400e', lineHeight: 1 }}>{assets.crorepatiPercentage}%</span>
          <span style={{ fontSize: '18px', fontWeight: 700, color: '#b45309', marginTop: '12px' }}>{assets.crorepatiCount} Candidates</span>
        </div>
        
        <div 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            flex: 1.2,
            backgroundColor: '#000',
            padding: '40px',
            borderRadius: '24px',
            color: '#fff',
            justifyContent: 'center'
          }}
        >
          <span style={{ fontSize: '14px', fontWeight: 900, color: '#94a3b8', marginBottom: '16px', letterSpacing: '0.2em' }}>RICHEST CANDIDATE</span>
          <span style={{ fontSize: '48px', fontWeight: 900, color: '#fff', marginBottom: '12px', lineHeight: 1.1 }}>{assets.highestName}</span>
          <span style={{ fontSize: '36px', fontWeight: 900, color: '#EAB308' }}>{assets.highestValue}</span>
        </div>
      </div>
    </SharedOGLayout>
  );
}

export function generatePartyCriminalCard(partyName: string, criminal: { total: number; percentage: string }) {
  return (
    <SharedOGLayout 
      title="Transparency Profile" 
      subtitle={`Criminal cases analysis for ${partyName}`}
      context="Party"
      accentColor="#dc2626"
    >
      <div style={{ display: 'flex', gap: '30px', width: '100%', marginTop: '20px' }}>
         <div 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            flex: 1,
            backgroundColor: '#000',
            padding: '40px',
            borderRadius: '24px',
            color: '#fff',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <span style={{ fontSize: '18px', fontWeight: 900, color: '#94a3b8', marginBottom: '12px', letterSpacing: '0.2em' }}>WITH CASES</span>
          <span style={{ fontSize: '120px', fontWeight: 900, color: '#dc2626', lineHeight: 1 }}>{criminal.percentage}%</span>
        </div>

        <div 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            flex: 1,
            backgroundColor: '#fef2f2',
            padding: '40px',
            borderRadius: '24px',
            border: '1px solid #fee2e2',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
           <span style={{ fontSize: '84px', fontWeight: 900, color: '#991b1b', lineHeight: 1 }}>{criminal.total}</span>
           <span style={{ fontSize: '18px', fontWeight: 900, color: '#dc2626', marginTop: '16px', letterSpacing: '0.1em' }}>TOTAL CANDIDATES</span>
        </div>
      </div>
    </SharedOGLayout>
  );
}

export function generatePartyYoungestCard(partyName: string, candidate: { name: string; age: number; partyColor?: string }) {
  return (
    <SharedOGLayout 
      title="Youth Representation" 
      subtitle={`Promising young leader from ${partyName}`}
      context="Party"
      accentColor={candidate.partyColor}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%', marginTop: '20px' }}>
        <div 
          style={{ 
            display: 'flex', 
            flexDirection: 'column',
            backgroundColor: '#f8fafc',
            padding: '48px 80px',
            borderRadius: '24px',
            borderLeft: `20px solid ${candidate.partyColor || '#EAB308'}`,
            marginBottom: '40px',
            alignItems: 'center'
          }}
        >
          <span style={{ fontSize: '24px', fontWeight: 900, color: '#94a3b8', marginBottom: '16px', letterSpacing: '0.2em' }}>YOUNGEST CANDIDATE</span>
          <span style={{ fontSize: '84px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{candidate.name}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
           <span style={{ fontSize: '18px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Member Age</span>
           <span style={{ fontSize: '64px', fontWeight: 900, color: '#000' }}>{candidate.age} Years</span>
        </div>
      </div>
    </SharedOGLayout>
  );
}

export function generatePartyGenderCard(partyName: string, gender: { female: number; femalePercentage: string }) {
  return (
    <SharedOGLayout 
      title="Women Representation" 
      subtitle={`Participation of women in ${partyName}`}
      context="Party"
      accentColor="#db2777"
    >
      <div style={{ display: 'flex', gap: '30px', width: '100%', marginTop: '20px' }}>
        <div 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            flex: 1.5,
            backgroundColor: '#000',
            padding: '40px',
            borderRadius: '24px',
            color: '#fff',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <span style={{ fontSize: '18px', fontWeight: 900, color: '#94a3b8', marginBottom: '12px', letterSpacing: '0.2em' }}>FEMALE RATIO</span>
          <span style={{ fontSize: '120px', fontWeight: 900, color: '#db2777', lineHeight: 1 }}>{gender.femalePercentage}%</span>
        </div>
        
        <div 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            flex: 1, 
            backgroundColor: '#fdf2f8',
            padding: '40px',
            borderRadius: '24px',
            border: '1px solid #fce7f3',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <span style={{ fontSize: '84px', fontWeight: 900, color: '#9d174d', lineHeight: 1 }}>{gender.female}</span>
          <span style={{ fontSize: '20px', fontWeight: 900, color: '#db2777', marginTop: '16px', letterSpacing: '0.1em' }}>WOMEN FIELDED</span>
        </div>
      </div>
    </SharedOGLayout>
  );
}

export function generatePreElectionDashboardCard(stats: {
  totalCandidatesAnnounced: number;
  partiesWithCandidates: number;
  seatsWithAnnouncedCandidates: number;
  totalConstituencies: number;
}, year: number) {
  return (
    <SharedOGLayout 
      title={`Tamil Nadu ${year} Hub`} 
      subtitle="The central intelligence hub for assembly elections"
      year={year}
    >
      <div style={{ display: 'flex', gap: '32px', width: '100%', marginTop: '20px' }}>
        <div 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            flex: 1,
            backgroundColor: '#f8fafc',
            padding: '32px',
            borderRadius: '24px',
            borderLeft: '12px solid #EAB308'
          }}
        >
          <span style={{ fontSize: '14px', fontWeight: 900, color: '#94a3b8', marginBottom: '8px', letterSpacing: '0.1em' }}>CANDIDATES</span>
          <span style={{ fontSize: '56px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{stats.totalCandidatesAnnounced}</span>
          <span style={{ fontSize: '16px', fontWeight: 600, color: '#64748b', marginTop: '4px' }}>Announced</span>
        </div>
        <div 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            flex: 1,
            backgroundColor: '#f8fafc',
            padding: '32px',
            borderRadius: '24px',
            borderLeft: '12px solid #EAB308'
          }}
        >
          <span style={{ fontSize: '14px', fontWeight: 900, color: '#94a3b8', marginBottom: '8px', letterSpacing: '0.1em' }}>PARTIES</span>
          <span style={{ fontSize: '56px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{stats.partiesWithCandidates}</span>
          <span style={{ fontSize: '16px', fontWeight: 600, color: '#64748b', marginTop: '4px' }}>Fielding</span>
        </div>
        <div 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            flex: 1,
            backgroundColor: '#f8fafc',
            padding: '32px',
            borderRadius: '24px',
            borderLeft: '12px solid #EAB308'
          }}
        >
          <span style={{ fontSize: '14px', fontWeight: 900, color: '#94a3b8', marginBottom: '8px', letterSpacing: '0.1em' }}>CONSTITUENCIES</span>
          <span style={{ fontSize: '56px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{stats.seatsWithAnnouncedCandidates}</span>
          <span style={{ fontSize: '16px', fontWeight: 600, color: '#64748b', marginTop: '4px' }}>Active Battles</span>
        </div>
      </div>
      
      {/* Tracker Status */}
      <div 
        style={{ 
          marginTop: '40px',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#000',
          padding: '12px 24px',
          borderRadius: '100px',
          alignSelf: 'flex-start'
        }}
      >
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EAB308', marginRight: '12px' }} />
        <span style={{ color: '#fff', fontSize: '14px', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Real-time Election Tracker Active
        </span>
      </div>
    </SharedOGLayout>
  );
}
