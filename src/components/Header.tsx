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
    participants,
    isLoaded,
    authState,
    logout,
    isRealtimeConnected,
  } = useScore();

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [configTab, setConfigTab] = useState<'info' | 'criteria' | 'participants' | 'judges' | 'attendance'>('attendance');

  const attendingCount = (participants || []).filter(p => p.isAttending !== false).length;
  const totalParticipants = (participants || []).length;

  return (
    <>
      <header className="bg-white/95 border-b border-slate-200 text-slate-900 sticky top-0 z-30 shadow-md backdrop-blur-md no-print relative overflow-hidden">
        
        {/* Subtle Housing Facade Overlay */}
        <div className="absolute inset-0 opacity-5 pointer-events-none mix-blend-multiply bg-cover bg-center" style={{ backgroundImage: "url('/permata_housing.jpg')" }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="py-3.5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
            
            {/* Permata Discovery Brand & Event Title */}
            <div className="flex items-center space-x-3">
              <div className="bg-white p-1.5 rounded-2xl shadow border border-slate-200 flex items-center justify-center flex-shrink-0">
                <Image
                  src="/permata_logo.png"
                  alt="Permata Discovery Logo"
                  width={140}
                  height={38}
                  className="h-7 w-auto object-contain"
                  priority
                />
              </div>

              <div className="border-l-2 border-slate-200 pl-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-red-50 text-red-700 border border-red-200 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-red-600" /> {eventInfo?.eventName || 'HUT KEMERDEKAAN RI KE-81'}
                  </span>
                  <span className="text-slate-600 text-xs font-bold">
                    {eventInfo?.location || 'PERMATA DISCOVERY'}
                  </span>
                  {eventInfo?.isSystemLocked && (
                    <span className="bg-red-600 text-white font-extrabold text-[10px] uppercase px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm animate-pulse">
                      <Lock className="w-3 h-3" /> Penilaian Final (Terkunci)
                    </span>
                  )}
                </div>
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 mt-0.5">
                  {eventInfo?.competitionTitle || 'LOMBA SEPEDA HIAS'}
                </h1>
              </div>
            </div>

            {/* User Auth Badge & Controls */}
            <div className="flex flex-wrap items-center gap-2">
              
              {/* Combined Cloud Realtime Connection Status Badge */}
              {isLoaded && (
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border shadow-sm ${
                    isRealtimeConnected
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-amber-50 border-amber-300 text-amber-800 animate-pulse'
                  }`}
                  title={
                    isRealtimeConnected
                      ? 'Terhubung ke Database Cloud Supabase (Live Sync 15ms)'
                      : 'Database Cloud sedang pemeliharaan. Nilai tersimpan aman di HP (Local Storage)!'
                  }
                >
                  <span className={`w-2 h-2 rounded-full ${isRealtimeConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-[11px] font-extrabold">
                    {isRealtimeConnected ? 'Cloud Realtime Live' : 'Cloud Offline (Aman)'}
                  </span>
                </div>
              )}

              {/* Admin Actions: Direct Absensi & Settings Buttons */}
              {authState.role === 'admin' && (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      setConfigTab('attendance');
                      setIsConfigOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-800 text-xs font-extrabold transition-all cursor-pointer shadow-sm active:scale-95"
                    title="Buka Check-in Absensi Peserta Lomba"
                  >
                    <ClipboardCheck className="w-4 h-4 text-blue-600" />
                    <span>📋 Absensi ({attendingCount}/{totalParticipants} Hadir)</span>
                  </button>

                  <button
                    onClick={() => {
                      setConfigTab('criteria');
                      setIsConfigOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 text-xs font-extrabold transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <Settings className="w-4 h-4 text-amber-600" />
                    <span>⚙️ Pengaturan</span>
                  </button>
                </div>
              )}

              {/* Auth Badge */}
              {authState.role !== 'guest' && (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-extrabold text-slate-800 shadow-sm">
                  {authState.role === 'admin' ? (
                    <span className="text-amber-700 flex items-center gap-1 font-black">👑 {authState.judgeName}</span>
                  ) : (
                    <span className="text-red-700 flex items-center gap-1 font-black">👤 {authState.judgeName}</span>
                  )}
                  <button
                    onClick={logout}
                    className="text-slate-400 hover:text-red-600 ml-1 transition-colors cursor-pointer p-0.5 rounded hover:bg-slate-200"
                    title="Keluar / Ganti PIN"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Navigation Tabs */}
          <div className="flex border-t border-slate-200 mt-2 space-x-1 sm:space-x-4 overflow-x-auto scrollbar-none py-1">
            <button
              onClick={() => setActiveTab('juri')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-extrabold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'juri'
                  ? 'border-red-600 text-red-600 bg-red-50/80 rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-t-lg'
              }`}
            >
              <ClipboardCheck className="w-4 h-4" />
              Formulir Penilaian Juri
            </button>

            <button
              onClick={() => setActiveTab('rekap')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-extrabold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'rekap'
                  ? 'border-amber-600 text-amber-700 bg-amber-50/80 rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-t-lg'
              }`}
            >
              <Trophy className="w-4 h-4" />
              Rekapitulasi & Pemenang
            </button>

            <button
              onClick={() => setActiveTab('print')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-extrabold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'print'
                  ? 'border-blue-600 text-blue-700 bg-blue-50/80 rounded-t-lg'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-t-lg'
              }`}
            >
              <FileText className="w-4 h-4" />
              Cetak Berita Acara (PDF)
            </button>
          </div>
        </div>
      </header>

      {/* Admin Settings Modal */}
      {isConfigOpen && (
        <AdminConfigModal
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
          initialTab={configTab}
        />
      )}
    </>
  );
};
