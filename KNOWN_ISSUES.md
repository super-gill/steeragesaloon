# Known Issues

Steerage & Saloon 0.39.6. This log records every known defect, loophole and open question that has not been fixed in a released version. Balance targets and accepted behaviour are in `docs/overhaul/BALANCE.md`; this file covers what is wrong or unfinished.

**Severity**

| Level | Meaning |
|---|---|
| S1 | Breaks the game: a large exploit, a crash, or a system that is unusable |
| S2 | Wrong result: numbers, events or rules that do not work as designed |
| S3 | Minor: small loopholes, odd behaviour, missing warnings |
| S4 | Text and presentation only |

**Status:** Open (not yet scheduled), Planned (assigned to a version), Discuss (needs a design decision first), Fixed (the version that fixed it; kept here for one release, then moved to the changelog only).

**Sources:** P2, P3 and P4 are the test-player rounds (P2 played 1900 to 1914 on 0.35.4; P3 played 1914 to 1927 on 0.35.5; P4 played 1927 to 1945 on 0.37.1; P5 played a small Line 1927 to 1940 on 0.37.2 and again on 0.38.0; round 5, on 0.39.2, played three new games from 1900 to 1940: P6 a careful owner, P7 a bold one, P8 an exploit hunter, summarised in `docs/overhaul/test-rounds/round5.md`). Notes with full repro steps are in `tools/play/` (gitignored). U is the owner's own report.

---

## Performance

| ID | Sev | Status | Issue |
|---|---|---|---|
| KI-001 | S3 | Partly fixed (0.36.1) | **Large fleets make the game near unplayable** (U, at 70 ships). The monthly freeze, most per-frame costs and the emergencies' hold on the clock are gone (0.36.0, 0.36.1); not yet measured on a desktop. See below. |

**KI-001 detail.** Measured with `tools/perf.mjs` in headless Chromium without a graphics card (processor painting, so a floor), 70 ships at top speed:

| | 0.35.7 | 0.36.0 |
|---|---|---|
| Frames a second, main tabs | 43 to 55 | 49 to 57 |
| Slowest frame | about 750 ms, once a game month | 33 to 133 ms |
| Game days a second at 14× | 3.7 to 4.2 | 4.2 |

- **Fixed in 0.36.0:** head office's advice froze the screen for most of a second each game month (now worked out a few milliseconds a frame, and about half the work); chart markers forced a page layout every frame; the funnel smoke repainted the ship panel every frame; an action worked out the advice twice.
- **Still open:**
  - (Fixed in 0.36.1) Emergencies scale with the fleet; under Auto only grave ones stop the clock from fifteen ships.
  - Each game day still redraws the visible panels (20 to 50 ms at 70 ships on processor painting). Building only the visible rows of the Fleet list is left until a fleet of a hundred or more shows it is needed.
  - Not yet measured on a desktop with a graphics card; the readout (Menu, Settings, Frame times) shows it on any machine.
- **Design question:** steering the player away from very large fleets was decided against; see KI-090.

## Exploits

