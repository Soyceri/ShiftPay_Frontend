'use client';

import React, { useState, useEffect } from 'react';
import { Menu, QrCode, ArrowRight, ShieldCheck, AlertCircle, Building2, Zap } from 'lucide-react';
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
import ShiftPayLogo from '@/components/ShiftPayLogo';

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
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Modals & Drawers State
  const [isQRModalOpen, setIsQRModalOpen] = useState<boolean>(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState<boolean>(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState<boolean>(false);
  const [isMerchantModalOpen, setIsMerchantModalOpen] = useState<boolean>(false);

  // Merchant Pending State
  const [pendingMerchant, setPendingMerchant] = useState<{
    address: string;
    name: string;
    amountTL: number;
  }>({
    address: 'GMERCHANT...KAFE777',
    name: 'Simit & Kahve Durağı',
    amountTL: 120,
  });

  // IBAN & Offramp state
  const [iban, setIban] = useState<string>('');
  const [offrampAmount, setOfframpAmount] = useState<string>('');
  const [offrampLoading, setOfframpLoading] = useState<boolean>(false);

  // Canlı veriyi ve kayıtlı IBAN'ı yükle
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

  // QR Taraması Başarıyla Gerçekleştiğinde (Akıllı Algılama & Yönlendirme)
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
          setActionMessage({ text: `⚡ ${res.message} (Vardiya ID: ${shiftId})`, type: 'success' });
        } else {
          setActionMessage({ text: `Check-In Hatası: ${res.message}`, type: 'error' });
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
          setActionMessage({
            text: `🎉 Vardiya Tamamlandı! Kazanılan: ₺${res.earnedTL}, Mahsup Edilen Borç: ₺${res.deductedDebtTL}`,
            type: 'success',
          });
        } else {
          setActionMessage({ text: `Çıkış Hatası: ${res.message}`, type: 'error' });
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'İşlem başarısız.';
      setActionMessage({ text: `Hata: ${msg}`, type: 'error' });
    }
  };

  const handleConfirmMerchantPayment = async (amountTL: number) => {
    setActionMessage(null);
    const res = await spendAtMerchant(workerAddress, pendingMerchant.address, amountTL);

    if (res.success) {
      setActionMessage({
        text: `🛒 Ödeme Başarılı! ${pendingMerchant.name} mağazasında ₺${amountTL} harcandı.`,
        type: 'success',
      });
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
      setActionMessage({ text: `Ödeme Hatası: ${res.message}`, type: 'error' });
    }
  };

  const handleOfframp = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMessage(null);

    const savedIban = typeof window !== 'undefined' ? localStorage.getItem('shiftpay_user_iban') : iban;
    const activeIban = savedIban || iban;

    if (!activeIban || activeIban.trim().length < 10) {
      setActionMessage({ text: 'Lütfen profil panelinden veya buraya geçerli bir IBAN adresi giriniz.', type: 'error' });
      return;
    }

    if (!isMatured) {
      setActionMessage({ text: 'FAST nakit çekim işlemi için hakediş vadesinin dolmuş olması gerekmektedir.', type: 'error' });
      return;
    }

    const amountNum = parseFloat(offrampAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setActionMessage({ text: 'Lütfen geçerli bir çekim tutarı giriniz.', type: 'error' });
      return;
    }

    if (workerState && amountNum > workerState.claimableBalance) {
      setActionMessage({ text: 'Çekilmek istenen tutar kullanılabilir hakediş bakiyesinden fazla olamaz.', type: 'error' });
      return;
    }

    try {
      setOfframpLoading(true);
      const { offrampUrl } = await getAnchorOfframpUrl(activeIban, amountNum);
      setActionMessage({ text: 'FAST Talebi Oluşturuldu! Anchor portalına yönlendiriliyorsunuz...', type: 'info' });
      window.open(offrampUrl, '_blank');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'FAST çekim bağlantısı oluşturulamadı.';
      setActionMessage({ text: `Hata: ${msg}`, type: 'error' });
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
      
      {/* 1. Özel Logo & Header Tasarımı */}
      <header className="sticky top-0 z-30 w-full px-4 sm:px-6 py-3.5 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 flex items-center justify-between shadow-xl">
        {/* Sol Üst: Neon Parıltılı ShiftPay Logosu */}
        <ShiftPayLogo />

        {/* Sağ Üst: Sağdan Kayan Profil Panelini Açan Avatar / Hamburger İkonu */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsProfileDrawerOpen(true)}
            className="group flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 shadow-md transition-all active:scale-95 cursor-pointer"
            aria-label="Profil ve Ayarları Aç"
          >
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-xs shadow-sm">
              İS
            </div>
            <Menu className="w-4 h-4 text-slate-300 group-hover:text-cyan-400 transition-colors" />
          </button>
        </div>
      </header>

      {/* Ana Mobil İçerik Konteyneri */}
      <main className="flex-1 max-w-lg w-full mx-auto px-4 pt-6 space-y-5">

        {/* Bildirim / Sistem Mesajı */}
        {actionMessage && (
          <div className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-start justify-between shadow-xl animate-fade-in ${
            actionMessage.type === 'success'
              ? 'bg-slate-900 border-cyan-500/50 text-cyan-300'
              : actionMessage.type === 'error'
              ? 'bg-slate-900 border-red-500/50 text-red-400'
              : 'bg-slate-900 border-emerald-500/50 text-emerald-300'
          }`}>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <span>{actionMessage.text}</span>
            </div>
            <button
              onClick={() => setActionMessage(null)}
              className="text-slate-400 hover:text-white ml-2 shrink-0 font-black cursor-pointer"
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
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-400/80">Mevcut Borç</h4>
                <p className="text-xl font-black text-amber-200 mt-0.5">
                  ₺{workerState?.debtTL.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsDepositModalOpen(true)}
              className="shrink-0 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black text-xs shadow-lg shadow-amber-950/60 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              Borç Kapat
            </button>
          </div>
        )}

        {/* 3. Bakiye Kartı (Varsayılan 0,00 ₺) */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>HAKEDİŞ BAKİYESİ</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
              isMatured
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {isMatured ? 'Vade Doldu' : 'Bakiye'}
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {loading
                ? '...'
                : `₺${claimableBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`}
            </span>
            <span className="text-xs font-bold text-slate-400">TL</span>
          </div>
        </div>

        {/* 3. Ortada Tek 'QR Okut' Butonu (Bakiye Kartının Hemen Altında) */}
        <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-2">
          <button
            onClick={() => setIsQRModalOpen(true)}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-cyan-500/25 transform hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <QrCode className="w-6 h-6 text-white shrink-0 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            <span>QR Okut (Alışveriş, İşe Giriş, İş Çıkış)</span>
          </button>
          <p className="text-[11px] text-center text-slate-400 font-medium pt-1">
            Akıllı QR tarayıcı okunan koda göre işlemi otomatik gerçekleştirir.
          </p>
        </div>

        {/* 4. GÜNLÜK HARCAMA LİMİTİ Kartı */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Günlük Harcama Limiti</h3>
                <p className="text-sm font-extrabold text-white mt-0.5">
                  Kalan Limit: <span className="text-purple-400">₺{remainingToday.toLocaleString('tr-TR')}</span> / ₺{dailyLimit}
                </p>
              </div>
            </div>
            <span className="text-[11px] font-extrabold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full">
              %{spentPercentage} Kullanıldı
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

          <div className="flex justify-between text-[11px] text-slate-400 font-medium pt-0.5">
            <span>Harcanan: ₺{spentToday}</span>
            <span>Vardiya Hak Ediş Limiti: ₺{dailyLimit}</span>
          </div>
        </div>

        {/* 4 & 5. IBAN FAST ile TL Çek (SEP-24 Entegrasyonu - Vade Kontrollü) */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">IBAN'a FAST ile TL Çek (SEP-24)</h3>
              <p className="text-[11px] text-slate-400">Hakediş vadesi dolduğunda banka hesabına aktar</p>
            </div>
          </div>

          <form onSubmit={handleOfframp} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">IBAN Numarası</label>
              <input
                type="text"
                required
                disabled={offrampLoading}
                value={iban}
                onChange={(e) => setIban(e.target.value)}
                placeholder="TR00 0000 0000 0000 0000 0000 00"
                className="w-full rounded-2xl bg-slate-950/80 border border-slate-800 py-3 px-4 text-xs font-mono text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Çekilecek Tutar (TL)</label>
              <input
                type="number"
                min="1"
                step="any"
                required
                disabled={offrampLoading || !isMatured}
                value={offrampAmount}
                onChange={(e) => setOfframpAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-2xl bg-slate-950/80 border border-slate-800 py-3 px-4 text-sm font-bold text-slate-100 placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-40"
              />
            </div>

            {!isMatured && (
              <div className="p-2.5 bg-slate-950 border border-amber-500/30 rounded-xl text-[11px] text-amber-300 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Vade dolmadığı sürece IBAN'a FAST çekim yapma imkanı pasiftir.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={offrampLoading || claimableBalance <= 0 || !isMatured}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950/50 transition-all disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
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

      {/* 5. Sağ Profil Paneli */}
      <ProfileDrawer
        isOpen={isProfileDrawerOpen}
        onClose={() => setIsProfileDrawerOpen(false)}
        workerAddress={workerAddress}
        claimableBalance={claimableBalance}
        isMatured={isMatured}
        onLogout={() => setActionMessage({ text: 'Oturum kapatıldı.', type: 'info' })}
      />

      {/* Borç Ödeme Modalı */}
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
            setActionMessage({ text: 'Borç ödeme işlemi başarıyla gerçekleştirildi.', type: 'success' });
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

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
}


