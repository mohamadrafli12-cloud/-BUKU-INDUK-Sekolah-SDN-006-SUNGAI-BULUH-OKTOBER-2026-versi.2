import React from 'react';
import { SchoolProfile } from '../../types';
import { 
  OfficialNationalLogo, 
  TutWuriHandayaniSDLogo 
} from '../../utils/logoHelper';

interface KopSuratHeaderProps {
  schoolProfile: SchoolProfile;
  subHeader1?: string;
  subHeader2?: string;
  documentTitle?: string;
  documentSubtitle?: string;
  className?: string;
}

export const KopSuratHeader: React.FC<KopSuratHeaderProps> = ({
  schoolProfile,
  subHeader1,
  subHeader2,
  documentTitle,
  documentSubtitle,
  className = '',
}) => {
  const line1 = subHeader1 || `PEMERINTAH KABUPATEN ${(schoolProfile.kabupatenKota || 'KUANTAN SINGINGI').toUpperCase()}`;
  const line2 = subHeader2 || 'DINAS PENDIDIKAN KEPEMUDAAN DAN OLAHRAGA';

  const alamatLengkap = [
    schoolProfile.alamatJalan || schoolProfile.alamatSekolah,
    (schoolProfile.desaKelurahan || schoolProfile.desa) ? `Desa ${schoolProfile.desaKelurahan || schoolProfile.desa}` : '',
    schoolProfile.kecamatan ? `Kec. ${schoolProfile.kecamatan}` : '',
    schoolProfile.kabupatenKota ? `Kab. ${schoolProfile.kabupatenKota}` : '',
    schoolProfile.kodePos ? `Kode Pos ${schoolProfile.kodePos}` : '',
  ].filter(Boolean).join(', ');

  const contactList = [
    schoolProfile.telepon ? `Telp: ${schoolProfile.telepon}` : '',
    schoolProfile.email ? `Email: ${schoolProfile.email}` : '',
    schoolProfile.website ? `Website: ${schoolProfile.website}` : '',
  ].filter(Boolean).join(' | ');

  return (
    <div className={`kop-surat-header block pb-2 mb-4 text-slate-950 print:block ${className}`}>
      <div className="flex items-center justify-between gap-4">
        {/* LOGO KIRI: Logo Satuan Pendidikan / Lambang Pemda */}
        <div className="w-18 h-18 flex items-center justify-center shrink-0">
          {(schoolProfile.logoKiriUrl || schoolProfile.logoUrl) && !(schoolProfile.logoKiriUrl || schoolProfile.logoUrl)?.startsWith('preset:') ? (
            <img
              src={schoolProfile.logoKiriUrl || schoolProfile.logoUrl}
              alt="Logo Sebelah Kiri (Kop)"
              className="max-w-16 max-h-16 object-contain"
              referrerPolicy="no-referrer"
            />
          ) : (schoolProfile.logoKiriUrl || schoolProfile.logoUrl)?.startsWith('preset:') ? (
            <OfficialNationalLogo
              logoIdOrUrl={schoolProfile.logoKiriUrl || schoolProfile.logoUrl}
              className="w-16 h-16"
            />
          ) : (
            <TutWuriHandayaniSDLogo className="w-16 h-16" />
          )}
        </div>

        {/* TEKS TENGAH KOP SURAT RESMI */}
        <div className="text-center flex-1 min-w-0 px-2">
          <div className="text-[11px] font-sans font-bold tracking-wider uppercase text-slate-800 leading-tight">
            {line1}
          </div>
          <div className="text-[11px] font-sans font-bold uppercase text-slate-800 leading-tight">
            {line2}
          </div>
          <h2 className="text-[16px] font-sans font-black uppercase tracking-wide text-slate-950 mt-0.5 leading-tight">
            {schoolProfile.namaSekolah}
          </h2>
          <div className="text-[9.5px] font-sans text-slate-700 leading-snug mt-0.5">
            <span>NPSN: <strong className="font-mono">{schoolProfile.npsn}</strong></span>
            {schoolProfile.nss && <span> | NSS: <strong className="font-mono">{schoolProfile.nss}</strong></span>}
            {alamatLengkap && <span> | {alamatLengkap}</span>}
          </div>
          {contactList && (
            <div className="text-[9px] font-sans text-slate-600 leading-none mt-0.5">
              {contactList}
            </div>
          )}
        </div>

        {/* LOGO KANAN: Lambang Resmi Nasional / Tut Wuri Handayani */}
        <div className="w-18 h-18 flex items-center justify-center shrink-0">
          {schoolProfile.logoKananUrl && !schoolProfile.logoKananUrl.startsWith('preset:') ? (
            <img
              src={schoolProfile.logoKananUrl}
              alt="Logo Sebelah Kanan (Kop)"
              className="max-w-16 max-h-16 object-contain"
              referrerPolicy="no-referrer"
            />
          ) : (
            <OfficialNationalLogo
              logoIdOrUrl={schoolProfile.logoKananUrl || schoolProfile.tutWuriLogoUrl || 'preset:tut-wuri-sd'}
              className="w-16 h-16"
            />
          )}
        </div>
      </div>

      {/* Garis Ganda Pembatas Kop Surat Resmi (Thick Line + Thin Line) */}
      <div className="mt-2.5">
        <div className="h-[2.5px] bg-slate-950 w-full" />
        <div className="h-[1px] bg-slate-950 w-full mt-[1.5px]" />
      </div>

      {/* Optional Document Title immediately below Kop */}
      {documentTitle && (
        <div className="text-center mt-3 mb-1 space-y-0.5">
          <h3 className="font-sans font-extrabold text-[14px] uppercase tracking-wide text-slate-950">
            {documentTitle}
          </h3>
          {documentSubtitle && (
            <p className="font-sans font-bold text-xs text-slate-700">
              {documentSubtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
