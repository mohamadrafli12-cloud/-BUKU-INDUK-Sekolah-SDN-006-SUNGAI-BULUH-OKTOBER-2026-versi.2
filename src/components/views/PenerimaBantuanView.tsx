import React, { useState, useMemo } from 'react';
import { 
  HandCoins, 
  Search, 
  Filter, 
  Printer, 
  Download, 
  Plus, 
  User, 
  Building2, 
  Users, 
  CreditCard, 
  Landmark, 
  School, 
  MapPin, 
  Sparkles, 
  Calendar, 
  CheckCircle2, 
  Edit3, 
  Eye, 
  ArrowUpDown, 
  X, 
  FileSpreadsheet, 
  ShieldCheck, 
  Percent, 
  ChevronRight,
  HelpCircle,
  Layers,
  History,
  Clock,
  Trash2,
  AlertCircle,
  Check,
  Coins,
  PieChart
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useSchool } from '../../context/SchoolContext';
import { Student, Gender, JenisBantuan, BantuanRecord } from '../../types';
import { cn, formatIndonesianDate, formatCurrencyIDR } from '../../lib/utils';
import { KopSuratHeader } from '../layout/KopSuratHeader';
import { RingkasanStatistikBantuan } from '../analytics/RingkasanStatistikBantuan';
import { RingkasanAkumulasiBantuan, parseNominalToNumber } from '../analytics/RingkasanAkumulasiBantuan';

interface PenerimaBantuanViewProps {
  onEditStudent: (student: Student, initialTab?: 'pribadi' | 'alamat' | 'ortu' | 'kesehatan' | 'masuk' | 'bantuan') => void;
  onSelectDetail: (studentId: string) => void;
  onBack: () => void;
  setActiveTab?: (tab: any) => void;
}

