// SPDX-License-Identifier: Apache-2.0
import type {
  GemmHierarchyIssue,
  GemmHierarchyLevel,
} from './gemm-hierarchy-model';

export type GemmHierarchyLocale = 'zh-CN' | 'en';

type LevelCopy = Readonly<{
  label: string;
  role: string;
  description: string;
  boundary: string;
}>;

type GemmHierarchyCopy = Readonly<{
  eyebrow: string;
  title: string;
  summary: string;
  conceptualNotice: string;
  controlsHeading: string;
  matrixShapeLabel: string;
  tileShapeLabel: string;
  levelLabel: string;
  reset: string;
  workbenchHeading: string;
  selection: string;
  levels: Readonly<Record<GemmHierarchyLevel, LevelCopy>>;
  shape: string;
  owner: string;
  relation: string;
  boundary: string;
  outputGrid: string;
  kSlices: string;
  threadBlocks: string;
  warpsPerBlock: string;
  operationSlots: string;
  staticHeading: string;
  staticIntro: string;
  statusReady: string;
  statusMatrix: string;
  statusTile: string;
  statusLevel: string;
  statusReset: string;
  issues: Readonly<Record<GemmHierarchyIssue, string>>;
  noEvidence: string;
}>;

export const GEMM_HIERARCHY_COPY: Readonly<Record<GemmHierarchyLocale, GemmHierarchyCopy>> = {
  'zh-CN': {
    eyebrow: 'VIS12 · GEMM HIERARCHY MAP',
    title: 'GEMM Tiling Hierarchy：从 Matrix 到 Instruction',
    summary: '在两个 reviewed problem shapes 与两个 tile shapes 中，逐层核对 matrix、tile、thread block、warp 和 source-level instruction slot。',
    conceptualNotice: '这是确定性的浏览器层级模型，不是 CUDA trace。相同的 tile 与 thread-block shape 表示本教学 mapping 的 ownership，不证明 scheduling、occupancy、emitted FMA/MMA/SASS、latency、throughput 或 speedup。',
    controlsHeading: 'GEMM hierarchy 控制',
    matrixShapeLabel: 'Matrix shape（M×N×K）',
    tileShapeLabel: 'Tile shape（TM×TN×TK）',
    levelLabel: 'Hierarchy level',
    reset: '重置',
    workbenchHeading: '当前 GEMM hierarchy',
    selection: 'Matrix {matrix} · tile {tile} · level {level}',
    levels: {
      matrix: { label: 'Matrix', role: '完整问题', description: 'A[M,K] × B[K,N] -> C[M,N]。', boundary: '只声明 logical matrix contract，不隐含 launch 或 storage layout。' },
      tile: { label: 'Tile', role: '逻辑 work partition', description: '一个 output tile 循环所有 K slices。', boundary: 'Tile 不是 observed hardware schedule。' },
      threadblock: { label: 'Thread block', role: 'CUDA owner', description: '教学 mapping 中一个 thread block 拥有一个 output tile。', boundary: 'Shape 相同只表示 ownership，不表示 occupancy。' },
      warp: { label: 'Warp', role: 'modeled subtile', description: 'Warps 划分 thread-block output footprint。', boundary: '模型不预测 warp scheduling 或 issue order。' },
      instruction: { label: 'Instruction', role: 'source-level operation slot', description: '一个 scalar multiply-accumulate 对一个 output 做贡献。', boundary: 'Compiler-emitted FMA、MMA、SASS 与 execution 全部 unknown。' },
    },
    shape: 'Shape', owner: 'Owner', relation: 'Relation', boundary: 'Boundary',
    outputGrid: 'Output tile grid', kSlices: '每 block 的 K slices', threadBlocks: 'Thread blocks',
    warpsPerBlock: 'Warps / block', operationSlots: 'Modeled scalar slots / warp K-slice',
    staticHeading: '完整无脚本 hierarchy panels',
    staticIntro: '四种 matrix/tile 选择都永久保留五层 panels。Shape、owner、relationship 与 boundary 用文字和边框表达，不依赖颜色。',
    statusReady: '模型已就绪：matrix {matrix}，tile {tile}，level {level}。',
    statusMatrix: '已选择 matrix {matrix}；output grid 与 K slices 已更新。',
    statusTile: '已选择 tile {tile}；thread-block 与 warp 分解已更新。',
    statusLevel: '已选择 {level} level。',
    statusReset: 'GEMM hierarchy 已重置；焦点返回 matrix shape。',
    issues: {
      'invalid-state': '拒绝：model state 无效，上一状态保持不变。',
      'invalid-action': '拒绝：control action 无效，上一状态保持不变。',
      'unknown-matrix-shape': '拒绝：matrix shape 不在 reviewed selections 中。',
      'unknown-tile-shape': '拒绝：tile shape 不在 reviewed selections 中。',
      'unknown-hierarchy-level': '拒绝：hierarchy level 不在 reviewed levels 中。',
    },
    noEvidence: 'VIS12 不编译或运行 CUDA、不查询 GPU、不观察 emitted instruction，也不测量性能。它不授予 Compile-Checked、Community-Observed 或 Runtime-Verified Evidence Status。',
  },
  en: {
    eyebrow: 'VIS12 · GEMM HIERARCHY MAP',
    title: 'GEMM Tiling Hierarchy: Matrix to Instruction',
    summary: 'Audit matrix, tile, thread block, warp, and source-level instruction-slot levels across two reviewed problem shapes and two tile shapes.',
    conceptualNotice: 'This is a deterministic browser hierarchy model, not a CUDA trace. Matching tile and thread-block shapes express ownership in this teaching mapping; they prove no scheduling, occupancy, emitted FMA/MMA/SASS, latency, throughput, or speedup.',
    controlsHeading: 'GEMM hierarchy controls',
    matrixShapeLabel: 'Matrix shape (M×N×K)',
    tileShapeLabel: 'Tile shape (TM×TN×TK)',
    levelLabel: 'Hierarchy level',
    reset: 'Reset',
    workbenchHeading: 'Current GEMM hierarchy',
    selection: 'Matrix {matrix} · tile {tile} · level {level}',
    levels: {
      matrix: { label: 'Matrix', role: 'complete problem', description: 'A[M,K] × B[K,N] -> C[M,N].', boundary: 'Declares only the logical matrix contract, not launch or storage layout.' },
      tile: { label: 'Tile', role: 'logical work partition', description: 'One output tile loops over every K slice.', boundary: 'A tile is not an observed hardware schedule.' },
      threadblock: { label: 'Thread block', role: 'CUDA owner', description: 'One thread block owns one output tile in the teaching mapping.', boundary: 'Matching shapes express ownership, not occupancy.' },
      warp: { label: 'Warp', role: 'modeled subtile', description: 'Warps partition the thread-block output footprint.', boundary: 'The model predicts no warp scheduling or issue order.' },
      instruction: { label: 'Instruction', role: 'source-level operation slot', description: 'One scalar multiply-accumulate contributes to one output.', boundary: 'Compiler-emitted FMA, MMA, SASS, and execution are all unknown.' },
    },
    shape: 'Shape', owner: 'Owner', relation: 'Relation', boundary: 'Boundary',
    outputGrid: 'Output tile grid', kSlices: 'K slices per block', threadBlocks: 'Thread blocks',
    warpsPerBlock: 'Warps per block', operationSlots: 'Modeled scalar slots per warp K-slice',
    staticHeading: 'Complete no-script hierarchy panels',
    staticIntro: 'All four matrix/tile selections permanently retain five hierarchy panels. Text and borders communicate shape, owner, relationship, and boundary without color alone.',
    statusReady: 'Model ready: matrix {matrix}, tile {tile}, level {level}.',
    statusMatrix: 'Selected matrix {matrix}; output grid and K slices were updated.',
    statusTile: 'Selected tile {tile}; thread-block and warp decomposition were updated.',
    statusLevel: 'Selected the {level} level.',
    statusReset: 'GEMM hierarchy reset; focus returned to Matrix shape.',
    issues: {
      'invalid-state': 'Rejected: model state is invalid; the previous state is unchanged.',
      'invalid-action': 'Rejected: the control action is invalid; the previous state is unchanged.',
      'unknown-matrix-shape': 'Rejected: matrix shape is outside the reviewed selections.',
      'unknown-tile-shape': 'Rejected: tile shape is outside the reviewed selections.',
      'unknown-hierarchy-level': 'Rejected: hierarchy level is outside the reviewed levels.',
    },
    noEvidence: 'VIS12 compiles and executes no CUDA, queries no GPU, observes no emitted instruction, and measures no performance. It grants no Compile-Checked, Community-Observed, or Runtime-Verified Evidence Status.',
  },
};

export function formatGemmHierarchyCopy(
  template: string,
  values: Readonly<Record<string, string>>,
): string {
  return Object.entries(values).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, value),
    template,
  );
}
