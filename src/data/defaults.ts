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
    name: 'Google Translate',
    description: 'Terjemahkan halaman web ke berbagai bahasa.',
    rating: 4.5,
    category: 'Bahasa',
    version: '2.0.16',
    iconKey: 'google-translate',
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
    version: '1.58.0',
    iconKey: 'ublock-origin',
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
    version: '4.9.88',
    iconKey: 'dark-reader',
    installed: false,
    enabled: false,
    featured: true,
    permissions: ['Ubah gaya warna situs web secara dinamis'],
  },
  {
    id: 'adblock',
    name: 'AdBlock',
    description: 'Blokir iklan yang mengganggu.',
    rating: 4.6,
    category: 'Privasi',
    version: '5.22.0',
    iconKey: 'adblock',
    installed: false,
    enabled: false,
    featured: true,
    permissions: ['Blokir banner & pop-up iklan'],
  },
  {
    id: 'sponsorblock',
    name: 'SponsorBlock',
    description: 'Lewati segmen sponsor di video YouTube secara otomatis.',
    rating: 4.9,
    category: 'Video',
    version: '5.7.2',
    iconKey: 'sponsorblock',
    installed: false,
    enabled: false,
    featured: false,
    permissions: ['Akses pemutar video YouTube'],
  },
  {
    id: 'bitwarden',
    name: 'Bitwarden',
    description: 'Pengelola kata sandi aman dan terenkripsi untuk semua akun.',
    rating: 4.8,
    category: 'Keamanan',
    version: '2026.9.0',
    iconKey: 'bitwarden',
    installed: false,
    enabled: false,
    featured: false,
    permissions: ['Isi otomatis formulir login aman'],
  },
  {
    id: 'tampermonkey',
    name: 'Tampermonkey',
    description: 'Jalankan userscript kustom di situs web pilihan Anda.',
    rating: 4.7,
    category: 'Pengembang',
    version: '5.2.0',
    iconKey: 'tampermonkey',
    installed: false,
    enabled: false,
    featured: false,
    permissions: ['Jalankan skrip pengguna kustom'],
  },
];

export const DEFAULT_HISTORY: HistoryItem[] = [
  {
    id: 'hist-1',
    title: 'Wikipedia Indonesia — Ensiklopedia Bebas',
    url: 'https://id.wikipedia.org',
    visitedAt: Date.now() - 1000 * 60 * 25,
  },
  {
    id: 'hist-2',
    title: 'YouTube — Beranda Video',
    url: 'https://www.youtube.com',
    visitedAt: Date.now() - 1000 * 60 * 95,
  },
  {
    id: 'hist-3',
    title: 'Google Search',
    url: 'https://www.google.com',
    visitedAt: Date.now() - 1000 * 60 * 60 * 26,
  },
];

export const DEFAULT_DOWNLOADS: DownloadItem[] = [
  {
    id: 'dl-1',
    filename: 'Erto-Browser-Guide-2026.html',
    url: 'https://id.wikipedia.org/wiki/Peramban_web',
    sizeText: '148 KB',
    mimeType: 'text/html',
    status: 'selesai',
    progress: 100,
    downloadedAt: Date.now() - 1000 * 60 * 45,
  },
  {
    id: 'dl-2',
    filename: 'uBlock-FilterList-ID.txt',
    url: 'https://id.wikipedia.org',
    sizeText: '420 KB',
    mimeType: 'text/plain',
    status: 'selesai',
    progress: 100,
    downloadedAt: Date.now() - 1000 * 60 * 60 * 18,
  },
];

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
