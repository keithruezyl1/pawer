import type { PropsWithChildren } from "react";
import { ScrollView, StyleSheet, View, type ScrollViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { color, layout } from "../theme/tokens";
import { Checker } from "./Surface";

interface ScreenProps extends PropsWithChildren {
  scroll?: boolean;
  refreshControl?: ScrollViewProps["refreshControl"];
  /** Remove horizontal margin (dashboard hero manages its own). */
  bleed?: boolean;
}

export function Screen({ children, scroll = true, refreshControl, bleed }: ScreenProps) {
  const pad = bleed ? undefined : styles.pad;
  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />
      {/* The ground is a checkerboard, drawn once behind everything (DG §5). */}
      <Checker />
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.content, pad]}
          refreshControl={refreshControl}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, pad, styles.fill]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.ground },
  content: { paddingBottom: 40, gap: layout.cardGap },
  pad: { paddingHorizontal: layout.screenMargin },
  fill: { flex: 1 },
});
