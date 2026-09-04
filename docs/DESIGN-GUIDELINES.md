# PAWER — Design Guidelines

| | |
|---|---|
| **Version** | 2.0 |
| **Date** | 3 September 2026 |
| **Status** | Approved for implementation |
| **Scope** | Android app UI, 2×2 home-screen widget, notification copy, animation contract |
| **Style** | Neobrutalism (per NN/g), single light theme |

> **v2.0 supersedes v1.0's palette, layout, and motion rules.** The mockup pass was skipped by decision; the palette below was supplied by the owner and the style is neobrutalism as characterised by NN/g — 2–3 bold colours, thick solid borders, hard offset shadows, generous padding, neutral body type, usability first. Contrast ratios in §4 are computed by `packages/shared/scripts/contrast.ts` and must stay ≥ AA.

---

## 1. Design principles

**1. An instrument, not an app.** PAWER is checked, not browsed. Closest relatives are a departure board or a thermostat — surfaces that answer one question at arm's length and then get out of the way. There is no feed, no engagement surface, and nothing to explore.

**2. Constraints are the aesthetic.** No gradient, no blur, no photograph, no custom typeface, no idle motion. These come from a hard low-resource requirement, and neobrutalism is the style that treats them as virtues: flat colour blocks, thick ink borders, hard offset shadows that are just a second box, decisive type, real negative space. Brutalist design fails when it is *timid*, not when it is blunt.

**3. Colour carries meaning, never alone.** Every state is identifiable by its word first. Colour reinforces; it never encodes. Someone who cannot distinguish the fills must lose nothing.

**4. Honesty is a visual property.** PAWER knows a published schedule, not the state of the grid. The interface must never be more confident than its data. A design that *feels* authoritative while reporting an inference is a design bug.

**5. Calm at rest, clear under pressure.** Most days nothing is scheduled, and the app should feel like reassurance rather than a dormant alarm. On the day of an outage it must be legible in a hurry, one-handed, possibly in the dark.

---

## 2. Voice and copy

PAWER speaks like a competent utility notice: plain, specific, unhurried. No exclamation marks, no emoji in UI text, no persuasion, no personality. Sentence case throughout.

### 2.1 The honesty table

This is the most important table in the document. PAWER reports a schedule, so its language must always be about expectation.

| Never write | Write instead |
|---|---|
| Power is out | Scheduled outage in progress |
| Power is back | Power should be restored by now |
| Restored at 4:00 PM | Expected restoration 4:00 PM |
| Outage confirmed | Scheduled by Visayan Electric |
| No outages | No scheduled outage today |
| Live | Last checked 2:14 PM |
| Up to date | Checked 6 minutes ago |
| You are safe | Nothing scheduled for your area |
| Your area loses power | Outage scheduled in part of Lahug |
| Your power goes out at 9 AM | Part of Lahug is scheduled 9:00 AM – 5:00 PM |

The pattern: **describe the schedule, not the world.** Where a word could imply direct observation of the grid, replace it.

A second pattern applies to place: **describe the barangay, not the address.** VECO de-energises *portions* of barangays, so every phrasing must be about part of an area rather than about the user's home (PRD FR-0a). `Part of Lahug`, never `your area`.

### 2.2 Formatting

| Element | Format | Example |
|---|---|---|
| Time | 12-hour, uppercase meridiem, no leading zero | `8:00 AM`, `10:30 PM` |
| Time window | En dash, spaced | `8:00 AM – 4:00 PM` |
| Cross-midnight window | Name both days | `10:00 PM Sun – 6:00 AM Mon` |
| Date, short | Abbreviated weekday and month | `Thu, Sep 3` |
| Date, today | The word | `Today` |
| Date, tomorrow | The word | `Tomorrow` |
| Duration | Hours and minutes, never decimal | `6h 10m` — **not** the source's `6.17hrs` |
| Duration, whole | Drop the minutes | `8h` |
| Barangay, unambiguous | Display name, no `Brgy.` prefix | `Lahug`, `Capitol Site` |
| Barangay, name shared across LGUs | Name, comma, LGU — **required**, never optional | `San Roque, Cebu City` · `San Roque, Liloan` |
| Freshness, recent | Relative | `Checked 6 minutes ago` |
| Freshness, old | Absolute | `Last checked Sep 1, 2:14 PM` |

