"use client";

import { FavoritesGrid } from "@/components/favorites-grid";
import { useStreamify } from "@/hooks/use-streamify";

export function FavoritesPage() {
  const { history } = useStreamify();

  return (
    <div className="space-y-6">
      <section className="glass-strong rounded-[32px] p-6">
        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Bookmarks</p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-white">Your favorite streams</h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Keep the best content in a fast, beautiful grid. Favorites are stored locally so they stay with your browser.
        </p>
        <div className="mt-5 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
          {history.filter((item) => item.favorite).length} saved
        </div>
      </section>

      <FavoritesGrid />
    </div>
  );
}
