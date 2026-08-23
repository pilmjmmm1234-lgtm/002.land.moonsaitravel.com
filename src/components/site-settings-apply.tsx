"use client";

import { useEffect } from "react";
import { useMenuConfig } from "@/lib/menu-config";
import { setPrivatePin } from "@/lib/private-pin";

export function SiteSettingsApply() {
  const cfg = useMenuConfig();

  useEffect(() => {
    const title = cfg.siteTitle.trim();
    if (title) document.title = title;
    const accent = cfg.themeAccent.trim() || "#e8d5a3";
    document.documentElement.style.setProperty("--site-accent", accent);
    if (cfg.privatePassword.trim()) {
      try {
        setPrivatePin(cfg.privatePassword.trim());
      } catch {
        /* ignore */
      }
    }
  }, [cfg.siteTitle, cfg.themeAccent, cfg.privatePassword]);

  return null;
}