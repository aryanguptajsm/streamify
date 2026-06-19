export type ThemeMode = "dark" | "light";

export type PlaybackSpeed = 0.75 | 1 | 1.25 | 1.5 | 1.75 | 2;

export interface QualityOption {
  label: string;
  value: string;
  available: boolean;
}

export interface VideoRecord {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  sourceLabel: string;
  durationSeconds: number | null;
  durationLabel: string;
  watchedAt: string;
  updatedAt: string;
  favorite: boolean;
  views: number;
  lastPosition: number;
  playbackSpeed: number;
  qualityOptions: QualityOption[];
  searchTerms: string[];
}

export interface PlayerSession {
  videoId: string | null;
  url: string;
  title: string;
  thumbnail: string;
  sourceLabel: string;
  durationSeconds: number | null;
  autoplay: boolean;
  playing: boolean;
  muted: boolean;
  volume: number;
  speed: PlaybackSpeed;
  quality: string;
  qualityOptions: QualityOption[];
  progress: number;
  isFullscreen: boolean;
}

export interface AppSettings {
  theme: ThemeMode;
  autoplay: boolean;
  defaultPlaybackSpeed: PlaybackSpeed;
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  tone?: "default" | "success" | "error" | "warning";
}
