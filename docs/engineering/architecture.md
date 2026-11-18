# Architecture

Lifecycle: **living**

How the code of Steerage & Saloon is put together, as it is at 0.39.8. Search this page for the files you need; do not read it whole.

## The shape today

A static browser game in plain JavaScript with no build step: about 1.2 MB of code in 37 scripts under `js/` (about 10,000 long lines; `chart-data.js` alone is 290 KB of generated chart), one style sheet and `index.html`. The tools in `tools/` run the same scripts headless in Node.

- **One global scope.** The scripts are not modules. `js/boot.js` loads them in the order of `BOOT_FILES`, and every script sees every other script's names. A script that uses a name must load after the one that defines it.
- **No layering yet.** The rules (economy, simulation, rivals, markets) and the screen (panels, map, input) share that scope, and some rules files also draw. Splitting the core from the screen is #6; moving to ES modules is #5.
- **The state is one object,** `S`, made by `newGame()` and saved whole (`js/state.js`).
- **A formatter, but no test runner yet.** `package.json` holds the tooling only, Prettier so far (#3); the game itself needs no install or build. The checks are the Node scripts in `tools/`, run one by one (`docs/engineering/contributing.md`, "Before pushing"). The rest of the tooling arrives with #5 and #6.

## Loading

Scripts are plain (non-module) files loaded in the order given by `BOOT_FILES` in `js/boot.js` and share one global scope, so the game also runs straight from disk. `index.html` loads `js/boot.js` with the time in its address, so it is never taken from a browser's cache; `boot.js` then loads the style sheet and every script at its own `BOOT_VER`. A browser holding an old copy of `index.html` therefore cannot mix files of two versions (0.38.0; before, a cached page could load an old `economy.js` beside a new `sim.js`, and the game failed with "Can't find variable").

## Where things live

### The game

| File | What it holds |
|---|---|
| `index.html` | Page shell: header, chart, side panels; loads `js/boot.js` |
| `js/boot.js` | The loader: the version and the list of scripts, in order (0.38.0) |
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
| `js/moves.js` | Advanced moves: dawn raids, tender offers, proxy fights, short selling and squeezes, bear raids, the targets' answers, and the rivals' raids, proxy fights and bear raids against a floated Line |
| `js/float.js` | Floating the Line: the float, founders' shares, the board and its targets, removal, dividends to the public, buybacks, bids for the Line and the defences, and the endings |
| `js/market.js` | The share market: listed companies and their worth, prices from worth, mood and news, dealing and margin, dividends, the investment account with a broker or the Investment Office, stakes and control of rival lines (seats, control, merger, winding up, buying out), and the Shares view on the Finance tab |
| `js/companies.js` | Rival lines as companies: accounts, borrowing, dividends, fleet renewal, distress sales, failure and the receivers, new lines |
| `js/naval.js` | Naval architecture: port limits, route weather, displacement, length, form and power, bunkers and range; the engineers' recommendation and report; fouling, port fit, seakeeping and masters' remarks in service |
| `js/yard.js` | Shipbuilding: purposes, hull forms, machinery, fittings, extras, builders and slips, prices, stage payments, orders and delivery; newer ships for the brokers |
| `js/facilities.js` | Public rooms and facilities (dining, shows, cinema, shops, pools, spa, winter garden, family rooms) with levels, venues, room, staff, appeal, winter draw and money spent aboard; refit equipment; the refit office window and the Marine Superintendent's picks |
| `js/crew.js` | A ship's company in three departments (deck, engine room, catering): manning, pay, training, morale and skill, under named officers the owner appoints |
| `js/state.js` | Game state, new game, save and load (browser localStorage) with migrations, save codes |
| `js/clock.js` | Real-time clock: pause, 1×, 3×, 7×, 14×, slowing on big events, and the frame loop |
| `js/map.js` | Chart rendering, pan and zoom, ship markers |
| `js/profile.js` | Procedural ship drawings, exterior and cutaway, in each ship's own colours and with her own variations |
| `js/advice.js` | Head-office advice (Mr Ferguson and the departments), the shared action handler, and departments acting on their own advice |
| `js/design.js` | The drawing office window and the order book |
| `js/tutorial.js` | The first-year briefing |
| `js/times.js` | The times: the season, conditions in force, what is coming and the history so far |
| `js/fleetmgr.js` | The Fleet Manager window: every ship in one table, five views of columns, sorting, filters and actions on ticked ships |
| `js/devlog.js` | What's new and coming next: the player-facing release summaries (`DEVLOG`) and plan (`DEVPLAN`), shown from the Menu |
| `js/ui.js` | Panels and tabs, rendered by patching the DOM in place |
| `js/main.js` | Input handling and start-up |

### Tools

All run from the repo root with Node (and Python for the bundler).

| Command | What it does |
|---|---|
| `node tools/harness.js` | Plays the first fifteen years (1900 to 1914) headless under scripted strategies (idle, cautious, careful, advisor, expander, prudent, office, undercutter, liverpool), many seeds each, and prints survival, net worth by year, first-year profit, rate wars and profit by route. `careful` is the sensible owner the 1914 targets are set for: six months' running costs in hand, keeping its debt, less cash in hand, under a third of the fleet's value, buying only ships that should earn an eighth of their price a year, moving spare cash into government stock on rumours of a panic, moving or selling losers and worn-out ships, and not buying while ships fetch over 1.3 times their normal price |
| `node tools/harness.js advisor 20` | One strategy, 20 seeds |
| `END=1920 node tools/harness.js careful 20` | Plays on to the given year (default 1915) and prints the growth of net worth over the war; from 1921 on, also the handover (lines solvent in 1914 still trading, their fleets, net worth over the crash) |
| `DEBUG=1 node tools/harness.js careful 40` | Also prints the last news of each bankrupt game; `DEBUG=2` prints a half-yearly trace of its cash, debt and fleet and its big events |
| `node tools/stakes.js [seeds]` | Takes over a rival line step by step in each seed (default 4) and checks each stake gives exactly its powers: none under a fifth, a seat at a fifth, control over half (dividend, strategy, keeping off the Line's trades, ending its rate wars, buying a ship at book value), a merger at three quarters whose accounts add up, the Combine's 40% cap, winding up, and buying out at nine tenths before and after the 1929 Act |
| `node tools/float.js [seeds]` | Checks the rules of floating in fresh games (default 3 seeds): a private Line cannot be bid for; a float raises what it shows; a minority board cannot remove the owner and a majority board can; a buyback to the majority ends the risk and ends a bid; founders' shares outvote a rich bid; an undefended rich bid against an unhappy board wins; and each defence works |
| `FLOAT=0.6 END=1925 node tools/harness.js careful 10` | The careful owner floats that share of the Line from 1906 and plays on without defending; prints how many were removed by the board, how many taken over, bids per game, and the board's confidence at the end |
| `node tools/moves.js [seeds]` | Tries each advanced move in fresh games (default 6 seeds): a dawn raid and selling straight back (a loss), tenders at 50% and 20% over, a proxy fight, shorts that gain, are bought in, and lose if closed at once, a bear raid's war, short plus bear raid against the short alone (it must not always pay), and a raider's proxy fight against a floated Line with and without founders' shares |
| `node tools/exploits.js [seeds]` | Sets up each loophole the test players found (default 3 seeds) and checks it stays closed: fares far above the rate, alone on a route or against rivals; a dear class hiding a cheap one; closing a line to end a rate war; overdraft interest; property ashore and net worth; the bank's limits on second-hand ships, and in a panic; selling a bargain on the same day; mail on a crowded line; the Admiralty's subsidy and yards; rival shares below break-up value and buying and merging a cash-rich line. Prints PASS or the failures |
| `node tools/world.js [seeds]` | Plays a kept fleet of six from 1900 to 1927 in each seed (default 6) and checks the world stays consistent: no two ships afloat or rival lines share a name, rival ships do not fill the war's news moving between closed trades, silent ships are overdue but safe no more than about once in two ship-years, and the January fare revision does not add a year's inflation to a fare set in December |
| `node tools/perf.mjs <bundled html> [ships]` | Frame times: opens a bundled build (`python3 tools/build-single.py /tmp/ss.html`) in headless Chromium with a fleet of the given size (default 70), runs the clock at top speed on each main tab and prints frames a second and the slowest frames (needs Playwright; set `PLAYWRIGHT` to its module path if it is not found) |
| `node tools/desk.js [seeds] [ships]` | Plays a year with a big fleet (default 70 ships) and every department acting, and checks what reaches the owner: the share of the advice left on the desk, which emergencies ask under Auto, and that a standing order turned off returns its advice to the owner |
| `node tools/rescue.js [seeds]` | Drives a Line into foreclosure in each seed (default 3) with the chance of rescue forced: checks it is rescued and keeps trading, the banks' and the Treasury's terms hold, the loan counts against net worth, the mortgage moratorium, no raid on a rival holding a stake, a second failure final, and no rescue after gross negligence |
| `node tools/warprofit.js [seeds]` | Keeps a fleet of mixed and cargo ships trading from 1911 to 1921 (default 4 seeds) and checks a trading ship's return on her 1913 worth year by year through the war and the boom, that Excess Profits Duty is charged, and that a ship sold in the 1920 boom pays duty on the gain |
| `node tools/disasters.js [seeds]` | Plays a kept fleet from 1900 to 1945 (default 6 seeds): one great disaster in each decade from the 1920s, several kinds, the Line's ships hit in a minority; an isolation hospital slows sickness and shortens quarantine; every passenger ship has a surgeon |
| `node tools/forecast.js [seeds]` | Forecasts every ship on her own line at five dates (1902 to 1928) and compares the next twelve months' takings and costs; checks the median of actual over forecast is within a fifth overall and a third by kind of ship |
| `npm run format`, `npm run format:check` | Prettier (#3): formats, or checks the formatting of, everything except `index.html`, the Markdown and the gitignored folders (`.prettierignore`). Settings in `.prettierrc.json`: 120 columns, single quotes, trailing commas, LF. Needs `npm install` once. |
| `node tools/lint.js` | Finds code hidden inside a `//` comment on a long line (a comment added mid-line swallows the code after it; it stopped the strikes and the 1912 disaster in 0.35.4). Run it before every release |
| `tools/play-brief.md` | The brief given to test players (people or programs) for a test round: how to play through `tools/play.js` and what to record |
| `node tools/play.js new|step|do|look <slot> ...` | Plays a real game a few months at a time from the command line, for test players (people or programs): the player's own controls as actions, a report each step, and read-only views. Saved to `tools/play/<slot>.json` between calls and loaded as the browser loads a save, so every step is also a save-and-reload test. `node tools/play.js look <slot> help` lists the actions and views. The actions are in `tools/play-lib.js` |
| `node tools/market.js [years] [seeds]` | Plays from 1900 (default 40 years, 6 seeds) with the Line kept afloat, runs three broker accounts side by side (preserve, balanced, growth) from January 1901 and a buy-and-hold of every company, and prints each against government stock at key years, each account's worst fall in the 1907, 1921 and 1930s slumps, and the shipping share index against what the lines are worth. Checks that the balanced account beats stock over the run, every account loses in some slump, and shares fall below worth in the slumps and recover |
| `QUIET=1 node tools/companies.js [years] [seeds]` | The same with a Morven Line of one ship that buys nothing, so the rivals are measured on their own (0.39.0) |
| `node tools/companies.js [years] [seeds] [verbose]` | Plays the given years (default 40) headless with a plain expanding player who cannot go bust, and prints the rival companies year by year (ships, tonnage, lines, the biggest line's share, cash, debt), failures and new lines per decade, and checks that no line dominates, no trade lies empty and failures stay at a few a decade |
| `node tools/outside.js [years] [seeds] [sell]` | Gives the Line a full shore establishment, plays the given years (default 15) and prints what each place would earn a month from other lines every January, against its running cost and price; with `sell` every place sells, and it prints what each earned and the Line's own takings, for the trade-off |
| `node tools/routes.js [seed] [ship]` | What a ship (default the Morven; try "Kinross" or "Rio Negro") would earn per month on each route, every January and July, as the rivals evolve |
| `node tools/gen-chart.mjs` | Regenerates `js/chart-data.js` from Natural Earth (needs `world-atlas`, `topojson-client` and `d3-geo` installed) |
| `python tools/build-single.py` | Bundles the game into one HTML file in `dist/` (used for the claude.ai artifact): the style sheet and the scripts named in `js/boot.js`, in order; refuses if `BOOT_VER` and `GAME_VERSION` differ |

## The calendar

Month 0 is January 1900 and day 0 is 1 January 1900. Name a month with `ym(year, month)` (month 0 is January), never a bare number. History written for the 1921 game counts from `M21` (January 1921) inside a few functions in `helpers.js`; `tOfM(m)` gives a day in a month, and `yearOfM(m)` the fractional year. The game records where it started in `S.m0` and `S.t0`.

## Saves

The game saves itself to the browser's localStorage under `steerage-saloon-v3`, so each site or folder the game is opened from keeps its own save.

Save codes (Company tab) carry a game anywhere: the state as JSON, trimmed news, deflate-compressed and base64url-encoded, prefixed `SS1.z` (or `SS1.j` uncompressed where the browser lacks CompressionStream). A save link is the page URL with `#save=<code>`; opening it loads the game and clears the hash so a reload does not reload the old save. Codes go through the same migration as localStorage saves, so old codes keep working.

There is no separate save version: the key names the save generation (`steerage-saloon-v3` since 0.19.0, when the calendar moved to 1900), and `js/state.js` migrates older shapes within a generation on load.

## Build and run

- **Play:** open `index.html` from disk, or serve the folder.
- **Single-file build:** `python tools/build-single.py` writes one HTML file to `dist/` (gitignored), used for the claude.ai artifact until #7 moves hosting to GitHub Pages.
- **Hosting:** GitHub Pages from the repo root is possible today (`.nojekyll` is committed); #7 replaces it with a Pages workflow from a build.
