// Core logic: how one expense is split, net balances, and settlement.
// Internally everything is integer cents, so sums are exact; results are
// converted back to currency units (2 decimals) at the boundary.
import { getMode, splitModes } from './splitModes.js';

const toCents = (amount) => Math.round(amount * 100);
const fromCents = (cents) => cents / 100;

function sharesInCents(expense) {
  const { amount, participants, mode, weights } = expense;
  const values = getMode(mode).shares(toCents(amount), participants, weights);
  return participants.map((p, i) => [p, values[i]]);
}

// Returns a list of problems with an expense; an empty list means it is valid.
export function validateExpense(expense) {
  const { desc, amount, payer, participants, mode, weights } = expense;
  const errors = [];
  if (!desc) errors.push('Description is required (--desc).');
  if (!Number.isFinite(amount) || amount <= 0) {
    errors.push(`Amount must be a positive number (--amount), got '${expense.rawAmount ?? amount}'.`);
  }
  if (!payer) errors.push('Payer is required (--payer).');
  if (!participants || participants.length === 0 || participants.some((p) => !p)) {
    errors.push('Participants are required: --with Name1,Name2,...');
  }
  const strategy = splitModes[mode];
  if (!strategy) {
    errors.push(`Unknown split mode '${mode}' (use equal, percent or exact).`);
    return errors;
  }
  if (strategy.needsWeights) {
    if (!weights || !participants || weights.length !== participants.length ||
        weights.some((w) => !Number.isFinite(w) || w < 0)) {
      errors.push('--weights must give one non-negative number per participant.');
    } else if (errors.length === 0) {
      const problem = strategy.validate(toCents(amount), weights);
      if (problem) errors.push(problem);
    }
  }
  return errors;
}

export function computeShares(expense) {
  return Object.fromEntries(sharesInCents(expense).map(([p, c]) => [p, fromCents(c)]));
}

// Positive balance = the group owes this person; negative = this person owes.
export function balances(expenses) {
  const result = {};
  for (const e of expenses) {
    result[e.payer] = (result[e.payer] || 0) + toCents(e.amount);
    for (const [person, share] of sharesInCents(e)) {
      result[person] = (result[person] || 0) - share;
    }
  }
  return Object.fromEntries(Object.entries(result).map(([p, c]) => [p, fromCents(c)]));
}

// Greedy settlement: largest debtor pays largest creditor (in whole cents).
export function settle(bal) {
  const debtors = [];
  const creditors = [];
  for (const [person, value] of Object.entries(bal)) {
    const c = toCents(value);
    if (c < 0) debtors.push({ person, value: -c });
    else if (c > 0) creditors.push({ person, value: c });
  }
  debtors.sort((a, b) => b.value - a.value);
  creditors.sort((a, b) => b.value - a.value);

  const transfers = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].value, creditors[j].value);
    transfers.push({ from: debtors[i].person, to: creditors[j].person, amount: fromCents(pay) });
    debtors[i].value -= pay;
    creditors[j].value -= pay;
    if (debtors[i].value === 0) i++;
    if (creditors[j].value === 0) j++;
  }
  return transfers;
}
