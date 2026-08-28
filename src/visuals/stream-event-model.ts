// SPDX-License-Identifier: Apache-2.0

export const STREAM_EVENT_STREAMS = [
  { id: 'prepare-stream', name: 'Prepare stream', isDefault: false },
  { id: 'consume-stream', name: 'Consume stream', isDefault: false },
  { id: 'observe-stream', name: 'Observe stream', isDefault: false },
] as const;

export const STREAM_EVENT_OPERATION_KINDS = ['h2d-copy', 'kernel', 'd2h-copy'] as const;

export const EVENT_ELAPSED_TIME_FORMULA = 'elapsed = timestamp(stop) - timestamp(start)';

export const STREAM_EVENT_MODEL_CONTRACT = {
  streams: 'two-or-three-explicitly-named-non-default-streams',
  operationVocabulary: 'fixed',
  sameStreamOrder: 'implicit-in-enqueue-order',
  crossStreamOrder: 'unordered-without-explicit-event-dependency',
  unorderedMeaning: 'not-proven-concurrent',
  topologicalTieBreak: 'ascending-deterministic-operation-id-not-hardware-scheduling',
  eventFormula: EVENT_ELAPSED_TIME_FORMULA,
  browserPacing: 'not-cuda-time-or-evidence',
  executesCuda: false,
  evidenceStatusEffect: 'none',
} as const;

export type StreamEventStreamId = (typeof STREAM_EVENT_STREAMS)[number]['id'];
export type StreamEventOperationKind = (typeof STREAM_EVENT_OPERATION_KINDS)[number];
export type StreamEventStreamCount = 2 | 3;

export type StreamEventStream = Readonly<{
  id: StreamEventStreamId;
  name: string;
  isDefault: false;
}>;

export type StreamEventOperation = Readonly<{
  id: string;
  streamId: StreamEventStreamId;
  kind: StreamEventOperationKind;
}>;

export type StreamEventDependency = Readonly<{
  id: string;
  recordOperationId: string;
  waitOperationId: string;
}>;

export type StreamEventGraph = Readonly<{
  streams: readonly StreamEventStream[];
  operations: readonly StreamEventOperation[];
  eventDependencies: readonly StreamEventDependency[];
  nextOperationOrdinal: number;
  nextEventOrdinal: number;
}>;

export type StreamOrderEdge = Readonly<{
  id: string;
  kind: 'same-stream';
  from: string;
  to: string;
  streamId: StreamEventStreamId;
}>;

export type StreamEventEdge = Readonly<{
  id: string;
  kind: 'event';
  from: string;
  to: string;
  eventId: string;
}>;

export type StreamEventTraceFrame = Readonly<{
  completedOperationIds: readonly string[];
  readyOperationIds: readonly string[];
  selectedOperationId: string | null;
}>;

export type StreamEventEditIssue =
  | 'unknown-stream'
  | 'unknown-operation-kind'
  | 'operation-limit-reached'
  | 'unknown-operation'
  | 'self-dependency'
  | 'duplicate-dependency'
  | 'redundant-dependency'
  | 'cyclic-dependency';

export type StreamEventOperationEditResult =
  | Readonly<{
      accepted: true;
      graph: StreamEventGraph;
      operation: StreamEventOperation;
    }>
  | Readonly<{
      accepted: false;
      graph: StreamEventGraph;
      issue: Extract<StreamEventEditIssue, 'unknown-stream' | 'unknown-operation-kind' | 'operation-limit-reached'>;
    }>;

export type StreamEventDependencyEditResult =
  | Readonly<{
      accepted: true;
      graph: StreamEventGraph;
      dependency: StreamEventDependency;
    }>
  | Readonly<{
      accepted: false;
      graph: StreamEventGraph;
      issue: Extract<StreamEventEditIssue, 'unknown-operation' | 'self-dependency' | 'duplicate-dependency' | 'redundant-dependency' | 'cyclic-dependency'>;
    }>;

export type StreamEventPlaybackState = Readonly<{
  frameIndex: number;
  isPlaying: boolean;
}>;

export type StreamEventPlaybackAction =
  | Readonly<{ type: 'play' }>
  | Readonly<{ type: 'pause' }>
  | Readonly<{ type: 'step' }>
  | Readonly<{ type: 'tick' }>
  | Readonly<{ type: 'scrub'; frameIndex: number }>
  | Readonly<{ type: 'reset' }>
  | Readonly<{ type: 'graph-edited' }>;

export type StreamEventTimingInput = Readonly<{
  timingEnabled: boolean;
  startRecorded: boolean;
  stopRecorded: boolean;
  startComplete: boolean;
  stopComplete: boolean;
}>;

