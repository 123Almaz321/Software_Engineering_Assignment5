---
title: "Software Engineering — Assignment #05"
subtitle: "AI-assisted repository customization, agent readiness and risk governance — Expense Splitter"
author: "Kurakov Almaz"
date: "November 2026"
---

# Submission summary

| Item | Value |
| --- | --- |
| Student | Kurakov Almaz |
| AI assistant used | Claude (Anthropic), model Claude Opus 5.5, via claude.ai, 19 Nov 2026 |
| Repository | `expense-splitter` (source export with full git history, `expense-splitter.zip`) |
| Baseline version | tag `baseline-v1.0.0`, commit `b3eb82c` |
| Final version | tag `final-v1.1.0`, commit `e073357` |
| Tests | baseline 5/5 pass → final 19/19 pass (clean clone) |
| Readiness level | **Level 2 — Documented** |
| Release decision | **CONDITIONAL** |

All command outputs quoted in this report are copied from files in `evidence/`. Nothing marked "pass" was not actually executed. Tests that were not run are listed explicitly in Task 07.

**Project.** Expense Splitter is a small Node.js command-line tool that splits shared flat expenses (groceries, rent, tickets) between flatmates, shows net balances and proposes settlement transfers. It has no runtime dependencies, no network access and no real personal data (names in examples are fictional).

**Git history (baseline → final):**

| Commit | Change | Task |
| --- | --- | --- |
| `b3eb82c` | Expense Splitter v1.0.0 (baseline) | 01 |
| `b89eb55` | AGENTS.md, CLAUDE.md, acceptance criteria + tests, README fix, Node ≥ 20 | 02 |
| `1d01707` | Strategy pattern for split modes (behaviour unchanged) | 03 |
| `2c06aaa` | fix(R1): integer cents + largest-remainder rounding, regression tests | 07 |
| `e073357` | fix(R2): input validation before saving, regression tests | 07 |

# Acceptance criteria

Defined before any code change; each is an automated test in `test/acceptance.test.js` (full text in `docs/ACCEPTANCE_CRITERIA.md`).

| ID | Criterion | Baseline | Final |
| --- | --- | --- | --- |
| AC1 | `add` stores a valid expense; `list` shows description, amount, payer, mode, participants | pass | pass |
| AC2 | `equal`, `percent`, `exact` modes give correct shares for valid input | pass | pass |
| AC3 | `balance` prints each net amount with 2 decimals; payer is owed by others | pass | pass |
| AC4 | `settle` prints transfers that clear balances; "Everyone is settled up." when empty | pass | pass |
| AC5 | Expenses persist between runs in the data file | pass | pass |

# Task 01 — Baseline and context

## Repository map (baseline `b3eb82c`)

| Part | Files | Notes |
| --- | --- | --- |
| Entry point | `src/cli.js` (67 lines) | Parses `add/list/balance/settle/reset`, prints results |
| Business logic | `src/splitter.js` (55 lines) | `computeShares`, `balances`, `settle` |
| Storage | `src/storage.js` (12 lines) | JSON file `EXPENSES_FILE` or `./expenses.json` |
| Tests | `test/splitter.test.js` | 5 unit tests, `node:test`, happy-path values only |
| Dependencies | none | no lockfile committed, no `engines` field |
| Scripts | `test` = `node --test`, `dev` = `node src/cli.js` | no `start`, `lint`, `build` |
| Docs | `README.md` | no AGENTS.md |

## Commands and actual results (baseline)

Environment: Node v22.23.4, npm 10.9.9 (`evidence/baseline/environment.txt`).

| Command | Result | Evidence |
| --- | --- | --- |
| `npm install --no-audit --no-fund` | PASS (exit 0), "up to date"; creates an untracked `package-lock.json` | `01-npm-install.txt`, `git-status-after-checks.txt` |
| `npm test` | PASS — tests 5, pass 5, fail 0 | `02-npm-test.txt` |
| `npm run lint` | MISSING — `Missing script: "lint"` (exit 1) | `03-npm-run-lint.txt` |
| `npm run build` | MISSING — `Missing script: "build"` (exit 1) | `04-npm-run-build.txt` |
| `npm start` (documented in README) | FAIL — `Missing script: "start"` (exit 1) | `05-npm-start.txt` |
| `eslint src test` (global, ad hoc) | NOT USABLE — no `eslint.config.js` (exit 2) | `06-eslint-adhoc.txt` |
| `tsc --noEmit --checkJs` (global, ad hoc) | NOT USABLE — `@types/node` not installed (exit 1) | `07-tsc-checkjs-adhoc.txt` |
| CLI edge-case probes P1–P10 | see weaknesses below | `08-behaviour-probes.txt` |
| Rounding sweep (40,000 expense pairs) | 26,666 (66.7%) printed balance sets do not sum to 0.00 | `09-rounding-sweep.txt` |

