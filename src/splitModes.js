// Strategy pattern: one object per split mode.
// Adding a mode = adding one entry here; cli.js and splitter.js do not change.

export const splitModes = {
  equal: {
    needsWeights: false,
    shares: (amount, participants) =>
      participants.map(() => amount / participants.length),
    describe: () => 'split equally',
  },
  percent: {
    needsWeights: true,
    shares: (amount, participants, weights) =>
      participants.map((_, i) => (amount * weights[i]) / 100),
    describe: (weights) => 'split by percent ' + weights.join('/'),
  },
  exact: {
    needsWeights: true,
    shares: (amount, participants, weights) => participants.map((_, i) => weights[i]),
    describe: (weights) => 'split by exact amounts ' + weights.join('/'),
  },
};

export function getMode(name) {
  const mode = splitModes[name];
  if (!mode) throw new Error('Unknown split mode: ' + name);
  return mode;
}
