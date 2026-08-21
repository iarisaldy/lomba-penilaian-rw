'use client';

import React, { useState, useMemo } from 'react';
import { useScore } from '../context/ScoreContext';
import { UserCheck, Lock, Unlock, AlertCircle, MessageSquareText, Check, Shield, Eye, Send, Plus, Minus, CheckCircle2, Search, Filter } from 'lucide-react';

const RT_LIST = ['RT 01', 'RT 02', 'RT 03', 'RT 04', 'RT 05', 'RT 06'];

export const JudgeForm: React.FC = () => {
  const {
    judges,
    participants,
    criteria,
    eventInfo,
    scores,
    judgeNotes,
    activeJudgeId,
    setActiveJudgeId,
    updateCriteriaScore,
    updateJudgeGeneralNotes,
    getParticipantSubtotal,
    authState,
    toggleCardLock,
    lockAllCardsForJudge,
    isCardLocked,
    isRealtimeConnected,
    activeEventId,
  } = useScore();

  const isSepedaHias = activeEventId === 'sepeda-hias';

  const [searchQuery, setSearchQuery] = useState('');
  const [rtFilter, setRtFilter] = useState<string>('all');
  const [attendanceFilter, setAttendanceFilter] = useState<'attending' | 'all'>('attending');

  const effectiveJudgeId =
    authState.role === 'juri' && authState.judgeId
      ? authState.judgeId
      : activeJudgeId;

  const activeJudge =
    judges.find((j) => j.id === effectiveJudgeId) || judges[0];

  const isAdmin = authState.role === 'admin';
  const isSystemLocked = Boolean(eventInfo.isSystemLocked);

  // Count participants per RT
  const rtCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    RT_LIST.forEach(rt => {
      counts[rt] = participants.filter(p => (p.rt || '').trim().toUpperCase() === rt).length;
    });
    return counts;
  }, [participants]);

  // Filter participants by search query, RT filter, and attendance status
  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      // 0. Attendance Filter (default: only show present participants)
      if (attendanceFilter === 'attending' && p.isAttending === false) {
        return false;
      }

      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesCode = p.code.toLowerCase().includes(query);
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesRt = (p.rt || '').toLowerCase().includes(query);
        if (!matchesCode && !matchesName && !matchesRt) return false;
      }

      // 2. RT Filter
      if (rtFilter !== 'all') {
        const pRt = (p.rt || '').trim().toUpperCase();
        if (pRt !== rtFilter.toUpperCase()) return false;
      }

      return true;
    });
  }, [participants, searchQuery, rtFilter, attendanceFilter]);

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Master System Lock Warning Banner */}
      {isSystemLocked && (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 flex items-center gap-3 shadow-md">
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 border border-red-300 flex items-center justify-center font-bold flex-shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-red-900 flex items-center gap-2">
              🔒 PENILAIAN LOMBA TELAH DITUTUP RESMI SEBAGAI FINAL
            </h3>
            <p className="text-xs text-red-700 mt-0.5 font-medium">
              Seluruh lembar nilai telah dikunci oleh Admin Panitia. Nilai aman dan tidak dapat diubah kembali oleh juri manapun.
            </p>
          </div>
        </div>
      )}

      {/* Admin Read-Only Notice Banner */}
      {isAdmin && !isSystemLocked && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center font-bold flex-shrink-0">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-xs sm:text-sm text-amber-950 flex items-center gap-2">
                👑 Mode Admin — Pratinjau Lembar Penilaian (Read-Only)
              </h3>
              <p className="text-[11px] sm:text-xs text-amber-800 mt-0.5 font-medium">
                Admin berhak memeriksa lembar juri dan dapat membuka kunci kartu secara khusus jika juri mengajukan ralat resmi.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Judge Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-red-700 tracking-wider uppercase mb-0.5">
              <UserCheck className="w-3.5 h-3.5" />
              Lembar Penilaian Resmi ({eventInfo.competitionTitle})
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              Formulir Penilaian — {activeJudge.name}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5 font-medium">
              Sebagai <span className="text-red-700 font-extrabold">{activeJudge.name}</span>, Anda memberikan nilai untuk {participants.length} peserta lomba.
            </p>
          </div>

          {/* Selector buttons (ONLY FOR ADMIN TO INSPECT). For Juri, display locked badge! */}
          {isAdmin ? (
            <div className="flex flex-col items-start sm:items-end gap-1.5 pt-2 sm:pt-0 border-t sm:border-0 border-slate-200">
              <span className="text-[10px] text-amber-800 font-extrabold uppercase tracking-wider flex items-center gap-1">
                <Shield className="w-3 h-3" /> Pilih Lembar Juri (Inspeksi Admin)
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 w-full sm:w-auto">
                {judges.map((judge) => {
                  const isActive = judge.id === activeJudge.id;
                  return (
                    <button
                      key={judge.id}
                      onClick={() => setActiveJudgeId(judge.id)}
                      className={`py-1.5 px-2.5 rounded-xl text-xs font-extrabold transition-all border flex items-center justify-center gap-1 cursor-pointer touch-manipulation active:scale-95 ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md font-black scale-105'
                          : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <span>{judge.code}</span>
                      {isActive && <Check className="w-3.5 h-3.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-800 self-start sm:self-auto shadow-sm">
              <Lock className="w-4 h-4 text-red-600" />
              <span>Akses Terkunci Khusus <strong className="text-red-700">{activeJudge.name}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Search & RT Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 space-y-3 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nomor / nama peserta (cth: 025 / Ameena)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 focus:border-red-500 focus:bg-white text-slate-900 text-xs font-semibold rounded-xl pl-9 pr-8 py-2.5 outline-none transition-all placeholder:text-slate-400 shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 text-xs font-bold bg-slate-200 rounded-full w-4 h-4 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Attendance Toggle & Result Count Indicator */}
          <div className="flex flex-wrap items-center gap-3 justify-between w-full sm:w-auto">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setAttendanceFilter('attending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  attendanceFilter === 'attending'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ✅ Hadir ({participants.filter((p) => p.isAttending !== false).length})
              </button>
              <button
                type="button"
                onClick={() => setAttendanceFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  attendanceFilter === 'all'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                👥 Semua ({participants.length})
              </button>
            </div>

            <div className="text-xs text-slate-600 font-semibold">
              Menampilkan <strong className="text-red-700 font-extrabold">{filteredParticipants.length}</strong> peserta
            </div>
          </div>
        </div>

        {/* RT Filter Tabs (Semua, RT 01, RT 02, RT 03, RT 04, RT 05, RT 06) */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1">
          <span className="text-[11px] text-slate-600 font-bold uppercase tracking-wider flex items-center gap-1 mr-1 flex-shrink-0">
            <Filter className="w-3.5 h-3.5 text-red-600" /> Filter RT:
          </span>
          <button
            onClick={() => setRtFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all border whitespace-nowrap cursor-pointer touch-manipulation active:scale-95 ${
              rtFilter === 'all'
                ? 'bg-red-600 text-white border-red-600 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Semua ({participants.length})
          </button>
          {RT_LIST.map((rt) => {
            const isSelected = rtFilter === rt;
            const count = rtCounts[rt] || 0;
            return (
              <button
                key={rt}
                onClick={() => setRtFilter(rt)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all border whitespace-nowrap cursor-pointer touch-manipulation active:scale-95 ${
                  isSelected
                    ? 'bg-red-600 text-white border-red-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {rt} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Cloud Offline Notice Banner */}
      {!isRealtimeConnected && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 leading-relaxed space-y-1">
            <h4 className="font-extrabold text-amber-900 text-sm flex items-center gap-2">
              🛠️ PEMBERITAHUAN KONEKSI LOKAL (OFFLINE AMAN)
            </h4>
            <p>
              Server cloud sedang dalam pemeliharaan sejenak.{' '}
              <strong className="text-amber-950 font-bold">Seluruh nilai yang Anda input TETAP TERSIMPAN 100% AMAN di HP Anda (Local Storage)</strong>{' '}
              dan akan otomatis disinkronkan ke server begitu online. Anda dapat terus menilai seperti biasa!
            </p>
          </div>
        </div>
      )}

      {/* Rules Notice */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 flex items-start gap-2.5 shadow-sm">
        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-[11px] sm:text-xs text-slate-700 leading-relaxed">
          <span className="font-extrabold text-red-700">Aturan Penilaian Resmi:</span>{' '}
          {isSepedaHias ? (
            <>
              Nilai yang Anda masukkan <strong className="text-emerald-700 font-bold">otomatis tersimpan aman di HP</strong>. Setelah selesai menilai seluruh peserta, tekan tombol hijau <strong className="text-emerald-700 font-bold">🔒 Kunci & Kirim Seluruh Nilai</strong> untuk menyetorkan lembar nilai ke Server Panitia.
            </>
          ) : (
            <>
              Gunakan tombol <span className="font-bold text-slate-900 px-1.5 py-0.5 bg-slate-200 rounded">-</span> dan <span className="font-bold text-slate-900 px-1.5 py-0.5 bg-slate-200 rounded">+</span> atau slider. Nilai tersimpan di HP. Setelah selesai, tekan <span className="font-bold text-emerald-700">🔒 Kunci & Kirim</span>.
            </>
          )}
        </div>
      </div>

      {/* Bulk Lock Action Bar (Top) */}
      {!isAdmin && !isSystemLocked && (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center flex-shrink-0 font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-emerald-950">
                🔒 {isSepedaHias ? `Kunci & Kirim Seluruh Nilai Sepeda Hias (${participants.length} Peserta)` : 'Selesai Mengisi Nilai? Kunci Seluruh Peserta dalam 1-Klik'}
              </h3>
              <p className="text-xs text-emerald-800 mt-0.5 font-medium">
                Kunci seluruh {participants.length} peserta sekaligus dan setor formulir final juri ({activeJudge.name}) ke Server Panitia.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  `🔒 Apakah Anda yakin ingin mengunci SELURUH nilai ${participants.length} peserta untuk ${activeJudge.name}?\n\nNilai yang sudah dikunci akan dikirim ke Server & Database dan tidak dapat diubah kembali oleh juri!`
                )
              ) {
                lockAllCardsForJudge(activeJudge.id);
                alert(`✅ Berhasil! Seluruh ${participants.length} peserta untuk ${activeJudge.name} telah dikunci permanen & tersimpan di Database Cloud.`);
              }
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap touch-manipulation"
          >
            <Send className="w-4 h-4" />
            Kunci & Kirim Seluruh Nilai Juri ({participants.length} Peserta)
          </button>
        </div>
      )}

      {/* Participant Scoring Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {filteredParticipants.map((participant) => {
          const isSelf = isSepedaHias
            ? Boolean(
                participant?.rt &&
                (String(activeJudge?.code || '').toLowerCase().includes(String(participant.rt || '').trim().toLowerCase()) ||
                 String(activeJudge?.name || '').toLowerCase().includes(String(participant.rt || '').trim().toLowerCase()))
              )
            : Boolean(
                (activeJudge?.code && participant?.code && activeJudge.code === participant.code) ||
                (activeJudge?.name && participant?.name && activeJudge.name === participant.name)
              );
          const jScores = scores[activeJudge.id] || {};
          const pEntry = jScores[participant.id] || jScores[participant.id.replace(/^p_/, '')] || jScores[`p_${participant.id}`];
          const participantScores = pEntry?.scores || {};
          const subtotal = getParticipantSubtotal(activeJudge.id, participant.id);
          const isLocked = isCardLocked(activeJudge.id, participant.id);
          const isInputDisabled = isAdmin || isLocked || isSystemLocked;

          return (
            <div
              key={participant.id}
              className={`rounded-2xl border-2 transition-all duration-300 overflow-hidden flex flex-col ${
                isSelf
                  ? 'bg-slate-100/90 border-slate-200 opacity-75'
                  : isLocked || isSystemLocked
                  ? 'bg-emerald-50/40 border-emerald-300 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md'
              }`}
            >
              {/* Card Header */}
              <div
                className={`p-3.5 sm:p-4 border-b flex items-center justify-between ${
                  isSelf
                    ? 'bg-slate-100 border-slate-200'
                    : isLocked || isSystemLocked
                    ? 'bg-emerald-100/50 border-emerald-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`px-2.5 py-1.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center border shadow-sm ${
                      isSelf
                        ? 'bg-slate-200 text-slate-500 border-slate-300'
                        : isLocked || isSystemLocked
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-red-600 text-white border-red-700'
                    }`}
                  >
                    No. #{participant.code.replace(/\D/g, '') || participant.code}
                  </div>
                  <div>
                    <h3 className="font-black text-sm sm:text-base text-slate-900 flex items-center gap-1.5">
                      {participant.name}
                      {participant.rt && (
                        <span className="text-[11px] bg-blue-100 text-blue-800 font-extrabold px-2 py-0.5 rounded-full border border-blue-200">
                          {participant.rt}
                        </span>
                      )}
                      {(isLocked || isSystemLocked) && <Lock className="w-3.5 h-3.5 text-emerald-600 inline" />}
                    </h3>
                    <span className="text-[10px] sm:text-[11px] text-slate-500 font-semibold">
                      {isSelf ? `Penilaian Silang (${participant.rt || 'RT Sendiri'})` : isLocked || isSystemLocked ? 'Nilai Terkunci Permanen' : 'Peserta Sepeda Hias'}
                    </span>
                  </div>
                </div>

                {isSelf ? (
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold bg-slate-200 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-300">
                    <Lock className="w-3 h-3" /> N/A (RT Sendiri)
                  </span>
                ) : (
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold">
                      Total Skor
                    </div>
                    <div className="text-lg sm:text-xl font-black text-red-700 leading-tight">
                      {subtotal} <span className="text-xs text-slate-400 font-normal">/ {criteria.reduce((a,c) => a + c.maxScore, 0)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Card Body - Criteria Inputs */}
              <div className="p-3.5 sm:p-4 space-y-3.5 sm:space-y-4 flex-1">
                {isSelf ? (
                  <div className="py-6 text-center px-4 space-y-1.5">
                    <Lock className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs font-semibold text-slate-700">
                      Juri <span className="text-slate-900 font-extrabold">{activeJudge.name}</span> tidak menilai anak dari RT-nya sendiri: <span className="text-slate-900 font-extrabold">{participant.name} ({participant.rt || 'RT Sendiri'})</span>.
                    </p>
                    <p className="text-[11px] text-amber-800 font-bold bg-amber-50 p-2 rounded-xl border border-amber-200 mt-2">
                      🔒 Aturan Penilaian Silang: Peserta dinilai adil oleh 5 Juri RT lainnya.
                    </p>
                  </div>
                ) : (
                  criteria.map((crit) => {
                    const currentValue = participantScores[crit.id] ?? 0;

                    return (
                      <div key={crit.id} className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-slate-800">
                            {crit.name}
                          </span>
                          <span className="text-slate-500 text-[11px] font-semibold">
                            Maks <strong className="text-red-700 font-black">{crit.maxScore}</strong>
                          </span>
                        </div>

                        {/* Touch-Friendly Mobile Slider & Stepper Controls */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={isInputDisabled || currentValue <= 0}
                            onClick={() =>
                              updateCriteriaScore(
                                activeJudge.id,
                                participant.id,
                                crit.id,
                                Math.max(0, currentValue - 1)
                              )
                            }
                            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-30 disabled:cursor-not-allowed text-slate-900 font-black text-sm flex items-center justify-center flex-shrink-0 touch-manipulation border border-slate-300 shadow-sm"
                            title="Kurangi 1"
                          >
                            <Minus className="w-4 h-4" />
                          </button>

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
                            className={`w-full h-3 rounded-lg appearance-none accent-red-600 touch-pan-x ${
                              isInputDisabled ? 'bg-slate-200 opacity-50 cursor-not-allowed' : 'bg-slate-200 cursor-pointer'
                            }`}
                          />

                          <button
                            type="button"
                            disabled={isInputDisabled || currentValue >= crit.maxScore}
                            onClick={() =>
                              updateCriteriaScore(
                                activeJudge.id,
                                participant.id,
                                crit.id,
                                Math.min(crit.maxScore, currentValue + 1)
                              )
                            }
                            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-30 disabled:cursor-not-allowed text-slate-900 font-black text-sm flex items-center justify-center flex-shrink-0 touch-manipulation border border-slate-300 shadow-sm"
                            title="Tambah 1"
                          >
                            <Plus className="w-4 h-4" />
                          </button>

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
                            className={`w-12 sm:w-14 bg-slate-50 border-2 border-slate-300 text-center text-sm font-black text-slate-900 rounded-xl py-1.5 focus:outline-none focus:border-red-500 focus:bg-white transition-colors flex-shrink-0 shadow-inner ${
                              isInputDisabled ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          />
                        </div>

                        {/* Quick Rating Preset Buttons for 1-10 Scale */}
                        {crit.maxScore === 10 && !isInputDisabled && (
                          <div className="flex items-center justify-between gap-1 pt-1 overflow-x-auto scrollbar-none">
                            <span className="text-[11px] text-slate-600 font-bold flex-shrink-0">Pilih Cepat:</span>
                            <div className="flex items-center gap-1.5">
                              {[1, 5, 6, 7, 8, 9, 10].map((quickVal) => (
                                <button
                                  key={quickVal}
                                  type="button"
                                  onClick={() =>
                                    updateCriteriaScore(
                                      activeJudge.id,
                                      participant.id,
                                      crit.id,
                                      quickVal
                                    )
                                  }
                                  className={`w-7 h-7 rounded-lg text-xs font-black transition-all border cursor-pointer active:scale-90 ${
                                    currentValue === quickVal
                                      ? 'bg-red-600 text-white border-red-700 shadow-md scale-110'
                                      : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
                                  }`}
                                >
                                  {quickVal}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Card Footer: Action area per participant */}
              {!isSelf && (
                <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-600 font-semibold text-center sm:text-left">
                    {isSystemLocked
                      ? '🔒 Penilaian Final Terkunci'
                      : isLocked
                      ? '🔒 Nilai dikunci permanen'
                      : 'Edit nilai aktif'}
                  </span>

                  {/* ADMIN CAN UNLOCK CARD IF REQUESTED; JURI ONCE LOCKED CANNOT UNLOCK */}
                  {isAdmin ? (
                    <button
                      onClick={() => toggleCardLock(activeJudge.id, participant.id)}
                      className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                        isLocked
                          ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                          : 'bg-slate-200 text-slate-800 border border-slate-300 hover:bg-slate-300'
                      }`}
                    >
                      {isLocked ? (
                        <>
                          <Unlock className="w-3.5 h-3.5" /> Buka Kunci (Admin Ralat)
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" /> Kunci Nilai {participant.code}
                        </>
                      )}
                    </button>
                  ) : isLocked ? (
                    <div className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold text-xs bg-emerald-100 border border-emerald-300 text-emerald-800 select-none">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span>Nilai Terkunci</span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bulk Lock Action Bar (Bottom) */}
      {!isAdmin && !isSystemLocked && (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center flex-shrink-0 font-bold">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-emerald-950 flex items-center gap-2">
                🔒 Selesai Menilai? Kunci & Kirim Seluruh Nilai Juri ({activeJudge.name})
              </h3>
              <p className="text-xs text-emerald-800 mt-0.5 font-medium">
                Kirim seluruh nilai {participants.length} peserta sekaligus ke Database Server & Kunci permanen.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  `🔒 Apakah Anda yakin ingin mengunci & menyetorkan SELURUH nilai ${participants.length} peserta untuk ${activeJudge.name} ke Server Database?\n\nNilai yang sudah dikunci tidak dapat diubah kembali oleh juri!`
                )
              ) {
                lockAllCardsForJudge(activeJudge.id);
                alert(`✅ Berhasil! Seluruh ${participants.length} peserta untuk ${activeJudge.name} telah berhasil dikunci permanen & tersimpan di Database Cloud.`);
              }
            }}
            className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap touch-manipulation"
          >
            <Send className="w-5 h-5" />
            Kunci & Kirim Seluruh Nilai ({participants.length} Peserta)
          </button>
        </div>
      )}

      {/* General Notes per Judge */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900">
          <MessageSquareText className="w-4 h-4 text-red-600" />
          Catatan / Kritik & Saran Juri ({activeJudge.name})
          <span className="text-[11px] text-slate-500 font-normal">{isAdmin ? '(Read-Only Admin)' : '(Opsional)'}</span>
        </div>
        <textarea
          rows={3}
          value={judgeNotes[activeJudge.id] || ''}
          disabled={isAdmin || isSystemLocked}
          onChange={(e) => updateJudgeGeneralNotes(activeJudge.id, e.target.value)}
          placeholder={isAdmin ? `[Read-Only Admin] Catatan dari ${activeJudge.name}` : `Tuliskan catatan, tanggapan, atau kesan untuk seluruh penampilan lomba bagi ${activeJudge.name}...`}
          className={`w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-red-500 transition-colors shadow-inner ${
            isAdmin || isSystemLocked ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        />
      </div>
    </div>
  );
};
