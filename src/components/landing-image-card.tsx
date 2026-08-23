"use client";

type LandingImageCardProps = {
  name: string;
  src: string | null;
  frameClass: string;
  eager?: boolean;
  high?: boolean;
  captionSize?: number;
  fit?: "home" | "places";
  onImgError?: (el: HTMLImageElement) => void;
};

export function LandingImageCard({
  name,
  src,
  frameClass,
  eager = false,
  high = false,
  captionSize = 10.4,
  fit = "home",
  onImgError,
}: LandingImageCardProps) {
  const frameH =
    fit === "places"
      ? "aspect-[3/4] w-full"
      : "aspect-[3/4] w-full min-[640px]:h-[min(calc(100dvh-11.5rem),41rem)] min-[640px]:w-auto min-[640px]:max-w-full";
  const articleClass =
    fit === "places"
      ? "lux-card flex h-full min-h-0 w-full min-w-0 flex-col items-stretch gap-1 rounded-md bg-black/35 p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.42)] max-[768px]:bg-black/45"
      : "lux-card flex h-full min-h-0 w-full min-w-0 flex-col items-stretch gap-1 rounded-md bg-black/35 p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.42)] max-[768px]:bg-black/45 min-[640px]:w-auto min-[640px]:min-w-[20rem] min-[640px]:items-center";
  const captionClass =
    fit === "places"
      ? "flex w-full min-w-0 shrink-0 items-center justify-center rounded-sm border border-fg/12 bg-black/55 px-3 py-2 sm:px-4"
      : "flex w-full min-w-0 shrink-0 items-center justify-center rounded-sm border border-fg/12 bg-black/55 px-4 py-2 min-[640px]:min-w-[20rem] min-[640px]:px-5";

  return (
    <article className={articleClass}>
      <div
        className={`${frameClass} min-h-0 w-full transition-opacity duration-(--motion-fast) group-hover:opacity-95 group-focus-visible:ring-2 group-focus-visible:ring-fg/40 group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-bg min-[640px]:w-auto`}
      >
        <div className={`album-frame-inner relative overflow-hidden ${frameH}`}>
          {src ? (
            <img
              src={src}
              alt=""
              loading={eager ? "eager" : "lazy"}
              fetchPriority={high ? "high" : "auto"}
              decoding="async"
              draggable={false}
              referrerPolicy="no-referrer"
              onError={(e) => onImgError?.(e.currentTarget)}
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          ) : (
            <div className="absolute inset-0 animate-pulse bg-white/8" />
          )}
        </div>
      </div>
      <div className={captionClass}>
        <span
          className="max-w-full text-center font-medium tracking-normal text-fg/90 uppercase whitespace-nowrap"
          style={{ fontSize: captionSize }}
        >
          {name}
        </span>
      </div>
    </article>
  );
}

export function LandingCardSkeleton({ fit = "home" }: { fit?: "home" | "places" }) {
  const frameH =
    fit === "places"
      ? "aspect-[3/4] w-full"
      : "aspect-[3/4] w-full min-[640px]:h-[min(calc(100dvh-11.5rem),41rem)] min-[640px]:w-auto";
  return (
    <article className="flex h-full min-h-0 w-full flex-col items-center gap-1 rounded-md bg-black/35 p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.42)]">
      <div className={`animate-pulse bg-white/8 ${frameH}`} />
      <div className="h-6 w-full shrink-0 animate-pulse rounded-sm bg-white/8" />
    </article>
  );
}