**Duration conversion is a requirement, not a preference.** The source writes `(6.17hrs)`; decimal hours are not how people think about time. Convert on parse and never surface the raw form.

### 2.3 Required disclosures

Three statements must appear verbatim in substance, in the places listed:

| Statement | Onboarding | Settings | Widget |
|---|---|---|---|
| Source is Visayan Electric's published advisories | ✅ | ✅ | ✅ (compact) |
| PAWER is not affiliated with Visayan Electric | ✅ | ✅ | — |
| Emergency and unscheduled outages are not covered | ✅ | ✅ | — |

Onboarding wording for the third, or close to it:

> PAWER shows outages that Visayan Electric has scheduled in advance. It cannot tell you about sudden or emergency outages, and it does not know the real state of the grid — only what has been published.

---

## 3. Typography

**Two families ship with the app** (D-27). Hierarchy is carried by the family as much as by size, so the steps between levels are unmistakable.

**Getai Grotesk Display Black** (`Getai-Black`, weight 900) takes `display`, `title` and the PAWER logo — the text meant to shout. It is a 135-glyph display cut with **no `·`, `›`, `✓` or `✗`**, which is precisely why it never descends to the smaller sizes where those characters live.

**Aspekta** carries everything else, in three static instances cut from its variable `wght` axis: 400, 500, 700. It is SIL OFL licensed.

**Weight is expressed by the family, never by `fontWeight`.** React Native does not synthesize weights for custom fonts; asking Android for a weight it has no file for drops silently back to the system face. One file per weight, referenced by name.

| Token | Family | Size | Line height | Use |
|---|---|---|---|---|
| `display` | Getai Grotesk Black | 40 sp | 42 | Widget countdown, dashboard hero status |
| `title` | Getai Grotesk Black | 24 sp | 28 | Screen titles, the PAWER logo |
| `headline` | Aspekta 700 | 18 sp | 23 | Card time windows, buttons, section headers |
| `body` | Aspekta 400 | 15 sp | 21 | Verbatim advisory text, descriptions |
| `label` | Aspekta 500 | 13 sp | 17 | Barangay chips, list metadata, tags |
| `caption` | Aspekta 400 | 11 sp | 14 | Freshness, attribution, disclaimers |

**Rules.** Sizes in `sp`, never `dp` — user font scaling must work. Never more than three levels on one screen. Getai is capped at the two largest tokens; nothing below `title` may use it. Negative tracking is permitted on Getai only (`display` −0.8, `title` −0.4) because a display cut sets loose at size; Aspekta takes no tracking adjustment. No all-caps except the meridiem and section labels. Verbatim VECO text always renders at `body` 400, never emphasised or restyled, so quotation stays visually honest.

**Characters neither family carries.** `›`, `✓` and `✗` are drawn as bordered Views in `ui/Glyph.tsx` — never typed as text, where they would render as tofu.

**Font scaling to 200% (NFR-12).** Every layout must survive it. Cards grow vertically and never clip; the dashboard hero allows its status word to wrap to two lines; horizontal barangay chip rows wrap rather than scroll. The widget is the hard case — see §7.5.

---

## 4. Colour

### 4.1 One palette, one ink

Five brand tokens and five status fills. Everything is drawn in a single **ink** — `#212431` navy — for text, borders, and shadows alike. That single-ink rule is what makes the neobrutalist surfaces read as one system rather than a collection of coloured cards. There is **no dark theme** in v1; the widget uses the same tokens.

The **accent** `#EA5C1F` is the least-used and most-noticed colour in the app. It appears on exactly three things: the primary CTA of a screen, the add-area control, and the tour highlight ring. Nowhere else.

