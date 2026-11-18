import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  MoreVertical,
  Puzzle,
  Star,
  ChevronRight,
  Check,
  Trash2,
  X,
} from 'lucide-react';
import { ExtensionItem, ExtensionSettings } from '../types/browser';
import { ExtensionIconTile } from './BrandIcons';

interface ExtensionsViewProps {
  extensions: ExtensionItem[];
  extSettings: ExtensionSettings;
  onBack: () => void;
  onInstallToggle: (id: string) => void;
  onEnableToggle: (id: string) => void;
  onRemoveExtension: (id: string) => void;
  onUpdateSettings: (next: ExtensionSettings) => void;
  onOpenChromeWebStore: () => void;
  onOpenOverflowMenu: () => void;
}

type ExtTab = 'tersedia' | 'terpasang' | 'pengaturan';

export function ExtensionsView({
  extensions,
  extSettings,
  onBack,
  onInstallToggle,
  onEnableToggle,
  onRemoveExtension,
  onUpdateSettings,
  onOpenChromeWebStore,
  onOpenOverflowMenu,
}: ExtensionsViewProps) {
  const [activeTab, setActiveTab] = useState<ExtTab>('tersedia');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const installedList = useMemo(() => extensions.filter((e) => e.installed), [extensions]);

  const visibleList = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const base =
      activeTab === 'terpasang'
        ? installedList
        : extensions.filter((e) => e.featured || q.length > 0);
    if (!q) return base;
    return extensions.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
    );
  }, [activeTab, extensions, installedList, searchTerm]);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 pt-3 pb-24 space-y-3.5">
      {/* Top Bar */}
      <header className="flex items-center justify-between gap-2 min-h-[48px]">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onBack}
            aria-label="Kembali"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-white hover:bg-white/10 active:scale-95 transition"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-white truncate">Ekstensi</h1>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              setSearchOpen((prev) => !prev);
              if (searchOpen) setSearchTerm('');
            }}
            aria-label="Cari Ekstensi"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-white hover:bg-white/10 active:scale-95 transition"
          >
            {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </button>
          <button
            type="button"
            onClick={onOpenOverflowMenu}
            aria-label="Menu Ekstensi"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-white hover:bg-white/10 active:scale-95 transition"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Expandable Search Input */}
      {searchOpen && (
        <div className="bg-white rounded-xl px-3.5 h-11 flex items-center gap-2.5 shadow-md">
          <Search className="w-4 h-4 text-emerald-700 shrink-0" />
          <input
            type="text"
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari ekstensi Chrome..."
            className="flex-1 bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-500 outline-none"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Reset
            </button>
          )}
        </div>
      )}

      {/* Hero Info Banner */}
      <section className="rounded-2xl border border-[#74e629]/65 bg-[#054414]/70 px-4 py-3.5 flex items-center gap-3.5 shadow-[0_8px_22px_rgba(0,0,0,0.25)]">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
          <Puzzle className="w-11 h-11 text-[#99f326] fill-[#99f326]" />
        </div>
        <div className="min-w-0">
          <h2 className="text-[15px] sm:text-base font-bold text-white leading-snug">
            Kelola Ekstensi Chrome di Erto Browser
          </h2>
          <p className="text-xs sm:text-[13px] text-emerald-100/90 mt-0.5 leading-snug">
            Pasang, kelola dan aktifkan ekstensi favorit Anda.
          </p>
        </div>
      </section>

      {/* 3 Segmented Tabs: Tersedia | Terpasang | Pengaturan */}
      <div className="grid grid-cols-3 gap-1.5 bg-[#043710]/80 p-1 rounded-2xl border border-[#248b3b]/40">
        <button
          type="button"
          onClick={() => setActiveTab('tersedia')}
          className={`min-h-[42px] rounded-xl text-[13px] sm:text-sm font-bold transition whitespace-nowrap ${
            activeTab === 'tersedia'
              ? 'bg-[#a3e635] text-[#052e0d] shadow-sm'
              : 'text-white/95 hover:bg-white/10'
          }`}
        >
          Tersedia
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('terpasang')}
          className={`min-h-[42px] rounded-xl text-[13px] sm:text-sm font-bold transition whitespace-nowrap ${
            activeTab === 'terpasang'
              ? 'bg-[#a3e635] text-[#052e0d] shadow-sm'
              : 'text-white/95 hover:bg-white/10'
          }`}
        >
          Terpasang {installedList.length > 0 ? `(${installedList.length})` : ''}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pengaturan')}
          className={`min-h-[42px] rounded-xl text-[13px] sm:text-sm font-bold transition whitespace-nowrap ${
            activeTab === 'pengaturan'
              ? 'bg-[#a3e635] text-[#052e0d] shadow-sm'
              : 'text-white/95 hover:bg-white/10'
          }`}
        >
          Pengaturan
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'pengaturan' ? (
        <section className="bg-white/95 rounded-2xl divide-y divide-slate-200/80 shadow-lg overflow-hidden text-slate-900">
          {[
            {
              key: 'allowInIncognito' as const,
              title: 'Izinkan di Mode Penyamaran',
              desc: 'Tetap aktifkan ekstensi saat menjelajah secara pribadi.',
            },
            {
              key: 'autoUpdate' as const,
              title: 'Perbarui Ekstensi Otomatis',
              desc: 'Unduh versi terbaru dari Chrome Web Store saat Wi-Fi aktif.',
            },
            {
              key: 'allowUserScripts' as const,
              title: 'Izinkan Skrip Pengguna (Userscripts)',
              desc: 'Aktifkan dukungan skrip kustom untuk ekstensi pengembang.',
            },
            {
              key: 'developerMode' as const,
              title: 'Mode Pengembang',
              desc: 'Tampilkan detail versi, izin, dan muat ekstensi unpacked.',
            },
          ].map((setting) => {
            const checked = extSettings[setting.key];
            return (
              <div key={setting.key} className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900">{setting.title}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{setting.desc}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={checked}
                  onClick={() =>
                    onUpdateSettings({
                      ...extSettings,
                      [setting.key]: !checked,
                    })
                  }
                  className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${
                    checked ? 'bg-[#15803d]' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      checked ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </section>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {visibleList.length === 0 ? (
            <div className="md:col-span-2 bg-white/95 rounded-2xl p-8 text-center text-slate-700 shadow-md">
              <Puzzle className="w-10 h-10 text-emerald-700 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-bold text-slate-900">
                {activeTab === 'terpasang'
                  ? 'Belum ada ekstensi terpasang'
                  : 'Ekstensi tidak ditemukan'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {activeTab === 'terpasang'
                  ? 'Pilih tab Tersedia untuk memasang Google Translate, uBlock Origin, atau Dark Reader.'
                  : 'Coba kata kunci pencarian lain atau buka Chrome Web Store.'}
              </p>
              {activeTab === 'terpasang' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('tersedia')}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#15803d] text-white text-xs font-bold"
                >
                  Lihat Ekstensi Tersedia
                </button>
              )}
            </div>
          ) : (
            visibleList.map((ext) => (
              <article
                key={ext.id}
                className="bg-white/95 rounded-2xl p-3.5 shadow-[0_6px_18px_rgba(0,0,0,0.18)] flex items-center justify-between gap-3 border border-white"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <ExtensionIconTile iconKey={ext.iconKey} iconUrl={ext.iconUrl} alt={ext.name} />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[15px] font-bold text-slate-900 leading-tight truncate">
                      {ext.name}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5 leading-snug line-clamp-2">
                      {ext.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-xs">
                      <span className="inline-flex items-center gap-1 font-bold text-slate-800 tabular-nums">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        {ext.rating.toFixed(1)}
                      </span>
                      {ext.publisher && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="text-[11px] text-slate-500 truncate max-w-[140px]">
                            {ext.publisher}
                          </span>
                        </>
                      )}
                      {extSettings.developerMode && (
                        <>
                          <span className="text-slate-300">·</span>
                          <span className="font-mono text-[11px] text-slate-500">v{ext.version}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {activeTab === 'terpasang' ? (
                    <>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={ext.enabled}
                        aria-label={`Aktifkan ${ext.name}`}
                        onClick={() => onEnableToggle(ext.id)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          ext.enabled ? 'bg-[#15803d]' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`block w-4 h-4 rounded-full bg-white shadow transition-transform ${
                            ext.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveExtension(ext.id)}
                        aria-label={`Hapus ${ext.name}`}
                        className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl text-rose-600 hover:bg-rose-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  ) : ext.installed ? (
                    <button
                      type="button"
                      onClick={() => onEnableToggle(ext.id)}
                      className={`min-h-[38px] px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1 transition whitespace-nowrap ${
                        ext.enabled
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 text-slate-700 border border-slate-300'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      {ext.enabled ? 'Aktif' : 'Nonaktif'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onInstallToggle(ext.id)}
                      className="min-h-[38px] px-4 py-2 rounded-xl bg-[#15803d] hover:bg-[#166534] active:scale-95 text-white text-xs font-bold shadow-sm transition whitespace-nowrap"
                    >
                      Pasang
                    </button>
                  )}
                </div>
              </article>
            ))
          )}
        </section>
      )}

      {/* Chrome Web Store Callout Card */}
      <button
        type="button"
        onClick={onOpenChromeWebStore}
        className="w-full rounded-2xl bg-gradient-to-r from-[#bef264] via-[#a3e635] to-[#6bd621] p-4 flex items-center justify-between gap-3 shadow-[0_8px_22px_rgba(0,0,0,0.28)] active:scale-[0.99] transition text-left"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0">
            <Puzzle className="w-9 h-9 text-[#052e0d] fill-[#052e0d]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-extrabold text-[#052e0d] leading-tight">
              Chrome Web Store
            </h3>
            <p className="text-xs font-semibold text-[#134e1b] mt-0.5 truncate">
              Cari ekstensi lainnya di toko resmi Chrome
            </p>
          </div>
        </div>
        <ChevronRight className="w-6 h-6 text-[#052e0d] shrink-0" />
      </button>
    </div>
  );
}
