// Strategy pattern: one object per split mode.
// Adding a mode = adding one entry here; cli.js and splitter.js do not change.
// All amounts here are integer cents.

// Largest-remainder rounding: floors every raw part, then gives the leftover
// cents one by one to the parts with the biggest fractions (ties: list order).
function distribute(totalCents, rawParts) {
  const floors = rawParts.map(Math.floor);
  let rest = totalCents - floors.reduce((s, v) => s + v, 0);
  const order = rawParts
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (let k = 0; rest > 0 && k < order.length; k++, rest--) floors[order[k].i] += 1;
  return floors;
}

export const splitModes = {
  equal: {
    needsWeights: false,
    shares: (amountCents, participants) =>
      distribute(amountCents, participants.map(() => amountCents / participants.length)),
    describe: () => 'split equally',
  },
  percent: {
    needsWeights: true,
    shares: (amountCents, participants, weights) =>
      distribute(amountCents, participants.map((_, i) => (amountCents * weights[i]) / 100)),
    describe: (weights) => 'split by percent ' + weights.join('/'),
  },
  exact: {
    needsWeights: true,
    shares: (amountCents, participants, weights) =>
      participants.map((_, i) => Math.round(weights[i] * 100)),
    describe: (weights) => 'split by exact amounts ' + weights.join('/'),
  },
};

export function getMode(name) {
  const mode = splitModes[name];
  if (!mode) throw new Error('Unknown split mode: ' + name);
  return mode;
}
