# Known Issues

Steerage & Saloon 0.37.2. This log records every known defect, loophole and open question that has not been fixed in a released version. Balance targets and accepted behaviour are in `docs/overhaul/BALANCE.md`; this file covers what is wrong or unfinished.

**Severity**

| Level | Meaning |
|---|---|
| S1 | Breaks the game: a large exploit, a crash, or a system that is unusable |
| S2 | Wrong result: numbers, events or rules that do not work as designed |
| S3 | Minor: small loopholes, odd behaviour, missing warnings |
| S4 | Text and presentation only |

**Status:** Open (not yet scheduled), Planned (assigned to a version), Discuss (needs a design decision first), Fixed (the version that fixed it; kept here for one release, then moved to the changelog only).

**Sources:** P2, P3 and P4 are the test-player rounds (P2 played 1900 to 1914 on 0.35.4; P3 played 1914 to 1927 on 0.35.5; P4 played 1927 to 1945 on 0.37.1). Notes with full repro steps are in `tools/play/` (gitignored). U is the owner's own report.

---

## Performance

| ID | Sev | Status | Issue |
|---|---|---|---|
| KI-001 | S3 | Partly fixed (0.36.1) | **Large fleets make the game near unplayable** (U, at 70 ships). The monthly freeze, most per-frame costs and the emergencies' hold on the clock are gone (0.36.0, 0.36.1); not yet measured on a desktop. See below. |

**KI-001 detail.** Measured with `tools/perf.mjs` in headless Chromium without a graphics card (processor painting, so a floor), 70 ships at top speed:

| | 0.35.7 | 0.36.0 |
|---|---|---|
| Frames a second, main tabs | 43 to 55 | 49 to 57 |
| Slowest frame | about 750 ms, once a game month | 33 to 133 ms |
| Game days a second at 14× | 3.7 to 4.2 | 4.2 |

- **Fixed in 0.36.0:** head office's advice froze the screen for most of a second each game month (now worked out a few milliseconds a frame, and about half the work); chart markers forced a page layout every frame; the funnel smoke repainted the ship panel every frame; an action worked out the advice twice.
- **Still open:**
  - (Fixed in 0.36.1) Emergencies scale with the fleet; under Auto only grave ones stop the clock from fifteen ships.
  - Each game day still redraws the visible panels (20 to 50 ms at 70 ships on processor painting). Building only the visible rows of the Fleet list is left until a fleet of a hundred or more shows it is needed.
  - Not yet measured on a desktop with a graphics card; the readout (Menu, Settings, Frame times) shows it on any machine.
- **Design question:** steering the player away from very large fleets was decided against; see KI-090.

## Exploits

| ID | Sev | Status | Source | Issue |
|---|---|---|---|---|
| KI-016 | S3 | Fixed (0.37.2) | P3, P4 | Consols followed a fixed yield table, so a holding's path was known in advance; P4 geared £235m of debt on it. Prices now wander a few tenths of a per cent of yield either side, and borrowing on stock is limited to twice the Line's worth. |

## Bugs

| ID | Sev | Status | Source | Issue |
|---|---|---|---|---|
| KI-023 | S2 | Fixed (0.37.1) | P3 | War freight fell far short of its own text. Rates now follow the free market to 1916, the Ministry's control from 1917 and the 1919-20 boom; checked by `tools/warprofit.js`. |
| KI-024 | S2 | Fixed (0.37.1) | P3 | The player could not choose which ships went to war service without the reserve list. Ships can now be offered at any time in the war. The hire was left as it is: it matches the Blue Book rates against the open market. |
| KI-026 | S2 | Fixed (0.37.1) | P3 | Excess Profits Duty never charged: its standard rose with prices, and sale gains were not profit. Both fixed. |

## Advice and departments

