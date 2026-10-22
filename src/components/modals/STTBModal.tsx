import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  GraduationCap, 
  Save, 
  CheckCircle2, 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Eye, 
  Loader2, 
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { Student, GraduationSTTB } from '../../types';
import { compressImageFile } from '../../utils/imageCompressor';
import { IjazahViewerModal } from './IjazahViewerModal';

interface STTBModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (studentId: string, sttb: GraduationSTTB) => void;
}

export const STTBModal: React.FC<STTBModalProps> = ({
  student,
  isOpen,
  onClose,
  onSave,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<GraduationSTTB>({
    lulusTahun: `${new Date().getFullYear()}`,
    tanggalKelulusan: new Date().toISOString().split('T')[0],
    noIjazah: '',
    noSkhu: '',
    noPesertaUN: '',
    melanjutkanKe: 'SMP Negeri 1 Singingi Hilir',
    tglSerahTerima: new Date().toISOString().split('T')[0],
    namaPenerima: '',
    hubunganPenerima: 'Orang Tua / Wali',
    statusTandaTerima: 'Sudah Diterima',
    catatan: 'Ijazah Asli dan SKHU telah diserahkan lengkap dan ditandatangani.',
    fotoIjazah: '',
  });

  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  useEffect(() => {
    if (student) {
      setFormData({
        lulusTahun: student.sttb?.lulusTahun || `${new Date().getFullYear()}`,
        tanggalKelulusan: student.sttb?.tanggalKelulusan || new Date().toISOString().split('T')[0],
        noIjazah: student.sttb?.noIjazah || `DN-09/D-SD/K13/${String(new Date().getFullYear()).slice(-2)}/${Math.floor(1000000 + Math.random() * 9000000)}`,
        noSkhu: student.sttb?.noSkhu || `SKHU-SD/${new Date().getFullYear()}/${student.noInduk}`,
        noPesertaUN: student.sttb?.noPesertaUN || `04-006-${String(Math.floor(1 + Math.random() * 99)).padStart(3, '0')}-8`,
        melanjutkanKe: student.sttb?.melanjutkanKe || 'SMP Negeri 1 Singingi Hilir',
        tglSerahTerima: student.sttb?.tglSerahTerima || new Date().toISOString().split('T')[0],
        namaPenerima: student.sttb?.namaPenerima || student.ayah.nama || student.ibu.nama,
        hubunganPenerima: student.sttb?.hubunganPenerima || 'Ayah Kandung',
        statusTandaTerima: student.sttb?.statusTandaTerima || 'Sudah Diterima',
        catatan: student.sttb?.catatan || 'Ijazah Asli dan SKHU telah diserahkan lengkap dan ditandatangani.',
        fotoIjazah: student.sttb?.fotoIjazah || '',
        tglUploadIjazah: student.sttb?.tglUploadIjazah,
      });
      setUploadError(null);
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
      const result = await compressImageFile(file, 1000, 1000, 0.78);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(student.id, formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-emerald-700 text-white">
          <div className="flex items-center gap-2.5">
            <GraduationCap className="w-6 h-6" />
            <div>
              <h3 className="text-sm font-bold tracking-wide">
                STTB / IJAZAH & SERAH TERIMA DOKUMEN
              </h3>
              <p className="text-[11px] text-emerald-100">
                Pencatatan Buku Induk Nomor Seri Ijazah & Kelulusan
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student banner */}
        <div className="px-6 py-3 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-900 text-xs flex items-center justify-between">
          <div>
            <span className="font-extrabold text-slate-900 dark:text-slate-100">{student.namaLengkap}</span>
            <div className="text-[11px] text-slate-500">NIS: {student.noInduk} | NISN: {student.nisn}</div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 font-bold text-[10px]">
            Tingkat Akhir
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tahun Kelulusan (TP) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.lulusTahun || ''}
                onChange={(e) => setFormData({ ...formData, lulusTahun: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Kelulusan Resmi
              </label>
              <input
                type="date"
                value={formData.tanggalKelulusan || ''}
                onChange={(e) => setFormData({ ...formData, tanggalKelulusan: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nomor Seri Ijazah (DN) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.noIjazah || ''}
                onChange={(e) => setFormData({ ...formData, noIjazah: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                placeholder="DN-09/D-SD/..."
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nomor SKHU
              </label>
              <input
                type="text"
                value={formData.noSkhu || ''}
                onChange={(e) => setFormData({ ...formData, noSkhu: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                placeholder="SKHU-SD/..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nomor Peserta Ujian (UN/ANBK)
              </label>
              <input
                type="text"
                value={formData.noPesertaUN || ''}
                onChange={(e) => setFormData({ ...formData, noPesertaUN: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                placeholder="04-006-..."
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Melanjutkan Ke Sekolah / Ponpes
              </label>
              <input
                type="text"
                value={formData.melanjutkanKe || ''}
                onChange={(e) => setFormData({ ...formData, melanjutkanKe: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                placeholder="SMPN 1 Singingi Hilir"
              />
            </div>
          </div>

          {/* UPLOAD SCAN / GAMBAR IJAZAH */}
          <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Upload Gambar / Scan Ijazah Asli</span>
                <span className="text-[10px] font-normal text-slate-500">(JPG, PNG, WEBP)</span>
              </label>
              {formData.fotoIjazah && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Gambar Terlampir</span>
                </span>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {/* Upload area or Preview */}
            {formData.fotoIjazah ? (
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div
                    onClick={() => setIsViewerOpen(true)}
                    className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer group shrink-0 bg-slate-100 dark:bg-slate-800 shadow-xs"
                    title="Klik untuk memperbesar gambar ijazah"
                  >
                    <img
                      src={formData.fotoIjazah}
                      alt="Pratinjau Ijazah"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Eye className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 text-xs">
                    <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                      Ijazah: {formData.noIjazah || student.namaLengkap}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Tersimpan untuk ditampilkan di profil peserta didik
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsViewerOpen(true)}
                      className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-0.5 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Lihat Ukuran Penuh (Pratinjau)</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isCompressing}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>Ganti Gambar</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
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
                className={`p-4 rounded-xl border-2 border-dashed text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 bg-white dark:bg-slate-900/60 ${
                  isDragging
                    ? "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40"
                    : "border-slate-300 dark:border-slate-700 hover:border-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                }`}
              >
                {isCompressing ? (
                  <div className="flex items-center gap-2 text-emerald-600 font-bold py-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Mengoptimalkan berkas gambar...</span>
                  </div>
                ) : (
                  <>
                    <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Pilih atau Seret Foto / Scan Ijazah ke Sini
                    </div>
                    <p className="text-[11px] text-slate-500 max-w-sm">
                      Upload gambar ijazah asli untuk ditampilkan di profil siswa & arsip digital Buku Induk
                    </p>
                  </>
                )}
              </div>
            )}

            {uploadError && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg border border-rose-200 dark:border-rose-900">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">
              Berita Acara Serah Terima Ijazah Fisik
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Status Pengambilan</label>
                <select
                  value={formData.statusTandaTerima || 'Sudah Diterima'}
                  onChange={(e) => setFormData({ ...formData, statusTandaTerima: e.target.value as any })}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                >
                  <option value="Sudah Diterima">Sudah Diterima</option>
                  <option value="Belum Diambil">Belum Diambil</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Tanggal Serah Terima</label>
                <input
                  type="date"
                  value={formData.tglSerahTerima || ''}
                  onChange={(e) => setFormData({ ...formData, tglSerahTerima: e.target.value })}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Nama Penerima</label>
                <input
                  type="text"
                  value={formData.namaPenerima || ''}
                  onChange={(e) => setFormData({ ...formData, namaPenerima: e.target.value })}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  placeholder="Nama Orang Tua / Siswa"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>Simpan STTB & Ijazah</span>
            </button>
          </div>
        </form>
      </div>

      {/* Lightbox Pratinjau Gambar Ijazah */}
      <IjazahViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        imageUrl={formData.fotoIjazah}
        student={student}
      />
    </div>
  );
};
