// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import {
  PAGE_MIGRATION_DEFAULT_SCENARIO_ID,
  PAGE_MIGRATION_MODEL_CONTRACT,
  PAGE_MIGRATION_OPERATIONS,
  PAGE_MIGRATION_ORIGINS,
  PAGE_MIGRATION_PAGE_SIZE_BYTES,
  PAGE_MIGRATION_SCENARIOS,
  createPageMigrationState,
  derivePageMigrationFrame,
  derivePageMigrationFrames,
  reducePageMigrationState,
  type PageMigrationState,
} from '../../src/visuals/page-migration-model';

describe('VIS08 page-migration model', () => {
  it('publishes fixed reviewed scenarios and explicit evidence-neutral assumptions', () => {
    expect(PAGE_MIGRATION_ORIGINS).toEqual(['cpu', 'gpu']);
    expect(PAGE_MIGRATION_OPERATIONS).toEqual(['read', 'write']);
    expect(PAGE_MIGRATION_PAGE_SIZE_BYTES).toBe(65_536);
    expect(PAGE_MIGRATION_DEFAULT_SCENARIO_ID).toBe('gpu-linear-sweep');
    expect(PAGE_MIGRATION_SCENARIOS.map(({ id }) => id)).toEqual([
      'gpu-linear-sweep',
      'alternating-hot-page',
      'split-working-set',
    ]);
    expect(PAGE_MIGRATION_SCENARIOS.every(({ reviewed }) => reviewed)).toBe(true);
    expect(PAGE_MIGRATION_SCENARIOS.every(({ assumptionId, pageSizeBytes }) =>
      assumptionId === PAGE_MIGRATION_MODEL_CONTRACT.assumptionId && pageSizeBytes === 65_536)).toBe(true);
    expect(PAGE_MIGRATION_MODEL_CONTRACT).toMatchObject({
      coherence: 'software-coherent',
      residency: 'one-declared-cpu-or-gpu-location-per-page',
      transitionRule: 'access-origin-differs-from-declared-residency',
      pageSizeMeaning: 'declared-teaching-symbol-not-detected-runtime-granularity',
      symbolicBytes: 'modeled-transition-count-times-declared-page-size',
      observedPageFaults: false,
      observedMigrations: false,
      observedByteTransfers: false,
      measuredLatency: false,
      executesCuda: false,
      evidenceStatusEffect: 'none',
    });
    expect(PAGE_MIGRATION_MODEL_CONTRACT.excludedMechanisms).toEqual([
      'hardware-coherent-direct-access',
      'remote-mapping',
      'prefetch',
      'memory-advice',
      'access-counters',
      'oversubscription',
      'multi-gpu-placement',
    ]);
  });

  it('derives every frame of the GPU sweep in stable page and access order', () => {
    const result = derivePageMigrationFrames('gpu-linear-sweep');
    expect(result.accepted).toBe(true);
    if (!result.accepted) throw new Error('Expected a reviewed scenario.');

    expect(result.frames).toHaveLength(5);
    expect(result.frames.map(({ stepIndex, transitionCount, symbolicBytes }) => ({
      stepIndex,
      transitionCount,
      totalBytes: symbolicBytes.totalBytes,
    }))).toEqual([
      { stepIndex: 0, transitionCount: 0, totalBytes: 0 },
      { stepIndex: 1, transitionCount: 1, totalBytes: 65_536 },
      { stepIndex: 2, transitionCount: 2, totalBytes: 131_072 },
      { stepIndex: 3, transitionCount: 3, totalBytes: 196_608 },
      { stepIndex: 4, transitionCount: 4, totalBytes: 262_144 },
    ]);

    const initial = result.frames[0];
    const final = result.frames[4];
    expect(initial).toMatchObject({
      stepIndex: 0,
      sequenceLength: 4,
      sequenceComplete: false,
      nextAccess: { id: 'access-01', pageId: 'page-00', origin: 'gpu', operation: 'read' },
      ledger: [],
    });
    expect(initial?.residency).toEqual([
      { pageId: 'page-00', location: 'cpu' },
      { pageId: 'page-01', location: 'cpu' },
      { pageId: 'page-02', location: 'cpu' },
      { pageId: 'page-03', location: 'cpu' },
    ]);
    expect(final).toMatchObject({
      sequenceComplete: true,
      nextAccess: null,
      transitionCount: 4,
      symbolicBytes: {
        pageSizeBytes: 65_536,
        totalBytes: 262_144,
        expression: '4 x 65536 B = 262144 B',
      },
      contract: PAGE_MIGRATION_MODEL_CONTRACT,
    });
    expect(final?.residency).toEqual([
      { pageId: 'page-00', location: 'gpu' },
      { pageId: 'page-01', location: 'gpu' },
      { pageId: 'page-02', location: 'gpu' },
      { pageId: 'page-03', location: 'gpu' },
    ]);
    expect(final?.ledger.map(({ sequence, accessId, pageId }) => [sequence, accessId, pageId])).toEqual([
      [1, 'access-01', 'page-00'],
      [2, 'access-02', 'page-01'],
      [3, 'access-03', 'page-02'],
      [4, 'access-04', 'page-03'],
    ]);
  });

  it('keeps before/after residency and symbolic totals explicit for alternating and matching-origin accesses', () => {
    const alternating = derivePageMigrationFrames('alternating-hot-page');
    const split = derivePageMigrationFrames('split-working-set');
    expect(alternating.accepted).toBe(true);
    expect(split.accepted).toBe(true);
    if (!alternating.accepted || !split.accepted) throw new Error('Expected reviewed scenarios.');

    expect(alternating.frames[2]?.ledger).toEqual([
      {
        sequence: 1,
        accessId: 'access-01',
        pageId: 'page-00',
        origin: 'gpu',
        operation: 'write',
        residencyBefore: 'cpu',
        residencyAfter: 'gpu',
        modeledTransition: true,
        transitionCountAfter: 1,
        symbolicBytesAfter: 65_536,
      },
      {
        sequence: 2,
        accessId: 'access-02',
        pageId: 'page-00',
        origin: 'cpu',
        operation: 'read',
        residencyBefore: 'gpu',
        residencyAfter: 'cpu',
        modeledTransition: true,
        transitionCountAfter: 2,
        symbolicBytesAfter: 131_072,
      },
    ]);

    const alternatingFinal = alternating.frames.at(-1);
    expect(alternatingFinal?.transitionCount).toBe(3);
    expect(alternatingFinal?.symbolicBytes.expression).toBe('3 x 65536 B = 196608 B');
    expect(alternatingFinal?.ledger.map(({ modeledTransition }) => modeledTransition)).toEqual([true, true, true, false]);
    expect(alternatingFinal?.residency).toEqual([
      { pageId: 'page-00', location: 'gpu' },
      { pageId: 'page-01', location: 'cpu' },
    ]);

    const splitFinal = split.frames.at(-1);
    expect(splitFinal?.ledger.map(({ modeledTransition }) => modeledTransition)).toEqual([false, false, true, true]);
    expect(splitFinal?.transitionCount).toBe(2);
    expect(splitFinal?.symbolicBytes).toEqual({
      pageSizeBytes: 65_536,
      totalBytes: 131_072,
      expression: '2 x 65536 B = 131072 B',
    });
    expect(splitFinal?.residency).toEqual([
      { pageId: 'page-00', location: 'cpu' },
      { pageId: 'page-01', location: 'gpu' },
      { pageId: 'page-02', location: 'cpu' },
      { pageId: 'page-03', location: 'gpu' },
    ]);
  });

  it('creates, steps, resets, and switches scenarios without hidden state', () => {
    const initial = createPageMigrationState();
    expect(initial).toEqual({ scenarioId: 'gpu-linear-sweep', stepIndex: 0 });

    const stepped = reducePageMigrationState(initial, { type: 'step' });
    expect(stepped).toEqual({
      accepted: true,
      state: { scenarioId: 'gpu-linear-sweep', stepIndex: 1 },
    });
    if (!stepped.accepted) throw new Error('Expected step to succeed.');

    const reset = reducePageMigrationState(stepped.state, { type: 'reset' });
    expect(reset).toEqual({ accepted: true, state: initial });

    const selected = reducePageMigrationState(stepped.state, {
      type: 'select-scenario',
      scenarioId: 'split-working-set',
    });
    expect(selected).toEqual({
      accepted: true,
      state: { scenarioId: 'split-working-set', stepIndex: 0 },
    });
    if (!selected.accepted) throw new Error('Expected scenario selection to succeed.');

    const first = derivePageMigrationFrame(selected.state);
    const second = derivePageMigrationFrame(selected.state);
    expect(first).toEqual(second);
    expect(first).not.toBe(second);
  });

  it('fails closed for malformed actions, unknown scenarios, and a completed sequence', () => {
    const state: PageMigrationState = { scenarioId: 'alternating-hot-page', stepIndex: 2 };
    for (const action of [
      null,
      7,
      {},
      { type: 7 },
      { type: 'select-scenario' },
      { type: 'select-scenario', scenarioId: 7 },
      { type: 'unknown-action' },
    ]) {
      const result = reducePageMigrationState(state, action);
      expect(result).toMatchObject({ accepted: false, state });
      expect(result.state).toBe(state);
      if (!result.accepted) expect(result.issue).toBe('invalid-action');
    }

    const unknown = reducePageMigrationState(state, {
      type: 'select-scenario',
      scenarioId: 'not-reviewed',
    });
    expect(unknown).toEqual({ accepted: false, state, issue: 'unknown-scenario' });
    expect(unknown.state).toBe(state);

    const complete: PageMigrationState = { scenarioId: 'alternating-hot-page', stepIndex: 4 };
    const extraStep = reducePageMigrationState(complete, { type: 'step' });
    expect(extraStep).toEqual({ accepted: false, state: complete, issue: 'sequence-complete' });
    expect(extraStep.state).toBe(complete);
  });

  it('fails closed for every invalid state shape and leaves that state untouched', () => {
    const invalidStates = [
      { scenarioId: 'not-reviewed', stepIndex: 0 },
      { scenarioId: 'gpu-linear-sweep', stepIndex: -1 },
      { scenarioId: 'gpu-linear-sweep', stepIndex: 1.5 },
      { scenarioId: 'gpu-linear-sweep', stepIndex: 5 },
    ] as unknown as PageMigrationState[];

    for (const state of invalidStates) {
      const frame = derivePageMigrationFrame(state);
      expect(frame.accepted).toBe(false);
      const update = reducePageMigrationState(state, { type: 'reset' });
      expect(update).toMatchObject({ accepted: false, state });
      expect(update.state).toBe(state);
    }

    expect(derivePageMigrationFrame(invalidStates[0]!)).toEqual({
      accepted: false,
      issue: 'unknown-scenario',
    });
    for (const state of invalidStates.slice(1)) {
      expect(derivePageMigrationFrame(state)).toEqual({ accepted: false, issue: 'invalid-state' });
    }
    expect(derivePageMigrationFrames('not-reviewed')).toEqual({
      accepted: false,
      issue: 'unknown-scenario',
    });
  });
});
