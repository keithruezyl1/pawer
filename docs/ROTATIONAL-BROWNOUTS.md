# PAWER — Rotational Brownouts, Confidence and Alerts

| | |
|---|---|
| **Version** | 0.1 |
| **Date** | 5 September 2026 |
| **Status** | Draft for approval — nothing here is built |
| **Supersedes** | D-1 in part (website as the only source), FR-19 (alert set), DG §4 (status colours) |
| **Depends on** | Facebook retrieval (§7), which has no sanctioned path today |

---

## 1. Why this document exists

On 4 September 2026 Visayan Electric published a rotational-brownout advisory to Facebook that
PAWER cannot represent, cannot ingest, and — worse — actively contradicts.

The app's onboarding tells every new user:

> Sudden outages. Visayan Electric doesn't publish those ahead, so PAWER can't warn you.

That is now false, and it ships today. VECO publishes rotational brownouts days ahead, updates
their status hourly, and does all of it on Facebook. Correcting the copy is the smallest change in
this document; representing what the copy would then have to promise is the rest of it.

This spec covers the data model, the status machine, the colour reallocation, the alert model and
the ingestion work. It does **not** cover maps (§10).

---

## 2. What the new data actually is

Three classes, none of which PAWER models. All quotations are from posts observed on 4 September
2026, after NFKC normalisation (§7.2).

### 2.1 Possible rotational brownouts

> **ADVISORY: REVISED POSSIBLE ROTATIONAL BROWNOUTS**
> **DAILY | SEPTEMBER 3-6, 2026 · 10:00AM–11:00PM**
> Due to the current power supply situation … A **2.5-hour rotational brownout** *may be
> implemented* in selected areas during periods of high demand … Implementation will depend on
> prevailing grid conditions and the latest instructions from the National Grid Corporation of the
> Philippines (NGCP) and may be adjusted as needed.

Load shedding under an NGCP Red Alert, not maintenance. **Conditional** — it may not happen. The
website carries none of it.

### 2.2 Hourly status updates

> **UPDATE #6: ROTATIONAL BROWNOUT STATUS**
> 🔴 **ONGOING ROTATIONAL BROWNOUT** — 3:00PM–5:30PM …
> 🟢 **RESTORED AREAS** — 6:00PM–8:30PM | SEPTEMBER 4, 2026 …

Live state, arriving roughly hourly, numbered. This is the first data PAWER has ever had that
says what is *actually* happening rather than what was *planned*.

### 2.3 Revisions

`REVISED` in the title, superseding an earlier advisory for the same dates. The amendment case
that motivated looking at Facebook at all.

### 2.4 The measured shape of it

Counted from the 4 September advisory, one day of it:

| | |
|---|---|
| Groups (time window × area list) | 32 |
| Distinct time windows | 16 |
| Duration of each | 2.5 hours |
| Days covered | 4 (`DAILY | SEPTEMBER 3-6`) |
| Worst-hit barangays | Camputhaw, Lahug, Sambag 1 — **6 windows/day**, 24 across the advisory |
| Median barangay | **1 window/day** |

The distribution matters more than the total: most users see one window a day, a minority see six.
Every design decision below is for that tail.

---

## 3. Model changes

### 3.1 Confidence

`Outage` gains one field:

```ts
/** Whether VECO committed to this or merely warned of it. Absent means "scheduled" (legacy). */
confidence: "scheduled" | "possible";
```

`scheduled` is every outage PAWER has ever handled: a maintenance interruption VECO has committed
to. `possible` is a rotational brownout that may not be implemented.

This is one field rather than a separate record type because everything else — areas, window,
duration, source — is identical, and every consumer already handles `Outage`.

### 3.2 Confirmation

The hourly updates report fact, not plan. That is a second axis and must not be conflated with
the clock:

```ts
/** Set only when VECO has SAID so in a status update. Never inferred from the time. */
confirmed?: { state: "ongoing" | "restored"; at: string };
```

