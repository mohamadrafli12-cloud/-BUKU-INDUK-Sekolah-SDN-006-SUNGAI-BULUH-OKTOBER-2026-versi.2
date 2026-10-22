import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Check, 
  Trash2, 
  Edit2, 
  AlertCircle, 
  Save, 
  GraduationCap, 
  CheckCircle2,
  RefreshCw,
  Layers,
  Sparkles,
  Users,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { cn } from '../../lib/utils';

interface ManageClassesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClass?: string;
  onSelectClass?: (className: string) => void;
}

export const defaultClassList = [
  'Kelas 1',
  'Kelas 2',
  'Kelas 3',
  'Kelas 4',
  'Kelas 5',
  'Kelas 6',
  'Alumni (Tahun 2026)',
  'Alumni (Tahun 2025)',
];

interface DeleteTarget {
  className: string;
  studentCount: number;
  replacementClass: string;
}

export const ManageClassesModal: React.FC<ManageClassesModalProps> = ({
  isOpen,
  onClose,
  currentClass,
  onSelectClass,
}) => {
  const { schoolProfile, updateSchoolProfile, logActivity, students, setStudents } = useSchool();

  const getInitialClasses = (): string[] => {
    if (schoolProfile.daftarKelas && Array.isArray(schoolProfile.daftarKelas) && schoolProfile.daftarKelas.length > 0) {
      return [...schoolProfile.daftarKelas];
    }
    return [...defaultClassList];
  };

  const [classList, setClassList] = useState<string[]>(getInitialClasses);
  const [newClassInput, setNewClassInput] = useState('');
  const [inputError, setInputError] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isSuccessMessage, setIsSuccessMessage] = useState(false);
  const [successToastText, setSuccessToastText] = useState('Daftar pilihan kelas berhasil diperbarui dan disimpan!');
  const [autoUpdateStudents, setAutoUpdateStudents] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const triggerToast = (msg: string) => {
    setSuccessToastText(msg);
    setIsSuccessMessage(true);
    setTimeout(() => {
      setIsSuccessMessage(false);
    }, 2800);
  };

  // Sync state ONLY when modal opens (do not re-trigger on profile or students changes while open)
  useEffect(() => {
    if (isOpen) {
      const initial = getInitialClasses();
      setClassList(initial);
      setNewClassInput('');
      setInputError('');
      setEditingIndex(null);
      setEditValue('');
      setIsSuccessMessage(false);
      setDeleteTarget(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Student count helper per class
  const getStudentCount = (clsName: string) => {
    return students.filter(s => s.kelasSekarang === clsName).length;
  };

  const handleAddClass = () => {
    const trimmed = newClassInput.trim();
    if (!trimmed) {
      setInputError('Nama kelas tidak boleh kosong');
      return;
    }
    if (classList.includes(trimmed)) {
      setInputError(`Kelas "${trimmed}" sudah ada di daftar pilihan`);
      return;
    }

    const updated = [...classList, trimmed];
    setClassList(updated);
    setNewClassInput('');
    setInputError('');

    updateSchoolProfile({ daftarKelas: updated });
    logActivity('EDIT', `Menambahkan pilihan kelas baru: ${trimmed}`);
    triggerToast(`Pilihan kelas "${trimmed}" berhasil ditambahkan dan disimpan!`);
  };

  const handleStartEdit = (idx: number) => {
    setEditingIndex(idx);
    setEditValue(classList[idx]);
    setInputError('');
  };

  const handleSaveEdit = (idx: number) => {
    const trimmed = editValue.trim();
    const oldName = classList[idx];

    if (!trimmed) {
      setEditingIndex(null);
      return;
    }

    if (trimmed !== oldName && classList.includes(trimmed)) {
      setInputError(`Pilihan kelas "${trimmed}" sudah terdaftar.`);
      return;
    }

    const updated = [...classList];
    updated[idx] = trimmed;
    setClassList(updated);
    setEditingIndex(null);
    setInputError('');

    // If enabled and class name changed, update students currently in oldName
    if (trimmed !== oldName) {
      if (autoUpdateStudents) {
        setStudents(prev => prev.map(s => {
          let updatedStudent = s;
          if (s.kelasSekarang === oldName) {
            updatedStudent = { ...updatedStudent, kelasSekarang: trimmed };
          }
          if (s.diterimaDiKelas === oldName) {
            updatedStudent = { ...updatedStudent, diterimaDiKelas: trimmed };
          }
          return updatedStudent;
        }));
        const countAffected = students.filter(s => s.kelasSekarang === oldName).length;
        if (countAffected > 0) {
          logActivity('EDIT', `Memperbarui kelas ${countAffected} siswa dari "${oldName}" menjadi "${trimmed}"`);
        }
      }

      // If currently selected class in parent form is the one edited, propagate change
      if (currentClass === oldName && onSelectClass) {
        onSelectClass(trimmed);
      }
    }

    updateSchoolProfile({ daftarKelas: updated });
    logActivity('EDIT', `Mengubah nama pilihan kelas "${oldName}" menjadi "${trimmed}"`);
    triggerToast(`Nama kelas "${oldName}" berhasil diubah menjadi "${trimmed}" dan disimpan!`);
  };

  const handleDeleteClick = (clsToDelete: string) => {
    const studentCount = getStudentCount(clsToDelete);
    if (studentCount > 0) {
      const remaining = classList.filter(c => c !== clsToDelete);
      setDeleteTarget({
        className: clsToDelete,
        studentCount,
        replacementClass: remaining[0] || 'Kelas 1',
      });
      return;
    }

    // Direct delete if no students
    const updated = classList.filter(c => c !== clsToDelete);
    setClassList(updated);
    updateSchoolProfile({ daftarKelas: updated });
    logActivity('EDIT', `Menghapus pilihan kelas: ${clsToDelete}`);
    triggerToast(`Pilihan kelas "${clsToDelete}" berhasil dihapus dan disimpan!`);
  };

  const handleConfirmDeleteWithTransfer = (transferStudents: boolean) => {
    if (!deleteTarget) return;

    const clsToDelete = deleteTarget.className;
    const targetClass = deleteTarget.replacementClass;

    if (transferStudents && targetClass) {
      setStudents(prev => prev.map(s => {
        let updatedStudent = s;
        if (s.kelasSekarang === clsToDelete) {
          updatedStudent = { ...updatedStudent, kelasSekarang: targetClass };
        }
        return updatedStudent;
      }));
      logActivity('EDIT', `Memindahkan ${deleteTarget.studentCount} siswa dari "${clsToDelete}" ke "${targetClass}"`);
    }

    const updated = classList.filter(c => c !== clsToDelete);
    setClassList(updated);
    updateSchoolProfile({ daftarKelas: updated });
    logActivity('EDIT', `Menghapus pilihan kelas: ${clsToDelete}`);
    setDeleteTarget(null);
    triggerToast(
      transferStudents
        ? `Kelas "${clsToDelete}" dihapus & ${deleteTarget.studentCount} siswa berhasil dipindahkan ke "${targetClass}"!`
        : `Pilihan kelas "${clsToDelete}" berhasil dihapus dari daftar!`
    );
  };

  const handlePresetRombelParalel = () => {
    const parallel: string[] = [];
    ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'].forEach(k => {
      parallel.push(`${k} A`);
      parallel.push(`${k} B`);
    });
    const merged = Array.from(new Set([...classList, ...parallel]));
    setClassList(merged);
    updateSchoolProfile({ daftarKelas: merged });
    logActivity('EDIT', 'Menambahkan pilihan kelas rombel paralel A & B');
    triggerToast('Preset rombel paralel A & B berhasil ditambahkan!');
  };

  const handlePresetSMP = () => {
    const smpClasses = ['Kelas 7A', 'Kelas 7B', 'Kelas 8A', 'Kelas 8B', 'Kelas 9A', 'Kelas 9B'];
    const merged = Array.from(new Set([...classList, ...smpClasses]));
    setClassList(merged);
    updateSchoolProfile({ daftarKelas: merged });
    logActivity('EDIT', 'Menambahkan pilihan kelas jenjang SMP/MTs');
    triggerToast('Preset kelas jenjang SMP/MTs berhasil ditambahkan!');
  };

  const handleResetToDefault = () => {
    if (window.confirm('Reset daftar pilihan kelas ke daftar standar (Kelas 1 - Kelas 6 & Alumni)?')) {
      setClassList([...defaultClassList]);
      updateSchoolProfile({ daftarKelas: [...defaultClassList] });
      logActivity('EDIT', 'Mereset daftar pilihan kelas ke standar');
      triggerToast('Daftar pilihan kelas berhasil direset ke standar SD!');
    }
  };

  const handleSelectAndClose = (clsName: string) => {
    if (onSelectClass) {
      onSelectClass(clsName);
    }
    onClose();
  };

  const handleSaveAll = () => {
    let finalList = [...classList];
    // If currently editing inline, commit it
    if (editingIndex !== null && editingIndex >= 0 && editingIndex < finalList.length) {
      const trimmed = editValue.trim();
      const oldName = finalList[editingIndex];
      if (trimmed && trimmed !== oldName && !finalList.includes(trimmed)) {
        finalList[editingIndex] = trimmed;
        if (autoUpdateStudents) {
          setStudents(prev => prev.map(s => {
            let updatedStudent = s;
            if (s.kelasSekarang === oldName) {
              updatedStudent = { ...updatedStudent, kelasSekarang: trimmed };
            }
            if (s.diterimaDiKelas === oldName) {
              updatedStudent = { ...updatedStudent, diterimaDiKelas: trimmed };
            }
            return updatedStudent;
          }));
        }
        if (currentClass === oldName && onSelectClass) {
          onSelectClass(trimmed);
        }
      }
      setEditingIndex(null);
    }

    setClassList(finalList);
    updateSchoolProfile({ daftarKelas: finalList });
    triggerToast('Seluruh daftar pilihan kelas berhasil disimpan!');
    setTimeout(() => {
      onClose();
    }, 700);
  };

  return (
    <div 
      className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      id="modal-manage-classes"
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <GraduationCap className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-wide flex items-center gap-2">
                Kelola & Edit Pilihan Kelas
                <span className="text-[11px] bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded-full">
                  {classList.length} Kelas
                </span>
              </h2>
              <p className="text-xs text-blue-100/90">
                Atur daftar pilihan kelas untuk formulir pendaftaran & register siswa
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Notification / Success toast */}
          {isSuccessMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 rounded-xl flex items-center gap-2 text-emerald-800 dark:text-emerald-200 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successToastText}</span>
            </div>
          )}

          {/* Dialog Konfirmasi Hapus Rombel yang Memiliki Siswa */}
          {deleteTarget && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/50 border-2 border-amber-300 dark:border-amber-700 rounded-2xl space-y-3 animate-in zoom-in-95">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-black text-amber-950 dark:text-amber-100">
                    Konfirmasi Hapus Rombel: {deleteTarget.className}
                  </h4>
                  <p className="text-[11.5px] text-amber-900 dark:text-amber-200 mt-1">
                    Terdapat <strong>{deleteTarget.studentCount} siswa</strong> yang saat ini berada di kelas{' '}
                    <span className="font-bold underline">{deleteTarget.className}</span>.
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-amber-200 dark:border-amber-800 space-y-2">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Pindahkan {deleteTarget.studentCount} siswa tersebut ke kelas:
                </label>
                <select
                  value={deleteTarget.replacementClass}
                  onChange={(e) => setDeleteTarget({ ...deleteTarget, replacementClass: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {classList
                    .filter(c => c !== deleteTarget.className)
                    .map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmDeleteWithTransfer(false)}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                  title="Hanya hapus dari pilihan kelas tanpa memindahkan siswa"
                >
                  Hapus Tanpa Memindahkan Siswa
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmDeleteWithTransfer(true)}
                  className="px-4 py-1.5 text-xs font-black rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Pindahkan Siswa & Hapus Rombel</span>
                </button>
              </div>
            </div>
          )}

          {/* Form Tambah Kelas Baru */}
          <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-xl">
            <label className="block text-xs font-black text-blue-950 dark:text-blue-200 mb-1.5 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Tambah Pilihan Kelas Baru:</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newClassInput}
                onChange={(e) => {
                  setNewClassInput(e.target.value);
                  if (inputError) setInputError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddClass();
                  }
                }}
                placeholder="Contoh: Kelas 1A, Kelas 1B, Kelas 2A..."
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleAddClass}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </button>
            </div>
            {inputError && (
              <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {inputError}
              </p>
            )}

            {/* Saran Preset Cepat */}
            <div className="mt-2.5 pt-2.5 border-t border-blue-200/60 dark:border-blue-900/50 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> Preset:
              </span>
              <button
                type="button"
                onClick={handlePresetRombelParalel}
                className="text-[10.5px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer transition-colors"
              >
                + Rombel A & B (1A - 6B)
              </button>
              <button
                type="button"
                onClick={handlePresetSMP}
                className="text-[10.5px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer transition-colors"
              >
                + SMP/MTs (7A - 9B)
              </button>
              <button
                type="button"
                onClick={handleResetToDefault}
                className="text-[10.5px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950 border border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400 font-semibold cursor-pointer transition-colors ml-auto"
              >
                Reset Standar SD
              </button>
            </div>
          </div>

          {/* Opsi sinkronisasi otomatis siswa */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="check-auto-update-students"
                checked={autoUpdateStudents}
                onChange={(e) => setAutoUpdateStudents(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-blue-600 cursor-pointer"
              />
              <label htmlFor="check-auto-update-students" className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer text-[11px]">
                Jika mengubah nama kelas, otomatis perbarui data kelas siswa terkait
              </label>
            </div>
          </div>

          {/* Daftar Pilihan Kelas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Daftar Pilihan Kelas Tersedia ({classList.length}):</span>
              </label>
              <span className="text-[10px] text-slate-500">
                Klik ikon pensil untuk mengedit teks atau ikon tempat sampah untuk menghapus
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 max-h-72 overflow-y-auto">
              {classList.map((cls, idx) => {
                const count = getStudentCount(cls);
                const isSelected = currentClass === cls;
                const isEditing = editingIndex === idx;

                return (
                  <div
                    key={`${cls}-${idx}`}
                    className={cn(
                      "px-3 py-2 flex items-center justify-between gap-2 transition-colors",
                      isSelected ? "bg-blue-50/70 dark:bg-blue-950/40" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    )}
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1 animate-in fade-in">
                        <input
                          type="text"
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveEdit(idx);
                            }
                            if (e.key === 'Escape') {
                              setEditingIndex(null);
                            }
                          }}
                          className="flex-1 px-2.5 py-1 text-xs font-bold rounded-lg border-2 border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(idx)}
                          className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                          title="Simpan Perubahan Teks Kelas"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingIndex(null)}
                          className="p-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs cursor-pointer"
                          title="Batal"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="w-5 text-[11px] font-mono text-slate-400 text-right">
                            {idx + 1}.
                          </span>
                          <span className={cn(
                            "text-xs font-bold truncate",
                            isSelected ? "text-blue-700 dark:text-blue-300" : "text-slate-800 dark:text-slate-200"
                          )}>
                            {cls}
                          </span>
                          {isSelected && (
                            <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-extrabold shrink-0">
                              Terpilih di Form
                            </span>
                          )}
                          {count > 0 && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-0.5 shrink-0 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                              <Users className="w-3 h-3 text-slate-400" />
                              <span>{count} siswa</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {onSelectClass && (
                            <button
                              type="button"
                              onClick={() => handleSelectAndClose(cls)}
                              className={cn(
                                "px-2 py-1 text-[10px] font-bold rounded-lg transition-colors cursor-pointer",
                                isSelected
                                  ? "bg-blue-600 text-white shadow-xs"
                                  : "bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                              )}
                              title="Pilih kelas ini untuk siswa saat ini"
                            >
                              {isSelected ? '✓ Terpilih' : 'Pilih'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleStartEdit(idx)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors cursor-pointer"
                            title="Edit tulisan nama kelas"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(cls)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus rombel dari daftar pilihan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            className="px-5 py-2 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Simpan Perubahan Pilihan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
