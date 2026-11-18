import React, { useState } from 'react';
import { Download, Smartphone, Share2, X, WifiOff, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export function PWAInstallButton({
  variant = 'compact',
  alwaysShowGuideFallback = false,
}: {
  variant?: 'compact' | 'card';
  alwaysShowGuideFallback?: boolean;
}) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    if (variant === 'card') {
      return (
        <div className="rounded-2xl bg-emerald-950/60 border border-emerald-400/40 p-3.5 flex items-center gap-3 text-emerald-100">
          <CheckCircle2 className="w-5 h-5 text-[#a3e635] shrink-0" />
          <p className="text-xs font-semibold">
            Erto Browser sudah terpasang sebagai aplikasi mandiri (PWA).
          </p>
        </div>
      );
    }
    return null;
  }

  const handlePress = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted && alwaysShowGuideFallback) {
        setShowGuide(true);
      }
    } else {
      setShowGuide(true);
    }
  };

  if (!isInstallable && !isIOS && !alwaysShowGuideFallback) {
    return null;
  }

  return (
    <>
      {variant === 'card' ? (
        <div className="rounded-2xl bg-gradient-to-r from-[#bef264] via-[#a3e635] to-[#65d41b] p-4 flex items-center justify-between gap-3 shadow-lg text-[#052e0d]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#052e0d]/15 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-[#052e0d]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-extrabold leading-tight">Instal Aplikasi Erto Browser</p>
              <p className="text-xs font-semibold text-[#134e1b] mt-0.5 truncate">
                {isInstallable
                  ? 'Pasang langsung ke layar utama HP atau desktop'
                  : 'Tambahkan ke Layar Utama agar berjalan seperti APK'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handlePress}
            className="px-4 py-2.5 rounded-xl bg-[#052e0d] text-[#a3e635] text-xs font-extrabold inline-flex items-center gap-1.5 shrink-0 hover:bg-[#084214] active:scale-95 transition"
          >
            <Download className="w-4 h-4" />
            <span>Instal</span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handlePress}
          aria-label="Instal Aplikasi PWA"
          className="min-h-[36px] px-3 py-1.5 rounded-xl bg-[#a3e635] hover:bg-[#bef264] text-[#052e0d] text-xs font-extrabold inline-flex items-center gap-1.5 shadow-sm active:scale-95 transition whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Instal App</span>
        </button>
      )}

      {showGuide && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 text-slate-900 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#15803d]" />
                <h3 className="text-base font-extrabold">
                  {isIOS ? 'Instal di iPhone / iPad' : 'Instal Erto Browser (PWA)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Tutup"
                className="p-1.5 rounded-xl text-slate-500 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isIOS ? (
              <ol className="text-xs sm:text-sm text-slate-700 space-y-2 list-decimal pl-5">
                <li>
                  Buka aplikasi ini langsung di browser <strong>Safari</strong>.
                </li>
                <li>
                  Ketuk tombol <strong className="inline-flex items-center gap-1">Bagikan <Share2 className="w-3.5 h-3.5 inline" /></strong> di bilah bawah Safari.
                </li>
                <li>
                  Pilih <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong> lalu ketuk <strong>Tambah</strong>.
                </li>
              </ol>
            ) : (
              <ol className="text-xs sm:text-sm text-slate-700 space-y-2 list-decimal pl-5">
                <li>
                  Buka URL aplikasi di tab browser utama (bukan pratinjau tersemat) menggunakan <strong>Chrome</strong> atau <strong>Edge</strong>.
                </li>
                <li>
                  Ketuk menu browser (<strong>⋮</strong>) di pojok kanan atas.
                </li>
                <li>
                  Pilih <strong>Instal Aplikasi</strong> atau <strong>Tambahkan ke Layar Utama</strong> untuk memasang ikon Erto Browser seperti APK.
                </li>
              </ol>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full py-2.5 rounded-xl bg-[#15803d] text-white text-xs font-bold hover:bg-[#166534] transition"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-lg whitespace-nowrap"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Mode Offline — Menggunakan cache aplikasi</span>
    </div>
  );
}
