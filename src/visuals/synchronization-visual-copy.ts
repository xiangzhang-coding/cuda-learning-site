// SPDX-License-Identifier: Apache-2.0

import type {
  WarpDivergencePresetId,
  WarpDivergenceStageId,
} from './warp-divergence-model';
import type {
  StreamEventEditIssue,
  StreamEventOperationKind,
  StreamEventStreamId,
} from './stream-event-model';

export type SynchronizationVisualLocale = 'zh-CN' | 'en';

type WarpDivergenceCopy = Readonly<{
  eyebrow: string;
  title: string;
  summary: string;
  conceptualNotice: string;
  controlsLabel: string;
  presetLabel: string;
  presets: Readonly<Record<WarpDivergencePresetId, string>>;
  step: string;
  reset: string;
  currentStage: string;
  stageCounter: string;
  stages: Readonly<Record<WarpDivergenceStageId, Readonly<{ title: string; description: string }>>>;
  activeMask: string;
  emptyMask: string;
  executed: string;
  skipped: string;
  logicalJoin: string;
  laneTable: string;
  laneTableScrollLabel: string;
  lane: string;
  predicate: string;
  currentState: string;
  predicateTrue: string;
  predicateFalse: string;
  active: string;
  inactive: string;
  participating: string;
  staticHeading: string;
  staticIntro: string;
  staticCaseLabels: Readonly<Record<'lower-half' | 'uniform-true', string>>;
  truePath: string;
  falsePath: string;
  join: string;
  divergent: string;
  uniform: string;
  status: string;
  noEvidence: string;
}>;

