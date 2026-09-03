# PAWER — Product Requirements Document

| | |
|---|---|
| **Version** | 1.0 |
| **Date** | 2 September 2026 |
| **Status** | Approved for implementation |
| **Platform (v1)** | Android 7.0+ (API 24), distributed as APK |
| **Platform (future)** | iOS 15+ — codebase kept iOS-ready, not shipped in v1 |

---

## 1. Summary

PAWER is a single-purpose Android application that answers one question for residents of Metro Cebu:

> **Does my area lose power, and when?**

Visayan Electric (VECO) publishes weekly service-interruption advisories covering roughly 25–35 separate interruptions across the eight local government units in its franchise. Today a resident finds out whether their barangay is affected by scrolling Facebook and reading a dense, unstructured wall of text — competing for attention with every other post in the feed.

PAWER extracts that information into structured data and presents it three ways: a glanceable dashboard, a 2×2 home-screen widget, and timely notifications scoped to the user's own barangay. It holds no accounts, stores no user data on any server, works fully offline, and is free.

---

## 2. Problem

**The information exists but is not usable.** VECO's advisories are complete and published in advance. They are also published as prose, in weekly batches, mixed into a social feed. Extracting "is Brgy. Lahug affected on Thursday?" requires reading every entry.

**The delivery channel is hostile to the message.** Facebook's feed is ranked, not chronological. A brownout advisory competes with entertainment content and may never surface for the people it affects. There is no way to filter by location and no way to be notified.

**The consequences are concrete.** An unanticipated eight-hour outage means spoiled food, uncharged devices, unfilled water containers, missed remote work, and disrupted medical equipment. Ninety seconds of advance warning changes the outcome; three days changes it completely.

---

## 3. Goals and non-goals

### Goals

| ID | Goal |
|---|---|
| G-1 | A user learns their barangay's power status in **under two seconds**, without opening the app |
| G-2 | A user is **notified in advance** of every scheduled interruption affecting their barangay |
| G-3 | The app is **honest** about what it knows and does not know |
| G-4 | The app costs **nothing to run** and requires **no routine operator attention** |
| G-5 | The app is **negligible** in battery, storage, data, and CPU cost |

### Non-goals

- Not a general VECO news reader. Rate adjustments, job postings, and bidding notices are explicitly filtered out.
- Not a social or crowdsourced platform. No user reports, comments, or accounts.
- Not a real-time grid monitor. PAWER reports VECO's *published schedule*, not the live state of the grid.
- Not an official VECO product. PAWER is unaffiliated and must say so.
- Contains **no AI or machine learning of any kind**. All parsing, matching, and state derivation is deterministic code.

---

## 4. Target users

**Primary — the affected resident.** Lives in VECO's Metro Cebu service area. Owns a mid-to-low-end Android phone, often several years old, frequently on limited mobile data. Wants to know about outages affecting their own street, and nothing else.

**Secondary — the household planner.** Coordinates around outages for a family or small business: shifting work, scheduling deliveries, managing refrigeration. Needs the *upcoming week*, not just today.

**Tertiary — the remote worker.** Needs advance warning to reschedule meetings or arrange backup connectivity. Values the three-day lead time most.

---

## 5. Scope — the advisory types

The product concept names five notification types: scheduled brownout, ongoing, unscheduled/emergency, cancelled, and restored. Six rows appear below because **"restored" splits in two** — PAWER can derive an *expected* restoration from the published end time, but can never confirm an actual one. Conflating the two would be the exact kind of overclaim G-3 forbids.

Their v1 status differs, because the available data source differs.

| Type | v1 | Source and reasoning |
|---|---|---|
| **Scheduled brownout** | ✅ Shipped | Parsed from VECO's weekly advisory posts, typically ~3 days ahead |
| **Ongoing** | ✅ Shipped | **Derived deterministically** from the schedule plus device clock. Requires no data source |
| **Expected restoration** | ✅ Shipped | Derived from the scheduled end time. Framed as *expected*, never confirmed |
| **Unscheduled / emergency** | ❌ Deferred | Published only in real time on Facebook. No public, ToS-compliant, machine-readable source exists |
| **Cancelled** | ❌ Deferred | Same constraint as above |
| **Confirmed restoration** | ❌ Deferred | PAWER can know the scheduled end time, never the actual one |

