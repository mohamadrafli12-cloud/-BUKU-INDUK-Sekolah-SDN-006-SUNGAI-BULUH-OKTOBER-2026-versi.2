import React, { useState, useEffect } from 'react';
import { 
  X, 
  Cloud, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  ExternalLink, 
  Trash2, 
  Database, 
  FileText, 
  ShieldCheck, 
  LogOut, 
  RotateCcw,
  Check,
  HardDrive,
  Copy,
  Key,
  ChevronDown,
  ChevronUp,
  Download
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { 
  signInWithGoogleDrive, 
  signOutGoogleDrive, 
  initDriveAuth, 
  getDriveAccessToken, 
  uploadBackupToGoogleDrive, 
  listGoogleDriveBackups, 
  downloadGoogleDriveBackupContent, 
  deleteGoogleDriveBackup,
  setDriveAccessToken,
  isEmbeddedWebView,
  openInNativeBrowser,
  DriveBackupFile,
  DriveUser
} from '../../services/googleDriveService';
import firebaseConfig from '../../../firebase-applet-config.json';
import { cn } from '../../lib/utils';

interface GoogleDriveBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreSuccess?: () => void;
}

export const GoogleDriveBackupModal: React.FC<GoogleDriveBackupModalProps> = ({
  isOpen,
  onClose,
  onRestoreSuccess,
}) => {
  const { 
    schoolProfile, 
    students, 
    getDatabaseBackupJsonString, 
    getDatabaseBackupDbString,
    restoreDatabaseFromDB,
    exportDatabaseJSON,
    logActivity 
  } = useSchool();

  const [activeTab, setActiveTab] = useState<'backup' | 'history'>('backup');
  const [currentUser, setCurrentUser] = useState<DriveUser | null>(null);
  const [hasToken, setHasToken] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isUnauthorizedDomain, setIsUnauthorizedDomain] = useState<boolean>(false);
  const [isOAuthPolicyRestricted, setIsOAuthPolicyRestricted] = useState<boolean>(() => isEmbeddedWebView());
  const [copiedDomain, setCopiedDomain] = useState<boolean>(false);
  const [copiedAppUrl, setCopiedAppUrl] = useState<boolean>(false);
  const [showManualTokenInput, setShowManualTokenInput] = useState<boolean>(false);
  const [manualTokenValue, setManualTokenValue] = useState<string>('');
  const [isVerifyingManualToken, setIsVerifyingManualToken] = useState<boolean>(false);

  // Backup configuration
  const [backupFormat, setBackupFormat] = useState<'json' | 'db'>('json');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<DriveBackupFile | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // History & Restore
  const [backupList, setBackupList] = useState<DriveBackupFile[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [restoringFileId, setRestoringFileId] = useState<string | null>(null);
  const [restoreMessage, setRestoreMessage] = useState<{ message: string; isError?: boolean } | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);

  // Listen to auth state
  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = initDriveAuth(
      (user, token) => {
        setCurrentUser(user);
        setHasToken(!!token);
        setIsUnauthorizedDomain(false);
      },
      () => {
        // Not signed in with token
        if (!getDriveAccessToken()) {
          setHasToken(false);
        }
      }
    );

    // Initial check
    if (getDriveAccessToken()) {
      setHasToken(true);
    }

    return () => {
      unsubscribe();
    };
  }, [isOpen]);

  // Load history when tab is clicked or user signs in
  useEffect(() => {
    if (isOpen && hasToken && activeTab === 'history') {
      fetchHistory();
    }
  }, [isOpen, hasToken, activeTab]);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    setIsUnauthorizedDomain(false);
    setIsOAuthPolicyRestricted(isEmbeddedWebView());
    try {
      const { user, accessToken } = await signInWithGoogleDrive();
      setCurrentUser(user);
      setHasToken(!!accessToken);
      setIsOAuthPolicyRestricted(false);
      logActivity('SYSTEM', 'Berhasil menghubungkan akun Google Drive untuk pencadangan cloud');
    } catch (err: any) {
      console.error('Sign-in error:', err);
      const isDomainErr = 
        err?.code === 'auth/unauthorized-domain' || 
        err?.isUnauthorizedDomain || 
        (typeof err?.message === 'string' && (
          err.message.includes('auth/unauthorized-domain') || 
          err.message.includes('unauthorized-domain') ||
          err.message.includes('belum diizinkan dalam Firebase')
        ));

      const isOAuthPolicyErr = 
        err?.isOAuthPolicyError ||
        isEmbeddedWebView() ||
        (typeof err?.message === 'string' && (
          err.message.includes('disallowed_useragent') ||
          err.message.includes('kebijakan OAuth') ||
          err.message.includes('policy') ||
          err.message.includes('tidak mematuhi kebijakan')
        ));

      if (isDomainErr) {
        setIsUnauthorizedDomain(true);
        setAuthError(
          'Domain aplikasi saat ini belum didaftarkan di Firebase Authentication Authorized Domains.'
        );
      } else if (isOAuthPolicyErr) {
        setIsOAuthPolicyRestricted(true);
        setAuthError(
          'Aplikasi dibuka di peramban internal aplikasi lain. Kebijakan keamanan Google melarang login OAuth di peramban tersemat.'
        );
      } else {
        setAuthError(err?.message || 'Gagal masuk dengan akun Google. Harap coba lagi.');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleCopyAppUrl = () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (url && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedAppUrl(true);
      setTimeout(() => setCopiedAppUrl(false), 2500);
    }
  };

  const handleCopyCurrentDomain = () => {
    const domain = typeof window !== 'undefined' ? window.location.hostname : '';
    if (domain && navigator.clipboard) {
      navigator.clipboard.writeText(domain);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    }
  };

  const handleApplyManualToken = async () => {
    if (!manualTokenValue.trim()) return;
    setIsVerifyingManualToken(true);
    setAuthError(null);
    try {
      await setDriveAccessToken(manualTokenValue.trim());
      setHasToken(true);
      setShowManualTokenInput(false);
      logActivity('SYSTEM', 'Menghubungkan Google Drive menggunakan token akses manual');
    } catch (err: any) {
      setAuthError('Token akses tidak valid atau telah kedaluwarsa. Periksa kembali token Anda.');
    } finally {
      setIsVerifyingManualToken(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutGoogleDrive();
      setCurrentUser(null);
      setHasToken(false);
      setBackupList([]);
      logActivity('SYSTEM', 'Memutuskan koneksi akun Google Drive');
    } catch (err: any) {
      console.error('Sign-out error:', err);
    }
  };

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    setHistoryError(null);
    try {
      const files = await listGoogleDriveBackups();
      setBackupList(files);
    } catch (err: any) {
      console.error('Fetch history error:', err);
      setHistoryError(err?.message || 'Gagal memuat riwayat berkas dari Google Drive.');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleUploadBackup = async () => {
    if (!hasToken) {
      await handleSignIn();
      if (!getDriveAccessToken()) return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      const cleanSchoolName = (schoolProfile.namaSekolah || 'Sekolah').replace(/[^a-zA-Z0-9]/g, '_');

      let fileName = '';
      let content = '';
      let mimeType = '';

      if (backupFormat === 'json') {
        fileName = `Backup_Buku_Induk_${cleanSchoolName}_${dateStr}_${timeStr}.json`;
        content = getDatabaseBackupJsonString();
        mimeType = 'application/json';
      } else {
        fileName = `DATABASE_SISWA_BUKU_INDUK_${cleanSchoolName}_${dateStr}_${timeStr}.db`;
        content = getDatabaseBackupDbString();
        mimeType = 'application/x-sqlite3';
      }

      const uploaded = await uploadBackupToGoogleDrive({
        fileName,
        content,
        mimeType,
        description: `Cadangan resmi Database Buku Induk Siswa ${schoolProfile.namaSekolah} (${students.length} peserta didik) dibuat pada ${now.toLocaleString('id-ID')}`,
      });

      setUploadSuccess(uploaded);
      logActivity('EXPORT', `Menyimpan cadangan basis data ke Google Drive: ${uploaded.name}`);
      
      // Auto-refresh history in background
      listGoogleDriveBackups().then(setBackupList).catch(() => {});
    } catch (err: any) {
      console.error('Upload backup error:', err);
      setUploadError(err?.message || 'Gagal menyimpan cadangan ke Google Drive. Periksa koneksi internet Anda.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRestoreFromDrive = async (file: DriveBackupFile) => {
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin memulihkan basis data dari berkas "${file.name}" yang tersimpan di Google Drive?\n\nData saat ini akan diperbarui sesuai isi cadangan.`
    );
    if (!confirmed) return;

    setRestoringFileId(file.id);
    setRestoreMessage(null);

    try {
      const content = await downloadGoogleDriveBackupContent(file.id);
      if (!content) {
        throw new Error('Berkas cadangan kosong atau tidak dapat diunduh.');
      }

      const res = restoreDatabaseFromDB(content, 'replace', true);
      if (res.success) {
        setRestoreMessage({
          message: `Berhasil memulihkan ${res.studentCount} data peserta didik dari "${file.name}"!`,
        });
        logActivity('IMPORT', `Memulihkan basis data dari cadangan Google Drive: ${file.name}`);
        if (onRestoreSuccess) onRestoreSuccess();
      } else {
        setRestoreMessage({
          message: res.message || 'Gagal membaca format data cadangan.',
          isError: true,
        });
      }
    } catch (err: any) {
      console.error('Restore error:', err);
      setRestoreMessage({
        message: err?.message || 'Gagal memulihkan basis data dari Google Drive.',
        isError: true,
      });
    } finally {
      setRestoringFileId(null);
    }
  };

  const handleDeleteFile = async (file: DriveBackupFile) => {
    // MANDATORY confirmation per workspace-integration skill
    const confirmed = window.confirm(
      `Hapus berkas cadangan "${file.name}" dari Google Drive?\n\nTindakan ini akan menghapus salinan cadangan ini secara permanen dari Google Drive Anda.`
    );
    if (!confirmed) return;

    setDeletingFileId(file.id);
    try {
      await deleteGoogleDriveBackup(file.id);
      setBackupList((prev) => prev.filter((f) => f.id !== file.id));
      logActivity('DELETE', `Menghapus file cadangan dari Google Drive: ${file.name}`);
    } catch (err: any) {
      alert(err?.message || 'Gagal menghapus berkas dari Google Drive.');
    } finally {
      setDeletingFileId(null);
    }
  };

  const formatFileSize = (bytes?: string | number) => {
    if (!bytes) return '-';
    const num = Number(bytes);
    if (isNaN(num)) return '-';
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatIsoDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4.5 bg-linear-to-r from-blue-700 via-indigo-700 to-blue-800 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-xs">
              <Cloud className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight flex items-center gap-2">
                <span>Simpan Database ke Google Drive</span>
              </h3>
              <p className="text-xs text-blue-100">
                Pencadangan awan otomatis untuk keamanan data Buku Induk Siswa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 px-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab('backup')}
            className={cn(
              "py-3 px-4 border-b-2 transition-all cursor-pointer flex items-center gap-2",
              activeTab === 'backup'
                ? "border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900"
            )}
          >
            <Upload className="w-4 h-4" />
            <span>Buat Cadangan Baru</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              "py-3 px-4 border-b-2 transition-all cursor-pointer flex items-center gap-2",
              activeTab === 'history'
                ? "border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900"
            )}
          >
            <HardDrive className="w-4 h-4" />
            <span>Riwayat di Google Drive</span>
            {backupList.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                {backupList.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Google Account Connection Status Card */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Status Akun Google Drive
              </span>
              {hasToken ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Terhubung
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  Belum Terhubung
                </span>
              )}
            </div>

            {hasToken && currentUser ? (
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-3 min-w-0">
                  {currentUser.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      alt={currentUser.displayName || 'User'} 
                      className="w-10 h-10 rounded-full border border-slate-300 shadow-2xs" 
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                      {(currentUser.displayName || currentUser.email || 'G').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate">
                      {currentUser.displayName || 'Akun Google Terhubung'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {currentUser.email}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors font-bold flex items-center gap-1 cursor-pointer shrink-0"
                  title="Putuskan akun Google Drive"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Hubungkan akun Google Anda untuk menyimpan salinan cadangan langsung ke Google Drive pribadi atau sekolah dengan aman.
                </p>

                {/* Unauthorized Domain Warning & Troubleshooting Panel */}
                {isUnauthorizedDomain ? (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80 rounded-xl space-y-3 text-xs text-amber-900 dark:text-amber-100 shadow-xs">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <div className="font-extrabold text-amber-900 dark:text-amber-200">
                          Domain Belum Masuk Daftar Authorized Domains Firebase
                        </div>
                        <p className="text-[11.5px] text-amber-800 dark:text-amber-300/90 leading-relaxed">
                          Keamanan Firebase Authentication memerlukan nama domain aplikasi untuk didaftarkan pada 
                          <span className="font-semibold"> Firebase Console &gt; Authentication &gt; Settings &gt; Authorized domains</span>.
                        </p>
                      </div>
                    </div>

                    {/* Current Domain Box */}
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          Domain Aplikasi Saat Ini:
                        </div>
                        <div className="font-mono text-xs font-bold text-blue-700 dark:text-blue-300 truncate select-all">
                          {typeof window !== 'undefined' ? window.location.hostname : 'aplikasi'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyCurrentDomain}
                        className="px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/60 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-200 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                      >
                        {copiedDomain ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Salin Domain</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <a
                        href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-[#003399] hover:bg-[#002266] text-white rounded-lg font-bold text-[11px] flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <span>Buka Pengaturan Firebase Console</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <button
                        type="button"
                        onClick={handleSignIn}
                        disabled={isAuthenticating}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <RefreshCw className={cn("w-3 h-3", isAuthenticating && "animate-spin")} />
                        <span>Coba Hubungkan Ulang (Google Direct)</span>
                      </button>
                    </div>
                  </div>
                ) : isOAuthPolicyRestricted ? (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/50 border-2 border-amber-400 dark:border-amber-700 rounded-xl space-y-3 text-xs text-amber-950 dark:text-amber-100 shadow-sm animate-in fade-in duration-200">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <div className="font-extrabold text-xs text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                          Peramban Aplikasi Terdeteksi • Kebijakan Google OAuth 2.0
                        </div>
                        <p className="text-[11.5px] text-amber-800 dark:text-amber-300 leading-relaxed">
                          Peringatan <em>"Aplikasi tidak mematuhi kebijakan OAuth 2.0 Google"</em> muncul karena aplikasi dibuka dari peramban internal aplikasi lain (seperti WebView, WhatsApp, Facebook, wrapper aplikasi, dll). Google secara resmi melarang login akun di peramban tersemat demi keamanan.
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-800/80 space-y-2">
                      <div className="font-bold text-[11px] text-slate-700 dark:text-slate-300">
                        Solusi Untuk Menghubungkan Google Drive:
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={openInNativeBrowser}
                          className="px-3.5 py-2 bg-[#003399] hover:bg-[#002266] text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all hover:scale-102"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Buka di Google Chrome (Browser Utama)</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleCopyAppUrl}
                          className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          {copiedAppUrl ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Tautan Tersalin!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Salin Tautan Web</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-amber-200 dark:border-amber-900/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <span className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold">
                        Ingin mengamankan database sekarang juga tanpa login Google?
                      </span>
                      <button
                        type="button"
                        onClick={() => exportDatabaseJSON()}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh File Cadangan (.json)</span>
                      </button>
                    </div>
                  </div>
                ) : authError ? (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                ) : null}

                {/* Official Material Google Sign-In Button */}
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={isAuthenticating}
                  className="w-full py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-3 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  {isAuthenticating ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                      <path fill="none" d="M0 0h48v48H0z"/>
                    </svg>
                  )}
                  <span>{isAuthenticating ? 'Menghubungkan...' : 'Masuk dengan Akun Google (Google Drive)'}</span>
                </button>

                {/* Collapsible Manual Token Input for advanced environments */}
                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={() => setShowManualTokenInput(!showManualTokenInput)}
                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 inline-flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Key className="w-3 h-3" />
                    <span>Opsi Lanjutan: Sambungkan dengan Token Akses OAuth Google</span>
                    {showManualTokenInput ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {showManualTokenInput && (
                    <div className="mt-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-left space-y-2">
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        Bila otorisasi popup terhalang oleh peramban atau domain belum diizinkan, Anda dapat menempelkan token akses Google OAuth sementara di sini:
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={manualTokenValue}
                          onChange={(e) => setManualTokenValue(e.target.value)}
                          placeholder="ya29.a0AcM..."
                          className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                        />
                        <button
                          type="button"
                          onClick={handleApplyManualToken}
                          disabled={!manualTokenValue.trim() || isVerifyingManualToken}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                        >
                          {isVerifyingManualToken ? 'Memeriksa...' : 'Terapkan'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* TAB 1: CREATE BACKUP */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              {/* Database Overview */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <div className="text-slate-500 font-medium text-[11px]">Total Peserta Didik</div>
                  <div className="text-base font-black text-slate-900 dark:text-slate-100 mt-0.5">
                    {students.length} Siswa
                  </div>
                  <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                    {students.filter(s => s.status === 'Aktif').length} Siswa Aktif
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <div className="text-slate-500 font-medium text-[11px]">Sekolah</div>
                  <div className="text-xs font-black text-slate-900 dark:text-slate-100 mt-0.5 truncate">
                    {schoolProfile.namaSekolah}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    NPSN: {schoolProfile.npsn || '-'}
                  </div>
                </div>
              </div>

              {/* Format Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Pilih Format Berkas Cadangan:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setBackupFormat('json')}
                    className={cn(
                      "p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between",
                      backupFormat === 'json'
                        ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-slate-100">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span>Format JSON (.json)</span>
                      </div>
                      {backupFormat === 'json' && <Check className="w-4 h-4 text-blue-600" />}
                    </div>
                    <p className="text-[10.5px] text-slate-500 mt-1.5 leading-snug">
                      Standar rekomendasi. Memuat seluruh data siswa, profil, ijazah, mutasi, dan pengaturan.
                    </p>
                  </div>

                  <div
                    onClick={() => setBackupFormat('db')}
                    className={cn(
                      "p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between",
                      backupFormat === 'db'
                        ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-slate-100">
                        <Database className="w-4 h-4 text-indigo-600" />
                        <span>Format Database (.db)</span>
                      </div>
                      {backupFormat === 'db' && <Check className="w-4 h-4 text-indigo-600" />}
                    </div>
                    <p className="text-[10.5px] text-slate-500 mt-1.5 leading-snug">
                      Struktur tabel SQL & SQLite kompatibel untuk cadangan teknis offline.
                    </p>
                  </div>
                </div>
              </div>

              {/* Upload Success Alert */}
              {uploadSuccess && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Cadangan Berhasil Disimpan ke Google Drive!</span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 font-mono bg-white/80 dark:bg-slate-900/60 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900">
                    <div>Berkas: <strong>{uploadSuccess.name}</strong></div>
                    <div>Waktu: {formatIsoDate(uploadSuccess.createdTime)}</div>
                  </div>
                  {uploadSuccess.webViewLink && (
                    <a
                      href={uploadSuccess.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-blue-700 dark:text-blue-400 hover:underline font-bold text-xs pt-0.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka Berkas di Google Drive</span>
                    </a>
                  )}
                </div>
              )}

              {/* Upload Error Alert */}
              {uploadError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleUploadBackup}
                disabled={isUploading}
                className="w-full py-3 px-5 bg-[#003399] hover:bg-[#002266] active:scale-98 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menyimpan ke Google Drive...</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-4 h-4" />
                    <span>Simpan Cadangan ke Google Drive Sekarang</span>
                  </>
                )}
              </button>

              <div className="text-[11px] text-slate-500 text-center flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Berkas disimpan secara privat di folder Google Drive Anda</span>
              </div>

              {/* Alternatif Pencadangan Langsung ke Perangkat */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => exportDatabaseJSON()}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-750 dark:text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Cadangkan & Unduh File (.json) Langsung ke Perangkat</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: HISTORY & RESTORE FROM DRIVE */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Daftar Cadangan di Google Drive:
                </span>
                <button
                  type="button"
                  onClick={fetchHistory}
                  disabled={isLoadingHistory || !hasToken}
                  className="px-2.5 py-1 text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", isLoadingHistory && "animate-spin")} />
                  <span>Segarkan</span>
                </button>
              </div>

              {restoreMessage && (
                <div
                  className={cn(
                    "p-3 rounded-xl text-xs flex items-center gap-2",
                    restoreMessage.isError
                      ? "bg-rose-50 text-rose-800 border border-rose-200"
                      : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  )}
                >
                  {restoreMessage.isError ? (
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  )}
                  <span>{restoreMessage.message}</span>
                </div>
              )}

              {historyError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{historyError}</span>
                </div>
              )}

              {!hasToken ? (
                <div className="p-6 text-center space-y-2 border border-dashed rounded-xl text-slate-500">
                  <Cloud className="w-8 h-8 mx-auto text-slate-400" />
                  <p className="text-xs">Hubungkan akun Google Drive Anda untuk melihat berkas cadangan.</p>
                  <button
                    onClick={handleSignIn}
                    className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Hubungkan Akun Google
                  </button>
                </div>
              ) : isLoadingHistory ? (
                <div className="p-8 text-center text-slate-500 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                  <p className="text-xs">Memuat daftar cadangan dari Google Drive...</p>
                </div>
              ) : backupList.length === 0 ? (
                <div className="p-6 text-center space-y-2 border border-dashed rounded-xl text-slate-500">
                  <FileText className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-semibold">Belum ada berkas cadangan di Google Drive Anda.</p>
                  <p className="text-[11px]">Gunakan tab "Buat Cadangan Baru" untuk mengunggah cadangan pertama.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {backupList.map((file) => (
                    <div
                      key={file.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-center justify-between gap-3 text-xs shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-900">
                          {file.name.endsWith('.db') ? <Database className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 dark:text-slate-100 truncate" title={file.name}>
                            {file.name}
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>{formatIsoDate(file.createdTime)}</span>
                            <span>•</span>
                            <span>{formatFileSize(file.size)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            title="Buka di Google Drive"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRestoreFromDrive(file)}
                          disabled={restoringFileId === file.id}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          title="Pulihkan database dari cadangan ini"
                        >
                          {restoringFileId === file.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3 h-3" />
                          )}
                          <span>Pulihkan</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteFile(file)}
                          disabled={deletingFileId === file.id}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          title="Hapus cadangan dari Google Drive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">
            Google Drive API v3 • Scope: drive.file
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
