import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserCheck, 
  GraduationCap, 
  UserMinus, 
  Eye, 
  TrendingUp, 
  BookOpen, 
  FileText, 
  CreditCard, 
  Award,
  ArrowUpRight, 
  ShieldCheck, 
  Sparkles,
  Calendar,
  Building2,
  School,
  Printer,
  FileSpreadsheet,
  KeyRound,
  Sliders,
  Settings,
  Lock,
  Download,
  ShieldAlert,
  UserCog,
  BarChart3
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line,
  Legend
} from 'recharts';
import { useSchool } from '../../context/SchoolContext';
import { ActiveTab } from '../layout/Sidebar';
import { Student } from '../../types';
import { cn, formatIndonesianDate } from '../../lib/utils';
import { TabelDistribusiPeringkat } from '../analytics/TabelDistribusiPeringkat';
import { EditTahunPelajaranModal } from '../modals/EditTahunPelajaranModal';
import { MonthlyActiveStudentsSummaryCard } from '../common/MonthlyActiveStudentsSummaryCard';
import { projectStudentsForAcademicYear, isKelas1Sampai6, getTingkatKelasNumber } from '../../utils/academicYearHelper';

interface DashboardViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAddModal: () => void;
  onSelectStudentDetail: (studentId: string) => void;
  onMutasi?: (student: Student) => void;
  onSTTB?: (student: Student) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  setActiveTab,
  onOpenAddModal,
  onSelectStudentDetail,
  onMutasi,
  onSTTB,
}) => {
  const { 
    students, 
    schoolProfile, 
    currentRole, 
    exportStudentsCSV,
    exportDatabaseJSON,
    adminUsers,
    rolePermissions,
    securitySettings
  } = useSchool();

  // Active TP & UI state
  const activeTP = schoolProfile.tahunPelajaranAktif || '2026/2027';
  const activeSemester = schoolProfile.semesterAktif || 'Ganjil';
  const [chartMode, setChartMode] = useState<'grouped' | 'stacked'>('grouped');
  const [isEditTPModalOpen, setIsEditTPModalOpen] = useState(false);

  // Metrics calculation
  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === 'Aktif');
  const totalActive = activeStudents.length;
  const totalMale = activeStudents.filter(s => s.jenisKelamin === 'L').length;
  const totalFemale = activeStudents.filter(s => s.jenisKelamin === 'P').length;
  const totalGraduated = students.filter(s => s.status === 'Lulus').length;
  const totalMutated = students.filter(s => s.status === 'Mutasi Keluar').length;

  const projectedStudents = useMemo(() => {
    return projectStudentsForAcademicYear(students, activeTP, '2026/2027');
  }, [students, activeTP]);

  const availableClasses = useMemo(() => {
    const fromProfile = (schoolProfile.daftarKelas || []).filter(isKelas1Sampai6);
    const fromStudents = activeStudents.map(s => s.kelasSekarang).filter(isKelas1Sampai6);
    const baseList = fromProfile.length > 0 ? fromProfile : ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'];
    return Array.from(new Set([...baseList, ...fromStudents])).sort((a, b) => {
      const tA = getTingkatKelasNumber(a);
      const tB = getTingkatKelasNumber(b);
      if (tA !== tB) return tA - tB;
      return a.localeCompare(b, undefined, { numeric: true });
    });
  }, [schoolProfile.daftarKelas, activeStudents]);

  // Check empty required fields in school profile for user guidance
  const requiredProfileFields: { key: keyof typeof schoolProfile; label: string }[] = [
    { key: 'namaSekolah', label: 'Nama Sekolah' },
    { key: 'npsn', label: 'NPSN' },
    { key: 'nss', label: 'NSS' },
    { key: 'akreditasi', label: 'Akreditasi' },
    { key: 'namaKepalaSekolah', label: 'Nama Kepala Sekolah' },
    { key: 'nipKepalaSekolah', label: 'NIP Kepala Sekolah' },
    { key: 'alamatJalan', label: 'Alamat Jalan' },
    { key: 'desaKelurahan', label: 'Desa/Kelurahan' },
    { key: 'kecamatan', label: 'Kecamatan' },
    { key: 'kabupatenKota', label: 'Kabupaten/Kota' },
    { key: 'provinsi', label: 'Provinsi' },
    { key: 'email', label: 'Email Sekolah' },
    { key: 'telepon', label: 'Telepon Sekolah' },
    { key: 'kodePos', label: 'Kode Pos' },
  ];

  const emptyProfileFields = requiredProfileFields.filter(f => {
    const val = schoolProfile[f.key];
    return !val || (typeof val === 'string' && val.trim() === '');
  });

  // Class distribution data for Bar Chart (Accurately partitioned by Gender and Class)
  const classOrder = ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'];
  const classData = classOrder.map(kelas => {
    const classStudents = activeStudents.filter(s => s.kelasSekarang === kelas);
    const lCount = classStudents.filter(s => s.jenisKelamin === 'L').length;
    const pCount = classStudents.filter(s => s.jenisKelamin === 'P').length;
    const total = classStudents.length;
    const lPct = total > 0 ? Math.round((lCount / total) * 100) : 0;
    const pPct = total > 0 ? Math.round((pCount / total) * 100) : 0;

    return {
      kelas,
      Laki: lCount,
      Perempuan: pCount,
      Total: total,
      lPct,
      pPct,
    };
  });

  // Gender donut chart
  const genderPieData = [
    { name: 'Laki-Laki', value: totalMale, color: '#0056b3' },
    { name: 'Perempuan', value: totalFemale, color: '#ea580c' },
  ];

  // Status donut chart
  const statusPieData = [
    { name: 'Aktif', value: totalActive, color: '#10b981' },
    { name: 'Lulus / STTB', value: totalGraduated, color: '#003399' },
    { name: 'Mutasi Keluar', value: totalMutated, color: '#f59e0b' },
  ];

  // Custom chart tooltip for accurate gender insight
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length && label) {
      const dataItem = classData.find(c => c.kelas === label);
      if (!dataItem) return null;

      return (
        <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5 backdrop-blur-xs min-w-[170px]">
          <div className="font-extrabold text-amber-400 border-b border-slate-700 pb-1 flex items-center justify-between">
            <span>{label}</span>
            <span className="text-[11px] text-slate-300">Total: {dataItem.Total} Siswa</span>
          </div>
          <div className="flex items-center justify-between text-blue-300 font-bold">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0056b3]" />
              Laki-Laki:
            </span>
            <span>{dataItem.Laki} anak ({dataItem.lPct}%)</span>
          </div>
          <div className="flex items-center justify-between text-orange-300 font-bold">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ea580c]" />
              Perempuan:
            </span>
            <span>{dataItem.Perempuan} siswi ({dataItem.pPct}%)</span>
          </div>
          <div className="pt-1 border-t border-slate-800 text-[10px] text-slate-400">
            Rasio L:P = {dataItem.lPct}% : {dataItem.pPct}%
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Formal Header Banner (Laporan BCA institutional look) */}
      <div className="rounded-2xl bg-linear-to-r from-[#002266] via-[#003399] to-[#0047b3] text-white p-6 shadow-md relative overflow-hidden">
        {/* Subtle decorative geometric watermarks */}
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-white/5 skew-x-12 pointer-events-none" />
        <div className="absolute right-20 -bottom-10 w-48 h-48 rounded-full bg-amber-500/10 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-amber-300 text-xs font-bold tracking-wide">
              <Building2 className="w-3.5 h-3.5" />
              <span>SISTEM INFORMASI MANAJEMEN BUKU INDUK PENDIDIKAN</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white">
              {schoolProfile.namaSekolah}
            </h1>
            <p className="text-xs text-blue-100 max-w-2xl leading-relaxed">
              NPSN: <strong>{schoolProfile.npsn}</strong> | NSS: <strong>{schoolProfile.nss}</strong> | Akreditasi: <strong>{schoolProfile.akreditasi}</strong> | {schoolProfile.kabupatenKota}, Prov. {schoolProfile.provinsi}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveTab('school-profile')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-blue-600/60 hover:bg-blue-600 text-white border border-blue-400/40 text-xs font-bold rounded-xl backdrop-blur-xs transition-all shadow-xs"
              title="Lengkapi & Edit Data Identitas Sekolah"
            >
              <School className="w-4 h-4 text-amber-300" />
              <span>Identitas Sekolah</span>
            </button>
            {currentRole !== 'umum' && (
              <button
                onClick={onOpenAddModal}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5"
              >
                <Users className="w-4 h-4" />
                <span>+ Input Siswa Baru</span>
              </button>
            )}
            <button
              onClick={() => setActiveTab('print-buku-induk')}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs font-bold rounded-xl backdrop-blur-xs transition-all"
            >
              <BookOpen className="w-4 h-4 text-amber-300" />
              <span>Cetak Buku Induk</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {/* Alert Banner: Empty School Profile Fields Notification */}
      {emptyProfileFields.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-amber-950 dark:text-amber-200 uppercase tracking-wide">
                Perhatian: Terdapat {emptyProfileFields.length} Data Isian Profil Sekolah Belum Terisi
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
                Isian belum lengkap: <strong className="font-bold">{emptyProfileFields.map(f => f.label).join(', ')}</strong>. Lengkapi segera pada menu Identitas Sekolah agar kop raport, buku induk, dan kartu pelajar tercetak sempurna.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('school-profile')}
            className="self-start md:self-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-md transition-all shrink-0 flex items-center gap-1.5 cursor-pointer hover:scale-105"
          >
            <span>Arahkan ke Menu Identitas Sekolah</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Siswa Aktif */}
        <div 
          onClick={() => setActiveTab('active-students')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md transition-all group"
          title="Klik untuk melihat Data Siswa Aktif"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider group-hover:text-blue-600 transition-colors">
              Siswa Aktif Terdaftar
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center group-hover:bg-[#003399] group-hover:text-white transition-colors">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-baseline justify-between">
              <span>{totalActive}</span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:underline">Buka Menu →</span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <span className="text-blue-600 dark:text-blue-400 font-bold">{totalMale} Laki-Laki</span>
              <span>•</span>
              <span className="text-orange-600 dark:text-orange-400 font-bold">{totalFemale} Perempuan</span>
            </div>
          </div>
        </div>

        {/* Card 2: Lulus & Alumni (STTB) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Alumni / STTB Diterbitkan
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
              {totalGraduated}
            </div>
            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Tercatat pada Register STTB & Ijazah
            </div>
          </div>
        </div>

        {/* Card 3: Mutasi Keluar */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Mutasi / Meninggalkan
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <UserMinus className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight">
              {totalMutated}
            </div>
            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Tercatat pada Lembar Pindah Sekolah
            </div>
          </div>
        </div>

        {/* Card 4: Total Arsip Buku Induk */}
        <div 
          onClick={() => setActiveTab('students')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between cursor-pointer hover:border-blue-300 dark:hover:border-blue-800 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Arsip Buku Induk
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight">
              {totalStudents}
            </div>
            <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <span>Keseluruhan Rekam Historis</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-0.5">
                Lihat Data <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Administrator Settings & Access Control Card */}
      <div className="p-5 rounded-2xl bg-linear-to-br from-slate-900 via-[#001f4d] to-[#003366] text-white border border-blue-900/60 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-amber-500/5 -skew-x-12 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[11px] font-extrabold tracking-wide">
                <ShieldCheck className="w-3.5 h-3.5" />
                HAK AKSES ADMINISTRATOR
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Sistem Terlindungi (RBAC Aktif)
              </span>
            </div>

            <div>
              <h2 className="text-lg font-extrabold text-white tracking-tight">
                Pusat Pengaturan & Wewenang Administrator
              </h2>
              <p className="text-xs text-blue-100/80 max-w-2xl leading-relaxed">
                Kelola matriks hak akses peran (Admin, Guru, Umum), manajemen akun petugas ({adminUsers.length} aktif), PIN pengaman tindakan kritis, serta pencadangan database Buku Induk.
              </p>
            </div>

            {/* Quick Badges of Active Permissions */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 text-[11px] text-blue-100 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-300" />
                <span>Matriks Otorisasi: <strong>16 Modul Terkonfigurasi</strong></span>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 text-[11px] text-blue-100 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-300" />
                <span>Petugas: <strong>{adminUsers.length} Pengguna</strong></span>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 text-[11px] text-blue-100 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-300" />
                <span>Keamanan: <strong>PIN Master Aktif</strong></span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setActiveTab('admin-settings')}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5"
            >
              <KeyRound className="w-4 h-4" />
              <span>Buka Menu Pengaturan Hak Akses</span>
            </button>
            <button
              onClick={() => setActiveTab('school-profile')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold rounded-xl backdrop-blur-xs transition-colors cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-blue-200" />
              <span>Identitas Sekolah</span>
            </button>
            <button
              onClick={exportDatabaseJSON}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold rounded-xl backdrop-blur-xs transition-colors"
              title="Download Backup Database Lengkap"
            >
              <Download className="w-4 h-4 text-emerald-300" />
              <span>Backup JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Kartu Ringkasan Statistik Bulanan Siswa Aktif */}
      <MonthlyActiveStudentsSummaryCard
        students={students}
        projectedStudents={projectedStudents}
        activeTP={activeTP}
        activeSemester={activeSemester}
        availableClasses={availableClasses}
        schoolProfile={schoolProfile}
        onSelectDetail={onSelectStudentDetail}
        onSelectRombelFilter={() => setActiveTab('active-students')}
        onSelectTingkatFilter={() => setActiveTab('active-students')}
        defaultCollapsed={false}
      />

      {/* Analytics & Improved Charts Section: Gender Distribution per Class Level */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Bar Chart: Gender Distribution per Class */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  Distribusi Siswa Berdasarkan Jenis Kelamin Pada Tingkat Kelas
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Perbandingan jumlah Laki-Laki vs Perempuan di jenjang Kelas 1 sampai Kelas 6
              </p>
            </div>

            {/* Chart Mode & Filter Controls */}
            <div className="flex items-center gap-2">
              {/* Grouped vs Stacked */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setChartMode('grouped')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg transition-all text-[11px]",
                    chartMode === 'grouped'
                      ? "bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs"
                      : "text-slate-600 dark:text-slate-400"
                  )}
                  title="Tampilan batang berdampingan"
                >
                  Berdampingan
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode('stacked')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg transition-all text-[11px]",
                    chartMode === 'stacked'
                      ? "bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs"
                      : "text-slate-600 dark:text-slate-400"
                  )}
                  title="Tampilan batang bertumpuk"
                >
                  Bertumpuk
                </button>
              </div>

              {/* TP Indicator */}
              <button
                type="button"
                onClick={() => setIsEditTPModalOpen(true)}
                className="text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors"
                title="Klik untuk ubah Tahun Pelajaran"
              >
                TP {activeTP}
              </button>
            </div>
          </div>

          {/* Bar Chart Canvas */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="kelas" tick={{ fontSize: 11, fontWeight: 'bold' }} stroke="#64748b" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#64748b" />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend 
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} 
                  formatter={(value) => <span className="font-bold text-slate-700 dark:text-slate-300">{value}</span>}
                />
                
                {chartMode === 'grouped' ? (
                  <>
                    <Bar dataKey="Laki" fill="#0056b3" radius={[4, 4, 0, 0]} name="Laki-Laki (L)" />
                    <Bar dataKey="Perempuan" fill="#ea580c" radius={[4, 4, 0, 0]} name="Perempuan (P)" />
                  </>
                ) : (
                  <>
                    <Bar dataKey="Laki" stackId="a" fill="#0056b3" name="Laki-Laki (L)" />
                    <Bar dataKey="Perempuan" stackId="a" fill="#ea580c" radius={[4, 4, 0, 0]} name="Perempuan (P)" />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gender Matrix Breakdown Grid underneath the chart */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {classData.map(c => (
              <div 
                key={c.kelas} 
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-center space-y-1"
              >
                <div className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200">
                  {c.kelas}
                </div>
                <div className="flex items-center justify-center gap-2 text-xs font-bold">
                  <span className="text-[#0056b3]">{c.Laki} L</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-[#ea580c]">{c.Perempuan} P</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  Total: <strong className="text-slate-800 dark:text-slate-200">{c.Total}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Donut Chart: Gender & Status */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
              Rasio Gender & Status
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Persentase perbandingan peserta didik
            </p>
          </div>

          <div className="h-44 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {genderPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    borderRadius: '8px', 
                    color: '#fff', 
                    fontSize: '12px' 
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{totalActive}</span>
              <span className="text-[10px] text-slate-400 uppercase font-bold">Aktif</span>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#0056b3]" />
                <span className="text-slate-600 dark:text-slate-300 font-medium">Laki-Laki</span>
              </div>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {totalActive > 0 ? Math.round((totalMale / totalActive) * 100) : 0}% ({totalMale} siswa)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#ea580c]" />
                <span className="text-slate-600 dark:text-slate-300 font-medium">Perempuan</span>
              </div>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {totalActive > 0 ? Math.round((totalFemale / totalActive) * 100) : 0}% ({totalFemale} siswi)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Distribusi Peringkat Kelas Section */}
      <TabelDistribusiPeringkat onSelectStudentDetail={onSelectStudentDetail} />

      {/* Quick Action Hub & Recent Students Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions Shortcuts */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
            Modul & Navigasi Cepat
          </h3>
          
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => setActiveTab('students')}
              className="p-3 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100 text-left transition-colors group"
            >
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-1 group-hover:scale-110 transition-transform" />
              <div className="font-bold text-xs text-slate-900 dark:text-slate-100">Daftar Buku Induk</div>
              <div className="text-[10px] text-slate-500">{totalStudents} data tersimpan</div>
            </button>

            <button
              onClick={() => setActiveTab('print-buku-induk')}
              className="p-3 rounded-xl border border-amber-100 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100 text-left transition-colors group"
            >
              <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
              <div className="font-bold text-xs text-slate-900 dark:text-slate-100">Cetak Buku Induk</div>
              <div className="text-[10px] text-slate-500">Format resmi 2 hal</div>
            </button>

            <button
              onClick={() => setActiveTab('raport')}
              className="p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100 text-left transition-colors group"
            >
              <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
              <div className="font-bold text-xs text-slate-900 dark:text-slate-100">Rekap Raport</div>
              <div className="text-[10px] text-slate-500">Penilaian semester</div>
            </button>

            <button
              onClick={() => setActiveTab('kartu-pelajar')}
              className="p-3 rounded-xl border border-purple-100 dark:border-purple-900/40 bg-purple-50/50 dark:bg-purple-950/20 hover:bg-purple-100 text-left transition-colors group"
            >
              <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400 mb-1 group-hover:scale-110 transition-transform" />
              <div className="font-bold text-xs text-slate-900 dark:text-slate-100">Kartu Pelajar & UN</div>
              <div className="text-[10px] text-slate-500">Barcode/QR resmi</div>
            </button>

            <button
              onClick={() => setActiveTab('mutasi')}
              className="p-3 rounded-xl border border-orange-100 dark:border-orange-900/40 bg-orange-50/50 dark:bg-orange-950/20 hover:bg-orange-100 text-left transition-colors group"
            >
              <UserMinus className="w-5 h-5 text-orange-600 dark:text-orange-400 mb-1 group-hover:scale-110 transition-transform" />
              <div className="font-bold text-xs text-slate-900 dark:text-slate-100">Mutasi / Pindah</div>
              <div className="text-[10px] text-slate-500">{totalMutated} surat keluar</div>
            </button>

            <button
              onClick={() => setActiveTab('sttb')}
              className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 text-left transition-colors group"
            >
              <GraduationCap className="w-5 h-5 text-slate-700 dark:text-slate-300 mb-1 group-hover:scale-110 transition-transform" />
              <div className="font-bold text-xs text-slate-900 dark:text-slate-100">STTB & Ijazah</div>
              <div className="text-[10px] text-slate-500">Tanda terima ijazah</div>
            </button>
          </div>
        </div>

        {/* Latest Students Table */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                Daftar Siswa Buku Induk Terkini
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Entri data peserta didik terdaftar terbaru
              </p>
            </div>
            <button
              onClick={() => setActiveTab('students')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Lihat Semua Siswa →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 uppercase text-[11px] font-bold">
                <tr>
                  <th className="p-2.5">NIS / NISN</th>
                  <th className="p-2.5">Nama Siswa</th>
                  <th className="p-2.5">L/P</th>
                  <th className="p-2.5">Kelas</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {students.slice(0, 5).map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-2.5 font-mono">
                      <div className="font-bold text-blue-700 dark:text-blue-400">{s.noInduk}</div>
                      <div className="text-[10px] text-slate-400">{s.nisn}</div>
                    </td>
                    <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">
                      {s.namaLengkap}
                    </td>
                    <td className="p-2.5 font-semibold">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-bold",
                        s.jenisKelamin === 'L' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                      )}>
                        {s.jenisKelamin}
                      </span>
                    </td>
                    <td className="p-2.5 font-semibold text-slate-700 dark:text-slate-300">
                      {s.kelasSekarang}
                    </td>
                    <td className="p-2.5">
                      <span className={cn(
                        "px-2 py-0.5 text-[10px] font-bold rounded-full",
                        s.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                        s.status === 'Lulus' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                        'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      )}>
                        {s.status}
                      </span>
                    </td>
                    <td className="p-2.5 text-right">
                      <button
                        onClick={() => onSelectStudentDetail(s.id)}
                        className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-[11px] font-bold rounded-md transition-colors"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Edit Tahun Pelajaran */}
      <EditTahunPelajaranModal
        isOpen={isEditTPModalOpen}
        onClose={() => setIsEditTPModalOpen(false)}
        initialSelectedTP={activeTP}
      />
    </div>
  );
};
