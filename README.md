# Steerage & Saloon

A real-time shipping line management sim. You run the Morven Line from its Glasgow head office from January 1900, with one elderly emigrant ship and a mortgage, and no end date (in this world the liner trade never declined, so later decades are invented): open passenger lines and cargo trades, buy, refit and retire ships, hire masters, build up a shore establishment and head-office departments, and survive the rate wars of the emigrant years, the American trust, breakdowns, the US immigration quotas, the 1926 coal strike and the Depression.

The 1900 overhaul is under way (see `docs/overhaul/README.md`): 1900 to 1913 are written, with the 1912 disaster and the safety rules that follow it; from 1914 to 1920 the game holds the 1913 curves until the war and the bubble arrive in later releases; from January 1921 it carries on as the 1921 game.

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
| `js/silent.js` | Ships without wireless: reckoned positions, overdue notices, sightings and relays by passing ships, foundering, posted missing |
| `js/ledger.js` | Month-to-date accounts by category and by line |
| `js/sim.js` | The simulation: bookings and cargo per voyage, departures, calls, arrivals, breakdowns, yards and upgrades, crew morale, daily costs, month roll |
| `js/rivals.js` | Rival lines: fleets, the shared market on each route, price matching, and each rival's monthly decisions |
| `js/outside.js` | Outside work: piers, repair yards, hostels, booking agents and freight canvassers selling spare capacity to the rival lines |
| `js/trust.js` | The early years: rate wars between the lines before the 1908 conference, and the International Ocean Combine (formed 1902): its members, purchases, offers for the Line and the rate wars that answer a refusal |
| `js/prewar.js` | Speed and splendour, 1907 to 1913: the express liners and giants the great lines build, the 1907 panic, the 1911 seamen's strike and 1912 coal strike, the Blue Riband, and the Admiralty's terms for fast ships |
| `js/companies.js` | Rival lines as companies: accounts, borrowing, dividends, fleet renewal, distress sales, failure and the receivers, new lines |
| `js/naval.js` | Naval architecture: port limits, route weather, displacement, length, form and power, bunkers and range; the engineers' recommendation and report; fouling, port fit, seakeeping and masters' remarks in service |
| `js/yard.js` | Shipbuilding: purposes, hull forms, machinery, fittings, extras, builders and slips, prices, stage payments, orders and delivery; newer ships for the brokers |
| `js/facilities.js` | Public rooms and facilities (dining, shows, cinema, shops, pools, spa, winter garden, family rooms) with levels, venues, room, staff, appeal, winter draw and money spent aboard; refit equipment; the refit office window and the Marine Superintendent's picks |
| `js/state.js` | Game state, new game, save and load (browser localStorage) with migrations, save codes |
| `js/clock.js` | Real-time clock: pause, 1×, 3×, 7×, 14×, slowing on big events, and the frame loop |
| `js/map.js` | Chart rendering, pan and zoom, ship markers |
| `js/profile.js` | Procedural ship drawings: exterior and cutaway |
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
- **Demand** before 1921 comes from `preDemand(c, rk, m)`, a multiple of January 1900: steerage follows real immigration (`PRE_US` to New York, `PRE_CA` to Canada damped to the power 0.85, `PRE_AR` to the River Plate, and the US figure to the power 1.1 from Italy); first class grows 3.5% a year, second 5%, cruising 3%, cargo 3% (`cargoPre`). From 1914 to 1920 the 1913 level holds until the war years are written. From 1921 the 1921 game's history (`histLegacy`) carries on, joined to the curve so there is no step (`histAbs`). `histMod` divides by the level at the start, since markets are sized then; the anchors are cached per game in `H_CACHE`.
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
| `node tools/harness.js` | Plays the first fifteen years (1900 to 1914) headless under scripted strategies (idle, cautious, careful, advisor, expander, prudent, office, undercutter, liverpool), many seeds each, and prints survival, net worth by year, first-year profit, rate wars and profit by route. `careful` is the sensible owner the 1914 targets are set for: six months' running costs in hand, keeping its debt, less cash in hand, under a third of the fleet's value, buying only ships that should earn an eighth of their price a year, moving spare cash into government stock on rumours of a panic, moving or selling losers and worn-out ships |
| `node tools/harness.js advisor 20` | One strategy, 20 seeds |
| `node tools/companies.js [years] [seeds] [verbose]` | Plays the given years (default 40) headless with a plain expanding player who cannot go bust, and prints the rival companies year by year (ships, tonnage, lines, the biggest line's share, cash, debt), failures and new lines per decade, and checks that no line dominates, no trade lies empty and failures stay at a few a decade |
| `node tools/outside.js [years] [seeds] [sell]` | Gives the Line a full shore establishment, plays the given years (default 15) and prints what each place would earn a month from other lines every January, against its running cost and price; with `sell` every place sells, and it prints what each earned and the Line's own takings, for the trade-off |
| `node tools/routes.js [seed] [ship]` | What a ship (default the Morven; try "Kinross" or "Rio Negro") would earn per month on each route, every January and July, as the rivals evolve |
| `node tools/gen-chart.mjs` | Regenerates `js/chart-data.js` from Natural Earth (needs `world-atlas`, `topojson-client` and `d3-geo` installed) |
| `python tools/build-single.py` | Bundles the game into one HTML file in `dist/` (used for the claude.ai artifact) |

### Balance targets

Checked with the harness after any economic change. For the 1900 start (the overhaul's stage 1, finished in 0.23):

- A sensible owner (`careful`) has 3 to 6 ships in August 1914, and fewer than 1 in 5 such games go bankrupt before the war. At 0.24: 5 in 20 bankrupt (the 1907 panic, the 1908 slump and losses at sea; 5 in 20 too with the boats and the night watch switched off, so the extra one is the dice), median fleet 8, median net worth £89,000.
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
