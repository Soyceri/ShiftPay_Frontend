'use client';

import React from 'react';
import { Wallet, ArrowUpRight, Clock, DollarSign, LogOut } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = usePrivy();

  const handleLogout = async () => {
    try {
      if (typeof logout === 'function') {
        await logout();
      }
    } catch (e) {
      console.warn(e);
    }
    router.push('/');
  };

  const userEmail = user?.email?.address || user?.google?.email || 'demo@shiftpay.io';

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col">
      {/* Üst Bar */}
      <header className="w-full px-6 py-4 flex items-center justify-between bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">ShiftPay</h1>
            <p className="text-xs text-slate-400">Çalışan Paneli</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors"
        >
          <LogOut className="w-4 h-4 text-slate-400" />
          <span>Çıkış</span>
        </button>
      </header>

      {/* Ana İçerik */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 flex flex-col gap-6">
        {/* Karşılama Kartı */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-900/40 via-slate-900/60 to-slate-900/90 shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xs font-semibold text-blue-400 tracking-wide uppercase">Hoş Geldiniz</span>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-0.5">{userEmail}</h2>
            <p className="text-xs text-slate-400 mt-1">Stellar Testnet Cüzdanı Aktif</p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Oturum Aktif</span>
          </div>
        </div>

        {/* Hızlı İstatistikler */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 flex flex-col gap-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Kullanılabilir Bakiye</span>
              <DollarSign className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-2xl font-bold text-white">4.850 ₺</span>
            <span className="text-[11px] text-emerald-400">+120 XLM (Stellar)</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 flex flex-col gap-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Tamamlanan Vardiya</span>
              <Clock className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="text-2xl font-bold text-white">18 Vardiya</span>
            <span className="text-[11px] text-slate-400">Bu ay toplam 144 saat</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 flex flex-col gap-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Anlık Avans Durumu</span>
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-2xl font-bold text-white">Talep Edilebilir</span>
            <span className="text-[11px] text-slate-400">Tek tıkla hesaba aktar</span>
          </div>
        </div>
      </main>
    </div>
  );
}
