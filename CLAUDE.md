# CLAUDE.md

maplace.js is being rewritten from scratch as 1.0. Read `docs/MODERNIZE.md` first: it holds the context, decisions, rejected options, conventions and the status of every task. Keep it current: update a row's status with the work, add rows rather than new planning files.

## Agent workflow
- Work on a short-lived branch, fast-forward merged into `next`. Before the go-public gate (§9 in `docs/MODERNIZE.md`) never touch `master`/`main`, npm, the live site or GitHub issues. Commit only when asked; no attribution lines in commit messages.
- Before any change merges, run on the branch diff, in order: `/simplify`, then `/code-review`, then `/clean-code` (a user skill; skip it if unavailable and say so). Fix findings, then merge. Documentation-only changes skip the chain.
- A fix lands with a test shown failing first.
- Commit message style: `[add]`, `[upd]`, `[fix]` prefix, short summary; a commit that closes an issue says `Fixes #N` (the CHANGELOG test, P4 in `docs/MODERNIZE.md`, reads it).
