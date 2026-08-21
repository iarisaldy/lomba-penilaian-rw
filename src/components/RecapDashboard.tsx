'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useScore } from '../context/ScoreContext';
import { Trophy, Medal, Users, MessageSquare, RotateCcw, ShieldAlert, Download, Lock, Unlock, FileCheck2, Filter, Search } from 'lucide-react';
import confetti from 'canvas-confetti';

const RT_LIST = ['RT 01', 'RT 02', 'RT 03', 'RT 04', 'RT 05', 'RT 06'];

export const RecapDashboard: React.FC = () => {
  const { judges, participants, recapData, judgeNotes, scores, authState, resetAllData, eventInfo, toggleMasterSystemLock, exportJSON, isCardLocked } = useScore();
  const [confirmPin, setConfirmPin] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetError, setResetError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [recapRtFilter, setRecapRtFilter] = useState<string>('all');

  const formatParticipantLabel = (code?: string, name?: string) => {
    const cleanCode = String(code || '').trim();
    const cleanName = String(name || '').trim();
    if (cleanName && !cleanName.toLowerCase().startsWith('peserta')) {
      return cleanName;
    }
    if (cleanCode) {
      return cleanCode.toLowerCase().includes('peserta') ? cleanCode : `Peserta #${cleanCode}`;
    }
    return 'Peserta';
  };

  const filteredRecapParticipants = useMemo(() => {
    return participants.filter(p => {
      // 1. RT Filter
      if (recapRtFilter !== 'all') {
        const pRt = (p.rt || '').trim().toUpperCase();
        if (pRt !== recapRtFilter.toUpperCase()) return false;
      }

      // 2. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesCode = (p.code || '').toLowerCase().includes(q);
        const matchesName = (p.name || '').toLowerCase().includes(q);
        const matchesRt = (p.rt || '').toLowerCase().includes(q);
        if (!matchesCode && !matchesName && !matchesRt) return false;
      }

      return true;
    });
  }, [participants, recapRtFilter, searchQuery]);

  // Find top winners
  const sortedRecap = [...recapData].sort((a, b) => b.averageScore - a.averageScore || b.totalScore - a.totalScore);
  const juara1 = sortedRecap[0];
  const juara2 = sortedRecap[1];

  // Check how many judges have actually submitted non-zero scores or locked cards
  const judgesSubmittedCount = judges.filter((j) => {
    const hasLockedCard = participants.some((p) => isCardLocked(j.id, p.id));
    if (hasLockedCard) return true;

    const jScores = scores[j.id];
    if (!jScores) return false;
    let totalScoreByJudge = 0;
    Object.values(jScores).forEach((pData: any) => {
      if (pData && pData.scores) {
        Object.values(pData.scores).forEach((val: any) => {
          totalScoreByJudge += Number(val) || 0;
        });
      }
    });
    return totalScoreByJudge > 0;
  }).length;

  const confettiShownForRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      juara1 &&
      juara1.averageScore > 0 &&
      confettiShownForRef.current !== juara1.participantId
    ) {
      confettiShownForRef.current = juara1.participantId;
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    }
  }, [juara1?.participantId]);

  const exportToCSV = () => {
    let csv = "Nomor,Nama Peserta,RT," + judges.map(j => `Nilai ${j.code}`).join(",") + ",Total Nilai,Rata-Rata Nilai,Peringkat / Juara\n";
    
    participants.forEach(p => {
      const recap = recapData.find(r => r.participantId === p.id);
      if (recap) {
        const jScores = judges.map(j => (recap.scoresByJudge[j.id] === 'N/A' ? 'N/A' : recap.scoresByJudge[j.id]));
        csv += `${p.code},"${p.name || ''}",${p.rt || ''},` + jScores.join(",") + `,${recap.totalScore},${recap.averageScore},Peringkat #${recap.rank}\n`;
      }
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Rekapitulasi_${eventInfo.competitionTitle.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleAdminResetConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    if (confirmPin.trim() === eventInfo.adminPin) {
      exportToCSV();
      setTimeout(() => {
        exportJSON();
      }, 500);
      resetAllData();
      setShowResetModal(false);
      setConfirmPin('');
      alert(`✅ Berhasil! File Backup Data Rekapitulasi (CSV & JSON) telah terunduh otomatis sebelum data dikosongkan.`);
    } else {
      setResetError(`PIN Admin Salah! Masukkan PIN yang benar.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border-2 border-amber-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center font-black text-xl flex-shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              Kandidat Juara 1
            </div>
            <div className="text-lg font-black text-slate-900">
              {juara1 && juara1.averageScore > 0 ? (
                <span>
                  {formatParticipantLabel(juara1.participantCode, juara1.participantName)}{' '}
                  <span className="text-red-600 text-sm font-extrabold">
                    (#{juara1.participantCode} • {juara1.averageScore})
                  </span>
                </span>
              ) : (
                <span className="text-slate-400 text-sm font-semibold">Belum ada nilai</span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-300 text-slate-700 flex items-center justify-center font-black text-xl flex-shrink-0">
            <Medal className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Kandidat Juara 2
            </div>
            <div className="text-lg font-black text-slate-900">
              {juara2 && juara2.averageScore > 0 ? (
                <span>
                  {formatParticipantLabel(juara2.participantCode, juara2.participantName)}{' '}
                  <span className="text-slate-700 text-sm font-extrabold">
                    (#{juara2.participantCode} • {juara2.averageScore})
                  </span>
                </span>
              ) : (
                <span className="text-slate-400 text-sm font-semibold">Belum ada nilai</span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white border-2 border-red-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 border border-red-300 text-red-700 flex items-center justify-center font-black text-xl flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-red-800 uppercase tracking-wider">
              Progres Juri Masuk
            </div>
            <div className="text-lg font-black text-slate-900">
              {judgesSubmittedCount} / {judges.length} <span className="text-slate-500 text-xs font-semibold">Juri Menyetor Nilai</span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Quick Control Panel */}
      {authState.role === 'admin' && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 border border-red-300 flex items-center justify-center flex-shrink-0 font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-red-950 flex items-center gap-2">
                Panel Kontrol Admin Panitia
              </h3>
              <p className="text-xs text-red-700 font-medium">
                Kelola penguncian nilai final, download rekapitulasi Excel/CSV, atau reset data.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => toggleMasterSystemLock()}
              className={`inline-flex items-center gap-2 px-3.5 py-2 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-95 ${
                eventInfo.isSystemLocked
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                  : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
              }`}
            >
              {eventInfo.isSystemLocked ? (
                <>
                  <Unlock className="w-3.5 h-3.5" /> Buka Kunci Penilaian
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" /> Kunci Semua Nilai (Final)
                </>
              )}
            </button>

            <button
              onClick={exportToCSV}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-600/30 transition-all cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              Download Excel / CSV
            </button>

            <button
              onClick={() => setShowResetModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-100 text-red-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer border border-slate-300 shadow-sm active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5 text-red-600" />
              Reset Data Nilai
            </button>
          </div>
        </div>
      )}

      {/* Winner Podium Showcase */}
      {juara1 && juara1.averageScore > 0 && (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm overflow-hidden relative space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center justify-center gap-2">
              <Trophy className="w-6 h-6 text-amber-500" />
              Penetapan Hasil Pemenang — {eventInfo.competitionTitle}
            </h2>
            <p className="text-xs text-red-700 font-bold bg-red-50 py-1 px-4 rounded-full inline-block border border-red-200">
              {participants.length > 10 ? '👑 6 Juara Utama (Juara 1, 2, 3 & Harapan 4, 5, 6)' : '👑 Penetapan Juara 1 & Juara 2'}
            </p>
          </div>

          {participants.length > 10 ? (
            /* Top 6 Winners Layout for Sepeda Hias */
            <div className="space-y-4 max-w-4xl mx-auto">
              {/* Top 3 Podium (Juara 1, 2, 3) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                {/* Juara 2 */}
                {sortedRecap[1] && (
                  <div className="bg-slate-50 border-2 border-slate-300 rounded-2xl p-4 text-center shadow-sm relative overflow-hidden order-2 sm:order-1">
                    <div className="absolute top-2.5 right-2.5 bg-slate-200 text-slate-900 font-black text-[9px] uppercase px-2.5 py-0.5 rounded-full border border-slate-300">
                      Juara 2
                    </div>
                    <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-900 font-black text-xl flex items-center justify-center shadow-sm mx-auto my-2 border border-slate-300">
                      🥈
                    </div>
                    <h3 className="font-black text-base text-slate-900">
                      {formatParticipantLabel(sortedRecap[1].participantCode, sortedRecap[1].participantName)}
                    </h3>
                    <div className="flex items-center justify-center gap-1.5 mt-0.5 mb-1">
                      <span className="text-[10px] bg-white text-slate-800 font-bold px-2 py-0.5 rounded-full border border-slate-300 shadow-sm">
                        No. #{sortedRecap[1].participantCode}
                      </span>
                      {sortedRecap[1].participantRt && (
                        <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full border border-blue-200">
                          {sortedRecap[1].participantRt}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 font-bold mt-1">
                      Rata-Rata: <span className="text-base font-black text-red-700">{sortedRecap[1].averageScore}</span>
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium">Total: {sortedRecap[1].totalScore} pts</p>
                  </div>
                )}

                {/* Juara 1 (Main Center Champion) */}
                {sortedRecap[0] && (
                  <div className="bg-gradient-to-b from-amber-50 to-white border-2 border-amber-400 rounded-2xl p-5 text-center shadow-md relative overflow-hidden order-1 sm:order-2 sm:scale-105">
                    <div className="absolute top-2.5 right-2.5 bg-amber-400 text-slate-950 font-black text-[10px] uppercase px-3 py-0.5 rounded-full shadow-sm">
                      Juara 1
                    </div>
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-950 font-black text-2xl flex items-center justify-center shadow-md mx-auto my-2 border-2 border-amber-300">
                      🏆
                    </div>
                    <h3 className="font-black text-lg sm:text-xl text-slate-900">
                      {formatParticipantLabel(sortedRecap[0].participantCode, sortedRecap[0].participantName)}
                    </h3>
                    <div className="flex items-center justify-center gap-1.5 mt-0.5 mb-1">
                      <span className="text-[11px] bg-red-100 text-red-800 font-black px-2.5 py-0.5 rounded-full border border-red-200 shadow-sm">
                        No. #{sortedRecap[0].participantCode}
                      </span>
                      {sortedRecap[0].participantRt && (
                        <span className="text-[11px] bg-blue-100 text-blue-800 font-black px-2.5 py-0.5 rounded-full border border-blue-200">
                          {sortedRecap[0].participantRt}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-amber-900 font-black mt-1">
                      Rata-Rata: <span className="text-xl font-black text-red-700">{sortedRecap[0].averageScore}</span>
                    </p>
                    <p className="text-[11px] text-slate-500 font-bold">Total: {sortedRecap[0].totalScore} pts</p>
                  </div>
                )}

                {/* Juara 3 */}
                {sortedRecap[2] && (
                  <div className="bg-amber-50/50 border-2 border-amber-200 rounded-2xl p-4 text-center shadow-sm relative overflow-hidden order-3">
                    <div className="absolute top-2.5 right-2.5 bg-amber-700 text-white font-black text-[9px] uppercase px-2.5 py-0.5 rounded-full">
                      Juara 3
                    </div>
                    <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 font-black text-xl flex items-center justify-center shadow-sm mx-auto my-2 border border-amber-300">
                      🥉
                    </div>
                    <h3 className="font-black text-base text-slate-900">
                      {formatParticipantLabel(sortedRecap[2].participantCode, sortedRecap[2].participantName)}
                    </h3>
                    <div className="flex items-center justify-center gap-1.5 mt-0.5 mb-1">
                      <span className="text-[10px] bg-white text-slate-800 font-bold px-2 py-0.5 rounded-full border border-slate-300 shadow-sm">
                        No. #{sortedRecap[2].participantCode}
                      </span>
                      {sortedRecap[2].participantRt && (
                        <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full border border-blue-200">
                          {sortedRecap[2].participantRt}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 font-bold mt-1">
                      Rata-Rata: <span className="text-base font-black text-red-700">{sortedRecap[2].averageScore}</span>
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium">Total: {sortedRecap[2].totalScore} pts</p>
                  </div>
                )}
              </div>

              {/* Runner Up Winners (Juara Harapan 4, 5, 6) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {sortedRecap[3] && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center font-black text-xs">
                        🎖️
                      </span>
                      <div>
                        <div className="text-[10px] font-extrabold text-blue-800 uppercase tracking-wider">Juara Harapan 4</div>
                        <div className="text-xs font-black text-slate-900">
                          {formatParticipantLabel(sortedRecap[3].participantCode, sortedRecap[3].participantName)}
                          <span className="text-[10px] text-slate-500 font-normal ml-1">
                            (#{sortedRecap[3].participantCode}{sortedRecap[3].participantRt ? ` • ${sortedRecap[3].participantRt}` : ''})
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-red-700">{sortedRecap[3].averageScore}</div>
                      <div className="text-[9px] text-slate-500 font-semibold">{sortedRecap[3].totalScore} pts</div>
                    </div>
                  </div>
                )}

                {sortedRecap[4] && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center font-black text-xs">
                        🎖️
                      </span>
                      <div>
                        <div className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">Juara Harapan 5</div>
                        <div className="text-xs font-black text-slate-900">
                          {formatParticipantLabel(sortedRecap[4].participantCode, sortedRecap[4].participantName)}
                          <span className="text-[10px] text-slate-500 font-normal ml-1">
                            (#{sortedRecap[4].participantCode}{sortedRecap[4].participantRt ? ` • ${sortedRecap[4].participantRt}` : ''})
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-red-700">{sortedRecap[4].averageScore}</div>
                      <div className="text-[9px] text-slate-500 font-semibold">{sortedRecap[4].totalScore} pts</div>
                    </div>
                  </div>
                )}

                {sortedRecap[5] && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 border border-purple-200 flex items-center justify-center font-black text-xs">
                        🎖️
                      </span>
                      <div>
                        <div className="text-[10px] font-extrabold text-purple-800 uppercase tracking-wider">Juara Harapan 6</div>
                        <div className="text-xs font-black text-slate-900">
                          {formatParticipantLabel(sortedRecap[5].participantCode, sortedRecap[5].participantName)}
                          <span className="text-[10px] text-slate-500 font-normal ml-1">
                            (#{sortedRecap[5].participantCode}{sortedRecap[5].participantRt ? ` • ${sortedRecap[5].participantRt}` : ''})
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-red-700">{sortedRecap[5].averageScore}</div>
                      <div className="text-[9px] text-slate-500 font-semibold">{sortedRecap[5].totalScore} pts</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Standard 2-Winners Layout for Blind Rias */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <div className="bg-gradient-to-b from-amber-50 to-white border-2 border-amber-300 rounded-2xl p-5 text-center shadow-sm flex flex-col items-center justify-center relative overflow-hidden order-1 md:order-2">
                <div className="absolute top-3 right-3 bg-amber-400 text-slate-950 font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full">
                  Juara 1
                </div>
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-950 font-black text-2xl flex items-center justify-center shadow-md my-2">
                  🏆
                </div>
                <h3 className="font-black text-xl text-slate-900">
                  Peserta {juara1.participantCode}
                </h3>
                <p className="text-xs text-amber-900 font-bold mt-1">
                  Rata-Rata Nilai: <span className="text-lg font-black text-red-700">{juara1.averageScore}</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Total Skor: {juara1.totalScore} poin
                </p>
              </div>

              {juara2 && (
                <div className="bg-slate-50 border-2 border-slate-300 rounded-2xl p-5 text-center shadow-sm flex flex-col items-center justify-center relative overflow-hidden order-2 md:order-1">
                  <div className="absolute top-3 right-3 bg-slate-300 text-slate-950 font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full">
                    Juara 2
                  </div>
                  <div className="w-14 h-14 rounded-full bg-slate-200 text-slate-900 font-black text-xl flex items-center justify-center shadow-sm my-2">
                    🥈
                  </div>
                  <h3 className="font-black text-lg text-slate-900">
                    Peserta {juara2.participantCode}
                  </h3>
                  <p className="text-xs text-slate-700 font-bold mt-1">
                    Rata-Rata Nilai: <span className="text-base font-black text-red-700">{juara2.averageScore}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Total Skor: {juara2.totalScore} poin
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Recap Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Matriks Rekapitulasi Penilaian Lomba ({eventInfo.competitionTitle})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Otomatis menghitung Total dan Rata-Rata Nilai dari juri penilai.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari peserta / RT..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 focus:border-red-500 focus:bg-white text-slate-900 text-xs font-semibold rounded-xl pl-9 pr-8 py-2 outline-none transition-all placeholder:text-slate-400 shadow-inner"
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
          </div>
        </div>

        {/* RT Filter Tabs for Recap Table */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <span className="text-[11px] text-slate-600 font-bold uppercase tracking-wider flex items-center gap-1 mr-1 flex-shrink-0">
            <Filter className="w-3.5 h-3.5 text-red-600" /> Filter RT:
          </span>
          <button
            onClick={() => setRecapRtFilter('all')}
            className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all border whitespace-nowrap cursor-pointer ${
              recapRtFilter === 'all'
                ? 'bg-red-600 text-white border-red-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            Semua ({participants.length})
          </button>
          {RT_LIST.map((rt) => (
            <button
              key={rt}
              onClick={() => setRecapRtFilter(rt)}
              className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all border whitespace-nowrap cursor-pointer ${
                recapRtFilter === rt
                  ? 'bg-red-600 text-white border-red-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {rt}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-800 font-black uppercase tracking-wider border-b-2 border-slate-200">
              <tr>
                <th scope="col" className="px-4 py-3.5 sticky left-0 bg-slate-100 z-10 border-r border-slate-200 min-w-[130px]">
                  Peserta
                </th>
                {judges.map((j) => (
                  <th key={j.id} scope="col" className="px-3 py-3.5 text-center min-w-[100px]">
                    {j.name || j.code}
                  </th>
                ))}
                <th scope="col" className="px-4 py-3.5 text-center bg-slate-200/70 text-slate-900 font-black min-w-[110px]">
                  Total Nilai
                </th>
                <th scope="col" className="px-4 py-3.5 text-center bg-amber-100 text-amber-950 font-black min-w-[110px]">
                  Rata-Rata
                </th>
                <th scope="col" className="px-4 py-3.5 text-center min-w-[130px]">
                  Peringkat / Juara
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 font-medium">
              {filteredRecapParticipants.map((participant, idx) => {
                const recap = recapData.find((r) => r.participantId === participant.id);
                if (!recap) return null;

                const isRank1 = recap.rank === 1 && recap.averageScore > 0;
                const isRank2 = recap.rank === 2 && recap.averageScore > 0;

                return (
                  <tr
                    key={participant.id}
                    className={`transition-colors ${
                      isRank1
                        ? 'bg-amber-50 hover:bg-amber-100/60 font-bold'
                        : isRank2
                        ? 'bg-slate-100/70 hover:bg-slate-100 font-semibold'
                        : idx % 2 === 0
                        ? 'bg-white hover:bg-slate-50'
                        : 'bg-slate-50/50 hover:bg-slate-100/60'
                    }`}
                  >
                    {/* Peserta Name Column */}
                    <td className="px-4 py-3 font-bold text-slate-900 sticky left-0 bg-inherit border-r border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-white border border-slate-300 font-black text-red-700 text-xs shadow-sm">
                          {participant.name}
                        </span>
                        {participant.rt && (
                          <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded-full border border-blue-200">
                            {participant.rt}
                          </span>
                        )}
                        {participant.isAttending === false && (
                          <span className="text-[9px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded border border-red-200">
                            Absen
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Nilai dari Juri */}
                    {judges.map((j) => {
                      const scoreVal = recap.scoresByJudge[j.id];
                      const isSelf = scoreVal === 'N/A';

                      return (
                        <td key={j.id} className="px-3 py-3 text-center">
                          {isSelf ? (
                            <span className="inline-block text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              N/A (RT Sendiri)
                            </span>
                          ) : (
                            <span
                              className={`font-bold ${
                                typeof scoreVal === 'number' && scoreVal > 0
                                  ? 'text-slate-900'
                                  : 'text-slate-400 font-normal'
                              }`}
                            >
                              {typeof scoreVal === 'number' ? scoreVal : 0}
                            </span>
                          )}
                        </td>
                      );
                    })}

                    {/* Total Nilai */}
                    <td className="px-4 py-3 text-center font-black text-slate-900 bg-slate-100/50">
                      {recap.totalScore}
                    </td>

                    {/* Rata-Rata Nilai */}
                    <td className="px-4 py-3 text-center bg-amber-50 font-black text-red-700 text-sm">
                      {recap.averageScore}
                    </td>

                    {/* Peringkat / Juara */}
                    <td className="px-4 py-3 text-center font-bold">
                      {recap.rank === 1 && recap.averageScore > 0 ? (
                        <span className="inline-flex items-center gap-1 bg-amber-400 text-slate-950 font-black text-xs px-2.5 py-1 rounded-full shadow-sm whitespace-nowrap">
                          🏆 JUARA 1
                        </span>
                      ) : recap.rank === 2 && recap.averageScore > 0 ? (
                        <span className="inline-flex items-center gap-1 bg-slate-200 text-slate-900 font-black text-xs px-2.5 py-1 rounded-full shadow-sm whitespace-nowrap border border-slate-300">
                          🥈 JUARA 2
                        </span>
                      ) : recap.rank === 3 && recap.averageScore > 0 ? (
                        <span className="inline-flex items-center gap-1 bg-amber-700 text-white font-black text-xs px-2.5 py-1 rounded-full shadow-sm whitespace-nowrap">
                          🥉 JUARA 3
                        </span>
                      ) : recap.rank === 4 && recap.averageScore > 0 ? (
                        <span className="inline-flex items-center gap-1 bg-blue-600 text-white font-extrabold text-[11px] px-2.5 py-0.5 rounded-full whitespace-nowrap">
                          🎖️ HARAPAN 4
                        </span>
                      ) : recap.rank === 5 && recap.averageScore > 0 ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-600 text-white font-extrabold text-[11px] px-2.5 py-0.5 rounded-full whitespace-nowrap">
                          🎖️ HARAPAN 5
                        </span>
                      ) : recap.rank === 6 && recap.averageScore > 0 ? (
                        <span className="inline-flex items-center gap-1 bg-purple-600 text-white font-extrabold text-[11px] px-2.5 py-0.5 rounded-full whitespace-nowrap">
                          🎖️ HARAPAN 6
                        </span>
                      ) : (
                        <span className="text-slate-500 font-semibold text-xs">Peringkat #{recap.rank}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Judge Notes Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-base font-black text-slate-900">
          <MessageSquare className="w-5 h-5 text-red-600" />
          Kumpulan Catatan / Masukan dari Dewan Juri
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {judges.map((j) => {
            const noteText = judgeNotes[j.id];

            return (
              <div key={j.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-red-700 flex items-center gap-1">
                    👤 {j.name}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold">
                    Catatan Juri
                  </span>
                </div>
                <p className="text-xs text-slate-700 italic leading-relaxed font-medium">
                  {noteText && noteText.trim() !== '' ? `"${noteText}"` : <span className="text-slate-400 not-italic">Belum ada catatan khusus dari {j.code}.</span>}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Reset Data dengan Auto Backup Safety */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-red-600" /> Konfirmasi Reset & Auto-Backup
            </h3>
            
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 font-black text-xs text-amber-900">
                <FileCheck2 className="w-4 h-4 text-amber-600" />
                <span>Auto-Backup Sebelum Reset Aktif</span>
              </div>
              <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
                Sebelum data nilai dikosongkan, sistem akan <strong>otomatis mengunduh file Backup Excel (CSV) & Snapshot JSON</strong> ke komputer Anda agar data nilai tidak hilang.
              </p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Tindakan ini akan mengosongkan seluruh isian nilai juri di server & Supabase. Masukkan PIN Admin untuk melanjutkan:
            </p>

            <form onSubmit={handleAdminResetConfirm} className="space-y-4">
              <input
                type="password"
                maxLength={6}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="PIN Admin"
                className="w-full bg-slate-50 border-2 border-slate-300 text-center font-mono font-black text-xl text-slate-900 rounded-xl py-2.5 focus:outline-none focus:border-red-500 focus:bg-white shadow-inner"
              />

              {resetError && <div className="text-xs text-red-700 bg-red-50 border border-red-300 p-2 rounded-xl font-bold text-center">{resetError}</div>}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-red-600/30 cursor-pointer"
                >
                  Backup & Kosongkan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
