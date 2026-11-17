# Contributing

Lifecycle: **living**

Conventions for anyone (human or AI) changing this repository. Read the root [CLAUDE.md](../../CLAUDE.md) first: who does what, and how tasks move as GitHub issues. How the code is put together: [architecture.md](architecture.md). Method: `super-gill/vibe-process` 0.1.0.

These are the rules for the code **as it is** at 0.39.8: plain JavaScript in one global scope, with the checks in `tools/`. The engineering issues #2 to #9 bring in the formatter, modules, the core split, the checks and TypeScript; each updates this page in the same commit.

## Code

- **Plain JavaScript scripts, not modules,** loaded in the order of `BOOT_FILES` in `js/boot.js` (until #5). A new file in `js/` goes into `BOOT_FILES` after everything it uses; `tools/lint.js` fails a file that is not loaded.
- **No `//` comment in the middle of a line of code.** The lines are long, and a comment added mid-line silently swallows the code after it (it stopped the strikes and the 1912 disaster in 0.35.4, and rival dividends from 0.30.0 to 0.33.0). `tools/lint.js` finds them.
- **Months by name:** `ym(year, month)`, never a bare number (architecture.md, "The calendar").
- **Every tuning value is a named constant or data** in `js/data.js` or at the top of its system's file.
- **The tools run the game's own scripts.** No test hooks inside the game: a headless runner sets its options through the game's own inputs, and the headless player's actions (`tools/play-lib.js`) do what the screen's buttons do and refuse what the screen would refuse.
- **Comment the why.** A new file opens with a header comment (`/* ===== NAME ===== */`) saying its job and the design page it follows.
- **A new source file gets a row** in architecture.md, "Where things live".
- **New behaviour comes with a check** in the `tools/` script for its system; a closed exploit gets one in `tools/exploits.js`.
- **Scratch scripts are `tools/zz-*`** and are deleted before committing. Test players' notes go in `tools/play/` (gitignored).

## Before pushing

- `node tools/lint.js` is clean, and the checks for the systems you touched pass (`docs/process/releasing.md`, "The checks"). The whole suite before a release.
- A build never writes a committed file (`dist/` is gitignored).
- **Push** with `git fetch -q --depth=50 origin main && git rebase -q origin/main && git -c push.negotiate=true push -q origin HEAD:main`, with a 10 minute timeout.
- There is no pre-push hook yet (#6). Run the checks yourself.

## Proving a change behaves the same

The fingerprint (a seeded playthrough hashing the save at fixed points) is #4. Until it exists, a refactor or "should change nothing" fix is shown identical by running the harness on the same seeds before and after (`END=1922 node tools/harness.js careful 40`) and comparing the output, as 0.19.0 and 0.33.0 did.

## Tools

Today: `tools/lint.js` only. Prettier (#3), ES modules and Vite (#5), ESLint with the size rules, the layering check, the docs and version checks and the pre-push hook (#6), then TypeScript (#8, #9), on the settings in `vibe-process`, `modules/typescript.md`.

## Commits

Summary line: `type(scope): imperative summary (vX.Y.Z)`, 72 characters max, lower case after the colon, no full stop. Version in brackets only when the commit bumps it.

Types: `feat`, `fix`, `balance`, `ui`, `perf`, `refactor`, `docs`, `chore`. Scope optional: `sim`, `economy`, `war`, `rivals`, `market`, `yard`, `fleet`, `advice`, `ui`, `saves`, `tools`, `process`.

Body: blank line, one short paragraph on why, then grouped bullet sections with short headings and verb-first bullets, wrapped at 72. Footers `Version: X.Y.Z` and `Breaking: <what>` when saves or behaviour change incompatibly.

Sign commits `Build #<issue>` or `Design` (`git -c user.name="Build #12" commit ...`). Jason gets the message to paste with every commit.

## Versions

Semantic versioning, 0.x until 1.0. Patch for fixes and balance; minor for a milestone or anything that breaks saves. A save that can no longer load moves the save key on (`steerage-saloon-v3` in `js/state.js`): a minor release with a `Breaking:` footer. A release keeps these in step: `GAME_VERSION` (`js/data.js`), `BOOT_VER` (`js/boot.js`), the README's version line, the changelog heading, the roadmap's Releases line and `DEVLOG` (`js/devlog.js`). `tools/lint.js` checks the first two; #6 adds a check for the rest.

## Documentation

| Folder | What | Owner |
| --- | --- | --- |
| `docs/design/` | What the game is, how each system works, balance targets, research, each page with its Decision record | Design; Build keeps "As built" and `systems.md` true |
| `docs/engineering/` | How the code works | Build |
| `docs/process/` | Roadmap, decisions index, changelog, releasing, lifecycle, test rounds | Design and Build |

Every page has a `Lifecycle:` line (`docs/process/docs-lifecycle.md`). Update the doc in the same change as the code:

- a new file or a structural change: `architecture.md`
- a new rule or system, or a changed one: its section in `docs/design/systems.md` (or its own design page)
- a change a player would notice: `docs/process/changelog.md`, under Unreleased
- every release: changelog, roadmap, `DEVLOG`, and the docs walk

## Decision record

Dated decisions about this page, newest first: date, decision, who decided.

- 2026-11-17: **Adopted vibe-process 0.1.0** (Jason): core, plus modules `browser-game` and `typescript`; stage active. Tasks move to GitHub issues, the old known-issues log and roadmap are archived (#1).
