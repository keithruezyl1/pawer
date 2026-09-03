# PAWER — Onboarding & Guided Tour

| | |
|---|---|
| **Version** | 1.0 |
| **Date** | 2 September 2026 |
| **Status** | Approved for implementation |
| **Covers** | 5 onboarding screens, 8 guided-tour steps, full copy deck |

---

## 1. Structure

```
ONBOARDING (5 screens, ~40s)          no data captured except an optional name
  S1  The problem
  S2  The answer
  S3  What PAWER covers — and doesn't
  S4  Your name (optional)
  S5  Welcome
        ↓
DASHBOARD — empty state              no areas yet
        ↓
GUIDED TOUR (8 steps, ~60s)          this is where real setup happens
  T1  Add-area button
  T2  Barangay picker
  T3  Notification permission
  T4  Map confirmation
  T5  Area added
  T6  Add more areas (optional)
  T7  Add the widget
  T8  Done
```

**Why setup lives in the tour, not onboarding.** The first barangay is added *once*, in T2 — onboarding captures no location at all. This removes the duplicate step in the original flow, where "where do you live" and the tour's add-place walkthrough did the same job twice. It also makes the tour functional rather than explanatory: every step changes state, so nothing is theatre.

**Consequence:** the dashboard must be reachable with zero selected areas, which relaxes PRD FR-2's minimum-one-before-continue. The empty state is not a failure state — it is a step in the flow, and T1 immediately resolves it.

**Skippability.** Onboarding screens S1–S4 are skippable; **S3 is not** — it carries the required disclosures (PRD FR-4). The tour is skippable at any step and re-runnable from Settings, because a user who skips it has no widget and no areas, and needs a way back.

---

## 2. Onboarding

### S1 — The problem

> ### Power advisories exist. Finding them doesn't.
>
> Visayan Electric publishes every scheduled outage days in advance — buried in a Facebook feed, between everything else.
>
> Sound familiar?
>
> `[ It does ]`   `Skip`

**This screen was retargeted.** The original framing asked about *sudden* power outages. PAWER cannot cover sudden outages — VECO doesn't publish them in advance and no compliant public source exists (PRD §5) — so opening on that question would promise something the app breaks on its first day. The recognition-and-agreement structure is preserved; only the target changed, to the problem PAWER genuinely solves.

### S2 — The answer

> ### What if it just told you?
>
> One card. Your barangay only. On your home screen, before it happens.
>
> `[ Show me ]`   `Skip`

### S3 — What PAWER covers *(not skippable)*

> ### What PAWER can and can't tell you
>
> **✓** Scheduled outages, days ahead
> **✓** When one is underway, and when power should return
>
> **✗** Sudden or emergency outages. Visayan Electric doesn't publish these in advance, so PAWER can't warn you about them.
>
> PAWER reads Visayan Electric's public advisories. It isn't made by them and isn't affiliated with them. It shows the published schedule — not the real state of the grid — so don't rely on it for anything medical or safety-critical.
>
> `[ Got it ]`

Satisfies PRD FR-4 and FR-0, BRD BR-22, and Design Guidelines §2.3 in one screen. It sits **before** any subscription, because choosing a barangay is meaningless without knowing what alerts it will produce.

### S4 — Your name *(optional)*

> ### What should we call you?
>
> `[ Your name                    ]`
>
> Optional. This stays on your phone — it's never sent anywhere.
>
> `[ Continue ]`   `Skip`

Placed after the pitch rather than first: a keyboard before the user knows what the app is costs more than it returns. See §5 for the privacy-claim consequence.

### S5 — Welcome

> ### Welcome to PAWER
> *(or "You're set, {name}" when a name was given)*
>
> Two things left: add your barangay, and put PAWER on your home screen. About a minute.
>
> `[ Start ]`   `I'll set it up myself`

`I'll set it up myself` skips the tour and lands on the empty dashboard, where the add-area button is the only prominent control.

---

## 3. Guided tour

### T1 — Add-area button

Coach mark on the empty dashboard's add-area control. Everything else dims; the control stays fully legible.

> **Start here.** Add the barangay you want alerts for.

### T2 — Barangay picker

Opens the real picker (PRD FR-2d) — not a mock.

