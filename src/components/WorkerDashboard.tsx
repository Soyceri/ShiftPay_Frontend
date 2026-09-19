'use client';

import React, { useState, useEffect } from 'react';
import { Menu, Zap, QrCode, ArrowRight, ShieldCheck, Info } from 'lucide-react';
import {
  getWorkerState,
  checkIn,
  spendAtMerchant,
  checkOut,
  getAnchorOfframpUrl,
  WorkerState,
} from '@/services/shiftpay';
import DepositModal from '@/components/DepositModal';
import QRScannerModal, { ScanType } from '@/components/QRScannerModal';
import ProfileDrawer from '@/components/ProfileDrawer';
import MerchantPaymentModal from '@/components/MerchantPaymentModal';

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

  // QR Modal State
  const [isQRModalOpen, setIsQRModalOpen] = useState<boolean>(false);

  // Drawers & Other Modals
  const [isDepositModalOpen, setIsDepositModalOpen] = useState<boolean>(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState<boolean>(false);

  // Merchant Payment Confirmation Modal State
  const [isMerchantModalOpen, setIsMerchantModalOpen] = useState<boolean>(false);
  const [pendingMerchant, setPendingMerchant] = useState<{
    address: string;
    name: string;
    amountTL: number;
  }>({
    address: 'GMERCHANT...KAFE777',
    name: 'Simit & Kahve Durağı',
    amountTL: 120,
  });

  // SEP-24 FAST Off-ramp state
  const [iban, setIban] = useState<string>('');
  const [offrampAmount, setOfframpAmount] = useState<string>('0');
  const [offrampLoading, setOfframpLoading] = useState<boolean>(false);

  // Sayfa yüklendiğinde canlı sıfır verisini çek
  const fetchWorkerData = async () => {
    setLoading(true);
    try {
      const state = await getWorkerState(workerAddress);
      setWorkerState(state);
      if (typeof window !== 'undefined') {
        const savedIban = localStorage.getItem('shiftpay_user_iban');
        if (savedIban) setIban(savedIban);
      }
    } catch (err) {
      console.error('İşçi verisi alınamadı:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkerData();
  }, [workerAddress]);

  // QR Taraması Başarıyla Gerçekleştiğinde (Otomatik Algılama & Yönlendirme)
  const handleScanSuccess = async (decodedData: string, detectedType: ScanType) => {
    setActionMessage(null);

    try {
      if (detectedType === 'CHECK_IN') {
        let shiftId = 'SHIFT-101';
        try {
          const parsed = JSON.parse(decodedData);
          if (parsed.shiftId) shiftId = parsed.shiftId;
        } catch {
          shiftId = decodedData;
        }

        const res = await checkIn(workerAddress, shiftId);
        if (res.success) {
          setActionMessage(`⚡ ${res.message} (Vardiya ID: ${shiftId})`);
        } else {
          setActionMessage(`Check-In Hatası: ${res.message}`);
        }
      } else if (detectedType === 'MERCHANT_PAYMENT') {
        let merchantAddress = 'GMERCHANT...KAFE777';
        let merchantName = 'Simit & Kahve Durağı';
        let amountTL = 120;

        try {
          const parsed = JSON.parse(decodedData);
          if (parsed.merchantAddress) merchantAddress = parsed.merchantAddress;
          if (parsed.merchantName) merchantName = parsed.merchantName;
          if (parsed.amountTL) amountTL = parseFloat(parsed.amountTL);
        } catch {
          // varsayılan değerler
        }

        setPendingMerchant({
          address: merchantAddress,
          name: merchantName,
          amountTL: amountTL || 120,
        });
        setIsMerchantModalOpen(true);

      } else if (detectedType === 'CHECK_OUT') {
        const res = await checkOut(employerAddress, workerAddress);
        if (res.success) {
          setWorkerState((prev) =>
            prev
              ? {
                  ...prev,
                  claimableBalance: res.remainingClaimableTL,
                  debtTL: res.remainingDebtTL,
                  isVested: true,
                  isMatured: true,
                }
              : null
          );
          setActionMessage(
            `🎉 Vardiya Tamamlandı! Kazanılan: ₺${res.earnedTL}, Mahsup Edilen Borç: ₺${res.deductedDebtTL}`
          );
        } else {
          setActionMessage(`Çıkış Hatası: ${res.message}`);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'İşlem başarısız.';
      setActionMessage(`Hata: ${msg}`);
    }
  };

  const handleConfirmMerchantPayment = async (amountTL: number) => {
    setActionMessage(null);
    const res = await spendAtMerchant(workerAddress, pendingMerchant.address, amountTL);

    if (res.success) {
      setActionMessage(`🛒 Ödeme Başarılı! ${pendingMerchant.name} mağazasında ₺${amountTL} harcandı.`);
      setWorkerState((prev) =>
        prev
          ? {
              ...prev,
              claimableBalance: res.remainingClaimableTL ?? prev.claimableBalance,
              spentTodayTL: res.spentTodayTL ?? prev.spentTodayTL,
            }
          : null
      );
    } else {
      setActionMessage(`Ödeme Hatası: ${res.message}`);
    }
  };

  const handleOfframp = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMessage(null);
    const amountNum = parseFloat(offrampAmount);

    const savedIban = typeof window !== 'undefined' ? localStorage.getItem('shiftpay_user_iban') : iban;
    const activeIban = savedIban || iban;

    if (!activeIban || activeIban.trim().length < 10) {
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
      const { offrampUrl } = await getAnchorOfframpUrl(activeIban, amountNum);
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
  const spentToday = workerState?.spentTodayTL ?? 0;
  const remainingToday = Math.max(0, dailyLimit - spentToday);
  const spentPercentage = Math.min(100, Math.round((spentToday / dailyLimit) * 100));
  const claimableBalance = workerState?.claimableBalance ?? 0;
  const isMatured = workerState?.isMatured ?? false;

  return (
    <div className="min-h-screen w-full bg-[#0b0f19] text-slate-100 flex flex-col font-sans pb-12">
      
      {/* Mobil Header: Sol üstte ⚡ ShiftPay logosu, Sağ üstte Profil Menü Butonu */}
      <header className="sticky top-0 z-30 w-full px-4 sm:px-6 py-4 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="relative group flex items-center justify-center">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur-md opacity-70 group-hover:opacity-100 transition-opacity" />
            <div className="relative w-9 h-9 rounded-xl bg-slate-950 p-[1px] border border-cyan-400/30 flex items-center justify-center">
              <div className="w-full h-full rounded-[10px] bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white fill-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
              </div>
            </div>
          </div>
          
          <div className="flex items-center">
            <span className="text-xl font-black text-white tracking-tight">S</span>
            <span className="text-xl font-bold bg-gradient-to-r from-slate-100 via-slate-200 to-cyan-300 bg-clip-text text-transparent tracking-tight">
              hiftPay
            </span>
          </div>
        </div>

        {/* Sağ Üst Profil Butonu */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsProfileDrawerOpen(true)}
            className="group flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 shadow-md transition-all active:scale-95 cursor-pointer"
            aria-label="Profil ve Ayarları Aç"
          >
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              MS
            </div>
            <Menu className="w-4 h-4 text-slate-300 group-hover:text-cyan-400 transition-colors" />
          </button>
        </div>
      </header>

      {/* Ana Mobil İçerik Konteyneri */}
      <main className="flex-1 max-w-lg w-full mx-auto px-4 pt-6 space-y-5">

        {/* Bildirim Mesajı */}
        {actionMessage && (
          <div className="p-4 rounded-2xl bg-slate-900 border border-cyan-500/40 text-cyan-300 text-xs sm:text-sm flex items-start justify-between shadow-xl animate-fade-in">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
              <span>{actionMessage}</span>
            </div>
            <button
              onClick={() => setActionMessage(null)}
              className="text-slate-400 hover:text-white ml-2 shrink-0 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Borç Uyarısı Kartı (Sadece Borç Varsa Görünür) */}
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

        {/* Bakiye Kartı & Dinamik Vade Durumu */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>KİLİTLİ HAKEDİŞ BAKİYESİ</span>
            {/* Sadece bakiye > 0 ₺ olduğunda vade durumu rozetini göster */}
            {claimableBalance > 0 && (
              isMatured ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">
                  ✅ Vade Doldu — Hesabınıza FAST ile IBAN'a çekebilirsiniz.
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px] font-bold">
                  ⏳ Vade Dolmadı — Anlaşmalı yerlerde QR ile harcayabilirsiniz.
                </span>
              )
            )}
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {loading
                ? '...'
                : `₺${claimableBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`}
            </span>
            <span className="text-xs font-semibold text-slate-400">TL</span>
          </div>
        </div>

        {/* Bakiye 0,00 ₺ iken Görünür Minimalist Bilgilendirme Rozeti */}
        {claimableBalance <= 0 && (
          <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3 text-xs text-slate-400 shadow-md">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 shrink-0">
              <Info className="w-4 h-4" />
            </div>
            <span>
              Henüz aktif vardiya bulunmuyor. İşe giriş yapmak veya harcama yapmak için <strong>QR Okut</strong> butonunu kullanın.
            </span>
          </div>
        )}

        {/* GÜNLÜK HARCAMA LİMİTİ Kartı */}
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

        {/* Tek Evrensel 'QR Okut' Butonu Kartı (IBAN Kartının Hemen Üstünde) */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <button
            onClick={() => setIsQRModalOpen(true)}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm sm:text-base shadow-lg shadow-cyan-500/20 transform hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <QrCode className="w-6 h-6 text-white shrink-0" />
            <span>QR Okut (Alışveriş, İşe Giriş, İş Çıkış)</span>
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
              disabled={offrampLoading || claimableBalance <= 0 || !isMatured}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-sm shadow-lg shadow-emerald-950/50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {offrampLoading ? (
                <span>Bağlantı Hazırlanıyor...</span>
              ) : (
                <>
                  <span>FAST İle Çekim Yap (SEP-24)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

      </main>

      {/* Profile Drawer */}
      <ProfileDrawer
        isOpen={isProfileDrawerOpen}
        onClose={() => setIsProfileDrawerOpen(false)}
        workerAddress={workerAddress}
        claimableBalance={claimableBalance}
        isMatured={isMatured}
        onLogout={() => setActionMessage('Oturum kapatıldı.')}
      />

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

      {/* Esnaf Tutar Onay Modalı */}
      <MerchantPaymentModal
        isOpen={isMerchantModalOpen}
        onClose={() => setIsMerchantModalOpen(false)}
        merchantAddress={pendingMerchant.address}
        merchantName={pendingMerchant.name}
        scannedAmountTL={pendingMerchant.amountTL}
        dailyLimitTL={dailyLimit}
        spentTodayTL={spentToday}
        onConfirmPayment={handleConfirmMerchantPayment}
      />

      {/* QR Scanner Modal (Evrensel Kamera) */}
      <QRScannerModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
}
