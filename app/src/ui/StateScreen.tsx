/**
 * Every dead end takes one shape: a mark, a plain sentence, and exactly one obvious way out.
 * Used for offline, an unreachable feed, a schema the build cannot read, and the catch-all.
 *
 * The status code sits on a NEUTRAL chip. A red badge on a screen about power would read as an
 * ongoing outage, which is the one thing a status colour is allowed to mean (DG §4).
 */
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { color, layout, space } from "../theme/tokens";
import { Screen } from "./Screen";
import { T } from "./Text";
import { Button } from "./Button";

export interface StateScreenProps {
  mark: ReactNode;
  title: string;
  body: string;
  /** Small print under the body. Optional — most of these read better without it. */
  foot?: string;
  /** HTTP-ish code, when there is one worth showing. */
  code?: string;
  primary: { label: string; onPress: () => void; icon?: ReactNode };
  secondary?: { label: string; onPress: () => void };
  /** Decorative shapes behind the text. */
  shapes?: ReactNode;
}

export function StateScreen({ mark, title, body, foot, code, primary, secondary, shapes }: StateScreenProps) {
  return (
    <Screen scroll={false}>
      {shapes}
      <View style={styles.body}>
        <View style={styles.head}>
          {mark}
          {code ? (
            <View style={styles.code}>
              <T v="label" style={styles.codeText}>{code}</T>
            </View>
          ) : null}
        </View>
        <T v="display" style={styles.title}>{title}</T>
        <T v="body">{body}</T>
        {foot ? <T v="caption" muted>{foot}</T> : null}
      </View>
      <View style={styles.actions}>
        <Button variant="primary" label={primary.label} onPress={primary.onPress} icon={primary.icon} />
        {secondary && <Button variant="ghost" label={secondary.label} onPress={secondary.onPress} />}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, justifyContent: "center", gap: space.lg },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  // The display size is dialled down here: an error is not the loudest thing on the screen.
  title: { fontSize: 34, lineHeight: 36 },
  code: {
    borderWidth: layout.border,
    borderColor: color.ink,
    borderRadius: layout.radius,
    backgroundColor: color.surface2,
    paddingHorizontal: space.md - 1,
    paddingVertical: space.xs + 1,
  },
  codeText: { letterSpacing: 1.2 },
  actions: { gap: space.md, marginBottom: space.xl + space.xs },
});