> Search for your barangay, or browse by city.
> It's printed on your Visayan Electric bill.

Search filters all 232 at once; the eight LGU groups sit below for browsing. Names shared across LGUs always show theirs — `San Roque, Liloan`, never bare (PRD FR-2b).

### T3 — Notification permission

Fires **after** a barangay is chosen, so the request has visible purpose.

> ### Let PAWER warn you
>
> You'll get an alert when a new outage is scheduled for **Lahug**, the evening before, an hour before, and when power should be back.
>
> `[ Allow ]`   `Not now`

`Allow` triggers the system `POST_NOTIFICATIONS` dialog. `Not now` continues — the app still works, and the tour says so rather than nagging.

**This is the only permission PAWER ever requests.** No location, no storage, no contacts (PRD NFR-17/19).

### T4 — Map confirmation

> ### Is this the right area?
>
> `[ static map image, pin at barangay centre ]`
>
> **Lahug, Cebu City**
> Approximate centre of the barangay. Outages usually affect only *parts* of a barangay, not all of it.
>
> `[ Yes, add it ]`   `Choose another`

The caption is doing real work: the pin is a barangay locator, not the user's address. Without that line, a pin implies precision PAWER doesn't have (PRD FR-0a). Rendering spec in §4.

### T5 — Area added

> **Lahug added.**
> You'll be alerted when part of it is scheduled for an outage.

### T6 — Add more areas *(optional)*

> ### Anywhere else?
>
> Add another if you look after more than one place — work, family, a business.
>
> `[ Add another ]`   `[ No, continue ]`

`Add another` loops to T2. From the fifth area onward, the frequency note from PRD FR-2f appears — as information, not a warning, and it never blocks.

### T7 — Add the widget

The most valuable step in the tour, because the widget is PAWER's primary surface and users won't discover it unprompted.

> ### Put it on your home screen
>
> PAWER is built to be glanced at. The widget shows today's status without opening anything.
>
> `[ Add widget ]`   `Skip`

**Platform behaviour differs, and this is a hard API boundary:**

| Condition | Behaviour |
|---|---|
| API 26+ **and** launcher supports pinning | `[ Add widget ]` calls `AppWidgetManager.requestPinAppWidget()`, showing the system placement dialog. One tap |
| API 24–25 | `requestPinAppWidget` does not exist. Show written instructions instead |
| API 26+ but `isRequestPinAppWidgetSupported()` is false | Same written fallback — several third-party launchers don't support pinning |

Fallback copy:

> Long-press an empty spot on your home screen → **Widgets** → **PAWER** → drag the 2×2 tile where you want it.

The button must be replaced by instructions, never shown and then failing.

### T8 — Done

> ### That's it.
>
> PAWER will tell you when part of **Lahug** is scheduled to lose power.
>
> You can add areas or change alerts anytime in Settings.
>
> `[ Done ]`

---

## 4. Map rendering

### 4.1 Pre-rendered images, composited from raster tiles — the key never ships

MapTiler is used at **build time**, not run time. **The images are composited by the pipeline from MapTiler raster tiles** (~10 tiles per barangay, free plan) rather than fetched from the Static Maps API, which turned out to be paid-only (BRD D-26). The result is the same one finished WebP per barangay.

```
pipeline (GitHub Actions)                     app
  MAPTILER_KEY  (Actions secret)
      ↓
  MapTiler Static Maps API
      ↓  once per barangay, 232 images
  dist/v1/maps/{lgu}.{barangay}.webp   ──→   GitHub Pages  ──→  fetch + cache
```

**Why not call MapTiler from the app.** A key inside a sideloaded APK with a published checksum is trivially extractable, and a leaked key spends the owner's quota. Pre-rendering removes the class of problem entirely: the key stays in Actions secrets, the app makes no MapTiler request, and there is no runtime quota to exhaust.

| Property | Result |
|---|---|
| Client dependency | **None.** No map SDK, no MapLibre, no WebView, no GL |
| APK size impact | **Zero** — images are fetched, not bundled |
| Runtime API calls | **Zero** |
| Key exposure | **None** — build-time only |
| Offline | Works once cached |
| Regeneration | Only when styling changes or a barangay is added |

