let anchor: { server: number; monotonic: number } | null = null;
export const monotonicNow = () => performance.now();
/** HTTP Date provides a display/validation clock; backend checks remain authoritative. */
export function observeServerDate(value: string | null) {
  if (!value) return;
  const time = Date.parse(value);
  if (Number.isFinite(time))
    anchor = { server: time, monotonic: monotonicNow() };
}
export function trustedServerTime() {
  return anchor
    ? anchor.server + Math.max(0, monotonicNow() - anchor.monotonic)
    : null;
}
export function serverNow() {
  return new Date(trustedServerTime() ?? Date.now());
}
export function resetServerClockForTesting() {
  anchor = null;
}
