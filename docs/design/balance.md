# Balance

Lifecycle: **living**

**Now (17 November 2026, 0.39.8):** the targets in "Targets from 0.39.4" are the ones every test round is judged against; round 8 missed them (`docs/process/test-rounds/round8.md`). Open balance work is on issues, under "Balance 1900 to 1939" in `docs/process/roadmap.md`. Everything below the targets is the record of the passes from 0.33.0 to 0.35.5: read it as history.

**Status of the old tables, 17 November 2026.** Rows still marked Open below were settled later: forecasts and piled ships (KI-040, 0.36.2), the Fares Office and the conference floor (KI-041, 0.36.2), the 1907 bank failure (KI-061, 0.37.2; KI-029, 0.39.3), rival failures (KI-062, 0.39.0), shipping shares' recovery (KI-063, 0.39.0), careful owners in the Depression (KI-060, 0.38.0), and the advisor against the careful owner (superseded in 0.39.4, when the targets moved to human play). "Rival moves among themselves" is an `idea` issue (#49).

Figures come from `tools/harness.js` over 20 to 40 seeds, so a difference of about 2 games in 20 is noise. Each old row is **closed** (fixed and measured), **accepted** (the figure stands, for the reason given), or **open** (as it stood then).

## Targets from 0.39.4

Round 5 showed the scripted careful owner is a floor, not a typical player, and that humans did 6 to 10 times better than any real owner. From 0.39.4 the targets come from the period (`docs/design/research/growth.md`) and are checked against human play in each test round:

| Measure | Target | 0.39.4 (scripts) |
| --- | --- | --- |
| Careful human, net worth January 1914 | £100,000 to £250,000 | Careful script £70k (40 games): a floor |
| Bold human, January 1914 | £0.5m to £1m | `keen` £637k (12) to £819k (8) |
| Any owner, January 1939 | £0.5m to £3m; more only through takeovers, at Kylsant's risk | `keen` median £5.96m (8): open, KI-077 |
| Careful script bankrupt by 1922 | 3 to 6 of 40 | 5 |
| A new emigrant ship's return, good years | 12% to 18%, best routes a little more | 15% to 31% (1903 to 1913) |

## A bug found in the pass

Since 0.30.0 rival lines paid no dividends: an inline comment in
`coYearEnd` swallowed the statement that paid them. The rivals hoarded
cash, and careful owners went bust in the 1907 panic 5 times in 20
instead of 2. Fixed in 0.33.0; the same seeds now match 0.28.0 exactly up
to the war. The 0.30.0 to 0.32.0 market figures were measured with it.

## Money and growth

| Issue | Status | Measure now (0.33.0) | Target |
| --- | --- | --- | --- |
| War growth too high | Closed | 1914 to January 1921: 6.4x nominal, 2.6x at 1914 prices (was 5x); 1914 to 1919: 2.5x | About 2x real by 1921 |
| Advisor strategy far ahead of careful | Accepted | 7.7x careful net worth in 1914 (8 seeds). It comes from building new tonnage for the emigrant boom, which is what head office advises and what the great lines did | Within about 3x |
| Careful fleet a little large | Accepted | 7 ships in 1914, 8 at the handover: the harness's buying rule, not the game | 3 to 6, 3 to 8 |
| Rival wealth after the war | Closed | Rivals earn wartime freight on the ships they keep: cash £2.6m in 1914 to £7.8m in 1918, debt £1.8m to £0.1m | Gains like the player's |
| Rival fleets halve in the war | Closed | They no longer sell ships abroad in the war: 91 in 1914, 87 in 1918, 94 by 1924 | More back by 1920 |
| Cruise lines churn | Accepted | Small cruise trades cannot keep a line and promoters keep trying; holding them back would leave trades empty over two years, which the companies check forbids | One or two, from 1920 |
| Speculative lines | Accepted | 2 to 3 floated per game, nearly all failed by 1923 | Most fail in 1921 and 1922 |

## Risk

| Issue | Status | Measure now | Target |
| --- | --- | --- | --- |
| Protected war losses | Closed | 1 ship in 9 to 1 in 12 over two 40-seed runs, counting war service | About 1 in 12 |
| Unprotected war losses | Accepted | About 1 in 4 (`PROT=0`) | 1 in 4 to 1 in 5 |
| Ship panel war risk alarming | Closed | Now per crossing first (about 5 in 100 on Liverpool to New York at the worst of 1917), then for a year at this month's danger | Per voyage |

