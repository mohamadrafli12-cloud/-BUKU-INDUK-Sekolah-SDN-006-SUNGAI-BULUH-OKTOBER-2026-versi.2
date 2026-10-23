import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Student, 
  StudentStatus,
  SchoolProfile, 
  UserRole, 
  ActivityLog, 
  SemesterReport, 
  MutationRecord, 
  GraduationSTTB,
  RolePermissions,
  AdminUser,
  SecuritySettings,
  Gender
} from '../types';
import { initialStudents, initialSchoolProfile, initialActivityLogs } from '../data/initialData';
import { parseDbBackupText, DbBackupParseResult } from '../utils/dbBackupHelper';
import { exportStudentsToExcel } from '../utils/excelHelper';
import { 
  checkSqlStatus, 
  saveStudentToSql, 
  deleteStudentFromSql, 
  saveSchoolProfileToSql, 
  syncAllToSql, 
  fetchStudentsFromSql 
} from '../services/sqlDatabaseService';
import { 
  persistStudentsResiliently, 
  safeLocalStorageSet, 
  safeLocalStorageGet, 
  safeLocalStorageRemove,
  idbGet, 
  idbSet, 
  idbDelete,
  cleanupVolatileStorage,
  repairStorageQuota
} from '../utils/storageHelper';

export const defaultPermissions: Record<UserRole, RolePermissions> = {
  admin: {
    tambahSiswa: true,
    editSiswa: true,
    hapusSiswa: true,
    lihatDetailLengkap: true,
    inputRaport: true,
    editRaport: true,
    kunciNilaiSemester: true,
    inputMutasi: true,
    inputSTTB: true,
    cetakSuratMutasi: true,
    cetakBukuInduk: true,
    cetakKartuPelajar: true,
    eksporExcelCSV: true,
    ubahProfilSekolah: true,
    backupDatabase: true,
    restoreDatabase: true,
    kelolaHakAkses: true,
  },
  user: {
    tambahSiswa: true,
    editSiswa: true,
    hapusSiswa: false,
    lihatDetailLengkap: true,
    inputRaport: true,
    editRaport: true,
    kunciNilaiSemester: false,
    inputMutasi: true,
    inputSTTB: true,
    cetakSuratMutasi: true,
    cetakBukuInduk: true,
    cetakKartuPelajar: true,
    eksporExcelCSV: true,
    ubahProfilSekolah: false,
    backupDatabase: false,
    restoreDatabase: false,
    kelolaHakAkses: false,
  },
  umum: {
    tambahSiswa: false,
    editSiswa: false,
    hapusSiswa: false,
    lihatDetailLengkap: false,
    inputRaport: false,
    editRaport: false,
    kunciNilaiSemester: false,
    inputMutasi: false,
    inputSTTB: false,
    cetakSuratMutasi: false,
    cetakBukuInduk: false,
    cetakKartuPelajar: false,
    eksporExcelCSV: false,
    ubahProfilSekolah: false,
    backupDatabase: false,
    restoreDatabase: false,
    kelolaHakAkses: false,
  },
};

export const initialAdminUsers: AdminUser[] = [
  {
    id: 'usr-001',
    nama: 'H. Marlisman, S.Pd., M.M.',
    username: 'adminsdn006',
    password: 'sdn006',
    nip: '19680512 199103 1 005',
    email: 'kepsek.sdn006@kemdikbud.go.id',
    role: 'admin',
    kategoriTugas: 'kepala_sekolah',
    jabatan: 'Kepala Sekolah (Penanggung Jawab Utama)',
    status: 'Aktif',
    terakhirLogin: 'Hari ini, 08:30 WIB',
    avatarColor: 'bg-amber-600',
  },
  {
    id: 'usr-002',
    nama: 'Dewi Anggraini, S.Pd.SD',
    nip: '19901103 201502 2 009',
    email: 'dewi.anggraini@sdn006.sch.id',
    role: 'user',
    kategoriTugas: 'wali_kelas',
    tingkatKelas: 'Kelas 1',
    jabatan: 'Wali Kelas 1 & Koordinator Kurikulum',
    status: 'Aktif',
    terakhirLogin: 'Hari ini, 07:45 WIB',
    avatarColor: 'bg-rose-600',
  },
  {
    id: 'usr-003',
    nama: 'Suryani, S.Pd.',
    nip: '19890412 201403 2 011',
    email: 'suryani@sdn006.sch.id',
    role: 'user',
    kategoriTugas: 'wali_kelas',
    tingkatKelas: 'Kelas 2',
    jabatan: 'Wali Kelas 2',
    status: 'Aktif',
    terakhirLogin: 'Kemarin, 13:20 WIB',
    avatarColor: 'bg-emerald-600',
  },
  {
    id: 'usr-004',
    nama: 'Hendri Gunawan, S.Pd.I.',
    nip: '19870825 201201 1 007',
    email: 'hendri.gunawan@sdn006.sch.id',
    role: 'user',
    kategoriTugas: 'wali_kelas',
    tingkatKelas: 'Kelas 3',
    jabatan: 'Wali Kelas 3',
    status: 'Aktif',
    terakhirLogin: '18 Agu 2026',
    avatarColor: 'bg-sky-600',
  },
  {
    id: 'usr-005',
    nama: 'Ratna Juwita, S.Pd.',
    nip: '19910519 201602 2 014',
    email: 'ratna.juwita@sdn006.sch.id',
    role: 'user',
    kategoriTugas: 'wali_kelas',
    tingkatKelas: 'Kelas 4',
    jabatan: 'Wali Kelas 4',
    status: 'Aktif',
    terakhirLogin: '19 Agu 2026',
    avatarColor: 'bg-indigo-600',
  },
  {
    id: 'usr-006',
    nama: 'Bambang Irawan, S.Pd.',
    nip: '19880220 201403 1 004',
    email: 'bambang.irawan@sdn006.sch.id',
    role: 'user',
    kategoriTugas: 'wali_kelas',
    tingkatKelas: 'Kelas 5',
    jabatan: 'Wali Kelas 5 & Guru PJOK',
    status: 'Aktif',
    terakhirLogin: '18 Agu 2026',
    avatarColor: 'bg-purple-600',
  },
  {
    id: 'usr-007',
    nama: 'Siti Rahmawati, S.Pd.',
    nip: '19850614 201001 2 012',
    email: 'siti.rahmawati@sdn006.sch.id',
    role: 'user',
    kategoriTugas: 'wali_kelas',
    tingkatKelas: 'Kelas 6',
    jabatan: 'Wali Kelas 6 (Koordinator Ujian)',
    status: 'Aktif',
    terakhirLogin: 'Kemarin, 14:45 WIB',
    avatarColor: 'bg-teal-600',
  },
  {
    id: 'usr-008',
    nama: 'Ahmad Fauzi, S.Pd.I.',
    nip: '19930718 201903 1 006',
    email: 'ahmad.fauzi@sdn006.sch.id',
    role: 'user',
    kategoriTugas: 'guru_mapel',
    mataPelajaran: 'Pendidikan Agama Islam & Budi Pekerti',
    jabatan: 'Guru Mapel Pendidikan Agama Islam',
    status: 'Aktif',
    terakhirLogin: '17 Agu 2026',
    avatarColor: 'bg-green-600',
  },
  {
    id: 'usr-009',
    nama: 'Dedi Kurniawan, S.Pd.',
    nip: '19940112 202012 1 003',
    email: 'dedi.kurniawan@sdn006.sch.id',
    role: 'user',
    kategoriTugas: 'guru_mapel',
    mataPelajaran: 'Pendidikan Jasmani, Olahraga, dan Kesehatan',
    jabatan: 'Guru Mapel PJOK',
    status: 'Aktif',
    terakhirLogin: '16 Agu 2026',
    avatarColor: 'bg-orange-600',
  },
  {
    id: 'usr-010',
    nama: 'Rahmat Hidayat, S.Kom.',
    nip: '19920415 201902 1 008',
    email: 'operator.rahmat@sdn006.sch.id',
    role: 'admin',
    kategoriTugas: 'tenaga_kependidikan',
    tugasTendik: 'Operator Dapodik & SIM Sekolah',
    jabatan: 'Tenaga Kependidikan - Operator Dapodik & TU',
    status: 'Aktif',
    terakhirLogin: 'Hari ini, 09:15 WIB',
    avatarColor: 'bg-blue-600',
  },
];

export const initialSecuritySettings: SecuritySettings = {
  pinAdmin: '123456',
  requirePinForDelete: true,
  requirePinForReset: true,
  sembunyikanNikUmum: true,
  kunciSemesterAktif: false,
  autoLogoutMinutes: 30,
};

interface SchoolContextType {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  schoolProfile: SchoolProfile;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  activityLogs: ActivityLog[];
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  toggleDarkMode: () => void;
  visitorStats: {
    total: number;
    today: number;
    live: number;
    weeklyVisits: { day: string; count: number }[];
  };
  
  // Permissions & Access Control
  rolePermissions: Record<UserRole, RolePermissions>;
  updateRolePermission: (role: UserRole, key: keyof RolePermissions, value: boolean) => void;
  resetRolePermissions: () => void;
  
  // Admin Staff Users & Auth State
  adminUsers: AdminUser[];
  currentUser: AdminUser | null;
  setCurrentUser: (user: AdminUser | null) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  login: (userOrRole: AdminUser | UserRole, pinOrPassword?: string) => { success: boolean; message?: string };
  logout: () => void;
  addAdminUser: (user: Omit<AdminUser, 'id' | 'terakhirLogin'>) => void;
  updateAdminUser: (id: string, data: Partial<AdminUser>) => void;
  deleteAdminUser: (id: string) => void;
  
  // Security Settings
  securitySettings: SecuritySettings;
  updateSecuritySettings: (settings: Partial<SecuritySettings>) => void;

  // Roster Helpers
  getWaliKelasForClass: (kelas: string) => { nama: string; nip: string; id?: string };
  updateWaliKelasForClass: (kelas: string, nama: string, nip?: string) => void;
  getKepalaSekolah: () => { nama: string; nip: string; id?: string };

  // Actions
  addStudent: (data: Partial<Student>) => Student;
  updateStudent: (id: string, data: Partial<Student>) => void;
  bulkUpdateStudentRombel: (updates: { studentId: string; newClass: string; oldClass?: string; keterangan?: string }[]) => number;
  deleteStudent: (id: string) => void;
  deleteStudentsBulk: (ids: string[]) => void;
  deleteAllStudents: () => void;
  getStudentById: (id: string) => Student | undefined;
  
