import type { ReactNode } from "react";
import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { color, layout, space, type } from "../theme/tokens";

export interface FieldProps extends TextInputProps {
  /** Drawn glyph before the input — the magnifier on every search field. */
  leading?: ReactNode;
}

/** Bordered text input. Same 2 dp ink border as everything else; no underline, no focus glow. */
export function Field({ leading, style, ...props }: FieldProps) {
  return (
    <View style={styles.wrap}>
      {leading}
      <TextInput
        placeholderTextColor={color.slate}
        selectionColor={color.accent}
        cursorColor={color.ink}
        {...props}
        style={[styles.input, style]}
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
