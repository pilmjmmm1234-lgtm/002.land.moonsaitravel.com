const KEY = "travel-model-label:";

export function rememberModelLabel(id: string, name: string): void {
  try {
    window.sessionStorage.setItem(`${KEY}${id}`, name);
  } catch {
    /* ignore */
  }
}

export function recalledModelLabel(id: string): string {
  try {
    return window.sessionStorage.getItem(`${KEY}${id}`) || "";
  } catch {
    return "";
  }
}