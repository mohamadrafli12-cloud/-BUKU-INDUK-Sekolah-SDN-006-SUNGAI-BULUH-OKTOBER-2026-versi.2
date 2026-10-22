import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { requireAuth, optionalAuth, AuthRequest } from './src/middleware/auth.ts';
import { getOrCreateUser } from './src/db/users.ts';
import { isSqlConfigured } from './src/db/index.ts';
import {
  getAllStudentsFromDb,
  upsertStudentToDb,
  deleteStudentFromDb,
  syncAllStudentsToDb,
  getSchoolProfileFromDb,
  upsertSchoolProfileToDb,
  getAllActivityLogsFromDb,
  insertActivityLogToDb,
  getDatabaseStats,
} from './src/db/operations.ts';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // JSON Body Parser with ample limit for student records & images
  app.use(express.json({ limit: '50mb' }));

  // ================= API ROUTES (FIRST) =================

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Database Connection Status
  app.get('/api/sql/status', async (req, res) => {
    try {
      const stats = await getDatabaseStats();
      res.json(stats);
    } catch (error: any) {
      res.json({
        connected: false,
        dialect: 'PostgreSQL (Cloud SQL)',
        totalStudents: 0,
        totalLogs: 0,
        hasSchoolProfile: false,
        error: error?.message || 'Database connection offline',
      });
    }
  });

  // User Auth & Registration Sync (Firebase Auth integration)
  app.post('/api/auth/sync-user', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthenticated' });
      }
      const user = await getOrCreateUser(req.user.uid, req.user.email || '', req.user.name);
      res.json({ success: true, user });
    } catch (error: any) {
      console.warn('Notice in /api/auth/sync-user:', error?.message || error);
      res.json({ success: true, user: { uid: req.user?.uid, email: req.user?.email, role: 'admin' } });
    }
  });

  // Students API
  app.get('/api/sql/students', optionalAuth, async (req, res) => {
    try {
      if (!isSqlConfigured()) {
        return res.json({ success: false, message: 'Database SQL belum dikonfigurasi', data: [] });
      }
      const students = await getAllStudentsFromDb();
      res.json({ success: true, data: students });
    } catch (error: any) {
      res.json({ success: false, error: error?.message || 'Gagal memuat siswa', data: [] });
    }
  });

  app.post('/api/sql/students', optionalAuth, async (req, res) => {
    try {
      if (!isSqlConfigured()) {
        return res.json({ success: false, message: 'Database SQL belum dikonfigurasi' });
      }
      const student = req.body;
      const saved = await upsertStudentToDb(student);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.json({ success: false, error: error?.message || 'Gagal menyimpan siswa' });
    }
  });

  app.delete('/api/sql/students/:id', optionalAuth, async (req, res) => {
    try {
      if (!isSqlConfigured()) {
        return res.json({ success: false, message: 'Database SQL belum dikonfigurasi' });
      }
      const { id } = req.params;
      await deleteStudentFromDb(id);
      res.json({ success: true, message: `Student ${id} deleted` });
    } catch (error: any) {
      res.json({ success: false, error: error?.message || 'Gagal menghapus siswa' });
    }
  });

  // School Profile API
  app.get('/api/sql/school-profile', optionalAuth, async (req, res) => {
    try {
      if (!isSqlConfigured()) {
        return res.json({ success: false, message: 'Database SQL belum dikonfigurasi', data: null });
      }
      const profile = await getSchoolProfileFromDb();
      res.json({ success: true, data: profile });
    } catch (error: any) {
      res.json({ success: false, error: error?.message, data: null });
    }
  });

  app.post('/api/sql/school-profile', optionalAuth, async (req, res) => {
    try {
      if (!isSqlConfigured()) {
        return res.json({ success: false, message: 'Database SQL belum dikonfigurasi' });
      }
      const profile = req.body;
      const saved = await upsertSchoolProfileToDb(profile);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.json({ success: false, error: error?.message });
    }
  });

  // Activity Logs API
  app.get('/api/sql/activity-logs', optionalAuth, async (req, res) => {
    try {
      if (!isSqlConfigured()) {
        return res.json({ success: false, message: 'Database SQL belum dikonfigurasi', data: [] });
      }
      const logs = await getAllActivityLogsFromDb();
      res.json({ success: true, data: logs });
    } catch (error: any) {
      res.json({ success: false, error: error?.message, data: [] });
    }
  });

  app.post('/api/sql/activity-logs', optionalAuth, async (req, res) => {
    try {
      if (!isSqlConfigured()) {
        return res.json({ success: false, message: 'Database SQL belum dikonfigurasi' });
      }
      const log = req.body;
      const saved = await insertActivityLogToDb(log);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.json({ success: false, error: error?.message });
    }
  });

  // Full Database Synchronization (Local <-> Cloud SQL PostgreSQL)
  app.post('/api/sql/sync-all', optionalAuth, async (req, res) => {
    try {
      if (!isSqlConfigured()) {
        return res.json({
          success: false,
          message: 'Cloud SQL belum dikonfigurasi. Pastikan variabel SQL_HOST telah diisi di pengaturan.',
          syncedStudents: 0,
        });
      }

      const { students: studentList, schoolProfile: profile, logs } = req.body;

      let studentResult = { count: 0 };
      if (studentList && Array.isArray(studentList)) {
        studentResult = await syncAllStudentsToDb(studentList);
      }

      if (profile) {
        await upsertSchoolProfileToDb(profile);
      }

      if (logs && Array.isArray(logs)) {
        for (const l of logs) {
          await insertActivityLogToDb(l);
        }
      }

      const stats = await getDatabaseStats();
      res.json({
        success: true,
        message: 'Data berhasil disinkronkan ke PostgreSQL Cloud SQL',
        syncedStudents: studentResult.count,
        stats,
      });
    } catch (error: any) {
      console.warn('Notice during database sync:', error?.message || error);
      res.json({ success: false, error: error?.message || 'Sync failed' });
    }
  });

  // ================= VITE / STATIC SERVING =================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT} with PostgreSQL Cloud SQL support`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});

