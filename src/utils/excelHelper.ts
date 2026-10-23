import * as XLSX from 'xlsx';
import { Student, Gender, Religion, StudentStatus, SchoolProfile, MutationRecord } from '../types';

export interface ParsedRowResult {
  rowNumber: number;
  data: Partial<Student>;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ImportParseSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  results: ParsedRowResult[];
}

/**
 * 69-Column Standard Template Headers matching Dapodik Kemdikbud Schema (including Kabupaten & Provinsi)
 */
export const TEMPLATE_HEADER_ROW_1 = [
  'No',
  'Nama',
  'NIPD',
  'JK',
  'NISN',
  'Tempat Lahir',
  'Tanggal Lahir',
  'Rombel Saat Ini',
  'NIK',
  'usia',
  'Agama',
  'Alamat',
  'RT',
  'RW',
  'Dusun',
  'Kelurahan',
  'Kecamatan',
  'Kabupaten',
  'Provinsi',
  'Kode Pos',
  'Jenis Tinggal',
  'Alat Transportasi',
  'Telepon',
  'HP',
  'E-Mail',
  'SKHUN',
  'Penerima KPS',
  'No. KPS',
  // Data Ayah (6 cols)
  'Data Ayah', '', '', '', '', '',
  // Data Ibu (6 cols)
  'Data Ibu', '', '', '', '', '',
  // Data Wali (6 cols)
  'Data Wali', '', '', '', '', '',
  'No Peserta Ujian Nasional',
  'No Seri Ijazah',
  'Penerima KIP',
  'Nomor KIP',
  'Nama di KIP',
  'Nomor KKS',
  'No Registrasi Akta Lahir',
  'Bank',
  'Nomor Rekening Bank',
  'Rekening Atas Nama',
  'Layak PIP (usulan dari sekolah)',
  'Alasan Layak PIP',
  'Kebutuhan Khusus',
  'Sekolah Asal',
  'Anak ke-berapa',
  'Lintang',
  'Bujur',
  'No KK',
  'Berat Badan',
  'Tinggi Badan',
  'Lingkar Kepala',
  'Jml. Saudara Kandung',
  'Jarak Rumah ke Sekolah (KM)',
];

export const TEMPLATE_HEADER_ROW_2 = [
  '', '', '', '', '', '', '', '', '', '', // 0-9
  '', '', '', '', '', '', '', '', '', '', // 10-19
  '', '', '', '', '', '', '', '',         // 20-27 (28 single columns before Ayah)
  // Data Ayah sub-columns (28-33)
  'Nama', 'Tahun Lahir', 'Jenjang Pendidikan', 'Pekerjaan', 'Penghasilan', 'NIK',
  // Data Ibu sub-columns (34-39)
  'Nama', 'Tahun Lahir', 'Jenjang Pendidikan', 'Pekerjaan', 'Penghasilan', 'NIK',
  // Data Wali sub-columns (40-45)
  'Nama', 'Tahun Lahir', 'Jenjang Pendidikan', 'Pekerjaan', 'Penghasilan', 'NIK',
  // 46-68 (23 columns)
  '', '', '', '', '', '', '',
  '', '', '', '', '', '',
  '', '', '', '', '', '', '', '', '', '',
];

// Sample demo rows
export const SAMPLE_TEMPLATE_ROW_1 = [
  1,
  'MUHAMMAD RIZKY PRATAMA',
  '2024001',
  'L',
  '0081234567',
  'Jakarta',
  '2011-05-12',
  'Kelas 1',
  '3201015205110001',
  13,
  'Islam',
  'Jl. Merdeka No. 45',
  '03',
  '02',
  'Dusun Krajan',
  'Cisalak Pasar',
  'Cimanggis',
  'Kota Depok',
  'Jawa Barat',
  '16452',
  'Bersama Orang Tua',
  'Sepeda Motor',
  '021-8765432',
  '081234567890',
  'rizky.pratama@gmail.com',
  '123456789',
  'Tidak',
  '',
  // Data Ayah (28-33)
  'Budi Santoso',
  '1978',
  'S1',
  'Karyawan Swasta',
  'Rp 4.000.000 - Rp 6.000.000',
  '3201011504780002',
  // Data Ibu (34-39)
  'Siti Rahmawati',
  '1980',
  'S1',
  'Guru / Wiraswasta',
  'Rp 2.000.000 - Rp 3.500.000',
  '3201014808800003',
  // Data Wali (40-45)
  '',
  '',
  '',
  '',
  '',
  '',
  // Modul Ujian, KIP & Lainnya (46-68)
  '01-001-023-4',
  'DN-01/D-SD/13/0012345',
  'Tidak',
  '',
  '',
  '',
  '1234/DIS/2011',
  'BRI',
  '012345678910',
  'MUHAMMAD RIZKY PRATAMA',
  'Tidak',
  '',
  'Tidak Ada',
  'SD Negeri 01 Cimanggis',
  1,
  '-6.3685',
  '106.8456',
  '3201012508100002',
  43,
  152,
  54,
  2,
  1.5,
];

export const SAMPLE_TEMPLATE_ROW_2 = [
  2,
  'AULIA NUR ANGGRAENI',
  '2024002',
  'P',
  '0087654321',
  'Bandung',
  '2011-09-25',
  'Kelas 2',
  '3201016509110004',
  13,
  'Islam',
  'Perumahan Griya Asri Blok C2 No. 12',
  '05',
  '08',
  '',
  'Mekarsari',
  'Cimanggis',
  'Kota Depok',
  'Jawa Barat',
  '16452',
  'Bersama Orang Tua',
  'Angkutan Umum',
  '',
  '085712345678',
  'aulia.anggraeni@gmail.com',
  '987654321',
  'Tidak',
  '',
  // Data Ayah (28-33)
  'Drs. Hendra Kusuma',
  '1975',
  'S2',
  'PNS / ASN',
  'Rp 5.000.000 - Rp 8.000.000',
  '3201011203750005',
  // Data Ibu (34-39)
  'Dewi Kartika, S.Pd.',
  '1977',
  'S1',
  'Ibu Rumah Tangga',
  'Tidak Ada',
  '3201015507770006',
  // Data Wali (40-45)
  '',
  '',
  '',
  '',
  '',
  '',
  // Modul Ujian, KIP & Lainnya (46-68)
  '01-001-024-2',
  'DN-01/D-SD/13/0012346',
  'Ya',
  '123456',
  'AULIA NUR ANGGRAENI',
  'KKS-98765',
  '5678/DIS/2011',
  'BRI',
  '098765432100',
  'AULIA NUR ANGGRAENI',
  'Ya',
  'Pemegang KIP / KKS',
  'Tidak Ada',
  'SDIT Nurul Fikri',
  2,
  '-6.3712',
  '106.8521',
  '3201012508100005',
  39,
  148,
  53,
  1,
  2.0,
];

// Backwards-compatible sample object for preview or references
export const SAMPLE_TEMPLATE_ROWS = [
  {
    No: 1,
    Nama: 'MUHAMMAD RIZKY PRATAMA',
    NIPD: '2024001',
    JK: 'L',
    NISN: '0081234567',
    'Tempat Lahir': 'Jakarta',
    'Tanggal Lahir': '2011-05-12',
    'Rombel Saat Ini': 'Kelas 1',
    NIK: '3201015205110001',
    usia: 13,
    Agama: 'Islam',
    Alamat: 'Jl. Merdeka No. 45',
    RT: '03',
    RW: '02',
    Dusun: 'Dusun Krajan',
    Kelurahan: 'Cisalak Pasar',
    Kecamatan: 'Cimanggis',
    Kabupaten: 'Kota Depok',
    Provinsi: 'Jawa Barat',
    'Kode Pos': '16452',
    'Jenis Tinggal': 'Bersama Orang Tua',
    'Alat Transportasi': 'Sepeda Motor',
    Telepon: '021-8765432',
    HP: '081234567890',
    'E-Mail': 'rizky.pratama@gmail.com',
    SKHUN: '123456789',
    'Penerima KPS': 'Tidak',
    'No. KPS': '',
    'Data Ayah - Nama': 'Budi Santoso',
    'Data Ayah - Tahun Lahir': '1978',
    'Data Ayah - Jenjang Pendidikan': 'S1',
    'Data Ayah - Pekerjaan': 'Karyawan Swasta',
    'Data Ayah - Penghasilan': 'Rp 4.000.000 - Rp 6.000.000',
    'Data Ayah - NIK': '3201011504780002',
    'Data Ibu - Nama': 'Siti Rahmawati',
    'Data Ibu - Tahun Lahir': '1980',
    'Data Ibu - Jenjang Pendidikan': 'S1',
    'Data Ibu - Pekerjaan': 'Guru / Wiraswasta',
    'Data Ibu - Penghasilan': 'Rp 2.000.000 - Rp 3.500.000',
    'Data Ibu - NIK': '3201014808800003',
    'Data Wali - Nama': '',
    'Data Wali - Tahun Lahir': '',
    'Data Wali - Jenjang Pendidikan': '',
    'Data Wali - Pekerjaan': '',
    'Data Wali - Penghasilan': '',
    'Data Wali - NIK': '',
    'No Peserta Ujian Nasional': '01-001-023-4',
    'No Seri Ijazah': 'DN-01/D-SD/13/0012345',
    'Penerima KIP': 'Tidak',
    'Nomor KIP': '',
    'Nama di KIP': '',
    'Nomor KKS': '',
    'No Registrasi Akta Lahir': '1234/DIS/2011',
    Bank: 'BRI',
    'Nomor Rekening Bank': '012345678910',
    'Rekening Atas Nama': 'MUHAMMAD RIZKY PRATAMA',
    'Layak PIP (usulan dari sekolah)': 'Tidak',
    'Alasan Layak PIP': '',
    'Kebutuhan Khusus': 'Tidak Ada',
    'Sekolah Asal': 'SD Negeri 01 Cimanggis',
    'Anak ke-berapa': 1,
    Lintang: '-6.3685',
    Bujur: '106.8456',
    'No KK': '3201012508100002',
    'Berat Badan': 43,
    'Tinggi Badan': 152,
    'Lingkar Kepala': 54,
    'Jml. Saudara Kandung': 2,
    'Jarak Rumah ke Sekolah (KM)': 1.5,
  },
  {
    No: 2,
    Nama: 'AULIA NUR ANGGRAENI',
    NIPD: '2024002',
    JK: 'P',
    NISN: '0087654321',
    'Tempat Lahir': 'Bandung',
    'Tanggal Lahir': '2011-09-25',
    'Rombel Saat Ini': '7B',
    NIK: '3201016509110004',
    usia: 13,
    Agama: 'Islam',
    Alamat: 'Perumahan Griya Asri Blok C2 No. 12',
    RT: '05',
    RW: '08',
    Dusun: '',
    Kelurahan: 'Mekarsari',
    Kecamatan: 'Cimanggis',
    Kabupaten: 'Kota Depok',
    Provinsi: 'Jawa Barat',
    'Kode Pos': '16452',
    'Jenis Tinggal': 'Bersama Orang Tua',
    'Alat Transportasi': 'Angkutan Umum',
    Telepon: '',
    HP: '085712345678',
    'E-Mail': 'aulia.anggraeni@gmail.com',
    SKHUN: '987654321',
    'Penerima KPS': 'Tidak',
    'No. KPS': '',
    'Data Ayah - Nama': 'Drs. Hendra Kusuma',
    'Data Ayah - Tahun Lahir': '1975',
    'Data Ayah - Jenjang Pendidikan': 'S2',
    'Data Ayah - Pekerjaan': 'PNS / ASN',
    'Data Ayah - Penghasilan': 'Rp 5.000.000 - Rp 8.000.000',
    'Data Ayah - NIK': '3201011203750005',
    'Data Ibu - Nama': 'Dewi Kartika, S.Pd.',
    'Data Ibu - Tahun Lahir': '1977',
    'Data Ibu - Jenjang Pendidikan': 'S1',
    'Data Ibu - Pekerjaan': 'Ibu Rumah Tangga',
    'Data Ibu - Penghasilan': 'Tidak Ada',
    'Data Ibu - NIK': '3201015507770006',
    'Data Wali - Nama': '',
    'Data Wali - Tahun Lahir': '',
    'Data Wali - Jenjang Pendidikan': '',
    'Data Wali - Pekerjaan': '',
    'Data Wali - Penghasilan': '',
    'Data Wali - NIK': '',
    'No Peserta Ujian Nasional': '01-001-024-2',
    'No Seri Ijazah': 'DN-01/D-SD/13/0012346',
    'Penerima KIP': 'Ya',
    'Nomor KIP': '123456',
    'Nama di KIP': 'AULIA NUR ANGGRAENI',
    'Nomor KKS': 'KKS-98765',
    'No Registrasi Akta Lahir': '5678/DIS/2011',
    Bank: 'BRI',
    'Nomor Rekening Bank': '098765432100',
    'Rekening Atas Nama': 'AULIA NUR ANGGRAENI',
    'Layak PIP (usulan dari sekolah)': 'Ya',
    'Alasan Layak PIP': 'Pemegang KIP / KKS',
    'Kebutuhan Khusus': 'Tidak Ada',
    'Sekolah Asal': 'SDIT Nurul Fikri',
    'Anak ke-berapa': 2,
    Lintang: '-6.3712',
    Bujur: '106.8521',
    'No KK': '3201012508100005',
    'Berat Badan': 39,
    'Tinggi Badan': 148,
    'Lingkar Kepala': 53,
    'Jml. Saudara Kandung': 1,
    'Jarak Rumah ke Sekolah (KM)': 2.0,
  },
];

