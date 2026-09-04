/**
 * The four dead ends, each one screen with exactly one obvious way out.
 *
 * These are only correct when there is NOTHING to show. Whenever a saved schedule exists, the
 * dashboard degrades to it and says so in a caption instead — losing the network is not a reason
 * to hide data the user already has.
 */
import { StyleSheet } from "react-native";
import { color } from "../theme/tokens";
import { StateScreen } from "./StateScreen";
import { Bolt, CloudOff, Refresh, Warn, ExternalLink } from "./Icon";
import { Burst, Disc, Floater, Sparkle, Squiggle } from "./Shapes";

const MARK = 30;

/** No connection AND no saved schedule. */
export function OfflineState({ onRetry, onUseSaved }: { onRetry: () => void; onUseSaved?: () => void }) {
  return (
    <StateScreen
      mark={<CloudOff size={MARK} />}
      title="No connection"
      body="PAWER needs the internet to fetch new advisories. Everything already saved is still here."
      primary={{ label: "Try again", onPress: onRetry, icon: <Refresh size={15} /> }}
      secondary={onUseSaved ? { label: "Use saved data", onPress: onUseSaved } : undefined}
      shapes={
        <>
          <Floater motion="turn" style={styles.tr}><Burst size={84} /></Floater>
          <Floater motion="bob" delay={600} style={styles.ml}><Disc size={28} fill={color.status.upcoming} /></Floater>
        </>
      }
    />
  );
}

/** The feed answered, but not with a schedule. */
export function FeedErrorState({ code, onRetry, onUseSaved }: { code?: string; onRetry: () => void; onUseSaved?: () => void }) {
  return (
    <StateScreen
      mark={<Warn size={MARK} />}
      title="Can't reach the schedule"
      body="PAWER's data feed did not answer. This one is on our side, not yours."
      code={code}
      primary={{ label: "Try again", onPress: onRetry, icon: <Refresh size={15} /> }}
      secondary={onUseSaved ? { label: "Use saved data", onPress: onUseSaved } : undefined}
      shapes={<Floater motion="bob" style={styles.bl}><Squiggle width={80} height={28} /></Floater>}
    />
  );
}

/**
 * The feed's `min_schema_version` is higher than this build understands. The release manifest
 * has always published that field; until now nothing read it, so a format change would have
 * failed silently instead of saying so.
 */
export function UpdateRequiredState({ onUpdate, onDismiss }: { onUpdate: () => void; onDismiss?: () => void }) {
  return (
    <StateScreen
      mark={<Bolt size={MARK} />}
      title="Time for an update"
      body="VECO's advisories now use a newer format than this copy of PAWER can read."
      foot="Your saved schedule still works, but new advisories will not appear until you update."
      primary={{ label: "Get the update", onPress: onUpdate, icon: <ExternalLink size={15} tone={color.ink} /> }}
      secondary={onDismiss ? { label: "Not now", onPress: onDismiss } : undefined}
      shapes={
        <>
          <Floater motion="turn" style={styles.tl}><Burst size={92} fill={color.status.clear} /></Floater>
          <Floater motion="drift" delay={500} style={styles.br}><Sparkle size={34} fill={color.accent} /></Floater>
        </>
      }
    />
  );
}

/** The catch-all, behind the error boundary. */
export function UnknownErrorState({ onRestart, code }: { onRestart: () => void; code?: string }) {
  return (
    <StateScreen
      mark={<Bolt size={MARK} slashed />}
      title="Something broke"
      body="PAWER hit an error it did not expect."
      code={code}
      primary={{ label: "Restart PAWER", onPress: onRestart, icon: <Refresh size={15} /> }}
      shapes={<Floater motion="drift" style={styles.brBig}><Disc size={70} fill={color.status.ongoing} /></Floater>}
    />
  );
}

const styles = StyleSheet.create({
  tr: { top: 60, right: -22 },
  tl: { top: 48, left: -30 },
  ml: { top: 200, left: -10 },
  bl: { bottom: 290, left: -14 },
  br: { bottom: 260, right: -8 },
  brBig: { bottom: 230, right: -26 },
});
