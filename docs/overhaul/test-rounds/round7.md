# Test round 7: 1900 to 1939 on 0.39.6

Three new games from 1 January 1900 to 1 January 1939, after 0.39.5 (round 6's bugs and exploits) and 0.39.6 (ships a quarter dearer, running costs a twentieth dearer, no starting mortgage). Full notes are in `round7/`.

## Verdict

The balance gate failed a third time, but the failure has moved. Before 1914 the games are now close to the targets. After 1921 they are far above them.

| Year | P12, careful | P13, bold | P14, exploits | Target |
|---|---|---|---|---|
| 1914 | £476k | £1.34m | £1.12m | careful £100k to £250k; bold £0.5m to £1m |
| 1920 | £1.99m | £8.16m | £4.65m | |
| 1929 | £3.72m | £12.22m | £5.14m | |
| 1939 | £5.76m | £17.69m | £6.03m | £0.5m to £3m |

Round 6 for comparison: careful £595k and £7.76m, bold £3.81m and £23.92m. None of the round 7 games failed or needed rescue.

## 1900 to 1914: nearly right

- The start is slow, as intended: the bold game made £2k in 1900 and was under £100k until 1905. The careful game sat inside its band from 1907 to 1910.
- New 12,000 to 13,000-ton emigrant ships return 25% to 30% a year on cost in 1911 to 1913 (35% to 50% on 0.39.5).
- What pushed every game over at 1914 is a rival's failure just before the war. Imperial Atlantic failed on 1 February 1914 (careful), on 1 December 1913 with Nordmark (bold), or was "in trouble" with £1.6m of debt (exploits). Each failure scraps most of the fleet and nobody fills the trade: on the careful game an 1890 ship went from £2k to £11k a month.
- Old second-hand ships still return 40% to 75% of their worth.

## 1914 to 1921: generous

The war takes a bold Line from £1.71m (July 1914) to £5.28m (January 1919), and a Line that does nothing from £1.16m to £3.58m by January 1920. About 1.6 times in real terms once the 1920 crash is through. Most of it is ship values marked up with the war, steady hire for requisitioned ships, sunk ships paid for at cost, and the 1919-20 boom (a syndicate offered 6.6 times a ship's pre-war worth). The Excess Profits Duty takes some back (£2.0m on the bold game's 1919 and 1920).

## 1921 to 1939: far too profitable (the main problem)

- **The 1921 glut:** ships at half price, and receivers' at 70% of that, while fares stay at the post-war level. Ships bought in 1921-22 earn their price back in about a year: Strathmore (£180k) made about £24k a month; Valentia (£157k) about 150% a year; Palisades (£278k) £12k to £23k a month for 15 years.
- **Empty trades:** rivals do not replace the trade they lose after 1914 and 1921. Liverpool to Halifax had two rival ships after 1921.
- **The Depression is mild:** the bold game made £655k in 1932, the worst year of the real trough; the careful game £251k. Running costs fall in full at the trough while cabin classes hold up. Real lines earned 5% to 10% in the 1920s and lost money in 1931 to 1933.
- **Rivals' ships are cheap:** they are valued at about £17 a ton (1921 money) against about £56 a ton from the player's yard, so mergers and receivers' lists step round 0.39.6's prices.

## Exploits and bugs

| | Severity | Finding |
|---|---|---|
| KI-104 | S2 | Merging a struggling rival is a same-day gain: its ships count at full value at once (1906 Dominion Pacific: +£78k on the day) |
| KI-105 | S2 | A margin loan on shares that are merged away or wound up is never collected: unsecured credit outside the bank's limit |
| KI-106 | S2 | Borrowing into Consols at the 1921 top still pays +41% in 18 months |
| KI-107 | S2 | The 1929 Crash is a sure short: no rumour, and the market's mood falls from 1.27 to 0.65 in a month (+69% on the margin) |
| KI-108 | S2 | The share market follows a fixed table from 1934: buying a quarter of every line in January 1934 trebles the money by 1938 |
| KI-109 | S3 | The 1907 rumour still pays a short seller about 9% of the Line (KI-019 eased, not closed) |
| KI-110 | S3 | The Post Office cancels mail contracts at the armistice for sailings missed by ships still requisitioned (`atWar()` in the check) |
| KI-111 | S2 | A German line (Hanseatic Star) sails from Liverpool and Southampton to New York through the war, and adds a ship in 1915 |
| KI-112 | S3 | A merged fruit line's ships lose their refrigeration |
| KI-113 | S3 | The Line's fares drift below the conference's 95% floor between Januarys with no warning; rivals sat at 88% to 90% of the rate in 1930 to 1933 |
| KI-114 | S4 | 0.39.6 regression: the opening news still mentions "a £16,000 mortgage", and "Free of debt" is announced in February 1900 |
| KI-115 | S3 | Buying a ship "for" a line reports done when the line could not be opened; she lies idle |
| KI-116 | S4 | Advice to build a cruise ship for Liverpool to New York; the yard-jobs view lists radar and air conditioning in 1909; "0s 11d in the pound" |

Balance issues are logged as KI-117 (1921 to 1939), KI-118 (the Depression), KI-119 (rivals' ships cheap) and KI-120 (Imperial's failure in 1913-14); the war is KI-077.

Still fixed: merging and stripping a rival in the war loses money (KI-017); the reparations auction and cancelling yard orders are no way round dear ships; the 0.39.5 income tax fix holds.
