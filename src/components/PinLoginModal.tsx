'use client';

import React, { useState } from 'react';
import { useScore } from '../context/ScoreContext';
import { EVENT_INFO } from '../data/competitionDefaults';
import { KeyRound, ShieldCheck } from 'lucide-react';

export const PinLoginModal: React.FC = () => {
  const { loginWithPin } = useScore();
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!pin) {
      setErrorMsg('Silakan masukkan PIN Anda!');
      return;
    }

    const res = loginWithPin(pin);
    if (!res.success) {
      setErrorMsg(res.message || 'PIN salah!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative overflow-hidden">
        
        {/* Top Glow Background */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-400 p-0.5 shadow-xl mx-auto flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <KeyRound className="w-8 h-8 text-amber-400 animate-pulse" />
            </div>
          </div>
          <div>
            <span className="text-[11px] font-bold text-red-400 uppercase tracking-widest bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 rounded-full">
              {EVENT_INFO.eventName}
            </span>
            <h2 className="text-xl font-extrabold text-white mt-1">
              Masukkan PIN Akses
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Masukkan PIN Juri RT Anda atau PIN Admin Panitia ({EVENT_INFO.competitionTitle}).
            </p>
          </div>
        </div>

        {/* Form Input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 block text-center">
              PIN (4 Digit)
            </label>
            <input
              type="password"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              className="w-full bg-slate-950 border border-slate-700 text-center font-mono font-black text-2xl tracking-[0.5em] text-white rounded-2xl py-3 focus:outline-none focus:border-red-500 transition-all shadow-inner"
              autoFocus
            />
          </div>

          {errorMsg && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-2.5 text-center font-medium">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            Masuk Aplikasi
          </button>
        </form>

      </div>
    </div>
  );
};
