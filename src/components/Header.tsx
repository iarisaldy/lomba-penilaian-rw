'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useScore } from '../context/ScoreContext';
import { AdminConfigModal } from './AdminConfigModal';
import {
  Trophy,
  ClipboardCheck,
  FileText,
  CheckCircle2,
  LogOut,
  Wifi,
  Settings,
  Lock,
  Building2,
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'juri' | 'rekap' | 'print';
  setActiveTab: (tab: 'juri' | 'rekap' | 'print') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const {
    activeEventId,
    switchEvent,
    eventInfo,
    isLoaded,
    authState,
    logout,
    isRealtimeConnected,
  } = useScore();

  const [isConfigOpen, setIsConfigOpen] = useState(false);

  return (
    <>
      <header className="bg-slate-900/95 border-b border-slate-800/80 text-white sticky top-0 z-30 shadow-2xl backdrop-blur-md no-print relative overflow-hidden">
        
        {/* Subtle Housing Facade Overlay */}
        <div className="absolute inset-0 opacity-5 pointer-events-none mix-blend-overlay bg-cover bg-center" style={{ backgroundImage: "url('/permata_housing.jpg')" }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="py-3.5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
            
            {/* Permata Discovery Brand & Event Title */}
            <div className="flex items-center space-x-3">
              <div className="bg-white p-2 rounded-2xl shadow-lg border border-slate-200/80 flex items-center justify-center flex-shrink-0">
                <Image
                  src="/permata_logo.png"
                  alt="Permata Discovery Logo"
                  width={140}
                  height={38}
                  className="h-7 w-auto object-contain"
                  priority
                />
              </div>

              <div className="border-l border-slate-800 pl-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-gradient-to-r from-red-600/20 to-amber-600/20 text-red-400 border border-red-500/30 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-amber-400" /> {eventInfo.eventName}
                  </span>
                  <span className="text-slate-400 text-xs font-semibold">
                    {eventInfo.location}
                  </span>
                  {eventInfo.isSystemLocked && (
                    <span className="bg-red-600 text-white font-extrabold text-[10px] uppercase px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm animate-pulse">
                      <Lock className="w-3 h-3" /> Penilaian Final (Terkunci)
                    </span>
                  )}
                </div>
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-amber-200 bg-clip-text text-transparent mt-0.5">
                  {eventInfo.competitionTitle}
                </h1>
              </div>
            </div>

            {/* User Auth Badge & Controls */}
            <div className="flex flex-wrap items-center gap-2">

              {/* Admin Config Button */}
              {authState.role === 'admin' && (
                <button
                  onClick={() => setIsConfigOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/40 text-amber-300 text-xs font-extrabold transition-all cursor-pointer shadow-sm"
                >
                  <Settings className="w-4 h-4 text-amber-400" />
                  <span>Pengaturan Lomba & Kriteria</span>
                </button>
              )}

              {/* Auth Badge */}
              {authState.role !== 'guest' && (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-950/90 border border-slate-700/80 text-xs font-bold text-slate-200 shadow-inner">
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
          <div className="flex border-t border-slate-800/80 mt-2 space-x-1 sm:space-x-4 overflow-x-auto scrollbar-none py-1">
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

      {/* Admin Settings Modal */}
      <AdminConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
      />
    </>
  );
};
