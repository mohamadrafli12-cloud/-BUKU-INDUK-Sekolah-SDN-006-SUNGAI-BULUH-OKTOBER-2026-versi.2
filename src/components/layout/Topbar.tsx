import React, { useState, useMemo } from 'react';
import { 
  Menu, 
  Search, 
  Sun, 
  Moon, 
  UserCircle2, 
  Plus, 
  Download, 
  Printer, 
  History, 
  Bell, 
  Sparkles,
  Users2,
  TrendingUp,
  Calendar,
  FileSpreadsheet,
  Check,
  ChevronDown,
  LogOut,
  UserCheck,
  Image as ImageIcon,
  Award,
  Camera,
  Upload,
  ShieldCheck,
  RotateCcw,
  Pencil,
  School,
  Sliders,
  Database
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { UserRole, Student } from '../../types';
import { cn } from '../../lib/utils';
import { ActiveTab } from './Sidebar';
import { calculateSchoolAlerts } from '../../utils/alertNotificationHelper';
import { NotificationDropdown } from './NotificationDropdown';
import { 
  TutWuriHandayaniSDLogo, 
  TutWuriHandayaniKemdikbudLogo, 
  KemenagMadrasahLogo,
  OfficialNationalLogo,
  getSavedNationalLogos,
  LOGO_PRESETS 
} from '../../utils/logoHelper';
import { EditLogoModal } from '../modals/EditLogoModal';
import { SqlDatabaseModal } from '../modals/SqlDatabaseModal';

interface TopbarProps {
  onToggleSidebar?: () => void;
  onOpenSidebar?: () => void;
  isSidebarOpen?: boolean;
  onOpenAddModal?: () => void;
  onOpenActivityLog?: () => void;
  onOpenActivityLogs?: () => void;
  setActiveTab?: (tab: ActiveTab) => void;
  onSelectStudentDetail: (studentId: string) => void;
  onOpenRestoreDatabase?: () => void;
  onMutasi?: (student: Student) => void;
  onSTTB?: (student: Student) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onToggleSidebar,
  onOpenSidebar,
  isSidebarOpen,
  onOpenAddModal,
  onOpenActivityLog,
  onOpenActivityLogs,
  setActiveTab,
  onSelectStudentDetail,
  onOpenRestoreDatabase,
  onMutasi,
  onSTTB,
}) => {
  const handleToggle = onToggleSidebar || onOpenSidebar || (() => {});
  const handleActivityLogs = onOpenActivityLogs || onOpenActivityLog || (() => {});
  const { 
    schoolProfile, 
    updateSchoolProfile,
    logActivity,
    currentRole, 
    setCurrentRole, 
    currentUser,
    logout,
    darkMode, 
    toggleDarkMode, 
    students,
    exportStudentsCSV,
    exportDatabaseJSON,
    exportDatabaseDB,
    isSqlConnected
  } = useSchool();

  const [alertsTick, setAlertsTick] = useState(0);
  const alerts = useMemo(
    () => calculateSchoolAlerts(students, schoolProfile),
    [students, schoolProfile, alertsTick]
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isEditLogoModalOpen, setIsEditLogoModalOpen] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [editLogoInitialTab, setEditLogoInitialTab] = useState<'kiri' | 'kanan' | 'stempel' | 'custom'>('kiri');

  // Filter student results for instant search
  const searchResults = searchQuery.trim() === '' ? [] : students.filter(s => 
    s.namaLengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.noInduk.includes(searchQuery) ||
    s.nisn.includes(searchQuery) ||
    s.nik.includes(searchQuery) ||
    s.kelasSekarang.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 6);

  const roleLabels: Record<UserRole, { label: string; desc: string; badge: string }> = {
    admin: { label: 'Administrator / TU', desc: 'Akses penuh kelola data & master', badge: 'bg-amber-500 text-slate-950 font-bold' },
    user: { label: 'Guru / Wali Kelas', desc: 'Input nilai raport & data kelas', badge: 'bg-blue-600 text-white font-semibold' },
    umum: { label: 'Tamu / Wali Murid', desc: 'Verifikasi status & info publik', badge: 'bg-slate-500 text-white font-medium' },
  };

  return (
    <header id="topbar" className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs">
      {/* Left section: Hamburger & Global Search */}
      <div className="flex items-center gap-3 md:gap-4 flex-1 max-w-xl">
        <button
          id="btn-toggle-sidebar"
          onClick={handleToggle}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-hidden transition-colors cursor-pointer"
          title={isSidebarOpen ? "Ciutkan Menu Samping" : "Lebarkan Menu Samping"}
          aria-label="Toggle menu sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Student Search Bar */}
        <div className="relative flex-1">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Cari Siswa: Nama, NIS, NISN, NIK..."
              className="w-full pl-9 pr-4 py-1.5 text-xs md:text-sm rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-800 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Search Dropdown Results */}
          {isSearchOpen && searchResults.length > 0 && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsSearchOpen(false)} 
              />
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                <div className="p-2 bg-slate-50 dark:bg-slate-800/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 flex justify-between">
                  <span>HASIL PENCARIAN SISWA ({searchResults.length})</span>
                  <span>Tekan untuk melihat detail</span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {searchResults.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        onSelectStudentDetail(s.id);
                        setIsSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className="w-full text-left p-2.5 hover:bg-blue-50 dark:hover:bg-slate-800 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 flex items-center justify-center font-bold text-xs shrink-0">
                          {s.namaLengkap.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                            {s.namaLengkap}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <span>NIS: {s.noInduk}</span>
                            <span>•</span>
                            <span>NISN: {s.nisn}</span>
                            <span>•</span>
                            <span className="font-semibold text-blue-600 dark:text-blue-400">{s.kelasSekarang}</span>
                          </div>
                        </div>
                      </div>
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0",
                        s.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                        s.status === 'Lulus' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                        'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      )}>
                        {s.status}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Section: Academic Year Badge, Actions, Role Switcher, Dark Mode */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Academic Year & Semester Badge */}
        {setActiveTab && (
          <button
            onClick={() => setActiveTab('school-profile')}
            className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-blue-900 dark:text-blue-200 text-xs hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
            title="Tahun Pelajaran & Semester Aktif (Klik untuk ubah di Profil Sekolah)"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <div className="flex flex-col items-start leading-tight">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Tahun Ajaran Aktif</span>
              <span className="font-extrabold text-blue-700 dark:text-blue-300">
                {schoolProfile.tahunPelajaranAktif || '2025/2026'} • {schoolProfile.semesterAktif || 'Ganjil'}
              </span>
            </div>
          </button>
        )}

        {/* Quick Add Student Button (Only for Admin & Guru) */}
        {currentRole !== 'umum' && (
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#003399] hover:bg-[#002266] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">Tambah Siswa</span>
          </button>
        )}

        {/* Kembalikan Database (.db) Quick Button */}
        {currentRole === 'admin' && (
          <button
            onClick={onOpenRestoreDatabase}
            className="p-2 sm:px-2.5 sm:py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            title="Kembalikan Basis Data (.db)"
          >
            <RotateCcw className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden xl:inline">Kembalikan DB</span>
          </button>
        )}

        {/* Export / Cetak Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1 text-xs font-semibold"
            title="Ekspor Data"
          >
            <Download className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <span className="hidden xl:inline">Ekspor</span>
          </button>

          {isExportMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsExportMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 divide-y divide-slate-100 dark:divide-slate-800">
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase">
                  Opsi Ekspor / Backup
                </div>
                <button
                  onClick={() => {
                    exportStudentsCSV();
                    setIsExportMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="font-semibold block">Ekspor Data Siswa Excel (.xlsx)</span>
                    <span className="text-[10px] text-slate-500">Format rapi sesuai template Dapodik</span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    exportDatabaseDB();
                    setIsExportMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                >
                  <Database className="w-4 h-4 text-indigo-600" />
                  <div>
                    <span className="font-semibold block">Ekspor Basis Data Siswa (.db)</span>
                    <span className="text-[10px] text-slate-500">Pencadangan offline mandiri</span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    exportDatabaseJSON();
                    setIsExportMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                >
                  <Download className="w-4 h-4 text-blue-600" />
                  <span>Backup Lengkap JSON (.json)</span>
                </button>
                <button
                  onClick={() => {
                    window.print();
                    setIsExportMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                >
                  <Printer className="w-4 h-4 text-amber-600" />
                  <span>Cetak Tampilan Layar (PDF)</span>
                </button>

                {/* Pemulihan Data Option */}
                <div className="pt-1">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase">
                    PEMULIHAN BASIS DATA
                  </div>
                  <button
                    onClick={() => {
                      if (onOpenRestoreDatabase) onOpenRestoreDatabase();
                      setIsExportMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 flex items-center gap-2 font-medium"
                  >
                    <RotateCcw className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <div>
                      <span className="font-bold block">Kembalikan Database (.db)</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Pulihkan arsip siswa dari berkas .db</span>
                    </div>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Notification Bell Dropdown (Operational Alerts) */}
        <NotificationDropdown
          alerts={alerts}
          students={students}
          onSelectStudentDetail={onSelectStudentDetail}
          onMutasi={onMutasi}
          onSTTB={onSTTB}
          setActiveTab={setActiveTab}
          onRefreshAlerts={() => setAlertsTick(t => t + 1)}
        />

        {/* Activity Logs Button */}
        <button
          onClick={handleActivityLogs}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors relative cursor-pointer"
          title="Riwayat Aktivitas & Log"
        >
          <History className="w-4 h-4" />
        </button>

        {/* Dark Mode Toggle */}
        <button
          id="btn-toggle-dark-mode"
          onClick={toggleDarkMode}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-xs",
            darkMode 
              ? "bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700 ring-1 ring-amber-400/20" 
              : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
          )}
          title={darkMode ? 'Mode Gelap Aktif (Klik untuk beralih ke Mode Terang)' : 'Mode Terang Aktif (Klik untuk beralih ke Mode Gelap)'}
          aria-label={darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
        >
          {darkMode ? (
            <>
              <Sun className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="hidden sm:inline text-[11px]">Terang</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-slate-600 shrink-0" />
              <span className="hidden sm:inline text-[11px]">Gelap</span>
            </>
          )}
        </button>

        {/* Menu Kelola Logo Sekolah (Sebelah Kanan) */}
        <div className="relative pl-1 border-l border-slate-200 dark:border-slate-800">
          <button
            id="btn-menu-edit-logo-topbar"
            onClick={() => {
              setEditLogoInitialTab('kiri');
              setIsEditLogoModalOpen(true);
            }}
            className="group relative flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl border transition-all cursor-pointer shadow-xs bg-white dark:bg-slate-800 hover:bg-amber-50/70 dark:hover:bg-slate-750 border-slate-200 dark:border-slate-700 hover:border-amber-300"
            title="Kelola Logo: Unggah Logo Sebelah Kiri, Kanan, & Cap Stempel"
          >
            {/* Logo Thumbnail preview */}
            <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-0.5 shadow-xs border border-amber-300/80 shrink-0 group-hover:scale-105 transition-transform overflow-hidden relative">
              {(schoolProfile.logoKiriUrl || schoolProfile.logoUrl) ? (
                <img 
                  src={schoolProfile.logoKiriUrl || schoolProfile.logoUrl} 
                  alt="Logo Sekolah" 
                  className="w-full h-full object-contain" 
                  referrerPolicy="no-referrer" 
                />
              ) : (
                <TutWuriHandayaniSDLogo className="w-7 h-7" />
              )}
              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-amber-300">
                <Pencil className="w-3 h-3" />
              </div>
            </div>

            {/* Menu Label */}
            <div className="hidden sm:flex flex-col text-left leading-tight pr-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-1">
                  <ImageIcon className="w-3 h-3 text-amber-500 shrink-0" />
                  Kelola Logo
                </span>
              </div>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[110px]">
                {schoolProfile.logoKiriUrl || schoolProfile.logoUrl ? 'Logo Kiri Terpasang' : 'Unggah Logo Kiri'}
              </span>
            </div>
          </button>
        </div>

        {/* User Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs transition-colors"
          >
            <div className={cn("w-2 h-2 rounded-full", currentRole === 'admin' ? 'bg-amber-500' : currentRole === 'user' ? 'bg-blue-500' : 'bg-slate-400')} />
            <span className="font-bold text-slate-800 dark:text-slate-200 hidden sm:inline">
              {roleLabels[currentRole].label}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {isRoleMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsRoleMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50 divide-y divide-slate-100 dark:divide-slate-800">
                <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    AKUN AKTIF SAAT INI
                  </div>
                  <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate mt-0.5">
                    {currentUser?.nama || (currentRole === 'admin' ? 'H. Marlisman, S.Pd.' : currentRole === 'user' ? 'Guru Kelas' : 'Tamu / Umum')}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {currentUser?.jabatan || roleLabels[currentRole].label}
                  </div>
                </div>

                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  GANTI PERAN PENGGUNA
                </div>
                {(['admin', 'user', 'umum'] as UserRole[]).map((role) => (
                  <button
                    key={role}
                    onClick={() => {
                      setCurrentRole(role);
                      setIsRoleMenuOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
                      currentRole === role && "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold"
                    )}
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {roleLabels[role].label}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {roleLabels[role].desc}
                      </div>
                    </div>
                    {currentRole === role && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                  </button>
                ))}

                <div className="p-1.5 space-y-1 bg-slate-50/50 dark:bg-slate-800/30">
                  {currentRole === 'admin' && (
                    <>
                      <button
                        onClick={() => {
                          setEditLogoInitialTab('tutwuri');
                          setIsEditLogoModalOpen(true);
                          setIsRoleMenuOpen(false);
                        }}
                        className="w-full px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 hover:bg-blue-100 text-xs font-bold rounded-lg flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                          <span>Menu Edit Logo Sekolah</span>
                        </span>
                        <span className="text-[10px] text-blue-700 dark:text-blue-400">Edit →</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveTab?.('admin-settings');
                          setIsRoleMenuOpen(false);
                        }}
                        className="w-full px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 hover:bg-amber-100 text-xs font-bold rounded-lg flex items-center justify-between transition-colors"
                      >
                        <span>⚙️ Hak Akses Admin</span>
                        <span className="text-[10px] text-amber-700 dark:text-amber-400">Buka →</span>
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => {
                      logout();
                      setIsRoleMenuOpen(false);
                    }}
                    className="w-full px-2.5 py-1.5 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 hover:bg-red-100 text-xs font-bold rounded-lg flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Keluar / Ganti Akun</span>
                    </span>
                    <span className="text-[10px] text-red-500">Logout</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Edit Logo Modal */}
      <EditLogoModal
        isOpen={isEditLogoModalOpen}
        onClose={() => setIsEditLogoModalOpen(false)}
        initialTab={editLogoInitialTab}
      />
    </header>
  );
};
