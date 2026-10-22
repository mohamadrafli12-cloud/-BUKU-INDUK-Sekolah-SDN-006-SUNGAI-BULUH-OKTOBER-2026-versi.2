import { Student, SchoolProfile } from '../types';
import { safeLocalStorageSet } from './storageHelper';

export type AlertSeverity = 'urgent' | 'warning' | 'info';
export type AlertCategory = 'mutasi' | 'ijazah' | 'dapodik';

export interface SchoolAlert {
  id: string;
  studentId: string;
  studentName: string;
  nis: string;
  nisn: string;
  kelas: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  message: string;
  dueDateOrDaysAgo?: string;
  daysRemainingOrElapsed?: number;
  recommendation: string;
  actionType: 'mutasi' | 'sttb' | 'student_detail';
  createdAt: string;
  isRead?: boolean;
}

const STORAGE_READ_ALERTS = 'buku_induk_read_alert_ids_v1';

export function getReadAlertIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(STORAGE_READ_ALERTS);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function markAlertAsRead(alertId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getReadAlertIds();
    if (!existing.includes(alertId)) {
      const updated = [...existing, alertId].slice(-100);
      safeLocalStorageSet(STORAGE_READ_ALERTS, JSON.stringify(updated));
    }
  } catch (e) {
    console.warn('Failed to mark alert as read:', e);
  }
}

export function markAllAlertsAsRead(alertIds: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = new Set(getReadAlertIds());
    alertIds.forEach(id => existing.add(id));
    const updated = Array.from(existing).slice(-100);
    safeLocalStorageSet(STORAGE_READ_ALERTS, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to mark all alerts as read:', e);
  }
}

export function clearReadAlerts(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_READ_ALERTS);
  } catch {}
}

/**
 * Calculate all operational alerts based on real student records:
 * 1. Batas Waktu Mutasi (30 hari Dapodik, kelengkapan surat mutasi, upload berkas pengesahan)
 * 2. Masa Berlaku Ijazah & STTB (SKL kedaluwarsa 6 bulan, ijazah belum diambil, blangko belum diterbitkan, prasyarat kelas 6)
 */
