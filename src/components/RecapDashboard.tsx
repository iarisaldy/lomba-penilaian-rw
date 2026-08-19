import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useScore } from '../context/ScoreContext';
import { Trophy, Medal, Users, MessageSquare, RotateCcw, ShieldAlert, Download, Lock, Unlock, FileCheck2, AlertTriangle, Search } from 'lucide-react';
import confetti from 'canvas-confetti';

export const RecapDashboard: React.FC = () => {
  const { judges, participants, recapData, judgeNotes, scores, authState, resetAllData, eventInfo, toggleMasterSystemLock, exportJSON, isCardLocked } = useScore();
  const [confirmPin, setConfirmPin] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetError, setResetError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const formatParticipantLabel = (code?: string) => {
    const clean = String(code || '').trim();
    if (!clean) return 'Peserta';
    if (clean.toLowerCase().includes('peserta')) return clean;
    return `Peserta #${clean}`;
  };

  const filteredRecapParticipants = useMemo(() => {
    if (!searchQuery.trim()) return participants;
    const q = searchQuery.toLowerCase().trim();
    return participants.filter(p => (p.code || '').toLowerCase().includes(q) || (p.name || '').toLowerCase().includes(q));
  }, [participants, searchQuery]);


  // Find top winners
  const sortedRecap = [...recapData].sort((a, b) => b.averageScore - a.averageScore || b.totalScore - a.totalScore);
  const juara1 = sortedRecap[0];
  const juara2 = sortedRecap[1];

  // Check how many judges have actually submitted non-zero scores or locked cards
  const judgesSubmittedCount = judges.filter((j) => {
    // 1. Check if any card is locked for this judge
    const hasLockedCard = participants.some((p) => isCardLocked(j.id, p.id));
    if (hasLockedCard) return true;

    // 2. Check if total score entered across all participants > 0
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

  // Track which participantId last got confetti — prevents confetti re-firing on every score update
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
  // Hanya re-check saat pemenang berganti, bukan saat nilai berubah
  }, [juara1?.participantId]); // eslint-disable-line react-hooks/exhaustive-deps

  const exportToCSV = () => {
    let csv = "RT Peserta," + judges.map(j => `Nilai ${j.code}`).join(",") + ",Total Nilai,Rata-Rata Nilai,Peringkat / Juara\n";
    
    participants.forEach(p => {
      const recap = recapData.find(r => r.participantId === p.id);
      if (recap) {
        const jScores = judges.map(j => (recap.scoresByJudge[j.id] === 'N/A' ? 'N/A' : recap.scoresByJudge[j.id]));
        csv += `${p.code},` + jScores.join(",") + `,${recap.totalScore},${recap.averageScore},Peringkat #${recap.rank}\n`;
      }
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Backup_Sebelum_Reset_${eventInfo.competitionTitle.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleAdminResetConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    if (confirmPin.trim() === eventInfo.adminPin) {
      // 1. Auto download Backup CSV
      exportToCSV();

      // 2. Auto download Backup JSON Snapshot
      setTimeout(() => {
        exportJSON();
      }, 500);

      // 3. Reset all scores & locked cards
      resetAllData();
      setShowResetModal(false);
      setConfirmPin('');
      alert(`✅ Berhasil! File Backup Data Rekapitulasi (CSV & JSON) telah terunduh otomatis ke komputer Anda sebelum data dikosongkan.`);
    } else {
      setResetError(`PIN Admin Salah! Masukkan PIN yang benar.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xl flex-shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Kandidat Juara 1
            </div>
            <div className="text-lg font-black text-white">
              {juara1 && juara1.averageScore > 0 ? (
                <span>{formatParticipantLabel(juara1.participantCode)} <span className="text-amber-400 text-sm font-bold">({juara1.averageScore})</span></span>
              ) : (
                <span className="text-slate-500 text-sm">Belum ada data</span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-300/10 border border-slate-300/20 text-slate-300 flex items-center justify-center font-bold text-xl flex-shrink-0">
            <Medal className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Kandidat Juara 2
            </div>
            <div className="text-lg font-black text-white">
              {juara2 && juara2.averageScore > 0 ? (
                <span>{formatParticipantLabel(juara2.participantCode)} <span className="text-slate-300 text-sm font-bold">({juara2.averageScore})</span></span>
              ) : (
                <span className="text-slate-500 text-sm">Belum ada data</span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center font-bold text-xl flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Progres Juri Active
            </div>
            <div className="text-lg font-black text-white">
              {judgesSubmittedCount} / {judges.length} <span className="text-slate-400 text-xs font-normal">Juri Memasukkan Nilai</span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Quick Control Panel (Visible for Admin) */}
      {authState.role === 'admin' && (
        <div className="bg-gradient-to-r from-red-950/40 via-slate-900 to-amber-950/40 border border-red-500/30 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center flex-shrink-0 font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                Panel Kontrol Admin Panitia
              </h3>
              <p className="text-xs text-slate-400">
                Kelola penguncian nilai final, download Excel/CSV, atau reset data.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => toggleMasterSystemLock()}
              className={`inline-flex items-center gap-2 px-3.5 py-2 font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer ${
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
                  <Lock className="w-3.5 h-3.5" /> Kunci Semua (Final)
                </>
              )}
            </button>

            <button
              onClick={exportToCSV}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download Excel / CSV
            </button>

            <button
              onClick={() => setShowResetModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer border border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5 text-red-400" />
              Reset Data Nilai
            </button>
          </div>
        </div>
      )}

      {/* Winner Podium Showcase */}
      {juara1 && juara1.averageScore > 0 && (
        <div className="bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden relative space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h2 className="text-2xl font-black text-white flex items-center justify-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" />
              Penetapan Hasil Pemenang — {eventInfo.competitionTitle}
            </h2>
            <p className="text-xs text-amber-300 font-semibold">
              {participants.length > 10 ? '👑 Penetapan 6 Juara Utama (Juara 1 - 3 & Harapan 1 - 3)' : '👑 Penetapan Juara 1 & Juara 2'}
            </p>
          </div>

          {participants.length > 10 ? (
            /* Top 5 Winners Layout for Sepeda Hias */
            <div className="space-y-4 max-w-4xl mx-auto">
              {/* Top 3 Podium (Juara 1, 2, 3) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                {/* Juara 2 */}
                {sortedRecap[1] && (
                  <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 text-center shadow-lg relative overflow-hidden order-2 sm:order-1">
                    <div className="absolute top-2.5 right-2.5 bg-slate-300 text-slate-950 font-black text-[9px] uppercase px-2 py-0.5 rounded-full">
                      Juara 2
                    </div>
                    <div className="w-12 h-12 rounded-full bg-slate-300 text-slate-950 font-black text-xl flex items-center justify-center shadow-md mx-auto my-2">
                      🥈
                    </div>
                    <h3 className="font-extrabold text-base text-white">
                      {formatParticipantLabel(sortedRecap[1].participantCode)}
                    </h3>
                    <p className="text-xs text-slate-300 font-semibold mt-1">
                      Rata-Rata: <span className="text-sm font-black text-amber-400">{sortedRecap[1].averageScore}</span>
                    </p>
                    <p className="text-[10px] text-slate-400">Total: {sortedRecap[1].totalScore} pts</p>
                  </div>
                )}

                {/* Juara 1 (Main Center Champion) */}
                {sortedRecap[0] && (
                  <div className="bg-gradient-to-b from-amber-500/20 via-slate-900 to-slate-900 border-2 border-amber-400 rounded-2xl p-5 text-center shadow-xl shadow-amber-500/10 relative overflow-hidden order-1 sm:order-2 scale-105">
                    <div className="absolute top-2.5 right-2.5 bg-amber-400 text-slate-950 font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full">
                      Juara 1
                    </div>
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg mx-auto my-2">
                      🏆
                    </div>
                    <h3 className="font-extrabold text-xl text-white">
                      {formatParticipantLabel(sortedRecap[0].participantCode)}
                    </h3>
                    <p className="text-xs text-amber-300 font-bold mt-1">
                      Rata-Rata: <span className="text-lg font-black text-white">{sortedRecap[0].averageScore}</span>
                    </p>
                    <p className="text-[11px] text-slate-400">Total: {sortedRecap[0].totalScore} pts</p>
                  </div>
                )}

                {/* Juara 3 */}
                {sortedRecap[2] && (
                  <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 text-center shadow-lg relative overflow-hidden order-3">
                    <div className="absolute top-2.5 right-2.5 bg-amber-700 text-white font-black text-[9px] uppercase px-2 py-0.5 rounded-full">
                      Juara 3
                    </div>
                    <div className="w-12 h-12 rounded-full bg-amber-700 text-white font-black text-xl flex items-center justify-center shadow-md mx-auto my-2">
                      🥉
                    </div>
                    <h3 className="font-extrabold text-base text-white">
                      {formatParticipantLabel(sortedRecap[2].participantCode)}
                    </h3>
                    <p className="text-xs text-slate-300 font-semibold mt-1">
                      Rata-Rata: <span className="text-sm font-black text-amber-400">{sortedRecap[2].averageScore}</span>
                    </p>
                    <p className="text-[10px] text-slate-400">Total: {sortedRecap[2].totalScore} pts</p>
                  </div>
                )}
              </div>

              {/* Runner Up Winners (Juara Harapan 1, 2, 3) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {sortedRecap[3] && (
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-black text-xs">
                        🎖️
                      </span>
                      <div>
                        <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Juara Harapan 1</div>
                        <div className="text-xs font-extrabold text-white">
                          {formatParticipantLabel(sortedRecap[3].participantCode)}
                          {sortedRecap[3].participantRt && <span className="text-[9px] text-amber-400 ml-1">({sortedRecap[3].participantRt})</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-amber-400">{sortedRecap[3].averageScore}</div>
                      <div className="text-[9px] text-slate-500">{sortedRecap[3].totalScore} pts</div>
                    </div>
                  </div>
                )}

                {sortedRecap[4] && (
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-xs">
                        🎖️
                      </span>
                      <div>
                        <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Juara Harapan 2</div>
                        <div className="text-xs font-extrabold text-white">
                          {formatParticipantLabel(sortedRecap[4].participantCode)}
                          {sortedRecap[4].participantRt && <span className="text-[9px] text-amber-400 ml-1">({sortedRecap[4].participantRt})</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-amber-400">{sortedRecap[4].averageScore}</div>
                      <div className="text-[9px] text-slate-500">{sortedRecap[4].totalScore} pts</div>
                    </div>
                  </div>
                )}

                {sortedRecap[5] && (
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-black text-xs">
                        🎖️
                      </span>
                      <div>
                        <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Juara Harapan 3</div>
                        <div className="text-xs font-extrabold text-white">
                          {formatParticipantLabel(sortedRecap[5].participantCode)}
                          {sortedRecap[5].participantRt && <span className="text-[9px] text-amber-400 ml-1">({sortedRecap[5].participantRt})</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-amber-400">{sortedRecap[5].averageScore}</div>
                      <div className="text-[9px] text-slate-500">{sortedRecap[5].totalScore} pts</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Standard 2-Winners Layout for Blind Rias */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {/* Juara 1 */}
              <div className="bg-gradient-to-b from-amber-500/20 via-slate-900 to-slate-900 border-2 border-amber-400/60 rounded-2xl p-5 text-center shadow-xl shadow-amber-500/10 flex flex-col items-center justify-center relative overflow-hidden order-1 md:order-2">
                <div className="absolute top-3 right-3 bg-amber-400 text-slate-950 font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full">
                  Juara 1
                </div>
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg my-2">
                  🏆
                </div>
                <h3 className="font-extrabold text-xl text-white">
                  Peserta {juara1.participantCode}
                </h3>
                <p className="text-xs text-amber-300 font-semibold mt-1">
                  Rata-Rata Nilai: <span className="text-lg font-black text-white">{juara1.averageScore}</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Total Skor: {juara1.totalScore} poin
                </p>
              </div>

              {/* Juara 2 */}
              {juara2 && (
                <div className="bg-gradient-to-b from-slate-800/40 via-slate-900 to-slate-900 border border-slate-700 rounded-2xl p-5 text-center shadow-lg flex flex-col items-center justify-center relative overflow-hidden order-2 md:order-1">
                  <div className="absolute top-3 right-3 bg-slate-300 text-slate-950 font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full">
                    Juara 2
                  </div>
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-slate-300 to-slate-400 text-slate-950 font-black text-xl flex items-center justify-center shadow-md my-2">
                    🥈
                  </div>
                  <h3 className="font-extrabold text-lg text-white">
                    Peserta {juara2.participantCode}
                  </h3>
                  <p className="text-xs text-slate-300 font-semibold mt-1">
                    Rata-Rata Nilai: <span className="text-base font-black text-white">{juara2.averageScore}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Total Skor: {juara2.totalScore} poin
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Recap Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Matriks Rekapitulasi Penilaian Lomba ({eventInfo.competitionTitle})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Otomatis menghitung Total dan Rata-Rata Nilai dari juri penilai.
            </p>
          </div>

          {participants.length > 10 && (
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari peserta (cth: 025)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 text-slate-100 text-xs rounded-xl pl-9 pr-8 py-2 outline-none transition-all placeholder:text-slate-500"
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
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-300 font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th scope="col" className="px-4 py-3.5 sticky left-0 bg-slate-950 z-10 border-r border-slate-800 min-w-[120px]">
                  Peserta
                </th>
                {judges.map((j) => (
                  <th key={j.id} scope="col" className="px-3 py-3.5 text-center min-w-[100px]">
                    {j.name || j.code}
                  </th>
                ))}
                <th scope="col" className="px-4 py-3.5 text-center bg-slate-900/80 text-amber-400 min-w-[110px]">
                  Total Nilai (Jumlah)
                </th>
                <th scope="col" className="px-4 py-3.5 text-center bg-amber-500/10 text-amber-300 font-extrabold min-w-[110px]">
                  Rata-Rata Nilai
                </th>
                <th scope="col" className="px-4 py-3.5 text-center min-w-[120px]">
                  Peringkat / Juara
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredRecapParticipants.map((participant) => {
                const recap = recapData.find((r) => r.participantId === participant.id);
                if (!recap) return null;

                const isRank1 = recap.rank === 1 && recap.averageScore > 0;
                const isRank2 = recap.rank === 2 && recap.averageScore > 0;

                return (
                  <tr
                    key={participant.id}
                    className={`transition-colors ${
                      isRank1
                        ? 'bg-amber-500/10 hover:bg-amber-500/15'
                        : isRank2
                        ? 'bg-slate-800/40 hover:bg-slate-800/60'
                        : 'hover:bg-slate-800/30'
                    }`}
                  >
                    {/* Peserta Name Column */}
                    <td className="px-4 py-3.5 font-bold text-white sticky left-0 bg-slate-900 border-r border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 font-extrabold text-amber-400 text-xs shadow-sm">
                          {participant.name}
                        </span>
                        {participant.rt && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-400 font-bold px-1.5 py-0.5 rounded border border-amber-500/30">
                            {participant.rt}
                          </span>
                        )}
                        {participant.isAttending === false && (
                          <span className="text-[9px] bg-red-500/20 text-red-400 font-bold px-1.5 py-0.5 rounded border border-red-500/30">
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
                        <td key={j.id} className="px-3 py-3.5 text-center">
                          {isSelf ? (
                            <span className="inline-block text-[10px] font-bold text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/50">
                              N/A (RT Sendiri)
                            </span>
                          ) : (
                            <span
                              className={`font-semibold ${
                                typeof scoreVal === 'number' && scoreVal > 0
                                  ? 'text-slate-200'
                                  : 'text-slate-600'
                              }`}
                            >
                              {typeof scoreVal === 'number' ? scoreVal : 0}
                            </span>
                          )}
                        </td>
                      );
                    })}

                    {/* Total Nilai */}
                    <td className="px-4 py-3.5 text-center font-bold text-slate-200 bg-slate-900/50">
                      {recap.totalScore}
                    </td>

                    {/* Rata-Rata Nilai */}
                    <td className="px-4 py-3.5 text-center bg-amber-500/10 font-black text-amber-400 text-sm">
                      {recap.averageScore}
                    </td>

                    {/* Peringkat / Juara */}
                    <td className="px-4 py-3.5 text-center font-bold">
                      {recap.rank === 1 && recap.averageScore > 0 ? (
                        <span className="inline-flex items-center gap-1 bg-amber-400 text-slate-950 font-black text-xs px-2.5 py-1 rounded-full shadow-sm whitespace-nowrap">
                          🏆 JUARA 1
                        </span>
                      ) : recap.rank === 2 && recap.averageScore > 0 ? (
                        <span className="inline-flex items-center gap-1 bg-slate-300 text-slate-950 font-extrabold text-xs px-2.5 py-1 rounded-full shadow-sm whitespace-nowrap">
                          🥈 JUARA 2
                        </span>
                      ) : recap.rank === 3 && recap.averageScore > 0 ? (
                        <span className="inline-flex items-center gap-1 bg-amber-700 text-white font-extrabold text-xs px-2.5 py-1 rounded-full shadow-sm whitespace-nowrap">
                          🥉 JUARA 3
                        </span>
                      ) : recap.rank === 4 && recap.averageScore > 0 ? (
                        <span className="inline-flex items-center gap-1 bg-blue-600 text-white font-bold text-[11px] px-2 py-0.5 rounded-full whitespace-nowrap">
                          🎖️ HARAPAN 1
                        </span>
                      ) : recap.rank === 5 && recap.averageScore > 0 ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-600 text-white font-bold text-[11px] px-2 py-0.5 rounded-full whitespace-nowrap">
                          🎖️ HARAPAN 2
                        </span>
                      ) : recap.rank === 6 && recap.averageScore > 0 ? (
                        <span className="inline-flex items-center gap-1 bg-purple-600 text-white font-bold text-[11px] px-2 py-0.5 rounded-full whitespace-nowrap">
                          🎖️ HARAPAN 3
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">Peringkat #{recap.rank}</span>
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
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-base font-bold text-white">
          <MessageSquare className="w-5 h-5 text-amber-400" />
          Kumpulan Catatan / Masukan dari Dewan Juri
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {judges.map((j) => {
            const noteText = judgeNotes[j.id];

            return (
              <div key={j.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-amber-400 flex items-center gap-1">
                    👤 {j.name}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    Catatan Juri
                  </span>
                </div>
                <p className="text-xs text-slate-300 italic leading-relaxed">
                  {noteText && noteText.trim() !== '' ? `"${noteText}"` : <span className="text-slate-600 not-italic">Belum ada catatan khusus dari {j.code}.</span>}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Reset Data dengan Auto Backup Safety */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-red-500" /> Confirm Reset & Auto-Backup
            </h3>
            
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-xs text-amber-300">
                <FileCheck2 className="w-4 h-4 text-amber-400" />
                <span>Auto-Backup Sebelum Reset Aktif</span>
              </div>
              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                Sebelum data nilai dikosongkan, sistem akan <strong>otomatis mendownload file Backup Excel (CSV) & Snapshot JSON</strong> ke komputer Anda agar data nilai lama tidak hilang.
              </p>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Tindakan ini akan mengosongkan seluruh isian nilai juri di server & Supabase. Masukkan PIN Admin untuk melanjutkan:
            </p>

            <form onSubmit={handleAdminResetConfirm} className="space-y-4">
              <input
                type="password"
                maxLength={6}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="PIN Admin"
                className="w-full bg-slate-950 border border-slate-700 text-center font-mono text-xl text-white rounded-xl py-2.5 focus:outline-none focus:border-red-500"
              />

              {resetError && <div className="text-xs text-red-400 font-semibold text-center">{resetError}</div>}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
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
