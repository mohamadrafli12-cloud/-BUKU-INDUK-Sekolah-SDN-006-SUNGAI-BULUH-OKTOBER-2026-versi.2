import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  FileText, 
  ArrowRight, 
  RefreshCw,
  Eye,
  Check,
  AlertCircle,
  UserCheck,
  UserPlus,
  Building,
  School,
  Sparkles
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { 
  downloadMutasiExcelTemplate, 
  parseMutasiExcelFile, 
  ImportMutasiSummary, 
  ParsedMutasiRowResult 
} from '../../utils/excelHelper';
import { cn } from '../../lib/utils';

interface ImportMutasiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ImportMutasiModal: React.FC<ImportMutasiModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  const { schoolProfile, students, importMutationsBulk } = useSchool();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseSummary, setParseSummary] = useState<ImportMutasiSummary | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [duplicateStrategy, setDuplicateStrategy] = useState<'update' | 'skip' | 'append'>('update');
  const [previewFilter, setPreviewFilter] = useState<'all' | 'valid' | 'matched' | 'new' | 'invalid'>('all');
  const [importResult, setImportResult] = useState<{ added: number; updated: number; skipped: number } | null>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    downloadMutasiExcelTemplate(schoolProfile);
  };

  const processFile = async (file: File) => {
    setSelectedFile(file);
    setIsParsing(true);
    setParseError(null);
    setParseSummary(null);
    setImportResult(null);

    try {
      const summary = await parseMutasiExcelFile(file, students);
      setParseSummary(summary);
    } catch (err: any) {
      setParseError(err?.message || 'Gagal membaca atau memproses berkas Excel data mutasi.');
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

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const validExtensions = ['.xlsx', '.xls', '.csv'];
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (validExtensions.includes(ext)) {
        processFile(file);
      } else {
        setParseError('Format berkas tidak didukung. Harap upload file .xlsx, .xls, atau .csv');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleExecuteImport = () => {
    if (!parseSummary) return;

    const validRows = parseSummary.results.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setParseError('Tidak ada baris data valid yang dapat diimpor.');
      return;
    }

    const payload = validRows.map((r) => ({
      studentIdentifier: r.studentIdentifier,
      mutationData: r.mutationData,
      studentBasics: r.studentBasics,
    }));

    const result = importMutationsBulk(payload, duplicateStrategy);
    setImportResult(result);
    if (onSuccess) {
      onSuccess();
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParseSummary(null);
    setParseError(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Filter preview rows
  const filteredRows = parseSummary?.results.filter((row) => {
    if (previewFilter === 'valid') return row.isValid;
    if (previewFilter === 'matched') return row.isValid && row.matchedStudent !== undefined;
    if (previewFilter === 'new') return row.isValid && !row.matchedStudent;
    if (previewFilter === 'invalid') return !row.isValid;
    return true;
  }) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-orange-500/20 bg-linear-to-r from-orange-600 via-amber-600 to-orange-700 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white border border-white/30 shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base md:text-lg tracking-wide uppercase">
                  Impor Data Mutasi & Surat Pindah (Excel)
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-white text-orange-700 uppercase tracking-wider">
                  Sheet TINGGALKAN
                </span>
              </div>
              <p className="text-xs text-orange-100">
                Format kolom disesuaikan 100% dengan Form Pengisian Surat Keterangan Pindah Sekolah
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800 dark:text-slate-100 text-xs">
          
          {/* STEP 1: DOWNLOAD TEMPLATE BANNER */}
          <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-orange-600 text-white shadow-xs shrink-0 mt-0.5">
                <Download className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-orange-950 dark:text-orange-200">
                  Unduh Template Excel Mutasi Sesuai Form Surat Pindah
                </h4>
                <p className="text-xs text-orange-800 dark:text-orange-300/90 leading-relaxed">
                  Gunakan format resmi dengan 22 kolom lengkap: Identitas Siswa (NIS, NISN, Nama, JK, Kelas), No & Tanggal Surat, Tempat Surat, Pemohon & Pekerjaan, Sekolah Tujuan, Desa/Kec/Kab/Prov Tujuan, Alasan Pindah, Kepala Sekolah & NIP.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-2 shadow-md hover:shadow-lg transition-all shrink-0 cursor-pointer w-full md:w-auto justify-center"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Template Mutasi (.xlsx)</span>
            </button>
          </div>

          {/* SUCCESS STATE */}
          {importResult ? (
            <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-4 animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-extrabold text-emerald-900 dark:text-emerald-100">
                  Impor Data Mutasi Berhasil Disimpan!
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 max-w-lg mx-auto">
                  Data mutasi siswa dan arsip Surat Keterangan Pindah Sekolah telah resmi dicatat ke dalam database Buku Induk.
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-2">
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-emerald-200 dark:border-emerald-900 shadow-xs">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Siswa Dimutasikan</div>
                  <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
                    {importResult.updated}
                  </div>
                </div>
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-emerald-200 dark:border-emerald-900 shadow-xs">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Siswa Baru Dicatat</div>
                  <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {importResult.added}
                  </div>
                </div>
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-emerald-200 dark:border-emerald-900 shadow-xs">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Dilewati</div>
                  <div className="text-xl font-extrabold text-slate-500 dark:text-slate-400 mt-0.5">
                    {importResult.skipped}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Impor Berkas Lain
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-[#003399] hover:bg-[#002266] text-white font-bold shadow-md cursor-pointer"
                >
                  Lihat Buku Mutasi
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* UPLOAD / DROPZONE AREA */}
              {!selectedFile ? (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={cn(
                    "border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3",
                    dragActive
                      ? "border-orange-500 bg-orange-50/80 dark:bg-orange-950/30 scale-[1.01]"
                      : "border-slate-300 dark:border-slate-700 hover:border-orange-400 bg-slate-50/50 dark:bg-slate-800/40"
                  )}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 flex items-center justify-center shadow-xs">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                      Tarik & lepas file Excel (.xlsx / .xls / .csv) di sini
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      atau <span className="text-orange-600 dark:text-orange-400 font-bold underline">pilih berkas dari komputer</span>
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/60 dark:bg-slate-700/60 text-[10px] text-slate-600 dark:text-slate-300">
                    <span>Mendukung file Microsoft Excel (.xlsx, .xls) & CSV</span>
                  </div>
                </div>
              ) : (
                /* SELECTED FILE CARD */
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-slate-900 dark:text-slate-100 truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    title="Ganti Berkas"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* PARSING LOADER */}
              {isParsing && (
                <div className="p-6 text-center space-y-2">
                  <RefreshCw className="w-6 h-6 text-orange-600 animate-spin mx-auto" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    Menganalisis kolom dan memvalidasi kecocokan data siswa...
                  </p>
                </div>
              )}

              {/* ERROR ALERT */}
              {parseError && (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h5 className="font-bold text-xs">Terjadi Kendala Memproses Berkas</h5>
                    <p className="text-[11px] mt-0.5">{parseError}</p>
                  </div>
                </div>
              )}

              {/* SUMMARY & PREVIEW TABLE */}
              {parseSummary && !isParsing && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Summary Metric Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Total Baris Terbaca</div>
                      <div className="text-lg font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">
                        {parseSummary.totalRows}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60">
                      <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">Baris Valid</div>
                      <div className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300 mt-0.5">
                        {parseSummary.validRows}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60">
                      <div className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase">Cocok di Buku Induk</div>
                      <div className="text-lg font-extrabold text-blue-700 dark:text-blue-300 mt-0.5">
                        {parseSummary.matchedCount} Siswa
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60">
                      <div className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase">Siswa Baru / Arsip</div>
                      <div className="text-lg font-extrabold text-purple-700 dark:text-purple-300 mt-0.5">
                        {parseSummary.newStudentCount} Siswa
                      </div>
                    </div>
                  </div>

                  {/* DUPLICATE STRATEGY SELECTOR */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">
                        Perlakuan terhadap Siswa yang Cocok di Buku Induk:
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Tentukan tindakan jika NIS / NISN / Nama siswa telah terdaftar sebelumnya
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={duplicateStrategy}
                        onChange={(e) => setDuplicateStrategy(e.target.value as any)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs cursor-pointer"
                      >
                        <option value="update">Perbarui Status & Data Mutasi (Disarankan)</option>
                        <option value="skip">Lewati Jika Sudah Mutasi Keluar</option>
                        <option value="append">Daftarkan Sebagai Entri Terpisah</option>
                      </select>
                    </div>
                  </div>

                  {/* PREVIEW FILTER TABS */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                    <div className="flex items-center gap-1.5 overflow-x-auto">
                      <button
                        type="button"
                        onClick={() => setPreviewFilter('all')}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                          previewFilter === 'all'
                            ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        )}
                      >
                        Semua ({parseSummary.totalRows})
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewFilter('matched')}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                          previewFilter === 'matched'
                            ? "bg-blue-600 text-white shadow-xs"
                            : "text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                        )}
                      >
                        Cocok Buku Induk ({parseSummary.matchedCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewFilter('new')}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                          previewFilter === 'new'
                            ? "bg-purple-600 text-white shadow-xs"
                            : "text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50"
                        )}
                      >
                        Siswa Baru ({parseSummary.newStudentCount})
                      </button>
                      {parseSummary.invalidRows > 0 && (
                        <button
                          type="button"
                          onClick={() => setPreviewFilter('invalid')}
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                            previewFilter === 'invalid'
                              ? "bg-rose-600 text-white shadow-xs"
                              : "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                          )}
                        >
                          Ada Kendala ({parseSummary.invalidRows})
                        </button>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                      Menampilkan {filteredRows.length} dari {parseSummary.totalRows} baris
                    </span>
                  </div>

                  {/* PREVIEW TABLE */}
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 sticky top-0 z-10 font-bold border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="py-2.5 px-3 w-10 text-center">Baris</th>
                          <th className="py-2.5 px-3">Status Kecocokan</th>
                          <th className="py-2.5 px-3">Identitas Siswa</th>
                          <th className="py-2.5 px-3">Surat Pindah</th>
                          <th className="py-2.5 px-3">Sekolah Tujuan</th>
                          <th className="py-2.5 px-3">Pemohon</th>
                          <th className="py-2.5 px-3">Alasan Pindah</th>
                          <th className="py-2.5 px-3 w-28">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                        {filteredRows.map((row) => (
                          <tr 
                            key={row.rowNumber}
                            className={cn(
                              "hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors",
                              !row.isValid && "bg-rose-50/60 dark:bg-rose-950/20"
                            )}
                          >
                            <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                              {row.rowNumber}
                            </td>
                            <td className="py-2.5 px-3">
                              {row.matchedStudent ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 text-[10px] font-extrabold">
                                  <UserCheck className="w-3 h-3 text-blue-600" />
                                  <span>Cocok ({row.matchType.toUpperCase()})</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-200 text-[10px] font-bold">
                                  <UserPlus className="w-3 h-3 text-purple-600" />
                                  <span>Siswa Baru</span>
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-900 dark:text-slate-100">
                                {row.studentIdentifier.namaLengkap || '-'}
                              </div>
                              <div className="font-mono text-[10px] text-slate-500">
                                NIS: {row.studentIdentifier.noInduk || '-'} • NISN: {row.studentIdentifier.nisn || '-'} • Kls: {row.studentBasics.kelasSekarang}
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-mono text-[10px] font-bold text-orange-700 dark:text-orange-300">
                                {row.mutationData.noSuratPindah || '-'}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                Tgl: {row.mutationData.tglMeninggalkan || '-'} ({row.mutationData.tempatSurat})
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-800 dark:text-slate-200">
                                {row.mutationData.sekolahTujuan}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {[row.mutationData.desaKelurahanTujuan, row.mutationData.kecamatanTujuan, row.mutationData.kabupatenKotaTujuan, row.mutationData.provinsiTujuan]
                                  .filter(Boolean)
                                  .join(', ')}
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-slate-800 dark:text-slate-200">
                                {row.mutationData.namaPemohon || '-'}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {row.mutationData.hubunganPemohon} • {row.mutationData.pekerjaanPemohon}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                              {row.mutationData.alasanPindah}
                            </td>
                            <td className="py-2.5 px-3">
                              {row.isValid ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[10px]">
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Valid</span>
                                </span>
                              ) : (
                                <div className="space-y-0.5">
                                  {row.errors.map((err, eIdx) => (
                                    <div key={eIdx} className="text-rose-600 text-[10px] font-bold flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3 shrink-0" />
                                      <span>{err}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Template Mutasi</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Tutup
            </button>
            {parseSummary && !importResult && (
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={parseSummary.validRows === 0}
                className={cn(
                  "px-5 py-2 rounded-xl text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer",
                  parseSummary.validRows > 0
                    ? "bg-orange-600 hover:bg-orange-700 hover:shadow-lg active:scale-98"
                    : "bg-slate-400 cursor-not-allowed opacity-60"
                )}
              >
                <Upload className="w-4 h-4" />
                <span>Simpan {parseSummary.validRows} Data Mutasi</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
