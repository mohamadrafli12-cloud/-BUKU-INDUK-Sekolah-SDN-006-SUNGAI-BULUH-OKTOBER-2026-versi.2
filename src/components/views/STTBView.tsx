import React, { useState, useMemo } from 'react';
import { GraduationCap, Printer, Search, CheckCircle2, FileCheck, Award, ArrowLeft, AlertTriangle, AlertCircle, Clock, Sparkles } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { Student } from '../../types';
import { formatIndonesianDate, cn } from '../../lib/utils';
import { KopSuratHeader } from '../layout/KopSuratHeader';
import { calculateSchoolAlerts } from '../../utils/alertNotificationHelper';

interface STTBViewProps {
  onOpenSTTBModal: (student: Student) => void;
  onSelectStudentDetail: (studentId: string) => void;
  onBack?: () => void;
  setActiveTab?: (tab: any) => void;
}

export const STTBView: React.FC<STTBViewProps> = ({
  onOpenSTTBModal,
  onSelectStudentDetail,
  onBack,
  setActiveTab,
}) => {
  const { students, schoolProfile, currentRole } = useSchool();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedStudentForReceipt, setSelectedStudentForReceipt] = useState<Student | null>(null);
  const [isPrintingRegister, setIsPrintingRegister] = useState(false);

  // Operational alerts for Ijazah & STTB
  const ijazahAlerts = useMemo(
    () => calculateSchoolAlerts(students, schoolProfile).filter(a => a.category === 'ijazah' || a.category === 'dapodik'),
    [students, schoolProfile]
  );

  // Filter students who graduated or have STTB info
  const graduatedStudents = students.filter(s => s.sttb || s.status === 'Lulus' || s.kelasSekarang === 'Kelas 6');
  const actualGraduated = students.filter(s => s.sttb || s.status === 'Lulus');

  const filteredGraduated = actualGraduated.filter(s => {
    const matchesSearch = 
      s.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.noInduk.includes(searchTerm) ||
      (s.sttb?.noIjazah && s.sttb.noIjazah.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesYear = selectedYear === 'ALL' || s.sttb?.lulusTahun === selectedYear;

    return matchesSearch && matchesYear;
  });

  const handlePrintReceipt = (student: Student) => {
    setIsPrintingRegister(false);
    setSelectedStudentForReceipt(student);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handlePrintRegisterSheet = () => {
    setSelectedStudentForReceipt(null);
    setIsPrintingRegister(true);
    setTimeout(() => {
      window.print();
    }, 150);
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
      {/* Header */}
      <div className="no-print flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <button
            onClick={handleGoBack}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
            title="Kembali ke Dashboard Utama"
          >
            <ArrowLeft className="w-4 h-4 text-[#003399] dark:text-blue-400" />
            <span className="hidden sm:inline">Kembali</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                Register STTB / Ijazah & Serah Terima Dokumen
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-extrabold text-xs">
                Sheet STTB & IJAZAH ({actualGraduated.length})
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Buku catatan resmi penomoran seri Ijazah, SKHU, dan tanda terima penyerahan berkas kelulusan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintRegisterSheet}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#003399] hover:bg-[#002266] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            title="Cetak Buku Register Ijazah & Tanda Terima (Sheet STTB)"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Register Ijazah</span>
          </button>

          {currentRole !== 'umum' && (
            <select
              onChange={(e) => {
                const s = students.find(item => item.id === e.target.value);
                if (s) onOpenSTTBModal(s);
              }}
              defaultValue=""
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="" disabled>+ Input Ijazah Siswa Kelas 6...</option>
              {graduatedStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.noInduk} - {s.namaLengkap} ({s.status})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Alert Peringatan Masa Berlaku & Pengambilan Ijazah */}
      {ijazahAlerts.length > 0 && (
        <div className="no-print p-4 md:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-600 text-white font-black shrink-0 shadow-xs">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs md:text-sm font-black text-slate-900 dark:text-slate-100">
                  {ijazahAlerts.length} Peringatan Blangko, Masa Berlaku & Pengambilan Ijazah
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Masa berlaku SKL Sementara (maks. 6 bulan), alumni yang belum mengambil dokumen fisik, atau nomor seri ijazah belum diinput.
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-block px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 uppercase">
              Verifikasi Ijazah
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {ijazahAlerts.map(alert => (
              <div
                key={alert.id}
                className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 flex flex-col justify-between gap-2.5 text-xs shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black text-slate-900 dark:text-slate-100 truncate">
                      {alert.studentName}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 shrink-0">
                      NIS: {alert.nis || '-'}
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-800 dark:text-emerald-300 font-bold mt-1">
                    {alert.title}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {alert.message}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-semibold">
                    <Clock className="w-3 h-3 text-emerald-500" />
                    {alert.dueDateOrDaysAgo}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const s = students.find(item => item.id === alert.studentId);
                      if (s) {
                        if (alert.actionType === 'sttb') {
                          onOpenSTTBModal(s);
                        } else {
                          onSelectStudentDetail(s.id);
                        }
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shrink-0 transition-colors shadow-xs cursor-pointer"
                  >
                    {alert.actionType === 'sttb' ? 'Input / Serah Terima' : 'Lengkapi Data'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and stats */}
      <div className="no-print grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama alumni, NIS, atau Nomor Seri Ijazah (DN)..."
            className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden"
          />
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase text-emerald-800 dark:text-emerald-300">Total Ijazah Diterbitkan</div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{actualGraduated.length} Alumni</div>
          </div>
          <GraduationCap className="w-8 h-8 text-emerald-400 opacity-60" />
        </div>
      </div>

      {/* STTB Register Table */}
      <div className="no-print rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#002266] text-white uppercase text-[11px] font-bold">
              <tr>
                <th className="p-3">No</th>
                <th className="p-3">NIS / NISN</th>
                <th className="p-3">Nama Siswa</th>
                <th className="p-3">Tahun Lulus</th>
                <th className="p-3">Nomor Seri Ijazah</th>
                <th className="p-3">Melanjutkan Ke</th>
                <th className="p-3">Tanda Terima Fisik</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredGraduated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    Belum ada data register Ijazah/STTB yang tercatat.
                  </td>
                </tr>
              ) : (
                filteredGraduated.map((student, idx) => (
                  <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-mono font-bold text-blue-700 dark:text-blue-300">
                      {student.noInduk}
                      <div className="text-[10px] text-slate-400">{student.nisn}</div>
                    </td>
                    <td className="p-3">
                      <div 
                        onClick={() => onSelectStudentDetail(student.id)}
                        className="font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 cursor-pointer"
                      >
                        {student.namaLengkap}
                      </div>
                      <div className="text-[10px] text-slate-400">Peserta UN: {student.sttb?.noPesertaUN || '-'}</div>
                    </td>
                    <td className="p-3 font-bold text-slate-700 dark:text-slate-300">
                      {student.sttb?.lulusTahun || '2025/2026'}
                    </td>
                    <td className="p-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {student.sttb?.noIjazah || '-'}
                    </td>
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                      {student.sttb?.melanjutkanKe || '-'}
                    </td>
                    <td className="p-3">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold",
                        student.sttb?.statusTandaTerima === 'Sudah Diterima' 
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-800"
                      )}>
                        {student.sttb?.statusTandaTerima || 'Belum Diambil'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handlePrintReceipt(student)}
                        className="flex items-center gap-1.5 ml-auto px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Tanda Terima</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORMAL TANDA TERIMA SERAH IJAZAH (Printed when clicked) */}
      {selectedStudentForReceipt && !isPrintingRegister && (
        <div className="max-w-[210mm] mx-auto bg-white text-slate-950 p-[15mm] shadow-2xl rounded-sm font-serif text-[12px] leading-relaxed border border-slate-300 print:border-none print:shadow-none print:m-0 print:w-full">
          {/* Kop Surat Resmi dengan Logo Kiri & Logo Kanan */}
          <KopSuratHeader
            schoolProfile={schoolProfile}
            documentTitle="BERITA ACARA / TANDA TERIMA PENYERAHAN IJAZAH DAN SKHU ASLI"
            documentSubtitle={`Tahun Ajaran ${selectedStudentForReceipt.sttb?.lulusTahun || '2025/2026'}`}
          />

          <p className="indent-8 text-justify mb-4">
            Pada hari ini, bertempat di {schoolProfile.namaSekolah}, telah diserahkan dokumen asli kelulusan berupa Ijazah dan Surat Keterangan Hasil Ujian (SKHU) atas nama peserta didik:
          </p>

          <table className="w-full border-collapse text-[12px] ml-4 mb-4">
            <tbody>
              <tr><td className="w-52 py-1">Nama Lengkap Siswa</td><td className="w-3">:</td><td className="font-bold uppercase">{selectedStudentForReceipt.namaLengkap}</td></tr>
              <tr><td className="py-1">Nomor Induk Siswa (NIS)</td><td>:</td><td className="font-mono font-bold">{selectedStudentForReceipt.noInduk}</td></tr>
              <tr><td className="py-1">NISN</td><td>:</td><td className="font-mono font-bold">{selectedStudentForReceipt.nisn}</td></tr>
              <tr><td className="py-1">Nomor Peserta Ujian</td><td>:</td><td className="font-mono">{selectedStudentForReceipt.sttb?.noPesertaUN || '-'}</td></tr>
              <tr><td className="py-1">Nomor Seri Ijazah (DN)</td><td>:</td><td className="font-mono font-bold text-emerald-800">{selectedStudentForReceipt.sttb?.noIjazah || '-'}</td></tr>
              <tr><td className="py-1">Nomor SKHU</td><td>:</td><td className="font-mono">{selectedStudentForReceipt.sttb?.noSkhu || '-'}</td></tr>
              <tr><td className="py-1">Nama Penerima Dokumen</td><td>:</td><td className="font-bold">{selectedStudentForReceipt.sttb?.namaPenerima || selectedStudentForReceipt.ayah.nama}</td></tr>
              <tr><td className="py-1">Hubungan dengan Siswa</td><td>:</td><td>{selectedStudentForReceipt.sttb?.hubunganPenerima || 'Orang Tua / Wali'}</td></tr>
              <tr><td className="py-1">Melanjutkan Pendidikan Ke</td><td>:</td><td className="font-bold">{selectedStudentForReceipt.sttb?.melanjutkanKe || '-'}</td></tr>
            </tbody>
          </table>

          <p className="indent-8 text-justify mb-8">
            Dokumen tersebut telah diterima dalam keadaan baik, lengkap, dan sah. Penerima berkewajiban merawat dan menjaga dokumen asli tersebut.
          </p>

          <div className="flex justify-between items-end font-sans text-[11px]">
            <div className="text-center">
              <div>Penerima Dokumen Asli,</div>
              <div className="h-16" />
              <div className="font-bold underline">{selectedStudentForReceipt.sttb?.namaPenerima || selectedStudentForReceipt.ayah.nama}</div>
              <div className="text-[10px] text-slate-500">Tanda Tangan Penerima</div>
            </div>

            <div className="text-right leading-tight">
              <div>{schoolProfile.desaKelurahan || schoolProfile.desa || 'Sungai Buluh'}, {formatIndonesianDate(selectedStudentForReceipt.sttb?.tglSerahTerima || new Date().toISOString())}</div>
              <div className="font-bold mt-0.5">Kepala {schoolProfile.namaSekolah}</div>
              <div className="h-16 flex items-center justify-end relative">
                {schoolProfile.stempelUrl ? (
                  <img
                    src={schoolProfile.stempelUrl}
                    alt="Stempel Sekolah"
                    className="w-24 h-16 object-contain opacity-85 absolute right-4"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-24 h-10 border border-blue-900/30 rounded flex items-center justify-center text-[8px] text-blue-900 font-bold">
                    [ STEMPEL RESMI ]
                  </div>
                )}
              </div>
              <div className="font-bold underline relative z-10">{schoolProfile.namaKepalaSekolah}</div>
              <div>NIP. {schoolProfile.nipKepalaSekolah}</div>
            </div>
          </div>
        </div>
      )}

      {/* FORMAL BUKU REGISTER PENYERAHAN STTB & IJAZAH (SHEET STTB) */}
      {(isPrintingRegister || !selectedStudentForReceipt) && (
        <div className={cn(
          "max-w-[297mm] mx-auto bg-white text-slate-950 p-[12mm] shadow-2xl rounded-sm font-serif text-[11px] leading-relaxed border border-slate-300 print:border-none print:shadow-none print:m-0 print:w-full",
          !isPrintingRegister && "hidden print:block"
        )}>
          <KopSuratHeader
            schoolProfile={schoolProfile}
            documentTitle="BUKU REGISTER KELULUSAN & PENYERAHAN STTB / IJAZAH"
            documentSubtitle={`DAFTAR TANDA TERIMA IJAZAH PESERTA DIDIK (SHEET STTB) ${selectedYear !== 'ALL' ? `TAHUN ${selectedYear}` : ''}`}
          />

          <div className="my-3 text-xs font-sans text-slate-700">
            <p>Daftar resmi kelulusan dan register penyerahan dokumen Ijazah / SKHU {schoolProfile.namaSekolah}:</p>
          </div>

          <table className="w-full border-collapse border border-slate-950 text-[10px] my-3">
            <thead>
              <tr className="bg-slate-100 text-slate-950 font-bold">
                <th className="border border-slate-950 px-2 py-1 text-center w-8">No</th>
                <th className="border border-slate-950 px-2 py-1 text-center w-24">NIS / NISN</th>
                <th className="border border-slate-950 px-2 py-1 text-left">Nama Peserta Didik</th>
                <th className="border border-slate-950 px-2 py-1 text-center w-10">L/P</th>
                <th className="border border-slate-950 px-2 py-1 text-center w-14">Tahun</th>
                <th className="border border-slate-950 px-2 py-1 text-center w-28">No. Peserta Ujian</th>
                <th className="border border-slate-950 px-2 py-1 text-left w-32">No. Seri Ijazah (DN)</th>
                <th className="border border-slate-950 px-2 py-1 text-left w-24">No. SKHU</th>
                <th className="border border-slate-950 px-2 py-1 text-left">Nama Penerima</th>
                <th className="border border-slate-950 px-2 py-1 text-center w-20">Tanda Tangan</th>
              </tr>
            </thead>
            <tbody>
              {filteredGraduated.length === 0 ? (
                <tr>
                  <td colSpan={10} className="border border-slate-950 px-3 py-4 text-center text-slate-500 italic">
                    Belum ada data register ijazah untuk kriteria ini.
                  </td>
                </tr>
              ) : (
                filteredGraduated.map((s, idx) => (
                  <tr key={s.id}>
                    <td className="border border-slate-950 px-2 py-1 text-center font-mono">{idx + 1}</td>
                    <td className="border border-slate-950 px-2 py-1 text-center font-mono">{s.noInduk} / {s.nisn}</td>
                    <td className="border border-slate-950 px-2 py-1 font-bold uppercase">{s.namaLengkap}</td>
                    <td className="border border-slate-950 px-2 py-1 text-center">{s.jenisKelamin}</td>
                    <td className="border border-slate-950 px-2 py-1 text-center font-mono">{s.sttb?.lulusTahun || '2025/2026'}</td>
                    <td className="border border-slate-950 px-2 py-1 text-center font-mono text-[9px]">{s.sttb?.noPesertaUN || '-'}</td>
                    <td className="border border-slate-950 px-2 py-1 font-mono font-bold text-emerald-900">{s.sttb?.noIjazah || '-'}</td>
                    <td className="border border-slate-950 px-2 py-1 font-mono text-[9px]">{s.sttb?.noSkhu || '-'}</td>
                    <td className="border border-slate-950 px-2 py-1">{s.sttb?.namaPenerima || s.ayah?.nama || '-'}</td>
                    <td className="border border-slate-950 px-2 py-1 text-center text-slate-400 italic text-[9px]">
                      {s.sttb?.namaPenerima ? 'Terima' : '................'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="flex justify-between items-end font-sans text-[11px] mt-6">
            <div className="text-center">
              <div>Mengetahui,</div>
              <div>Petugas Register Ijazah / Kurikulum</div>
              <div className="h-16" />
              <div className="font-bold underline">Petugas Ijazah</div>
              <div>NIP. -</div>
            </div>

            <div className="text-right leading-tight">
              <div>{schoolProfile.desaKelurahan || schoolProfile.desa || 'Sungai Buluh'}, {formatIndonesianDate(new Date().toISOString())}</div>
              <div className="font-bold mt-0.5">Kepala {schoolProfile.namaSekolah}</div>
              <div className="h-16 flex items-center justify-end relative">
                {schoolProfile.stempelUrl ? (
                  <img
                    src={schoolProfile.stempelUrl}
                    alt="Stempel Sekolah"
                    className="w-24 h-16 object-contain opacity-85 absolute right-4"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-24 h-10 border border-blue-900/30 rounded flex items-center justify-center text-[8px] text-blue-900 font-bold">
                    [ STEMPEL RESMI ]
                  </div>
                )}
              </div>
              <div className="font-bold underline relative z-10">{schoolProfile.namaKepalaSekolah}</div>
              <div>NIP. {schoolProfile.nipKepalaSekolah}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