**FR-0 — Scope honesty.** The app must never imply coverage it does not have. Onboarding and the Settings screen must state plainly that PAWER covers *scheduled* interruptions and that emergency outages will not appear.

Deferring three of six types is a deliberate trade, made to keep ingestion legal, stable, and free. See ARCHITECTURE.md §3 for the alternatives considered.

### 5.1 Geographic model

Four levels exist in the source data. **Exactly one is subscribable.**

| Level | What | Count | Role |
|---|---|---|---|
| **0** | Franchise | 8 LGUs | Fixed. Defines what exists at all; never a user choice |
| **1** | LGU | 8 | Grouping and disambiguation **only** — not subscribable |
| **2** | **Barangay** | **232** | **The subscription unit.** Every alert is per-barangay |
| **3** | Street · sitio · subdivision · compound | thousands | **Display only** — never matched, never subscribable |

**Why level 3 is display-only.** No canonical registry of Philippine streets exists — there is no PSGC equivalent — and VECO's street text is precisely where truncation and typos concentrate (`including portions of Sitios Kaimpyang, Tubigan, & San`). Matching on it would generate false negatives, and a missed brownout is the one failure PAWER cannot absorb. The text is shown verbatim so the user can judge relevance; the software never tries to.

**Why level 1 is not subscribable.** Cebu City alone spans 80 barangays and roughly ten interruptions a week. An LGU-wide subscription would make most alerts irrelevant and teach users to mute PAWER permanently. The browse view (FR-7a) serves that need without a subscription.

**The "Portion of" constraint.** VECO's advisories almost invariably de-energise only *part* of a barangay — nearly every entry begins `Portion of`. Barangay is simply the finest granularity that can be matched reliably, not a claim about the user's address.

**FR-0a.** The app must describe an alert as affecting **part of** the user's barangay, and must never state or imply that a specific address will lose power. Without this, users in large barangays will receive alerts that feel wrong and will stop trusting the app — which is the same outcome as not shipping it.

---

## 6. Functional requirements

### 6.1 Onboarding

| ID | Requirement |
|---|---|
| FR-1 | No account, email, phone number, or login, ever. Onboarding captures **no location** — barangay selection happens in the guided tour (ONBOARDING-AND-TOUR.md §3), so the same action is never performed twice |
| FR-2 | Barangays are grouped by LGU and searchable by typed text. The picker offers **only** the eight LGUs in VECO's franchise: the cities of **Cebu, Mandaue, Talisay, Naga** and the municipalities of **Liloan, Consolacion, Minglanilla, San Fernando** |
| FR-2a | A barangay outside VECO's franchise must **never** be selectable. Lapu-Lapu City and Cordova are served by a different utility; offering them would let a user subscribe to alerts that can never arrive, with no indication of the problem |
| FR-2b | **13 barangay names are shared across LGUs, covering 27 of the 232 records** — `San Roque` exists in Cebu City, Talisay City *and* Liloan; `Basak` in Mandaue City and San Fernando. Wherever a name is ambiguous, **the LGU must be shown alongside it**: in the picker, in selected-area chips, in the widget's area label, and in notification titles. A user must never select, or be alerted about, the wrong San Roque. Full index: COVERAGE-GLOSSARY.md §2 |
| FR-2c | Barangay display must use the registry's full name, never a shortened form. Cebu City contains `Basak Pardo` and `Basak San Nicolas` as distinct barangays alongside a `Pardo`; rendering any of them as `Basak` or `Pardo` would be ambiguous within a single LGU (COVERAGE-GLOSSARY.md §3.1) |
| FR-2d | The picker presents **one screen**: a search field filtering all 232 barangays at once, above the eight LGU groups for browsing. It must be usable both by someone who knows their barangay name and by someone who needs to look for it |
| FR-2e | The picker shows the helper line *"Your barangay is printed on your Visayan Electric bill"*. This resolves the "I don't know my barangay" case without requesting a location permission |
| FR-2f | Selection is **multi-select with a minimum of one and no hard maximum**. At five or more selections the app shows a one-line advisory that alerts will become frequent, then permits the selection. Legitimate multi-area users exist — home, work, parents — and notification de-duplication (FR-30) already collapses one advisory into one alert regardless of how many of the user's areas it touches |
| FR-2g | **LGU-wide subscription must not be offered**, in any LGU, including the smaller municipalities. See §5.1 |
| FR-3 | Selection is changeable at any time from Settings, with no data loss |
| FR-4 | Onboarding states in one screen what PAWER does, what it does **not** cover, and that it is unofficial |
| FR-5 | Onboarding is 5 screens, completable in **under 45 seconds**, and must not request any permission. The notification permission is requested in the guided tour, after a barangay is chosen, so the request has visible purpose |

