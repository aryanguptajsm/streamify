"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";
import { createId, cn } from "@/lib/utils";
import type { ToastMessage } from "@/lib/types";

interface ToastContextValue {
  pushToast: (input: { title: string; description?: string; tone?: ToastMessage["tone"] }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);

  if (!ctx) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const pushToast: ToastContextValue["pushToast"] = (input) => {
    const toast: ToastMessage = {
      id: createId("toast"),
      title: input.title,
      description: input.description,
      tone: input.tone ?? "default"
    };

    setToasts((items) => [toast, ...items].slice(0, 4));

    window.setTimeout(() => {
      setToasts((items) => items.filter((item) => item.id !== toast.id));
    }, 3300);
  };

  const value = useMemo(() => ({ pushToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[80] flex w-[min(92vw,24rem)] flex-col gap-3">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              className={cn(
                "glass-strong pointer-events-auto relative overflow-hidden rounded-2xl p-4",
                toast.tone === "success" && "border-emerald-500/30",
                toast.tone === "error" && "border-rose-500/30",
                toast.tone === "warning" && "border-amber-500/30"
              )}
            >
              <div className="flex items-start gap-3">
                <ToastIcon tone={toast.tone} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white">{toast.title}</p>
                  {toast.description ? <p className="mt-1 text-sm text-slate-300">{toast.description}</p> : null}
                </div>
                <button
                  type="button"
                  onClick={() => setToasts((items) => items.filter((item) => item.id !== toast.id))}
                  className="rounded-full p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
                <div className="h-full animate-[shimmer_3.3s_linear_infinite] bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function ToastIcon({ tone }: { tone?: ToastMessage["tone"] }) {
  const className = "h-5 w-5 shrink-0 text-slate-200";

  if (tone === "success") return <CheckCircle2 className={className} />;
  if (tone === "error") return <CircleAlert className={className} />;

  return <Info className={className} />;
}