| ID | Sev | Status | Source | Issue |
|---|---|---|---|---|
| KI-040 | S2 | Fixed (0.36.2) | P1, P2 | Forecasts are optimistic for mixed ships (about half the forecast on three moves). Move advice piles ships onto one line without counting the ones already sent. |
| KI-041 | S2 | Fixed (0.36.2) | P2 | The Fares Office sets fares below the conference floor. |
| KI-043 | S3 | Open | P3 | The forecast horizon ignores the certain July 1924 quota cut. |
| KI-045 | S3 | Fixed (0.37.2) | P2, P4 | Advice flipped tables and advertising with no memory, and moved ships back and forth. A table or advertising changed in the last six months is left to settle, and a ship moved in the last year needs twice the margin to move again. |
| KI-046 | S3 | Open | P2 | Captain advice to replace a "popular" captain recurs every quarter on the adjective alone. |
| KI-047 | S3 | Open | P3, P4 | Tourist Third looks very strong: tourist ships repaid their cost in about 18 months in the late 1920s and 1930s (Arran, £679k, made £409k in nine months; Morven Princess, £1.08m, £524k in 1944). Needs checking against the trade's history before changing. |
| KI-048 | S4 | Fixed (0.36.2) | U | **The game never shows what line a ship was built for.** `designLine` is saved at delivery but used nowhere. The design does matter (bunkers for the longest leg, draught for the ports, seakeeping for the route), so a ship moved to another line can be short-legged or too deep without the player knowing why. Fix: show "Built for ..." in the ship detail and fleet manager, and flag a mismatch with its reason. |

## Economy and balance

| ID | Sev | Status | Source | Issue |
|---|---|---|---|---|
| KI-060 | S2 | Open | Harness, P4 | **The Depression.** The test players found it mild for a well-run line (no losing year; ship values did not fall). 0.37.2 makes it harder: second-hand ships lose two fifths of their worth at the trough, and steerage to North America falls to about a third. The scripted careful owner now goes bankrupt in 10 of 20 games to 1939 (5 rescued, 3 of them failed again), mostly small fleets that sell ships at the bottom. Whether that owner is too passive or the slump too hard needs a human player. |
| KI-061 | S2 | Fixed (0.37.2) | P2, P4 | A bank failure took three quarters of the Line's cash on the day (£31.8m from one player in 1938). The deposit is now frozen and fifteen shillings in the pound comes back over eighteen months; a quarter is lost. A rumour about the bank stays under Needs attention until it passes. |
| KI-062 | S3 | Discuss | Harness | Rival failures run at 7.2 a decade against 6.3 for 0.34, and 11 to 13 a game in the 1920s. See KI-091. |
| KI-063 | S3 | Open | Harness | Shipping shares recover to only 0.90 of worth by 1937. |
| KI-064 | S3 | Open | P3 | Idle cash earns nothing. A real line would hold deposits at bank rate less a margin. |
| KI-066 | S3 | Open | P4 | The Line's loan rate is a fixed 6.5% from 1900 to 1945, while the game's own Consols yielded 2.9% in 1935 (cheap money). |
| KI-067 | S3 | Open | P4 | The investment account lost 24% of £10m in fifteen months (1935-36) while shipping shares rose 44%: it buys seven small companies each quarter and pays its own price impact both ways. |
| KI-068 | S3 | Open | P4 | When a big rival fails (Imperial Atlantic, 23 ships, November 1939), no new line enters its main trade for about two years, leaving the Line a monopoly on Liverpool to New York. |
| KI-065 | S3 | Open | Harness | The advisor strategy finishes far ahead of the careful one (about 11×, and widening). |

## Text and presentation

| ID | Sev | Status | Source | Issue |
|---|---|---|---|---|
| KI-083 | S4 | Fixed (0.37.1) | Harness | Stale war-outbreak text: it promised every hold would fill and freight would reach three times its pre-war worth. |

## Design questions

