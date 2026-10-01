# Roadmap

The road from 0.35.5 to 1.0. 1.0 is the game complete from 1900 to the present day. The first milestone, 0.40.0, is 1900 to 1940 complete and balanced; each later era is then researched and built the way 1900 to 1930 was: sources first, then the trades, the ships, the rivals and the events. Each patch is small enough to test on its own, and none ships until its tests pass. Issue numbers (KI-, FR-) refer to `KNOWN_ISSUES.md`.

## Tests run on every patch

| Test | Command | Pass |
|---|---|---|
| Lint | `node tools/lint.js` | clean |
| Exploits | `node tools/exploits.js 3` | PASS |
| Careful harness | `END=1922 node tools/harness.js careful 40` | about 6 of 40 bankrupt |
| Markets | `node tools/stakes.js`, `tools/float.js 3`, `tools/moves.js 3` | PASS |
| World | `node tools/world.js 6` | PASS |
| Desk | `node tools/desk.js 3` | PASS |
| Forecasts | `node tools/forecast.js 6` | PASS |
| UI smoke | the browser smoke and legacy-save scripts | no page errors |

Each patch adds its own checks, listed below. Where a patch closes an exploit, the check goes into `tools/exploits.js` so it stays closed.

## Patches

Players see a short version of this plan, and what each release brought, in the game: Menu, What's new and coming next (`js/devlog.js`).

| Version | Theme | Contents | Its own tests |
|---|---|---|---|
| 0.35.6 (done) | Round 3 exploits and bugs | KI-010 merged ships resale-capped; KI-011 new ships resale-capped; KI-012 boom offers capped; KI-013 cover frozen on lost and overdue ships; KI-014 a real short for a bear raid, none in wartime; KI-015 Tourist Third in tension and matching; KI-020 1912 disaster window closes; KI-021 war losses paid as war claims; KI-022 no advice or purchases for closed routes; KI-025 slip held through drawings; KI-027 no scrapping requisitioned ships; KI-042 mail-contract warnings; KI-087 iPhone header | New exploit checks for merge-and-strip, boom resale, cover after loss and a token short; the 1912 disaster fires on time from a 1911 save and never from a 1914 one |
| 0.35.7 (done) | Small bugs and text | KI-017 auction checks cash; KI-028 fare revision follows prices both ways; KI-029 agency and pier earnings recorded; KI-030 no German yard before the peace; KI-031 top-up only before a loss; KI-032 advice buttons survive a month; KI-044 boats advice only where it binds; KI-080 rival names unique, no closed-route moves; KI-081, KI-082, KI-084, KI-085, KI-086 text | Name uniqueness over 40 seeds; news lines a month for rival moves below a limit |
| 0.36.0 (done) | Performance | KI-001: redraw only changed panels, at most about 10 a second; build only visible rows; skip hidden panes; a frame-time readout (simulation against drawing) | A 70-ship game at top speed: 55 fps or better on every tab, no frame over 100 ms |
| 0.36.1 (done) | Delegation | KI-090 and FR-02: standing orders for each department; an inbox of the owner's decisions only (at most about 8), the rest as summaries; masters' discretion for minor emergencies in big fleets; quiet watch | A 70-ship year: inbox never over 8; clock never held by a minor emergency |
| 0.36.2 (done) | Running a fleet by line | KI-090: line managers and line policies; KI-093 built-for shown and respected by advice, capacity warning when ordering; KI-040 forecasts within a fifth, no piling; KI-041 Fares Office keeps the conference floor | Forecast against actual over 20 seeds within 20%; no advice batch sends more ships to a line than its trade fills |
| 0.36.3 (done) | Hotfix | A panel that fails to draw no longer blanks the game; a notice says what failed | Fault injected into one panel: the rest draws and the clock runs |
| 0.36.4 | Scale costs and the camera | KI-090: office and shore support by tonnage, lines and ports; a check of large-ship running costs against the sources; FR-01 follow-ship camera | Cost per ship at 10, 30 and 70 ships against the target curve; harness unchanged |
| 0.37.0 | Rescue and harder shocks | KI-091 rescue (banks or a rival before the 1920s, the Treasury after; dilution, a government director, no dividend until repaid, a second failure final); KI-060, KI-061, KI-062 rebalanced with it; KI-063, KI-065 | Long harness to 1939: careful owners mostly survive, through rescue where needed; no seed is rescued twice and survives a third failure |
| 0.37.1 | The war and the ship's hospital | KI-023 war freight to its history; KI-024 Admiralty hire and a choice of ships; KI-026 Excess Profits Duty on sale profits; FR-08 ship's surgeon and hospital standard; FR-11 a major disaster about once a decade, of several kinds | War-year profit against 1913 within the historical band; duty charged in the boom |
| Test round 4 | Test players, 1927 to 1945 | Both test players on 0.37.1; findings into a patch 0.37.2 | |
| 0.40.0 | Milestone | 1900 to 1940 complete and balanced; every S1 and S2 issue closed | Full suite on 40 seeds |

## From 0.40 to 1.0

The eras after 1940, in this world where the liner trade never declined. Each starts with a research pass (`docs/overhaul/research/`), then a design note, then patches as above, and ends with a round of test players over the era.

| Versions | Era | Contents |
|---|---|---|
| 0.4x | 1940 to 1966 | The world as already sketched (no Second World War, the Atlantic Air Conference, tourist-class boom), researched properly; two-class ships (FR-03) |
| 0.5x to 0.6x | 1966 to 1990 | FR-12: the cruise trade's rise, casinos and discos (FR-07), Soviet budget lines (FR-10), larger ships and new artwork (FR-05) |
| 0.7x to 0.8x | 1990 to 2010 | Mega ships, the family cruise lines and "Fredrick" (FR-04, FR-09), the safety rules after the great disasters |
| 0.9x | 2010 to the present | The modern trade, and the final balance pass over the whole game |
| 1.0.0 | Release | 1900 to the present complete and balanced |

## Later

| Theme | Contents |
|---|---|
| Desktop build | KI-092: file saves and backups, no background throttling, an installer. Before or after 1.0, as needed. |