// Instructions Sheet Data
export const TEMPLATE_INSTRUCTIONS = [
  { NO: 1, KOLOM: 'Nama', KETERANGAN: 'Nama lengkap peserta didik sesuai Akta Lahir / Ijazah sebelumnya. WAJIB diisi.', CONTOH: 'MUHAMMAD RIZKY PRATAMA' },
  { NO: 2, KOLOM: 'NIPD', KETERANGAN: 'Nomor Induk Peserta Didik (NIS lokal sekolah). Wajib & unik.', CONTOH: '2024001' },
  { NO: 3, KOLOM: 'JK', KETERANGAN: 'Jenis Kelamin: Huruf "L" (Laki-laki) atau "P" (Perempuan). Wajib diisi.', CONTOH: 'L atau P' },
  { NO: 4, KOLOM: 'NISN', KETERANGAN: 'Nomor Induk Siswa Nasional (10 digit angka resmi Kemdikbud).', CONTOH: '0081234567' },
  { NO: 5, KOLOM: 'Tempat Lahir', KETERANGAN: 'Kabupaten/Kota tempat siswa dilahirkan.', CONTOH: 'Jakarta' },
  { NO: 6, KOLOM: 'Tanggal Lahir', KETERANGAN: 'Format tanggal standar: YYYY-MM-DD (contoh: 2011-05-12) atau DD/MM/YYYY.', CONTOH: '2011-05-12' },
  { NO: 7, KOLOM: 'Rombel Saat Ini', KETERANGAN: 'Nama rombongan belajar / kelas saat ini.', CONTOH: 'Kelas 1 / 1A / 2' },
  { NO: 8, KOLOM: 'NIK', KETERANGAN: 'Nomor Induk Kependudukan siswa (16 digit dari KK/Akta).', CONTOH: '3201015205110001' },
  { NO: 9, KOLOM: 'usia', KETERANGAN: 'Usia peserta didik saat ini (angka tahun).', CONTOH: '13' },
  { NO: 10, KOLOM: 'Agama', KETERANGAN: 'Pilihan: Islam, Kristen Protestan, Katolik, Hindu, Buddha, Konghucu, Lainnya.', CONTOH: 'Islam' },
  { NO: 11, KOLOM: 'Alamat', KETERANGAN: 'Nama jalan, perumahan, atau alamat domisili tempat tinggal siswa.', CONTOH: 'Jl. Merdeka No. 45' },
  { NO: 12, KOLOM: 'RT / RW', KETERANGAN: 'Nomor RT dan Nomor RW domisili siswa.', CONTOH: '03 / 02' },
  { NO: 13, KOLOM: 'Dusun / Kelurahan / Kecamatan', KETERANGAN: 'Wilayah administrasi domisili tempat tinggal siswa.', CONTOH: 'Cisalak Pasar, Cimanggis' },
  { NO: 14, KOLOM: 'Kabupaten & Provinsi', KETERANGAN: 'Nama Kabupaten/Kota dan Provinsi domisili siswa.', CONTOH: 'Kota Depok, Jawa Barat' },
  { NO: 15, KOLOM: 'Kode Pos', KETERANGAN: '5 digit kode pos domisili.', CONTOH: '16452' },
  { NO: 16, KOLOM: 'Jenis Tinggal', KETERANGAN: 'Contoh: Bersama Orang Tua, Wali, Kos, Asrama, Panti Asuhan.', CONTOH: 'Bersama Orang Tua' },
  { NO: 17, KOLOM: 'Alat Transportasi', KETERANGAN: 'Transportasi ke sekolah: Jalan Kaki, Sepeda Motor, Angkutan Umum, Jemputan, dll.', CONTOH: 'Sepeda Motor' },
  { NO: 18, KOLOM: 'Telepon / HP / E-Mail', KETERANGAN: 'Kontak komunikasi aktif peserta didik / orang tua.', CONTOH: '081234567890' },
  { NO: 19, KOLOM: 'SKHUN', KETERANGAN: 'Surat Keterangan Hasil Ujian Nasional jenjang sebelumnya.', CONTOH: '123456789' },
  { NO: 20, KOLOM: 'Penerima KPS / No. KPS', KETERANGAN: 'Status kartu perlindungan sosial: Ya / Tidak dan Nomor KPS jika ada.', CONTOH: 'Tidak' },
  { NO: 21, KOLOM: 'Data Ayah (6 Kolom)', KETERANGAN: 'Meliputi: Nama, Tahun Lahir, Jenjang Pendidikan, Pekerjaan, Penghasilan, NIK Ayah.', CONTOH: 'Budi Santoso, 1978, S1, Karyawan Swasta' },
  { NO: 22, KOLOM: 'Data Ibu (6 Kolom)', KETERANGAN: 'Meliputi: Nama, Tahun Lahir, Jenjang Pendidikan, Pekerjaan, Penghasilan, NIK Ibu.', CONTOH: 'Siti Rahmawati, 1980, S1, Ibu Rumah Tangga' },
  { NO: 23, KOLOM: 'Data Wali (6 Kolom)', KETERANGAN: 'Diisi jika siswa tinggal bersama wali (Nama, Tahun Lahir, Pendidikan, Pekerjaan, Penghasilan, NIK).', CONTOH: 'Opsional' },
  { NO: 24, KOLOM: 'No Peserta Ujian Nasional / No Seri Ijazah', KETERANGAN: 'Nomor peserta ujian & nomor seri ijazah jenjang sebelumnya.', CONTOH: 'DN-01/D-SD/13/0012345' },
  { NO: 25, KOLOM: 'KIP / PIP / KKS', KETERANGAN: 'Data bantuan pendidikan Kemdikbud: Penerima KIP, Nomor KIP, Nama KIP, Nomor KKS, Layak PIP.', CONTOH: 'Ya / 123456' },
  { NO: 26, KOLOM: 'Rekening Bank Siswa', KETERANGAN: 'Nama Bank (contoh: BRI, BNI), Nomor Rekening, dan Rekening Atas Nama siswa.', CONTOH: 'BRI / 012345678910' },
  { NO: 27, KOLOM: 'Sekolah Asal', KETERANGAN: 'Nama sekolah asal (TK/PAUD/SD/MI) sebelum masuk ke sekolah ini.', CONTOH: 'SD Negeri 01 Cimanggis' },
  { NO: 28, KOLOM: 'Fisik Siswa', KETERANGAN: 'Berat Badan (kg), Tinggi Badan (cm), Lingkar Kepala (cm).', CONTOH: 'BB: 43 kg, TB: 152 cm, LK: 54 cm' },
  { NO: 29, KOLOM: 'Jarak ke Sekolah (KM)', KETERANGAN: 'Perkiraan jarak dari rumah ke sekolah dalam satuan kilometer.', CONTOH: '1.5' },
];

/**
 * Generate and download formatted Excel Template (.xlsx) matching exact column order
 */
