"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { LandingContactCta } from "@/components/landing-contact-cta";
import { LandingCardSkeleton, LandingImageCard } from "@/components/landing-image-card";
import { LandingStage } from "@/components/landing-stage";
import { galleryFrameClass } from "@/components/dest-scene-backdrop";
import { localDestImage } from "@/content/destinations";
import { fetchTravelExperienceDestinationsCached, preloadImage } from "@/lib/travel-experience-cache";
import { displayModelLabel, publicModelsFolderUrl, useMenuConfig } from "@/lib/menu-config";
import { rememberModelLabel } from "@/lib/model-label-memory";
import { fitTypeSize, useIsMobile } from "@/lib/use-is-mobile";
import { resolveUiCopy, useI18n } from "@/lib/i18n";
import { SAMPLE_MAIN_TITLE, SAMPLE_SUBTITLE } from "@/content/site-profile";

type DestCard = {
  id: string;
  name: string;
  coverSrc: string | null;
  cardSrc?: string | null;
};

export function TravelExperienceView({ showIntro = false }: { showIntro?: boolean }) {
  const {
    page2Title,
    page2Sub,
    page2TitleSize,
    page2SubSize,
    destGallery,
    modelLabels,
    modelNameSize,
    themeAccent,
    siteTitle,
  } = useMenuConfig();
  const mobile = useIsMobile();
  const { t } = useI18n();
  const titleText = resolveUiCopy(page2Title, SAMPLE_MAIN_TITLE, t("mainTitle"));
  const subText = resolveUiCopy(page2Sub, SAMPLE_SUBTITLE, t("subtitle"));
  const titlePx = Math.round(fitTypeSize(page2TitleSize, mobile, 22) * 1.14);
  const subPx = Math.round(fitTypeSize(page2SubSize, mobile, 13) * 1.06);
  const [models, setModels] = useState<DestCard[]>([]);
  const [ready, setReady] = useState(false);
  const [revealed, setRevealed] = useState(!showIntro);
  const frameClass = galleryFrameClass(destGallery.frameStyle);
  const placeholder = destGallery.placeholderUrl.trim();
  const rootFolder = publicModelsFolderUrl(destGallery);

  const thumbOf = (dest: DestCard) =>
    dest.coverSrc || dest.cardSrc || localDestImage(dest.id, dest.name) || placeholder || null;

  const load = useCallback(async () => {
    if (!rootFolder.trim()) {
      setModels([]);
      setReady(true);
      return;
    }
    try {
      const data = (await fetchTravelExperienceDestinationsCached({
        folder: rootFolder,
        cover: destGallery.coverFileName,
      })) as { destinations?: DestCard[] };
      const list = data.destinations ?? [];
      setModels(list);
      for (const dest of list.slice(0, 2)) {
        const src = dest.coverSrc || dest.cardSrc;
        if (src) void preloadImage(src, "high");
      }
    } catch {
      /* keep last */
    } finally {
      setReady(true);
    }
  }, [rootFolder, destGallery.coverFileName]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!showIntro) {
      setRevealed(true);
      return;
    }
    setRevealed(false);
    const id = window.setTimeout(() => setRevealed(true), 280);
    return () => window.clearTimeout(id);
  }, [showIntro]);

  useEffect(() => {
    document.title = siteTitle.trim() || "Moon's AI Travel";
  }, [siteTitle]);

  return (
    <LandingStage>
      <div
        className="flex flex-col"
        style={{
          opacity: revealed ? 1 : 0,
          transition: "opacity 0.45s ease",
        }}
      >
        <header className="mb-2 flex shrink-0 flex-col items-center justify-center text-center sm:mb-2.5">
          <h1
            className="font-display font-semibold leading-[1.08] tracking-tight text-white break-keep"
            style={{
              fontSize: `clamp(${Math.max(titlePx, 26)}px, 4.2vh, 2.35rem)`,
              textShadow: "0 2px 18px rgba(0,0,0,0.55), 0 1px 2px rgba(0,0,0,0.7)",
            }}
          >
            {titleText}
          </h1>
          {subText.split("\n").filter(Boolean).map((line) => (
            <p
              key={line}
              className="mt-1 leading-snug text-white/90"
              style={{
                fontSize: `clamp(${Math.max(subPx, 13)}px, 1.7vh, 1.05rem)`,
                textShadow: "0 1px 10px rgba(0,0,0,0.5)",
              }}
            >
              {line}
            </p>
          ))}
        </header>

        <section
          aria-labelledby="ai-models-heading"
          className="flex flex-col"
        >
          <h2
            id="ai-models-heading"
            className="mb-2 shrink-0 text-center font-display text-[0.72rem] font-medium tracking-[0.22em] sm:text-[0.8rem]"
            style={{
              textShadow: "0 1px 10px rgba(0,0,0,0.5)",
              color: themeAccent || "#f0e6c8",
            }}
          >
            {t("aiModels")}
          </h2>
          <div className="grid grid-cols-1 justify-items-center gap-3 min-[640px]:grid-cols-2 lg:grid-cols-4">
            {!ready
              ? [0, 1, 2, 3].map((i) => <LandingCardSkeleton key={i} />)
              : models.map((dest, i) => {
                  const name = displayModelLabel(dest.id, dest.name, modelLabels);
                  const src = thumbOf(dest);
                  return (
                    <Link
                      key={dest.id}
                      to="/experience/$destination"
                      params={{ destination: dest.id }}
                      onClick={() => rememberModelLabel(dest.id, name)}
                      className="group relative z-10 block h-full min-h-0 cursor-pointer outline-none"
                    >
                      <LandingImageCard
                        name={name}
                        src={src}
                        frameClass={frameClass}
                        eager={i < 2}
                        high={i < 1}
                        captionSize={mobile ? Math.max(modelNameSize, 11) : modelNameSize}
                        onImgError={(el) => {
                          const fb = localDestImage(dest.id, dest.name) || placeholder;
                          if (fb && el.src !== fb) el.src = fb;
                        }}
                      />
                    </Link>
                  );
                })}
          </div>
        </section>

        {ready && models.length === 0 ? (
          <p className="mt-12 px-4 text-center text-sm leading-relaxed text-white/70">
            {rootFolder.trim() ? t("noModels") : t("connectDrive")}
          </p>
        ) : null}

        <LandingContactCta />
      </div>
    </LandingStage>
  );
}
