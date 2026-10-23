import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatIndonesianDate(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatShortDate(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatCurrencyIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Mendapatkan Tahun Pelajaran dari sebuah tanggal (contoh: "2025-08-15" -> "2025/2026", "2025-01-10" -> "2024/2025")
 * Di Indonesia, tahun ajaran baru dimulai bulan Juli (bulan 7) s/d Juni (bulan 6) tahun berikutnya.
 */
export function getAcademicYearFromDate(dateString?: string): string {
  if (!dateString) return '';
  const clean = dateString.trim();

  // Jika sudah berformat "YYYY/YYYY"
  if (/^\d{4}\/\d{4}$/.test(clean)) return clean;

  // Jika hanya tahun "YYYY"
  if (/^\d{4}$/.test(clean)) {
    const y = parseInt(clean, 10);
    return `${y}/${y + 1}`;
  }

  // Format YYYY-MM-DD atau ISO string
  const m1 = clean.match(/^(\d{4})-(\d{2})/);
  if (m1) {
    const y = parseInt(m1[1], 10);
    const m = parseInt(m1[2], 10);
    return m >= 7 ? `${y}/${y + 1}` : `${y - 1}/${y}`;
  }

  // Format DD/MM/YYYY atau DD-MM-YYYY
  const m2 = clean.match(/^\d{1,2}[/-](\d{1,2})[/-](\d{4})/);
  if (m2) {
    const m = parseInt(m2[1], 10);
    const y = parseInt(m2[2], 10);
    return m >= 7 ? `${y}/${y + 1}` : `${y - 1}/${y}`;
  }

  // Format DD [Nama Bulan] YYYY (contoh: 15 Juli 2026, 10 Agustus 2026, Oktober 2026)
  const indoMonths: Record<string, number> = {
    januari: 1, jan: 1,
    februari: 2, feb: 2,
    maret: 3, mar: 3,
    april: 4, apr: 4,
    mei: 5,
    juni: 6, jun: 6,
    juli: 7, jul: 7,
    agustus: 8, agu: 8, ags: 8,
    september: 9, sep: 9,
    oktober: 10, okt: 10,
    november: 11, nov: 11,
    desember: 12, des: 12,
  };
  const mIndo = clean.toLowerCase().match(/(\d{1,2})?\s*([a-z]+)\s*(\d{4})/);
  if (mIndo && indoMonths[mIndo[2]]) {
    const m = indoMonths[mIndo[2]];
    const y = parseInt(mIndo[3], 10);
    return m >= 7 ? `${y}/${y + 1}` : `${y - 1}/${y}`;
  }

  try {
    const d = new Date(clean);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      return m >= 7 ? `${y}/${y + 1}` : `${y - 1}/${y}`;
    }
  } catch {
    // ignore
  }

  return '';
}

/**
 * Cek apakah tanggal atau tahun tertentu berada dalam Tahun Pelajaran tertentu (misal: "2026/2027")
 */
export function isInAcademicYear(dateOrYear?: string, targetAcademicYear?: string): boolean {
  if (!dateOrYear || !targetAcademicYear) return false;
  const cleanTarget = targetAcademicYear.trim();
  const derivedTP = getAcademicYearFromDate(dateOrYear);
  if (derivedTP && derivedTP === cleanTarget) return true;

  // Fallback direct match:
  const targetStartYear = cleanTarget.split('/')[0]?.trim();
  if (dateOrYear.trim() === targetStartYear) return true;
  if (dateOrYear.trim() === cleanTarget) return true;

  return false;
}

/**
 * Konversi bulan menjadi angka Romawi (contoh: bulan 10 -> X, bulan 1 -> I)
 */
export function getRomanMonth(monthIndexOrDate?: number | Date | string): string {
  const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  if (monthIndexOrDate === undefined || monthIndexOrDate === null || monthIndexOrDate === '') {
    return romanMonths[new Date().getMonth()];
  }
  if (typeof monthIndexOrDate === 'number') {
    if (monthIndexOrDate >= 1 && monthIndexOrDate <= 12) return romanMonths[monthIndexOrDate - 1];
    return romanMonths[monthIndexOrDate] || 'I';
  }
  if (monthIndexOrDate instanceof Date) {
    return romanMonths[monthIndexOrDate.getMonth()];
  }
  if (typeof monthIndexOrDate === 'string') {
    const d = new Date(monthIndexOrDate);
    if (!isNaN(d.getTime())) return romanMonths[d.getMonth()];
    // if string is single or double digit month '10'
    const parsed = parseInt(monthIndexOrDate, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 12) return romanMonths[parsed - 1];
  }
  return romanMonths[new Date().getMonth()] || 'X';
}
