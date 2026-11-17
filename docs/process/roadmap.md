# Roadmap

Lifecycle: **living**

What is built next, in order: milestones, and under each the issues in the order they are taken. Detail lives on the issues and design pages. The design chat keeps this order with Jason.

**Direction:** a real-time shipping line management game from 1900, in a world where the liner trade never declined ([direction.md](../design/direction.md)).

**The goal is V1: 1.0.0, the game complete and balanced from 1900 to the present day.** The next step is 0.40.0: 1900 to 1939 complete and balanced. Anything that does not get us there is an `idea` issue and waits.

The order below was set by Build #1 from the old roadmap and the known-issues log on 17 November 2026; a design chat reviews it with Jason next.

## 1. Finish what is in flight

The engineering passes, before any further game work. Formatting and the fingerprint come first so every later step can be proved.

1. #2 Get every test green on 0.39.8
2. #3 Format all code with Prettier in one commit
3. #4 Build the fingerprint tool
4. #5 Move to ES modules with Vite, still JS
5. #6 Split the core from the screen and add the tooling
6. #7 Host on GitHub Pages and retire the artifact
7. #8 Convert to TypeScript, loose
8. #9 Turn on TypeScript strict, with types for the state

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
5. #36 KI-064 (S3): idle cash earns nothing (ask Jason whether it waits for #14)

## 4. Balance 1900 to 1939

Root cause first, then each era against the targets in `docs/design/balance.md`.

1. #14 KI-133 (S1): ships earn far too much at the loads trades really run at (carries KI-117)
2. #15 KI-065 (S2): the game is far too generous to a skilled player before 1914
3. #16 KI-077 (S3): the Great War is almost riskless for a Line
4. #17 KI-118 (S2): the Depression is mild (to confirm)
5. #18 KI-119 (S2): rivals' ships booked far below the yard's price (to confirm)
6. #19 KI-120 (S2): Imperial Atlantic fails before the war (to confirm)
7. #20 KI-134 (S2): the Combine offers 1.3 to 1.6 times net worth

## 5. Advice, text and polish

1. #28 KI-053 (S3): conference advice contradicts itself
2. #30 KI-128 (S3): accepting a build proposal headless opens the drawing office
3. #34 KI-046 (S3): advice to replace a "popular" captain recurs every quarter
4. #35 KI-052 (S4): "Departments pay their way" advised at any fleet size
5. #38 KI-084 (S4): fares show as decimal pounds
6. #37 KI-132 (S4): small items from round 8
7. #39 KI-086 (S4): text errors from rounds 5 and 6
8. #27 KI-001 (S3): large fleets near unplayable (Jason measures on his desktop)

## 6. Ship 0.40.0

1. Test round 9: three games 1900 to 1939, within the targets (`docs/process/releasing.md`, "Test rounds")
2. The 0.40.0 release

## Design questions, settle any time

- #26 Confirm the pillars on the direction page
- #22 KI-121: knowing the history (calendar exploits in the share market)
- #23 KI-107, #24 KI-108, #25 KI-109: the 1929 Crash, the 1930s market, the 1907 rumour (wait on #22)

## After 0.40.0

Each era starts with a research pass in `docs/design/research/`, then a design page, then issues, and ends with a test round (`docs/design/direction.md`, "V1"). A design chat opens the issues when the era begins.

- **0.41: the Second World War, 1939 to 1945** (decided 4 October 2026)
- **0.42 to 0.4x: 1945 to 1966**
- **0.5x to 0.6x: 1966 to 1990**, after #48
- **0.7x to 0.8x: 1990 to 2010**
- **0.9x: 2010 to now**, and the final balance pass
- **1.0.0**

## Ideas, kept and not scheduled

#40 desktop app (KI-092), #41 two-class ships (FR-03), #42 cruise segments (FR-04), #43 bigger cruise ships (FR-05), #44 an owner's yacht (FR-06), #45 casinos and discos (FR-07), #46 "Fredrick" (FR-09), #47 Soviet budget lines (FR-10), #48 design the decades after 1966 (FR-12), #49 rivals take each other over.

## Releases

**Released as 0.39.8** (6 October 2026): competition, outside tonnage and the Depression's fares; test round 8 then failed the balance gate. Next: the engineering passes, then 0.40.0. Saves: `steerage-saloon-v3`.

Earlier releases and test rounds, 0.35.6 to 0.39.8: `docs/archive/roadmap-0.39.8.md` and `docs/process/changelog.md`.
