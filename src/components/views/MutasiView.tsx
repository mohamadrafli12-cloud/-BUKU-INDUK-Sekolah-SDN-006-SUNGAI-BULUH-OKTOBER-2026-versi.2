import React, { useState } from 'react';
import { UserMinus, Plus, Printer, Search, FileText, ArrowLeft, Building, AlertCircle, RotateCcw, CheckCircle, Eye, AlertTriangle, X, ShieldAlert, Edit3, Upload, Download, FileSpreadsheet } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { Student } from '../../types';
import { formatIndonesianDate, cn, isInAcademicYear, getAcademicYearFromDate } from '../../lib/utils';
import { KopSuratHeader } from '../layout/KopSuratHeader';
import { SuratPindahDocument } from '../common/SuratPindahDocument';
import { downloadMutasiExcelTemplate, exportMutasiToExcel } from '../../utils/excelHelper';
import { ImportMutasiModal } from '../modals/ImportMutasiModal';

interface MutasiViewProps {
  onOpenMutationModal: (student: Student) => void;
  onSelectStudentDetail: (studentId: string) => void;
  onBack?: () => void;
  setActiveTab?: (tab: any) => void;
}

export const MutasiView: React.FC<MutasiViewProps> = ({
  onOpenMutationModal,
  onSelectStudentDetail,
  onBack,
  setActiveTab,
}) => {
  const { students, schoolProfile, currentRole, cancelMutation, rolePermissions } = useSchool();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentForLetter, setSelectedStudentForLetter] = useState<Student | null>(null);
  const [previewModalStudent, setPreviewModalStudent] = useState<Student | null>(null);
  const [isPrintingRekap, setIsPrintingRekap] = useState(false);
  const [studentToCancelMutation, setStudentToCancelMutation] = useState<Student | null>(null);
  const [restoreClass, setRestoreClass] = useState<string>('Kelas 1');
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Filter Tahun Pelajaran Aktif (default to activeTP, or 'ALL')
  const activeTP = schoolProfile.tahunPelajaranAktif || '2026/2027';
  const [selectedTahunPelajaran, setSelectedTahunPelajaran] = useState<string>(activeTP);

  // All mutated students (all-time)
  const allMutatedStudents = students.filter(s => s.mutasi || s.status === 'Mutasi Keluar');
  const activeStudents = students.filter(s => s.status === 'Aktif');

  // Filter by Academic Year (Tahun Ajar Aktif)
  const mutatedStudents = allMutatedStudents.filter(s => {
    if (selectedTahunPelajaran === 'ALL') return true;
    return (
      isInAcademicYear(s.mutasi?.tglMeninggalkan, selectedTahunPelajaran) ||
      isInAcademicYear(s.mutasi?.dikeluarkanTanggal, selectedTahunPelajaran) ||
      isInAcademicYear(s.mutasi?.tahunAjaran, selectedTahunPelajaran) ||
      (s.status === 'Mutasi Keluar' && !s.mutasi?.tglMeninggalkan && isInAcademicYear(s.updatedAt, selectedTahunPelajaran))
    );
  });

  const hiddenCountInOtherYears = allMutatedStudents.length - mutatedStudents.length;

  const filteredMutated = mutatedStudents.filter(s => 
    s.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.noInduk.includes(searchTerm) ||
    s.mutasi?.sekolahTujuan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canManageMutation = currentRole !== 'umum' && (rolePermissions?.inputMutasi !== false);

  const handlePrintLetter = (student: Student) => {
    setIsPrintingRekap(false);
    setSelectedStudentForLetter(student);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handlePrintRekapMutasi = () => {
    setSelectedStudentForLetter(null);
    setIsPrintingRekap(true);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleOpenCancelDialog = (student: Student) => {
    setStudentToCancelMutation(student);
    setRestoreClass(student.mutasi?.dariKelas || student.kelasSekarang || 'Kelas 1');
  };

  const handleConfirmCancelMutation = () => {
    if (!studentToCancelMutation) return;

    const studentName = studentToCancelMutation.namaLengkap;
    const targetClass = restoreClass || studentToCancelMutation.mutasi?.dariKelas || studentToCancelMutation.kelasSekarang || 'Kelas 1';
    
    cancelMutation(studentToCancelMutation.id, targetClass);
    setStudentToCancelMutation(null);

    setFeedbackToast({
      message: `Mutasi siswa ${studentName} berhasil dibatalkan. Status siswa kini AKTIF kembali di ${targetClass}.`,
      type: 'success',
    });

    setTimeout(() => {
      setFeedbackToast(null);
    }, 4500);
  };

  const handleGoBack = () => {
    if (onBack) {
      onBack();
    } else if (setActiveTab) {
      setActiveTab('dashboard');
    }
  };

  const classOptions = ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6', 'Kelas 7', 'Kelas 8', 'Kelas 9', 'Kelas 10', 'Kelas 11', 'Kelas 12'];

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification */}
      {feedbackToast && (
        <div className="no-print fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-3 px-4 py-3 bg-emerald-700 text-white rounded-xl shadow-xl border border-emerald-600 text-xs font-semibold max-w-md">
            <CheckCircle className="w-5 h-5 text-emerald-200 shrink-0" />
            <span className="flex-1">{feedbackToast.message}</span>
            <button
              onClick={() => setFeedbackToast(null)}
              className="p-1 hover:bg-emerald-800 rounded-md text-emerald-200 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="no-print flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <button
            onClick={handleGoBack}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
            title="Kembali ke Dashboard Utama"
          >
            <ArrowLeft className="w-4 h-4 text-[#003399] dark:text-blue-400" />
            <span className="hidden sm:inline">Kembali</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                Buku Mutasi & Siswa Meninggalkan Sekolah
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/60 text-orange-800 dark:text-orange-200 font-extrabold text-xs">
                Sheet TINGGALKAN ({mutatedStudents.length})
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Register resmi pencatatan peserta didik yang pindah atau meninggalkan sekolah
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Unduh Template Excel */}
          <button
            type="button"
            onClick={() => downloadMutasiExcelTemplate(schoolProfile)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-orange-400 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-xs transition-colors cursor-pointer"
            title="Unduh Template Format Excel Mutasi Sesuai Kolom Surat Keterangan Pindah Sekolah"
          >
            <Download className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span className="hidden sm:inline">Template Excel Mutasi</span>
            <span className="sm:hidden">Template</span>
          </button>

          {/* Impor Excel Data Mutasi */}
          {canManageMutation && (
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold shadow-sm hover:shadow-md transition-all cursor-pointer"
              title="Impor Data Mutasi & Surat Pindah dari Berkas Excel"
            >
              <Upload className="w-4 h-4" />
              <span>Impor Data Mutasi</span>
            </button>
          )}

          {/* Ekspor Excel */}
          <button
            type="button"
            onClick={() => exportMutasiToExcel(mutatedStudents, schoolProfile)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-xs transition-colors cursor-pointer"
            title="Ekspor Seluruh Data Siswa Mutasi ke Format Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden md:inline">Ekspor Excel</span>
          </button>

          {/* Cetak Laporan Mutasi */}
          <button
            onClick={handlePrintRekapMutasi}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#003399] hover:bg-[#002266] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            title="Cetak Laporan Rekapitulasi Mutasi & Siswa Pindah (Sheet TINGGALKAN)"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Cetak Laporan Mutasi</span>
            <span className="sm:hidden">Cetak</span>
          </button>

          {currentRole !== 'umum' && (
            <select
              onChange={(e) => {
                const s = students.find(item => item.id === e.target.value);
                if (s) onOpenMutationModal(s);
              }}
              defaultValue=""
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="" disabled>+ Pilih Siswa untuk Dipindahkan...</option>
              {activeStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.noInduk} - {s.namaLengkap} ({s.kelasSekarang})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Search & Statistics */}
      <div className="no-print grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="sm:col-span-2 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama siswa mutasi atau sekolah tujuan..."
            className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden"
          />
        </div>

        {/* Filter Tahun Pelajaran */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-center">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Tahun Pelajaran:</span>
            {selectedTahunPelajaran === activeTP && (
              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-[9px] bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.2 rounded">
                AKTIF
              </span>
            )}
          </label>
          <select
            value={selectedTahunPelajaran}
            onChange={(e) => setSelectedTahunPelajaran(e.target.value)}
            className="w-full bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
          >
            <option value={activeTP}>Tahun Aktif: {activeTP}</option>
            {(schoolProfile.daftarTahunPelajaran || ['2023/2024', '2024/2025', '2025/2026', '2026/2027', '2027/2028'])
              .filter(tp => tp !== activeTP)
              .map(tp => (
                <option key={tp} value={tp}>Tahun Pelajaran {tp}</option>
              ))
            }
            <option value="ALL">Semua Tahun Pelajaran (Arsip)</option>
          </select>
        </div>

        <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase text-orange-800 dark:text-orange-300">
              {selectedTahunPelajaran === 'ALL' ? 'Total Seluruh Tahun' : `Mutasi TP ${selectedTahunPelajaran}`}
            </div>
            <div className="text-2xl font-extrabold text-orange-600 dark:text-orange-400">{mutatedStudents.length} Siswa</div>
          </div>
          <UserMinus className="w-8 h-8 text-orange-400 opacity-60" />
        </div>
      </div>

      {/* Info Banner when other years are hidden */}
      {selectedTahunPelajaran !== 'ALL' && hiddenCountInOtherYears > 0 && (
        <div className="no-print p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between text-xs text-blue-900 dark:text-blue-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              Menampilkan data mutasi keluar pada <strong>Tahun Pelajaran {selectedTahunPelajaran}</strong>. {hiddenCountInOtherYears} data mutasi tahun selain itu disembunyikan.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedTahunPelajaran('ALL')}
            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
          >
            Tampilkan Semua ({allMutatedStudents.length})
          </button>
        </div>
      )}

      {/* Table of Mutations */}
      <div className="no-print rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#002266] text-white uppercase text-[11px] font-bold">
              <tr>
                <th className="p-3">No</th>
                <th className="p-3">NIS / NISN</th>
                <th className="p-3">Nama Siswa</th>
                <th className="p-3">Tgl Meninggalkan</th>
                <th className="p-3">Dari Kelas</th>
                <th className="p-3">Sekolah Tujuan</th>
                <th className="p-3">Alasan Pindah</th>
                <th className="p-3 text-right">Aksi & Surat Mutasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredMutated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                        <UserMinus className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-extrabold text-sm text-slate-700 dark:text-slate-300">Belum ada siswa dalam register mutasi keluar.</p>
                        <p className="text-xs text-slate-400 mt-0.5">Anda dapat memindahkan siswa aktif atau mengimpor data mutasi lampau secara massal dengan berkas Excel.</p>
                      </div>
                      {canManageMutation && (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setIsImportModalOpen(true)}
                            className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Impor Data Mutasi Excel</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadMutasiExcelTemplate(schoolProfile)}
                            className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Unduh Template Mutasi</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMutated.map((student, idx) => (
                  <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-mono font-bold text-blue-700 dark:text-blue-300">
                      {student.noInduk}
                      <div className="text-[10px] text-slate-400">{student.nisn}</div>
                    </td>
                    <td className="p-3">
                      <div 
                        onClick={() => onSelectStudentDetail(student.id)}
                        className="font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 cursor-pointer"
                      >
                        {student.namaLengkap}
                      </div>
                      <div className="text-[10px] text-slate-400">{student.tempatLahir}, {formatIndonesianDate(student.tanggalLahir)}</div>
                    </td>
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                      {student.mutasi ? formatIndonesianDate(student.mutasi.tglMeninggalkan) : '-'}
                    </td>
                    <td className="p-3 font-bold text-slate-700 dark:text-slate-300">
                      {student.mutasi?.dariKelas || student.kelasSekarang}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-blue-900 dark:text-blue-300">
                        {student.mutasi?.sekolahTujuan || '-'}
                      </div>
                      {(student.mutasi?.kabupatenKotaTujuan || student.mutasi?.provinsiTujuan) && (
                        <div className="text-[10px] text-slate-500 font-medium">
                          {[student.mutasi.kecamatanTujuan, student.mutasi.kabupatenKotaTujuan, student.mutasi.provinsiTujuan].filter(Boolean).join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {student.mutasi?.alasanPindah || '-'}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Tombol Pratinjau Surat */}
                        <button
                          onClick={() => setPreviewModalStudent(student)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                          title="Lihat Pratinjau Surat Keterangan Pindah Sekolah"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Pratinjau</span>
                        </button>

                        {/* Tombol Edit Mutasi */}
                        {canManageMutation && (
                          <button
                            onClick={() => onOpenMutationModal(student)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                            title="Edit data dan catatan mutasi siswa"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                        )}

                        {/* Tombol Cetak Surat Pindah */}
                        <button
                          onClick={() => handlePrintLetter(student)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                          title="Cetak Surat Keterangan Pindah Sekolah"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Cetak Surat</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRMATION MODAL: BATALKAN MUTASI */}
      {studentToCancelMutation && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="flex items-center justify-between px-5 py-4 bg-rose-600 text-white">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-white/20 rounded-lg">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-wide">
                    KONFIRMASI PEMBATALAN MUTASI
                  </h3>
                  <p className="text-[11px] text-rose-100">
                    Pengembalian Status Siswa ke Buku Induk Aktif
                  </p>
                </div>
              </div>
              <button
                onClick={() => setStudentToCancelMutation(null)}
                className="p-1 rounded-md text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Modal */}
            <div className="p-5 space-y-4 text-xs">
              {/* Alert Notice */}
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  <p className="font-bold text-amber-900 dark:text-amber-200">Perhatian:</p>
                  Tindakan ini akan <strong>menghapus catatan mutasi keluar</strong> dari lembar Sheet TINGGALKAN dan mengembalikan status peserta didik menjadi <strong>AKTIF</strong> di Buku Induk Siswa.
                </div>
              </div>

              {/* Student Summary Info */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 font-medium">Nama Siswa:</span>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100">{studentToCancelMutation.namaLengkap}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Nomor Induk (NIS):</span>
                  <span className="font-mono font-bold text-blue-700 dark:text-blue-300">{studentToCancelMutation.noInduk}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">NISN:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{studentToCancelMutation.nisn}</span>
                </div>
                {studentToCancelMutation.mutasi?.sekolahTujuan && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Sekolah Tujuan Semula:</span>
                    <span className="font-bold text-rose-700 dark:text-rose-400">{studentToCancelMutation.mutasi.sekolahTujuan}</span>
                  </div>
                )}
                {studentToCancelMutation.mutasi?.tglMeninggalkan && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Tanggal Pencatatan Mutasi:</span>
                    <span className="text-slate-700 dark:text-slate-300">{formatIndonesianDate(studentToCancelMutation.mutasi.tglMeninggalkan)}</span>
                  </div>
                )}
              </div>

              {/* Restore Class Selection */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Kembalikan ke Kelas Aktif: <span className="text-rose-500">*</span>
                </label>
                <select
                  value={restoreClass}
                  onChange={(e) => setRestoreClass(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
                >
                  {classOptions.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Pilih tingkat kelas aktif saat siswa kembali mengikuti kegiatan belajar.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setStudentToCancelMutation(null)}
                className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelMutation}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Ya, Batalkan Mutasi & Aktifkan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PRATINJAU SURAT KETERANGAN PINDAH SEKOLAH */}
      {previewModalStudent && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal Pratinjau */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-orange-400" />
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wide">
                    Pratinjau Surat Keterangan Pindah Sekolah
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Siswa: {previewModalStudent.namaLengkap} (NIS: {previewModalStudent.noInduk}) • Sesuai Berkas PDF Resmi
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const st = previewModalStudent;
                    setPreviewModalStudent(null);
                    handlePrintLetter(st);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Surat (PDF)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewModalStudent(null)}
                  className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 dark:bg-slate-950 flex justify-center">
              <div className="shadow-xl border border-slate-300 rounded-sm w-full max-w-[210mm] bg-white">
                <SuratPindahDocument
                  student={previewModalStudent}
                  schoolProfile={schoolProfile}
                />
              </div>
            </div>

            {/* Footer Modal */}
            <div className="px-5 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-slate-500">
                Format surat resmi dilengkapi lembar isian pengembalian untuk sekolah penerima.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const st = previewModalStudent;
                    setPreviewModalStudent(null);
                    onOpenMutationModal(st);
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer"
                >
                  Edit Data Formulir Surat
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const st = previewModalStudent;
                    setPreviewModalStudent(null);
                    handlePrintLetter(st);
                  }}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Dokumen Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FORMAL SURAT KETERANGAN PINDAH SEKOLAH (Printed when Cetak Surat clicked) */}
      {selectedStudentForLetter && !isPrintingRekap && (
        <div className="max-w-[210mm] mx-auto bg-white text-black shadow-2xl rounded-sm border border-slate-300 print:border-none print:shadow-none print:m-0 print:w-full">
          <SuratPindahDocument
            student={selectedStudentForLetter}
            schoolProfile={schoolProfile}
          />
        </div>
      )}

      {/* FORMAL LAPORAN REKAPITULASI MUTASI & SISWA PINDAH (SHEET TINGGALKAN) */}
      {(isPrintingRekap || !selectedStudentForLetter) && (
        <div className={cn(
          "max-w-[297mm] mx-auto bg-white text-slate-950 p-[12mm] shadow-2xl rounded-sm font-serif text-[11px] leading-relaxed border border-slate-300 print:border-none print:shadow-none print:m-0 print:w-full",
          !isPrintingRekap && "hidden print:block"
        )}>
          <KopSuratHeader
            schoolProfile={schoolProfile}
            documentTitle="BUKU REGISTER MUTASI PESERTA DIDIK"
            documentSubtitle="LAPORAN REKAPITULASI PESERTA DIDIK PINDAH / MENINGGALKAN SEKOLAH (SHEET TINGGALKAN)"
          />

          <div className="my-3 text-xs font-sans text-slate-700">
            <p>Daftar resmi peserta didik yang tercatat pindah / meninggalkan {schoolProfile.namaSekolah}:</p>
          </div>

          <table className="w-full border-collapse border border-slate-950 text-[10px] my-3">
            <thead>
              <tr className="bg-slate-100 text-slate-950 font-bold">
                <th className="border border-slate-950 px-2 py-1 text-center w-8">No</th>
                <th className="border border-slate-950 px-2 py-1 text-center w-24">NIS / NISN</th>
                <th className="border border-slate-950 px-2 py-1 text-left">Nama Peserta Didik</th>
                <th className="border border-slate-950 px-2 py-1 text-center w-10">L/P</th>
                <th className="border border-slate-950 px-2 py-1 text-center w-16">Dari Kelas</th>
                <th className="border border-slate-950 px-2 py-1 text-center w-24">Tgl Keluar</th>
                <th className="border border-slate-950 px-2 py-1 text-left w-36">No. Surat Pindah</th>
                <th className="border border-slate-950 px-2 py-1 text-left">Sekolah Tujuan</th>
                <th className="border border-slate-950 px-2 py-1 text-left">Alasan Pindah</th>
              </tr>
            </thead>
            <tbody>
              {filteredMutated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="border border-slate-950 px-3 py-4 text-center text-slate-500 italic">
                    Belum ada catatan peserta didik mutasi / pindah sekolah.
                  </td>
                </tr>
              ) : (
                filteredMutated.map((s, idx) => (
                  <tr key={s.id}>
                    <td className="border border-slate-950 px-2 py-1 text-center font-mono">{idx + 1}</td>
                    <td className="border border-slate-950 px-2 py-1 text-center font-mono">{s.noInduk} / {s.nisn}</td>
                    <td className="border border-slate-950 px-2 py-1 font-bold uppercase">{s.namaLengkap}</td>
                    <td className="border border-slate-950 px-2 py-1 text-center">{s.jenisKelamin}</td>
                    <td className="border border-slate-950 px-2 py-1 text-center">{s.mutasi?.dariKelas || s.kelasSekarang}</td>
                    <td className="border border-slate-950 px-2 py-1 text-center">{formatIndonesianDate(s.mutasi?.tglMeninggalkan || s.tanggalPembaruan)}</td>
                    <td className="border border-slate-950 px-2 py-1 font-mono text-[9px]">{s.mutasi?.noSuratPindah || '-'}</td>
                    <td className="border border-slate-950 px-2 py-1 font-semibold">{s.mutasi?.sekolahTujuan || '-'}</td>
                    <td className="border border-slate-950 px-2 py-1">{s.mutasi?.alasanPindah || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="flex justify-between items-end font-sans text-[11px] mt-6">
            <div className="text-center">
              <div>Mengetahui,</div>
              <div>Pengelola / Petugas Buku Induk</div>
              <div className="h-16" />
              <div className="font-bold underline">Administrator / Operator</div>
              <div>NIP. -</div>
            </div>

            <div className="text-right leading-tight">
              <div>{schoolProfile.desaKelurahan || schoolProfile.desa || 'Sungai Buluh'}, {formatIndonesianDate(new Date().toISOString())}</div>
              <div className="font-bold mt-0.5">Kepala {schoolProfile.namaSekolah}</div>
              <div className="h-16 flex items-center justify-end relative">
                {schoolProfile.stempelUrl ? (
                  <img
                    src={schoolProfile.stempelUrl}
                    alt="Stempel Sekolah"
                    className="w-24 h-16 object-contain opacity-85 absolute right-4"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-24 h-10 border border-blue-900/30 rounded flex items-center justify-center text-[8px] text-blue-900 font-bold">
                    [ STEMPEL RESMI ]
                  </div>
                )}
              </div>
              <div className="font-bold underline relative z-10">{schoolProfile.namaKepalaSekolah}</div>
              <div>NIP. {schoolProfile.nipKepalaSekolah}</div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL IMPOR DATA MUTASI FORMAT EXCEL */}
      <ImportMutasiModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          setFeedbackToast({
            message: 'Data mutasi dari berkas Excel berhasil diimpor ke Buku Induk!',
            type: 'success',
          });
          setTimeout(() => setFeedbackToast(null), 4000);
        }}
      />
    </div>
  );
};

