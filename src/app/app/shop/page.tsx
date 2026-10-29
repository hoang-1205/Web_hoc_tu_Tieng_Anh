'use client';

import React, { useState, useEffect } from 'react';
import { sound } from '@/lib/audio';
import {
  ShoppingBag, Coins, Shield, Heart, HelpCircle, Clock, Crown,
  CheckCircle2, Sparkles
} from 'lucide-react';
import { ShopItem } from '@/types';

export default function ShopPage() {
  const [coins, setCoins] = useState(340);
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasedCode, setPurchasedCode] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/shop/items')
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          setCoins(data.coins);
          setItems(data.items);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handlePurchase = async (item: ShopItem) => {
    if (coins < item.price_coins) {
      sound.playWrong();
      alert('Bạn không đủ Coins! Hãy hoàn thành thêm pack và nhiệm vụ để kiếm coins.');
      return;
    }

    try {
      const res = await fetch('/api/v1/shop/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_code: item.code, quantity: 1 }),
      });
      const data = await res.json();
      if (!data.error) {
        sound.playWin();
        setCoins(data.coins_left);
        setPurchasedCode(item.code);
        setItems((prev) =>
          prev.map((i) =>
            i.code === item.code ? { ...i, owned_quantity: (i.owned_quantity || 0) + 1 } : i
          )
        );
        setTimeout(() => setPurchasedCode(null), 2000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getItemIcon = (code: string) => {
    switch (code) {
      case 'streak_freeze': return Shield;
      case 'heart_refill': return Heart;
      case 'hint_token': return HelpCircle;
      case 'time_freeze': return Clock;
      default: return Crown;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 w-full space-y-8 animate-fadeIn">
      {/* Header with Balance */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-bold mb-1">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Cửa Hàng Vật Phẩm & Kho Đồ</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-slate-900 dark:text-white">
            Cửa Hàng VocabQuest
          </h1>
          <p className="text-xs text-slate-500">
            Dùng Coins kiếm được từ các bài học để đổi vật phẩm hỗ trợ gameplay.
          </p>
        </div>

        <div className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border-2 border-amber-300 text-amber-700 dark:text-amber-300">
          <Coins className="w-6 h-6 text-amber-500 fill-amber-500" />
          <span className="font-heading font-black text-2xl tabular-nums">{coins}</span>
          <span className="text-xs font-bold">Coins</span>
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => {
          const Icon = getItemIcon(item.code);
          const isJustBought = purchasedCode === item.code;
          return (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border border-slate-200 dark:border-slate-700 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-400">
                    Sở hữu: <span className="text-brand-600 font-black">{item.owned_quantity || 0}</span>
                  </span>
                </div>

                <h3 className="font-heading font-black text-lg text-slate-900 dark:text-white mb-1">
                  {item.name_vi}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-6">
                  {item.description_vi}
                </p>
              </div>

              <div>
                <button
                  onClick={() => handlePurchase(item)}
                  className={`w-full py-3.5 rounded-2xl font-heading font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
                    isJustBought
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25'
                  }`}
                >
                  {isJustBought ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Đã Mua Thành Công!</span>
                    </>
                  ) : (
                    <>
                      <Coins className="w-4 h-4 fill-current" />
                      <span>{item.price_coins} Coins · Mua ngay</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
