"use client";

import { useState } from "react";
import { useStreamify } from "@/hooks/use-streamify";
import { UrlForm } from "@/components/url-form";
import { VideoPlayer } from "@/components/video-player";
import { useToast } from "@/components/toast-provider";
import { PlaySquare } from "lucide-react";
import { isPublicMediaUrl } from "@/lib/media";

const samples = [
  { label: "Sample A", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" },
  { label: "Sample B", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4" }
];

export default function Page() {
  const { current, openVideo } = useStreamify();
  const { pushToast } = useToast();
  const [isValidating, setIsValidating] = useState(false);

  const handleOpen = async (url: string) => {
    if (!isPublicMediaUrl(url)) {
      pushToast({ title: "Invalid link", description: "Please paste a public http(s) video URL.", tone: "error" });
      return;
    }

    setIsValidating(true);
    try {
      const response = await fetch("/api/check-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        pushToast({
          title: "Server not responsive",
          description: "The video server did not respond or did not return a valid video stream.",
          tone: "error"
        });
        return;
      }

      const result = openVideo(url);
      if (!result.ok) {
        pushToast({ title: "Invalid link", description: result.message, tone: "error" });
      }
    } catch {
      pushToast({
        title: "Server not responsive",
        description: "Failed to connect to the video host.",
        tone: "error"
      });
    } finally {
      setIsValidating(false);
    }
  };

  if (current.url) {
    return <VideoPlayer />;
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-[32px] bg-gradient-to-br from-cyan-400/20 via-sky-500/20 to-indigo-600/20 text-cyan-400 mb-8 shadow-soft">
        <PlaySquare className="h-10 w-10" />
      </div>
      <h1 className="font-display text-4xl sm:text-5xl font-semibold text-white tracking-tight mb-4">
        Streamify
      </h1>
      <p className="text-slate-400 text-lg mb-10 max-w-lg">
        Paste a public media URL to start a premium, distraction-free viewing experience.
      </p>

      <div className="w-full text-left">
        <UrlForm onSubmit={handleOpen} onDropUrl={handleOpen} samples={samples} disabled={isValidating} />
      </div>
    </div>
  );
}
