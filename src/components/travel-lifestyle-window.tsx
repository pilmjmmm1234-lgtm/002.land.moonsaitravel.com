"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { TRAVEL_LIFESTYLE_REFRESH_MS } from "@/content/Travel_Lifestyle/video";

type VideoItem = {
  id: string;
  src: string;
  name?: string;
};

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const s = Math.floor(sec % 60);
  const m = Math.floor(sec / 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Small framed window on the home screen.
 * Frame size/position/design unchanged.
 * Mini controls: play, seek, mute, volume.
 * Video loads immediately (paused first frame) — no black empty panel.
 */
export function TravelLifestyleWindow() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [items, setItems] = useState<VideoItem[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(0.85);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const wasPlayingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/travel-lifestyle/videos", {
          cache: "default",
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          items?: { id?: string; src?: string; name?: string }[];
        };
        const next = (data.items ?? [])
          .filter((v) => Boolean(v?.src?.trim()))
          .map((v) => ({
            id: v.id || v.src!,
            src: v.src!.trim(),
            name: v.name,
          }));
        if (cancelled) return;
        setItems(next);
        setIndex((i) => (next.length === 0 ? 0 : i % next.length));
      } catch {
        /* keep last / empty */
      }
    };

    void load();
    const id = window.setInterval(() => void load(), TRAVEL_LIFESTYLE_REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const current = items[index] ?? null;

  useEffect(() => {
    setPlaying(true);
    setMuted(true);
    setCurrentTime(0);
    setDuration(0);
  }, [current?.id]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !current) return;
    el.muted = muted;
    el.defaultMuted = muted;
    el.volume = Math.min(1, Math.max(0, volume));
    el.playsInline = true;
    if (playing) {
      void el.play().catch(() => setPlaying(false));
    } else {
      el.pause();
    }
  }, [current, playing, muted, volume]);

  // Paint first frame while paused
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !current) return;
    const paintFrame = () => {
      setDuration(el.duration || 0);
      if (!playing) {
        try {
          if (el.currentTime < 0.05) el.currentTime = 0.05;
        } catch {
          /* ignore */
        }
      }
    };
    el.addEventListener("loadeddata", paintFrame);
    el.addEventListener("loadedmetadata", paintFrame);
    const onTime = () => {
      if (!seeking) setCurrentTime(el.currentTime || 0);
    };
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("durationchange", paintFrame);
    return () => {
      el.removeEventListener("loadeddata", paintFrame);
      el.removeEventListener("loadedmetadata", paintFrame);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("durationchange", paintFrame);
    };
  }, [current, playing, seeking]);

  const onEnded = () => {
    // Infinite loop: single file restarts; playlist advances then continues
    if (items.length <= 1) {
      const el = videoRef.current;
      if (el) {
        el.currentTime = 0;
        void el.play().catch(() => setPlaying(false));
      }
      return;
    }
    setIndex((i) => (i + 1) % items.length);
    setPlaying(true);
  };

  const togglePlay = (e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    if (!current) return;
    setPlaying((p) => !p);
  };

  const toggleMute = (e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    setMuted((m) => {
      if (m && volume < 0.05) setVolume(0.7);
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
    const el = videoRef.current;
    if (!el || !duration) return;
    const t = Math.min(duration, Math.max(0, ratio * duration));
    el.currentTime = t;
    setCurrentTime(t);
  };

  const onSeekInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    seekToRatio(Number(e.target.value));
  };

  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <div className="pointer-events-none z-10 flex justify-start max-[768px]:relative max-[768px]:inset-auto max-[768px]:px-0 max-[768px]:pb-0 min-[769px]:absolute min-[769px]:inset-x-0 min-[769px]:bottom-0 min-[769px]:px-5 min-[769px]:pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:min-[769px]:px-8 sm:min-[769px]:pb-8">
      <div
        className="group/life pointer-events-auto rounded-[3px] p-px max-[768px]:w-full sm:rounded-sm min-[769px]:w-[min(69vw,21.5rem)] sm:min-[769px]:w-[min(37vw,24.5rem)]"
        style={{
          background:
            "linear-gradient(155deg, color-mix(in oklab, var(--color-fg) 42%, transparent) 0%, color-mix(in oklab, var(--color-fg) 14%, transparent) 42%, color-mix(in oklab, var(--color-fg) 28%, transparent) 100%)",
          boxShadow:
            "0 10px 32px rgba(0, 0, 0, 0.32), 0 2px 6px rgba(0, 0, 0, 0.18)",
        }}
      >
        <div
          className="rounded-[2px] p-[3px] sm:rounded-[3px] sm:p-[4px]"
          style={{
            background:
              "linear-gradient(165deg, #2a2a2e 0%, #121214 48%, #1c1c20 100%)",
          }}
        >
          <div
            className="rounded-[1px] p-px sm:rounded-[2px]"
            style={{
              background:
                "linear-gradient(145deg, color-mix(in oklab, var(--color-accent) 55%, transparent) 0%, color-mix(in oklab, var(--color-fg) 12%, transparent) 50%, color-mix(in oklab, var(--color-accent) 35%, transparent) 100%)",
            }}
          >
            <div
              className="relative overflow-hidden bg-bg"
              style={{ aspectRatio: "3 / 4" }}
            >
              {current ? (
                <video
                  key={current.id}
                  ref={videoRef}
                  src={current.src}
                  className="absolute inset-0 h-full w-full object-cover object-center"
                  muted={muted}
                  loop
                  playsInline
                  preload="metadata"
                  disablePictureInPicture
                  disableRemotePlayback
                  tabIndex={-1}
                  onEnded={onEnded}
                  onClick={togglePlay}
                  onError={() => {
                    if (items.length > 1) {
                      setIndex((i) => (i + 1) % items.length);
                    }
                  }}
                />
              ) : null}

              {/* Center play when idle / hover */}
              <button
                type="button"
                onClick={togglePlay}
                aria-label={playing ? "Pause" : "Play"}
                className={[
                  "absolute left-1/2 top-1/2 z-[2] flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-fg/25",
                  "bg-bg/45 text-fg shadow-[0_4px_14px_rgba(0,0,0,0.3)] backdrop-blur-[2px] transition-opacity duration-200",
                  "min-[769px]:h-8 min-[769px]:w-8",
                  playing
                    ? "opacity-0 group-hover/life:opacity-90"
                    : "opacity-90",
                ].join(" ")}
              >
                {playing ? (
                  <Pause className="h-3 w-3" fill="currentColor" />
                ) : (
                  <Play className="h-3 w-3 translate-x-px" fill="currentColor" />
                )}
              </button>

              {/* Control bar: seek + sound */}
              <div
                className={[
                  "absolute inset-x-0 bottom-0 z-[3] px-1 pb-1 pt-3",
                  "bg-linear-to-t from-black/70 via-black/30 to-transparent",
                  "transition-opacity duration-200",
                  playing
                    ? "opacity-0 group-hover/life:opacity-100 group-focus-within/life:opacity-100"
                    : "opacity-100",
                ].join(" ")}
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
                  onPointerDown={() => {
                    wasPlayingRef.current = playing;
                    setSeeking(true);
                    setPlaying(false);
                  }}
                  onPointerUp={() => {
                    setSeeking(false);
                    if (wasPlayingRef.current) setPlaying(true);
                  }}
                  className="mx-auto mb-0.5 block h-1 w-[60%] cursor-pointer appearance-none rounded-full bg-white/20 accent-white disabled:opacity-40 [&::-webkit-slider-thumb]:h-1.5 [&::-webkit-slider-thumb]:w-1.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                />

                <div className="flex items-center gap-0.5 px-0.5">
                  <button
                    type="button"
                    onClick={togglePlay}
                    aria-label={playing ? "Pause" : "Play"}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white/90 hover:bg-white/10"
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
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white/90 hover:bg-white/10"
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
                    className="h-0.5 w-8 cursor-pointer appearance-none rounded-full bg-white/20 accent-white sm:w-10 [&::-webkit-slider-thumb]:h-1.5 [&::-webkit-slider-thumb]:w-1.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                  />

                  <span className="min-w-0 flex-1 truncate text-[0.42rem] tabular-nums text-white/75 sm:text-[0.48rem]">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
              </div>

              <div
                className="pointer-events-none absolute inset-0 z-[1]"
                style={{
                  boxShadow: "inset 0 0 0 1px rgba(0, 0, 0, 0.35)",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
