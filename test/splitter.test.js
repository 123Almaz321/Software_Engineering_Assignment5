import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeShares, balances, settle } from '../src/splitter.js';

test('equal split divides the amount evenly', () => {
  const shares = computeShares({ amount: 90, participants: ['A', 'B', 'C'], mode: 'equal' });
  assert.deepEqual(shares, { A: 30, B: 30, C: 30 });
});

test('percent split uses the weights', () => {
  const shares = computeShares({
    amount: 200, participants: ['A', 'B'], mode: 'percent', weights: [75, 25],
  });
  assert.deepEqual(shares, { A: 150, B: 50 });
});

test('exact split returns the given amounts', () => {
  const shares = computeShares({
    amount: 50, participants: ['A', 'B'], mode: 'exact', weights: [20, 30],
  });
  assert.deepEqual(shares, { A: 20, B: 30 });
});

test('balances: payer is owed by the others', () => {
  const bal = balances([{ amount: 60, payer: 'A', participants: ['A', 'B', 'C'], mode: 'equal' }]);
  assert.deepEqual(bal, { A: 40, B: -20, C: -20 });
});

test('settle produces transfers to the creditor', () => {
  const transfers = settle({ A: 40, B: -20, C: -20 });
  assert.deepEqual(transfers, [
    { from: 'B', to: 'A', amount: 20 },
    { from: 'C', to: 'A', amount: 20 },
  ]);
});