## Concrete weaknesses with evidence

1. **Money is not rounded to cents.** `balance` after "100 paid by Almaz, split by 3" prints `+66.67 / -33.33 / -33.33`, which sums to +0.01 (probe P1). The sweep shows this in 66.7% of whole-number cases.
2. **No input validation.** `--amount abc` is saved as `NaN` and prints "Added: Taxi (NaN)" (P2). `-50` is accepted (P3). Percent weights `40,40` are accepted and 60 of 300 disappears (P4).
3. **An invalid mode corrupts the data file.** `--mode shares` is saved; afterwards every `balance` crashes with "Unknown split mode: shares" (P8).
4. **Crashes with stack traces.** A missing `--with` raises a `TypeError` (P6); a corrupted `expenses.json` raises a `SyntaxError` (P7).
5. **README is inaccurate and checks are missing.** README says `npm start`, which does not exist (`05-npm-start.txt`); there is no lint, type-check or build script, and the lockfile is not committed.

## Facts vs assumptions vs AI suggestions

- **Observed facts:** everything in the two tables above and in the weaknesses list. Each was produced by a command whose output is saved in `evidence/baseline/`.
- **Assumptions:** the tool is used by one person at a time on one machine; amounts are entered with at most 2 decimals; "payer not among participants" is a valid use case (someone pays for others).
- **Unverified AI suggestions at this stage:** that a lint run would find real problems (could not run — no config); that concurrent runs could lose data (not tested).

# Task 02 — Agent instructions

`AGENTS.md` was created at the repository root (commit `b89eb55`). It documents:

| Section | Content |
| --- | --- |
| Purpose | Course CLI, no real money, no personal data, no network |
| Architecture | Role of `cli.js`, `splitter.js`, `splitModes.js`, `storage.js`, tests, docs |
| Setup | Node ≥ 20 (`engines` added to package.json), `npm install` |
| Safe commands | `npm test`; CLI only with `EXPENSES_FILE` pointing to a temp file; read-only git commands and commits on own branch |
| Coding conventions | ES modules, pure logic in `splitter.js`, money in integer cents, one concern per commit |
| Test expectations | Test for every behaviour change; paste real `npm test` output; never weaken AC tests |
| Forbidden actions | Secrets/.env/personal data; any deployment or publish; destructive commands (`rm -rf`, `git reset --hard`, force push, running `reset` on the real data file); dependency changes without approval; network calls; unrelated refactoring |
| Review gate | Own branch → changed files + diff + real test output + NOT RUN list → human reruns tests and approves before merge |

**Loading disclosure.** Claude in claude.ai does not load `AGENTS.md` automatically. I gave it the file content explicitly in the session, and the review prompts restated the forbidden actions. `CLAUDE.md` contains `@AGENTS.md`, so Claude Code would import the same rules automatically.

The README was corrected in the same commit: the non-existent `npm start` was replaced with real commands. It also now documents all three split modes, `EXPENSES_FILE`, the project structure and links to the acceptance criteria and AGENTS.md.

# Task 03 — Focused pattern decision

**Problem.** The split mode (`equal`, `percent`, `exact`) was checked with `if/else` in three places: weight parsing in `cli.js`, the text in `list` in `cli.js`, and the share calculation in `splitter.js`. In total there were 7 `mode ===` conditionals (`evidence/refactor/refactor-before.txt`). Adding a mode or a mode rule (for example, validation) would mean editing all three places. Display text (UI) and business rules about modes were also mixed in `cli.js`.

**Options considered.**

| Option | Verdict |
| --- | --- |
| Do nothing | Rejected: both planned mitigations (rounding, validation) need mode-specific rules, which would add more duplicated branches |
| Strategy pattern — one object per mode with `shares`, `describe`, `needsWeights` (later `validate`) | **Chosen**: removes the duplication with one small file, no classes, no new dependencies |
| Adapter | Not applicable: there is no external interface to adapt |
| Class hierarchy (`EqualSplit extends Split`) | Rejected as over-engineering for three small functions |

