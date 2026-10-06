# Test round 8: 1900 to 1939 on 0.39.8

Three new games from 1 January 1900 to 1 January 1939, after 0.39.7 (round 7's exploits and bugs) and 0.39.8 (outside tonnage, the Depression's fares). For the first time the careful and bold players played straight through, without trying choices on copies of their saves. Full notes are in `round8/`.

## Verdict

The balance gate failed a fourth time. 0.39.8's diagnosis was wrong.

| Year | P15, careful | P16, bold | P17, exploits | Target |
|---|---|---|---|---|
| 1914 | £533k | £2.15m | £1.32m | careful £100k to £250k; bold £0.5m to £1m |
| 1920 | £2.58m | £9.63m | £9.88m | |
| 1929 | £3.90m | £10.70m | £8.52m | |
| 1939 | £7.26m | £13.96m | £11.25m | £0.5m to £3m |

Round 7 for comparison: careful £5.76m, bold £17.69m and exploits £6.03m by 1939. Playing straight through did not bring the results down: the careful game ended higher than round 7's.

## Why 0.39.8 did not work

0.39.8 assumed the excess came from trades left overfull: no competition, so the player's ships filled. Round 8 shows the trades were not full.

- **The careful game's trades ran 38% to 77% full** while each ship cleared £100k a year or more. The outside capacity on Liverpool to New York and Liverpool to Halifax stayed at 0 all game.
- **The bold game's trades ran 22% to 39% full in 1939.**
- **Outside ships came in only briefly:** after Nordmark failed in 1911, after Imperial in 1914, and on three trades in 1921-22.

The excess is in what a ship earns on each passenger against what she costs to run, at ordinary loads:

- **Older ships, on what they cost:**
  - Glenmorven (1915, £263k) made £180k in 1923.
  - Stella Maris (bought for £206k in the 1921 glut) made £170k in 1923 and £148k in 1938.
  - Ardmorven, built in 1911, still made £139.5k at 27 years old.
- **The fleet as a whole:** trading profit was 25% to 40% a year of its value in the 1920s.
- **A new ship at the prices of her day:** a 1924 liner (£409k) made 19% to 26% of her cost, and a 1937 tourist liner about 30%.
- **Before the war:** new ships made 22% to 35% of their cost, and old second-hand ones 28% to 41%.
- **The Depression:** trading was about nil in 1931 to 1933, about right, but returns were back to 20% to 30% from 1935.

Real lines earned 5% to 10% on their capital in the 1920s. The problem is the unit economics of a voyage at the loads the trades actually run at, in every era.

## Other balance findings

- **The Combine** offers 1.3 to 1.6 times net worth, cash and Consols included: £15.77m for a Line worth £9.98m in July 1931.
- **Consols and idle cash** carry most of the 1939 figures: the careful game held £5.51m of Consols, and the bold game £10.5m in cash and Consols.
- **A failed line's brand-new giant** sold from the receivers' list at 0.7 of her worth was worth £5.95m by 1920 (Dalriadan, bought for £1.09m in January 1914).

## Bugs and exploits

| | Severity | Finding |
|---|---|---|
| KI-122 | S2 | `takeship` never works: rival ship ids are strings ("r27") and both the screen and the headless action convert them with `+id`. The suite's stakes test passes the string |
| KI-123 | S1 (latent) | Once KI-122 is fixed: take a ship from a controlled line, then merge it the same day; the price paid comes back with the line's cash. Measured +£41k for one ship in 1906 |
| KI-124 | S2 | Outside ships are drawn in by Tourist Third demand before Tourist Third exists (1921: Liverpool to New York 1.02 full with it, 0.83 without) |
| KI-125 | S2 | Consols have one price for a holder and another for a buyer: the random wander runs only while stock is held. Sell, wait, buy back: +£1.03m in a year (1926) |
| KI-126 | S3 | Winding up a rival before 1921 empties its trades without counting as a failure, so no outside ships come in (+£87k in a year, 1913) |
| KI-127 | S3 | No advice ever offers to put a ship's steerage back after the war-cargo refit (`uncargo` is missing from advice.js) |
| KI-128 | S3 | Accepting a department's build proposal through the headless player opens the drawing office: the step plays no months and places no order |
| KI-129 | S3 | The Line's fares follow the price index; the line rate also carries the war's freight and the Depression's cut, so fares drift 5% to 7% off the rate between Januarys, and head office complains |
| KI-130 | S3 | Orders quoted "slip free this month" sat a year while rivals took the slips (Mersey 1905, Elbe 1911); about 70% sure |
| KI-131 | S3 | The Traffic Department's moves ignore mail contracts (lost the Southampton mail in 1925) |
| KI-132 | S4 | Smaller items: a rate war declared by a line wound up that day; department proposals open after the ships are sold; a rival ship sharing the Line's ship's name; tourist liner forecasts before Tourist class; a new ship with no line not listed as waiting; "over her worth" meaning pre-war worth; `press("shoresell")` refused; "Put idle cash to work" refused without a reason; two-month offers lapse inside a long step |

Still fixed: KI-104 to KI-106, KI-110, KI-111.
