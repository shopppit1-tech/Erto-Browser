import React, { useState, useMemo } from 'react';
import { ArrowLeft, Clock, Search, Trash2, Globe, ExternalLink } from 'lucide-react';
import { HistoryItem } from '../types/browser';

interface HistoryViewProps {
  history: HistoryItem[];
  onBack: () => void;
  onOpenUrl: (url: string) => void;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
}

export function HistoryView({
  history,
  onBack,
  onOpenUrl,
  onDeleteItem,
  onClearAll,
}: HistoryViewProps) {
  const [query, setQuery] = useState('');

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? history.filter(
          (h) => h.title.toLowerCase().includes(q) || h.url.toLowerCase().includes(q)
        )
      : history;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayMs = todayStart.getTime();

    const today: HistoryItem[] = [];
    const earlier: HistoryItem[] = [];
    for (const item of filtered) {
      if (item.visitedAt >= todayMs) today.push(item);
      else earlier.push(item);
    }
    return { today, earlier };
  }, [history, query]);

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
          <h1 className="text-xl font-bold text-white">Riwayat</h1>
        </div>
        {history.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-rose-500/90 hover:bg-rose-600 text-white text-xs font-bold inline-flex items-center gap-1.5 transition"
          >
            <Trash2 className="w-4 h-4" />
            <span>Hapus Semua</span>
          </button>
        )}
      </header>

      <div className="bg-white/95 rounded-xl h-11 px-3.5 flex items-center gap-2.5 shadow">
        <Search className="w-4 h-4 text-emerald-700 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari riwayat penjelajahan..."
          className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-500 outline-none"
        />
      </div>

      {grouped.today.length === 0 && grouped.earlier.length === 0 ? (
        <div className="bg-white/95 rounded-2xl p-8 text-center text-slate-700 shadow-md">
          <Clock className="w-10 h-10 text-emerald-700 mx-auto mb-2 opacity-80" />
          <p className="text-sm font-bold text-slate-900">Riwayat kosong</p>
          <p className="text-xs text-slate-500 mt-1">
            Situs yang Anda kunjungi di Erto Browser akan tercatat di sini.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {[
            { label: 'Hari Ini', items: grouped.today },
            { label: 'Sebelumnya', items: grouped.earlier },
          ].map(
            (group) =>
              group.items.length > 0 && (
                <section key={group.label} className="space-y-2">
                  <h2 className="text-xs font-bold text-emerald-100 px-1">{group.label}</h2>
                  <div className="bg-white/95 rounded-2xl divide-y divide-slate-100 shadow-md overflow-hidden">
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 flex items-center justify-between gap-3 text-slate-900 hover:bg-emerald-50/70 transition"
                      >
                        <button
                          type="button"
                          onClick={() => onOpenUrl(item.url)}
                          className="flex items-center gap-3 min-w-0 flex-1 text-left"
                        >
                          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                            <Globe className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-slate-900 truncate">{item.title}</p>
                            <p className="text-xs text-slate-500 truncate font-mono">{item.url}</p>
                          </div>
                        </button>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[11px] text-slate-400 tabular-nums hidden sm:inline">
                            {new Date(item.visitedAt).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <button
                            type="button"
                            onClick={() => onOpenUrl(item.url)}
                            aria-label="Buka"
                            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-emerald-700 hover:bg-emerald-100"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteItem(item.id)}
                            aria-label="Hapus item"
                            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )
          )}
        </div>
      )}
    </div>
  );
}
