/**
 * BUKU INDUK SEKOLAH - Types & Interfaces
 * Standar Buku Induk Register Peserta Didik Kemdikbudristek RI
 */

export type Gender = 'L' | 'P';
export type Religion = 'Islam' | 'Kristen Protestan' | 'Katolik' | 'Hindu' | 'Buddha' | 'Konghucu' | 'Lainnya';
export type StudentStatus = 'Aktif' | 'Lulus' | 'Mutasi Keluar' | 'Drop Out' | 'Meninggal' | 'Belum Masuk SD';
export type UserRole = 'admin' | 'user' | 'umum';

// Jenis Bantuan Siswa (Kemdikbudristek, Baznas, Desa, Sekolah, Lainnya)
export type JenisBantuan = 'Penerima PIP' | 'Baznas' | 'Bantuan Sekolah' | 'Bantuan dari desa' | 'Bantuan Lainnya';

export interface BantuanRecord {
  id: string;
  jenis: string; // 'Penerima PIP' | 'Baznas' | 'Bantuan Sekolah' | 'Bantuan dari desa' | 'Bantuan Lainnya' | string
  bantuanLainnya?: string;
  tahunPelajaran: string; // Contoh: "2026/2027"
  tahap: string; // Contoh: "Tahap 1", "Tahap 2", "Semester Ganjil", dll.
  tanggalMenerima?: string; // YYYY-MM-DD
  nominal?: string; // Contoh: "Rp 450.000 / tahun"
  keterangan?: string; // Catatan, Nomor SK, Bank/Rekening
  statusPencairan?: 'Sudah Cair' | 'Dalam Proses' | 'Belum Cair';
  dibuatPada?: string;
}

export interface ParentInfo {
  nama: string;
  nik: string;
  tahunLahir?: string | number;
  tempatLahir?: string;
  tanggalLahir?: string;
  agama: Religion;
  kewarganegaraan: string;
  pendidikan: string;
  pekerjaan: string;
  penghasilanBulanan: string;
  alamat?: string;
  noHp: string;
  statusHidup: 'Masih Hidup' | 'Meninggal Dunia';
}

export interface GuardianInfo {
  nama: string;
  nik?: string;
  tahunLahir?: string | number;
  hubungan: string;
  pendidikan?: string;
  pekerjaan?: string;
  penghasilanBulanan?: string;
  alamat?: string;
  noHp?: string;
}

export interface HealthRecord {
  golonganDarah: 'A' | 'B' | 'AB' | 'O' | 'Tidak Tahu';
  penyakitPernahDiderita?: string;
  kelainanJasmani?: string;
  tinggiBadanCm: number;
  beratBadanKg: number;
}

export interface MutationRecord {
  tglMeninggalkan?: string;
  dariKelas?: string;
  sekolahTujuan?: string;
  desaKelurahanTujuan?: string; // Desa/Kelurahan Sekolah Tujuan
  kecamatanTujuan?: string; // Kecamatan Sekolah Tujuan
  kabupatenKotaTujuan?: string; // Kabupaten/Kota Sekolah Tujuan
  provinsiTujuan?: string; // Provinsi Sekolah Tujuan
  alasanPindah?: string;
  noSuratPindah?: string;
  dikeluarkanTanggal?: string;
  tempatSurat?: string; // Contoh: "Sungai Buluh"

  // Data Permintaan Pindah oleh Orang Tua / Wali
  namaPemohon?: string; // Nama Orang Tua / Wali murid pemohon pindah
  pekerjaanPemohon?: string; // Pekerjaan orang tua / wali murid
  hubunganPemohon?: string; // Ayah / Ibu / Wali

  // Data Penandatangan Surat
  namaKepalaSekolah?: string;
  nipKepalaSekolah?: string;
  jabatanPenandatangan?: string;

