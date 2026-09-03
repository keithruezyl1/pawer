import { StyleSheet, TextInput, type TextInputProps } from "react-native";
import { color, layout, space, type } from "../theme/tokens";

/** Bordered text input. Same 2 dp ink border as everything else; no underline, no focus glow. */
export function Field(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={color.slate}
      selectionColor={color.accent}
      cursorColor={color.ink}
      {...props}
      style={[styles.input, props.style]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    ...type.body,
    color: color.ink,
    backgroundColor: color.ground,
    borderWidth: layout.border, borderColor: color.ink, borderRadius: layout.radius,
    paddingHorizontal: space.lg, paddingVertical: space.md,
    minHeight: layout.touchTarget,
  },
});