### 4.2 Brand tokens

| Token | Hex | Use |
|---|---|---|
| `ground` | `#F5F5F5` | Screen background |
| `surface-2` | `#D6D7D7` | Secondary blocks, disabled states, dividers rendered as blocks |
| `slate` | `#4F5D75` | Muted text, secondary chips, the tint behind stale/notice states |
| `ink` | `#212431` | **All** text, **all** borders, **all** shadows |
| `accent` | `#EA5C1F` | Primary CTA fill · add-area control · tour highlight. Large text only on it — see §4.4 |

### 4.3 Status fills

One fill per widget state. Text on every fill is `ink`.

| Token | Hex | State |
|---|---|---|
| `status.clear` | `#9BF06B` | `NONE_TODAY` — nothing scheduled |
| `status.upcoming` | `#FF90E8` | `UPCOMING_TODAY` — scheduled today, not started |
| `status.ongoing` | `#FF5C5C` | `ONGOING` — scheduled window active |
| `status.ended` | `#FFD93D` | `ENDED_TODAY` — today's window has passed |
| `status.notice` | `slate` at 15 % over `ground`, `slate` border | `STALE` overlay · `partial` / `failed` parse entries |

**On green.** v1.0 deliberately had no green, on the grounds that PAWER cannot know the power is on. Green is now the clear-state colour by owner decision. The honesty constraint moves entirely into copy: the fill may be green, but the words are still `No scheduled outage today`, never `Power is on` (§2.1).

### 4.4 Contrast

WCAG AA, single theme: **4.5:1** for `body`, `label`, `caption`; **3:1** for `headline` and above. `ink` on each fill:

| Pair | Ratio | Verdict |
|---|---|---|
| `ink` on `ground` | 14.15 : 1 | body ✓ |
| `ink` on `status.clear` | 11.07 : 1 | body ✓ |
| `ink` on `status.ended` | 11.20 : 1 | body ✓ |
| `ink` on `status.upcoming` | 7.64 : 1 | body ✓ |
| `ink` on `status.ongoing` | 5.10 : 1 | body ✓ |
| `ink` on `surface-2` | 10.70 : 1 | body ✓ |
| `ink` on `accent` | 4.44 : 1 | **large text only** |
| `ground` on `accent` | 3.18 : 1 | **large text only** |
| `slate` on `ground` | 6.11 : 1 | body ✓ |

The accent therefore carries **button labels at `headline` or larger** and never body copy. Figures are the output of `packages/shared/scripts/contrast.ts` (WCAG 2.x relative luminance); that script is the authority and fails the build below AA.

### 4.5 Stale is a treatment, not a colour

`STALE` overlays whatever state applies (§7.2):

1. Border switches from solid `ink` to **dashed `slate`**, 2 dp.
2. The state fill is drawn at 60 % over `ground`.
3. An explicit `caption`: `Data may be outdated — last checked Sep 1`.

---

## 5. Layout system

Neobrutalist structure: everything is a bordered block sitting on the ground, separated by space and by its own hard shadow — never by elevation, blur, or hairlines.

| Token | Value |
|---|---|
| Spacing base | 4 dp — scale `4, 8, 12, 16, 24, 32` |
| Screen margin | 20 dp |
| Card padding | 24 dp |
| Card gap | 12 dp |
| **Border** | **2 dp `ink`**, on every card, button, input, chip |
| **Shadow** | **`ink` box, offset (4 dp, 4 dp), zero blur, zero radius** — a second rectangle behind the block |
| Radius | 0–4 dp. Default 2 dp. Never more |
| Min touch target | 48 × 48 dp |
| Min supported width | 320 dp |

**The shadow is a rectangle, not an effect.** It is drawn as a sibling view offset by `(4,4)` in `ink`, so it costs a layout pass and nothing on the GPU — which is what makes it compatible with the low-resource rule that forbids blur and elevation.

**Pressed state is physical.** A pressed block translates `(4,4)` and its shadow offset collapses to `(0,0)`: the block goes *into* the page. Release reverses it. This is the `press` animation in §11, and it is the only feedback buttons need — no colour shift, no ripple.

