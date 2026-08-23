"use client";

import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { checkPrivatePin, setPrivateUnlocked } from "@/lib/private-pin";
import { useMenuConfig } from "@/lib/menu-config";
import { useI18n } from "@/lib/i18n";

type Props = {
  destId: string;
  destName: string;
  coverSrc: string | null;
  delayClass?: string;
  storyId?: string;
};

export function ExperiencePrivateWindow({
  destId,
  destName,
  coverSrc,
  storyId,
}: Props) {
  const navigate = useNavigate();
  const { modelNameSize } = useMenuConfig();
  const { t } = useI18n();
  const [pin, setPin] = useState("");

  const goIn = () => {
    setPrivateUnlocked(true);
    setPin("");
    void navigate(
      storyId
        ? {
            to: "/experience/$destination/$story",
            params: { destination: destId, story: storyId },
          }
        : {
            to: "/experience/$destination",
            params: { destination: destId },
          },
    );
  };

  const tryUnlock = (value: string) => {
    if (checkPrivatePin(value)) {
      goIn();
      return;
    }
    void fetch("/api/private-unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: value }),
    })
      .then((res) => {
        if (res.ok) goIn();
      })
      .catch(() => undefined);
  };

  return (
    <article className="lux-card flex h-full min-h-0 w-full min-w-0 flex-col items-center gap-1 rounded-md bg-black/35 p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.42)] max-[768px]:bg-black/45">
      <div className="relative w-full overflow-hidden rounded-[inherit]">
        <div className="relative aspect-[3/4] w-full overflow-hidden">
          {coverSrc ? (
            <img
              src={coverSrc}
              alt=""
              loading="eager"
              decoding="async"
              draggable={false}
              referrerPolicy="no-referrer"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          ) : (
            <div className="absolute inset-0 bg-bg" />
          )}

          <form
            className="absolute inset-0 z-10 flex flex-col items-center justify-end bg-black/25 px-4 pb-8"
            onSubmit={(e) => {
              e.preventDefault();
              tryUnlock(pin);
            }}
          >
            <input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              value={pin}
              onChange={(e) => {
                const next = e.target.value;
                setPin(next);
                if (checkPrivatePin(next)) tryUnlock(next);
              }}
              aria-label={t("passwordHint")}
              className="h-7 w-full max-w-[4.83rem] rounded-full border border-white/25 bg-black/70 px-2.5 text-center text-xs text-white outline-none"
            />
          </form>
        </div>
      </div>
      <div className="flex w-full min-w-0 items-center justify-center rounded-sm border border-fg/12 bg-black/55 px-3 py-2 sm:px-4">
        <span
          className="max-w-full text-center font-medium tracking-normal text-fg/90 uppercase whitespace-nowrap"
          style={{ fontSize: modelNameSize }}
        >
          {destName}
        </span>
      </div>
    </article>
  );
}