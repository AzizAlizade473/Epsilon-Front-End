/** Web uses the DOM ref directly; native numeric handles do not exist here. */
export function focusAccessible(target: { focus?: () => void } | null) {
  target?.focus?.();
}
