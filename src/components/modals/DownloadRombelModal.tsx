import React, { useState } from 'react';
import { 
  X, 
  Download, 
  FileSpreadsheet, 
  Users, 
  Search, 
  CheckCircle2, 
  UserCheck, 
  Layers,
  Sparkles,
  Calendar
} from 'lucide-react';
import { Student, SchoolProfile, AdminUser } from '../../types';
import { exportRombelToExcel, exportCombinedRombelsToExcel } from '../../utils/excelHelper';
import { cn } from '../../lib/utils';

interface DownloadRombelModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolProfile: SchoolProfile;
  activeStudents: Student[];
  availableClasses: string[];
  activeTP: string;
  activeSemester: string;
  adminUsers: AdminUser[];
  onLogActivity?: (action: string, description: string) => void;
}

export const DownloadRombelModal: React.FC<DownloadRombelModalProps> = ({
  isOpen,
  onClose,
  schoolProfile,
  activeStudents,
  availableClasses,
  activeTP,
  activeSemester,
  adminUsers,
  onLogActivity,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadSuccessNotice, setDownloadSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadSingleRombel = (kelasName: string) => {
    // Cari data wali kelas dari schoolProfile.waliKelasMap atau adminUsers
    const savedWali = schoolProfile.waliKelasMap?.[kelasName];
    const teacherFromUsers = adminUsers.find(u => u.tingkatKelas === kelasName);

    const waliNama = savedWali?.nama || teacherFromUsers?.nama || `Wali Kelas ${kelasName}`;
    const waliNip = savedWali?.nip || teacherFromUsers?.nip || '-';

    exportRombelToExcel({
      schoolProfile,
      students: activeStudents,
      kelasName,
      activeTP,
      activeSemester,
      waliKelasName: waliNama,
      waliKelasNip: waliNip,
    });

    if (onLogActivity) {
      onLogActivity(
        'EXPORT',
        `Mengunduh berkas Excel (.xlsx) daftar peserta didik untuk ${kelasName} (Wali Kelas: ${waliNama})`
      );
    }

    setDownloadSuccessNotice(`Berkas Excel (.xlsx) untuk ${kelasName} berhasil diunduh!`);
    setTimeout(() => {
      setDownloadSuccessNotice(null);
    }, 4500);
  };

  const handleDownloadAllCombined = () => {
    exportCombinedRombelsToExcel(
      schoolProfile,
      activeStudents,
      availableClasses,
      activeTP,
      schoolProfile.waliKelasMap || {}
    );

    if (onLogActivity) {
      onLogActivity(
        'EXPORT',
        `Mengunduh berkas gabungan Excel (.xlsx) seluruh rombel untuk TP ${activeTP}`
      );
    }

    setDownloadSuccessNotice('Berkas Excel (.xlsx) Buku Rombel Lengkap (Multi-Sheet) berhasil diunduh!');
    setTimeout(() => {
      setDownloadSuccessNotice(null);
    }, 4500);
  };

  const filteredClasses = availableClasses.filter(c => {
    const q = searchQuery.toLowerCase();
    const savedWali = schoolProfile.waliKelasMap?.[c];
    const teacher = adminUsers.find(u => u.tingkatKelas === c);
    const teacherName = (savedWali?.nama || teacher?.nama || '').toLowerCase();
    return c.toLowerCase().includes(q) || teacherName.includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-md font-black">
              <FileSpreadsheet className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  Unduh Data Siswa per Rombel (.xlsx)
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/20 text-emerald-200">
                  TP {activeTP}
                </span>
              </div>
              <p className="text-xs text-emerald-100 mt-0.5">
                Format resmi Excel siap pakai untuk administrasi & pengelolaan guru wali kelas.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Tutup dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Bulk Download Banner */}
        <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border-b border-emerald-100 dark:border-emerald-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-black text-emerald-950 dark:text-emerald-100">
                Unduh Seluruh Rombel Sekaligus (Multi-Sheet)
              </p>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                1 berkas Excel (.xlsx) dengan masing-masing rombel di lembar kerja terpisah.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadAllCombined}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh Semua Rombel (.xlsx)</span>
          </button>
        </div>

        {/* Search & Stats Bar */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari rombel atau nama wali kelas..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Tersedia <strong>{availableClasses.length}</strong> Rombel</span>
            <span>•</span>
            <span>Total <strong>{activeStudents.length}</strong> Siswa Aktif</span>
          </div>
        </div>

        {/* Success Alert Banner */}
        {downloadSuccessNotice && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-100 flex items-center gap-2 font-bold shadow-xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{downloadSuccessNotice}</span>
          </div>
        )}

        {/* Grid List of Rombels */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {filteredClasses.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Tidak ada rombel yang cocok dengan pencarian "{searchQuery}".
            </div>
          ) : (
            filteredClasses.map((kelas, idx) => {
              const classStudents = activeStudents.filter(
                (s) => s.kelasSekarang === kelas && s.status === 'Aktif'
              );
              const total = classStudents.length;
              const jmlL = classStudents.filter((s) => s.jenisKelamin === 'L').length;
              const jmlP = classStudents.filter((s) => s.jenisKelamin === 'P').length;

              const savedWali = schoolProfile.waliKelasMap?.[kelas];
              const teacherFromUsers = adminUsers.find(u => u.tingkatKelas === kelas);

              const waliNama = savedWali?.nama || teacherFromUsers?.nama || `Wali Kelas ${kelas}`;
              const waliNip = savedWali?.nip || teacherFromUsers?.nip || '-';

              return (
                <div
                  key={kelas}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-black text-sm shrink-0 font-mono shadow-2xs">
                      {idx + 1}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                          {kelas}
                        </h4>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {total} Siswa
                        </span>
                        {total === 0 && (
                          <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                            0 Siswa
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1 font-semibold">
                          <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>{waliNama}</span>
                        </span>
                        {waliNip && waliNip !== '-' && (
                          <span className="font-mono text-[11px] text-slate-400">
                            (NIP: {waliNip})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono pt-0.5">
                        <span className="text-blue-600 dark:text-blue-400 font-bold">L: {jmlL}</span>
                        <span>•</span>
                        <span className="text-pink-600 dark:text-pink-400 font-bold">P: {jmlP}</span>
                        <span>•</span>
                        <span>Semester {activeSemester}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDownloadSingleRombel(kelas)}
                      disabled={total === 0}
                      className={cn(
                        "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs active:scale-98",
                        total > 0
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-md"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-60"
                      )}
                      title={total > 0 ? `Unduh daftar siswa ${kelas} format .xlsx` : 'Rombel ini belum memiliki siswa'}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh .XLSX</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <p className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Format tabel mencakup kolom data lengkap, identitas orang tua, dan lembar presensi.</span>
          </p>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
