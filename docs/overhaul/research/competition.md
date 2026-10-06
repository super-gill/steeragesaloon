# Competition (0.39.8)

The design note for outside tonnage. It explains why the balance problem after 1921 is one problem, the mechanism chosen to fix it, and how the mechanism was tuned.

## The problem

Test rounds 5 to 7 ended far above the period's targets, and each round's fixes moved the excess somewhere else.

Round 7 (0.39.6) brought 1900 to 1913 close to the targets. After 1921 it was far above them: in 1939 the careful game ended at £5.8m, the bold one at £17.7m, and the exploit game at £6.0m, against a band of £0.5m to £3m.

The players traced the money to the same kind of event every time:

- **A failed line's trades stay empty** (KI-120). Imperial Atlantic failed in December 1913 or February 1914 and scrapped most of its fleet; nobody came into its trades.
- **After 1921, trades keep one or two rival ships for years** (KI-117). The glut ships bought in 1921 and 1922 earn their price in about a year.
- **In the Depression, rivals fail and nobody replaces their sailings** (KI-118).

The common cause is that a trade paying far above the usual drew no competition. Demand was a fixed share of each trade, and the rival lines followed their own scripts. Any gap, whether from a failure, a glut or a slump, was the player's for as long as it lasted.

The real trades did not work like that. High returns brought in:

- new lines;
- tramps fitted out for steerage;
- chartered ships;
- established lines moving ships across from other trades.

Low returns sent those ships away again. That is why the period's lines averaged 5% to 10% a year over good years and bad.

## The mechanism: outside tonnage

Each trade carries an outside capacity.

- **What it stands for:** every ship not run by a named rival.
- **How it is measured:** in berths for each passenger who wants to sail, stored in `S.otw[rk].k`.
- **Monthly update** (`otwMonth` in `js/rivals.js`):
  1. Average each class's outbound demand over a year (`S.otw[rk].d[c]`), so the seasons do not count.
  2. Work out the trade's load: that demand against every berth sailing, the player's and the named rivals', with each class weighted by its fare.
  3. Work out the outside capacity that would bring the load down to `OUT_TARGET`.
  4. Move the outside capacity towards it: in over about 18 months (`OUT_IN`) and out over about 12 (`OUT_OUT`).
  5. Cap it at `OUT_MAX`, 1.5 berths per passenger.
- **In the war,** the outside ships are taken up by the state and the outside capacity decays by a sixth each month.
- **How it competes:** the outside ships sell at the trade's going fare. They count in every share of demand: the player's ships (`legCalc`, through `rivalWeight`), the named rivals' (`routeStats`), and the conference's steerage pool (`routeCapPool`).
- **What the player sees:** when the outside capacity on one of the player's trades passes 0.15, the news says other ships are coming in, at most once every two years per trade. The headless line view shows the figure.

## Tuning

The first version let outside ships into any trade from 1900, with a load target of 0.75:

| Variant | Careful script, bankrupt by 1922 (of 40) | Notes |
|---|---|---|
| None (0.39.7) | 4 | |
| From 1900, target 0.75 | 9 | The outside ships came into the 1902-13 booms and squeezed the careful owner |
| From 1900, target 0.85 | 4 | But the exploit suite found rival lines' shares at 0.3 of break-up after the 1908 slump, and a merger that paid for itself |

So in the release, outside ships come in before 1921 only to a trade a named line has left by failing in the last three years (`S.coFails`). The pre-war boom was already near its targets, and the established lines built for it themselves.

| Released: target 0.85, from 1921 or after a failure | 0.39.6 | 0.39.8 | Target 0.75 instead | Target |
|---|---|---|---|---|
| Keen script, 1914 median (10 games) | £444k | £444k | £448k | |
| Keen script, 1939 median | £3.81m | £2.99m (p10 £5k, p90 £3.92m) | £2.56m | £0.5m to £3m |
| Careful script, bankrupt by 1922 (of 40) | 4 | 4 | | |
| Careful script, bankrupt by 1939 (of 40) | 23 on 0.39.4 | 24 | 27 | |

The 1939 figures include the Depression change below. The careful script has failed in the Depression since 0.39.4: it never builds and never lays up for a slump, and a human survived the Depression in round 4. Round 8's careful player is the check.

## Alongside it

- **The Depression (KI-118):** the conference's passenger rates fall a fifth below the price level at the trough (`SLUMP_FARE`). Before, rates followed prices down about a tenth while coal fell 25%, wages 10% and dues 15%, so a Line could make more in 1932 than in 1929.
- **Taking a controlled line's ship (KI-119):** the price is what a ship of her size, speed and kind costs from the yards today, aged, and never less than the rival's own book. Before, she came over at the rivals' build price of about £17 a ton against £56 from the yard.

## Not changed

- **The rivals' own book value.** The rival lines' accounts are tuned to their £17 a ton (`CO_PRICE`). A merger buys a line at its market price, which reflects its earnings, so it is not a bargain in itself.
- **The war's returns (KI-077).** Outside capacity only decays in the war, so this note does not touch them.
