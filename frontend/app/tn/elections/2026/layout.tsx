import React from 'react';
import ElectionNavTabs from '@/components/election/tn2026/ElectionNavTabs';

export default function Election2026Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <ElectionNavTabs />
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
