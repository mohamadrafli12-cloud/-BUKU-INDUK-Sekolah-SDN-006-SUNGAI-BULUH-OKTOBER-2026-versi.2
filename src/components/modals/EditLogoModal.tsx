import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Upload, 
  Check, 
  Image as ImageIcon, 
  School, 
  ShieldCheck, 
  CheckCircle2, 
  Trash2, 
  Eye, 
  Globe, 
  AlertCircle,
  ArrowLeftRight,
  Sparkles
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { TutWuriHandayaniSDLogo, OfficialNationalLogo } from '../../utils/logoHelper';
import { cn } from '../../lib/utils';

interface EditLogoModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'custom' | 'stempel' | 'tutwuri' | 'kiri' | 'kanan';
}

export const EditLogoModal: React.FC<EditLogoModalProps> = ({ 
  isOpen, 
  onClose,
  initialTab = 'kiri'
}) => {
  const { schoolProfile, updateSchoolProfile, logActivity } = useSchool();

  const [activeTab, setActiveTab] = useState<'kiri' | 'kanan' | 'stempel'>('kiri');
  
  // Custom Logos & Stamp states
  const [logoKiriUrl, setLogoKiriUrl] = useState<string>(
    schoolProfile.logoKiriUrl || schoolProfile.logoUrl || ''
  );
  const [logoKananUrl, setLogoKananUrl] = useState<string>(
    schoolProfile.logoKananUrl || ''
  );
  const [stempelUrl, setStempelUrl] = useState<string>(schoolProfile.stempelUrl || '');
  
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileKiriRef = useRef<HTMLInputElement>(null);
  const fileKananRef = useRef<HTMLInputElement>(null);
  const fileStempelRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialTab === 'stempel') {
        setActiveTab('stempel');
      } else if (initialTab === 'kanan' || initialTab === 'tutwuri') {
        setActiveTab('kanan');
      } else {
        setActiveTab('kiri');
      }
      setLogoKiriUrl(schoolProfile.logoKiriUrl || schoolProfile.logoUrl || '');
      setLogoKananUrl(schoolProfile.logoKananUrl || '');
      setStempelUrl(schoolProfile.stempelUrl || '');
      setErrorMessage(null);
      setSaveSuccess(false);
    }
  }, [isOpen, initialTab, schoolProfile]);

  if (!isOpen) return null;

  // Process image file to base64 data URL
  const processImageFile = (file: File, target: 'kiri' | 'kanan' | 'stempel') => {
    setErrorMessage(null);

    // Validate type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Format berkas harus berupa PNG, JPG, JPEG, SVG, atau WebP.');
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Ukuran berkas gambar maksimal 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (target === 'kiri') {
        setLogoKiriUrl(result);
      } else if (target === 'kanan') {
        setLogoKananUrl(result);
      } else {
        setStempelUrl(result);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Gagal membaca berkas gambar. Silakan coba lagi.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'kiri' | 'kanan' | 'stempel') => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file, target);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent, target: 'kiri' | 'kanan' | 'stempel') => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file, target);
    }
  };

  // Main Save
  const handleSave = () => {
    updateSchoolProfile({
      ...schoolProfile,
      logoKiriUrl: logoKiriUrl.trim(),
      logoUrl: logoKiriUrl.trim(), // Keep backwards compatible
      logoKananUrl: logoKananUrl.trim(),
      stempelUrl: stempelUrl.trim(),
    });

    logActivity(
      'PENGATURAN',
      `Memperbarui logo kop surat dan stempel resmi untuk ${schoolProfile.namaSekolah}`
    );

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-[#003399] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 p-1 shrink-0">
              {logoKiriUrl ? (
                <img 
                  src={logoKiriUrl} 
                  alt="Logo Sebelah Kiri" 
                  className="w-8 h-8 object-contain" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <School className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-wide text-white">
                Kelola Logo & Kop Surat Sekolah
              </h3>
              <p className="text-xs text-blue-100">
                Unggah logo sebelah kiri (Pemda/Sekolah), logo sebelah kanan, dan stempel resmi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-6 pt-3 gap-2 overflow-x-auto">
          {/* TAB 1: LOGO SEBELAH KIRI */}
          <button
            type="button"
            onClick={() => setActiveTab('kiri')}
            className={cn(
              "px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer",
              activeTab === 'kiri'
                ? "bg-white dark:bg-slate-900 border-[#003399] text-[#003399] dark:text-blue-400 shadow-xs"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Unggah Logo Sebelah Kiri</span>
            {logoKiriUrl && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>

          {/* TAB 2: LOGO SEBELAH KANAN */}
          <button
            type="button"
            onClick={() => setActiveTab('kanan')}
            className={cn(
              "px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer",
              activeTab === 'kanan'
                ? "bg-white dark:bg-slate-900 border-[#003399] text-[#003399] dark:text-blue-400 shadow-xs"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            <ArrowLeftRight className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Logo Sebelah KANAN</span>
            {logoKananUrl && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>

          {/* TAB 3: STEMPEL */}
          <button
            type="button"
            onClick={() => setActiveTab('stempel')}
            className={cn(
              "px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer",
              activeTab === 'stempel'
                ? "bg-white dark:bg-slate-900 border-[#003399] text-[#003399] dark:text-blue-400 shadow-xs"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Cap / Stempel Resmi</span>
            {stempelUrl && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 md:p-6 overflow-y-auto flex-1 space-y-5">

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: UPLOAD LOGO SEBELAH KIRI */}
          {activeTab === 'kiri' && (
            <div className="space-y-5">
              
              {/* Status Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/50 text-xs">
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px] font-black uppercase">
                      KIRI KOP
                    </span>
                    <span>Kolom Unggah Logo Sebelah Kiri Kop Surat</span>
                  </span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-300 block mt-0.5">
                    Dipasang di sudut <strong>KIRI</strong> kop surat dinas, rapor, STTB, mutasi, dan kartu pelajar (biasanya Lambang Pemda Kab/Kota atau Logo Sekolah).
                  </span>
                </div>
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold self-start sm:self-auto shrink-0",
                  logoKiriUrl
                    ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                    : "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                )}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", logoKiriUrl ? "bg-emerald-500" : "bg-amber-500")} />
                  {logoKiriUrl ? "Logo Kiri Terpasang" : "Default Tut Wuri SD"}
                </span>
              </div>

              {/* Hidden file input */}
              <input
                type="file"
                ref={fileKiriRef}
                onChange={(e) => handleFileInputChange(e, 'kiri')}
                accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                className="hidden"
              />

              {/* Upload Dropzone & Live Preview Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 1. Drag and drop upload box */}
                <div 
                  onClick={() => fileKiriRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, 'kiri')}
                  className={cn(
                    "p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all select-none min-h-[190px]",
                    isDragging
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-950/50 scale-[1.01]"
                      : "border-slate-300 dark:border-slate-700 hover:border-blue-500 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/70"
                  )}
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 shadow-xs">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Pilih Berkas Logo Sebelah Kiri
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    atau seret & jatuhkan gambar logo ke sini
                  </span>
                  <span className="mt-2.5 px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    PNG, JPG, SVG, WebP (Maks 5 MB)
                  </span>
                </div>

                {/* 2. Live Preview Box */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 flex flex-col items-center justify-between text-center min-h-[190px]">
                  <div className="w-full flex items-center justify-between text-[11px] text-slate-500 font-semibold mb-1">
                    <span>Pratinjau Logo Sebelah Kiri</span>
                    {logoKiriUrl && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Siap Digunakan
                      </span>
                    )}
                  </div>

                  <div className="w-24 h-24 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden my-auto p-1.5 shadow-2xs">
                    {logoKiriUrl ? (
                      logoKiriUrl.startsWith('preset:') ? (
                        <OfficialNationalLogo logoIdOrUrl={logoKiriUrl} className="w-20 h-20" />
                      ) : (
                        <img 
                          src={logoKiriUrl} 
                          alt="Logo Sebelah Kiri" 
                          className="w-full h-full object-contain" 
                          referrerPolicy="no-referrer" 
                        />
                      )
                    ) : (
                      <TutWuriHandayaniSDLogo className="w-20 h-20" />
                    )}
                  </div>

                  <div className="w-full pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">
                      {logoKiriUrl ? 'Logo Kiri Kustom' : 'Default Tut Wuri SD'}
                    </span>

                    {logoKiriUrl && (
                      <button
                        type="button"
                        onClick={() => setLogoKiriUrl('')}
                        className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
                        title="Hapus logo kiri dan gunakan logo default"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>

              {/* 3. Input URL Tautan Gambar Logo Kiri */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Atau Masukkan Tautan URL Logo Sebelah Kiri:</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={logoKiriUrl}
                    onChange={(e) => setLogoKiriUrl(e.target.value)}
                    placeholder="https://contoh-domain.sch.id/logo-pemda-atau-sekolah.png"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  />
                  {logoKiriUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoKiriUrl('')}
                      className="px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Bersihkan
                    </button>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: UPLOAD LOGO SEBELAH KANAN */}
          {activeTab === 'kanan' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-900/50 text-xs">
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-white text-[10px] font-black uppercase">
                      KANAN KOP
                    </span>
                    <span>Logo Sebelah KANAN Kop Surat</span>
                  </span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-300 block mt-0.5">
                    Standar resmi menggunakan lambang <strong>Tut Wuri Handayani SD</strong>. Anda dapat mengunggah logo kustom untuk sisi kanan jika diperlukan.
                  </span>
                </div>
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold self-start sm:self-auto shrink-0",
                  logoKananUrl
                    ? "bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700"
                )}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", logoKananUrl ? "bg-indigo-500" : "bg-blue-500")} />
                  {logoKananUrl ? "Logo Kanan Kustom" : "Tut Wuri Handayani SD (Resmi)"}
                </span>
              </div>

              <input
                type="file"
                ref={fileKananRef}
                onChange={(e) => handleFileInputChange(e, 'kanan')}
                accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                className="hidden"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div 
                  onClick={() => fileKananRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, 'kanan')}
                  className="p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-2xl bg-slate-50 dark:bg-slate-800/40 flex flex-col items-center justify-center text-center cursor-pointer transition-colors min-h-[190px]"
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 shadow-xs">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Unggah Logo Sebelah Kanan
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    atau biarkan default Tut Wuri Handayani SD
                  </span>
                  <span className="mt-2.5 px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    PNG, JPG, SVG, WebP (Maks 5 MB)
                  </span>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 flex flex-col items-center justify-between text-center min-h-[190px]">
                  <div className="w-full flex items-center justify-between text-[11px] text-slate-500 font-semibold mb-1">
                    <span>Pratinjau Logo Sebelah Kanan</span>
                  </div>

                  <div className="w-24 h-24 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden my-auto p-1.5 shadow-2xs">
                    {logoKananUrl ? (
                      <img 
                        src={logoKananUrl} 
                        alt="Logo Sebelah Kanan" 
                        className="w-full h-full object-contain" 
                        referrerPolicy="no-referrer" 
                      />
                    ) : (
                      <TutWuriHandayaniSDLogo className="w-20 h-20" />
                    )}
                  </div>

                  <div className="w-full pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">
                      {logoKananUrl ? 'Logo Kanan Kustom' : 'Tut Wuri Handayani SD'}
                    </span>

                    {logoKananUrl && (
                      <button
                        type="button"
                        onClick={() => setLogoKananUrl('')}
                        className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
                        title="Kembali ke standar Tut Wuri Handayani SD"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Reset Default</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Tautan URL Logo Kanan */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Atau Masukkan Tautan URL Logo Sebelah Kanan:</span>
                </label>
                <input
                  type="url"
                  value={logoKananUrl}
                  onChange={(e) => setLogoKananUrl(e.target.value)}
                  placeholder="https://contoh-domain.sch.id/logo-kanan.png"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          {/* TAB 3: STEMPEL / CAP RESMI SEKOLAH */}
          {activeTab === 'stempel' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50 text-xs">
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">
                    Stempel / Cap Basah Resmi Satuan Pendidikan
                  </span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-300">
                    Cap stempel resmi disematkan di sebelah tanda tangan Kepala Sekolah pada Kartu Pelajar dan Lembar STTB.
                  </span>
                </div>
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold self-start sm:self-auto shrink-0",
                  stempelUrl
                    ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700"
                )}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", stempelUrl ? "bg-emerald-500" : "bg-slate-400")} />
                  {stempelUrl ? "Stempel Terpasang" : "Belum Ada Stempel"}
                </span>
              </div>

              <input
                type="file"
                ref={fileStempelRef}
                onChange={(e) => handleFileInputChange(e, 'stempel')}
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div 
                  onClick={() => fileStempelRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, 'stempel')}
                  className="p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-2xl bg-slate-50 dark:bg-slate-800/40 flex flex-col items-center justify-center text-center cursor-pointer transition-colors min-h-[190px]"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 shadow-xs">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Unggah Berkas Cap Stempel
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Disarankan format PNG berlatar transparan
                  </span>
                  <span className="mt-2.5 px-2.5 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    PNG, JPG, WebP (Maks 4 MB)
                  </span>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 flex flex-col items-center justify-between text-center min-h-[190px]">
                  <div className="w-full flex items-center justify-between text-[11px] text-slate-500 font-semibold mb-1">
                    <span>Pratinjau Cap Stempel</span>
                  </div>

                  <div className="w-24 h-24 rounded-full border-2 border-dashed border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30 flex items-center justify-center overflow-hidden my-auto p-2">
                    {stempelUrl ? (
                      <img 
                        src={stempelUrl} 
                        alt="Stempel Sekolah" 
                        className="w-full h-full object-contain" 
                        referrerPolicy="no-referrer" 
                      />
                    ) : (
                      <div className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 text-center leading-tight">
                        STEMPEL<br/>RESMI
                      </div>
                    )}
                  </div>

                  <div className="w-full pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {stempelUrl ? 'Stempel Siap Digunakan' : 'Belum Ada Berkas'}
                    </span>

                    {stempelUrl && (
                      <button
                        type="button"
                        onClick={() => setStempelUrl('')}
                        className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Tautan URL Stempel */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Atau Masukkan Tautan URL Stempel Sekolah:</span>
                </label>
                <input
                  type="url"
                  value={stempelUrl}
                  onChange={(e) => setStempelUrl(e.target.value)}
                  placeholder="https://contoh-domain.sch.id/stempel-sekolah.png"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                />
              </div>
            </div>
          )}

          {/* SIMULASI LANGSUNG KOP SURAT (LIVE PREVIEW OF BOTH LOGOS) */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-amber-500" />
                <span>Simulasi Kop Surat Resmi (Posisi Logo Kiri & Kanan)</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Tercetak pada Buku Induk • Raport • Mutasi
              </span>
            </div>

            {/* Kop Preview Card */}
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 flex items-center gap-3 relative overflow-hidden">
              
              {/* POSISI LOGO KIRI */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className={cn(
                  "w-12 h-12 flex items-center justify-center shrink-0 border rounded bg-white p-0.5 shadow-2xs transition-all",
                  activeTab === 'kiri' ? "border-blue-500 ring-2 ring-blue-400/40" : "border-slate-200 dark:border-slate-700"
                )}>
                  {logoKiriUrl ? (
                    logoKiriUrl.startsWith('preset:') ? (
                      <OfficialNationalLogo logoIdOrUrl={logoKiriUrl} className="w-full h-full" />
                    ) : (
                      <img 
                        src={logoKiriUrl} 
                        alt="Logo Sebelah Kiri" 
                        className="w-full h-full object-contain" 
                        referrerPolicy="no-referrer"
                      />
                    )
                  ) : (
                    <TutWuriHandayaniSDLogo className="w-full h-full" />
                  )}
                </div>
                <span className={cn(
                  "text-[8px] font-black px-1 py-0.2 rounded uppercase",
                  activeTab === 'kiri' ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"
                )}>
                  Kiri
                </span>
              </div>

              {/* TEKS KOP TENGAH */}
              <div className="flex-1 min-w-0 text-center px-1">
                <div className="text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider leading-tight">
                  PEMERINTAH KABUPATEN {(schoolProfile.kabupatenKota || 'KUANTAN SINGINGI').toUpperCase()}
                </div>
                <div className="text-[8.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-tight">
                  DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA
                </div>
                <div className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase leading-tight truncate mt-0.5">
                  {schoolProfile.namaSekolah}
                </div>
                <div className="text-[8px] text-slate-500 dark:text-slate-400 leading-none mt-0.5">
                  NPSN: {schoolProfile.npsn} | {schoolProfile.alamatJalan || schoolProfile.alamatSekolah}
                </div>
              </div>

              {/* POSISI LOGO KANAN */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className={cn(
                  "w-12 h-12 flex items-center justify-center shrink-0 border rounded bg-white p-0.5 shadow-2xs transition-all",
                  activeTab === 'kanan' ? "border-indigo-500 ring-2 ring-indigo-400/40" : "border-slate-200 dark:border-slate-700"
                )}>
                  {logoKananUrl ? (
                    <img 
                      src={logoKananUrl} 
                      alt="Logo Sebelah Kanan" 
                      className="w-full h-full object-contain" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <TutWuriHandayaniSDLogo className="w-full h-full" />
                  )}
                </div>
                <span className={cn(
                  "text-[8px] font-black px-1 py-0.2 rounded uppercase",
                  activeTab === 'kanan' ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-700"
                )}>
                  Kanan
                </span>
              </div>

            </div>
          </div>

          {/* Success toast banner */}
          {saveSuccess && (
            <div className="p-3.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2 border border-emerald-300 dark:border-emerald-800 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Logo kop surat sebelah kiri, sebelah kanan, dan stempel resmi berhasil disimpan!</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#003399] hover:bg-[#002266] text-white text-xs font-extrabold rounded-xl shadow-md transition-all cursor-pointer hover:scale-102"
          >
            <Check className="w-4 h-4" />
            <span>Simpan Perubahan Logo</span>
          </button>
        </div>

      </div>
    </div>
  );
};