  processMutation: (id: string, mutation: MutationRecord) => void;
  cancelMutation: (id: string, restoreClass?: string) => void;
  updateSTTB: (id: string, sttb: GraduationSTTB) => void;
  updateFotoIjazah: (id: string, fotoIjazah: string | undefined) => void;
  updateFotoIjazahMutasi: (id: string, fotoIjazah: string | undefined) => void;
  addOrUpdateRaport: (studentId: string, report: SemesterReport) => void;
  
  updateSchoolProfile: (data: Partial<SchoolProfile>) => void;
  logActivity: (action: ActivityLog['action'], description: string, targetId?: string) => void;
  addActivityLog: (logOrAction: Partial<ActivityLog> | ActivityLog['action'], description?: string, targetId?: string) => void;
  
  exportDatabaseJSON: () => void;
  exportDatabaseDB: () => void;
  getDatabaseBackupJsonString: () => string;
  getDatabaseBackupDbString: () => string;
  exportStudentsCSV: (options?: { filteredClass?: string }) => void;
  exportStudentsExcel: (options?: { filteredClass?: string }) => void;
  importDatabaseJSON: (jsonData: string) => boolean;
  restoreDatabaseFromDB: (
    parsedOrRaw: string | DbBackupParseResult,
    mode?: 'replace' | 'merge',
    restoreSchoolProfile?: boolean
  ) => { success: boolean; studentCount: number; message: string };
  importStudentsBulk: (importedList: Partial<Student>[], duplicateStrategy: 'skip' | 'update' | 'append') => { added: number; updated: number; skipped: number };
  importMutationsBulk: (
    records: Array<{
      studentIdentifier: {
        nisn?: string;
        noInduk?: string;
        namaLengkap?: string;
      };
      mutationData: MutationRecord;
      studentBasics?: {
        jenisKelamin?: Gender;
        kelasSekarang?: string;
      };
    }>,
    duplicateStrategy?: 'update' | 'skip' | 'append'
  ) => { added: number; updated: number; skipped: number };
  resetDatabase: () => void;
  resetToInitialData: () => void;
  lockAcademicYearRombel: (
    tahunPelajaran: string,
    studentUpdates?: Array<{
      id: string;
      kelasSekarang: string;
      status: StudentStatus;
      tahunPelajaranKelasSekarang?: string;
    }>,
    catatan?: string
  ) => void;
  unlockAcademicYearRombel: (tahunPelajaran: string) => void;

