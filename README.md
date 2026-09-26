# Steerage & Saloon

A real-time 1920s shipping line management sim. You run the Morven Line from its Glasgow head office between January 1921 and January 1930: open lines, buy and retire ships, set fares and service, and survive rate wars, breakdowns, the US immigration quotas, the 1926 coal strike and the 1929 crash.

It is a static browser game with no build step. Open `index.html`, or serve the folder with GitHub Pages (from the repo root; `.nojekyll` is included).

## Files

| File | What it holds |
|---|---|
| `index.html` | Page shell: header, chart, side panels |
| `css/style.css` | All styling, light and dark themes |
| `js/chart-data.js` | Generated North Atlantic chart: land, graticule, ports, route polylines, distances |
| `js/data.js` | Game data: routes, classes, seasons, ships for sale, rivals, historical events |
| `js/helpers.js` | Dates, formatting, demand modifiers, prices, rivals and tension maths |
| `js/ledger.js` | Month-to-date accounts by category and by line |
| `js/sim.js` | The simulation: bookings per crossing, departures, arrivals, breakdowns, yards, daily costs, month roll |
| `js/rivals.js` | Rival lines: fleets, the shared market on each route, price matching, and each rival's monthly decisions |
| `js/state.js` | Game state, new game, save and load (browser localStorage) with migrations |
| `js/clock.js` | Real-time clock: pause, 1×, 3×, 7× and the frame loop |
| `js/map.js` | Chart rendering, pan and zoom, ship markers |
| `js/profile.js` | Procedural ship drawings: exterior and cutaway |
| `js/advice.js` | Mr Ferguson, the company secretary: forecast-based advice |
| `js/ui.js` | Panels and tabs, rendered by patching the DOM in place |
| `js/main.js` | Input handling and start-up |

Scripts are plain (non-module) files loaded in the order above and share one global scope, so the game also runs straight from disk.

## Saves

Saves live in the browser's localStorage under `steerage-saloon-v2`, so each site or folder the game is opened from keeps its own save.

## Tools

Run from the repo root with Node (and Python for the bundler).

| Command | What it does |
|---|---|
| `node tools/harness.js` | Plays the whole decade headless under scripted strategies (idle, cautious, advisor, expander, undercutter, liverpool), many seeds each, and prints survival, net worth by year, first-year profit, rate wars and profit by route |
| `node tools/harness.js advisor 20` | One strategy, 20 seeds |
| `node tools/routes.js [seed]` | What a typical second-hand steamer would earn per month on each route, every January and July, as the rivals evolve |
| `python tools/build-single.py` | Bundles the game into one HTML file in `dist/` (used for the claude.ai artifact) |

### Balance targets

Checked with the harness after any economic change:

- A player who changes nothing roughly breaks even in year one and survives the decade small.
- Sensible expansion and following Mr Ferguson's advice beat passivity by a wide margin, without going bankrupt.
- Undercutting fares works for a while, then rivals match and it ends well behind sensible play.
- Piling everything onto one route is punished when history turns (the 1924 quota on Liverpool, the 1921 quota on Naples).
- No route is best all decade.
