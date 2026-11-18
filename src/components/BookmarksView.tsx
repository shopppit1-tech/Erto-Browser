import React, { useState, useMemo } from 'react';
import { ArrowLeft, Star, Search, Plus, Trash2, Pin, ExternalLink } from 'lucide-react';
import { BookmarkItem } from '../types/browser';
import { SiteBrandTile } from './BrandIcons';

interface BookmarksViewProps {
  bookmarks: BookmarkItem[];
  onBack: () => void;
  onOpenUrl: (url: string) => void;
  onAddBookmark: (title: string, url: string, category: string) => void;
  onDeleteBookmark: (id: string) => void;
  onTogglePinHome: (id: string) => void;
}

export function BookmarksView({
  bookmarks,
  onBack,
  onOpenUrl,
  onAddBookmark,
  onDeleteBookmark,
  onTogglePinHome,
}: BookmarksViewProps) {
  const [query, setQuery] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('Favorit');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return bookmarks;
    return bookmarks.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.url.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q)
    );
  }, [bookmarks, query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;
    const normalizedUrl = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
    onAddBookmark(title.trim(), normalizedUrl, category);
    setTitle('');
    setUrl('');
    setShowAdd(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 pt-3 pb-24 space-y-3.5">
      <header className="flex items-center justify-between gap-2 min-h-[48px]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            aria-label="Kembali"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-white hover:bg-white/10 transition"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-white">Bookmark</h1>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd((p) => !p)}
          className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#a3e635] text-[#052e0d] text-xs font-bold inline-flex items-center gap-1.5 hover:bg-[#bef264] transition"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah</span>
        </button>
      </header>

      {showAdd && (
        <form
          onSubmit={handleSubmit}
          className="bg-white/95 rounded-2xl p-4 shadow-lg space-y-3 text-slate-900"
        >
          <h2 className="text-sm font-bold">Tambah Bookmark Baru</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nama situs (mis. Kompas)"
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-600"
              required
            />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="URL (mis. kompas.com)"
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-600"
              required
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
            >
              <option value="Favorit">Favorit</option>
              <option value="Pencarian">Pencarian</option>
              <option value="Hiburan">Hiburan</option>
              <option value="Sosial">Sosial</option>
              <option value="Edukasi">Edukasi</option>
              <option value="Teknologi">Teknologi</option>
            </select>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#15803d] text-white text-xs font-bold"
              >
                Simpan
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="bg-white/95 rounded-xl h-11 px-3.5 flex items-center gap-2.5 shadow">
        <Search className="w-4 h-4 text-emerald-700 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari bookmark..."
          className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-500 outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white/95 rounded-2xl p-8 text-center text-slate-700 shadow-md">
          <Star className="w-10 h-10 text-emerald-700 mx-auto mb-2 opacity-80" />
          <p className="text-sm font-bold text-slate-900">Belum ada bookmark</p>
          <p className="text-xs text-slate-500 mt-1">
            Tekan Tambah atau ketuk ikon Bintang saat menjelajah situs.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((bm) => (
            <article
              key={bm.id}
              className="bg-white/95 rounded-2xl p-3.5 shadow-md flex items-center justify-between gap-3 text-slate-900"
            >
              <button
                type="button"
                onClick={() => onOpenUrl(bm.url)}
                className="flex items-center gap-3 min-w-0 flex-1 text-left"
              >
                <SiteBrandTile iconKey={bm.iconKey} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 truncate">{bm.title}</p>
                  <p className="text-xs text-slate-500 truncate font-mono">{bm.url}</p>
                  <p className="text-[11px] font-medium text-emerald-700 mt-0.5">
                    {bm.category} {bm.pinnedOnHome ? '· Disematkan di Beranda' : ''}
                  </p>
                </div>
              </button>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onTogglePinHome(bm.id)}
                  title={bm.pinnedOnHome ? 'Lepas dari Beranda' : 'Sematkan ke Beranda'}
                  className={`min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl transition ${
                    bm.pinnedOnHome
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <Pin className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onOpenUrl(bm.url)}
                  aria-label="Buka"
                  className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-emerald-700 hover:bg-emerald-50"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteBookmark(bm.id)}
                  aria-label="Hapus"
                  className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