export function calculateSchoolAlerts(
  students: Student[],
  schoolProfile?: SchoolProfile
): SchoolAlert[] {
  const alerts: SchoolAlert[] = [];
  const today = new Date();
  const readAlertIds = new Set(getReadAlertIds());

  students.forEach((student) => {
    // -------------------------------------------------------------
    // KATEGORI 1: BATAS WAKTU & TINDAK LANJUT MUTASI SISWA
    // -------------------------------------------------------------
    if (student.status === 'Mutasi Keluar') {
      const mutasi = student.mutasi;
      const tglMeninggalkanStr = mutasi?.tglMeninggalkan || student.updatedAt || student.createdAt;
      let daysElapsed = 0;

      if (tglMeninggalkanStr) {
        const tgl = new Date(tglMeninggalkanStr);
        if (!isNaN(tgl.getTime())) {
          const diffMs = today.getTime() - tgl.getTime();
          daysElapsed = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        }
      }

      // 1.1 Batas Waktu Konfirmasi Sekolah Tujuan (Maks 30 Hari Dapodik)
      // Surat keluar sudah lewat 20 hari dan belum ada konfirmasi penerimaan
      const hasConfirmation = Boolean(
        mutasi?.keterangan &&
        (mutasi.keterangan.toLowerCase().includes('sudah diterima') ||
         mutasi.keterangan.toLowerCase().includes('konfirmasi') ||
         mutasi.keterangan.toLowerCase().includes('selesai'))
      );

      if (daysElapsed >= 20 && !hasConfirmation) {
        const isUrgent = daysElapsed >= 30;
        const alertId = `mutasi-deadline-${student.id}`;
        alerts.push({
          id: alertId,
          studentId: student.id,
          studentName: student.namaLengkap,
          nis: student.noInduk,
          nisn: student.nisn,
          kelas: student.kelasSekarang || 'Alumni/Mutasi',
          category: 'mutasi',
          severity: isUrgent ? 'urgent' : 'warning',
          title: isUrgent
            ? `Batas Waktu Mutasi Melebihi 30 Hari (${daysElapsed} Hari)`
            : `Mendekati Batas Waktu Mutasi Dapodik (${daysElapsed}/30 Hari)`,
          message: `Surat mutasi ke "${mutasi?.sekolahTujuan || 'Sekolah Tujuan'}" telah dikeluarkan sejak ${daysElapsed} hari lalu, namun belum ada konfirmasi penerimaan di aplikasi Dapodik tujuan.`,
          dueDateOrDaysAgo: `${daysElapsed} hari berlalu`,
          daysRemainingOrElapsed: daysElapsed,
          recommendation: 'Segera hubungi operator sekolah tujuan untuk memastikan siswa telah ditarik pada Dapodik agar data siswa tidak menggantung di residu dinas.',
          actionType: 'mutasi',
          createdAt: tglMeninggalkanStr || new Date().toISOString(),
          isRead: readAlertIds.has(alertId),
        });
      }

      // 1.2 Surat Mutasi Keluar Tanpa Nomor Surat Resmi
      if (!mutasi?.noSuratPindah || mutasi.noSuratPindah.trim() === '') {
        const alertId = `mutasi-no-surat-${student.id}`;
        alerts.push({
          id: alertId,
          studentId: student.id,
          studentName: student.namaLengkap,
          nis: student.noInduk,
          nisn: student.nisn,
          kelas: student.kelasSekarang || 'Alumni/Mutasi',
          category: 'mutasi',
          severity: 'urgent',
          title: 'Nomor Surat Keterangan Pindah Belum Diterbitkan',
          message: `Siswa telah berstatus Mutasi Keluar ke "${mutasi?.sekolahTujuan || 'Sekolah Baru'}", tetapi nomor registrasi surat pindah belum dicatat pada buku induk.`,
          dueDateOrDaysAgo: 'Wajib Lengkap',
          recommendation: 'Terbitkan nomor surat resmi mutasi dari buku register surat keluar dan lengkapi lembar buku induk siswa.',
          actionType: 'mutasi',
          createdAt: new Date().toISOString(),
          isRead: readAlertIds.has(alertId),
        });
      }

      // 1.3 Berkas Pindai / Foto Pengesahan Mutasi Belum Diunggah
      if (!mutasi?.fotoIjazah || mutasi.fotoIjazah.trim() === '') {
        const alertId = `mutasi-dokumen-${student.id}`;
        alerts.push({
          id: alertId,
          studentId: student.id,
          studentName: student.namaLengkap,
          nis: student.noInduk,
          nisn: student.nisn,
          kelas: student.kelasSekarang || 'Alumni/Mutasi',
          category: 'mutasi',
          severity: 'info',
          title: 'Arsip Salinan Surat Mutasi Belum Diunggah',
          message: `Salinan pindaian (scan/foto) Surat Keterangan Mutasi berstempel sekolah belum didokumentasikan di sistem digital.`,
          dueDateOrDaysAgo: 'Arsip Digital',
          recommendation: 'Unggah pindaian surat pindah resmi yang telah ditandatangani Kepala Sekolah untuk arsip permanen.',
          actionType: 'mutasi',
          createdAt: new Date().toISOString(),
          isRead: readAlertIds.has(alertId),
        });
      }
    }

    // -------------------------------------------------------------
    // KATEGORI 2: MASA BERLAKU, PENGAMBILAN & BLANGKO IJAZAH (STTB)
    // -------------------------------------------------------------
    if (student.status === 'Lulus') {
      const sttb = student.sttb;
      const tglLulusStr = sttb?.tanggalKelulusan || student.updatedAt || student.createdAt;
      let daysSinceGraduation = 0;

      if (tglLulusStr) {
        const tgl = new Date(tglLulusStr);
        if (!isNaN(tgl.getTime())) {
          const diffMs = today.getTime() - tgl.getTime();
          daysSinceGraduation = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        }
      }

      // 2.1 Ijazah / STTB Belum Diambil (Tanda Terima Belum Lengkap)
      const isNotTaken = sttb?.statusTandaTerima === 'Belum Diambil' || !sttb?.tglSerahTerima;
      if (isNotTaken && daysSinceGraduation >= 30) {
        const isUrgent = daysSinceGraduation >= 90;
        const alertId = `ijazah-belum-diambil-${student.id}`;
        alerts.push({
          id: alertId,
          studentId: student.id,
          studentName: student.namaLengkap,
          nis: student.noInduk,
          nisn: student.nisn,
          kelas: student.kelasSekarang || 'Alumni',
          category: 'ijazah',
          severity: isUrgent ? 'urgent' : 'warning',
          title: isUrgent
            ? `Ijazah Belum Diambil Selama ${daysSinceGraduation} Hari`
            : `Ijazah/STTB Belum Diambil (${daysSinceGraduation} Hari Sejak Lulus)`,
          message: `Peserta didik telah lulus pada ${sttb?.tanggalKelulusan || sttb?.lulusTahun || 'Tahun Lulus'}, namun dokumen STTB / Ijazah fisik masih berada di sekolah dan belum diserahterimakan.`,
          dueDateOrDaysAgo: `${daysSinceGraduation} hari sejak kelulusan`,
          daysRemainingOrElapsed: daysSinceGraduation,
          recommendation: 'Beri pemberitahuan kepada orang tua/wali siswa untuk segera melakukan cap tiga jari dan serah terima dokumen ijazah asli.',
          actionType: 'sttb',
          createdAt: tglLulusStr || new Date().toISOString(),
          isRead: readAlertIds.has(alertId),
        });
      }

      // 2.2 Nomor Seri Ijazah Belum Dicatat Pada Alumni Lulus
      if (!sttb?.noIjazah || sttb.noIjazah.trim() === '') {
        const alertId = `ijazah-no-seri-${student.id}`;
        alerts.push({
          id: alertId,
          studentId: student.id,
          studentName: student.namaLengkap,
          nis: student.noInduk,
          nisn: student.nisn,
          kelas: student.kelasSekarang || 'Alumni',
          category: 'ijazah',
          severity: 'urgent',
          title: 'Nomor Ijazah Resmi Belum Terdaftar Pada Buku Induk',
          message: `Data kelulusan tercatat pada Tahun ${sttb?.lulusTahun || 'Lulus'}, namun nomor seri blangko Ijazah resmi dari Kemdikbud belum diinput.`,
          dueDateOrDaysAgo: 'Wajib Lengkap',
          recommendation: 'Buka modul STTB dan inputkan nomor seri ijazah nasional (contoh: DN-09/D-SD/K13/24/...) agar register buku induk lengkap.',
          actionType: 'sttb',
          createdAt: new Date().toISOString(),
          isRead: readAlertIds.has(alertId),
        });
      }

      // 2.3 Masa Berlaku SKL Sementara (Maksimal 6 Bulan / 180 Hari)
      // Jika siswa lulus lebih dari 120 hari dan nomor ijazah definitif masih kosong, SKL sementara mendekati masa kedaluwarsa
      if (daysSinceGraduation >= 120 && (!sttb?.noIjazah || sttb.noIjazah.trim() === '')) {
        const alertId = `skl-kadaluwarsa-${student.id}`;
        const daysLeft = Math.max(0, 180 - daysSinceGraduation);
        alerts.push({
          id: alertId,
          studentId: student.id,
          studentName: student.namaLengkap,
          nis: student.noInduk,
          nisn: student.nisn,
          kelas: student.kelasSekarang || 'Alumni',
          category: 'ijazah',
          severity: 'urgent',
          title: `Masa Berlaku SKL Sementara Mendekati Batas Akhir (${daysLeft} Hari Tersisa)`,
          message: `Surat Keterangan Lulus (SKL) sementara hanya berlaku 6 bulan (180 hari). Kelulusan telah berjalan ${daysSinceGraduation} hari dan nomor ijazah permanen belum didaftarkan.`,
          dueDateOrDaysAgo: `${daysLeft} hari tersisa dari 180 hari`,
          daysRemainingOrElapsed: daysLeft,
          recommendation: 'Konfirmasi pendistribusian blangko Ijazah asli dari Dinas Pendidikan setempat dan terbitkan STTB definitif sebelum SKL kedaluwarsa.',
          actionType: 'sttb',
          createdAt: new Date().toISOString(),
          isRead: readAlertIds.has(alertId),
        });
      }
    }

    // -------------------------------------------------------------
    // KATEGORI 3: KELAS TINGKAT AKHIR (KELAS 6) MENJELANG KELULUSAN
    // -------------------------------------------------------------
    if (student.status === 'Aktif' && (student.kelasSekarang === 'Kelas 6' || student.kelasSekarang.includes('6'))) {
      const isNisnEmpty = !student.nisn || student.nisn.trim() === '';
      const isNikEmpty = !student.nik || student.nik.trim() === '';

      if (isNisnEmpty || isNikEmpty) {
        const alertId = `prasyarat-kelas6-${student.id}`;
        alerts.push({
          id: alertId,
          studentId: student.id,
          studentName: student.namaLengkap,
          nis: student.noInduk,
          nisn: student.nisn || '-',
          kelas: student.kelasSekarang,
          category: 'dapodik',
          severity: 'warning',
          title: `Prasyarat Pendataan Ijazah Belum Lengkap (${student.kelasSekarang})`,
          message: `Siswa kelas 6 tingkat akhir belum memiliki ${[isNisnEmpty ? 'NISN resmi' : '', isNikEmpty ? 'NIK Dukcapil' : ''].filter(Boolean).join(' dan ')}. Data ini wajib valid untuk pencetakan ijazah.`,
          dueDateOrDaysAgo: 'Persiapan Ujian',
          recommendation: 'Lakukan validasi data NIK dan NISN melalui VervalPD Dapodik Kemdikbud sebelum penutupan nominasi peserta ujian/ijazah.',
          actionType: 'student_detail',
          createdAt: new Date().toISOString(),
          isRead: readAlertIds.has(alertId),
        });
      }
    }
  });

  // Sort: Urgent first, then Warning, then Info, then by studentName
  const severityScore: Record<AlertSeverity, number> = { urgent: 0, warning: 1, info: 2 };
  return alerts.sort((a, b) => {
    if (severityScore[a.severity] !== severityScore[b.severity]) {
      return severityScore[a.severity] - severityScore[b.severity];
    }
    return a.studentName.localeCompare(b.studentName);
  });
}
