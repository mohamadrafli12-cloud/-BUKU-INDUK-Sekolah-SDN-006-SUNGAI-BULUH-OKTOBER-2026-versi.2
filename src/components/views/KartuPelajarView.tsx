import React, { useState } from 'react';
import { 
  CreditCard, 
  Printer, 
  ArrowLeft, 
  Palette, 
  Layers, 
  Camera,
  Upload
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { formatIndonesianDate, cn } from '../../lib/utils';
import { Student } from '../../types';
import { 
  TutWuriHandayaniSDLogo, 
  OfficialNationalLogo 
} from '../../utils/logoHelper';
import { EditLogoModal } from '../modals/EditLogoModal';
import { CameraCaptureModal } from '../modals/CameraCaptureModal';

interface KartuPelajarViewProps {
  selectedStudentId?: string;
  onBack: () => void;
  onSelectStudentDetail?: (studentId: string) => void;
  setActiveTab?: (tab: any) => void;
}

type CardTheme = 'kemdikbud-blue' | 'merah-putih' | 'merdeka-green' | 'royal-navy';
type CardSide = 'front' | 'back' | 'both';

/**
 * Robust Logo Kiri renderer for Kartu Tanda Peserta (matching Kop Surat Header)
 */
const CardLogoKiri: React.FC<{
  logoKiriUrl?: string;
  logoUrl?: string;
  className?: string;
}> = ({ logoKiriUrl, logoUrl, className = "w-full h-full" }) => {
  const [loadError, setLoadError] = useState(false);
  const rawSource = (logoKiriUrl || logoUrl || '').trim();

  // If empty or failed to load, fallback to standard Tut Wuri SD logo
  if (!rawSource || loadError) {
    return <TutWuriHandayaniSDLogo className={className} />;
  }

  // If preset ID
  if (rawSource.startsWith('preset:')) {
    return <OfficialNationalLogo logoIdOrUrl={rawSource} className={className} />;
  }

  return (
    <img
      src={rawSource}
      alt="Logo Kiri (Kop Surat)"
      className={`${className} object-contain`}
      referrerPolicy="no-referrer"
      onError={() => setLoadError(true)}
    />
  );
};

/**
 * Robust Logo Kanan renderer for Kartu Tanda Peserta (matching Kop Surat Header)
 */
const CardLogoKanan: React.FC<{
  logoKananUrl?: string;
  tutWuriLogoUrl?: string;
  className?: string;
}> = ({ logoKananUrl, tutWuriLogoUrl, className = "w-full h-full" }) => {
  const [loadError, setLoadError] = useState(false);
  const rawSource = (logoKananUrl || tutWuriLogoUrl || 'preset:tut-wuri-sd').trim();

  if (loadError) {
    return <TutWuriHandayaniSDLogo className={className} />;
  }

  if (rawSource.startsWith('preset:')) {
    return <OfficialNationalLogo logoIdOrUrl={rawSource} className={className} />;
  }

  return (
    <img
      src={rawSource}
      alt="Logo Kanan (Kop Surat)"
      className={`${className} object-contain`}
      referrerPolicy="no-referrer"
      onError={() => setLoadError(true)}
    />
  );
};

export const KartuPelajarView: React.FC<KartuPelajarViewProps> = ({
  selectedStudentId,
  onBack,
  onSelectStudentDetail,
  setActiveTab,
}) => {
  const { students, schoolProfile, updateStudent, currentRole } = useSchool();
  const [activeStudentId, setActiveStudentId] = useState<string>(
    selectedStudentId || (students[0]?.id ?? '')
  );
  const [printMode, setPrintMode] = useState<'single' | 'all'>('single');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [cardTheme, setCardTheme] = useState<CardTheme>('kemdikbud-blue');
  const [cardSide, setCardSide] = useState<CardSide>('front');
  const [isEditLogoModalOpen, setIsEditLogoModalOpen] = useState(false);
  const [cameraStudent, setCameraStudent] = useState<Student | null>(null);

  // Hidden photo upload ref for current active student
  const photoInputRef = React.useRef<HTMLInputElement>(null);

  const student = students.find((s) => s.id === activeStudentId) || students[0];

  const studentsToPrint = printMode === 'single'
    ? (student ? [student] : [])
    : students.filter(s => (selectedClass === 'ALL' || s.kelasSekarang === selectedClass) && s.status === 'Aktif');

  const handlePrint = () => {
    window.print();
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, targetStudentId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const targetStudent = students.find(s => s.id === targetStudentId);
      if (targetStudent) {
        updateStudent({
          ...targetStudent,
          fotoUrl: dataUrl
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Theme styling definitions
  const themeStyles: Record<CardTheme, {
    headerBg: string;
    headerBorder: string;
    headerText: string;
    subText: string;
    badgeBg: string;
    badgeText: string;
    accentColor: string;
    cardBorder: string;
    footerBg: string;
  }> = {
    'kemdikbud-blue': {
      headerBg: 'bg-linear-to-r from-[#002266] via-[#003399] to-[#0047BA]',
      headerBorder: 'border-b-2 border-amber-400',
      headerText: 'text-white',
      subText: 'text-amber-300',
      badgeBg: 'bg-amber-400 text-slate-950',
      badgeText: 'text-slate-950',
      accentColor: 'text-[#003399]',
      cardBorder: 'border-slate-800',
      footerBg: 'bg-slate-100 border-slate-300',
    },
    'merah-putih': {
      headerBg: 'bg-linear-to-r from-red-700 via-rose-700 to-red-800',
      headerBorder: 'border-b-2 border-white',
      headerText: 'text-white',
      subText: 'text-red-100',
      badgeBg: 'bg-white text-red-700 shadow-xs',
      badgeText: 'text-red-700',
      accentColor: 'text-red-700',
      cardBorder: 'border-red-900',
      footerBg: 'bg-rose-50/80 border-rose-200',
    },
    'merdeka-green': {
      headerBg: 'bg-linear-to-r from-emerald-800 via-teal-700 to-emerald-900',
      headerBorder: 'border-b-2 border-emerald-300',
      headerText: 'text-white',
      subText: 'text-emerald-200',
      badgeBg: 'bg-emerald-300 text-slate-950',
      badgeText: 'text-slate-950',
      accentColor: 'text-emerald-800',
      cardBorder: 'border-teal-900',
      footerBg: 'bg-emerald-50/60 border-emerald-200',
    },
    'royal-navy': {
      headerBg: 'bg-linear-to-r from-slate-950 via-slate-900 to-blue-950',
      headerBorder: 'border-b-2 border-amber-500',
      headerText: 'text-white',
      subText: 'text-amber-400',
      badgeBg: 'bg-amber-500 text-slate-950',
      badgeText: 'text-slate-950',
      accentColor: 'text-slate-900',
      cardBorder: 'border-slate-900',
      footerBg: 'bg-slate-100 border-slate-300',
    },
  };

  const currentTheme = themeStyles[cardTheme];

  // Helper to render National logo (matching Kop Surat Logo Kanan / Tut Wuri)
  const renderTutWuriLogo = (sizeClass = "w-7 h-7") => {
    const logoSource = schoolProfile.logoKananUrl || schoolProfile.tutWuriLogoUrl || 'preset:tut-wuri-sd';
    return <OfficialNationalLogo logoIdOrUrl={logoSource} className={sizeClass} />;
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Hidden file input for photo upload */}
      <input
        type="file"
        ref={photoInputRef}
        onChange={(e) => student && handlePhotoUpload(e, student.id)}
        accept="image/*"
        className="hidden"
      />

      {/* Control Bar */}
      <div className="no-print p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        
        {/* Top Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>

            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#003399] dark:text-blue-400" />
                <span>Kartu Tanda Peserta Didik (ID Pelajar Resmi)</span>
              </h2>
              <p className="text-xs text-slate-500">
                Format standar ID-1 (85.6 × 53.98 mm) dilengkapi Lambang Tut Wuri Handayani SD di kanan atas & barcode nomor induk
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditLogoModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              title="Ganti / Edit Logo Sekolah & Lambang Tut Wuri Handayani SD"
            >
              <div className="w-4 h-4 rounded-full flex items-center justify-center">
                {renderTutWuriLogo("w-4 h-4")}
              </div>
              <span>Edit Logo / Tut Wuri</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#003399] hover:bg-[#002266] text-white text-xs font-extrabold rounded-xl shadow-md transition-all transform active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>CETAK KARTU ({studentsToPrint.length} SISWA)</span>
            </button>
          </div>
        </div>

        {/* Secondary Filter & Customizer Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          
          {/* Print Mode & Selector */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
              <span>Mode:</span>
              <select
                value={printMode}
                onChange={(e) => setPrintMode(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-blue-700 dark:text-blue-300"
              >
                <option value="single">1 Siswa Terpilih</option>
                <option value="all">Cetak Batch Seluruh Kelas (A4)</option>
              </select>
            </div>

            {printMode === 'single' ? (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Pilih:</span>
                <select
                  value={activeStudentId}
                  onChange={(e) => setActiveStudentId(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold max-w-[220px] truncate"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.noInduk} - {s.namaLengkap} ({s.kelasSekarang})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Filter:</span>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                >
                  <option value="ALL">Semua Siswa Aktif ({students.filter(s => s.status === 'Aktif').length})</option>
                  <option value="Kelas 1">Kelas 1</option>
                  <option value="Kelas 2">Kelas 2</option>
                  <option value="Kelas 3">Kelas 3</option>
                  <option value="Kelas 4">Kelas 4</option>
                  <option value="Kelas 5">Kelas 5</option>
                  <option value="Kelas 6">Kelas 6</option>
                </select>
              </div>
            )}
          </div>

          {/* Theme Selector & Side View Mode */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Theme Picker */}
            <div className="flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-bold text-slate-700 dark:text-slate-300">Tema Kartu:</span>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setCardTheme('kemdikbud-blue')}
                  className={cn(
                    "px-2 py-1 rounded-lg font-bold text-[11px] transition-all",
                    cardTheme === 'kemdikbud-blue' ? "bg-[#003399] text-white shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  )}
                  title="Biru Merdeka Kemdikbud"
                >
                  Biru SD
                </button>
                <button
                  type="button"
                  onClick={() => setCardTheme('merah-putih')}
                  className={cn(
                    "px-2 py-1 rounded-lg font-bold text-[11px] transition-all",
                    cardTheme === 'merah-putih' ? "bg-red-700 text-white shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  )}
                  title="Merah Putih SD Nasional"
                >
                  Merah Putih
                </button>
                <button
                  type="button"
                  onClick={() => setCardTheme('merdeka-green')}
                  className={cn(
                    "px-2 py-1 rounded-lg font-bold text-[11px] transition-all",
                    cardTheme === 'merdeka-green' ? "bg-emerald-700 text-white shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  )}
                  title="Emerald Merdeka Belajar"
                >
                  Emerald
                </button>
                <button
                  type="button"
                  onClick={() => setCardTheme('royal-navy')}
                  className={cn(
                    "px-2 py-1 rounded-lg font-bold text-[11px] transition-all",
                    cardTheme === 'royal-navy' ? "bg-slate-900 text-amber-300 shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  )}
                  title="Royal Navy Gold"
                >
                  Royal Navy
                </button>
              </div>
            </div>

            {/* Side Mode: Front / Back / Both */}
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-bold text-slate-700 dark:text-slate-300">Sisi:</span>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setCardSide('front')}
                  className={cn(
                    "px-2 py-1 rounded-lg font-bold text-[11px] transition-all",
                    cardSide === 'front' ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs" : "text-slate-600 dark:text-slate-400"
                  )}
                >
                  Depan
                </button>
                <button
                  type="button"
                  onClick={() => setCardSide('back')}
                  className={cn(
                    "px-2 py-1 rounded-lg font-bold text-[11px] transition-all",
                    cardSide === 'back' ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs" : "text-slate-600 dark:text-slate-400"
                  )}
                >
                  Belakang
                </button>
                <button
                  type="button"
                  onClick={() => setCardSide('both')}
                  className={cn(
                    "px-2 py-1 rounded-lg font-bold text-[11px] transition-all",
                    cardSide === 'both' ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs" : "text-slate-600 dark:text-slate-400"
                  )}
                >
                  Dua Sisi
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Grid / Stage of Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2 print:gap-4 max-w-5xl mx-auto items-start justify-items-center">
        {studentsToPrint.map((s) => (
          <React.Fragment key={s.id}>
            
            {/* FRONT SIDE */}
            {(cardSide === 'front' || cardSide === 'both') && (
              <div
                className={cn(
                  "relative bg-white text-slate-900 rounded-2xl shadow-xl overflow-hidden flex flex-col justify-between print:shadow-none print:break-inside-avoid transition-all border-2",
                  currentTheme.cardBorder
                )}
                style={{ width: '85.6mm', height: '53.98mm' }}
              >
                {/* Subtle Background Watermark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none">
                  {renderTutWuriLogo("w-44 h-44")}
                </div>

                {/* Top Ribbon Header */}
                <div className={cn("px-2.5 py-1.5 flex items-center justify-between text-white shadow-xs relative z-10", currentTheme.headerBg, currentTheme.headerBorder)}>
                  {/* Left: School Crest / Logo Kiri (Diselaraskan 100% dengan Logo Kiri Kop Surat) */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div 
                      className="w-7.5 h-7.5 rounded-md bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-xs border border-white/60 p-0.5"
                      title="Logo Sebelah Kiri Kop Surat"
                    >
                      <CardLogoKiri
                        logoKiriUrl={schoolProfile.logoKiriUrl}
                        logoUrl={schoolProfile.logoUrl}
                        className="w-full h-full"
                      />
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-[8px] font-extrabold tracking-wide uppercase leading-tight truncate">
                        KARTU TANDA PESERTA DIDIK
                      </h4>
                      <p className={cn("text-[7px] font-black uppercase leading-tight truncate tracking-tight", currentTheme.subText)}>
                        {schoolProfile.namaSekolah}
                      </p>
                      <p className="text-[6px] text-slate-200 leading-none truncate opacity-90">
                        NPSN: {schoolProfile.npsn} • NSS: {schoolProfile.nss}
                      </p>
                    </div>
                  </div>

                  {/* Right: OFFICIAL TUT WURI / LOGO KANAN KOP SURAT & CLASS BADGE */}
                  <div className="flex items-center gap-1.5 shrink-0 pl-1">
                    <div className="flex flex-col items-end">
                      <span className={cn("text-[7.5px] font-mono font-black px-1.5 py-0.5 rounded shadow-xs leading-tight uppercase", currentTheme.badgeBg)}>
                        {s.kelasSekarang}
                      </span>
                    </div>
                    {/* Logo Kanan Kop Surat in Top Right */}
                    <div 
                      className="w-7.5 h-7.5 rounded-md bg-white flex items-center justify-center p-0.5 shadow-xs border border-amber-300/80 overflow-hidden"
                      title="Logo Sebelah Kanan Kop Surat"
                    >
                      <CardLogoKanan
                        logoKananUrl={schoolProfile.logoKananUrl}
                        tutWuriLogoUrl={schoolProfile.tutWuriLogoUrl}
                        className="w-full h-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Middle Identity Section */}
                <div className="px-2.5 py-1.5 flex gap-2.5 flex-1 items-center relative z-10">
                  {/* Student Photo */}
                  <div className="relative group shrink-0">
                    <div className="w-[18mm] h-[24mm] border-2 border-slate-700 rounded-lg bg-linear-to-b from-blue-100 to-blue-200 dark:from-slate-200 dark:to-slate-300 flex items-center justify-center overflow-hidden shadow-xs relative">
                      {s.fotoUrl ? (
                        <img src={s.fotoUrl} alt={s.namaLengkap} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-600">
                          <span className="text-base font-black">{s.namaLengkap.charAt(0)}</span>
                          <span className="text-[6px] font-bold uppercase">{s.jenisKelamin === 'L' ? 'Laki-Laki' : 'Perempuan'}</span>
                        </div>
                      )}

                      {/* Gold Corner Badge */}
                      <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-amber-400 flex items-center justify-center rounded-bl-sm">
                        <span className="text-[5px] font-black text-slate-950">✓</span>
                      </div>
                    </div>

                    {/* Quick photo change trigger (no print) */}
                    {currentRole !== 'umum' && (
                      <div className="no-print absolute inset-0 bg-slate-900/80 opacity-0 group-hover:opacity-100 rounded-lg flex flex-col items-center justify-center gap-1 text-white transition-opacity p-1">
                        <button
                          type="button"
                          onClick={() => setCameraStudent(s)}
                          className="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[7px] font-bold flex items-center gap-0.5 cursor-pointer w-full justify-center"
                          title="Ambil pasfoto siswa menggunakan kamera"
                        >
                          <Camera className="w-2.5 h-2.5 text-amber-300" />
                          <span>Kamera</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveStudentId(s.id);
                            photoInputRef.current?.click();
                          }}
                          className="px-1.5 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[7px] font-bold flex items-center gap-0.5 cursor-pointer w-full justify-center"
                          title="Unggah pasfoto siswa dari berkas"
                        >
                          <Upload className="w-2.5 h-2.5" />
                          <span>Unggah</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Student Data Fields */}
                  <div className="flex-1 space-y-0.5 text-[8px] leading-tight min-w-0">
                    <div className="font-extrabold text-[9.5px] text-slate-950 truncate tracking-tight pb-0.5 border-b border-slate-200">
                      {s.namaLengkap}
                    </div>

                    <div className="grid grid-cols-7 gap-0.5 pt-0.5">
                      <span className="col-span-2 text-slate-500 font-medium">NIS / NISN</span>
                      <span className="col-span-5 font-mono font-bold text-slate-900 truncate">
                        {s.noInduk} / {s.nisn}
                      </span>
                    </div>

                    <div className="grid grid-cols-7 gap-0.5">
                      <span className="col-span-2 text-slate-500 font-medium">TTL</span>
                      <span className="col-span-5 truncate text-slate-800">
                        {s.tempatLahir}, {formatIndonesianDate(s.tanggalLahir)}
                      </span>
                    </div>

                    <div className="grid grid-cols-7 gap-0.5">
                      <span className="col-span-2 text-slate-500 font-medium">JK / Goldar</span>
                      <span className="col-span-5 text-slate-800">
                        {s.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'} • Gol. {s.kesehatan?.golonganDarah || '-'}
                      </span>
                    </div>

                    <div className="grid grid-cols-7 gap-0.5">
                      <span className="col-span-2 text-slate-500 font-medium">Alamat</span>
                      <span className="col-span-5 truncate text-slate-800">
                        {s.kelurahanDesa}, {s.kecamatan}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Footer Bar */}
                <div className={cn("px-2.5 py-1 flex items-center justify-between text-[6.5px] border-t relative z-10", currentTheme.footerBg)}>
                  {/* Left: Barcode NISN */}
                  <div className="flex flex-col items-start leading-tight">
                    <div className="flex items-center gap-0.5 h-2.5 bg-slate-900 px-1 py-0.5 rounded-xs">
                      <div className="w-0.5 h-full bg-white"></div>
                      <div className="w-1 h-full bg-white"></div>
                      <div className="w-0.5 h-full bg-white"></div>
                      <div className="w-1.5 h-full bg-white"></div>
                      <div className="w-0.5 h-full bg-white"></div>
                      <div className="w-1 h-full bg-white"></div>
                      <div className="w-0.5 h-full bg-white"></div>
                      <div className="w-1.5 h-full bg-white"></div>
                      <div className="w-0.5 h-full bg-white"></div>
                    </div>
                    <span className="font-mono text-[5.5px] font-bold text-slate-800 mt-0.5 tracking-wider">
                      NISN: {s.nisn}
                    </span>
                  </div>

                  {/* Right: Signature and Stempel */}
                  <div className="text-right leading-tight flex items-center gap-1.5">
                    {schoolProfile.stempelUrl && (
                      <div className="w-5 h-5 opacity-80 shrink-0">
                        <img src={schoolProfile.stempelUrl} alt="Cap" className="w-full h-full object-contain" />
                      </div>
                    )}
                    <div>
                      <div className="text-[5.5px] text-slate-500 uppercase">Kepala Sekolah</div>
                      <div className="font-bold text-slate-950 underline leading-none truncate max-w-[110px]">
                        {schoolProfile.namaKepalaSekolah}
                      </div>
                      <div className="text-[5.5px] font-mono text-slate-600 leading-none">
                        NIP: {schoolProfile.nipKepalaSekolah}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* BACK SIDE */}
            {(cardSide === 'back' || cardSide === 'both') && (
              <div
                className={cn(
                  "relative bg-white text-slate-900 rounded-2xl shadow-xl overflow-hidden flex flex-col justify-between print:shadow-none print:break-inside-avoid transition-all border-2 p-2.5",
                  currentTheme.cardBorder
                )}
                style={{ width: '85.6mm', height: '53.98mm' }}
              >
                {/* Background Watermark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                  {renderTutWuriLogo("w-44 h-44")}
                </div>

                {/* Back Header */}
                <div className="text-center border-b border-slate-300 pb-1">
                  <div className="text-[8px] font-extrabold uppercase text-slate-900 tracking-wider">
                    KETENTUAN KARTU TANDA PESERTA DIDIK
                  </div>
                  <div className="text-[6.5px] font-bold text-blue-900 uppercase">
                    {schoolProfile.namaSekolah}
                  </div>
                </div>

                {/* Terms / Rules of Conduct */}
                <div className="space-y-1 text-[6.5px] leading-tight text-slate-700 my-1">
                  <div className="flex items-start gap-1">
                    <span className="font-bold">1.</span>
                    <span>Kartu ini merupakan tanda bukti sah sebagai Peserta Didik di {schoolProfile.namaSekolah}.</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="font-bold">2.</span>
                    <span>Wajib dibawa setiap hari saat mengikuti kegiatan belajar mengajar dan ekstrakurikuler.</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="font-bold">3.</span>
                    <span>Dapat digunakan untuk layanan peminjaman buku Perpustakaan Sekolah.</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="font-bold">4.</span>
                    <span>Apabila kartu ini hilang atau rusak, segera melapor kepada Bagian Tata Usaha (TU).</span>
                  </div>
                </div>

                {/* School Address & Barcode info */}
                <div className="pt-1 border-t border-slate-200 flex items-center justify-between text-[6px] text-slate-600 gap-1.5">
                  <div className="leading-tight max-w-[150px]">
                    <div className="font-bold text-slate-900 truncate">{schoolProfile.alamatJalan || schoolProfile.alamatSekolah}</div>
                    <div>Desa {schoolProfile.desaKelurahan || schoolProfile.desa}, Kec. {schoolProfile.kecamatan}</div>
                    <div>Telp: {schoolProfile.telepon} • Web: {schoolProfile.website}</div>
                  </div>

                  {/* Simulated Code128 Barcode */}
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-0.5 h-3 bg-slate-900 px-1.5 py-0.5 rounded-xs">
                      <div className="w-0.5 h-full bg-white"></div>
                      <div className="w-1 h-full bg-white"></div>
                      <div className="w-0.5 h-full bg-white"></div>
                      <div className="w-1.5 h-full bg-white"></div>
                      <div className="w-0.5 h-full bg-white"></div>
                      <div className="w-1 h-full bg-white"></div>
                      <div className="w-0.5 h-full bg-white"></div>
                      <div className="w-1.5 h-full bg-white"></div>
                      <div className="w-0.5 h-full bg-white"></div>
                    </div>
                    <span className="font-mono text-[5.5px] font-bold text-slate-800 mt-0.5">
                      *{s.noInduk}*
                    </span>
                  </div>
                </div>

              </div>
            )}

          </React.Fragment>
        ))}
      </div>

      {/* Edit Logo Modal */}
      <EditLogoModal
        isOpen={isEditLogoModalOpen}
        onClose={() => setIsEditLogoModalOpen(false)}
      />

      {/* Camera Capture Modal for Student Card */}
      {cameraStudent && (
        <CameraCaptureModal
          isOpen={Boolean(cameraStudent)}
          onClose={() => setCameraStudent(null)}
          onCapture={(photoDataUrl) => {
            updateStudent({
              ...cameraStudent,
              fotoUrl: photoDataUrl
            });
            setCameraStudent(null);
          }}
          title="Ambil Pasfoto Kartu Pelajar"
          studentName={cameraStudent.namaLengkap}
        />
      )}
    </div>
  );
};
