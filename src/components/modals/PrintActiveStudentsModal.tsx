import React, { useState, useMemo } from 'react';
import { 
  Printer, 
  X, 
  Settings2, 
  FileText, 
  CheckCircle2, 
  Layers, 
  Table, 
  Filter, 
  Users, 
  Calendar, 
  Eye, 
  RotateCcw,
  Check
} from 'lucide-react';
import { Student, SchoolProfile, StudentStatus } from '../../types';
import { cn, formatIndonesianDate } from '../../lib/utils';
import { KopSuratHeader } from '../layout/KopSuratHeader';
import { getTingkatKelasNumber } from '../views/ActiveStudentsView';
import { useSchool } from '../../context/SchoolContext';

export interface PrintSettingsState {
  // Scope & Data
  scope: 'filtered' | 'all' | 'tingkat' | 'rombel';
  selectedTingkat: string; // '1' - '6'
  selectedRombel: string;
  selectedStatus: string;
  hideEmptyRombel: boolean;
  includeTingkatSummary: boolean;
  includeGenderStats: boolean;

  // Page & Grouping Mode
  groupingMode: 'per-rombel' | 'continuous'; // 'per-rombel' gives page break per rombel

  // Paper & Layout
  paperSize: 'A4' | 'F4' | 'Legal';
  orientation: 'portrait' | 'landscape';
  fontSize: 'xs' | 'sm' | 'base'; // 9pt, 10pt, 11pt

  // Kop Surat & Header
  showKopSurat: boolean;
  customTitle: string;
  customSubtitle: string;

  // Columns to include (for daftar-siswa)
  columns: {
    no: boolean;
    nis: boolean;
    nisn: boolean;
    namaLengkap: boolean;
    jenisKelamin: boolean;
    rombel: boolean;
    tempatTanggalLahir: boolean;
    namaOrangTua: boolean;
    agama: boolean;
    status: boolean;
    kolomParaf: boolean; // Empty signature/attendance cell
    kolomKeterangan: boolean;
  };

  // Signatures & Titimangsa
  showSignatures: boolean;
  titimangsaKota: string;
  titimangsaTanggal: string;
  namaKepalaSekolah: string;
  nipKepalaSekolah: string;
  namaWaliKelas: string;
  nipWaliKelas: string;
  showWaliKelasSignature: boolean;
  showKepalaSekolahSignature: boolean;
}

interface PrintActiveStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'daftar-siswa' | 'rekap-rombel';
  activeTP: string;
  activeSemester: string;
  schoolProfile: SchoolProfile;
  activeStudents: Student[];
  projectedStudents: Array<Student & { isBelumMasukSD?: boolean }>;
  availableClasses: string[];
  rombelStats: Array<{
    kelas: string;
    total: number;
    jmlL: number;
    jmlP: number;
    waliKelas?: string;
    nipWaliKelas?: string;
    persentase?: string;
  }>;
  currentSelectedTingkat?: string;
  currentSelectedRombel?: string;
  currentSelectedStatus?: string;
  onApplySettingsToPrintContainer: (settings: PrintSettingsState) => void;
}

