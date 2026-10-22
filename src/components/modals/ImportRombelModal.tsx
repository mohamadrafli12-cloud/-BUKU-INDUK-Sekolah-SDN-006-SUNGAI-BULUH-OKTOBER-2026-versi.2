import React, { useState, useRef, useMemo } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Info,
  Check,
  Search,
  Sparkles,
  ArrowRightLeft,
  Users
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import {
  downloadRombelTemplate,
  parseRombelExcelFile,
  RombelImportSummary,
  RombelChangeItem,
  isRombelKelas1Sampai6,
} from '../../utils/excelHelper';
import { cn } from '../../lib/utils';

interface ImportRombelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ImportRombelModal: React.FC<ImportRombelModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { students, schoolProfile, bulkUpdateStudentRombel } = useSchool();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseSummary, setParseSummary] = useState<RombelImportSummary | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [previewFilter, setPreviewFilter] = useState<'all' | 'ready' | 'unchanged' | 'issues'>('all');
  const [searchPreview, setSearchPreview] = useState('');
  const [previewPage, setPreviewPage] = useState(1);
  const itemsPerPage = 8;

  const [isApplying, setIsApplying] = useState(false);
  const [appliedCount, setAppliedCount] = useState<number | null>(null);

  // Active students in Grade 1 to 6
  const activeStudents = useMemo(() => {
    return students.filter((s) => s.status === 'Aktif' && isRombelKelas1Sampai6(s.kelasSekarang));
  }, [students]);

  const resetAll = () => {
    setSelectedFile(null);
    setParseSummary(null);
    setParseError(null);
    setPreviewFilter('all');
    setSearchPreview('');
    setPreviewPage(1);
    setIsApplying(false);
    setAppliedCount(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  const handleDownloadBlank = () => {
    downloadRombelTemplate(schoolProfile.namaSekolah, [], 'blank');
  };

  const handleDownloadPopulated = () => {
    downloadRombelTemplate(schoolProfile.namaSekolah, activeStudents, 'populated');
  };

  const processFile = async (file: File) => {
    setSelectedFile(file);
    setIsParsing(true);
    setParseError(null);
    setParseSummary(null);
    setAppliedCount(null);
    setPreviewPage(1);

    try {
      const summary = await parseRombelExcelFile(file, students);
      setParseSummary(summary);
      if (summary.totalRows === 0) {
        setParseError('Tidak ditemukan baris data siswa yang valid pada berkas Excel.');
      }
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

  const handleApplyChanges = () => {
    if (!parseSummary || parseSummary.readyCount === 0) return;

    setIsApplying(true);
    try {
      const readyUpdates = parseSummary.items
        .filter((item) => item.status === 'CHANGE_READY' && item.studentId)
        .map((item) => ({
          studentId: item.studentId!,
          newClass: item.rombelBaru,
          oldClass: item.rombelLama,
          keterangan: item.keterangan,
        }));

      const count = bulkUpdateStudentRombel(readyUpdates);
      setAppliedCount(count);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setParseError('Terjadi kesalahan saat menyimpan perubahan rombel: ' + err?.message);
    } finally {
      setIsApplying(false);
    }
  };

  // Filter preview items
  const filteredItems = useMemo(() => {
    if (!parseSummary) return [];

    let list = parseSummary.items;

    if (previewFilter === 'ready') {
      list = list.filter((i) => i.status === 'CHANGE_READY');
    } else if (previewFilter === 'unchanged') {
      list = list.filter((i) => i.status === 'UNCHANGED');
    } else if (previewFilter === 'issues') {
      list = list.filter((i) => i.status !== 'CHANGE_READY' && i.status !== 'UNCHANGED');
    }

    if (searchPreview.trim()) {
      const q = searchPreview.toLowerCase();
      list = list.filter(
        (i) =>
          i.nama.toLowerCase().includes(q) ||
          i.nis.toLowerCase().includes(q) ||
          i.nisn.toLowerCase().includes(q) ||
          i.rombelBaru.toLowerCase().includes(q) ||
          i.rombelLama.toLowerCase().includes(q)
      );
    }

    return list;
  }, [parseSummary, previewFilter, searchPreview]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = filteredItems.slice(
    (previewPage - 1) * itemsPerPage,
    previewPage * itemsPerPage
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#003399] via-blue-800 to-indigo-900 px-6 py-5 text-white flex items-center justify-between shrink-0 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <ArrowRightLeft className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                  Format Excel (.XLSX)
                </span>
                <span className="text-xs text-blue-100 font-semibold">Khusus Kelas 1 s/d 6</span>
              </div>
              <h2 className="text-lg md:text-xl font-black text-white tracking-tight mt-0.5">
                Impor Perubahan Rombel Siswa Aktif
              </h2>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer relative z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin">
          {/* SUCCESS SCREEN */}
          {appliedCount !== null ? (
            <div className="py-8 text-center space-y-5 animate-scale-up">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 rounded-3xl mx-auto flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2 max-w-lg mx-auto">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  Perubahan Rombel Berhasil Diterapkan!
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Sebanyak <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold">{appliedCount} siswa aktif</strong> telah berhasil diperbarui rombel / pembagian kelasnya secara massal dan tersimpan otomatis ke Buku Induk.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetAll}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Impor Berkas Lain
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2.5 rounded-xl bg-[#003399] hover:bg-[#002266] text-white text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  <span>Selesai & Lihat Data Siswa Aktif</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* STEP 1: UNDUH TEMPLATE EXCEL */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800/80 dark:to-slate-800/40 rounded-2xl p-4 sm:p-5 border border-blue-200/80 dark:border-blue-900/40 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm font-black text-xs">
                      1
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>Unduh Template Format Excel Perubahan Rombel</span>
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                        Gunakan berkas spreadsheet resmi agar pencocokan NIS dan kolom rombel baru terbaca sempurna.
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950 px-2.5 py-1 rounded-full self-start sm:self-center border border-blue-200 dark:border-blue-800">
                    Format Resmi .XLSX
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Template Berisi Siswa Aktif (Rekomendasi Utama) */}
                  <button
                    type="button"
                    onClick={handleDownloadPopulated}
                    className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border-2 border-blue-400 dark:border-blue-600 hover:border-[#003399] dark:hover:border-blue-400 shadow-xs hover:shadow-md transition-all text-left cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:bg-[#003399] group-hover:text-white transition-colors">
                      <Download className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                          Template Terisi Siswa Aktif
                        </p>
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500 text-white shrink-0">
                          Disarankan
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        Berisi otomatis {activeStudents.length} siswa aktif Kelas 1-6 (NIS, NISN, Nama, Rombel Lama). Tinggal isi kolom <strong>Rombel Baru</strong>!
                      </p>
                    </div>
                  </button>

                  {/* Template Kosong dengan Contoh */}
                  <button
                    type="button"
                    onClick={handleDownloadBlank}
                    className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 shadow-xs hover:shadow-md transition-all text-left cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0 group-hover:bg-slate-700 group-hover:text-white transition-colors">
                      <Download className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                        Template Kosong (Contoh Format)
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        Format spreadsheet kosongan disertai 5 baris contoh pengisian dan lembar panduan lengkap.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* STEP 2: UPLOAD BERKAS EXCEL */}
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#003399] text-white flex items-center justify-center shrink-0 shadow-sm font-black text-xs">
                    2
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Unggah Berkas Excel yang Telah Diisi Rombel Barunya</span>
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Pilih atau tarik berkas Excel (.xlsx / .xls / .csv) ke area di bawah.
                    </p>
                  </div>
                </div>

                {/* Dropzone */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3",
                    dragActive
                      ? "border-blue-500 bg-blue-500/10 scale-[1.01]"
                      : selectedFile
                      ? "border-emerald-400 dark:border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20"
                      : "border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50/60 dark:bg-slate-800/40"
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {isParsing ? (
                    <div className="py-4 flex flex-col items-center gap-2 text-blue-600 dark:text-blue-400">
                      <RefreshCw className="w-8 h-8 animate-spin" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Membaca dan memvalidasi baris Excel...
                      </p>
                    </div>
                  ) : selectedFile ? (
                    <div className="flex flex-col items-center gap-1.5 py-1">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                        <FileSpreadsheet className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-black text-slate-900 dark:text-white">
                        {selectedFile.name}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {(selectedFile.size / 1024).toFixed(1)} KB • Klik untuk ganti berkas lain
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-2">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                          Klik untuk memilih berkas atau seret file ke sini
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Format yang didukung: <strong>.XLSX</strong>, <strong>.XLS</strong>, atau <strong>.CSV</strong>
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {parseError && (
                  <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                    <div className="flex-1">
                      <p className="font-bold">Gagal Memproses Berkas</p>
                      <p className="text-[11px] mt-0.5">{parseError}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 3: HASIL ANALISIS & PREVIEW DATA */}
              {parseSummary && (
                <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>Ringkasan Hasil Pembacaan Berkas Excel</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Periksa perubahan rombel sebelum disimpan ke sistem Buku Induk.
                      </p>
                    </div>

                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      Total: <strong className="text-slate-900 dark:text-white font-black">{parseSummary.totalRows} Baris</strong>
                    </span>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                      <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                        Siap Diubah
                      </p>
                      <p className="text-xl font-black text-emerald-800 dark:text-emerald-200 mt-0.5">
                        {parseSummary.readyCount}
                      </p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Siswa rombel baru</p>
                    </div>

                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60">
                      <p className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase">
                        Rombel Tetap
                      </p>
                      <p className="text-xl font-black text-blue-800 dark:text-blue-200 mt-0.5">
                        {parseSummary.unchangedCount}
                      </p>
                      <p className="text-[10px] text-blue-600 dark:text-blue-400">Tidak ada perubahan</p>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
                      <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase">
                        Tidak Ditemukan
                      </p>
                      <p className="text-xl font-black text-amber-800 dark:text-amber-200 mt-0.5">
                        {parseSummary.notFoundCount}
                      </p>
                      <p className="text-[10px] text-amber-600 dark:text-amber-400">NIS tidak cocok</p>
                    </div>

                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60">
                      <p className="text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase">
                        Format Tidak Valid
                      </p>
                      <p className="text-xl font-black text-rose-800 dark:text-rose-200 mt-0.5">
                        {parseSummary.invalidCount}
                      </p>
                      <p className="text-[10px] text-rose-600 dark:text-rose-400">Rombel kosong/bukan 1-6</p>
                    </div>
                  </div>

                  {/* Filter & Search Bar for Preview */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => { setPreviewFilter('all'); setPreviewPage(1); }}
                        className={cn(
                          "px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-[11px]",
                          previewFilter === 'all'
                            ? "bg-white dark:bg-slate-900 text-[#003399] dark:text-blue-400 shadow-xs"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                        )}
                      >
                        Semua ({parseSummary.totalRows})
                      </button>
                      <button
                        type="button"
                        onClick={() => { setPreviewFilter('ready'); setPreviewPage(1); }}
                        className={cn(
                          "px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-[11px]",
                          previewFilter === 'ready'
                            ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                        )}
                      >
                        Siap Diubah ({parseSummary.readyCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => { setPreviewFilter('unchanged'); setPreviewPage(1); }}
                        className={cn(
                          "px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-[11px]",
                          previewFilter === 'unchanged'
                            ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                        )}
                      >
                        Tetap ({parseSummary.unchangedCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => { setPreviewFilter('issues'); setPreviewPage(1); }}
                        className={cn(
                          "px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-[11px]",
                          previewFilter === 'issues'
                            ? "bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                        )}
                      >
                        Bermasalah ({parseSummary.notFoundCount + parseSummary.invalidCount})
                      </button>
                    </div>

                    <div className="relative w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={searchPreview}
                        onChange={(e) => {
                          setSearchPreview(e.target.value);
                          setPreviewPage(1);
                        }}
                        placeholder="Cari di hasil pratinjau..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Preview Table */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 text-[11px] uppercase tracking-wider">
                            <th className="py-2.5 px-3 text-center w-12">No</th>
                            <th className="py-2.5 px-3">Siswa (NIS & Nama)</th>
                            <th className="py-2.5 px-3 text-center">JK</th>
                            <th className="py-2.5 px-3">Perubahan Rombel</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3">Catatan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {paginatedItems.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                                Tidak ada data yang sesuai filter atau pencarian.
                              </td>
                            </tr>
                          ) : (
                            paginatedItems.map((item, idx) => {
                              const isReady = item.status === 'CHANGE_READY';
                              const isUnchanged = item.status === 'UNCHANGED';
                              const isError = !isReady && !isUnchanged;

                              return (
                                <tr
                                  key={`prev-row-${item.rowNumber}-${idx}`}
                                  className={cn(
                                    "transition-colors",
                                    isReady
                                      ? "bg-emerald-50/30 dark:bg-emerald-950/10 hover:bg-emerald-50/60"
                                      : isError
                                      ? "bg-rose-50/30 dark:bg-rose-950/10 hover:bg-rose-50/60"
                                      : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                  )}
                                >
                                  <td className="py-2.5 px-3 text-center font-semibold text-slate-500">
                                    {item.rowNumber}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <p className="font-extrabold text-slate-900 dark:text-white">
                                      {item.nama}
                                    </p>
                                    <p className="text-[10px] text-slate-500 font-mono">
                                      NIS: {item.nis || '-'} {item.nisn ? `• NISN: ${item.nisn}` : ''}
                                    </p>
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    <span
                                      className={cn(
                                        "px-1.5 py-0.5 rounded text-[10px] font-extrabold",
                                        item.jk === 'L'
                                          ? "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300"
                                          : "bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300"
                                      )}
                                    >
                                      {item.jk || '-'}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <div className="flex items-center gap-1.5 font-bold">
                                      <span className={cn("px-2 py-0.5 rounded text-xs", isReady ? "bg-slate-100 dark:bg-slate-800 text-slate-600 line-through" : "bg-slate-100 dark:bg-slate-800 text-slate-700")}>
                                        {item.rombelLama || '-'}
                                      </span>
                                      <ArrowRight className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                      <span
                                        className={cn(
                                          "px-2 py-0.5 rounded text-xs font-black",
                                          isReady
                                            ? "bg-emerald-500 text-white shadow-xs"
                                            : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                                        )}
                                      >
                                        {item.rombelBaru || '(Kosong)'}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3">
                                    {isReady && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                        <Check className="w-3 h-3" />
                                        <span>Siap Diubah</span>
                                      </span>
                                    )}
                                    {isUnchanged && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                                        <span>Rombel Tetap</span>
                                      </span>
                                    )}
                                    {item.status === 'NOT_FOUND' && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                                        <AlertTriangle className="w-3 h-3" />
                                        <span>Siswa Tidak Ada</span>
                                      </span>
                                    )}
                                    {item.status === 'INVALID_CLASS' && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                                        <AlertCircle className="w-3 h-3" />
                                        <span>Bukan Kelas 1-6</span>
                                      </span>
                                    )}
                                    {item.status === 'EMPTY_ROMBEL' && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                                        <AlertCircle className="w-3 h-3" />
                                        <span>Rombel Kosong</span>
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 text-[11px] text-slate-500 max-w-xs truncate" title={item.message || item.keterangan}>
                                    {item.message || item.keterangan || '-'}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination for Preview */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 text-xs">
                        <span className="text-[11px] text-slate-500">
                          Halaman {previewPage} dari {totalPages} ({filteredItems.length} baris)
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={previewPage === 1}
                            onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                            className="px-2 py-1 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 disabled:opacity-40 text-[11px] font-bold cursor-pointer"
                          >
                            Sebelumnya
                          </button>
                          <button
                            type="button"
                            disabled={previewPage >= totalPages}
                            onClick={() => setPreviewPage((p) => Math.min(totalPages, p + 1))}
                            className="px-2 py-1 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 disabled:opacity-40 text-[11px] font-bold cursor-pointer"
                          >
                            Selanjutnya
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-800 dark:text-blue-300">
                    <Info className="w-4 h-4 shrink-0 text-blue-600" />
                    <span>
                      Sistem hanya akan memperbarui baris dengan status <strong>Siap Diubah</strong> (<strong className="font-bold text-emerald-600 dark:text-emerald-400">{parseSummary.readyCount} siswa</strong>). Baris yang tetap atau bermasalah akan dilewati secara aman.
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        {appliedCount === null && (
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>

            <button
              type="button"
              disabled={!parseSummary || parseSummary.readyCount === 0 || isApplying}
              onClick={handleApplyChanges}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black shadow-md transition-all cursor-pointer",
                !parseSummary || parseSummary.readyCount === 0 || isApplying
                  ? "bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed shadow-none"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-lg active:scale-98"
              )}
            >
              {isApplying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menyimpan Perubahan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    Terapkan Perubahan Rombel ({parseSummary ? parseSummary.readyCount : 0} Siswa)
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
