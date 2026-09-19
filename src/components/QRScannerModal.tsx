'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, X, QrCode } from 'lucide-react';

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
  const streamRef = useRef<MediaStream | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Kamerayı durduran yardımcı fonksiyon
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

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
        await videoRef.current.play();
      }
    } catch (err: unknown) {
      console.warn('Kamera erişim hatası:', err);
      setHasCameraPermission(false);
      const msg = err instanceof Error ? err.message : 'Kamera erişim izni alınamadı.';
      setErrorMessage(msg);
    }
  }, []);

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

  // QR Verisini analiz eden ve tipi otomatik saptayan fonksiyon (Smart QR Routing)
  const processDecodedQR = (qrString: string) => {
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
        parsed.type === 'MERCHANT' ||
        parsed.type === 'MERCHANT_PAYMENT' ||
        parsed.merchantAddress ||
        parsed.amountTL
      ) {
        detectedType = 'MERCHANT_PAYMENT';
      } else if (parsed.type === 'CHECK_IN' || parsed.shiftId) {
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
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md transition-all">
      <div className="relative w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 flex flex-col items-center">
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
        <div className="text-center mb-5 w-full pr-8 flex flex-col items-center">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-extrabold border bg-cyan-500/10 text-cyan-400 border-cyan-500/20 mb-2">
            <QrCode className="w-4 h-4 text-cyan-400" />
            <span>Evrensel Akıllı QR Tarayıcı</span>
          </div>
          <p className="text-xs text-slate-400">İşe Giriş, İş Çıkış veya Esnaf Ödeme QR Kodunu Çerçeveye Hizalayın</p>
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

        {/* Hizalama Talimatı */}
        <p className="text-xs font-semibold text-slate-300 text-center mt-4">
          QR Kod Otomatik Taranacaktır
        </p>

        {/* Kamera Uyarısı */}
        {errorMessage && (
          <div className="mt-4 w-full p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-200 text-center">
            {errorMessage}
          </div>
        )}
      </div>
    </div>
  );
}
