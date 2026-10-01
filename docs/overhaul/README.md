# The 1900 overhaul: working notes

The full design lives in the design doc; this file is the short version kept
with the code, so any session can pick the work up.

Design doc: https://claude.ai/code/artifact/03225030-13a8-49bb-b203-a6b581a98828

| Tab | What it holds |
| --- | --- |
| Summary for Ross | One page on what is changing |
| 1900 start and the Great War | The eras, 1912, the war, the negligence ending, stages 0 to 5 |
| Build plan | The one build order, and the 0.16.0 changes in full |
| Rival companies and the markets | Rivals as companies, the share market, stages R1 to R5 |
| Game-wide changes | Clock, insurance, current affairs, liveries, boom freight, shore earnings |
| 1900 to 1940 data | Real prices, fares, emigration, costs, ships and lines, with sources |

The research notes behind the data tab are in `research/`.

## Decisions

- 1900 is the only start; old saves are retired at 0.19.0.
- The overhaul builds to about 1940 (milestone 0.40.0). The later eras follow in the same way, and 1.0.0 is the game complete to the present day (see `ROADMAP.md`).
- The clock runs at half today's speed (a year is about 20 minutes at 1x),
  with a new 14x at today's 7x. Big events slow the clock, never pause it.
- Money follows real history year by year: the price index is about 0.40
  in 1900 against 1.00 in 1921, and the 1921 to 1939 game should follow the
  real index too.
- A fictional Great War, 1914 to 1918. No Second World War.
- The 1912 disaster is always a total loss, the Titanic under fictional
  names, handled with respect. It falls on the worst-run giant at sea,
  usually a rival's; date, route and cause vary a little.
- Only going bust ends the game, and a negligence ending: a line that loses
  a ship through neglect, after warnings, can be wound up when the claims
  cannot be paid.
- Rivals become real companies; the Trust is the International Ocean
  Combine; the share market is safely ignorable through a broker.

Settled in 0.29 (open questions on the design doc's markets tab): every rival line is listed, in London, including the foreign lines; the market is the rival lines plus eight companies next to shipping; the Line's own price waits for floating (R4). Settled in 0.30: a controlled rival trades on as a subsidiary under its own name and flag until merged; only the Line's own holding counts towards a stake, not the investment account's. Settled in 0.31: a removed owner's game ends (keeping their shares), as does a successful bid; a white knight need not be British.

## Build order

Balance issues left open by each release are listed in [BALANCE.md](BALANCE.md), for the final pass before 0.40.0.

| Release | Scope |
| --- | --- |
| 0.16.0 | Balance pass: the 12 stacked changes (below) |
| 0.17.0 | Half-speed clock and 14x; events slow instead of pause; per-ship insurance |
| 0.18.0 | Current affairs panel |
| 0.19.0 | Calendar moved to a 1900 base, date code in one place; saves break (done: identical results confirmed) |
| 0.20.0 | Rivals as real companies (R1) (done: accounts, failures, new lines; `tools/companies.js`) |
| 0.21.0 | Shore services that earn (done: `js/outside.js`, `tools/outside.js`) |
| 0.22.0 | 1900 to 1906, 1900 becomes the start (done: `js/trust.js`, pre-war curves in `helpers.js`) |
| 0.23.0 | 1907 to 1913 (done: `js/prewar.js`) |
| 0.24.0 | The 1912 disaster, Convention, negligence ending (done: `js/disaster.js`) |
| 0.25.0 | Liveries and ship variety (done: `js/livery.js`) |
| 0.26.0 | The war economy (done: `js/war.js`) |
| 0.27.0 | War risk (done: the war at sea in `js/war.js`) |
| 0.28.0 | The bubble and handover (done: the 1919 and 1920 section of `js/war.js`) |
| 0.29.0 | The market and the broker, R2 (done: `js/market.js`, `tools/market.js`) |
| 0.30.0 | Stakes and control, R3 (done: in `js/market.js`, `tools/stakes.js`) |
| 0.31.0 | Floating the Line, R4 (done: `js/float.js`, `tools/float.js`) |
| 0.32.0 | Advanced moves, R5 (done: `js/moves.js`, `tools/moves.js`); the markets are complete |
| 0.33.0 | Final balance pass, part one: the economy, the war, the rival lines (done) |
| 0.34.0 | Final balance pass, part two: the markets, and a 40-seed check of every target (done; 0.34.1 fixed head office advising Spartan tables) |
| 0.35.0 | The fleet for larger fleets: a compact Fleet tab and the Fleet Manager window (done: `js/fleetmgr.js`) |
| 0.35.6 to 0.37.1 | Test-player fixes, performance, delegation, running by line, rescue and the late game: see `ROADMAP.md` in the repo root |
| 0.40.0 | 1900 to 1940 complete and balanced |
| 1.0.0 | The game complete to the present day |

## The 0.16.0 balance pass

1. Costs fall in the Depression: coal -25%, wages -10%, dues -15%,
   insurance -10% at the trough.
2. Government stock counts in net worth (maybe towards bank lending).
3. Laid-up ships: skill drifts down, training pauses, morale holds.
4. Sickness with no deaths costs no reputation; a good surgeon earns a
   small gain.
5. Forecasts count turnaround at both ends (turnDays in the econ round
   trip), so piers, gear, hatches and sheds show their saving.
6. Oil about 90% of coal per mile from the mid-1920s (oilPrice about 1.95).
7. Freight canvassers: half the effect, twice the cost.
8. Repair yard: 150,000 pounds to build, 800 a month.
9. Hostels: 35,000 pounds, larger steerage effect.
10. Lavish table: SERV_COST 1.9 to 1.6.
11. Refit Office flags equipment that only pays on big first-class ships.
12. Refit Office shows cruising gains alongside a cruise conversion.
