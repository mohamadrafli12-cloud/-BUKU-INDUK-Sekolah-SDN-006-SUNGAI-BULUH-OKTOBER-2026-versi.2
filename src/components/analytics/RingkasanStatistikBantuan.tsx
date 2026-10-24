import React from 'react';
import { 
  Users, 
  CreditCard, 
  Landmark, 
  School, 
  MapPin, 
  Sparkles, 
  TrendingUp, 
  Percent, 
  CheckCircle2, 
  UserCheck, 
  UserX,
  PieChart,
  ArrowUpRight,
  Filter,
  Layers,
  Calendar
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface BantuanStatsData {
  totalPenerima: number;
  totalSiswaAktif: number;
  persenDariTotal: number;
  countPIP: number;
  countBaznas: number;
  countSekolah: number;
  countDesa: number;
  countLainnya: number;
  totalL: number;
  totalP: number;
  persenL: number;
  persenP: number;
  kelasCounts: Record<string, { total: number; l: number; p: number }>;
  tahapCounts: Record<string, number>;
}

export interface RingkasanStatistikBantuanProps {
  stats: BantuanStatsData;
  selectedTP: string;
  activeTP: string;
  onFilterJenis?: (jenis: string) => void;
  activeFilterJenis?: string;
  onFilterTahap?: (tahap: string) => void;
  activeFilterTahap?: string;
}

export const RingkasanStatistikBantuan: React.FC<RingkasanStatistikBantuanProps> = ({
  stats,
  selectedTP,
  activeTP,
  onFilterJenis,
  activeFilterJenis = 'ALL',
  onFilterTahap,
  activeFilterTahap = 'ALL',
}) => {
  const totalBukanPenerima = Math.max(0, stats.totalSiswaAktif - stats.totalPenerima);
  const persenBukanPenerima = stats.totalSiswaAktif > 0 
    ? (100 - (stats.totalPenerima / stats.totalSiswaAktif) * 100).toFixed(1)
    : '0.0';
  const persenPenerimaFormatted = stats.totalSiswaAktif > 0
    ? ((stats.totalPenerima / stats.totalSiswaAktif) * 100).toFixed(1)
    : '0.0';

  // Config data for each aid program
  const bantuanCards = [
    {
      id: 'Penerima PIP',
      title: 'Penerima PIP Kemdikbud',
      shortTitle: 'PIP Kemdikbud',
      subtitle: 'Program Indonesia Pintar',
      count: stats.countPIP,
      icon: CreditCard,
      color: 'blue',
      borderClass: 'border-blue-200 dark:border-blue-900/60',
      bgLightClass: 'bg-blue-50/70 dark:bg-blue-950/30',
      badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/80 dark:text-blue-200',
      textClass: 'text-blue-700 dark:text-blue-400',
      barColor: 'bg-blue-600 dark:bg-blue-500',
      desc: 'Bantuan tunai langsung pemerintah pusat',
    },
    {
      id: 'Baznas',
      title: 'Beasiswa Baznas',
      shortTitle: 'Baznas',
      subtitle: 'Badan Amil Zakat Nasional',
      count: stats.countBaznas,
      icon: Landmark,
      color: 'emerald',
      borderClass: 'border-emerald-200 dark:border-emerald-900/60',
      bgLightClass: 'bg-emerald-50/70 dark:bg-emerald-950/30',
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-200',
      textClass: 'text-emerald-700 dark:text-emerald-400',
      barColor: 'bg-emerald-600 dark:bg-emerald-500',
      desc: 'Beasiswa dhuafa & anak asuh daerah',
    },
    {
      id: 'Bantuan Sekolah',
      title: 'Bantuan Internal Sekolah',
      shortTitle: 'Bantuan Sekolah',
      subtitle: 'Keringanan Komite / Seragam',
      count: stats.countSekolah,
      icon: School,
      color: 'indigo',
      borderClass: 'border-indigo-200 dark:border-indigo-900/60',
      bgLightClass: 'bg-indigo-50/70 dark:bg-indigo-950/30',
      badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/80 dark:text-indigo-200',
      textClass: 'text-indigo-700 dark:text-indigo-400',
      barColor: 'bg-indigo-600 dark:bg-indigo-500',
      desc: 'Subsidi internal satuan pendidikan',
    },
    {
      id: 'Bantuan dari desa',
      title: 'Bantuan dari Desa',
      shortTitle: 'Bantuan Desa',
      subtitle: 'Alokasi Dana Desa / BLT',
      count: stats.countDesa,
      icon: MapPin,
      color: 'orange',
      borderClass: 'border-orange-200 dark:border-orange-900/60',
      bgLightClass: 'bg-orange-50/70 dark:bg-orange-950/30',
      badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900/80 dark:text-orange-200',
      textClass: 'text-orange-700 dark:text-orange-400',
      barColor: 'bg-orange-500 dark:bg-orange-400',
      desc: 'Bantuan perlengkapan dari Pemdes',
    },
    {
      id: 'Bantuan Lainnya',
      title: 'Bantuan Lainnya / Kustom',
      shortTitle: 'Bantuan Lainnya',
      subtitle: 'CSR / Donatur / Yayasan',
      count: stats.countLainnya,
      icon: Sparkles,
      color: 'amber',
      borderClass: 'border-amber-200 dark:border-amber-900/60',
      bgLightClass: 'bg-amber-50/70 dark:bg-amber-950/30',
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/80 dark:text-amber-200',
      textClass: 'text-amber-700 dark:text-amber-400',
      barColor: 'bg-amber-500 dark:bg-amber-400',
      desc: 'Mitra industri & yayasan sosial',
    },
  ];

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* 1. HEADER RINGKASAN & OVERVIEW PERSENTASE TERHADAP SISWA AKTIF */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                <PieChart className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                Ringkasan Statistik Penerima Bantuan
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Rasio cakupan bantuan pendidikan terhadap total siswa aktif untuk Tahun Pelajaran{' '}
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {selectedTP === 'ALL' ? 'Semua Tahun' : `TP ${selectedTP}`}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Siswa Aktif
              </span>
              <span className="text-base font-black text-slate-900 dark:text-slate-100">
                {stats.totalSiswaAktif} <span className="text-xs font-normal text-slate-500">Siswa</span>
              </span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-right">
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                Penerima Bantuan
              </span>
              <span className="text-base font-black text-blue-700 dark:text-blue-300">
                {stats.totalPenerima} <span className="text-xs font-semibold text-blue-500">({persenPenerimaFormatted}%)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Visual Progress Bar: Penerima vs Bukan Penerima */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4 font-bold">
              <span className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Penerima Bantuan: {stats.totalPenerima} ({persenPenerimaFormatted}%)</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <UserX className="w-3.5 h-3.5" />
                <span>Bukan Penerima: {totalBukanPenerima} ({persenBukanPenerima}%)</span>
              </span>
            </div>
            <div className="text-[11px] font-medium text-slate-400 hidden sm:block">
              Proporsi Gender: <span className="text-blue-600 font-bold">{stats.totalL} L ({stats.persenL}%)</span> • <span className="text-rose-600 font-bold">{stats.totalP} P ({stats.persenP}%)</span>
            </div>
          </div>

          {/* Bar Segmented */}
          <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-700 rounded-l-full relative group"
              style={{ width: `${Math.min(100, Number(persenPenerimaFormatted))}%` }}
              title={`Penerima Bantuan: ${persenPenerimaFormatted}%`}
            />
            <div 
              className="h-full bg-slate-200 dark:bg-slate-700 transition-all duration-700 rounded-r-full"
              style={{ width: `${Math.max(0, 100 - Number(persenPenerimaFormatted))}%` }}
              title={`Bukan Penerima: ${persenBukanPenerima}%`}
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. JUMLAH TOTAL SISWA PER JENIS BANTUAN & PERSENTASE TERHADAP TOTAL SISWA AKTIF */}
      {/* ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            <span>Rincian Total Siswa per Jenis Bantuan & Persentase Cakupan</span>
          </h4>
          {onFilterJenis && activeFilterJenis !== 'ALL' && (
            <button
              type="button"
              onClick={() => onFilterJenis('ALL')}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>Reset Filter ({activeFilterJenis})</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {bantuanCards.map((b) => {
            const Icon = b.icon;
            // Persentase terhadap total siswa aktif
            const persenSiswaAktif = stats.totalSiswaAktif > 0 
              ? ((b.count / stats.totalSiswaAktif) * 100).toFixed(1)
              : '0.0';
            // Persentase proporsi terhadap total penerima
            const persenPenerima = stats.totalPenerima > 0
              ? Math.round((b.count / stats.totalPenerima) * 100)
              : 0;

            const isSelected = activeFilterJenis === b.id;

            return (
              <div
                key={b.id}
                onClick={() => onFilterJenis && onFilterJenis(isSelected ? 'ALL' : b.id)}
                className={cn(
                  "rounded-2xl p-4 border transition-all duration-200 flex flex-col justify-between cursor-pointer group",
                  "bg-white dark:bg-slate-900 shadow-xs hover:shadow-md hover:-translate-y-0.5",
                  isSelected
                    ? "ring-2 ring-blue-500 border-blue-500 dark:border-blue-500 shadow-md"
                    : b.borderClass
                )}
                role="button"
                tabIndex={0}
                title={`Klik untuk memfilter tabel berdasarkan ${b.title}`}
              >
                <div>
                  {/* Top: Icon & Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0", b.bgLightClass, b.textClass)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0", b.badgeClass)}>
                      {persenSiswaAktif}% Siswa Aktif
                    </span>
                  </div>

                  {/* Title & Desc */}
                  <div className="mt-3">
                    <h5 className="text-xs font-black text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {b.shortTitle}
                    </h5>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {b.subtitle}
                    </p>
                  </div>
                </div>

                {/* Bottom: Count & Progress */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-baseline justify-between">
                    <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                      {b.count}
                      <span className="text-xs font-semibold text-slate-500 ml-1">Siswa</span>
                    </div>
                    <div className="text-[10px] font-semibold text-slate-400 text-right">
                      {persenPenerima}% dari penerima
                    </div>
                  </div>

                  {/* Progress bar per jenis terhadap siswa aktif */}
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-2">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", b.barColor)}
                      style={{ width: `${Math.min(100, Number(persenSiswaAktif))}%` }}
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-slate-400 group-hover:text-blue-600 transition-colors">
                    <span>{isSelected ? 'Sedang difilter' : 'Klik untuk filter'}</span>
                    <Filter className="w-2.5 h-2.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. DISTRIBUSI SEBARAN PER TINGKAT KELAS */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <School className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Distribusi Penerima Bantuan per Tingkat Kelas (Kelas 1 - 6)
            </h4>
          </div>
          <span className="text-[11px] font-bold text-slate-500">
            Total {stats.totalPenerima} Siswa Penerima
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-3">
          {['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'].map((cls) => {
            const data = stats.kelasCounts[cls] || { total: 0, l: 0, p: 0 };
            const pctOfRecipients = stats.totalPenerima > 0
              ? Math.round((data.total / stats.totalPenerima) * 100)
              : 0;

            return (
              <div 
                key={cls}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 text-center space-y-1.5"
              >
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{cls}</div>
                <div className="text-xl font-black text-blue-900 dark:text-blue-300">
                  {data.total} <span className="text-xs font-normal text-slate-500">Siswa</span>
                </div>
                
                {/* Micro progress */}
                <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full" 
                    style={{ width: `${pctOfRecipients}%` }}
                  />
                </div>

                <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 pt-0.5">
                  <span className="text-blue-600 font-bold">{data.l} L</span>
                  <span>•</span>
                  <span className="text-rose-600 font-bold">{data.p} P</span>
                  <span className="text-slate-400 font-mono">({pctOfRecipients}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. DISTRIBUSI PENYALURAN PER TAHAP / TERMIN */}
      {/* ========================================================================= */}
      {Object.keys(stats.tahapCounts || {}).length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Distribusi Penyaluran Bantuan per Termin / Tahap
              </h4>
            </div>
            <div className="flex items-center gap-2">
              {onFilterTahap && activeFilterTahap !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => onFilterTahap('ALL')}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>Reset Filter Tahap ({activeFilterTahap})</span>
                </button>
              )}
              <span className="text-[11px] font-bold text-slate-500">
                Klik kartu termin untuk memfilter
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-3">
            {Object.entries(stats.tahapCounts).map(([tahapName, rawCount]) => {
              const count = Number(rawCount) || 0;
              const pct = stats.totalPenerima > 0
                ? Math.round((count / stats.totalPenerima) * 100)
                : 0;
              const isSelected = activeFilterTahap.toLowerCase() === tahapName.toLowerCase();

              return (
                <div
                  key={tahapName}
                  onClick={() => onFilterTahap && onFilterTahap(isSelected ? 'ALL' : tahapName)}
                  className={cn(
                    "p-3 rounded-xl border transition-all cursor-pointer text-center group",
                    isSelected
                      ? "bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-400 shadow-sm"
                      : "bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700"
                  )}
                  role="button"
                  tabIndex={0}
                  title={`Klik untuk memfilter penerima ${tahapName}`}
                >
                  <span className={cn(
                    "text-xs font-bold block truncate transition-colors",
                    isSelected ? "text-indigo-700 dark:text-indigo-300" : "text-slate-700 dark:text-slate-300 group-hover:text-indigo-600"
                  )}>
                    {tahapName}
                  </span>
                  <div className="text-xl font-black text-slate-900 dark:text-slate-100 my-1">
                    {count} <span className="text-xs font-normal text-slate-500">Siswa</span>
                  </div>
                  <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                    {pct}% dari penerima
                  </div>
                  <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1.5">
                    <div 
                      className="h-full bg-indigo-600 rounded-full" 
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
