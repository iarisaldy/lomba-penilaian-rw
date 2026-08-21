'use client';

import React, { useState } from 'react';
import { useScore } from '../context/ScoreContext';
import { Criteria, Judge, Participant } from '../types/scoring';
import {
  Settings,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Save,
  Sliders,
  Users,
  UserCheck,
  Building2,
  X,
  CheckCircle2,
  ClipboardCheck,
  Search,
} from 'lucide-react';

interface AdminConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'info' | 'criteria' | 'participants' | 'judges' | 'attendance';
}

export const AdminConfigModal: React.FC<AdminConfigModalProps> = ({ isOpen, onClose, initialTab = 'attendance' }) => {
  const {
    activeEventId,
    switchEvent,
    eventInfo,
    criteria,
    participants,
    judges,
    updateEventInfo,
    updateCriteria,
    updateParticipants,
    generateParticipantsCount,
    updateJudges,
    toggleMasterSystemLock,
    toggleParticipantAttendance,
    setBulkAttendance,
  } = useScore();

  const [activeSubTab, setActiveSubTab] = useState<'info' | 'criteria' | 'participants' | 'judges' | 'attendance'>(initialTab || 'attendance');

  // Form States
  const [eventForm, setEventForm] = useState({ ...eventInfo });
  const [criteriaForm, setCriteriaForm] = useState<Criteria[]>([...criteria]);
  const [participantForm, setParticipantForm] = useState<Participant[]>([...participants]);
  const [judgeForm, setJudgeForm] = useState<Judge[]>([...judges]);

  const [savedMessage, setSavedMessage] = useState('');
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [attendanceRtFilter, setAttendanceRtFilter] = useState<string>('all');

  const filteredAttendanceParticipants = React.useMemo(() => {
    return participants.filter((p) => {
      if (attendanceSearch.trim()) {
        const q = attendanceSearch.toLowerCase().trim();
        const matchCode = p.code.toLowerCase().includes(q);
        const matchName = p.name.toLowerCase().includes(q);
        if (!matchCode && !matchName) return false;
      }
      if (attendanceRtFilter !== 'all') {
        if ((p.rt || '').trim() !== attendanceRtFilter) return false;
      }
      return true;
    });
  }, [participants, attendanceSearch, attendanceRtFilter]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setSavedMessage(msg);
    setTimeout(() => setSavedMessage(''), 3000);
  };

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    updateEventInfo(eventForm);
    showToast('✅ Informasi Lomba berhasil diperbarui!');
  };

  const handleSaveCriteria = () => {
    updateCriteria(criteriaForm);
    showToast('✅ Kriteria Penilaian berhasil disimpan!');
  };

  const handleAddCriteria = () => {
    const newId = `c_${Date.now()}`;
    setCriteriaForm([
      ...criteriaForm,
      { id: newId, name: 'Kriteria Baru', maxScore: 25 },
    ]);
  };

  const handleDeleteCriteria = (id: string) => {
    if (criteriaForm.length <= 1) {
      alert('Minimal harus ada 1 kriteria penilaian!');
      return;
    }
    setCriteriaForm(criteriaForm.filter((c) => c.id !== id));
  };

  const handleSaveParticipants = () => {
    updateParticipants(participantForm);
    showToast('✅ Daftar Peserta berhasil disimpan!');
  };

  const handleAddParticipant = () => {
    const num = participantForm.length + 1;
    const isSepedaHias = activeEventId === 'sepeda-hias';
    if (isSepedaHias) {
      const formattedNum = num < 10 ? `00${num}` : num < 100 ? `0${num}` : `${num}`;
      setParticipantForm([
        ...participantForm,
        { id: `p_${formattedNum}`, code: formattedNum, name: `Peserta ${formattedNum}` },
      ]);
    } else {
      const code = `RT 0${num}`;
      const newId = `rt${num < 10 ? '0' + num : num}`;
      setParticipantForm([
        ...participantForm,
        { id: newId, code, name: code },
      ]);
    }
  };

  const handleDeleteParticipant = (id: string) => {
    if (participantForm.length <= 1) {
      alert('Minimal harus ada 1 peserta!');
      return;
    }
    setParticipantForm(participantForm.filter((p) => p.id !== id));
  };

  const handleSaveJudges = () => {
    updateJudges(judgeForm);
    showToast('✅ Daftar Juri & PIN berhasil disimpan!');
  };

  const handleAddJudge = () => {
    const num = judgeForm.length + 1;
    const code = `RT 0${num}`;
    const newId = `juri_rt${num < 10 ? '0' + num : num}`;
    setJudgeForm([
      ...judgeForm,
      { id: newId, code, name: `Juri ${code}`, pin: `${num}${num}${num}${num}` },
    ]);
  };

  const handleDeleteJudge = (id: string) => {
    if (judgeForm.length <= 1) {
      alert('Minimal harus ada 1 juri!');
      return;
    }
    setJudgeForm(judgeForm.filter((j) => j.id !== id));
  };

  const isSystemLocked = eventInfo.isSystemLocked;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center font-bold">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                Pengaturan Lomba & Kriteria (Admin)
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Atur judul lomba, custom kriteria & bobot skor, absensi peserta, atau kunci sistem penilaian.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master System Lock Control Banner */}
        <div className={`p-4 border-b flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 ${
          isSystemLocked ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'
        }`}>
          <div className="flex items-center gap-3 text-center sm:text-left">
            {isSystemLocked ? (
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 border border-red-300 flex items-center justify-center flex-shrink-0 font-bold">
                <Lock className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center justify-center flex-shrink-0 font-bold">
                <Unlock className="w-5 h-5" />
              </div>
            )}
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center justify-center sm:justify-start gap-2">
                Status Sistem: {isSystemLocked ? <span className="text-red-700 font-black">TERKUNCI (FINAL)</span> : <span className="text-emerald-700 font-black">TERBUKA (INPUT AKTIF)</span>}
              </h4>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">
                {isSystemLocked
                  ? 'Seluruh lembar penilaian juri terkunci total. Nilai aman dan tidak dapat diubah siapapun.'
                  : 'Juri sedang dapat menginput dan mengedit nilai pada formulir masing-masing.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => toggleMasterSystemLock()}
            className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 ${
              isSystemLocked
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30'
                : 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/30'
            }`}
          >
            {isSystemLocked ? (
              <>
                <Unlock className="w-4 h-4" /> Buka Kunci Penilaian
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" /> 🔒 Kunci Semua Penilaian (Final)
              </>
            )}
          </button>
        </div>

        {/* Saved Toast Notification */}
        {savedMessage && (
          <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-bold py-2.5 px-4 text-center flex items-center justify-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {savedMessage}
          </div>
        )}

        {/* Sub-Tabs Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 gap-2 overflow-x-auto shrink-0 min-h-[48px] items-stretch">
          <button
            onClick={() => setActiveSubTab('attendance')}
            className={`py-3 px-4 text-xs font-extrabold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'attendance'
                ? 'border-emerald-600 text-emerald-700 bg-white shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardCheck className="w-4 h-4 text-emerald-600" /> 📋 Absensi Peserta ({participants.filter(p => p.isAttending !== false).length}/{participants.length})
          </button>

          <button
            onClick={() => setActiveSubTab('info')}
            className={`py-3 px-4 text-xs font-extrabold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'info'
                ? 'border-red-600 text-red-700 bg-white shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4 text-red-600" /> Informasi Lomba
          </button>

          <button
            onClick={() => setActiveSubTab('criteria')}
            className={`py-3 px-4 text-xs font-extrabold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'criteria'
                ? 'border-red-600 text-red-700 bg-white shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4 text-red-600" /> Kriteria Penilaian ({criteriaForm.length})
          </button>

          <button
            onClick={() => setActiveSubTab('participants')}
            className={`py-3 px-4 text-xs font-extrabold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'participants'
                ? 'border-red-600 text-red-700 bg-white shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-red-600" /> Kelola Peserta ({participantForm.length})
          </button>

          <button
            onClick={() => setActiveSubTab('judges')}
            className={`py-3 px-4 text-xs font-extrabold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'judges'
                ? 'border-red-600 text-red-700 bg-white shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4 text-red-600" /> Kelola Juri ({judgeForm.length})
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 0: ABSENSI PESERTA (CHECK-IN) */}
          {activeSubTab === 'attendance' && (
            <div className="space-y-4">
              {/* Summary Counter Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-center shadow-sm">
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Total Terdaftar</span>
                  <span className="text-xl sm:text-2xl font-black text-slate-900">{participants.length}</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-center shadow-sm">
                  <span className="text-[10px] text-emerald-800 font-extrabold uppercase tracking-wider block">Hadir</span>
                  <span className="text-xl sm:text-2xl font-black text-emerald-700">
                    {participants.filter((p) => p.isAttending !== false).length}
                  </span>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 text-center shadow-sm">
                  <span className="text-[10px] text-red-800 font-extrabold uppercase tracking-wider block">Tidak Hadir</span>
                  <span className="text-xl sm:text-2xl font-black text-red-700">
                    {participants.filter((p) => p.isAttending === false).length}
                  </span>
                </div>
              </div>

              {/* Toolbar: Search, RT Filter & Quick Actions */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-60">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari nomor / nama..."
                      value={attendanceSearch}
                      onChange={(e) => setAttendanceSearch(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-xs font-semibold text-slate-900 rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <select
                    value={attendanceRtFilter}
                    onChange={(e) => setAttendanceRtFilter(e.target.value)}
                    className="bg-white border border-slate-300 text-xs text-red-700 font-extrabold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-red-500"
                  >
                    <option value="all">Semua RT</option>
                    <option value="RT 01">RT 01</option>
                    <option value="RT 02">RT 02</option>
                    <option value="RT 03">RT 03</option>
                    <option value="RT 04">RT 04</option>
                    <option value="RT 05">RT 05</option>
                    <option value="RT 06">RT 06</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const map: Record<string, boolean> = {};
                      participants.forEach((p) => { map[p.id] = true; });
                      setBulkAttendance(map);
                      showToast('✅ Seluruh peserta ditandai HADIR');
                    }}
                    className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-extrabold transition-all cursor-pointer active:scale-95"
                  >
                    ✅ Tandai Semua Hadir
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const map: Record<string, boolean> = {};
                      participants.forEach((p) => { map[p.id] = false; });
                      setBulkAttendance(map);
                      showToast('❌ Seluruh peserta ditandai TIDAK HADIR');
                    }}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
                  >
                    🔄 Reset Absensi
                  </button>
                </div>
              </div>

              {/* Attendance Grid Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[50vh] overflow-y-auto pr-1">
                {filteredAttendanceParticipants.map((p) => {
                  const isPresent = p.isAttending !== false;
                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleParticipantAttendance(p.id)}
                      className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-2 touch-manipulation ${
                        isPresent
                          ? 'bg-emerald-50/70 border-emerald-300 shadow-sm'
                          : 'bg-slate-100 border-slate-200 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black border ${
                          isPresent
                            ? 'bg-emerald-600 text-white border-emerald-700'
                            : 'bg-slate-200 text-slate-600 border-slate-300'
                        }`}>
                          {p.code}
                        </span>
                        <div>
                          <h5 className="text-xs font-extrabold text-slate-900 leading-tight">{p.name}</h5>
                          <span className="text-[10px] text-blue-700 font-bold">{p.rt || 'RT --'}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-black tracking-wide border transition-all cursor-pointer ${
                          isPresent
                            ? 'bg-emerald-600 text-white border-emerald-700'
                            : 'bg-slate-200 text-slate-600 border-slate-300'
                        }`}
                      >
                        {isPresent ? '✅ HADIR' : '❌ ABSEN'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 1: INFORMASI LOMBA */}
          {activeSubTab === 'info' && (
            <div className="space-y-6 max-w-2xl">
              <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-amber-700" /> Template Event Lomba (Preset)
                  </h4>
                  <span className="text-[10px] bg-white text-slate-800 font-bold px-2 py-0.5 rounded-full border border-slate-300">
                    Aktif: {activeEventId === 'sepeda-hias' ? '🚲 Sepeda Hias' : '🌸 Blind Rias'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      switchEvent('blind-rias');
                      showToast('🌸 Berhasil beralih ke Lomba Blind Rias!');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      activeEventId === 'blind-rias'
                        ? 'bg-red-50 border-red-400 text-red-900 font-bold shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-black">🌸 Lomba Blind Rias Ibu-Ibu</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">6 RT Peserta • 6 Juri RT • 4 Kriteria</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      switchEvent('sepeda-hias');
                      showToast('🚲 Berhasil beralih ke Lomba Sepeda Hias!');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      activeEventId === 'sepeda-hias'
                        ? 'bg-red-50 border-red-400 text-red-900 font-bold shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-black">🚲 Lomba Sepeda Hias</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">76 Peserta • Juri RT 1-6 • Skala 1-10</div>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveInfo} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Nama Acara / Kegiatan</label>
                    <input
                      type="text"
                      value={eventForm.eventName}
                      onChange={(e) => setEventForm({ ...eventForm, eventName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-red-500 focus:bg-white"
                      placeholder="HUT KEMERDEKAAN RI KE-81"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Lokasi Kegiatan</label>
                    <input
                      type="text"
                      value={eventForm.location}
                      onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-red-500 focus:bg-white"
                      placeholder="PERMATA DISCOVERY"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-red-700">Judul Utama Lomba</label>
                  <input
                    type="text"
                    value={eventForm.competitionTitle}
                    onChange={(e) => setEventForm({ ...eventForm, competitionTitle: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-red-300 rounded-xl px-3 py-2.5 text-sm font-black text-slate-900 focus:outline-none focus:border-red-500 focus:bg-white"
                    placeholder="LOMBA SEPEDA HIAS"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Sub-Judul / Kategori Lomba</label>
                  <input
                    type="text"
                    value={eventForm.subtitle}
                    onChange={(e) => setEventForm({ ...eventForm, subtitle: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-red-500 focus:bg-white"
                    placeholder="Sistem Penilaian Peserta Individu"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Penyelenggara</label>
                    <input
                      type="text"
                      value={eventForm.organizer}
                      onChange={(e) => setEventForm({ ...eventForm, organizer: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-red-500 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Penanggung Jawab / Ketua RW</label>
                    <input
                      type="text"
                      value={eventForm.approver}
                      onChange={(e) => setEventForm({ ...eventForm, approver: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-red-500 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-red-700">PIN Admin Panitia</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={eventForm.adminPin}
                      onChange={(e) => setEventForm({ ...eventForm, adminPin: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-red-300 rounded-xl px-3 py-2 text-xs font-mono font-black text-red-700 focus:outline-none focus:border-red-500 focus:bg-white text-center"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-red-600/30 flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Save className="w-4 h-4" /> Simpan Informasi Lomba
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: KRITERIA PENILAIAN & BOBOT */}
          {activeSubTab === 'criteria' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-sm text-slate-900">Custom Kriteria & Skor Maksimal</h3>
                  <p className="text-xs text-slate-500">
                    Atur nama kriteria dan skor maksimal untuk setiap kriteria.
                  </p>
                </div>
                <button
                  onClick={handleAddCriteria}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-900 font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Kriteria
                </button>
              </div>

              <div className="space-y-3">
                {criteriaForm.map((item, index) => (
                  <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center gap-3 shadow-sm">
                    <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </span>

                    <div className="flex-1 space-y-1">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => {
                          const next = [...criteriaForm];
                          next[index].name = e.target.value;
                          setCriteriaForm(next);
                        }}
                        placeholder="Nama Kriteria"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <div className="w-32 space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-600 font-bold">Maks:</span>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={item.maxScore}
                          onChange={(e) => {
                            const next = [...criteriaForm];
                            next[index].maxScore = Number(e.target.value);
                            setCriteriaForm(next);
                          }}
                          className="w-full bg-white border border-slate-300 rounded-xl px-2 py-1.5 text-xs text-center font-black text-red-700 focus:outline-none focus:border-red-500"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteCriteria(item.id)}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                      title="Hapus Kriteria"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Total Skor Maksimal:</span>
                <span className="font-black text-red-700 text-sm">
                  {criteriaForm.reduce((acc, curr) => acc + (curr.maxScore || 0), 0)} Poin
                </span>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSaveCriteria}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-red-600/30 flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Save className="w-4 h-4" /> Simpan Kriteria Penilaian
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: KELOLA PESERTA */}
          {activeSubTab === 'participants' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-sm text-slate-900">Daftar Rincian Peserta ({participantForm.length} Orang)</h3>
                  <p className="text-xs text-slate-500">
                    Atur nama dan RT peserta yang mengikuti perlombaan.
                  </p>
                </div>
                <button
                  onClick={handleAddParticipant}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-900 font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Manual
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                {participantForm.map((item, index) => (
                  <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center gap-3 shadow-sm">
                    <span className="w-7 h-7 rounded-lg bg-red-100 text-red-700 font-black text-xs flex items-center justify-center flex-shrink-0 border border-red-200">
                      {index + 1}
                    </span>

                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={item.code}
                        onChange={(e) => {
                          const next = [...participantForm];
                          next[index].code = e.target.value;
                          setParticipantForm(next);
                        }}
                        placeholder="Kode"
                        className="bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-red-500"
                      />
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => {
                          const next = [...participantForm];
                          next[index].name = e.target.value;
                          setParticipantForm(next);
                        }}
                        placeholder="Nama Peserta"
                        className="bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-red-500"
                      />
                      <select
                        value={item.rt || `RT 0${(index % 6) + 1}`}
                        onChange={(e) => {
                          const next = [...participantForm];
                          next[index].rt = e.target.value;
                          setParticipantForm(next);
                        }}
                        className="bg-white border border-slate-300 rounded-xl px-2 py-1.5 text-xs text-blue-700 font-extrabold focus:outline-none focus:border-red-500"
                      >
                        <option value="RT 01">RT 01</option>
                        <option value="RT 02">RT 02</option>
                        <option value="RT 03">RT 03</option>
                        <option value="RT 04">RT 04</option>
                        <option value="RT 05">RT 05</option>
                        <option value="RT 06">RT 06</option>
                      </select>
                    </div>

                    <button
                      onClick={() => handleDeleteParticipant(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSaveParticipants}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-red-600/30 flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Save className="w-4 h-4" /> Simpan Daftar Peserta
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: KELOLA JURI & PIN */}
          {activeSubTab === 'judges' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-sm text-slate-900">Daftar Juri Penilai & PIN Akses</h3>
                  <p className="text-xs text-slate-500">
                    Atur nama juri penilai dan PIN 4 digit untuk login juri.
                  </p>
                </div>
                <button
                  onClick={handleAddJudge}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-900 font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Juri
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {judgeForm.map((item, index) => (
                  <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center gap-3 shadow-sm">
                    <span className="w-7 h-7 rounded-lg bg-red-100 text-red-700 font-black text-xs flex items-center justify-center flex-shrink-0 border border-red-200">
                      {index + 1}
                    </span>

                    <div className="flex-1 space-y-1.5">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={item.code}
                          onChange={(e) => {
                            const next = [...judgeForm];
                            next[index].code = e.target.value;
                            setJudgeForm(next);
                          }}
                          placeholder="Kode (RT 01)"
                          className="bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-extrabold focus:outline-none focus:border-red-500"
                        />
                        <input
                          type="text"
                          maxLength={6}
                          value={item.pin}
                          onChange={(e) => {
                            const next = [...judgeForm];
                            next[index].pin = e.target.value;
                            setJudgeForm(next);
                          }}
                          placeholder="PIN"
                          className="bg-white border-2 border-red-300 rounded-xl px-2.5 py-1.5 text-xs font-mono font-black text-red-700 text-center focus:outline-none focus:border-red-500"
                        />
                      </div>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => {
                          const next = [...judgeForm];
                          next[index].name = e.target.value;
                          setJudgeForm(next);
                        }}
                        placeholder="Nama Tampilan Juri"
                        className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-xs text-slate-700 font-semibold focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <button
                      onClick={() => handleDeleteJudge(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSaveJudges}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-red-600/30 flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Save className="w-4 h-4" /> Simpan Daftar Juri & PIN
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Tutup Pengaturan
          </button>
        </div>

      </div>
    </div>
  );
};
