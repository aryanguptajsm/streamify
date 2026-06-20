import { NextResponse } from "next/server";
import ffmpeg from "fluent-ffmpeg";
import { PassThrough } from "stream";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    const startParam = searchParams.get("start") || "0";
    const start = parseFloat(startParam);

    if (!url) {
      return new NextResponse("Missing url parameter", { status: 400 });
    }

    // PassThrough stream to capture FFmpeg output
    const passThrough = new PassThrough();

    const command = ffmpeg(url);

    // Apply fast input seeking if a start position is specified
    if (start > 0) {
      command.seekInput(start);
    }

    command
      // Fallback/standard browser compatible video and audio codecs
      .videoCodec("libx264")
      .audioCodec("aac")
      // Optimize for fast encoding and fragmented output
      // `frag_keyframe+empty_moov+default_base_moof` allows playing the MP4 file
      // via a stream before it is completely downloaded.
      .outputOptions([
        "-movflags frag_keyframe+empty_moov+default_base_moof",
        "-preset ultrafast",
        "-tune zerolatency",
        "-pix_fmt yuv420p",
        "-g 30",
      ])
      .format("mp4")
      .on("start", (commandLine) => {
        console.log("Spawned Ffmpeg with command: " + commandLine);
      })
      .on("error", (err) => {
        console.error("FFmpeg error:", err.message);
        // Cleanly close the stream on error so the client isn't left hanging indefinitely
        passThrough.end();
      });

    // Pipe FFmpeg output into the PassThrough stream
    command.pipe(passThrough);

    // Convert the Node.js Readable stream into a Web ReadableStream
    // so Next.js App Router can return it in a native Response
    const stream = new ReadableStream({
      start(controller) {
        passThrough.on("data", (chunk) => {
          controller.enqueue(chunk);
        });
        passThrough.on("end", () => {
          try {
            controller.close();
          } catch {
            // Ignore error if already closed
          }
        });
        passThrough.on("error", (err) => {
          try {
            controller.error(err);
          } catch {
            // Ignore error if already closed
          }
        });
      },
      cancel() {
        // If the client disconnects or aborts the request, kill the FFmpeg process
        // to prevent it from continuing to transcode in the background and eating up CPU.
        console.log("Client disconnected, killing FFmpeg process...");
        command.kill("SIGKILL");
        passThrough.destroy();
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "video/mp4",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Access-Control-Allow-Origin": "*",
        "Connection": "keep-alive"
      },
    });
  } catch (err: unknown) {
    console.error("Transcode Route Error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