| ID | Sev | Status | Source | Issue |
|---|---|---|---|---|
| KI-016 | S3 | Fixed (0.37.2) | P3, P4 | Consols followed a fixed yield table, so a holding's path was known in advance; P4 geared £235m of debt on it. Prices now wander a few tenths of a per cent of yield either side, and borrowing on stock is limited to twice the Line's worth. |
| KI-017 | S1 | Fixed (0.39.3) | P8 | **Merge and strip in 1918.** A merger counted the merged fleet at its full wartime worth and the bank lent 0.7 of it the same day, so each merger raised the Line's borrowing by more than it cost: thirteen mergers on 1 January 1918 borrowed £7.8m, and selling the ships in the 1919 boom cleared £3.8m after duty. The bank now lends on every ship at what was paid for her, moved with the market, in her first year, merged ships included (`bankFleetValue`). |
| KI-018 | S2 | Fixed (0.39.3) | P8 | A float raised the net worth shown by the whole issue though the owner kept a quarter of the Line. The owner's own wealth (their share of the Line plus what they took out at the float) is now shown beside the Line's net worth (`ownerWorth`). |
| KI-019 | S2 | Fixed (0.39.3) | P8 | Every City rumour came true and share prices ignored it, so selling short on a rumour was a sure profit (+40% in two months). A third of rumours now blow over, shares fall while a rumour lasts, and on the 1900 calendar no invented panic comes between 1914 and 1946. |
| KI-020 | S2 | Fixed (0.39.3) | P8 | A German line could be bought and merged in 1916, its ships taken into the Line and away from the reparations. The Trading with the Enemy Act now blocks buying, raiding, tendering for, merging or taking ships from an enemy line from August 1914 to the peace (`mkEnemy`). |
| KI-021 | S3 | Fixed (0.39.5) | P8, P11 | Scrapping had no check for a requisitioned ship or the Treasury director's veto. The 0.39.3 change was lost before release (round 6 found it still allowed); fixed in 0.39.5. |
| KI-104 | S2 | Open: round 7 | P14 | **Merging a struggling rival is a same-day gain.** Its ships count at full value from the first day and sell at 0.9 of it after a year. 1 Jan 1906: borrow 29,000, `shares dominion 230000 1`, borrow 30,000, `merge dominion`: net worth £188,499 to £266,269 that day; a year later £321,570 against £244,190 untouched. |
| KI-105 | S2 | Open: round 7 | P14 | **A margin loan outlives its shares.** After merging or winding up a company bought on margin, the broker's loan (£108,265 in the KI-104 case) has nothing behind it; every two months "Margin call", then "The broker has sold £0", and nothing else: unsecured credit at 5.5% outside the bank's limit (`mkLoanMonth`). |
| KI-106 | S2 | Open: round 7 | P14 | **Consols at the 1921 top still pay.** 1 Jan 1921: buy Consols, borrow against them and buy more until nothing can be borrowed (about £6.4m of stock, twice net worth): +41% by July 1922 (£4.45m against £3.15m). The 0.39.5 cap on stock-backed lending reduced this but did not stop it. |
| KI-107 | S2 | Open: round 7 | P14 | **The 1929 Crash is a sure short.** No rumour comes first; the market mood is 1.27 on 1 Sep 1929 and 0.65 on 1 Oct. Shorting 5% of all 22 listed companies for one month: +£360,696 (+69% on the margin). |
| KI-108 | S2 | Open: round 7 | P14 | **The 1930s share market follows a fixed table** (mood 0.60 in 1934 to 1.00 in 1938): buying 25% of every shipping line on 1 Jan 1934 (£761k) gave £2.68m of holdings by January 1938. |
| KI-109 | S3 | Open: round 7 | P14 | The 1907 rumour still pays a short seller: 5% of 14 companies 1 Sep to 1 Oct 1907, +£35,473 (+8.8% of the Line). KI-019 eased, not closed. |

## Bugs

