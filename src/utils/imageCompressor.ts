/**
 * Utilitas kompresi berkas gambar scan Ijazah / Dokumen Buku Induk & Pasfoto Siswa
 * Mengurangi resolusi & ukuran file agar aman dan cepat disimpan di penyimpanan offline
 */
export interface ImageCompressionResult {
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  fileName: string;
}

export function compressImageFile(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.80
): Promise<ImageCompressionResult> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Format berkas harus berupa gambar (JPG, JPEG, PNG, atau WEBP)'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca berkas gambar'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Gagal memuat gambar untuk dikompresi'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / maxWidth > height / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            dataUrl: e.target?.result as string,
            originalSize: file.size,
            compressedSize: file.size,
            fileName: file.name,
          });
          return;
        }

        // Background putih bersih jika PNG transparan diubah ke JPG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const approxSize = Math.round((dataUrl.length * 3) / 4);

        resolve({
          dataUrl,
          originalSize: file.size,
          compressedSize: approxSize,
          fileName: file.name,
        });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Utilitas khusus pasfoto 3x4 siswa
 * Mengompres pasfoto ke ukuran optimal (~400x533px, ~30-50KB)
 */
export function compressPasfotoFile(
  file: File,
  maxWidth = 480,
  maxHeight = 640,
  quality = 0.82
): Promise<ImageCompressionResult> {
  return compressImageFile(file, maxWidth, maxHeight, quality);
}
