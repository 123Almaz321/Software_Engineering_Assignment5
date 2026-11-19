# AGENTS.md — instructions for coding agents

## Purpose
Expense Splitter is a small Node.js command-line tool that splits shared expenses between flatmates and shows who owes whom. It is a course project: no real money, no real personal data, no network.

## Architecture
| Path | Role |
| --- | --- |
| `src/cli.js` | Entry point. Parses arguments, calls storage and splitter, prints output. No business rules here. |
| `src/splitter.js` | Business logic: shares per expense, net balances, settlement transfers. Pure functions, no I/O. |
| `src/storage.js` | Reads/writes the JSON data file (`EXPENSES_FILE` env var, default `./expenses.json`). |
| `test/*.test.js` | `node:test` tests. `acceptance.test.js` = AC1–AC5, must always pass. |
| `docs/` | Acceptance criteria and audit documents. |

Runtime dependencies: none. Do not add any.

## Setup
- Node.js 20 or newer (see `engines` in package.json). Tested on Node 22.
- `npm install` (no packages are downloaded; it only validates package.json).

## Safe commands (allowed without asking)
- `npm test` — run all tests
- `node src/cli.js <add|list|balance|settle> ...` — only with `EXPENSES_FILE` pointing to a temporary file
- `git status`, `git diff`, `git log`, `git add`, `git commit` on your own working branch
- Reading any file in the repository

## Coding conventions
- ES modules (`import`/`export`), 2-space indent, single quotes, semicolons.
- Business logic stays in `src/splitter.js` as pure functions; `cli.js` only parses, calls and prints.
- Money: keep amounts in integer cents inside the logic; format with 2 decimals only when printing.
- Small, focused changes. One concern per commit, with a clear message.

## Test expectations
- Every behaviour change comes with a test in `test/`.
- Run `npm test` before proposing any change and paste the real output (pass/fail totals).
- Never claim a test passed without showing its output. If a command was not run, write NOT RUN and why.
- Do not delete, skip or weaken an existing assertion to make a change pass. AC1–AC5 tests are frozen; changing them needs human approval.

## Forbidden actions
- Adding, printing or committing secrets, tokens, API keys, `.env` files or real personal data.
- Any deployment or publishing: `npm publish`, pushing to `main`, release tags, hosting/CLI deploy commands.
- Destructive commands: `rm -rf`, `git reset --hard`, `git push --force`, `git clean -fdx`, deleting or overwriting the user's `expenses.json`, running `reset` against the real data file.
- Dependency changes (adding, removing or upgrading packages, editing lockfiles) without explicit human approval.
- Network calls from the app or from scripts.
- Unrelated refactoring, renames or mass reformatting.

## Review gate
1. Work on a separate branch (`agent/<short-task-name>`), never directly on `main`.
2. Finish with: list of changed files, the diff, real `npm test` output, risks touched, anything NOT RUN.
3. A human reads the diff, reruns `npm test` locally and approves before anything is merged.

## Note on loading
Some assistants do not load this file automatically. In that case paste the relevant sections into the prompt and say so in the AI-use record. `CLAUDE.md` imports this file for Claude Code.
