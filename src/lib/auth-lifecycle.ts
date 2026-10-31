const cleanups = new Set<() => void | Promise<void>>();
let epoch = 0;
let pending = false;
let retryAt = 0;

/** One operation across providers; epochs prevent late responses resurrecting logout. */
export const authOperation = {
  acquire() {
    if (pending) return false;
    pending = true;
    return true;
  },
  release(expected = epoch) {
    if (expected === epoch) pending = false;
  },
  epoch: () => epoch,
  current: (expected: number) => expected === epoch,
  retryAt: () => retryAt,
  limit(seconds: number) {
    retryAt = Date.now() + seconds * 1000;
  },
};
export function registerAuthCleanup(cleanup: () => void | Promise<void>) {
  cleanups.add(cleanup);
  return () => {
    cleanups.delete(cleanup);
  };
}
export async function clearAuthFlows() {
  epoch += 1;
  pending = false;
  retryAt = 0;
  await Promise.allSettled([...cleanups].map(async (cleanup) => cleanup()));
}
