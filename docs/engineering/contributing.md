# Contributing

Lifecycle: **living**

Conventions for anyone (human or AI) changing this repository. Read the root [CLAUDE.md](../../CLAUDE.md) first: who does what, and how tasks move as GitHub issues. How the code is put together: [architecture.md](architecture.md). Method: `super-gill/vibe-process` 0.1.0.

These are the rules for the code **as it is** at 0.39.8: plain JavaScript in one global scope, with the checks in `tools/`. The engineering issues #2 to #9 bring in the formatter, modules, the core split, the checks and TypeScript; each updates this page in the same commit.

## Code

- **Plain JavaScript scripts, not modules,** loaded in the order of `BOOT_FILES` in `js/boot.js` (until #5). A new file in `js/` goes into `BOOT_FILES` after everything it uses; `tools/lint.js` fails a file that is not loaded.
- **Formatted by Prettier** (`.prettierrc.json`: 120 columns, single quotes, trailing commas, LF). Run `npm install` once, then `npm run format` before committing. A change that reformats many files goes in a commit of its own, with nothing else in it, and its hash goes in `.git-blame-ignore-revs` so `git blame` skips it (GitHub reads that file on its own; locally run `git config blame.ignoreRevsFile .git-blame-ignore-revs` once).
- **No `//` comment in the middle of a line of code.** The lines used to run to hundreds of characters before #3, and a comment added mid-line silently swallows the code after it (it stopped the strikes and the 1912 disaster in 0.35.4, and rival dividends from 0.30.0 to 0.33.0). `tools/lint.js` finds them.
- **Months by name:** `ym(year, month)`, never a bare number (architecture.md, "The calendar").
- **Every tuning value is a named constant or data** in `js/data.js` or at the top of its system's file.
- **The tools run the game's own scripts.** No test hooks inside the game: a headless runner sets its options through the game's own inputs, and the headless player's actions (`tools/play-lib.js`) do what the screen's buttons do and refuse what the screen would refuse.
- **Comment the why.** A new file opens with a header comment (`/* ===== NAME ===== */`) saying its job and the design page it follows.
- **A new source file gets a row** in architecture.md, "Where things live".
- **New behaviour comes with a check** in the `tools/` script for its system; a closed exploit gets one in `tools/exploits.js`.
- **Scratch scripts are `tools/zz-*`** and are deleted before committing. Test players' notes go in `tools/play/` (gitignored).

## Before pushing

- `npm run format:check` passes and `node tools/lint.js` is clean, and the checks for the systems you touched pass (`docs/process/releasing.md`, "The checks"). The whole suite before a release.
- A build never writes a committed file (`dist/` is gitignored).
- **Push** with `git fetch -q --depth=50 origin main && git rebase -q origin/main && git -c push.negotiate=true push -q origin HEAD:main`, with a 10 minute timeout.
- There is no pre-push hook yet (#6). Run the checks yourself.

## Proving a change behaves the same

A refactor or "should change nothing" fix is proved with the fingerprint (#4):

```
npm run fingerprint -- <commit>
```

It plays the same fixed games on this checkout, uncommitted edits included, and on the commit named, and compares a hash of the save at the start of every month. Compare against the commit before your change (`HEAD` while the change is uncommitted, `HEAD~1` once it is committed). In a shallow clone, fetch that commit first (`git fetch --depth=50 origin main`).

- **IDENTICAL**: the change plays exactly as that commit did. Put the line in the issue's closing comment.
- **DIFFERENT**: for each game that differs, the first month and the parts of the save that differ there (`advisor seed 3  October 1913  in emerg`). A refactor must come out IDENTICAL. A change meant to alter behaviour should differ, and no earlier and no wider than it should: if it does, look there.
- A side that stops with an error is reported with the line it failed on. If the older side fails because a refactor renamed a function the scripted owners call, the owners need the old name too, or the proof is the harness on the same seeds as before.

| Run | What | Time on 2 cores |
| --- | --- | --- |
| `npm run fingerprint -- <commit>` | 7 owners x 3 seeds, January 1900 to the end of 1922 | about 5 minutes |
| `... --quick` | one seed per owner, for a look while working; not the proof | about 30 seconds |
| `... --full` | on to the end of 1945 | longer: run it as a long run (`vibe-process`, `modules/long-runs.md`) |
| `... --seeds 5` | more seeds per owner | |

What it plays: the harness's scripted owners (advisor, keen, office, careful, expander, undercutter) and `kept`, the careful owner with a benefactor who keeps the Line in cash, so every seed reaches the last year. Most of the others go bankrupt before the end, and the summary says how many games were still trading. Each side loads its own rule scripts (the `FILES` list in its own `tools/harness.js`); the owners and the dice are this checkout's on both sides.

What it does not cover: anything outside the save (the advice on screen, the screen itself), branches none of the games reach (no ship was written off as a constructive total loss in the default games when this was built), and the browser. A change there needs its own check.

Proved when built (#4): IDENTICAL against the commit before; a planted one-unit change in a rare branch (one more death recorded when a ship is lost, `js/emergency.js`, reached in 2 of the 21 games) came out DIFFERENT in exactly those two games, at the first monthly check after each loss, and only in `emerg`.

## Tools

Today: `tools/lint.js` and Prettier (#3). Next: ES modules and Vite (#5), ESLint with the size rules, the layering check, the docs and version checks and the pre-push hook (#6), then TypeScript (#8, #9), on the settings in `vibe-process`, `modules/typescript.md`.

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
