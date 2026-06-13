import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { ToastProvider } from "@/components/toast-provider";
import { StreamifyProvider } from "@/hooks/use-streamify";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: {
    default: "Streamify",
    template: "%s | Streamify"
  },
  description: "Premium browser-based streaming workspace for public video URLs with local history, bookmarks, and polished playback controls.",
  keywords: ["video player", "streaming", "Next.js", "React Player", "dashboard", "media"],
  openGraph: {
    title: "Streamify",
    description: "A premium SaaS-style video streaming experience for public URLs.",
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="font-sans">
        <StreamifyProvider>
          <ToastProvider>
            <AppShell>{children}</AppShell>
          </ToastProvider>
        </StreamifyProvider>
      </body>
    </html>
  );
}