**Implementation (one refactoring, commit `1d01707`).** I added a new `src/splitModes.js` with a `splitModes` map and `getMode(name)`. `computeShares` now calls `getMode(mode).shares(...)`, and `cli.js` uses `splitModes[mode]?.needsWeights` and `.describe(...)`.

| Metric | Before | After |
| --- | --- | --- |
| `mode ===` conditionals in `src/` | 7 | 0 |
| Places to edit to add a mode | 3 | 1 (`splitModes.js`) |
| Source lines (`src/*.js`) | 134 | 151 |
| `npm test` | 10/10 pass (5 AC + 5 unit) | 10/10 pass |
| CLI output for 7 commands, old vs new code | — | identical (`refactor-behaviour-diff.txt`) |

**Did it pay off?** Yes: both later mitigations plugged into the strategies (cent-based `shares`, per-mode `validate`) without adding a single new mode conditional. The cost is 17 extra lines and one more file.

# Task 04 — Read-only risk review

**Method.** I asked Claude to propose risks for the baseline without modifying files (prompt in Appendix A, P-3). It proposed 12 candidate findings. Each was investigated with code reading, `grep` or a reproducible CLI run, and then classified.

| # | Category | Candidate finding (AI-proposed) | Classification | Evidence |
| --- | --- | --- | --- | --- |
| F1 | Correctness | Equal split not rounded to cents; printed balances do not sum to 0.00 | **Confirmed** | P1: `+66.67/-33.33/-33.33`; sweep 26,666/40,000 |
| F2 | Correctness | `settle` can print a `0.00` transfer | **Confirmed** | Expenses 0.19 and 0.10 split by 3 → `C->B: 0.00` (raw 0.0033) |
| F3 | Correctness | No validation: NaN, negative, percent ≠ 100, exact ≠ total | **Confirmed** | P2 "Added: Taxi (NaN)", P3, P4 |
| F4 | Correctness | Unknown mode is saved and breaks `balance` permanently | **Confirmed** | P8: "Error: Unknown split mode: shares" on every `balance` |
| F5 | Correctness | Missing `--with` crashes with `TypeError` | **Confirmed** | P6: `cli.js:26 ... reading 'split'` |
| F6 | Correctness (reliability) | Corrupted `expenses.json` crashes with stack trace | **Confirmed** | P7: `SyntaxError ... storage.js:7` |
| F7 | Security | Command injection / code execution through CLI arguments | **Unsupported** | P10: grep of `src/` for `eval(`, `exec(`, `child_process`, `fetch(`, `http` → no matches (exit 1); input is only stored as JSON data |
| F8 | Security | `EXPENSES_FILE` lets the app write to any path | **Unsupported** as a vulnerability | The variable is set by the same local user who runs the tool; no privilege boundary is crossed |
| F9 | Dependency | Lint/type tooling not pinned; lockfile not committed | **Confirmed** | `06-eslint-adhoc.txt` (no config, global ESLint 10.1.0), `07-tsc...` (`@types/node` missing), untracked `package-lock.json` |
| F10 | Maintainability | Mode conditionals duplicated in 3 places | **Confirmed** | 7 `mode ===` matches (`refactor-before.txt`) |
| F11 | Agent operations | README documents `npm start` that does not exist; no AGENTS.md | **Confirmed** | `05-npm-start.txt`; `git ls-files` at baseline |
| F12 | Agent operations | `reset` deletes all data without confirmation; an agent testing with the default path could wipe real data | **Confirmed** (behaviour) / impact plausible | P9: `reset` → "All expenses deleted.", `list` → "No expenses yet." |
| F13 | Correctness | Two simultaneous runs may lose an expense (read-modify-write) | **Plausible / unverified** | Code reads then writes the whole file; race not reproduced |
| F14 | Correctness | Payer not among participants is a bug | **Unsupported** | P5 works as intended: "Ghost: +20.00", others −10.00; this is a valid "paid for others" case |

Coverage: 14 findings across 5 categories (correctness, security, dependency, maintainability, agent operations). 10 confirmed, 1 plausible, 3 unsupported.

# Task 05 — Risk register

Likelihood (L) and impact (I) are scored 1–3; score = L × I. Scores are for the **baseline**; residual scores are in Task 07.

**Risk description**

