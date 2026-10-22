import React, { useState, useRef } from 'react';
import { 
  X, 
  Database, 
  Upload, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  FileText, 
  ShieldAlert, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Layers, 
  School,
  Users,
  Check,
  RefreshCw,
  FolderUp,
  Cloud
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { parseDbBackupFile, DbBackupParseResult } from '../../utils/dbBackupHelper';
import { cn } from '../../lib/utils';

interface RestoreDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onOpenGoogleDrive?: () => void;
}

export const RestoreDatabaseModal: React.FC<RestoreDatabaseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onOpenGoogleDrive,
}) => {
  const { 
    students, 
    schoolProfile, 
    securitySettings, 
    restoreDatabaseFromDB,
    currentRole 
  } = useSchool();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<DbBackupParseResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // Restore options
  const [restoreMode, setRestoreMode] = useState<'replace' | 'merge'>('replace');
  const [restoreProfile, setRestoreProfile] = useState<boolean>(true);

  // PIN security verification
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  // Restore execution state
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState<{
    studentCount: number;
    message: string;
    mode: 'replace' | 'merge';
  } | null>(null);

  if (!isOpen) return null;

  const handleResetModal = () => {
    setSelectedFile(null);
    setParseResult(null);
    setParseError(null);
    setPinInput('');
    setPinError(null);
    setIsRestoring(false);
    setRestoreSuccess(null);
  };

  const handleClose = () => {
    handleResetModal();
    onClose();
  };

  const handleProcessFile = async (file: File) => {
    setSelectedFile(file);
    setIsParsing(true);
    setParseError(null);
    setParseResult(null);
    setRestoreSuccess(null);
    setPinError(null);

    try {
      const result = await parseDbBackupFile(file);
      if (result.success && result.students.length > 0) {
        setParseResult(result);
      } else {
        setParseError(result.errorMessage || 'Berkas tidak memuat data siswa yang valid.');
      }
    } catch (err: any) {
      setParseError(err?.message || 'Gagal membaca berkas basis data.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'db' || ext === 'json' || ext === 'sql') {
        handleProcessFile(file);
      } else {
        setParseError('Harap pilih berkas dengan ekstensi .db, .sql, atau .json.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
    e.target.value = '';
  };

  const handleExecuteRestore = () => {
    if (!parseResult) return;

    // Check PIN requirement if PIN is configured in security settings
    if (securitySettings?.requirePinForDelete && securitySettings?.adminPin) {
      if (!pinInput) {
        setPinError('Masukkan PIN Keamanan Administrator untuk memulihkan basis data.');
        return;
      }
      if (pinInput !== securitySettings.adminPin) {
        setPinError('PIN Keamanan salah. Harap periksa kembali PIN Administrator Anda.');
        return;
      }
    }

    setIsRestoring(true);
    setPinError(null);

    // Simulate minor delay for UI stability and feedback
    setTimeout(() => {
      const res = restoreDatabaseFromDB(parseResult, restoreMode, restoreProfile);
      setIsRestoring(false);

      if (res.success) {
        setRestoreSuccess({
          studentCount: res.studentCount,
          message: res.message,
          mode: restoreMode,
        });
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setParseError(res.message);
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-4 bg-[#003399] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 text-white border border-white/20">
              <RotateCcw className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-wide">
                  Kembalikan Basis Data (.db)
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-400 text-slate-950 rounded-full">
                  Format .DB
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Pemulihan dan sinkronisasi arsip buku induk siswa dari berkas cadangan offline
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-800 dark:text-slate-200">
          
          {/* SUCCESS SCREEN */}
          {restoreSuccess ? (
            <div className="py-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-lg">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Basis Data Berhasil Dikembalikan!
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  {restoreSuccess.message}
                </p>
              </div>

              <div className="max-w-sm mx-auto p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-left space-y-2 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Metode Pemulihan:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-200">
                    {restoreSuccess.mode === 'replace' ? 'Ganti Total (Timpa)' : 'Penggabungan (Merge)'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Jumlah Siswa Terdaftar:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {restoreSuccess.studentCount} Siswa
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Sekolah Aktif:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                    {schoolProfile.namaSekolah}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2.5 bg-[#003399] hover:bg-[#002266] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Selesai & Buka Data Siswa
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* STEP 1: FILE UPLOAD DROPZONE */}
              {!parseResult && (
                <div className="space-y-4">
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3",
                      dragActive
                        ? "border-[#003399] bg-blue-50/60 dark:bg-blue-950/20"
                        : "border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    )}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".db,.sql,.json"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shadow-xs">
                      {isParsing ? (
                        <RefreshCw className="w-8 h-8 animate-spin" />
                      ) : (
                        <FolderUp className="w-8 h-8" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                        {isParsing ? 'Membaca & Memvalidasi Berkas .db...' : 'Pilih atau Tarik Berkas Basis Data (.db)'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                        Mendukung berkas pencadangan <strong>.db</strong> (snapshot resmi & skema SQL) serta berkas cadangan sistem <strong>.json</strong>.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                      <span className="px-4 py-1.5 bg-[#003399] hover:bg-[#002266] text-white text-xs font-bold rounded-lg shadow-xs transition-colors">
                        Pilih Berkas .DB dari Komputer
                      </span>
                      {onOpenGoogleDrive && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClose();
                            onOpenGoogleDrive();
                          }}
                          className="px-3.5 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Cloud className="w-3.5 h-3.5 text-blue-600" />
                          <span>Pilih dari Google Drive</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ERROR NOTIFICATION */}
                  {parseError && (
                    <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 flex items-start gap-3 text-xs leading-relaxed">
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />
                      <div>
                        <div className="font-bold">Gagal Memulihkan Berkas:</div>
                        <div>{parseError}</div>
                      </div>
                    </div>
                  )}

                  {/* INFORMATIVE GUIDANCE */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 text-xs text-slate-600 dark:text-slate-400 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                      <Info className="w-4 h-4 text-blue-600" />
                      <span>Panduan Berkas Basis Data .DB:</span>
                    </div>
                    <ul className="list-disc pl-5 space-y-1 leading-relaxed text-[11px]">
                      <li>
                        Berkas <strong>.db</strong> dihasilkan melalui menu <em>"Ekspor Basis Data Siswa (.db)"</em> yang memuat seluruh tabel identitas siswa, nilai raport, mutasi, dan profil sekolah.
                      </li>
                      <li>
                        Sistem memvalidasi struktur data secara otomatis sebelum proses pemulihan dieksekusi untuk menjamin integritas arsip buku induk.
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {/* STEP 2: PREVIEW & RESTORE CONFIGURATION */}
              {parseResult && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  
                  {/* File Metadata Card */}
                  <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-indigo-600 text-white shrink-0">
                        <Database className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                            {parseResult.fileName}
                          </span>
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-md">
                            Valid
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                          {parseResult.formatLabel} • {(parseResult.fileSize / 1024).toFixed(1)} KB
                          {parseResult.exportedAt && ` • Dicadangkan: ${new Date(parseResult.exportedAt).toLocaleDateString('id-ID')}`}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setParseResult(null);
                        setSelectedFile(null);
                        setPinInput('');
                        setPinError(null);
                      }}
                      className="px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
                    >
                      Ganti Berkas
                    </button>
                  </div>

                  {/* Summary Comparison Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
                      <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-blue-600" />
                        <span>Database Saat Ini</span>
                      </div>
                      <div className="text-xl font-black text-slate-900 dark:text-slate-100">
                        {students.length} <span className="text-xs font-normal text-slate-500">Siswa</span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {schoolProfile.namaSekolah}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 space-y-1">
                      <div className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                        <FolderUp className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Dalam Berkas .DB</span>
                      </div>
                      <div className="text-xl font-black text-indigo-900 dark:text-indigo-200">
                        {parseResult.studentCount} <span className="text-xs font-normal text-indigo-600 dark:text-indigo-400">Siswa</span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {parseResult.schoolName || 'Profil Sekolah Terlampir'}
                      </div>
                    </div>
                  </div>

                  {/* Sample Students Preview */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>Sampel Data Siswa dalam Berkas ({parseResult.sampleStudents.length} dari {parseResult.studentCount}):</span>
                      <span className="text-[11px] font-normal text-slate-500">
                        Kelas: {Object.keys(parseResult.classesSummary).join(', ') || '-'}
                      </span>
                    </div>

                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden text-xs">
                      <div className="grid grid-cols-12 gap-2 p-2.5 bg-slate-100 dark:bg-slate-800 font-bold text-[11px] text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                        <span className="col-span-2">No. Induk</span>
                        <span className="col-span-3">NISN</span>
                        <span className="col-span-4">Nama Lengkap</span>
                        <span className="col-span-1 text-center">Kelas</span>
                        <span className="col-span-2 text-right">Status</span>
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-32 overflow-y-auto">
                        {parseResult.sampleStudents.map((s, idx) => (
                          <div key={idx} className="grid grid-cols-12 gap-2 p-2 text-[11px] hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <span className="col-span-2 font-mono text-slate-600 dark:text-slate-400">{s.noInduk}</span>
                            <span className="col-span-3 font-mono text-slate-600 dark:text-slate-400">{s.nisn}</span>
                            <span className="col-span-4 font-semibold text-slate-900 dark:text-slate-100 truncate">{s.namaLengkap}</span>
                            <span className="col-span-1 text-center font-bold text-blue-700 dark:text-blue-400">{s.kelasSekarang}</span>
                            <span className="col-span-2 text-right">
                              <span className={cn(
                                "px-1.5 py-0.5 rounded-full text-[10px] font-medium",
                                s.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              )}>
                                {s.status}
                              </span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* RESTORE MODE SELECTION */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Metode Pemulihan Database:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label
                        className={cn(
                          "p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-1",
                          restoreMode === 'replace'
                            ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-600/20 shadow-xs"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="restoreMode"
                            checked={restoreMode === 'replace'}
                            onChange={() => setRestoreMode('replace')}
                            className="text-blue-600"
                          />
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                            Ganti Total (Timpa)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed pl-5">
                          Menimpa seluruh data saat ini dengan persis {parseResult.studentCount} data siswa dari berkas .db.
                        </p>
                      </label>

                      <label
                        className={cn(
                          "p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-1",
                          restoreMode === 'merge'
                            ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-600/20 shadow-xs"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="restoreMode"
                            checked={restoreMode === 'merge'}
                            onChange={() => setRestoreMode('merge')}
                            className="text-blue-600"
                          />
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                            Gabungkan (Merge)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed pl-5">
                          Mempertahankan data lama, memperbarui siswa dengan NIS sama, dan menambahkan siswa baru.
                        </p>
                      </label>
                    </div>

                    {/* Checkbox for school profile */}
                    {parseResult.schoolProfile && (
                      <label className="flex items-center gap-2 pt-1 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={restoreProfile}
                          onChange={(e) => setRestoreProfile(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>
                          Pulihkan juga Identitas Sekolah (<em>{parseResult.schoolProfile.namaSekolah}</em>)
                        </span>
                      </label>
                    )}
                  </div>

                  {/* PIN VERIFICATION (IF ENABLED) */}
                  {securitySettings?.requirePinForDelete && securitySettings?.adminPin && (
                    <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                        <Lock className="w-4 h-4 text-amber-600" />
                        <span>Verifikasi PIN Administrator Diperlukan</span>
                      </div>
                      <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
                        Fitur keamanan sistem aktif. Masukkan PIN Admin untuk mengonfirmasi pengembalian database ini.
                      </p>
                      
                      <div className="relative max-w-xs pt-1">
                        <input
                          type={showPin ? "text" : "password"}
                          value={pinInput}
                          onChange={(e) => {
                            setPinInput(e.target.value);
                            setPinError(null);
                          }}
                          placeholder="Masukkan PIN Admin (6 Digit)"
                          maxLength={12}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPin(!showPin)}
                          className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600"
                        >
                          {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {pinError && (
                        <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{pinError}</span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* BOTTOM ACTION BUTTONS */}
                  <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setParseResult(null)}
                      className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                    >
                      Kembali ke Pemilihan Berkas
                    </button>

                    <button
                      type="button"
                      disabled={isRestoring}
                      onClick={handleExecuteRestore}
                      className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isRestoring ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Memulihkan Basis Data...</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-4 h-4" />
                          <span>Kembalikan Database (.db) Sekarang</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* MODAL FOOTER */}
        {!restoreSuccess && (
          <div className="px-6 py-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
            <span className="flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-indigo-600" />
              <span>Format .db terstandarisasi untuk pemulihan mandiri</span>
            </span>
            <button
              onClick={handleClose}
              className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
