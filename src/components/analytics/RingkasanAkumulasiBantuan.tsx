import React, { useMemo, useState } from 'react';
import { 
  Landmark, 
  CreditCard, 
  School, 
  MapPin, 
  Sparkles, 
  Users, 
  Calendar, 
  TrendingUp, 
  PieChart, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  Printer, 
  Filter, 
  HelpCircle,
  Coins,
  ChevronRight,
  ShieldCheck,
  Building2,
  DollarSign
} from 'lucide-react';
import { Student, BantuanRecord } from '../../types';
import { cn, formatCurrencyIDR } from '../../lib/utils';

export interface RingkasanAkumulasiBantuanProps {
  students: Student[];
  daftarTahunPelajaran?: string[];
  activeTP: string;
  selectedTP: string;
  onSelectTP: (tp: string) => void;
  onFilterJenis?: (jenis: string) => void;
  activeFilterJenis?: string;
}

export interface YearBudgetSummary {
  tahunPelajaran: string;
  isActiveTP: boolean;
  isSelectedTP: boolean;
  totalPenerima: number;
  totalL: number;
  totalP: number;
  totalNominal: number;
  rataRataNominal: number;
  persenDariTotalAnggaran: number;
  totalSudahCair: number;
  totalDalamProses: number;
  nominalSudahCair: number;
  nominalDalamProses: number;
  programBreakdown: {
    pip: { count: number; nominal: number };
    baznas: { count: number; nominal: number };
    sekolah: { count: number; nominal: number };
    desa: { count: number; nominal: number };
    lainnya: { count: number; nominal: number };
  };
}

export interface ProgramBudgetSummary {
  id: string;
  title: string;
  shortTitle: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  allTimeCount: number;
  allTimeNominal: number;
  selectedTPCount: number;
  selectedTPNominal: number;
  persenDariTotal: number;
}

/**
 * Helper: Parse nominal string/number to clean numerical IDR value
 * Handles formats like: "Rp 450.000 / tahun", "Rp 500.000", "750000", "300.000 / semester"
 */
export const parseNominalToNumber = (val?: string | number | null): number => {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).trim();
  const digits = str.replace(/[^0-9]/g, '');
  if (digits.length > 0) {
    const num = parseInt(digits, 10);
    return isNaN(num) ? 0 : num;
  }
  const lower = str.toLowerCase();
  if (lower.includes('komite') || lower.includes('seragam') || lower.includes('keringanan')) {
    return 350000; // Standar subsidi internal pakaian/seragam SDN
  }
  return 0;
};

