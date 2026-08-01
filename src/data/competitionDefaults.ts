import { Criteria, Judge, Participant } from '../types/scoring';

export const EVENT_INFO = {
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
