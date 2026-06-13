"use client";

import Link from "next/link";
import { Heart, Play } from "lucide-react";
import { useMemo, useState } from "react";
import { useStreamify } from "@/hooks/use-streamify";
import { formatDuration } from "@/lib/utils";
import { useToast } from "@/components/toast-provider";

export function FavoritesGrid() {
  const { history, toggleFavorite, loadVideoById } = useStreamify();
  const { pushToast } = useToast();
  const [query, setQuery] = useState("");

  const favorites = useMemo(() => history.filter((item) => item.favorite), [history]);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return favorites;
    return favorites.filter((item) => [item.title, item.url, item.sourceLabel].some((field) => field.toLowerCase().includes(term)));
  }, [favorites, query]);

  return (
    <div className="space-y-4">
      <div className="glass-strong rounded-[28px] p-4">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search favorites"
          className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((item) => (
          <article key={item.id} className="glass-strong overflow-hidden rounded-[28px]">
            <div className="relative">
              {item.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.thumbnail} alt="" className="h-48 w-full object-cover" />
              ) : (
                <div className="flex h-48 items-center justify-center bg-gradient-to-br from-cyan-500/30 via-slate-700 to-indigo-500/30 text-slate-200">
                  <Play className="h-8 w-8" />
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  toggleFavorite(item.id);
                  pushToast({ title: "Removed from favorites", tone: "warning" });
                }}
                className="absolute right-4 top-4 rounded-full bg-slate-950/70 p-2 text-white backdrop-blur"
              >
                <Heart className="h-4 w-4 fill-current" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/70">{item.sourceLabel}</p>
              <h3 className="mt-2 truncate font-display text-xl font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{formatDuration(item.durationSeconds)}</p>
              <div className="mt-5 flex items-center gap-2">
                <Link
                  href="/player"
                  onClick={() => loadVideoById(item.id)}
                  className="flex-1 rounded-2xl bg-white/10 px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-white/15"
                >
                  Watch
                </Link>
              </div>
            </div>
          </article>
        ))}

        {filtered.length === 0 ? (
          <div className="glass-strong rounded-[28px] p-10 text-center text-slate-400 md:col-span-2 xl:col-span-3">
            No favorites saved yet. Mark any history item to pin it here.
          </div>
        ) : null}
      </div>
    </div>
  );
}
