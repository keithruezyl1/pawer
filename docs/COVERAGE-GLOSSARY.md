# PAWER — VECO Coverage Glossary

| | |
|---|---|
| **Version** | 1.0 — **verified against PSGC** |
| **Date** | 3 September 2026 |
| **Scope** | All barangays in Visayan Electric's 8-LGU franchise |
| **Count** | 232 barangays |
| **Authority** | **PSGC** via the psgc.gitlab.io mirror (`packages/registry/psgc/*.json`, edition 2026-09). PhilAtlas and Wikipedia now supply aliases only |

---

## Status of this document

**Verified.** All 232 barangays were matched one-to-one against the Philippine Standard Geographic Code (`psgc.gitlab.io` mirror of PSA data, city codes `072217000` Cebu City · `072230000` Mandaue · `072250000` Talisay · `072234000` Naga · `072227000` Liloan · `072219000` Consolacion · `072232000` Minglanilla · `072241000` San Fernando). Counts match exactly. PSGC is the **display name and the slug**; every other spelling in this document is an **alias**.

The build (`packages/registry/scripts/build-from-glossary.ts`) fails if any §4 name does not resolve to a PSGC barangay, if any PSGC barangay is missing from §4, or if an alias collides with another same-LGU name. Its output is `packages/registry/verification.md`.

---

## 1. Source disagreements — resolved by PSGC

| Slug (PSGC-canonical) | **PSGC** | PhilAtlas | Wikipedia | VECO writes | Aliases registered |
|---|---|---|---|---|---|
| `cebu-city.camputhaw` | `Camputhaw (Pob.)` | `Camputhaw` | `Kamputhaw` | `Camputhaw` | `kamputhaw` |
| `cebu-city.hippodromo` | `Hippodromo` | `Hippodromo` | `Hipodromo` | `Hipodromo` | `hipodromo` |
| `cebu-city.to-ong-pardo` | `To-ong Pardo` | `To-ong Pardo` | `To-ong` | `To-ong` | `to-ong` |
| `naga.alfaco` | `Alfaco` | `Alfaco` | `Alpaco` | `Alpaco` | `alpaco` |
| `cebu-city.lorega` | `Lorega` (old name `Lorega San Miguel`) | `Lorega` | `Lorega-San Miguel` | `Lorega-San Miguel` | `lorega san miguel`, `lorega-san miguel` |
| `cebu-city.budla-an` | `Budla-an (Pob.)` | `Budla-an` | `Budla-an` | `Budlaan` | `budlaan` |

**VECO agrees with PSGC in two of six cases and with Wikipedia in four.** Neither pattern is reliable enough to predict the next variant, which is why every observed spelling is an alias and the parser reports anything it cannot match (NFR-22). The `(Pob.)` suffix PSGC appends to poblacion barangays is stripped for display and kept as an alias.

---

## 2. Ambiguous names — the disambiguation index

**This is the section that answers the Colon and Basak question.** 13 names are shared across LGUs, covering 27 of the 232 barangay records. Every one of these **must** be displayed with its LGU (PRD FR-2b).

| Name | Appears in | Records |
|---|---|---|
| **San Roque** | Cebu City · Talisay City · **Liloan** | **3** |
| **Banilad** | Cebu City · Mandaue City | 2 |
| **Basak** | Mandaue City · San Fernando | 2 |
| **Bulacao** | Cebu City · Talisay City | 2 |
| **Cadulawan** | Talisay City · Minglanilla | 2 |
| **Casili** | Mandaue City · Consolacion | 2 |
| **Linao** | Talisay City · Minglanilla | 2 |
| **Poblacion** | Talisay City · Liloan | 2 |
| **San Isidro** | Talisay City · San Fernando | 2 |
| **Santa Cruz** | Cebu City · Liloan | 2 |
| **Tangke** | Talisay City · City of Naga | 2 |
| **Tayud** | Liloan · Consolacion | 2 |
| **Tubod** | Minglanilla · San Fernando | 2 |

**Real advisories already exercise this.** VECO's `Aug 30 – Sep 5` advisory contains `Portion of Lataban, San Roque, San Vicente, Sta. Cruz & Tabla, Liloan` and separately `Portion of Mabolo & San Roque, Cebu City` — two different `San Roque`s, in one document, three days apart. A user in Liloan's San Roque must not be alerted for Cebu City's.

