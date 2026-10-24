import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Users, 
  UserPlus, 
  UserMinus, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft, 
  ChevronRight, 
  Table, 
  BarChart2, 
  Download, 
  FileSpreadsheet, 
  Eye, 
  EyeOff,
  Award,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  School,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Student, SchoolProfile, Gender } from '../../types';
import { cn, formatIndonesianDate } from '../../lib/utils';
import { getAcademicYearStart, isKelas1Sampai6, getTingkatKelasNumber } from '../../utils/academicYearHelper';

export interface AcademicMonthInfo {
  key: string; // YYYY-MM
  year: number;
  monthNum: number; // 1-12
  monthIndex: number; // 0-11
  monthName: string;
  shortName: string;
  fullName: string;
  semester: 'Ganjil' | 'Genap';
  isCurrent: boolean;
}

export interface MonthlyRombelStat {
  rombel: string;
  tingkat: number;
  waliKelas?: string;
  jmlL: number;
  jmlP: number;
  total: number;
  persentase: number;
}

export interface MonthlyTingkatStat {
  tingkat: number;
  label: string;
  jmlL: number;
  jmlP: number;
  total: number;
  persentase: number;
  rombels: string[];
}

interface MonthlyActiveStudentsSummaryCardProps {
  students: Student[];
  projectedStudents: any[];
  activeTP: string;
  activeSemester?: string;
  availableClasses: string[];
  schoolProfile: SchoolProfile;
  onSelectDetail?: (studentId: string) => void;
  onSelectRombelFilter?: (rombel: string) => void;
  onSelectTingkatFilter?: (tingkat: string) => void;
  defaultCollapsed?: boolean;
}

const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const SHORT_BULAN = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'
];

