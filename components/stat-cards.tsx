"use client";

import { Flame, Heart, PlayCircle, TrendingUp } from "lucide-react";
import { useStreamify } from "@/hooks/use-streamify";

export function StatCards() {
  const { stats } = useStreamify();

  const cards = [
    { label: "Videos watched", value: stats.watchedCount, icon: PlayCircle, tone: "from-cyan-500/20 to-sky-500/10" },
    { label: "Favorites", value: stats.favoritesCount, icon: Heart, tone: "from-fuchsia-500/20 to-purple-500/10" },
    { label: "Average speed", value: `${stats.averageSpeed}x`, icon: TrendingUp, tone: "from-emerald-500/20 to-teal-500/10" },
    { label: "Premium mode", value: "Active", icon: Flame, tone: "from-amber-500/20 to-orange-500/10" }
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="glass-strong rounded-[28px] p-5">
            <div className={`inline-flex rounded-2xl bg-gradient-to-br ${card.tone} p-3 text-white`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="mt-5 text-sm text-slate-400">{card.label}</p>
            <p className="mt-2 font-display text-3xl font-semibold text-white">{card.value}</p>
          </div>
        );
      })}
    </div>
  );
}
