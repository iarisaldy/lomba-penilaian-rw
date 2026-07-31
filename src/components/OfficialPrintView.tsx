'use client';

import React from 'react';
import { useScore } from '../context/ScoreContext';
import { EVENT_INFO } from '../data/competitionDefaults';
import { Printer, Download } from 'lucide-react';

export const OfficialPrintView: React.FC = () => {
  const { judges, participants, recapData } = useScore();

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
            Format telah disesuaikan persis dengan dokumen fisik <span className="text-amber-400 font-semibold">rekap_penilaian_sie_acara_rw_v3.pdf</span> untuk dicetak di kertas A4 atau disimpan ke PDF.
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
            REKAPITULASI & PENETAPAN PEMENANG {EVENT_INFO.competitionTitle}
          </h1>
          <h2 className="text-sm font-bold tracking-wider text-slate-700 uppercase">
            LEMBAR PENETAPAN HASIL LOMBA
          </h2>
          <p className="text-xs font-semibold text-slate-600">
            {EVENT_INFO.eventName} • {EVENT_INFO.location}
          </p>
        </div>

        {/* Petunjuk Pengisian */}
        <div className="mb-6 space-y-1 text-xs text-slate-800 leading-relaxed bg-slate-50 p-4 border border-slate-300 rounded-md print:bg-transparent">
          <div className="font-bold text-slate-900 mb-1">
            Petunjuk Pengisian Rekapitulasi:
          </div>
          <ol className="list-decimal list-inside space-y-0.5 font-medium">
            <li>Salin total nilai dari lembar penilaian 6 juri (Juri RT 01 s/d RT 06) ke dalam tabel rekapitulasi di bawah ini.</li>
            <li>Hitung Total Nilai Akhir dan Rata-Rata Nilai untuk tiap RT peserta.</li>
            <li>Tentukan pemenang Juara 1 dan Juara 2 berdasarkan Rata-Rata Nilai tertinggi.</li>
          </ol>
        </div>

        {/* Matrix Table */}
        <div className="mb-8 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse border border-slate-900">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-900 text-center">
                <th className="border border-slate-900 p-2.5 font-bold min-w-[90px]">
                  RT Peserta
                </th>
                {judges.map((j) => (
                  <th key={j.id} className="border border-slate-900 p-1.5 font-bold text-[11px] min-w-[70px]">
                    Nilai dari Juri {j.code}
                  </th>
                ))}
                <th className="border border-slate-900 p-2 font-bold min-w-[85px] bg-slate-50">
                  Total Nilai (Jumlah)
                </th>
                <th className="border border-slate-900 p-2 font-bold min-w-[85px] bg-slate-50">
                  Rata-Rata Nilai
                </th>
                <th className="border border-slate-900 p-2 font-bold min-w-[100px]">
                  Peringkat / Juara
                </th>
              </tr>
            </thead>
            <tbody>
              {participants.map((participant) => {
                const recap = recapData.find((r) => r.participantId === participant.id);
                if (!recap) return null;

                const isJuara1 = recap.rank === 1 && recap.averageScore > 0;
                const isJuara2 = recap.rank === 2 && recap.averageScore > 0;

                return (
                  <tr key={participant.id} className="border-b border-slate-900 text-center font-medium">
                    <td className="border border-slate-900 p-2 font-bold text-left bg-slate-50">
                      {participant.code}
                    </td>

                    {judges.map((j) => {
                      const scoreVal = recap.scoresByJudge[j.id];
                      const isSelf = scoreVal === 'N/A';

                      return (
                        <td key={j.id} className="border border-slate-900 p-2 text-[11px]">
                          {isSelf ? (
                            <span className="text-slate-500 font-semibold text-[10px]">
                              N/A (RT Sendiri)
                            </span>
                          ) : (
                            <span>{typeof scoreVal === 'number' ? scoreVal : 0}</span>
                          )}
                        </td>
                      );
                    })}

                    <td className="border border-slate-900 p-2 font-bold">
                      {recap.totalScore}
                    </td>

                    <td className="border border-slate-900 p-2 font-black text-slate-950 bg-slate-50 text-xs">
                      {recap.averageScore}
                    </td>

                    <td className="border border-slate-900 p-2 font-bold">
                      {isJuara1 ? (
                        <span className="font-extrabold text-amber-700">🏆 JUARA 1</span>
                      ) : isJuara2 ? (
                        <span className="font-bold text-slate-700">🥈 JUARA 2</span>
                      ) : (
                        <span className="text-slate-600 text-[11px]">Peringkat #{recap.rank}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Juara Decision Box */}
        <div className="border-2 border-slate-900 p-4 rounded-md mb-12 space-y-3 bg-slate-50 print:bg-transparent">
          <div className="flex items-center justify-between border-b border-slate-400 pb-2">
            <div className="font-black text-sm flex items-center gap-2">
              <span>🏆 JUARA 1</span>
            </div>
            <div className="font-bold text-xs text-slate-800">
              Pemenang: <span className="font-black text-slate-950 text-sm uppercase underline ml-1">{juara1 && juara1.averageScore > 0 ? `${juara1.participantName} (${juara1.participantCode})` : '....................'}</span>
            </div>
            <div className="text-xs font-semibold">
              Nilai Rata-Rata: <span className="font-bold text-slate-950">{juara1 && juara1.averageScore > 0 ? juara1.averageScore : '....................'}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="font-black text-sm flex items-center gap-2">
              <span>🥈 JUARA 2</span>
            </div>
            <div className="font-bold text-xs text-slate-800">
              Pemenang: <span className="font-black text-slate-950 text-sm uppercase underline ml-1">{juara2 && juara2.averageScore > 0 ? `${juara2.participantName} (${juara2.participantCode})` : '....................'}</span>
            </div>
            <div className="text-xs font-semibold">
              Nilai Rata-Rata: <span className="font-bold text-slate-950">{juara2 && juara2.averageScore > 0 ? juara2.averageScore : '....................'}</span>
            </div>
          </div>
        </div>

        {/* Signatures Block */}
        <div className="grid grid-cols-2 gap-8 text-center text-xs mt-12 mb-8 font-sans">
          <div className="space-y-16">
            <div>
              <p className="font-semibold text-slate-700">Panitia Pelaksana,</p>
              <p className="font-bold text-slate-900">{EVENT_INFO.organizer}</p>
            </div>
            <div className="font-bold border-b border-slate-900 pb-1 w-48 mx-auto text-slate-400">
              ( .................................................... )
            </div>
          </div>

          <div className="space-y-16">
            <div>
              <p className="font-semibold text-slate-700">Mengetahui & Menyetujui,</p>
              <p className="font-bold text-slate-900">{EVENT_INFO.approver}</p>
            </div>
            <div className="font-bold border-b border-slate-900 pb-1 w-48 mx-auto text-slate-400">
              ( .................................................... )
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="border-t border-slate-300 pt-3 flex items-center justify-between text-[10px] text-slate-500 font-sans">
          <span>{EVENT_INFO.eventName} • {EVENT_INFO.location}</span>
          <span>HUT RI ke-81 • Permata Discovery • Lembar Keputusan Sie Acara & Ketua RW Halaman 1 dari 1</span>
        </div>

      </div>
    </div>
  );
};
