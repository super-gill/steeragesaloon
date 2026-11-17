# How the game works

Lifecycle: **built**

**Now (17 November 2026, 0.39.8):** each system as built, with the version that last changed it. Moved here from the README when the project adopted `vibe-process`. It is long: search it for the system you need; do not read it whole. The code wins any disagreement, and a wrong line here is a bug.

The direction and the eras still to build: [direction.md](direction.md). Balance targets: [balance.md](balance.md). Where each system's code lives: `docs/engineering/architecture.md`, "Where things live".

## The 1900 start

A new game starts in January 1900 (`START`). Games begun in January 1921 by 0.19 to 0.21 keep their rules: `newCal()` is false for them, and every change below applies only when it is true.

- **Prices** follow the real UK price level year by year (`PI_YEAR`, the ONS long-run index rebased to 1921 = 1, from 0.398 in 1900), interpolated monthly by `piAt(m)`; after 1940 three per cent a year. Tables stay written in 1921 money and are scaled by it, as before. A new game begins with the price index already applied: £7,000 in the bank, a £16,000 mortgage. Each January the lines revise their tariffs (`inflate`): each of the Line's fares moves with its class's line rate since the fare was last set (`L.fref`, the rate seen the month it changed), so a fare set at the rate in December is not raised again by the whole year's prices (0.35.7). From 1925 profits over an allowance pay income tax, three tenths of the excess (`taxMonth`); the wartime excess profits duty is separate (`epdJanuary`).
- **Demand** before 1921 comes from `preDemand(c, rk, m)`, a multiple of January 1900: steerage follows real immigration (`PRE_US` to New York, `PRE_CA` to Canada damped to the power 0.85, `PRE_AR` to the River Plate, and the US figure to the power 1.1 from Italy); first class grows 3.5% a year, second 5%, cruising 3%, cargo 3% (`cargoPre`). From 1914 to 1920 the 1913 level is scaled by the war and the boom (`warPax`). From 1921 the 1921 game's history (`histLegacy`) carries on, joined to the underlying curve with no step (`histAbs`, which takes `preDemand` raw at December 1920, so the 1920 emigrant rush does not carry on). `histMod` divides by the level at the start, since markets are sized then; the anchors are cached per game in `H_CACHE`.
- **Coal** before 1921 follows the real export price against the price level (`PRE_COAL`): dear in the 1900 boom, cheap by 1910.
- **The start**: `START_SHIP`, the 1881 SS Morven (4,600 tons, 12.5 knots, 1,050 steerage berths). The brokers offer ships built before the date (the `TEMPL` list, with six 1880s and 1890s ships added; `from` keeps the ex-German Kronberg back until 1921) and generated ships, smaller and slower the older they are (`shipEraGrt`, `shipEraKnots`).
- **Rival fleets** are sized for their build year with the same functions, and pre-war liners carry far more steerage to the ton (`RIVAL_KIND`). In 1900 pleasure cruising is one Meridian ship on each cruise (`RIVAL_START_1900`); the cruises to nowhere open only in 1920 (`routeOpen` checks `from`). A rival's new ship takes 10 to 18 months to build (six to answer an interloper), held in `S.rorders`, and before August 1914 the lines add tonnage only when loads run 30% above their usual (12% after), so a boom leaves the trades short of berths for a while.
- **Technology by date**: turbines from 1905 (`MACHINES.turb.from`), geared turbines from 1911, oil firing from 1919 (`OIL_FROM`, for new building, conversions and the advice), the biggest slip growing from 20,000 tons in 1900 to 50,000 by 1911 (`slipMaxYear`). Wireless is dear before 1911 (`wirelessNovelty`, four times its later price in 1900), only ships built from 1911 come with it, and the mails need it only from July 1911 (`wirelessRule`, `mailShip`).
- **Ellis Island** (`usInspection`, before 1921): a head tax on every immigrant landed at New York ($1, $2 from 1903, $4 from 1907, at $4.86 to the pound), and about 2 in 100 refused and carried home at 60% of the fare plus a fine for the diseased; half as many from a port with the Line's hostel.
- **Booking agents** lift steerage 12% on the routes they serve before August 1914 (`agentSteer`), 7% after.
- **Rival calibration** (`coRef`, and `load0` in `marketFor`) is set from the game's first year.
- **Overdue ships**: the office plans on the passage her schedule allows (`plannedSpeed`, from the leg worked out at sailing) and posts a silent ship overdue only after three days, or a quarter of the passage on a long one. Before 1911 few ships have wireless, so this matters far more than it did. The office allows for the weather on her track: a gale, fog or ice that slows her (`sh.slow`) slows her reckoning too, so an overdue notice for a ship that then arrives safe comes about once in five years of service for a kept ship, more for a neglected one (0.35.7; it was more than once a year).
- **Lighterage** at a port a ship is too big for is charged at the day's prices (`lighterFee`) and counted in the forecasts (`lighterLeg`).

## The early years: rate wars and the Combine (`js/trust.js`)

- **No conference before 1908** (`CONF_FROM`, `confOpen`): the join button and the conference texts wait for it; pressure from undercutting the other lines still builds and can start a war on the Line.
- **Wars between the lines** (`lineWarsMonth`): each busy passenger trade has about a 1.2% chance a month before 1908 (0.1% after, and more in a slump) that its two biggest lines, not both in the Combine, fall out: for 3 to 8 months steerage sells at 55% of the line rate and cabins at 85% for the two at war, the other lines following 70% of the way (`warMult`). The war ends with a pool. In February 1904 the great New York rate war runs for nine months on all five New York trades.
- **The Combine** (`trustMonth`): in October 1902 the International Ocean Combine forms over Imperial Atlantic and Columbia (`S.trust`), each loaded with £400,000 (1921 money) of the Combine's bonds as cash. Before 1908 it buys a weak independent liner company now and then (up to five members), paying its net worth plus a quarter; members keep their names and do not fight each other. Once the Line has three ships it may offer to buy it, about once in three years and never within two of a refusal, for 1.3 to 1.6 times its net worth (`S.trustOffer`). Selling ends the game (`S.over = 'sold'`); refusing, or letting the offer lapse after two months, brings a rate war on the Line's two busiest trades (steerage 60%, cabins 75% of the line rate for 6 to 10 months).
- **The biggest lines** grow more slowly once they hold a fifth of all rival tonnage, answer an interloper less readily past 35%, and are kept off the receivers' sales past 30% (`coShare`), so no line swallows the rest.

## Speed and splendour, 1907 to 1913 (`js/prewar.js`)

- **The racers and the giants** (`PREWAR_SHIPS`): Nordmark's Nordstern (1907, 24,500 tons, 23.5 knots), Imperial Atlantic's turbine twins Invicta and Indomita (1907, 31,500 tons, 25 knots), Imperial's giants Atlantean (1911) and Hyperborean (1912, 45,000 tons and more, 21 knots), Aurore's Provence Royale (1912) and Nordmark's Weltmeer (1913, 52,000 tons). Each is ordered and paid for two to three years before she sails; if her line has failed the order passes to the strongest British liner line, which names her itself.
- **The 1907 panic**: rumours in September, panic in October, through the panic system in `economy.js` (`S.crash.y1907`). Emigration's fall is already in the immigration figures, so the panic's own cut to demand is small (0.12); second-hand ships lose a quarter of their value (not two fifths), the bank calls in 60% of its usual share of the loans with six months to pay, and there is a one in four chance that the Line's bank fails.
- **Going home**: eastbound steerage is 70% above usual in 1908 and 20% in 1909 (`preReturn`).
- **The conference** forms in January 1908 (`CONF_FROM` in `trust.js`).
- **Strikes**: the seamen's strike of June 1911 holds the Line's ships in the home ports for about three weeks; the national coal strike of March 1912 raises bunker coal by up to 2.4 times from February to May (`coalStrike`). A bunker contract keeps its price through this strike and the 1926 one (`bunkerHeld`, `coalPrice(m, held)`).
- **The Blue Riband** (`blueRiband`): held by the fastest ship in service on a North Atlantic trade from 22 knots up; while the Line holds it, reputation drifts towards a mark 5 points higher.
- **The Admiralty's terms** (from July 1903, on the 1900 calendar only): a ship of 24 knots and 20,000 tons or more may be built to naval standards (5% dearer). The Admiralty lends two thirds of every stage payment at 2.75%, repaid over twenty years (`ADM_*`, `sh.adm`), and pays a subsidy of 4.5% of her price a year, booked as `subsidy`. The loan counts against net worth and what the bank will lend (`admDebt`), and is repaid out of her sale or her insurance. In war she may be taken as an armed merchant cruiser (0.26).
- **Great lines rescued**: an original line with eight ships or more is reconstructed once by its bankers (debts cut by two fifths, its two oldest ships sold) instead of failing outright.

## Boats, the wireless watch, 1912 and the negligence ending (`js/disaster.js`)

