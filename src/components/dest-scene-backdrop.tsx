"use client";

type DestSceneBackdropProps = {
  src: string;
  overlay: number;
  blur?: boolean;
};

export function DestSceneBackdrop({
  src,
  overlay,
  blur = false,
}: DestSceneBackdropProps) {
  const darkness = Math.min(80, Math.max(0, blur ? Math.max(overlay, 64) : overlay)) / 100;
  if (!src) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-bg">
      <img
        src={src}
        alt=""
        draggable={false}
        decoding="async"
        loading="eager"
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover object-center"
        style={
          blur
            ? { filter: "blur(12px) saturate(0.88)", transform: "scale(1.06)" }
            : undefined
        }
      />
      <div
        className="absolute inset-0"
        style={{ background: `rgba(7, 8, 10, ${darkness})` }}
      />
    </div>
  );
}

export function galleryFrameClass(style: "gold" | "thin" | "soft"): string {
  if (style === "thin") {
    return "overflow-hidden rounded-md border border-white/25 bg-black/30 shadow-[0_12px_28px_rgba(0,0,0,0.4)]";
  }
  if (style === "soft") {
    return "overflow-hidden rounded-md border border-white/10 bg-black/25 shadow-[0_18px_40px_rgba(0,0,0,0.5)]";
  }
  return "album-frame overflow-hidden rounded-md border border-border/80 bg-bg-elevated/80 shadow-[0_16px_36px_rgba(0,0,0,0.42)]";
}