### 5.1 Iconography

No icon library. A **maximum of six hand-authored vector drawables** (XML paths): clock, calendar, bell, warning triangle, chevron, external link. Single-path, `ink`-tinted, 24 dp, **2.5 dp stroke** to match the border weight. Everything else is type.

No icon may be the sole carrier of meaning; each pairs with a text label.

---

## 6. Screens

### 6.1 Onboarding and guided tour

Flow, screen order, and full copy live in **ONBOARDING-AND-TOUR.md**. This section governs only their visual treatment.

**Five onboarding screens**, then the dashboard in its empty state, then an eight-step guided tour. No barangay is selected during onboarding — selection happens in the tour, so the flow never performs the same action twice.

- **One idea per screen.** A `title`, at most three lines of `body`, one primary action. No illustration, no progress dots, no carousel.
- **Screens are typographic, not decorative.** They sit on `bg` with no card, no state fill, and no accent colour. Onboarding is the calmest surface in the app; it has no status to report.
- **The coverage screen (S3) is the exception** and may use `notice` fill for its ✗ line — the one place onboarding needs visual weight, because it is the disclosure the product's honesty rests on.
- **The optional name field** gets a standard text input and an equally weighted `Skip`. A skip styled as secondary reads as discouragement.

**Guided-tour coach marks:** dim the surrounding UI with a flat scrim, never a blur, and keep the highlighted control at full opacity and fully interactive. One `body` line of guidance, one primary action, and a persistent `Skip tour` in `label`. The tour must be exitable at every step and re-runnable from Settings.

**Barangay picker** (used in tour step T2, and again in Settings): search field pinned at top filtering all 232 at once, with the eight LGU groups collapsed beneath for browsing. Multi-select with checkmarks; selections collect into a chip row above the fold. Ambiguous names always carry their LGU — `San Roque, Liloan`, never bare (§2.2). Helper `caption` under the search field: *"Your barangay is printed on your Visayan Electric bill."* From the fifth selection, one `caption` line notes that alerts will be frequent — information, not a warning: no `notice` fill, no icon, and it never blocks.

**Map confirmation** (T4): the fetched locator image in a `12 dp` radius container at 2:1.25, barangay name in `headline` beneath, and the approximation caveat in `caption`. The caveat is **required**, not decorative — a pin without it claims address-level precision the data does not have. If the image fails to load, the container collapses entirely rather than showing a placeholder, and confirmation proceeds on the name alone.

### 6.2 Dashboard

```
┌─────────────────────────────────┐
│ PAWER          Checked 6 min ago│  header: title + caption
├─────────────────────────────────┤
│                                 │
│  TODAY                          │  label, on state fill
│  Scheduled outage               │  display
│  in progress                    │
│                                 │
│  Expected restoration 4:00 PM   │  headline
│  2h 14m remaining               │  label
│                                 │  ← hero status field, full-bleed
├─────────────────────────────────┤
│ UPCOMING                        │  label
│ ┌─────────────────────────────┐ │
│ │ Thu, Sep 3                  │ │  headline
│ │ 9:00 AM – 5:00 PM · 8h      │ │  body
│ │ [Lahug] [San Roque]         │ │  label chips
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ Fri, Sep 4 …                │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ Browse all areas             ›  │  label — single link, foot of page
├─────────────────────────────────┤
│ Source: Visayan Electric        │  caption
│ Not affiliated with VECO        │  caption
└─────────────────────────────────┘
```

**The hero status field is the whole design.** A full-width bordered block on the state fill with the standard `(4,4)` `ink` shadow, tall enough to be unambiguous on opening — roughly 40% of viewport height. It `stamp`s on every state change (§11). It mirrors the widget's state machine exactly, so the two surfaces never disagree.

**Empty state** reads as reassurance: `clear` fill, `No scheduled outage today` at `title`, and beneath it the next upcoming date if one exists. Never an illustration, never an empty-box graphic, never the word "error".

