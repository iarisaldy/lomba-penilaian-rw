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
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Search,
  Filter,
  Check,
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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
                Pengaturan Lomba & Kriteria (Admin)
              </h2>
              <p className="text-xs text-slate-400">
                Atur judul lomba, custom kriteria & bobot skor, kelola juri, atau kunci sistem penilaian.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master System Lock Control Banner */}
        <div className={`p-4 border-b flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 ${
          isSystemLocked ? 'bg-red-950/40 border-red-500/40' : 'bg-slate-950/50 border-slate-800'
        }`}>
          <div className="flex items-center gap-3 text-center sm:text-left">
            {isSystemLocked ? (
              <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
                <Unlock className="w-5 h-5" />
              </div>
            )}
            <div>
              <h4 className="font-extrabold text-sm text-white flex items-center justify-center sm:justify-start gap-2">
                Status Sistem Penilaian: {isSystemLocked ? <span className="text-red-400">TERKUNCI (FINAL)</span> : <span className="text-emerald-400">TERBUKA (INPUT AKTIF)</span>}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {isSystemLocked
                  ? 'Seluruh lembar penilaian juri terkunci total. Nilai aman dan tidak dapat diubah siapapun.'
                  : 'Juri sedang dapat menginput dan mengedit nilai pada formulir masing-masing.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => toggleMasterSystemLock()}
            className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
              isSystemLocked
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30'
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
          <div className="bg-emerald-500/20 border-b border-emerald-500/30 text-emerald-300 text-xs font-bold py-2.5 px-4 text-center flex items-center justify-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
            {savedMessage}
          </div>
        )}

        {/* Sub-Tabs Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-4 gap-2 overflow-x-auto shrink-0 min-h-[48px] items-stretch">
          <button
            onClick={() => setActiveSubTab('attendance')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'attendance'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ClipboardCheck className="w-4 h-4 text-emerald-400" /> 📋 Absensi Peserta ({participants.filter(p => p.isAttending !== false).length}/{participants.length})
          </button>

          <button
            onClick={() => setActiveSubTab('info')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'info'
                ? 'border-amber-400 text-amber-400 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" /> Informasi Lomba
          </button>

          <button
            onClick={() => setActiveSubTab('criteria')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'criteria'
                ? 'border-amber-400 text-amber-400 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" /> Kriteria Penilaian ({criteriaForm.length})
          </button>

          <button
            onClick={() => setActiveSubTab('participants')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'participants'
                ? 'border-amber-400 text-amber-400 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" /> Kelola Peserta ({participantForm.length})
          </button>

          <button
            onClick={() => setActiveSubTab('judges')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'judges'
                ? 'border-amber-400 text-amber-400 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" /> Kelola Juri ({judgeForm.length})
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 0: ABSENSI PESERTA (CHECK-IN) */}
          {activeSubTab === 'attendance' && (
            <div className="space-y-4">
              {/* Summary Counter Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Terdaftar</span>
                  <span className="text-xl sm:text-2xl font-black text-white">{participants.length}</span>
                </div>
                <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-3.5 text-center">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Hadir (~40)</span>
                  <span className="text-xl sm:text-2xl font-black text-emerald-400">
                    {participants.filter((p) => p.isAttending !== false).length}
                  </span>
                </div>
                <div className="bg-red-950/40 border border-red-500/30 rounded-2xl p-3.5 text-center">
                  <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider block">Tidak Hadir / Absen</span>
                  <span className="text-xl sm:text-2xl font-black text-red-400">
                    {participants.filter((p) => p.isAttending === false).length}
                  </span>
                </div>
              </div>

              {/* Toolbar: Search, RT Filter & Quick Actions */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-60">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari nomor / nama..."
                      value={attendanceSearch}
                      onChange={(e) => setAttendanceSearch(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <select
                    value={attendanceRtFilter}
                    onChange={(e) => setAttendanceRtFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-xs text-amber-400 font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-amber-400"
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
                    className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer"
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
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
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
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 touch-manipulation ${
                        isPresent
                          ? 'bg-emerald-950/30 border-emerald-500/40 shadow-md shadow-emerald-950/20'
                          : 'bg-slate-950/60 border-slate-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black border ${
                          isPresent
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {p.code}
                        </span>
                        <div>
                          <h5 className="text-xs font-bold text-white leading-tight">{p.name}</h5>
                          <span className="text-[10px] text-amber-400 font-semibold">{p.rt || 'RT --'}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-black tracking-wide border transition-all cursor-pointer ${
                          isPresent
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
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
              {/* Preset Template Switcher Card */}
              <div className="bg-slate-950/80 border border-amber-500/30 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-4 h-4" /> Beralih Template Event Lomba (Preset)
                  </h4>
                  <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded-full border border-slate-700">
                    Active: {activeEventId === 'sepeda-hias' ? '🚲 Sepeda Hias' : '🌸 Blind Rias'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Pilih preset di bawah untuk memuat konfigurasi lomba secara instan tanpa menghapus data event lain:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      switchEvent('blind-rias');
                      showToast('🌸 Berhasil berpindah ke Lomba Blind Rias Ibu-Ibu!');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      activeEventId === 'blind-rias'
                        ? 'bg-amber-500/20 border-amber-400 text-white shadow-lg'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-xs font-bold text-amber-300">🌸 Lomba Blind Rias Ibu-Ibu</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">6 Peserta RT • 6 Juri RT • 4 Kriteria</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      switchEvent('sepeda-hias');
                      showToast('🚲 Berhasil berpindah ke Lomba Sepeda Hias!');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      activeEventId === 'sepeda-hias'
                        ? 'bg-amber-500/20 border-amber-400 text-white shadow-lg'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-xs font-bold text-amber-300">🚲 Lomba Sepeda Hias</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">30 Peserta Individu (default) • Ketua RT 1-6 • Skala 1-100</div>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveInfo} className="space-y-4">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Nama Acara / Kegiatan</label>
                  <input
                    type="text"
                    value={eventForm.eventName}
                    onChange={(e) => setEventForm({ ...eventForm, eventName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    placeholder="HUT KEMERDEKAAN RI KE-81"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Lokasi Kegiatan</label>
                  <input
                    type="text"
                    value={eventForm.location}
                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    placeholder="PERMATA DISCOVERY"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-amber-400">Judul Utama Lomba</label>
                <input
                  type="text"
                  value={eventForm.competitionTitle}
                  onChange={(e) => setEventForm({ ...eventForm, competitionTitle: e.target.value })}
                  className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-amber-400"
                  placeholder="LOMBA BLIND RIAS IBU-IBU / LOMBA MEWARNAI"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Sub-Judul / Kategori Lomba</label>
                <input
                  type="text"
                  value={eventForm.subtitle}
                  onChange={(e) => setEventForm({ ...eventForm, subtitle: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  placeholder="Sistem Penilaian & Rekapitulasi Otomatis"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Penyelenggara</label>
                  <input
                    type="text"
                    value={eventForm.organizer}
                    onChange={(e) => setEventForm({ ...eventForm, organizer: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    placeholder="Koordinator Sie Acara"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Penanggung Jawab / Ketua RW</label>
                  <input
                    type="text"
                    value={eventForm.approver}
                    onChange={(e) => setEventForm({ ...eventForm, approver: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    placeholder="Ketua RW Permata Discovery"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-red-400">PIN Admin Panitia</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={eventForm.adminPin}
                    onChange={(e) => setEventForm({ ...eventForm, adminPin: e.target.value })}
                    className="w-full bg-slate-950 border border-red-500/40 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-red-400"
                    placeholder="0000"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
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
                  <h3 className="font-extrabold text-sm text-white">Custom Kriteria & Skor Maksimal</h3>
                  <p className="text-xs text-slate-400">
                    Atur nama kriteria dan skor maksimal untuk setiap kriteria. Total skor maksimal dihitung otomatis.
                  </p>
                </div>
                <button
                  onClick={handleAddCriteria}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Kriteria
                </button>
              </div>

              <div className="space-y-3">
                {criteriaForm.map((item, index) => (
                  <div key={item.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
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
                        placeholder="Nama Kriteria (misal: Kerapian)"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div className="w-28 space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400 font-medium">Skor Maks:</span>
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
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-center font-bold text-amber-400 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteCriteria(item.id)}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                      title="Hapus Kriteria"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300">Total Skor Maksimal Lomba:</span>
                <span className="font-black text-amber-400 text-sm">
                  {criteriaForm.reduce((acc, curr) => acc + (curr.maxScore || 0), 0)} Poin
                </span>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSaveCriteria}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Simpan Kriteria Penilaian
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: KELOLA PESERTA */}
          {activeSubTab === 'participants' && (
            <div className="space-y-6">
              {/* Quick Participant Generator Panel */}
              <div className="bg-slate-950/80 border border-amber-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4" /> Format Otomatis Jumlah Peserta ({participants.length} Orang)
                  </h4>
                  <span className="text-[10px] text-slate-400">Generasi cepat Peserta 001 - N</span>
                </div>
                <p className="text-xs text-slate-400">
                  Ubah jumlah total peserta individu secara otomatis (misal: 50, 75, 100, 150 peserta):
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {[25, 50, 75, 100, 150].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        generateParticipantsCount(num);
                        setParticipantForm(
                          Array.from({ length: num }, (_, i) => {
                            const n = i + 1;
                            const formatted = n < 10 ? `00${n}` : n < 100 ? `0${n}` : `${n}`;
                            return { id: `p_${formatted}`, code: formatted, name: `Peserta ${formatted}` };
                          })
                        );
                        showToast(`✅ Berhasil menyesuaikan jumlah peserta menjadi ${num} orang!`);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        participants.length === num
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md scale-105'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      Set {num} Peserta
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-white">Daftar Rincian Peserta Lomba</h3>
                  <p className="text-xs text-slate-400">
                    Atur kode RT atau nama tim/individu peserta yang mengikuti perlombaan.
                  </p>
                </div>
                <button
                  onClick={handleAddParticipant}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Manual
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {participantForm.map((item, index) => (
                  <div key={item.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-red-500/10 text-red-400 font-bold text-xs flex items-center justify-center flex-shrink-0 border border-red-500/20">
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
                        placeholder="Kode (001)"
                        className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-amber-400"
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
                        className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                      <select
                        value={item.rt || `RT 0${(index % 6) + 1}`}
                        onChange={(e) => {
                          const next = [...participantForm];
                          next[index].rt = e.target.value;
                          setParticipantForm(next);
                        }}
                        className="bg-slate-900 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-amber-400 font-bold focus:outline-none focus:border-amber-400"
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
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSaveParticipants}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
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
                  <h3 className="font-extrabold text-sm text-white">Daftar Juri Penilai & PIN Akses</h3>
                  <p className="text-xs text-slate-400">
                    Atur nama juri penilai dan PIN 4 digit untuk login juri.
                  </p>
                </div>
                <button
                  onClick={handleAddJudge}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Juri
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {judgeForm.map((item, index) => (
                  <div key={item.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 font-bold text-xs flex items-center justify-center flex-shrink-0 border border-amber-500/20">
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
                          placeholder="Kode RT (RT 01)"
                          className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-amber-400"
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
                          placeholder="PIN (1111)"
                          className="bg-slate-900 border border-amber-500/40 rounded-xl px-2.5 py-1.5 text-xs font-mono font-black text-amber-400 text-center focus:outline-none focus:border-amber-400"
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
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <button
                      onClick={() => handleDeleteJudge(item.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSaveJudges}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Simpan Daftar Juri & PIN
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Tutup Pengaturan
          </button>
        </div>

      </div>
    </div>
  );
};
