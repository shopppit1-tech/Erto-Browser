import React from 'react';
import { Home, Download, Clock, Star, Settings } from 'lucide-react';
import { AppScreen } from '../types/browser';

interface BottomNavProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  downloadsBadge?: number;
}

const NAV_ITEMS: {
  id: Exclude<AppScreen, 'extensions' | 'browser'>;
  label: string;
  Icon: React.ComponentType<{ className?: string; fill?: string }>;
}[] = [
  { id: 'home', label: 'Beranda', Icon: Home },
  { id: 'downloads', label: 'Unduhan', Icon: Download },
  { id: 'history', label: 'Riwayat', Icon: Clock },
  { id: 'bookmarks', label: 'Bookmark', Icon: Star },
  { id: 'settings', label: 'Setelan', Icon: Settings },
];

export function BottomNav({ currentScreen, onNavigate, downloadsBadge = 0 }: BottomNavProps) {
  return (
    <nav
      aria-label="Navigasi Utama Erto Browser"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#043b12]/95 backdrop-blur-md border-t border-[#1e7c34]/50 shadow-[0_-4px_20px_rgba(0,0,0,0.35)]"
    >
      <div className="max-w-5xl mx-auto grid grid-cols-5 items-center h-16 px-1">
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const isActive = currentScreen === id || (id === 'home' && currentScreen === 'extensions');
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className="relative flex flex-col items-center justify-center min-h-[48px] rounded-xl transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a3e635]"
            >
              <div
                className={`flex items-center justify-center w-9 h-7 rounded-full transition-colors ${
                  isActive && currentScreen === 'extensions' && id === 'home'
                    ? 'bg-[#65d41b]/25'
                    : ''
                }`}
              >
                <Icon
                  className={`w-[21px] h-[21px] transition-colors ${
                    isActive ? 'text-[#fde047]' : 'text-white/95'
                  }`}
                  fill={isActive && (id === 'home' || id === 'bookmarks') ? '#fde047' : 'none'}
                />
              </div>
              <span
                className={`text-[11px] leading-tight mt-0.5 whitespace-nowrap tracking-tight ${
                  isActive ? 'text-[#fde047] font-semibold' : 'text-white/90 font-medium'
                }`}
              >
                {label}
              </span>
              {id === 'downloads' && downloadsBadge > 0 && (
                <span className="absolute top-1.5 right-1/4 min-w-[16px] h-4 px-1 rounded-full bg-[#a3e635] text-[#032d0c] text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {downloadsBadge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
