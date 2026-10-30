## STEP 01 — Design system and primitives  (branch `step/01-design-system`)

**Goal:** every screen later looks like one polished product. No screens.

**Tokens** (`src/design`, the only place values live): colors — brand.primary `#2563EB` (placeholder, TODO exact logo color), primaryPressed `#1D4ED8`, tint `#EFF6FF`, border `#BFDBFE`; ink `#0F172A`, inkSecondary `#64748B`, inkMuted `#94A3B8`, background `#F7F8FA`, surface `#FFFFFF`, border `#E2E8F0`, divider `#F1F5F9`, success `#16A34A`/tint `#ECFDF5`, warning `#D97706`/tint `#FFF7ED`, danger `#DC2626`/tint `#FEE2E2`, overlay `rgba(15,23,42,0.5)`, scanDim `rgba(0,0,0,0.6)`. Spacing 4/8/12/16/20/24/32/48 (screen margin 20). Radius 12/16/20/24/pill. Typography uses the **platform system font** (Roboto on Android): display 56/60 bold tracking −1.5; title1 32/38; title2 24/30; headline 17/22 semibold; body 16/22; callout 15/20 medium; caption 13/18 medium; tab 11/14 (tab labels only). No other size below 13. No shadows (borders are hairline). Motion: durations 120/200/320 ms; out-cubic; spring {damping 20, stiffness 260, mass 1}; press scale 0.97; list stagger 40 ms (max 8). A `useMotion()` hook returns instant values when Reduce Motion is on.

**Primitives** (`src/components/ui`, each with a small test and accessibility props): Text, Screen (safe-area, collapsing large title), Header, Button (primary pill 56 pt / secondary tint / ghost / destructive; loading keeps width; press scale + haptic; Android ripple), IconButton (44 pt), Icon (Lucide only, stroke 2), ListRow (40 pt leading circle icon, title, subtitle, trailing value/chevron, inset hairline), Card, Chip, Switch, Input (56 pt, label above, error below), SegmentedControl, Amount (qəpik → "12.50 ₼", ₼ at 60% size, optional count-up), Skeleton (flat opacity pulse 0.5↔1 over 900 ms, no blur/shimmer image), EmptyState, ErrorState, Toast, plus `__DEV__` route `_design-gallery`.

Platform rules: Android ripple + press scale; no Android elevation shadows; content max width 480 centered; design at 360 dp first; status bar icons dark.

**Micro-steps:** 01.a tokens + theme + typography + motion · 01.b Text, Icon, Screen, Header · 01.c Button, IconButton (+ tests) · 01.d ListRow, Card, Chip, Switch, SegmentedControl · 01.e Input (+ tests) · 01.f Amount (+ money tests later in STEP 04) · 01.g Skeleton, EmptyState, ErrorState, Toast · 01.h dev gallery route · 01.i `docs/DESIGN_SYSTEM.md`.

**MANUAL CHECK:** open the gallery on your phone at normal and large font scale: nothing clipped, 60 fps scrolling.

---