## Passengers

| Issue | Status | Measure now | Target |
| --- | --- | --- | --- |
| Autumn 1914 passenger fall too deep | Closed, not measured directly | Steerage holds at a quarter of the pre-war trade until April 1917, a tenth after, as US immigration did; first class at three tenths. Expected fall about 75% | 60 to 80% |

## Weak strategies

| Issue | Status | Measure now | Target |
| --- | --- | --- | --- |
| Idle and cautious owners go bust in the war | Accepted | By 1922 idle 17 in 20, cautious 9 in 20, nearly all in 1916 with a steerage ship and no cargo, after months of head office advising them to clear the steerage. Ignoring the Great War should be fatal | Survive poorly, not fail |
| Idle owners hurt by the 1913 boats law | Accepted | The boats law is announced nine months ahead and advised on | A small cost |
| Idle owners foreclosed in mid-1920 | Closed | The bank lends on ships at their normal worth in the boom; idle owners now fail in the war instead | Some do, not nearly all |

## Other

| Issue | Status | Measure now | Target |
| --- | --- | --- | --- |
| Legacy 1921 games | Closed | Only old saves start in 1921; they load and run to 1926. The 1921-start targets retired with that start | Old saves work |
| Harness careful behaviours shape the targets | Accepted | Documented in the tools table (now `docs/engineering/architecture.md`, "Tools") | Documented |
| Repainting at dock costs silently | Closed | It never was: the yard's news gives the repaint's cost | Show the cost |
| Boom trap for the player | Closed | Head office explains why it gives no advice to buy or build at boom prices | Explained |
| Reparations auction values | Closed | The Weltmeer at about £1.4m in 1919 is about 1.6 times a new ship's cost at boom prices, and about £0.66m after the crash: consistent | Consistent |

## The markets (for 0.34.0)

| Issue | Status | Measure now | Target |
| --- | --- | --- | --- |
| Broker beats stock by more than "a little" | Closed | 12 seeds, 1901 to 1940: balanced 1.68x stock (range 0.9 to 2.5), preserve 1.40x, growth 1.53x; buy-and-hold 1.07x | About 1.3x to 1.6x |
| Buy-and-hold | Closed | Every company bought in 1901 and held ends at 1.07x stock | A little over stock |
| Investment Office heads are fixed | Closed | Two candidates each quarter; appointing one costs three months of the old head's wages | Candidates each quarter |
| Small lines fail under control | Closed | The Line can lend a controlled line money at 5%; repaid when it is flush, lost if it fails | The Line can support a controlled line |
| Takeover prices uneven | Accepted | Buying to 90% in a month costs about 1.8 times the market value (each purchase pushes the price); a 35% tender about 1.35 times. With a tender a middling line costs about its fleet's worth net of its cash; a profitable one more, for its earnings | About the fleet's worth in normal times |
| Seat and control effects | Closed | Undercutting a rival's trade for four years: 16 rate wars in 6 games with no stake, 10 with a seat, 2 with control (both against Combine members, which cannot be controlled) | Fewer rate wars with a controlled leader |
| Float proceeds may be generous | Closed | Half to the Line, half to the owner, and since 0.35.5 priced on the new money only: 49% brings the Line about 0.27 of its worth, 75% about 0.48 | Part to the owner |
| Board targets for a careless owner | Closed | Floating 60% and never paying a dividend: 1 removed, 3 taken over, 2 bankrupt in 10 (a careful owner: 1 removed, 0 taken over in 20) | Some removals for a careless owner |
| Proxy fights may be easy | Closed | Against a well-run line with a tenth and ordinary standing, about 1 in 8; against a loss-making, troubled one about half | A gamble against a well-run line |
| Bear raids roughly break even | Accepted | Better than the short alone in 3 of 4 to 3 of 6 games: a gamble, which is the point | Pays when well timed |
| Long and short at once | Closed | Not allowed: sell first, or buy back the short first | Cannot dodge a buy-in |
| Share price pump | Closed (0.35.3) | A playtest reached £5.3 billion by 1925. Buying by amount had no limit and each purchase moved the price against the shares still on offer: 29 purchases of £20,000 lifted a price 51,000 times and selling it turned £6.5m into £2.8bn. Now measured against all tradable shares and capped at the shares on offer: buying a whole company lifts its price 1.8 times and selling it back loses money | No way to make money from the Line's own price impact |
| Wind-up paid a loan twice | Closed (0.35.3) | Lending £2.1m to a controlled line and winding it up returned £2.4m on top of the shares; the loan now comes out of its cash | A loan comes back once |
| Buying a stake looked free | Closed (0.35.2) | Buying 55% of a line at once (3 seeds): the cash went but net worth rose by about a quarter of it, the holding valued at the price the Line's own buying had pushed up by 1.57 times. Now net worth falls by about a quarter at once, and the holding's value three months on is about the same | A stake costs what the Line pays over the market |
| Government stock too good | Closed (0.35.1) | A flat 3½% with no price risk: £100 bought in 1901 came to £169 by 1921. Now Consols at the real yield: £105 by 1921, £184 from 1929 to 1935. Careful owners unchanged (6 of 40 bankrupt to 1922) | Stock that can lose money |
| Broker against the new stock | Accepted | With the stock now a real Consol the balanced account ends 1.8 times it (was 1.7 against the flat 3½%); preserve 1.4, growth 1.6. The benchmark moved, not the broker | About 1.3 to 1.6 |
| Shipping shares' 1930s recovery | Open (0.36) | On 12 seeds over 40 years shares are back to 0.90 of worth by 1937, on the edge of the market check's 0.9; the same with the 0.34 code, so not from the stock change | Back to about worth by 1937 |
| Rival moves among themselves | After 1.0.0 | Rivals raid and bid only for the Line | Rivals take each other over |

