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
  Cloud
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { ActiveTab } from '../layout/Sidebar';
import { cn } from '../../lib/utils';
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

  const totalSiswa = students.length;
  const siswaAktif = students.filter(s => s.status === 'Aktif').length;
  const siswaLulus = students.filter(s => s.status === 'Lulus').length;
  const siswaMutasi = students.filter(s => s.status === 'Mutasi Keluar').length;
  const totalRaport = students.reduce((acc, s) => acc + (s.raport?.length || 0), 0);

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
    </div>
  );
};