export const downloadExcelTemplate = (schoolName: string = 'Sekolah') => {
  const wb = XLSX.utils.book_new();

  // Combine rows: Header Row 1, Header Row 2, Sample Row 1, Sample Row 2
  const aoaData = [
    TEMPLATE_HEADER_ROW_1,
    TEMPLATE_HEADER_ROW_2,
    SAMPLE_TEMPLATE_ROW_1,
    SAMPLE_TEMPLATE_ROW_2,
  ];

  const wsData = XLSX.utils.aoa_to_sheet(aoaData);

  // Set Merges:
  // - Columns 0-27: vertically merge row 0 and row 1 (28 columns)
  // - Columns 28-33: horizontally merge row 0 for 'Data Ayah' (6 columns)
  // - Columns 34-39: horizontally merge row 0 for 'Data Ibu' (6 columns)
  // - Columns 40-45: horizontally merge row 0 for 'Data Wali' (6 columns)
  // - Columns 46-68: vertically merge row 0 and row 1 (23 columns)
  const merges: XLSX.Range[] = [
    ...Array.from({ length: 28 }, (_, i) => ({ s: { r: 0, c: i }, e: { r: 1, c: i } })),
    { s: { r: 0, c: 28 }, e: { r: 0, c: 33 } }, // Data Ayah
    { s: { r: 0, c: 34 }, e: { r: 0, c: 39 } }, // Data Ibu
    { s: { r: 0, c: 40 }, e: { r: 0, c: 45 } }, // Data Wali
    ...Array.from({ length: 23 }, (_, i) => ({ s: { r: 0, c: 46 + i }, e: { r: 1, c: 46 + i } })),
  ];
  wsData['!merges'] = merges;

  // Set column widths matching 69 columns
  const colWidths = [
    { wch: 6 },  // 1: No
    { wch: 28 }, // 2: Nama
    { wch: 14 }, // 3: NIPD
    { wch: 6 },  // 4: JK
    { wch: 14 }, // 5: NISN
    { wch: 18 }, // 6: Tempat Lahir
    { wch: 14 }, // 7: Tanggal Lahir
    { wch: 16 }, // 8: Rombel Saat Ini
    { wch: 18 }, // 9: NIK
    { wch: 8 },  // 10: usia
    { wch: 14 }, // 11: Agama
    { wch: 32 }, // 12: Alamat
    { wch: 6 },  // 13: RT
    { wch: 6 },  // 14: RW
    { wch: 16 }, // 15: Dusun
    { wch: 18 }, // 16: Kelurahan
    { wch: 18 }, // 17: Kecamatan
    { wch: 18 }, // 18: Kabupaten
    { wch: 18 }, // 19: Provinsi
    { wch: 10 }, // 20: Kode Pos
    { wch: 18 }, // 21: Jenis Tinggal
    { wch: 18 }, // 22: Alat Transportasi
    { wch: 14 }, // 23: Telepon
    { wch: 16 }, // 24: HP
    { wch: 24 }, // 25: E-Mail
    { wch: 14 }, // 26: SKHUN
    { wch: 14 }, // 27: Penerima KPS
    { wch: 14 }, // 28: No. KPS
    // Data Ayah
    { wch: 22 }, // 29: Nama
    { wch: 12 }, // 30: Tahun Lahir
    { wch: 18 }, // 31: Jenjang Pendidikan
    { wch: 18 }, // 32: Pekerjaan
    { wch: 22 }, // 33: Penghasilan
    { wch: 18 }, // 34: NIK
    // Data Ibu
    { wch: 22 }, // 35: Nama
    { wch: 12 }, // 36: Tahun Lahir
    { wch: 18 }, // 37: Jenjang Pendidikan
    { wch: 18 }, // 38: Pekerjaan
    { wch: 22 }, // 39: Penghasilan
    { wch: 18 }, // 40: NIK
    // Data Wali
    { wch: 22 }, // 41: Nama
    { wch: 12 }, // 42: Tahun Lahir
    { wch: 18 }, // 43: Jenjang Pendidikan
    { wch: 18 }, // 44: Pekerjaan
    { wch: 22 }, // 45: Penghasilan
    { wch: 18 }, // 46: NIK
    // Modul Ujian, KIP & Lainnya
    { wch: 24 }, // 47: No Peserta Ujian Nasional
    { wch: 24 }, // 48: No Seri Ijazah
    { wch: 14 }, // 49: Penerima KIP
    { wch: 16 }, // 50: Nomor KIP
    { wch: 24 }, // 51: Nama di KIP
    { wch: 16 }, // 52: Nomor KKS
    { wch: 24 }, // 53: No Registrasi Akta Lahir
    { wch: 12 }, // 54: Bank
    { wch: 20 }, // 55: Nomor Rekening Bank
    { wch: 24 }, // 56: Rekening Atas Nama
    { wch: 26 }, // 57: Layak PIP (usulan dari sekolah)
    { wch: 22 }, // 58: Alasan Layak PIP
    { wch: 18 }, // 59: Kebutuhan Khusus
    { wch: 24 }, // 60: Sekolah Asal
    { wch: 14 }, // 61: Anak ke-berapa
    { wch: 14 }, // 62: Lintang
    { wch: 14 }, // 63: Bujur
    { wch: 18 }, // 64: No KK
    { wch: 12 }, // 65: Berat Badan
    { wch: 12 }, // 66: Tinggi Badan
    { wch: 14 }, // 67: Lingkar Kepala
    { wch: 20 }, // 68: Jml. Saudara Kandung
    { wch: 24 }, // 69: Jarak Rumah ke Sekolah (KM)
  ];
  wsData['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, wsData, 'DATA_SISWA');

  // Sheet 2: PETUNJUK_PENGISIAN
  const wsGuide = XLSX.utils.json_to_sheet(TEMPLATE_INSTRUCTIONS);
  wsGuide['!cols'] = [{ wch: 6 }, { wch: 26 }, { wch: 64 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsGuide, 'PETUNJUK_PENGISIAN');

  // File Name
  const cleanSchool = schoolName.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `TEMPLATE_IMPORT_BUKU_INDUK_${cleanSchool}.xlsx`;

  // Trigger download
  XLSX.writeFile(wb, fileName);
};

/**
 * Export students data into a neat, professionally styled Excel spreadsheet (.xlsx)
 * matching 100% with the official 69-column Dapodik Kemdikbud template.
 */
export const exportStudentsToExcel = (
  students: Student[] = [],
  schoolName: string = 'Sekolah',
  options?: {
    filteredClass?: string;
  }
) => {
  try {
    const list = Array.isArray(students) ? students : [];
    const wb = XLSX.utils.book_new();

    const studentRows = list.map((s, index) => {
    // Calculate approximate age if not explicitly set
    let ageVal: number | string = s.usia || '';
    if (!ageVal && s.tanggalLahir) {
      const birth = new Date(s.tanggalLahir);
      if (!isNaN(birth.getTime())) {
        const diff = Date.now() - birth.getTime();
        ageVal = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
      }
    }

    return [
      index + 1, // 1: No
      s.namaLengkap || '', // 2: Nama
      s.noInduk || '', // 3: NIPD (NIS)
      s.jenisKelamin === 'P' ? 'P' : 'L', // 4: JK
      s.nisn || '', // 5: NISN
      s.tempatLahir || '', // 6: Tempat Lahir
      s.tanggalLahir || '', // 7: Tanggal Lahir (YYYY-MM-DD)
      s.kelasSekarang || 'Kelas 1', // 8: Rombel Saat Ini
      s.nik || '', // 9: NIK
      ageVal !== '' ? Number(ageVal) || ageVal : '', // 10: usia
      s.agama || 'Islam', // 11: Agama
      s.alamat || '', // 12: Alamat
      s.rt || '', // 13: RT
      s.rw || '', // 14: RW
      s.dusun || '', // 15: Dusun
      s.kelurahanDesa || '', // 16: Kelurahan
      s.kecamatan || '', // 17: Kecamatan
      s.kabupatenKota || '', // 18: Kabupaten
      s.provinsi || '', // 19: Provinsi
      s.kodePos || '', // 20: Kode Pos
      s.tinggalDengan || 'Bersama Orang Tua', // 21: Jenis Tinggal
      s.transportasi || 'Jalan Kaki', // 22: Alat Transportasi
      s.ayah?.noHp || s.ibu?.noHp || '', // 23: Telepon
      s.noHpSiswa || s.ayah?.noHp || s.ibu?.noHp || '', // 24: HP
      s.emailSiswa || '', // 25: E-Mail
      s.skhun || '', // 26: SKHUN
      s.penerimaKps || 'Tidak', // 27: Penerima KPS
      s.noKps || '', // 28: No. KPS
      // Data Ayah (29-34)
      s.ayah?.nama || '',
      s.ayah?.tahunLahir ? String(s.ayah.tahunLahir) : '',
      s.ayah?.pendidikan || '',
      s.ayah?.pekerjaan || '',
      s.ayah?.penghasilanBulanan || '',
      s.ayah?.nik || '',
      // Data Ibu (35-40)
      s.ibu?.nama || '',
      s.ibu?.tahunLahir ? String(s.ibu.tahunLahir) : '',
      s.ibu?.pendidikan || '',
      s.ibu?.pekerjaan || '',
      s.ibu?.penghasilanBulanan || '',
      s.ibu?.nik || '',
      // Data Wali (41-46)
      s.wali?.nama || '',
      s.wali?.tahunLahir ? String(s.wali.tahunLahir) : '',
      s.wali?.pendidikan || '',
      s.wali?.pekerjaan || '',
      s.wali?.penghasilanBulanan || '',
      s.wali?.nik || '',
      // Modul Ujian, KIP & Lainnya (47-69)
      s.noPesertaUN || '', // 47
      s.noSeriIjazah || s.sttb?.noIjazah || '', // 48
      s.penerimaKip || 'Tidak', // 49
      s.nomorKip || '', // 50
      s.namaDiKip || '', // 51
      s.nomorKks || '', // 52
      s.noRegistrasiAktaLahir || '', // 53
      s.bank || '', // 54
      s.nomorRekeningBank || '', // 55
      s.rekeningAtasNama || '', // 56
      s.layakPip || 'Tidak', // 57
      s.alasanLayakPip || '', // 58
      s.kebutuhanKhusus || 'Tidak Ada', // 59
      s.sekolahAsalTK || '', // 60
      s.anakKe !== undefined && s.anakKe !== null ? Number(s.anakKe) : 1, // 61
      s.lintang || '', // 62
      s.bujur || '', // 63
      s.noKk || '', // 64
      s.kesehatan?.beratBadanKg !== undefined && s.kesehatan?.beratBadanKg !== null ? Number(s.kesehatan.beratBadanKg) : '', // 65
      s.kesehatan?.tinggiBadanCm !== undefined && s.kesehatan?.tinggiBadanCm !== null ? Number(s.kesehatan.tinggiBadanCm) : '', // 66
      s.lingkarKepala !== undefined && s.lingkarKepala !== null ? Number(s.lingkarKepala) : '', // 67
      s.jumlahSaudaraKandung !== undefined && s.jumlahSaudaraKandung !== null ? Number(s.jumlahSaudaraKandung) : 0, // 68
      s.jarakKeSekolahKm !== undefined && s.jarakKeSekolahKm !== null ? Number(s.jarakKeSekolahKm) : 1, // 69
    ];
  });

  const aoaData = [
    TEMPLATE_HEADER_ROW_1,
    TEMPLATE_HEADER_ROW_2,
    ...studentRows,
  ];

  const wsData = XLSX.utils.aoa_to_sheet(aoaData);

  // Set Merges identically to the template:
  const merges: XLSX.Range[] = [
    ...Array.from({ length: 28 }, (_, i) => ({ s: { r: 0, c: i }, e: { r: 1, c: i } })),
    { s: { r: 0, c: 28 }, e: { r: 0, c: 33 } }, // Data Ayah
    { s: { r: 0, c: 34 }, e: { r: 0, c: 39 } }, // Data Ibu
    { s: { r: 0, c: 40 }, e: { r: 0, c: 45 } }, // Data Wali
    ...Array.from({ length: 23 }, (_, i) => ({ s: { r: 0, c: 46 + i }, e: { r: 1, c: 46 + i } })),
  ];
  wsData['!merges'] = merges;

  // Set column widths matching 69 columns
  const colWidths = [
    { wch: 6 },  // 1: No
    { wch: 28 }, // 2: Nama
    { wch: 14 }, // 3: NIPD
    { wch: 6 },  // 4: JK
    { wch: 14 }, // 5: NISN
    { wch: 18 }, // 6: Tempat Lahir
    { wch: 14 }, // 7: Tanggal Lahir
    { wch: 16 }, // 8: Rombel Saat Ini
    { wch: 18 }, // 9: NIK
    { wch: 8 },  // 10: usia
    { wch: 14 }, // 11: Agama
    { wch: 32 }, // 12: Alamat
    { wch: 6 },  // 13: RT
    { wch: 6 },  // 14: RW
    { wch: 16 }, // 15: Dusun
    { wch: 18 }, // 16: Kelurahan
    { wch: 18 }, // 17: Kecamatan
    { wch: 18 }, // 18: Kabupaten
    { wch: 18 }, // 19: Provinsi
    { wch: 10 }, // 20: Kode Pos
    { wch: 18 }, // 21: Jenis Tinggal
    { wch: 18 }, // 22: Alat Transportasi
    { wch: 14 }, // 23: Telepon
    { wch: 16 }, // 24: HP
    { wch: 24 }, // 25: E-Mail
    { wch: 14 }, // 26: SKHUN
    { wch: 14 }, // 27: Penerima KPS
    { wch: 14 }, // 28: No. KPS
    // Data Ayah
    { wch: 22 }, // 29: Nama
    { wch: 12 }, // 30: Tahun Lahir
    { wch: 18 }, // 31: Jenjang Pendidikan
    { wch: 18 }, // 32: Pekerjaan
    { wch: 22 }, // 33: Penghasilan
    { wch: 18 }, // 34: NIK
    // Data Ibu
    { wch: 22 }, // 35: Nama
    { wch: 12 }, // 36: Tahun Lahir
    { wch: 18 }, // 37: Jenjang Pendidikan
    { wch: 18 }, // 38: Pekerjaan
    { wch: 22 }, // 39: Penghasilan
    { wch: 18 }, // 40: NIK
    // Data Wali
    { wch: 22 }, // 41: Nama
    { wch: 12 }, // 42: Tahun Lahir
    { wch: 18 }, // 43: Jenjang Pendidikan
    { wch: 18 }, // 44: Pekerjaan
    { wch: 22 }, // 45: Penghasilan
    { wch: 18 }, // 46: NIK
    // Modul Ujian, KIP & Lainnya
    { wch: 24 }, // 47: No Peserta Ujian Nasional
    { wch: 24 }, // 48: No Seri Ijazah
    { wch: 14 }, // 49: Penerima KIP
    { wch: 16 }, // 50: Nomor KIP
    { wch: 24 }, // 51: Nama di KIP
    { wch: 16 }, // 52: Nomor KKS
    { wch: 24 }, // 53: No Registrasi Akta Lahir
    { wch: 12 }, // 54: Bank
    { wch: 20 }, // 55: Nomor Rekening Bank
    { wch: 24 }, // 56: Rekening Atas Nama
    { wch: 26 }, // 57: Layak PIP (usulan dari sekolah)
    { wch: 22 }, // 58: Alasan Layak PIP
    { wch: 18 }, // 59: Kebutuhan Khusus
    { wch: 24 }, // 60: Sekolah Asal
    { wch: 14 }, // 61: Anak ke-berapa
    { wch: 14 }, // 62: Lintang
    { wch: 14 }, // 63: Bujur
    { wch: 18 }, // 64: No KK
    { wch: 12 }, // 65: Berat Badan
    { wch: 12 }, // 66: Tinggi Badan
    { wch: 14 }, // 67: Lingkar Kepala
    { wch: 20 }, // 68: Jml. Saudara Kandung
    { wch: 24 }, // 69: Jarak Rumah ke Sekolah (KM)
  ];
  wsData['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, wsData, 'DATA_SISWA');

  // Sheet 2: PETUNJUK_PENGISIAN
  const wsGuide = XLSX.utils.json_to_sheet(TEMPLATE_INSTRUCTIONS);
  wsGuide['!cols'] = [{ wch: 6 }, { wch: 26 }, { wch: 64 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsGuide, 'PETUNJUK_PENGISIAN');

  // File Name
  const cleanSchool = schoolName.replace(/[^a-zA-Z0-9]/g, '_');
  const classSuffix = options?.filteredClass && options.filteredClass !== 'Semua' 
    ? `_${options.filteredClass.replace(/[^a-zA-Z0-9]/g, '_')}` 
    : '';
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `DATA_SISWA_BUKU_INDUK_${cleanSchool}${classSuffix}_${dateStr}.xlsx`;

  // Trigger download
  XLSX.writeFile(wb, fileName);
  } catch (err) {
    console.error('Gagal mengekspor berkas Excel siswa:', err);
  }
};

/**
 * Format string into standard date YYYY-MM-DD
 */
function normalizeDate(val: any): string {
  if (!val) return '2011-01-01';
  
  if (typeof val === 'number') {
    // Excel date serial number
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    return date.toISOString().split('T')[0];
  }

  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  return str;
}

/**
 * Standardize religion string
 */
function normalizeReligion(val: any): Religion {
  if (!val) return 'Islam';
  const str = String(val).trim().toLowerCase();
  if (str.includes('kristen') || str.includes('protestan')) return 'Kristen Protestan';
  if (str.includes('katolik')) return 'Katolik';
  if (str.includes('hindu')) return 'Hindu';
  if (str.includes('buddha') || str.includes('budha')) return 'Buddha';
  if (str.includes('konghucu') || str.includes('khonghucu')) return 'Konghucu';
  if (str.includes('lain')) return 'Lainnya';
  return 'Islam';
}

/**
 * Standardize gender string (L/P)
 */
function normalizeGender(val: any): Gender {
  if (!val) return 'L';
  const str = String(val).trim().toUpperCase();
  if (str.startsWith('P') || str.includes('PEREMPUAN') || str.includes('WANITA')) {
    return 'P';
  }
  return 'L';
}

/**
 * Standardize status string
 */
function normalizeStatus(val: any): StudentStatus {
  if (!val) return 'Aktif';
  const str = String(val).trim().toLowerCase();
  if (str.includes('lulus')) return 'Lulus';
  if (str.includes('mutasi') || str.includes('pindah')) return 'Mutasi Keluar';
  if (str.includes('drop') || str.includes('keluar')) return 'Drop Out';
  if (str.includes('meninggal')) return 'Meninggal';
  return 'Aktif';
}

/**
 * Fuzzy getter for row object (handles case variations, spaces, underscores, dots)
 */
function getCol(row: any, ...keys: string[]): any {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
      return row[k];
    }
  }

  // Case-insensitive lookup
  const rowKeys = Object.keys(row);
  for (const targetKey of keys) {
    const cleanedTarget = targetKey.toLowerCase().replace(/[\s_\-\.\/\(\)]/g, '');
    for (const rk of rowKeys) {
      const cleanedRk = rk.toLowerCase().replace(/[\s_\-\.\/\(\)]/g, '');
      if (cleanedRk === cleanedTarget) {
        if (row[rk] !== undefined && row[rk] !== null && String(row[rk]).trim() !== '') {
          return row[rk];
        }
      }
    }
  }

  return undefined;
}

/**
 * Parse an Excel or CSV file buffer into structured student records
 * Supports both:
 * 1. 2-Row Header templates (Dapodik 67-column layout with merged group headers)
 * 2. 1-Row Header spreadsheets / CSVs
 */
export async function parseExcelOrCsvFile(file: File): Promise<ImportParseSummary> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        // Find primary sheet
        const sheetName = workbook.SheetNames.find(
          (s) => !s.toLowerCase().includes('petunjuk') && !s.toLowerCase().includes('guide') && !s.toLowerCase().includes('instruksi')
        ) || workbook.SheetNames[0];

        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) {
          throw new Error('Lembar kerja data tidak ditemukan.');
        }

        // Read sheet as 2D array
        const aoa: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (aoa.length === 0) {
          resolve({
            totalRows: 0,
            validRows: 0,
            invalidRows: 0,
            results: [],
          });
          return;
        }

        // Determine if we have a 2-row header (like our official Dapodik template)
        const row0 = (aoa[0] || []).map((v) => String(v || '').trim());
        const row1 = (aoa[1] || []).map((v) => String(v || '').trim());

        const hasSubHeadersInRow1 = row1.some(
          (c) =>
            c.toLowerCase() === 'tahun lahir' ||
            c.toLowerCase() === 'jenjang pendidikan' ||
            c.toLowerCase() === 'pekerjaan' ||
            c.toLowerCase() === 'penghasilan'
        );

        const hasGroupInRow0 = row0.some(
          (c) =>
            c.toLowerCase().includes('data ayah') ||
            c.toLowerCase().includes('data ibu') ||
            c.toLowerCase().includes('data wali')
        );

        const isTwoHeaderRows = hasSubHeadersInRow1 || hasGroupInRow0;

        // Build header column map
        const columnHeaders: string[] = [];
        let currentGroup = '';

        const maxCols = Math.max(row0.length, row1.length);
        for (let c = 0; c < maxCols; c++) {
          const r0Val = row0[c] || '';
          const r1Val = row1[c] || '';

          if (isTwoHeaderRows) {
            if (r0Val.toLowerCase().includes('data ayah')) {
              currentGroup = 'Data Ayah';
            } else if (r0Val.toLowerCase().includes('data ibu')) {
              currentGroup = 'Data Ibu';
            } else if (r0Val.toLowerCase().includes('data wali')) {
              currentGroup = 'Data Wali';
            } else if (r0Val && !r0Val.toLowerCase().includes('data')) {
              currentGroup = '';
            }

            if (currentGroup && r1Val) {
              columnHeaders[c] = `${currentGroup} - ${r1Val}`;
            } else if (r0Val) {
              columnHeaders[c] = r0Val;
            } else if (r1Val) {
              columnHeaders[c] = r1Val;
            } else {
              columnHeaders[c] = `COL_${c}`;
            }
          } else {
            columnHeaders[c] = r0Val || `COL_${c}`;
          }
        }

        const dataStartIndex = isTwoHeaderRows ? 2 : 1;
        const dataRows = aoa.slice(dataStartIndex).filter((r) => r.some((val) => String(val || '').trim() !== ''));

        if (dataRows.length === 0) {
          resolve({
            totalRows: 0,
            validRows: 0,
            invalidRows: 0,
            results: [],
          });
          return;
        }

        const results: ParsedRowResult[] = [];
        let validCount = 0;
        let invalidCount = 0;

        dataRows.forEach((rowArray, index) => {
          const rowNumber = dataStartIndex + index + 1; // Excel 1-based row number
          const errors: string[] = [];
          const warnings: string[] = [];

          // Build dictionary combining headers and positional fallbacks
          const rowDict: Record<string, any> = {};
          columnHeaders.forEach((header, c) => {
            if (header) {
              rowDict[header] = rowArray[c];
            }
            rowDict[`COL_${c}`] = rowArray[c];
          });

          // Also populate exact column index positions
          if (rowArray.length >= 20) {
            // Determine if row follows the 69-column template (with Kabupaten & Provinsi)
            // or the legacy 67-column template
            const hasKabupatenHeader = columnHeaders.some(h => /kabupaten|kota/i.test(h));
            const isTemplateWithKabProv = hasKabupatenHeader || rowArray.length >= 68;

            if (isTemplateWithKabProv) {
              // 69-Column Schema (Kabupaten at 17, Provinsi at 18)
              if (!rowDict['Nama'] && rowArray[1]) rowDict['Nama'] = rowArray[1];
              if (!rowDict['NIPD'] && rowArray[2]) rowDict['NIPD'] = rowArray[2];
              if (!rowDict['JK'] && rowArray[3]) rowDict['JK'] = rowArray[3];
              if (!rowDict['NISN'] && rowArray[4]) rowDict['NISN'] = rowArray[4];
              if (!rowDict['Tempat Lahir'] && rowArray[5]) rowDict['Tempat Lahir'] = rowArray[5];
              if (!rowDict['Tanggal Lahir'] && rowArray[6]) rowDict['Tanggal Lahir'] = rowArray[6];
              if (!rowDict['Rombel Saat Ini'] && rowArray[7]) rowDict['Rombel Saat Ini'] = rowArray[7];
              if (!rowDict['NIK'] && rowArray[8]) rowDict['NIK'] = rowArray[8];
              if (!rowDict['usia'] && rowArray[9]) rowDict['usia'] = rowArray[9];
              if (!rowDict['Agama'] && rowArray[10]) rowDict['Agama'] = rowArray[10];
              if (!rowDict['Alamat'] && rowArray[11]) rowDict['Alamat'] = rowArray[11];
              if (!rowDict['RT'] && rowArray[12]) rowDict['RT'] = rowArray[12];
              if (!rowDict['RW'] && rowArray[13]) rowDict['RW'] = rowArray[13];
              if (!rowDict['Dusun'] && rowArray[14]) rowDict['Dusun'] = rowArray[14];
              if (!rowDict['Kelurahan'] && rowArray[15]) rowDict['Kelurahan'] = rowArray[15];
              if (!rowDict['Kecamatan'] && rowArray[16]) rowDict['Kecamatan'] = rowArray[16];
              if (!rowDict['Kabupaten'] && rowArray[17]) rowDict['Kabupaten'] = rowArray[17];
              if (!rowDict['Provinsi'] && rowArray[18]) rowDict['Provinsi'] = rowArray[18];
              if (!rowDict['Kode Pos'] && rowArray[19]) rowDict['Kode Pos'] = rowArray[19];
              if (!rowDict['Jenis Tinggal'] && rowArray[20]) rowDict['Jenis Tinggal'] = rowArray[20];
              if (!rowDict['Alat Transportasi'] && rowArray[21]) rowDict['Alat Transportasi'] = rowArray[21];
              if (!rowDict['Telepon'] && rowArray[22]) rowDict['Telepon'] = rowArray[22];
              if (!rowDict['HP'] && rowArray[23]) rowDict['HP'] = rowArray[23];
              if (!rowDict['E-Mail'] && rowArray[24]) rowDict['E-Mail'] = rowArray[24];
              if (!rowDict['SKHUN'] && rowArray[25]) rowDict['SKHUN'] = rowArray[25];
              if (!rowDict['Penerima KPS'] && rowArray[26]) rowDict['Penerima KPS'] = rowArray[26];
              if (!rowDict['No. KPS'] && rowArray[27]) rowDict['No. KPS'] = rowArray[27];

              // Ayah (28-33)
              if (rowArray[28]) rowDict['Data Ayah - Nama'] = rowArray[28];
              if (rowArray[29]) rowDict['Data Ayah - Tahun Lahir'] = rowArray[29];
              if (rowArray[30]) rowDict['Data Ayah - Jenjang Pendidikan'] = rowArray[30];
              if (rowArray[31]) rowDict['Data Ayah - Pekerjaan'] = rowArray[31];
              if (rowArray[32]) rowDict['Data Ayah - Penghasilan'] = rowArray[32];
              if (rowArray[33]) rowDict['Data Ayah - NIK'] = rowArray[33];

              // Ibu (34-39)
              if (rowArray[34]) rowDict['Data Ibu - Nama'] = rowArray[34];
              if (rowArray[35]) rowDict['Data Ibu - Tahun Lahir'] = rowArray[35];
              if (rowArray[36]) rowDict['Data Ibu - Jenjang Pendidikan'] = rowArray[36];
              if (rowArray[37]) rowDict['Data Ibu - Pekerjaan'] = rowArray[37];
              if (rowArray[38]) rowDict['Data Ibu - Penghasilan'] = rowArray[38];
              if (rowArray[39]) rowDict['Data Ibu - NIK'] = rowArray[39];

              // Wali (40-45)
              if (rowArray[40]) rowDict['Data Wali - Nama'] = rowArray[40];
              if (rowArray[41]) rowDict['Data Wali - Tahun Lahir'] = rowArray[41];
              if (rowArray[42]) rowDict['Data Wali - Jenjang Pendidikan'] = rowArray[42];
              if (rowArray[43]) rowDict['Data Wali - Pekerjaan'] = rowArray[43];
              if (rowArray[44]) rowDict['Data Wali - Penghasilan'] = rowArray[44];
              if (rowArray[45]) rowDict['Data Wali - NIK'] = rowArray[45];

              // Modul Lanjutan (46-68)
              if (rowArray[46]) rowDict['No Peserta Ujian Nasional'] = rowArray[46];
              if (rowArray[47]) rowDict['No Seri Ijazah'] = rowArray[47];
              if (rowArray[48]) rowDict['Penerima KIP'] = rowArray[48];
              if (rowArray[49]) rowDict['Nomor KIP'] = rowArray[49];
              if (rowArray[50]) rowDict['Nama di KIP'] = rowArray[50];
              if (rowArray[51]) rowDict['Nomor KKS'] = rowArray[51];
              if (rowArray[52]) rowDict['No Registrasi Akta Lahir'] = rowArray[52];
              if (rowArray[53]) rowDict['Bank'] = rowArray[53];
              if (rowArray[54]) rowDict['Nomor Rekening Bank'] = rowArray[54];
              if (rowArray[55]) rowDict['Rekening Atas Nama'] = rowArray[55];
              if (rowArray[56]) rowDict['Layak PIP (usulan dari sekolah)'] = rowArray[56];
              if (rowArray[57]) rowDict['Alasan Layak PIP'] = rowArray[57];
              if (rowArray[58]) rowDict['Kebutuhan Khusus'] = rowArray[58];
              if (rowArray[59]) rowDict['Sekolah Asal'] = rowArray[59];
              if (rowArray[60]) rowDict['Anak ke-berapa'] = rowArray[60];
              if (rowArray[61]) rowDict['Lintang'] = rowArray[61];
              if (rowArray[62]) rowDict['Bujur'] = rowArray[62];
              if (rowArray[63]) rowDict['No KK'] = rowArray[63];
              if (rowArray[64]) rowDict['Berat Badan'] = rowArray[64];
              if (rowArray[65]) rowDict['Tinggi Badan'] = rowArray[65];
              if (rowArray[66]) rowDict['Lingkar Kepala'] = rowArray[66];
              if (rowArray[67]) rowDict['Jml. Saudara Kandung'] = rowArray[67];
              if (rowArray[68]) rowDict['Jarak Rumah ke Sekolah (KM)'] = rowArray[68];
            } else {
              // Backward-compatible Legacy 67-Column Schema (No Kabupaten/Provinsi columns)
              if (!rowDict['Nama'] && rowArray[1]) rowDict['Nama'] = rowArray[1];
              if (!rowDict['NIPD'] && rowArray[2]) rowDict['NIPD'] = rowArray[2];
              if (!rowDict['JK'] && rowArray[3]) rowDict['JK'] = rowArray[3];
              if (!rowDict['NISN'] && rowArray[4]) rowDict['NISN'] = rowArray[4];
              if (!rowDict['Tempat Lahir'] && rowArray[5]) rowDict['Tempat Lahir'] = rowArray[5];
              if (!rowDict['Tanggal Lahir'] && rowArray[6]) rowDict['Tanggal Lahir'] = rowArray[6];
              if (!rowDict['Rombel Saat Ini'] && rowArray[7]) rowDict['Rombel Saat Ini'] = rowArray[7];
              if (!rowDict['NIK'] && rowArray[8]) rowDict['NIK'] = rowArray[8];
              if (!rowDict['usia'] && rowArray[9]) rowDict['usia'] = rowArray[9];
              if (!rowDict['Agama'] && rowArray[10]) rowDict['Agama'] = rowArray[10];
              if (!rowDict['Alamat'] && rowArray[11]) rowDict['Alamat'] = rowArray[11];
              if (!rowDict['RT'] && rowArray[12]) rowDict['RT'] = rowArray[12];
              if (!rowDict['RW'] && rowArray[13]) rowDict['RW'] = rowArray[13];
              if (!rowDict['Dusun'] && rowArray[14]) rowDict['Dusun'] = rowArray[14];
              if (!rowDict['Kelurahan'] && rowArray[15]) rowDict['Kelurahan'] = rowArray[15];
              if (!rowDict['Kecamatan'] && rowArray[16]) rowDict['Kecamatan'] = rowArray[16];
              if (!rowDict['Kode Pos'] && rowArray[17]) rowDict['Kode Pos'] = rowArray[17];
              if (!rowDict['Jenis Tinggal'] && rowArray[18]) rowDict['Jenis Tinggal'] = rowArray[18];
              if (!rowDict['Alat Transportasi'] && rowArray[19]) rowDict['Alat Transportasi'] = rowArray[19];
              if (!rowDict['Telepon'] && rowArray[20]) rowDict['Telepon'] = rowArray[20];
              if (!rowDict['HP'] && rowArray[21]) rowDict['HP'] = rowArray[21];
              if (!rowDict['E-Mail'] && rowArray[22]) rowDict['E-Mail'] = rowArray[22];
              if (!rowDict['SKHUN'] && rowArray[23]) rowDict['SKHUN'] = rowArray[23];
              if (!rowDict['Penerima KPS'] && rowArray[24]) rowDict['Penerima KPS'] = rowArray[24];
              if (!rowDict['No. KPS'] && rowArray[25]) rowDict['No. KPS'] = rowArray[25];

              // Ayah
              if (rowArray[26]) rowDict['Data Ayah - Nama'] = rowArray[26];
              if (rowArray[27]) rowDict['Data Ayah - Tahun Lahir'] = rowArray[27];
              if (rowArray[28]) rowDict['Data Ayah - Jenjang Pendidikan'] = rowArray[28];
              if (rowArray[29]) rowDict['Data Ayah - Pekerjaan'] = rowArray[29];
              if (rowArray[30]) rowDict['Data Ayah - Penghasilan'] = rowArray[30];
              if (rowArray[31]) rowDict['Data Ayah - NIK'] = rowArray[31];

              // Ibu
              if (rowArray[32]) rowDict['Data Ibu - Nama'] = rowArray[32];
              if (rowArray[33]) rowDict['Data Ibu - Tahun Lahir'] = rowArray[33];
              if (rowArray[34]) rowDict['Data Ibu - Jenjang Pendidikan'] = rowArray[34];
              if (rowArray[35]) rowDict['Data Ibu - Pekerjaan'] = rowArray[35];
              if (rowArray[36]) rowDict['Data Ibu - Penghasilan'] = rowArray[36];
              if (rowArray[37]) rowDict['Data Ibu - NIK'] = rowArray[37];

              // Wali
              if (rowArray[38]) rowDict['Data Wali - Nama'] = rowArray[38];
              if (rowArray[39]) rowDict['Data Wali - Tahun Lahir'] = rowArray[39];
              if (rowArray[40]) rowDict['Data Wali - Jenjang Pendidikan'] = rowArray[40];
              if (rowArray[41]) rowDict['Data Wali - Pekerjaan'] = rowArray[41];
              if (rowArray[42]) rowDict['Data Wali - Penghasilan'] = rowArray[42];
              if (rowArray[43]) rowDict['Data Wali - NIK'] = rowArray[43];

              // Modul Lanjutan
              if (rowArray[44]) rowDict['No Peserta Ujian Nasional'] = rowArray[44];
              if (rowArray[45]) rowDict['No Seri Ijazah'] = rowArray[45];
              if (rowArray[46]) rowDict['Penerima KIP'] = rowArray[46];
              if (rowArray[47]) rowDict['Nomor KIP'] = rowArray[47];
              if (rowArray[48]) rowDict['Nama di KIP'] = rowArray[48];
              if (rowArray[49]) rowDict['Nomor KKS'] = rowArray[49];
              if (rowArray[50]) rowDict['No Registrasi Akta Lahir'] = rowArray[50];
              if (rowArray[51]) rowDict['Bank'] = rowArray[51];
              if (rowArray[52]) rowDict['Nomor Rekening Bank'] = rowArray[52];
              if (rowArray[53]) rowDict['Rekening Atas Nama'] = rowArray[53];
              if (rowArray[54]) rowDict['Layak PIP (usulan dari sekolah)'] = rowArray[54];
              if (rowArray[55]) rowDict['Alasan Layak PIP'] = rowArray[55];
              if (rowArray[56]) rowDict['Kebutuhan Khusus'] = rowArray[56];
              if (rowArray[57]) rowDict['Sekolah Asal'] = rowArray[57];
              if (rowArray[58]) rowDict['Anak ke-berapa'] = rowArray[58];
              if (rowArray[59]) rowDict['Lintang'] = rowArray[59];
              if (rowArray[60]) rowDict['Bujur'] = rowArray[60];
              if (rowArray[61]) rowDict['No KK'] = rowArray[61];
              if (rowArray[62]) rowDict['Berat Badan'] = rowArray[62];
              if (rowArray[63]) rowDict['Tinggi Badan'] = rowArray[63];
              if (rowArray[64]) rowDict['Lingkar Kepala'] = rowArray[64];
              if (rowArray[65]) rowDict['Jml. Saudara Kandung'] = rowArray[65];
              if (rowArray[66]) rowDict['Jarak Rumah ke Sekolah (KM)'] = rowArray[66];
            }
          }

          // Extract attributes with rich synonym getters
          const namaLengkap = getCol(rowDict, 'Nama', 'NAMA', 'NAMA_LENGKAP', 'NAMA LENGKAP', 'Nama Siswa', 'Nama Peserta Didik');
          const noInduk = getCol(rowDict, 'NIPD', 'NO_INDUK', 'NIS', 'NO INDUK', 'NOMOR INDUK', 'No Induk');
          const nisn = getCol(rowDict, 'NISN', 'NISN_SISWA', 'NOMOR_NISN');

          if (!namaLengkap) {
            errors.push('Kolom Nama Lengkap wajib diisi.');
          }

          if (!noInduk && !nisn) {
            warnings.push('Nomor Induk (NIPD) / NISN kosong, sistem akan menghasilkan No Induk otomatis.');
          }

          const rawGender = getCol(rowDict, 'JK', 'JENIS_KELAMIN', 'JENIS KELAMIN', 'GENDER', 'L_P');
          const jenisKelamin = normalizeGender(rawGender);

          const rawReligion = getCol(rowDict, 'Agama', 'AGAMA', 'AGAMA_SISWA');
          const agama = normalizeReligion(rawReligion);

          const rawStatus = getCol(rowDict, 'Status', 'STATUS_SISWA', 'STATUS');
          const status = normalizeStatus(rawStatus);

          const studentData: Partial<Student> = {
            noInduk: noInduk ? String(noInduk).trim() : '',
            nisn: nisn ? String(nisn).trim() : '',
            nik: String(getCol(rowDict, 'NIK', 'NIK_SISWA') || '').trim(),
            noKk: String(getCol(rowDict, 'No KK', 'NO_KK', 'KK') || '').trim(),
            namaLengkap: String(namaLengkap || '').trim().toUpperCase(),
            namaPanggilan: String(getCol(rowDict, 'Nama Panggilan', 'NAMA_PANGGILAN', 'PANGGILAN') || '').trim(),
            jenisKelamin,
            tempatLahir: String(getCol(rowDict, 'Tempat Lahir', 'TEMPAT_LAHIR', 'TMP_LAHIR') || 'Depok').trim(),
            tanggalLahir: normalizeDate(getCol(rowDict, 'Tanggal Lahir', 'TANGGAL_LAHIR', 'TGL_LAHIR')),
            agama,
            kewarganegaraan: String(getCol(rowDict, 'Kewarganegaraan', 'KEWARGANEGARAAN', 'WARGA_NEGARA') || 'WNI').trim(),
            anakKe: Number(getCol(rowDict, 'Anak ke-berapa', 'ANAK_KE', 'ANAK KE') || 1),
            jumlahSaudaraKandung: Number(getCol(rowDict, 'Jml. Saudara Kandung', 'JUMLAH_SAUDARA_KANDUNG', 'SAUDARA_KANDUNG', 'JML_SAUDARA') || 1),
            jumlahSaudaraTiri: Number(getCol(rowDict, 'JUMLAH_SAUDARA_TIRI') || 0),
            jumlahSaudaraAngkat: Number(getCol(rowDict, 'JUMLAH_SAUDARA_ANGKAT') || 0),
            statusKeluarga: (getCol(rowDict, 'STATUS_KELUARGA') || 'Anak Kandung') as any,
            bahasaIbu: String(getCol(rowDict, 'BAHASA_IBU', 'BAHASA') || 'Bahasa Indonesia').trim(),

            // Alamat & Domisili
            alamat: String(getCol(rowDict, 'Alamat', 'ALAMAT_JALAN', 'ALAMAT', 'ALAMAT_RUMAH') || 'Jl. Raya Pendidikan').trim(),
            rt: String(getCol(rowDict, 'RT') || '01').trim(),
            rw: String(getCol(rowDict, 'RW') || '01').trim(),
            dusun: String(getCol(rowDict, 'Dusun', 'DUSUN') || '').trim(),
            kelurahanDesa: String(getCol(rowDict, 'Kelurahan', 'KELURAHAN_DESA', 'DESA') || '').trim(),
            kecamatan: String(getCol(rowDict, 'Kecamatan', 'KECAMATAN') || '').trim(),
            kabupatenKota: String(getCol(rowDict, 'Kabupaten', 'Kabupaten/Kota', 'KABUPATEN', 'KOTA', 'KABUPATEN_KOTA', 'Kabupaten / Kota', 'KAB') || '').trim(),
            provinsi: String(getCol(rowDict, 'Provinsi', 'PROVINSI', 'PROP', 'Propinsi', 'PROPINSI') || '').trim(),
            kodePos: String(getCol(rowDict, 'Kode Pos', 'KODE_POS', 'KODEPOS') || '').trim(),
            tinggalDengan: (getCol(rowDict, 'Jenis Tinggal', 'TINGGAL_DENGAN', 'TINGGAL_BERSAMA') || 'Orang Tua') as any,
            jarakKeSekolahKm: Number(getCol(rowDict, 'Jarak Rumah ke Sekolah (KM)', 'JARAK_KE_SEKOLAH_KM', 'JARAK_KM') || 1),
            transportasi: (getCol(rowDict, 'Alat Transportasi', 'TRANSPORTASI') || 'Jalan Kaki') as any,
            noHpSiswa: String(getCol(rowDict, 'HP', 'NO_HP_SISWA', 'HP_SISWA') || '').trim(),
            emailSiswa: String(getCol(rowDict, 'E-Mail', 'EMAIL_SISWA', 'EMAIL') || '').trim(),

            // Dapodik Extended Fields
            usia: getCol(rowDict, 'usia', 'USIA', 'UMUR'),
            skhun: String(getCol(rowDict, 'SKHUN', 'NO SKHUN') || '').trim(),
            penerimaKps: String(getCol(rowDict, 'Penerima KPS', 'PENERIMA_KPS') || 'Tidak').trim(),
            noKps: String(getCol(rowDict, 'No. KPS', 'NO_KPS') || '').trim(),
            noPesertaUN: String(getCol(rowDict, 'No Peserta Ujian Nasional', 'NO_PESERTA_UN') || '').trim(),
            noSeriIjazah: String(getCol(rowDict, 'No Seri Ijazah', 'NO_SERI_IJAZAH') || '').trim(),
            penerimaKip: String(getCol(rowDict, 'Penerima KIP', 'PENERIMA_KIP') || 'Tidak').trim(),
            nomorKip: String(getCol(rowDict, 'Nomor KIP', 'NOMOR_KIP') || '').trim(),
            namaDiKip: String(getCol(rowDict, 'Nama di KIP', 'NAMA_DI_KIP') || '').trim(),
            nomorKks: String(getCol(rowDict, 'Nomor KKS', 'NOMOR_KKS') || '').trim(),
            noRegistrasiAktaLahir: String(getCol(rowDict, 'No Registrasi Akta Lahir', 'NO_REGISTRASI_AKTA_LAHIR', 'AKTA_LAHIR') || '').trim(),
            bank: String(getCol(rowDict, 'Bank', 'BANK') || '').trim(),
            nomorRekeningBank: String(getCol(rowDict, 'Nomor Rekening Bank', 'NOMOR_REKENING_BANK', 'NO_REKENING') || '').trim(),
            rekeningAtasNama: String(getCol(rowDict, 'Rekening Atas Nama', 'REKENING_ATAS_NAMA') || '').trim(),
            layakPip: String(getCol(rowDict, 'Layak PIP (usulan dari sekolah)', 'LAYAK_PIP') || 'Tidak').trim(),
            alasanLayakPip: String(getCol(rowDict, 'Alasan Layak PIP', 'ALASAN_LAYAK_PIP') || '').trim(),
            kebutuhanKhusus: String(getCol(rowDict, 'Kebutuhan Khusus', 'KEBUTUHAN_KHUSUS') || 'Tidak Ada').trim(),
            lintang: String(getCol(rowDict, 'Lintang', 'LATITUDE') || '').trim(),
            bujur: String(getCol(rowDict, 'Bujur', 'LONGITUDE') || '').trim(),
            lingkarKepala: Number(getCol(rowDict, 'Lingkar Kepala', 'LINGKAR_KEPALA') || 0) || undefined,

            // Kesehatan & Jasmani
            kesehatan: {
              golonganDarah: (getCol(rowDict, 'Golongan Darah', 'GOLONGAN_DARAH', 'GOL_DARAH') || 'Tidak Tahu') as any,
              penyakitPernahDiderita: String(getCol(rowDict, 'Penyakit Pernah Diderita', 'PENYAKIT_DIDERITA') || 'Tidak Ada').trim(),
              kelainanJasmani: String(getCol(rowDict, 'Kelainan Jasmani', 'KELAINAN_JASMANI') || 'Tidak Ada').trim(),
              tinggiBadanCm: Number(getCol(rowDict, 'Tinggi Badan', 'TINGGI_BADAN_CM', 'TINGGI_BADAN') || 150),
              beratBadanKg: Number(getCol(rowDict, 'Berat Badan', 'BERAT_BADAN_KG', 'BERAT_BADAN') || 40),
            },

            // Data Ayah
            ayah: {
              nama: String(getCol(rowDict, 'Data Ayah - Nama', 'AYAH_NAMA', 'NAMA_AYAH', 'AYAH') || '-').trim(),
              nik: String(getCol(rowDict, 'Data Ayah - NIK', 'AYAH_NIK', 'NIK_AYAH') || '').trim(),
              tahunLahir: getCol(rowDict, 'Data Ayah - Tahun Lahir', 'AYAH_TAHUN_LAHIR', 'TAHUN_LAHIR_AYAH'),
              agama: normalizeReligion(getCol(rowDict, 'AGAMA_AYAH')),
              kewarganegaraan: 'WNI',
              pendidikan: String(getCol(rowDict, 'Data Ayah - Jenjang Pendidikan', 'AYAH_JENJANG_PENDIDIKAN', 'PENDIDIKAN_AYAH') || 'SMA').trim(),
              pekerjaan: String(getCol(rowDict, 'Data Ayah - Pekerjaan', 'AYAH_PEKERJAAN', 'PEKERJAAN_AYAH') || 'Wiraswasta').trim(),
              penghasilanBulanan: String(getCol(rowDict, 'Data Ayah - Penghasilan', 'AYAH_PENGHASILAN', 'PENGHASILAN_AYAH') || 'Rp 3.000.000 - Rp 5.000.000').trim(),
              noHp: String(getCol(rowDict, 'NO_HP_AYAH', 'HP_AYAH') || '').trim(),
              statusHidup: (getCol(rowDict, 'STATUS_HIDUP_AYAH') || 'Masih Hidup') as any,
            },

            // Data Ibu
            ibu: {
              nama: String(getCol(rowDict, 'Data Ibu - Nama', 'IBU_NAMA', 'NAMA_IBU', 'IBU') || '-').trim(),
              nik: String(getCol(rowDict, 'Data Ibu - NIK', 'IBU_NIK', 'NIK_IBU') || '').trim(),
              tahunLahir: getCol(rowDict, 'Data Ibu - Tahun Lahir', 'IBU_TAHUN_LAHIR', 'TAHUN_LAHIR_IBU'),
              agama: normalizeReligion(getCol(rowDict, 'AGAMA_IBU')),
              kewarganegaraan: 'WNI',
              pendidikan: String(getCol(rowDict, 'Data Ibu - Jenjang Pendidikan', 'IBU_JENJANG_PENDIDIKAN', 'PENDIDIKAN_IBU') || 'SMA').trim(),
              pekerjaan: String(getCol(rowDict, 'Data Ibu - Pekerjaan', 'IBU_PEKERJAAN', 'PEKERJAAN_IBU') || 'Ibu Rumah Tangga').trim(),
              penghasilanBulanan: String(getCol(rowDict, 'Data Ibu - Penghasilan', 'IBU_PENGHASILAN', 'PENGHASILAN_IBU') || 'Tidak Ada').trim(),
              noHp: String(getCol(rowDict, 'NO_HP_IBU', 'HP_IBU') || '').trim(),
              statusHidup: (getCol(rowDict, 'STATUS_HIDUP_IBU') || 'Masih Hidup') as any,
            },

            // Data Wali
            wali: getCol(rowDict, 'Data Wali - Nama', 'NAMA_WALI', 'WALI') ? {
              nama: String(getCol(rowDict, 'Data Wali - Nama', 'NAMA_WALI', 'WALI')).trim(),
              nik: String(getCol(rowDict, 'Data Wali - NIK', 'NIK_WALI') || '').trim(),
              tahunLahir: getCol(rowDict, 'Data Wali - Tahun Lahir', 'WALI_TAHUN_LAHIR'),
              hubungan: String(getCol(rowDict, 'HUBUNGAN_WALI') || 'Wali').trim(),
              pendidikan: String(getCol(rowDict, 'Data Wali - Jenjang Pendidikan', 'PENDIDIKAN_WALI') || '').trim(),
              pekerjaan: String(getCol(rowDict, 'Data Wali - Pekerjaan', 'PEKERJAAN_WALI') || '').trim(),
              penghasilanBulanan: String(getCol(rowDict, 'Data Wali - Penghasilan', 'PENGHASILAN_WALI') || '').trim(),
              noHp: String(getCol(rowDict, 'NO_HP_WALI') || '').trim(),
            } : undefined,

            // Riwayat Masuk & Rombel
            sekolahAsalTK: String(getCol(rowDict, 'Sekolah Asal', 'ASAL_SEKOLAH_TK_SD', 'ASAL_SEKOLAH', 'SEKOLAH_ASAL') || '-').trim(),
            noIjazahTK: String(getCol(rowDict, 'No Seri Ijazah', 'NO_IJAZAH_SEBELUMNYA', 'NO_IJAZAH_ASAL') || '').trim(),
            tanggalDiterima: normalizeDate(getCol(rowDict, 'TANGGAL_DITERIMA', 'TGL_DITERIMA')),
            diterimaDiKelas: (() => {
              const raw = String(getCol(rowDict, 'DITERIMA_DI_KELAS', 'DITERIMA_KELAS', 'DITERIMA DI KELAS') || 'Kelas 1').trim();
              return (!raw || raw === '7' || raw === '7A' || raw === '7B' || raw.toLowerCase() === 'kelas 7' || raw.toLowerCase() === 'vii') ? 'Kelas 1' : raw;
            })(),
            kelasSekarang: (() => {
              const raw = String(getCol(rowDict, 'Rombel Saat Ini', 'KELAS_SEKARANG', 'KELAS', 'ROMBEL') || 'Kelas 1').trim();
              return (raw === '7' || raw === '7A' || raw === '7B' || raw.toLowerCase() === 'kelas 7' || raw.toLowerCase() === 'vii') ? 'Kelas 1' : raw;
            })(),
            status,
            tahunMasuk: String(getCol(rowDict, 'TAHUN_MASUK') || new Date().getFullYear().toString()).trim(),
            raport: [],
          };

          const isValid = errors.length === 0;
          if (isValid) {
            validCount++;
          } else {
            invalidCount++;
          }

          results.push({
            rowNumber,
            data: studentData,
            isValid,
            errors,
            warnings,
          });
        });

        resolve({
          totalRows: dataRows.length,
          validRows: validCount,
          invalidRows: invalidCount,
          results,
        });
      } catch (err: any) {
        reject(new Error(err?.message || 'Gagal membaca berkas Excel / CSV.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Gagal membaca file berkas.'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * ============================================================================
 * MODUL KHUSUS: IMPOR & TEMPLATE PERUBAHAN ROMBEL SISWA AKTIF (KELAS 1 - 6)
 * ============================================================================
 */

export const isRombelKelas1Sampai6 = (kelasName?: string): boolean => {
  if (!kelasName) return false;
  const k = kelasName.trim().toLowerCase();

  // Exclude non-SD levels explicitly
  if (
    k.includes('alumni') || 
    k.includes('lulus') || 
    k.includes('tamat') || 
    k.includes('tk') || 
    k.includes('paud') || 
    k.includes('kb') ||
    k.includes('tpa') ||
    k.includes('ra') ||
    k.includes('smp') ||
    k.includes('mts') ||
    k.includes('sma') ||
    k.includes('smk')
  ) {
    return false;
  }

  // Exclude secondary grades: 7, 8, 9, 10, 11, 12, VII, VIII, IX, X, XI, XII
  if (/\b(?:kelas|tingkat|rombel)?\s*(?:7|8|9|10|11|12|vii|viii|ix|x|xi|xii)\b/i.test(k)) {
    return false;
  }

  // Check for digits 1-6 (e.g. "Kelas 1", "Kelas 1A", "1B", "Kelas 2", "3-A", "Kelas 6", "6B")
  if (/\b(?:kelas|tingkat|rombel)?\s*([1-6])(?![0-9])/i.test(k)) {
    return true;
  }

  // Check for Roman numerals I-VI (e.g. "Kelas I", "Kelas II-A", "VI", etc.)
  if (/\b(?:kelas|tingkat|rombel)?\s*(vi|v|iv|iii|ii|i)\b/i.test(k)) {
    return true;
  }

  return false;
};

export interface RombelChangeItem {
  rowNumber: number;
  nis: string;
  nisn: string;
  nama: string;
  jk: string;
  rombelLama: string;
  rombelBaru: string;
  keterangan: string;
  studentId?: string;
  status: 'CHANGE_READY' | 'UNCHANGED' | 'NOT_FOUND' | 'INVALID_CLASS' | 'EMPTY_ROMBEL';
  message: string;
}

export interface RombelImportSummary {
  totalRows: number;
  readyCount: number;
  unchangedCount: number;
  notFoundCount: number;
  invalidCount: number;
  items: RombelChangeItem[];
}

/**
 * Generate & Download Excel Template specifically designed for updating Student Rombel / Class
 */
export const downloadRombelTemplate = (
  schoolName: string = 'SDN 006 SUNGAI BULUH',
  activeStudents: Student[] = [],
  mode: 'blank' | 'populated' = 'blank'
) => {
  const wb = XLSX.utils.book_new();

  // Headers matching standard Indonesian school format
  const headers = [
    'No',
    'NIS',
    'NISN',
    'Nama Siswa',
    'JK',
    'Rombel Saat Ini (Lama)',
    'Rombel Baru (Tujuan)',
    'Keterangan',
  ];

  let rows: any[][] = [];

  if (mode === 'populated' && activeStudents && activeStudents.length > 0) {
    // Populate with actual active students in Kelas 1-6
    rows = activeStudents.map((s, idx) => [
      idx + 1,
      s.noInduk || '',
      s.nisn || '',
      s.namaLengkap || '',
      s.jenisKelamin === 'P' ? 'P' : 'L',
      s.kelasSekarang || 'Kelas 1',
      '', // User fills Rombel Baru here!
      '', // Keterangan opsional
    ]);
  } else {
    // Demo / Sample rows for blank template
    rows = [
      [1, '2024001', '0081234567', 'AHMAD FADILLAH', 'L', '1A', '2A', 'Kenaikan kelas ke 2A'],
      [2, '2024002', '0081234568', 'AULIA RAHMAWATI', 'P', '1A', '2A', 'Kenaikan kelas ke 2A'],
      [3, '2023015', '0079876543', 'BAGAS PRATAMA', 'L', '2', '3', 'Kenaikan kelas ke 3'],
      [4, '2022040', '0061122334', 'CITRA LESTARI', 'P', '3A', '3B', 'Pindah rombel paralel ke 3B'],
      [5, '2021008', '0054433221', 'DIMAS ARYA PUTRA', 'L', '5', '6', 'Kenaikan kelas ke 6'],
    ];
  }

  const sheetData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Set explicit column widths for readability
  ws['!cols'] = [
    { wch: 6 },   // No
    { wch: 16 },  // NIS
    { wch: 16 },  // NISN
    { wch: 34 },  // Nama Siswa
    { wch: 6 },   // JK
    { wch: 24 },  // Rombel Saat Ini (Lama)
    { wch: 24 },  // Rombel Baru (Tujuan)
    { wch: 32 },  // Keterangan
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'UBAH_ROMBEL');

  // Sheet 2: PETUNJUK_DAN_KETENTUAN
  const guideData = [
    ['PANDUAN & PETUNJUK PENGISIAN TEMPLATE PERUBAHAN ROMBEL', '', ''],
    ['SDN 006 SUNGAI BULUH - TAHUN PELAJARAN AKTIF', '', ''],
    ['', '', ''],
    ['No', 'Kolom', 'Keterangan Pengisian'],
    [1, 'No', 'Nomor urut data (bebas/otomatis)'],
    [2, 'NIS', 'WAJIB: Nomor Induk Siswa sesuai Buku Induk sebagai kunci utama identifikasi siswa'],
    [3, 'NISN', 'Opsional: Nomor Induk Siswa Nasional sebagai pengenal cadangan'],
    [4, 'Nama Siswa', 'Nama lengkap siswa sesuai akta / buku induk untuk memudahkan operator'],
    [5, 'JK', 'Jenis Kelamin siswa (L untuk Laki-laki, P untuk Perempuan)'],
    [6, 'Rombel Saat Ini (Lama)', 'Kelas / Rombel siswa saat ini sebagai acuan (tidak diubah)'],
    [7, 'Rombel Baru (Tujuan)', 'WAJIB DIISI: Rombel atau kelas tujuan yang baru. Contoh: 1, 1A, 1B, 2, 2A, 3, 4A, 5B, 6, dsb.'],
    [8, 'Keterangan', 'Opsional: Catatan perubahaan (contoh: Kenaikan Kelas, Pindah Rombel Paralel, dsb.)'],
    ['', '', ''],
    ['KETENTUAN PENTING:', '', ''],
    ['1.', 'Khusus Siswa Aktif SD', 'Hanya berlaku untuk siswa di tingkat Sekolah Dasar (Kelas 1 sampai Kelas 6).'],
    ['2.', 'Fleksibilitas Nama Rombel', 'Format rombel tetap variabel. Anda bebas menggunakan penamaan angka tunggal (1, 2, 3), rombel alfabet (1A, 1B, 2A), maupun Romawi (VI-A).'],
    ['3.', 'Pencocokan Otomatis', 'Sistem Buku Induk mencocokkan data secara otomatis berdasarkan NIS atau NISN. Kolom Rombel Baru yang berbeda dari rombel saat ini akan diperbarui.'],
  ];

  const wsGuide = XLSX.utils.aoa_to_sheet(guideData);
  wsGuide['!cols'] = [{ wch: 6 }, { wch: 26 }, { wch: 68 }];
  XLSX.utils.book_append_sheet(wb, wsGuide, 'PETUNJUK_ROMBEL');

  const cleanSchool = (schoolName || 'SEKOLAH').replace(/[^a-zA-Z0-9]/g, '_');
  const typeSuffix = mode === 'populated' ? 'TERISI_SISWA_AKTIF' : 'FORMAT_KOSONG';
  const fileName = `TEMPLATE_PERUBAHAN_ROMBEL_${cleanSchool}_${typeSuffix}.xlsx`;

  XLSX.writeFile(wb, fileName);
};

/**
 * Parse uploaded Excel / CSV file specifically for changing student rombel
 */
export function parseRombelExcelFile(
  file: File,
  allStudents: Student[]
): Promise<RombelImportSummary> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        if (!buffer) {
          throw new Error('Berkas kosong atau tidak dapat dibaca.');
        }

        const wb = XLSX.read(buffer, { type: 'array' });
        // Pick best sheet or first sheet
        const sheetName =
          wb.SheetNames.find((s) => /perubahan|ubah|rombel|siswa|sheet1/i.test(s)) ||
          wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        if (!ws) {
          throw new Error('Lembar kerja spreadsheet tidak ditemukan.');
        }

        const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[][];
        if (!rawRows || rawRows.length === 0) {
          throw new Error('Spreadsheet kosong.');
        }

        // Find header row index
        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(rawRows.length, 12); i++) {
          const row = rawRows[i];
          if (Array.isArray(row)) {
            const rowStr = row.map((cell) => String(cell).toLowerCase()).join(' ');
            if (
              (rowStr.includes('nis') || rowStr.includes('induk') || rowStr.includes('nipd')) &&
              (rowStr.includes('nama') || rowStr.includes('rombel') || rowStr.includes('kelas'))
            ) {
              headerRowIndex = i;
              break;
            }
          }
        }

        if (headerRowIndex === -1) {
          headerRowIndex = 0;
        }

        const headerRow = rawRows[headerRowIndex].map((h) => String(h || '').trim());
        const dataRows = rawRows.slice(headerRowIndex + 1);

        // Map column indices
        let colNIS = -1;
        let colNISN = -1;
        let colNama = -1;
        let colJK = -1;
        let colRombelLama = -1;
        let colRombelBaru = -1;
        let colKeterangan = -1;

        headerRow.forEach((h, idx) => {
          const clean = h.toLowerCase();
          if (/^(nis|no\.?\s*induk|nipd|nomor\s*induk)/i.test(clean) && colNIS === -1) {
            colNIS = idx;
          } else if (/^nisn/i.test(clean) && colNISN === -1) {
            colNISN = idx;
          } else if (/^(nama|nama\s*lengkap|nama\s*siswa)/i.test(clean) && colNama === -1) {
            colNama = idx;
          } else if (/^(jk|jenis\s*kelamin|gender)/i.test(clean) && colJK === -1) {
            colJK = idx;
          } else if (
            /rombel\s*baru|rombel\s*tujuan|kelas\s*baru|kelas\s*tujuan|tujuan/i.test(clean) &&
            colRombelBaru === -1
          ) {
            colRombelBaru = idx;
          } else if (
            /rombel\s*saat|rombel\s*lama|kelas\s*saat|kelas\s*lama|rombel\s*asal|kelas\s*asal/i.test(clean) &&
            colRombelLama === -1
          ) {
            colRombelLama = idx;
          } else if (/keterangan|catatan|alasan|ket/i.test(clean) && colKeterangan === -1) {
            colKeterangan = idx;
          }
        });

        // Positional fallbacks
        if (colNIS === -1) colNIS = 1;
        if (colNama === -1) colNama = 3;
        if (colRombelBaru === -1) {
          // If 7th column exists in standard template
          if (headerRow.length >= 7) {
            colRombelBaru = 6;
          } else {
            // Check if there is any column with 'rombel' or 'kelas'
            headerRow.forEach((h, idx) => {
              if (/rombel|kelas/i.test(h) && colRombelBaru === -1) {
                colRombelBaru = idx;
              }
            });
          }
        }
        if (colRombelLama === -1 && headerRow.length >= 6) {
          colRombelLama = 5;
        }

        const items: RombelChangeItem[] = [];
        let readyCount = 0;
        let unchangedCount = 0;
        let notFoundCount = 0;
        let invalidCount = 0;

        // Build lookup index
        const studentByNis = new Map<string, Student>();
        const studentByNisn = new Map<string, Student>();
        const studentByName = new Map<string, Student>();

        allStudents.forEach((st) => {
          if (st.noInduk) studentByNis.set(st.noInduk.trim().toLowerCase(), st);
          if (st.nisn) studentByNisn.set(st.nisn.trim().toLowerCase(), st);
          if (st.namaLengkap) studentByName.set(st.namaLengkap.trim().toLowerCase(), st);
        });

        dataRows.forEach((row, idx) => {
          if (!Array.isArray(row) || row.every((c) => String(c ?? '').trim() === '')) {
            return; // ignore completely empty rows
          }

          const rowNumber = headerRowIndex + 1 + idx + 1;
          const nis = String(colNIS >= 0 ? row[colNIS] ?? '' : '').trim();
          const nisn = String(colNISN >= 0 ? row[colNISN] ?? '' : '').trim();
          const nama = String(colNama >= 0 ? row[colNama] ?? '' : '').trim();
          const jk = String(colJK >= 0 ? row[colJK] ?? '' : '').trim().toUpperCase();
          const rombelLama = String(colRombelLama >= 0 ? row[colRombelLama] ?? '' : '').trim();
          const rombelBaru = String(colRombelBaru >= 0 ? row[colRombelBaru] ?? '' : '').trim();
          const keterangan = String(colKeterangan >= 0 ? row[colKeterangan] ?? '' : '').trim();

          // Skip example rows or empty content
          if (!nis && !nama && !rombelBaru) {
            return;
          }

          // Match student
          let matchedStudent: Student | undefined;
          if (nis) matchedStudent = studentByNis.get(nis.toLowerCase());
          if (!matchedStudent && nisn) matchedStudent = studentByNisn.get(nisn.toLowerCase());
          if (!matchedStudent && nama) matchedStudent = studentByName.get(nama.toLowerCase());

          let status: RombelChangeItem['status'] = 'CHANGE_READY';
          let message = '';

          if (!matchedStudent) {
            status = 'NOT_FOUND';
            message = `Siswa dengan NIS "${nis || '-'}" ${nama ? `(${nama})` : ''} tidak ditemukan di Buku Induk`;
            notFoundCount++;
          } else if (!rombelBaru) {
            status = 'EMPTY_ROMBEL';
            message = 'Kolom Rombel Baru (Tujuan) masih kosong';
            invalidCount++;
          } else if (!isRombelKelas1Sampai6(rombelBaru)) {
            status = 'INVALID_CLASS';
            message = `Rombel "${rombelBaru}" tidak valid (Harus Kelas 1 s/d 6)`;
            invalidCount++;
          } else {
            const currentClassClean = (matchedStudent.kelasSekarang || '').trim();
            const newClassClean = rombelBaru.trim();
            if (currentClassClean.toLowerCase() === newClassClean.toLowerCase()) {
              status = 'UNCHANGED';
              message = `Rombel tidak berubah (tetap ${currentClassClean})`;
              unchangedCount++;
            } else {
              status = 'CHANGE_READY';
              message = `Siap diubah dari ${currentClassClean} ➔ ${newClassClean}`;
              readyCount++;
            }
          }

          items.push({
            rowNumber,
            nis: nis || (matchedStudent ? matchedStudent.noInduk : ''),
            nisn: nisn || (matchedStudent ? matchedStudent.nisn : ''),
            nama: nama || (matchedStudent ? matchedStudent.namaLengkap : '-'),
            jk: jk || (matchedStudent ? (matchedStudent.jenisKelamin === 'P' ? 'P' : 'L') : '-'),
            rombelLama: rombelLama || (matchedStudent ? matchedStudent.kelasSekarang : '-'),
            rombelBaru,
            keterangan,
            studentId: matchedStudent?.id,
            status,
            message,
          });
        });

        resolve({
          totalRows: items.length,
          readyCount,
          unchangedCount,
          notFoundCount,
          invalidCount,
          items,
        });
      } catch (err: any) {
        reject(new Error(err?.message || 'Gagal memproses berkas Excel perubahan rombel.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Gagal membaca file berkas Excel.'));
    };

    reader.readAsArrayBuffer(file);
  });
}

