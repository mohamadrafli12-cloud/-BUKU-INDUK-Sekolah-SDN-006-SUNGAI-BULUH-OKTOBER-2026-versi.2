import { Student, SchoolProfile, ActivityLog } from '../types';
import { auth } from '../lib/firebase';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (err) {
    console.warn('Could not get Firebase ID token:', err);
  }
  return headers;
}

export interface SqlStatusResponse {
  connected: boolean;
  dialect: string;
  totalStudents?: number;
  totalLogs?: number;
  hasSchoolProfile?: boolean;
  timestamp: string;
  error?: string;
}

export async function checkSqlStatus(): Promise<SqlStatusResponse> {
  try {
    const res = await fetch('/api/sql/status');
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } catch (error: any) {
    return {
      connected: false,
      dialect: 'PostgreSQL (Cloud SQL)',
      timestamp: new Date().toISOString(),
      error: error.message || 'Gagal tersambung ke server',
    };
  }
}

export async function fetchStudentsFromSql(): Promise<Student[] | null> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/sql/students', { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.success ? (json.data as Student[]) : null;
  } catch (error) {
    console.error('fetchStudentsFromSql failed:', error);
    return null;
  }
}

export async function saveStudentToSql(student: Student): Promise<boolean> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/sql/students', {
      method: 'POST',
      headers,
      body: JSON.stringify(student),
    });
    return res.ok;
  } catch (error) {
    console.error('saveStudentToSql failed:', error);
    return false;
  }
}

export async function deleteStudentFromSql(studentId: string): Promise<boolean> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/sql/students/${encodeURIComponent(studentId)}`, {
      method: 'DELETE',
      headers,
    });
    return res.ok;
  } catch (error) {
    console.error('deleteStudentFromSql failed:', error);
    return false;
  }
}

export async function saveSchoolProfileToSql(profile: SchoolProfile): Promise<boolean> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/sql/school-profile', {
      method: 'POST',
      headers,
      body: JSON.stringify(profile),
    });
    return res.ok;
  } catch (error) {
    console.error('saveSchoolProfileToSql failed:', error);
    return false;
  }
}

export async function syncAllToSql(
  students: Student[],
  schoolProfile: SchoolProfile,
  logs: ActivityLog[]
): Promise<{ success: boolean; message: string; stats?: any }> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/sql/sync-all', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        students,
        schoolProfile,
        logs: logs.slice(0, 50),
      }),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (error: any) {
    console.error('syncAllToSql failed:', error);
    return {
      success: false,
      message: error.message || 'Gagal sinkronisasi data ke Cloud SQL',
    };
  }
}
