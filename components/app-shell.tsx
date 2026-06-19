"use client";

import { AnimatedBackground } from "@/components/animated-background";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen w-full bg-black overflow-hidden">
      <AnimatedBackground />
      <main className="relative z-10 w-full min-h-screen flex items-center justify-center">
        {children}
      </main>
    </div>
  );
}
