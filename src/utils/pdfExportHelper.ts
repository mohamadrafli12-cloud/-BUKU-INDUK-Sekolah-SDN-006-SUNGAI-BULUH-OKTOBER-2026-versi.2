import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface BukuIndukPdfExportOptions {
  page1Element: HTMLElement;
  page2Element: HTMLElement;
  studentName?: string;
  nisn?: string;
  isBlankMode?: boolean;
  schoolName?: string;
}

/**
 * Helper to export the 2-page Buku Induk Peserta Didik into an official A4 PDF document.
 */
export const exportBukuIndukToPdf = async (options: BukuIndukPdfExportOptions): Promise<void> => {
  const { page1Element, page2Element, studentName, nisn, isBlankMode } = options;

  if (!page1Element || !page2Element) {
    throw new Error('Elemen halaman Buku Induk tidak ditemukan.');
  }

  // Configuration for high-res crisp print capture
  const canvasOptions = {
    scale: 2, // 2x resolution for crisp text rendering
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 1200,
  };

  // Capture Page 1
  const canvasPage1 = await html2canvas(page1Element, canvasOptions);
  const imgData1 = canvasPage1.toDataURL('image/png', 1.0);

  // Capture Page 2
  const canvasPage2 = await html2canvas(page2Element, canvasOptions);
  const imgData2 = canvasPage2.toDataURL('image/png', 1.0);

  // Standard A4 dimensions in mm: 210 x 297
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pdfWidth = 210;
  const pdfHeight = 297;

  // Add Page 1
  pdf.addImage(imgData1, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

  // Add Page 2
  pdf.addPage('a4', 'portrait');
  pdf.addImage(imgData2, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

  // Construct official filename
  let filename = 'Buku_Induk_Peserta_Didik.pdf';
  if (isBlankMode) {
    filename = 'Buku_Induk_Peserta_Didik_Blanko_Kosong.pdf';
  } else if (studentName) {
    const cleanName = studentName.trim().replace(/[^a-zA-Z0-9_\-]/g, '_');
    const cleanNisn = nisn ? `_${nisn.trim()}` : '';
    filename = `Buku_Induk_${cleanName}${cleanNisn}.pdf`;
  }

  // Trigger download in browser
  pdf.save(filename);
};
