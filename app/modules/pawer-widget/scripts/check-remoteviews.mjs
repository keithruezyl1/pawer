/**
 * Every view in a widget layout must be one RemoteViews is allowed to inflate.
 *
 * RemoteViews inflates only classes the framework annotates @RemoteView. Anything else throws in
 * the LAUNCHER's process, so the widget draws blank and nothing appears in our own logcat — a
 * silent failure that cost a rebuild to find when a <Space> spacer was added. The list below is
 * every @RemoteView class in the platform sources (verified against
 * $ANDROID_HOME/sources/android-37.2/android/widget), plus the framework tags RemoteViews handles
 * specially.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ALLOWED = new Set([
  "AbsoluteLayout", "AdapterViewFlipper", "AnalogClock", "Button", "CheckBox", "Chronometer",
  "DateTimeView", "FrameLayout", "GridLayout", "GridView", "ImageButton", "ImageView",
  "LinearLayout", "ListView", "ProgressBar", "RadioButton", "RadioGroup", "RelativeLayout",
  "StackView", "Switch", "TextClock", "TextView", "ViewFlipper",
  "ViewStub", "merge", "requestFocus", "include",
]);

const layoutDir = join(dirname(fileURLToPath(import.meta.url)), "../android/src/main/res/layout");
let bad = 0;
for (const file of readdirSync(layoutDir).filter((f) => f.endsWith(".xml"))) {
  const xml = readFileSync(join(layoutDir, file), "utf8").replace(/<!--[\s\S]*?-->/g, "");
  const tags = [...new Set([...xml.matchAll(/<([A-Za-z][\w.]*)/g)].map((m) => m[1]))];
  const rejected = tags.filter((t) => !ALLOWED.has(t));
  if (rejected.length) {
    console.error(`  ${file}: RemoteViews cannot inflate ${rejected.join(", ")} — the widget will render BLANK`);
    bad++;
  } else {
    console.log(`  ${file}: ok (${tags.join(", ")})`);
  }
}
if (bad > 0) {
  console.error(`\n${bad} widget layout(s) use a view RemoteViews is not allowed to inflate.`);
  process.exit(1);
}
console.log("every widget layout uses only @RemoteView classes");
