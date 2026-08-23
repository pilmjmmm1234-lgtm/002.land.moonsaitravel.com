"use client";

import { useCallback, useEffect, useState } from "react";
import { Play } from "lucide-react";
import { LandingStage } from "@/components/landing-stage";
import { SiteBackLink, SiteMenu } from "@/components/site-menu";
import { StorySlideshow } from "@/components/story-slideshow";
import { galleryFrameClass } from "@/components/dest-scene-backdrop";
import {
  fetchTravelGalleryCached,
  fetchTravelPlacesCached,
  preloadImage,
} from "@/lib/travel-experience-cache";
import { displayFolderName } from "@/lib/dest-names";
import { isPlayableVideoSrc, drivePreviewEmbed } from "@/lib/drive/media";
import { PrivateDestinationGate } from "@/lib/private-dest";
import { useMenuConfig } from "@/lib/menu-config";
import { fitTypeSize, useIsMobile } from "@/lib/use-is-mobile";
import { useI18n } from "@/lib/i18n";

const VIEW_KEY = "travel-gallery-view";
type GalleryView = "album" | "card";

function readSavedView(): GalleryView | "" {
  try {
    const value = window.localStorage.getItem(VIEW_KEY);
    return value === "album" || value === "card" ? value : "";
  } catch {
    return "";
  }
}

function saveView(value: GalleryView): void {
  try {
    window.localStorage.setItem(VIEW_KEY, value);
  } catch {
    /* ignore */
  }
}

function ViewToggle({
  mode,
  onChange,
  albumLabel,
  cardLabel,
  galleryLabel,
}: {
  mode: GalleryView;
  onChange: (next: GalleryView) => void;
  albumLabel: string;
  cardLabel: string;
  galleryLabel: string;
}) {
  return (
    <div
      role="group"
      aria-label={galleryLabel}
      className="inline-flex max-w-full overflow-hidden rounded-full border border-white/14 bg-black/55 p-0.5 backdrop-blur-sm"
    >
      <button
        type="button"
        onClick={() => onChange("album")}
        aria-pressed={mode === "album"}
        className={`min-h-8 min-w-[5.6rem] px-2.5 text-[0.62rem] tracking-wide sm:min-h-9 sm:min-w-[6.6rem] sm:px-3 sm:text-[0.68rem] ${
          mode === "album" ? "rounded-full bg-[#e8d5a3]/20 text-[#f3ead4]" : "text-white/70"
        }`}
      >
        {albumLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange("card")}
        aria-pressed={mode === "card"}
        className={`min-h-8 min-w-[5.6rem] px-2.5 text-[0.62rem] tracking-wide sm:min-h-9 sm:min-w-[6.6rem] sm:px-3 sm:text-[0.68rem] ${
          mode === "card" ? "rounded-full bg-[#e8d5a3]/20 text-[#f3ead4]" : "text-white/70"
        }`}
      >
        {cardLabel}
      </button>
    </div>
  );
}

