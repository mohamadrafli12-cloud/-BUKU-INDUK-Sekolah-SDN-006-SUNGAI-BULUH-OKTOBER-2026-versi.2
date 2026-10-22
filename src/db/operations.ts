import { eq, desc } from 'drizzle-orm';
import { db, isSqlConfigured } from './index.ts';
import { students, schoolProfile, activityLogs } from './schema.ts';

// 1. Students Operations
export async function getAllStudentsFromDb() {
  if (!isSqlConfigured()) {
    return [];
  }
  try {
    const rows = await db.select().from(students).orderBy(students.namaLengkap);
    return rows.map((r) => r.data);
  } catch (error: any) {
    console.warn('Could not fetch students from DB (fallback to local state):', error?.message || error);
    return [];
  }
}

export async function upsertStudentToDb(studentData: any) {
  if (!isSqlConfigured()) {
    return null;
  }
  try {
    if (!studentData?.id) {
      throw new Error('Student ID is required');
    }

    const result = await db
      .insert(students)
      .values({
        id: studentData.id,
        noInduk: studentData.noInduk || '',
        nisn: studentData.nisn || '',
        nik: studentData.nik || '',
        namaLengkap: studentData.namaLengkap || 'Tanpa Nama',
        jenisKelamin: studentData.jenisKelamin || 'L',
        kelasSekarang: studentData.kelasSekarang || 'Kelas 1',
        status: studentData.status || 'Aktif',
        data: studentData,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: students.id,
        set: {
          noInduk: studentData.noInduk || '',
          nisn: studentData.nisn || '',
          nik: studentData.nik || '',
          namaLengkap: studentData.namaLengkap || 'Tanpa Nama',
          jenisKelamin: studentData.jenisKelamin || 'L',
          kelasSekarang: studentData.kelasSekarang || 'Kelas 1',
          status: studentData.status || 'Aktif',
          data: studentData,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error: any) {
    console.warn('Could not upsert student in SQL DB:', error?.message || error);
    return null;
  }
}

export async function deleteStudentFromDb(id: string) {
  if (!isSqlConfigured()) {
    return null;
  }
  try {
    const result = await db.delete(students).where(eq(students.id, id)).returning();
    return result[0];
  } catch (error: any) {
    console.warn(`Could not delete student ${id} from SQL DB:`, error?.message || error);
    return null;
  }
}

export async function syncAllStudentsToDb(studentList: any[]) {
  if (!isSqlConfigured()) {
    return { count: 0 };
  }
  try {
    if (!Array.isArray(studentList)) return { count: 0 };
    
    let processed = 0;
    for (const item of studentList) {
      if (item && item.id) {
        await upsertStudentToDb(item);
        processed++;
      }
    }
    return { count: processed };
  } catch (error: any) {
    console.warn('Could not bulk sync students to SQL DB:', error?.message || error);
    return { count: 0 };
  }
}

// 2. School Profile Operations
export async function getSchoolProfileFromDb() {
  if (!isSqlConfigured()) {
    return null;
  }
  try {
    const rows = await db.select().from(schoolProfile).where(eq(schoolProfile.id, 'default'));
    if (rows.length > 0) {
      return rows[0].data;
    }
    return null;
  } catch (error: any) {
    console.warn('Could not fetch school profile from SQL DB:', error?.message || error);
    return null;
  }
}

export async function upsertSchoolProfileToDb(profileData: any) {
  if (!isSqlConfigured()) {
    return null;
  }
  try {
    const result = await db
      .insert(schoolProfile)
      .values({
        id: 'default',
        namaSekolah: profileData.namaSekolah || 'SD NEGERI 006 BATAM KOTA',
        npsn: profileData.npsn || '10404456',
        data: profileData,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: schoolProfile.id,
        set: {
          namaSekolah: profileData.namaSekolah || 'SD NEGERI 006 BATAM KOTA',
          npsn: profileData.npsn || '10404456',
          data: profileData,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error: any) {
    console.warn('Could not upsert school profile in SQL DB:', error?.message || error);
    return null;
  }
}

// 3. Activity Logs Operations
export async function getAllActivityLogsFromDb() {
  if (!isSqlConfigured()) {
    return [];
  }
  try {
    const rows = await db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt));
    return rows.map((r) => ({
      id: r.id,
      timestamp: r.timestamp,
      user: r.user,
      role: r.role,
      action: r.action,
      description: r.description,
      targetId: r.targetId || undefined,
    }));
  } catch (error: any) {
    console.warn('Could not fetch activity logs from SQL DB:', error?.message || error);
    return [];
  }
}

export async function insertActivityLogToDb(log: any) {
  if (!isSqlConfigured()) {
    return null;
  }
  try {
    const result = await db
      .insert(activityLogs)
      .values({
        id: log.id || `log-${Date.now()}`,
        timestamp: log.timestamp || new Date().toLocaleString('id-ID'),
        user: log.user || 'Sistem',
        role: log.role || 'admin',
        action: log.action || 'PENGATURAN',
        description: log.description || '',
        targetId: log.targetId || null,
      })
      .onConflictDoNothing()
      .returning();

    return result[0];
  } catch (error: any) {
    console.warn('Could not insert activity log in SQL DB:', error?.message || error);
    return null;
  }
}

// 4. Stats & Status
export async function getDatabaseStats() {
  if (!isSqlConfigured()) {
    return {
      connected: false,
      dialect: 'PostgreSQL (Cloud SQL)',
      totalStudents: 0,
      totalLogs: 0,
      hasSchoolProfile: false,
      error: 'Cloud SQL belum dikonfigurasi (Kredensial SQL_HOST belum disetel)',
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const studentRows = await db.select({ id: students.id }).from(students);
    const logRows = await db.select({ id: activityLogs.id }).from(activityLogs);
    const profileRows = await db.select({ id: schoolProfile.id }).from(schoolProfile);

    return {
      connected: true,
      dialect: 'PostgreSQL (Cloud SQL)',
      totalStudents: studentRows.length,
      totalLogs: logRows.length,
      hasSchoolProfile: profileRows.length > 0,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.warn('Database stats query notice (offline or connecting):', error?.message || error);
    return {
      connected: false,
      dialect: 'PostgreSQL (Cloud SQL)',
      totalStudents: 0,
      totalLogs: 0,
      hasSchoolProfile: false,
      error: error?.message || 'Connection failed',
      timestamp: new Date().toISOString(),
    };
  }
}

