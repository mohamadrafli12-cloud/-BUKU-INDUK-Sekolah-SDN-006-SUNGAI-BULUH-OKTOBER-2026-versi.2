import { Student } from '../types';

const DB_NAME = 'buku_induk_storage_v1';
const DB_STORE_NAME = 'keyval';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase | null> | null = null;

/**
 * Open or get singleton IndexedDB instance safely
 */
export function getIDBDatabase(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(DB_STORE_NAME)) {
          db.createObjectStore(DB_STORE_NAME);
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = (e) => {
        console.warn('[storageHelper] IndexedDB open error:', e);
        resolve(null);
      };

      request.onblocked = () => {
        console.warn('[storageHelper] IndexedDB open blocked');
        resolve(null);
      };
    } catch (err) {
      console.warn('[storageHelper] IndexedDB not available:', err);
      resolve(null);
    }
  });

  return dbPromise;
}

/**
 * Put value into IndexedDB asynchronously
 */
export async function idbSet<T = any>(key: string, value: T): Promise<boolean> {
  try {
    const db = await getIDBDatabase();
    if (!db) return false;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(DB_STORE_NAME, 'readwrite');
        const store = tx.objectStore(DB_STORE_NAME);
        const req = store.put(value, key);

        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      } catch (err) {
        console.warn(`[storageHelper] idbSet failed for ${key}:`, err);
        resolve(false);
      }
    });
  } catch {
    return false;
  }
}

/**
 * Get value from IndexedDB asynchronously
 */
export async function idbGet<T = any>(key: string): Promise<T | null> {
  try {
    const db = await getIDBDatabase();
    if (!db) return null;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(DB_STORE_NAME, 'readonly');
        const store = tx.objectStore(DB_STORE_NAME);
        const req = store.get(key);

        req.onsuccess = () => {
          resolve(req.result !== undefined ? (req.result as T) : null);
        };
        req.onerror = () => resolve(null);
      } catch (err) {
        console.warn(`[storageHelper] idbGet failed for ${key}:`, err);
        resolve(null);
      }
    });
  } catch {
    return null;
  }
}

/**
 * Delete key from IndexedDB
 */
export async function idbDelete(key: string): Promise<boolean> {
  try {
    const db = await getIDBDatabase();
    if (!db) return false;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(DB_STORE_NAME, 'readwrite');
        const store = tx.objectStore(DB_STORE_NAME);
        const req = store.delete(key);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  } catch {
    return false;
  }
}

/**
 * Remove stale or volatile localStorage entries when space is tight
 */
export function cleanupVolatileStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (
        k && 
        (
          k.startsWith('buku_induk_draft_') || 
          k.startsWith('buku_induk_temp_') ||
          k.includes('draft') ||
          k.includes('temp') ||
          k.includes('backup_cache') ||
          k.includes('foto_preview')
        )
      ) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {}
    });

    // Trim activity logs in localStorage if they exceed 30KB
    const rawLogs = localStorage.getItem('buku_induk_logs_v1');
    if (rawLogs && rawLogs.length > 30000) {
      try {
        const parsed = JSON.parse(rawLogs);
        if (Array.isArray(parsed)) {
          localStorage.setItem('buku_induk_logs_v1', JSON.stringify(parsed.slice(0, 15)));
        }
      } catch {}
    }
  } catch (err) {
    console.warn('[storageHelper] cleanupVolatileStorage error:', err);
  }
}

/**
 * Proactively repair and free localStorage quota without losing student records:
 * 1. Cleans volatile draft/temp keys.
 * 2. Compresses existing 'buku_induk_students_v1' in localStorage by removing heavy base64 images
 *    (full data is preserved in IndexedDB).
 * 3. Compacts activity logs.
 */
export function repairStorageQuota(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    cleanupVolatileStorage();

    // 1. Check and compress existing student cache in localStorage
    const savedStudents = localStorage.getItem('buku_induk_students_v1');
    if (savedStudents) {
      try {
        const parsed = JSON.parse(savedStudents);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Backup to IDB first
          idbSet('students', parsed).catch(() => {});
          // Replace localStorage with ultra-lean version
          const ultraLean = createLeanStudentsForLocalStorage(parsed, true);
          localStorage.setItem('buku_induk_students_v1', JSON.stringify(ultraLean));
        }
      } catch (err) {
        console.warn('[storageHelper] Error compressing student cache during quota repair:', err);
      }
    }

    // 2. Compact activity logs in localStorage
    const savedLogs = localStorage.getItem('buku_induk_logs_v1');
    if (savedLogs) {
      try {
        const parsedLogs = JSON.parse(savedLogs);
        if (Array.isArray(parsedLogs) && parsedLogs.length > 10) {
          localStorage.setItem('buku_induk_logs_v1', JSON.stringify(parsedLogs.slice(0, 10)));
        }
      } catch {}
    }
  } catch (err) {
    console.warn('[storageHelper] repairStorageQuota encountered error:', err);
  }
}

/**
 * Safely get from localStorage with fallback
 */
export function safeLocalStorageGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined' || !window.localStorage) return fallback;
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    return JSON.parse(saved) as T;
  } catch {
    return fallback;
  }
}

