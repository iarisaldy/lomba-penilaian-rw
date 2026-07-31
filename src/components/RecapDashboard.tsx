'use client';

import React, { useEffect, useState } from 'react';
import { useScore } from '../context/ScoreContext';
import { Trophy, Medal, Users, MessageSquare, RotateCcw, ShieldAlert, FileSpreadsheet, Send, Download } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getGoogleSheetsUrl, setGoogleSheetsUrl, testGoogleSheetsSync } from '../lib/googleSheetsClient';

export const RecapDashboard: React.FC = () => {
  const { judges, participants, recapData, judgeNotes, scores, authState, resetAllData } = useScore();
  const [confirmPin, setConfirmPin] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetError, setResetError] = useState('');

  // Google Sheets settings modal
  const [showSheetsModal, setShowSheetsModal] = useState(false);
  const [sheetsUrlInput, setSheetsUrlInput] = useState('');
  const [sheetsStatus, setSheetsStatus] = useState('');

  useEffect(() => {
    setSheetsUrlInput(getGoogleSheetsUrl());
  }, []);

  // Find top winners
  const sortedRecap = [...recapData].sort((a, b) => b.averageScore - a.averageScore || b.totalScore - a.totalScore);
  const juara1 = sortedRecap[0];
  const juara2 = sortedRecap[1];

  // Check how many judges have submitted scores
  const judgesSubmittedCount = judges.filter((j) => {
    const jScores = scores[j.id];
    if (!jScores) return false;
    return Object.keys(jScores).length > 0;
  }).length;

  // Fire confetti if winners have non-zero average score
  useEffect(() => {
    if (juara1 && juara1.averageScore > 0) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
  }, [juara1?.participantId, juara1?.averageScore]);

  const handleAdminResetConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    if (confirmPin.trim() === '0000') {
      resetAllData();
      setShowResetModal(false);
      setConfirmPin('');
      alert('Seluruh data nilai penilaian berhasil dikosongkan!');
    } else {
      setResetError('PIN Admin Salah! Gunakan PIN 0000.');
    }
  };

  const handleTestSheets = async () => {
    setSheetsStatus('Mengirim data uji coba ke Google Sheets...');
    setGoogleSheetsUrl(sheetsUrlInput);
    const success = await testGoogleSheetsSync(sheetsUrlInput, scores, judgeNotes);
    if (success) {
      setSheetsStatus('✅ Permintaan dikirim ke Google Apps Script! Jika belum terisi, pastikan di Apps Script setting "Jalankan Sebagai" diubah ke "Saya (email anda)".');
    } else {
      setSheetsStatus('❌ Gagal terhubung ke Google Sheets. Periksa kembali URL Web App.');
    }
  };

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
    link.setAttribute("download", `Rekap_Nilai_Lomba_Permata_Discovery_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
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
                <span>Peserta {juara1.participantCode} <span className="text-amber-400 text-sm font-bold">({juara1.averageScore})</span></span>
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
                <span>Peserta {juara2.participantCode} <span className="text-slate-300 text-sm font-bold">({juara2.averageScore})</span></span>
              ) : (
                <span className="text-slate-500 text-sm">Belum ada data</span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xl flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Status Juri Aktif
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
                Kelola data penilaian, download spreadsheet Excel, integrasi Google Sheets, atau reset data.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={exportToCSV}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download Excel / CSV
            </button>

            <button
              onClick={() => setShowSheetsModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Sync Google Sheets
            </button>

            <button
              onClick={() => setShowResetModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-600/30 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Data Penilaian
            </button>
          </div>
        </div>
      )}

      {/* Winner Podium Showcase */}
      {juara1 && juara1.averageScore > 0 && (
        <div className="bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden relative">
          <div className="text-center max-w-xl mx-auto mb-6 space-y-1">
            <h2 className="text-2xl font-black text-white">
              Penetapan Hasil Pemenang
            </h2>
          </div>

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
              <div className="bg-gradient-to-b from-slate-700/30 via-slate-900 to-slate-900 border border-slate-500/50 rounded-2xl p-5 text-center shadow-xl flex flex-col items-center justify-center relative order-2 md:order-1">
                <div className="absolute top-3 right-3 bg-slate-300 text-slate-950 font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full">
                  Juara 2
                </div>
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-slate-300 to-slate-100 text-slate-950 font-black text-xl flex items-center justify-center shadow-md my-2">
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
        </div>
      )}

      {/* Main Rekap Matrix Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Matriks Rekapitulasi Penilaian Lomba
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Otomatis menghitung Total dan Rata-Rata Nilai dari 5 juri penilai (Eksklusi RT Sendiri).
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-300 font-bold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th scope="col" className="px-4 py-3.5 sticky left-0 bg-slate-950 z-10 border-r border-slate-800 min-w-[120px]">
                  RT Peserta
                </th>
                {judges.map((j) => (
                  <th key={j.id} scope="col" className="px-3 py-3.5 text-center min-w-[100px]">
                    Nilai {j.code}
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
              {participants.map((participant) => {
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
                    {/* RT Peserta */}
                    <td className="px-4 py-3.5 font-bold text-white sticky left-0 bg-slate-900 border-r border-slate-800">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 font-extrabold text-amber-400 text-xs shadow-sm">
                        {participant.code}
                      </span>
                    </td>

                    {/* Nilai dari Juri RT 01 s/d 06 */}
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
                      {isRank1 ? (
                        <span className="inline-flex items-center gap-1 bg-amber-400 text-slate-950 font-black text-xs px-2.5 py-1 rounded-full shadow-sm">
                          🏆 JUARA 1
                        </span>
                      ) : isRank2 ? (
                        <span className="inline-flex items-center gap-1 bg-slate-300 text-slate-950 font-black text-xs px-2.5 py-1 rounded-full shadow-sm">
                          🥈 JUARA 2
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">
                          Peringkat #{recap.rank}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Catatan Juri Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-amber-400" />
          Kompilasi Catatan & Saran Seluruh Juri
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {judges.map((j) => {
            const notesText = judgeNotes[j.id];
            return (
              <div key={j.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1">
                <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>{j.name}</span>
                  <span className="text-[10px] text-slate-500 font-normal">{j.code}</span>
                </div>
                <p className="text-xs text-slate-400 italic">
                  {notesText && notesText.trim() !== ''
                    ? `"${notesText}"`
                    : 'Tidak ada catatan.'}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Google Sheets Config Modal */}
      {showSheetsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 no-print">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-emerald-400">
              <FileSpreadsheet className="w-7 h-7 flex-shrink-0" />
              <div>
                <h3 className="font-extrabold text-lg text-white">Pengaturan Integrasi Google Sheets</h3>
                <p className="text-xs text-slate-400">Masukkan Web App URL dari Google Apps Script untuk sync otomatis ke spreadsheet.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Google Apps Script Web App URL:
                </label>
                <input
                  type="url"
                  value={sheetsUrlInput}
                  onChange={(e) => setSheetsUrlInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  className="w-full bg-slate-950 border border-slate-700 text-xs font-mono text-white rounded-xl p-3 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {sheetsStatus && (
                <div className="text-xs bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-300 leading-relaxed font-medium">
                  {sheetsStatus}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowSheetsModal(false);
                  setSheetsStatus('');
                }}
                className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-700 cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleTestSheets}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-500 cursor-pointer shadow-lg shadow-emerald-600/30"
              >
                <Send className="w-3.5 h-3.5" />
                Simpan & Tes Kirim ke Google Sheets
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 no-print">
          <div className="bg-slate-900 border border-red-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <ShieldAlert className="w-8 h-8 flex-shrink-0" />
              <div>
                <h3 className="font-extrabold text-lg text-white">Konfirmasi Reset Data</h3>
                <p className="text-xs text-slate-400">Tindakan ini akan mengosongkan seluruh nilai dari 6 juri.</p>
              </div>
            </div>

            <form onSubmit={handleAdminResetConfirm} className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Masukkan PIN Admin (0000) untuk melanjutkan:
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="0000"
                  className="w-full bg-slate-950 border border-slate-700 text-center font-mono font-bold text-xl text-white rounded-xl py-2.5 focus:outline-none focus:border-red-500"
                  autoFocus
                />
              </div>

              {resetError && (
                <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-center font-medium">
                  {resetError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetModal(false);
                    setConfirmPin('');
                    setResetError('');
                  }}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white font-bold text-xs rounded-xl hover:bg-red-500 cursor-pointer shadow-lg shadow-red-600/30"
                >
                  Ya, Kosongkan Semua Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