| ID | Category | Cause → event → consequence | Component | Evidence |
| --- | --- | --- | --- | --- |
| R1 | Correctness | Floating-point shares not rounded to cents → printed balances/transfers do not add up → users settle wrong amounts, lose trust in the tool | `src/splitter.js` `computeShares`, `balances`, `settle` | F1, F2, sweep 66.7% |
| R2 | Correctness | No input validation → NaN, negative, wrong-sum or unknown-mode expense saved → wrong balances or permanent crash of `balance` | `src/cli.js` `add` | F3, F4, F5 |
| R3 | Agent ops | Docs inaccurate, no agent rules → agent runs wrong commands, wipes data or makes unreviewed changes | README, missing AGENTS.md | F11, F12 |
| R4 | Dependency | Lint/type tooling unpinned, lockfile not committed → checks not reproducible → quality regressions unnoticed | `package.json` | F9 |
| R5 | Correctness | Corrupted data file → `JSON.parse` throws → tool unusable until file fixed by hand | `src/storage.js` `load` | F6 |
| R6 | Maintainability | Duplicated mode conditionals → mode change edited in one place only → inconsistent behaviour | `cli.js`, `splitter.js` | F10 |
| R7 | Correctness | Concurrent runs → lost update | `src/storage.js` | F13 (unverified) |

**Scoring and actions**

| ID | L | I | Score | Mitigation | Owner | Verification | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R1 | 3 | 3 | **9** | Integer cents + largest-remainder distribution | Developer (Almaz) | 3 regression tests + 40,000-pair sweep | Mitigated (M1) |
| R2 | 3 | 2 | **6** | Validate before saving; clear error, exit 1 | Developer (Almaz) | 6 CLI regression tests | Mitigated (M2) |
| R3 | 2 | 3 | 6 | AGENTS.md, CLAUDE.md, README fix | Developer (Almaz) | Run every README command; read AGENTS.md vs checklist | Mitigated (Task 02) |
| R4 | 3 | 1 | 3 | Add pinned devDependencies (ESLint, TypeScript, @types/node) + scripts; commit lockfile | Developer (Almaz) | `npm ci && npm run lint && npm run typecheck` on clean clone | Open — needs network |
| R5 | 1 | 2 | 2 | try/catch in `load()` with a clear message and backup of the bad file | Developer (Almaz) | Test with `{bad` file | Open (accepted) |
| R6 | 2 | 1 | 2 | Strategy pattern | Developer (Almaz) | `grep "mode ==="` = 0; AC tests | Mitigated (Task 03) |
| R7 | 1 | 1 | 1 | None (single-user tool) | — | — | Accepted |

**Top two confirmed risks for corrective action:** **R1 (score 9)** and **R2 (score 6)**. R3 also scores 6 but was handled by the documentation task, so the two code mitigations go to the two correctness risks that produce wrong money figures.

# Task 06 — Agent-readiness audit (final version)

| Check | Result | Evidence |
| --- | --- | --- |
| Readable structure | Yes: 4 small source files with one role each, tests and docs folders | README "Project structure" |
| README accuracy | Yes: every command in README was run on the final version | `evidence/final/`, `M2-cli-after.txt` |
| Reproducible setup | Yes: zero runtime dependencies, `engines: node >=20`, `npm install` passes on a clean clone | `final/01-npm-install.txt` |
| Pinned dependencies | Partly: no dependencies to pin, but lockfile not committed and tooling not declared | `final/git-status-after-checks.txt` |
| Automated tests | Yes: 19 tests, AC1–AC5 + regression, run by `npm test` | `final/02-npm-test.txt` |
| Lint / type checks | **No**: no script; ad-hoc ESLint/tsc not usable | `final/03`, `06`, `07` |
| Build command | **No** (not needed for a Node CLI, but not documented as such) | `final/04-npm-run-build.txt` |
| Logging | Minimal: errors go to stderr with exit code 1; no log file | `M2-cli-after.txt` |
| Security safeguards | No secrets, no network, no `eval`; input validated; data file git-ignored | F7 grep, `.gitignore` |
| AGENTS.md permissions & safe commands | Yes | AGENTS.md "Safe commands" |
| AGENTS.md prohibited actions | Yes (secrets, deploy, destructive, deps, network, unrelated refactors) | AGENTS.md "Forbidden actions" |
| AGENTS.md review gate | Yes (branch, evidence, human approval) | AGENTS.md "Review gate" |

