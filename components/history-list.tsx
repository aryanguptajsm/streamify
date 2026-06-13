"use client";

import Link from "next/link";
import { BookMarked, Play } from "lucide-react";
import { useMemo, useState } from "react";
import { useStreamify } from "@/hooks/use-streamify";
import { formatDuration, formatRelativeTime } from "@/lib/utils";
import { useToast } from "@/components/toast-provider";

export function HistoryList() {
  const { history, toggleFavorite, loadVideoById, registerSearchTerm } = useStreamify();
  const [query, setQuery] = useState("");
  const { pushToast } = useToast();

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return history;
    return history.filter((item) => [item.title, item.url, item.sourceLabel].some((field) => field.toLowerCase().includes(term)));
  }, [history, query]);

  return (
    <div className="space-y-4">
      <div className="glass-strong rounded-[28px] p-4">
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            registerSearchTerm(event.target.value);
          }}
          placeholder="Search history"
          className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/60"
        />
      </div>

      <div className="grid gap-4">
        {filtered.map((item) => (
          <article key={item.id} className="glass-strong grid gap-4 rounded-[28px] p-4 lg:grid-cols-[220px_minmax(0,1fr)_auto]">
            <div className="relative overflow-hidden rounded-[24px] bg-white/5">
              {item.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.thumbnail} alt="" className="h-40 w-full object-cover" />
              ) : (
                <div className="flex h-40 items-center justify-center bg-gradient-to-br from-cyan-500/30 via-slate-700 to-indigo-500/30 text-slate-200">
                  <Play className="h-8 w-8" />
                </div>
              )}
            </div>

            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/70">{item.sourceLabel}</p>
              <h3 className="mt-2 truncate font-display text-2xl font-semibold text-white">{item.title}</h3>
              <p className="mt-2 break-all text-sm text-slate-400">{item.url}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-300">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{formatDuration(item.durationSeconds)}</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{formatRelativeTime(item.watchedAt)}</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{item.views} plays</span>
              </div>
            </div>

            <div className="flex flex-wrap items-start justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  toggleFavorite(item.id);
                  pushToast({ title: item.favorite ? "Removed from favorites" : "Added to favorites", tone: "success" });
                }}
                className="rounded-2xl border border-white/10 bg-white/5 p-3 text-slate-200 transition hover:bg-white/10"
                aria-label="Toggle favorite"
              >
                <BookMarked className="h-4 w-4" />
              </button>
              <Link
                href="/player"
                onClick={() => loadVideoById(item.id)}
                className="rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-soft transition hover:brightness-110"
              >
                Open
              </Link>
            </div>
          </article>
        ))}

        {filtered.length === 0 ? (
          <div className="glass-strong rounded-[28px] p-10 text-center text-slate-400">
            No matching history yet. Paste a video URL on the Player page to get started.
          </div>
        ) : null}
      </div>
    </div>
  );
}
