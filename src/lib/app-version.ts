const versionPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([\da-zA-Z-]+(?:\.[\da-zA-Z-]+)*))?(?:\+[\da-zA-Z-]+(?:\.[\da-zA-Z-]+)*)?$/;
function parse(value: string) {
  const match = versionPattern.exec(value);
  if (!match) return null;
  const core = [Number(match[1]), Number(match[2]), Number(match[3])];
  const pre = match[4]?.split('.');
  if (
    !core.every(Number.isSafeInteger) ||
    pre?.some(
      (part) =>
        /^\d+$/.test(part) &&
        ((part.length > 1 && part.startsWith('0')) ||
          !Number.isSafeInteger(Number(part))),
    )
  )
    return null;
  return { core, pre };
}
export const isAppVersion = (value: string) => parse(value) !== null;
export function requiresAppUpdate(current: string, minimum: string) {
  const a = parse(current);
  const b = parse(minimum);
  if (!a || !b) return true;
  for (let index = 0; index < 3; index++) {
    const difference = a.core[index]! - b.core[index]!;
    if (difference) return difference < 0;
  }
  if (!a.pre || !b.pre) return Boolean(a.pre && !b.pre);
  for (let index = 0; index < Math.max(a.pre.length, b.pre.length); index++) {
    const left = a.pre[index];
    const right = b.pre[index];
    if (left === right) continue;
    if (left === undefined) return true;
    if (right === undefined) return false;
    const numericLeft = /^\d+$/.test(left);
    const numericRight = /^\d+$/.test(right);
    if (numericLeft && numericRight) return Number(left) < Number(right);
    if (numericLeft !== numericRight) return numericLeft;
    return left < right;
  }
  return false;
}
