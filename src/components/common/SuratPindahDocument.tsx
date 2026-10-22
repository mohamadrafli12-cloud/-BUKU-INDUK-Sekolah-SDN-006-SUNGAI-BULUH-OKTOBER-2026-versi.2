import React from 'react';
import { Student, SchoolProfile, MutationRecord } from '../../types';
import { formatIndonesianDate } from '../../lib/utils';
import { TutWuriHandayaniSDLogo, OfficialNationalLogo } from '../../utils/logoHelper';

interface SuratPindahDocumentProps {
  student: Student;
  schoolProfile: SchoolProfile;
  mutation?: MutationRecord;
  className?: string;
}

export const SuratPindahDocument: React.FC<SuratPindahDocumentProps> = ({
  student,
  schoolProfile,
  mutation,
  className = '',
}) => {
  const mutasi = mutation || student.mutasi || {};

  // Formatter for class / tingkat (e.g. "Kelas 4" -> "4", "4" -> "4")
  const rawClass = mutasi.dariKelas || student.kelasSekarang || '4';
  const cleanClass = rawClass.replace(/^kelas\s*/i, '').trim() || rawClass;

  // Nama pemohon & pekerjaan pemohon (fallback to student parent/guardian data)
  const namaPemohon = mutasi.namaPemohon || student.ibu?.nama || student.ayah?.nama || student.wali?.nama || 'NENI FITRIANI';
  const pekerjaanPemohon = mutasi.pekerjaanPemohon || student.ibu?.pekerjaan || student.ayah?.pekerjaan || student.wali?.pekerjaan || 'Mengurus Rumah Tangga';

  // Alasan Pindah
  const alasanPindah = mutasi.alasanPindah || 'Mengikuti Orang Tua';

  // Nomor surat
  const currentYear = new Date().getFullYear();
  const defaultNoSurat = `422.1 /SDN-006/SB/X/${currentYear}/ 142`;
  const noSurat = mutasi.noSuratPindah || defaultNoSurat;

  // Tempat & Tanggal Surat
  const tempatSurat = mutasi.tempatSurat || schoolProfile.desaKelurahan || schoolProfile.desa || 'Sungai Buluh';
  const rawTanggal = mutasi.dikeluarkanTanggal || mutasi.tglMeninggalkan || new Date().toISOString().split('T')[0];
  const tglSuratFormatted = formatIndonesianDate(rawTanggal);

  // Penandatangan
  const namaKepalaSekolah = mutasi.namaKepalaSekolah || schoolProfile.namaKepalaSekolah || 'WINARNI,S.Pd.SD';
  const nipKepalaSekolah = mutasi.nipKepalaSekolah || schoolProfile.nipKepalaSekolah || '19790301 200801 2 017';

  // Data Sekolah Asal
  const kabKotaName = (schoolProfile.kabupatenKota || 'Kuantan Singingi').replace(/^kabupaten\s+/i, '').trim();
  const kecName = schoolProfile.kecamatan || 'Singingi Hilir';
  const schoolName = schoolProfile.namaSekolah || 'SEKOLAH DASAR NEGERI 006 SUNGAI BULUH';
  const schoolAddress = schoolProfile.alamatJalan || schoolProfile.alamatSekolah || 'Jln. Pendidikan No. 01 Desa Sungai Buluh';
  const schoolEmail = schoolProfile.email || 'sdn006sungaibuluh@gmail.com';
  const schoolNpsn = schoolProfile.npsn || '10403871';

  // Sekolah Tujuan
  const sekolahTujuan = mutasi.sekolahTujuan || 'SD Negeri 182 Pekanbaru';
  const desaKelTujuan = mutasi.desaKelurahanTujuan || 'Pasir Putih';
  const kecTujuan = mutasi.kecamatanTujuan || 'Air Dingin';
  const kabKotaTujuan = mutasi.kabupatenKotaTujuan || 'Pekanbaru';
  const provTujuan = mutasi.provinsiTujuan || 'RIAU';

  const jenisKelaminLabel = student.jenisKelamin === 'L' || student.jenisKelamin === 'Laki-Laki' ? 'Laki Laki' : 'Perempuan';

  return (
    <div className={`surat-pindah-print-sheet bg-white text-black font-sans leading-normal max-w-[210mm] mx-auto p-[12mm] sm:p-[14mm] print:p-[6mm] print:m-0 print:w-full print:shadow-none ${className}`}>
      {/* ===================== KOP SURAT DINAS RESMI ===================== */}
      <div className="pb-1 text-black">
        <div className="flex items-center justify-between gap-3">
          {/* LOGO KIRI: Lambang Daerah Pemda */}
          <div className="w-18 h-18 flex items-center justify-center shrink-0">
            {schoolProfile.logoKiriUrl && !schoolProfile.logoKiriUrl.startsWith('preset:') ? (
              <img
                src={schoolProfile.logoKiriUrl}
                alt="Logo Pemda"
                className="max-w-16 max-h-16 object-contain"
                referrerPolicy="no-referrer"
              />
            ) : schoolProfile.logoUrl && !schoolProfile.logoUrl.startsWith('preset:') ? (
              <img
                src={schoolProfile.logoUrl}
                alt="Logo Pemda / Sekolah"
                className="max-w-16 max-h-16 object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <OfficialNationalLogo
                logoIdOrUrl={schoolProfile.logoKiriUrl || schoolProfile.logoUrl || 'preset:garuda-emas'}
                className="w-16 h-16"
              />
            )}
          </div>

          {/* TEKS KOP SURAT */}
          <div className="text-center flex-1 min-w-0">
            <h4 className="text-[13pt] font-black uppercase tracking-wider text-black leading-tight">
              PEMERINTAH KABUPATEN {kabKotaName.toUpperCase()}
            </h4>
            <h2 className="text-[14pt] font-black uppercase tracking-wide text-black leading-tight mt-0.5">
              {schoolName.toUpperCase()}
            </h2>
            <h3 className="text-[12pt] font-black uppercase tracking-wide text-black leading-tight mt-0.5">
              KECAMATAN {kecName.toUpperCase()}
            </h3>
            <p className="text-[8.5pt] text-black leading-tight mt-1">
              Alamat : {schoolAddress} , email : {schoolEmail}, NPSN: {schoolNpsn}
            </p>
          </div>

          {/* LOGO KANAN: Tut Wuri Handayani Kemendikbud */}
          <div className="w-18 h-18 flex items-center justify-center shrink-0">
            {schoolProfile.logoKananUrl && !schoolProfile.logoKananUrl.startsWith('preset:') ? (
              <img
                src={schoolProfile.logoKananUrl}
                alt="Logo Tut Wuri Handayani"
                className="max-w-16 max-h-16 object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <TutWuriHandayaniSDLogo className="w-16 h-16" />
            )}
          </div>
        </div>

        {/* GARIS GANDA PEMBATAS KOP SURAT RESMI */}
        <div className="mt-2">
          <div className="h-[2.5px] bg-black w-full" />
          <div className="h-[1px] bg-black w-full mt-[1.5px]" />
        </div>
      </div>

      {/* ===================== JUDUL SURAT & NOMOR ===================== */}
      <div className="text-center mt-3 mb-3">
        <h1 className="text-[12pt] font-black uppercase underline tracking-wide text-black inline-block">
          SURAT KETERANGAN PINDAH SEKOLAH
        </h1>
        <div className="text-[10pt] text-black mt-0.5">
          <span>Nomor &nbsp;: &nbsp;</span>
          <span className="font-mono font-semibold">{noSurat}</span>
        </div>
      </div>

      {/* ===================== KALIMAT PEMBUKA ===================== */}
      <p className="text-[10pt] text-justify text-black mb-2.5 leading-snug">
        Yang bertanda tangan dibawah ini, Kepala {schoolName} Kecamatan {kecName} Kabupaten {kabKotaName}, Menerangkan :
      </p>

      {/* ===================== DATA SISWA ===================== */}
      <div className="text-[10pt] text-black mb-2.5 pl-6 sm:pl-8">
        <table className="border-collapse w-full">
          <tbody>
            <tr>
              <td className="w-56 py-0.5 align-top tracking-widest font-medium">N a m a</td>
              <td className="w-4 py-0.5 align-top text-center">:</td>
              <td className="py-0.5 align-top font-bold uppercase">{student.namaLengkap}</td>
            </tr>
            <tr>
              <td className="py-0.5 align-top font-medium">Nomor Induk Sekolah</td>
              <td className="py-0.5 align-top text-center">:</td>
              <td className="py-0.5 align-top font-mono font-bold">{student.noInduk}</td>
            </tr>
            <tr>
              <td className="py-0.5 align-top font-medium">Nomor Induk Siswa nasional</td>
              <td className="py-0.5 align-top text-center">:</td>
              <td className="py-0.5 align-top font-mono font-bold">{student.nisn}</td>
            </tr>
            <tr>
              <td className="py-0.5 align-top font-medium">Jenis Kelamin</td>
              <td className="py-0.5 align-top text-center">:</td>
              <td className="py-0.5 align-top">{jenisKelaminLabel}</td>
            </tr>
            <tr>
              <td className="py-0.5 align-top font-medium">Kelas / Tingkat</td>
              <td className="py-0.5 align-top text-center">:</td>
              <td className="py-0.5 align-top font-semibold">{cleanClass}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ===================== PERMINTAAN PINDAH ORANG TUA/WALI ===================== */}
      <p className="text-[10pt] text-black mb-1.5 leading-snug">
        Sesuai dengan permintaan pindah sekolah oleh orang tua/wali murid yaitu :
      </p>
      <div className="text-[10pt] text-black mb-2.5 pl-6 sm:pl-8">
        <table className="border-collapse w-full">
          <tbody>
            <tr>
              <td className="w-56 py-0.5 align-top tracking-widest font-medium">N a m a</td>
              <td className="w-4 py-0.5 align-top text-center">:</td>
              <td className="py-0.5 align-top font-bold uppercase">{namaPemohon}</td>
            </tr>
            <tr>
              <td className="py-0.5 align-top font-medium">Pekerjaan</td>
              <td className="py-0.5 align-top text-center">:</td>
              <td className="py-0.5 align-top">{pekerjaanPemohon}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ===================== SEKOLAH TUJUAN ===================== */}
      <p className="text-[10pt] text-black mb-1.5 leading-snug">
        Telah mengajukan pindah sekolah ke :
      </p>
      <div className="text-[10pt] text-black mb-2.5 pl-6 sm:pl-8">
        <table className="border-collapse w-full">
          <tbody>
            <tr>
              <td className="w-56 py-0.5 align-top font-medium">Nama Sekolah</td>
              <td className="w-4 py-0.5 align-top text-center">:</td>
              <td className="py-0.5 align-top font-bold">{sekolahTujuan}</td>
            </tr>
            <tr>
              <td className="py-0.5 align-top font-medium">Desa/Kelurahan</td>
              <td className="py-0.5 align-top text-center">:</td>
              <td className="py-0.5 align-top">{desaKelTujuan}</td>
            </tr>
            <tr>
              <td className="py-0.5 align-top font-medium">Kecamatan</td>
              <td className="py-0.5 align-top text-center">:</td>
              <td className="py-0.5 align-top">{kecTujuan}</td>
            </tr>
            <tr>
              <td className="py-0.5 align-top font-medium">Kabupaten/Kota</td>
              <td className="py-0.5 align-top text-center">:</td>
              <td className="py-0.5 align-top">{kabKotaTujuan}</td>
            </tr>
            <tr>
              <td className="py-0.5 align-top font-medium">Provinsi</td>
              <td className="py-0.5 align-top text-center">:</td>
              <td className="py-0.5 align-top uppercase">{provTujuan}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ===================== ALASAN PINDAH ===================== */}
      <div className="text-[10pt] text-black mb-5">
        <table className="border-collapse w-full">
          <tbody>
            <tr>
              <td className="w-56 sm:w-64 py-0.5 align-top font-medium">Dengan Alasan</td>
              <td className="w-4 py-0.5 align-top text-center">:</td>
              <td className="py-0.5 align-top font-medium">{alasanPindah}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ===================== TANDA TANGAN KEPALA SEKOLAH ===================== */}
      <div className="flex justify-end text-[10pt] text-black mb-4">
        <div className="w-64 text-center">
          <div>
            <span className="font-medium">{tempatSurat}</span>
            <span className="inline-block w-4" />
            <span>{tglSuratFormatted}</span>
          </div>
          <div className="font-medium mt-0.5">Kepala Sekolah</div>

          {/* Ruang Tanda Tangan & Stempel */}
          <div className="h-16 relative flex items-center justify-center my-1">
            {schoolProfile.stempelUrl && (
              <img
                src={schoolProfile.stempelUrl}
                alt="Stempel Sekolah"
                className="w-24 h-16 object-contain opacity-85 absolute"
                referrerPolicy="no-referrer"
              />
            )}
          </div>

          <div className="font-bold underline uppercase">{namaKepalaSekolah}</div>
          <div className="text-[9.5pt] font-mono mt-0.5">NIP.{nipKepalaSekolah}</div>
        </div>
      </div>

      {/* ===================== GARIS POTONG DISINI ===================== */}
      <div className="relative my-3 text-center print:my-2">
        <div className="border-t border-dashed border-black w-full absolute top-1/2 -translate-y-1/2" />
        <span className="relative bg-white px-3 text-[8.5pt] italic text-slate-800">
          Potong Disini
        </span>
      </div>

      {/* ===================== LEMBAR ISIAN PENGEMBALIAN DARI SEKOLAH TUJUAN ===================== */}
      <div className="text-[9.5pt] text-black pt-1">
        <p className="mb-2 italic text-[9.5pt]">
          Setelah anak tersebut di terima, mohon isian dibawah ini dikembalikan
        </p>

        <div className="flex flex-col sm:flex-row justify-between items-end gap-4 pt-1">
          {/* Form Isian Balasan */}
          <div className="flex-1 min-w-0 w-full sm:w-auto">
            <table className="border-collapse w-full text-[9pt]">
              <tbody>
                <tr>
                  <td className="w-44 py-0.5 align-top font-medium">Nomor Statistik sekolah</td>
                  <td className="w-3 py-0.5 align-top text-center">:</td>
                  <td className="py-0.5 align-bottom border-b border-dotted border-black min-w-[140px]">&nbsp;</td>
                </tr>
                <tr>
                  <td className="py-0.5 align-top font-medium">Nama Sekolah</td>
                  <td className="py-0.5 align-top text-center">:</td>
                  <td className="py-0.5 align-bottom border-b border-dotted border-black">&nbsp;</td>
                </tr>
                <tr>
                  <td className="py-0.5 align-top font-medium">Status Sekolah</td>
                  <td className="py-0.5 align-top text-center">:</td>
                  <td className="py-0.5 align-bottom border-b border-dotted border-black">&nbsp;</td>
                </tr>
                <tr>
                  <td className="py-0.5 align-top font-medium tracking-widest">A l a m a t</td>
                  <td className="py-0.5 align-top text-center">:</td>
                  <td className="py-0.5 align-bottom border-b border-dotted border-black">&nbsp;</td>
                </tr>
                <tr>
                  <td className="py-0.5 align-top font-medium">Desa / Kelurahan</td>
                  <td className="py-0.5 align-top text-center">:</td>
                  <td className="py-0.5 align-bottom border-b border-dotted border-black">&nbsp;</td>
                </tr>
                <tr>
                  <td className="py-0.5 align-top font-medium">Kecamatan/Kabupaten</td>
                  <td className="py-0.5 align-top text-center">:</td>
                  <td className="py-0.5 align-bottom border-b border-dotted border-black">&nbsp;</td>
                </tr>
                <tr>
                  <td className="py-0.5 align-top font-medium">Propinsi</td>
                  <td className="py-0.5 align-top text-center">:</td>
                  <td className="py-0.5 align-bottom border-b border-dotted border-black">&nbsp;</td>
                </tr>
                <tr>
                  <td className="py-0.5 align-top font-medium">Diterima Tanggal</td>
                  <td className="py-0.5 align-top text-center">:</td>
                  <td className="py-0.5 align-bottom border-b border-dotted border-black">&nbsp;</td>
                </tr>
                <tr>
                  <td className="py-0.5 align-top font-medium">Ditingkat / Kelas</td>
                  <td className="py-0.5 align-top text-center">:</td>
                  <td className="py-0.5 align-bottom border-b border-dotted border-black">&nbsp;</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tanda Tangan Sekolah Penerima (Diturunkan ke bawah dan lurus sejajar dengan penandatanganan di atas) */}
          <div className="w-64 text-center shrink-0 flex flex-col justify-end pt-10 sm:pt-12 pb-0.5">
            <div className="text-[10pt] font-medium">Kepala Sekolah</div>
            <div className="h-20" />
            <div className="border-b border-dotted border-black w-4/5 mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
};