export interface ExportRombelExcelOptions {
  schoolProfile: SchoolProfile;
  students: Student[];
  kelasName: string;
  activeTP?: string;
  activeSemester?: string;
  waliKelasName?: string;
  waliKelasNip?: string;
}

/**
 * Mengunduh berkas daftar siswa resmi untuk rombel tertentu dalam format .xlsx
 * Didesain khusus untuk kebutuhan administrasi & pengelolaan guru wali kelas.
 */
export function exportRombelToExcel(options: ExportRombelExcelOptions): void {
  const {
    schoolProfile,
    students,
    kelasName,
    activeTP = schoolProfile.tahunPelajaranAktif || '2026/2027',
    activeSemester = schoolProfile.semesterAktif || 'Ganjil',
    waliKelasName = 'Wali Kelas',
    waliKelasNip = '-',
  } = options;

  // Saring siswa khusus untuk rombel yang dipilih dan berstatus Aktif
  const rombelStudents = students
    .filter((s) => s.kelasSekarang === kelasName && s.status === 'Aktif')
    .sort((a, b) => a.namaLengkap.localeCompare(b.namaLengkap));

  const total = rombelStudents.length;
  const jmlL = rombelStudents.filter((s) => s.jenisKelamin === 'L').length;
  const jmlP = rombelStudents.filter((s) => s.jenisKelamin === 'P').length;

  const wb = XLSX.utils.book_new();

  // =========================================================================
  // LEMBAR KERJA 1: DAFTAR SISWA KELAS & ADMINISTRASI WALI KELAS
  // =========================================================================
  const rows: any[][] = [];

  // Kop dan Identitas
  const instansi = (schoolProfile.kabupatenKota || 'KABUPATEN KUANTAN SINGINGI').toUpperCase();
  rows.push([`DINAS PENDIDIKAN, KEPEMUDAAN DAN OLAHRAGA ${instansi}`]);
  rows.push([`DAFTAR PESERTA DIDIK - ${schoolProfile.namaSekolah.toUpperCase()}`]);
  rows.push([
    `ROMBONGAN BELAJAR (ROMBEL): ${kelasName.toUpperCase()}   |   TAHUN PELAJARAN: ${activeTP}   |   SEMESTER: ${activeSemester.toUpperCase()}`,
  ]);
  rows.push([
    `Guru / Wali Kelas: ${waliKelasName}   |   NIP: ${waliKelasNip}   |   Jumlah Siswa: ${total} Orang (L: ${jmlL}, P: ${jmlP})`,
  ]);
  rows.push([]); // Baris kosong

  // Header Kolom Tabel
  const tableHeaders = [
    'No',
    'NIS',
    'NISN',
    'NIK',
    'Nama Lengkap Siswa',
    'L/P',
    'Tempat Lahir',
    'Tanggal Lahir',
    'Agama',
    'Alamat Siswa',
    'Dusun / RT / RW',
    'Desa / Kelurahan',
    'Nama Ayah',
    'Pekerjaan Ayah',
    'Nama Ibu',
    'Pekerjaan Ibu',
    'No. HP Orang Tua / Wali',
    'Status',
    'Presensi (S)',
    'Presensi (I)',
    'Presensi (A)',
    'Catatan Wali Kelas',
  ];
  rows.push(tableHeaders);

  // Baris Data Peserta Didik
  rombelStudents.forEach((s, idx) => {
    const parentPhone = s.ayah?.noHp || s.ibu?.noHp || s.wali?.noHp || s.noHpSiswa || '-';
    const dusunRtRw = [s.dusun, s.rt ? `RT ${s.rt}` : '', s.rw ? `RW ${s.rw}` : '']
      .filter(Boolean)
      .join(', ') || '-';

    rows.push([
      idx + 1,
      s.noInduk || '-',
      s.nisn || '-',
      s.nik || '-',
      s.namaLengkap,
      s.jenisKelamin,
      s.tempatLahir || '-',
      s.tanggalLahir || '-',
      s.agama || '-',
      s.alamat || '-',
      dusunRtRw,
      s.kelurahanDesa || '-',
      s.ayah?.nama || '-',
      s.ayah?.pekerjaan || '-',
      s.ibu?.nama || '-',
      s.ibu?.pekerjaan || '-',
      parentPhone,
      s.status,
      '', // Kosong untuk absensi / nilai guru wali kelas
      '',
      '',
      '',
    ]);
  });

  // Footer Rekapitulasi
  rows.push([]);
  rows.push(['REKAPITULASI JUMLAH PESERTA DIDIK:']);
  rows.push([`• Total Siswa       : ${total} Siswa`]);
  rows.push([`• Siswa Laki-laki   : ${jmlL} Siswa (${total > 0 ? Math.round((jmlL / total) * 100) : 0}%)`]);
  rows.push([`• Siswa Perempuan   : ${jmlP} Siswa (${total > 0 ? Math.round((jmlP / total) * 100) : 0}%)`]);
  rows.push([]);

  // Titimangsa & Pengesahan Dokumen
  const kota = schoolProfile.kabupatenKota?.replace(/^(Kabupaten|Kota)\s+/i, '') || 'Sungai Buluh';
  const tglFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  rows.push(['', '', '', '', 'Mengetahui,', '', '', '', '', '', '', '', '', '', '', '', `${kota}, ${tglFormatted}`]);
  rows.push(['', '', '', '', 'Kepala Sekolah,', '', '', '', '', '', '', '', '', '', '', '', `Wali Kelas ${kelasName},`]);
  rows.push([]);
  rows.push([]);
  rows.push([]);
  rows.push([
    '', '', '', '',
    schoolProfile.namaKepalaSekolah || 'Kepala Sekolah',
    '', '', '', '', '', '', '', '', '', '', '',
    waliKelasName,
  ]);
  rows.push([
    '', '', '', '',
    `NIP. ${schoolProfile.nipKepalaSekolah || '-'}`,
    '', '', '', '', '', '', '', '', '', '', '',
    `NIP. ${waliKelasNip}`,
  ]);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Lebar kolom rapi
  ws['!cols'] = [
    { wch: 6 },   // No
    { wch: 14 },  // NIS
    { wch: 14 },  // NISN
    { wch: 18 },  // NIK
    { wch: 34 },  // Nama
    { wch: 6 },   // L/P
    { wch: 18 },  // Tempat Lahir
    { wch: 14 },  // Tgl Lahir
    { wch: 12 },  // Agama
    { wch: 32 },  // Alamat
    { wch: 20 },  // Dusun/RT/RW
    { wch: 18 },  // Kelurahan/Desa
    { wch: 24 },  // Nama Ayah
    { wch: 20 },  // Pekerjaan Ayah
    { wch: 24 },  // Nama Ibu
    { wch: 20 },  // Pekerjaan Ibu
    { wch: 18 },  // No HP Ortu
    { wch: 12 },  // Status
    { wch: 14 },  // S
    { wch: 14 },  // I
    { wch: 14 },  // A
    { wch: 28 },  // Catatan
  ];

  // Nama Sheet (maks 31 karakter)
  const safeSheetName = `SISWA_${kelasName.replace(/[^a-zA-Z0-9]/g, '_')}`.slice(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, safeSheetName);

  // =========================================================================
  // LEMBAR KERJA 2: RINGKASAN KONTAK & DATA ORANG TUA SISWA
  // =========================================================================
  const kontakRows: any[][] = [
    [`BUKU KONTAK & DATA ORANG TUA / WALI PESERTA DIDIK - ${kelasName.toUpperCase()}`],
    [`${schoolProfile.namaSekolah} | Tahun Pelajaran ${activeTP}`],
    [],
    ['No', 'Nama Siswa', 'JK', 'NIS', 'NISN', 'Nama Ayah', 'Nama Ibu', 'No. HP Kontak Utama', 'Alamat Domisili'],
  ];

  rombelStudents.forEach((s, idx) => {
    const parentPhone = s.ayah?.noHp || s.ibu?.noHp || s.wali?.noHp || s.noHpSiswa || '-';
    kontakRows.push([
      idx + 1,
      s.namaLengkap,
      s.jenisKelamin,
      s.noInduk,
      s.nisn,
      s.ayah?.nama || '-',
      s.ibu?.nama || '-',
      parentPhone,
      s.alamat || '-',
    ]);
  });

  const wsKontak = XLSX.utils.aoa_to_sheet(kontakRows);
  wsKontak['!cols'] = [
    { wch: 6 },
    { wch: 32 },
    { wch: 6 },
    { wch: 14 },
    { wch: 14 },
    { wch: 24 },
    { wch: 24 },
    { wch: 20 },
    { wch: 36 },
  ];
  XLSX.utils.book_append_sheet(wb, wsKontak, 'BUKU_KONTAK_ORTU');

  // Nama File
  const cleanSchool = (schoolProfile.namaSekolah || 'SEKOLAH').replace(/[^a-zA-Z0-9]/g, '_');
  const cleanClass = kelasName.replace(/[^a-zA-Z0-9]/g, '_');
  const cleanTP = activeTP.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `DAFTAR_SISWA_${cleanClass}_${cleanSchool}_TP_${cleanTP}.xlsx`;

  XLSX.writeFile(wb, fileName);
}

