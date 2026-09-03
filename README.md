# PAWER

Scheduled power-interruption alerts for Visayan Electric's Metro Cebu franchise — a dashboard, a 2×2 home-screen widget, and per-barangay notifications, built from VECO's own public advisories. No accounts, no server-side user data, $0 to run.

> **Unofficial.** PAWER reads Visayan Electric's published advisories and is not made by or affiliated with Visayan Electric. It shows the *published schedule*, not the state of the grid, and covers scheduled outages only.

## Documents

| | |
|---|---|
| [PRD](docs/PRD.md) | Requirements, widget state machine, notification matrix |
| [BRD](docs/BRD.md) | Business case, $0 cost model, legal positioning, decision log |
| [Architecture](docs/ARCHITECTURE.md) | CI-as-backend, parser design, data contracts, widget internals, status |
| [Design Guidelines](docs/DESIGN-GUIDELINES.md) | Neobrutalist system, palette, copy rules, animation vocabulary |
| [Coverage Glossary](docs/COVERAGE-GLOSSARY.md) | All 232 franchise barangays — PSGC-verified — with the collision index |
| [Onboarding & Tour](docs/ONBOARDING-AND-TOUR.md) | Five screens, eight tour steps, full copy |

## Layout

```
packages/shared     Manila time (+08:00, no tz lib), types, status machine, widget-state and notification derivation, palette
packages/registry   barangays.json / lgus.json — PSGC-canonical (psgc/*.json) + glossary aliases; verification.md; centroids
packages/parser     VECO advisory HTML → Outage[] — pure TypeScript; corpus of real advisories with golden locks
pipeline/           ingest orchestration (RSS → diff → parse → merge → publish → FCM → issues → heartbeat), CLI, map pre-renderer
app/                Expo SDK 57 Android app (iOS-ready, unshipped); modules/pawer-widget = Kotlin RemoteViews widget + WidgetKit target
.github/workflows   ingest (every 30 min) · pages · maps · release (signed per-ABI APKs)
data/               committed pipeline state (created by the first ingest run)
```

## Commands

```bash
npm install
npm test               # shared · registry · parser · pipeline
npm run typecheck      # every workspace
npm run contrast       # WCAG check on the palette — fails below AA
npm run build:registry # rebuild registry from PSGC + glossary aliases
npm run ingest         # run the ingest locally (writes data/; no push without FCM_SERVICE_ACCOUNT)
npm run publish        # build dist/ exactly as Pages serves it
npm run centroids      # source barangay centroid candidates from Nominatim (1 req/s)
npm run maps           # render locator images for VERIFIED centroids (needs MAPTILER_KEY)
```

Parser review table for the real corpus:

```bash
cd packages/parser && npx tsx scripts/dump-corpus.ts
```

App (Android; Node ≥ 20.19 required by Expo SDK 57; a dev client or prebuild is required for Firebase and the widget):

```bash
cd app && npx expo prebuild --platform android && npx expo run:android
```

## Secrets the workflows consume (by name — never committed)

| Secret | Used by | Purpose |
|---|---|---|
| `FCM_SERVICE_ACCOUNT` | ingest | Firebase service-account JSON → topic pushes |
| `MAPTILER_KEY` | maps | Build-time static map rendering; never ships in the APK |
| `GOOGLE_SERVICES_JSON` | release | Firebase Android config written to `app/google-services.json` before prebuild |
| `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` | release | APK signing. **Back the keystore up in two places** — losing it strands every installed user |

Without `FCM_SERVICE_ACCOUNT` the ingest still runs; pushes are skipped and outages stay un-notified until it exists.

## How the registry is maintained

Barangay names are **verified reference data** (Architecture §5.6). PSGC is canonical (`packages/registry/psgc/*.json`). To teach the parser a spelling VECO uses, add one row to `docs/COVERAGE-GLOSSARY.md` §5 and run `npm run build:registry` — the build fails if anything no longer matches PSGC. The ingest files an issue for every area token it cannot match.

## Status

See [Architecture §16](docs/ARCHITECTURE.md#16-implementation-status-3-september-2026).
