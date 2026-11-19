// Counts cases where the balances PRINTED by `balance` (toFixed(2)) do not sum to 0.00.
import { balances } from '/home/claude/expense-splitter/src/splitter.js';
const people = ['Almaz', 'Dana', 'Timur'];
let total = 0, bad = 0, example = null;
for (let a = 1; a <= 200; a++) for (let b = 1; b <= 200; b++) {
  total++;
  const bal = balances([
    { amount: a, payer: 'Almaz', participants: people, mode: 'equal' },
    { amount: b, payer: 'Dana', participants: people, mode: 'equal' },
  ]);
  const printedSumCents = people.reduce((s, p) => s + Math.round(Number((bal[p] || 0).toFixed(2)) * 100), 0);
  if (printedSumCents !== 0) { bad++; if (!example) example = { a, b, printed: people.map(p => `${p} ${(bal[p]).toFixed(2)}`), printedSumCents }; }
}
console.log(`pairs of whole-number expenses tested: ${total}`);
console.log(`printed balances do not sum to 0.00 in: ${bad} (${(100 * bad / total).toFixed(1)}%)`);
console.log('first example:', JSON.stringify(example));
