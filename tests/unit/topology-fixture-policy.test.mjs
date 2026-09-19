// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';
import { reviewTopologyFixture } from '../../scripts/lib/topology-fixture-policy.mjs';

const fixture = () => ({
  schemaVersion: 1, provenance: 'synthetic', sourceVersion: 'synthetic', command: 'topo-mp',
  edges: [{ from: 'GPU-A', to: 'GPU-B', relation: 'PIX' }, { from: 'GPU-A', to: 'NIC-A', relation: 'PHB' }],
  peer: { aToB: 'unknown', bToA: 'unknown' }, networkRoute: 'unknown',
});

describe('G03 topology derivative publication boundary', () => {
  it('round-trips fictional aliases without inventing capability, routes or evidence', () => {
    const input = fixture();
    const result = reviewTopologyFixture(input);
    expect(result).toEqual(input);
    result.edges[0].relation = 'SYS';
    result.peer.aToB = 'available';
    expect(input.edges[0].relation).toBe('PIX');
    expect(input.peer.aToB).toBe('unknown');
    expect(result).not.toHaveProperty('runtime');
  });
  it.each(['hostname', 'uuid', 'pciAddress', 'ip', 'path', 'bandwidth', 'runtime', '__proto__'])('rejects extra %s without echoing it', key => {
    const input = fixture();
    Object.defineProperty(input, key, { value: 'fictional-private-value', enumerable: true });
    expect(() => reviewTopologyFixture(input)).toThrow(/^Invalid topology fixture$/);
  });
  it('rejects nested identifying fields, raw strings, missing fields and unsupported versions', () => {
    const inputs = [null, [], 'raw topology', { ...fixture(), sourceVersion: '610.43.02' },
      { ...fixture(), provenance: 'reviewed-observation' }, { ...fixture(), schemaVersion: 2 }];
    const nested = fixture(); nested.edges[0].hostname = 'fictional'; inputs.push(nested);
    const peer = fixture(); peer.peer.notes = 'fictional'; inputs.push(peer);
    const missing = fixture(); delete missing.peer; inputs.push(missing);
    for (const input of inputs) expect(() => reviewTopologyFixture(input)).toThrow('Invalid topology fixture');
  });
  it('keeps direction independent and declared observation provenance separate from verification', () => {
    const input = fixture();
    input.provenance = 'reviewed-observation'; input.sourceVersion = '610.43.02';
    input.peer = { aToB: 'available', bToA: 'unavailable' };
    expect(reviewTopologyFixture(input)).toEqual(input);
    expect(reviewTopologyFixture(input)).not.toHaveProperty('evidence');
  });
  it.each(['X', 'NV0', 'NV100', 'NV2', 'FAST', 1, null])('rejects invalid PCI-only relationship %s', relation => {
    const input = fixture(); input.edges[0].relation = relation;
    expect(() => reviewTopologyFixture(input)).toThrow('Invalid topology fixture');
  });
  it('accepts NVLink only in the NVLink-inclusive GPU pair, without a bandwidth claim', () => {
    const input = fixture(); input.command = 'topo-m'; input.edges[0].relation = 'NV2';
    expect(reviewTopologyFixture(input).edges[0].relation).toBe('NV2');
    input.edges[1].relation = 'NV2';
    expect(() => reviewTopologyFixture(input)).toThrow('Invalid topology fixture');
  });
  it('rejects duplicates, reversed duplicates, self edges, arbitrary aliases and inferred routes', () => {
    for (const edge of [fixture().edges[0], { from: 'GPU-B', to: 'GPU-A', relation: 'SYS' },
      { from: 'GPU-A', to: 'GPU-A', relation: 'PIX' }, { from: 'GPU-C', to: 'GPU-B', relation: 'PIX' }]) {
      const input = fixture(); input.edges.push(edge);
      expect(() => reviewTopologyFixture(input)).toThrow('Invalid topology fixture');
    }
    for (const update of [{ edges: [] }, { command: 'raw' }, { networkRoute: 'host-staged' },
      { peer: { aToB: false, bToA: 'unknown' } }]) {
      expect(() => reviewTopologyFixture({ ...fixture(), ...update })).toThrow('Invalid topology fixture');
    }
  });
  it('rejects accessors, sparse/decorated arrays and inherited fields without reading them', () => {
    const getter = fixture();
    Object.defineProperty(getter, 'sourceVersion', { enumerable: true, get() { throw new Error('must not run'); } });
    const sparse = fixture(); delete sparse.edges[0];
    const decorated = fixture(); decorated.edges.notes = 'fictional';
    const inherited = Object.create(fixture());
    for (const input of [getter, sparse, decorated, inherited]) {
      expect(() => reviewTopologyFixture(input)).toThrow(/^Invalid topology fixture$/);
    }
  });
});
