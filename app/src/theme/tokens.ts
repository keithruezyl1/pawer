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
  /** Decorative card fills. Never a saturated status hue — see palette.ts. */
  tint: palette.tint,
  /** The checkerboard ground: ink at 4.5%, drawn as 12 dp squares. */
  checker: "rgba(33, 36, 49, 0.045)",
  /** §4.3 notice: slate at 15% over ground. Precomputed so no runtime alpha blending. */
  noticeFill: "#DDE0E6",
} as const;

/**
 * §3 — sizes in sp via RN's default font scaling.
 *
 * Weight is carried by the FAMILY, never by `fontWeight`: React Native does not synthesize
 * weights for custom fonts, and asking Android for one it has no file for silently drops back
 * to the system face. One file per weight, named for it, referenced explicitly.
 *
 * Getai Grotesk Display Black is a 135-glyph display cut with no · › ✓ ✗, so it carries only
 * the two largest sizes and the logo. Everything smaller is Aspekta, which has the punctuation.
 */
export const font = {
  display: "Getai-Black",
  title: "Getai-Black",
  headline: "Aspekta-700",
  body: "Aspekta-400",
  label: "Aspekta-500",
  caption: "Aspekta-400",
} as const;

export const type = {
  display: { fontFamily: font.display, fontSize: 40, lineHeight: 42, letterSpacing: -0.8 },
  title: { fontFamily: font.title, fontSize: 24, lineHeight: 28, letterSpacing: -0.4 },
  headline: { fontFamily: font.headline, fontSize: 18, lineHeight: 23 },
  body: { fontFamily: font.body, fontSize: 15, lineHeight: 21 },
  label: { fontFamily: font.label, fontSize: 13, lineHeight: 17 },
  caption: { fontFamily: font.caption, fontSize: 11, lineHeight: 14 },
} as const;

/** §5 — neobrutalist structure. */
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const layout = {
  screenMargin: 20,
  cardPadding: 24,
  cardGap: 12,
  border: 2,
  shadow: 4,
  radius: 5,
  touchTarget: 48,
  /** One checkerboard square. Two of these make the repeating tile. */
  checkerSquare: 12,
} as const;

/**
 * §11 — every duration in the vocabulary, in ms. Nothing exceeds 240.
 * `slide` (screen transitions) is not here: it is the native stack animation, so the platform
 * owns its timing and its decelerate curve. See DG §11.
 */
export const duration = {
  stamp: 160,
  slam: 150,
  press: 80,
  tear: 180,
  tick: 120,
  bump: 32,
  judder: 240,
} as const;
