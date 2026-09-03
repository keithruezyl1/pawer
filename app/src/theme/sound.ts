/**
 * DESIGN-GUIDELINES §12 — the sound vocabulary. Two sounds, each bound to exactly one meaning,
 * mirroring the motion vocabulary they accompany:
 *
 *   areaAdded      pairs with `slam`   — something was added (a barangay)
 *   statusChanged  pairs with `stamp`  — a status was resolved or updated (the hero changed state)
 *
 * Rules: respect the device's silent mode; mix with, never interrupt, other audio; nothing in the
 * background; one Sounds toggle in Settings; never a sound without a corresponding state change.
 * Notifications keep the system default sound (DG §8) — this file is UI only.
 */
import { useEffect, useRef } from "react";
import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import { useApp } from "../state/AppState";

const AREA_ADDED = require("../../assets/sounds/area-added.mp3");
const STATUS_CHANGE = require("../../assets/sounds/status-change.mp3");

let modeSet = false;
async function ensureMode(): Promise<void> {
  if (modeSet) return;
  modeSet = true;
  try {
    await setAudioModeAsync({ playsInSilentMode: false, interruptionMode: "mixWithOthers", shouldPlayInBackground: false });
  } catch {
    /* audio mode is best-effort */
  }
}

export function useSounds() {
  const { prefs } = useApp();
  const areaAdded = useAudioPlayer(AREA_ADDED);
  const statusChanged = useAudioPlayer(STATUS_CHANGE);
  const enabled = useRef(prefs.sounds);
  enabled.current = prefs.sounds;

  useEffect(() => { void ensureMode(); }, []);

  const play = (p: typeof areaAdded) => {
    if (!enabled.current) return;
    try { p.seekTo(0); p.play(); } catch { /* never let a sound break a state change */ }
  };

  return {
    areaAdded: () => play(areaAdded),
    statusChanged: () => play(statusChanged),
  };
}