export const WARP_DIVERGENCE_COPY: Readonly<Record<SynchronizationVisualLocale, WarpDivergenceCopy>> = {
  'zh-CN': {
    eyebrow: 'VIS03 · 32-LANE PREDICATE TRACE',
    title: 'Warp divergence 与逻辑汇合',
    summary: '选择一个确定性 predicate，逐步查看 32 个 lane 的 participating、true 与 false mask。',
    conceptualNotice: '这是确定性教学路径，不是硬件调度顺序。True path 与 false path 的显示顺序不承诺 GPU 的实际 scheduling；logical join 只表示控制流再次具有共同后继，不是内存同步。CC 7.0+ 的 Independent Thread Scheduling 使隐式 lockstep 假设失效。',
    controlsLabel: 'Warp divergence 控制',
    presetLabel: 'Predicate preset',
    presets: {
      'uniform-true': 'Uniform true（全部 true）',
      'uniform-false': 'Uniform false（全部 false）',
      'lower-half': 'Lower half（lane 0–15 true）',
      alternating: 'Alternating（偶数 lane true）',
      'non-contiguous': 'Non-contiguous（非连续 true）',
    },
    step: '下一阶段',
    reset: '重置 divergence trace',
    currentStage: '当前教学阶段',
    stageCounter: '阶段 {current}/{total}',
    stages: {
      'before-branch': { title: '分支前', description: '32 个 participating lane 都位于 branch 之前。' },
      'predicate-evaluated': { title: 'Predicate 已求值', description: '每个 lane 已得到 true 或 false；两个 mask 互斥且覆盖 participating mask。' },
      'true-path': { title: 'True path', description: '只高亮 predicate 为 true 的 lane；空 mask 会明确标记为“跳过”。' },
      'false-path': { title: 'False path', description: '只高亮 predicate 为 false 的 lane；空 mask 会明确标记为“跳过”。' },
      'logical-join': { title: '逻辑汇合', description: '所有 participating lane 都到达共同的逻辑后继；这不是 barrier 或 memory fence。' },
    },
    activeMask: '当前 active mask',
    emptyMask: '空',
    executed: '已展示',
    skipped: '跳过：该 path 的 mask 为空',
    logicalJoin: '逻辑汇合；不是内存同步',
    laneTable: '32-lane 当前状态表',
    laneTableScrollLabel: '可横向滚动的 32-lane predicate 与当前状态表',
    lane: 'Lane',
    predicate: 'Predicate',
    currentState: '当前状态',
    predicateTrue: 'true',
    predicateFalse: 'false',
    active: 'ACTIVE：参与当前阶段',
    inactive: 'INACTIVE：当前 path 禁用',
    participating: 'PARTICIPATING：位于共同控制流',
    staticHeading: '无脚本完整对照',
    staticIntro: '下面两张 32-row table 始终可见，分别保存 divergent 与 uniform 情况；文字标签与边框共同表达状态，不只依赖颜色。',
    staticCaseLabels: {
      'lower-half': 'Divergent：lower-half predicate',
      'uniform-true': 'Uniform：全部 predicate 为 true',
    },
    truePath: 'True path',
    falsePath: 'False path',
    join: 'Logical join',
    divergent: 'DIVERGENT：两个 path 都非空',
    uniform: 'UNIFORM：false path 跳过',
    status: '{preset}；{stage}；active lanes：{mask}。',
    noEvidence: '此浏览器模型不编译或运行 CUDA，也不产生计时或性能证据；它不会授予 Compile-Checked、Community-Observed 或 Runtime-Verified Evidence Status。',
  },
  en: {
    eyebrow: 'VIS03 · 32-LANE PREDICATE TRACE',
    title: 'Warp divergence and logical join',
    summary: 'Choose a deterministic predicate and step through the participating, true, and false masks for all 32 lanes.',
    conceptualNotice: 'This is a deterministic teaching path, not hardware scheduling. The displayed true-path then false-path order does not promise actual GPU scheduling; the logical join is only a common control-flow successor, not memory synchronization. Independent Thread Scheduling on CC 7.0+ invalidates implicit lockstep assumptions.',
    controlsLabel: 'Warp-divergence controls',
    presetLabel: 'Predicate preset',
    presets: {
      'uniform-true': 'Uniform true (all lanes true)',
      'uniform-false': 'Uniform false (all lanes false)',
      'lower-half': 'Lower half (lanes 0–15 true)',
      alternating: 'Alternating (even lanes true)',
      'non-contiguous': 'Non-contiguous true lanes',
    },
    step: 'Step to next stage',
    reset: 'Reset divergence trace',
    currentStage: 'Current teaching stage',
    stageCounter: 'Stage {current}/{total}',
    stages: {
      'before-branch': { title: 'Before branch', description: 'All 32 participating lanes are before the branch.' },
      'predicate-evaluated': { title: 'Predicate evaluated', description: 'Every lane now has true or false; the masks are disjoint and cover the participating mask.' },
      'true-path': { title: 'True path', description: 'Only lanes with a true predicate are highlighted; an empty mask is explicitly marked skipped.' },
      'false-path': { title: 'False path', description: 'Only lanes with a false predicate are highlighted; an empty mask is explicitly marked skipped.' },
      'logical-join': { title: 'Logical join', description: 'All participating lanes have a common logical successor; this is not a barrier or memory fence.' },
    },
    activeMask: 'Current active mask',
    emptyMask: 'empty',
    executed: 'shown',
    skipped: 'Skipped: this path has an empty mask',
    logicalJoin: 'Logical join; not memory synchronization',
    laneTable: 'Current 32-lane state',
    laneTableScrollLabel: 'Scrollable 32-lane predicate and current-state table',
    lane: 'Lane',
    predicate: 'Predicate',
    currentState: 'Current state',
    predicateTrue: 'true',
    predicateFalse: 'false',
    active: 'ACTIVE: participates in this stage',
    inactive: 'INACTIVE: disabled on this path',
    participating: 'PARTICIPATING: at common control flow',
    staticHeading: 'Complete no-script comparison',
    staticIntro: 'These two 32-row tables remain visible for divergent and uniform cases. Text labels and borders carry meaning in addition to color.',
    staticCaseLabels: {
      'lower-half': 'Divergent: lower-half predicate',
      'uniform-true': 'Uniform: every predicate is true',
    },
    truePath: 'True path',
    falsePath: 'False path',
    join: 'Logical join',
    divergent: 'DIVERGENT: both paths are non-empty',
    uniform: 'UNIFORM: false path skipped',
    status: '{preset}; {stage}; active lanes: {mask}.',
    noEvidence: 'This browser model compiles and executes no CUDA and supplies no timing or performance evidence. It grants no Compile-Checked, Community-Observed, or Runtime-Verified Evidence Status.',
  },
};

type StreamEventCopy = Readonly<{
  eyebrow: string;
  title: string;
  summary: string;
  conceptualNotice: string;
  graphControls: string;
  streamCount: string;
  twoStreams: string;
  threeStreams: string;
  resetGraph: string;
  operationControls: string;
  operationStream: string;
  operationKind: string;
  operationKinds: Readonly<Record<StreamEventOperationKind, string>>;
  addOperation: string;
  eventControls: string;
  recordAfter: string;
  waitBefore: string;
  addEvent: string;
  playbackControls: string;
  play: string;
  pause: string;
  step: string;
  resetTrace: string;
  scrub: string;
  graphHeading: string;
  streamNames: Readonly<Record<StreamEventStreamId, string>>;
  sameStreamOrder: string;
  eventDependencies: string;
  noEdges: string;
  eventEdge: string;
  traceHeading: string;
  frameCounter: string;
  completed: string;
  readySet: string;
  stableChoice: string;
  none: string;
  complete: string;
  waiting: string;
  ready: string;
  selected: string;
  completedState: string;
  staticHeading: string;
  staticIntro: string;
  formulaHeading: string;
  timingCaveats: string;
  orderingBoundary: string;
  pacingBoundary: string;
  operationAdded: string;
  dependencyAdded: string;
  graphReset: string;
  streamCountChanged: string;
  issues: Readonly<Record<StreamEventEditIssue, string>>;
  noEvidence: string;
}>;

