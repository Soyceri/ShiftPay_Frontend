'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { Wallet, Mail, ShieldCheck, Zap, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { ready, authenticated, login } = usePrivy();

  // Kullanıcı giriş yaptıysa doğrudan ana panele yönlendir
  useEffect(() => {
    if (ready && authenticated) {
      router.push('/dashboard');
    }
  }, [ready, authenticated, router]);

  return (
    <main className="relative min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between items-center px-4 py-8 overflow-hidden">
      {/* Arka plan dekoratif neon ışık efektleri */}
      <div className="absolute -top-32 -left-20 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-24 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Üst Kısım: Marka ve Başlık */}
      <div className="w-full max-w-sm flex flex-col items-center pt-8 text-center z-10">
        <div className="relative mb-5 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-2xl blur-lg opacity-60 animate-pulse" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-xl border border-white/20">
            <Wallet className="w-8 h-8 text-white" />
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-3 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-300">
          <Zap className="w-3.5 h-3.5 text-blue-400" />
          <span>Yeni Nesil Hakediş & Ödeme Sistemi</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          ShiftPay
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-400 font-medium max-w-xs leading-relaxed">
          Hak Ettiğin Kazanç, Anında Cebinde
        </p>
      </div>

      {/* Orta Kısım: Giriş Seçenekleri */}
      <div className="w-full max-w-sm flex flex-col gap-3.5 my-auto z-10">
        {!ready ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <span className="text-xs text-slate-400">Güvenli oturum hazırlanıyor...</span>
          </div>
        ) : (
          <>
            {/* Google ile Giriş Yap */}
            <button
              id="btn-google-login"
              type="button"
              onClick={() => login({ loginMethods: ['google'] })}
              className="group relative w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-900 font-semibold text-sm transition-all duration-200 active:scale-[0.98] shadow-lg shadow-white/5 border border-white/80"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              <span>Google ile Devam Et</span>
              <ArrowRight className="w-4 h-4 ml-auto text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
            </button>

            {/* E-posta ile Giriş Yap */}
            <button
              id="btn-email-login"
              type="button"
              onClick={() => login({ loginMethods: ['email'] })}
              className="group relative w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-100 font-medium text-sm transition-all duration-200 active:scale-[0.98] border border-slate-700/80 backdrop-blur-sm"
            >
              <Mail className="w-4 h-4 text-blue-400" />
              <span>E-posta ile Giriş Yap</span>
              <ArrowRight className="w-4 h-4 ml-auto text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
            </button>
          </>
        )}
      </div>

      {/* Alt Kısım: Güvenlik Rozetleri ve Bilgilendirme */}
      <div className="w-full max-w-sm flex flex-col items-center gap-2 pt-6 text-center z-10 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Stellar Ağı ve Privy güvencesiyle korunmaktadır</span>
        </div>
        <p className="text-[11px] text-slate-500">
          Devam ederek Hizmet Şartları ve Gizlilik Politikasını kabul etmiş olursunuz.
        </p>
      </div>
    </main>
  );
}
