'use client';

import React, { useState } from 'react';
import { checkIn, spendAtMerchant } from '@/services/shiftpay';

export interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'checkin' | 'merchant';
  workerAddress: string;
  dailyLimitTL?: number;
  spentTodayTL?: number;
  onSuccess: (msg: string, updatedState?: { claimable?: number; spentToday?: number }) => void;
}

export default function QRScannerModal({
  isOpen,
  onClose,
  mode,
  workerAddress,
  dailyLimitTL = 800,
  spentTodayTL = 150,
  onSuccess,
}: QRScannerModalProps) {
  const [shiftOrMerchantId, setShiftOrMerchantId] = useState<string>('MOCK-QR-84920');
  const [amountTL, setAmountTL] = useState<string>('50');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const remainingLimit = Math.max(0, dailyLimitTL - spentTodayTL);
  const isCheckIn = mode === 'checkin';

  const handleScanAndAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isCheckIn) {
        const res = await checkIn(workerAddress, shiftOrMerchantId || 'SHIFT-101');
        if (res.success) {
          onSuccess(res.message);
          onClose();
        } else {
          setError(res.message);
        }
      } else {
        const numAmount = parseFloat(amountTL);
        if (isNaN(numAmount) || numAmount <= 0) {
          setError('Lütfen harcama için geçerli bir tutar girin.');
          setLoading(false);
          return;
        }

        if (numAmount + spentTodayTL > dailyLimitTL) {
          setError(`Günlük harcama limitinizi (${dailyLimitTL} TL) aştınız!`);
          setLoading(false);
          return;
        }

        const res = await spendAtMerchant(workerAddress, shiftOrMerchantId || 'MERCHANT-77', numAmount);
        if (res.success) {
          onSuccess(res.message, {
            claimable: res.remainingClaimableTL,
            spentToday: res.spentTodayTL,
          });
          onClose();
        } else {
          setError(res.message);
        }
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'İşlem sırasında hata oluştu.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-opacity">
      <div className="relative w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 backdrop-blur-md">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${isCheckIn ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white">
              {isCheckIn ? 'İşe Giriş (Check-In) QR' : 'Esnafta QR Ödeme'}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800/60 transition-colors disabled:opacity-50"
            aria-label="Kapat"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Limit Warning (Merchant mode only) */}
        {!isCheckIn && (
          <div className="mt-4 p-3.5 bg-purple-500/10 border border-purple-500/30 rounded-2xl flex items-center justify-between text-purple-200">
            <span className="text-xs font-medium text-purple-300">Kullanılabilir Günlük Harcama Limiti</span>
            <span className="text-sm font-bold text-purple-200">₺{remainingLimit.toLocaleString('tr-TR')} / ₺{dailyLimitTL}</span>
          </div>
        )}

        {/* QR Vizör Alanı (Simüle) */}
        <div className="mt-4 flex flex-col items-center">
          <div className="relative w-44 h-44 rounded-2xl border-2 border-dashed border-cyan-500/50 bg-slate-950/80 flex flex-col items-center justify-center p-4 overflow-hidden group">
            <div className="absolute inset-2 border border-cyan-400/30 rounded-xl pointer-events-none" />
            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-bounce my-auto" />
            <svg className="w-14 h-14 text-cyan-400/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-[11px] font-medium text-cyan-300/80 mt-2">Kamera QR Bekleniyor...</span>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleScanAndAction} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              {isCheckIn ? 'Vardiya / QR Kimliği' : 'Üye İşyeri QR Kimliği'}
            </label>
            <input
              type="text"
              required
              disabled={loading}
              value={shiftOrMerchantId}
              onChange={(e) => setShiftOrMerchantId(e.target.value)}
              className="w-full rounded-2xl bg-slate-950/70 border border-slate-800 py-3 px-4 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {!isCheckIn && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Ödenecek Tutar (TL)
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <span className="text-slate-400 font-bold text-sm">₺</span>
                </div>
                <input
                  type="number"
                  min="1"
                  max={remainingLimit}
                  step="any"
                  required
                  disabled={loading}
                  value={amountTL}
                  onChange={(e) => setAmountTL(e.target.value)}
                  className="w-full rounded-2xl bg-slate-950/70 border border-slate-800 py-3 pl-8 pr-4 text-slate-100 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 font-semibold"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 font-medium">
              {error}
            </div>
          )}

          <div className="pt-2 flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-1/3 py-3 px-4 rounded-2xl border border-slate-800 bg-slate-800/50 hover:bg-slate-800 text-slate-300 font-medium text-sm transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`w-2/3 py-3 px-4 rounded-2xl text-white font-semibold text-sm transition-all shadow-lg flex items-center justify-center space-x-2 ${
                isCheckIn
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-blue-950/50'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-purple-950/50'
              }`}
            >
              {loading ? (
                <span>İşleniyor...</span>
              ) : (
                <span>{isCheckIn ? 'Girişi Onayla' : 'Ödemeyi Tamamla'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
