"use client";

import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { SiteMenu } from "@/components/site-menu";
import {
  SOURCE_ZIP_PASSWORD,
  sourceZipDownloadHrefFrom,
} from "@/content/source-download";
import { useMenuConfig } from "@/lib/menu-config";

export const Route = createFileRoute("/download")({
  component: SourceDownloadPage,
  head: () => ({
    meta: [{ title: "Download Homepage — Moon's AI Travel" }],
  }),
});

function SourceDownloadPage() {
  const router = useRouter();
  const { sourceDownload } = useMenuConfig();
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState("");
  const expected =
    sourceDownload.password.trim() || SOURCE_ZIP_PASSWORD;
  const href =
    sourceZipDownloadHrefFrom(sourceDownload.fileId, sourceDownload.url) ||
    "/M_test001_moonsaitravel.com.zip?v=20260815_0634";

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.history.back();
      return;
    }
    void router.navigate({ to: "/" });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (password === expected) {
      setUnlocked(true);
      setError("");
      setPassword("");
      return;
    }
    setUnlocked(false);
    setError("Incorrect password.");
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg px-4 text-fg">
      <SiteMenu />
      <div className="w-full max-w-[17.5rem] rounded-sm border border-fg/16 bg-bg-elevated/90 px-4 py-4 shadow-[0_10px_28px_rgba(0,0,0,0.28)]">
        <p className="text-center font-display text-[0.82rem] font-semibold tracking-[0.08em]">
          Download Homepage
        </p>

        {!unlocked ? (
          <form onSubmit={onSubmit} className="mt-3 flex flex-col gap-2">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError("");
              }}
              placeholder="Password"
              autoComplete="current-password"
              className="min-h-9 w-full rounded-sm border border-fg/20 bg-bg px-2.5 text-[0.78rem] text-fg outline-none placeholder:text-fg-muted/70 focus-visible:border-fg/45"
            />
            <button
              type="submit"
              className="min-h-9 rounded-sm border border-fg/22 bg-fg/10 text-[0.78rem] font-medium tracking-wide hover:bg-fg/16"
            >
              Confirm
            </button>
            {error ? (
              <p className="text-center text-[0.72rem] text-red-300/90">{error}</p>
            ) : null}
          </form>
        ) : href ? (
          <div className="mt-3 flex flex-col gap-2">
            <a
              href={href}
              download="M_test001_moonsaitravel.com.zip"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setStarted(true)}
              className="inline-flex min-h-9 items-center justify-center rounded-sm bg-fg px-3 text-center text-[0.78rem] font-semibold tracking-wide text-bg hover:bg-fg/90"
            >
              Download Homepage ZIP
            </a>
            {started ? (
              <p className="text-center text-[0.68rem] text-fg-muted">
                Download started.
              </p>
            ) : null}
          </div>
        ) : (
          <p className="mt-3 text-center text-[0.72rem] text-fg-muted">
            Download link is not set yet.
          </p>
        )}

        <div className="mt-3 flex gap-1.5">
          <button
            type="button"
            onClick={goBack}
            className="min-h-8 flex-1 rounded-sm border border-fg/18 text-[0.72rem] text-fg/85 hover:bg-fg/8"
          >
            Back
          </button>
          <Link
            to="/"
            className="inline-flex min-h-8 flex-1 items-center justify-center rounded-sm border border-fg/18 text-[0.72rem] text-fg/85 hover:bg-fg/8"
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