/**
 * Mengunduh berkas workbook Excel yang menggabungkan seluruh rombel ke dalam masing-masing lembar kerja (sheet)
 */
export function exportCombinedRombelsToExcel(
  schoolProfile: SchoolProfile,
  activeStudents: Student[],
  availableClasses: string[],
  activeTP: string,
  waliKelasMap: Record<string, { nama: string; nip?: string }> = {}
): void {
  const wb = XLSX.utils.book_new();

  // 1. Sheet Ringkasan Semua Rombel
  const summaryRows: any[][] = [
    [`REKAPITULASI PESERTA DIDIK PER ROMBONGAN BELAJAR`],
    [`${schoolProfile.namaSekolah} | TP ${activeTP}`],
    [],
    ['No', 'Rombongan Belajar (Kelas)', 'Nama Wali Kelas', 'NIP Wali Kelas', 'Laki-laki (L)', 'Perempuan (P)', 'Total Siswa'],
  ];

  let totalGrandL = 0;
  let totalGrandP = 0;
  let totalGrand = 0;

  availableClasses.forEach((kelas, idx) => {
    const classStudents = activeStudents.filter((s) => s.kelasSekarang === kelas && s.status === 'Aktif');
    const jmlL = classStudents.filter((s) => s.jenisKelamin === 'L').length;
    const jmlP = classStudents.filter((s) => s.jenisKelamin === 'P').length;
    const total = classStudents.length;

    totalGrandL += jmlL;
    totalGrandP += jmlP;
    totalGrand += total;

    const wali = waliKelasMap[kelas] || { nama: `Wali Kelas ${kelas}`, nip: '-' };

    summaryRows.push([idx + 1, kelas, wali.nama, wali.nip || '-', jmlL, jmlP, total]);
  });

  summaryRows.push([]);
  summaryRows.push(['', 'TOTAL KESELURUHAN', '', '', totalGrandL, totalGrandP, totalGrand]);

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [
    { wch: 6 },
    { wch: 24 },
    { wch: 28 },
    { wch: 20 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'REKAP_SEMUA_ROMBEL');

  // 2. Tambahkan sheet per rombel yang memiliki siswa
  availableClasses.forEach((kelas) => {
    const classStudents = activeStudents
      .filter((s) => s.kelasSekarang === kelas && s.status === 'Aktif')
      .sort((a, b) => a.namaLengkap.localeCompare(b.namaLengkap));

    if (classStudents.length === 0) return;

    const wali = waliKelasMap[kelas] || { nama: `Wali Kelas ${kelas}`, nip: '-' };
    const classRows: any[][] = [
      [`DAFTAR PESERTA DIDIK ${kelas.toUpperCase()} - ${schoolProfile.namaSekolah.toUpperCase()}`],
      [`TP: ${activeTP} | Wali Kelas: ${wali.nama} (NIP: ${wali.nip || '-'}) | Total: ${classStudents.length} Siswa`],
      [],
      ['No', 'NIS', 'NISN', 'Nama Lengkap Siswa', 'L/P', 'Tempat Lahir', 'Tanggal Lahir', 'Nama Ayah', 'Nama Ibu', 'No. HP Ortu', 'Alamat', 'Presensi S', 'Presensi I', 'Presensi A'],
    ];

    classStudents.forEach((s, idx) => {
      const parentPhone = s.ayah?.noHp || s.ibu?.noHp || s.wali?.noHp || '-';
      classRows.push([
        idx + 1,
        s.noInduk || '-',
        s.nisn || '-',
        s.namaLengkap,
        s.jenisKelamin,
        s.tempatLahir || '-',
        s.tanggalLahir || '-',
        s.ayah?.nama || '-',
        s.ibu?.nama || '-',
        parentPhone,
        s.alamat || '-',
        '',
        '',
        '',
      ]);
    });

    const wsClass = XLSX.utils.aoa_to_sheet(classRows);
    wsClass['!cols'] = [
      { wch: 6 },
      { wch: 14 },
      { wch: 14 },
      { wch: 32 },
      { wch: 6 },
      { wch: 16 },
      { wch: 14 },
      { wch: 22 },
      { wch: 22 },
      { wch: 18 },
      { wch: 30 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
    ];

    const safeSheetName = kelas.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 31);
    XLSX.utils.book_append_sheet(wb, wsClass, safeSheetName);
  });

  const cleanSchool = (schoolProfile.namaSekolah || 'SEKOLAH').replace(/[^a-zA-Z0-9]/g, '_');
  const cleanTP = activeTP.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `BUKU_ROMBEL_LENGKAP_${cleanSchool}_TP_${cleanTP}.xlsx`;

  XLSX.writeFile(wb, fileName);
}

// ============================================================================
// MODUL TEMPLATE & IMPOR DATA MUTASI SISWA (SURAT KETERANGAN PINDAH SEKOLAH)
// ============================================================================

export interface ParsedMutasiRowResult {
  rowNumber: number;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  studentIdentifier: {
    noInduk: string;
    nisn: string;
    namaLengkap: string;
  };
  studentBasics: {
    jenisKelamin: Gender;
    kelasSekarang: string;
  };
  mutationData: MutationRecord;
  matchedStudent?: Student;
  matchType: 'nisn' | 'nis' | 'nama' | 'none';
}

export interface ImportMutasiSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  matchedCount: number;
  newStudentCount: number;
  results: ParsedMutasiRowResult[];
}