export const PrintActiveStudentsModal: React.FC<PrintActiveStudentsModalProps> = ({
  isOpen,
  onClose,
  mode,
  activeTP,
  activeSemester,
  schoolProfile,
  activeStudents,
  projectedStudents,
  availableClasses,
  rombelStats,
  currentSelectedTingkat = 'ALL',
  currentSelectedRombel = 'ALL',
  currentSelectedStatus = 'ALL',
  onApplySettingsToPrintContainer,
}) => {
  const { adminUsers } = useSchool();

  // Helper to find default wali kelas from adminUsers / teachers
  const findWaliKelasInfo = (targetKelas?: string) => {
    if (!targetKelas || targetKelas === 'ALL') {
      const firstWali = adminUsers.find(u => u.kategoriTugas === 'wali_kelas');
      return {
        nama: firstWali?.nama || 'Wali Kelas / Guru Kelas',
        nip: firstWali?.nip || '-',
      };
    }
    const matched = adminUsers.find(u => 
      u.kategoriTugas === 'wali_kelas' && 
      (u.tingkatKelas === targetKelas || u.jabatan?.includes(targetKelas))
    );
    if (matched) {
      return { nama: matched.nama, nip: matched.nip || '-' };
    }
    const statItem = rombelStats.find(r => r.kelas === targetKelas);
    return {
      nama: statItem?.waliKelas || `Wali Kelas ${targetKelas}`,
      nip: statItem?.nipWaliKelas || '-',
    };
  };

  // Initial State Setup
  const [settings, setSettings] = useState<PrintSettingsState>(() => {
    const defaultWali = findWaliKelasInfo(currentSelectedRombel !== 'ALL' ? currentSelectedRombel : undefined);
    const today = new Date().toISOString().split('T')[0];

    const defaultTitle = mode === 'daftar-siswa'
      ? (currentSelectedRombel !== 'ALL' 
          ? `DAFTAR PESERTA DIDIK ${currentSelectedRombel.toUpperCase()}`
          : currentSelectedTingkat !== 'ALL'
          ? `DAFTAR PESERTA DIDIK TINGKAT KELAS ${currentSelectedTingkat}`
          : 'DAFTAR PESERTA DIDIK AKTIF')
      : 'REKAPITULASI JUMLAH SISWA PER ROMBONGAN BELAJAR';

    const defaultSubtitle = `SEMESTER ${activeSemester.toUpperCase()} TAHUN PELAJARAN ${activeTP}`;

    return {
      scope: (currentSelectedRombel !== 'ALL' || currentSelectedTingkat !== 'ALL' || currentSelectedStatus !== 'ALL')
        ? 'filtered'
        : 'all',
      selectedTingkat: currentSelectedTingkat !== 'ALL' ? currentSelectedTingkat : '1',
      selectedRombel: currentSelectedRombel !== 'ALL' ? currentSelectedRombel : availableClasses[0] || 'Kelas 1',
      selectedStatus: currentSelectedStatus,
      hideEmptyRombel: true,
      includeTingkatSummary: true,
      includeGenderStats: true,

      groupingMode: 'per-rombel', // Default page break per rombel

      paperSize: 'A4',
      orientation: mode === 'rekap-rombel' ? 'landscape' : 'portrait',
      fontSize: 'sm',

      showKopSurat: true,
      customTitle: defaultTitle,
      customSubtitle: defaultSubtitle,

      columns: {
        no: true,
        nis: true,
        nisn: true,
        namaLengkap: true,
        jenisKelamin: true,
        rombel: true,
        tempatTanggalLahir: true,
        namaOrangTua: false,
        agama: false,
        status: true,
        kolomParaf: false,
        kolomKeterangan: false,
      },

      showSignatures: true,
      titimangsaKota: schoolProfile.kabupatenKota || schoolProfile.kecamatan || 'Kuantan Singingi',
      titimangsaTanggal: formatIndonesianDate(today),
      namaKepalaSekolah: schoolProfile.namaKepalaSekolah || 'Kepala Sekolah',
      nipKepalaSekolah: schoolProfile.nipKepalaSekolah || '-',
      namaWaliKelas: defaultWali.nama,
      nipWaliKelas: defaultWali.nip,
      showWaliKelasSignature: true,
      showKepalaSekolahSignature: true,
    };
  });

  // Active Settings Tab in Left Panel
  const [activeSettingsTab, setActiveSettingsTab] = useState<'cakupan' | 'kertas' | 'kolom' | 'ttd'>('cakupan');

  if (!isOpen) return null;

  // Filtered dataset according to print settings
  const filteredStudentsForPrint = useMemo(() => {
    let list = projectedStudents;

    if (mode === 'daftar-siswa') {
      if (settings.scope === 'filtered') {
        if (currentSelectedTingkat !== 'ALL') {
          if (currentSelectedTingkat === 'BELUM_MASUK_SD') {
            list = list.filter(s => s.status === 'Belum Masuk SD');
          } else {
            const targetNum = parseInt(currentSelectedTingkat, 10);
            list = list.filter(s => s.status !== 'Belum Masuk SD' && getTingkatKelasNumber(s.kelasSekarang) === targetNum);
          }
        }
        if (currentSelectedRombel !== 'ALL') {
          list = list.filter(s => s.kelasSekarang === currentSelectedRombel);
        }
        if (currentSelectedStatus !== 'ALL') {
          list = list.filter(s => s.status === currentSelectedStatus);
        }
      } else if (settings.scope === 'tingkat') {
        const targetNum = parseInt(settings.selectedTingkat, 10);
        list = list.filter(s => s.status !== 'Belum Masuk SD' && getTingkatKelasNumber(s.kelasSekarang) === targetNum);
      } else if (settings.scope === 'rombel') {
        list = list.filter(s => s.kelasSekarang === settings.selectedRombel);
      } else {
        // 'all' active students (can still respect active status unless user chose otherwise)
        list = list.filter(s => s.status === 'Aktif' || s.status === 'Belum Masuk SD' || s.status === 'Lulus' || s.status === 'Mutasi Keluar');
      }
    }

    return list;
  }, [projectedStudents, mode, settings.scope, settings.selectedTingkat, settings.selectedRombel, currentSelectedTingkat, currentSelectedRombel, currentSelectedStatus]);

  // Grouped students per Rombel for "Pisah Halaman per Rombel"
  const studentsGroupedByRombel = useMemo(() => {
    const map = new Map<string, Student[]>();
    
    // Sort students by name or NIS
    const sorted = [...filteredStudentsForPrint].sort((a, b) => a.namaLengkap.localeCompare(b.namaLengkap));

    sorted.forEach(s => {
      const cls = s.kelasSekarang || 'Tanpa Kelas';
      if (!map.has(cls)) {
        map.set(cls, []);
      }
      map.get(cls)!.push(s);
    });

    // Return array of { rombel, students } sorted by class name/tingkat
    return Array.from(map.entries())
      .map(([rombel, students]) => ({ rombel, students }))
      .sort((a, b) => {
        const tA = getTingkatKelasNumber(a.rombel);
        const tB = getTingkatKelasNumber(b.rombel);
        if (tA !== tB) return tA - tB;
        return a.rombel.localeCompare(b.rombel, undefined, { numeric: true });
      });
  }, [filteredStudentsForPrint]);

  // Rombel stats filtered for print
  const filteredRombelStatsForPrint = useMemo(() => {
    let list = rombelStats;
    if (settings.hideEmptyRombel) {
      list = list.filter(r => r.total > 0);
    }
    if (settings.scope === 'tingkat') {
      const t = parseInt(settings.selectedTingkat, 10);
      list = list.filter(r => getTingkatKelasNumber(r.kelas) === t);
    } else if (settings.scope === 'filtered' && currentSelectedTingkat !== 'ALL' && currentSelectedTingkat !== 'BELUM_MASUK_SD') {
      const t = parseInt(currentSelectedTingkat, 10);
      list = list.filter(r => getTingkatKelasNumber(r.kelas) === t);
    }
    return list;
  }, [rombelStats, settings.hideEmptyRombel, settings.scope, settings.selectedTingkat, currentSelectedTingkat]);

  // Handle Trigger Print
  const handleExecutePrint = () => {
    // Send configuration to the actual print component container
    onApplySettingsToPrintContainer(settings);

    // Give React a small tick to update DOM, then trigger window.print()
    setTimeout(() => {
      // Unfocus any element so no ring or popover is caught in print preview
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      window.print();
    }, 150);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs no-print print:hidden animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-6xl max-h-[94vh] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#003399] text-white flex items-center justify-center shadow-md">
              <Printer className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>
                  {mode === 'daftar-siswa' 
                    ? 'Pengaturan Cetak Daftar Siswa Aktif' 
                    : 'Pengaturan Cetak Rekapitulasi Rombel'}
                </span>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-[#003399] dark:text-blue-300">
                  TP {activeTP}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Sesuaikan ukuran kertas (A4/F4), kop surat, pilihan kolom data, dan pengesahan tanda tangan resmi sebelum mencetak.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExecutePrint}
              className="flex items-center gap-2 px-4 py-2 bg-[#003399] hover:bg-[#002266] text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer transform active:scale-95"
              title="Kirim ke Printer atau Simpan sebagai PDF"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>Cetak Dokumen Sekarang</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              title="Tutup jendela pengaturan cetak"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL BODY (2 COLUMNS: SETTINGS PANEL & LIVE PREVIEW) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* LEFT COLUMN: PENGATURAN CETAK (Width 5 of 12) */}
          <div className="lg:col-span-5 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden">
            {/* Tabs Selector for Settings */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 pt-2 gap-1 overflow-x-auto scrollbar-none">
              {[
                { id: 'cakupan', label: 'Cakupan & Halaman', icon: Filter },
                { id: 'kertas', label: 'Kertas & Kop', icon: FileText },
                ...(mode === 'daftar-siswa' ? [{ id: 'kolom', label: 'Kolom Data', icon: Table }] : []),
                { id: 'ttd', label: 'Tanda Tangan', icon: CheckCircle2 },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeSettingsTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveSettingsTab(tab.id as any)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer whitespace-nowrap",
                      isActive
                        ? "bg-slate-100 dark:bg-slate-800 text-[#003399] dark:text-blue-400 border-t-2 border-[#003399] font-extrabold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Settings Tab Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
              {/* TAB 1: CAKUPAN & FORMAT HALAMAN */}
              {activeSettingsTab === 'cakupan' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                      Pilihan Siswa / Data yang Dicetak:
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer hover:border-blue-400 transition-colors">
                        <input
                          type="radio"
                          name="scope"
                          checked={settings.scope === 'filtered'}
                          onChange={() => setSettings({ ...settings, scope: 'filtered' })}
                          className="mt-0.5 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Sesuai Filter Aktif di Tampilan Layar
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Tingkat: <span className="font-bold text-blue-600">{currentSelectedTingkat === 'ALL' ? 'Semua' : currentSelectedTingkat}</span>, 
                            Rombel: <span className="font-bold text-blue-600">{currentSelectedRombel === 'ALL' ? 'Semua' : currentSelectedRombel}</span>, 
                            Status: <span className="font-bold text-blue-600">{currentSelectedStatus === 'ALL' ? 'Semua' : currentSelectedStatus}</span>
                          </p>
                        </div>
                      </label>

                      <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer hover:border-blue-400 transition-colors">
                        <input
                          type="radio"
                          name="scope"
                          checked={settings.scope === 'all'}
                          onChange={() => setSettings({ ...settings, scope: 'all' })}
                          className="mt-0.5 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Semua Siswa Terdaftar ({projectedStudents.length} Siswa)
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Mencetak seluruh siswa aktif Kelas 1 s/d 6 untuk Tahun Ajaran {activeTP}.
                          </p>
                        </div>
                      </label>

                      <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer hover:border-blue-400 transition-colors">
                        <input
                          type="radio"
                          name="scope"
                          checked={settings.scope === 'tingkat'}
                          onChange={() => setSettings({ ...settings, scope: 'tingkat' })}
                          className="mt-0.5 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Cetak Khusus Tingkat Kelas Tertentu
                          </p>
                          {settings.scope === 'tingkat' && (
                            <div className="mt-2 flex items-center gap-2">
                              <select
                                value={settings.selectedTingkat}
                                onChange={(e) => setSettings({ ...settings, selectedTingkat: e.target.value })}
                                className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 cursor-pointer"
                              >
                                {[1, 2, 3, 4, 5, 6].map(t => (
                                  <option key={`opt-t-${t}`} value={String(t)}>
                                    Tingkat {t} (Kelas {t})
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </label>

                      {mode === 'daftar-siswa' && (
                        <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer hover:border-blue-400 transition-colors">
                          <input
                            type="radio"
                            name="scope"
                            checked={settings.scope === 'rombel'}
                            onChange={() => setSettings({ ...settings, scope: 'rombel' })}
                            className="mt-0.5 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              Cetak Khusus Rombel Spesifik
                            </p>
                            {settings.scope === 'rombel' && (
                              <div className="mt-2 flex items-center gap-2">
                                <select
                                  value={settings.selectedRombel}
                                  onChange={(e) => {
                                    const newRombel = e.target.value;
                                    const waliInfo = findWaliKelasInfo(newRombel);
                                    setSettings({ 
                                      ...settings, 
                                      selectedRombel: newRombel,
                                      namaWaliKelas: waliInfo.nama,
                                      nipWaliKelas: waliInfo.nip
                                    });
                                  }}
                                  className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 cursor-pointer"
                                >
                                  {availableClasses.map(cls => (
                                    <option key={cls} value={cls}>{cls}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Mode Pisah Halaman per Rombel (Khusus Daftar Siswa) */}
                  {mode === 'daftar-siswa' && (
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                      <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                        Format Pengelompokan & Halaman:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, groupingMode: 'per-rombel' })}
                          className={cn(
                            "p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between",
                            settings.groupingMode === 'per-rombel'
                              ? "border-[#003399] bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/30"
                              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-black">Pisah per Rombel</span>
                            {settings.groupingMode === 'per-rombel' && <Check className="w-4 h-4 text-[#003399] dark:text-blue-400" />}
                          </div>
                          <p className="text-[10.5px] text-slate-500 leading-tight">
                            Tiap rombel di lembar baru lengkap dengan kop & tanda tangan. (Sangat disarankan)
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSettings({ ...settings, groupingMode: 'continuous' })}
                          className={cn(
                            "p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between",
                            settings.groupingMode === 'continuous'
                              ? "border-[#003399] bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/30"
                              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-black">Satu Dokumen Sambung</span>
                            {settings.groupingMode === 'continuous' && <Check className="w-4 h-4 text-[#003399] dark:text-blue-400" />}
                          </div>
                          <p className="text-[10.5px] text-slate-500 leading-tight">
                            Semua siswa dicetak dalam satu urutan tabel berkelanjutan tanpa jeda per kelas.
                          </p>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Additional Options for Rekap Rombel */}
                  {mode === 'rekap-rombel' && (
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                      <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                        Komponen Rekapitulasi Tambahan:
                      </label>
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.hideEmptyRombel}
                            onChange={(e) => setSettings({ ...settings, hideEmptyRombel: e.target.checked })}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>Sembunyikan Rombel yang 0 / Kosong</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.includeTingkatSummary}
                            onChange={(e) => setSettings({ ...settings, includeTingkatSummary: e.target.checked })}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>Sertakan Tabel Rekapitulasi per Tingkat (1-6)</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.includeGenderStats}
                            onChange={(e) => setSettings({ ...settings, includeGenderStats: e.target.checked })}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>Sertakan Rincian Rasio Gender L/P</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: KERTAS & KOP SURAT */}
              {activeSettingsTab === 'kertas' && (
                <div className="space-y-4">
                  {/* Ukuran Kertas */}
                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                      Ukuran Kertas:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'A4', label: 'A4', sub: '210 × 297 mm' },
                        { id: 'F4', label: 'F4 / Folio', sub: '215 × 330 mm' },
                        { id: 'Legal', label: 'Legal', sub: '216 × 356 mm' },
                      ].map(paper => (
                        <button
                          key={paper.id}
                          type="button"
                          onClick={() => setSettings({ ...settings, paperSize: paper.id as any })}
                          className={cn(
                            "p-2.5 rounded-xl border text-center transition-all cursor-pointer",
                            settings.paperSize === paper.id
                              ? "border-[#003399] bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-black shadow-xs ring-2 ring-blue-500/20"
                              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          )}
                        >
                          <div className="text-xs font-extrabold">{paper.label}</div>
                          <div className="text-[10px] text-slate-500">{paper.sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Orientasi Kertas */}
                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                      Orientasi Halaman:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, orientation: 'portrait' })}
                        className={cn(
                          "p-2.5 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-2",
                          settings.orientation === 'portrait'
                            ? "border-[#003399] bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-black shadow-xs"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        )}
                      >
                        <div className="w-3.5 h-5 border-2 border-current rounded-xs" />
                        <span className="text-xs font-bold">Portrait (Tegak)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, orientation: 'landscape' })}
                        className={cn(
                          "p-2.5 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-2",
                          settings.orientation === 'landscape'
                            ? "border-[#003399] bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-black shadow-xs"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        )}
                      >
                        <div className="w-5 h-3.5 border-2 border-current rounded-xs" />
                        <span className="text-xs font-bold">Landscape (Mendatar)</span>
                      </button>
                    </div>
                  </div>

                  {/* Ukuran Font Dokumen */}
                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                      Kerapatan & Ukuran Teks Tabel:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'xs', label: 'Padat (9pt)' },
                        { id: 'sm', label: 'Standar (10pt)' },
                        { id: 'base', label: 'Besar (11pt)' },
                      ].map(f => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setSettings({ ...settings, fontSize: f.id as any })}
                          className={cn(
                            "py-2 px-1 text-center rounded-xl border text-xs font-bold transition-all cursor-pointer",
                            settings.fontSize === f.id
                              ? "border-[#003399] bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-black"
                              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          )}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Kop Surat Sekolah */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                    <label className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.showKopSurat}
                        onChange={(e) => setSettings({ ...settings, showKopSurat: e.target.checked })}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Tampilkan Kop Surat Resmi Sekolah</span>
                    </label>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Judul Dokumen yang Dicetak:
                      </label>
                      <input
                        type="text"
                        value={settings.customTitle}
                        onChange={(e) => setSettings({ ...settings, customTitle: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                        placeholder="Contoh: DAFTAR PESERTA DIDIK KELAS 1"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Sub-Judul Dokumen:
                      </label>
                      <input
                        type="text"
                        value={settings.customSubtitle}
                        onChange={(e) => setSettings({ ...settings, customSubtitle: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                        placeholder="Contoh: TAHUN PELAJARAN 2025/2026"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PILIHAN KOLOM DATA (Khusus Daftar Siswa) */}
              {activeSettingsTab === 'kolom' && mode === 'daftar-siswa' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
                    <p className="text-xs font-black text-slate-700 dark:text-slate-300">
                      Pilih Kolom Data Siswa:
                    </p>
                    <button
                      type="button"
                      onClick={() => setSettings({
                        ...settings,
                        columns: {
                          no: true,
                          nis: true,
                          nisn: true,
                          namaLengkap: true,
                          jenisKelamin: true,
                          rombel: true,
                          tempatTanggalLahir: true,
                          namaOrangTua: true,
                          agama: true,
                          status: true,
                          kolomParaf: false,
                          kolomKeterangan: true,
                        }
                      })}
                      className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      Pilih Semua
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      { key: 'nis', label: 'NIS (Nomor Induk Siswa)', desc: 'Nomor induk lokal sekolah' },
                      { key: 'nisn', label: 'NISN (Nomor Induk Siswa Nasional)', desc: 'Nomor resmi dari Kemdikbud' },
                      { key: 'namaLengkap', label: 'Nama Lengkap Siswa', desc: 'Sesuai akta kelahiran' },
                      { key: 'jenisKelamin', label: 'Jenis Kelamin (L/P)', desc: 'Laki-laki / Perempuan' },
                      { key: 'rombel', label: 'Rombongan Belajar (Kelas)', desc: 'Kelas yang ditempati saat ini' },
                      { key: 'tempatTanggalLahir', label: 'Tempat & Tanggal Lahir', desc: 'Format: Kota, DD MMMM YYYY' },
                      { key: 'namaOrangTua', label: 'Nama Orang Tua / Ayah', desc: 'Identitas ayah/wali siswa' },
                      { key: 'agama', label: 'Agama', desc: 'Agama siswa yang terdaftar' },
                      { key: 'status', label: 'Status Siswa di Buku Induk', desc: 'Aktif, Lulus, Mutasi, dll.' },
                      { key: 'kolomParaf', label: 'Kolom Kosong Tanda Tangan / Absensi Siswa', desc: 'Kotak kosong untuk paraf / daftar hadir' },
                      { key: 'kolomKeterangan', label: 'Kolom Keterangan Tambahan', desc: 'Catatan manual guru' },
                    ].map(col => (
                      <label 
                        key={col.key}
                        className="flex items-start gap-2.5 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-400"
                      >
                        <input
                          type="checkbox"
                          checked={(settings.columns as any)[col.key]}
                          onChange={(e) => setSettings({
                            ...settings,
                            columns: {
                              ...settings.columns,
                              [col.key]: e.target.checked
                            }
                          })}
                          className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{col.label}</p>
                          <p className="text-[10.5px] text-slate-500">{col.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: TANDA TANGAN & PENGESAHAN */}
              {activeSettingsTab === 'ttd' && (
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.showSignatures}
                      onChange={(e) => setSettings({ ...settings, showSignatures: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Sertakan Kolom Pengesahan & Tanda Tangan Resmi</span>
                  </label>

                  {settings.showSignatures && (
                    <div className="space-y-3 pt-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                            Kota Titimangsa:
                          </label>
                          <input
                            type="text"
                            value={settings.titimangsaKota}
                            onChange={(e) => setSettings({ ...settings, titimangsaKota: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                            Tanggal Dokumen:
                          </label>
                          <input
                            type="text"
                            value={settings.titimangsaTanggal}
                            onChange={(e) => setSettings({ ...settings, titimangsaTanggal: e.target.value })}
                            className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                          />
                        </div>
                      </div>

                      <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.showWaliKelasSignature}
                            onChange={(e) => setSettings({ ...settings, showWaliKelasSignature: e.target.checked })}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>Tanda Tangan Pihak Pertama (Wali Kelas / Operator)</span>
                        </label>
                        {settings.showWaliKelasSignature && (
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <input
                              type="text"
                              value={settings.namaWaliKelas}
                              onChange={(e) => setSettings({ ...settings, namaWaliKelas: e.target.value })}
                              placeholder="Nama Wali Kelas"
                              className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700"
                            />
                            <input
                              type="text"
                              value={settings.nipWaliKelas}
                              onChange={(e) => setSettings({ ...settings, nipWaliKelas: e.target.value })}
                              placeholder="NIP Wali Kelas"
                              className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700"
                            />
                          </div>
                        )}
                      </div>

                      <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.showKepalaSekolahSignature}
                            onChange={(e) => setSettings({ ...settings, showKepalaSekolahSignature: e.target.checked })}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>Tanda Tangan Mengetahui Kepala Sekolah</span>
                        </label>
                        {settings.showKepalaSekolahSignature && (
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <input
                              type="text"
                              value={settings.namaKepalaSekolah}
                              onChange={(e) => setSettings({ ...settings, namaKepalaSekolah: e.target.value })}
                              placeholder="Nama Kepala Sekolah"
                              className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700"
                            />
                            <input
                              type="text"
                              value={settings.nipKepalaSekolah}
                              onChange={(e) => setSettings({ ...settings, nipKepalaSekolah: e.target.value })}
                              placeholder="NIP Kepala Sekolah"
                              className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Left Column Footer Info */}
            <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs flex items-center justify-between text-slate-500">
              <span className="font-bold">
                {mode === 'daftar-siswa' 
                  ? `${filteredStudentsForPrint.length} Siswa Terpilih (${studentsGroupedByRombel.length} Rombel)`
                  : `${filteredRombelStatsForPrint.length} Rombel Terpilih`}
              </span>
              <button
                type="button"
                onClick={() => {
                  // Reset to default
                  setSettings(prev => ({
                    ...prev,
                    groupingMode: 'per-rombel',
                    paperSize: 'A4',
                    orientation: mode === 'rekap-rombel' ? 'landscape' : 'portrait',
                    showKopSurat: true,
                    showSignatures: true,
                  }));
                }}
                className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: PRATINJAU DOKUMEN CETAK (Width 7 of 12) */}
          <div className="lg:col-span-7 bg-slate-200 dark:bg-slate-950 p-4 sm:p-6 overflow-y-auto flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-3 text-xs font-bold text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-blue-600" />
                <span>Pratinjau Lembar Dokumen ({settings.paperSize} • {settings.orientation.toUpperCase()})</span>
              </span>
              <span className="text-[11px] text-slate-500">
                Tampilan persis dengan hasil cetak
              </span>
            </div>

            {/* PAPER SIMULATION CONTAINER */}
            <div 
              className={cn(
                "bg-white text-black shadow-2xl border border-slate-300 p-6 sm:p-8 rounded-sm transition-all w-full",
                settings.orientation === 'landscape' ? "max-w-4xl" : "max-w-2xl",
                settings.fontSize === 'xs' ? 'text-[9.5px]' : settings.fontSize === 'sm' ? 'text-[10.5px]' : 'text-[11.5px]'
              )}
              style={{
                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                minHeight: '600px',
              }}
            >
              {/* RENDER PREVIEW: MODE DAFTAR SISWA */}
              {mode === 'daftar-siswa' && (
                settings.groupingMode === 'per-rombel' ? (
                  // Grouped by Rombel (Showing first 2 rombels in preview to keep it fast)
                  <div className="space-y-8">
                    {studentsGroupedByRombel.slice(0, 3).map((group, gIdx) => (
                      <div key={group.rombel} className={cn("space-y-4", gIdx > 0 && "pt-6 border-t-2 border-dashed border-slate-300")}>
                        {/* Kop Surat */}
                        {settings.showKopSurat && (
                          <KopSuratHeader schoolProfile={schoolProfile} />
                        )}

                        {/* Title */}
                        <div className="text-center mb-4">
                          <h3 className="font-black text-sm uppercase tracking-wide">
                            {settings.customTitle.includes('{rombel}')
                              ? settings.customTitle.replace('{rombel}', group.rombel)
                              : `${settings.customTitle} - ${group.rombel.toUpperCase()}`}
                          </h3>
                          <p className="font-bold text-xs uppercase text-slate-700 mt-0.5">
                            {settings.customSubtitle}
                          </p>
                          <div className="flex items-center justify-center gap-4 text-[10.5px] text-slate-600 font-semibold mt-1">
                            <span>Rombel: <strong>{group.rombel}</strong></span>
                            <span>Total Siswa: <strong>{group.students.length}</strong></span>
                            <span>L: <strong>{group.students.filter(s => s.jenisKelamin === 'L').length}</strong></span>
                            <span>P: <strong>{group.students.filter(s => s.jenisKelamin === 'P').length}</strong></span>
                          </div>
                        </div>

                        {/* Table */}
                        <table className="w-full border-collapse border border-black text-[10px]">
                          <thead>
                            <tr className="bg-slate-100 font-bold border-b border-black text-center">
                              {settings.columns.no && <th className="border border-black p-1 w-8">NO</th>}
                              {settings.columns.nis && <th className="border border-black p-1 w-16">NIS</th>}
                              {settings.columns.nisn && <th className="border border-black p-1 w-20">NISN</th>}
                              {settings.columns.namaLengkap && <th className="border border-black p-1 text-left">NAMA LENGKAP SISWA</th>}
                              {settings.columns.jenisKelamin && <th className="border border-black p-1 w-10">L/P</th>}
                              {settings.columns.rombel && <th className="border border-black p-1 w-16">ROMBEL</th>}
                              {settings.columns.tempatTanggalLahir && <th className="border border-black p-1 text-left">TEMPAT, TGL LAHIR</th>}
                              {settings.columns.namaOrangTua && <th className="border border-black p-1 text-left">NAMA ORANG TUA</th>}
                              {settings.columns.agama && <th className="border border-black p-1">AGAMA</th>}
                              {settings.columns.status && <th className="border border-black p-1">STATUS</th>}
                              {settings.columns.kolomParaf && <th className="border border-black p-1 w-20">PARAF / TTD</th>}
                              {settings.columns.kolomKeterangan && <th className="border border-black p-1 w-20">KET.</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {group.students.map((s, idx) => (
                              <tr key={s.id} className="border-b border-black">
                                {settings.columns.no && <td className="border border-black p-1 text-center font-mono">{idx + 1}</td>}
                                {settings.columns.nis && <td className="border border-black p-1 text-center font-mono">{s.noInduk}</td>}
                                {settings.columns.nisn && <td className="border border-black p-1 text-center font-mono">{s.nisn}</td>}
                                {settings.columns.namaLengkap && <td className="border border-black p-1 font-bold">{s.namaLengkap}</td>}
                                {settings.columns.jenisKelamin && <td className="border border-black p-1 text-center font-bold">{s.jenisKelamin}</td>}
                                {settings.columns.rombel && <td className="border border-black p-1 text-center">{s.kelasSekarang}</td>}
                                {settings.columns.tempatTanggalLahir && (
                                  <td className="border border-black p-1">
                                    {s.tempatLahir}, {formatIndonesianDate(s.tanggalLahir)}
                                  </td>
                                )}
                                {settings.columns.namaOrangTua && (
                                  <td className="border border-black p-1">
                                    {s.orangTua?.ayah?.nama || s.orangTua?.ibu?.nama || '-'}
                                  </td>
                                )}
                                {settings.columns.agama && <td className="border border-black p-1 text-center">{s.agama}</td>}
                                {settings.columns.status && <td className="border border-black p-1 text-center font-semibold">{s.status}</td>}
                                {settings.columns.kolomParaf && <td className="border border-black p-1 text-center text-slate-300 font-mono text-[9px]">{idx + 1}. ...</td>}
                                {settings.columns.kolomKeterangan && <td className="border border-black p-1"></td>}
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {/* Signatures */}
                        {settings.showSignatures && (
                          <div className="pt-6 flex justify-between items-start text-[11px] avoid-break">
                            {settings.showWaliKelasSignature ? (
                              <div className="text-center w-48">
                                <p className="mb-14">
                                  Wali Kelas {group.rombel},
                                </p>
                                <p className="font-bold underline uppercase">
                                  {findWaliKelasInfo(group.rombel).nama}
                                </p>
                                <p className="text-[10px] text-slate-600">
                                  NIP. {findWaliKelasInfo(group.rombel).nip}
                                </p>
                              </div>
                            ) : <div />}

                            {settings.showKepalaSekolahSignature && (
                              <div className="text-center w-52">
                                <p>
                                  {settings.titimangsaKota}, {settings.titimangsaTanggal}
                                </p>
                                <p className="mb-14">
                                  Mengetahui,<br />Kepala Sekolah,
                                </p>
                                <p className="font-bold underline uppercase">
                                  {settings.namaKepalaSekolah}
                                </p>
                                <p className="text-[10px] text-slate-600">
                                  NIP. {settings.nipKepalaSekolah}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    {studentsGroupedByRombel.length > 3 && (
                      <div className="text-center text-xs text-slate-400 py-2 border-t border-dashed">
                        ... dan {studentsGroupedByRombel.length - 3} rombel lainnya akan otomatis terbagi rapi pada halaman selanjutnya saat dicetak.
                      </div>
                    )}
                  </div>
                ) : (
                  // Continuous Table
                  <div className="space-y-4">
                    {settings.showKopSurat && (
                      <KopSuratHeader schoolProfile={schoolProfile} />
                    )}

                    <div className="text-center mb-4">
                      <h3 className="font-black text-sm uppercase tracking-wide">
                        {settings.customTitle}
                      </h3>
                      <p className="font-bold text-xs uppercase text-slate-700 mt-0.5">
                        {settings.customSubtitle}
                      </p>
                    </div>

                    <table className="w-full border-collapse border border-black text-[10px]">
                      <thead>
                        <tr className="bg-slate-100 font-bold border-b border-black text-center">
                          {settings.columns.no && <th className="border border-black p-1 w-8">NO</th>}
                          {settings.columns.nis && <th className="border border-black p-1 w-16">NIS</th>}
                          {settings.columns.nisn && <th className="border border-black p-1 w-20">NISN</th>}
                          {settings.columns.namaLengkap && <th className="border border-black p-1 text-left">NAMA LENGKAP SISWA</th>}
                          {settings.columns.jenisKelamin && <th className="border border-black p-1 w-10">L/P</th>}
                          {settings.columns.rombel && <th className="border border-black p-1 w-16">ROMBEL</th>}
                          {settings.columns.tempatTanggalLahir && <th className="border border-black p-1 text-left">TEMPAT, TGL LAHIR</th>}
                          {settings.columns.namaOrangTua && <th className="border border-black p-1 text-left">NAMA ORANG TUA</th>}
                          {settings.columns.agama && <th className="border border-black p-1">AGAMA</th>}
                          {settings.columns.status && <th className="border border-black p-1">STATUS</th>}
                          {settings.columns.kolomParaf && <th className="border border-black p-1 w-20">PARAF / TTD</th>}
                          {settings.columns.kolomKeterangan && <th className="border border-black p-1 w-20">KET.</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudentsForPrint.slice(0, 15).map((s, idx) => (
                          <tr key={s.id} className="border-b border-black">
                            {settings.columns.no && <td className="border border-black p-1 text-center font-mono">{idx + 1}</td>}
                            {settings.columns.nis && <td className="border border-black p-1 text-center font-mono">{s.noInduk}</td>}
                            {settings.columns.nisn && <td className="border border-black p-1 text-center font-mono">{s.nisn}</td>}
                            {settings.columns.namaLengkap && <td className="border border-black p-1 font-bold">{s.namaLengkap}</td>}
                            {settings.columns.jenisKelamin && <td className="border border-black p-1 text-center font-bold">{s.jenisKelamin}</td>}
                            {settings.columns.rombel && <td className="border border-black p-1 text-center">{s.kelasSekarang}</td>}
                            {settings.columns.tempatTanggalLahir && (
                              <td className="border border-black p-1">
                                {s.tempatLahir}, {formatIndonesianDate(s.tanggalLahir)}
                              </td>
                            )}
                            {settings.columns.namaOrangTua && (
                              <td className="border border-black p-1">
                                {s.orangTua?.ayah?.nama || s.orangTua?.ibu?.nama || '-'}
                              </td>
                            )}
                            {settings.columns.agama && <td className="border border-black p-1 text-center">{s.agama}</td>}
                            {settings.columns.status && <td className="border border-black p-1 text-center font-semibold">{s.status}</td>}
                            {settings.columns.kolomParaf && <td className="border border-black p-1 text-center text-slate-300 font-mono text-[9px]">{idx + 1}. ...</td>}
                            {settings.columns.kolomKeterangan && <td className="border border-black p-1"></td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {filteredStudentsForPrint.length > 15 && (
                      <p className="text-center text-[10px] text-slate-500 italic py-1">
                        ... dan {filteredStudentsForPrint.length - 15} siswa lainnya akan tercetak lengkap.
                      </p>
                    )}

                    {/* Signatures */}
                    {settings.showSignatures && (
                      <div className="pt-6 flex justify-between items-start text-[11px] avoid-break">
                        {settings.showWaliKelasSignature ? (
                          <div className="text-center w-48">
                            <p className="mb-14">
                              Guru / Petugas Pendata,
                            </p>
                            <p className="font-bold underline uppercase">
                              {settings.namaWaliKelas}
                            </p>
                            <p className="text-[10px] text-slate-600">
                              NIP. {settings.nipWaliKelas}
                            </p>
                          </div>
                        ) : <div />}

                        {settings.showKepalaSekolahSignature && (
                          <div className="text-center w-52">
                            <p>
                              {settings.titimangsaKota}, {settings.titimangsaTanggal}
                            </p>
                            <p className="mb-14">
                              Mengetahui,<br />Kepala Sekolah,
                            </p>
                            <p className="font-bold underline uppercase">
                              {settings.namaKepalaSekolah}
                            </p>
                            <p className="text-[10px] text-slate-600">
                              NIP. {settings.nipKepalaSekolah}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              )}

              {/* RENDER PREVIEW: MODE REKAP ROMBEL */}
              {mode === 'rekap-rombel' && (
                <div className="space-y-4">
                  {settings.showKopSurat && (
                    <KopSuratHeader schoolProfile={schoolProfile} />
                  )}

                  <div className="text-center mb-4">
                    <h3 className="font-black text-sm uppercase tracking-wide">
                      {settings.customTitle}
                    </h3>
                    <p className="font-bold text-xs uppercase text-slate-700 mt-0.5">
                      {settings.customSubtitle}
                    </p>
                  </div>

                  {/* Tabel Rombel */}
                  <table className="w-full border-collapse border border-black text-[10.5px]">
                    <thead>
                      <tr className="bg-slate-100 font-bold border-b border-black text-center">
                        <th className="border border-black p-1.5 w-10">NO</th>
                        <th className="border border-black p-1.5 text-left">ROMBONGAN BELAJAR (KELAS)</th>
                        <th className="border border-black p-1.5 text-left">NAMA WALI KELAS</th>
                        <th className="border border-black p-1.5 w-16">LAKI (L)</th>
                        <th className="border border-black p-1.5 w-16">PEREMPUAN (P)</th>
                        <th className="border border-black p-1.5 w-20">TOTAL SISWA</th>
                        <th className="border border-black p-1.5 w-16">% DARI TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRombelStatsForPrint.map((item, idx) => (
                        <tr key={item.kelas} className="border-b border-black">
                          <td className="border border-black p-1.5 text-center font-mono">{idx + 1}</td>
                          <td className="border border-black p-1.5 font-bold text-blue-900">{item.kelas}</td>
                          <td className="border border-black p-1.5">
                            <div>{item.waliKelas || '-'}</div>
                            {item.nipWaliKelas && <div className="text-[9px] text-slate-500 font-mono">NIP. {item.nipWaliKelas}</div>}
                          </td>
                          <td className="border border-black p-1.5 text-center font-bold">{item.jmlL}</td>
                          <td className="border border-black p-1.5 text-center font-bold">{item.jmlP}</td>
                          <td className="border border-black p-1.5 text-center font-black">{item.total}</td>
                          <td className="border border-black p-1.5 text-center font-mono">{item.persentase || '0'}%</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-100 font-black border-t-2 border-black">
                        <td colSpan={3} className="border border-black p-1.5 text-right uppercase">
                          TOTAL KESELURUHAN:
                        </td>
                        <td className="border border-black p-1.5 text-center font-mono">
                          {filteredRombelStatsForPrint.reduce((acc, r) => acc + r.jmlL, 0)}
                        </td>
                        <td className="border border-black p-1.5 text-center font-mono">
                          {filteredRombelStatsForPrint.reduce((acc, r) => acc + r.jmlP, 0)}
                        </td>
                        <td className="border border-black p-1.5 text-center font-mono">
                          {filteredRombelStatsForPrint.reduce((acc, r) => acc + r.total, 0)}
                        </td>
                        <td className="border border-black p-1.5 text-center font-mono">
                          100%
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Signatures */}
                  {settings.showSignatures && (
                    <div className="pt-6 flex justify-between items-start text-[11px] avoid-break">
                      {settings.showWaliKelasSignature ? (
                        <div className="text-center w-52">
                          <p className="mb-14">
                            Koordinator Rombel / Tata Usaha,
                          </p>
                          <p className="font-bold underline uppercase">
                            {settings.namaWaliKelas}
                          </p>
                          <p className="text-[10px] text-slate-600">
                            NIP. {settings.nipWaliKelas}
                          </p>
                        </div>
                      ) : <div />}

                      {settings.showKepalaSekolahSignature && (
                        <div className="text-center w-52">
                          <p>
                            {settings.titimangsaKota}, {settings.titimangsaTanggal}
                          </p>
                          <p className="mb-14">
                            Mengetahui,<br />Kepala Sekolah,
                          </p>
                          <p className="font-bold underline uppercase">
                            {settings.namaKepalaSekolah}
                          </p>
                          <p className="text-[10px] text-slate-600">
                            NIP. {settings.nipKepalaSekolah}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>
              Mode Cetak: <strong>{settings.paperSize}</strong> • <strong>{settings.orientation}</strong> • {settings.showKopSurat ? 'Dengan Kop Surat' : 'Tanpa Kop'} • {settings.showSignatures ? 'Dengan Pengesahan' : 'Tanpa Pengesahan'}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleExecutePrint}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-[#003399] hover:bg-[#002266] text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer transform active:scale-95"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              <span>Cetak Sekarang (Print)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
