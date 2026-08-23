/**
 * Soft in-app loading surface — uses brand bg, never pure black void.
 */
export function PageLoading({ label }: { label?: string }) {
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-4 bg-bg text-fg">
      <p className="text-sm font-medium tracking-[0.16em] text-fg/75">
        Moon's AI Travel
      </p>
      <div
        className="h-7 w-7 rounded-full border border-fg/15 border-t-fg/50 animate-spin"
        aria-hidden="true"
      />
      <p className="text-xs tracking-wide text-fg-muted">{label || "Loading"}</p>
    </div>
  );
}