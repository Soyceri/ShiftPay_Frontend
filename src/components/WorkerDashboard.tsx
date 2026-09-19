'use client';

import React, { useState, useEffect } from 'react';
import {
  getWorkerState,
  checkOut,
  getAnchorOfframpUrl,
  WorkerState,
} from '@/services/shiftpay';
import DepositModal from '@/components/DepositModal';
import QRScannerModal from '@/components/QRScannerModal';

export interface WorkerDashboardProps {
  workerAddress?: string;
  employerAddress?: string;
}

export default function WorkerDashboard({
  workerAddress = 'GCRX...SHIFTWORKER9999',
  employerAddress = 'GEMPLOYER...BUSINESS1234',
}: WorkerDashboardProps) {
  const [workerState, setWorkerState] = useState<WorkerState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [checkOutLoading, setCheckOutLoading] = useState<boolean>(false);

  // Modals
  const [isDepositModalOpen, setIsDepositModalOpen] = useState<boolean>(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState<boolean>(false);
  const [qrMode, setQrMode] = useState<'checkin' | 'merchant'>('checkin');

  // SEP-24 FAST Off-ramp state
  const [iban, setIban] = useState<string>('TR33 0006 1000 0000 1234 5678 90');
  const [offrampAmount, setOfframpAmount] = useState<string>('500');
  const [offrampLoading, setOfframpLoading] = useState<boolean>(false);

  // Sayfa yüklendiğinde veriyi çek
  const fetchWorkerData = async () => {
    setLoading(true);
    try {
      const state = await getWorkerState(workerAddress);
      setWorkerState(state);
    } catch (err) {
      console.error('İşçi verisi alınamadı:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkerData();
  }, [workerAddress]);

  // Check-Out işlemi
  const handleCheckOut = async () => {
    setCheckOutLoading(true);
    setActionMessage(null);
    try {
      const res = await checkOut(employerAddress, workerAddress);
      if (res.success) {
        setWorkerState((prev) =>
          prev
            ? {
                ...prev,
                claimableBalance: res.remainingClaimableTL,
                debtTL: res.remainingDebtTL,
              }
            : null
        );
        setActionMessage(
          `Vardiya Tamamlandı! Kazanılan: ₺${res.earnedTL}, Mahsup Edilen Borç: ₺${res.deductedDebtTL}`
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Çıkış işlemi başarısız oldu.';
      setActionMessage(`Hata: ${msg}`);
    } finally {
      setCheckOutLoading(false);
    }
  };

  // SEP-24 Fast TL Çekilme İşlemi
  const handleOfframp = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMessage(null);
    const amountNum = parseFloat(offrampAmount);

    if (!iban || iban.trim().length < 10) {
      setActionMessage('Lütfen geçerli bir IBAN giriniz.');
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      setActionMessage('Lütfen geçerli bir çekim tutarı giriniz.');
      return;
    }
    if (workerState && amountNum > workerState.claimableBalance) {
      setActionMessage('Çekilmek istenen tutar kullanılabilir bakiyeden fazla olamaz.');
      return;
    }

    try {
      setOfframpLoading(true);
      const { offrampUrl } = await getAnchorOfframpUrl(iban, amountNum);
      setActionMessage(`FAST Talebi Oluşturuldu! Anchor linkine yönlendiriliyorsunuz...`);
      window.open(offrampUrl, '_blank');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'FAST çekim bağlantısı oluşturulamadı.';
      setActionMessage(`Hata: ${msg}`);
    } finally {
      setOfframpLoading(false);
    }
  };

  const hasDebt = (workerState?.debtTL ?? 0) > 0;
  const dailyLimit = workerState?.dailyLimitTL ?? 800;
  const spentToday = workerState?.spentTodayTL ?? 150;
  const remainingToday = Math.max(0, dailyLimit - spentToday);
  const spentPercentage = Math.min(100, Math.round((spentToday / dailyLimit) * 100));

  return (
    <div className="min-h-screen w-full bg-[#0b0f19] text-slate-100 flex flex-col font-sans pb-12">
      {/* Üst Bar */}
      <header className="sticky top-0 z-40 w-full px-4 sm:px-6 py-4 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/80 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight leading-none">
              ShiftPay
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-1">Çalışan Paneli</p>
          </div>
        </div>

        {/* Cüzdan Durumu */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/90 border border-slate-700/60 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono text-slate-300 font-medium hidden sm:inline">
            {workerAddress.substring(0, 6)}...{workerAddress.slice(-4)}
          </span>
          <span className="text-xs font-semibold text-emerald-400 sm:hidden">Bağlı</span>
        </div>
      </header>

      {/* Ana Mobil İletişim & İşlemler Konteyneri */}
      <main className="flex-1 max-w-lg w-full mx-auto px-4 pt-6 space-y-5">

        {/* Bildirim / İşlem Mesajı */}
        {actionMessage && (
          <div className="p-4 rounded-2xl bg-slate-900 border border-cyan-500/30 text-cyan-300 text-xs sm:text-sm flex items-start justify-between shadow-lg animate-fade-in">
            <span>{actionMessage}</span>
            <button
              onClick={() => setActionMessage(null)}
              className="text-slate-400 hover:text-white ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Borç Uyarısı & Borç Kapat Butonu Kartı (Sadece borç varsa görünür) */}
        {hasDebt && (
          <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-red-950/50 border border-amber-500/50 text-amber-200 shadow-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400/80">Mevcut Borç</h4>
                <p className="text-xl font-black text-amber-200 mt-0.5">
                  ₺{workerState?.debtTL.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsDepositModalOpen(true)}
              className="shrink-0 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-950/60 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Borç Kapat
            </button>
          </div>
        )}

        {/* Bakiye Kartı */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>KİLİTLİ HAKEDİŞ BAKİYESİ</span>
            {workerState?.isVested ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px]">
                Vadesi Doldu (Kullanılabilir)
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px]">
                Kilitli Süreçte
              </span>
            )}
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {loading
                ? '...'
                : `₺${workerState?.claimableBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`}
            </span>
            <span className="text-xs font-semibold text-slate-400">TL</span>
          </div>
        </div>

        {/* GÜNLÜK HARCAMA LİMİTİ (Daily Spending Cap) Kartı */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Günlük Harcama Limiti</h3>
                <p className="text-sm font-extrabold text-white mt-0.5">
                  Bugün Harcanabilir: <span className="text-purple-400">₺{remainingToday.toLocaleString('tr-TR')}</span> / ₺{dailyLimit}
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full">
              %{spentPercentage} Dolu
            </span>
          </div>

          {/* İlerleme Çubuğu (Progress Bar) */}
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                spentPercentage >= 100
                  ? 'bg-red-500'
                  : spentPercentage >= 80
                  ? 'bg-amber-500'
                  : 'bg-gradient-to-r from-purple-500 to-indigo-500'
              }`}
              style={{ width: `${spentPercentage}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] text-slate-500 font-medium pt-0.5">
            <span>Harcanan: ₺{spentToday}</span>
            <span>Kalan Limit: ₺{remainingToday}</span>
          </div>
        </div>

        {/* QR İşlemleri Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* İşe Giriş (Check-In) QR */}
          <button
            onClick={() => {
              setQrMode('checkin');
              setIsQRModalOpen(true);
            }}
            className="group relative p-5 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 text-left transition-all duration-200 shadow-xl flex flex-col justify-between h-36"
          >
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                İşe Giriş (Check-In)
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">QR tarayarak başla</p>
            </div>
          </button>

          {/* Esnafta Harca QR */}
          <button
            onClick={() => {
              setQrMode('merchant');
              setIsQRModalOpen(true);
            }}
            className="group relative p-5 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-purple-500/40 text-left transition-all duration-200 shadow-xl flex flex-col justify-between h-36"
          >
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">
                Esnafta Harca
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Anında QR ödeme yap</p>
            </div>
          </button>
        </div>

        {/* Vardiyayı Bitir (Check-Out) Butonu */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Vardiya Durumu</h3>
              <p className="text-xs text-slate-400">İşten çıkış yaparak günlük hakedişinizi işleyin.</p>
            </div>
          </div>

          <button
            onClick={handleCheckOut}
            disabled={checkOutLoading}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-lg shadow-blue-950/50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {checkOutLoading ? (
              <span>İşleniyor...</span>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Vardiyayı Bitir / İşten Çık (Check-Out)</span>
              </>
            )}
          </button>
        </div>

        {/* IBAN FAST ile TL Çek (SEP-24 Entegrasyonu) */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">IBAN'a FAST ile TL Çek (SEP-24)</h3>
              <p className="text-[11px] text-slate-400">Vadesi dolan hakedişi banka hesabına aktar</p>
            </div>
          </div>

          <form onSubmit={handleOfframp} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">IBAN Numarası</label>
              <input
                type="text"
                required
                disabled={offrampLoading}
                value={iban}
                onChange={(e) => setIban(e.target.value)}
                placeholder="TR00 0000 0000 0000 0000 0000 00"
                className="w-full rounded-2xl bg-slate-950/70 border border-slate-800 py-3 px-4 text-xs font-mono text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Çekilecek Tutar (TL)</label>
              <input
                type="number"
                min="1"
                step="any"
                required
                disabled={offrampLoading}
                value={offrampAmount}
                onChange={(e) => setOfframpAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-2xl bg-slate-950/70 border border-slate-800 py-3 px-4 text-sm font-semibold text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={offrampLoading}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-sm shadow-lg shadow-emerald-950/50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {offrampLoading ? (
                <span>Bağlantı Hazırlanıyor...</span>
              ) : (
                <>
                  <span>FAST İle Çekim Yap (SEP-24)</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

      </main>

      {/* Deposit / Borç Ödeme Modal */}
      {workerState && (
        <DepositModal
          isOpen={isDepositModalOpen}
          onClose={() => setIsDepositModalOpen(false)}
          workerAddress={workerAddress}
          currentDebtTL={workerState.debtTL}
          onSuccess={(newClaimable, newDebt) => {
            setWorkerState((prev) =>
              prev
                ? {
                    ...prev,
                    claimableBalance: newClaimable,
                    debtTL: newDebt,
                  }
                : null
            );
            setActionMessage('Borç ödeme işlemi başarıyla tamamlandı.');
          }}
        />
      )}

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        mode={qrMode}
        workerAddress={workerAddress}
        dailyLimitTL={dailyLimit}
        spentTodayTL={spentToday}
        onSuccess={(msg, updated) => {
          setActionMessage(msg);
          setWorkerState((prev) =>
            prev
              ? {
                  ...prev,
                  claimableBalance: updated?.claimable !== undefined ? updated.claimable : prev.claimableBalance,
                  spentTodayTL: updated?.spentToday !== undefined ? updated.spentToday : prev.spentTodayTL,
                }
              : null
          );
        }}
      />
    </div>
  );
}
