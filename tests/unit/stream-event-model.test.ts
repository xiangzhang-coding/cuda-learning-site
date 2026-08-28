// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import {
  EVENT_ELAPSED_TIME_FORMULA,
  STREAM_EVENT_LIMITS,
  STREAM_EVENT_MODEL_CONTRACT,
  STREAM_EVENT_OPERATION_KINDS,
  STREAM_EVENT_STREAMS,
  addStreamEventDependency,
  addStreamEventOperation,
  assessStreamEventTiming,
  buildStreamEventTrace,
  classifyStreamEventRelation,
  createStreamEventGraph,
  createStreamEventPlaybackState,
  deriveStreamEventDependencies,
  reduceStreamEventPlaybackState,
} from '../../src/visuals/stream-event-model';

describe('VIS07 stream/event dependency model', () => {
  it('separates same-stream order from explicit event edges and traces a stable ready set', () => {
    expect(STREAM_EVENT_STREAMS.map(({ id }) => id)).toEqual([
      'prepare-stream',
      'consume-stream',
      'observe-stream',
    ]);
    expect(STREAM_EVENT_OPERATION_KINDS).toEqual(['h2d-copy', 'kernel', 'd2h-copy']);

    const graph = createStreamEventGraph(3);
    expect(graph.streams.every(({ isDefault }) => isDefault === false)).toBe(true);
    expect(graph.operations.map(({ id }) => id)).toEqual(['op-01', 'op-02', 'op-03', 'op-04', 'op-05']);
    expect(graph.eventDependencies).toEqual([
      { id: 'event-01', recordOperationId: 'op-02', waitOperationId: 'op-03' },
    ]);

    const dependencies = deriveStreamEventDependencies(graph);
    expect(dependencies.sameStreamEdges.map(({ from, to }) => [from, to])).toEqual([
      ['op-01', 'op-02'],
      ['op-03', 'op-04'],
    ]);
    expect(dependencies.eventEdges.map(({ from, to, eventId }) => [from, to, eventId])).toEqual([
      ['op-02', 'op-03', 'event-01'],
    ]);
    expect(dependencies.sameStreamEdges.some(({ from, to }) => from === 'op-04' && to === 'op-05')).toBe(false);

    const trace = buildStreamEventTrace(graph);
    expect(trace.frames.map(({ readyOperationIds, selectedOperationId }) => ({
      ready: readyOperationIds,
      selected: selectedOperationId,
    }))).toEqual([
      { ready: ['op-01', 'op-05'], selected: 'op-01' },
      { ready: ['op-02', 'op-05'], selected: 'op-02' },
      { ready: ['op-03', 'op-05'], selected: 'op-03' },
      { ready: ['op-04', 'op-05'], selected: 'op-04' },
      { ready: ['op-05'], selected: 'op-05' },
      { ready: [], selected: null },
    ]);
    expect(trace.operationOrder).toEqual(['op-01', 'op-02', 'op-03', 'op-04', 'op-05']);
    expect(trace.contract).toBe(STREAM_EVENT_MODEL_CONTRACT);
  });

  it('adds fixed-vocabulary operations with deterministic IDs and fails closed for invalid input', () => {
    const graph = createStreamEventGraph(3);
    const added = addStreamEventOperation(graph, { streamId: 'observe-stream', kind: 'd2h-copy' });
    expect(added).toMatchObject({
      accepted: true,
      operation: { id: 'op-06', streamId: 'observe-stream', kind: 'd2h-copy' },
    });
    if (!added.accepted) throw new Error('Expected operation to be accepted.');
    expect(added.graph.operations.at(-1)).toEqual(added.operation);

    for (const [input, issue] of [
      [{ streamId: 'default-stream', kind: 'kernel' }, 'unknown-stream'],
      [{ streamId: 'prepare-stream', kind: 'sleep' }, 'unknown-operation-kind'],
    ] as const) {
      const rejected = addStreamEventOperation(graph, input);
      expect(rejected).toMatchObject({ accepted: false, issue });
      expect(rejected.graph).toBe(graph);
    }
  });

  it('adds event record/wait dependencies and rejects unsafe edits without changing the graph', () => {
    const graph = createStreamEventGraph(3);
    expect(classifyStreamEventRelation(graph, 'op-04', 'op-05')).toBe('unordered-not-proven-concurrent');

    const accepted = addStreamEventDependency(graph, {
      recordOperationId: 'op-04',
      waitOperationId: 'op-05',
    });
    expect(accepted).toMatchObject({
      accepted: true,
      dependency: {
        id: 'event-02',
        recordOperationId: 'op-04',
        waitOperationId: 'op-05',
      },
    });
    if (!accepted.accepted) throw new Error('Expected dependency to be accepted.');
    expect(classifyStreamEventRelation(accepted.graph, 'op-04', 'op-05')).toBe('ordered');

    for (const [input, issue] of [
      [{ recordOperationId: 'op-99', waitOperationId: 'op-05' }, 'unknown-operation'],
      [{ recordOperationId: 'op-01', waitOperationId: 'op-01' }, 'self-dependency'],
      [{ recordOperationId: 'op-02', waitOperationId: 'op-03' }, 'duplicate-dependency'],
      [{ recordOperationId: 'op-01', waitOperationId: 'op-03' }, 'redundant-dependency'],
      [{ recordOperationId: 'op-04', waitOperationId: 'op-01' }, 'cyclic-dependency'],
    ] as const) {
      const rejected = addStreamEventDependency(graph, input);
      expect(rejected).toMatchObject({ accepted: false, issue });
      expect(rejected.graph).toBe(graph);
    }
  });

  it('bounds operation growth and does not consume an ID for a rejected edit', () => {
    let graph = createStreamEventGraph(3);
    for (let ordinal = 6; ordinal <= STREAM_EVENT_LIMITS.maximumOperations; ordinal += 1) {
      const result = addStreamEventOperation(graph, { streamId: 'observe-stream', kind: 'kernel' });
      expect(result).toMatchObject({ accepted: true, operation: { id: `op-${String(ordinal).padStart(2, '0')}` } });
      if (!result.accepted) throw new Error('Expected bounded operation to be accepted.');
      graph = result.graph;
    }

    const rejected = addStreamEventOperation(graph, { streamId: 'observe-stream', kind: 'kernel' });
    expect(rejected).toMatchObject({ accepted: false, issue: 'operation-limit-reached' });
    expect(rejected.graph).toBe(graph);
    expect(graph.operations).toHaveLength(12);
  });

  it('plays, pauses, steps, scrubs, resets, and stops at graph edits or completion', () => {
    const initial = createStreamEventPlaybackState();
    expect(initial).toEqual({ frameIndex: 0, isPlaying: false });
    expect(reduceStreamEventPlaybackState(initial, { type: 'tick' }, 5)).toBe(initial);

    const playing = reduceStreamEventPlaybackState(initial, { type: 'play' }, 5);
    expect(playing).toEqual({ frameIndex: 0, isPlaying: true });
    expect(reduceStreamEventPlaybackState(playing, { type: 'tick' }, 5)).toEqual({
      frameIndex: 1,
      isPlaying: true,
    });
    expect(reduceStreamEventPlaybackState(playing, { type: 'step' }, 5)).toEqual({
      frameIndex: 1,
      isPlaying: false,
    });
    expect(reduceStreamEventPlaybackState(playing, { type: 'pause' }, 5)).toEqual(initial);
    expect(reduceStreamEventPlaybackState(playing, { type: 'scrub', frameIndex: 4 }, 5)).toEqual({
      frameIndex: 4,
      isPlaying: false,
    });
    expect(reduceStreamEventPlaybackState(playing, { type: 'scrub', frameIndex: 6 }, 5)).toBe(playing);
    expect(reduceStreamEventPlaybackState({ frameIndex: 5, isPlaying: false }, { type: 'play' }, 5)).toEqual({
      frameIndex: 5,
      isPlaying: false,
    });
    expect(reduceStreamEventPlaybackState({ frameIndex: 4, isPlaying: true }, { type: 'tick' }, 5)).toEqual({
      frameIndex: 5,
      isPlaying: false,
    });
    expect(reduceStreamEventPlaybackState(playing, { type: 'graph-edited' }, 5)).toEqual(initial);
    expect(reduceStreamEventPlaybackState({ frameIndex: 3, isPlaying: false }, { type: 'reset' }, 5)).toEqual(initial);
  });

  it('shows only an event formula and distinguishes timing caveats without fabricated milliseconds', () => {
    const base = { timingEnabled: true, startRecorded: true, stopRecorded: true, startComplete: true, stopComplete: true };
    expect(assessStreamEventTiming({ ...base, timingEnabled: false })).toMatchObject({
      status: 'timing-disabled',
      elapsedMilliseconds: null,
    });
    expect(assessStreamEventTiming({ ...base, startRecorded: false })).toMatchObject({
      status: 'unrecorded',
      elapsedMilliseconds: null,
    });
    expect(assessStreamEventTiming({ ...base, stopComplete: false })).toMatchObject({
      status: 'incomplete',
      elapsedMilliseconds: null,
    });
    expect(assessStreamEventTiming(base)).toEqual({
      status: 'formula-only',
      formula: EVENT_ELAPSED_TIME_FORMULA,
      elapsedMilliseconds: null,
    });
    expect(EVENT_ELAPSED_TIME_FORMULA).toBe('elapsed = timestamp(stop) - timestamp(start)');
    expect(STREAM_EVENT_MODEL_CONTRACT).toMatchObject({
      browserPacing: 'not-cuda-time-or-evidence',
      executesCuda: false,
      evidenceStatusEffect: 'none',
    });
  });
});
