"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Maximize2, Monitor, Pause, PictureInPicture2, Play, RotateCcw, Volume1, Volume2, VolumeX } from "lucide-react";
import { useStreamify } from "@/hooks/use-streamify";
import { clamp, cn, formatDuration } from "@/lib/utils";

const ReactPlayer = dynamic(() => import("react-player/lazy"), { ssr: false });

type ReactPlayerHandle = {
  seekTo?: (value: number, type?: "seconds" | "fraction") => void;
  getInternalPlayer?: () => HTMLVideoElement | null;
};

export function VideoPlayer() {
  const { current, setPlaying, setProgress, updatePlaybackMeta, setSpeed, setCurrent } = useStreamify();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<ReactPlayerHandle | null>(null);
  const [duration, setDuration] = useState(current.durationSeconds ?? 0);
  const [played, setPlayed] = useState(current.progress);
  const [volume, setVolume] = useState(current.volume);
  const [muted, setMuted] = useState(current.muted);
  const [speedMenu, setSpeedMenu] = useState(false);
  const [qualityMenu, setQualityMenu] = useState(false);

  useEffect(() => {
    setDuration(current.durationSeconds ?? 0);
    setPlayed(current.progress);
    setVolume(current.volume);
    setMuted(current.muted);
  }, [current.durationSeconds, current.muted, current.progress, current.volume, current.videoId]);

  const qualityOptions = useMemo(() => current.qualityOptions.filter((option) => option.available), [current.qualityOptions]);
  const currentQualityLabel = useMemo(() => {
    const found = current.qualityOptions.find((option) => option.value === current.quality);
    return found?.label ?? "Auto";
  }, [current.quality, current.qualityOptions]);

  const seekBy = useCallback((seconds: number) => {
    const player = playerRef.current;
    if (!player) return;
    const instance = player.getInternalPlayer?.();
    if (instance?.currentTime != null) {
      instance.currentTime = clamp(instance.currentTime + seconds, 0, duration || instance.duration || 0);
    }
  }, [duration]);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => undefined);
    } else {
      el.requestFullscreen?.().catch(() => undefined);
    }

    setCurrent((state) => ({ ...state, isFullscreen: !document.fullscreenElement }));
  }, [setCurrent]);

  const enterPictureInPicture = useCallback(() => {
    const player = playerRef.current?.getInternalPlayer?.();
    if (player?.requestPictureInPicture) {
      player.requestPictureInPicture().catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!current.url) return;

      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        setPlaying(!current.playing);
      }

      if (event.key.toLowerCase() === "m") {
        setMuted((value) => {
          const next = !value;
          setCurrent((state) => ({ ...state, muted: next, volume: next ? 0 : volume }));
          return next;
        });
      }

      if (event.key.toLowerCase() === "f") {
        toggleFullscreen();
      }

      if (event.key.toLowerCase() === "i") {
        enterPictureInPicture();
      }

      if (event.key === "ArrowRight") {
        seekBy(10);
      }

      if (event.key === "ArrowLeft") {
        seekBy(-10);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [current.playing, current.url, enterPictureInPicture, seekBy, setCurrent, setPlaying, toggleFullscreen, volume]);

  function handleProgress(state: { played: number; playedSeconds: number }) {
    setPlayed(state.played);
    setProgress(state.played);
    updatePlaybackMeta({ url: current.url, lastPosition: state.played });
  }

  if (!current.url) {
    return (
      <div className="glass-strong flex min-h-[420px] items-center justify-center rounded-[32px] p-8 text-center">
        <div className="max-w-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-400/20 via-sky-500/20 to-indigo-600/20 text-cyan-200">
            <Play className="h-7 w-7" />
          </div>
          <h2 className="mt-6 font-display text-2xl font-semibold text-white">Open a stream to start watching</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Paste any public media URL and Streamify will render a premium playback experience with history, bookmarks, and keyboard controls.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="glass-strong overflow-hidden rounded-[32px]">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.75fr)_minmax(320px,0.95fr)]">
        <div className="relative bg-black">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-black" />
          <div className="relative aspect-video">
            <ReactPlayer
              ref={playerRef}
              url={current.url}
              playing={current.playing}
              muted={muted}
              volume={volume}
              playbackRate={current.speed}
              width="100%"
              height="100%"
              style={{ position: "absolute", inset: 0 }}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onProgress={handleProgress}
              onDuration={(value: number) => {
                setDuration(value);
                updatePlaybackMeta({ url: current.url, durationSeconds: value });
              }}
              onReady={() => {
                updatePlaybackMeta({
                  url: current.url,
                  title: current.title,
                  thumbnail: current.thumbnail,
                  sourceLabel: current.sourceLabel
                });
              }}
              config={{
                file: {
                  attributes: {
                    poster: current.thumbnail || undefined,
                    controlsList: "nodownload noplaybackrate"
                  }
                }
              }}
            />
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-semibold text-white">{current.title}</p>
                <p className="mt-1 text-sm text-slate-400">{current.sourceLabel}</p>
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
                <Monitor className="h-4 w-4" />
                {formatDuration(duration)}
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-5 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Playback</p>
              <h3 className="mt-2 font-display text-xl font-semibold text-white">Custom Controls</h3>
            </div>
            <button
              type="button"
              onClick={() => setPlaying(!current.playing)}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:brightness-110"
            >
              {current.playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {current.playing ? "Pause" : "Play"}
            </button>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-slate-950/50 p-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setMuted((value) => {
                    const next = !value;
                    setCurrent((state) => ({ ...state, muted: next, volume: next ? 0 : Math.max(volume, 0.35) }));
                    return next;
                  })
                }
                className="rounded-2xl border border-white/10 bg-white/5 p-3 text-white"
              >
                {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : volume > 0.5 ? <Volume2 className="h-4 w-4" /> : <Volume1 className="h-4 w-4" />}
              </button>
              <input
                aria-label="Volume"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={muted ? 0 : volume}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  setVolume(next);
                  setMuted(next === 0);
                  setCurrent((state) => ({ ...state, volume: next, muted: next === 0 }));
                }}
                className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-cyan-400"
              />
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                <span>Progress</span>
                <span>{formatPercent(played)}</span>
              </div>
              <input
                aria-label="Progress"
                type="range"
                min="0"
                max="1"
                step="0.001"
                value={played}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  setPlayed(next);
                  playerRef.current?.seekTo(next, "fraction");
                }}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-cyan-400"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={toggleFullscreen} className="glass rounded-[24px] px-4 py-4 text-left transition hover:bg-white/10">
              <Maximize2 className="h-5 w-5 text-cyan-300" />
              <p className="mt-3 font-medium text-white">Fullscreen</p>
              <p className="mt-1 text-sm text-slate-400">Immersive viewing</p>
            </button>
            <button type="button" onClick={enterPictureInPicture} className="glass rounded-[24px] px-4 py-4 text-left transition hover:bg-white/10">
              <PictureInPicture2 className="h-5 w-5 text-cyan-300" />
              <p className="mt-3 font-medium text-white">PiP</p>
              <p className="mt-1 text-sm text-slate-400">Floating mini player</p>
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="glass rounded-[24px] p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Speed</p>
              <div className="relative mt-3">
                <button
                  type="button"
                  onClick={() => setSpeedMenu((value) => !value)}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                >
                  {current.speed}x
                  <RotateCcw className="h-4 w-4 text-slate-400" />
                </button>
                {speedMenu ? (
                  <div className="absolute left-0 right-0 top-[4.25rem] z-20 rounded-[24px] border border-white/10 bg-slate-950 p-2 shadow-premium">
                  {[0.75, 1, 1.25, 1.5, 1.75, 2].map((speed) => (
                    <button
                      key={speed}
                      type="button"
                      onClick={() => {
                          setSpeed(speed as 0.75 | 1 | 1.25 | 1.5 | 1.75 | 2);
                          setSpeedMenu(false);
                        }}
                        className={cn(
                          "block w-full rounded-2xl px-4 py-3 text-left text-sm transition",
                          current.speed === speed ? "bg-cyan-500/20 text-cyan-200" : "text-slate-300 hover:bg-white/5"
                        )}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="glass rounded-[24px] p-4">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Quality</p>
              <div className="relative mt-3">
                <button
                  type="button"
                  onClick={() => setQualityMenu((value) => !value)}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                >
                  {currentQualityLabel}
                  <RotateCcw className="h-4 w-4 text-slate-400" />
                </button>
                {qualityMenu ? (
                  <div className="absolute left-0 right-0 top-[4.25rem] z-20 rounded-[24px] border border-white/10 bg-slate-950 p-2 shadow-premium">
                    {qualityOptions.length > 0 ? (
                      qualityOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setCurrent((state) => ({ ...state, quality: option.value }));
                            setQualityMenu(false);
                          }}
                          className={cn(
                            "block w-full rounded-2xl px-4 py-3 text-left text-sm transition",
                            current.quality === option.value ? "bg-cyan-500/20 text-cyan-200" : "text-slate-300 hover:bg-white/5"
                          )}
                        >
                          {option.label}
                        </button>
                      ))
                    ) : (
                      <div className="rounded-2xl px-4 py-3 text-sm text-slate-300">Auto detected from source when available</div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
