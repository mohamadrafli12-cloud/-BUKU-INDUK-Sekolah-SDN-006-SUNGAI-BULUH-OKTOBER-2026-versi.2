import React, { useMemo } from 'react';
import { Student, SchoolProfile } from '../../types';
import { formatIndonesianDate } from '../../lib/utils';
import { KopSuratHeader } from '../layout/KopSuratHeader';
import { PrintSettingsState } from '../modals/PrintActiveStudentsModal';
import { getTingkatKelasNumber } from '../views/ActiveStudentsView';

interface ActiveStudentsPrintDocumentProps {
  settings: PrintSettingsState;
  schoolProfile: SchoolProfile;
  activeTP: string;
  activeSemester: string;
  projectedStudents: Array<Student & { isBelumMasukSD?: boolean }>;
  rombelStats: Array<{
    kelas: string;
    total: number;
    jmlL: number;
    jmlP: number;
    waliKelas?: string;
    nipWaliKelas?: string;
    persentase?: string;
  }>;
  availableClasses: string[];
  adminUsers?: Array<{
    nama: string;
    nip?: string;
    kategoriTugas?: string;
    tingkatKelas?: string;
    jabatan?: string;
  }>;
  currentSelectedTingkat?: string;
  currentSelectedRombel?: string;
  currentSelectedStatus?: string;
  mode: 'daftar-siswa' | 'rekap-rombel';
}

