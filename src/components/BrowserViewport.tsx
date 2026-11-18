import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  ExternalLink,
  Search,
  AlertCircle,
  EyeOff,
} from 'lucide-react';
import { BrowserSettings, BrowserTab, ExtensionItem } from '../types/browser';

interface SearchResult {
  title: string;
  url: string;
  domain: string;
  snippet: string;
  source: string;
}

interface BrowsePayload {
  url: string;
  finalUrl: string;
  domain: string;
  title: string;
  description: string;
  favicon: string;
  blockedCount: number;
  youtubeEmbedId?: string;
  restricted?: boolean;
  status: number;
  bodyHtml: string;
  links: { text: string; url: string }[];
  error?: string;
}

interface BrowserViewportProps {
  tab: BrowserTab;
  tabCount: number;
  extensions: ExtensionItem[];
  settings: BrowserSettings;
  isBookmarked: boolean;
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

export function BrowserViewport({
  tab,
  tabCount,
  extensions,
  settings,
  isBookmarked,
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
  const [addressInput, setAddressInput] = useState(tab.query || tab.url);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [pageData, setPageData] = useState<BrowsePayload | null>(null);
  const [translatedHtml, setTranslatedHtml] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [translateLang, setTranslateLang] = useState<'id' | 'en'>('id');
  const [reloadNonce, setReloadNonce] = useState(0);

  const contentRef = useRef<HTMLDivElement>(null);

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
  const activeExtCount = extensions.filter((e) => e.installed && e.enabled).length;

  useEffect(() => {
    setAddressInput(tab.url.startsWith('erto://search') ? tab.query || '' : tab.url);
    setTranslatedHtml(null);
  }, [tab.url, tab.query]);

  useEffect(() => {
    let cancelled = false;
    async function loadContent() {
      setLoading(true);
      setTranslatedHtml(null);

      if (tab.url.startsWith('erto://search')) {
        setPageData(null);
        const q = tab.query || '';
        try {
          const res = await fetch(
            `/api/search?q=${encodeURIComponent(q)}&engine=${encodeURIComponent(settings.searchEngine)}`
          );
          if (!res.ok) throw new Error('Backend search unavailable');
          const data = await res.json();
          if (!cancelled) {
            setSearchResults(data.results || []);
            onRecordHistory(`Cari: ${q}`, tab.url);
          }
        } catch {
          // Client-side CORS fallback for static hosting (e.g. GitHub Pages)
          const fallbackResults: SearchResult[] = [];
          try {
            const wikiRes = await fetch(
              `https://id.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(q)}&limit=5&namespace=0&format=json&origin=*`
            );
            if (wikiRes.ok) {
              const wikiData = await wikiRes.json();
              if (Array.isArray(wikiData) && Array.isArray(wikiData[1])) {
                wikiData[1].forEach((title: string, idx: number) => {
                  const url = wikiData[3]?.[idx];
                  if (url) {
                    fallbackResults.push({
                      title: `${title} — Wikipedia`,
                      url,
                      domain: 'id.wikipedia.org',
                      snippet: wikiData[2]?.[idx] || `Artikel Wikipedia tentang ${title}.`,
                      source: 'Wikipedia',
                    });
                  }
                });
              }
            }
          } catch {
            // ignore
          }
          fallbackResults.push(
            {
              title: `Cari "${q}" di Google`,
              url: `https://www.google.com/search?q=${encodeURIComponent(q)}`,
              domain: 'google.com',
              snippet: `Buka hasil pencarian Google untuk "${q}".`,
              source: 'Google',
            },
            {
              title: `Cari "${q}" di YouTube`,
              url: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
              domain: 'youtube.com',
              snippet: `Tonton video terkait "${q}" di YouTube.`,
              source: 'YouTube',
            }
          );
          if (!cancelled) {
            setSearchResults(fallbackResults);
            onRecordHistory(`Cari: ${q}`, tab.url);
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
        return;
      }

      setSearchResults(null);
      try {
        const res = await fetch(
          `/api/browse?url=${encodeURIComponent(tab.url)}&adblock=${adBlockActive ? '1' : '0'}&desktop=${
            tab.desktopMode ? '1' : '0'
          }`
        );
        if (!res.ok) throw new Error('Backend proxy unavailable');
        const data: BrowsePayload = await res.json();
        if (!cancelled) {
          setPageData(data);
          if (data.title) {
            onRecordHistory(data.title, data.finalUrl || tab.url);
          }
        }
      } catch {
        // Static hosting fallback: render Wikipedia summaries via CORS-enabled API or direct link card
        let fallbackPayload: BrowsePayload = {
          url: tab.url,
          finalUrl: tab.url,
          domain: tab.url,
          title: tab.title || tab.url,
          description: 'Mode statis aktif: ketuk "Buka Tautan Langsung" untuk membuka situs di tab browser perangkat Anda.',
          favicon: '',
          blockedCount: 0,
          restricted: true,
          status: 200,
          bodyHtml: '',
          links: [],
        };
        try {
          const parsed = new URL(tab.url);
          fallbackPayload.domain = parsed.hostname;
          if (parsed.hostname.includes('wikipedia.org')) {
            const slug = parsed.pathname.split('/wiki/')[1];
            if (slug) {
              const lang = parsed.hostname.split('.')[0] || 'id';
              const summaryRes = await fetch(
                `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(decodeURIComponent(slug))}`
              );
              if (summaryRes.ok) {
                const s = await summaryRes.json();
                fallbackPayload = {
                  url: tab.url,
                  finalUrl: tab.url,
                  domain: parsed.hostname,
                  title: s.title || parsed.hostname,
                  description: s.description || '',
                  favicon: '',
                  blockedCount: adBlockActive ? 2 : 0,
                  restricted: false,
                  status: 200,
                  bodyHtml: `${s.thumbnail?.source ? `<img src="${s.thumbnail.source}" alt="${s.title}" />` : ''}<p>${s.extract || ''}</p>`,
                  links: [],
                };
              }
            }
          }
        } catch {
          // ignore
        }
        if (!cancelled) {
          setPageData(fallbackPayload);
          onRecordHistory(fallbackPayload.title, tab.url);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadContent();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab.url, tab.query, tab.desktopMode, adBlockActive, reloadNonce]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressInput.trim()) return;
    onNavigate(addressInput.trim());
  };

  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const anchor = (e.target as HTMLElement).closest('a');
    if (anchor) {
      const href = anchor.getAttribute('href');
      if (href && href.startsWith('http')) {
        e.preventDefault();
        onNavigate(href);
      }
    }
  };

  const handleTranslatePage = async (target: 'id' | 'en') => {
    if (!pageData?.bodyHtml || translating) return;
    setTranslateLang(target);
    setTranslating(true);
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(pageData.bodyHtml, 'text/html');
      const nodes = Array.from(doc.querySelectorAll('h1, h2, h3, p, li')).slice(0, 24);
      const texts = nodes.map((n) => (n.textContent || '').trim()).filter((t) => t.length > 3);
      if (texts.length === 0) {
        setTranslating(false);
        return;
      }
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts, targetLang: target }),
      });
      const data = await res.json();
      const translated: string[] = data.translations || [];
      let idx = 0;
      nodes.forEach((n) => {
        const orig = (n.textContent || '').trim();
        if (orig.length > 3 && translated[idx]) {
          n.textContent = translated[idx];
          idx += 1;
        }
      });
      setTranslatedHtml(doc.body.innerHTML);
    } catch {
      // ignore
    } finally {
      setTranslating(false);
    }
  };