| ID | Status | Question |
|---|---|---|
| KI-090 | Done (0.36.5) | **Large fleets are supported, not discouraged.** Done: performance, delegation, running by line. Costs that scale with tonnage, lines, ports and fleet size: 0.36.5. Decided: make them playable (KI-001), hand routine work to masters and departments (standing orders, an inbox that shows only the owner's decisions and summarises the rest), let the player run a fleet by line, and make shore support scale with the fleet properly. Office cost today is `600 + 250n + 18n^1.6` a month (n = ships): it counts hulls only (a tramp costs the same as a 45,000-ton liner) and ignores the number of lines and ports. |
| KI-091 | Done (0.37.0) | **Rescue instead of game over.** Done: banks, a rival or the Treasury, once; see the README. Not done: a forced merger, and rival lines rescued by the same rules (they keep their own reconstruction). An insolvent Line gets a likely, not certain, rescue: a bank consortium or rival line before the 1920s, the Treasury after, with lasting costs (dilution, a government director, no dividends until repaid, possibly a forced merger; a second failure is final). With a safety net the game can hit harder (KI-060, KI-061 to be rebalanced together). Rival failures can use the same machinery. |
| KI-092 | Discuss | **Desktop app (Electron).** Pinned; not needed for 0.40. It runs the same engine, so it does not fix KI-001. It would give file saves and backups without the browser's storage limits, no throttling when the window is in the background, a database (SQLite) for long histories, and a Steam-style installer. |
| KI-093 | Fixed (0.36.2) | **Advice moves ships off the line they were built for, and the player loses track.** Count the design line in move advice, show built-for and mismatches in the fleet manager and line view, and warn when ordering a ship for a line already near its trade's capacity. Replaces KI-048. |

## Feature requests

New features must fit the theme and be at least roughly historical. After 1939 the game's world departs from ours (no Second World War; jets capped by the Atlantic Air Conference in 1962; the liner trade never declines; the invented events currently stop in 1966), so later requests are judged against what that world would plausibly do.

| ID | From | Verdict | Request and notes |
|---|---|---|---|
| FR-01 | Ross | Done (0.36.5) | **Follow-ship camera**: lock the map onto one ship, zoomed in. |
| FR-02 | Ross | Done (0.36.1) | **Quiet watch**: suppress interruptions except major disasters. The same work as KI-090 (standing orders, masters' discretion, a short inbox). |
| FR-03 | Ross | Adapt | **Classes merge in the 1960s.** Historically the Atlantic lines went to two classes, First and Tourist, through the 1950s and 60s ("Economy" is an airline word). Cruising was one class from the start. Proposed: two-class ships from the late 1950s, one-class cruise ships. |
| FR-04 | Ross | Adapt | **Family class from the 1980s.** Cruise ships did not reintroduce classes; families were a market, not a class. Proposed: cruise market segments (budget, premium, family) that a ship's facilities appeal to. |
| FR-05 | Ross | Accept, later era | **Cruise ships grow from the 1980s**, with new artwork for each era's large ships. Historical (73,000 GT in 1988, 100,000 GT by 1996, 137,000 GT by 1999). Needs the later decades designed first (FR-12). |
| FR-06 | Ross | Reject as stated | **Private superyachts.** A shipping line is not a yacht builder, and it is outside the game's subject. Possible alternative in any era: an owner's yacht as a prestige purchase (shipowners did keep them), affecting reputation and society events, not trade. |
| FR-07 | Ross | Accept, later era | **Casinos from about 1970** (historical: casinos at sea grew with Caribbean cruising in the 1970s). **Discos** in the 1970s, renamed **nightclubs** later: acceptable as era names for the same facility; the 1989 date is arbitrary, so it can be fixed to the end of the 1980s. |
| FR-08 | Ross | Done (0.37.1) | **Medical bays.** Not historical as an optional extra: emigrant ships had to carry a surgeon long before 1900. Proposed: a surgeon is required with steerage from the start; the hospital's standard is optional and improves the outcome of epidemics and quarantine (the existing quarantine emergency), with better hospitals standard from the 1940s. |
| FR-09 | Ross | Accept, later era | **"Fredrick"**, a parody of a long-running American entertainment company, launches very large family cruise ships. Historical parallel (a family cruise line from an entertainment company, late 1990s). Parody only: no real names, characters or marks. Better timed to the late 1980s or 1990s than the early 1980s. |
| FR-10 | Ross | Adapt | **Soviet cruising, 1970s to early 1990s.** The competitor half is historical: Soviet state lines ran cheap ships chartered to Western cruise operators and undercut on price, and this ended abruptly after 1991. Soviet citizens were not a cruise market, so this should be a budget competitor and a source of cheap charters, not a new market. |
| FR-11 | Ross | Done (0.37.1) | **A major disaster about once a decade**, not only one type (fire, collision, grounding, capsize, hijacking). Historical: Morro Castle 1934, Andrea Doria 1956, Lakonia 1963, Achille Lauro 1985, Herald of Free Enterprise 1987, Estonia 1994, Costa Concordia 2012. Goes with the rescue mechanism (KI-091). |
| FR-12 | Dev | Accept (0.5x on) | **Design the decades after 1966** before adding late-era content, researched and built the way 1900 to 1930 was (sources first, then trades, ships and events). FR-03, 04, 05, 07, 09 and 10 depend on it. |

## Test tooling

| ID | Sev | Status | Issue |
|---|---|---|---|
| KI-100 | S3 | Open | The headless player has no actions for zigzag, convoy or the private war-risk top-up. |