export const ActiveStudentsPrintDocument: React.FC<ActiveStudentsPrintDocumentProps> = ({
  settings,
  schoolProfile,
  activeTP,
  activeSemester,
  projectedStudents,
  rombelStats,
  availableClasses,
  adminUsers = [],
  currentSelectedTingkat = 'ALL',
  currentSelectedRombel = 'ALL',
  currentSelectedStatus = 'ALL',
  mode,
}) => {
  // Helper to find default wali kelas
  const findWaliKelas = (targetKelas?: string) => {
    if (!targetKelas || targetKelas === 'ALL') {
      const firstWali = adminUsers.find(u => u.kategoriTugas === 'wali_kelas');
      return {
        nama: firstWali?.nama || settings.namaWaliKelas || 'Wali Kelas',
        nip: firstWali?.nip || settings.nipWaliKelas || '-',
      };
    }
    const matched = adminUsers.find(u => 
      u.kategoriTugas === 'wali_kelas' && 
      (u.tingkatKelas === targetKelas || u.jabatan?.includes(targetKelas))
    );
    if (matched) {
      return { nama: matched.nama, nip: matched.nip || '-' };
    }
    const statItem = rombelStats.find(r => r.kelas === targetKelas);
    return {
      nama: statItem?.waliKelas || `Wali Kelas ${targetKelas}`,
      nip: statItem?.nipWaliKelas || '-',
    };
  };

  // Filtered dataset
  const filteredStudents = useMemo(() => {
    let list = projectedStudents;

    if (settings.scope === 'filtered') {
      if (currentSelectedTingkat !== 'ALL') {
        if (currentSelectedTingkat === 'BELUM_MASUK_SD') {
          list = list.filter(s => s.status === 'Belum Masuk SD');
        } else {
          const targetNum = parseInt(currentSelectedTingkat, 10);
          list = list.filter(s => s.status !== 'Belum Masuk SD' && getTingkatKelasNumber(s.kelasSekarang) === targetNum);
        }
      }
      if (currentSelectedRombel !== 'ALL') {
        list = list.filter(s => s.kelasSekarang === currentSelectedRombel);
      }
      if (currentSelectedStatus !== 'ALL') {
        list = list.filter(s => s.status === currentSelectedStatus);
      }
    } else if (settings.scope === 'tingkat') {
      const targetNum = parseInt(settings.selectedTingkat, 10);
      list = list.filter(s => s.status !== 'Belum Masuk SD' && getTingkatKelasNumber(s.kelasSekarang) === targetNum);
    } else if (settings.scope === 'rombel') {
      list = list.filter(s => s.kelasSekarang === settings.selectedRombel);
    } else {
      list = list.filter(s => s.status === 'Aktif' || s.status === 'Belum Masuk SD' || s.status === 'Lulus' || s.status === 'Mutasi Keluar');
    }

    return list;
  }, [projectedStudents, settings.scope, settings.selectedTingkat, settings.selectedRombel, currentSelectedTingkat, currentSelectedRombel, currentSelectedStatus]);

  // Grouped students per Rombel for "Pisah Halaman per Rombel"
  const studentsGroupedByRombel = useMemo(() => {
    const map = new Map<string, Student[]>();
    const sorted = [...filteredStudents].sort((a, b) => a.namaLengkap.localeCompare(b.namaLengkap));

    sorted.forEach(s => {
      const cls = s.kelasSekarang || 'Tanpa Kelas';
      if (!map.has(cls)) {
        map.set(cls, []);
      }
      map.get(cls)!.push(s);
    });

    return Array.from(map.entries())
      .map(([rombel, students]) => ({ rombel, students }))
      .sort((a, b) => {
        const tA = getTingkatKelasNumber(a.rombel);
        const tB = getTingkatKelasNumber(b.rombel);
        if (tA !== tB) return tA - tB;
        return a.rombel.localeCompare(b.rombel, undefined, { numeric: true });
      });
  }, [filteredStudents]);

  // Rombel stats filtered for print
  const filteredRombelStats = useMemo(() => {
    let list = rombelStats;
    if (settings.hideEmptyRombel) {
      list = list.filter(r => r.total > 0);
    }
    if (settings.scope === 'tingkat') {
      const t = parseInt(settings.selectedTingkat, 10);
      list = list.filter(r => getTingkatKelasNumber(r.kelas) === t);
    } else if (settings.scope === 'filtered' && currentSelectedTingkat !== 'ALL' && currentSelectedTingkat !== 'BELUM_MASUK_SD') {
      const t = parseInt(currentSelectedTingkat, 10);
      list = list.filter(r => getTingkatKelasNumber(r.kelas) === t);
    }
    return list;
  }, [rombelStats, settings.hideEmptyRombel, settings.scope, settings.selectedTingkat, currentSelectedTingkat]);

  // Paper dimension string for @page
  const pageCss = useMemo(() => {
    const sizeStr = settings.paperSize === 'F4' ? '215mm 330mm' : settings.paperSize === 'Legal' ? '8.5in 14in' : 'A4';
    return `
      @page {
        size: ${sizeStr} ${settings.orientation};
        margin: 10mm 12mm 12mm 12mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `;
  }, [settings.paperSize, settings.orientation]);

  // Font size class mapping
  const fontSizeCls = settings.fontSize === 'xs' ? 'text-[9pt]' : settings.fontSize === 'sm' ? 'text-[10pt]' : 'text-[11pt]';

  return (
    <div id="active-students-print-document" className="hidden print:block text-black bg-white w-full">
      <style dangerouslySetInnerHTML={{ __html: pageCss }} />

      {/* ========================================================================= */}
      {/* MODE 1: DAFTAR SISWA AKTIF */}
      {/* ========================================================================= */}
      {mode === 'daftar-siswa' && (
        settings.groupingMode === 'per-rombel' ? (
          // PISAH HALAMAN PER ROMBEL (Setiap Rombel Dicetak di Lembar Baru)
          studentsGroupedByRombel.map((group, groupIdx) => {
            const isLastGroup = groupIdx === studentsGroupedByRombel.length - 1;
            const wali = findWaliKelas(group.rombel);
            const totalL = group.students.filter(s => s.jenisKelamin === 'L').length;
            const totalP = group.students.filter(s => s.jenisKelamin === 'P').length;

            return (
              <div 
                key={`print-group-${group.rombel}`} 
                className={`print-page ${fontSizeCls} ${!isLastGroup ? 'page-break' : ''}`}
                style={{ breakAfter: !isLastGroup ? 'page' : 'auto' }}
              >
                {/* KOP SURAT RESMI */}
                {settings.showKopSurat && (
                  <KopSuratHeader schoolProfile={schoolProfile} />
                )}

                {/* JUDUL DOKUMEN RESMI */}
                <div className="text-center my-3">
                  <h2 className="text-[13pt] font-black uppercase tracking-wider text-black">
                    {settings.customTitle.includes('{rombel}')
                      ? settings.customTitle.replace('{rombel}', group.rombel)
                      : `${settings.customTitle} - ${group.rombel.toUpperCase()}`}
                  </h2>
                  <p className="text-[10pt] font-bold uppercase text-black mt-0.5">
                    {settings.customSubtitle}
                  </p>

                  <div className="flex items-center justify-between text-[9.5pt] font-semibold border-b border-t border-black py-1 mt-2.5">
                    <div>
                      <span>Rombongan Belajar: <strong className="font-black">{group.rombel}</strong></span>
                      <span className="mx-2">•</span>
                      <span>Wali Kelas: <strong className="font-black">{wali.nama}</strong></span>
                    </div>
                    <div>
                      <span>Jumlah: <strong className="font-black">{group.students.length} Siswa</strong></span>
                      <span className="mx-1.5">(L: {totalL}, P: {totalP})</span>
                    </div>
                  </div>
                </div>

                {/* TABEL DATA SISWA */}
                <table className="w-full border-collapse border border-black mt-2 text-[9pt]">
                  <thead>
                    <tr className="bg-slate-100 print:bg-slate-100 text-black font-extrabold uppercase border-b border-black text-center">
                      {settings.columns.no && <th className="border border-black py-1.5 px-1 w-7">NO</th>}
                      {settings.columns.nis && <th className="border border-black py-1.5 px-1.5 w-16">NIS</th>}
                      {settings.columns.nisn && <th className="border border-black py-1.5 px-1.5 w-20">NISN</th>}
                      {settings.columns.namaLengkap && <th className="border border-black py-1.5 px-2 text-left">NAMA LENGKAP SISWA</th>}
                      {settings.columns.jenisKelamin && <th className="border border-black py-1.5 px-1 w-9">L/P</th>}
                      {settings.columns.rombel && <th className="border border-black py-1.5 px-1.5 w-16">ROMBEL</th>}
                      {settings.columns.tempatTanggalLahir && <th className="border border-black py-1.5 px-2 text-left">TEMPAT, TGL LAHIR</th>}
                      {settings.columns.namaOrangTua && <th className="border border-black py-1.5 px-2 text-left">NAMA ORANG TUA / WALI</th>}
                      {settings.columns.agama && <th className="border border-black py-1.5 px-1.5 w-16">AGAMA</th>}
                      {settings.columns.status && <th className="border border-black py-1.5 px-1.5 w-16">STATUS</th>}
                      {settings.columns.kolomParaf && <th className="border border-black py-1.5 px-1.5 w-24">PARAF / TTD</th>}
                      {settings.columns.kolomKeterangan && <th className="border border-black py-1.5 px-1.5 w-20">KET.</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {group.students.map((student, idx) => (
                      <tr key={`print-row-${student.id}`} className="border-b border-black avoid-break">
                        {settings.columns.no && (
                          <td className="border border-black py-1 px-1 text-center font-mono font-bold">
                            {idx + 1}
                          </td>
                        )}
                        {settings.columns.nis && (
                          <td className="border border-black py-1 px-1.5 text-center font-mono">
                            {student.noInduk}
                          </td>
                        )}
                        {settings.columns.nisn && (
                          <td className="border border-black py-1 px-1.5 text-center font-mono">
                            {student.nisn}
                          </td>
                        )}
                        {settings.columns.namaLengkap && (
                          <td className="border border-black py-1 px-2 font-bold uppercase">
                            {student.namaLengkap}
                          </td>
                        )}
                        {settings.columns.jenisKelamin && (
                          <td className="border border-black py-1 px-1 text-center font-bold">
                            {student.jenisKelamin}
                          </td>
                        )}
                        {settings.columns.rombel && (
                          <td className="border border-black py-1 px-1.5 text-center font-semibold">
                            {student.kelasSekarang}
                          </td>
                        )}
                        {settings.columns.tempatTanggalLahir && (
                          <td className="border border-black py-1 px-2">
                            {student.tempatLahir}, {formatIndonesianDate(student.tanggalLahir)}
                          </td>
                        )}
                        {settings.columns.namaOrangTua && (
                          <td className="border border-black py-1 px-2">
                            {student.orangTua?.ayah?.nama || student.orangTua?.ibu?.nama || student.orangTua?.wali?.nama || '-'}
                          </td>
                        )}
                        {settings.columns.agama && (
                          <td className="border border-black py-1 px-1.5 text-center">
                            {student.agama}
                          </td>
                        )}
                        {settings.columns.status && (
                          <td className="border border-black py-1 px-1.5 text-center font-semibold">
                            {student.status}
                          </td>
                        )}
                        {settings.columns.kolomParaf && (
                          <td className="border border-black py-1 px-1.5 text-[8pt] font-mono text-slate-400">
                            {idx + 1}. ....................
                          </td>
                        )}
                        {settings.columns.kolomKeterangan && (
                          <td className="border border-black py-1 px-1.5"></td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* REKAPITULASI BAWAH TABEL */}
                <div className="mt-2 text-[9pt] font-bold flex items-center justify-between">
                  <div>
                    Rincian: Laki-laki: {totalL} Orang | Perempuan: {totalP} Orang
                  </div>
                  <div>
                    Total Peserta Didik: {group.students.length} Orang
                  </div>
                </div>

                {/* TANDA TANGAN & PENGESAHAN DOKUMEN */}
                {settings.showSignatures && (
                  <div className="pt-8 flex justify-between items-start text-[10pt] avoid-break">
                    {settings.showWaliKelasSignature ? (
                      <div className="text-center w-52">
                        <p className="mb-16">
                          Wali Kelas {group.rombel},
                        </p>
                        <p className="font-bold underline uppercase">
                          {wali.nama}
                        </p>
                        <p className="text-[9pt]">
                          NIP. {wali.nip}
                        </p>
                      </div>
                    ) : <div />}

                    {settings.showKepalaSekolahSignature && (
                      <div className="text-center w-56">
                        <p>
                          {settings.titimangsaKota}, {settings.titimangsaTanggal}
                        </p>
                        <p className="mb-16">
                          Mengetahui,<br />Kepala Sekolah,
                        </p>
                        <p className="font-bold underline uppercase">
                          {settings.namaKepalaSekolah}
                        </p>
                        <p className="text-[9pt]">
                          NIP. {settings.nipKepalaSekolah}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          // CONTINUOUS TABLE (Satu Urutan Panjang Berkelanjutan)
          <div className={`print-page ${fontSizeCls}`}>
            {/* KOP SURAT RESMI */}
            {settings.showKopSurat && (
              <KopSuratHeader schoolProfile={schoolProfile} />
            )}

            {/* JUDUL DOKUMEN */}
            <div className="text-center my-3">
              <h2 className="text-[13pt] font-black uppercase tracking-wider text-black">
                {settings.customTitle}
              </h2>
              <p className="text-[10pt] font-bold uppercase text-black mt-0.5">
                {settings.customSubtitle}
              </p>
            </div>

            {/* TABEL DATA SISWA */}
            <table className="w-full border-collapse border border-black mt-2 text-[9pt]">
              <thead>
                <tr className="bg-slate-100 print:bg-slate-100 text-black font-extrabold uppercase border-b border-black text-center">
                  {settings.columns.no && <th className="border border-black py-1.5 px-1 w-7">NO</th>}
                  {settings.columns.nis && <th className="border border-black py-1.5 px-1.5 w-16">NIS</th>}
                  {settings.columns.nisn && <th className="border border-black py-1.5 px-1.5 w-20">NISN</th>}
                  {settings.columns.namaLengkap && <th className="border border-black py-1.5 px-2 text-left">NAMA LENGKAP SISWA</th>}
                  {settings.columns.jenisKelamin && <th className="border border-black py-1.5 px-1 w-9">L/P</th>}
                  {settings.columns.rombel && <th className="border border-black py-1.5 px-1.5 w-16">ROMBEL</th>}
                  {settings.columns.tempatTanggalLahir && <th className="border border-black py-1.5 px-2 text-left">TEMPAT, TGL LAHIR</th>}
                  {settings.columns.namaOrangTua && <th className="border border-black py-1.5 px-2 text-left">NAMA ORANG TUA / WALI</th>}
                  {settings.columns.agama && <th className="border border-black py-1.5 px-1.5 w-16">AGAMA</th>}
                  {settings.columns.status && <th className="border border-black py-1.5 px-1.5 w-16">STATUS</th>}
                  {settings.columns.kolomParaf && <th className="border border-black py-1.5 px-1.5 w-24">PARAF / TTD</th>}
                  {settings.columns.kolomKeterangan && <th className="border border-black py-1.5 px-1.5 w-20">KET.</th>}
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, idx) => (
                  <tr key={`print-row-cont-${student.id}`} className="border-b border-black avoid-break">
                    {settings.columns.no && (
                      <td className="border border-black py-1 px-1 text-center font-mono font-bold">
                        {idx + 1}
                      </td>
                    )}
                    {settings.columns.nis && (
                      <td className="border border-black py-1 px-1.5 text-center font-mono">
                        {student.noInduk}
                      </td>
                    )}
                    {settings.columns.nisn && (
                      <td className="border border-black py-1 px-1.5 text-center font-mono">
                        {student.nisn}
                      </td>
                    )}
                    {settings.columns.namaLengkap && (
                      <td className="border border-black py-1 px-2 font-bold uppercase">
                        {student.namaLengkap}
                      </td>
                    )}
                    {settings.columns.jenisKelamin && (
                      <td className="border border-black py-1 px-1 text-center font-bold">
                        {student.jenisKelamin}
                      </td>
                    )}
                    {settings.columns.rombel && (
                      <td className="border border-black py-1 px-1.5 text-center font-semibold">
                        {student.kelasSekarang}
                      </td>
                    )}
                    {settings.columns.tempatTanggalLahir && (
                      <td className="border border-black py-1 px-2">
                        {student.tempatLahir}, {formatIndonesianDate(student.tanggalLahir)}
                      </td>
                    )}
                    {settings.columns.namaOrangTua && (
                      <td className="border border-black py-1 px-2">
                        {student.orangTua?.ayah?.nama || student.orangTua?.ibu?.nama || student.orangTua?.wali?.nama || '-'}
                      </td>
                    )}
                    {settings.columns.agama && (
                      <td className="border border-black py-1 px-1.5 text-center">
                        {student.agama}
                      </td>
                    )}
                    {settings.columns.status && (
                      <td className="border border-black py-1 px-1.5 text-center font-semibold">
                        {student.status}
                      </td>
                    )}
                    {settings.columns.kolomParaf && (
                      <td className="border border-black py-1 px-1.5 text-[8pt] font-mono text-slate-400">
                        {idx + 1}. ....................
                      </td>
                    )}
                    {settings.columns.kolomKeterangan && (
                      <td className="border border-black py-1 px-1.5"></td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* TOTAL FOOTER */}
            <div className="mt-3 text-[9.5pt] font-bold flex items-center justify-between border-t border-black pt-1">
              <div>
                Rincian: L: {filteredStudents.filter(s => s.jenisKelamin === 'L').length} Siswa | P: {filteredStudents.filter(s => s.jenisKelamin === 'P').length} Siswa
              </div>
              <div>
                Total Keseluruhan: {filteredStudents.length} Siswa Terdaftar
              </div>
            </div>

            {/* TANDA TANGAN & PENGESAHAN DOKUMEN */}
            {settings.showSignatures && (
              <div className="pt-8 flex justify-between items-start text-[10pt] avoid-break">
                {settings.showWaliKelasSignature ? (
                  <div className="text-center w-52">
                    <p className="mb-16">
                      Petugas Pendata / Guru,
                    </p>
                    <p className="font-bold underline uppercase">
                      {settings.namaWaliKelas}
                    </p>
                    <p className="text-[9pt]">
                      NIP. {settings.nipWaliKelas}
                    </p>
                  </div>
                ) : <div />}

                {settings.showKepalaSekolahSignature && (
                  <div className="text-center w-56">
                    <p>
                      {settings.titimangsaKota}, {settings.titimangsaTanggal}
                    </p>
                    <p className="mb-16">
                      Mengetahui,<br />Kepala Sekolah,
                    </p>
                    <p className="font-bold underline uppercase">
                      {settings.namaKepalaSekolah}
                    </p>
                    <p className="text-[9pt]">
                      NIP. {settings.nipKepalaSekolah}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      )}

      {/* ========================================================================= */}
      {/* MODE 2: REKAPITULASI JUMLAH SISWA PER ROMBEL */}
      {/* ========================================================================= */}
      {mode === 'rekap-rombel' && (
        <div className={`print-page ${fontSizeCls}`}>
          {/* KOP SURAT RESMI */}
          {settings.showKopSurat && (
            <KopSuratHeader schoolProfile={schoolProfile} />
          )}

          {/* JUDUL DOKUMEN */}
          <div className="text-center my-3">
            <h2 className="text-[13pt] font-black uppercase tracking-wider text-black">
              {settings.customTitle}
            </h2>
            <p className="text-[10pt] font-bold uppercase text-black mt-0.5">
              {settings.customSubtitle}
            </p>
          </div>

          {/* TABEL REKAPITULASI ROMBEL */}
          <table className="w-full border-collapse border border-black mt-2 text-[9.5pt]">
            <thead>
              <tr className="bg-slate-100 print:bg-slate-100 text-black font-extrabold uppercase border-b border-black text-center">
                <th className="border border-black py-1.5 px-1 w-10">NO</th>
                <th className="border border-black py-1.5 px-3 text-left">ROMBONGAN BELAJAR (KELAS)</th>
                <th className="border border-black py-1.5 px-3 text-left">NAMA WALI KELAS</th>
                <th className="border border-black py-1.5 px-2 w-20">LAKI (L)</th>
                <th className="border border-black py-1.5 px-2 w-20">PEREMPUAN (P)</th>
                <th className="border border-black py-1.5 px-2 w-24">TOTAL SISWA</th>
                <th className="border border-black py-1.5 px-2 w-20">% DARI TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {filteredRombelStats.map((item, idx) => (
                <tr key={`print-rekap-row-${item.kelas}`} className="border-b border-black avoid-break">
                  <td className="border border-black py-1.5 px-1 text-center font-mono font-bold">{idx + 1}</td>
                  <td className="border border-black py-1.5 px-3 font-extrabold">{item.kelas}</td>
                  <td className="border border-black py-1.5 px-3">
                    <div className="font-bold">{item.waliKelas || '-'}</div>
                    {item.nipWaliKelas && <div className="text-[8pt] font-mono">NIP. {item.nipWaliKelas}</div>}
                  </td>
                  <td className="border border-black py-1.5 px-2 text-center font-bold">{item.jmlL}</td>
                  <td className="border border-black py-1.5 px-2 text-center font-bold">{item.jmlP}</td>
                  <td className="border border-black py-1.5 px-2 text-center font-black">{item.total}</td>
                  <td className="border border-black py-1.5 px-2 text-center font-mono">{item.persentase || '0'}%</td>
                </tr>
              ))}
              <tr className="bg-slate-100 print:bg-slate-100 font-black border-t-2 border-black">
                <td colSpan={3} className="border border-black py-2 px-3 text-right uppercase tracking-wider">
                  JUMLAH TOTAL:
                </td>
                <td className="border border-black py-2 px-2 text-center font-mono text-[10pt]">
                  {filteredRombelStats.reduce((acc, r) => acc + r.jmlL, 0)}
                </td>
                <td className="border border-black py-2 px-2 text-center font-mono text-[10pt]">
                  {filteredRombelStats.reduce((acc, r) => acc + r.jmlP, 0)}
                </td>
                <td className="border border-black py-2 px-2 text-center font-mono text-[10pt]">
                  {filteredRombelStats.reduce((acc, r) => acc + r.total, 0)}
                </td>
                <td className="border border-black py-2 px-2 text-center font-mono text-[10pt]">
                  100%
                </td>
              </tr>
            </tbody>
          </table>

          {/* TABEL RINGKASAN PER TINGKAT (1 S/D 6) JIKA DIAKTIFKAN */}
          {settings.includeTingkatSummary && (
            <div className="mt-6 avoid-break">
              <h4 className="text-[10pt] font-black uppercase tracking-wide mb-1 border-b border-black pb-0.5">
                Rekapitulasi Distribusi per Tingkat Kelas (Tingkat 1 s/d 6)
              </h4>
              <table className="w-full border-collapse border border-black text-[9pt]">
                <thead>
                  <tr className="bg-slate-100 print:bg-slate-100 font-extrabold uppercase text-center border-b border-black">
                    <th className="border border-black py-1 px-1 w-10">TINGKAT</th>
                    <th className="border border-black py-1 px-2 text-left">DESKRIPSI TINGKAT</th>
                    <th className="border border-black py-1 px-2 text-left">DAFTAR ROMBEL</th>
                    <th className="border border-black py-1 px-2 w-16">L</th>
                    <th className="border border-black py-1 px-2 w-16">P</th>
                    <th className="border border-black py-1 px-2 w-20">TOTAL</th>
                    <th className="border border-black py-1 px-2 w-16">PERSENTASE</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5, 6].map(t => {
                    const classStudents = projectedStudents.filter(s => getTingkatKelasNumber(s.kelasSekarang) === t && s.status !== 'Belum Masuk SD');
                    const rombels = availableClasses.filter(c => getTingkatKelasNumber(c) === t);
                    const l = classStudents.filter(s => s.jenisKelamin === 'L').length;
                    const p = classStudents.filter(s => s.jenisKelamin === 'P').length;
                    const tot = classStudents.length;
                    const grandTotal = projectedStudents.filter(s => s.status !== 'Belum Masuk SD').length;
                    const pct = grandTotal > 0 ? ((tot / grandTotal) * 100).toFixed(1) : '0';

                    return (
                      <tr key={`print-tingkat-${t}`} className="border-b border-black">
                        <td className="border border-black py-1 px-1 text-center font-bold">{t}</td>
                        <td className="border border-black py-1 px-2 font-bold">Kelas {t} (Tingkat {t})</td>
                        <td className="border border-black py-1 px-2 font-mono text-[8.5pt]">
                          {rombels.length > 0 ? rombels.join(', ') : `Kelas ${t}`}
                        </td>
                        <td className="border border-black py-1 px-2 text-center font-bold">{l}</td>
                        <td className="border border-black py-1 px-2 text-center font-bold">{p}</td>
                        <td className="border border-black py-1 px-2 text-center font-black">{tot}</td>
                        <td className="border border-black py-1 px-2 text-center font-mono">{pct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TANDA TANGAN & PENGESAHAN DOKUMEN REKAP */}
          {settings.showSignatures && (
            <div className="pt-8 flex justify-between items-start text-[10pt] avoid-break">
              {settings.showWaliKelasSignature ? (
                <div className="text-center w-52">
                  <p className="mb-16">
                    Koordinator Rombel / Tata Usaha,
                  </p>
                  <p className="font-bold underline uppercase">
                    {settings.namaWaliKelas}
                  </p>
                  <p className="text-[9pt]">
                    NIP. {settings.nipWaliKelas}
                  </p>
                </div>
              ) : <div />}

              {settings.showKepalaSekolahSignature && (
                <div className="text-center w-56">
                  <p>
                    {settings.titimangsaKota}, {settings.titimangsaTanggal}
                  </p>
                  <p className="mb-16">
                    Mengetahui,<br />Kepala Sekolah,
                  </p>
                  <p className="font-bold underline uppercase">
                    {settings.namaKepalaSekolah}
                  </p>
                  <p className="text-[9pt]">
                    NIP. {settings.nipKepalaSekolah}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
