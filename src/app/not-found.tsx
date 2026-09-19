import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 bg-slate-950 text-slate-100">
      <h2 className="text-2xl font-bold">Sayfa Bulunamadı</h2>
      <p className="mt-2 text-sm text-slate-400">Aradığınız sayfa mevcut değil veya taşınmış olabilir.</p>
      <Link
        href="/"
        className="mt-4 px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        Ana Sayfaya Dön
      </Link>
    </div>
  );
}
