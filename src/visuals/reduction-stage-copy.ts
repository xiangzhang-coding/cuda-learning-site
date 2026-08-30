// SPDX-License-Identifier: Apache-2.0
import type {
  ReductionStageIssue,
  ReductionStageVariant,
} from './reduction-stage-model';

export type ReductionStageLocale = 'zh-CN' | 'en';

type ReductionStageCopy = Readonly<{
  eyebrow: string;
  title: string;
  summary: string;
  conceptualNotice: string;
  controlsHeading: string;
  variantLabel: string;
  elementCountLabel: string;
  variants: Readonly<Record<ReductionStageVariant, Readonly<{
    label: string;
    description: string;
  }>>>;
  step: string;
  reset: string;
  workbenchHeading: string;
  selectionLabel: string;
  stage: string;
  stageLabels: readonly [string, string, string, string];
  stageDescriptions: readonly [string, string, string, string];
  lane: string;
  activeLane: string;
  inactiveLane: string;
  value: string;
  neutralZero: string;
  activeCount: string;
  finalSum: string;
  staticHeading: string;
  staticIntro: string;
  staticSelection: string;
  statusReady: string;
  statusVariant: string;
  statusElementCount: string;
  statusStep: string;
  statusComplete: string;
  statusReset: string;
  issues: Readonly<Record<ReductionStageIssue, string>>;
  noEvidence: string;
}>;

