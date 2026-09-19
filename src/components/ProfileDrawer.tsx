'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Wallet,
  Copy,
  Check,
  Building2,
  TrendingUp,
  CreditCard,
  ArrowDownRight,
  LogOut,
  ShieldCheck,
  Zap,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { getAnchorOfframpUrl } from '@/services/shiftpay';

export interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  workerAddress: string;
  claimableBalance?: number;
  isMatured?: boolean;
  onLogout?: () => void;
}

export default function ProfileDrawer({
  isOpen,
  onClose,
  workerAddress,
  claimableBalance = 0,
  isMatured = false,
  onLogout,
}: ProfileDrawerProps) {
  const [copied, setCopied] = useState<boolean>(false);
  const [iban, setIban] = useState<string>('');
  const [savedIban, setSavedIban] = useState<string>('');
  const [ibanSavedMsg, setIbanSavedMsg] = useState<string | null>(null);

  // FAST Çekim State'leri
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawLoading, setWithdrawLoading] = useState<boolean>(false);
  const [withdrawMsg, setWithdrawMsg] = useState<string | null>(null);

  // Yerel hafızadan kaydedilmiş IBAN'ı yükle
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedIban = localStorage.getItem('shiftpay_user_iban');
      if (storedIban && storedIban.trim().length > 0) {
        setIban(storedIban);
        setSavedIban(storedIban);
      } else {
        setIban('');
        setSavedIban('');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyWallet = () => {
    navigator.clipboard.writeText(workerAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveIban = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanIban = iban.trim();

    if (!cleanIban || cleanIban.length < 10) {
      setIbanSavedMsg('Lütfen geçerli bir IBAN adresi giriniz.');
      return;
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('shiftpay_user_iban', cleanIban);
    }
    setSavedIban(cleanIban);
    setIbanSavedMsg('IBAN adresiniz başarıyla kaydedildi!');
    setTimeout(() => setIbanSavedMsg(null), 3000);
  };

  const handleFastWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawMsg(null);
    const amountNum = parseFloat(withdrawAmount);

    if (!savedIban) {
      setWithdrawMsg('Lütfen öncelikle geçerli bir IBAN kaydedin.');
      return;
    }
    if (!isMatured) {
      setWithdrawMsg('FAST çekim yapabilmek için bakiyenizin vadesinin dolmuş olması gerekir.');
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      setWithdrawMsg('Lütfen geçerli bir çekim tutarı giriniz.');
      return;
    }
    if (amountNum > claimableBalance) {
      setWithdrawMsg('Çekilmek istenen tutar kullanılabilir bakiyeden fazla olamaz.');
      return;
    }

    try {
      setWithdrawLoading(true);
      const { offrampUrl } = await getAnchorOfframpUrl(savedIban, amountNum);
      setWithdrawMsg('FAST Talebi Oluşturuldu! Anchor portalına yönlendiriliyorsunuz...');
      window.open(offrampUrl, '_blank');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'FAST çekim işlemi başlatılamadı.';
      setWithdrawMsg(`Hata: ${msg}`);
    } finally {
      setWithdrawLoading(false);
    }
  };

  const hasSavedIban = savedIban.trim().length > 0;
  const canWithdraw = hasSavedIban && isMatured && claimableBalance > 0;

  const truncatedAddress =
    workerAddress.length > 12
      ? `${workerAddress.substring(0, 6)}...${workerAddress.slice(-4)}`
      : workerAddress;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Yumuşak Cam Efektli Arka Plan (Backdrop Overlay) */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300 animate-fade-in"
      />

      {/* Sağdan Sola Açılan Paneli (Slide-Over Right to Left) */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-sm bg-slate-900/95 backdrop-blur-xl border-l border-slate-800/80 text-slate-100 flex flex-col justify-between shadow-2xl overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden transform transition-transform duration-300 ease-out">
          
          {/* Drawer Header */}
          <div className="p-6 border-b border-slate-800/80 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-xl z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <User className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-white tracking-tight">Profil & Ayarlar</h2>
                <p className="text-[11px] text-slate-400 font-medium">ShiftPay FinTech Portalı</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/50 hover:bg-slate-800 transition-colors"
              aria-label="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-5 flex-1">
            
            {/* Kullanıcı Bilgileri Kartı */}
            <div className="relative overflow-hidden p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-xl space-y-3">
              <div className="absolute top-0 right-0 -mt-6 -mr-6 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />
              
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20">
                  <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center text-white font-black text-base">
                    MS
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight leading-tight">Mina Soyçeri</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">mina.soyceri@shiftpay.io</p>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-slate-800/80">
                <span className="text-xs text-slate-400 font-medium">Hesap Durumu</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Doğrulanmış İşçi
                </span>
              </div>
            </div>

            {/* Stellar / Soroban Cüzdan Kartı */}
            <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <Wallet className="w-4 h-4 text-cyan-400" />
                  <span>Stellar Cüzdan Adresi</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-semibold border border-cyan-500/20">
                  Soroban
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-200">
                <span className="font-medium text-slate-300">{truncatedAddress}</span>
                <button
                  onClick={handleCopyWallet}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1 text-[11px] font-sans active:scale-95 cursor-pointer"
                  title="Cüzdan Adresini Kopyala"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Kopyalandı</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="font-semibold">Kopyala</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Dinamik IBAN Kayıt & Güncelleme Kartı */}
            <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3.5 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span>Banka IBAN Adresi</span>
                </div>
                {hasSavedIban && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-extrabold border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    IBAN Kayıtlı (FAST Aktif)
                  </span>
                )}
              </div>

              <form onSubmit={handleSaveIban} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    FAST İle Çekim Yapılacak IBAN
                  </label>
                  <input
                    type="text"
                    required
                    value={iban}
                    onChange={(e) => setIban(e.target.value)}
                    placeholder="TR00 0000 0000 0000 0000 0000 00"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl py-3 px-3.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                </div>

                {!hasSavedIban && (
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-300 font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>Henüz kayıtlı bir IBAN bulunmuyor</span>
                  </div>
                )}

                {ibanSavedMsg && (
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-400 font-semibold animate-fade-in">
                    {ibanSavedMsg}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/50 flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
                >
                  <span>{hasSavedIban ? 'Güncelle' : 'Kaydet'}</span>
                </button>
              </form>
            </div>

            {/* FAST Çekim Alanı & Kısıtlar */}
            <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3.5 shadow-xl">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>IBAN'a FAST ile TL Çek (SEP-24)</span>
              </div>

              <form onSubmit={handleFastWithdraw} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Çekilecek Tutar (TL)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    disabled={!canWithdraw || withdrawLoading}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl py-2.5 px-3.5 text-xs font-semibold text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                  />
                </div>

                {/* Kısıt/Uyarı Mesajı */}
                {!canWithdraw && (
                  <div className="p-3 bg-slate-950/90 border border-amber-500/30 rounded-2xl text-[11px] text-amber-300 font-medium flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                    <div>
                      {!hasSavedIban ? (
                        <span>FAST çekim yapmak için lütfen yukarıdaki alana bir IBAN kaydedin.</span>
                      ) : claimableBalance <= 0 ? (
                        <span>FAST çekim yapmak için kullanıma uygun hakediş bakiyeniz bulunmalıdır.</span>
                      ) : !isMatured ? (
                        <span>FAST çekim yapmak için bakiyenizin vadesinin dolmuş olması gerekir.</span>
                      ) : null}
                    </div>
                  </div>
                )}

                {withdrawMsg && (
                  <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-[11px] text-cyan-300 font-semibold animate-fade-in">
                    {withdrawMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!canWithdraw || withdrawLoading}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/50 flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-40 cursor-pointer"
                >
                  {withdrawLoading ? (
                    <span>Bağlantı Hazırlanıyor...</span>
                  ) : (
                    <>
                      <span>FAST İle Çekim Yap</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

          </div>

          {/* Drawer Footer / Oturumu Kapat */}
          <div className="p-6 border-t border-slate-800/80 bg-slate-950/80 sticky bottom-0 z-10">
            <button
              onClick={() => {
                onClose();
                if (onLogout) onLogout();
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 font-extrabold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-950/30 active:scale-[0.98] cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Çıkış Yap / Oturumu Kapat</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
