"use client";

import { useEffect } from "react";
import type { ThemeMode } from "@/lib/types";

export function useThemeClass(theme: ThemeMode) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
  }, [theme]);
}
