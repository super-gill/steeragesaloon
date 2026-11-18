# Steerage & Saloon (steeragesaloon): start here

Every Claude chat on this repo reads this file first. Keep it short: if it grows past about 120 lines, something here belongs in another page.

Method: `super-gill/vibe-process` 0.1.0 (core, plus modules: `browser-game`, `typescript`). This file carries what a chat needs; open the guide only where a line here points at it. Stage: **active**.

## What this is

A real-time shipping line management game set from 1900, a static browser game in plain JavaScript (about 1.2 MB in 37 scripts sharing one global scope, no build step), with headless tools in Node. Parts today: `js/` (the game: rules and screen not yet split, see #6), `tools/` (the headless player, the harness and the checks), `css/`, `index.html`. How the code is organised: `docs/engineering/architecture.md`. Search it for the files you need; never read it whole. How the game works: `docs/design/systems.md`, the same way.

## Your role

Your opener names your role. If it does not, ask Jason before doing anything.

| Role | Does | Never |
| --- | --- | --- |
| **Design** | Talks ideas through with Jason. Records what is agreed in the design page it belongs to, adds the line to `docs/process/decisions.md`, keeps the roadmap's order, opens one issue per task. May push docs-only commits to `main`. | Writes or changes code |
| **Build** | One issue per chat: plan, build, test, document, close. Releases are build issues too (`docs/process/releasing.md`). | Takes a second task, or makes a design call (asks Jason instead) |
| **Review** | Every few releases, with no build history: drift, duplication, stale docs, files growing too big. Opens an issue per finding. | Fixes things itself |

Jason decides what the game is. He does not code: explain in plain words. When asked for something outside your role, say so, name the role it belongs to, and offer to open an issue. If told to do it here anyway, do it and note it on the issue. Jason crosses these lines without noticing and wants the push-back.

## Working with Jason

- **Push back when you disagree, lead with problems, no filler praise.** No em dashes anywhere, in docs, code comments, commits or replies.
- **The decision gate** when Jason proposes an approach: verdict, strongest objection, alternative, confidence, then wait (`vibe-process`, `core/working-with-the-owner.md`). An issue is agreed work: a build chat does not gate its own issue.
- **Numbers before building.** Anything that changes behaviour gets its numbers agreed first. Check a design against what the code actually has: count it.
- **Every commit gets its message to Jason** in the format in `docs/engineering/contributing.md`, "Commits". Sign commits `Build #<issue>` or `Design`.

## How work moves

- **Tasks live in GitHub issues**, one task each, labelled `code`, `design-question`, `idea` or `review`. Not in docs. Known issues keep their number and severity in the title ("KI-133 (S1): ..."). Use the REST API: `gh api repos/super-gill/steeragesaloon/issues` (list; `-f title=... -f body=...` to open; `PATCH .../issues/<n> -f state=closed` to close; `.../issues/<n>/comments` to comment). `gh issue ...` fails here: it uses GraphQL, which these sessions block.
- **A task names its design section**, not just its page. Read that section; open the rest only if the work needs it.
- **Decisions live in the design page they affect**, under "Decision record", dated, with who decided. `docs/process/decisions.md` is a one-line index.
- **The roadmap** (`docs/process/roadmap.md`) is a short ordered list of issue numbers in steps towards the current milestone, kept by the design chat. The milestones are in `docs/design/direction.md`, "V1". What V1 is: `docs/design/direction.md`.
- **The repo is the memory.** Nothing survives unless committed or on an issue. Jason never carries information between chats.
- **One build chat at a time.** It pushes to `main`.
- **`in-progress` shows what is running.** Every chat lists open `in-progress` issues first (`gh api 'repos/super-gill/steeragesaloon/issues?labels=in-progress'`). If yours is there, or you are a build chat and another `code` issue is, tell Jason and stop. Otherwise label yours (`POST .../issues/<n>/labels -f 'labels[]=in-progress'`) and unlabel it when you close or stop (`DELETE .../issues/<n>/labels/in-progress`).

## Build chat routine

**Start:** pull `main`. Check `in-progress` and label your issue. Read this file, your issue, and the design section it names. Search `architecture.md` for the files involved. Read nothing else up front.

1. Post a short plan to Jason: files, approach, risks. Wait for an OK if it changes behaviour or breaks saves.
2. Build. New behaviour comes with a check in its `tools/` script. For a refactor or "should change nothing" fix, prove it identical: the fingerprint once #4 builds it; until then the harness on the same seeds before and after (`contributing.md`, "Proving a change behaves the same").
3. `npm run format` has been run, `node tools/lint.js` is clean and the checks for the systems touched pass (`docs/process/releasing.md`, "The checks"). There is no pre-push hook yet; give a push a 10 minute timeout.
4. Update the docs the change touches (`contributing.md`, "Documentation"); changelog line under Unreleased if a player would notice.
5. Close the issue with a comment: what changed, the commit, a new issue for anything left over.
6. Give Jason the commit message.

Then the chat ends. Too big for one chat: stop at a working point, commit, split the rest into issues, remove the label. Never run on until the context is compacted. A design question mid-task goes to Jason; if away, open a `design-question` issue and stop at a safe point rather than guess.

## Design chat routine

- Read this file, then only the design pages the conversation is about. Label your issue `in-progress`, if there is one.
- Take Jason's points one at a time. When one is agreed: write it into the design page (dated, "Jason with Design"), add a line to `decisions.md`, open the issues to build it (template: `.github/ISSUE_TEMPLATE/task.md`).
- An idea to keep but not schedule is an `idea` issue. Dropped means closed with a line saying why.
- Refresh the chat whenever it gets long. Everything that matters is in the repo.

## Rules for every chat

- Conventions, commits, docs: `docs/engineering/contributing.md`. Page states: `docs/process/docs-lifecycle.md`.
- The code wins over the docs. A wrong doc is a bug: fix it or open an issue.
- Saves live in the browser (`steerage-saloon-v3`); a change that stops old saves loading is a minor release with a `Breaking:` footer, agreed with Jason first.
- Keep chats short and reading small (`vibe-process`, `core/efficiency.md`).
- Stop at a task boundary before the context fills. Never rely on compaction.
