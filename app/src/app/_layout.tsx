import { useFonts } from "expo-font";
import { Redirect, Stack, usePathname } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { color } from "../theme/tokens";
import { AppStateProvider, useApp } from "../state/AppState";
import { useWidgetSync } from "../state/useWidgetSync";
import { useNotificationSync } from "../state/useNotificationSync";
import { registerBackgroundHandler } from "../platform/push";

// Headless FCM handler must be registered at module load, before any render (ARCH §7.3).
try { registerBackgroundHandler(); } catch { /* not available in Expo Go */ }

export default function RootLayout() {
  /**
   * One file per weight — RN cannot synthesize weights for a custom family (see tokens.ts).
   * Aspekta shipped as a variable font; these are static instances cut from its wght axis.
   */
  const [fontsReady, fontError] = useFonts({
    "Getai-Black": require("../../assets/fonts/GetaiGrotesk-Black.ttf"),
    "Aspekta-400": require("../../assets/fonts/Aspekta-Regular.ttf"),
    "Aspekta-500": require("../../assets/fonts/Aspekta-Medium.ttf"),
    "Aspekta-700": require("../../assets/fonts/Aspekta-Bold.ttf"),
  });

  // Hold the first frame rather than paint the system face and reflow. If a font is unreadable
  // we render anyway — a fallback face beats a screen that never appears.
  if (!fontsReady && !fontError) return null;

  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <Gate />
      </AppStateProvider>
    </SafeAreaProvider>
  );
}

function Gate() {
  const { prefs } = useApp();
  const pathname = usePathname();
  useWidgetSync();
  useNotificationSync();
  const needsOnboarding = !prefs.onboardingDone && !pathname.startsWith("/onboarding");
  return (
    <>
      {needsOnboarding && <Redirect href="/onboarding/1" />}
      {/*
        `slide` (DG §11) — screens are a stack of cards. A new screen enters from the right and
        settles left; going back reverses it. This is the native stack animation, so it runs on
        the UI thread with the platform's decelerate curve and costs us nothing (NFR-4).
        `animationTypeForReplace: "push"` keeps onboarding, which replaces rather than pushes,
        moving forward rather than appearing to go back.
      */}
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          animationTypeForReplace: "push",
          contentStyle: { backgroundColor: color.ground },
        }}
      />
    </>
  );
}
