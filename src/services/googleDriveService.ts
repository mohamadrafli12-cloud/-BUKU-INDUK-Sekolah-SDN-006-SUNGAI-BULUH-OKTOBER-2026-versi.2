import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import firebaseConfig from '../../firebase-applet-config.json';

/**
 * Representasi Pengguna Akun Google untuk Google Drive
 */
export interface DriveUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

/**
 * Scopes required for creating and managing files created by this app in Google Drive
 */
export const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
];

// Configure GoogleAuthProvider with Drive scopes for fallback
export const googleDriveProvider = new GoogleAuthProvider();
googleDriveProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleDriveProvider.setCustomParameters({
  prompt: 'select_account',
});

/**
 * Deteksi apakah aplikasi sedang dibuka di dalam peramban internal aplikasi lain (embedded WebView)
 * seperti WhatsApp, Facebook, Instagram, Line, TikTok, atau Android WebView wrapper.
 */
export const isEmbeddedWebView = (): boolean => {
  if (typeof window === 'undefined' || !navigator) return false;
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';

  // Pola user agent untuk WebView dan in-app browser
  const isWvSignature = /wv|WebView|FBAN|FBAV|Instagram|Line|WhatsApp|TikTok|MicroMessenger|GSA|Snapchat|HeyTapBrowser/i.test(ua);
  const isAndroidWebView = /Android/i.test(ua) && /Version\/[0-9.]+/i.test(ua) && /Chrome\/[0-9.]+/i.test(ua);
  const isIosWebView = /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(ua);

  return isWvSignature || isAndroidWebView || isIosWebView;
};

/**
 * Membuka aplikasi secara langsung di browser asli perangkat (misalnya Google Chrome di Android)
 * untuk mematuhi kebijakan Google OAuth 2.0 yang melarang login di dalam WebView.
 */
export const openInNativeBrowser = (): void => {
  if (typeof window === 'undefined') return;
  const currentUrl = window.location.href;
  const isAndroid = /Android/i.test(navigator.userAgent);

  if (isAndroid) {
    try {
      // Menggunakan skema Intent Android untuk membuka Google Chrome resmi di perangkat
      const cleanHostPath = currentUrl.replace(/^https?:\/\//i, '');
      const intentUrl = `intent://${cleanHostPath}#Intent;scheme=https;package=com.android.chrome;end`;
      window.location.href = intentUrl;

      // Fallback cadangan
      setTimeout(() => {
        window.open(currentUrl, '_system');
      }, 600);
      return;
    } catch {
      window.open(currentUrl, '_system');
    }
  } else {
    window.open(currentUrl, '_system');
  }
};

// In-memory token & user cache (Do NOT store in localStorage or sessionStorage for security)
let cachedAccessToken: string | null = null;
let cachedUser: DriveUser | null = null;
let isSigningIn = false;

// Global listeners for auth changes
type AuthCallbackSuccess = (user: DriveUser, token: string) => void;
type AuthCallbackFailure = () => void;
interface AuthSubscriber {
  onSuccess?: AuthCallbackSuccess;
  onFailure?: AuthCallbackFailure;
}
const authSubscribers = new Set<AuthSubscriber>();

const notifySubscribers = () => {
  authSubscribers.forEach((sub) => {
    if (cachedAccessToken && cachedUser) {
      sub.onSuccess?.(cachedUser, cachedAccessToken);
    } else {
      sub.onFailure?.();
    }
  });
};

export interface DriveBackupFile {
  id: string;
  name: string;
  size?: string;
  createdTime: string;
  modifiedTime?: string;
  webViewLink?: string;
}

/**
 * Load Google Identity Services (GIS) client script if not already loaded
 */
export const ensureGisLoaded = (): Promise<void> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }

    if ((window as any).google?.accounts?.oauth2) {
      resolve();
      return;
    }

    const existingScript = document.getElementById('google-gsi-client-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gsi-client-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      console.warn('Gagal memuat script Google Identity Services, menggunakan fallback.');
      resolve();
    };
    document.head.appendChild(script);
  });
};

