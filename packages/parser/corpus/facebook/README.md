# Facebook corpus

Real Visayan Electric Facebook posts, captured 4–5 September 2026 from the page as a logged-out
reader sees it. Kept verbatim, including the Unicode mathematical bold VECO writes in — NFKC
normalisation is part of what these files exist to test, so **do not "clean" them**.

These are the only samples of this format we have, and they were captured by hand. Every parser
change for rotational brownouts is tested against them, and a vendor's output is judged by whether
it reproduces them faithfully (see docs/ROTATIONAL-BROWNOUTS.md §7.1).

| File | What it exercises |
|---|---|
| `rotational-advisory.txt` | 16 windows × 32 area groups, `DAILY` multi-day expansion, `Portion of <LGU>: <list>` grammar, per-group map links |
| `maintenance-advisory.txt` | The familiar website format, as it appears on Facebook |
| `status-update.txt` | `UPDATE #n`, ONGOING and RESTORED sections — the live-state data |