/**
 * Header Kolom Resmi Template Impor Data Mutasi
 * Sesuai 100% dengan Form Pengisian Surat Keterangan Pindah Sekolah Kedinasan
 */
export const MUTASI_TEMPLATE_HEADERS = [
  'No',
  'NIS',
  'NISN',
  'Nama Lengkap Siswa',
  'Jenis Kelamin (L/P)',
  'Kelas / Tingkat Saat Pindah',
  'Nomor Surat Pindah',
  'Tanggal Surat',
  'Tempat Surat',
  'Nama Orang Tua / Wali Pemohon',
  'Pekerjaan Orang Tua / Wali',
  'Hubungan Pemohon',
  'Nama Sekolah Tujuan',
  'Desa / Kelurahan Tujuan',
  'Kecamatan Tujuan',
  'Kabupaten / Kota Tujuan',
  'Provinsi Tujuan',
  'Alasan Pindah',
  'Nama Kepala Sekolah',
  'NIP Kepala Sekolah',
  'Tahun Pelajaran Mutasi',
  'Keterangan',
];

/**
 * Contoh Baris Data Demo untuk Template Mutasi
 */
export const SAMPLE_MUTASI_ROWS = [
  [
    1,
    '2024045',
    '0123456789',
    'MUHAMMAD RIZKY PRATAMA',
    'L',
    '4',
    '422.1 /SDN-006/SB/X/2026/ 142',
    '2026-10-15',
    'Sungai Buluh',
    'NENI FITRIANI',
    'Mengurus Rumah Tangga',
    'Ibu Kandung',
    'SD Negeri 182 Pekanbaru',
    'Pasir Putih',
    'Air Dingin',
    'Kota Pekanbaru',
    'RIAU',
    'Mengikuti Orang Tua',
    'WINARNI,S.Pd.SD',
    '19790301 200801 2 017',
    '2026/2027',
    'Surat Keterangan Pindah Sekolah resmi telah diterbitkan.',
  ],
  [
    2,
    '2024088',
    '0134567890',
    'SITI AISYAH AZZAHRA',
    'P',
    '3',
    '422.1 /SDN-006/SB/X/2026/ 143',
    '2026-10-18',
    'Sungai Buluh',
    'SURYA DHARMA',
    'Wiraswasta',
    'Ayah Kandung',
    'SD Negeri 01 Bangkinang Kota',
    'Langgin',
    'Bangkinang Kota',
    'Kabupaten Kampar',
    'RIAU',
    'Pindah Domisili Keluarga',
    'WINARNI,S.Pd.SD',
    '19790301 200801 2 017',
    '2026/2027',
    'Buku Induk dan rapor telah diserahterimakan.',
  ],
];

