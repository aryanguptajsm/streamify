"use client";

import { AlertTriangle, History, WandSparkles } from "lucide-react";
import type { ComponentType } from "react";
import { UrlForm } from "@/components/url-form";
import { VideoPlayer } from "@/components/video-player";
import { useStreamify } from "@/hooks/use-streamify";
import { useToast } from "@/components/toast-provider";

const samples = [
  { label: "Sample A", url: "https://www.w3schools.com/html/mov_bbb.mp4" },
  { label: "Sample B", url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" }
];

export function PlayerPage() {
  const { openVideo, current, searchHistory } = useStreamify();
  const { pushToast } = useToast();

  return (
    <div className="space-y-6">
      <section className="glass-strong rounded-[32px] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Player</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-white">Paste a URL and start streaming</h2>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
            {searchHistory.length} recent searches
          </div>
        </div>

        <div className="mt-6">
          <UrlForm
            onSubmit={(url) => {
              const result = openVideo(url);
              if (!result.ok) {
                pushToast({ title: "Invalid link", description: result.message, tone: "error" });
                return;
              }
              pushToast({ title: "Video loaded", tone: "success" });
            }}
            samples={samples}
            onDropUrl={(url) => {
              const result = openVideo(url);
              if (!result.ok) {
                pushToast({ title: "Drop rejected", description: result.message, tone: "error" });
                return;
              }
              pushToast({ title: "URL dropped in", description: "The player has been prepared.", tone: "success" });
            }}
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-400">
          <HintChip icon={WandSparkles} label="Keyboard shortcuts" />
          <HintChip icon={History} label="Local history" />
          <HintChip icon={AlertTriangle} label="Only public URLs are allowed" />
        </div>
      </section>

      <VideoPlayer />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div className="glass-strong rounded-[32px] p-6">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Now playing</p>
          <h3 className="mt-2 font-display text-2xl font-semibold text-white">{current.title}</h3>
          <p className="mt-3 break-all text-sm leading-6 text-slate-400">{current.url || "No media loaded yet."}</p>
        </div>
        <div className="glass-strong rounded-[32px] p-6">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Notes</p>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            <li className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">Quality selection appears when the source exposes variants.</li>
            <li className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">Picture-in-picture and fullscreen are available from the control panel.</li>
            <li className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">Playback state is persisted locally for a smoother return experience.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}

function HintChip({ icon: Icon, label }: { icon: ComponentType<{ className?: string }>; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
      <Icon className="h-4 w-4 text-cyan-300" />
      {label}
    </span>
  );
}
