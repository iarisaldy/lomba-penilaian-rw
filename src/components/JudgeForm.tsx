import React, { useState, useMemo } from 'react';
import { useScore } from '../context/ScoreContext';
import { UserCheck, Lock, Unlock, AlertCircle, MessageSquareText, Check, Shield, Eye, Send, Plus, Minus, CheckCircle2, Search, Filter } from 'lucide-react';

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
  const isBlindRias = activeEventId === 'blind-rias';

  const [searchQuery, setSearchQuery] = useState('');
  const [batchFilter, setBatchFilter] = useState<string>('all');
  const [attendanceFilter, setAttendanceFilter] = useState<'attending' | 'all'>('attending');

  const batchOptions = useMemo(() => {
    const options: string[] = [];
    const step = 20;
    for (let i = 1; i <= participants.length; i += step) {
      const end = Math.min(i + step - 1, participants.length);
      options.push(`${i}-${end}`);
    }
    return options;
  }, [participants.length]);

  const effectiveJudgeId =
    authState.role === 'juri' && authState.judgeId
      ? authState.judgeId
      : activeJudgeId;

  const activeJudge =
    judges.find((j) => j.id === effectiveJudgeId) || judges[0];

  const isAdmin = authState.role === 'admin';
  const isSystemLocked = Boolean(eventInfo.isSystemLocked);

  // Filter participants by search query, batch range, and attendance status
  const filteredParticipants = useMemo(() => {
    return participants.filter((p, index) => {
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

      // 2. Batch Range Filter (only applies if length > 10 and no active search query)
      if (!searchQuery.trim() && participants.length > 10 && batchFilter !== 'all') {
        const num = index + 1;
        const [start, end] = batchFilter.split('-').map(Number);
        if (num < start || num > end) return false;
      }

      return true;
    });
  }, [participants, searchQuery, batchFilter, attendanceFilter]);

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Master System Lock Warning Banner */}
      {isSystemLocked && (
        <div className="bg-red-950/60 border border-red-500/50 rounded-2xl p-4 flex items-center gap-3 shadow-2xl animate-pulse">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center font-bold flex-shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
              🔒 PENILAIAN LOMBA TELAH DITUTUP RESMI SEBAGAI FINAL
            </h3>
            <p className="text-xs text-red-200/90 mt-0.5">
              Seluruh lembar nilai telah dikunci oleh Admin Panitia. Nilai aman dan tidak dapat diubah kembali oleh juri manapun.
            </p>
          </div>
        </div>
      )}

      {/* Admin Read-Only Notice Banner */}
      {isAdmin && !isSystemLocked && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold flex-shrink-0">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-xs sm:text-sm text-white flex items-center gap-2">
                👑 Mode Admin — Pratinjau Lembar Penilaian (Read-Only)
              </h3>
              <p className="text-[11px] sm:text-xs text-amber-200/90 mt-0.5">
                Admin berhak memeriksa lembar juri dan dapat membuka kunci RT secara khusus jika juri mengajukan ralat resmi.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Judge Header Card */}
      <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-2xl p-3.5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-red-400 tracking-wider uppercase mb-0.5">
              <UserCheck className="w-3.5 h-3.5" />
              Lembar Penilaian Resmi ({eventInfo.competitionTitle})
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
              Formulir Penilaian — {activeJudge.name}
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              Sebagai <span className="text-amber-400 font-bold">{activeJudge.name}</span>, Anda memberikan nilai untuk {participants.length} peserta.
            </p>
          </div>

          {/* Selector buttons (ONLY FOR ADMIN TO INSPECT). For Juri, display locked badge! */}
          {isAdmin ? (
            <div className="flex flex-col items-start sm:items-end gap-1 pt-2 sm:pt-0 border-t sm:border-0 border-slate-800">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Shield className="w-3 h-3" /> Pilih Lembar Juri (Inspeksi Admin)
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 w-full sm:w-auto">
                {judges.map((judge) => {
                  const isActive = judge.id === activeJudge.id;
                  return (
                    <button
                      key={judge.id}
                      onClick={() => setActiveJudgeId(judge.id)}
                      className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1 cursor-pointer touch-manipulation ${
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
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] sm:text-xs font-bold text-slate-300 self-start sm:self-auto">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Akses Terkunci Khusus <strong className="text-amber-400">{activeJudge.name}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Search & Batch Filter Toolbar (Especially useful for 100 participants) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 sm:p-4 space-y-3 shadow-lg">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nomor / nama peserta (cth: 025)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 text-slate-100 text-xs rounded-xl pl-9 pr-8 py-2.5 outline-none transition-all placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold bg-slate-800 rounded-full w-4 h-4 flex items-center justify-center"
              >
                ✕
              </button>
            )}
          </div>

          {/* Attendance Toggle & Result Count Indicator */}
          <div className="flex flex-wrap items-center gap-3 justify-between w-full sm:w-auto">
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setAttendanceFilter('attending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  attendanceFilter === 'attending'
                    ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ✅ Hadir ({participants.filter((p) => p.isAttending !== false).length})
              </button>
              <button
                type="button"
                onClick={() => setAttendanceFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  attendanceFilter === 'all'
                    ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                👥 Semua ({participants.length})
              </button>
            </div>

            <div className="text-xs text-slate-400">
              Menampilkan <strong className="text-amber-400">{filteredParticipants.length}</strong> peserta
            </div>
          </div>
        </div>

        {/* Batch Range Filter Tabs (Only shown if participants > 10) */}
        {participants.length > 10 && (
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 mr-1 flex-shrink-0">
              <Filter className="w-3 h-3 text-amber-400" /> Filter:
            </span>
            <button
              onClick={() => setBatchFilter('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border whitespace-nowrap cursor-pointer touch-manipulation ${
                batchFilter === 'all' && !searchQuery
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Semua ({participants.length})
            </button>
            {batchOptions.map((b) => (
              <button
                key={b}
                onClick={() => setBatchFilter(b)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border whitespace-nowrap cursor-pointer touch-manipulation ${
                  batchFilter === b && !searchQuery
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                }`}
              >
                Peserta {b}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cloud Database Maintenance / Offline Notice Banner */}
      {!isRealtimeConnected && (
        <div className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/90 border border-amber-500/50 rounded-2xl p-4 flex items-start gap-3 shadow-2xl animate-pulse">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-200 leading-relaxed space-y-1">
            <h4 className="font-extrabold text-amber-300 text-sm flex items-center gap-2">
              🛠️ PEMBERITAHUAN PEMELIHARAAN SERVER DATABASE CLOUD
            </h4>
            <p className="text-slate-300">
              Server database cloud (Supabase) sedang dalam pemeliharaan berkala atau terkendala koneksi sejenak.{' '}
              <strong className="text-amber-300">Seluruh nilai yang Anda input TETAP TERSIMPAN 100% AMAN di HP Anda (Local Storage)</strong>{' '}
              dan akan otomatis disinkronkan ke server begitu koneksi terhubung kembali. Anda dapat terus mengisi nilai seperti biasa!
            </p>
          </div>
        </div>
      )}

      {/* Rules Notice */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 sm:p-4 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
          <span className="font-bold text-amber-400">Aturan Keamanan Penilaian:</span>{' '}
          {isSepedaHias ? (
            <>
              Nilai yang Anda input/geser <strong className="text-emerald-400">otomatis tersimpan aman di HP</strong> (0 beban server). Setelah selesai menilai SELURUH {participants.length} peserta, tekan tombol hijau <strong className="text-emerald-400">🔒 Kunci & Kirim Seluruh Nilai Juri</strong> untuk menyetorkan nilai sekaligus ke Server Database.
            </>
          ) : (
            <>
              Gunakan tombol <span className="font-bold text-white px-1.5 py-0.5 bg-slate-800 rounded">-</span> dan <span className="font-bold text-white px-1.5 py-0.5 bg-slate-800 rounded">+</span> atau slider. Nilai tersimpan di HP. Setelah selesai, tekan <span className="font-bold text-emerald-400">🔒 Kunci & Kirim</span> untuk menyetorkan nilai ke Server Database.
            </>
          )}
        </div>
      </div>

      {/* Bulk Lock Action Bar (Top) */}
      {!isAdmin && !isSystemLocked && (
        <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border border-emerald-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center flex-shrink-0 font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">
                🔒 {isSepedaHias ? `Kunci & Kirim Seluruh Nilai Sepeda Hias (${participants.length} Peserta)` : 'Selesai Mengisi Nilai? Kunci Seluruh Peserta dalam 1-Klik'}
              </h3>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                Kunci seluruh {participants.length} peserta sekaligus dan setor formulir final juri ({activeJudge.name}) ke Server Database.
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
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap touch-manipulation hover:scale-102"
          >
            <Send className="w-4 h-4" />
            Kunci & Kirim Seluruh Nilai Juri ({participants.length} Peserta)
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
              className={`rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col ${
                isSelf
                  ? 'bg-slate-900/40 border-slate-800/80 opacity-70'
                  : isLocked || isSystemLocked
                  ? 'bg-slate-900/95 border-amber-500/40 shadow-amber-500/5'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-xl'
              }`}
            >
              {/* Card Header */}
              <div
                className={`p-3.5 sm:p-4 border-b flex items-center justify-between ${
                  isSelf
                    ? 'bg-slate-950/50 border-slate-800'
                    : isLocked || isSystemLocked
                    ? 'bg-gradient-to-r from-amber-950/40 via-slate-950 to-amber-950/40 border-amber-500/30'
                    : 'bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`px-2.5 py-1.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center border shadow-inner ${
                      isSelf
                        ? 'bg-slate-800 text-slate-500 border-slate-700'
                        : isLocked || isSystemLocked
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}
                  >
                    No. #{participant.code.replace(/\D/g, '') || participant.code}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-1.5">
                      {participant.name}
                      {participant.rt && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-400 font-bold px-1.5 py-0.5 rounded border border-amber-500/30">
                          {participant.rt}
                        </span>
                      )}
                      {(isLocked || isSystemLocked) && <Lock className="w-3.5 h-3.5 text-amber-400 inline" />}
                    </h3>
                    <span className="text-[10px] sm:text-[11px] text-slate-400">
                      {isSelf ? `Penilaian Silang (${participant.rt || 'RT Sendiri'})` : isLocked || isSystemLocked ? 'Nilai Terkunci Permanen' : 'Peserta Lomba'}
                    </span>
                  </div>
                </div>

                {isSelf ? (
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold bg-slate-800 text-slate-400 px-2.5 py-1 rounded-lg border border-slate-700">
                    <Lock className="w-3 h-3" /> N/A (Terkunci)
                  </span>
                ) : (
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      Total Skor
                    </div>
                    <div className="text-lg sm:text-xl font-black text-amber-400 leading-tight">
                      {subtotal} <span className="text-xs text-slate-500 font-normal">/ {criteria.reduce((a,c) => a + c.maxScore, 0)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Card Body - Criteria Inputs */}
              <div className="p-3.5 sm:p-4 space-y-3.5 sm:space-y-4 flex-1">
                {isSelf ? (
                  <div className="py-6 text-center px-4 space-y-1.5">
                    <Lock className="w-7 h-7 text-slate-600 mx-auto" />
                    <p className="text-xs font-medium text-slate-400">
                      Juri <span className="text-white font-bold">{activeJudge.name}</span> tidak menilai <span className="text-white font-bold">{participant.name} ({participant.rt || 'RT Sendiri'})</span>.
                    </p>
                    <p className="text-[11px] text-amber-400/90 font-semibold">
                      🔒 Aturan Penilaian Silang: Peserta dari RT yang sama bernilai N/A dan dihitung murni dari Juri RT lainnya.
                    </p>
                  </div>
                ) : (
                  criteria.map((crit) => {
                    const currentValue = participantScores[crit.id] ?? 0;

                    return (
                      <div key={crit.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-200">
                            {crit.name}
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            Maks <strong className="text-amber-400">{crit.maxScore}</strong>
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
                            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200 font-bold flex items-center justify-center flex-shrink-0 touch-manipulation border border-slate-700"
                            title="Kurangi 1"
                          >
                            <Minus className="w-3.5 h-3.5" />
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
                            className={`w-full h-3 rounded-lg appearance-none accent-amber-500 touch-pan-x ${
                              isInputDisabled ? 'bg-slate-800 opacity-50 cursor-not-allowed' : 'bg-slate-800 cursor-pointer'
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
                            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200 font-bold flex items-center justify-center flex-shrink-0 touch-manipulation border border-slate-700"
                            title="Tambah 1"
                          >
                            <Plus className="w-3.5 h-3.5" />
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
                            className={`w-11 sm:w-13 bg-slate-950 border border-slate-700 text-center text-xs font-bold text-white rounded-lg py-1.5 focus:outline-none focus:border-amber-500 transition-colors flex-shrink-0 ${
                              isInputDisabled ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          />
                        </div>

                        {/* Quick Rating Preset Buttons for 1-10 Scale */}
                        {crit.maxScore === 10 && !isInputDisabled && (
                          <div className="flex items-center justify-between gap-1 pt-1.5 overflow-x-auto scrollbar-none">
                            <span className="text-[10px] text-slate-500 font-semibold flex-shrink-0">Pilih Cepat:</span>
                            <div className="flex items-center gap-1">
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
                                  className={`w-6 h-6 rounded-md text-[11px] font-black transition-all border ${
                                    currentValue === quickVal
                                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm scale-110'
                                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
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
                <div className="p-3 bg-slate-950/90 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400 font-medium text-center sm:text-left">
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
                          ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
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
                    <div className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold text-xs bg-slate-900 border border-amber-500/30 text-amber-400 select-none">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Nilai Terkunci</span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bulk Lock Action Bar (Bottom - Sangat membantu untuk Lomba Sepeda Hias 30-100 Peserta) */}
      {!isAdmin && !isSystemLocked && (
        <div className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-emerald-950/90 border border-emerald-500/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center flex-shrink-0 font-bold">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                🔒 Selesai Menilai? Kunci & Kirim Seluruh Nilai Juri ({activeJudge.name})
              </h3>
              <p className="text-xs text-emerald-200/90 mt-0.5">
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
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-xl shadow-emerald-500/30 transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap touch-manipulation hover:scale-102"
          >
            <Send className="w-5 h-5" />
            Kunci & Kirim Seluruh Nilai ({participants.length} Peserta)
          </button>
        </div>
      )}

      {/* General Notes per Judge */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-white">
          <MessageSquareText className="w-4 h-4 text-amber-400" />
          Catatan / Kritik & Saran Juri ({activeJudge.name})
          <span className="text-[11px] text-slate-400 font-normal">{isAdmin ? '(Read-Only Admin)' : '(Opsional)'}</span>
        </div>
        <textarea
          rows={3}
          value={judgeNotes[activeJudge.id] || ''}
          disabled={isAdmin || isSystemLocked}
          onChange={(e) => updateJudgeGeneralNotes(activeJudge.id, e.target.value)}
          placeholder={isAdmin ? `[Read-Only Admin] Catatan dari ${activeJudge.name}` : `Tuliskan catatan, tanggapan, atau kesan untuk seluruh penampilan lomba bagi ${activeJudge.name}...`}
          className={`w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition-colors ${
            isAdmin || isSystemLocked ? 'opacity-50 cursor-not-allowed' : 'focus:border-slate-600'
          }`}
        />
      </div>
    </div>
  );
};
