/** Native SVGs are excluded from the accessibility tree by their labelled parent. */
export const decorativeSvgProps = {
  accessible: false,
  focusable: false,
} as const;