- **Lifeboats** are part of every ship. The old Board of Trade scale (`boatScale`) gives room for 960 people on any ship of 10,000 tons or more, fewer on smaller ships. Boats for all (`sh.up.boats`) is a refit (a week, `REFIT_BASE.boats`) and a drawing-office extra, and new ships have it from mid-1912. In every sinking no more can get away than the boats hold, launched fuller the better the safety policy (`emEnd`). From July 1913 (`BOAT_LAW`) a ship without boats for all carries no more passengers than her boats hold after her crew (`boatPaxF` in `legCalc`). The ruling is announced in October 1912; The times, the news and head office warn before it bites.
- **The wireless watch**: a ship with a set keeps it by day. `sh.nightWatch` (the ship's panel, Boats and wireless) adds a second operator for about one hand's wage a month (`watchCost`, in the crew bill). At night, before July 1914, a call for help is heard only by ships keeping a watch (35% of other lines' ships), and ice warnings reach a watched bridge (ice risk ×0.8). From July 1914 (`WATCH_LAW`) the London Convention makes the watch compulsory on passenger ships.
- **The 1912 disaster** (on the 1900 calendar only): between late March and early May 1912 one giant of 40,000 tons or more on the North Atlantic is lost. `disFit` scores how badly a ship is run (few boats for a full ship, drills, speed, morale and deck crew, no night watch, the master); the rival's Hyperborean scores `RIVAL_FIT` (6.1), so the Line's giant is chosen only if she is run as badly or worse, and must be in mid-ocean. The way in follows where she is: ice at night off the Grand Banks, a collision in fog on the approaches, or a derelict in open water. She always sinks, in about two and a half hours; nobody reaches her in time. If its window has passed by more than two months without the story starting (a save from before 0.35.5), it never runs (`disasterDaily`).
  - The Line's ship plays through the emergency window; the orders still matter. Deaths run from a third to two thirds of those aboard, by her boats, the safety policy, deck crew skill, the night watch and whether the boats were swung out early (`disDeath`). Her inquiry follows the usual rules, with full speed after warnings and no night watch weighing extra.
  - A rival's ship is followed in the wireless room. The Line's ships within 150 miles that hear her (by day, or with a night watch) can be sent to help: they lose the time there and back, earn reputation, and those that arrive before the rescuer save lives. The rival's line pays about a third of her value.
  - Afterwards: one aftermath page, the same whoever owned her (numbers only, no names); the ship's name is retired (`S.retired`); routine advice keeps quiet for four weeks (`S.quietUntil`); first class is 8% shy of the giants until 1914 (`giantShy`). The rule that follows the way in: after ice, the southern spring track (northern crossings 4% longer from March to June, ice risk ×0.4); after a collision, fog speed (all crossings 1% longer, collisions ×0.6); after a derelict, wrecks are removed (×0.4); the last two from January 1914.
- **The court's tiers** (all games, `blameOf` and `inquiry` in `economy.js`): no fault or minor fault as before. A censure (blame 4 or more) also brings the Board of Trade's inspections for two years: a worn-out, run-down or mutinous ship is detained in port and sent to the yard (`botInspect`). Gross negligence (blame 6 or more, with lives lost): the underwriters refuse to pay and take back what they paid, the claims are four times as large (no legal limit), and the owners and master are tried about half a year later. If the Line's net worth is below nothing, or it goes bust within two years, the court winds it up (`S.over='wound'`): an ending page that says what the court found and what the Line saved money on. The underwriters write, and the Marine Superintendent warns, about any ship whose loss would be gross negligence (`potBlame`).

## Liveries and ship variety (`js/livery.js`)

- **The Line's colours** (`S.livery`): funnel colour with up to two bands and a black top or not, hull, boot-topping, upperworks and a house flag (colour, emblem colour and emblem). A new game opens the chooser: twelve presets (`LIV_PRESETS`) with a live drawing of the Morven, or the Line's own. The Company tab shows the colours and can change them.
- **Each ship's paint** (`sh.paint`): what she was last painted in. Ships the Line builds come out in its colours; ships from the brokers come in their old owners' colours (`oldOwnerPaint`, seeded from the ship so the game's dice are untouched). When the Line changes its colours, every ship keeps the old ones until she is repainted.
- **Repainting** is a yard job (`paint`: about a week, a tenth of a pound a ton plus £300 at the day's prices) in the refit office. With "repaint at the next dry dock" on (the default, `S.repaintDock`), a ship going in for an overhaul, re-plating or repairs is repainted at the same visit, charged as extra work.
- **The rivals' colours** (`RIVAL_LIV`) are fixed; lines founded later take colours built from their own map colour (`rivalLiv`). Clicking a rival's marker on the chart opens a card with her drawing, size, speed, age and route.
- **Variety** (`varOf`): every ship is drawn from a seed: funnel height, width and rake, masts (three or four on ships of the 1880s, one or two on the newest), the length of her superstructure, rows of portholes, window spacing, the forecastle and poop, sheer, ventilators and lifeboat spacing. Ships built to one design share a seed, so sisters look alike. A ship with boats for all carries a second row of boats. Cruise ships, fruit ships and post-war liners keep white hulls in their line's funnel colours.
- **The chart**: the Line's markers take its funnel colour.

## The Great War: the war economy (`js/war.js`)

On the 1900 calendar only; games begun in 1921 never see it.

- **The outbreak** (`WAR_FROM`, August 1914) opens a page that says what changes, ends every rate war, and closes the Hamburg trade and the cruises until 1920 (`warClosed`; lines on a closed trade are closed and their ships laid up).
- **Passengers** (`warPax`, applied in `preDemand`): steerage to about a quarter of the pre-war trade (a tenth once America is in the war, as US immigration fell in 1915 to 1918) and first class to about three tenths (less once America is in the war in April 1917), over two or three months; the southern trades keep more cabin travel. Reservists crowd eastbound steerage in August and September 1914 (`warReturn`). Back to the pre-war trade over the year after the armistice.
- **Freight** (`warFreight` in `cargoMod`, `warCargoVol` on the cargo offered): rates up to about 1.2 times their pre-war worth over and above the rise in prices, held down from 1917 when the Ministry of Shipping controls them; about a quarter more cargo is offered, so holds fill (0.33: 1.3 times and a third more before).
- **Costs**: coal (`warCoal`) and wages (`warWage`) climb over prices; every ship still trading pays the state's war-risk insurance, 0.8% to 2% of her value a month (`warInsCost`); second-hand ships fetch up to 1.8 times their pre-war worth over prices (`warShips` in `shipMkt`). The brokers have a ship now and then until 1917, and none after.
- **No building**: no new orders (`warNoBuild`), no keels laid, and ships already on the stocks progress at a quarter of the pace. The rival lines order, renew and found nothing in the war.
- **Rivals** (`warRivalF`): the German lines' ships lie in neutral ports (no trade, a tenth of their costs, back at half strength from 1920); British, French and Italian lines lose a growing share of their ships to their states, which carry those ships' costs and pay their hire; the American lines grow while neutral. The ships a line keeps carry wartime cargo too: 1.1 times their running costs, scaled by the freight rate (0.33). Nobody sells ships, sells up or fails while the war lasts.
- **The reserve list and requisition**: from October 1912 the Company tab lets you put ships on the Admiralty's reserve list. In the war the state takes a growing share of the fleet (`REQ_SHARE`: 15% in 1914, 30% in 1915, 45% in 1916, 75% in 1917 under the Liner Requisition Scheme, 85% in 1918). Admiralty-terms ships go first, then ships on the list. A line with ships on the list is asked to choose (it has a month, under Needs attention) and is paid 15% more; otherwise the biggest and fastest are taken. Roles (`reqRole`): armed merchant cruiser, hospital ship, troopship or transport. The state pays her crew, coal and insurance and a net hire of 0.30 to 0.40 a ton a month at the day's prices (`reqHire`, ledger `charter`); she loses about 1.2% condition a month and ages faster, and war service earns the Line standing (more for hospital ships). Ships come home from March 1919, with 0.9 a ton towards their refit.
- **Clearing the steerage** (`warcargo`, `uncargo` yard jobs): steerage and tourist berths come out for about 1.1 and 1.9 tons of cargo each; they go back after the war for the same price. The Marine Superintendent advises it when it pays.
- **Excess Profits Duty** (`epdJanuary`): each January the year's profit is recorded (`S.annual`); for 1914 (from August) to 1920 the Treasury takes 50%, 50%, 60%, 80%, 80%, 40% and 60% of the profit above the standard: the average of 1911 to 1913, or 6% of the Line's net worth at the outbreak if more, carried forward at the day's prices.

## The Great War: the war at sea (`js/war.js`, 0.27)

- **Attacks** (`warRoll`, at each sailing): German raiders on the southern trades from August to November 1914; mines off the home ports; submarines from February 1915. The danger by period (`warThreat`): 0.3 in 1914, 0.45 in 1915, 0.6 in 1916, 3.0 from February to July 1917 (unrestricted submarine warfare), 1.8 to the end of 1917, 1.1 in 1918. A crossing's chance of an attack (`warAttackP`) is 4% times that, by route (the Mediterranean 1.4, the North Atlantic 1, West Africa and the Plate 0.6, the Caribbean 0.3) and by passage length. Of attacks, 15% are mines, 15% a ship torpedoed nearby, 70% a submarine.
- **Playing it out**: each is an emergency (`EMERG.uboat`, `nearby`, `raider`, `torpedo`, `mine`). Sighting a submarine, the master asks: run, zigzag, hold her course, open fire (with a gun), or ram her (if she surfaced close ahead: a win pays a reward and brings fame). A ship torpedoed nearby: stop for her people (standing, and 30% of the time the submarine is still there) or keep going as ordered. A raider: run, or stop and surrender (everyone is landed safely; she is sunk). A hit (`warHitP`, about 75% if she holds her course unprotected) becomes a torpedo flooding emergency, fought like any other; about four in five torpedoed ships are lost.
- **Protections**: convoy from June 1917 (attacks ×0.3, hits ×0.7, a fifth slower), speed (20 knots and up: attacks ×0.3, hits ×0.6), zigzagging (attacks ×0.85, hits ×0.75, 7% slower), dazzle paint from March 1917 (hits ×0.82), a gun and naval gunners for lines with the Admiralty's goodwill (hits ×0.75, and the choice to open fire), the night wireless watch (attacks ×0.8), and the deck crew's skill (lookouts). The ship's panel shows her risk at the month's rate and each protection; the Marine Superintendent advises them.
- **Top-up**: the private war-risk top-up cannot be taken out on a ship that is lost or in an emergency (`shipInTrouble`, 0.35.7).
- **Losses**: no court sits on a ship the enemy sank. The state's war-risk scheme pays four fifths of her value (`warClaim`), also when a torpedoed or mined ship reaches port but is not worth repairing (`writeOff`, 0.35.6); a private top-up on her panel (`sh.warTop`) pays the rest, for a premium that rises after every loss in the fleet. Ships on war service are lost too (`reqLoss`), and the state pays an agreed value close to her pre-war worth. No replacement can be built until the war is over.
- **Headlines**: the raiders hunted down in December 1914; the war zone in February 1915; the sinking of a rival express liner off Ireland in May 1915, with Americans lost; unrestricted submarine warfare in February 1917; convoys in June 1917.

## The bubble and the handover, 1919 and 1920 (`js/war.js`, 0.28)

- **Prices**: second-hand ships (`warShips` in `shipMkt`) climb from the armistice to 2.6 times their normal level over prices in March 1920, then fall to 1.8 in November, 1.3 in December and 1 from January 1921. New ships cost more from December 1918 (`warBuild`, applied in `designStats`): with every yard full, as much over normal as a ship on the market fetches (`warShips`, 0.35.6), so a ship ordered in the boom gains on delivery only what the market has risen since. The ironmoulders' strike (`moulders`, September 1919 to January 1920) cuts work on every ship on the stocks to a quarter. A ship built at boom prices is worth her real cost (`o.wb` divides it out of her `base`), so she loses the boom's premium in the crash. Freight (`warFreight`) peaks at 1.3 in 1920 (0.33; 1.6 before) and is back to normal by December, with a tenth more cargo offered; the bank lends on ships at their normal worth, not the boom's (`headroom`, 0.33); in 1920 steerage on the North Atlantic and from Naples runs 1.3 times the pre-war trade (the rush before the American quotas).
- **Offers** (`bubbleMonth`, from February 1919 to September 1920): each month about 7 in 100 of the Line's ships draw an offer of 1.1 to 1.4 times her market value, open for two months (`S.war.offers`, under Needs attention). Accepted (`offerTake`), she is sold now or when she reaches port, at the offered price (`sh.saleAmt`, paid by `exitShip`). A ship the Line has had for less than a year is offered no more than her resale cap (`saleCap`, below).
- **Speculative lines**: about 15 in 100 months a new line is floated (`coQueue` with `spec`), at boom prices (`warShips`), three quarters borrowed and with little cash. Few survive 1921.
- **Reparations** (`reparations`, June 1919): German liners of 8,000 tons and more go to the three biggest Allied liner lines, except the two largest, which the Reparations Commission auctions (`S.war.auction`, the Buy and build tab). Sealed bids at 0.8, 1 or 1.3 times the value, three tenths in hand; the bids close in October (`auctionClose`) against an Allied bid of 0.85 to 1.35 times the value. A winning bid brings her to Southampton at 72% condition with half her price mortgaged, and her first year's resale is capped like any other ship's; a winning bid the Line cannot pay at the close (cash and the mortgage short of it) fails and costs two points of reputation (0.35.7); a losing one sends her to the biggest Allied line. Elbe-Werft takes no British orders from August 1914 to the end of 1920 (`builderShut`).
- **The turn**: the times warns from July 1920 and the news in October; from January 1921 the 1921 game's crash follows. Head office gives no advice to buy while ships fetch more than 1.3 times normal, nor to build while prices are over 1.1 times, and the brokers list two ships a quarter instead of four while the boom lasts.

## Rival companies

Each rival line (`RIVAL_P` and `RIVALS`, with the company record in `S.rivals[id]`) keeps accounts in `js/companies.js`:

| Field | Meaning |
|---|---|
| `cash`, `debt` | Money in the bank and borrowed, in the pounds of the day |
| `h` | The last twelve months, each `{rev, cost, net}`; cost includes interest |
| `div` | Last January's dividend |
| `born` | Month founded, for lines founded in play |
| `dead`, `deadM` | Set when the line fails |

Each month a line takes its share of every route's passengers and cargo from `routeStats` (the same market the Morven Line's ships share), pays variable costs (`CO_VAR`, 30% of takings), fixed running costs per gross ton (`S.rcost[route]`, scaled by `coCostIdx`: the price index, wages, coal and dues, all of which fall in a slump) and interest (`CO_RATE`). `S.rcost` is set once per route by `coCalibrate`, so the route's starting rival fleet keeps `CO_MARGIN` (8%) of its takings in the reference year (`coRef`: the game's first year; 1922 for games begun in 1921).

Names (0.35.7): a line founded in play takes a name no line has had (`coFreshName`: a word from its pattern's ship names or a list of rivers, and a suffix for its kind), and no two ships afloat share a name: the Line's, the rivals', the brokers' list and the yards' orders (`nameTaken`, `freshName` adds a numeral). A rival ship on a trade that has closed moves to an open one of the same kind from the same port, or stays where she is without news. A controlled line told to keep off the Line's trades sends new ships elsewhere too (`mkKeepRoute`).

Character: `aggr` (how hard it fights and how readily it builds), `prestige` (how cabin passengers rate it) and `lev` (the share of its fleet's value it will borrow against). A line builds where loads are strong and it can pay (`coCanPay`: cash above a three-month reserve plus borrowing room), grows more slowly once it holds a quarter of all rival tonnage, repays when flush, pays a January dividend and renews its oldest ship when it can. When short and the bank will lend no more it sells its oldest ship, to another line or abroad. It fails (`coFail`) when its net worth goes below nothing, its overdraft passes 12% of its fleet's value, or it has no ships: up to two ships go to the Morven Line's brokers as bargains, others to lines with money (at most four each), the rest to scrap or abroad. A new line (`CO_POOL`, then generated names) is queued 4 to 12 months later, and sooner for a trade left with no rival ships; promoters wait while a slump is deep. Lines founded in play are saved in `S.genCos` and put back in the tables on load.

## The share market (`js/market.js`, 0.29)

Found on the Finance tab, under Shares. Nothing in it is needed to play: the market keeps its own dice (`mrand`, seeded from the game's rival fleet), so a game that never touches it plays out exactly as it would without it (`MKT=0 node tools/harness.js careful 10` prints the same as without `MKT=0`).

- **Listed**: every rival line, from the start or its founding (the lines floated in the 1919 and 1920 boom too), and eight companies next to shipping (`MK_REL`): two shipbuilders (on the order books, the Admiralty's work in the war, the boom and the slumps), steam coal (on the bunker price), oil (from 1909), docks (on cargo), the boat-train railway (on passengers), a marine insurer, and an aircraft maker from 1919. All are dealt in London.
- **What a company is worth** (`mkFund`): a line, half on its ships less its debts (cash counting up to three tenths of its fleet's value, since a hoard never reaches the shareholders) and half on eight years' earnings, never below a quarter of its ships (cash up to three tenths of its fleet's value counts in full, cash over that at seven tenths, 0.34); the others, ten years' earnings at a normal level times what drives them. The market marks it down at nine twentieths of the change a month and up at a fifth. Growth beyond the rise in prices is paid for partly with new shares (the exponent 0.6 in `marketMonth`), so a holder keeps about two fifths of it; a line the Line controls issues none.
- **The price**: worth a share × the mood × the news × two drifts of its own, one that fades in months and one that takes a decade. The mood (`mkMoodBase`) falls in a panic (the 1907 panic and the random ones from 1936), in the war (War Loan pays better, free of risk), in the 1921 slump and the Depression, with the Wall Street crash of October 1929 ahead of it; it rises in the 1919 and 1920 boom and the late twenties. The news: the 1912 disaster's line loses a third and the insurer and the builder fall; the German lines halve at the outbreak; a line the Combine buys jumps a fifth; a line reconstructed by its bankers loses two fifths; the Blue Riband adds a little; a line in a rate war trades 6% lower. A line that fails is struck off and its shares are written off.
- **The Stock Exchange closes** from the end of July 1914 to January 1915; nothing can be bought or sold and prices stand still.
- **Dealing** (`mkBuy`, `mkSell`): 1% to buy (commission and stamp duty), 0.5% to sell; an order moves the price against itself by 0.6 times its size against the company's tradable shares (`mkDepth`: every share not locked up by the Combine or a friend's block, whoever holds it), at most by half, and the move fades with the quick drift. The Line can buy no more than the shares on offer (`mkFree`). Before 0.35.3 the move was measured against the shares still on offer, which shrink as the Line buys, and `mkBuy` had no limit: buying a company a little at a time could push its price up tens of thousands of times for the Line to sell into. Gains and losses on sales, dividends and margin interest go to the ledger as Shares and dividends.
- **Margin**: the broker lends half of a purchase at 5.5% (`MK_LOAN_RATE`). When the loan passes three quarters of the shares' value he calls for money (under Needs attention); a month later, if the loan is still over three fifths, he sells enough of every holding to bring it back to half. A sale pays the loan down in proportion.
- **Dividends**: a line pays once a year the dividend its directors vote in January out of its own cash (`coYearEnd`: half its profit, seven tenths for a heavy borrower, while it keeps two reserves in hand), reaching the shareholders in February; the companies next to shipping pay half their earnings, quarterly (0.30; in 0.29 a line's dividend was notional).
- **Net worth and the bank**: shares at the market, less the margin loan, count in net worth, and half of that counts towards what the bank will lend. The Line's own holdings (and its shorts) are valued at the price without its own push (`mkFair`, 0.35.2): each purchase or sale by the Line adds to `c.own` (the log of its price impact, fading by a tenth a month with the rest of the quick drift), and a dawn raid, a tender and crossing a fifth add to `c.ownS` (the City's excitement, fading like any other shock). Without this, buying half a line in a day put about a quarter of the money back on the books as a paper gain, which drained away over the months that followed.
- **The investment account** (`mkFundOpen`): money and a brief (preserve 30% in shares, balanced 55%, growth 85%, the rest in government stock) for a City broker, at 1% a year of what he manages, or for the Investment Office. Each quarter the manager sets the share of shares by the brief, leaning a little against the mood by his skill, picks seven companies (eight for growth) by price against worth (read through noise, less for a better manager), keeps off lines in trouble and lines floated in the last two years, and reports. The account can be paid into, drawn on or closed at any time (selling at the market).
- **The Investment Office** (`mkOfficeOpen`): £6,000 (1921 money) to open and a head and three clerks a month. It shows each company's price against its worth, advises each quarter (cheap companies, dear holdings, the mood, the margin loan) and can run the investment account with no broker's fee. Its head's ability, from muddled to first-rate, sets how well it reads worth and how well it runs the account. Each quarter two candidates are offered; appointing one costs three months of the old head's wages (0.34).

## Stakes and control (`js/market.js`, 0.30)

A stake in a rival line brings powers, shown under its card on the Shares view. Only the Line's own holding counts, not the investment account's. A controlled line stays a company of its own, under its own name and flag. It can be lent money (`mkLend`) at 5% a year to carry it through a bad patch: it repays when it has cash to spare over two reserves, the loan counts in the Line's net worth, a merger cancels it and a winding-up repays it first, and it is lost if the line fails (0.34).

| Stake | What it gives |
| --- | --- |
| 20% (`MK_SEAT`) | A seat on its board. On a trade where it is the leading rival, tension over the Line's fares builds an eighth slower, which leads to about two fifths fewer rate wars there (0.34; half as fast before). Crossing a fifth is noticed: the price rises 8% on bid talk |
| Over 50% (`MK_CTRL`) | Control. Its dividend (none, normal half of profit, generous nine tenths, voted each January), its strategy (retrench, steady, expand: its aggression ×0.6, 1 or 1.35), keeping it off the Line's trades (it moves its ships off within the month and orders none for them), ending its rate wars, and buying its ships at their book value. On a trade it leads, tension over the Line's fares does not build and no rate war starts. It issues no new shares over the Line's head |
| 75% (`MK_SPECIAL`) | Special resolutions. Merge: the other shareholders are paid their share of what it is worth; its ships join the Line (valued as its books had them, in its colours, on their trades), its trades open, its cash and debts become the Line's, and ships it had on order are sold back to the builders at four fifths. Wind up: its ships are sold at seven tenths of their value, its debts paid, and the Line gets its share of the rest; a new line is founded for its trades in six to fifteen months |
| 90% (`MK_BUYOUT`) | The rest bought out: at a quarter over the market before the Companies Act of November 1929, at the market after |

- Buying a share of the company outright (1%, 5% or 10% on its card) takes from what is left on the market, and the price moves by 0.6 times the share of that bought, up to half.
- The Combine holds three fifths of each member and will not sell, so no member can be more than 40% held.
- The Company tab's card for each rival line shows the Line's stake.

## Floating the Line (`js/float.js`, 0.31)

The Line starts private and can never be bid for. At the top of the Shares view (Finance tab) it can be floated once it has three ships, three years of accounts and a net worth of £60,000 (1921 money), while the Stock Exchange is open.

- **The float** (`flFloat`): sell 25%, 49%, 60% or 75% of the Line to the public. Half the shares sold are new, and that money goes to the Line; half are the owner's own, and that money goes to the owner (shown at the float and on the ending page, outside the Line's accounts; 0.34, before which it all went to the Line). They are priced a tenth under the Line's worth (half its net worth, half eight years' profit, `flWorth`) times the market's mood, and the issuing house takes a twentieth: The Line after the float is worth what it was plus the new money only, and the public pays nine tenths of that a share (`flIssue`, 0.35.5; before, the share count assumed all the money went to the Line, and the shares were issued about a third over what they were worth): 49% raises about 0.54 of the Line's worth after the fee (0.27 to the Line), 75% about 0.97 (0.48 to the Line). The earnings are the last full year's accounts, not the year to date scaled up. The boom of 1919 and 1920 is the best time to float.
- **Founders' voting shares** (`flFounders`), at the float or later but never during a bid: the owner's shares carry three votes each, and the Line's shares trade 15% lower for it.
- **The board**: each January it sets targets for the year: a dividend of 3% on the share price; a profit within a tenth of last year's or 6% on the Line's worth, whichever is less (seven tenths in a slump); the shares no more than a tenth behind shipping shares as a whole; and no ship lost with lives and no gross negligence. At the next January meeting each target met adds 3 to 6 to its confidence (0 to 100, starting at 65), each missed takes 8 (12 for safety). It also reacts: a ship lost takes 5 (10 with lives), gross negligence 25, the Blue Riband adds 5. Between meetings its confidence drifts back towards 60.
- **Removal**: if the public holds the majority and the board's confidence is below 20 at a January meeting, having been below 35 at the one before, the owner is voted out and the game ends (`S.over = 'removed'`), keeping their shares. A minority float's board complains in the newspapers but cannot act.
- **Dividends** (`fldiv`): none, normal (half last year's profit) or generous (nine tenths), paid in January on the public's shares, booked as Dividends to shareholders. No dividend with a profit to pay from angers the board.
- **Buying back** (`flBuyback`): the Line buys its own shares at the market (1%, 5% or 10% at a time; the price moves with the share of the public's shares bought) and cancels them. Holding the majority again ends removal and bids; buying back every share takes the Line private.
- **Bids** (`flBid`, only when the public holds the majority): the biggest rich line (worth at least 0.6 of the Line, with cash of 0.15 of it) bids, about once in seven years a month when the Line's shares are cheap against its worth and once in thirty otherwise, never in the war or within three years of the last bid. Until 1914 the Combine bids instead of offering to buy. The bid is 30% to 55% over the market and open three months. At its close the public's shares are offered: a quarter, and more the higher the premium, the lower the board's confidence and the more cheerful the market. If the bidder then has over half the votes, the Line is theirs and the game ends (`S.over = 'taken'`), the owner's shares bought at the bid.
- **Defences**: a **white knight** (a line outside the Combine buys up to a quarter of the Line from the public at 5% over the bid, as much as it can afford down to a tenth; those shares are never sold to the bidder, and the knight may bid itself one day); **Pac-Man** (take control of the bidder, over half its shares, not possible against a Combine member); **scorched earth** (sell ships until the fleet is worth under seven tenths of what it was when the bid came); a **buyback** to the majority; **founders' voting shares** (set up before the bid); a **crown jewel** sale (the finest ship sold to a friendly line at 0.85 of her value, and the bidder withdraws three times in five each month after); and an **appeal to the government** against a foreign bidder (blocked four times in five, at the price of staying British with every ship on the Admiralty's reserve list).
- Needs attention shows a bid, and a board below 35 when the public holds the majority.

## Advanced moves (`js/moves.js`, 0.32)

The harder moves, under a company's card on the Shares view, and the rivals' answers. None is riskless: `tools/moves.js` checks that each works and that the obvious loops lose money.

| Move | How it works | The catch |
| --- | --- | --- |
| Dawn raid (`mvRaid`) | Up to a fifth of a rival line bought in a day at a tenth over the market, before the price reacts; its shares then jump 12% (fading) | Selling straight back loses about a sixth; the target answers (below) |
| Tender offer (`mvTender`) | A price 20%, 35% or 50% over the market for every share, open a month; it goes through only if the Line ends with over half. Holders accept 20% plus 1.8 times the premium over 10%, more in a gloomy market or for a line in trouble, fewer if a friend holds a blocking stake. Not for a Combine member | A failure costs the advisers half a per cent of the offer's value and a point of reputation; a success costs the premium on every share |
| Proxy fight (`mvProxy`) | With a tenth or more, a campaign (£2,000 in 1921 money plus 1% of its market value) for the shareholders' votes: won 5% of the time, plus 1.2 times the stake, plus the Line's reputation over 30 (as a hundredth), a quarter more against a loss-making line and 15% more against a stretched or troubled one, a tenth less against a line that is doing well (up to 90%; 0.34, it was easier). Won, the Line controls the board on as little as a tenth (all the powers of control) while it keeps a tenth | Lost: 3 points of reputation and no second try for two years |
| Short selling (`mvShort`, `mvCover`) | Not in a company the Line holds, and no buying while short (0.34). Sell 2% or 5% of a company's shares borrowed (up to half what is on the market), putting up half the sale as margin; buy them back later | 4% a year to the lender, its dividends to pay, the broker buys the short in when it would cost nine tenths of the sale and margin to buy back, and a short over a twentieth of the market is squeezed (6% a month: the price jumps 30%) |
| Bear raid (`mvBear`) | With a short of at least 2% of the company open (`mvBearShort`), and never in wartime, a rate war on a trade the Line and the target share: its fares at 72% (steerage 60%), the other lines following, the Line's own fares cut by a quarter, its shares down 7% | The Line's own takings fall too; a conference member is fined £2,000 (1921 money) and loses standing; half the time the target starts a war on another of the Line's trades |

**The targets answer** a dawn raid or a tender (`mvDefend`): about a third of the time, when the public holds the Line's majority, the target bids for the Line (Pac-Man); otherwise a friendly line may take a blocking stake of a fifth that is never sold to the Line (a white knight), or it sells its two best ships (scorched earth).

**Against a floated Line** the rivals make the same moves (`mvAgainst`): a dawn raid on its shares when they are cheap (the raider holds up to a fifth, may come back with a bid, and at an annual meeting with the board's confidence under 40 forces a vote: the more unhappy the board, the more of the public votes with the raider, and if the raider outvotes the owner, the owner is removed), and a bear raid (the Line's shares down 12% and a rate war on its busiest trade). Founders' voting shares count three times against a raider too.

## The fleet (`js/ui.js`, `js/fleetmgr.js`, 0.35)

The **Fleet tab** lists one short row a ship, grouped by line: a dot for where she is (green at sea, pale blue in port, amber in the yard, hollow laid up or on war service, red in trouble), her condition, and last month's profit. Each line's heading gives its ship count and last month's profit, and folds away with a click (`UI.fgShut`). Clicking a ship opens her full panel below the list.

The **Fleet Manager** (the button at the top of the Fleet tab) is a window over the chart, and on a wide screen over the left column too. It pauses the clock while it is open, like the drawing office and the crew window, and restores the speed when it closes.

| Part | What it does |
| --- | --- |
| Views | Five sets of columns, so the table never scrolls sideways on a laptop: **Trading** (line, where she is, speed, last month, twelve-month average, what needs attention), **Condition** (condition, age, hull, service threshold, upkeep, fittings, yard), **Money** (worth, her share of the mortgage, insurance cover, excess, premium, last month), **Crew** (master and his habits, hands, wages, morale and skill by department, weak officers) and **Fittings** (tons, knots, fuel, berths by class, cargo, wireless, boats for all, reefer, war cargo) |
| Sorting | Click any heading; again to reverse |
| Filters | By line (or laid up), by state (at sea, in port, in the yard, laid up, war service), "needs attention", and a search by name once the fleet passes 15 ships |
| Needs attention | In trouble at sea (overdue, stopped, under tow, limping), run down (under 35%), due for the yard (under her threshold, nothing booked), losing money over the year (her average below nothing after at least six months; a bad winter month alone does not count), uninsured, to be sold or scrapped, or head office has a warning for her (tips do not count) |
| Actions | Tick ships (or the heading box for every ship shown) and set speed, upkeep, service threshold, insurance cover or excess, or assign them to a line; these take effect at once. Drydock, lay up, sell and scrap ask first and show the total cost or proceeds |
| By line | Ships, berths, cargo tons, last month and the average for each line, laid-up ships and ships on war service, and the fleet |

The rules the actions follow are the ship panel's: a ship at sea changes line, lays up, docks or is sold when she reaches port; a ship on war service is left out of moving, docking and selling; the bank insists on cover while the Line is in debt; the Line keeps at least one ship; a drydock is booked only while there is cash for it. Anything the owner sets this way counts as the owner's own choice, so the departments leave it alone for three months. The window reports what was done and which ships were left out and why.

Clicking a ship's name opens her panel beside the table on a wide screen; on a phone the window closes, her panel opens, and a button takes you back. In the Crew view a name opens her crew window instead. The crew window's "The whole fleet" button opens the Crew view; it replaces the Crewing Office's own fleet table, and is there for every owner.

On a phone the table keeps the ship's name and one column a view; the rest are in her panel.

## Government stock (`js/economy.js`, 0.35.1)

The Line can hold Consols, a 2½% government stock with no repayment date (the Finance tab). Its yield follows the real annual average (the Bank of England's consol yield, [FRED series LTCYUKA](https://fred.stlouisfed.org/series/LTCYUKA)), each year's figure taken at mid-year with straight lines between (`GILT_Y`, `giltYieldAt`). Its price for £100 of stock is 2.5 divided by the yield, times 100 (`giltPrice`).

| Year | Yield | Price for £100 |
| --- | --- | --- |
| 1900 | 2.55% | £98 |
| 1913 | 3.43% | £73 |
| 1920 | 5.37% | £47 |
| 1929 | 4.57% | £55 |
| 1935 | 2.90% | £86 |
| 1939 | 3.73% | £67 |

- **Holding**: `S.giltPar` is the stock held (par); `S.gilts` is its value today, marked each month and on every purchase or sale (`giltsMark`). Net worth and the bank's lending (90% of its value) use `S.gilts`.
- **Income**: £2 10s a year on each £100 of stock, paid monthly into the "Government stock" ledger line. Bought at the yield of the day, it pays that yield.
- **Dealing**: buying and selling each cost ¼% (`GILT_FEE`).
- **A panic** adds 0.4 points to the yield (`S.giltShock`, about 11% off the price at 1900 yields), fading by a fifth a month.
- **A failed bank** takes three quarters of the Line's cash above a small float, but not its stock.
- **The broker's investment account** holds the same stock: its stock and the "same money in government stock" benchmark both grow by the stock's total return (price and interest) each month.

What £100 of stock bought in one year and sold in another comes to, with its interest: 1901 to 1914 £112; 1901 to 1921 £105; 1914 to 1921 £91; 1921 to 1929 £155; 1929 to 1935 £184. Before 0.35.1 the stock paid a flat 3½% and never moved (1901 to 1921 £169, 1929 to 1935 £120). Old saves keep their holding's value: it becomes stock at the day's price.

## The bank, the brokers and the mails (0.35.4)

- **Second-hand ships** (`buyTerms`, `buyShip` in `sim.js`): the bank mortgages up to 60% of the price, but no more than 70% of her worth plus the Line's unused borrowing, and nothing while a panic has stopped lending (`S.noLend`); the rest is paid in cash. For a year after the Line acquires a ship, by purchase, delivery or a merger, she sells for no more than she cost, moved with the market for ships since the price was set (`saleCap`: `sh.paid` × today's `shipIdx` over `sh.mk0`). A ship taken over in a merger is booked at 0.6 of her worth, what the market paid for her at the share-price floor. So a receiver's bargain, a merged line's fleet or a new ship cannot be turned over at once. A requisitioned ship cannot be sold or scrapped. Short selling takes at least 1% of the company.
- **New ships**: on delivery the bank advances up to half her price on mortgage only if the Line has less than half her price in hand, and not while lending has stopped. A ship ordered for a line joins it on delivery. What has been paid on ships on the stocks counts in net worth (`ordersValue`).
- **The overdraft** costs 8% a year (10% when rates are up) on the overdrawn balance, charged daily.
- **Property ashore** is valued at about half its cost at today's prices (piers at three fifths); agencies, canvassers and contracts are not property and count nothing.
- **Mail contracts** pay per round trip, for up to two round trips a month (`MAIL_LEGS`, four legs), however many ships sail the line. A contract runs for as long as the sailings are kept. A declined offer is not made again on that line for two years, and one left to lapse for a year (`S.mailNo`, 0.35.7).
- **The American wireless law**: from July 1911 a ship without wireless leaving New York, New Orleans or Galveston carries 49 passengers at most. Head office warns a year ahead for ships on American routes and on mail routes.
- **The Admiralty's terms** need a British yard, and the subsidy is paid only while the ship is in service (on a line, or in the yard).
- **Insurance at sea**: more cover, or a lower excess, on a ship at sea, in an emergency, or lost but not yet posted missing starts when she next reaches port (`setCover`), so cover cannot be raised on a ship already overdue or lost.
- **Slips held**: a builder keeps a free slip for each of the Line's orders still in the drawing office or waiting, so a slip quoted free is not taken by a rival's order in the meantime (`slipsMonth`).
- **Mail contracts and moves**: head office never advises moving or laying up the last ship on a line that carries the mail, and moving her yourself brings an immediate warning (`mailLeft`). Head office never advises buying a ship for a closed trade, nor forecasts a new design on one.
- **The conference** (`confJoin`, `confLeave`): joining ends the rate wars against the Line, not the lines' wars with each other; a Line that leaves cannot rejoin for a year.
- **The bank's whispers**: when the City whispers about the Line's bank, head office advises moving spare cash into Consols.

## Fares and the travellers' way out (0.35.4)

A class priced above the line rate loses passengers to the other lines (`fareDemand`, unchanged up to twice the rate, and with no floor beyond it). The travellers also have a way out: another port, another route, or staying at home. In each ship's share of a route (`legCalc`) it counts as another line holding 15% (`OUTSIDE_A`) of the route's capacity at the line rate, so at the line rate nothing changes, and a line alone on a route earns most at about one and a half times the rate (when its ships are full) and less than at the rate by three times. Rivals judge the Line's fares class by class with each counting at no more than a tenth over the rate, so a dear First cannot hide a cheap Third (`ourFareRatio`, `pressure`). Tourist Third counts too, from 1925 or on a cruise, on a route where the Line's ships carry it (`watchCL`). A rate war on a route goes on when the Line closes its service there.

## Outside work

Each pier, repair yard, emigrant hostel, booking agency and freight canvasser the Line owns has a switch in `S.shore.sell` (keys such as `pier:NYC`, `yard:GLA`, `hostel:LIV`, `agency:british`, `fagent:africa`; absent means own use only, the default). Every month `outsideMonth` (called from the rivals' month with that month's `routeStats`) works out for every place, selling or not, what it would earn (`S.shore.est[key]`, shown on the Shore tab), and for those selling books the takings to the ledger as `shorein` and keeps twelve months in `S.shore.earn[key]`. The rival companies pay out of their cash, in proportion to their use.

| Place | Capacity | What it earns | What the rivals gain |
|---|---|---|---|
| Pier | 10 berthings a month, less the Line's own calls | 40% of rival calls up to the spare berths, at `OUT_PIER_FEE` (0.007 a gross ton) | The dues they save less the fee |
| Repair yard | 3 berths, less the Line's ships in the yard | `OUT_YARD_RATE` (£550) a spare berth-month, 35 to 90% busy with the rival fleet's size, less in a slump | 15% of the bill |
| Hostel | 3,000 beds a month, less the Line's own emigrants | 35% of rival emigrants sailing from the port, up to the spare beds, at `OUT_HOSTEL_FEE` (£0.12) | Steerage appeal 6% higher on routes calling there (`outAppeal`) |
| Booking agents | Not limited | `OUT_AGENCY_COMM` of rival passenger takings on routes calling the region | Steerage 3.5%, cabins 1.5% on those routes |
| Freight canvassers | Not limited | `OUT_FAGENT_COMM` of rival cargo takings on routes calling the region | Cargo weight 4% on those routes (`outCargo`) |

Each month the Shore tab also shows what each pier, hostel and booking agency is worth to the Line's own ships (`outOwnMonth`, `S.shore.own`): their monthly takings with it against without it, over a year of seasons (0.35.7).

Money is in 1921 pounds, scaled by the price index. Head office suggests selling spare berths at piers and yards (which cost the fleet nothing) once they would earn £400 a month; hostels and agents are left to the player, since they help rivals on the Line's own routes.

## Competition (0.39.8)

Design note: `docs/design/research/competition.md`.

- **Outside tonnage** (`otwMonth`, `outCap`, `outW` in `js/rivals.js`):
  - `S.otw[rk].d[c]`: each class's outbound demand, averaged over a year.
  - `S.otw[rk].k`: the trade's outside capacity, in berths for each passenger wanting to sail. Each month it moves towards the level that brings the fare-weighted load to `OUT_TARGET` (0.85), in over `OUT_IN` (18) months and out over `OUT_OUT` (12), capped at `OUT_MAX` (1.5). Before 1921 (on the 1900 calendar) it grows only on a trade a named line left by failing in the last 36 months (`S.coFails`), and otherwise decays. It decays by a sixth a month in the war, and is 0 on a closed trade.
  - Outside capacity `k × d[c]` counts in `rivalWeight` (no owner), at the trade's fare level; in `routeStats`, against the named rivals; and in `routeCapPool`, the conference's steerage pool.
- **Depression rates** (`applyPrices` in `js/economy.js`): the route rates are multiplied by `1 − SLUMP_FARE × slump(m)`, with `SLUMP_FARE` 0.2.
- **Taking a ship** (`mkTakeShip` in `js/market.js`): the price is the larger of the rival's book (`coShipVal`) and the matching design's price (`coShipDesign`), aged as `shipValue` ages a ship at 75% condition. The ship is adopted at that worth and takes the design's `fuelK` and `crewK`.

## Fixes from test round 7 (0.39.7)

- **Merged ships** (`mkAdopt(x, o, k)` in `js/market.js`): `base` is set so the ship's worth is `k` of `coShipVal`: 0.7 for a merger (`mkMerge`), the wind-up value used by `mkWindValue`, and 1 for a ship taken at a fair price (`mkTakeShip`). Refrigeration is carried over from the rival ship (`reefer`).
- **Margin loans** (`mkLoanSettle`): called after a merger, a winding up and the broker's forced sale; any loan above half the remaining positions' value is taken from the account.
- **Consols** (`stockCash`, `shipLendCap` in `js/sim.js`): `gilts(true, amt)` is limited to the cash less any debt above what the ships and shore property carry.
- **Requisitioned mail ships** (`monthRoll`): a missed mail sailing is excused while a ship of that line is requisitioned (`state 'req'`) or within three months of her release (`reqOff`).
- **German deliveries** (`rivalsMonth`): an order due while `warRivalF` is 0 is held a month at a time.
- **Tariff revision** (`inflate`): the fares follow the rates in January, and in any month the price index has moved 5% since the last revision.

## What ships earn (0.39.6)

Tuning record: `docs/design/research/what-ships-earn.md`.

- **Ship prices** (`SHIP_K` in `js/data.js`, 1.25): multiplies the yards' price in `designStats` (`js/yard.js`) and the `base` of every old ship the brokers list in `refreshMarket` (`js/sim.js`). Ships the brokers generate (`genMarketShip`) already take their `base` from `designStats`. A new build's `base` is still her price, so her worth equals what she cost.
- **Running costs** (`RUN_K` in `js/data.js`, 1.05): multiplies `fuelPrice` and `duesAt` (`js/sim.js`), `crewCostOf` (`js/crew.js`), and the `PROV` and `MAINT_COST` tables. Head office's forecasts use the same functions; rivals' costs (`coCostIdx`) are unchanged.
- **The start** (`newGame` in `js/state.js`): `S.debt` is 0. The Morven's mortgage was 40,000 at 1921 prices, about £16,000 in 1900.

## Fixes from test round 6 (0.39.5)

- **Tax** (`taxMonth`, `epdJanuary`): the year's taxable profit leaves out the taxes booked in it; the Excess Profits Duty allowed against income tax (`S.epdLast`) is the duty's share on trading profit, `tax × (earned − gain − standard) / (earned − standard)`.
- **Called loans** (`repayBank` in `js/economy.js`): every repayment, by the player, the harness or the headless player, reduces `S.call.amt` first and clears the call when it is met.
- **Stage payments** (`bill` in `js/yard.js`): `o.billed` records each stage billed; an unpaid one is carried in `o.due` and not billed again.
- **Foreclosure** (`bankRealise`): after stock and shares, if the account is still past the limit and net worth is positive, the bank sells ships cheapest first at 0.6 of their worth until the overdraft is half the limit; each pays off its own mortgage (`shipMortgage`) and the rest goes to the account.
- **Stock-backed lending** (`headroom` in `js/sim.js`): at most the Line's net worth (was twice it).
- **The steerage pool** (`routeCapRaw`, `POOL_LEEWAY` in `js/sim.js`): in the conference, a ship's steerage and Tourist Third demand on a trade is at most the trade's demand times her berths over all the berths sailing it (rivals' and the Line's, before appeal), times 1.15.
- **Panics** (`mkMoodBase`): the share market's mood is 0.3 lower while a City rumour lasts (0.12 before).
- **Boom offers** (`war.js`): times `clamp(cond/75, 0.5, 1)`, and 0.6 for a ship worn 75 or more. Receivers' listings are repriced to 0.7 of worth each month if lower (`refreshMarket`).
- **Rival giants** (`coShipVal`): times `vk`, 2 for an express liner and 1.3 for a giant, as paid for in `prewarMonth`.
- **The Depression's trough** (`depression`): North Atlantic and Canadian steerage 0.15 of its trend.

## Balancing 1900 to 1939 (0.39.4)

Set against `docs/design/research/growth.md`.

- **Conference fares** (`confCeil`, `CONF_CEIL` in `js/helpers.js`): a member's fares are held between 95% (`confFloor`) and 115% of the line rate, rounded, in `effFare`; head office's fare advice and the Fares Office keep within the same band (`floorFare`).
- **Steerage after the war** (`warPax` in `js/war.js`): from the armistice, steerage on the North Atlantic and Canadian routes follows set points to January 1921 (North Atlantic 0.2, 0.35, 0.55 and 0.67 of 1913 at July 1919, January and July 1920 and January 1921; Canada 0.2, 0.28, 0.33 and 0.37). Cabin classes still return over the year.
- **The 1920s** (`canadaPost`, `CA_POST`, `US_POST` in `js/helpers.js`): steerage and Tourist Third demand from 1921 is multiplied, by months since January 1921, on the Canadian routes by 0.45, 0.3 (12), 0.25 (24) and 0.5 (from 36), and on the North Atlantic by 0.7, 0.6 (12), 0.75 (30) and 1 (from 42).
- **The Depression** (`depression`): North Atlantic and Canadian steerage falls to 0.3 of its trend at the trough (was 0.5).
- **Ship prices after the boom** (`WAR_SHIPS` in `js/war.js`; `postWarShip`, `shipNorm` in `js/economy.js`): the boom tops out at 2.05 times prices in April 1920. Second-hand prices (`shipMkt`) are times 0.5 in 1921 and 1922, rising to 1 by January 1925. The bank (`headroom`, `rescueChance`, `coBankValue`) values ships at their normal worth, taking out both the glut and the Depression.
- **A failed line's ships** (`coShipDesign`, `coToMarket` in `js/companies.js`): priced from a design of the same size, speed and kind (express at 20 knots or more; cargo under one passenger berth in 100 tons; emigrant when three quarters of berths are steerage; otherwise intermediate): `base` is 0.8 of its price at today's prices, and she takes its coal and crew factors. The receivers ask 0.7 of her worth.
- **Income tax** (`taxMonth`, `INCOME_TAX`): on the 1900 calendar charged every January from 1901 on the last year's profit, less the Excess Profits Duty paid on it and earlier losses carried forward; the rates of each year from 1900, with 5% added in 1920-23 for the Corporation Profits Tax.
- **The conference advice** has a Join button (`confjoin`, `confCanJoin` in `js/trust.js`) and shows only when the conference would take the Line.
- **Harness**: `keen` is head office's advice plus joining the conference whenever possible, the stand-in for a bold human.

## Fixes from test round 5 (0.39.3)

- **Bank lending** (`bankFleetValue`, `headroom` in `js/sim.js`): the bank lends 0.7 of each ship's worth, but for a ship held under twelve months, merged ships included, at most what was paid for her moved with the market (`saleCap`). Net worth (`fleetValue`) still counts a merged fleet at its worth.
- **The owner's wealth** (`ownerWorth`, `ownsAll` in `js/economy.js`): the Line's net worth times the owner's share (`ownerShare`: after a float or a rescue stake), plus `S.ownerCash`, the money taken out by selling shares at a float. Shown beside net worth whenever the owner does not hold the whole Line.
- **Panics** (`crashMonth`): on the 1900 calendar no invented panic starts before 1946. A rumour other than 1907's comes to nothing one time in three (`S.crash.false`); while a rumour lasts the share market's mood is 0.12 lower (`mkMoodBase`).
- **Enemy lines** (`mkEnemy` in `js/market.js`): from August 1914 to January 1920 a German line's shares cannot be bought (`mkBuy`, `mkBuyPct`), raided or tendered for (`mvRaid`, `mvTender`), and it cannot be merged or bought out, nor its ships taken.
- **Forecasts** (`FC_NOW`, `fcHist`, `FC_KNOWN` in `js/sim.js`; `econ` in `js/advice.js`): while head office forecasts, `legCalc` takes the season from the month forecast but history (demand trends, the war, cargo, coal and oil, routes, inspection rules) from today. `FC_KNOWN` lists laws known in advance: from January 1924, the quota law of July 1924. `marketM` takes the two months separately.
- **Emigration series** (`preSeries`, `PRE_US_AT`, `PRE_CA_AT` in `js/helpers.js`): the American figures are centred on 1 January (years to June); the Canadian on 1 January to 1906, November 1906 for the nine months to March 1907, and the October before from 1908 (years to March).
- **Rate wars** (`sim.js`, the monthly loop): no tension builds, and no war starts, while the Great War lasts or on a trade with no rival line; a war records its leader (`by`), so it ends if the leader leaves the trade.
- **War losses** (`warLossPM` in `js/war.js`): times 0.25 before `SUB_FROM`, as `warRoll`. The top-up advice needs the expected loss covered to be at least 0.7 of the premium.
- **Table advice**: `setlineopt` records the value before a change (`L.was`); going back to it within 24 months needs a gain of £600 a month or 5% of the line's takings, whichever is more, against £150 for any other change.
- **Sales with damage** (`exitShip`): a ship with a repair or engine visit pending sells for her price less 1.5 or 0.8 times her tonnage times the price level, but never below scrap value.

## Rival fleets (0.39.2)

- **Replacing old ships** (`rivalsMonth` in `js/rivals.js`): a rival ship over 32 years old goes to the breakers with a chance of 8% a month, as before. If the line's loads on that trade are at least 0.95 of its 1900 level, it is not at war, has no ship already ordered for the trade and can pay (`coCanPay`), it orders a new ship for the trade, delivered in 12 to 20 months.

## Costs and earnings (0.39.1)

Set against `docs/design/research/earnings.md`.

- **Room a berth** (`designStats` in `js/yard.js`): steerage 3.2 tons of usable space a berth in designs before 1914, rising to 5.5 by 1924; Tourist Third 5.5 rising to 8.
- **Hull cost by kind** (`PURPOSES[].cx`): intermediate 1.3, emigrant 1.2, tourist 1.35, passenger-cargo 1.2, cargo 1.2, express 1.25.
- **Post-war passenger trade** (`quotaTrade` in `js/helpers.js`): steerage demand × (1 − 0.3 × the share of 1921-24 gone), Tourist Third × (1 − 0.4 × it).
- **Post-war freight** (`CARGO_POST`): rates from 1921 follow the 1921 game's history from a level of 1.15 times 1900's against prices.

## Open items before 1940 (0.39.0)

- **Rival lines** (`coFail` in `js/companies.js`): a line promoted in play (`born`) that fails is replaced only if a trade it sailed is left with no other line; lines of four ships or more get one reconstruction (`rescued`); the banks lend on, and judge, a rival's ships at their normal worth in a slump (`coBankValue`).
- **Share prices** (`marketMonth` in `js/market.js`): a company's smoothed worth (`c.f`) moves 0.35 of the way to today's worth each month when it falls and 0.3 when it rises. The share index records the lines' value against their worth as its fourth figure.
- **A ship's first year** (`fleetValue` in `js/sim.js`): a ship held for under twelve months counts at the lower of her worth and what was paid moved with the market (`saleCap`), except a ship from a merger (`sh.merged`).
- **Fare advice** (`advice.js`): each fare is judged by the line's takings this month and six months on, averaged; a fare changed in the last three months (`S.lines[rk].set['fare'+c]`) is not advised again.
- **Passenger space** (`designStats` in `js/yard.js`): £400 a first-class berth, £170 second, £110 tourist, £35 steerage, at 1921 prices, before the builder's and the year's factors.

## Balancing 1900 to 1940 (0.38.0)

- **Loans** (`BANK_RATE`, `loanRate`, `odRate` in `js/economy.js`): the Bank of England's rate year by year (to 2030, filled in between the years given; no war after 1939); the Line borrows at 1.75 points over it, never under 4.5%, and an overdraft costs 1.5 points more; a panic adds 2.
- **Laid up** (`dailyTick`, `idleCost`): shipkeepers at 8% of her crew's wages and her master at half pay, with port-risk insurance (a quarter of her crew and her master in full before).
- **Ship's worth** (`shipValue`): condition counts as (condition/100)^0.35 (^0.7 before), so a docking no longer swings her worth, the Line's net worth and its borrowing by a fifth.
- **The Depression** (`depression`, `SLUMP_SHIP`): steerage to North America and Canada falls by half at the trough and recovers by 1940; Tourist Third falls to 0.4; second-hand ships lose three tenths.
- **Tourist Third**: head office now advises the refit where it pays (`yard('tourist')` in the advice); it costs 8,000 plus 30 a converted berth in 1921 pounds (12 before).
- **Income tax** (`taxMonth`, `INCOME_TAX`): from 1925 the standard rate on all of a year's profit, 4s in the pound in 1925-29 rising to 5s 6d in 1938 (5s 6d after), losses carried forward; before, three tenths of what was over £150,000 at 1921 prices.
- **The mails** (`mailShip`): only a ship with sixty or more passenger berths carries them. **Cruising** (`cruiseFor`): the only ship that keeps a mail contract does not leave her line for a cruise. **Agents** can be dismissed (Shore tab, `agentdrop`).
- **Rival lines** (`coFail`): when a line of eight or more ships fails, a second promoter takes up its main trade within three to eight months.
- **The investment account** (`mkRebalance`): no holding over a twenty-fifth of a company's value; the rest stays in government stock.
- **The Combine and the conference**: no admission to the conference while the Combine's rate war against the Line lasts. **Rescue**: a sale the Treasury's director forbids is called off with a notice, and a failed bank's liquidators' debt counts at three quarters towards what the bank will lend.

## Fixes from test round 4 (0.37.2)

- **Lending** (`headroom`): 70% of the fleet and property, plus government stock at 90% and shares at half, the stock-backed part no more than twice the Line's net worth. In the Depression the fleet is valued at its normal worth for lending and for the rescue's cover.
- **Consols** (`giltYield`, `GILT_Y`): the yield table runs to 2030 (filled in year by year from 1940; in this world there is no war). While the Line holds stock a monthly wander is added (`S.giltNoise`: 0.9 of last month's plus a normal draw of 0.03 times the yield), about 0.27 points either side at a yield of 4%.
- **The Depression** (`SLUMP_SHIP`, `depression`): second-hand ship prices × (1 − 0.4 × slump); steerage on the North Atlantic and Canada trades falls to 0.35 at the trough and recovers over eight years instead of four.
- **Bank failure** (`panic`, `S.liq`): the deposit above £5,000 × prices is frozen; a quarter is lost and the rest comes back in six quarterly payments, counted in net worth meanwhile.
- **Income tax** (`taxMonth`): a year's loss (from 1925) is carried forward against later profits (`S.taxLoss`).
- **Advice memory**: `S.lines[rk].set[k]`, the month a table or advertising was last changed (no advice for six months); `sh.movedAt` (a move within a year needs twice the margin).

## The war, the ship's hospital and the great disasters (0.37.1)

- **War freight** (`WAR_FREIGHT`, `warCargoVol` in `js/war.js`): the multiple of the 1913 rate over the price level. 1.25 at the outbreak, 1.4 from 1915 through 1916; 0.8 under the Ministry of Shipping's control from February 1917 to the armistice; 1.9 in March 1919 rising to 2.5 in April 1920, then down to 1 by December 1920. A quarter more cargo is offered in the war and a fifth more until August 1920. `tools/warprofit.js` checks the return of a freight-led ship on her 1913 worth: 60% to 200% in 1916, lower but positive in 1917-18, positive in 1919 and 1920.
- **Excess Profits Duty** (`epdJanuary`, `epdSale`): the standard is the larger of the 1911-13 average profit and 6% of the Line's net worth at the outbreak, in pounds, not raised with prices. A ship sold from August 1914 to the end of 1920 adds what she fetched over her July 1914 worth (`sh.v14`; her cost if bought since; else her worth without the war premium) to the year's profit for the duty.
- **War service** (`reqChoose`): Offer her, on the Company tab, at any time in the war. An offered ship counts towards what the Admiralty wants, is paid the volunteer's hire (15% more) and gives the Line the choice of the rest.
- **Isolation hospital** (`sh.up.hosp`, a refit for ships of sixty or more passengers, 0.25 a ton plus 1,500 in 1921 pounds, 12 days): sickness spread and deaths ×0.75 (`crewMods().sick`), quarantine days ×0.7. Standard on passenger ships delivered from 1935.
- **Great disasters** (`greatMonth`, `GREAT` in `js/disaster.js`): one in a random month of each decade from 1920 (`S.great.next`). The kind is drawn from fire, collision, foundering and stranding (and a hijacking from 1970). The ship is drawn from every passenger ship of 200 berths or more: a rival's weighs 1; one of the Line's at sea by `greatRisk` (condition, wear, boats, wireless, morale, the master's experience), 0.7 for a well-found ship up to about 6.5 for a worn one with no boats and no wireless. The Line's ship starts a grave emergency of the matching kind; a rival's is lost, its company pays claims and its shares fall, and the trade's passengers are 8% fewer for six months (`greatFear`). An inquiry reports five months later.

## Rescue (0.37.0)

When the bank forecloses (cash below minus `odLimit()`), the Line is usually rescued rather than finished (`rescueTry` in `js/economy.js`). Once only: a second failure is final, and a Line the court has found grossly negligent in the last two years is wound up as before.

- **The bank first** (`bankRealise`, 0.37.2): before foreclosing, the bank sells the Line's government stock, investment account and shares to bring the account back within its limit. Only a Line still short after that is rescued or wound up.
- **The chance** (`rescueChance`): 0.72, plus 0.005 for each point of reputation over 40, plus 0.15 if the fleet and property cover what the Line owes 1.2 times, less 0.2 if they cover under 0.8; between 0.15 and 0.92.
- **The sum** (`rescueNeed`): the overdraft plus six months of fixed running costs. A Line that loses money every month is given time, not a cure.
- **Who** (`rescueWho`): from 1921, a Line that matters to the country (an Admiralty-subsidised ship, a mail contract or 40,000 tons) goes to the Treasury: a loan at 3.5% and a quarter of the Line, with a government director who vetoes sales (not scrapping) until it is repaid. Otherwise a rival line with half as much again in cash takes two fifths of the Line for its money, half the time; the Line may not raid, bid for, short-raid or fight it for proxies (`rescueFriend`). Otherwise a consortium of the City banks lends at 7%, the mortgage holders write off what the fleet and property (at four fifths of their worth) do not cover, at most a quarter (0.37.2), and the Line may buy or order no ship until half the loan is repaid.
- **Terms**: no new bank lending while a loan is owed (`S.noLend`, 0.37.2); no merging or buying out a line while buying ships is barred, and no buying shares in, merging or winding up a rival that rescued the Line (`rescueFriend`, 0.37.2); no dividend while a loan is owed (`rescueNoDiv`); no repayments on the mortgages for three years (`rescueMoratorium`); reputation −10. Each month a quarter of any cash over three months' running costs repays the loan (`rescueMonth`); the Bank tab lets the owner repay early. Net worth counts the loan as a debt; the owner's own share (`ownerShare`) is net worth less the rescuer's stake and any public float.
- **Where it shows**: Needs attention while a loan is owed, a Rescue section on the Bank tab, a note on the brokers' list while buying is barred, and no advice to buy or sell that the terms forbid.

## Costs that grow with the fleet (0.36.5)

- **Head office** (`officeParts`, `officeCost` in `js/economy.js`), in 1921 pounds a month: 500, plus 100 and 20 a thousand tons for each ship, 150 for each line open and 40 for each port its lines call at; times one plus the friction of a big fleet, 0.5 × ln(1 + (ships − 12) / 12) past a dozen ships, of which each department the Line keeps takes a fifth; plus 350 in the conference. One 4,600-ton ship on one line: about 920 (868 before); ten of 6,000 tons on three lines: 3,500 (3,800); seventy of 8,000 tons on eight lines: 38,600 (34,200), or 24,100 with all four departments; twenty of 30,000 tons on four lines: 19,500 (7,800). The Company tab breaks it down (`officeHTML`).
- **Coal and speed** (`fastK`, `fuelRate` in `js/sim.js`): a ship without her own engine figure (`fuelK`, set for every ship the Line designs) burns, above the economical speed for her size (16 knots × (tons / 10,000)^0.15), more by (knots / that speed)^2.5. A 25-knot express of 31,500 tons: about 900 tons a day at service speed (the 1907 Cunard expresses burned about 1,000); an Olympic of 45,000 tons at 21.5 knots about 770 (about 650 in fact); a 12.5-knot emigrant ship of 6,000 tons unchanged at 86.
- **Follow camera** (`startFollow`, `followTo`, `followChip` in `js/map.js`): Follow on the chart, on a ship's page, zooms to 2.5 times the fitted chart if it is further out and eases the view to keep her in the middle each frame. Zooming keeps following; dragging the chart or Stop on the chip ends it.

## Ships gone from the fleet (0.36.4)

Every way a ship leaves the fleet records it (`fleetGone`, `S.gone`, the last thirty): lost at sea or to the enemy, written off, seized by the bank, sold to see off a bid, sold or broken up by the owner. A loss, a seizure or a sale to see off a bid stays under Needs attention for two months or until noted; the Fleet tab has a fold-away list, Gone from the fleet. The fleet lists (`shownShips`) keep a silent ship that has foundered, shown at sea by reckoning, until she is posted missing: the office cannot know sooner.

## Faults (0.36.3)

`render` draws each part of the screen on its own (`RENDER_PARTS`); a fault in one is caught, written to the console and shown in a bar at the foot of the screen with the panel, the message and the first lines of the stack (`reportFault`), and the rest of the screen and the clock carry on. A fault in the simulation step pauses the clock and shows the same bar. Before, one fault stopped the frame loop: every panel went blank and the clock stopped.

## Running a fleet by line (0.36.2)

- **Built for**: a ship the Line builds keeps the line she was designed for (`sh.designLine`, `builtFor`). Her page says so, and says where she is now; the Fleet Manager's Fittings view has a Built for column. `lineFit(sh, rk)` (in `js/naval.js`) names what about her build does not suit a line: short of range for its longest leg between coaling ports, or too deep or too long to lie alongside at one of its ports (`PORT_LIMIT`), where she works into lighters. The figures already charged for both; now the player can see why.
- **Advice and the line she was built for**: a ship on her own line is advised to move only for twice the usual gain; a ship away from her line, when it is open and she would make £150 a month more there, is advised to return (`home:`, under the Traffic Department's order on moves).
- **No piling**: in each pass of the advice only the best move onto each line stays (moves, returns and putting laid-up ships to work). Every ship's figures assume the others stay where they are, so advising them all at once crowded whichever line looked best.
- **Forecasts** (`econYear`, `yearReal`): a year's figures allow for the time a ship does not sail and for her yard bills, fitted to the test fleets: about 0.9 of a clear year's takings less coal, 0.72 for an old ship (wear 60 to 90), and 0.06 of her tonnage a month in the yard at 1921 prices (four times that when old). Before, forecasts were about twice what ships then earned. `tools/forecast.js` checks the median of actual over forecast is within a fifth overall and a third for each kind of ship.
- **Room on a line** (`lineRoom`, the drawing office): how full the Line's ships there sailed on their last crossings and how many are on order for it, with a warning when another ship would thin the loads.
- **Lines left to the owner**: each line's page shows how many of its ships were built for it and how full they sail, and, with any department acting, whether the departments manage it or leave it to the owner (`S.lines[rk].hands`; `lineKept`). A line left to the owner keeps all its own and its ships' advice on the owner's desk.
- **The desk** (`deskItems`): more than three ships under the same advice (sell, lay up, put back to work, return, move) make one item, with the Fleet Manager a click away.
- **Conference floor**: fares set by head office or a department inside the conference are never below the floor (`floorFare`); the economics already charged the floor.

## Delegation (0.36.1)

A big fleet produces far more than an owner can read: at 70 ships head office raises 90 to 130 items a month. The owner's desk now holds only what needs the owner.

- **Standing orders** (`DEPT_ORDERS` in `js/data.js`, `S.depts[k].orders`): an acting department works under orders the owner can turn off one by one on the Company tab. Fares Office: fares and answers to the other lines; advertising and the table. Traffic Department: moving ships between lines; laying ships up and back in season (without that order a lay-up comes to the owner as a proposal, as before). Marine Superintendent: speeds and wartime routing; dock thresholds, upkeep and hull scrapes; refits that pay for themselves. Crewing Office: pay and drills; masters and officers. Each order is on unless turned off. Buying, building, selling, opening lines and cruising stay proposals.
- **A department's desk grows with the fleet**: it sees to (1 + its head's competence × 1.5) items a week for every dozen ships, and moves one ship a week for every dozen (`deptWeek`).
- **The owner's desk** (`deskHTML`): the Advice tab leaves out what an acting department will see to under its orders (`handled`), says in one line how many each department has in hand, and shows the first eight of the rest, gravest first, with the others a click away. Needs attention gathers more than three ships with the same trouble (laid up, run down, worn out, no threshold, an unaffordable drydock) into one line with the Fleet Manager a click away (`groupAlerts`).
- **Interruptions** (Menu, Settings): which emergencies at sea slow the clock, open the panel and ask for orders. Each emergency has a level (`emLevel`: 3 grave, 2 serious or a quarantine, 1 minor, which the master always handles). Every emergency asks from level 2 (the behaviour before 0.36.1); Grave only from level 3; Auto, the default, from level 2 until the fleet is fifteen ships and from level 3 after; Quiet watch from level 3, and no news but the gravest slows the clock. Below the setting the master decides, and the news says he handled it on his own orders.
- **Departments and the screen**: with the clock running, departments work from the last complete advice; if a fresh pass is still being worked out they wait a week rather than freeze the screen.

`tools/desk.js` plays a year with a big fleet and every department acting and checks the owner's share of the advice, which emergencies ask under Auto, and that a standing order turned off puts its advice back on the desk. At 70 ships: about 15 to 17 items a month reach the owner of 90 to 130 raised, the departments act 230 to 300 times a year, and under Auto only grave emergencies (0 or 1 a year) stop the clock, against 8 to 15 under Every emergency.

## Performance (0.36.0)

The simulation is cheap: a game day takes about 1 ms with one ship and 6 ms with seventy. What a big fleet costs is the screen and head office's advice, and 0.36.0 deals with both.

- **Head office's advice** (`advice` in `js/advice.js`) is worked out in units: one for each line's fares in each class, each line's advertising and table, each line's other advice, each ship, and the company. Inside a pass a unit is worked out once (`advUnit`). The game screen never works the advice out while the clock runs (`shownAdvice`): it shows the last complete list and the clock gives the pass about 8 ms a frame (`advStep`), redrawing when it is complete. Every other caller (departments, actions, the test tools) gets a complete pass at once. A full pass at 70 ships is about half a second of work; before, it was done in one go each month and froze the screen for most of a second.
- **Cheaper advice**: the best line for a ship is kept for the month while the fleet's lines and the Line's standing are unchanged (`BL_CACHE`); the fare search tries every other step and then the steps either side of the best; the table's effect on the other lines is read off a line between two standings worked out once a pass (`svcOther`); a cached answer no longer throws away every ship's cached figures.
- **The chart**: ship markers move by a transform in pixels, written only when they change (`setSt`), instead of by `left` and `top`, which made the browser lay the page out again every frame; rival markers are redrawn ten times a second; the funnel smoke on a ship's drawing drifts only while the clock is stopped (an endless SVG animation repainted the ship panel every frame).
- **Clicks**: with more than 25 ships an action no longer works the advice out twice to find what it settled; the screen works it out over the next frames.
- **Frame-time readout** (Menu, Settings, Frame times): frames a second, and the milliseconds a frame spends on the simulation, the advice, the screen and the chart, with the slowest frame of the last second (`PERF`, `perfShow` in `js/clock.js`). The choice is kept in this browser.

Measured with `tools/perf.mjs` in a headless browser without a graphics card (which paints on the processor, so these are a floor), 70 ships at top speed: 49 to 57 frames a second on the main tabs and the slowest frame 33 to 133 ms, against 43 to 55 and about 750 ms (once a game month) in 0.35.7; the clock now keeps its full 4.2 game days a second.

## Decision record

Dated decisions about this page, newest first: date, decision, who decided. Dates are the release that recorded them.

- 2026-10-01: **War hire stays at the Blue Book rates** (Jason): KI-024 let ships be offered for war service at any time, and left the hire as it is, since it matches the Blue Book rates against the open market (0.37.1).
- 2026-10-01: **Rescue instead of game over** (Jason, KI-091): an insolvent Line gets a likely, not certain, rescue (banks or a rival before the 1920s, the Treasury after) with lasting costs; a second failure is final; no rescue after gross negligence. With a safety net the game may hit harder. Not built: a forced merger, and rival lines rescued by the same rules (0.37.0).
- 2026-10-01: **Large fleets are supported, not discouraged** (Jason, KI-090): steering the player away from big fleets was decided against. Instead: make them playable (KI-001), hand routine work to masters and departments (standing orders, an inbox of the owner's decisions only), run a fleet by line, and scale shore support with the fleet (0.36.0 to 0.36.5).
- 2026-09-29: **Floating the Line** (Jason, 0.31): an owner removed by the board, or bought out by a successful bid, ends the game keeping their shares; a white knight need not be British.
- 2026-09-29: **Stakes and control** (Jason, 0.30): a controlled rival trades on as a subsidiary under its own name and flag until merged; only the Line's own holding counts towards a stake, not the investment account's.
- 2026-09-29: **The share market** (Jason, 0.29): every rival line is listed in London, foreign lines included; the market is the rival lines plus eight companies next to shipping; the Line's own price waits for floating.
- 2026-09-28: **Rivals are real companies** (Jason, 1900 overhaul): the Trust is the International Ocean Combine, and the share market is safely ignorable through a broker.
- 2026-09-28: **Only going bust ends the game, and a negligence ending** (Jason, 1900 overhaul): a line that loses a ship through neglect, after warnings, can be wound up when the claims cannot be paid.
- 2026-09-28: **Money follows real history** (Jason, 1900 overhaul): the price index runs year by year (about 0.40 in 1900 against 1.00 in 1921), and the 1921 to 1939 game follows the real index too.
- 2026-09-28: **The clock** (Jason, 0.17.0): half the old speed (a year is about 20 minutes at 1x), with a new 14x at the old 7x; big events slow the clock, never pause it.
