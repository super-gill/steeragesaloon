# Direction

Lifecycle: **living**

What Steerage & Saloon is, what every feature must serve, and what V1 is. Every issue is tested against "does this get us to V1?"; if not, it is an `idea` issue and waits.

## The pitch

A real-time shipping line management game: you run the Morven Line from its Glasgow head office from January 1900, with one elderly emigrant ship, through the history of the North Atlantic liner trade and on into a world where that trade never declined.

## Pillars

**Not yet agreed.** No pillars were ever written down; these are drafted from the README and the old roadmap for Jason to confirm or change (#26).

1. **History first.** Prices, fares, emigration, ships, lines and events follow the period's sources, researched before they are built (`docs/design/research/`). After the real history runs out, the invented world stays plausible for its era.
2. **A real business.** The numbers behave like the trade they model. A good owner grows the way real lines grew, not tenfold; loopholes a real shipowner could not use are bugs (`docs/design/balance.md`).
3. **History happens to you.** Rate wars, the 1912 disaster, the Great War, the quotas, the boom and the crash, the Depression: each changes what pays, and an owner who does not adapt fails.
4. **From one ship to a great fleet.** The game stays playable and readable at seventy ships and more: delegation, departments, running by line, costs that grow with the fleet.

## Constraints

- **Real tragedies under fictional names, handled with respect.** The 1912 disaster is the Titanic under fictional names; later great disasters likewise. Parodies of real companies use no real names, characters or marks (FR-09).
- **Only failure ends the game:** going bust after any rescue, a negligence ending, or losing the Line through the share market (`docs/design/systems.md`).

## V1

**V1 is 1.0.0: the game complete and balanced from 1900 to the present day.** Each era is researched and built the way 1900 to 1930 was: sources first, then the trades, the ships, the rivals and the events, then a round of test players over the era.

| Version | Era | What it is |
| --- | --- | --- |
| 0.40.0 | 1900 to 1939 | The first milestone: 1900 to the outbreak of the Second World War complete and balanced, every S1 and S2 issue closed, a test round within the balance targets |
| 0.41 | 1939 to 1945 | The Second World War: requisition, the Atlantic campaign and convoys, losses and compensation, rebuilding, the troopship years; money and taxes from 1939 rewritten for the war |
| 0.42 to 0.4x | 1945 to 1966 | The post-war world, the Atlantic Air Conference and the tourist-class boom, two-class ships (#41) |
| 0.5x to 0.6x | 1966 to 1990 | The cruise trade's rise (#48), casinos and discos (#45), Soviet budget lines (#47), larger ships and new artwork (#43) |
| 0.7x to 0.8x | 1990 to 2010 | Mega ships, family cruise lines and "Fredrick" (#42, #46), the safety rules after the great disasters |
| 0.9x | 2010 to now | The modern trade, and the final balance pass over the whole game |
| 1.0.0 | | 1900 to the present complete and balanced |

The roadmap (`docs/process/roadmap.md`) holds the order of the issues towards each step.

## The world after 1939

The game's world departs from ours after 1939. The Second World War goes in from 0.41; until then the game runs on in peace after 1939. Jets are capped by the Atlantic Air Conference in 1962, and the liner trade never declines. The invented events currently stop in 1966. New features must fit the theme and be at least roughly historical; later ones are judged against what this world would plausibly do.

## Decision record

Dated decisions about this page, newest first: date, decision, who decided.

- 2026-11-17: **GitHub is the home** (Jason): the project runs on `super-gill/vibe-process` 0.1.0 (core, modules `browser-game` and `typescript`), fully aligned with the Heliopause process; no more claude.ai artifact as the game's home (#7) or as a design doc.
- 2026-10-04: **The Second World War goes in** (Jason), as 0.41 after the 0.40.0 milestone, replacing this world's peace after 1939. Recorded in the 0.39.3 changelog.
- 2026-10-01: **1.0 is 1900 to the present** (Jason): the first milestone, 0.40.0, is 1900 to 1939 complete and balanced; each later era is researched and built the same way. Recorded in the old roadmap at 0.35.5.
- 2026-10-01: **Feature requests judged on theme and history** (Jason): the verdicts on FR-01 to FR-12 (requests from Ross) are on their issues; FR-06, private superyachts, was rejected as outside the subject, with an owner's yacht as a prestige purchase kept as an idea (#44).
- 2026-09-28: **1900 is the only start** (Jason): old saves retired at 0.19.0, when the calendar moved to a 1900 base. Games begun in 1921 load and keep their rules.
- 2026-09-28: **Real tragedies, fictional names** (Jason): a fictional Great War of 1914 to 1918; the 1912 disaster is always a total loss, the Titanic under fictional names, handled with respect, falling on the worst-run giant at sea (usually a rival's), its date, route and cause varying a little. From the 1900 overhaul design, built in 0.24.0 and 0.26.0.
