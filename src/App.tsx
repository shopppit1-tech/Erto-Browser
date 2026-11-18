import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  AppScreen,
  BookmarkItem,
  BrowserSettings,
  BrowserTab,
  DownloadItem,
  ExtensionItem,
  ExtensionSettings,
  HistoryItem,
} from './types/browser';
import {
  DEFAULT_BOOKMARKS,
  DEFAULT_BROWSER_SETTINGS,
  DEFAULT_DOWNLOADS,
  DEFAULT_EXTENSIONS,
  DEFAULT_EXTENSION_SETTINGS,
  DEFAULT_HISTORY,
  DEFAULT_TOP_SITES,
} from './data/defaults';
import { HomeView } from './components/HomeView';
import { ExtensionsView } from './components/ExtensionsView';
import { DownloadsView } from './components/DownloadsView';
import { HistoryView } from './components/HistoryView';
import { BookmarksView } from './components/BookmarksView';
import { SettingsView } from './components/SettingsView';
import { BrowserViewport } from './components/BrowserViewport';
import { BottomNav } from './components/BottomNav';
import {
  ChromeWebStoreModal,
  OverflowMenuModal,
  QrScannerModal,
  TabSwitcherModal,
  TopSitesModal,
  VoiceSearchModal,
} from './components/BrowserModals';
import { OfflineIndicator } from './components/PWAInstallUI';

function usePersistentState<T>(key: string, fallback: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // ignore storage quota errors
    }
  }, [key, state]);

  return [state, setState];
}

