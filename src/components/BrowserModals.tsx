import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Plus,
  EyeOff,
  Puzzle,
  Download,
  Clock,
  Star,
  Settings,
  Mic,
  QrCode,
  Check,
  Search,
  Globe,
} from 'lucide-react';
import { AppScreen, BrowserTab, ExtensionItem, TopSiteItem } from '../types/browser';
import { ExtensionIconTile, SiteBrandTile } from './BrandIcons';

/* ---------- Tab Switcher Sheet ---------- */
export function TabSwitcherModal({
  open,
  tabs,
  activeTabId,
  onClose,
  onSelectTab,
  onCloseTab,
  onNewTab,
}: {
  open: boolean;
  tabs: BrowserTab[];
  activeTabId: string;
  onClose: () => void;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onNewTab: (incognito: boolean) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-[#053b12] border border-[#4ade80]/40 rounded-t-3xl sm:rounded-3xl p-4 space-y-4 text-white max-h-[82vh] flex flex-col shadow-2xl">
        <div className="w-10 h-1 bg-white/30 rounded-full mx-auto sm:hidden" />
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">Pengelola Tab ({tabs.length})</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
          {tabs.map((tab) => {
            const active = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition ${
                  active
                    ? 'bg-[#a3e635]/20 border-[#a3e635]'
                    : 'bg-white/10 border-white/10 hover:bg-white/15'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    onSelectTab(tab.id);
                    onClose();
                  }}
                  className="flex items-center gap-3 min-w-0 flex-1 text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                    {tab.incognito ? (
                      <EyeOff className="w-4 h-4 text-amber-300" />
                    ) : (
                      <Globe className="w-4 h-4 text-[#a3e635]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate">{tab.title || 'Beranda'}</p>
                    <p className="text-xs text-emerald-100/75 truncate font-mono">
                      {tab.url || 'erto://home'}
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => onCloseTab(tab.id)}
                  aria-label="Tutup Tab"
                  className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl hover:bg-white/15"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => {
              onNewTab(false);
              onClose();
            }}
            className="min-h-[44px] rounded-xl bg-[#a3e635] text-[#052e0d] text-xs font-extrabold inline-flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Tab Baru</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onNewTab(true);
              onClose();
            }}
            className="min-h-[44px] rounded-xl bg-slate-900 text-amber-300 border border-amber-400/40 text-xs font-extrabold inline-flex items-center justify-center gap-1.5"
          >
            <EyeOff className="w-4 h-4" />
            <span>Mode Penyamaran</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Overflow 3-Dot Menu ---------- */