export function DestImageGallery({
  modelId,
  placeId,
}: {
  modelId: string;
  placeId: string;
}) {
  const { destGallery, page2TitleSize, siteTitle } = useMenuConfig();
  const { t } = useI18n();
  const mobile = useIsMobile();
  const titlePx = Math.round(fitTypeSize(page2TitleSize, mobile, 20) * 0.92);
  const frameClass = galleryFrameClass(destGallery.frameStyle);
  const [placeName, setPlaceName] = useState("");
  const [images, setImages] = useState<
    { id: string; thumb: string; full: string; kind: "image" | "video" }[]
  >([]);
  const [videoFailed, setVideoFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [missing, setMissing] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [view, setView] = useState<GalleryView | null>(null);

  useEffect(() => {
    const saved = readSavedView();
    setView(saved || (mobile ? "album" : "card"));
  }, [mobile]);

  const mode: GalleryView = view ?? (mobile ? "album" : "card");
  const chooseView = (next: GalleryView) => {
    setView(next);
    saveView(next);
  };

  const load = useCallback(async () => {
    try {
      const data = (await fetchTravelGalleryCached(placeId)) as {
        images?: {
          id: string;
          name: string;
          url?: string;
          thumbUrl?: string;
          kind?: string;
        }[];
      };
      const places = (await fetchTravelPlacesCached({
        modelId,
        cover: destGallery.coverFileName,
      })) as {
        places?: { id: string; name: string }[];
        publicPlaces?: { id: string; name: string }[];
        privatePlaces?: { id: string; name: string }[];
      };
      const allPlaces = [
        ...(places.places ?? []),
        ...(places.publicPlaces ?? []),
        ...(places.privatePlaces ?? []),
      ];
      const place = allPlaces.find((p) => p.id === placeId);
      const srcs = (data.images ?? [])
        .map((img) => {
          const full = (img.url || img.thumbUrl || "").trim();
          const thumb = (img.thumbUrl || img.url || "").trim();
          const kind: "image" | "video" =
            img.kind === "video" || isPlayableVideoSrc(full) ? "video" : "image";
          return {
            id: (img.id || "").trim(),
            thumb,
            full,
            kind,
          };
        })
        .filter((img) => img.thumb || img.full);
      setMissing(srcs.length === 0);
      setPlaceName(place ? displayFolderName(place.name) : "");
      setImages(srcs);
      const firstImage = srcs.find((img) => img.kind === "image");
      if (firstImage?.thumb) void preloadImage(firstImage.thumb, "high");
    } catch {
      /* keep last */
    } finally {
      setReady(true);
    }
  }, [placeId, modelId, destGallery.coverFileName]);

  useEffect(() => {
    setReady(false);
    void load();
  }, [load]);

  useEffect(() => {
    if (placeName) document.title = `${placeName} — ${siteTitle.trim() || "Moon's AI Travel"}`;
  }, [placeName]);

  const openLightbox = (index: number) => {
    setVideoFailed(false);
    setOpenIndex(index);
    window.history.pushState({ galleryLightbox: index }, "");
  };

  const closeLightbox = useCallback(() => {
    setVideoFailed(false);
    setExpanded(false);
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    }
    if (window.history.state?.galleryLightbox != null) {
      window.history.back();
      return;
    }
    setOpenIndex(null);
  }, []);

  useEffect(() => {
    const onPop = () => {
      setExpanded(false);
      setOpenIndex(null);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    const onFs = () => {
      if (!document.fullscreenElement) setExpanded(false);
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [openIndex, closeLightbox]);

  const openSrc = openIndex !== null ? images[openIndex]?.full : null;
  const openKind = openIndex !== null ? images[openIndex]?.kind : null;
  const openId = openIndex !== null ? images[openIndex]?.id : "";
  const albumSrcs = images.map((img) => img.full || img.thumb).filter(Boolean);
  const toggle = (
    <ViewToggle
      mode={mode}
      onChange={chooseView}
      albumLabel={t("albumView")}
      cardLabel={t("cardView")}
      galleryLabel={t("gallery")}
    />
  );

  const expandView = () => {
    if (!images.length) return;
    if (openIndex === null) openLightbox(0);
    setExpanded(true);
    const root = document.getElementById("gallery-lightbox");
    if (root && !document.fullscreenElement) {
      void root.requestFullscreen?.().catch(() => undefined);
    }
  };

  const resetView = () => {
    setExpanded(false);
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    }
    setOpenIndex(null);
  };

  const albumReady = mode === "album" && ready && albumSrcs.length > 0;
  const viewBar = (
    <div className="pointer-events-none fixed top-[max(1rem,var(--grok-banner-h,0.5rem))] right-[3.65rem] z-[55] sm:top-[max(1.15rem,var(--grok-banner-h,0.75rem))] sm:right-[4.85rem]">
      <div className="pointer-events-auto">{toggle}</div>
    </div>
  );

  return (
    <PrivateDestinationGate id={modelId} name={placeName}>
      <PrivateDestinationGate id={placeId} name={placeName}>
        {albumReady ? (
          <>
            <SiteMenu />
            {viewBar}
            <StorySlideshow
              storyName={placeName}
              images={albumSrcs}
              backTo={{
                to: "/experience/$destination",
                params: { destination: modelId },
              }}
            />
          </>
        ) : (
          <>
            <LandingStage>
              {viewBar}
              <SiteBackLink
                to="/experience/$destination"
                params={{ destination: modelId }}
              >
                {`← ${t("back")}`}
              </SiteBackLink>
              <header className="mb-3 flex shrink-0 flex-col items-center text-center sm:mb-4">
                <h1
                  className="font-display font-semibold tracking-tight text-white"
                  style={{
                    fontSize: `clamp(${Math.max(titlePx, 22)}px, 4vh, 2.1rem)`,
                    textShadow: "0 2px 18px rgba(0,0,0,0.55)",
                  }}
                >
                  {placeName}
                </h1>
              </header>

              {!ready ? (
                <div className="grid grid-cols-2 gap-3 sm:gap-5">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="aspect-[3/4] animate-pulse rounded-md bg-white/8"
                    />
                  ))}
                </div>
              ) : missing || images.length === 0 ? (
                <p className="mt-16 text-center text-sm text-white/70">
                  {t("noImages")}
                </p>
              ) : (
                <section
                  aria-label={t("gallery")}
                  className="grid grid-cols-2 content-start gap-3 pb-24 sm:gap-5"
                >
                  {images.map((img, i) => (
                    <button
                      key={`${img.thumb}-${i}`}
                      type="button"
                      onClick={() => openLightbox(i)}
                      className="lux-card group block w-full rounded-md bg-black/35 p-1.5 text-left shadow-[0_16px_40px_rgba(0,0,0,0.42)] outline-none focus-visible:ring-2 focus-visible:ring-fg/40"
                    >
                      <div className={frameClass}>
                        <div className="album-frame-inner relative w-full overflow-hidden sm:aspect-3/4">
                          {img.kind === "video" ? (
                            <>
                              {img.thumb && !isPlayableVideoSrc(img.thumb) ? (
                                <img
                                  src={img.thumb}
                                  alt=""
                                  loading={i < 2 ? "eager" : "lazy"}
                                  decoding="async"
                                  draggable={false}
                                  referrerPolicy="no-referrer"
                                  className="block h-auto w-full object-contain sm:absolute sm:inset-0 sm:h-full sm:object-cover sm:object-center"
                                />
                              ) : (
                                <video
                                  src={img.full}
                                  muted
                                  playsInline
                                  preload="metadata"
                                  className="block h-auto w-full object-contain sm:absolute sm:inset-0 sm:h-full sm:object-cover sm:object-center"
                                />
                              )}
                              <span className="pointer-events-none absolute inset-0 grid place-items-center bg-black/25">
                                <span className="grid size-11 place-items-center rounded-full border border-white/35 bg-black/55 text-white">
                                  <Play className="size-5 translate-x-px" fill="currentColor" />
                                </span>
                              </span>
                            </>
                          ) : (
                            <img
                              src={img.thumb}
                              alt=""
                              loading={i < 2 ? "eager" : "lazy"}
                              decoding="async"
                              draggable={false}
                              referrerPolicy="no-referrer"
                              className="block h-auto w-full object-contain sm:absolute sm:inset-0 sm:h-full sm:object-cover sm:object-center"
                            />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </section>
              )}
            </LandingStage>

            {images.length > 0 ? (
              <div className="pointer-events-none fixed right-4 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-[100] flex flex-col gap-2 sm:right-6">
                <button
                  type="button"
                  onClick={expandView}
                  aria-label={t("expand")}
                  title={t("expand")}
                  className="pointer-events-auto grid size-10 place-items-center rounded-full border border-white/22 bg-black/55 text-[1.05rem] text-white/90 shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-sm hover:bg-black/70 sm:size-11"
                >
                  ⛶
                </button>
                <button
                  type="button"
                  onClick={resetView}
                  aria-label={t("reset")}
                  title={t("reset")}
                  className="pointer-events-auto grid size-10 place-items-center rounded-full border border-white/22 bg-black/55 text-[1.15rem] text-white/90 shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-sm hover:bg-black/70 sm:size-11"
                >
                  ↺
                </button>
              </div>
            ) : null}

            {openSrc ? (
              <div
                id="gallery-lightbox"
                className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 p-3 sm:p-8"
                role="dialog"
                aria-modal="true"
                aria-label="Image preview"
                onClick={(e) => {
                  if (e.target === e.currentTarget) closeLightbox();
                }}
              >
                <button
                  type="button"
                  onClick={closeLightbox}
                  className="absolute top-3 left-3 z-10 inline-flex min-h-9 items-center rounded-full border border-white/20 bg-black/50 px-3 text-[0.68rem] tracking-[0.12em] text-white/85 sm:hidden"
                >
                  ← {t("back")}
                </button>
                <button
                  type="button"
                  onClick={closeLightbox}
                  aria-label={t("close")}
                  className="absolute top-3 right-3 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/50 text-xl text-white/90 hover:bg-black/70"
                >
                  ×
                </button>
                {openKind === "video" || isPlayableVideoSrc(openSrc) ? (
                  videoFailed && openId ? (
                    <iframe
                      title="Drive video"
                      src={drivePreviewEmbed(openId)}
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                      className={
                        expanded
                          ? "h-[100dvh] w-[100vw] border-0"
                          : "h-[min(86dvh,720px)] w-[min(94vw,1100px)] border-0"
                      }
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <video
                      src={openSrc}
                      controls
                      playsInline
                      autoPlay
                      className={
                        expanded
                          ? "max-h-[100dvh] max-w-[100vw] object-contain"
                          : "max-h-[86dvh] max-w-[94vw] object-contain"
                      }
                      onClick={(e) => e.stopPropagation()}
                      onError={() => setVideoFailed(true)}
                    />
                  )
                ) : (
                  <img
                    src={openSrc}
                    alt=""
                    draggable={false}
                    referrerPolicy="no-referrer"
                    className={
                      expanded
                        ? "max-h-[100dvh] max-w-[100vw] object-contain"
                        : "max-h-[86dvh] max-w-[94vw] object-contain"
                    }
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
              </div>
            ) : null}
          </>
        )}
      </PrivateDestinationGate>
    </PrivateDestinationGate>
  );
}
