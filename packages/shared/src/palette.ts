/** DESIGN-GUIDELINES v2 §4 — the single source of colour truth for app, widget, and contrast script. */
export const tokens = {
  ground: "#F5F5F5",
  surface2: "#D6D7D7",
  slate: "#4F5D75",
  ink: "#212431",
  accent: "#EA5C1F",
  status: {
    clear: "#9BF06B",
    upcoming: "#FF90E8",
    ongoing: "#FF5C5C",
    ended: "#FFD93D",
  },
  /**
   * Card fills. Each status hue at 32% over ground, precomputed so nothing blends at runtime.
   * The SATURATED four above mean status and nothing else; a card may never wear one, or a
   * pastel list would start competing with the hero for the same glance (DG §4).
   */
  tint: {
    clear: "#D8F3C9",
    upcoming: "#F8D5F1",
    ended: "#F8ECBA",
  },
} as const;

export type StatusFill = keyof typeof tokens.status;