### 6.2 Dashboard

| ID | Requirement |
|---|---|
| FR-6 | The dashboard opens to a **status card for today**, reflecting the same state machine as the widget (§7.1) |
| FR-7 | Below it, a chronological list of **upcoming interruptions** affecting the user's barangays, each showing date, time window, duration, and affected barangay names |
| FR-7a | A secondary **"All areas"** view lists every parsed interruption across the whole franchise, not only the user's selections, and is **searchable by barangay** across all 232. It requires no network call — the cached feed already contains every advisory |
| FR-7b | The All-areas view is reached from a **single link at the foot of the dashboard**. It must not occupy primary navigation, a tab bar, or any position competing with the status card. Subscribe narrowly, browse broadly — browsing must never dilute the one question the dashboard exists to answer |
| FR-7c | Searching or viewing a barangay in the All-areas view **never subscribes** the user to it. Adding an area remains an explicit action in Settings, so that the notification set can only ever change deliberately |
| FR-8 | Tapping an entry reveals the verbatim `Areas Affected` and `Purpose` text from VECO, plus a link to the source post |
| FR-9 | The dashboard renders entirely from **local cache** and is fully functional offline |
| FR-10 | A visible **data freshness** indicator shows when the feed was last successfully fetched |
| FR-11 | If the cache is older than **48 hours**, a persistent stale-data warning appears |
| FR-12 | If no interruptions are scheduled, the empty state reads as reassurance ("No scheduled outages"), not as an error or a loading failure |
| FR-12a | The dashboard must be reachable with **zero selected areas**. This is a step in the flow, not a failure: the add-area control is the only prominent element, and the guided tour resolves it immediately. This relaxes the earlier minimum-one-before-continue gate |
| FR-13 | Entries with `parse_status` of `partial` or `failed` are **still displayed**, marked as incompletely read, with a link to the source post. They are never silently dropped |
| FR-14 | Pull-to-refresh triggers a manual fetch |

### 6.3 Data refresh

| ID | Requirement |
|---|---|
| FR-15 | The app fetches the published feed on: cold start, return to foreground after >1 hour, receipt of a push message, and manual pull-to-refresh |
| FR-16 | The app performs **no periodic background polling** under any circumstance |
| FR-17 | Fetches use conditional requests (`ETag` / `If-None-Match`) and treat `304 Not Modified` as success |
| FR-18 | A failed fetch never clears or corrupts the existing cache. Last-known-good data is retained indefinitely |

### 6.4 App updates

| ID | Requirement |
|---|---|
| FR-19 | Because PAWER is distributed as an APK outside any store, the app checks a published `version.json` on cold start |
| FR-20 | If a newer version exists, a **dismissible** prompt offers a direct download link |
| FR-21 | If the installed app's supported schema version is below the feed's `min_schema_version`, the prompt becomes **non-dismissible** — a client that can no longer read the feed correctly must not present possibly-wrong outage data |

