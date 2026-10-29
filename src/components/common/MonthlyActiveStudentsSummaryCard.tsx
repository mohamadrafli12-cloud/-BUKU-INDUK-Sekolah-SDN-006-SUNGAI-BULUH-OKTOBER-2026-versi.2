import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Users, 
  UserPlus, 
  UserMinus, 
  UserX,
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
  AlertCircle,
  Edit3,
  Search,
  X,
  ArrowRight,
  Trash2,
  Plus,
  ArrowRightLeft,
  CheckSquare,
  Square,
  AlertTriangle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Student, SchoolProfile, Gender } from '../../types';
import { cn, formatIndonesianDate } from '../../lib/utils';
import { getAcademicYearStart, isKelas1Sampai6, getTingkatKelasNumber } from '../../utils/academicYearHelper';
import { useSchool } from '../../context/SchoolContext';

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
  onEditStudent?: (student: Student, initialTab?: 'pribadi' | 'alamat' | 'ortu' | 'kesehatan' | 'masuk' | 'bantuan') => void;
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
  onEditStudent,
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

  // Sub-tab under detail-bulan: 'tingkat' | 'rombel' | 'siswa-masuk' | 'siswa-mutasi' | 'siswa-meninggal'
  const [activeSubSection, setActiveSubSection] = useState<'tingkat' | 'rombel' | 'siswa-masuk' | 'siswa-mutasi' | 'siswa-meninggal'>('tingkat');

  // School context actions for adding/removing students
  const { updateStudent, deleteStudent, addStudent, logActivity, students: allSchoolStudents } = useSchool();

  // State untuk Modal Lihat & Edit Siswa di Rombel yang Dipilih
  const [selectedRombelModal, setSelectedRombelModal] = useState<string | null>(null);
  const [rombelSearchQuery, setRombelSearchQuery] = useState<string>('');

  // State Tambah Siswa ke Rombel
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState<boolean>(false);
  const [addStudentTab, setAddStudentTab] = useState<'pilih-ada' | 'tambah-baru'>('pilih-ada');
  const [searchCandidateQuery, setSearchCandidateQuery] = useState<string>('');
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);

  // State Form Tambah Siswa Baru Langsung ke Rombel
  const [newStudentFormData, setNewStudentFormData] = useState({
    namaLengkap: '',
    namaPanggilan: '',
    jenisKelamin: 'L' as Gender,
    noInduk: '',
    nisn: '',
    nik: '',
    tempatLahir: schoolProfile.desaKelurahan || 'Sungai Buluh',
    tanggalLahir: '2019-01-01',
    namaOrangTua: '',
    alamat: `Dusun Suka Maju, Desa ${schoolProfile.desaKelurahan || 'Sungai Buluh'}`,
  });

  // State Hapus / Keluarkan Siswa dari Rombel
  const [studentToRemove, setStudentToRemove] = useState<Student | null>(null);
  const [removeMode, setRemoveMode] = useState<'keluarkan' | 'pindah' | 'hapus-permanen'>('keluarkan');
  const [targetMoveClass, setTargetMoveClass] = useState<string>('Kelas 1');

  // Multi-selection (Bulk) siswa di dalam rombel aktif
  const [selectedRombelStudentIds, setSelectedRombelStudentIds] = useState<string[]>([]);
  const [isBulkRemoveModalOpen, setIsBulkRemoveModalOpen] = useState<boolean>(false);
  const [bulkActionType, setBulkActionType] = useState<'keluarkan' | 'pindah'>('keluarkan');
  const [bulkTargetClass, setBulkTargetClass] = useState<string>('Kelas 1');

  // Toast / feedback message
  const [rombelActionFeedback, setRombelActionFeedback] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

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

  // Robust date parser for YYYY-MM, YYYY-MM-DD, DD-MM-YYYY, or Indonesian month text
  const extractYearMonth = (val?: string | null): string | null => {
    if (!val || typeof val !== 'string') return null;
    const trimmed = val.trim();
    if (!trimmed) return null;

    // ISO format YYYY-MM or YYYY-MM-DD
    const isoMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})/);
    if (isoMatch) {
      const y = isoMatch[1];
      const m = isoMatch[2].padStart(2, '0');
      return `${y}-${m}`;
    }

    // Indonesian / DMY format DD-MM-YYYY or DD/MM/YYYY
    const dmyMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
    if (dmyMatch) {
      const y = dmyMatch[3];
      const m = dmyMatch[2].padStart(2, '0');
      return `${y}-${m}`;
    }

    // Named months in text (e.g. "12 Oktober 2026", "Oktober 2026")
    const monthMap: Record<string, string> = {
      jan: '01', januari: '01',
      feb: '02', februari: '02',
      mar: '03', maret: '03',
      apr: '04', april: '04',
      mei: '05',
      jun: '06', juni: '06',
      jul: '07', juli: '07',
      ags: '08', agustus: '08',
      sep: '09', september: '09',
      okt: '10', oktober: '10',
      nov: '11', november: '11',
      des: '12', desember: '12'
    };
    const parts = trimmed.toLowerCase().split(/[\s,.-]+/);
    let foundMonth: string | null = null;
    let foundYear: string | null = null;
    for (const p of parts) {
      if (monthMap[p]) {
        foundMonth = monthMap[p];
      } else if (/^\d{4}$/.test(p)) {
        foundYear = p;
      }
    }
    if (foundMonth && foundYear) {
      return `${foundYear}-${foundMonth}`;
    }

    return null;
  };

  // Helper to extract student's admission year-month (YYYY-MM)
  const getStudentAdmissionMonthKey = (s: Student): string => {
    const parsedDiterima = extractYearMonth(s.tanggalDiterima);
    if (parsedDiterima) return parsedDiterima;

    const parsedMasuk = extractYearMonth((s as any).tanggalMasuk);
    if (parsedMasuk) return parsedMasuk;

    if (s.tahunMasuk && /^\d{4}$/.test(s.tahunMasuk.trim())) {
      return `${s.tahunMasuk.trim()}-07`;
    }
    const parsedCreated = extractYearMonth(s.createdAt);
    if (parsedCreated) return parsedCreated;

    // Fallback: estimate from grade in startYear
    const grade = getTingkatKelasNumber(s.kelasSekarang || 'Kelas 1');
    const estimatedYear = startYear - (Math.max(1, grade) - 1);
    return `${estimatedYear}-07`;
  };

  // Helper to extract student's death year-month (YYYY-MM)
  const getStudentMeninggalMonthKey = (s: Student): string | null => {
    if (s.status !== 'Meninggal') return null;
    const tgl = (s as any).tanggalMeninggal || s.mutasi?.tglMeninggalkan || s.mutasi?.dikeluarkanTanggal;
    const parsed = extractYearMonth(tgl);
    if (parsed) return parsed;

    const parsedUpdated = extractYearMonth(s.updatedAt);
    if (parsedUpdated) return parsedUpdated;

    return `${startYear}-10`;
  };

  // Helper to extract student's mutation out year-month (YYYY-MM) (EXCLUDING Meninggal)
  const getStudentMutationMonthKey = (s: Student): string | null => {
    // Siswa berstatus Meninggal TIDAK dimasukkan sebagai mutasi keluar!
    if (s.status === 'Meninggal') {
      return null;
    }
    const tgl = s.mutasi?.tglMeninggalkan || s.mutasi?.dikeluarkanTanggal || (s as any).tanggalMutasi || (s as any).tanggalMutasiKeluar;
    const parsed = extractYearMonth(tgl);
    if (parsed) return parsed;

    if (s.status === 'Mutasi Keluar' || s.status === 'Drop Out') {
      const parsedUpdated = extractYearMonth(s.updatedAt);
      if (parsedUpdated) return parsedUpdated;
      return `${startYear}-07`;
    }
    return null;
  };

  // Cohort of students eligible for grades 1-6 in this academic year
  const eligibleStudentsForTP = useMemo(() => {
    return projectedStudents.filter(p => {
      // Must be projected into Grade 1 to 6
      if (!isKelas1Sampai6(p.kelasSekarang) || p.projectedTingkat < 1 || p.projectedTingkat > 6) {
        return false;
      }
      // If student mutated out BEFORE the academic year started (before startYear-07), exclude
      const mutKey = getStudentMutationMonthKey(p);
      if (mutKey && mutKey < `${startYear}-07`) {
        return false;
      }
      // If student passed away BEFORE the academic year started (before startYear-07), exclude
      const menKey = getStudentMeninggalMonthKey(p);
      if (menKey && menKey < `${startYear}-07`) {
        return false;
      }
      // If student admitted AFTER this academic year ended (after endYear-06), exclude
      const admKey = getStudentAdmissionMonthKey(p);
      if (admKey > `${endYear}-06`) {
        return false;
      }
      return true;
    });
  }, [projectedStudents, startYear, endYear]);

  // Monthly stats for each of the 12 academic months (Full periodic calculation: Masuk, Mutasi Keluar, & Meninggal)
  const periodicMonthlyStats = useMemo(() => {
    const startOfJulyKey = `${startYear}-07`;

    // Prior to Month 0 (Juli startYear), students already admitted and neither mutated nor deceased before July:
    let runningActiveList = eligibleStudentsForTP.filter(s => {
      const admKey = getStudentAdmissionMonthKey(s);
      const mutKey = getStudentMutationMonthKey(s);
      const menKey = getStudentMeninggalMonthKey(s);
      const enteredBeforeJuly = admKey < startOfJulyKey;
      const notMutatedBeforeJuly = !mutKey || mutKey >= startOfJulyKey;
      const notMeninggalBeforeJuly = !menKey || menKey >= startOfJulyKey;
      return enteredBeforeJuly && notMutatedBeforeJuly && notMeninggalBeforeJuly;
    });

    return academicMonths.map((m) => {
      const awalList = [...runningActiveList];
      const awalL = awalList.filter(s => s.jenisKelamin === 'L').length;
      const awalP = awalList.filter(s => s.jenisKelamin === 'P').length;
      const totalAwal = awalList.length;

      // Siswa Masuk in this month
      const masukList = eligibleStudentsForTP.filter(s => {
        const admKey = getStudentAdmissionMonthKey(s);
        return admKey === m.key;
      });
      const masukL = masukList.filter(s => s.jenisKelamin === 'L').length;
      const masukP = masukList.filter(s => s.jenisKelamin === 'P').length;
      const masukCount = masukList.length;

      // Siswa Mutasi Keluar in this month (EXCLUDING Meninggal)
      const mutasiList = eligibleStudentsForTP.filter(s => {
        const mutKey = getStudentMutationMonthKey(s);
        return mutKey === m.key;
      });
      const mutasiL = mutasiList.filter(s => s.jenisKelamin === 'L').length;
      const mutasiP = mutasiList.filter(s => s.jenisKelamin === 'P').length;
      const mutasiCount = mutasiList.length;

      // Siswa Meninggal Dunia in this month (SEPARATE FROM MUTASI KELUAR)
      const meninggalList = eligibleStudentsForTP.filter(s => {
        const menKey = getStudentMeninggalMonthKey(s);
        return menKey === m.key;
      });
      const meninggalL = meninggalList.filter(s => s.jenisKelamin === 'L').length;
      const meninggalP = meninggalList.filter(s => s.jenisKelamin === 'P').length;
      const meninggalCount = meninggalList.length;

      // Siswa Akhir = Awal + Masuk - Mutasi Keluar - Meninggal
      const mutasiIds = new Set(mutasiList.map(s => s.id));
      const meninggalIds = new Set(meninggalList.map(s => s.id));
      const akhirMap = new Map<string, typeof eligibleStudentsForTP[0]>();

      awalList.forEach(s => {
        if (!mutasiIds.has(s.id) && !meninggalIds.has(s.id)) {
          akhirMap.set(s.id, s);
        }
      });
      masukList.forEach(s => {
        if (!mutasiIds.has(s.id) && !meninggalIds.has(s.id)) {
          akhirMap.set(s.id, s);
        }
      });

      // Filter to strictly ensure that any student who has mutated out or deceased on or before this month is NEVER in akhirList:
      const rawAkhirList = Array.from(akhirMap.values());
      const akhirList = rawAkhirList.filter(s => {
        const mutKey = getStudentMutationMonthKey(s);
        if (mutKey && mutKey <= m.key) return false;
        const menKey = getStudentMeninggalMonthKey(s);
        if (menKey && menKey <= m.key) return false;
        if (m.isCurrent && (s.status === 'Mutasi Keluar' || s.status === 'Meninggal' || s.status === 'Drop Out' || s.status === 'Lulus')) {
          return false;
        }
        return true;
      });

      const akhirL = akhirList.filter(s => s.jenisKelamin === 'L').length;
      const akhirP = akhirList.filter(s => s.jenisKelamin === 'P').length;
      const totalAkhir = akhirList.length;
      const netChange = masukCount - mutasiCount - meninggalCount;

      // Update runningActiveList for next month
      runningActiveList = akhirList;

      // Total Siswa Aktif per Tingkat (1 s/d 6) in this month
      const tingkatCounts: Record<number, { total: number; l: number; p: number }> = {
        1: { total: 0, l: 0, p: 0 },
        2: { total: 0, l: 0, p: 0 },
        3: { total: 0, l: 0, p: 0 },
        4: { total: 0, l: 0, p: 0 },
        5: { total: 0, l: 0, p: 0 },
        6: { total: 0, l: 0, p: 0 },
      };

      akhirList.forEach(s => {
        const t = getTingkatKelasNumber(s.kelasSekarang);
        if (t >= 1 && t <= 6) {
          tingkatCounts[t].total += 1;
          if (s.jenisKelamin === 'L') tingkatCounts[t].l += 1;
          else tingkatCounts[t].p += 1;
        }
      });

      return {
        month: m,
        totalAwal,
        totalAwalL: awalL,
        totalAwalP: awalP,
        awalList,
        masukList,
        masukCount,
        masukL,
        masukP,
        mutasiList,
        mutasiCount,
        mutasiL,
        mutasiP,
        meninggalList,
        meninggalCount,
        meninggalL,
        meninggalP,
        totalAkhir,
        totalAkhirL: akhirL,
        totalAkhirP: akhirP,
        akhirList,
        netChange,
        tingkatCounts,
        totalAktif: totalAkhir,
        totalAktifL: akhirL,
        totalAktifP: akhirP,
      };
    });
  }, [academicMonths, eligibleStudentsForTP, startYear]);

  // Current selected month's specific statistics
  const currentMonthData = useMemo(() => {
    return periodicMonthlyStats.find(p => p.month.key === selectedMonthKey) || periodicMonthlyStats[0];
  }, [periodicMonthlyStats, selectedMonthKey]);

  // Siswa aktif di rombel yang dipilih untuk modal
  const studentsInSelectedRombel = useMemo(() => {
    if (!selectedRombelModal) return [];
    return currentMonthData.akhirList.filter(s => s.kelasSekarang === selectedRombelModal);
  }, [selectedRombelModal, currentMonthData.akhirList]);

  // Pencarian siswa di dalam modal rombel
  const filteredModalStudents = useMemo(() => {
    if (!rombelSearchQuery.trim()) return studentsInSelectedRombel;
    const q = rombelSearchQuery.toLowerCase();
    return studentsInSelectedRombel.filter(s => 
      s.namaLengkap.toLowerCase().includes(q) ||
      s.namaPanggilan?.toLowerCase().includes(q) ||
      s.nisn?.toLowerCase().includes(q) ||
      s.noInduk?.toLowerCase().includes(q) ||
      s.nik?.toLowerCase().includes(q)
    );
  }, [studentsInSelectedRombel, rombelSearchQuery]);

  // Calon siswa yang dapat ditambahkan ke rombel yang dipilih (siswa yang saat ini bukan di rombel ini)
  const candidateStudentsForAdd = useMemo(() => {
    if (!selectedRombelModal) return [];
    const sourceList = (allSchoolStudents && allSchoolStudents.length > 0) ? allSchoolStudents : students;
    return sourceList.filter(s => s.kelasSekarang !== selectedRombelModal && s.status !== 'Meninggal' && s.status !== 'Mutasi Keluar');
  }, [allSchoolStudents, students, selectedRombelModal]);

  const filteredCandidateStudents = useMemo(() => {
    if (!searchCandidateQuery.trim()) return candidateStudentsForAdd;
    const q = searchCandidateQuery.toLowerCase();
    return candidateStudentsForAdd.filter(s => 
      s.namaLengkap.toLowerCase().includes(q) ||
      s.namaPanggilan?.toLowerCase().includes(q) ||
      s.nisn?.toLowerCase().includes(q) ||
      s.noInduk?.toLowerCase().includes(q) ||
      s.kelasSekarang?.toLowerCase().includes(q)
    );
  }, [candidateStudentsForAdd, searchCandidateQuery]);

  // Handler: Tambahkan siswa terdaftar ke rombel ini
  const handleAddExistingStudent = (studentId: string) => {
    if (!selectedRombelModal) return;
    const sourceList = (allSchoolStudents && allSchoolStudents.length > 0) ? allSchoolStudents : students;
    const target = sourceList.find(s => s.id === studentId);
    if (!target) return;

    updateStudent(studentId, {
      kelasSekarang: selectedRombelModal,
      status: target.status === 'Belum Masuk SD' ? 'Aktif' : target.status,
      tahunPelajaranKelasSekarang: activeTP,
    });

    logActivity('EDIT', `Memasukkan siswa ${target.namaLengkap} ke dalam rombel ${selectedRombelModal} (TP ${activeTP})`);
    setRombelActionFeedback({
      message: `Siswa ${target.namaLengkap} berhasil dimasukkan ke ${selectedRombelModal}!`,
      type: 'success',
    });
    setTimeout(() => setRombelActionFeedback(null), 4000);
  };

  // Handler: Tambahkan banyak siswa terdaftar sekaligus
  const handleBulkAddExistingStudents = () => {
    if (!selectedRombelModal || selectedCandidateIds.length === 0) return;
    const sourceList = (allSchoolStudents && allSchoolStudents.length > 0) ? allSchoolStudents : students;

    selectedCandidateIds.forEach(id => {
      const target = sourceList.find(s => s.id === id);
      if (target) {
        updateStudent(id, {
          kelasSekarang: selectedRombelModal,
          status: target.status === 'Belum Masuk SD' ? 'Aktif' : target.status,
          tahunPelajaranKelasSekarang: activeTP,
        });
      }
    });

    logActivity('EDIT', `Memasukkan ${selectedCandidateIds.length} siswa ke dalam rombel ${selectedRombelModal} (TP ${activeTP})`);
    setRombelActionFeedback({
      message: `${selectedCandidateIds.length} siswa berhasil dimasukkan ke ${selectedRombelModal}!`,
      type: 'success',
    });
    setSelectedCandidateIds([]);
    setIsAddStudentModalOpen(false);
    setTimeout(() => setRombelActionFeedback(null), 4000);
  };

  // Handler: Tambah siswa baru langsung ke rombel
  const handleCreateAndAddNewStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRombelModal || !newStudentFormData.namaLengkap.trim()) return;

    const currentYear = new Date().getFullYear();
    const sourceList = (allSchoolStudents && allSchoolStudents.length > 0) ? allSchoolStudents : students;
    addStudent({
      namaLengkap: newStudentFormData.namaLengkap.trim(),
      namaPanggilan: newStudentFormData.namaPanggilan.trim() || newStudentFormData.namaLengkap.trim().split(' ')[0],
      jenisKelamin: newStudentFormData.jenisKelamin,
      noInduk: newStudentFormData.noInduk.trim() || `${currentYear}${String(sourceList.length + 1).padStart(3, '0')}`,
      nisn: newStudentFormData.nisn.trim() || `0${Math.floor(100000000 + Math.random() * 900000000)}`,
      nik: newStudentFormData.nik.trim() || '1409050000000000',
      tempatLahir: newStudentFormData.tempatLahir,
      tanggalLahir: newStudentFormData.tanggalLahir,
      alamat: newStudentFormData.alamat,
      ayah: {
        nama: newStudentFormData.namaOrangTua.trim() || 'Orang Tua Siswa',
      },
      kelasSekarang: selectedRombelModal,
      status: 'Aktif',
      tahunMasuk: String(startYear),
      tahunPelajaranKelasSekarang: activeTP,
      diterimaDiKelas: selectedRombelModal,
      tanggalDiterima: `${startYear}-07-15`,
    });

    logActivity('TAMBAH', `Mendaftarkan siswa baru ${newStudentFormData.namaLengkap} langsung ke ${selectedRombelModal}`);
    setRombelActionFeedback({
      message: `Siswa baru ${newStudentFormData.namaLengkap} berhasil didaftarkan ke ${selectedRombelModal}!`,
      type: 'success',
    });
    setNewStudentFormData({
      namaLengkap: '',
      namaPanggilan: '',
      jenisKelamin: 'L',
      noInduk: '',
      nisn: '',
      nik: '',
      tempatLahir: schoolProfile.desaKelurahan || 'Sungai Buluh',
      tanggalLahir: '2019-01-01',
      namaOrangTua: '',
      alamat: `Dusun Suka Maju, Desa ${schoolProfile.desaKelurahan || 'Sungai Buluh'}`,
    });
    setIsAddStudentModalOpen(false);
    setTimeout(() => setRombelActionFeedback(null), 4000);
  };

  // Handler: Konfirmasi Hapus / Keluarkan Siswa Tunggal
  const handleConfirmRemoveStudent = () => {
    if (!studentToRemove || !selectedRombelModal) return;
    const studentName = studentToRemove.namaLengkap;

    if (removeMode === 'keluarkan') {
      updateStudent(studentToRemove.id, {
        kelasSekarang: 'Belum Masuk SD',
        status: 'Belum Masuk SD',
      });
      logActivity('EDIT', `Mengeluarkan siswa ${studentName} dari rombel ${selectedRombelModal} (diubah ke Tanpa Rombel / Belum Masuk SD)`);
      setRombelActionFeedback({
        message: `Siswa ${studentName} berhasil dikeluarkan dari ${selectedRombelModal}. Data siswa tetap tersimpan di Buku Induk.`,
        type: 'info',
      });
    } else if (removeMode === 'pindah') {
      updateStudent(studentToRemove.id, {
        kelasSekarang: targetMoveClass,
      });
      logActivity('EDIT', `Memindahkan siswa ${studentName} dari rombel ${selectedRombelModal} ke ${targetMoveClass}`);
      setRombelActionFeedback({
        message: `Siswa ${studentName} berhasil dipindahkan ke ${targetMoveClass}!`,
        type: 'success',
      });
    } else if (removeMode === 'hapus-permanen') {
      deleteStudent(studentToRemove.id);
      logActivity('HAPUS', `Menghapus data siswa ${studentName} secara permanen dari database`);
      setRombelActionFeedback({
        message: `Data siswa ${studentName} berhasil dihapus permanen.`,
        type: 'error',
      });
    }

    setStudentToRemove(null);
    setTimeout(() => setRombelActionFeedback(null), 4000);
  };

  // Handler: Konfirmasi Hapus / Keluarkan Siswa Masal
  const handleConfirmBulkRemove = () => {
    if (!selectedRombelModal || selectedRombelStudentIds.length === 0) return;
    const count = selectedRombelStudentIds.length;

    if (bulkActionType === 'keluarkan') {
      selectedRombelStudentIds.forEach(id => {
        updateStudent(id, {
          kelasSekarang: 'Belum Masuk SD',
          status: 'Belum Masuk SD',
        });
      });
      logActivity('EDIT', `Mengeluarkan ${count} siswa secara masal dari rombel ${selectedRombelModal}`);
      setRombelActionFeedback({
        message: `${count} siswa berhasil dikeluarkan dari ${selectedRombelModal}.`,
        type: 'info',
      });
    } else {
      selectedRombelStudentIds.forEach(id => {
        updateStudent(id, {
          kelasSekarang: bulkTargetClass,
        });
      });
      logActivity('EDIT', `Memindahkan ${count} siswa dari rombel ${selectedRombelModal} ke ${bulkTargetClass}`);
      setRombelActionFeedback({
        message: `${count} siswa berhasil dipindahkan ke ${bulkTargetClass}!`,
        type: 'success',
      });
    }

    setSelectedRombelStudentIds([]);
    setIsBulkRemoveModalOpen(false);
    setTimeout(() => setRombelActionFeedback(null), 4000);
  };

  // Breakdown Jumlah Siswa di Rombel for the selected month
  const rombelStats: MonthlyRombelStat[] = useMemo(() => {
    const monthStudents = currentMonthData.akhirList;
    const total = monthStudents.length;
    return availableClasses.map(rombel => {
      const inRombel = monthStudents.filter(s => s.kelasSekarang === rombel);
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
  }, [availableClasses, currentMonthData.akhirList, schoolProfile.waliKelasMap]);

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

  // Breakdown Total Siswa di Setiap Tingkat (Tingkat 1 - 6) for the selected month
  const tingkatStats: MonthlyTingkatStat[] = useMemo(() => {
    const monthStudents = currentMonthData.akhirList;
    const totalAll = monthStudents.length;
    return [1, 2, 3, 4, 5, 6].map(tingkat => {
      const inTingkat = monthStudents.filter(s => getTingkatKelasNumber(s.kelasSekarang) === tingkat);
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
  }, [currentMonthData.akhirList, availableClasses]);

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
        'Siswa Awal Bulan',
        'Siswa Masuk (L)', 
        'Siswa Masuk (P)', 
        'Total Masuk (+)',
        'Mutasi Keluar (L)', 
        'Mutasi Keluar (P)', 
        'Total Mutasi (-)',
        'Siswa Meninggal (L)',
        'Siswa Meninggal (P)',
        'Total Meninggal (-)',
        'Tingkat 1',
        'Tingkat 2',
        'Tingkat 3',
        'Tingkat 4',
        'Tingkat 5',
        'Tingkat 6',
        'Akhir (L)',
        'Akhir (P)',
        'Total Siswa Akhir (=)'
      ],
    ];

    periodicMonthlyStats.forEach((p, idx) => {
      periodicSheetData.push([
        idx + 1,
        p.month.monthName,
        p.month.year,
        p.month.semester,
        p.totalAwal,
        p.masukL,
        p.masukP,
        p.masukCount,
        p.mutasiL,
        p.mutasiP,
        p.mutasiCount,
        p.meninggalL,
        p.meninggalP,
        p.meninggalCount,
        p.tingkatCounts[1].total,
        p.tingkatCounts[2].total,
        p.tingkatCounts[3].total,
        p.tingkatCounts[4].total,
        p.tingkatCounts[5].total,
        p.tingkatCounts[6].total,
        p.totalAkhirL,
        p.totalAkhirP,
        p.totalAkhir,
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
      `TOTAL SISWA AKTIF (${selectedMonthInfo.fullName.toUpperCase()})`,
      '-',
      '-',
      currentMonthData.totalAkhirL,
      currentMonthData.totalAkhirP,
      currentMonthData.totalAkhir,
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
              Bulan Terpilih: <strong>{selectedMonthInfo.fullName}</strong>
            </span>
            <span className="text-slate-400">•</span>
            <span>Awal: <strong className="text-slate-700 dark:text-slate-300">{currentMonthData.totalAwal}</strong></span>
            <span className="text-slate-400">•</span>
            <span>Masuk: <strong className="text-emerald-600 dark:text-emerald-400">+{currentMonthData.masukCount}</strong></span>
            <span className="text-slate-400">•</span>
            <span>Mutasi: <strong className="text-orange-600 dark:text-orange-400">-{currentMonthData.mutasiCount}</strong></span>
            {currentMonthData.meninggalCount > 0 && (
              <>
                <span className="text-slate-400">•</span>
                <span>Meninggal: <strong className="text-rose-600 dark:text-rose-400">-{currentMonthData.meninggalCount}</strong></span>
              </>
            )}
            <span className="text-slate-400">•</span>
            <span>Total Akhir: <strong className="text-blue-700 dark:text-blue-400">{currentMonthData.totalAkhir} Siswa</strong></span>
            <span className="text-slate-400">•</span>
            <span>Rombel Aktif: <strong className="text-amber-600 dark:text-amber-400">{activeRombelsCount}</strong></span>
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
                const hasMovement = (pStat?.masukCount || 0) > 0 || (pStat?.mutasiCount || 0) > 0 || (pStat?.meninggalCount || 0) > 0;

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
                    <span className={cn("text-[11px] font-extrabold mt-0.5 font-mono", isSelected ? "text-white" : "text-blue-700 dark:text-blue-400")}>
                      {pStat?.totalAkhir || 0} Siswa
                    </span>
                    
                    {/* Badge Mutasi/Masuk/Meninggal */}
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
                          {(pStat?.meninggalCount || 0) > 0 && (
                            <span className={cn("px-1 rounded font-bold", isSelected ? "bg-rose-400 text-slate-950" : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300")} title="Meninggal Dunia">
                              -{pStat?.meninggalCount}†
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="opacity-40 text-[10px]">tetap</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* VIEW MODE 1: DETAIL BULAN TERPILIH */}
          {viewMode === 'detail-bulan' && (
            <div className="space-y-4">
              {/* Formula Callout Banner: Keadaan Awal + Masuk - Mutasi - Meninggal = Akhir */}
              <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-linear-to-r from-blue-50/90 via-indigo-50/70 to-slate-50 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-slate-900 text-xs text-blue-950 dark:text-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black shrink-0 text-sm shadow-xs">
                    Σ
                  </div>
                  <div>
                    <div className="font-extrabold text-blue-900 dark:text-blue-100 flex items-center gap-2 flex-wrap">
                      <span>Perubahan Siswa Bulan {selectedMonthInfo.fullName}</span>
                      <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                        (Awal + Masuk - Mutasi Keluar - Meninggal = Akhir)
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] font-mono">
                      <span className="px-2 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200">
                        Awal: {currentMonthData.totalAwal}
                      </span>
                      <span className="font-bold text-slate-400">+</span>
                      <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/80 rounded border border-emerald-300 dark:border-emerald-800 font-bold text-emerald-800 dark:text-emerald-300">
                        Masuk: +{currentMonthData.masukCount}
                      </span>
                      <span className="font-bold text-slate-400">-</span>
                      <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-950/80 rounded border border-orange-300 dark:border-orange-800 font-bold text-orange-800 dark:text-orange-300">
                        Mutasi: -{currentMonthData.mutasiCount}
                      </span>
                      <span className="font-bold text-slate-400">-</span>
                      <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950/80 rounded border border-rose-300 dark:border-rose-800 font-bold text-rose-800 dark:text-rose-300" title="Siswa Meninggal dipisahkan dari Mutasi Keluar">
                        Meninggal: -{currentMonthData.meninggalCount}
                      </span>
                      <span className="font-bold text-slate-400">=</span>
                      <span className="px-2.5 py-0.5 bg-[#003399] text-white rounded font-black shadow-2xs">
                        Keadaan Akhir: {currentMonthData.totalAkhir} Siswa
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 self-end sm:self-auto font-medium">
                  Net Perubahan: <strong className={cn(currentMonthData.netChange > 0 ? "text-emerald-600 font-bold" : currentMonthData.netChange < 0 ? "text-orange-600 font-bold" : "text-slate-600")}>{currentMonthData.netChange > 0 ? `+${currentMonthData.netChange}` : currentMonthData.netChange} Siswa</strong>
                </div>
              </div>

              {/* 5 KPI Highlight Cards for the Selected Month (Termasuk Div Khusus Siswa Meninggal) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {/* KPI 1: Keadaan Siswa Akhir */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-linear-to-br from-blue-50/60 to-white dark:from-slate-800/60 dark:to-slate-900 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Keadaan Siswa Akhir</span>
                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                    {currentMonthData.totalAkhir} <span className="text-xs font-normal text-slate-500">Siswa Aktif</span>
                  </p>
                  <div className="flex items-center justify-between mt-1 text-[11px] font-semibold text-slate-500">
                    <span className="text-blue-600 dark:text-blue-400">{currentMonthData.totalAkhirL} L • {currentMonthData.totalAkhirP} P</span>
                    <span className="text-slate-600 dark:text-slate-400 font-mono text-[10px]">Awal: {currentMonthData.totalAwal}</span>
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

                {/* KPI 3: Jumlah Siswa Mutasi Keluar */}
                <div 
                  onClick={() => setActiveSubSection('siswa-mutasi')}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-linear-to-br from-orange-50/60 to-white dark:from-slate-800/60 dark:to-slate-900 shadow-2xs cursor-pointer hover:border-orange-300 transition-all group"
                  title="Klik untuk melihat daftar siswa mutasi keluar pada bulan ini"
                >
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[11px] font-bold uppercase tracking-wider group-hover:text-orange-700 transition-colors">
                      Mutasi Keluar
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

                {/* KPI 4: Siswa Meninggal Dunia (DIV BARU SESUAI PERMINTAAN USER) */}
                <div 
                  onClick={() => setActiveSubSection('siswa-meninggal')}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-linear-to-br from-rose-50/60 to-white dark:from-slate-800/60 dark:to-slate-900 shadow-2xs cursor-pointer hover:border-rose-300 transition-all group"
                  title="Klik untuk melihat daftar siswa meninggal dunia pada bulan ini"
                >
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[11px] font-bold uppercase tracking-wider group-hover:text-rose-700 transition-colors">
                      Siswa Meninggal
                    </span>
                    <UserX className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  </div>
                  <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                    -{currentMonthData.meninggalCount} <span className="text-xs font-normal text-slate-500">Siswa</span>
                  </p>
                  <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500 font-semibold">
                    <span>{currentMonthData.meninggalL} L • {currentMonthData.meninggalP} P</span>
                    <span className="text-rose-600 font-bold group-hover:underline">Lihat Rincian →</span>
                  </div>
                </div>

                {/* KPI 5: Jumlah Rombel */}
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
                    <span>Rata-rata: {activeRombelsCount > 0 ? Math.round(currentMonthData.totalAkhir / activeRombelsCount) : 0} siswa/kelas</span>
                    {emptyRombelCount > 0 && hideEmptyRombel ? (
                      <span className="text-amber-600 font-medium">({emptyRombelCount} kelas 0)</span>
                    ) : (
                      <span className="text-amber-600 font-bold group-hover:underline">Detail →</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Sub-section Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto scrollbar-thin">
                {[
                  { id: 'tingkat', label: 'Total Siswa per Tingkat (1-6)', count: 6 },
                  { id: 'rombel', label: `Jumlah Siswa di Rombel (${activeRombelsCount})`, count: activeRombelsCount },
                  { id: 'siswa-masuk', label: `Siswa Masuk (${currentMonthData.masukCount})`, count: currentMonthData.masukCount },
                  { id: 'siswa-mutasi', label: `Mutasi Keluar (${currentMonthData.mutasiCount})`, count: currentMonthData.mutasiCount },
                  { id: 'siswa-meninggal', label: `Siswa Meninggal (${currentMonthData.meninggalCount})`, count: currentMonthData.meninggalCount },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSubSection(item.id as any)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0",
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
                      Total: <strong>{currentMonthData.totalAkhir}</strong> Siswa Aktif
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
                        const width = currentMonthData.totalAkhir > 0 ? (ts.total / currentMonthData.totalAkhir) * 100 : 0;
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
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedRombelModal(r.rombel);
                                    setRombelSearchQuery('');
                                    if (onSelectRombelFilter) onSelectRombelFilter(r.rombel);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#003399] hover:bg-blue-800 text-white rounded-lg text-xs font-black shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-95"
                                  title={`Lihat nama siswa ${r.rombel} & edit data siswa`}
                                >
                                  <Users className="w-3.5 h-3.5 text-amber-300" />
                                  <span>Pilih</span>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50 dark:bg-slate-800/80 font-black border-t-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                          <td colSpan={4} className="py-2.5 px-3 text-right">TOTAL SISWA AKTIF ({selectedMonthInfo.fullName.toUpperCase()}):</td>
                          <td className="py-2.5 px-3 text-center text-blue-600 dark:text-blue-400 font-black">
                            {currentMonthData.totalAkhirL}
                          </td>
                          <td className="py-2.5 px-3 text-center text-pink-600 dark:text-pink-400 font-black">
                            {currentMonthData.totalAkhirP}
                          </td>
                          <td className="py-2.5 px-3 text-center text-[#003399] dark:text-amber-300 font-black text-sm">
                            {currentMonthData.totalAkhir}
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

              {/* SECTION E: SISWA MENINGGAL DUNIA PADA BULAN INI (DIV BARU KHUSUS SISWA MENINGGAL) */}
              {activeSubSection === 'siswa-meninggal' && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                        <UserX className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        <span>Daftar Siswa Meninggal Dunia pada Bulan {selectedMonthInfo.fullName} ({currentMonthData.meninggalCount} Siswa)</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Siswa berstatus meninggal dipisahkan secara khusus dari mutasi keluar untuk akurasi buku induk & statistik resmi.
                      </p>
                    </div>
                    <span className="text-xs text-slate-500">
                      Laki-laki: <strong>{currentMonthData.meninggalL}</strong> • Perempuan: <strong>{currentMonthData.meninggalP}</strong>
                    </span>
                  </div>

                  {currentMonthData.meninggalList.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                      <UserX className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                      <p className="font-bold text-slate-700 dark:text-slate-300">Tidak ada catatan peserta didik meninggal dunia pada bulan {selectedMonthInfo.fullName}.</p>
                      <p className="text-[11px] text-slate-400 mt-1">Data siswa yang meninggal dunia dicatat secara terpisah dan tidak digabungkan ke kategori mutasi keluar.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-rose-50/80 dark:bg-rose-950/40 text-slate-700 dark:text-slate-300 border-b border-rose-200 dark:border-rose-900/60">
                            <th className="py-2.5 px-3 font-bold w-12 text-center">No</th>
                            <th className="py-2.5 px-3 font-bold">Nama Lengkap</th>
                            <th className="py-2.5 px-3 font-bold">NIS / NISN</th>
                            <th className="py-2.5 px-3 font-bold text-center">JK</th>
                            <th className="py-2.5 px-3 font-bold">Kelas Terakhir</th>
                            <th className="py-2.5 px-3 font-bold">Tanggal Meninggal</th>
                            <th className="py-2.5 px-3 font-bold">Penyebab / Keterangan</th>
                            <th className="py-2.5 px-3 font-bold text-center w-20">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                          {currentMonthData.meninggalList.map((s, idx) => (
                            <tr key={s.id} className="hover:bg-rose-50/30 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                              <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">
                                <div className="flex items-center gap-2">
                                  <span>{s.namaLengkap}</span>
                                  <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                    Meninggal
                                  </span>
                                </div>
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
                                {s.mutasi?.dariKelas || s.kelasSekarang}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-mono">
                                {(s as any).tanggalMeninggal 
                                  ? formatIndonesianDate((s as any).tanggalMeninggal) 
                                  : (s.mutasi?.tglMeninggalkan 
                                      ? formatIndonesianDate(s.mutasi.tglMeninggalkan) 
                                      : (s.mutasi?.dikeluarkanTanggal 
                                          ? formatIndonesianDate(s.mutasi.dikeluarkanTanggal) 
                                          : (s.updatedAt ? formatIndonesianDate(s.updatedAt.split('T')[0]) : '-')))}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                                {s.mutasi?.alasanPindah || s.kesehatan?.penyakitPernahDiderita || s.mutasi?.keterangan || 'Meninggal Dunia'}
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
                  Rekap pergerakan siswa masuk, mutasi keluar, meninggal, dan total siswa per tingkat
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                      <th className="py-2.5 px-3 font-bold text-center w-10">No</th>
                      <th className="py-2.5 px-3 font-bold">Bulan & Tahun</th>
                      <th className="py-2.5 px-2 font-bold text-center">Sem.</th>
                      <th className="py-2.5 px-2 font-bold text-center bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        Siswa Awal
                      </th>
                      <th className="py-2.5 px-2 font-bold text-center bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
                        Masuk (+)
                      </th>
                      <th className="py-2.5 px-2 font-bold text-center bg-orange-50 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300">
                        Mutasi (-)
                      </th>
                      <th className="py-2.5 px-2 font-bold text-center bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300">
                        Meninggal (-)
                      </th>
                      <th className="py-2.5 px-3 font-bold text-center bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300">
                        Siswa Akhir (=)
                      </th>
                      <th className="py-2.5 px-2 font-bold text-center">T1</th>
                      <th className="py-2.5 px-2 font-bold text-center">T2</th>
                      <th className="py-2.5 px-2 font-bold text-center">T3</th>
                      <th className="py-2.5 px-2 font-bold text-center">T4</th>
                      <th className="py-2.5 px-2 font-bold text-center">T5</th>
                      <th className="py-2.5 px-2 font-bold text-center">T6</th>
                      <th className="py-2.5 px-2 font-bold text-center">L / P</th>
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
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Bulan Berjalan" />
                            )}
                            <span>{p.month.monthName} {p.month.year}</span>
                          </td>
                          <td className="py-2 px-2 text-center text-slate-500">{p.month.semester}</td>
                          
                          {/* Siswa Awal */}
                          <td className="py-2 px-2 text-center font-mono font-semibold text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/30">
                            {p.totalAwal}
                          </td>

                          {/* Masuk */}
                          <td className="py-2 px-2 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20">
                            {p.masukCount > 0 ? `+${p.masukCount}` : '-'}
                          </td>

                          {/* Mutasi Keluar */}
                          <td className="py-2 px-2 text-center font-bold text-orange-600 dark:text-orange-400 bg-orange-50/30 dark:bg-orange-950/20">
                            {p.mutasiCount > 0 ? `-${p.mutasiCount}` : '-'}
                          </td>

                          {/* Meninggal Dunia */}
                          <td className="py-2 px-2 text-center font-bold text-rose-600 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-950/20">
                            {p.meninggalCount > 0 ? `-${p.meninggalCount}` : '-'}
                          </td>

                          {/* Siswa Akhir */}
                          <td className="py-2 px-3 text-center font-black text-blue-700 dark:text-blue-300 bg-blue-50/40 dark:bg-blue-950/30 font-mono">
                            {p.totalAkhir}
                          </td>

                          {/* Tingkat 1 to 6 */}
                          <td className="py-2 px-2 text-center font-mono">{p.tingkatCounts[1].total}</td>
                          <td className="py-2 px-2 text-center font-mono">{p.tingkatCounts[2].total}</td>
                          <td className="py-2 px-2 text-center font-mono">{p.tingkatCounts[3].total}</td>
                          <td className="py-2 px-2 text-center font-mono">{p.tingkatCounts[4].total}</td>
                          <td className="py-2 px-2 text-center font-mono">{p.tingkatCounts[5].total}</td>
                          <td className="py-2 px-2 text-center font-mono">{p.tingkatCounts[6].total}</td>

                          {/* L / P breakdown */}
                          <td className="py-2 px-2 text-center text-[11px] font-mono text-slate-600 dark:text-slate-400">
                            {p.totalAkhirL} / {p.totalAkhirP}
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
                      <td colSpan={4} className="py-2.5 px-3 text-right">TOTAL GERAKAN 1 TAHUN:</td>
                      <td className="py-2.5 px-2 text-center text-emerald-600 font-black">
                        +{periodicMonthlyStats.reduce((acc, curr) => acc + curr.masukCount, 0)}
                      </td>
                      <td className="py-2.5 px-2 text-center text-orange-600 font-black">
                        -{periodicMonthlyStats.reduce((acc, curr) => acc + curr.mutasiCount, 0)}
                      </td>
                      <td className="py-2.5 px-2 text-center text-rose-600 font-black">
                        -{periodicMonthlyStats.reduce((acc, curr) => acc + curr.meninggalCount, 0)}
                      </td>
                      <td className="py-2.5 px-3 text-center text-blue-700 dark:text-blue-300 font-black text-sm">
                        {currentMonthData.totalAkhir}
                      </td>
                      <td colSpan={7} className="py-2.5 px-2 text-center text-slate-500 font-normal">
                        Keadaan Terakhir Bulan {currentMonthData.month.monthName} {currentMonthData.month.year} ({currentMonthData.totalAkhir} Siswa Aktif)
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

      {/* MODAL LIHAT & EDIT SISWA DI DALAM ROMBEL YANG DIPILIH */}
      {selectedRombelModal && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150"
          onClick={() => setSelectedRombelModal(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#003399] text-white flex items-center justify-center font-black shadow-md shrink-0">
                  <Layers className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                      Daftar Siswa {selectedRombelModal}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                      Tingkat {getTingkatKelasNumber(selectedRombelModal)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Tahun Pelajaran {activeTP} • Periode {selectedMonthInfo.fullName} • Wali Kelas: <strong>{schoolProfile.waliKelasMap?.[selectedRombelModal]?.nama || 'Belum ditentukan'}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddStudentModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer transition-all active:scale-95"
                  title="Tambah siswa ke dalam rombel ini"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Tambah Siswa</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRombelModal(null);
                    setSelectedRombelStudentIds([]);
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Tutup dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notification / Feedback Banner */}
            {rombelActionFeedback && (
              <div className={cn(
                "px-4 py-2.5 flex items-center justify-between text-xs font-semibold border-b animate-in fade-in duration-200",
                rombelActionFeedback.type === 'success' && "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
                rombelActionFeedback.type === 'error' && "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800",
                rombelActionFeedback.type === 'info' && "bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800"
              )}>
                <div className="flex items-center gap-2">
                  {rombelActionFeedback.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                  {rombelActionFeedback.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
                  {rombelActionFeedback.type === 'info' && <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />}
                  <span>{rombelActionFeedback.message}</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setRombelActionFeedback(null)}
                  className="p-1 hover:opacity-70 text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Bulk Action Toolbar */}
            {selectedRombelStudentIds.length > 0 && (
              <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-950/50 border-b border-amber-200 dark:border-amber-900/60 flex items-center justify-between gap-2 flex-wrap text-xs animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-[11px] font-black">
                    {selectedRombelStudentIds.length}
                  </span>
                  <span>Siswa dipilih di {selectedRombelModal}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBulkActionType('keluarkan');
                      setIsBulkRemoveModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-xs cursor-pointer transition-all active:scale-95 text-xs"
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                    <span>Keluarkan Terpilih</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBulkActionType('pindah');
                      setIsBulkRemoveModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs cursor-pointer transition-all active:scale-95 text-xs"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>Pindahkan Kelas</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRombelStudentIds([])}
                    className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-bold cursor-pointer transition-colors text-xs"
                  >
                    Batal Pilih
                  </button>
                </div>
              </div>
            )}

            {/* Quick Stats & Search Bar */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                  Total: <strong>{studentsInSelectedRombel.length}</strong> Siswa
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold">
                  Laki-laki: <strong>{studentsInSelectedRombel.filter(s => s.jenisKelamin === 'L').length}</strong>
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 font-bold">
                  Perempuan: <strong>{studentsInSelectedRombel.filter(s => s.jenisKelamin === 'P').length}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddStudentModalOpen(true)}
                  className="sm:hidden px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold inline-flex items-center gap-1 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah</span>
                </button>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={rombelSearchQuery}
                  onChange={(e) => setRombelSearchQuery(e.target.value)}
                  placeholder={`Cari siswa di ${selectedRombelModal}...`}
                  className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                />
                {rombelSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setRombelSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Note banner */}
            <div className="px-4 py-2 bg-blue-50/60 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/40 text-[11px] text-blue-700 dark:text-blue-300 flex items-center justify-between">
              <span>
                💡 Anda dapat menambah siswa baru/terdaftar ke rombel ini, atau mengeluarkan/menghapus siswa melalui tombol aksi di tabel.
              </span>
              <span className="font-semibold">{filteredModalStudents.length} siswa aktif</span>
            </div>

            {/* Table Content */}
            <div className="flex-1 overflow-y-auto p-4 max-h-[55vh]">
              {filteredModalStudents.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
                  <p className="font-bold text-slate-700 dark:text-slate-300">
                    {rombelSearchQuery ? `Tidak ada siswa di ${selectedRombelModal} yang cocok dengan pencarian.` : `Belum ada siswa aktif terdaftar di ${selectedRombelModal}.`}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 mb-4">
                    {rombelSearchQuery ? 'Coba kata kunci pencarian yang lain.' : 'Gunakan tombol "+ Tambah Siswa" untuk memasukkan siswa ke rombel ini.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAddStudentModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer transition-all active:scale-95"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Tambah Siswa ke {selectedRombelModal}</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-extrabold">
                        <th className="py-2.5 px-3 text-center w-10">
                          <button
                            type="button"
                            onClick={() => {
                              if (filteredModalStudents.length > 0 && filteredModalStudents.every(s => selectedRombelStudentIds.includes(s.id))) {
                                setSelectedRombelStudentIds([]);
                              } else {
                                setSelectedRombelStudentIds(filteredModalStudents.map(s => s.id));
                              }
                            }}
                            className="p-1 hover:text-blue-600 cursor-pointer"
                            title="Pilih Semua Siswa"
                          >
                            {filteredModalStudents.length > 0 && filteredModalStudents.every(s => selectedRombelStudentIds.includes(s.id)) ? (
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                        </th>
                        <th className="py-2.5 px-3 text-center w-12">No</th>
                        <th className="py-2.5 px-3">Nama Siswa</th>
                        <th className="py-2.5 px-3">NIS / NISN</th>
                        <th className="py-2.5 px-3 text-center">Jenis Kelamin</th>
                        <th className="py-2.5 px-3">Tempat, Tanggal Lahir</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-center w-52">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                      {filteredModalStudents.map((s, idx) => (
                        <tr 
                          key={s.id} 
                          className={cn(
                            "hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors",
                            selectedRombelStudentIds.includes(s.id) && "bg-blue-50/60 dark:bg-blue-950/30"
                          )}
                        >
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRombelStudentIds(prev =>
                                  prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id]
                                );
                              }}
                              className="p-1 hover:text-blue-600 cursor-pointer"
                            >
                              {selectedRombelStudentIds.includes(s.id) ? (
                                <CheckSquare className="w-4 h-4 text-blue-600" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400" />
                              )}
                            </button>
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2.5">
                              {s.foto ? (
                                <img src={s.foto} alt={s.namaLengkap} className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0" />
                              ) : (
                                <div className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0",
                                  s.jenisKelamin === 'L' ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300" : "bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300"
                                )}>
                                  {s.namaLengkap.charAt(0)}
                                </div>
                              )}
                              <div>
                                <p className="font-black text-slate-900 dark:text-slate-100 text-xs">
                                  {s.namaLengkap}
                                </p>
                                {s.namaPanggilan && (
                                  <p className="text-[11px] text-slate-400">Panggilan: {s.namaPanggilan}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                            <div>NIS: <span className="font-bold">{s.noInduk || '-'}</span></div>
                            <div className="text-slate-400">NISN: {s.nisn || '-'}</div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-black inline-block",
                              s.jenisKelamin === 'L' ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" : "bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300"
                            )}>
                              {s.jenisKelamin === 'L' ? 'Laki-laki (L)' : 'Perempuan (P)'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-xs text-slate-600 dark:text-slate-400">
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{s.tempatLahir || '-'}</p>
                            <p className="text-[11px] text-slate-400">{s.tanggalLahir ? formatIndonesianDate(s.tanggalLahir) : '-'}</p>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                              Aktif
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {onEditStudent && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedRombelModal(null);
                                    onEditStudent(s, 'masuk');
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
                                  title={`Edit data siswa ${s.namaLengkap}`}
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>
                              )}
                              {onSelectDetail && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedRombelModal(null);
                                    onSelectDetail(s.id);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 rounded-lg text-xs font-bold border border-blue-200 dark:border-blue-800 cursor-pointer transition-all"
                                  title={`Lihat Buku Induk ${s.namaLengkap}`}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Detail</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setStudentToRemove(s);
                                  setRemoveMode('keluarkan');
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-bold border border-rose-200 dark:border-rose-800 shadow-xs cursor-pointer active:scale-95 transition-all"
                                title={`Hapus atau keluarkan ${s.namaLengkap} dari rombel ini`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Hapus</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Menampilkan <strong>{filteredModalStudents.length}</strong> dari <strong>{studentsInSelectedRombel.length}</strong> siswa aktif di {selectedRombelModal}.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddStudentModalOpen(true)}
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Siswa</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRombelModal(null);
                    setSelectedRombelStudentIds([]);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  Tutup
                </button>
                {onSelectRombelFilter && (
                  <button
                    type="button"
                    onClick={() => {
                      const rombel = selectedRombelModal;
                      setSelectedRombelModal(null);
                      setSelectedRombelStudentIds([]);
                      onSelectRombelFilter(rombel);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-[#003399] hover:bg-blue-800 text-white shadow-md cursor-pointer transition-all active:scale-95"
                  >
                    <span>Buka di Tabel Siswa Aktif</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* SUB-MODAL 1: TAMBAH SISWA KE DALAM ROMBEL INI */}
            {isAddStudentModalOpen && (
              <div 
                className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150"
                onClick={() => setIsAddStudentModalOpen(false)}
              >
                <div 
                  className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Sub-modal Header */}
                  <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-emerald-50/60 dark:bg-emerald-950/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-sm shrink-0">
                        <UserPlus className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                          Tambah Siswa ke {selectedRombelModal}
                        </h4>
                        <p className="text-xs text-slate-500">
                          Pilih siswa terdaftar yang belum masuk kelas atau daftarkan siswa baru
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddStudentModalOpen(false)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Navigation Tabs */}
                  <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-4 pt-2">
                    <button
                      type="button"
                      onClick={() => setAddStudentTab('existing')}
                      className={cn(
                        "px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2",
                        addStudentTab === 'existing'
                          ? "border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 rounded-t-lg"
                          : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                      )}
                    >
                      <Users className="w-4 h-4" />
                      <span>Pilih dari Siswa Terdaftar ({candidateStudentsForAdd.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddStudentTab('new')}
                      className={cn(
                        "px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2",
                        addStudentTab === 'new'
                          ? "border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 rounded-t-lg"
                          : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                      )}
                    >
                      <Plus className="w-4 h-4" />
                      <span>Daftarkan Siswa Baru Langsung</span>
                    </button>
                  </div>

                  {/* Tab 1: Existing Students List */}
                  {addStudentTab === 'existing' && (
                    <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-3">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={searchCandidateQuery}
                          onChange={(e) => setSearchCandidateQuery(e.target.value)}
                          placeholder="Cari nama, NIS, atau kelas asal..."
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100"
                        />
                      </div>

                      {selectedCandidateIds.length > 0 && (
                        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                          <span>{selectedCandidateIds.length} siswa dipilih untuk dimasukkan</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedCandidateIds([])}
                              className="px-2.5 py-1 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs hover:bg-slate-100"
                            >
                              Reset
                            </button>
                            <button
                              type="button"
                              onClick={handleBulkAddExistingStudents}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black shadow-xs cursor-pointer"
                            >
                              Tambahkan Semua Terpilih
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
                        {filteredCandidateStudents.length === 0 ? (
                          <div className="py-10 text-center text-xs text-slate-400">
                            {candidateStudentsForAdd.length === 0
                              ? 'Tidak ada siswa lain yang tersedia untuk dimasukkan.'
                              : 'Tidak ditemukan siswa yang cocok dengan kata kunci.'}
                          </div>
                        ) : (
                          filteredCandidateStudents.map((cand) => {
                            const isSelected = selectedCandidateIds.includes(cand.id);
                            return (
                              <div
                                key={cand.id}
                                className={cn(
                                  "p-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                                  isSelected && "bg-emerald-50/50 dark:bg-emerald-950/20"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedCandidateIds(prev => [...prev, cand.id]);
                                      } else {
                                        setSelectedCandidateIds(prev => prev.filter(x => x !== cand.id));
                                      }
                                    }}
                                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                  />
                                  <div>
                                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                      {cand.namaLengkap}
                                    </p>
                                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                      <span>NIS: {cand.noInduk || '-'}</span>
                                      <span>•</span>
                                      <span>{cand.jenisKelamin === 'L' ? 'L' : 'P'}</span>
                                      <span>•</span>
                                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                                        Saat ini: {cand.kelasSekarang || 'Tanpa Kelas'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleAddExistingStudent(cand.id)}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-xs"
                                >
                                  + Tambah
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tab 2: Form Daftarkan Siswa Baru Langsung */}
                  {addStudentTab === 'new' && (
                    <form onSubmit={handleCreateAndAddNewStudent} className="p-4 flex-1 overflow-y-auto space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Nama Lengkap Siswa *
                          </label>
                          <input
                            type="text"
                            required
                            value={newStudentFormData.namaLengkap}
                            onChange={(e) => setNewStudentFormData({ ...newStudentFormData, namaLengkap: e.target.value })}
                            placeholder="Contoh: Ahmad Rizki"
                            className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Nama Panggilan
                          </label>
                          <input
                            type="text"
                            value={newStudentFormData.namaPanggilan}
                            onChange={(e) => setNewStudentFormData({ ...newStudentFormData, namaPanggilan: e.target.value })}
                            placeholder="Contoh: Rizki"
                            className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Jenis Kelamin *
                          </label>
                          <select
                            value={newStudentFormData.jenisKelamin}
                            onChange={(e) => setNewStudentFormData({ ...newStudentFormData, jenisKelamin: e.target.value as Gender })}
                            className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                          >
                            <option value="L">Laki-laki (L)</option>
                            <option value="P">Perempuan (P)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            NIS / No. Induk
                          </label>
                          <input
                            type="text"
                            value={newStudentFormData.noInduk}
                            onChange={(e) => setNewStudentFormData({ ...newStudentFormData, noInduk: e.target.value })}
                            placeholder="Otomatis jika kosong"
                            className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            NISN
                          </label>
                          <input
                            type="text"
                            value={newStudentFormData.nisn}
                            onChange={(e) => setNewStudentFormData({ ...newStudentFormData, nisn: e.target.value })}
                            placeholder="10 digit nomor"
                            className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Tempat Lahir
                          </label>
                          <input
                            type="text"
                            value={newStudentFormData.tempatLahir}
                            onChange={(e) => setNewStudentFormData({ ...newStudentFormData, tempatLahir: e.target.value })}
                            className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Tanggal Lahir
                          </label>
                          <input
                            type="date"
                            value={newStudentFormData.tanggalLahir}
                            onChange={(e) => setNewStudentFormData({ ...newStudentFormData, tanggalLahir: e.target.value })}
                            className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Nama Orang Tua / Wali
                          </label>
                          <input
                            type="text"
                            value={newStudentFormData.namaOrangTua}
                            onChange={(e) => setNewStudentFormData({ ...newStudentFormData, namaOrangTua: e.target.value })}
                            placeholder="Nama ayah atau ibu"
                            className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Alamat
                          </label>
                          <input
                            type="text"
                            value={newStudentFormData.alamat}
                            onChange={(e) => setNewStudentFormData({ ...newStudentFormData, alamat: e.target.value })}
                            placeholder="Alamat tempat tinggal"
                            className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                          />
                        </div>
                      </div>

                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-xs text-emerald-800 dark:text-emerald-300">
                        Siswa ini akan langsung didaftarkan dengan status <strong>Aktif</strong> pada rombel <strong>{selectedRombelModal}</strong> untuk Tahun Pelajaran <strong>{activeTP}</strong>.
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsAddStudentModalOpen(false)}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer transition-all active:scale-95"
                        >
                          Simpan & Masukkan ke {selectedRombelModal}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* SUB-MODAL 2: HAPUS / KELUARKAN SISWA TUNGGAL */}
            {studentToRemove && (
              <div 
                className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150"
                onClick={() => setStudentToRemove(null)}
              >
                <div 
                  className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-5 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                      <Trash2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-900 dark:text-slate-100">
                        Keluarkan / Hapus Siswa
                      </h4>
                      <p className="text-xs text-slate-500">
                        Pilih opsi pengelolaan untuk siswa dari rombel {selectedRombelModal}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 mb-4 text-xs">
                    <p className="font-black text-slate-900 dark:text-slate-100 text-sm">
                      {studentToRemove.namaLengkap}
                    </p>
                    <p className="text-slate-500 mt-0.5">
                      NIS: {studentToRemove.noInduk || '-'} • NISN: {studentToRemove.nisn || '-'} • JK: {studentToRemove.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                    </p>
                  </div>

                  <div className="space-y-2.5 mb-5 text-xs">
                    {/* Opsi 1: Keluarkan dari rombel */}
                    <label 
                      onClick={() => setRemoveMode('keluarkan')}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                        removeMode === 'keluarkan' 
                          ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30" 
                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      )}
                    >
                      <input
                        type="radio"
                        name="removeAction"
                        checked={removeMode === 'keluarkan'}
                        onChange={() => setRemoveMode('keluarkan')}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100">
                          Keluarkan dari {selectedRombelModal} (Disarankan)
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                          Siswa akan dilepas dari rombel ini (diubah menjadi Tanpa Rombel). Data Buku Induk siswa tetap tersimpan aman.
                        </p>
                      </div>
                    </label>

                    {/* Opsi 2: Pindahkan ke rombel lain */}
                    <label 
                      onClick={() => setRemoveMode('pindah')}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                        removeMode === 'pindah' 
                          ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30" 
                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      )}
                    >
                      <input
                        type="radio"
                        name="removeAction"
                        checked={removeMode === 'pindah'}
                        onChange={() => setRemoveMode('pindah')}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <p className="font-bold text-slate-900 dark:text-slate-100">
                          Pindahkan ke Kelas / Rombel Lain
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 mb-2">
                          Pindahkan siswa langsung ke kelas tujuan tanpa menghapusnya dari data sekolah.
                        </p>
                        {removeMode === 'pindah' && (
                          <select
                            value={targetMoveClass}
                            onChange={(e) => setTargetMoveClass(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {availableClasses.filter(c => c !== selectedRombelModal).map(c => (
                              <option key={c} value={c}>
                                {c} (Tingkat {getTingkatKelasNumber(c)})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </label>

                    {/* Opsi 3: Hapus permanen */}
                    <label 
                      onClick={() => setRemoveMode('hapus-permanen')}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                        removeMode === 'hapus-permanen' 
                          ? "border-rose-500 bg-rose-50/50 dark:bg-rose-950/30" 
                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      )}
                    >
                      <input
                        type="radio"
                        name="removeAction"
                        checked={removeMode === 'hapus-permanen'}
                        onChange={() => setRemoveMode('hapus-permanen')}
                        className="mt-0.5 text-rose-600 focus:ring-rose-500"
                      />
                      <div>
                        <p className="font-bold text-rose-700 dark:text-rose-400">
                          Hapus Permanen dari Database Sekolah
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                          Tindakan ini akan menghapus seluruh data siswa dari aplikasi sekolah secara permanen.
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setStudentToRemove(null)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmRemoveStudent}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-black text-white shadow-md cursor-pointer transition-all active:scale-95",
                        removeMode === 'hapus-permanen' ? "bg-rose-600 hover:bg-rose-700" : "bg-blue-600 hover:bg-blue-700"
                      )}
                    >
                      {removeMode === 'hapus-permanen' 
                        ? 'Hapus Permanen' 
                        : removeMode === 'pindah' 
                          ? `Pindahkan ke ${targetMoveClass}` 
                          : `Keluarkan dari ${selectedRombelModal}`}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-MODAL 3: KELUARKAN / PINDAHKAN SISWA TERPILIH (BULK ACTION) */}
            {isBulkRemoveModalOpen && (
              <div 
                className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150"
                onClick={() => setIsBulkRemoveModalOpen(false)}
              >
                <div 
                  className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-5 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      bulkActionType === 'keluarkan' ? "bg-rose-100 dark:bg-rose-950 text-rose-600" : "bg-blue-100 dark:bg-blue-950 text-blue-600"
                    )}>
                      {bulkActionType === 'keluarkan' ? <UserMinus className="w-5 h-5" /> : <ArrowRightLeft className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-900 dark:text-slate-100">
                        {bulkActionType === 'keluarkan' ? 'Keluarkan Siswa Terpilih' : 'Pindahkan Siswa Terpilih'}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {selectedRombelStudentIds.length} siswa dipilih dari {selectedRombelModal}
                      </p>
                    </div>
                  </div>

                  {bulkActionType === 'keluarkan' ? (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-xs text-amber-800 dark:text-amber-300 mb-4">
                      Apakah Anda yakin ingin mengeluarkan <strong>{selectedRombelStudentIds.length} siswa</strong> dari kelas <strong>{selectedRombelModal}</strong>? Siswa yang dikeluarkan akan berstatus Belum Masuk SD / Tanpa Rombel dan tetap ada di Buku Induk.
                    </div>
                  ) : (
                    <div className="space-y-3 mb-4 text-xs">
                      <p className="text-slate-600 dark:text-slate-300">
                        Pilih rombel tujuan untuk <strong>{selectedRombelStudentIds.length} siswa terpilih</strong>:
                      </p>
                      <select
                        value={bulkTargetClass}
                        onChange={(e) => setBulkTargetClass(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      >
                        {availableClasses.filter(c => c !== selectedRombelModal).map(c => (
                          <option key={c} value={c}>
                            {c} (Tingkat {getTingkatKelasNumber(c)})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsBulkRemoveModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmBulkRemove}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-black text-white shadow-md cursor-pointer transition-all active:scale-95",
                        bulkActionType === 'keluarkan' ? "bg-rose-600 hover:bg-rose-700" : "bg-blue-600 hover:bg-blue-700"
                      )}
                    >
                      {bulkActionType === 'keluarkan' ? 'Ya, Keluarkan Siswa' : `Pindahkan ke ${bulkTargetClass}`}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
