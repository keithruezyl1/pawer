/**
 * The icon set (DG §11). Every glyph is drawn here, none from an icon library — one 16 dp grid,
 * 2 dp stroke, square-ish caps, so they read as one family beside the 2 dp borders everywhere
 * else. `Chevron`, `Check` and `Cross` stay in Glyph.tsx: they are built from Views because they
 * predate the SVG dependency and cost nothing.
 *
 * Two of these carry meaning the copy relies on:
 *   Clock  every time value EXCEPT inside a status card, where the time is already the headline
 *   Pin    every geographical value, without exception
 */
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { color } from "../theme/tokens";

export interface IconProps {
  size?: number;
  tone?: string;
}

const S = 2;

function Box({ size = 15, children }: { size?: number; children: React.ReactNode }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      {children}
    </Svg>
  );
}

export function Clock({ size = 15, tone = color.ink }: IconProps) {
  return (
    <Box size={size}>
      <Circle cx={8} cy={8} r={6.4} stroke={tone} strokeWidth={S} />
      <Path d="M8 4.4V8.2l2.6 1.9" stroke={tone} strokeWidth={S} strokeLinecap="round" />
    </Box>
  );
}

/** Taller than wide, so it gets its own viewBox. */
export function Pin({ size = 14, tone = color.ink, filled = false }: IconProps & { filled?: boolean }) {
  return (
    <Svg width={size} height={Math.round((size * 15) / 12)} viewBox="0 0 12 15" fill="none">
      <Path
        d="M6 13.6S10.4 8.4 10.4 5.4A4.4 4.4 0 0 0 1.6 5.4C1.6 8.4 6 13.6 6 13.6Z"
        fill={filled ? tone : "none"}
        stroke={tone}
        strokeWidth={S}
        strokeLinejoin="round"
      />
      <Circle cx={6} cy={5.3} r={1.5} fill={filled ? color.ground : tone} />
    </Svg>
  );
}

export function Magnifier({ size = 15, tone = color.ink }: IconProps) {
  return (
    <Box size={size}>
      <Circle cx={6.6} cy={6.6} r={4.6} stroke={tone} strokeWidth={S} />
      <Path d="M10.3 10.3L14.2 14.2" stroke={tone} strokeWidth={S} strokeLinecap="round" />
    </Box>
  );
}

export function Warn({ size = 15, tone = color.ink }: IconProps) {
  return (
    <Box size={size}>
      <Path d="M8 2.1L14.6 13.6H1.4L8 2.1Z" stroke={tone} strokeWidth={S} strokeLinejoin="round" />
      <Path d="M8 6.4v3.0" stroke={tone} strokeWidth={S} strokeLinecap="round" />
      <Circle cx={8} cy={11.5} r={1} fill={tone} />
    </Box>
  );
}

export function Bell({ size = 15, tone = color.ink }: IconProps) {
  return (
    <Box size={size}>
      <Path d="M4.2 10.9V7.5a3.8 3.8 0 0 1 7.6 0v3.4" stroke={tone} strokeWidth={S} strokeLinejoin="round" />
      <Path d="M2.7 10.9h10.6" stroke={tone} strokeWidth={S} strokeLinecap="round" />
      <Path d="M6.5 13.1a1.7 1.7 0 0 0 3 0" stroke={tone} strokeWidth={S} strokeLinecap="round" />
    </Box>
  );
}

export function Moon({ size = 15, tone = color.ink }: IconProps) {
  return (
    <Box size={size}>
      <Path d="M12.9 10.1A5.5 5.5 0 0 1 6.4 3.2 5.7 5.7 0 1 0 12.9 10.1Z" stroke={tone} strokeWidth={S} strokeLinejoin="round" />
    </Box>
  );
}

export function Bolt({ size = 15, tone = color.ink, slashed = false }: IconProps & { slashed?: boolean }) {
  return (
    <Box size={size}>
      <Path d="M9.4 1.7L3.5 9.1h3.4l-.5 5.3 5.9-7.7H8.8l.6-5Z" stroke={tone} strokeWidth={S} strokeLinejoin="round" />
      {slashed && <Path d="M1.8 1.8l12.4 12.4" stroke={tone} strokeWidth={S} strokeLinecap="round" />}
    </Box>
  );
}

export function Speaker({ size = 15, tone = color.ink }: IconProps) {
  return (
    <Box size={size}>
      <Path d="M8.2 2.7L4.7 5.8H2.1v4.4h2.6l3.5 3.1V2.7Z" stroke={tone} strokeWidth={S} strokeLinejoin="round" />
      <Path d="M10.9 5.7a3.5 3.5 0 0 1 0 4.6" stroke={tone} strokeWidth={S} strokeLinecap="round" />
    </Box>
  );
}

