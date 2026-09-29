# Open balance issues

Issues left over from each release, kept for the final balance pass
before 1.0.0. Each entry gives the measure, the target and where it
stands. Figures come from `tools/harness.js` over 20 to 40 seeds, so a
difference of about 2 games in 20 is noise.

The final pass runs over 0.33.0 and 0.34.0. Each item is now one of:
**closed** (fixed and measured), **accepted** (the figure stands, for the
reason given), or **open** (for 0.34.0, or after 1.0.0 where marked).

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
| Protected war losses | Closed | 1 ship in 11 with every protection, counting war service (20 seeds) | About 1 in 12 |
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
| Harness careful behaviours shape the targets | Accepted | Documented in the README's tools table | Documented |
| Repainting at dock costs silently | Closed | It never was: the yard's news gives the repaint's cost | Show the cost |
| Boom trap for the player | Closed | Head office explains why it gives no advice to buy or build at boom prices | Explained |
| Reparations auction values | Closed | The Weltmeer at about £1.4m in 1919 is about 1.6 times a new ship's cost at boom prices, and about £0.66m after the crash: consistent | Consistent |

## The markets (for 0.34.0)

| Issue | Status | Measure now | Target |
| --- | --- | --- | --- |
| Broker beats stock by more than "a little" | Accepted | Balanced 2.4x stock over 1901 to 1940 (range 1.1 to 3.4), preserve 1.5x, growth 1.9x; most of it in the war, when shipping shares did boom while stock stood still | About 1.3x to 1.6x |
| Buy-and-hold | Closed | Every company bought in 1901 and held ends at 1.15x stock | A little over stock |
| Investment Office heads are fixed | Open | No candidates or replacement | Candidates each quarter |
| Small lines fail under control | Open | A line held 90% failed before 1930 in 3 of 4 test seeds | The Line can support a controlled line |
| Takeover prices uneven | Open | 0.75 to 1.9 times the fleet's worth, net of its cash (0.30.0, before the dividend fix) | About the fleet's worth in normal times |
| Seat and control effects unmeasured | Open | Checked as rules only | Fewer rate wars with a controlled leader |
| Float proceeds may be generous | Open | 49% raises about 0.75 of the Line's worth, 75% about twice it, all to the Line | Part to the owner |
| Board targets unmeasured for a careless owner | Open | No removals in 10 careful games | Some removals for a careless owner |
| Proxy fights may be easy | Open | A tenth and ordinary standing wins about three times in five | A gamble against a well-run line |
| Bear raids roughly break even | Open | Better than the short alone in 3 of 4 to 3 of 6 games | Pays when well timed |
| Long and short at once | Open | Allowed | Cannot dodge a buy-in |
| Rival moves among themselves | After 1.0.0 | Rivals raid and bid only for the Line | Rivals take each other over |

## Final check

| Issue | Status | Measure now | Target |
| --- | --- | --- | --- |
| 20-seed noise | Open | About 2 games in 20 | Every target run on 40 seeds for 1.0.0 |
