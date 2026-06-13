"use client";

import { HistoryList } from "@/components/history-list";
import { useStreamify } from "@/hooks/use-streamify";

export function HistoryPage() {
  const { history, searchHistory } = useStreamify();

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-3">
        <Metric label="Total watched" value={history.length} />
        <Metric label="Bookmarks" value={history.filter((item) => item.favorite).length} />
        <Metric label="Search terms" value={searchHistory.length} />
      </section>

      <HistoryList />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass-strong rounded-[28px] p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}
