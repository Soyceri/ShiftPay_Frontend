'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingBag, AlertCircle, X, CheckCircle2 } from 'lucide-react';

export interface MerchantPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  merchantAddress: string;
  merchantName: string;
  scannedAmountTL?: number;
  dailyLimitTL: number;
  spentTodayTL: number;
  onConfirmPayment: (amountTL: number) => Promise<void>;
}

export default function MerchantPaymentModal({
  isOpen,
  onClose,
  merchantAddress,
  merchantName,
  scannedAmountTL = 120,
  dailyLimitTL,
  spentTodayTL,
  onConfirmPayment,
}: MerchantPaymentModalProps) {
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAmount(scannedAmountTL > 0 ? scannedAmountTL.toString() : '120');
      setError(null);
    }
  }, [isOpen, scannedAmountTL]);

  if (!isOpen) return null;

  const remainingToday = Math.max(0, dailyLimitTL - spentTodayTL);
  const numAmount = parseFloat(amount) || 0;
  const isOverLimit = numAmount + spentTodayTL > dailyLimitTL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Lütfen geçerli bir ödeme tutarı giriniz.');
      return;
    }

    if (isOverLimit) {
      setError(`Bu ödeme ile günlük harcama limitinizi (₺${dailyLimitTL}) aşacaksınız! Kalan Limit: ₺${remainingToday}`);
      return;
    }

    try {
      setLoading(true);
      await onConfirmPayment(numAmount);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ödeme işlemi gerçekleştirilemedi.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md transition-all">
      <div className="relative w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100">
        
        {/* Kapat Butonu */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-5 right-5 p-2.5 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-700 transition-colors disabled:opacity-50"
          aria-label="Kapat"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Başlık */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-white">Esnaf Ödeme Onayı</h3>
            <p className="text-xs text-slate-400">Harcalabilir Bakiyenizden Anında Ödeme Yapın</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          
          {/* Esnaf Bilgileri Kartı */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-1.5">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Üye İşyeri</div>
            <div className="text-base font-black text-cyan-300">{merchantName || 'Esnaf Kafe / Mağaza'}</div>
            <div className="text-[11px] font-mono text-slate-500 truncate">{merchantAddress}</div>
          </div>

          {/* Günlük Harcama Limiti Bilgisi */}
          <div className="p-3.5 bg-purple-500/10 border border-purple-500/30 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-purple-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Bugün Kalan Limit:</span>
            </div>
            <span className="font-extrabold text-purple-200">₺{remainingToday.toLocaleString('tr-TR')}</span>
          </div>

          {/* Tutar Girişi */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Ödeme Tutarı (TL)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400 font-extrabold text-lg">₺</span>
              <input
                type="number"
                min="1"
                step="any"
                required
                disabled={loading}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-2xl bg-slate-950 border border-slate-800 py-3.5 pl-10 pr-4 text-xl font-black text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              />
            </div>
          </div>

          {/* Hata Uyarısı */}
          {error && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-300">
              {error}
            </div>
          )}

          {/* Butonlar */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-1/3 py-3.5 rounded-2xl border border-slate-800 bg-slate-800/50 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors disabled:opacity-50"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading || isOverLimit}
              className="w-2/3 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-xs font-extrabold shadow-lg shadow-cyan-950/50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Ödeme Yapılıyor...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Ödemeyi Onayla</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
