// SPDX-License-Identifier: Apache-2.0
// Host-only review boundary. Input is a reviewed JSON derivative, never raw tool output.
const aliases = new Set(['GPU-A', 'GPU-B', 'NIC-A']);
const pciRelations = new Set(['PIX', 'PXB', 'PHB', 'NODE', 'SYS', 'unknown']);
const capabilities = new Set(['available', 'unavailable', 'unknown']);

function reject() {
  // Never echo rejected keys or values: they may contain machine identifiers.
  throw new Error('Invalid topology fixture');
}

function exactObject(value, keys) {
  if (!value || Object.getPrototypeOf(value) !== Object.prototype) reject();
  const own = Reflect.ownKeys(value);
  if (own.length !== keys.length || keys.some(key => !Object.hasOwn(value, key))) reject();
  if (own.some(key => !Object.getOwnPropertyDescriptor(value, key)?.enumerable ||
    !Object.hasOwn(Object.getOwnPropertyDescriptor(value, key), 'value'))) reject();
}

/** Validate and reconstruct the small G03 public derivative. Grants no evidence status. */
export function reviewTopologyFixture(input) {
  exactObject(input, ['schemaVersion', 'provenance', 'sourceVersion', 'command', 'edges', 'peer', 'networkRoute']);
  if (input.schemaVersion !== 1 || !['synthetic', 'reviewed-observation'].includes(input.provenance)) reject();
  if (input.provenance === 'synthetic' ? input.sourceVersion !== 'synthetic' :
    typeof input.sourceVersion !== 'string' || !/^\d{3}\.\d{1,3}\.\d{1,3}$/.test(input.sourceVersion)) reject();
  if (!['topo-m', 'topo-mp'].includes(input.command) || input.networkRoute !== 'unknown') reject();
  if (!Array.isArray(input.edges) || input.edges.length < 1 || input.edges.length > 3) reject();
  // JSON arrays only: sparse or decorated arrays are not silently accepted.
  if (Reflect.ownKeys(input.edges).length !== input.edges.length + 1) reject();
  const seen = new Set();
  const edges = [];
  for (let index = 0; index < input.edges.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(input.edges, String(index));
    if (!descriptor || !Object.hasOwn(descriptor, 'value')) reject();
    const edge = descriptor.value;
    exactObject(edge, ['from', 'to', 'relation']);
    if (!aliases.has(edge.from) || !aliases.has(edge.to) || edge.from === edge.to) reject();
    const key = [edge.from, edge.to].sort().join(':');
    if (seen.has(key)) reject();
    seen.add(key);
    const nvlink = typeof edge.relation === 'string' && /^NV(?:[1-9]|[1-9]\d)$/.test(edge.relation);
    if (!pciRelations.has(edge.relation) && !(nvlink && input.command === 'topo-m' &&
      edge.from.startsWith('GPU-') && edge.to.startsWith('GPU-'))) reject();
    edges.push({ from: edge.from, to: edge.to, relation: edge.relation });
  }
  exactObject(input.peer, ['aToB', 'bToA']);
  if (!capabilities.has(input.peer.aToB) || !capabilities.has(input.peer.bToA)) reject();
  return {
    schemaVersion: 1, provenance: input.provenance, sourceVersion: input.sourceVersion,
    command: input.command, edges, peer: { aToB: input.peer.aToB, bToA: input.peer.bToA },
    networkRoute: 'unknown',
  };
}
