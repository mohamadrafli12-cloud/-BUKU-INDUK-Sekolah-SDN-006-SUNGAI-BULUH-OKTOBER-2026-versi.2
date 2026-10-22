import React, { ReactNode } from 'react';
import { RotateCcw, AlertTriangle, Home, Sparkles, HardDriveDownload } from 'lucide-react';
import { cleanupVolatileStorage, repairStorageQuota } from '../../utils/storageHelper';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

export class ErrorBoundary extends React.Component<Props, State> {
  declare props: Props;
  declare state: State;
  declare setState: (update: Partial<State> | ((prevState: State) => Partial<State>)) => void;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: any) {
    console.warn('ErrorBoundary captured an error:', error?.message || error, errorInfo);
    this.setState({ errorInfo });

    // Proactively free storage if quota exceeded was caught
    if (
      error?.name === 'QuotaExceededError' ||
      (typeof error?.message === 'string' && error.message.toLowerCase().includes('quota'))
    ) {
      try {
        repairStorageQuota();
      } catch (e) {
        console.warn('Auto storage quota repair attempt:', e);
      }
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (typeof window !== 'undefined') {
      window.location.href = window.location.pathname;
    }
  };

  private handleCleanAndRestore = () => {
    try {
      repairStorageQuota();
    } catch {}
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  private handleInstantQuotaFix = () => {
    try {
      repairStorageQuota();
    } catch {}
    // Reset state directly without reload to attempt instant UI remount
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (typeof window !== 'undefined') {
      window.location.search = '';
      window.location.hash = '';
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      const isQuotaError = 
        this.state.error?.name === 'QuotaExceededError' ||
        (typeof this.state.error?.message === 'string' && this.state.error.message.toLowerCase().includes('quota'));

      return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-6 md:p-8 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-inner">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-slate-100">
                Terjadi Kendala Memuat Tampilan
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                {isQuotaError
                  ? 'Kapasitas penyimpanan lokal browser (localStorage) penuh karena lampiran foto atau riwayat data. Semua data buku induk Anda tetap aman tersimpan di IndexedDB.'
                  : 'Aplikasi mendeteksi adanya gangguan ringan pada komponen antarmuka. Seluruh data buku induk Anda tetap aman tersimpan.'}
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-left border border-slate-200/80 dark:border-slate-700/60 text-[11px] font-mono text-slate-600 dark:text-slate-300 overflow-x-auto max-h-28">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              {isQuotaError ? (
                <button
                  type="button"
                  onClick={this.handleInstantQuotaFix}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <HardDriveDownload className="w-4 h-4" />
                  <span>Bebaskan Kuota & Buka Aplikasi</span>
                </button>
              ) : null}

              <button
                type="button"
                onClick={this.handleCleanAndRestore}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Bersihkan Cache & Pulihkan</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Muat Ulang Halaman</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Ke Beranda</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