/**
 * Fetch Google User Profile using OAuth 2.0 Access Token
 */
export const fetchGoogleUserProfile = async (accessToken: string): Promise<DriveUser> => {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      return {
        uid: data.sub || `google_${Date.now()}`,
        displayName: data.name || data.given_name || 'Pengguna Google',
        email: data.email || null,
        photoURL: data.picture || null,
      };
    }
  } catch (e) {
    console.warn('Gagal mengambil user profile via Google OAuth userinfo:', e);
  }

  return {
    uid: `google_user_${Date.now()}`,
    displayName: 'Akun Google Drive',
    email: null,
    photoURL: null,
  };
};

/**
 * Initialize Drive Auth listener
 */
export const initDriveAuth = (
  onAuthSuccess?: AuthCallbackSuccess,
  onAuthFailure?: AuthCallbackFailure
) => {
  const subscriber: AuthSubscriber = { onSuccess: onAuthSuccess, onFailure: onAuthFailure };
  authSubscribers.add(subscriber);

  // Immediately notify if we already have a cached token in memory
  if (cachedAccessToken && cachedUser) {
    onAuthSuccess?.(cachedUser, cachedAccessToken);
  } else if (!isSigningIn) {
    onAuthFailure?.();
  }

  // Also listen to Firebase Auth in case user previously signed in via Firebase
  const unsubscribeFirebase = onAuthStateChanged(
    auth, 
    async (user: User | null) => {
      if (user && !cachedUser) {
        cachedUser = {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
        };
        if (cachedAccessToken && onAuthSuccess) {
          onAuthSuccess(cachedUser, cachedAccessToken);
        }
      }
    },
    (err) => {
      console.warn('Firebase auth state listener warning:', err?.message || err);
    }
  );

  return () => {
    authSubscribers.delete(subscriber);
    unsubscribeFirebase();
  };
};

/**
 * Request Access Token using Google Identity Services (GIS) Token Client.
 * This directly talks to Google OAuth endpoints and avoids Firebase Auth's
 * "auth/unauthorized-domain" restrictions on Cloud Run preview URLs.
 */
