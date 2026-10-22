import React, { useState } from 'react';
import { X, History, Clock, User, ShieldCheck, Search, Filter, RefreshCw, UserCheck, CheckCircle2 } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { cn } from '../../lib/utils';

interface ActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ActivityLogModal: React.FC<ActivityLogModalProps> = ({ isOpen, onClose }) => {
  const { activityLogs } = useSchool();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<string>('SEMUA');

  if (!isOpen) return null;

  const actionBadge = (action: string) => {
    switch (action) {
      case 'TAMBAH':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'EDIT':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'HAPUS':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'CETAK':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'MUTASI':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      case 'IJAZAH':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'EXPORT':
      case 'IMPORT':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const filteredLogs = activityLogs.filter((log) => {
    const matchesSearch =
      searchQuery === '' ||
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.timestamp.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction =
      filterAction === 'SEMUA' || log.action === filterAction;

    return matchesSearch && matchesAction;
  });

  const countTambah = activityLogs.filter(l => l.action === 'TAMBAH').length;
  const countEdit = activityLogs.filter(l => l.action === 'EDIT').length;
  const countHapus = activityLogs.filter(l => l.action === 'HAPUS').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-[#003399] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-300 border border-white/20">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-wide text-white">
                Catatan Aktivitas & Log Perubahan Buku Induk
              </h3>
              <p className="text-xs text-blue-100">
                Audit log transparan: mengetahui siapa yang menambah, mengubah, atau menghapus data siswa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick summary metrics */}
        <div className="grid grid-cols-3 gap-2 px-6 py-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 rounded-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-600 dark:text-slate-400">Penambahan Data:</span>
            <strong className="text-emerald-700 dark:text-emerald-300 font-mono ml-auto">{countTambah}</strong>
          </div>
          <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/40 rounded-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-slate-600 dark:text-slate-400">Pengubahan Data:</span>
            <strong className="text-blue-700 dark:text-blue-300 font-mono ml-auto">{countEdit}</strong>
          </div>
          <div className="flex items-center gap-2 p-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-800/40 rounded-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-slate-600 dark:text-slate-400">Penghapusan:</span>
            <strong className="text-rose-700 dark:text-rose-300 font-mono ml-auto">{countHapus}</strong>
          </div>
        </div>

        {/* Filters and search */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-2 bg-white dark:bg-slate-900">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama petugas, nama siswa, atau deskripsi aktivitas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {['SEMUA', 'TAMBAH', 'EDIT', 'HAPUS', 'MUTASI', 'IJAZAH'].map((action) => (
              <button
                key={action}
                onClick={() => setFilterAction(action)}
                className={cn(
                  "px-2.5 py-1 text-[11px] font-bold rounded-md whitespace-nowrap transition-colors border",
                  filterAction === action
                    ? "bg-[#003399] text-white border-[#003399]"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                )}
              >
                {action}
              </button>
            ))}
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2.5 bg-slate-50/50 dark:bg-slate-950/20">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm space-y-2">
              <History className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
              <p>Tidak ada catatan aktivitas yang sesuai dengan filter pencarian.</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:shadow-xs transition-shadow flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn("px-2 py-0.5 rounded-md font-bold text-[10px] border", actionBadge(log.action))}>
                      {log.action}
                    </span>
                    <div className="flex items-center gap-1.5 text-slate-900 dark:text-slate-100 font-bold">
                      <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>{log.user}</span>
                    </div>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed pl-1">
                    {log.description}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 shrink-0 font-mono bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{log.timestamp}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs text-slate-500">
          <span>Menampilkan <strong>{filteredLogs.length}</strong> dari <strong>{activityLogs.length}</strong> total aktivitas</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

