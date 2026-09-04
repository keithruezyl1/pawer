# PAWER — Business Requirements Document

| | |
|---|---|
| **Version** | 1.0 |
| **Date** | 2 September 2026 |
| **Status** | Approved |
| **Nature** | Free public-service application; secondary purpose as a portfolio artifact |
| **Revenue model** | None. No ads, no subscriptions, no data monetisation |
| **Budget** | ₱0 / $0 recurring |

---

## 1. Business context

Visayan Electric is the second-largest electric distribution utility in the Philippines. Its franchise covers **eight** local government units in Metro Cebu — the cities of Cebu, Mandaue, Talisay, and Naga, and the municipalities of Liloan, Consolacion, Minglanilla, and San Fernando — an area of roughly 672 km² with an estimated population of 1.73 million. It publishes scheduled service-interruption advisories weekly, typically three days in advance.

**Lapu-Lapu City and Cordova are outside the franchise** and are served by a different distribution utility. They are therefore outside PAWER's scope entirely, and must not appear in the barangay picker. See ARCHITECTURE.md §5.6.

Those advisories are complete, accurate, and effectively unusable at the individual level. They arrive as prose covering 25–35 interruptions at once, distributed primarily through a Facebook page whose ranked feed offers no location filtering, no notification capability, and no guarantee that the post reaches the households it concerns.

**The business opportunity is not informational — it is one of accessibility.** The value PAWER creates is entirely in the transformation: taking correct information trapped in a high-noise, engagement-optimised channel and delivering it as a targeted, low-noise, glanceable utility. PAWER produces no new information whatsoever. It changes only who can act on it.

### 1.1 Why the underlying data source is durable

Philippine distribution utilities operate under Energy Regulatory Commission rules that require advance public notice of scheduled service interruptions. The weekly advisory therefore exists to satisfy a regulatory obligation, not as a discretionary communications choice — which makes it substantially more likely to persist than a marketing channel would be.

**BA-1 (assumption to verify).** The specific regulatory instrument and its notice-period requirement should be confirmed before publication, so that PAWER's documentation describes it accurately. The business conclusion — that a regulated disclosure is a more dependable foundation than a social media page — holds regardless of the exact citation.

---

## 2. Business objectives

| ID | Objective | Measure |
|---|---|---|
| BO-1 | Make scheduled interruption information actionable for Metro Cebu residents at barangay granularity | A user can determine their status in under 2 seconds without opening the app |
| BO-2 | Operate at permanently zero recurring cost | $0/month verified against every platform's free tier (§5) |
| BO-3 | Require effectively no ongoing operator attention | ≤ 1 maintenance action per month |
| BO-4 | Introduce no legal, contractual, or reputational liability | No terms-of-service violation; no personal data processed; no trademark use |
| BO-5 | Serve as a demonstrable engineering portfolio artifact | Public repository, documented decisions, test-covered parser, reproducible build |
| BO-6 | Remain trustworthy under degradation | When the pipeline fails, the app tells the user rather than showing stale or invented data |

### 2.1 Where the two purposes conflict

The civic and portfolio objectives are mostly aligned — a public repository is required for the portfolio and simultaneously grants unlimited free CI minutes, which serves BO-2. One genuine tension exists, and it is resolved in advance:

> **Resolution.** Where portfolio impressiveness and user trust conflict, user trust wins. PAWER will not add features that demonstrate technical range (machine-learning classification, crowdsourced reporting, live grid inference, interactive mapping) at the cost of accuracy, battery, or honesty. The portfolio value of this project is intended to lie in its restraint and its correctness, not in its surface area.

---

## 3. Stakeholders

| Stakeholder | Interest | Involvement |
|---|---|---|
| **Metro Cebu residents** | Timely, accurate, low-noise outage information | End users. Not consulted formally; no analytics collected, so feedback arrives only through direct channels |
| **Maintainer** | Portfolio value, minimal operational burden, zero cost | Sole owner, developer, and operator |
| **Visayan Electric** | Accurate representation of its advisories; protection of its marks | **Non-participating third party.** No agreement, endorsement, or communication is assumed. PAWER consumes only public information |
| **GitHub** | Acceptable-use compliance | Platform dependency: CI, static hosting, APK distribution |
| **Google (Firebase)** | Acceptable-use compliance | Platform dependency: push messaging only |

**BR-1.** PAWER must function correctly and indefinitely without any cooperation, permission, or acknowledgement from Visayan Electric.

**BR-2.** Should Visayan Electric request changes or removal, the project must be able to comply quickly. The maintainer retains sole control of distribution, and the app's non-affiliation notice must be prominent enough that no reasonable user believes it is an official product.

---

## 4. Business requirements

### 4.1 Product

