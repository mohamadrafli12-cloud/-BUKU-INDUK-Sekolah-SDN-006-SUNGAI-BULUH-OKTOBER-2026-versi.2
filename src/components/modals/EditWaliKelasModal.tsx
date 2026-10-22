import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Save, 
  UserCheck, 
  Search, 
  Undo2, 
  CheckCircle2, 
  AlertCircle,
  Users,
  GraduationCap,
  Sparkles
} from 'lucide-react';
import { AdminUser } from '../../types';
import { cn } from '../../lib/utils';

interface EditWaliKelasModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableClasses: string[];
  currentWaliKelasMap: Record<string, { nama: string; nip?: string }>;
  adminUsers: AdminUser[];
  activeTP: string;
  initialSelectedKelas?: string;
  onSave: (newWaliKelasMap: Record<string, { nama: string; nip?: string }>) => void;
}

export const EditWaliKelasModal: React.FC<EditWaliKelasModalProps> = ({
  isOpen,
  onClose,
  availableClasses,
  currentWaliKelasMap,
  adminUsers,
  activeTP,
  initialSelectedKelas,
  onSave,
}) => {
  // Local state for draft wali kelas map
  const [formData, setFormData] = useState<Record<string, { nama: string; nip: string }>>({});
  const [searchFilter, setSearchFilter] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize or reset form data when opened
  useEffect(() => {
    if (isOpen) {
      const initialMap: Record<string, { nama: string; nip: string }> = {};

      availableClasses.forEach((kelas, idx) => {
        const saved = currentWaliKelasMap[kelas];
        const teacherFromUsers = adminUsers.find(u => u.tingkatKelas === kelas);

        const defaultNama = 
          saved?.nama ||
          teacherFromUsers?.nama ||
          (idx === 0 ? 'Dewi Anggraini, S.Pd.SD' :
           idx === 1 ? 'Suryani, S.Pd.' :
           idx === 2 ? 'Hendri Gunawan, S.Pd.I.' :
           idx === 3 ? 'Ratna Juwita, S.Pd.' :
           idx === 4 ? 'Bambang Irawan, S.Pd.' :
           idx === 5 ? 'Siti Rahmawati, S.Pd.' : `Wali Kelas ${kelas}`);

        const defaultNip = 
          saved?.nip ||
          teacherFromUsers?.nip ||
          (idx === 0 ? '19901103 201502 2 009' :
           idx === 1 ? '19890412 201403 2 011' :
           idx === 2 ? '19870825 201201 1 007' :
           idx === 3 ? '19910519 201602 2 014' :
           idx === 4 ? '19880220 201403 1 004' :
           idx === 5 ? '19850116 201001 2 008' : '-');

        initialMap[kelas] = {
          nama: defaultNama,
          nip: defaultNip,
        };
      });

      setFormData(initialMap);
      setSaveSuccess(false);
    }
  }, [isOpen, availableClasses, currentWaliKelasMap, adminUsers]);

  // List of registered teachers from adminUsers for quick pick suggestions
  const teacherOptions = useMemo(() => {
    return adminUsers.filter(u => u.nama && u.nama.trim().length > 0);
  }, [adminUsers]);

  if (!isOpen) return null;

  const handleFieldChange = (kelas: string, field: 'nama' | 'nip', value: string) => {
    setFormData(prev => ({
      ...prev,
      [kelas]: {
        ...(prev[kelas] || { nama: '', nip: '' }),
        [field]: value,
      },
    }));
  };

  const handleSelectTeacherPreset = (kelas: string, teacher: AdminUser) => {
    setFormData(prev => ({
      ...prev,
      [kelas]: {
        nama: teacher.nama,
        nip: teacher.nip || '-',
      },
    }));
  };

  const handleResetToDefault = () => {
    if (window.confirm('Reset data nama wali kelas seluruh rombel ke nama bawaan sistem?')) {
      const resetMap: Record<string, { nama: string; nip: string }> = {};
      availableClasses.forEach((kelas, idx) => {
        const teacherFromUsers = adminUsers.find(u => u.tingkatKelas === kelas);
        resetMap[kelas] = {
          nama: teacherFromUsers?.nama ||
            (idx === 0 ? 'Dewi Anggraini, S.Pd.SD' :
             idx === 1 ? 'Suryani, S.Pd.' :
             idx === 2 ? 'Hendri Gunawan, S.Pd.I.' :
             idx === 3 ? 'Ratna Juwita, S.Pd.' :
             idx === 4 ? 'Bambang Irawan, S.Pd.' :
             idx === 5 ? 'Siti Rahmawati, S.Pd.' : `Wali Kelas ${kelas}`),
          nip: teacherFromUsers?.nip ||
            (idx === 0 ? '19901103 201502 2 009' :
             idx === 1 ? '19890412 201403 2 011' :
             idx === 2 ? '19870825 201201 1 007' :
             idx === 3 ? '19910519 201602 2 014' :
             idx === 4 ? '19880220 201403 1 004' :
             idx === 5 ? '19850116 201001 2 008' : '-'),
        };
      });
      setFormData(resetMap);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 800);
  };

  const filteredClasses = availableClasses.filter(c => 
    c.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (formData[c]?.nama || '').toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-md font-black">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  Edit Data Wali Kelas per Rombel
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/20 text-blue-200">
                  TP {activeTP}
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                Kelola nama lengkap dan NIP guru wali kelas untuk setiap rombongan belajar aktif.
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

        {/* Search & Actions Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Cari kelas atau nama wali..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
              title="Reset ke daftar nama guru bawaan"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Reset Standar</span>
            </button>
            <span className="text-xs text-slate-500 font-medium">
              Total <strong>{availableClasses.length}</strong> Rombel
            </span>
          </div>
        </div>

        {/* Notification Banner */}
        {saveSuccess && (
          <div className="mx-6 mt-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-100 flex items-center gap-2.5 font-bold shadow-xs animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Data nama wali kelas berhasil disimpan dan diperbarui di Tabel Siswa per Rombel!</span>
          </div>
        )}

        {/* Content Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="space-y-3">
            {filteredClasses.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                Tidak ada rombel yang cocok dengan pencarian "{searchFilter}".
              </div>
            ) : (
              filteredClasses.map((kelas, idx) => {
                const item = formData[kelas] || { nama: '', nip: '' };
                const isSelected = initialSelectedKelas === kelas;

                return (
                  <div
                    key={kelas}
                    className={cn(
                      "p-4 rounded-2xl border transition-all space-y-3",
                      isSelected
                        ? "border-[#003399] dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 shadow-md ring-2 ring-blue-500/20"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950 text-[#003399] dark:text-blue-300 font-bold text-xs flex items-center justify-center font-mono">
                          {idx + 1}
                        </span>
                        <h4 className="font-extrabold text-sm text-[#003399] dark:text-blue-400">
                          {kelas}
                        </h4>
                        {isSelected && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-600 text-white">
                            Dipilih
                          </span>
                        )}
                      </div>

                      {/* Quick Dropdown: Pilih dari Data Guru */}
                      {teacherOptions.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                            Pilih dari Guru:
                          </span>
                          <select
                            onChange={(e) => {
                              const found = teacherOptions.find(t => t.id === e.target.value);
                              if (found) handleSelectTeacherPreset(kelas, found);
                              e.target.value = '';
                            }}
                            defaultValue=""
                            className="text-xs px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-blue-500"
                            title="Pilih nama guru dari database Data Guru sekolah"
                          >
                            <option value="" disabled>-- Pilih Guru --</option>
                            {teacherOptions.map(t => (
                              <option key={t.id} value={t.id}>
                                {t.nama} {t.tingkatKelas ? `(${t.tingkatKelas})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Nama Lengkap Wali Kelas <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={item.nama}
                          onChange={(e) => handleFieldChange(kelas, 'nama', e.target.value)}
                          placeholder="Contoh: Dewi Anggraini, S.Pd.SD"
                          className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          NIP Wali Kelas
                        </label>
                        <input
                          type="text"
                          value={item.nip}
                          onChange={(e) => handleFieldChange(kelas, 'nip', e.target.value)}
                          placeholder="Contoh: 19901103 201502 2 009 atau -"
                          className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Nama dan NIP wali kelas yang disimpan akan langsung tampil pada <strong>Tabel Siswa per Rombel</strong>, rekapitulasi cetak rombel resmi, dan dokumen pengesahan sekolah.
            </p>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Batal
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer transform active:scale-98"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan Wali Kelas</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
