import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  SearchCheck, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  School, 
  UserCheck, 
  BookOpen, 
  ShieldCheck, 
  Award,
  User,
  Users,
  X,
  ChevronRight,
  GraduationCap,
  Calendar,
  FileCheck,
  Building2,
  Copy,
  Check
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { Student } from '../../types';
import { cn, formatIndonesianDate } from '../../lib/utils';

interface PublicVerifyViewProps {
  onBack?: () => void;
  onSelectStudentDetail?: (studentId: string) => void;
}

type SearchCategory = 'all' | 'nama' | 'nisn' | 'nis';

export const PublicVerifyView: React.FC<PublicVerifyViewProps> = ({
  onBack,
  onSelectStudentDetail,
}) => {
  const { students, schoolProfile } = useSchool();
  const [query, setQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState<SearchCategory>('all');
  const [searched, setSearched] = useState(false);
  const [searchedTerm, setSearchedTerm] = useState('');
  const [foundStudents, setFoundStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const normalizeText = (text?: string) => (text || '').toLowerCase().trim();

  // Search filter logic supporting Name, NISN, NIS, and NIK
  const filterStudents = (rawTerm: string, category: SearchCategory): Student[] => {
    const q = normalizeText(rawTerm);
    if (!q) return [];

    return students.filter((s) => {
      const namaMatch =
        normalizeText(s.namaLengkap).includes(q) ||
        normalizeText(s.namaPanggilan).includes(q);
      const nisnMatch = normalizeText(s.nisn).includes(q);
      const nisMatch = normalizeText(s.noInduk).includes(q);
      const nikMatch = s.nik ? normalizeText(s.nik).includes(q) : false;

      if (category === 'nama') return namaMatch;
      if (category === 'nisn') return nisnMatch;
      if (category === 'nis') return nisMatch;

      // 'all': matches either Nama, NISN, NIS, or NIK
      return namaMatch || nisnMatch || nisMatch || nikMatch;
    });
  };

  const sortStudents = (list: Student[], rawTerm: string): Student[] => {
    const q = normalizeText(rawTerm);
    return [...list].sort((a, b) => {
      // 1. Exact match priority
      const aExact =
        normalizeText(a.nisn) === q ||
        normalizeText(a.noInduk) === q ||
        normalizeText(a.namaLengkap) === q;
      const bExact =
        normalizeText(b.nisn) === q ||
        normalizeText(b.noInduk) === q ||
        normalizeText(b.namaLengkap) === q;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      // 2. Starts with priority
      const aStarts =
        normalizeText(a.namaLengkap).startsWith(q) ||
        normalizeText(a.nisn).startsWith(q) ||
        normalizeText(a.noInduk).startsWith(q);
      const bStarts =
        normalizeText(b.namaLengkap).startsWith(q) ||
        normalizeText(b.nisn).startsWith(q) ||
        normalizeText(b.noInduk).startsWith(q);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      // 3. Alphabetical order by name
      return a.namaLengkap.localeCompare(b.namaLengkap);
    });
  };

  // Auto-search or select student from URL parameters (scanned from Kartu Pelajar QR Code)
  useEffect(() => {
    if (typeof window === 'undefined' || students.length === 0) return;
    const urlParams = new URLSearchParams(window.location.search);
    const verifyTerm = urlParams.get('verify') || urlParams.get('nisn') || '';
    const studentId = urlParams.get('id') || '';
    const hash = window.location.hash || '';
    const hashTerm = hash.startsWith('#verify-') ? decodeURIComponent(hash.replace('#verify-', '')) : '';

    const searchTerm = verifyTerm || hashTerm || '';

    if (studentId || searchTerm) {
      const match = students.find((s) => 
        (studentId && s.id === studentId) ||
        (searchTerm && (
          normalizeText(s.nisn) === normalizeText(searchTerm) ||
          normalizeText(s.noInduk) === normalizeText(searchTerm) ||
          normalizeText(s.id) === normalizeText(searchTerm) ||
          normalizeText(s.namaLengkap) === normalizeText(searchTerm)
        ))
      );

      if (match) {
        setSelectedStudent(match);
        setFoundStudents([match]);
        setSearched(true);
        setSearchedTerm(match.namaLengkap);
        setQuery(match.nisn || match.namaLengkap);
      } else if (searchTerm) {
        setQuery(searchTerm);
        const filtered = filterStudents(searchTerm, 'all');
        const sorted = sortStudents(filtered, searchTerm);
        setFoundStudents(sorted);
        setSearched(true);
        setSearchedTerm(searchTerm);
        if (sorted.length === 1) {
          setSelectedStudent(sorted[0]);
        }
      }
    }
  }, [students]);

  // Live suggestions for dropdown while typing
  const liveSuggestions = React.useMemo(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];
    const filtered = filterStudents(trimmed, searchCategory);
    return sortStudents(filtered, trimmed).slice(0, 6);
  }, [query, searchCategory, students]);

  const handleSelectStudentFromSuggestion = (student: Student) => {
    setQuery(student.namaLengkap);
    setSearchedTerm(student.namaLengkap);
    setFoundStudents([student]);
    setSelectedStudent(student);
    setSearched(true);
    setIsDropdownOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = query.trim();
    if (!term) return;

    setIsDropdownOpen(false);
    const filtered = filterStudents(term, searchCategory);
    const sorted = sortStudents(filtered, term);

    setSearchedTerm(term);
    setFoundStudents(sorted);
    setSearched(true);

    if (sorted.length === 1) {
      setSelectedStudent(sorted[0]);
    } else {
      setSelectedStudent(null);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSearched(false);
    setFoundStudents([]);
    setSelectedStudent(null);
    setIsDropdownOpen(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#003399] dark:text-blue-400" />
            <span className="hidden sm:inline">Kembali</span>
          </button>
        )}
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Verifikasi & Cek NISN Siswa
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Layanan pencarian cepat dan pengecekan keabsahan data siswa terdaftar di {schoolProfile.namaSekolah}
          </p>
        </div>
      </div>

      {/* Search Box Card */}
      <div 
        ref={searchContainerRef}
        className="max-w-2xl mx-auto p-6 md:p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-5 relative"
      >
        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#003399] dark:text-blue-400 flex items-center justify-center mx-auto shadow-inner">
          <SearchCheck className="w-6 h-6" />
        </div>
        
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
            Pencarian & Pengecekan Data Siswa
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Ketik <span className="font-semibold text-blue-600 dark:text-blue-400">Nama Lengkap</span>, <span className="font-semibold text-slate-700 dark:text-slate-300">NISN</span>, <span className="font-semibold text-slate-700 dark:text-slate-300">NIS</span>, atau <span className="font-semibold text-slate-700 dark:text-slate-300">NIK</span> untuk memverifikasi arsip buku induk resmi.
          </p>
        </div>

        {/* Filter Category Chips */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
          <span className="text-[11px] text-slate-400 font-medium mr-1 hidden sm:inline">Cari via:</span>
          {(
            [
              { id: 'all', label: 'Semua Kriteria' },
              { id: 'nama', label: 'Nama Siswa' },
              { id: 'nisn', label: 'NISN' },
              { id: 'nis', label: 'NIS / No. Induk' },
            ] as const
          ).map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setSearchCategory(cat.id);
                if (query.trim()) {
                  const filtered = filterStudents(query.trim(), cat.id);
                  const sorted = sortStudents(filtered, query.trim());
                  setFoundStudents(sorted);
                  if (searched) {
                    setSelectedStudent(sorted.length === 1 ? sorted[0] : null);
                  }
                }
              }}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border",
                searchCategory === cat.id
                  ? "bg-[#003399] text-white border-[#003399] shadow-xs"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input Form */}
        <form onSubmit={handleSearch} className="relative max-w-lg mx-auto">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                required
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setIsDropdownOpen(true);
                  if (searched) {
                    setSearched(false);
                  }
                }}
                onFocus={() => {
                  if (query.trim().length >= 2) {
                    setIsDropdownOpen(true);
                  }
                }}
                placeholder={
                  searchCategory === 'nama'
                    ? "Ketik Nama Siswa (contoh: Ahmad, Siti)..."
                    : searchCategory === 'nisn'
                    ? "Ketik 10 Digit NISN (contoh: 0081234567)..."
                    : searchCategory === 'nis'
                    ? "Ketik Nomor Induk Siswa (contoh: 2024001)..."
                    : "Cari Nama Siswa, NISN (008...), atau NIS..."
                }
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#003399] transition-all shadow-xs"
              />
              {query && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  title="Hapus pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#003399] hover:bg-[#002266] text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Cari Siswa</span>
            </button>
          </div>

          {/* Live Autocomplete / Suggestions Dropdown */}
          {isDropdownOpen && liveSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-30 overflow-hidden text-left animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#003399] dark:text-blue-400" />
                  Siswa Ditemukan ({liveSuggestions.length})
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Klik untuk verifikasi</span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60">
                {liveSuggestions.map((student) => (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => handleSelectStudentFromSuggestion(student)}
                    className="w-full px-3.5 py-2.5 hover:bg-blue-50/70 dark:hover:bg-blue-950/40 flex items-center justify-between gap-3 text-left transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/60 text-[#003399] dark:text-blue-300 font-extrabold text-xs flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-700">
                        {student.fotoUrl ? (
                          <img
                            src={student.fotoUrl}
                            alt={student.namaLengkap}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          student.namaLengkap.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 truncate">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#003399] dark:group-hover:text-blue-400 truncate">
                          {student.namaLengkap}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="font-mono">NISN: {student.nisn || '-'}</span>
                          <span>•</span>
                          <span>NIS: {student.noInduk}</span>
                          <span>•</span>
                          <span className="font-medium">Kelas {student.kelasSekarang}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-[#003399] dark:text-blue-400 shrink-0 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      Pilih <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Search Results Area */}
      {searched && (
        <div className="max-w-3xl mx-auto space-y-4 animate-in fade-in zoom-in-95 duration-150">
          {foundStudents.length > 0 ? (
            <>
              {/* If multiple students found, show navigation selector */}
              {foundStudents.length > 1 && (
                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#003399] animate-pulse" />
                      <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Ditemukan <span className="text-[#003399] dark:text-blue-400 font-extrabold">{foundStudents.length} siswa</span> dengan kata kunci &quot;{searchedTerm}&quot;:
                      </h3>
                    </div>
                    {selectedStudent && (
                      <button
                        type="button"
                        onClick={() => setSelectedStudent(null)}
                        className="text-xs font-semibold text-[#003399] dark:text-blue-400 hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                      >
                        Lihat Semua Hasil ({foundStudents.length})
                      </button>
                    )}
                  </div>

                  {/* Multiple student choices list */}
                  {!selectedStudent && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {foundStudents.map((student) => {
                        return (
                          <div
                            key={student.id}
                            onClick={() => setSelectedStudent(student)}
                            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#003399] dark:hover:border-blue-500 bg-slate-50/60 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer group flex flex-col justify-between"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-[#003399] dark:text-blue-300 font-extrabold text-sm flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
                                {student.fotoUrl ? (
                                  <img
                                    src={student.fotoUrl}
                                    alt={student.namaLengkap}
                                    className="w-full h-full object-cover rounded-xl"
                                  />
                                ) : (
                                  student.namaLengkap.charAt(0).toUpperCase()
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-extrabold text-xs text-slate-900 dark:text-slate-100 group-hover:text-[#003399] dark:group-hover:text-blue-400 transition-colors truncate">
                                  {student.namaLengkap}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                                  NISN: <span className="font-semibold text-slate-700 dark:text-slate-300">{student.nisn || '-'}</span>
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                                  <span>Kelas {student.kelasSekarang}</span>
                                  <span>•</span>
                                  <span>{student.jenisKelamin === 'L' ? 'Laki-Laki' : 'Perempuan'}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-bold",
                                student.status === 'Aktif'
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : student.status === 'Lulus'
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              )}>
                                {student.status}
                              </span>
                              <span className="text-[11px] font-bold text-[#003399] dark:text-blue-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                Verifikasi <ChevronRight className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Detailed Verified Student Card */}
              {selectedStudent && (
                <div className="p-6 md:p-8 bg-white dark:bg-slate-900 rounded-3xl border-2 border-emerald-500/40 shadow-md space-y-6 animate-in fade-in duration-200">
                  {/* Top Status Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      <span>DATA TERVERIFIKASI RESMI DI BUKU INDUK</span>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {foundStudents.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setSelectedStudent(null)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          ← Ganti Siswa ({foundStudents.length})
                        </button>
                      )}
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold",
                        selectedStudent.status === 'Aktif'
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : selectedStudent.status === 'Lulus'
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      )}>
                        Status: {selectedStudent.status}
                      </span>
                    </div>
                  </div>

                  {/* Student Profile Overview */}
                  <div className="flex flex-col sm:flex-row items-start gap-4 p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white dark:bg-slate-800 text-[#003399] dark:text-blue-300 font-black text-xl flex items-center justify-center shrink-0 shadow-xs border border-blue-200 dark:border-blue-800 overflow-hidden">
                      {selectedStudent.fotoUrl ? (
                        <img
                          src={selectedStudent.fotoUrl}
                          alt={selectedStudent.namaLengkap}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{selectedStudent.namaLengkap.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                          {selectedStudent.namaLengkap}
                        </h2>
                        {selectedStudent.namaPanggilan && (
                          <span className="text-xs px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium">
                            Panggilan: &quot;{selectedStudent.namaPanggilan}&quot;
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="text-slate-400">NISN:</span>
                          <span className="font-bold text-[#003399] dark:text-blue-400">{selectedStudent.nisn || '-'}</span>
                          {selectedStudent.nisn && (
                            <button
                              type="button"
                              onClick={() => handleCopy(selectedStudent.nisn, 'nisn')}
                              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                              title="Salin NISN"
                            >
                              {copiedId === 'nisn' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="text-slate-400">NIS:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{selectedStudent.noInduk}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(selectedStudent.noInduk, 'nis')}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                            title="Salin NIS"
                          >
                            {copiedId === 'nis' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        {selectedStudent.nik && (
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="text-slate-400">NIK:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedStudent.nik}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Detailed Information Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400 font-medium block">Tempat, Tanggal Lahir:</span>
                      <div className="font-bold text-slate-800 dark:text-slate-200 mt-1 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>{selectedStudent.tempatLahir}, {formatIndonesianDate(selectedStudent.tanggalLahir)}</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400 font-medium block">Jenis Kelamin & Kelas:</span>
                      <div className="font-bold text-slate-800 dark:text-slate-200 mt-1 flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>
                          {selectedStudent.jenisKelamin === 'L' ? 'Laki-Laki' : 'Perempuan'} • Kelas {selectedStudent.kelasSekarang}
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400 font-medium block">Agama & Kewarganegaraan:</span>
                      <div className="font-bold text-slate-800 dark:text-slate-200 mt-1">
                        {selectedStudent.agama} • {selectedStudent.kewarganegaraan || 'WNI'}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400 font-medium block">Nama Orang Tua (Ayah / Ibu):</span>
                      <div className="font-bold text-slate-800 dark:text-slate-200 mt-1 truncate">
                        {selectedStudent.orangTuaAyah?.nama || '-'} / {selectedStudent.orangTuaIbu?.nama || '-'}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 sm:col-span-2">
                      <span className="text-slate-400 font-medium block">Satuan Pendidikan Terdaftar:</span>
                      <div className="font-bold text-slate-800 dark:text-slate-200 mt-1 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>{schoolProfile.namaSekolah} (NPSN: {schoolProfile.npsn})</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Alamat: {schoolProfile.alamat}, {schoolProfile.kelurahan}, {schoolProfile.kecamatan}, {schoolProfile.kabupatenKota}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bottom Bar */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>Terdata di Sistem Buku Induk Register Elektronik</span>
                    </div>

                    {onSelectStudentDetail && (
                      <button
                        onClick={() => onSelectStudentDetail(selectedStudent.id)}
                        className="w-full sm:w-auto px-4 py-2.5 bg-[#003399] hover:bg-[#002266] text-white rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>Buka Lembar Buku Induk Lengkap →</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Not Found State */
            <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900/40 text-center space-y-3.5 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-500 flex items-center justify-center mx-auto">
                <XCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Data Siswa Tidak Ditemukan
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Pencarian dengan kata kunci &quot;<span className="font-semibold text-slate-700 dark:text-slate-300">{searchedTerm}</span>&quot; tidak ditemukan dalam arsip buku induk {schoolProfile.namaSekolah}.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="font-semibold">Tips pencarian:</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">Periksa ejaan nama siswa</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">Gunakan NISN 10 digit</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">Cari dengan nomor induk (NIS)</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
