import React, { useState, useMemo } from 'react';
import {
  Puzzle,
  MoreVertical,
  Mic,
  QrCode,
  Star,
  Flame,
  ChevronRight,
  Search,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { ASSETS, QUICK_ACCESS_SITES } from '../data/defaults';
import { BookmarkItem, HistoryItem, TopSiteItem } from '../types/browser';
import { GoogleGLogo, SiteBrandTile } from './BrandIcons';
import { PWAInstallButton } from './PWAInstallUI';

interface HomeViewProps {
  bookmarks: BookmarkItem[];
  topSites: TopSiteItem[];
  history: HistoryItem[];
  tabCount: number;
  installedExtCount: number;
  incognitoActive: boolean;
  onNavigateUrl: (input: string) => void;
  onOpenExtensions: () => void;
  onOpenBookmarksAll: () => void;
  onOpenTopSitesAll: () => void;
  onOpenTabsSheet: () => void;
  onOpenOverflowMenu: () => void;
  onOpenVoiceModal: () => void;
  onOpenQrModal: () => void;
}

export function HomeView({
  bookmarks,
  topSites,
  history,
  tabCount,
  installedExtCount,
  incognitoActive,
  onNavigateUrl,
  onOpenExtensions,
  onOpenBookmarksAll,
  onOpenTopSitesAll,
  onOpenTabsSheet,
  onOpenOverflowMenu,
  onOpenVoiceModal,
  onOpenQrModal,
}: HomeViewProps) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const pinnedBookmarks = useMemo(() => {
    const pinned = bookmarks.filter((b) => b.pinnedOnHome);
    return (pinned.length >= 4 ? pinned : bookmarks).slice(0, 4);
  }, [bookmarks]);

  const homeTopSites = useMemo(() => topSites.slice(0, 4), [topSites]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const matchedBookmarks = bookmarks
      .filter((b) => b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q))
      .map((b) => ({ title: b.title, url: b.url, kind: 'Bookmark' as const }));
    const matchedHistory = history
      .filter((h) => h.title.toLowerCase().includes(q) || h.url.toLowerCase().includes(q))
      .map((h) => ({ title: h.title, url: h.url, kind: 'Riwayat' as const }));
    const seen = new Set<string>();
    const combined: { title: string; url: string; kind: 'Bookmark' | 'Riwayat' }[] = [];
    for (const item of [...matchedBookmarks, ...matchedHistory]) {
      if (!seen.has(item.url)) {
        seen.add(item.url);
        combined.push(item);
      }
      if (combined.length >= 4) break;
    }
    return combined;
  }, [query, bookmarks, history]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setFocused(false);
    onNavigateUrl(trimmed);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 pt-3 pb-24 space-y-4">
      {/* Top Brand Header */}
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-13 h-13 sm:w-14 sm:h-14 rounded-2xl overflow-hidden border border-[#4ade80]/60 shadow-[0_0_18px_rgba(74,222,128,0.35)] shrink-0 bg-[#032a0b]">
            <img
              src={ASSETS.eagleLogo}
              alt="Logo Erto Browser"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <h1 className="text-[22px] sm:text-[26px] font-extrabold italic tracking-tight leading-none text-white">
                Erto <span className="text-[#8ef530]">Browser</span>
              </h1>
              {incognitoActive && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Penyamaran
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-white/95 font-medium mt-1 truncate">
              Cepat • Aman • Support Ekstensi
            </p>
          </div>
        </div>

        {/* Right Header Actions: Install App (when eligible), Tabs, Extensions Puzzle, 3-dot Menu */}
        <div className="flex items-center gap-1 shrink-0">
          <PWAInstallButton variant="compact" />
          <button
            type="button"
            onClick={onOpenTabsSheet}
            aria-label={`Tab aktif (${tabCount})`}
            title="Kelola Tab"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-white hover:bg-white/10 active:scale-95 transition"
          >
            <div className="relative flex items-center justify-center w-6 h-6 rounded-md border-2 border-white text-[11px] font-extrabold tabular-nums">
              {tabCount}
            </div>
          </button>

          <button
            type="button"
            onClick={onOpenExtensions}
            aria-label="Ekstensi Chrome"
            title="Ekstensi"
            className="relative min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-white hover:bg-white/10 active:scale-95 transition"
          >
            <Puzzle className="w-6 h-6 fill-white" />
            {installedExtCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[#a3e635] text-[#032d0c] text-[10px] font-extrabold flex items-center justify-center tabular-nums">
                {installedExtCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenOverflowMenu}
            aria-label="Menu Browser"
            title="Menu Lainnya"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-white hover:bg-white/10 active:scale-95 transition"
          >
            <MoreVertical className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Search or Type URL Bar */}
      <div className="relative z-20">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-full h-12 sm:h-13 px-3.5 flex items-center gap-2.5 shadow-[0_10px_28px_rgba(0,0,0,0.3)] border border-white/80 focus-within:ring-2 focus-within:ring-[#a3e635]"
        >
          <GoogleGLogo className="w-6 h-6 shrink-0" />
          <input
            type="text"
            value={query}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 180)}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search or type URL"
            aria-label="Cari atau ketik URL"
            className="flex-1 min-w-0 bg-transparent text-slate-800 placeholder:text-slate-600 text-[15px] font-medium outline-none"
          />
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={onOpenVoiceModal}
              aria-label="Pencarian Suara"
              title="Pencarian Suara"
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 active:scale-95 transition"
            >
              <Mic className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onOpenQrModal}
              aria-label="Pindai QR URL"
              title="Pindai QR Code"
              className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 active:scale-95 transition"
            >
              <QrCode className="w-5 h-5" />
            </button>
          </div>
        </form>

        {/* Autocomplete Dropdown */}
        {focused && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-emerald-100 overflow-hidden divide-y divide-slate-100">
            {suggestions.map((item) => (
              <button
                key={item.url}
                type="button"
                onMouseDown={() => onNavigateUrl(item.url)}
                className="w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-emerald-50 transition"
              >
                <Search className="w-4 h-4 text-emerald-700 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 truncate">{item.title}</p>
                  <p className="text-xs text-slate-500 truncate">{item.url}</p>
                </div>
                <span className="text-[11px] font-medium text-emerald-700 shrink-0">{item.kind}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hero Banner with Fierce Emerald Eagle */}
      <section
        aria-label="Banner Utama Erto Browser"
        className="relative rounded-2xl overflow-hidden shadow-[0_14px_34px_rgba(0,0,0,0.35)] border border-[#34d399]/25 min-h-[154px] sm:min-h-[196px] flex items-center bg-[#032609]"
      >
        <img
          src={ASSETS.heroEagle}
          alt="Ilustrasi Elang Erto Browser"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-right"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-[#022609]/95 via-[#03360e]/75 to-transparent"
        />
        <div className="relative z-10 px-4 sm:px-7 py-5 max-w-[66%] sm:max-w-[58%]">
          <h2 className="text-[21px] sm:text-[30px] font-extrabold italic leading-[1.14] tracking-tight text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)] text-balance">
            Jelajah Internet
            <br />
            Lebih <span className="text-[#fde047]">Bebas</span>
            <br />
            Dengan <span className="text-[#fde047]">Erto Browser</span>
          </h2>
          {/* Curved yellow/lime swoosh underline matching screenshot */}
          <svg
            viewBox="0 0 210 18"
            className="w-40 sm:w-52 h-3.5 mt-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
            aria-hidden="true"
          >
            <path
              d="M4 13 C 62 3, 145 3, 204 8"
              fill="none"
              stroke="#fde047"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </section>

      {/* Quick Access 4-Column Row (YouTube, Facebook, Google, TikTok) */}
      <section aria-label="Akses Cepat" className="grid grid-cols-4 gap-3 sm:gap-5 pt-0.5">
        {QUICK_ACCESS_SITES.map((site) => (
          <button
            key={site.id}
            type="button"
            onClick={() => onNavigateUrl(site.url)}
            className="group flex flex-col items-center justify-center py-1 rounded-2xl active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a3e635]"
          >
            <div className="transition-transform group-hover:-translate-y-0.5">
              <SiteBrandTile iconKey={site.iconKey} size="md" />
            </div>
            <span className="text-white text-[12px] sm:text-[13px] font-semibold mt-1.5 truncate max-w-full drop-shadow-sm">
              {site.title}
            </span>
          </button>
        ))}
      </section>

      {/* Bookmark & Top Situs Cards (Stacked on mobile, 2-column grid on desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bookmark Card */}
        <section className="erto-card-mint rounded-2xl p-3.5 sm:p-4 shadow-[0_10px_26px_rgba(0,0,0,0.24)] border border-white/60">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-[#15803d] fill-[#15803d] shrink-0" />
              <h3 className="text-[15px] sm:text-base font-bold text-[#052e0d]">Bookmark</h3>
            </div>
            <button
              type="button"
              onClick={onOpenBookmarksAll}
              className="inline-flex items-center gap-0.5 text-xs sm:text-[13px] font-bold text-[#15803d] hover:text-[#14532d] min-h-[36px] px-1.5 rounded-lg whitespace-nowrap shrink-0"
            >
              <span>Lihat Semua</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {pinnedBookmarks.map((bm) => (
              <button
                key={bm.id}
                type="button"
                onClick={() => onNavigateUrl(bm.url)}
                className="group flex flex-col items-center text-center py-1 rounded-xl hover:bg-emerald-950/5 active:scale-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15803d]"
              >
                <SiteBrandTile iconKey={bm.iconKey} size="sm" />
                <span className="text-[11px] sm:text-xs font-semibold text-[#0b2912] mt-1.5 leading-tight line-clamp-2">
                  {bm.title}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Top Situs Card */}
        <section className="erto-card-mint rounded-2xl p-3.5 sm:p-4 shadow-[0_10px_26px_rgba(0,0,0,0.24)] border border-white/60">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-[#ea580c] fill-[#f97316] shrink-0" />
              <h3 className="text-[15px] sm:text-base font-bold text-[#052e0d]">Top Situs</h3>
            </div>
            <button
              type="button"
              onClick={onOpenTopSitesAll}
              className="inline-flex items-center gap-0.5 text-xs sm:text-[13px] font-bold text-[#15803d] hover:text-[#14532d] min-h-[36px] px-1.5 rounded-lg whitespace-nowrap shrink-0"
            >
              <span>Lihat Semua</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {homeTopSites.map((site) => (
              <button
                key={site.id}
                type="button"
                onClick={() => onNavigateUrl(site.url)}
                className="group flex flex-col items-center text-center py-1 rounded-xl hover:bg-emerald-950/5 active:scale-95 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15803d]"
              >
                <SiteBrandTile iconKey={site.iconKey} size="sm" />
                <span className="text-[11px] sm:text-xs font-semibold text-[#0b2912] mt-1.5 leading-tight truncate max-w-full">
                  {site.title}
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Subtle desktop quick extension callout */}
      <div className="hidden lg:flex items-center justify-between rounded-2xl bg-[#043a11]/70 border border-[#65d41b]/40 px-5 py-3">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-[#a3e635]" />
          <p className="text-sm text-emerald-50 font-medium">
            Dukungan Ekstensi Chrome aktif — pasang <span className="font-bold text-[#a3e635]">uBlock Origin</span>,{' '}
            <span className="font-bold text-[#a3e635]">Dark Reader</span>, dan{' '}
            <span className="font-bold text-[#a3e635]">Google Translate</span> langsung di Erto Browser.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenExtensions}
          className="px-4 py-2 rounded-xl bg-[#a3e635] text-[#042c0c] text-xs font-bold hover:bg-[#bef264] transition whitespace-nowrap shrink-0"
        >
          Kelola Ekstensi
        </button>
      </div>
    </div>
  );
}
