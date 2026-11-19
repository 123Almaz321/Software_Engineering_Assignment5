// Acceptance tests AC1–AC5 (see docs/ACCEPTANCE_CRITERIA.md).
// They run the real CLI against a temporary data file.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { computeShares } from '../src/splitter.js';

let dataFile;
beforeEach(() => {
  dataFile = join(mkdtempSync(join(tmpdir(), 'splitter-')), 'expenses.json');
});

function cli(...args) {
  const r = spawnSync(process.execPath, ['src/cli.js', ...args], {
    encoding: 'utf8',
    env: { ...process.env, EXPENSES_FILE: dataFile },
  });
  return { out: r.stdout.trim(), err: r.stderr.trim(), code: r.status };
}

test('AC1 add + list', () => {
  const add = cli('add', '--desc', 'Pizza', '--amount', '90', '--payer', 'Almaz', '--with', 'Almaz,Dana,Timur');
  assert.equal(add.code, 0);
  const list = cli('list');
  assert.match(list.out, /Pizza — 90\.00 paid by Almaz, split equally between Almaz, Dana, Timur/);
});

test('AC2 split modes', () => {
  assert.deepEqual(
    computeShares({ amount: 90, participants: ['A', 'B', 'C'], mode: 'equal' }),
    { A: 30, B: 30, C: 30 }
  );
  assert.deepEqual(
    computeShares({ amount: 200, participants: ['A', 'B'], mode: 'percent', weights: [75, 25] }),
    { A: 150, B: 50 }
  );
  assert.deepEqual(
    computeShares({ amount: 50, participants: ['A', 'B'], mode: 'exact', weights: [20, 30] }),
    { A: 20, B: 30 }
  );
});

test('AC3 balance', () => {
  cli('add', '--desc', 'Pizza', '--amount', '90', '--payer', 'Almaz', '--with', 'Almaz,Dana,Timur');
  const bal = cli('balance');
  assert.equal(bal.code, 0);
  assert.match(bal.out, /Almaz: \+60\.00/);
  assert.match(bal.out, /Dana: -30\.00/);
  assert.match(bal.out, /Timur: -30\.00/);
});

test('AC4 settle', () => {
  assert.equal(cli('settle').out, 'Everyone is settled up.');
  cli('add', '--desc', 'Pizza', '--amount', '90', '--payer', 'Almaz', '--with', 'Almaz,Dana,Timur');
  const s = cli('settle');
  assert.equal(s.code, 0);
  assert.match(s.out, /Dana -> Almaz: 30\.00/);
  assert.match(s.out, /Timur -> Almaz: 30\.00/);
});

test('AC5 persistence', () => {
  cli('add', '--desc', 'Tea', '--amount', '4', '--payer', 'Dana', '--with', 'Almaz,Dana');
  assert.ok(existsSync(dataFile));
  const saved = JSON.parse(readFileSync(dataFile, 'utf8'));
  assert.equal(saved.length, 1);
  assert.match(cli('list').out, /Tea — 4\.00 paid by Dana/);
});
