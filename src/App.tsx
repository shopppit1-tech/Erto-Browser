import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  auth,
  db,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  signInWithGoogleAccount,
  signOutGoogleAccount,
  handleFirestoreError,
  OperationType,
} from './firebase';
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
  LiveCwsItem,
  OverflowMenuModal,
  QrScannerModal,
  TabSwitcherModal,
  TopSitesModal,
  VoiceSearchModal,
} from './components/BrowserModals';
import { OfflineIndicator } from './components/PWAInstallUI';
import { apiUrl } from './utils/api';
import { ErtoWebView, isNativeAndroidApk } from './utils/nativeBrowser';

function formatByteSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function toValidFirestoreId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
  return cleaned || `id_${Date.now()}`;
}

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

  useEffect(() => {
    // GeckoView initialization is expensive and can crash on unsupported devices;
    // keep it off the startup path and load native extension state on demand.
    if (!isNativeAndroidApk() || screen !== 'extensions') return;
    let disposed = false;
    ErtoWebView.listExtensions()
      .then(({ extensions: runtimeExtensions }) => {
        if (disposed) return;
        setExtensions((previous) => DEFAULT_EXTENSIONS.map((item) => {
          const oldItem = previous.find((candidate) => candidate.id === item.id);
          const slug = item.amoSlug?.toLowerCase();
          const installed = runtimeExtensions.find((nativeExtension) =>
            (oldItem?.runtimeId && nativeExtension.runtimeId === oldItem.runtimeId) ||
            (item.amoPageUrl && nativeExtension.amoPageUrl === item.amoPageUrl) ||
            (slug && `${nativeExtension.amoPageUrl} ${nativeExtension.xpiUrl}`.toLowerCase().includes(slug))
          );
          return {
            ...item,
            installed: Boolean(installed),
            enabled: installed?.enabled ?? false,
            runtimeId: installed?.runtimeId,
            version: installed?.version || item.version,
          };
        }));
      })
      .catch((error) => console.warn('Gagal menyinkronkan ekstensi GeckoView', error));
    return () => { disposed = true; };
  }, [screen, setExtensions]);

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
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsub();
  }, []);

  // Real-time Firestore sync for Bookmarks & History when signed in with verified Google account
  useEffect(() => {
    if (!user || !user.emailVerified) return;

    const bookmarksPath = `users/${user.uid}/bookmarks`;
    const bookmarksQuery = query(
      collection(db, 'users', user.uid, 'bookmarks'),
      where('ownerId', '==', user.uid)
    );
    const unsubBookmarks = onSnapshot(
      bookmarksQuery,
      (snapshot) => {
        if (snapshot.empty) return;
        const cloudBookmarks: BookmarkItem[] = snapshot.docs
          .map((d) => {
            const data = d.data();
            const createdAtMs =
              typeof data.createdAt?.toMillis === 'function'
                ? data.createdAt.toMillis()
                : Date.now();
            return {
              id: d.id,
              title: String(data.title || data.url || ''),
              url: String(data.url || ''),
              iconKey: String(data.iconKey || 'globe-fav'),
              category: String(data.category || 'Favorit'),
              pinnedOnHome: Boolean(data.pinnedOnHome),
              createdAt: createdAtMs,
            };
          })
          .sort((a, b) => b.createdAt - a.createdAt);
        setBookmarks(cloudBookmarks);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, bookmarksPath);
      }
    );

    const historyPath = `users/${user.uid}/history`;
    const historyQuery = query(
      collection(db, 'users', user.uid, 'history'),
      where('ownerId', '==', user.uid)
    );
    const unsubHistory = onSnapshot(
      historyQuery,
      (snapshot) => {
        if (snapshot.empty) return;
        const cloudHistory: HistoryItem[] = snapshot.docs
          .map((d) => {
            const data = d.data();
            const visitedAtMs =
              typeof data.visitedAt?.toMillis === 'function'
                ? data.visitedAt.toMillis()
                : Date.now();
            return {
              id: d.id,
              title: String(data.title || data.url || ''),
              url: String(data.url || ''),
              visitedAt: visitedAtMs,
            };
          })
          .sort((a, b) => b.visitedAt - a.visitedAt)
          .slice(0, 120);
        setHistory(cloudHistory);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, historyPath);
      }
    );

    return () => {
      unsubBookmarks();
      unsubHistory();
    };
  }, [user, setBookmarks, setHistory]);

  const handleGoogleLogin = useCallback(async () => {
    if (authLoading) return;
    setAuthLoading(true);
    try {
      const loggedIn = await signInWithGoogleAccount();
      showToast(`Masuk sebagai ${loggedIn.displayName || loggedIn.email || 'Pengguna Google'}`);
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        showToast('Login Google dibatalkan');
      } else if (code === 'auth/popup-blocked') {
        showToast('Pop-up diblokir browser. Izinkan pop-up untuk Login Google.');
      } else if (code === 'auth/unauthorized-domain') {
        showToast(`Domain (${window.location.hostname}) belum diizinkan di Firebase Auth`);
      } else {
        showToast(`Gagal masuk dengan Google${code ? ` (${code})` : ''}.`);
      }
    } finally {
      setAuthLoading(false);
    }
  }, [authLoading, showToast]);

  const handleGoogleLogout = useCallback(async () => {
    if (authLoading) return;
    setAuthLoading(true);
    try {
      await signOutGoogleAccount();
      showToast('Berhasil keluar dari akun Google');
    } catch {
      showToast('Gagal keluar dari akun');
    } finally {
      setAuthLoading(false);
    }
  }, [authLoading, showToast]);

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
      const cleanUrl = url.slice(0, 1024);
      const cleanTitle = (title || cleanUrl).slice(0, 200);
      const histId = `hist_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

      setHistory((prev) => {
        const recentSame = prev.find(
          (item) => item.url === cleanUrl && Date.now() - item.visitedAt <= 60000
        );
        if (recentSame) return prev;

        if (user && user.emailVerified && cleanUrl.length >= 4 && cleanTitle.length >= 1) {
          const histPath = `users/${user.uid}/history/${histId}`;
          setDoc(doc(db, 'users', user.uid, 'history', histId), {
            ownerId: user.uid,
            title: cleanTitle,
            url: cleanUrl,
            visitedAt: serverTimestamp(),
          }).catch((err) => handleFirestoreError(err, OperationType.CREATE, histPath));
        }

        const deduped = prev.filter((item) => item.url !== cleanUrl || Date.now() - item.visitedAt > 60000);
        return [
          {
            id: histId,
            title: cleanTitle,
            url: cleanUrl,
            visitedAt: Date.now(),
          },
          ...deduped,
        ].slice(0, 120);
      });
    },
    [activeTab?.incognito, setHistory, settings.saveHistory, user]
  );

  const handleToggleBookmark = useCallback(
    (title: string, url: string) => {
      const cleanUrl = url.slice(0, 1024);
      const cleanTitle = (title || cleanUrl).slice(0, 160);
      setBookmarks((prev) => {
        const exists = prev.find((b) => b.url === cleanUrl);
        if (exists) {
          showToast('Bookmark dihapus');
          if (user && user.emailVerified) {
            const safeId = toValidFirestoreId(exists.id);
            const bmPath = `users/${user.uid}/bookmarks/${safeId}`;
            deleteDoc(doc(db, 'users', user.uid, 'bookmarks', safeId)).catch((err) =>
              handleFirestoreError(err, OperationType.DELETE, bmPath)
            );
          }
          return prev.filter((b) => b.id !== exists.id);
        }
        const bmId = `bm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        showToast('Disimpan ke Bookmark');
        if (user && user.emailVerified && cleanUrl.length >= 4 && cleanTitle.length >= 1) {
          const bmPath = `users/${user.uid}/bookmarks/${bmId}`;
          setDoc(doc(db, 'users', user.uid, 'bookmarks', bmId), {
            ownerId: user.uid,
            title: cleanTitle,
            url: cleanUrl,
            iconKey: 'globe-fav',
            category: 'Favorit',
            pinnedOnHome: false,
            createdAt: serverTimestamp(),
          }).catch((err) => handleFirestoreError(err, OperationType.CREATE, bmPath));
        }
        return [
          {
            id: bmId,
            title: cleanTitle,
            url: cleanUrl,
            iconKey: 'globe-fav',
            category: 'Favorit',
            pinnedOnHome: false,
            createdAt: Date.now(),
          },
          ...prev,
        ];
      });
    },
    [setBookmarks, showToast, user]
  );

  const handleTriggerDownload = useCallback(
    async (filename: string, url: string) => {
      const id = `dl-${Date.now()}`;
      const newDl: DownloadItem = {
        id,
        filename,
        url,
        sizeText: 'Mengunduh...',
        mimeType: 'application/octet-stream',
        status: 'berjalan',
        progress: 10,
        downloadedAt: Date.now(),
      };
      setDownloads((prev) => [newDl, ...prev]);
      showToast(`Mengunduh ${filename}`);

      try {
        const res = await fetch(
          apiUrl(`/api/download-proxy?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`)
        );
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const total = Number(res.headers.get('content-length') || 0);
        const contentType = res.headers.get('content-type') || 'application/octet-stream';
        let blob: Blob;

        if (res.body) {
          const reader = res.body.getReader();
          const chunks: Uint8Array<ArrayBuffer>[] = [];
          let received = 0;
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              chunks.push(new Uint8Array(value));
              received += value.length;
              const pct = total > 0 ? Math.min(95, Math.round((received / total) * 100)) : 60;
              setDownloads((prev) =>
                prev.map((d) =>
                  d.id === id ? { ...d, progress: pct, sizeText: formatByteSize(received) } : d
                )
              );
            }
          }
          blob = new Blob(chunks, { type: contentType });
        } else {
          blob = await res.blob();
        }

        const objUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(objUrl), 5000);

        setDownloads((prev) =>
          prev.map((d) =>
            d.id === id
              ? {
                  ...d,
                  status: 'selesai',
                  progress: 100,
                  mimeType: contentType,
                  sizeText: formatByteSize(blob.size),
                }
              : d
          )
        );
        showToast(`Unduhan selesai (${formatByteSize(blob.size)})`);
      } catch {
        setDownloads((prev) =>
          prev.map((d) =>
            d.id === id ? { ...d, status: 'jeda', progress: 0, sizeText: 'Gagal mengunduh' } : d
          )
        );
        showToast(`Gagal mengunduh ${filename}`);
      }
    },
    [setDownloads, showToast]
  );

  const handleInstallExtension = useCallback(
    async (id: string) => {
      const item = extensions.find((extension) => extension.id === id);
      if (!item) return;
      if (!isNativeAndroidApk()) {
        showToast('Pemasangan ekstensi hanya tersedia di APK Android GeckoView');
        return;
      }
      if (!item.xpiUrl) {
        showToast(`${item.name} belum memiliki paket XPI AMO yang didukung`);
        return;
      }
      try {
        const installed = await ErtoWebView.installExtension({ catalogId: item.id, xpiUrl: item.xpiUrl });
        setExtensions((previous) => previous.map((extension) => extension.id === id
          ? { ...extension, installed: true, enabled: installed.enabled, runtimeId: installed.runtimeId, version: installed.version || extension.version }
          : extension));
        showToast(`${installed.name || item.name} terpasang di GeckoView`);
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error || 'pemasangan dibatalkan');
        showToast(`Ekstensi tidak dipasang: ${reason}`);
      }
    },
    [extensions, setExtensions, showToast]
  );

  const handleToggleExtensionEnabled = useCallback(
    async (id: string) => {
      const item = extensions.find((extension) => extension.id === id);
      if (!item?.runtimeId || !isNativeAndroidApk()) return;
      try {
        const updated = await ErtoWebView.setExtensionEnabled({ runtimeId: item.runtimeId, enabled: !item.enabled });
        setExtensions((previous) => previous.map((extension) => extension.id === id
          ? { ...extension, enabled: updated.enabled }
          : extension));
        showToast(`${item.name} ${updated.enabled ? 'diaktifkan' : 'dinonaktifkan'} di GeckoView`);
      } catch (error) {
        showToast(`Gagal mengubah ${item.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
    [extensions, setExtensions, showToast]
  );

  const handleRemoveExtension = useCallback(
    async (id: string) => {
      const item = extensions.find((extension) => extension.id === id);
      if (!item?.runtimeId || !isNativeAndroidApk()) return;
      try {
        await ErtoWebView.removeExtension({ runtimeId: item.runtimeId });
        setExtensions((previous) => previous.map((extension) => extension.id === id
          ? { ...extension, installed: false, enabled: false, runtimeId: undefined }
          : extension));
        showToast(`${item.name} dihapus dari GeckoView`);
      } catch (error) {
        showToast(`Gagal menghapus ${item.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
    [extensions, setExtensions, showToast]
  );

  const handleInstallCwsItem = useCallback(
    (item: LiveCwsItem) => {
      showToast(`${item.name}: paket CRX Chrome Web Store tidak bisa dipasang di GeckoView. Gunakan add-on XPI AMO yang kompatibel.`);
    },
    [showToast]
  );

  const handleDownloadCrx = useCallback(
    async (cwsId: string, name: string) => {
      const safeName = `${name.replace(/[^a-zA-Z0-9._-]/g, '_')}-${cwsId.slice(0, 8)}.crx`;
      const dlId = `dl-crx-${Date.now()}`;
      const dlUrl = apiUrl(`/api/cws-crx?id=${encodeURIComponent(cwsId)}&name=${encodeURIComponent(name)}`);

      setDownloads((prev) => [
        {
          id: dlId,
          filename: safeName,
          url: `https://chromewebstore.google.com/detail/${cwsId}`,
          sizeText: 'Mengunduh CRX...',
          mimeType: 'application/x-chrome-extension',
          status: 'berjalan',
          progress: 20,
          downloadedAt: Date.now(),
        },
        ...prev,
      ]);
      showToast(`Mengunduh ${safeName}`);

      try {
        const res = await fetch(dlUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const objUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objUrl;
        a.download = safeName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(objUrl), 5000);

        setDownloads((prev) =>
          prev.map((d) =>
            d.id === dlId
              ? { ...d, status: 'selesai', progress: 100, sizeText: formatByteSize(blob.size) }
              : d
          )
        );
        showToast(`${safeName} terunduh (${formatByteSize(blob.size)})`);
      } catch {
        setDownloads((prev) =>
          prev.map((d) =>
            d.id === dlId ? { ...d, status: 'jeda', progress: 0, sizeText: 'Gagal mengunduh' } : d
          )
        );
        showToast(`Gagal mengunduh ${safeName}`);
      }
    },
    [setDownloads, showToast]
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
          overlayOpen={tabSheetOpen || menuOpen || voiceOpen || qrOpen || topSitesOpen || webStoreOpen}
          user={user}
          onGoogleLogin={handleGoogleLogin}
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
              user={user}
              onGoogleLogin={handleGoogleLogin}
              onOpenAccountSettings={() => navigateScreen('settings')}
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
              onTogglePauseDownload={(id) => {
                const target = downloads.find((d) => d.id === id);
                if (!target) return;
                if (target.status === 'jeda') {
                  setDownloads((prev) => prev.filter((d) => d.id !== id));
                  handleTriggerDownload(target.filename, target.url);
                } else {
                  setDownloads((prev) =>
                    prev.map((d) => (d.id === id ? { ...d, status: 'jeda' } : d))
                  );
                }
              }}
              onTriggerNewDownload={handleTriggerDownload}
              onOpenUrl={openUrlInActiveTab}
            />
          )}

          {screen === 'history' && (
            <HistoryView
              history={history}
              onBack={() => setScreen('home')}
              onOpenUrl={openUrlInActiveTab}
              onDeleteItem={(id) => {
                setHistory((prev) => prev.filter((h) => h.id !== id));
                if (user && user.emailVerified) {
                  const safeId = toValidFirestoreId(id);
                  const path = `users/${user.uid}/history/${safeId}`;
                  deleteDoc(doc(db, 'users', user.uid, 'history', safeId)).catch((err) =>
                    handleFirestoreError(err, OperationType.DELETE, path)
                  );
                }
              }}
              onClearAll={() => {
                const current = [...history];
                setHistory([]);
                if (user && user.emailVerified) {
                  current.forEach((h) => {
                    const safeId = toValidFirestoreId(h.id);
                    const path = `users/${user.uid}/history/${safeId}`;
                    deleteDoc(doc(db, 'users', user.uid, 'history', safeId)).catch((err) =>
                      handleFirestoreError(err, OperationType.DELETE, path)
                    );
                  });
                }
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
                const bmId = `bm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
                const cleanTitle = title.slice(0, 160);
                const cleanUrl = url.slice(0, 1024);
                const cleanCat = category.slice(0, 40) || 'Favorit';
                setBookmarks((prev) => [
                  {
                    id: bmId,
                    title: cleanTitle,
                    url: cleanUrl,
                    iconKey: 'globe-fav',
                    category: cleanCat,
                    pinnedOnHome: false,
                    createdAt: Date.now(),
                  },
                  ...prev,
                ]);
                if (user && user.emailVerified && cleanUrl.length >= 4 && cleanTitle.length >= 1) {
                  const path = `users/${user.uid}/bookmarks/${bmId}`;
                  setDoc(doc(db, 'users', user.uid, 'bookmarks', bmId), {
                    ownerId: user.uid,
                    title: cleanTitle,
                    url: cleanUrl,
                    iconKey: 'globe-fav',
                    category: cleanCat,
                    pinnedOnHome: false,
                    createdAt: serverTimestamp(),
                  }).catch((err) => handleFirestoreError(err, OperationType.CREATE, path));
                }
                showToast('Bookmark ditambahkan');
              }}
              onDeleteBookmark={(id) => {
                setBookmarks((prev) => prev.filter((b) => b.id !== id));
                if (user && user.emailVerified) {
                  const safeId = toValidFirestoreId(id);
                  const path = `users/${user.uid}/bookmarks/${safeId}`;
                  deleteDoc(doc(db, 'users', user.uid, 'bookmarks', safeId)).catch((err) =>
                    handleFirestoreError(err, OperationType.DELETE, path)
                  );
                }
              }}
              onTogglePinHome={(id) => {
                const target = bookmarks.find((b) => b.id === id);
                const nextPinned = target ? !target.pinnedOnHome : true;
                setBookmarks((prev) =>
                  prev.map((b) =>
                    b.id === id ? { ...b, pinnedOnHome: !b.pinnedOnHome } : b
                  )
                );
                if (user && user.emailVerified && target) {
                  const safeId = toValidFirestoreId(id);
                  const path = `users/${user.uid}/bookmarks/${safeId}`;
                  updateDoc(doc(db, 'users', user.uid, 'bookmarks', safeId), {
                    pinnedOnHome: nextPinned,
                  }).catch(() => {
                    setDoc(doc(db, 'users', user.uid, 'bookmarks', safeId), {
                      ownerId: user.uid,
                      title: target.title.slice(0, 160),
                      url: target.url.slice(0, 1024),
                      iconKey: target.iconKey.slice(0, 40) || 'globe-fav',
                      category: target.category.slice(0, 40) || 'Favorit',
                      pinnedOnHome: nextPinned,
                      createdAt: serverTimestamp(),
                    }).catch((err) => handleFirestoreError(err, OperationType.WRITE, path));
                  });
                }
              }}
            />
          )}

          {screen === 'settings' && (
            <SettingsView
              settings={settings}
              user={user}
              authLoading={authLoading}
              onGoogleLogin={handleGoogleLogin}
              onGoogleLogout={handleGoogleLogout}
              onUpdateSettings={setSettings}
              onClearBrowsingData={() => {
                const current = [...history];
                setHistory([]);
                if (user && user.emailVerified) {
                  current.forEach((h) => {
                    const safeId = toValidFirestoreId(h.id);
                    const path = `users/${user.uid}/history/${safeId}`;
                    deleteDoc(doc(db, 'users', user.uid, 'history', safeId)).catch((err) =>
                      handleFirestoreError(err, OperationType.DELETE, path)
                    );
                  });
                }
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
        onInstallCwsItem={handleInstallCwsItem}
        onDownloadCrx={handleDownloadCrx}
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
