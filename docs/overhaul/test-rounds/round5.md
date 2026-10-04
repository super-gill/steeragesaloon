# Test round 5: 1900 to 1940 on 0.39.2

The milestone round for 0.40.0. Three new games were played from 1 January 1900 to 1 January 1940 through the headless player (`tools/play.js`), each by a test player with a different brief. Their full notes, with the steps for every finding, are in `round5/`. Issue numbers refer to `KNOWN_ISSUES.md`.

## Verdict

0.40.0 was not released on this round. The game is far too easy from 1900 to 1940, and the round found one S1 exploit and four S2 ones. The exploits and bugs are fixed in 0.39.3; the balance is 0.39.4's work, followed by a second round.

## Net worth each January

| Year | P6, careful | P7, bold | P8, exploits | Scripted advisor (harness) | Scripted careful owner (harness) |
|---|---|---|---|---|---|
| 1901 | £30.6k | £32.3k | £32.9k | £28k | £33k |
| 1905 | £54.5k | £98.0k | £117.6k | | |
| 1910 | £456k | £700k | £276k | £324k | £68k |
| 1914 | £1.41m | £3.53m | £988k | £948k | £91k |
| 1920 | £5.17m | £12.56m | £7.82m | | £908k |
| 1930 | £10.68m | £17.30m | (£7.07m in July) | | |
| 1940 | £14.80m | £25.72m | £8.89m | | |

None of the three Lines failed or needed rescue. The careful player made a loss in two years of the forty (1921, after £518k of Excess Profits Duty fell due; and 1937, a bank failure).

## What it means for the balance targets

The balance targets to 1940 (`docs/overhaul/BALANCE.md`) were set on the scripted careful owner in `tools/harness.js`. A careful human did fifteen times better by 1914. The scripted owner buys only from the brokers' list, never builds, never joins the conference and never moves fares, so it is a floor, not a typical player. 0.39.4 sets the targets against human play.

## Findings by area (fixed in 0.39.3 unless marked)

- **Exploits:** merge and strip in 1918 on borrowed money (KI-017, S1); a float doubling the net worth shown (KI-018); shorting on City rumours, which always came true (KI-019); buying and merging a German line in the war (KI-020); scrapping a requisitioned ship (KI-021).
- **Bugs:** forecasts that saw the war and the slumps coming (KI-027); emigration figures a year out (KI-028); a near-certain bank failure in 1937 (KI-029); rate wars in wartime and by absent lines (KI-030); a called loan making the debt negative (KI-031); a broken-down ship sold at full price (KI-032); the Blue Riband on a tie (KI-033).
- **Advice:** war-loss odds four times too high before February 1915 (KI-049); war-risk cover advised without its premium (KI-050); the table flipping twice a year (KI-051); departments advised at any fleet size (KI-052, open); contradictory conference advice (KI-053, open).
- **Balance, open for 0.39.4:** no ceiling on conference fares (KI-071); new emigrant ships returning 60% to 80% a year (KI-072); emigration back to 1913's level a year after the Armistice (KI-073); a riskless 1919-20 boom (KI-074); a failed rival's express liner sold for a fifth of her building cost (KI-075); a mild Depression (KI-076); an almost riskless Great War (KI-077); no income tax before 1925 (KI-078).
- **Old exploits that stayed fixed:** geared Consols in the 1930s; failing on purpose for a write-off; rejoining the conference during a combine; selling a merged ship at once; bear raids in the war; raising insurance on a ship in trouble; Excess Profits Duty; the size of a bank failure's loss.