export const PenerimaBantuanView: React.FC<PenerimaBantuanViewProps> = ({
  onEditStudent,
  onSelectDetail,
  onBack,
  setActiveTab,
}) => {
  const { students, schoolProfile, updateStudent, logActivity } = useSchool();
  const activeTP = schoolProfile?.tahunPelajaranAktif || '2026/2027';

  // Filters state
  const [selectedTP, setSelectedTP] = useState<string>(activeTP);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterJenis, setFilterJenis] = useState<string>('ALL');
  const [filterKelas, setFilterKelas] = useState<string>('ALL');
  const [filterGender, setFilterGender] = useState<string>('ALL');
  const [filterTahap, setFilterTahap] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'nama' | 'kelas' | 'jenis'>('nama');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Mode Tampilan Ringkasan Statistik & Anggaran
  const [statsViewMode, setStatsViewMode] = useState<'all' | 'budget' | 'detail'>('all');

  // Modals state
  const [isAddBantuanModalOpen, setIsAddBantuanModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Selected Student for "Tambahkan Bantuan" & Riwayat
  const [selectedStudentForBantuanId, setSelectedStudentForBantuanId] = useState<string>('');
  const [studentSearchInModal, setStudentSearchInModal] = useState<string>('');
  const [modalNotification, setModalNotification] = useState<string | null>(null);

  // Form state for adding new assistance
  const [formJenis, setFormJenis] = useState<string>('Penerima PIP');
  const [formBantuanLainnya, setFormBantuanLainnya] = useState<string>('');
  const [formTahunPelajaran, setFormTahunPelajaran] = useState<string>(activeTP);
  const [formTahap, setFormTahap] = useState<string>('Tahap 1');
  const [formTanggalMenerima, setFormTanggalMenerima] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formNominal, setFormNominal] = useState<string>('Rp 450.000 / tahun');
  const [formStatusPencairan, setFormStatusPencairan] = useState<'Sudah Cair' | 'Dalam Proses' | 'Belum Cair'>('Sudah Cair');
  const [formKeterangan, setFormKeterangan] = useState<string>('');

  // Helper to extract student's aid types array for a specific academic year (or ALL)
  const getStudentBantuanTypes = (s: Student, tp?: string): string[] => {
    const typesSet = new Set<string>();
    const hasHistory = Boolean(s.riwayatBantuan && Array.isArray(s.riwayatBantuan) && s.riwayatBantuan.length > 0);

    if (hasHistory) {
      s.riwayatBantuan!.forEach(r => {
        if (!tp || tp === 'ALL' || r.tahunPelajaran === tp) {
          if (r.jenis) typesSet.add(r.jenis);
        }
      });
      return Array.from(typesSet);
    }

    // Only if student has no riwayatBantuan, fall back to legacy fields if year matches
    const bYear = s.tahunBantuan || (s.tahunPelajaranKelasSekarang || activeTP);
    if (!tp || tp === 'ALL' || bYear === tp) {
      if (s.jenisBantuanList && s.jenisBantuanList.length > 0) {
        s.jenisBantuanList.forEach(t => typesSet.add(t));
      } else if (s.penerimaBantuan && s.penerimaBantuan !== 'Tidak' && s.penerimaBantuan !== 'Bukan Penerima') {
        s.penerimaBantuan.split(',').map(x => x.trim()).filter(Boolean).forEach(t => typesSet.add(t));
      }
    }
    return Array.from(typesSet);
  };

  // Helper function to check if student is a recipient (ever received aid)
  const isBantuanRecipient = (s: Student): boolean => {
    const hasHistory = Boolean(s.riwayatBantuan && s.riwayatBantuan.length > 0);
    const hasExplicitBantuan = Boolean(
      (s.penerimaBantuan && s.penerimaBantuan !== 'Tidak' && s.penerimaBantuan !== 'Bukan Penerima' && s.penerimaBantuan.trim() !== '') ||
      (s.jenisBantuanList && s.jenisBantuanList.length > 0)
    );
    return hasHistory || hasExplicitBantuan;
  };

  // Helper to get academic year of assistance
  const getBantuanYear = (s: Student): string => {
    return s.tahunBantuan || (s.tahunPelajaranKelasSekarang || activeTP);
  };

  // Helper to get all assistance records of a student for a specific academic year (or ALL)
  const getStudentBantuanRecords = (s: Student, tp: string): BantuanRecord[] => {
    const records: BantuanRecord[] = [];
    const hasHistory = Boolean(s.riwayatBantuan && Array.isArray(s.riwayatBantuan) && s.riwayatBantuan.length > 0);

    if (hasHistory) {
      s.riwayatBantuan!.forEach(r => {
        if (tp === 'ALL' || r.tahunPelajaran === tp) {
          records.push(r);
        }
      });
      return records;
    }

    // If student has legacy top-level bantuan and no riwayatBantuan array
    if (isBantuanRecipient(s)) {
      const bYear = getBantuanYear(s);
      if (tp === 'ALL' || bYear === tp) {
        const types = getStudentBantuanTypes(s, bYear);
        types.forEach((t, i) => {
          records.push({
            id: `legacy-${s.id}-${i}`,
            jenis: t,
            bantuanLainnya: t === 'Bantuan Lainnya' ? s.bantuanLainnya : undefined,
            tahunPelajaran: bYear,
            tahap: s.tahapBantuan || 'Tahap 1',
            tanggalMenerima: s.tanggalMenerimaBantuan,
            nominal: s.nominalBantuan || 'Rp 450.000 / tahun',
            keterangan: s.keteranganBantuan,
            statusPencairan: s.tanggalMenerimaBantuan ? 'Sudah Cair' : 'Dalam Proses',
          });
        });
      }
    }
    return records;
  };

  // Active students scope (students currently active in school)
  const activeStudentsInSchool = useMemo(() => {
    return students.filter(s => s.status === 'Aktif' || !s.status);
  }, [students]);

  // All assistance recipients filtered strictly by chosen Academic Year (Tahun Pelajaran)
  const recipientsInSelectedTP = useMemo(() => {
    return students.filter(s => {
      if (!isBantuanRecipient(s)) return false;
      if (selectedTP === 'ALL') {
        return true;
      }
      // Strict matching: only students with aid records in the selected year appear
      const records = getStudentBantuanRecords(s, selectedTP);
      return records.length > 0;
    });
  }, [students, selectedTP]);

  // List of unique Tahap options available in current dataset or standard terms
  const availableTahapOptions = useMemo(() => {
    const tahapSet = new Set<string>();
    recipientsInSelectedTP.forEach(s => {
      const records = getStudentBantuanRecords(s, selectedTP);
      records.forEach(r => {
        if (r.tahap && r.tahap.trim()) tahapSet.add(r.tahap.trim());
      });
      const t = s.tahapBantuan ? s.tahapBantuan.trim() : 'Tahap 1';
      if (t) tahapSet.add(t);
    });
    // Ensure common stages are available if user wants to filter
    ['Tahap 1', 'Tahap 2', 'Tahap 3', 'Tahap 4', 'Semester Ganjil', 'Semester Genap'].forEach(def => {
      if (recipientsInSelectedTP.some(s => {
        const records = getStudentBantuanRecords(s, selectedTP);
        return records.some(r => (r.tahap || '').toLowerCase() === def.toLowerCase()) ||
          (s.tahapBantuan || 'Tahap 1').toLowerCase() === def.toLowerCase();
      })) {
        tahapSet.add(def);
      }
    });
    return Array.from(tahapSet);
  }, [recipientsInSelectedTP, selectedTP]);

  // Filtered & Sorted Recipients for Table Display
  const filteredRecipients = useMemo(() => {
    return recipientsInSelectedTP.filter(s => {
      // Search filter
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = q === '' ||
        s.namaLengkap.toLowerCase().includes(q) ||
        s.noInduk.toLowerCase().includes(q) ||
        s.nisn.toLowerCase().includes(q) ||
        (s.bantuanLainnya && s.bantuanLainnya.toLowerCase().includes(q)) ||
        (s.keteranganBantuan && s.keteranganBantuan.toLowerCase().includes(q));

      // Jenis Bantuan filter (sesuai tahun pelajaran terpilih)
      const types = getStudentBantuanTypes(s, selectedTP);
      const studentRecords = getStudentBantuanRecords(s, selectedTP);
      let matchJenis = true;
      if (filterJenis !== 'ALL') {
        if (filterJenis === 'Bantuan Lainnya') {
          matchJenis = types.includes('Bantuan Lainnya') || 
            studentRecords.some(r => r.jenis === 'Bantuan Lainnya' || Boolean(r.bantuanLainnya)) || 
            Boolean(s.bantuanLainnya);
        } else {
          matchJenis = types.includes(filterJenis);
        }
      }

      // Kelas filter
      const matchKelas = filterKelas === 'ALL' || s.kelasSekarang === filterKelas;

      // Gender filter
      const matchGender = filterGender === 'ALL' || s.jenisKelamin === filterGender;

      // Tahap filter (sesuai catatan bantuan di tahun pelajaran terpilih)
      let matchTahap = true;
      if (filterTahap !== 'ALL') {
        matchTahap = studentRecords.some(r => (r.tahap || 'Tahap 1').toLowerCase() === filterTahap.toLowerCase()) ||
          (!studentRecords.length && (s.tahapBantuan || 'Tahap 1').toLowerCase() === filterTahap.toLowerCase());
      }

      return matchSearch && matchJenis && matchKelas && matchGender && matchTahap;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'nama') {
        comparison = a.namaLengkap.localeCompare(b.namaLengkap);
      } else if (sortBy === 'kelas') {
        comparison = (a.kelasSekarang || '').localeCompare(b.kelasSekarang || '');
      } else if (sortBy === 'jenis') {
        const typeA = getStudentBantuanTypes(a, selectedTP).join(', ');
        const typeB = getStudentBantuanTypes(b, selectedTP).join(', ');
        comparison = typeA.localeCompare(typeB);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [recipientsInSelectedTP, searchQuery, filterJenis, filterKelas, filterGender, filterTahap, sortBy, sortOrder, selectedTP]);

  // =========================================================================
  // STATISTIK PERHITUNGAN BANTUAN (Sesuai instruksi: "buatkan statik nya")
  // =========================================================================
  const stats = useMemo(() => {
    const totalPenerima = recipientsInSelectedTP.length;
    const totalSiswaAktif = activeStudentsInSchool.length;
    const persenDariTotal = totalSiswaAktif > 0 ? Math.round((totalPenerima / totalSiswaAktif) * 100) : 0;

    let countPIP = 0;
    let countBaznas = 0;
    let countSekolah = 0;
    let countDesa = 0;
    let countLainnya = 0;

    let totalL = 0;
    let totalP = 0;

    const kelasCounts: Record<string, { total: number; l: number; p: number }> = {
      'Kelas 1': { total: 0, l: 0, p: 0 },
      'Kelas 2': { total: 0, l: 0, p: 0 },
      'Kelas 3': { total: 0, l: 0, p: 0 },
      'Kelas 4': { total: 0, l: 0, p: 0 },
      'Kelas 5': { total: 0, l: 0, p: 0 },
      'Kelas 6': { total: 0, l: 0, p: 0 },
    };

    const tahapCounts: Record<string, number> = {};

    let totalNominalDana = 0;
    let totalDanaCair = 0;

    recipientsInSelectedTP.forEach(s => {
      const records = getStudentBantuanRecords(s, selectedTP);
      const types = getStudentBantuanTypes(s, selectedTP);

      // Accumulate nominal
      records.forEach(r => {
        const nom = parseNominalToNumber(r.nominal);
        totalNominalDana += nom;
        if (r.statusPencairan === 'Sudah Cair' || r.tanggalMenerima) {
          totalDanaCair += nom;
        }
      });

      if (types.includes('Penerima PIP')) countPIP++;
      if (types.includes('Baznas')) countBaznas++;
      if (types.includes('Bantuan Sekolah')) countSekolah++;
      if (types.includes('Bantuan dari desa')) countDesa++;
      if (types.includes('Bantuan Lainnya') || s.bantuanLainnya || records.some(r => r.jenis === 'Bantuan Lainnya')) countLainnya++;

      if (s.jenisKelamin === 'L') totalL++;
      else if (s.jenisKelamin === 'P') totalP++;

      const k = s.kelasSekarang || 'Kelas 1';
      const cleanK = k.split(' ')[0] + ' ' + (k.split(' ')[1] || '1');
      if (kelasCounts[cleanK]) {
        kelasCounts[cleanK].total++;
        if (s.jenisKelamin === 'L') kelasCounts[cleanK].l++;
        else kelasCounts[cleanK].p++;
      }

      if (records.length > 0) {
        records.forEach(r => {
          const t = r.tahap ? r.tahap.trim() : 'Tahap 1';
          tahapCounts[t] = (tahapCounts[t] || 0) + 1;
        });
      } else {
        const t = s.tahapBantuan ? s.tahapBantuan.trim() : 'Tahap 1';
        tahapCounts[t] = (tahapCounts[t] || 0) + 1;
      }
    });

    return {
      totalPenerima,
      totalSiswaAktif,
      persenDariTotal,
      countPIP,
      countBaznas,
      countSekolah,
      countDesa,
      countLainnya,
      totalL,
      totalP,
      persenL: totalPenerima > 0 ? Math.round((totalL / totalPenerima) * 100) : 0,
      persenP: totalPenerima > 0 ? Math.round((totalP / totalPenerima) * 100) : 0,
      kelasCounts,
      tahapCounts,
      totalNominalDana,
      totalDanaCair,
    };
  }, [recipientsInSelectedTP, activeStudentsInSchool, selectedTP]);

  // Handler: Buka Menu "Tambahkan Bantuan" & Riwayat
  const handleOpenAddBantuan = (studentId?: string | null) => {
    if (studentId) {
      setSelectedStudentForBantuanId(studentId);
    } else if (!selectedStudentForBantuanId && activeStudentsInSchool.length > 0) {
      setSelectedStudentForBantuanId(activeStudentsInSchool[0].id);
    }
    setStudentSearchInModal('');
    setFormJenis('Penerima PIP');
    setFormBantuanLainnya('');
    setFormTahunPelajaran(activeTP);
    setFormTahap('Tahap 1');
    setFormTanggalMenerima(new Date().toISOString().split('T')[0]);
    setFormNominal('Rp 450.000 / tahun');
    setFormStatusPencairan('Sudah Cair');
    setFormKeterangan('');
    setModalNotification(null);
    setIsAddBantuanModalOpen(true);
  };

  // Handler: Simpan Bantuan Baru ke Riwayat Siswa
  const handleSaveNewBantuan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForBantuanId) {
      alert('Pilih siswa aktif terlebih dahulu.');
      return;
    }
    const targetStudent = students.find(s => s.id === selectedStudentForBantuanId);
    if (!targetStudent) return;

    const newRecord: BantuanRecord = {
      id: `btn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      jenis: formJenis,
      bantuanLainnya: formJenis === 'Bantuan Lainnya' ? formBantuanLainnya : undefined,
      tahunPelajaran: formTahunPelajaran || activeTP,
      tahap: formTahap || 'Tahap 1',
      tanggalMenerima: formTanggalMenerima,
      nominal: formNominal || 'Rp 450.000 / tahun',
      keterangan: formKeterangan,
      statusPencairan: formStatusPencairan,
      dibuatPada: new Date().toISOString(),
    };

    const existingHistory = getStudentBantuanRecords(targetStudent, 'ALL');
    const updatedHistory = [newRecord, ...existingHistory];
    const uniqueTypes = Array.from(new Set(updatedHistory.map(r => r.jenis)));

    updateStudent(selectedStudentForBantuanId, {
      riwayatBantuan: updatedHistory,
      penerimaBantuan: uniqueTypes.join(', '),
      jenisBantuanList: uniqueTypes,
      bantuanLainnya: formJenis === 'Bantuan Lainnya' ? formBantuanLainnya : targetStudent.bantuanLainnya,
      tahunBantuan: formTahunPelajaran || activeTP,
      tahapBantuan: formTahap,
      tanggalMenerimaBantuan: formTanggalMenerima,
      nominalBantuan: formNominal,
      keteranganBantuan: formKeterangan || targetStudent.keteranganBantuan,
    });

    logActivity('EDIT', `Menambahkan riwayat bantuan ${formJenis} (${formTahap}) untuk ${targetStudent.namaLengkap} di TP ${formTahunPelajaran}`);
    setModalNotification(`Bantuan ${formJenis} (${formTahap}) berhasil ditambahkan ke riwayat ${targetStudent.namaLengkap}!`);
    setTimeout(() => {
      setModalNotification(null);
    }, 4000);

    // Reset keterangan agar siap jika ingin menambah bantuan berikutnya
    setFormKeterangan('');
  };

  // Handler: Hapus item bantuan tertentu dari riwayat siswa
  const handleDeleteBantuanRecord = (recordId: string) => {
    if (!selectedStudentForBantuanId) return;
    const targetStudent = students.find(s => s.id === selectedStudentForBantuanId);
    if (!targetStudent) return;

    if (!confirm('Apakah Anda yakin ingin menghapus catatan bantuan ini dari riwayat siswa?')) {
      return;
    }

    const existingHistory = getStudentBantuanRecords(targetStudent, 'ALL');
    const updatedHistory = existingHistory.filter(r => r.id !== recordId);
    const uniqueTypes = Array.from(new Set(updatedHistory.map(r => r.jenis)));

    updateStudent(selectedStudentForBantuanId, {
      riwayatBantuan: updatedHistory,
      penerimaBantuan: uniqueTypes.length > 0 ? uniqueTypes.join(', ') : 'Tidak',
      jenisBantuanList: uniqueTypes,
    });

    logActivity('EDIT', `Menghapus salah satu catatan bantuan dari riwayat ${targetStudent.namaLengkap}`);
    setModalNotification('Catatan bantuan berhasil dihapus dari riwayat siswa.');
    setTimeout(() => {
      setModalNotification(null);
    }, 3000);
  };

  // Handler: Export to Excel (.xlsx)
  const handleExportExcel = () => {
    try {
      const dataRows = filteredRecipients.map((s, idx) => {
        const records = getStudentBantuanRecords(s, selectedTP);
        const programList = records.length > 0 
          ? records.map(r => `${r.jenis}${r.tahap ? ` (${r.tahap})` : ''}`).join('; ')
          : getStudentBantuanTypes(s, selectedTP).join(', ');
        const nominalList = records.length > 0
          ? records.map(r => r.nominal).filter(Boolean).join('; ')
          : s.nominalBantuan || '-';
        const tahapList = records.length > 0
          ? records.map(r => r.tahap).filter(Boolean).join(', ')
          : s.tahapBantuan || 'Tahap 1';
        const tglList = records.length > 0
          ? records.map(r => r.tanggalMenerima ? formatIndonesianDate(r.tanggalMenerima) : '-').join('; ')
          : (s.tanggalMenerimaBantuan ? formatIndonesianDate(s.tanggalMenerimaBantuan) : '-');
        const ketList = records.length > 0
          ? records.map(r => r.keterangan).filter(Boolean).join('; ')
          : s.keteranganBantuan || '-';
        const displayYear = selectedTP === 'ALL'
          ? (records[0]?.tahunPelajaran || getBantuanYear(s))
          : selectedTP;

        return {
          'No': idx + 1,
          'Nama Lengkap Siswa': s.namaLengkap,
          'NIS': s.noInduk,
          'NISN': s.nisn,
          'Jenis Kelamin': s.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan',
          'Kelas Saat Ini': s.kelasSekarang,
          'Program / Jenis Bantuan': programList,
          'Rincian / Bantuan Lainnya': records[0]?.bantuanLainnya || s.bantuanLainnya || '-',
          'Tahun Pelajaran': displayYear,
          'Tahap / Termin': tahapList,
          'Tanggal Menerima': tglList,
          'Nominal Bantuan': nominalList,
          'Keterangan / No. SK': ketList,
          'Total Riwayat Bantuan': records.length || 1,
        };
      });

      const summaryRows = [
        { 'Kategori': 'Tahun Pelajaran Acuan', 'Jumlah': selectedTP === 'ALL' ? 'Semua Tahun' : selectedTP },
        { 'Kategori': 'Filter Termin / Tahap', 'Jumlah': filterTahap === 'ALL' ? 'Semua Tahap' : filterTahap },
        { 'Kategori': 'Total Siswa Penerima Bantuan', 'Jumlah': stats.totalPenerima },
        { 'Kategori': 'Total Siswa Aktif Sekolah', 'Jumlah': stats.totalSiswaAktif },
        { 'Kategori': 'Persentase Penerima', 'Jumlah': `${stats.persenDariTotal}%` },
        { 'Kategori': 'Penerima PIP Kemdikbud', 'Jumlah': stats.countPIP },
        { 'Kategori': 'Penerima Baznas', 'Jumlah': stats.countBaznas },
        { 'Kategori': 'Penerima Bantuan Sekolah', 'Jumlah': stats.countSekolah },
        { 'Kategori': 'Penerima Bantuan dari Desa', 'Jumlah': stats.countDesa },
        { 'Kategori': 'Penerima Bantuan Lainnya', 'Jumlah': stats.countLainnya },
        { 'Kategori': 'Total Akumulasi Dana Bantuan', 'Jumlah': formatCurrencyIDR(stats.totalNominalDana) },
        { 'Kategori': 'Total Dana Realisasi (Cair)', 'Jumlah': formatCurrencyIDR(stats.totalDanaCair) },
        { 'Kategori': 'Laki-laki', 'Jumlah': stats.totalL },
        { 'Kategori': 'Perempuan', 'Jumlah': stats.totalP },
      ];

      const wb = XLSX.utils.book_new();
      const wsData = XLSX.utils.json_to_sheet(dataRows);
      const wsSummary = XLSX.utils.json_to_sheet(summaryRows);

      XLSX.utils.book_append_sheet(wb, wsData, 'Daftar Penerima Bantuan');
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Statistik');

      const fileName = `Rekap_Penerima_Bantuan_TP_${selectedTP.replace('/', '_')}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (err) {
      console.error('Failed to export excel:', err);
      alert('Gagal mengekspor data ke Excel.');
    }
  };

  // Badge Color helper
  const renderJenisBadge = (jenis: string, customName?: string) => {
    switch (jenis) {
      case 'Penerima PIP':
        return (
          <span key={jenis} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <CreditCard className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            <span>PIP Kemdikbud</span>
          </span>
        );
      case 'Baznas':
        return (
          <span key={jenis} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Landmark className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Baznas</span>
          </span>
        );
      case 'Bantuan Sekolah':
        return (
          <span key={jenis} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <School className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
            <span>Bantuan Sekolah</span>
          </span>
        );
      case 'Bantuan dari desa':
        return (
          <span key={jenis} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
            <MapPin className="w-3 h-3 text-orange-600 dark:text-orange-400" />
            <span>Bantuan Desa</span>
          </span>
        );
      case 'Bantuan Lainnya':
        return (
          <span key={jenis} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span>{customName || 'Bantuan Lainnya'}</span>
          </span>
        );
      default:
        return (
          <span key={jenis} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
            <span>{jenis}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150">
      {/* ========================================================================= */}
      {/* 1. HEADER UTAMA & KONTROL TAHUN PELAJARAN */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-[#003399] dark:bg-blue-950 dark:text-blue-300 text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1">
              <HandCoins className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Modul Kesejahteraan & Bantuan Siswa</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[11px] font-extrabold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Tahun Pelajaran Aktif: {activeTP}</span>
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Data Siswa Penerima Bantuan</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Monitoring data dan rekapitulasi siswa penerima bantuan (Program Indonesia Pintar, Baznas, Bantuan Sekolah, Bantuan dari Desa, dan Bantuan Lainnya).
          </p>
        </div>

        {/* Toolbar Kontrol: Pemilih Tahun Pelajaran, Tambah, Export, Cetak */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Selector Tahun Pelajaran */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-300 dark:border-slate-700 shadow-2xs">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 ml-2" />
            <select
              value={selectedTP}
              onChange={(e) => {
                setSelectedTP(e.target.value);
                setFilterTahap('ALL');
              }}
              className="bg-transparent text-xs font-black text-slate-800 dark:text-slate-100 py-1.5 pr-2 focus:outline-hidden cursor-pointer"
              title="Pilih Tahun Pelajaran untuk memfilter siswa penerima bantuan di tahun tersebut"
            >
              <option value={activeTP}>
                TP {activeTP} (Tahun Aktif) — {students.filter(s => getStudentBantuanRecords(s, activeTP).length > 0).length} Siswa
              </option>
              {(schoolProfile?.daftarTahunPelajaran || ['2023/2024', '2024/2025', '2025/2026', '2026/2027', '2027/2028'])
                .filter(tp => tp !== activeTP)
                .map(tp => {
                  const countInTP = students.filter(s => getStudentBantuanRecords(s, tp).length > 0).length;
                  return (
                    <option key={tp} value={tp}>
                      TP {tp} — {countInTP} Siswa
                    </option>
                  );
                })}
              <option value="ALL">
                Semua Tahun Pelajaran — {students.filter(isBantuanRecipient).length} Siswa
              </option>
            </select>
          </div>

          {/* Tombol Cetak Rekap */}
          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-blue-600" />
            <span>Cetak Rekap</span>
          </button>

          {/* Tombol Ekspor Excel */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            title="Unduh format spreadsheet Excel data penerima bantuan"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-300" />
            <span>Ekspor Excel</span>
          </button>

          {/* Tombol Menu "Tambahkan Bantuan" */}
          <button
            type="button"
            onClick={() => handleOpenAddBantuan(null)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#003399] hover:bg-[#002266] text-white text-xs font-extrabold rounded-xl transition-all shadow-md cursor-pointer hover:scale-[1.02] active:scale-95"
            title="Buka menu Tambahkan Bantuan dan kelola riwayat beberapa bantuan siswa di tahun aktif"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>Tambahkan Bantuan</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. KOMPONEN RINGKASAN STATISTIK & PEMANTAUAN ANGGARAN BANTUAN */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        {/* Kontrol Navigasi Tampilan Ringkasan */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <PieChart className="w-4 h-4" />
            </span>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 block">
                Mode Tampilan Statistik & Analisis:
              </span>
              <span className="text-[11px] text-slate-400">
                Pilih fokus tampilan statistik yang ingin ditampilkan di dashboard
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setStatsViewMode('all')}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
                statsViewMode === 'all'
                  ? "bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-2xs font-black"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Semua Ringkasan</span>
            </button>
            <button
              type="button"
              onClick={() => setStatsViewMode('budget')}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
                statsViewMode === 'budget'
                  ? "bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-2xs font-black"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              )}
            >
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              <span>Akumulasi Anggaran Multi-Tahun</span>
            </button>
            <button
              type="button"
              onClick={() => setStatsViewMode('detail')}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
                statsViewMode === 'detail'
                  ? "bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-2xs font-black"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              )}
            >
              <School className="w-3.5 h-3.5 text-indigo-500" />
              <span>Detail Kelas & Tahap (TP {selectedTP})</span>
            </button>
          </div>
        </div>

        {/* 2A. KOMPONEN RINGKASAN STATISTIK AKUMULASI ANGGARAN & SISWA PER TAHUN */}
        {(statsViewMode === 'all' || statsViewMode === 'budget') && (
          <RingkasanAkumulasiBantuan
            students={students}
            daftarTahunPelajaran={schoolProfile?.daftarTahunPelajaran}
            activeTP={activeTP}
            selectedTP={selectedTP}
            onSelectTP={(tp) => {
              setSelectedTP(tp);
              setFilterTahap('ALL');
            }}
            onFilterJenis={(jenis) => setFilterJenis(jenis)}
            activeFilterJenis={filterJenis}
          />
        )}

        {/* 2B. KOMPONEN RINGKASAN DETAIL KELAS & TERMIN TAHUN TERPILIH */}
        {(statsViewMode === 'all' || statsViewMode === 'detail') && (
          <RingkasanStatistikBantuan
            stats={stats}
            selectedTP={selectedTP}
            activeTP={activeTP}
            onFilterJenis={(jenis) => setFilterJenis(jenis)}
            activeFilterJenis={filterJenis}
            onFilterTahap={(tahap) => setFilterTahap(tahap)}
            activeFilterTahap={filterTahap}
          />
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. TOOLBAR FILTER & SEARCH */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama siswa penerima bantuan, NIS, NISN, atau nama bantuan..."
              className="w-full pl-9 pr-4 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Jenis Bantuan */}
            <select
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="ALL">Semua Jenis Bantuan</option>
              <option value="Penerima PIP">Penerima PIP</option>
              <option value="Baznas">Baznas</option>
              <option value="Bantuan Sekolah">Bantuan Sekolah</option>
              <option value="Bantuan dari desa">Bantuan dari desa</option>
              <option value="Bantuan Lainnya">Bantuan Lainnya</option>
            </select>

            {/* Filter Tahap / Termin */}
            <select
              value={filterTahap}
              onChange={(e) => setFilterTahap(e.target.value)}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 cursor-pointer"
            >
              <option value="ALL">Semua Tahap / Termin</option>
              {availableTahapOptions.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            {/* Filter Kelas */}
            <select
              value={filterKelas}
              onChange={(e) => setFilterKelas(e.target.value)}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="ALL">Semua Kelas</option>
              <option value="Kelas 1">Kelas 1</option>
              <option value="Kelas 2">Kelas 2</option>
              <option value="Kelas 3">Kelas 3</option>
              <option value="Kelas 4">Kelas 4</option>
              <option value="Kelas 5">Kelas 5</option>
              <option value="Kelas 6">Kelas 6</option>
            </select>

            {/* Filter Gender */}
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="ALL">Semua Gender</option>
              <option value="L">Laki-laki (L)</option>
              <option value="P">Perempuan (P)</option>
            </select>

            {/* Reset Filter Button */}
            {(searchQuery || filterJenis !== 'ALL' || filterKelas !== 'ALL' || filterGender !== 'ALL' || filterTahap !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterJenis('ALL');
                  setFilterKelas('ALL');
                  setFilterGender('ALL');
                  setFilterTahap('ALL');
                }}
                className="px-2.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                title="Reset semua filter"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Quick Filter Bar by Tahap / Termin */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Pintas Termin / Tahap:</span>
          </span>
          <button
            type="button"
            onClick={() => setFilterTahap('ALL')}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
              filterTahap === 'ALL'
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
            )}
          >
            Semua ({recipientsInSelectedTP.length})
          </button>
          {availableTahapOptions.map(t => {
            const countForTahap = recipientsInSelectedTP.filter(s => (s.tahapBantuan || 'Tahap 1').toLowerCase() === t.toLowerCase()).length;
            const isCurrent = filterTahap.toLowerCase() === t.toLowerCase();
            return (
              <button
                key={t}
                type="button"
                onClick={() => setFilterTahap(isCurrent ? 'ALL' : t)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                  isCurrent
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                )}
              >
                <span>{t}</span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full font-mono",
                  isCurrent
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                )}>
                  {countForTahap}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TABEL DAFTAR SISWA PENERIMA BANTUAN */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Daftar Siswa Penerima Bantuan ({filteredRecipients.length} Siswa)</span>
            </h4>
            {filterTahap !== 'ALL' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                <Layers className="w-3 h-3" />
                <span>Termin: {filterTahap}</span>
              </span>
            )}
          </div>
          <span className="text-[11px] font-bold text-slate-500">
            Tahun Pelajaran: {selectedTP === 'ALL' ? 'Semua Tahun' : selectedTP}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3.5 text-center w-12">No</th>
                <th className="py-3 px-3.5">Nama Lengkap Siswa</th>
                <th className="py-3 px-3.5">NIS / NISN</th>
                <th className="py-3 px-3.5">Kelas</th>
                <th className="py-3 px-3.5">Program Bantuan</th>
                <th className="py-3 px-3.5">Rincian / Bantuan Lainnya</th>
                <th className="py-3 px-3.5">Tahun Pelajaran</th>
                <th className="py-3 px-3.5">Tahap</th>
                <th className="py-3 px-3.5">Tgl Menerima</th>
                <th className="py-3 px-3.5">Nominal</th>
                <th className="py-3 px-3.5">Keterangan / No. SK</th>
                <th className="py-3 px-3.5 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRecipients.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-12 text-slate-500">
                    <HandCoins className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="font-bold text-sm">
                      {selectedTP === 'ALL'
                        ? 'Tidak ada siswa penerima bantuan yang sesuai kriteria.'
                        : `Tidak ada siswa yang menerima bantuan pada Tahun Pelajaran ${selectedTP}.`}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      Siswa dapat didaftarkan sebagai penerima bantuan pada tahun ini melalui menu "Tambahkan Bantuan" di atas atau tombol di bawah ini.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleOpenAddBantuan(null)}
                      className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambahkan Bantuan Baru</span>
                    </button>
                  </td>
                </tr>
              ) : (
                filteredRecipients.map((s, idx) => {
                  const studentRecords = getStudentBantuanRecords(s, selectedTP);
                  const bTypes = getStudentBantuanTypes(s, selectedTP);
                  const primaryRecord = studentRecords[0];
                  const displayYear = selectedTP === 'ALL'
                    ? (primaryRecord?.tahunPelajaran || getBantuanYear(s))
                    : selectedTP;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-3.5 text-center font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-extrabold text-xs shrink-0 overflow-hidden">
                            {s.fotoUrl ? (
                              <img src={s.fotoUrl} alt={s.namaLengkap} className="w-full h-full object-cover" />
                            ) : (
                              <span>{s.namaLengkap.charAt(0)}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                              <span>{s.namaLengkap}</span>
                              <span className={cn(
                                "text-[9px] font-bold px-1 py-0.2 rounded",
                                s.jenisKelamin === 'L' ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" : "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                              )}>
                                {s.jenisKelamin}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              NIK: {s.nik || '-'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3.5 font-mono text-slate-700 dark:text-slate-300">
                        <div>{s.noInduk}</div>
                        <div className="text-[10.5px] text-slate-400">NISN: {s.nisn}</div>
                      </td>
                      <td className="py-3 px-3.5 font-bold text-blue-700 dark:text-blue-400">
                        {s.kelasSekarang}
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="flex flex-wrap items-center gap-1">
                          {bTypes.map(t => renderJenisBadge(t, primaryRecord?.bantuanLainnya || (t === 'Bantuan Lainnya' ? s.bantuanLainnya : undefined)))}
                          {studentRecords.length > 1 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              <History className="w-2.5 h-2.5" />
                              <span>{studentRecords.length} Bantuan</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 font-semibold text-slate-800 dark:text-slate-200">
                        {primaryRecord?.bantuanLainnya || (bTypes.includes('Bantuan Lainnya') ? s.bantuanLainnya : '-') || '-'}
                      </td>
                      <td className="py-3 px-3.5">
                        <span className={cn(
                          "px-2 py-0.5 rounded-md font-mono font-bold text-[10px]",
                          displayYear === activeTP 
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        )}>
                          TP {displayYear}
                        </span>
                      </td>
                      <td className="py-3 px-3.5">
                        {studentRecords.length > 1 ? (
                          <div className="flex flex-col gap-0.5">
                            {studentRecords.slice(0, 2).map((rec, rIdx) => (
                              <span key={rIdx} className="px-1.5 py-0.2 rounded-md font-semibold text-[10px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 whitespace-nowrap">
                                {rec.tahap || 'Tahap 1'}
                              </span>
                            ))}
                            {studentRecords.length > 2 && (
                              <span className="text-[9px] text-slate-400">+{studentRecords.length - 2} tahap</span>
                            )}
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md font-semibold text-[10.5px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 whitespace-nowrap">
                            {primaryRecord?.tahap || s.tahapBantuan || 'Tahap 1'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {primaryRecord?.tanggalMenerima ? (
                          <div className="flex items-center gap-1 font-medium text-[11px]">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{formatIndonesianDate(primaryRecord.tanggalMenerima)}</span>
                          </div>
                        ) : s.tanggalMenerimaBantuan ? (
                          <div className="flex items-center gap-1 font-medium text-[11px]">
                            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{formatIndonesianDate(s.tanggalMenerimaBantuan)}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {studentRecords.length > 1 ? (
                          <div className="flex flex-col gap-0.5 text-[10.5px]">
                            {studentRecords.slice(0, 2).map((rec, rIdx) => (
                              <span key={rIdx}>{rec.nominal || '-'}</span>
                            ))}
                            {studentRecords.length > 2 && (
                              <span className="text-[9px] font-sans text-slate-400 font-normal">+{studentRecords.length - 2} lainnya</span>
                            )}
                          </div>
                        ) : (
                          primaryRecord?.nominal || s.nominalBantuan || '-'
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-slate-600 dark:text-slate-400">
                        {primaryRecord?.keterangan || s.keteranganBantuan || '-'}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenAddBantuan(s.id)}
                            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors cursor-pointer"
                            title="Kelola & Tambahkan Riwayat Bantuan Siswa (TP Aktif)"
                          >
                            <HandCoins className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditStudent(s, 'bantuan')}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors cursor-pointer"
                            title="Edit Data Bantuan Siswa (Tab 6)"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectDetail(s.id)}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Lihat Profil Detail"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. MODAL MENU "TAMBAHKAN BANTUAN" & RIWAYAT BANTUAN SISWA (TP AKTIF) */}
      {/* ========================================================================= */}
      {isAddBantuanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl my-auto max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-[#003399] text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-white/10 rounded-lg">
                  <HandCoins className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                    <span>Tambahkan Bantuan & Riwayat Bantuan Siswa</span>
                    <span className="px-2 py-0.2 bg-amber-400 text-slate-950 font-black text-[10px] rounded-full">
                      TP {activeTP}
                    </span>
                  </h3>
                  <p className="text-[11px] text-blue-100 font-medium">
                    Kelola riwayat penerimaan beberapa bantuan siswa pada Tahun Pelajaran aktif
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddBantuanModalOpen(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body Modal Scrollable */}
            <div className="p-5 md:p-6 overflow-y-auto space-y-6">
              {/* Notifikasi Flash Sukses/Info */}
              {modalNotification && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{modalNotification}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalNotification(null)}
                    className="text-xs text-emerald-700 hover:text-emerald-900 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* 1. Pemilihan Siswa Aktif */}
              {(() => {
                const targetStudent = students.find(s => s.id === selectedStudentForBantuanId);
                const activeRecords = targetStudent ? getStudentBantuanRecords(targetStudent, activeTP) : [];

                return (
                  <>
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span>Pilih Siswa Aktif Penerima Bantuan</span>
                          <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative w-full sm:w-64">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            value={studentSearchInModal}
                            onChange={(e) => setStudentSearchInModal(e.target.value)}
                            placeholder="Cari nama / NIS siswa..."
                            className="w-full pl-8 pr-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <select
                        value={selectedStudentForBantuanId}
                        onChange={(e) => setSelectedStudentForBantuanId(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 cursor-pointer focus:ring-2 focus:ring-blue-500"
                      >
                        {activeStudentsInSchool
                          .filter(s => {
                            if (!studentSearchInModal.trim()) return true;
                            const q = studentSearchInModal.toLowerCase();
                            return s.namaLengkap.toLowerCase().includes(q) || s.noInduk.toLowerCase().includes(q) || s.kelasSekarang.toLowerCase().includes(q);
                          })
                          .sort((a, b) => a.namaLengkap.localeCompare(b.namaLengkap))
                          .map(s => {
                            const recCount = getStudentBantuanRecords(s, activeTP).length;
                            return (
                              <option key={s.id} value={s.id}>
                                {s.namaLengkap} — {s.kelasSekarang} (NIS: {s.noInduk}) {recCount > 0 ? `[${recCount} Bantuan di TP ${activeTP}]` : ''}
                              </option>
                            );
                          })}
                      </select>

                      {/* Info Siswa Terpilih Card */}
                      {targetStudent && (
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-blue-200 dark:border-blue-900/50 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-black text-sm shrink-0 overflow-hidden">
                              {targetStudent.fotoUrl ? (
                                <img src={targetStudent.fotoUrl} alt={targetStudent.namaLengkap} className="w-full h-full object-cover" />
                              ) : (
                                <span>{targetStudent.namaLengkap.charAt(0)}</span>
                              )}
                            </div>
                            <div>
                              <div className="font-black text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                                <span>{targetStudent.namaLengkap}</span>
                                <span className={cn(
                                  "text-[10px] font-extrabold px-1.5 py-0.2 rounded",
                                  targetStudent.jenisKelamin === 'L' ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" : "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                )}>
                                  {targetStudent.jenisKelamin}
                                </span>
                                <span className="text-[10px] font-extrabold px-2 py-0.2 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                  {targetStudent.kelasSekarang}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                                <span>NIS: {targetStudent.noInduk}</span>
                                <span>•</span>
                                <span>NISN: {targetStudent.nisn || '-'}</span>
                                <span>•</span>
                                <span>Status: {targetStudent.status || 'Aktif'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "px-3 py-1 rounded-lg text-xs font-black flex items-center gap-1.5 shadow-2xs",
                              activeRecords.length > 0 
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                            )}>
                              <History className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>{activeRecords.length} Bantuan di TP {activeTP}</span>
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 2. Daftar Riwayat Bantuan Siswa di TP Aktif */}
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                          <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          <span>Riwayat Beberapa Bantuan Siswa di TP {activeTP}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                            {activeRecords.length} Catatan
                          </span>
                        </h4>
                        <span className="text-[11px] text-slate-400 font-medium">
                          Memuat riwayat bantuan yang diterima siswa di tahun ajaran aktif
                        </span>
                      </div>

                      {activeRecords.length === 0 ? (
                        <div className="p-5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 text-center text-slate-500">
                          <Clock className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-1.5" />
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Belum ada riwayat bantuan untuk {targetStudent?.namaLengkap || 'siswa terpilih'} pada TP {activeTP}.
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Gunakan formulir di bawah ini untuk menambahkan bantuan ke riwayat siswa.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {activeRecords.map((record, rIdx) => {
                            const statusColor = record.statusPencairan === 'Sudah Cair'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'
                              : record.statusPencairan === 'Dalam Proses'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300';

                            return (
                              <div
                                key={record.id || rIdx}
                                className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs hover:shadow-xs transition-shadow space-y-2.5"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      {renderJenisBadge(record.jenis, record.bantuanLainnya)}
                                      {record.tahap && (
                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                          {record.tahap}
                                        </span>
                                      )}
                                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", statusColor)}>
                                        {record.statusPencairan || 'Sudah Cair'}
                                      </span>
                                    </div>
                                    {record.bantuanLainnya && record.jenis === 'Bantuan Lainnya' && (
                                      <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                                        {record.bantuanLainnya}
                                      </p>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteBantuanRecord(record.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                    title="Hapus catatan bantuan ini dari riwayat"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-700/60 text-[11px]">
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">Nominal:</span>
                                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                      {record.nominal || '-'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400 block text-[10px]">Tgl Menerima:</span>
                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                      {record.tanggalMenerima ? formatIndonesianDate(record.tanggalMenerima) : '-'}
                                    </span>
                                  </div>
                                </div>

                                {record.keterangan && (
                                  <div className="text-[10.5px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <span className="font-bold text-slate-600 dark:text-slate-300">Ket / SK: </span>
                                    <span>{record.keterangan}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}

              {/* 3. Formulir Tambahkan Bantuan Baru */}
              <form onSubmit={handleSaveNewBantuan} className="bg-slate-50 dark:bg-slate-800/40 p-4 md:p-5 rounded-2xl border border-blue-200 dark:border-blue-900/40 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2.5">
                  <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                    <Plus className="w-4 h-4 text-blue-600" />
                    <span>Formulir Tambah Bantuan Baru ke Riwayat Siswa</span>
                  </h4>
                  <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded-md">
                    TP {formTahunPelajaran}
                  </span>
                </div>

                {/* Program Bantuan Choices */}
                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-2">
                    Pilih Program Bantuan <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {[
                      { id: 'Penerima PIP', label: 'PIP Kemdikbud', icon: CreditCard, color: 'text-blue-600' },
                      { id: 'Baznas', label: 'Baznas', icon: Landmark, color: 'text-emerald-600' },
                      { id: 'Bantuan Sekolah', label: 'Bantuan Sekolah', icon: School, color: 'text-indigo-600' },
                      { id: 'Bantuan dari desa', label: 'Bantuan Desa', icon: MapPin, color: 'text-orange-600' },
                      { id: 'Bantuan Lainnya', label: 'Bantuan Lainnya', icon: Sparkles, color: 'text-amber-600' },
                    ].map(item => {
                      const isSelected = formJenis === item.id;
                      const IconComponent = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setFormJenis(item.id)}
                          className={cn(
                            "p-2.5 rounded-xl border text-left font-bold text-xs transition-all flex flex-col gap-1.5 cursor-pointer",
                            isSelected
                              ? "border-blue-500 bg-blue-50/80 dark:bg-blue-950/70 text-blue-950 dark:text-blue-200 ring-2 ring-blue-500/30"
                              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                          )}
                        >
                          <IconComponent className={cn("w-4 h-4", item.color)} />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Input Bantuan Lainnya jika dipilih */}
                {formJenis === 'Bantuan Lainnya' && (
                  <div className="p-3 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 space-y-1.5">
                    <label className="block text-xs font-bold text-amber-900 dark:text-amber-300">
                      Nama / Jenis Bantuan Lainnya <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formBantuanLainnya}
                      onChange={(e) => setFormBantuanLainnya(e.target.value)}
                      placeholder="Contoh: Beasiswa CSR PT Riau Andalan Pulp, Beasiswa Alumni..."
                      className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-amber-300 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>
                )}

                {/* Grid Tahap, Tahun Pelajaran, Tanggal, Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Tahun Pelajaran */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tahun Pelajaran
                    </label>
                    <select
                      value={formTahunPelajaran}
                      onChange={(e) => setFormTahunPelajaran(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 cursor-pointer"
                    >
                      {(schoolProfile?.daftarTahunPelajaran || ['2023/2024', '2024/2025', '2025/2026', '2026/2027', '2027/2028']).map(tp => (
                        <option key={tp} value={tp}>TP {tp} {tp === activeTP ? '(Aktif)' : ''}</option>
                      ))}
                    </select>
                  </div>

                  {/* Tahap / Termin */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tahap / Termin Penyaluran
                    </label>
                    <input
                      type="text"
                      list="modal-tahap-options"
                      value={formTahap}
                      onChange={(e) => setFormTahap(e.target.value)}
                      placeholder="Contoh: Tahap 1, Tahap 2, dst."
                      className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      required
                    />
                    <datalist id="modal-tahap-options">
                      <option value="Tahap 1" />
                      <option value="Tahap 2" />
                      <option value="Tahap 3" />
                      <option value="Tahap 4" />
                      <option value="Gelombang 1" />
                      <option value="Gelombang 2" />
                      <option value="Semester Ganjil" />
                      <option value="Semester Genap" />
                    </datalist>
                  </div>

                  {/* Tanggal Menerima */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tanggal Penerimaan
                    </label>
                    <input
                      type="date"
                      value={formTanggalMenerima}
                      onChange={(e) => setFormTanggalMenerima(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 cursor-pointer"
                    />
                  </div>

                  {/* Status Pencairan */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Status Pencairan
                    </label>
                    <select
                      value={formStatusPencairan}
                      onChange={(e) => setFormStatusPencairan(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 cursor-pointer"
                    >
                      <option value="Sudah Cair">Sudah Cair</option>
                      <option value="Dalam Proses">Dalam Proses</option>
                      <option value="Belum Cair">Belum Cair</option>
                    </select>
                  </div>
                </div>

                {/* Nominal dan Keterangan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nominal / Fasilitas Bantuan
                    </label>
                    <input
                      type="text"
                      value={formNominal}
                      onChange={(e) => setFormNominal(e.target.value)}
                      placeholder="Contoh: Rp 450.000 / tahun"
                      className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {['Rp 450.000 / tahun', 'Rp 225.000 / semester', 'Rp 500.000', 'Rp 1.000.000'].map(preset => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setFormNominal(preset)}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 cursor-pointer"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Keterangan / No. SK / No. Rekening (Opsional)
                    </label>
                    <input
                      type="text"
                      value={formKeterangan}
                      onChange={(e) => setFormKeterangan(e.target.value)}
                      placeholder="Contoh: SK PIP No. 421/2026, Rek SimPel BRI..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                    <span className="text-[10.5px] text-slate-400 block mt-1">
                      Catatan khusus mengenai penyaluran atau dokumen pencairan bantuan ini.
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setIsAddBantuanModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold rounded-xl text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-black rounded-xl bg-[#003399] hover:bg-[#002266] text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-95"
                  >
                    <Plus className="w-4 h-4 text-amber-300" />
                    <span>Simpan Bantuan ke Riwayat Siswa</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL CETAK REKAP RESMI (PRINT PREVIEW) */}
      {/* ========================================================================= */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl my-auto max-h-[95vh] flex flex-col overflow-hidden text-slate-900">
            {/* Modal Controls Bar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-100 shrink-0 no-print">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-600" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Pratinjau Cetak Rekapitulasi Siswa Penerima Bantuan
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Dokumen</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1 rounded-lg text-slate-500 hover:bg-slate-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Content */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-5 print:p-0 print:overflow-visible">
              {/* Kop Surat Sekolah */}
              <KopSuratHeader schoolProfile={schoolProfile} />

              {/* Judul Dokumen */}
              <div className="text-center space-y-1 border-b pb-3 border-slate-300">
                <h2 className="text-sm md:text-base font-black uppercase tracking-wider underline">
                  DAFTAR REKAPITULASI SISWA PENERIMA BANTUAN PENDIDIKAN
                </h2>
                <p className="text-xs font-bold text-slate-700">
                  TAHUN PELAJARAN: {selectedTP === 'ALL' ? 'SEMUA TAHUN PELAJARAN' : selectedTP}
                  {filterTahap !== 'ALL' && ` • TERMIN / TAHAP: ${filterTahap.toUpperCase()}`}
                </p>
              </div>

              {/* Ringkasan Statistik Anggaran & Penerima */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                <div className="p-2 border border-slate-300 rounded-lg">
                  <span className="text-[10px] text-slate-500 block">Total Penerima</span>
                  <span className="font-bold text-sm">{stats.totalPenerima} Siswa</span>
                </div>
                <div className="p-2 border border-slate-300 rounded-lg">
                  <span className="text-[10px] text-slate-500 block">Total Alokasi Dana</span>
                  <span className="font-bold text-sm text-blue-800">{formatCurrencyIDR(stats.totalNominalDana)}</span>
                </div>
                <div className="p-2 border border-slate-300 rounded-lg">
                  <span className="text-[10px] text-slate-500 block">Realisasi (Cair)</span>
                  <span className="font-bold text-sm text-emerald-700">{formatCurrencyIDR(stats.totalDanaCair)}</span>
                </div>
                <div className="p-2 border border-slate-300 rounded-lg">
                  <span className="text-[10px] text-slate-500 block">PIP & Baznas</span>
                  <span className="font-bold text-sm">{stats.countPIP + stats.countBaznas} Siswa</span>
                </div>
                <div className="p-2 border border-slate-300 rounded-lg col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-500 block">Sekolah, Desa, Lain</span>
                  <span className="font-bold text-sm">{stats.countSekolah + stats.countDesa + stats.countLainnya} Siswa</span>
                </div>
              </div>

              {/* Tabel Resmi Cetak */}
              <table className="w-full text-left text-xs border border-collapse border-slate-400">
                <thead>
                  <tr className="bg-slate-100 font-bold border-b border-slate-400 text-[10.5px]">
                    <th className="p-2 border border-slate-300 text-center w-8">No</th>
                    <th className="p-2 border border-slate-300">Nama Siswa</th>
                    <th className="p-2 border border-slate-300">NIS / NISN</th>
                    <th className="p-2 border border-slate-300 text-center w-10">L/P</th>
                    <th className="p-2 border border-slate-300 text-center">Kelas</th>
                    <th className="p-2 border border-slate-300">Program Bantuan</th>
                    <th className="p-2 border border-slate-300 text-center">Tahap</th>
                    <th className="p-2 border border-slate-300 text-center">Tgl Menerima</th>
                    <th className="p-2 border border-slate-300">Nominal</th>
                    <th className="p-2 border border-slate-300">No. SK / Ket</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecipients.map((s, idx) => {
                    const studentRecords = getStudentBantuanRecords(s, selectedTP);
                    const bTypes = getStudentBantuanTypes(s, selectedTP);
                    const primaryRecord = studentRecords[0];
                    return (
                      <tr key={s.id} className="border-b border-slate-300 text-[11px]">
                        <td className="p-2 border border-slate-300 text-center font-mono">{idx + 1}</td>
                        <td className="p-2 border border-slate-300 font-bold">{s.namaLengkap}</td>
                        <td className="p-2 border border-slate-300 font-mono text-[10px]">{s.noInduk} / {s.nisn}</td>
                        <td className="p-2 border border-slate-300 text-center font-bold">{s.jenisKelamin}</td>
                        <td className="p-2 border border-slate-300 text-center font-bold">{s.kelasSekarang}</td>
                        <td className="p-2 border border-slate-300 font-bold">
                          {bTypes.length > 0 ? bTypes.join(', ') : '-'}
                          {primaryRecord?.bantuanLainnya ? ` (${primaryRecord.bantuanLainnya})` : (s.bantuanLainnya ? ` (${s.bantuanLainnya})` : '')}
                        </td>
                        <td className="p-2 border border-slate-300 text-center">{primaryRecord?.tahap || s.tahapBantuan || 'Tahap 1'}</td>
                        <td className="p-2 border border-slate-300 text-center text-[10px]">
                          {primaryRecord?.tanggalMenerima 
                            ? formatIndonesianDate(primaryRecord.tanggalMenerima) 
                            : (s.tanggalMenerimaBantuan ? formatIndonesianDate(s.tanggalMenerimaBantuan) : '-')}
                        </td>
                        <td className="p-2 border border-slate-300 font-mono">{primaryRecord?.nominal || s.nominalBantuan || '-'}</td>
                        <td className="p-2 border border-slate-300 text-[10px]">{primaryRecord?.keterangan || s.keteranganBantuan || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Tanda Tangan Resmi */}
              <div className="pt-6 flex justify-between text-xs text-slate-800">
                <div className="text-center space-y-14">
                  <p>Mengetahui,<br />Guru BK / Operator Sekolah</p>
                  <div>
                    <p className="font-bold underline">{schoolProfile.namaOperator || 'Rahmat Hidayat, S.Kom.'}</p>
                    <p className="text-[10px]">NIP. {schoolProfile.nipOperator || '19920415 201902 1 008'}</p>
                  </div>
                </div>

                <div className="text-center space-y-14">
                  <p>
                    {schoolProfile.desaKelurahan || 'Sungai Buluh'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br />
                    Kepala Sekolah
                  </p>
                  <div>
                    <p className="font-bold underline">{schoolProfile.namaKepalaSekolah || 'H. MARLISMAN, S.Pd., M.M.'}</p>
                    <p className="text-[10px]">NIP. {schoolProfile.nipKepalaSekolah || '19680512 199103 1 005'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