export function OverflowMenuModal({
  open,
  onClose,
  onNewTab,
  onNavigateScreen,
}: {
  open: boolean;
  onClose: () => void;
  onNewTab: (incognito: boolean) => void;
  onNavigateScreen: (screen: AppScreen) => void;
}) {
  if (!open) return null;

  const actions = [
    { label: 'Tab Baru', Icon: Plus, onClick: () => onNewTab(false) },
    { label: 'Tab Penyamaran Baru', Icon: EyeOff, onClick: () => onNewTab(true) },
    { label: 'Ekstensi Chrome', Icon: Puzzle, onClick: () => onNavigateScreen('extensions') },
    { label: 'Unduhan', Icon: Download, onClick: () => onNavigateScreen('downloads') },
    { label: 'Riwayat', Icon: Clock, onClick: () => onNavigateScreen('history') },
    { label: 'Bookmark', Icon: Star, onClick: () => onNavigateScreen('bookmarks') },
    { label: 'Setelan', Icon: Settings, onClick: () => onNavigateScreen('settings') },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-start justify-end p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="w-64 bg-white rounded-2xl shadow-2xl border border-emerald-100 overflow-hidden divide-y divide-slate-100 text-slate-900 mt-10"
        onClick={(e) => e.stopPropagation()}
      >
        {actions.map(({ label, Icon, onClick }) => (
          <button
            key={label}
            type="button"
            onClick={() => {
              onClick();
              onClose();
            }}
            className="w-full px-4 py-3 flex items-center gap-3 text-left text-sm font-semibold hover:bg-emerald-50 transition"
          >
            <Icon className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Voice Search Modal ---------- */
export function VoiceSearchModal({
  open,
  onClose,
  onResult,
}: {
  open: boolean;
  onClose: () => void;
  onResult: (query: string) => void;
}) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!open) return;
    setTranscript('');
    setErrorMsg('');

    type SpeechCtor = new () => {
      lang: string;
      interimResults: boolean;
      maxAlternatives: number;
      onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
      onerror: (() => void) | null;
      onend: (() => void) | null;
      start: () => void;
      stop: () => void;
    };

    const win = window as unknown as {
      SpeechRecognition?: SpeechCtor;
      webkitSpeechRecognition?: SpeechCtor;
    };
    const Recognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!Recognition) {
      setErrorMsg('Mikrofon suara tidak didukung pada browser ini. Pilih pencarian cepat di bawah:');
      return;
    }

    const rec = new Recognition();
    rec.lang = 'id-ID';
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    setListening(true);

    rec.onresult = (event) => {
      const text = event.results[0]?.[0]?.transcript || '';
      setTranscript(text);
      if (text.trim()) {
        setTimeout(() => {
          rec.stop();
          onResult(text.trim());
          onClose();
        }, 650);
      }
    };
    rec.onerror = () => {
      setListening(false);
      setErrorMsg('Izin mikrofon belum aktif. Ketik atau pilih topik pencarian:');
    };
    rec.onend = () => setListening(false);

    try {
      rec.start();
    } catch {
      setListening(false);
    }

    return () => {
      try {
        rec.stop();
      } catch {
        // ignore
      }
    };
  }, [open, onClose, onResult]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 text-center text-slate-900 shadow-2xl space-y-4">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="p-1.5 rounded-xl text-slate-500 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
            listening ? 'bg-emerald-600 text-white animate-pulse' : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          <Mic className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-base font-bold">
            {listening ? 'Mendengarkan suara Anda...' : 'Pencarian Suara'}
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            {transcript || errorMsg || 'Ucapkan alamat situs atau kata kunci pencarian.'}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 pt-1">
          {['Berita teknologi hari ini', 'Wikipedia Indonesia', 'Cuaca Jakarta'].map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => {
                onResult(sample);
                onClose();
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold hover:bg-emerald-100"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- QR / URL Scanner Modal ---------- */
export function QrScannerModal({
  open,
  onClose,
  onOpenUrl,
}: {
  open: boolean;
  onClose: () => void;
  onOpenUrl: (url: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [manualUrl, setManualUrl] = useState('');
  const [camError, setCamError] = useState(false);

  useEffect(() => {
    if (!open) return;
    let stream: MediaStream | null = null;
    setCamError(false);

    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment' } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch(() => setCamError(true));
    } else {
      setCamError(true);
    }

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-5 text-slate-900 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-bold">Pindai Kode QR / Tautan</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="p-1.5 rounded-xl text-slate-500 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center">
          {!camError ? (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          ) : (
            <div className="text-center p-4 text-slate-300 space-y-1.5">
              <QrCode className="w-10 h-10 mx-auto text-emerald-400" />
              <p className="text-xs font-medium">Kamera tidak tersedia atau belum diizinkan.</p>
            </div>
          )}
          <div className="pointer-events-none absolute inset-6 border-2 border-[#a3e635]/80 rounded-2xl" />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!manualUrl.trim()) return;
            onOpenUrl(manualUrl.trim());
            onClose();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder="Atau tempel URL hasil QR di sini..."
            className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-600"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-[#15803d] text-white text-xs font-bold shrink-0"
          >
            Buka
          </button>
        </form>
      </div>
    </div>
  );
}

/* ---------- Top Situs Full Directory Modal ---------- */
export function TopSitesModal({
  open,
  topSites,
  onClose,
  onOpenUrl,
}: {
  open: boolean;
  topSites: TopSiteItem[];
  onClose: () => void;
  onOpenUrl: (url: string) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-[#053b12] border border-[#4ade80]/40 rounded-t-3xl sm:rounded-3xl p-4 space-y-4 text-white max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">Semua Top Situs</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3 overflow-y-auto pb-2">
          {topSites.map((site) => (
            <button
              key={site.id}
              type="button"
              onClick={() => {
                onOpenUrl(site.url);
                onClose();
              }}
              className="flex flex-col items-center text-center p-2 rounded-2xl hover:bg-white/10 transition"
            >
              <SiteBrandTile iconKey={site.iconKey} size="sm" />
              <span className="text-xs font-semibold text-white mt-1.5 truncate max-w-full">
                {site.title}
              </span>
              <span className="text-[10px] text-emerald-200/80">{site.category}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Chrome Web Store Explorer Modal ---------- */
export function ChromeWebStoreModal({
  open,
  extensions,
  onClose,
  onInstallToggle,
}: {
  open: boolean;
  extensions: ExtensionItem[];
  onClose: () => void;
  onInstallToggle: (id: string) => void;
}) {
  const [search, setSearch] = useState('');
  if (!open) return null;

  const filtered = extensions.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-xl bg-[#043710] border border-[#a3e635]/50 rounded-t-3xl sm:rounded-3xl p-4 space-y-3.5 text-white max-h-[86vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Puzzle className="w-6 h-6 text-[#a3e635]" />
            <div>
              <h2 className="text-base font-extrabold">Chrome Web Store</h2>
              <p className="text-xs text-emerald-100/80">Katalog Ekstensi Kompatibel Erto Browser</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-white rounded-xl h-10 px-3 flex items-center gap-2 text-slate-900">
          <Search className="w-4 h-4 text-emerald-700 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari ekstensi di toko..."
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
          {filtered.map((ext) => (
            <div
              key={ext.id}
              className="bg-white/95 rounded-2xl p-3 flex items-center justify-between gap-3 text-slate-900"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <ExtensionIconTile iconKey={ext.iconKey} />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold truncate">{ext.name}</h3>
                  <p className="text-xs text-slate-600 line-clamp-1">{ext.description}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {ext.category} · ★ {ext.rating.toFixed(1)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onInstallToggle(ext.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 inline-flex items-center gap-1 ${
                  ext.installed
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-[#15803d] text-white'
                }`}
              >
                {ext.installed ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Terpasang</span>
                  </>
                ) : (
                  <span>Pasang</span>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
