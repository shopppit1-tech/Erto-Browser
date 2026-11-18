import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Download,
  FileText,
  Trash2,
  ExternalLink,
  Search,
  Pause,
  Play,
  Plus,
} from 'lucide-react';
import { DownloadItem } from '../types/browser';

interface DownloadsViewProps {
  downloads: DownloadItem[];
  onBack: () => void;
  onDeleteDownload: (id: string) => void;
  onTogglePauseDownload: (id: string) => void;
  onTriggerNewDownload: (filename: string, url: string) => void;
  onOpenUrl: (url: string) => void;
}

export function DownloadsView({
  downloads,
  onBack,
  onDeleteDownload,
  onTogglePauseDownload,
  onTriggerNewDownload,
  onOpenUrl,
}: DownloadsViewProps) {
  const [filter, setFilter] = useState<'semua' | 'selesai' | 'berjalan'>('semua');
  const [query, setQuery] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const filtered = useMemo(() => {
    return downloads.filter((d) => {
      if (filter === 'selesai' && d.status !== 'selesai') return false;
      if (filter === 'berjalan' && d.status === 'selesai') return false;
      if (query.trim() && !d.filename.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [downloads, filter, query]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = urlInput.trim();
    if (!cleaned) return;
    const normalized = /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`;
    const name = normalized.split('/').pop()?.split('?')[0] || 'erto-file.html';
    onTriggerNewDownload(name.includes('.') ? name : `${name}.html`, normalized);
    setUrlInput('');
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
          <h1 className="text-xl font-bold text-white">Unduhan</h1>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd((p) => !p)}
          className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#a3e635] text-[#052e0d] text-xs font-bold inline-flex items-center gap-1.5 hover:bg-[#bef264] transition"
        >
          <Plus className="w-4 h-4" />
          <span>Unduh URL</span>
        </button>
      </header>

      {showAdd && (
        <form onSubmit={handleAddSubmit} className="bg-white/95 rounded-2xl p-3.5 shadow-lg flex gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Tempel URL file atau halaman (mis. wikipedia.org)"
            className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 outline-none focus:border-emerald-600"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-[#15803d] text-white text-xs font-bold shrink-0"
          >
            Mulai
          </button>
        </form>
      )}

      {/* Search + Segmented Filter */}
      <div className="space-y-2.5">
        <div className="bg-white/95 rounded-xl h-11 px-3.5 flex items-center gap-2.5 shadow">
          <Search className="w-4 h-4 text-emerald-700 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari file unduhan..."
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-3 gap-1.5 bg-[#043710]/80 p-1 rounded-2xl border border-[#248b3b]/40">
          {(
            [
              { id: 'semua', label: 'Semua' },
              { id: 'selesai', label: 'Selesai' },
              { id: 'berjalan', label: 'Berjalan' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`min-h-[40px] rounded-xl text-xs sm:text-sm font-bold transition ${
                filter === tab.id ? 'bg-[#a3e635] text-[#052e0d]' : 'text-white/90 hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Downloads List */}
      <section className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="bg-white/95 rounded-2xl p-8 text-center text-slate-700 shadow-md">
            <Download className="w-10 h-10 text-emerald-700 mx-auto mb-2 opacity-80" />
            <p className="text-sm font-bold text-slate-900">Belum ada unduhan</p>
            <p className="text-xs text-slate-500 mt-1">
              File dan halaman yang Anda unduh di Erto Browser akan muncul di sini.
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <article
              key={item.id}
              className="bg-white/95 rounded-2xl p-3.5 shadow-md flex items-center justify-between gap-3 text-slate-900"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{item.filename}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 tabular-nums">
                    <span>{item.sizeText}</span>
                    <span>·</span>
                    <span>{item.status === 'selesai' ? 'Selesai' : item.status === 'jeda' ? 'Dijeda' : `${item.progress}%`}</span>
                    <span>·</span>
                    <span>{new Date(item.downloadedAt).toLocaleDateString('id-ID')}</span>
                  </div>
                  {item.status !== 'selesai' && (
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1.5">
                      <div
                        className="h-full bg-[#15803d] transition-all"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {item.status !== 'selesai' ? (
                  <button
                    type="button"
                    onClick={() => onTogglePauseDownload(item.id)}
                    aria-label={item.status === 'jeda' ? 'Lanjutkan' : 'Jeda'}
                    className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl text-emerald-700 hover:bg-emerald-50"
                  >
                    {item.status === 'jeda' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onOpenUrl(item.url)}
                    aria-label="Buka Sumber"
                    className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl text-emerald-700 hover:bg-emerald-50"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDeleteDownload(item.id)}
                  aria-label="Hapus Unduhan"
                  className="min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
