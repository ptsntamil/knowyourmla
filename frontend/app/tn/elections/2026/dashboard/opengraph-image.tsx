import { ImageResponse } from 'next/og';
import { getTamilNaduPreElectionDashboardData } from '@/lib/elections/preElectionDashboard/getTamilNaduPreElectionDashboardData';
import { generatePreElectionDashboardCard, OG_SIZE } from '@/lib/seo/election-og-templates';

export const alt = 'Tamil Nadu 2026 Election Dashboard';
export const size = OG_SIZE;
export const contentType = 'image/png';

export default async function Image() {
  const year = 2026;
  
  try {
    const data = await getTamilNaduPreElectionDashboardData();
    
    if (!data || !data.stats) {
      throw new Error("No dashboard data found");
    }

    return new ImageResponse(
      generatePreElectionDashboardCard(data.stats, year),
      { ...size }
    );
  } catch (error) {
    console.error('Error generating Dashboard OG image:', error);
    
    // Fallback minimalistic card
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
          padding: '80px',
        }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            borderLeft: '12px solid #EAB308',
            paddingLeft: '40px'
          }}>
            <h1 style={{ fontSize: '72px', fontWeight: 900, color: '#0f172a', margin: 0, textTransform: 'uppercase' }}>
              TN Election {year}
            </h1>
            <p style={{ fontSize: '32px', color: '#64748b', fontWeight: 700, margin: '16px 0 0 0' }}>
              Election Intelligence Dashboard
            </p>
          </div>
          <div style={{ position: 'absolute', bottom: '60px', right: '80px', display: 'flex' }}>
             <span style={{ fontSize: '24px', fontWeight: 900, color: '#000', letterSpacing: '0.2em' }}>
              KNOWYOURMLA
            </span>
          </div>
        </div>
      ),
      { ...size }
    );
  }
}
