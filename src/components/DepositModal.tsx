'use client';

import React, { useState, useEffect } from 'react';
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

  // Modal açıldığında güncel borç tutarını varsayılan olarak getir
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
      setError(`Ödenecek tutar mevcut borcunuzdan (₺${currentDebtTL.toLocaleString('tr-TR')}) fazla olamaz.`);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md transition-opacity">
      <div className="relative w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 backdrop-blur-md">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white">
              Borç Öde / Kapat
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800/60 transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Kapat"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handlePayDebt} className="mt-5 space-y-4">
          {/* Debt Summary Box */}
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between text-amber-200">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <span className="text-xs text-amber-300/80 font-medium">Güncel Toplam Borç</span>
                <p className="text-lg font-bold text-amber-300">
                  ₺{currentDebtTL.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label htmlFor="amountTL" className="block text-sm font-medium text-slate-300 mb-2">
              Ödenecek Tutar (TL)
            </label>
            <div className="relative rounded-2xl shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <span className="text-slate-400 font-bold">₺</span>
              </div>
              <input
                type="number"
                id="amountTL"
                min="1"
                max={currentDebtTL}
                step="any"
                required
                disabled={loading}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-2xl bg-slate-950/70 border border-slate-800 py-3.5 pl-9 pr-4 text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 text-lg font-medium disabled:opacity-50 transition-colors"
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">
              * Toplam borcunuzun tamamını veya istediğiniz tutarda kısmi ödeme gerçekleştirebilirsiniz. Kalan borç bakiyeniz sistemde takip edilmeye devam edecektir.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-1/3 py-3.5 px-4 rounded-2xl border border-slate-800 bg-slate-800/50 hover:bg-slate-800 text-slate-300 font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-2/3 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-bold shadow-lg shadow-amber-950/50 transition-all disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
            >
              {loading ? (
                <span>Ödeniyor...</span>
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