## The first test players (0.35.4)

Two programs played 1900 to 1912 through `tools/play.js` (notes kept in `tools/play/`, not in the repository): one carefully, one hunting exploits (it reached £10 million by 1912). `node tools/exploits.js` sets each loophole up and checks it stays closed.

| Issue | Status | Measure now | Target |
| --- | --- | --- | --- |
| Fares with no ceiling | Closed | Liverpool to New York at 100 times the rate earned £5.1m a month; now less than at the rate from ten times. Alone on a route the best fare is about 1.5 times the rate while the ships are full (x1 £9.8k, x1.5 £15.9k, x3 £7.0k a month on Glasgow to Halifax) | Dear fares lose money |
| Rival shares below their cash | Closed | Prices floor at 0.85 of break-up value; buying 76% of a cash-rich line and merging leaves the Line £29k to £215k down in cash (3 seeds). Net worth still rises by 15% to 55% of the spend, since merged ships count at their going-concern worth, not the breaker's seven tenths | No same-day cash from a merger |
| Close and reopen ends rate wars | Closed | The war goes on | |
| Free overdraft | Closed | 8% a year | |
| Shore property at 1921 prices | Closed | A shed bought lowers net worth by about half its cost | |
| Bank limits on bought ships, and in a panic | Closed | `buyTerms` | |
| Mail per hull | Closed | Two round trips a month at most | |
| Admiralty subsidy laid up, foreign yards | Closed | | |
| Flipping a receiver's bargain | Closed | No gain within the year | |
| Dear First hides cheap Third | Closed | Each class counts at most 1.1 times the rate | |
| Dividend capture | Closed | The price drops by the dividend | |
| New ships arrive laid up | Closed | They join the line they were ordered for | |
| Reputation in a big fleet | Closed | Everyday knocks scale with the square root of six over the fleet (a quarter as hard at 70 ships, never under three tenths) | A big, well-run line keeps its name |
| Wireless law only for the mails | Closed | 49 passengers at most out of an American port without wireless from July 1911 | |
| Strikes and the 1912 disaster stopped (0.35.4 only) | Closed (0.35.5) | A comment hid the calls; `tools/lint.js` now guards against it | |
| Slips booked for ever after a reload | Closed (0.35.5) | Relinked on loading | |
| Float priced a third over worth | Closed (0.35.5) | 49% raises 0.54 of the Line's worth, 75% 0.97 | Shares trade near the issue price |
| Leave and rejoin the conference to end wars | Closed (0.35.5) | Only wars against the Line end; a year before rejoining | |
| Raising cover on an overdue ship | Closed (0.35.5) | From her next port | |
| A floated Line's net worth counts the whole Line | Accepted | Net worth is the company's, as before; the owner's share and cash are on the ending page | |
| Second-hand ships cost 1.25 to 1.5 times their worth | Accepted | The brokers' asking price; she is worth less on the books the day she is bought | |
| Drydocking raises a ship's worth | Accepted | Worth follows condition; it is not a loop now a ship bought within the year sells for no more than she cost | |
| Consols dip in a panic and recover | Accepted | A trade with real risk in the game's terms (the panic's size is not known in advance) | |
| Consols count towards borrowing, cash does not | Accepted | Banks lent on securities | |
| Head office forecasts optimistic, ships piled on one line | Open (0.36) | The careful player saw about half the forecast on three moves; move advice sends every ship to the same line without counting the ones already sent | Forecasts within a fifth |
| Conference floor not enforced on fares the Fares Office sets | Open (0.36) | First and Third at 16 and 3 against a 95% floor of 16.15 and 3.8 | |
| The 1907 bank failure | Open (0.36) | Took 70% of the careful player's cash on one news line of warning; head office now warns, but the loss is large | Survivable for a careful owner |
| Rival failures | Open (0.36) | On the same 20 seeds, 6.3 a decade with the 0.34 code and 7.2 now (1920s 11.4 to 13.5 a game); the check's limit is 6, which the 0.34 code also misses on 20 seeds | A few a decade |