export const RingkasanAkumulasiBantuan: React.FC<RingkasanAkumulasiBantuanProps> = ({
  students,
  daftarTahunPelajaran = ['2023/2024', '2024/2025', '2025/2026', '2026/2027', '2027/2028'],
  activeTP,
  selectedTP,
  onSelectTP,
  onFilterJenis,
  activeFilterJenis = 'ALL',
}) => {
  const [viewTab, setViewTab] = useState<'tabel' | 'program'>('tabel');

  // Helper inside component to get student assistance records for a specific year
  const getRecordsForStudentInTP = (s: Student, tp: string): BantuanRecord[] => {
    const records: BantuanRecord[] = [];
    const hasHistory = Boolean(s.riwayatBantuan && Array.isArray(s.riwayatBantuan) && s.riwayatBantuan.length > 0);

    if (hasHistory) {
      s.riwayatBantuan!.forEach(r => {
        if (tp === 'ALL' || r.tahunPelajaran === tp) {
          records.push(r);
        }
      });
      return records;
    }

    // Legacy fallback
    const isRecipient = Boolean(
      (s.penerimaBantuan && s.penerimaBantuan !== 'Tidak' && s.penerimaBantuan !== 'Bukan Penerima') ||
      (s.jenisBantuanList && s.jenisBantuanList.length > 0)
    );

    if (isRecipient) {
      const bYear = s.tahunBantuan || (s.tahunPelajaranKelasSekarang || activeTP);
      if (tp === 'ALL' || bYear === tp) {
        const types: string[] = s.jenisBantuanList && s.jenisBantuanList.length > 0
          ? s.jenisBantuanList
          : (s.penerimaBantuan || '').split(',').map(x => x.trim()).filter(Boolean);

        types.forEach((t, i) => {
          records.push({
            id: `legacy-${s.id}-${i}`,
            jenis: t,
            bantuanLainnya: t === 'Bantuan Lainnya' ? s.bantuanLainnya : undefined,
            tahunPelajaran: bYear,
            tahap: s.tahapBantuan || 'Tahap 1',
            tanggalMenerima: s.tanggalMenerimaBantuan,
            nominal: s.nominalBantuan || 'Rp 450.000 / tahun',
            keterangan: s.keteranganBantuan,
            statusPencairan: s.tanggalMenerimaBantuan ? 'Sudah Cair' : 'Dalam Proses',
          });
        });
      }
    }

    return records;
  };

  // Compile unique academic years list sorted chronologically (newest first)
  const allAcademicYears = useMemo(() => {
    const set = new Set<string>(daftarTahunPelajaran);
    students.forEach(s => {
      if (s.riwayatBantuan) {
        s.riwayatBantuan.forEach(r => {
          if (r.tahunPelajaran) set.add(r.tahunPelajaran);
        });
      }
      if (s.tahunBantuan) set.add(s.tahunBantuan);
    });

    const arr = Array.from(set);
    return arr.sort((a, b) => {
      const yearA = parseInt(a.split('/')[0] || '0', 10);
      const yearB = parseInt(b.split('/')[0] || '0', 10);
      return yearB - yearA; // Newest year first
    });
  }, [students, daftarTahunPelajaran]);

  // Compute Grand Total & Stats across ALL years
  const grandStats = useMemo(() => {
    let allTimeNominal = 0;
    let allTimeDisbursed = 0;
    let allTimePending = 0;
    let allTimeAllocationCount = 0;
    const uniqueRecipientsSet = new Set<string>();

    students.forEach(s => {
      const allRecords = getRecordsForStudentInTP(s, 'ALL');
      if (allRecords.length > 0) {
        uniqueRecipientsSet.add(s.id);
        allRecords.forEach(r => {
          allTimeAllocationCount++;
          const nom = parseNominalToNumber(r.nominal);
          allTimeNominal += nom;
          if (r.statusPencairan === 'Sudah Cair' || r.tanggalMenerima) {
            allTimeDisbursed += nom;
          } else {
            allTimePending += nom;
          }
        });
      }
    });

    return {
      allTimeNominal,
      allTimeDisbursed,
      allTimePending,
      allTimeAllocationCount,
      allTimeUniqueRecipients: uniqueRecipientsSet.size,
      percentDisbursed: allTimeNominal > 0 ? Math.round((allTimeDisbursed / allTimeNominal) * 100) : 100,
    };
  }, [students, activeTP]);

  // Compute breakdown per academic year
  const yearlySummaries = useMemo<YearBudgetSummary[]>(() => {
    return allAcademicYears.map(tp => {
      const recipientStudents = students.filter(s => getRecordsForStudentInTP(s, tp).length > 0);
      let totalNominal = 0;
      let nominalSudahCair = 0;
      let nominalDalamProses = 0;
      let totalSudahCair = 0;
      let totalDalamProses = 0;

      const programBreakdown = {
        pip: { count: 0, nominal: 0 },
        baznas: { count: 0, nominal: 0 },
        sekolah: { count: 0, nominal: 0 },
        desa: { count: 0, nominal: 0 },
        lainnya: { count: 0, nominal: 0 },
      };

      recipientStudents.forEach(s => {
        const records = getRecordsForStudentInTP(s, tp);
        records.forEach(r => {
          const nom = parseNominalToNumber(r.nominal);
          totalNominal += nom;

          if (r.statusPencairan === 'Sudah Cair' || r.tanggalMenerima) {
            nominalSudahCair += nom;
            totalSudahCair++;
          } else {
            nominalDalamProses += nom;
            totalDalamProses++;
          }

          // Program attribution
          const j = (r.jenis || '').toLowerCase();
          if (j.includes('pip')) {
            programBreakdown.pip.count++;
            programBreakdown.pip.nominal += nom;
          } else if (j.includes('baznas')) {
            programBreakdown.baznas.count++;
            programBreakdown.baznas.nominal += nom;
          } else if (j.includes('sekolah')) {
            programBreakdown.sekolah.count++;
            programBreakdown.sekolah.nominal += nom;
          } else if (j.includes('desa')) {
            programBreakdown.desa.count++;
            programBreakdown.desa.nominal += nom;
          } else {
            programBreakdown.lainnya.count++;
            programBreakdown.lainnya.nominal += nom;
          }
        });
      });

      const totalL = recipientStudents.filter(s => s.jenisKelamin === 'L').length;
      const totalP = recipientStudents.filter(s => s.jenisKelamin === 'P').length;
      const totalPenerima = recipientStudents.length;

      return {
        tahunPelajaran: tp,
        isActiveTP: tp === activeTP,
        isSelectedTP: tp === selectedTP,
        totalPenerima,
        totalL,
        totalP,
        totalNominal,
        rataRataNominal: totalPenerima > 0 ? Math.round(totalNominal / totalPenerima) : 0,
        persenDariTotalAnggaran: grandStats.allTimeNominal > 0 
          ? Math.round((totalNominal / grandStats.allTimeNominal) * 100) 
          : 0,
        totalSudahCair,
        totalDalamProses,
        nominalSudahCair,
        nominalDalamProses,
        programBreakdown,
      };
    });
  }, [allAcademicYears, students, activeTP, selectedTP, grandStats.allTimeNominal]);

  // Compute breakdown per program (All-Time vs Selected TP)
  const programSummaries = useMemo<ProgramBudgetSummary[]>(() => {
    const programs: { id: string; title: string; shortTitle: string; icon: any; color: string; keywords: string[] }[] = [
      { id: 'Penerima PIP', title: 'Program Indonesia Pintar (Kemdikbud)', shortTitle: 'PIP Kemdikbud', icon: CreditCard, color: 'blue', keywords: ['pip'] },
      { id: 'Baznas', title: 'Beasiswa Badan Amil Zakat Nasional', shortTitle: 'Baznas', icon: Landmark, color: 'emerald', keywords: ['baznas'] },
      { id: 'Bantuan Sekolah', title: 'Bantuan Internal / Subsidi Sekolah', shortTitle: 'Bantuan Sekolah', icon: School, color: 'indigo', keywords: ['sekolah', 'komite', 'subsidi'] },
      { id: 'Bantuan dari desa', title: 'Bantuan Perlengkapan Dana Desa', shortTitle: 'Bantuan Desa', icon: MapPin, color: 'orange', keywords: ['desa'] },
      { id: 'Bantuan Lainnya', title: 'Bantuan Lainnya / Mitra CSR & Donatur', shortTitle: 'Bantuan Lainnya', icon: Sparkles, color: 'amber', keywords: ['lainnya', 'csr', 'donatur', 'yayasan'] },
    ];

    return programs.map(p => {
      let allTimeNominal = 0;
      let allTimeCount = 0;
      let selectedTPNominal = 0;
      let selectedTPCount = 0;

      students.forEach(s => {
        // All-Time
        const allRecords = getRecordsForStudentInTP(s, 'ALL');
        const matchAll = allRecords.filter(r => p.keywords.some(k => (r.jenis || '').toLowerCase().includes(k)));
        if (matchAll.length > 0) {
          allTimeCount += matchAll.length;
          matchAll.forEach(r => {
            allTimeNominal += parseNominalToNumber(r.nominal);
          });
        }

        // Selected TP
        const tpRecords = getRecordsForStudentInTP(s, selectedTP);
        const matchTP = tpRecords.filter(r => p.keywords.some(k => (r.jenis || '').toLowerCase().includes(k)));
        if (matchTP.length > 0) {
          selectedTPCount += matchTP.length;
          matchTP.forEach(r => {
            selectedTPNominal += parseNominalToNumber(r.nominal);
          });
        }
      });

      return {
        id: p.id,
        title: p.title,
        shortTitle: p.shortTitle,
        icon: p.icon,
        color: p.color,
        allTimeCount,
        allTimeNominal,
        selectedTPCount,
        selectedTPNominal,
        persenDariTotal: grandStats.allTimeNominal > 0
          ? Math.round((allTimeNominal / grandStats.allTimeNominal) * 100)
          : 0,
      };
    });
  }, [students, selectedTP, grandStats.allTimeNominal]);

  // Selected TP Summary
  const selectedTPSummary = useMemo(() => {
    return yearlySummaries.find(y => y.tahunPelajaran === selectedTP) || {
      tahunPelajaran: selectedTP,
      isActiveTP: selectedTP === activeTP,
      isSelectedTP: true,
      totalPenerima: 0,
      totalL: 0,
      totalP: 0,
      totalNominal: 0,
      rataRataNominal: 0,
      persenDariTotalAnggaran: 0,
      totalSudahCair: 0,
      totalDalamProses: 0,
      nominalSudahCair: 0,
      nominalDalamProses: 0,
      programBreakdown: {
        pip: { count: 0, nominal: 0 },
        baznas: { count: 0, nominal: 0 },
        sekolah: { count: 0, nominal: 0 },
        desa: { count: 0, nominal: 0 },
        lainnya: { count: 0, nominal: 0 },
      },
    };
  }, [yearlySummaries, selectedTP, activeTP]);

  // Program with largest all-time budget
  const topProgram = useMemo(() => {
    return [...programSummaries].sort((a, b) => b.allTimeNominal - a.allTimeNominal)[0];
  }, [programSummaries]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-all space-y-0">
      {/* ========================================================================= */}
      {/* 1. HEADER RINGKASAN STATISTIK & PEMANTAUAN ANGGARAN */}
      {/* ========================================================================= */}
      <div className="p-5 md:p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-white to-blue-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-[#003399] dark:bg-blue-950 dark:text-blue-300 text-[10.5px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Pemantauan Anggaran & Multi-Tahun</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10.5px] font-extrabold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Akumulasi Realisasi: {grandStats.percentDisbursed}% Tersalurkan</span>
              </span>
            </div>

            <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Ringkasan Statistik & Akumulasi Bantuan Siswa</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Monitoring total alokasi dana bantuan pendidikan, jumlah penerima per tahun pelajaran, dan realisasi anggaran kesejahteraan peserta didik di sekolah.
            </p>
          </div>

          {/* Tab Switcher & Quick Indicator */}
          <div className="flex items-center gap-2 self-start lg:self-center">
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewTab('tabel')}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
                  viewTab === 'tabel'
                    ? "bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Rekap Per Tahun</span>
              </button>
              <button
                type="button"
                onClick={() => setViewTab('program')}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
                  viewTab === 'program'
                    ? "bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                <PieChart className="w-3.5 h-3.5" />
                <span>Rekap Per Program</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. KARTU RINGKASAN METRIK ANGGARAN UTAMA (4 KPI CARDS) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5">
          {/* Card 1: Total Akumulasi Seluruh Bantuan */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md relative overflow-hidden flex flex-col justify-between">
            <div className="absolute right-0 top-0 translate-x-2 -translate-y-2 opacity-10 pointer-events-none">
              <Coins className="w-28 h-28" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-200">
                  Total Akumulasi Dana (All-Time)
                </span>
                <span className="p-1.5 rounded-lg bg-white/20 backdrop-blur-xs text-white">
                  <Landmark className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-2xl font-black mt-2 tracking-tight">
                {formatCurrencyIDR(grandStats.allTimeNominal)}
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-white/20 flex items-center justify-between text-[11px] text-blue-100 font-medium">
              <span>{grandStats.allTimeUniqueRecipients} Siswa Penerima</span>
              <span>•</span>
              <span>{grandStats.allTimeAllocationCount} Transaksi Bantuan</span>
            </div>
          </div>

          {/* Card 2: Akumulasi Tahun Dipilih */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {selectedTP === 'ALL' ? 'Akumulasi Semua Tahun' : `Alokasi TP ${selectedTP}`}
                </span>
                <span className={cn(
                  "p-1.5 rounded-lg text-xs font-bold flex items-center gap-1",
                  selectedTP === activeTP 
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                )}>
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{selectedTP === activeTP ? 'Tahun Aktif' : selectedTP}</span>
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2 tracking-tight">
                {formatCurrencyIDR(selectedTP === 'ALL' ? grandStats.allTimeNominal : selectedTPSummary.totalNominal)}
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {selectedTP === 'ALL' ? grandStats.allTimeUniqueRecipients : selectedTPSummary.totalPenerima} Siswa
              </span>
              <span>•</span>
              <span>
                Rata-rata: {formatCurrencyIDR(selectedTP === 'ALL' 
                  ? (grandStats.allTimeUniqueRecipients > 0 ? Math.round(grandStats.allTimeNominal / grandStats.allTimeUniqueRecipients) : 0)
                  : selectedTPSummary.rataRataNominal
                )}
              </span>
            </div>
          </div>

          {/* Card 3: Realisasi Program Terbesar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Program Alokasi Terbesar
                </span>
                <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  <TrendingUp className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-slate-100 mt-2 truncate" title={topProgram?.title}>
                {topProgram?.shortTitle || '-'}
              </div>
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatCurrencyIDR(topProgram?.allTimeNominal || 0)}
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <span>{topProgram?.allTimeCount || 0} Siswa Penerima</span>
              <span>•</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {topProgram?.persenDariTotal || 0}% Total Dana
              </span>
            </div>
          </div>

          {/* Card 4: Status Realisasi Pencairan Anggaran */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Status Realisasi Pencairan
                </span>
                <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2 tracking-tight">
                {formatCurrencyIDR(grandStats.allTimeDisbursed)}
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mt-1.5">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${grandStats.percentDisbursed}%` }}
                />
              </div>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                ✓ {grandStats.percentDisbursed}% Sudah Cair
              </span>
              <span>•</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">
                {formatCurrencyIDR(grandStats.allTimePending)} Proses
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. KONTEN TAB: REKAP PER TAHUN PELAJARAN (TABEL LENGKAP & VISUALISASI) */}
      {/* ========================================================================= */}
      {viewTab === 'tabel' && (
        <div className="p-5 md:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Tabel Ringkasan Siswa & Akumulasi Bantuan Per Tahun Pelajaran</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Klik tombol <span className="font-bold text-blue-600">"Pilih Tahun"</span> pada baris mana saja untuk langsung menyaring daftar siswa sesuai tahun tersebut.
              </p>
            </div>
            <div className="text-xs text-slate-400 font-medium">
              Total {yearlySummaries.length} Periode Tahun Terdata
            </div>
          </div>

          {/* Tabel Per Tahun */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-3.5 text-center w-12">No</th>
                  <th className="py-3 px-3.5 min-w-[140px]">Tahun Pelajaran</th>
                  <th className="py-3 px-3.5 text-center min-w-[120px]">Jumlah Penerima</th>
                  <th className="py-3 px-3.5 text-right min-w-[150px]">Akumulasi Bantuan (Dana)</th>
                  <th className="py-3 px-3.5 text-right min-w-[130px]">Rata-rata / Siswa</th>
                  <th className="py-3 px-3.5 min-w-[200px]">Rincian Program Bantuan</th>
                  <th className="py-3 px-3.5 text-center min-w-[130px]">Status Pencairan</th>
                  <th className="py-3 px-3.5 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                {yearlySummaries.map((yr, idx) => {
                  const isSelected = yr.tahunPelajaran === selectedTP;
                  const isActive = yr.tahunPelajaran === activeTP;

                  return (
                    <tr 
                      key={yr.tahunPelajaran}
                      className={cn(
                        "transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40",
                        isSelected && "bg-blue-50/50 dark:bg-blue-950/20"
                      )}
                    >
                      {/* No */}
                      <td className="py-3 px-3.5 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Tahun Pelajaran & Badges */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "font-black text-sm",
                            isSelected ? "text-blue-700 dark:text-blue-400" : "text-slate-800 dark:text-slate-200"
                          )}>
                            TP {yr.tahunPelajaran}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {isActive && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              Tahun Aktif
                            </span>
                          )}
                          {isSelected && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 ring-1 ring-blue-400">
                              Sedang Dipilih
                            </span>
                          )}
                          {!isActive && !isSelected && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              Arsip
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Jumlah Penerima */}
                      <td className="py-3 px-3.5 text-center">
                        <div className="text-base font-black text-slate-900 dark:text-slate-100">
                          {yr.totalPenerima} <span className="text-xs font-semibold text-slate-500">Siswa</span>
                        </div>
                        <div className="text-[10px] font-semibold text-slate-400 mt-0.5">
                          <span className="text-blue-600 font-bold">{yr.totalL} L</span> • <span className="text-rose-600 font-bold">{yr.totalP} P</span>
                        </div>
                      </td>

                      {/* Akumulasi Bantuan (Dana) */}
                      <td className="py-3 px-3.5 text-right">
                        <div className="text-sm font-black text-slate-900 dark:text-slate-100">
                          {formatCurrencyIDR(yr.totalNominal)}
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden mt-1 ml-auto max-w-[120px]">
                          <div 
                            className="bg-blue-600 dark:bg-blue-500 h-full rounded-full"
                            style={{ width: `${Math.min(100, yr.persenDariTotalAnggaran)}%` }}
                            title={`${yr.persenDariTotalAnggaran}% dari total seluruh dana`}
                          />
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">
                          {yr.persenDariTotalAnggaran}% dari total anggaran
                        </span>
                      </td>

                      {/* Rata-rata per Siswa */}
                      <td className="py-3 px-3.5 text-right font-bold text-slate-700 dark:text-slate-300">
                        {yr.totalPenerima > 0 ? formatCurrencyIDR(yr.rataRataNominal) : '-'}
                      </td>

                      {/* Rincian Program Bantuan */}
                      <td className="py-3 px-3.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {yr.programBreakdown.pip.count > 0 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800" title={`PIP: ${formatCurrencyIDR(yr.programBreakdown.pip.nominal)}`}>
                              <span>PIP:</span>
                              <span className="font-black">{yr.programBreakdown.pip.count}</span>
                            </span>
                          )}
                          {yr.programBreakdown.baznas.count > 0 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800" title={`Baznas: ${formatCurrencyIDR(yr.programBreakdown.baznas.nominal)}`}>
                              <span>Baznas:</span>
                              <span className="font-black">{yr.programBreakdown.baznas.count}</span>
                            </span>
                          )}
                          {yr.programBreakdown.sekolah.count > 0 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800" title={`Sekolah: ${formatCurrencyIDR(yr.programBreakdown.sekolah.nominal)}`}>
                              <span>Sekolah:</span>
                              <span className="font-black">{yr.programBreakdown.sekolah.count}</span>
                            </span>
                          )}
                          {yr.programBreakdown.desa.count > 0 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-orange-50 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200 dark:border-orange-800" title={`Desa: ${formatCurrencyIDR(yr.programBreakdown.desa.nominal)}`}>
                              <span>Desa:</span>
                              <span className="font-black">{yr.programBreakdown.desa.count}</span>
                            </span>
                          )}
                          {yr.programBreakdown.lainnya.count > 0 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800" title={`Lainnya: ${formatCurrencyIDR(yr.programBreakdown.lainnya.nominal)}`}>
                              <span>Lainnya:</span>
                              <span className="font-black">{yr.programBreakdown.lainnya.count}</span>
                            </span>
                          )}
                          {yr.totalPenerima === 0 && (
                            <span className="text-[10px] text-slate-400 italic">Belum ada penyaluran</span>
                          )}
                        </div>
                      </td>

                      {/* Status Realisasi Pencairan */}
                      <td className="py-3 px-3.5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{formatCurrencyIDR(yr.nominalSudahCair)}</span>
                          </span>
                          {yr.nominalDalamProses > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                              <Clock className="w-2.5 h-2.5 text-amber-500" />
                              <span>{formatCurrencyIDR(yr.nominalDalamProses)} proses</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Aksi Cepat: Filter ke tahun ini */}
                      <td className="py-3 px-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => onSelectTP(yr.tahunPelajaran)}
                          className={cn(
                            "px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer inline-flex items-center gap-1",
                            isSelected
                              ? "bg-blue-600 text-white shadow-2xs hover:bg-blue-700"
                              : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
                          )}
                          title={`Tampilkan daftar siswa penerima bantuan di TP ${yr.tahunPelajaran}`}
                        >
                          <span>{isSelected ? 'Terpilih' : 'Pilih'}</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {/* Total Row Footer */}
                <tr className="bg-slate-50 dark:bg-slate-800/80 font-black text-slate-900 dark:text-slate-100 border-t-2 border-slate-300 dark:border-slate-700">
                  <td colSpan={2} className="py-3.5 px-3.5 text-right uppercase tracking-wider text-xs">
                    Total Akumulasi Seluruh Tahun:
                  </td>
                  <td className="py-3.5 px-3.5 text-center text-sm">
                    {grandStats.allTimeUniqueRecipients} <span className="text-xs font-semibold text-slate-500">Siswa Unik</span>
                  </td>
                  <td className="py-3.5 px-3.5 text-right text-base text-blue-700 dark:text-blue-400">
                    {formatCurrencyIDR(grandStats.allTimeNominal)}
                  </td>
                  <td className="py-3.5 px-3.5 text-right text-xs">
                    {grandStats.allTimeUniqueRecipients > 0 ? formatCurrencyIDR(Math.round(grandStats.allTimeNominal / grandStats.allTimeUniqueRecipients)) : '-'}
                  </td>
                  <td className="py-3.5 px-3.5 text-xs text-slate-500">
                    {grandStats.allTimeAllocationCount} Catatan Bantuan Tersalurkan
                  </td>
                  <td className="py-3.5 px-3.5 text-center text-xs text-emerald-700 dark:text-emerald-400">
                    {formatCurrencyIDR(grandStats.allTimeDisbursed)} Cair
                  </td>
                  <td className="py-3.5 px-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => onSelectTP('ALL')}
                      className="px-2.5 py-1 text-[10.5px] font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Pilih Semua
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. KONTEN TAB: REKAP PER PROGRAM BANTUAN */}
      {/* ========================================================================= */}
      {viewTab === 'program' && (
        <div className="p-5 md:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <PieChart className="w-4 h-4 text-blue-600" />
                <span>Akumulasi Anggaran Berdasarkan Sumber & Program Bantuan</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Rincian akumulasi dana dan jumlah siswa terlayani sepanjang masa serta pada tahun berjalan ({selectedTP === 'ALL' ? 'Semua Tahun' : `TP ${selectedTP}`}).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {programSummaries.map((p) => {
              const Icon = p.icon;
              const isSelectedJenis = activeFilterJenis === p.id;

              return (
                <div 
                  key={p.id}
                  className={cn(
                    "rounded-2xl p-4.5 border transition-all bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between",
                    isSelectedJenis ? "ring-2 ring-blue-500 border-blue-500" : "border-slate-200 dark:border-slate-800"
                  )}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="text-xs font-black text-slate-900 dark:text-slate-100 line-clamp-1">
                            {p.shortTitle}
                          </h5>
                          <span className="text-[10px] text-slate-400 block line-clamp-1">
                            {p.title}
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                        {p.persenDariTotal}% Total
                      </span>
                    </div>

                    {/* Akumulasi Dana All-Time */}
                    <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Akumulasi Dana Sepanjang Waktu
                      </div>
                      <div className="text-xl font-black text-slate-900 dark:text-slate-100">
                        {formatCurrencyIDR(p.allTimeNominal)}
                      </div>
                      <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between pt-1">
                        <span>Total Penerima:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{p.allTimeCount} Siswa</span>
                      </div>
                    </div>

                    {/* Dana Tahun Terpilih */}
                    <div className="mt-2 px-3 py-2 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 flex items-center justify-between text-xs">
                      <span className="text-[11px] font-bold text-blue-900 dark:text-blue-300">
                        {selectedTP === 'ALL' ? 'Semua Tahun' : `TP ${selectedTP}`}:
                      </span>
                      <span className="font-black text-blue-700 dark:text-blue-300">
                        {formatCurrencyIDR(p.selectedTPNominal)} ({p.selectedTPCount} Siswa)
                      </span>
                    </div>
                  </div>

                  {/* Filter Action */}
                  {onFilterJenis && (
                    <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => onFilterJenis(isSelectedJenis ? 'ALL' : p.id)}
                        className={cn(
                          "w-full py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5",
                          isSelectedJenis
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                        )}
                      >
                        <Filter className="w-3 h-3" />
                        <span>{isSelectedJenis ? 'Sedang Difilter (Reset)' : `Filter Siswa ${p.shortTitle}`}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
