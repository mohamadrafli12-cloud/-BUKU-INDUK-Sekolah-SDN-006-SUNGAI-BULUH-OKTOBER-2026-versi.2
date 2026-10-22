import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  X, 
  RotateCcw, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  Timer, 
  Upload, 
  Sparkles,
  FlipHorizontal
} from 'lucide-react';
import { compressPasfotoFile } from '../../utils/imageCompressor';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (photoDataUrl: string) => void;
  title?: string;
  studentName?: string;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  title = 'Ambil Pasfoto Siswa',
  studentName
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileFallbackRef = useRef<HTMLInputElement | null>(null);

  const [hasCameraSupport, setHasCameraSupport] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [useCountdown, setUseCountdown] = useState<boolean>(false);
  const [isFlashActive, setIsFlashActive] = useState<boolean>(false);

  // Stop camera stream safely
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
  };

  // Start camera stream
  const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
    setIsInitializing(true);
    setCameraError(null);
    stopStream();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasCameraSupport(false);
      setCameraError('Peramban web tidak mendukung akses kamera langsung. Silakan gunakan tombol unggah berkas / kamera perangkat.');
      setIsInitializing(false);
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 960 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(err => {
            console.warn('Gagal memutar video stream:', err);
          });
          setIsInitializing(false);
        };
      } else {
        setIsInitializing(false);
      }
    } catch (err: any) {
      console.warn('Gagal mengakses kamera:', err);
      setIsInitializing(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Izin akses kamera ditolak oleh peramban. Harap izinkan akses kamera pada pengaturan browser Anda.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('Perangkat kamera (webcam) tidak terdeteksi pada perangkat ini.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError('Kamera sedang digunakan oleh aplikasi lain.');
      } else {
        setCameraError(err.message || 'Gagal menyalakan kamera.');
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCapturedPhoto(null);
      setCountdown(null);
      startCamera(facingMode);
    } else {
      stopStream();
      setCapturedPhoto(null);
    }

    return () => {
      stopStream();
    };
  }, [isOpen, facingMode]);

  // Handle capture action
  const executeCapture = () => {
    if (!videoRef.current) return;

    // Trigger visual flash animation
    setIsFlashActive(true);
    setTimeout(() => setIsFlashActive(false), 200);

    const video = videoRef.current;
    const vWidth = video.videoWidth || 640;
    const vHeight = video.videoHeight || 480;

    // We want a 3:4 portrait photo (width:height = 3:4 = 0.75)
    const targetAspect = 3 / 4;
    let cropWidth = vWidth;
    let cropHeight = vHeight;
    let startX = 0;
    let startY = 0;

    const currentAspect = vWidth / vHeight;
    if (currentAspect > targetAspect) {
      // Video is wider than 3:4 -> crop sides
      cropHeight = vHeight;
      cropWidth = Math.round(vHeight * targetAspect);
      startX = Math.round((vWidth - cropWidth) / 2);
    } else {
      // Video is taller than 3:4 -> crop top/bottom
      cropWidth = vWidth;
      cropHeight = Math.round(vWidth / targetAspect);
      startY = Math.round((vHeight - cropHeight) / 2);
    }

    const canvas = document.createElement('canvas');
    // Standard pasfoto size: 480 x 640 px
    canvas.width = 480;
    canvas.height = 640;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Mirror horizontal if enabled (for selfie mode)
    if (isMirrored && facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(
      video,
      startX,
      startY,
      cropWidth,
      cropHeight,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setCapturedPhoto(photoDataUrl);
    stopStream();
  };

  const handleStartCapture = () => {
    if (useCountdown) {
      setCountdown(3);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            executeCapture();
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      executeCapture();
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    startCamera(facingMode);
  };

  const handleConfirmPhoto = () => {
    if (capturedPhoto) {
      onCapture(capturedPhoto);
      stopStream();
      onClose();
    }
  };

  const handleClose = () => {
    stopStream();
    onClose();
  };

  // Fallback direct device camera / file upload
  const handleDeviceFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await compressPasfotoFile(file, 480, 640, 0.85);
      onCapture(res.dataUrl);
      handleClose();
    } catch (err: any) {
      alert(err.message || 'Gagal memproses foto dari kamera');
    }
  };

  const toggleFacingMode = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    setIsMirrored(nextMode === 'user');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-amber-300">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                {title}
              </h3>
              <p className="text-[11px] text-blue-100">
                {studentName ? `Siswa: ${studentName}` : 'Format Pasfoto Resmi 3x4 Buku Induk'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Tutup Kamera"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport / Camera Body */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col items-center justify-center overflow-y-auto bg-slate-100 dark:bg-slate-950/60">
          
          {/* Flash Effect Layer */}
          {isFlashActive && (
            <div className="absolute inset-0 bg-white z-40 opacity-80 pointer-events-none transition-opacity duration-200" />
          )}

          {/* Camera Error / No Support State */}
          {cameraError && !capturedPhoto ? (
            <div className="w-full max-w-md p-6 bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/60 text-center space-y-3.5 shadow-sm">
              <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  Tidak Dapat Mengakses Kamera
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {cameraError}
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Coba Lagi</span>
                </button>

                <input
                  type="file"
                  ref={fileFallbackRef}
                  accept="image/*"
                  capture="user"
                  onChange={handleDeviceFileInput}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileFallbackRef.current?.click()}
                  className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Buka Kamera Bawaan HP / File</span>
                </button>
              </div>
            </div>
          ) : capturedPhoto ? (
            /* Result Preview Screen */
            <div className="flex flex-col items-center space-y-4">
              <div className="relative w-48 sm:w-56 aspect-[3/4] rounded-2xl overflow-hidden shadow-xl border-4 border-white dark:border-slate-800 bg-slate-200 dark:bg-slate-800">
                <img
                  src={capturedPhoto}
                  alt="Hasil Pasfoto"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Foto 3x4 Siap</span>
                </div>
              </div>

              <div className="text-center">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Pasfoto berhasil diambil dan dipotong ke rasio resmi 3:4
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Periksa kembali kerapihan seragam, posisi kepala, dan pencahayaan
                </p>
              </div>
            </div>
          ) : (
            /* Live Camera Feed */
            <div className="relative flex flex-col items-center">
              {/* Camera Container with 3:4 Portrait Guide */}
              <div className="relative w-64 sm:w-72 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl bg-black border-2 border-slate-700 dark:border-slate-600">
                
                {isInitializing && (
                  <div className="absolute inset-0 bg-slate-900/90 z-20 flex flex-col items-center justify-center gap-2 text-white">
                    <RefreshCw className="w-7 h-7 text-blue-400 animate-spin" />
                    <span className="text-xs font-bold">Menyiapkan Kamera...</span>
                  </div>
                )}

                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${
                    isMirrored && facingMode === 'user' ? 'scale-x-[-1]' : ''
                  }`}
                />

                {/* 3:4 Frame Overlay Guide */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-3">
                  {/* Subtle Face Alignment Oval */}
                  <div className="w-36 h-48 sm:w-40 sm:h-52 rounded-[50%] border-2 border-dashed border-amber-300/80 shadow-[0_0_15px_rgba(251,191,36,0.25)] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400/50" />
                  </div>

                  {/* Corner Markers */}
                  <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-white/90" />
                  <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-white/90" />
                  <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-white/90" />
                  <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-white/90" />

                  {/* Guide Text */}
                  <div className="absolute bottom-3.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-[10px] text-white font-semibold">
                    Posisikan wajah di dalam oval kuning
                  </div>
                </div>

                {/* Countdown Overlay */}
                {countdown !== null && (
                  <div className="absolute inset-0 z-30 bg-black/50 backdrop-blur-xs flex items-center justify-center animate-in zoom-in-75 duration-150">
                    <div className="w-24 h-24 rounded-full bg-amber-500 text-white font-black text-5xl flex items-center justify-center shadow-2xl animate-pulse">
                      {countdown}
                    </div>
                  </div>
                )}
              </div>

              {/* Camera Secondary Tools Bar */}
              <div className="flex items-center gap-2 mt-3 text-xs">
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  title="Putar Kamera Depan / Belakang"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{facingMode === 'user' ? 'Kamera Belakang' : 'Kamera Depan'}</span>
                </button>

                {facingMode === 'user' && (
                  <button
                    type="button"
                    onClick={() => setIsMirrored(!isMirrored)}
                    className={`px-2.5 py-1.5 rounded-lg border font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs ${
                      isMirrored 
                        ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800' 
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                    title="Cermin (Mirror) horizontal kamera"
                  >
                    <FlipHorizontal className="w-3.5 h-3.5" />
                    <span>Cermin: {isMirrored ? 'On' : 'Off'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setUseCountdown(!useCountdown)}
                  className={`px-2.5 py-1.5 rounded-lg border font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs ${
                    useCountdown 
                      ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800' 
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                  title="Timer 3 detik sebelum jepret"
                >
                  <Timer className="w-3.5 h-3.5" />
                  <span>Timer 3d</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          {capturedPhoto ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Foto Ulang</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmPhoto}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Gunakan Foto Ini</span>
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileFallbackRef}
                  accept="image/*"
                  capture="user"
                  onChange={handleDeviceFileInput}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileFallbackRef.current?.click()}
                  className="px-3 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Unggah dari berkas galeri atau kamera asli perangkat"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Unggah Berkas</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handleStartCapture}
                  disabled={Boolean(cameraError) || isInitializing}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-amber-300" />
                  <span>{useCountdown ? 'Mulai Timer & Jepret' : 'Ambil Foto Sekarang'}</span>
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
