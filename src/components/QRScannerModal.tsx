'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

export interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedData: string, scanType: 'CHECK_IN' | 'MERCHANT_PAYMENT') => void;
}

export default function QRScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
}: QRScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState<string>('');

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

  // QR Verisi analiz eden ve tipi otomatik saptayan fonksiyon (Smart Routing)
  const processDecodedQR = (qrString: string) => {
    stopCamera();

    let scanType: 'CHECK_IN' | 'MERCHANT_PAYMENT' = 'CHECK_IN';

    try {
      const parsed = JSON.parse(qrString);
      if (
        parsed.type === 'MERCHANT' ||
        parsed.type === 'MERCHANT_PAYMENT' ||
        parsed.merchantAddress ||
        parsed.amountTL
      ) {
        scanType = 'MERCHANT_PAYMENT';
      } else if (parsed.type === 'CHECK_IN' || parsed.shiftId) {
        scanType = 'CHECK_IN';
      }
    } catch {
      // JSON değilse string pattern analizi
      const upper = qrString.toUpperCase();
      if (upper.includes('MERCHANT') || upper.includes('ESNAF') || upper.includes('PAY')) {
        scanType = 'MERCHANT_PAYMENT';
      } else {
        scanType = 'CHECK_IN';
      }
    }

    onScanSuccess(qrString, scanType);
    onClose();
  };

  // Test / Simülasyon Butonları
  const handleSimulateCheckIn = () => {
    const mockCheckIn = JSON.stringify({
      type: 'CHECK_IN',
      shiftId: 'SHIFT-2026-991',
      employer: 'ShiftPay Holding A.Ş.',
    });
    processDecodedQR(mockCheckIn);
  };

  const handleSimulateMerchant = () => {
    const mockMerchant = JSON.stringify({
      type: 'MERCHANT',
      merchantAddress: 'GMERCHANT...KAFE777',
      merchantName: 'Simit & Kahve Durağı',
      amountTL: 120,
    });
    processDecodedQR(mockMerchant);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      processDecodedQR(manualInput.trim());
    }
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
          className="absolute top-5 right-5 p-2.5 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-700 transition-colors z-20"
          aria-label="Kapat"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Başlık */}
        <div className="text-center mb-5 w-full pr-8">
          <h3 className="text-xl font-bold text-white tracking-tight">Akıllı QR Tarayıcı</h3>
          <p className="text-xs text-slate-400 mt-1">İşe Giriş veya Esnaf Ödeme QR Kodunu Okutun</p>
        </div>

        {/* QR Vizör & Kamera Alanı */}
        <div className="relative w-64 h-64 rounded-3xl border-2 border-cyan-500/60 bg-slate-950 overflow-hidden shadow-2xl flex items-center justify-center">
          
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
              <svg className="w-10 h-10 text-amber-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
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
            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#38bdf8] animate-pulse my-auto" />

            <div className="flex justify-between">
              <div className="w-6 h-6 border-b-2 border-l-2 border-cyan-400 rounded-bl-lg" />
              <div className="w-6 h-6 border-b-2 border-r-2 border-cyan-400 rounded-br-lg" />
            </div>
          </div>
        </div>

        {/* Hizalama Talimatı */}
        <p className="text-xs font-semibold text-cyan-300 text-center mt-4">
          İşveren veya Esnaf QR Kodunu Çerçeveye Hizalayın
        </p>

        {/* Kamera Uyarısı */}
        {errorMessage && (
          <div className="mt-4 w-full p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-200 text-center">
            {errorMessage}
          </div>
        )}

        {/* Test & Manuel Simülasyon Alanı */}
        <div className="mt-5 w-full pt-4 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span>HIZLI TEST SİMÜLASYONU</span>
            <span className="text-cyan-400">Otomatik Yönlendirmeli</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleSimulateCheckIn}
              className="py-2.5 px-3 rounded-2xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <span>Check-In Tara</span>
            </button>

            <button
              onClick={handleSimulateMerchant}
              className="py-2.5 px-3 rounded-2xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>Esnaf Ödeme Tara</span>
            </button>
          </div>

          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Manuel QR Metni / JSON Girin"
              className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
            >
              İşle
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