### 2.1 Colon — a different collision type

`Colon` is **not** in the table above, because it is a barangay in only one franchise LGU: the **City of Naga**. Its collision is with **Colon Street in Cebu City**, one of the country's oldest and best-known streets — a *street*, not a barangay.

That makes it a **Type 1** collision (barangay vs. street/sitio name), resolved by the head/tail split in ARCHITECTURE §5.4 step 0, not by LGU qualification. The three types are distinguished in §3 below because each needs different machinery.

---

## 3. The three collision types

| Type | Definition | Example | Resolved by |
|---|---|---|---|
| **1** | Barangay name collides with a street, sitio, or subdivision name | `Colon` (Naga barangay) vs Colon Street (Cebu City) · `Nangka` (Consolacion barangay) vs Sitio Nangka (Mandaue) | Head/tail split at ` along ` — scan only the head |
| **2** | Same barangay name in different LGUs | `San Roque` in 3 LGUs · `Basak` in 2 | LGU-qualified slugs; LGU-scoped matching; LGU always displayed |
| **3** | **Barangay name is a substring of another barangay in the *same* LGU** | `Pardo` vs 6 other Cebu City `… Pardo` barangays · `Lawaan I` inside `Lawaan II` | Longest-match-first **plus** a substring guard. **LGU scoping does not help here** |

**Type 3 is the one that breaks an assumption in the original design.** LGU-scoped matching was presented as the general answer to name collisions, and for Type 2 it is. But every Type 3 collision below is *within a single LGU*, so scoping narrows nothing.

### 3.1 Type 3 inventory

| Short form | Same-LGU barangays it is a substring of | LGU |
|---|---|---|
| `Pardo` | `Basak Pardo`, `Buot-Taup Pardo`, `Cogon Pardo`, `Kinasang-an Pardo`, `Quiot Pardo`, `To-ong Pardo` — **and `Pardo` is itself a barangay** | Cebu City |
| `Basak` | `Basak Pardo`, `Basak San Nicolas` | Cebu City |
| `Cogon` | `Cogon Pardo`, `Cogon Ramos` | Cebu City |
| `Central` | `Pahina Central`, `San Nicolas Central` — **and `Central` is itself a barangay** | Cebu City |
| `San Nicolas` | `Basak San Nicolas`, `Pahina San Nicolas`, `San Nicolas Central` | Cebu City |
| `Sambag I` | `Sambag II` (string prefix) | Cebu City |
| `Sudlon I` | `Sudlon II` (string prefix) | Cebu City |
| `Lawaan I` | `Lawaan II`, `Lawaan III` (string prefixes) | Talisay City |
| `Poblacion Ward I` | `Poblacion Ward II`, `III`, `IV` (string prefixes) | Minglanilla |
| `Poblacion` | `Poblacion Occidental`, `Poblacion Oriental` | Consolacion |
| `Poblacion` | `Poblacion Ward I–IV` | Minglanilla |
| `Poblacion` | `Poblacion North`, `Poblacion South` | San Fernando |
| `Poblacion` | `Central/East/North/South/West Poblacion` | City of Naga |
| `Poblacion` | `Suba Poblacion` | Cebu City |

**Two rules follow, and they belong in the parser:**

- **Word-boundary anchoring is insufficient for the roman-numeral families.** `Lawaan I` is a legitimate word-bounded match inside `Lawaan II`, because `I` is a word-boundary-delimited token in `Lawaan II`… only if tokenised naively. Matching must consume the **entire** area token, not a prefix of it.
- **When VECO writes a short form matching several same-LGU barangays** — say `Portion of Basak, Cebu City` or `Portion of Cogon, Cebu City` — the entry is genuinely ambiguous. **Fan out to every candidate and mark the entry `partial`.** Over-notifying two adjacent barangays is recoverable; missing one is not. Log it for alias review.

### 3.2 Numeral-form variance

`Camp IV` (Talisay City, roman) sits alongside `Camp 7` and `Camp 8` (Minglanilla, arabic). Aliases must cover `Camp IV` / `Camp 4` / `Camp Four` and the arabic equivalents, since VECO's own text style is not guaranteed to match PSGC's.

