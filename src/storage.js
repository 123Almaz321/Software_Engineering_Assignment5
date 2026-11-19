import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const DATA_FILE = process.env.EXPENSES_FILE || './expenses.json';

export function load() {
  if (!existsSync(DATA_FILE)) return [];
  return JSON.parse(readFileSync(DATA_FILE, 'utf8'));
}

export function save(expenses) {
  writeFileSync(DATA_FILE, JSON.stringify(expenses, null, 2));
}
