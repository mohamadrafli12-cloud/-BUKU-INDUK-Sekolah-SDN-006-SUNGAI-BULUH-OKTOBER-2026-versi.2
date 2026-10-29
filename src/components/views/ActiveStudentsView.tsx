import React, { useState, useMemo } from 'react';
import { 
  UserCheck, 
  Users, 
  Edit3, 
  UserPlus, 
  UserMinus, 
  Table, 
  BarChart2, 
  Search, 
  Filter, 
  Printer, 
  Download, 
  Eye, 
  CreditCard, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  GraduationCap, 
  Sparkles,
  ArrowRight,
  School,
  FileSpreadsheet,
  FileCheck,
  RefreshCw,
  Save,
  Clock,
  MapPin,
  HeartPulse,
  ArrowUpDown,
  Upload,
  ArrowRightLeft,
  Layers,
  Lock,
  Unlock,
  ShieldCheck,
  Undo2,
  HandCoins
} from 'lucide-react';
import { useSchool, sanitizeDiterimaDiKelas } from '../../context/SchoolContext';
import { Student, Gender, MutationRecord, StudentStatus } from '../../types';
import { formatIndonesianDate, cn, isInAcademicYear, getAcademicYearFromDate } from '../../lib/utils';
import { OfficialNationalLogo, TutWuriHandayaniSDLogo } from '../../utils/logoHelper';
import { downloadRombelTemplate, exportRombelToExcel, exportCombinedRombelsToExcel } from '../../utils/excelHelper';
import { ImportRombelModal } from '../modals/ImportRombelModal';
import { ManageClassesModal } from '../modals/ManageClassesModal';
import { EditTahunPelajaranModal } from '../modals/EditTahunPelajaranModal';
import { SaveLockRombelModal } from '../modals/SaveLockRombelModal';
import { EditWaliKelasModal } from '../modals/EditWaliKelasModal';
import { DownloadRombelModal } from '../modals/DownloadRombelModal';
import { PrintActiveStudentsModal, PrintSettingsState } from '../modals/PrintActiveStudentsModal';
import { ActiveStudentsPrintDocument } from '../common/ActiveStudentsPrintDocument';
import { MonthlyActiveStudentsSummaryCard } from '../common/MonthlyActiveStudentsSummaryCard';
import { 
  projectStudentsForAcademicYear, 
  ProjectedStudent,
  isKelas1Sampai6,
  getTingkatKelasNumber 
} from '../../utils/academicYearHelper';
import { ActiveTab } from '../layout/Sidebar';

export type ActiveStudentsSubTab = 
  | 'daftar' 
  | 'edit' 
  | 'mutasi-masuk' 
  | 'mutasi-keluar' 
  | 'tabel-rombel' 
  | 'gender'
  | 'statistik-bulanan';

interface ActiveStudentsViewProps {
  onOpenAddModal: () => void;
  onEditStudent: (student: Student, initialTab?: 'pribadi' | 'alamat' | 'ortu' | 'kesehatan' | 'masuk' | 'bantuan') => void;
  onSelectDetail: (studentId: string) => void;
  onPrintBukuInduk: (studentId: string) => void;
  onPrintKartuPelajar: (studentId: string) => void;
  onMutasi: (student: Student) => void;
  onSTTB?: (student: Student) => void;
  onRaport?: (student: Student) => void;
  setActiveTab?: (tab: ActiveTab) => void;
  onBack?: () => void;
}

export { isKelas1Sampai6, getTingkatKelasNumber };