const requestGisAccessToken = async (): Promise<{ accessToken: string; user: DriveUser }> => {
  await ensureGisLoaded();

  const google = (typeof window !== 'undefined' ? (window as any).google : null);
  if (!google?.accounts?.oauth2) {
    throw new Error('Google Identity Services belum dimuat. Periksa koneksi internet Anda.');
  }

  const clientId = firebaseConfig.oAuthClientId;
  if (!clientId) {
    throw new Error('Client ID OAuth Google tidak ditemukan dalam konfigurasi.');
  }

  return new Promise((resolve, reject) => {
    try {
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: DRIVE_SCOPES.join(' '),
        callback: async (response: any) => {
          if (response.error) {
            console.error('GIS Error callback:', response);
            const errStr = `${response.error} ${response.error_description || ''}`.toLowerCase();
            if (response.error === 'access_denied') {
              reject(new Error('Izin akses Google Drive ditolak oleh pengguna.'));
            } else if (
              errStr.includes('disallowed_useragent') ||
              errStr.includes('kebijakan') ||
              errStr.includes('policy') ||
              errStr.includes('400')
            ) {
              const policyErr: any = new Error(
                'Peramban internal aplikasi tidak mematuhi kebijakan OAuth 2.0 Google (disallowed_useragent).'
              );
              policyErr.isOAuthPolicyError = true;
              reject(policyErr);
            } else {
              reject(new Error(response.error_description || response.error || 'Gagal memperoleh izin akses dari Google'));
            }
            return;
          }

          if (!response.access_token) {
            reject(new Error('Token akses tidak diterima dari Google.'));
            return;
          }

          try {
            const userProfile = await fetchGoogleUserProfile(response.access_token);
            resolve({
              accessToken: response.access_token,
              user: userProfile,
            });
          } catch (profileErr) {
            resolve({
              accessToken: response.access_token,
              user: {
                uid: 'google_user',
                displayName: 'Akun Google Terhubung',
                email: null,
                photoURL: null,
              },
            });
          }
        },
        error_callback: (err: any) => {
          console.error('GIS tokenClient error_callback:', err);
          reject(new Error(err?.message || err?.type || 'Jendela autentikasi Google gagal dibuka'));
        },
      });

      tokenClient.requestAccessToken({ prompt: '' });
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Sign in with Google with Drive scope
 * 1. Tries Google Identity Services (GIS) first (immune to Firebase auth/unauthorized-domain)
 * 2. Falls back to Firebase signInWithPopup if GIS is not supported
 */
export const signInWithGoogleDrive = async (): Promise<{ user: DriveUser; accessToken: string }> => {
  isSigningIn = true;
  try {
    // 1. Primary method: Google Identity Services (GIS)
    try {
      const gisResult = await requestGisAccessToken();
      cachedAccessToken = gisResult.accessToken;
      cachedUser = gisResult.user;
      notifySubscribers();
      return { user: cachedUser, accessToken: cachedAccessToken };
    } catch (gisError: any) {
      console.warn('Percobaan GIS selesai dengan kendala, mencoba Firebase Auth:', gisError);
      
      // If user specifically clicked Cancel / access_denied, rethrow without fallback
      if (gisError?.message?.includes('ditolak oleh pengguna')) {
        throw (gisError instanceof Error ? gisError : new Error(gisError?.message || 'Izin akses Google Drive ditolak oleh pengguna.'));
      }

      // 2. Fallback method: Firebase Auth Popup
      try {
        const result = await signInWithPopup(auth, googleDriveProvider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (!credential?.accessToken) {
          throw new Error('Gagal mendapatkan token akses Google Drive. Harap beri izin akses.');
        }

        cachedAccessToken = credential.accessToken;
        cachedUser = {
          uid: result.user.uid,
          displayName: result.user.displayName,
          email: result.user.email,
          photoURL: result.user.photoURL,
        };
        notifySubscribers();
        return { user: cachedUser, accessToken: cachedAccessToken };
      } catch (fbError: any) {
        // Handle unauthorized-domain error explicitly
        if (
          fbError?.code === 'auth/unauthorized-domain' ||
          (fbError?.message && fbError.message.includes('auth/unauthorized-domain'))
        ) {
          const currentHostname = typeof window !== 'undefined' ? window.location.hostname : 'domain';
          const enhancedError = new Error(
            `Domain "${currentHostname}" belum diizinkan dalam Firebase Console Authorized Domains.`
          ) as any;
          enhancedError.code = 'auth/unauthorized-domain';
          enhancedError.isUnauthorizedDomain = true;
          enhancedError.currentDomain = currentHostname;
          enhancedError.projectId = firebaseConfig.projectId;
          throw enhancedError;
        }

        // Check for disallowed_useragent or OAuth policy violation
        const combinedErrText = `${fbError?.message || ''} ${gisError?.message || ''}`.toLowerCase();
        if (
          combinedErrText.includes('disallowed_useragent') ||
          combinedErrText.includes('kebijakan oauth') ||
          combinedErrText.includes('policy') ||
          combinedErrText.includes('tidak mematuhi kebijakan')
        ) {
          const policyErr: any = new Error(
            'Aplikasi dibuka di peramban internal (WebView). Kebijakan OAuth 2.0 Google melarang login akun di peramban tersemat. Silakan buka di Google Chrome atau unduh file cadangan secara langsung.'
          );
          policyErr.isOAuthPolicyError = true;
          throw policyErr;
        }

        // Rethrow original or GIS error safely
        const finalError = fbError || gisError || new Error('Gagal menghubungkan akun Google.');
        throw (finalError instanceof Error ? finalError : new Error(finalError?.message || 'Gagal login Google'));
      }
    }
  } finally {
    isSigningIn = false;
  }
};

/**
 * Sign out from Google
 */
export const signOutGoogleDrive = async (): Promise<void> => {
  try {
    if (cachedAccessToken && typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2?.revoke) {
      (window as any).google.accounts.oauth2.revoke(cachedAccessToken, () => {});
    }
  } catch (e) {
    // Ignore revoke errors
  }

  try {
    await signOut(auth);
  } catch (e) {
    // Ignore firebase signout errors
  }

  cachedAccessToken = null;
  cachedUser = null;
  notifySubscribers();
};

/**
 * Get the current cached access token
 */
export const getDriveAccessToken = (): string | null => {
  return cachedAccessToken;
};

/**
 * Set or refresh the cached token manually (e.g. for custom OAuth tokens or testing)
 */
export const setDriveAccessToken = async (token: string | null, customUser?: DriveUser): Promise<void> => {
  cachedAccessToken = token;
  if (token) {
    if (customUser) {
      cachedUser = customUser;
    } else {
      cachedUser = await fetchGoogleUserProfile(token);
    }
  } else {
    cachedUser = null;
  }
  notifySubscribers();
};

/**
 * Upload a backup file (JSON or .DB) to user's Google Drive using multipart upload
 */
export const uploadBackupToGoogleDrive = async (params: {
  fileName: string;
  content: string;
  mimeType?: string;
  description?: string;
}): Promise<DriveBackupFile> => {
  const token = getDriveAccessToken();
  if (!token) {
    throw new Error('Sesi Google Drive belum terhubung. Silakan login ke Google Drive terlebih dahulu.');
  }

  const boundary = '-------BukuIndukDriveUploadBoundary' + Math.random().toString(36).substring(2);
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: params.fileName,
    mimeType: params.mimeType || 'application/json',
    description: params.description || 'Cadangan Database Buku Induk Siswa Digital',
    properties: {
      app: 'buku-induk-siswa-digital',
      type: 'database-backup',
    },
  };

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${params.mimeType || 'application/json'}\r\n\r\n` +
    params.content +
    closeDelimiter;

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,size,createdTime',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.error?.message || 
      `Gagal mengunggah cadangan ke Google Drive (Status: ${response.status})`
    );
  }

  const data = await response.json();
  return {
    id: data.id,
    name: data.name,
    size: data.size,
    createdTime: data.createdTime || new Date().toISOString(),
    webViewLink: data.webViewLink,
  };
};

/**
 * List backup files stored in Google Drive by this app
 */
export const listGoogleDriveBackups = async (): Promise<DriveBackupFile[]> => {
  const token = getDriveAccessToken();
  if (!token) {
    throw new Error('Sesi Google Drive belum terhubung.');
  }

  const query = "trashed = false";
  const fields = 'files(id,name,size,createdTime,modifiedTime,webViewLink)';
  const orderBy = 'createdTime desc';

  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&orderBy=${encodeURIComponent(orderBy)}&pageSize=50`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.error?.message || 
      `Gagal mengambil daftar berkas Google Drive (Status: ${response.status})`
    );
  }

  const data = await response.json();
  const files: DriveBackupFile[] = (data.files || []).filter((f: any) => {
    const name = (f.name || '').toLowerCase();
    return name.endsWith('.json') || name.endsWith('.db') || name.includes('buku_induk') || name.includes('backup');
  });

  return files;
};

/**
 * Download / Read a backup file content from Google Drive
 */
export const downloadGoogleDriveBackupContent = async (fileId: string): Promise<string> => {
  const token = getDriveAccessToken();
  if (!token) {
    throw new Error('Sesi Google Drive belum terhubung.');
  }

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Gagal mengunduh berkas cadangan dari Google Drive (Status: ${response.status})`);
  }

  return await response.text();
};

/**
 * Delete a backup file from Google Drive (Requires explicit confirmation)
 */
export const deleteGoogleDriveBackup = async (fileId: string): Promise<void> => {
  const token = getDriveAccessToken();
  if (!token) {
    throw new Error('Sesi Google Drive belum terhubung.');
  }

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok && response.status !== 204) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.error?.message || 
      `Gagal menghapus berkas dari Google Drive (Status: ${response.status})`
    );
  }
};
