/**
 * DESIGN-GUIDELINES v2 — tokens. Colours come from @pawer/shared so the widget, the contrast
 * script, and the app can never disagree. Everything here is a number or a string; no styles.
 */
import { tokens as palette } from "@pawer/shared";

export const color = {
  ground: palette.ground,
  surface2: palette.surface2,
  slate: palette.slate,
  ink: palette.ink,
  accent: palette.accent,
  status: palette.status,
  /** §4.3 notice: slate at 15% over ground. Precomputed so no runtime alpha blending. */
  noticeFill: "#DDE0E6",
} as const;

/** §3 — sizes in sp via RN's default font scaling; weights as RN strings. */
export const type = {
  display: { fontSize: 40, fontWeight: "700" as const, lineHeight: 42 },
  title: { fontSize: 24, fontWeight: "800" as const, lineHeight: 28 },
  headline: { fontSize: 18, fontWeight: "600" as const, lineHeight: 23 },
  body: { fontSize: 15, fontWeight: "400" as const, lineHeight: 21 },
  label: { fontSize: 13, fontWeight: "500" as const, lineHeight: 17 },
  caption: { fontSize: 11, fontWeight: "400" as const, lineHeight: 14 },
} as const;

/** §5 — neobrutalist structure. */
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const layout = {
  screenMargin: 20,
  cardPadding: 24,
  cardGap: 12,
  border: 2,
  shadow: 4,
  radius: 2,
  touchTarget: 48,
} as const;

/** §11 — every duration in the vocabulary, in ms. Nothing exceeds 240. */
export const duration = {
  stamp: 160,
  slam: 150,
  press: 80,
  tear: 180,
  tick: 120,
  bump: 32,
  judder: 240,
  wipe: 200,
} as const;
