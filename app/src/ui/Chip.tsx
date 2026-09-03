import { Pressable, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import type { BarangayEntry } from "@pawer/shared";
import { displayName } from "@pawer/registry";
import { color, layout, space } from "../theme/tokens";
import { useTear } from "../theme/motion";
import { T } from "./Text";

export interface ChipProps {
  barangay: BarangayEntry;
  /** When given, the chip is removable; removal plays `tear` then calls this. */
  onRemove?: (slug: string) => void;
  /** Quiet marker used in the All-areas view for barangays the user follows (DG §6.4). */
  following?: boolean;
}

/** Barangay chip. Shows "Name, LGU" automatically when the name is shared across LGUs (FR-2b). */
export function Chip({ barangay, onRemove, following }: ChipProps) {
  const tear = useTear();
  const label = displayName(barangay);

  const remove = async () => {
    await tear.run();
    onRemove?.(barangay.slug);
  };

  return (
    <Animated.View style={[styles.chip, following && styles.following, tear.style]}>
      <T v="label">{label}</T>
      {onRemove && (
        <Pressable onPress={remove} accessibilityRole="button" accessibilityLabel={`Remove ${label}`} hitSlop={8} style={styles.x}>
          <View style={styles.xLine1} /><View style={styles.xLine2} />
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row", alignItems: "center", gap: space.sm,
    borderWidth: layout.border, borderColor: color.ink, borderRadius: layout.radius,
    backgroundColor: color.ground, paddingHorizontal: space.md, paddingVertical: space.xs + 2,
    minHeight: 32,
  },
  following: { backgroundColor: color.surface2 },
  x: { width: 16, height: 16, alignItems: "center", justifyContent: "center" },
  xLine1: { position: "absolute", width: 14, height: 2, backgroundColor: color.ink, transform: [{ rotate: "45deg" }] },
  xLine2: { position: "absolute", width: 14, height: 2, backgroundColor: color.ink, transform: [{ rotate: "-45deg" }] },
});
