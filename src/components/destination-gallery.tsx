"use client";

import { useCallback, useEffect, useState } from "react";
import { SiteMenu } from "@/components/site-menu";
import { StorySlideshow } from "@/components/story-slideshow";
import { TRAVEL_EXPERIENCE_REFRESH_MS } from "@/content/travel-experience";
import { fetchTravelExperienceDestinationsCached } from "@/lib/travel-experience-cache";
import { destMatches } from "@/lib/dest-names";
import { driveImageProxy } from "@/lib/image-proxy";
import { useMenuConfig } from "@/lib/menu-config";
import { PrivateDestinationGate } from "@/lib/private-dest";

type DestPayload = {
  id: string;
  name: string;
  coverSrc?: string | null;
  stories: {
    id: string;
    name: string;
    coverSrc?: string | null;
    thumbnail: { url?: string; name?: string } | null;
    images: { url?: string; name?: string }[];
  }[];
};

function isCoverName(name?: string): boolean {
  const n = (name ?? "").trim().toLowerCase();
  return n.startsWith("cover.");
}

function flattenImages(dest: DestPayload): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();
  const push = (raw?: string) => {
    const url = raw?.trim();
    if (!url || seen.has(url)) return;
    seen.add(url);
    urls.push(driveImageProxy(url, "story"));
  };
  for (const story of dest.stories ?? []) {
    for (const img of story.images ?? []) {
      if (!isCoverName(img.name)) push(img.url);
    }
    if (story.thumbnail?.url && !isCoverName(story.thumbnail.name)) {
      push(story.thumbnail.url);
    }
  }
  if (urls.length === 0 && dest.coverSrc) urls.push(dest.coverSrc);
  return urls;
}

export function DestinationGallery({ destinationId }: { destinationId: string }) {
  const { destGallery } = useMenuConfig();
  const [name, setName] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [missing, setMissing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = (await fetchTravelExperienceDestinationsCached({
        folder: destGallery.rootFolderUrl,
        cover: destGallery.coverFileName,
      })) as { destinations?: DestPayload[] };
      const list = data.destinations ?? [];
      const dest = list.find((d) => destMatches(d, destinationId));
      if (!dest) {
        setMissing(true);
        setImages([]);
        setName("");
        return;
      }
      setMissing(false);
      setName(dest.name);
      setImages(flattenImages(dest));
    } catch {
      /* keep last */
    } finally {
      setReady(true);
    }
  }, [destinationId, destGallery.rootFolderUrl, destGallery.coverFileName]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), TRAVEL_EXPERIENCE_REFRESH_MS);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (!name) return;
    document.title = `${name} — Moon's AI Travel`;
  }, [name]);

  return (
    <PrivateDestinationGate id={destinationId} name={name}>
      <div className="min-h-dvh bg-black text-fg">
        <SiteMenu variant="landing" />
        {!ready ? (
          <p className="flex min-h-dvh items-center justify-center text-sm text-fg-muted">
            Loading…
          </p>
        ) : missing ? (
          <p className="flex min-h-dvh items-center justify-center text-sm text-fg-muted">
            Destination not found.
          </p>
        ) : (
          <StorySlideshow
            storyName={name}
            images={images}
            backTo={{ to: "/" }}
          />
        )}
      </div>
    </PrivateDestinationGate>
  );
}
