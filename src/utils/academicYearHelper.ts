import { Student, StudentStatus } from '../types';
import { getAcademicYearFromDate } from '../lib/utils';

/**
 * Mengambil tahun awal dari format Tahun Pelajaran (misal: "2025/2026" -> 2025, "2024" -> 2024)
 */
export function getAcademicYearStart(tp?: string): number {
  if (!tp) return 2026;
  const clean = tp.trim();
  const match = clean.match(/^(\d{4})/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return 2026;
}

/**
 * Mengambil tahun akhir dari format Tahun Pelajaran (misal: "2025/2026" -> 2026)
 */
export function getAcademicYearEnd(tp?: string): number {
  const start = getAcademicYearStart(tp);
  return start + 1;
}

/**
 * Memformat tahun angka ke format Tahun Pelajaran resmi Indonesia (misal: 2025 -> "2025/2026")
 */
export function formatAcademicYear(startYear: number): string {
  return `${startYear}/${startYear + 1}`;
}

/**
 * Helper: Cek apakah kelas berada di tingkat 1 sampai dengan 6 (Sekolah Dasar)
 */
export const isKelas1Sampai6 = (kelasName?: string): boolean => {
  if (!kelasName) return false;
  const k = kelasName.trim().toLowerCase();

  // Exclude non-SD levels explicitly
  if (
    k.includes('alumni') || 
    k.includes('lulus') || 
    k.includes('tamat') || 
    k.includes('belum masuk') ||
    k.includes('tk') || 
    k.includes('paud') || 
    k.includes('kb') ||
    k.includes('tpa') ||
    k.includes('ra') ||
    k.includes('smp') ||
    k.includes('mts') ||
    k.includes('sma') ||
    k.includes('smk')
  ) {
    return false;
  }

  // Exclude secondary grades: 7, 8, 9, 10, 11, 12, VII, VIII, IX, X, XI, XII
  if (/\b(?:kelas|tingkat|rombel)?\s*(?:7|8|9|10|11|12|vii|viii|ix|x|xi|xii)\b/i.test(k)) {
    return false;
  }

  // Check for digits 1-6 (e.g. "Kelas 1", "Kelas 1A", "1B", "Kelas 2", "3-A", "Kelas 6", "6B")
  if (/\b(?:kelas|tingkat|rombel)?\s*([1-6])(?![0-9])/i.test(k)) {
    return true;
  }

  if (/\bvi\b/i.test(k)) return true;
  if (/\bv\b/i.test(k)) return true;
  if (/\biv\b/i.test(k)) return true;
  if (/\biii\b/i.test(k)) return true;
  if (/\bii\b/i.test(k)) return true;
  if (/\bi\b/i.test(k)) return true;

  return false;
};

/**
 * Helper: Mengambil nomor tingkat 1 s/d 6 untuk pengelompokan & kalkulasi naik/turun
 */
export const getTingkatKelasNumber = (kelasName?: string): number => {
  if (!kelasName) return 1;
  const k = kelasName.trim().toLowerCase();

  if (k.includes('belum masuk')) return 0;
  if (k.includes('alumni') || k.includes('lulus')) return 7;

  const numMatch = k.match(/(?:kelas|tingkat|rombel)?\s*([1-6])(?![0-9])/i);
  if (numMatch) return parseInt(numMatch[1], 10);

  if (/\bvi\b/i.test(k)) return 6;
  if (/\bv\b/i.test(k)) return 5;
  if (/\biv\b/i.test(k)) return 4;
  if (/\biii\b/i.test(k)) return 3;
  if (/\bii\b/i.test(k)) return 2;
  if (/\bi\b/i.test(k)) return 1;

  return 1;
};

export interface ProjectedStudent extends Student {
  projectedRombel: string;
  projectedStatus: StudentStatus;
  projectedTingkat: number; // 0 = Belum Masuk SD, 1-6 = Kelas 1-6, 7 = Lulus / Alumni
  isBelumMasukSD: boolean;
  baseRombel: string;
  baseStatus: StudentStatus;
  diffYears: number;
}

/**
 * Menghitung proyeksi rombel dan status siswa secara otomatis berdasarkan Tahun Pelajaran Aktif (targetTP).
 * - Saat ganti TP sebelumnya: data rombel turun, siswa kelas 1 menjadi "Belum Masuk SD"
 * - Saat ganti TP selanjutnya: data rombel naik (kelas 1->2, 2->3, ..., kelas 6 menjadi Lulus/Alumni)
 * - Format rombel variabel (seperti "Kelas 1A", "1B", "Kelas 3-A") tetap mempertahankan kode/abjad rombelnya
 */
export function projectStudentForAcademicYear(
  student: Student,
  targetTP: string,
  baseSchoolTP: string = '2026/2027'
): ProjectedStudent {
  const targetYear = getAcademicYearStart(targetTP);
  
  // Tahun Pelajaran dasar/acuan tempat data kelasSekarang tersimpan (default: "2026/2027")
  const baseYear = getAcademicYearStart(student.tahunPelajaranKelasSekarang || baseSchoolTP || '2026/2027');
  const diffYears = targetYear - baseYear;

  // Tahun Masuk (Tahun Diterima di SD)
  let admissionYear = 2026;
  if (student.tanggalDiterima) {
    const tpMasuk = getAcademicYearFromDate(student.tanggalDiterima);
    admissionYear = getAcademicYearStart(tpMasuk);
  } else if (student.tahunMasuk && /^\d{4}$/.test(student.tahunMasuk.trim())) {
    admissionYear = parseInt(student.tahunMasuk.trim(), 10);
  } else {
    // Estimasi mundur dari kelasSekarang
    const baseGrade = getTingkatKelasNumber(student.kelasSekarang || 'Kelas 1');
    admissionYear = baseYear - (Math.max(1, baseGrade) - 1);
  }

  const admittedGrade = getTingkatKelasNumber(student.diterimaDiKelas || 'Kelas 1');
  const baseGrade = getTingkatKelasNumber(student.kelasSekarang || 'Kelas 1');
  const projectedGrade = baseGrade + diffYears;

  // KONDISI 1: Belum Masuk SD
  // Terjadi jika targetYear sebelum tahun siswa diterima atau proyeksi tingkat <= 0
  if (targetYear < admissionYear || projectedGrade <= 0) {
    return {
      ...student,
      kelasSekarang: 'Belum Masuk SD',
      status: 'Belum Masuk SD',
      projectedRombel: 'Belum Masuk SD',
      projectedStatus: 'Belum Masuk SD',
      projectedTingkat: 0,
      isBelumMasukSD: true,
      baseRombel: student.kelasSekarang,
      baseStatus: student.status,
      diffYears,
    };
  }

  // KONDISI 2: Sudah Lulus / Alumni (Tingkat > 6)
  if (projectedGrade > 6) {
    const estimatedGradYear = admissionYear + (6 - admittedGrade) + 1;
    const alumniLabel = student.sttb?.lulusTahun 
      ? `Alumni (Tahun ${student.sttb.lulusTahun})`
      : `Alumni (Tahun ${estimatedGradYear})`;

    return {
      ...student,
      kelasSekarang: alumniLabel,
      status: 'Lulus',
      projectedRombel: alumniLabel,
      projectedStatus: 'Lulus',
      projectedTingkat: 7,
      isBelumMasukSD: false,
      baseRombel: student.kelasSekarang,
      baseStatus: student.status,
      diffYears,
    };
  }

  // KONDISI 3: Siswa Tingkat 1 s/d 6 pada Tahun Pelajaran target
  // Sinkronisasi status siswa persis dengan Buku Induk Siswa (Aktif, Lulus, Mutasi Keluar, Drop Out, Meninggal)
  let projectedStatus: StudentStatus = student.status || 'Aktif';
  if (student.status === 'Mutasi Keluar') {
    if (student.mutasi?.tglMeninggalkan) {
      const mutasiYear = getAcademicYearStart(getAcademicYearFromDate(student.mutasi.tglMeninggalkan));
      if (targetYear >= mutasiYear) {
        projectedStatus = 'Mutasi Keluar';
      } else {
        projectedStatus = 'Aktif';
      }
    } else {
      projectedStatus = 'Mutasi Keluar';
    }
  } else if (student.status === 'Lulus') {
    if (student.sttb?.lulusTahun) {
      const lulusYear = parseInt(student.sttb.lulusTahun, 10);
      if (targetYear >= lulusYear) {
        projectedStatus = 'Lulus';
      } else {
        projectedStatus = 'Aktif';
      }
    } else {
      projectedStatus = 'Lulus';
    }
  } else if (student.status === 'Drop Out' || student.status === 'Meninggal') {
    projectedStatus = student.status;
  }

  // Rekonstruksi nama rombel dengan mempertahankan awalan & akhiran/abjad
  // Contoh: "Kelas 1A" -> "Kelas 2A", "1B" -> "2B", "Kelas 3-A" -> "Kelas 2-A"
  const rawClass = student.kelasSekarang || 'Kelas 1';
  let projectedRombel = `Kelas ${projectedGrade}`;

  const numMatch = rawClass.match(/^(\s*(?:kelas|tingkat|rombel)?\s*)([1-6])(.*)$/i);
  if (numMatch) {
    const prefix = numMatch[1] || 'Kelas ';
    const suffix = numMatch[3] || '';
    projectedRombel = `${prefix}${projectedGrade}${suffix}`.trim();
  } else if (/\bvi\b/i.test(rawClass) || /\bv\b/i.test(rawClass) || /\biv\b/i.test(rawClass) || /\biii\b/i.test(rawClass) || /\bii\b/i.test(rawClass) || /\bi\b/i.test(rawClass)) {
    const romanGrades = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];
    projectedRombel = `Kelas ${romanGrades[projectedGrade] || projectedGrade}`;
  }

  return {
    ...student,
    kelasSekarang: projectedRombel,
    status: projectedStatus,
    projectedRombel,
    projectedStatus,
    projectedTingkat: projectedGrade,
    isBelumMasukSD: false,
    baseRombel: student.kelasSekarang,
    baseStatus: student.status,
    diffYears,
  };
}

/**
 * Menghitung proyeksi rombel untuk seluruh array siswa berdasarkan Tahun Pelajaran Aktif
 */
export function projectStudentsForAcademicYear(
  students: Student[],
  targetTP: string,
  baseSchoolTP: string = '2026/2027'
): ProjectedStudent[] {
  return students.map(s => projectStudentForAcademicYear(s, targetTP, baseSchoolTP));
}