| ID | Sev | Status | Source | Issue |
|---|---|---|---|---|
| KI-023 | S2 | Fixed (0.37.1) | P3 | War freight fell far short of its own text. Rates now follow the free market to 1916, the Ministry's control from 1917 and the 1919-20 boom; checked by `tools/warprofit.js`. |
| KI-024 | S2 | Fixed (0.37.1) | P3 | The player could not choose which ships went to war service without the reserve list. Ships can now be offered at any time in the war. The hire was left as it is: it matches the Blue Book rates against the open market. |
| KI-026 | S2 | Fixed (0.37.1) | P3 | Excess Profits Duty never charged: its standard rose with prices, and sale gains were not profit. Both fixed. |
| KI-027 | S2 | Fixed (0.39.3) | P8, P7 | **Head office's forecasts saw history coming.** They ran the economy three, six and nine months ahead, so on 1 July 1914 they advised laying up a ship that cleared £26k that month because they could see the war, and the same leaked the 1921 and 1929 slumps. Forecasts still run through the seasons, but history's scripted turns are held at today's (`FC_NOW`, `fcHist` in `js/sim.js`), except laws already passed (the 1924 quota, KI-043). |
| KI-028 | S2 | Fixed (0.39.3) | P6 | Emigration figures were read as calendar years though the American ones are fiscal years to June and the Canadian ones mostly to March, so on the Canadian routes the 1908 slump was the best year of the decade. Each figure is now centred where its year fell (`preSeries`). |
| KI-029 | S2 | Fixed (0.39.3) | P6 | A bank failure in 1937 was all but certain: the panic clock still counted from the end of the 1907 panic. No British clearing bank failed between the wars; see KI-019. |
| KI-030 | S3 | Fixed (0.39.3) | P6, P8 | Rate wars broke out in the Great War (the month war was declared) and could be led by a line with no ships on the route. |
| KI-031 | S3 | Fixed (0.39.3) | P6 | A loan called in a panic was taken in full from a Line that had repaid early, leaving the debt below zero. |
| KI-032 | S3 | Fixed (0.39.3) | P7 | A ship sold in the 1920 boom that broke down beyond repair before handover still fetched her full price. The buyers now take off the repair. |
| KI-033 | S4 | Fixed (0.39.3) | P7 | A tie for the Blue Riband passed it from the holder to the rival, with the text for a holder gone out of service. |
| KI-034 | S2 | Fixed (0.39.3) | Suite (40 seeds) | When the Combine bought a line, the paying member took the whole price as debt with nothing on its books: its worth went below nothing and its shares sold at two fifths of break-up value. It now carries only the premium; and the Combine no longer buys into a line the Morven Line holds more than two fifths of. |
| KI-110 | S3 | Open: round 7 | P13, P14 | The Post Office cancels mail contracts on 1 Jan 1919 for sailings missed by ships the Admiralty still held: the 0.39.5 excuse checks `atWar()` (sim.js) rather than whether the ships are requisitioned. Reputation 67 to 52 on one game. |
| KI-111 | S2 | Open: round 7 | P13 | A German line, Hanseatic Star, kept sailing Liverpool and Southampton to New York from 1914 to 1919 and added a new ship (Lübeck) in January 1915. |
| KI-112 | S3 | Open: round 7 | P14 | After `merge antilles` the fruit line's ships have no refrigeration, so every one is forecast to lose money on any line. |
| KI-113 | S3 | Open: round 7 | P12 | The Line's fares follow the line rate only each January: in the war and the 1920s they drifted to 86% to 90% of the rate, below the conference's 95% floor, with no warning. Rivals sat at 88% to 90% of the rate in 1930 to 1933. |
| KI-114 | S4 | Open: round 7 | P12 to P14 | 0.39.6 regression: the opening news still says the Line starts with "a £16,000 mortgage", and "Milestone: Free of debt" is announced on 1 Feb 1900. |
| KI-115 | S3 | Open: round 7 | P13 | Buying a ship with a line named reports "done" when the line could not be opened; she lies idle without a line. |
| KI-116 | S4 | Open: round 7 | P12, P13 | Head office advises "Build a cruise ship for Liverpool → New York"; the yard-jobs view lists radar and air conditioning in 1909 (booking them is refused); tax still printed "0s 11d in the pound". |

## Advice and departments

| ID | Sev | Status | Source | Issue |
|---|---|---|---|---|
| KI-040 | S2 | Fixed (0.36.2) | P1, P2 | Forecasts are optimistic for mixed ships (about half the forecast on three moves). Move advice piles ships onto one line without counting the ones already sent. |
| KI-041 | S2 | Fixed (0.36.2) | P2 | The Fares Office sets fares below the conference floor. |
| KI-043 | S3 | Fixed (0.39.3) | P3 | The forecast horizon ignored the certain July 1924 quota cut. Forecasts from January 1924 now see it. |
| KI-045 | S3 | Fixed (0.37.2) | P2, P4 | Advice flipped tables and advertising with no memory, and moved ships back and forth. A table or advertising changed in the last six months is left to settle, and a ship moved in the last year needs twice the margin to move again. |
| KI-046 | S3 | Open | P2 | Captain advice to replace a "popular" captain recurs every quarter on the adjective alone. |
| KI-047 | S2 | Fixed (0.39.1) | P3, P4, P5 | New tourist and emigrant ships returned 30% to 42% a year on their cost in the late 1920s. Set against the sources (`docs/overhaul/research/earnings.md`): now about 18%, within the good-year band. |
| KI-048 | S4 | Fixed (0.36.2) | U | **The game never shows what line a ship was built for.** `designLine` is saved at delivery but used nowhere. The design does matter (bunkers for the longest leg, draught for the ports, seakeeping for the route), so a ship moved to another line can be short-legged or too deep without the player knowing why. Fix: show "Built for ..." in the ship detail and fleet manager, and flag a mismatch with its reason. |
| KI-049 | S3 | Fixed (0.39.3) | P6, P7 | Head office quoted the chance of a ship being sunk at about four times the real figure until February 1915: it left out that three attacks in four never came before the submarines. |
| KI-050 | S3 | Fixed (0.39.3) | P6 | Head office advised the private war-risk top-up without weighing its premium (£1,040 a month to cover an expected £296), and the Marine Superintendent bought it on that advice. It is now advised only when the loss it covers is at least seven tenths of the premium. |
| KI-051 | S3 | Fixed (0.39.3) | P6, P8 | The table on a line still swung between Standard and Lavish twice a year. Going back to the table before the last change now needs a clear case. |
| KI-052 | S4 | Open | P7 | "Departments pay their way" is advised at any fleet size; at 19 ships a department saved about £137 a month of office friction and cost £276 to £454. |
| KI-053 | S3 | Partly fixed (0.39.4) | P7 | Conference advice contradicts itself: "Calm the conference" sets fares the next report advises cutting; "Move a ship there" appears beside "Calm the conference" on the same line; "The conference is an option" shows while joining is refused. **0.39.4:** "The conference is an option" shows only when joining is possible; the other contradictions remain. |