## The long run (for 0.36.0)

| Issue | Status | Measure now | Target |
| --- | --- | --- | --- |
| Rival failures in the 1920s and 1930s | Closed | 0.33.0 kept wartime fleets whole and failures rose to 6.9 a decade (1920s 12.9 a game). Rivals now pay Excess Profits Duty, break up worn-out ships after the armistice, found new lines with more capital and wait longer where lines keep failing: 5.6 a decade over 1900 to 1940 | A few a decade |
| A trade can lie empty | Accepted | Hamburg in the 1921 quota years, in one game in ten; the companies check allows one in ten | Refilled within two years |
| Careful owners in the Depression | Open | Played to 1939 (20 seeds): 8 bankrupt, 4 of them between 1930 and 1936, a quarter of those still trading in 1929. They buy up to 17 to 19 ships on heavy debt in the 1920s and sell them at the bottom. Laying ships up instead makes it worse (20 of 20 bankrupt): a laid-up ship still costs her interest | A sensible owner survives the Depression, smaller |
| Head office advised Spartan tables | Closed (0.34.1) | The advice judged a table by one line's takings at today's reputation, so it kept advising Spartan and the advisor strategy ended 1914 at reputation 15. Now judged at the reputation it leads to: 44, and net worth by 1914 about 2.8 times what it was (6 seeds) | Advice that does not sink the Line's name |
| Advisor far ahead of careful again | Open | With the table fixed the advisor strategy ends 1914 at about £1.3m (6 seeds), against £0.46m before; the gap to the careful owner, already accepted at about 11 times, widens | Revisit in 0.36 with the late game |
| The advisor strategy to 1939 | Closed | Played to 1939 (8 seeds): 1 bankrupt, in 1926; the rest end with £8.6m to £13.7m and a median fleet of 28. It runs 37 rate wars a game and ends with a reputation of 7, which the careful owner's rules would not allow | Survives the Depression |

## Final check

| Issue | Status | Measure now | Target |
| --- | --- | --- | --- |
| 20-seed noise | Closed | 0.34.0: careful, idle, cautious and unprotected on 40 seeds; advisor and floating on 20 | Every target on 40 seeds |

## Scripted targets, 0.34 to 0.37

Moved from the README's tools table on 17 November 2026. These were the harness targets before 0.39.4 set them on human play; several are superseded (the careful owner in the Depression, KI-060), and they are kept as the record of what each script showed.

