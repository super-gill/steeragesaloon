# Docs lifecycle

Lifecycle: **living**

Every page under `docs/design/`, `docs/engineering/` and `docs/process/` declares its state on a line within its first six lines: `Lifecycle: **built**`. The archive is not covered. The rules come from `super-gill/vibe-process` 0.1.0, `core/docs.md`.

| State | Means | A reader may |
| --- | --- | --- |
| `living` | A reference kept true by every change that touches it | Rely on it; if wrong, fix it now |
| `proposal` | Being worked out with Jason; nothing agreed | Read for the thinking; build nothing from it |
| `agreed` | Agreed; not built, or built in part ("As built" says which) | Build from it; check "As built" before trusting a number |
| `built` | Built; how the game works now | Rely on it, the code winning any disagreement |
| `history` | Written before the code moved on; kept because current pages point at it | Read as a record; trust the code |
| `brief` | A work order for one pass or chat, naming its release: `Lifecycle: **brief** (for 0.40.0)` | Do the work it sets out |

## How a page moves

- New pages start `proposal`, or `agreed` if Jason already said yes, the page saying when and in whose words.
- `agreed` to `built` in the release that builds its last part.
- `built` to `history` when something replaces it, with a **Now** line naming the replacement.
- `history` to `docs/archive/` when nothing current points at it. `brief` to the archive in the release that ships it.
- `living` pages never move: they change in the same commit as the code.
- Archiving a page means fixing every current page that linked to it.

## In this repo

- Set by Build #1 when the pages moved (17 November 2026); Jason may change them. Research notes in `docs/design/research/` on the period's sources are `living`: a correction to a source is made there. Tuning records written for one release (`what-ships-earn.md`, `advisor-growth.md`) are `history`.
- Test-round summaries and notes in `docs/process/test-rounds/` are `history` from the day they are written.
- The docs check that enforces this arrives with the tooling (#6). Until then, each chat that adds a page gives it its line.
