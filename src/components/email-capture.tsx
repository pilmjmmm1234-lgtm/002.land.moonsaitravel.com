"use client";

import { useState } from "react";

type EmailCaptureProps = {
  destinations: { id: string; name: string }[];
  compact?: boolean;
};

const COPY = {
  title: "더 많은 여행 이미지와 여행 정보를 받아보세요.",
  body: "이메일을 남겨주시면 관련 안내를 보내드립니다.",
  email: "이메일 주소",
  dest: "관심 여행지",
  destAny: "아직 정하지 않음",
  submit: "정보 받아보기",
  sending: "보내는 중…",
  done: "남겨 주셔서 감사합니다. 안내가 준비되면 연락드리겠습니다.",
  invalid: "올바른 이메일 주소를 입력해 주세요.",
} as const;

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function EmailCapture({ destinations, compact = false }: EmailCaptureProps) {
  const [email, setEmail] = useState("");
  const [destination, setDestination] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validEmail(email)) {
      setStatus("error");
      setMessage(COPY.invalid);
      return;
    }
    setStatus("sending");
    setMessage("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          destination: destination.trim() || "",
        }),
      });
      if (!res.ok) throw new Error("lead");
      try {
        const prev = JSON.parse(localStorage.getItem("moons-leads") || "[]");
        localStorage.setItem(
          "moons-leads",
          JSON.stringify([
            ...(Array.isArray(prev) ? prev : []),
            {
              email: email.trim(),
              destination,
              at: new Date().toISOString(),
            },
          ]),
        );
      } catch {
        /* ignore */
      }
      setStatus("done");
      setMessage(COPY.done);
      setEmail("");
      setDestination("");
    } catch {
      setStatus("error");
      setMessage("잠시 후 다시 시도해 주세요.");
    }
  };

  return (
    <section
      aria-labelledby="email-capture-title"
      className={`mx-auto w-full max-w-xl ${compact ? "py-8" : "py-12 sm:py-16"}`}
    >
      <h2
        id="email-capture-title"
        className="text-center font-display text-base font-medium tracking-wide text-fg/90 sm:text-lg"
      >
        {COPY.title}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-center text-sm leading-relaxed text-fg-muted">
        {COPY.body}
      </p>

      {status === "done" ? (
        <p className="mt-6 text-center text-sm text-fg/85">{message}</p>
      ) : (
        <form
          onSubmit={(e) => void onSubmit(e)}
          className="mt-6 flex flex-col gap-3"
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.7rem] tracking-[0.14em] text-fg-muted uppercase">
              {COPY.email}
            </span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="min-h-11 rounded-sm border border-fg/18 bg-bg/50 px-3 text-sm text-fg outline-none placeholder:text-fg/35 focus-visible:border-fg/40"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.7rem] tracking-[0.14em] text-fg-muted uppercase">
              {COPY.dest}
            </span>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="min-h-11 rounded-sm border border-fg/18 bg-bg/50 px-3 text-sm text-fg outline-none focus-visible:border-fg/40"
            >
              <option value="">{COPY.destAny}</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.name || d.id}>
                  {d.name || d.id}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={status === "sending"}
            className="mt-1 min-h-11 rounded-sm bg-fg px-4 text-sm font-medium tracking-wide text-bg transition-opacity duration-(--motion-fast) hover:opacity-90 disabled:opacity-50"
          >
            {status === "sending" ? COPY.sending : COPY.submit}
          </button>
          {status === "error" && message ? (
            <p className="text-center text-xs text-fg/70">{message}</p>
          ) : null}
        </form>
      )}
    </section>
  );
}
