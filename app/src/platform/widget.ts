/**
 * Widget bridge. The native module exists only in a prebuilt dev client / release APK; in Expo Go
 * or on web it is absent and every call is a no-op, so the JS side never has to care.
 */
import { requireOptionalNativeModule } from "expo-modules-core";
import type { WidgetState } from "@pawer/shared";

interface NativeWidget {
  setState(json: string): void;
  clear(): void;
  isPinSupported(): boolean;
  requestPin(): boolean;
  instanceCount(): number;
}

const Native = requireOptionalNativeModule<NativeWidget>("PawerWidget");

export const widget = {
  available: Native !== null,
  setState(state: WidgetState): void {
    Native?.setState(JSON.stringify(state));
  },
  clear(): void {
    Native?.clear();
  },
  isPinSupported(): boolean {
    try { return Native?.isPinSupported() ?? false; } catch { return false; }
  },
  requestPin(): boolean {
    try { return Native?.requestPin() ?? false; } catch { return false; }
  },
  instanceCount(): number {
    try { return Native?.instanceCount() ?? 0; } catch { return 0; }
  },
};
