#!/usr/bin/env node
import { load, save } from './storage.js';
import { balances, settle, validateExpense } from './splitter.js';
import { splitModes } from './splitModes.js';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      args[argv[i].slice(2)] = argv[i + 1];
      i++;
    }
  }
  return args;
}

function money(n) {
  return n.toFixed(2);
}

const [command, ...rest] = process.argv.slice(2);
const args = parseArgs(rest);
const expenses = load();

if (command === 'add') {
  const mode = args.mode || 'equal';
  const participants = args.with ? args.with.split(',').map((p) => p.trim()) : [];
  let weights;
  if (splitModes[mode]?.needsWeights && args.weights) {
    weights = args.weights.split(',').map(Number);
  }
  const expense = {
    desc: args.desc,
    amount: args.amount === undefined || args.amount.trim() === '' ? NaN : Number(args.amount),
    payer: args.payer,
    participants,
    mode,
    weights,
  };
  const errors = validateExpense({ ...expense, rawAmount: args.amount });
  if (errors.length > 0) {
    errors.forEach((msg) => console.error('Error: ' + msg));
    process.exit(1);
  }
  expenses.push(expense);
  save(expenses);
  console.log(`Added: ${expense.desc} (${money(expense.amount)}) paid by ${expense.payer}`);
} else if (command === 'list') {
  if (expenses.length === 0) console.log('No expenses yet.');
  expenses.forEach((e, i) => {
    const how = splitModes[e.mode]?.describe(e.weights);
    console.log(`${i + 1}. ${e.desc} — ${money(e.amount)} paid by ${e.payer}, ${how} between ${e.participants.join(', ')}`);
  });
} else if (command === 'balance') {
  const bal = balances(expenses);
  for (const [person, value] of Object.entries(bal)) {
    console.log(`${person}: ${value >= 0 ? '+' : ''}${money(value)}`);
  }
} else if (command === 'settle') {
  const transfers = settle(balances(expenses));
  if (transfers.length === 0) console.log('Everyone is settled up.');
  for (const t of transfers) {
    console.log(`${t.from} -> ${t.to}: ${money(t.amount)}`);
  }
} else if (command === 'reset') {
  save([]);
  console.log('All expenses deleted.');
} else {
  console.log('Usage: cli.js <add|list|balance|settle|reset> [options]');
}