export const MonthlyActiveStudentsSummaryCard: React.FC<MonthlyActiveStudentsSummaryCardProps> = ({
  students,
  projectedStudents,
  activeTP,
  activeSemester = 'Ganjil',
  availableClasses,
  schoolProfile,
  onSelectDetail,
  onSelectRombelFilter,
  onSelectTingkatFilter,
  defaultCollapsed = false,
}) => {
  // Collapsible state (persisted in localStorage)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('buku_induk_monthly_stats_collapsed');
      if (saved !== null) return saved === 'true';
    }
    return defaultCollapsed;
  });

  const toggleCollapsed = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('buku_induk_monthly_stats_collapsed', String(next));
      } catch (e) {}
      return next;
    });
  };

  // View mode: 'detail-bulan' | 'matriks-periodik'
  const [viewMode, setViewMode] = useState<'detail-bulan' | 'matriks-periodik'>('detail-bulan');

  // Sub-tab under detail-bulan: 'tingkat' | 'rombel' | 'siswa-masuk' | 'siswa-mutasi'
  const [activeSubSection, setActiveSubSection] = useState<'tingkat' | 'rombel' | 'siswa-masuk' | 'siswa-mutasi'>('tingkat');

  // Generate 12 months for the Indonesian Academic Year (Juli startYear to Juni endYear)
  const startYear = getAcademicYearStart(activeTP);
  const endYear = startYear + 1;

  const academicMonths: AcademicMonthInfo[] = useMemo(() => {
    const months: AcademicMonthInfo[] = [];
    const today = new Date();
    const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    // Month order: 7, 8, 9, 10, 11, 12 in startYear; 1, 2, 3, 4, 5, 6 in endYear
    const sequence = [
      { num: 7, year: startYear, sem: 'Ganjil' as const },
      { num: 8, year: startYear, sem: 'Ganjil' as const },
      { num: 9, year: startYear, sem: 'Ganjil' as const },
      { num: 10, year: startYear, sem: 'Ganjil' as const },
      { num: 11, year: startYear, sem: 'Ganjil' as const },
      { num: 12, year: startYear, sem: 'Ganjil' as const },
      { num: 1, year: endYear, sem: 'Genap' as const },
      { num: 2, year: endYear, sem: 'Genap' as const },
      { num: 3, year: endYear, sem: 'Genap' as const },
      { num: 4, year: endYear, sem: 'Genap' as const },
      { num: 5, year: endYear, sem: 'Genap' as const },
      { num: 6, year: endYear, sem: 'Genap' as const },
    ];

    sequence.forEach((item, index) => {
      const key = `${item.year}-${String(item.num).padStart(2, '0')}`;
      months.push({
        key,
        year: item.year,
        monthNum: item.num,
        monthIndex: index,
        monthName: NAMA_BULAN[item.num - 1],
        shortName: SHORT_BULAN[item.num - 1],
        fullName: `${NAMA_BULAN[item.num - 1]} ${item.year}`,
        semester: item.sem,
        isCurrent: key === currentYearMonth,
      });
    });

    return months;
  }, [startYear, endYear]);

  // Selected Month: Default to current month if in the range, otherwise default to October or first month
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(() => {
    const current = academicMonths.find(m => m.isCurrent);
    if (current) return current.key;
    // Default to October (current local context) or July
    const oct = academicMonths.find(m => m.monthNum === 10);
    return oct ? oct.key : academicMonths[0]?.key || `${startYear}-07`;
  });

  const selectedMonthInfo = useMemo(() => {
    return academicMonths.find(m => m.key === selectedMonthKey) || academicMonths[0];
  }, [academicMonths, selectedMonthKey]);

  // Active students exclusively in Grade 1 to 6 for the active academic year
  const activeStudentsGrade1to6 = useMemo(() => {
    return projectedStudents.filter(s => s.status === 'Aktif' && isKelas1Sampai6(s.kelasSekarang));
  }, [projectedStudents]);

  // Helper to extract student's admission year-month (YYYY-MM)
  const getStudentAdmissionMonthKey = (s: Student): string | null => {
    if (s.tanggalDiterima && s.tanggalDiterima.length >= 7) {
      return s.tanggalDiterima.substring(0, 7);
    }
    // Fallback: If student entered during startYear with no date, assume beginning of year (Juli)
    if (s.tahunMasuk && s.tahunMasuk.includes(String(startYear))) {
      return `${startYear}-07`;
    }
    return null;
  };

  // Helper to extract student's mutation out year-month (YYYY-MM)
  const getStudentMutationMonthKey = (s: Student): string | null => {
    const tgl = s.mutasi?.tglMeninggalkan || s.mutasi?.dikeluarkanTanggal;
    if (tgl && tgl.length >= 7) {
      return tgl.substring(0, 7);
    }
    if (s.status === 'Mutasi Keluar' && s.updatedAt && s.updatedAt.length >= 7) {
      return s.updatedAt.substring(0, 7);
    }
    return null;
  };

  // Monthly stats for each of the 12 academic months (Full periodic calculation)
  const periodicMonthlyStats = useMemo(() => {
    return academicMonths.map((m) => {
      // Siswa Masuk in this month
      const masukList = students.filter(s => {
        const admKey = getStudentAdmissionMonthKey(s);
        return admKey === m.key;
      });
      const masukL = masukList.filter(s => s.jenisKelamin === 'L').length;
      const masukP = masukList.filter(s => s.jenisKelamin === 'P').length;

      // Siswa Mutasi (Keluar) in this month
      const mutasiList = students.filter(s => {
        const mutKey = getStudentMutationMonthKey(s);
        return mutKey === m.key;
      });
      const mutasiL = mutasiList.filter(s => s.jenisKelamin === 'L').length;
      const mutasiP = mutasiList.filter(s => s.jenisKelamin === 'P').length;

      // Total Siswa Aktif per Tingkat (1 s/d 6)
      const tingkatCounts: Record<number, { total: number; l: number; p: number }> = {
        1: { total: 0, l: 0, p: 0 },
        2: { total: 0, l: 0, p: 0 },
        3: { total: 0, l: 0, p: 0 },
        4: { total: 0, l: 0, p: 0 },
        5: { total: 0, l: 0, p: 0 },
        6: { total: 0, l: 0, p: 0 },
      };

      activeStudentsGrade1to6.forEach(s => {
        const t = getTingkatKelasNumber(s.kelasSekarang);
        if (t >= 1 && t <= 6) {
          tingkatCounts[t].total += 1;
          if (s.jenisKelamin === 'L') tingkatCounts[t].l += 1;
          else tingkatCounts[t].p += 1;
        }
      });

      const totalAktif = activeStudentsGrade1to6.length;
      const totalAktifL = activeStudentsGrade1to6.filter(s => s.jenisKelamin === 'L').length;
      const totalAktifP = activeStudentsGrade1to6.filter(s => s.jenisKelamin === 'P').length;

      return {
        month: m,
        masukList,
        masukCount: masukList.length,
        masukL,
        masukP,
        mutasiList,
        mutasiCount: mutasiList.length,
        mutasiL,
        mutasiP,
        tingkatCounts,
        totalAktif,
        totalAktifL,
        totalAktifP,
      };
    });
  }, [academicMonths, students, activeStudentsGrade1to6, startYear]);

  // Current selected month's specific statistics
  const currentMonthData = useMemo(() => {
    return periodicMonthlyStats.find(p => p.month.key === selectedMonthKey) || periodicMonthlyStats[0];
  }, [periodicMonthlyStats, selectedMonthKey]);

  // Breakdown Jumlah Siswa di Rombel for the active academic year
  const rombelStats: MonthlyRombelStat[] = useMemo(() => {
    const total = activeStudentsGrade1to6.length;
    return availableClasses.map(rombel => {
      const inRombel = activeStudentsGrade1to6.filter(s => s.kelasSekarang === rombel);
      const jmlL = inRombel.filter(s => s.jenisKelamin === 'L').length;
      const jmlP = inRombel.filter(s => s.jenisKelamin === 'P').length;
      const rombelTotal = inRombel.length;
      const tingkat = getTingkatKelasNumber(rombel);
      const wali = schoolProfile.waliKelasMap?.[rombel]?.nama;

      return {
        rombel,
        tingkat,
        waliKelas: wali,
        jmlL,
        jmlP,
        total: rombelTotal,
        persentase: total > 0 ? Math.round((rombelTotal / total) * 100) : 0,
      };
    }).sort((a, b) => {
      if (a.tingkat !== b.tingkat) return a.tingkat - b.tingkat;
      return a.rombel.localeCompare(b.rombel, undefined, { numeric: true });
    });
  }, [availableClasses, activeStudentsGrade1to6, schoolProfile.waliKelasMap]);

  // Sembunyikan kelas yang tidak ada siswa (0 siswa) secara default
  const [hideEmptyRombel, setHideEmptyRombel] = useState<boolean>(true);

  // Jumlah rombel yang tidak memiliki siswa (total === 0)
  const emptyRombelCount = useMemo(() => {
    return rombelStats.filter(r => r.total === 0).length;
  }, [rombelStats]);

  // Rombel yang ditampilkan (sembunyikan yang total = 0 jika hideEmptyRombel aktif)
  const visibleRombelStats = useMemo(() => {
    if (hideEmptyRombel) {
      return rombelStats.filter(r => r.total > 0);
    }
    return rombelStats;
  }, [rombelStats, hideEmptyRombel]);

  // Jumlah rombel aktif yang memiliki siswa (> 0)
  const activeRombelsCount = useMemo(() => {
    return rombelStats.filter(r => r.total > 0).length;
  }, [rombelStats]);

  // Breakdown Total Siswa di Setiap Tingkat (Tingkat 1 - 6)
  const tingkatStats: MonthlyTingkatStat[] = useMemo(() => {
    const totalAll = activeStudentsGrade1to6.length;
    return [1, 2, 3, 4, 5, 6].map(tingkat => {
      const inTingkat = activeStudentsGrade1to6.filter(s => getTingkatKelasNumber(s.kelasSekarang) === tingkat);
      const jmlL = inTingkat.filter(s => s.jenisKelamin === 'L').length;
      const jmlP = inTingkat.filter(s => s.jenisKelamin === 'P').length;
      const count = inTingkat.length;
      const rombels = availableClasses.filter(c => getTingkatKelasNumber(c) === tingkat);

      return {
        tingkat,
        label: `Tingkat ${tingkat} (Kelas ${tingkat})`,
        jmlL,
        jmlP,
        total: count,
        persentase: totalAll > 0 ? Math.round((count / totalAll) * 100) : 0,
        rombels,
      };
    });
  }, [activeStudentsGrade1to6, availableClasses]);

  // Export Monthly Summary to Excel (.xlsx)
  const handleExportMonthlyStatsExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Rekap Periodik Bulanan
    const periodicSheetData: (string | number)[][] = [
      [`REKAPITULASI STATISTIK BULANAN SISWA AKTIF`],
      [`SEKOLAH: ${schoolProfile.namaSekolah.toUpperCase()}`],
      [`TAHUN PELAJARAN: ${activeTP} • SEMESTER ${activeSemester.toUpperCase()}`],
      [`TANGGAL UNDUH: ${formatIndonesianDate(new Date().toISOString().split('T')[0])}`],
      [],
      [
        'No', 
        'Bulan', 
        'Tahun', 
        'Semester', 
        'Siswa Masuk (L)', 
        'Siswa Masuk (P)', 
        'Total Masuk',
        'Siswa Mutasi Keluar (L)', 
        'Siswa Mutasi Keluar (P)', 
        'Total Mutasi',
        'Tingkat 1',
        'Tingkat 2',
        'Tingkat 3',
        'Tingkat 4',
        'Tingkat 5',
        'Tingkat 6',
        'Total Siswa (L)',
        'Total Siswa (P)',
        'Total Siswa Aktif'
      ],
    ];

    periodicMonthlyStats.forEach((p, idx) => {
      periodicSheetData.push([
        idx + 1,
        p.month.monthName,
        p.month.year,
        p.month.semester,
        p.masukL,
        p.masukP,
        p.masukCount,
        p.mutasiL,
        p.mutasiP,
        p.mutasiCount,
        p.tingkatCounts[1].total,
        p.tingkatCounts[2].total,
        p.tingkatCounts[3].total,
        p.tingkatCounts[4].total,
        p.tingkatCounts[5].total,
        p.tingkatCounts[6].total,
        p.totalAktifL,
        p.totalAktifP,
        p.totalAktif,
      ]);
    });

    const wsPeriodic = XLSX.utils.aoa_to_sheet(periodicSheetData);
    XLSX.utils.book_append_sheet(wb, wsPeriodic, 'Periodik Bulanan');

    // Sheet 2: Rekap Rombel & Tingkat
    const rombelSheetData: (string | number)[][] = [
      [`DISTRIBUSI SISWA PER ROMBEL & TINGKAT (${selectedMonthInfo.fullName.toUpperCase()})`],
      [`TAHUN PELAJARAN: ${activeTP}`],
      [`STATUS FILTER: ${hideEmptyRombel ? `Hanya Menampilkan Rombel Aktif (${visibleRombelStats.length} Kelas)` : `Semua Rombel Terkonfigurasi (${rombelStats.length} Kelas)`}`],
      [],
      ['No', 'Nama Rombel / Kelas', 'Tingkat', 'Wali Kelas', 'Laki-Laki (L)', 'Perempuan (P)', 'Total Siswa', 'Persentase (%)'],
    ];

    visibleRombelStats.forEach((r, idx) => {
      rombelSheetData.push([
        idx + 1,
        r.rombel,
        `Tingkat ${r.tingkat}`,
        r.waliKelas || '-',
        r.jmlL,
        r.jmlP,
        r.total,
        `${r.persentase}%`,
      ]);
    });

    // Add total row
    rombelSheetData.push([
      '',
      'TOTAL KESELURUHAN SISWA AKTIF',
      '-',
      '-',
      activeStudentsGrade1to6.filter(s => s.jenisKelamin === 'L').length,
      activeStudentsGrade1to6.filter(s => s.jenisKelamin === 'P').length,
      activeStudentsGrade1to6.length,
      '100%',
    ]);

    const wsRombel = XLSX.utils.aoa_to_sheet(rombelSheetData);
    XLSX.utils.book_append_sheet(wb, wsRombel, 'Rombel & Tingkat');

    const fileName = `Statistik_Bulanan_Siswa_${activeTP.replace('/', '-')}_${selectedMonthInfo.monthName}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-200">
      {/* Header Bar with Collapsible Control */}
      <div className="px-5 py-4 bg-gradient-to-r from-blue-900 via-[#003399] to-indigo-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-sm md:text-base text-white tracking-tight flex items-center gap-2">
                <span>Statistik Bulanan & Periodik Siswa Aktif</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 uppercase tracking-wider">
                TP {activeTP}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-blue-100">
                {academicMonths.length} Bulan Periodik
              </span>
            </div>
            <p className="text-xs text-blue-100/90 mt-0.5">
              Rekapitulasi periodik tiap bulan: rombel, siswa masuk, siswa mutasi, dan total siswa per tingkat.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            type="button"
            onClick={handleExportMonthlyStatsExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer hover:scale-102"
            title="Unduh data statistik bulanan & periodik ke format Excel (.xlsx)"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ekspor Excel</span>
            <span className="sm:hidden">Excel</span>
          </button>

          <button
            type="button"
            onClick={toggleCollapsed}
            className="flex items-center gap-1 px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
            title={isCollapsed ? "Buka panel ringkasan statistik bulanan" : "Tutup/Sembunyikan panel ringkasan"}
          >
            <span>{isCollapsed ? "Buka Ringkasan" : "Sembunyikan"}</span>
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Collapsed Preview Pill Strip */}
      {isCollapsed && (
        <div 
          onClick={toggleCollapsed}
          className="px-5 py-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-blue-50/50 dark:hover:bg-slate-800 transition-colors"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Bulan Berjalan: <strong>{selectedMonthInfo.fullName}</strong>
            </span>
            <span className="text-slate-400">•</span>
            <span>Total Siswa: <strong className="text-blue-700 dark:text-blue-400">{activeStudentsGrade1to6.length}</strong></span>
            <span className="text-slate-400">•</span>
            <span>Jumlah Rombel: <strong className="text-amber-600 dark:text-amber-400">{activeRombelsCount}</strong></span>
            <span className="text-slate-400">•</span>
            <span>Siswa Masuk: <strong className="text-emerald-600 dark:text-emerald-400">+{currentMonthData.masukCount}</strong></span>
            <span className="text-slate-400">•</span>
            <span>Siswa Mutasi: <strong className="text-orange-600 dark:text-orange-400">-{currentMonthData.mutasiCount}</strong></span>
          </div>

          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
            <span>Klik untuk membuka detail lengkap</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </span>
        </div>
      )}

      {/* Expanded Main Content */}
      {!isCollapsed && (
        <div className="p-4 md:p-6 space-y-5">
          {/* Top Controls: Periodic Month Selector & View Mode Switcher */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('detail-bulan')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  viewMode === 'detail-bulan'
                    ? "bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                )}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Detail Bulan Terpilih</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('matriks-periodik')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  viewMode === 'matriks-periodik'
                    ? "bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                )}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Matriks Periodik 12 Bulan</span>
              </button>
            </div>

            {/* Quick Indicators for Current Selected Month */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Bulan Aktif:</span>
              <span className="px-2.5 py-1 rounded-lg font-black bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                {selectedMonthInfo.fullName}
              </span>
              <span className="px-2 py-1 rounded-lg font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Semester {selectedMonthInfo.semester}
              </span>
            </div>
          </div>

          {/* Horizontal Monthly Timeline Bar (12 Months of the Academic Year) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold px-1">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Pilih Bulan Periodik ({startYear} - {endYear}):</span>
              </span>
              <span className="text-[11px] text-slate-400">Klik bulan untuk melihat rincian rombel & mutasi</span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {academicMonths.map((m) => {
                const isSelected = m.key === selectedMonthKey;
                const pStat = periodicMonthlyStats.find(p => p.month.key === m.key);
                const hasMovement = (pStat?.masukCount || 0) > 0 || (pStat?.mutasiCount || 0) > 0;

                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => {
                      setSelectedMonthKey(m.key);
                      setViewMode('detail-bulan');
                    }}
                    className={cn(
                      "flex flex-col items-center min-w-[76px] sm:min-w-[88px] px-2.5 py-2 rounded-xl border text-xs font-bold transition-all shrink-0 cursor-pointer text-center relative",
                      isSelected
                        ? "bg-[#003399] text-white border-[#003399] shadow-md scale-102 ring-2 ring-blue-300 dark:ring-blue-700"
                        : "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 hover:border-blue-300"
                    )}
                  >
                    {m.isCurrent && (
                      <span className="absolute -top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Bulan Sekarang" />
                    )}
                    <span className="text-[10px] uppercase font-bold opacity-75">
                      {m.shortName} {m.year}
                    </span>
                    <span className={cn("text-xs font-black mt-0.5", isSelected ? "text-amber-300" : "")}>
                      {m.monthName}
                    </span>
                    
                    {/* Badge Mutasi/Masuk */}
                    <div className="flex items-center gap-1 mt-1 text-[9px] font-mono">
                      {hasMovement ? (
                        <>
                          {(pStat?.masukCount || 0) > 0 && (
                            <span className={cn("px-1 rounded font-bold", isSelected ? "bg-emerald-400 text-slate-950" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300")}>
                              +{pStat?.masukCount}
                            </span>
                          )}
                          {(pStat?.mutasiCount || 0) > 0 && (
                            <span className={cn("px-1 rounded font-bold", isSelected ? "bg-orange-400 text-slate-950" : "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300")}>
                              -{pStat?.mutasiCount}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="opacity-40">-</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* VIEW MODE 1: DETAIL BULAN TERPILIH */}
          {viewMode === 'detail-bulan' && (
            <div className="space-y-5">
              {/* 4 KPI Highlight Cards for the Selected Month */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {/* KPI 1: Total Siswa Aktif */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-linear-to-br from-blue-50/60 to-white dark:from-slate-800/60 dark:to-slate-900 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Total Siswa Aktif</span>
                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                    {currentMonthData.totalAktif} <span className="text-xs font-normal text-slate-500">Siswa</span>
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] font-semibold text-slate-500">
                    <span className="text-blue-600 dark:text-blue-400">{currentMonthData.totalAktifL} L</span>
                    <span>•</span>
                    <span className="text-pink-600 dark:text-pink-400">{currentMonthData.totalAktifP} P</span>
                  </div>
                </div>

                {/* KPI 2: Jumlah Siswa Masuk */}
                <div 
                  onClick={() => setActiveSubSection('siswa-masuk')}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-linear-to-br from-emerald-50/60 to-white dark:from-slate-800/60 dark:to-slate-900 shadow-2xs cursor-pointer hover:border-emerald-300 transition-all group"
                  title="Klik untuk melihat daftar siswa masuk pada bulan ini"
                >
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[11px] font-bold uppercase tracking-wider group-hover:text-emerald-700 transition-colors">
                      Siswa Masuk
                    </span>
                    <UserPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    +{currentMonthData.masukCount} <span className="text-xs font-normal text-slate-500">Siswa</span>
                  </p>
                  <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500 font-semibold">
                    <span>{currentMonthData.masukL} L • {currentMonthData.masukP} P</span>
                    <span className="text-emerald-600 font-bold group-hover:underline">Lihat Rincian →</span>
                  </div>
                </div>

                {/* KPI 3: Jumlah Siswa Mutasi */}
                <div 
                  onClick={() => setActiveSubSection('siswa-mutasi')}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-linear-to-br from-orange-50/60 to-white dark:from-slate-800/60 dark:to-slate-900 shadow-2xs cursor-pointer hover:border-orange-300 transition-all group"
                  title="Klik untuk melihat daftar siswa mutasi keluar pada bulan ini"
                >
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[11px] font-bold uppercase tracking-wider group-hover:text-orange-700 transition-colors">
                      Siswa Mutasi Keluar
                    </span>
                    <UserMinus className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <p className="text-2xl font-black text-orange-600 dark:text-orange-400 mt-1">
                    -{currentMonthData.mutasiCount} <span className="text-xs font-normal text-slate-500">Siswa</span>
                  </p>
                  <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500 font-semibold">
                    <span>{currentMonthData.mutasiL} L • {currentMonthData.mutasiP} P</span>
                    <span className="text-orange-600 font-bold group-hover:underline">Lihat Rincian →</span>
                  </div>
                </div>

                {/* KPI 4: Jumlah Rombel */}
                <div 
                  onClick={() => setActiveSubSection('rombel')}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-linear-to-br from-amber-50/60 to-white dark:from-slate-800/60 dark:to-slate-900 shadow-2xs cursor-pointer hover:border-amber-300 transition-all group"
                  title="Klik untuk melihat distribusi siswa per rombel"
                >
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[11px] font-bold uppercase tracking-wider group-hover:text-amber-700 transition-colors">
                      Jumlah Rombel Aktif
                    </span>
                    <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                    {activeRombelsCount} <span className="text-xs font-normal text-slate-500">Kelas Aktif</span>
                  </p>
                  <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500 font-semibold">
                    <span>Rata-rata: {activeRombelsCount > 0 ? Math.round(activeStudentsGrade1to6.length / activeRombelsCount) : 0} siswa/kelas</span>
                    {emptyRombelCount > 0 && hideEmptyRombel ? (
                      <span className="text-amber-600 font-medium">({emptyRombelCount} kelas 0)</span>
                    ) : (
                      <span className="text-amber-600 font-bold group-hover:underline">Detail →</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Sub-section Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                {[
                  { id: 'tingkat', label: 'Total Siswa per Tingkat (1-6)', count: 6 },
                  { id: 'rombel', label: `Jumlah Siswa di Rombel (${activeRombelsCount})`, count: activeRombelsCount },
                  { id: 'siswa-masuk', label: `Siswa Masuk (${currentMonthData.masukCount})`, count: currentMonthData.masukCount },
                  { id: 'siswa-mutasi', label: `Siswa Mutasi (${currentMonthData.mutasiCount})`, count: currentMonthData.mutasiCount },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSubSection(item.id as any)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                      activeSubSection === item.id
                        ? "bg-[#003399] text-white shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    )}
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              {/* SECTION A: TOTAL SISWA DI SETIAP TINGKAT */}
              {activeSubSection === 'tingkat' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                      <BarChart2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Rekapitulasi Total Siswa di Setiap Tingkat Kelas ({selectedMonthInfo.fullName})</span>
                    </h4>
                    <span className="text-xs text-slate-500 font-medium">
                      Total: <strong>{activeStudentsGrade1to6.length}</strong> Siswa Aktif
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {tingkatStats.map((ts) => (
                      <div
                        key={ts.tingkat}
                        onClick={() => onSelectTingkatFilter && onSelectTingkatFilter(String(ts.tingkat))}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                        title={`Filter daftar siswa ke Tingkat ${ts.tingkat}`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                              Kelas {ts.tingkat}
                            </span>
                            <span className="text-[11px] font-bold text-slate-400">
                              {ts.persentase}%
                            </span>
                          </div>
                          <p className="text-xl font-black text-slate-900 dark:text-slate-100 mt-2">
                            {ts.total} <span className="text-xs font-normal text-slate-500">Siswa</span>
                          </p>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 flex justify-between font-semibold">
                          <span className="text-blue-600 dark:text-blue-400">{ts.jmlL} L</span>
                          <span>•</span>
                          <span className="text-pink-600 dark:text-pink-400">{ts.jmlP} P</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Progress bar visual for distribution across grade levels */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                      Rasio Distribusi Siswa Tingkat 1 s/d 6:
                    </span>
                    <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
                      {tingkatStats.map((ts, idx) => {
                        const colors = [
                          'bg-blue-600',
                          'bg-indigo-600',
                          'bg-cyan-600',
                          'bg-emerald-600',
                          'bg-amber-500',
                          'bg-rose-500'
                        ];
                        const width = activeStudentsGrade1to6.length > 0 ? (ts.total / activeStudentsGrade1to6.length) * 100 : 0;
                        if (width <= 0) return null;
                        return (
                          <div 
                            key={ts.tingkat}
                            style={{ width: `${width}%` }}
                            className={cn("h-full transition-all", colors[idx % colors.length])}
                            title={`Tingkat ${ts.tingkat}: ${ts.total} siswa (${Math.round(width)}%)`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION B: JUMLAH SISWA DI ROMBEL */}
              {activeSubSection === 'rombel' && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-amber-500" />
                        <span>Rincian Jumlah Siswa di Setiap Rombel / Kelas Aktif</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Menampilkan {visibleRombelStats.length} rombel aktif{emptyRombelCount > 0 && hideEmptyRombel ? ` (${emptyRombelCount} rombel dengan 0 siswa disembunyikan)` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {emptyRombelCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setHideEmptyRombel(!hideEmptyRombel)}
                          className={cn(
                            "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer shadow-2xs",
                            hideEmptyRombel
                              ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                          )}
                          title={hideEmptyRombel ? "Klik untuk menampilkan kelas dengan 0 siswa" : "Klik untuk menyembunyikan kelas dengan 0 siswa"}
                        >
                          {hideEmptyRombel ? <EyeOff className="w-3.5 h-3.5 text-amber-600 shrink-0" /> : <Eye className="w-3.5 h-3.5 shrink-0" />}
                          <span>{hideEmptyRombel ? `Sembunyikan Kelas Kosong (${emptyRombelCount})` : `Tampilkan Semua (${emptyRombelCount} Kelas 0)`}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                          <th className="py-2.5 px-3 font-bold w-12 text-center">No</th>
                          <th className="py-2.5 px-3 font-bold">Rombel / Kelas</th>
                          <th className="py-2.5 px-3 font-bold">Tingkat</th>
                          <th className="py-2.5 px-3 font-bold">Guru / Wali Kelas</th>
                          <th className="py-2.5 px-3 font-bold text-center">L</th>
                          <th className="py-2.5 px-3 font-bold text-center">P</th>
                          <th className="py-2.5 px-3 font-bold text-center">Total Siswa</th>
                          <th className="py-2.5 px-3 font-bold text-center">% Rombel</th>
                          <th className="py-2.5 px-3 font-bold text-center w-24">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {visibleRombelStats.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="py-8 text-center text-slate-500 text-xs">
                              <Layers className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                              <p className="font-bold text-slate-700 dark:text-slate-300">Tidak ada rombel dengan siswa aktif.</p>
                              {emptyRombelCount > 0 && hideEmptyRombel && (
                                <p className="text-[11px] text-slate-400 mt-1">
                                  Terdapat {emptyRombelCount} rombel dengan 0 siswa yang disembunyikan.{' '}
                                  <button
                                    type="button"
                                    onClick={() => setHideEmptyRombel(false)}
                                    className="text-blue-600 dark:text-blue-400 underline font-semibold cursor-pointer"
                                  >
                                    Tampilkan kelas kosong
                                  </button>
                                </p>
                              )}
                            </td>
                          </tr>
                        ) : (
                          visibleRombelStats.map((r, idx) => (
                            <tr key={r.rombel} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                              <td className="py-2.5 px-3 font-black text-slate-900 dark:text-slate-100">
                                {r.rombel}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                                  Tingkat {r.tingkat}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 font-medium">
                                {r.waliKelas || <span className="text-slate-400 italic">Belum ditentukan</span>}
                              </td>
                              <td className="py-2.5 px-3 text-center font-bold text-blue-600 dark:text-blue-400">{r.jmlL}</td>
                              <td className="py-2.5 px-3 text-center font-bold text-pink-600 dark:text-pink-400">{r.jmlP}</td>
                              <td className="py-2.5 px-3 text-center font-black text-slate-900 dark:text-slate-100">
                                {r.total}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono text-slate-500">{r.persentase}%</td>
                              <td className="py-2.5 px-3 text-center">
                                {onSelectRombelFilter && (
                                  <button
                                    type="button"
                                    onClick={() => onSelectRombelFilter(r.rombel)}
                                    className="px-2 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded text-[11px] font-bold cursor-pointer transition-colors"
                                    title="Filter ke rombel ini"
                                  >
                                    Pilih
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50 dark:bg-slate-800/80 font-black border-t-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                          <td colSpan={4} className="py-2.5 px-3 text-right">TOTAL KESELURUHAN SISWA AKTIF:</td>
                          <td className="py-2.5 px-3 text-center text-blue-600 dark:text-blue-400 font-black">
                            {activeStudentsGrade1to6.filter(s => s.jenisKelamin === 'L').length}
                          </td>
                          <td className="py-2.5 px-3 text-center text-pink-600 dark:text-pink-400 font-black">
                            {activeStudentsGrade1to6.filter(s => s.jenisKelamin === 'P').length}
                          </td>
                          <td className="py-2.5 px-3 text-center text-[#003399] dark:text-amber-300 font-black text-sm">
                            {activeStudentsGrade1to6.length}
                          </td>
                          <td className="py-2.5 px-3 text-center">100%</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* SECTION C: SISWA MASUK PADA BULAN INI */}
              {activeSubSection === 'siswa-masuk' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                      <UserPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Daftar Siswa Masuk pada Bulan {selectedMonthInfo.fullName} ({currentMonthData.masukCount} Siswa)</span>
                    </h4>
                    <span className="text-xs text-slate-500">
                      Laki-laki: <strong>{currentMonthData.masukL}</strong> • Perempuan: <strong>{currentMonthData.masukP}</strong>
                    </span>
                  </div>

                  {currentMonthData.masukList.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                      <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                      <p className="font-bold text-slate-700 dark:text-slate-300">Tidak ada catatan siswa masuk pada bulan {selectedMonthInfo.fullName}.</p>
                      <p className="text-[11px] text-slate-400 mt-1">Siswa masuk dihitung berdasarkan tanggal diterima di sekolah atau mutasi masuk.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                            <th className="py-2.5 px-3 font-bold w-12 text-center">No</th>
                            <th className="py-2.5 px-3 font-bold">Nama Lengkap</th>
                            <th className="py-2.5 px-3 font-bold">NIS / NISN</th>
                            <th className="py-2.5 px-3 font-bold text-center">JK</th>
                            <th className="py-2.5 px-3 font-bold">Diterima di Kelas</th>
                            <th className="py-2.5 px-3 font-bold">Tanggal Diterima</th>
                            <th className="py-2.5 px-3 font-bold">Sekolah Asal</th>
                            <th className="py-2.5 px-3 font-bold text-center w-20">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                          {currentMonthData.masukList.map((s, idx) => (
                            <tr key={s.id} className="hover:bg-emerald-50/30 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                              <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">
                                {s.namaLengkap}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                                {s.noInduk} / {s.nisn}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className={cn(
                                  "px-2 py-0.5 rounded font-black text-[10px]",
                                  s.jenisKelamin === 'L' ? "bg-blue-100 text-blue-800" : "bg-pink-100 text-pink-800"
                                )}>
                                  {s.jenisKelamin}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">
                                {s.diterimaDiKelas || s.kelasSekarang}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-mono">
                                {s.tanggalDiterima ? formatIndonesianDate(s.tanggalDiterima) : '-'}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                                {s.sekolahAsalTK || s.mutasi?.sekolahAsal || 'SDN Asal'}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                {onSelectDetail && (
                                  <button
                                    type="button"
                                    onClick={() => onSelectDetail(s.id)}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-blue-600 cursor-pointer"
                                    title="Lihat Detail Siswa"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION D: SISWA MUTASI KELUAR PADA BULAN INI */}
              {activeSubSection === 'siswa-mutasi' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                      <UserMinus className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      <span>Daftar Siswa Mutasi Keluar pada Bulan {selectedMonthInfo.fullName} ({currentMonthData.mutasiCount} Siswa)</span>
                    </h4>
                    <span className="text-xs text-slate-500">
                      Laki-laki: <strong>{currentMonthData.mutasiL}</strong> • Perempuan: <strong>{currentMonthData.mutasiP}</strong>
                    </span>
                  </div>

                  {currentMonthData.mutasiList.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                      <UserMinus className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                      <p className="font-bold text-slate-700 dark:text-slate-300">Tidak ada catatan siswa mutasi keluar pada bulan {selectedMonthInfo.fullName}.</p>
                      <p className="text-[11px] text-slate-400 mt-1">Data mutasi dicatat secara otomatis ketika proses mutasi keluar dilakukan di Buku Mutasi.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                            <th className="py-2.5 px-3 font-bold w-12 text-center">No</th>
                            <th className="py-2.5 px-3 font-bold">Nama Lengkap</th>
                            <th className="py-2.5 px-3 font-bold">NIS / NISN</th>
                            <th className="py-2.5 px-3 font-bold text-center">JK</th>
                            <th className="py-2.5 px-3 font-bold">Tanggal Mutasi</th>
                            <th className="py-2.5 px-3 font-bold">Sekolah Tujuan</th>
                            <th className="py-2.5 px-3 font-bold">Alasan Pindah</th>
                            <th className="py-2.5 px-3 font-bold text-center w-20">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                          {currentMonthData.mutasiList.map((s, idx) => (
                            <tr key={s.id} className="hover:bg-orange-50/30 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                              <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">
                                {s.namaLengkap}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                                {s.noInduk} / {s.nisn}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className={cn(
                                  "px-2 py-0.5 rounded font-black text-[10px]",
                                  s.jenisKelamin === 'L' ? "bg-blue-100 text-blue-800" : "bg-pink-100 text-pink-800"
                                )}>
                                  {s.jenisKelamin}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-mono">
                                {s.mutasi?.tglMeninggalkan 
                                  ? formatIndonesianDate(s.mutasi.tglMeninggalkan) 
                                  : (s.mutasi?.dikeluarkanTanggal ? formatIndonesianDate(s.mutasi.dikeluarkanTanggal) : '-')}
                              </td>
                              <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                                {s.mutasi?.sekolahTujuan || '-'}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                                {s.mutasi?.alasanPindah || '-'}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                {onSelectDetail && (
                                  <button
                                    type="button"
                                    onClick={() => onSelectDetail(s.id)}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-blue-600 cursor-pointer"
                                    title="Lihat Detail Siswa"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* VIEW MODE 2: MATRIKS PERIODIK 12 BULAN (FULL TABLE) */}
          {viewMode === 'matriks-periodik' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                  <Table className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Matriks Periodik Bulanan Siswa Aktif Selama 1 Tahun Pelajaran ({activeTP})</span>
                </h4>
                <span className="text-[11px] text-slate-500">
                  Rekap pergerakan siswa masuk, mutasi, dan total siswa per tingkat
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                      <th className="py-2.5 px-3 font-bold text-center w-10">No</th>
                      <th className="py-2.5 px-3 font-bold">Bulan</th>
                      <th className="py-2.5 px-2 font-bold text-center">Sem.</th>
                      <th className="py-2.5 px-2 font-bold text-center bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
                        Masuk
                      </th>
                      <th className="py-2.5 px-2 font-bold text-center bg-orange-50 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300">
                        Mutasi
                      </th>
                      <th className="py-2.5 px-2 font-bold text-center">Tingkat 1</th>
                      <th className="py-2.5 px-2 font-bold text-center">Tingkat 2</th>
                      <th className="py-2.5 px-2 font-bold text-center">Tingkat 3</th>
                      <th className="py-2.5 px-2 font-bold text-center">Tingkat 4</th>
                      <th className="py-2.5 px-2 font-bold text-center">Tingkat 5</th>
                      <th className="py-2.5 px-2 font-bold text-center">Tingkat 6</th>
                      <th className="py-2.5 px-3 font-bold text-center bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300">
                        Total Siswa
                      </th>
                      <th className="py-2.5 px-2 font-bold text-center w-16">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {periodicMonthlyStats.map((p, idx) => {
                      const isSelected = p.month.key === selectedMonthKey;
                      return (
                        <tr 
                          key={p.month.key}
                          className={cn(
                            "hover:bg-blue-50/50 dark:hover:bg-slate-800/40 transition-colors",
                            isSelected ? "bg-blue-50/70 dark:bg-blue-950/30 font-bold" : ""
                          )}
                        >
                          <td className="py-2 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-2 px-3 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            {p.month.isCurrent && (
                              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Bulan Berjalan" />
                            )}
                            <span>{p.month.monthName} {p.month.year}</span>
                          </td>
                          <td className="py-2 px-2 text-center text-slate-500">{p.month.semester}</td>
                          
                          {/* Masuk */}
                          <td className="py-2 px-2 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20">
                            {p.masukCount > 0 ? `+${p.masukCount}` : '-'}
                          </td>

                          {/* Mutasi */}
                          <td className="py-2 px-2 text-center font-bold text-orange-600 dark:text-orange-400 bg-orange-50/30 dark:bg-orange-950/20">
                            {p.mutasiCount > 0 ? `-${p.mutasiCount}` : '-'}
                          </td>

                          {/* Tingkat 1 to 6 */}
                          <td className="py-2 px-2 text-center font-mono">{p.tingkatCounts[1].total}</td>
                          <td className="py-2 px-2 text-center font-mono">{p.tingkatCounts[2].total}</td>
                          <td className="py-2 px-2 text-center font-mono">{p.tingkatCounts[3].total}</td>
                          <td className="py-2 px-2 text-center font-mono">{p.tingkatCounts[4].total}</td>
                          <td className="py-2 px-2 text-center font-mono">{p.tingkatCounts[5].total}</td>
                          <td className="py-2 px-2 text-center font-mono">{p.tingkatCounts[6].total}</td>

                          {/* Total Siswa */}
                          <td className="py-2 px-3 text-center font-black text-blue-700 dark:text-blue-300 bg-blue-50/40 dark:bg-blue-950/30 font-mono">
                            {p.totalAktif}
                          </td>

                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedMonthKey(p.month.key);
                                setViewMode('detail-bulan');
                              }}
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-blue-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                            >
                              Buka
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 dark:bg-slate-800 font-black border-t-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                      <td colSpan={3} className="py-2.5 px-3 text-right">TOTAL BULAN BERJALAN:</td>
                      <td className="py-2.5 px-2 text-center text-emerald-600">
                        +{periodicMonthlyStats.reduce((acc, curr) => acc + curr.masukCount, 0)}
                      </td>
                      <td className="py-2.5 px-2 text-center text-orange-600">
                        -{periodicMonthlyStats.reduce((acc, curr) => acc + curr.mutasiCount, 0)}
                      </td>
                      <td colSpan={6} className="py-2.5 px-2 text-center text-slate-500 font-normal">
                        Rekapitulasi 12 Bulan Tahun Pelajaran {activeTP}
                      </td>
                      <td className="py-2.5 px-3 text-center text-blue-700 dark:text-blue-300 font-black text-sm">
                        {activeStudentsGrade1to6.length}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
