import React, { useState, useEffect } from 'react';
import { 
  X, 
  Award, 
  Save, 
  Sparkles, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  Medal, 
  ArrowUpDown,
  BookOpen
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { Student, SemesterReport, SubjectGrade } from '../../types';
import { sampleSubjects } from '../../data/initialData';
import { cn } from '../../lib/utils';

interface EditPeringkatKelasModalProps {
  isOpen: boolean;
  onClose: () => void;
  kelas: string;
  tahunPelajaran: string;
  semesterName: string;
}

interface StudentRankState {
  studentId: string;
  noInduk: string;
  nisn: string;
  namaLengkap: string;
  jenisKelamin: 'L' | 'P';
  peringkat: number;
  nilaiRataRata: number;
  catatan: string;
  hasRaport: boolean;
}

export const EditPeringkatKelasModal: React.FC<EditPeringkatKelasModalProps> = ({
  isOpen,
  onClose,
  kelas,
  tahunPelajaran,
  semesterName,
}) => {
  const { students, addOrUpdateRaport, logActivity } = useSchool();
  const [rankList, setRankList] = useState<StudentRankState[]>([]);
  const [isSaved, setIsSaved] = useState(false);

  // Map semester text to semester number (e.g. Kelas 6 Ganjil = 11, Genap = 12, etc.)
  const getSemesterNumber = (kelasStr: string, semStr: string): number => {
    const classNumMatch = kelasStr.match(/\d+/);
    const classNum = classNumMatch ? parseInt(classNumMatch[0]) : 6;
    const isGenap = semStr.toLowerCase().includes('genap') || semStr === '2';
    return (classNum - 1) * 2 + (isGenap ? 2 : 1);
  };

  const semNumber = getSemesterNumber(kelas, semesterName);

  useEffect(() => {
    if (!isOpen) return;

    // Filter students for this class
    const classStudents = students.filter(s => s.status === 'Aktif' && s.kelasSekarang === kelas);

    const initialData: StudentRankState[] = classStudents.map((s, idx) => {
      // Find raport for this semester & TP
      const report = s.raport?.find(r => r.semester === semNumber) || s.raport?.[0];
      
      let avg = 85;
      if (report?.nilai && report.nilai.length > 0) {
        const total = report.nilai.reduce((acc, n) => acc + (n.nilaiAkhir || 0), 0);
        avg = Number((total / report.nilai.length).toFixed(1));
      } else {
        // Synthesize standard initial grade baseline for student if empty
        avg = 80 + Math.floor(Math.random() * 15);
      }

      const assignedRank = report?.peringkatKelas || (idx + 1);

      return {
        studentId: s.id,
        noInduk: s.noInduk,
        nisn: s.nisn,
        namaLengkap: s.namaLengkap,
        jenisKelamin: s.jenisKelamin,
        peringkat: assignedRank,
        nilaiRataRata: avg,
        catatan: report?.catatanWaliKelas || 'Menunjukkan peningkatan belajar yang konsisten.',
        hasRaport: !!report,
      };
    });

    // Sort by peringkat initial
    initialData.sort((a, b) => a.peringkat - b.peringkat);
    setRankList(initialData);
  }, [isOpen, kelas, semNumber, students]);

  if (!isOpen) return null;

  // Auto calculate rank by Average Score desc
  const handleAutoCalculateRank = () => {
    const sorted = [...rankList].sort((a, b) => b.nilaiRataRata - a.nilaiRataRata);
    const updated = sorted.map((item, index) => ({
      ...item,
      peringkat: index + 1,
    }));
    setRankList(updated);
  };

  const handleRankChange = (studentId: string, newRank: number) => {
    setRankList(prev =>
      prev.map(item =>
        item.studentId === studentId ? { ...item, peringkat: newRank } : item
      )
    );
  };

  const handleScoreChange = (studentId: string, newScore: number) => {
    setRankList(prev =>
      prev.map(item =>
        item.studentId === studentId ? { ...item, nilaiRataRata: newScore } : item
      )
    );
  };

  const handleCatatanChange = (studentId: string, text: string) => {
    setRankList(prev =>
      prev.map(item =>
        item.studentId === studentId ? { ...item, catatan: text } : item
      )
    );
  };

  const handleSaveAll = () => {
    const totalSiswaKelas = rankList.length;

    rankList.forEach(item => {
      const student = students.find(s => s.id === item.studentId);
      if (!student) return;

      const existingReport = student.raport?.find(r => r.semester === semNumber);
      
      // Default subject template if not exists
      const grades: SubjectGrade[] = existingReport?.nilai || sampleSubjects.map(sub => ({
        mapel: sub,
        kkm: 75,
        pengetahuan: Math.round(item.nilaiRataRata),
        keterampilan: Math.round(item.nilaiRataRata),
        nilaiAkhir: Math.round(item.nilaiRataRata),
        predikat: item.nilaiRataRata >= 88 ? 'A' : item.nilaiRataRata >= 80 ? 'B' : 'C',
      }));

      const newReport: SemesterReport = {
        semester: semNumber,
        kelas,
        tahunAjaran: tahunPelajaran,
        nilai: grades,
        kehadiran: existingReport?.kehadiran || { sakit: 0, izin: 0, tanpaKeterangan: 0 },
        sikapSpiritual: existingReport?.sikapSpiritual || 'Sangat Baik',
        sikapSosial: existingReport?.sikapSosial || 'Sangat Baik',
        ekstrakurikuler: existingReport?.ekstrakurikuler || [{ kegiatan: 'Pramuka', keterangan: 'Aktif' }],
        catatanWaliKelas: item.catatan,
        peringkatKelas: item.peringkat,
        totalSiswaKelas,
      };

      addOrUpdateRaport(student.id, newReport);
    });

    logActivity(
      'EDIT',
      `Menetapkan pembaruan data peringkat siswa ${kelas} untuk TP ${tahunPelajaran} (${semesterName})`
    );

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-linear-to-r from-[#002266] via-[#003399] to-[#0047b3] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-black shadow-md">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold tracking-wide">
                  Kelola & Tetapkan Peringkat {kelas}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-amber-300 text-[10px] font-bold">
                  TP {tahunPelajaran} • Sem. {semesterName}
                </span>
              </div>
              <p className="text-xs text-blue-100/90">
                Atur urutan juara kelas dan rekapitulasi nilai rata-rata peserta didik
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

        {/* Top Action Bar */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Total Siswa di {kelas}: <strong>{rankList.length} Anak</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAutoCalculateRank}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold flex items-center gap-1.5 shadow-xs transition-all"
              title="Urutkan juara berdasarkan nilai rata-rata tertinggi otomatis"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hitung Otomatis Ranking dari Nilai</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-3">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase text-[11px] font-extrabold sticky top-0 z-10">
              <tr>
                <th className="p-3 w-16 text-center rounded-l-xl">Peringkat</th>
                <th className="p-3">Identitas Siswa</th>
                <th className="p-3 w-20 text-center">Gender</th>
                <th className="p-3 w-28 text-center">Rata-rata Nilai</th>
                <th className="p-3">Catatan Wali Kelas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rankList.map((item, idx) => {
                const isTop1 = item.peringkat === 1;
                const isTop2 = item.peringkat === 2;
                const isTop3 = item.peringkat === 3;

                return (
                  <tr 
                    key={item.studentId}
                    className={cn(
                      "hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors",
                      isTop1 ? "bg-amber-50/50 dark:bg-amber-950/20" :
                      isTop2 ? "bg-slate-50 dark:bg-slate-900/40" :
                      isTop3 ? "bg-orange-50/40 dark:bg-orange-950/10" : ""
                    )}
                  >
                    {/* Rank Badge Input */}
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {isTop1 ? (
                          <span className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-black flex items-center justify-center shadow-xs text-xs">
                            🥇 1
                          </span>
                        ) : isTop2 ? (
                          <span className="w-7 h-7 rounded-lg bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-black flex items-center justify-center shadow-xs text-xs">
                            🥈 2
                          </span>
                        ) : isTop3 ? (
                          <span className="w-7 h-7 rounded-lg bg-amber-700 text-white font-black flex items-center justify-center shadow-xs text-xs">
                            🥉 3
                          </span>
                        ) : (
                          <input
                            type="number"
                            min="1"
                            max={rankList.length}
                            value={item.peringkat}
                            onChange={(e) => handleRankChange(item.studentId, parseInt(e.target.value) || 1)}
                            className="w-10 h-7 text-center font-extrabold rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-1 focus:ring-blue-500"
                          />
                        )}
                      </div>
                    </td>

                    {/* Student Info */}
                    <td className="p-3">
                      <div className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                        {item.namaLengkap}
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>NIS: <strong className="font-mono text-blue-600 dark:text-blue-400">{item.noInduk}</strong></span>
                        <span>•</span>
                        <span>NISN: <span className="font-mono">{item.nisn}</span></span>
                      </div>
                    </td>

                    {/* Gender */}
                    <td className="p-3 text-center">
                      <span className={cn(
                        "px-2 py-0.5 rounded-md text-[10px] font-extrabold",
                        item.jenisKelamin === 'L' 
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" 
                          : "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300"
                      )}>
                        {item.jenisKelamin === 'L' ? 'L (Laki)' : 'P (Perempuan)'}
                      </span>
                    </td>

                    {/* Average Score */}
                    <td className="p-3 text-center">
                      <div className="inline-flex items-center gap-1">
                        <input
                          type="number"
                          step="0.1"
                          min="50"
                          max="100"
                          value={item.nilaiRataRata}
                          onChange={(e) => handleScoreChange(item.studentId, parseFloat(e.target.value) || 0)}
                          className="w-16 px-2 py-1 text-center font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </td>

                    {/* Catatan */}
                    <td className="p-3">
                      <input
                        type="text"
                        value={item.catatan}
                        onChange={(e) => handleCatatanChange(item.studentId, e.target.value)}
                        placeholder="Catatan prestasi siswa..."
                        className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Perubahan akan memperbarui rekaman raport semester {semNumber} ({kelas})
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
              {isSaved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Peringkat Tersimpan!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Rekap Peringkat</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
