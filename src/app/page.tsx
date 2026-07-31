'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { JudgeForm } from '../components/JudgeForm';
import { RecapDashboard } from '../components/RecapDashboard';
import { OfficialPrintView } from '../components/OfficialPrintView';
import { PinLoginModal } from '../components/PinLoginModal';
import { useScore } from '../context/ScoreContext';
import { Trophy } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'juri' | 'rekap' | 'print'>('juri');
  const { authState, isLoaded } = useScore();

  // If user logs in as Admin, navigate to Recap or keep tab.
  useEffect(() => {
    if (authState.role === 'admin') {
      setActiveTab('rekap');
    } else if (authState.role === 'juri') {
      setActiveTab('juri');
    }
  }, [authState.role]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Show PIN Login Modal if guest */}
      {isLoaded && authState.role === 'guest' && <PinLoginModal />}

      {/* Header component */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'juri' && <JudgeForm />}
        {activeTab === 'rekap' && <RecapDashboard />}
        {activeTab === 'print' && <OfficialPrintView />}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900/60 border-t border-slate-800/80 py-4 text-center text-xs text-slate-500 no-print mt-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-medium">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Sistem Penilaian Lomba HUT Kemerdekaan RI Ke-81 • Permata Discovery</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Dibuat untuk memudahkan Panitia Sie Acara & Siap Deploy di <span className="text-white font-bold">Vercel</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