---

## 4. The glossary

Slugs are `{lgu}.{barangay}` in all cases — never a bare name (ARCHITECTURE §5.6 R8). Names marked **⚠** are ambiguous across LGUs (§2); names marked **▲** participate in a same-LGU substring collision (§3.1).

### 4.1 Cebu City — 80 barangays

Adlaon · Agsungot · Apas · Babag · Bacayan · Banilad **⚠** · Basak Pardo **▲** · Basak San Nicolas **▲** · Binaliw · Bonbon · Budla-an / Budlaan · Buhisan · Bulacao **⚠** · Buot-Taup Pardo **▲** · Busay · Calamba · Cambinocot · Camputhaw / Kamputhaw · Capitol Site · Carreta · Central **▲** · Cogon Pardo **▲** · Cogon Ramos **▲** · Day-as · Duljo · Ermita · Guadalupe · Guba · Hippodromo / Hipodromo · Inayawan · Kalubihan · Kalunasan · Kamagayan · Kasambagan · Kinasang-an Pardo **▲** · Labangon · Lahug · Lorega · Lusaran · Luz · Mabini · Mabolo · Malubog · Mambaling · Pahina Central **▲** · Pahina San Nicolas **▲** · Pamutan · Pardo **▲** · Pari-an · Paril · Pasil · Pit-os · Pulangbato · Pung-ol-Sibugay · Punta Princesa · Quiot Pardo **▲** · Sambag I **▲** · Sambag II **▲** · San Antonio · San Jose · San Nicolas Central **▲** · San Roque **⚠** · Santa Cruz **⚠** · Sapangdaku · Sawang Calero · Sinsin · Sirao · Suba Poblacion **▲** · Sudlon I **▲** · Sudlon II **▲** · T. Padilla · Tabunan · Tagbao · Talamban · Taptap · Tejero · Tinago · Tisa · To-ong Pardo / To-ong · Zapatera

### 4.2 Mandaue City — 27 barangays

Alang-alang · Bakilid · Banilad **⚠** · Basak **⚠** · Cabancalan · Cambaro · Canduman · Casili **⚠** · Casuntingan · Centro · Cubacub · Guizo · Ibabao-Estancia · Jagobiao · Labogon · Looc · Maguikay · Mantuyong · Opao · Pagsabungan · Pakna-an · Subangdaku · Tabok · Tawason · Tingub · Tipolo · Umapad

### 4.3 Talisay City — 22 barangays

Biasong · Bulacao **⚠** · Cadulawan **⚠** · Camp IV · Cansojong · Dumlog · Jaclupan · Lagtang · Lawaan I **▲** · Lawaan II **▲** · Lawaan III **▲** · Linao **⚠** · Maghaway · Manipis · Mohon · Poblacion **⚠** · Pooc · San Isidro **⚠** · San Roque **⚠** · Tabunoc · Tangke **⚠** · Tapul

### 4.4 City of Naga — 28 barangays

Alfaco / Alpaco · Bairan · Balirong · Cabungahan · Cantao-an · Central Poblacion **▲** · Cogon · **Colon** · East Poblacion **▲** · Inayagan · Inoburan · Jaguimit · Lanas · Langtad · Lutac · Mainit · Mayana · Naalad · North Poblacion **▲** · Pangdan · Patag · South Poblacion **▲** · Tagjaguimit · Tangke **⚠** · Tinaan · Tuyan · Uling · West Poblacion **▲**

### 4.5 Liloan — 14 barangays

Cabadiangan · Calero · Catarman · Cotcot · Jubay · Lataban · Mulao · Poblacion **⚠** · San Roque **⚠** · San Vicente · Santa Cruz **⚠** · Tabla · Tayud **⚠** · Yati

### 4.6 Consolacion — 21 barangays

Cabangahan · Cansaga · Casili **⚠** · Danglag · Garing · Jugan · Lamac · Lanipga · Nangka · Panas · Panoypoy · Pitogo · Poblacion Occidental **▲** · Poblacion Oriental **▲** · Polog · Pulpogan · Sacsac · Tayud **⚠** · Tilhaong · Tolotolo · Tugbongan

### 4.7 Minglanilla — 19 barangays

