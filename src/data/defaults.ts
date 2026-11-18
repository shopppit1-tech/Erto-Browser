import {
  BookmarkItem,
  BrowserSettings,
  DownloadItem,
  ExtensionItem,
  ExtensionSettings,
  HistoryItem,
  TopSiteItem,
} from '../types/browser';
import eagleLogoImg from '../assets/images/erto_eagle_logo_1795025317951.jpg';
import heroEagleImg from '../assets/images/erto_hero_eagle_1795025319770.jpg';

export const ASSETS = {
  eagleLogo: eagleLogoImg,
  heroEagle: heroEagleImg,
};

export const QUICK_ACCESS_SITES: TopSiteItem[] = [
  { id: 'qa-youtube', title: 'YouTube', url: 'https://www.youtube.com', iconKey: 'youtube', category: 'Video' },
  { id: 'qa-facebook', title: 'Facebook', url: 'https://www.facebook.com', iconKey: 'facebook', category: 'Sosial' },
  { id: 'qa-google', title: 'Google', url: 'https://www.google.com', iconKey: 'google', category: 'Pencarian' },
  { id: 'qa-tiktok', title: 'TikTok', url: 'https://www.tiktok.com', iconKey: 'tiktok', category: 'Video' },
];

export const DEFAULT_BOOKMARKS: BookmarkItem[] = [
  {
    id: 'bm-fav',
    title: 'Website Favorit',
    url: 'https://id.wikipedia.org/wiki/Portal:Utama',
    iconKey: 'globe-fav',
    category: 'Favorit',
    pinnedOnHome: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 48,
  },
  {
    id: 'bm-google',
    title: 'Google',
    url: 'https://www.google.com',
    iconKey: 'google-search',
    category: 'Pencarian',
    pinnedOnHome: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 36,
  },
  {
    id: 'bm-youtube',
    title: 'YouTube',
    url: 'https://www.youtube.com',
    iconKey: 'youtube',
    category: 'Hiburan',
    pinnedOnHome: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
  },
  {
    id: 'bm-facebook',
    title: 'Facebook',
    url: 'https://www.facebook.com',
    iconKey: 'facebook',
    category: 'Sosial',
    pinnedOnHome: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 12,
  },
  {
    id: 'bm-wiki',
    title: 'Wikipedia Indonesia',
    url: 'https://id.wikipedia.org',
    iconKey: 'wikipedia',
    category: 'Edukasi',
    pinnedOnHome: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 6,
  },
  {
    id: 'bm-github',
    title: 'GitHub',
    url: 'https://github.com',
    iconKey: 'globe-fav',
    category: 'Teknologi',
    pinnedOnHome: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
  },
];

export const DEFAULT_TOP_SITES: TopSiteItem[] = [
  { id: 'ts-shopee', title: 'Shopee', url: 'https://shopee.co.id', iconKey: 'shopee', category: 'Belanja' },
  { id: 'ts-whatsapp', title: 'WhatsApp', url: 'https://web.whatsapp.com', iconKey: 'whatsapp', category: 'Pesan' },
  { id: 'ts-wikipedia', title: 'Wikipedia', url: 'https://id.wikipedia.org', iconKey: 'wikipedia', category: 'Referensi' },
  { id: 'ts-x', title: 'X', url: 'https://x.com', iconKey: 'x', category: 'Sosial' },
  { id: 'ts-detik', title: 'Detik.com', url: 'https://www.detik.com', iconKey: 'globe-fav', category: 'Berita' },
  { id: 'ts-kompas', title: 'Kompas.com', url: 'https://www.kompas.com', iconKey: 'globe-fav', category: 'Berita' },
  { id: 'ts-tokopedia', title: 'Tokopedia', url: 'https://www.tokopedia.com', iconKey: 'shopee', category: 'Belanja' },
  { id: 'ts-github', title: 'GitHub', url: 'https://github.com', iconKey: 'globe-fav', category: 'Developer' },
];

