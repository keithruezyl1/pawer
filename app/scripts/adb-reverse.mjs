/**
 * Points the phone's localhost:8081 at this machine's Metro, before `expo start` runs.
 *
 * Expo sets this tunnel up itself when IT launches the app, but not when the app is opened from
 * the launcher — and it does not survive a reinstall, an adb restart or a reconnect. The symptom
 * is the app's "Unable to load script" screen while Metro sits there serving happily, which has
 * cost three debugging sessions. Runs as `prestart`, and never fails the start: no device, no adb
 * or an iOS-only session should all just carry on.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const PORT = 8081;

function findAdb() {
  const exe = process.platform === "win32" ? "adb.exe" : "adb";
  const roots = [process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT,
    process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, "Android", "Sdk"),
    process.env.HOME && join(process.env.HOME, "Library", "Android", "sdk"),
    process.env.HOME && join(process.env.HOME, "Android", "Sdk")].filter(Boolean);
  for (const r of roots) {
    const p = join(r, "platform-tools", exe);
    if (existsSync(p)) return p;
  }
  return exe; // fall back to PATH
}

try {
  const adb = findAdb();
  const devices = execFileSync(adb, ["devices"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })
    .split("\n").slice(1).filter((l) => /\tdevice\s*$/.test(l));
  if (devices.length === 0) {
    console.log("adb-reverse: no device attached, skipping");
  } else {
    for (const line of devices) {
      const serial = line.split("\t")[0];
      execFileSync(adb, ["-s", serial, "reverse", `tcp:${PORT}`, `tcp:${PORT}`], { stdio: "ignore" });
      console.log(`adb-reverse: ${serial} -> localhost:${PORT}`);
    }
  }
} catch (e) {
  console.log(`adb-reverse: skipped (${e.message.split("\n")[0]})`);
}
