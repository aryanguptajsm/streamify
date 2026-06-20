"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, Pause, Play, Volume1, Volume2, VolumeX, Settings, Type, Mic2, Activity, ArrowLeft } from "lucide-react";
import { useStreamify } from "@/hooks/use-streamify";
import { clamp, cn, formatDuration } from "@/lib/utils";
import dynamic from "next/dynamic";
import type ReactPlayerClass from "react-player";
import type { PlaybackSpeed } from "@/lib/types";

const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

export function VideoPlayer() {
  const { current, setPlaying, setProgress, updatePlaybackMeta, setSpeed, setCurrent } = useStreamify();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<ReactPlayerClass | null>(null);
  
  const [duration, setDuration] = useState(current.durationSeconds ?? 0);
  const [played, setPlayed] = useState(current.progress);
  const [volume, setVolume] = useState(current.volume);
  const [muted, setMuted] = useState(current.muted);
  
  const [activeMenu, setActiveMenu] = useState<"none" | "speed" | "quality" | "audio" | "subtitles">("none");
  const [showControls, setShowControls] = useState(true);

  const isTranscoded = current.url.startsWith("/api/transcode") || current.url.includes("/api/transcode");
  const nativeVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaSourceRef = useRef<MediaSource | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [mseError, setMseError] = useState<string | null>(null);

  // Audio and Subtitle Track States
  const [audioTracks, setAudioTracks] = useState<{ id: number; name: string; lang: string }[]>([]);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<number>(-1);
  const [subtitleTracks, setSubtitleTracks] = useState<{ id: number; label: string; lang: string; mode: string }[]>([]);
  const [selectedSubtitleTrack, setSelectedSubtitleTrack] = useState<number>(-1);

  const qualityOptions = current.qualityOptions || [];
  
  // Idle fade out logic
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      if (current.playing) {
        timeout = setTimeout(() => {
          if (activeMenu === "none") {
            setShowControls(false);
          }
        }, 3000);
      }
    };
    
    if (current.playing) {
      timeout = setTimeout(() => {
        if (activeMenu === "none") {
          setShowControls(false);
        }
      }, 3000);
    } else {
      setShowControls(true);
    }

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(timeout);
    };
  }, [current.playing, activeMenu]);

  // Fullscreen event listener
  useEffect(() => {
    const onFullscreenChange = () => {
      setCurrent((state) => ({ ...state, isFullscreen: !!document.fullscreenElement }));
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [setCurrent]);

  // Track detection logic
  const updateTracks = useCallback(() => {
    if (!playerRef.current) return;
    const hls = playerRef.current.getInternalPlayer("hls");
    if (hls) {
      if (hls.audioTracks && hls.audioTracks.length > 1) {
        const tracks = hls.audioTracks.map((t: { name?: string; lang?: string }, idx: number) => ({
          id: idx,
          name: t.name || t.lang || `Track ${idx + 1}`,
          lang: t.lang || ""
        }));
        setAudioTracks(tracks);
        setSelectedAudioTrack(hls.audioTrack);
      } else {
        setAudioTracks([]);
      }

      if (hls.subtitleTracks && hls.subtitleTracks.length > 0) {
        const tracks = hls.subtitleTracks.map((t: { name?: string; lang?: string }, idx: number) => ({
          id: idx,
          label: t.name || t.lang || `Subtitle ${idx + 1}`,
          lang: t.lang || "",
          mode: hls.subtitleTrack === idx ? "showing" : "disabled"
        }));
        setSubtitleTracks(tracks);
        setSelectedSubtitleTrack(hls.subtitleTrack);
      } else {
        const video = playerRef.current.getInternalPlayer() as HTMLVideoElement | null;
        if (video && video.textTracks && video.textTracks.length > 0) {
          const tracks = [];
          let selectedIdx = -1;
          for (let i = 0; i < video.textTracks.length; i++) {
            const track = video.textTracks[i];
            if (track.kind === "subtitles" || track.kind === "captions") {
              tracks.push({
                id: i,
                label: track.label || track.language || `Subtitle ${i + 1}`,
                lang: track.language || "",
                mode: track.mode
              });
              if (track.mode === "showing") {
                selectedIdx = i;
              }
            }
          }
          setSubtitleTracks(tracks);
          setSelectedSubtitleTrack(selectedIdx);
        } else {
          setSubtitleTracks([]);
        }
      }
      return;
    }

    const video = playerRef.current.getInternalPlayer() as HTMLVideoElement | null;
    if (!video) return;

    const nativeAudio = (video as HTMLVideoElement & { audioTracks?: { label?: string; language?: string; enabled?: boolean }[] }).audioTracks;
    if (nativeAudio && nativeAudio.length > 1) {
      const tracks = [];
      let selectedIdx = -1;
      for (let i = 0; i < nativeAudio.length; i++) {
        tracks.push({ id: i, name: nativeAudio[i].label || nativeAudio[i].language || `Track ${i + 1}`, lang: nativeAudio[i].language || "" });
        if (nativeAudio[i].enabled) { selectedIdx = i; }
      }
      setAudioTracks(tracks);
      setSelectedAudioTrack(selectedIdx);
    } else {
      setAudioTracks([]);
    }

    const nativeText = video.textTracks;
    if (nativeText && nativeText.length > 0) {
      const tracks = [];
      let selectedIdx = -1;
      for (let i = 0; i < nativeText.length; i++) {
        const track = nativeText[i];
        if (track.kind === "subtitles" || track.kind === "captions") {
          tracks.push({ id: i, label: track.label || track.language || `Subtitle ${i + 1}`, lang: track.language || "", mode: track.mode });
          if (track.mode === "showing") { selectedIdx = i; }
        }
      }
      setSubtitleTracks(tracks);
      setSelectedSubtitleTrack(selectedIdx);
    } else {
      setSubtitleTracks([]);
    }
  }, []);

  const changeAudioTrack = useCallback((index: number) => {
    if (!playerRef.current) return;
    setSelectedAudioTrack(index);
    const hls = playerRef.current.getInternalPlayer("hls");
    if (hls) {
      hls.audioTrack = index;
      return;
    }
    const video = playerRef.current.getInternalPlayer() as HTMLVideoElement | null;
    const nativeAudio = video ? (video as HTMLVideoElement & { audioTracks?: { enabled?: boolean }[] }).audioTracks : null;
    if (nativeAudio) {
      for (let i = 0; i < nativeAudio.length; i++) {
        nativeAudio[i].enabled = i === index;
      }
    }
  }, []);

  const changeSubtitleTrack = useCallback((index: number) => {
    if (!playerRef.current) return;
    setSelectedSubtitleTrack(index);
    const hls = playerRef.current.getInternalPlayer("hls");
    if (hls) {
      hls.subtitleTrack = index;
      return;
    }
    const video = playerRef.current.getInternalPlayer() as HTMLVideoElement | null;
    if (video && video.textTracks) {
      for (let i = 0; i < video.textTracks.length; i++) {
        video.textTracks[i].mode = i === index ? "showing" : "disabled";
      }
    }
  }, []);

  const cleanupMse = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    const video = nativeVideoRef.current;
    if (video) {
      video.pause();
      try {
        video.src = "";
        video.load();
      } catch (e) {}
    }
    mediaSourceRef.current = null;
    sourceBufferRef.current = null;
    setIsBuffering(false);
    setMseError(null);
  }, []);

  const startStreaming = useCallback(async (
    startSeconds: number,
    sourceBuffer: SourceBuffer,
    mediaSource: MediaSource,
    signal: AbortSignal
  ) => {
    try {
      setIsBuffering(true);
      const url = `${current.url}&start=${startSeconds}`;
      const response = await fetch(url, { signal });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to get stream reader from response");
      }

      const queue: Uint8Array[] = [];
      let appending = false;

      const processQueue = async () => {
        if (appending || queue.length === 0 || signal.aborted) return;
        if (mediaSource.readyState !== "open") return;

        appending = true;
        const chunk = queue.shift()!;

        try {
          if (sourceBuffer.updating) {
            await new Promise<void>((resolve) => {
              const onUpdateEnd = () => {
                sourceBuffer.removeEventListener("updateend", onUpdateEnd);
                resolve();
              };
              sourceBuffer.addEventListener("updateend", onUpdateEnd);
            });
          }
          if (mediaSource.readyState === "open" && !signal.aborted) {
            sourceBuffer.appendBuffer(chunk);
          }
        } catch (e) {
          console.error("Error appending chunk to MSE:", e);
        } finally {
          appending = false;
          processQueue();
        }
      };

      while (!signal.aborted) {
        // Backpressure throttling: pause reading if buffer is ahead > 45 seconds
        const video = nativeVideoRef.current;
        if (video) {
          const buffered = sourceBuffer.buffered;
          if (buffered.length > 0) {
            const bufferedEnd = buffered.end(buffered.length - 1);
            const currentTime = video.currentTime;
            if (bufferedEnd - currentTime > 45) {
              await new Promise((resolve) => setTimeout(resolve, 500));
              continue;
            }
          }
        }

        const { done, value } = await reader.read();
        if (done) {
          while (queue.length > 0 || appending) {
            await new Promise((r) => setTimeout(r, 50));
          }
          if (mediaSource.readyState === "open" && !sourceBuffer.updating) {
            mediaSource.endOfStream();
          }
          setIsBuffering(false);
          break;
        }

        if (value) {
          queue.push(value);
          setIsBuffering(false);
          processQueue();
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Fetch stream aborted successfully.");
      } else {
        console.error("Streaming error:", err);
        setMseError("Streaming failed or connection lost.");
        setIsBuffering(false);
      }
    }
  }, [current.url]);

  const initMse = useCallback((startSeconds: number) => {
    cleanupMse();
    const video = nativeVideoRef.current;
    if (!video) return;

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const mediaSource = new MediaSource();
    mediaSourceRef.current = mediaSource;

    video.src = URL.createObjectURL(mediaSource);

    let isFetching = false;
    const handleSourceOpen = () => {
      if (isFetching) return;
      isFetching = true;

      let mimeCodec = 'video/mp4; codecs="avc1.64001f, mp4a.40.2"';
      if (!MediaSource.isTypeSupported(mimeCodec)) {
        mimeCodec = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
        if (!MediaSource.isTypeSupported(mimeCodec)) {
          mimeCodec = 'video/mp4';
        }
      }

      try {
        const sourceBuffer = mediaSource.addSourceBuffer(mimeCodec);
        sourceBufferRef.current = sourceBuffer;

        if (duration > 0) {
          mediaSource.duration = duration;
        } else if (current.durationSeconds) {
          mediaSource.duration = current.durationSeconds;
        }

        if (startSeconds > 0) {
          sourceBuffer.timestampOffset = startSeconds;
        }

        startStreaming(startSeconds, sourceBuffer, mediaSource, abortController.signal);
      } catch (err) {
        console.error("MSE SourceBuffer error:", err);
        setMseError("Unsupported browser streaming format.");
      }
    };

    mediaSource.addEventListener("sourceopen", handleSourceOpen);
    return () => {
      mediaSource.removeEventListener("sourceopen", handleSourceOpen);
    };
  }, [current.url, duration, current.durationSeconds, startStreaming, cleanupMse]);

  const handleNativeSeek = useCallback((targetTime: number) => {
    const video = nativeVideoRef.current;
    if (!video) return;

    const wasPlaying = current.playing;
    if (wasPlaying) {
      video.pause();
    }
    setIsBuffering(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const sourceBuffer = sourceBufferRef.current;
    const mediaSource = mediaSourceRef.current;

    if (sourceBuffer && mediaSource && mediaSource.readyState === "open") {
      try {
        sourceBuffer.abort();
        const clearAndSeek = () => {
          if (sourceBuffer.updating) {
            sourceBuffer.addEventListener("updateend", () => {
              try {
                sourceBuffer.remove(0, mediaSource.duration);
              } catch (e) {}
            }, { once: true });
          } else {
            sourceBuffer.remove(0, mediaSource.duration);
          }
        };
        if (sourceBuffer.buffered.length > 0) {
          clearAndSeek();
        }
        sourceBuffer.timestampOffset = targetTime;
      } catch (e) {
        console.error("Error resetting source buffer for seek:", e);
      }
    }

    video.currentTime = targetTime;

    if (sourceBuffer && mediaSource) {
      startStreaming(targetTime, sourceBuffer, mediaSource, abortController.signal)
        .then(() => {
          if (wasPlaying && nativeVideoRef.current) {
            nativeVideoRef.current.play().catch(() => {});
          }
        });
    }
  }, [current.playing, duration, startStreaming]);

  const handleNativePlay = () => {
    setPlaying(true);
  };

  const handleNativePause = () => {
    setPlaying(false);
  };

  const handleNativeTimeUpdate = () => {
    const video = nativeVideoRef.current;
    if (video && duration > 0) {
      const currentPlayed = video.currentTime / duration;
      setPlayed(currentPlayed);
      setProgress(currentPlayed);
    }
  };

  const handleNativeLoadedMetadata = () => {
    const video = nativeVideoRef.current;
    if (video) {
      if (!duration && video.duration && video.duration !== Infinity && !isNaN(video.duration)) {
        setDuration(video.duration);
        updatePlaybackMeta({ url: current.url, durationSeconds: video.duration });
      }
    }
  };

  const seekBy = useCallback((seconds: number) => {
    if (isTranscoded) {
      const video = nativeVideoRef.current;
      if (!video) return;
      const currentTime = video.currentTime || 0;
      const nextTime = clamp(currentTime + seconds, 0, duration);
      handleNativeSeek(nextTime);
    } else {
      if (!playerRef.current) return;
      const currentTime = playerRef.current.getCurrentTime() || 0;
      const durationVal = playerRef.current.getDuration() || 0;
      const nextTime = clamp(currentTime + seconds, 0, durationVal);
      playerRef.current.seekTo(nextTime, "seconds");
      if (durationVal > 0) {
        const nextProgress = nextTime / durationVal;
        setPlayed(nextProgress);
        setProgress(nextProgress);
      }
    }
  }, [isTranscoded, duration, handleNativeSeek, setProgress]);

  const handleProgress = useCallback((state: { played: number }) => {
    setPlayed(state.played);
    setProgress(state.played);
  }, [setProgress]);

  useEffect(() => {
    setDuration(current.durationSeconds ?? 0);
    setPlayed(current.progress);
    setVolume(current.volume);
    setMuted(current.muted);
  }, [current.durationSeconds, current.muted, current.progress, current.volume, current.videoId]);

  useEffect(() => {
    setAudioTracks([]);
    setSelectedAudioTrack(-1);
    setSubtitleTracks([]);
    setSelectedSubtitleTrack(-1);
    const timer = setTimeout(() => updateTracks(), 1500);
    return () => clearTimeout(timer);
  }, [current.url, updateTracks]);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => undefined);
    } else {
      el.requestFullscreen?.().catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!current.url) return;
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;

      if (event.code === "Space") {
        event.preventDefault();
        setPlaying(!current.playing);
      }
      if (event.key.toLowerCase() === "m") {
        const nextMuted = !muted;
        setMuted(nextMuted);
        setCurrent((state) => ({ ...state, muted: nextMuted, volume: nextMuted ? 0 : Math.max(volume, 0.35) }));
      }
      if (event.key.toLowerCase() === "f") toggleFullscreen();
      if (event.key === "ArrowRight") { event.preventDefault(); seekBy(10); }
      if (event.key === "ArrowLeft") { event.preventDefault(); seekBy(-10); }
      if (event.key === ">") {
        event.preventDefault();
        const speeds: PlaybackSpeed[] = [0.75, 1, 1.25, 1.5, 1.75, 2];
        const currentIndex = speeds.indexOf(current.speed);
        if (currentIndex < speeds.length - 1) setSpeed(speeds[currentIndex + 1]);
      }
      if (event.key === "<") {
        event.preventDefault();
        const speeds: PlaybackSpeed[] = [0.75, 1, 1.25, 1.5, 1.75, 2];
        const currentIndex = speeds.indexOf(current.speed);
        if (currentIndex > 0) setSpeed(speeds[currentIndex - 1]);
      }
      if (event.key === "Escape" && activeMenu !== "none") {
        setActiveMenu("none");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [current.playing, current.url, current.speed, seekBy, setCurrent, setPlaying, toggleFullscreen, volume, setSpeed, muted, activeMenu]);

  // Sync volume and muted
  useEffect(() => {
    const video = nativeVideoRef.current;
    if (video && isTranscoded) {
      video.volume = volume;
      video.muted = muted;
    }
  }, [volume, muted, isTranscoded]);

  // Sync playback speed
  useEffect(() => {
    const video = nativeVideoRef.current;
    if (video && isTranscoded) {
      video.playbackRate = current.speed;
    }
  }, [current.speed, isTranscoded]);

  // Sync playing state
  useEffect(() => {
    const video = nativeVideoRef.current;
    if (!video || !isTranscoded) return;
    if (current.playing) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [current.playing, isTranscoded]);

  // Manage MSE lifecycle
  useEffect(() => {
    if (!isTranscoded) {
      cleanupMse();
      return;
    }

    // Start from last position or 0
    const startPos = current.progress * (current.durationSeconds ?? 0);
    initMse(startPos);

    return () => {
      cleanupMse();
    };
  }, [current.url, isTranscoded, initMse, cleanupMse]);

  if (!current.url) return null;

  return (
    <div 
      ref={containerRef} 
      className={cn(
        "relative w-full h-[100vh] bg-black overflow-hidden select-none", 
        showControls ? "cursor-default" : "cursor-none"
      )}
      onClick={() => {
        if (activeMenu !== "none") setActiveMenu("none");
      }}
    >
      <div className="absolute inset-0 z-0 flex items-center justify-center">
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
          onPlay={() => {
            setPlaying(true);
            updateTracks();
          }}
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
            updateTracks();
          }}
          onClickPreview={() => setPlaying(true)}
          config={{
            file: {
              attributes: {
                preload: "auto",
                poster: current.thumbnail || undefined,
                controlsList: "nodownload noplaybackrate",
                crossOrigin: "anonymous"
              },
              hlsOptions: { maxBufferLength: 60, maxMaxBufferLength: 90, backBufferLength: 50 }
            }
          }}
        />
      </div>

      {/* Top Bar for Go Back */}
      <div 
        className={cn(
          "absolute top-0 inset-x-0 p-6 z-20 transition-all duration-500 bg-gradient-to-b from-black/80 to-transparent",
          showControls ? "opacity-100" : "opacity-0 -translate-y-4"
        )}
      >
        <button 
          onClick={() => {
            setPlaying(false);
            setCurrent((s) => ({ ...s, url: "" }));
          }}
          className="inline-flex items-center gap-2 text-white hover:text-cyan-400 transition"
        >
          <ArrowLeft className="h-6 w-6" />
          <span className="font-medium text-lg drop-shadow-md">Back</span>
        </button>
      </div>

      {/* Middle Click Area for Play/Pause */}
      <div 
        className="absolute inset-0 z-10" 
        onClick={() => {
          if (activeMenu === "none") {
            setPlaying(!current.playing);
          }
        }} 
      />

      {/* Bottom Controls Overlay */}
      <div 
        className={cn(
          "absolute bottom-0 inset-x-0 px-6 pb-6 pt-24 z-20 transition-all duration-500 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col gap-4",
          showControls || activeMenu !== "none" ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 pointer-events-none"
        )}
      >
        {/* Progress Bar */}
        <div className="relative w-full h-1.5 bg-white/30 rounded-full cursor-pointer overflow-hidden group/progress">
          <div className="absolute top-0 left-0 bottom-0 bg-cyan-500 transition-all group-hover/progress:bg-cyan-400" style={{ width: `${played * 100}%` }} />
          <input 
            type="range" 
            min="0" max="1" step="0.001" 
            value={played} 
            onChange={(e) => {
              const next = Number(e.target.value);
              setPlayed(next);
              playerRef.current?.seekTo?.(next, "fraction");
            }} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
          />
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5 lg:gap-8">
            <button onClick={() => setPlaying(!current.playing)} className="text-white hover:text-cyan-400 transition">
              {current.playing ? <Pause className="h-7 w-7" fill="currentColor" /> : <Play className="h-7 w-7" fill="currentColor" />}
            </button>
            
            <div className="flex items-center gap-2 group/volume relative">
              <button 
                onClick={() => {
                  const nextMuted = !muted;
                  setMuted(nextMuted);
                  setCurrent((state) => ({ ...state, muted: nextMuted, volume: nextMuted ? 0 : Math.max(volume, 0.35) }));
                }} 
                className="text-white hover:text-cyan-400 transition"
              >
                {muted || volume === 0 ? <VolumeX className="h-6 w-6" /> : volume > 0.5 ? <Volume2 className="h-6 w-6" /> : <Volume1 className="h-6 w-6" />}
              </button>
              <input 
                type="range" min="0" max="1" step="0.01" 
                value={muted ? 0 : volume} 
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setVolume(next);
                  setMuted(next === 0);
                  setCurrent((state) => ({ ...state, volume: next, muted: next === 0 }));
                }} 
                className="w-0 opacity-0 group-hover/volume:w-24 group-hover/volume:opacity-100 transition-all duration-300 accent-cyan-400 h-1 cursor-pointer" 
              />
            </div>

            <div className="text-white/90 text-sm font-medium tracking-wide">
              {formatDuration(played * duration)} <span className="text-white/50 mx-1">/</span> {formatDuration(duration)}
            </div>
          </div>

          <div className="hidden md:block absolute left-1/2 -translate-x-1/2 font-display font-semibold text-xl max-w-[40%] truncate drop-shadow-lg text-white">
            {current.title || current.url}
          </div>

          <div className="flex items-center gap-5 lg:gap-6 text-white">
            {/* Audio Selection */}
            {audioTracks.length > 1 && (
              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === "audio" ? "none" : "audio"); }} className={cn("hover:text-cyan-400 transition p-1", activeMenu === "audio" && "text-cyan-400")}>
                  <Mic2 className="h-5 w-5" />
                </button>
                {activeMenu === "audio" && (
                  <div className="absolute bottom-full right-0 mb-4 bg-black/95 border border-white/10 rounded-2xl py-2 min-w-[160px] overflow-hidden backdrop-blur-md shadow-2xl">
                    <div className="px-4 py-2 text-xs uppercase tracking-wider text-white/50 font-semibold border-b border-white/5 mb-1">Audio</div>
                    {audioTracks.map((track) => (
                      <button key={track.id} onClick={() => { changeAudioTrack(track.id); setActiveMenu("none"); }} className={cn("w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition", selectedAudioTrack === track.id ? "text-cyan-400 font-medium" : "text-white/90")}>
                        {track.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Subtitles Selection */}
            {subtitleTracks.length > 0 && (
              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === "subtitles" ? "none" : "subtitles"); }} className={cn("hover:text-cyan-400 transition p-1", activeMenu === "subtitles" && "text-cyan-400")}>
                  <Type className="h-5 w-5" />
                </button>
                {activeMenu === "subtitles" && (
                  <div className="absolute bottom-full right-0 mb-4 bg-black/95 border border-white/10 rounded-2xl py-2 min-w-[160px] overflow-hidden backdrop-blur-md shadow-2xl">
                    <div className="px-4 py-2 text-xs uppercase tracking-wider text-white/50 font-semibold border-b border-white/5 mb-1">Subtitles</div>
                    <button onClick={() => { changeSubtitleTrack(-1); setActiveMenu("none"); }} className={cn("w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition", selectedSubtitleTrack === -1 ? "text-cyan-400 font-medium" : "text-white/90")}>
                      Off
                    </button>
                    {subtitleTracks.map((track) => (
                      <button key={track.id} onClick={() => { changeSubtitleTrack(track.id); setActiveMenu("none"); }} className={cn("w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition", selectedSubtitleTrack === track.id ? "text-cyan-400 font-medium" : "text-white/90")}>
                        {track.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Speed Selection */}
            <div className="relative">
              <button onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === "speed" ? "none" : "speed"); }} className={cn("hover:text-cyan-400 transition p-1", activeMenu === "speed" && "text-cyan-400")}>
                <Activity className="h-5 w-5" />
              </button>
              {activeMenu === "speed" && (
                <div className="absolute bottom-full right-0 mb-4 bg-black/95 border border-white/10 rounded-2xl py-2 min-w-[120px] overflow-hidden backdrop-blur-md shadow-2xl">
                  <div className="px-4 py-2 text-xs uppercase tracking-wider text-white/50 font-semibold border-b border-white/5 mb-1">Speed</div>
                  {[0.75, 1, 1.25, 1.5, 1.75, 2].map((speed) => (
                    <button key={speed} onClick={() => { setSpeed(speed as PlaybackSpeed); setActiveMenu("none"); }} className={cn("w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition", current.speed === speed ? "text-cyan-400 font-medium" : "text-white/90")}>
                      {speed === 1 ? "Normal" : `${speed}x`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quality Selection */}
            {qualityOptions.length > 0 && (
              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === "quality" ? "none" : "quality"); }} className={cn("hover:text-cyan-400 transition p-1", activeMenu === "quality" && "text-cyan-400")}>
                  <Settings className="h-5 w-5" />
                </button>
                {activeMenu === "quality" && (
                  <div className="absolute bottom-full right-0 mb-4 bg-black/95 border border-white/10 rounded-2xl py-2 min-w-[140px] overflow-hidden backdrop-blur-md shadow-2xl max-h-64 overflow-y-auto">
                    <div className="px-4 py-2 text-xs uppercase tracking-wider text-white/50 font-semibold border-b border-white/5 mb-1">Quality</div>
                    {qualityOptions.map((opt) => (
                      <button key={opt.value} onClick={() => { setCurrent((s) => ({ ...s, quality: opt.value })); setActiveMenu("none"); }} className={cn("w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition", current.quality === opt.value ? "text-cyan-400 font-medium" : "text-white/90")}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Fullscreen */}
            <button onClick={toggleFullscreen} className="hover:text-cyan-400 transition ml-2 p-1">
              <Maximize2 className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
