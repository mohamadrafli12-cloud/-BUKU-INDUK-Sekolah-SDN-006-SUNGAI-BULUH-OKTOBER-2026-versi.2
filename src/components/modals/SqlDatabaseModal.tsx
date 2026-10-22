import React, { useState, useEffect } from 'react';
import { 
  Database, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Server, 
  ShieldCheck, 
  LogIn, 
  LogOut, 
  X, 
  UploadCloud, 
  DownloadCloud, 
  UserCheck, 
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { auth, googleAuthProvider } from '../../lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { useSchool } from '../../context/SchoolContext';
import { 
  checkSqlStatus, 
  syncAllToSql, 
  fetchStudentsFromSql, 
  SqlStatusResponse 
} from '../../services/sqlDatabaseService';

interface SqlDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRestoreDatabase?: () => void;
}

export const SqlDatabaseModal: React.FC<SqlDatabaseModalProps> = ({ 
  isOpen, 
  onClose,
  onOpenRestoreDatabase 
}) => {
  const { students, schoolProfile, activityLogs, setStudents, logActivity, exportDatabaseDB } = useSchool();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [status, setStatus] = useState<SqlStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Monitor Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth, 
      async (user) => {
        setCurrentUser(user);
        if (user) {
          // Sync user to SQL database
          try {
            const token = await user.getIdToken();
            await fetch('/api/auth/sync-user', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            });
          } catch (e) {
            console.warn('Failed to sync user session to backend:', e);
          }
        }
      },
      (err) => {
        console.warn('Firebase onAuthStateChanged error in SqlDatabaseModal:', err?.message || err);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch SQL Status when modal opens
  const refreshStatus = async () => {
    setLoading(true);
    const res = await checkSqlStatus();
    setStatus(res);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      refreshStatus();
      setSyncMessage(null);
    }
  }, [isOpen]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleAuthProvider);
      await refreshStatus();
    } catch (error: any) {
      console.error('Google Sign In failed:', error);
      setSyncMessage({ text: error.message || 'Gagal login Google', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Sign out error:', e);
    }
  };

  const handleSyncToSQL = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const result = await syncAllToSql(students, schoolProfile, activityLogs);
      if (result.success) {
        setSyncMessage({
          text: `Berhasil menyinkronkan ${students.length} data siswa dan profil sekolah ke Cloud SQL PostgreSQL!`,
          type: 'success',
        });
        logActivity('PENGATURAN', `Sinkronisasi data ke Cloud SQL PostgreSQL (${students.length} siswa)`);
        await refreshStatus();
      } else {
        setSyncMessage({ text: result.message, type: 'error' });
      }
    } catch (err: any) {
      setSyncMessage({ text: err.message || 'Terjadi kesalahan saat sinkronisasi', type: 'error' });
    } finally {
      setSyncing(false);
    }
  };

  const handleFetchFromSQL = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const data = await fetchStudentsFromSql();
      if (data && data.length > 0) {
        setStudents(data);
        setSyncMessage({
          text: `Berhasil mengunduh ${data.length} data siswa langsung dari Cloud SQL PostgreSQL!`,
          type: 'success',
        });
        logActivity('PENGATURAN', `Mengunduh ${data.length} siswa dari Cloud SQL`);
        await refreshStatus();
      } else if (data && data.length === 0) {
        setSyncMessage({
          text: 'Database SQL masih kosong. Silakan gunakan tombol "Sinkronkan Lokal ke SQL" untuk mengunggah data awal.',
          type: 'error',
        });
      } else {
        setSyncMessage({ text: 'Gagal mengambil data dari SQL database.', type: 'error' });
      }
    } catch (err: any) {
      setSyncMessage({ text: err.message || 'Gagal memuat data dari SQL', type: 'error' });
    } finally {
      setSyncing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div 
        id="sql-database-modal"
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Penyimpanan Database SQL</h3>
              <p className="text-xs text-blue-200/90 font-mono">
                Google Cloud SQL • PostgreSQL Developer Edition
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Real-time Status Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-3.5 h-3.5 rounded-full ${
                  status?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                    {status?.connected ? 'Terhubung ke Cloud SQL' : 'Memeriksa Koneksi Database...'}
                  </span>
                  <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 rounded-full">
                    PostgreSQL 16
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {status?.connected
                    ? `Terdaftar ${status.totalStudents ?? 0} siswa di SQL • Profil Sekolah: ${status.hasSchoolProfile ? 'Ada' : 'Belum sinkron'}`
                    : status?.error || 'Menghubungkan ke instance database Google Cloud SQL'}
                </p>
              </div>
            </div>

            <button
              onClick={refreshStatus}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Cek Status
            </button>
          </div>

          {/* Sync Notifications */}
          {syncMessage && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${
                syncMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
              }`}
            >
              {syncMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />
              )}
              <span>{syncMessage.text}</span>
            </div>
          )}

          {/* Authentication & User Session Section (Firebase Auth requirement) */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 text-sm font-semibold">
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Autentikasi Pengguna & Hak Akses</span>
              </div>
              {currentUser ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <UserCheck className="w-3.5 h-3.5" /> Terverifikasi Google
                </span>
              ) : (
                <span className="text-xs text-slate-400">Mode Operator Lokal</span>
              )}
            </div>

            {currentUser ? (
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'User'}
                      className="w-9 h-9 rounded-full object-cover border border-slate-300"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-sm">
                      {currentUser.displayName ? currentUser.displayName[0] : 'U'}
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {currentUser.displayName || 'Akun Pengguna'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{currentUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Keluar
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Masuk dengan akun Google untuk menyinkronkan identitas operator Anda ke database SQL.
                </p>
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Masuk via Google
                </button>
              </div>
            )}
          </div>

          {/* Action Synchronization Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              onClick={handleSyncToSQL}
              disabled={syncing}
              className="p-4 rounded-xl border-2 border-blue-600 bg-blue-600 hover:bg-blue-700 text-white flex flex-col items-start gap-1 transition-all shadow-md active:scale-[0.99] disabled:opacity-50 text-left"
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                <UploadCloud className={`w-5 h-5 ${syncing ? 'animate-bounce' : ''}`} />
                <span>Simpan/Sinkronkan ke SQL</span>
              </div>
              <p className="text-xs text-blue-100/90 leading-normal">
                Kirim seluruh {students.length} data siswa dan profil sekolah saat ini ke PostgreSQL Cloud SQL.
              </p>
            </button>

            <button
              onClick={handleFetchFromSQL}
              disabled={syncing}
              className="p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 flex flex-col items-start gap-1 transition-all active:scale-[0.99] disabled:opacity-50 text-left"
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                <DownloadCloud className={`w-5 h-5 text-indigo-600 dark:text-indigo-400 ${syncing ? 'animate-bounce' : ''}`} />
                <span>Muat Data dari SQL</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                Tarik data peserta didik terbaru yang tersimpan di cloud database PostgreSQL.
              </p>
            </button>

            {/* Offline .db Export Quick Action */}
            <div className="col-span-1 sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => exportDatabaseDB()}
                className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/70 dark:bg-indigo-950/30 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/40 text-indigo-900 dark:text-indigo-200 flex flex-col justify-between gap-3 transition-all text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-indigo-600 text-white shrink-0">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs">Ekspor Basis Data Siswa (.db)</div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      Unduh snapshot basis data {students.length} siswa sebagai file .db mandiri.
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg self-end shrink-0 shadow-xs">
                  Unduh .db Offline
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onOpenRestoreDatabase) {
                    onClose();
                    onOpenRestoreDatabase();
                  }
                }}
                className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-amber-50/60 dark:bg-amber-950/20 hover:bg-amber-100/60 dark:hover:bg-amber-900/30 text-slate-900 dark:text-slate-100 flex flex-col justify-between gap-3 transition-all text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-amber-600 text-white shrink-0">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs">Kembalikan Basis Data (.db)</div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      Pulihkan data siswa dari file .db atau .json cadangan sebelumnya.
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg self-end shrink-0 shadow-xs">
                  Kembalikan .db
                </span>
              </button>
            </div>
          </div>

          {/* Database Schema Details Info */}
          <div className="p-4 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 space-y-2">
            <div className="font-semibold flex items-center gap-1.5 text-slate-800 dark:text-slate-100">
              <Server className="w-3.5 h-3.5 text-blue-600" />
              <span>Struktur Tabel Terkelola di PostgreSQL:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-blue-600 dark:text-blue-400 font-bold">students</span> (Buku Induk)
              </div>
              <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">school_profile</span> (Profil)
              </div>
              <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">activity_logs</span> (Log Audit)
              </div>
              <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-purple-600 dark:text-purple-400 font-bold">users</span> (Firebase Auth)
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Otomatis tersimpan & aman dengan Drizzle ORM</span>
          <button
            onClick={onClose}
            className="px-4 py-2 font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