**Level: 2 — Documented.** The repository is accurately documented, set-up is reproducible, behaviour is protected by automated tests mapped to acceptance criteria, and AGENTS.md defines permissions, forbidden actions and a review gate. It is **not Level 3 (Agent-ready)**, because an agent cannot self-check code quality beyond tests. The following evidence is missing:

- `npm run lint` and a type-check script with pinned versions (`eslint`, `typescript`, `@types/node` in devDependencies);
- committed `package-lock.json`;
- CI that runs `npm ci && npm test && npm run lint` on every branch;
- graceful handling of a corrupted data file (R5).

# Task 07 — Mitigation and verification

## Before/after test evidence

| Run | Command | Tests | Pass | Fail | Evidence |
| --- | --- | --- | --- | --- | --- |
| Baseline | `npm test` | 5 | 5 | 0 | `baseline/02-npm-test.txt` |
| New regression tests on unfixed code | `node --test test/regression.test.js` | 9 | 0 | 9 | `mitigation/regression-before-fix.txt` |
| After M1 | `node --test` (AC + unit + R1) | 13 | 13 | 0 | `mitigation/M1-tests-after.txt` |
| Final, clean clone of `final-v1.1.0` | `npm test` | 19 | 19 | 0 | `final/02-npm-test.txt` |

## Mitigation record M1 — R1 rounding (commit `2c06aaa`)

- **Change.** All internal arithmetic in `splitter.js` now uses integer cents (`toCents`/`fromCents`). Equal and percent shares use largest-remainder distribution in `splitModes.js`, which floors each share and gives leftover cents one by one to the largest fractions. `settle` works in whole cents. The public API still returns 2-decimal amounts, so the AC tests did not change. The diff is in `mitigation/M1-diff.patch` (2 files, +39/−16).
- **Diff review.** Accepted: only `splitter.js` and `splitModes.js` changed; no renames, no dependency changes; the AC test file is untouched. Checked: the new `distribute` function never hands out more cents than the remainder (loop stops at `rest > 0`).
- **Tests added.** `test/regression-r1-rounding.test.js` (3 tests): 100 split by 3 sums to exactly 100.00; printed balances sum to 0.00 over 3,600 pairs; `settle` has no 0.00 transfers and clears every balance.
- **Result.** The 3 tests failed before the fix and pass after. The 40,000-pair sweep went from 26,666 mismatches to **0** (`M1-rounding-sweep-after.txt`).
- **Residual risk.** L 1 × I 3 = **3**. An amount with more than 2 decimals is still accepted: `10.005` is listed as `10.01` but split as `10.00` (`final/residual-probes.txt`). Who receives the extra cent depends on participant order, a deliberate and documented trade-off.

## Mitigation record M2 — R2 input validation (commit `e073357`)

- **Change.** `validateExpense()` in `splitter.js` checks the description, that the amount is finite and > 0, the payer, a non-empty participant list, a known mode, and one non-negative weight per participant. Mode-specific checks are new `validate` methods on the strategies: percent must sum to 100, exact must sum to the total. `cli.js` prints `Error: ...` to stderr, exits with code 1 and saves nothing. The diff is in `mitigation/M2-diff.patch` (3 files).
- **Diff review.** Accepted. One extra behaviour was noticed in review: participant names are now `trim()`-ed. It was kept because it is part of input cleaning and does not affect AC tests. Rejected nothing; the diff contained no unrelated edits.
- **Tests added.** `test/regression-r2-validation.test.js` (6 tests): non-numeric, negative/zero amount, percent ≠ 100, exact ≠ total, unknown mode, missing `--with`. Each checks exit code 1, a clear message without a stack trace, and that nothing was saved.
- **Result.** All 6 tests failed before and pass after. Real output: `Error: Amount must be a positive number (--amount), got 'abc'.`, `Error: Percent weights must sum to 100, got 80.` (`M2-cli-after.txt`).
- **Residual risk.** L 1 × I 2 = **2**. Duplicate participants (`--with A,A`) and amounts with more than 2 decimals are still accepted. Data files already corrupted before the fix still crash (R5).

## Updated scores

| ID | Before | After | Reason |
| --- | --- | --- | --- |
| R1 | 9 | 3 | Sweep 0/40,000; regression tests pass |
| R2 | 6 | 2 | 6 validation tests pass |
| R3 | 6 | 2 | AGENTS.md + accurate README; residual: rules are advisory, not enforced |
| R6 | 2 | 1 | 0 duplicated conditionals |
| R4, R5, R7 | 3, 2, 1 | unchanged | Not addressed in this iteration |

