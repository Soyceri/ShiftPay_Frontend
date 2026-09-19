'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, X, QrCode, Upload, Sparkles } from 'lucide-react';
import jsQR from 'jsqr';

export type ScanType = 'CHECK_IN' | 'MERCHANT_PAYMENT' | 'CHECK_OUT';

export interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  scanMode?: ScanType;
  onScanSuccess: (decodedData: string, scanType: ScanType) => void;
}

export default function QRScannerModal({
  isOpen,
  onClose,
  scanMode = 'CHECK_IN',
  onScanSuccess,
}: QRScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Kamerayı ve tarama döngüsünü durduran fonksiyon
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // QR Verisini analiz eden ve tipi otomatik saptayan fonksiyon (Smart QR Routing)
  const processDecodedQR = useCallback((qrString: string) => {
    stopCamera();

    let detectedType: ScanType = scanMode;

    try {
      const parsed = JSON.parse(qrString);
      if (
        parsed.type === 'CHECK_OUT' ||
        parsed.type === 'EXIT' ||
        parsed.action === 'checkout' ||
        parsed.checkOut
      ) {
        detectedType = 'CHECK_OUT';
      } else if (
        parsed.type === 'MERCHANT_PAY' ||
        parsed.type === 'MERCHANT' ||
        parsed.type === 'MERCHANT_PAYMENT' ||
        parsed.merchant_address ||
        parsed.merchantAddress ||
        parsed.amount_try ||
        parsed.amountTL
      ) {
        detectedType = 'MERCHANT_PAYMENT';
      } else if (parsed.type === 'CHECK_IN' || parsed.shiftId || parsed.shift_id) {
        detectedType = 'CHECK_IN';
      }
    } catch {
      // JSON değilse string pattern analizi
      const upper = qrString.toUpperCase();
      if (upper.includes('EXIT') || upper.includes('ÇIKIŞ') || upper.includes('CHECKOUT')) {
        detectedType = 'CHECK_OUT';
      } else if (upper.includes('MERCHANT') || upper.includes('ESNAF') || upper.includes('PAY')) {
        detectedType = 'MERCHANT_PAYMENT';
      } else if (upper.includes('CHECKIN') || upper.includes('GİRİŞ')) {
        detectedType = 'CHECK_IN';
      }
    }

    onScanSuccess(qrString, detectedType);
    onClose();
  }, [onClose, onScanSuccess, scanMode, stopCamera]);

  // Video akışından kare kare QR tarama döngüsü
  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas && video.readyState >= video.HAVE_CURRENT_DATA) {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data && code.data.trim().length > 0) {
            processDecodedQR(code.data);
            return; // QR bulundu, döngüyü bitir
          }
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  }, [processDecodedQR]);

  // Kamerayı başlat
  const startCamera = useCallback(async () => {
    setErrorMessage(null);
    setHasCameraPermission(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Cihazınızın tarayıcısı kamera erişimini desteklemiyor.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        animationFrameRef.current = requestAnimationFrame(scanFrame);
      }
    } catch (err: unknown) {
      console.warn('Kamera erişim hatası:', err);
      setHasCameraPermission(false);
      const msg = err instanceof Error ? err.message : 'Kamera erişim izni alınamadı.';
      setErrorMessage(msg);
    }
  }, [scanFrame]);

  // Görsel dosyasından QR okuma
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            processDecodedQR(code.data);
          } else {
            setErrorMessage('Seçilen görselde geçerli bir QR kod tespit edilemedi.');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Test için hızlı simülasyon tetikleyicisi
  const handleQuickSimulate = (type: ScanType) => {
    let payload = '';
    if (type === 'CHECK_IN') {
      payload = JSON.stringify({
        protocol: 'shiftpay',
        type: 'CHECK_IN',
        shift_id: '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(''),
        daily_wage_try: 1200,
        target_hours: 8,
        date: new Date().toISOString().substring(0, 10),
      });
    } else if (type === 'CHECK_OUT') {
      payload = JSON.stringify({
        protocol: 'shiftpay',
        type: 'CHECK_OUT',
        shift_id: '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(''),
        date: new Date().toISOString().substring(0, 10),
      });
    } else {
      payload = JSON.stringify({
        protocol: 'shiftpay',
        type: 'MERCHANT_PAY',
        merchant_address: 'GAESNAF4X92LK301948572109485710294857102',
        merchant_name: 'ShiftPay Esnaf / Market',
        amount_try: 180,
      });
    }

    processDecodedQR(payload);
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md transition-all animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 flex flex-col items-center max-h-[92vh] overflow-y-auto">
        {/* Gizli Canvas (Video İşleme İçin) */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Gizli Dosya Girişi */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Kapat Butonu */}
        <button
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="absolute top-5 right-5 p-2.5 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-700 transition-colors z-20 cursor-pointer"
          aria-label="Kapat"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Başlık & Rozet */}
        <div className="text-center mb-4 w-full pr-8 flex flex-col items-center">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-extrabold border bg-cyan-500/10 text-cyan-400 border-cyan-500/20 mb-2">
            <QrCode className="w-4 h-4 text-cyan-400" />
            <span>Evrensel Akıllı QR Tarayıcı</span>
          </div>
          <p className="text-xs text-slate-400">Şirket Giriş, Şirket Çıkış veya Esnaf Ödeme QR Kodunu Çerçeveye Hizalayın</p>
        </div>

        {/* QR Vizör & Kamera Alanı */}
        <div className="relative w-64 h-64 rounded-3xl border-2 border-cyan-400/80 bg-slate-950 overflow-hidden shadow-2xl flex items-center justify-center">
          {/* Kamera Canlı Akışı */}
          {hasCameraPermission ? (
            <video
              ref={videoRef}
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="p-4 text-center space-y-2">
              <Camera className="w-10 h-10 text-amber-400 mx-auto" />
              <p className="text-xs text-slate-300 font-medium">Kamera Başlatılamadı</p>
            </div>
          )}

          {/* Lazer Tarama Çizgisi & Çerçeve Efekti */}
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 z-10">
            {/* Çerçeve Köşeleri */}
            <div className="flex justify-between">
              <div className="w-6 h-6 border-t-2 border-l-2 border-cyan-400 rounded-tl-lg" />
              <div className="w-6 h-6 border-t-2 border-r-2 border-cyan-400 rounded-tr-lg" />
            </div>

            {/* Lazer Çizgisi */}
            <div className="w-full h-0.5 bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 shadow-[0_0_12px_#38bdf8] animate-pulse my-auto" />

            <div className="flex justify-between">
              <div className="w-6 h-6 border-b-2 border-l-2 border-cyan-400 rounded-bl-lg" />
              <div className="w-6 h-6 border-b-2 border-r-2 border-cyan-400 rounded-br-lg" />
            </div>
          </div>
        </div>

        {/* Canlı Otomatik Tarama Bildirimi */}
        <p className="text-xs font-semibold text-cyan-300 text-center mt-3">
          ● Kamera Canlı Taranıyor (QR Kodunu Hizalayın)
        </p>

        {/* Görsel Yükle Butonu */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="mt-3 w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Upload className="w-4 h-4 text-cyan-400" />
          <span>📁 Galeriden / Dosyadan QR Yükle</span>
        </button>

        {/* Hızlı Test Simülasyon Butonları */}
        <div className="mt-4 w-full pt-3 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Hızlı Test Simülatörü</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickSimulate('CHECK_IN')}
              className="p-2 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/30 text-[11px] font-bold text-cyan-300 text-center transition-all cursor-pointer"
            >
              🟢 Şirket Giriş
            </button>
            <button
              onClick={() => handleQuickSimulate('CHECK_OUT')}
              className="p-2 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/30 text-[11px] font-bold text-amber-300 text-center transition-all cursor-pointer"
            >
              🏁 Şirket Çıkış
            </button>
            <button
              onClick={() => handleQuickSimulate('MERCHANT_PAYMENT')}
              className="p-2 rounded-xl bg-pink-950/40 hover:bg-pink-900/50 border border-pink-500/30 text-[11px] font-bold text-pink-300 text-center transition-all cursor-pointer"
            >
              🏪 Esnaf Öde
            </button>
          </div>
        </div>

        {/* Kamera / Hata Uyarısı */}
        {errorMessage && (
          <div className="mt-3 w-full p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-200 text-center animate-fade-in">
            {errorMessage}
          </div>
        )}
      </div>
    </div>
  );
}
