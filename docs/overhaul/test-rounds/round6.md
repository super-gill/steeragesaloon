# Test round 6: 1900 to 1939 on 0.39.4

Three new games from 1 January 1900 to 1 January 1939, after 0.39.3 (round 5's exploits) and 0.39.4 (the balance reset against `docs/overhaul/research/growth.md`). Full notes are in `round6/`.

## Verdict

The balance gate failed again. Every game ended far above the period's targets, and 0.39.4 brought one new bug (Excess Profits Duty set against income tax twice).

| Year | P9, careful | P10, bold | P11, exploits | Target |
|---|---|---|---|---|
| 1914 | £595k | £3.81m | £756k | careful £100k to £250k; bold £0.5m to £1m |
| 1920 | £2.30m | £12.97m | £5.09m | |
| 1939 | £7.76m | £23.92m | £8.71m | £0.5m to £3m |

None failed or needed rescue. The careful game made a loss in no year of the Depression.

## Why

The players agree on the cause: a ship's yearly profit is several times what it was in the period, in good years and bad.
- Old second-hand ships earn 70% to 120% of their worth a year before 1908, when the conference ceiling does not yet apply.
- New ships return 35% to 65% of their cost a year for a human who places them well.
- Ships bought in the 1921 glut pay for themselves within a year.
- The Depression's steerage falls only to 30% of 1929's, not a tenth (the 0.39.4 figure counted the trend twice).
- The war itself is about flat in real terms for a big Line; the 1919-20 boom is not, because the game names the top ("Ship prices are at their height") and syndicates bid five to seven times pre-war worth whatever the ship.

## New bugs and exploits

- Excess Profits Duty on ship-sale gains is deducted from trading profit for income tax, and the duty is then booked in the next year's accounts, so it is relieved twice (0.39.4 regression).
- Repaying a loan the bank has called does not cancel the call.
- British Lines could buy ships lying at Hamburg in the war; German lines could be sold short in the war.
- The 1907 rumour still always comes true (KI-019 exempted the scripted 1907 panic); the 1929 Crash and the 1931 slump follow a fixed calendar the share market can be shorted against.
- Borrowing to buy Consols in 1921 pays about 56% in 18 months: the yield follows a known table.
- Receivers' ships in the 1921 glut are offered at twice their worth.
- Head office advises orders the Line cannot pay for; scrapping under the Treasury's veto still allowed for any ship.
