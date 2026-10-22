import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Download, Printer, GraduationCap } from 'lucide-react';
import { Student } from '../../types';
import { formatIndonesianDate } from '../../lib/utils';

interface IjazahViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
  student?: Student | null;
  title?: string;
  subtitle?: string;
}

export const IjazahViewerModal: React.FC<IjazahViewerModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  student,
  title,
  subtitle,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  if (!isOpen || !imageUrl) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoom(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = imageUrl;
    const cleanName = student?.namaLengkap ? student.namaLengkap.replace(/[^a-zA-Z0-9]/g, '_') : 'Siswa';
    const nis = student?.noInduk || 'NIS';
    const prefix = title?.toLowerCase().includes('foto') ? 'Foto' : 'Ijazah';
    a.download = `${prefix}_${cleanName}_${nis}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cetak Berkas Ijazah - ${student?.namaLengkap || 'Siswa'}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 1cm;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              text-align: center;
              color: #111;
            }
            .header {
              margin-bottom: 12px;
              border-bottom: 2px solid #003399;
              padding-bottom: 8px;
            }
            .header h2 {
              margin: 0 0 4px 0;
              color: #003399;
              font-size: 16pt;
              text-transform: uppercase;
            }
            .header p {
              margin: 2px 0;
              font-size: 10pt;
              color: #444;
            }
            .img-container {
              max-width: 100%;
              max-height: 25cm;
              margin: 0 auto;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            img {
              max-width: 100%;
              max-height: 24.5cm;
              object-fit: contain;
              border: 1px solid #ccc;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .footer {
              margin-top: 10px;
              font-size: 8pt;
              color: #777;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>SALINAN BERKAS IJAZAH / STTB PESERTA DIDIK</h2>
            <p><strong>${student?.namaLengkap || ''}</strong> &nbsp;|&nbsp; NIS: <strong>${student?.noInduk || '-'}</strong> &nbsp;|&nbsp; NISN: <strong>${student?.nisn || '-'}</strong></p>
            <p>No. Seri Ijazah: <strong>${student?.sttb?.noIjazah || '-'}</strong> &nbsp;|&nbsp; Kelulusan: <strong>${student?.sttb?.tanggalKelulusan ? formatIndonesianDate(student.sttb.tanggalKelulusan) : '-'}</strong></p>
          </div>
          <div class="img-container">
            <img src="${imageUrl}" alt="Berkas Ijazah" />
          </div>
          <div class="footer">
            Dicetak dari Sistem Administrasi Buku Induk Siswa &bull; Arsip Dokumen Digital Resmi
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="px-5 py-3.5 bg-[#003399] text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-white/10 text-amber-300 shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold tracking-wide truncate">
                  {title || 'Berkas Scan / Gambar Ijazah Resmi'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shrink-0">
                  {title ? 'Pratinjau' : 'Dokumen Asli'}
                </span>
              </div>
              <p className="text-[11px] text-blue-100 truncate">
                {subtitle || (student ? `${student.namaLengkap} (NIS: ${student.noInduk} • No. Ijazah: ${student.sttb?.noIjazah || '-'})` : 'Lampiran Berkas Siswa')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Download */}
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors cursor-pointer"
              title="Unduh Berkas Gambar Ijazah"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Unduh</span>
            </button>

            {/* Print */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
              title="Cetak Salinan Ijazah ke PDF / Printer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
              title="Tutup Pratinjau"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar controls (Zoom & Rotate) */}
        <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-[11px]">Skala Tampilan:</span>
            <span className="font-mono font-bold text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 cursor-pointer"
              title="Perkecil"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 cursor-pointer"
              title="Perbesar"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRotate}
              className="p-1.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
              title="Putar 90 Derajat"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-[11px] cursor-pointer"
              title="Reset Tampilan Normal"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Image Canvas Container */}
        <div className="flex-1 overflow-auto bg-slate-900/90 dark:bg-black p-4 sm:p-8 flex items-center justify-center min-h-[350px]">
          <div
            className="transition-transform duration-200 ease-out origin-center select-none shadow-2xl rounded-lg overflow-hidden bg-white max-w-full"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
            }}
          >
            <img
              src={imageUrl}
              alt="Scan Ijazah Lengkap"
              className="max-h-[70vh] max-w-full object-contain pointer-events-auto cursor-zoom-in"
              onClick={() => (zoom === 1 ? handleZoomIn() : handleResetZoom())}
            />
          </div>
        </div>

        {/* Footer info */}
        <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div>
            Format: Berkas Gambar Resmi &bull; Resolusi Optimal Buku Induk
          </div>
          <div>
            Klik gambar untuk perbesar cepat &bull; Gunakan tombol Cetak untuk mencetak salinan A4
          </div>
        </div>
      </div>
    </div>
  );
};
