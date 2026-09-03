# pawer-widget — Expo local module

The 2×2 home-screen widget (ARCHITECTURE.md §9, PRD §7).

**Android** — classic `RemoteViews` + `AppWidgetProvider`, not Glance. The JS side precomputes a
`WidgetState` blob (`@pawer/shared` `deriveWidgetState`) and calls `setState(json)`; Kotlin stores it in
`SharedPreferences` and does only date arithmetic. Countdown is a system `Chronometer` in count-down
mode (API 24+) — zero app wakeups. `updatePeriodMillis="0"`; redraws are scheduled with
`AlarmManager.setAndAllowWhileIdle` at the exact boundaries the blob lists, and re-armed on boot.

**iOS** — a WidgetKit target is written under `ios/PawerWidget/` but is **not added to any Xcode
target** (PRD NFR-14: iOS-ready, unshipped). The module writes the same blob to an App Group.

> **Not yet compiled.** This machine has no Android SDK. The Kotlin follows the Expo Modules API
> for SDK 57 and the AppWidget APIs at their documented levels, but the first `expo prebuild` +
> Gradle build (M5) is where it gets verified.