---

## 7. Widget requirements

**FR-22** — PAWER provides exactly one home-screen widget, at one size: **2×2**.

### 7.1 Widget state machine

Evaluated against the user's selected barangays in `Asia/Manila`.

| State | Condition | Displays |
|---|---|---|
| `NONE_TODAY` | No interruption scheduled today | "No outage today", plus next upcoming date and window if one exists |
| `UPCOMING_TODAY` | Interruption today, `now < start` | Time window and a **live countdown to start** |
| `ONGOING` | `start ≤ now < end` | "Ongoing (expected)", expected restoration time, live countdown to restoration |
| `ENDED_TODAY` | All of today's interruptions past `end` | "Power should be restored by now" |
| `STALE` | Cache older than 48h | Overlays whichever state applies, marking the data as possibly outdated |

**FR-23 — Resolution order.** When a day holds several interruptions: `ONGOING` takes precedence; otherwise the soonest `UPCOMING_TODAY`; `ENDED_TODAY` only once every interruption that day has passed.

**FR-24 — Cross-midnight interruptions.** Windows such as `10:00 PM of August 30 to 6:00 AM of August 31` are common in real advisories. These must read as `ONGOING` on **both** calendar days. Interruptions are therefore stored as absolute instants, never as a date plus a time-of-day.

**FR-25 — Countdown without wakeups.** The countdown must be rendered by the Android system's `Chronometer` in count-down mode, not by app-scheduled refreshes. The widget must set `updatePeriodMillis="0"`, disabling framework periodic updates entirely.

**FR-26 — Transition-only wakeups.** The widget redraws only at genuine state boundaries: interruption start, interruption end, and local midnight. A day with no interruption costs **one** wakeup; a day with one costs **three**.

**FR-27 — No computation in the widget.** The widget must not start the JavaScript runtime, open a network connection, or read the main data cache. The app precomputes a minimal state blob into `SharedPreferences`; the widget reads it and performs only date arithmetic.

**FR-28 — Tapping the widget** opens the dashboard.

---

## 8. Notification requirements

**FR-29** — Four notification events, individually toggleable in Settings.

| Event | Trigger | Delivered by |
|---|---|---|
| **New advisory** | A newly published interruption affects a selected barangay | Server push (FCM topic) |
| **Evening before** | 20:00 local, the day before | Scheduled on-device |
| **One hour before** | 60 minutes before `start` | Scheduled on-device |
| **Expected restoration** | At `end` | Scheduled on-device |

**FR-30 — One buzz per advisory.** A user watching three affected barangays must receive **one** notification, not three. Push messages are data-only; the device de-duplicates by outage `id` and posts a single local notification.

**FR-31 — Rebuild, never patch.** On every successful feed refresh, all pending local notifications are cancelled and rebuilt from current data. This is what makes rescheduled or withdrawn interruptions self-correct without any server-side cancellation mechanism.

**FR-32 — Scheduling horizon.** Local notifications are scheduled only for interruptions within the next **14 days**, respecting platform pending-notification limits (iOS caps at 64).

**FR-33 — Inexact alarms.** Notifications use inexact alarms so Android can batch wakeups, avoiding the `SCHEDULE_EXACT_ALARM` permission on Android 12+. Copy must not promise minute-level precision.

**FR-34 — Honest copy.** Every notification referring to an in-progress or ended interruption must be phrased as expectation, not observation. `Expected restoration 4:00 PM` is permitted; `Power is out` is not.

**FR-35 — No notification may fire for a barangay the user has not selected.**

---

## 9. Non-functional requirements

### 9.1 Power and performance

