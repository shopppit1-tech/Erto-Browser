import React from 'react';
import { Shield, Lock, Code2, FastForward, Globe } from 'lucide-react';

export function GoogleGLogo({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
      />
    </svg>
  );
}

export function SiteBrandTile({
  iconKey,
  size = 'md',
}: {
  iconKey: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const dim =
    size === 'lg' ? 'w-14 h-14 rounded-2xl' : size === 'sm' ? 'w-11 h-11 rounded-xl' : 'w-13 h-13 rounded-2xl';

  switch (iconKey) {
    case 'youtube':
      return (
        <div className={`${dim} bg-white flex items-center justify-center shadow-sm`}>
          <svg viewBox="0 0 32 32" className="w-9 h-9" aria-hidden="true">
            <rect x="2" y="6" width="28" height="20" rx="6" fill="#FF0000" />
            <polygon points="13,11 22,16 13,21" fill="#FFFFFF" />
          </svg>
        </div>
      );
    case 'facebook':
      return (
        <div className={`${dim} bg-white flex items-center justify-center shadow-sm`}>
          <svg viewBox="0 0 32 32" className="w-9 h-9" aria-hidden="true">
            <rect x="2" y="2" width="28" height="28" rx="6" fill="#1877F2" />
            <path
              d="M20.8 16.5l.7-4.5h-4.3V9.1c0-1.2.6-2.4 2.5-2.4h1.9V2.9s-1.7-.3-3.4-.3c-3.5 0-5.8 2.1-5.8 5.9V12H8.5v4.5h3.9V29h4.8V16.5h3.6z"
              fill="#FFFFFF"
            />
          </svg>
        </div>
      );
    case 'google':
      return (
        <div className={`${dim} bg-white flex items-center justify-center shadow-sm`}>
          <GoogleGLogo className="w-8 h-8" />
        </div>
      );
    case 'tiktok':
      return (
        <div
          className={`${dim} bg-[#060908] border-2 border-[#4ade80] flex items-center justify-center shadow-[0_0_12px_rgba(74,222,128,0.35)]`}
        >
          <svg viewBox="0 0 32 32" className="w-8 h-8" aria-hidden="true">
            <path
              d="M21.5 6.5c1.1 1.4 2.7 2.3 4.5 2.5v3.8c-1.8-.1-3.4-.7-4.8-1.7v7.5c0 4.1-3.3 7.4-7.4 7.4s-7.4-3.3-7.4-7.4 3.3-7.4 7.4-7.4c.4 0 .8 0 1.2.1v3.9c-.4-.1-.8-.2-1.2-.2-2 0-3.6 1.6-3.6 3.6s1.6 3.6 3.6 3.6 3.6-1.6 3.6-3.6V4h4.1v2.5z"
              fill="#25F4EE"
              transform="translate(-0.8,-0.6)"
            />
            <path
              d="M21.5 6.5c1.1 1.4 2.7 2.3 4.5 2.5v3.8c-1.8-.1-3.4-.7-4.8-1.7v7.5c0 4.1-3.3 7.4-7.4 7.4s-7.4-3.3-7.4-7.4 3.3-7.4 7.4-7.4c.4 0 .8 0 1.2.1v3.9c-.4-.1-.8-.2-1.2-.2-2 0-3.6 1.6-3.6 3.6s1.6 3.6 3.6 3.6 3.6-1.6 3.6-3.6V4h4.1v2.5z"
              fill="#FE2C55"
              transform="translate(0.8,0.6)"
            />
            <path
              d="M21.5 6.5c1.1 1.4 2.7 2.3 4.5 2.5v3.8c-1.8-.1-3.4-.7-4.8-1.7v7.5c0 4.1-3.3 7.4-7.4 7.4s-7.4-3.3-7.4-7.4 3.3-7.4 7.4-7.4c.4 0 .8 0 1.2.1v3.9c-.4-.1-.8-.2-1.2-.2-2 0-3.6 1.6-3.6 3.6s1.6 3.6 3.6 3.6 3.6-1.6 3.6-3.6V4h4.1v2.5z"
              fill="#FFFFFF"
            />
          </svg>
        </div>
      );
    case 'globe-fav':
      return (
        <div className={`${dim} bg-white flex items-center justify-center shadow-sm`}>
          <div className="w-9 h-9 rounded-full bg-[#1d6ef2] flex items-center justify-center text-white">
            <Globe className="w-5 h-5 stroke-[2]" />
          </div>
        </div>
      );
    case 'google-search':
      return (
        <div className={`${dim} bg-white flex items-center justify-center shadow-sm`}>
          <svg viewBox="0 0 32 32" className="w-8 h-8" aria-hidden="true">
            <path d="M8 4h16a2 2 0 0 1 2 2v22l-10-5-10 5V6a2 2 0 0 1 2-2z" fill="#2563EB" />
            <text x="16" y="18" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="800" fontFamily="sans-serif">
              G
            </text>
          </svg>
        </div>
      );
    case 'shopee':
      return (
        <div className={`${dim} bg-white flex items-center justify-center shadow-sm`}>
          <svg viewBox="0 0 32 32" className="w-8 h-8" aria-hidden="true">
            <path d="M11 10a5 5 0 0 1 10 0" fill="none" stroke="#EE4D2D" strokeWidth="2.3" strokeLinecap="round" />
            <path d="M6 10h20l-1.5 17a2 2 0 0 1-2 1.8H9.5a2 2 0 0 1-2-1.8L6 10z" fill="#EE4D2D" />
            <text x="16" y="23.5" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="800" fontFamily="sans-serif">
              S
            </text>
          </svg>
        </div>
      );
    case 'whatsapp':
      return (
        <div className={`${dim} bg-white flex items-center justify-center shadow-sm`}>
          <svg viewBox="0 0 32 32" className="w-8 h-8" aria-hidden="true">
            <circle cx="16" cy="16" r="13" fill="#25D366" />
            <path
              d="M7 26l1.7-5A10.2 10.2 0 1 1 16 26.2c-1.8 0-3.5-.5-5-1.3L7 26z"
              fill="#25D366"
              stroke="#25D366"
              strokeWidth="1.5"
            />
            <path
              d="M12.6 10.8c-.3-.6-.6-.6-.9-.6h-.8c-.3 0-.7.1-1 .5-.4.4-1.4 1.3-1.4 3.2s1.4 3.7 1.6 4c.2.2 2.7 4.3 6.7 5.8 3.3 1.3 4 1 4.7.9.7-.1 2.3-.9 2.6-1.8.3-.9.3-1.6.2-1.8-.1-.2-.4-.3-.8-.5s-2.3-1.1-2.6-1.2c-.3-.1-.6-.2-.8.2-.2.4-.9 1.2-1.1 1.4-.2.2-.4.3-.8.1-.4-.2-1.6-.6-3-1.9-1.1-1-1.9-2.2-2.1-2.6-.2-.4 0-.6.2-.8.2-.2.4-.4.6-.6.2-.2.3-.4.4-.6.1-.2.1-.5 0-.7-.1-.2-.8-2-1.1-2.6z"
              fill="#FFFFFF"
            />
          </svg>
        </div>
      );
    case 'wikipedia':
      return (
        <div className={`${dim} bg-white flex items-center justify-center shadow-sm`}>
          <span className="font-serif text-[26px] font-bold text-[#111827] leading-none">W</span>
        </div>
      );
    case 'x':
      return (
        <div className={`${dim} bg-[#09090b] flex items-center justify-center shadow-sm`}>
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#FFFFFF" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </div>
      );
    default:
      return (
        <div className={`${dim} bg-white flex items-center justify-center shadow-sm`}>
          <Globe className="w-6 h-6 text-emerald-700" />
        </div>
      );
  }
}

export function ExtensionIconTile({
  iconKey,
  iconUrl,
  alt = 'Ikon Ekstensi',
}: {
  iconKey: string;
  iconUrl?: string;
  alt?: string;
}) {
  if (iconUrl) {
    return (
      <div className="w-13 h-13 rounded-xl bg-white border border-slate-100 overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
        <img
          src={iconUrl}
          alt={alt}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  switch (iconKey) {
    case 'google-translate':
      return (
        <div className="w-13 h-13 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-xs">
          <svg viewBox="0 0 36 36" className="w-10 h-10" aria-hidden="true">
            <circle cx="18" cy="18" r="15" fill="#EA4335" />
            <path d="M18 3a15 15 0 0 1 13 7.5H18V3z" fill="#EA4335" />
            <path d="M31 10.5A15 15 0 0 1 18 33V18h13v-7.5z" fill="#FBBC05" />
            <path d="M5 10.5A15 15 0 0 0 18 33V18L5 10.5z" fill="#34A853" />
            <path d="M5 10.5A15 15 0 0 1 18 3v15L5 10.5z" fill="#EA4335" />
            <circle cx="18" cy="18" r="7" fill="#FFFFFF" />
            <circle cx="18" cy="18" r="5.5" fill="#1A73E8" />
          </svg>
        </div>
      );
    case 'ublock-origin':
      return (
        <div className="w-13 h-13 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-xs">
          <svg viewBox="0 0 36 36" className="w-10 h-10" aria-hidden="true">
            <path d="M18 3L6 8v9.5c0 7.6 5.1 14.3 12 16 6.9-1.7 12-8.4 12-16V8L18 3z" fill="#8E0000" />
            <text
              x="18"
              y="22.5"
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="12.5"
              fontWeight="700"
              fontFamily="sans-serif"
            >
              uO
            </text>
          </svg>
        </div>
      );
    case 'dark-reader':
      return (
        <div className="w-13 h-13 rounded-xl bg-[#071824] flex items-center justify-center shrink-0 shadow-xs">
          <svg viewBox="0 0 36 36" className="w-10 h-10" aria-hidden="true">
            <path d="M18 5c-6.5 0-11 5-11 12v11h22V17c0-7-4.5-12-11-12z" fill="#134e6f" />
            <circle cx="13.5" cy="18.5" r="4.2" fill="#0b132b" stroke="#ea580c" strokeWidth="1.8" />
            <circle cx="22.5" cy="18.5" r="4.2" fill="#0b132b" stroke="#ea580c" strokeWidth="1.8" />
            <line x1="17.5" y1="18.5" x2="18.5" y2="18.5" stroke="#ea580c" strokeWidth="1.8" />
            <circle cx="13.5" cy="18.5" r="1.4" fill="#38bdf8" />
            <circle cx="22.5" cy="18.5" r="1.4" fill="#38bdf8" />
          </svg>
        </div>
      );
    case 'adblock':
      return (
        <div className="w-13 h-13 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-xs">
          <svg viewBox="0 0 36 36" className="w-10 h-10" aria-hidden="true">
            <polygon points="12,3 24,3 33,12 33,24 24,33 12,33 3,24 3,12" fill="#DC2626" />
            <path
              d="M14 25v-7.5a1.1 1.1 0 1 1 2.2 0V15a1.1 1.1 0 1 1 2.2 0v-1.2a1.1 1.1 0 1 1 2.2 0V16a1.1 1.1 0 1 1 2.2 0v6.2c0 2.7-1.9 4.8-4.6 4.8h-2.1c-1.2 0-2.1-.9-2.1-2z"
              fill="#FFFFFF"
            />
          </svg>
        </div>
      );
    case 'sponsorblock':
      return (
        <div className="w-13 h-13 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
          <FastForward className="w-7 h-7 text-rose-600" />
        </div>
      );
    case 'bitwarden':
      return (
        <div className="w-13 h-13 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
          <Lock className="w-7 h-7 text-blue-600" />
        </div>
      );
    case 'tampermonkey':
      return (
        <div className="w-13 h-13 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
          <Code2 className="w-7 h-7 text-lime-400" />
        </div>
      );
    default:
      return (
        <div className="w-13 h-13 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
          <Shield className="w-7 h-7 text-emerald-700" />
        </div>
      );
  }
}
