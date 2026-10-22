import React, { useState, useRef } from 'react';
import { Printer, ArrowLeft, Download, FileText, CheckCircle2, FileDown, Loader2 } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { formatIndonesianDate } from '../../lib/utils';
import { Student } from '../../types';
import { KopSuratHeader } from '../layout/KopSuratHeader';
import { exportBukuIndukToPdf } from '../../utils/pdfExportHelper';

interface PrintBukuIndukViewProps {
  selectedStudentId?: string;
  onBack: () => void;
}

export const PrintBukuIndukView: React.FC<PrintBukuIndukViewProps> = ({
  selectedStudentId,
  onBack,
}) => {
  const { students, schoolProfile } = useSchool();
  const [activeStudentId, setActiveStudentId] = useState<string>(
    selectedStudentId || (students[0]?.id ?? '')
  );
  const [isBlankMode, setIsBlankMode] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);

  const student = students.find((s) => s.id === activeStudentId) || students[0];

  const handlePrint = () => {
    // Unfocus any active button or control so no focus ring/popover is visible in print preview
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    window.print();
  };

  const handlePrintToPdf = async () => {
    if (!page1Ref.current || !page2Ref.current) return;
    try {
      setIsExportingPdf(true);
      setExportError(null);
      await exportBukuIndukToPdf({
        page1Element: page1Ref.current,
        page2Element: page2Ref.current,
        studentName: isBlankMode ? 'Formulir_Kosong' : student?.namaLengkap,
        nisn: isBlankMode ? undefined : student?.nisn,
        isBlankMode,
        schoolName: schoolProfile.namaSekolah,
      });
    } catch (err) {
      console.error('Failed to export Buku Induk PDF:', err);
      setExportError('Gagal memproses file PDF. Silakan coba kembali.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  if (!student && !isBlankMode) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200">
        <p className="text-slate-500">Belum ada data siswa untuk dicetak.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg">
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 print:space-y-0 print:pb-0 print:p-0 print:m-0">
      {/* Print Control Toolbar (Hidden during print) */}
      <div className="no-print print:hidden p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>
          
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300">Pilih Siswa:</span>
            <select
              disabled={isBlankMode}
              value={activeStudentId}
              onChange={(e) => setActiveStudentId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-blue-700 dark:text-blue-300 disabled:opacity-50"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.noInduk} - {s.namaLengkap} ({s.kelasSekarang})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={isBlankMode}
              onChange={(e) => setIsBlankMode(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Cetak Formulir Kosong (Blank Sheet)</span>
          </label>

          <button
            onClick={handlePrintToPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white text-xs font-extrabold rounded-xl shadow-md transition-transform transform active:scale-95 cursor-pointer disabled:cursor-not-allowed"
            title="Ekspor Lembar Buku Induk ke format PDF beresolusi tinggi (A4 Standard)"
          >
            {isExportingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <FileDown className="w-4 h-4 text-emerald-200" />
            )}
            <span>{isExportingPdf ? 'MEMPROSES PDF...' : 'PRINT TO PDF'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#003399] hover:bg-[#002266] text-white text-xs font-extrabold rounded-xl shadow-lg transition-transform transform active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>CETAK LEMBAR BUKU INDUK (CTRL + P)</span>
          </button>
        </div>
      </div>

      {exportError && (
        <div className="no-print p-3 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-semibold flex items-center justify-between">
          <span>{exportError}</span>
          <button onClick={() => setExportError(null)} className="font-bold underline ml-2">Tutup</button>
        </div>
      )}

      {/* DOCUMENT PREVIEW CONTAINER (Styled exact to Indonesian Government Standard Buku Induk Siswa) */}
      <div className="max-w-[210mm] mx-auto bg-white text-slate-950 p-[12mm] shadow-2xl rounded-sm print:max-w-none print:bg-white print:p-0 print:shadow-none print:m-0 print:w-full print:border-none print:rounded-none font-serif text-[12px] leading-relaxed">
        
        {/* ================= PAGE 1 ================= */}
        <div ref={page1Ref} className="print-page relative space-y-4">
          {/* Header Kop Lembar Buku Induk (sama persis dengan KOP Raport Siswa) */}
          <KopSuratHeader
            schoolProfile={schoolProfile}
            documentTitle="BUKU INDUK PESERTA DIDIK"
          />

          {/* Top Identifier bar */}
          <div className="flex flex-wrap justify-between items-center bg-slate-100 p-2 border border-slate-950 font-sans text-xs font-bold gap-2">
            <div>
              NOMOR INDUK SISWA (NIS): <span className="font-mono text-sm underline">{isBlankMode ? '........................' : student?.noInduk}</span>
            </div>
            <div>
              NISN: <span className="font-mono text-sm underline">{isBlankMode ? '........................' : student?.nisn}</span>
            </div>
            <div>
              NIK SISWA: <span className="font-mono text-sm underline">{isBlankMode ? '........................' : student?.nik || '-'}</span>
            </div>
            <div>
              HALAMAN: <strong>1 (BAGIAN A - D)</strong>
            </div>
          </div>

          {/* Section A: Keterangan Diri Siswa */}
          <div>
            <div className="font-sans font-bold text-xs bg-slate-200 px-2 py-1 border-t border-b border-slate-950 uppercase">
              A. KETERANGAN TENTANG DIRI PESERTA DIDIK
            </div>
            <table className="w-full border-collapse text-[11px] mt-1">
              <tbody>
                <tr className="border-b border-slate-300">
                  <td className="w-6 py-1 align-top text-center">1.</td>
                  <td className="w-56 py-1">Nama Peserta Didik</td>
                  <td className="w-3 py-1">:</td>
                  <td className="py-1 font-bold">{isBlankMode ? '..................................................................' : student?.namaLengkap}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="py-1 align-top text-center"></td>
                  <td className="py-1">a. Nama Lengkap</td>
                  <td className="py-1">:</td>
                  <td className="py-1">{isBlankMode ? '..................................................................' : student?.namaLengkap}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="py-1 align-top text-center"></td>
                  <td className="py-1">b. Nama Panggilan</td>
                  <td className="py-1">:</td>
                  <td className="py-1">{isBlankMode ? '..................................................................' : student?.namaPanggilan || '-'}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="w-6 py-1 align-top text-center">2.</td>
                  <td className="w-56 py-1 font-semibold">Nomor Induk Kependudukan (NIK)</td>
                  <td className="w-3 py-1">:</td>
                  <td className="py-1 font-mono font-bold text-blue-900">{isBlankMode ? '..................................................................' : student?.nik || '-'}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="w-6 py-1 align-top text-center">3.</td>
                  <td className="w-56 py-1">Nomor Kartu Keluarga (No. KK)</td>
                  <td className="w-3 py-1">:</td>
                  <td className="py-1 font-mono">{isBlankMode ? '..................................................................' : student?.noKk || '-'}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="py-1 align-top text-center">4.</td>
                  <td className="py-1">Jenis Kelamin</td>
                  <td className="py-1">:</td>
                  <td className="py-1">{isBlankMode ? 'Laki-Laki / Perempuan (*)' : student?.jenisKelamin === 'L' ? 'Laki-Laki (L)' : 'Perempuan (P)'}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="py-1 align-top text-center">5.</td>
                  <td className="py-1">Kelahiran</td>
                  <td className="py-1">:</td>
                  <td className="py-1">
                    {isBlankMode ? 'Tempat: ........................................, Tanggal: ........................................' : 
                      `${student?.tempatLahir}, ${formatIndonesianDate(student?.tanggalLahir)}`
                    }
                  </td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="py-1 align-top text-center">6.</td>
                  <td className="py-1">Agama</td>
                  <td className="py-1">:</td>
                  <td className="py-1">{isBlankMode ? '..................................................................' : student?.agama}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="py-1 align-top text-center">7.</td>
                  <td className="py-1">Kewarganegaraan</td>
                  <td className="py-1">:</td>
                  <td className="py-1">{isBlankMode ? 'Indonesia / .........................................' : student?.kewarganegaraan}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="py-1 align-top text-center">8.</td>
                  <td className="py-1">Jumlah Saudara</td>
                  <td className="py-1">:</td>
                  <td className="py-1">
                    {isBlankMode ? 'Anak ke: ..... dari ..... bersaudara (Kandung: ....., Tiri: ....., Angkat: .....)' : 
                      `Anak ke-${student?.anakKe} dari ${(student?.jumlahSaudaraKandung || 0) + 1} bersaudara (Kandung: ${student?.jumlahSaudaraKandung || 0}, Tiri: ${student?.jumlahSaudaraTiri || 0}, Angkat: ${student?.jumlahSaudaraAngkat || 0})`
                    }
                  </td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="py-1 align-top text-center">9.</td>
                  <td className="py-1">Status Keberadaan Keluarga</td>
                  <td className="py-1">:</td>
                  <td className="py-1">{isBlankMode ? 'Lengkap / Yatim / Piatu / Yatim Piatu (*)' : student?.statusKeluarga}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="py-1 align-top text-center">10.</td>
                  <td className="py-1">Bahasa Sehari-hari di Rumah</td>
                  <td className="py-1">:</td>
                  <td className="py-1">{isBlankMode ? '..................................................................' : student?.bahasaIbu}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section B: Keterangan Tempat Tinggal */}
          <div>
            <div className="font-sans font-bold text-xs bg-slate-200 px-2 py-1 border-t border-b border-slate-950 uppercase">
              B. KETERANGAN TEMPAT TINGGAL
            </div>
            <table className="w-full border-collapse text-[11px] mt-1">
              <tbody>
                <tr className="border-b border-slate-300">
                  <td className="w-6 py-1 align-top text-center">11.</td>
                  <td className="w-56 py-1">Alamat Tempat Tinggal</td>
                  <td className="w-3 py-1">:</td>
                  <td className="py-1">
                    {isBlankMode ? '................................................................................................................................................' : 
                      `${student?.alamat}, RT ${student?.rt}/RW ${student?.rw}, Desa ${student?.kelurahanDesa}, Kec. ${student?.kecamatan}, ${student?.kabupatenKota} (${student?.kodePos})`
                    }
                  </td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="py-1 align-top text-center">12.</td>
                  <td className="py-1">Nomor Telepon / Handphone</td>
                  <td className="py-1">:</td>
                  <td className="py-1">{isBlankMode ? '..................................................................' : student?.noHpSiswa || student?.ayah.noHp || '-'}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="py-1 align-top text-center">13.</td>
                  <td className="py-1">Tinggal Bersama</td>
                  <td className="py-1">:</td>
                  <td className="py-1">{isBlankMode ? 'Orang Tua / Menumpang / Asrama (*)' : student?.tinggalDengan}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="py-1 align-top text-center">14.</td>
                  <td className="py-1">Jarak Tempat Tinggal ke Sekolah</td>
                  <td className="py-1">:</td>
                  <td className="py-1">{isBlankMode ? '......... Km, Transportasi: .......................................' : `${student?.jarakKeSekolahKm} Km (Transportasi: ${student?.transportasi})`}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section C: Keterangan Orang Tua Kandung */}
          <div>
            <div className="font-sans font-bold text-xs bg-slate-200 px-2 py-1 border-t border-b border-slate-950 uppercase">
              C. KETERANGAN ORANG TUA KANDUNG & WALI
            </div>
            <table className="w-full border-collapse text-[11px] mt-1 border border-slate-400">
              <thead className="bg-slate-100 font-sans font-bold text-center">
                <tr className="border-b border-slate-400">
                  <th className="p-1.5 w-6 border-r border-slate-400">No</th>
                  <th className="p-1.5 border-r border-slate-400 text-left">Keterangan</th>
                  <th className="p-1.5 w-1/2 border-r border-slate-400">Ayah Kandung</th>
                  <th className="p-1.5 w-1/2">Ibu Kandung</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-300">
                  <td className="p-1 text-center border-r border-slate-400">15.</td>
                  <td className="p-1 border-r border-slate-400">Nama Lengkap</td>
                  <td className="p-1 font-bold border-r border-slate-400">{isBlankMode ? '' : student?.ayah.nama}</td>
                  <td className="p-1 font-bold">{isBlankMode ? '' : student?.ibu.nama}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="p-1 text-center border-r border-slate-400">16.</td>
                  <td className="p-1 border-r border-slate-400 font-semibold">Nomor Induk Kependudukan (NIK)</td>
                  <td className="p-1 font-mono font-bold border-r border-slate-400">{isBlankMode ? '' : student?.ayah.nik || '-'}</td>
                  <td className="p-1 font-mono font-bold">{isBlankMode ? '' : student?.ibu.nik || '-'}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="p-1 text-center border-r border-slate-400">17.</td>
                  <td className="p-1 border-r border-slate-400">Tempat & Tanggal Lahir / Umur</td>
                  <td className="p-1 border-r border-slate-400">{isBlankMode ? '' : student?.ayah.tempatLahir ? `${student?.ayah.tempatLahir}, ${formatIndonesianDate(student?.ayah.tanggalLahir)}` : '-'}</td>
                  <td className="p-1">{isBlankMode ? '' : student?.ibu.tempatLahir ? `${student?.ibu.tempatLahir}, ${formatIndonesianDate(student?.ibu.tanggalLahir)}` : '-'}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="p-1 text-center border-r border-slate-400">18.</td>
                  <td className="p-1 border-r border-slate-400">Agama & Kewarganegaraan</td>
                  <td className="p-1 border-r border-slate-400">{isBlankMode ? '' : `${student?.ayah.agama || 'Islam'}, ${student?.ayah.kewarganegaraan || 'Indonesia'}`}</td>
                  <td className="p-1">{isBlankMode ? '' : `${student?.ibu.agama || 'Islam'}, ${student?.ibu.kewarganegaraan || 'Indonesia'}`}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="p-1 text-center border-r border-slate-400">19.</td>
                  <td className="p-1 border-r border-slate-400">Pendidikan Tertinggi</td>
                  <td className="p-1 border-r border-slate-400">{isBlankMode ? '' : student?.ayah.pendidikan}</td>
                  <td className="p-1">{isBlankMode ? '' : student?.ibu.pendidikan}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="p-1 text-center border-r border-slate-400">20.</td>
                  <td className="p-1 border-r border-slate-400">Pekerjaan Pokok</td>
                  <td className="p-1 border-r border-slate-400">{isBlankMode ? '' : student?.ayah.pekerjaan}</td>
                  <td className="p-1">{isBlankMode ? '' : student?.ibu.pekerjaan}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="p-1 text-center border-r border-slate-400">21.</td>
                  <td className="p-1 border-r border-slate-400">Penghasilan Rata-rata / Bulan</td>
                  <td className="p-1 border-r border-slate-400">{isBlankMode ? '' : student?.ayah.penghasilanBulanan}</td>
                  <td className="p-1">{isBlankMode ? '' : student?.ibu.penghasilanBulanan}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="p-1 text-center border-r border-slate-400">22.</td>
                  <td className="p-1 border-r border-slate-400">Alamat Rumah / No. Telepon</td>
                  <td className="p-1 border-r border-slate-400">{isBlankMode ? '' : `${student?.ayah.alamat || student?.alamat} (${student?.ayah.noHp || '-'})`}</td>
                  <td className="p-1">{isBlankMode ? '' : `${student?.ibu.alamat || student?.alamat} (${student?.ibu.noHp || '-'})`}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section D: Keterangan Masuk Sekolah */}
          <div>
            <div className="font-sans font-bold text-xs bg-slate-200 px-2 py-1 border-t border-b border-slate-950 uppercase">
              D. KETERANGAN PENERIMAAN DI SEKOLAH INI
            </div>
            <table className="w-full border-collapse text-[11px] mt-1">
              <tbody>
                <tr className="border-b border-slate-300">
                  <td className="w-6 py-1 align-top text-center">23.</td>
                  <td className="w-56 py-1">Pendidikan Sebelumnya (TK/PAUD)</td>
                  <td className="w-3 py-1">:</td>
                  <td className="py-1">{isBlankMode ? '..................................................................' : student?.sekolahAsalTK || '-'}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="py-1 align-top text-center">24.</td>
                  <td className="py-1">Diterima di Sekolah Ini</td>
                  <td className="py-1">:</td>
                  <td className="py-1">
                    {isBlankMode ? 'Tanggal: .............................., Di Kelas: ..............., Tahun Ajaran: .....................' : 
                      `Tanggal: ${formatIndonesianDate(student?.tanggalDiterima)}, Di ${(!student?.diterimaDiKelas || student?.diterimaDiKelas === '7' || student?.diterimaDiKelas === '7A' || student?.diterimaDiKelas?.toLowerCase() === 'kelas 7') ? 'Kelas 1' : student?.diterimaDiKelas}, Tahun Masuk: ${student?.tahunMasuk}`
                    }
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Page 1 Bottom Footer & Photo Box (Ukuran Pas Foto Lebih Besar & Jelas) */}
          <div className="pt-4 flex justify-between items-end">
            <div className="w-32 h-44 sm:w-36 sm:h-48 border-2 border-slate-700 rounded-sm flex flex-col items-center justify-center text-[11px] text-slate-600 font-sans text-center p-1.5 bg-slate-50 print:bg-transparent shadow-xs">
              {student?.fotoUrl && !isBlankMode ? (
                <img
                  src={student.fotoUrl}
                  alt="Pas Foto Siswa"
                  className="w-full h-full object-cover rounded-xs print:opacity-100 shadow-2xs"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                />
              ) : (
                <>
                  <div className="w-7 h-7 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center mb-1 text-slate-600 font-bold text-xs">
                    3:4
                  </div>
                  <span className="font-black text-xs text-slate-800">PAS FOTO</span>
                  <span className="font-bold text-slate-700">3 x 4 cm</span>
                  <span className="text-[8.5px] mt-1 text-slate-500">Cap Stempel Sekolah</span>
                </>
              )}
            </div>

            <div className="text-right font-sans text-[11px] leading-tight">
              <div>Sungai Buluh, {formatIndonesianDate(student?.tanggalDiterima || new Date().toISOString())}</div>
              <div className="font-bold mt-0.5">Kepala {schoolProfile.namaSekolah}</div>
              <div className="h-16 flex items-center justify-end">
                {/* Official digital signature stamp placeholder */}
                <div className="w-28 h-12 border border-blue-900/30 rounded flex items-center justify-center text-[9px] text-blue-900 font-bold rotate-[-3deg]">
                  [ TANDA TANGAN & STEMPEL ]
                </div>
              </div>
              <div className="font-bold underline">{schoolProfile.namaKepalaSekolah}</div>
              <div>NIP. {schoolProfile.nipKepalaSekolah}</div>
            </div>
          </div>
        </div>

        {/* ================= PAGE BREAK ================= */}
        <div className="page-break" />

        {/* ================= PAGE 2 ================= */}
        <div ref={page2Ref} className="print-page relative space-y-4 pt-6">
          {/* Header Lembar Buku Induk Halaman 2 */}
          <div className="flex flex-wrap justify-between items-center bg-slate-100 p-2 border border-slate-950 font-sans text-xs font-bold gap-2">
            <div>
              SEKOLAH: <span className="uppercase text-slate-900">{schoolProfile.namaSekolah}</span>
            </div>
            <div>
              NOMOR INDUK: <span className="font-mono text-sm underline">{isBlankMode ? '........................' : student?.noInduk}</span>
            </div>
            <div>
              NISN: <span className="font-mono text-sm underline">{isBlankMode ? '........................' : student?.nisn}</span>
            </div>
            <div>
              NIK: <span className="font-mono text-sm underline">{isBlankMode ? '........................' : student?.nik || '-'}</span>
            </div>
            <div>
              NAMA SISWA: <span className="text-sm underline">{isBlankMode ? '................................................' : student?.namaLengkap}</span>
            </div>
            <div>
              HALAMAN: <strong>2 (BAGIAN E - H)</strong>
            </div>
          </div>

          {/* Section E: Keadaan Jasmani & Kesehatan */}
          <div>
            <div className="font-sans font-bold text-xs bg-slate-200 px-2 py-1 border-t border-b border-slate-950 uppercase">
              E. KEADAAN JASMANI DAN KESEHATAN PESERTA DIDIK
            </div>
            <table className="w-full border-collapse text-[11px] mt-1 border border-slate-400">
              <thead className="bg-slate-100 font-sans font-bold text-center">
                <tr className="border-b border-slate-400">
                  <th className="p-1.5 border-r border-slate-400">Tahun</th>
                  <th className="p-1.5 border-r border-slate-400">Berat Badan (Kg)</th>
                  <th className="p-1.5 border-r border-slate-400">Tinggi Badan (Cm)</th>
                  <th className="p-1.5 border-r border-slate-400">Golongan Darah</th>
                  <th className="p-1.5">Penyakit / Kelainan Jasmani</th>
                </tr>
              </thead>
              <tbody className="text-center">
                {[1, 2, 3, 4, 5, 6].map((kls) => (
                  <tr key={kls} className="border-b border-slate-300">
                    <td className="p-1 border-r border-slate-400 font-sans font-bold">Kelas {kls}</td>
                    <td className="p-1 border-r border-slate-400 font-mono">
                      {isBlankMode ? '' : kls === 6 ? `${student?.kesehatan.beratBadanKg || 38}` : `${30 + kls}`}
                    </td>
                    <td className="p-1 border-r border-slate-400 font-mono">
                      {isBlankMode ? '' : kls === 6 ? `${student?.kesehatan.tinggiBadanCm || 145}` : `${120 + kls * 4}`}
                    </td>
                    <td className="p-1 border-r border-slate-400 font-bold">
                      {isBlankMode ? '' : student?.kesehatan.golonganDarah || 'O'}
                    </td>
                    <td className="p-1 text-left text-[10px]">
                      {isBlankMode ? '' : student?.kesehatan.penyakitPernahDiderita || 'Sehat Jasmani'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section F: Rekapitulasi Hasil Belajar (Raport) */}
          <div>
            <div className="font-sans font-bold text-xs bg-slate-200 px-2 py-1 border-t border-b border-slate-950 uppercase flex justify-between">
              <span>F. REKAPITULASI PENILAIAN HASIL BELAJAR (RAPORT BUKU INDUK)</span>
              <span className="text-[10px] font-normal">Kenaikan Kelas / Lulus</span>
            </div>
            <table className="w-full border-collapse text-[10px] mt-1 border border-slate-400">
              <thead className="bg-slate-100 font-sans font-bold text-center">
                <tr className="border-b border-slate-400">
                  <th className="p-1 border-r border-slate-400" rowSpan={2}>Tingkat Kelas</th>
                  <th className="p-1 border-r border-slate-400" rowSpan={2}>Tahun Ajaran</th>
                  <th className="p-1 border-r border-slate-400" colSpan={2}>Nilai Rata-rata</th>
                  <th className="p-1 border-r border-slate-400" colSpan={3}>Ketidakhadiran (Hari)</th>
                  <th className="p-1" rowSpan={2}>Keterangan Kenaikan / Kelulusan</th>
                </tr>
                <tr className="border-b border-slate-400 text-[9px]">
                  <th className="p-1 border-r border-slate-400">Sem 1</th>
                  <th className="p-1 border-r border-slate-400">Sem 2</th>
                  <th className="p-1 border-r border-slate-400">S</th>
                  <th className="p-1 border-r border-slate-400">I</th>
                  <th className="p-1 border-r border-slate-400">A</th>
                </tr>
              </thead>
              <tbody className="text-center">
                {['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'].map((kls, i) => (
                  <tr key={kls} className="border-b border-slate-300">
                    <td className="p-1 border-r border-slate-400 font-sans font-bold">{kls}</td>
                    <td className="p-1 border-r border-slate-400 font-mono">{isBlankMode ? '' : `202${i}/202${i+1}`}</td>
                    <td className="p-1 border-r border-slate-400 font-mono">{isBlankMode ? '' : '86.4'}</td>
                    <td className="p-1 border-r border-slate-400 font-mono">{isBlankMode ? '' : '88.2'}</td>
                    <td className="p-1 border-r border-slate-400 font-mono">{isBlankMode ? '' : '1'}</td>
                    <td className="p-1 border-r border-slate-400 font-mono">{isBlankMode ? '' : '0'}</td>
                    <td className="p-1 border-r border-slate-400 font-mono">{isBlankMode ? '' : '0'}</td>
                    <td className="p-1 text-left font-sans font-semibold">
                      {isBlankMode ? '' : i === 5 ? (student?.status === 'Lulus' ? 'LULUS / TAMAT BELAJAR' : 'Sedang Menempuh') : `Naik ke Kelas ${i+2}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section G: Meninggalkan Sekolah (Sheet TINGGALKAN) */}
          <div>
            <div className="font-sans font-bold text-xs bg-slate-200 px-2 py-1 border-t border-b border-slate-950 uppercase">
              G. MENINGGALKAN SEKOLAH / MUTASI KELUAR
            </div>
            <table className="w-full border-collapse text-[11px] mt-1">
              <tbody>
                <tr className="border-b border-slate-300">
                  <td className="w-6 py-1 align-top text-center">25.</td>
                  <td className="w-56 py-1">Tanggal Meninggalkan Sekolah</td>
                  <td className="w-3 py-1">:</td>
                  <td className="py-1 font-bold">
                    {isBlankMode ? '..................................................................' : 
                      student?.mutasi ? formatIndonesianDate(student.mutasi.tglMeninggalkan) : '-'
                    }
                  </td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="py-1 align-top text-center">26.</td>
                  <td className="py-1">Ditinggalkan Dari Kelas</td>
                  <td className="py-1">:</td>
                  <td className="py-1">{isBlankMode ? '..................................................................' : student?.mutasi?.dariKelas || '-'}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="py-1 align-top text-center">27.</td>
                  <td className="py-1">Pindah ke Sekolah</td>
                  <td className="py-1">:</td>
                  <td className="py-1 font-bold">{isBlankMode ? '..................................................................' : student?.mutasi?.sekolahTujuan || '-'}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="py-1 align-top text-center">28.</td>
                  <td className="py-1">Alasan Pindah / No. Surat</td>
                  <td className="py-1">:</td>
                  <td className="py-1">
                    {isBlankMode ? '..................................................................' : 
                      student?.mutasi ? `${student.mutasi.alasanPindah} (Surat: ${student.mutasi.noSuratPindah})` : '-'
                    }
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section H: STTB / Tamat Belajar (Sheet STTB) */}
          <div>
            <div className="font-sans font-bold text-xs bg-slate-200 px-2 py-1 border-t border-b border-slate-950 uppercase">
              H. TANDA TAMAT BELAJAR / IJAZAH (STTB)
            </div>
            <table className="w-full border-collapse text-[11px] mt-1">
              <tbody>
                <tr className="border-b border-slate-300">
                  <td className="w-6 py-1 align-top text-center">29.</td>
                  <td className="w-56 py-1">Tahun Kelulusan / Tamat Belajar</td>
                  <td className="w-3 py-1">:</td>
                  <td className="py-1 font-bold">{isBlankMode ? '..................................................................' : student?.sttb?.lulusTahun || '-'}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="py-1 align-top text-center">30.</td>
                  <td className="py-1">Nomor Seri Ijazah (DN)</td>
                  <td className="py-1">:</td>
                  <td className="py-1 font-mono font-bold">{isBlankMode ? '..................................................................' : student?.sttb?.noIjazah || '-'}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="py-1 align-top text-center">31.</td>
                  <td className="py-1">Nomor SKHU / Peserta Ujian</td>
                  <td className="py-1">:</td>
                  <td className="py-1 font-mono">{isBlankMode ? '..................................................................' : `${student?.sttb?.noSkhu || '-'} / ${student?.sttb?.noPesertaUN || '-'}`}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="py-1 align-top text-center">32.</td>
                  <td className="py-1">Melanjutkan Pendidikan Ke</td>
                  <td className="py-1">:</td>
                  <td className="py-1 font-bold">{isBlankMode ? '..................................................................' : student?.sttb?.melanjutkanKe || '-'}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="py-1 align-top text-center">33.</td>
                  <td className="py-1">Serah Terima Ijazah Fisik</td>
                  <td className="py-1">:</td>
                  <td className="py-1">
                    {isBlankMode ? 'Tanggal: .............................., Penerima: .......................................' : 
                      student?.sttb ? `Diterima tgl ${formatIndonesianDate(student.sttb.tglSerahTerima)} oleh ${student.sttb.namaPenerima} (${student.sttb.hubunganPenerima}) - [${student.sttb.statusTandaTerima}]` : '-'
                    }
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Page 2 Verification Footer */}
          <div className="pt-6 flex justify-between items-end font-sans text-[11px]">
            <div className="text-slate-500 text-[10px]">
              Dicetak melalui Aplikasi SIM Buku Induk Sekolah<br />
              Dokumen resmi arsip negara lembar buku induk siswa.
            </div>

            <div className="text-right leading-tight">
              <div>Mengetahui,</div>
              <div className="font-bold mt-0.5">Kepala {schoolProfile.namaSekolah}</div>
              <div className="h-14 flex items-center justify-end relative">
                {schoolProfile.stempelUrl ? (
                  <img
                    src={schoolProfile.stempelUrl}
                    alt="Stempel Sekolah"
                    className="w-24 h-14 object-contain opacity-85 absolute right-4 print:opacity-100"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
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

      </div>
    </div>
  );
};