**Incomplete entries** (`partial` / `failed`) appear in the upcoming list on `notice` fill, labelled `Couldn't read this advisory fully`, with a `View on Visayan Electric` link. They are always shown — a hidden entry is a missed outage.

### 6.3 Detail sheet

Reached by tapping an upcoming card. Structured summary at top — date, window, duration, barangay chips — then a labelled `From Visayan Electric` block containing the verbatim `Areas Affected` and `Purpose` text at `body` 400, visually quoted by a 2 dp `accent` left rule. Footer: `View original post`.

Verbatim text is never reformatted, corrected, or truncated. Its typos are VECO's, and silently fixing them would misrepresent the source.

### 6.4 All areas

A secondary screen, reached from one link at the foot of the dashboard (PRD FR-7b). Search field over all 232 barangays; results are the same upcoming cards as the dashboard, grouped by date. Empty query lists everything chronologically.

Two rules keep it from competing with the dashboard:

- **No status hero.** This screen answers "what is happening anywhere", not "what is happening to me". Reproducing the status card here would blur the distinction the whole layout depends on.
- **No subscribe affordance.** Viewing a barangay here must not offer a one-tap subscribe (PRD FR-7c). Adding an area stays in Settings, so the alert set can only change deliberately. A card for a barangay the user *does* follow may carry a quiet `label` marker; that is the extent of the connection.

Cards for barangays with names shared across LGUs must show the LGU — this screen spans the whole franchise, so `San Roque` alone is genuinely ambiguous here in a way it never is on the dashboard.

### 6.5 Settings

Flat list, no nesting: my areas (chip row, tap to edit) · four notification toggles · data freshness with a manual refresh · check for updates with current version · about, containing source attribution, non-affiliation, the coverage limitation, and the reliance disclaimer.

---

## 7. Widget

One widget, one size: **2×2**, roughly 140–160 dp square in practice. This is the primary surface — most users will never open the app — and it holds about four lines of usable text. Every state must earn each line.

### 7.1 Grid

```
┌───────────────────┐
│ TODAY             │  caption, ink @ 70%
│                   │
│ 2h 14m            │  display, ink — countdown or status
│                   │
│ until 4:00 PM     │  label, ink
│ Lahug             │  caption, ink @ 70%
└───────────────────┘
   12 dp padding, state fill, 2 dp ink border, 2 dp radius
```

### 7.2 State content

`STALE` is absent from this table by design — it is an overlay on whichever row applies (§4.4), not a sixth content layout.

| State | Line 1 | Line 2 (`display`) | Line 3 | Line 4 |
|---|---|---|---|---|
| `NONE_TODAY`, none upcoming | `TODAY` | `Clear` | `No scheduled outage` | barangay |
| `NONE_TODAY`, one upcoming | `NEXT` | `Thu` | `9:00 AM – 5:00 PM` | barangay |
| `UPCOMING_TODAY` | `TODAY` | countdown `3h 20m` | `until 9:00 AM` | barangay |
| `ONGOING` | `NOW` | countdown `2h 14m` | `until 4:00 PM` | barangay |
| `ENDED_TODAY` | `TODAY` | `Restored` | `Should be back by now` | barangay |

`Restored` is acceptable at `display` only because line 3 immediately qualifies it. If line 3 cannot render, line 2 must fall back to `Ended`.

**Multiple barangays** show the count instead of names: `3 areas`. **Multiple interruptions today** resolve per PRD FR-23, and line 1 becomes `TODAY 1/2`.

**Ambiguous names still get their LGU** (PRD FR-2b), even at this size — `San Roque, Liloan` rather than `San Roque`. Line 4 is the first thing dropped when space runs short (§7.5), so the cost of the longer string is a dropped line rather than a wrong one. A widget that omits the area is honest; a widget naming the wrong San Roque is not.

### 7.3 Countdown