Without this, "it is 4pm and the window was 3–5:30pm" and "VECO says this area is out" are
indistinguishable, and they are not the same claim. One is arithmetic; the other is testimony.

### 3.3 Status machine

`WidgetStateName` gains two members:

```ts
type WidgetStateName =
  | "NONE_TODAY" | "UPCOMING_TODAY" | "ONGOING" | "ENDED_TODAY"
  | "POSSIBLE_TODAY"   // a possible brownout later today
  | "RESTORED";        // VECO has confirmed power is back
```

Resolution order, highest precedence first:

| # | Condition | State |
|---|---|---|
| 1 | `confirmed.state === "ongoing"` | `ONGOING` |
| 2 | now inside the window, `confidence === "scheduled"` | `ONGOING` |
| 3 | now inside the window, `confidence === "possible"` | `POSSIBLE_TODAY` |
| 4 | `confirmed.state === "restored"`, same day | `RESTORED` |
| 5 | window later today, `scheduled` | `UPCOMING_TODAY` |
| 6 | window later today, `possible` | `POSSIBLE_TODAY` |
| 7 | window ended today, no confirmation | `ENDED_TODAY` |
| 8 | otherwise | `NONE_TODAY` |

Rule 3 is the important one. A possible brownout during its own window stays **yellow**, not red,
because we genuinely do not know. Rule 1 is what promotes it to red — VECO saying so, not the
clock. That escalation is exactly what the hourly updates are for, and it is the first time PAWER
can tell a user something it actually knows rather than something it read.

### 3.4 Identity across sources

Today `id = sha256(source_post_url + start + end + areas_raw)`. Two sources publishing the same
outage produce two ids and the user sees it twice.

Identity must become source-independent:

```
id = sha256(start + end + normalised sorted barangay slugs)
```

with `sources[]` replacing the single `source_post_url`, and the most recently published source
winning on conflict. This also makes a revision detectable: same window, same areas, new post — one
outage, updated. Different window — a genuinely new outage.

> **Consequence.** Every stored id changes once. `notified.json` keys on id, so the migration must
> map old ids forward or the first run after deploy re-notifies everyone about everything. This is
> the single most dangerous change in this document.

---

## 4. Colour reallocation

Keith's decision, 5 September 2026. Yellow moves from *ended* to *possible*; restored joins green.

| Colour | Hex | Was | Becomes |
|---|---|---|---|
| 🟢 green | `#9BF06B` | `NONE_TODAY` | `NONE_TODAY` · `ENDED_TODAY` · `RESTORED` — **you are fine** |
| 🟡 yellow | `#FFD93D` | `ENDED_TODAY` | `POSSIBLE_TODAY` — **it might happen** |
| 🩷 pink | `#FF90E8` | `UPCOMING_TODAY` | unchanged — **it will happen** |
| 🔴 red | `#FF5C5C` | `ONGOING` | unchanged — **it is happening** |

The four now read as a confidence ramp, which is what this data needs.

**Two things this costs, recorded deliberately:**

Green stops distinguishing "no outage today" from "there was one, it should be back". If a user's
power is off during the second, that is a fault worth reporting and the colour no longer hints at
it. The copy carries the distinction (§5); the colour does not.

Green and yellow are the classic pair that converge under deuteranopia. No state is colour-only —
every one carries copy — so nothing is lost, but the widget's glance value is reduced for those
users more than for others.

---

## 5. Copy

| Where | Now | Becomes |
|---|---|---|
| Onboarding S3 | "Sudden outages. Visayan Electric doesn't publish those ahead, so PAWER can't warn you." | Must change. It is false. Proposed: "Rotational brownouts, when the grid is short. These are *possible*, not certain, and PAWER says which." |
| Hero, `POSSIBLE_TODAY`, before | *(no state)* | "Brownout possible" · `10:00 AM – 12:30 PM` · "May not happen. Depends on the grid." |
| Hero, `POSSIBLE_TODAY`, during | *(no state)* | "Brownout possible now" · "VECO hasn't confirmed one in your area" |
| Hero, `RESTORED` | *(no state)* | "Power restored" · "VECO confirmed at 5:34 PM" |
| Hero, `ENDED_TODAY` | "Power should be restored by now" | unchanged — still an inference, and still says so |