Cadulawan **⚠** · Calajo-an · Camp 7 · Camp 8 · Cuanos · Guindaruhan · Linao **⚠** · Manduang · Pakigne · Poblacion Ward I **▲** · Poblacion Ward II **▲** · Poblacion Ward III **▲** · Poblacion Ward IV **▲** · Tubod **⚠** · Tulay · Tunghaan · Tungkil · Tungkop · Vito

### 4.8 San Fernando — 21 barangays

Balud · Balungag · Basak **⚠** · Bugho · Cabatbatan · Greenhills · Ilaya · Lantawan · Liburon · Magsico · Panadtaran · Pitalo · Poblacion North **▲** · Poblacion South **▲** · San Isidro **⚠** · Sangat · Tabionan · Tananas · Tinubdan · Tonggo · Tubod **⚠**

---

## 5. Aliases observed in VECO's own text

Harvested from the advisories examined so far, including the Facebook rotational-brownout corpus of 5 September 2026 (`packages/parser/corpus/facebook/`), which contributed the numeral and hyphen variants below. This list will grow — every auto-filed unknown-area issue (ARCHITECTURE §4.5) adds to it.

| VECO writes | Registry slug | Note |
|---|---|---|
| `Camputhaw` | `cebu-city.camputhaw` | PSGC agrees (`Camputhaw (Pob.)`); Wikipedia's `Kamputhaw` is the alias |
| `Hipodromo` | `cebu-city.hippodromo` | PSGC spells it `Hippodromo`; VECO's single-p form is the alias |
| `To-ong` | `cebu-city.to-ong-pardo` | PSGC is `To-ong Pardo`; VECO drops the suffix |
| `Alpaco` | `naga.alfaco` | PSGC spells it `Alfaco`; VECO and Wikipedia write `Alpaco` |
| `Sta. Cruz` | `liloan.santa-cruz` | Abbreviation — `Sta.` must expand to `Santa` |
| `Cantao‑an` | `naga.cantao-an` | Contains U+2011, not U+002D |
| `Lorega-San Miguel` | `cebu-city.lorega` | PSGC's *old* name; current is `Lorega`. A silent false negative until aliased |
| `Budlaan` | `cebu-city.budla-an` | PSGC `Budla-an (Pob.)`. Found by the Aug 16–22 corpus — a second silent false negative |
| `City of Naga` | `naga` (LGU) | Also seen as `Naga` |
| `Ward I` | `minglanilla.poblacion-ward-i` | PSGC prefixes all four with `Poblacion`; VECO writes the ward alone. Minglanilla is the only LGU in the franchise with wards, so the short form is unambiguous |
| `Ward II` | `minglanilla.poblacion-ward-ii` | as above |
| `Ward III` | `minglanilla.poblacion-ward-iii` | as above |
| `Ward IV` | `minglanilla.poblacion-ward-iv` | as above. Observed 2026-09-04: `Portion of Ward IV & Tunghaan, Minglanilla` matched Tunghaan only |
| `San Nicolas Proper` | `cebu-city.san-nicolas-central` | PSGC's *current* name is `San Nicolas Central`; `Proper` is the older local form, the same pattern as `Lorega-San Miguel`. **Inferred, wants confirming** — Cebu City has three other San Nicolas barangays, and the observed advisory (`San Nicolas Proper & Sawang Calero … along Tupas St. & Magsaysay St.`) points at Central by adjacency, not by name |
| `Sambag 1` | `cebu-city.sambag-i` | Arabic for PSGC's Roman. §3.2 predicted this |
| `Sambag 2` | `cebu-city.sambag-ii` | as above |
| `Lawaan 1` | `talisay-city.lawaan-i` | as above |
| `Lawaan 2` | `talisay-city.lawaan-ii` | as above |
| `Lawaan 3` | `talisay-city.lawaan-iii` | as above |
| `Camp 4` | `talisay-city.camp-iv` | as above, and the exact case §3.2 names |
| `Ward 1` | `minglanilla.poblacion-ward-i` | Arabic form; the Roman `Ward I` was added 2026-09-04 |
| `Ward 2` | `minglanilla.poblacion-ward-ii` | as above |
| `Ward 3` | `minglanilla.poblacion-ward-iii` | as above |
| `Ward 4` | `minglanilla.poblacion-ward-iv` | as above |
| `Tabunok` | `talisay-city.tabunoc` | PSGC ends it `-c`, VECO `-k`. A silent false negative on Talisay's busiest barangay |
| `Candulawan` | `talisay-city.cadulawan` | VECO inserts an `n`. PSGC has no `Candulawan` in any LGU |
| `Tugbungan` | `consolacion.tugbongan` | `u` for PSGC's `o` |
| `Paknaan` | `mandaue-city.pakna-an` | VECO drops the hyphen |
| `Tolo-tolo` | `consolacion.tolotolo` | VECO adds one |
| `Tagba-o` | `cebu-city.tagbao` | VECO adds one |
| `Calajoan` | `minglanilla.calajo-an` | VECO drops one |
| `Toong` | `cebu-city.to-ong-pardo` | Drops the hyphen AND the suffix; the existing `To-ong` alias covers only the suffix |
| `Duljo Fatima` | `cebu-city.duljo` | PSGC is bare `Duljo`. Also seen parenthesised, `Duljo (Duljo Fatima)` |
| `Poblacion Pardo` | `cebu-city.pardo` | PSGC is bare `Pardo` |
| `Buot` | `cebu-city.buot-taup-pardo` | VECO drops the compound suffix |
| `Lipata` | `minglanilla.linao` | Minglanilla's barangay is locally **`Linao-Lipata`**; PSGC records only `Linao`. VECO uses either half, sometimes both in one advisory, so `Lipata` alone would otherwise match nothing. Confirmed against PhilAtlas and the municipal list, not inferred |
| `Sto. Niño` | `cebu-city.central` | PSGC and this registry call it `Central`; Cebu City lists it as **`Santo Niño (Central)`** and everyone local calls it Santo Niño. A downtown barangay whose advisories would silently have matched nothing. `foldForMatch` already expands `Sto.` to `Santo`, so both spellings resolve |
| `Pung-ol Sibugay` | `cebu-city.pung-ol-sibugay` | PSGC hyphenates both halves (`Pung-ol-Sibugay`); VECO hyphenates only the first |

