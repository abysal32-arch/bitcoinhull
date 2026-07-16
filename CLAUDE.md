# CLAUDE.md — Bitcoin Helm

Persistent instructions for Claude Code. These rules apply to every session in
this repo.

## What this project is

**Bitcoin Helm** — a live Bitcoin dashboard in the spirit of Clark Moody's
dashboard, rebuilt as a "helm" (command point): sleeker, more readable, fewer
useless stats, a few new ones. Static site, vanilla HTML/CSS/JS, zero build
step, one data source (mempool.space). Read-only — no wallet, no keys, no
funds, ever.

## How to work (token-efficient boot)

To execute a task: read ONLY `tasks/_SHARED.md` + the one
`tasks/task-NN-…/TASK.md` you're on. Do the work, verify in the browser,
commit (one commit per task), tick it off in `tasks/README.md`, tell Joe it's
safe to `/clear`, stop. Do NOT re-read other task folders or project history
unless the TASK.md says to.

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
- Model policy (Joe): writing code = Opus; review + editing = Fable;
  research = Sonnet at HIGH effort.