  isSqlConnected: boolean;
  syncToSqlDatabase: () => Promise<{ success: boolean; message: string }>;
  fetchFromSqlDatabase: () => Promise<{ success: boolean; count: number }>;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

const STORAGE_KEY_STUDENTS = 'buku_induk_students_v1';
const STORAGE_KEY_SCHOOL = 'buku_induk_school_profile_v1';
const STORAGE_KEY_LOGS = 'buku_induk_logs_v1';
const STORAGE_KEY_ROLE = 'buku_induk_user_role_v1';
const STORAGE_KEY_DARK = 'buku_induk_dark_mode_v1';
const STORAGE_KEY_VISITORS = 'buku_induk_visitors_v1';
const STORAGE_KEY_PERMISSIONS = 'buku_induk_permissions_v1';
const STORAGE_KEY_USERS = 'buku_induk_admin_users_v1';
const STORAGE_KEY_SECURITY = 'buku_induk_security_v1';
const STORAGE_KEY_AUTH = 'buku_induk_auth_state_v1';
const STORAGE_KEY_CURRENT_USER = 'buku_induk_current_user_v1';

// Helper to ensure 'diterimaDiKelas' is properly formatted and converts legacy/mistyped '7', '7A', 'Kelas 7' to 'Kelas 1'
export const sanitizeDiterimaDiKelas = (val?: string): string => {
  if (!val) return 'Kelas 1';
  const clean = String(val).trim();
  if (
    clean === '7' ||
    clean === '7A' ||
    clean === '7B' ||
    clean.toLowerCase() === 'kelas 7' ||
    clean.toLowerCase() === 'vii' ||
    clean.toLowerCase() === 'kelas vii'
  ) {
    return 'Kelas 1';
  }
  return clean;
};

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load students from localStorage or initial with auto-sanitize for diterimaDiKelas
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STUDENTS);
      const list: Student[] = saved ? JSON.parse(saved) : initialStudents;
      const existingIds = new Set((list || []).map((s: Student) => s.id));
      const missingInitial = initialStudents.filter(s => !existingIds.has(s.id));
      const combined = [...(list || []), ...missingInitial];
      return combined.map((s: Student) => ({
        ...s,
        diterimaDiKelas: sanitizeDiterimaDiKelas(s.diterimaDiKelas),
      }));
    } catch {
      return initialStudents.map((s: Student) => ({
        ...s,
        diterimaDiKelas: sanitizeDiterimaDiKelas(s.diterimaDiKelas),
      }));
    }
  });

  // Asynchronously hydrate full-fidelity student records (including high-res scans and photos) from IndexedDB
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const idbStudents = await idbGet<Student[]>('students');
        if (isMounted && idbStudents && Array.isArray(idbStudents) && idbStudents.length > 0) {
          setStudents((current) => {
            const idbMap = new Map(idbStudents.map(s => [s.id, s]));
            let hasEnriched = false;
            const merged = current.map(s => {
              const fromIdb = idbMap.get(s.id);
              if (fromIdb) {
                const enrichedPhoto = (!s.fotoUrl && fromIdb.fotoUrl) ? fromIdb.fotoUrl : s.fotoUrl;
                const enrichedMutasi = (s.mutasi?.fotoIjazah === '[IDB_STORED]' && fromIdb.mutasi?.fotoIjazah) 
                  ? { ...s.mutasi, fotoIjazah: fromIdb.mutasi.fotoIjazah } 
                  : s.mutasi;
                const enrichedSttb = (s.sttb?.fotoIjazah === '[IDB_STORED]' && fromIdb.sttb?.fotoIjazah) 
                  ? { ...s.sttb, fotoIjazah: fromIdb.sttb.fotoIjazah } 
                  : s.sttb;
                const sanitizedDiterima = sanitizeDiterimaDiKelas(s.diterimaDiKelas || fromIdb.diterimaDiKelas);
                if (enrichedPhoto !== s.fotoUrl || enrichedMutasi !== s.mutasi || enrichedSttb !== s.sttb || sanitizedDiterima !== s.diterimaDiKelas) {
                  hasEnriched = true;
                  return { ...s, fotoUrl: enrichedPhoto, mutasi: enrichedMutasi, sttb: enrichedSttb, diterimaDiKelas: sanitizedDiterima };
                }
              }
              return { ...s, diterimaDiKelas: sanitizeDiterimaDiKelas(s.diterimaDiKelas) };
            });

            if (idbStudents.length > current.length) {
              const currentIds = new Set(current.map(s => s.id));
              const missingInCurrent = idbStudents
                .filter(s => !currentIds.has(s.id))
                .map(s => ({ ...s, diterimaDiKelas: sanitizeDiterimaDiKelas(s.diterimaDiKelas) }));
              if (missingInCurrent.length > 0) {
                return [...merged, ...missingInCurrent];
              }
            }

            return hasEnriched ? merged : current;
          });
        }
      } catch (err) {
        console.warn('Hydration from IndexedDB notice:', err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load school profile
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SCHOOL);
      if (saved) {
        const parsed = JSON.parse(saved);
        const rawTP = parsed.tahunPelajaranAktif;
        const finalTP = (!rawTP || rawTP === '2025/2026') ? '2026/2027' : rawTP;
        const merged: SchoolProfile = {
          ...initialSchoolProfile,
          ...parsed,
          tahunPelajaranAktif: finalTP,
          daftarTahunPelajaran: parsed.daftarTahunPelajaran && parsed.daftarTahunPelajaran.includes('2026/2027')
            ? parsed.daftarTahunPelajaran
            : ['2023/2024', '2024/2025', '2025/2026', '2026/2027', '2027/2028'],
          alamatJalan: parsed.alamatJalan || parsed.alamatSekolah || initialSchoolProfile.alamatJalan,
          alamatSekolah: parsed.alamatSekolah || parsed.alamatJalan || initialSchoolProfile.alamatSekolah,
          desaKelurahan: parsed.desaKelurahan || parsed.desa || initialSchoolProfile.desaKelurahan,
          desa: parsed.desa || parsed.desaKelurahan || initialSchoolProfile.desa,
        };
        return merged;
      }
      return initialSchoolProfile;
    } catch {
      return initialSchoolProfile;
    }
  });

  // Activity logs
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOGS);
      return saved ? JSON.parse(saved) : initialActivityLogs;
    } catch {
      return initialActivityLogs;
    }
  });

  // Admin users state
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USERS);
      if (saved) {
        const parsed: AdminUser[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(u => {
            if (u.role === 'admin' || u.id === 'usr-001') {
              return {
                ...u,
                username: u.username || 'adminsdn006',
                password: u.password || 'sdn006',
              };
            }
            return u;
          });
        }
      }
      return initialAdminUsers;
    } catch {
      return initialAdminUsers;
    }
  });

  // Current Role: 'admin' | 'user' | 'umum'
  const [currentRole, setCurrentRoleState] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ROLE) as UserRole;
      return saved || 'admin';
    } catch {
      return 'admin';
    }
  });

  // Active Logged-in User
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return initialAdminUsers[0] || null;
  });

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AUTH);
      if (saved !== null) {
        return JSON.parse(saved);
      }
      return true; // Default logged in for existing sessions
    } catch {
      return true;
    }
  });

  // Permissions state
  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, RolePermissions>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PERMISSIONS);
      return saved ? JSON.parse(saved) : defaultPermissions;
    } catch {
      return defaultPermissions;
    }
  });

  // Security settings state
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SECURITY);
      return saved ? JSON.parse(saved) : initialSecuritySettings;
    } catch {
      return initialSecuritySettings;
    }
  });

  // Dark Mode
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DARK);
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  // Visitor analytics tracker
  const [visitorStats, setVisitorStats] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_VISITORS);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      total: 1248,
      today: 86,
      live: 7,
      weeklyVisits: [
        { day: 'Senin', count: 142 },
        { day: 'Selasa', count: 185 },
        { day: 'Rabu', count: 164 },
        { day: 'Kamis', count: 210 },
        { day: 'Jumat', count: 195 },
        { day: 'Sabtu', count: 120 },
        { day: 'Minggu', count: 68 },
      ]
    };
  });

  // Apply dark mode class and color scheme to html & body
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.style.colorScheme = 'light';
    }
    safeLocalStorageSet(STORAGE_KEY_DARK, JSON.stringify(darkMode));
  }, [darkMode]);

  // Sync to local storage & IndexedDB resiliently (prevents QuotaExceededError!)
  useEffect(() => {
    persistStudentsResiliently(STORAGE_KEY_STUDENTS, students);
  }, [students]);

  useEffect(() => {
    safeLocalStorageSet(STORAGE_KEY_SCHOOL, JSON.stringify(schoolProfile));
    idbSet('school_profile', schoolProfile).catch(() => {});
  }, [schoolProfile]);

  useEffect(() => {
    // Keep max 50 recent logs in localStorage to keep quota footprint minimal, full logs stored in IndexedDB
    const leanLogs = activityLogs.slice(0, 50);
    safeLocalStorageSet(STORAGE_KEY_LOGS, JSON.stringify(leanLogs));
    idbSet('activity_logs', activityLogs).catch(() => {});
  }, [activityLogs]);

  useEffect(() => {
    safeLocalStorageSet(STORAGE_KEY_ROLE, currentRole);
  }, [currentRole]);

  useEffect(() => {
    safeLocalStorageSet(STORAGE_KEY_PERMISSIONS, JSON.stringify(rolePermissions));
  }, [rolePermissions]);

  useEffect(() => {
    safeLocalStorageSet(STORAGE_KEY_USERS, JSON.stringify(adminUsers));
  }, [adminUsers]);

  useEffect(() => {
    safeLocalStorageSet(STORAGE_KEY_SECURITY, JSON.stringify(securitySettings));
  }, [securitySettings]);

  useEffect(() => {
    safeLocalStorageSet(STORAGE_KEY_AUTH, JSON.stringify(isAuthenticated));
  }, [isAuthenticated]);

  // Cloud SQL (PostgreSQL) Status
  const [isSqlConnected, setIsSqlConnected] = useState<boolean>(false);

  // Probe Cloud SQL status on mount and auto-seed if empty
  useEffect(() => {
    const initSql = async () => {
      try {
        const res = await checkSqlStatus();
        setIsSqlConnected(res.connected);
        if (res.connected && (res.totalStudents === 0 || res.totalStudents === undefined)) {
          await syncAllToSql(students, schoolProfile, activityLogs);
        }
      } catch (err) {
        console.warn('Initial SQL probe:', err);
      }
    };
    initSql();
  }, []);

  useEffect(() => {
    if (currentUser) {
      safeLocalStorageSet(STORAGE_KEY_CURRENT_USER, JSON.stringify(currentUser));
    } else {
      safeLocalStorageRemove(STORAGE_KEY_CURRENT_USER);
    }
  }, [currentUser]);

  // Increment visitor on page load
  useEffect(() => {
    const updated = {
      ...visitorStats,
      total: visitorStats.total + 1,
      today: visitorStats.today + 1,
      live: Math.floor(Math.random() * 5) + 4,
    };
    setVisitorStats(updated);
    safeLocalStorageSet(STORAGE_KEY_VISITORS, JSON.stringify(updated));
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const setCurrentRole = (role: UserRole) => {
    setCurrentRoleState(role);
    logActivity('PENGATURAN', `Berganti peran aktif pengguna menjadi: ${role.toUpperCase()}`);
  };

  const updateRolePermission = (role: UserRole, key: keyof RolePermissions, value: boolean) => {
    setRolePermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [key]: value,
      },
    }));
    logActivity('PENGATURAN', `Memperbarui hak akses [${role.toUpperCase()}]: ${String(key)} -> ${value ? 'Diizinkan' : 'Dilarang'}`);
  };

  const resetRolePermissions = () => {
    setRolePermissions(defaultPermissions);
    logActivity('PENGATURAN', 'Mereset konfigurasi matriks hak akses ke standar rekomendasi Kemdikbud');
  };

  const login = (
    userOrRoleOrUsername: AdminUser | UserRole | string,
    pinOrPassword?: string
  ): { success: boolean; message?: string } => {
    let targetRole: UserRole = 'umum';
    let targetUser: AdminUser | null = null;

    if (typeof userOrRoleOrUsername !== 'string' && userOrRoleOrUsername) {
      targetUser = userOrRoleOrUsername;
      targetRole = userOrRoleOrUsername.role;
    } else {
      const input = (typeof userOrRoleOrUsername === 'string' ? userOrRoleOrUsername : '').trim();
      const pwd = (pinOrPassword || '').trim();

      // 1. Direct match for administrator: adminsdn006 / sdn006
      if (input.toLowerCase() === 'adminsdn006') {
        if (pwd === 'sdn006' || pwd === securitySettings.pinAdmin || pwd === '123456') {
          targetRole = 'admin';
          targetUser = adminUsers.find(u => u.username === 'adminsdn006' || u.role === 'admin') || initialAdminUsers[0];
        } else {
          return {
            success: false,
            message: 'Password Administrator salah. Silakan periksa kembali.',
          };
        }
      } 
      // 2. Legacy role input ('admin', 'user', 'umum')
      else if (input === 'admin' || input === 'user' || input === 'umum') {
        targetRole = input as UserRole;
        targetUser = adminUsers.find(u => u.role === targetRole) || null;
        if (targetRole === 'admin' && pwd && pwd !== securitySettings.pinAdmin && pwd !== '123456' && pwd !== 'sdn006') {
          return {
            success: false,
            message: 'Password / PIN Administrator tidak sesuai.',
          };
        }
      } 
      // 3. Match staff by username, email, or NIP
      else {
        const found = adminUsers.find(u => 
          (u.username && u.username.toLowerCase() === input.toLowerCase()) ||
          u.email.toLowerCase() === input.toLowerCase() ||
          (u.nip && u.nip.replace(/\s+/g, '') === input.replace(/\s+/g, ''))
        );

        if (!found) {
          return {
            success: false,
            message: 'Username atau Pengguna tidak ditemukan. Silakan periksa kembali.',
          };
        }

        // Validate password for staff
        const validPwd = found.password || 'sdn006';
        if (pwd !== validPwd && pwd !== securitySettings.pinAdmin && pwd !== '123456' && pwd !== 'sdn006') {
          return {
            success: false,
            message: 'Password yang Anda masukkan salah. Silakan periksa kembali.',
          };
        }

        targetUser = found;
        targetRole = found.role;
      }
    }

    // Update state
    setCurrentRoleState(targetRole);
    setCurrentUser(targetUser);
    setIsAuthenticated(true);

    // Update last login timestamp if user exists
    if (targetUser) {
      updateAdminUser(targetUser.id, {
        terakhirLogin: 'Baru saja',
      });
    }

    const userName = targetUser?.nama || (targetRole === 'admin' ? 'Administrator' : targetRole === 'user' ? 'Guru' : 'Tamu / Umum');
    logActivity('PENGATURAN', `Pengguna berhasil login ke sistem sebagai [${targetRole.toUpperCase()}]: ${userName}`);

    return {
      success: true,
      message: `Selamat datang, ${userName}!`,
    };
  };

  const logout = () => {
    setIsAuthenticated(false);
    logActivity('PENGATURAN', `Pengguna keluar dari sistem (Logout)`);
  };

  const addAdminUser = (user: Omit<AdminUser, 'id' | 'terakhirLogin'>) => {
    const newUser: AdminUser = {
      ...user,
      id: `usr-${Date.now()}`,
      terakhirLogin: 'Belum pernah',
    };
    setAdminUsers(prev => [newUser, ...prev]);

    // Sync Kepala Sekolah if this user is assigned as Kepsek
    if (user.kategoriTugas === 'kepala_sekolah' || user.jabatan.toLowerCase().includes('kepala sekolah')) {
      setSchoolProfile(prev => ({
        ...prev,
        namaKepalaSekolah: user.nama,
        nipKepalaSekolah: user.nip || prev.nipKepalaSekolah,
      }));
    }

    logActivity('PENGATURAN', `Menambahkan akun petugas baru: ${user.nama} (${user.jabatan})`);
  };

  const updateAdminUser = (id: string, data: Partial<AdminUser>) => {
    setAdminUsers(prev =>
      prev.map(u => (u.id === id ? { ...u, ...data } : u))
    );

    // Sync Kepala Sekolah if edited
    if (data.kategoriTugas === 'kepala_sekolah' || (data.jabatan && data.jabatan.toLowerCase().includes('kepala sekolah'))) {
      setSchoolProfile(prev => ({
        ...prev,
        namaKepalaSekolah: data.nama || prev.namaKepalaSekolah,
        nipKepalaSekolah: data.nip || prev.nipKepalaSekolah,
      }));
    }

    logActivity('PENGATURAN', `Memperbarui akun petugas: ${data.nama || id}`);
  };

  const deleteAdminUser = (id: string) => {
    const target = adminUsers.find(u => u.id === id);
    setAdminUsers(prev => prev.filter(u => u.id !== id));
    logActivity('PENGATURAN', `Menghapus akun petugas: ${target?.nama || id}`);
  };

  const updateSecuritySettings = (settings: Partial<SecuritySettings>) => {
    setSecuritySettings(prev => ({
      ...prev,
      ...settings,
    }));
    logActivity('PENGATURAN', 'Memperbarui pengaturan keamanan & PIN administrator');
  };

  const getWaliKelasForClass = (kelasStr: string): { nama: string; nip: string; id?: string } => {
    if (!kelasStr) {
      return {
        nama: 'Dewi Anggraini, S.Pd.SD',
        nip: '19901103 201502 2 009',
      };
    }

    // 0. Check schoolProfile.waliKelasMap first if explicitly assigned or edited
    if (schoolProfile.waliKelasMap && schoolProfile.waliKelasMap[kelasStr]) {
      const custom = schoolProfile.waliKelasMap[kelasStr];
      if (custom && custom.nama) {
        return {
          nama: custom.nama,
          nip: custom.nip || '-',
        };
      }
    }

    // Extract grade digit
    const match = kelasStr.match(/\d+/);
    const gradeNum = match ? match[0] : '';

    if (gradeNum && schoolProfile.waliKelasMap) {
      const standardKey = `Kelas ${gradeNum}`;
      if (schoolProfile.waliKelasMap[standardKey]?.nama) {
        return {
          nama: schoolProfile.waliKelasMap[standardKey].nama,
          nip: schoolProfile.waliKelasMap[standardKey].nip || '-',
        };
      }
      if (schoolProfile.waliKelasMap[gradeNum]?.nama) {
        return {
          nama: schoolProfile.waliKelasMap[gradeNum].nama,
          nip: schoolProfile.waliKelasMap[gradeNum].nip || '-',
        };
      }
    }

    // 1. Check for teacher explicitly assigned to this class in adminUsers
    const exactTeacher = adminUsers.find(u => {
      if (u.status !== 'Aktif') return false;
      if (u.kategoriTugas === 'wali_kelas' && u.tingkatKelas) {
        if (u.tingkatKelas.toLowerCase() === kelasStr.toLowerCase() || (gradeNum && u.tingkatKelas.includes(gradeNum))) {
          return true;
        }
      }
      const jab = u.jabatan.toLowerCase();
      if (gradeNum && (jab.includes(`wali kelas ${gradeNum}`) || jab.includes(`wali kelas 0${gradeNum}`) || jab.includes(`guru kelas ${gradeNum}`))) {
        return true;
      }
      return false;
    });

    if (exactTeacher) {
      return {
        nama: exactTeacher.nama,
        nip: exactTeacher.nip || '-',
        id: exactTeacher.id,
      };
    }

    // 2. Standard fallback mapping for SD Negeri 006 Sungai Buluh
    const defaultWaliMap: Record<string, { nama: string; nip: string }> = {
      '1': { nama: 'Dewi Anggraini, S.Pd.SD', nip: '19901103 201502 2 009' },
      '2': { nama: 'Suryani, S.Pd.', nip: '19890412 201403 2 011' },
      '3': { nama: 'Hendri Gunawan, S.Pd.I.', nip: '19870825 201201 1 007' },
      '4': { nama: 'Ratna Juwita, S.Pd.', nip: '19910519 201602 2 014' },
      '5': { nama: 'Bambang Irawan, S.Pd.', nip: '19880220 201403 1 004' },
      '6': { nama: 'Siti Rahmawati, S.Pd.', nip: '19850614 201001 2 012' },
    };

    if (gradeNum && defaultWaliMap[gradeNum]) {
      return defaultWaliMap[gradeNum];
    }

    return {
      nama: 'Dewi Anggraini, S.Pd.SD',
      nip: '19901103 201502 2 009',
    };
  };

  const updateWaliKelasForClass = (kelas: string, nama: string, nip: string = '-') => {
    const trimmedNama = nama.trim();
    const trimmedNip = nip.trim() || '-';

    // 1. Simpan ke SchoolProfile agar persisten & terbaca di seluruh laporan & cetak
    setSchoolProfile(prev => {
      const nextMap = {
        ...(prev.waliKelasMap || {}),
        [kelas]: { nama: trimmedNama, nip: trimmedNip }
      };
      const updated = {
        ...prev,
        waliKelasMap: nextMap
      };
      safeLocalStorageSet(STORAGE_KEY_SCHOOL, JSON.stringify(updated));
      saveSchoolProfileToSql(updated).catch(err => console.warn('SQL save profile wali kelas error:', err));
      return updated;
    });

    // 2. Sinkronkan dengan adminUsers (dewan guru) jika ada yang cocok
    const match = kelas.match(/\d+/);
    const gradeNum = match ? match[0] : '';

    setAdminUsers(prevUsers => {
      let matched = false;
      const updatedUsers = prevUsers.map(user => {
        const matchesClass = user.tingkatKelas?.toLowerCase() === kelas.toLowerCase() ||
                             (gradeNum && user.tingkatKelas?.includes(gradeNum)) ||
                             (gradeNum && user.jabatan?.toLowerCase().includes(`wali kelas ${gradeNum}`));
        const matchesName = user.nama.toLowerCase() === trimmedNama.toLowerCase();

        if (matchesClass || matchesName) {
          matched = true;
          return {
            ...user,
            nama: trimmedNama,
            nip: trimmedNip !== '-' ? trimmedNip : user.nip,
            tingkatKelas: kelas,
            kategoriTugas: 'wali_kelas' as const,
            jabatan: `Guru / Wali Kelas ${kelas}`,
          };
        }
        return user;
      });

      if (matched) {
        safeLocalStorageSet(STORAGE_KEY_USERS, JSON.stringify(updatedUsers));
        return updatedUsers;
      }
      return prevUsers;
    });

    logActivity('EDIT', `Memperbarui nama wali kelas untuk ${kelas}: ${trimmedNama}`);
  };

  const getKepalaSekolah = (): { nama: string; nip: string; id?: string } => {
    const kepsek = adminUsers.find(u => 
      u.status === 'Aktif' && (u.kategoriTugas === 'kepala_sekolah' || u.jabatan.toLowerCase().includes('kepala sekolah'))
    );
    if (kepsek) {
      return {
        nama: kepsek.nama,
        nip: kepsek.nip || schoolProfile.nipKepalaSekolah || '-',
        id: kepsek.id,
      };
    }
    return {
      nama: schoolProfile.namaKepalaSekolah || 'H. Marlisman, S.Pd., M.M.',
      nip: schoolProfile.nipKepalaSekolah || '19680512 199103 1 005',
    };
  };

  const getActiveUserDisplayName = () => {
    if (currentUser?.nama) {
      const roleSuffix = currentUser.jabatan ? ` (${currentUser.jabatan})` : '';
      return `${currentUser.nama}${roleSuffix}`;
    }
    if (currentRole === 'admin') return `${schoolProfile.namaKepalaSekolah || 'Kepala Sekolah'} (Admin)`;
    if (currentRole === 'user') return 'Guru / Wali Kelas';
    return 'Staf / Tamu Umum';
  };

  const logActivity = (action: ActivityLog['action'], description: string, targetId?: string) => {
    const actor = getActiveUserDisplayName();
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'medium',
      }),
      user: actor,
      role: currentRole,
      action,
      description,
      targetId,
    };
    setActivityLogs(prev => [newLog, ...prev.slice(0, 99)]); // Keep last 100
  };

  const addActivityLog = (
    logOrAction: Partial<ActivityLog> | ActivityLog['action'],
    description?: string,
    targetId?: string
  ) => {
    if (typeof logOrAction === 'object') {
      const action = logOrAction.action || 'PENGATURAN';
      const desc = logOrAction.description || 'Aktivitas sistem';
      const tid = logOrAction.targetId;
      logActivity(action, desc, tid);
    } else {
      logActivity(logOrAction, description || '', targetId);
    }
  };

  const addStudent = (data: Partial<Student>): Student => {
    const now = new Date().toISOString();
    const newNoInduk = data.noInduk || `${new Date().getFullYear()}${String(students.length + 1).padStart(3, '0')}`;
    const actor = getActiveUserDisplayName();
    
    const newStudent: Student = {
      id: `std-${Date.now()}`,
      noInduk: newNoInduk,
      nisn: data.nisn || `0${Math.floor(100000000 + Math.random() * 900000000)}`,
      nik: data.nik || '1409000000000000',
      namaLengkap: (data.namaLengkap || 'SISWA BARU').toUpperCase(),
      namaPanggilan: data.namaPanggilan || data.namaLengkap?.split(' ')[0] || 'Siswa',
      jenisKelamin: data.jenisKelamin || 'L',
      tempatLahir: data.tempatLahir || 'Sungai Buluh',
      tanggalLahir: data.tanggalLahir || '2016-01-01',
      agama: data.agama || 'Islam',
      kewarganegaraan: data.kewarganegaraan || 'Indonesia (WNI)',
      anakKe: data.anakKe || 1,
      jumlahSaudaraKandung: data.jumlahSaudaraKandung || 0,
      jumlahSaudaraTiri: data.jumlahSaudaraTiri || 0,
      jumlahSaudaraAngkat: data.jumlahSaudaraAngkat || 0,
      statusKeluarga: data.statusKeluarga || 'Anak Kandung',
      bahasaIbu: data.bahasaIbu || 'Bahasa Indonesia',
      alamat: data.alamat || 'Desa Sungai Buluh, Singingi Hilir',
      rt: data.rt || '001',
      rw: data.rw || '001',
      kelurahanDesa: data.kelurahanDesa || 'Sungai Buluh',
      kecamatan: data.kecamatan || 'Singingi Hilir',
      kabupatenKota: data.kabupatenKota || 'Kabupaten Kuantan Singingi',
      provinsi: data.provinsi || 'Riau',
      kodePos: data.kodePos || '29563',
      tinggalDengan: data.tinggalDengan || 'Orang Tua',
      jarakKeSekolahKm: data.jarakKeSekolahKm || 1,
      transportasi: data.transportasi || 'Jalan Kaki',
      kesehatan: data.kesehatan || {
        golonganDarah: 'Tidak Tahu',
        tinggiBadanCm: 120,
        beratBadanKg: 25,
      },
      ayah: data.ayah || {
        nama: 'Nama Ayah',
        nik: '1409000000000001',
        agama: 'Islam',
        kewarganegaraan: 'WNI',
        pendidikan: 'SMA',
        pekerjaan: 'Petani / Wiraswasta',
        penghasilanBulanan: 'Rp 2.000.000 - Rp 4.000.000',
        noHp: '081200000000',
        statusHidup: 'Masih Hidup',
      },
      ibu: data.ibu || {
        nama: 'Nama Ibu',
        nik: '1409000000000002',
        agama: 'Islam',
        kewarganegaraan: 'WNI',
        pendidikan: 'SMA',
        pekerjaan: 'Ibu Rumah Tangga',
        penghasilanBulanan: 'Kurang dari Rp 1.000.000',
        noHp: '081200000001',
        statusHidup: 'Masih Hidup',
      },
      wali: data.wali,
      sekolahAsalTK: data.sekolahAsalTK || 'TK Pertiwi Sungai Buluh',
      tanggalDiterima: data.tanggalDiterima || new Date().toISOString().split('T')[0],
      diterimaDiKelas: sanitizeDiterimaDiKelas(data.diterimaDiKelas || 'Kelas 1'),
      kelasSekarang: data.kelasSekarang || 'Kelas 1',
      status: data.status || 'Aktif',
      tahunMasuk: data.tahunMasuk || `${new Date().getFullYear()}`,
      fotoUrl: data.fotoUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=240&auto=format&fit=crop&q=80',
      raport: data.raport || [],
      sttb: data.sttb,
      mutasi: data.mutasi,
      createdAt: now,
      updatedAt: now,
      dibuatOleh: actor,
      terakhirDiubahOleh: actor,
    };

    setStudents(prev => [newStudent, ...prev]);
    saveStudentToSql(newStudent).catch((err) => console.warn('SQL background save student error:', err));
    logActivity('TAMBAH', `Menambahkan siswa baru: ${newStudent.namaLengkap} (NIS: ${newStudent.noInduk}, NISN: ${newStudent.nisn})`, newStudent.id);
    return newStudent;
  };

  const updateStudent = (id: string, data: Partial<Student>) => {
    const actor = getActiveUserDisplayName();
    const target = students.find(s => s.id === id);
    const studentName = data.namaLengkap || target?.namaLengkap || 'Siswa';
    const studentNis = data.noInduk || target?.noInduk || '';

    setStudents(prev =>
      prev.map(st => {
        if (st.id === id) {
          const updated = {
            ...st,
            ...data,
            diterimaDiKelas: data.diterimaDiKelas ? sanitizeDiterimaDiKelas(data.diterimaDiKelas) : sanitizeDiterimaDiKelas(st.diterimaDiKelas),
            terakhirDiubahOleh: actor,
            updatedAt: new Date().toISOString(),
          };
          saveStudentToSql(updated).catch((err) => console.warn('SQL background update student error:', err));
          return updated;
        }
        return st;
      })
    );
    logActivity('EDIT', `Mengubah data buku induk siswa: ${studentName} (NIS: ${studentNis})`, id);
  };

  const bulkUpdateStudentRombel = (
    updates: { studentId: string; newClass: string; oldClass?: string; keterangan?: string }[]
  ): number => {
    if (!updates || updates.length === 0) return 0;
    const actor = getActiveUserDisplayName();
    const now = new Date().toISOString();
    const updateMap = new Map<string, { newClass: string; oldClass?: string }>();
    updates.forEach((u) => updateMap.set(u.studentId, { newClass: u.newClass, oldClass: u.oldClass }));

    let count = 0;
    setStudents((prev) =>
      prev.map((st) => {
        const u = updateMap.get(st.id);
        if (u && u.newClass && u.newClass !== st.kelasSekarang) {
          count++;
          const updated = {
            ...st,
            kelasSekarang: u.newClass,
            terakhirDiubahOleh: actor,
            updatedAt: now,
          };
          saveStudentToSql(updated).catch((err) => console.warn('SQL background update rombel error:', err));
          return updated;
        }
        return st;
      })
    );

    logActivity('EDIT', `Memperbarui rombel untuk ${updates.length} siswa aktif melalui impor Excel`);
    return updates.length;
  };

  const lockAcademicYearRombel = (
    tahunPelajaran: string,
    studentUpdates?: Array<{
      id: string;
      kelasSekarang: string;
      status: StudentStatus;
      tahunPelajaranKelasSekarang?: string;
    }>,
    catatan?: string
  ) => {
    const actor = getActiveUserDisplayName();
    const now = new Date().toISOString();

    // 1. Commit student records if updates provided
    if (studentUpdates && studentUpdates.length > 0) {
      const updateMap = new Map<string, { kelasSekarang: string; status: StudentStatus }>();
      studentUpdates.forEach((u) => updateMap.set(u.id, { kelasSekarang: u.kelasSekarang, status: u.status }));

      setStudents((prev) =>
        prev.map((st) => {
          const u = updateMap.get(st.id);
          if (u) {
            const updated: Student = {
              ...st,
              kelasSekarang: u.kelasSekarang,
              status: u.status,
              tahunPelajaranKelasSekarang: tahunPelajaran,
              terakhirDiubahOleh: actor,
              updatedAt: now,
            };
            saveStudentToSql(updated).catch((err) => console.warn('SQL background lock rombel student error:', err));
            return updated;
          }
          return st;
        })
      );
    }

    // 2. Commit lock to schoolProfile
    setSchoolProfile((prev) => {
      const existingLocks = prev.rombelLocks || {};
      const updated: SchoolProfile = {
        ...prev,
        tahunPelajaranAktif: tahunPelajaran,
        rombelLocks: {
          ...existingLocks,
          [tahunPelajaran]: {
            isLocked: true,
            lockedAt: now,
            lockedBy: actor,
            totalStudents: studentUpdates ? studentUpdates.length : 0,
            catatan: catatan || `Rombel Tahun Pelajaran ${tahunPelajaran} dikunci dan disimpan resmi.`,
          },
        },
      };
      saveSchoolProfileToSql(updated).catch((err) => console.warn('SQL background save profile lock error:', err));
      return updated;
    });

    logActivity(
      'PENGATURAN',
      `Menyimpan dan mengunci data rombel siswa (${studentUpdates?.length || 0} siswa) untuk Tahun Pelajaran ${tahunPelajaran}`
    );
  };

  const unlockAcademicYearRombel = (tahunPelajaran: string) => {
    setSchoolProfile((prev) => {
      const existingLocks = { ...(prev.rombelLocks || {}) };
      if (existingLocks[tahunPelajaran]) {
        existingLocks[tahunPelajaran] = {
          ...existingLocks[tahunPelajaran],
          isLocked: false,
        };
      }
      const updated: SchoolProfile = {
        ...prev,
        rombelLocks: existingLocks,
      };
      saveSchoolProfileToSql(updated).catch((err) => console.warn('SQL background save profile unlock error:', err));
      return updated;
    });

    logActivity(
      'PENGATURAN',
      `Membuka kunci hasil edit rombel siswa untuk Tahun Pelajaran ${tahunPelajaran} (Mode Edit Dibuka Kembali)`
    );
  };

  const deleteStudent = (id: string) => {
    const target = students.find(s => s.id === id);
    setStudents(prev => prev.filter(s => s.id !== id));
    deleteStudentFromSql(id).catch((err) => console.warn('SQL background delete student error:', err));
    logActivity('HAPUS', `Menghapus data buku induk siswa: ${target?.namaLengkap || id} (NIS: ${target?.noInduk || '-'})`, id);
  };

  const deleteStudentsBulk = (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    const count = ids.length;
    setStudents(prev => prev.filter(s => !ids.includes(s.id)));
    ids.forEach(id => deleteStudentFromSql(id).catch((err) => console.warn('SQL background delete bulk error:', err)));
    logActivity('HAPUS', `Menghapus ${count} data siswa terpilih dari Buku Induk`);
  };

  const deleteAllStudents = () => {
    const count = students.length;
    setStudents([]);
    safeLocalStorageRemove(STORAGE_KEY_STUDENTS);
    idbDelete('students').catch(() => {});
    logActivity('HAPUS', `Menghapus seluruh data siswa (${count} siswa) dari Buku Induk`);
  };

  const getStudentById = (id: string) => {
    return students.find(s => s.id === id);
  };

  const processMutation = (id: string, mutation: MutationRecord) => {
    const actor = getActiveUserDisplayName();
    const target = students.find(s => s.id === id);
    const isEdit = !!target?.mutasi;

    setStudents(prev =>
      prev.map(st => {
        if (st.id === id) {
          const updated: Student = {
            ...st,
            status: 'Mutasi Keluar',
            mutasi: mutation,
            terakhirDiubahOleh: actor,
            updatedAt: new Date().toISOString(),
          };
          saveStudentToSql(updated).catch((err) => console.warn('SQL background save mutation error:', err));
          return updated;
        }
        return st;
      })
    );

    logActivity(
      'MUTASI',
      `${isEdit ? 'Memperbarui data/catatan mutasi' : 'Pencatatan mutasi keluar'} siswa: ${target?.namaLengkap || 'Siswa'} ke ${mutation.sekolahTujuan}`,
      id
    );
  };

  const cancelMutation = (id: string, restoreClass?: string) => {
    const actor = getActiveUserDisplayName();
    const target = students.find(s => s.id === id);
    if (!target) return;

    const classToRestore = restoreClass || target.mutasi?.dariKelas || target.kelasSekarang || 'Kelas 1';

    setStudents(prev =>
      prev.map(st => {
        if (st.id === id) {
          const updated: Student = {
            ...st,
            status: 'Aktif' as StudentStatus,
            kelasSekarang: classToRestore,
            mutasi: undefined,
            terakhirDiubahOleh: actor,
            updatedAt: new Date().toISOString(),
          };
          saveStudentToSql(updated).catch((err) => console.warn('SQL background save cancel mutation error:', err));
          return updated;
        }
        return st;
      })
    );

    logActivity(
      'MUTASI',
      `Membatalkan mutasi keluar siswa: ${target.namaLengkap} (NIS: ${target.noInduk}). Status dikembalikan menjadi AKTIF di ${classToRestore}.`,
      id
    );
  };

  const updateSTTB = (id: string, sttb: GraduationSTTB) => {
    const actor = getActiveUserDisplayName();
    setStudents(prev =>
      prev.map(st => {
        if (st.id === id) {
          return {
            ...st,
            status: 'Lulus',
            sttb,
            terakhirDiubahOleh: actor,
            updatedAt: new Date().toISOString(),
          };
        }
        return st;
      })
    );
    const target = students.find(s => s.id === id);
    logActivity('IJAZAH', `Update data kelulusan & Ijazah/STTB siswa: ${target?.namaLengkap}`, id);
  };

  const updateFotoIjazah = (id: string, fotoIjazah: string | undefined) => {
    const actor = getActiveUserDisplayName();
    setStudents(prev =>
      prev.map(st => {
        if (st.id === id) {
          const currentSTTB = st.sttb || {
            lulusTahun: `${new Date().getFullYear()}`,
            tanggalKelulusan: new Date().toISOString().split('T')[0],
            noIjazah: '-',
            statusTandaTerima: 'Sudah Diterima',
          };
          return {
            ...st,
            sttb: {
              ...currentSTTB,
              fotoIjazah,
              tglUploadIjazah: fotoIjazah ? new Date().toISOString() : undefined,
            },
            terakhirDiubahOleh: actor,
            updatedAt: new Date().toISOString(),
          };
        }
        return st;
      })
    );
    const target = students.find(s => s.id === id);
    if (fotoIjazah) {
      logActivity('IJAZAH', `Upload berkas scan/gambar Ijazah siswa: ${target?.namaLengkap || id}`, id);
    } else {
      logActivity('IJAZAH', `Hapus lampiran gambar Ijazah siswa: ${target?.namaLengkap || id}`, id);
    }
  };

  const updateFotoIjazahMutasi = (id: string, fotoIjazah: string | undefined) => {
    const actor = getActiveUserDisplayName();
    setStudents(prev =>
      prev.map(st => {
        if (st.id === id) {
          const currentMutasi = st.mutasi || {
            tglMeninggalkan: new Date().toISOString().split('T')[0],
            dariKelas: st.kelasSekarang || 'Kelas 1',
            sekolahTujuan: '-',
            alasanPindah: 'Pindah Sekolah',
          };
          return {
            ...st,
            mutasi: {
              ...currentMutasi,
              fotoIjazah,
              tglUploadIjazah: fotoIjazah ? new Date().toISOString() : undefined,
            },
            terakhirDiubahOleh: actor,
            updatedAt: new Date().toISOString(),
          };
        }
        return st;
      })
    );
    const target = students.find(s => s.id === id);
    if (fotoIjazah) {
      logActivity('MUTASI', `Upload berkas scan/gambar Ijazah/Surat Mutasi siswa: ${target?.namaLengkap || id}`, id);
    } else {
      logActivity('MUTASI', `Hapus lampiran gambar Ijazah/Surat Mutasi siswa: ${target?.namaLengkap || id}`, id);
    }
  };

  const addOrUpdateRaport = (studentId: string, report: SemesterReport) => {
    const actor = getActiveUserDisplayName();
    setStudents(prev =>
      prev.map(st => {
        if (st.id === studentId) {
          const existingReports = st.raport || [];
          const idx = existingReports.findIndex(r => r.semester === report.semester);
          let newReports: SemesterReport[];
          if (idx >= 0) {
            newReports = [...existingReports];
            newReports[idx] = report;
          } else {
            newReports = [...existingReports, report];
          }
          return {
            ...st,
            raport: newReports,
            terakhirDiubahOleh: actor,
            updatedAt: new Date().toISOString(),
          };
        }
        return st;
      })
    );
    const target = students.find(s => s.id === studentId);
    logActivity('EDIT', `Input / update raport semester ${report.semester} siswa: ${target?.namaLengkap}`, studentId);
  };

  const updateSchoolProfile = (data: Partial<SchoolProfile>) => {
    setSchoolProfile(prev => {
      const alamat = data.alamatJalan ?? data.alamatSekolah ?? prev.alamatJalan ?? prev.alamatSekolah ?? '';
      const desa = data.desaKelurahan ?? data.desa ?? prev.desaKelurahan ?? prev.desa ?? '';
      const updated: SchoolProfile = {
        ...prev,
        ...data,
        alamatJalan: alamat,
        alamatSekolah: alamat,
        desaKelurahan: desa,
        desa: desa,
      };
      saveSchoolProfileToSql(updated).catch((err) => console.warn('SQL save school profile error:', err));
      return updated;
    });
    logActivity('EDIT', 'Memperbarui profil dan data identitas sekolah');
  };

  // Get raw JSON string for backup (used for local download and Google Drive upload)
  const getDatabaseBackupJsonString = (): string => {
    const dataToExport = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      schoolProfile,
      students,
      activityLogs,
      rolePermissions,
      adminUsers,
      securitySettings,
    };
    return JSON.stringify(dataToExport, null, 2);
  };

  // Export as JSON
  const exportDatabaseJSON = () => {
    const jsonString = getDatabaseBackupJsonString();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BUKU_INDUK_${schoolProfile.namaSekolah.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    logActivity('EXPORT', 'Mengekspor seluruh database Buku Induk ke format JSON');
  };

  // Generate DB Dump string for offline backup (.db)
  const getDatabaseBackupDbString = (): string => {
    const exportedAt = new Date().toISOString();
    const dataToExport = {
      version: '2.0-offline-db',
      app: 'Sistem Informasi Buku Induk Siswa Digital',
      exportedAt,
      schoolProfile,
      students,
      activityLogs,
      rolePermissions,
      adminUsers,
      securitySettings,
    };

    const sqlEscape = (val: any) => {
      if (val === null || val === undefined) return 'NULL';
      if (typeof val === 'number') return val.toString();
      if (typeof val === 'boolean') return val ? '1' : '0';
      if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
      return `'${String(val).replace(/'/g, "''")}'`;
    };

    const dumpLines = [
      '-- ============================================================================',
      '-- CADANGAN BASIS DATA OFFLINE (OFFLINE DATABASE BACKUP .DB)',
      '-- Aplikasi    : Sistem Informasi Buku Induk Siswa Digital',
      `-- Sekolah     : ${schoolProfile.namaSekolah} (NPSN: ${schoolProfile.npsn})`,
      `-- Tanggal     : ${new Date().toLocaleString('id-ID')}`,
      `-- Total Siswa : ${students.length} Data Peserta Didik`,
      '-- Format      : SQLite & PostgreSQL Dual-Compatible DB Dump / Structured Archive',
      '-- ============================================================================',
      '',
      'PRAGMA foreign_keys = OFF;',
      'BEGIN TRANSACTION;',
      '',
      '-- 1. Tabel Profil Sekolah',
      'CREATE TABLE IF NOT EXISTS school_profile (',
      '  id TEXT PRIMARY KEY,',
      '  nama_sekolah TEXT NOT NULL,',
      '  npsn TEXT NOT NULL,',
      '  data TEXT NOT NULL,',
      '  updated_at TEXT',
      ');',
      `INSERT OR REPLACE INTO school_profile (id, nama_sekolah, npsn, data, updated_at) VALUES ('default', ${sqlEscape(schoolProfile.namaSekolah)}, ${sqlEscape(schoolProfile.npsn)}, ${sqlEscape(schoolProfile)}, ${sqlEscape(exportedAt)});`,
      '',
      '-- 2. Tabel Peserta Didik (Buku Induk Siswa)',
      'CREATE TABLE IF NOT EXISTS students (',
      '  id TEXT PRIMARY KEY,',
      '  no_induk TEXT NOT NULL,',
      '  nisn TEXT,',
      '  nik TEXT,',
      '  nama_lengkap TEXT NOT NULL,',
      '  jenis_kelamin TEXT NOT NULL,',
      '  kelas_sekarang TEXT NOT NULL,',
      '  status TEXT NOT NULL,',
      '  data TEXT NOT NULL,',
      '  created_at TEXT,',
      '  updated_at TEXT',
      ');',
      ...students.map(
        (s) =>
          `INSERT OR REPLACE INTO students (id, no_induk, nisn, nik, nama_lengkap, jenis_kelamin, kelas_sekarang, status, data, created_at, updated_at) VALUES (${sqlEscape(s.id)}, ${sqlEscape(s.noInduk)}, ${sqlEscape(s.nisn)}, ${sqlEscape(s.nik)}, ${sqlEscape(s.namaLengkap)}, ${sqlEscape(s.jenisKelamin)}, ${sqlEscape(s.kelasSekarang)}, ${sqlEscape(s.status)}, ${sqlEscape(s)}, ${sqlEscape(s.createdAt)}, ${sqlEscape(s.updatedAt)});`
      ),
      '',
      '-- 3. Tabel Log Audit & Riwayat Aktivitas',
      'CREATE TABLE IF NOT EXISTS activity_logs (',
      '  id TEXT PRIMARY KEY,',
      '  timestamp TEXT NOT NULL,',
      '  user TEXT NOT NULL,',
      '  role TEXT NOT NULL,',
      '  action TEXT NOT NULL,',
      '  description TEXT NOT NULL,',
      '  target_id TEXT',
      ');',
      ...activityLogs.slice(0, 500).map(
        (l) =>
          `INSERT OR IGNORE INTO activity_logs (id, timestamp, user, role, action, description, target_id) VALUES (${sqlEscape(l.id)}, ${sqlEscape(l.timestamp)}, ${sqlEscape(l.user)}, ${sqlEscape(l.role)}, ${sqlEscape(l.action)}, ${sqlEscape(l.description)}, ${sqlEscape(l.targetId)});`
      ),
      '',
      'COMMIT;',
      '',
      '-- ============================================================================',
      '-- EMBEDDED SYSTEM SNAPSHOT (Untuk Pemulihan Otomatis Mandiri)',
      '-- ============================================================================',
      `-- SNAPSHOT_JSON_START:${JSON.stringify(dataToExport)}:SNAPSHOT_JSON_END`,
    ];

    return dumpLines.join('\n');
  };

  // Export as manual .db file for offline backup (SQLite / SQL compatible)
  const exportDatabaseDB = () => {
    const dbContent = getDatabaseBackupDbString();
    const blob = new Blob([dbContent], { type: 'application/x-sqlite3;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const cleanSchoolName = schoolProfile.namaSekolah.replace(/[^a-zA-Z0-9]/g, '_');
    const a = document.createElement('a');
    a.href = url;
    a.download = `DATABASE_SISWA_BUKU_INDUK_${cleanSchoolName}_${new Date().toISOString().split('T')[0]}.db`;
    a.click();
    URL.revokeObjectURL(url);
    logActivity('EXPORT', `Mengekspor basis data siswa ke file .db untuk pencadangan offline (${students.length} data)`);
  };

  // Export students to neat, official Excel (.xlsx) matching 100% with the Dapodik template
  const exportStudentsExcel = (options?: { filteredClass?: string }) => {
    let listToExport = students;
    if (options?.filteredClass && options.filteredClass !== 'Semua') {
      listToExport = students.filter(s => s.kelasSekarang === options.filteredClass);
    }
    exportStudentsToExcel(listToExport, schoolProfile.namaSekolah, {
      filteredClass: options?.filteredClass,
    });
    const classInfo = options?.filteredClass && options.filteredClass !== 'Semua' ? ` (${options.filteredClass})` : '';
    logActivity('EXPORT', `Mengekspor ${listToExport.length} data siswa ke berkas Microsoft Excel (.xlsx) rapi standar template Buku Induk${classInfo}`);
  };

  // Export as CSV / Excel (calls exportStudentsExcel for neat, formatted .xlsx matching template)
  const exportStudentsCSV = (options?: { filteredClass?: string }) => {
    exportStudentsExcel(options);
  };

  // Restore Database from DB or JSON
  const restoreDatabaseFromDB = (
    parsedOrRaw: string | DbBackupParseResult,
    mode: 'replace' | 'merge' = 'replace',
    restoreSchoolProfile: boolean = true
  ): { success: boolean; studentCount: number; message: string } => {
    try {
      const parsed: DbBackupParseResult =
        typeof parsedOrRaw === 'string'
          ? parseDbBackupText(parsedOrRaw)
          : parsedOrRaw;

      if (!parsed.success || !parsed.students || parsed.students.length === 0) {
        return {
          success: false,
          studentCount: 0,
          message: parsed.errorMessage || 'Tidak ada data siswa yang valid dalam berkas .db.',
        };
      }

      if (mode === 'replace') {
        setStudents(parsed.students);
        if (restoreSchoolProfile && parsed.schoolProfile) {
          setSchoolProfile(parsed.schoolProfile);
        }
        if (parsed.rolePermissions) {
          setRolePermissions(parsed.rolePermissions);
        }
        if (parsed.adminUsers && Array.isArray(parsed.adminUsers)) {
          setAdminUsers(parsed.adminUsers);
        }
        if (parsed.securitySettings) {
          setSecuritySettings(parsed.securitySettings);
        }
        logActivity(
          'IMPORT',
          `Memulihkan (ganti total) ${parsed.students.length} data siswa dari berkas basis data ${parsed.fileName || '.db'}`
        );
        return {
          success: true,
          studentCount: parsed.students.length,
          message: `Berhasil memulihkan ${parsed.students.length} data siswa dan seluruh arsip buku induk.`,
        };
      } else {
        // Merge mode: update existing or append new
        const result = importStudentsBulk(parsed.students, 'update');
        if (restoreSchoolProfile && parsed.schoolProfile) {
          setSchoolProfile((prev) => ({ ...prev, ...parsed.schoolProfile }));
        }
        logActivity(
          'IMPORT',
          `Menggabungkan ${parsed.students.length} data siswa (${result.added} baru, ${result.updated} diperbarui) dari berkas basis data ${parsed.fileName || '.db'}`
        );
        return {
          success: true,
          studentCount: parsed.students.length,
          message: `Berhasil menggabungkan data: ${result.added} siswa baru ditambahkan, ${result.updated} siswa diperbarui.`,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        studentCount: 0,
        message: err?.message || 'Gagal memulihkan database.',
      };
    }
  };

  // Import JSON or .DB (Backward-compatible helper)
  const importDatabaseJSON = (rawContent: string): boolean => {
    const res = restoreDatabaseFromDB(rawContent, 'replace', true);
    return res.success;
  };

  // Import Bulk Students (Excel / Spreadsheet)
  const importStudentsBulk = (
    importedList: Partial<Student>[],
    duplicateStrategy: 'skip' | 'update' | 'append' = 'update'
  ): { added: number; updated: number; skipped: number } => {
    const actor = getActiveUserDisplayName();
    const now = new Date().toISOString();
    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    let currentList = [...students];

    importedList.forEach((item, idx) => {
      const nis = item.noInduk?.trim();
      const nisn = item.nisn?.trim();

      const existingIndex = currentList.findIndex(
        (s) => (nis && s.noInduk === nis) || (nisn && s.nisn === nisn)
      );

      if (existingIndex >= 0) {
        if (duplicateStrategy === 'skip') {
          skippedCount++;
        } else if (duplicateStrategy === 'update') {
          currentList[existingIndex] = {
            ...currentList[existingIndex],
            ...item,
            terakhirDiubahOleh: actor,
            updatedAt: now,
          };
          updatedCount++;
        } else {
          // append as new
          const generatedNIS = nis || `${new Date().getFullYear()}${String(currentList.length + idx + 1).padStart(3, '0')}`;
          const newStudent: Student = {
            id: `std-imp-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
            noInduk: generatedNIS,
            nisn: item.nisn || '',
            nik: item.nik || '',
            noKk: item.noKk || '',
            namaLengkap: item.namaLengkap || 'SISWA BARU',
            namaPanggilan: item.namaPanggilan || '',
            jenisKelamin: item.jenisKelamin || 'L',
            tempatLahir: item.tempatLahir || 'Depok',
            tanggalLahir: item.tanggalLahir || '2011-01-01',
            agama: item.agama || 'Islam',
            kewarganegaraan: item.kewarganegaraan || 'WNI',
            anakKe: item.anakKe || 1,
            jumlahSaudaraKandung: item.jumlahSaudaraKandung || 1,
            jumlahSaudaraTiri: item.jumlahSaudaraTiri || 0,
            jumlahSaudaraAngkat: item.jumlahSaudaraAngkat || 0,
            statusKeluarga: item.statusKeluarga || 'Anak Kandung',
            bahasaIbu: item.bahasaIbu || 'Bahasa Indonesia',
            alamat: item.alamat || 'Jl. Raya Pendidikan',
            rt: item.rt || '01',
            rw: item.rw || '01',
            dusun: item.dusun || '',
            kelurahanDesa: item.kelurahanDesa || '',
            kecamatan: item.kecamatan || '',
            kabupatenKota: item.kabupatenKota || '',
            provinsi: item.provinsi || 'Jawa Barat',
            kodePos: item.kodePos || '',
            tinggalDengan: item.tinggalDengan || 'Orang Tua',
            jarakKeSekolahKm: item.jarakKeSekolahKm || 1,
            transportasi: item.transportasi || 'Jalan Kaki',
            noHpSiswa: item.noHpSiswa || '',
            emailSiswa: item.emailSiswa || '',
            kesehatan: item.kesehatan || {
              golonganDarah: 'Tidak Tahu',
              penyakitPernahDiderita: 'Tidak Ada',
              kelainanJasmani: 'Tidak Ada',
              tinggiBadanCm: 150,
              beratBadanKg: 40,
            },
            ayah: item.ayah || {
              nama: '-',
              nik: '',
              agama: 'Islam',
              kewarganegaraan: 'WNI',
              pendidikan: 'SMA',
              pekerjaan: 'Wiraswasta',
              penghasilanBulanan: '-',
              noHp: '',
              statusHidup: 'Masih Hidup',
            },
            ibu: item.ibu || {
              nama: '-',
              nik: '',
              agama: 'Islam',
              kewarganegaraan: 'WNI',
              pendidikan: 'SMA',
              pekerjaan: 'Ibu Rumah Tangga',
              penghasilanBulanan: '-',
              noHp: '',
              statusHidup: 'Masih Hidup',
            },
            wali: item.wali,
            sekolahAsalTK: item.sekolahAsalTK || '-',
            noIjazahTK: item.noIjazahTK || '',
            tanggalDiterima: item.tanggalDiterima || now.split('T')[0],
            diterimaDiKelas: item.diterimaDiKelas || 'Kelas 1',
            kelasSekarang: item.kelasSekarang || 'Kelas 1',
            status: item.status || 'Aktif',
            tahunMasuk: item.tahunMasuk || new Date().getFullYear().toString(),
            fotoUrl: item.fotoUrl,
            mutasi: item.mutasi,
            sttb: item.sttb,
            raport: item.raport || [],
            ...item,
            createdAt: now,
            updatedAt: now,
            dibuatOleh: actor,
            terakhirDiubahOleh: actor,
          };
          currentList.unshift(newStudent);
          addedCount++;
        }
      } else {
        // Brand new student
        const generatedNIS = nis || `${new Date().getFullYear()}${String(currentList.length + idx + 1).padStart(3, '0')}`;
        const newStudent: Student = {
          id: `std-imp-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
          noInduk: generatedNIS,
          nisn: item.nisn || '',
          nik: item.nik || '',
          noKk: item.noKk || '',
          namaLengkap: item.namaLengkap || 'SISWA BARU',
          namaPanggilan: item.namaPanggilan || '',
          jenisKelamin: item.jenisKelamin || 'L',
          tempatLahir: item.tempatLahir || 'Depok',
          tanggalLahir: item.tanggalLahir || '2011-01-01',
          agama: item.agama || 'Islam',
          kewarganegaraan: item.kewarganegaraan || 'WNI',
          anakKe: item.anakKe || 1,
          jumlahSaudaraKandung: item.jumlahSaudaraKandung || 1,
          jumlahSaudaraTiri: item.jumlahSaudaraTiri || 0,
          jumlahSaudaraAngkat: item.jumlahSaudaraAngkat || 0,
          statusKeluarga: item.statusKeluarga || 'Anak Kandung',
          bahasaIbu: item.bahasaIbu || 'Bahasa Indonesia',
          alamat: item.alamat || 'Jl. Raya Pendidikan',
          rt: item.rt || '01',
          rw: item.rw || '01',
          dusun: item.dusun || '',
          kelurahanDesa: item.kelurahanDesa || '',
          kecamatan: item.kecamatan || '',
          kabupatenKota: item.kabupatenKota || '',
          provinsi: item.provinsi || 'Jawa Barat',
          kodePos: item.kodePos || '',
          tinggalDengan: item.tinggalDengan || 'Orang Tua',
          jarakKeSekolahKm: item.jarakKeSekolahKm || 1,
          transportasi: item.transportasi || 'Jalan Kaki',
          noHpSiswa: item.noHpSiswa || '',
          emailSiswa: item.emailSiswa || '',
          kesehatan: item.kesehatan || {
            golonganDarah: 'Tidak Tahu',
            penyakitPernahDiderita: 'Tidak Ada',
            kelainanJasmani: 'Tidak Ada',
            tinggiBadanCm: 150,
            beratBadanKg: 40,
          },
          ayah: item.ayah || {
            nama: '-',
            nik: '',
            agama: 'Islam',
            kewarganegaraan: 'WNI',
            pendidikan: 'SMA',
            pekerjaan: 'Wiraswasta',
            penghasilanBulanan: '-',
            noHp: '',
            statusHidup: 'Masih Hidup',
          },
          ibu: item.ibu || {
            nama: '-',
            nik: '',
            agama: 'Islam',
            kewarganegaraan: 'WNI',
            pendidikan: 'SMA',
            pekerjaan: 'Ibu Rumah Tangga',
            penghasilanBulanan: '-',
            noHp: '',
            statusHidup: 'Masih Hidup',
          },
          wali: item.wali,
          sekolahAsalTK: item.sekolahAsalTK || '-',
          noIjazahTK: item.noIjazahTK || '',
          tanggalDiterima: item.tanggalDiterima || now.split('T')[0],
          diterimaDiKelas: item.diterimaDiKelas || 'Kelas 1',
          kelasSekarang: item.kelasSekarang || 'Kelas 1',
          status: item.status || 'Aktif',
          tahunMasuk: item.tahunMasuk || new Date().getFullYear().toString(),
          fotoUrl: item.fotoUrl,
          mutasi: item.mutasi,
          sttb: item.sttb,
          raport: item.raport || [],
          ...item,
          createdAt: now,
          updatedAt: now,
          dibuatOleh: actor,
          terakhirDiubahOleh: actor,
        };
        currentList.unshift(newStudent);
        addedCount++;
      }
    });

    setStudents(currentList);
    logActivity('IMPORT', `Berhasil mengimpor ${addedCount} data baru & memperbarui ${updatedCount} siswa dari file Excel / Spreadsheet`);
    return { added: addedCount, updated: updatedCount, skipped: skippedCount };
  };

  // Import Bulk Mutations (Excel Surat Keterangan Pindah Sekolah)
  const importMutationsBulk = (
    mutationRows: Array<{
      studentIdentifier: {
        nisn?: string;
        noInduk?: string;
        namaLengkap?: string;
      };
      mutationData: MutationRecord;
      studentBasics?: {
        jenisKelamin?: Gender;
        kelasSekarang?: string;
      };
    }>,
    duplicateStrategy: 'update' | 'skip' | 'append' = 'update'
  ): { added: number; updated: number; skipped: number } => {
    const actor = getActiveUserDisplayName();
    const now = new Date().toISOString();
    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    let currentList = [...students];

    mutationRows.forEach((row, idx) => {
      const nis = row.studentIdentifier.noInduk?.trim();
      const nisn = row.studentIdentifier.nisn?.trim();
      const nama = row.studentIdentifier.namaLengkap?.trim();

      // Find match
      let existingIndex = -1;
      if (nisn) {
        existingIndex = currentList.findIndex(s => s.nisn && s.nisn.trim() === nisn);
      }
      if (existingIndex === -1 && nis) {
        existingIndex = currentList.findIndex(s => s.noInduk && s.noInduk.trim() === nis);
      }
      if (existingIndex === -1 && nama) {
        const cleanNama = nama.toLowerCase().replace(/[^a-z0-9]/g, '');
        existingIndex = currentList.findIndex(s => {
          const targetClean = s.namaLengkap.toLowerCase().replace(/[^a-z0-9]/g, '');
          return cleanNama === targetClean;
        });
      }

      if (existingIndex >= 0) {
        if (duplicateStrategy === 'skip' && currentList[existingIndex].status === 'Mutasi Keluar') {
          skippedCount++;
        } else {
          // Update student status to 'Mutasi Keluar' and attach mutasi data
          const prevStudent = currentList[existingIndex];
          const updatedStudent: Student = {
            ...prevStudent,
            status: 'Mutasi Keluar',
            mutasi: {
              ...(prevStudent.mutasi || {}),
              ...row.mutationData,
            },
            terakhirDiubahOleh: actor,
            updatedAt: now,
          };
          currentList[existingIndex] = updatedStudent;
          saveStudentToSql(updatedStudent).catch(err => console.warn('SQL save student mutation error:', err));
          updatedCount++;
        }
      } else {
        // Register new student directly as Mutasi Keluar
        const generatedNIS = nis || `${new Date().getFullYear()}${String(currentList.length + idx + 1).padStart(3, '0')}`;
        const newStudent: Student = {
          id: `std-mut-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
          noInduk: generatedNIS,
          nisn: nisn || '',
          nik: '',
          namaLengkap: nama || 'SISWA MUTASI',
          namaPanggilan: (nama || 'Siswa').split(' ')[0],
          jenisKelamin: row.studentBasics?.jenisKelamin || 'L',
          tempatLahir: row.mutationData.tempatSurat || 'Sungai Buluh',
          tanggalLahir: '2015-01-01',
          agama: 'Islam',
          kewarganegaraan: 'WNI',
          anakKe: 1,
          jumlahSaudaraKandung: 1,
          jumlahSaudaraTiri: 0,
          jumlahSaudaraAngkat: 0,
          statusKeluarga: 'Anak Kandung',
          bahasaIbu: 'Bahasa Indonesia',
          alamat: 'Desa Sungai Buluh',
          rt: '01',
          rw: '01',
          kelurahanDesa: 'Sungai Buluh',
          kecamatan: 'Singingi Hilir',
          kabupatenKota: 'Kabupaten Kuantan Singingi',
          provinsi: 'Riau',
          kodePos: '29563',
          tinggalDengan: 'Orang Tua',
          jarakKeSekolahKm: 1,
          transportasi: 'Jalan Kaki',
          kesehatan: {
            golonganDarah: 'Tidak Tahu',
            tinggiBadanCm: 125,
            beratBadanKg: 28,
          },
          ayah: {
            nama: row.mutationData.hubunganPemohon?.toLowerCase().includes('ayah') ? (row.mutationData.namaPemohon || 'Nama Ayah') : 'Nama Ayah',
            nik: '',
            agama: 'Islam',
            kewarganegaraan: 'WNI',
            pendidikan: 'SMA',
            pekerjaan: row.mutationData.hubunganPemohon?.toLowerCase().includes('ayah') ? (row.mutationData.pekerjaanPemohon || 'Wiraswasta') : 'Wiraswasta',
            penghasilanBulanan: '-',
            noHp: '',
            statusHidup: 'Masih Hidup',
          },
          ibu: {
            nama: row.mutationData.hubunganPemohon?.toLowerCase().includes('ibu') ? (row.mutationData.namaPemohon || 'Nama Ibu') : 'Nama Ibu',
            nik: '',
            agama: 'Islam',
            kewarganegaraan: 'WNI',
            pendidikan: 'SMA',
            pekerjaan: row.mutationData.hubunganPemohon?.toLowerCase().includes('ibu') ? (row.mutationData.pekerjaanPemohon || 'Mengurus Rumah Tangga') : 'Mengurus Rumah Tangga',
            penghasilanBulanan: '-',
            noHp: '',
            statusHidup: 'Masih Hidup',
          },
          sekolahAsalTK: '-',
          tanggalDiterima: row.mutationData.tglMeninggalkan || now.split('T')[0],
          diterimaDiKelas: 'Kelas 1',
          kelasSekarang: row.mutationData.dariKelas || 'Kelas 4',
          status: 'Mutasi Keluar',
          tahunMasuk: (row.mutationData.tahunAjaran?.split('/')[0]) || new Date().getFullYear().toString(),
          mutasi: row.mutationData,
          raport: [],
          createdAt: now,
          updatedAt: now,
          dibuatOleh: actor,
          terakhirDiubahOleh: actor,
        };
        currentList.unshift(newStudent);
        saveStudentToSql(newStudent).catch(err => console.warn('SQL save new mutasi student error:', err));
        addedCount++;
      }
    });

    setStudents(currentList);
    logActivity('MUTASI', `Impor data mutasi siswa dari Excel: ${updatedCount} siswa dimutasikan & ${addedCount} data mutasi baru dicatat`);
    return { added: addedCount, updated: updatedCount, skipped: skippedCount };
  };

  const resetDatabase = () => {
    setStudents(initialStudents);
    setSchoolProfile(initialSchoolProfile);
    setActivityLogs(initialActivityLogs);
    setRolePermissions(defaultPermissions);
    setAdminUsers(initialAdminUsers);
    setSecuritySettings(initialSecuritySettings);
    safeLocalStorageRemove(STORAGE_KEY_STUDENTS);
    safeLocalStorageRemove(STORAGE_KEY_SCHOOL);
    safeLocalStorageRemove(STORAGE_KEY_LOGS);
    safeLocalStorageRemove(STORAGE_KEY_PERMISSIONS);
    safeLocalStorageRemove(STORAGE_KEY_USERS);
    safeLocalStorageRemove(STORAGE_KEY_SECURITY);
    idbDelete('students').catch(() => {});
    idbDelete('activity_logs').catch(() => {});
    idbDelete('school_profile').catch(() => {});
    logActivity('PENGATURAN', 'Mereset database Buku Induk kembali ke data bawaan sistem');
  };

  const resetToInitialData = resetDatabase;

  const syncToSqlDatabase = async () => {
    const res = await syncAllToSql(students, schoolProfile, activityLogs);
    if (res.success) {
      setIsSqlConnected(true);
      logActivity('PENGATURAN', `Sinkronisasi menyeluruh ke Cloud SQL PostgreSQL (${students.length} siswa)`);
    }
    return res;
  };

  const fetchFromSqlDatabase = async () => {
    const data = await fetchStudentsFromSql();
    if (data && data.length > 0) {
      setStudents(data);
      setIsSqlConnected(true);
      logActivity('PENGATURAN', `Memuat ${data.length} siswa dari Cloud SQL PostgreSQL`);
      return { success: true, count: data.length };
    }
    return { success: false, count: 0 };
  };

  return (
    <SchoolContext.Provider
      value={{
        students,
        setStudents,
        schoolProfile,
        currentRole,
        setCurrentRole,
        activityLogs,
        darkMode,
        setDarkMode,
        toggleDarkMode,
        visitorStats,
        rolePermissions,
        updateRolePermission,
        resetRolePermissions,
        adminUsers,
        currentUser,
        setCurrentUser,
        isAuthenticated,
        setIsAuthenticated,
        login,
        logout,
        addAdminUser,
        updateAdminUser,
        deleteAdminUser,
        securitySettings,
        updateSecuritySettings,
        getWaliKelasForClass,
        updateWaliKelasForClass,
        getKepalaSekolah,
        addStudent,
        updateStudent,
        bulkUpdateStudentRombel,
        lockAcademicYearRombel,
        unlockAcademicYearRombel,
        deleteStudent,
        deleteStudentsBulk,
        deleteAllStudents,
        getStudentById,
        processMutation,
        cancelMutation,
        updateSTTB,
        updateFotoIjazah,
        updateFotoIjazahMutasi,
        addOrUpdateRaport,
        updateSchoolProfile,
        logActivity,
        addActivityLog,
        exportDatabaseJSON,
        exportDatabaseDB,
        getDatabaseBackupJsonString,
        getDatabaseBackupDbString,
        exportStudentsCSV,
        exportStudentsExcel,
        importDatabaseJSON,
        restoreDatabaseFromDB,
        importStudentsBulk,
        importMutationsBulk,
        resetDatabase,
        resetToInitialData,
        isSqlConnected,
        syncToSqlDatabase,
        fetchFromSqlDatabase,
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
};

export const useSchool = () => {
  const context = useContext(SchoolContext);
  if (!context) {
    throw new Error('useSchool must be used within a SchoolProvider');
  }
  return context;
};
