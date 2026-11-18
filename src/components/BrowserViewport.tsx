import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Home,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Lock,
  ShieldCheck,
  Puzzle,
  MoreVertical,
  Star,
  Download,
  Languages,
  Moon,
  Monitor,
  Search,
  EyeOff,
  Play,
  User as UserIcon,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import { BrowserSettings, BrowserTab, ExtensionItem } from '../types/browser';
import { apiUrl } from '../utils/api';
import { ErtoWebView, isNativeAndroidApk } from '../utils/nativeBrowser';
import { GoogleGLogo } from './BrandIcons';

interface SearchResult {
  title: string;
  url: string;
  domain: string;
  snippet: string;
  source: string;
}

interface YouTubeVideoItem {
  videoId: string;
  title: string;
  channel: string;
  views: string;
  duration: string;
  thumbnail: string;
}

interface BrowserViewportProps {
  tab: BrowserTab;
  tabCount: number;
  extensions: ExtensionItem[];
  settings: BrowserSettings;
  isBookmarked: boolean;
  overlayOpen?: boolean;
  user: User | null;
  onGoogleLogin: () => void;
  onGoHome: () => void;
  onNavigate: (input: string) => void;
  onGoBack: () => void;
  onGoForward: () => void;
  onToggleBookmark: (title: string, url: string) => void;
  onRecordHistory: (title: string, url: string) => void;
  onDownloadPage: (filename: string, url: string) => void;
  onOpenTabsSheet: () => void;
  onOpenExtensions: () => void;
  onOpenOverflowMenu: () => void;
  onToggleDesktopMode: () => void;
}

function getSpecialMode(url: string): 'search' | 'google-home' | 'youtube-home' | 'youtube-video' | 'web' {
  if (url.startsWith('erto://search')) return 'search';
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '').toLowerCase();
    if (host === 'google.com' || host === 'google.co.id') {
      if ((u.pathname === '/' || u.pathname === '') && !u.searchParams.get('q')) {
        return 'google-home';
      }
      if (u.searchParams.get('q')) return 'search';
    }
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtu.be') {
      if (u.searchParams.get('v') || host === 'youtu.be' || u.pathname.includes('/shorts/')) {
        return 'youtube-video';
      }
      return 'youtube-home';
    }
  } catch {
    // ignore
  }
  return 'web';
}

function extractYouTubeId(urlStr: string): string | null {
  try {
    const u = new URL(urlStr);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('/')[0] || null;
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return v;
      const parts = u.pathname.split('/');
      const idx = parts.findIndex((p) => p === 'embed' || p === 'shorts');
      if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];
    }
  } catch {
    return null;
  }
  return null;
}