/**
 * Safely set localStorage with quota fallback, auto-cleanup, and zero crashes.
 * Never throws an uncaught QuotaExceededError!
 */
export function safeLocalStorageSet(key: string, value: string): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: any) {
    const isQuota =
      err?.name === 'QuotaExceededError' ||
      err?.code === 22 ||
      err?.code === 1014 ||
      (typeof err?.message === 'string' && err.message.toLowerCase().includes('quota'));

    if (isQuota) {
      console.warn(`[storageHelper] Quota exceeded when saving "${key}". Cleaning volatile items & retrying...`);
      cleanupVolatileStorage();

      try {
        localStorage.setItem(key, value);
        return true;
      } catch (retryErr) {
        console.warn(`[storageHelper] localStorage still exceeded quota after cleanup for "${key}". Engaging deep repair.`);
        try {
          repairStorageQuota();
          localStorage.setItem(key, value);
          return true;
        } catch (deepErr) {
          console.warn(`[storageHelper] Unable to save "${key}" into localStorage even after deep repair. Stored in memory/IndexedDB only.`);
          return false;
        }
      }
    }
    console.warn(`[storageHelper] localStorage.setItem failed for "${key}":`, err);
    return false;
  }
}

/**
 * Safely remove from localStorage
 */
export function safeLocalStorageRemove(key: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.removeItem(key);
  } catch {}
}

/**
 * Strip heavy base64 images from student records for ultra-compact localStorage backup,
 * while IndexedDB retains 100% full-resolution scans and pasfoto.
 */
export function createLeanStudentsForLocalStorage(students: Student[], ultraMode = false): Student[] {
  return students.map((s) => {
    let lean = { ...s };

    // Strip large base64 profile pictures
    if (lean.fotoUrl && lean.fotoUrl.startsWith('data:')) {
      if (ultraMode || lean.fotoUrl.length > 15000) {
        // Keep empty so UI loads instant default avatar
        lean = {
          ...lean,
          fotoUrl: '',
        };
      }
    }

    // Strip large base64 mutasi scans
    if (lean.mutasi?.fotoIjazah && lean.mutasi.fotoIjazah.startsWith('data:')) {
      if (ultraMode || lean.mutasi.fotoIjazah.length > 15000) {
        lean = {
          ...lean,
          mutasi: {
            ...lean.mutasi,
            fotoIjazah: '[IDB_STORED]',
          },
        };
      }
    }

    // Strip large base64 sttb / ijazah scans
    if (lean.sttb?.fotoIjazah && lean.sttb.fotoIjazah.startsWith('data:')) {
      if (ultraMode || lean.sttb.fotoIjazah.length > 15000) {
        lean = {
          ...lean,
          sttb: {
            ...lean.sttb,
            fotoIjazah: '[IDB_STORED]',
          },
        };
      }
    }

    return lean;
  });
}

/**
 * Save students resiliently:
 * 1. Asynchronously into IndexedDB (persists all photos, documents, scans without quota limits).
 * 2. Synchronously into localStorage as fast boot cache:
 *    - Automatically optimizes if photos or record count are large.
 *    - Never throws QuotaExceededError!
 */
export function persistStudentsResiliently(
  storageKey: string,
  students: Student[]
): void {
  // 1. IndexedDB persistence (unlimited storage, full fidelity)
  idbSet('students', students).catch((err) => {
    console.warn('[storageHelper] Failed to persist students to IndexedDB:', err);
  });

  // 2. LocalStorage persistence (fast synchronous startup cache)
  try {
    const hasHeavyImages = students.some(s => 
      (s.fotoUrl && s.fotoUrl.startsWith('data:') && s.fotoUrl.length > 8000) ||
      (s.mutasi?.fotoIjazah && s.mutasi.fotoIjazah.startsWith('data:')) ||
      (s.sttb?.fotoIjazah && s.sttb.fotoIjazah.startsWith('data:'))
    );

    if (hasHeavyImages || students.length > 30) {
      const lean = createLeanStudentsForLocalStorage(students, false);
      const leanSuccess = safeLocalStorageSet(storageKey, JSON.stringify(lean));
      if (!leanSuccess) {
        const ultraLean = createLeanStudentsForLocalStorage(students, true);
        safeLocalStorageSet(storageKey, JSON.stringify(ultraLean));
      }
      return;
    }

    const json = JSON.stringify(students);
    const success = safeLocalStorageSet(storageKey, json);
    if (!success) {
      // First try lean version
      const lean = createLeanStudentsForLocalStorage(students, false);
      const leanSuccess = safeLocalStorageSet(storageKey, JSON.stringify(lean));
      if (!leanSuccess) {
        // Fallback to ultra-lean version (strip all heavy base64 data)
        const ultraLean = createLeanStudentsForLocalStorage(students, true);
        safeLocalStorageSet(storageKey, JSON.stringify(ultraLean));
      }
    }
  } catch (err) {
    console.warn('[storageHelper] Failed to serialize students for localStorage:', err);
    try {
      const ultraLean = createLeanStudentsForLocalStorage(students, true);
      safeLocalStorageSet(storageKey, JSON.stringify(ultraLean));
    } catch {}
  }
}
