'use client';

import React from 'react';

export default function ShiftPayLogo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center select-none ${className || ''}`}>
      <div className="relative flex items-center justify-center">
        {/* Soft Ambient Neon Cyan Glow */}
        <div className="absolute -inset-3 bg-cyan-500/35 rounded-full blur-xl animate-pulse pointer-events-none" />

        {/* Seamless ShiftPay Logo Image with Screen Blend Mode (Strips Black Box Background) */}
        <img
          src="/shiftpay-logo.png"
          alt="ShiftPay Logo"
          style={{ mixBlendMode: 'screen' }}
          className="h-14 sm:h-16 md:h-20 w-auto object-contain drop-shadow-[0_0_25px_rgba(0,240,255,0.95)] relative z-10 transition-transform duration-300 hover:scale-105"
        />
      </div>
    </div>
  );
}