export const STREAM_EVENT_LIMITS = {
  minimumStreams: 2,
  maximumStreams: 3,
  maximumOperations: 12,
} as const;

function operationId(ordinal: number) {
  return `op-${String(ordinal).padStart(2, '0')}`;
}

export function createStreamEventGraph(streamCount: StreamEventStreamCount = 2): StreamEventGraph {
  if (streamCount !== 2 && streamCount !== 3) throw new Error('VIS07 supports exactly two or three streams.');

  const streams = STREAM_EVENT_STREAMS.slice(0, streamCount);
  const operations: StreamEventOperation[] = [
    { id: 'op-01', streamId: 'prepare-stream', kind: 'h2d-copy' },
    { id: 'op-02', streamId: 'prepare-stream', kind: 'kernel' },
    { id: 'op-03', streamId: 'consume-stream', kind: 'kernel' },
    { id: 'op-04', streamId: 'consume-stream', kind: 'd2h-copy' },
  ];
  if (streamCount === 3) operations.push({ id: 'op-05', streamId: 'observe-stream', kind: 'kernel' });

  return {
    streams: streams.map(({ id, name }) => ({ id, name, isDefault: false })),
    operations,
    eventDependencies: [{ id: 'event-01', recordOperationId: 'op-02', waitOperationId: 'op-03' }],
    nextOperationOrdinal: operations.length + 1,
    nextEventOrdinal: 2,
  };
}

export function deriveStreamEventDependencies(graph: StreamEventGraph) {
  const sameStreamEdges: StreamOrderEdge[] = [];
  for (const stream of graph.streams) {
    const operations = graph.operations.filter(({ streamId }) => streamId === stream.id);
    for (let index = 1; index < operations.length; index += 1) {
      const from = operations[index - 1];
      const to = operations[index];
      if (!from || !to) continue;
      sameStreamEdges.push({
        id: `stream:${stream.id}:${from.id}->${to.id}`,
        kind: 'same-stream',
        from: from.id,
        to: to.id,
        streamId: stream.id,
      });
    }
  }

  const eventEdges: StreamEventEdge[] = graph.eventDependencies.map((dependency) => ({
    id: dependency.id,
    kind: 'event',
    from: dependency.recordOperationId,
    to: dependency.waitOperationId,
    eventId: dependency.id,
  }));
  return { sameStreamEdges, eventEdges } as const;
}

function hasDependencyPath(graph: StreamEventGraph, from: string, to: string) {
  const dependencies = deriveStreamEventDependencies(graph);
  const edges = [...dependencies.sameStreamEdges, ...dependencies.eventEdges];
  const visited = new Set<string>();
  const pending = [from];
  while (pending.length > 0) {
    const current = pending.shift();
    if (!current || visited.has(current)) continue;
    if (current === to) return true;
    visited.add(current);
    for (const edge of edges) if (edge.from === current) pending.push(edge.to);
  }
  return false;
}

export function classifyStreamEventRelation(graph: StreamEventGraph, from: string, to: string) {
  const operationIds = new Set(graph.operations.map(({ id }) => id));
  if (!operationIds.has(from) || !operationIds.has(to)) return 'unknown-operation' as const;
  if (from === to || hasDependencyPath(graph, from, to)) return 'ordered' as const;
  return 'unordered-not-proven-concurrent' as const;
}

export function addStreamEventOperation(
  graph: StreamEventGraph,
  input: Readonly<{ streamId: string; kind: string }>,
): StreamEventOperationEditResult {
  const stream = graph.streams.find(({ id }) => id === input.streamId);
  if (!stream) return { accepted: false, issue: 'unknown-stream' as const, graph };
  const kind = STREAM_EVENT_OPERATION_KINDS.find((candidate) => candidate === input.kind);
  if (!kind) return { accepted: false, issue: 'unknown-operation-kind' as const, graph };
  if (graph.operations.length >= STREAM_EVENT_LIMITS.maximumOperations) {
    return { accepted: false, issue: 'operation-limit-reached' as const, graph };
  }

  const operation: StreamEventOperation = {
    id: operationId(graph.nextOperationOrdinal),
    streamId: stream.id,
    kind,
  };
  return {
    accepted: true,
    operation,
    graph: {
      ...graph,
      operations: [...graph.operations, operation],
      nextOperationOrdinal: graph.nextOperationOrdinal + 1,
    },
  } as const;
}