Tile request shape, one per 256 px tile covering the 640×400 view at zoom 15:

```
https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key={MAPTILER_KEY}
```

The pipeline pastes the tiles onto a canvas, draws the pin at the centroid, adds the required `© MapTiler © OpenStreetMap contributors` line, and encodes WebP.

**Review before publish (C3).** The `maps` workflow renders *every* candidate into a downloadable contact sheet (`map-review` artifact); only centroids marked `verified: true` are rendered into the published set.

### 4.2 Image spec

| Property | Value |
|---|---|
| Format | WebP (supported from API 18; well below our API 24 floor) |
| Size | 640 × 400, served into a 2:1.25 container |
| Zoom | Barangay-appropriate, ~14–15; tuned per LGU density |
| Marker | Single pin at barangay centroid |
| Budget | ≤ 60 KB each, ≤ 12 MB total across 232 |
| Theme | One neutral style used for both light and dark, to avoid doubling the asset count |
| Failure | If the image 404s or the device is offline, **T4 degrades to name-only confirmation** and the tour continues. The map is an enhancement; it is never load-bearing |

### 4.3 Centroid data — treat it like the name registry

Rendering a map requires a latitude and longitude per barangay, and **PSGC does not include coordinates.** This is a second reference dataset with the same failure profile as the name registry: a wrong centroid produces a map confidently showing the wrong place, which is worse than showing no map at all, because it looks authoritative.

The §5.6 discipline in ARCHITECTURE.md therefore extends to centroids:

| # | Rule |
|---|---|
| **C1** | Centroids are **verified reference data**, never inferred or estimated |
| **C2** | Each carries its source and the date it was verified |
| **C3** | All 232 generated images are **reviewed by a person** before release — the cheapest possible check, since a wrong centroid is obvious on sight |
| **C4** | A barangay with no verified centroid ships **without** a map image and falls back to name-only confirmation. It is never given an approximate one |
| **C5** | Centroid sourcing is an M2 gate, alongside PSGC verification |

---

## 5. Requirement changes

This flow amends decisions recorded elsewhere. Each is deliberate.

| Document | Was | Now | Why |
|---|---|---|---|
| PRD FR-2 | At least one barangay before continuing | Dashboard reachable with **zero** areas; empty state is part of the flow | Setup moved into the tour |
| PRD NFR-5 | No image assets beyond the launcher icon | No **bundled** image assets beyond the launcher icon. One runtime-fetched static map image per barangay is permitted | Onboarding map |
| PRD NFR-6 | Map images are never rendered | **VECO's advisory maps** are never rendered. Barangay locator images are permitted | VECO's maps are per-advisory, arbitrary in size and content, and would need fetching on every entry. A locator image is one small asset per barangay, cached indefinitely |
| PRD NFR-15 | No name is collected | No name is **transmitted or stored server-side**. An optional name may be stored on-device | Optional name field |
| BRD BR-6 | No personal data of any kind | No personal data leaves the device. An optional on-device name is the only personal field | Same |
| ARCH §12 | No secrets outside Actions | Unchanged — **and MapTiler is why it holds.** The key is build-time only | Pre-rendering |

**The privacy claim is now qualified rather than absolute.** It changes from *"PAWER collects no name"* to *"your name never leaves your phone"* — still strong, still true, and RA 10173's controller obligations remain unengaged because nothing is transmitted or processed off-device. But it is a qualified claim, and the About screen must state it in those terms rather than the older absolute one.

---

## 6. Open items

| # | Item | Gate |
|---|---|---|
| 1 | Source and verify 232 barangay centroids (C1–C5) | M2 |
| 2 | Confirm MapTiler static-API parameters, style choice, and free-tier terms for build-time use | M2 |
| 3 | Tune per-LGU zoom so dense Cebu City barangays and sprawling rural ones both read correctly | M3 |
| 4 | Verify `requestPinAppWidget` behaviour on common Philippine launchers — Xiaomi MIUI, Oppo ColorOS, Realme UI, Samsung One UI | M5 |
| 5 | Decide whether skipping the tour surfaces a persistent, dismissible dashboard prompt to add the widget | M3 |
| 6 | Confirm the optional name has somewhere worth appearing — a widget-first app may give a greeting almost no surface | M3 |
