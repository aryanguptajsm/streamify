"use client";

import { useEffect, useMemo, useState } from "react";
import { Expand, Pause, Play, X } from "lucide-react";
import Link from "next/link";
import { useStreamify } from "@/hooks/use-streamify";
import { cn, formatPercent } from "@/lib/utils";

export function MiniPlayer() {
  const { current, setPlaying } = useStreamify();
  const [open, setOpen] = useState(true);

  const hasVideo = Boolean(current.url);

  useEffect(() => {
    if (hasVideo) {
      setOpen(true);
    }
  }, [hasVideo]);

  const progress = useMemo(() => formatPercent(current.progress || 0), [current.progress]);

  if (!hasVideo || !open) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[70] w-[min(92vw,22rem)]">
      <div className="glass-strong overflow-hidden rounded-[26px] p-3 shadow-premium">
        <div className="flex items-start gap-3">
          <div className="relative h-20 w-28 overflow-hidden rounded-2xl bg-white/5">
            {current.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={current.thumbnail} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/40 via-slate-700 to-indigo-500/40" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{current.title}</p>
            <p className="mt-1 text-xs text-slate-400">{current.sourceLabel}</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500" style={{ width: `${Math.max(current.progress * 100, 4)}%` }} />
            </div>
            <p className="mt-2 text-xs text-slate-400">{progress} watched</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPlaying(!current.playing)}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/15"
          >
            {current.playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {current.playing ? "Pause" : "Play"}
          </button>
          <Link
            href="/player"
            className="rounded-2xl border border-white/10 bg-white/5 p-2.5 text-slate-200 transition hover:bg-white/10"
          >
            <Expand className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