## Economy and balance

| ID | Sev | Status | Source | Issue |
|---|---|---|---|---|
| KI-060 | S2 | Fixed (0.38.0) | Harness, P4, P5 | **The Depression.** Settled against human play: a competent small Line now comes through it (on 0.38.0 it had no losing year), by selling losers, laying up, Tourist Third and buying at the bottom, while one that does nothing fails. The scripted careful owner, which does none of those, goes bankrupt in 24 of 40 games to 1939; it is no longer the target for this era. |
| KI-061 | S2 | Fixed (0.37.2) | P2, P4 | A bank failure took three quarters of the Line's cash on the day (£31.8m from one player in 1938). The deposit is now frozen and fifteen shillings in the pound comes back over eighteen months; a quarter is lost. A rumour about the bank stays under Needs attention until it passes. |
| KI-062 | S3 | Fixed (0.39.0) | Harness | Rival failures ran at 7 to 8 a decade, 12 to 14 a game in each of the 1920s and 1930s, nearly all one-ship lines promoted in play and refloated after each failure. Now about 2 a decade with a quiet Morven Line. |
| KI-063 | S3 | Fixed (0.39.0) | Harness | Shipping shares sat at about two thirds of the lines' worth for years, from lopsided smoothing. Now back at worth by 1925 and 1937. |
| KI-064 | S3 | Open | P3 | Idle cash earns nothing. A real line would hold deposits at bank rate less a margin. |
| KI-066 | S3 | Fixed (0.38.0) | P4 | Loans were a fixed 6.5% from 1900 on. They now follow Bank Rate. |
| KI-067 | S3 | Fixed (0.38.0) | P4 | The investment account bought small companies whole and paid its own price impact both ways. It now holds no more than a twenty-fifth of any company. |
| KI-068 | S3 | Fixed (0.38.0) | P4 | A failed giant's main trade lay open for two years. A second promoter now takes it up within months. |
| KI-069 | S3 | Fixed (0.39.0) | P5 | A ship bought below her worth added the discount to net worth on the day. She now counts at her cost for her first year. |
| KI-070 | S4 | Fixed (0.39.0) | P5 | Fare advice judged a fare on one month and flipped with the season. It now judges over this month and six on, and waits three months after a change. |
| KI-065 | S2 | Eased: 0.39.6 (1900 to 1914); later years under KI-117 | Harness, P6 to P11, round 6 | **The game is far too generous to a skilled player.** Round 6 (0.39.4): careful human £595k by 1914 and £7.8m by 1939; bold £3.8m and £23.9m; three bold games to 1914 on 0.39.5's working copy £1.6m to £4.4m (target £0.5m to £1m). Well-placed new ships return 35% to 50% a year on their cost. Making rivals compete harder ruined the scripted careful owner without stopping skilled players (0.39.5, dropped); 0.39.6 brings every ship's running costs up to the period's, with an easier start. **0.39.6:** ships cost a quarter more and run a twentieth dearer, and the Line starts without a mortgage. A human-style bold game ends 1914 at £558k, with new emigrant ships returning 18% to 24%; the bold script £0.36m to £0.84m. Running costs alone could not do it (`docs/overhaul/research/what-ships-earn.md`). Test round 7 decides whether it is closed. |
| KI-071 | S2 | Fixed (0.39.4) | P7 | In the conference there is a fare floor but no ceiling: first class 50% over the line rate still sold well, and Liverpool to Halifax cleared £62k to £78k a month in 1912 and 1913. **0.39.4:** a member's fares are held between 95% and 115% of the rate (`confCeil`). |
| KI-072 | S2 | Fixed (0.39.4), to be confirmed by round 6 | P7 | New emigrant ships return 60% to 80% a year on their cost for a human player in 1912 and 1913 (sources: 12% to 18% in good years). **0.39.4:** with the ceiling, the highest fares a member may charge earn less than the rate; a new 11,000-ton emigrant ship returns 15% to 31% a year in 1903 to 1913. |
| KI-073 | S2 | Fixed (0.39.4) | P6 | Emigrant demand returns to the 1913 level within a year of the Armistice (85% in September 1919; 130% on New York in 1920). Arrivals were about 15% of 1913 in 1919 and 35% in 1920. **0.39.4:** steerage after the armistice follows the arrivals (`warPax`); New York eased through the quota years and Canada held to 22% to 50% of 1913 in the 1920s (`canadaPost`). |
| KI-074 | S2 | Fixed (0.39.4) | P6, P7 | The 1919-20 boom is riskless: ships sell for 5.5 to 8.3 times their pre-war worth whatever their state (one at 19% condition for £700k), and second-hand prices stay at normal through 1921 and 1922. **0.39.4:** the 1920 peak lowered to about five times 1913's money; second-hand ships at half their normal worth in 1921-22, recovering by 1925 (`postWarShip`), with the banks lending on normal worth. |
| KI-075 | S2 | Fixed (0.39.4) | P7 | A failed rival's ships are valued in 1921 pounds times the price level, which before the war is far below what the drawing office charges: a nearly new 24,500-ton express liner sold for £147,600 against £754,000 to build, and earned more than her price each year. **0.39.4:** receivers price a failed line's ship at four fifths of what a matching design costs today, aged and conditioned (`coShipDesign`). |
| KI-076 | S3 | Fixed (0.39.4) | P6 | The Depression halves trade rather than gutting it (Canadian immigration fell about 90%); a careful Line never made a loss. **0.39.4:** North Atlantic and Canadian steerage at the trough now about 10% of 1929's (was 25%). |
| KI-077 | S3 | Open: round 6 | P6 | The Great War is almost riskless for a Line. **0.39.4 measure:** the `keen` script's net worth goes from £0.82m (1914) to £3.07m (1919) and £5.25m at the 1920 peak, about 1.7 times in real terms; the target set in 0.33 was about twice. It carries the bold stand-in to a median £5.96m by 1939 against the research's £0.5m to £3m. Liner companies under requisition did not double; tramp owners did better until the 80% duty. Round 6 decides whether the war's returns come down. **Round 7 (0.39.6):** bold £1.71m (July 1914) to £5.28m (January 1919); a Line that did nothing £1.16m to £3.58m by January 1920; a syndicate offered 6.6 times a ship's pre-war worth in 1920. About 1.6 times in real terms after the crash. |
| KI-078 | S3 | Fixed (0.39.4) | P6 | No income tax on profits before 1925; British income tax was charged on company profits throughout (1s in the pound in 1900, 1s 2d in 1913). **0.39.4:** income tax charged from 1900 at the standard rate of each year, after the Excess Profits Duty in the war, and the Corporation Profits Tax of 5% in 1920-23. |
| KI-117 | S1 | Open: round 7 | P12 to P14 | **1921 to 1939 is far too profitable.** Ships bought in the 1921-22 glut at half price (receivers' at 70% of that) earn their price back in about a year while fares stay at the post-war level (Strathmore, £180k, about £24k a month; Valentia, £157k, about 150% a year). Rivals do not replace the trade lost after 1914 and 1921 (Liverpool to Halifax: two rival ships after 1921). Bold game profit £0.95m to £1.34m every year 1922-28, about 50% on the fleet's worth; real lines earned 5% to 10%. Round 7 1939: careful £5.76m, bold £17.7m, exploits £6.03m (target £0.5m to £3m). |
| KI-118 | S2 | Open: round 7 | P12, P13 | **The Depression is mild.** Steerage falls to 15% of 1929 as designed, but running costs fall in full while cabin classes hold up, and rivals keep failing: the bold game made £655k in 1932, the careful £251k. Real lines lost money in 1931 to 1933. |
| KI-119 | S2 | Open: round 7 | P14 | **Rivals' ships are booked at about £17 a ton** (1921 money) against about £56 a ton from the player's yard with 0.39.6's quarter added, so mergers and receivers' lists step round dear ships (Stella Maris, 1918, 14,200 tons: £205,300 against £876,000 new). |
| KI-120 | S2 | Open: round 7 | P12 to P14 | **Imperial Atlantic fails just before the war** (1 Dec 1913 with Nordmark, or 1 Feb 1914), scrapping most of its fleet; nobody fills its trades, and the player's old ships earn four or five times as much (an 1890 ship £2k to £11k a month). It is most of the careful game's overshoot at 1914. |

## Text and presentation

| ID | Sev | Status | Source | Issue |
|---|---|---|---|---|
| KI-083 | S4 | Fixed (0.37.1) | Harness | Stale war-outbreak text: it promised every hold would fill and freight would reach three times its pre-war worth. |
| KI-084 | S4 | Open | P6 | Fares show as decimal pounds (29.9) rather than pounds and shillings. |
| KI-085 | S4 | Fixed (0.39.3) | P6 | "The bank call in"; a Lord Provost's wife launching ships at Birkenhead and Princess Mary launching them as a child; "Ships are cheap in a slump" in the 1914 boom; a sunk ship "out of service". |
| KI-086 | S4 | Open | P9, P10 | Text: "0s 11d" for 11d; "fire repairs" after flooding; "(to be sell)"; an inquiry that "finds no fault" yet fines; the 1919 duty notice shows a sale gain larger than the year's earnings; scripted news names a failed line; a rival line named after one of the player's ships; the play tool shows rivals' fares without a rate war's cut. |

## Design questions

| ID | Status | Question |
|---|---|---|
| KI-090 | Done (0.36.5) | **Large fleets are supported, not discouraged.** Done: performance, delegation, running by line. Costs that scale with tonnage, lines, ports and fleet size: 0.36.5. Decided: make them playable (KI-001), hand routine work to masters and departments (standing orders, an inbox that shows only the owner's decisions and summarises the rest), let the player run a fleet by line, and make shore support scale with the fleet properly. Office cost today is `600 + 250n + 18n^1.6` a month (n = ships): it counts hulls only (a tramp costs the same as a 45,000-ton liner) and ignores the number of lines and ports. |
| KI-091 | Done (0.37.0) | **Rescue instead of game over.** Done: banks, a rival or the Treasury, once; see the README. Not done: a forced merger, and rival lines rescued by the same rules (they keep their own reconstruction). An insolvent Line gets a likely, not certain, rescue: a bank consortium or rival line before the 1920s, the Treasury after, with lasting costs (dilution, a government director, no dividends until repaid, possibly a forced merger; a second failure is final). With a safety net the game can hit harder (KI-060, KI-061 to be rebalanced together). Rival failures can use the same machinery. |
| KI-092 | Discuss | **Desktop app (Electron).** Pinned; not needed for 0.40. It runs the same engine, so it does not fix KI-001. It would give file saves and backups without the browser's storage limits, no throttling when the window is in the background, a database (SQLite) for long histories, and a Steam-style installer. |
| KI-093 | Fixed (0.36.2) | **Advice moves ships off the line they were built for, and the player loses track.** Count the design line in move advice, show built-for and mismatches in the fleet manager and line view, and warn when ordering a ship for a line already near its trade's capacity. Replaces KI-048. |

## Feature requests

New features must fit the theme and be at least roughly historical. After 1939 the game's world departs from ours (no Second World War; jets capped by the Atlantic Air Conference in 1962; the liner trade never declines; the invented events currently stop in 1966), so later requests are judged against what that world would plausibly do.

| ID | From | Verdict | Request and notes |
|---|---|---|---|
| FR-01 | Ross | Done (0.36.5) | **Follow-ship camera**: lock the map onto one ship, zoomed in. |
| FR-02 | Ross | Done (0.36.1) | **Quiet watch**: suppress interruptions except major disasters. The same work as KI-090 (standing orders, masters' discretion, a short inbox). |
| FR-03 | Ross | Adapt | **Classes merge in the 1960s.** Historically the Atlantic lines went to two classes, First and Tourist, through the 1950s and 60s ("Economy" is an airline word). Cruising was one class from the start. Proposed: two-class ships from the late 1950s, one-class cruise ships. |
| FR-04 | Ross | Adapt | **Family class from the 1980s.** Cruise ships did not reintroduce classes; families were a market, not a class. Proposed: cruise market segments (budget, premium, family) that a ship's facilities appeal to. |
| FR-05 | Ross | Accept, later era | **Cruise ships grow from the 1980s**, with new artwork for each era's large ships. Historical (73,000 GT in 1988, 100,000 GT by 1996, 137,000 GT by 1999). Needs the later decades designed first (FR-12). |
| FR-06 | Ross | Reject as stated | **Private superyachts.** A shipping line is not a yacht builder, and it is outside the game's subject. Possible alternative in any era: an owner's yacht as a prestige purchase (shipowners did keep them), affecting reputation and society events, not trade. |
| FR-07 | Ross | Accept, later era | **Casinos from about 1970** (historical: casinos at sea grew with Caribbean cruising in the 1970s). **Discos** in the 1970s, renamed **nightclubs** later: acceptable as era names for the same facility; the 1989 date is arbitrary, so it can be fixed to the end of the 1980s. |
| FR-08 | Ross | Done (0.37.1) | **Medical bays.** Not historical as an optional extra: emigrant ships had to carry a surgeon long before 1900. Proposed: a surgeon is required with steerage from the start; the hospital's standard is optional and improves the outcome of epidemics and quarantine (the existing quarantine emergency), with better hospitals standard from the 1940s. |
| FR-09 | Ross | Accept, later era | **"Fredrick"**, a parody of a long-running American entertainment company, launches very large family cruise ships. Historical parallel (a family cruise line from an entertainment company, late 1990s). Parody only: no real names, characters or marks. Better timed to the late 1980s or 1990s than the early 1980s. |
| FR-10 | Ross | Adapt | **Soviet cruising, 1970s to early 1990s.** The competitor half is historical: Soviet state lines ran cheap ships chartered to Western cruise operators and undercut on price, and this ended abruptly after 1991. Soviet citizens were not a cruise market, so this should be a budget competitor and a source of cheap charters, not a new market. |
| FR-11 | Ross | Done (0.37.1) | **A major disaster about once a decade**, not only one type (fire, collision, grounding, capsize, hijacking). Historical: Morro Castle 1934, Andrea Doria 1956, Lakonia 1963, Achille Lauro 1985, Herald of Free Enterprise 1987, Estonia 1994, Costa Concordia 2012. Goes with the rescue mechanism (KI-091). |
| FR-12 | Dev | Accept (0.5x on) | **Design the decades after 1966** before adding late-era content, researched and built the way 1900 to 1930 was (sources first, then trades, ships and events). FR-03, 04, 05, 07, 09 and 10 depend on it. |

## Test tooling

| ID | Sev | Status | Issue |
|---|---|---|---|
| KI-100 | S3 | Fixed (0.39.3) | The headless player had no actions for zigzag, convoy or the private war-risk top-up (`zigzag`, `convoy`, `wartop`). |
| KI-101 | S3 | Fixed (0.39.3) | Headless player: the advice's Build button stopped the clock and ordered nothing; `step 0` played three months; `waroffer` answered "done" for a lapsed offer; the finance view showed a fixed 6.5% interest rate. |
| KI-103 | S3 | Fixed (0.39.5) | Round 6 | The tax on 1920 was relieved twice; a called loan repaid early was taken again; a ship order's stage was billed again after arrears; a solvent Line was foreclosed on the day of an inquiry bill; Hamburg ships for sale in the war; German lines shortable in the war; Consols borrowed against at twice net worth. |
| KI-102 | S3 | Fixed (0.39.4) | The scripted advisor (`tools/harness.js`) can never join the conference: the advice's only button goes to the Company tab, which the harness ignores. **0.39.4:** the advice now has a Join button (`confjoin`), shown only when the conference would take the Line. |
