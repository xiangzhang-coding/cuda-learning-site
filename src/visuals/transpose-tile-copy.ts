// SPDX-License-Identifier: Apache-2.0
import type {
  TransposeTileIssue,
  TransposeTileLayout,
} from './transpose-tile-model';

export type TransposeTileLocale = 'zh-CN' | 'en';

type TransposeTileCopy = Readonly<{
  eyebrow: string;
  title: string;
  summary: string;
  conceptualNotice: string;
  controlsHeading: string;
  tileSizeLabel: string;
  layoutLabel: string;
  paddingLabel: string;
  layouts: Readonly<Record<TransposeTileLayout, Readonly<{
    label: string;
    description: string;
  }>>>;
  paddingOptions: Readonly<Record<'0' | '1', string>>;
  reset: string;
  workbenchHeading: string;
  currentSelection: string;
  inputHeading: string;
  inputIntro: string;
  outputHeading: string;
  outputIntro: string;
  physicalHeading: string;
  physicalIntro: string;
  row: string;
  column: string;
  input: string;
  output: string;
  inputIndex: string;
  outputIndex: string;
  physicalSlot: string;
  dataSlot: string;
  paddingSlot: string;
  noPaddingSlots: string;
  staticHeading: string;
  staticIntro: string;
  staticSelection: string;
  staticPhysical: string;
  statusReady: string;
  statusTileSize: string;
  statusLayout: string;
  statusPadding: string;
  statusReset: string;
  issues: Readonly<Record<TransposeTileIssue, string>>;
  noEvidence: string;
}>;