/**
 * Petunjuk Pengisian Lembar Template Mutasi
 */
export const MUTASI_TEMPLATE_INSTRUCTIONS = [
  {
    NO: 1,
    KOLOM: 'NIS',
    KETERANGAN: 'Nomor Induk Siswa lokal di sekolah. Digunakan mencocokkan data di Buku Induk.',
    CONTOH: '2024045',
    STATUS: 'Sangat Disarankan',
  },
  {
    NO: 2,
    KOLOM: 'NISN',
    KETERANGAN: 'Nomor Induk Siswa Nasional (10 digit angka). Digunakan mencocokkan identitas siswa.',
    CONTOH: '0123456789',
    STATUS: 'Sangat Disarankan',
  },
  {
    NO: 3,
    KOLOM: 'Nama Lengkap Siswa',
    KETERANGAN: 'Nama lengkap peserta didik sesuai Akta Lahir / Buku Induk.',
    CONTOH: 'MUHAMMAD RIZKY PRATAMA',
    STATUS: 'WAJIB',
  },
  {
    NO: 4,
    KOLOM: 'Jenis Kelamin (L/P)',
    KETERANGAN: 'Isi "L" untuk Laki-Laki atau "P" untuk Perempuan.',
    CONTOH: 'L / P',
    STATUS: 'Disarankan',
  },
  {
    NO: 5,
    KOLOM: 'Kelas / Tingkat Saat Pindah',
    KETERANGAN: 'Kelas / tingkat terakhir saat meninggalkan sekolah (contoh: 4, Kelas 4, 5, dll).',
    CONTOH: '4',
    STATUS: 'WAJIB',
  },
  {
    NO: 6,
    KOLOM: 'Nomor Surat Pindah',
    KETERANGAN: 'Nomor register resmi Surat Keterangan Pindah Sekolah.',
    CONTOH: '422.1 /SDN-006/SB/X/2026/ 142',
    STATUS: 'WAJIB',
  },
  {
    NO: 7,
    KOLOM: 'Tanggal Surat',
    KETERANGAN: 'Tanggal surat diterbitkan / tanggal siswa meninggalkan sekolah (format: YYYY-MM-DD atau DD/MM/YYYY).',
    CONTOH: '2026-10-15',
    STATUS: 'WAJIB',
  },
  {
    NO: 8,
    KOLOM: 'Tempat Surat',
    KETERANGAN: 'Kota / Desa tempat surat pindah diterbitkan.',
    CONTOH: 'Sungai Buluh',
    STATUS: 'Disarankan',
  },
  {
    NO: 9,
    KOLOM: 'Nama Orang Tua / Wali Pemohon',
    KETERANGAN: 'Nama orang tua atau wali murid yang mengajukan permohonan pindah sekolah.',
    CONTOH: 'NENI FITRIANI',
    STATUS: 'Disarankan',
  },
  {
    NO: 10,
    KOLOM: 'Pekerjaan Orang Tua / Wali',
    KETERANGAN: 'Pekerjaan orang tua / wali pemohon (Ibu Rumah Tangga, Wiraswasta, PNS, Petani, dll).',
    CONTOH: 'Mengurus Rumah Tangga',
    STATUS: 'Disarankan',
  },
  {
    NO: 11,
    KOLOM: 'Hubungan Pemohon',
    KETERANGAN: 'Hubungan dengan siswa: Ibu Kandung, Ayah Kandung, atau Wali Murid.',
    CONTOH: 'Ibu Kandung',
    STATUS: 'Opsional',
  },
  {
    NO: 12,
    KOLOM: 'Nama Sekolah Tujuan',
    KETERANGAN: 'Nama lengkap satuan pendidikan tujuan mutasi siswa.',
    CONTOH: 'SD Negeri 182 Pekanbaru',
    STATUS: 'WAJIB',
  },
  {
    NO: 13,
    KOLOM: 'Desa / Kelurahan Tujuan',
    KETERANGAN: 'Desa / Kelurahan letak sekolah tujuan.',
    CONTOH: 'Pasir Putih',
    STATUS: 'Disarankan',
  },
  {
    NO: 14,
    KOLOM: 'Kecamatan Tujuan',
    KETERANGAN: 'Kecamatan letak sekolah tujuan.',
    CONTOH: 'Air Dingin',
    STATUS: 'Disarankan',
  },
  {
    NO: 15,
    KOLOM: 'Kabupaten / Kota Tujuan',
    KETERANGAN: 'Kabupaten / Kota letak sekolah tujuan.',
    CONTOH: 'Kota Pekanbaru',
    STATUS: 'Disarankan',
  },
  {
    NO: 16,
    KOLOM: 'Provinsi Tujuan',
    KETERANGAN: 'Provinsi letak sekolah tujuan.',
    CONTOH: 'RIAU',
    STATUS: 'Disarankan',
  },
  {
    NO: 17,
    KOLOM: 'Alasan Pindah',
    KETERANGAN: 'Alasan kepindahan: Mengikuti Orang Tua, Pindah Domisili, Jarak Rumah Jauh, dll.',
    CONTOH: 'Mengikuti Orang Tua',
    STATUS: 'WAJIB',
  },
  {
    NO: 18,
    KOLOM: 'Nama Kepala Sekolah',
    KETERANGAN: 'Nama Kepala Sekolah yang menandatangani Surat Keterangan Pindah Sekolah.',
    CONTOH: 'WINARNI,S.Pd.SD',
    STATUS: 'Disarankan',
  },
  {
    NO: 19,
    KOLOM: 'NIP Kepala Sekolah',
    KETERANGAN: 'NIP Kepala Sekolah penandatangan.',
    CONTOH: '19790301 200801 2 017',
    STATUS: 'Disarankan',
  },
  {
    NO: 20,
    KOLOM: 'Tahun Pelajaran Mutasi',
    KETERANGAN: 'Tahun pelajaran saat mutasi keluar dilakukan.',
    CONTOH: '2026/2027',
    STATUS: 'Disarankan',
  },
  {
    NO: 21,
    KOLOM: 'Keterangan',
    KETERANGAN: 'Catatan tambahan atau keterangan arsip berkas surat pindah.',
    CONTOH: 'Surat Keterangan Pindah Sekolah resmi telah diterbitkan.',
    STATUS: 'Opsional',
  },
];

/**
 * Unduh Template Excel untuk Data Mutasi & Surat Keterangan Pindah Sekolah
 */
