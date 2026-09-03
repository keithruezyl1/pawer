import { Text as RNText, type TextProps } from "react-native";
import { color, type } from "../theme/tokens";

type Variant = keyof typeof type;

export interface TProps extends TextProps {
  v?: Variant;
  muted?: boolean;
  /** Override ink for text sitting on a status fill (always ink) or on accent (large only). */
  tone?: "ink" | "muted" | "ground";
}

/** The only Text in the app. Variant + tone; no ad-hoc font sizes anywhere else (DG §3). */
export function T({ v = "body", muted, tone, style, ...rest }: TProps) {
  const c = tone === "ground" ? color.ground : tone === "muted" || muted ? color.slate : color.ink;
  return <RNText allowFontScaling {...rest} style={[type[v], { color: c }, style]} />;
}