Checked with the harness after any economic change. For the 1900 start (the overhaul's stage 1, finished in 0.23):

- A sensible owner (`careful`) has 3 to 6 ships in August 1914, and fewer than 1 in 5 such games go bankrupt before the war. At 0.34, over 40 seeds: 6 in 40 bankrupt before the war, median fleet 7 in 1914.
- Through the war (`END=1922 node tools/harness.js careful 40`, 0.34): net worth in January 1921 about 2.1 times January 1914 at 1914 prices (target about 2; 5 before 0.33). Losses: about 1 ship in 5 of those in the fleets over the war when trading unprotected (`PROT=0`), about 1 in 9 to 1 in 12 with every protection the careful owner can get, counting ships lost on war service (target 1 in 12). Steerage in the war holds at a quarter of the pre-war trade until 1917.
- Through the boom and the crash (0.34): 33 of the 33 lines solvent in 1914 still trading in 1922 (target at least 7 in 10). A ship held from 1913 is worth about 2.3 times her 1913 worth in 1913 money at the top and loses about three fifths by 1921 (target two to three times, half to two thirds lost). The bank lends on ships at their armistice worth in the boom.
- The long run (`END=1939`, 0.34): the advisor strategy (8 seeds) has 1 bankrupt; the careful owner (20 seeds) has 8, 4 of them in the Depression. The careful result is open for 0.36 (see `docs/design/balance.md`).
- The long run with the rescue (`END=1939 node tools/harness.js careful 20`, 0.37.0): 9 of 20 bankrupt; 8 rescued, 5 of them failed again (after 8 to 41 months, one after 142). Target for 0.40: careful owners mostly survive (KI-060).
- Rival lines (`node tools/companies.js`, 0.34): about 5.6 failures a decade over 1900 to 1940; a trade may lie empty for a while in at most 1 game in 10.
- The share market (`node tools/market.js 40 12`, 0.35.1): over 1901 to 1940 a broker's account against the same money in government stock ends about 1.4 times (preserve), 1.8 (balanced) and 1.6 (growth); buying every company in 1901 and holding ends at about 0.94 times stock. The stock itself now rises and falls with interest rates, so it is a harder benchmark before 1921 and an easier one after; before 0.35.1, with the stock at a flat 3½%, balanced was 1.7. Shipping shares fall below worth in 1921 (0.78) and 1931 and 1932 (0.60), and are back to about 1.07 of worth by 1925 but only 0.90 by 1937, on the edge of the check's 0.9. An untouched market changes nothing.
- Floating (`FLOAT=0.6 END=1925 node tools/harness.js careful 20`, 0.34): a careful owner who floats 60% in 1906 is removed in 1 game in 20 and taken over in none; a careless one (no dividend) in 10 games: 1 removed, 3 taken over, 2 bankrupt. Half of what a float raises goes to the Line, half to the owner.
- Owners who do not adapt to the war go under: by 1922 `idle` 35 in 40 and `cautious` 14 in 40 (0.34), nearly all in 1916 with a steerage ship and no cargo. Head office advises clearing the steerage for months beforehand. The advisor strategy (`advisor 20`) has none bankrupt by 1922 and ends 1914 about 11 times richer than the careful owner, from building new tonnage for the emigrant boom as head office advises; that gap is the reward for playing well.
- An owner who does nothing (`idle`): 6 in 30 bankrupt, nearly all in 1914 once the boats law cuts the Morven's steerage. `cautious`: 3 in 30.
- An owner who does nothing (`idle`) is hurt by the boats law: from July 1913 the Morven carries about a third of her steerage until she has boats for all. Head office and the news warn from October 1912.
- The first year makes a few thousand pounds with the one ship; margins are good enough through 1906 to add a ship every year or two.
- Rate wars are frequent before 1908 and rare after.
- The harness's blind strategies (`expander`, `prudent`, `office`) borrow to the hilt and mostly fail in the 1908 slump in emigration; that is intended.

For the 1921 game as it was (games begun in 1921):

- A player who changes nothing roughly breaks even in year one and survives the 1920s small; the Depression finishes them.
- Second-hand ships are cheap but old; a new ship pays for herself in roughly four to ten years in good times, so building is a long bet.
- Sensible expansion and following head-office advice beat passivity by a wide margin and survive the 1926 strike and the Depression. Blind expansion does not.
- Undercutting fares works for a while, then rivals match and it ends well behind sensible play.
- Piling everything onto one route is punished when history turns (the 1924 quota on Liverpool, the 1921 quota on Naples).
- No route is best all decade.

## Decision record

Dated decisions about this page, newest first: date, decision, who decided.

- 2026-10-04: **Targets from the period and human play** (Jason): round 5 showed the scripted careful owner is a floor, not a typical player, so from 0.39.4 the targets come from how real lines grew (`docs/design/research/growth.md`) and are checked against human play in each test round, not the scripts.
- 2026-10-02: **The scripted careful owner is not the target for the Depression** (Jason, KI-060, 0.38.0): settled against human play; a competent small Line comes through by selling losers, laying up, Tourist Third and buying at the bottom, while one that does nothing fails.
- 2026-09-29: **Accepted figures** (Jason, 0.33.0 and 0.34.0): each row marked Accepted in the tables above stands for the reason given there.