**`Sta.` → `Santa` normalisation is required, not optional.** VECO writes `Sta. Cruz`; both registry entries are `Santa Cruz`. Without expansion, every `Santa Cruz` advisory silently fails to match — a false negative, the failure class this product cannot tolerate. The same applies to `Sto.`, `Gen.`, and any other honorific abbreviation encountered.

---

## 6. Counts

| LGU | Barangays | Ambiguous ⚠ | Same-LGU collisions ▲ |
|---|---|---|---|
| Cebu City | 80 | 4 | 17 |
| Mandaue City | 27 | 3 | 0 |
| Talisay City | 22 | 7 | 3 |
| City of Naga | 28 | 1 | 5 |
| Liloan | 14 | 4 | 0 |
| Consolacion | 21 | 2 | 2 |
| Minglanilla | 19 | 3 | 4 |
| San Fernando | 21 | 3 | 2 |
| **Total** | **232** | **27** | **33** |

Counts above are machine-verified against §4 rather than tallied by hand — the first hand tally got four of them wrong, which is itself an argument for generating this table from the registry at build time.

Roughly **one barangay in nine** carries a name shared with another LGU, and one in seven participates in a same-LGU substring collision. Neither is an edge case.

---

## 7. Outstanding work

| # | Item | Gate |
|---|---|---|
| 1 | ~~Obtain the PSGC dataset directly and resolve the §1 disagreements~~ **Done** — `packages/registry/psgc/` | — |
| 2 | ~~Populate `psgc` codes for all 8 LGUs and 232 barangays~~ **Done** — every entry carries its 9-digit code | — |
| 3 | Confirm whether **every** barangay in a franchise LGU is actually served by VECO — if not, unserved entries would appear selectable and stay permanently silent | M2 |
| 4 | Verify Minglanilla's Poblacion Wards: this draft records four (I–IV); confirm no fifth exists | M2 |
| 5 | Harvest 12 weeks of advisories to grow the §5 alias table before release | M2 |
| 6 | Stand up the R9 coverage report — the only false-negative detector in the system | M2 |