| ID | Requirement |
|---|---|
| NFR-1 | Zero background polling. Zero periodic widget updates |
| NFR-2 | Device wakeups attributable to PAWER: ≤ 1/day when nothing is scheduled, ≤ 3/day when an interruption is scheduled |
| NFR-3 | Cold start to rendered dashboard: **under 2 seconds** on a 2019 mid-range device |
| NFR-4 | No gradients, blur, or elevation effects. **No idle, looping, or decorative motion.** Shadows are solid offset rectangles (a second view), never blur |
| NFR-4a | Motion is limited to the ten named animations in DESIGN-GUIDELINES.md §11 — each transform- or opacity-only, ≤ 240 ms, UI-thread, bound to one meaning. All collapse to a 0 ms cut when the system reduce-motion setting is on. Nothing animates in the widget |
| NFR-5 | No **bundled** image assets beyond the launcher icon. No custom fonts — system font only. One runtime-fetched static map image per barangay is permitted for onboarding confirmation, pre-rendered at build time and served from the CDN |
| NFR-6 | **VECO's advisory maps are never rendered.** They are per-advisory, arbitrary in size and content, and would require a fetch per entry; PAWER links to the source post instead. Barangay locator images are a separate, permitted case (NFR-5) — one small cached asset per barangay, never per advisory |
| NFR-7 | Network transfer per refresh ≤ 15 KB, and ≈ 300 bytes when unchanged (`304`) |
| NFR-8 | On-device storage under 1 MB excluding the APK |
| NFR-9 | No third-party SDK except Firebase Cloud Messaging. No analytics, crash reporting, or advertising SDKs |

### 9.2 Compatibility

| ID | Requirement |
|---|---|
| NFR-10 | Minimum Android **7.0 (API 24)**; target the current stable API level |
| NFR-11 | Per-ABI APKs for `arm64-v8a` and `armeabi-v7a`, plus a universal fallback. Per-ABI builds roughly halve the download for low-end devices |
| NFR-12 | Correct rendering from 320 dp width upward, and at system font scale up to 200% |
| NFR-13 | **Single light theme**, neobrutalist, per DESIGN-GUIDELINES.md v2. No dark theme in v1; the widget uses the same tokens |
| NFR-14 | The codebase stays cross-platform. An iOS WidgetKit implementation is written and maintained but not shipped in v1 |

### 9.3 Privacy

| ID | Requirement |
|---|---|
| NFR-15 | No user accounts. No email, phone, or device identifier is collected. An **optional** name may be stored on-device only — never transmitted, never in a push payload, never in any request |
| NFR-16 | No server-side record of any user exists. Notification targeting uses FCM **topic** subscriptions — the server publishes to a barangay name and never learns who or how many are listening |
| NFR-17 | No location permission is requested |
| NFR-18 | Selected barangays are stored **only on the device** |
| NFR-19 | Requested permissions limited to `INTERNET`, `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED` |

### 9.4 Reliability

| ID | Requirement |
|---|---|
| NFR-20 | The app is fully functional offline against its last-known-good cache |
| NFR-21 | The parser must **never silently discard** an entry. Every entry resolves to `parsed`, `partial`, or `failed`, and all three reach the user |
| NFR-22 | An unrecognised area name automatically files a repository issue for the maintainer. This is the app's entire operational monitoring surface |
| NFR-23 | The ingestion pipeline must survive 60 days of source silence without being auto-disabled by the CI provider |

---

## 10. Data source and honesty constraints

PAWER's sole data source is Visayan Electric's own public website — the RSS feed at `visayanelectric.com/blog-feed.xml` and the advisory posts it links. No authentication, no scraping of Facebook, no terms-of-service violation.

Three constraints follow, and they are product requirements rather than technical footnotes:

1. **PAWER knows the schedule, not the grid.** Every state describing a live condition is an inference from published times. Language throughout the app must reflect this.
2. **PAWER inherits VECO's errors.** The source contains typos, malformed punctuation, inconsistent grammar, and text truncated mid-sentence. Where PAWER cannot read an entry confidently, it says so and links to the original.
3. **PAWER is unofficial.** The app must attribute Visayan Electric as the source, must not use VECO's marks or logo in its identity, and must state that it is not affiliated with or endorsed by Visayan Electric.

---

## 11. Explicitly out of scope for v1

