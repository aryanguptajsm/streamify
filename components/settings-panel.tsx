"use client";

import { ShieldCheck, Trash2 } from "lucide-react";
import { useStreamify } from "@/hooks/use-streamify";
import { useToast } from "@/components/toast-provider";
import type { PlaybackSpeed, ThemeMode } from "@/lib/types";

const speedOptions: PlaybackSpeed[] = [0.75, 1, 1.25, 1.5, 1.75, 2];

export function SettingsPanel() {
  const { settings, setSettings, clearHistory } = useStreamify();
  const { pushToast } = useToast();

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="glass-strong rounded-[28px] p-6">
        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Appearance</p>
        <h3 className="mt-2 font-display text-2xl font-semibold text-white">Theme switcher</h3>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {(["dark", "light"] as ThemeMode[]).map((theme) => (
            <button
              key={theme}
              type="button"
              onClick={() => setSettings((value) => ({ ...value, theme }))}
              className={`rounded-[24px] border px-4 py-4 text-left transition ${
                settings.theme === theme ? "border-cyan-400/30 bg-cyan-400/10 text-white" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              <p className="font-medium capitalize">{theme}</p>
              <p className="mt-1 text-sm text-slate-400">{theme === "dark" ? "Default premium mode" : "Bright studio mode"}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="glass-strong rounded-[28px] p-6">
        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Playback</p>
        <h3 className="mt-2 font-display text-2xl font-semibold text-white">Default speed</h3>
        <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {speedOptions.map((speed) => (
            <button
              key={speed}
              type="button"
              onClick={() => setSettings((value) => ({ ...value, defaultPlaybackSpeed: speed }))}
              className={`rounded-2xl border px-3 py-3 text-sm transition ${
                settings.defaultPlaybackSpeed === speed ? "border-cyan-400/30 bg-cyan-400/10 text-white" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      <div className="glass-strong rounded-[28px] p-6">
        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Behavior</p>
        <h3 className="mt-2 font-display text-2xl font-semibold text-white">Auto-play</h3>
        <label className="mt-5 flex items-center justify-between rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
          <span>
            <span className="block text-sm font-medium text-white">Start videos automatically</span>
            <span className="block text-sm text-slate-400">Useful for quick preview sessions</span>
          </span>
          <input
            checked={settings.autoplay}
            onChange={(event) => setSettings((value) => ({ ...value, autoplay: event.target.checked }))}
            type="checkbox"
            className="h-5 w-5 rounded border-white/20 bg-transparent text-cyan-400 focus:ring-cyan-400/60"
          />
        </label>
      </div>

      <div className="glass-strong rounded-[28px] p-6">
        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Privacy</p>
        <h3 className="mt-2 font-display text-2xl font-semibold text-white">Local storage reset</h3>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Clear watch history, search history, and the active playback session stored in this browser.
        </p>
        <button
          type="button"
          onClick={() => {
            clearHistory();
            pushToast({ title: "History cleared", description: "Your local Streamify data has been reset.", tone: "success" });
          }}
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 via-red-500 to-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-soft transition hover:brightness-110"
        >
          <Trash2 className="h-4 w-4" />
          Clear history
        </button>
      </div>
    </div>
  );
}
