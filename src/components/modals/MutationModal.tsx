import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  UserMinus, 
  Save, 
  AlertTriangle, 
  Upload, 
  Trash2, 
  Eye, 
  AlertCircle, 
  Loader2, 
  FileText, 
  CheckCircle2, 
  RotateCcw,
  Printer,
  Sparkles,
  School,
  User,
  MapPin,
  Calendar,
  FileCheck2
} from 'lucide-react';
import { Student, MutationRecord } from '../../types';
import { useSchool } from '../../context/SchoolContext';
import { compressImageFile } from '../../utils/imageCompressor';
import { IjazahViewerModal } from './IjazahViewerModal';
import { SuratPindahDocument } from '../common/SuratPindahDocument';
import { getRomanMonth } from '../../lib/utils';

interface MutationModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (studentId: string, mutation: MutationRecord) => void;
}

export const MutationModal: React.FC<MutationModalProps> = ({
  student,
  isOpen,
  onClose,
  onSave,
}) => {
  const { cancelMutation, currentRole, rolePermissions, schoolProfile } = useSchool();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');

  const [formData, setFormData] = useState<MutationRecord>({
    tglMeninggalkan: new Date().toISOString().split('T')[0],
    dariKelas: '4',
    sekolahTujuan: '',
    desaKelurahanTujuan: '',
    kecamatanTujuan: '',
    kabupatenKotaTujuan: '',
    provinsiTujuan: 'RIAU',
    alasanPindah: 'Mengikuti Orang Tua',
    noSuratPindah: '',
    dikeluarkanTanggal: new Date().toISOString().split('T')[0],
    tempatSurat: 'Sungai Buluh',
    namaPemohon: '',
    pekerjaanPemohon: 'Mengurus Rumah Tangga',
    hubunganPemohon: 'Ibu Kandung',
    namaKepalaSekolah: '',
    nipKepalaSekolah: '',
    jabatanPenandatangan: 'Kepala Sekolah',
    keterangan: 'Surat Keterangan Pindah Sekolah resmi telah diterbitkan sesuai permohonan orang tua/wali.',
    fotoIjazah: '',
    tglUploadIjazah: undefined,
  });

  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [restoreClassChoice, setRestoreClassChoice] = useState('');

  // Generate standardized official surat nomor: 422.1 /SDN-006/SB/X/2026/ 142
  const generateNomorSurat = (tgl?: string) => {
    const d = tgl ? new Date(tgl) : new Date();
    const year = !isNaN(d.getFullYear()) ? d.getFullYear() : new Date().getFullYear();
    const roman = getRomanMonth(d);
    const randomSeq = Math.floor(100 + Math.random() * 899);
    return `422.1 /SDN-006/SB/${roman}/${year}/ ${randomSeq}`;
  };

  useEffect(() => {
    if (student) {
      const todayISO = new Date().toISOString().split('T')[0];
      const defaultDate = student.mutasi?.tglMeninggalkan || student.mutasi?.dikeluarkanTanggal || todayISO;

      // Extract numeric or raw class name (e.g. "Kelas 4" -> "4")
      const currentClassRaw = student.mutasi?.dariKelas || student.kelasSekarang || '4';
      const cleanClass = currentClassRaw.replace(/^kelas\s*/i, '').trim() || currentClassRaw;

      // Default Parent / Guardian
      const ibuNama = student.ibu?.nama?.trim();
      const ayahNama = student.ayah?.nama?.trim();
      const waliNama = student.wali?.nama?.trim();
      const defaultPemohon = student.mutasi?.namaPemohon || ibuNama || ayahNama || waliNama || 'NENI FITRIANI';

      const ibuPekerjaan = student.ibu?.pekerjaan?.trim();
      const ayahPekerjaan = student.ayah?.pekerjaan?.trim();
      const waliPekerjaan = student.wali?.pekerjaan?.trim();
      const defaultPekerjaan = student.mutasi?.pekerjaanPemohon || ibuPekerjaan || ayahPekerjaan || waliPekerjaan || 'Mengurus Rumah Tangga';

      const defaultNo = student.mutasi?.noSuratPindah || generateNomorSurat(defaultDate);

      setFormData({
        tglMeninggalkan: defaultDate,
        dikeluarkanTanggal: student.mutasi?.dikeluarkanTanggal || defaultDate,
        dariKelas: cleanClass,
        sekolahTujuan: student.mutasi?.sekolahTujuan || 'SD Negeri 182 Pekanbaru',
        desaKelurahanTujuan: student.mutasi?.desaKelurahanTujuan || 'Pasir Putih',
        kecamatanTujuan: student.mutasi?.kecamatanTujuan || 'Air Dingin',
        kabupatenKotaTujuan: student.mutasi?.kabupatenKotaTujuan || 'Pekanbaru',
        provinsiTujuan: student.mutasi?.provinsiTujuan || 'RIAU',
        alasanPindah: student.mutasi?.alasanPindah || 'Mengikuti Orang Tua',
        noSuratPindah: defaultNo,
        tempatSurat: student.mutasi?.tempatSurat || schoolProfile.desaKelurahan || schoolProfile.desa || 'Sungai Buluh',
        namaPemohon: defaultPemohon,
        pekerjaanPemohon: defaultPekerjaan,
        hubunganPemohon: student.mutasi?.hubunganPemohon || (ibuNama ? 'Ibu Kandung' : ayahNama ? 'Ayah Kandung' : 'Wali Murid'),
        namaKepalaSekolah: student.mutasi?.namaKepalaSekolah || schoolProfile.namaKepalaSekolah || 'WINARNI,S.Pd.SD',
        nipKepalaSekolah: student.mutasi?.nipKepalaSekolah || schoolProfile.nipKepalaSekolah || '19790301 200801 2 017',
        jabatanPenandatangan: student.mutasi?.jabatanPenandatangan || 'Kepala Sekolah',
        keterangan: student.mutasi?.keterangan || 'Buku Induk dan Surat Keterangan Pindah Sekolah telah diterbitkan.',
        fotoIjazah: student.mutasi?.fotoIjazah || '',
        tglUploadIjazah: student.mutasi?.tglUploadIjazah,
      });

      setRestoreClassChoice(student.mutasi?.dariKelas || student.kelasSekarang || 'Kelas 1');
      setShowCancelConfirm(false);
      setUploadError(null);
      setActiveTab('form');
    }
  }, [student, isOpen]);

  if (!isOpen || !student) return null;

  const handleFileProcess = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Berkas harus berupa gambar berformat JPG, JPEG, PNG, atau WEBP.');
      return;
    }
    setUploadError(null);
    setIsCompressing(true);
    try {
      const result = await compressImageFile(file, 1400, 1400, 0.85);
      setFormData(prev => ({
        ...prev,
        fotoIjazah: result.dataUrl,
        tglUploadIjazah: new Date().toISOString(),
      }));
    } catch (err: any) {
      setUploadError(err.message || 'Gagal memproses berkas gambar.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileProcess(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      fotoIjazah: '',
      tglUploadIjazah: undefined,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSave(student.id, formData);
    onClose();
  };

  const handleSaveAndPrint = () => {
    onSave(student.id, formData);
    setActiveTab('preview');
    setTimeout(() => {
      window.print();
    }, 250);
  };

  const handleQuickPrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 bg-linear-to-r from-orange-600 to-amber-700 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl shadow-xs">
              <FileCheck2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold tracking-wide uppercase">
                {student.mutasi ? 'Edit Surat Keterangan Pindah Sekolah' : 'Form Pengisian Surat Keterangan Pindah Sekolah'}
              </h3>
              <p className="text-[11px] text-orange-100">
                Menu Buku Mutasi & Meninggalkan Sekolah • Sesuai Format Resmi Kedinasan
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Tutup Formulir"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher & Student Banner */}
        <div className="px-5 sm:px-6 py-2.5 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Quick Info Siswa */}
          <div className="flex items-center gap-3 text-xs">
            <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
              {student.namaLengkap}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-[11px] font-bold text-blue-700 dark:text-blue-300">
              NIS: {student.noInduk}
            </span>
            <span className="hidden sm:inline font-mono text-[11px] text-slate-500">
              NISN: {student.nisn}
            </span>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'form'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-orange-600'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Formulir Pengisian</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-orange-600'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Pratinjau Surat Resmi (PDF)</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'form' ? (
            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6 text-xs">
              {/* BAGIAN 1: NOMOR SURAT & TANGGAL */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-orange-600" />
                    <span>1. Identitas Surat & Tanggal Terbit</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, noSuratPindah: generateNomorSurat(prev.tglMeninggalkan) }))}
                    className="text-[10px] font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Format Baru Otomatis</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nomor Surat Keterangan Pindah Sekolah <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.noSuratPindah || ''}
                      onChange={(e) => setFormData({ ...formData, noSuratPindah: e.target.value })}
                      placeholder="422.1 /SDN-006/SB/X/2026/ 142"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-slate-800 dark:text-slate-100"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Sesuai format dinas: <code>422.1 /SDN-006/SB/[Bulan Romawi]/[Tahun]/ [No Urut]</code>
                    </p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tanggal Surat / Meninggalkan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.tglMeninggalkan || formData.dikeluarkanTanggal || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          tglMeninggalkan: val,
                          dikeluarkanTanggal: val,
                        }));
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tempat Penerbitan Surat (Kota/Desa)
                    </label>
                    <input
                      type="text"
                      value={formData.tempatSurat || ''}
                      onChange={(e) => setFormData({ ...formData, tempatSurat: e.target.value })}
                      placeholder="Sungai Buluh"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Kelas / Tingkat Terakhir Saat Pindah <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        value={formData.dariKelas || ''}
                        onChange={(e) => setFormData({ ...formData, dariKelas: e.target.value })}
                        placeholder="Contoh: 4"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    {/* Quick chips for class levels 1 - 6 */}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-[10px] text-slate-400">Pilih Cepat:</span>
                      {['1', '2', '3', '4', '5', '6'].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setFormData({ ...formData, dariKelas: lvl })}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                            formData.dariKelas === lvl
                              ? 'bg-orange-600 text-white'
                              : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-orange-50'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* BAGIAN 2: PERMINTAAN PINDAH OLEH ORANG TUA / WALI */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>2. Permintaan Pindah oleh Orang Tua / Wali Murid</span>
                  </span>
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="text-slate-400">Salin dari:</span>
                    {student.ibu?.nama && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          namaPemohon: student.ibu?.nama || '',
                          pekerjaanPemohon: student.ibu?.pekerjaan || 'Mengurus Rumah Tangga',
                          hubunganPemohon: 'Ibu Kandung',
                        }))}
                        className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold hover:bg-blue-100 cursor-pointer"
                      >
                        Ibu ({student.ibu.nama.split(' ')[0]})
                      </button>
                    )}
                    {student.ayah?.nama && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          namaPemohon: student.ayah?.nama || '',
                          pekerjaanPemohon: student.ayah?.pekerjaan || 'Wiraswasta',
                          hubunganPemohon: 'Ayah Kandung',
                        }))}
                        className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold hover:bg-blue-100 cursor-pointer"
                      >
                        Ayah ({student.ayah.nama.split(' ')[0]})
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      N a m a Orang Tua / Wali <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.namaPemohon || ''}
                      onChange={(e) => setFormData({ ...formData, namaPemohon: e.target.value.toUpperCase() })}
                      placeholder="Contoh: NENI FITRIANI"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 uppercase font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Pekerjaan Orang Tua / Wali <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.pekerjaanPemohon || ''}
                      onChange={(e) => setFormData({ ...formData, pekerjaanPemohon: e.target.value })}
                      placeholder="Contoh: Mengurus Rumah Tangga"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                    />
                    <div className="flex flex-wrap items-center gap-1 mt-1.5">
                      {['Mengurus Rumah Tangga', 'PNS / ASN', 'Wiraswasta', 'Karyawan Swasta', 'Petani / Pekebun', 'Buruh'].map((job) => (
                        <button
                          key={job}
                          type="button"
                          onClick={() => setFormData({ ...formData, pekerjaanPemohon: job })}
                          className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] text-slate-700 dark:text-slate-300 hover:bg-orange-100 dark:hover:bg-orange-950/60 cursor-pointer"
                        >
                          {job}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* BAGIAN 3: TELAH MENGAJUKAN PINDAH SEKOLAH KE */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="pb-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <School className="w-4 h-4 text-emerald-600" />
                    <span>3. Sekolah Tujuan Pindah (Telah Mengajukan Pindah Sekolah ke)</span>
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Sekolah Tujuan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sekolahTujuan || ''}
                    onChange={(e) => setFormData({ ...formData, sekolahTujuan: e.target.value })}
                    placeholder="Contoh: SD Negeri 182 Pekanbaru"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Desa / Kelurahan
                    </label>
                    <input
                      type="text"
                      value={formData.desaKelurahanTujuan || ''}
                      onChange={(e) => setFormData({ ...formData, desaKelurahanTujuan: e.target.value })}
                      placeholder="Pasir Putih"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Kecamatan
                    </label>
                    <input
                      type="text"
                      value={formData.kecamatanTujuan || ''}
                      onChange={(e) => setFormData({ ...formData, kecamatanTujuan: e.target.value })}
                      placeholder="Air Dingin"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Kabupaten / Kota
                    </label>
                    <input
                      type="text"
                      value={formData.kabupatenKotaTujuan || ''}
                      onChange={(e) => setFormData({ ...formData, kabupatenKotaTujuan: e.target.value })}
                      placeholder="Pekanbaru"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Provinsi
                    </label>
                    <input
                      type="text"
                      value={formData.provinsiTujuan || ''}
                      onChange={(e) => setFormData({ ...formData, provinsiTujuan: e.target.value.toUpperCase() })}
                      placeholder="RIAU"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* BAGIAN 4: DENGAN ALASAN */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="pb-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-rose-600" />
                    <span>4. Alasan Pindah (Dengan Alasan)</span>
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Alasan Pindah Sekolah <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.alasanPindah || ''}
                    onChange={(e) => setFormData({ ...formData, alasanPindah: e.target.value })}
                    placeholder="Contoh: Mengikuti Orang Tua"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                  />
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-slate-400">Pilihan Cepat:</span>
                    {[
                      'Mengikuti Orang Tua',
                      'Pindah Domisili Keluarga',
                      'Jarak Tempat Tinggal Terlalu Jauh',
                      'Keinginan Orang Tua / Keluarga',
                      'Mengikuti Pekerjaan Orang Tua',
                    ].map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setFormData({ ...formData, alasanPindah: reason })}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                          formData.alasanPindah === reason
                            ? 'bg-rose-600 text-white'
                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-rose-50'
                        }`}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* BAGIAN 5: PENANDATANGAN SURAT & DOKUMEN LAMPIRAN */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="pb-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <User className="w-4 h-4 text-purple-600" />
                    <span>5. Penandatangan Surat & Lampiran Berkas</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Kepala Sekolah Penandatangan
                    </label>
                    <input
                      type="text"
                      value={formData.namaKepalaSekolah || ''}
                      onChange={(e) => setFormData({ ...formData, namaKepalaSekolah: e.target.value })}
                      placeholder="WINARNI,S.Pd.SD"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      NIP Kepala Sekolah
                    </label>
                    <input
                      type="text"
                      value={formData.nipKepalaSekolah || ''}
                      onChange={(e) => setFormData({ ...formData, nipKepalaSekolah: e.target.value })}
                      placeholder="19790301 200801 2 017"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>
                </div>

                {/* Upload Scan Berkas Mutasi */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      <span>Lampiran Scan Berkas / Foto Dokumen Mutasi (Opsional)</span>
                    </label>
                    {formData.fotoIjazah && (
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Gambar Terlampir</span>
                      </span>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileInputChange}
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                  />

                  {formData.fotoIjazah ? (
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div
                          onClick={() => setIsViewerOpen(true)}
                          className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer group shrink-0 bg-slate-100 dark:bg-slate-800 shadow-xs"
                          title="Klik untuk memperbesar gambar ijazah/mutasi"
                        >
                          <img
                            src={formData.fotoIjazah}
                            alt="Pratinjau Ijazah/Mutasi"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Eye className="w-5 h-5" />
                          </div>
                        </div>

                        <div className="min-w-0 flex-1 text-xs">
                          <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                            Dokumen: {formData.sekolahTujuan || student.namaLengkap}
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Tersimpan untuk arsip digital dan profil peserta didik
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isCompressing}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5 text-slate-500" />
                          <span>Ganti Gambar</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-semibold cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`p-3.5 rounded-xl border-2 border-dashed text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 bg-white dark:bg-slate-900/60 ${
                        isDragging
                          ? "border-orange-500 bg-orange-50/70"
                          : "border-slate-300 dark:border-slate-700 hover:border-orange-400"
                      }`}
                    >
                      {isCompressing ? (
                        <div className="flex items-center gap-2 text-orange-600 font-bold py-1">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Memproses gambar...</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-orange-600" />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Klik atau Seret Berkas Gambar Surat Mutasi / Ijazah
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  {uploadError && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{uploadError}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Box Konfirmasi Pembatalan Mutasi */}
              {showCancelConfirm && (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-start gap-2.5 text-rose-800 dark:text-rose-200">
                    <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
                    <div>
                      <h4 className="font-extrabold text-xs">Konfirmasi Pembatalan Mutasi</h4>
                      <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5 leading-relaxed">
                        Catatan mutasi siswa <strong>{student.namaLengkap}</strong> akan dihapus dan status siswa dikembalikan menjadi <strong>AKTIF</strong> di Buku Induk.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
                      Kembalikan ke Kelas Aktif:
                    </label>
                    <select
                      value={restoreClassChoice}
                      onChange={(e) => setRestoreClassChoice(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                    >
                      {(schoolProfile?.daftarKelas && schoolProfile.daftarKelas.length > 0
                        ? schoolProfile.daftarKelas
                        : ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6']
                      ).map((cls) => (
                        <option key={cls} value={cls}>
                          {cls}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-rose-200 dark:border-rose-900/60">
                    <button
                      type="button"
                      onClick={() => setShowCancelConfirm(false)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white rounded-lg cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        cancelMutation(student.id, restoreClassChoice);
                        setShowCancelConfirm(false);
                        onClose();
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Ya, Batalkan Mutasi & Aktifkan</span>
                    </button>
                  </div>
                </div>
              )}
            </form>
          ) : (
            /* TAB PREVIEW: SURAT KETERANGAN PINDAH SEKOLAH EXACT MATCH PDF */
            <div className="p-4 sm:p-6 bg-slate-200 dark:bg-slate-950 flex flex-col items-center">
              <div className="w-full max-w-[210mm] mb-3 flex items-center justify-between no-print">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Pratinjau Format Sesuai Berkas PDF Resmi</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('form')}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                  >
                    Edit Formulir
                  </button>
                  <button
                    type="button"
                    onClick={handleQuickPrint}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Sekarang (Ctrl+P)</span>
                  </button>
                </div>
              </div>

              {/* The exact official document */}
              <div className="shadow-2xl border border-slate-300 rounded-sm w-full max-w-[210mm]">
                <SuratPindahDocument
                  student={student}
                  schoolProfile={schoolProfile}
                  mutation={formData}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div>
            {student.mutasi && currentRole !== 'umum' && rolePermissions?.inputMutasi !== false && !showCancelConfirm && (
              <button
                type="button"
                onClick={() => setShowCancelConfirm(true)}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold cursor-pointer w-full sm:w-auto"
                title="Batalkan mutasi dan kembalikan siswa menjadi aktif di Buku Induk"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                <span>Batalkan Mutasi</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl cursor-pointer text-xs"
            >
              Tutup
            </button>

            {activeTab === 'form' ? (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  <span>Lihat Pratinjau</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-xs cursor-pointer text-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Data</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveAndPrint}
                  className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md cursor-pointer text-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Simpan & Cetak Surat</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('form')}
                  className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold cursor-pointer"
                >
                  Kembali ke Form
                </button>
                <button
                  type="button"
                  onClick={handleQuickPrint}
                  className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md cursor-pointer text-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Surat (PDF)</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox / Fullscreen Viewer */}
      {isViewerOpen && formData.fotoIjazah && (
        <IjazahViewerModal
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          imageUrl={formData.fotoIjazah}
          student={student}
        />
      )}
    </div>
  );
};