export function BrowserViewport({
  tab,
  tabCount,
  extensions,
  settings,
  isBookmarked,
  overlayOpen = false,
  user,
  onGoogleLogin,
  onGoHome,
  onNavigate,
  onGoBack,
  onGoForward,
  onToggleBookmark,
  onRecordHistory,
  onDownloadPage,
  onOpenTabsSheet,
  onOpenExtensions,
  onOpenOverflowMenu,
  onToggleDesktopMode,
}: BrowserViewportProps) {
  const nativeApk = isNativeAndroidApk();
  const headerRef = useRef<HTMLElement>(null);
  const [addressInput, setAddressInput] = useState(tab.query || tab.url);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [googleInput, setGoogleInput] = useState('');
  const [ytQuery, setYtQuery] = useState('');
  const [ytVideos, setYtVideos] = useState<YouTubeVideoItem[]>([]);
  const [activeYtVideo, setActiveYtVideo] = useState<YouTubeVideoItem | null>(null);
  const [translatedBody, setTranslatedBody] = useState<{ title: string; html: string } | null>(null);
  const [translating, setTranslating] = useState(false);
  const [translateLang, setTranslateLang] = useState<'id' | 'en'>('id');
  const [reloadNonce, setReloadNonce] = useState(0);
  const [pageTitle, setPageTitle] = useState(tab.title);
  const [nativeCanGoBack, setNativeCanGoBack] = useState(false);
  const [nativeCanGoForward, setNativeCanGoForward] = useState(false);
  const [sponsorSegments, setSponsorSegments] = useState<Array<{ category: string; segment: [number, number] }>>([]);

  const isExtensionActive = useCallback(
    (id: string) => {
      const ext = extensions.find((e) => e.id === id);
      return Boolean(ext && ext.installed && ext.enabled);
    },
    [extensions]
  );

  const adBlockActive =
    settings.adShieldBuiltIn || isExtensionActive('ublock-origin') || isExtensionActive('adblock');
  const darkReaderActive = settings.forceDarkWeb || isExtensionActive('dark-reader');
  const translateExtActive = isExtensionActive('google-translate');
  const sponsorBlockActive = isExtensionActive('sponsorblock');
  const activeExtCount = extensions.filter((e) => e.installed && e.enabled).length;

  const mode = nativeApk ? 'web' : getSpecialMode(tab.url);

  const resolveNativeTargetUrl = useCallback(
    (rawUrl: string) => {
      if (!rawUrl.startsWith('erto://search')) return rawUrl;
      let q = tab.query || '';
      if (!q) {
        try {
          q = new URL(rawUrl.replace('erto://', 'https://erto.local/')).searchParams.get('q') || '';
        } catch {}
      }
      const enc = encodeURIComponent(q);
      if (settings.searchEngine === 'duckduckgo') return `https://duckduckgo.com/?q=${enc}`;
      if (settings.searchEngine === 'bing') return `https://www.bing.com/search?q=${enc}`;
      if (settings.searchEngine === 'yahoo') return `https://search.yahoo.com/search?p=${enc}`;
      return `https://www.google.com/search?q=${enc}`;
    },
    [settings.searchEngine, tab.query]
  );

  // Sync address bar & listen to iframe navigation messages
  useEffect(() => {
    setAddressInput(tab.url.startsWith('erto://search') ? tab.query || '' : tab.url);
    setPageTitle(tab.title);
    setTranslatedBody(null);
  }, [tab.url, tab.query, tab.title]);

  // Native Android WebView lifecycle & pageState events
  useEffect(() => {
    if (!nativeApk) return;
    let listenerHandle: { remove: () => Promise<void> } | null = null;
    ErtoWebView.addListener('pageState', (state) => {
      setLoading(state.loading);
      if (state.url) setAddressInput(state.url);
      if (state.title) setPageTitle(state.title);
      setNativeCanGoBack(Boolean(state.canGoBack));
      setNativeCanGoForward(Boolean(state.canGoForward));
      if (!state.loading && state.url) {
        onRecordHistory(state.title || state.url, state.url);
      }
    })
      .then((h) => {
        listenerHandle = h;
      })
      .catch(() => {});

    return () => {
      listenerHandle?.remove().catch(() => {});
      ErtoWebView.hide().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nativeApk]);

  useEffect(() => {
    if (!nativeApk) return;
    if (overlayOpen || translatedBody) {
      ErtoWebView.hide().catch(() => {});
      return;
    }
    const targetUrl = resolveNativeTargetUrl(tab.url);
    const headerRect = headerRef.current?.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const topOffsetPx = Math.round((headerRect ? headerRect.bottom : 96) * dpr);

    ErtoWebView.open({
      url: targetUrl,
      topOffsetPx,
      adblock: adBlockActive,
      dark: darkReaderActive,
      desktop: tab.desktopMode,
      forceReload: reloadNonce > 0,
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nativeApk, tab.url, overlayOpen, translatedBody, reloadNonce]);

  useEffect(() => {
    if (!nativeApk || overlayOpen || translatedBody) return;
    const headerRect = headerRef.current?.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const topOffsetPx = Math.round((headerRect ? headerRect.bottom : 96) * dpr);
    ErtoWebView.setOptions({
      adblock: adBlockActive,
      dark: darkReaderActive,
      desktop: tab.desktopMode,
      topOffsetPx,
    }).catch(() => {});
  }, [nativeApk, overlayOpen, translatedBody, adBlockActive, darkReaderActive, tab.desktopMode]);

  useEffect(() => {
    const onMessage = (ev: MessageEvent) => {
      if (!ev.data || typeof ev.data !== 'object') return;
      if (ev.data.type === 'erto-navigate' && typeof ev.data.url === 'string') {
        onNavigate(ev.data.url);
      } else if (ev.data.type === 'erto-loaded') {
        setLoading(false);
        if (typeof ev.data.title === 'string' && ev.data.title.trim()) {
          setPageTitle(ev.data.title.trim());
          onRecordHistory(ev.data.title.trim(), tab.url);
        }
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [onNavigate, onRecordHistory, tab.url]);

  // Load search / YouTube / iframe content (when not handled by native Android WebView)
  useEffect(() => {
    if (nativeApk) return;
    let cancelled = false;
    setTranslatedBody(null);

    if (mode === 'search') {
      setLoading(true);
      let q = tab.query || '';
      if (!q && tab.url.includes('q=')) {
        try {
          q = new URL(tab.url).searchParams.get('q') || '';
        } catch {}
      }
      fetch(apiUrl(`/api/search?q=${encodeURIComponent(q)}&engine=${encodeURIComponent(settings.searchEngine)}`))
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((data) => {
          if (!cancelled) {
            setSearchResults(data.results || []);
            onRecordHistory(`Cari: ${q}`, tab.url);
          }
        })
        .catch(async () => {
          const fallback: SearchResult[] = [];
          try {
            const wr = await fetch(
              `https://id.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(q)}&limit=5&namespace=0&format=json&origin=*`
            );
            if (wr.ok) {
              const wd = await wr.json();
              if (Array.isArray(wd?.[1])) {
                wd[1].forEach((t: string, idx: number) => {
                  if (wd[3]?.[idx]) {
                    fallback.push({
                      title: `${t} — Wikipedia`,
                      url: wd[3][idx],
                      domain: 'id.wikipedia.org',
                      snippet: wd[2]?.[idx] || '',
                      source: 'Wikipedia',
                    });
                  }
                });
              }
            }
          } catch {}
          if (!cancelled) setSearchResults(fallback);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }

    if (mode === 'youtube-home' || mode === 'youtube-video') {
      setSearchResults(null);
      setLoading(true);
      const vid = extractYouTubeId(tab.url);
      if (vid) {
        setActiveYtVideo({
          videoId: vid,
          title: tab.title || 'YouTube Video',
          channel: 'YouTube',
          views: '',
          duration: '',
          thumbnail: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
        });
      } else {
        setActiveYtVideo(null);
      }

      let q = '';
      try {
        q = new URL(tab.url).searchParams.get('search_query') || '';
      } catch {}
      setYtQuery(q);

      fetch(apiUrl(`/api/youtube?q=${encodeURIComponent(q || 'trending indonesia')}`))
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((data) => {
          if (!cancelled) {
            setYtVideos(data.videos || []);
            onRecordHistory(q ? `YouTube: ${q}` : 'YouTube', tab.url);
          }
        })
        .catch(() => {
          if (!cancelled) setYtVideos([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }

    if (mode === 'google-home') {
      setSearchResults(null);
      setLoading(false);
      onRecordHistory('Google', tab.url);
      return;
    }

    // Standard full web reverse-proxy frame
    setSearchResults(null);
    setLoading(true);
    onRecordHistory(tab.title || tab.url, tab.url);
    const timer = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 3500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab.url, tab.query, mode, reloadNonce]);

  useEffect(() => {
    if (!sponsorBlockActive || !activeYtVideo?.videoId) {
      setSponsorSegments([]);
      return;
    }
    let cancelled = false;
    fetch(apiUrl(`/api/sponsorblock?videoId=${encodeURIComponent(activeYtVideo.videoId)}`))
      .then((r) => (r.ok ? r.json() : { segments: [] }))
      .then((d) => {
        if (!cancelled) setSponsorSegments(Array.isArray(d.segments) ? d.segments : []);
      })
      .catch(() => {
        if (!cancelled) setSponsorSegments([]);
      });
    return () => {
      cancelled = true;
    };
  }, [sponsorBlockActive, activeYtVideo?.videoId]);

  const handleSubmitAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressInput.trim()) return;
    onNavigate(addressInput.trim());
  };

  const handleTranslateActivePage = async (targetLang: 'id' | 'en') => {
    if (translating) return;
    setTranslateLang(targetLang);
    setTranslating(true);
    try {
      const browseRes = await fetch(
        apiUrl(`/api/browse?url=${encodeURIComponent(tab.url)}&adblock=${adBlockActive ? '1' : '0'}`)
      );
      const data = await browseRes.json();
      if (!data.bodyHtml) {
        setTranslating(false);
        return;
      }
      const parser = new DOMParser();
      const doc = parser.parseFromString(data.bodyHtml, 'text/html');
      const nodes = Array.from(doc.querySelectorAll('h1, h2, h3, p, li')).slice(0, 24);
      const texts = nodes.map((n) => (n.textContent || '').trim()).filter((t) => t.length > 3);
      if (texts.length > 0) {
        const trRes = await fetch(apiUrl('/api/translate'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texts, targetLang }),
        });
        const trData = await trRes.json();
        const translated: string[] = trData.translations || [];
        let idx = 0;
        nodes.forEach((n) => {
          const orig = (n.textContent || '').trim();
          if (orig.length > 3 && translated[idx]) {
            n.textContent = translated[idx];
            idx += 1;
          }
        });
      }
      setTranslatedBody({ title: data.title || pageTitle, html: doc.body.innerHTML });
    } catch {
      // ignore
    } finally {
      setTranslating(false);
    }
  };

  const canGoBack = nativeApk ? nativeCanGoBack : tab.historyIndex > 0;
  const canGoForward = nativeApk ? nativeCanGoForward : tab.historyIndex < tab.historyStack.length - 1;
  const frameSrc = apiUrl(
    `/api/frame?url=${encodeURIComponent(tab.url)}&adblock=${
      adBlockActive ? '1' : '0'
    }&dark=${darkReaderActive ? '1' : '0'}&desktop=${tab.desktopMode ? '1' : '0'}&r=${reloadNonce}`
  );

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900">
      {/* Compact Browser Top Chrome */}
      <header
        ref={headerRef}
        className={`shrink-0 px-2.5 pt-2 pb-2 border-b shadow-sm ${
          tab.incognito
            ? 'bg-slate-900 border-slate-800 text-white'
            : 'bg-[#043b12] border-[#1b7a30] text-white'
        }`}
      >
        <div className="max-w-6xl mx-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={onGoHome}
            aria-label="Beranda"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl hover:bg-white/10 active:scale-95 transition shrink-0"
          >
            <Home className="w-5 h-5" />
          </button>

          <form
            onSubmit={handleSubmitAddress}
            className="flex-1 min-w-0 bg-white/95 text-slate-900 rounded-full h-10 px-3 flex items-center gap-2 shadow-inner"
          >
            {tab.incognito ? (
              <EyeOff className="w-4 h-4 text-amber-600 shrink-0" />
            ) : (
              <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
            )}
            <input
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              placeholder="Search or type URL"
              className="flex-1 min-w-0 bg-transparent text-xs sm:text-sm font-medium text-slate-900 outline-none"
            />
            <button
              type="button"
              onClick={() => (nativeApk ? ErtoWebView.reload() : setReloadNonce((n) => n + 1))}
              aria-label="Muat Ulang"
              className="p-1 text-slate-600 hover:text-emerald-700"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-700' : ''}`} />
            </button>
          </form>

          <button
            type="button"
            onClick={onOpenTabsSheet}
            aria-label={`Tab (${tabCount})`}
            className="min-w-[38px] min-h-[40px] flex items-center justify-center rounded-xl hover:bg-white/10 shrink-0"
          >
            <div className="w-5 h-5 rounded border-2 border-white text-[10px] font-extrabold flex items-center justify-center tabular-nums">
              {tabCount}
            </div>
          </button>

          <button
            type="button"
            onClick={onOpenExtensions}
            aria-label="Ekstensi"
            className="relative min-w-[38px] min-h-[40px] flex items-center justify-center rounded-xl hover:bg-white/10 shrink-0"
          >
            <Puzzle className="w-5 h-5" />
            {activeExtCount > 0 && (
              <span className="absolute top-1.5 right-1 w-2 h-2 rounded-full bg-[#a3e635]" />
            )}
          </button>

          <button
            type="button"
            onClick={onOpenOverflowMenu}
            aria-label="Menu Browser"
            className="min-w-[36px] min-h-[40px] flex items-center justify-center rounded-xl hover:bg-white/10 shrink-0"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        {/* Active Extensions Strip & Navigation Controls */}
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 mt-1.5 px-1 text-[11px] overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              disabled={!canGoBack}
              onClick={() => (nativeApk ? ErtoWebView.goBack() : onGoBack())}
              className="inline-flex items-center gap-1 text-white/90 disabled:opacity-35 hover:text-[#fde047] py-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Mundur</span>
            </button>
            <button
              type="button"
              disabled={!canGoForward}
              onClick={() => (nativeApk ? ErtoWebView.goForward() : onGoForward())}
              className="inline-flex items-center gap-1 text-white/90 disabled:opacity-35 hover:text-[#fde047] py-1"
            >
              <span>Maju</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            {adBlockActive && (
              <span className="inline-flex items-center gap-1 text-[#a3e635] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                AdBlock Aktif
              </span>
            )}
            {darkReaderActive && (
              <span className="inline-flex items-center gap-1 text-sky-300 font-semibold">
                <Moon className="w-3.5 h-3.5" />
                Dark Reader
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {translateExtActive && mode === 'web' && (
              <button
                type="button"
                disabled={translating}
                onClick={() =>
                  translatedBody
                    ? setTranslatedBody(null)
                    : handleTranslateActivePage(translateLang === 'id' ? 'en' : 'id')
                }
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#a3e635] text-[#052e0d] font-bold hover:bg-[#bef264] transition"
              >
                <Languages className="w-3.5 h-3.5" />
                {translating
                  ? 'Menerjemahkan...'
                  : translatedBody
                  ? 'Lihat Asli'
                  : 'Terjemahkan'}
              </button>
            )}
            <button
              type="button"
              onClick={onToggleDesktopMode}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg transition ${
                tab.desktopMode ? 'bg-white/20 text-[#fde047] font-bold' : 'text-white/85 hover:bg-white/10'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>{tab.desktopMode ? 'Desktop' : 'Mobile'}</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleBookmark(pageTitle, tab.url)}
              aria-label="Bookmark Halaman"
              className="p-1 text-white/90 hover:text-[#fde047]"
            >
              <Star className={`w-4 h-4 ${isBookmarked ? 'fill-[#fde047] text-[#fde047]' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() =>
                onDownloadPage(
                  `${(pageTitle || 'halaman').replace(/[^a-z0-9.-]/gi, '_')}.html`,
                  tab.url
                )
              }
              aria-label="Unduh Halaman"
              className="p-1 text-white/90 hover:text-[#fde047]"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading && (
          <div className="h-0.5 w-full bg-emerald-950 overflow-hidden mt-1 rounded-full">
            <div className="h-full w-1/2 bg-[#a3e635] animate-pulse rounded-full" />
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main
        className={`flex-1 flex flex-col overflow-hidden ${
          darkReaderActive ? 'bg-[#0b1220] text-slate-100' : 'bg-white text-slate-900'
        }`}
      >
        {/* 1. In-App Google Homepage (with real Google Login integration!) */}
        {mode === 'google-home' ? (
          <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-lg space-y-6 text-center">
              <div className="flex justify-end">
                {user ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-slate-800 text-xs font-semibold">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || 'Google'}
                        referrerPolicy="no-referrer"
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <UserIcon className="w-4 h-4 text-emerald-700" />
                    )}
                    <span className="truncate max-w-[160px]">{user.displayName || user.email}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={onGoogleLogin}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition"
                  >
                    <GoogleGLogo className="w-4 h-4 bg-white rounded-full p-0.5" />
                    <span>Login Google</span>
                  </button>
                )}
              </div>

              <div className="text-4xl sm:text-5xl font-extrabold tracking-tight select-none">
                <span className="text-[#4285F4]">G</span>
                <span className="text-[#EA4335]">o</span>
                <span className="text-[#FBBC05]">o</span>
                <span className="text-[#4285F4]">g</span>
                <span className="text-[#34A853]">l</span>
                <span className="text-[#EA4335]">e</span>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!googleInput.trim()) return;
                  onNavigate(googleInput.trim());
                }}
                className="flex items-center gap-2 rounded-full border border-slate-300 bg-white text-slate-900 px-4 h-12 shadow-sm focus-within:ring-2 focus-within:ring-blue-500"
              >
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={googleInput}
                  onChange={(e) => setGoogleInput(e.target.value)}
                  placeholder="Telusuri di Google atau ketik URL"
                  className="flex-1 bg-transparent text-sm outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-full bg-blue-600 text-white text-xs font-bold"
                >
                  Cari
                </button>
              </form>
            </div>
          </div>
        ) : mode === 'youtube-home' || mode === 'youtube-video' ? (
          /* 2. In-App Real YouTube Video Browser & Inline Player */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="max-w-4xl mx-auto space-y-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onNavigate(
                    `https://www.youtube.com/results?search_query=${encodeURIComponent(
                      ytQuery.trim() || 'trending indonesia'
                    )}`
                  );
                }}
                className="flex items-center gap-2"
              >
                <div className="flex-1 flex items-center gap-2 rounded-full border border-slate-300 bg-white text-slate-900 px-4 h-11">
                  <Search className="w-4 h-4 text-red-600 shrink-0" />
                  <input
                    type="text"
                    value={ytQuery}
                    onChange={(e) => setYtQuery(e.target.value)}
                    placeholder="Cari video di YouTube..."
                    className="flex-1 bg-transparent text-sm outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 h-11 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold shrink-0"
                >
                  Cari
                </button>
              </form>

              {activeYtVideo && (
                <div className="space-y-2">
                  <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-lg">
                    <iframe
                      title={activeYtVideo.title}
                      src={`https://www.youtube.com/embed/${activeYtVideo.videoId}?autoplay=1`}
                      className="w-full h-full border-0"
                      allow="autoplay; encrypted-media; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  <h2 className="text-base sm:text-lg font-bold">{activeYtVideo.title}</h2>
                  <p className="text-xs opacity-75">
                    {activeYtVideo.channel} {activeYtVideo.views ? `· ${activeYtVideo.views}` : ''}
                  </p>
                  {sponsorBlockActive && sponsorSegments.length > 0 && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-900">
                      <span className="font-bold">SponsorBlock Aktif:</span>{' '}
                      {sponsorSegments
                        .map(
                          (s) =>
                            `${s.category} (${Math.floor(s.segment[0])}s–${Math.floor(s.segment[1])}s)`
                        )
                        .join(', ')}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {ytVideos.map((v) => (
                  <button
                    key={v.videoId}
                    type="button"
                    onClick={() => {
                      setActiveYtVideo(v);
                      onRecordHistory(v.title, `https://www.youtube.com/watch?v=${v.videoId}`);
                    }}
                    className={`text-left rounded-2xl overflow-hidden border transition hover:border-red-500 ${
                      darkReaderActive ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="relative aspect-video bg-slate-900">
                      <img
                        src={v.thumbnail}
                        alt={v.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="w-10 h-10 rounded-full bg-red-600/90 text-white flex items-center justify-center">
                          <Play className="w-5 h-5 fill-white ml-0.5" />
                        </div>
                      </div>
                      {v.duration && (
                        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-mono">
                          {v.duration}
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="text-xs sm:text-sm font-bold line-clamp-2 leading-snug">
                        {v.title}
                      </h3>
                      <p className="text-[11px] opacity-70 mt-1 truncate">
                        {v.channel} {v.views ? `· ${v.views}` : ''}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : mode === 'search' ? (
          /* 3. Live Web Search Results Inside Erto Browser */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-slate-200/20">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-emerald-600" />
                  <h2 className="text-sm font-bold">Hasil pencarian untuk “{tab.query}”</h2>
                </div>
                <span className="text-xs opacity-70 capitalize">Mesin: {settings.searchEngine}</span>
              </div>

              <div className="space-y-3">
                {(searchResults || []).map((item) => (
                  <article
                    key={item.url}
                    onClick={() => onNavigate(item.url)}
                    className={`p-4 rounded-2xl border transition cursor-pointer ${
                      darkReaderActive
                        ? 'bg-slate-900 border-slate-800 hover:border-emerald-500/50'
                        : 'bg-slate-50/70 border-slate-200/80 hover:border-emerald-500'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs opacity-75 mb-1">
                      <span className="font-mono truncate">{item.domain}</span>
                      <span>·</span>
                      <span>{item.source}</span>
                    </div>
                    <h3
                      className={`text-base font-bold leading-snug ${
                        darkReaderActive ? 'text-emerald-400' : 'text-emerald-800'
                      }`}
                    >
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm opacity-80 mt-1 line-clamp-2">{item.snippet}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        ) : translatedBody ? (
          /* 4. Live Translated Reader View (when Google Translate extension is clicked) */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="max-w-4xl mx-auto space-y-3">
              <div className="rounded-xl bg-emerald-100 text-emerald-950 px-3.5 py-2 text-xs font-bold flex items-center justify-between">
                <span>Diterjemahkan otomatis oleh Google Translate</span>
                <button
                  type="button"
                  onClick={() => setTranslatedBody(null)}
                  className="underline"
                >
                  Kembali ke halaman penuh
                </button>
              </div>
              <h1 className="text-xl font-extrabold">{translatedBody.title}</h1>
              <div
                className="prose max-w-none [&_img]:max-w-full [&_img]:rounded-xl [&_p]:my-2"
                dangerouslySetInnerHTML={{ __html: translatedBody.html }}
              />
            </div>
          </div>
        ) : nativeApk ? (
          /* 5a. Native Android WebView occupies this area below the top header */
          <div className="flex-1 flex items-center justify-center bg-white text-slate-600 text-xs">
            Memuat {addressInput}...
          </div>
        ) : (
          /* 5b. Full Real Webpage Frame via /api/frame Reverse Proxy (Web/PWA mode) */
          <iframe
            key={frameSrc}
            title={pageTitle || tab.url}
            src={frameSrc}
            onLoad={() => setLoading(false)}
            className="w-full flex-1 border-0 bg-white"
            sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
          />
        )}
      </main>
    </div>
  );
}
