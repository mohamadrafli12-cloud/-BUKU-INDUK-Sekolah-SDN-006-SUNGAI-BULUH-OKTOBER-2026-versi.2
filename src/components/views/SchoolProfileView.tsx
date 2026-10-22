import React, { useState } from 'react';
import { 
  Building2, 
  Save, 
  Download, 
  Upload, 
  RotateCcw, 
  CheckCircle2, 
  School, 
  MapPin, 
  UserCheck, 
  Globe,
  Mail,
  Phone,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  Image as ImageIcon,
  Award,
  Sparkles,
  BookOpen,
  CreditCard,
  FileText,
  Calendar,
  Layers,
  HelpCircle,
  Check,
  FileSpreadsheet,
  Edit3,
  Plus
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { SchoolProfile } from '../../types';
import { 
  TutWuriHandayaniSDLogo, 
  TutWuriHandayaniKemdikbudLogo, 
  KemenagMadrasahLogo 
} from '../../utils/logoHelper';
import { EditLogoModal } from '../modals/EditLogoModal';

interface SchoolProfileViewProps {
  onBack?: () => void;
  setActiveTab?: (tab: any) => void;
}

export const SchoolProfileView: React.FC<SchoolProfileViewProps> = ({
  onBack,
  setActiveTab,
}) => {
  const { 
    schoolProfile, 
    updateSchoolProfile, 
    exportDatabaseJSON, 
    importDatabaseJSON, 
    resetToInitialData,
    currentRole,
    logActivity 
  } = useSchool();

  const defaultTPList = ['2023/2024', '2024/2025', '2025/2026', '2026/2027'];

  const [formData, setFormData] = useState<SchoolProfile>(() => ({
    ...schoolProfile,
    alamatJalan: schoolProfile.alamatJalan || schoolProfile.alamatSekolah || '',
    alamatSekolah: schoolProfile.alamatSekolah || schoolProfile.alamatJalan || '',
    desaKelurahan: schoolProfile.desaKelurahan || schoolProfile.desa || '',
    desa: schoolProfile.desa || schoolProfile.desaKelurahan || '',
    jenjang: schoolProfile.jenjang || 'Sekolah Dasar (SD)',
    bentukPendidikan: schoolProfile.bentukPendidikan || 'SD',
    statusSekolah: schoolProfile.statusSekolah || 'Negeri',
    kurikulum: schoolProfile.kurikulum || 'Kurikulum Merdeka & Kurikulum 2013',
    namaOperator: schoolProfile.namaOperator || '',
    nipOperator: schoolProfile.nipOperator || '',
    website: schoolProfile.website || '',
    telepon: schoolProfile.telepon || '',
    kodePos: schoolProfile.kodePos || '',
    tahunPelajaranAktif: schoolProfile.tahunPelajaranAktif || '2025/2026',
    semesterAktif: schoolProfile.semesterAktif || 'Ganjil',
    daftarTahunPelajaran: schoolProfile.daftarTahunPelajaran && schoolProfile.daftarTahunPelajaran.length > 0
      ? schoolProfile.daftarTahunPelajaran
      : defaultTPList,
  }));

  const [isManualTP, setIsManualTP] = useState(false);
  const [manualTPInput, setManualTPInput] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isEditLogoModalOpen, setIsEditLogoModalOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Sync formData when schoolProfile changes
  React.useEffect(() => {
    setFormData({
      ...schoolProfile,
      alamatJalan: schoolProfile.alamatJalan || schoolProfile.alamatSekolah || '',
      alamatSekolah: schoolProfile.alamatSekolah || schoolProfile.alamatJalan || '',
      desaKelurahan: schoolProfile.desaKelurahan || schoolProfile.desa || '',
      desa: schoolProfile.desa || schoolProfile.desaKelurahan || '',
      jenjang: schoolProfile.jenjang || 'Sekolah Dasar (SD)',
      bentukPendidikan: schoolProfile.bentukPendidikan || 'SD',
      statusSekolah: schoolProfile.statusSekolah || 'Negeri',
      kurikulum: schoolProfile.kurikulum || 'Kurikulum Merdeka & Kurikulum 2013',
      namaOperator: schoolProfile.namaOperator || '',
      nipOperator: schoolProfile.nipOperator || '',
      website: schoolProfile.website || '',
      telepon: schoolProfile.telepon || '',
      kodePos: schoolProfile.kodePos || '',
      tahunPelajaranAktif: schoolProfile.tahunPelajaranAktif || '2025/2026',
      semesterAktif: schoolProfile.semesterAktif || 'Ganjil',
      daftarTahunPelajaran: schoolProfile.daftarTahunPelajaran && schoolProfile.daftarTahunPelajaran.length > 0
        ? schoolProfile.daftarTahunPelajaran
        : defaultTPList,
    });
  }, [schoolProfile]);

  // Calculate completeness
  const requiredFields: { key: keyof SchoolProfile; label: string; section: string }[] = [
    { key: 'namaSekolah', label: 'Nama Resmi Satuan Pendidikan', section: 'Data Pokok' },
    { key: 'npsn', label: 'NPSN', section: 'Data Pokok' },
    { key: 'nss', label: 'NSS', section: 'Data Pokok' },
    { key: 'jenjang', label: 'Jenjang Pendidikan', section: 'Data Pokok' },
    { key: 'statusSekolah', label: 'Status Sekolah', section: 'Data Pokok' },
    { key: 'akreditasi', label: 'Akreditasi', section: 'Data Pokok' },
    { key: 'kurikulum', label: 'Kurikulum', section: 'Data Pokok' },
    { key: 'namaKepalaSekolah', label: 'Nama Kepala Sekolah', section: 'Pimpinan' },
    { key: 'nipKepalaSekolah', label: 'NIP Kepala Sekolah', section: 'Pimpinan' },
    { key: 'namaOperator', label: 'Nama Operator Dapodik', section: 'Pimpinan' },
    { key: 'nipOperator', label: 'NIP/NUPTK Operator', section: 'Pimpinan' },
    { key: 'alamatJalan', label: 'Alamat Jalan', section: 'Alamat & Kontak' },
    { key: 'desaKelurahan', label: 'Desa / Kelurahan', section: 'Alamat & Kontak' },
    { key: 'kecamatan', label: 'Kecamatan', section: 'Alamat & Kontak' },
    { key: 'kabupatenKota', label: 'Kabupaten / Kota', section: 'Alamat & Kontak' },
    { key: 'provinsi', label: 'Provinsi', section: 'Alamat & Kontak' },
    { key: 'kodePos', label: 'Kode Pos', section: 'Alamat & Kontak' },
    { key: 'telepon', label: 'Nomor Telepon', section: 'Alamat & Kontak' },
    { key: 'email', label: 'Email Resmi', section: 'Alamat & Kontak' },
    { key: 'website', label: 'Website Sekolah', section: 'Alamat & Kontak' },
    { key: 'tahunPelajaranAktif', label: 'Tahun Pelajaran Aktif', section: 'Periode Aktif' },
    { key: 'semesterAktif', label: 'Semester Aktif', section: 'Periode Aktif' },
  ];

  const emptyFields = requiredFields.filter(f => {
    const val = formData[f.key];
    return !val || (typeof val === 'string' && val.trim() === '');
  });

  const filledCount = requiredFields.length - emptyFields.length;
  const completenessPercentage = Math.round((filledCount / requiredFields.length) * 100);

  // Handle jump to empty field
  const handleJumpToField = (fieldKey: string) => {
    const el = document.getElementById(`input-${fieldKey}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus();
      // Add temporary highlight ring
      el.classList.add('ring-4', 'ring-amber-400', 'ring-offset-2');
      setTimeout(() => {
        el.classList.remove('ring-4', 'ring-amber-400', 'ring-offset-2');
      }, 2000);
    }
  };

  const handleFillStandardDefaults = () => {
    setFormData(prev => ({
      ...prev,
      namaSekolah: prev.namaSekolah || 'SD NEGERI 006 SUNGAI BULUH',
      npsn: prev.npsn || '10403789',
      nss: prev.nss || '101090604006',
      jenjang: prev.jenjang || 'Sekolah Dasar (SD)',
      bentukPendidikan: prev.bentukPendidikan || 'SD',
      statusSekolah: prev.statusSekolah || 'Negeri',
      akreditasi: prev.akreditasi || 'A (Unggul)',
      kurikulum: prev.kurikulum || 'Kurikulum Merdeka & Kurikulum 2013',
      namaKepalaSekolah: prev.namaKepalaSekolah || 'H. MARLISMAN, S.Pd., M.M.',
      nipKepalaSekolah: prev.nipKepalaSekolah || '19680512 199103 1 005',
      namaOperator: prev.namaOperator || 'Rahmat Hidayat, S.Kom.',
      nipOperator: prev.nipOperator || '19920415 201902 1 008',
      alamatJalan: prev.alamatJalan || prev.alamatSekolah || 'Jl. Poros Desa Sungai Buluh KM 03',
      alamatSekolah: prev.alamatSekolah || prev.alamatJalan || 'Jl. Poros Desa Sungai Buluh KM 03',
      desaKelurahan: prev.desaKelurahan || prev.desa || 'Sungai Buluh',
      desa: prev.desa || prev.desaKelurahan || 'Sungai Buluh',
      kecamatan: prev.kecamatan || 'Singingi Hilir',
      kabupatenKota: prev.kabupatenKota || 'Kabupaten Kuantan Singingi',
      provinsi: prev.provinsi || 'Riau',
      kodePos: prev.kodePos || '29563',
      telepon: prev.telepon || '(0760) 819203',
      email: prev.email || 'sdn006sungaibuluh@kemdikbud.go.id',
      website: prev.website || 'https://sdn006sungaibuluh.sch.id',
      tahunPelajaranAktif: prev.tahunPelajaranAktif || '2025/2026',
      semesterAktif: prev.semesterAktif || 'Ganjil',
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTP = (isManualTP && manualTPInput.trim()) 
      ? manualTPInput.trim() 
      : (formData.tahunPelajaranAktif || '2025/2026');
    const existingList = formData.daftarTahunPelajaran && formData.daftarTahunPelajaran.length > 0
      ? formData.daftarTahunPelajaran
      : defaultTPList;
    const updatedList = Array.from(new Set([...existingList, finalTP])).sort();

    const updatedData: SchoolProfile = {
      ...formData,
      tahunPelajaranAktif: finalTP,
      daftarTahunPelajaran: updatedList,
      alamatSekolah: formData.alamatJalan,
      alamatJalan: formData.alamatJalan,
      desa: formData.desaKelurahan,
      desaKelurahan: formData.desaKelurahan,
    };
    updateSchoolProfile(updatedData);
    setIsManualTP(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importDatabaseJSON(content);
      if (success) {
        alert('Database buku induk dan identitas sekolah berhasil dipulihkan!');
      } else {
        alert('Format file JSON tidak valid.');
      }
    };
    reader.readAsText(file);
  };

  const handleGoBack = () => {
    if (onBack) {
      onBack();
    } else if (setActiveTab) {
      setActiveTab('dashboard');
    }
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <button
            onClick={handleGoBack}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
            title="Kembali ke Dashboard Utama"
          >
            <ArrowLeft className="w-4 h-4 text-[#003399] dark:text-blue-400" />
            <span className="hidden sm:inline">Kembali ke Dashboard</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <School className="w-6 h-6 text-[#003399] dark:text-blue-400" />
                <span>Identitas Sekolah & Profil Satuan Pendidikan</span>
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-[#003399] dark:text-blue-200 font-extrabold text-xs">
                Kop Dokumen Resmi
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Data resmi satuan pendidikan, NPSN, nama kepala sekolah, alamat, dan kontak yang tercetak otomatis pada Buku Induk, Raport, STTB, dan Kartu Pelajar
            </p>
          </div>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-xs font-bold rounded-xl border border-emerald-300 dark:border-emerald-800 shadow-xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Perubahan Identitas Sekolah Berhasil Disimpan & Tersinkronisasi!</span>
          </div>
        )}
      </div>

      {/* Profil Completeness Meter */}
      <div className={`p-5 rounded-2xl border ${
        completenessPercentage === 100 
          ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60' 
          : 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60'
      } shadow-xs`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {completenessPercentage === 100 ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs font-black">
                  <Check className="w-3.5 h-3.5" /> PROFIL 100% LENGKAP
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 text-xs font-black">
                  <AlertTriangle className="w-3.5 h-3.5" /> ADA {emptyFields.length} ISIAN MASIH KOSONG
                </span>
              )}
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Kelengkapan Profil Satuan Pendidikan: {completenessPercentage}% ({filledCount}/{requiredFields.length} Isian Terisi)
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {completenessPercentage === 100
                ? 'Seluruh data pokok dan identitas sekolah telah lengkap dan siap dicetak pada seluruh dokumen resmi.'
                : 'Lengkapi isian yang masih kosong di bawah ini agar kop surat, raport siswa, buku induk, dan kartu pelajar tercetak sempurna.'}
            </p>
          </div>

          <div className="w-full sm:w-48 shrink-0">
            <div className="flex items-center justify-between text-[11px] font-bold mb-1 text-slate-600 dark:text-slate-400">
              <span>Status</span>
              <span>{completenessPercentage}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  completenessPercentage === 100 ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${completenessPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {emptyFields.length > 0 && (
          <div className="mt-3 pt-3 border-t border-amber-200/80 dark:border-amber-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-bold text-amber-900 dark:text-amber-300 text-[11px] flex items-center gap-1">
                <span>Isian belum terisi (klik untuk isi langsung):</span>
              </span>
              {emptyFields.map(f => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => handleJumpToField(f.key)}
                  className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/60 hover:bg-amber-200 dark:hover:bg-amber-800/80 text-amber-950 dark:text-amber-100 font-bold text-[11px] border border-amber-300 dark:border-amber-700 transition-all flex items-center gap-1 shadow-2xs hover:scale-105 cursor-pointer"
                  title={`Klik untuk langsung mengisi ${f.label}`}
                >
                  <span>{f.label}</span>
                  <span className="text-[10px] text-amber-700 dark:text-amber-300 font-black">↓</span>
                </button>
              ))}
            </div>

            {currentRole !== 'umum' && (
              <button
                type="button"
                onClick={handleFillStandardDefaults}
                className="self-start sm:self-auto px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black rounded-lg shadow-xs transition-all shrink-0 cursor-pointer"
              >
                + Lengkapi Otomatis Data Standar
              </button>
            )}
          </div>
        )}
      </div>

      {/* Quick Document Navigation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setActiveTab && setActiveTab('print-buku-induk')}
          className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 shadow-xs flex items-center gap-3 text-left transition-all group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#003399] dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">Kop Buku Induk</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Pratinjau Cetak</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab && setActiveTab('raport')}
          className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 shadow-xs flex items-center gap-3 text-left transition-all group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Award className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">Kop Raport Siswa</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Format Nilai</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab && setActiveTab('kartu-pelajar')}
          className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-600 shadow-xs flex items-center gap-3 text-left transition-all group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <CreditCard className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">Kartu Pelajar</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Barcode & QR</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab && setActiveTab('mutasi')}
          className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-600 shadow-xs flex items-center gap-3 text-left transition-all group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">Surat Mutasi</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Pindah Sekolah</div>
          </div>
        </button>
      </div>

      {/* Logo & Branding Management Banner */}
      <div className="p-6 rounded-2xl bg-linear-to-r from-blue-900 via-[#003399] to-indigo-950 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-blue-400/30">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white p-2 flex items-center justify-center shadow-md shrink-0 border-2 border-amber-400">
            {formData.tutWuriLogoUrl === 'preset:tut-wuri-emas' ? (
              <TutWuriHandayaniKemdikbudLogo className="w-12 h-12" />
            ) : formData.tutWuriLogoUrl === 'preset:kemenag-mi' ? (
              <KemenagMadrasahLogo className="w-12 h-12" />
            ) : (formData.logoKiriUrl || formData.logoUrl) && !(formData.logoKiriUrl || formData.logoUrl)?.startsWith('preset:') ? (
              <img src={formData.logoKiriUrl || formData.logoUrl} alt="Logo Sekolah" className="w-12 h-12 object-contain" referrerPolicy="no-referrer" />
            ) : (
              <TutWuriHandayaniSDLogo className="w-12 h-12" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[10px] uppercase">
                RESMI KEMDIKBUDRISTEK
              </span>
              <span className="text-xs text-blue-200 font-semibold">
                Lambang & Cap Resmi Aktif
              </span>
            </div>
            <h2 className="text-lg font-black tracking-wide mt-0.5 text-white">
              Logo Sekolah, Lambang Tut Wuri Handayani & Stempel
            </h2>
            <p className="text-xs text-blue-100/80 max-w-xl mt-0.5">
              Lambang ini otomatis disematkan pada sudut kanan atas bilah navigasi utama, Kartu Tanda Peserta Didik, Lembar Buku Induk Register Siswa, dan Raport.
            </p>
          </div>
        </div>

        {currentRole !== 'umum' && (
          <button
            type="button"
            onClick={() => setIsEditLogoModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl shadow-md transition-all transform active:scale-95 shrink-0 cursor-pointer"
          >
            <ImageIcon className="w-4 h-4 text-slate-950" />
            <span>EDIT LOGO & STEMPEL RESMI</span>
          </button>
        )}
      </div>

      {/* Main Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: School Identity */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wide flex items-center gap-2">
              <School className="w-4 h-4 text-[#003399] dark:text-blue-400" />
              <span>1. Data Pokok Satuan Pendidikan (Dapodik / Kemdikbud)</span>
            </h3>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Bagian 1 dari 4
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="lg:col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nama Resmi Satuan Pendidikan <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-namaSekolah"
                type="text"
                required
                disabled={currentRole === 'umum'}
                placeholder="Contoh: SD NEGERI 006 SUNGAI BULUH"
                value={formData.namaSekolah}
                onChange={(e) => setFormData({ ...formData, namaSekolah: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Status Akreditasi <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-akreditasi"
                type="text"
                disabled={currentRole === 'umum'}
                placeholder="Contoh: A (Unggul)"
                value={formData.akreditasi}
                onChange={(e) => setFormData({ ...formData, akreditasi: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                NPSN (Nomor Pokok Sekolah Nasional) <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-npsn"
                type="text"
                required
                disabled={currentRole === 'umum'}
                placeholder="Contoh: 10403789"
                value={formData.npsn}
                onChange={(e) => setFormData({ ...formData, npsn: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                NSS (Nomor Statistik Sekolah)
              </label>
              <input
                id="input-nss"
                type="text"
                disabled={currentRole === 'umum'}
                placeholder="Contoh: 101090604006"
                value={formData.nss}
                onChange={(e) => setFormData({ ...formData, nss: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Jenjang Pendidikan <span className="text-rose-500">*</span>
              </label>
              <select
                id="input-jenjang"
                disabled={currentRole === 'umum'}
                value={formData.jenjang}
                onChange={(e) => setFormData({ ...formData, jenjang: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="Sekolah Dasar (SD)">Sekolah Dasar (SD)</option>
                <option value="Madrasah Ibtidaiyah (MI)">Madrasah Ibtidaiyah (MI)</option>
                <option value="Sekolah Menengah Pertama (SMP)">Sekolah Menengah Pertama (SMP)</option>
                <option value="Madrasah Tsanawiyah (MTs)">Madrasah Tsanawiyah (MTs)</option>
                <option value="Sekolah Dasar Luar Biasa (SDLB)">Sekolah Dasar Luar Biasa (SDLB)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Status Satuan Pendidikan <span className="text-rose-500">*</span>
              </label>
              <select
                id="input-statusSekolah"
                disabled={currentRole === 'umum'}
                value={formData.statusSekolah}
                onChange={(e) => setFormData({ ...formData, statusSekolah: e.target.value as 'Negeri' | 'Swasta' })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="Negeri">Negeri (Pemerintah)</option>
                <option value="Swasta">Swasta (Yayasan)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Bentuk Pendidikan
              </label>
              <input
                id="input-bentukPendidikan"
                type="text"
                disabled={currentRole === 'umum'}
                placeholder="Contoh: SD / MI / SMP"
                value={formData.bentukPendidikan || ''}
                onChange={(e) => setFormData({ ...formData, bentukPendidikan: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Kurikulum yang Digunakan
              </label>
              <input
                id="input-kurikulum"
                type="text"
                disabled={currentRole === 'umum'}
                placeholder="Contoh: Kurikulum Merdeka & K-13"
                value={formData.kurikulum || ''}
                onChange={(e) => setFormData({ ...formData, kurikulum: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Leadership & Officials */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wide flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#003399] dark:text-blue-400" />
              <span>2. Pimpinan Satuan Pendidikan & Tim Pengelola Data</span>
            </h3>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Bagian 2 dari 4
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nama Lengkap Kepala Sekolah (Beserta Gelar) <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-namaKepalaSekolah"
                type="text"
                required
                disabled={currentRole === 'umum'}
                placeholder="Contoh: H. MARLISMAN, S.Pd., M.M."
                value={formData.namaKepalaSekolah}
                onChange={(e) => setFormData({ ...formData, namaKepalaSekolah: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-[#003399] dark:text-blue-200 focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                NIP Kepala Sekolah <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-nipKepalaSekolah"
                type="text"
                required
                disabled={currentRole === 'umum'}
                placeholder="Contoh: 19680512 199103 1 005"
                value={formData.nipKepalaSekolah}
                onChange={(e) => setFormData({ ...formData, nipKepalaSekolah: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nama Petugas Operator Dapodik / TU
              </label>
              <input
                id="input-namaOperator"
                type="text"
                disabled={currentRole === 'umum'}
                placeholder="Contoh: Rahmat Hidayat, S.Kom."
                value={formData.namaOperator || ''}
                onChange={(e) => setFormData({ ...formData, namaOperator: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                NIP / NUPTK Petugas Operator
              </label>
              <input
                id="input-nipOperator"
                type="text"
                disabled={currentRole === 'umum'}
                placeholder="Contoh: 19920415 201902 1 008"
                value={formData.nipOperator || ''}
                onChange={(e) => setFormData({ ...formData, nipOperator: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Location and Contact */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wide flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#003399] dark:text-blue-400" />
              <span>3. Alamat Jalan, Wilayah & Kontak Resmi Sekolah</span>
            </h3>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Bagian 3 dari 4
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="lg:col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Alamat Jalan / Gedung <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-alamatJalan"
                type="text"
                required
                disabled={currentRole === 'umum'}
                placeholder="Contoh: Jl. Poros Desa Sungai Buluh KM 03"
                value={formData.alamatJalan || formData.alamatSekolah || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  alamatJalan: e.target.value,
                  alamatSekolah: e.target.value 
                })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Desa / Kelurahan <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-desaKelurahan"
                type="text"
                required
                disabled={currentRole === 'umum'}
                placeholder="Contoh: Sungai Buluh"
                value={formData.desaKelurahan || formData.desa || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  desaKelurahan: e.target.value,
                  desa: e.target.value 
                })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Kecamatan <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-kecamatan"
                type="text"
                required
                disabled={currentRole === 'umum'}
                placeholder="Contoh: Singingi Hilir"
                value={formData.kecamatan}
                onChange={(e) => setFormData({ ...formData, kecamatan: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Kabupaten / Kota <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-kabupatenKota"
                type="text"
                required
                disabled={currentRole === 'umum'}
                placeholder="Contoh: Kabupaten Kuantan Singingi"
                value={formData.kabupatenKota}
                onChange={(e) => setFormData({ ...formData, kabupatenKota: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Provinsi <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-provinsi"
                type="text"
                required
                disabled={currentRole === 'umum'}
                placeholder="Contoh: Riau"
                value={formData.provinsi}
                onChange={(e) => setFormData({ ...formData, provinsi: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Email Resmi Sekolah <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="input-email"
                  type="email"
                  required
                  disabled={currentRole === 'umum'}
                  placeholder="sdn006sungaibuluh@kemdikbud.go.id"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nomor Telepon / Fax
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="input-telepon"
                  type="text"
                  disabled={currentRole === 'umum'}
                  placeholder="Contoh: (0760) 819203"
                  value={formData.telepon || ''}
                  onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Website / Portal Sekolah
              </label>
              <div className="relative">
                <Globe className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="input-website"
                  type="text"
                  disabled={currentRole === 'umum'}
                  placeholder="Contoh: https://sdn006sungaibuluh.sch.id"
                  value={formData.website || ''}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Kode Pos
              </label>
              <input
                id="input-kodePos"
                type="text"
                disabled={currentRole === 'umum'}
                placeholder="Contoh: 29563"
                value={formData.kodePos || ''}
                onChange={(e) => setFormData({ ...formData, kodePos: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Academic Year & Active Semester */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wide flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#003399] dark:text-blue-400" />
              <span>4. Tahun Pelajaran & Semester Aktif Berjalan</span>
            </h3>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Bagian 4 dari 4
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Tahun Pelajaran Aktif <span className="text-rose-500">*</span>
                </label>
                {currentRole !== 'umum' && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = !isManualTP;
                      setIsManualTP(next);
                      if (next) {
                        setManualTPInput(formData.tahunPelajaranAktif || '');
                      }
                    }}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer transition-colors"
                    title="Beralih antara pilihan daftar atau isi manual"
                  >
                    {isManualTP ? (
                      <span>📋 Pilih dari Daftar</span>
                    ) : (
                      <>
                        <Edit3 className="w-3 h-3" />
                        <span>✏️ Isi Manual</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {isManualTP ? (
                <div className="space-y-2 animate-in fade-in duration-200">
                  <div className="relative">
                    <input
                      id="input-tahunPelajaranAktif"
                      type="text"
                      disabled={currentRole === 'umum'}
                      autoFocus
                      placeholder="Contoh: 2026/2027 atau 2027/2028"
                      value={manualTPInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setManualTPInput(val);
                        setFormData(prev => ({
                          ...prev,
                          tahunPelajaranAktif: val,
                        }));
                      }}
                      className="w-full px-3 py-2 pr-20 rounded-xl border-2 border-blue-500 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-950/40 font-mono font-bold text-[#003399] dark:text-blue-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = manualTPInput.trim();
                        if (!val) return;
                        const existingList = formData.daftarTahunPelajaran && formData.daftarTahunPelajaran.length > 0
                          ? formData.daftarTahunPelajaran
                          : defaultTPList;
                        const updatedList = Array.from(new Set([...existingList, val])).sort();
                        setFormData(prev => ({
                          ...prev,
                          tahunPelajaranAktif: val,
                          daftarTahunPelajaran: updatedList,
                        }));
                        setIsManualTP(false);
                      }}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold shadow-xs transition-colors cursor-pointer"
                      title="Terapkan dan simpan ke daftar pilihan"
                    >
                      Terapkan
                    </button>
                  </div>

                  <div className="p-2 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500 dark:text-slate-400">
                        Format baku: <strong>YYYY/YYYY</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsManualTP(false)}
                        className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-[10px] text-slate-400">Saran:</span>
                      {['2026/2027', '2027/2028', '2028/2029'].map(sugg => (
                        <button
                          key={sugg}
                          type="button"
                          onClick={() => {
                            setManualTPInput(sugg);
                            const existingList = formData.daftarTahunPelajaran && formData.daftarTahunPelajaran.length > 0
                              ? formData.daftarTahunPelajaran
                              : defaultTPList;
                            const updatedList = Array.from(new Set([...existingList, sugg])).sort();
                            setFormData(prev => ({
                              ...prev,
                              tahunPelajaranAktif: sugg,
                              daftarTahunPelajaran: updatedList,
                            }));
                            setIsManualTP(false);
                          }}
                          className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-[#003399] dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-[10px] font-mono font-bold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                        >
                          + {sugg}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <select
                    id="input-tahunPelajaranAktif"
                    disabled={currentRole === 'umum'}
                    value={formData.tahunPelajaranAktif || '2025/2026'}
                    onChange={(e) => {
                      if (e.target.value === '__manual__') {
                        setIsManualTP(true);
                        setManualTPInput(formData.tahunPelajaranAktif || '');
                      } else {
                        setFormData({ ...formData, tahunPelajaranAktif: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-[#003399] dark:text-blue-300 focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                  >
                    <optgroup label="Tahun Pelajaran Terdaftar">
                      {(formData.daftarTahunPelajaran || defaultTPList).map(tp => (
                        <option key={tp} value={tp}>Tahun Pelajaran {tp}</option>
                      ))}
                    </optgroup>
                    {currentRole !== 'umum' && (
                      <optgroup label="Pilihan Input Lainnya">
                        <option value="__manual__" className="text-blue-600 font-bold">
                          ✏️ + Isi Manual Tahun Pelajaran...
                        </option>
                      </optgroup>
                    )}
                  </select>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 px-0.5">
                    <span>Sedang aktif: <strong className="text-slate-700 dark:text-slate-300">{formData.tahunPelajaranAktif}</strong></span>
                    {currentRole !== 'umum' && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsManualTP(true);
                          setManualTPInput(formData.tahunPelajaranAktif || '');
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer"
                      >
                        + Isi Manual
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Semester Berjalan <span className="text-rose-500">*</span>
              </label>
              <select
                id="input-semesterAktif"
                disabled={currentRole === 'umum'}
                value={formData.semesterAktif || 'Ganjil'}
                onChange={(e) => setFormData({ ...formData, semesterAktif: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-[#003399] dark:text-blue-300 focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="Ganjil">Semester Ganjil (Semester 1 / 3 / 5 / 7 / 9 / 11)</option>
                <option value="Genap">Semester Genap (Semester 2 / 4 / 6 / 8 / 10 / 12)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Keterangan Kalender Pendidikan
              </label>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                Sinkron dengan lembar Buku Induk, Raport dan Distribusi Ranking Kelas.
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        {currentRole !== 'umum' && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
            <div className="text-xs text-blue-900 dark:text-blue-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Perubahan data identitas akan langsung berlaku pada seluruh dokumen cetak dan laporan.</span>
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-[#003399] hover:bg-[#002266] text-white text-xs font-bold rounded-xl shadow-lg transition-transform transform active:scale-95 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan Identitas Sekolah</span>
            </button>
          </div>
        )}
      </form>

      {/* Database Backup & Maintenance Section */}
      <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Pusat Cadangan & Pemulihan Database (Backup & Restore)</span>
          </h3>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
            JSON Aman
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Unduh seluruh salinan data buku induk ke format JSON aman atau pulihkan dari cadangan sebelumnya.
        </p>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".json"
          className="hidden"
        />

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={exportDatabaseJSON}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Cadangan Database JSON</span>
          </button>

          {currentRole !== 'umum' && (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Pulihkan dari File Backup JSON</span>
              </button>

              <button
                onClick={() => {
                  if (confirm('Apakah Anda yakin ingin mengatur ulang data kembali ke data contoh SDN 006 Sungai Buluh? Seluruh isian kosong akan diisi dengan data lengkap resmi.')) {
                    resetToInitialData();
                    setFormData(schoolProfile);
                    logActivity('PENGATURAN', 'Mengembalikan seluruh data identitas ke data awal SDN 006 Sungai Buluh');
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 hover:bg-rose-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset ke Data Awal SDN 006 Sungai Buluh</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Edit Logo Modal */}
      <EditLogoModal
        isOpen={isEditLogoModalOpen}
        onClose={() => setIsEditLogoModalOpen(false)}
      />
    </div>
  );
};
