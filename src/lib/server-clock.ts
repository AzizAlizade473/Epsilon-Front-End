let offset = 0;
/** HTTP Date provides a display/validation clock; backend checks remain authoritative. */
export function observeServerDate(value: string | null) {
  if (!value) return;
  const time = Date.parse(value);
  if (Number.isFinite(time)) offset = time - Date.now();
}
export function serverNow() {
  return new Date(Date.now() + offset);
}