The distinction between rows 4 and 5 is the honesty of the whole feature: one is VECO's word, the
other is our arithmetic, and they must never read the same.

**Never write "possible" as a hedge on a scheduled outage.** The word has to keep meaning exactly
one thing or it means nothing.

---

## 6. Alerts

### 6.1 The principle

> Accuracy and urgency, with volume in mind.
> — Keith, 5 September 2026

Stated as a rule: **notify when a fact that affects this user changes, and never for a fact that
has not changed.** Volume is controlled by materiality and deduplication, never by throttling
something that is genuinely news. This generalises to emergency and unplanned outages, which is
where it will matter most.

### 6.2 What is material

| Event | Notify | Why |
|---|---|---|
| New advisory names your barangay | Yes, once per advisory | The day's news |
| A window you are in is confirmed **ongoing** | Yes | Fact, not forecast |
| A window you are in is confirmed **restored** | Yes | Actionable, and good news |
| An existing window's **time or areas change** | Yes | The amendment case that started this |
| A window is starting soon | Yes, subject to §6.3 | Urgency |
| Re-post of identical content | **No** | Not news |
| A status update that does not name your barangay | **No** | Not yours |

### 6.3 The one suppression rule

Camputhaw's windows on 4 September: 10:00, 12:00, 12:30, 3:00, 3:30, 6:00. Two pairs are **30
minutes apart**, so an "hour before" alert for the 12:30 window fires while the 12:00 window is
still running.

> **Rule.** Do not send a "starting soon" alert for a window that begins while the user is already
> inside another window. Send one when the run ends.

This is materiality, not throttling: telling someone their power may go out while it is already
out is not news. It is the only suppression in this spec.

### 6.4 Volume under these rules

Worst case, a Camputhaw user on an advisory day: 1 advisory alert + up to 4 "starting soon" (6
windows less 2 suppressed by §6.3) + confirmations and restorations. Roughly **8–10 in a day**.

Median user: **1–2**.

Recorded so it is a decision rather than a surprise. Both numbers should be re-measured against a
real advisory before release.

### 6.5 FCM topics must split

Today: one topic per barangay, `veco.v1.{slug}`.

Filtering client-side would wake the phone for messages the user has switched off, which is the
battery cost the whole design exists to avoid (NFR-4). The preference must control
**subscription**:

```
veco.v1.{slug}.scheduled     maintenance interruptions
veco.v1.{slug}.brownout      rotational brownouts and their status updates
```

Migration: existing installs are subscribed to `veco.v1.{slug}` and must be moved on first launch
after upgrade, subscribing to the new pair and unsubscribing from the old.

### 6.6 A fifth alert toggle

The four (`newAdvisory`, `eveningBefore`, `hourBefore`, `restoration`) fit none of this; without a
fifth, brownouts fire all four.

```ts
alerts: { …existing, rotationalBrownout: boolean }   // default: on
```

`restoration` becomes real for the first time. It was specified for data that did not exist until
now.

---

## 7. Ingestion

### 7.1 Retrieval — unsolved

There is no sanctioned path. Meta's Graph API cannot read a Page you do not own without
`Page Public Content Access`, which needs App Review and is granted narrowly. Scraping is against
Meta's terms and technically defended: the observed post interleaves **10× U+034F COMBINING
GRAPHEME JOINER** into scrambled characters in the byline (`Srneotdosp` → "Sponsored"). Post
bodies are clean; metadata is not.

Options, in the order I would pursue them:

