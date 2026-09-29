# Open balance issues

Issues left over from each release, kept for the final balance pass
before 1.0.0. Each entry gives the measure, the target and where it
stands. Figures come from `tools/harness.js` over 20 to 40 seeds, so a
difference of about 2 games in 20 is noise.

Update this file with every release: add what the release leaves open,
strike out what it closes.

## Money and growth

| Issue | Measure now | Target | Since |
| --- | --- | --- | --- |
| War growth too high, and the crash does not take it back | 1914 to 1919: 6.4x nominal, 2.9x at 1914 prices. 1914 to January 1921 (after the boom): about 12x nominal, 5x at 1914 prices. 1920 profits (freight 1.6x, the steerage rush) add more than the crash removes | About 2x real by 1921 | 0.26.0, measured again 0.28.0 |
| Advisor strategy far ahead of careful | About 9x careful net worth (small sample) | Within about 3x | 0.26.0 |
| Careful fleet a little large | Median 7 ships in 1914, 8 in 1920, 9 in 1921, 15 by 1922 (cheap ships after the crash) | 3 to 6 in 1914, 3 to 8 at the handover | 0.23.0 |
| Rival wealth after the war | Rival cash £2.6m in 1914, £3.2m in 1919, £7.5m in 1921 (new lines' capital included); debt £1.8m to £7.1m in 1921 | Rivals end the war with gains like the player's | 0.26.0 |
| Rival fleets halve in the war | 92 ships in 1914, 42 in 1919, 68 in 1921, 84 in 1924 | Losses and requisition, but more back by 1920 | 0.28.0 |
| Cruise lines churn | Four cruise lines founded in 1919 when the cruises reopen, most wound up by 1922 | One or two, from 1920 | 0.28.0 |
| Speculative lines | 2 to 3 floated per game, all "in trouble" or failed by 1923 | Most fail in 1921 and 1922 (fine, keep watching) | 0.28.0 |

Levers for the war growth: EPD rates, 1919 and 1920 freight, the
requisition hire, the careful owner's cash (it holds most of its gains as
cash, which the crash does not touch).

## Risk

| Issue | Measure now | Target | Since |
| --- | --- | --- | --- |
| Protected war losses high | About 1 ship in 9 (1 in 6 counting war service); 1 in 14 in a 20-seed run at 0.28.0 | About 1 in 12 | 0.27.0 |
| Unprotected war losses | About 1 in 4 | 1 in 4 to 1 in 5 (fine, keep watching) | 0.27.0 |
| Ship panel war risk alarming | Shown at the month's rate | Show per voyage or per year | 0.27.0 |

## Passengers

| Issue | Measure now | Target | Since |
| --- | --- | --- | --- |
| Autumn 1914 passenger fall too deep | 84% | 60 to 80% | 0.26.0 |

## Weak strategies

| Issue | Measure now | Target | Since |
| --- | --- | --- | --- |
| Idle and cautious owners go bust in the war | Most of them | Survive poorly, not fail | 0.26.0 |
| Idle owners hurt by the 1913 boats law | Boats cost pushes them under | A small cost | 0.24.0 |
| Idle owners foreclosed in mid-1920 | 9 in 10 by 1922, most in July 1920: an overdraft carried on the Morven's boom value is called when ship prices fall | Some do, not nearly all | 0.28.0 |

## Other

| Issue | Measure now | Target | Since |
| --- | --- | --- | --- |
| Legacy 1921 games unchecked | Last checked in 0.22.0; the claims cap now reaches them | Old targets hold | 0.24.0 |
| Harness careful behaviours shape the targets | Sells when overdrawn, takes war protections, does not buy at boom prices (0.28.0) | Document or split into two strategies | 0.27.0 |
| Repainting at dock costs silently | No line in the news | Show the cost | 0.25.0 |
| Boom trap for the player | A careful owner who buys at boom prices is ruined (net worth 0.13 of 1920 by 1921 in a test run) | Intended, but head office should say why it gives no buy advice | 0.28.0 |
| Reparations auction values | Weltmeer (52,000 tons) about £1.4m at boom prices | Check against the 1921 value of a giant | 0.28.0 |
| Broker beats stock by more than "a little" | Balanced 2.0x stock over 1901 to 1940 (range 1.4 to 2.7), about 1.7% a year; growth 2.2x | About 1.3x to 1.6x | 0.29.0 |
| Most of the broker's gain is in the war years | Balanced goes from 1.1x to 2.1x stock between 1913 and 1919: share prices follow the doubling of prices, stock does not | Shares roughly level with stock in the war | 0.29.0 |
| Dividends are notional | Rival lines keep all their earnings; dividends to the Line are not charged to them, and dilution stands in for the difference | Rival lines pay real dividends (R3, when stakes matter) | 0.29.0 |
| Buy-and-hold only matches stock | Every company bought in 1901 and held ends at 0.96x stock, because failed lines are written off and new ones are never bought | A little over stock | 0.29.0 |
| Investment Office heads are fixed | No candidates or replacement, unlike the other departments | Candidates each quarter, as the other departments | 0.29.0 |
| 20-seed noise | About 2 games in 20 | Use 40 seeds for the final pass | 0.16.0 |
