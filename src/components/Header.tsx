'use client';

import React from 'react';
import { useScore } from '../context/ScoreContext';
import { EVENT_INFO } from '../data/competitionDefaults';
import {
  Trophy,
  ClipboardCheck,
  FileText,
  CheckCircle2,
  LogOut,
  Wifi,
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'juri' | 'rekap' | 'print';
  setActiveTab: (tab: 'juri' | 'rekap' | 'print') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const {
    isLoaded,
    authState,
    logout,
    isRealtimeConnected,
  } = useScore();

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-xl no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Brand & Event Title */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-400 p-0.5 shadow-lg flex-shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Trophy className="w-6 h-6 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {EVENT_INFO.eventName}
                </span>
                <span className="text-slate-400 text-xs font-medium">
                  {EVENT_INFO.location}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                {EVENT_INFO.competitionTitle}
              </h1>
            </div>
          </div>

          {/* User Auth Badge & Connection Status */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Auth Badge */}
            {authState.role !== 'guest' && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-slate-200 shadow-inner">
                {authState.role === 'admin' ? (
                  <span className="text-amber-400 flex items-center gap-1">👑 {authState.judgeName}</span>
                ) : (
                  <span className="text-red-400 flex items-center gap-1">👤 {authState.judgeName}</span>
                )}
                <button
                  onClick={logout}
                  className="text-slate-400 hover:text-red-400 ml-1 transition-colors cursor-pointer"
                  title="Keluar / Ganti PIN"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Connection status indicator */}
            {isLoaded && (
              isRealtimeConnected ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 font-semibold">
                  <Wifi className="w-3 h-3 animate-pulse text-emerald-400" /> Realtime Live
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 font-semibold">
                  <CheckCircle2 className="w-3 h-3" /> Auto-Saved (Lokal)
                </span>
              )
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-t border-slate-800 mt-2 space-x-1 sm:space-x-4 overflow-x-auto scrollbar-none py-1">
          <button
            onClick={() => setActiveTab('juri')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'juri'
                ? 'border-red-500 text-red-400 bg-red-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-t-lg'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            Formulir Penilaian Juri
          </button>

          <button
            onClick={() => setActiveTab('rekap')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'rekap'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-t-lg'
            }`}
          >
            <Trophy className="w-4 h-4" />
            Rekapitulasi & Pemenang
          </button>

          <button
            onClick={() => setActiveTab('print')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'print'
                ? 'border-blue-500 text-blue-400 bg-blue-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-t-lg'
            }`}
          >
            <FileText className="w-4 h-4" />
            Cetak Berita Acara (PDF)
          </button>
        </div>
      </div>
    </header>
  );
};
