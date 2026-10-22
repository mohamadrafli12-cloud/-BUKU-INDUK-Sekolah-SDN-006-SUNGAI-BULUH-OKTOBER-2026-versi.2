import { pgTable, serial, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

// 1. Users table (Mandatory for Firebase Auth + Cloud SQL integration)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name'),
  role: text('role').default('admin').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. Students table (Buku Induk Register Peserta Didik)
export const students = pgTable('students', {
  id: text('id').primaryKey(), // e.g. std-001 or UUID
  noInduk: text('no_induk'),
  nisn: text('nisn'),
  nik: text('nik'),
  namaLengkap: text('nama_lengkap').notNull(),
  jenisKelamin: text('jenis_kelamin').notNull(), // 'L' | 'P'
  kelasSekarang: text('kelas_sekarang').notNull(),
  status: text('status').default('Aktif').notNull(),
  data: jsonb('data').notNull(), // Full student object including health, parent, raport, mutasi, sttb
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 3. School Profile table
export const schoolProfile = pgTable('school_profile', {
  id: text('id').primaryKey(), // 'default'
  namaSekolah: text('nama_sekolah').notNull(),
  npsn: text('npsn').notNull(),
  data: jsonb('data').notNull(), // Full SchoolProfile object
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 4. Activity Logs table
export const activityLogs = pgTable('activity_logs', {
  id: text('id').primaryKey(),
  timestamp: text('timestamp').notNull(),
  user: text('user').notNull(),
  role: text('role').notNull(),
  action: text('action').notNull(),
  description: text('description').notNull(),
  targetId: text('target_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 5. System & Security Settings
export const systemSettings = pgTable('system_settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
