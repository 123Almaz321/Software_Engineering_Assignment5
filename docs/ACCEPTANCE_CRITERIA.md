# Acceptance criteria

These five criteria must stay true after every change. Each one is covered by an automated test in `test/acceptance.test.js`.

| ID | Criterion | Test |
| --- | --- | --- |
| AC1 | `add` with valid input stores the expense; `list` shows its description, amount (2 decimals), payer, split mode and participants. | `AC1 add + list` |
| AC2 | Split modes `equal`, `percent` and `exact` give each participant the correct share for valid input. | `AC2 split modes` |
| AC3 | `balance` prints each person's net amount with 2 decimals; a payer is owed by the other participants. | `AC3 balance` |
| AC4 | `settle` prints transfers that bring every balance to zero; with no expenses it prints "Everyone is settled up." | `AC4 settle` |
| AC5 | Expenses persist between runs in the data file (`EXPENSES_FILE` or `./expenses.json`). | `AC5 persistence` |

Scope note: the baseline tests use "friendly" amounts (90 split by 3, 200 split 75/25). Rounding and input-validation behaviour is covered by the regression tests added in the mitigation step (`test/regression.test.js`).
