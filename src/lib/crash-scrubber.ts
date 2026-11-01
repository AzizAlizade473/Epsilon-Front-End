export type CrashMetadata = {
  release: string;
  dist: string;
  environment: string;
  appVersion: string;
};
function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};
}
function bundleFilename(value: unknown) {
  if (typeof value !== 'string') return null;
  const name = value.split(/[?#]/)[0]?.split(/[\\/]/).at(-1);
  return name &&
    /^(?:index\.android\.bundle|main\.jsbundle|index\.bundle|entry-[\da-f]{32}\.hbc)$/.test(
      name,
    )
    ? `app:///${name}`
    : null;
}
/** Allowlist, not a redaction blacklist: arbitrary text, payloads and breadcrumbs never leave the app. */
export function scrubCrashEvent(input: unknown, metadata: CrashMetadata) {
  const source = record(input);
  const exception = record(source.exception);
  const values = Array.isArray(exception.values)
    ? exception.values.slice(0, 3)
    : [];
  const safeValues = values.map((value) => {
    const item = record(value);
    const stack = record(item.stacktrace);
    const frames = (Array.isArray(stack.frames) ? stack.frames : [])
      .flatMap((frame: unknown) => {
        const value = record(frame);
        const filename = bundleFilename(value.filename);
        if (!filename) return [];
        return [
          {
            filename,
            ...(Number.isSafeInteger(value.lineno) && Number(value.lineno) > 0
              ? { lineno: Number(value.lineno) }
              : {}),
            ...(Number.isSafeInteger(value.colno) && Number(value.colno) >= 0
              ? { colno: Number(value.colno) }
              : {}),
          },
        ];
      })
      .slice(-100);
    const type =
      typeof item.type === 'string' &&
      [
        'Error',
        'TypeError',
        'RangeError',
        'SyntaxError',
        'ReferenceError',
        'InvariantViolation',
      ].includes(item.type)
        ? item.type
        : 'Error';
    return {
      type,
      value: 'Application error',
      ...(frames.length ? { stacktrace: { frames } } : {}),
    };
  });
  const images = record(source.debug_meta).images;
  const safeImages = (Array.isArray(images) ? images : []).flatMap(
    (image: unknown) => {
      const value = record(image);
      return value.type === 'sourcemap' &&
        bundleFilename(value.code_file) &&
        typeof value.debug_id === 'string' &&
        /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(value.debug_id)
        ? [
            {
              type: 'sourcemap' as const,
              code_file: bundleFilename(value.code_file)!,
              debug_id: value.debug_id,
            },
          ]
        : [];
    },
  );
  return {
    type: undefined,
    level: 'error' as const,
    release: metadata.release,
    dist: metadata.dist,
    environment: metadata.environment,
    tags: { app_version: metadata.appVersion },
    ...(typeof source.event_id === 'string' &&
    /^[\da-f]{32}$/i.test(source.event_id)
      ? { event_id: source.event_id }
      : {}),
    exception: {
      values: safeValues.length
        ? safeValues
        : [{ type: 'Error', value: 'Application error' }],
    },
    ...(safeImages.length ? { debug_meta: { images: safeImages } } : {}),
  };
}
