'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useScore } from '../context/ScoreContext';
import { ShieldCheck, KeyRound } from 'lucide-react';

export const PinLoginModal: React.FC = () => {
  const { loginWithPin, eventInfo } = useScore();
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
              {eventInfo?.eventName || 'HUT KEMERDEKAAN RI KE-81'} • {eventInfo?.location || 'PERMATA DISCOVERY'}
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
            <p className="text-xs text-amber-300 font-semibold bg-amber-500/10 border border-amber-500/20 py-1 px-3 rounded-full inline-block mt-1">
              {eventInfo?.competitionTitle || 'LOMBA SEPEDA HIAS'}
            </p>
            <p className="text-[11px] text-slate-400 pt-1">
              Masukkan PIN Akses Juri / Ketua RT 1-6 atau PIN Admin Panitia.
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
        </div>

      </div>
    </div>
  );
};
