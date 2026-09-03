// SPDX-License-Identifier: Apache-2.0
import type { AttentionIoIssue, AttentionIoStage } from './attention-io-model';

export type AttentionIoLocale = 'zh-CN' | 'en';

type AttentionStageCopy = Readonly<{
  label: string;
  equation: string;
  materializedNode: string;
  tiledNode: string;
  materialized: string;
  tiled: string;
  boundary: string;
}>;

type AttentionIoCopy = Readonly<{
  eyebrow: string;
  title: string;
  summary: string;
  conceptualNotice: string;
  controlsHeading: string;
  sequenceShapeLabel: string;
  tileShapeLabel: string;
  stageLabel: string;
  reset: string;
  workbenchHeading: string;
  selection: string;
  stages: Readonly<Record<AttentionIoStage, AttentionStageCopy>>;
  queryTiles: string;
  keyTiles: string;
  scoreTiles: string;
  fullScore: string;
  temporaryTile: string;
  materializedPath: string;
  tiledPath: string;
  stageTraffic: string;
  totalTraffic: string;
  elements: string;
  analysisHeading: string;
  analysisText: string;
  staticHeading: string;
  staticIntro: string;
  staticScrollHint: string;
  diagramTitle: string;
  diagramDescription: string;
  diagramMaterialized: string;
  diagramTiled: string;
  ledgerSequence: string;
  ledgerTile: string;
  ledgerQueryTiles: string;
  ledgerKeyTiles: string;
  ledgerScoreTiles: string;
  ledgerMaterialized: string;
  ledgerTiled: string;
  ledgerDifference: string;
  statusReady: string;
  statusSequence: string;
  statusTile: string;
  statusStage: string;
  statusReset: string;
  issues: Readonly<Record<AttentionIoIssue, string>>;
  noEvidence: string;
}>;

