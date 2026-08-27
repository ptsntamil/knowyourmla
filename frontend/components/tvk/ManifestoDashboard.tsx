'use client';

import React, { useState, useMemo } from 'react';
import { ManifestoPromise } from '@/lib/data/manifesto';
import ManifestoCard from './ManifestoCard';
import ManifestoDrawer from './ManifestoDrawer';
import { Search } from 'lucide-react';

interface ManifestoDashboardProps {
  initialData: ManifestoPromise[];
}

export default function ManifestoDashboard({ initialData }: ManifestoDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'MEASURABLE' | 'DIRECTIVE'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedPromise, setSelectedPromise] = useState<ManifestoPromise | null>(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    initialData.forEach(p => cats.add(p.Category));
    return ['All', ...Array.from(cats)];
  }, [initialData]);

  // Filtering Logic
  const filteredData = useMemo(() => {
    return initialData.filter(promise => {
      // 1. Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        promise.Promise_Title.toLowerCase().includes(searchLower) ||
        promise.Description.toLowerCase().includes(searchLower) ||
        promise.Policy_Instrument_or_Budget.toLowerCase().includes(searchLower) ||
        promise.Notes.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // 2. Category filter
      if (selectedCategory !== 'All' && promise.Category !== selectedCategory) {
        return false;
      }

      // 3. Type filter
      const isDirective = promise.Implementation_Status === 'Non-Measurable (Directive Standard)';
      if (typeFilter === 'MEASURABLE' && isDirective) return false;
      if (typeFilter === 'DIRECTIVE' && !isDirective) return false;

      // 4. Status filter (from KPI clicks)
      if (statusFilter && promise.Implementation_Status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [initialData, searchTerm, selectedCategory, typeFilter, statusFilter]);

  // KPI Calculations
  const kpis = useMemo(() => {
    return {
      total: initialData.length,
      implemented: initialData.filter(p => p.Implementation_Status === 'Implemented').length,
      partially: initialData.filter(p => p.Implementation_Status === 'Partially Implemented').length,
      budgetAllocated: initialData.filter(p => p.Implementation_Status === 'Budget Allocated').length,
      inProgress: initialData.filter(p => p.Implementation_Status === 'In Progress').length,
      pending: initialData.filter(p => p.Implementation_Status === 'Pending').length,
      directives: initialData.filter(p => p.Implementation_Status === 'Non-Measurable (Directive Standard)').length,
    };
  }, [initialData]);

  return (
    <div className="space-y-8 relative">

      {/* KPI Summary Bar */}
      <div className="bg-white rounded-3xl shadow-sm border border-border p-8">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Implementation Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 text-center">
          <button
            onClick={() => setStatusFilter(null)}
            className={`p-4 rounded-2xl border transition-all ${statusFilter === null ? 'bg-slate-200 border-slate-300 shadow-inner scale-95' : 'bg-slate-50 border-slate-100 hover:bg-slate-100 hover:-translate-y-1'}`}
          >
            <div className="text-3xl font-bold text-slate-800">{kpis.total}</div>
            <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Total</div>
          </button>
          <button
            onClick={() => setStatusFilter('Implemented')}
            className={`p-4 rounded-2xl border transition-all ${statusFilter === 'Implemented' ? 'bg-brand-green/20 border-brand-green/40 shadow-inner scale-95' : 'bg-brand-green/10 border-brand-green/20 hover:bg-brand-green/20 hover:-translate-y-1'}`}
          >
            <div className="text-3xl font-bold text-brand-green">{kpis.implemented}</div>
            <div className="text-[10px] text-brand-green font-black uppercase tracking-widest mt-1">Implemented</div>
          </button>
          <button
            onClick={() => setStatusFilter('Partially Implemented')}
            className={`p-4 rounded-2xl border transition-all ${statusFilter === 'Partially Implemented' ? 'bg-brand-gold/20 border-brand-gold/40 shadow-inner scale-95' : 'bg-brand-gold/10 border-brand-gold/20 hover:bg-brand-gold/20 hover:-translate-y-1'}`}
          >
            <div className="text-3xl font-bold text-brand-gold">{kpis.partially}</div>
            <div className="text-[10px] text-brand-gold font-black uppercase tracking-widest mt-1">Partially</div>
          </button>
          <button
            onClick={() => setStatusFilter('Budget Allocated')}
            className={`p-4 rounded-2xl border transition-all ${statusFilter === 'Budget Allocated' ? 'bg-brand-yellow/20 border-brand-yellow/40 shadow-inner scale-95' : 'bg-brand-yellow/10 border-brand-yellow/20 hover:bg-brand-yellow/20 hover:-translate-y-1'}`}
          >
            <div className="text-3xl font-bold text-brand-yellow">{kpis.budgetAllocated}</div>
            <div className="text-[10px] text-brand-yellow font-black uppercase tracking-widest mt-1">Budgeted</div>
          </button>
          <button
            onClick={() => setStatusFilter('In Progress')}
            className={`p-4 rounded-2xl border transition-all ${statusFilter === 'In Progress' ? 'bg-brand-dark/10 border-brand-dark/20 shadow-inner scale-95' : 'bg-brand-dark/5 border-brand-dark/10 hover:bg-brand-dark/10 hover:-translate-y-1'}`}
          >
            <div className="text-3xl font-bold text-brand-dark">{kpis.inProgress}</div>
            <div className="text-[10px] text-brand-dark font-black uppercase tracking-widest mt-1">In Progress</div>
          </button>
          <button
            onClick={() => setStatusFilter('Pending')}
            className={`p-4 rounded-2xl border transition-all ${statusFilter === 'Pending' ? 'bg-slate-200 border-slate-300 shadow-inner scale-95' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 hover:-translate-y-1'}`}
          >
            <div className="text-3xl font-bold text-slate-600">{kpis.pending}</div>
            <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Pending</div>
          </button>
          <button
            onClick={() => setStatusFilter('Non-Measurable (Directive Standard)')}
            className={`p-4 rounded-2xl border transition-all ${statusFilter === 'Non-Measurable (Directive Standard)' ? 'bg-brand-green-100 border-brand-green-200 shadow-inner scale-95' : 'bg-brand-green-50 border-brand-green-100 hover:bg-brand-green-100 hover:-translate-y-1'}`}
          >
            <div className="text-3xl font-bold text-brand-green-800">{kpis.directives}</div>
            <div className="text-[10px] text-brand-green-800 font-black uppercase tracking-widest mt-1">Directives</div>
          </button>
        </div>

        {/* <div className="mt-6 pt-6 border-t border-border flex flex-col md:flex-row justify-between items-center bg-brand-gold/5 border border-brand-gold/10 p-5 rounded-2xl">
          <span className="text-xs font-black text-brand-gold uppercase tracking-widest">Fiscal Impact Estimate</span>
          <span className="text-sm text-slate-700 mt-2 md:mt-0">Total Welfare Outlay: <strong className="text-brand-dark">~₹1,00,000 Cr/year</strong> (+52% vs FY 2025–26 DMK baseline) | Fiscal Deficit Limit: <strong>3.00% GSDP</strong> (₹1,21,819 Cr)</span>
        </div> */}
      </div>

      {/* Filter & View Controls */}
      <div className="bg-white rounded-3xl shadow-sm border border-border p-6 space-y-6">

        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          {/* Search */}
          <div className="relative w-full md:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search promises, descriptions, GO numbers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-11 pr-4 py-3 border border-border rounded-full leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-gold focus:border-brand-gold sm:text-sm transition-all"
            />
          </div>

          {/* Type Toggle Switch */}
          <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200">
            <button
              onClick={() => setTypeFilter('ALL')}
              className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-full transition-all ${typeFilter === 'ALL' ? 'bg-white shadow-sm text-brand-dark' : 'text-slate-500 hover:text-slate-700'}`}
            >
              All
            </button>
            <button
              onClick={() => setTypeFilter('MEASURABLE')}
              className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-full transition-all ${typeFilter === 'MEASURABLE' ? 'bg-white shadow-sm text-brand-dark' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Measurable
            </button>
            <button
              onClick={() => setTypeFilter('DIRECTIVE')}
              className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-full transition-all ${typeFilter === 'DIRECTIVE' ? 'bg-white shadow-sm text-brand-dark' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Directives
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex overflow-x-auto pb-2 custom-scrollbar gap-3">
          {categories.map(category => {
            const count = category === 'All'
              ? initialData.length
              : initialData.filter(p => p.Category === category).length;

            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`whitespace-nowrap px-5 py-2.5 rounded-full text-[10px] font-black tracking-widest uppercase transition-all border shadow-sm ${selectedCategory === category
                  ? 'bg-brand-dark text-white border-brand-dark'
                  : 'bg-white text-slate-500 border-border hover:border-slate-300 hover:bg-slate-50'
                  }`}
              >
                {category} <span className="ml-1 opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredData.length > 0 ? (
          filteredData.map(promise => (
            <ManifestoCard
              key={promise.Promise_ID}
              promise={promise}
              onClick={setSelectedPromise}
            />
          ))
        ) : (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-border border-dashed">
            <h3 className="text-lg font-bold text-brand-dark uppercase tracking-wider">No promises found</h3>
            <p className="mt-2 text-sm text-slate-500">Try adjusting your search or filters to find what you're looking for.</p>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      <ManifestoDrawer
        promise={selectedPromise}
        isOpen={selectedPromise !== null}
        onClose={() => setSelectedPromise(null)}
      />
    </div>
  );
}
