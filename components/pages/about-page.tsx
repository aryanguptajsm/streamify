"use client";

import { ShieldCheck, Sparkles, Zap } from "lucide-react";
import type { ComponentType } from "react";

export function AboutPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
      <section className="glass-strong rounded-[32px] p-6">
        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">About</p>
        <h2 className="mt-2 font-display text-4xl font-semibold text-white">Streamify is built like a premium product demo.</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
          The interface focuses on speed, clarity, and visual polish: glassmorphism surfaces, animated gradients, local persistence, and polished player controls that make the app feel ready for a launch stage.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <AboutCard icon={Sparkles} title="Elegant" text="Premium visuals and thoughtful spacing" />
          <AboutCard icon={Zap} title="Fast" text="Lean components and lazy-loaded player" />
          <AboutCard icon={ShieldCheck} title="Safe" text="Public URL validation and friendly errors" />
        </div>
      </section>

      <section className="glass-strong rounded-[32px] p-6">
        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Product values</p>
        <ul className="mt-4 space-y-3 text-sm text-slate-300">
          <li className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">Designed for a modern SaaS dashboard feel</li>
          <li className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">Mobile-first responsive layouts</li>
          <li className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">Local watch history and favorites</li>
          <li className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">Smooth page transitions and skeleton loaders</li>
        </ul>
      </section>
    </div>
  );
}

function AboutCard({ icon: Icon, title, text }: { icon: ComponentType<{ className?: string }>; title: string; text: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
      <Icon className="h-5 w-5 text-cyan-300" />
      <h3 className="mt-4 font-medium text-white">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">{text}</p>
    </div>
  );
}
