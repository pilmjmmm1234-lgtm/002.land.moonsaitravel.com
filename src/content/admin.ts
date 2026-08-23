import { IS_MEMBER_TEMPLATE, SETTINGS_STORAGE_KEY } from "@/content/site-profile";

/** Admin PIN — change this one value to set the password. */
export const ADMIN_PIN = "0000";
export const ADMIN_SESSION_KEY = IS_MEMBER_TEMPLATE
  ? "travel-member-admin-unlocked"
  : "mwr-admin-unlocked";
export const MENU_CONFIG_STORAGE_KEY = SETTINGS_STORAGE_KEY;

/** Private window lock — default until changed in admin. */
export const PRIVATE_PIN_DEFAULT = IS_MEMBER_TEMPLATE ? "changeme" : "0000";
export const PRIVATE_PIN_KEY = IS_MEMBER_TEMPLATE
  ? "travel-member-private-pin"
  : "mwr-private-pin";
export const PRIVATE_UNLOCK_KEY = IS_MEMBER_TEMPLATE
  ? "travel-member-private-unlocked"
  : "mwr-private-unlocked";

export function normalizePin(value: string): string {
  return value
    .replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xff10))
    .replace(/\s+/g, "")
    .trim();
}