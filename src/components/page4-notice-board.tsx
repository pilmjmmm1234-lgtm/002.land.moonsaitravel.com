"use client";

import { useMenuConfig } from "@/lib/menu-config";
import { fitTypeSize, useIsMobile } from "@/lib/use-is-mobile";

function splitPosts(body: string, posts: string[]): string[] {
  if (posts.length) return posts.map((s) => s.trim()).filter(Boolean);
  return body
    .split(/\n\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Page 4 right panel — bulletin board. Text is edited in admin only.
 */
export function Page4NoticeBoard() {
  const { page4GuideTitle, page4GuideBody, page4GuidePosts, page4GuideSize } =
    useMenuConfig();
  const mobile = useIsMobile();
  const posts = splitPosts(page4GuideBody, page4GuidePosts);
  const textPx = fitTypeSize(page4GuideSize ?? 16, mobile, 16);
  const title = page4GuideTitle.trim();

  return (
    <aside className="flex h-full min-h-0 min-w-0 w-full flex-col">
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[linear-gradient(180deg,rgba(18,16,14,0.92),rgba(8,8,10,0.94))]">
        {title ? (
          <header className="shrink-0 px-4 py-2 sm:px-5">
            <h2 className="truncate font-display text-sm font-medium tracking-wide text-fg/80">
              {title}
            </h2>
          </header>
        ) : null}
        <ol className="flex min-h-0 h-full flex-1 flex-col gap-3 overflow-y-auto p-3 sm:p-4">
          {posts.map((post, i) => (
            <li
              key={i}
              className="flex min-h-0 flex-1 flex-col justify-center rounded-sm bg-black/30 px-5 py-5 sm:px-7 sm:py-6"
            >
              <p
                className="leading-[1.8] text-fg/90 sm:leading-[1.85]"
                style={{ fontSize: `${textPx}px` }}
              >
                {post}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </aside>
  );
}