export const ATTENTION_IO_COPY: Readonly<Record<AttentionIoLocale, AttentionIoCopy>> = {
  'zh-CN': {
    eyebrow: 'VIS18 · ATTENTION IO LEDGER',
    title: 'Attention Memory Traffic：看见被物化与被保留的数据',
    summary: '选择 sequence、query/key tile 与算法阶段，对照完整 S/P 物化路径和 exact query-outer tiled recurrence 的 logical slow/fast-store traffic。',
    conceptualNotice: '这是确定性的 FP32 静态分析，不是 CUDA trace。账本不模拟 cache line、DRAM transaction、resource pressure 或 spill，也不预测 timing、bandwidth、backend、最佳 tile 或 speedup。',
    controlsHeading: 'Attention IO 控制',
    sequenceShapeLabel: 'Sequence shape（N×d）',
    tileShapeLabel: 'Score tile（Br×Bc）',
    stageLabel: '算法阶段',
    reset: '重置',
    workbenchHeading: '当前 attention IO 账本',
    selection: 'N×d {sequence} · Br×Bc {tile} · {stage}',
    stages: {
      score: {
        label: 'Score',
        equation: 'S = QK^T / sqrt(d)',
        materializedNode: 'Q,K -> S',
        tiledNode: 'Q,K -> Br×Bc',
        materialized: '读取 Q、K，并把完整 N×N score matrix S 写到 declared slow store。',
        tiled: '每个 query tile 保留 Q，扫过 K tiles；只在 fast store 中形成 Br×Bc temporary scores。',
        boundary: 'K 会按 query-tile count 重读；cache 是否命中不在此 logical ledger 中。',
      },
      normalize: {
        label: 'Normalize',
        equation: 'P = row_softmax(S)',
        materializedNode: 'S -> P',
        tiledNode: '(m,l) merge',
        materialized: '稳定三遍 normalization 读取 S 三次，再把完整 probability matrix P 写出。',
        tiled: 'Online max/sum state 在 tile 间重标定；S/P 不跨 declared slow/fast boundary。',
        boundary: '零字节只表示此阶段没有计入 slow-store transfer，不表示 normalization 没有算术工作。',
      },
      value: {
        label: 'Value',
        equation: 'O = PV',
        materializedNode: 'P,V -> O',
        tiledNode: 'V,a -> O',
        materialized: '读取完整 P 和 V，再写 O。',
        tiled: 'V 随每个 query tile 扫过；weighted accumulator 留在 fast store，最后写 O。',
        boundary: 'Exact tiled recurrence 会交错 normalization 与 value aggregation；这里按概念贡献分账。',
      },
    },
    queryTiles: 'Query tiles',
    keyTiles: 'Key/value tiles',
    scoreTiles: 'Temporary score tiles',
    fullScore: '完整 S 元素数',
    temporaryTile: '单个临时 score tile',
    materializedPath: '完整 S/P 物化',
    tiledPath: 'Exact tiled recurrence',
    stageTraffic: '当前阶段流量',
    totalTraffic: '三阶段总流量',
    elements: 'elements',
    analysisHeading: '只读这个差值，不能读出速度',
    analysisText: '差值是两个明确调度在本 logical boundary 下的请求量之差。它没有观测 cache、transaction、occupancy、同步、编译器或 elapsed time，因此不是性能结论。',
    staticHeading: 'Purpose-built 静态 IO 图与完整账本',
    staticIntro: '无脚本图同时保留 score、normalize、value 三阶段；下表永久列出四组 shape/tile 选择。颜色之外还使用路径名称、文字、边框与数值。',
    staticScrollHint: '窄屏可在图和表内横向滚动；页面本身不会横向溢出。',
    diagramTitle: 'Attention 三阶段的物化路径与 exact tiled 路径',
    diagramDescription: '上轨把完整 S 和 P 写入慢存储，下轨只保留 temporary score tile 与 online row state，并在最后写 O。所有字节数来自默认 N=8、d=4、Br=Bc=4 的静态账本。',
    diagramMaterialized: '物化 S/P',
    diagramTiled: 'Tiled + row state',
    ledgerSequence: 'N×d',
    ledgerTile: 'Br×Bc',
    ledgerQueryTiles: 'Q tiles',
    ledgerKeyTiles: 'K/V tiles',
    ledgerScoreTiles: 'Score tiles',
    ledgerMaterialized: '物化 bytes',
    ledgerTiled: 'Tiled bytes',
    ledgerDifference: '分析差值',
    statusReady: '模型已就绪：N×d {sequence}，Br×Bc {tile}，阶段 {stage}。',
    statusSequence: '已选择 sequence {sequence}；完整矩阵和总流量已更新。',
    statusTile: '已选择 tile {tile}；tile counts 与 K/V replay 已更新。',
    statusStage: '已选择 {stage} 阶段。',
    statusReset: 'Attention IO 账本已重置；焦点返回 Sequence shape。',
    issues: {
      'invalid-state': '拒绝：model state 无效，上一状态保持不变。',
      'invalid-action': '拒绝：control action 无效，上一状态保持不变。',
      'unknown-sequence-shape': '拒绝：sequence shape 不在 reviewed selections 中。',
      'unknown-tile-shape': '拒绝：tile shape 不在 reviewed selections 中。',
      'unknown-stage': '拒绝：stage 不在 reviewed attention stages 中。',
    },
    noEvidence: 'VIS18 不编译或运行 CUDA、不查询 GPU，也不测量 memory transaction、timing 或性能。它不授予 Compile-Checked、Community-Observed 或 Runtime-Verified Evidence Status。',
  },
  en: {
    eyebrow: 'VIS18 · ATTENTION IO LEDGER',
    title: 'Attention Memory Traffic: Materialize It or Keep It Resident',
    summary: 'Select a sequence, query/key tile, and algorithm stage to compare full S/P materialization with the logical slow/fast-store traffic of an exact query-outer tiled recurrence.',
    conceptualNotice: 'This is deterministic FP32 static analysis, not a CUDA trace. The ledger models no cache line, DRAM transaction, resource pressure, or spill and predicts no timing, bandwidth, backend, best tile, or speedup.',
    controlsHeading: 'Attention IO controls',
    sequenceShapeLabel: 'Sequence shape (N×d)',
    tileShapeLabel: 'Score tile (Br×Bc)',
    stageLabel: 'Algorithm stage',
    reset: 'Reset',
    workbenchHeading: 'Current attention IO ledger',
    selection: 'N×d {sequence} · Br×Bc {tile} · {stage}',
    stages: {
      score: {
        label: 'Score',
        equation: 'S = QK^T / sqrt(d)',
        materializedNode: 'Q,K -> S',
        tiledNode: 'Q,K -> Br×Bc',
        materialized: 'Read Q and K, then write the full N×N score matrix S to the declared slow store.',
        tiled: 'Retain each Q tile while sweeping K tiles; form only a Br×Bc temporary score tile in fast storage.',
        boundary: 'K is reread per query tile. Whether a cache serves a request is outside this logical ledger.',
      },
      normalize: {
        label: 'Normalize',
        equation: 'P = row_softmax(S)',
        materializedNode: 'S -> P',
        tiledNode: '(m,l) merge',
        materialized: 'Stable three-pass normalization reads S three times, then writes the full probability matrix P.',
        tiled: 'Online max/sum state is rescaled across tiles; neither S nor P crosses the declared slow/fast boundary.',
        boundary: 'Zero bytes means no counted slow-store transfer in this stage, not zero normalization arithmetic.',
      },
      value: {
        label: 'Value',
        equation: 'O = PV',
        materializedNode: 'P,V -> O',
        tiledNode: 'V,a -> O',
        materialized: 'Read the full P and V, then write O.',
        tiled: 'Sweep V for every query tile, retain the weighted accumulator in fast storage, then write O.',
        boundary: 'The exact tiled recurrence interleaves normalization and value aggregation; this ledger groups conceptual contributions.',
      },
    },
    queryTiles: 'Query tiles',
    keyTiles: 'Key/value tiles',
    scoreTiles: 'Temporary score tiles',
    fullScore: 'Full S elements',
    temporaryTile: 'One temporary score tile',
    materializedPath: 'Full S/P materialization',
    tiledPath: 'Exact tiled recurrence',
    stageTraffic: 'Selected-stage traffic',
    totalTraffic: 'Three-stage total',
    elements: 'elements',
    analysisHeading: 'Read the difference, not a speed claim',
    analysisText: 'The difference compares two declared schedules at one logical boundary. It observes no cache, transaction, occupancy, synchronization, compiler, or elapsed time, so it is not a performance result.',
    staticHeading: 'Purpose-built static IO diagram and complete ledger',
    staticIntro: 'The no-script diagram retains score, normalize, and value stages together; the table permanently lists all four shape/tile selections. Path names, text, borders, and numbers carry meaning in addition to color.',
    staticScrollHint: 'On a narrow screen, scroll within the diagram and table; the page itself does not overflow horizontally.',
    diagramTitle: 'Materialized and exact tiled paths through three attention stages',
    diagramDescription: 'The upper track writes full S and P to slow storage. The lower track retains a temporary score tile and online row state before writing O. Every byte count uses the default N=8, d=4, Br=Bc=4 static ledger.',
    diagramMaterialized: 'Materialize S/P',
    diagramTiled: 'Tile + row state',
    ledgerSequence: 'N×d',
    ledgerTile: 'Br×Bc',
    ledgerQueryTiles: 'Q tiles',
    ledgerKeyTiles: 'K/V tiles',
    ledgerScoreTiles: 'Score tiles',
    ledgerMaterialized: 'Materialized bytes',
    ledgerTiled: 'Tiled bytes',
    ledgerDifference: 'Analysis difference',
    statusReady: 'Model ready: N×d {sequence}, Br×Bc {tile}, stage {stage}.',
    statusSequence: 'Selected sequence {sequence}; full matrices and total traffic were updated.',
    statusTile: 'Selected tile {tile}; tile counts and K/V replay were updated.',
    statusStage: 'Selected the {stage} stage.',
    statusReset: 'Attention IO ledger reset; focus returned to Sequence shape.',
    issues: {
      'invalid-state': 'Rejected: model state is invalid; the previous state is unchanged.',
      'invalid-action': 'Rejected: the control action is invalid; the previous state is unchanged.',
      'unknown-sequence-shape': 'Rejected: sequence shape is outside the reviewed selections.',
      'unknown-tile-shape': 'Rejected: tile shape is outside the reviewed selections.',
      'unknown-stage': 'Rejected: stage is outside the reviewed attention stages.',
    },
    noEvidence: 'VIS18 compiles and executes no CUDA, queries no GPU, and measures no memory transaction, timing, or performance. It grants no Compile-Checked, Community-Observed, or Runtime-Verified Evidence Status.',
  },
};

export function formatAttentionIoCopy(
  template: string,
  values: Readonly<Record<string, string>>,
): string {
  return Object.entries(values).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, value),
    template,
  );
}