export const REDUCTION_STAGE_COPY: Readonly<Record<ReductionStageLocale, ReductionStageCopy>> = {
  'zh-CN': {
    eyebrow: 'VIS10 · 8-LANE REDUCTION LEDGER',
    title: 'Reduction tree 与活动通道收缩',
    summary: '用固定整数追踪两种 algorithm variant；每个 reduction stage 都明确标出活动通道与非活动通道（inactive lane）。',
    conceptualNotice: '这是有界、确定性的依赖关系模型，不是 CUDA kernel trace。通道只是 ledger 位置；它不声称某个 GPU thread、warp instruction、barrier 或 memory transaction 已经执行。',
    controlsHeading: 'Reduction stage 控制',
    variantLabel: 'Algorithm variant',
    elementCountLabel: '输入元素数',
    variants: {
      'adjacent-pairs': {
        label: '相邻配对（adjacent pairs）',
        description: '每轮把相邻部分和写入每组最低编号 lane；没有伙伴的尾部值原样进入下一轮。',
      },
      'stride-halving': {
        label: '跨度减半（stride halving）',
        description: '先合并相距 4 的位置，再合并相距 2 与 1 的位置；缺失右侧输入按不参与处理。',
      },
    },
    step: '下一阶段',
    reset: '重置',
    workbenchHeading: '当前 8-lane stage ledger',
    selectionLabel: '当前选择',
    stage: '阶段',
    stageLabels: ['输入', '第一次合并', '第二次合并', '最终和'],
    stageDescriptions: [
      '把所选输入放入 lane；超出 element count 的位置明确为 inactive。',
      '按所选 variant 执行第一轮确定性整数加法。',
      '把上一轮的部分和继续收缩为两个活动位置。',
      'lane 0 保存最终整数和；其余 lane 均为 inactive。',
    ],
    lane: 'Lane',
    activeLane: '活动通道',
    inactiveLane: '非活动通道',
    value: '值',
    neutralZero: '中性值 0',
    activeCount: '活动通道数',
    finalSum: '最终和',
    staticHeading: '完整无脚本 stage ledger',
    staticIntro: '六种 reviewed selection 的四个阶段与全部八个 lane 永久保留。每个 inactive lane 都显式写出中性值 0，不只依赖颜色或空白。',
    staticSelection: '{variant} · {count} 个元素 · 最终和 {sum}',
    statusReady: '模型已就绪：{variant}，{count} 个元素，阶段 1/4。',
    statusVariant: '已选择 {variant}；traversal 重置到阶段 1/4。',
    statusElementCount: '已选择 {count} 个元素；traversal 重置到阶段 1/4。',
    statusStep: '阶段 {stage}/4；{active} 个活动通道。',
    statusComplete: 'Reduction 完成：阶段 4/4，最终和 {sum}；焦点已移到重置按钮。',
    statusReset: 'Reduction traversal 已重置到阶段 1/4；焦点返回 algorithm variant。',
    issues: {
      'invalid-state': '拒绝：model state 无效；上一状态保持不变。',
      'invalid-action': '拒绝：control action 无效；上一状态保持不变。',
      'unknown-variant': '拒绝：algorithm variant 不在 reviewed selection 中。',
      'unknown-element-count': '拒绝：element count 不在 reviewed selection 中。',
      'sequence-complete': 'Reduction 已完成；请重置或更改选择。',
    },
    noEvidence: 'VIS10 不编译或运行 CUDA、不查询 GPU，也不测量时间或性能。这个浏览器 ledger 不授予 Compile-Checked、Community-Observed 或 Runtime-Verified Evidence Status。',
  },
  en: {
    eyebrow: 'VIS10 · 8-LANE REDUCTION LEDGER',
    title: 'Reduction Tree and Contracting Active Lanes',
    summary: 'Trace fixed integers through two algorithm variants. Every reduction stage explicitly distinguishes active and inactive lanes.',
    conceptualNotice: 'This bounded deterministic dependency model is not a CUDA kernel trace. A lane is a ledger position; it does not claim that a GPU thread, warp instruction, barrier, or memory transaction executed.',
    controlsHeading: 'Reduction-stage controls',
    variantLabel: 'Algorithm variant',
    elementCountLabel: 'Input element count',
    variants: {
      'adjacent-pairs': {
        label: 'Adjacent pairs',
        description: 'Each round writes adjacent partial sums to the lowest lane in each group; an unmatched tail value carries forward.',
      },
      'stride-halving': {
        label: 'Stride halving',
        description: 'Combine positions four apart, then two apart, then one apart; a missing right input does not participate.',
      },
    },
    step: 'Next stage',
    reset: 'Reset',
    workbenchHeading: 'Current 8-lane stage ledger',
    selectionLabel: 'Current selection',
    stage: 'Stage',
    stageLabels: ['Input', 'First combine', 'Second combine', 'Final sum'],
    stageDescriptions: [
      'Place the selected inputs in lanes; positions beyond the element count are explicitly inactive.',
      'Apply the first deterministic integer-addition round for the selected variant.',
      'Contract the preceding partial sums to two active positions.',
      'Lane 0 holds the final integer sum; every other lane is inactive.',
    ],
    lane: 'Lane',
    activeLane: 'active lane',
    inactiveLane: 'inactive lane',
    value: 'value',
    neutralZero: 'neutral value 0',
    activeCount: 'Active lane count',
    finalSum: 'Final sum',
    staticHeading: 'Complete no-script stage ledger',
    staticIntro: 'All four stages and all eight lanes remain available for the six reviewed selections. Every inactive lane explicitly states neutral value 0 instead of relying on color or blank space.',
    staticSelection: '{variant} · {count} elements · final sum {sum}',
    statusReady: 'Model ready: {variant}, {count} elements, stage 1 of 4.',
    statusVariant: 'Selected {variant}; traversal reset to stage 1 of 4.',
    statusElementCount: 'Selected {count} elements; traversal reset to stage 1 of 4.',
    statusStep: 'Stage {stage} of 4; {active} active lanes.',
    statusComplete: 'Reduction complete at stage 4 of 4. Final sum {sum}; focus moved to Reset.',
    statusReset: 'Reduction traversal reset to stage 1 of 4; focus returned to Algorithm variant.',
    issues: {
      'invalid-state': 'Rejected: the model state is invalid; the previous state is unchanged.',
      'invalid-action': 'Rejected: the control action is invalid; the previous state is unchanged.',
      'unknown-variant': 'Rejected: the algorithm variant is outside the reviewed selections.',
      'unknown-element-count': 'Rejected: the element count is outside the reviewed selections.',
      'sequence-complete': 'The reduction is complete; reset or change a selection.',
    },
    noEvidence: 'VIS10 compiles and executes no CUDA, queries no GPU, and measures no time or performance. This browser ledger grants no Compile-Checked, Community-Observed, or Runtime-Verified Evidence Status.',
  },
};

export function formatReductionStageCopy(
  template: string,
  values: Readonly<Record<string, string>>,
): string {
  return Object.entries(values).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, value),
    template,
  );
}
