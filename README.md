# Steerage & Saloon

A real-time shipping line management sim. You run the Morven Line from its Glasgow head office from January 1900, with one elderly emigrant ship and a mortgage, and no end date (in this world the liner trade never declined, so later decades are invented): open passenger lines and cargo trades, buy, refit and retire ships, hire masters, build up a shore establishment and head-office departments, and survive the rate wars of the emigrant years, the American trust, breakdowns, the US immigration quotas, the 1926 coal strike and the Depression.

The 1900 overhaul is under way (see `docs/overhaul/README.md`): 1900 to 1913 are written, with the 1912 disaster and the safety rules that follow it, and the Great War of 1914 to 1918, its economy and the war at sea; then the shipping boom of 1919 and 1920; from January 1921 it carries on as the 1921 game. A share market (0.29) runs alongside, where the Line can take stakes in its rivals and take them over (0.30).

It is a static browser game with no build step. Open `index.html`, or serve the folder with GitHub Pages (from the repo root; `.nojekyll` is included).

## Files

| File | What it holds |
|---|---|
| `index.html` | Page shell: header, chart, side panels |
| `css/style.css` | All styling, light and dark themes |
| `js/chart-data.js` | Generated Atlantic chart (North and South): land, graticule, ports, route polylines with calls, distances. Made by `tools/gen-chart.mjs` |
| `js/data.js` | The calendar (`YEAR0`, `ym(year, month)`, `M21`), and game data: routes and trades, commodities, classes, seasons, ships for sale, upgrades, captains' traits, shore property, departments, rivals, historical events, milestones |
| `js/helpers.js` | Dates, formatting, demand and slump modifiers, prices, refit costs, captains and per-ship modifiers |
| `js/economy.js` | The economy: the price level and inflation, panics and bank failures, called loans, government stock, excess profits duty, union claims and strikes, the rival combine, air competition, office overhead, ship fatigue, the safety policy and courts of inquiry |
| `js/lanes.js` | Sea lanes as a network: positions along any lane, and the passage a ship follows between two ports |
| `js/wireless.js` | Wireless and cable traffic: coast stations, positions, telegraphese, Morse |
| `js/emergency.js` | Emergencies: collision, ice, flooding, fire, illness, mutiny, piracy; severity; responders and salvage tugs; the master's questions and the owner's orders; diseases and port quarantine; the emergency window |
| `js/disaster.js` | Lifeboats (the legal scale and boats for all), the night wireless watch, the 1912 disaster (which ship, the strike, the rival's sinking and the wireless room, the aftermath page), the rules that follow it (the boats law of 1913, the London Convention of 1914, the southern track), the Board of Trade's inspections after a censure, and the negligence ending |
| `js/livery.js` | Liveries: the presets, the rivals' fixed colours, each ship's own paint, repainting, the colour chooser; the variety each ship is drawn with (her seed, or her design for sisters); the house flag; the card for a rival's ship |
| `js/war.js` | The Great War. Its economy: the outbreak, wartime passenger and freight curves, coal, wages and ship prices, the state's war-risk insurance, the Admiralty's reserve list and requisition (roles, hire, wear, return in 1919), clearing steerage for cargo, the closed Hamburg trade and interned German lines, Excess Profits Duty, and the outbreak page. The war at sea: attacks by raiders, submarines and mines and how they play out, the protections (convoy, speed, zigzag, dazzle, a gun, the night watch, lookouts), the state's war-risk scheme and the private top-up, losses on war service, the Lusitania-like sinking and the headlines, and the ship's War at sea panel. The 1919 and 1920 boom: ship and building prices, buyers' offers, speculative lines, and the reparations auction |
| `js/silent.js` | Ships without wireless: reckoned positions, overdue notices, sightings and relays by passing ships, foundering, posted missing |
| `js/ledger.js` | Month-to-date accounts by category and by line |
| `js/sim.js` | The simulation: bookings and cargo per voyage, departures, calls, arrivals, breakdowns, yards and upgrades, crew morale, daily costs, month roll |
| `js/rivals.js` | Rival lines: fleets, the shared market on each route, price matching, and each rival's monthly decisions |
| `js/outside.js` | Outside work: piers, repair yards, hostels, booking agents and freight canvassers selling spare capacity to the rival lines |
| `js/trust.js` | The early years: rate wars between the lines before the 1908 conference, and the International Ocean Combine (formed 1902): its members, purchases, offers for the Line and the rate wars that answer a refusal |
| `js/prewar.js` | Speed and splendour, 1907 to 1913: the express liners and giants the great lines build, the 1907 panic, the 1911 seamen's strike and 1912 coal strike, the Blue Riband, and the Admiralty's terms for fast ships |
| `js/market.js` | The share market: listed companies and their worth, prices from worth, mood and news, dealing and margin, dividends, the investment account with a broker or the Investment Office, stakes and control of rival lines (seats, control, merger, winding up, buying out), and the Shares view on the Finance tab |
| `js/companies.js` | Rival lines as companies: accounts, borrowing, dividends, fleet renewal, distress sales, failure and the receivers, new lines |
| `js/naval.js` | Naval architecture: port limits, route weather, displacement, length, form and power, bunkers and range; the engineers' recommendation and report; fouling, port fit, seakeeping and masters' remarks in service |
| `js/yard.js` | Shipbuilding: purposes, hull forms, machinery, fittings, extras, builders and slips, prices, stage payments, orders and delivery; newer ships for the brokers |
| `js/facilities.js` | Public rooms and facilities (dining, shows, cinema, shops, pools, spa, winter garden, family rooms) with levels, venues, room, staff, appeal, winter draw and money spent aboard; refit equipment; the refit office window and the Marine Superintendent's picks |
| `js/state.js` | Game state, new game, save and load (browser localStorage) with migrations, save codes |
| `js/clock.js` | Real-time clock: pause, 1×, 3×, 7×, 14×, slowing on big events, and the frame loop |
| `js/map.js` | Chart rendering, pan and zoom, ship markers |
| `js/profile.js` | Procedural ship drawings, exterior and cutaway, in each ship's own colours and with her own variations |
| `js/advice.js` | Head-office advice (Mr Ferguson and the departments), the shared action handler, and departments acting on their own advice |
| `js/design.js` | The drawing office window and the order book |
| `js/tutorial.js` | The first-year briefing |
| `js/times.js` | The times: the season, conditions in force, what is coming and the history so far |
| `js/ui.js` | Panels and tabs, rendered by patching the DOM in place |
| `js/main.js` | Input handling and start-up |

Scripts are plain (non-module) files loaded in the order in `index.html` and share one global scope, so the game also runs straight from disk.

## Releasing

Bump `GAME_VERSION` in `js/data.js`, change `?v=` on every script and stylesheet link in `index.html` to match (so browsers fetch the new files instead of cached ones), and add an entry to `CHANGELOG.md`.

## The calendar

Month 0 is January 1900 and day 0 is 1 January 1900. Name a month with `ym(year, month)` (month 0 is January), never a bare number. History written for the 1921 game counts from `M21` (January 1921) inside a few functions in `helpers.js`; `tOfM(m)` gives a day in a month, and `yearOfM(m)` the fractional year. The game records where it started in `S.m0` and `S.t0`.

## The 1900 start

A new game starts in January 1900 (`START`). Games begun in January 1921 by 0.19 to 0.21 keep their rules: `newCal()` is false for them, and every change below applies only when it is true.

- **Prices** follow the real UK price level year by year (`PI_YEAR`, the ONS long-run index rebased to 1921 = 1, from 0.398 in 1900), interpolated monthly by `piAt(m)`; after 1940 three per cent a year. Tables stay written in 1921 money and are scaled by it, as before. A new game begins with the price index already applied: £7,000 in the bank, a £16,000 mortgage.
- **Demand** before 1921 comes from `preDemand(c, rk, m)`, a multiple of January 1900: steerage follows real immigration (`PRE_US` to New York, `PRE_CA` to Canada damped to the power 0.85, `PRE_AR` to the River Plate, and the US figure to the power 1.1 from Italy); first class grows 3.5% a year, second 5%, cruising 3%, cargo 3% (`cargoPre`). From 1914 to 1920 the 1913 level is scaled by the war and the boom (`warPax`). From 1921 the 1921 game's history (`histLegacy`) carries on, joined to the underlying curve with no step (`histAbs`, which takes `preDemand` raw at December 1920, so the 1920 emigrant rush does not carry on). `histMod` divides by the level at the start, since markets are sized then; the anchors are cached per game in `H_CACHE`.
- **Coal** before 1921 follows the real export price against the price level (`PRE_COAL`): dear in the 1900 boom, cheap by 1910.
- **The start**: `START_SHIP`, the 1881 SS Morven (4,600 tons, 12.5 knots, 1,050 steerage berths). The brokers offer ships built before the date (the `TEMPL` list, with six 1880s and 1890s ships added; `from` keeps the ex-German Kronberg back until 1921) and generated ships, smaller and slower the older they are (`shipEraGrt`, `shipEraKnots`).
- **Rival fleets** are sized for their build year with the same functions, and pre-war liners carry far more steerage to the ton (`RIVAL_KIND`). In 1900 pleasure cruising is one Meridian ship on each cruise (`RIVAL_START_1900`); the cruises to nowhere open only in 1920 (`routeOpen` checks `from`). A rival's new ship takes 10 to 18 months to build (six to answer an interloper), held in `S.rorders`, and before August 1914 the lines add tonnage only when loads run 30% above their usual (12% after), so a boom leaves the trades short of berths for a while.
- **Technology by date**: turbines from 1905 (`MACHINES.turb.from`), geared turbines from 1911, oil firing from 1919 (`OIL_FROM`, for new building, conversions and the advice), the biggest slip growing from 20,000 tons in 1900 to 50,000 by 1911 (`slipMaxYear`). Wireless is dear before 1911 (`wirelessNovelty`, four times its later price in 1900), only ships built from 1911 come with it, and the mails need it only from July 1911 (`wirelessRule`, `mailShip`).
- **Ellis Island** (`usInspection`, before 1921): a head tax on every immigrant landed at New York ($1, $2 from 1903, $4 from 1907, at $4.86 to the pound), and about 2 in 100 refused and carried home at 60% of the fare plus a fine for the diseased; half as many from a port with the Line's hostel.
- **Booking agents** lift steerage 12% on the routes they serve before August 1914 (`agentSteer`), 7% after.
- **Rival calibration** (`coRef`, and `load0` in `marketFor`) is set from the game's first year.
- **Overdue ships**: the office plans on the passage her schedule allows (`plannedSpeed`, from the leg worked out at sailing) and posts a silent ship overdue only after three days, or a quarter of the passage on a long one. Before 1911 few ships have wireless, so this matters far more than it did.
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
- **The 1912 disaster** (on the 1900 calendar only): between late March and early May 1912 one giant of 40,000 tons or more on the North Atlantic is lost. `disFit` scores how badly a ship is run (few boats for a full ship, drills, speed, morale and deck crew, no night watch, the master); the rival's Hyperborean scores `RIVAL_FIT` (6.1), so the Line's giant is chosen only if she is run as badly or worse, and must be in mid-ocean. The way in follows where she is: ice at night off the Grand Banks, a collision in fog on the approaches, or a derelict in open water. She always sinks, in about two and a half hours; nobody reaches her in time.
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
- **Passengers** (`warPax`, applied in `preDemand`): steerage to about a tenth of the pre-war trade and first class to about three tenths (less once America is in the war in April 1917), over two or three months; the southern trades keep more cabin travel. Reservists crowd eastbound steerage in August and September 1914 (`warReturn`). Back to the pre-war trade over the year after the armistice.
- **Freight** (`warFreight` in `cargoMod`, `warCargoVol` on the cargo offered): rates up to about 1.3 times their pre-war worth over and above the rise in prices, held down from 1917 when the Ministry of Shipping controls them; about a third more cargo is offered, so holds fill.
- **Costs**: coal (`warCoal`) and wages (`warWage`) climb over prices; every ship still trading pays the state's war-risk insurance, 0.8% to 2% of her value a month (`warInsCost`); second-hand ships fetch up to 1.8 times their pre-war worth over prices (`warShips` in `shipMkt`). The brokers have a ship now and then until 1917, and none after.
- **No building**: no new orders (`warNoBuild`), no keels laid, and ships already on the stocks progress at a quarter of the pace. The rival lines order, renew and found nothing in the war.
- **Rivals** (`warRivalF`): the German lines' ships lie in neutral ports (no trade, a tenth of their costs, back at half strength from 1920); British, French and Italian lines lose a growing share of their ships to their states, which carry those ships' costs and pay their hire; the American lines grow while neutral. Nobody sells up or fails while the war lasts.
- **The reserve list and requisition**: from October 1912 the Company tab lets you put ships on the Admiralty's reserve list. In the war the state takes a growing share of the fleet (`REQ_SHARE`: 15% in 1914, 30% in 1915, 45% in 1916, 75% in 1917 under the Liner Requisition Scheme, 85% in 1918). Admiralty-terms ships go first, then ships on the list. A line with ships on the list is asked to choose (it has a month, under Needs attention) and is paid 15% more; otherwise the biggest and fastest are taken. Roles (`reqRole`): armed merchant cruiser, hospital ship, troopship or transport. The state pays her crew, coal and insurance and a net hire of 0.30 to 0.40 a ton a month at the day's prices (`reqHire`, ledger `charter`); she loses about 1.2% condition a month and ages faster, and war service earns the Line standing (more for hospital ships). Ships come home from March 1919, with 0.9 a ton towards their refit.
- **Clearing the steerage** (`warcargo`, `uncargo` yard jobs): steerage and tourist berths come out for about 1.1 and 1.9 tons of cargo each; they go back after the war for the same price. The Marine Superintendent advises it when it pays.
- **Excess Profits Duty** (`epdJanuary`): each January the year's profit is recorded (`S.annual`); for 1914 (from August) to 1920 the Treasury takes 50%, 50%, 60%, 80%, 80%, 40% and 60% of the profit above the standard: the average of 1911 to 1913, or 6% of the Line's net worth at the outbreak if more, carried forward at the day's prices.

## The Great War: the war at sea (`js/war.js`, 0.27)

- **Attacks** (`warRoll`, at each sailing): German raiders on the southern trades from August to November 1914; mines off the home ports; submarines from February 1915. The danger by period (`warThreat`): 0.3 in 1914, 0.45 in 1915, 0.6 in 1916, 3.0 from February to July 1917 (unrestricted submarine warfare), 1.8 to the end of 1917, 1.1 in 1918. A crossing's chance of an attack (`warAttackP`) is 4% times that, by route (the Mediterranean 1.4, the North Atlantic 1, West Africa and the Plate 0.6, the Caribbean 0.3) and by passage length. Of attacks, 15% are mines, 15% a ship torpedoed nearby, 70% a submarine.
- **Playing it out**: each is an emergency (`EMERG.uboat`, `nearby`, `raider`, `torpedo`, `mine`). Sighting a submarine, the master asks: run, zigzag, hold her course, open fire (with a gun), or ram her (if she surfaced close ahead: a win pays a reward and brings fame). A ship torpedoed nearby: stop for her people (standing, and 30% of the time the submarine is still there) or keep going as ordered. A raider: run, or stop and surrender (everyone is landed safely; she is sunk). A hit (`warHitP`, about 75% if she holds her course unprotected) becomes a torpedo flooding emergency, fought like any other; about four in five torpedoed ships are lost.
- **Protections**: convoy from June 1917 (attacks ×0.3, hits ×0.7, a fifth slower), speed (20 knots and up: attacks ×0.3, hits ×0.6), zigzagging (attacks ×0.85, hits ×0.75, 7% slower), dazzle paint from March 1917 (hits ×0.82), a gun and naval gunners for lines with the Admiralty's goodwill (hits ×0.75, and the choice to open fire), the night wireless watch (attacks ×0.8), and the deck crew's skill (lookouts). The ship's panel shows her risk at the month's rate and each protection; the Marine Superintendent advises them.
- **Losses**: no court sits on a ship the enemy sank. The state's war-risk scheme pays four fifths of her value (`warClaim`); a private top-up on her panel (`sh.warTop`) pays the rest, for a premium that rises after every loss in the fleet. Ships on war service are lost too (`reqLoss`), and the state pays an agreed value close to her pre-war worth. No replacement can be built until the war is over.
- **Headlines**: the raiders hunted down in December 1914; the war zone in February 1915; the sinking of a rival express liner off Ireland in May 1915, with Americans lost; unrestricted submarine warfare in February 1917; convoys in June 1917.

## The bubble and the handover, 1919 and 1920 (`js/war.js`, 0.28)

- **Prices**: second-hand ships (`warShips` in `shipMkt`) climb from the armistice to 2.6 times their normal level over prices in March 1920, then fall to 1.8 in November, 1.3 in December and 1 from January 1921. New ships cost more from December 1918 (`warBuild`, applied in `designStats`): 1.3 times, 1.6 at the top in April 1920, 1.2 by December. A ship built at boom prices is worth her real cost (`o.wb` divides it out of her `base`), so she loses the boom's premium in the crash. Freight (`warFreight`) peaks at 1.6 in March 1920 and is back to normal by December; in 1920 steerage on the North Atlantic and from Naples runs 1.3 times the pre-war trade (the rush before the American quotas).
- **Offers** (`bubbleMonth`, from February 1919 to September 1920): each month about 7 in 100 of the Line's ships draw an offer of 1.1 to 1.4 times her market value, open for two months (`S.war.offers`, under Needs attention). Accepted (`offerTake`), she is sold now or when she reaches port, at the offered price (`sh.saleAmt`, paid by `exitShip`).
- **Speculative lines**: about 15 in 100 months a new line is floated (`coQueue` with `spec`), at boom prices (`warShips`), three quarters borrowed and with little cash. Few survive 1921.
- **Reparations** (`reparations`, June 1919): German liners of 8,000 tons and more go to the three biggest Allied liner lines, except the two largest, which the Reparations Commission auctions (`S.war.auction`, the Buy and build tab). Sealed bids at 0.8, 1 or 1.3 times the value, three tenths in hand; the bids close in October (`auctionClose`) against an Allied bid of 0.85 to 1.35 times the value. A winning bid brings her to Southampton at 72% condition with half her price mortgaged; a losing one sends her to the biggest Allied line.
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

Character: `aggr` (how hard it fights and how readily it builds), `prestige` (how cabin passengers rate it) and `lev` (the share of its fleet's value it will borrow against). A line builds where loads are strong and it can pay (`coCanPay`: cash above a three-month reserve plus borrowing room), grows more slowly once it holds a quarter of all rival tonnage, repays when flush, pays a January dividend and renews its oldest ship when it can. When short and the bank will lend no more it sells its oldest ship, to another line or abroad. It fails (`coFail`) when its net worth goes below nothing, its overdraft passes 12% of its fleet's value, or it has no ships: up to two ships go to the Morven Line's brokers as bargains, others to lines with money (at most four each), the rest to scrap or abroad. A new line (`CO_POOL`, then generated names) is queued 4 to 12 months later, and sooner for a trade left with no rival ships; promoters wait while a slump is deep. Lines founded in play are saved in `S.genCos` and put back in the tables on load.

## The share market (`js/market.js`, 0.29)

Found on the Finance tab, under Shares. Nothing in it is needed to play: the market keeps its own dice (`mrand`, seeded from the game's rival fleet), so a game that never touches it plays out exactly as it would without it (`MKT=0 node tools/harness.js careful 10` prints the same as without `MKT=0`).

- **Listed**: every rival line, from the start or its founding (the lines floated in the 1919 and 1920 boom too), and eight companies next to shipping (`MK_REL`): two shipbuilders (on the order books, the Admiralty's work in the war, the boom and the slumps), steam coal (on the bunker price), oil (from 1909), docks (on cargo), the boat-train railway (on passengers), a marine insurer, and an aircraft maker from 1919. All are dealt in London.
- **What a company is worth** (`mkFund`): a line, half on its ships less its debts (cash counting up to three tenths of its fleet's value, since a hoard never reaches the shareholders) and half on eight years' earnings, never below a quarter of its ships; the others, ten years' earnings at a normal level times what drives them. The market smooths it (a fifth of the change a month). Growth beyond the rise in prices is paid for partly with new shares (the exponent 0.4 in `marketMonth`), so a holder keeps a little over half of it; a line the Line controls issues none.
- **The price**: worth a share × the mood × the news × two drifts of its own, one that fades in months and one that takes a decade. The mood (`mkMoodBase`) falls in a panic (the 1907 panic and the random ones from 1936), in the war (War Loan pays better, free of risk), in the 1921 slump and the Depression, with the Wall Street crash of October 1929 ahead of it; it rises in the 1919 and 1920 boom and the late twenties. The news: the 1912 disaster's line loses a third and the insurer and the builder fall; the German lines halve at the outbreak; a line the Combine buys jumps a fifth; a line reconstructed by its bankers loses two fifths; the Blue Riband adds a little; a line in a rate war trades 6% lower. A line that fails is struck off and its shares are written off.
- **The Stock Exchange closes** from the end of July 1914 to January 1915; nothing can be bought or sold and prices stand still.
- **Dealing** (`mkBuy`, `mkSell`): 1% to buy (commission and stamp duty), 0.5% to sell; an order moves the price against itself by 0.6 times the share of the company bought, and the move fades with the quick drift. Gains and losses on sales, dividends and margin interest go to the ledger as Shares and dividends.
- **Margin**: the broker lends half of a purchase at 5.5% (`MK_LOAN_RATE`). When the loan passes three quarters of the shares' value he calls for money (under Needs attention); a month later, if the loan is still over three fifths, he sells enough of every holding to bring it back to half. A sale pays the loan down in proportion.
- **Dividends**: a line pays once a year the dividend its directors vote in January out of its own cash (`coYearEnd`: half its profit, seven tenths for a heavy borrower, while it keeps two reserves in hand), reaching the shareholders in February; the companies next to shipping pay half their earnings, quarterly (0.30; in 0.29 a line's dividend was notional).
- **Net worth and the bank**: shares at the market, less the margin loan, count in net worth, and half of that counts towards what the bank will lend.
- **The investment account** (`mkFundOpen`): money and a brief (preserve 30% in shares, balanced 55%, growth 85%, the rest in government stock) for a City broker, at 1% a year of what he manages, or for the Investment Office. Each quarter the manager sets the share of shares by the brief, leaning a little against the mood by his skill, picks seven companies (eight for growth) by price against worth (read through noise, less for a better manager), keeps off lines in trouble and lines floated in the last two years, and reports. The account can be paid into, drawn on or closed at any time (selling at the market).
- **The Investment Office** (`mkOfficeOpen`): £6,000 (1921 money) to open and a head and three clerks a month. It shows each company's price against its worth, advises each quarter (cheap companies, dear holdings, the mood, the margin loan) and can run the investment account with no broker's fee. Its head's ability, from muddled to first-rate, sets how well it reads worth and how well it runs the account.

## Stakes and control (`js/market.js`, 0.30)

A stake in a rival line brings powers, shown under its card on the Shares view. Only the Line's own holding counts, not the investment account's. A controlled line stays a company of its own, under its own name and flag.

| Stake | What it gives |
| --- | --- |
| 20% (`MK_SEAT`) | A seat on its board. On a trade where it is the leading rival, tension over the Line's fares builds half as fast. Crossing a fifth is noticed: the price rises 8% on bid talk |
| Over 50% (`MK_CTRL`) | Control. Its dividend (none, normal half of profit, generous nine tenths, voted each January), its strategy (retrench, steady, expand: its aggression ×0.6, 1 or 1.35), keeping it off the Line's trades (it moves its ships off within the month and orders none for them), ending its rate wars, and buying its ships at their book value. On a trade it leads, tension over the Line's fares does not build and no rate war starts. It issues no new shares over the Line's head |
| 75% (`MK_SPECIAL`) | Special resolutions. Merge: the other shareholders are paid their share of what it is worth; its ships join the Line (valued as its books had them, in its colours, on their trades), its trades open, its cash and debts become the Line's, and ships it had on order are sold back to the builders at four fifths. Wind up: its ships are sold at seven tenths of their value, its debts paid, and the Line gets its share of the rest; a new line is founded for its trades in six to fifteen months |
| 90% (`MK_BUYOUT`) | The rest bought out: at a quarter over the market before the Companies Act of November 1929, at the market after |

- Buying a share of the company outright (1%, 5% or 10% on its card) takes from what is left on the market, and the price moves by 0.6 times the share of that bought, up to half.
- The Combine holds three fifths of each member and will not sell, so no member can be more than 40% held.
- The Company tab's card for each rival line shows the Line's stake.

## Outside work

Each pier, repair yard, emigrant hostel, booking agency and freight canvasser the Line owns has a switch in `S.shore.sell` (keys such as `pier:NYC`, `yard:GLA`, `hostel:LIV`, `agency:british`, `fagent:africa`; absent means own use only, the default). Every month `outsideMonth` (called from the rivals' month with that month's `routeStats`) works out for every place, selling or not, what it would earn (`S.shore.est[key]`, shown on the Shore tab), and for those selling books the takings to the ledger as `shorein` and keeps twelve months in `S.shore.earn[key]`. The rival companies pay out of their cash, in proportion to their use.

| Place | Capacity | What it earns | What the rivals gain |
|---|---|---|---|
| Pier | 10 berthings a month, less the Line's own calls | 40% of rival calls up to the spare berths, at `OUT_PIER_FEE` (0.007 a gross ton) | The dues they save less the fee |
| Repair yard | 3 berths, less the Line's ships in the yard | `OUT_YARD_RATE` (£550) a spare berth-month, 35 to 90% busy with the rival fleet's size, less in a slump | 15% of the bill |
| Hostel | 3,000 beds a month, less the Line's own emigrants | 35% of rival emigrants sailing from the port, up to the spare beds, at `OUT_HOSTEL_FEE` (£0.12) | Steerage appeal 6% higher on routes calling there (`outAppeal`) |
| Booking agents | Not limited | `OUT_AGENCY_COMM` of rival passenger takings on routes calling the region | Steerage 3.5%, cabins 1.5% on those routes |
| Freight canvassers | Not limited | `OUT_FAGENT_COMM` of rival cargo takings on routes calling the region | Cargo weight 4% on those routes (`outCargo`) |

Money is in 1921 pounds, scaled by the price index. Head office suggests selling spare berths at piers and yards (which cost the fleet nothing) once they would earn £400 a month; hostels and agents are left to the player, since they help rivals on the Line's own routes.

## Saves

The game saves itself to the browser's localStorage under `steerage-saloon-v3`, so each site or folder the game is opened from keeps its own save.

Save codes (Company tab) carry a game anywhere: the state as JSON, trimmed news, deflate-compressed and base64url-encoded, prefixed `SS1.z` (or `SS1.j` uncompressed where the browser lacks CompressionStream). A save link is the page URL with `#save=<code>`; opening it loads the game and clears the hash so a reload does not reload the old save. Codes go through the same migration as localStorage saves, so old codes keep working.

## Tools

Run from the repo root with Node (and Python for the bundler).

| Command | What it does |
|---|---|
| `node tools/harness.js` | Plays the first fifteen years (1900 to 1914) headless under scripted strategies (idle, cautious, careful, advisor, expander, prudent, office, undercutter, liverpool), many seeds each, and prints survival, net worth by year, first-year profit, rate wars and profit by route. `careful` is the sensible owner the 1914 targets are set for: six months' running costs in hand, keeping its debt, less cash in hand, under a third of the fleet's value, buying only ships that should earn an eighth of their price a year, moving spare cash into government stock on rumours of a panic, moving or selling losers and worn-out ships, and not buying while ships fetch over 1.3 times their normal price |
| `node tools/harness.js advisor 20` | One strategy, 20 seeds |
| `END=1920 node tools/harness.js careful 20` | Plays on to the given year (default 1915) and prints the growth of net worth over the war; from 1921 on, also the handover (lines solvent in 1914 still trading, their fleets, net worth over the crash) |
| `DEBUG=1 node tools/harness.js careful 40` | Also prints the last news of each bankrupt game; `DEBUG=2` prints a half-yearly trace of its cash, debt and fleet and its big events |
| `node tools/stakes.js [seeds]` | Takes over a rival line step by step in each seed (default 4) and checks each stake gives exactly its powers: none under a fifth, a seat at a fifth, control over half (dividend, strategy, keeping off the Line's trades, ending its rate wars, buying a ship at book value), a merger at three quarters whose accounts add up, the Combine's 40% cap, winding up, and buying out at nine tenths before and after the 1929 Act |
| `node tools/market.js [years] [seeds]` | Plays from 1900 (default 40 years, 6 seeds) with the Line kept afloat, runs three broker accounts side by side (preserve, balanced, growth) from January 1901 and a buy-and-hold of every company, and prints each against government stock at key years, each account's worst fall in the 1907, 1921 and 1930s slumps, and the shipping share index against what the lines are worth. Checks that the balanced account beats stock over the run, every account loses in some slump, and shares fall below worth in the slumps and recover |
| `node tools/companies.js [years] [seeds] [verbose]` | Plays the given years (default 40) headless with a plain expanding player who cannot go bust, and prints the rival companies year by year (ships, tonnage, lines, the biggest line's share, cash, debt), failures and new lines per decade, and checks that no line dominates, no trade lies empty and failures stay at a few a decade |
| `node tools/outside.js [years] [seeds] [sell]` | Gives the Line a full shore establishment, plays the given years (default 15) and prints what each place would earn a month from other lines every January, against its running cost and price; with `sell` every place sells, and it prints what each earned and the Line's own takings, for the trade-off |
| `node tools/routes.js [seed] [ship]` | What a ship (default the Morven; try "Kinross" or "Rio Negro") would earn per month on each route, every January and July, as the rivals evolve |
| `node tools/gen-chart.mjs` | Regenerates `js/chart-data.js` from Natural Earth (needs `world-atlas`, `topojson-client` and `d3-geo` installed) |
| `python tools/build-single.py` | Bundles the game into one HTML file in `dist/` (used for the claude.ai artifact) |

### Balance targets

Checked with the harness after any economic change. For the 1900 start (the overhaul's stage 1, finished in 0.23):

- A sensible owner (`careful`) has 3 to 6 ships in August 1914, and fewer than 1 in 5 such games go bankrupt before the war. At 0.25.1, over 40 seeds (20 swing by two either way): 4 in 40 bankrupt, median fleet 7, median net worth £59,000 in 1914. Before 0.25.1 it was 12 in 40, mostly the starting ship lost in a winter gale and judged too small for her route, and the 1907 panic's called loans.
- Through the war (`END=1919 node tools/harness.js careful 20`): 2 in 20 bankrupt. Net worth in January 1919 about 7 times January 1914 in the money of the day, 3.2 times at 1914 prices, and 1.9 times at 1914 prices with its ships valued at their pre-war worth (the target, about double; the rest is the wartime ship market, which the 1921 crash was to take back, but at 0.28 net worth in January 1921 is still about 5 times January 1914 at 1914 prices: see `docs/overhaul/BALANCE.md`). Losses: about 1 ship in 4 of those in the fleets over the war when trading unprotected (`PROT=0`), about 1 in 9 trading with every protection the careful owner can get (1 in 6 counting ships lost on war service). Autumn 1914 fares on the Morven are about 84% down on 1913 (target 60% to 80%).
- Through the boom and the crash (`END=1922 node tools/harness.js careful 20`, 0.28): all 18 lines solvent in 1914 still trading in 1922 (target at least 7 in 10), with a median fleet of 8 in 1919 and 1920 and 9 in 1921 (target 3 to 8), and net worth in January 1921 at 0.7 of January 1920. A ship held from 1913 is worth about 2.3 times her 1913 worth in 1913 money at the top and loses about three fifths by 1921 (target two to three times, half to two thirds lost).
- The share market (`node tools/market.js 40 6`, 0.29): over 1901 to 1940 a broker's account against the same money in government stock ends about 1.6 times (preserve), 1.6 (balanced) and 1.8 (growth), with falls from its high of about a fifth, two fifths and a half in 1907, and a quarter, a half and seven tenths in the 1930s (0.30). Buying every company in 1901 and holding ends at about 0.8 of stock, since some fail. Shipping shares fall to about 0.65 of worth in the 1907 panic and 1932, and are back to worth within a few years. An untouched market changes nothing.
- Owners who do not adapt to the war go under: `idle` 11 in 20 and `cautious` 7 in 20 by 1920, nearly all in 1915 and 1916 with steerage ships and no cargo. Head office advises clearing the steerage.
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
