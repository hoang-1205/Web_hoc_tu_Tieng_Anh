'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { sound } from '@/lib/audio';
import {
  Flame, Coins, Volume2, VolumeX, Sparkles, BookOpen, Repeat,
  Compass, BarChart3, Trophy, ShoppingBag, ShieldAlert, Check
} from 'lucide-react';
import { PlayMode } from '@/types';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [userData, setUserData] = useState<any>({
    display_name: 'Học Bá Alpha',
    xp: 1240,
    level: 6,
    coins: 340,
    streak_current: 7,
    play_mode: 'adventure',
  });
  const [soundOn, setSoundOn] = useState(true);
  const [dueCount, setDueCount] = useState(12);

  useEffect(() => {
    fetch('/api/v1/me')
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) setUserData(data);
      })
      .catch(() => {});

    fetch('/api/v1/review/queue')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.due_count !== undefined) {
          setDueCount(data.due_count);
        }
      })
      .catch(() => {});
  }, [pathname]);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    sound.setSoundEnabled(next);
  };

  const togglePlayMode = async () => {
    const nextMode: PlayMode = userData.play_mode === 'adventure' ? 'learning' : 'adventure';
    setUserData((prev: any) => ({ ...prev, play_mode: nextMode }));
    try {
      await fetch('/api/v1/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ play_mode: nextMode }),
      });
    } catch (e) {}
  };

  const navLinks = [
    { href: '/app/dashboard', label: 'Dashboard', icon: Sparkles },
    { href: '/app/library', label: 'Thư viện', icon: BookOpen },
    { href: '/app/review', label: 'Ôn tập', icon: Repeat, badge: dueCount },
    { href: '/app/path', label: 'Lộ trình', icon: Compass },
    { href: '/app/report', label: 'Báo cáo', icon: BarChart3 },
    { href: '/app/leaderboard', label: 'Xếp hạng', icon: Trophy },
    { href: '/app/shop', label: 'Cửa hàng', icon: ShoppingBag },
    { href: '/admin', label: 'CMS', icon: ShieldAlert },
  ];

  const isPlayPage = pathname.startsWith('/app/play');

  if (isPlayPage) {
    // Hide standard navbar when playing game to maximize screen focus
    return null;
  }

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/30 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="font-heading font-black text-xl tracking-tight text-slate-900 dark:text-white">
                  Vocab<span className="text-brand-600">Quest</span>
                </span>
                <span className="block text-[10px] font-bold text-slate-400 -mt-1 tracking-wider uppercase">
                  EdTech Gamified v2.0
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 font-black'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                    {Boolean(link.badge) && (
                      <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Header Controls: Mode Toggle + Sound + Stats + Avatar */}
          <div className="flex items-center gap-3">
            {/* Play Mode Indicator & Switcher */}
            <button
              onClick={togglePlayMode}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold border transition-all ${
                userData.play_mode === 'learning'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 text-amber-700 dark:text-amber-300'
              }`}
              title="Nhấp để đổi giữa chế độ Học không áp lực và Thử thách"
            >
              <span className={`w-2 h-2 rounded-full ${userData.play_mode === 'learning' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span>{userData.play_mode === 'learning' ? 'Học tự do' : 'Thử thách'}</span>
            </button>

            {/* Sound toggle */}
            <button
              onClick={toggleSound}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              title={soundOn ? 'Tắt âm thanh' : 'Bật âm thanh'}
            >
              {soundOn ? <Volume2 className="w-5 h-5 text-brand-600" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
            </button>

            {/* Coins Balance */}
            <Link
              href="/app/shop"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-heading font-black text-xs hover:scale-105 transition-transform"
            >
              <Coins className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="tabular-nums">{userData.coins}</span>
            </Link>

            {/* Streak Flame */}
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 font-heading font-black text-xs">
              <Flame className="w-4 h-4 text-rose-500 fill-rose-500 animate-pulse" />
              <span className="tabular-nums">{userData.streak_current}</span>
            </div>

            {/* Level / XP Profile Avatar */}
            <Link href="/app/profile" className="flex items-center gap-2 pl-1 group">
              <div className="relative">
                <img
                  src={userData.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt="Avatar"
                  className="w-9 h-9 rounded-2xl object-cover ring-2 ring-brand-500/40 group-hover:ring-brand-500 transition-all"
                />
                <span className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded bg-brand-600 text-[9px] font-black text-white">
                  L{userData.level}
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="lg:hidden flex items-center justify-around border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 py-2 px-1 overflow-x-auto">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-bold ${
                isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
};
