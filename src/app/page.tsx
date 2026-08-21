'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { JudgeForm } from '../components/JudgeForm';
import { RecapDashboard } from '../components/RecapDashboard';
import { OfficialPrintView } from '../components/OfficialPrintView';
import { PinLoginModal } from '../components/PinLoginModal';
import { useScore } from '../context/ScoreContext';
import { Trophy, Code2 } from 'lucide-react';

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
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
      {/* Show PIN Login Modal if guest */}
      {authState.role === 'guest' && <PinLoginModal />}

      {/* Header component */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'juri' && <JudgeForm />}
        {activeTab === 'rekap' && <RecapDashboard />}
        {activeTab === 'print' && <OfficialPrintView />}
      </main>

      {/* Footer License */}
      <footer className="bg-white border-t border-slate-200 py-5 text-center text-xs text-slate-600 no-print mt-12 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Sistem Penilaian Lomba HUT Kemerdekaan RI Ke-81 • Permata Discovery</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Code2 className="w-3.5 h-3.5 text-red-600" />
            <span>Designed & Developed by <strong className="text-slate-900 font-bold tracking-wide">Irfan Arisaldy</strong> © 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
