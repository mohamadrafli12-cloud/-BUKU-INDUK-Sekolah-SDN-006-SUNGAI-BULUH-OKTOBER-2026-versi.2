import React, { useState, useMemo } from 'react';
import { 
  HandCoins, 
  Search, 
  Filter, 
  Printer, 
  Download, 
  Plus, 
  User, 
  Building2, 
  Users, 
  CreditCard, 
  Landmark, 
  School, 
  MapPin, 
  Sparkles, 
  Calendar, 
  CheckCircle2, 
  Edit3, 
  Eye, 
  ArrowUpDown, 
  X, 
  FileSpreadsheet, 
  ShieldCheck, 
  Percent, 
  ChevronRight,
  TrendingUp,
  HelpCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useSchool } from '../../context/SchoolContext';
import { Student, Gender, JenisBantuan } from '../../types';
import { cn, formatIndonesianDate } from '../../lib/utils';
import { KopSuratHeader } from '../layout/KopSuratHeader';

interface PenerimaBantuanViewProps {
  onEditStudent: (student: Student, initialTab?: 'pribadi' | 'alamat' | 'ortu' | 'kesehatan' | 'masuk' | 'bantuan') => void;
  onSelectDetail: (studentId: string) => void;
  onBack: () => void;
  setActiveTab?: (tab: any) => void;
}

