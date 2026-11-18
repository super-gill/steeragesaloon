# Roadmap

Lifecycle: **living**

What is built next, in order, towards the current milestone. The milestones themselves (0.40.0, then each era to 1.0.0) are defined in `docs/design/direction.md`, "V1". The numbered sections below are steps within the current milestone, and under each the issues in the order they are taken; a closed issue comes off the list. Detail lives on the issues and design pages. The design chat keeps this order with Jason.

**Direction:** a real-time shipping line management game from 1900, in a world where the liner trade never declined ([direction.md](../design/direction.md)).

**The goal is V1: 1.0.0, the game complete and balanced from 1900 to the present day.** The next step is 0.40.0: 1900 to 1939 complete and balanced. Anything that does not get us there is an `idea` issue and waits.

The order below was set by Build #1 from the old roadmap and the known-issues log, and reviewed by Jason with Design, on 17 November 2026.

## 1. Finish what is in flight

The engineering passes, before any further game work. Formatting (#3) and the fingerprint (#4) are done, so every later step can be proved.

1. #51 Commit a UI smoke and legacy-save check (before #52 to #54, which rely on old saves loading)
2. #5 Move to ES modules with Vite, still JS
3. #7 Host on GitHub Pages and retire the artifact (needs only #5, so a playable link comes before the big refactor)
4. #6 Split the core from the screen and add the tooling
5. #8 Convert to TypeScript, loose

TypeScript strict (#9) waits until after 0.40.0: no player sees it, and loose types give most of the safety.

## 2. Bugs and exploits

Before any tuning, so the balance is measured on a game that works.

1. #10 KI-122 (S2): taking a ship from a controlled line never works
2. #11 KI-123 (S1): take a ship then merge the same day pays twice (ship with #10)
3. #12 KI-125 (S2): Consols have one price for holders and another for buyers
4. #13 KI-124 (S2): Tourist Third demand draws outside ships before it exists
5. #21 KI-126 (S3): winding up a rival before 1921 empties its trades

## 3. Fixes that move the money

Smaller issues that change what a Line earns, so they go in before the balance pass.

1. #31 KI-129 (S3): the Line's fares drift off the line rate between Januarys
2. #33 KI-131 (S3): the Traffic Department's moves ignore mail contracts
3. #29 KI-127 (S3): no advice to put back steerage after the war-cargo refit
4. #32 KI-130 (S3): an order quoted "slip free this month" waits a year

## 4. Settle the share market

Design questions inside 0.40.0 that move money, so they are settled, and any build issues they open are built, before the balance pass. History varies per game (#22, agreed 18 November 2026, `docs/design/varied-history.md`).

1. #52 Each game draws its own history; the 1907 panic varies (closes #25 KI-109)
2. #53 The Depression varies per game across the whole economy (re-measures #24 KI-108)
3. #54 The late-twenties rise and the Crash vary per game, with warnings (closes #23 KI-107)

## 5. Balance 1900 to 1939

Root cause first, then each era against the targets in `docs/design/balance.md`.

1. #14 KI-133 (S1): ships earn far too much at the loads trades really run at (carries KI-117)
2. #36 KI-064 (S3): idle cash earns nothing (after #14, so new income does not muddy its measurement)
3. #55 Consols 1929 to 1935: measure the sure gain (after #36)
4. #15 KI-065 (S2): the game is far too generous to a skilled player before 1914
5. #16 KI-077 (S3): the Great War is almost riskless for a Line
6. #17 KI-118 (S2): the Depression is mild (to confirm)
7. #18 KI-119 (S2): rivals' ships booked far below the yard's price (to confirm)
8. #19 KI-120 (S2): Imperial Atlantic fails before the war (to confirm)
9. #20 KI-134 (S2): the Combine offers 1.3 to 1.6 times net worth

## 6. Advice, text and polish

1. #28 KI-053 (S3): conference advice contradicts itself
2. #30 KI-128 (S3): accepting a build proposal headless opens the drawing office
3. #34 KI-046 (S3): advice to replace a "popular" captain recurs every quarter
4. #35 KI-052 (S4): "Departments pay their way" advised at any fleet size
5. #38 KI-084 (S4): fares show as decimal pounds
6. #37 KI-132 (S4): small items from round 8
7. #39 KI-086 (S4): text errors from rounds 5 and 6
8. #27 KI-001 (S2): large fleets near unplayable (Jason measures on his desktop; pillar 5)

## 7. Ship 0.40.0

1. Test round 9: three games 1900 to 1939, within the targets (`docs/process/releasing.md`, "Test rounds")
2. The 0.40.0 release

## After 0.40.0

Each era starts with a research pass in `docs/design/research/`, then a design page, then issues, and ends with a test round (`docs/design/direction.md`, "V1"). A design chat opens the issues when the era begins.

- **First:** #9 Turn on TypeScript strict, with types for the state
- **0.41 to 0.4x: 1939 to 1966**, with no Second World War; the era designs its own shocks (decided 17 November 2026)
- **0.5x to 0.6x: 1966 to 1990**, after #48
- **0.7x to 0.8x: 1990 to 2010**
- **0.9x: 2010 to now**, and the final balance pass
- **1.0.0**

## Ideas, kept and not scheduled

#40 desktop app (KI-092), #41 two-class ships (FR-03), #42 cruise segments (FR-04), #43 bigger cruise ships (FR-05), #44 an owner's yacht (FR-06), #45 casinos and discos (FR-07), #46 "Fredrick" (FR-09), #47 Soviet budget lines (FR-10), #48 design the decades after 1966 (FR-12), #49 rivals take each other over, #50 a wild turn after 1.0, such as space tourism.

## Releases

**Released as 0.39.8** (6 October 2026): competition, outside tonnage and the Depression's fares; test round 8 then failed the balance gate. Next: the engineering passes, then 0.40.0. Saves: `steerage-saloon-v3`.

Earlier releases and test rounds, 0.35.6 to 0.39.8: `docs/archive/roadmap-0.39.8.md` and `docs/process/changelog.md`.
