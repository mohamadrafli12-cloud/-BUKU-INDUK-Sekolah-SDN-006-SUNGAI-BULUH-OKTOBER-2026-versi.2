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
  ArrowRight,
  HandCoins,
  Landmark,
  CheckCircle
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
  onEdit: (student: Student, initialTab?: 'pribadi' | 'alamat' | 'ortu' | 'kesehatan' | 'masuk' | 'bantuan') => void;
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
  const [activeTab, setActiveTab] = useState<'profil' | 'keluarga' | 'kesehatan' | 'raport' | 'kelulusan' | 'riwayat_bantuan' | 'riwayat'>('profil');

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

  // Assistance & social aid detection
  const isPenerimaBantuan = Boolean(
    (student.penerimaBantuan && student.penerimaBantuan !== 'Tidak' && student.penerimaBantuan !== 'Bukan Penerima Bantuan') ||
    (student.jenisBantuanList && student.jenisBantuanList.length > 0) ||
    (student.penerimaKip && student.penerimaKip.toLowerCase() === 'ya') ||
    (student.penerimaKps && student.penerimaKps.toLowerCase() === 'ya') ||
    (student.layakPip && student.layakPip.toLowerCase() === 'ya')
  );

  const activeAssistanceTypes: string[] = React.useMemo(() => {
    if (student.jenisBantuanList && student.jenisBantuanList.length > 0) {
      return student.jenisBantuanList;
    }
    if (student.penerimaBantuan && student.penerimaBantuan !== 'Tidak' && student.penerimaBantuan !== 'Bukan Penerima Bantuan') {
      return student.penerimaBantuan.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    return [];
  }, [student.jenisBantuanList, student.penerimaBantuan]);

  const aidLogs = React.useMemo(() => {
    return studentLogs.filter((log) => {
      const text = ((log.description || '') + ' ' + (log.action || '')).toLowerCase();
      return (
        text.includes('bantuan') ||
        text.includes('pip') ||
        text.includes('baznas') ||
        text.includes('beasiswa') ||
        text.includes('kps') ||
        text.includes('kip') ||
        text.includes('kks') ||
        text.includes('tahap') ||
        text.includes('keringanan')
      );
    });
  }, [studentLogs]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/65 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-[97vw] lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1520px] max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
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
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('profil')}
            className={cn(
              "px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap",
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
              "px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap",
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
              "px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap",
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
              "px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap",
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
              "px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap",
              activeTab === 'kelulusan'
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            )}
          >
            Mutasi & STTB/Ijazah
          </button>
          <button
            onClick={() => setActiveTab('riwayat_bantuan')}
            className={cn(
              "px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap",
              activeTab === 'riwayat_bantuan'
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            )}
          >
            <HandCoins className="w-3.5 h-3.5" />
            <span>Riwayat Bantuan</span>
            {isPenerimaBantuan && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('riwayat')}
            className={cn(
              "px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap",
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
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">No. Induk (NIS)</span>
                        <span className="font-mono text-sm font-extrabold text-blue-700 dark:text-blue-300">{student.noInduk}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">NISN Resmi</span>
                        <span className="font-mono text-sm font-extrabold text-amber-600 dark:text-amber-400">{student.nisn}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">NIK Siswa</span>
                        <span className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">{student.nik}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">No. Kartu Keluarga</span>
                        <span className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">{student.noKk || '-'}</span>
                      </div>
                    </div>

                    {/* Ringkasan Lahir & Identitas */}
                    <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="text-slate-500 font-medium">Tempat, Tanggal Lahir:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 sm:text-right">
                          {student.tempatLahir}, {formatIndonesianDate(student.tanggalLahir)} {student.usia ? `(${student.usia} tahun)` : ''}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="text-slate-500 font-medium">Jenis Kelamin & Agama:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {student.jenisKelamin === 'L' ? 'Laki-Laki (L)' : 'Perempuan (P)'} • Agama {student.agama}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="text-slate-500 font-medium">Kewarganegaraan & Bahasa:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {student.kewarganegaraan} • Bahasa Ibu: {student.bahasaIbu}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                  <h4 className="text-xs font-black text-blue-900 dark:text-blue-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-700 pb-2.5">
                    <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Keterangan Diri Siswa</span>
                  </h4>
                  <div className="space-y-0.5 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1 border-b border-slate-100 dark:border-slate-800/70">
                      <span className="w-full sm:w-48 text-slate-500 dark:text-slate-400 font-medium shrink-0">Nama Lengkap</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 flex-1">{student.namaLengkap}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1 border-b border-slate-100 dark:border-slate-800/70">
                      <span className="w-full sm:w-48 text-slate-500 dark:text-slate-400 font-medium shrink-0">Nama Panggilan</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 flex-1">{student.namaPanggilan || '-'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1 border-b border-slate-100 dark:border-slate-800/70">
                      <span className="w-full sm:w-48 text-slate-500 dark:text-slate-400 font-medium shrink-0">Jenis Kelamin</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 flex-1">
                        {student.jenisKelamin === 'L' ? 'Laki-Laki (L)' : 'Perempuan (P)'}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1 border-b border-slate-100 dark:border-slate-800/70">
                      <span className="w-full sm:w-48 text-slate-500 dark:text-slate-400 font-medium shrink-0">Tempat, Tanggal Lahir</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 flex-1">
                        {student.tempatLahir}, {formatIndonesianDate(student.tanggalLahir)} {student.usia ? `(${student.usia} tahun)` : ''}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1 border-b border-slate-100 dark:border-slate-800/70">
                      <span className="w-full sm:w-48 text-slate-500 dark:text-slate-400 font-medium shrink-0">Agama</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 flex-1">{student.agama}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1 border-b border-slate-100 dark:border-slate-800/70">
                      <span className="w-full sm:w-48 text-slate-500 dark:text-slate-400 font-medium shrink-0">Kewarganegaraan</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 flex-1">{student.kewarganegaraan}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1 border-b border-slate-100 dark:border-slate-800/70">
                      <span className="w-full sm:w-48 text-slate-500 dark:text-slate-400 font-medium shrink-0">Bahasa di Rumah</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 flex-1">{student.bahasaIbu}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1">
                      <span className="w-full sm:w-48 text-slate-500 dark:text-slate-400 font-medium shrink-0">No. Registrasi Akta Lahir</span>
                      <span className="font-mono font-medium text-slate-700 dark:text-slate-300 flex-1">{student.noRegistrasiAktaLahir || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                  <h4 className="text-xs font-black text-blue-900 dark:text-blue-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-700 pb-2.5">
                    <FileCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Identitas Berkas & Keluarga</span>
                  </h4>
                  <div className="space-y-0.5 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1 border-b border-slate-100 dark:border-slate-800/70">
                      <span className="w-full sm:w-48 text-slate-500 dark:text-slate-400 font-medium shrink-0">No. Induk Siswa (NIS)</span>
                      <span className="font-mono font-bold text-blue-700 dark:text-blue-300 flex-1">{student.noInduk}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1 border-b border-slate-100 dark:border-slate-800/70">
                      <span className="w-full sm:w-48 text-slate-500 dark:text-slate-400 font-medium shrink-0">NISN Kemdikbud</span>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400 flex-1">{student.nisn}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1 border-b border-slate-100 dark:border-slate-800/70">
                      <span className="w-full sm:w-48 text-slate-500 dark:text-slate-400 font-medium shrink-0">NIK Siswa (Dukcapil)</span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 flex-1">{student.nik}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1 border-b border-slate-100 dark:border-slate-800/70">
                      <span className="w-full sm:w-48 text-slate-500 dark:text-slate-400 font-medium shrink-0">No. Kartu Keluarga (KK)</span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 flex-1">{student.noKk || '-'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1 border-b border-slate-100 dark:border-slate-800/70">
                      <span className="w-full sm:w-48 text-slate-500 dark:text-slate-400 font-medium shrink-0">Kedudukan Anak</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 flex-1">
                        Anak ke-{student.anakKe} dari { (student.jumlahSaudaraKandung || 0) + 1 } bersaudara
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1 border-b border-slate-100 dark:border-slate-800/70">
                      <span className="w-full sm:w-48 text-slate-500 dark:text-slate-400 font-medium shrink-0">Status Keberadaan</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 flex-1">{student.statusKeluarga}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1 border-b border-slate-100 dark:border-slate-800/70">
                      <span className="w-full sm:w-48 text-slate-500 dark:text-slate-400 font-medium shrink-0">No. HP / WhatsApp Siswa</span>
                      <span className="font-semibold text-blue-700 dark:text-blue-300 flex-1">{student.noHpSiswa || '-'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1">
                      <span className="w-full sm:w-48 text-slate-500 dark:text-slate-400 font-medium shrink-0">Email Siswa</span>
                      <span className="text-slate-700 dark:text-slate-300 flex-1">{student.emailSiswa || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

            {/* Kartu Status & Kepesertaan Bantuan Siswa (No. 6) */}
            <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-gradient-to-r from-blue-50/70 to-indigo-50/50 dark:from-blue-950/40 dark:to-indigo-950/30 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h4 className="text-xs font-black text-blue-900 dark:text-blue-300 uppercase tracking-wider flex items-center gap-2">
                  <HandCoins className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Status & Kepesertaan Bantuan Siswa (No. 6)</span>
                </h4>
                {currentRole !== 'umum' && (
                  <button
                    type="button"
                    onClick={() => onEdit(student, 'bantuan')}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-300 dark:border-blue-800 hover:bg-blue-50 shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Ubah Data Bantuan</span>
                  </button>
                )}
              </div>

              {Boolean((student.penerimaBantuan && student.penerimaBantuan !== 'Tidak' && student.penerimaBantuan !== 'Bukan Penerima') || (student.jenisBantuanList && student.jenisBantuanList.length > 0)) ? (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs bg-white dark:bg-slate-800/80 p-3.5 rounded-xl border border-blue-100 dark:border-blue-900/40">
                  <div>
                    <span className="text-[10.5px] font-bold text-slate-500 block">Program Bantuan:</span>
                    <span className="font-extrabold text-blue-800 dark:text-blue-300">
                      {student.jenisBantuanList?.join(', ') || student.penerimaBantuan}
                    </span>
                    {student.bantuanLainnya && (
                      <span className="text-[11px] text-amber-700 dark:text-amber-400 block mt-0.5">
                        Rincian: {student.bantuanLainnya}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-[10.5px] font-bold text-slate-500 block">Tahun & Tahap:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      TP {student.tahunBantuan || schoolProfile?.tahunPelajaranAktif || '2026/2027'}
                    </span>
                    <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 rounded ml-1">
                      {student.tahapBantuan || 'Tahap 1'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10.5px] font-bold text-slate-500 block">Tanggal Menerima:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {student.tanggalMenerimaBantuan ? formatIndonesianDate(student.tanggalMenerimaBantuan) : '-'}
                    </span>
                    {student.nominalBantuan && (
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono font-bold block mt-0.5">
                        Nominal: {student.nominalBantuan}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-[10.5px] font-bold text-slate-500 block">Keterangan / No. SK:</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {student.keteranganBantuan || '-'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs p-3 bg-white/70 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    Siswa tidak tercatat sebagai penerima bantuan pada tahun pelajaran ini.
                  </span>
                  {currentRole !== 'umum' && (
                    <button
                      type="button"
                      onClick={() => onEdit(student, 'bantuan')}
                      className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                    >
                      + Tambah Bantuan
                    </button>
                  )}
                </div>
              )}
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
            <div className="space-y-6">
              <div className={cn(
                "grid gap-6",
                student.wali?.nama ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1 md:grid-cols-2"
              )}>
                {/* Data Ayah */}
                <div className="p-5 rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-950/20 space-y-3">
                  <h4 className="text-xs font-black text-blue-900 dark:text-blue-300 uppercase tracking-wider flex items-center gap-2 border-b border-blue-200/80 dark:border-blue-900 pb-2.5">
                    <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Data Ayah Kandung</span>
                  </h4>
                  <div className="space-y-0.5 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1 border-b border-blue-100 dark:border-blue-900/40">
                      <span className="w-full sm:w-40 text-slate-500 dark:text-slate-400 font-medium shrink-0">Nama Lengkap Ayah</span>
                      <strong className="text-slate-900 dark:text-slate-100 flex-1 font-bold">{student.ayah.nama || '-'}</strong>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1 border-b border-blue-100 dark:border-blue-900/40">
                      <span className="w-full sm:w-40 text-slate-500 dark:text-slate-400 font-medium shrink-0">NIK Ayah</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold flex-1">{student.ayah.nik || '-'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1 border-b border-blue-100 dark:border-blue-900/40">
                      <span className="w-full sm:w-40 text-slate-500 dark:text-slate-400 font-medium shrink-0">Tahun Lahir</span>
                      <span className="text-slate-800 dark:text-slate-200 font-semibold flex-1">{student.ayah.tahunLahir || '-'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1 border-b border-blue-100 dark:border-blue-900/40">
                      <span className="w-full sm:w-40 text-slate-500 dark:text-slate-400 font-medium shrink-0">Pendidikan Terakhir</span>
                      <span className="text-slate-800 dark:text-slate-200 font-semibold flex-1">{student.ayah.pendidikan || '-'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1 border-b border-blue-100 dark:border-blue-900/40">
                      <span className="w-full sm:w-40 text-slate-500 dark:text-slate-400 font-medium shrink-0">Pekerjaan Pokok</span>
                      <span className="text-slate-800 dark:text-slate-200 font-semibold flex-1">{student.ayah.pekerjaan || '-'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1 border-b border-blue-100 dark:border-blue-900/40">
                      <span className="w-full sm:w-40 text-slate-500 dark:text-slate-400 font-medium shrink-0">Penghasilan Bulanan</span>
                      <span className="text-slate-800 dark:text-slate-200 font-semibold flex-1">{student.ayah.penghasilanBulanan || '-'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1">
                      <span className="w-full sm:w-40 text-slate-500 dark:text-slate-400 font-medium shrink-0">No. Telepon / HP</span>
                      <strong className="text-blue-700 dark:text-blue-300 font-bold flex-1">{student.ayah.noHp || '-'}</strong>
                    </div>
                  </div>
                </div>

                {/* Data Ibu */}
                <div className="p-5 rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50/30 dark:bg-rose-950/20 space-y-3">
                  <h4 className="text-xs font-black text-rose-900 dark:text-rose-300 uppercase tracking-wider flex items-center gap-2 border-b border-rose-200/80 dark:border-rose-900 pb-2.5">
                    <User className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span>Data Ibu Kandung</span>
                  </h4>
                  <div className="space-y-0.5 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1 border-b border-rose-100 dark:border-rose-900/40">
                      <span className="w-full sm:w-40 text-slate-500 dark:text-slate-400 font-medium shrink-0">Nama Lengkap Ibu</span>
                      <strong className="text-slate-900 dark:text-slate-100 flex-1 font-bold">{student.ibu.nama || '-'}</strong>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1 border-b border-rose-100 dark:border-rose-900/40">
                      <span className="w-full sm:w-40 text-slate-500 dark:text-slate-400 font-medium shrink-0">NIK Ibu</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold flex-1">{student.ibu.nik || '-'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1 border-b border-rose-100 dark:border-rose-900/40">
                      <span className="w-full sm:w-40 text-slate-500 dark:text-slate-400 font-medium shrink-0">Tahun Lahir</span>
                      <span className="text-slate-800 dark:text-slate-200 font-semibold flex-1">{student.ibu.tahunLahir || '-'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1 border-b border-rose-100 dark:border-rose-900/40">
                      <span className="w-full sm:w-40 text-slate-500 dark:text-slate-400 font-medium shrink-0">Pendidikan Terakhir</span>
                      <span className="text-slate-800 dark:text-slate-200 font-semibold flex-1">{student.ibu.pendidikan || '-'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1 border-b border-rose-100 dark:border-rose-900/40">
                      <span className="w-full sm:w-40 text-slate-500 dark:text-slate-400 font-medium shrink-0">Pekerjaan Pokok</span>
                      <span className="text-slate-800 dark:text-slate-200 font-semibold flex-1">{student.ibu.pekerjaan || '-'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1 border-b border-rose-100 dark:border-rose-900/40">
                      <span className="w-full sm:w-40 text-slate-500 dark:text-slate-400 font-medium shrink-0">Penghasilan Bulanan</span>
                      <span className="text-slate-800 dark:text-slate-200 font-semibold flex-1">{student.ibu.penghasilanBulanan || '-'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1">
                      <span className="w-full sm:w-40 text-slate-500 dark:text-slate-400 font-medium shrink-0">No. Telepon / HP</span>
                      <strong className="text-rose-700 dark:text-rose-300 font-bold flex-1">{student.ibu.noHp || '-'}</strong>
                    </div>
                  </div>
                </div>

                {/* Data Wali jika ada */}
                {student.wali?.nama && (
                  <div className="p-5 rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50/30 dark:bg-amber-950/20 space-y-3">
                    <h4 className="text-xs font-black text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-2 border-b border-amber-200/80 dark:border-amber-900 pb-2.5">
                      <User className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>Data Wali Siswa</span>
                    </h4>
                    <div className="space-y-0.5 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1 border-b border-amber-100 dark:border-amber-900/40">
                        <span className="w-full sm:w-40 text-slate-500 dark:text-slate-400 font-medium shrink-0">Nama Lengkap Wali</span>
                        <strong className="text-slate-900 dark:text-slate-100 flex-1 font-bold">{student.wali.nama}</strong>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1 border-b border-amber-100 dark:border-amber-900/40">
                        <span className="w-full sm:w-40 text-slate-500 dark:text-slate-400 font-medium shrink-0">NIK Wali</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold flex-1">{student.wali.nik || '-'}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1 border-b border-amber-100 dark:border-amber-900/40">
                        <span className="w-full sm:w-40 text-slate-500 dark:text-slate-400 font-medium shrink-0">Pendidikan Terakhir</span>
                        <span className="text-slate-800 dark:text-slate-200 font-semibold flex-1">{student.wali.pendidikan || '-'}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1 border-b border-amber-100 dark:border-amber-900/40">
                        <span className="w-full sm:w-40 text-slate-500 dark:text-slate-400 font-medium shrink-0">Pekerjaan Pokok</span>
                        <span className="text-slate-800 dark:text-slate-200 font-semibold flex-1">{student.wali.pekerjaan || '-'}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1 border-b border-amber-100 dark:border-amber-900/40">
                        <span className="w-full sm:w-40 text-slate-500 dark:text-slate-400 font-medium shrink-0">Penghasilan Bulanan</span>
                        <span className="text-slate-800 dark:text-slate-200 font-semibold flex-1">{student.wali.penghasilanBulanan || '-'}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1">
                        <span className="w-full sm:w-40 text-slate-500 dark:text-slate-400 font-medium shrink-0">No. Telepon / HP</span>
                        <strong className="text-amber-700 dark:text-amber-300 font-bold flex-1">{student.wali.noHp || '-'}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Alamat Lengkap */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-4">
                <h4 className="text-xs font-black text-slate-900 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2.5">
                  <MapPin className="w-4 h-4 text-amber-500" />
                  <span>Alamat Tempat Tinggal & Aksesibilitas Siswa</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
                  {/* Kolom 1: Alamat Administrasi */}
                  <div className="space-y-2 p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/80">
                    <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 block uppercase tracking-wide">
                      Wilayah Tempat Tinggal
                    </span>
                    <div className="space-y-1">
                      <p className="text-slate-500 text-[11px]">Jalan / Rumah:</p>
                      <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{student.alamat}</p>
                    </div>
                    <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 space-y-1">
                      <p className="text-slate-600 dark:text-slate-300">
                        <strong className="text-slate-800 dark:text-slate-200">RT / RW:</strong> RT {student.rt} / RW {student.rw}
                      </p>
                      {student.dusun && (
                        <p className="text-slate-600 dark:text-slate-300">
                          <strong className="text-slate-800 dark:text-slate-200">Dusun:</strong> {student.dusun}
                        </p>
                      )}
                      <p className="text-slate-600 dark:text-slate-300">
                        <strong className="text-slate-800 dark:text-slate-200">Desa / Kelurahan:</strong> {student.kelurahanDesa}
                      </p>
                      <p className="text-slate-600 dark:text-slate-300">
                        <strong className="text-slate-800 dark:text-slate-200">Kecamatan:</strong> {student.kecamatan}
                      </p>
                      <p className="text-slate-600 dark:text-slate-300">
                        <strong className="text-slate-800 dark:text-slate-200">Kabupaten/Kota:</strong> {student.kabupatenKota}
                      </p>
                      <p className="text-slate-600 dark:text-slate-300">
                        <strong className="text-slate-800 dark:text-slate-200">Provinsi & Kode Pos:</strong> {student.provinsi} ({student.kodePos})
                      </p>
                    </div>
                  </div>

                  {/* Kolom 2: Mobilitas & Domisili */}
                  <div className="space-y-2 p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/80">
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 block uppercase tracking-wide">
                      Domisili & Akses Sekolah
                    </span>
                    <div className="space-y-2 pt-1">
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">Tinggal Bersama:</span>
                        <strong className="text-slate-900 dark:text-slate-100">{student.tinggalDengan}</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">Jarak ke Sekolah:</span>
                        <strong className="text-slate-900 dark:text-slate-100 font-mono">{student.jarakKeSekolahKm} KM</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">Moda Transportasi:</span>
                        <strong className="text-slate-900 dark:text-slate-100">{student.transportasi}</strong>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Kebutuhan Khusus:</span>
                        <span className="text-slate-800 dark:text-slate-200 font-medium">{student.kebutuhanKhusus || 'Tidak Ada'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Kolom 3: Kontak & Titik Koordinat */}
                  <div className="space-y-2 p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/80">
                    <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 block uppercase tracking-wide">
                      Kontak & Titik Lokasi
                    </span>
                    <div className="space-y-2 pt-1">
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">No. HP / WA Siswa:</span>
                        <strong className="text-blue-700 dark:text-blue-300 font-bold">{student.noHpSiswa || '-'}</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">Email Siswa:</span>
                        <span className="text-slate-800 dark:text-slate-200 truncate max-w-[180px]">{student.emailSiswa || '-'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">Lintang (Latitude):</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">{student.lintang || '-'}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">Bujur (Longitude):</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">{student.bujur || '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: KESEHATAN & MASUK */}
          {activeTab === 'kesehatan' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                <h4 className="text-xs font-black text-blue-900 dark:text-blue-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-700 pb-2.5">
                  <HeartPulse className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>Kesehatan & Keadaan Jasmani Siswa</span>
                </h4>
                <div className="space-y-0.5 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1 border-b border-slate-100 dark:border-slate-800/70">
                    <span className="w-full sm:w-48 text-slate-500 dark:text-slate-400 font-medium shrink-0">Golongan Darah</span>
                    <strong className="text-rose-600 dark:text-rose-400 font-black text-sm flex-1">{student.kesehatan.golonganDarah || '-'}</strong>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1 border-b border-slate-100 dark:border-slate-800/70">
                    <span className="w-full sm:w-48 text-slate-500 dark:text-slate-400 font-medium shrink-0">Tinggi Badan</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 flex-1">{student.kesehatan.tinggiBadanCm} cm</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1 border-b border-slate-100 dark:border-slate-800/70">
                    <span className="w-full sm:w-48 text-slate-500 dark:text-slate-400 font-medium shrink-0">Berat Badan</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 flex-1">{student.kesehatan.beratBadanKg} kg</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1 border-b border-slate-100 dark:border-slate-800/70">
                    <span className="w-full sm:w-48 text-slate-500 dark:text-slate-400 font-medium shrink-0">Lingkar Kepala</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex-1">
                      {student.lingkarKepala ? `${student.lingkarKepala} cm` : '-'}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1 border-b border-slate-100 dark:border-slate-800/70">
                    <span className="w-full sm:w-48 text-slate-500 dark:text-slate-400 font-medium shrink-0">Riwayat Penyakit</span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium flex-1">{student.kesehatan.penyakitPernahDiderita || 'Tidak Ada'}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1">
                    <span className="w-full sm:w-48 text-slate-500 dark:text-slate-400 font-medium shrink-0">Kelainan Jasmani</span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium flex-1">{student.kesehatan.kelainanJasmani || 'Tidak Ada'}</span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80 dark:border-slate-700">
                  <h4 className="text-xs font-black text-blue-900 dark:text-blue-300 uppercase tracking-wider flex items-center gap-2">
                    <Building className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Riwayat Masuk & Pendidikan Asal</span>
                  </h4>
                  {currentRole !== 'umum' && (
                    <button
                      type="button"
                      onClick={() => onEdit(student, 'masuk')}
                      className="px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/60 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                      title="Edit Riwayat Masuk & Pendidikan Asal"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Riwayat</span>
                    </button>
                  )}
                </div>
                <div className="space-y-0.5 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1 border-b border-slate-100 dark:border-slate-800/70">
                    <span className="w-full sm:w-48 text-slate-500 dark:text-slate-400 font-medium shrink-0">Pendidikan Asal (TK/PAUD)</span>
                    <strong className="text-slate-900 dark:text-slate-100 font-bold flex-1">{student.sekolahAsalTK || '-'}</strong>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1 border-b border-slate-100 dark:border-slate-800/70">
                    <span className="w-full sm:w-48 text-slate-500 dark:text-slate-400 font-medium shrink-0">No. Ijazah TK / SKTB</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold flex-1">{student.noIjazahTK || '-'}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1 border-b border-slate-100 dark:border-slate-800/70">
                    <span className="w-full sm:w-48 text-slate-500 dark:text-slate-400 font-medium shrink-0">Tanggal Diterima Masuk</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 flex-1">{formatIndonesianDate(student.tanggalDiterima)}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1 border-b border-slate-100 dark:border-slate-800/70">
                    <span className="w-full sm:w-48 text-slate-500 dark:text-slate-400 font-medium shrink-0">Diterima di Kelas</span>
                    <span className="font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/80 px-2 py-0.5 rounded-md flex-1 w-fit">
                      {(!student.diterimaDiKelas || student.diterimaDiKelas === '7' || student.diterimaDiKelas === '7A' || student.diterimaDiKelas.toLowerCase() === 'kelas 7') ? 'Kelas 1' : student.diterimaDiKelas}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1 border-b border-slate-100 dark:border-slate-800/70">
                    <span className="w-full sm:w-48 text-slate-500 dark:text-slate-400 font-medium shrink-0">Tingkat Kelas Sekarang</span>
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 flex-1">{student.kelasSekarang || 'Kelas 1'}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1 border-b border-slate-100 dark:border-slate-800/70">
                    <span className="w-full sm:w-48 text-slate-500 dark:text-slate-400 font-medium shrink-0">Tahun Ajaran Masuk</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex-1">{student.tahunMasuk || '-'}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-baseline py-2 px-1">
                    <span className="w-full sm:w-48 text-slate-500 dark:text-slate-400 font-medium shrink-0">Status Keaktifan</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 flex-1">{student.status || 'Aktif'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RAPORT */}
          {activeTab === 'raport' && (
            <div className="space-y-6">
              {(!student.raport || student.raport.length === 0) ? (
                <div className="text-center py-12 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30">
                  <BookOpen className="w-10 h-10 mx-auto mb-2 text-slate-400 opacity-60" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Belum ada rekap nilai raport yang diinput untuk siswa ini.</p>
                  <p className="text-[11px] text-slate-400 mt-1">Data nilai semester dapat dimasukkan melalui modul Buku Raport.</p>
                  {currentRole !== 'umum' && (
                    <button
                      onClick={() => onRaport(student)}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Input Nilai Raport Baru</span>
                    </button>
                  )}
                </div>
              ) : (
                student.raport.map((rep, idx) => {
                  const totalNilai = rep.nilai.reduce((acc, curr) => acc + (Number(curr.nilaiAkhir) || 0), 0);
                  const rataRata = rep.nilai.length > 0 ? (totalNilai / rep.nilai.length).toFixed(1) : '0';

                  return (
                    <div key={idx} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-black text-blue-900 dark:text-blue-300 uppercase tracking-wide">
                              Buku Raport Semester {rep.semester} ({rep.kelas})
                            </h4>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                              TP {rep.tahunAjaran}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Peringkat Kelas: <strong className="text-amber-600 dark:text-amber-400 font-extrabold font-mono">#{rep.peringkatKelas || 1}</strong> dari {rep.totalSiswaKelas || 28} siswa
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-extrabold rounded-full border border-emerald-300 dark:border-emerald-800">
                            Status: Tuntas
                          </span>
                        </div>
                      </div>

                      {/* Tabel Nilai yang Dilebarkan */}
                      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                        <table className="w-full text-xs text-left min-w-[700px]">
                          <thead className="bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-[11px] uppercase tracking-wider font-bold">
                            <tr>
                              <th className="py-3 px-3 text-center w-12">No</th>
                              <th className="py-3 px-4 min-w-[240px]">Mata Pelajaran</th>
                              <th className="py-3 px-3 text-center w-24">KKM</th>
                              <th className="py-3 px-3 text-center w-32">Nilai Pengetahuan</th>
                              <th className="py-3 px-3 text-center w-32">Nilai Keterampilan</th>
                              <th className="py-3 px-3 text-center w-32">Nilai Akhir</th>
                              <th className="py-3 px-3 text-center w-24">Predikat</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 bg-white dark:bg-slate-800">
                            {rep.nilai.map((n, i) => (
                              <tr key={i} className="hover:bg-blue-50/40 dark:hover:bg-slate-700/50 transition-colors">
                                <td className="py-2.5 px-3 text-center text-slate-400 font-medium">{i + 1}</td>
                                <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-slate-100">{n.mapel}</td>
                                <td className="py-2.5 px-3 text-center font-mono font-medium text-slate-600 dark:text-slate-400">{n.kkm}</td>
                                <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-800 dark:text-slate-200">{n.pengetahuan}</td>
                                <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-800 dark:text-slate-200">{n.keterampilan}</td>
                                <td className="py-2.5 px-3 text-center font-mono font-black text-sm text-blue-700 dark:text-blue-300">{n.nilaiAkhir}</td>
                                <td className="py-2.5 px-3 text-center font-bold">
                                  <span className={cn(
                                    "px-2 py-0.5 rounded text-[11px] font-extrabold",
                                    n.predikat === 'A' ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' :
                                    n.predikat === 'B' ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800' :
                                    n.predikat === 'C' ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800' :
                                    'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                                  )}>
                                    {n.predikat}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-slate-50 dark:bg-slate-800/90 font-bold border-t-2 border-slate-200 dark:border-slate-700 text-xs">
                            <tr>
                              <td colSpan={2} className="py-3 px-4 text-right uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                Total & Rata-Rata Nilai:
                              </td>
                              <td className="py-3 px-3 text-center text-slate-400 font-mono">-</td>
                              <td colSpan={2} className="py-3 px-3 text-center font-mono text-slate-700 dark:text-slate-300">
                                Jumlah Nilai: <span className="font-extrabold text-slate-900 dark:text-slate-100">{totalNilai}</span>
                              </td>
                              <td className="py-3 px-3 text-center font-mono font-black text-sm text-blue-700 dark:text-blue-300">
                                {rataRata}
                              </td>
                              <td className="py-3 px-3 text-center text-[11px] text-emerald-700 dark:text-emerald-300 uppercase">
                                Tuntas
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      {/* Catatan & Rekapitulasi Kehadiran */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                        <div className="md:col-span-2 p-4 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                          <span className="font-bold text-slate-900 dark:text-slate-100 block text-[11px] uppercase tracking-wide">
                            Catatan & Rekomendasi Wali Kelas:
                          </span>
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed italic">
                            "{rep.catatanWaliKelas || 'Tingkatkan terus prestasi belajar dan kedisiplinan di sekolah.'}"
                          </p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                          <span className="font-bold text-slate-900 dark:text-slate-100 block text-[11px] uppercase tracking-wide">
                            Rekapitulasi Kehadiran:
                          </span>
                          <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300">
                            <span>Sakit (S):</span>
                            <strong className="font-mono text-slate-800 dark:text-slate-100 font-bold">{rep.kehadiran.sakit} hari</strong>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300">
                            <span>Izin (I):</span>
                            <strong className="font-mono text-slate-800 dark:text-slate-100 font-bold">{rep.kehadiran.izin} hari</strong>
                          </div>
                          <div className="flex justify-between py-1 text-slate-600 dark:text-slate-300">
                            <span>Tanpa Keterangan (A):</span>
                            <strong className="font-mono text-rose-600 dark:text-rose-400 font-bold">{rep.kehadiran.tanpaKeterangan} hari</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 5: MUTASI & STTB */}
          {activeTab === 'kelulusan' && (
            <div className="space-y-6">
              {/* MUTASI */}
              <div className="p-5 rounded-2xl border border-orange-200 dark:border-orange-900 bg-orange-50/30 dark:bg-orange-950/20 space-y-4">
                <h4 className="text-xs font-black text-orange-900 dark:text-orange-300 uppercase tracking-wider flex items-center gap-2 border-b border-orange-200/80 dark:border-orange-900 pb-2.5">
                  <UserMinus className="w-4 h-4 text-orange-600" />
                  <span>Catatan Mutasi / Meninggalkan Sekolah (Sheet TINGGALKAN)</span>
                </h4>
                {student.mutasi ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-baseline py-1.5 border-b border-orange-100 dark:border-orange-900/40">
                        <span className="w-full sm:w-44 text-slate-500 dark:text-slate-400 font-medium shrink-0">Tanggal Surat Mutasi</span>
                        <strong className="text-slate-900 dark:text-slate-100 flex-1 font-bold">{formatIndonesianDate(student.mutasi.tglMeninggalkan)}</strong>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-baseline py-1.5 border-b border-orange-100 dark:border-orange-900/40">
                        <span className="w-full sm:w-44 text-slate-500 dark:text-slate-400 font-medium shrink-0">Tingkat / Dari Kelas</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 flex-1">{student.mutasi.dariKelas}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-baseline py-1.5 border-b border-orange-100 dark:border-orange-900/40">
                        <span className="w-full sm:w-44 text-slate-500 dark:text-slate-400 font-medium shrink-0">Sekolah Tujuan</span>
                        <strong className="text-blue-700 dark:text-blue-300 flex-1 font-bold">{student.mutasi.sekolahTujuan}</strong>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-baseline py-1.5 border-b border-orange-100 dark:border-orange-900/40">
                        <span className="w-full sm:w-44 text-slate-500 dark:text-slate-400 font-medium shrink-0">Nomor Surat Pindah</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold flex-1">{student.mutasi.noSuratPindah}</span>
                      </div>
                      {student.mutasi.namaPemohon && (
                        <div className="flex flex-col sm:flex-row sm:items-baseline py-1.5 border-b border-orange-100 dark:border-orange-900/40">
                          <span className="w-full sm:w-44 text-slate-500 dark:text-slate-400 font-medium shrink-0">Pemohon (Ortu/Wali)</span>
                          <span className="font-bold text-slate-900 dark:text-slate-100 flex-1">{student.mutasi.namaPemohon} ({student.mutasi.pekerjaanPemohon || '-'})</span>
                        </div>
                      )}
                      <div className="flex flex-col sm:flex-row sm:items-baseline py-1.5 border-b border-orange-100 dark:border-orange-900/40 md:col-span-2">
                        <span className="w-full sm:w-44 text-slate-500 dark:text-slate-400 font-medium shrink-0">Dengan Alasan</span>
                        <span className="text-slate-800 dark:text-slate-200 font-medium flex-1">{student.mutasi.alasanPindah}</span>
                      </div>
                    </div>

                    {/* Lampiran Scan Ijazah / Dokumen Mutasi */}
                    <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-orange-200 dark:border-orange-900/60 flex flex-col sm:flex-row items-center justify-between gap-3">
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
              <div className="p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-4">
                <h4 className="text-xs font-black text-emerald-900 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-2 border-b border-emerald-200/80 dark:border-emerald-900 pb-2.5">
                  <GraduationCap className="w-4 h-4 text-emerald-600" />
                  <span>STTB / Ijazah & Serah Terima Dokumen (Sheet STTB)</span>
                </h4>
                {student.sttb ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-baseline py-1.5 border-b border-emerald-100 dark:border-emerald-900/40">
                        <span className="w-full sm:w-44 text-slate-500 dark:text-slate-400 font-medium shrink-0">No. Seri Ijazah</span>
                        <strong className="font-mono text-blue-700 dark:text-blue-300 flex-1 font-bold">{student.sttb.noIjazah || '-'}</strong>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-baseline py-1.5 border-b border-emerald-100 dark:border-emerald-900/40">
                        <span className="w-full sm:w-44 text-slate-500 dark:text-slate-400 font-medium shrink-0">No. SKHU</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200 flex-1">{student.sttb.noSkhu || '-'}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-baseline py-1.5 border-b border-emerald-100 dark:border-emerald-900/40">
                        <span className="w-full sm:w-44 text-slate-500 dark:text-slate-400 font-medium shrink-0">No. Peserta UN</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200 flex-1">{student.sttb.noPesertaUN || '-'}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-baseline py-1.5 border-b border-emerald-100 dark:border-emerald-900/40">
                        <span className="w-full sm:w-44 text-slate-500 dark:text-slate-400 font-medium shrink-0">Tanggal Kelulusan</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100 flex-1">{formatIndonesianDate(student.sttb.tanggalKelulusan)}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-baseline py-1.5 border-b border-emerald-100 dark:border-emerald-900/40">
                        <span className="w-full sm:w-44 text-slate-500 dark:text-slate-400 font-medium shrink-0">Melanjutkan Ke</span>
                        <strong className="text-slate-900 dark:text-slate-100 flex-1 font-bold">{student.sttb.melanjutkanKe || '-'}</strong>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-baseline py-1.5 border-b border-emerald-100 dark:border-emerald-900/40">
                        <span className="w-full sm:w-44 text-slate-500 dark:text-slate-400 font-medium shrink-0">Status Tanda Terima</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[11px] w-fit">
                          {student.sttb.statusTandaTerima || 'Sudah Diterima'}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-baseline py-1.5 border-b border-emerald-100 dark:border-emerald-900/40">
                        <span className="w-full sm:w-44 text-slate-500 dark:text-slate-400 font-medium shrink-0">Tanggal Serah Terima</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 flex-1">{formatIndonesianDate(student.sttb.tglSerahTerima)}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-baseline py-1.5 border-b border-emerald-100 dark:border-emerald-900/40">
                        <span className="w-full sm:w-44 text-slate-500 dark:text-slate-400 font-medium shrink-0">Nama Penerima & Hubungan</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100 flex-1">{student.sttb.namaPenerima || '-'} ({student.sttb.hubunganPenerima || 'Siswa'})</span>
                      </div>
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

          {/* TAB 6: RIWAYAT BANTUAN */}
          {activeTab === 'riwayat_bantuan' && (
            <div className="space-y-6">
              {/* Header Banner Status Bantuan */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-amber-50/60 via-white to-blue-50/40 dark:from-slate-800/60 dark:via-slate-900 dark:to-slate-800/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800">
                    <HandCoins className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                        Riwayat & Penyaluran Bantuan Siswa
                      </h3>
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
                        isPenerimaBantuan
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                      )}>
                        {isPenerimaBantuan ? "Penerima Bantuan Aktif" : "Bukan Penerima Bantuan"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Dokumentasi historis penyaluran Program Indonesia Pintar (PIP), Baznas, Bantuan Sekolah, dan program sosial lainnya.
                    </p>
                  </div>
                </div>

                {currentRole !== 'umum' && (
                  <button
                    type="button"
                    onClick={() => onEdit(student, 'bantuan')}
                    className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer self-start sm:self-auto"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Perbarui Data Bantuan</span>
                  </button>
                )}
              </div>

              {/* Data Bantuan Berjalan / Terdaftar */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1.5 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    Jenis Bantuan
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {activeAssistanceTypes.length > 0 ? (
                      activeAssistanceTypes.map((jenis, idx) => (
                        <span 
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                        >
                          {jenis}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs font-semibold text-slate-400">Tidak ada bantuan aktif</span>
                    )}
                    {student.bantuanLainnya && (
                      <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        {student.bantuanLainnya}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                    Tahap & Termin
                  </span>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {student.tahapBantuan || (isPenerimaBantuan ? 'Tahap 1' : '-')}
                  </p>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Tahun Pelajaran: {student.tahunBantuan || schoolProfile?.tahunPelajaranAktif || '2026/2027'}
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-500" />
                    Tanggal Menerima
                  </span>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {student.tanggalMenerimaBantuan 
                      ? formatIndonesianDate(student.tanggalMenerimaBantuan)
                      : (isPenerimaBantuan ? 'Belum Tercatat' : '-')}
                  </p>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Status: {student.tanggalMenerimaBantuan ? 'Sudah Disalurkan' : (isPenerimaBantuan ? 'Menunggu Penyaluran' : '-')}
                  </span>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1.5 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-purple-500" />
                    Nominal Bantuan
                  </span>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {student.nominalBantuan || (isPenerimaBantuan ? 'Sesuai Ketentuan' : '-')}
                  </p>
                  <span className="text-[10px] text-slate-400 block mt-0.5 truncate" title={student.keteranganBantuan || 'Tidak ada SK'}>
                    SK: {student.keteranganBantuan || 'Reguler'}
                  </span>
                </div>
              </div>

              {/* Data Dapodik & Perbankan Penyaluran */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Identitas Kartu Sosial */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <FileCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Identitas Kartu Bantuan Sosial (Dapodik)</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="text-slate-500">Penerima KIP (Kartu Indonesia Pintar):</span>
                      <strong className={student.penerimaKip?.toLowerCase() === 'ya' ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"}>
                        {student.penerimaKip || 'Tidak'}
                      </strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="text-slate-500">Nomor KIP:</span>
                      <strong className="font-mono text-slate-800 dark:text-slate-200">{student.nomorKip || '-'}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="text-slate-500">Nama Tertera di KIP:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{student.namaDiKip || student.namaLengkap}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="text-slate-500">Status Kelayakan PIP:</span>
                      <strong className={student.layakPip?.toLowerCase() === 'ya' ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"}>
                        {student.layakPip || 'Tidak'}
                      </strong>
                    </div>
                    {student.alasanLayakPip && (
                      <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                        <span className="text-slate-500">Alasan Layak PIP:</span>
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{student.alasanLayakPip}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="text-slate-500">Penerima KPS / PKH:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{student.penerimaKps || 'Tidak'} {student.noKps ? `(No: ${student.noKps})` : ''}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Nomor KKS:</span>
                      <strong className="font-mono text-slate-800 dark:text-slate-200">{student.nomorKks || '-'}</strong>
                    </div>
                  </div>
                </div>

                {/* Rekening Penyaluran Perbankan */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <Landmark className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Rekening Penyaluran Bantuan / Bank Siswa</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="text-slate-500">Bank Penyalur:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{student.bank || 'Bank Rakyat Indonesia (BRI)'}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="text-slate-500">Nomor Rekening Bank:</span>
                      <strong className="font-mono text-blue-700 dark:text-blue-300 font-bold">{student.nomorRekeningBank || '-'}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="text-slate-500">Rekening Atas Nama:</span>
                      <strong className="text-slate-800 dark:text-slate-200">{student.rekeningAtasNama || student.namaLengkap}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="text-slate-500">Jenis Tabungan:</span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">Simpanan Pelajar (SimPel) / Penyaluran Bansos</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 mt-2">
                      <span className="text-[11px] text-slate-500 block mb-0.5">Catatan / No. SK Penetapan Bantuan:</span>
                      <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                        {student.keteranganBantuan || 'Belum ada SK penetapan khusus yang dicatat.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabel Historis Penyaluran & Catatan Mutasi Bantuan */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Daftar Historis Penerimaan Bantuan & Catatan Terkait</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Buku Induk Siswa Resmi
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                        <th className="py-2.5 px-3 font-bold">Periode / Tanggal</th>
                        <th className="py-2.5 px-3 font-bold">Program / Bantuan</th>
                        <th className="py-2.5 px-3 font-bold">Tahap</th>
                        <th className="py-2.5 px-3 font-bold">Nominal</th>
                        <th className="py-2.5 px-3 font-bold">Keterangan / Dasar Pencatatan</th>
                        <th className="py-2.5 px-3 font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {isPenerimaBantuan ? (
                        <>
                          {/* Record Bantuan Aktif dari riwayatBantuan jika tersedia */}
                          {student.riwayatBantuan && student.riwayatBantuan.length > 0 ? (
                            student.riwayatBantuan.map((r) => (
                              <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="py-2.5 px-3 font-mono font-medium text-slate-800 dark:text-slate-200">
                                  {r.tanggalMenerima 
                                    ? formatIndonesianDate(r.tanggalMenerima)
                                    : (r.tahunPelajaran || 'TP Aktif')}
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 flex-wrap">
                                    <span>{r.jenis}</span>
                                    {r.bantuanLainnya && (
                                      <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">({r.bantuanLainnya})</span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">
                                  {r.tahap || 'Tahap 1'}
                                </td>
                                <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                                  {r.nominal || 'Rp 450.000'}
                                </td>
                                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 max-w-xs truncate" title={r.keterangan || 'Tercatat di Buku Induk'}>
                                  {r.keterangan || 'Tercatat resmi dalam penetapan penerima bantuan'}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className={cn(
                                    "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold",
                                    r.statusPencairan === 'Sudah Cair'
                                      ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                                      : r.statusPencairan === 'Dalam Proses'
                                      ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                  )}>
                                    <CheckCircle className="w-3 h-3" />
                                    {r.statusPencairan || 'Tersalurkan'}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="py-2.5 px-3 font-mono font-medium text-slate-800 dark:text-slate-200">
                                {student.tanggalMenerimaBantuan 
                                  ? formatIndonesianDate(student.tanggalMenerimaBantuan)
                                  : (student.tahunBantuan || '2026/2027')}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="font-bold text-slate-900 dark:text-slate-100">
                                  {activeAssistanceTypes.join(', ') || student.penerimaBantuan || 'Bantuan Pendidikan'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">
                                {student.tahapBantuan || 'Tahap 1'}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">
                                {student.nominalBantuan || 'Rp 450.000'}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 max-w-xs truncate" title={student.keteranganBantuan || 'Tercatat di Buku Induk'}>
                                {student.keteranganBantuan || 'Tercatat resmi dalam penetapan penerima bantuan'}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                  <CheckCircle className="w-3 h-3" />
                                  Tersalurkan
                                </span>
                              </td>
                            </tr>
                          )}

                          {/* Catatan dari Mutasi jika ada */}
                          {student.mutasi && (
                            <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors bg-blue-50/20 dark:bg-blue-950/10">
                              <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300">
                                {student.mutasi.tanggalMutasi ? formatIndonesianDate(student.mutasi.tanggalMutasi) : '-'}
                              </td>
                              <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                                Mutasi Siswa ({student.mutasi.jenisMutasi})
                              </td>
                              <td className="py-2.5 px-3 text-slate-500">
                                Kelas {student.mutasi.kelasTujuan || student.kelasSekarang}
                              </td>
                              <td className="py-2.5 px-3 text-slate-500">-</td>
                              <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                                {student.mutasi.alasanPindah || student.mutasi.sekolahTujuan || 'Catatan mutasi berkas & bantuan siswa'}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                                  Tercatat
                                </span>
                              </td>
                            </tr>
                          )}
                        </>
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-slate-500">
                            <HandCoins className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            <p className="font-semibold text-xs">Belum ada catatan historis bantuan untuk siswa ini.</p>
                            <p className="text-[11px] mt-1 text-slate-400">
                              Klik tombol "Perbarui Data Bantuan" di atas untuk menambahkan bantuan PIP, Baznas, Bantuan Sekolah, atau Bantuan Desa.
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Riwayat Log Sistem Terkait Bantuan Siswa */}
              {aidLogs.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span>Audit Trail / Log Perubahan Data Bantuan Siswa</span>
                  </h5>
                  <div className="space-y-1.5">
                    {aidLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              {log.action}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {log.user}
                            </span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300">
                            {log.description}
                          </p>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono shrink-0">
                          {log.timestamp}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: RIWAYAT & AUDIT LOG */}
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
