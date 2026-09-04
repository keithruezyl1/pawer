/**
 * Avatar. One of four mesh gradients, layered radial fills rather than image assets so it stays
 * crisp at any size and adds nothing to the APK.
 *
 * The gradient is picked by HASHING the name rather than by Math.random. "Randomly" assigned is
 * the intent, but a fresh roll on every render would flicker as the component remounts, and the
 * same person would change colour between the onboarding screen and Settings. A hash is
 * random-looking, stable, and needs nothing stored.
 */
import { StyleSheet, View } from "react-native";
import Svg, { Defs, Ellipse, Rect, RadialGradient, Stop } from "react-native-svg";
import { color, layout } from "../theme/tokens";
import { T } from "./Text";

/** Base plus two blooms, which is what gives these the mesh look rather than a plain radial. */
interface Mesh {
  base: string;
  blooms: Array<{ cx: number; cy: number; rx: number; ry: number; color: string; opacity?: number }>;
}

export const AVATAR_MESHES: Mesh[] = [
  // 1 — pink into a yellow core, orange at the edge
  {
    base: "#F4557F",
    blooms: [
      { cx: 0.34, cy: 0.62, rx: 0.72, ry: 0.58, color: "#F0D720" },
      { cx: 0.92, cy: 0.86, rx: 0.55, ry: 0.55, color: "#F98A32", opacity: 0.85 },
    ],
  },
  // 2 — crimson corners, yellow-green centre
  {
    base: "#D81E5B",
    blooms: [
      { cx: 0.42, cy: 0.42, rx: 0.62, ry: 0.62, color: "#E8EE2A" },
      { cx: 0.5, cy: 1.0, rx: 0.9, ry: 0.5, color: "#FA6428", opacity: 0.9 },
    ],
  },
  // 3 — the cool one: cyan against magenta and orange
  {
    base: "#C838C8",
    blooms: [
      { cx: 0.72, cy: 0.3, rx: 0.62, ry: 0.6, color: "#3ED0E8" },
      { cx: 0.06, cy: 0.28, rx: 0.5, ry: 0.5, color: "#E8552A", opacity: 0.92 },
    ],
  },
  // 4 — pink to yellow, orange body
  {
    base: "#F86AA8",
    blooms: [
      { cx: 0.72, cy: 0.1, rx: 0.66, ry: 0.6, color: "#EDEE2C" },
      { cx: 0.55, cy: 0.78, rx: 0.7, ry: 0.62, color: "#F79A16", opacity: 0.95 },
    ],
  },
];

/** Stable, well-spread, and cheap — the same name always lands on the same mesh. */
export function meshFor(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % AVATAR_MESHES.length;
}

export interface AvatarProps {
  /** Whatever identifies this person. An empty seed still gets a stable mesh. */
  seed?: string;
  size?: number;
  /** First letter over the gradient. Omitted when there is no name to show. */
  initial?: string;
}

export function Avatar({ seed = "", size = 48, initial }: AvatarProps) {
  const mesh = AVATAR_MESHES[meshFor(seed)]!;
  const id = `av${meshFor(seed)}`;

  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: layout.radius }]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          {mesh.blooms.map((b, i) => (
            <RadialGradient key={i} id={`${id}b${i}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={b.color} stopOpacity={b.opacity ?? 1} />
              <Stop offset="1" stopColor={b.color} stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>
        <Rect x={0} y={0} width={100} height={100} fill={mesh.base} />
        {mesh.blooms.map((b, i) => (
          <Ellipse
            key={i}
            cx={b.cx * 100}
            cy={b.cy * 100}
            rx={b.rx * 100}
            ry={b.ry * 100}
            fill={`url(#${id}b${i})`}
          />
        ))}
      </Svg>
      {initial ? (
        <View style={styles.letter} pointerEvents="none">
          <T v="headline" style={[styles.letterText, { fontSize: size * 0.42, lineHeight: size * 0.5 }]}>
            {initial.slice(0, 1).toUpperCase()}
          </T>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: "hidden",
    borderWidth: layout.border,
    borderColor: color.ink,
  },
  letter: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  letterText: { color: color.ink },
});
