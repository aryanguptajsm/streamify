"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Link2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface UrlFormProps {
  onSubmit: (url: string) => void;
  onDropUrl?: (url: string) => void;
  placeholder?: string;
  compact?: boolean;
  samples?: Array<{ label: string; url: string }>;
}

export function UrlForm({ onSubmit, onDropUrl, placeholder = "Paste a public video URL", compact = false, samples = [] }: UrlFormProps) {
  const [url, setUrl] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const canSubmit = useMemo(() => url.trim().length > 0, [url]);

  const submit = () => {
    if (!canSubmit) return;
    onSubmit(url.trim());
    setUrl("");
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
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
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  submit();
                }
              }}
              placeholder={placeholder}
              className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={submit}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:brightness-110",
              compact ? "sm:px-4" : "sm:px-6"
            )}
          >
            Open stream
            <ArrowRight className="h-4 w-4" />
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
              onClick={() => onSubmit(sample.url)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
