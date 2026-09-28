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
- The overhaul builds to about 1940; later eras come after 1.0.
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

## Build order

| Release | Scope |
| --- | --- |
| 0.16.0 | Balance pass: the 12 stacked changes (below) |
| 0.17.0 | Half-speed clock and 14x; events slow instead of pause; per-ship insurance |
| 0.18.0 | Current affairs panel |
| 0.19.0 | Calendar moved to a 1900 base, date code in one place; saves break |
| 0.20.0 | Rivals as real companies (R1) |
| 0.21.0 | Shore services that earn |
| 0.22.0 | 1900 to 1906, 1900 becomes the start |
| 0.23.0 | 1907 to 1913 |
| 0.24.0 | The 1912 disaster, Convention, negligence ending |
| 0.25.0 | Liveries and ship variety |
| 0.26.0 to 0.28.0 | War economy, war risk, the bubble and handover |
| 0.29.0 to 0.32.0 | The markets (R2 to R5) |
| 1.0.0 | 1900 to 1940 complete and balanced |

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
