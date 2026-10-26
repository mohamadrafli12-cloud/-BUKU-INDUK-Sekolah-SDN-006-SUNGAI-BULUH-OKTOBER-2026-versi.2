import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Upload, 
  Printer, 
  Edit3, 
  Trash2, 
  Eye, 
  MoreVertical,
  BookOpen,
  CreditCard,
  GraduationCap,
  UserMinus,
  CheckSquare,
  Square,
  ArrowUpDown,
  FileSpreadsheet,
  RefreshCw,
  Award,
  ArrowLeft,
  AlertTriangle,
  HandCoins
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { Student, Gender, StudentStatus, Religion } from '../../types';
import { cn, formatIndonesianDate } from '../../lib/utils';
import { ActiveTab } from '../layout/Sidebar';
import { ImportExcelModal } from '../modals/ImportExcelModal';
import { downloadExcelTemplate, exportRombelToExcel } from '../../utils/excelHelper';
import { KopSuratHeader } from '../layout/KopSuratHeader';

interface StudentListViewProps {
  onOpenAddModal: () => void;
  onEditStudent: (student: Student) => void;
  onSelectDetail: (studentId: string) => void;
  onPrintBukuInduk: (studentId: string) => void;
  onPrintKartuPelajar: (studentId: string) => void;
  onMutasi: (student: Student) => void;
  onSTTB: (student: Student) => void;
  onRaport: (student: Student) => void;
  setActiveTab: (tab: ActiveTab) => void;
  onBack?: () => void;
}

