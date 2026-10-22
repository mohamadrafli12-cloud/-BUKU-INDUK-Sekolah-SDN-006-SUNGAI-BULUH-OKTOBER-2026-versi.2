import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Edit3, 
  BookOpen, 
  CreditCard, 
  GraduationCap, 
  UserMinus, 
  Award,
  Phone, 
  MapPin, 
  Calendar, 
  HeartPulse, 
  UserCheck, 
  FileCheck,
  Building,
  CheckCircle2,
  History,
  Clock,
  User,
  ShieldCheck,
  RotateCcw,
  AlertTriangle,
  Eye,
  Upload,
  Trash2,
  Image as ImageIcon,
  Download,
  FileText,
  Camera,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { Student } from '../../types';
import { formatIndonesianDate, cn } from '../../lib/utils';
import { useSchool } from '../../context/SchoolContext';
import { 
  OfficialNationalLogo,
  TutWuriHandayaniSDLogo, 
  TutWuriHandayaniKemdikbudLogo, 
  KemenagMadrasahLogo 
} from '../../utils/logoHelper';
import { IjazahViewerModal } from './IjazahViewerModal';
import { CameraCaptureModal } from './CameraCaptureModal';
import { compressImageFile } from '../../utils/imageCompressor';

interface StudentDetailModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (student: Student, initialTab?: 'pribadi' | 'alamat' | 'ortu' | 'kesehatan' | 'masuk') => void;
  onPrintBukuInduk: (studentId: string) => void;
  onPrintKartuPelajar: (studentId: string) => void;
  onMutasi: (student: Student) => void;
  onSTTB: (student: Student) => void;
  onRaport: (student: Student) => void;
  onNavigateStudent?: (student: Student) => void;
  studentList?: Student[];
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student: incomingStudent,
  isOpen,
  onClose,
  onEdit,
  onPrintBukuInduk,
  onPrintKartuPelajar,
  onMutasi,
  onSTTB,
  onRaport,
  onNavigateStudent,
  studentList,
}) => {
  const { students, currentRole, activityLogs, schoolProfile, rolePermissions, updateStudent, updateFotoIjazah, updateFotoIjazahMutasi } = useSchool();
  const [activeTab, setActiveTab] = useState<'profil' | 'keluarga' | 'kesehatan' | 'raport' | 'kelulusan' | 'riwayat'>('profil');

  // Navigation scope: 'semua' (all students) or 'kelas' (current student's class only)
  const [navScope, setNavScope] = useState<'semua' | 'kelas'>('semua');
  const contentScrollRef = React.useRef<HTMLDivElement>(null);

  // Internal student pointer to allow smooth cyclic navigation
  const [internalStudent, setInternalStudent] = useState<Student | null>(incomingStudent);

  // Sync internalStudent immediately whenever incomingStudent or isOpen changes
  React.useEffect(() => {
    if (incomingStudent && isOpen) {
      const fresh = students.find(s => s.id === incomingStudent.id) || incomingStudent;
      setInternalStudent(fresh);
      setActiveTab('profil');
      contentScrollRef.current?.scrollTo({ top: 0 });
    } else if (!isOpen) {
      setInternalStudent(null);
    }
  }, [incomingStudent?.id, isOpen]);

  // Keep internalStudent fresh if students array updates while modal is open (e.g. edits, photo updates)
  React.useEffect(() => {
    if (isOpen && internalStudent?.id) {
      const latest = students.find(s => s.id === internalStudent.id);
      if (latest && latest !== internalStudent) {
        setInternalStudent(latest);
      }
    }
  }, [students, isOpen, internalStudent?.id]);

  // Current active student: prioritize incomingStudent if IDs differ, otherwise internalStudent
  const student = React.useMemo(() => {
    if (!incomingStudent) return internalStudent;
    if (internalStudent && internalStudent.id === incomingStudent.id) {
      return internalStudent;
    }
    const fresh = students.find(s => s.id === incomingStudent.id) || incomingStudent;
    return fresh;
  }, [incomingStudent, internalStudent, students]);

  // Active student list based on scope
  const activeStudentList = React.useMemo(() => {
    const baseList = studentList && studentList.length > 0 ? studentList : students;
    if (navScope === 'kelas' && student?.kelasSekarang) {
      const filtered = baseList.filter(s => s.kelasSekarang === student.kelasSekarang);
      return filtered.length > 0 ? filtered : baseList;
    }
    return baseList;
  }, [studentList, students, navScope, student?.kelasSekarang]);

  const currentIndex = student ? activeStudentList.findIndex((s) => s.id === student.id) : -1;
  const totalStudents = activeStudentList.length;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < totalStudents - 1;
  const prevStudent = hasPrev ? activeStudentList[currentIndex - 1] : null;
  const nextStudent = hasNext ? activeStudentList[currentIndex + 1] : null;

  const handlePrev = () => {
    if (hasPrev && prevStudent) {
      if (onNavigateStudent) {
        onNavigateStudent(prevStudent);
      }
      setInternalStudent(prevStudent);
      contentScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNext = () => {
    if (hasNext && nextStudent) {
      if (onNavigateStudent) {
        onNavigateStudent(nextStudent);
      }
      setInternalStudent(nextStudent);
      contentScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Keyboard navigation: Left Arrow (←) & Right Arrow (→)
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const tag = activeEl?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || (activeEl as HTMLElement)?.isContentEditable) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        if (hasPrev && prevStudent) {
          e.preventDefault();
          handlePrev();
        }
      } else if (e.key === 'ArrowRight') {
        if (hasNext && nextStudent) {
          e.preventDefault();
          handleNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasPrev, hasNext, prevStudent, nextStudent]);

  // Reset scroll on student change
  React.useEffect(() => {
    if (student?.id) {
      contentScrollRef.current?.scrollTo({ top: 0 });
    }
  }, [student?.id]);

  // Ijazah / Foto Viewer Lightbox state
  const [viewerImageUrl, setViewerImageUrl] = useState<string | null>(null);
  const [viewerTitle, setViewerTitle] = useState<string>('Berkas Scan / Gambar Ijazah Resmi');
  const [viewerSubtitle, setViewerSubtitle] = useState<string>('');
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Direct quick upload state
  const [uploadTarget, setUploadTarget] = useState<'sttb' | 'mutasi' | 'foto' | null>(null);
  const [isCompressingDirect, setIsCompressingDirect] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const directFileInputRef = React.useRef<HTMLInputElement>(null);

  if (!isOpen || !student) return null;

  const handleTriggerDirectUpload = (target: 'sttb' | 'mutasi' | 'foto') => {
    setUploadTarget(target);
    setTimeout(() => {
      directFileInputRef.current?.click();
    }, 50);
  };

  const handleDownloadFoto = (fotoUrl: string, studentName: string) => {
    const link = document.createElement('a');
    link.href = fotoUrl;
    link.download = `Pas_Foto_${studentName.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDirectFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTarget) return;

    if (!file.type.startsWith('image/')) {
      alert('Berkas harus berupa gambar berformat JPG, JPEG, PNG, atau WEBP.');
      return;
    }

    setIsCompressingDirect(true);
    try {
      if (uploadTarget === 'foto') {
        const res = await compressImageFile(file, 800, 1000, 0.85);
        updateStudent(student.id, { fotoUrl: res.dataUrl });
      } else {
        const res = await compressImageFile(file, 1400, 1400, 0.85);
        if (uploadTarget === 'sttb') {
          updateFotoIjazah(student.id, res.dataUrl);
        } else {
          updateFotoIjazahMutasi(student.id, res.dataUrl);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Gagal memproses berkas gambar.');
    } finally {
      setIsCompressingDirect(false);
      setUploadTarget(null);
      if (directFileInputRef.current) {
        directFileInputRef.current.value = '';
      }
    }
  };

  // Find logs related to this student
  const studentLogs = activityLogs.filter(
    (log) =>
      log.targetId === student.id ||
      log.description.toLowerCase().includes(student.namaLengkap.toLowerCase()) ||
      log.description.includes(student.noInduk)
  );

  const creatorName = student.dibuatOleh || 'Rahmat Hidayat, S.Kom. (Operator TU)';
  const updaterName = student.terakhirDiubahOleh || student.dibuatOleh || 'Rahmat Hidayat, S.Kom. (Operator TU)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header Ribbon (BCA blue & gold badge) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-[#003399] text-white">
          <div className="flex items-center gap-3.5">
            <div 
              onClick={() => {
                if (student.fotoUrl) {
                  setViewerTitle('Pas Foto Resmi Peserta Didik');
                  setViewerSubtitle(`${student.namaLengkap} (NIS: ${student.noInduk} • Kelas: ${student.kelasSekarang})`);
                  setViewerImageUrl(student.fotoUrl);
                  setIsViewerOpen(true);
                }
              }}
              className={cn(
                "w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/15 flex items-center justify-center text-amber-300 font-extrabold text-2xl overflow-hidden border-2 border-white/30 shadow-md shrink-0 transition-transform",
                student.fotoUrl ? "cursor-pointer hover:scale-105 hover:border-amber-300 ring-2 ring-white/20" : ""
              )}
              title={student.fotoUrl ? "Klik untuk melihat pas foto ukuran penuh" : student.namaLengkap}
            >
              {student.fotoUrl ? (
                <img src={student.fotoUrl} alt={student.namaLengkap} className="w-full h-full object-cover" />
              ) : (
                student.namaLengkap.charAt(0)
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg md:text-xl font-extrabold tracking-wide text-white">
                  {student.namaLengkap}
                </h3>
                <span className={cn(
                  "px-2.5 py-0.5 text-[10px] font-extrabold rounded-full uppercase shrink-0",
                  student.status === 'Aktif' ? 'bg-emerald-400 text-slate-950' :
                  student.status === 'Lulus' ? 'bg-amber-400 text-slate-950' : 'bg-rose-400 text-slate-950'
                )}>
                  {student.status}
                </span>
              </div>
              <p className="text-xs text-blue-100 flex items-center gap-3 mt-0.5">
                <span>NIS: <strong className="text-amber-300 font-mono">{student.noInduk}</strong></span>
                <span>•</span>
                <span>NISN: <strong className="text-amber-300 font-mono">{student.nisn}</strong></span>
                <span>•</span>
                <span>{student.kelasSekarang}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Widget Navigasi Siswa Sebelumnya & Selanjutnya di Header Ribbon */}
            <div className="flex items-center bg-white/15 backdrop-blur-xs rounded-xl border border-white/25 p-1 text-white shadow-xs">
              {/* Tombol Toggle Cakupan: Semua Siswa / Satu Kelas */}
              <button
                type="button"
                onClick={() => setNavScope(prev => prev === 'semua' ? 'kelas' : 'semua')}
                className="px-2 py-1 text-[10px] sm:text-[11px] font-bold rounded-lg bg-white/15 hover:bg-white/25 text-blue-100 transition-colors mr-1 cursor-pointer"
                title={navScope === 'semua' ? `Filter aktif: Semua Siswa (${totalStudents}). Klik untuk navigasi khusus kelas ${student.kelasSekarang}` : `Filter aktif: Hanya ${student.kelasSekarang} (${totalStudents}). Klik untuk navigasi semua siswa`}
              >
                {navScope === 'semua' ? 'Semua' : (student.kelasSekarang || 'Kelas')}
              </button>

              {/* Tombol Sebelumnya */}
              <button
                type="button"
                onClick={handlePrev}
                disabled={!hasPrev}
                className={cn(
                  "flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  hasPrev 
                    ? "bg-white/25 hover:bg-white text-white hover:text-[#003399] shadow-xs active:scale-95" 
                    : "opacity-40 cursor-not-allowed text-white/50"
                )}
                title={hasPrev ? `Siswa Sebelumnya: ${prevStudent?.namaLengkap} (Tekan Panah Kiri ←)` : "Ini adalah siswa pertama"}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sebelumnya</span>
              </button>

              {/* Nomor Urut / Indikator Posisi */}
              <div 
                className="px-1.5 sm:px-2 py-0.5 text-[11px] sm:text-xs font-bold font-mono text-amber-300 select-none whitespace-nowrap"
                title={`Siswa ke-${currentIndex + 1} dari total ${totalStudents} siswa`}
              >
                {currentIndex >= 0 ? currentIndex + 1 : '-'}/{totalStudents}
              </div>

              {/* Tombol Selanjutnya */}
              <button
                type="button"
                onClick={handleNext}
                disabled={!hasNext}
                className={cn(
                  "flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  hasNext 
                    ? "bg-white/25 hover:bg-white text-white hover:text-[#003399] shadow-xs active:scale-95" 
                    : "opacity-40 cursor-not-allowed text-white/50"
                )}
                title={hasNext ? `Siswa Selanjutnya: ${nextStudent?.namaLengkap} (Tekan Panah Kanan →)` : "Ini adalah siswa terakhir"}
              >
                <span className="hidden sm:inline">Selanjutnya</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Logo Kanan (Diselaraskan dengan Logo Kanan Kop Surat Sekolah) */}
            <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 bg-white/15 rounded-xl border border-white/20 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center p-0.5 shrink-0 overflow-hidden shadow-2xs">
                {schoolProfile.logoKananUrl && !schoolProfile.logoKananUrl.startsWith('preset:') ? (
                  <img
                    src={schoolProfile.logoKananUrl}
                    alt="Logo Kanan Kop"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <OfficialNationalLogo
                    logoIdOrUrl={schoolProfile.logoKananUrl || schoolProfile.tutWuriLogoUrl || 'preset:tut-wuri-sd'}
                    className="w-7 h-7"
                  />
                )}
              </div>
              <div className="text-left leading-tight pr-1">
                <div className="text-[10px] font-black text-amber-300 tracking-wide uppercase">
                  {schoolProfile.logoKananUrl && !schoolProfile.logoKananUrl.startsWith('preset:') ? 'LOGO KANAN KOP' : 'TUT WURI HANDAYANI'}
                </div>
                <div className="text-[8.5px] text-blue-100 font-medium truncate max-w-[140px] uppercase">
                  {schoolProfile.namaSekolah}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Tutup (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Shortcut Bar */}
        <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPrintBukuInduk(student.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#003399] hover:bg-[#002266] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Buku Induk (2 Halaman)</span>
            </button>
            <button
              onClick={() => onPrintKartuPelajar(student.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg shadow-xs transition-colors"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Cetak Kartu Pelajar</span>
            </button>
            {student.fotoUrl && (
              <button
                type="button"
                onClick={() => {
                  setViewerTitle('Pas Foto Resmi Peserta Didik');
                  setViewerSubtitle(`${student.namaLengkap} (NIS: ${student.noInduk} • Kelas: ${student.kelasSekarang})`);
                  setViewerImageUrl(student.fotoUrl || null);
                  setIsViewerOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                title="Lihat pas foto siswa ukuran besar / penuh"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Lihat Pas Foto</span>
              </button>
            )}
            {(student.sttb?.fotoIjazah || student.mutasi?.fotoIjazah) && (
              <button
                type="button"
                onClick={() => {
                  setViewerTitle('Berkas Scan / Gambar Ijazah Resmi');
                  setViewerSubtitle(`${student.namaLengkap} (NIS: ${student.noInduk} • No. Ijazah: ${student.sttb?.noIjazah || '-'})`);
                  setViewerImageUrl(student.sttb?.fotoIjazah || student.mutasi?.fotoIjazah || null);
                  setIsViewerOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                title="Buka lampiran scan Ijazah / dokumen"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Lihat Ijazah</span>
              </button>
            )}
          </div>

          {currentRole !== 'umum' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onRaport(student)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 text-blue-900 dark:text-blue-200 text-xs font-bold rounded-lg transition-colors"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Nilai Raport</span>
              </button>
              {student.status !== 'Lulus' && student.status !== 'Mutasi Keluar' && (
                <button
                  onClick={() => onMutasi(student)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-orange-100 dark:bg-orange-900/50 hover:bg-orange-200 text-orange-900 dark:text-orange-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  <UserMinus className="w-3.5 h-3.5" />
                  <span>Mutasi Keluar</span>
                </button>
              )}
              {student.status === 'Mutasi Keluar' && rolePermissions?.inputMutasi !== false && (
                <button
                  onClick={() => onMutasi(student)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200 text-amber-900 dark:text-amber-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  title="Edit Catatan Mutasi Siswa"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Mutasi</span>
                </button>
              )}
              {student.status !== 'Lulus' && (
                <button
                  onClick={() => onSTTB(student)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-100 dark:bg-emerald-900/50 hover:bg-emerald-200 text-emerald-900 dark:text-emerald-200 text-xs font-bold rounded-lg transition-colors"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Input STTB/Ijazah</span>
                </button>
              )}
              <button
                onClick={() => onEdit(student)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-100 text-xs font-bold rounded-lg transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Data</span>
              </button>
            </div>
          )}
        </div>

        {/* Tab Header */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6">
          <button
            onClick={() => setActiveTab('profil')}
            className={cn(
              "px-4 py-2.5 text-xs font-bold border-b-2 transition-all",
              activeTab === 'profil'
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            )}
          >
            Profil & Identitas
          </button>
          <button
            onClick={() => setActiveTab('keluarga')}
            className={cn(
              "px-4 py-2.5 text-xs font-bold border-b-2 transition-all",
              activeTab === 'keluarga'
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            )}
          >
            Orang Tua & Alamat
          </button>
          <button
            onClick={() => setActiveTab('kesehatan')}
            className={cn(
              "px-4 py-2.5 text-xs font-bold border-b-2 transition-all",
              activeTab === 'kesehatan'
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            )}
          >
            Jasmani & Riwayat Masuk
          </button>
          <button
            onClick={() => setActiveTab('raport')}
            className={cn(
              "px-4 py-2.5 text-xs font-bold border-b-2 transition-all",
              activeTab === 'raport'
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            )}
          >
            Nilai Raport ({student.raport?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('kelulusan')}
            className={cn(
              "px-4 py-2.5 text-xs font-bold border-b-2 transition-all",
              activeTab === 'kelulusan'
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            )}
          >
            Mutasi & STTB/Ijazah
          </button>
          <button
            onClick={() => setActiveTab('riwayat')}
            className={cn(
              "px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5",
              activeTab === 'riwayat'
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            )}
          >
            <History className="w-3.5 h-3.5" />
            <span>Catatan Aktivitas ({studentLogs.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div ref={contentScrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: PROFIL */}
          {activeTab === 'profil' && (
            <div className="space-y-6">
              {/* KARTU PAS FOTO RESMI & IDENTITAS UTAMA (FOTO LEBIH BESAR) */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-800/50 dark:to-slate-900/60 shadow-xs">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  
                  {/* Kolom Foto Siswa Ukuran Besar (Proporsi Pas Foto Resmi 3x4) */}
                  <div className="flex flex-col items-center shrink-0">
                    <div 
                      onClick={() => {
                        if (student.fotoUrl) {
                          setViewerTitle('Pas Foto Resmi Peserta Didik');
                          setViewerSubtitle(`${student.namaLengkap} (NIS: ${student.noInduk} • Kelas: ${student.kelasSekarang})`);
                          setViewerImageUrl(student.fotoUrl);
                          setIsViewerOpen(true);
                        }
                      }}
                      className={cn(
                        "w-44 h-56 sm:w-48 sm:h-60 rounded-2xl bg-white dark:bg-slate-800 border-4 border-white dark:border-slate-700 shadow-xl overflow-hidden relative group transition-all",
                        student.fotoUrl ? "cursor-pointer ring-2 ring-blue-500/20 hover:ring-blue-500/50" : "flex flex-col items-center justify-center p-4 text-center border-dashed border-slate-300 dark:border-slate-700"
                      )}
                    >
                      {student.fotoUrl ? (
                        <>
                          <img 
                            src={student.fotoUrl} 
                            alt={student.namaLengkap} 
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          {/* Hover overlay hint */}
                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1.5 p-2 text-center backdrop-blur-2xs">
                            <Eye className="w-6 h-6 text-amber-300" />
                            <span className="text-[11px] font-bold">Perbesar Foto</span>
                          </div>
                          {/* Ratio badge */}
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/70 text-white font-mono text-[9px] font-bold backdrop-blur-xs">
                            3 x 4 cm
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-2">
                          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 mb-2">
                            <User className="w-8 h-8" />
                          </div>
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">PAS FOTO</span>
                          <span className="text-[11px] font-semibold text-slate-500">3 x 4 cm</span>
                          <span className="text-[9px] text-slate-400 mt-1">Belum diunggah</span>
                        </div>
                      )}
                    </div>

                    {/* Action buttons below photo */}
                    <div className="flex items-center gap-2 mt-3 w-full justify-center">
                      {student.fotoUrl && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setViewerTitle('Pas Foto Resmi Peserta Didik');
                              setViewerSubtitle(`${student.namaLengkap} (NIS: ${student.noInduk} • Kelas: ${student.kelasSekarang})`);
                              setViewerImageUrl(student.fotoUrl || null);
                              setIsViewerOpen(true);
                            }}
                            className="px-2.5 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-slate-300 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                            title="Lihat foto siswa ukuran penuh"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Lihat</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadFoto(student.fotoUrl!, student.namaLengkap)}
                            className="px-2.5 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                            title="Unduh file foto siswa"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Unduh</span>
                          </button>
                        </>
                      )}
                      {currentRole !== 'umum' && (
                        <>
                          <button
                            type="button"
                            onClick={() => setIsCameraOpen(true)}
                            className="px-2.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                            title="Ambil pasfoto siswa menggunakan kamera"
                          >
                            <Camera className="w-3.5 h-3.5 text-amber-300" />
                            <span>Kamera</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTriggerDirectUpload('foto')}
                            disabled={isCompressingDirect}
                            className="px-2.5 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                            title="Ganti atau unggah pas foto siswa dari berkas"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>{student.fotoUrl ? 'Ganti' : 'Unggah'}</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Informasi Ringkas Profil & Status */}
                  <div className="flex-1 w-full space-y-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="px-2.5 py-0.5 text-[10px] font-black uppercase rounded-md bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                          {student.kelasSekarang}
                        </span>
                        <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
                          Diterima di: {(!student.diterimaDiKelas || student.diterimaDiKelas === '7' || student.diterimaDiKelas === '7A' || student.diterimaDiKelas.toLowerCase() === 'kelas 7') ? 'Kelas 1' : student.diterimaDiKelas}
                        </span>
                        <span className={cn(
                          "px-2.5 py-0.5 text-[10px] font-black uppercase rounded-md",
                          student.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' :
                          student.status === 'Lulus' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800' :
                          'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                        )}>
                          Status: {student.status}
                        </span>
                        <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          Tahun Masuk: {student.tahunMasuk || '-'}
                        </span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        {student.namaLengkap}
                      </h3>
                      {student.namaPanggilan && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Nama Panggilan: <span className="font-semibold text-slate-700 dark:text-slate-200">"{student.namaPanggilan}"</span>
                        </p>
                      )}
                    </div>

                    {/* Grid Nomor Registrasi Pokok */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">No. Induk (NIS)</span>
                        <span className="font-mono text-sm font-extrabold text-blue-700 dark:text-blue-300">{student.noInduk}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">NISN Resmi</span>
                        <span className="font-mono text-sm font-extrabold text-amber-600 dark:text-amber-400">{student.nisn}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs col-span-2 sm:col-span-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">NIK Siswa</span>
                        <span className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">{student.nik}</span>
                      </div>
                    </div>

                    {/* Ringkasan Lahir & Identitas */}
                    <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Tempat, Tanggal Lahir:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                          {student.tempatLahir}, {formatIndonesianDate(student.tanggalLahir)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Jenis Kelamin & Agama:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {student.jenisKelamin === 'L' ? 'Laki-Laki (L)' : 'Perempuan (P)'} • {student.agama}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Kewarganegaraan & Bahasa:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {student.kewarganegaraan} • {student.bahasaIbu}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                <h4 className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  <span>Keterangan Diri Siswa</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="py-1 text-slate-500">Nama Lengkap</div>
                  <div className="py-1 font-bold text-slate-900 dark:text-slate-100">{student.namaLengkap}</div>
                  <div className="py-1 text-slate-500">Nama Panggilan</div>
                  <div className="py-1 font-semibold text-slate-800 dark:text-slate-200">{student.namaPanggilan || '-'}</div>
                  <div className="py-1 text-slate-500">Jenis Kelamin</div>
                  <div className="py-1 font-semibold text-slate-800 dark:text-slate-200">
                    {student.jenisKelamin === 'L' ? 'Laki-Laki (L)' : 'Perempuan (P)'}
                  </div>
                  <div className="py-1 text-slate-500">Tempat, Tanggal Lahir</div>
                  <div className="py-1 font-semibold text-slate-800 dark:text-slate-200">
                    {student.tempatLahir}, {formatIndonesianDate(student.tanggalLahir)}
                  </div>
                  <div className="py-1 text-slate-500">Agama</div>
                  <div className="py-1 font-semibold text-slate-800 dark:text-slate-200">{student.agama}</div>
                  <div className="py-1 text-slate-500">Kewarganegaraan</div>
                  <div className="py-1 font-semibold text-slate-800 dark:text-slate-200">{student.kewarganegaraan}</div>
                  <div className="py-1 text-slate-500">Bahasa di Rumah</div>
                  <div className="py-1 font-semibold text-slate-800 dark:text-slate-200">{student.bahasaIbu}</div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                <h4 className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider flex items-center gap-2">
                  <FileCheck className="w-4 h-4" />
                  <span>Identitas Berkas & Keluarga</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="py-1 text-slate-500">No. Induk (NIS)</div>
                  <div className="py-1 font-mono font-bold text-blue-700 dark:text-blue-300">{student.noInduk}</div>
                  <div className="py-1 text-slate-500">NISN</div>
                  <div className="py-1 font-mono font-bold text-amber-600 dark:text-amber-400">{student.nisn}</div>
                  <div className="py-1 text-slate-500">NIK Siswa</div>
                  <div className="py-1 font-mono font-semibold text-slate-800 dark:text-slate-200">{student.nik}</div>
                  <div className="py-1 text-slate-500">No. Kartu Keluarga (KK)</div>
                  <div className="py-1 font-mono font-semibold text-slate-800 dark:text-slate-200">{student.noKk || '-'}</div>
                  <div className="py-1 text-slate-500">Anak Ke-</div>
                  <div className="py-1 font-semibold text-slate-800 dark:text-slate-200">
                    {student.anakKe} dari { (student.jumlahSaudaraKandung || 0) + 1 } bersaudara
                  </div>
                  <div className="py-1 text-slate-500">Status Keberadaan Keluarga</div>
                  <div className="py-1 font-semibold text-slate-800 dark:text-slate-200">{student.statusKeluarga}</div>
                  <div className="py-1 text-slate-500">No. HP / WA Siswa</div>
                  <div className="py-1 font-semibold text-slate-800 dark:text-slate-200">{student.noHpSiswa || '-'}</div>
                </div>
              </div>
            </div>

            {/* Berkas Lampiran Ijazah & Dokumen Mutasi di Profil */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Lampiran Dokumen & Scan Ijazah Siswa</span>
                </h4>
                <div className="flex items-center gap-2">
                  {currentRole !== 'umum' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleTriggerDirectUpload('sttb')}
                        disabled={isCompressingDirect}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200 dark:hover:bg-emerald-900/60 rounded-lg border border-emerald-300 dark:border-emerald-800 transition-colors cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        <span>{student.sttb?.fotoIjazah ? 'Ganti Ijazah' : '+ Upload Ijazah'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTriggerDirectUpload('mutasi')}
                        disabled={isCompressingDirect}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-orange-50 hover:bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-200 dark:hover:bg-orange-900/60 rounded-lg border border-orange-300 dark:border-orange-800 transition-colors cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        <span>{student.mutasi?.fotoIjazah ? 'Ganti Dok. Mutasi' : '+ Upload Mutasi'}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {isCompressingDirect && (
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-pulse">
                  <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <span>Mengompresi dan menyimpan scan dokumen...</span>
                </div>
              )}

              {/* Document List / Grid */}
              {(student.sttb?.fotoIjazah || student.mutasi?.fotoIjazah) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {/* STTB / Ijazah Attachment Card */}
                  {student.sttb?.fotoIjazah && (
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-900/70 shadow-xs flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          onClick={() => {
                            setViewerImageUrl(student.sttb!.fotoIjazah!);
                            setIsViewerOpen(true);
                          }}
                          className="relative w-16 h-16 rounded-lg overflow-hidden border border-emerald-300 dark:border-emerald-800 cursor-pointer group shrink-0 bg-slate-100 dark:bg-slate-800"
                          title="Klik untuk melihat pratinjau penuh Ijazah"
                        >
                          <img
                            src={student.sttb.fotoIjazah}
                            alt="Scan Ijazah Siswa"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Eye className="w-5 h-5" />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1 text-xs">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-800 dark:text-slate-100 truncate">
                              Scan Ijazah Kelulusan (STTB)
                            </span>
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded">
                              Terverifikasi
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            No. Seri: {student.sttb.noIjazah || '-'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setViewerImageUrl(student.sttb!.fotoIjazah!);
                                setIsViewerOpen(true);
                              }}
                              className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Lihat Penuh</span>
                            </button>
                            {currentRole !== 'umum' && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm('Hapus lampiran gambar ijazah siswa ini?')) {
                                    updateFotoIjazah(student.id, undefined);
                                  }
                                }}
                                className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-0.5 cursor-pointer ml-1"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                                <span>Hapus</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mutasi Attachment Card */}
                  {student.mutasi?.fotoIjazah && (
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-orange-200 dark:border-orange-900/70 shadow-xs flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          onClick={() => {
                            setViewerImageUrl(student.mutasi!.fotoIjazah!);
                            setIsViewerOpen(true);
                          }}
                          className="relative w-16 h-16 rounded-lg overflow-hidden border border-orange-300 dark:border-orange-800 cursor-pointer group shrink-0 bg-slate-100 dark:bg-slate-800"
                          title="Klik untuk melihat pratinjau dokumen mutasi"
                        >
                          <img
                            src={student.mutasi.fotoIjazah}
                            alt="Scan Dokumen Mutasi"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Eye className="w-5 h-5" />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1 text-xs">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-800 dark:text-slate-100 truncate">
                              Dokumen / Ijazah Mutasi
                            </span>
                            <span className="text-[10px] font-bold text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-950/60 px-1.5 py-0.2 rounded">
                              Mutasi Keluar
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            Tujuan: {student.mutasi.sekolahTujuan || '-'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setViewerImageUrl(student.mutasi!.fotoIjazah!);
                                setIsViewerOpen(true);
                              }}
                              className="text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Lihat Penuh</span>
                            </button>
                            {currentRole !== 'umum' && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm('Hapus lampiran gambar dokumen mutasi siswa ini?')) {
                                    updateFotoIjazahMutasi(student.id, undefined);
                                  }
                                }}
                                className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-0.5 cursor-pointer ml-1"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                                <span>Hapus</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/40 text-center flex flex-col items-center justify-center gap-1.5 py-5">
                  <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Belum ada scan Ijazah atau Dokumen Mutasi yang dilampirkan
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-md">
                    Lampirkan berkas gambar ijazah asli atau surat pindah untuk melengkapi arsip digital Buku Induk Siswa.
                  </p>
                  {currentRole !== 'umum' && (
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => handleTriggerDirectUpload('sttb')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Scan Ijazah (STTB)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTriggerDirectUpload('mutasi')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Dokumen Mutasi</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

          {/* TAB 2: ORANG TUA & ALAMAT */}
          {activeTab === 'keluarga' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Data Ayah */}
                <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-950/20 space-y-2">
                  <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase">Data Ayah Kandung</h4>
                  <div className="space-y-1.5 text-xs">
                    <div><span className="text-slate-500">Nama:</span> <strong className="text-slate-800 dark:text-slate-100">{student.ayah.nama}</strong></div>
                    <div><span className="text-slate-500">NIK:</span> <span className="font-mono text-slate-700 dark:text-slate-300">{student.ayah.nik}</span></div>
                    <div><span className="text-slate-500">Pendidikan:</span> <span>{student.ayah.pendidikan}</span></div>
                    <div><span className="text-slate-500">Pekerjaan:</span> <span>{student.ayah.pekerjaan}</span></div>
                    <div><span className="text-slate-500">Penghasilan:</span> <span>{student.ayah.penghasilanBulanan}</span></div>
                    <div><span className="text-slate-500">No. HP:</span> <strong className="text-blue-600">{student.ayah.noHp || '-'}</strong></div>
                  </div>
                </div>

                {/* Data Ibu */}
                <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/30 dark:bg-rose-950/20 space-y-2">
                  <h4 className="text-xs font-bold text-rose-900 dark:text-rose-300 uppercase">Data Ibu Kandung</h4>
                  <div className="space-y-1.5 text-xs">
                    <div><span className="text-slate-500">Nama:</span> <strong className="text-slate-800 dark:text-slate-100">{student.ibu.nama}</strong></div>
                    <div><span className="text-slate-500">NIK:</span> <span className="font-mono text-slate-700 dark:text-slate-300">{student.ibu.nik}</span></div>
                    <div><span className="text-slate-500">Pendidikan:</span> <span>{student.ibu.pendidikan}</span></div>
                    <div><span className="text-slate-500">Pekerjaan:</span> <span>{student.ibu.pekerjaan}</span></div>
                    <div><span className="text-slate-500">Penghasilan:</span> <span>{student.ibu.penghasilanBulanan}</span></div>
                    <div><span className="text-slate-500">No. HP:</span> <strong className="text-rose-600">{student.ibu.noHp || '-'}</strong></div>
                  </div>
                </div>
              </div>

              {/* Alamat Lengkap */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-500" />
                  <span>Alamat Tempat Tinggal</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-slate-500">Alamat Lengkap:</p>
                    <p className="font-bold text-slate-800 dark:text-slate-100">{student.alamat}</p>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                      RT {student.rt} / RW {student.rw}, Dusun {student.dusun || '-'}, Desa {student.kelurahanDesa}
                    </p>
                    <p className="text-slate-600 dark:text-slate-400">
                      Kec. {student.kecamatan}, {student.kabupatenKota}, Prov. {student.provinsi} ({student.kodePos})
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <div><span className="text-slate-500">Tinggal Bersama:</span> <span className="font-semibold">{student.tinggalDengan}</span></div>
                    <div><span className="text-slate-500">Jarak ke Sekolah:</span> <span className="font-semibold">{student.jarakKeSekolahKm} KM</span></div>
                    <div><span className="text-slate-500">Transportasi:</span> <span className="font-semibold">{student.transportasi}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: KESEHATAN & MASUK */}
          {activeTab === 'kesehatan' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                <h4 className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider flex items-center gap-2">
                  <HeartPulse className="w-4 h-4" />
                  <span>Kesehatan & Keadaan Jasmani</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="py-1 text-slate-500">Golongan Darah</div>
                  <div className="py-1 font-bold text-rose-600">{student.kesehatan.golonganDarah}</div>
                  <div className="py-1 text-slate-500">Tinggi Badan</div>
                  <div className="py-1 font-semibold text-slate-800 dark:text-slate-200">{student.kesehatan.tinggiBadanCm} cm</div>
                  <div className="py-1 text-slate-500">Berat Badan</div>
                  <div className="py-1 font-semibold text-slate-800 dark:text-slate-200">{student.kesehatan.beratBadanKg} kg</div>
                  <div className="py-1 text-slate-500">Riwayat Penyakit</div>
                  <div className="py-1 text-slate-700 dark:text-slate-300">{student.kesehatan.penyakitPernahDiderita || 'Tidak Ada'}</div>
                  <div className="py-1 text-slate-500">Kelainan Jasmani</div>
                  <div className="py-1 text-slate-700 dark:text-slate-300">{student.kesehatan.kelainanJasmani || 'Tidak Ada'}</div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-700">
                  <h4 className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    <span>Riwayat Masuk & Pendidikan Asal</span>
                  </h4>
                  {currentRole !== 'umum' && (
                    <button
                      type="button"
                      onClick={() => onEdit(student, 'masuk')}
                      className="px-2 py-0.5 text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/60 rounded flex items-center gap-1 transition-colors cursor-pointer"
                      title="Edit Riwayat Masuk & Pendidikan Asal"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Riwayat</span>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="py-1 text-slate-500">Pendidikan Asal (TK/PAUD)</div>
                  <div className="py-1 font-bold text-slate-800 dark:text-slate-100">{student.sekolahAsalTK || '-'}</div>
                  <div className="py-1 text-slate-500">No. Ijazah TK / SKTB</div>
                  <div className="py-1 font-mono text-slate-700 dark:text-slate-300">{student.noIjazahTK || '-'}</div>
                  <div className="py-1 text-slate-500">Diterima Tanggal</div>
                  <div className="py-1 font-semibold text-slate-800 dark:text-slate-200">{formatIndonesianDate(student.tanggalDiterima)}</div>
                  <div className="py-1 text-slate-500">Diterima di Kelas</div>
                  <div className="py-1 font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded w-fit">
                    {(!student.diterimaDiKelas || student.diterimaDiKelas === '7' || student.diterimaDiKelas === '7A' || student.diterimaDiKelas.toLowerCase() === 'kelas 7') ? 'Kelas 1' : student.diterimaDiKelas}
                  </div>
                  <div className="py-1 text-slate-500">Kelas Sekarang</div>
                  <div className="py-1 font-semibold text-slate-800 dark:text-slate-200">{student.kelasSekarang || 'Kelas 1'}</div>
                  <div className="py-1 text-slate-500">Tahun Masuk</div>
                  <div className="py-1 font-semibold text-slate-800 dark:text-slate-200">{student.tahunMasuk || '-'}</div>
                  <div className="py-1 text-slate-500">Status Siswa</div>
                  <div className="py-1 font-semibold text-slate-800 dark:text-slate-200">{student.status || 'Aktif'}</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RAPORT */}
          {activeTab === 'raport' && (
            <div className="space-y-4">
              {(!student.raport || student.raport.length === 0) ? (
                <div className="text-center py-10 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Belum ada rekap nilai raport yang diinput untuk siswa ini.</p>
                  {currentRole !== 'umum' && (
                    <button
                      onClick={() => onRaport(student)}
                      className="mt-3 px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700"
                    >
                      + Input Nilai Raport Baru
                    </button>
                  )}
                </div>
              ) : (
                student.raport.map((rep, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                      <div>
                        <h4 className="text-xs font-extrabold text-blue-900 dark:text-blue-300 uppercase">
                          Nilai Raport Semester {rep.semester} ({rep.kelas} - TP {rep.tahunAjaran})
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Peringkat Kelas: <strong className="text-amber-500">#{rep.peringkatKelas || 1}</strong> dari {rep.totalSiswaKelas || 28} siswa
                        </p>
                      </div>
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold rounded-full">
                        Tuntas
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] uppercase">
                          <tr>
                            <th className="p-2">No</th>
                            <th className="p-2">Mata Pelajaran</th>
                            <th className="p-2 text-center">KKM</th>
                            <th className="p-2 text-center">Pengetahuan</th>
                            <th className="p-2 text-center">Keterampilan</th>
                            <th className="p-2 text-center">Nilai Akhir</th>
                            <th className="p-2 text-center">Predikat</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                          {rep.nilai.map((n, i) => (
                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                              <td className="p-2 text-slate-400">{i + 1}</td>
                              <td className="p-2 font-medium text-slate-800 dark:text-slate-200">{n.mapel}</td>
                              <td className="p-2 text-center font-mono">{n.kkm}</td>
                              <td className="p-2 text-center font-mono">{n.pengetahuan}</td>
                              <td className="p-2 text-center font-mono">{n.keterampilan}</td>
                              <td className="p-2 text-center font-mono font-bold text-blue-600 dark:text-blue-400">{n.nilaiAkhir}</td>
                              <td className="p-2 text-center font-bold">
                                <span className={cn(
                                  "px-1.5 py-0.5 rounded text-[10px]",
                                  n.predikat === 'A' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                                )}>
                                  {n.predikat}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg text-xs space-y-1">
                      <p className="text-slate-600 dark:text-slate-300">
                        <strong className="text-slate-800 dark:text-slate-200">Catatan Wali Kelas:</strong> {rep.catatanWaliKelas}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Kehadiran: Sakit: {rep.kehadiran.sakit} hari | Izin: {rep.kehadiran.izin} hari | Alpa: {rep.kehadiran.tanpaKeterangan} hari
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 5: MUTASI & STTB */}
          {activeTab === 'kelulusan' && (
            <div className="space-y-6">
              {/* MUTASI */}
              <div className="p-4 rounded-xl border border-orange-200 dark:border-orange-900 bg-orange-50/30 dark:bg-orange-950/20 space-y-3">
                <h4 className="text-xs font-bold text-orange-900 dark:text-orange-300 uppercase tracking-wider flex items-center gap-2">
                  <UserMinus className="w-4 h-4 text-orange-600" />
                  <span>Catatan Mutasi / Meninggalkan Sekolah (Sheet TINGGALKAN)</span>
                </h4>
                {student.mutasi ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div><span className="text-slate-500">Tanggal Surat:</span> <strong className="text-slate-800 dark:text-slate-100">{formatIndonesianDate(student.mutasi.tglMeninggalkan)}</strong></div>
                      <div><span className="text-slate-500">Tingkat / Dari Kelas:</span> <span className="font-semibold">{student.mutasi.dariKelas}</span></div>
                      <div>
                        <span className="text-slate-500">Sekolah Tujuan:</span> <strong className="text-blue-700 dark:text-blue-300">{student.mutasi.sekolahTujuan}</strong>
                        {(student.mutasi.desaKelurahanTujuan || student.mutasi.kabupatenKotaTujuan) && (
                          <div className="text-[11px] text-slate-500">
                            {[student.mutasi.desaKelurahanTujuan, student.mutasi.kecamatanTujuan, student.mutasi.kabupatenKotaTujuan, student.mutasi.provinsiTujuan].filter(Boolean).join(', ')}
                          </div>
                        )}
                      </div>
                      <div><span className="text-slate-500">Nomor Surat Pindah:</span> <span className="font-mono text-slate-700 dark:text-slate-300">{student.mutasi.noSuratPindah}</span></div>
                      {student.mutasi.namaPemohon && (
                        <div><span className="text-slate-500">Pemohon (Orang Tua/Wali):</span> <span className="font-bold text-slate-800 dark:text-slate-200">{student.mutasi.namaPemohon} ({student.mutasi.pekerjaanPemohon || '-'})</span></div>
                      )}
                      <div className={student.mutasi.namaPemohon ? '' : 'sm:col-span-2'}><span className="text-slate-500">Dengan Alasan:</span> <span className="text-slate-800 dark:text-slate-200 font-medium">{student.mutasi.alasanPindah}</span></div>
                    </div>

                    {/* Lampiran Scan Ijazah / Dokumen Mutasi */}
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-orange-200 dark:border-orange-900/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                      {student.mutasi.fotoIjazah ? (
                        <>
                          <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div
                              onClick={() => {
                                setViewerImageUrl(student.mutasi!.fotoIjazah!);
                                setIsViewerOpen(true);
                              }}
                              className="relative w-14 h-14 rounded-lg overflow-hidden border border-orange-300 dark:border-orange-800 cursor-pointer group shrink-0 bg-slate-100 dark:bg-slate-800"
                              title="Perbesar scan dokumen mutasi"
                            >
                              <img
                                src={student.mutasi.fotoIjazah}
                                alt="Ijazah/Mutasi"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <Eye className="w-4 h-4" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1 text-xs">
                              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                                Scan Ijazah / Dokumen Mutasi Terlampir
                              </span>
                              <p className="text-[11px] text-slate-500">
                                Berkas digital resmi tersimpan di profil siswa
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  setViewerImageUrl(student.mutasi!.fotoIjazah!);
                                  setIsViewerOpen(true);
                                }}
                                className="text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 mt-0.5 cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Lihat Ukuran Penuh</span>
                              </button>
                            </div>
                          </div>
                          {currentRole !== 'umum' && (
                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                              <button
                                type="button"
                                onClick={() => handleTriggerDirectUpload('mutasi')}
                                disabled={isCompressingDirect}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                              >
                                <Upload className="w-3.5 h-3.5 text-slate-500" />
                                <span>Ganti Gambar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm('Hapus lampiran gambar dokumen mutasi siswa ini?')) {
                                    updateFotoIjazahMutasi(student.id, undefined);
                                  }
                                }}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Hapus</span>
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <FileText className="w-4 h-4 text-orange-500 shrink-0" />
                            <span>Belum ada berkas gambar ijazah / dokumen mutasi yang dilampirkan.</span>
                          </div>
                          {currentRole !== 'umum' && (
                            <button
                              type="button"
                              onClick={() => handleTriggerDirectUpload('mutasi')}
                              className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Upload Scan Ijazah / Mutasi</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {currentRole !== 'umum' && rolePermissions?.inputMutasi !== false && (
                      <div className="pt-2 border-t border-orange-200 dark:border-orange-900/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <span className="text-[11px] text-orange-700 dark:text-orange-300">
                          Siswa berstatus keluar. Ingin memperbarui catatan mutasi?
                        </span>
                        <button
                          type="button"
                          onClick={() => onMutasi(student)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                          title="Edit data dan catatan mutasi siswa"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Mutasi</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Siswa belum pernah mutasi / pindah sekolah.</p>
                )}
              </div>

              {/* STTB / IJAZAH */}
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-3">
                <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-emerald-600" />
                  <span>STTB / Ijazah & Serah Terima Dokumen (Sheet STTB)</span>
                </h4>
                {student.sttb ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div><span className="text-slate-500">No. Seri Ijazah:</span> <strong className="font-mono text-blue-700 dark:text-blue-300">{student.sttb.noIjazah || '-'}</strong></div>
                      <div><span className="text-slate-500">No. SKHU:</span> <span className="font-mono">{student.sttb.noSkhu || '-'}</span></div>
                      <div><span className="text-slate-500">No. Peserta UN:</span> <span className="font-mono text-slate-800 dark:text-slate-200">{student.sttb.noPesertaUN || '-'}</span></div>
                      <div><span className="text-slate-500">Tanggal Kelulusan:</span> <span className="font-semibold">{formatIndonesianDate(student.sttb.tanggalKelulusan)}</span></div>
                      <div><span className="text-slate-500">Melanjutkan Ke:</span> <strong className="text-slate-800 dark:text-slate-100">{student.sttb.melanjutkanKe || '-'}</strong></div>
                      <div><span className="text-slate-500">Status Pengambilan:</span> <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">{student.sttb.statusTandaTerima}</span></div>
                      <div><span className="text-slate-500">Tanggal Serah Terima:</span> <span>{formatIndonesianDate(student.sttb.tglSerahTerima)}</span></div>
                      <div><span className="text-slate-500">Nama Penerima / Hubungan:</span> <span>{student.sttb.namaPenerima} ({student.sttb.hubunganPenerima})</span></div>
                    </div>

                    {/* Lampiran Scan Asli Ijazah (STTB) */}
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 mt-2">
                      {student.sttb.fotoIjazah ? (
                        <>
                          <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div
                              onClick={() => {
                                setViewerImageUrl(student.sttb!.fotoIjazah!);
                                setIsViewerOpen(true);
                              }}
                              className="relative w-14 h-14 rounded-lg overflow-hidden border border-emerald-300 dark:border-emerald-800 cursor-pointer group shrink-0 bg-slate-100 dark:bg-slate-800"
                              title="Perbesar scan Ijazah kelulusan"
                            >
                              <img
                                src={student.sttb.fotoIjazah}
                                alt="Scan Ijazah"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <Eye className="w-4 h-4" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1 text-xs">
                              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                                Scan Ijazah Kelulusan Resmi Terlampir
                              </span>
                              <p className="text-[11px] text-slate-500">
                                Berkas ijazah tersimpan untuk arsip Buku Induk & profil siswa
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  setViewerImageUrl(student.sttb!.fotoIjazah!);
                                  setIsViewerOpen(true);
                                }}
                                className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 mt-0.5 cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Lihat Ukuran Penuh</span>
                              </button>
                            </div>
                          </div>
                          {currentRole !== 'umum' && (
                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                              <button
                                type="button"
                                onClick={() => handleTriggerDirectUpload('sttb')}
                                disabled={isCompressingDirect}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                              >
                                <Upload className="w-3.5 h-3.5 text-slate-500" />
                                <span>Ganti Ijazah</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm('Hapus lampiran gambar ijazah kelulusan siswa ini?')) {
                                    updateFotoIjazah(student.id, undefined);
                                  }
                                }}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Hapus</span>
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <GraduationCap className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span>Belum ada scan gambar ijazah asli yang dilampirkan.</span>
                          </div>
                          {currentRole !== 'umum' && (
                            <button
                              type="button"
                              onClick={() => handleTriggerDirectUpload('sttb')}
                              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Upload Scan Ijazah</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Data Ijazah / STTB belum diterbitkan.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: RIWAYAT & AUDIT LOG */}
          {activeTab === 'riwayat' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-2">
                <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Informasi Pencatat & Pengubah Data Buku Induk</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] text-slate-500 block mb-0.5">Didaftarkan / Ditambahkan Oleh:</span>
                    <strong className="text-slate-900 dark:text-slate-100 flex items-center gap-1.5 font-bold">
                      <User className="w-3.5 h-3.5 text-emerald-600" />
                      {creatorName}
                    </strong>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Waktu Registrasi: {formatIndonesianDate(student.createdAt)}
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] text-slate-500 block mb-0.5">Terakhir Diubah / Diperbarui Oleh:</span>
                    <strong className="text-slate-900 dark:text-slate-100 flex items-center gap-1.5 font-bold">
                      <User className="w-3.5 h-3.5 text-blue-600" />
                      {updaterName}
                    </strong>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Waktu Terakhir: {formatIndonesianDate(student.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Specific log timeline */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-4 h-4 text-slate-500" />
                  <span>Kronologi Log Perubahan Terkait Siswa Ini</span>
                </h5>

                {studentLogs.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
                    Belum ada riwayat aktivitas spesifik yang terekam untuk siswa ini sejak pencatatan awal.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {studentLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start justify-between gap-3 text-xs shadow-2xs"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                              {log.action}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {log.user}
                            </span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 font-medium">
                            {log.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0 font-mono bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{log.timestamp}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Previous / Next Controls */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>Dibuat: <strong className="text-slate-700 dark:text-slate-300">{creatorName}</strong></span>
            <span>•</span>
            <span>Diubah terakhir: <strong className="text-blue-700 dark:text-blue-300">{updaterName}</strong></span>
          </div>

          <div className="flex items-center flex-wrap gap-2 self-end sm:self-auto">
            {/* Tombol Navigasi Bawah */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-2xs">
              <button
                type="button"
                onClick={handlePrev}
                disabled={!hasPrev}
                className={cn(
                  "flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors",
                  hasPrev
                    ? "bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-slate-800 dark:text-slate-200 hover:text-[#003399] dark:hover:text-blue-300 cursor-pointer"
                    : "opacity-40 cursor-not-allowed text-slate-400"
                )}
                title={hasPrev ? `Siswa Sebelumnya: ${prevStudent?.namaLengkap} (Panah Kiri ←)` : "Siswa pertama"}
              >
                <ChevronLeft className="w-4 h-4 text-[#003399] dark:text-blue-400" />
                <span>Sebelumnya{prevStudent ? `: ${prevStudent.namaLengkap.split(' ')[0]}` : ''}</span>
              </button>

              <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 px-1.5 whitespace-nowrap">
                {currentIndex + 1} / {totalStudents}
              </span>

              <button
                type="button"
                onClick={handleNext}
                disabled={!hasNext}
                className={cn(
                  "flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors",
                  hasNext
                    ? "bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-slate-800 dark:text-slate-200 hover:text-[#003399] dark:hover:text-blue-300 cursor-pointer"
                    : "opacity-40 cursor-not-allowed text-slate-400"
                )}
                title={hasNext ? `Siswa Selanjutnya: ${nextStudent?.namaLengkap} (Panah Kanan →)` : "Siswa terakhir"}
              >
                <span>Selanjutnya{nextStudent ? `: ${nextStudent.namaLengkap.split(' ')[0]}` : ''}</span>
                <ChevronRight className="w-4 h-4 text-[#003399] dark:text-blue-400" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {/* Hidden File Input for Direct Upload from Profile */}
      <input
        type="file"
        ref={directFileInputRef}
        onChange={handleDirectFileInputChange}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />

      {/* Lightbox / High Resolution Ijazah & Foto Viewer Modal */}
      {isViewerOpen && viewerImageUrl && (
        <IjazahViewerModal
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          imageUrl={viewerImageUrl}
          student={student}
          title={viewerTitle}
          subtitle={viewerSubtitle}
        />
      )}

      {/* Modal Kamera Pasfoto Siswa */}
      {isCameraOpen && (
        <CameraCaptureModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onCapture={(photoDataUrl) => {
            updateStudent(student.id, { fotoUrl: photoDataUrl });
          }}
          title="Ambil Pasfoto Siswa"
          studentName={student.namaLengkap}
        />
      )}
    </div>
  );
};
