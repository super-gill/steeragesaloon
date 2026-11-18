# Releasing

Lifecycle: **living**

How a release is cut. A release is a build issue like any other: one chat, its own issue, opened with the release opener (`CLAUDE.md`). This page is the process as it stands at 0.39.8, before the tooling issues (#2 to #9); each of them updates the steps it changes.

## The checks

Every patch runs the whole suite and none ships until it passes. A milestone release runs it on 40 seeds.

| Test | Command | Pass |
| --- | --- | --- |
| Format | `npm run format:check` | all files pass |
| Lint | `node tools/lint.js` | clean |
| Exploits | `node tools/exploits.js 3` | PASS |
| Careful harness | `END=1922 node tools/harness.js careful 40` | 3 to 6 of 40 bankrupt |
| Markets | `node tools/stakes.js`, `node tools/float.js 3`, `node tools/moves.js 3` | PASS |
| World | `node tools/world.js 6` | PASS |
| Desk | `node tools/desk.js 3` | PASS |
| Forecasts | `node tools/forecast.js 6` | PASS |
| Rescue | `node tools/rescue.js 3` | PASS |
| War profit | `node tools/warprofit.js 4` | PASS |
| Disasters | `node tools/disasters.js 4` | PASS |
| Rival lines | `QUIET=1 node tools/companies.js 40 6` | PASS |
| UI smoke | the browser smoke and legacy-save scripts | no page errors |

The UI smoke and legacy-save scripts were never committed: they are not in `tools/`. #51 replaces them; until then a release is opened in a browser by hand, a month played, and a save code exported and loaded back.

On 40 seeds (a milestone run) `node tools/rescue.js` takes more than 10 minutes: run it in chunks or in the background.

A patch that closes an exploit adds a check to `tools/exploits.js`, so it stays closed. A patch with its own checks lists them on its issue.

## The steps

1. **Unreleased to a version.** In `docs/process/changelog.md`, turn `## [Unreleased]` into `## [X.Y.Z] - YYYY-MM-DD` and open a new empty Unreleased above it.
2. **The version, everywhere it is written:** `GAME_VERSION` and `GAME_BUILT` in `js/data.js`, `BOOT_VER` in `js/boot.js` (`tools/lint.js` fails if these two differ), the README's version line, and the roadmap's Releases section. #6 adds a check that all of them agree.
3. **In the game:** a short player-facing entry in `DEVLOG` in `js/devlog.js`, and the shipped item moved off `DEVPLAN`. The Menu shows both as What's new and Coming next, and after an update the game points the player there once (`ss_seenver` in the browser). Keep `DEVPLAN` in step with the roadmap.
4. **Saves.** If a save from the last release can no longer load, the release is a minor one with a `Breaking:` footer, the save key in `js/state.js` moves on (`steerage-saloon-v3` to `-v4`), and the changelog says what happens to an old save. Players are told to export a save code first.
5. **The docs walk.** Every page whose system this release finished moves from `agreed` to `built`; a brief it ships goes to `docs/archive/`; "As built" sections match the code (`docs/process/docs-lifecycle.md`).
6. **The roadmap.** Strike through what shipped, and write the Releases line.
7. **Run the checks, commit, push.** The commit bumps the version: `chore(release): 0.40.0 (v0.40.0)` style, with a `Version:` footer.
8. **Tag and publish.** Jason tags `vX.Y.Z` if he wants one. Hosting moves to a GitHub Pages workflow in #7; until then the claude.ai artifact is built with `python tools/build-single.py`.
9. **Close the loop.** Comment the version on each issue the release ships.

## Test rounds

A milestone release waits for a round of test players over its era, judged against `docs/design/balance.md`, "Targets from 0.39.4". If the round misses the targets, the gate has failed: the findings become issues and the milestone waits.

- Players (people or programs) follow `tools/play-brief.md` and play through `node tools/play.js`, each in their own slot.
- Their raw notes go in `tools/play/` (gitignored). The summary, and the notes worth keeping, go in `docs/process/test-rounds/round<N>.md` and `round<N>/`, `Lifecycle: **history**`.
- Every finding becomes a GitHub issue with a new KI number in its title (the next free number after KI-134). Severity is S1 (breaks the game), S2 (a wrong result), S3 (minor) or S4 (text), written in the title.
