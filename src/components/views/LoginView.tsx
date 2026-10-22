import React, { useState } from 'react';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  BookOpen, 
  School, 
  Sun, 
  Moon, 
  AlertCircle, 
  CheckCircle2
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';

interface LoginViewProps {
  onSuccess?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess }) => {
  const { 
    schoolProfile, 
    login, 
    darkMode, 
    toggleDarkMode 
  } = useSchool();

  // Form credentials state
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  // Status & error state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const userClean = username.trim();
    const passClean = password.trim();

    if (!userClean) {
      setErrorMessage('Silakan masukkan username Anda.');
      return;
    }

    if (!passClean) {
      setErrorMessage('Silakan masukkan password Anda.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const res = login(userClean, passClean);

      if (res.success) {
        setSuccessMessage(res.message || 'Login berhasil! Mengalihkan ke sistem...');
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 300);
      } else {
        setErrorMessage(res.message || 'Username atau password salah. Silakan periksa kembali.');
        setIsLoading(false);
      }
    }, 200);
  };

  const handleLoginAsGuest = () => {
    setErrorMessage(null);
    setIsLoading(true);
    setTimeout(() => {
      login('umum');
      if (onSuccess) onSuccess();
    }, 150);
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 font-sans text-slate-900 dark:text-slate-100 transition-colors relative">
      {/* Theme toggle (top right) */}
      <div className="absolute top-4 right-4 z-20">
        <button
          type="button"
          onClick={toggleDarkMode}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-2xs hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-all cursor-pointer"
          title={darkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
        >
          {darkMode ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Mode Terang</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-slate-600" />
              <span>Mode Gelap</span>
            </>
          )}
        </button>
      </div>

      {/* Decorative subtle ambient lights */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-500/10 dark:bg-blue-600/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-amber-500/10 dark:bg-amber-600/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md mx-auto">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#003399] text-white shadow-md mb-3 ring-4 ring-blue-50 dark:ring-blue-950/40">
            <BookOpen className="w-7 h-7 text-amber-400" />
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Sistem Buku Induk Siswa
          </h1>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-2xs">
            <School className="w-3.5 h-3.5 text-[#003399] dark:text-blue-400" />
            <span>{schoolProfile.namaSekolah || 'SD NEGERI 006 SUNGAI BULUH'}</span>
          </div>
        </div>

        {/* Clean Simplified Login Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 sm:p-7">
          <div className="mb-5">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              Masuk ke Akun
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Masukkan nama pengguna dan kata sandi untuk mengakses sistem
            </p>
          </div>

          {/* Error & Success Alerts */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <div className="font-semibold leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <div className="font-semibold leading-relaxed">{successMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input User */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Username / Pengguna
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Contoh: adminsdn006"
                  autoComplete="username"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003399]/30 focus:border-[#003399] transition-all"
                />
              </div>
            </div>

            {/* Input Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Password / Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003399]/30 focus:border-[#003399] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-[#003399] focus:ring-[#003399]"
                />
                <span>Ingat saya</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 mt-2 bg-[#003399] hover:bg-[#002266] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memeriksa data...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Sistem</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Optional Guest Access */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              type="button"
              onClick={handleLoginAsGuest}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              Atau masuk sebagai <span className="font-bold underline">Tamu / Umum</span> (Hanya Lihat)
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-5">
          SD NEGERI 006 SUNGAI BULUH • Buku Induk & Mutasi Siswa Digital
        </p>
      </div>
    </div>
  );
};
