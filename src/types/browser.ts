export type AppScreen =
  | 'home'
  | 'extensions'
  | 'downloads'
  | 'history'
  | 'bookmarks'
  | 'settings'
  | 'browser';

export type SearchEngine = 'google' | 'duckduckgo' | 'bing' | 'yahoo';

export interface BrowserTab {
  id: string;
  title: string;
  url: string;
  query?: string;
  incognito: boolean;
  desktopMode: boolean;
  historyStack: string[];
  historyIndex: number;
  createdAt: number;
}

export interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  iconKey: string;
  category: string;
  pinnedOnHome: boolean;
  createdAt: number;
}

export interface TopSiteItem {
  id: string;
  title: string;
  url: string;
  iconKey: string;
  category: string;
}

export interface HistoryItem {
  id: string;
  title: string;
  url: string;
  visitedAt: number;
  favicon?: string;
}

export interface DownloadItem {
  id: string;
  filename: string;
  url: string;
  sizeText: string;
  mimeType: string;
  status: 'selesai' | 'berjalan' | 'jeda';
  progress: number;
  downloadedAt: number;
}

export interface ExtensionItem {
  id: string;
  name: string;
  description: string;
  rating: number;
  category: string;
  version: string;
  iconKey: string;
  iconUrl?: string;
  cwsId?: string;
  storeUrl?: string;
  publisher?: string;
  isFromCws?: boolean;
  amoSlug?: string;
  amoPageUrl?: string;
  xpiUrl?: string;
  runtimeId?: string;
  installed: boolean;
  enabled: boolean;
  featured: boolean;
  permissions: string[];
}

export interface ExtensionSettings {
  allowInIncognito: boolean;
  autoUpdate: boolean;
  developerMode: boolean;
  allowUserScripts: boolean;
}

export interface BrowserSettings {
  searchEngine: SearchEngine;
  adShieldBuiltIn: boolean;
  blockTrackers: boolean;
  desktopDefault: boolean;
  textSize: 'kecil' | 'normal' | 'besar';
  forceDarkWeb: boolean;
  saveHistory: boolean;
}
