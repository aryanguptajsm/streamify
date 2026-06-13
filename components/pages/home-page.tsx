"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, TrendingUp, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ComponentType } from "react";
import { StatCards } from "@/components/stat-cards";
import { UrlForm } from "@/components/url-form";
import { useStreamify } from "@/hooks/use-streamify";
import { useToast } from "@/components/toast-provider";
import { Skeleton } from "@/components/skeleton";

const sampleUrls = [
  { label: "Sample 1", url: "https://www.w3schools.com/html/mov_bbb.mp4" },
  { label: "Sample 2", url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" }
];

export function HomePage() {
  const router = useRouter();
  const { openVideo, recentActivity, history } = useStreamify();
  const { pushToast } = useToast();

  return (
    <div className="space-y-8">
      <section className="glass-strong overflow-hidden rounded-[36px] p-6 sm:p-8 lg:p-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.95fr)] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-cyan-100">
              <Sparkles className="h-3.5 w-3.5" />
              Premium video workspace
            </div>
            <h2 className="mt-6 max-w-3xl font-display text-5xl font-semibold tracking-tight text-white sm:text-6xl">
              Stream public video URLs in a polished, startup-grade player.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Paste a public link, validate it instantly, and open a sleek viewing surface with local history, favorites, keyboard shortcuts, and a floating mini player.
            </p>

            <div className="mt-8">
              <UrlForm
                onSubmit={(url) => {
                  const result = openVideo(url);
                  if (!result.ok) {
                    pushToast({ title: "Invalid link", description: result.message, tone: "error" });
                    return;
                  }
                  pushToast({ title: "Stream ready", description: "Opening the player with your media." });
                  router.push("/player");
                }}
                samples={sampleUrls}
              />
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/player"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:brightness-110"
              >
                Open player
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/history" className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10">
                View history
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <div className="glass rounded-[30px] p-5">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Dashboard signals</p>
              <div className="mt-4 grid gap-3">
                <SignalRow label="Loaded sessions" value={history.length.toString()} accent="cyan" />
                <SignalRow label="Recent activity" value={recentActivity.length.toString()} accent="sky" />
                <SignalRow label="Local bookmarks" value={history.filter((item) => item.favorite).length.toString()} accent="indigo" />
              </div>
            </div>
            <div className="glass rounded-[30px] p-5">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Experience</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <FeatureChip icon={Zap} label="Fast loading" />
                <FeatureChip icon={TrendingUp} label="Smooth motion" />
                <FeatureChip icon={Sparkles} label="Premium glass" />
                <FeatureChip icon={ArrowRight} label="Mobile ready" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <StatCards />

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="glass-strong rounded-[32px] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Recent activity</p>
              <h3 className="mt-2 font-display text-2xl font-semibold text-white">Latest watch sessions</h3>
            </div>
            <Link href="/history" className="text-sm text-cyan-200 transition hover:text-cyan-100">
              See all
            </Link>
          </div>

          <div className="mt-5 space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((item) => (
                <div key={item.id} className="flex items-center gap-4 rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <div className="h-16 w-24 overflow-hidden rounded-2xl bg-white/5">
                    {item.thumbnail ? <img src={item.thumbnail} alt="" className="h-full w-full object-cover" /> : <Skeleton className="h-full w-full" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-400">{item.sourceLabel}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-white/10 bg-white/5 p-8 text-center text-slate-400">
                No recent activity yet. Open a sample stream to populate the dashboard.
              </div>
            )}
          </div>
        </div>

        <div className="glass-strong rounded-[32px] p-6">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Product story</p>
          <h3 className="mt-2 font-display text-2xl font-semibold text-white">Designed like a premium SaaS</h3>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            Streamify blends cinematic visuals, precise controls, and local-first persistence into a web app that feels ready for a polished startup launch.
          </p>
          <div className="mt-6 grid gap-3">
            {[
              "Responsive dashboard layout",
              "Glassmorphism and gradient surfaces",
              "Keyboard shortcuts and mini player",
              "Searchable local history and bookmarks"
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function SignalRow({ label, value, accent }: { label: string; value: string; accent: "cyan" | "sky" | "indigo" }) {
  const accentClass =
    accent === "cyan" ? "from-cyan-500/20 to-cyan-500/5" : accent === "sky" ? "from-sky-500/20 to-sky-500/5" : "from-indigo-500/20 to-indigo-500/5";

  return (
    <div className={`rounded-[24px] bg-gradient-to-r ${accentClass} border border-white/10 p-4`}>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function FeatureChip({ icon: Icon, label }: { icon: ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
      <Icon className="h-4 w-4 text-cyan-300" />
      <p className="mt-3 text-sm text-white">{label}</p>
    </div>
  );
}
