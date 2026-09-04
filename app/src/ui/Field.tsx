import type { ReactNode } from "react";
import {
  StyleSheet, TextInput, View,
  type StyleProp, type TextInputProps, type TextStyle, type ViewStyle,
} from "react-native";
import { color, layout, space, type } from "../theme/tokens";

export interface FieldProps extends Omit<TextInputProps, "style"> {
  /** Drawn glyph before the input — the magnifier on every search field. */
  leading?: ReactNode;
  /**
   * Applies to the BORDERED BOX, not the text. Callers lay this out beside an avatar and pass
   * `flex: 1` to make it take the rest of the row; landing that on the inner input instead left
   * the box sizing to its own content and running off the screen edge.
   */
  style?: StyleProp<ViewStyle>;
  /** The text itself, for the rare case it needs its own treatment. */
  inputStyle?: StyleProp<TextStyle>;
}

/** Bordered text input. Same 2 dp ink border as everything else; no underline, no focus glow. */
export function Field({ leading, style, inputStyle, ...props }: FieldProps) {
  return (
    <View style={[styles.wrap, style]}>
      {leading}
      <TextInput
        placeholderTextColor={color.slate}
        selectionColor={color.accent}
        cursorColor={color.ink}
        {...props}
        style={[styles.input, inputStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm + 2,
    backgroundColor: color.ground,
    borderWidth: layout.border,
    borderColor: color.ink,
    borderRadius: layout.radius,
    paddingHorizontal: space.lg,
    minHeight: layout.touchTarget,
  },
  input: {
    ...type.body,
    flex: 1,
    color: color.ink,
    paddingVertical: space.md,
  },
});