export const DEFAULT_EXTENSIONS: ExtensionItem[] = [
  {
    id: 'google-translate',
    name: 'TWP - Translate Web Pages',
    description: 'Alternatif TWP dari AMO; kompatibilitas Android belum terverifikasi, sehingga belum dapat dipasang dari APK ini.',
    rating: 4.5,
    category: 'Bahasa',
    version: '10.2.1.0',
    iconKey: 'default',
    amoSlug: 'traduzir-paginas-web',
    amoPageUrl: 'https://addons.mozilla.org/en-US/firefox/addon/traduzir-paginas-web/',
    storeUrl: 'https://addons.mozilla.org/en-US/firefox/addon/traduzir-paginas-web/',
    publisher: 'Filipe Dev',
    installed: false,
    enabled: false,
    featured: true,
    permissions: ['Baca & ubah teks halaman untuk terjemahan'],
  },
  {
    id: 'ublock-origin',
    name: 'uBlock Origin',
    description: 'Pemblokir iklan dan pelacak untuk pengalaman browsing lebih bersih.',
    rating: 4.8,
    category: 'Privasi',
    version: '1.76.4',
    iconKey: 'ublock-origin',
    amoSlug: 'ublock-origin',
    amoPageUrl: 'https://addons.mozilla.org/en-US/firefox/addon/ublock-origin/',
    xpiUrl: 'https://addons.mozilla.org/firefox/downloads/latest/ublock-origin/latest.xpi',
    storeUrl: 'https://addons.mozilla.org/en-US/firefox/addon/ublock-origin/',
    publisher: 'Raymond Hill (gorhill)',
    installed: false,
    enabled: false,
    featured: true,
    permissions: ['Blokir permintaan iklan jaringan', 'Filter elemen halaman'],
  },
  {
    id: 'dark-reader',
    name: 'Dark Reader',
    description: 'Mode gelap untuk semua situs web.',
    rating: 4.7,
    category: 'Tampilan',
    version: '4.9.135',
    iconKey: 'dark-reader',
    amoSlug: 'darkreader',
    amoPageUrl: 'https://addons.mozilla.org/en-US/firefox/addon/darkreader/',
    xpiUrl: 'https://addons.mozilla.org/firefox/downloads/latest/darkreader/latest.xpi',
    storeUrl: 'https://addons.mozilla.org/en-US/firefox/addon/darkreader/',
    publisher: 'darkreader.org',
    installed: false,
    enabled: false,
    featured: true,
    permissions: ['Ubah gaya warna situs web secara dinamis'],
  },
  {
    id: 'adblock',
    cwsId: 'gighmmpiobklfepjocnamgkkbiglidom',
    name: 'AdBlock',
    description: 'CRX Chrome ini belum memiliki paket AMO/XPI terverifikasi. Gunakan uBlock Origin yang tersedia.',
    rating: 4.6,
    category: 'Privasi',
    version: '5.22.0',
    iconKey: 'adblock',
    storeUrl: '',
    publisher: 'getadblock.com',
    installed: false,
    enabled: false,
    featured: true,
    permissions: ['Blokir banner & pop-up iklan'],
  },
  {
    id: 'sponsorblock',
    name: 'SponsorBlock',
    description: 'Deteksi segmen sponsor di video YouTube secara langsung.',
    rating: 4.9,
    category: 'Video',
    version: '6.1.7',
    iconKey: 'sponsorblock',
    amoSlug: 'sponsorblock',
    amoPageUrl: 'https://addons.mozilla.org/en-US/firefox/addon/sponsorblock/',
    xpiUrl: 'https://addons.mozilla.org/firefox/downloads/latest/sponsorblock/latest.xpi',
    storeUrl: 'https://addons.mozilla.org/en-US/firefox/addon/sponsorblock/',
    publisher: 'Ajay Ramachandran',
    installed: false,
    enabled: false,
    featured: false,
    permissions: ['Akses pemutar video YouTube'],
  },
];

export const DEFAULT_HISTORY: HistoryItem[] = [];

export const DEFAULT_DOWNLOADS: DownloadItem[] = [];

export const DEFAULT_EXTENSION_SETTINGS: ExtensionSettings = {
  allowInIncognito: false,
  autoUpdate: true,
  developerMode: false,
  allowUserScripts: true,
};

export const DEFAULT_BROWSER_SETTINGS: BrowserSettings = {
  searchEngine: 'google',
  adShieldBuiltIn: true,
  blockTrackers: true,
  desktopDefault: false,
  textSize: 'normal',
  forceDarkWeb: false,
  saveHistory: true,
};
