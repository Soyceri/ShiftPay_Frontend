'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { LogIn, ShoppingBag, LogOut, Camera, X } from 'lucide-react';

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

  // QR Verisi analiz eden ve tipi otomatik saptayan fonksiyon (Smart QR Routing)
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

  const handleSimulateCheckOut = () => {
    const mockCheckOut = JSON.stringify({
      type: 'CHECK_OUT',
      employerAddress: 'GEMPLOYER...BUSINESS1234',
      shiftId: 'SHIFT-2026-991',
      employerName: 'ShiftPay Holding A.Ş.',
    });
    processDecodedQR(mockCheckOut);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      processDecodedQR(manualInput.trim());
    }
  };

  const getModeInfo = () => {
    switch (scanMode) {
      case 'CHECK_IN':
        return {
          title: 'İşe Giriş QR Tarayıcı',
          desc: 'İşvereninizin İşe Giriş QR Kodunu Okutun',
          badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          borderColor: 'border-amber-400/80',
          laserColor: 'from-amber-400 via-yellow-300 to-amber-400 shadow-[0_0_12px_#fbbf24]',
          icon: <LogIn className="w-5 h-5 text-amber-400" />,
        };
      case 'MERCHANT_PAYMENT':
        return {
          title: 'Esnaf Ödeme QR Tarayıcı',
          desc: 'Esnaf veya Mağaza QR Kodunu Okutun',
          badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
          borderColor: 'border-cyan-400/80',
          laserColor: 'from-cyan-400 via-blue-400 to-cyan-400 shadow-[0_0_12px_#38bdf8]',
          icon: <ShoppingBag className="w-5 h-5 text-cyan-400" />,
        };
      case 'CHECK_OUT':
        return {
          title: 'İş Çıkış QR Tarayıcı',
          desc: 'Vardiyanızı Bitirmek için İşveren QR Kodunu Okutun',
          badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          borderColor: 'border-emerald-400/80',
          laserColor: 'from-emerald-400 via-teal-300 to-emerald-400 shadow-[0_0_12px_#34d399]',
          icon: <LogOut className="w-5 h-5 text-emerald-400" />,
        };
    }
  };

  const modeInfo = getModeInfo();

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
          <X className="w-5 h-5" />
        </button>

        {/* Başlık & Mod Rozeti */}
        <div className="text-center mb-5 w-full pr-8 flex flex-col items-center">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${modeInfo.badgeColor} mb-2`}>
            {modeInfo.icon}
            <span>{modeInfo.title}</span>
          </div>
          <p className="text-xs text-slate-400">{modeInfo.desc}</p>
        </div>

        {/* QR Vizör & Kamera Alanı */}
        <div className={`relative w-64 h-64 rounded-3xl border-2 ${modeInfo.borderColor} bg-slate-950 overflow-hidden shadow-2xl flex items-center justify-center`}>
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
              <div className="w-6 h-6 border-t-2 border-l-2 border-white/80 rounded-tl-lg" />
              <div className="w-6 h-6 border-t-2 border-r-2 border-white/80 rounded-tr-lg" />
            </div>

            {/* Lazer Çizgisi */}
            <div className={`w-full h-0.5 bg-gradient-to-r ${modeInfo.laserColor} animate-pulse my-auto`} />

            <div className="flex justify-between">
              <div className="w-6 h-6 border-b-2 border-l-2 border-white/80 rounded-bl-lg" />
              <div className="w-6 h-6 border-b-2 border-r-2 border-white/80 rounded-br-lg" />
            </div>
          </div>
        </div>

        {/* Hizalama Talimatı */}
        <p className="text-xs font-semibold text-slate-300 text-center mt-4">
          QR Kodunu Çerçeveye Hizalayın (Otomatik Algılanır)
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
            <span>HIZLI SİMÜLASYON TESTLERİ</span>
            <span className="text-cyan-400">Akıllı Algılama</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleSimulateCheckIn}
              className="py-2.5 px-2 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-semibold text-[11px] transition-colors flex flex-col items-center justify-center gap-1"
            >
              <LogIn className="w-4 h-4 text-amber-400" />
              <span>Giriş QR</span>
            </button>

            <button
              onClick={handleSimulateMerchant}
              className="py-2.5 px-2 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-semibold text-[11px] transition-colors flex flex-col items-center justify-center gap-1"
            >
              <ShoppingBag className="w-4 h-4 text-cyan-400" />
              <span>Esnaf QR</span>
            </button>

            <button
              onClick={handleSimulateCheckOut}
              className="py-2.5 px-2 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-semibold text-[11px] transition-colors flex flex-col items-center justify-center gap-1"
            >
              <LogOut className="w-4 h-4 text-emerald-400" />
              <span>Çıkış QR</span>
            </button>
          </div>

          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Manuel QR veya JSON Metni"
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
