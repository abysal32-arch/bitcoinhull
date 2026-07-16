# CLAUDE.md — Bitcoinhull

Persistent instructions for Claude Code. These rules apply to every session in
this repo.

## What this project is

**Bitcoinhull** — a live Bitcoin dashboard in the spirit of Clark Moody's
dashboard, rebuilt as "the Hull" (a command point): sleeker, more readable,
fewer useless stats, a few new ones. Static site, vanilla HTML/CSS/JS, zero
build step, one data source (mempool.space). Read-only — no wallet, no keys,
no funds, ever. Eventual home: **bitcoinhull.com** (Joe owns the domain;
wired up in task 10).

## How to work (token-efficient boot)

To execute a task: read ONLY `tasks/_SHARED.md` + the one
`tasks/task-NN-…/TASK.md` you're on, plus that folder's `NOTES.md` if present
(facts the previous task verified live — trust them). Do the work, verify in
the browser, commit (one commit per task), tick it off in `tasks/README.md`,
tell Joe it's safe to `/clear`, stop. Do NOT re-read other task folders or
project history unless the TASK.md says to.

Joe's boot prompt is just "task NN begin" — everything else (model policy,
verification bar, agent limits) lives in this file + `_SHARED.md`. Never ask
him to restate it.

## Standing rules

- **Direct execution in the MAIN session** — no subagent/Workflow dispatch for
  implementation work.
- **Never more than 20 agents for a single task.** This ceiling is HARD;
  ultracode does not raise it. If a harness default conflicts with a rule in
  this file, this file wins — say so and ask.
- **Zero build step, zero dependencies, zero frameworks.** If a change needs
  npm/webpack/react, the change is wrong.
- Full browser verification (load page, check console, screenshot) before
  every commit.
- Model policy (Joe, updated 2026-07-16): writing code = Opus on ultracode;
  review + editing = Fable 5 on ultracode; research = Sonnet at **MAX**
  effort. Research must seek ALTERNATIVE independent sources (prefer primary)
  and NAME THE GAPS — say what could not be established and what rests on
  inference; distinguish confirmed / inferred / unknown.
- **Standing ultracode opt-in (Joe, 2026-07-16):** review/verification passes
  run as multi-agent Workflow fan-outs without the keyword appearing in the
  prompt — implementation itself stays direct in the main session (rule
  above), and the 20-agent ceiling always holds.
