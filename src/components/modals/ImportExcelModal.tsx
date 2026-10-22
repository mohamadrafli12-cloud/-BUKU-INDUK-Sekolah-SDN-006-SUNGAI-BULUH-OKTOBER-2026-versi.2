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
  AlertCircle
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { downloadExcelTemplate, parseExcelOrCsvFile, ImportParseSummary, ParsedRowResult } from '../../utils/excelHelper';
import { cn } from '../../lib/utils';

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ImportExcelModal: React.FC<ImportExcelModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { schoolProfile, importStudentsBulk, students } = useSchool();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseSummary, setParseSummary] = useState<ImportParseSummary | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [duplicateStrategy, setDuplicateStrategy] = useState<'update' | 'skip' | 'append'>('update');
  const [previewFilter, setPreviewFilter] = useState<'all' | 'valid' | 'invalid'>('all');
  const [importResult, setImportResult] = useState<{ added: number; updated: number; skipped: number } | null>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    downloadExcelTemplate(schoolProfile.namaSekolah);
  };

  const processFile = async (file: File) => {
    setSelectedFile(file);
    setIsParsing(true);
    setParseError(null);
    setParseSummary(null);
    setImportResult(null);

    try {
      const summary = await parseExcelOrCsvFile(file);
      setParseSummary(summary);
    } catch (err: any) {
      setParseError(err?.message || 'Gagal membaca atau memproses berkas Excel.');
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

    const validItems = parseSummary.results
      .filter((r) => r.isValid)
      .map((r) => r.data);

    if (validItems.length === 0) {
      setParseError('Tidak ada baris data valid yang dapat diimpor.');
      return;
    }

    const result = importStudentsBulk(validItems, duplicateStrategy);
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
    if (previewFilter === 'invalid') return !row.isValid;
    return true;
  }) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-[#003399] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300 border border-white/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-wide text-white">
                Impor Data Siswa via Excel / Spreadsheet
              </h3>
              <p className="text-xs text-blue-100">
                Pemasukan data buku induk secara massal dengan template standar Kemdikbud
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-slate-50/50 dark:bg-slate-950/20">

          {/* Success Notification Result */}
          {importResult && (
            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Impor Data Siswa Berhasil Dilakukan!</h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    Data siswa telah tersimpan otomatis ke dalam buku induk sekolah dan siap digunakan.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                  <span className="text-slate-500 block text-[11px]">Siswa Baru Ditambahkan</span>
                  <strong className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">{importResult.added}</strong>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                  <span className="text-slate-500 block text-[11px]">Data Siswa Diperbarui</span>
                  <strong className="text-base font-extrabold text-blue-600 dark:text-blue-400">{importResult.updated}</strong>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                  <span className="text-slate-500 block text-[11px]">Dilewati (Duplikat)</span>
                  <strong className="text-base font-extrabold text-slate-600 dark:text-slate-400">{importResult.skipped}</strong>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-xs font-bold bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 rounded-xl hover:bg-emerald-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Impor File Lain
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Selesai & Lihat Data Siswa
                </button>
              </div>
            </div>
          )}

          {/* Section 1: Template Download Box */}
          {!importResult && (
            <div className="p-4 md:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-[#003399] dark:text-blue-300 font-extrabold text-xs flex items-center justify-center shrink-0">
                      1
                    </span>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                      Unduh Template Format Excel
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 pl-8">
                    Gunakan template resmi berurutan 69 kolom field Dapodik Kemdikbud (No, Nama, NIPD, JK, NISN, Tempat/Tgl Lahir, Rombel, NIK, Usia, Agama, Alamat, RT/RW, Dusun, Kelurahan, Kecamatan, Kabupaten, Provinsi, Kode Pos, Data Ayah/Ibu/Wali, KIP, PIP, Rekening Bank, Fisik, dll) lengkap dengan 2 baris contoh dan lembar panduan pengisian.
                  </p>
                </div>

                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-sm hover:shadow-md transition-all shrink-0 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Template (.XLSX)</span>
                </button>
              </div>

              {/* Template highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px] text-slate-600 dark:text-slate-400">
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Kolom Utama:</strong> Nama, NIPD (NIS), JK (L/P), NISN, & Rombel/Kelas.</span>
                </div>
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Format Tanggal:</strong> YYYY-MM-DD (contoh: 2011-05-12) atau DD/MM/YYYY.</span>
                </div>
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Lembar Petunjuk:</strong> Terdapat panduan lengkap arti dan pilihan isi tiap kolom.</span>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Upload Area */}
          {!importResult && (
            <div className="p-4 md:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-[#003399] dark:text-blue-300 font-extrabold text-xs flex items-center justify-center shrink-0">
                  2
                </span>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  Unggah Berkas Excel / CSV yang Telah Diisi
                </h4>
              </div>

              {/* Hidden input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />

              {!selectedFile ? (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3",
                    dragActive
                      ? "border-[#003399] bg-blue-50/50 dark:bg-blue-950/20"
                      : "border-slate-300 dark:border-slate-700 hover:border-blue-500 bg-slate-50/50 dark:bg-slate-800/30"
                  )}
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-[#003399] dark:text-blue-400 shadow-inner">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Tarik & lepas file Excel di sini, atau <span className="text-[#003399] dark:text-blue-400 underline">klik untuk memilih</span>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Mendukung format .XLSX, .XLS, atau .CSV (Maksimal 5.000 data per file)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                        {selectedFile.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Ukuran: {(selectedFile.size / 1024).toFixed(1)} KB • Tipe: {selectedFile.type || 'Spreadsheet'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Ganti File
                    </button>
                    <button
                      onClick={handleReset}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Batalkan"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Parsing State */}
              {isParsing && (
                <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Sedang memproses dan memvalidasi baris data...</span>
                </div>
              )}

              {/* Error Message */}
              {parseError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}
            </div>
          )}

          {/* Section 3: Data Preview & Strategy Selection */}
          {!importResult && parseSummary && parseSummary.totalRows > 0 && (
            <div className="p-4 md:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-[#003399] dark:text-blue-300 font-extrabold text-xs flex items-center justify-center shrink-0">
                      3
                    </span>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                      Hasil Pratinjau & Validasi Data ({parseSummary.totalRows} Baris)
                    </h4>
                  </div>
                  <div className="flex items-center gap-3 text-xs pl-8">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      ✓ {parseSummary.validRows} Siap Diimpor
                    </span>
                    {parseSummary.invalidRows > 0 && (
                      <span className="text-rose-600 dark:text-rose-400 font-bold">
                        ⚠ {parseSummary.invalidRows} Perlu Perbaikan
                      </span>
                    )}
                  </div>
                </div>

                {/* Filter Valid/Invalid */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
                  <button
                    onClick={() => setPreviewFilter('all')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer",
                      previewFilter === 'all'
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs"
                        : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    Semua ({parseSummary.totalRows})
                  </button>
                  <button
                    onClick={() => setPreviewFilter('valid')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer text-emerald-700 dark:text-emerald-400",
                      previewFilter === 'valid'
                        ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-2xs"
                        : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    Valid ({parseSummary.validRows})
                  </button>
                  {parseSummary.invalidRows > 0 && (
                    <button
                      onClick={() => setPreviewFilter('invalid')}
                      className={cn(
                        "px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer text-rose-700 dark:text-rose-400",
                        previewFilter === 'invalid'
                          ? "bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-300 shadow-2xs"
                          : "text-slate-500 hover:text-slate-900"
                      )}
                    >
                      Error ({parseSummary.invalidRows})
                    </button>
                  )}
                </div>
              </div>

              {/* Duplicate Strategy Option */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Penanganan Jika Nomor Induk (NIS) atau NISN Sudah Ada di Buku Induk:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <label className={cn(
                    "p-2.5 rounded-xl border flex items-start gap-2 cursor-pointer transition-all",
                    duplicateStrategy === 'update'
                      ? "border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400"
                  )}>
                    <input
                      type="radio"
                      name="dupStrategy"
                      checked={duplicateStrategy === 'update'}
                      onChange={() => setDuplicateStrategy('update')}
                      className="mt-0.5 text-blue-600"
                    />
                    <div>
                      <strong className="block text-[11px]">Perbarui Data (Update)</strong>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Timpa data siswa yang cocok</span>
                    </div>
                  </label>

                  <label className={cn(
                    "p-2.5 rounded-xl border flex items-start gap-2 cursor-pointer transition-all",
                    duplicateStrategy === 'skip'
                      ? "border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400"
                  )}>
                    <input
                      type="radio"
                      name="dupStrategy"
                      checked={duplicateStrategy === 'skip'}
                      onChange={() => setDuplicateStrategy('skip')}
                      className="mt-0.5 text-blue-600"
                    />
                    <div>
                      <strong className="block text-[11px]">Lewati yang Duplikat</strong>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Hanya tambah data baru</span>
                    </div>
                  </label>

                  <label className={cn(
                    "p-2.5 rounded-xl border flex items-start gap-2 cursor-pointer transition-all",
                    duplicateStrategy === 'append'
                      ? "border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400"
                  )}>
                    <input
                      type="radio"
                      name="dupStrategy"
                      checked={duplicateStrategy === 'append'}
                      onChange={() => setDuplicateStrategy('append')}
                      className="mt-0.5 text-blue-600"
                    />
                    <div>
                      <strong className="block text-[11px]">Tambah Semua Data</strong>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Selalu buat data baru</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Table Preview */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-60 overflow-y-auto bg-white dark:bg-slate-900">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 sticky top-0 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-2.5 font-bold w-12 text-center">Baris</th>
                      <th className="p-2.5 font-bold">NIS / NISN</th>
                      <th className="p-2.5 font-bold">Nama Lengkap</th>
                      <th className="p-2.5 font-bold">JK</th>
                      <th className="p-2.5 font-bold">Kelas</th>
                      <th className="p-2.5 font-bold">Kabupaten & Provinsi</th>
                      <th className="p-2.5 font-bold">Nama Ayah/Ibu</th>
                      <th className="p-2.5 font-bold">Status Validasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-slate-400 text-xs">
                          Tidak ada baris pada filter ini.
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((row) => (
                        <tr
                          key={row.rowNumber}
                          className={cn(
                            "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                            !row.isValid && "bg-rose-50/50 dark:bg-rose-950/20"
                          )}
                        >
                          <td className="p-2.5 text-center font-mono text-[11px] text-slate-500">
                            #{row.rowNumber}
                          </td>
                          <td className="p-2.5 font-mono text-[11px]">
                            <div className="font-bold text-slate-900 dark:text-slate-100">
                              {row.data.noInduk || '-'}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {row.data.nisn || '-'}
                            </div>
                          </td>
                          <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">
                            {row.data.namaLengkap || <span className="text-rose-500 italic">Nama Kosong</span>}
                          </td>
                          <td className="p-2.5">
                            <span className={cn(
                              "px-1.5 py-0.5 rounded text-[10px] font-extrabold",
                              row.data.jenisKelamin === 'L' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                            )}>
                              {row.data.jenisKelamin}
                            </span>
                          </td>
                          <td className="p-2.5 font-bold text-slate-700 dark:text-slate-300">
                            {row.data.kelasSekarang || '7A'}
                          </td>
                          <td className="p-2.5 text-slate-700 dark:text-slate-300 text-[11px]">
                            <div className="font-semibold">{row.data.kabupatenKota || '-'}</div>
                            <div className="text-[10px] text-slate-400">{row.data.provinsi || '-'}</div>
                          </td>
                          <td className="p-2.5 text-slate-600 dark:text-slate-400 text-[11px]">
                            {row.data.ayah?.nama !== '-' ? row.data.ayah?.nama : row.data.ibu?.nama || '-'}
                          </td>
                          <td className="p-2.5">
                            {row.isValid ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                <Check className="w-3.5 h-3.5" />
                                Valid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400" title={row.errors.join(', ')}>
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {row.errors[0]}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {parseSummary ? (
              <span>
                Total <strong>{parseSummary.validRows}</strong> siswa valid siap diimpor ke buku induk.
              </span>
            ) : (
              <span>Unduh template terlebih dahulu untuk format yang presisi.</span>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Tutup
            </button>

            {parseSummary && parseSummary.validRows > 0 && !importResult && (
              <button
                onClick={handleExecuteImport}
                className="px-5 py-2 bg-[#003399] hover:bg-[#002266] text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Proses Impor ({parseSummary.validRows} Siswa)</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
