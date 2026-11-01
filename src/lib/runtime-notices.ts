const expiryListeners = new Set<() => void>();
export function onSessionExpired(listener: () => void) {
  expiryListeners.add(listener);
  return () => {
    expiryListeners.delete(listener);
  };
}
export function notifySessionExpired() {
  expiryListeners.forEach((listener) => listener());
}
