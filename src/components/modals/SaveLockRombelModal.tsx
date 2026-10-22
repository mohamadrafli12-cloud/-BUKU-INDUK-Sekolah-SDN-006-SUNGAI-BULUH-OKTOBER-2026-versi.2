import React, { useState } from 'react';
import { 
  Lock, 
  Save, 
  ShieldCheck, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Users, 
  Layers, 
  FileText 
} from 'lucide-react';
import { Student, RombelLockInfo, StudentStatus } from '../../types';
import { formatIndonesianDate } from '../../lib/utils';

interface SaveLockRombelModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTP: string;
  totalActive: number;
  totalBelumMasukSD: number;
  rombelStats: Array<{
    kelas: string;
    total: number;
    jmlL: number;
    jmlP: number;
  }>;
  draftEdits: Record<string, string>;
  draftStatusEdits?: Record<string, StudentStatus>;
  projectedStudents: Array<Student & { isBelumMasukSD?: boolean }>;
  onConfirmSaveAndLock: (notes?: string) => void;
  isAlreadyLocked: boolean;
  lockInfo?: RombelLockInfo;
}

export const SaveLockRombelModal: React.FC<SaveLockRombelModalProps> = ({
  isOpen,
  onClose,
  activeTP,
  totalActive,
  totalBelumMasukSD,
  rombelStats,
  draftEdits,
  draftStatusEdits = {},
  projectedStudents,
  onConfirmSaveAndLock,
  isAlreadyLocked,
  lockInfo,
}) => {
  const [catatan, setCatatan] = useState<string>(
    lockInfo?.catatan || `Penetapan dan penguncian rombel & status siswa Tahun Pelajaran ${activeTP}.`
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const editedStudentIds = Array.from(new Set([...Object.keys(draftEdits), ...Object.keys(draftStatusEdits)]));
  const hasEdits = editedStudentIds.length > 0;

  const editedList = editedStudentIds.map(id => {
    const student = projectedStudents.find(s => s.id === id);
    const hasRombelEdit = Boolean(draftEdits[id] && draftEdits[id] !== student?.kelasSekarang);
    const hasStatusEdit = Boolean(draftStatusEdits[id] && draftStatusEdits[id] !== student?.status);
    return {
      id,
      nama: student?.namaLengkap || 'Siswa',
      nis: student?.noInduk || '-',
      rombelBaru: draftEdits[id] || student?.kelasSekarang || '-',
      rombelLama: student?.kelasSekarang || '-',
      hasRombelEdit,
      statusBaru: draftStatusEdits[id] || student?.status,
      statusLama: student?.status,
      hasStatusEdit,
    };
  });

  const handleConfirm = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      onConfirmSaveAndLock(catatan);
      setIsSubmitting(false);
      onClose();
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-6 py-5 bg-gradient-to-r from-[#003399] via-blue-800 to-indigo-900 text-white flex items-center justify-between shrink-0 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-md font-black">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">Simpan & Kunci Rombel</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 shadow-xs">
                  TP {activeTP}
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                Kunci hasil penataan rombel siswa aktif di Buku Induk Digital
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer relative z-10"
            title="Tutup dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 scrollbar-thin">
          {/* Status info banner */}
          {isAlreadyLocked ? (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black text-emerald-900 dark:text-emerald-200">
                  Rombel TP {activeTP} Saat Ini Telah Terkunci
                </p>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5 leading-relaxed">
                  Telah disimpan dan dikunci pada: <strong>{lockInfo?.lockedAt ? formatIndonesianDate(lockInfo.lockedAt) : 'Sebelumnya'}</strong> oleh <strong>{lockInfo?.lockedBy || 'Operator'}</strong>. Menyimpan kembali akan memperbarui data kunci rombel saat ini.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#003399] dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black text-blue-950 dark:text-blue-200">
                  Konfirmasi Penguncian Rombel Tahun Pelajaran {activeTP}
                </p>
                <p className="text-xs text-blue-800 dark:text-blue-300 mt-0.5 leading-relaxed">
                  Menyimpan & mengunci rombel akan memvalidasi posisi kelas seluruh siswa aktif pada Tahun Pelajaran <strong>{activeTP}</strong> ke data Buku Induk Siswa.
                </p>
              </div>
            </div>
          )}

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Siswa Aktif (1-6)</span>
              </span>
              <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
                {totalActive} <span className="text-xs font-normal text-slate-500">Siswa</span>
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Belum Masuk SD</span>
              </span>
              <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {totalBelumMasukSD} <span className="text-xs font-normal text-slate-500">Siswa</span>
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Total Rombel</span>
              </span>
              <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                {rombelStats.length} <span className="text-xs font-normal text-slate-500">Rombel</span>
              </p>
            </div>
          </div>

          {/* Rombel Distribution Summary Pills */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Distribusi Siswa per Rombel ({activeTP}):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {rombelStats.map(r => (
                <div 
                  key={r.kelas}
                  className="px-3 py-2 bg-slate-100/80 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-slate-800 dark:text-slate-200">{r.kelas}</span>
                  <span className="font-mono font-black text-[#003399] dark:text-blue-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800">
                    {r.total} <span className="text-[10px] font-normal text-slate-400">({r.jmlL}L/{r.jmlP}P)</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* List of Recent Draft Edits if Any */}
          {hasEdits && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-2xl">
              <div className="flex items-center gap-2 text-xs font-black text-amber-900 dark:text-amber-200 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Perubahan Rombel & Status Siswa yang Akan Disimpan & Dikunci ({editedList.length} Siswa):</span>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1.5 scrollbar-thin pr-1 text-xs">
                {editedList.map((item, idx) => (
                  <div 
                    key={item.id} 
                    className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="truncate">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{idx + 1}. {item.nama}</span>
                      <span className="text-[10px] text-slate-400 ml-1.5 font-mono">NIS: {item.nis}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0 text-[11px] font-bold">
                      {item.hasRombelEdit && (
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400 line-through text-[10px]">{item.rombelLama}</span>
                          <span>→</span>
                          <span className="text-emerald-700 dark:text-emerald-300 font-extrabold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700">
                            {item.rombelBaru}
                          </span>
                        </div>
                      )}
                      {item.hasStatusEdit && (
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400 line-through text-[10px]">{item.statusLama}</span>
                          <span>→</span>
                          <span className="text-blue-700 dark:text-blue-300 font-extrabold bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-300 dark:border-blue-700">
                            {item.statusBaru}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Catatan / Keterangan Penguncian */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Catatan Penguncian Rombel (Opsional):</span>
            </label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={2}
              placeholder="Contoh: Penetapan rombel semester ganjil TP 2025/2026 berdasarkan SK Pembagian Tugas..."
              className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Kunci dapat dibuka kembali sewaktu-waktu jika diperlukan perombakan rombel.
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl text-xs font-black shadow-lg hover:shadow-xl transition-all cursor-pointer disabled:opacity-50 active:scale-98"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan & Kunci Sekarang'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
