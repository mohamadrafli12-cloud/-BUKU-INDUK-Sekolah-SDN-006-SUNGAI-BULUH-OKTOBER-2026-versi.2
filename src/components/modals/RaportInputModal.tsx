import React, { useState, useEffect } from 'react';
import { X, Award, Save, Plus, Trash2, GraduationCap, School, Sparkles, CheckCircle2 } from 'lucide-react';
import { Student, SemesterReport, SubjectGrade } from '../../types';
import { sampleSubjects } from '../../data/initialData';
import { useSchool } from '../../context/SchoolContext';

interface RaportInputModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (studentId: string, report: SemesterReport) => void;
}

export const RaportInputModal: React.FC<RaportInputModalProps> = ({
  student,
  isOpen,
  onClose,
  onSave,
}) => {
  const { schoolProfile, getWaliKelasForClass, getKepalaSekolah } = useSchool();
  const [semester, setSemester] = useState<number>(11);
  const [kelas, setKelas] = useState<string>('Kelas 6');
  const [tahunAjaran, setTahunAjaran] = useState<string>(schoolProfile.tahunPelajaranAktif || '2025/2026');
  const [grades, setGrades] = useState<SubjectGrade[]>([]);
  const [sakit, setSakit] = useState<number>(0);
  const [izin, setIzin] = useState<number>(0);
  const [alpa, setAlpa] = useState<number>(0);
  const [sikapSpiritual, setSikapSpiritual] = useState<'Sangat Baik' | 'Baik' | 'Cukup' | 'Kurang'>('Sangat Baik');
  const [sikapSosial, setSikapSosial] = useState<'Sangat Baik' | 'Baik' | 'Cukup' | 'Kurang'>('Sangat Baik');
  const [catatanWaliKelas, setCatatanWaliKelas] = useState<string>('Pertahankan semangat belajar dan terus berprestasi.');
  const [peringkat, setPeringkat] = useState<number>(1);
  const [totalSiswa, setTotalSiswa] = useState<number>(28);

  const waliKelasInfo = getWaliKelasForClass(kelas);
  const kepsekInfo = getKepalaSekolah();

  // Helper to map semester to class
  const getSuggestedKelasForSemester = (sem: number) => {
    if (sem <= 2) return 'Kelas 1';
    if (sem <= 4) return 'Kelas 2';
    if (sem <= 6) return 'Kelas 3';
    if (sem <= 8) return 'Kelas 4';
    if (sem <= 10) return 'Kelas 5';
    return 'Kelas 6';
  };

  const handleSemesterChange = (newSem: number) => {
    setSemester(newSem);
    if (student) {
      const existing = student.raport?.find(r => r.semester === newSem);
      if (existing) {
        setKelas(existing.kelas);
      } else {
        setKelas(getSuggestedKelasForSemester(newSem));
      }
    }
  };

  useEffect(() => {
    if (student) {
      // If student already has raport for chosen semester, pre-fill
      const existing = student.raport?.find(r => r.semester === semester);
      if (existing) {
        setKelas(existing.kelas);
        setTahunAjaran(existing.tahunAjaran);
        setGrades(existing.nilai);
        setSakit(existing.kehadiran.sakit);
        setIzin(existing.kehadiran.izin);
        setAlpa(existing.kehadiran.tanpaKeterangan);
        setSikapSpiritual(existing.sikapSpiritual);
        setSikapSosial(existing.sikapSosial);
        setCatatanWaliKelas(existing.catatanWaliKelas);
        setPeringkat(existing.peringkatKelas || 1);
        setTotalSiswa(existing.totalSiswaKelas || 28);
      } else {
        // Initialize default subject template
        const defaultGrades: SubjectGrade[] = sampleSubjects.map(sub => ({
          mapel: sub,
          kkm: 75,
          pengetahuan: 85,
          keterampilan: 85,
          nilaiAkhir: 85,
          predikat: 'B',
        }));
        setKelas(student.kelasSekarang || 'Kelas 6');
        setTahunAjaran(schoolProfile.tahunPelajaranAktif || '2025/2026');
        setGrades(defaultGrades);
        setSakit(0);
        setIzin(0);
        setAlpa(0);
      }
    }
  }, [student, semester, isOpen]);

  if (!isOpen || !student) return null;

  const handleGradeChange = (index: number, field: 'kkm' | 'pengetahuan' | 'keterampilan', value: number) => {
    setGrades(prev => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };
      const avg = Math.round((item.pengetahuan + item.keterampilan) / 2);
      item.nilaiAkhir = avg;
      if (avg >= 88) item.predikat = 'A';
      else if (avg >= 80) item.predikat = 'B';
      else if (avg >= 75) item.predikat = 'C';
      else item.predikat = 'D';
      updated[index] = item;
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const report: SemesterReport = {
      semester,
      kelas,
      tahunAjaran,
      nilai: grades,
      kehadiran: {
        sakit,
        izin,
        tanpaKeterangan: alpa,
      },
      sikapSpiritual,
      sikapSosial,
      ekstrakurikuler: [
        { kegiatan: 'Pramuka', keterangan: 'Aktif' }
      ],
      catatanWaliKelas,
      peringkatKelas: peringkat,
      totalSiswaKelas: totalSiswa,
    };
    onSave(student.id, report);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#003399] text-white">
          <div className="flex items-center gap-3">
            <Award className="w-6 h-6 text-amber-300" />
            <div>
              <h3 className="text-base font-bold tracking-wide">
                INPUT REKAP NILAI HASIL BELAJAR RAPORT
              </h3>
              <p className="text-xs text-blue-100">
                Siswa: <strong className="text-amber-300">{student.namaLengkap}</strong> (NIS: {student.noInduk})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Semester selector bar */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <label className="font-bold text-slate-700 dark:text-slate-300">Pilih Semester:</label>
            <select
              value={semester}
              onChange={(e) => handleSemesterChange(parseInt(e.target.value))}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-blue-700 dark:text-blue-300"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((s) => (
                <option key={s} value={s}>
                  Semester {s} ({s <= 2 ? 'Kelas 1' : s <= 4 ? 'Kelas 2' : s <= 6 ? 'Kelas 3' : s <= 8 ? 'Kelas 4' : s <= 10 ? 'Kelas 5' : 'Kelas 6'})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="font-bold text-slate-700 dark:text-slate-300">Kelas:</label>
            <input
              type="text"
              value={kelas}
              onChange={(e) => setKelas(e.target.value)}
              className="px-2.5 py-1.5 w-24 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="font-bold text-slate-700 dark:text-slate-300">Tahun Ajaran:</label>
            <input
              type="text"
              list="daftar-tp-raport"
              value={tahunAjaran}
              onChange={(e) => setTahunAjaran(e.target.value)}
              className="px-2.5 py-1.5 w-32 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
              placeholder="cth: 2025/2026"
            />
            <datalist id="daftar-tp-raport">
              {(schoolProfile.daftarTahunPelajaran || ['2023/2024', '2024/2025', '2025/2026', '2026/2027']).map(tp => (
                <option key={tp} value={tp} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Table of subject grades */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 uppercase text-[11px] font-bold">
                <tr>
                  <th className="p-2.5">No</th>
                  <th className="p-2.5">Mata Pelajaran</th>
                  <th className="p-2.5 text-center w-20">KKM</th>
                  <th className="p-2.5 text-center w-24">Nilai Pengetahuan</th>
                  <th className="p-2.5 text-center w-24">Nilai Keterampilan</th>
                  <th className="p-2.5 text-center w-24">Nilai Akhir</th>
                  <th className="p-2.5 text-center w-20">Predikat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {grades.map((grade, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-2.5 text-slate-400 text-center font-mono">{idx + 1}</td>
                    <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200">
                      {grade.mapel}
                    </td>
                    <td className="p-2.5 text-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={grade.kkm}
                        onChange={(e) => handleGradeChange(idx, 'kkm', parseInt(e.target.value) || 0)}
                        className="w-16 text-center px-1.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                      />
                    </td>
                    <td className="p-2.5 text-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={grade.pengetahuan}
                        onChange={(e) => handleGradeChange(idx, 'pengetahuan', parseInt(e.target.value) || 0)}
                        className="w-16 text-center px-1.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                      />
                    </td>
                    <td className="p-2.5 text-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={grade.keterampilan}
                        onChange={(e) => handleGradeChange(idx, 'keterampilan', parseInt(e.target.value) || 0)}
                        className="w-16 text-center px-1.5 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                      />
                    </td>
                    <td className="p-2.5 text-center font-bold text-blue-600 dark:text-blue-400 text-sm font-mono">
                      {grade.nilaiAkhir}
                    </td>
                    <td className="p-2.5 text-center">
                      <span className="px-2 py-0.5 rounded font-extrabold text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
                        {grade.predikat}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sikap & Kehadiran */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-3">
              <h4 className="font-bold text-slate-800 dark:text-slate-200">Penilaian Sikap</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Sikap Spiritual</label>
                  <select
                    value={sikapSpiritual}
                    onChange={(e) => setSikapSpiritual(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="Sangat Baik">Sangat Baik</option>
                    <option value="Baik">Baik</option>
                    <option value="Cukup">Cukup</option>
                    <option value="Kurang">Kurang</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Sikap Sosial</label>
                  <select
                    value={sikapSosial}
                    onChange={(e) => setSikapSosial(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="Sangat Baik">Sangat Baik</option>
                    <option value="Baik">Baik</option>
                    <option value="Cukup">Cukup</option>
                    <option value="Kurang">Kurang</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Catatan Wali Kelas</label>
                <textarea
                  rows={2}
                  value={catatanWaliKelas}
                  onChange={(e) => setCatatanWaliKelas(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-3">
              <h4 className="font-bold text-slate-800 dark:text-slate-200">Kehadiran & Peringkat Kelas</h4>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Sakit (Hari)</label>
                  <input
                    type="number"
                    min="0"
                    value={sakit}
                    onChange={(e) => setSakit(parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 text-center rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Izin (Hari)</label>
                  <input
                    type="number"
                    min="0"
                    value={izin}
                    onChange={(e) => setIzin(parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 text-center rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Alpa (Hari)</label>
                  <input
                    type="number"
                    min="0"
                    value={alpa}
                    onChange={(e) => setAlpa(parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 text-center rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Peringkat Kelas</label>
                  <input
                    type="number"
                    min="1"
                    value={peringkat}
                    onChange={(e) => setPeringkat(parseInt(e.target.value) || 1)}
                    className="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Jumlah Siswa di Kelas</label>
                  <input
                    type="number"
                    min="1"
                    value={totalSiswa}
                    onChange={(e) => setTotalSiswa(parseInt(e.target.value) || 28)}
                    className="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Penandatangan Raport (Otomatis terisi dari Data Guru) */}
          <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-300">
                <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Penanggung Jawab Raport (Tersinkronisasi Otomatis dari Data Guru)</span>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 text-[10px] font-bold">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Terisi Otomatis
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-blue-100 dark:border-blue-900">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Wali Kelas ({kelas})
                </div>
                <div className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {waliKelasInfo.nama}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  NIP: {waliKelasInfo.nip || '-'}
                </div>
              </div>

              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-blue-100 dark:border-blue-900">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Kepala Sekolah
                </div>
                <div className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {kepsekInfo.nama}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  NIP: {kepsekInfo.nip || '-'}
                </div>
              </div>
            </div>
            <p className="text-[11px] text-blue-700 dark:text-blue-300 italic">
              * Data Wali Kelas dan Kepala Sekolah di atas otomatis diambil dari menu <strong>Data Guru</strong> dan akan tercetak pada lembar raport cetak.
            </p>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 bg-[#003399] hover:bg-[#002266] text-white font-bold rounded-lg shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Nilai Raport Semester {semester}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