  tahunAjaran?: string; // Tahun Pelajaran saat mutasi (contoh: "2025/2026")
  keterangan?: string;
  fotoIjazah?: string; // URL / Base64 image of the Ijazah / Surat Pindah / Mutasi document
  tglUploadIjazah?: string;
}

export interface GraduationSTTB {
  lulusTahun?: string;
  tanggalKelulusan?: string;
  noIjazah?: string;
  noSkhu?: string;
  noPesertaUN?: string;
  melanjutkanKe?: string;
  tglSerahTerima?: string;
  namaPenerima?: string;
  hubunganPenerima?: string;
  statusTandaTerima?: 'Sudah Diterima' | 'Belum Diambil';
  catatan?: string;
  fotoIjazah?: string; // URL / Base64 image of the official Ijazah/STTB
  tglUploadIjazah?: string;
}

export interface SubjectGrade {
  mapel: string;
  kkm: number;
  pengetahuan: number;
  keterampilan: number;
  nilaiAkhir: number;
  predikat: 'A' | 'B' | 'C' | 'D';
}

export interface SemesterReport {
  semester: number; // 1 to 12
  kelas: string;
  tahunAjaran: string;
  nilai: SubjectGrade[];
  kehadiran: {
    sakit: number;
    izin: number;
    tanpaKeterangan: number;
  };
  sikapSpiritual: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Kurang';
  sikapSosial: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Kurang';
  ekstrakurikuler: { kegiatan: string; keterangan: string }[];
  catatanWaliKelas: string;
  peringkatKelas?: number;
  totalSiswaKelas?: number;
}

export interface Student {
  id: string;
  noInduk: string; // NIS
  nisn: string;
  nik: string;
  noKk?: string;
  namaLengkap: string;
  namaPanggilan: string;
  jenisKelamin: Gender;
  tempatLahir: string;
  tanggalLahir: string; // YYYY-MM-DD
  agama: Religion;
  kewarganegaraan: string;
  anakKe: number;
  jumlahSaudaraKandung: number;
  jumlahSaudaraTiri: number;
  jumlahSaudaraAngkat: number;
  statusKeluarga: 'Anak Kandung' | 'Anak Tiri' | 'Anak Angkat' | 'Yatim' | 'Piatu' | 'Yatim Piatu';
  bahasaIbu: string;
  
  // Alamat & Tempat Tinggal
  alamat: string;
  rt: string;
  rw: string;
  dusun?: string;
  kelurahanDesa: string;
  kecamatan: string;
  kabupatenKota: string;
  provinsi: string;
  kodePos: string;
  tinggalDengan: 'Orang Tua' | 'Wali' | 'Asrama / Pondok' | 'Kost' | 'Lainnya';
  jarakKeSekolahKm: number;
  transportasi: 'Jalan Kaki' | 'Sepeda' | 'Sepeda Motor' | 'Angkutan Umum' | 'Mobil / Jemputan';
  noHpSiswa?: string;
  emailSiswa?: string;

  // Jasmani & Kesehatan
  kesehatan: HealthRecord;

  // Orang Tua & Wali
  ayah: ParentInfo;
  ibu: ParentInfo;
  wali?: GuardianInfo;

  // Riwayat Masuk & Pendidikan Sebelumnya
  sekolahAsalTK: string;
  noIjazahTK?: string;
  tanggalDiterima: string;
  diterimaDiKelas: string;
  kelasSekarang: string;
  tahunPelajaranKelasSekarang?: string; // Tahun Pelajaran acuan kelasSekarang (default: "2026/2027")
  status: StudentStatus;
  tahunMasuk: string;
  fotoUrl?: string;

  // Dapodik Kemdikbud Extended Attributes
  usia?: number | string;
  skhun?: string;
  penerimaKps?: string;
  noKps?: string;
  noPesertaUN?: string;
  noSeriIjazah?: string;
  penerimaKip?: string;
  nomorKip?: string;
  namaDiKip?: string;
  nomorKks?: string;
  noRegistrasiAktaLahir?: string;
  bank?: string;
  nomorRekeningBank?: string;
  rekeningAtasNama?: string;
  layakPip?: string;
  alasanLayakPip?: string;
  kebutuhanKhusus?: string;
  lintang?: string;
  bujur?: string;
  lingkarKepala?: number;

