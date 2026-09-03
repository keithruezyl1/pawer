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
} as const;

export type StatusFill = keyof typeof tokens.status;
