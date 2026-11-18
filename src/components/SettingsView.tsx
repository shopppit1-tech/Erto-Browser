import React from 'react';
import {
  ArrowLeft,
  Search,
  ShieldCheck,
  Monitor,
  Moon,
  Trash2,
  Puzzle,
  Info,
} from 'lucide-react';
import { BrowserSettings, SearchEngine } from '../types/browser';
import { ASSETS } from '../data/defaults';
import { PWAInstallButton } from './PWAInstallUI';

interface SettingsViewProps {
  settings: BrowserSettings;
  onUpdateSettings: (next: BrowserSettings) => void;
  onClearBrowsingData: () => void;
  onOpenExtensions: () => void;
  onBack: () => void;
}

export function SettingsView({
  settings,
  onUpdateSettings,
  onClearBrowsingData,
  onOpenExtensions,
  onBack,
}: SettingsViewProps) {
  const toggleSetting = (key: 'adShieldBuiltIn' | 'blockTrackers' | 'desktopDefault' | 'forceDarkWeb' | 'saveHistory') => {
    onUpdateSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 pt-3 pb-24 space-y-4">
      <header className="flex items-center gap-2 min-h-[48px]">
        <button
          type="button"
          onClick={onBack}
          aria-label="Kembali"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-white hover:bg-white/10 transition"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-white">Setelan</h1>
      </header>

      {/* Brand Summary */}
      <section className="rounded-2xl bg-[#054414]/80 border border-[#65d41b]/50 p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src={ASSETS.eagleLogo}
            alt="Erto Browser"
            referrerPolicy="no-referrer"
            className="w-12 h-12 rounded-xl object-cover border border-[#4ade80]/50"
          />
          <div>
            <h2 className="text-base font-extrabold text-white">Erto Browser</h2>
            <p className="text-xs text-emerald-100">Mesin Chromium Mobile • Support Ekstensi</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenExtensions}
          className="px-3.5 py-2 rounded-xl bg-[#a3e635] text-[#052e0d] text-xs font-bold inline-flex items-center gap-1.5 shrink-0"
        >
          <Puzzle className="w-4 h-4" />
          <span>Ekstensi</span>
        </button>
      </section>

      {/* PWA Install Card */}
      <PWAInstallButton variant="card" alwaysShowGuideFallback />

      {/* Mesin Pencari & Tampilan */}
      <section className="bg-white/95 rounded-2xl divide-y divide-slate-200/70 shadow-lg overflow-hidden text-slate-900">
        <div className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Search className="w-5 h-5 text-emerald-700 shrink-0" />
            <div>
              <p className="text-sm font-bold">Mesin Pencari Default</p>
              <p className="text-xs text-slate-500">Digunakan saat mencari dari bilah alamat</p>
            </div>
          </div>
          <select
            value={settings.searchEngine}
            onChange={(e) =>
              onUpdateSettings({ ...settings, searchEngine: e.target.value as SearchEngine })
            }
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 outline-none"
          >
            <option value="google">Google</option>
            <option value="duckduckgo">DuckDuckGo</option>
            <option value="bing">Bing</option>
            <option value="yahoo">Yahoo</option>
          </select>
        </div>

        <div className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
            <div>
              <p className="text-sm font-bold">Pemblokir Iklan Bawaan (AdShield)</p>
              <p className="text-xs text-slate-500">Blokir iklan pop-up & banner mengganggu</p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.adShieldBuiltIn}
            onClick={() => toggleSetting('adShieldBuiltIn')}
            className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${
              settings.adShieldBuiltIn ? 'bg-[#15803d]' : 'bg-slate-300'
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
                settings.adShieldBuiltIn ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Moon className="w-5 h-5 text-emerald-700 shrink-0" />
            <div>
              <p className="text-sm font-bold">Mode Gelap Halaman Web</p>
              <p className="text-xs text-slate-500">Otomatis gelapkan halaman saat membaca</p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.forceDarkWeb}
            onClick={() => toggleSetting('forceDarkWeb')}
            className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${
              settings.forceDarkWeb ? 'bg-[#15803d]' : 'bg-slate-300'
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
                settings.forceDarkWeb ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Monitor className="w-5 h-5 text-emerald-700 shrink-0" />
            <div>
              <p className="text-sm font-bold">Mode Situs Desktop Default</p>
              <p className="text-xs text-slate-500">Minta tampilan desktop pada semua situs</p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.desktopDefault}
            onClick={() => toggleSetting('desktopDefault')}
            className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${
              settings.desktopDefault ? 'bg-[#15803d]' : 'bg-slate-300'
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
                settings.desktopDefault ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold">Ukuran Teks Halaman</p>
            <p className="text-xs text-slate-500">Atur kenyamanan baca di peramban</p>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(['kecil', 'normal', 'besar'] as const).map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => onUpdateSettings({ ...settings, textSize: sz })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                  settings.textSize === sz ? 'bg-[#15803d] text-white' : 'text-slate-700'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Privasi & Data */}
      <section className="bg-white/95 rounded-2xl divide-y divide-slate-200/70 shadow-lg overflow-hidden text-slate-900">
        <div className="p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold">Simpan Riwayat Penjelajahan</p>
            <p className="text-xs text-slate-500">Catat situs yang dikunjungi di tab normal</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.saveHistory}
            onClick={() => toggleSetting('saveHistory')}
            className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${
              settings.saveHistory ? 'bg-[#15803d]' : 'bg-slate-300'
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
                settings.saveHistory ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <button
          type="button"
          onClick={onClearBrowsingData}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-rose-50 transition"
        >
          <div className="flex items-center gap-3">
            <Trash2 className="w-5 h-5 text-rose-600" />
            <div>
              <p className="text-sm font-bold text-rose-700">Hapus Data Penjelajahan</p>
              <p className="text-xs text-slate-500">Bersihkan riwayat, cache, dan sesi tab</p>
            </div>
          </div>
        </button>

        <div className="p-4 flex items-center gap-3">
          <Info className="w-5 h-5 text-emerald-700 shrink-0" />
          <div>
            <p className="text-sm font-bold">Tentang Erto Browser</p>
            <p className="text-xs text-slate-500">
              Cepat • Aman • Support Ekstensi Chrome (uBlock Origin, Dark Reader, Google Translate)
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
