import { Criteria, EventInfo, Judge, Participant } from '../types/scoring';

export const EVENT_INFO: EventInfo = {
  eventName: 'HUT KEMERDEKAAN RI KE-81',
  location: 'PERMATA DISCOVERY',
  competitionTitle: 'LOMBA BLIND RIAS IBU-IBU',
  subtitle: 'Sistem Penilaian & Rekapitulasi Otomatis',
  organizer: 'Koordinator Sie Acara',
  approver: 'Ketua RW Permata Discovery',
  adminPin: '0000',
};

export const DEFAULT_CRITERIA: Criteria[] = [
  { id: 'c1', name: 'Kerapian', maxScore: 30 },
  { id: 'c2', name: 'Kreativitas', maxScore: 30 },
  { id: 'c3', name: 'Kesulitan', maxScore: 20 },
  { id: 'c4', name: 'Kekompakan', maxScore: 20 },
];

export const DEFAULT_PARTICIPANTS: Participant[] = [
  { id: 'rt01', code: 'RT 01', name: 'RT 01' },
  { id: 'rt02', code: 'RT 02', name: 'RT 02' },
  { id: 'rt03', code: 'RT 03', name: 'RT 03' },
  { id: 'rt04', code: 'RT 04', name: 'RT 04' },
  { id: 'rt05', code: 'RT 05', name: 'RT 05' },
  { id: 'rt06', code: 'RT 06', name: 'RT 06' },
];

export const DEFAULT_JUDGES: Judge[] = [
  { id: 'juri_rt01', code: 'RT 01', name: 'Juri RT 01', pin: '1111' },
  { id: 'juri_rt02', code: 'RT 02', name: 'Juri RT 02', pin: '2222' },
  { id: 'juri_rt03', code: 'RT 03', name: 'Juri RT 03', pin: '3333' },
  { id: 'juri_rt04', code: 'RT 04', name: 'Juri RT 04', pin: '4444' },
  { id: 'juri_rt05', code: 'RT 05', name: 'Juri RT 05', pin: '5555' },
  { id: 'juri_rt06', code: 'RT 06', name: 'Juri RT 06', pin: '6666' },
];

// Preset 2: Lomba Sepeda Hias
export const SEPEDA_HIAS_EVENT_INFO: EventInfo = {
  eventName: 'HUT KEMERDEKAAN RI KE-81',
  location: 'PERMATA DISCOVERY',
  competitionTitle: 'LOMBA SEPEDA HIAS',
  subtitle: 'Sistem Penilaian Peserta Individu (Skala 1 - 100)',
  organizer: 'Koordinator Sie Acara',
  approver: 'Ketua RW Permata Discovery',
  adminPin: '0000',
};

export const SEPEDA_HIAS_CRITERIA: Criteria[] = [
  { id: 'c_sepeda_1', name: 'Nilai Sepeda Hias (Kreativitas, Kerapian, Keindahan)', maxScore: 100 },
];

export const SEPEDA_HIAS_PARTICIPANTS: Participant[] = Array.from({ length: 100 }, (_, i) => {
  const num = i + 1;
  const formattedNum = num < 10 ? `00${num}` : num < 100 ? `0${num}` : `${num}`;
  return {
    id: `p_${formattedNum}`,
    code: formattedNum,
    name: `Peserta ${formattedNum}`,
  };
});

export const SEPEDA_HIAS_JUDGES: Judge[] = [
  { id: 'juri_rt01', code: 'RT 01', name: 'Ketua RT 01', pin: '1111' },
  { id: 'juri_rt02', code: 'RT 02', name: 'Ketua RT 02', pin: '2222' },
  { id: 'juri_rt03', code: 'RT 03', name: 'Ketua RT 03', pin: '3333' },
  { id: 'juri_rt04', code: 'RT 04', name: 'Ketua RT 04', pin: '4444' },
  { id: 'juri_rt05', code: 'RT 05', name: 'Ketua RT 05', pin: '5555' },
  { id: 'juri_rt06', code: 'RT 06', name: 'Ketua RT 06', pin: '6666' },
];

export interface CompetitionPreset {
  id: string;
  name: string;
  urlKey: string;
  eventInfo: EventInfo;
  criteria: Criteria[];
  participants: Participant[];
  judges: Judge[];
}

export const COMPETITION_PRESETS: Record<string, CompetitionPreset> = {
  'blind-rias': {
    id: 'blind-rias',
    name: 'Lomba Blind Rias Ibu-Ibu',
    urlKey: 'blind-rias',
    eventInfo: EVENT_INFO,
    criteria: DEFAULT_CRITERIA,
    participants: DEFAULT_PARTICIPANTS,
    judges: DEFAULT_JUDGES,
  },
  'sepeda-hias': {
    id: 'sepeda-hias',
    name: 'Lomba Sepeda Hias',
    urlKey: 'sepeda-hias',
    eventInfo: SEPEDA_HIAS_EVENT_INFO,
    criteria: SEPEDA_HIAS_CRITERIA,
    participants: SEPEDA_HIAS_PARTICIPANTS,
    judges: SEPEDA_HIAS_JUDGES,
  },
};