| | Path | Autonomous | Cost | Risk |
|---|---|---|---|---|
| A | Meta App Review for Page Public Content Access | Yes | $0 | Likely rejected; slow |
| B | Managed scraping vendor called from the existing cron | Yes | Low single digits/month | ToS-grey; breaks when Meta changes markup |
| C | DIY scraping from GitHub Actions | No | $0 | Blocked within hours; a maintenance treadmill |
| D | Ask VECO for a feed | Yes | $0 | Long shot, zero downside |

**B is the only one autonomous this month.** A and D should run in parallel. C is not recommended.

Whichever path, retrieval failure must fall back to website-only and file an issue on the existing
ops surface. "Autonomous" means the system tells you the one time it cannot cope — not that you
watch Facebook.

### 7.2 Parsing — mostly solved already

The post body is Unicode mathematical bold. `normalizeText` already runs NFKC, which resolves it:

```
𝟏𝟎:𝟎𝟎𝐀𝐌-𝟏𝟐:𝟑𝟎𝐏𝐌  →  10:00AM-12:30PM
```

**No OCR is required.** The schedule is in the text, not the poster image.

The area grammar is a third form — `Portion of <LGU>: <list>` — and today's matcher already reads
it. Measured against the 4 September post: **28 of 34 areas matched untouched**. Every miss is an
alias variant, which COVERAGE-GLOSSARY §3.2 predicted:

| VECO writes | Registry has | Fix |
|---|---|---|
| `Sambag 1`, `Sambag 2` | `Sambag I`, `Sambag II` | Arabic ↔ Roman aliases |
| `Ward 1`, `Ward 2`, `Ward 4` | `Poblacion Ward I/II/IV` | Arabic ↔ Roman aliases |
| `Calajoan` | `Calajo-an` | Hyphen-insensitive alias |
| `Duljo (Duljo Fatima)` | `Duljo` | Parenthetical alias |

A day's work, and it improves the website feed too.

### 7.3 New parsing work

- **Window lists.** One post carries 16 windows × N area groups. The website has one window per
  entry. The segmenter needs a second mode.
- **`DAILY | SEPTEMBER 3-6`.** One post expands to 4 days × 16 windows. Expansion must be explicit
  and bounded.
- **Status updates.** `ONGOING` / `RESTORED` sections resolve to existing outages by window and
  area, and set `confirmed` (§3.2). An update matching no known outage must be reported, never
  guessed at.

---

## 8. What this does not cover

- **Maps.** Separate spec. Note only that VECO publishes a per-group map to Google Drive
  (`tinyurl` → `drive.google.com/file/d/…`), which may be usable and may not be hotlinkable.
- **Unplanned outage reports from users.** Needs a backend and moderation.
- **Historical archive.** Independent of this, and cheaper (git already holds every version).

---

## 9. Open decisions

| # | Question | Needs |
|---|---|---|
| 1 | Onboarding S3 replacement wording — proposed in §5, not approved | Keith |
| 2 | `RESTORED` — its own state, or `ENDED_TODAY` with a confirmation flag? Both render green | Keith |
| 3 | Retrieval path (§7.1). B is the only autonomous one and it bends the $0 constraint | Keith |
| 4 | Does `rotationalBrownout` default **on**? It is the noisiest alert and the most useful | Keith |
| 5 | Id migration (§3.4) — map old ids forward, or accept one re-notification storm | Design |

---

## 10. Sequencing

Each step is useful alone and none blocks on §7.1.

1. **Aliases** (§7.2). A day. Fixes 6 of 34 misses and improves the website feed. No dependencies.
2. **Copy** (§5). Onboarding S3 is false today and does not need any of the rest to be fixed.
3. **Model and colours** (§3, §4). Confidence, confirmation, the two new states, the reallocation.
   Testable against fixtures with no new data source.
4. **Alerts** (§6). Topic split, fifth toggle, materiality rule, migration.
5. **Retrieval** (§7.1). Last, because it is worthless until 3 and 4 can represent what it returns —
   and because it is the only step that may prove impossible.

Steps 1 and 2 are worth doing whatever happens to the rest.