| ID | Requirement |
|---|---|
| BR-3 | Scope is limited to Visayan Electric's Metro Cebu service area. No other utility or cooperative in v1 |
| BR-4 | The app is free at point of use, with no paid tier, trial, or gated functionality |
| BR-5 | The app displays no advertising and integrates no advertising SDK |
| BR-6 | **No personal data ever leaves the device.** An optional, user-supplied name stored in local storage is the only personal field, and it is never transmitted or held server-side |
| BR-7 | The app must be usable on a low-end, several-year-old Android handset on limited mobile data — the modal device of the target population |
| BR-8 | The app must communicate the boundaries of its coverage plainly, including the interruption types it cannot report |

### 4.2 Operations

| ID | Requirement |
|---|---|
| BR-9 | Ingestion runs unattended. No human step is required for normal operation |
| BR-10 | Failures must be surfaced to the maintainer by push (email via CI failure notification and auto-filed issues), never requiring a dashboard to be checked |
| BR-11 | The system must survive 60 days of source silence without self-disabling |
| BR-12 | Recovery from a source format change must be achievable by a single person in under one working day |
| BR-13 | No component may require a credit card, paid tier, or trial that expires |

### 4.3 Distribution

| ID | Requirement |
|---|---|
| BR-14 | v1 distributes as a directly downloadable APK. No Google Play release |
| BR-15 | Users must be told, before download, that sideloading requires enabling installation from unknown sources |
| BR-16 | Because store-managed updates are unavailable, the app must detect and prompt for its own updates (PRD FR-19–21) |
| BR-17 | Release artifacts must include a published checksum, so users can verify an APK obtained outside official channels |
| BR-18 | The codebase must remain iOS-capable so that an iOS release requires funding and build access only — never a rewrite |

---

## 5. Cost model

| Component | Provider | Tier | Recurring cost |
|---|---|---|---|
| Source data | visayanelectric.com | Public, unauthenticated | $0 |
| Ingestion / CI | GitHub Actions | Free, **unlimited minutes on public repositories** | $0 |
| Data hosting | GitHub Pages | Free — 100 GB/month bandwidth | $0 |
| APK hosting | GitHub Releases | Free | $0 |
| Push messaging | Firebase Cloud Messaging | Spark plan — free and uncapped; no card required | $0 |
| Android builds | `expo prebuild` + Gradle (Android Studio locally, Actions in CI) | Free, no Expo account needed | $0 |
| Map images | MapTiler Static Maps | Free tier, **build-time only** — 232 images generated once, not per user | $0 |
| Android distribution | Direct APK | No store account | $0 |
| **Total recurring** | | | **$0** |

### 5.1 Costs deliberately not incurred

| Item | Cost | Decision |
|---|---|---|
| Apple Developer Program | $99/year | **Deferred.** Blocks iOS release; codebase stays iOS-ready |
| Google Play registration | $25 one-time | **Declined.** Costs store-managed updates and discoverability; bought back partially via in-app update checks |
| Custom domain | ~$10/year | **Optional.** Default hosting subdomain is acceptable |
| Managed hosting / database | $0–20/month | **Avoided by architecture.** No user records exist to store |

### 5.2 Capacity headroom

The binding constraint is data-hosting bandwidth. At roughly 8 KB gzipped per feed fetch — and with conditional requests reducing the large majority of fetches to ~300-byte `304` responses, because the data changes only weekly — the free tier accommodates a user base far larger than Visayan Electric's entire customer base of approximately half a million.

**BR-19.** Should any free-tier limit come within 50% of exhaustion, the migration path documented in ARCHITECTURE.md §9 must be executed rather than a paid tier adopted.

---

## 6. Legal and compliance

*The following is a good-faith engineering assessment, not legal advice. Independent review is advisable before public release.*

### 6.1 Terms of service

**The original concept called for scraping Facebook. That approach was rejected on this basis.** Automated collection from Facebook contravenes Meta's terms, generally requires an authenticated session, and exposes the project to account termination and IP blocking. It is also technically fragile in a way that fails silently.

**BR-20.** PAWER collects data exclusively from Visayan Electric's own public website via its published RSS feed and public post pages, unauthenticated, at low frequency. No login, no credential, no access-control circumvention, and no Facebook automation.

### 6.2 Data privacy — RA 10173 (Data Privacy Act of 2012)

PAWER transmits and processes no personal information. It has no accounts, collects no identifiers, requests no location permission, and holds no server-side record of any user. The one personal field — an optional display name — is written to local storage and never sent anywhere, so it is not processed by any controller. Notification targeting uses topic subscription, so the server publishes to a barangay name and never learns which or how many devices are listening. A user's selected barangays never leave their device.

**BR-21.** The obligations of a personal information controller are therefore not engaged, and PAWER must remain in this position by design. Any future feature that would introduce personal data processing requires a deliberate re-assessment before implementation.

### 6.3 Intellectual property

