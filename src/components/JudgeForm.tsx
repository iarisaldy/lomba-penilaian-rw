'use client';

import React from 'react';
import { useScore } from '../context/ScoreContext';
import { UserCheck, Lock, Unlock, AlertCircle, MessageSquareText, Check, Shield, Eye, Send } from 'lucide-react';

export const JudgeForm: React.FC = () => {
  const {
    judges,
    participants,
    criteria,
    scores,
    judgeNotes,
    activeJudgeId,
    setActiveJudgeId,
    updateCriteriaScore,
    updateJudgeGeneralNotes,
    getParticipantSubtotal,
    authState,
    toggleCardLock,
    isCardLocked,
  } = useScore();

  // If user is logged in as a specific Juri, force activeJudge to their own judgeId
  const effectiveJudgeId =
    authState.role === 'juri' && authState.judgeId
      ? authState.judgeId
      : activeJudgeId;

  const activeJudge =
    judges.find((j) => j.id === effectiveJudgeId) || judges[0];

  const isAdmin = authState.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Admin Read-Only Notice Banner */}
      {isAdmin && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold flex-shrink-0">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                👑 Mode Admin — Pratinjau Lembar Penilaian (Read-Only)
              </h3>
              <p className="text-xs text-amber-200/90 mt-0.5">
                Admin hanya berhak memantau & memeriksa isian juri. Input nilai dikunci khusus untuk Juri RT bersangkutan.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Judge Header Card */}
      <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-red-400 tracking-wider uppercase mb-1">
              <UserCheck className="w-4 h-4" />
              Lembar Penilaian Resmi
            </div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Formulir Penilaian — {activeJudge.name}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Sebagai <span className="text-amber-400 font-bold">{activeJudge.name}</span>, Anda memberikan nilai untuk 5 RT peserta lainnya.
            </p>
          </div>

          {/* Selector buttons (ONLY FOR ADMIN TO INSPECT). For Juri, display locked badge! */}
          {isAdmin ? (
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Shield className="w-3 h-3" /> Pilih Lembar Juri (Inspeksi Admin)
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {judges.map((judge) => {
                  const isActive = judge.id === activeJudge.id;
                  return (
                    <button
                      key={judge.id}
                      onClick={() => setActiveJudgeId(judge.id)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-b from-amber-500 to-amber-600 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20 scale-105'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      <span>{judge.code}</span>
                      {isActive && <Check className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Akses Terkunci Khusus <strong className="text-amber-400">{activeJudge.name}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Rules Notice */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <span className="font-bold text-amber-400">Aturan Penilaian:</span> Berikan nilai pada kartu masing-masing RT. Setiap kartu RT memiliki tombol <span className="font-bold text-emerald-400">🔒 Kunci & Submit Nilai</span> sendiri agar skor RT tersebut aman dan tidak tersenggol.
        </div>
      </div>

      {/* Participants Scoring Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {participants.map((participant) => {
          const isSelf = activeJudge.code === participant.code;
          const participantScores = scores[activeJudge.id]?.[participant.id]?.scores || {};
          const subtotal = getParticipantSubtotal(activeJudge.id, participant.id);
          const isLocked = isCardLocked(activeJudge.id, participant.id);
          const isInputDisabled = isAdmin || isLocked;

          return (
            <div
              key={participant.id}
              className={`rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col ${
                isSelf
                  ? 'bg-slate-900/40 border-slate-800/80 opacity-70'
                  : isLocked
                  ? 'bg-slate-900/90 border-amber-500/40 shadow-amber-500/5'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-xl'
              }`}
            >
              {/* Card Header */}
              <div
                className={`p-4 border-b flex items-center justify-between ${
                  isSelf
                    ? 'bg-slate-950/50 border-slate-800'
                    : isLocked
                    ? 'bg-gradient-to-r from-amber-950/40 via-slate-950 to-amber-950/40 border-amber-500/30'
                    : 'bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl font-black text-sm flex items-center justify-center border shadow-inner ${
                      isSelf
                        ? 'bg-slate-800 text-slate-500 border-slate-700'
                        : isLocked
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}
                  >
                    {participant.code}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                      {participant.name}
                      {isLocked && <Lock className="w-3.5 h-3.5 text-amber-400 inline" />}
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      {isSelf ? 'RT Sendiri' : isLocked ? 'Nilai Terkunci Aman' : 'Peserta Lomba'}
                    </span>
                  </div>
                </div>

                {isSelf ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-slate-800 text-slate-400 px-2.5 py-1 rounded-lg border border-slate-700">
                    <Lock className="w-3 h-3" /> N/A (Terkunci)
                  </span>
                ) : (
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      Total Skor
                    </div>
                    <div className="text-lg font-black text-amber-400">
                      {subtotal} <span className="text-xs text-slate-500 font-normal">/ 100</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Card Body - Criteria Inputs */}
              <div className="p-4 space-y-4 flex-1">
                {isSelf ? (
                  <div className="py-8 text-center px-4 space-y-2">
                    <Lock className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs font-medium text-slate-400">
                      Juri <span className="text-white font-bold">{activeJudge.code}</span> tidak memberikan nilai untuk <span className="text-white font-bold">{participant.code}</span>.
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Nilai RT sendiri dikecualikan dari perhitungan (N/A).
                    </p>
                  </div>
                ) : (
                  criteria.map((crit) => {
                    const currentValue = participantScores[crit.id] ?? 0;

                    return (
                      <div key={crit.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-300">
                            {crit.name}
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            Maks <strong className="text-slate-200">{crit.maxScore}</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min={0}
                            max={crit.maxScore}
                            value={currentValue}
                            disabled={isInputDisabled}
                            onChange={(e) =>
                              updateCriteriaScore(
                                activeJudge.id,
                                participant.id,
                                crit.id,
                                Number(e.target.value)
                              )
                            }
                            className={`w-full h-2 rounded-lg appearance-none accent-red-500 ${
                              isInputDisabled ? 'bg-slate-800 opacity-50 cursor-not-allowed' : 'bg-slate-800 cursor-pointer'
                            }`}
                          />
                          <input
                            type="number"
                            min={0}
                            max={crit.maxScore}
                            value={currentValue}
                            disabled={isInputDisabled}
                            onChange={(e) => {
                              const val = Math.min(
                                crit.maxScore,
                                Math.max(0, Number(e.target.value))
                              );
                              updateCriteriaScore(
                                activeJudge.id,
                                participant.id,
                                crit.id,
                                val
                              );
                            }}
                            placeholder="0"
                            className={`w-14 bg-slate-950 border border-slate-700 text-center text-xs font-bold text-white rounded-lg py-1.5 focus:outline-none focus:border-red-500 transition-colors ${
                              isInputDisabled ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Per-RT Card Lock / Submit Button */}
              {!isSelf && !isAdmin && (
                <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {isLocked ? '🔒 Nilai RT dikunci' : 'Edit nilai aktif'}
                  </span>
                  <button
                    onClick={() => toggleCardLock(activeJudge.id, participant.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      isLocked
                        ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                    }`}
                  >
                    {isLocked ? (
                      <>
                        <Unlock className="w-3.5 h-3.5" /> Edit Nilai
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" /> Kunci & Kirim {participant.code}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* General Notes per Judge */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <MessageSquareText className="w-4 h-4 text-amber-400" />
          Catatan / Kritik & Saran Juri ({activeJudge.name})
          <span className="text-xs text-slate-400 font-normal">{isAdmin ? '(Read-Only Admin)' : '(Opsional)'}</span>
        </div>
        <textarea
          rows={3}
          value={judgeNotes[activeJudge.id] || ''}
          disabled={isAdmin}
          onChange={(e) => updateJudgeGeneralNotes(activeJudge.id, e.target.value)}
          placeholder={isAdmin ? `[Read-Only Admin] Catatan dari ${activeJudge.name}` : `Tuliskan catatan, tanggapan, atau kesan untuk seluruh penampilan lomba bagi ${activeJudge.name}...`}
          className={`w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition-colors ${
            isAdmin ? 'opacity-50 cursor-not-allowed' : 'focus:border-slate-600'
          }`}
        />
      </div>
    </div>
  );
};
