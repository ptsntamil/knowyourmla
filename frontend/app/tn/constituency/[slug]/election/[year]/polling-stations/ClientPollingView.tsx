'use client';

import React, { useState } from 'react';
import { ConstituencyPollingData } from '@/lib/services/election-analytics.service';
import CandidateComparisonSelector from '@/components/election/polling/CandidateComparisonSelector';
import PollingStationTable from '@/components/election/polling/PollingStationTable';
import WinnerFilterCards from '@/components/election/polling/WinnerFilterCards';

interface ClientPollingViewProps {
  initialData: ConstituencyPollingData;
  slug: string;
  year: number;
}

const ClientPollingView: React.FC<ClientPollingViewProps> = ({ initialData, slug, year }) => {
  // Select all candidates by default for comparison
  const defaultSelected = initialData.pollingStations[0]?.candidateResults
    .map(r => r.candidateId) || [];

  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>(defaultSelected);
  const [selectedWinnerId, setSelectedWinnerId] = useState<string | null>(null);

  // Extract unique candidates across all stations (usually same for all)
  const candidates = initialData.pollingStations[0]?.candidateResults.map(r => ({
    id: r.candidateId,
    name: r.name,
    partyShort: r.partyShort,
    colorBg: r.partyColorBg,
    colorText: r.partyColorText
  })) || [];

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-8">
        <CandidateComparisonSelector 
          candidates={candidates}
          selectedCandidateIds={selectedCandidateIds}
          onChange={setSelectedCandidateIds}
        />

        <div className="pt-8 border-t border-slate-50">
          <WinnerFilterCards 
            stations={initialData.pollingStations}
            selectedWinnerId={selectedWinnerId}
            onSelectWinner={setSelectedWinnerId}
          />
        </div>
      </div>

      <PollingStationTable 
        stations={initialData.pollingStations}
        constituencySlug={slug}
        year={year}
        selectedCandidateIds={selectedCandidateIds}
        selectedWinnerId={selectedWinnerId}
        onResetWinnerFilter={() => setSelectedWinnerId(null)}
      />
    </div>
  );
};

export default ClientPollingView;
