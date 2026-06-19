import { createId, formatDuration } from "@/lib/utils";
import type { QualityOption, VideoRecord } from "@/lib/types";

const qualityTemplate: QualityOption[] = [
  { label: "Auto", value: "auto", available: true }
];

export function isPublicMediaUrl(raw: string) {
  try {
    const url = new URL(raw);

    if (!["http:", "https:"].includes(url.protocol)) {
      return false;
    }

    const host = url.hostname.toLowerCase();
    const privateHosts = ["localhost", "0.0.0.0", "::1"];

    if (privateHosts.includes(host) || host.endsWith(".local")) {
      return false;
    }

    const privateIpv4 = /^(10|127|192\.168|172\.(1[6-9]|2\d|3[0-1]))\./;
    return !privateIpv4.test(host);
  } catch {
    return false;
  }
}

function guessTitle(url: URL) {
  const host = url.hostname.replace(/^www\./, "");
  const segments = url.pathname.split("/").filter(Boolean);

  if (url.hostname.includes("youtube.com") || url.hostname.includes("youtu.be")) {
    return "YouTube video";
  }

  if (url.hostname.includes("vimeo.com")) {
    return "Vimeo video";
  }

  if (segments.length > 0) {
    return `${host} / ${segments[segments.length - 1].replace(/[-_]/g, " ")}`;
  }

  return `${host} media`;
}

function youtubeThumbnail(url: URL) {
  if (url.hostname.includes("youtu.be")) {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "";
  }

  const id = url.searchParams.get("v");
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "";
}

function sourceLabel(url: URL) {
  return url.hostname.replace(/^www\./, "");
}

export function buildVideoRecord(rawUrl: string, previous?: Partial<VideoRecord>): VideoRecord {
  const parsed = new URL(rawUrl);
  const createdAt = new Date().toISOString();
  const title = guessTitle(parsed);
  const thumbnail = youtubeThumbnail(parsed);

  // If the video is an MKV or AVI (formats not natively supported by browsers),
  // route it through our new real-time transcoder API.
  let finalUrl = parsed.toString();
  if (finalUrl.toLowerCase().endsWith(".mkv") || finalUrl.toLowerCase().endsWith(".avi")) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    finalUrl = `${origin}/api/transcode?url=${encodeURIComponent(finalUrl)}`;
  }

  return {
    id: previous?.id ?? createId("video"),
    url: finalUrl,
    title: previous?.title ?? title,
    thumbnail: previous?.thumbnail ?? thumbnail,
    sourceLabel: previous?.sourceLabel ?? sourceLabel(parsed),
    durationSeconds: previous?.durationSeconds ?? null,
    durationLabel: previous?.durationLabel ?? "Unknown",
    watchedAt: previous?.watchedAt ?? createdAt,
    updatedAt: createdAt,
    favorite: previous?.favorite ?? false,
    views: previous?.views ?? 1,
    lastPosition: previous?.lastPosition ?? 0,
    playbackSpeed: previous?.playbackSpeed ?? 1,
    qualityOptions: previous?.qualityOptions ?? qualityTemplate,
    searchTerms: previous?.searchTerms ?? []
  };
}

export function inferQualityOptions(sourceUrl: string): QualityOption[] {
  const url = sourceUrl.toLowerCase();

  if (url.includes(".m3u8") || url.includes("manifest")) {
    return [
      { label: "Auto", value: "auto", available: true },
      { label: "1080p", value: "1080", available: true },
      { label: "720p", value: "720", available: true },
      { label: "480p", value: "480", available: true },
      { label: "360p", value: "360", available: true }
    ];
  }

  return qualityTemplate;
}

export function updateDurationLabel(seconds: number | null) {
  return formatDuration(seconds);
}
