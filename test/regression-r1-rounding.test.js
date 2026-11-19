// Regression tests for confirmed risk R1 (rounding to the cent).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeShares, balances, settle } from '../src/splitter.js';

const people = ['Almaz', 'Dana', 'Timur'];
const cents = (x) => Math.round(x * 100);

// ---------- R1: money must add up to the cent ----------

test('R1 equal split of 100 between 3 adds up to exactly 100.00', () => {
  const shares = computeShares({ amount: 100, participants: people, mode: 'equal' });
  const values = Object.values(shares);
  values.forEach((v) => assert.equal(cents(v) / 100, v, `share ${v} has more than 2 decimals`));
  assert.equal(values.reduce((s, v) => s + cents(v), 0), 10000);
});

test('R1 printed balances always sum to 0.00 (sweep of 3,600 expense pairs)', () => {
  for (let a = 1; a <= 60; a++) {
    for (let b = 1; b <= 60; b++) {
      const bal = balances([
        { amount: a, payer: 'Almaz', participants: people, mode: 'equal' },
        { amount: b, payer: 'Dana', participants: people, mode: 'equal' },
      ]);
      const printedSum = Object.values(bal).reduce((s, v) => s + cents(Number(v.toFixed(2))), 0);
      assert.equal(printedSum, 0, `amounts ${a} and ${b}: printed balances sum to ${printedSum} cents`);
    }
  }
});

test('R1 settle never prints a 0.00 transfer and clears every balance', () => {
  const expenses = [
    { amount: 0.19, payer: 'Almaz', participants: people, mode: 'equal' },
    { amount: 0.1, payer: 'Dana', participants: people, mode: 'equal' },
  ];
  const bal = balances(expenses);
  const transfers = settle(bal);
  const left = Object.fromEntries(Object.entries(bal).map(([p, v]) => [p, cents(v)]));
  for (const t of transfers) {
    assert.notEqual(t.amount.toFixed(2), '0.00', 'zero transfer printed');
    left[t.from] += cents(t.amount);
    left[t.to] -= cents(t.amount);
  }
  assert.deepEqual(Object.values(left), [0, 0, 0]);
});
