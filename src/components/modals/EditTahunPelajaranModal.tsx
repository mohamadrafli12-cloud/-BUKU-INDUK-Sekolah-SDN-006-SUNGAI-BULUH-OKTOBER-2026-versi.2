import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Plus, 
  Check, 
  Trash2, 
  Edit2, 
  AlertCircle, 
  Save, 
  Clock, 
  CheckCircle2,
  RefreshCw,
  Layers,
  Sparkles,
  Edit3
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { cn } from '../../lib/utils';

interface EditTahunPelajaranModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSelectedTP?: string;
}

export const EditTahunPelajaranModal: React.FC<EditTahunPelajaranModalProps> = ({
  isOpen,
  onClose,
  initialSelectedTP,
}) => {
  const { schoolProfile, updateSchoolProfile, logActivity, currentRole, students, addOrUpdateRaport } = useSchool();

  const currentTP = schoolProfile.tahunPelajaranAktif || '2025/2026';
  const currentSemester = schoolProfile.semesterAktif || 'Ganjil';
  const tpList = schoolProfile.daftarTahunPelajaran && schoolProfile.daftarTahunPelajaran.length > 0 
    ? schoolProfile.daftarTahunPelajaran 
    : ['2023/2024', '2024/2025', '2025/2026', '2026/2027'];

  const [activeTP, setActiveTP] = useState<string>(initialSelectedTP || currentTP);
  const [activeSemester, setActiveSemester] = useState<'Ganjil' | 'Genap'>(
    currentSemester === 'Genap' || currentSemester === '2' ? 'Genap' : 'Ganjil'
  );
  const [listTP, setListTP] = useState<string[]>(tpList);
  
  // New TP input
  const [newTPInput, setNewTPInput] = useState('');
  const [inputError, setInputError] = useState('');

  // Editing existing TP
  const [editingTPIndex, setEditingTPIndex] = useState<number | null>(null);
  const [editTPValue, setEditTPValue] = useState('');

  // Manual input for active TP
  const [isManualActiveTP, setIsManualActiveTP] = useState(false);
  const [manualActiveTPInput, setManualActiveTPInput] = useState('');

  // Sync to raport option
  const [syncToRaport, setSyncToRaport] = useState(false);
  const [isSuccessMessage, setIsSuccessMessage] = useState(false);

  if (!isOpen) return null;

  const handleAddTP = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTPInput.trim();
    if (!trimmed) {
      setInputError('Tahun pelajaran tidak boleh kosong.');
      return;
    }

    // Validation for format like YYYY/YYYY (e.g. 2026/2027)
    const tpRegex = /^\d{4}\/\d{4}$/;
    if (!tpRegex.test(trimmed)) {
      setInputError('Format harus berupa YYYY/YYYY (contoh: 2026/2027)');
      return;
    }

    if (listTP.includes(trimmed)) {
      setInputError('Tahun pelajaran ini sudah ada dalam daftar.');
      return;
    }

    const updated = [...listTP, trimmed].sort();
    setListTP(updated);
    setNewTPInput('');
    setInputError('');
  };

  const handleStartEdit = (index: number) => {
    setEditingTPIndex(index);
    setEditTPValue(listTP[index]);
  };

  const handleSaveEdit = (index: number) => {
    const trimmed = editTPValue.trim();
    const tpRegex = /^\d{4}\/\d{4}$/;
    if (!tpRegex.test(trimmed)) {
      alert('Format harus berupa YYYY/YYYY (contoh: 2026/2027)');
      return;
    }
    const oldVal = listTP[index];
    const updated = [...listTP];
    updated[index] = trimmed;
    setListTP(updated);
    if (activeTP === oldVal) {
      setActiveTP(trimmed);
    }
    setEditingTPIndex(null);
    setEditTPValue('');
  };

  const handleDeleteTP = (tpToDelete: string) => {
    if (listTP.length <= 1) {
      alert('Minimal harus tersisa satu Tahun Pelajaran.');
      return;
    }
    if (tpToDelete === activeTP) {
      alert('Tidak dapat menghapus Tahun Pelajaran yang sedang aktif. Silakan pilih TP lain terlebih dahulu.');
      return;
    }
    if (confirm(`Apakah Anda yakin ingin menghapus Tahun Pelajaran "${tpToDelete}" dari daftar?`)) {
      const updated = listTP.filter(tp => tp !== tpToDelete);
      setListTP(updated);
    }
  };

  const handleSaveAll = () => {
    const finalTP = isManualActiveTP && manualActiveTPInput.trim() ? manualActiveTPInput.trim() : activeTP;
    const finalList = Array.from(new Set([...listTP, finalTP])).sort();

    updateSchoolProfile({
      tahunPelajaranAktif: finalTP,
      semesterAktif: activeSemester,
      daftarTahunPelajaran: finalList,
    });

    logActivity(
      'PENGATURAN',
      `Memperbarui konfigurasi Tahun Pelajaran aktif menjadi: TP ${finalTP} (Semester ${activeSemester})`
    );

    setIsSuccessMessage(true);
    setTimeout(() => {
      setIsSuccessMessage(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-linear-to-r from-[#002266] to-[#003399] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 text-amber-300 border border-white/15">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-wide">
                Kelola & Edit Tahun Pelajaran (TP)
              </h3>
              <p className="text-xs text-blue-100/90">
                Pusat pengaturan Tahun Pelajaran aktif dan semester akademik
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

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Active TP & Semester Selector Card */}
          <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-blue-950 dark:text-blue-200 uppercase tracking-wide flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Tahun Pelajaran & Semester Aktif
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-extrabold">
                Default Sistem
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Tahun Pelajaran (TP) Aktif:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !isManualActiveTP;
                      setIsManualActiveTP(next);
                      if (next) {
                        setManualActiveTPInput(activeTP);
                      }
                    }}
                    className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    {isManualActiveTP ? (
                      <span>📋 Pilih dari Daftar</span>
                    ) : (
                      <>
                        <Edit3 className="w-3 h-3" />
                        <span>✏️ Isi Manual</span>
                      </>
                    )}
                  </button>
                </div>

                {isManualActiveTP ? (
                  <div className="space-y-1.5 animate-in fade-in duration-200">
                    <div className="relative">
                      <input
                        type="text"
                        autoFocus
                        value={manualActiveTPInput}
                        onChange={(e) => setManualActiveTPInput(e.target.value)}
                        placeholder="Contoh: 2026/2027"
                        className="w-full px-3 py-2 pr-16 rounded-xl border-2 border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = manualActiveTPInput.trim();
                          if (!val) return;
                          if (!listTP.includes(val)) {
                            setListTP([...listTP, val].sort());
                          }
                          setActiveTP(val);
                          setIsManualActiveTP(false);
                        }}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        Terapkan
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                      <span>Format baku: <strong>YYYY/YYYY</strong></span>
                      <button
                        type="button"
                        onClick={() => setIsManualActiveTP(false)}
                        className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-bold"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <select
                      value={activeTP}
                      onChange={(e) => {
                        if (e.target.value === '__manual__') {
                          setIsManualActiveTP(true);
                          setManualActiveTPInput(activeTP);
                        } else {
                          setActiveTP(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
                    >
                      <optgroup label="Tahun Pelajaran Terdaftar">
                        {listTP.map(tp => (
                          <option key={tp} value={tp}>
                            TP {tp} {tp === activeTP ? '(Sedang Aktif)' : ''}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Opsi Input Baru">
                        <option value="__manual__" className="text-blue-600 font-bold">
                          ✏️ + Isi Manual Tahun Pelajaran Baru...
                        </option>
                      </optgroup>
                    </select>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 px-0.5">
                      <span>Sedang aktif: <strong className="text-slate-700 dark:text-slate-300">TP {activeTP}</strong></span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsManualActiveTP(true);
                          setManualActiveTPInput(activeTP);
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer"
                      >
                        + Isi Manual
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Semester Aktif:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveSemester('Ganjil')}
                    className={cn(
                      "py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5",
                      activeSemester === 'Ganjil'
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50"
                    )}
                  >
                    {activeSemester === 'Ganjil' && <Check className="w-3.5 h-3.5" />}
                    Ganjil (Sem. 1)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSemester('Genap')}
                    className={cn(
                      "py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5",
                      activeSemester === 'Genap'
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50"
                    )}
                  >
                    {activeSemester === 'Genap' && <Check className="w-3.5 h-3.5" />}
                    Genap (Sem. 2)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* List of Registered Academic Years */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                Daftar Pilihan Tahun Pelajaran Terdaftar ({listTP.length})
              </label>
              <span className="text-[11px] text-slate-500">Klik bintang/centang untuk aktifkan</span>
            </div>

            <div className="space-y-2 border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50 dark:bg-slate-800/40">
              {listTP.map((tp, idx) => {
                const isActive = tp === activeTP;
                const isEditing = editingTPIndex === idx;

                return (
                  <div 
                    key={tp}
                    className={cn(
                      "flex items-center justify-between p-2.5 rounded-xl border transition-all",
                      isActive 
                        ? "bg-white dark:bg-slate-800 border-blue-400 dark:border-blue-600 shadow-xs" 
                        : "bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700"
                    )}
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1 mr-2">
                        <input
                          type="text"
                          value={editTPValue}
                          onChange={(e) => setEditTPValue(e.target.value)}
                          placeholder="2026/2027"
                          className="px-2.5 py-1 text-xs font-bold rounded-lg border border-blue-400 bg-white dark:bg-slate-900 flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(idx)}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                          title="Simpan"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingTPIndex(null)}
                          className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                          title="Batal"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => setActiveTP(tp)}
                          className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center border transition-all shrink-0",
                            isActive 
                              ? "bg-blue-600 border-blue-600 text-white" 
                              : "border-slate-400 hover:border-blue-500"
                          )}
                          title={isActive ? "Tahun Pelajaran Aktif" : "Klik untuk jadikan aktif"}
                        >
                          {isActive && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
                              Tahun Pelajaran {tp}
                            </span>
                            {isActive && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px]">
                                Aktif
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {!isEditing && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(idx)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                          title="Edit nama TP"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTP(tp)}
                          disabled={isActive}
                          className={cn(
                            "p-1.5 rounded-lg transition-colors",
                            isActive 
                              ? "text-slate-300 dark:text-slate-600 cursor-not-allowed" 
                              : "text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                          )}
                          title={isActive ? "Tidak dapat menghapus TP aktif" : "Hapus TP"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Add New TP */}
          <form onSubmit={handleAddTP} className="p-3.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/30 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                Tambah Tahun Pelajaran Baru
              </label>
              <span className="text-[10px] text-slate-400">Format: 2026/2027</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTPInput}
                onChange={(e) => {
                  setNewTPInput(e.target.value);
                  setInputError('');
                }}
                placeholder="Contoh: 2026/2027"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambahkan</span>
              </button>
            </div>

            {inputError && (
              <p className="text-[11px] text-red-600 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {inputError}
              </p>
            )}
          </form>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Perubahan berlaku untuk tabel distribusi peringkat & grafik
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all"
            >
              {isSuccessMessage ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Tersimpan!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan TP</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
