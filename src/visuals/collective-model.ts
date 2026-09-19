// SPDX-License-Identifier: Apache-2.0
export type Collective = 'all-reduce' | 'broadcast' | 'all-gather';
export type Topology = 'ring' | 'star';
export type Hop = Readonly<{ from: number; to: number; payload: readonly number[]; phase: 'gather' | 'distribute' }>;

/** Synthetic store-and-forward ledger, deliberately not an NCCL algorithm predictor. */
export function collectiveModel(collective: Collective, ranks: number, topology: Topology) {
  if (!['all-reduce', 'broadcast', 'all-gather'].includes(collective) ||
      ![2, 4, 8].includes(ranks) || !['ring', 'star'].includes(topology)) throw new RangeError('Invalid collective model selection');
  const inputs = Array.from({ length: ranks }, (_, rank) => [rank + 1]);
  const result = collective === 'broadcast' ? [1] : collective === 'all-gather'
    ? inputs.flat() : [inputs.reduce((sum, [value]) => sum + value, 0)];
  const hops: Hop[] = [];
  const route = (from: number, to: number, payload: readonly number[], phase: Hop['phase']) => {
    while (from !== to) {
      const next = topology === 'ring' ? (from + 1) % ranks : from === 0 ? to : 0;
      hops.push({ from, to: next, payload: [...payload], phase });
      from = next;
    }
  };
  if (collective !== 'broadcast') for (let rank = 1; rank < ranks; rank++) route(rank, 0, inputs[rank], 'gather');
  for (let rank = 1; rank < ranks; rank++) route(0, rank, result, 'distribute');
  return { inputs, outputs: inputs.map(() => [...result]), hops };
}