## Checks not executed

- `npm run lint`, type-check and `npm run build`: the scripts do not exist. Installing ESLint/TypeScript/@types/node as pinned devDependencies was not possible because network access to the package registry was disabled in the environment.
- Concurrency test for R7: not written.
- Manual test on Windows and on Node 20: not run. Only Node 22 on Linux was tested.
- CI pipeline: none exists.

## Screenshots

Terminal screenshots of `npm test` (baseline and final) and of the two rejected inputs are attached separately (see `screenshots/`).

# Task 08 — Background agent safeguards (hypothetical)

**Task given to the asynchronous agent:** "Add a `remove <number>` command that deletes one expense, with tests."

| Safeguard | Definition |
| --- | --- |
| Isolation | New branch `agent/remove-command` from tag `final-v1.1.0`, checked out in a separate `git worktree` folder; `EXPENSES_FILE` set to a temp file; no access to the user's real `expenses.json` |
| Credentials | None: no GitHub token with push rights to `main`, no npm token, no `.env` |
| Allowed files | `src/cli.js`, `src/splitter.js`, `src/storage.js`, `test/**`, `README.md` |
| Read-only files | `AGENTS.md`, `CLAUDE.md`, `docs/ACCEPTANCE_CRITERIA.md`, `test/acceptance.test.js`, `package.json` |
| Allowed commands | `npm test`, `node src/cli.js ...` (temp data file), `git status/diff/log/add/commit` on its own branch |
| Prohibited operations | push to `main`, merge, tags, `npm publish`, any deploy, `npm install <pkg>`, lockfile edits, `rm -rf`, `git reset --hard`, force push, network calls, editing AC tests, unrelated refactoring |
| Time limits | 30 minutes wall-clock; at most 3 consecutive failing `npm test` runs, then stop and report; at most 10 commits |

**Required artifacts in the hand-off:**

1. Change summary: what was done and why, in 5 lines or fewer, with the risk register IDs touched.
2. Diff: `git diff final-v1.1.0...agent/remove-command` plus `--stat`.
3. Test logs: full `npm test` output with totals; AC1–AC5 must be listed as passing.
4. Build result: `npm install` output (and lint/type check once they exist), with exit codes.
5. Risk notes: new risks (for example, removing the wrong index), anything NOT RUN, open questions.

**Before merge or deployment:**

1. A human reads the diff; any file outside the allowed list or any unrelated change means rejection.
2. The human reruns `npm test` on a clean clone of the branch; the agent's logs alone are not accepted.
3. The human tries the new command manually on a temp data file, including bad input (`remove 0`, `remove abc`).
4. The risk register is updated; the reviewer records approval (PR review or signed note).
5. Merge into `main`. There is no deployment for this project; a release would only be a new git tag, created by a human.

**Failure and rollback.** If the agent hits the time or failure limit, it stops, commits nothing further and reports the last test output; the branch and worktree are deleted (`git worktree remove`, `git branch -D`). If a problem is found after merge, the merge commit is reverted with `git revert -m 1 <merge>`, and `final-v1.1.0` stays the last known-good tag. User data never needs a rollback, because the agent never touches the real data file.

# Task 09 — Release decision

**Decision: CONDITIONAL** for `final-v1.1.0`.

**Why not NO-GO.** All critical checks pass: 19/19 tests on a clean clone, including AC1–AC5. Both top confirmed risks are mitigated with tests that failed before and pass after: R1 went from 9 to 3 and R2 from 6 to 2. No open risk scores above 3.

**Why not GO.** There are known verification gaps and limitations, each with an explicit owner and control:

| Limitation | Control | Owner |
| --- | --- | --- |
| No lint / type check / committed lockfile (R4, score 3) | Readiness stays Level 2; pinned tooling to be added when network access is available; until then every change must pass `npm test` and human review (AGENTS.md) | Almaz |
| Corrupted data file crashes the tool (R5, score 2) | Data file is local and git-ignored; documented workaround: delete or fix `expenses.json` | Almaz |
| Amounts with more than 2 decimals, duplicate participants (residual R1/R2) | Documented in this report; README example amounts use at most 2 decimals | Almaz |
| Tested only on Node 22 / Linux | `engines: >=20`; to be retested on the student's own machine | Almaz |