export const StudentListView: React.FC<StudentListViewProps> = ({
  onOpenAddModal,
  onEditStudent,
  onSelectDetail,
  onPrintBukuInduk,
  onPrintKartuPelajar,
  onMutasi,
  onSTTB,
  onRaport,
  setActiveTab,
  onBack,
}) => {
  const { 
    students, 
    schoolProfile,
    adminUsers,
    deleteStudent, 
    deleteStudentsBulk,
    deleteAllStudents,
    currentRole, 
    exportStudentsCSV, 
    exportStudentsExcel,
    importDatabaseJSON,
    exportDatabaseJSON
  } = useSchool();

  // Search, filter, sorting, pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedGender, setSelectedGender] = useState<string>('ALL');
  const [selectedReligion, setSelectedReligion] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'nama' | 'nis' | 'kelas' | 'tanggal'>('nis');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Delete confirmation
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  // Delete all & batch modal states
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isDeleteSelectedModalOpen, setIsDeleteSelectedModalOpen] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');
  const [hasConfirmedCheckbox, setHasConfirmedCheckbox] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Import Excel modal state
  const [isImportExcelModalOpen, setIsImportExcelModalOpen] = useState(false);

  // Helper: Cek apakah siswa pernah mendapatkan bantuan & kumpulkan riwayatnya
  const getStudentBantuanInfo = (s: Student) => {
    const records = s.riwayatBantuan || [];
    const list = s.jenisBantuanList || [];
    const legacyStr = s.penerimaBantuan && s.penerimaBantuan !== 'Tidak' && s.penerimaBantuan !== 'Bukan Penerima' && s.penerimaBantuan.trim() !== ''
      ? s.penerimaBantuan
      : null;

    const hasBantuan = records.length > 0 || list.length > 0 || Boolean(legacyStr);
    if (!hasBantuan) return null;

    const programTypes = new Set<string>();
    records.forEach(r => {
      if (r.jenis) {
        if (r.jenis === 'Bantuan Lainnya' && r.bantuanLainnya) {
          programTypes.add(r.bantuanLainnya);
        } else {
          programTypes.add(r.jenis);
        }
      }
    });
    list.forEach(item => {
      if (item === 'Bantuan Lainnya' && s.bantuanLainnya) {
        programTypes.add(s.bantuanLainnya);
      } else {
        programTypes.add(item);
      }
    });
    if (legacyStr && programTypes.size === 0) {
      programTypes.add(s.bantuanLainnya || legacyStr);
    }

    const programList = Array.from(programTypes);
    const totalRecords = Math.max(records.length, programList.length, 1);

    return {
      hasBantuan: true,
      totalRecords,
      programs: programList.length > 0 ? programList : ['Penerima Bantuan'],
      primaryProgram: programList[0] || 'Penerima Bantuan',
      latestTahap: records[0]?.tahap || s.tahapBantuan,
      latestNominal: records[0]?.nominal || s.nominalBantuan,
      records,
    };
  };

  // Import file ref
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Dynamic class options from schoolProfile and registered students
  const classFilterOptions = useMemo(() => {
    const fromProfile = schoolProfile.daftarKelas || [];
    const fromStudents = students.map(s => s.kelasSekarang).filter(Boolean);
    const combined = Array.from(new Set([...fromProfile, ...fromStudents]));
    return combined.length > 0 ? combined : ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6', 'Alumni'];
  }, [schoolProfile.daftarKelas, students]);

  // Filtered and sorted students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Search matching
      const matchesSearch = 
        searchTerm.trim() === '' ||
        s.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.noInduk.includes(searchTerm) ||
        s.nisn.includes(searchTerm) ||
        s.nik.includes(searchTerm) ||
        s.ayah.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.ibu.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.kelurahanDesa.toLowerCase().includes(searchTerm.toLowerCase());

      // Filter matching
      const matchesClass = selectedClass === 'ALL' || s.kelasSekarang === selectedClass || s.kelasSekarang.includes(selectedClass);
      const matchesStatus = selectedStatus === 'ALL' || s.status === selectedStatus;
      const matchesGender = selectedGender === 'ALL' || s.jenisKelamin === selectedGender;
      const matchesReligion = selectedReligion === 'ALL' || s.agama === selectedReligion;

      return matchesSearch && matchesClass && matchesStatus && matchesGender && matchesReligion;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'nama') {
        comparison = a.namaLengkap.localeCompare(b.namaLengkap);
      } else if (sortBy === 'nis') {
        comparison = a.noInduk.localeCompare(b.noInduk, undefined, { numeric: true });
      } else if (sortBy === 'kelas') {
        comparison = a.kelasSekarang.localeCompare(b.kelasSekarang);
      } else if (sortBy === 'tanggal') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [students, searchTerm, selectedClass, selectedStatus, selectedGender, selectedReligion, sortBy, sortOrder]);

  // Paginated students
  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedIds.length === paginatedStudents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedStudents.map(s => s.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Import handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importDatabaseJSON(content);
      if (success) {
        alert('Berhasil mengimpor data buku induk!');
      } else {
        alert('Format file tidak valid. Harap gunakan file JSON backup sistem.');
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteConfirm = () => {
    if (studentToDelete) {
      deleteStudent(studentToDelete.id);
      setStudentToDelete(null);
      setToastMessage(`Berhasil menghapus data siswa ${studentToDelete.namaLengkap}.`);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    deleteStudentsBulk(selectedIds);
    setSelectedIds([]);
    setIsDeleteSelectedModalOpen(false);
    setToastMessage(`Berhasil menghapus ${count} data siswa terpilih.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDeleteAll = () => {
    const total = students.length;
    deleteAllStudents();
    setSelectedIds([]);
    setIsDeleteAllModalOpen(false);
    setConfirmDeleteText('');
    setHasConfirmedCheckbox(false);
    setToastMessage(`Berhasil mengosongkan seluruh data siswa (${total} siswa).`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* TAMPILAN INTERAKTIF LAYAR (DISEMBUNYIKAN SAAT CETAK AGAR HANYA DOKUMEN RESMI BER-KOP SURAT YANG TERCETAK) */}
      <div className="space-y-6 no-print print:hidden">
        {/* Page Header Bar */}
        <div className="no-print flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <button
            onClick={() => (onBack ? onBack() : setActiveTab('dashboard'))}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
            title="Kembali ke Dashboard Utama"
          >
            <ArrowLeft className="w-4 h-4 text-[#003399] dark:text-blue-400" />
            <span className="hidden sm:inline">Kembali</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                Data Siswa
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 font-extrabold text-xs">
                {filteredStudents.length} Siswa Terdaftar
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Buku Induk Register Peserta Didik, biodata lengkap, riwayat mutasi, dan kelulusan
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Hidden file input for import JSON */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json"
            className="hidden"
          />

          {currentRole !== 'umum' && (
            <>
              {/* Unduh Template Excel */}
              <button
                onClick={() => downloadExcelTemplate(schoolProfile.namaSekolah)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                title="Unduh format template Excel (.XLSX) resmi Buku Induk Siswa"
              >
                <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Unduh Template Excel</span>
              </button>

              {/* Impor Data Excel */}
              <button
                onClick={() => setIsImportExcelModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all cursor-pointer"
                title="Impor data siswa secara massal dari file Excel / CSV"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                <span>Impor Excel</span>
              </button>

              {/* Ekspor Data Siswa Excel (.XLSX) */}
              <button
                onClick={() => exportStudentsExcel({ filteredClass: selectedClass !== 'ALL' ? selectedClass : undefined })}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                title="Ekspor seluruh data siswa ke berkas spreadsheet Microsoft Excel (.XLSX) rapi format resmi template"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
                <span className="hidden md:inline">
                  {selectedClass !== 'ALL' ? `Ekspor Excel (${selectedClass})` : 'Ekspor Excel (.XLSX)'}
                </span>
                <span className="md:hidden">Ekspor Excel</span>
              </button>

              {/* Unduh Berkas Rombel Khusus Wali Kelas */}
              {selectedClass !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => {
                    const savedWali = schoolProfile.waliKelasMap?.[selectedClass];
                    const teacherFromUsers = adminUsers?.find(u => u.tingkatKelas === selectedClass);
                    const waliNama = savedWali?.nama || teacherFromUsers?.nama || `Wali Kelas ${selectedClass}`;
                    const waliNip = savedWali?.nip || teacherFromUsers?.nip || '-';
                    exportRombelToExcel({
                      schoolProfile,
                      students,
                      kelasName: selectedClass,
                      activeTP: schoolProfile.tahunPelajaranAktif || '2026/2027',
                      activeSemester: schoolProfile.semesterAktif || 'Ganjil',
                      waliKelasName: waliNama,
                      waliKelasNip: waliNip,
                    });
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  title={`Unduh daftar siswa ${selectedClass} format Excel (.xlsx) khusus administrasi guru wali kelas`}
                >
                  <Download className="w-4 h-4 text-teal-200" />
                  <span className="hidden sm:inline">Format Wali Kelas ({selectedClass})</span>
                  <span className="sm:hidden">Wali Kelas</span>
                </button>
              )}

              {/* Cetak Buku Register / Daftar Siswa */}
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                title="Cetak Buku Register / Daftar Siswa dengan Kop Surat Resmi"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Cetak Daftar Siswa</span>
              </button>

              {/* Impor JSON Backup */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                title="Impor Backup JSON Lengkap"
              >
                <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="hidden lg:inline">Impor JSON</span>
              </button>

              {/* Hapus Semua Data Siswa */}
              {students.length > 0 && (
                <button
                  onClick={() => {
                    setConfirmDeleteText('');
                    setHasConfirmedCheckbox(false);
                    setIsDeleteAllModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  title="Hapus seluruh data siswa dari Buku Induk"
                >
                  <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>Hapus Semua</span>
                </button>
              )}

              {/* Tambah Siswa Baru */}
              <button
                onClick={onOpenAddModal}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#003399] hover:bg-[#002266] text-white text-xs font-extrabold rounded-xl shadow-md transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Siswa Baru</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="no-print p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center justify-between gap-2 shadow-xs animate-in fade-in">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-emerald-600 hover:text-emerald-900 dark:text-emerald-400 cursor-pointer font-mono text-sm">✕</button>
        </div>
      )}

      {/* Batch Selection Action Bar */}
      {selectedIds.length > 0 && (
        <div className="no-print p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2 font-medium">
            <CheckSquare className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>{selectedIds.length}</strong> data siswa dipilih dari <strong>{students.length}</strong> total data
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 font-bold hover:bg-amber-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Batal Pilih
            </button>
            <button
              onClick={() => setIsDeleteSelectedModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus {selectedIds.length} Siswa Terpilih</span>
            </button>
            <button
              onClick={() => {
                setConfirmDeleteText('');
                setHasConfirmedCheckbox(false);
                setIsDeleteAllModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-800 hover:bg-rose-900 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Semua Siswa ({students.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="no-print p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari Nama, NIS, NISN, NIK, Ortu..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all text-xs"
            />
          </div>

          {/* Filter Kelas */}
          <div>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold"
            >
              <option value="ALL">Semua Kelas</option>
              {classFilterOptions.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Filter Status */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold"
            >
              <option value="ALL">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Lulus">Lulus / STTB</option>
              <option value="Mutasi Keluar">Mutasi Keluar</option>
              <option value="Drop Out">Drop Out</option>
              <option value="Meninggal">Meninggal</option>
            </select>
          </div>

          {/* Filter Gender */}
          <div>
            <select
              value={selectedGender}
              onChange={(e) => {
                setSelectedGender(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold"
            >
              <option value="ALL">Semua Gender</option>
              <option value="L">Laki-Laki (L)</option>
              <option value="P">Perempuan (P)</option>
            </select>
          </div>

          {/* Sort Control */}
          <div>
            <div className="flex items-center gap-1">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs"
              >
                <option value="nis">Urut: NIS</option>
                <option value="nama">Urut: Nama</option>
                <option value="kelas">Urut: Kelas</option>
                <option value="tanggal">Urut: Tgl Masuk</option>
              </select>
              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                title={sortOrder === 'asc' ? 'Urutan Menaik (A-Z / 1-9)' : 'Urutan Menurun (Z-A / 9-1)'}
              >
                <ArrowUpDown className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </button>
            </div>
          </div>
        </div>

        {/* Reset filter shortcuts */}
        {(searchTerm || selectedClass !== 'ALL' || selectedStatus !== 'ALL' || selectedGender !== 'ALL') && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500">
              Filter aktif menampilkan {filteredStudents.length} dari {students.length} total data
            </span>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedClass('ALL');
                setSelectedStatus('ALL');
                setSelectedGender('ALL');
                setSelectedReligion('ALL');
              }}
              className="text-rose-600 hover:underline font-bold"
            >
              Reset Semua Filter ✕
            </button>
          </div>
        )}
      </div>

      {/* Main Table Container */}
      <div className="no-print rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#002266] text-white uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="p-3 w-10 text-center">
                  <button onClick={handleSelectAll} className="flex items-center justify-center">
                    {selectedIds.length > 0 && selectedIds.length === paginatedStudents.length ? (
                      <CheckSquare className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Square className="w-4 h-4 text-white/60" />
                    )}
                  </button>
                </th>
                <th className="p-3 w-14 text-center">Foto</th>
                <th className="p-3">No. Induk / NISN</th>
                <th className="p-3">Nama Lengkap Siswa</th>
                <th className="p-3 text-center">L/P</th>
                <th className="p-3">Kelas</th>
                <th className="p-3">Nama Orang Tua</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-center">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-slate-400">
                    <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                    <p className="font-semibold">Tidak ada data siswa yang cocok dengan kriteria pencarian.</p>
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student) => {
                  const isSelected = selectedIds.includes(student.id);

                  return (
                    <tr
                      key={student.id}
                      className={cn(
                        "hover:bg-blue-50/50 dark:hover:bg-slate-800/60 transition-colors",
                        isSelected && "bg-blue-50/80 dark:bg-blue-950/30"
                      )}
                    >
                      {/* Checkbox */}
                      <td className="p-3 text-center">
                        <button onClick={() => handleToggleSelect(student.id)} className="flex items-center justify-center">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                          )}
                        </button>
                      </td>

                      {/* Photo Thumbnail */}
                      <td className="p-3 text-center">
                        <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mx-auto flex items-center justify-center font-bold text-blue-700 relative">
                          {student.fotoUrl ? (
                            <img src={student.fotoUrl} alt={student.namaLengkap} className="w-full h-full object-cover" />
                          ) : (
                            student.namaLengkap.charAt(0)
                          )}
                          {getStudentBantuanInfo(student) && (
                            <span 
                              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-xs border-2 border-white dark:border-slate-900 z-10"
                              title="Siswa pernah menerima bantuan pendidikan"
                            >
                              <HandCoins className="w-2.5 h-2.5 text-slate-950" />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* NIS & NISN */}
                      <td className="p-3 font-mono">
                        <div className="font-extrabold text-blue-700 dark:text-blue-400">{student.noInduk}</div>
                        <div className="text-[11px] text-amber-600 dark:text-amber-400">{student.nisn}</div>
                      </td>

                      {/* Nama Lengkap & Tgl Lahir */}
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <div 
                            onClick={() => onSelectDetail(student.id)}
                            className="font-extrabold text-slate-900 dark:text-slate-100 hover:text-blue-600 cursor-pointer"
                          >
                            {student.namaLengkap}
                          </div>
                          {(() => {
                            const bInfo = getStudentBantuanInfo(student);
                            if (!bInfo) return null;
                            return (
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectDetail(student.id);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-100 via-amber-200/70 to-yellow-100 text-amber-950 dark:from-amber-950 dark:via-amber-900/60 dark:to-yellow-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700 shadow-2xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                title={`Siswa pernah menerima bantuan pendidikan:\n• Program: ${bInfo.programs.join(', ')}${bInfo.latestTahap ? `\n• Tahap/Termin: ${bInfo.latestTahap}` : ''}${bInfo.latestNominal ? `\n• Nominal: ${bInfo.latestNominal}` : ''}\n(Klik untuk lihat profil dan riwayat bantuan)`}
                              >
                                <HandCoins className="w-3 h-3 text-amber-700 dark:text-amber-400 shrink-0" />
                                <span>Penerima Bantuan</span>
                                {bInfo.totalRecords > 1 && (
                                  <span className="px-1 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black leading-none">
                                    {bInfo.totalRecords}x
                                  </span>
                                )}
                              </span>
                            );
                          })()}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {student.tempatLahir}, {formatIndonesianDate(student.tanggalLahir)}
                        </div>
                      </td>

                      {/* Gender */}
                      <td className="p-3 text-center">
                        <span className={cn(
                          "px-2 py-0.5 rounded font-extrabold text-[10px]",
                          student.jenisKelamin === 'L' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200' : 'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-200'
                        )}>
                          {student.jenisKelamin}
                        </span>
                      </td>

                      {/* Kelas Sekarang */}
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                        {student.kelasSekarang}
                      </td>

                      {/* Ortu */}
                      <td className="p-3">
                        <div className="text-slate-800 dark:text-slate-200 font-semibold">{student.ayah.nama}</div>
                        <div className="text-[10px] text-slate-400">{student.ayah.pekerjaan || 'Ibu: ' + student.ibu.nama}</div>
                      </td>

                      {/* Status */}
                      <td className="p-3">
                        <span className={cn(
                          "px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider",
                          student.status === 'Aktif' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' :
                          student.status === 'Lulus' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800' :
                          'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                        )}>
                          {student.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onSelectDetail(student.id)}
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            title="Buka Lembar Detail Siswa"
                          >
                            <Eye className="w-4 h-4 text-blue-600" />
                          </button>

                          <button
                            onClick={() => onPrintBukuInduk(student.id)}
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            title="Cetak Buku Induk Siswa (2 Halaman)"
                          >
                            <BookOpen className="w-4 h-4 text-amber-600" />
                          </button>

                          <button
                            onClick={() => onPrintKartuPelajar(student.id)}
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            title="Cetak Kartu Pelajar"
                          >
                            <CreditCard className="w-4 h-4 text-purple-600" />
                          </button>

                          {student.status === 'Mutasi Keluar' && currentRole !== 'umum' && (
                            <button
                              onClick={() => onMutasi(student)}
                              className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/60 transition-colors cursor-pointer"
                              title="Edit Catatan Mutasi Siswa"
                            >
                              <UserMinus className="w-4 h-4 text-orange-600" />
                            </button>
                          )}

                          {currentRole !== 'umum' && (
                            <>
                              <button
                                onClick={() => onEditStudent(student)}
                                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                title="Edit Data Siswa"
                              >
                                <Edit3 className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                              </button>

                              <button
                                onClick={() => setStudentToDelete(student)}
                                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-rose-100 dark:hover:bg-rose-950 transition-colors"
                                title="Hapus Data Siswa"
                              >
                                <Trash2 className="w-4 h-4 text-rose-500" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <span>Tampilkan</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <option value={10}>10 baris</option>
              <option value={25}>25 baris</option>
              <option value={30}>30 baris (Standar)</option>
              <option value={50}>50 baris</option>
            </select>
            <span>dari <strong>{filteredStudents.length}</strong> total data siswa</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold disabled:opacity-40"
            >
              ← Sebelumnya
            </button>
            <span className="font-bold text-slate-700 dark:text-slate-300">
              Halaman {currentPage} dari {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold disabled:opacity-40"
            >
              Berikutnya →
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-extrabold text-rose-600">
              Konfirmasi Hapus Data Buku Induk
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus data siswa <strong className="text-slate-900 dark:text-slate-100">{studentToDelete.namaLengkap}</strong> (NIS: {studentToDelete.noInduk}) dari database Buku Induk? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setStudentToDelete(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-md"
              >
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hapus Siswa Terpilih */}
      {isDeleteSelectedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-rose-600 dark:text-rose-400">
                  Hapus {selectedIds.length} Siswa Terpilih
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Penghapusan data secara massal
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus <strong className="text-slate-900 dark:text-slate-100">{selectedIds.length} data siswa</strong> yang Anda pilih dari database Buku Induk? Data yang dihapus tidak dapat dipulihkan.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsDeleteSelectedModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus {selectedIds.length} Siswa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hapus Semua Siswa */}
      {isDeleteAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-rose-200 dark:border-rose-900 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-rose-600 dark:text-rose-400">
                  Konfirmasi Hapus Semua Data Siswa
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tindakan berisiko tinggi pada Buku Induk
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 space-y-2">
              <p className="font-bold">
                ⚠️ Anda akan menghapus SELURUH {students.length} data siswa dari sistem!
              </p>
              <p className="text-[11px] leading-relaxed text-rose-700 dark:text-rose-400">
                Semua biodata lengkap, NIS, NISN, riwayat nilai raport, prestasi, status mutasi, dan pencatatan STTB akan dikosongkan secara permanen.
              </p>
            </div>

            {/* Quick backup option before deleting */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="text-slate-600 dark:text-slate-300">Amankan cadangan data terlebih dahulu:</span>
              <button
                type="button"
                onClick={exportDatabaseJSON}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Backup JSON</span>
              </button>
            </div>

            {/* Safety Verification Inputs */}
            <div className="space-y-3 pt-1">
              <label className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasConfirmedCheckbox}
                  onChange={(e) => setHasConfirmedCheckbox(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <span className="font-medium">
                  Saya memahami bahwa seluruh data siswa akan dihapus dan saya siap menanggung konsekuensinya.
                </span>
              </label>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Ketik <span className="font-mono text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-900 font-bold">HAPUS SEMUA</span> untuk mengonfirmasi:
                </label>
                <input
                  type="text"
                  value={confirmDeleteText}
                  onChange={(e) => setConfirmDeleteText(e.target.value)}
                  placeholder="Ketik HAPUS SEMUA"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteAllModalOpen(false);
                  setConfirmDeleteText('');
                  setHasConfirmedCheckbox(false);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteAll}
                disabled={!hasConfirmedCheckbox || confirmDeleteText.trim().toUpperCase() !== 'HAPUS SEMUA'}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl shadow-md transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Semua Siswa</span>
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Import Excel / Spreadsheet Modal */}
      <ImportExcelModal
        isOpen={isImportExcelModalOpen}
        onClose={() => setIsImportExcelModalOpen(false)}
      />

      {/* ================= FORMAL PRINT REGISTER SISWA WITH KOP SURAT ================= */}
      <div className="hidden print:block max-w-[297mm] mx-auto bg-white text-slate-950 p-[10mm] font-serif text-[11px] leading-relaxed">
        <KopSuratHeader
          schoolProfile={schoolProfile}
          documentTitle="BUKU REGISTER INDUK PESERTA DIDIK"
          documentSubtitle={`DAFTAR REKAPITULASI PESERTA DIDIK ${selectedClass !== 'ALL' ? `(${selectedClass.toUpperCase()})` : 'SEMUA TINGKAT KELAS'} - TAHUN PELAJARAN ${schoolProfile.tahunPelajaranAktif || '2026/2027'}`}
        />

        <div className="my-2 flex justify-between items-center text-[10px] font-sans text-slate-700">
          <div>Total Data: <strong>{filteredStudents.length} Siswa</strong> | Filter Status: <strong>{selectedStatus === 'ALL' ? 'Semua Status' : selectedStatus}</strong></div>
          <div>Dicetak pada: {formatIndonesianDate(new Date().toISOString())}</div>
        </div>

        <table className="w-full border-collapse border border-slate-950 text-[10px] my-2">
          <thead>
            <tr className="bg-slate-100 text-slate-950 font-bold">
              <th className="border border-slate-950 px-2 py-1 text-center w-8">No</th>
              <th className="border border-slate-950 px-2 py-1 text-center w-24">No. Induk / NISN</th>
              <th className="border border-slate-950 px-2 py-1 text-left">Nama Lengkap Siswa</th>
              <th className="border border-slate-950 px-2 py-1 text-center w-8">L/P</th>
              <th className="border border-slate-950 px-2 py-1 text-center w-14">Kelas</th>
              <th className="border border-slate-950 px-2 py-1 text-left">Tempat, Tgl Lahir</th>
              <th className="border border-slate-950 px-2 py-1 text-left">Nama Orang Tua / Wali</th>
              <th className="border border-slate-950 px-2 py-1 text-left">Alamat / Desa</th>
              <th className="border border-slate-950 px-2 py-1 text-center w-14">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={9} className="border border-slate-950 px-3 py-4 text-center text-slate-500 italic">
                  Tidak ada data siswa yang sesuai kriteria filter.
                </td>
              </tr>
            ) : (
              filteredStudents.map((s, idx) => (
                <tr key={s.id}>
                  <td className="border border-slate-950 px-2 py-1 text-center font-mono">{idx + 1}</td>
                  <td className="border border-slate-950 px-2 py-1 text-center font-mono">{s.noInduk} / {s.nisn}</td>
                  <td className="border border-slate-950 px-2 py-1 font-bold uppercase">{s.namaLengkap}</td>
                  <td className="border border-slate-950 px-2 py-1 text-center font-bold">{s.jenisKelamin}</td>
                  <td className="border border-slate-950 px-2 py-1 text-center font-semibold">{s.kelasSekarang}</td>
                  <td className="border border-slate-950 px-2 py-1">{s.tempatLahir}, {formatIndonesianDate(s.tanggalLahir)}</td>
                  <td className="border border-slate-950 px-2 py-1">{s.ayah.nama || s.ibu.nama || '-'}</td>
                  <td className="border border-slate-950 px-2 py-1 text-[9px]">{s.alamat}, {s.kelurahanDesa}</td>
                  <td className="border border-slate-950 px-2 py-1 text-center font-semibold">{s.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Tanda Tangan Resmi Pengelola Buku Induk & Kepala Sekolah */}
        <div className="flex justify-between items-end mt-6 font-sans text-[11px] avoid-break">
          <div className="text-center">
            <div>Mengetahui,</div>
            <div>Pengelola Buku Induk / Tata Usaha</div>
            <div className="h-16" />
            <div className="font-bold underline">Petugas Tata Usaha</div>
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
    </div>
  );
};
