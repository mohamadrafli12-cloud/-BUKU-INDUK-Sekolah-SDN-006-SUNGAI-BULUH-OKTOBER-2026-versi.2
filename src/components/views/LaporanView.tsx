import React, { useState } from 'react';
import { 
  FileText, 
  Award, 
  UserMinus, 
  GraduationCap, 
  BookOpen, 
  CreditCard, 
  Download, 
  Printer, 
  FileSpreadsheet, 
  Search, 
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  Share2,
  History,
  Database,
  RotateCcw,
  Cloud,
  HeartHandshake,
  UserX,
  BarChart2,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { ActiveTab } from '../layout/Sidebar';
import { cn, formatIndonesianDate } from '../../lib/utils';
import { Student } from '../../types';
import { downloadExcelTemplate } from '../../utils/excelHelper';

interface LaporanViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  onOpenActivityLogs?: () => void;
  onBack?: () => void;
  onOpenRestoreDatabase?: () => void;
  onOpenGoogleDriveBackup?: () => void;
}

export const LaporanView: React.FC<LaporanViewProps> = ({
  setActiveTab,
  onOpenActivityLogs,
  onBack,
  onOpenRestoreDatabase,
  onOpenGoogleDriveBackup,
}) => {
  const { 
    students, 
    schoolProfile, 
    exportStudentsCSV, 
    exportDatabaseJSON,
    exportDatabaseDB,
    activityLogs,
    currentRole 
  } = useSchool();

  const [activeCategory, setActiveCategory] = useState<'all' | 'akademik' | 'mutasi' | 'cetak' | 'ekspor' | 'audit'>('all');
  const [deceasedSearch, setDeceasedSearch] = useState('');
  const [deceasedKelasFilter, setDeceasedKelasFilter] = useState('all');

  const totalSiswa = students.length;
  const siswaAktif = students.filter(s => s.status === 'Aktif').length;
  const siswaLulus = students.filter(s => s.status === 'Lulus').length;
  const siswaMutasi = students.filter(s => s.status === 'Mutasi Keluar').length;
  const siswaMeninggalList = students.filter(s => s.status === 'Meninggal');
  const siswaMeninggalCount = siswaMeninggalList.length;
  const totalRaport = students.reduce((acc, s) => acc + (s.raport?.length || 0), 0);

  // Helper untuk Siswa Meninggal
  const getTanggalMeninggal = (s: Student) => {
    return (
      (s as any).tanggalMeninggal ||
      s.mutasi?.tglMeninggalkan ||
      s.mutasi?.dikeluarkanTanggal ||
      (s.updatedAt ? s.updatedAt.split('T')[0] : '-')
    );
  };

  const getKelasTerakhir = (s: Student) => {
    return s.mutasi?.dariKelas || s.kelasSekarang || '-';
  };

  const getPenyebabKeterangan = (s: Student) => {
    const alasan = s.mutasi?.alasanPindah;
    const ket = s.mutasi?.keterangan;
    const penyakit = s.kesehatan?.penyakitPernahDiderita;

    const parts: string[] = [];
    if (alasan) parts.push(alasan);
    if (ket && ket !== alasan) parts.push(ket);
    if (penyakit && !parts.some(p => p.toLowerCase().includes(penyakit.toLowerCase()))) {
      parts.push(`Riwayat kesehatan: ${penyakit}`);
    }
    return parts.length > 0 ? parts.join(' • ') : 'Meninggal Dunia';
  };

  const uniqueClassesMeninggal = Array.from(new Set(siswaMeninggalList.map(s => getKelasTerakhir(s)))).filter(Boolean);

  const filteredSiswaMeninggal = siswaMeninggalList.filter(s => {
    const kelas = getKelasTerakhir(s);
    if (deceasedKelasFilter !== 'all' && kelas !== deceasedKelasFilter) return false;
    if (!deceasedSearch.trim()) return true;
    const q = deceasedSearch.toLowerCase();
    const nama = (s.namaLengkap || '').toLowerCase();
    const nis = (s.noInduk || '').toLowerCase();
    const nisn = (s.nisn || '').toLowerCase();
    const ket = getPenyebabKeterangan(s).toLowerCase();
    return nama.includes(q) || nis.includes(q) || nisn.includes(q) || kelas.toLowerCase().includes(q) || ket.includes(q);
  });

  const reportItems: {
    id: string;
    targetTab?: ActiveTab;
    title: string;
    subtitle: string;
    description: string;
    category: 'akademik' | 'mutasi' | 'cetak' | 'ekspor' | 'audit';
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    badge: string;
    badgeColor: string;
    actionLabel: string;
    onAction?: () => void;
  }[] = [
    {
      id: 'activity-log',
      title: 'Catatan Aktivitas & Log Audit Buku Induk',
      subtitle: 'Audit Transparan Penambahan & Pengubahan Data',
      description: 'Merekam riwayat lengkap siapa petugas atau guru yang menambah, mengubah identitas, menginput raport, maupun menghapus data siswa.',
      category: 'audit',
      icon: History,
      iconBg: 'bg-blue-50 dark:bg-blue-950/60',
      iconColor: 'text-blue-600 dark:text-blue-400',
      badge: `${activityLogs.length} Log Aktivitas`,
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
      actionLabel: 'Buka Catatan Aktivitas',
      onAction: onOpenActivityLogs,
    },
    {
      id: 'raport',
      targetTab: 'raport',
      title: 'Laporan Rekap Nilai Raport',
      subtitle: 'Nilai Semester 1 - 12 Peserta Didik',
      description: 'Rekapitulasi lengkap nilai pengetahuan, keterampilan, predikat KKM, sikap, dan ekstrakurikuler siswa.',
      category: 'akademik',
      icon: Award,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      badge: `${totalRaport} Lembar Terisi`,
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
      actionLabel: 'Buka Rekap Raport',
    },
    {
      id: 'buku-induk',
      targetTab: 'print-buku-induk',
      title: 'Cetak Lembar Buku Induk Resmi',
      subtitle: 'Format 2 Halaman Standar Kemdikbud',
      description: 'Dokumen arsip resmi lembar muka & belakang berisi biodata, kesehatan, orang tua, riwayat pendidikan & nilai akhir.',
      category: 'cetak',
      icon: BookOpen,
      iconBg: 'bg-blue-50 dark:bg-blue-950/60',
      iconColor: 'text-[#003399] dark:text-blue-400',
      badge: 'Standar Arsip',
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
      actionLabel: 'Buka Lembar Cetak',
    },
    {
      id: 'kartu-pelajar',
      targetTab: 'kartu-pelajar',
      title: 'Cetak Kartu Pelajar & Peserta Ujian',
      subtitle: 'Dilengkapi Barcode NISN & QR-Code',
      description: 'Pencetakan kartu identitas siswa otomatis depan & belakang per kelas atau per siswa siap cetak.',
      category: 'cetak',
      icon: CreditCard,
      iconBg: 'bg-purple-50 dark:bg-purple-950/60',
      iconColor: 'text-purple-600 dark:text-purple-400',
      badge: `${siswaAktif} Siswa Aktif`,
      badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
      actionLabel: 'Cetak Kartu Pelajar',
    },
    {
      id: 'mutasi',
      targetTab: 'mutasi',
      title: 'Laporan Mutasi & Siswa Pindah',
      subtitle: 'Rekap Riwayat Siswa Keluar / Masuk',
      description: 'Laporan registrasi mutasi lengkap nomor surat pindah, sekolah tujuan, dan alasan meninggalkan sekolah.',
      category: 'mutasi',
      icon: UserMinus,
      iconBg: 'bg-amber-50 dark:bg-amber-950/60',
      iconColor: 'text-amber-600 dark:text-amber-400',
      badge: `${siswaMutasi} Siswa Mutasi`,
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
      actionLabel: 'Buka Laporan Mutasi',
    },
    {
      id: 'sttb',
      targetTab: 'sttb',
      title: 'Laporan Kelulusan & Tanda Terima STTB / Ijazah',
      subtitle: 'Buku Register Ijazah & Serah Terima',
      description: 'Daftar alumni, nomor seri ijazah, nomor SKHU, nama penerima, dan tanggal penyerahan dokumen ijazah.',
      category: 'mutasi',
      icon: GraduationCap,
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/60',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      badge: `${siswaLulus} Lulusan / Alumni`,
      badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
      actionLabel: 'Buka Register Ijazah',
    },
    {
      id: 'siswa-meninggal-report',
      title: 'Laporan Siswa Meninggal Dunia',
      subtitle: 'Arsip Peserta Didik Wafat & Rekapitulasi Berkas',
      description: 'Daftar resmi peserta didik yang wafat/meninggal dunia, kelas terakhir, tanggal wafat, dan penyebab/keterangan yang terhubung langsung dengan statistik bulanan & periodik siswa aktif.',
      category: 'mutasi',
      icon: HeartHandshake,
      iconBg: 'bg-rose-50 dark:bg-rose-950/60',
      iconColor: 'text-rose-600 dark:text-rose-400',
      badge: `${siswaMeninggalCount} Siswa Wafat`,
      badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
      actionLabel: 'Buka Rekap Siswa Meninggal',
      onAction: () => {
        const el = document.getElementById('div-siswa-meninggal');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
          el.classList.add('ring-2', 'ring-rose-500');
          setTimeout(() => el.classList.remove('ring-2', 'ring-rose-500'), 2000);
        }
      },
    },
    {
      id: 'blanko-buku-induk',
      targetTab: 'print-blank-buku-induk',
      title: 'Cetak Blanko / Lembar Kosong Buku Induk',
      subtitle: 'Formulir Manual Isian Pendaftaran',
      description: 'Lembar fisik kosong bergaris siap cetak untuk arsip manual kantor tata usaha sekolah.',
      category: 'cetak',
      icon: Printer,
      iconBg: 'bg-slate-100 dark:bg-slate-800',
      iconColor: 'text-slate-700 dark:text-slate-300',
      badge: 'Formulir Fisik',
      badgeColor: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
      actionLabel: 'Cetak Blanko Kosong',
    },
    {
      id: 'template-excel',
      title: 'Template Format Excel Buku Induk Siswa',
      subtitle: 'Standar Formulir Isian Massal (.XLSX)',
      description: 'Template resmi berisi 60+ kolom buku induk standar Kemdikbud, baris percontohan, dan lembar petunjuk pengisian.',
      category: 'ekspor',
      icon: FileSpreadsheet,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60',
      iconColor: 'text-emerald-700 dark:text-emerald-400',
      badge: 'Format Resmi',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
      actionLabel: 'Unduh Template Excel',
      onAction: () => downloadExcelTemplate(schoolProfile.namaSekolah),
    },
    {
      id: 'export-db',
      title: 'Ekspor Basis Data Siswa (.DB)',
      subtitle: 'Pencadangan Manual Offline Mandiri',
      description: 'Unduh seluruh basis data siswa saat ini sebagai file .db terstruktur untuk pencadangan offline darurat dan pemulihan mandiri.',
      category: 'ekspor',
      icon: Database,
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/60',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      badge: 'Format .DB',
      badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
      actionLabel: 'Unduh File .DB Offline',
      onAction: () => exportDatabaseDB(),
    },
    {
      id: 'restore-db',
      title: 'Kembalikan Basis Data Siswa (.DB)',
      subtitle: 'Pemulihan dari File Cadangan .DB',
      description: 'Pulihkan seluruh data siswa, profil sekolah, nilai raport, dan arsip buku induk dari file cadangan .db atau .json.',
      category: 'ekspor',
      icon: RotateCcw,
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/60',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      badge: 'Format .DB',
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
      actionLabel: 'Buka Menu Kembalikan DB',
      onAction: () => {
        if (onOpenRestoreDatabase) {
          onOpenRestoreDatabase();
        } else {
          setActiveTab('admin-settings');
        }
      },
    },
    {
      id: 'export-csv',
      title: 'Ekspor Data Siswa ke Microsoft Excel (.XLSX)',
      subtitle: 'Format Rapi 100% Sesuai Template Buku Induk',
      description: 'Berkas spreadsheet Microsoft Excel (.xlsx) resmi berisi 69 kolom lengkap, header bertingkat, serta lembar petunjuk pengisian yang siap pakai dan kompatibel untuk impor kembali.',
      category: 'ekspor',
      icon: FileSpreadsheet,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      badge: 'Excel .XLSX',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
      actionLabel: 'Unduh Berkas Excel (.xlsx)',
      onAction: () => exportStudentsCSV(),
    },
    {
      id: 'export-rombel-excel',
      targetTab: 'active-students',
      title: 'Daftar Siswa per Rombel (.XLSX) untuk Wali Kelas',
      subtitle: 'Format Khusus Administrasi Guru Wali Kelas',
      description: 'Unduh daftar siswa per rombel lengkap dengan nama wali kelas, nomor kontak orang tua, kolom presensi kehadiran (S/I/A), dan tanda tangan dokumen resmi.',
      category: 'ekspor',
      icon: FileSpreadsheet,
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      badge: 'Per Rombel .XLSX',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
      actionLabel: 'Buka Unduh Rombel',
    },
    {
      id: 'export-backup',
      title: 'Cadangan Data Lengkap (Backup JSON)',
      subtitle: 'Arsip Digital Seluruh Sistem',
      description: 'Cadangan penuh seluruh data siswa, profil sekolah, raport, mutasi, dan pengaturan sistem.',
      category: 'ekspor',
      icon: Download,
      iconBg: 'bg-blue-50 dark:bg-blue-950/60',
      iconColor: 'text-blue-600 dark:text-blue-400',
      badge: 'Full Backup',
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
      actionLabel: 'Unduh File Cadangan',
      onAction: () => exportDatabaseJSON(),
    },
    {
      id: 'export-google-drive',
      title: 'Cadangan Cloud Google Drive',
      subtitle: 'Simpan ke Google Drive Akun Sekolah',
      description: 'Simpan salinan database Buku Induk langsung ke Google Drive dan pulihkan kapan saja dari awan.',
      category: 'ekspor',
      icon: Cloud,
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/60',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      badge: 'Google Drive',
      badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
      actionLabel: 'Buka Menu Google Drive',
      onAction: () => {
        if (onOpenGoogleDriveBackup) onOpenGoogleDriveBackup();
      },
    },
  ];

  const filteredReports = reportItems.filter(
    item => activeCategory === 'all' || item.category === activeCategory
  );

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <button
            onClick={() => (onBack ? onBack() : setActiveTab('dashboard'))}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
            title="Kembali ke Dashboard Utama"
          >
            <ArrowLeft className="w-4 h-4 text-[#003399] dark:text-blue-400" />
            <span className="hidden sm:inline">Kembali</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                Pusat Laporan & Cetak Dokumen
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 font-extrabold text-xs">
                Resmi & Rekap
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Akses cepat laporan raport, mutasi, kelulusan ijazah, cetak buku induk, kartu pelajar, dan ekspor data
            </p>
          </div>
        </div>

        {/* Quick export shortcut */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportStudentsCSV()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 font-bold text-xs hover:bg-emerald-100 transition-colors cursor-pointer"
            title="Ekspor seluruh data siswa ke format Excel (.xlsx) rapi standar Dapodik"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Ekspor Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Category filter tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/60 dark:bg-slate-800/80 rounded-2xl max-w-fit overflow-x-auto">
        <button
          onClick={() => setActiveCategory('all')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer",
            activeCategory === 'all'
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          )}
        >
          Semua Laporan ({reportItems.length})
        </button>
        <button
          onClick={() => setActiveCategory('akademik')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer",
            activeCategory === 'akademik'
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          )}
        >
          Nilai & Akademik
        </button>
        <button
          onClick={() => setActiveCategory('cetak')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer",
            activeCategory === 'cetak'
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          )}
        >
          Cetak Dokumen & Kartu
        </button>
        <button
          onClick={() => setActiveCategory('mutasi')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer",
            activeCategory === 'mutasi'
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          )}
        >
          Mutasi & Kelulusan
        </button>
        <button
          onClick={() => setActiveCategory('ekspor')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer",
            activeCategory === 'ekspor'
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          )}
        >
          Ekspor & Cadangan
        </button>
        <button
          onClick={() => setActiveCategory('audit')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer",
            activeCategory === 'audit'
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          )}
        >
          Catatan Aktivitas
        </button>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReports.map((report) => {
          const Icon = report.icon;
          return (
            <div
              key={report.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-700 transition-all group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 transition-transform group-hover:scale-105",
                    report.iconBg
                  )}>
                    <Icon className={cn("w-5 h-5", report.iconColor)} />
                  </div>
                  <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0", report.badgeColor)}>
                    {report.badge}
                  </span>
                </div>

                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 group-hover:text-[#003399] dark:group-hover:text-blue-400 transition-colors">
                  {report.title}
                </h3>
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                  {report.subtitle}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2.5 leading-relaxed">
                  {report.description}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    if (report.onAction) {
                      report.onAction();
                    } else if (report.targetTab) {
                      setActiveTab(report.targetTab);
                    }
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-[#003399] hover:text-white dark:hover:bg-blue-600 dark:hover:text-white text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-between transition-all group/btn cursor-pointer"
                >
                  <span>{report.actionLabel}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover/btn:text-white group-hover/btn:translate-x-0.5 transition-all" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* DIV BARU: SISWA MENINGGAL DUNIA                                           */}
      {/* Terhubung dengan data siswa aktif - Statistik Bulanan & Periodik          */}
      {/* ========================================================================= */}
      <div
        id="div-siswa-meninggal"
        className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden scroll-mt-6 transition-all"
      >
        {/* Header Div */}
        <div className="p-5 md:p-6 border-b border-slate-200 dark:border-slate-800 bg-linear-to-r from-rose-50/70 via-white to-slate-50 dark:from-rose-950/20 dark:via-slate-900 dark:to-slate-900/60">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 shadow-2xs">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                    Siswa Meninggal Dunia
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                    {siswaMeninggalList.length} Siswa Tercatat
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    Arsip Khusus Buku Induk
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Rekap data resmi peserta didik wafat, kelas terakhir, tanggal wafat, dan penyebab/keterangan — Terhubung dengan <strong>Data Siswa Aktif - Statistik Bulanan & Periodik</strong>
                </p>
              </div>
            </div>

            {/* Quick action button connecting to active students periodic stats */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('active-students')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#003399] hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition-all hover:shadow-md cursor-pointer group"
                title="Buka Data Siswa Aktif dan lihat kartu Statistik Bulanan & Periodik"
              >
                <BarChart2 className="w-4 h-4 text-blue-200 group-hover:scale-110 transition-transform" />
                <span>Buka Statistik Bulanan & Periodik Siswa Aktif</span>
                <ChevronRight className="w-4 h-4 text-blue-200 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Banner Keterhubungan Data Siswa Aktif & Statistik Periodik */}
        <div className="p-4 mx-5 my-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 text-xs font-black shadow-2xs mt-0.5">
              🔗
            </div>
            <div>
              <div className="font-extrabold text-blue-950 dark:text-blue-200 flex items-center gap-2 flex-wrap">
                <span>Sinkronisasi Otomatis dengan Statistik Periodik Siswa Aktif</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-200 font-bold">
                  Siswa Aktif → Statistik Bulanan
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-1 leading-relaxed">
                Setiap siswa berstatus <strong>Meninggal</strong> otomatis dihitung pada kartu <em>Statistik Bulanan & Periodik Siswa Aktif</em> dalam kolom tersendiri (<strong>Meninggal Dunia</strong>), memotong populasi siswa riil per rombel dan tingkat pada bulan kejadian tanpa mencampurnya ke dalam Mutasi Keluar reguler.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('active-students')}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-2xs cursor-pointer self-start sm:self-auto"
          >
            <span>Buka di Siswa Aktif</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={deceasedSearch}
                onChange={(e) => setDeceasedSearch(e.target.value)}
                placeholder="Cari nama siswa, NIS, NISN, atau penyebab..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {deceasedSearch && (
              <button
                type="button"
                onClick={() => setDeceasedSearch('')}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold px-2 py-1 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-[11px]">Kelas:</span>
              <select
                value={deceasedKelasFilter}
                onChange={(e) => setDeceasedKelasFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
              >
                <option value="all">Semua Kelas ({siswaMeninggalList.length})</option>
                {uniqueClassesMeninggal.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hidden md:inline ml-2">
              Menampilkan {filteredSiswaMeninggal.length} dari {siswaMeninggalList.length} siswa
            </span>
          </div>
        </div>

        {/* Tabel Data Siswa Meninggal Dunia */}
        {filteredSiswaMeninggal.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[11px] font-bold">
                  <th className="py-3 px-4 w-12 text-center">No.</th>
                  <th className="py-3 px-4">Data Siswa (Nama / NIS / NISN / JK)</th>
                  <th className="py-3 px-4 w-36">Kelas Terakhir</th>
                  <th className="py-3 px-4 w-44">Tanggal Meninggal</th>
                  <th className="py-3 px-4 min-w-[220px]">Penyebab / Keterangan</th>
                  <th className="py-3 px-4 w-44 text-right">Koneksi Statistik</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredSiswaMeninggal.map((student, idx) => {
                  const tglMeninggal = getTanggalMeninggal(student);
                  const kelasTerakhir = getKelasTerakhir(student);
                  const penyebabKet = getPenyebabKeterangan(student);
                  const formattedTgl = formatIndonesianDate(tglMeninggal);

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-rose-50/30 dark:hover:bg-rose-950/10 transition-colors group"
                    >
                      {/* No */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200">
                        {idx + 1}
                      </td>

                      {/* Data Siswa */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-extrabold shrink-0 overflow-hidden">
                            {student.fotoUrl ? (
                              <img
                                src={student.fotoUrl}
                                alt={student.namaLengkap}
                                className="w-full h-full object-cover grayscale contrast-125"
                              />
                            ) : (
                              <span>{(student.namaLengkap || 'S')[0]}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-tight flex items-center gap-1.5 flex-wrap">
                              <span>{student.namaLengkap}</span>
                              <span className={cn(
                                "px-1.5 py-0.2 rounded text-[10px] font-extrabold border",
                                student.jenisKelamin === 'L'
                                  ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300"
                                  : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300"
                              )}>
                                {student.jenisKelamin === 'L' ? 'L' : 'P'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>NIS: <strong className="font-semibold text-slate-700 dark:text-slate-300">{student.noInduk || '-'}</strong></span>
                              <span>•</span>
                              <span>NISN: <strong className="font-semibold text-slate-700 dark:text-slate-300">{student.nisn || '-'}</strong></span>
                            </div>
                            {student.tempatLahir && student.tanggalLahir && (
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                Lahir: {student.tempatLahir}, {student.tanggalLahir}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Kelas Terakhir */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold text-xs">
                          <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>{kelasTerakhir}</span>
                        </div>
                      </td>

                      {/* Tanggal Meninggal Dunia */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-bold">
                          <Calendar className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>{formattedTgl}</span>
                        </div>
                        {tglMeninggal !== '-' && (
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            {tglMeninggal}
                          </div>
                        )}
                      </td>

                      {/* Penyebab / Keterangan */}
                      <td className="py-3.5 px-4">
                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
                          {penyebabKet}
                        </div>
                      </td>

                      {/* Koneksi Statistik & Aksi */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setActiveTab('active-students')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-[#003399] hover:text-white dark:hover:bg-blue-600 dark:hover:text-white text-[#003399] dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold text-xs transition-all shadow-2xs cursor-pointer group/btn"
                          title="Lihat di Statistik Bulanan & Periodik Siswa Aktif"
                        >
                          <BarChart2 className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
                          <span>Buka Statistik</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <UserX className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {deceasedSearch || deceasedKelasFilter !== 'all'
                ? 'Tidak ada siswa yang cocok dengan filter'
                : 'Belum ada data siswa berstatus Meninggal Dunia'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {deceasedSearch || deceasedKelasFilter !== 'all'
                ? 'Silakan sesuaikan kata kunci pencarian atau pilihan kelas terakhir.'
                : 'Data siswa yang ditandai berstatus Meninggal Dunia akan otomatis tampil di sini dan terhubung dengan rekapitulasi Statistik Bulanan & Periodik.'}
            </p>
            {(deceasedSearch || deceasedKelasFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setDeceasedSearch('');
                  setDeceasedKelasFilter('all');
                }}
                className="mt-3 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 cursor-pointer"
              >
                Reset Semua Filter
              </button>
            )}
          </div>
        )}

        {/* Footer Div */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Status sinkron: Terhubung dengan <strong>Statistik Periodik Siswa Aktif</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('active-students')}
              className="text-[#003399] dark:text-blue-400 hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Periksa Rekap Perubahan Siswa Bulanan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
