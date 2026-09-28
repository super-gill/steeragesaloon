# Steerage & Saloon

A real-time 1920s shipping line management sim. You run the Morven Line from its Glasgow head office from January 1921, with no end date (in this world the liner trade never declined, so later decades will be invented): open passenger lines and cargo trades, buy, refit and retire ships, hire masters, build up a shore establishment and head-office departments, and survive rate wars, breakdowns, the US immigration quotas, the 1926 coal strike and the Depression.

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
| `js/silent.js` | Ships without wireless: reckoned positions, overdue notices, sightings and relays by passing ships, foundering, posted missing |
| `js/ledger.js` | Month-to-date accounts by category and by line |
| `js/sim.js` | The simulation: bookings and cargo per voyage, departures, calls, arrivals, breakdowns, yards and upgrades, crew morale, daily costs, month roll |
| `js/rivals.js` | Rival lines: fleets, the shared market on each route, price matching, and each rival's monthly decisions |
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

## The calendar

Month 0 is January 1900 and day 0 is 1 January 1900. Name a month with `ym(year, month)` (month 0 is January), never a bare number. History written for the 1921 game counts from `M21` (January 1921) inside a few functions in `helpers.js`; `tOfM(m)` gives a day in a month, and `yearOfM(m)` the fractional year. The game records where it started in `S.m0` and `S.t0`.

Bump `GAME_VERSION` in `js/data.js`, change `?v=` on every script and stylesheet link in `index.html` to match (so browsers fetch the new files instead of cached ones), and add an entry to `CHANGELOG.md`.

## Saves

The game saves itself to the browser's localStorage under `steerage-saloon-v2`, so each site or folder the game is opened from keeps its own save.

Save codes (Company tab) carry a game anywhere: the state as JSON, trimmed news, deflate-compressed and base64url-encoded, prefixed `SS1.z` (or `SS1.j` uncompressed where the browser lacks CompressionStream). A save link is the page URL with `#save=<code>`; opening it loads the game and clears the hash so a reload does not reload the old save. Codes go through the same migration as localStorage saves, so old codes keep working.

## Tools

Run from the repo root with Node (and Python for the bundler).

| Command | What it does |
|---|---|
| `node tools/harness.js` | Plays 1921 to 1935 headless under scripted strategies (idle, cautious, advisor, expander, prudent, office, undercutter, liverpool), many seeds each, and prints survival, net worth by year, first-year profit, rate wars and profit by route |
| `node tools/harness.js advisor 20` | One strategy, 20 seeds |
| `node tools/routes.js [seed] [ship]` | What a ship (default the Morven; try "Kinross" or "Rio Negro") would earn per month on each route, every January and July, as the rivals evolve |
| `node tools/gen-chart.mjs` | Regenerates `js/chart-data.js` from Natural Earth (needs `world-atlas`, `topojson-client` and `d3-geo` installed) |
| `python tools/build-single.py` | Bundles the game into one HTML file in `dist/` (used for the claude.ai artifact) |

### Balance targets

Checked with the harness after any economic change:

- A player who changes nothing roughly breaks even in year one and survives the 1920s small; the Depression finishes them.
- Second-hand ships are cheap but old; a new ship pays for herself in roughly four to ten years in good times, so building is a long bet.
- Sensible expansion and following head-office advice beat passivity by a wide margin and survive the 1926 strike and the Depression. Blind expansion does not.
- Undercutting fares works for a while, then rivals match and it ends well behind sensible play.
- Piling everything onto one route is punished when history turns (the 1924 quota on Liverpool, the 1921 quota on Naples).
- No route is best all decade.
