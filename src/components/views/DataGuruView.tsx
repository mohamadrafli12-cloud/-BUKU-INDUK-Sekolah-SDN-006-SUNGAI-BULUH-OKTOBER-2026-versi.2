import React, { useState, useRef } from 'react';
import { 
  GraduationCap, 
  UserPlus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Award, 
  BookOpen, 
  ArrowLeft,
  CheckCircle2,
  X,
  UserCheck,
  Building,
  Briefcase,
  Users,
  Sparkles,
  School,
  FileCheck,
  Printer,
  Camera,
  Upload,
  User,
  MapPin,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  Smartphone,
  AlertCircle
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { AdminUser, UserRole, TeacherDutyCategory } from '../../types';
import { cn, formatIndonesianDate } from '../../lib/utils';
import { KopSuratHeader } from '../layout/KopSuratHeader';
import { CameraCaptureModal } from '../modals/CameraCaptureModal';
import { compressImageFile } from '../../utils/imageCompressor';

interface DataGuruViewProps {
  onBack?: () => void;
  setActiveTab?: (tab: any) => void;
}

const TINGKAT_KELAS_OPTIONS = [
  { value: 'Kelas 1', label: 'Kelas 1 (Fase A)' },
  { value: 'Kelas 2', label: 'Kelas 2 (Fase A)' },
  { value: 'Kelas 3', label: 'Kelas 3 (Fase B)' },
  { value: 'Kelas 4', label: 'Kelas 4 (Fase B)' },
  { value: 'Kelas 5', label: 'Kelas 5 (Fase C)' },
  { value: 'Kelas 6', label: 'Kelas 6 (Fase C)' },
];

const MAPEL_OPTIONS = [
  'Pendidikan Agama Islam & Budi Pekerti',
  'Pendidikan Agama Kristen & Budi Pekerti',
  'Pendidikan Agama Katolik & Budi Pekerti',
  'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
  'Bahasa Inggris',
  'Seni Budaya & Prakarya',
  'Pendidikan Pancasila (PPKn)',
  'Matematika',
  'Ilmu Pengetahuan Alam dan Sosial (IPAS)',
  'Bahasa Daerah / Muatan Lokal',
  'Bimbingan Konseling (BK)',
];

const TENDIK_OPTIONS = [
  'Operator Dapodik & SIM Sekolah',
  'Tenaga Administrasi Sekolah (Tata Usaha)',
  'Pengelola Perpustakaan Sekolah',
  'Bendahara BOS & Keuangan Sekolah',
  'Petugas Keamanan / Penjaga Sekolah',
  'Petugas Kebersihan / Pelaksana Teknis',
];

const STATUS_KEPEGAWAIAN_OPTIONS = [
  'PNS (Pegawai Negeri Sipil)',
  'PPPK (Pegawai Pemerintah dg Perjanjian Kerja)',
  'Guru Honorer Sekolah (Non-PNS)',
  'Guru Tetap Yayasan (GTY)',
  'Tenaga Honorer / Staf Teknis',
];

const PANGKAT_GOLONGAN_OPTIONS = [
  '- (Non-PNS / Non-Golongan)',
  'Pengatur Muda (II/a)',
  'Pengatur Muda Tingkat I (II/b)',
  'Pengatur (II/c)',
  'Pengatur Tingkat I (II/d)',
  'Penata Muda (III/a)',
  'Penata Muda Tingkat I (III/b)',
  'Penata (III/c)',
  'Penata Tingkat I (III/d)',
  'Pembina (IV/a)',
  'Pembina Tingkat I (IV/b)',
  'Pembina Utama Muda (IV/c)',
  'Pembina Utama Madya (IV/d)',
  'Pembina Utama (IV/e)',
];

const PENDIDIKAN_OPTIONS = [
  'S1 / Sarjana (D-IV)',
  'S2 / Magister',
  'S3 / Doktor',
  'D3 / Diploma III',
  'SMA / SMK / Sederajat',
];

const AGAMA_OPTIONS = [
  'Islam',
  'Kristen Protestan',
  'Katolik',
  'Hindu',
  'Buddha',
  'Khonghucu',
];

const STATUS_PERNIKAHAN_OPTIONS = [
  'Menikah',
  'Belum Menikah',
  'Duda / Janda',
];

const STATUS_MENGAJAR_OPTIONS = [
  { value: 'Aktif', label: 'Aktif Mengajar / Bertugas', desc: 'Melaksanakan tugas pokok di sekolah' },
  { value: 'Pensiun', label: 'Pensiun (Purna Tugas)', desc: 'Telah mencapai batas usia pensiun / purnatugas' },
  { value: 'Cuti', label: 'Cuti (Melahirkan / Sakit / Alasan Penting)', desc: 'Sedang dalam masa cuti resmi' },
  { value: 'Mutasi Keluar', label: 'Mutasi Keluar (Pindah Tugas)', desc: 'Pindah tugas ke sekolah atau instansi lain' },
  { value: 'Nonaktif', label: 'Nonaktif / Berhenti', desc: 'Status nonaktif atau tidak bertugas' },
];

const JENIS_CUTI_OPTIONS = [
  'Cuti Melahirkan',
  'Cuti Sakit',
  'Cuti Alasan Penting',
  'Cuti Besar',
  'Cuti Tahunan',
  'Cuti di Luar Tanggungan Negara (CLTN)',
];

export const DataGuruView: React.FC<DataGuruViewProps> = ({
  onBack,
  setActiveTab,
}) => {
  const {
    adminUsers,
    addAdminUser,
    updateAdminUser,
    deleteAdminUser,
    currentRole,
    schoolProfile,
    getWaliKelasForClass
  } = useSchool();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | TeacherDutyCategory>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<AdminUser | null>(null);
  const [selectedTeacherForDetail, setSelectedTeacherForDetail] = useState<AdminUser | null>(null);
  const [teacherToPrint, setTeacherToPrint] = useState<AdminUser | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    nama: string;
    nip: string;
    nuptk: string;
    nik: string;
    jenisKelamin: 'L' | 'P';
    tempatLahir: string;
    tanggalLahir: string;
    namaIbuKandung: string;
    statusPernikahan: string;
    agama: string;
    noHp: string;
    alamat: string;
    statusKepegawaian: string;
    pangkatGolongan: string;
    pendidikanTerakhir: string;
    jurusanPendidikan: string;
    ptAsal: string;
    tmtPengangkatan: string;
    tmtTugas: string;
    fotoUrl: string;
    username: string;
    password: string;
    email: string;
    kategoriTugas: TeacherDutyCategory;
    tingkatKelas: string;
    mataPelajaran: string;
    tugasTendik: string;
    jabatan: string;
    isCustomJabatan: boolean;
    role: UserRole;
    status: string;
    // Data Riwayat Keaktifan
    tanggalPensiun: string;
    noSkPensiun: string;
    pejabatSkPensiun: string;
    jenisCuti: string;
    tglMulaiCuti: string;
    tglSelesaiCuti: string;
    noIzinCuti: string;
    sekolahTujuanMutasi: string;
    tglSkMutasi: string;
    noSkMutasi: string;
    keteranganKeaktifan: string;
    avatarColor: string;
  }>({
    nama: '',
    nip: '',
    nuptk: '',
    nik: '',
    jenisKelamin: 'L',
    tempatLahir: '',
    tanggalLahir: '',
    namaIbuKandung: '',
    statusPernikahan: 'Menikah',
    agama: 'Islam',
    noHp: '',
    alamat: '',
    statusKepegawaian: STATUS_KEPEGAWAIAN_OPTIONS[0],
    pangkatGolongan: PANGKAT_GOLONGAN_OPTIONS[7],
    pendidikanTerakhir: PENDIDIKAN_OPTIONS[0],
    jurusanPendidikan: 'Pendidikan Guru Sekolah Dasar (PGSD)',
    ptAsal: '',
    tmtPengangkatan: '',
    tmtTugas: '',
    fotoUrl: '',
    username: '',
    password: '',
    email: '',
    kategoriTugas: 'wali_kelas',
    tingkatKelas: 'Kelas 1',
    mataPelajaran: MAPEL_OPTIONS[0],
    tugasTendik: TENDIK_OPTIONS[0],
    jabatan: 'Wali Kelas 1',
    isCustomJabatan: false,
    role: 'user',
    status: 'Aktif',
    tanggalPensiun: '',
    noSkPensiun: '',
    pejabatSkPensiun: '',
    jenisCuti: JENIS_CUTI_OPTIONS[0],
    tglMulaiCuti: '',
    tglSelesaiCuti: '',
    noIzinCuti: '',
    sekolahTujuanMutasi: '',
    tglSkMutasi: '',
    noSkMutasi: '',
    keteranganKeaktifan: '',
    avatarColor: 'bg-blue-600',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressingPhoto(true);
    setPhotoError(null);

    try {
      const res = await compressImageFile(file, 800, 1000, 0.85);
      setFormData(prev => ({
        ...prev,
        fotoUrl: res.dataUrl
      }));
    } catch (err: any) {
      setPhotoError(err?.message || 'Gagal memproses gambar foto.');
    } finally {
      setIsCompressingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = () => {
    setFormData(prev => ({
      ...prev,
      fotoUrl: ''
    }));
  };

  // Helper to infer duty category from existing jabatan text if undefined
  const inferCategory = (teacher: AdminUser): TeacherDutyCategory => {
    if (teacher.kategoriTugas) return teacher.kategoriTugas;
    const jab = (teacher.jabatan || '').toLowerCase();
    if (jab.includes('kepala sekolah') || jab.includes('kepsek')) return 'kepala_sekolah';
    if (jab.includes('wali') || jab.includes('guru kelas')) return 'wali_kelas';
    if (jab.includes('mapel') || jab.includes('pai') || jab.includes('pjok') || jab.includes('agama')) return 'guru_mapel';
    if (jab.includes('operator') || jab.includes('tu') || jab.includes('administrasi') || jab.includes('pustaka') || jab.includes('tendik')) return 'tenaga_kependidikan';
    return 'wali_kelas';
  };

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setPhotoError(null);
    setShowPassword(false);
    setFormData({
      nama: '',
      nip: '',
      nuptk: '',
      nik: '',
      jenisKelamin: 'L',
      tempatLahir: '',
      tanggalLahir: '',
      namaIbuKandung: '',
      statusPernikahan: 'Menikah',
      agama: 'Islam',
      noHp: '',
      alamat: '',
      statusKepegawaian: STATUS_KEPEGAWAIAN_OPTIONS[0],
      pangkatGolongan: PANGKAT_GOLONGAN_OPTIONS[7],
      pendidikanTerakhir: PENDIDIKAN_OPTIONS[0],
      jurusanPendidikan: 'Pendidikan Guru Sekolah Dasar (PGSD)',
      ptAsal: '',
      tmtPengangkatan: '',
      tmtTugas: '',
      fotoUrl: '',
      username: '',
      password: '',
      email: '',
      kategoriTugas: 'wali_kelas',
      tingkatKelas: 'Kelas 1',
      mataPelajaran: MAPEL_OPTIONS[0],
      tugasTendik: TENDIK_OPTIONS[0],
      jabatan: 'Wali Kelas 1',
      isCustomJabatan: false,
      role: 'user',
      status: 'Aktif',
      tanggalPensiun: '',
      noSkPensiun: '',
      pejabatSkPensiun: '',
      jenisCuti: JENIS_CUTI_OPTIONS[0],
      tglMulaiCuti: '',
      tglSelesaiCuti: '',
      noIzinCuti: '',
      sekolahTujuanMutasi: '',
      tglSkMutasi: '',
      noSkMutasi: '',
      keteranganKeaktifan: '',
      avatarColor: 'bg-blue-600',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: AdminUser) => {
    setEditingTeacher(user);
    setPhotoError(null);
    setShowPassword(false);
    const cat = inferCategory(user);
    
    // Attempt to extract tingkat kelas if wali kelas
    let tKelas = user.tingkatKelas || 'Kelas 1';
    if (!user.tingkatKelas) {
      const match = (user.jabatan || '').match(/kelas\s*(\d+)/i);
      if (match) tKelas = `Kelas ${match[1]}`;
    }

    setFormData({
      nama: user.nama || '',
      nip: user.nip || '',
      nuptk: user.nuptk || '',
      nik: user.nik || '',
      jenisKelamin: user.jenisKelamin || 'L',
      tempatLahir: user.tempatLahir || '',
      tanggalLahir: user.tanggalLahir || '',
      namaIbuKandung: user.namaIbuKandung || '',
      statusPernikahan: user.statusPernikahan || 'Menikah',
      agama: user.agama || 'Islam',
      noHp: user.noHp || '',
      alamat: user.alamat || '',
      statusKepegawaian: user.statusKepegawaian || STATUS_KEPEGAWAIAN_OPTIONS[0],
      pangkatGolongan: user.pangkatGolongan || PANGKAT_GOLONGAN_OPTIONS[7],
      pendidikanTerakhir: user.pendidikanTerakhir || PENDIDIKAN_OPTIONS[0],
      jurusanPendidikan: user.jurusanPendidikan || '',
      ptAsal: user.ptAsal || '',
      tmtPengangkatan: user.tmtPengangkatan || '',
      tmtTugas: user.tmtTugas || '',
      fotoUrl: user.fotoUrl || '',
      username: user.username || '',
      password: user.password || '',
      email: user.email || '',
      kategoriTugas: cat,
      tingkatKelas: tKelas,
      mataPelajaran: user.mataPelajaran || MAPEL_OPTIONS[0],
      tugasTendik: user.tugasTendik || TENDIK_OPTIONS[0],
      jabatan: user.jabatan || '',
      isCustomJabatan: true,
      role: user.role || 'user',
      status: user.status || 'Aktif',
      tanggalPensiun: user.tanggalPensiun || '',
      noSkPensiun: user.noSkPensiun || '',
      pejabatSkPensiun: user.pejabatSkPensiun || '',
      jenisCuti: user.jenisCuti || JENIS_CUTI_OPTIONS[0],
      tglMulaiCuti: user.tglMulaiCuti || '',
      tglSelesaiCuti: user.tglSelesaiCuti || '',
      noIzinCuti: user.noIzinCuti || '',
      sekolahTujuanMutasi: user.sekolahTujuanMutasi || '',
      tglSkMutasi: user.tglSkMutasi || '',
      noSkMutasi: user.noSkMutasi || '',
      keteranganKeaktifan: user.keteranganKeaktifan || '',
      avatarColor: user.avatarColor || 'bg-blue-600',
    });
    setIsModalOpen(true);
  };

  // Helper to re-compute auto jabatan
  const computeAutoJabatan = (cat: TeacherDutyCategory, tKelas: string, mapel: string, tendik: string) => {
    switch (cat) {
      case 'kepala_sekolah':
        return 'Kepala Sekolah';
      case 'wali_kelas':
        return `Wali ${tKelas}`;
      case 'guru_mapel':
        return `Guru Mapel ${mapel}`;
      case 'tenaga_kependidikan':
        return `Tenaga Kependidikan - ${tendik}`;
      default:
        return 'Guru / Staf';
    }
  };

  const handleCategoryChange = (newCat: TeacherDutyCategory) => {
    const autoRole: UserRole = newCat === 'kepala_sekolah' ? 'admin' : newCat === 'tenaga_kependidikan' ? 'admin' : 'user';
    const autoJabatan = computeAutoJabatan(newCat, formData.tingkatKelas, formData.mataPelajaran, formData.tugasTendik);
    
    setFormData(prev => ({
      ...prev,
      kategoriTugas: newCat,
      role: autoRole,
      jabatan: prev.isCustomJabatan ? prev.jabatan : autoJabatan,
    }));
  };

  const handleTingkatChange = (tKelas: string) => {
    const autoJabatan = computeAutoJabatan('wali_kelas', tKelas, formData.mataPelajaran, formData.tugasTendik);
    setFormData(prev => ({
      ...prev,
      tingkatKelas: tKelas,
      jabatan: prev.isCustomJabatan ? prev.jabatan : autoJabatan,
    }));
  };

  const handleMapelChange = (mapel: string) => {
    const autoJabatan = computeAutoJabatan('guru_mapel', formData.tingkatKelas, mapel, formData.tugasTendik);
    setFormData(prev => ({
      ...prev,
      mataPelajaran: mapel,
      jabatan: prev.isCustomJabatan ? prev.jabatan : autoJabatan,
    }));
  };

  const handleTendikChange = (tendik: string) => {
    const autoJabatan = computeAutoJabatan('tenaga_kependidikan', formData.tingkatKelas, formData.mataPelajaran, tendik);
    setFormData(prev => ({
      ...prev,
      tugasTendik: tendik,
      jabatan: prev.isCustomJabatan ? prev.jabatan : autoJabatan,
    }));
  };

  const handleDelete = (user: AdminUser) => {
    if (adminUsers.length <= 1) {
      alert('Tidak dapat menghapus satu-satunya akun pengguna.');
      return;
    }
    if (confirm(`Hapus data guru/staf "${user.nama}" dari sistem?`)) {
      deleteAdminUser(user.id);
      showToast(`Data guru "${user.nama}" berhasil dihapus.`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      alert('Nama guru wajib diisi.');
      return;
    }

    const cleanEmail = formData.email.trim() || `${(formData.username || formData.nama.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15) || 'guru')}@sdn006.sch.id`;

    const payload: Omit<AdminUser, 'id' | 'terakhirLogin'> = {
      nama: formData.nama.trim(),
      nip: formData.nip.trim() || undefined,
      nuptk: formData.nuptk.trim() || undefined,
      nik: formData.nik.trim() || undefined,
      jenisKelamin: formData.jenisKelamin,
      tempatLahir: formData.tempatLahir.trim() || undefined,
      tanggalLahir: formData.tanggalLahir || undefined,
      namaIbuKandung: formData.namaIbuKandung.trim() || undefined,
      statusPernikahan: formData.statusPernikahan || undefined,
      agama: formData.agama || undefined,
      noHp: formData.noHp.trim() || undefined,
      alamat: formData.alamat.trim() || undefined,
      statusKepegawaian: formData.statusKepegawaian || undefined,
      pangkatGolongan: formData.pangkatGolongan || undefined,
      pendidikanTerakhir: formData.pendidikanTerakhir || undefined,
      jurusanPendidikan: formData.jurusanPendidikan.trim() || undefined,
      ptAsal: formData.ptAsal.trim() || undefined,
      tmtPengangkatan: formData.tmtPengangkatan || undefined,
      tmtTugas: formData.tmtTugas || undefined,
      fotoUrl: formData.fotoUrl || undefined,
      username: formData.username.trim() || undefined,
      password: formData.password.trim() || undefined,
      email: cleanEmail,
      jabatan: formData.jabatan.trim() || computeAutoJabatan(formData.kategoriTugas, formData.tingkatKelas, formData.mataPelajaran, formData.tugasTendik),
      kategoriTugas: formData.kategoriTugas,
      tingkatKelas: formData.kategoriTugas === 'wali_kelas' ? formData.tingkatKelas : undefined,
      mataPelajaran: formData.kategoriTugas === 'guru_mapel' ? formData.mataPelajaran : undefined,
      tugasTendik: formData.kategoriTugas === 'tenaga_kependidikan' ? formData.tugasTendik : undefined,
      role: formData.role,
      status: formData.status,
      tanggalPensiun: formData.status === 'Pensiun' ? formData.tanggalPensiun || undefined : undefined,
      noSkPensiun: formData.status === 'Pensiun' ? formData.noSkPensiun.trim() || undefined : undefined,
      pejabatSkPensiun: formData.status === 'Pensiun' ? formData.pejabatSkPensiun.trim() || undefined : undefined,
      jenisCuti: formData.status === 'Cuti' ? formData.jenisCuti || undefined : undefined,
      tglMulaiCuti: formData.status === 'Cuti' ? formData.tglMulaiCuti || undefined : undefined,
      tglSelesaiCuti: formData.status === 'Cuti' ? formData.tglSelesaiCuti || undefined : undefined,
      noIzinCuti: formData.status === 'Cuti' ? formData.noIzinCuti.trim() || undefined : undefined,
      sekolahTujuanMutasi: formData.status === 'Mutasi Keluar' ? formData.sekolahTujuanMutasi.trim() || undefined : undefined,
      tglSkMutasi: formData.status === 'Mutasi Keluar' ? formData.tglSkMutasi || undefined : undefined,
      noSkMutasi: formData.status === 'Mutasi Keluar' ? formData.noSkMutasi.trim() || undefined : undefined,
      keteranganKeaktifan: formData.keteranganKeaktifan.trim() || undefined,
      avatarColor: formData.avatarColor,
    };

    if (editingTeacher) {
      updateAdminUser(editingTeacher.id, payload);
      showToast(`Data guru "${formData.nama}" berhasil diperbarui.`);
    } else {
      addAdminUser(payload);
      showToast(`Guru baru "${formData.nama}" berhasil ditambahkan.`);
    }
    setIsModalOpen(false);
  };

  const filteredTeachers = adminUsers.filter((t) => {
    const matchesSearch = 
      t.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.jabatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.nip && t.nip.includes(searchTerm)) ||
      (t.noSkPensiun && t.noSkPensiun.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.keteranganKeaktifan && t.keteranganKeaktifan.toLowerCase().includes(searchTerm.toLowerCase())) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const cat = inferCategory(t);
    const matchesCategory = filterCategory === 'all' || cat === filterCategory;
    const currentStatus = t.status || 'Aktif';
    const matchesStatus = filterStatus === 'all' || currentStatus === filterStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalTeachers = adminUsers.length;
  const totalActive = adminUsers.filter(u => (u.status || 'Aktif') === 'Aktif').length;
  const totalPensiun = adminUsers.filter(u => u.status === 'Pensiun').length;
  const totalCuti = adminUsers.filter(u => u.status === 'Cuti').length;
  const totalMutasi = adminUsers.filter(u => u.status === 'Mutasi Keluar').length;
  const totalWaliKelas = adminUsers.filter(u => inferCategory(u) === 'wali_kelas').length;
  const totalGuruMapel = adminUsers.filter(u => inferCategory(u) === 'guru_mapel').length;
  const totalTendik = adminUsers.filter(u => inferCategory(u) === 'tenaga_kependidikan').length;
  const totalKepsek = adminUsers.filter(u => inferCategory(u) === 'kepala_sekolah').length;

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* TAMPILAN INTERAKTIF LAYAR (DISEMBUNYIKAN SAAT CETAK AGAR HANYA DOKUMEN RESMI BER-KOP SURAT YANG TERCETAK) */}
      <div className="space-y-6 no-print print:hidden">
        {/* Header */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <button
            onClick={() => (onBack ? onBack() : setActiveTab ? setActiveTab('dashboard') : null)}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
            title="Kembali ke Dashboard Utama"
          >
            <ArrowLeft className="w-4 h-4 text-[#003399] dark:text-blue-400" />
            <span className="hidden sm:inline">Kembali</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                Data Guru & Tenaga Kependidikan
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 font-extrabold text-xs">
                {totalTeachers} Terdaftar
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Manajemen dewan guru, penugasan wali kelas tingkat 1–6, guru mapel, dan kepala sekolah {schoolProfile.namaSekolah}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
            title="Cetak Rekapitulasi Data Guru & Tenaga Kependidikan dengan Kop Surat Resmi"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span className="hidden sm:inline">Cetak Daftar PTK</span>
          </button>
          {currentRole === 'admin' && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#003399] hover:bg-[#002266] active:bg-[#001a4d] text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all shrink-0 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-amber-300" />
              <span>+ Tambah Data Guru</span>
            </button>
          )}
        </div>
      </div>

      {/* Toast alert */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Stats Summary Cards */}
      <div className="no-print grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Guru & Staf
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
              {totalTeachers}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              {totalActive} Status Aktif
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#003399] dark:text-blue-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Wali Kelas (1–6)
            </div>
            <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
              {totalWaliKelas}
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">
              Otomatis Terisi di Raport
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Guru Mapel & Tendik
            </div>
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
              {totalGuruMapel + totalTendik}
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">
              {totalGuruMapel} Mapel • {totalTendik} Tendik
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Kepala Sekolah
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1 truncate max-w-[150px]">
              {schoolProfile.namaKepalaSekolah || 'H. Marlisman, S.Pd.'}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              NIP: {schoolProfile.nipKepalaSekolah || '1968...'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="no-print p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama guru, NIP, atau jabatan..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as any)}
              className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden font-semibold"
            >
              <option value="all">Semua Penugasan & Jabatan</option>
              <option value="kepala_sekolah">🏫 Kepala Sekolah</option>
              <option value="wali_kelas">🎓 Wali Kelas (Tingkat 1 - 6)</option>
              <option value="guru_mapel">📚 Guru Mata Pelajaran</option>
              <option value="tenaga_kependidikan">🏢 Tenaga Kependidikan / TU</option>
            </select>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden font-semibold"
          >
            <option value="all">Semua Status Keaktifan</option>
            <option value="Aktif">🟢 Aktif Mengajar ({totalActive})</option>
            <option value="Pensiun">🟣 Pensiun / Purna Tugas ({totalPensiun})</option>
            <option value="Cuti">🟡 Cuti ({totalCuti})</option>
            <option value="Mutasi Keluar">🔵 Mutasi Keluar ({totalMutasi})</option>
            <option value="Nonaktif">⚪ Nonaktif / Berhenti</option>
          </select>
        </div>
      </div>

      {/* Teachers Grid */}
      <div className="no-print grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeachers.map((teacher) => {
          const category = inferCategory(teacher);

          return (
            <div
              key={teacher.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-700 transition-all group"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {teacher.fotoUrl ? (
                      <img 
                        src={teacher.fotoUrl} 
                        alt={teacher.nama} 
                        className="w-12 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs shrink-0 bg-slate-100 dark:bg-slate-800" 
                      />
                    ) : (
                      <div className={cn(
                        "w-12 h-14 rounded-xl flex items-center justify-center text-white font-black text-base shadow-xs shrink-0",
                        teacher.avatarColor || "bg-blue-600"
                      )}>
                        {teacher.nama.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                        {teacher.nama}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                          {teacher.jabatan}
                        </span>
                      </div>
                      {teacher.statusKepegawaian && (
                        <div className="mt-1">
                          <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 inline-block">
                            {teacher.statusKepegawaian}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0",
                    (teacher.status === 'Aktif' || !teacher.status)
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                      : teacher.status === 'Pensiun'
                      ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800"
                      : teacher.status === 'Cuti'
                      ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                      : teacher.status === 'Mutasi Keluar'
                      ? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800"
                      : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                  )}>
                    {teacher.status === 'Pensiun' ? '🟣 Pensiun' : teacher.status === 'Cuti' ? '🟡 Cuti' : teacher.status === 'Mutasi Keluar' ? '🔵 Mutasi Keluar' : teacher.status || 'Aktif'}
                  </span>
                </div>

                {/* Duty Category Tag & Auto-Fill Info */}
                <div className="mt-3">
                  {category === 'kepala_sekolah' && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-bold">
                      <School className="w-3.5 h-3.5 text-amber-600" />
                      <span>Kepala Sekolah • TTD Raport & Dokumen</span>
                    </div>
                  )}

                  {category === 'wali_kelas' && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-bold">
                      <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>Wali Kelas • Terisi di Raport & Input Nilai</span>
                    </div>
                  )}

                  {category === 'guru_mapel' && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-[11px] font-bold">
                      <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                      <span>Guru Mapel {teacher.mataPelajaran ? `• ${teacher.mataPelajaran}` : ''}</span>
                    </div>
                  )}

                  {category === 'tenaga_kependidikan' && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-bold">
                      <Briefcase className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                      <span>Tenaga Kependidikan (Tendik)</span>
                    </div>
                  )}
                </div>

                {/* Keaktifan Info Highlight for Pensiun, Cuti, Mutasi */}
                {teacher.status === 'Pensiun' && (
                  <div className="mt-2.5 p-2 rounded-xl bg-purple-50/80 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-900/60 text-[11px] text-purple-900 dark:text-purple-300 flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      <span>Purna Tugas / Pensiun</span>
                    </span>
                    <span className="font-mono text-[10px]">
                      {teacher.tanggalPensiun ? `TMT: ${formatIndonesianDate(teacher.tanggalPensiun)}` : (teacher.noSkPensiun ? `SK: ${teacher.noSkPensiun}` : 'Pensiun')}
                    </span>
                  </div>
                )}

                {teacher.status === 'Cuti' && (
                  <div className="mt-2.5 p-2 rounded-xl bg-amber-50/80 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-900 dark:text-amber-300 flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>{teacher.jenisCuti || 'Masa Cuti'}</span>
                    </span>
                    <span className="text-[10px]">
                      {teacher.tglMulaiCuti ? `${formatIndonesianDate(teacher.tglMulaiCuti)}` : 'Sedang Cuti'}
                    </span>
                  </div>
                )}

                {teacher.status === 'Mutasi Keluar' && (
                  <div className="mt-2.5 p-2 rounded-xl bg-sky-50/80 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-900/60 text-[11px] text-sky-900 dark:text-sky-300 flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                      <span>Pindah Tugas</span>
                    </span>
                    <span className="text-[10px] truncate max-w-[130px]" title={teacher.sekolahTujuanMutasi}>
                      {teacher.sekolahTujuanMutasi || 'Sekolah Lain'}
                    </span>
                  </div>
                )}

                {/* Detail fields */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">NIP / NUPTK:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {teacher.nip || teacher.nuptk || '-'}
                    </span>
                  </div>
                  {teacher.noHp && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">No. WhatsApp / HP:</span>
                      <a 
                        href={`https://wa.me/${teacher.noHp.replace(/[^0-9]/g, '')}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{teacher.noHp}</span>
                      </a>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Email Akun:</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[180px]">
                      {teacher.email}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Hak Akses:</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold",
                      teacher.role === 'admin' 
                        ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                        : teacher.role === 'user'
                        ? "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200"
                        : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                    )}>
                      {teacher.role === 'admin' ? 'Administrator' : teacher.role === 'user' ? 'Guru Kelas / Pengampu' : 'Tamu / Umum'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTeacherForDetail(teacher)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Lihat biodata lengkap guru & pasfoto resmi"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Lihat Biodata</span>
                </button>

                {currentRole === 'admin' && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(teacher)}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(teacher)}
                      className="px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 hover:bg-red-100 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredTeachers.length === 0 && (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <GraduationCap className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Tidak ada data guru yang cocok
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Coba ubah kata kunci pencarian atau ganti filter kategori penugasan.
          </p>
        </div>
      )}

      {/* Add / Edit Teacher Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full overflow-hidden animate-in zoom-in-95 duration-150 my-6 max-h-[94vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-slate-800/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-[#003399] dark:text-blue-400 flex items-center justify-center font-bold shadow-2xs">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                    {editingTeacher ? 'Edit Data Guru & Penugasan' : 'Tambah Data Guru Baru'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Formulir lengkap biodata guru, pasfoto, kepegawaian, kontak, dan penugasan mengajar
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 text-xs overflow-y-auto flex-1">
              {/* UPLOAD PASFOTO GURU */}
              <div className="p-4 rounded-2xl bg-linear-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 dark:from-slate-800/80 dark:via-slate-800/60 dark:to-slate-850 border border-blue-200/80 dark:border-slate-700/80 shadow-xs">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  {/* Photo Frame (3:4 Ratio) */}
                  <div className="relative w-28 h-36 rounded-2xl bg-white dark:bg-slate-900 border-2 border-dashed border-blue-300 dark:border-blue-700/70 flex items-center justify-center shrink-0 overflow-hidden shadow-xs group">
                    {formData.fotoUrl ? (
                      <img
                        src={formData.fotoUrl}
                        alt="Pasfoto Guru"
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-2 text-slate-400 dark:text-slate-500">
                        <User className="w-10 h-10 mb-1 text-slate-300 dark:text-slate-600" />
                        <span className="text-[10px] font-bold leading-tight">Pasfoto 3x4</span>
                        <span className="text-[9px] text-slate-400">Belum ada foto</span>
                      </div>
                    )}

                    {isCompressingPhoto && (
                      <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xs flex flex-col items-center justify-center gap-1.5">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-[10px] font-bold text-blue-600">Memproses...</span>
                      </div>
                    )}
                  </div>

                  {/* Photo Controls */}
                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center justify-center sm:justify-start gap-1.5">
                        <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>Pasfoto Guru / Tenaga Pendidik</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        Unggah pasfoto resmi guru untuk kartu identitas, profil Buku Induk, dan cetak lembar kepegawaian.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => setIsCameraModalOpen(true)}
                        disabled={isCompressingPhoto}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Camera className="w-3.5 h-3.5 text-amber-300" />
                        <span>Ambil dengan Kamera</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isCompressingPhoto}
                        className="px-3.5 py-2 bg-[#003399] hover:bg-[#002266] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Upload className="w-3.5 h-3.5 text-amber-300" />
                        <span>{formData.fotoUrl ? 'Ganti Berkas Foto' : 'Pilih Pasfoto Guru'}</span>
                      </button>

                      {formData.fotoUrl && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="px-3 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus Foto</span>
                        </button>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-400 dark:text-slate-500">
                      Mendukung format JPG, JPEG, PNG, atau WEBP. Berkas foto akan otomatis dioptimasi dan dikompresi agar ringan.
                    </p>

                    {photoError && (
                      <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-[11px] flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{photoError}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* BAGIAN 1: IDENTITAS POKOK GURU */}
              <div className="space-y-3 p-4 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/60">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[10px] flex items-center justify-center">1</span>
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Identitas Pokok Guru / Pendidik
                  </h4>
                </div>

                {/* Nama Lengkap */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Lengkap & Gelar <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    placeholder="Contoh: Siti Rahmawati, S.Pd."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-600 font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Sertakan gelar akademik lengkap (S.Pd., M.M., dsb.)</span>
                </div>

                {/* NIP & NUPTK */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      NIP (Nomor Induk Pegawai)
                    </label>
                    <input
                      type="text"
                      value={formData.nip}
                      onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                      placeholder="19850614 201001 2 012"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden font-mono"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Otomatis tercetak di kolom TTD raport</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      NUPTK (Nomor Unik Pendidik)
                    </label>
                    <input
                      type="text"
                      value={formData.nuptk}
                      onChange={(e) => setFormData({ ...formData, nuptk: e.target.value })}
                      placeholder="16 digit NUPTK resmi"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden font-mono"
                    />
                  </div>
                </div>

                {/* NIK & Jenis Kelamin */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      NIK (Nomor Induk Kependudukan / KTP)
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      value={formData.nik}
                      onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                      placeholder="16 digit NIK pada KTP"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Jenis Kelamin <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, jenisKelamin: 'L' })}
                        className={cn(
                          "py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all",
                          formData.jenisKelamin === 'L'
                            ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                        )}
                      >
                        <span>Laki-Laki (L)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, jenisKelamin: 'P' })}
                        className={cn(
                          "py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all",
                          formData.jenisKelamin === 'P'
                            ? "bg-rose-600 text-white border-rose-600 shadow-2xs"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                        )}
                      >
                        <span>Perempuan (P)</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tempat & Tanggal Lahir */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tempat Lahir
                    </label>
                    <input
                      type="text"
                      value={formData.tempatLahir}
                      onChange={(e) => setFormData({ ...formData, tempatLahir: e.target.value })}
                      placeholder="Contoh: Sungai Buluh"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tanggal Lahir
                    </label>
                    <input
                      type="date"
                      value={formData.tanggalLahir}
                      onChange={(e) => setFormData({ ...formData, tanggalLahir: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden font-semibold"
                    />
                  </div>
                </div>

                {/* Agama & Status Pernikahan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Agama
                    </label>
                    <select
                      value={formData.agama}
                      onChange={(e) => setFormData({ ...formData, agama: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden font-semibold"
                    >
                      {AGAMA_OPTIONS.map((agm) => (
                        <option key={agm} value={agm}>{agm}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Status Pernikahan
                    </label>
                    <select
                      value={formData.statusPernikahan}
                      onChange={(e) => setFormData({ ...formData, statusPernikahan: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden font-semibold"
                    >
                      {STATUS_PERNIKAHAN_OPTIONS.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Nama Ibu Kandung */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Ibu Kandung
                  </label>
                  <input
                    type="text"
                    value={formData.namaIbuKandung}
                    onChange={(e) => setFormData({ ...formData, namaIbuKandung: e.target.value })}
                    placeholder="Nama ibu kandung sesuai akta / Dapodik"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Digunakan untuk verifikasi akun Dapodik dan berkas kepegawaian resmi</span>
                </div>
              </div>

              {/* BAGIAN 2: KEPEGAWAIAN & KUALIFIKASI PENDIDIKAN */}
              <div className="space-y-3 p-4 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/60">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center">2</span>
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Kepegawaian & Riwayat Pendidikan
                  </h4>
                </div>

                {/* Status Kepegawaian & Pangkat Golongan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Status Kepegawaian <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.statusKepegawaian}
                      onChange={(e) => setFormData({ ...formData, statusKepegawaian: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden font-semibold"
                    >
                      {STATUS_KEPEGAWAIAN_OPTIONS.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Pangkat / Golongan Ruang
                    </label>
                    <select
                      value={formData.pangkatGolongan}
                      onChange={(e) => setFormData({ ...formData, pangkatGolongan: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden font-semibold"
                    >
                      {PANGKAT_GOLONGAN_OPTIONS.map((pg) => (
                        <option key={pg} value={pg}>{pg}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Pendidikan Terakhir & Jurusan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Pendidikan Terakhir <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.pendidikanTerakhir}
                      onChange={(e) => setFormData({ ...formData, pendidikanTerakhir: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden font-semibold"
                    >
                      {PENDIDIKAN_OPTIONS.map((pend) => (
                        <option key={pend} value={pend}>{pend}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Jurusan / Program Studi
                    </label>
                    <input
                      type="text"
                      value={formData.jurusanPendidikan}
                      onChange={(e) => setFormData({ ...formData, jurusanPendidikan: e.target.value })}
                      placeholder="Contoh: PGSD, Pendidikan Agama Islam"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Perguruan Tinggi / Universitas Asal */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Perguruan Tinggi / Universitas Asal
                  </label>
                  <input
                    type="text"
                    value={formData.ptAsal}
                    onChange={(e) => setFormData({ ...formData, ptAsal: e.target.value })}
                    placeholder="Contoh: Universitas Terbuka, Universitas Negeri Padang"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden"
                  />
                </div>

                {/* TMT Pengangkatan & TMT Tugas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      TMT Pengangkatan Pertama (SK CPNS/Awal)
                    </label>
                    <input
                      type="date"
                      value={formData.tmtPengangkatan}
                      onChange={(e) => setFormData({ ...formData, tmtPengangkatan: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      TMT Tugas di SDN 006
                    </label>
                    <input
                      type="date"
                      value={formData.tmtTugas}
                      onChange={(e) => setFormData({ ...formData, tmtTugas: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* BAGIAN 3: KONTAK & DOMISILI */}
              <div className="space-y-3 p-4 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/60">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[10px] flex items-center justify-center">3</span>
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Kontak & Domisili
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      No. WhatsApp / HP Aktif
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        value={formData.noHp}
                        onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
                        placeholder="0812-3456-7890"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Email Akun <span className="text-slate-400 font-normal">(Opsional)</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Contoh: guru@sdn006.sch.id"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Jika dikosongkan, sistem akan otomatis membuat alamat email</span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Alamat Lengkap Tempat Tinggal
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <textarea
                      rows={2}
                      value={formData.alamat}
                      onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                      placeholder="Jalan, RT/RW, Dusun, Desa/Kelurahan, Kecamatan, Kabupaten"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              {/* BAGIAN 4: KATEGORI JABATAN / PENUGASAN DI SEKOLAH */}
              <div className="p-4 bg-blue-50/60 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800/70 space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-blue-200/60 dark:border-blue-800/60">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#003399] text-white font-black text-[10px] flex items-center justify-center">4</span>
                    <label className="block font-extrabold text-blue-950 dark:text-blue-200 text-xs uppercase tracking-wider">
                      Penugasan Sekolah & Sinkronisasi Raport <span className="text-rose-500">*</span>
                    </label>
                  </div>
                  <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                    Otomatis Sinkron Raport
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleCategoryChange('kepala_sekolah')}
                    className={cn(
                      "p-3 rounded-xl border text-left font-bold transition-all flex flex-col justify-between cursor-pointer",
                      formData.kategoriTugas === 'kepala_sekolah'
                        ? "bg-[#003399] text-white border-[#003399] shadow-xs"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <School className="w-5 h-5 mb-1.5 text-amber-400" />
                    <div>
                      <div className="text-[11px] leading-tight">Kepala Sekolah</div>
                      <div className="text-[9.5px] opacity-80 font-normal mt-0.5">Penanggung Jawab</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCategoryChange('wali_kelas')}
                    className={cn(
                      "p-3 rounded-xl border text-left font-bold transition-all flex flex-col justify-between cursor-pointer",
                      formData.kategoriTugas === 'wali_kelas'
                        ? "bg-[#003399] text-white border-[#003399] shadow-xs"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <GraduationCap className="w-5 h-5 mb-1.5 text-sky-400" />
                    <div>
                      <div className="text-[11px] leading-tight">Wali Kelas</div>
                      <div className="text-[9.5px] opacity-80 font-normal mt-0.5">Tingkat 1 - 6</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCategoryChange('guru_mapel')}
                    className={cn(
                      "p-3 rounded-xl border text-left font-bold transition-all flex flex-col justify-between cursor-pointer",
                      formData.kategoriTugas === 'guru_mapel'
                        ? "bg-[#003399] text-white border-[#003399] shadow-xs"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <BookOpen className="w-5 h-5 mb-1.5 text-teal-400" />
                    <div>
                      <div className="text-[11px] leading-tight">Guru Mapel</div>
                      <div className="text-[9.5px] opacity-80 font-normal mt-0.5">Mata Pelajaran</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCategoryChange('tenaga_kependidikan')}
                    className={cn(
                      "p-3 rounded-xl border text-left font-bold transition-all flex flex-col justify-between cursor-pointer",
                      formData.kategoriTugas === 'tenaga_kependidikan'
                        ? "bg-[#003399] text-white border-[#003399] shadow-xs"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <Briefcase className="w-5 h-5 mb-1.5 text-amber-400" />
                    <div>
                      <div className="text-[11px] leading-tight">Tenaga Kependidikan</div>
                      <div className="text-[9.5px] opacity-80 font-normal mt-0.5">Operator / TU / Staf</div>
                    </div>
                  </button>
                </div>

                {/* Sub-selectors per Category */}
                {formData.kategoriTugas === 'wali_kelas' && (
                  <div className="pt-2 border-t border-blue-200/70 dark:border-blue-800/70 space-y-2">
                    <label className="block font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                      Pilih Tingkat Kelas yang Diampu <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.tingkatKelas}
                      onChange={(e) => handleTingkatChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold focus:outline-hidden"
                    >
                      {TINGKAT_KELAS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <div className="p-2.5 rounded-xl bg-blue-100/70 dark:bg-blue-900/40 text-blue-900 dark:text-blue-200 text-[11px] font-medium flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-300 shrink-0" />
                      <span>Data nama & NIP guru ini akan <strong>otomatis terisi</strong> pada input nilai dan tanda tangan lembar cetak raport untuk siswa <strong>{formData.tingkatKelas}</strong>.</span>
                    </div>
                  </div>
                )}

                {formData.kategoriTugas === 'guru_mapel' && (
                  <div className="pt-2 border-t border-blue-200/70 dark:border-blue-800/70 space-y-2">
                    <label className="block font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                      Pilih Mata Pelajaran yang Diampu <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.mataPelajaran}
                      onChange={(e) => handleMapelChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold focus:outline-hidden"
                    >
                      {MAPEL_OPTIONS.map((mapel) => (
                        <option key={mapel} value={mapel}>
                          {mapel}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.kategoriTugas === 'tenaga_kependidikan' && (
                  <div className="pt-2 border-t border-blue-200/70 dark:border-blue-800/70 space-y-2">
                    <label className="block font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                      Pilih Penugasan Administrasi <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.tugasTendik}
                      onChange={(e) => handleTendikChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold focus:outline-hidden"
                    >
                      {TENDIK_OPTIONS.map((tendik) => (
                        <option key={tendik} value={tendik}>
                          {tendik}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.kategoriTugas === 'kepala_sekolah' && (
                  <div className="p-2.5 rounded-xl bg-amber-100/70 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 text-[11px] font-medium flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-300 shrink-0" />
                    <span>Data nama & NIP akan otomatis disinkronkan ke <strong>Profil Sekolah</strong> sebagai penandatangan resmi raport, buku induk, ijazah STTB, dan mutasi.</span>
                  </div>
                )}

                {/* Teks Jabatan Hasil / Kustom */}
                <div className="pt-2 border-t border-blue-200/70 dark:border-blue-800/70">
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                      Nama Jabatan Tercetak / Ditampilkan
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const nextState = !formData.isCustomJabatan;
                        setFormData(prev => ({
                          ...prev,
                          isCustomJabatan: nextState,
                          jabatan: !nextState ? computeAutoJabatan(prev.kategoriTugas, prev.tingkatKelas, prev.mataPelajaran, prev.tugasTendik) : prev.jabatan,
                        }));
                      }}
                      className="text-[10px] text-blue-700 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                    >
                      {formData.isCustomJabatan ? 'Kembalikan Format Otomatis' : 'Kustomisasi Teks Jabatan'}
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.jabatan}
                    onChange={(e) => setFormData({ ...formData, jabatan: e.target.value, isCustomJabatan: true })}
                    placeholder="Contoh: Wali Kelas 6 / Guru Mapel PJOK"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold focus:outline-hidden"
                  />
                </div>

                {/* Status & Akses */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Hak Akses Sistem
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden font-semibold"
                    >
                      <option value="user">Guru / Wali Kelas</option>
                      <option value="admin">Administrator / Kepsek & TU</option>
                      <option value="umum">Staf Umum / Tamu</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Status Mengajar / Keaktifan Guru <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden font-bold"
                    >
                      {STATUS_MENGAJAR_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Form Khusus Status Pensiun / Purna Tugas */}
                {formData.status === 'Pensiun' && (
                  <div className="p-4 rounded-xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 space-y-3 animate-in fade-in">
                    <div className="flex items-center gap-2 pb-1 border-b border-purple-200/60 dark:border-purple-800/60">
                      <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <div>
                        <h5 className="font-extrabold text-xs text-purple-900 dark:text-purple-200 uppercase tracking-wide">
                          Data Keaktifan: Pensiun / Purna Tugas
                        </h5>
                        <p className="text-[10px] text-purple-700/80 dark:text-purple-300/80">
                          Catat TMT dan berkas SK Pensiun resmi PTK
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                          TMT Pensiun / Tanggal Mulai Pensiun
                        </label>
                        <input
                          type="date"
                          value={formData.tanggalPensiun}
                          onChange={(e) => setFormData({ ...formData, tanggalPensiun: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                          Nomor SK Pensiun
                        </label>
                        <input
                          type="text"
                          value={formData.noSkPensiun}
                          onChange={(e) => setFormData({ ...formData, noSkPensiun: e.target.value })}
                          placeholder="Contoh: 821.2/DISDIK/SK-PENSIUN/2026"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                        Pejabat / Instansi Penerbit SK Pensiun
                      </label>
                      <input
                        type="text"
                        value={formData.pejabatSkPensiun}
                        onChange={(e) => setFormData({ ...formData, pejabatSkPensiun: e.target.value })}
                        placeholder="Contoh: Bupati Kuantan Singingi / BKN Kantor Regional XII"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                        Catatan / Riwayat Pengabdian Pensiun
                      </label>
                      <textarea
                        rows={2}
                        value={formData.keteranganKeaktifan}
                        onChange={(e) => setFormData({ ...formData, keteranganKeaktifan: e.target.value })}
                        placeholder="Catatan purna tugas, masa kerja golongan akhir, keterangan BUP..."
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden leading-relaxed"
                      />
                    </div>
                  </div>
                )}

                {/* Form Khusus Status Cuti */}
                {formData.status === 'Cuti' && (
                  <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 space-y-3 animate-in fade-in">
                    <div className="flex items-center gap-2 pb-1 border-b border-amber-200/60 dark:border-amber-800/60">
                      <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <h5 className="font-extrabold text-xs text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                        Data Keaktifan: Masa Cuti Guru
                      </h5>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                          Jenis Cuti
                        </label>
                        <select
                          value={formData.jenisCuti}
                          onChange={(e) => setFormData({ ...formData, jenisCuti: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold focus:outline-hidden"
                        >
                          {JENIS_CUTI_OPTIONS.map((jc) => (
                            <option key={jc} value={jc}>{jc}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                          Tanggal Mulai Cuti
                        </label>
                        <input
                          type="date"
                          value={formData.tglMulaiCuti}
                          onChange={(e) => setFormData({ ...formData, tglMulaiCuti: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                          Tanggal Selesai Cuti
                        </label>
                        <input
                          type="date"
                          value={formData.tglSelesaiCuti}
                          onChange={(e) => setFormData({ ...formData, tglSelesaiCuti: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                        Nomor Surat Izin Cuti
                      </label>
                      <input
                        type="text"
                        value={formData.noIzinCuti}
                        onChange={(e) => setFormData({ ...formData, noIzinCuti: e.target.value })}
                        placeholder="Nomor surat izin cuti dari dinas pendidikan / kepala sekolah"
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden"
                      />
                    </div>
                  </div>
                )}

                {/* Form Khusus Status Mutasi Keluar */}
                {formData.status === 'Mutasi Keluar' && (
                  <div className="p-4 rounded-xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/80 space-y-3 animate-in fade-in">
                    <div className="flex items-center gap-2 pb-1 border-b border-sky-200/60 dark:border-sky-800/60">
                      <Building className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                      <h5 className="font-extrabold text-xs text-sky-900 dark:text-sky-200 uppercase tracking-wide">
                        Data Keaktifan: Mutasi Keluar / Pindah Tugas
                      </h5>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                          Sekolah / Instansi Tujuan Mutasi
                        </label>
                        <input
                          type="text"
                          value={formData.sekolahTujuanMutasi}
                          onChange={(e) => setFormData({ ...formData, sekolahTujuanMutasi: e.target.value })}
                          placeholder="Contoh: SD Negeri 001 Teluk Kuantan"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                          Nomor SK Mutasi
                        </label>
                        <input
                          type="text"
                          value={formData.noSkMutasi}
                          onChange={(e) => setFormData({ ...formData, noSkMutasi: e.target.value })}
                          placeholder="Nomor SK Pindah Tugas / Mutasi"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Khusus Status Nonaktif */}
                {formData.status === 'Nonaktif' && (
                  <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 animate-in fade-in">
                    <label className="block font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                      Alasan / Keterangan Nonaktif
                    </label>
                    <textarea
                      rows={2}
                      value={formData.keteranganKeaktifan}
                      onChange={(e) => setFormData({ ...formData, keteranganKeaktifan: e.target.value })}
                      placeholder="Keterangan status nonaktif, pengunduran diri, atau alasan lainnya..."
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden text-xs"
                    />
                  </div>
                )}
              </div>

              {/* BAGIAN 5: KREDENSIAL AKUN LOGIN (OPSIONAL) */}
              <div className="space-y-3 p-4 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/60">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-black text-[10px] flex items-center justify-center">5</span>
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      Kredensial Akun Login Sistem (Opsional)
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Opsional: Buat nama pengguna dan kata sandi jika guru ini akan login langsung ke sistem
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Username Login
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="Contoh: sitirahma / NIP"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Password Login
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Kata sandi akun"
                        className="w-full pl-9 pr-10 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#003399] hover:bg-[#002266] text-white font-bold shadow-md cursor-pointer text-xs flex items-center gap-1.5 transition-all hover:scale-102"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{editingTeacher ? 'Simpan Perubahan Data Guru' : 'Simpan Data Guru Baru'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Biodata PTK Modal */}
      {selectedTeacherForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-3xl w-full overflow-hidden animate-in zoom-in-95 duration-150 my-6 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/80 dark:bg-slate-800/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-[#003399] dark:text-blue-400 flex items-center justify-center font-bold shadow-2xs">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                    Biodata Lengkap Pendidik & Tenaga Kependidikan
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Profil resmi PTK • {schoolProfile.namaSekolah || 'SD NEGERI 006 SUNGAI BULUH'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTeacherForDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 text-xs overflow-y-auto flex-1">
              {/* Profile Card Header */}
              <div className="p-5 rounded-2xl bg-linear-to-r from-blue-50/80 via-indigo-50/50 to-slate-50 dark:from-slate-800/80 dark:via-slate-800/60 dark:to-slate-850 border border-blue-200/80 dark:border-slate-700/80 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-5">
                {/* 3:4 Official Photo */}
                <div className="relative w-28 h-36 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 overflow-hidden shadow-md">
                  {selectedTeacherForDetail.fotoUrl ? (
                    <img
                      src={selectedTeacherForDetail.fotoUrl}
                      alt={selectedTeacherForDetail.nama}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={cn("w-full h-full flex flex-col items-center justify-center text-white font-extrabold text-3xl", selectedTeacherForDetail.avatarColor || "bg-blue-600")}>
                      <span>{selectedTeacherForDetail.nama.charAt(0)}</span>
                      <span className="text-[9px] font-medium tracking-normal mt-1 opacity-80">Foto Kosong</span>
                    </div>
                  )}
                </div>

                {/* Profile Key Info */}
                <div className="flex-1 text-center sm:text-left space-y-1.5">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border",
                      selectedTeacherForDetail.status === 'Aktif'
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                        : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                    )}>
                      {selectedTeacherForDetail.status || 'Aktif'}
                    </span>
                    {selectedTeacherForDetail.statusKepegawaian && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {selectedTeacherForDetail.statusKepegawaian}
                      </span>
                    )}
                    {selectedTeacherForDetail.pangkatGolongan && selectedTeacherForDetail.pangkatGolongan !== '-' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        {selectedTeacherForDetail.pangkatGolongan}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                    {selectedTeacherForDetail.nama}
                  </h3>

                  <p className="text-xs font-bold text-blue-700 dark:text-blue-400">
                    {selectedTeacherForDetail.jabatan}
                  </p>

                  <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    {selectedTeacherForDetail.noHp && (
                      <a
                        href={`https://wa.me/${selectedTeacherForDetail.noHp.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Kirim WhatsApp</span>
                      </a>
                    )}
                    {selectedTeacherForDetail.email && (
                      <a
                        href={`mailto:${selectedTeacherForDetail.email}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[11px] transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Kirim Email</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* 1. Identitas Pokok */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/60">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[10px] flex items-center justify-center">1</span>
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Identitas Pokok Pegawai
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Nama Lengkap & Gelar</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-right">{selectedTeacherForDetail.nama}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">NIP</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-right">{selectedTeacherForDetail.nip || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">NUPTK</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-right">{selectedTeacherForDetail.nuptk || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">NIK (KTP)</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-right">{selectedTeacherForDetail.nik || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Jenis Kelamin</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-right">{selectedTeacherForDetail.jenisKelamin === 'L' ? 'Laki-Laki (L)' : selectedTeacherForDetail.jenisKelamin === 'P' ? 'Perempuan (P)' : '-'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Tempat, Tanggal Lahir</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-right">
                      {selectedTeacherForDetail.tempatLahir ? `${selectedTeacherForDetail.tempatLahir}, ` : ''}
                      {selectedTeacherForDetail.tanggalLahir ? formatIndonesianDate(selectedTeacherForDetail.tanggalLahir) : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Agama</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-right">{selectedTeacherForDetail.agama || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Nama Ibu Kandung</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-right">{selectedTeacherForDetail.namaIbuKandung || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Status Pernikahan</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-right">{selectedTeacherForDetail.statusPernikahan || '-'}</span>
                  </div>
                </div>
              </div>

              {/* 2. Kepegawaian & Pendidikan */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/60">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center">2</span>
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Kepegawaian & Riwayat Pendidikan
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Status Kepegawaian</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-right">{selectedTeacherForDetail.statusKepegawaian || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Pangkat / Golongan</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-right">{selectedTeacherForDetail.pangkatGolongan || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Pendidikan Terakhir</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-right">{selectedTeacherForDetail.pendidikanTerakhir || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Jurusan / Program Studi</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-right">{selectedTeacherForDetail.jurusanPendidikan || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Perguruan Tinggi Asal</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-right">{selectedTeacherForDetail.ptAsal || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">TMT Pengangkatan (CPNS/Awal)</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-right">
                      {selectedTeacherForDetail.tmtPengangkatan ? formatIndonesianDate(selectedTeacherForDetail.tmtPengangkatan) : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">TMT Tugas di SDN 006</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-right">
                      {selectedTeacherForDetail.tmtTugas ? formatIndonesianDate(selectedTeacherForDetail.tmtTugas) : '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Kontak & Domisili */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/60">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[10px] flex items-center justify-center">3</span>
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Kontak & Domisili
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">No. WhatsApp / HP</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-right">{selectedTeacherForDetail.noHp || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Email Akun</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-right">{selectedTeacherForDetail.email}</span>
                  </div>
                  <div className="sm:col-span-2 flex flex-col py-1">
                    <span className="text-slate-400 mb-0.5">Alamat Tempat Tinggal</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">{selectedTeacherForDetail.alamat || '-'}</span>
                  </div>
                </div>
              </div>

              {/* 4. Penugasan & Kredensial */}
              <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/70 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-blue-200/60 dark:border-blue-800/60">
                  <span className="w-5 h-5 rounded-full bg-[#003399] text-white font-black text-[10px] flex items-center justify-center">4</span>
                  <h4 className="font-extrabold text-xs text-blue-950 dark:text-blue-200 uppercase tracking-wider">
                    Penugasan & Akun Sistem
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-blue-100 dark:border-blue-900/60">
                    <span className="text-slate-500 dark:text-slate-400">Kategori Tugas</span>
                    <span className="font-bold text-blue-900 dark:text-blue-200 text-right capitalize">{selectedTeacherForDetail.kategoriTugas?.replace('_', ' ') || 'Guru'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-blue-100 dark:border-blue-900/60">
                    <span className="text-slate-500 dark:text-slate-400">Jabatan Tercetak</span>
                    <span className="font-bold text-blue-900 dark:text-blue-200 text-right">{selectedTeacherForDetail.jabatan}</span>
                  </div>
                  {selectedTeacherForDetail.tingkatKelas && (
                    <div className="flex justify-between py-1 border-b border-blue-100 dark:border-blue-900/60">
                      <span className="text-slate-500 dark:text-slate-400">Wali Rombel</span>
                      <span className="font-bold text-blue-900 dark:text-blue-200 text-right">{selectedTeacherForDetail.tingkatKelas}</span>
                    </div>
                  )}
                  {selectedTeacherForDetail.mataPelajaran && (
                    <div className="flex justify-between py-1 border-b border-blue-100 dark:border-blue-900/60">
                      <span className="text-slate-500 dark:text-slate-400">Mata Pelajaran</span>
                      <span className="font-bold text-blue-900 dark:text-blue-200 text-right">{selectedTeacherForDetail.mataPelajaran}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1 border-b border-blue-100 dark:border-blue-900/60">
                    <span className="text-slate-500 dark:text-slate-400">Hak Akses</span>
                    <span className="font-bold text-blue-900 dark:text-blue-200 text-right">{selectedTeacherForDetail.role === 'admin' ? 'Administrator' : selectedTeacherForDetail.role === 'user' ? 'Guru / Wali Kelas' : 'Tamu / Umum'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-blue-100 dark:border-blue-900/60">
                    <span className="text-slate-500 dark:text-slate-400">Username Login</span>
                    <span className="font-mono font-bold text-blue-900 dark:text-blue-200 text-right">{selectedTeacherForDetail.username || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-slate-800/60">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-amber-300" />
                <span>Cetak Rekap PTK</span>
              </button>

              <div className="flex items-center gap-2">
                {currentRole === 'admin' && (
                  <button
                    type="button"
                    onClick={() => {
                      const teacher = selectedTeacherForDetail;
                      setSelectedTeacherForDetail(null);
                      handleOpenEdit(teacher);
                    }}
                    className="px-4 py-2 bg-[#003399] hover:bg-[#002266] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Data Guru</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedTeacherForDetail(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* ================= FORMAL PRINT DAFTAR PTK WITH KOP SURAT ================= */}
      <div className="hidden print:block max-w-[297mm] mx-auto bg-white text-slate-950 p-[10mm] font-serif text-[11px] leading-relaxed">
        <KopSuratHeader
          schoolProfile={schoolProfile}
          documentTitle="DAFTAR REKAPITULASI PENDIDIK & TENAGA KEPENDIDIKAN (PTK)"
          documentSubtitle={`TAHUN PELAJARAN ${schoolProfile.tahunPelajaranAktif || '2025/2026'}`}
        />

        <div className="my-2 flex justify-between items-center text-[10px] font-sans text-slate-700">
          <div>Total PTK: <strong>{filteredTeachers.length} Orang</strong> | Kategori: <strong>{filterCategory.toUpperCase()}</strong></div>
          <div>Dicetak pada: {formatIndonesianDate(new Date().toISOString())}</div>
        </div>

        <table className="w-full border-collapse border border-slate-950 text-[10px] my-2">
          <thead>
            <tr className="bg-slate-100 text-slate-950 font-bold">
              <th className="border border-slate-950 px-2 py-1 text-center w-8">No</th>
              <th className="border border-slate-950 px-2 py-1 text-left">Nama Lengkap & Gelar</th>
              <th className="border border-slate-950 px-2 py-1 text-center w-28">NIP / NUPTK</th>
              <th className="border border-slate-950 px-2 py-1 text-center w-8">L/P</th>
              <th className="border border-slate-950 px-2 py-1 text-left">Jabatan / Tugas Pokok</th>
              <th className="border border-slate-950 px-2 py-1 text-left">Tugas Mengajar / Rombel</th>
              <th className="border border-slate-950 px-2 py-1 text-center w-20">Status Kepegawaian</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeachers.map((t, idx) => (
              <tr key={t.id}>
                <td className="border border-slate-950 px-2 py-1 text-center font-mono">{idx + 1}</td>
                <td className="border border-slate-950 px-2 py-1 font-bold uppercase">{t.nama}</td>
                <td className="border border-slate-950 px-2 py-1 text-center font-mono">{t.nip || '-'}</td>
                <td className="border border-slate-950 px-2 py-1 text-center font-bold">{t.jenisKelamin || '-'}</td>
                <td className="border border-slate-950 px-2 py-1 font-semibold">{t.jabatan || 'Guru'}</td>
                <td className="border border-slate-950 px-2 py-1">{t.mataPelajaran || t.waliKelas || '-'}</td>
                <td className="border border-slate-950 px-2 py-1 text-center">{t.statusKepegawaian || 'PNS'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Tanda Tangan Resmi Kepala Sekolah */}
        <div className="flex justify-between items-end mt-6 font-sans text-[11px] avoid-break">
          <div className="text-center">
            <div>Mengetahui,</div>
            <div>Pengelola Kepegawaian / Tata Usaha</div>
            <div className="h-16" />
            <div className="font-bold underline">Petugas Kepegawaian</div>
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

      {/* Modal Kamera Pasfoto Guru */}
      {isCameraModalOpen && (
        <CameraCaptureModal
          isOpen={isCameraModalOpen}
          onClose={() => setIsCameraModalOpen(false)}
          onCapture={(photoDataUrl) => {
            setFormData(prev => ({ ...prev, fotoUrl: photoDataUrl }));
            setPhotoError(null);
          }}
          title="Ambil Pasfoto Guru / PTK"
          studentName={formData.nama}
        />
      )}
    </div>
  );
};