The release becomes **GO** when lint and type-check scripts with pinned versions run cleanly on a clean clone, and `load()` handles a corrupted file.

# Task 10 — AI reflection

I used Claude (Anthropic), model Claude Opus 5.5, through claude.ai. Its context was the assignment PDF, the repository files (it worked in its own Linux workspace with Node 22) and the AGENTS.md rules. It did not load AGENTS.md automatically, so the rules were given explicitly in the conversation.

The most useful suggestion was to store money as integer cents and distribute leftover cents with the largest-remainder method. It also suggested proving the bug with a sweep over 40,000 expense pairs, not one example. This turned "rounding might be off" into a measured fact: 66.7% of cases were wrong before and 0% after.

A weak suggestion was a "command injection" security risk. A grep for `eval`, `exec` and `child_process` found nothing, so it was classified as unsupported. Claude's first version of the sweep also measured the wrong thing (rounded transfers instead of printed balances) and had to be rewritten. "Payer not among participants is a bug" was also rejected after checking that it is a valid use case.

I checked the work myself. I read both mitigation diffs before accepting them and noticed the extra `trim()` of names. I re-ran `npm test` on my own computer and typed the invalid inputs (`abc`, percent 40/40) by hand to see the error messages. Tests changed my decisions: the 9 regression tests failed before the fixes, which confirmed R1 and R2, and the clean-clone run is what allows CONDITIONAL rather than NO-GO.

AGENTS.md improved the process. The safe-command list made the assistant use a temporary data file instead of my real one, and the review-gate rule forced it to show real test output. Next time I would add pinned lint and type checks first, so an agent can verify more than tests.

# Appendix A — AI evidence and use record

| Field | Record |
| --- | --- |
| Tool / model | Claude, Anthropic — Claude Opus 5.5 (claude.ai, agent workspace) |
| Date | 19 November 2026 |
| Context given | Assignment PDF; repository files; AGENTS.md text; instruction to never invent test results |
| Verification sources | Saved command outputs in `evidence/`, git history, my own rerun of `npm test` and manual CLI inputs |

| # | Prompt summary | Output used | Problems found in AI output | Decision / change | Human verification |
| --- | --- | --- | --- | --- | --- |
| P-1 | "Do the assignment and prepare the files" + assignment PDF | Plan; choice of a small Node CLI project | — | Accepted | Checked the plan against the PDF deliverables list |
| P-2 | Baseline: map the repo, run install/test/lint/build/start, record exact output | `evidence/baseline/*` | First sweep script measured rounded transfers, not printed balances | Rewrote the sweep (`09-rounding-sweep.mjs`) | Re-read the sweep code; reran it |
| P-3 | "Propose risks for this repository without modifying files; cite file, function or command for each" | 14 candidate findings | Injection risk (F7) and payer bug (F14) unsupported; F8 not a real boundary | Classified 10 confirmed / 1 plausible / 3 unsupported | Ran grep (P10) and CLI probes P1–P9 |
| P-4 | Write AGENTS.md (purpose, architecture, setup, safe/forbidden commands, review gate) and acceptance tests | AGENTS.md, CLAUDE.md, AC tests | AGENTS.md states the cents convention before the code used it | Kept as a rule for new code; true after M1 | Read AGENTS.md against the Task 02 checklist |
| P-5 | "Evaluate Strategy/Adapter for the duplicated mode conditionals; implement at most one refactor; prove behaviour unchanged" | `splitModes.js`, behaviour diff | — | Accepted Strategy, rejected Adapter and class hierarchy | Compared CLI output before/after; AC tests pass |
| P-6 | "Write regression tests for R1 and R2 first, run them on unfixed code" | 9 failing tests | — | Accepted | Confirmed 0/9 pass before fix |
| P-7 | "Minimal patch for R1 (integer cents); show diff; run tests" | M1 diff | — | Accepted | Read diff; sweep 0/40,000 |
| P-8 | "Minimal patch for R2 (validation before save); show diff; run tests" | M2 diff | Extra `trim()` of names | Accepted after review | Read diff; tried `abc` and `40,40` manually |
| P-9 | Final checks on clean clone; readiness audit; release decision; report | `evidence/final/*`, this report | — | Edited and approved | Re-ran `npm test`, checked numbers in report against `evidence/` |