function isLikelyUrl(input: string): boolean {
  const trimmed = input.trim();
  if (/^https?:\/\//i.test(trimmed)) return true;
  if (trimmed.includes(' ')) return false;
  return /^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+(:\d+)?(\/.*)?$/.test(trimmed);
}

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('home');
  const [previousScreen, setPreviousScreen] = useState<AppScreen>('home');

  const [bookmarks, setBookmarks] = usePersistentState<BookmarkItem[]>(
    'erto_bookmarks_v1',
    DEFAULT_BOOKMARKS
  );
  const [history, setHistory] = usePersistentState<HistoryItem[]>(
    'erto_history_v1',
    DEFAULT_HISTORY
  );
  const [downloads, setDownloads] = usePersistentState<DownloadItem[]>(
    'erto_downloads_v1',
    DEFAULT_DOWNLOADS
  );
  const [extensions, setExtensions] = usePersistentState<ExtensionItem[]>(
    'erto_extensions_v1',
    DEFAULT_EXTENSIONS
  );
  const [extSettings, setExtSettings] = usePersistentState<ExtensionSettings>(
    'erto_ext_settings_v1',
    DEFAULT_EXTENSION_SETTINGS
  );
  const [settings, setSettings] = usePersistentState<BrowserSettings>(
    'erto_settings_v1',
    DEFAULT_BROWSER_SETTINGS
  );

  const [tabs, setTabs] = useState<BrowserTab[]>([
    {
      id: 'tab-1',
      title: 'Beranda',
      url: '',
      incognito: false,
      desktopMode: DEFAULT_BROWSER_SETTINGS.desktopDefault,
      historyStack: [],
      historyIndex: -1,
      createdAt: Date.now(),
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab-1');

  const [tabSheetOpen, setTabSheetOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [topSitesOpen, setTopSitesOpen] = useState(false);
  const [webStoreOpen, setWebStoreOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const activeTab = useMemo(
    () => tabs.find((t) => t.id === activeTabId) || tabs[0],
    [tabs, activeTabId]
  );

  const installedExtCount = useMemo(
    () => extensions.filter((e) => e.installed && e.enabled).length,
    [extensions]
  );

  const navigateScreen = useCallback(
    (next: AppScreen) => {
      setPreviousScreen(screen);
      setScreen(next);
    },
    [screen]
  );

  const openUrlInActiveTab = useCallback(
    (rawInput: string) => {
      const cleaned = rawInput.trim();
      if (!cleaned) return;

      let targetUrl = '';
      let query: string | undefined;
      let title = cleaned;

      if (cleaned.startsWith('erto://search')) {
        targetUrl = cleaned;
        try {
          const u = new URL(cleaned.replace('erto://', 'https://erto.local/'));
          query = u.searchParams.get('q') || '';
          title = `Cari: ${query}`;
        } catch {
          query = '';
        }
      } else if (isLikelyUrl(cleaned)) {
        targetUrl = /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`;
        try {
          title = new URL(targetUrl).hostname.replace(/^www\./, '');
        } catch {
          title = cleaned;
        }
      } else {
        query = cleaned;
        targetUrl = `erto://search?q=${encodeURIComponent(cleaned)}`;
        title = `Cari: ${cleaned}`;
      }

      setTabs((prev) =>
        prev.map((tab) => {
          if (tab.id !== activeTabId) return tab;
          const nextStack = tab.historyStack.slice(0, tab.historyIndex + 1).concat(targetUrl);
          return {
            ...tab,
            title,
            url: targetUrl,
            query,
            historyStack: nextStack,
            historyIndex: nextStack.length - 1,
          };
        })
      );

      setPreviousScreen(screen);
      setScreen('browser');
    },
    [activeTabId, screen]
  );

  const handleGoBackInBrowser = useCallback(() => {
    setTabs((prev) =>
      prev.map((tab) => {
        if (tab.id !== activeTabId || tab.historyIndex <= 0) return tab;
        const nextIdx = tab.historyIndex - 1;
        const nextUrl = tab.historyStack[nextIdx];
        let query: string | undefined;
        if (nextUrl.startsWith('erto://search')) {
          try {
            const u = new URL(nextUrl.replace('erto://', 'https://erto.local/'));
            query = u.searchParams.get('q') || '';
          } catch {
            query = '';
          }
        }
        return {
          ...tab,
          url: nextUrl,
          query,
          historyIndex: nextIdx,
        };
      })
    );
  }, [activeTabId]);

  const handleGoForwardInBrowser = useCallback(() => {
    setTabs((prev) =>
      prev.map((tab) => {
        if (tab.id !== activeTabId || tab.historyIndex >= tab.historyStack.length - 1) return tab;
        const nextIdx = tab.historyIndex + 1;
        const nextUrl = tab.historyStack[nextIdx];
        let query: string | undefined;
        if (nextUrl.startsWith('erto://search')) {
          try {
            const u = new URL(nextUrl.replace('erto://', 'https://erto.local/'));
            query = u.searchParams.get('q') || '';
          } catch {
            query = '';
          }
        }
        return {
          ...tab,
          url: nextUrl,
          query,
          historyIndex: nextIdx,
        };
      })
    );
  }, [activeTabId]);

  const handleNewTab = useCallback(
    (incognito: boolean) => {
      const newTab: BrowserTab = {
        id: `tab-${Date.now()}`,
        title: incognito ? 'Tab Penyamaran' : 'Beranda',
        url: '',
        incognito,
        desktopMode: settings.desktopDefault,
        historyStack: [],
        historyIndex: -1,
        createdAt: Date.now(),
      };
      setTabs((prev) => [...prev, newTab]);
      setActiveTabId(newTab.id);
      setScreen('home');
      showToast(incognito ? 'Mode Penyamaran aktif' : 'Tab baru dibuat');
    },
    [settings.desktopDefault, showToast]
  );

  const handleCloseTab = useCallback(
    (id: string) => {
      setTabs((prev) => {
        if (prev.length <= 1) {
          const resetTab: BrowserTab = {
            id: `tab-${Date.now()}`,
            title: 'Beranda',
            url: '',
            incognito: false,
            desktopMode: settings.desktopDefault,
            historyStack: [],
            historyIndex: -1,
            createdAt: Date.now(),
          };
          setActiveTabId(resetTab.id);
          setScreen('home');
          return [resetTab];
        }
        const filtered = prev.filter((t) => t.id !== id);
        if (id === activeTabId) {
          const next = filtered[filtered.length - 1];
          setActiveTabId(next.id);
          setScreen(next.url ? 'browser' : 'home');
        }
        return filtered;
      });
    },
    [activeTabId, settings.desktopDefault]
  );

  const handleSelectTab = useCallback(
    (id: string) => {
      setActiveTabId(id);
      const target = tabs.find((t) => t.id === id);
      if (target) {
        setScreen(target.url ? 'browser' : 'home');
      }
    },
    [tabs]
  );

  const handleRecordHistory = useCallback(
    (title: string, url: string) => {
      if (!settings.saveHistory || activeTab?.incognito) return;
      setHistory((prev) => {
        const deduped = prev.filter((item) => item.url !== url || Date.now() - item.visitedAt > 60000);
        return [
          {
            id: `hist-${Date.now()}`,
            title: title || url,
            url,
            visitedAt: Date.now(),
          },
          ...deduped,
        ].slice(0, 120);
      });
    },
    [activeTab?.incognito, setHistory, settings.saveHistory]
  );

  const handleToggleBookmark = useCallback(
    (title: string, url: string) => {
      setBookmarks((prev) => {
        const exists = prev.find((b) => b.url === url);
        if (exists) {
          showToast('Bookmark dihapus');
          return prev.filter((b) => b.id !== exists.id);
        }
        showToast('Disimpan ke Bookmark');
        return [
          {
            id: `bm-${Date.now()}`,
            title: title || url,
            url,
            iconKey: 'globe-fav',
            category: 'Favorit',
            pinnedOnHome: false,
            createdAt: Date.now(),
          },
          ...prev,
        ];
      });
    },
    [setBookmarks, showToast]
  );

  const handleTriggerDownload = useCallback(
    (filename: string, url: string) => {
      const id = `dl-${Date.now()}`;
      const newDl: DownloadItem = {
        id,
        filename,
        url,
        sizeText: 'Menghitung...',
        mimeType: 'text/html',
        status: 'berjalan',
        progress: 25,
        downloadedAt: Date.now(),
      };
      setDownloads((prev) => [newDl, ...prev]);
      showToast(`Mengunduh ${filename}`);

      // Trigger real browser file download via proxy
      const a = document.createElement('a');
      a.href = `/api/download-proxy?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => {
        setDownloads((prev) =>
          prev.map((d) =>
            d.id === id ? { ...d, status: 'selesai', progress: 100, sizeText: '184 KB' } : d
          )
        );
      }, 900);
    },
    [setDownloads, showToast]
  );

  const handleInstallExtension = useCallback(
    (id: string) => {
      setExtensions((prev) =>
        prev.map((ext) => {
          if (ext.id !== id) return ext;
          const nextInstalled = !ext.installed;
          showToast(nextInstalled ? `${ext.name} dipasang & aktif` : `${ext.name} dihapus`);
          return {
            ...ext,
            installed: nextInstalled,
            enabled: nextInstalled,
          };
        })
      );
    },
    [setExtensions, showToast]
  );

  const handleToggleExtensionEnabled = useCallback(
    (id: string) => {
      setExtensions((prev) =>
        prev.map((ext) => {
          if (ext.id !== id) return ext;
          const next = !ext.enabled;
          showToast(`${ext.name} ${next ? 'diaktifkan' : 'dinonaktifkan'}`);
          return { ...ext, enabled: next };
        })
      );
    },
    [setExtensions, showToast]
  );

  const handleRemoveExtension = useCallback(
    (id: string) => {
      setExtensions((prev) =>
        prev.map((ext) => {
          if (ext.id !== id) return ext;
          showToast(`${ext.name} dihapus`);
          return { ...ext, installed: false, enabled: false };
        })
      );
    },
    [setExtensions, showToast]
  );

  const activeIsBookmarked = useMemo(
    () => Boolean(activeTab?.url && bookmarks.some((b) => b.url === activeTab.url)),
    [activeTab?.url, bookmarks]
  );

  return (
    <div className="min-h-screen erto-bg text-white flex flex-col">
      <OfflineIndicator />
      {/* Main Active Screen */}
      {screen === 'browser' && activeTab?.url ? (
        <BrowserViewport
          tab={activeTab}
          tabCount={tabs.length}
          extensions={extensions}
          settings={settings}
          isBookmarked={activeIsBookmarked}
          onGoHome={() => setScreen('home')}
          onNavigate={openUrlInActiveTab}
          onGoBack={handleGoBackInBrowser}
          onGoForward={handleGoForwardInBrowser}
          onToggleBookmark={handleToggleBookmark}
          onRecordHistory={handleRecordHistory}
          onDownloadPage={handleTriggerDownload}
          onOpenTabsSheet={() => setTabSheetOpen(true)}
          onOpenExtensions={() => navigateScreen('extensions')}
          onOpenOverflowMenu={() => setMenuOpen(true)}
          onToggleDesktopMode={() => {
            setTabs((prev) =>
              prev.map((t) =>
                t.id === activeTabId ? { ...t, desktopMode: !t.desktopMode } : t
              )
            );
          }}
        />
      ) : (
        <main className="flex-1">
          {screen === 'home' && (
            <HomeView
              bookmarks={bookmarks}
              topSites={DEFAULT_TOP_SITES}
              history={history}
              tabCount={tabs.length}
              installedExtCount={installedExtCount}
              incognitoActive={Boolean(activeTab?.incognito)}
              onNavigateUrl={openUrlInActiveTab}
              onOpenExtensions={() => navigateScreen('extensions')}
              onOpenBookmarksAll={() => navigateScreen('bookmarks')}
              onOpenTopSitesAll={() => setTopSitesOpen(true)}
              onOpenTabsSheet={() => setTabSheetOpen(true)}
              onOpenOverflowMenu={() => setMenuOpen(true)}
              onOpenVoiceModal={() => setVoiceOpen(true)}
              onOpenQrModal={() => setQrOpen(true)}
            />
          )}

          {screen === 'extensions' && (
            <ExtensionsView
              extensions={extensions}
              extSettings={extSettings}
              onBack={() => setScreen(previousScreen === 'browser' && activeTab?.url ? 'browser' : 'home')}
              onInstallToggle={handleInstallExtension}
              onEnableToggle={handleToggleExtensionEnabled}
              onRemoveExtension={handleRemoveExtension}
              onUpdateSettings={setExtSettings}
              onOpenChromeWebStore={() => setWebStoreOpen(true)}
              onOpenOverflowMenu={() => setMenuOpen(true)}
            />
          )}

          {screen === 'downloads' && (
            <DownloadsView
              downloads={downloads}
              onBack={() => setScreen('home')}
              onDeleteDownload={(id) =>
                setDownloads((prev) => prev.filter((d) => d.id !== id))
              }
              onTogglePauseDownload={(id) =>
                setDownloads((prev) =>
                  prev.map((d) =>
                    d.id === id
                      ? { ...d, status: d.status === 'jeda' ? 'berjalan' : 'jeda' }
                      : d
                  )
                )
              }
              onTriggerNewDownload={handleTriggerDownload}
              onOpenUrl={openUrlInActiveTab}
            />
          )}

          {screen === 'history' && (
            <HistoryView
              history={history}
              onBack={() => setScreen('home')}
              onOpenUrl={openUrlInActiveTab}
              onDeleteItem={(id) =>
                setHistory((prev) => prev.filter((h) => h.id !== id))
              }
              onClearAll={() => {
                setHistory([]);
                showToast('Semua riwayat dihapus');
              }}
            />
          )}

          {screen === 'bookmarks' && (
            <BookmarksView
              bookmarks={bookmarks}
              onBack={() => setScreen('home')}
              onOpenUrl={openUrlInActiveTab}
              onAddBookmark={(title, url, category) => {
                setBookmarks((prev) => [
                  {
                    id: `bm-${Date.now()}`,
                    title,
                    url,
                    iconKey: 'globe-fav',
                    category,
                    pinnedOnHome: false,
                    createdAt: Date.now(),
                  },
                  ...prev,
                ]);
                showToast('Bookmark ditambahkan');
              }}
              onDeleteBookmark={(id) =>
                setBookmarks((prev) => prev.filter((b) => b.id !== id))
              }
              onTogglePinHome={(id) =>
                setBookmarks((prev) =>
                  prev.map((b) =>
                    b.id === id ? { ...b, pinnedOnHome: !b.pinnedOnHome } : b
                  )
                )
              }
            />
          )}

          {screen === 'settings' && (
            <SettingsView
              settings={settings}
              onUpdateSettings={setSettings}
              onClearBrowsingData={() => {
                setHistory([]);
                showToast('Riwayat & cache penjelajahan dibersihkan');
              }}
              onOpenExtensions={() => navigateScreen('extensions')}
              onBack={() => setScreen('home')}
            />
          )}
        </main>
      )}

      {/* Persistent 5-Item Bottom Navigation Bar (hidden inside full-screen Browser viewport) */}
      {screen !== 'browser' && (
        <BottomNav
          currentScreen={screen}
          onNavigate={(target) => setScreen(target)}
          downloadsBadge={downloads.filter((d) => d.status === 'berjalan').length}
        />
      )}

      {/* Modals & Sheets */}
      <TabSwitcherModal
        open={tabSheetOpen}
        tabs={tabs}
        activeTabId={activeTabId}
        onClose={() => setTabSheetOpen(false)}
        onSelectTab={handleSelectTab}
        onCloseTab={handleCloseTab}
        onNewTab={handleNewTab}
      />

      <OverflowMenuModal
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNewTab={handleNewTab}
        onNavigateScreen={(target) => navigateScreen(target)}
      />

      <VoiceSearchModal
        open={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        onResult={openUrlInActiveTab}
      />

      <QrScannerModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        onOpenUrl={openUrlInActiveTab}
      />

      <TopSitesModal
        open={topSitesOpen}
        topSites={DEFAULT_TOP_SITES}
        onClose={() => setTopSitesOpen(false)}
        onOpenUrl={openUrlInActiveTab}
      />

      <ChromeWebStoreModal
        open={webStoreOpen}
        extensions={extensions}
        onClose={() => setWebStoreOpen(false)}
        onInstallToggle={handleInstallExtension}
      />

      {/* Lightweight Toast Notification */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-[#052e0d]/95 border border-[#a3e635]/60 text-white text-xs font-bold shadow-xl whitespace-nowrap"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
