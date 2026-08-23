"use client";

import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ExperiencePrivateWindow } from "@/components/experience-private-window";
import { LandingCardSkeleton, LandingImageCard } from "@/components/landing-image-card";
import { LandingStage } from "@/components/landing-stage";
import { SiteBackLink } from "@/components/site-menu";
import { galleryFrameClass } from "@/components/dest-scene-backdrop";
import {
  fetchTravelPlacesCached,
  preloadImage,
} from "@/lib/travel-experience-cache";
import { displayFolderName } from "@/lib/dest-names";
import { displayModelLabel, useMenuConfig } from "@/lib/menu-config";
import { recalledModelLabel } from "@/lib/model-label-memory";
import { fitTypeSize, useIsMobile } from "@/lib/use-is-mobile";
import { useI18n } from "@/lib/i18n";

type Place = {
  id: string;
  name: string;
  coverSrc?: string | null;
};

function PlaceGrid({
  places,
  modelId,
  frameClass,
  mobile,
  modelNameSize,
  privateMode,
}: {
  places: Place[];
  modelId: string;
  frameClass: string;
  mobile: boolean;
  modelNameSize: number;
  privateMode: boolean;
}) {
  return (
    <div className="grid w-full grid-cols-1 justify-items-stretch gap-5 min-[760px]:grid-cols-2 min-[760px]:gap-6 xl:grid-cols-4">
      {places.map((place, i) => {
        const name = displayFolderName(place.name);
        const src = place.coverSrc || null;
        if (privateMode) {
          return (
            <ExperiencePrivateWindow
              key={place.id}
              destId={modelId}
              destName={name}
              coverSrc={src}
              storyId={place.id}
            />
          );
        }
        return (
          <Link
            key={place.id}
            to="/experience/$destination/$story"
            params={{ destination: modelId, story: place.id }}
            className="group relative z-10 block h-full min-h-0 w-full min-w-0 max-w-full cursor-pointer outline-none"
          >
            <LandingImageCard
              name={name}
              src={src}
              frameClass={frameClass}
              eager={i < 2}
              high={i < 1}
              captionSize={mobile ? Math.max(modelNameSize, 11) : modelNameSize}
              fit="places"
            />
          </Link>
        );
      })}
    </div>
  );
}

export function ModelDestinationsView({ modelId }: { modelId: string }) {
  const { destGallery, page2TitleSize, modelLabels, modelNameSize, siteTitle } =
    useMenuConfig();
  const mobile = useIsMobile();
  const { t } = useI18n();
  const titlePx = Math.round(fitTypeSize(page2TitleSize, mobile, 22) * 1.08);
  const frameClass = galleryFrameClass(destGallery.frameStyle);
  const [modelName, setModelName] = useState("");
  const [publicPlaces, setPublicPlaces] = useState<Place[]>([]);
  const [privatePlaces, setPrivatePlaces] = useState<Place[]>([]);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = (await fetchTravelPlacesCached({
        modelId,
        cover: destGallery.coverFileName,
      })) as { publicPlaces?: Place[]; privatePlaces?: Place[] };
      const remembered = recalledModelLabel(modelId);
      setModelName(
        displayModelLabel(modelId, remembered, modelLabels) || remembered,
      );
      const pub = data.publicPlaces ?? [];
      const priv = data.privatePlaces ?? [];
      setPublicPlaces(pub);
      setPrivatePlaces(priv);
      const first = pub[0]?.coverSrc || priv[0]?.coverSrc;
      if (first) void preloadImage(first, "high");
    } catch {
      /* keep last */
    } finally {
      setReady(true);
    }
  }, [modelId, destGallery.coverFileName, modelLabels]);

  useEffect(() => {
    setReady(false);
    void load();
  }, [load]);

  useEffect(() => {
    if (modelName) document.title = `${modelName} — ${siteTitle.trim() || "Moon's AI Travel"}`;
  }, [modelName]);

  return (
    <LandingStage>
      <SiteBackLink to="/">{`← ${t("back")}`}</SiteBackLink>
      <header className="mb-2 flex shrink-0 flex-col items-center text-center">
        <h1
          className="font-display font-semibold tracking-tight text-white"
          style={{
            fontSize: `clamp(${Math.max(titlePx, 26)}px, 4.4vh, 2.4rem)`,
            textShadow: "0 2px 18px rgba(0,0,0,0.55)",
          }}
        >
          {modelName || "Travel"}
        </h1>
      </header>

      <section className="mt-1" aria-label="Public stories">
        {!ready ? (
          <div className="grid w-full grid-cols-1 gap-5 min-[760px]:grid-cols-2 min-[760px]:gap-6 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <LandingCardSkeleton key={i} fit="places" />
            ))}
          </div>
        ) : publicPlaces.length === 0 ? (
          <p className="text-center text-sm text-white/60">{t("noPublicStories")}</p>
        ) : (
          <PlaceGrid
            places={publicPlaces}
            modelId={modelId}
            frameClass={frameClass}
            mobile={mobile}
            modelNameSize={modelNameSize}
            privateMode={false}
          />
        )}
      </section>

      <section className="mt-4 sm:mt-5" aria-label="Private stories">
        {!ready ? (
          <div className="grid w-full grid-cols-1 gap-5 min-[760px]:grid-cols-2 min-[760px]:gap-6 xl:grid-cols-4">
            <LandingCardSkeleton fit="places" />
          </div>
        ) : privatePlaces.length === 0 ? (
          <p className="text-center text-sm text-white/60">{t("noPrivateStories")}</p>
        ) : (
          <PlaceGrid
            places={privatePlaces}
            modelId={modelId}
            frameClass={frameClass}
            mobile={mobile}
            modelNameSize={modelNameSize}
            privateMode
          />
        )}
      </section>
    </LandingStage>
  );
}