export const TRANSPOSE_TILE_COPY: Readonly<Record<TransposeTileLocale, TransposeTileCopy>> = {
  'zh-CN': {
    eyebrow: 'VIS11 · TRANSPOSE TILE ROUTING BOARD',
    title: 'Tiled transpose：逻辑映射与物理 padding',
    summary: '沿着一个有界方形 tile 追踪 input(row, col) 到 output(col, row)，并把逻辑顺序与 shared-memory 物理槽位分开。',
    conceptualNotice: '这是确定性的浏览器地址模型，不是 CUDA kernel trace。Shared layout 与 padding 只改变本模型中的物理槽位坐标；它们不证明 GPU transaction、bank conflict、latency、bandwidth 或 speedup。',
    controlsHeading: 'Transpose tile 控制',
    tileSizeLabel: '方形 tile size',
    layoutLabel: 'Shared logical layout',
    paddingLabel: '每行 physical padding',
    layouts: {
      'input-row-major': {
        label: 'Input row-major',
        description: 'Shared 数据槽按 input(row, col) 排列。',
      },
      'output-row-major': {
        label: 'Output row-major',
        description: 'Shared 数据槽按 output(col, row) 排列。',
      },
    },
    paddingOptions: {
      '0': '0 个 padding 槽',
      '1': '每行 1 个 padding 槽',
    },
    reset: '重置',
    workbenchHeading: '当前 transpose tile routing board',
    currentSelection: '当前选择',
    inputHeading: 'Before：input row-major',
    inputIntro: '按 inputIndex 从小到大排列；每个 cell 同时写出它映射到的 output 坐标。',
    outputHeading: 'After：output row-major',
    outputIntro: '按 outputIndex 从小到大排列；每个 cell 同时写出来源 input 坐标。',
    physicalHeading: 'Physical shared rows',
    physicalIntro: '行步长 = tileSize + padding。Padding 槽没有逻辑 cell，也不进入 transpose 输出。',
    row: '行',
    column: '列',
    input: '输入',
    output: '输出',
    inputIndex: 'I',
    outputIndex: 'O',
    physicalSlot: 'S',
    dataSlot: '数据槽',
    paddingSlot: 'Padding 槽，无逻辑值',
    noPaddingSlots: 'Padding 槽：无；每行只有数据槽。',
    staticHeading: '完整无脚本 before / after 与 physical layouts',
    staticIntro: '四种 tile-size/padding selection 均永久包含 input、output，以及 input-row-major 与 output-row-major 两套 physical shared rows。坐标、index、slot 类型与 padding 文字不依赖颜色。',
    staticSelection: '{size} × {size} tile · padding {padding} · physical stride {stride}',
    staticPhysical: '{layout} physical layout · stride {stride}',
    statusReady: '模型已就绪：{size} × {size}，{layout}，padding {padding}，physical stride {stride}。',
    statusTileSize: '已选择 {size} × {size} tile；physical stride {stride}。',
    statusLayout: '已选择 {layout}；physical 槽位已重新排列。',
    statusPadding: '已选择 padding {padding}；physical stride {stride}。',
    statusReset: 'Transpose tile 已重置到 4 × 4、Input row-major、padding 0；焦点返回方形 tile size。',
    issues: {
      'invalid-state': '拒绝：model state 无效；上一状态保持不变。',
      'invalid-action': '拒绝：control action 无效；上一状态保持不变。',
      'unknown-tile-size': '拒绝：tile size 不在 reviewed selection 中。',
      'unknown-layout': '拒绝：logical layout 不在 reviewed selection 中。',
      'unknown-padding': '拒绝：padding 不在 reviewed selection 中。',
    },
    noEvidence: 'VIS11 不编译或运行 CUDA、不查询 GPU，也不测量时间或性能。这个浏览器模型不提供执行或速度证据，也不授予 Compile-Checked、Community-Observed 或 Runtime-Verified Evidence Status。',
  },
  en: {
    eyebrow: 'VIS11 · TRANSPOSE TILE ROUTING BOARD',
    title: 'Tiled Transpose: Logical Mapping and Physical Padding',
    summary: 'Trace input(row, col) to output(col, row) across one bounded square tile while keeping logical order separate from physical shared-memory slots.',
    conceptualNotice: 'This is a deterministic browser address model, not a CUDA kernel trace. Shared layout and padding change only physical slot coordinates in this model; they prove no GPU transaction, bank conflict, latency, bandwidth, or speedup.',
    controlsHeading: 'Transpose-tile controls',
    tileSizeLabel: 'Square tile size',
    layoutLabel: 'Shared logical layout',
    paddingLabel: 'Physical padding per row',
    layouts: {
      'input-row-major': {
        label: 'Input row-major',
        description: 'Shared data slots are arranged by input(row, col).',
      },
      'output-row-major': {
        label: 'Output row-major',
        description: 'Shared data slots are arranged by output(col, row).',
      },
    },
    paddingOptions: {
      '0': '0 padding slots',
      '1': '1 padding slot per row',
    },
    reset: 'Reset',
    workbenchHeading: 'Current transpose-tile routing board',
    currentSelection: 'Current selection',
    inputHeading: 'Before: input row-major',
    inputIntro: 'Ordered by inputIndex; every cell also names its mapped output coordinate.',
    outputHeading: 'After: output row-major',
    outputIntro: 'Ordered by outputIndex; every cell also names its source input coordinate.',
    physicalHeading: 'Physical shared rows',
    physicalIntro: 'Row stride = tileSize + padding. A padding slot has no logical cell and does not enter the transpose output.',
    row: 'row',
    column: 'column',
    input: 'input',
    output: 'output',
    inputIndex: 'I',
    outputIndex: 'O',
    physicalSlot: 'S',
    dataSlot: 'data slot',
    paddingSlot: 'padding slot, no logical value',
    noPaddingSlots: 'Padding slots: none; every row contains data slots only.',
    staticHeading: 'Complete no-script before, after, and physical layouts',
    staticIntro: 'All four tile-size/padding selections permanently contain input, output, and both input-row-major and output-row-major physical shared rows. Coordinates, indices, slot types, and padding text do not depend on color.',
    staticSelection: '{size} × {size} tile · padding {padding} · physical stride {stride}',
    staticPhysical: '{layout} physical layout · stride {stride}',
    statusReady: 'Model ready: {size} × {size}, {layout}, padding {padding}, physical stride {stride}.',
    statusTileSize: 'Selected a {size} × {size} tile; physical stride {stride}.',
    statusLayout: 'Selected {layout}; physical slots were rearranged.',
    statusPadding: 'Selected padding {padding}; physical stride {stride}.',
    statusReset: 'Transpose tile reset to 4 × 4, Input row-major, padding 0; focus returned to Square tile size.',
    issues: {
      'invalid-state': 'Rejected: the model state is invalid; the previous state is unchanged.',
      'invalid-action': 'Rejected: the control action is invalid; the previous state is unchanged.',
      'unknown-tile-size': 'Rejected: the tile size is outside the reviewed selections.',
      'unknown-layout': 'Rejected: the logical layout is outside the reviewed selections.',
      'unknown-padding': 'Rejected: the padding is outside the reviewed selections.',
    },
    noEvidence: 'VIS11 compiles and executes no CUDA, queries no GPU, and measures no time or performance. This browser model provides no execution or speed evidence and grants no Compile-Checked, Community-Observed, or Runtime-Verified Evidence Status.',
  },
};

export function formatTransposeTileCopy(
  template: string,
  values: Readonly<Record<string, string>>,
): string {
  return Object.entries(values).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, value),
    template,
  );
}
