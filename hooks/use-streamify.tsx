"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { buildVideoRecord, inferQualityOptions, isPublicMediaUrl, updateDurationLabel } from "@/lib/media";
import type { AppSettings, PlaybackSpeed, PlayerSession, ThemeMode, VideoRecord } from "@/lib/types";
import { clamp } from "@/lib/utils";
import { useLocalStorageState } from "@/hooks/use-local-storage";
import { useThemeClass } from "@/hooks/use-theme";

const defaultSettings: AppSettings = {
  theme: "dark",
  autoplay: true,
  defaultPlaybackSpeed: 1
};

const defaultSession: PlayerSession = {
  videoId: null,
  url: "",
  title: "No video loaded",
  thumbnail: "",
  sourceLabel: "Streamify",
  durationSeconds: null,
  autoplay: true,
  playing: false,
  muted: false,
  volume: 0.78,
  speed: 1,
  quality: "auto",
  progress: 0,
  isFullscreen: false
};

export interface StreamifyContextValue {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  history: VideoRecord[];
  searchHistory: string[];
  current: PlayerSession;
  setCurrent: React.Dispatch<React.SetStateAction<PlayerSession>>;
  recentActivity: VideoRecord[];
  openVideo: (url: string) => { ok: boolean; message?: string };
  toggleFavorite: (videoId: string) => void;
  updatePlaybackMeta: (payload: Partial<Pick<VideoRecord, "id" | "durationSeconds" | "durationLabel" | "title" | "thumbnail" | "sourceLabel" | "lastPosition">> & { url?: string }) => void;
  setProgress: (progress: number) => void;
  setPlaying: (playing: boolean) => void;
  setSpeed: (speed: PlaybackSpeed) => void;
  clearHistory: () => void;
  registerSearchTerm: (term: string) => void;
  loadVideoById: (videoId: string) => void;
  stats: {
    watchedCount: number;
    favoritesCount: number;
    averageSpeed: number;
  };
}

const StreamifyContext = createContext<StreamifyContextValue | null>(null);

