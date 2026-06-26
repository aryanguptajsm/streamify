import { NextResponse } from "next/server";
import { isSafeUrl } from "@/lib/ssrf-server";

// Cache structure for validated URLs to speed up repeated queries
interface CacheEntry {
  ok: boolean;
  error?: string;
  status?: number;
  contentType?: string;
  message?: string;
  timestamp: number;
}

const checkCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes TTL

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

    // 1. SSRF and Domain Security Verification
    const isSafe = await isSafeUrl(url);
    if (!isSafe) {
      return NextResponse.json(
        { ok: false, error: "unsafe_url", message: "Unsafe or private URL is not allowed" },
        { status: 400 }
      );
    }

    // 2. Cache check
    const cached = checkCache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[Cache Hit] URL check: ${url}`);
      return NextResponse.json(cached);
    }

    // 3. Fast bypass check for embeddable services
    if (isEmbeddableService(url)) {
      const result = { ok: true, timestamp: Date.now() };
      checkCache.set(url, result);
      return NextResponse.json(result);
    }

    // 4. Request validation
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500); // Optimized timeout from 6s to 3.5s

    try {
      let response: Response;
      let usedHead = true;

      // Try HEAD request first for high performance (downloads zero body bytes)
      try {
        response = await fetch(url, {
          method: "HEAD",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          },
          signal: controller.signal
        });

        // If server doesn't support HEAD (405) or blocks it (403), fallback to GET Range
        if (!response.ok || response.status === 405 || response.status === 403 || response.status === 501) {
          usedHead = false;
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          throw err;
        }
        usedHead = false;
      }

      // Fallback: Perform GET request with Range: bytes=0-0
      if (!usedHead) {
        response = await fetch(url, {
          method: "GET",
          headers: {
            "Range": "bytes=0-0",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          },
          signal: controller.signal
        });
      }

      clearTimeout(timeoutId);

      // Cancel the response body stream to avoid downloading more bytes in case the server ignores the Range header
      if (response.body) {
        try {
          await response.body.cancel();
        } catch {}
      }

      if (!response.ok) {
        const result = { ok: false, error: "bad_status", status: response.status, timestamp: Date.now() };
        checkCache.set(url, result);
        return NextResponse.json(result);
      }

      const contentType = response.headers.get("content-type") || "";
      if (contentType.toLowerCase().includes("text/html")) {
        const result = { ok: false, error: "invalid_content_type", contentType, timestamp: Date.now() };
        checkCache.set(url, result);
        return NextResponse.json(result);
      }

      const result = { ok: true, timestamp: Date.now() };
      checkCache.set(url, result);
      return NextResponse.json(result);

    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      const isTimeout = fetchError instanceof Error && fetchError.name === "AbortError";
      const message = fetchError instanceof Error ? fetchError.message : "Unknown error";
      const errorResult = {
        ok: false,
        error: isTimeout ? "timeout" : "network_error",
        message,
        timestamp: Date.now()
      };
      
      // Cache failures briefly to prevent immediate retries on dead URLs
      checkCache.set(url, errorResult);
      return NextResponse.json(errorResult);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ ok: false, error: "server_error", message }, { status: 500 });
  }
}
