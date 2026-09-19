'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Wallet,
  Copy,
  Check,
  Building2,
  LogOut,
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
  const [ibanInput, setIbanInput] = useState<string>('');
  const [savedIban, setSavedIban] = useState<string>('');
  const [ibanMsg, setIbanMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // FAST Çekim State'leri
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawLoading, setWithdrawLoading] = useState<boolean>(false);
  const [withdrawMsg, setWithdrawMsg] = useState<string | null>(null);

  // Panel açıldığında yerel hafızadan kaydedilmiş IBAN'ı yükle. Yoksa boş ("") getir.
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const storedIban = localStorage.getItem('shiftpay_user_iban');
      if (storedIban && storedIban.trim().length > 0) {
        setSavedIban(storedIban);
        setIbanInput(storedIban);
      } else {
        setSavedIban('');
        setIbanInput('');
      }
      setIbanMsg(null);
      setWithdrawMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyWallet = () => {
    if (!workerAddress) return;
    navigator.clipboard.writeText(workerAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveIban = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanIban = ibanInput.trim().toUpperCase();

    if (!cleanIban || cleanIban.length < 10) {
      setIbanMsg({ text: 'Lütfen geçerli bir IBAN adresi giriniz (ör. TR00...).', type: 'error' });
      return;
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('shiftpay_user_iban', cleanIban);
    }
    setSavedIban(cleanIban);
    setIbanMsg({ text: 'IBAN adresiniz başarıyla kaydedildi!', type: 'success' });
    setTimeout(() => setIbanMsg(null), 3000);
  };

  const handleFastWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawMsg(null);

    if (!hasSavedIban) {
      setWithdrawMsg('FAST çekim yapabilmek için öncelikle bir IBAN adresi kaydetmelisiniz.');
      return;
    }

    if (!isMatured) {
      setWithdrawMsg('FAST çekim imkanı vadeniz dolana kadar pasiftir.');
      return;
    }

    const amountNum = parseFloat(withdrawAmount);
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
      setWithdrawMsg('FAST Çekim Talebi Alındı! Portala yönlendiriliyorsunuz...');
      window.open(offrampUrl, '_blank');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'FAST çekim başlatılamadı.';
      setWithdrawMsg(`Hata: ${msg}`);
    } finally {
      setWithdrawLoading(false);
    }
  };

  const hasSavedIban = savedIban.trim().length > 0;
  // FAST çekim ancak IBAN kaydedilmişse VE isMatured === true VE bakiye > 0 ise aktiftir
  const isWithdrawAllowed = hasSavedIban && isMatured && claimableBalance > 0;

  const truncatedAddress =
    workerAddress && workerAddress.length > 14
      ? `${workerAddress.substring(0, 6)}...${workerAddress.slice(-6)}`
      : workerAddress || 'GCRX...SHIFTWORKER9999';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
      />

      {/* Slide-over Right Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-sm bg-slate-900 border-l border-slate-800 text-slate-100 flex flex-col justify-between shadow-2xl overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden transition-all duration-300">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-800/80 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-xl z-20">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-black text-white tracking-tight">Profil & Ayarlar</h2>
                <p className="text-[11px] text-slate-400 font-medium">ShiftPay FinTech Hesabı</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="p-5 space-y-5 flex-1">
            
            {/* Profil Özeti */}
            <div className="relative overflow-hidden p-5 rounded-3xl bg-slate-950/80 border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20">
                  <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center text-white font-black text-sm">
                    İS
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">ShiftPay İşçi Kullanıcısı</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">isci@shiftpay.io</p>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-slate-800/80">
                <span className="text-xs text-slate-400 font-medium">Hakedış Vade Durumu</span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold border ${
                  isMatured
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isMatured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  {isMatured ? 'Vade Doldu (Çekilebilir)' : 'Vade Bekleniyor'}
                </span>
              </div>
            </div>

            {/* Stellar / Soroban Cüzdan Adresi */}
            <div className="p-5 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <Wallet className="w-4 h-4 text-cyan-400" />
                  <span>Stellar/Soroban Cüzdanı</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-bold border border-cyan-500/20">
                  On-Chain
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-200">
                <span className="font-semibold text-slate-300">{truncatedAddress}</span>
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
                      <Copy className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="font-bold">Kopyala</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* IBAN Kaydet & Güncelle */}
            <div className="p-5 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-3.5 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span>Banka IBAN Numarası</span>
                </div>
                {hasSavedIban && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-extrabold border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Kayıtlı
                  </span>
                )}
              </div>

              <form onSubmit={handleSaveIban} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    FAST İle Çekim Yapılacak IBAN
                  </label>
                  <input
                    type="text"
                    required
                    value={ibanInput}
                    onChange={(e) => setIbanInput(e.target.value)}
                    placeholder="TR00 0000 0000 0000 0000 0000 00"
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 px-3.5 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors uppercase"
                  />
                </div>

                {!hasSavedIban && (
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-300 font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>Henüz kaydedilmiş bir IBAN bulunmuyor.</span>
                  </div>
                )}

                {ibanMsg && (
                  <div className={`p-2.5 border rounded-xl text-[11px] font-semibold ${
                    ibanMsg.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}>
                    {ibanMsg.text}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/50 flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
                >
                  <span>{hasSavedIban ? 'IBAN Adresini Güncelle' : 'IBAN Adresini Kaydet'}</span>
                </button>
              </form>
            </div>

            {/* FAST ile Çekim ve Kısıtlamalar */}
            <div className="p-5 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-3.5 shadow-xl">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>FAST Nakit Çekim (SEP-24)</span>
              </div>

              <form onSubmit={handleFastWithdraw} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Çekilecek Tutar (TL)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    disabled={!isWithdrawAllowed || withdrawLoading}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-2.5 px-3.5 text-xs font-bold text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-40"
                  />
                </div>

                {/* Kısıtlama Uyarısı */}
                {!isWithdrawAllowed && (
                  <div className="p-3 bg-slate-900 border border-amber-500/30 rounded-2xl text-[11px] text-amber-300 font-medium flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                    <div>
                      {!hasSavedIban ? (
                        <span>FAST nakit çekim için öncelikle bir IBAN adresi kaydetmelisiniz.</span>
                      ) : !isMatured ? (
                        <span>Hakediş vadesi dolmadığı sürece IBAN'a FAST çekim yapma imkanı pasiftir.</span>
                      ) : claimableBalance <= 0 ? (
                        <span>Çekim yapmak için kullanılabilir bakiyeniz bulunmalıdır.</span>
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
                  disabled={!isWithdrawAllowed || withdrawLoading}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/50 flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-40 cursor-pointer"
                >
                  {withdrawLoading ? (
                    <span>Talebiniz İşleniyor...</span>
                  ) : (
                    <>
                      <span>FAST İle Nakit Çek</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

          </div>

          {/* Drawer Footer - Oturumu Kapat */}
          <div className="p-5 border-t border-slate-800/80 bg-slate-950 sticky bottom-0 z-20">
            <button
              onClick={() => {
                onClose();
                if (onLogout) onLogout();
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 font-extrabold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-950/30 active:scale-[0.98] cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Oturumu Kapat</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

