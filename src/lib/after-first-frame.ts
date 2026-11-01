/** Two frame boundaries plus a task prevent SDK work running inside the first paint. */
export function afterFirstFrame(task: () => void) {
  let second: number | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const first = requestAnimationFrame(() => {
    second = requestAnimationFrame(() => {
      timer = setTimeout(task, 0);
    });
  });
  return () => {
    cancelAnimationFrame(first);
    if (second !== undefined) cancelAnimationFrame(second);
    if (timer !== undefined) clearTimeout(timer);
  };
}
