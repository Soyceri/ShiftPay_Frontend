'use client';

import React, { useState, useEffect } from 'react';
import { X, CreditCard, AlertCircle } from 'lucide-react';
import { depositTL } from '@/services/shiftpay';

export interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  workerAddress: string;
  currentDebtTL: number;
  onSuccess: (newClaimable: number, newDebt: number) => void;
}

export default function DepositModal({
  isOpen,
  onClose,
  workerAddress,
  currentDebtTL,
  onSuccess,
}: DepositModalProps) {
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Modal açıldığında varsayılan olarak borcun tamamını veya boş tutarı getir
  useEffect(() => {
    if (isOpen) {
      setAmount(currentDebtTL > 0 ? currentDebtTL.toString() : '');
      setError(null);
    }
  }, [isOpen, currentDebtTL]);

  if (!isOpen) return null;

  const handlePayDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Lütfen geçerli bir ödeme tutarı giriniz.');
      return;
    }

    if (numAmount > currentDebtTL) {
      setError(`Ödenecek tutar mevcut borcunuzdan (₺${currentDebtTL.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}) fazla olamaz.`);
      return;
    }

    try {
      setLoading(true);
      const res = await depositTL(workerAddress, numAmount);
      if (res.success) {
        onSuccess(res.newClaimableBalance, res.newDebtTL);
        onClose();
      } else {
        setError(res.message || 'Borç ödeme işlemi başarısız oldu.');
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Bir hata oluştu.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSetFullDebt = () => {
    setAmount(currentDebtTL.toString());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 backdrop-blur-xl">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-inner">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-white">
                Borç Ödeme / Kapatma
              </h3>
              <p className="text-xs text-slate-400 font-medium">Esnek ödeme yöntemi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/60 hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handlePayDebt} className="mt-5 space-y-4">
          
          {/* Debt Summary Box */}
          <div className="p-4 bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/20 border border-amber-500/30 rounded-2xl flex items-center justify-between text-amber-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400/80">Güncel Toplam Borç</span>
                <p className="text-xl font-black text-amber-300 mt-0.5">
                  ₺{currentDebtTL.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSetFullDebt}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-extrabold text-xs transition-all active:scale-95 cursor-pointer"
            >
              Tamamını Seç
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label htmlFor="amountTL" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Yatırılacak Ödeme Tutarı (TL)
            </label>
            <div className="relative rounded-2xl">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <span className="text-cyan-400 font-black text-lg">₺</span>
              </div>
              <input
                type="number"
                id="amountTL"
                min="0.01"
                max={currentDebtTL}
                step="any"
                required
                disabled={loading}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-2xl bg-slate-950/80 border border-slate-800 py-3.5 pl-10 pr-4 text-slate-100 placeholder-slate-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 text-lg font-bold disabled:opacity-50 transition-colors"
              />
            </div>
            
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              💡 Toplam borcunuzun tamamını veya dilediğiniz tutarda kısmi ödeme yapabilirsiniz. Kısmi ödemede kalan tutar ekranda güncel olarak saklanacaktır.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs font-medium text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-1/3 py-3.5 px-4 rounded-2xl border border-slate-800 bg-slate-800/60 hover:bg-slate-800 text-slate-300 font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={loading || !amount || parseFloat(amount) <= 0}
              className="w-2/3 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black text-xs shadow-lg shadow-amber-950/50 transition-all disabled:opacity-40 flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
            >
              {loading ? (
                <span>İşlem Yapılıyor...</span>
              ) : (
                <span>Borç Kapat / Öde</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

