import React, { useState } from 'react';
import { 
  ShieldCheck, 
  KeyRound, 
  Users, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  AlertTriangle, 
  Save, 
  RotateCcw, 
  UserPlus, 
  Trash2, 
  Edit, 
  Eye, 
  EyeOff, 
  FileSpreadsheet, 
  Download, 
  Building2, 
  History,
  Check,
  X,
  Sliders,
  ShieldAlert,
  Info,
  ArrowLeft,
  Sun,
  Moon,
  Database,
  Upload,
  Cloud,
  GraduationCap
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { UserRole, RolePermissions, AdminUser } from '../../types';
import { cn } from '../../lib/utils';
import { ActiveTab } from '../layout/Sidebar';

interface AdminSettingsViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  onOpenActivityLogs?: () => void;
  onBack?: () => void;
  onOpenRestoreDatabase?: () => void;
  onOpenGoogleDriveBackup?: () => void;
}

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({
  setActiveTab,
  onOpenActivityLogs,
  onBack,
  onOpenRestoreDatabase,
  onOpenGoogleDriveBackup,
}) => {
  const {
    currentRole,
    setCurrentRole,
    rolePermissions,
    updateRolePermission,
    resetRolePermissions,
    adminUsers,
    addAdminUser,
    updateAdminUser,
    deleteAdminUser,
    securitySettings,
    updateSecuritySettings,
    exportDatabaseJSON,
    exportDatabaseDB,
    exportStudentsCSV,
    importDatabaseJSON,
    students,
    schoolProfile,
    darkMode,
    setDarkMode,
    toggleDarkMode,
  } = useSchool();

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [restoreStatus, setRestoreStatus] = useState<{ message: string; isError?: boolean } | null>(null);

  // Active sub-tab within settings
  const [activeSubTab, setActiveSubTab] = useState<'matrix' | 'users' | 'security'>('matrix');

  // Matrix edit buffer
  const [permissionsState, setPermissionsState] = useState<Record<UserRole, RolePermissions>>(rolePermissions);
  const [isSavedToast, setIsSavedToast] = useState(false);

  // User modal state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userFormData, setUserFormData] = useState({
    nama: '',
    nip: '',
    email: '',
    jabatan: '',
    role: 'user' as UserRole,
    status: 'Aktif' as 'Aktif' | 'Nonaktif',
    avatarColor: 'bg-blue-600',
  });

  // Security form state
  const [securityForm, setSecurityForm] = useState(securitySettings);
  const [showPin, setShowPin] = useState(false);

  // Sync state if context changes
  React.useEffect(() => {
    setPermissionsState(rolePermissions);
  }, [rolePermissions]);

  React.useEffect(() => {
    setSecurityForm(securitySettings);
  }, [securitySettings]);

  // Permission dictionary with labels & descriptions
  const permissionGroups: {
    category: string;
    items: {
      key: keyof RolePermissions;
      label: string;
      desc: string;
    }[];
  }[] = [
    {
      category: '1. Pengelolaan Data Pokok & Buku Induk Siswa',
      items: [
        {
          key: 'tambahSiswa',
          label: 'Tambah Data Siswa Baru',
          desc: 'Menginput siswa baru ke dalam register Buku Induk',
        },
        {
          key: 'editSiswa',
          label: 'Ubah / Edit Biodata Siswa',
          desc: 'Mengedit data pribadi, alamat, orang tua, dan kesehatan siswa',
        },
        {
          key: 'hapusSiswa',
          label: 'Hapus Data Siswa (Arsip Permanen)',
          desc: 'Menghapus catatan siswa dari database buku induk',
        },
        {
          key: 'lihatDetailLengkap',
          label: 'Lihat Detail Lengkap & Data Sensitif',
          desc: 'Membuka NIK, No KK, no kontak ortu, dan rekam medis lengkap',
        },
      ],
    },
    {
      category: '2. Akademik & Rekap Nilai Raport',
      items: [
        {
          key: 'inputRaport',
          label: 'Input Penilaian Semester Baru',
          desc: 'Mengentri nilai mata pelajaran per semester',
        },
        {
          key: 'editRaport',
          label: 'Ubah / Koreksi Nilai Raport',
          desc: 'Mengubah nilai yang sudah tersimpan pada buku induk',
        },
        {
          key: 'kunciNilaiSemester',
          label: 'Kunci Nilai Semester (Verifikasi Final)',
          desc: 'Mengunci nilai agar tidak dapat diubah oleh wali kelas',
        },
      ],
    },
    {
      category: '3. Mutasi & Penyerahan STTB / Ijazah',
      items: [
        {
          key: 'inputMutasi',
          label: 'Catat Mutasi / Pindah Sekolah',
          desc: 'Mencatat siswa keluar beserta sekolah tujuan',
        },
        {
          key: 'inputSTTB',
          label: 'Registrasi Kelulusan & Ijazah / STTB',
          desc: 'Input nomor seri ijazah, SKHU, dan tanda terima',
        },
        {
          key: 'cetakSuratMutasi',
          label: 'Cetak Surat Keterangan Pindah & STTB',
          desc: 'Mencetak dokumen resmi surat pindah dan tanda terima ijazah',
        },
      ],
    },
    {
      category: '4. Dokumen Resmi, Cetak & Ekspor',
      items: [
        {
          key: 'cetakBukuInduk',
          label: 'Cetak Lembar Resmi Buku Induk (2 Hal)',
          desc: 'Mencetak format standar Permendikbud halaman biodata dan nilai',
        },
        {
          key: 'cetakKartuPelajar',
          label: 'Cetak Kartu Tanda Pelajar & Kartu Ujian',
          desc: 'Mencetak kartu siswa resmi standar ID-1 dilengkapi Barcode & Kop Surat resmi',
        },
        {
          key: 'eksporExcelCSV',
          label: 'Ekspor Data ke File Excel / Spreadsheet',
          desc: 'Mengunduh rekap data peserta didik ke format CSV/Excel',
        },
      ],
    },
    {
      category: '5. Pengaturan Sistem & Master Database',
      items: [
        {
          key: 'ubahProfilSekolah',
          label: 'Ubah Profil & Identitas Satuan Pendidikan',
          desc: 'Mengubah nama kepala sekolah, NIP, NPSN, logo, dan alamat',
        },
        {
          key: 'backupDatabase',
          label: 'Unduh Backup Database Lengkap',
          desc: 'Membuat salinan cadangan database sistem dalam file JSON',
        },
        {
          key: 'restoreDatabase',
          label: 'Restore & Pemulihan Database',
          desc: 'Mengunggah file backup cadangan untuk memulihkan data',
        },
        {
          key: 'kelolaHakAkses',
          label: 'Kelola Hak Akses & Akun Administrator',
          desc: 'Mengubah matriks hak akses dan mengelola pengguna sistem',
        },
      ],
    },
  ];

  const handleToggle = (role: UserRole, key: keyof RolePermissions) => {
    if (currentRole !== 'admin') return;
    const currentVal = permissionsState[role][key];
    const updated = {
      ...permissionsState,
      [role]: {
        ...permissionsState[role],
        [key]: !currentVal,
      },
    };
    setPermissionsState(updated);
    updateRolePermission(role, key, !currentVal);
    showSuccessToast();
  };

  const handleSaveAllMatrix = () => {
    // Save to context
    Object.keys(permissionsState).forEach((r) => {
      const role = r as UserRole;
      Object.keys(permissionsState[role]).forEach((k) => {
        const key = k as keyof RolePermissions;
        updateRolePermission(role, key, permissionsState[role][key]);
      });
    });
    showSuccessToast();
  };

  const showSuccessToast = () => {
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 3000);
  };

  const handleOpenAddUser = () => {
    setEditingUserId(null);
    setUserFormData({
      nama: '',
      nip: '',
      email: '',
      jabatan: '',
      role: 'user',
      status: 'Aktif',
      avatarColor: 'bg-blue-600',
    });
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (user: AdminUser) => {
    setEditingUserId(user.id);
    setUserFormData({
      nama: user.nama,
      nip: user.nip || '',
      email: user.email,
      jabatan: user.jabatan,
      role: user.role,
      status: user.status,
      avatarColor: user.avatarColor,
    });
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUserId) {
      updateAdminUser(editingUserId, userFormData);
    } else {
      addAdminUser(userFormData);
    }
    setIsUserModalOpen(false);
    showSuccessToast();
  };

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    updateSecuritySettings(securityForm);
    showSuccessToast();
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="rounded-2xl bg-linear-to-r from-[#002266] via-[#003399] to-[#0047b3] text-white p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-white/5 skew-x-12 pointer-events-none" />
        <div className="absolute right-20 -bottom-10 w-48 h-48 rounded-full bg-amber-500/10 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-amber-300 text-xs font-bold tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>HAK AKSES ADMINISTRATOR & KEAMANAN SISTEM</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white">
              Pengaturan & Manajemen Hak Akses
            </h1>
            <p className="text-xs text-blue-100 max-w-2xl leading-relaxed">
              Konfigurasi wewenang (Role-Based Access Control) untuk Administrator/TU, Guru/Wali Kelas, dan Tamu/Umum sesuai standar tatakelola data pendidikan nasional.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => (onBack ? onBack() : setActiveTab('dashboard'))}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold rounded-xl backdrop-blur-xs transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-amber-300" />
              <span>Kembali ke Dashboard</span>
            </button>
            <button
              onClick={() => {
                if (confirm('Kembalikan seluruh konfigurasi matriks hak akses ke standar rekomendasi Kemdikbud?')) {
                  resetRolePermissions();
                  showSuccessToast();
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-xl shadow-md transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Standar Kemdikbud</span>
            </button>
          </div>
        </div>
      </div>

      {/* Role Alert / Notice Banner */}
      {currentRole !== 'admin' && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-sm">Mode Pratinjau Terbatas ({currentRole.toUpperCase()})</div>
            <p>
              Saat ini Anda menggunakan peran <strong>{currentRole === 'user' ? 'Guru / Wali Kelas' : 'Tamu / Umum'}</strong>. Hanya pengguna dengan peran <strong>Administrator / Kepala Sekolah</strong> yang dapat menyimpan perubahan konfigurasi hak akses dan mengelola akun petugas.
            </p>
            <button
              onClick={() => setCurrentRole('admin')}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-lg transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Beralih ke Peran Administrator Sekarang
            </button>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {isSavedToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-2xl border border-emerald-400 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4" />
          <span>Pengaturan Hak Akses Berhasil Diperbarui & Disimpan!</span>
        </div>
      )}

      {/* Sub-Tab Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('matrix')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all",
            activeSubTab === 'matrix'
              ? "bg-[#003399] text-white shadow-md"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
          )}
        >
          <Sliders className="w-4 h-4" />
          <span>Matriks Hak Akses Peran (RBAC)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('users')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all",
            activeSubTab === 'users'
              ? "bg-[#003399] text-white shadow-md"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
          )}
        >
          <Users className="w-4 h-4" />
          <span>Daftar Akun Pengguna & Petugas ({adminUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('security')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all",
            activeSubTab === 'security'
              ? "bg-[#003399] text-white shadow-md"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
          )}
        >
          <Lock className="w-4 h-4" />
          <span>Keamanan & Kunci Akses (PIN)</span>
        </button>
      </div>

      {/* SUB-TAB 1: PERMISSIONS MATRIX */}
      {activeSubTab === 'matrix' && (
        <div className="space-y-6">
          {/* Quick Role Legend Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="font-extrabold text-xs text-amber-950 dark:text-amber-200 uppercase">
                  Administrator / Kepala Sekolah
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300">
                  Wewenang tertinggi. Mengelola seluruh master data, ijazah, pengaturan sekolah, dan backup.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="font-extrabold text-xs text-blue-950 dark:text-blue-200 uppercase">
                  Guru / Wali Kelas
                </div>
                <p className="text-[11px] text-blue-800 dark:text-blue-300">
                  Mengelola biodata siswa kelas, mengentri nilai raport semester, dan mencetak lembar buku induk.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-500 text-white flex items-center justify-center font-black shrink-0">
                <Eye className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="font-extrabold text-xs text-slate-900 dark:text-slate-200 uppercase">
                  Tamu / Orang Tua / Umum
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Akses baca terbatas untuk verifikasi nomor induk dan status kelulusan peserta didik.
                </p>
              </div>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 md:p-5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  Tabel Pengaturan Hak Akses Modul
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Klik sakelar untuk mengaktifkan atau menonaktifkan wewenang setiap peran pengguna
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hidden md:inline">
                  Status: Tersinkronisasi
                </span>
                <button
                  onClick={handleSaveAllMatrix}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#003399] hover:bg-[#002266] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Hak Akses</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3.5 w-1/2">Nama Fitur & Wewenang Modul</th>
                    <th className="p-3.5 text-center w-1/6">
                      <div className="flex flex-col items-center">
                        <span className="text-amber-700 dark:text-amber-400 font-extrabold">ADMINISTRATOR</span>
                        <span className="text-[9px] font-normal text-slate-500">Kepsek & TU</span>
                      </div>
                    </th>
                    <th className="p-3.5 text-center w-1/6">
                      <div className="flex flex-col items-center">
                        <span className="text-blue-700 dark:text-blue-400 font-extrabold">GURU / WALI KELAS</span>
                        <span className="text-[9px] font-normal text-slate-500">Tenaga Pendidik</span>
                      </div>
                    </th>
                    <th className="p-3.5 text-center w-1/6">
                      <div className="flex flex-col items-center">
                        <span className="text-slate-600 dark:text-slate-400 font-extrabold">TAMU / UMUM</span>
                        <span className="text-[9px] font-normal text-slate-500">Wali Murid / Publik</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {permissionGroups.map((group, groupIdx) => (
                    <React.Fragment key={groupIdx}>
                      {/* Section Header */}
                      <tr className="bg-slate-50/80 dark:bg-slate-800/40">
                        <td colSpan={4} className="px-4 py-2.5 font-extrabold text-blue-900 dark:text-blue-300 text-xs uppercase tracking-wide">
                          {group.category}
                        </td>
                      </tr>

                      {/* Item Rows */}
                      {group.items.map((item) => (
                        <tr key={item.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900 dark:text-slate-100">{item.label}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</div>
                          </td>

                          {/* Admin Toggle */}
                          <td className="p-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggle('admin', item.key)}
                              className={cn(
                                "w-11 h-6 inline-flex items-center rounded-full transition-colors p-0.5 focus:outline-hidden",
                                permissionsState.admin[item.key] ? "bg-amber-500" : "bg-slate-300 dark:bg-slate-700"
                              )}
                            >
                              <span
                                className={cn(
                                  "w-5 h-5 rounded-full bg-white shadow-md transform transition-transform",
                                  permissionsState.admin[item.key] ? "translate-x-5" : "translate-x-0"
                                )}
                              />
                            </button>
                          </td>

                          {/* Teacher Toggle */}
                          <td className="p-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggle('user', item.key)}
                              className={cn(
                                "w-11 h-6 inline-flex items-center rounded-full transition-colors p-0.5 focus:outline-hidden",
                                permissionsState.user[item.key] ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
                              )}
                            >
                              <span
                                className={cn(
                                  "w-5 h-5 rounded-full bg-white shadow-md transform transition-transform",
                                  permissionsState.user[item.key] ? "translate-x-5" : "translate-x-0"
                                )}
                              />
                            </button>
                          </td>

                          {/* Guest / Public Toggle */}
                          <td className="p-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggle('umum', item.key)}
                              className={cn(
                                "w-11 h-6 inline-flex items-center rounded-full transition-colors p-0.5 focus:outline-hidden",
                                permissionsState.umum[item.key] ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
                              )}
                            >
                              <span
                                className={cn(
                                  "w-5 h-5 rounded-full bg-white shadow-md transform transition-transform",
                                  permissionsState.umum[item.key] ? "translate-x-5" : "translate-x-0"
                                )}
                              />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: USER ACCOUNTS MANAGEMENT */}
      {activeSubTab === 'users' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  Daftar Petugas & Pengelola Buku Induk
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Kelola staf pengajar, operator dapodik, dan administrator yang memiliki akses ke dalam sistem
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('teachers')}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                  title="Buka menu lengkap Data Guru untuk kelola biodata PTK, pasfoto resmi, dan penugasan mengajar"
                >
                  <GraduationCap className="w-4 h-4 text-white" />
                  <span>Buka Menu Data Guru</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenAddUser}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#003399] hover:bg-[#002266] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Tambah Akun Petugas</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 uppercase text-[11px] font-bold">
                  <tr>
                    <th className="p-3">Nama & Identitas</th>
                    <th className="p-3">Jabatan / Tugas</th>
                    <th className="p-3">Hak Akses (Peran)</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Terakhir Aktif</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {adminUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs shrink-0", user.avatarColor || 'bg-blue-600')}>
                            {user.nama.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100">{user.nama}</div>
                            <div className="text-[10px] text-slate-400 font-mono">NIP: {user.nip || '-'} | {user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                        {user.jabatan}
                      </td>
                      <td className="p-3">
                        <span className={cn(
                          "px-2.5 py-1 text-[10px] font-extrabold rounded-full uppercase",
                          user.role === 'admin' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                          user.role === 'user' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                          'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                        )}>
                          {user.role === 'admin' ? 'Administrator' : user.role === 'user' ? 'Guru / Wali Kelas' : 'Tamu / Umum'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={cn(
                          "px-2 py-0.5 text-[10px] font-bold rounded-md flex items-center gap-1 w-fit",
                          user.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800'
                        )}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", user.status === 'Aktif' ? 'bg-emerald-600' : 'bg-rose-600')} />
                          {user.status}
                        </span>
                      </td>
                      <td className="p-3 text-[11px] text-slate-500">
                        {user.terakhirLogin}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditUser(user)}
                            className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors"
                            title="Edit Akun Petugas"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {user.id !== 'usr-001' && (
                            <button
                              onClick={() => {
                                if (confirm(`Hapus akun ${user.nama}?`)) {
                                  deleteAdminUser(user.id);
                                  showSuccessToast();
                                }
                              }}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors"
                              title="Hapus Akun"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: SECURITY & PIN SETTINGS */}
      {activeSubTab === 'security' && (
        <form onSubmit={handleSaveSecurity} className="space-y-6 max-w-4xl">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wide flex items-center gap-2">
              <KeyRound className="w-4 h-4" />
              <span>PIN Administrator & Konfirmasi Tindakan Kritis</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Master PIN Administrator (6 Digit) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    maxLength={6}
                    required
                    value={securityForm.pinAdmin}
                    onChange={(e) => setSecurityForm({ ...securityForm, pinAdmin: e.target.value })}
                    className="w-full px-3 py-2 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-base tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  PIN ini digunakan untuk memverifikasi tindakan kritis seperti penghapusan siswa atau reset database.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Batas Waktu Sesi Otomatis (Menit)
                </label>
                <select
                  value={securityForm.autoLogoutMinutes}
                  onChange={(e) => setSecurityForm({ ...securityForm, autoLogoutMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                >
                  <option value={15}>15 Menit</option>
                  <option value={30}>30 Menit (Rekomendasi)</option>
                  <option value={60}>60 Menit (1 Jam)</option>
                  <option value={120}>120 Menit (2 Jam)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={securityForm.requirePinForDelete}
                  onChange={(e) => setSecurityForm({ ...securityForm, requirePinForDelete: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    Wajibkan Konfirmasi PIN Saat Menghapus Data Siswa
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Mencegah penghapusan catatan buku induk secara tidak sengaja oleh operator.
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={securityForm.sembunyikanNikUmum}
                  onChange={(e) => setSecurityForm({ ...securityForm, sembunyikanNikUmum: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    Sembunyikan NIK & Nomor Kartu Keluarga dari Peran Umum/Tamu
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Perlindungan data pribadi siswa sesuai UU Perlindungan Data Pribadi (PDP).
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={securityForm.kunciSemesterAktif}
                  onChange={(e) => setSecurityForm({ ...securityForm, kunciSemesterAktif: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    Kunci Penilaian Buku Induk & Raport Semester Berjalan
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Jika diaktifkan, wali kelas hanya dapat melihat rekap nilai tanpa mengubah data nilai.
                  </div>
                </div>
              </label>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 bg-[#003399] hover:bg-[#002266] text-white text-xs font-bold rounded-xl shadow-lg transition-transform transform active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Pengaturan Keamanan</span>
              </button>
            </div>
          </div>

          {/* PREFERENSI TAMPILAN (MODE MALAM / TERANG) */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wide flex items-center gap-2">
                {darkMode ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                <span>Preferensi Mode Tampilan (Terang / Malam)</span>
              </h3>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 self-start sm:self-auto">
                <span className={cn("w-2 h-2 rounded-full", darkMode ? "bg-amber-400" : "bg-emerald-500")} />
                <span>Status Aktif: {darkMode ? 'Mode Malam (Gelap)' : 'Mode Siang (Terang)'}</span>
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Atur kenyamanan penglihatan saat mengelola Buku Induk. Mode Terang cocok untuk pencetakan dokumen resmi dan siang hari, sedangkan Mode Malam nyaman untuk entri data di malam hari.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {/* Option Mode Terang */}
              <button
                type="button"
                onClick={() => setDarkMode(false)}
                className={cn(
                  "p-4 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3.5",
                  !darkMode
                    ? "bg-amber-50/70 dark:bg-amber-950/30 border-amber-400 ring-2 ring-amber-400/20 shadow-xs"
                    : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                <div className={cn(
                  "p-2.5 rounded-xl shrink-0",
                  !darkMode ? "bg-amber-500 text-white shadow-xs" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                )}>
                  <Sun className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100">Mode Terang (Light)</span>
                    {!darkMode && <Check className="w-4 h-4 text-amber-600 dark:text-amber-400 font-bold" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Latar putih bersih sesuai standar administrasi sekolah, kontras tinggi dan mudah dibaca di ruangan terang.
                  </p>
                </div>
              </button>

              {/* Option Mode Malam */}
              <button
                type="button"
                onClick={() => setDarkMode(true)}
                className={cn(
                  "p-4 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3.5",
                  darkMode
                    ? "bg-slate-800 border-amber-400 ring-2 ring-amber-400/20 shadow-xs text-white"
                    : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                <div className={cn(
                  "p-2.5 rounded-xl shrink-0",
                  darkMode ? "bg-slate-900 text-amber-400 border border-slate-700 shadow-xs" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                )}>
                  <Moon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100">Mode Malam (Dark)</span>
                    {darkMode && <Check className="w-4 h-4 text-amber-400 font-bold" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Latar gelap elegan yang ramah di mata, mengurangi radiasi cahaya saat pengisian data raport di malam hari.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* PENCADANGAN BASIS DATA MANUAL & ARSIP OFFLINE (.DB & .JSON) */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wide flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Pencadangan Manual Basis Data Siswa (Offline .db)</span>
              </h3>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 self-start sm:self-auto">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                <span>{students.length} Siswa Terdaftar</span>
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Ekspor basis data siswa saat ini langsung sebagai file <strong>.db</strong> terstruktur untuk pencadangan offline mandiri. File ini memuat seluruh tabel identitas siswa, nilai raport, mutasi, register STTB/ijazah, profil sekolah, dan log audit yang kompatibel dengan SQLite maupun PostgreSQL DDL.
            </p>

            {restoreStatus && (
              <div
                className={cn(
                  "p-3 rounded-xl text-xs flex items-center gap-2",
                  restoreStatus.isError
                    ? "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                    : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                )}
              >
                {restoreStatus.isError ? (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                )}
                <span>{restoreStatus.message}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
              {/* Card Cadangan Google Drive */}
              <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-800/80 bg-linear-to-b from-blue-50/60 to-indigo-50/30 dark:from-blue-950/30 dark:to-indigo-950/20 flex flex-col justify-between gap-3 shadow-xs">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300 font-bold text-xs">
                      <Cloud className="w-4 h-4 text-blue-600" />
                      <span>Cadangan Google Drive</span>
                    </div>
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-900">
                      Cloud Storage
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                    Simpan salinan database Buku Induk langsung ke <strong>Google Drive</strong> akun Google Anda (.json / .db) serta pulihkan kembali kapan saja dengan 1-klik.
                  </p>
                </div>
                <div className="space-y-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenGoogleDriveBackup) {
                        onOpenGoogleDriveBackup();
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    <Cloud className="w-4 h-4" />
                    <span>Simpan ke Google Drive</span>
                  </button>
                </div>
              </div>

              {/* Card Ekspor .DB Offline */}
              <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/40 dark:bg-indigo-950/20 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300 font-bold text-xs">
                    <Database className="w-4 h-4 text-indigo-600" />
                    <span>Ekspor Basis Data Siswa (.db)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Unduh file <strong>.db</strong> offline untuk pencadangan mandiri ke penyimpanan lokal (flashdisk, harddisk eksternal) tanpa memerlukan jaringan internet.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    exportDatabaseDB();
                    setRestoreStatus({
                      message: `Berhasil mengunduh basis data siswa (.db) berisi ${students.length} catatan peserta didik.`,
                    });
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Basis Data (.db)</span>
                </button>
              </div>

              {/* Card Pulihkan / Restore dari File .db / .json */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-xs">
                      <RotateCcw className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Kembalikan Basis Data (.db / .json)</span>
                    </div>
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 rounded">
                      Menu Resmi
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Buka menu dialog pemulihan lengkap untuk pratinjau data siswa, perbandingan arsip, pilihan mode timpa/gabung, dan verifikasi PIN admin.
                  </p>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".db,.json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const content = event.target?.result as string;
                      if (!content) {
                        setRestoreStatus({ message: 'File kosong atau tidak dapat dibaca.', isError: true });
                        return;
                      }
                      const ok = importDatabaseJSON(content);
                      if (ok) {
                        setRestoreStatus({
                          message: `File cadangan "${file.name}" berhasil dipulihkan ke dalam sistem!`,
                        });
                      } else {
                        setRestoreStatus({
                          message: 'Format file tidak valid. Pastikan file adalah hasil ekspor .db atau .json dari sistem ini.',
                          isError: true,
                        });
                      }
                    };
                    reader.readAsText(file);
                    e.target.value = '';
                  }}
                />

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenRestoreDatabase) {
                        onOpenRestoreDatabase();
                      } else {
                        fileInputRef.current?.click();
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Buka Menu Kembalikan Database (.db)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 text-[11px] font-semibold rounded-lg transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>Unggah Cepat Berkas .db / .json</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* USER MODAL */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 bg-[#003399] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-300" />
                <h3 className="font-extrabold text-sm tracking-wide">
                  {editingUserId ? 'Edit Akun Petugas' : 'Tambah Akun Petugas / Pengelola Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap & Gelar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rahmat Hidayat, S.Kom."
                  value={userFormData.nama}
                  onChange={(e) => setUserFormData({ ...userFormData, nama: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    NIP / NUPTK
                  </label>
                  <input
                    type="text"
                    placeholder="19920415 201902 1 008"
                    value={userFormData.nip}
                    onChange={(e) => setUserFormData({ ...userFormData, nip: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Pengguna <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="operator@sdn006.sch.id"
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Jabatan / Penugasan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Operator Dapodik / Guru Kelas 3"
                  value={userFormData.jabatan}
                  onChange={(e) => setUserFormData({ ...userFormData, jabatan: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Hak Akses (Peran) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={userFormData.role}
                    onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-blue-900 dark:text-blue-200"
                  >
                    <option value="admin">Administrator / TU</option>
                    <option value="user">Guru / Wali Kelas</option>
                    <option value="umum">Tamu / Umum</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status Akun
                  </label>
                  <select
                    value={userFormData.status}
                    onChange={(e) => setUserFormData({ ...userFormData, status: e.target.value as 'Aktif' | 'Nonaktif' })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#003399] hover:bg-[#002266] text-white font-bold rounded-xl shadow-md"
                >
                  {editingUserId ? 'Simpan Perubahan' : 'Daftarkan Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
