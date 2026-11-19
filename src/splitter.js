// Core logic: how one expense is split, net balances, and settlement.
import { getMode } from './splitModes.js';

export function computeShares(expense) {
  const { amount, participants, mode, weights } = expense;
  const values = getMode(mode).shares(amount, participants, weights);
  return Object.fromEntries(participants.map((p, i) => [p, values[i]]));
}

// Positive balance = the group owes this person; negative = this person owes.
export function balances(expenses) {
  const result = {};
  for (const e of expenses) {
    result[e.payer] = (result[e.payer] || 0) + e.amount;
    const shares = computeShares(e);
    for (const [person, share] of Object.entries(shares)) {
      result[person] = (result[person] || 0) - share;
    }
  }
  return result;
}

// Greedy settlement: largest debtor pays largest creditor.
export function settle(bal) {
  const debtors = [];
  const creditors = [];
  for (const [person, value] of Object.entries(bal)) {
    if (value < 0) debtors.push({ person, value: -value });
    else if (value > 0) creditors.push({ person, value });
  }
  debtors.sort((a, b) => b.value - a.value);
  creditors.sort((a, b) => b.value - a.value);

  const transfers = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].value, creditors[j].value);
    transfers.push({ from: debtors[i].person, to: creditors[j].person, amount: pay });
    debtors[i].value -= pay;
    creditors[j].value -= pay;
    if (debtors[i].value === 0) i++;
    if (creditors[j].value === 0) j++;
  }
  return transfers;
}