  const textSizeClass =
    settings.textSize === 'kecil'
      ? 'text-[13px]'
      : settings.textSize === 'besar'
      ? 'text-[17px]'
      : 'text-[15px]';

  const canGoBack = tab.historyIndex > 0;
  const canGoForward = tab.historyIndex < tab.historyStack.length - 1;
  const displayTitle = searchResults
    ? `Hasil Pencarian: ${tab.query}`
    : pageData?.title || tab.title;

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900">
      {/* Compact Browser Top Chrome */}
      <header
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
            onSubmit={handleSubmit}
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
              onClick={() => setReloadNonce((n) => n + 1)}
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

        {/* Active Extensions Strip & Quick Browser Actions */}
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 mt-1.5 px-1 text-[11px] overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              disabled={!canGoBack}
              onClick={onGoBack}
              className="inline-flex items-center gap-1 text-white/90 disabled:opacity-35 hover:text-[#fde047] py-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Mundur</span>
            </button>
            <button
              type="button"
              disabled={!canGoForward}
              onClick={onGoForward}
              className="inline-flex items-center gap-1 text-white/90 disabled:opacity-35 hover:text-[#fde047] py-1"
            >
              <span>Maju</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            {adBlockActive && (
              <span className="inline-flex items-center gap-1 text-[#a3e635] font-semibold tabular-nums">
                <ShieldCheck className="w-3.5 h-3.5" />
                {pageData?.blockedCount || 0} diblokir
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
            {translateExtActive && pageData?.bodyHtml && (
              <button
                type="button"
                disabled={translating}
                onClick={() => handleTranslatePage(translateLang === 'id' ? 'en' : 'id')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#a3e635] text-[#052e0d] font-bold hover:bg-[#bef264] transition"
              >
                <Languages className="w-3.5 h-3.5" />
                {translating
                  ? 'Menerjemahkan...'
                  : translatedHtml
                  ? translateLang === 'id'
                    ? 'Terjemahan: ID'
                    : 'Translate: EN'
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
              onClick={() => onToggleBookmark(displayTitle, tab.url)}
              aria-label="Bookmark Halaman"
              className="p-1 text-white/90 hover:text-[#fde047]"
            >
              <Star className={`w-4 h-4 ${isBookmarked ? 'fill-[#fde047] text-[#fde047]' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() =>
                onDownloadPage(
                  `${(pageData?.domain || 'halaman').replace(/[^a-z0-9.-]/gi, '_')}.html`,
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

        {/* Loading Progress Bar */}
        {loading && (
          <div className="h-0.5 w-full bg-emerald-950 overflow-hidden mt-1 rounded-full">
            <div className="h-full w-1/2 bg-[#a3e635] animate-pulse rounded-full" />
          </div>
        )}
      </header>

      {/* Main Web Content Area */}
      <main
        className={`flex-1 overflow-y-auto transition-colors ${
          darkReaderActive ? 'bg-[#0b1220] text-slate-100' : 'bg-white text-slate-900'
        }`}
      >
        <div className={`max-w-4xl mx-auto p-4 sm:p-6 ${textSizeClass}`}>
          {/* Search Results View */}
          {searchResults !== null ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-slate-200/20">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-emerald-600" />
                  <h2 className="text-sm font-bold">
                    Hasil pencarian untuk “{tab.query}”
                  </h2>
                </div>
                <span className="text-xs opacity-70 capitalize">Mesin: {settings.searchEngine}</span>
              </div>

              {loading ? (
                <div className="space-y-3 py-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-24 rounded-xl animate-pulse ${
                        darkReaderActive ? 'bg-slate-800' : 'bg-slate-100'
                      }`}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResults.map((item) => (
                    <article
                      key={item.url}
                      className={`p-4 rounded-2xl border transition cursor-pointer ${
                        darkReaderActive
                          ? 'bg-slate-900 border-slate-800 hover:border-emerald-500/50'
                          : 'bg-slate-50/70 border-slate-200/80 hover:border-emerald-500'
                      }`}
                      onClick={() => onNavigate(item.url)}
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
              )}
            </div>
          ) : loading && !pageData ? (
            <div className="py-16 text-center space-y-3">
              <RotateCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-sm font-semibold">Memuat {tab.url}...</p>
            </div>
          ) : pageData?.youtubeEmbedId ? (
            <div className="space-y-4">
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-lg">
                <iframe
                  title={pageData.title}
                  src={`https://www.youtube.com/embed/${pageData.youtubeEmbedId}`}
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">{pageData.title}</h2>
                  <p className="text-xs opacity-75">{pageData.finalUrl}</p>
                </div>
                <a
                  href={pageData.finalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold shrink-0"
                >
                  <span>Buka Asli</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ) : pageData?.restricted || !pageData?.bodyHtml ? (
            <div
              className={`rounded-2xl p-6 border space-y-4 ${
                darkReaderActive ? 'bg-slate-900 border-slate-800' : 'bg-emerald-50/70 border-emerald-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h2 className="text-base font-bold">{pageData?.title || tab.url}</h2>
                  <p className="text-xs sm:text-sm opacity-80">
                    {pageData?.description ||
                      'Situs ini menerapkan proteksi anti-embed/bot. Anda dapat menelusuri informasinya lewat pencarian web atau membukanya langsung.'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => onNavigate(pageData?.domain || tab.url)}
                  className="px-4 py-2.5 rounded-xl bg-[#15803d] text-white text-xs font-bold hover:bg-[#166534] transition"
                >
                  Cari di Web
                </button>
                <a
                  href={tab.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border transition ${
                    darkReaderActive
                      ? 'border-slate-700 text-slate-200 hover:bg-slate-800'
                      : 'border-emerald-300 text-emerald-900 bg-white hover:bg-emerald-50'
                  }`}
                >
                  <span>Buka Tautan Langsung</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Page Metadata Strip */}
              <div className="flex items-center justify-between gap-3 border-b pb-3 border-slate-200/20">
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-extrabold leading-snug truncate">
                    {pageData.title}
                  </h1>
                  <p className="text-xs opacity-70 font-mono truncate">{pageData.finalUrl}</p>
                </div>
                <a
                  href={pageData.finalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-emerald-600/30 text-xs font-bold shrink-0 hover:bg-emerald-600/10"
                >
                  <span>Asli</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Rendered Live Web Content */}
              <div
                ref={contentRef}
                onClick={handleContentClick}
                className={`prose max-w-none break-words [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-xl [&_a]:underline [&_a]:font-medium [&_h1]:text-xl [&_h1]:font-bold [&_h1]:my-3 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:my-2.5 [&_p]:my-2 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-1 ${
                  darkReaderActive
                    ? '[&_a]:text-emerald-400 text-slate-200'
                    : '[&_a]:text-emerald-700 text-slate-800'
                }`}
                dangerouslySetInnerHTML={{ __html: translatedHtml || pageData.bodyHtml }}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
