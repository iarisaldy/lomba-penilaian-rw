import { Criteria, EventInfo, Judge, Participant } from '../types/scoring';

export const EVENT_INFO: EventInfo = {
  eventName: 'HUT KEMERDEKAAN RI KE-81',
  location: 'PERMATA DISCOVERY',
  competitionTitle: 'LOMBA BLIND RIAS IBU-IBU',
  subtitle: 'Sistem Penilaian & Rekapitulasi Otomatis',
  organizer: 'Koordinator Sie Acara',
  approver: 'Ketua RW Permata Discovery',
  adminPin: '8024',
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
  { id: 'juri_rt01', code: 'RT 01', name: 'Juri RT 01', pin: '4819' },
  { id: 'juri_rt02', code: 'RT 02', name: 'Juri RT 02', pin: '7263' },
  { id: 'juri_rt03', code: 'RT 03', name: 'Juri RT 03', pin: '3951' },
  { id: 'juri_rt04', code: 'RT 04', name: 'Juri RT 04', pin: '6148' },
  { id: 'juri_rt05', code: 'RT 05', name: 'Juri RT 05', pin: '8527' },
  { id: 'juri_rt06', code: 'RT 06', name: 'Juri RT 06', pin: '9372' },
];

// Preset 2: Lomba Sepeda Hias
export const SEPEDA_HIAS_EVENT_INFO: EventInfo = {
  eventName: 'HUT KEMERDEKAAN RI KE-81',
  location: 'PERMATA DISCOVERY',
  competitionTitle: 'LOMBA SEPEDA HIAS',
  subtitle: 'Sistem Penilaian Peserta Individu (Skala 1 - 10)',
  organizer: 'Koordinator Sie Acara',
  approver: 'Ketua RW Permata Discovery',
  adminPin: '8024',
};

export const SEPEDA_HIAS_CRITERIA: Criteria[] = [
  { id: 'c_sepeda_1', name: 'Nilai Sepeda Hias (Kreativitas, Kerapian, Keindahan)', maxScore: 10 },
];

