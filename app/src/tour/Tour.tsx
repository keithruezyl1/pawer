import { useEffect, useState } from "react";
import { Image, Platform, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { findBarangay, displayName } from "@pawer/registry";
import { FEED_BASE_URL } from "../data/feed";
import { color, layout, space } from "../theme/tokens";
import { useApp } from "../state/AppState";
import { CoachMark, type Rect } from "../ui/CoachMark";
import { requestPermission } from "../platform/notifications";
import { widget } from "../platform/widget";
import { useSounds } from "../theme/sound";
import { T } from "../ui/Text";

export type { Rect };

type Step = "T1" | "T3" | "T4" | "T5" | "T6" | "T7" | "T8";

/**
 * Guided tour T1–T8 (ONBOARDING-AND-TOUR §3). Every step changes state; nothing narrates.
 * T2 is the real picker screen (opened with ?tour=1), which hands its selection back via
 * tourPending; T4 confirms it (map when available, name always), and only then is it added.
 */
export function Tour({ addAreaRect }: { addAreaRect: Rect | null }) {
  const router = useRouter();
  const { prefs, tourPending, setTourPending, addBarangay, completeTour } = useApp();
  const [step, setStep] = useState<Step>(prefs.barangays.length ? "T6" : "T1");
  const [mapOk, setMapOk] = useState(true);
  // The map slot stays collapsed until the image actually decodes, so a missing map shows nothing
  // at all rather than an empty grey box that hangs about and then vanishes.
  const [mapLoaded, setMapLoaded] = useState(false);
  /**
   * The area just added. T5 used to name prefs.barangays[0], which is the FIRST area ever added,
   * so adding a second one congratulated you on the wrong barangay. tourPending is cleared before
   * T5 renders, so the name has to be captured on the way through.
   */
  const [addedName, setAddedName] = useState<string | null>(null);
  const sounds = useSounds();

  // T2 → T3: the picker returned a selection.
  useEffect(() => { if (tourPending && tourPending.length > 0 && (step === "T1" || step === "T6")) setStep("T3"); }, [tourPending]);

  const pending = tourPending?.[0] ? findBarangay(tourPending[0]) : undefined;
  const pendingName = pending ? displayName(pending) : "your area";
  const firstName = prefs.barangays[0] ? displayName(findBarangay(prefs.barangays[0])!) : pendingName;
  const skip = () => completeTour();

  switch (step) {
    case "T1":
      return (
        <CoachMark
          target={addAreaRect}
          title="Where do you live?"
          body="Pick your barangay and PAWER will keep an eye on it for you."
          primary={{ label: "Add area", onPress: () => router.push("/picker?tour=1") }}
          onSkip={skip}
          passThroughTarget
        />
      );

    case "T3":
      return (
        <CoachMark
          target={null}
          title="Can we give you a heads up?"
          body={`We'll tell you when a new outage is scheduled for ${pendingName}, the evening before, an hour before, and when the power should be back.`}
          primary={{ label: "Allow", onPress: () => { requestPermission().catch(() => false).finally(() => setStep("T4")); } }}
          secondary={{ label: "Not now", onPress: () => setStep("T4") }}
          onSkip={skip}
        />
      );

    case "T4": {
      const mapUri = pending ? `${FEED_BASE_URL}/maps/${pending.slug}.webp` : null;
      return (
        <CoachMark
          target={null}
          title="Look right?"
          body=""
          primary={{
            label: "Yes, add it",
            onPress: () => {
              setAddedName(pendingName);
              tourPending?.forEach(addBarangay);
              sounds.areaAdded();
              setTourPending(null);
              setStep("T5");
            },
          }}
          secondary={{ label: "Pick another", onPress: () => { setTourPending(null); router.push("/picker?tour=1"); } }}
          onSkip={skip}
        >
          {mapUri && mapOk && (
            <View style={mapLoaded ? styles.mapWrap : styles.mapPending}>
              <Image
                source={{ uri: mapUri }}
                onLoad={() => setMapLoaded(true)}
                onError={() => setMapOk(false)} // no image → the slot collapses; confirm on the name (§4.2)
                style={styles.map}
                accessibilityLabel={`Map of ${pendingName}`}
              />
            </View>
          )}
          <T v="headline">{pending ? `${pending.display}, ${pendingLgu(pending.lgu)}` : ""}</T>
          <T v="caption" muted>Approximate centre. Outages often affect only part of a barangay.</T>
        </CoachMark>
      );
    }

    case "T5":
      return (
        <CoachMark
          target={null}
          title={`${addedName ?? firstName} is yours now.`}
          body="We'll tell you before the power goes."
          primary={{ label: "Continue", onPress: () => setStep("T6") }}
          onSkip={skip}
        />
      );

    case "T6":
      return (
        <CoachMark
          target={null}
          title="Anywhere else you care about?"
          body="Work, your parents' place, the shop. Add as many as you like."
          primary={{ label: "Add another", onPress: () => router.push("/picker?tour=1") }}
          secondary={{ label: "No, continue", onPress: () => setStep("T7") }}
          onSkip={skip}
        />
      );

    case "T7": {
      // requestPinAppWidget needs API 26+ AND launcher support; the native module lands in M5.
      // Until then every device gets the written fallback, never a button that fails.
      const canPin = Platform.OS === "android" && Number(Platform.Version) >= 26 && widget.isPinSupported();
      return (
        <CoachMark
          target={null}
          title="Want it on your home screen?"
          body={canPin
            ? "One tap and you can see the day's status without opening anything."
            : "One tap and you can see the day's status without opening anything. To add it, long-press an empty spot on your home screen, choose Widgets, find PAWER, then drag the 2×2 tile where you want it."}
          primary={{ label: canPin ? "Add widget" : "Got it", onPress: () => { if (canPin) widget.requestPin(); setStep("T8"); } }}
          secondary={canPin ? { label: "Skip", onPress: () => setStep("T8") } : undefined}
          onSkip={skip}
        />
      );
    }

    case "T8":
      return (
        <CoachMark
          target={null}
          title="You're all set."
          body={`PAWER will speak up when part of ${prefs.barangays.length > 1 ? "your areas" : firstName} is scheduled to lose power. Change anything in Settings.`}
          primary={{ label: "Done", onPress: completeTour }}
          onSkip={completeTour}
        />
      );
  }
}

function pendingLgu(slug: string): string {
  return ({ "cebu-city": "Cebu City", "mandaue-city": "Mandaue City", "talisay-city": "Talisay City", naga: "City of Naga", liloan: "Liloan", consolacion: "Consolacion", minglanilla: "Minglanilla", "san-fernando": "San Fernando" } as Record<string, string>)[slug] ?? slug;
}

const styles = StyleSheet.create({
  mapWrap: { marginBottom: space.md },
  // Zero-height and clipped, not unmounted: the request still runs, it just takes no space and
  // shows nothing until onLoad. No fill colour, so there is never a grey placeholder.
  mapPending: { height: 0, overflow: "hidden" },
  map: { width: "100%", aspectRatio: 1.6, borderWidth: layout.border, borderColor: color.ink, borderRadius: layout.radius },
});
