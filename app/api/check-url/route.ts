import { NextResponse } from "next/server";

function isEmbeddableService(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    const host = url.hostname.toLowerCase();
    return (
      host.includes("youtube.com") ||
      host.includes("youtu.be") ||
      host.includes("vimeo.com") ||
      host.includes("soundcloud.com") ||
      host.includes("twitch.tv") ||
      host.includes("streamable.com") ||
      host.includes("wistia.com") ||
      host.includes("dailymotion.com") ||
      host.includes("vidyard.com") ||
      host.includes("mixcloud.com") ||
      host.includes("facebook.com")
    );
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ ok: false, error: "missing_url", message: "URL is required" }, { status: 400 });
    }

    // Embeddable platforms like YouTube/Vimeo serve HTML, so we bypass direct fetch check
    if (isEmbeddableService(url)) {
      return NextResponse.json({ ok: true });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 seconds timeout

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Range": "bytes=0-0",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return NextResponse.json({ ok: false, error: "bad_status", status: response.status });
      }

      const contentType = response.headers.get("content-type") || "";
      if (contentType.toLowerCase().includes("text/html")) {
        return NextResponse.json({ ok: false, error: "invalid_content_type", contentType });
      }

      return NextResponse.json({ ok: true });
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      const isTimeout = fetchError instanceof Error && fetchError.name === "AbortError";
      const message = fetchError instanceof Error ? fetchError.message : "Unknown error";
      return NextResponse.json({
        ok: false,
        error: isTimeout ? "timeout" : "network_error",
        message
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ ok: false, error: "server_error", message }, { status: 500 });
  }
}
