let reporter: ((error: unknown) => void) | null = null;
export function setErrorReporter(next: typeof reporter) {
  reporter = next;
}
/** No console logging, cached errors or payloads. The consent-gated sender owns scrubbing. */
export function reportApplicationError(error: unknown) {
  try {
    reporter?.(error);
  } catch {
    /* Reporting must never cause a second crash. */
  }
}
