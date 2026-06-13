"use client";

import { SettingsPanel } from "@/components/settings-panel";

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <section className="glass-strong rounded-[32px] p-6">
        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Preferences</p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-white">Tune the viewing experience</h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Configure theme, auto-play, and default playback behavior. Everything is stored locally in your browser.
        </p>
      </section>

      <SettingsPanel />
    </div>
  );
}
