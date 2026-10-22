import { Student, SchoolProfile, AdminUser, ActivityLog } from '../types';

export interface DbBackupParseResult {
  success: boolean;
  format: 'db_snapshot' | 'db_sql' | 'json';
  formatLabel: string;
  students: Student[];
  schoolProfile?: SchoolProfile;
  adminUsers?: AdminUser[];
  rolePermissions?: any;
  securitySettings?: any;
  activityLogs?: ActivityLog[];
  exportedAt?: string;
  schoolName?: string;
  studentCount: number;
  classesSummary: Record<string, number>;
  statusSummary: Record<string, number>;
  sampleStudents: {
    noInduk: string;
    nisn: string;
    namaLengkap: string;
    kelasSekarang: string;
    status: string;
    jenisKelamin: string;
  }[];
  rawContent: string;
  fileName: string;
  fileSize: number;
  errorMessage?: string;
}

/**
 * Parses raw text from a .db file (or .json backup file).
 * Supports:
 * 1. .db with embedded -- SNAPSHOT_JSON_START:...:SNAPSHOT_JSON_END
 * 2. Raw JSON string
 * 3. SQL dump containing INSERT statements for students & school_profile
 */
export function parseDbBackupText(rawText: string, fileName: string = 'database.db', fileSize: number = 0): DbBackupParseResult {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return {
      success: false,
      format: 'db_sql',
      formatLabel: 'Format Tidak Dikenal',
      students: [],
      studentCount: 0,
      classesSummary: {},
      statusSummary: {},
      sampleStudents: [],
      rawContent: rawText,
      fileName,
      fileSize,
      errorMessage: 'Berkas database kosong atau tidak terbaca.',
    };
  }

  // 1. Try checking for embedded snapshot in .db file
  if (trimmed.includes('-- SNAPSHOT_JSON_START:')) {
    const match = trimmed.match(/-- SNAPSHOT_JSON_START:(.*?):SNAPSHOT_JSON_END/s);
    if (match && match[1]) {
      try {
        const parsed = JSON.parse(match[1].trim());
        if (parsed && Array.isArray(parsed.students)) {
          return buildSuccessResult(parsed, 'db_snapshot', 'Berkas .DB (Snapshot Resmi Lengkap)', trimmed, fileName, fileSize);
        }
      } catch (e) {
        console.warn('Gagal membaca embedded snapshot:', e);
      }
    }
  }

  // 2. Try direct JSON parse (if .db file was exported directly as JSON or renamed)
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && Array.isArray(parsed.students)) {
        return buildSuccessResult(parsed, 'json', 'Cadangan JSON Terstruktur', trimmed, fileName, fileSize);
      }
    } catch {
      // Continue to SQL parsing
    }
  }

  // 3. Try parsing SQL INSERT statements (for pure SQL / SQLite .db dump files)
  try {
    const students: Student[] = [];
    let schoolProfile: SchoolProfile | undefined = undefined;

    // Extract school_profile from SQL if exists
    const schoolMatch = trimmed.match(/INSERT (?:OR REPLACE )?INTO school_profile.*?VALUES\s*\((.*?)\);/is);
    if (schoolMatch && schoolMatch[1]) {
      try {
        // Look for JSON object inside VALUES
        const jsonMatch = schoolMatch[1].match(/(\{.*?\})/);
        if (jsonMatch && jsonMatch[1]) {
          schoolProfile = JSON.parse(jsonMatch[1].replace(/''/g, "'"));
        }
      } catch (e) {
        console.warn('Gagal parse school_profile dari SQL:', e);
      }
    }

    // Extract students from SQL statements
    const studentInsertRegex = /INSERT (?:OR REPLACE )?INTO students\s*\([^)]*\)\s*VALUES\s*\((.*?)\);/gis;
    let match: RegExpExecArray | null;

    while ((match = studentInsertRegex.exec(trimmed)) !== null) {
      const valuesString = match[1];
      // Check if there is an embedded JSON representation in the `data` column
      const jsonObjMatch = valuesString.match(/'(\{.*?\})'/s);
      if (jsonObjMatch && jsonObjMatch[1]) {
        try {
          const unescaped = jsonObjMatch[1].replace(/''/g, "'");
          const studentObj = JSON.parse(unescaped) as Student;
          if (studentObj && studentObj.namaLengkap) {
            students.push(studentObj);
            continue;
          }
        } catch {
          // Fallback to column extraction
        }
      }

      // Fallback: parse values manually by comma splitting with quote awareness
      const cols = splitSqlValues(valuesString);
      if (cols.length >= 7) {
        // Format: id, no_induk, nisn, nik, nama_lengkap, jenis_kelamin, kelas_sekarang, status, ...
        const id = unquote(cols[0]) || `std-${Date.now()}-${students.length}`;
        const noInduk = unquote(cols[1]) || '';
        const nisn = unquote(cols[2]) || '';
        const nik = unquote(cols[3]) || '';
        const namaLengkap = unquote(cols[4]) || 'Tanpa Nama';
        const jenisKelamin = (unquote(cols[5]) === 'P' ? 'P' : 'L') as 'L' | 'P';
        const kelasSekarang = unquote(cols[6]) || '1A';
        const status = (unquote(cols[7]) || 'Aktif') as any;

        students.push({
          id,
          noInduk,
          nisn,
          nik,
          namaLengkap,
          namaPanggilan: namaLengkap.split(' ')[0] || '',
          jenisKelamin,
          tempatLahir: 'Indonesia',
          tanggalLahir: '2016-01-01',
          agama: 'Islam',
          kewarganegaraan: 'WNI',
          anakKe: 1,
          jumlahSaudaraKandung: 0,
          jumlahSaudaraTiri: 0,
          jumlahSaudaraAngkat: 0,
          statusKeluarga: 'Anak Kandung',
          bahasaIbu: 'Bahasa Indonesia',
          alamat: 'Alamat Siswa',
          rt: '01',
          rw: '01',
          kelurahanDesa: 'Desa',
          kecamatan: 'Kecamatan',
          kabupatenKota: 'Kabupaten',
          provinsi: 'Provinsi',
          kodePos: '12345',
          tinggalDengan: 'Orang Tua',
          jarakKeSekolahKm: 1,
          transportasi: 'Jalan Kaki',
          kesehatan: {
            golonganDarah: 'Tidak Tahu',
            penyakitPernahDiderita: '-',
            kelainanJasmani: '-',
            tinggiBadanCm: 120,
            beratBadanKg: 25,
          },
          ayah: {
            nama: 'Orang Tua',
            nik: '',
            tahunLahir: '1985',
            agama: 'Islam',
            kewarganegaraan: 'WNI',
            pendidikan: 'SMA / Sederajat',
            pekerjaan: 'Karyawan Swasta',
            penghasilanBulanan: '3.000.000 - 5.000.000',
            alamat: '',
            noHp: '',
            statusHidup: 'Masih Hidup',
          },
          ibu: {
            nama: 'Ibu',
            nik: '',
            tahunLahir: '1988',
            agama: 'Islam',
            kewarganegaraan: 'WNI',
            pendidikan: 'SMA / Sederajat',
            pekerjaan: 'Ibu Rumah Tangga',
            penghasilanBulanan: 'Tidak Berpenghasilan',
            alamat: '',
            noHp: '',
            statusHidup: 'Masih Hidup',
          },
          sekolahAsalTK: '-',
          tanggalDiterima: '2022-07-15',
          diterimaDiKelas: kelasSekarang,
          kelasSekarang,
          status,
          tahunMasuk: '2022',
          raport: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    if (students.length > 0) {
      return buildSuccessResult(
        { students, schoolProfile },
        'db_sql',
        'Berkas .DB (Skema DDL / SQL Dump)',
        trimmed,
        fileName,
        fileSize
      );
    }
  } catch (err: any) {
    console.error('Error saat parsing SQL .db:', err);
  }

  return {
    success: false,
    format: 'db_sql',
    formatLabel: 'Format Tidak Dikenal',
    students: [],
    studentCount: 0,
    classesSummary: {},
    statusSummary: {},
    sampleStudents: [],
    rawContent: rawText,
    fileName,
    fileSize,
    errorMessage: 'Berkas .db tidak memuat struktur tabel atau data siswa yang dapat dipulihkan.',
  };
}

/**
 * Helper to build the successful DbBackupParseResult
 */
function buildSuccessResult(
  data: any,
  format: 'db_snapshot' | 'db_sql' | 'json',
  formatLabel: string,
  rawContent: string,
  fileName: string,
  fileSize: number
): DbBackupParseResult {
  const students: Student[] = Array.isArray(data.students) ? data.students : [];
  const schoolProfile: SchoolProfile | undefined = data.schoolProfile;
  const adminUsers: AdminUser[] | undefined = data.adminUsers;
  const activityLogs: ActivityLog[] | undefined = data.activityLogs;

  const classesSummary: Record<string, number> = {};
  const statusSummary: Record<string, number> = {};

  students.forEach((s) => {
    const kls = s.kelasSekarang || 'Lainnya';
    classesSummary[kls] = (classesSummary[kls] || 0) + 1;

    const st = s.status || 'Aktif';
    statusSummary[st] = (statusSummary[st] || 0) + 1;
  });

  const sampleStudents = students.slice(0, 5).map((s) => ({
    noInduk: s.noInduk || '-',
    nisn: s.nisn || '-',
    namaLengkap: s.namaLengkap,
    kelasSekarang: s.kelasSekarang || '-',
    status: s.status || 'Aktif',
    jenisKelamin: s.jenisKelamin || 'L',
  }));

  return {
    success: true,
    format,
    formatLabel,
    students,
    schoolProfile,
    adminUsers,
    rolePermissions: data.rolePermissions,
    securitySettings: data.securitySettings,
    activityLogs,
    exportedAt: data.exportedAt,
    schoolName: schoolProfile?.namaSekolah || data.schoolName,
    studentCount: students.length,
    classesSummary,
    statusSummary,
    sampleStudents,
    rawContent,
    fileName,
    fileSize,
  };
}

/**
 * Splits SQL values inside VALUES (...) keeping string literals intact
 */
function splitSqlValues(str: string): string[] {
  const result: string[] = [];
  let current = '';
  let inString = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === "'") {
      if (inString && str[i + 1] === "'") {
        current += "'";
        i++; // skip escaped quote
      } else {
        inString = !inString;
      }
    } else if (char === ',' && !inString) {
      result.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  if (current.trim()) {
    result.push(current.trim());
  }
  return result;
}

function unquote(val: string): string {
  if (!val) return '';
  const t = val.trim();
  if (t.startsWith("'") && t.endsWith("'")) {
    return t.slice(1, -1).replace(/''/g, "'");
  }
  return t;
}

/**
 * Async parser for File object
 */
export function parseDbBackupFile(file: File): Promise<DbBackupParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = (e.target?.result as string) || '';
      const result = parseDbBackupText(content, file.name, file.size);
      resolve(result);
    };
    reader.onerror = () => {
      resolve({
        success: false,
        format: 'db_sql',
        formatLabel: 'Error Membaca Berkas',
        students: [],
        studentCount: 0,
        classesSummary: {},
        statusSummary: {},
        sampleStudents: [],
        rawContent: '',
        fileName: file.name,
        fileSize: file.size,
        errorMessage: 'Terjadi kesalahan saat membaca file dari disk.',
      });
    };
    reader.readAsText(file);
  });
}
