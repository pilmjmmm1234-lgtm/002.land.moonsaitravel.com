"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Lock } from "lucide-react";
import {
  checkPrivatePin,
  isPrivateUnlocked,
  setPrivateUnlocked,
} from "@/lib/private-pin";

export function isPrivateDestination(id: string, name?: string): boolean {
  const blob = `${id} ${name ?? ""}`.toLowerCase();
  return blob.includes("private");
}

export function PrivateDestinationGate({
  id,
  name,
  children,
}: {
  id: string;
  name?: string;
  children: ReactNode;
}) {
  const locked = isPrivateDestination(id, name);
  const [open, setOpen] = useState(() => !locked || isPrivateUnlocked());
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (locked && isPrivateUnlocked()) setOpen(true);
  }, [locked]);

  if (!locked || open) return children;

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-5 py-16">
      <Lock color="#fff" size={36} strokeWidth={1.6} />
      <p className="mt-3 text-sm font-semibold tracking-[0.18em] text-white">
        PRIVATE
      </p>
      <form
        className="mt-4 flex w-full max-w-[15rem] flex-col gap-2.5"
        onSubmit={(e) => {
          e.preventDefault();
          if (checkPrivatePin(pin)) {
            setPrivateUnlocked(true);
            setOpen(true);
            return;
          }
          setError("비밀번호가 올바르지 않습니다.");
        }}
      >
        <input
          type="password"
          inputMode="numeric"
          autoComplete="off"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="비밀번호"
          className="w-full px-3 py-2.5 text-center text-white"
          style={{
            background: "#111",
            border: "1px solid #ddd",
            borderRadius: 6,
          }}
        />
        <button
          type="submit"
          className="min-h-11 w-full text-sm font-semibold text-black"
          style={{ background: "#f3f3f3", borderRadius: 6 }}
        >
          열기
        </button>
        {error ? <p className="text-center text-xs text-white">{error}</p> : null}
      </form>
    </div>
  );
}