Rendered by the Android `Chronometer` in count-down mode, ticking without any app wakeup (PRD FR-25). Format `H:MM` above an hour, `MM:SS` below. Because the system owns the tick, the widget's own redraws happen only at state boundaries.

### 7.4 Theming

Single light theme, so no day/night qualifiers are needed. Tokens match §4 exactly, so the widget and dashboard never disagree on colour. The widget draws the 2 dp `ink` border but **omits the hard shadow** — launcher wallpapers vary, and a navy rectangle offset against an unknown background reads as a glitch rather than a shadow.

### 7.5 Font scaling in the widget

The hard case. `android:autoSizeTextType` requires API 26, above our API 24 floor, so:

- **API 26+** — autosize `display` between 20 sp and 40 sp.
- **API 24–25** — fixed `display` at 28 sp with `maxLines="1"` and `ellipsize="none"`, and line 4 dropped when the estimated content width exceeds the widget.

Priority order when space runs out: **line 2 survives always**, then line 3, then line 1, then line 4. A widget reduced to its countdown is still doing its job.

---

## 8. Notifications

Plain Android notifications on a single channel, `Scheduled outages`, at default importance. No custom sound, no vibration pattern, no full-screen intent, no ongoing or sticky notification. One channel keeps system settings comprehensible; per-type control lives in PAWER's own Settings (PRD FR-29).

| Event | Title | Body |
|---|---|---|
| New advisory | `New outage scheduled — Lahug` | `Thu, Sep 3 · 9:00 AM – 5:00 PM (8h)` |
| Evening before | `Outage tomorrow — Lahug` | `9:00 AM – 5:00 PM · 8h` |
| One hour before | `Outage in about an hour — Lahug` | `Starts 9:00 AM, expected until 5:00 PM` |
| Expected restoration | `Power should be restored — Lahug` | `Scheduled outage ended 5:00 PM` |

**"in about an hour"** is deliberate. Inexact alarms (PRD FR-33) mean this fires within a few minutes of the hour mark, and the copy must not promise precision the delivery mechanism cannot provide.

Multi-barangay notifications name the count, not a list: `New outage scheduled — 3 areas`. Tapping any notification opens the dashboard.

---

## 9. Accessibility

| Requirement | Standard |
|---|---|
| Contrast | WCAG AA — 4.5:1 body, 3:1 large. Computed by `contrast.ts`, single theme |
| Colour independence | Every state readable in greyscale; the word always carries the meaning |
| Font scaling | Correct to 200% on every screen |
| Touch targets | 48 × 48 dp minimum |
| Screen readers | Content descriptions on all six icons and on the hero field. The status announces as a sentence — `Today, scheduled outage in progress, expected restoration 4:00 PM` — not as fragments |
| Motion | Every §11 animation reads the system reduce-motion setting and collapses to a 0 ms cut. No information is carried by motion alone |
| Widget | Content description mirrors the full status sentence |

Accessibility here is unusually cheap: no animation, no custom controls, no gesture-only actions, no colour-only encoding, system font throughout. The constraints did most of the work.

---

## 10. What this design deliberately excludes

Splash screen · onboarding carousel or illustrations · bottom navigation or tab bar (the All-areas view is a link at the foot of the dashboard, never a tab — PRD FR-7b) · a status hero on the All-areas screen · one-tap subscribe from browse · pull-quotes, hero imagery, or decorative graphics · map rendering · charts or outage history visualisation · dark mode in any form · looping, idle, or decorative motion · fades, springs, parallax, skeleton shimmer · haptics · badges or streaks · share sheet · in-app rating prompt · anything that would make PAWER feel like a product rather than an instrument.

---

## 11. Animation vocabulary

Motion in PAWER is a **vocabulary**, not a polish layer. Every animation has one name, one meaning, one trigger, and one spec — and nothing animates that does not mean something. This is what lets motion coexist with the low-resource rule: there is no idle animation, no loop, no decorative transition, and every entry below is transform- or opacity-only on the UI thread.

**Global rules**

