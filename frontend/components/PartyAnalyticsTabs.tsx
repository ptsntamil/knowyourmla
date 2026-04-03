"use client";

import { useState } from "react";
import { Users, GraduationCap, Wallet, Shield, UserPlus, Info } from "lucide-react";
import PartyEducationInsights from "./PartyEducationInsights";
import PartyGenderInsights from "./PartyGenderInsights";
import PartyCriminalInsights from "./PartyCriminalInsights";
import PartyOccupationInsights from "./PartyOccupationInsights";
import PartyFinancialInsights from "./PartyFinancialInsights";
import PartyAnalyticsCards from "./PartyAnalyticsCards";

interface PartyAnalyticsTabsProps {
  analytics: any;
  isYearView?: boolean;
}

export default function PartyAnalyticsTabs({ analytics, isYearView }: PartyAnalyticsTabsProps) {
  const [activeTab, setActiveTab] = useState("demographics");

  const tabs = [
    { id: "demographics", label: "Demographics", icon: Users },
    { id: "education", label: "Education", icon: GraduationCap },
    { id: "assets", label: "Assets", icon: Wallet },
    { id: "criminal", label: "Criminal", icon: Shield },
    { id: "repeat", label: "New vs Repeat", icon: UserPlus },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "demographics":
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <PartyAnalyticsCards analytics={analytics} isYearView={isYearView} />
            <PartyGenderInsights data={analytics.gender} />
          </div>
        );
      case "education":
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <PartyEducationInsights data={analytics.education} />
            <PartyOccupationInsights data={analytics.occupation} />
          </div>
        );
      case "assets":
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
             <PartyFinancialInsights data={analytics.assets} />
          </div>
        );
      case "criminal":
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <PartyCriminalInsights data={analytics.criminal} />
          </div>
        );
      case "repeat":
        return (
          <div className="bg-bg-card rounded-[2.5rem] p-8 sm:p-12 border border-border-subtle text-center space-y-6 animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-bg-surface text-text-primary rounded-3xl flex items-center justify-center mx-auto">
              <UserPlus size={40} />
            </div>
            <div className="space-y-2 max-w-lg mx-auto">
              <h3 className="text-2xl font-black text-text-primary uppercase tracking-tight">Candidate Experience Mix</h3>
              <p className="text-sm font-medium text-text-muted">Analysis of first-time vs veteran candidates for this selection.</p>
            </div>
            <div className="grid grid-cols-2 gap-8 max-w-sm mx-auto pt-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">New Faces</p>
                <p className="text-4xl font-black text-text-primary">{analytics.stats.newCandidates || 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Repeat</p>
                <p className="text-4xl font-black text-text-accent">{analytics.stats.repeatCandidates || 0}</p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div id="analytics" className="space-y-8">
       <div className="flex items-center gap-4">
        <div className="p-3 bg-bg-surface text-text-accent rounded-2xl shrink-0">
          <Info size={20} />
        </div>
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-text-primary uppercase tracking-tight">Candidate Analytics</h3>
          <p className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-widest">Detailed profile breakdowns</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap shadow-sm border
                  ${
                    activeTab === tab.id
                      ? "bg-bg-accent text-text-inverse border-border-accent"
                      : "bg-bg-card text-text-muted border-border-subtle hover:border-border-accent/30"
                  }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="min-h-[400px]">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