export const downloadMutasiExcelTemplate = (
  schoolProfile?: Partial<SchoolProfile>
) => {
  const wb = XLSX.utils.book_new();

  const namaSekolah = schoolProfile?.namaSekolah || 'SDN 006 SUNGAI BULUH';
  const desa = schoolProfile?.desaKelurahan || schoolProfile?.desa || 'Sungai Buluh';
  const kepsek = schoolProfile?.namaKepalaSekolah || 'WINARNI,S.Pd.SD';
  const nipKepsek = schoolProfile?.nipKepalaSekolah || '19790301 200801 2 017';
  const tp = schoolProfile?.tahunPelajaranAktif || '2026/2027';

  // Customize demo row 1 with actual school defaults
  const customSample1 = [
    1,
    '2024045',
    '0123456789',
    'MUHAMMAD RIZKY PRATAMA',
    'L',
    '4',
    `422.1 /SDN-006/SB/X/${new Date().getFullYear()}/ 142`,
    new Date().toISOString().split('T')[0],
    desa,
    'NENI FITRIANI',
    'Mengurus Rumah Tangga',
    'Ibu Kandung',
    'SD Negeri 182 Pekanbaru',
    'Pasir Putih',
    'Air Dingin',
    'Kota Pekanbaru',
    'RIAU',
    'Mengikuti Orang Tua',
    kepsek,
    nipKepsek,
    tp,
    'Surat Keterangan Pindah Sekolah resmi telah diterbitkan.',
  ];

  const customSample2 = [
    2,
    '2024088',
    '0134567890',
    'SITI AISYAH AZZAHRA',
    'P',
    '3',
    `422.1 /SDN-006/SB/X/${new Date().getFullYear()}/ 143`,
    new Date().toISOString().split('T')[0],
    desa,
    'SURYA DHARMA',
    'Wiraswasta',
    'Ayah Kandung',
    'SD Negeri 01 Bangkinang Kota',
    'Langgin',
    'Bangkinang Kota',
    'Kabupaten Kampar',
    'RIAU',
    'Pindah Domisili Keluarga',
    kepsek,
    nipKepsek,
    tp,
    'Buku Induk dan rapor telah diserahterimakan.',
  ];

  const aoaData = [
    MUTASI_TEMPLATE_HEADERS,
    customSample1,
    customSample2,
  ];

  const wsData = XLSX.utils.aoa_to_sheet(aoaData);

  wsData['!cols'] = [
    { wch: 6 },  // No
    { wch: 14 }, // NIS
    { wch: 16 }, // NISN
    { wch: 30 }, // Nama Lengkap Siswa
    { wch: 18 }, // Jenis Kelamin
    { wch: 24 }, // Kelas Saat Pindah
    { wch: 32 }, // Nomor Surat Pindah
    { wch: 16 }, // Tanggal Surat
    { wch: 18 }, // Tempat Surat
    { wch: 28 }, // Nama Orang Tua / Wali Pemohon
    { wch: 26 }, // Pekerjaan Orang Tua / Wali
    { wch: 18 }, // Hubungan Pemohon
    { wch: 32 }, // Nama Sekolah Tujuan
    { wch: 22 }, // Desa / Kelurahan Tujuan
    { wch: 20 }, // Kecamatan Tujuan
    { wch: 22 }, // Kabupaten / Kota Tujuan
    { wch: 18 }, // Provinsi Tujuan
    { wch: 26 }, // Alasan Pindah
    { wch: 24 }, // Nama Kepala Sekolah
    { wch: 22 }, // NIP Kepala Sekolah
    { wch: 22 }, // Tahun Pelajaran Mutasi
    { wch: 36 }, // Keterangan
  ];

  XLSX.utils.book_append_sheet(wb, wsData, 'FORMAT_MUTASI_PINDAH');

  // Sheet 2: Petunjuk Pengisian
  const wsGuide = XLSX.utils.json_to_sheet(MUTASI_TEMPLATE_INSTRUCTIONS);
  wsGuide['!cols'] = [
    { wch: 6 },
    { wch: 30 },
    { wch: 64 },
    { wch: 30 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsGuide, 'PETUNJUK_PENGISIAN');

  const cleanSchool = namaSekolah.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `TEMPLATE_MUTASI_SISWA_PINDAH_SEKOLAH_${cleanSchool}.xlsx`;

  XLSX.writeFile(wb, fileName);
};

/**
 * Ekspor seluruh data siswa mutasi yang ada ke format spreadsheet Excel resmi
 */
export const exportMutasiToExcel = (
  mutatedStudents: Student[] = [],
  schoolProfile?: Partial<SchoolProfile>
) => {
  try {
    const wb = XLSX.utils.book_new();
    const namaSekolah = schoolProfile?.namaSekolah || 'SEKOLAH';

    const rows: any[][] = [
      MUTASI_TEMPLATE_HEADERS,
    ];

    mutatedStudents.forEach((s, idx) => {
      const m = s.mutasi || {};
      const dariKelasRaw = m.dariKelas || s.kelasSekarang || 'Kelas 1';
      const cleanClass = dariKelasRaw.replace(/^kelas\s*/i, '').trim() || dariKelasRaw;

      rows.push([
        idx + 1,
        s.noInduk || '',
        s.nisn || '',
        s.namaLengkap || '',
        s.jenisKelamin === 'P' ? 'P' : 'L',
        cleanClass,
        m.noSuratPindah || '',
        m.tglMeninggalkan || m.dikeluarkanTanggal || '',
        m.tempatSurat || schoolProfile?.desaKelurahan || 'Sungai Buluh',
        m.namaPemohon || s.ibu?.nama || s.ayah?.nama || '',
        m.pekerjaanPemohon || s.ibu?.pekerjaan || s.ayah?.pekerjaan || '',
        m.hubunganPemohon || (s.ibu?.nama ? 'Ibu Kandung' : s.ayah?.nama ? 'Ayah Kandung' : 'Wali Murid'),
        m.sekolahTujuan || '',
        m.desaKelurahanTujuan || '',
        m.kecamatanTujuan || '',
        m.kabupatenKotaTujuan || '',
        m.provinsiTujuan || '',
        m.alasanPindah || 'Mengikuti Orang Tua',
        m.namaKepalaSekolah || schoolProfile?.namaKepalaSekolah || '',
        m.nipKepalaSekolah || schoolProfile?.nipKepalaSekolah || '',
        m.tahunAjaran || schoolProfile?.tahunPelajaranAktif || '',
        m.keterangan || 'Surat Keterangan Pindah Sekolah telah diterbitkan.',
      ]);
    });

    const wsData = XLSX.utils.aoa_to_sheet(rows);
    wsData['!cols'] = [
      { wch: 6 },
      { wch: 14 },
      { wch: 16 },
      { wch: 30 },
      { wch: 18 },
      { wch: 24 },
      { wch: 32 },
      { wch: 16 },
      { wch: 18 },
      { wch: 28 },
      { wch: 26 },
      { wch: 18 },
      { wch: 32 },
      { wch: 22 },
      { wch: 20 },
      { wch: 22 },
      { wch: 18 },
      { wch: 26 },
      { wch: 24 },
      { wch: 22 },
      { wch: 22 },
      { wch: 36 },
    ];

    XLSX.utils.book_append_sheet(wb, wsData, 'DATA_MUTASI_SISWA');

    const cleanSchool = namaSekolah.replace(/[^a-zA-Z0-9]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `DATA_MUTASI_PINDAH_SEKOLAH_${cleanSchool}_${dateStr}.xlsx`;

    XLSX.writeFile(wb, fileName);
  } catch (err) {
    console.error('Gagal mengekspor data mutasi ke Excel:', err);
  }
};

/**
 * Normalize header label for fuzzy matching in Mutasi spreadsheet
 */
function normalizeHeaderKey(key: string): string {
  return String(key || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Parser file Excel / CSV data mutasi siswa
 */
export async function parseMutasiExcelFile(
  file: File,
  existingStudents: Student[] = []
): Promise<ImportMutasiSummary> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('Berkas Excel kosong atau tidak memiliki lembar kerja (worksheet).');
  }

  const sheet = workbook.Sheets[sheetName];
  const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('Lembar kerja Excel tidak memiliki data.');
  }

  // 1. Temukan baris header (pindai hingga baris ke-10)
  let headerRowIndex = -1;
  const targetKeywords = ['sekolah', 'tujuan', 'mutasi', 'pindah', 'surat', 'nis', 'nisn', 'siswa'];

  for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
    const row = rawRows[r];
    const joined = row.map(c => String(c).toLowerCase()).join(' ');
    const matchCount = targetKeywords.filter(k => joined.includes(k)).length;
    if (matchCount >= 2) {
      headerRowIndex = r;
      break;
    }
  }

  if (headerRowIndex === -1) {
    // Fallback: gunakan baris 0
    headerRowIndex = 0;
  }

  const headerRow = rawRows[headerRowIndex].map(c => String(c).trim());

  // Petakan indeks kolom berdasarkan nama header (dengan fuzzy matching)
  const colMap: Record<string, number> = {};

  headerRow.forEach((colName, idx) => {
    const norm = normalizeHeaderKey(colName);
    if (!norm) return;

    if (norm === 'nis' || norm === 'noinduk' || norm === 'nipd' || norm === 'nomorinduk' || norm === 'nislokal') {
      if (colMap.nis === undefined) colMap.nis = idx;
    } else if (norm === 'nisn' || norm === 'nonisn' || norm === 'nomorinduksiswanasional') {
      if (colMap.nisn === undefined) colMap.nisn = idx;
    } else if (norm.includes('nama') && (norm.includes('siswa') || norm.includes('lengkap') || norm.includes('peserta') || norm === 'nama')) {
      if (colMap.nama === undefined) colMap.nama = idx;
    } else if (norm === 'jk' || norm === 'jeniskelamin' || norm === 'lp' || norm === 'kelamin') {
      if (colMap.jk === undefined) colMap.jk = idx;
    } else if (norm.includes('kelas') || norm.includes('tingkat') || norm.includes('darikelas')) {
      if (colMap.kelas === undefined) colMap.kelas = idx;
    } else if (norm.includes('nosurat') || norm.includes('nomorsurat') || (norm.includes('surat') && norm.includes('pindah'))) {
      if (colMap.noSurat === undefined) colMap.noSurat = idx;
    } else if (norm.includes('tgl') || norm.includes('tanggal')) {
      if (colMap.tanggalSurat === undefined) colMap.tanggalSurat = idx;
    } else if (norm.includes('tempat') && norm.includes('surat')) {
      if (colMap.tempatSurat === undefined) colMap.tempatSurat = idx;
    } else if (norm.includes('pemohon') && norm.includes('nama')) {
      if (colMap.namaPemohon === undefined) colMap.namaPemohon = idx;
    } else if (norm.includes('pemohon') && (norm.includes('pekerjaan') || norm.includes('kerja'))) {
      if (colMap.pekerjaanPemohon === undefined) colMap.pekerjaanPemohon = idx;
    } else if (norm.includes('pemohon') && norm.includes('hubungan')) {
      if (colMap.hubunganPemohon === undefined) colMap.hubunganPemohon = idx;
    } else if (norm.includes('sekolah') && (norm.includes('tujuan') || norm.includes('ke'))) {
      if (colMap.sekolahTujuan === undefined) colMap.sekolahTujuan = idx;
    } else if (norm.includes('desa') || norm.includes('kelurahan')) {
      if (colMap.desaTujuan === undefined) colMap.desaTujuan = idx;
    } else if (norm.includes('kecamatan')) {
      if (colMap.kecamatanTujuan === undefined) colMap.kecamatanTujuan = idx;
    } else if (norm.includes('kabupaten') || norm.includes('kota')) {
      if (colMap.kabupatenTujuan === undefined) colMap.kabupatenTujuan = idx;
    } else if (norm.includes('provinsi')) {
      if (colMap.provinsiTujuan === undefined) colMap.provinsiTujuan = idx;
    } else if (norm.includes('alasan')) {
      if (colMap.alasanPindah === undefined) colMap.alasanPindah = idx;
    } else if (norm.includes('kepala') || norm.includes('kepsek') || norm.includes('penandatangan')) {
      if (norm.includes('nip')) {
        if (colMap.nipKepsek === undefined) colMap.nipKepsek = idx;
      } else {
        if (colMap.namaKepsek === undefined) colMap.namaKepsek = idx;
      }
    } else if (norm === 'nip' || norm === 'nipkepalasekolah') {
      if (colMap.nipKepsek === undefined) colMap.nipKepsek = idx;
    } else if (norm.includes('tahun') || norm.includes('tp') || norm.includes('ajaran')) {
      if (colMap.tahunAjaran === undefined) colMap.tahunAjaran = idx;
    } else if (norm.includes('ket') || norm.includes('keterangan') || norm.includes('catatan')) {
      if (colMap.keterangan === undefined) colMap.keterangan = idx;
    }
  });

  const getCell = (row: any[], colIndex: number | undefined): string => {
    if (colIndex === undefined || colIndex < 0 || colIndex >= row.length) return '';
    const v = row[colIndex];
    if (v === null || v === undefined) return '';
    return String(v).trim();
  };

  const results: ParsedMutasiRowResult[] = [];
  let validRows = 0;
  let invalidRows = 0;
  let matchedCount = 0;
  let newStudentCount = 0;

  for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    // Abaikan baris kosong
    const isRowEmpty = row.every(c => c === '' || c === null || c === undefined);
    if (isRowEmpty) continue;

    const errors: string[] = [];
    const warnings: string[] = [];

    const nis = getCell(row, colMap.nis);
    const nisn = getCell(row, colMap.nisn);
    const nama = getCell(row, colMap.nama);
    const jkRaw = getCell(row, colMap.jk).toUpperCase();
    const jk: Gender = jkRaw.startsWith('P') ? 'P' : 'L';
    const kelasRaw = getCell(row, colMap.kelas);
    const cleanKelas = kelasRaw.replace(/^kelas\s*/i, '').trim() || kelasRaw || '4';

    const noSurat = getCell(row, colMap.noSurat);
    const rawTgl = row[colMap.tanggalSurat ?? -1];
    let tanggalSurat = normalizeDate(rawTgl);
    if (!tanggalSurat || tanggalSurat === '2011-01-01') {
      tanggalSurat = new Date().toISOString().split('T')[0];
    }

    const tempatSurat = getCell(row, colMap.tempatSurat) || 'Sungai Buluh';
    const namaPemohon = getCell(row, colMap.namaPemohon);
    const pekerjaanPemohon = getCell(row, colMap.pekerjaanPemohon) || 'Mengurus Rumah Tangga';
    const hubunganPemohon = getCell(row, colMap.hubunganPemohon) || 'Orang Tua / Wali';

    const sekolahTujuan = getCell(row, colMap.sekolahTujuan);
    const desaTujuan = getCell(row, colMap.desaTujuan);
    const kecamatanTujuan = getCell(row, colMap.kecamatanTujuan);
    const kabupatenTujuan = getCell(row, colMap.kabupatenTujuan);
    const provinsiTujuan = getCell(row, colMap.provinsiTujuan) || 'RIAU';
    const alasanPindah = getCell(row, colMap.alasanPindah) || 'Mengikuti Orang Tua';

    const namaKepsek = getCell(row, colMap.namaKepsek);
    const nipKepsek = getCell(row, colMap.nipKepsek);
    const tahunAjaran = getCell(row, colMap.tahunAjaran);
    const keterangan = getCell(row, colMap.keterangan) || 'Surat Keterangan Pindah Sekolah resmi telah diterbitkan.';

    // Validasi esensial
    if (!nama) {
      errors.push('Nama Lengkap Siswa tidak boleh kosong.');
    }
    if (!sekolahTujuan) {
      errors.push('Nama Sekolah Tujuan tidak boleh kosong.');
    }
    if (!noSurat) {
      warnings.push('Nomor Surat Keterangan Pindah kosong, akan digenerate otomatis.');
    }

    // Matching dengan siswa Buku Induk
    let matchedStudent: Student | undefined = undefined;
    let matchType: 'nisn' | 'nis' | 'nama' | 'none' = 'none';

    if (nisn) {
      matchedStudent = existingStudents.find(s => s.nisn && s.nisn.trim() === nisn.trim());
      if (matchedStudent) matchType = 'nisn';
    }

    if (!matchedStudent && nis) {
      matchedStudent = existingStudents.find(s => s.noInduk && s.noInduk.trim() === nis.trim());
      if (matchedStudent) matchType = 'nis';
    }

    if (!matchedStudent && nama) {
      const cleanNama = nama.toLowerCase().replace(/[^a-z]/g, '');
      matchedStudent = existingStudents.find(s => {
        const targetClean = s.namaLengkap.toLowerCase().replace(/[^a-z]/g, '');
        return cleanNama === targetClean;
      });
      if (matchedStudent) matchType = 'nama';
    }

    if (matchedStudent) {
      matchedCount++;
    } else {
      newStudentCount++;
      warnings.push('Siswa belum terdaftar di Buku Induk (akan ditambahkan dengan status Mutasi Keluar).');
    }

    const isValid = errors.length === 0;
    if (isValid) {
      validRows++;
    } else {
      invalidRows++;
    }

    const mutationData: MutationRecord = {
      tglMeninggalkan: tanggalSurat,
      dikeluarkanTanggal: tanggalSurat,
      dariKelas: cleanKelas,
      sekolahTujuan: sekolahTujuan || 'Sekolah Tujuan',
      desaKelurahanTujuan: desaTujuan || '',
      kecamatanTujuan: kecamatanTujuan || '',
      kabupatenKotaTujuan: kabupatenTujuan || '',
      provinsiTujuan: provinsiTujuan || 'RIAU',
      alasanPindah: alasanPindah || 'Mengikuti Orang Tua',
      noSuratPindah: noSurat || `422.1 /SDN-006/SB/MUTASI/${Date.now().toString().slice(-4)}`,
      tempatSurat: tempatSurat || 'Sungai Buluh',
      namaPemohon: namaPemohon || matchedStudent?.ibu?.nama || matchedStudent?.ayah?.nama || 'Orang Tua / Wali',
      pekerjaanPemohon: pekerjaanPemohon || matchedStudent?.ibu?.pekerjaan || matchedStudent?.ayah?.pekerjaan || 'Wiraswasta',
      hubunganPemohon: hubunganPemohon || (matchedStudent?.ibu?.nama ? 'Ibu Kandung' : 'Ayah Kandung'),
      namaKepalaSekolah: namaKepsek || '',
      nipKepalaSekolah: nipKepsek || '',
      jabatanPenandatangan: 'Kepala Sekolah',
      tahunAjaran: tahunAjaran || '',
      keterangan: keterangan,
    };

    results.push({
      rowNumber: r + 1,
      isValid,
      errors,
      warnings,
      studentIdentifier: {
        noInduk: nis || matchedStudent?.noInduk || '',
        nisn: nisn || matchedStudent?.nisn || '',
        namaLengkap: nama || matchedStudent?.namaLengkap || '',
      },
      studentBasics: {
        jenisKelamin: jk,
        kelasSekarang: cleanKelas,
      },
      mutationData,
      matchedStudent,
      matchType,
    });
  }

  return {
    totalRows: results.length,
    validRows,
    invalidRows,
    matchedCount,
    newStudentCount,
    results,
  };
}


