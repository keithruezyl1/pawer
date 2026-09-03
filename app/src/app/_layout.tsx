import { Redirect, Stack, usePathname } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { color } from "../theme/tokens";
import { AppStateProvider, useApp } from "../state/AppState";
import { NavFxProvider } from "../state/NavFx";
import { useWidgetSync } from "../state/useWidgetSync";
import { useNotificationSync } from "../state/useNotificationSync";
import { registerBackgroundHandler } from "../platform/push";

// Headless FCM handler must be registered at module load, before any render (ARCH §7.3).
try { registerBackgroundHandler(); } catch { /* not available in Expo Go */ }

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <NavFxProvider>
          <Gate />
        </NavFxProvider>
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
      {/* Navigation itself is a hard cut; `wipe` is the only transition, and it's ours (DG §11). */}
      <Stack screenOptions={{ headerShown: false, animation: "none", contentStyle: { backgroundColor: color.ground } }} />
    </>
  );
}
