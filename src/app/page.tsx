'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { ShieldCheck, ArrowRight, CheckCircle2, Sparkles, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { ready, authenticated, login } = usePrivy();

  // Kullanıcı giriş yaptığı anda doğrudan /dashboard sayfasına yönlendir
  useEffect(() => {
    if (ready && authenticated) {
      router.push('/dashboard');
    }
  }, [ready, authenticated, router]);

  const handleGoogleLogin = () => {
    if (ready && typeof login === 'function') {
      login({ loginMethods: ['google'] });
    }
  };

  return (
    <main className="relative min-h-screen w-full bg-[#030712] text-slate-100 flex flex-col justify-center items-center p-4 sm:p-8 lg:p-16 overflow-hidden select-none">
      {/* Yumuşak gradyan ışık halkaları */}
      <div className="absolute -top-48 -left-32 w-[36rem] h-[36rem] bg-blue-600/20 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-[38rem] h-[38rem] bg-indigo-600/15 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute -bottom-40 left-1/4 w-[40rem] h-[40rem] bg-cyan-500/10 rounded-full blur-[170px] pointer-events-none" />

      {/* Ana Kapsayıcı */}
      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-20 my-auto">
        
        {/* Sol Kolon: Logo, Başlık, Rozet ve Tanıtım */}
        <div className="w-full lg:max-w-xl flex flex-col items-center lg:items-start text-center lg:text-left">
          
          {/* Stellar & FinTech Temalı Modernize Logo (Neon Glow + Keskin Şimşek S ve P Monogramı) */}
          <div className="relative mb-6 flex items-center justify-center group">
            {/* Arka plan parlayan neon halo efekti */}
            <div className="absolute -inset-2 bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 rounded-3xl blur-2xl opacity-75 group-hover:opacity-100 transition-all duration-500 animate-pulse" />
            
            {/* Dinamik cam/metalik gradient çerçeve */}
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
                  {/* Şimşek Şeklinde Keskin 'S' */}
                  <path
                    d="M26 12H13L9 28H19L15 44H28L32 28H22L26 12Z"
                    fill="url(#boltGrad)"
                    stroke="#E0F2FE"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                  {/* Keskin Hatlı 'P' (Anlık Hakediş & Ödeme) */}
                  <path
                    d="M34 14H46C51.5 14 55 17.5 55 23C55 28.5 51.5 32 46 32H40V44H34V14ZM40 26H45C47.8 26 49.5 24.8 49.5 23C49.5 21.2 47.8 20 45 20H40V26Z"
                    fill="url(#spGrad)"
                    stroke="#E0F2FE"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                  {/* Stellar Mikro Sparkle (Işıltı) */}
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

          {/* Masaüstü Geniş Ekran Avantajları */}
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
              ShiftPay hesabınıza Google ile anında ve güvenle erişin
            </p>
          </div>

          {/* Privy ile Google Giriş Butonu */}
          <div className="flex flex-col gap-3.5 pt-1">
            <button
              id="btn-google-login"
              type="button"
              disabled={!ready}
              onClick={handleGoogleLogin}
              className="group relative w-full flex items-center justify-center gap-3.5 px-5 py-4 rounded-2xl bg-white hover:bg-slate-100 active:scale-[0.98] text-slate-950 font-semibold text-sm sm:text-base transition-all duration-150 shadow-xl shadow-white/5 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {!ready ? (
                <Loader2 className="w-5 h-5 text-slate-900 animate-spin" />
              ) : (
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Google ile Giriş Yap</span>
              <ArrowRight className="w-4 h-4 ml-auto text-slate-400 group-hover:text-slate-900 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Alt Güvenlik & Yasal Bilgi */}
          <div className="pt-2 flex flex-col items-center gap-2 text-center">
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
