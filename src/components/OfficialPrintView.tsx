'use client';

import React from 'react';
import { useScore } from '../context/ScoreContext';
import { Printer, Hourglass } from 'lucide-react';

export const OfficialPrintView: React.FC = () => {
  const { judges, participants, recapData, eventInfo, authState } = useScore();

  const isJuriLockedOut = authState.role === 'juri' && !eventInfo.isSystemLocked;

  if (isJuriLockedOut) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center max-w-2xl mx-auto my-8 shadow-2xl space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
          <Hourglass className="w-8 h-8 animate-pulse" />
        </div>
        <div className="space-y-2">
          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            ⏳ Penilaian Sedang Berlangsung
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            Dokumen Berita Acara Masih Ditutup
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
            Untuk menjaga <strong>independensi dan kerahasiaan hasil penilaian</strong>, dokumen resmi berita acara pemenang akan otomatis terbuka setelah seluruh penilaian selesai dan dikunci oleh Admin Panitia.
          </p>
        </div>
        <div className="pt-2 text-xs text-slate-500 border-t border-slate-800/80">
          Silakan lengkapi nilai Anda pada tab <strong className="text-red-400">Formulir Penilaian Juri</strong>.
        </div>
      </div>
    );
  }

  const sortedRecap = [...recapData].sort((a, b) => b.averageScore - a.averageScore || b.totalScore - a.totalScore);
  const juara1 = sortedRecap[0];
  const juara2 = sortedRecap[1];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Action (Hidden during print) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-lg font-bold text-white">
            Pratinjau Dokumen Cetak Resmi (Berita Acara)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Format disesuaikan untuk dicetak di kertas A4 atau disimpan ke PDF bertanda tangan Ketua RW.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer flex-shrink-0"
        >
          <Printer className="w-4 h-4" />
          Cetak Dokumen / Simpan PDF
        </button>
      </div>

      {/* Official Document Paper Simulation */}
      <div className="bg-white text-slate-900 p-8 sm:p-12 rounded-2xl shadow-2xl max-w-4xl mx-auto border border-slate-200 font-sans print:p-0 print:shadow-none print:border-none print:max-w-none print:w-full font-serif">
        
        {/* Header Title Block */}
        <div className="text-center border-b-2 border-slate-900 pb-4 mb-6 space-y-1">
          <h1 className="text-lg sm:text-xl font-extrabold tracking-wide uppercase">
            REKAPITULASI & PENETAPAN PEMENANG {eventInfo.competitionTitle}
          </h1>
          <h2 className="text-sm font-bold tracking-wider text-slate-700 uppercase">
            LEMBAR PENETAPAN HASIL LOMBA
          </h2>
          <p className="text-xs text-slate-500 font-sans mt-1">
            {eventInfo.eventName} • {eventInfo.location}
          </p>
        </div>

        {/* Winner Announcement Section */}
        {juara1 && juara1.averageScore > 0 ? (
          <div className="mb-8 bg-slate-50 border border-slate-300 rounded-xl p-5 space-y-3 font-sans">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 text-center border-b border-slate-200 pb-2">
              🏆 HASIL KEPUTUSAN PENETAPAN PEMENANG LOMBA
            </h3>

            {participants.length > 10 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Juara 1 */}
                  {sortedRecap[0] && (
                    <div className="bg-amber-100/70 border border-amber-400 rounded-lg p-3 text-center">
                      <span className="text-[10px] font-black text-amber-900 uppercase tracking-widest block">
                        JUARA I (PERTAMA)
                      </span>
                      <div className="text-lg font-black text-slate-900 my-1">
                        PESERTA #{sortedRecap[0].participantCode}
                      </div>
                      <div className="text-xs font-bold text-amber-950">
                        Skor Rata-Rata: {sortedRecap[0].averageScore}
                      </div>
                    </div>
                  )}

                  {/* Juara 2 */}
                  {sortedRecap[1] && (
                    <div className="bg-slate-200/70 border border-slate-300 rounded-lg p-3 text-center">
                      <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest block">
                        JUARA II (KEDUA)
                      </span>
                      <div className="text-lg font-black text-slate-900 my-1">
                        PESERTA #{sortedRecap[1].participantCode}
                      </div>
                      <div className="text-xs font-bold text-slate-800">
                        Skor Rata-Rata: {sortedRecap[1].averageScore}
                      </div>
                    </div>
                  )}

                  {/* Juara 3 */}
                  {sortedRecap[2] && (
                    <div className="bg-amber-800/10 border border-amber-700/30 rounded-lg p-3 text-center">
                      <span className="text-[10px] font-black text-amber-900 uppercase tracking-widest block">
                        JUARA III (KETIGA)
                      </span>
                      <div className="text-lg font-black text-slate-900 my-1">
                        PESERTA #{sortedRecap[2].participantCode}
                      </div>
                      <div className="text-xs font-bold text-slate-800">
                        Skor Rata-Rata: {sortedRecap[2].averageScore}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-200 pt-2">
                  {/* Harapan 1 */}
                  {sortedRecap[3] && (
                    <div className="bg-white border border-slate-300 rounded-lg p-2.5 flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-800">JUARA HARAPAN I:</span>
                      <span className="font-black text-slate-900">PESERTA #{sortedRecap[3].participantCode} <span className="font-normal text-slate-600">({sortedRecap[3].averageScore})</span></span>
                    </div>
                  )}

                  {/* Harapan 2 */}
                  {sortedRecap[4] && (
                    <div className="bg-white border border-slate-300 rounded-lg p-2.5 flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-800">JUARA HARAPAN II:</span>
                      <span className="font-black text-slate-900">PESERTA #{sortedRecap[4].participantCode} <span className="font-normal text-slate-600">({sortedRecap[4].averageScore})</span></span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-amber-100/60 border border-amber-300 rounded-lg p-3 text-center">
                  <span className="text-[10px] font-black text-amber-900 uppercase tracking-widest block">
                    JUARA I (PERTAMA)
                  </span>
                  <div className="text-xl font-black text-slate-900 my-1">
                    PESERTA {juara1.participantCode}
                  </div>
                  <div className="text-xs font-bold text-amber-950">
                    Rata-Rata Nilai: {juara1.averageScore} <span className="font-normal text-slate-600">(Total: {juara1.totalScore} poin)</span>
                  </div>
                </div>

                {juara2 && (
                  <div className="bg-slate-200/60 border border-slate-300 rounded-lg p-3 text-center">
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest block">
                      JUARA II (KEDUA)
                    </span>
                    <div className="text-xl font-black text-slate-900 my-1">
                      PESERTA {juara2.participantCode}
                    </div>
                    <div className="text-xs font-bold text-slate-800">
                      Rata-Rata Nilai: {juara2.averageScore} <span className="font-normal text-slate-600">(Total: {juara2.totalScore} poin)</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-center text-xs text-amber-800 font-sans">
            Penilaian sedang berlangsung. Hasil penetapan juara akan otomatis terisi setelah seluruh juri memasukkan nilai.
          </div>
        )}

        {/* Detailed Scores Matrix Table */}
        <div className="space-y-2 mb-8 font-sans">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
            MATRIKS NILAI DEWAN JURI:
          </h3>
          <table className="w-full text-left text-xs border-collapse border border-slate-900">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-900 font-bold uppercase text-slate-900 text-center">
                <th className="border border-slate-900 px-3 py-2">{participants.length > 10 ? 'PESERTA' : 'RT PESERTA'}</th>
                {judges.map((j) => (
                  <th key={j.id} className="border border-slate-900 px-2 py-2">
                    {j.name || j.code}
                  </th>
                ))}
                <th className="border border-slate-900 px-3 py-2 bg-slate-200">Total Nilai</th>
                <th className="border border-slate-900 px-3 py-2 bg-amber-100">Rata-Rata</th>
                <th className="border border-slate-900 px-3 py-2">Peringkat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 font-medium">
              {participants.map((participant) => {
                const recap = recapData.find((r) => r.participantId === participant.id);
                if (!recap) return null;

                const isRank1 = recap.rank === 1 && recap.averageScore > 0;

                return (
                  <tr key={participant.id} className={`text-center ${isRank1 ? 'bg-amber-50 font-bold' : ''}`}>
                    <td className="border border-slate-900 px-3 py-2 font-bold bg-slate-50">
                      {participant.name}
                    </td>
                    {judges.map((j) => {
                      const scoreVal = recap.scoresByJudge[j.id];
                      return (
                        <td key={j.id} className="border border-slate-900 px-2 py-2">
                          {scoreVal === 'N/A' ? (
                            <span className="text-[10px] text-slate-400 italic">N/A</span>
                          ) : (
                            scoreVal || 0
                          )}
                        </td>
                      );
                    })}
                    <td className="border border-slate-900 px-3 py-2 font-bold bg-slate-100">
                      {recap.totalScore}
                    </td>
                    <td className="border border-slate-900 px-3 py-2 font-black text-amber-900 bg-amber-100">
                      {recap.averageScore}
                    </td>
                    <td className="border border-slate-900 px-3 py-2 font-bold">
                      {isRank1 ? '🏆 Juara 1' : recap.rank === 2 && recap.averageScore > 0 ? '🥈 Juara 2' : `#${recap.rank}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legal Signatures Section */}
        <div className="mt-12 pt-6 border-t border-slate-300 font-sans space-y-6 break-inside-avoid">
          <div className="flex items-center justify-between text-xs text-slate-700">
            <div>
              Ditetapkan di: <strong className="text-slate-900">{eventInfo.location}</strong>
            </div>
            <div>
              Tanggal: <strong className="text-slate-900">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 text-center text-xs pt-4">
            <div className="space-y-16">
              <div>
                <p className="font-medium text-slate-600">Mengetahui & Menyetujui,</p>
                <p className="font-bold text-slate-900 mt-0.5">{eventInfo.approver}</p>
              </div>
              <div>
                <p className="font-extrabold text-slate-900 border-b border-slate-900 inline-block px-8 pb-1">
                  ( _______________________ )
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Tanda Tangan & Stempel Resmi</p>
              </div>
            </div>

            <div className="space-y-16">
              <div>
                <p className="font-medium text-slate-600">Panitia Penyelenggara,</p>
                <p className="font-bold text-slate-900 mt-0.5">{eventInfo.organizer}</p>
              </div>
              <div>
                <p className="font-extrabold text-slate-900 border-b border-slate-900 inline-block px-8 pb-1">
                  ( _______________________ )
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Tanda Tangan Sie Acara</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
