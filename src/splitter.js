// Core logic: how one expense is split, net balances, and settlement.
// Internally everything is integer cents, so sums are exact; results are
// converted back to currency units (2 decimals) at the boundary.
import { getMode } from './splitModes.js';

const toCents = (amount) => Math.round(amount * 100);
const fromCents = (cents) => cents / 100;

function sharesInCents(expense) {
  const { amount, participants, mode, weights } = expense;
  const values = getMode(mode).shares(toCents(amount), participants, weights);
  return participants.map((p, i) => [p, values[i]]);
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