export const STREAM_EVENT_COPY: Readonly<Record<SynchronizationVisualLocale, StreamEventCopy>> = {
  'zh-CN': {
    eyebrow: 'VIS07 · ORDERED WORK / EXPLICIT DEPENDENCIES',
    title: 'Stream order 与 event dependency',
    summary: '在两个或三个具名 non-default stream 中添加固定类型 operation，并用 event record/wait 显式建立跨 stream dependency。',
    conceptualNotice: '同一 stream 内的 operation 按 enqueue order 隐式有序；不同 stream 之间没有隐式边。没有路径只表示未排序，不证明并发。Ready set 与稳定 tie-break 是确定性教学 trace，不是 CUDA scheduler trace；浏览器 pacing 不是 CUDA 时间或 runtime evidence。',
    graphControls: 'Graph 配置',
    streamCount: '显式 non-default stream 数量',
    twoStreams: '2 streams',
    threeStreams: '3 streams',
    resetGraph: '重置 graph',
    operationControls: '添加 operation',
    operationStream: '目标 stream',
    operationKind: 'Operation 类型',
    operationKinds: { 'h2d-copy': 'H2D copy', kernel: 'Kernel', 'd2h-copy': 'D2H copy' },
    addOperation: '添加 operation',
    eventControls: '添加 event dependency',
    recordAfter: 'Record event after',
    waitBefore: 'Wait before',
    addEvent: '添加 event record/wait',
    playbackControls: '确定性 trace 控制',
    play: '播放 trace',
    pause: '暂停 trace',
    step: '单步 trace',
    resetTrace: '重置 trace',
    scrub: 'Trace scrubber',
    graphHeading: 'Operation graph',
    streamNames: {
      'prepare-stream': 'Prepare stream（non-default）',
      'consume-stream': 'Consume stream（non-default）',
      'observe-stream': 'Observe stream（non-default）',
    },
    sameStreamOrder: '隐式 same-stream order edges',
    eventDependencies: '显式 event record/wait edges',
    noEdges: '无',
    eventEdge: '{from} -> record({event}) -> wait({event}) -> {to}',
    traceHeading: 'Topological teaching trace',
    frameCounter: 'Frame {current}/{total}',
    completed: '已完成集合',
    readySet: '就绪集（ready set）',
    stableChoice: '稳定 tie-break 选择',
    none: '空',
    complete: 'TRACE COMPLETE',
    waiting: 'WAITING：dependency 尚未满足',
    ready: 'READY：当前无未满足 predecessor',
    selected: 'SELECTED：按稳定 ID tie-break 选择',
    completedState: 'COMPLETED：此前教学步骤已选择',
    staticHeading: '无脚本 graph 与 trace',
    staticIntro: '三条具名 stream、五个 operation、两类 edge 和全部六个 trace frame 永久可见。静态表与互动区来自同一个纯模型。',
    formulaHeading: 'Event elapsed-time 公式边界',
    timingCaveats: 'Timing disabled：event 不记录 timing data。Unrecorded：start 或 stop 尚未 record。Incomplete：已 record 但至少一个 event 尚未完成。这里不生成毫秒值。',
    orderingBoundary: '不同 stream 若没有显式 dependency path，则是未排序（unordered），不证明并发。',
    pacingBoundary: '浏览器 pacing 不是 CUDA 时间、device timestamp 或 Evidence Status。',
    operationAdded: '已添加 {operation}；playback 已停止，trace 已重置。',
    dependencyAdded: '已添加 {event}；playback 已停止，trace 已重置。',
    graphReset: 'Graph 与 trace 已重置。',
    streamCountChanged: '已建立 {count} 条显式 non-default stream；trace 已重置。',
    issues: {
      'unknown-stream': '拒绝：未知 stream。Graph 保持不变。',
      'unknown-operation-kind': '拒绝：operation 类型不在固定 vocabulary 中。Graph 保持不变。',
      'operation-limit-reached': '拒绝：已达到 12 个 operation 的上限。Graph 保持不变。',
      'unknown-operation': '拒绝：record 或 wait operation 未知。Graph 保持不变。',
      'self-dependency': '拒绝：operation 不能等待自己。Graph 保持不变。',
      'duplicate-dependency': '拒绝：event dependency 已存在。Graph 保持不变。',
      'redundant-dependency': '拒绝：现有 dependency path 已提供该顺序。Graph 保持不变。',
      'cyclic-dependency': '拒绝：该 edge 会形成 cycle。Graph 保持不变。',
    },
    noEvidence: '此浏览器模型不编译或运行 CUDA，也不测量 device time；graph、trace 与动画不会授予 Compile-Checked、Community-Observed 或 Runtime-Verified Evidence Status。',
  },
  en: {
    eyebrow: 'VIS07 · ORDERED WORK / EXPLICIT DEPENDENCIES',
    title: 'Stream order and event dependencies',
    summary: 'Add fixed-vocabulary operations to two or three named non-default streams, then express cross-stream dependencies with event record and wait.',
    conceptualNotice: 'Operations in one stream are implicitly ordered by enqueue order; different streams receive no implicit edge. No path means unordered, not proven concurrent. The ready set and stable tie-break form a deterministic teaching trace, not a CUDA scheduler trace; browser pacing is not CUDA time or runtime evidence.',
    graphControls: 'Graph configuration',
    streamCount: 'Explicit non-default stream count',
    twoStreams: '2 streams',
    threeStreams: '3 streams',
    resetGraph: 'Reset graph',
    operationControls: 'Add operation',
    operationStream: 'Target stream',
    operationKind: 'Operation kind',
    operationKinds: { 'h2d-copy': 'H2D copy', kernel: 'Kernel', 'd2h-copy': 'D2H copy' },
    addOperation: 'Add operation',
    eventControls: 'Add event dependency',
    recordAfter: 'Record event after',
    waitBefore: 'Wait before',
    addEvent: 'Add event record/wait',
    playbackControls: 'Deterministic trace controls',
    play: 'Play trace',
    pause: 'Pause trace',
    step: 'Step trace',
    resetTrace: 'Reset trace',
    scrub: 'Trace scrubber',
    graphHeading: 'Operation graph',
    streamNames: {
      'prepare-stream': 'Prepare stream (non-default)',
      'consume-stream': 'Consume stream (non-default)',
      'observe-stream': 'Observe stream (non-default)',
    },
    sameStreamOrder: 'Implicit same-stream order edges',
    eventDependencies: 'Explicit event record/wait edges',
    noEdges: 'none',
    eventEdge: '{from} -> record({event}) -> wait({event}) -> {to}',
    traceHeading: 'Topological teaching trace',
    frameCounter: 'Frame {current}/{total}',
    completed: 'Completed set',
    readySet: 'Ready set',
    stableChoice: 'Stable tie-break choice',
    none: 'empty',
    complete: 'TRACE COMPLETE',
    waiting: 'WAITING: a dependency is not satisfied',
    ready: 'READY: no unsatisfied predecessor',
    selected: 'SELECTED: chosen by stable ID tie-break',
    completedState: 'COMPLETED: selected by an earlier teaching step',
    staticHeading: 'No-script graph and trace',
    staticIntro: 'Three named streams, five operations, both edge classes, and all six trace frames remain visible. The static tables and workbench use the same pure model.',
    formulaHeading: 'Event elapsed-time formula boundary',
    timingCaveats: 'Timing disabled: the event records no timing data. Unrecorded: start or stop has not been recorded. Incomplete: both were recorded but at least one event has not completed. No millisecond value is generated here.',
    orderingBoundary: 'Different streams without an explicit dependency path are unordered, not proven concurrent.',
    pacingBoundary: 'Browser pacing is not CUDA time, a device timestamp, or Evidence Status.',
    operationAdded: 'Added {operation}; playback stopped and the trace reset.',
    dependencyAdded: 'Added {event}; playback stopped and the trace reset.',
    graphReset: 'Graph and trace reset.',
    streamCountChanged: 'Created {count} explicit non-default streams; trace reset.',
    issues: {
      'unknown-stream': 'Rejected: unknown stream. The graph is unchanged.',
      'unknown-operation-kind': 'Rejected: the operation kind is outside the fixed vocabulary. The graph is unchanged.',
      'operation-limit-reached': 'Rejected: the 12-operation bound was reached. The graph is unchanged.',
      'unknown-operation': 'Rejected: the record or wait operation is unknown. The graph is unchanged.',
      'self-dependency': 'Rejected: an operation cannot wait for itself. The graph is unchanged.',
      'duplicate-dependency': 'Rejected: that event dependency already exists. The graph is unchanged.',
      'redundant-dependency': 'Rejected: an existing dependency path already provides that order. The graph is unchanged.',
      'cyclic-dependency': 'Rejected: that edge would create a cycle. The graph is unchanged.',
    },
    noEvidence: 'This browser model compiles and executes no CUDA and measures no device time. Its graph, trace, and animation grant no Compile-Checked, Community-Observed, or Runtime-Verified Evidence Status.',
  },
};
