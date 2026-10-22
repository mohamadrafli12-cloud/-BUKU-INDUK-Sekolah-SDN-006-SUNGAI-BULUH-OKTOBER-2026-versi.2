import React, { useState, useMemo } from 'react';
import { 
  Eye, 
  TrendingUp, 
  Users, 
  Globe, 
  Clock, 
  ShieldCheck,
  ArrowLeft,
  BarChart3,
  Layers,
  GraduationCap,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Table,
  Filter
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { useSchool } from '../../context/SchoolContext';
import { cn } from '../../lib/utils';

interface AnalyticsViewProps {
  onBack?: () => void;
  setActiveTab?: (tab: any) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  onBack,
  setActiveTab,
}) => {
  const { visitorStats, activityLogs, students, schoolProfile } = useSchool();

  // Filter & visualization state for Student Distribution
  const [filterStatus, setFilterStatus] = useState<'active' | 'all'>('active');
  const [chartMode, setChartMode] = useState<'grouped' | 'stacked'>('grouped');
  const [showTableDetails, setShowTableDetails] = useState<boolean>(true);
  const [hideEmptyClasses, setHideEmptyClasses] = useState<boolean>(true);

  const handleGoBack = () => {
    if (onBack) {
      onBack();
    } else if (setActiveTab) {
      setActiveTab('dashboard');
    }
  };

  // 1. Filtered students based on status (Aktif vs Semua)
  const filteredStudents = useMemo(() => {
    if (filterStatus === 'active') {
      return students.filter((s) => s.status === 'Aktif');
    }
    return students;
  }, [students, filterStatus]);

  // 2. Computed Bar Chart Data: Distribution by Grade Level & Gender
  const gradeDistributionData = useMemo(() => {
    const classSet = new Set<string>();

    // Incorporate official school classes if defined
    if (schoolProfile.daftarKelas && schoolProfile.daftarKelas.length > 0) {
      schoolProfile.daftarKelas.forEach((c) => {
        if (c && !c.toLowerCase().includes('alumni')) {
          classSet.add(c.trim());
        }
      });
    }

    // Incorporate classes present in students dataset
    filteredStudents.forEach((s) => {
      if (s.kelasSekarang && s.kelasSekarang.trim()) {
        classSet.add(s.kelasSekarang.trim());
      }
    });

    // Fallback standard SD classes if none found
    if (classSet.size === 0) {
      ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'].forEach((c) =>
        classSet.add(c)
      );
    }

    // Natural sort order (Kelas 1, Kelas 2, ... Kelas 6, etc.)
    const sortedClasses = Array.from(classSet).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b);
    });

    return sortedClasses.map((className) => {
      const classStudents = filteredStudents.filter((s) => s.kelasSekarang === className);
      const lakiLaki = classStudents.filter((s) => {
        const g = (s.jenisKelamin || '').toString().trim().toUpperCase();
        return g === 'L' || g.startsWith('LAKI');
      }).length;

      const perempuan = classStudents.filter((s) => {
        const g = (s.jenisKelamin || '').toString().trim().toUpperCase();
        return g === 'P' || g.startsWith('PEREMPUAN');
      }).length;

      const total = classStudents.length;

      return {
        kelas: className,
        shortName: className.replace(/^Kelas\s*/i, 'Kls '),
        lakiLaki,
        perempuan,
        total,
        pctLaki: total > 0 ? Math.round((lakiLaki / total) * 100) : 0,
        pctPerempuan: total > 0 ? Math.round((perempuan / total) * 100) : 0,
      };
    });
  }, [filteredStudents, schoolProfile.daftarKelas]);

  // Sembunyikan rombel yang tidak ada siswanya atau 0
  const displayedGradeData = useMemo(() => {
    if (hideEmptyClasses) {
      return gradeDistributionData.filter((d) => d.total > 0);
    }
    return gradeDistributionData;
  }, [gradeDistributionData, hideEmptyClasses]);

  const emptyClassesCount = useMemo(() => {
    return gradeDistributionData.filter((d) => d.total === 0).length;
  }, [gradeDistributionData]);

  // Overall Gender Totals in scope
  const totalInScope = filteredStudents.length;
  const totalMale = useMemo(() => {
    return filteredStudents.filter((s) => {
      const g = (s.jenisKelamin || '').toString().trim().toUpperCase();
      return g === 'L' || g.startsWith('LAKI');
    }).length;
  }, [filteredStudents]);

  const totalFemale = useMemo(() => {
    return filteredStudents.filter((s) => {
      const g = (s.jenisKelamin || '').toString().trim().toUpperCase();
      return g === 'P' || g.startsWith('PEREMPUAN');
    }).length;
  }, [filteredStudents]);

  const pctMale = totalInScope > 0 ? Math.round((totalMale / totalInScope) * 100) : 0;
  const pctFemale = totalInScope > 0 ? Math.round((totalFemale / totalInScope) * 100) : 0;

  // Class with maximum students
  const highestClass = useMemo(() => {
    if (displayedGradeData.length === 0) return null;
    return [...displayedGradeData].sort((a, b) => b.total - a.total)[0];
  }, [displayedGradeData]);

  // 7-day traffic trend data
  const trafficData = [
    { tanggal: '13 Agu', pengunjung: 38, tampilanHalaman: 112 },
    { tanggal: '14 Agu', pengunjung: 45, tampilanHalaman: 140 },
    { tanggal: '15 Agu', pengunjung: 52, tampilanHalaman: 168 },
    { tanggal: '16 Agu', pengunjung: 40, tampilanHalaman: 125 },
    { tanggal: '17 Agu', pengunjung: 60, tampilanHalaman: 210 },
    { tanggal: '18 Agu', pengunjung: 55, tampilanHalaman: 180 },
    { tanggal: '19 Agu', pengunjung: visitorStats?.today ?? 86, tampilanHalaman: (visitorStats?.today ?? 86) * 3 },
  ];

  // Device split
  const deviceData = [
    { name: 'Desktop / Komputer Sekolah', value: 68, color: '#003399' },
    { name: 'Mobile / Smartphone Guru', value: 28, color: '#ea580c' },
    { name: 'Tablet / Lainnya', value: 4, color: '#10b981' },
  ];

  // Custom Tooltip for Student Grade & Gender Bar Chart
  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length && payload[0]?.payload) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-xs text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs min-w-[200px] space-y-2">
          <div className="font-extrabold text-sm border-b border-slate-700/80 pb-1.5 flex items-center justify-between">
            <span className="text-white">{data.kelas || '-'}</span>
            <span className="text-slate-300 font-normal text-[11px] bg-slate-800 px-2 py-0.5 rounded-md">
              {data.total || 0} Siswa
            </span>
          </div>
          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center justify-between text-blue-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block shadow-xs" />
                Laki-laki (L):
              </span>
              <span className="font-bold">{data.lakiLaki || 0} ({data.pctLaki || 0}%)</span>
            </div>
            <div className="flex items-center justify-between text-pink-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500 inline-block shadow-xs" />
                Perempuan (P):
              </span>
              <span className="font-bold">{data.perempuan || 0} ({data.pctPerempuan || 0}%)</span>
            </div>
            <div className="border-t border-slate-700/80 pt-1.5 flex items-center justify-between text-slate-200 font-extrabold">
              <span>Total Rombel:</span>
              <span className="text-emerald-400">{data.total || 0} Peserta Didik</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <button
            onClick={handleGoBack}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
            title="Kembali ke Dashboard Utama"
          >
            <ArrowLeft className="w-4 h-4 text-[#003399] dark:text-blue-400" />
            <span className="hidden sm:inline">Kembali</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                Pusat Analitik & Visualisasi Data
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-extrabold text-xs">
                Kemdikbud Standard
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Visualisasi demografi peserta didik, rasio gender per tingkat kelas, dan analitik operasional Buku Induk Sekolah
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION: DATA VISUALIZATION - DISTRIBUSI SISWA PER KELAS & GENDER (RECHARTS) */}
      {/* ========================================================================= */}
      <section className="p-5 md:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        {/* Section Header with Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#003399] dark:text-blue-400">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h2 className="text-base md:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Distribusi Siswa Menurut Tingkat Kelas & Jenis Kelamin
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Grafik batang komparasi perbandingan jumlah siswa Laki-laki (L) dan Perempuan (P) di setiap rombongan belajar
            </p>
          </div>

          {/* Controls: Filter Status & Chart Mode */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Scope Filter: Aktif vs Semua */}
            <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-xs">
              <button
                type="button"
                onClick={() => setFilterStatus('active')}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer",
                  filterStatus === 'active'
                    ? "bg-white dark:bg-slate-700 text-[#003399] dark:text-blue-300 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                Siswa Aktif ({students.filter((s) => s.status === 'Aktif').length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer",
                  filterStatus === 'all'
                    ? "bg-white dark:bg-slate-700 text-[#003399] dark:text-blue-300 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                Semua Siswa ({students.length})
              </button>
            </div>

            {/* Chart Mode: Grouped vs Stacked */}
            <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-xs">
              <button
                type="button"
                onClick={() => setChartMode('grouped')}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer",
                  chartMode === 'grouped'
                    ? "bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                )}
                title="Bagan Berdampingan (Side-by-side bar)"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Berdampingan</span>
              </button>
              <button
                type="button"
                onClick={() => setChartMode('stacked')}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer",
                  chartMode === 'stacked'
                    ? "bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                )}
                title="Bagan Bertumpuk (Stacked bar)"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Bertumpuk</span>
              </button>
            </div>

            {/* Toggle Sembunyikan Rombel Kosong */}
            <button
              type="button"
              onClick={() => setHideEmptyClasses(prev => !prev)}
              className={cn(
                "px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all text-xs border cursor-pointer",
                hideEmptyClasses
                  ? "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800"
                  : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-200"
              )}
              title={hideEmptyClasses ? "Tampilkan semua rombel termasuk yang 0 siswa" : "Sembunyikan rombel yang tidak ada siswanya atau 0"}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>
                {hideEmptyClasses
                  ? `Sembunyikan Kosong / 0 (${emptyClassesCount})`
                  : 'Tampilkan Semua Rombel'}
              </span>
            </button>
          </div>
        </div>

        {/* Demographic KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {/* Card 1: Total Siswa Terlingkup */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
              <span>Total Siswa</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              {totalInScope}
              <span className="text-xs font-medium text-slate-500 ml-1">Siswa</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {filterStatus === 'active' ? 'Status: Aktif Belajar' : 'Termasuk Alumni & Mutasi'}
            </div>
          </div>

          {/* Card 2: Laki-laki */}
          <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/50">
            <div className="flex items-center justify-between text-blue-700 dark:text-blue-300 text-xs font-bold">
              <span>Laki-laki (L)</span>
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            </div>
            <div className="text-2xl font-black text-blue-700 dark:text-blue-300 mt-1">
              {totalMale}
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 ml-1.5">
                ({pctMale}%)
              </span>
            </div>
            {/* Mini Progress Bar */}
            <div className="w-full bg-blue-200 dark:bg-blue-900/60 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${pctMale}%` }}
              />
            </div>
          </div>

          {/* Card 3: Perempuan */}
          <div className="p-4 rounded-2xl bg-pink-50/60 dark:bg-pink-950/30 border border-pink-200/80 dark:border-pink-800/50">
            <div className="flex items-center justify-between text-pink-700 dark:text-pink-300 text-xs font-bold">
              <span>Perempuan (P)</span>
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
            </div>
            <div className="text-2xl font-black text-pink-700 dark:text-pink-300 mt-1">
              {totalFemale}
              <span className="text-xs font-bold text-pink-600 dark:text-pink-400 ml-1.5">
                ({pctFemale}%)
              </span>
            </div>
            {/* Mini Progress Bar */}
            <div className="w-full bg-pink-200 dark:bg-pink-900/60 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-pink-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${pctFemale}%` }}
              />
            </div>
          </div>

          {/* Card 4: Kelas Terpadat */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/50">
            <div className="flex items-center justify-between text-indigo-700 dark:text-indigo-300 text-xs font-bold">
              <span>Rombel Terbanyak</span>
              <GraduationCap className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-xl font-black text-indigo-800 dark:text-indigo-200 mt-1 truncate">
              {highestClass ? highestClass.kelas : '-'}
            </div>
            <div className="text-[11px] text-indigo-600 dark:text-indigo-300 font-semibold mt-1">
              {highestClass ? `${highestClass.total} Siswa (${highestClass.lakiLaki} L • ${highestClass.perempuan} P)` : 'Belum ada data'}
            </div>
          </div>
        </div>

        {/* RECHARTS BAR CHART */}
        <div className="pt-2">
          {displayedGradeData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
              <Users className="w-10 h-10 text-slate-400 mb-2" />
              <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                Belum ada data siswa untuk divisualisasikan
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                {emptyClassesCount > 0 && hideEmptyClasses
                  ? `${emptyClassesCount} rombel dengan 0 siswa disembunyikan. Klik "Tampilkan Semua Rombel" untuk melihat rombel kosong.`
                  : 'Tambahkan peserta didik melalui menu Pendataan Siswa untuk melihat visualisasi distribusi kelas.'}
              </p>
            </div>
          ) : (
            <div className="w-full h-80 md:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={displayedGradeData}
                  margin={{ top: 20, right: 15, left: -15, bottom: 25 }}
                  barGap={chartMode === 'grouped' ? 6 : 0}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                    className="dark:opacity-15"
                  />
                  <XAxis
                    dataKey="kelas"
                    tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                    stroke="#94a3b8"
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    stroke="#94a3b8"
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: '16px', fontSize: '12px', fontWeight: 700 }}
                    iconType="circle"
                  />
                  <Bar
                    dataKey="lakiLaki"
                    name="Laki-laki (L)"
                    fill="#2563eb"
                    stackId={chartMode === 'stacked' ? 'genderStack' : undefined}
                    radius={chartMode === 'stacked' ? [0, 0, 0, 0] : [6, 6, 0, 0]}
                    animationDuration={600}
                  />
                  <Bar
                    dataKey="perempuan"
                    name="Perempuan (P)"
                    fill="#ec4899"
                    stackId={chartMode === 'stacked' ? 'genderStack' : undefined}
                    radius={chartMode === 'stacked' ? [6, 6, 0, 0] : [6, 6, 0, 0]}
                    animationDuration={600}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Collapsible Tabular Details Breakdown */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setShowTableDetails(!showTableDetails)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-[#003399] dark:text-blue-400" />
              <span>Rincian Rekapitulasi Matriks per Tingkat Kelas</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 font-semibold">
                {displayedGradeData.length} Rombel
              </span>
            </div>
            <div className="flex items-center gap-1 text-slate-500 text-[11px]">
              <span>{showTableDetails ? 'Sembunyikan Rincian' : 'Tampilkan Rincian'}</span>
              {showTableDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {showTableDetails && (
            <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                    <th className="py-2.5 px-3">Tingkat Kelas</th>
                    <th className="py-2.5 px-3 text-center text-blue-700 dark:text-blue-400">Laki-laki (L)</th>
                    <th className="py-2.5 px-3 text-center text-pink-700 dark:text-pink-400">Perempuan (P)</th>
                    <th className="py-2.5 px-3 text-center font-extrabold text-slate-900 dark:text-slate-100">Total Siswa</th>
                    <th className="py-2.5 px-3">Komparasi Proporsi Gender</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {displayedGradeData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500">
                        Tidak ada rombel yang memiliki siswa.
                        {emptyClassesCount > 0 && hideEmptyClasses && (
                          <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                            ({emptyClassesCount} rombel dengan 0 siswa disembunyikan)
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : (
                    displayedGradeData.map((row, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-blue-50/30 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">
                        {row.kelas}
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-blue-700 dark:text-blue-300">
                        {row.lakiLaki}{' '}
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({row.pctLaki}%)
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-pink-700 dark:text-pink-300">
                        {row.perempuan}{' '}
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({row.pctPerempuan}%)
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-black text-slate-900 dark:text-slate-100">
                        {row.total}
                      </td>
                      <td className="py-2.5 px-3 min-w-[160px]">
                        {row.total > 0 ? (
                          <div className="space-y-1">
                            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                              <div
                                style={{ width: `${row.pctLaki}%` }}
                                className="bg-blue-600 h-full transition-all"
                                title={`Laki-laki: ${row.pctLaki}%`}
                              />
                              <div
                                style={{ width: `${row.pctPerempuan}%` }}
                                className="bg-pink-500 h-full transition-all"
                                title={`Perempuan: ${row.pctPerempuan}%`}
                              />
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                              <span>L: {row.pctLaki}%</span>
                              <span>P: {row.pctPerempuan}%</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Kosong</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
                <tfoot>
                  <tr className="bg-slate-100/80 dark:bg-slate-800/90 font-black text-slate-900 dark:text-slate-100 border-t-2 border-slate-300 dark:border-slate-700">
                    <td className="py-3 px-3">TOTAL KESELURUHAN</td>
                    <td className="py-3 px-3 text-center text-blue-700 dark:text-blue-300">
                      {totalMale}{' '}
                      <span className="text-[10px] font-normal text-slate-500">
                        ({pctMale}%)
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-pink-700 dark:text-pink-300">
                      {totalFemale}{' '}
                      <span className="text-[10px] font-normal text-slate-500">
                        ({pctFemale}%)
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-base text-[#003399] dark:text-blue-400">
                      {totalInScope}
                    </td>
                    <td className="py-3 px-3">
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex">
                        <div
                          style={{ width: `${pctMale}%` }}
                          className="bg-blue-600 h-full"
                        />
                        <div
                          style={{ width: `${pctFemale}%` }}
                          className="bg-pink-500 h-full"
                        />
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION: SYSTEM METRICS & PERFORMANCE */}
      {/* ========================================================================= */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Metrik Sistem & Trafik Akses Basis Data
          </h2>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Hari Ini */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pengunjung Hari Ini</span>
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 rounded-xl">
                <Eye className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight">
                {visitorStats.today}
              </div>
              <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+18.4% dibandingkan kemarin</span>
              </div>
            </div>
          </div>

          {/* Card 2: Total Pengunjung */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Kunjungan Kumulatif</span>
              <div className="p-2 bg-blue-50 dark:bg-blue-950 text-blue-600 rounded-xl">
                <Globe className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight">
                {visitorStats.total}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Tercatat sejak sistem diimplementasikan
              </div>
            </div>
          </div>

          {/* Card 3: Rata-rata Harian */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rata-rata Kunjungan / Hari</span>
              <div className="p-2 bg-amber-50 dark:bg-amber-950 text-amber-600 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight">
                47
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Jam tersibuk: 08:30 - 11:00 WIB
              </div>
            </div>
          </div>

          {/* Card 4: Audit Log entries */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Transaksi Data</span>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-xl">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
                {activityLogs.length}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Aktivitas CRUD terarsip aman
              </div>
            </div>
          </div>
        </div>

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Trend Area Chart */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  Tren Kunjungan 7 Hari Terakhir
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Statistik tayangan halaman dan unique visitors
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                Live Realtime
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVisitor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPageviews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#003399" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#003399" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="tanggal" tick={{ fontSize: 11 }} stroke="#64748b" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#64748b" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="tampilanHalaman" stroke="#003399" fillOpacity={1} fill="url(#colorPageviews)" name="Tampilan Halaman" />
                  <Area type="monotone" dataKey="pengunjung" stroke="#4f46e5" fillOpacity={1} fill="url(#colorVisitor)" strokeWidth={2} name="Pengunjung" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Device split */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                Perangkat Pengakses
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Distribusi browser dan device operator
              </p>
            </div>

            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={deviceData} cx="50%" cy="50%" innerRadius={45} outerRadius={68} dataKey="value">
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              {deviceData.map((d, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-slate-600 dark:text-slate-300">{d.name}</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
