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
          body="Start here. Add the barangay you want alerts for."
          primary={{ label: "Add area", onPress: () => router.push("/picker?tour=1") }}
          onSkip={skip}
          passThroughTarget
        />
      );

    case "T3":
      return (
        <CoachMark
          target={null}
          title="Let PAWER warn you"
          body={`You'll get an alert when a new outage is scheduled for ${pendingName}, the evening before, an hour before, and when power should be back.`}
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
          title="Is this the right area?"
          body=""
          primary={{
            label: "Yes, add it",
            onPress: () => { tourPending?.forEach(addBarangay); sounds.areaAdded(); setTourPending(null); setStep("T5"); },
          }}
          secondary={{ label: "Choose another", onPress: () => { setTourPending(null); router.push("/picker?tour=1"); } }}
          onSkip={skip}
        >
          {mapUri && mapOk && (
            <Image
              source={{ uri: mapUri }}
              onError={() => setMapOk(false)} // no image → the slot collapses; confirmation proceeds on the name (§4.2)
              style={styles.map}
              accessibilityLabel={`Map of ${pendingName}`}
            />
          )}
          <T v="headline">{pending ? `${pending.display}, ${pendingLgu(pending.lgu)}` : ""}</T>
          <T v="caption" muted>Approximate centre of the barangay. Outages usually affect only parts of a barangay, not all of it.</T>
        </CoachMark>
      );
    }

    case "T5":
      return (
        <CoachMark
          target={null}
          title={`${firstName} added.`}
          body="You'll be alerted when part of it is scheduled for an outage."
          primary={{ label: "Continue", onPress: () => setStep("T6") }}
          onSkip={skip}
        />
      );

    case "T6":
      return (
        <CoachMark
          target={null}
          title="Anywhere else?"
          body="Add another if you look after more than one place — work, family, a business."
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
          title="Put it on your home screen"
          body={canPin
            ? "PAWER is built to be glanced at. The widget shows today's status without opening anything."
            : "PAWER is built to be glanced at. To add the widget: long-press an empty spot on your home screen → Widgets → PAWER → drag the 2×2 tile where you want it."}
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
          title="That's it."
          body={`PAWER will tell you when part of ${firstName} is scheduled to lose power. You can add areas or change alerts anytime in Settings.`}
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
  map: { width: "100%", aspectRatio: 1.6, borderWidth: layout.border, borderColor: color.ink, borderRadius: layout.radius, marginBottom: space.md, backgroundColor: color.surface2 },
});