export const PenerimaBantuanView: React.FC<PenerimaBantuanViewProps> = ({
  onEditStudent,
  onSelectDetail,
  onBack,
  setActiveTab,
}) => {
  const { students, schoolProfile, updateStudent, logActivity } = useSchool();
  const activeTP = schoolProfile?.tahunPelajaranAktif || '2026/2027';

  // Filters state
  const [selectedTP, setSelectedTP] = useState<string>(activeTP);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterJenis, setFilterJenis] = useState<string>('ALL');
  const [filterKelas, setFilterKelas] = useState<string>('ALL');
  const [filterGender, setFilterGender] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'nama' | 'kelas' | 'jenis'>('nama');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modals state
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Quick Add Form state
  const [quickStudentId, setQuickStudentId] = useState<string>('');
  const [quickJenisList, setQuickJenisList] = useState<string[]>(['Penerima PIP']);
  const [quickBantuanLainnya, setQuickBantuanLainnya] = useState<string>('');
  const [quickTahunBantuan, setQuickTahunBantuan] = useState<string>(activeTP);
  const [quickNominal, setQuickNominal] = useState<string>('Rp 450.000 / tahun');
  const [quickKeterangan, setQuickKeterangan] = useState<string>('');

  // Helper function to check if student is a recipient
  const isBantuanRecipient = (s: Student): boolean => {
    const hasExplicitBantuan = Boolean(
      (s.penerimaBantuan && s.penerimaBantuan !== 'Tidak' && s.penerimaBantuan !== 'Bukan Penerima' && s.penerimaBantuan.trim() !== '') ||
      (s.jenisBantuanList && s.jenisBantuanList.length > 0)
    );
    return hasExplicitBantuan;
  };

  // Helper to extract student's aid types array
  const getStudentBantuanTypes = (s: Student): string[] => {
    if (s.jenisBantuanList && s.jenisBantuanList.length > 0) {
      return s.jenisBantuanList;
    }
    if (s.penerimaBantuan && s.penerimaBantuan !== 'Tidak' && s.penerimaBantuan !== 'Bukan Penerima') {
      return s.penerimaBantuan.split(',').map(x => x.trim()).filter(Boolean);
    }
    return [];
  };

  // Helper to get academic year of assistance
  const getBantuanYear = (s: Student): string => {
    return s.tahunBantuan || (s.tahunPelajaranKelasSekarang || activeTP);
  };

  // Active students scope (students currently active in school)
  const activeStudentsInSchool = useMemo(() => {
    return students.filter(s => s.status === 'Aktif' || !s.status);
  }, [students]);

  // All assistance recipients filtered by Academic Year
  const recipientsInSelectedTP = useMemo(() => {
    return students.filter(s => {
      if (!isBantuanRecipient(s)) return false;
      const bYear = getBantuanYear(s);
      if (selectedTP === 'ALL') return true;
      return bYear === selectedTP || (s.status === 'Aktif' && bYear === activeTP);
    });
  }, [students, selectedTP, activeTP]);

  // Filtered & Sorted Recipients for Table Display
  const filteredRecipients = useMemo(() => {
    return recipientsInSelectedTP.filter(s => {
      // Search filter
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = q === '' ||
        s.namaLengkap.toLowerCase().includes(q) ||
        s.noInduk.toLowerCase().includes(q) ||
        s.nisn.toLowerCase().includes(q) ||
        (s.bantuanLainnya && s.bantuanLainnya.toLowerCase().includes(q)) ||
        (s.keteranganBantuan && s.keteranganBantuan.toLowerCase().includes(q));

      // Jenis Bantuan filter
      const types = getStudentBantuanTypes(s);
      let matchJenis = true;
      if (filterJenis !== 'ALL') {
        if (filterJenis === 'Bantuan Lainnya') {
          matchJenis = types.includes('Bantuan Lainnya') || Boolean(s.bantuanLainnya);
        } else {
          matchJenis = types.includes(filterJenis);
        }
      }

      // Kelas filter
      const matchKelas = filterKelas === 'ALL' || s.kelasSekarang === filterKelas;

      // Gender filter
      const matchGender = filterGender === 'ALL' || s.jenisKelamin === filterGender;

      return matchSearch && matchJenis && matchKelas && matchGender;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'nama') {
        comparison = a.namaLengkap.localeCompare(b.namaLengkap);
      } else if (sortBy === 'kelas') {
        comparison = (a.kelasSekarang || '').localeCompare(b.kelasSekarang || '');
      } else if (sortBy === 'jenis') {
        const typeA = getStudentBantuanTypes(a).join(', ');
        const typeB = getStudentBantuanTypes(b).join(', ');
        comparison = typeA.localeCompare(typeB);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [recipientsInSelectedTP, searchQuery, filterJenis, filterKelas, filterGender, sortBy, sortOrder]);

  // =========================================================================
  // STATISTIK PERHITUNGAN BANTUAN (Sesuai instruksi: "buatkan statik nya")
  // =========================================================================
  const stats = useMemo(() => {
    const totalPenerima = recipientsInSelectedTP.length;
    const totalSiswaAktif = activeStudentsInSchool.length;
    const persenDariTotal = totalSiswaAktif > 0 ? Math.round((totalPenerima / totalSiswaAktif) * 100) : 0;

    let countPIP = 0;
    let countBaznas = 0;
    let countSekolah = 0;
    let countDesa = 0;
    let countLainnya = 0;

    let totalL = 0;
    let totalP = 0;

    const kelasCounts: Record<string, { total: number; l: number; p: number }> = {
      'Kelas 1': { total: 0, l: 0, p: 0 },
      'Kelas 2': { total: 0, l: 0, p: 0 },
      'Kelas 3': { total: 0, l: 0, p: 0 },
      'Kelas 4': { total: 0, l: 0, p: 0 },
      'Kelas 5': { total: 0, l: 0, p: 0 },
      'Kelas 6': { total: 0, l: 0, p: 0 },
    };

    recipientsInSelectedTP.forEach(s => {
      const types = getStudentBantuanTypes(s);
      if (types.includes('Penerima PIP')) countPIP++;
      if (types.includes('Baznas')) countBaznas++;
      if (types.includes('Bantuan Sekolah')) countSekolah++;
      if (types.includes('Bantuan dari desa')) countDesa++;
      if (types.includes('Bantuan Lainnya') || s.bantuanLainnya) countLainnya++;

      if (s.jenisKelamin === 'L') totalL++;
      else if (s.jenisKelamin === 'P') totalP++;

      const k = s.kelasSekarang || 'Kelas 1';
      const cleanK = k.split(' ')[0] + ' ' + (k.split(' ')[1] || '1');
      if (kelasCounts[cleanK]) {
        kelasCounts[cleanK].total++;
        if (s.jenisKelamin === 'L') kelasCounts[cleanK].l++;
        else kelasCounts[cleanK].p++;
      }
    });

    return {
      totalPenerima,
      totalSiswaAktif,
      persenDariTotal,
      countPIP,
      countBaznas,
      countSekolah,
      countDesa,
      countLainnya,
      totalL,
      totalP,
      persenL: totalPenerima > 0 ? Math.round((totalL / totalPenerima) * 100) : 0,
      persenP: totalPenerima > 0 ? Math.round((totalP / totalPenerima) * 100) : 0,
      kelasCounts,
    };
  }, [recipientsInSelectedTP, activeStudentsInSchool]);

  // Handler: Submit Quick Add Assistance
  const handleSaveQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickStudentId) {
      alert('Pilih siswa aktif terlebih dahulu.');
      return;
    }
    if (quickJenisList.length === 0) {
      alert('Pilih minimal satu jenis bantuan.');
      return;
    }

    const targetStudent = students.find(s => s.id === quickStudentId);
    if (!targetStudent) return;

    updateStudent(quickStudentId, {
      penerimaBantuan: quickJenisList.join(', '),
      jenisBantuanList: quickJenisList,
      bantuanLainnya: quickJenisList.includes('Bantuan Lainnya') ? quickBantuanLainnya : '',
      tahunBantuan: quickTahunBantuan,
      nominalBantuan: quickNominal,
      keteranganBantuan: quickKeterangan,
    });

    logActivity('EDIT', `Menetapkan status penerima bantuan untuk ${targetStudent.namaLengkap} (${quickJenisList.join(', ')})`);
    setIsQuickAddOpen(false);
    setQuickStudentId('');
    setQuickBantuanLainnya('');
    setQuickKeterangan('');
  };

  // Handler: Export to Excel (.xlsx)
  const handleExportExcel = () => {
    try {
      const dataRows = filteredRecipients.map((s, idx) => ({
        'No': idx + 1,
        'Nama Lengkap Siswa': s.namaLengkap,
        'NIS': s.noInduk,
        'NISN': s.nisn,
        'Jenis Kelamin': s.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan',
        'Kelas Saat Ini': s.kelasSekarang,
        'Program / Jenis Bantuan': getStudentBantuanTypes(s).join(', '),
        'Rincian / Bantuan Lainnya': s.bantuanLainnya || '-',
        'Tahun Pelajaran': getBantuanYear(s),
        'Nominal Bantuan': s.nominalBantuan || '-',
        'Keterangan / No. SK': s.keteranganBantuan || '-',
      }));

      const summaryRows = [
        { 'Kategori': 'Tahun Pelajaran Acuan', 'Jumlah': selectedTP === 'ALL' ? 'Semua Tahun' : selectedTP },
        { 'Kategori': 'Total Siswa Penerima Bantuan', 'Jumlah': stats.totalPenerima },
        { 'Kategori': 'Total Siswa Aktif Sekolah', 'Jumlah': stats.totalSiswaAktif },
        { 'Kategori': 'Persentase Penerima', 'Jumlah': `${stats.persenDariTotal}%` },
        { 'Kategori': 'Penerima PIP Kemdikbud', 'Jumlah': stats.countPIP },
        { 'Kategori': 'Penerima Baznas', 'Jumlah': stats.countBaznas },
        { 'Kategori': 'Penerima Bantuan Sekolah', 'Jumlah': stats.countSekolah },
        { 'Kategori': 'Penerima Bantuan dari Desa', 'Jumlah': stats.countDesa },
        { 'Kategori': 'Penerima Bantuan Lainnya', 'Jumlah': stats.countLainnya },
        { 'Kategori': 'Laki-laki', 'Jumlah': stats.totalL },
        { 'Kategori': 'Perempuan', 'Jumlah': stats.totalP },
      ];

      const wb = XLSX.utils.book_new();
      const wsData = XLSX.utils.json_to_sheet(dataRows);
      const wsSummary = XLSX.utils.json_to_sheet(summaryRows);

      XLSX.utils.book_append_sheet(wb, wsData, 'Daftar Penerima Bantuan');
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Statistik');

      const fileName = `Rekap_Penerima_Bantuan_TP_${selectedTP.replace('/', '_')}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (err) {
      console.error('Failed to export excel:', err);
      alert('Gagal mengekspor data ke Excel.');
    }
  };

  // Badge Color helper
  const renderJenisBadge = (jenis: string, customName?: string) => {
    switch (jenis) {
      case 'Penerima PIP':
        return (
          <span key={jenis} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <CreditCard className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            <span>PIP Kemdikbud</span>
          </span>
        );
      case 'Baznas':
        return (
          <span key={jenis} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Landmark className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Baznas</span>
          </span>
        );
      case 'Bantuan Sekolah':
        return (
          <span key={jenis} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <School className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
            <span>Bantuan Sekolah</span>
          </span>
        );
      case 'Bantuan dari desa':
        return (
          <span key={jenis} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
            <MapPin className="w-3 h-3 text-orange-600 dark:text-orange-400" />
            <span>Bantuan Desa</span>
          </span>
        );
      case 'Bantuan Lainnya':
        return (
          <span key={jenis} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span>{customName || 'Bantuan Lainnya'}</span>
          </span>
        );
      default:
        return (
          <span key={jenis} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
            <span>{jenis}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150">
      {/* ========================================================================= */}
      {/* 1. HEADER UTAMA & KONTROL TAHUN PELAJARAN */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-[#003399] dark:bg-blue-950 dark:text-blue-300 text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1">
              <HandCoins className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Modul Kesejahteraan & Bantuan Siswa</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[11px] font-extrabold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Tahun Pelajaran Aktif: {activeTP}</span>
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Data Siswa Penerima Bantuan</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Monitoring data dan rekapitulasi siswa penerima bantuan (Program Indonesia Pintar, Baznas, Bantuan Sekolah, Bantuan dari Desa, dan Bantuan Lainnya).
          </p>
        </div>

        {/* Toolbar Kontrol: Pemilih Tahun Pelajaran, Tambah, Export, Cetak */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Selector Tahun Pelajaran */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-300 dark:border-slate-700">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 ml-2" />
            <select
              value={selectedTP}
              onChange={(e) => setSelectedTP(e.target.value)}
              className="bg-transparent text-xs font-black text-slate-800 dark:text-slate-100 py-1.5 pr-2 focus:outline-hidden cursor-pointer"
            >
              <option value={activeTP}>TP {activeTP} (Tahun Aktif)</option>
              {(schoolProfile?.daftarTahunPelajaran || ['2023/2024', '2024/2025', '2025/2026', '2026/2027', '2027/2028'])
                .filter(tp => tp !== activeTP)
                .map(tp => (
                  <option key={tp} value={tp}>TP {tp}</option>
                ))}
              <option value="ALL">Semua Tahun Pelajaran</option>
            </select>
          </div>

          {/* Tombol Cetak Rekap */}
          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-blue-600" />
            <span>Cetak Rekap</span>
          </button>

          {/* Tombol Ekspor Excel */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            title="Unduh format spreadsheet Excel data penerima bantuan"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-300" />
            <span>Ekspor Excel</span>
          </button>

          {/* Tombol Quick Tambah Bantuan */}
          <button
            type="button"
            onClick={() => setIsQuickAddOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#003399] hover:bg-[#002266] text-white text-xs font-extrabold rounded-xl transition-all shadow-md cursor-pointer hover:scale-[1.02] active:scale-95"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>Atur Penerima</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. STATISTIK LENGKAP PENERIMA BANTUAN ("buatkan statik nya") */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span>Statistik Rekapitulasi Bantuan TP {selectedTP === 'ALL' ? 'Semua Tahun' : selectedTP}</span>
          </h3>
          <span className="text-[11px] font-bold text-slate-500">
            {stats.totalPenerima} dari {stats.totalSiswaAktif} Siswa Aktif ({stats.persenDariTotal}%)
          </span>
        </div>

        {/* Kartu Ringkasan Statistik */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Card 1: Total Penerima */}
          <div className="bg-gradient-to-br from-blue-600 to-[#002b80] rounded-2xl p-4 text-white shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider">Total Penerima</span>
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-amber-300">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black">{stats.totalPenerima}</div>
              <div className="text-[10px] text-blue-200 mt-0.5">
                {stats.persenDariTotal}% dari total siswa
              </div>
            </div>
          </div>

          {/* Card 2: PIP Kemdikbud */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-blue-200 dark:border-blue-900/60 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">Penerima PIP</span>
              <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{stats.countPIP}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Program Indonesia Pintar
              </div>
            </div>
          </div>

          {/* Card 3: Baznas */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-900/60 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Baznas</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Landmark className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{stats.countBaznas}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Badan Amil Zakat Nasional
              </div>
            </div>
          </div>

          {/* Card 4: Bantuan Sekolah */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-indigo-200 dark:border-indigo-900/60 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">Bantuan Sekolah</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <School className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{stats.countSekolah}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Subsidi Komite / Sekolah
              </div>
            </div>
          </div>

          {/* Card 5: Bantuan dari Desa */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-orange-200 dark:border-orange-900/60 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-orange-700 dark:text-orange-300 uppercase tracking-wider">Bantuan Desa</span>
              <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-950 flex items-center justify-center text-orange-600 dark:text-orange-400">
                <MapPin className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{stats.countDesa}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Alokasi Dana Desa / BLT
              </div>
            </div>
          </div>

          {/* Card 6: Bantuan Lainnya */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-amber-200 dark:border-amber-900/60 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">Bantuan Lainnya</span>
              <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{stats.countLainnya}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                CSR / Yayasan / Donatur
              </div>
            </div>
          </div>
        </div>

        {/* Visual Bar Breakdown: Program & Per-Tingkat Kelas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Box 1: Sebaran Program Bantuan */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <HandCoins className="w-4 h-4 text-blue-600" />
                <span>Proporsi Jenis Program Bantuan</span>
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                Rasio Gender: {stats.totalL} L ({stats.persenL}%) / {stats.totalP} P ({stats.persenP}%)
              </span>
            </div>

            <div className="space-y-2.5 pt-1">
              {[
                { name: 'Penerima PIP', count: stats.countPIP, color: 'bg-blue-600', textColor: 'text-blue-700 dark:text-blue-300' },
                { name: 'Baznas', count: stats.countBaznas, color: 'bg-emerald-600', textColor: 'text-emerald-700 dark:text-emerald-300' },
                { name: 'Bantuan Sekolah', count: stats.countSekolah, color: 'bg-indigo-600', textColor: 'text-indigo-700 dark:text-indigo-300' },
                { name: 'Bantuan dari desa', count: stats.countDesa, color: 'bg-orange-500', textColor: 'text-orange-700 dark:text-orange-300' },
                { name: 'Bantuan Lainnya', count: stats.countLainnya, color: 'bg-amber-500', textColor: 'text-amber-700 dark:text-amber-300' },
              ].map(item => {
                const pct = stats.totalPenerima > 0 ? Math.round((item.count / stats.totalPenerima) * 100) : 0;
                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className={cn("font-bold", item.textColor)}>{item.name}</span>
                      <span className="font-mono font-bold text-slate-600 dark:text-slate-400">
                        {item.count} siswa <span className="text-slate-400 font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", item.color)}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Box 2: Distribusi Penerima per Tingkat Kelas */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <School className="w-4 h-4 text-blue-600" />
                <span>Distribusi Penerima per Tingkat Kelas</span>
              </span>
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                Kelas 1 s/d Kelas 6
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
              {['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'].map(cls => {
                const data = stats.kelasCounts[cls] || { total: 0, l: 0, p: 0 };
                return (
                  <div key={cls} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1 text-center">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{cls}</div>
                    <div className="text-xl font-black text-blue-900 dark:text-blue-300">{data.total} <span className="text-xs font-normal text-slate-500">Siswa</span></div>
                    <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 pt-0.5">
                      <span className="text-blue-600 font-bold">{data.l} L</span>
                      <span>•</span>
                      <span className="text-rose-600 font-bold">{data.p} P</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. TOOLBAR FILTER & SEARCH */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama siswa penerima bantuan, NIS, NISN, atau nama bantuan..."
              className="w-full pl-9 pr-4 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Jenis Bantuan */}
            <select
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="ALL">Semua Jenis Bantuan</option>
              <option value="Penerima PIP">Penerima PIP</option>
              <option value="Baznas">Baznas</option>
              <option value="Bantuan Sekolah">Bantuan Sekolah</option>
              <option value="Bantuan dari desa">Bantuan dari desa</option>
              <option value="Bantuan Lainnya">Bantuan Lainnya</option>
            </select>

            {/* Filter Kelas */}
            <select
              value={filterKelas}
              onChange={(e) => setFilterKelas(e.target.value)}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="ALL">Semua Kelas</option>
              <option value="Kelas 1">Kelas 1</option>
              <option value="Kelas 2">Kelas 2</option>
              <option value="Kelas 3">Kelas 3</option>
              <option value="Kelas 4">Kelas 4</option>
              <option value="Kelas 5">Kelas 5</option>
              <option value="Kelas 6">Kelas 6</option>
            </select>

            {/* Filter Gender */}
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="ALL">Semua Gender</option>
              <option value="L">Laki-laki (L)</option>
              <option value="P">Perempuan (P)</option>
            </select>

            {/* Reset Filter Button */}
            {(searchQuery || filterJenis !== 'ALL' || filterKelas !== 'ALL' || filterGender !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterJenis('ALL');
                  setFilterKelas('ALL');
                  setFilterGender('ALL');
                }}
                className="px-2.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                title="Reset semua filter"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TABEL DAFTAR SISWA PENERIMA BANTUAN */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Daftar Siswa Penerima Bantuan ({filteredRecipients.length} Siswa)</span>
          </h4>
          <span className="text-[11px] font-bold text-slate-500">
            Tahun Pelajaran: {selectedTP === 'ALL' ? 'Semua Tahun' : selectedTP}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3.5 text-center w-12">No</th>
                <th className="py-3 px-3.5">Nama Lengkap Siswa</th>
                <th className="py-3 px-3.5">NIS / NISN</th>
                <th className="py-3 px-3.5">Kelas</th>
                <th className="py-3 px-3.5">Program Bantuan</th>
                <th className="py-3 px-3.5">Rincian / Bantuan Lainnya</th>
                <th className="py-3 px-3.5">Tahun Pelajaran</th>
                <th className="py-3 px-3.5">Nominal</th>
                <th className="py-3 px-3.5">Keterangan / No. SK</th>
                <th className="py-3 px-3.5 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRecipients.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-500">
                    <HandCoins className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="font-bold text-sm">Tidak ada siswa penerima bantuan yang sesuai kriteria.</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      Siswa dapat didaftarkan sebagai penerima bantuan melalui menu Edit Siswa (Nomor 6) atau gunakan tombol di bawah.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsQuickAddOpen(true)}
                      className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Atur / Tetapkan Penerima Bantuan</span>
                    </button>
                  </td>
                </tr>
              ) : (
                filteredRecipients.map((s, idx) => {
                  const bTypes = getStudentBantuanTypes(s);
                  const bYear = getBantuanYear(s);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-3.5 text-center font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-extrabold text-xs shrink-0 overflow-hidden">
                            {s.fotoUrl ? (
                              <img src={s.fotoUrl} alt={s.namaLengkap} className="w-full h-full object-cover" />
                            ) : (
                              <span>{s.namaLengkap.charAt(0)}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                              <span>{s.namaLengkap}</span>
                              <span className={cn(
                                "text-[9px] font-bold px-1 py-0.2 rounded",
                                s.jenisKelamin === 'L' ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" : "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                              )}>
                                {s.jenisKelamin}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              NIK: {s.nik || '-'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3.5 font-mono text-slate-700 dark:text-slate-300">
                        <div>{s.noInduk}</div>
                        <div className="text-[10.5px] text-slate-400">NISN: {s.nisn}</div>
                      </td>
                      <td className="py-3 px-3.5 font-bold text-blue-700 dark:text-blue-400">
                        {s.kelasSekarang}
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="flex flex-wrap gap-1">
                          {bTypes.map(t => renderJenisBadge(t, s.bantuanLainnya))}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 font-semibold text-slate-800 dark:text-slate-200">
                        {s.bantuanLainnya || '-'}
                      </td>
                      <td className="py-3 px-3.5">
                        <span className={cn(
                          "px-2 py-0.5 rounded-md font-mono font-bold text-[10px]",
                          bYear === activeTP 
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        )}>
                          TP {bYear}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {s.nominalBantuan || '-'}
                      </td>
                      <td className="py-3 px-3.5 text-slate-600 dark:text-slate-400">
                        {s.keteranganBantuan || '-'}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onEditStudent(s, 'bantuan')}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors cursor-pointer"
                            title="Edit Data Bantuan Siswa (Tab 6)"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectDetail(s.id)}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Lihat Profil Detail"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. MODAL QUICK ATUR / TETAPKAN PENERIMA BANTUAN */}
      {/* ========================================================================= */}
      {isQuickAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-[#003399] text-white">
              <div className="flex items-center gap-2">
                <HandCoins className="w-5 h-5 text-amber-300" />
                <h3 className="text-sm font-extrabold uppercase tracking-wider">
                  Tetapkan Status Siswa Penerima Bantuan
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickAddOpen(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickAdd} className="p-5 space-y-4">
              {/* Pilih Siswa */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Pilih Siswa Aktif <span className="text-rose-500">*</span>
                </label>
                <select
                  value={quickStudentId}
                  onChange={(e) => setQuickStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 cursor-pointer"
                  required
                >
                  <option value="">-- Pilih Siswa Aktif --</option>
                  {activeStudentsInSchool
                    .sort((a, b) => a.namaLengkap.localeCompare(b.namaLengkap))
                    .map(s => (
                      <option key={s.id} value={s.id}>
                        {s.namaLengkap} - {s.kelasSekarang} (NIS: {s.noInduk})
                      </option>
                    ))}
                </select>
              </div>

              {/* Pilihan Jenis Bantuan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Pilih Program Bantuan <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    'Penerima PIP',
                    'Baznas',
                    'Bantuan Sekolah',
                    'Bantuan dari desa',
                    'Bantuan Lainnya',
                  ].map(jenis => {
                    const checked = quickJenisList.includes(jenis);
                    return (
                      <label
                        key={jenis}
                        className={cn(
                          "flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-xs font-bold transition-all",
                          checked
                            ? "border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-200"
                            : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setQuickJenisList([...quickJenisList, jenis]);
                            } else {
                              setQuickJenisList(quickJenisList.filter(x => x !== jenis));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                        />
                        <span>{jenis}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Input Bantuan Lainnya jika dicentang */}
              {quickJenisList.includes('Bantuan Lainnya') && (
                <div className="p-3 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 space-y-1">
                  <label className="block text-xs font-bold text-amber-900 dark:text-amber-300">
                    Nama / Jenis Bantuan Lainnya <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={quickBantuanLainnya}
                    onChange={(e) => setQuickBantuanLainnya(e.target.value)}
                    placeholder="Contoh: Beasiswa CSR PT RAPP, Beasiswa Alumni..."
                    className="w-full px-3 py-1.5 text-xs font-bold rounded-md border border-amber-300 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              )}

              {/* Tahun Pelajaran & Nominal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tahun Pelajaran Bantuan
                  </label>
                  <select
                    value={quickTahunBantuan}
                    onChange={(e) => setQuickTahunBantuan(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer"
                  >
                    {(schoolProfile?.daftarTahunPelajaran || ['2023/2024', '2024/2025', '2025/2026', '2026/2027', '2027/2028']).map(tp => (
                      <option key={tp} value={tp}>TP {tp}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nominal / Fasilitas Bantuan
                  </label>
                  <input
                    type="text"
                    value={quickNominal}
                    onChange={(e) => setQuickNominal(e.target.value)}
                    placeholder="Contoh: Rp 450.000 / tahun"
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* Keterangan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Keterangan / No. SK / No. KIP (Opsional)
                </label>
                <input
                  type="text"
                  value={quickKeterangan}
                  onChange={(e) => setQuickKeterangan(e.target.value)}
                  placeholder="Contoh: SK PIP No. 421/2026"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickAddOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black rounded-xl bg-[#003399] hover:bg-[#002266] text-white shadow-md transition-all cursor-pointer"
                >
                  Simpan Status Penerima
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL CETAK REKAP RESMI (PRINT PREVIEW) */}
      {/* ========================================================================= */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl my-auto max-h-[95vh] flex flex-col overflow-hidden text-slate-900">
            {/* Modal Controls Bar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-100 shrink-0 no-print">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-600" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Pratinjau Cetak Rekapitulasi Siswa Penerima Bantuan
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Dokumen</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1 rounded-lg text-slate-500 hover:bg-slate-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Content */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-5 print:p-0 print:overflow-visible">
              {/* Kop Surat Sekolah */}
              <KopSuratHeader schoolProfile={schoolProfile} />

              {/* Judul Dokumen */}
              <div className="text-center space-y-1 border-b pb-3 border-slate-300">
                <h2 className="text-sm md:text-base font-black uppercase tracking-wider underline">
                  DAFTAR REKAPITULASI SISWA PENERIMA BANTUAN PENDIDIKAN
                </h2>
                <p className="text-xs font-bold text-slate-700">
                  TAHUN PELAJARAN: {selectedTP === 'ALL' ? 'SEMUA TAHUN PELAJARAN' : selectedTP}
                </p>
              </div>

              {/* Ringkasan Statistik */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 border border-slate-300 rounded-lg">
                  <span className="text-[10px] text-slate-500 block">Total Penerima</span>
                  <span className="font-bold text-sm">{stats.totalPenerima} Siswa</span>
                </div>
                <div className="p-2 border border-slate-300 rounded-lg">
                  <span className="text-[10px] text-slate-500 block">Penerima PIP</span>
                  <span className="font-bold text-sm">{stats.countPIP} Siswa</span>
                </div>
                <div className="p-2 border border-slate-300 rounded-lg">
                  <span className="text-[10px] text-slate-500 block">Baznas & Desa</span>
                  <span className="font-bold text-sm">{stats.countBaznas + stats.countDesa} Siswa</span>
                </div>
                <div className="p-2 border border-slate-300 rounded-lg">
                  <span className="text-[10px] text-slate-500 block">Sekolah & Lainnya</span>
                  <span className="font-bold text-sm">{stats.countSekolah + stats.countLainnya} Siswa</span>
                </div>
              </div>

              {/* Tabel Resmi Cetak */}
              <table className="w-full text-left text-xs border border-collapse border-slate-400">
                <thead>
                  <tr className="bg-slate-100 font-bold border-b border-slate-400 text-[10.5px]">
                    <th className="p-2 border border-slate-300 text-center w-8">No</th>
                    <th className="p-2 border border-slate-300">Nama Siswa</th>
                    <th className="p-2 border border-slate-300">NIS / NISN</th>
                    <th className="p-2 border border-slate-300 text-center w-12">L/P</th>
                    <th className="p-2 border border-slate-300 text-center">Kelas</th>
                    <th className="p-2 border border-slate-300">Program Bantuan</th>
                    <th className="p-2 border border-slate-300">Rincian Bantuan</th>
                    <th className="p-2 border border-slate-300">Nominal</th>
                    <th className="p-2 border border-slate-300">No. SK / Ket</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecipients.map((s, idx) => (
                    <tr key={s.id} className="border-b border-slate-300 text-[11px]">
                      <td className="p-2 border border-slate-300 text-center font-mono">{idx + 1}</td>
                      <td className="p-2 border border-slate-300 font-bold">{s.namaLengkap}</td>
                      <td className="p-2 border border-slate-300 font-mono text-[10px]">{s.noInduk} / {s.nisn}</td>
                      <td className="p-2 border border-slate-300 text-center font-bold">{s.jenisKelamin}</td>
                      <td className="p-2 border border-slate-300 text-center font-bold">{s.kelasSekarang}</td>
                      <td className="p-2 border border-slate-300 font-bold">{getStudentBantuanTypes(s).join(', ')}</td>
                      <td className="p-2 border border-slate-300">{s.bantuanLainnya || '-'}</td>
                      <td className="p-2 border border-slate-300 font-mono">{s.nominalBantuan || '-'}</td>
                      <td className="p-2 border border-slate-300 text-[10px]">{s.keteranganBantuan || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Tanda Tangan Resmi */}
              <div className="pt-6 flex justify-between text-xs text-slate-800">
                <div className="text-center space-y-14">
                  <p>Mengetahui,<br />Guru BK / Operator Sekolah</p>
                  <div>
                    <p className="font-bold underline">{schoolProfile.namaOperator || 'Rahmat Hidayat, S.Kom.'}</p>
                    <p className="text-[10px]">NIP. {schoolProfile.nipOperator || '19920415 201902 1 008'}</p>
                  </div>
                </div>

                <div className="text-center space-y-14">
                  <p>
                    {schoolProfile.desaKelurahan || 'Sungai Buluh'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br />
                    Kepala Sekolah
                  </p>
                  <div>
                    <p className="font-bold underline">{schoolProfile.namaKepalaSekolah || 'H. MARLISMAN, S.Pd., M.M.'}</p>
                    <p className="text-[10px]">NIP. {schoolProfile.nipKepalaSekolah || '19680512 199103 1 005'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