  // Penerima Bantuan (No 6: PIP, Baznas, Bantuan Sekolah, Bantuan dari Desa, Bantuan Lainnya)
  penerimaBantuan?: string; // Ringkasan jenis bantuan atau 'Tidak'
  jenisBantuanList?: string[]; // Daftar jenis bantuan yang dipilih (bisa lebih dari satu)
  bantuanLainnya?: string; // Teks kustom bantuan lainnya yang diisi sendiri
  tahunBantuan?: string; // Tahun Pelajaran bantuan (contoh: "2026/2027")
  tahapBantuan?: string; // Tahap penyaluran bantuan (contoh: "Tahap 1", "Tahap 2", "Tahap 3")
  tanggalMenerimaBantuan?: string; // Tanggal menerima bantuan (YYYY-MM-DD)
  nominalBantuan?: string; // Nominal bantuan (contoh: "Rp 450.000 / tahun")
  keteranganBantuan?: string; // Catatan/No KIP/SK Penerima Bantuan
  riwayatBantuan?: BantuanRecord[]; // Riwayat beberapa bantuan yang diterima siswa di tahun pelajaran aktif

  // Meninggal Dunia
  tanggalMeninggal?: string; // Tanggal siswa meninggal dunia (YYYY-MM-DD)
  penyebabMeninggal?: string; // Penyebab wafat / keterangan kematian

  // Modul Lanjutan
  mutasi?: MutationRecord;
  sttb?: GraduationSTTB;
  raport: SemesterReport[];

  // Meta & Audit
  createdAt: string;
  updatedAt: string;
  dibuatOleh?: string;
  terakhirDiubahOleh?: string;
}

export interface SchoolProfile {
  namaSekolah: string;
  npsn: string;
  nss: string;
  jenjang: string;
  bentukPendidikan?: string;
  statusSekolah: 'Negeri' | 'Swasta' | string;
  akreditasi: string;
  alamatJalan: string;
  alamatSekolah?: string;
  desaKelurahan: string;
  desa?: string;
  kecamatan: string;
  kabupatenKota: string;
  provinsi: string;
  kodePos: string;
  telepon: string;
  email: string;
  website: string;
  namaKepalaSekolah: string;
  nipKepalaSekolah: string;
  namaOperator: string;
  nipOperator: string;
  kurikulum: string;
  logoUrl?: string; // Logo utama sekolah
  logoKiriUrl?: string; // Logo sebelah kiri kop surat (Lambang Pemda / Daerah / Sekolah Kiri)
  logoKananUrl?: string; // Logo sebelah kanan kop surat (Tut Wuri Handayani / Logo Kanan)
  tutWuriLogoUrl?: string;
  stempelUrl?: string;
  tahunPelajaranAktif?: string; // e.g. "2026/2027"
  semesterAktif?: 'Ganjil' | 'Genap' | '1' | '2';
  daftarTahunPelajaran?: string[];
  daftarKelas?: string[];
  rombelLocks?: Record<string, RombelLockInfo>;
  waliKelasMap?: Record<string, { nama: string; nip?: string }>;
}

export interface RombelLockInfo {
  isLocked: boolean;
  lockedAt: string;
  lockedBy: string;
  totalStudents: number;
  catatan?: string;
}

export interface ClassRankItem {
  id: string;
  noInduk: string;
  nisn: string;
  namaLengkap: string;
  jenisKelamin: Gender;
  kelasSekarang: string;
  peringkat: number;
  nilaiRataRata: number;
  totalNilai: number;
  predikat: string;
  catatanWaliKelas?: string;
  jumlahHadir?: { sakit: number; izin: number; alpa: number };
}

