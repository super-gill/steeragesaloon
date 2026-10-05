# What ships earn (0.39.6)

The tuning record for 0.39.6. It explains why the release raises ship prices rather than running costs, and what each variant tested did.

## The problem

KI-065: a skilled player grew the starting Line far faster than any real owner did. Bold human games to 1914 on 0.39.5's working copy ended at £1.6m to £4.4m. The target band is £0.5m to £1m (`growth.md`). Well-placed new emigrant ships returned 35% to 50% a year on their cost. The companies' own boom years were nearer 15% to 25%.

## Where a ship's money goes

The q3 bold save was played from January to June 1914, before the war. Each ship's own account was summed, before head office, interest and tax.

| | £k, six months |
|---|---|
| Takings: fares, cargo, mail, on board | 1,326 |
| Crew and victuals | 398 |
| Ports, agents and handling | 205 |
| Coal | 194 |
| Insurance | 65 |
| Upkeep | 43 |
| Net, all ships | 409 |

Running costs took 69% of takings. The ratio differs by ship:

| Ship | Running costs as a share of takings |
|---|---|
| Hesperia (1890) | 82% |
| Caledonian (1886) | 82% |
| Loch Shira (1912, 13,000 tons) | 59% |

The old, small ships run close to break-even. The new big ones carry about 2,200 steerage on the crew and coal of a ship half their size.

## Variants tried

The first column of results is an automated bold owner, `bold.sh` in the session scratchpad. Every quarter it presses each head-office advice button and buys any listed ship forecast at £2k a month or more, if her price is under 1.45 times her worth. Its net worth at 1 January 1914 is given for seeds 1, 2 and 3 in that order.

| Variant | Bold script, 1914 (seeds 1, 2, 3) | Careful script, bankrupt by 1922 (of 40) | Notes |
|---|---|---|---|
| 0.39.5 | £1.36m, £0.87m (seeds 1 and 2) | 3 | |
| Running costs +25% | £16k | | The 1900 Morven loses money, and the Line never buys a second ship |
| Running costs +15% | £0.33m, £0.30m, £0.46m | | |
| Running costs +10% | £0.37m, £0.25m, £0.06m | | One game never got past its first ship |
| +10%, and a second starting ship on the same trade | £0.66m, £0.68m | 5 of 12 by 1914 | The second ship halves the first one's loads |
| +10%, and no starting mortgage | £0.59m, £0.69m, £0.98m | 14 | |
| +5%, extra 7% agents' commission on steerage, no mortgage | | | Probe only: halves an old ship's profit, takes a sixth off a new one |
| +10%, ships +25%, no mortgage | £0.60m, £0.34m, £0.45m | 16 | |
| Ships +25%, no mortgage | £0.97m, £0.89m, £0.74m | 2 | |
| **+5%, ships +25%, no mortgage (released)** | **£0.36m, £0.59m, £0.84m** | **4** | Careful script's 1914 median £81k (0.39.5: £59k) |

What this shows:

- **Running costs are the wrong lever.** Any rise in running costs, or in a cost tied to takings, takes a large share of an old ship's thin margin and a small share of a new ship's wide one. It sinks the early game and the careful owner while barely slowing a bold one.
- **The price of ships is the right lever.** A bold player grows by adding ships, so the price of each one sets how fast the Line compounds. A ship already in the fleet is not touched.

## Human-style games to 1914 (seed 11)

These follow the same plan each time:

- Borrow to the limit in January 1901 for a second ship.
- Follow head office's advice every quarter, and buy any well-forecast ship.
- Join the conference in 1909.
- Order 13,000-ton emigrant ships in 1909 (one), 1911 (three) and 1913 (one).

| Variant | Net worth, 1 January 1914 | Returns on the new ships in 1913 |
|---|---|---|
| +10%, no mortgage | £689k | Ben Morven 34%, Loch Shira 35%, Strath Morven 30% |
| **Released** | **£558k** | **Ben Morven 24%, Strath Morven 18%, Pioneer 22%** |

These games are slower than the round 6 bold players. The q3 game was worth £660k by January 1910 and ordered more ships sooner. Test round 7 is the real yardstick.

## To 1939

The keen script (head office's advice and the conference, 10 games) on the released version reaches a median £444k in 1914, £3.18m at the 1920 peak and £3.81m in 1939 (0.39.4: £5.96m), with 1 game bankrupt. That is still above the £0.5m to £3m band for 1939, and most of the excess comes from the war and the 1920 boom (KI-077).

## What changed in the code

| Change | Where | Effect |
|---|---|---|
| `SHIP_K = 1.25` | `js/data.js` | Multiplies the yards' prices (`designStats`, `js/yard.js`) and the worth of the brokers' old ships (`refreshMarket`, `js/sim.js`). Ships the brokers generate are already priced from `designStats`. A ship's worth is still what she cost, so a new build is no loss on the books. |
| `RUN_K = 1.05` | `js/data.js` | Multiplies coal (`fuelPrice`), wages (`crewCostOf`), victuals (`PROV`), dues (`duesAt`) and upkeep (`MAINT_COST`). Head office's forecasts use the same functions. |
| No starting mortgage | `newGame`, `js/state.js` | The Line begins debt-free; the Morven's mortgage was £40,000 at 1921 prices, £16,000 in 1900. |

Rivals' running costs are unchanged: they come from `coCostIdx` in `js/companies.js`.
