// Regression tests for confirmed risk R2 (input validation).
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// ---------- R2: invalid input is rejected and nothing is saved ----------

let dataFile;
beforeEach(() => {
  dataFile = join(mkdtempSync(join(tmpdir(), 'splitter-')), 'expenses.json');
});

function add(...extra) {
  const r = spawnSync(process.execPath, ['src/cli.js', 'add', '--desc', 'Test', ...extra], {
    encoding: 'utf8',
    env: { ...process.env, EXPENSES_FILE: dataFile },
  });
  return { out: r.stdout, err: r.stderr, code: r.status };
}

function assertRejected(r, pattern) {
  assert.equal(r.code, 1, 'exit code should be 1');
  assert.match(r.err, pattern);
  assert.doesNotMatch(r.err, /TypeError|at file:/, 'should be a clean message, not a stack trace');
  assert.ok(!existsSync(dataFile) || JSON.parse(readFileSync(dataFile, 'utf8')).length === 0, 'nothing saved');
}

test('R2 rejects a non-numeric amount', () => {
  assertRejected(add('--amount', 'abc', '--payer', 'Dana', '--with', 'Almaz,Dana'), /amount/i);
});

test('R2 rejects a negative or zero amount', () => {
  assertRejected(add('--amount', '-50', '--payer', 'Dana', '--with', 'Almaz,Dana'), /amount/i);
  assertRejected(add('--amount', '0', '--payer', 'Dana', '--with', 'Almaz,Dana'), /amount/i);
});

test('R2 rejects percent weights that do not sum to 100', () => {
  assertRejected(
    add('--amount', '300', '--payer', 'Dana', '--with', 'Almaz,Dana', '--mode', 'percent', '--weights', '40,40'),
    /100/
  );
});

test('R2 rejects exact amounts that do not sum to the total', () => {
  assertRejected(
    add('--amount', '50', '--payer', 'Timur', '--with', 'Almaz,Timur', '--mode', 'exact', '--weights', '20,20'),
    /sum/i
  );
});

test('R2 rejects an unknown split mode before saving it', () => {
  assertRejected(
    add('--amount', '10', '--payer', 'Dana', '--with', 'Almaz,Dana', '--mode', 'shares', '--weights', '1,1'),
    /mode/i
  );
});

test('R2 rejects a missing --with with a clear message', () => {
  assertRejected(add('--amount', '5', '--payer', 'Dana'), /--with/);
});