Unscheduled and emergency outage alerts · cancellation and confirmed-restoration alerts · user-reported outages · outage history and analytics · multiple widget sizes · map rendering · Cebuano localisation · iOS release · other utilities or electric cooperatives · in-app messaging or comments · accounts, sync, or multi-device state.

---

## 12. Success criteria

Because PAWER stores no user data and ships no analytics SDK, success is judged on correctness and cost rather than on measured engagement.

| Criterion | Target |
|---|---|
| Parser correctness | ≥ 99% of entries reach `parsed` across a 12-week corpus; zero silent drops |
| Alert completeness | Every `parsed` interruption affecting a selected barangay produces its enabled notifications |
| Freshness | A newly published advisory reaches devices within **1 hour** |
| Cost | **$0/month**, indefinitely |
| Operator burden | ≤ 1 maintenance action per month, expected to be an alias-table addition |
| Power | PAWER does not appear in Android's per-app battery ranking during a week of normal use |
| Install footprint | Per-ABI APK under 25 MB |

---

## 13. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| VECO restructures its advisory HTML | **High** | Registry-scan parsing tolerates most changes; structural failure files an issue rather than shipping wrong data; `failed` entries still surface with a source link |
| VECO stops publishing to the website | **High** | No mitigation within v1's constraints. Detected by the freshness indicator and stale warning |
| Missing an emergency outage the user expected | **Medium** | Addressed by disclosure, not by capability — onboarding and Settings both state the limitation |
| Stale clients from APK-only distribution | **Medium** | Version check on launch; non-dismissible when the schema is unsupported (FR-21) |
| CI provider disables the scheduled workflow after 60 days of inactivity | **Medium** | Daily heartbeat commit guarantees repository activity (NFR-23) |
| Unrecognised barangay causes a missed alert | **Medium** | Auto-filed issue on unknown area name; `partial` entries still displayed |
| Trademark concern over VECO branding | **Low** | Independent name and icon; attribution without marks; explicit non-affiliation notice |

---

## 14. Release plan

| Milestone | Contents |
|---|---|
| **M1 — Parser** | Standalone TypeScript package. Validated against ≥ 12 weeks of real advisories. Corpus-based test suite |
| **M2 — Pipeline** | Scheduled ingestion, published JSON artifacts, barangay registry, heartbeat, auto-issue on unknown area |
| **M3 — App core** | 5-screen onboarding, dashboard incl. zero-area empty state, All-areas browse, 8-step guided tour, local cache, offline behaviour, freshness and stale states (ONBOARDING-AND-TOUR.md) |
| **M4 — Notifications** | Topic subscription, data-only push with de-duplication, three locally scheduled alerts, idempotent rebuild |
| **M5 — Widget** | Android `RemoteViews` widget, five states, `Chronometer` countdown, boundary alarms, `SharedPreferences` bridge |
| **M6 — Release** | Per-ABI APKs, `version.json`, update check, download page, iOS WidgetKit target written but unshipped |

---

## 15. Open questions

1. **Barangay registry completeness.** VECO publishes no canonical list of served barangays. The registry will be seeded from PSGC data for the eight franchise LGUs and refined by harvesting historical advisories. Two caveats: some barangays may be absent until they first appear in an advisory (which is what NFR-22's auto-issue exists to catch), and VECO's franchise boundary is at LGU level, so it is possible that not every barangay within a franchise LGU is actually served. If that proves true, an unserved barangay would appear selectable but never receive an alert — the same silent failure as FR-2a. Verification during M2 must confirm whether the franchise is LGU-complete.
2. **Widget refresh after device reboot.** Boundary alarms do not survive a reboot. `RECEIVE_BOOT_COMPLETED` is requested to re-arm them; behaviour needs verification on aggressive OEM battery managers, which are common on budget Philippine handsets.
3. **Advisory revisions.** It is not yet known whether VECO edits a published post in place when a schedule changes. Content-hash IDs will surface such an edit as a new interruption; whether that warrants a distinct "schedule changed" notification is deferred until the behaviour is observed.