export function addStreamEventDependency(
  graph: StreamEventGraph,
  input: Readonly<{ recordOperationId: string; waitOperationId: string }>,
): StreamEventDependencyEditResult {
  const operationIds = new Set(graph.operations.map(({ id }) => id));
  if (!operationIds.has(input.recordOperationId) || !operationIds.has(input.waitOperationId)) {
    return { accepted: false, issue: 'unknown-operation' as const, graph };
  }
  if (input.recordOperationId === input.waitOperationId) {
    return { accepted: false, issue: 'self-dependency' as const, graph };
  }
  if (graph.eventDependencies.some(({ recordOperationId, waitOperationId }) =>
    recordOperationId === input.recordOperationId && waitOperationId === input.waitOperationId)) {
    return { accepted: false, issue: 'duplicate-dependency' as const, graph };
  }
  if (hasDependencyPath(graph, input.waitOperationId, input.recordOperationId)) {
    return { accepted: false, issue: 'cyclic-dependency' as const, graph };
  }
  if (hasDependencyPath(graph, input.recordOperationId, input.waitOperationId)) {
    return { accepted: false, issue: 'redundant-dependency' as const, graph };
  }

  const dependency: StreamEventDependency = {
    id: `event-${String(graph.nextEventOrdinal).padStart(2, '0')}`,
    recordOperationId: input.recordOperationId,
    waitOperationId: input.waitOperationId,
  };
  return {
    accepted: true,
    dependency,
    graph: {
      ...graph,
      eventDependencies: [...graph.eventDependencies, dependency],
      nextEventOrdinal: graph.nextEventOrdinal + 1,
    },
  } as const;
}

export function createStreamEventPlaybackState(): StreamEventPlaybackState {
  return { frameIndex: 0, isPlaying: false };
}

export function reduceStreamEventPlaybackState(
  state: StreamEventPlaybackState,
  action: StreamEventPlaybackAction,
  maximumFrameIndex: number,
): StreamEventPlaybackState {
  switch (action.type) {
    case 'play':
      return state.frameIndex >= maximumFrameIndex || state.isPlaying ? state : { ...state, isPlaying: true };
    case 'pause':
      return state.isPlaying ? { ...state, isPlaying: false } : state;
    case 'step': {
      if (state.frameIndex >= maximumFrameIndex) return state.isPlaying ? { ...state, isPlaying: false } : state;
      return { frameIndex: state.frameIndex + 1, isPlaying: false };
    }
    case 'tick': {
      if (!state.isPlaying) return state;
      const frameIndex = Math.min(state.frameIndex + 1, maximumFrameIndex);
      return { frameIndex, isPlaying: frameIndex < maximumFrameIndex };
    }
    case 'scrub':
      return Number.isInteger(action.frameIndex) && action.frameIndex >= 0 && action.frameIndex <= maximumFrameIndex
        ? { frameIndex: action.frameIndex, isPlaying: false }
        : state;
    case 'reset':
    case 'graph-edited':
      return createStreamEventPlaybackState();
  }
}

export function assessStreamEventTiming(input: StreamEventTimingInput) {
  const result = { formula: EVENT_ELAPSED_TIME_FORMULA, elapsedMilliseconds: null } as const;
  if (!input.timingEnabled) return { status: 'timing-disabled' as const, ...result };
  if (!input.startRecorded || !input.stopRecorded) return { status: 'unrecorded' as const, ...result };
  if (!input.startComplete || !input.stopComplete) return { status: 'incomplete' as const, ...result };
  return { status: 'formula-only' as const, ...result };
}

export function buildStreamEventTrace(graph: StreamEventGraph) {
  const dependencies = deriveStreamEventDependencies(graph);
  const edges = [...dependencies.sameStreamEdges, ...dependencies.eventEdges];
  const completed = new Set<string>();
  const operationOrder: string[] = [];
  const frames: StreamEventTraceFrame[] = [];

  while (completed.size < graph.operations.length) {
    const readyOperationIds = graph.operations
      .map(({ id }) => id)
      .filter((id) => !completed.has(id) && edges.every((edge) => edge.to !== id || completed.has(edge.from)))
      .sort();
    const selectedOperationId = readyOperationIds[0] ?? null;
    frames.push({
      completedOperationIds: [...operationOrder],
      readyOperationIds,
      selectedOperationId,
    });
    if (!selectedOperationId) break;
    completed.add(selectedOperationId);
    operationOrder.push(selectedOperationId);
  }
  frames.push({ completedOperationIds: [...operationOrder], readyOperationIds: [], selectedOperationId: null });

  return {
    frames,
    operationOrder,
    complete: operationOrder.length === graph.operations.length,
    contract: STREAM_EVENT_MODEL_CONTRACT,
  } as const;
}
