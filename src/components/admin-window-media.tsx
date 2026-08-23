"use client";

import { useEffect, useState } from "react";
import { PAGE4_WINDOW_IDS, type Page4WindowId } from "@/content/04_Page/windows";
import {
  clearWindowOverride,
  drivePreviewUrl,
  loadWindowMediaMeta,
  saveWindowDriveUrl,
  saveWindowUpload,
  type WindowMediaMeta,
} from "@/lib/window-overrides";

const LABELS: Record<Page4WindowId, string> = {
  Window_Main: "큰 창 (Window_Main)",
  Window_01: "작은 창 1 — 여행비 절약",
  Window_02: "작은 창 2 — 여행하며 수익",
  Window_03: "작은 창 3 — 비즈니스 기회",
};

export function AdminWindowMedia() {
  const [meta, setMeta] = useState<Record<string, WindowMediaMeta>>({});
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");

  useEffect(() => {
    setMeta(loadWindowMediaMeta());
  }, []);

  const refresh = () => setMeta(loadWindowMediaMeta());

  return (
    <section>
      <h2 className="text-xs font-medium tracking-[0.16em] text-fg-subtle uppercase">
        4페이지 창 이미지
      </h2>
      <p className="mt-1 text-xs text-fg-muted">
        이미지를 올리거나 Google Drive 파일 링크를 저장합니다. 비우면 기존 Drive /
        Apps Script 콘텐츠가 다시 보입니다. 창 크기와 위치는 바뀌지 않습니다.
      </p>
      <div className="mt-4 flex flex-col gap-4">
        {PAGE4_WINDOW_IDS.map((id) => {
          const info = meta[id];
          return (
            <fieldset
              key={id}
              className="rounded-md border border-fg/12 bg-bg-elevated/50 p-4"
            >
              <legend className="px-1 text-[0.7rem] tracking-wide text-fg-subtle">
                {LABELS[id]}
              </legend>
              <p className="mb-2 text-[0.7rem] text-fg-muted">
                {info?.kind === "upload"
                  ? `저장됨: 업로드 (${info.name ?? "image"})`
                  : info?.kind === "drive"
                    ? `저장됨: Drive 링크`
                    : "기본 콘텐츠 사용 중"}
              </p>
              <label className="block text-[0.7rem] tracking-wide text-fg-muted">
                파일 업로드
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="mt-1 block w-full text-xs text-fg"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file) return;
                    await saveWindowUpload(id, file);
                    refresh();
                    setNote(`${LABELS[id]} 이미지를 저장했습니다.`);
                  }}
                />
              </label>
              <label className="mt-3 block text-[0.7rem] tracking-wide text-fg-muted">
                Google Drive 링크
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/d/..."
                  value={draft[id] ?? info?.driveUrl ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, [id]: e.target.value }))
                  }
                  className="mt-1 w-full rounded-sm border border-fg/15 bg-bg px-3 py-2 text-sm text-fg outline-none focus:border-fg/35"
                />
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const url = (draft[id] ?? info?.driveUrl ?? "").trim();
                    if (!url) {
                      setNote("Drive 링크를 입력하세요.");
                      return;
                    }
                    saveWindowDriveUrl(id, url);
                    refresh();
                    setNote(`${LABELS[id]} Drive 링크를 저장했습니다.`);
                  }}
                  className="min-h-9 rounded-sm border border-fg/20 bg-fg/10 px-3 text-xs text-fg hover:bg-fg/16"
                >
                  링크 저장
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await clearWindowOverride(id);
                    setDraft((d) => ({ ...d, [id]: "" }));
                    refresh();
                    setNote(`${LABELS[id]}을(를) 기본값으로 되돌렸습니다.`);
                  }}
                  className="min-h-9 px-2 text-xs text-fg-muted hover:text-fg"
                >
                  기본값
                </button>
              </div>
              {(draft[id] || info?.driveUrl) && info?.kind === "drive" ? (
                <p className="mt-2 truncate text-[0.65rem] text-fg-subtle">
                  미리보기: {drivePreviewUrl(info.driveUrl ?? "")}
                </p>
              ) : null}
            </fieldset>
          );
        })}
      </div>
      {note ? <p className="mt-3 text-xs text-fg-muted">{note}</p> : null}
    </section>
  );
}
