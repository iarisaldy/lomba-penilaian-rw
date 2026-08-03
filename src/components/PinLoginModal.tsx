'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useScore } from '../context/ScoreContext';
import { ShieldCheck, ChevronDown, ChevronUp, HelpCircle, KeyRound } from 'lucide-react';

export const PinLoginModal: React.FC = () => {
  const { loginWithPin, eventInfo, judges } = useScore();
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showCheatSheet, setShowCheatSheet] = useState(false);

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

  const handleQuickPinSelect = (selectedPin: string) => {
    setPin(selectedPin);
    setErrorMsg('');
    const res = loginWithPin(selectedPin);
    if (!res.success) {
      setErrorMsg(res.message || 'PIN salah!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden relative flex flex-col space-y-5">
        
        {/* Permata Housing Hero Banner Header */}
        <div className="relative h-36 w-full overflow-hidden flex items-end justify-center pb-4">
          <Image
            src="/permata_housing.jpg"
            alt="Perumahan Permata Discovery"
            fill
            className="object-cover object-center filter brightness-[0.4]"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
          
          <div className="relative z-10 text-center space-y-1.5 px-4">
            <div className="bg-white/95 backdrop-blur-sm px-3.5 py-1.5 rounded-2xl shadow-xl border border-white/40 inline-block mb-1">
              <Image
                src="/permata_logo.png"
                alt="Permata Discovery Logo"
                width={130}
                height={35}
                className="h-6 w-auto object-contain"
                priority
              />
            </div>
            <p className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
              {eventInfo.eventName} • {eventInfo.location}
            </p>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* Modal Title */}
          <div className="text-center space-y-1">
            <h2 className="text-lg font-extrabold text-white flex items-center justify-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-400" />
              Sistem Penilaian Lomba
            </h2>
            <p className="text-xs text-slate-400">
              Masukkan PIN Juri RT atau PIN Admin Panitia ({eventInfo.competitionTitle}).
            </p>
          </div>

          {/* Form Input */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 block text-center">
                PIN Akses (4 Digit)
              </label>
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                className="w-full bg-slate-950 border border-slate-700 text-center font-mono font-black text-2xl tracking-[0.5em] text-white rounded-2xl py-3 focus:outline-none focus:border-amber-400 transition-all shadow-inner"
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
              className="w-full py-3 bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-red-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              Masuk Aplikasi
            </button>
          </form>

          {/* PIN Quick Select Cheat Sheet (Bantuan Panitia & Juri) */}
          <div className="border-t border-slate-800/80 pt-3">
            <button
              onClick={() => setShowCheatSheet(!showCheatSheet)}
              className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 transition-colors py-1.5 px-3 rounded-xl bg-slate-950/60 border border-slate-800/80"
            >
              <span className="flex items-center gap-1.5 font-medium text-[11px]">
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                Bantuan PIN Juri & Admin Panitia
              </span>
              {showCheatSheet ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showCheatSheet && (
              <div className="mt-2.5 bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs space-y-2 max-h-48 overflow-y-auto">
                <p className="text-[11px] text-slate-400 font-medium">
                  Klik salah satu PIN di bawah untuk memilih:
                </p>
                
                <div className="grid grid-cols-2 gap-2">
                  {judges.map((j) => (
                    <button
                      key={j.id}
                      onClick={() => handleQuickPinSelect(j.pin)}
                      className="p-2 bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl text-left transition-all hover:bg-slate-800 flex items-center justify-between cursor-pointer"
                    >
                      <span className="font-semibold text-slate-300 text-xs">{j.name}</span>
                      <span className="font-mono text-amber-400 font-bold text-xs">{j.pin}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-1.5 border-t border-slate-800">
                  <button
                    onClick={() => handleQuickPinSelect(eventInfo.adminPin)}
                    className="w-full p-2 bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-500/30 hover:border-amber-400 rounded-xl transition-all text-left flex items-center justify-between cursor-pointer"
                  >
                    <span className="font-bold text-amber-400 text-xs">👑 Admin Panitia / Ketua RW</span>
                    <span className="font-mono text-white font-bold text-xs">{eventInfo.adminPin}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