| Concern | Position |
|---|---|
| **Advisory text** | Factual public-safety notices are reproduced in limited, attributed excerpts, with a link to the source. PAWER adds structure and targeting rather than republishing wholesale |
| **Map images** | **Never reproduced.** PAWER links to the source post. This also serves the app's performance requirements |
| **Trademarks** | "PAWER" is independent. VECO's and Visayan Electric's names and logos are not used in the app identity, icon, or promotional material. Attribution appears as plain text |
| **Non-affiliation** | Stated in onboarding, Settings, the repository, and the download page |

### 6.4 Liability

**BR-22.** The app must carry a plain-language disclaimer stating that PAWER reports Visayan Electric's *published schedule*, that actual interruptions may differ in timing or occur without notice, and that PAWER must not be relied upon for medical, safety-critical, or life-support purposes. The disclaimer must be visible during onboarding — not buried in Settings.

---

## 7. Assumptions and dependencies

### Assumptions

| ID | Assumption | If false |
|---|---|---|
| BA-1 | ERC regulation obliges advance public notice of scheduled interruptions | Source becomes discretionary and less durable; product risk rises materially |
| BA-2 | VECO continues publishing weekly advisories as server-rendered HTML text | Ingestion fails. No mitigation within v1's constraints |
| BA-3 | Advisory `Areas Affected` text continues to name barangays recognisably | Registry-scan matching degrades; entries fall to `partial` |
| BA-4 | Target users have Google Play Services (required for push) | Push unavailable on Huawei and de-Googled devices; app still functions via manual refresh |
| BA-5 | Target users can and will enable sideloading | Adoption ceiling; the primary cost of declining a Play release |
| BA-6 | GitHub's free tier terms remain suitable for this workload | Migrate per ARCHITECTURE.md §9 |
| BA-7 | MapTiler's free tier permits build-time static rendering and redistribution of the resulting images | Map confirmation degrades to name-only (ONBOARDING-AND-TOUR.md §4.2); no other feature is affected |

### Dependencies

**Critical:** visayanelectric.com availability and format · GitHub Actions, Pages, Releases · Firebase Cloud Messaging · Google Play Services on device.
**Non-critical:** Expo and React Native toolchain (build-time only) · PSGC barangay reference data (seed-time only).

---

## 8. Business risk register

| ID | Risk | Likelihood | Impact | Response |
|---|---|---|---|---|
| BRK-1 | VECO changes advisory HTML structure | High over time | High | Registry-scan tolerance; auto-filed issue; `failed` entries still shown with source link. Recovery target: one working day |
| BRK-2 | VECO stops publishing to the website | Low | Critical | Accept. Freshness indicator and stale warning ensure users are not misled |
| BRK-3 | A user suffers loss after relying on PAWER during an unreported emergency outage | Medium | High | Disclosure over capability: onboarding disclaimer, Settings statement, no safety-critical reliance claim |
| BRK-4 | Sideloading friction suppresses adoption | High | Medium | Clear install guide, published checksums. Revisit a Play release if adoption is the binding constraint |
| BRK-5 | Stale clients render wrong data after a schema change | Medium | High | Non-dismissible update prompt below `min_schema_version` |
| BRK-6 | VECO objects to the project | Low | Medium | Prominent non-affiliation, no marks used, sole maintainer control, prepared to comply promptly |
| BRK-7 | Maintainer abandons the project | Medium | Medium | See §9 — degradation is graceful by design |
| BRK-8 | Free-tier terms change | Low | Medium | Documented migration path; parser is platform-agnostic by construction |
| BRK-9 | An APK is redistributed with modifications | Low | Medium | Published checksums; single official download channel |

---

## 9. Sustainability and bus factor

PAWER has one maintainer, which is a real business risk that the architecture is designed to absorb rather than eliminate.

**If the maintainer stops entirely, nothing breaks immediately.** Ingestion is fully unattended: the pipeline continues polling, parsing, publishing, and pushing indefinitely with no human involvement and no bill to pay. Installed apps continue working.

**When the source format eventually changes, the system degrades rather than lies.** Unparseable entries surface as `failed` with a link to VECO's post — PAWER becomes a filtered index of relevant advisories instead of a structured dashboard. Diminished, still useful, and never wrong.

**BR-23.** To keep the project recoverable by someone else, the repository must contain: this document set, the coverage glossary of all 232 franchise barangays with its collision index and source-disagreement record, a parser test corpus of real advisories, a documented decision log (§10), and reproducible build instructions. Being a public repository, the project can be forked and continued by any third party without the maintainer's involvement.

---

## 10. Decision log

Recorded because the reasoning is more valuable than the conclusions, and because several decisions look wrong without it.

