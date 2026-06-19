"use client";

import { useMemo, useState, type DragEvent } from "react";
import { ArrowRight, Link2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface UrlFormProps {
  onSubmit: (url: string) => void;
  onDropUrl?: (url: string) => void;
  placeholder?: string;
  compact?: boolean;
  samples?: Array<{ label: string; url: string }>;
  disabled?: boolean;
}

export function UrlForm({ onSubmit, onDropUrl, placeholder = "Paste a public video URL", compact = false, samples = [], disabled = false }: UrlFormProps) {
  const [url, setUrl] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const canSubmit = useMemo(() => url.trim().length > 0, [url]);

  const submit = () => {
    if (!canSubmit || disabled) return;
    onSubmit(url.trim());
    setUrl("");
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (disabled) return;
    setDragActive(false);
    const text = event.dataTransfer.getData("text/plain").trim();

    if (text && /^https?:\/\//i.test(text) && onDropUrl) {
      onDropUrl(text);
    }
  };

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        if (disabled) return;
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      className={cn("transition", dragActive && "scale-[1.01]")}
    >
      <div className="glass-strong relative overflow-hidden rounded-[28px] p-2 shadow-premium">
        <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-r from-cyan-400/10 via-transparent to-fuchsia-500/10 opacity-0 transition", dragActive && "opacity-100")} />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-slate-400 sm:flex-1">
            <Link2 className="h-4 w-4 shrink-0" />
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              disabled={disabled}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  submit();
                }
              }}
              placeholder={placeholder}
              className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none disabled:opacity-50"
            />
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={disabled || !canSubmit}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed",
              compact ? "sm:px-4" : "sm:px-6"
            )}
          >
            {disabled ? "Verifying..." : "Open stream"}
            {disabled ? (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
          </button>
        </div>
        <div className="relative mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1">
            <Upload className="h-3.5 w-3.5" />
            Drag and drop a URL or text selection
          </span>
          {samples.map((sample) => (
            <button
              key={sample.label}
              type="button"
              disabled={disabled}
              onClick={() => onSubmit(sample.url)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:pointer-events-none"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
