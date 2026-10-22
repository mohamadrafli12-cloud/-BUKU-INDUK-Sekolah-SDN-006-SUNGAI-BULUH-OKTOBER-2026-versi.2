import React, { useState } from 'react';
import { Award, Printer, Plus, Search, Edit3, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { Student, SemesterReport } from '../../types';
import { formatIndonesianDate, cn } from '../../lib/utils';
import { KopSuratHeader } from '../layout/KopSuratHeader';

interface RaportViewProps {
  onOpenRaportModal: (student: Student) => void;
  onSelectStudentDetail: (studentId: string) => void;
  onBack?: () => void;
  setActiveTab?: (tab: any) => void;
}

export const RaportView: React.FC<RaportViewProps> = ({
  onOpenRaportModal,
  onSelectStudentDetail,
  onBack,
  setActiveTab,
}) => {
  const { students, schoolProfile, currentRole, getWaliKelasForClass, getKepalaSekolah } = useSchool();
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [selectedSemester, setSelectedSemester] = useState<number>(11);

  const student = students.find(s => s.id === selectedStudentId) || students[0];
  const report = student?.raport?.find(r => r.semester === selectedSemester);
  const currentKelas = report?.kelas || student?.kelasSekarang || 'Kelas 6';
  const waliKelasInfo = getWaliKelasForClass(currentKelas);
  const kepsekInfo = getKepalaSekolah();

  const handlePrint = () => {
    window.print();
  };

  const handleGoBack = () => {
    if (onBack) {
      onBack();
    } else if (setActiveTab) {
      setActiveTab('dashboard');
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Control Header */}
      <div className="no-print p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
            title="Kembali ke Dashboard Utama"
          >
            <ArrowLeft className="w-4 h-4 text-[#003399] dark:text-blue-400" />
            <span>Kembali</span>
          </button>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300">Pilih Siswa:</span>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-blue-700 dark:text-blue-300"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.noInduk} - {s.namaLengkap} ({s.kelasSekarang})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300">Semester:</span>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(parseInt(e.target.value))}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-blue-700 dark:text-blue-300"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((s) => (
                <option key={s} value={s}>
                  Semester {s} ({s <= 2 ? 'Kelas 1' : s <= 4 ? 'Kelas 2' : s <= 6 ? 'Kelas 3' : s <= 8 ? 'Kelas 4' : s <= 10 ? 'Kelas 5' : 'Kelas 6'})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentRole !== 'umum' && student && (
            <button
              onClick={() => onOpenRaportModal(student)}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              <span>Input / Edit Nilai Raport</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#003399] hover:bg-[#002266] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Lembar Raport (Ctrl+P)</span>
          </button>
        </div>
      </div>

      {/* Raport Sheet Preview (Print Ready) */}
      {student && (
        <div className="max-w-[210mm] mx-auto bg-white text-slate-950 p-[15mm] shadow-2xl rounded-sm font-serif text-[12px] leading-relaxed border border-slate-300 print:border-none print:shadow-none print:m-0 print:w-full">
          {/* Header Kop Resmi dengan Logo Kiri & Logo Kanan */}
          <KopSuratHeader
            schoolProfile={schoolProfile}
            documentTitle="LAPORAN PENILAIAN HASIL BELAJAR PESERTA DIDIK"
            documentSubtitle={`SEMESTER ${selectedSemester} - TAHUN PELAJARAN ${report?.tahunAjaran || '2025/2026'}`}
          />

          {/* Student Identifiers */}
          <div className="grid grid-cols-2 gap-4 border border-slate-400 p-2.5 bg-slate-50 text-[11px] font-sans mb-4">
            <div className="space-y-1">
              <div>Nama Peserta Didik: <strong className="uppercase">{student.namaLengkap}</strong></div>
              <div>Nomor Induk / NISN: <strong className="font-mono">{student.noInduk} / {student.nisn}</strong></div>
            </div>
            <div className="space-y-1">
              <div>Kelas / Fase: <strong>{report?.kelas || student.kelasSekarang}</strong></div>
              <div>Peringkat Kelas: <strong className="text-blue-900">#{report?.peringkatKelas || 1}</strong> dari {report?.totalSiswaKelas || 28} Siswa</div>
            </div>
          </div>

          {/* Table of Grades */}
          <div className="mb-4">
            <div className="font-sans font-bold text-xs bg-slate-200 px-2 py-1 border-t border-b border-slate-950 uppercase mb-1">
              A. CAPAIAN KOMPETENSI MATA PELAJARAN
            </div>
            <table className="w-full border-collapse text-[10.5px] border border-slate-400">
              <thead className="bg-slate-100 font-sans font-bold text-center">
                <tr className="border-b border-slate-400">
                  <th className="p-1.5 w-8 border-r border-slate-400">No</th>
                  <th className="p-1.5 border-r border-slate-400 text-left">Mata Pelajaran</th>
                  <th className="p-1.5 w-14 border-r border-slate-400">KKM</th>
                  <th className="p-1.5 w-16 border-r border-slate-400">Pengetahuan</th>
                  <th className="p-1.5 w-16 border-r border-slate-400">Keterampilan</th>
                  <th className="p-1.5 w-16 border-r border-slate-400">Nilai Akhir</th>
                  <th className="p-1.5 w-16">Predikat</th>
                </tr>
              </thead>
              <tbody>
                {report?.nilai.map((grade, idx) => (
                  <tr key={idx} className="border-b border-slate-300">
                    <td className="p-1 text-center font-mono border-r border-slate-400">{idx + 1}</td>
                    <td className="p-1 font-semibold border-r border-slate-400">{grade.mapel}</td>
                    <td className="p-1 text-center font-mono border-r border-slate-400">{grade.kkm}</td>
                    <td className="p-1 text-center font-mono border-r border-slate-400">{grade.pengetahuan}</td>
                    <td className="p-1 text-center font-mono border-r border-slate-400">{grade.keterampilan}</td>
                    <td className="p-1 text-center font-mono font-bold border-r border-slate-400">{grade.nilaiAkhir}</td>
                    <td className="p-1 text-center font-bold">{grade.predikat}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Kehadiran & Sikap */}
          <div className="grid grid-cols-2 gap-4 text-[11px] font-sans mb-4">
            <div className="border border-slate-400 p-2.5">
              <div className="font-bold border-b border-slate-300 pb-1 mb-1">Ketidakhadiran</div>
              <div className="space-y-0.5">
                <div className="flex justify-between"><span>Sakit:</span> <span>{report?.kehadiran.sakit || 0} hari</span></div>
                <div className="flex justify-between"><span>Izin:</span> <span>{report?.kehadiran.izin || 0} hari</span></div>
                <div className="flex justify-between"><span>Tanpa Keterangan:</span> <span>{report?.kehadiran.tanpaKeterangan || 0} hari</span></div>
              </div>
            </div>

            <div className="border border-slate-400 p-2.5">
              <div className="font-bold border-b border-slate-300 pb-1 mb-1">Penilaian Sikap</div>
              <div className="space-y-0.5">
                <div>Sikap Spiritual: <strong>{report?.sikapSpiritual || 'Sangat Baik'}</strong></div>
                <div>Sikap Sosial: <strong>{report?.sikapSosial || 'Sangat Baik'}</strong></div>
              </div>
            </div>
          </div>

          {/* Catatan Guru */}
          <div className="border border-slate-400 p-2.5 text-[11px] font-sans mb-6">
            <div className="font-bold mb-1">Catatan Wali Kelas:</div>
            <p className="italic text-slate-800">
              "{report?.catatanWaliKelas || 'Ananda menunjukkan semangat belajar yang sangat baik dan aktif dalam kegiatan sekolah. Pertahankan prestasi.'}"
            </p>
          </div>

          {/* Signatures */}
          <div className="flex justify-between items-end font-sans text-[11px]">
            <div className="text-center">
              <div>Mengetahui,</div>
              <div>Orang Tua / Wali Siswa,</div>
              <div className="h-16" />
              <div className="font-bold underline">{student.ayah.nama}</div>
            </div>

            <div className="text-center">
              <div>{schoolProfile.desaKelurahan || schoolProfile.desa || 'Sungai Buluh'}, {formatIndonesianDate(new Date().toISOString())}</div>
              <div>Wali {currentKelas},</div>
              <div className="h-16" />
              <div className="font-bold underline">{waliKelasInfo.nama}</div>
              <div>NIP. {waliKelasInfo.nip || '-'}</div>
            </div>

            <div className="text-center">
              <div>Mengetahui,</div>
              <div>Kepala {schoolProfile.namaSekolah}</div>
              <div className="h-16 flex items-center justify-center relative">
                {schoolProfile.stempelUrl ? (
                  <img
                    src={schoolProfile.stempelUrl}
                    alt="Stempel Sekolah"
                    className="w-24 h-16 object-contain opacity-85 absolute"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-20 h-8 border border-blue-900/30 rounded flex items-center justify-center text-[7px] text-blue-900 font-bold">
                    [ STEMPEL ]
                  </div>
                )}
              </div>
              <div className="font-bold underline relative z-10">{kepsekInfo.nama}</div>
              <div>NIP. {kepsekInfo.nip || '-'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
