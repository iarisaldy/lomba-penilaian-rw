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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden relative flex flex-col space-y-4">
        
        {/* Permata Housing Hero Banner Header */}
        <div className="relative h-36 w-full overflow-hidden flex items-end justify-center pb-4">
          <Image
            src="/permata_housing.jpg"
            alt="Perumahan Permata Discovery"
            fill
            sizes="100vw"
            className="object-cover object-center filter brightness-[0.7]"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />
          
          <div className="relative z-10 text-center space-y-1.5 px-4">
            <div className="bg-white/95 backdrop-blur-sm px-3.5 py-1.5 rounded-2xl shadow-xl border border-slate-200 inline-block mb-1">
              <Image
                src="/permata_logo.png"
                alt="Permata Discovery Logo"
                width={130}
                height={35}
                className="h-6 w-auto object-contain"
                priority
              />
            </div>
            <p className="text-[11px] font-extrabold text-red-700 uppercase tracking-wider bg-white/80 px-2.5 py-0.5 rounded-full inline-block shadow-sm">
              {eventInfo?.eventName || 'HUT KEMERDEKAAN RI KE-81'} • {eventInfo?.location || 'PERMATA DISCOVERY'}
            </p>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* Modal Title */}
          <div className="text-center space-y-1">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center justify-center gap-2">
              <KeyRound className="w-5 h-5 text-red-600" />
              Sistem Penilaian Lomba
            </h2>
            <p className="text-xs text-red-700 font-bold bg-red-50 border border-red-200 py-1 px-3.5 rounded-full inline-block mt-1">
              {eventInfo?.competitionTitle || 'LOMBA SEPEDA HIAS'}
            </p>
            <p className="text-xs text-slate-600 pt-1">
              Masukkan PIN Akses Juri / Ketua RT 1-6 atau PIN Admin Panitia.
            </p>
          </div>

          {/* Form Input */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block text-center">
                PIN Akses (4 Digit)
              </label>
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                className="w-full bg-slate-50 border-2 border-slate-300 text-center font-mono font-black text-2xl tracking-[0.5em] text-slate-900 rounded-2xl py-3 focus:outline-none focus:border-red-500 focus:bg-white transition-all shadow-inner"
                autoFocus
              />
            </div>

            {errorMsg && (
              <div className="text-xs text-red-700 bg-red-50 border border-red-300 rounded-xl p-2.5 text-center font-bold">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-red-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
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