- Transform and opacity only. Never layout, colour, or size animation.
- **≤ 240 ms.** Nothing longer.
- **Linear or stepped timing.** No ease-in-out, no springs beyond a single overshoot. The choppiness is the style.
- Reduce-motion on → every entry becomes a **0 ms cut**. Meaning is always carried by the end state, never by the motion.
- **Nothing animates in the widget.** `RemoteViews` cannot, and the Chronometer's tick is the system's.

| Name | Meaning | Trigger | Spec |
|---|---|---|---|
| **`stamp`** | *A status was resolved or updated* | Hero field state change; widget-mirror card | scale 1.08 → 1.0 and shadow offset (0,0) → (4,4), **160 ms linear**. The block lands on the page |
| **`slam`** | *Something was added* | Barangay added; new upcoming card enters | translateY −16 → −6 → 0 in **3 discrete steps** over 150 ms; shadow snaps in on the final step |
| **`press`** | *You pressed this* | Any button, down and up | translate (0,0) → (4,4) and shadow (4,4) → (0,0), **80 ms**; release reverses. The only button feedback |
| **`tear`** | *Removed* | Chip or area removed; prompt dismissed | translateX 0 → +8 → +16 → +24 in 3 steps, opacity 1 → 0 on the last, 180 ms |
| **`tick`** | *Checking for data* | Refresh begins | Freshness caption rotateX 0 → −90 → 0, 120 ms — a card flip |
| **`bump`** | *Data changed* | Refresh returned new content | The changed number or text jumps translateY −6 → 0 in **2 frames** |
| **`judder`** | *That didn't work* | Fetch failed; invalid input; permission denied | translateX ±3 dp, three cycles, 240 ms |
| **`slide`** | *Moving between screens* | Every stack navigation | The **native** stack animation: a pushed screen enters from the right and settles left, back reverses it. The platform owns the timing and its decelerate (ease-out) curve, so it runs on the UI thread at no cost to us (NFR-4). Not a hook — set once in `app/_layout.tsx`. Replaces the former `wipe`. |
| **`spot`** | *Look here* | Tour coach mark moves to a new target | Spotlight **hard-cuts** (0 ms) to the new target, then the target receives a `stamp` |
| **`count`** | *Live countdown* | Hero countdown | **No animation.** Text updates once per second, mirroring the widget's Chronometer |

**Forbidden:** fades · crossfades · springs with more than one overshoot · parallax · skeleton shimmer · pulsing · anything on a loop · anything in the widget · animating colour · animating layout.

**Implementation contract.** Each entry is a single hook in `app/src/theme/motion.ts` (`useStamp`, `useSlam`, `usePress`, …) built on Reanimated worklets. Every hook reads the reduce-motion setting once and sets its duration to 0 when enabled. No screen defines its own animation; it composes these ten.

---

## 12. Sound vocabulary

Two sounds, each bound to one meaning, each paired with the motion it accompanies. Nothing else in the app makes a sound; notifications keep the system default (§8).

| Name | Meaning | Paired motion | Trigger | Asset |
|---|---|---|---|---|
| **`areaAdded`** | *A barangay was added* | `slam` | Picker confirm; tour T4 "Yes, add it" | `assets/sounds/area-added.mp3` (21 KB) |
| **`statusChanged`** | *The hero resolved to a new state* | `stamp` | Any `NONE_TODAY` ↔ `UPCOMING_TODAY` ↔ `ONGOING` ↔ `ENDED_TODAY` transition while the app is open | `assets/sounds/status-change.mp3` (50 KB) |

**Rules**

- A sound never plays without its state change, and never on first render.
- Device silent mode is respected (`playsInSilentMode: false`); other audio is mixed with, never interrupted; nothing plays in the background.
- One **Sounds** toggle in Settings, on by default. Reduce-motion does not silence sounds — they are independent channels of the same meaning.
- The two MP3s are the only audio assets and, with the notification icon, the only bundled assets beyond the launcher icon (PRD NFR-5). Total 71 KB.
- The widget makes no sound. It cannot, and it should not.
