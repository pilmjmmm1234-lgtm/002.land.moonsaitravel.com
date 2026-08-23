import {
  PRIVATE_PIN_DEFAULT,
  PRIVATE_PIN_KEY,
  PRIVATE_UNLOCK_KEY,
  normalizePin,
} from "@/content/admin";

export function getPrivatePin(): string {
  if (typeof window === "undefined") return PRIVATE_PIN_DEFAULT;
  try {
    return window.localStorage.getItem(PRIVATE_PIN_KEY) || PRIVATE_PIN_DEFAULT;
  } catch {
    return PRIVATE_PIN_DEFAULT;
  }
}

export function setPrivatePin(next: string): void {
  window.localStorage.setItem(PRIVATE_PIN_KEY, next);
}

export function isPrivateUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(PRIVATE_UNLOCK_KEY) === "1";
  } catch {
    return false;
  }
}

export function setPrivateUnlocked(on: boolean): void {
  try {
    if (on) window.sessionStorage.setItem(PRIVATE_UNLOCK_KEY, "1");
    else window.sessionStorage.removeItem(PRIVATE_UNLOCK_KEY);
  } catch {
    /* ignore */
  }
}

export function checkPrivatePin(value: string): boolean {
  return normalizePin(value) === normalizePin(getPrivatePin());
}

export function changePrivatePin(
  current: string,
  next: string,
): { ok: true } | { ok: false; error: string } {
  if (!checkPrivatePin(current)) {
    return { ok: false, error: "현재 비밀번호가 올바르지 않습니다." };
  }
  const pin = next.trim();
  if (!pin) {
    return { ok: false, error: "새 비밀번호를 입력하세요." };
  }
  setPrivatePin(pin);
  setPrivateUnlocked(false);
  return { ok: true };
}
