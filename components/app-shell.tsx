"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, BookMarked, Home, Info, Settings2, PlaySquare, Sparkles, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { AnimatedBackground } from "@/components/animated-background";
import { MiniPlayer } from "@/components/mini-player";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/player", label: "Player", icon: PlaySquare },
  { href: "/history", label: "History", icon: BarChart3 },
  { href: "/favorites", label: "Favorites", icon: BookMarked },
  { href: "/settings", label: "Settings", icon: Settings2 },
  { href: "/about", label: "About", icon: Info }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedBackground />
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1600px] gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <aside className="glass-strong sticky top-4 hidden h-[calc(100vh-2rem)] w-72 shrink-0 flex-col rounded-[28px] p-5 lg:flex">
          <div className="flex items-center gap-3 border-b border-white/10 pb-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-600 shadow-soft">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-display text-xl font-semibold tracking-tight">Streamify</p>
              <p className="text-sm text-slate-400">Premium media workspace</p>
            </div>
          </div>

          <nav className="mt-6 space-y-2">
            {navItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                    active ? "bg-white/10 text-white shadow-soft" : "text-slate-300 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-cyan-500/10 via-white/5 to-indigo-500/10 p-4">
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/80">Platform</p>
            <p className="mt-2 text-sm text-slate-200">
              Fast, elegant playback with local history, bookmarks, and a polished SaaS-style dashboard.
            </p>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="glass-strong sticky top-4 z-30 flex items-center justify-between rounded-[28px] px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen((value) => !value)}
                className="rounded-2xl border border-white/10 bg-white/5 p-3 text-slate-200 transition hover:bg-white/10 lg:hidden"
              >
                {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/70">Streamify</p>
                <h1 className="font-display text-lg font-semibold text-white sm:text-xl">
                  {navItems.find((item) => item.href === pathname)?.label ?? "Dashboard"}
                </h1>
              </div>
            </div>
            <div className="hidden items-center gap-3 md:flex">
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                Keyboard shortcuts enabled
              </div>
            </div>
          </header>

          <AnimatePresence mode="wait">
            <motion.main
              key={pathname}
              initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -12, filter: "blur(8px)" }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="pb-10 pt-6"
            >
              {children}
            </motion.main>
          </AnimatePresence>
        </div>
      </div>

      <MiniPlayer />

      <div className={cn("fixed inset-0 z-40 bg-slate-950/80 p-4 backdrop-blur-xl transition lg:hidden", mobileOpen ? "opacity-100" : "pointer-events-none opacity-0")}>
        <div className="glass-strong mx-auto flex max-w-sm flex-col rounded-[28px] p-4">
          <div className="flex items-center justify-between">
            <p className="font-display text-lg font-semibold">Navigate</p>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="rounded-2xl border border-white/10 bg-white/5 p-2 text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <nav className="mt-4 space-y-2">
            {navItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                    active ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
