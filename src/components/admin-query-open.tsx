"use client";

import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

/** `?admin=true` opens the existing admin page. */
export function AdminQueryOpen() {
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      if (q.get("admin") === "true") {
        void navigate({ to: "/admin", replace: true });
      }
    } catch {
      /* ignore */
    }
  }, [navigate]);

  return null;
}