// Daftar 76 Peserta Lomba Sepeda Hias sesuai CSV Pendaftaran Final (Pendaftaran Ditutup)
export const SEPEDA_HIAS_PARTICIPANTS: Participant[] = [
  { id: 'p_001', code: '001', name: 'zeevanya noera calista', rt: 'RT 01', isAttending: true },
  { id: 'p_002', code: '002', name: 'Leticia Addara Gianella Wilis', rt: 'RT 02', isAttending: true },
  { id: 'p_003', code: '003', name: 'Ameena', rt: 'RT 01', isAttending: true },
  { id: 'p_004', code: '004', name: 'Dafandra Arkyn A.', rt: 'RT 05', isAttending: true },
  { id: 'p_005', code: '005', name: 'Arcelio Ali Zayn Elfano', rt: 'RT 06', isAttending: true },
  { id: 'p_006', code: '006', name: 'nalar', rt: 'RT 06', isAttending: true },
  { id: 'p_007', code: '007', name: 'Isabella Zalina Putri', rt: 'RT 04', isAttending: true },
  { id: 'p_008', code: '008', name: 'SABINA AZKIARA ABDILLAH', rt: 'RT 06', isAttending: true },
  { id: 'p_009', code: '009', name: 'Muhammad alvaro nizam', rt: 'RT 05', isAttending: true },
  { id: 'p_010', code: '010', name: 'Muhammad Ravindra Rifniyawan', rt: 'RT 03', isAttending: true },
  { id: 'p_011', code: '011', name: 'Freya Nazifa Almaira', rt: 'RT 05', isAttending: true },
  { id: 'p_012', code: '012', name: 'ghaziya almahyra wibisono', rt: 'RT 03', isAttending: true },
  { id: 'p_013', code: '013', name: 'Arshiya Meidira Puteri Pratama', rt: 'RT 01', isAttending: true },
  { id: 'p_014', code: '014', name: 'Muhammad Alfatih Syawal', rt: 'RT 06', isAttending: true },
  { id: 'p_015', code: '015', name: 'Danish', rt: 'RT 03', isAttending: true },
  { id: 'p_016', code: '016', name: 'Syifa Elshanum Rizqiana', rt: 'RT 05', isAttending: true },
  { id: 'p_017', code: '017', name: 'Muhammad Angga Saputra', rt: 'RT 06', isAttending: true },
  { id: 'p_018', code: '018', name: 'Arrazka Rasyafa Aqmar', rt: 'RT 05', isAttending: true },
  { id: 'p_019', code: '019', name: 'Raya Zayna', rt: 'RT 02', isAttending: true },
  { id: 'p_020', code: '020', name: 'Kaafi dirga n.', rt: 'RT 03', isAttending: true },
  { id: 'p_021', code: '021', name: 'Kiara', rt: 'RT 06', isAttending: true },
  { id: 'p_022', code: '022', name: 'Avisha putri rifniyawati', rt: 'RT 03', isAttending: true },
  { id: 'p_023', code: '023', name: 'Muhammad Ashraf Zehan', rt: 'RT 03', isAttending: true },
  { id: 'p_024', code: '024', name: 'Muhammad Azzam Alfatih', rt: 'RT 06', isAttending: true },
  { id: 'p_025', code: '025', name: 'Nabila Zea Farkhanadima', rt: 'RT 01', isAttending: true },
  { id: 'p_026', code: '026', name: 'Arsyila Anindira Puteri Pratama', rt: 'RT 01', isAttending: true },
  { id: 'p_027', code: '027', name: 'Zahrah Faranisa Aznii', rt: 'RT 03', isAttending: true },
  { id: 'p_028', code: '028', name: 'Alana Kavita Andhira', rt: 'RT 02', isAttending: true },
  { id: 'p_029', code: '029', name: 'Zayn arkhanza', rt: 'RT 03', isAttending: true },
  { id: 'p_030', code: '030', name: 'Fechia', rt: 'RT 02', isAttending: true },
  { id: 'p_031', code: '031', name: 'Varendra dhefin el fathih', rt: 'RT 01', isAttending: true },
  { id: 'p_032', code: '032', name: 'Azmi', rt: 'RT 03', isAttending: true },
  { id: 'p_033', code: '033', name: 'Barran Raka Samudra', rt: 'RT 01', isAttending: true },
  { id: 'p_034', code: '034', name: 'Fatian Naqa Al Qarni', rt: 'RT 05', isAttending: true },
  { id: 'p_035', code: '035', name: 'Maheswari Radisha', rt: 'RT 01', isAttending: true },
  { id: 'p_036', code: '036', name: 'Afreen', rt: 'RT 03', isAttending: true },
  { id: 'p_037', code: '037', name: 'Azarya Mephalti Tanjung', rt: 'RT 03', isAttending: true },
  { id: 'p_038', code: '038', name: 'Adeeva', rt: 'RT 03', isAttending: true },
  { id: 'p_039', code: '039', name: 'Kenny Baskara Z.', rt: 'RT 05', isAttending: true },
  { id: 'p_040', code: '040', name: 'Abiseka Atharrazka Gafi', rt: 'RT 06', isAttending: true },
  { id: 'p_041', code: '041', name: 'Danial Arsalan Putra Permana', rt: 'RT 04', isAttending: true },
  { id: 'p_042', code: '042', name: 'Malik', rt: 'RT 03', isAttending: true },
  { id: 'p_043', code: '043', name: 'Arumi Azkadina Razeeta', rt: 'RT 05', isAttending: true },
  { id: 'p_044', code: '044', name: 'M. Aulian Ahzan Alfarizqi', rt: 'RT 05', isAttending: true },
  { id: 'p_045', code: '045', name: 'Nathan Arsyanendra Hadi Mahawira', rt: 'RT 03', isAttending: true },
  { id: 'p_046', code: '046', name: 'xavier rachman', rt: 'RT 04', isAttending: true },
  { id: 'p_047', code: '047', name: 'Kirana Miqaila Amadea', rt: 'RT 02', isAttending: true },
  { id: 'p_048', code: '048', name: 'Almira shakayla naureen', rt: 'RT 01', isAttending: true },
  { id: 'p_049', code: '049', name: 'Rumaisha Azzahwa', rt: 'RT 06', isAttending: true },
  { id: 'p_050', code: '050', name: 'Muhammad Zayan zhafir riadi', rt: 'RT 06', isAttending: true },
  { id: 'p_051', code: '051', name: 'Khaalid Armagan Manurung', rt: 'RT 06', isAttending: true },
  { id: 'p_052', code: '052', name: 'Maulana Arka Baihaqi', rt: 'RT 03', isAttending: true },
  { id: 'p_053', code: '053', name: 'Devandra', rt: 'RT 02', isAttending: true },
  { id: 'p_054', code: '054', name: 'Alula Zerina', rt: 'RT 02', isAttending: true },
  { id: 'p_055', code: '055', name: 'Achmad Fauzan Alfarizi', rt: 'RT 03', isAttending: true },
  { id: 'p_056', code: '056', name: 'Axelle rafisqi kurniawan', rt: 'RT 06', isAttending: true },
  { id: 'p_057', code: '057', name: 'Haidar Harsyad Attaki', rt: 'RT 06', isAttending: true },
  { id: 'p_058', code: '058', name: 'Syaura Aish', rt: 'RT 03', isAttending: true },
  { id: 'p_059', code: '059', name: 'Freya', rt: 'RT 02', isAttending: true },
  { id: 'p_060', code: '060', name: 'Ararinda Pramesti Rumi', rt: 'RT 02', isAttending: true },
  { id: 'p_061', code: '061', name: 'Muhammad Ghaisan Atay Rizqi', rt: 'RT 05', isAttending: true },
  { id: 'p_062', code: '062', name: 'Ibrahim Arsya Maulana', rt: 'RT 02', isAttending: true },
  { id: 'p_063', code: '063', name: 'Hanif Zafran El Azzam', rt: 'RT 01', isAttending: true },
  { id: 'p_064', code: '064', name: 'Diandra', rt: 'RT 02', isAttending: true },
  { id: 'p_065', code: '065', name: 'Kaesang Dwi Erlangga Tavi', rt: 'RT 05', isAttending: true },
  { id: 'p_066', code: '066', name: 'saga', rt: 'RT 06', isAttending: true },
  { id: 'p_067', code: '067', name: 'Emira', rt: 'RT 06', isAttending: true },
  { id: 'p_068', code: '068', name: 'Syauqi Al Ghaisan Hidayat', rt: 'RT 01', isAttending: true },
  { id: 'p_069', code: '069', name: 'Alfarizqi Bramantya Wibisana (Rama)', rt: 'RT 03', isAttending: true },
  { id: 'p_070', code: '070', name: 'Safea Eliza Khayr', rt: 'RT 02', isAttending: true },
  { id: 'p_071', code: '071', name: 'rauffa abraham', rt: 'RT 03', isAttending: true },
  { id: 'p_072', code: '072', name: 'Ceisya', rt: 'RT 03', isAttending: true },
  { id: 'p_073', code: '073', name: 'Muhammad Abduh', rt: 'RT 06', isAttending: true },
  { id: 'p_074', code: '074', name: 'Yusuf Yobel Tanjung', rt: 'RT 03', isAttending: true },
  { id: 'p_075', code: '075', name: 'Albian Virendra Anugerah Tavi', rt: 'RT 05', isAttending: true },
  { id: 'p_076', code: '076', name: 'Misyah zahira ramadhani', rt: 'RT 05', isAttending: true },
];

export const SEPEDA_HIAS_JUDGES: Judge[] = [
  { id: 'juri_rt01', code: 'Ketua RT 01', name: 'Ketua RT 01', pin: '4819' },
  { id: 'juri_rt02', code: 'Ketua RT 02', name: 'Ketua RT 02', pin: '7263' },
  { id: 'juri_rt03', code: 'Ketua RT 03', name: 'Ketua RT 03', pin: '3951' },
  { id: 'juri_rt04', code: 'Ketua RT 04', name: 'Ketua RT 04', pin: '6148' },
  { id: 'juri_rt05', code: 'Ketua RT 05', name: 'Ketua RT 05', pin: '8527' },
  { id: 'juri_rt06', code: 'Ketua RT 06', name: 'Ketua RT 06', pin: '9372' },
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
