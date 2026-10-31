# Brand assets

The real Epsilon logo has not been supplied. Welcome uses the localized Epsilon
wordmark until the approved mark is available; the brand blue remains provisional.

`google-g.svg` wraps the unmodified Google-provided PNG in an SVG image so the
current gradient G renders consistently through react-native-svg, without
unsupported SVG conic gradients/foreignObject. `google-g.ts` is the same SVG
serialized for Metro (no SVG transformer dependency). No network image request.

Source: https://developers.google.com/static/identity/images/g-logo.png
Usage: https://developers.google.com/identity/branding-guidelines
Google brand assets remain Google's trademarks and are used only in its sign-in
button under those guidelines. They are not Epsilon branding or licensed as
Epsilon source code. Native Google authentication is feature-gated and uses the
original Google sign-in SDK; its ID token is exchanged only with the backend.