export const ActiveStudentsView: React.FC<ActiveStudentsViewProps> = ({
  onOpenAddModal,
  onEditStudent,
  onSelectDetail,
  onPrintBukuInduk,
  onPrintKartuPelajar,
  onMutasi,
  onSTTB,
  onRaport,
  setActiveTab,
  onBack,
}) => {
  const { 
    students, 
    schoolProfile, 
    updateSchoolProfile,
    currentRole, 
    updateStudent, 
    addStudent, 
    processMutation, 
    logActivity,
    exportStudentsCSV,
    lockAcademicYearRombel,
    unlockAcademicYearRombel,
    adminUsers 
  } = useSchool();

  // Print Modal & Document Generation State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printModalMode, setPrintModalMode] = useState<'daftar-siswa' | 'rekap-rombel'>('daftar-siswa');
  const [currentPrintSettings, setCurrentPrintSettings] = useState<PrintSettingsState>({
    scope: 'all',
    selectedTingkat: '1',
    selectedRombel: 'Kelas 1',
    selectedStatus: 'ALL',
    hideEmptyRombel: true,
    includeTingkatSummary: true,
    includeGenderStats: true,
    groupingMode: 'per-rombel',
    paperSize: 'A4',
    orientation: 'portrait',
    fontSize: 'sm',
    showKopSurat: true,
    customTitle: 'DAFTAR PESERTA DIDIK AKTIF',
    customSubtitle: `SEMESTER ${schoolProfile.semesterAktif || 'Ganjil'} TAHUN PELAJARAN ${schoolProfile.tahunPelajaranAktif || '2026/2027'}`,
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
    titimangsaTanggal: formatIndonesianDate(new Date().toISOString().split('T')[0]),
    namaKepalaSekolah: schoolProfile.namaKepalaSekolah || 'Kepala Sekolah',
    nipKepalaSekolah: schoolProfile.nipKepalaSekolah || '-',
    namaWaliKelas: 'Wali Kelas / Guru Kelas',
    nipWaliKelas: '-',
    showWaliKelasSignature: true,
    showKepalaSekolahSignature: true,
  });

  // Active sub-tab state
  const [subTab, setSubTab] = useState<ActiveStudentsSubTab>('daftar');

  // Filter, search, tingkat kelas, rombel, status, and sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTingkat, setSelectedTingkat] = useState<string>('ALL'); // 'ALL', '1', '2', '3', '4', '5', '6', 'BELUM_MASUK_SD'
  const [selectedRombel, setSelectedRombel] = useState<string>('ALL'); // 'ALL' or specific rombel like 'Kelas 1A'
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedGender, setSelectedGender] = useState<'ALL' | 'L' | 'P'>('ALL');
  const [sortBy, setSortBy] = useState<'nis' | 'nama' | 'kelas' | 'tanggal'>('nis');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(30);

  // Filter khusus status penerima bantuan ('ALL' | 'BANTUAN' | 'NON_BANTUAN')
  const [filterBantuan, setFilterBantuan] = useState<'ALL' | 'BANTUAN' | 'NON_BANTUAN'>('ALL');

  // Helper: Cek apakah siswa pernah mendapatkan bantuan & kumpulkan riwayatnya
  const getStudentBantuanInfo = (s: Student) => {
    const records = s.riwayatBantuan || [];
    const list = s.jenisBantuanList || [];
    const legacyStr = s.penerimaBantuan && s.penerimaBantuan !== 'Tidak' && s.penerimaBantuan !== 'Bukan Penerima' && s.penerimaBantuan.trim() !== ''
      ? s.penerimaBantuan
      : null;

    const hasBantuan = records.length > 0 || list.length > 0 || Boolean(legacyStr);
    if (!hasBantuan) return null;

    const programTypes = new Set<string>();
    records.forEach(r => {
      if (r.jenis) {
        if (r.jenis === 'Bantuan Lainnya' && r.bantuanLainnya) {
          programTypes.add(r.bantuanLainnya);
        } else {
          programTypes.add(r.jenis);
        }
      }
    });
    list.forEach(item => {
      if (item === 'Bantuan Lainnya' && s.bantuanLainnya) {
        programTypes.add(s.bantuanLainnya);
      } else {
        programTypes.add(item);
      }
    });
    if (legacyStr && programTypes.size === 0) {
      programTypes.add(s.bantuanLainnya || legacyStr);
    }

    const programList = Array.from(programTypes);
    const totalRecords = Math.max(records.length, programList.length, 1);

    return {
      hasBantuan: true,
      totalRecords,
      programs: programList.length > 0 ? programList : ['Penerima Bantuan'],
      primaryProgram: programList[0] || 'Penerima Bantuan',
      latestTahap: records[0]?.tahap || s.tahapBantuan,
      latestNominal: records[0]?.nominal || s.nominalBantuan,
      records,
    };
  };

  // Active School Year & TP List
  const activeTP = schoolProfile.tahunPelajaranAktif || '2026/2027';
  const activeSemester = schoolProfile.semesterAktif || 'Ganjil';
  const [isEditTPModalOpen, setIsEditTPModalOpen] = useState(false);

  // Lock Rombel & Simpan Rombel State
  const activeTPLockInfo = schoolProfile.rombelLocks?.[activeTP];
  const isCurrentTPLocked = Boolean(activeTPLockInfo?.isLocked);
  const [isSaveLockModalOpen, setIsSaveLockModalOpen] = useState(false);
  const [draftRombelEdits, setDraftRombelEdits] = useState<Record<string, string>>({});
  const [draftStatusEdits, setDraftStatusEdits] = useState<Record<string, StudentStatus>>({});
  const [isInlineRombelEditMode, setIsInlineRombelEditMode] = useState(false);
  const [saveSuccessNotification, setSaveSuccessNotification] = useState<string | null>(null);

  // Edit Wali Kelas State & Handlers
  const [isEditWaliKelasModalOpen, setIsEditWaliKelasModalOpen] = useState(false);
  const [selectedKelasForWaliEdit, setSelectedKelasForWaliEdit] = useState<string | undefined>(undefined);

  const handleOpenEditWaliKelas = (kelas?: string) => {
    setSelectedKelasForWaliEdit(kelas);
    setIsEditWaliKelasModalOpen(true);
  };

  const handleSaveWaliKelasMap = (newWaliKelasMap: Record<string, { nama: string; nip?: string }>) => {
    updateSchoolProfile({
      waliKelasMap: {
        ...(schoolProfile.waliKelasMap || {}),
        ...newWaliKelasMap,
      },
    });
    logActivity('EDIT', `Memperbarui data nama wali kelas & NIP per rombel untuk TP ${activeTP}`);
    setSaveSuccessNotification('Data nama wali kelas berhasil disimpan dan diperbarui!');
    setTimeout(() => {
      setSaveSuccessNotification(null);
    }, 4000);
  };

  // Download Rombel Excel Modal State & Handler
  const [isDownloadRombelModalOpen, setIsDownloadRombelModalOpen] = useState(false);

  const handleExportRombelExcel = (kelasName: string) => {
    const savedWali = schoolProfile.waliKelasMap?.[kelasName];
    const teacherFromUsers = adminUsers.find(u => u.tingkatKelas === kelasName);
    const waliNama = savedWali?.nama || teacherFromUsers?.nama || `Wali Kelas ${kelasName}`;
    const waliNip = savedWali?.nip || teacherFromUsers?.nip || '-';

    exportRombelToExcel({
      schoolProfile,
      students: activeStudents,
      kelasName,
      activeTP,
      activeSemester,
      waliKelasName: waliNama,
      waliKelasNip: waliNip,
    });

    logActivity('EXPORT', `Mengunduh berkas Excel (.xlsx) daftar siswa ${kelasName} untuk wali kelas: ${waliNama}`);
    setSaveSuccessNotification(`Berkas Excel (.xlsx) untuk ${kelasName} berhasil diunduh!`);
    setTimeout(() => {
      setSaveSuccessNotification(null);
    }, 4000);
  };

  const draftEditsCount = Object.keys(draftRombelEdits).length + Object.keys(draftStatusEdits).length;
  const hasDraftEdits = draftEditsCount > 0;

  // Registered Academic Years list
  const tpList = useMemo(() => {
    const fromProfile = schoolProfile.daftarTahunPelajaran || [];
    const defaults = ['2023/2024', '2024/2025', '2025/2026', '2026/2027', '2027/2028'];
    return Array.from(new Set([...defaults, ...fromProfile, activeTP])).sort();
  }, [schoolProfile.daftarTahunPelajaran, activeTP]);

  const handleSelectAcademicYear = (newTP: string) => {
    updateSchoolProfile({ tahunPelajaranAktif: newTP });
    setDraftRombelEdits({});
    setDraftStatusEdits({});
    setIsInlineRombelEditMode(false);
    logActivity(
      'PENGATURAN',
      `Mengganti Tahun Pelajaran Aktif ke: TP ${newTP}. Data rombel & status siswa otomatis disesuaikan.`
    );
    setCurrentPage(1);
  };

  // Proyeksi Otomatis Siswa untuk Tahun Pelajaran Aktif (activeTP)
  // Menjaga sinkronisasi data status siswa persis sama dengan Buku Induk
  // serta mengakomodasi draft edits rombel dan draft edits status siswa
  const projectedStudents = useMemo(() => {
    const projected = projectStudentsForAcademicYear(students, activeTP, '2026/2027');
    if (Object.keys(draftRombelEdits).length === 0 && Object.keys(draftStatusEdits).length === 0) return projected;
    return projected.map(s => {
      const draftClass = draftRombelEdits[s.id];
      const draftStatus = draftStatusEdits[s.id];
      let updated = s;
      if (draftClass) {
        updated = {
          ...updated,
          kelasSekarang: draftClass,
          projectedRombel: draftClass,
          projectedTingkat: getTingkatKelasNumber(draftClass),
          isBelumMasukSD: draftClass === 'Belum Masuk SD',
          status: draftClass === 'Belum Masuk SD' ? ('Belum Masuk SD' as const) : (draftStatus || s.status),
        };
      }
      if (draftStatus) {
        updated = {
          ...updated,
          status: draftStatus,
          projectedStatus: draftStatus,
          isBelumMasukSD: draftStatus === 'Belum Masuk SD',
        };
      }
      return updated;
    });
  }, [students, activeTP, draftRombelEdits, draftStatusEdits]);

  const handleConfirmSaveAndLock = (notes?: string) => {
    const studentUpdates = projectedStudents.map(s => ({
      id: s.id,
      kelasSekarang: draftRombelEdits[s.id] || s.kelasSekarang,
      status: draftStatusEdits[s.id] || s.status,
      tahunPelajaranKelasSekarang: activeTP,
    }));

    lockAcademicYearRombel(activeTP, studentUpdates, notes);
    setDraftRombelEdits({});
    setDraftStatusEdits({});
    setIsInlineRombelEditMode(false);
    setSaveSuccessNotification(
      `Hasil edit dan penataan rombel serta status siswa untuk Tahun Pelajaran ${activeTP} (${studentUpdates.length} siswa) berhasil disimpan dan dikunci ke Buku Induk!`
    );
    setTimeout(() => {
      setSaveSuccessNotification(null);
    }, 6000);
  };

  const handleUnlockRombel = () => {
    if (window.confirm(`Buka kunci rombel untuk Tahun Pelajaran ${activeTP}? Anda dapat mengedit dan mengubah kembali rombel siswa.`)) {
      unlockAcademicYearRombel(activeTP);
      setSaveSuccessNotification(`Kunci rombel untuk Tahun Pelajaran ${activeTP} telah dibuka. Anda dapat melakukan perubahan rombel.`);
      setTimeout(() => {
        setSaveSuccessNotification(null);
      }, 5000);
    }
  };

  const handleResetDraftEdits = () => {
    setDraftRombelEdits({});
    setDraftStatusEdits({});
  };

  // Exclusively Active Students in Grade 1 to 6 on activeTP
  const activeStudents = useMemo(() => {
    return projectedStudents.filter(s => s.status === 'Aktif' && isKelas1Sampai6(s.kelasSekarang));
  }, [projectedStudents]);

  // Students with status "Belum Masuk SD" on activeTP
  const belumMasukSDStudents = useMemo(() => {
    return projectedStudents.filter(s => s.status === 'Belum Masuk SD');
  }, [projectedStudents]);

  // Status-specific lists for quick badges & metrics matching Buku Induk
  const studentsLulus = useMemo(() => projectedStudents.filter(s => s.status === 'Lulus'), [projectedStudents]);
  const studentsMutasiKeluarAll = useMemo(() => projectedStudents.filter(s => s.status === 'Mutasi Keluar'), [projectedStudents]);
  const studentsDropOut = useMemo(() => projectedStudents.filter(s => s.status === 'Drop Out'), [projectedStudents]);
  const studentsMeninggal = useMemo(() => projectedStudents.filter(s => s.status === 'Meninggal'), [projectedStudents]);

  // Display scope for Tab "Daftar Siswa Aktif": HANYA siswa dengan status "Aktif", selain itu disembunyikan
  const displayScopeStudents = useMemo(() => {
    return projectedStudents.filter(s => s.status === 'Aktif' && isKelas1Sampai6(s.kelasSekarang));
  }, [projectedStudents]);

  // Modal Import Rombel & Download Template State
  const [isImportRombelModalOpen, setIsImportRombelModalOpen] = useState(false);
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);
  const [isManageClassesOpen, setIsManageClassesOpen] = useState(false);

  const handleDownloadPopulatedTemplate = () => {
    downloadRombelTemplate(schoolProfile.namaSekolah, activeStudents, 'populated');
    setIsTemplateDropdownOpen(false);
  };

  const handleDownloadBlankTemplate = () => {
    downloadRombelTemplate(schoolProfile.namaSekolah, [], 'blank');
    setIsTemplateDropdownOpen(false);
  };

  // Available variable classes for Kelas 1 to 6 (Rombel Variabel)
  const availableClasses = useMemo(() => {
    const fromProfile = (schoolProfile.daftarKelas || []).filter(isKelas1Sampai6);
    const fromStudents = activeStudents.map(s => s.kelasSekarang).filter(isKelas1Sampai6);
    const baseList = fromProfile.length > 0 ? fromProfile : ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'];
    const combined = Array.from(new Set([...baseList, ...fromStudents]));

    return combined.sort((a, b) => {
      const tingkatA = getTingkatKelasNumber(a);
      const tingkatB = getTingkatKelasNumber(b);
      if (tingkatA !== tingkatB) return tingkatA - tingkatB;
      return a.localeCompare(b, undefined, { numeric: true });
    });
  }, [schoolProfile.daftarKelas, activeStudents]);

  // Pilihan rombel yang tersedia berdasarkan Tingkat Kelas yang dipilih
  const rombelsForSelectedTingkat = useMemo(() => {
    if (selectedTingkat === 'ALL' || selectedTingkat === 'BELUM_MASUK_SD') {
      return availableClasses;
    }
    const targetTingkat = parseInt(selectedTingkat, 10);
    return availableClasses.filter(cls => getTingkatKelasNumber(cls) === targetTingkat);
  }, [availableClasses, selectedTingkat]);

  // Statistik jumlah siswa per Tingkat Kelas (Tingkat 1 s/d 6)
  const tingkatCounts = useMemo(() => {
    const counts: Record<number, { total: number; jmlL: number; jmlP: number }> = {
      1: { total: 0, jmlL: 0, jmlP: 0 },
      2: { total: 0, jmlL: 0, jmlP: 0 },
      3: { total: 0, jmlL: 0, jmlP: 0 },
      4: { total: 0, jmlL: 0, jmlP: 0 },
      5: { total: 0, jmlL: 0, jmlP: 0 },
      6: { total: 0, jmlL: 0, jmlP: 0 },
    };

    activeStudents.forEach(s => {
      const t = getTingkatKelasNumber(s.kelasSekarang);
      if (t >= 1 && t <= 6) {
        counts[t].total += 1;
        if (s.jenisKelamin === 'L') counts[t].jmlL += 1;
        else counts[t].jmlP += 1;
      }
    });

    return counts;
  }, [activeStudents]);

  // Jumlah siswa aktif yang pernah mendapatkan bantuan
  const countPernahBantuan = useMemo(() => {
    return displayScopeStudents.filter(s => Boolean(getStudentBantuanInfo(s))).length;
  }, [displayScopeStudents]);

  // Filtered students for Daftar tab with support for Tingkat (1-6), Rombel spesifik, Status, Gender, Penerima Bantuan, dan Pencarian
  const filteredActiveStudents = useMemo(() => {
    return displayScopeStudents.filter(s => {
      const bInfo = getStudentBantuanInfo(s);

      const matchSearch = searchQuery.trim() === '' || 
        s.namaLengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.noInduk.includes(searchQuery) ||
        s.nisn.includes(searchQuery) ||
        (s.nik && s.nik.includes(searchQuery)) ||
        (bInfo && (
          bInfo.programs.some(p => p.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (searchQuery.toLowerCase().includes('bantuan') || searchQuery.toLowerCase().includes('pip'))
        ));

      // Match Filter Tingkat Kelas (1 s/d 6 atau Belum Masuk SD)
      let matchTingkat = true;
      if (selectedTingkat === 'ALL') {
        matchTingkat = true;
      } else if (selectedTingkat === 'BELUM_MASUK_SD') {
        matchTingkat = s.status === 'Belum Masuk SD';
      } else {
        const targetNum = parseInt(selectedTingkat, 10);
        matchTingkat = s.status !== 'Belum Masuk SD' && getTingkatKelasNumber(s.kelasSekarang) === targetNum;
      }

      // Match Filter Rombel Spesifik (contoh: "Kelas 1A", "Kelas 2B", dsb)
      let matchRombel = true;
      if (selectedRombel !== 'ALL') {
        matchRombel = s.kelasSekarang === selectedRombel;
      }

      const matchGender = selectedGender === 'ALL' || s.jenisKelamin === selectedGender;
      const matchStatus = selectedStatus === 'ALL' || s.status === selectedStatus;

      // Match Filter Penerima Bantuan
      const matchBantuan = filterBantuan === 'ALL'
        ? true
        : filterBantuan === 'BANTUAN'
        ? Boolean(bInfo)
        : !bInfo;

      return matchSearch && matchTingkat && matchRombel && matchGender && matchStatus && matchBantuan;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'nama') {
        comparison = a.namaLengkap.localeCompare(b.namaLengkap);
      } else if (sortBy === 'nis') {
        comparison = a.noInduk.localeCompare(b.noInduk, undefined, { numeric: true });
      } else if (sortBy === 'kelas') {
        if (a.status === 'Belum Masuk SD' && b.status !== 'Belum Masuk SD') return -1;
        if (b.status === 'Belum Masuk SD' && a.status !== 'Belum Masuk SD') return 1;
        const tingkatA = getTingkatKelasNumber(a.kelasSekarang);
        const tingkatB = getTingkatKelasNumber(b.kelasSekarang);
        if (tingkatA !== tingkatB) {
          comparison = tingkatA - tingkatB;
        } else {
          comparison = a.kelasSekarang.localeCompare(b.kelasSekarang, undefined, { numeric: true });
        }
      } else if (sortBy === 'tanggal') {
        const dateA = a.tanggalDiterima ? new Date(a.tanggalDiterima).getTime() : new Date(a.createdAt).getTime();
        const dateB = b.tanggalDiterima ? new Date(b.tanggalDiterima).getTime() : new Date(b.createdAt).getTime();
        comparison = dateA - dateB;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [displayScopeStudents, searchQuery, selectedTingkat, selectedRombel, selectedGender, selectedStatus, filterBantuan, sortBy, sortOrder]);

  // Pagination for Daftar tab
  const totalPages = Math.ceil(filteredActiveStudents.length / itemsPerPage) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredActiveStudents.slice(start, start + itemsPerPage);
  }, [filteredActiveStudents, currentPage, itemsPerPage]);

  // Summary Metrics
  const totalActive = activeStudents.length;
  const totalLaki = activeStudents.filter(s => s.jenisKelamin === 'L').length;
  const totalPerempuan = activeStudents.filter(s => s.jenisKelamin === 'P').length;
  const persenLaki = totalActive > 0 ? Math.round((totalLaki / totalActive) * 100) : 0;
  const persenPerempuan = totalActive > 0 ? (100 - persenLaki) : 0;
  const totalBelumMasukSD = belumMasukSDStudents.length;

  // ==========================================
  // TAB 2: INLINE QUICK EDIT STATE
  // ==========================================
  const [editFilterTingkat, setEditFilterTingkat] = useState<string>('ALL');
  const [editFilterRombel, setEditFilterRombel] = useState<string>('ALL');

  const rombelsForEditTingkat = useMemo(() => {
    if (editFilterTingkat === 'ALL') return availableClasses;
    const t = parseInt(editFilterTingkat, 10);
    return availableClasses.filter(c => getTingkatKelasNumber(c) === t);
  }, [availableClasses, editFilterTingkat]);

  const studentsForEditList = useMemo(() => {
    return projectedStudents.filter(s => {
      if (editFilterTingkat !== 'ALL') {
        if (getTingkatKelasNumber(s.kelasSekarang) !== parseInt(editFilterTingkat, 10)) return false;
      }
      if (editFilterRombel !== 'ALL') {
        if (s.kelasSekarang !== editFilterRombel) return false;
      }
      return true;
    });
  }, [projectedStudents, editFilterTingkat, editFilterRombel]);

  const [selectedStudentForEditId, setSelectedStudentForEditId] = useState<string>(() => {
    return projectedStudents[0]?.id || '';
  });

  const selectedStudentForEdit = useMemo(() => {
    return studentsForEditList.find(s => s.id === selectedStudentForEditId) || studentsForEditList[0] || projectedStudents[0] || null;
  }, [studentsForEditList, selectedStudentForEditId, projectedStudents]);

  // Local form state for inline edit tab
  const [editFormData, setEditFormData] = useState<Partial<Student>>({});
  const [editSaveSuccess, setEditSaveSuccess] = useState(false);

  // Sync edit form whenever selected student changes
  React.useEffect(() => {
    if (selectedStudentForEdit) {
      setEditFormData({
        namaLengkap: selectedStudentForEdit.namaLengkap,
        namaPanggilan: selectedStudentForEdit.namaPanggilan,
        noInduk: selectedStudentForEdit.noInduk,
        nisn: selectedStudentForEdit.nisn,
        nik: selectedStudentForEdit.nik,
        jenisKelamin: selectedStudentForEdit.jenisKelamin,
        tempatLahir: selectedStudentForEdit.tempatLahir,
        tanggalLahir: selectedStudentForEdit.tanggalLahir,
        agama: selectedStudentForEdit.agama,
        kelasSekarang: selectedStudentForEdit.kelasSekarang,
        diterimaDiKelas: (() => {
          const raw = selectedStudentForEdit.diterimaDiKelas;
          if (!raw || raw === '7' || raw === '7A' || raw === '7B' || raw.toLowerCase() === 'kelas 7' || raw.toLowerCase() === 'vii') {
            return 'Kelas 1';
          }
          return raw || selectedStudentForEdit.kelasSekarang || 'Kelas 1';
        })(),
        sekolahAsalTK: selectedStudentForEdit.sekolahAsalTK || '',
        noIjazahTK: selectedStudentForEdit.noIjazahTK || '',
        tanggalDiterima: selectedStudentForEdit.tanggalDiterima || '',
        tahunMasuk: selectedStudentForEdit.tahunMasuk || '',
        status: selectedStudentForEdit.status,
      });
      setEditSaveSuccess(false);
    }
  }, [selectedStudentForEdit?.id]);

  // Edit navigation index
  const editIndex = studentsForEditList.findIndex(s => s.id === selectedStudentForEdit?.id);
  const hasPrevEdit = editIndex > 0;
  const hasNextEdit = editIndex >= 0 && editIndex < studentsForEditList.length - 1;

  const handlePrevEditStudent = () => {
    if (hasPrevEdit) {
      setSelectedStudentForEditId(studentsForEditList[editIndex - 1].id);
    }
  };

  const handleNextEditStudent = () => {
    if (hasNextEdit) {
      setSelectedStudentForEditId(studentsForEditList[editIndex + 1].id);
    }
  };

  const handleSaveInlineEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForEdit) return;

    const cleanedDiterima = sanitizeDiterimaDiKelas(editFormData.diterimaDiKelas);

    updateStudent(selectedStudentForEdit.id, {
      ...editFormData,
      diterimaDiKelas: cleanedDiterima,
      tahunPelajaranKelasSekarang: activeTP,
    });
    logActivity('EDIT', `Memperbarui data & riwayat masuk siswa aktif: ${selectedStudentForEdit.namaLengkap} (${selectedStudentForEdit.noInduk})`);
    setEditSaveSuccess(true);
    setTimeout(() => setEditSaveSuccess(false), 3000);
  };

  // ==========================================
  // TAB 3: MUTASI MASUK (Incoming Transfer)
  // ==========================================
  const [mutasiMasukForm, setMutasiMasukForm] = useState({
    namaLengkap: '',
    jenisKelamin: 'L' as Gender,
    nisn: '',
    noInduk: '',
    nik: '',
    tempatLahir: schoolProfile.desaKelurahan || 'Sungai Buluh',
    tanggalLahir: '2016-01-01',
    agama: 'Islam' as const,
    sekolahAsal: '',
    diterimaDiKelas: 'Kelas 2',
    tanggalMasuk: new Date().toISOString().split('T')[0],
    noSuratPindah: '',
    alasanPindah: 'Pindah Domisili Orang Tua',
    namaAyah: '',
    noHpOrtu: '',
    alamat: `Dusun Suka Maju, Desa ${schoolProfile.desaKelurahan || 'Sungai Buluh'}`,
  });
  const [mutasiMasukSuccess, setMutasiMasukSuccess] = useState(false);

  // Filter mutasi khusus Tahun Ajar Aktif (sesuai instruksi: "tampilkan mutasi data siswa mutasi masuk dan mutasi keluar pada tahun Ajar Aktif. selain tahun itu di sembunyikan")
  const [filterMutasiOnlyActiveYear, setFilterMutasiOnlyActiveYear] = useState<boolean>(true);

  // Helper untuk mengenali apakah siswa masuk lewat mutasi masuk / pindahan
  const isStudentMutasiMasuk = (s: Student): boolean => {
    const rawClass = (s.diterimaDiKelas || '').trim();
    // Jika isian sebelumnya '7', '7A', 'Kelas 7', anggap sebagai 'Kelas 1' (bukan mutasi masuk)
    const isKelas1 = !rawClass || rawClass === '7' || rawClass === '7A' || rawClass === '7B' || rawClass.toLowerCase().includes('kelas 1') || rawClass.toLowerCase().startsWith('1');
    const isNotClass1 = !isKelas1;
    const isSekolahAsalSD = Boolean(s.sekolahAsalTK && (
      s.sekolahAsalTK.toLowerCase().includes('sd') ||
      s.sekolahAsalTK.toLowerCase().includes('mi') ||
      s.sekolahAsalTK.toLowerCase().includes('sekolah dasar') ||
      s.sekolahAsalTK.toLowerCase().includes('pindahan')
    ));
    const hasTransferSurat = Boolean(s.noIjazahTK && (
      s.noIjazahTK.toLowerCase().includes('skp') || 
      s.noIjazahTK.toLowerCase().includes('pindah') ||
      s.noIjazahTK.toLowerCase().includes('mutasi')
    ));
    return isNotClass1 || isSekolahAsalSD || hasTransferSurat;
  };

  // Semua riwayat mutasi masuk (seluruh tahun)
  const allMutasiMasukStudents = useMemo(() => {
    return activeStudents.filter(isStudentMutasiMasuk);
  }, [activeStudents]);

  // Siswa mutasi masuk khusus pada Tahun Ajar Aktif (2026/2027)
  const activeYearMutasiMasukStudents = useMemo(() => {
    return allMutasiMasukStudents.filter(s => {
      const studentTP = getAcademicYearFromDate(s.tanggalDiterima) || 
        (s.tahunMasuk && /^\d{4}$/.test(s.tahunMasuk.trim()) ? `${s.tahunMasuk}/${parseInt(s.tahunMasuk) + 1}` : s.tahunMasuk);
      return studentTP === activeTP || isInAcademicYear(s.tanggalDiterima, activeTP);
    });
  }, [allMutasiMasukStudents, activeTP]);

  // Siswa mutasi masuk yang ditampilkan (berdasarkan pilihan: Tahun Aktif vs Semua Tahun)
  const studentsMutasiMasuk = useMemo(() => {
    return filterMutasiOnlyActiveYear ? activeYearMutasiMasukStudents : allMutasiMasukStudents;
  }, [filterMutasiOnlyActiveYear, activeYearMutasiMasukStudents, allMutasiMasukStudents]);

  // Jumlah siswa mutasi masuk tahun lain yang disembunyikan
  const hiddenMutasiMasukCount = allMutasiMasukStudents.length - activeYearMutasiMasukStudents.length;

  const handleSubmitMutasiMasuk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mutasiMasukForm.namaLengkap.trim()) {
      alert('Nama lengkap siswa mutasi masuk wajib diisi.');
      return;
    }

    const currentYear = new Date().getFullYear();
    const newStudentData: Omit<Student, 'id' | 'createdAt' | 'updatedAt'> = {
      namaLengkap: mutasiMasukForm.namaLengkap.trim(),
      namaPanggilan: mutasiMasukForm.namaLengkap.trim().split(' ')[0],
      jenisKelamin: mutasiMasukForm.jenisKelamin,
      noInduk: mutasiMasukForm.noInduk.trim() || `${currentYear}${String(activeStudents.length + 1).padStart(3, '0')}`,
      nisn: mutasiMasukForm.nisn.trim() || `0${Math.floor(100000000 + Math.random() * 900000000)}`,
      nik: mutasiMasukForm.nik.trim() || '1409050000000000',
      tempatLahir: mutasiMasukForm.tempatLahir,
      tanggalLahir: mutasiMasukForm.tanggalLahir,
      agama: mutasiMasukForm.agama,
      kewarganegaraan: 'Indonesia (WNI)',
      anakKe: 1,
      jumlahSaudaraKandung: 0,
      jumlahSaudaraTiri: 0,
      jumlahSaudaraAngkat: 0,
      statusKeluarga: 'Anak Kandung',
      bahasaIbu: 'Bahasa Indonesia',
      alamat: mutasiMasukForm.alamat,
      rt: '001',
      rw: '001',
      dusun: 'Dusun Suka Maju',
      kelurahanDesa: schoolProfile.desaKelurahan || 'Sungai Buluh',
      kecamatan: schoolProfile.kecamatan || 'Singingi Hilir',
      kabupatenKota: schoolProfile.kabupatenKota || 'Kabupaten Kuantan Singingi',
      provinsi: schoolProfile.provinsi || 'Riau',
      kodePos: schoolProfile.kodePos || '29563',
      tinggalDengan: 'Orang Tua',
      jarakKeSekolahKm: 1,
      transportasi: 'Sepeda Motor',
      kesehatan: {
        golonganDarah: 'Tidak Tahu',
        penyakitPernahDiderita: '-',
        kelainanJasmani: '-',
        tinggiBadanCm: 125,
        beratBadanKg: 26,
      },
      ayah: {
        nama: mutasiMasukForm.namaAyah || 'Orang Tua Siswa',
        nik: '1409050000000001',
        agama: 'Islam',
        kewarganegaraan: 'WNI',
        pendidikan: 'SMA/Sederajat',
        pekerjaan: 'Wiraswasta / Karyawan',
        penghasilanBulanan: 'Rp 2.000.000 - Rp 4.000.000',
        noHp: mutasiMasukForm.noHpOrtu,
        statusHidup: 'Masih Hidup',
      },
      ibu: {
        nama: 'Ibu Siswa',
        nik: '1409050000000002',
        agama: 'Islam',
        kewarganegaraan: 'WNI',
        pendidikan: 'SMA/Sederajat',
        pekerjaan: 'Ibu Rumah Tangga',
        penghasilanBulanan: 'Kurang dari Rp 1.000.000',
        noHp: mutasiMasukForm.noHpOrtu,
        statusHidup: 'Masih Hidup',
      },
      sekolahAsalTK: mutasiMasukForm.sekolahAsal || 'SD Asal Pindahan',
      noIjazahTK: mutasiMasukForm.noSuratPindah || '',
      tanggalDiterima: mutasiMasukForm.tanggalMasuk,
      diterimaDiKelas: mutasiMasukForm.diterimaDiKelas,
      kelasSekarang: mutasiMasukForm.diterimaDiKelas,
      status: 'Aktif',
      tahunMasuk: activeTP.split('/')[0] || `${currentYear}`,
      tahunPelajaranKelasSekarang: activeTP,
      raport: [],
    };

    addStudent(newStudentData);
    logActivity('MUTASI', `Penerimaan Siswa Mutasi Masuk: ${mutasiMasukForm.namaLengkap} diterima di ${mutasiMasukForm.diterimaDiKelas} asal ${mutasiMasukForm.sekolahAsal}`);
    
    setMutasiMasukSuccess(true);
    setMutasiMasukForm({
      namaLengkap: '',
      jenisKelamin: 'L',
      nisn: '',
      noInduk: '',
      nik: '',
      tempatLahir: schoolProfile.desaKelurahan || 'Sungai Buluh',
      tanggalLahir: '2016-01-01',
      agama: 'Islam',
      sekolahAsal: '',
      diterimaDiKelas: 'Kelas 2',
      tanggalMasuk: new Date().toISOString().split('T')[0],
      noSuratPindah: '',
      alasanPindah: 'Pindah Domisili Orang Tua',
      namaAyah: '',
      noHpOrtu: '',
      alamat: `Dusun Suka Maju, Desa ${schoolProfile.desaKelurahan || 'Sungai Buluh'}`,
    });
    setTimeout(() => setMutasiMasukSuccess(false), 4000);
  };

  // ==========================================
  // TAB 4: MUTASI KELUAR (Outgoing Transfer)
  // ==========================================
  const [selectedStudentForMutasiKeluarId, setSelectedStudentForMutasiKeluarId] = useState<string>('');
  const [mutasiKeluarData, setMutasiKeluarData] = useState<MutationRecord>({
    tglMeninggalkan: new Date().toISOString().split('T')[0],
    dariKelas: 'Kelas 1',
    sekolahTujuan: '',
    alasanPindah: 'Mengikuti Orang Tua Pindah Tugas / Domisili',
    noSuratPindah: `421.2/SDN-006/SKP/${new Date().getFullYear()}/001`,
    dikeluarkanTanggal: new Date().toISOString().split('T')[0],
    keterangan: 'Pindah atas permohonan orang tua',
  });
  const [mutasiKeluarSuccess, setMutasiKeluarSuccess] = useState(false);

  const selectedStudentForMutasiKeluar = useMemo(() => {
    return activeStudents.find(s => s.id === selectedStudentForMutasiKeluarId) || null;
  }, [activeStudents, selectedStudentForMutasiKeluarId]);

  // Sync dariKelas with selected student
  React.useEffect(() => {
    if (selectedStudentForMutasiKeluar) {
      setMutasiKeluarData(prev => ({
        ...prev,
        dariKelas: selectedStudentForMutasiKeluar.kelasSekarang || 'Kelas 1',
      }));
    }
  }, [selectedStudentForMutasiKeluar]);

  const handleProcessMutasiKeluar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForMutasiKeluar) {
      alert('Pilih siswa yang akan diproses mutasi keluar.');
      return;
    }
    if (!mutasiKeluarData.sekolahTujuan?.trim()) {
      alert('Sekolah tujuan mutasi keluar wajib diisi.');
      return;
    }

    processMutation(selectedStudentForMutasiKeluar.id, {
      ...mutasiKeluarData,
      tahunAjaran: activeTP,
    });
    logActivity('MUTASI', `Memproses Mutasi Keluar siswa ${selectedStudentForMutasiKeluar.namaLengkap} ke ${mutasiKeluarData.sekolahTujuan} (TP ${activeTP})`);
    setMutasiKeluarSuccess(true);
    setSelectedStudentForMutasiKeluarId('');
    setTimeout(() => setMutasiKeluarSuccess(false), 4000);
  };

  // Semua riwayat siswa mutasi keluar (seluruh tahun)
  const allMutasiKeluarStudents = useMemo(() => {
    return students.filter(s => s.status === 'Mutasi Keluar' || Boolean(s.mutasi));
  }, [students]);

  // Siswa mutasi keluar khusus pada Tahun Ajar Aktif (selain tahun aktif disembunyikan)
  const studentsMutasiKeluar = useMemo(() => {
    if (!filterMutasiOnlyActiveYear) return allMutasiKeluarStudents;
    return allMutasiKeluarStudents.filter(s => {
      return (
        isInAcademicYear(s.mutasi?.tglMeninggalkan, activeTP) ||
        isInAcademicYear(s.mutasi?.dikeluarkanTanggal, activeTP) ||
        isInAcademicYear(s.mutasi?.tahunAjaran, activeTP) ||
        (s.status === 'Mutasi Keluar' && !s.mutasi?.tglMeninggalkan && isInAcademicYear(s.updatedAt, activeTP))
      );
    });
  }, [allMutasiKeluarStudents, activeTP, filterMutasiOnlyActiveYear]);

  // Jumlah siswa mutasi keluar tahun lain yang disembunyikan
  const hiddenMutasiKeluarCount = allMutasiKeluarStudents.length - studentsMutasiKeluar.length;

  // ==========================================
  // TAB 5: TABEL JUMLAH SISWA PER ROMBEL
  // ==========================================
  const rombelStats = useMemo(() => {
    return availableClasses.map((kelas, idx) => {
      const classStudents = activeStudents.filter(s => s.kelasSekarang === kelas);
      const jmlL = classStudents.filter(s => s.jenisKelamin === 'L').length;
      const jmlP = classStudents.filter(s => s.jenisKelamin === 'P').length;
      const total = classStudents.length;
      const persentase = totalActive > 0 ? ((total / totalActive) * 100).toFixed(1) : '0';
      const tingkat = getTingkatKelasNumber(kelas);

      // Ambil nama wali kelas dari schoolProfile.waliKelasMap (jika diedit) atau adminUsers
      const savedWali = schoolProfile.waliKelasMap?.[kelas];
      const teacherFromUsers = adminUsers.find(u => u.tingkatKelas === kelas);

      const waliKelasNama = 
        savedWali?.nama ||
        teacherFromUsers?.nama ||
        (idx === 0 ? 'Dewi Anggraini, S.Pd.SD' :
         idx === 1 ? 'Suryani, S.Pd.' :
         idx === 2 ? 'Hendri Gunawan, S.Pd.I.' :
         idx === 3 ? 'Ratna Juwita, S.Pd.' :
         idx === 4 ? 'Bambang Irawan, S.Pd.' :
         idx === 5 ? 'Siti Rahmawati, S.Pd.' : `Wali Kelas ${kelas}`);

      const waliKelasNip = 
        savedWali?.nip ||
        teacherFromUsers?.nip ||
        (idx === 0 ? '19901103 201502 2 009' :
         idx === 1 ? '19890412 201403 2 011' :
         idx === 2 ? '19870825 201201 1 007' :
         idx === 3 ? '19910519 201602 2 014' :
         idx === 4 ? '19880220 201403 1 004' :
         idx === 5 ? '19850116 201001 2 008' : '-');

      return {
        no: idx + 1,
        kelas,
        tingkat,
        waliKelas: waliKelasNama,
        nipWaliKelas: waliKelasNip,
        jmlL,
        jmlP,
        total,
        persentase,
      };
    });
  }, [availableClasses, activeStudents, totalActive, schoolProfile.waliKelasMap, adminUsers]);

  // Sembunyikan rombel yang tidak ada siswanya atau 0 & filter tingkat
  const [hideEmptyRombel, setHideEmptyRombel] = useState<boolean>(true);
  const [rekapFilterTingkat, setRekapFilterTingkat] = useState<string>('ALL');

  // Rombel aktif yang memiliki siswa (sembunyikan rombel kosong / 0 siswa)
  const visibleRombelStats = useMemo(() => {
    let list = hideEmptyRombel ? rombelStats.filter(r => r.total > 0) : rombelStats;
    if (rekapFilterTingkat !== 'ALL') {
      const t = parseInt(rekapFilterTingkat, 10);
      list = list.filter(r => getTingkatKelasNumber(r.kelas) === t);
    }
    return list.map((item, idx) => ({
      ...item,
      no: idx + 1,
    }));
  }, [rombelStats, hideEmptyRombel, rekapFilterTingkat]);

  // Jumlah rombel kosong dengan 0 siswa
  const emptyRombelCount = useMemo(() => {
    return rombelStats.filter(r => r.total === 0).length;
  }, [rombelStats]);

  // Rekapitulasi per Tingkat Kelas (Tingkat 1 sampai dengan Tingkat 6)
  const tingkatStats = useMemo(() => {
    return [1, 2, 3, 4, 5, 6].map((tingkat) => {
      const classStudents = activeStudents.filter(s => getTingkatKelasNumber(s.kelasSekarang) === tingkat);
      const rombels = availableClasses.filter(c => getTingkatKelasNumber(c) === tingkat);
      const jmlL = classStudents.filter(s => s.jenisKelamin === 'L').length;
      const jmlP = classStudents.filter(s => s.jenisKelamin === 'P').length;
      const total = classStudents.length;
      const persentase = totalActive > 0 ? ((total / totalActive) * 100).toFixed(1) : '0';

      return {
        tingkat,
        label: `Kelas ${tingkat} (Tingkat ${tingkat})`,
        rombels,
        rombelCount: Math.max(1, rombels.length),
        jmlL,
        jmlP,
        total,
        persentase,
      };
    });
  }, [activeStudents, availableClasses, totalActive]);

  const visibleTingkatStats = useMemo(() => {
    if (!hideEmptyRombel) return tingkatStats;
    return tingkatStats.filter(ts => ts.total > 0);
  }, [tingkatStats, hideEmptyRombel]);

  // Print function - opens official document print dialog with Kop Surat & layout configurations
  const handlePrint = (targetMode: 'daftar-siswa' | 'rekap-rombel' = subTab === 'tabel-rombel' ? 'rekap-rombel' : 'daftar-siswa') => {
    setPrintModalMode(targetMode);
    setIsPrintModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* TAMPILAN INTERAKTIF LAYAR (DISEMBUNYIKAN PENUH SAAT CETAK AGAR HANYA DOKUMEN RESMI BER-KOP SURAT YANG TERCETAK) */}
      <div className="space-y-6 no-print print:hidden">
        {/* Top Banner Ribbon */}
        <div className="bg-gradient-to-r from-[#003399] via-blue-800 to-indigo-900 rounded-2xl p-5 md:p-6 text-white shadow-xl relative overflow-hidden print:hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-amber-400 text-slate-950 px-2.5 py-1 rounded-xl font-black text-xs shadow-md">
                <Calendar className="w-3.5 h-3.5 text-slate-950" />
                <span className="uppercase tracking-wider text-[11px]">TP Aktif:</span>
                <select
                  value={activeTP}
                  onChange={(e) => handleSelectAcademicYear(e.target.value)}
                  className="bg-white text-slate-950 font-black text-xs px-2 py-0.5 rounded-lg border-none shadow-xs cursor-pointer focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  title="Pilih Tahun Pelajaran untuk melihat perubahan rombel siswa secara otomatis"
                >
                  {tpList.map(tp => (
                    <option key={tp} value={tp}>
                      TP {tp} {tp === (schoolProfile.tahunPelajaranAktif || '2025/2026') ? '(Aktif)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {currentRole !== 'umum' && (
                <button
                  type="button"
                  onClick={() => setIsEditTPModalOpen(true)}
                  className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                  title="Buka dialog kelola & tambah tahun pelajaran"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-300" />
                  <span>Kelola TP</span>
                </button>
              )}

              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/20 text-blue-100 backdrop-blur-xs">
                Semester {activeSemester}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500/80 text-white backdrop-blur-xs flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{totalActive} Siswa Aktif (Kelas 1-6)</span>
              </span>
              {totalBelumMasukSD > 0 && (
                <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-500 text-slate-950 shadow-xs flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{totalBelumMasukSD} Belum Masuk SD</span>
                </span>
              )}
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/80 text-white backdrop-blur-xs">
                Rombel Variabel ({availableClasses.length} Rombel)
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <UserCheck className="w-8 h-8 text-amber-300" />
              <span>Data Siswa Aktif (Kelas 1 - 6)</span>
            </h1>

            <p className="text-xs sm:text-sm text-blue-100 max-w-2xl leading-relaxed">
              Daftar resmi peserta didik aktif SDN 006 SUNGAI BULUH khusus untuk <strong className="text-amber-300 font-bold">Kelas 1 sampai dengan Kelas 6</strong> pada Tahun Pelajaran <strong className="text-amber-300 font-bold">{activeTP}</strong>. Tingkatan rombel otomatis naik/turun saat tahun ajaran diganti (siswa kelas 1 pada tahun sebelumnya otomatis berstatus <span className="underline decoration-amber-300 font-bold">Belum Masuk SD</span>).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Template Rombel Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsTemplateDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 border border-white/25 rounded-xl text-xs font-bold text-white transition-all shadow-sm cursor-pointer"
                title="Unduh Template Excel untuk merubah rombel / kelas siswa aktif"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                <span>Template Rombel</span>
              </button>

              {isTemplateDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-30 animate-fade-in text-slate-800 dark:text-slate-200">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-black text-[#003399] dark:text-blue-400">
                      Format Template Excel (.XLSX)
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Khusus untuk merubah rombel siswa aktif Kelas 1 s/d 6
                    </p>
                  </div>

                  <div className="p-1 space-y-1">
                    <button
                      type="button"
                      onClick={handleDownloadPopulatedTemplate}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors flex items-start gap-2.5 cursor-pointer group"
                    >
                      <Download className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            Terisi Siswa Aktif ({activeStudents.length} Siswa)
                          </p>
                          <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-emerald-500 text-white rounded">
                            Disarankan
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                          NIS, NISN, & Nama otomatis terisi. Cukup isi kolom <strong>Rombel Baru</strong>.
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadBlankTemplate}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-start gap-2.5 cursor-pointer group"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-slate-500 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          Template Kosong (Contoh)
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                          Template format kosong dengan contoh pengisian & lembar petunjuk.
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Menu "Simpan" / Pengunci Rombel di Tahun Ajaran Aktif */}
            {currentRole !== 'umum' && (
              isCurrentTPLocked ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/90 text-white rounded-xl border border-emerald-300/40 shadow-md">
                  <ShieldCheck className="w-4 h-4 text-emerald-200 shrink-0" />
                  <div className="leading-tight">
                    <div className="flex items-center gap-1 font-black text-[11px] text-white">
                      <Lock className="w-3 h-3 text-amber-300" />
                      <span>Rombel Terkunci</span>
                    </div>
                    <span className="text-[9.5px] text-emerald-100 font-mono">
                      TP {activeTP}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleUnlockRombel}
                    className="ml-1 px-2 py-0.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-[10px] font-extrabold transition-all cursor-pointer shadow-xs"
                    title="Buka kunci untuk mengedit rombel siswa kembali"
                  >
                    Buka Kunci
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSaveLockModalOpen(true)}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer hover:shadow-lg active:scale-98",
                    hasDraftEdits
                      ? "bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 ring-2 ring-white/60 animate-pulse"
                      : "bg-emerald-400 hover:bg-emerald-300 text-slate-950"
                  )}
                  title="Simpan & kunci hasil rombel siswa untuk Tahun Pelajaran aktif ini ke Buku Induk"
                >
                  <Save className="w-4 h-4 text-slate-950" />
                  <span>Simpan Rombel</span>
                  {hasDraftEdits && (
                    <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-amber-300 text-[10px] font-black">
                      {draftEditsCount}
                    </span>
                  )}
                </button>
              )
            )}

            {/* Impor Rombel Excel Button */}
            {currentRole !== 'umum' && (
              <button
                type="button"
                onClick={() => setIsImportRombelModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer hover:shadow-lg active:scale-98"
                title="Impor berkas Excel (.xlsx) untuk merubah rombel siswa secara massal"
              >
                <Upload className="w-4 h-4 text-slate-950" />
                <span>Impor Rombel Excel</span>
              </button>
            )}

            {/* Kelola Pilihan Rombel */}
            {currentRole !== 'umum' && (
              <button
                type="button"
                onClick={() => setIsManageClassesOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 border border-white/25 rounded-xl text-xs font-bold text-white transition-all shadow-sm cursor-pointer"
                title="Kelola & edit daftar pilihan kelas/rombel sekolah"
              >
                <Layers className="w-4 h-4 text-amber-300" />
                <span>Kelola Rombel</span>
              </button>
            )}

            <button
              onClick={() => exportStudentsCSV(activeStudents)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 border border-white/25 rounded-xl text-xs font-bold text-white transition-all shadow-sm cursor-pointer"
              title="Unduh Data Siswa Aktif format CSV / Excel"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span>Ekspor Excel</span>
            </button>
            <button
              type="button"
              onClick={() => setIsDownloadRombelModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer hover:shadow-lg active:scale-98"
              title="Unduh data daftar siswa per rombel/kelas ke dalam format .xlsx untuk guru wali kelas"
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-950" />
              <span>Unduh Excel Rombel</span>
            </button>
            <button
              onClick={() => handlePrint(subTab === 'tabel-rombel' ? 'rekap-rombel' : 'daftar-siswa')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer"
              title="Buka menu & pengaturan cetak dokumen resmi (lengkap dengan Kop Surat, pilihan kertas A4/F4, kolom, dan tanda tangan)"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Dokumen</span>
            </button>
          </div>
        </div>

        {/* Quick Stat Pill Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-white/15">
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/15">
            <p className="text-[11px] font-bold text-blue-200">Total Siswa Aktif</p>
            <p className="text-2xl font-black text-white mt-0.5">{totalActive} <span className="text-xs font-normal text-blue-200">Siswa</span></p>
          </div>
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/15">
            <p className="text-[11px] font-bold text-blue-200">Siswa Laki-laki (L)</p>
            <p className="text-2xl font-black text-cyan-300 mt-0.5">{totalLaki} <span className="text-xs font-normal text-blue-200">({persenLaki}%)</span></p>
          </div>
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/15">
            <p className="text-[11px] font-bold text-blue-200">Siswa Perempuan (P)</p>
            <p className="text-2xl font-black text-pink-300 mt-0.5">{totalPerempuan} <span className="text-xs font-normal text-blue-200">({persenPerempuan}%)</span></p>
          </div>
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/15">
            <p className="text-[11px] font-bold text-blue-200">Jumlah Rombel</p>
            <p className="text-2xl font-black text-amber-300 mt-0.5">{availableClasses.length} <span className="text-xs font-normal text-blue-200">Kelas</span></p>
          </div>
        </div>
      </div>

      {/* KARTU RINGKASAN STATISTIK BULANAN SISWA AKTIF PADA DASHBOARD DATA SISWA AKTIF */}
      {subTab !== 'statistik-bulanan' && (
        <MonthlyActiveStudentsSummaryCard
          students={students}
          projectedStudents={projectedStudents}
          activeTP={activeTP}
          activeSemester={activeSemester}
          availableClasses={availableClasses}
          schoolProfile={schoolProfile}
          onSelectDetail={onSelectDetail}
          onEditStudent={onEditStudent}
          onSelectRombelFilter={(rombel) => {
            setSelectedRombel(rombel);
            setSelectedTingkat('ALL');
            setSubTab('daftar');
            setCurrentPage(1);
            setTimeout(() => {
              const el = document.getElementById('daftar-siswa-aktif-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }}
          onSelectTingkatFilter={(tingkat) => {
            setSelectedTingkat(tingkat);
            setSelectedRombel('ALL');
            setSubTab('daftar');
            setCurrentPage(1);
            setTimeout(() => {
              const el = document.getElementById('daftar-siswa-aktif-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }}
        />
      )}

      {/* NAVIGASI TAB MENU UTAMA */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden print:hidden">
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 overflow-x-auto scrollbar-thin">
          {[
            { id: 'daftar', label: 'Daftar Siswa Aktif', icon: Users, badge: totalActive },
            { id: 'edit', label: 'Edit Data Siswa', icon: Edit3 },
            { id: 'mutasi-masuk', label: 'Mutasi Masuk', icon: UserPlus, badge: studentsMutasiMasuk.length },
            { id: 'mutasi-keluar', label: 'Mutasi Keluar', icon: UserMinus, badge: studentsMutasiKeluar.length },
            { id: 'tabel-rombel', label: 'Tabel Siswa per Rombel', icon: Table },
            { id: 'gender', label: 'L / P (Rasio Gender)', icon: BarChart2 },
            { id: 'statistik-bulanan', label: 'Statistik Bulanan (Periodik)', icon: Calendar },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = subTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSubTab(item.id as ActiveStudentsSubTab)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer",
                  isActive
                    ? "border-[#003399] text-[#003399] dark:text-blue-400 bg-white dark:bg-slate-900 shadow-xs"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/40"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-[#003399] dark:text-blue-400" : "text-slate-400")} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-full text-[10px] font-extrabold",
                    isActive ? "bg-blue-100 text-[#003399] dark:bg-blue-950 dark:text-blue-300" : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                  )}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DAFTAR SISWA AKTIF */}
      {/* ========================================================================= */}
      {subTab === 'daftar' && (
        <div id="daftar-siswa-aktif-section" className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 print:hidden">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari nama siswa aktif, NISN, NIS, atau NIK..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Filter Tingkat Kelas */}
              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <span className="text-slate-500 font-medium">Tingkat:</span>
                <select
                  value={selectedTingkat}
                  onChange={(e) => {
                    const newTingkat = e.target.value;
                    setSelectedTingkat(newTingkat);
                    setSelectedRombel('ALL');
                    setCurrentPage(1);
                  }}
                  className="bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
                >
                  <option value="ALL">Semua Tingkat (1-6) • {totalActive} Siswa</option>
                  {[1, 2, 3, 4, 5, 6].map(t => (
                    <option key={`opt-tingkat-${t}`} value={String(t)}>
                      Tingkat {t} (Kelas {t}) • {tingkatCounts[t].total} Siswa
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Rombel Spesifik */}
              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <span className="text-slate-500 font-medium">Rombel:</span>
                <select
                  value={selectedRombel}
                  onChange={(e) => {
                    const rombelVal = e.target.value;
                    setSelectedRombel(rombelVal);
                    if (rombelVal !== 'ALL') {
                      const t = getTingkatKelasNumber(rombelVal);
                      if (t >= 1 && t <= 6) {
                        setSelectedTingkat(String(t));
                      }
                    }
                    setCurrentPage(1);
                  }}
                  className="bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
                >
                  <option value="ALL">
                    {selectedTingkat === 'ALL'
                      ? `Semua Rombel (${availableClasses.length} Kelas)`
                      : `Semua Rombel Tingkat ${selectedTingkat} (${rombelsForSelectedTingkat.length} Kelas)`}
                  </option>
                  {rombelsForSelectedTingkat.map(cls => (
                    <option key={cls} value={cls}>
                      {cls} ({activeStudents.filter(s => s.kelasSekarang === cls).length} Siswa)
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Siswa: Khusus Siswa Aktif (Status selain Aktif disembunyikan) */}
              <div 
                className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 text-xs font-bold shadow-2xs"
                title="Tab ini khusus menampilkan siswa dengan status Aktif. Siswa lulus/mutasi/drop out disembunyikan."
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Status: Aktif ({filteredActiveStudents.length})</span>
              </div>

              {/* Filter Khusus Penerima Bantuan */}
              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setFilterBantuan('ALL');
                    setCurrentPage(1);
                  }}
                  className={cn(
                    "px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer",
                    filterBantuan === 'ALL'
                      ? "bg-[#003399] text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700"
                  )}
                  title="Tampilkan semua siswa"
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilterBantuan(filterBantuan === 'BANTUAN' ? 'ALL' : 'BANTUAN');
                    setCurrentPage(1);
                  }}
                  className={cn(
                    "px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5",
                    filterBantuan === 'BANTUAN'
                      ? "bg-amber-500 text-slate-950 font-black shadow-xs ring-2 ring-amber-300"
                      : "text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                  )}
                  title="Saring khusus siswa aktif yang pernah mendapatkan bantuan"
                >
                  <HandCoins className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Pernah Bantuan ({countPernahBantuan})</span>
                </button>
              </div>

              {/* Filter Gender */}
              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                {(['ALL', 'L', 'P'] as const).map(g => (
                  <button
                    key={g}
                    onClick={() => {
                      setSelectedGender(g);
                      setCurrentPage(1);
                    }}
                    className={cn(
                      "px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer",
                      selectedGender === g
                        ? "bg-[#003399] text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700"
                    )}
                  >
                    {g === 'ALL' ? 'Semua' : g === 'L' ? 'L (Laki-laki)' : 'P (Perempuan)'}
                  </button>
                ))}
              </div>

              {/* Sort Control & Order Button (Sesuai Tombol yang Dipilih) */}
              <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer px-1.5 py-1 text-xs"
                  title="Pilih kolom pengurutan siswa aktif"
                >
                  <option value="nis">Urut: NIS</option>
                  <option value="nama">Urut: Nama</option>
                  <option value="kelas">Urut: Kelas</option>
                  <option value="tanggal">Urut: Tgl Diterima</option>
                </select>
                <button
                  type="button"
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  title={sortOrder === 'asc' ? 'Urutan Menaik (A-Z / 1-9)' : 'Urutan Menurun (Z-A / 9-1)'}
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-[#003399] dark:text-blue-400" />
                </button>
              </div>

              {/* Unduh Excel Rombel Button */}
              {selectedRombel !== 'ALL' ? (
                <div className="flex items-center rounded-xl overflow-hidden shadow-xs border border-emerald-700">
                  <button
                    type="button"
                    onClick={() => handleExportRombelExcel(selectedRombel)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all cursor-pointer transform active:scale-95"
                    title={`Unduh daftar siswa ${selectedRombel} ke format Excel (.xlsx) untuk wali kelas`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh .xlsx ({selectedRombel})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDownloadRombelModalOpen(true)}
                    className="px-2.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold border-l border-emerald-500 transition-colors cursor-pointer"
                    title="Buka menu unduh rombel lain atau unduh semua rombel sekaligus"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsDownloadRombelModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer transform active:scale-95"
                  title="Unduh data siswa berdasarkan rombel tertentu ke dalam format .xlsx untuk wali kelas"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
                  <span>Unduh Excel per Rombel</span>
                </button>
              )}

              {/* Menu Cetak Dokumen Daftar Siswa Aktif */}
              <button
                type="button"
                onClick={() => {
                  setPrintModalMode('daftar-siswa');
                  setIsPrintModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 border-2 border-[#003399] dark:border-blue-500 text-[#003399] dark:text-blue-300 text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer transform active:scale-95 ml-auto"
                title="Buka menu & pengaturan cetak dokumen resmi daftar siswa aktif (kertas A4/F4, kop surat, kolom data, dan per rombel)"
              >
                <Printer className="w-4 h-4 text-[#003399] dark:text-blue-400" />
                <span>Cetak Daftar Siswa</span>
              </button>

              {/* Impor Rombel Excel Shortcut */}
              {currentRole !== 'umum' && (
                <button
                  type="button"
                  onClick={() => setIsImportRombelModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  title="Impor berkas Excel (.xlsx) untuk merubah rombel siswa secara massal"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Impor Rombel Excel</span>
                </button>
              )}

              {/* Tambah Siswa */}
              {currentRole !== 'umum' && (
                <button
                  onClick={onOpenAddModal}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#003399] hover:bg-[#002266] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Tambah Siswa</span>
                </button>
              )}
            </div>

            {/* Quick Grade Filter Chips Bar (Pintasan Tingkat Kelas & Rombel) */}
            <div className="w-full pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-1">
                  <Filter className="w-3.5 h-3.5 text-blue-600" />
                  <span>Pintasan Tingkat:</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTingkat('ALL');
                    setSelectedRombel('ALL');
                    setCurrentPage(1);
                  }}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1",
                    selectedTingkat === 'ALL'
                      ? "bg-[#003399] text-white shadow-xs scale-105"
                      : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                  )}
                >
                  <span>Semua Tingkat</span>
                  <span className={cn(
                    "px-1 py-0.2 rounded text-[9.5px] font-mono",
                    selectedTingkat === 'ALL' ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                  )}>
                    {totalActive}
                  </span>
                </button>
                {[1, 2, 3, 4, 5, 6].map(t => {
                  const isSelected = selectedTingkat === String(t);
                  const count = activeStudents.filter(s => getTingkatKelasNumber(s.kelasSekarang) === t).length;
                  return (
                    <button
                      key={`chip-t-${t}`}
                      type="button"
                      onClick={() => {
                        setSelectedTingkat(String(t));
                        setSelectedRombel('ALL');
                        setCurrentPage(1);
                      }}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5",
                        isSelected
                          ? "bg-blue-600 text-white shadow-xs scale-105"
                          : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                      )}
                    >
                      <span>Tingkat {t}</span>
                      <span className={cn(
                        "px-1.5 py-0.2 rounded-full text-[9.5px] font-mono font-bold",
                        isSelected ? "bg-white/25 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                      )}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Rombel Sub-Chips ketika Tingkat Kelas Tertentu Dipilih */}
              {selectedTingkat !== 'ALL' && rombelsForSelectedTingkat.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pl-6 pt-1 border-l-2 border-blue-400 dark:border-blue-600">
                  <span className="text-[10.5px] font-bold text-blue-700 dark:text-blue-300">
                    Rombel Tingkat {selectedTingkat}:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRombel('ALL');
                      setCurrentPage(1);
                    }}
                    className={cn(
                      "px-2 py-0.5 rounded-md text-[10.5px] font-bold transition-all cursor-pointer",
                      selectedRombel === 'ALL'
                        ? "bg-blue-700 text-white shadow-2xs font-extrabold"
                        : "bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                    )}
                  >
                    Semua Rombel Tingkat {selectedTingkat}
                  </button>
                  {rombelsForSelectedTingkat.map(rombel => {
                    const isRombelActive = selectedRombel === rombel;
                    const studentCountInRombel = activeStudents.filter(s => s.kelasSekarang === rombel).length;
                    return (
                      <button
                        key={`chip-rombel-${rombel}`}
                        type="button"
                        onClick={() => {
                          setSelectedRombel(rombel);
                          setCurrentPage(1);
                        }}
                        className={cn(
                          "px-2.5 py-0.5 rounded-md text-[10.5px] font-bold transition-all cursor-pointer flex items-center gap-1",
                          isRombelActive
                            ? "bg-blue-700 text-white shadow-2xs font-extrabold scale-105"
                            : "bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        )}
                      >
                        <span>{rombel}</span>
                        <span className={cn(
                          "px-1 py-0.1 rounded text-[9px] font-mono",
                          isRombelActive ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                        )}>
                          {studentCountInRombel}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Keterangan Kebijakan Tab: Khusus Siswa Berstatus Aktif */}
            <div className="w-full pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Kebijakan Tampilan:</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                  <span>Hanya siswa berstatus</span>
                  <span className="underline decoration-emerald-500 font-extrabold">Aktif</span>
                  <span>({filteredActiveStudents.length} Siswa)</span>
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  (Status Lulus, Mutasi Keluar, Drop Out, Meninggal, dan Belum Masuk SD disembunyikan dari tab ini)
                </span>
              </div>
            </div>
          </div>

          {/* Table of Active Students */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Success Notification Banner */}
            {saveSuccessNotification && (
              <div className="mx-5 my-3 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-100 flex items-center justify-between gap-3 shadow-xs animate-fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-bold">{saveSuccessNotification}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSaveSuccessNotification(null)}
                  className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            )}

            {/* Draft Edits Pending Alert Banner */}
            {hasDraftEdits && (
              <div className="mx-5 my-3 p-3.5 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/40 dark:to-yellow-950/30 border border-amber-300 dark:border-amber-700 rounded-xl text-xs text-amber-950 dark:text-amber-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm animate-fade-in">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs font-black">
                    <Save className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-extrabold text-amber-950 dark:text-amber-100">
                      Terdapat {draftEditsCount} perubahan rombel siswa yang belum disimpan!
                    </p>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                      Klik menu <strong>"Simpan & Kunci Rombel"</strong> untuk mengunci hasil edit kelas siswa di Tahun Pelajaran {activeTP}.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleResetDraftEdits}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    <span>Batal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSaveLockModalOpen(true)}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan & Kunci ({draftEditsCount})</span>
                  </button>
                </div>
              </div>
            )}

            <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#003399] dark:text-blue-400" />
                  <span>Daftar Siswa Aktif: {filteredActiveStudents.length} Peserta Didik ({itemsPerPage} nomor per halaman)</span>
                </span>

                {/* Lock status pill badge */}
                {isCurrentTPLocked ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 shadow-2xs">
                    <Lock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Terkunci TP {activeTP}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
                    <Unlock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    <span>Mode Terbuka</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {currentRole !== 'umum' && !isCurrentTPLocked && (
                  <button
                    type="button"
                    onClick={() => setIsInlineRombelEditMode(prev => !prev)}
                    className={cn(
                      "px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5",
                      isInlineRombelEditMode
                        ? "bg-amber-500 text-slate-950 border-amber-600 font-black shadow-xs"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100"
                    )}
                    title="Ubah rombel siswa langsung di baris tabel"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isInlineRombelEditMode ? 'Selesai Edit Rombel' : 'Edit Rombel Langsung'}</span>
                  </button>
                )}

                {currentRole !== 'umum' && (
                  isCurrentTPLocked ? (
                    <button
                      type="button"
                      onClick={handleUnlockRombel}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-200 cursor-pointer flex items-center gap-1"
                      title="Buka kunci rombel untuk mengubah rombel siswa"
                    >
                      <Unlock className="w-3 h-3" />
                      <span>Buka Kunci</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsSaveLockModalOpen(true)}
                      className={cn(
                        "px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shadow-xs",
                        hasDraftEdits
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse"
                          : "bg-[#003399] hover:bg-blue-800 text-white"
                      )}
                      title="Simpan dan kunci hasil rombel siswa untuk Tahun Pelajaran aktif ini"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Simpan Rombel</span>
                      {hasDraftEdits && (
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[9.5px]">
                          {draftEditsCount}
                        </span>
                      )}
                    </button>
                  )
                )}

                <span className="text-xs text-slate-500 font-mono ml-1">
                  Halaman {currentPage} dari {totalPages}
                </span>
              </div>
            </div>

            {/* Informative Banner when students have 'Belum Masuk SD' in this school year */}
            {totalBelumMasukSD > 0 && (
              <div className="mx-5 my-3 p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/20 border border-amber-300 dark:border-amber-800 rounded-xl text-xs text-amber-950 dark:text-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-start sm:items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs font-black">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-extrabold text-amber-950 dark:text-amber-100 flex items-center gap-2">
                      <span>Tahun Pelajaran {activeTP}: {totalBelumMasukSD} Siswa Berstatus "Belum Masuk SD"</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-amber-600 text-white font-bold rounded">
                        Otomatis
                      </span>
                    </p>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
                      Siswa kelas 1 pada tahun pelajaran sebelumnya otomatis berstatus <strong>Belum Masuk SD</strong> karena belum terdaftar di SD pada tahun {activeTP}.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTingkat('BELUM_MASUK_SD');
                      setSelectedRombel('ALL');
                      setCurrentPage(1);
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer shadow-xs",
                      selectedTingkat === 'BELUM_MASUK_SD'
                        ? "bg-amber-600 text-white"
                        : "bg-white dark:bg-slate-800 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 hover:bg-amber-100"
                    )}
                  >
                    Filter Belum Masuk SD ({totalBelumMasukSD})
                  </button>
                  {selectedTingkat === 'BELUM_MASUK_SD' && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTingkat('ALL');
                        setSelectedRombel('ALL');
                        setCurrentPage(1);
                      }}
                      className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-lg cursor-pointer"
                    >
                      Tampilkan Semua
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3 text-center w-12">No</th>
                    <th 
                      onClick={() => {
                        if (sortBy === 'nama') {
                          setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('nama');
                          setSortOrder('asc');
                        }
                      }}
                      className="py-3 px-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700/80 transition-colors select-none"
                      title="Klik untuk mengurutkan berdasarkan nama siswa"
                    >
                      <div className="flex items-center gap-1">
                        <span>Siswa</span>
                        <ArrowUpDown className={cn("w-3 h-3", sortBy === 'nama' ? "text-blue-600 dark:text-blue-400" : "text-slate-400 opacity-60")} />
                      </div>
                    </th>
                    <th 
                      onClick={() => {
                        if (sortBy === 'nis') {
                          setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('nis');
                          setSortOrder('asc');
                        }
                      }}
                      className="py-3 px-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700/80 transition-colors select-none"
                      title="Klik untuk mengurutkan berdasarkan NIS"
                    >
                      <div className="flex items-center gap-1">
                        <span>NIS / NISN</span>
                        <ArrowUpDown className={cn("w-3 h-3", sortBy === 'nis' ? "text-blue-600 dark:text-blue-400" : "text-slate-400 opacity-60")} />
                      </div>
                    </th>
                    <th className="py-3 px-3 text-center">L/P</th>
                    <th 
                      onClick={() => {
                        if (sortBy === 'kelas') {
                          setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('kelas');
                          setSortOrder('asc');
                        }
                      }}
                      className="py-3 px-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700/80 transition-colors select-none"
                      title="Klik untuk mengurutkan berdasarkan rombel"
                    >
                      <div className="flex items-center gap-1">
                        <span>Rombel (TP {activeTP})</span>
                        <ArrowUpDown className={cn("w-3 h-3", sortBy === 'kelas' ? "text-blue-600 dark:text-blue-400" : "text-slate-400 opacity-60")} />
                      </div>
                    </th>
                    <th className="py-3 px-3 text-center">Status Siswa</th>
                    <th 
                      onClick={() => {
                        if (sortBy === 'tanggal') {
                          setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('tanggal');
                          setSortOrder('asc');
                        }
                      }}
                      className="py-3 px-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700/80 transition-colors select-none"
                      title="Klik untuk mengurutkan berdasarkan tanggal diterima"
                    >
                      <div className="flex items-center gap-1">
                        <span>Diterima di Kelas</span>
                        <ArrowUpDown className={cn("w-3 h-3", sortBy === 'tanggal' ? "text-blue-600 dark:text-blue-400" : "text-slate-400 opacity-60")} />
                      </div>
                    </th>
                    <th className="py-3 px-3">Pendidikan Asal</th>
                    <th className="py-3 px-3 text-center print:hidden">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-slate-500">
                        <UserCheck className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                        <p className="font-bold text-sm">Tidak ada siswa aktif ditemukan.</p>
                        <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter rombel/gender.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((s, index) => {
                      const rowNum = (currentPage - 1) * itemsPerPage + index + 1;
                      const isBelumMasuk = s.status === 'Belum Masuk SD';
                      return (
                        <tr 
                          key={s.id} 
                          className={cn(
                            "transition-colors group",
                            isBelumMasuk 
                              ? "bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-100/50 dark:hover:bg-amber-900/30" 
                              : "hover:bg-blue-50/50 dark:hover:bg-slate-800/50"
                          )}
                        >
                          <td className="py-3 px-3 text-center font-mono text-slate-500 font-bold">
                            {rowNum}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-3">
                              <div 
                                onClick={() => onSelectDetail(s.id)}
                                className={cn(
                                  "w-9 h-9 rounded-xl font-bold flex items-center justify-center shrink-0 overflow-hidden border cursor-pointer shadow-2xs relative",
                                  isBelumMasuk
                                    ? "bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                                    : "bg-blue-100 dark:bg-blue-950/80 text-[#003399] dark:text-blue-300 border-blue-200 dark:border-blue-900"
                                )}
                                title="Lihat profil detail"
                              >
                                {s.fotoUrl ? (
                                  <img src={s.fotoUrl} alt={s.namaLengkap} className="w-full h-full object-cover" />
                                ) : (
                                  s.namaLengkap.charAt(0)
                                )}
                                {getStudentBantuanInfo(s) && (
                                  <span 
                                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-xs border-2 border-white dark:border-slate-900 z-10"
                                    title="Siswa pernah menerima bantuan pendidikan"
                                  >
                                    <HandCoins className="w-2.5 h-2.5 text-slate-950" />
                                  </span>
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={() => onSelectDetail(s.id)}
                                    className={cn(
                                      "font-bold text-left cursor-pointer transition-colors",
                                      isBelumMasuk
                                        ? "text-amber-950 dark:text-amber-100 hover:text-amber-600"
                                        : "text-slate-900 dark:text-slate-100 hover:text-[#003399] dark:hover:text-blue-400"
                                    )}
                                  >
                                    {s.namaLengkap}
                                  </button>

                                  {/* Tanda Khusus Siswa Pernah Menerima Bantuan */}
                                  {(() => {
                                    const bInfo = getStudentBantuanInfo(s);
                                    if (!bInfo) return null;
                                    return (
                                      <span
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onSelectDetail(s.id);
                                        }}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-100 via-amber-200/70 to-yellow-100 text-amber-950 dark:from-amber-950 dark:via-amber-900/60 dark:to-yellow-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700 shadow-2xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                        title={`Siswa pernah menerima bantuan pendidikan:\n• Program: ${bInfo.programs.join(', ')}${bInfo.latestTahap ? `\n• Tahap/Termin: ${bInfo.latestTahap}` : ''}${bInfo.latestNominal ? `\n• Nominal: ${bInfo.latestNominal}` : ''}\n(Klik untuk lihat profil dan riwayat bantuan)`}
                                      >
                                        <HandCoins className="w-3 h-3 text-amber-700 dark:text-amber-400 shrink-0" />
                                        <span>Penerima Bantuan</span>
                                        {bInfo.totalRecords > 1 && (
                                          <span className="px-1 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black leading-none">
                                            {bInfo.totalRecords}x
                                          </span>
                                        )}
                                      </span>
                                    );
                                  })()}
                                </div>
                                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                  <span>{s.tempatLahir}, {formatIndonesianDate(s.tanggalLahir)}</span>
                                  <span>•</span>
                                  <span>{s.agama}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{s.noInduk}</div>
                            <div className="font-mono text-[11px] text-slate-500">NISN: {s.nisn}</div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={cn(
                              "px-2 py-0.5 rounded-md text-[10px] font-black",
                              s.jenisKelamin === 'L' 
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900" 
                                : "bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300 border border-pink-200 dark:border-pink-900"
                            )}>
                              {s.jenisKelamin === 'L' ? 'L' : 'P'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            {isBelumMasuk ? (
                              <span className="font-extrabold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-700 text-[11px] inline-flex items-center gap-1">
                                <span>Belum Masuk SD</span>
                              </span>
                            ) : isInlineRombelEditMode && currentRole !== 'umum' && !isCurrentTPLocked ? (
                              <div className="flex items-center gap-1.5">
                                <select
                                  value={draftRombelEdits[s.id] || s.kelasSekarang}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setDraftRombelEdits(prev => ({
                                      ...prev,
                                      [s.id]: val,
                                    }));
                                  }}
                                  className={cn(
                                    "px-2 py-1 text-xs font-bold rounded-lg border cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-hidden",
                                    draftRombelEdits[s.id] && draftRombelEdits[s.id] !== s.kelasSekarang
                                      ? "bg-amber-50 dark:bg-amber-950/60 border-amber-400 text-amber-900 dark:text-amber-200"
                                      : "bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-800 text-slate-800 dark:text-slate-200"
                                  )}
                                >
                                  {availableClasses.map(cls => (
                                    <option key={cls} value={cls}>{cls}</option>
                                  ))}
                                </select>
                                {draftRombelEdits[s.id] && draftRombelEdits[s.id] !== s.kelasSekarang && (
                                  <span className="text-[9.5px] font-black px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 whitespace-nowrap shadow-2xs">
                                    Diedit
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <span className={cn(
                                  "font-bold px-2 py-1 rounded-lg border transition-all",
                                  draftRombelEdits[s.id] && draftRombelEdits[s.id] !== s.kelasSekarang
                                    ? "text-amber-900 dark:text-amber-200 bg-amber-100/90 dark:bg-amber-950/80 border-amber-300 dark:border-amber-700 shadow-2xs"
                                    : "text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border-blue-200/60 dark:border-blue-900/60"
                                )}>
                                  {draftRombelEdits[s.id] || s.kelasSekarang}
                                </span>
                                {isCurrentTPLocked && (
                                  <Lock className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" title={`Rombel dikunci pada TP ${activeTP}`} />
                                )}
                                {draftRombelEdits[s.id] && draftRombelEdits[s.id] !== s.kelasSekarang && (
                                  <span className="text-[9.5px] font-black px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 whitespace-nowrap shadow-2xs">
                                    Diedit
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {isBelumMasuk ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700 whitespace-nowrap shadow-2xs">
                                Belum Masuk SD
                              </span>
                            ) : isInlineRombelEditMode && currentRole !== 'umum' && !isCurrentTPLocked ? (
                              <div className="flex items-center justify-center gap-1">
                                <select
                                  value={draftStatusEdits[s.id] || s.status}
                                  onChange={(e) => {
                                    const val = e.target.value as StudentStatus;
                                    setDraftStatusEdits(prev => ({
                                      ...prev,
                                      [s.id]: val,
                                    }));
                                  }}
                                  className={cn(
                                    "px-2 py-1 text-xs font-bold rounded-lg border cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-hidden",
                                    draftStatusEdits[s.id] && draftStatusEdits[s.id] !== s.status
                                      ? "bg-amber-50 dark:bg-amber-950/60 border-amber-400 text-amber-900 dark:text-amber-200"
                                      : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                                  )}
                                >
                                  <option value="Aktif">Aktif</option>
                                  <option value="Lulus">Lulus / Alumni</option>
                                  <option value="Mutasi Keluar">Mutasi Keluar</option>
                                  <option value="Drop Out">Drop Out</option>
                                  <option value="Meninggal">Meninggal</option>
                                </select>
                                {draftStatusEdits[s.id] && draftStatusEdits[s.id] !== s.status && (
                                  <span className="text-[9.5px] font-black px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 whitespace-nowrap shadow-2xs">
                                    Diedit
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1 justify-center">
                                <span className={cn(
                                  "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shadow-2xs",
                                  (draftStatusEdits[s.id] || s.status) === 'Aktif'
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                                    : (draftStatusEdits[s.id] || s.status) === 'Lulus'
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800"
                                    : (draftStatusEdits[s.id] || s.status) === 'Mutasi Keluar'
                                    ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                                    : (draftStatusEdits[s.id] || s.status) === 'Drop Out'
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                                    : (draftStatusEdits[s.id] || s.status) === 'Meninggal'
                                    ? "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700"
                                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300"
                                )}>
                                  {draftStatusEdits[s.id] || s.status}
                                </span>
                                {draftStatusEdits[s.id] && draftStatusEdits[s.id] !== s.status && (
                                  <span className="text-[9.5px] font-black px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 whitespace-nowrap shadow-2xs">
                                    Diedit
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                              {(!s.diterimaDiKelas || s.diterimaDiKelas === '7' || s.diterimaDiKelas === '7A' || s.diterimaDiKelas === '7B' || s.diterimaDiKelas.toLowerCase() === 'kelas 7') ? 'Kelas 1' : s.diterimaDiKelas}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400 max-w-[180px] truncate" title={s.sekolahAsalTK || '-'}>
                            {s.sekolahAsalTK || '-'}
                          </td>
                          <td className="py-3 px-3 text-center print:hidden">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => onSelectDetail(s.id)}
                                className="p-1.5 text-blue-600 hover:text-white hover:bg-[#003399] rounded-lg transition-colors cursor-pointer"
                                title="Buka Profil Lengkap Siswa"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              {getStudentBantuanInfo(s) && currentRole !== 'umum' && (
                                <button
                                  type="button"
                                  onClick={() => onEditStudent(s, 'bantuan')}
                                  className="p-1.5 text-amber-600 hover:text-white hover:bg-amber-600 rounded-lg transition-colors cursor-pointer"
                                  title="Lihat & Kelola Riwayat Bantuan Siswa (Tab 6)"
                                >
                                  <HandCoins className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {currentRole !== 'umum' && (
                                <button
                                  type="button"
                                  onClick={() => onEditStudent(s, 'masuk')}
                                  className="p-1.5 text-amber-600 hover:text-white hover:bg-amber-600 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Siswa & Riwayat Masuk"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => onPrintBukuInduk(s.id)}
                                className="p-1.5 text-slate-600 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                                title="Cetak Lembar Buku Induk"
                              >
                                <BookOpen className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onPrintKartuPelajar(s.id)}
                                className="p-1.5 text-emerald-600 hover:text-white hover:bg-emerald-600 rounded-lg transition-colors cursor-pointer"
                                title="Cetak Kartu Pelajar"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                              </button>
                              {currentRole !== 'umum' && (
                                <button
                                  type="button"
                                  onClick={() => onMutasi(s)}
                                  className="p-1.5 text-rose-600 hover:text-white hover:bg-rose-600 rounded-lg transition-colors cursor-pointer"
                                  title="Proses Mutasi Keluar"
                                >
                                  <UserMinus className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredActiveStudents.length > 0 && (
              <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30 print:hidden text-xs">
                {/* Page Size Selector & Numbers Info */}
                <div className="flex flex-wrap items-center gap-2 text-slate-600 dark:text-slate-400">
                  <span className="font-medium">Tampilkan:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value={30}>30 nomor (Standar)</option>
                    <option value={50}>50 nomor</option>
                    <option value={100}>100 nomor</option>
                    <option value={filteredActiveStudents.length || 300}>Semua ({filteredActiveStudents.length})</option>
                  </select>
                  <span className="text-slate-400">•</span>
                  <span>
                    Menampilkan No. <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> - <strong>{Math.min(currentPage * itemsPerPage, filteredActiveStudents.length)}</strong> dari <strong>{filteredActiveStudents.length}</strong> siswa aktif
                  </span>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Sebelumnya</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }).map((_, i) => {
                        const pageNum = i + 1;
                        if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={cn(
                                "w-7 h-7 text-xs font-bold rounded-lg transition-colors cursor-pointer",
                                currentPage === pageNum
                                  ? "bg-[#003399] text-white shadow-xs"
                                  : "hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                              )}
                            >
                              {pageNum}
                            </button>
                          );
                        }
                        if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                          return <span key={pageNum} className="text-slate-400">...</span>;
                        }
                        return null;
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <span>Selanjutnya</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: EDIT DATA SISWA & RIWAYAT MASUK */}
      {/* ========================================================================= */}
      {subTab === 'edit' && (
        <div className="space-y-4">
          {/* Header & Student Picker */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-amber-500" />
                  <span>Edit Data Siswa & Riwayat Masuk</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sesuaikan informasi siswa aktif, terutama bagian diterima di kelas dan riwayat pendidikan asal.
                </p>
              </div>

              {/* Quick Bulk Update Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <ArrowRightLeft className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-emerald-950 dark:text-emerald-100 flex items-center gap-1.5">
                      <span>Perubahan Rombel Massal via Excel</span>
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 bg-emerald-600 text-white rounded">
                        Cepat
                      </span>
                    </h4>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-0.5">
                      Ingin mengubah atau memindahkan rombel/kelas untuk banyak siswa sekaligus? Gunakan fitur impor Excel.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleDownloadPopulatedTemplate}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                    title="Unduh template Excel terisi data siswa aktif saat ini"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Template Rombel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsImportRombelModalOpen(true)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                    title="Buka jendela unggah dan impor perubahan rombel Excel"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Impor Rombel Excel</span>
                  </button>
                </div>
              </div>

              {/* Student Navigation Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevEditStudent}
                  disabled={!hasPrevEdit}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors cursor-pointer",
                    hasPrevEdit
                      ? "border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
                      : "opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-400"
                  )}
                  title="Pindah ke siswa sebelumnya"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Sebelumnya</span>
                </button>

                <span className="text-xs font-mono font-bold text-[#003399] dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-1 rounded-lg">
                  {editIndex + 1} / {projectedStudents.length}
                </span>

                <button
                  type="button"
                  onClick={handleNextEditStudent}
                  disabled={!hasNextEdit}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors cursor-pointer",
                    hasNextEdit
                      ? "border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
                      : "opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-400"
                  )}
                  title="Pindah ke siswa selanjutnya"
                >
                  <span>Selanjutnya</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Filter Tingkat & Rombel untuk Mempermudah Pencarian Siswa yang Diedit */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-blue-600" />
                <span>Filter Tingkat:</span>
              </span>
              <select
                value={editFilterTingkat}
                onChange={(e) => {
                  const newT = e.target.value;
                  setEditFilterTingkat(newT);
                  setEditFilterRombel('ALL');
                  const matching = projectedStudents.filter(s => {
                    if (newT !== 'ALL' && getTingkatKelasNumber(s.kelasSekarang) !== parseInt(newT, 10)) return false;
                    return true;
                  });
                  if (matching.length > 0) {
                    setSelectedStudentForEditId(matching[0].id);
                  }
                }}
                className="px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Semua Tingkat ({projectedStudents.length} Siswa)</option>
                {[1, 2, 3, 4, 5, 6].map(t => {
                  const cnt = projectedStudents.filter(s => getTingkatKelasNumber(s.kelasSekarang) === t).length;
                  return (
                    <option key={`edit-t-${t}`} value={String(t)}>
                      Tingkat {t} ({cnt} Siswa)
                    </option>
                  );
                })}
              </select>

              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Rombel:</span>
              <select
                value={editFilterRombel}
                onChange={(e) => {
                  const newRombel = e.target.value;
                  setEditFilterRombel(newRombel);
                  const matching = projectedStudents.filter(s => {
                    if (editFilterTingkat !== 'ALL' && getTingkatKelasNumber(s.kelasSekarang) !== parseInt(editFilterTingkat, 10)) return false;
                    if (newRombel !== 'ALL' && s.kelasSekarang !== newRombel) return false;
                    return true;
                  });
                  if (matching.length > 0) {
                    setSelectedStudentForEditId(matching[0].id);
                  }
                }}
                className="px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">
                  {editFilterTingkat === 'ALL'
                    ? `Semua Rombel (${rombelsForEditTingkat.length} Kelas)`
                    : `Semua Rombel Tingkat ${editFilterTingkat} (${rombelsForEditTingkat.length} Kelas)`}
                </option>
                {rombelsForEditTingkat.map(r => {
                  const cnt = projectedStudents.filter(s => s.kelasSekarang === r).length;
                  return (
                    <option key={`edit-r-${r}`} value={r}>
                      {r} ({cnt} Siswa)
                    </option>
                  );
                })}
              </select>

              {(editFilterTingkat !== 'ALL' || editFilterRombel !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setEditFilterTingkat('ALL');
                    setEditFilterRombel('ALL');
                    if (projectedStudents.length > 0) {
                      setSelectedStudentForEditId(projectedStudents[0].id);
                    }
                  }}
                  className="px-2 py-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Reset Filter
                </button>
              )}
            </div>

            {/* Quick Picker Dropdown */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
                Pilih Siswa yang Diedit ({studentsForEditList.length} siswa):
              </label>
              <select
                value={selectedStudentForEditId}
                onChange={(e) => setSelectedStudentForEditId(e.target.value)}
                className="flex-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
              >
                {studentsForEditList.length === 0 ? (
                  <option value="">Tidak ada siswa di rombel ini</option>
                ) : (
                  studentsForEditList.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.namaLengkap} • NIS: {s.noInduk} • [{s.status}] • Kelas: {s.kelasSekarang} (Diterima di: {(!s.diterimaDiKelas || s.diterimaDiKelas === '7' || s.diterimaDiKelas === '7A' || s.diterimaDiKelas === '7B' || s.diterimaDiKelas.toLowerCase() === 'kelas 7') ? 'Kelas 1' : s.diterimaDiKelas})
                    </option>
                  ))
                )}
              </select>

              {selectedStudentForEdit && (
                <button
                  type="button"
                  onClick={() => onEditStudent(selectedStudentForEdit, 'masuk')}
                  className="px-3 py-2 bg-[#003399] hover:bg-[#002266] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
                  title="Buka form edit lengkap pop-up"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Buka Form Modal Lengkap</span>
                </button>
              )}
            </div>
          </div>

          {/* Form Content */}
          {selectedStudentForEdit ? (
            <form onSubmit={handleSaveInlineEdit} className="space-y-4">
              {editSaveSuccess && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center gap-2.5 text-xs font-bold animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Perubahan data siswa dan riwayat penerimaan kelas berhasil disimpan secara permanen!</span>
                </div>
              )}

              {/* CARD 1: Riwayat Masuk & Pendidikan Asal (Fokus Utama Request #3) */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border-2 border-indigo-200 dark:border-indigo-900 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-indigo-100 dark:border-indigo-950">
                  <h4 className="text-sm font-extrabold text-[#003399] dark:text-blue-300 uppercase tracking-wide flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Riwayat Masuk & Pendidikan Asal (Diterima di Kelas)</span>
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                    Sesuai Standar Buku Induk Kemdikbud
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Diterima di Kelas */}
                  <div className="bg-indigo-50/60 dark:bg-indigo-950/30 p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-800">
                    <label className="block text-xs font-black text-indigo-900 dark:text-indigo-200 mb-1">
                      Diterima di Kelas <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      list="list-kelas-saran"
                      value={(!editFormData.diterimaDiKelas || editFormData.diterimaDiKelas === '7' || editFormData.diterimaDiKelas === '7A' || editFormData.diterimaDiKelas === '7B' || editFormData.diterimaDiKelas.toLowerCase() === 'kelas 7') ? 'Kelas 1' : editFormData.diterimaDiKelas}
                      onChange={(e) => setEditFormData({ ...editFormData, diterimaDiKelas: e.target.value })}
                      placeholder="Contoh: Kelas 1, Kelas 2 (Pindahan)..."
                      className="w-full px-3 py-2 text-xs font-bold rounded-lg border-2 border-indigo-400 dark:border-indigo-600 bg-white dark:bg-slate-800 text-indigo-900 dark:text-indigo-200 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      required
                    />
                    <datalist id="list-kelas-saran">
                      {availableClasses.map(c => (
                        <option key={c} value={c} />
                      ))}
                      <option value="Kelas 1 (Siswa Baru)" />
                      <option value="Kelas 2 (Pindahan)" />
                      <option value="Kelas 3 (Pindahan)" />
                      <option value="Kelas 4 (Pindahan)" />
                      <option value="Kelas 5 (Pindahan)" />
                      <option value="Kelas 6 (Pindahan)" />
                    </datalist>

                    <div className="flex flex-wrap items-center gap-1 mt-2">
                      <span className="text-[10px] text-slate-500 font-bold">Pintasan:</span>
                      <button
                        type="button"
                        onClick={() => setEditFormData({ ...editFormData, diterimaDiKelas: editFormData.kelasSekarang || 'Kelas 1' })}
                        className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 rounded font-semibold cursor-pointer hover:bg-blue-200"
                        title="Samakan dengan kelas sekarang"
                      >
                        = Kelas Sekarang
                      </button>
                      {['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'].map(k => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setEditFormData({ ...editFormData, diterimaDiKelas: k })}
                          className="text-[10px] px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-semibold cursor-pointer hover:bg-slate-300"
                        >
                          {k}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tanggal Diterima */}
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Diterima Tanggal
                    </label>
                    <input
                      type="date"
                      value={editFormData.tanggalDiterima || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, tanggalDiterima: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Tanggal pendaftaran / resmi masuk
                    </span>
                  </div>

                  {/* Tahun Masuk */}
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tahun Masuk
                    </label>
                    <input
                      type="text"
                      value={editFormData.tahunMasuk || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, tahunMasuk: e.target.value })}
                      placeholder="Contoh: 2024 atau 2025"
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Tahun kalender pertama kali terdaftar
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Sekolah Asal */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Pendidikan Asal (TK / PAUD / RA / SD Pindahan)
                    </label>
                    <input
                      type="text"
                      value={editFormData.sekolahAsalTK || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, sekolahAsalTK: e.target.value })}
                      placeholder="Contoh: TK Pertiwi Sungai Buluh / SD Negeri 001..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>

                  {/* No Ijazah TK / SKTB */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nomor Ijazah / SKTB TK / Asal
                    </label>
                    <input
                      type="text"
                      value={editFormData.noIjazahTK || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, noIjazahTK: e.target.value })}
                      placeholder="Contoh: TK-1409-2024-..."
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* CARD 2: Identitas & Kelas Sekarang */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <span>Identitas Pokok Siswa & Kelas Sekarang</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Lengkap Siswa <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editFormData.namaLengkap || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, namaLengkap: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Kelas Sekarang <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsManageClassesOpen(true)}
                        className="text-[10.5px] text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                        title="Kelola & edit daftar pilihan kelas/rombel"
                      >
                        ⚙️ Kelola Pilihan Kelas
                      </button>
                    </div>
                    <select
                      value={editFormData.kelasSekarang || 'Kelas 1'}
                      onChange={(e) => setEditFormData({ ...editFormData, kelasSekarang: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-blue-800 dark:text-blue-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
                    >
                      {availableClasses.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Jenis Kelamin <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={editFormData.jenisKelamin || 'L'}
                      onChange={(e) => setEditFormData({ ...editFormData, jenisKelamin: e.target.value as Gender })}
                      className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 cursor-pointer"
                    >
                      <option value="L">Laki-laki (L)</option>
                      <option value="P">Perempuan (P)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Status Siswa (Buku Induk) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={editFormData.status || 'Aktif'}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as StudentStatus })}
                      className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 cursor-pointer"
                    >
                      <option value="Aktif">Aktif (Terdaftar Aktif Belajar)</option>
                      <option value="Lulus">Lulus (Tamat Belajar / Alumni)</option>
                      <option value="Mutasi Keluar">Mutasi Keluar (Pindah Sekolah)</option>
                      <option value="Drop Out">Drop Out (Berhenti Sekolah)</option>
                      <option value="Meninggal">Meninggal Dunia</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nomor Induk (NIS)
                    </label>
                    <input
                      type="text"
                      value={editFormData.noInduk || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, noInduk: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      NISN
                    </label>
                    <input
                      type="text"
                      value={editFormData.nisn || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, nisn: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tempat Lahir
                    </label>
                    <input
                      type="text"
                      value={editFormData.tempatLahir || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, tempatLahir: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tanggal Lahir
                    </label>
                    <input
                      type="date"
                      value={editFormData.tanggalLahir || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, tanggalLahir: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onSelectDetail(selectedStudentForEdit.id)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Lihat Profil Detail
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#003399] hover:bg-[#002266] text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
                >
                  <Save className="w-4 h-4 text-amber-300" />
                  <span>Simpan Perubahan Siswa</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <p className="text-slate-500 font-bold">Tidak ada data siswa aktif yang dipilih.</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MUTASI MASUK (Incoming Transfer) */}
      {/* ========================================================================= */}
      {subTab === 'mutasi-masuk' && (
        <div className="space-y-6">
          {mutasiMasukSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center gap-2.5 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Siswa mutasi masuk berhasil didaftarkan ke Data Siswa Aktif dan tercatat dalam buku induk register!</span>
            </div>
          )}

          {/* Form Penerimaan Mutasi Masuk */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-[#003399] dark:text-blue-300 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                  <span>Penerimaan Siswa Mutasi Masuk (Pindahan)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Catat siswa baru pindahan dari sekolah/madrasah lain ke Tahun Ajaran Aktif <strong className="text-blue-700 dark:text-blue-300">{activeTP}</strong>.
                </p>
              </div>
              <span className="px-2.5 py-1 text-xs font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 rounded-full">
                Siswa Masuk Baru
              </span>
            </div>

            <form onSubmit={handleSubmitMutasiMasuk} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Lengkap Siswa Pindahan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={mutasiMasukForm.namaLengkap}
                    onChange={(e) => setMutasiMasukForm({ ...mutasiMasukForm, namaLengkap: e.target.value })}
                    placeholder="Contoh: Muhammad Rizki Pratama"
                    className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Jenis Kelamin <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={mutasiMasukForm.jenisKelamin}
                    onChange={(e) => setMutasiMasukForm({ ...mutasiMasukForm, jenisKelamin: e.target.value as Gender })}
                    className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 cursor-pointer"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Sekolah Asal Pindahan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={mutasiMasukForm.sekolahAsal}
                    onChange={(e) => setMutasiMasukForm({ ...mutasiMasukForm, sekolahAsal: e.target.value })}
                    placeholder="Contoh: SD Negeri 002 Singingi"
                    className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Diterima di Tingkat Kelas <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={mutasiMasukForm.diterimaDiKelas}
                    onChange={(e) => setMutasiMasukForm({ ...mutasiMasukForm, diterimaDiKelas: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-bold rounded-lg border-2 border-blue-500 bg-white dark:bg-slate-800 text-blue-900 dark:text-blue-300 cursor-pointer"
                  >
                    {availableClasses.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Resmi Masuk
                  </label>
                  <input
                    type="date"
                    value={mutasiMasukForm.tanggalMasuk}
                    onChange={(e) => setMutasiMasukForm({ ...mutasiMasukForm, tanggalMasuk: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    No. Surat Keterangan Pindah Asal
                  </label>
                  <input
                    type="text"
                    value={mutasiMasukForm.noSuratPindah}
                    onChange={(e) => setMutasiMasukForm({ ...mutasiMasukForm, noSuratPindah: e.target.value })}
                    placeholder="Contoh: 421.2/SDN-02/SKP/..."
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Alasan Pindah
                  </label>
                  <input
                    type="text"
                    value={mutasiMasukForm.alasanPindah}
                    onChange={(e) => setMutasiMasukForm({ ...mutasiMasukForm, alasanPindah: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Orang Tua / Ayah & No HP
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      value={mutasiMasukForm.namaAyah}
                      onChange={(e) => setMutasiMasukForm({ ...mutasiMasukForm, namaAyah: e.target.value })}
                      placeholder="Nama Ayah"
                      className="w-full px-2 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                    <input
                      type="text"
                      value={mutasiMasukForm.noHpOrtu}
                      onChange={(e) => setMutasiMasukForm({ ...mutasiMasukForm, noHpOrtu: e.target.value })}
                      placeholder="0812..."
                      className="w-full px-2 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-amber-300" />
                  <span>Daftarkan Siswa Mutasi Masuk</span>
                </button>
              </div>
            </form>
          </div>

          {/* Tabel Riwayat Siswa Mutasi Masuk */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>
                  {filterMutasiOnlyActiveYear 
                    ? `Daftar Siswa Mutasi Masuk TP ${activeTP} (${studentsMutasiMasuk.length} Siswa)` 
                    : `Daftar Siswa Mutasi Masuk (Semua Tahun) (${studentsMutasiMasuk.length} Siswa)`}
                </span>
              </h4>
              <div className="flex flex-wrap items-center gap-2">
                {/* Tombol Lihat Semua Tahun / Hanya Tahun Aktif */}
                <button
                  type="button"
                  onClick={() => setFilterMutasiOnlyActiveYear(!filterMutasiOnlyActiveYear)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-extrabold rounded-xl border transition-all flex items-center gap-1.5 shadow-xs cursor-pointer",
                    filterMutasiOnlyActiveYear
                      ? "bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-slate-700"
                      : "bg-[#003399] hover:bg-[#002266] text-white border-transparent"
                  )}
                  title={filterMutasiOnlyActiveYear ? "Lihat seluruh siswa mutasi masuk dari semua tahun pelajaran" : "Saring hanya untuk tahun pelajaran aktif"}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{filterMutasiOnlyActiveYear ? 'Lihat Semua Tahun' : 'Hanya Tahun Aktif'}</span>
                </button>

                <span className="px-2.5 py-1 text-[11px] font-extrabold bg-blue-100 text-[#003399] dark:bg-blue-950 dark:text-blue-300 rounded-full flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Tahun Ajar Aktif: {activeTP}</span>
                </span>
              </div>
            </div>

            {/* Banner Status Filter Tahun Ajar Aktif / Semua Tahun */}
            <div className={cn(
              "px-5 py-2.5 border-b flex flex-col md:flex-row md:items-center justify-between gap-3",
              filterMutasiOnlyActiveYear 
                ? "bg-blue-50/70 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900/50" 
                : "bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50"
            )}>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                <span className={cn(
                  "font-extrabold flex items-center gap-1",
                  filterMutasiOnlyActiveYear ? "text-blue-900 dark:text-blue-300" : "text-amber-900 dark:text-amber-300"
                )}>
                  <Filter className="w-3.5 h-3.5" />
                  <span>Mode Tampilan:</span>
                </span>
                {filterMutasiOnlyActiveYear ? (
                  <>
                    <span>
                      Hanya menampilkan mutasi masuk pada Tahun Ajar Aktif (<strong>{activeTP}</strong>). Selain tahun itu disembunyikan.
                    </span>
                    {hiddenMutasiMasukCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                        {hiddenMutasiMasukCount} siswa mutasi tahun lain disembunyikan
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-amber-900 dark:text-amber-200">
                      Menampilkan mutasi masuk dari <strong>Semua Tahun Pelajaran</strong> ({studentsMutasiMasuk.length} total siswa).
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[10px] font-bold">
                      {activeYearMutasiMasukStudents.length} siswa pada TP {activeTP}
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setFilterMutasiOnlyActiveYear(!filterMutasiOnlyActiveYear)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 shadow-xs cursor-pointer",
                    filterMutasiOnlyActiveYear
                      ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                      : "bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-600"
                  )}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{filterMutasiOnlyActiveYear ? 'Lihat Semua Tahun' : 'Hanya Tahun Aktif (2026/2027)'}</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3 text-center w-10">No</th>
                    <th className="py-2.5 px-3">Nama Siswa</th>
                    <th className="py-2.5 px-3">NIS / NISN</th>
                    <th className="py-2.5 px-3">Tahun Ajar Masuk</th>
                    <th className="py-2.5 px-3">Sekolah Asal Pindahan</th>
                    <th className="py-2.5 px-3">Diterima di Kelas</th>
                    <th className="py-2.5 px-3">Kelas Sekarang</th>
                    <th className="py-2.5 px-3">Tanggal Diterima</th>
                    <th className="py-2.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {studentsMutasiMasuk.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-slate-500">
                        {filterMutasiOnlyActiveYear ? (
                          <div className="space-y-2">
                            <p className="font-semibold">Tidak ada siswa mutasi masuk pada Tahun Ajar Aktif ({activeTP}).</p>
                            {hiddenMutasiMasukCount > 0 && (
                              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                ({hiddenMutasiMasukCount} siswa mutasi dari tahun pelajaran lain disembunyikan sesuai kebijakan tahun aktif)
                              </p>
                            )}
                            {hiddenMutasiMasukCount > 0 && (
                              <div className="pt-1">
                                <button
                                  type="button"
                                  onClick={() => setFilterMutasiOnlyActiveYear(false)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950 dark:hover:bg-blue-900 dark:text-blue-300 text-xs font-bold rounded-lg border border-blue-200 dark:border-blue-800 cursor-pointer transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Lihat Semua Tahun ({allMutasiMasukStudents.length} siswa)</span>
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="font-semibold">Belum ada riwayat siswa mutasi masuk yang terdaftar.</p>
                        )}
                      </td>
                    </tr>
                  ) : (
                    studentsMutasiMasuk.map((s, idx) => {
                      const studentTP = getAcademicYearFromDate(s.tanggalDiterima) || (s.tahunMasuk ? `${s.tahunMasuk}/${parseInt(s.tahunMasuk) + 1}` : activeTP);
                      const isCurrentTP = studentTP === activeTP;
                      return (
                        <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-2.5 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">{s.namaLengkap}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300">{s.noInduk} / {s.nisn}</td>
                          <td className="py-2.5 px-3">
                            <span className={cn(
                              "px-2 py-0.5 rounded-md font-mono font-bold text-[10px]",
                              isCurrentTP 
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800" 
                                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            )}>
                              TP {studentTP}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">{s.sekolahAsalTK || '-'}</td>
                          <td className="py-2.5 px-3 font-bold text-indigo-700 dark:text-indigo-300">{(!s.diterimaDiKelas || s.diterimaDiKelas === '7' || s.diterimaDiKelas === '7A' || s.diterimaDiKelas === '7B' || s.diterimaDiKelas.toLowerCase() === 'kelas 7') ? 'Kelas 1' : s.diterimaDiKelas}</td>
                          <td className="py-2.5 px-3 font-bold text-blue-700 dark:text-blue-300">{s.kelasSekarang}</td>
                          <td className="py-2.5 px-3 text-slate-500">{formatIndonesianDate(s.tanggalDiterima)}</td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => onSelectDetail(s.id)}
                              className="px-2 py-1 text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                            >
                              Detail
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MUTASI KELUAR (Outgoing Transfer) */}
      {/* ========================================================================= */}
      {subTab === 'mutasi-keluar' && (
        <div className="space-y-6">
          {mutasiKeluarSuccess && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-center gap-2.5 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Siswa berhasil diproses Mutasi Keluar. Status siswa kini diperbarui menjadi 'Mutasi Keluar' dan surat keterangan siap dicetak!</span>
            </div>
          )}

          {/* Form Pemrosesan Mutasi Keluar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                  <UserMinus className="w-5 h-5" />
                  <span>Pemrosesan Siswa Mutasi Keluar</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Proses kepindahan peserta didik aktif ke sekolah lain dengan penerbitan nomor surat pindah resmi.
                </p>
              </div>
              <span className="px-2.5 py-1 text-xs font-extrabold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 rounded-full">
                Siswa Keluar / Pindah
              </span>
            </div>

            <form onSubmit={handleProcessMutasiKeluar} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Pilih Siswa Aktif yang Akan Pindah <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedStudentForMutasiKeluarId}
                    onChange={(e) => setSelectedStudentForMutasiKeluarId(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold rounded-lg border-2 border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 cursor-pointer focus:ring-2 focus:ring-rose-500"
                    required
                  >
                    <option value="">-- Pilih Peserta Didik Aktif --</option>
                    {activeStudents.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.namaLengkap} • NIS: {s.noInduk} • {s.kelasSekarang}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Sekolah Tujuan Kepindahan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={mutasiKeluarData.sekolahTujuan || ''}
                    onChange={(e) => setMutasiKeluarData({ ...mutasiKeluarData, sekolahTujuan: e.target.value })}
                    placeholder="Contoh: SD Negeri 010 Pekanbaru"
                    className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tanggal Pindah / Meninggalkan Sekolah
                  </label>
                  <input
                    type="date"
                    value={mutasiKeluarData.tglMeninggalkan || ''}
                    onChange={(e) => setMutasiKeluarData({ ...mutasiKeluarData, tglMeninggalkan: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Dari Tingkat Kelas
                  </label>
                  <input
                    type="text"
                    value={mutasiKeluarData.dariKelas || ''}
                    onChange={(e) => setMutasiKeluarData({ ...mutasiKeluarData, dariKelas: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-blue-900 dark:text-blue-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nomor Surat Pindah Sekolah
                  </label>
                  <input
                    type="text"
                    value={mutasiKeluarData.noSuratPindah || ''}
                    onChange={(e) => setMutasiKeluarData({ ...mutasiKeluarData, noSuratPindah: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Alasan Kepindahan Siswa
                </label>
                <input
                  type="text"
                  value={mutasiKeluarData.alasanPindah || ''}
                  onChange={(e) => setMutasiKeluarData({ ...mutasiKeluarData, alasanPindah: e.target.value })}
                  placeholder="Contoh: Mengikuti perpindahan tugas domisili orang tua"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={!selectedStudentForMutasiKeluarId}
                  className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <UserMinus className="w-4 h-4" />
                  <span>Proses & Terbitkan Mutasi Keluar</span>
                </button>
              </div>
            </form>
          </div>

          {/* Tabel Riwayat Siswa Mutasi Keluar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <UserMinus className="w-4 h-4 text-rose-600" />
                <span>Riwayat Siswa Mutasi Keluar ({studentsMutasiKeluar.length} Siswa)</span>
              </h4>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 text-[11px] font-extrabold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 rounded-full flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span>Tahun Ajar Aktif: {activeTP}</span>
                </span>
              </div>
            </div>

            {/* Banner Status Filter Tahun Ajar Aktif */}
            <div className="px-5 py-2.5 bg-rose-50/60 dark:bg-rose-950/30 border-b border-rose-100 dark:border-rose-900/50 flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                <span className="font-bold text-rose-800 dark:text-rose-300">Kebijakan Tampilan:</span>
                <span>
                  {filterMutasiOnlyActiveYear 
                    ? `Hanya menampilkan mutasi keluar pada Tahun Ajar Aktif (${activeTP}). Selain tahun itu disembunyikan.`
                    : `Menampilkan seluruh riwayat siswa mutasi keluar (Semua Tahun).`}
                </span>
                {hiddenMutasiKeluarCount > 0 && filterMutasiOnlyActiveYear && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                    {hiddenMutasiKeluarCount} mutasi tahun lain disembunyikan
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setFilterMutasiOnlyActiveYear(!filterMutasiOnlyActiveYear)}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-800 text-rose-800 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/50 transition-colors cursor-pointer self-start md:self-auto shrink-0"
              >
                {filterMutasiOnlyActiveYear ? 'Lihat Semua Tahun' : `Hanya Tahun Aktif (${activeTP})`}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3 text-center w-10">No</th>
                    <th className="py-2.5 px-3">Nama Siswa</th>
                    <th className="py-2.5 px-3">NIS / NISN</th>
                    <th className="py-2.5 px-3">Tahun Ajar Mutasi</th>
                    <th className="py-2.5 px-3">Dari Kelas</th>
                    <th className="py-2.5 px-3">Sekolah Tujuan</th>
                    <th className="py-2.5 px-3">Tanggal Pindah</th>
                    <th className="py-2.5 px-3">Alasan Pindah</th>
                    <th className="py-2.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {studentsMutasiKeluar.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-slate-500">
                        {filterMutasiOnlyActiveYear 
                          ? `Tidak ada siswa yang dimutasi keluar pada Tahun Ajar Aktif (${activeTP}).` 
                          : 'Belum ada siswa yang dimutasi keluar.'}
                        {hiddenMutasiKeluarCount > 0 && filterMutasiOnlyActiveYear && (
                          <div className="mt-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                            ({hiddenMutasiKeluarCount} siswa dimutasi di tahun pelajaran selain {activeTP} disembunyikan sesuai filter aktif)
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : (
                    studentsMutasiKeluar.map((s, idx) => {
                      const mutasiTP = s.mutasi?.tahunAjaran || getAcademicYearFromDate(s.mutasi?.tglMeninggalkan) || getAcademicYearFromDate(s.mutasi?.dikeluarkanTanggal) || activeTP;
                      const isCurrentTP = mutasiTP === activeTP;
                      return (
                        <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-2.5 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">{s.namaLengkap}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300">{s.noInduk} / {s.nisn}</td>
                          <td className="py-2.5 px-3">
                            <span className={cn(
                              "px-2 py-0.5 rounded-md font-mono font-bold text-[10px]",
                              isCurrentTP 
                                ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800" 
                                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            )}>
                              TP {mutasiTP}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-bold text-blue-700 dark:text-blue-300">{s.mutasi?.dariKelas || s.kelasSekarang}</td>
                          <td className="py-2.5 px-3 font-bold text-rose-700 dark:text-rose-400">{s.mutasi?.sekolahTujuan || '-'}</td>
                          <td className="py-2.5 px-3 text-slate-500">{formatIndonesianDate(s.mutasi?.tglMeninggalkan)}</td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{s.mutasi?.alasanPindah || '-'}</td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => onSelectDetail(s.id)}
                              className="px-2 py-1 text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                            >
                              Detail
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: TABEL JUMLAH SISWA PER ROMBEL */}
      {/* ========================================================================= */}
      {subTab === 'tabel-rombel' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Table className="w-5 h-5 text-[#003399] dark:text-blue-400" />
                  <span>Tabel Rekapitulasi Jumlah Siswa per Rombel</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Distribusi siswa aktif per rombongan belajar (rombel), rincian gender L/P, dan wali kelas untuk Tahun Ajaran <strong className="text-blue-700 dark:text-blue-300">{activeTP}</strong>.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setHideEmptyRombel(prev => !prev)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer shadow-xs",
                    hideEmptyRombel
                      ? "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800"
                      : "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-200"
                  )}
                  title={hideEmptyRombel ? "Klik untuk menampilkan semua rombel termasuk yang 0 siswa" : "Klik untuk menyembunyikan rombel yang tidak ada siswanya atau 0"}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>
                    {hideEmptyRombel
                      ? `Sembunyikan Rombel Kosong / 0 (${emptyRombelCount})`
                      : 'Tampilkan Semua Rombel'}
                  </span>
                </button>
                {currentRole !== 'umum' && (
                  isCurrentTPLocked ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-bold">
                      <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Rombel TP {activeTP} Terkunci</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsSaveLockModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                      title="Simpan & kunci hasil rombel siswa untuk Tahun Pelajaran aktif ini ke Buku Induk"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Simpan Rombel</span>
                    </button>
                  )
                )}
                {currentRole !== 'umum' && (
                  <button
                    type="button"
                    onClick={() => handleOpenEditWaliKelas()}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl shadow-xs transition-colors cursor-pointer"
                    title="Beri akses edit nama wali kelas dan NIP untuk semua rombel"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-950" />
                    <span>Edit Data Wali Kelas</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsDownloadRombelModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  title="Unduh berkas Excel (.xlsx) daftar siswa per rombel atau seluruh rombel untuk wali kelas"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Unduh Excel per Rombel</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPrintModalMode('rekap-rombel');
                    setIsPrintModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#003399] hover:bg-[#002266] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  title="Buka pilihan pengaturan cetak rekapitulasi rombel (kertas A4/F4, kop surat, tanda tangan)"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Rekap Rombel</span>
                </button>
              </div>
            </div>

            {/* Filter Tingkat Kelas untuk Rekapitulasi Rombel */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-blue-600" />
                <span>Filter Tingkat:</span>
              </span>
              <button
                type="button"
                onClick={() => setRekapFilterTingkat('ALL')}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  rekapFilterTingkat === 'ALL'
                    ? "bg-[#003399] text-white shadow-xs font-extrabold"
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                )}
              >
                Semua Tingkat
              </button>
              {[1, 2, 3, 4, 5, 6].map(t => (
                <button
                  key={`rekap-t-${t}`}
                  type="button"
                  onClick={() => setRekapFilterTingkat(String(t))}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    rekapFilterTingkat === String(t)
                      ? "bg-blue-600 text-white shadow-xs font-extrabold"
                      : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  )}
                >
                  Tingkat {t}
                </button>
              ))}
            </div>

            {/* Rombel Table */}
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#003399] text-white font-extrabold uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-3 text-center w-12 border border-blue-900">No</th>
                    <th className="py-3 px-4 border border-blue-900">Rombongan Belajar (Kelas)</th>
                    <th className="py-3 px-4 border border-blue-900">Nama Wali Kelas</th>
                    <th className="py-3 px-3 text-center w-24 border border-blue-900 bg-blue-800">Laki-laki (L)</th>
                    <th className="py-3 px-3 text-center w-24 border border-blue-900 bg-pink-900">Perempuan (P)</th>
                    <th className="py-3 px-3 text-center w-28 border border-blue-900 bg-amber-600">Total Siswa</th>
                    <th className="py-3 px-3 text-center w-24 border border-blue-900">% dari Total</th>
                    <th className="py-3 px-3 text-center w-36 border border-blue-900 bg-emerald-800">Unduh Data (.xlsx)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 font-medium">
                  {visibleRombelStats.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        Tidak ada rombel yang memiliki siswa aktif pada Tahun Ajar {activeTP}.
                        {emptyRombelCount > 0 && hideEmptyRombel && (
                          <div className="mt-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                            ({emptyRombelCount} rombel dengan 0 siswa disembunyikan)
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : (
                    visibleRombelStats.map((item) => (
                      <tr key={item.kelas} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3 text-center font-bold text-slate-500 font-mono border-r border-slate-200 dark:border-slate-700">
                          {item.no}
                        </td>
                        <td className="py-3 px-4 font-extrabold text-blue-900 dark:text-blue-300 border-r border-slate-200 dark:border-slate-700">
                          {item.kelas}
                        </td>
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700">
                          <div className="flex items-center justify-between gap-2 group">
                            <div>
                              <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                <span>{item.waliKelas}</span>
                                {schoolProfile.waliKelasMap?.[item.kelas] && (
                                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-blue-100 text-[#003399] dark:bg-blue-950 dark:text-blue-300 rounded">
                                    Kustom
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">NIP: {item.nipWaliKelas}</div>
                            </div>
                            {currentRole !== 'umum' && (
                              <button
                                type="button"
                                onClick={() => handleOpenEditWaliKelas(item.kelas)}
                                className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:text-white hover:bg-amber-500 transition-all opacity-80 group-hover:opacity-100 cursor-pointer shadow-2xs hover:shadow-sm shrink-0"
                                title={`Edit Nama Wali Kelas & NIP untuk ${item.kelas}`}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-blue-700 dark:text-blue-400 border-r border-slate-200 dark:border-slate-700 bg-blue-50/30 dark:bg-blue-950/20 font-mono text-sm">
                          {item.jmlL}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-pink-700 dark:text-pink-400 border-r border-slate-200 dark:border-slate-700 bg-pink-50/30 dark:bg-pink-950/20 font-mono text-sm">
                          {item.jmlP}
                        </td>
                        <td className="py-3 px-3 text-center font-black text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-700 bg-amber-50/40 dark:bg-amber-950/20 font-mono text-base">
                          {item.total}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-600 dark:text-slate-400 font-mono border-r border-slate-200 dark:border-slate-700">
                          {item.persentase}%
                        </td>
                        <td className="py-2.5 px-3 text-center border-r border-slate-200 dark:border-slate-700 bg-emerald-50/20 dark:bg-emerald-950/10">
                          <button
                            type="button"
                            onClick={() => handleExportRombelExcel(item.kelas)}
                            disabled={item.total === 0}
                            className={cn(
                              "inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer",
                              item.total > 0
                                ? "bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-xs"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-60"
                            )}
                            title={item.total > 0 ? `Unduh daftar siswa ${item.kelas} format Excel (.xlsx) untuk Wali Kelas` : 'Rombel ini belum memiliki siswa'}
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Unduh .xlsx</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-black text-xs border-t-2 border-slate-300 dark:border-slate-600">
                    <td colSpan={3} className="py-3.5 px-4 text-right uppercase tracking-wider border-r border-slate-200 dark:border-slate-700">
                      JUMLAH KESELURUHAN (TOTAL):
                    </td>
                    <td className="py-3.5 px-3 text-center text-blue-700 dark:text-blue-300 border-r border-slate-200 dark:border-slate-700 font-mono text-base bg-blue-100/60 dark:bg-blue-950/50">
                      {totalLaki}
                    </td>
                    <td className="py-3.5 px-3 text-center text-pink-700 dark:text-pink-300 border-r border-slate-200 dark:border-slate-700 font-mono text-base bg-pink-100/60 dark:bg-pink-950/50">
                      {totalPerempuan}
                    </td>
                    <td className="py-3.5 px-3 text-center text-slate-950 dark:text-white border-r border-slate-200 dark:border-slate-700 font-mono text-lg bg-amber-300/80 dark:bg-amber-500/30">
                      {totalActive}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-xs border-r border-slate-200 dark:border-slate-700">
                      100%
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-xs text-slate-400">
                      -
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Tingkat 1 to 6 Consolidated Summary Table */}
            <div className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase text-[#003399] dark:text-blue-300 tracking-wider flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-amber-500" />
                  <span>Rekapitulasi Konsolidasi per Tingkat Kelas (Tingkat 1 s/d 6)</span>
                </h4>
                <span className="text-[11px] font-bold text-slate-500">
                  Total 6 Tingkat Pendidikan Dasar
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-800 text-white font-extrabold uppercase text-[11px] tracking-wider">
                      <th className="py-2.5 px-3 text-center w-12 border border-slate-700">Tingkat</th>
                      <th className="py-2.5 px-4 border border-slate-700">Tingkat Pendidikan</th>
                      <th className="py-2.5 px-3 text-center border border-slate-700">Rombel Variabel Terdaftar</th>
                      <th className="py-2.5 px-3 text-center w-24 border border-slate-700 bg-blue-900">Laki-laki (L)</th>
                      <th className="py-2.5 px-3 text-center w-24 border border-slate-700 bg-pink-950">Perempuan (P)</th>
                      <th className="py-2.5 px-3 text-center w-28 border border-slate-700 bg-amber-700">Total Siswa</th>
                      <th className="py-2.5 px-3 text-center w-24 border border-slate-700">% dari Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700 font-medium">
                    {visibleTingkatStats.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500">
                          Tidak ada tingkat kelas yang memiliki siswa aktif.
                        </td>
                      </tr>
                    ) : (
                      visibleTingkatStats.map((ts) => {
                        const rombelsToShow = hideEmptyRombel
                          ? ts.rombels.filter(r => activeStudents.some(s => s.kelasSekarang === r))
                          : ts.rombels;
                        return (
                          <tr key={`ts-${ts.tingkat}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-2.5 px-3 text-center font-bold text-slate-500 font-mono border-r border-slate-200 dark:border-slate-700">
                              {ts.tingkat}
                            </td>
                            <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-700">
                              {ts.label}
                            </td>
                            <td className="py-2.5 px-3 text-center border-r border-slate-200 dark:border-slate-700">
                              <div className="flex flex-wrap items-center justify-center gap-1">
                                {rombelsToShow.length > 0 ? (
                                  rombelsToShow.map(r => (
                                    <span key={r} className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[10px] font-bold">
                                      {r}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[10px] text-slate-400 italic">Tidak ada</span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-blue-700 dark:text-blue-400 border-r border-slate-200 dark:border-slate-700 bg-blue-50/20 dark:bg-blue-950/10 font-mono">
                              {ts.jmlL}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-pink-700 dark:text-pink-400 border-r border-slate-200 dark:border-slate-700 bg-pink-50/20 dark:bg-pink-950/10 font-mono">
                              {ts.jmlP}
                            </td>
                            <td className="py-2.5 px-3 text-center font-black text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-700 bg-amber-50/30 dark:bg-amber-950/10 font-mono text-sm">
                              {ts.total}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-slate-600 dark:text-slate-400 font-mono">
                              {ts.persentase}%
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-black text-xs border-t border-slate-300 dark:border-slate-600">
                      <td colSpan={3} className="py-2.5 px-4 text-right uppercase border-r border-slate-200 dark:border-slate-700">
                        TOTAL TINGKAT 1 S/D 6:
                      </td>
                      <td className="py-2.5 px-3 text-center text-blue-700 dark:text-blue-300 border-r border-slate-200 dark:border-slate-700 font-mono bg-blue-100/50">
                        {totalLaki}
                      </td>
                      <td className="py-2.5 px-3 text-center text-pink-700 dark:text-pink-300 border-r border-slate-200 dark:border-slate-700 font-mono bg-pink-100/50">
                        {totalPerempuan}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-950 dark:text-white border-r border-slate-200 dark:border-slate-700 font-mono font-black text-base bg-amber-300/60">
                        {totalActive}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">
                        100%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Note & Information */}
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-xs text-blue-900 dark:text-blue-200 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <School className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Catatan Administrasi Rombel:</span>
              </p>
              <p className="text-[11.5px] leading-relaxed text-blue-800/80 dark:text-blue-300/80">
                Data siswa aktif SDN 006 SUNGAI BULUH disaring khusus untuk peserta didik yang berada di <strong>Kelas 1 sampai dengan Kelas 6</strong>, dengan rombongan belajar (rombel) tetap variabel sesuai kebutuhan riil sekolah. Setiap perubahan mutasi atau kelas langsung disinkronkan secara *real-time*.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: L / P (RASIO GENDER SISWA AKTIF) */}
      {/* ========================================================================= */}
      {subTab === 'gender' && (
        <div className="space-y-6">
          {/* Big Gender Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border-2 border-blue-200 dark:border-blue-900 shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-2xl shrink-0">
                L
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Siswa Laki-laki</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-black text-blue-600 dark:text-blue-400">{totalLaki}</span>
                  <span className="text-sm font-bold text-slate-400">Siswa ({persenLaki}%)</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Terdaftar aktif di semua rombel</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border-2 border-pink-200 dark:border-pink-900 shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-400 flex items-center justify-center font-black text-2xl shrink-0">
                P
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Siswa Perempuan</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-black text-pink-600 dark:text-pink-400">{totalPerempuan}</span>
                  <span className="text-sm font-bold text-slate-400">Siswa ({persenPerempuan}%)</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Terdaftar aktif di semua rombel</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border-2 border-amber-200 dark:border-amber-900 shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-xl shrink-0">
                L : P
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rasio Gender Keseluruhan</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-black text-amber-600 dark:text-amber-400">
                    {totalLaki} : {totalPerempuan}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Total {totalActive} peserta didik aktif</p>
              </div>
            </div>
          </div>

          {/* Visual Gender Balance per Rombel */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-blue-600" />
                  <span>Grafik Keseimbangan Gender (L/P) per Rombel</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visualisasi perbandingan proporsi siswa Laki-laki vs Perempuan di setiap tingkat kelas.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setHideEmptyRombel(prev => !prev)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer shadow-xs",
                    hideEmptyRombel
                      ? "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800"
                      : "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-200"
                  )}
                  title={hideEmptyRombel ? "Klik untuk menampilkan semua rombel termasuk yang 0 siswa" : "Klik untuk menyembunyikan rombel yang tidak ada siswanya atau 0"}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>
                    {hideEmptyRombel
                      ? `Sembunyikan Rombel Kosong / 0 (${emptyRombelCount})`
                      : 'Tampilkan Semua Rombel'}
                  </span>
                </button>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                    <span className="w-3 h-3 rounded-full bg-blue-600" />
                    <span>Laki-laki (L)</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-pink-600 dark:text-pink-400">
                    <span className="w-3 h-3 rounded-full bg-pink-500" />
                    <span>Perempuan (P)</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {visibleRombelStats.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  Tidak ada rombel dengan siswa aktif untuk divisualisasikan.
                  {emptyRombelCount > 0 && hideEmptyRombel && (
                    <div className="mt-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                      ({emptyRombelCount} rombel dengan 0 siswa disembunyikan)
                    </div>
                  )}
                </div>
              ) : (
                visibleRombelStats.map((item) => {
                  const pL = item.total > 0 ? Math.round((item.jmlL / item.total) * 100) : 0;
                  const pP = item.total > 0 ? (100 - pL) : 0;

                  return (
                    <div key={item.kelas} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">
                          {item.kelas} <span className="font-normal text-slate-400">({item.total} Siswa)</span>
                        </span>
                        <div className="flex items-center gap-2 font-mono font-bold text-[11px]">
                          <span className="text-blue-600 dark:text-blue-400">L: {item.jmlL} ({pL}%)</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-pink-600 dark:text-pink-400">P: {item.jmlP} ({pP}%)</span>
                        </div>
                      </div>

                      {/* Stacked Bar */}
                      <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                        <div 
                          style={{ width: `${pL}%` }}
                          className="bg-blue-600 hover:bg-blue-500 transition-all cursor-pointer"
                          title={`${item.kelas}: ${item.jmlL} Laki-laki (${pL}%)`}
                        />
                        <div 
                          style={{ width: `${pP}%` }}
                          className="bg-pink-500 hover:bg-pink-400 transition-all cursor-pointer"
                          title={`${item.kelas}: ${item.jmlP} Perempuan (${pP}%)`}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: STATISTIK BULANAN & PERIODIK SISWA AKTIF */}
      {/* ========================================================================= */}
      {subTab === 'statistik-bulanan' && (
        <div className="space-y-4">
          <MonthlyActiveStudentsSummaryCard
            students={students}
            projectedStudents={projectedStudents}
            activeTP={activeTP}
            activeSemester={activeSemester}
            availableClasses={availableClasses}
            schoolProfile={schoolProfile}
            onSelectDetail={onSelectDetail}
            onEditStudent={onEditStudent}
            onSelectRombelFilter={(rombel) => {
              setSelectedRombel(rombel);
              setSelectedTingkat('ALL');
              setSubTab('daftar');
              setCurrentPage(1);
              setTimeout(() => {
                const el = document.getElementById('daftar-siswa-aktif-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            onSelectTingkatFilter={(tingkat) => {
              setSelectedTingkat(tingkat);
              setSelectedRombel('ALL');
              setSubTab('daftar');
              setCurrentPage(1);
              setTimeout(() => {
                const el = document.getElementById('daftar-siswa-aktif-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
            defaultCollapsed={false}
          />
        </div>
      )}
      </div>

      {/* Modal Impor Perubahan Rombel Excel */}
      {isImportRombelModalOpen && (
        <ImportRombelModal
          isOpen={isImportRombelModalOpen}
          onClose={() => setIsImportRombelModalOpen(false)}
        />
      )}

      {/* Modal Kelola Pilihan Rombel */}
      {isManageClassesOpen && (
        <ManageClassesModal
          isOpen={isManageClassesOpen}
          onClose={() => setIsManageClassesOpen(false)}
        />
      )}

      {/* Modal Kelola Tahun Pelajaran */}
      {isEditTPModalOpen && (
        <EditTahunPelajaranModal
          isOpen={isEditTPModalOpen}
          onClose={() => setIsEditTPModalOpen(false)}
          initialSelectedTP={activeTP}
        />
      )}

      {/* Modal Simpan & Kunci Rombel */}
      {isSaveLockModalOpen && (
        <SaveLockRombelModal
          isOpen={isSaveLockModalOpen}
          onClose={() => setIsSaveLockModalOpen(false)}
          activeTP={activeTP}
          totalActive={totalActive}
          totalBelumMasukSD={totalBelumMasukSD}
          rombelStats={rombelStats}
          draftEdits={draftRombelEdits}
          draftStatusEdits={draftStatusEdits}
          projectedStudents={projectedStudents}
          onConfirmSaveAndLock={handleConfirmSaveAndLock}
          isAlreadyLocked={isCurrentTPLocked}
          lockInfo={activeTPLockInfo}
        />
      )}

      {/* Modal Edit Data Wali Kelas per Rombel */}
      {isEditWaliKelasModalOpen && (
        <EditWaliKelasModal
          isOpen={isEditWaliKelasModalOpen}
          onClose={() => {
            setIsEditWaliKelasModalOpen(false);
            setSelectedKelasForWaliEdit(undefined);
          }}
          availableClasses={availableClasses}
          currentWaliKelasMap={schoolProfile.waliKelasMap || {}}
          adminUsers={adminUsers}
          activeTP={activeTP}
          initialSelectedKelas={selectedKelasForWaliEdit}
          onSave={handleSaveWaliKelasMap}
        />
      )}

      {/* Modal Unduh Data Siswa per Rombel (.xlsx) */}
      {isDownloadRombelModalOpen && (
        <DownloadRombelModal
          isOpen={isDownloadRombelModalOpen}
          onClose={() => setIsDownloadRombelModalOpen(false)}
          schoolProfile={schoolProfile}
          activeStudents={activeStudents}
          availableClasses={availableClasses}
          activeTP={activeTP}
          activeSemester={activeSemester}
          adminUsers={adminUsers}
          onLogActivity={logActivity}
        />
      )}

      {/* Dokumen Tercetak Khusus Mode Print (@media print - Sesuai Kebutuhan & Pengaturan) */}
      <ActiveStudentsPrintDocument
        settings={currentPrintSettings}
        schoolProfile={schoolProfile}
        activeTP={activeTP}
        activeSemester={activeSemester}
        projectedStudents={projectedStudents}
        rombelStats={rombelStats}
        availableClasses={availableClasses}
        adminUsers={adminUsers}
        currentSelectedTingkat={selectedTingkat}
        currentSelectedRombel={selectedRombel}
        currentSelectedStatus={selectedStatus}
        mode={printModalMode}
      />

      {/* Modal Pilihan Pengaturan Cetak (Daftar Siswa Aktif & Tabel Siswa per Rombel) */}
      {isPrintModalOpen && (
        <PrintActiveStudentsModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          mode={printModalMode}
          activeTP={activeTP}
          activeSemester={activeSemester}
          schoolProfile={schoolProfile}
          activeStudents={activeStudents}
          projectedStudents={projectedStudents}
          availableClasses={availableClasses}
          rombelStats={rombelStats}
          currentSelectedTingkat={selectedTingkat}
          currentSelectedRombel={selectedRombel}
          currentSelectedStatus={selectedStatus}
          onApplySettingsToPrintContainer={(newSettings) => {
            setCurrentPrintSettings(newSettings);
          }}
        />
      )}
    </div>
  );
};