export function StreamifyProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useLocalStorageState<AppSettings>("streamify.settings", defaultSettings);
  const [history, setHistory] = useLocalStorageState<VideoRecord[]>("streamify.history", []);
  const [searchHistory, setSearchHistory] = useLocalStorageState<string[]>("streamify.searchHistory", []);
  const [current, setCurrent] = useLocalStorageState<PlayerSession>("streamify.current", defaultSession);

  useThemeClass(settings.theme);

  useEffect(() => {
    setCurrent((value) => ({
      ...value,
      autoplay: settings.autoplay,
      speed: settings.defaultPlaybackSpeed
    }));
  }, [settings.autoplay, settings.defaultPlaybackSpeed, setCurrent]);

  const openVideo = (url: string) => {
    if (!isPublicMediaUrl(url)) {
      return {
        ok: false,
        message: "Please paste a public http(s) video URL."
      };
    }

    const record = buildVideoRecord(url);
    record.qualityOptions = inferQualityOptions(url);

    setHistory((items) => {
      const existingIndex = items.findIndex((entry) => entry.url === record.url);

      if (existingIndex >= 0) {
        const existing = items[existingIndex];
        const updated = buildVideoRecord(url, {
          ...existing,
          watchedAt: new Date().toISOString(),
          views: existing.views + 1,
          favorite: existing.favorite,
          searchTerms: existing.searchTerms
        });
        updated.lastPosition = existing.lastPosition;
        updated.qualityOptions = existing.qualityOptions;

        const next = [...items];
        next.splice(existingIndex, 1);
        return [updated, ...next];
      }

      return [record, ...items].slice(0, 100);
    });

    setSearchHistory((items) => [url, ...items.filter((entry) => entry !== url)].slice(0, 12));

    setCurrent((state) => ({
      ...state,
      videoId: record.id,
      url: record.url,
      title: record.title,
      thumbnail: record.thumbnail,
      sourceLabel: record.sourceLabel,
      durationSeconds: record.durationSeconds,
      autoplay: settings.autoplay,
      playing: settings.autoplay,
      speed: settings.defaultPlaybackSpeed,
      quality: record.qualityOptions[0]?.value ?? "auto",
      progress: 0
    }));

    return { ok: true };
  };

  const toggleFavorite = (videoId: string) => {
    setHistory((items) =>
      items.map((item) => (item.id === videoId ? { ...item, favorite: !item.favorite, updatedAt: new Date().toISOString() } : item))
    );
  };

  const updatePlaybackMeta = (
    payload: Partial<Pick<VideoRecord, "id" | "durationSeconds" | "durationLabel" | "title" | "thumbnail" | "sourceLabel" | "lastPosition">> & { url?: string }
  ) => {
    setHistory((items) =>
      items.map((item) => {
        const isMatch = (payload.id && item.id === payload.id) || (payload.url && item.url === payload.url);

        if (!isMatch) return item;

        const durationSeconds = payload.durationSeconds ?? item.durationSeconds;
        return {
          ...item,
          title: payload.title ?? item.title,
          thumbnail: payload.thumbnail ?? item.thumbnail,
          sourceLabel: payload.sourceLabel ?? item.sourceLabel,
          durationSeconds,
          durationLabel: payload.durationLabel ?? updateDurationLabel(durationSeconds),
          lastPosition: payload.lastPosition ?? item.lastPosition,
          updatedAt: new Date().toISOString()
        };
      })
    );
  };

  const setProgress = (progress: number) => {
    const next = clamp(progress, 0, 1);
    setCurrent((state) => ({ ...state, progress: next }));
  };

  const setPlaying = (playing: boolean) => {
    setCurrent((state) => ({ ...state, playing }));
  };

  const setSpeed = (speed: PlaybackSpeed) => {
    setCurrent((state) => ({ ...state, speed }));
    setSettings((state) => ({ ...state, defaultPlaybackSpeed: speed }));
  };

  const clearHistory = () => {
    setHistory([]);
    setSearchHistory([]);
    setCurrent(defaultSession);
  };

  const registerSearchTerm = (term: string) => {
    const clean = term.trim();

    if (!clean) return;

    setSearchHistory((items) => [clean, ...items.filter((entry) => entry.toLowerCase() !== clean.toLowerCase())].slice(0, 12));
  };

  const loadVideoById = (videoId: string) => {
    const found = history.find((item) => item.id === videoId);

    if (!found) return;

    setCurrent((state) => ({
      ...state,
      videoId: found.id,
      url: found.url,
      title: found.title,
      thumbnail: found.thumbnail,
      sourceLabel: found.sourceLabel,
      durationSeconds: found.durationSeconds,
      quality: found.qualityOptions[0]?.value ?? "auto",
      playing: settings.autoplay,
      autoplay: settings.autoplay,
      speed: settings.defaultPlaybackSpeed,
      progress: found.lastPosition || 0
    }));
  };

  const recentActivity = useMemo(() => history.slice(0, 5), [history]);

  const stats = useMemo(
    () => ({
      watchedCount: history.length,
      favoritesCount: history.filter((item) => item.favorite).length,
      averageSpeed: history.length > 0 ? Number((history.reduce((acc, item) => acc + (item.lastPosition > 0 ? current.speed : 1), 0) / history.length).toFixed(2)) : 1
    }),
    [current.speed, history]
  );

  const value: StreamifyContextValue = {
    settings,
    setSettings,
    history,
    searchHistory,
    current,
    setCurrent,
    recentActivity,
    openVideo,
    toggleFavorite,
    updatePlaybackMeta,
    setProgress,
    setPlaying,
    setSpeed,
    clearHistory,
    registerSearchTerm,
    loadVideoById,
    stats
  };

  return <StreamifyContext.Provider value={value}>{children}</StreamifyContext.Provider>;
}

export function useStreamify() {
  const value = useContext(StreamifyContext);

  if (!value) {
    throw new Error("useStreamify must be used within StreamifyProvider");
  }

  return value;
}