export interface ClassDistributionStats {
  kelas: string;
  tingkat: number; // 1 - 6
  waliKelas: string;
  nipWaliKelas?: string;
  jumlahLaki: number;
  jumlahPerempuan: number;
  totalSiswa: number;
  rataRataKelas: number;
  tingkatKelulusanKkm: number;
  topRankings: ClassRankItem[];
  allStudentsRanked: ClassRankItem[];
}

export interface VisitorStat {
  date: string;
  pageViews: number;
  uniqueVisitors: number;
  device: string;
  ipMasked: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  role: UserRole;
  action: 'TAMBAH' | 'EDIT' | 'HAPUS' | 'CETAK' | 'MUTASI' | 'IJAZAH' | 'IMPORT' | 'EXPORT' | 'PENGATURAN';
  description: string;
  targetId?: string;
}

export type TeacherDutyCategory = 'kepala_sekolah' | 'wali_kelas' | 'guru_mapel' | 'tenaga_kependidikan';

export type TeacherActiveStatus = 'Aktif' | 'Pensiun' | 'Cuti' | 'Mutasi Keluar' | 'Nonaktif';

export interface AdminUser {
  id: string;
  nama: string;
  username?: string;
  password?: string;
  nip?: string;
  nuptk?: string;
  nik?: string;
  jenisKelamin?: 'L' | 'P';
  tempatLahir?: string;
  tanggalLahir?: string;
  namaIbuKandung?: string;
  statusPernikahan?: string;
  agama?: string;
  noHp?: string;
  alamat?: string;
  statusKepegawaian?: 'PNS' | 'PPPK' | 'Guru Honorer' | 'GTY' | 'Tenaga Honorer' | string;
  pangkatGolongan?: string;
  pendidikanTerakhir?: string;
  jurusanPendidikan?: string;
  ptAsal?: string;
  tmtPengangkatan?: string;
  tmtTugas?: string;
  fotoUrl?: string;
  email: string;
  role: UserRole;
  jabatan: string;
  kategoriTugas?: TeacherDutyCategory;
  tingkatKelas?: string;
  mataPelajaran?: string;
  tugasTendik?: string;
  status: TeacherActiveStatus | 'Aktif' | 'Nonaktif' | string;
  // Data Riwayat Keaktifan Guru
  tanggalPensiun?: string;
  noSkPensiun?: string;
  pejabatSkPensiun?: string;
  jenisCuti?: string;
  tglMulaiCuti?: string;
  tglSelesaiCuti?: string;
  noIzinCuti?: string;
  sekolahTujuanMutasi?: string;
  tglSkMutasi?: string;
  noSkMutasi?: string;
  keteranganKeaktifan?: string;
  terakhirLogin: string;
  avatarColor: string;
}

export interface RolePermissions {
  // Data Siswa
  tambahSiswa: boolean;
  editSiswa: boolean;
  hapusSiswa: boolean;
  lihatDetailLengkap: boolean;
  
  // Akademik & Raport
  inputRaport: boolean;
  editRaport: boolean;
  kunciNilaiSemester: boolean;
  
  // Mutasi & STTB
  inputMutasi: boolean;
  inputSTTB: boolean;
  cetakSuratMutasi: boolean;
  
  // Dokumen & Cetak
  cetakBukuInduk: boolean;
  cetakKartuPelajar: boolean;
  eksporExcelCSV: boolean;
  
  // Pengaturan & Master
  ubahProfilSekolah: boolean;
  backupDatabase: boolean;
  restoreDatabase: boolean;
  kelolaHakAkses: boolean;
}

export interface SecuritySettings {
  pinAdmin: string;
  requirePinForDelete: boolean;
  requirePinForReset: boolean;
  sembunyikanNikUmum: boolean;
  kunciSemesterAktif: boolean;
  autoLogoutMinutes: number;
}