| # | Decision | Rejected alternative | Rationale |
|---|---|---|---|
| D-1 | Ingest from visayanelectric.com | Scrape Facebook | Legal, stable, unauthenticated, and **structured HTML text** rather than poster images — which also avoids OCR, and therefore avoids AI |
| D-2 | Ship 3 of 6 interruption types | Ship all via Facebook or crowdsourcing | Emergency, cancelled, and confirmed-restoration events have no compliant public source. Partial coverage, honestly disclosed, beats full coverage that silently breaks |
| D-3 | Derive "ongoing" from the clock | Treat it as a data feed | Given start and end times, it needs no source at all — the cheapest requirement in the product |
| D-4 | Barangay granularity | City-level, or street-level | Matches how VECO actually writes advisories. City-level is too noisy to stay trusted; street-level exceeds what the text supports |
| D-5 | FCM topic subscriptions | Device token registry | Delivers true push while keeping the "no user database" requirement literally true |
| D-6 | Three of four alerts scheduled on-device | All four pushed from the server | The schedule is known days ahead, so only "new advisory" needs a server. The rest work offline and cost nothing |
| D-7 | CI-as-backend, git-as-state | Managed serverless plus a database | Free without an asterisk, no service to monitor, no user data at rest, and the commit history becomes a free audit log |
| D-8 | `RemoteViews` widget | Jetpack Glance | **Reversal of an earlier decision.** Glance imports the Compose runtime, raising APK size and memory floor against an explicit low-resource requirement |
| D-9 | System `Chronometer` for countdown | App-scheduled periodic refresh | The system renders the tick, so a live countdown costs **zero** app wakeups — the classic Android widget battery trap, avoided outright |
| D-10 | Android 7.0 (API 24) floor | API 23 via a pinned old SDK; API 21 via native Kotlin | API 23 buys one version for a frozen, unpatched toolchain. API 21 requires abandoning cross-platform and the iOS-ready codebase |
| D-11 | Registry-scan matching | Grammar-parse the sentence | The source uses at least two different grammars for the same field. Scanning for known names parses both identically and tolerates typos |
| D-12 | Never silently discard an entry | Skip unparseable entries | A dropped entry is a missed brownout — the worst failure this app has. Visible degradation is strictly better than invisible loss |
| D-13 | No Play Store release | $25 Play registration | Maintainer decision. Cost is store-managed updates and discoverability; partially recovered through in-app update checks |
| D-14 | English only | Cebuano, or bilingual | VECO publishes in English, so quoted text passes through untranslated with no risk of drift. Revisit after launch. **Amended by D-30** |
| D-15 | Geography is **verified reference data**, PSGC-sourced, with provenance and a release-time diff gate | Seed the registry from the advisory text, or from general knowledge | **Prompted by a real error in v0 of these documents**, which listed Lapu-Lapu City and Cordova as franchise LGUs. They are not. The mistake would have been invisible in testing — affected users would have seen permanent silence, not a failure. Geographic error is uniquely dangerous in this product because its symptom is indistinguishable from good news. See ARCHITECTURE.md §5.6 |
| D-16 | Subscription at **barangay level only**; browsing across the whole franchise | LGU-wide subscription; street-level subscription | Street level has no canonical registry and is where VECO's typos and truncations concentrate — matching it would cause false negatives. LGU level would make most alerts irrelevant in an 80-barangay city and train users to mute the app. Browsing satisfies the breadth need without touching the alert set |
| D-17 | LGU-wide subscription blocked **in the data plane**, not just the UI | Hide the option in the client | No LGU-level topic is ever published, so a client bug or a modified APK cannot subscribe to one. A product decision enforced where it cannot be circumvented is cheaper than one enforced in a screen |
| D-18 | Setup happens in the **guided tour**, not onboarding | Capture the barangay during onboarding | The original flow captured location in onboarding *and* walked through adding a place in the tour — the same action twice. Moving it makes every tour step change state instead of narrating, at the cost of allowing a zero-area dashboard |
| D-19 | Map images **pre-rendered at build time**; MapTiler key never ships | Call MapTiler from the app with an embedded key | A key inside a sideloaded, checksummed APK is trivially extractable, and a leaked key spends the owner's quota. Pre-rendering removes the exposure instead of mitigating it — and incidentally removes the map SDK, the runtime quota, and any offline failure |
| D-20 | Onboarding screen 3 retargeted from *sudden* outages to *buried advisories* | Keep the original emotional hook | Sudden outages are the deferred type (D-2). Opening on that question would promise, on the first screen, the one thing v1 cannot do |
| D-21 | **Neobrutalist** visual system with the owner's five-colour palette; `#EA5C1F` accent used least, noticed most; single light theme | Warm-neutral flat system with light/dark themes (DG v1.0) | Owner decision. Neobrutalism's thick borders and hard offset shadows are cheap to render and match the low-resource constraint; a single theme halves the token and contrast surface |
| D-22 | A **ten-entry animation vocabulary**, each bound to one meaning, ≤ 240 ms, transform/opacity only, reduce-motion → cut | No animation at all (NFR-4 v1) | Motion that *means* something aids comprehension; motion that decorates costs battery. The contract permits the first and forbids the second. Nothing animates in the widget |
| D-23 | **Green adopted** for the clear state | No green, to avoid implying the power is known to be on | Owner decision. The honesty constraint moves wholly into copy (`No scheduled outage today`, never `Power is on`), where it was already enforced |
| D-24 | **PSGC is the canonical registry input**, via the psgc.gitlab.io mirror; PhilAtlas/Wikipedia/VECO spellings become aliases | Keep PhilAtlas+Wikipedia with all variants aliased and no winner | The authority became reachable, so R1 could be implemented literally. It settled all five disputed spellings (Camputhaw, Hippodromo, To-ong Pardo, Alfaco, Lorega) — three of them *against* the earlier alias guesses — and gave every barangay its 9-digit code, turning the two-Nagas trap into a test |
| D-25 | Barangay centroids sourced from **Nominatim with name validation**, all `verified:false` until a person reviews the rendered image | OSM Overpass boundary centroids; skip maps | Overpass covers 9 of Cebu City's 80 barangays — unusable. Raw Nominatim returned a *wrong* pin for Lahug (Barangay Luz's hall), so results must name the barangay or are discarded. Coverage is partial by design: no centroid, no map (C4) |
| D-26 | Locator images are **composited by the pipeline from MapTiler raster tiles** (free plan) rather than fetched from the Static Maps API | Pay for MapTiler Flex ($30/mo); drop the map and confirm by name | The Static Maps endpoint is paid-only, discovered when the key verifier returned 403 with a valid, correctly restricted key. Paying would make one onboarding picture the only recurring bill in the system (BR-13). Dropping it loses the visual check that guards against picking the wrong barangay, which in this app means silently never being alerted. Compositing ~10 free tiles per barangay once keeps both the picture and the $0 |
| D-27 | Two shipped typefaces: **Getai Grotesk Display Black** for `display`/`title`/logo, **Aspekta** (static 400/500/700) for everything else | System typeface only (the prior rule); Getai everywhere; Aspekta everywhere | Getai is a 135-glyph display cut with no `·` `›` `✓` `✗` and only a Black weight, so it physically cannot carry the smaller sizes where that punctuation lives. Aspekta shipped as a variable font, which React Native cannot drive, so it is instanced into three static weights at build time. Cost is 144 KB in the APK. Aspekta is SIL OFL; Getai carries no licence metadata in the file, but Keith confirmed on 2026-09-04 that it is public and free for any use, which clears the BR-14 blocker |
| D-28 | Screen transitions are the **native stack slide** (`slide_from_right`), replacing the custom `wipe` | Keep the ink-block wipe; a Reanimated custom slide | A pushed screen entering from the right and settling left is the platform's own spatial model, so it needs no explanation and no JS. The native animation runs on the UI thread with the platform's decelerate curve, which serves NFR-4 better than any hook we could write. The wipe was distinctive but read as a transition *effect* rather than as movement through a stack |
| D-29 | On-screen honesty copy is **consolidated, not deleted**: one line per screen, the full disclosure once in Settings → About | Repeat the full disclaimer on every screen (the prior behaviour); drop it from the UI entirely | Four screens each carried two or three lines of the same disclaimer, which crowded the actual status and, by repetition, stopped being read. The legal position in §7 depends on the disclosure existing and being reachable, not on it appearing everywhere — so it survives in full in one place, with a one-line pointer where it matters |
| D-30 | **Onboarding call-to-action buttons are Cebuano**; everything else stays English | Keep D-14's English-only rule; translate the whole app | The buttons a Cebuano reader taps to agree are exactly where the local register belongs — "Mao jud", "Sure eyyyy?", "Gegege" read as a neighbour talking, which is the voice a free public-service app wants. Quoted VECO text and every status line stay English, so D-14's actual concern (translation drift in safety-relevant copy) is untouched: nothing translated here carries a time, a place or a warning. Both shipped families cover the glyphs. Full bilingual UI remains a post-launch question |
| D-31 | Loops are permitted on **onboarding only** (drifting shapes, the pagination dot's width) | Keep the absolute no-loop rule; allow loops anywhere | Onboarding is seen once for about a minute, the animations are transform-only on the UI thread, and reduce-motion stops them. The rule exists to protect battery on the screens a user actually lives in, which are the dashboard and the widget, and those stay still. Skeleton shimmer stays forbidden: a loading pulse would run on the screen the user waits on most |
| D-32 | The dashboard's **Latest advisory** link opens `source_post_url` on visayanelectric.com, not Facebook | Link to VECO's Facebook post; omit the link | Verified against live data before building it: all 98 stored outages carry a visayanelectric.com URL and none carry a Facebook one, because D-1 ingests the website precisely to avoid OCR on poster images. A Facebook link would need a second source that D-1 ruled out |
| D-33 | Card fills are **tints** (a status hue at 32% over ground); the saturated four stay status-only | Saturated card colours; no card colour at all | A list of saturated cards competes with the hero for the same glance, and colour is the only status signal the widget has. Tints give the requested variety without letting a decorative card look like it is claiming a status |
| D-34 | **Loaders may loop.** `gradient-spin`'s maths is imported; its rendering is reimplemented natively | Use the package as-is; keep the static skeletons as the only loading UI | The package is a DOM component — divs, `className`, a CSS keyframe, an injected `<style>` tag — and declares no `react-native` entry, so it cannot render here. Its `gradientPresets`, `sampleGradient` (OKLab) and `cellWaveOrder` are pure and DOM-free, and every `document` access sits inside a guarded `useInsertionEffect`, so importing them is safe. A loader is the one honest place for a loop: it exists only while waiting, animates opacity alone so it stays on the compositor, and therefore keeps moving when the JS thread is busy — which is exactly when it matters. Configured `tonic` / diagonal / along-path / 1200 ms / dim 0.20 / 3×3 / 5 px cells / 2 px gap |
| D-35 | Avatars are **four mesh gradients drawn in SVG**, assigned by hashing the name, and appear only beside the optional local name | Ship the four gradients as image assets; assign with `Math.random`; put avatars nowhere | PAWER has no accounts and no user records, so the optional local-only name is the only place a person exists in the app — onboarding S4, S5 and Settings. Drawn gradients stay crisp at any size and add nothing to the APK. A hash rather than a random roll keeps one person's colour stable between screens and across restarts, with nothing stored |
| D-36 | **Street names are never reported as unknown areas.** A residual token ending in Road/Rd/St/Ave/Extn and similar is dropped at the end of the area scan | Report every residual token; extend the head/tail split to recognise roads without the `along` keyword | Step 0 already discards streets, but only when VECO writes `along`. It also appends them bare after the LGU — `Portion of Alang-Alang, Mandaue City, R. Colina St., R. Colina Extn., and Marciano Quizon Road.` — where there is no keyword to split on. Those eight roads each auto-filed a GitHub issue on 2026-09-04 and marked otherwise-complete outages `partial`, which spends the ops surface on noise that can never be actioned. Checked against all 232 registry names and every alias: none ends in one of these words, so the filter cannot hide a barangay. Deliberately narrow — `South Reclamation Area`, `Royale Cebu Estates` and `Corona Del Mar Subd` are places, not streets, and must keep reporting, because an unmatched place is an outage reaching nobody |
| D-37 | `Ward I`–`Ward IV` and `San Nicolas Proper` added to glossary §5 | Leave them unmatched; match on a prefix rather than an alias | Both were silent false negatives, the one failure class this product does not tolerate. Minglanilla is the only LGU in the franchise with wards, so VECO's bare `Ward IV` is unambiguous once the LGU is detected. `San Nicolas Proper` is **inferred** to be `san-nicolas-central` — PSGC's current name, with `Proper` the older local form, the same pattern as the existing `Lorega-San Miguel` alias — and wants confirming on the ground, since Cebu City has three other San Nicolas barangays and the match rests on adjacency (`… & Sawang Calero … along Tupas St. & Magsaysay St.`) rather than on the name |
| D-38 | The app icon and splash are a **PWR wordmark**, white Getai Grotesk Black centred on the accent orange | Use the full `PAWER` name; a drawn symbol rather than type | Three letters survive the launcher's 48 dp grid where five would not, and the mark reuses the display face and the accent already carrying the brand, so it needs no new asset pipeline and stays legible when Android masks it to a circle. Rendered from the TTF at build time rather than hand-drawn, so the wordmark cannot drift from the typography. The accent is used least and noticed most (D-21), and the launcher icon is exactly the place that earns it |
| D-39 | **No bottom gradient fade, on any scrolling list.** Removed from all five screens and the component deleted | Keep it on scrolling lists (the rule added earlier the same day) | Reversed on Keith's call after seeing it on device. It also puts the UI back in line with the guidelines, which already list fades among the things PAWER does not build (DG §10, §11) — a scroll edge that dissolves reads as decoration on an instrument, and the 2 dp borders already tell you a card is cut off |
| D-40 | The **widget is the dashboard status card**, at 2x2 scale, with rounded corners | Keep the flat 2 dp-radius block with no shadow | The widget is the surface most users will actually live with, so it should be recognisably the same object as the hero. It gains the hard 4 dp ink shadow, drawn as a layer-list with the card inset by the same 4 dp so the shadow lands inside the widget's own bounds and no launcher clips it, and it carries a subset of Getai Grotesk Black (18.6 KB) so the headline is the app's own face rather than the system bold. Corners go to 14 dp rather than the card's 5 dp, at Keith's request and in line with what Android 12 expects of a widget. Every text slot autosizes within a capped line count instead of ellipsising, since at this size truncation was hiding the end of a time window; the Chronometer alone stays fixed, because autosizing text that changes every second visibly rescales itself |
| D-41 | Widget copy: the tag reads **TODAY in every state**, an ongoing outage says **Outage in-progress**, the time never wraps, and the area is a **chip** | Keep `NOW` / `Now`; let the time wrap to two lines; leave the area as plain slate text | `NOW` in the tag and `Now` in the headline said the same thing twice and neither said what was happening. A wrapped time is a time you read twice, so line 3 is capped at one row and shrinks instead of breaking. The area becomes the dashboard card's chip, which is also what tells you at a glance that the widget is about a place. The chip is dropped for the stale notice and the unconfigured prompt, since neither is a place and a warning inside a location chip reads as a location. The headline slot takes `layout_weight`, so it absorbs the slack and the chip can never be pushed out of the widget |
| D-42 | Every widget text size is **the size that fits the widest string that slot can hold, unaided**; the countdown autosizes after all | Keep the countdown at a fixed 20 sp (D-40); size each slot for the common case and let autosize rescue the rest | Measured against the real font advances in the 84 dp content box rather than eyeballed. The fixed countdown clipped `23:59:59` by 14 dp, and a countdown that long is reachable — an outage late today, read just after midnight. Clipping the one number the widget exists to show beats the rescaling that argued against autosizing it, and the size steps only when the digit count changes. `autoSizeTextType` needs API 26, so the base is what API 24-25 gets with no help: 13 sp for the headline (`in-progress` clipped at 17 sp), 7 sp for the time (the cross-midnight window `10:00 PM Fri – 6:00 AM Sat` needs it). The area chip takes TWO rows, since one row was never asked for there and the longest name with its LGU would need 6 sp |
| D-43 | The ground is a **hairline grid tinted with the accent at 9%**, on a 26 dp cell | Keep the 12 dp checkerboard (D-33's companion) | Seen on device the checker competed with the cards for the same glance, which is the opposite of what a background is for. A grid sits behind them and is barely there until looked for, and tinting the lines with the accent rather than ink makes the hint of warmth the brand's own orange. Still one SVG pattern, so still one draw call |
| D-44 | The tour scrim **blurs as well as dims**, per panel | Dim only (the shipped behaviour); blur the whole screen including the target | The one relaxation of NFR-4's no-blur rule, and bounded: it exists only while the tour is on screen, never on a surface the user lives in, and it is what makes "everything except this" read as background rather than a tinted copy of the same screen. Drawn as the same four panels around the target, so the highlighted control stays sharp. Android needs `experimentalBlurMethod`; where that is unsupported the view degrades to a plain translucent wash, which is exactly what shipped before, so nothing is lost |
| D-45 | ~~The widget headline is `sans-serif-black`~~ (superseded by D-46 the same day; the 22 dp radius stands) and the card radius is **22 dp** | Keep the bundled Getai subset (D-40); keep the 14 dp radius | A `res/font` is inflated in the LAUNCHER's process, not the app's, and does not reliably resolve there — on device the headline silently fell back to the system face, so the 18.6 KB subset was paying for nothing and is removed. `sans-serif-black` is a framework family (Roboto Black, weight 900), always available, and the heaviest weight Android guarantees. The radius went up because a launcher rounds the widget's own bounds and the card sits flush in the top-left corner, so a 14 dp curve was being shaved by a larger clip; at 22 dp the card's curve is inside any launcher's, which fixes it without giving up content area as an inset would |
| D-46 | The widget headline is **drawn as a bitmap in the app's process**, in the real Getai Grotesk Black | Accept `sans-serif-black` (D-45); keep trying `android:fontFamily` | D-45 was the right diagnosis and the wrong remedy. A `res/font` in a RemoteViews layout is resolved by whichever process inflates it, which is the launcher, and an OEM skin can substitute fonts across every TextView it draws — which is what was happening. Nothing downstream can override pixels, so `Headline.kt` lays the text out with a `StaticLayout` over the real typeface and ships a bitmap, shrinking to fit the 84 dp box in two lines exactly as `autoSizeTextType` would. The countdown is the one slot that cannot follow: a bitmap cannot tick, and a live `Chronometer` is what makes the timer cost zero wakeups (ARCH §9.3), so it keeps the platform's heaviest weight. The picker preview gets its own layout, since nothing fills the bitmap there and the headline would otherwise be blank |
| D-47 | **No "run the tour again".** The button and `resetTour` are both gone | Keep it in Settings | Keith's call: the tour exists to get a first area added, and once that is done replaying it teaches nothing. It was also the only writer of `tourDone: false`, so removing the button let the whole code path go rather than leaving a dead lever behind it |
| D-48 | The widget's value block **groups at the top** with the slack below it, the time and the area chip are **bold**, and the widget is **pinned to 2x2 from both ends** | Centre the value in a flexible slot (D-42); leave the time and chip at regular weight; rely on `resizeMode="none"` alone | Keith's call after seeing it on device. Centring the value put a gap between it and its own subtitle, which read as two unrelated lines; grouping at the top is also what the dashboard card does with its tag, value, detail and area. The slack sits BETWEEN the subtitle and the area chip, not after it: putting it after pulled the chip up with the value block, where it belongs at the foot of the card. Bold on the time and the area matches the card, where both are the bold Aspekta cut. `minResizeWidth`/`minResizeHeight` now match the max, so a launcher has nothing to stretch even where it ignores `resizeMode` |
| D-49 | The widget headline's bitmap uses **`includePad(true)`** and is capped to a **height budget** | Keep `includePad(false)` and let the ImageView scale the bitmap down | `includePad(false)` measures to the font's ascent and descent, and this display face's glyphs overshoot both, so the headline came out visibly clipped — the "text looks cut" Keith reported. The height cap replaces `centerInside` doing the shrinking: the bitmap is laid out to fit the room the headline actually has, which keeps the value legible at 2x2 and guarantees the area chip below it stays on screen |
| D-50 | Widget copy: **`No outages today`**, **`No location set in app`**, and **no "Data may be outdated"** | Keep `Clear` / `Open PAWER`; keep the stale notice on line 4 | Keith's edits, made on the canvas and read back from it. One consequence needs naming: line 4 was the only place the widget said the feed was old, so a stale widget now differs from a fresh one only by its dashed slate card. That is a real reduction in disclosure against the 48h staleness rule (PRD §7.1), taken deliberately, and the dashed card is the remaining signal |
| D-51 | The widget's spacer is a **`FrameLayout`**, and a check asserts every widget-layout view is one `RemoteViews` can inflate | Use `Space`, the obvious element for the job | `RemoteViews` inflates only classes the framework annotates `@RemoteView`, and `Space` is not one of them — verified against the platform sources in `$ANDROID_HOME/sources`. A layout containing one throws in the LAUNCHER's process, so the widget draws blank and nothing appears in our own logcat: a silent failure that cost a rebuild to find. `FrameLayout` is annotated and does the same job. `npm test` now checks both widget layouts against the full allowlist first, so the next disallowed view fails in seconds rather than after a build and an install |
| D-52 | The widget **sizes itself from the room the launcher actually gave it**, read per widget from `getAppWidgetOptions` | Keep the 84x30 dp content box hardcoded for a 2x2 | Every declarative lever is already pulled — `resizeMode="none"`, matching min and max resize, 2x2 target cells (D-48) — and HyperOS still handed the widget several times that. With the box hardcoded the headline stayed at 2x2 size in a large card, which is what "the main text is too small" was. Portrait reads `OPTION_APPWIDGET_MIN_WIDTH` and `OPTION_APPWIDGET_MAX_HEIGHT`, falling back to 110x110 when a launcher reports nothing; the headline may now grow to 30 sp over up to three lines, and every autosize ceiling rose with it. 30 rather than the card's 40, and three lines rather than two, because measuring every headline the renderer can produce showed a 40 sp cap letting two-word strings reach 40 while `No outages today` was held to 21 sp by its third word, a near-2x swing between states on one widget; at 30 over three lines the spread is 5 sp. A 2x2 is unaffected either way, its height budget pinning everything to 13 sp long before the cap matters. Rendering moves per widget id rather than one `RemoteViews` for all of them, and `onAppWidgetOptionsChanged` redraws on resize, without which a resized widget keeps a bitmap laid out for the old box |
| D-53 | The clear-state subtitle is **`You're all good for today!`** | Keep `No scheduled outage` | It sat directly under `No outages today` and said the same thing twice. Keith's wording |

---

## 11. Out of scope for this BRD

Revenue, pricing, and competitive analysis — PAWER is free with no commercial ambition. Marketing spend, user acquisition funding, hiring, organisational structure, SLAs, and support commitments are likewise not applicable to a single-maintainer, zero-budget public-service project.

---

## 12. Acceptance

v1 is accepted as a business deliverable when:

1. Every PRD functional and non-functional requirement for a shipped feature is met.
2. The parser achieves ≥ 99% `parsed` across a 12-week corpus with zero silent drops.
3. A full week runs unattended, with a newly published advisory reaching devices within one hour.
4. Recurring cost is verified at $0 with all limits below 50% utilisation.
5. Battery measurement confirms PAWER does not appear in Android's per-app ranking after a week of normal use.
6. Legal positioning is in place: disclaimer, attribution, non-affiliation, published checksums.
7. The repository is public and contains the document set, parser corpus, decision log, and build instructions.