export function Refresh({ size = 15, tone = color.ink }: IconProps) {
  return (
    <Box size={size}>
      <Path d="M13.3 8.2A5.3 5.3 0 1 1 11.3 4" stroke={tone} strokeWidth={S} strokeLinecap="round" />
      <Path d="M13.6 2.3v3.5H10.1" stroke={tone} strokeWidth={S} strokeLinecap="round" strokeLinejoin="round" />
    </Box>
  );
}

export function Info({ size = 15, tone = color.ink }: IconProps) {
  return (
    <Box size={size}>
      <Circle cx={8} cy={8} r={6.2} stroke={tone} strokeWidth={S} />
      <Path d="M8 7.3v4.1" stroke={tone} strokeWidth={S} strokeLinecap="round" />
      <Circle cx={8} cy={4.8} r={1} fill={tone} />
    </Box>
  );
}

/** The "purpose" mark on the detail sheet. */
export function Note({ size = 15, tone = color.ink }: IconProps) {
  return (
    <Box size={size}>
      <Rect x={3.8} y={2.4} width={8.4} height={11.2} stroke={tone} strokeWidth={S} strokeLinejoin="round" />
      <Path d="M6.1 6h3.8M6.1 9.2h3.8" stroke={tone} strokeWidth={S} strokeLinecap="round" />
    </Box>
  );
}

export function Plus({ size = 15, tone = color.ink }: IconProps) {
  return (
    <Box size={size}>
      <Path d="M8 2.8v10.4M2.8 8h10.4" stroke={tone} strokeWidth={2.4} strokeLinecap="round" />
    </Box>
  );
}

export function CheckBadge({ size = 15, tone = color.ink }: IconProps) {
  return (
    <Box size={size}>
      <Circle cx={8} cy={8} r={6.2} stroke={tone} strokeWidth={S} />
      <Path d="M5.1 8.3l2.1 2.1 3.8-4.4" stroke={tone} strokeWidth={S} strokeLinecap="round" strokeLinejoin="round" />
    </Box>
  );
}

export function ExternalLink({ size = 13, tone = color.accent }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <Path d="M3 9L9 3M9 3H4.6M9 3v4.4" stroke={tone} strokeWidth={S} strokeLinecap="square" />
    </Svg>
  );
}

export function CloudOff({ size = 15, tone = color.ink }: IconProps) {
  return (
    <Box size={size}>
      <Path
        d="M4.4 12.2h6.6a3 3 0 0 0 .3-6 4 4 0 0 0-7.3-1.2 3.1 3.1 0 0 0 .4 7.2Z"
        stroke={tone}
        strokeWidth={S}
        strokeLinejoin="round"
      />
      <Path d="M1.8 1.8l12.4 12.4" stroke={tone} strokeWidth={S} strokeLinecap="round" />
    </Box>
  );
}

/** Good news needs a mark that says so. A green disc alone is decoration. */
export function ClearMark({ size = 58 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 58 58" fill="none">
      <Circle cx={29} cy={29} r={26.5} fill={color.status.clear} stroke={color.ink} strokeWidth={2.5} />
      <Path
        d="M17.5 30.5l7.8 7.8L41 20.5"
        stroke={color.ink}
        strokeWidth={3.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * The 2x2 widget. Drawn as four filled squares rather than four outlines, because a 2 dp stroke
 * on a 5 dp box closes up into a blob at this size. The shape is the widget's own footprint.
 */
export function Grid({ size = 15, tone = color.ink }: IconProps) {
  return (
    <Box size={size}>
      <Rect x={2.2} y={2.2} width={5} height={5} rx={1} fill={tone} />
      <Rect x={8.8} y={2.2} width={5} height={5} rx={1} fill={tone} />
      <Rect x={2.2} y={8.8} width={5} height={5} rx={1} fill={tone} />
      <Rect x={8.8} y={8.8} width={5} height={5} rx={1} fill={tone} />
    </Box>
  );
}

/**
 * LinkedIn. The only glyph here drawn as a filled badge rather than a 2 dp outline, because the
 * mark is only recognisable that way — an outlined "in" reads as noise at this size. The letters
 * are knocked out in the ground colour so it still sits on the page like the rest of the set.
 */
export function LinkedIn({ size = 16, tone = color.ink }: IconProps) {
  return (
    <Box size={size}>
      <Rect x={0.5} y={0.5} width={15} height={15} rx={3.4} fill={tone} />
      <Circle cx={4.5} cy={4.7} r={1.3} fill={color.ground} />
      <Path d="M4.5 7.5v4.8" stroke={color.ground} strokeWidth={2.2} strokeLinecap="square" />
      <Path d="M8.1 12.3V7.5" stroke={color.ground} strokeWidth={2.2} strokeLinecap="square" />
      <Path d="M8.1 9.8a2.2 2.2 0 0 1 4.4 0v2.5" stroke={color.ground} strokeWidth={2.2} strokeLinecap="square" />
    </Box>
  );
}
