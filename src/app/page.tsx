'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  LogIn,
  Wallet,
  ArrowUpRight,
  Clock,
  DollarSign,
  LogOut,
} from 'lucide-react';

// =============================================================================
// MOCK DASHBOARD — Privy'siz, anında render
// =============================================================================
function MockDashboard({ onLogout }: { onLogout: () => void }) {
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
          onClick={onLogout}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
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
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-0.5">Mina Soyçeri</h2>
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
              <span className="text-xs font-medium">Avans Limiti</span>
              <DollarSign className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-2xl font-bold text-white">3.500 ₺</span>
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

// =============================================================================
// HOŞ GELDİNİZ / GİRİŞ EKRANI — Sıfır network bağımlılığı
// =============================================================================
function WelcomeScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <main className="relative min-h-screen w-full bg-[#030712] text-slate-100 flex flex-col justify-center items-center p-4 sm:p-8 lg:p-16 overflow-hidden">
      {/* Yumuşak gradyan ışık halkaları */}
      <div className="absolute -top-48 -left-32 w-[36rem] h-[36rem] bg-blue-600/20 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-[38rem] h-[38rem] bg-indigo-600/15 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute -bottom-40 left-1/4 w-[40rem] h-[40rem] bg-cyan-500/10 rounded-full blur-[170px] pointer-events-none" />

      {/* Ana Kapsayıcı */}
      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-20 my-auto">

        {/* Sol Kolon: Logo, Başlık, Rozet ve Tanıtım */}
        <div className="w-full lg:max-w-xl flex flex-col items-center lg:items-start text-center lg:text-left">

          {/* Stellar & FinTech Temalı Modern Logo */}
          <div className="relative mb-6 flex items-center justify-center group">
            <div className="absolute -inset-2 bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 rounded-3xl blur-2xl opacity-75 group-hover:opacity-100 transition-all duration-500 animate-pulse" />

            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900/90 via-indigo-950/80 to-slate-900/90 p-[1.5px] shadow-[0_0_40px_rgba(59,130,246,0.4)] border border-cyan-400/20 flex items-center justify-center backdrop-blur-xl">
              <div className="w-full h-full rounded-[14px] sm:rounded-[22px] bg-gradient-to-br from-blue-600/20 via-indigo-600/30 to-cyan-500/20 flex items-center justify-center p-2.5">
                <svg
                  className="w-10 h-10 sm:w-12 sm:h-12 drop-shadow-[0_0_12px_rgba(56,189,248,0.75)]"
                  viewBox="0 0 64 64"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="spGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38BDF8" />
                      <stop offset="50%" stopColor="#818CF8" />
                      <stop offset="100%" stopColor="#C084FC" />
                    </linearGradient>
                    <linearGradient id="boltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#67E8F9" />
                      <stop offset="50%" stopColor="#38BDF8" />
                      <stop offset="100%" stopColor="#2563EB" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M26 12H13L9 28H19L15 44H28L32 28H22L26 12Z"
                    fill="url(#boltGrad)"
                    stroke="#E0F2FE"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M34 14H46C51.5 14 55 17.5 55 23C55 28.5 51.5 32 46 32H40V44H34V14ZM40 26H45C47.8 26 49.5 24.8 49.5 23C49.5 21.2 47.8 20 45 20H40V26Z"
                    fill="url(#spGrad)"
                    stroke="#E0F2FE"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M28 20L29.2 23.8L33 25L29.2 26.2L28 30L26.8 26.2L23 25L26.8 23.8L28 20Z"
                    fill="#FFFFFF"
                    opacity="0.9"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Rozet */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full bg-blue-500/10 text-xs sm:text-sm font-semibold text-blue-300">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>Stellar Tabanlı Anlık Hakediş Ekosistemi</span>
          </div>

          {/* Marka Adı + v1.0 Rozeti & Slogan */}
          <div className="flex items-center gap-3 justify-center lg:justify-start flex-wrap">
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
              ShiftPay
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.25)] backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              v1.0
            </span>
          </div>
          <p className="mt-4 text-base sm:text-xl text-slate-300 font-medium max-w-md leading-relaxed">
            Hak Ettiğin Kazanç, Anında Cebinde
          </p>

          {/* Avantaj Maddeleri */}
          <div className="hidden lg:flex flex-col gap-4 mt-8 text-sm text-slate-400">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <span>Vardiya biter bitmez otomatik hakediş tanımlama</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
              </div>
              <span>Stellar Ağı ve Privy ile gömülü güvenli cüzdan</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-cyan-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              </div>
              <span>Hızlı avans talepleri ve 7/24 anında nakit çekim</span>
            </div>
          </div>
        </div>

        {/* Sağ Kolon: Giriş Kartı */}
        <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-3xl rounded-[2rem] p-7 sm:p-9 shadow-2xl shadow-black/60 flex flex-col gap-6">
          <div className="flex flex-col gap-1.5 text-center sm:text-left">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Giriş Yap
            </h2>
            <p className="text-sm text-slate-400">
              ShiftPay hesabınıza erişmek için bir yöntem seçin
            </p>
          </div>

          {/* Giriş Butonları */}
          <div className="flex flex-col gap-3 pt-1">
            {/* Google ile Giriş Yap (Demo) */}
            <button
              id="btn-google-login"
              type="button"
              onClick={onLogin}
              className="group relative w-full flex items-center justify-center gap-3.5 px-5 py-4 rounded-2xl bg-white hover:bg-slate-100 active:scale-[0.98] text-slate-950 font-semibold text-sm sm:text-base transition-all duration-150 shadow-xl shadow-white/5 cursor-pointer"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Google ile Giriş Yap (Demo)</span>
              <ArrowRight className="w-4 h-4 ml-auto text-slate-400 group-hover:text-slate-900 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Bölücü */}
            <div className="relative my-1 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <span className="relative px-3 bg-slate-900/80 text-[11px] font-medium uppercase tracking-wider text-slate-500 rounded-full">
                veya
              </span>
            </div>

            {/* Cüzdan İle Bağlan */}
            <button
              id="btn-wallet-login"
              type="button"
              onClick={onLogin}
              className="group relative w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 hover:border-slate-600 active:scale-[0.98] text-slate-200 hover:text-white font-medium text-sm transition-all duration-150 border border-slate-700/60 shadow-lg cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>Cüzdan İle Bağlan</span>
              <ArrowRight className="w-4 h-4 ml-auto text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Alt Güvenlik & Yasal Bilgi */}
          <div className="pt-1 flex flex-col items-center gap-2 text-center">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Stellar Ağı ve 256-bit şifreleme ile korunmaktadır</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Devam ederek Kullanım Şartları ve Gizlilik Politikasını kabul etmiş sayılırsınız.
            </p>
          </div>
        </div>

      </div>
    </main>
  );
}

// =============================================================================
// ANA SAYFA BİLEŞENİ — Tek state ile geçiş
// =============================================================================
export default function LoginPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (isAuthenticated) {
    return <MockDashboard onLogout={() => setIsAuthenticated(false)} />;
  }

  return <WelcomeScreen onLogin={() => setIsAuthenticated(true)} />;
}
