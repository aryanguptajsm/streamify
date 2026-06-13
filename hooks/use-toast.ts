"use client";

import { createContext, useContext } from "react";

export interface ToastAPI {
  pushToast: (toast: { title: string; description?: string; tone?: "default" | "success" | "error" | "warning" }) => void;
}

export const ToastContext = createContext<ToastAPI | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);

  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return ctx;
}
