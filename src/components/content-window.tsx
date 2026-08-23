"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  PAGE4_APPS_SCRIPT_URL,
  PAGE4_WINDOW_VIDEO_JSON_KEY,
  type Page4WindowId,
} from "@/content/04_Page/windows";
import type { DriveMediaItem, DriveWindowListing } from "@/lib/drive/types";
import { IMAGE_QUALITY, IMAGE_WIDTH, withImageWidth } from "@/lib/image-proxy";
import { useWindowOverrideSrc } from "@/lib/window-overrides";

const REFRESH_MS = 45_000;
const IMAGE_HOLD_MS = 8_000;

type ContentWindowProps = {
  windowId: Page4WindowId;
  /** CSS aspect-ratio. Omit or pass empty to fill parent box. */
  aspectRatio?: string;
  className?: string;
  /** Small windows start paused on the first frame. */
  autoplay?: boolean;
};

type ScriptClip = {
  id?: string;
  name?: string;
  url?: string;
};

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const s = Math.floor(sec % 60);
  const m = Math.floor(sec / 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function toProxiedVideo(clip: ScriptClip): DriveMediaItem | null {
  const rawUrl = clip.url?.trim();
  if (!rawUrl) return null;
  const name = clip.name?.trim() || clip.id || "video";
  return {
    id: clip.id || rawUrl,
    name,
    kind: "video",
    src: `/api/travel-lifestyle/stream?src=${encodeURIComponent(rawUrl)}`,
    etag: `${clip.id ?? ""}:${name}`,
  };
}

async function listVideosFromAppsScript(
  windowId: Page4WindowId,
): Promise<DriveMediaItem[]> {
  const jsonKey = PAGE4_WINDOW_VIDEO_JSON_KEY[windowId];
  if (!jsonKey) return [];
  const res = await fetch(PAGE4_APPS_SCRIPT_URL, {
    cache: "no-store",
    redirect: "follow",
  });
  if (!res.ok) return [];
  const data = (await res.json()) as Record<
    string,
    { videos?: ScriptClip[] } | undefined
  >;
  const clips = data[jsonKey]?.videos ?? [];
  return clips
    .map(toProxiedVideo)
    .filter((item): item is DriveMediaItem => Boolean(item));
}

async function listFromWindowApi(
  windowId: Page4WindowId,
): Promise<DriveMediaItem[]> {
  const res = await fetch(`/api/drive/window/${windowId}`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  const text = await res.text();
  if (!text || text.trimStart().startsWith("<")) return [];
  const data = JSON.parse(text) as DriveWindowListing;
  return data.items ?? [];
}

/**
 * Framed content slot — Drive / Apps Script media.
 * Video: mini player bar (play, mute, volume, seek, time, fullscreen).
 * Outer size / radius / Drive sources unchanged.
 */
export function ContentWindow({
  windowId,
  aspectRatio = "3 / 4",
  className = "",
  autoplay = true,
}: ContentWindowProps) {
  const overrideSrc = useWindowOverrideSrc(windowId);
  const [items, setItems] = useState<DriveMediaItem[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(autoplay);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(0.85);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [isFs, setIsFs] = useState(false);
  const persistControls = !autoplay;
  const allowImageOverride = windowId === "Window_Main";
  /** Do not attach MP4 until user hits Play */
  const etagRef = useRef("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const wasPlayingRef = useRef(false);

  const load = useCallback(async () => {
    try {
      let next = await listFromWindowApi(windowId);
      const needsVideo = windowId !== "Window_Main";
      if (needsVideo && !next.some((item) => item.kind === "video")) {
        const scriptVideos = await listVideosFromAppsScript(windowId);
        if (scriptVideos.length) next = scriptVideos;
      }
      if (!next.length) return;
      const fingerprint = next.map((i) => `${i.id}:${i.etag}`).join("|");
      if (fingerprint === etagRef.current) return;
      etagRef.current = fingerprint;
      setItems(next);
      setIndex(0);
      setPlaying(autoplay);
      setMuted(true);
      setCurrentTime(0);
      setDuration(0);
    } catch {
      /* keep last */
    }
  }, [windowId, autoplay]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), REFRESH_MS);
    return () => window.clearInterval(id);
  }, [load]);

  const current = items[index];
  const isVideo = current?.kind === "video";

  useEffect(() => {
    setPlaying(autoplay);
    setCurrentTime(0);
    setDuration(0);
  }, [current?.id, autoplay]);
  const imageSrc =
    current?.kind === "image" && current.src
      ? withImageWidth(
          current.src,
          windowId === "Window_Main" ? IMAGE_WIDTH.hero : IMAGE_WIDTH.card,
          windowId === "Window_Main" ? IMAGE_QUALITY.hero : IMAGE_QUALITY.card,
        )
      : current?.src;

  useEffect(() => {
    if (!current || current.kind !== "image" || items.length <= 1) return;
    const id = window.setTimeout(() => {
      setIndex((i) => (i + 1) % items.length);
    }, IMAGE_HOLD_MS);
    return () => window.clearTimeout(id);
  }, [current, index, items.length]);

  const onVideoEnded = () => {
    if (items.length <= 1) {
      const v = videoRef.current;
      if (v) {
        v.currentTime = 0;
        void v.play().catch(() => setPlaying(false));
      }
      return;
    }
    setIndex((i) => (i + 1) % items.length);
    setPlaying(true);
  };

  // Sync play / mute / volume — original audio track preserved
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !current || current.kind !== "video") return;
    v.muted = muted;
    v.defaultMuted = muted;
    v.volume = Math.min(1, Math.max(0, volume));
    if (playing) {
      void v.play().catch(() => setPlaying(false));
    } else {
      v.pause();
    }
  }, [current, playing, muted, volume]);

  // Time / duration tracking
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !isVideo) return;

    const onTime = () => {
      if (!seeking) setCurrentTime(v.currentTime || 0);
    };
    const onMeta = () => {
      setDuration(v.duration || 0);
      if (!playing && v.currentTime === 0) {
        try {
          v.currentTime = 0.01;
        } catch {
          /* ignore */
        }
      }
    };
    const onDur = () => setDuration(v.duration || 0);

    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("durationchange", onDur);
    v.addEventListener("loadeddata", onMeta);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("durationchange", onDur);
      v.removeEventListener("loadeddata", onMeta);
    };
  }, [current, isVideo, playing, seeking]);

  // Fullscreen change
  useEffect(() => {
    const onFs = () => {
      const el = shellRef.current;
      setIsFs(Boolean(el && document.fullscreenElement === el));
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const togglePlay = (e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    if (!isVideo) return;
    setPlaying((p) => !p);
  };

  const toggleMute = (e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    if (!isVideo) return;
    setMuted((m) => {
      if (m) {
        if (volume < 0.05) setVolume(0.7);
      }
      return !m;
    });
  };

  const onVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const next = Number(e.target.value);
    setVolume(next);
    if (next > 0.01 && muted) setMuted(false);
    if (next <= 0.01) setMuted(true);
  };

  const seekToRatio = (ratio: number) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    const t = Math.min(duration, Math.max(0, ratio * duration));
    v.currentTime = t;
    setCurrentTime(t);
  };

  const onSeekInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    seekToRatio(Number(e.target.value));
  };

  const onSeekPointerDown = () => {
    wasPlayingRef.current = playing;
    setSeeking(true);
    setPlaying(false);
  };

  const onSeekPointerUp = () => {
    setSeeking(false);
    if (wasPlayingRef.current) setPlaying(true);
  };

  const toggleFullscreen = async (e: React.SyntheticEvent) => {
    e.stopPropagation();
    const el = shellRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement === el) {
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen();
      }
    } catch {
      /* browser may block */
    }
  };

  const progress = duration > 0 ? currentTime / duration : 0;

  if (allowImageOverride && overrideSrc) {
    return (
      <div
        className={`relative w-full overflow-hidden rounded-sm border border-fg/14 bg-bg-elevated shadow-[0_8px_24px_rgba(0,0,0,0.22)] ${className}`}
        style={aspectRatio ? { aspectRatio } : undefined}
      >
        <img
          src={overrideSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
      </div>
    );
  }

  return (
    <div
      ref={shellRef}
      className={`group/win relative w-full overflow-hidden rounded-sm border border-fg/14 bg-bg-elevated shadow-[0_8px_24px_rgba(0,0,0,0.22)] ${className} ${isFs ? "bg-black" : ""}`}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      <div className="relative h-full min-h-0 w-full overflow-hidden bg-bg">
        {current?.kind === "image" ? (
          <img
            key={current.id}
            src={imageSrc ?? current.src}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        ) : null}

        {current?.kind === "video" ? (
          <video
            key={current.id}
            ref={videoRef}
            src={current.src}
            className={`absolute inset-0 h-full w-full object-center ${isFs ? "object-contain" : "object-cover"}`}
            muted={muted}
            playsInline
            loop
            onEnded={onVideoEnded}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            preload="metadata"
            onClick={togglePlay}
            tabIndex={-1}
          />
        ) : null}

        {isVideo ? (
          <>
            <button
              type="button"
              onClick={togglePlay}
              aria-label={playing ? "Pause video" : "Play video"}
              className={[
                "absolute left-1/2 top-1/2 z-[2] flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/35 sm:h-8 sm:w-8",
                "bg-black/70 text-white shadow-[0_4px_18px_rgba(0,0,0,0.45)]",
                "transition-[opacity,transform,background-color] duration-200 ease-out",
                "hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50",
                persistControls
                  ? "opacity-100 scale-100"
                  : playing
                    ? "pointer-events-none opacity-0 scale-95 group-hover/win:pointer-events-auto group-hover/win:opacity-90 group-hover/win:scale-100"
                    : "opacity-90 scale-100",
              ].join(" ")}
              style={persistControls ? { opacity: 1 } : undefined}
            >
              {playing ? (
                <Pause
                  className="h-3 w-3"
                  strokeWidth={1.75}
                  fill="currentColor"
                />
              ) : (
                <Play
                  className="h-3 w-3 translate-x-px"
                  strokeWidth={1.75}
                  fill="currentColor"
                />
              )}
            </button>

            <div
              className={[
                "absolute inset-x-0 bottom-0 z-[3] px-1 pb-1 pt-3 sm:px-1.5 sm:pb-1",
                "bg-black/55",
                "transition-opacity duration-200",
                persistControls || !playing
                  ? "opacity-100"
                  : "opacity-0 group-hover/win:opacity-100 group-focus-within/win:opacity-100",
              ].join(" ")}
              style={
                persistControls || !playing
                  ? { opacity: 1, pointerEvents: "auto" }
                  : undefined
              }
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <input
                type="range"
                min={0}
                max={1}
                step={0.001}
                value={progress}
                aria-label="Seek"
                onChange={onSeekInput}
                onPointerDown={onSeekPointerDown}
                onPointerUp={onSeekPointerUp}
                onTouchStart={onSeekPointerDown}
                onTouchEnd={onSeekPointerUp}
                className="mx-auto mb-0.5 block h-1 w-[60%] cursor-pointer appearance-none rounded-full bg-white/20 accent-white [&::-webkit-slider-thumb]:h-1.5 [&::-webkit-slider-thumb]:w-1.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
              />

              <div className="flex items-center gap-0.5 sm:gap-1">
                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label={playing ? "Pause" : "Play"}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/10 sm:h-6 sm:w-6"
                >
                  {playing ? (
                    <Pause className="h-2.5 w-2.5" fill="currentColor" />
                  ) : (
                    <Play
                      className="h-2.5 w-2.5 translate-x-px"
                      fill="currentColor"
                    />
                  )}
                </button>

                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={muted ? "Unmute" : "Mute"}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/10 sm:h-6 sm:w-6"
                >
                  {muted || volume < 0.01 ? (
                    <VolumeX className="h-2.5 w-2.5" strokeWidth={2} />
                  ) : (
                    <Volume2 className="h-2.5 w-2.5" strokeWidth={2} />
                  )}
                </button>

                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={muted ? 0 : volume}
                  aria-label="Volume"
                  onChange={onVolumeChange}
                  className="h-0.5 w-7 max-w-[22%] cursor-pointer appearance-none rounded-full bg-white/20 accent-white sm:w-10 [&::-webkit-slider-thumb]:h-1.5 [&::-webkit-slider-thumb]:w-1.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                />

                <span className="min-w-0 flex-1 truncate text-[0.45rem] tabular-nums tracking-wide text-white/75 sm:text-[0.5rem]">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>

                <button
                  type="button"
                  onClick={toggleFullscreen}
                  aria-label={isFs ? "Exit fullscreen" : "Fullscreen"}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/10 sm:h-6 sm:w-6"
                >
                  {isFs ? (
                    <Minimize2 className="h-2.5 w-2.5" strokeWidth={2} />
                  ) : (
                    <Maximize2 className="h-2.5 w-2.5" strokeWidth={2} />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : null}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{ boxShadow: "inset 0 0 0 1px rgba(0, 0, 0, 0.28)" }}
        />
      </div>
    </div>
  );
}
