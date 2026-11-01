/** Browser SVGs require ARIA; `accessible` is a native-only prop, not a DOM attribute. */
export const decorativeSvgProps = {
  'aria-hidden': true,
  focusable: false,
} as const;
