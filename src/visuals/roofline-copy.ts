// SPDX-License-Identifier: Apache-2.0
import type {
  RooflineInputKey,
  RooflineModelRegion,
  RooflineParseIssue,
  RooflinePointRelation,
  RooflineStateIssue,
} from './roofline-model';

export type RooflineLocale = 'zh-CN' | 'en';

type RooflineInputCopy = Readonly<{
  label: string;
  shortLabel: string;
  unit: string;
  help: string;
}>;

export type RooflineCopy = Readonly<{
  eyebrow: string;
  title: string;
  summary: string;
  conceptualNotice: string;
  controlsHeading: string;
  controlsHelp: string;
  inputs: Readonly<Record<RooflineInputKey, RooflineInputCopy>>;
  apply: string;
  reset: string;
  workbenchHeading: string;
  chartAriaLabel: string;
  xAxis: string;
  yAxis: string;
  bandwidthSegment: string;
  computeSegment: string;
  ridgeLabel: string;
  workloadPoint: string;
  ridgeIntensity: string;
  workloadRoof: string;
  modelRegion: string;
  pointRelation: string;
  regions: Readonly<Record<RooflineModelRegion, string>>;
  relations: Readonly<Record<RooflinePointRelation, string>>;
  relationNotes: Readonly<Record<RooflinePointRelation, string>>;
  staticHeading: string;
  staticIntro: string;
  staticTableCaption: string;
  declaredInput: string;
  derivedModelValue: string;
  parameter: string;
  value: string;
  formula: string;
  statusReady: string;
  statusApplied: string;
  statusAboveRoof: string;
  statusInvalid: string;
  statusReset: string;
  parseIssues: Readonly<Record<RooflineParseIssue, string>>;
  stateIssues: Readonly<Record<RooflineStateIssue, string>>;
  noEvidence: string;
}>;

export const ROOFLINE_COPY: Readonly<Record<RooflineLocale, RooflineCopy>> = {
  'zh-CN': {
    eyebrow: 'VIS13 · DECLARED ROOFLINE MODEL',
    title: 'Roofline 模型：声明上限、屋脊点（ridge point）与 workload 点',
    summary: '用四个明确声明的浏览器输入推导单层 Roofline。默认值是合成教学值，不是任何设备事实、测量值或观察结果。',
    conceptualNotice: '这个确定性模型只计算 Pcompute / Bpath 与 min(Pcompute, I × Bpath)。带宽侧、屋脊点和计算侧只是声明参数下的模型区域，不是对实际 workload 的诊断。',
    controlsHeading: '声明的模型输入',
    controlsHelp: '只接受范围内的正十进制数；不接受空值、指数记法、NaN 或 Infinity。单位固定为 Gop/s、十进制 GB/s 与 operations/byte。',
    inputs: {
      computeCeiling: {
        label: '声明的计算上限（Gop/s）',
        shortLabel: '声明计算上限',
        unit: 'Gop/s',
        help: '合成教学输入，不是设备峰值。',
      },
      bandwidthCeiling: {
        label: '声明的带宽上限（十进制 GB/s）',
        shortLabel: '声明带宽上限',
        unit: 'decimal GB/s',
        help: '1 GB = 10^9 bytes；这是声明路径上限。',
      },
      arithmeticIntensity: {
        label: '算术强度（operations/byte）',
        shortLabel: '算术强度',
        unit: 'operations/byte',
        help: '声明 workload 的 work/traffic 比值。',
      },
      achievedRate: {
        label: '达到的 workload rate（Gop/s）',
        shortLabel: 'workload rate',
        unit: 'Gop/s',
        help: '浏览器按输入值绘点，不验证其测量来源。',
      },
    },
    apply: '应用',
    reset: '重置',
    workbenchHeading: '声明输入的模型结果',
    chartAriaLabel: '声明 Roofline 模型图：斜线表示带宽侧 roof，虚线水平线表示计算侧 roof，菱形表示屋脊点，带十字的圆表示 workload 点。',
    xAxis: '算术强度（operations/byte，对数式刻度）',
    yAxis: 'workload rate（Gop/s，对数式刻度）',
    bandwidthSegment: '带宽侧 roof（斜实线）',
    computeSegment: '计算侧 roof（水平虚线）',
    ridgeLabel: '屋脊点',
    workloadPoint: '声明 workload 点',
    ridgeIntensity: '屋脊强度（ridge intensity）',
    workloadRoof: 'workload roof',
    modelRegion: '模型区域',
    pointRelation: '点与声明 roof 的关系',
    regions: {
      'bandwidth-side': '带宽侧模型区域',
      ridge: '模型屋脊点',
      'compute-side': '计算侧模型区域',
    },
    relations: {
      'below-roof': '低于声明 roof',
      'on-roof': '位于声明 roof',
      'above-declared-roof': '高于声明 roof',
    },
    relationNotes: {
      'below-roof': '输入点低于这组声明上限给出的模型 roof。',
      'on-roof': '输入点在数值容差内落在这组声明上限给出的模型 roof。',
      'above-declared-roof': '输入彼此不一致；保留此状态用于审计单位、口径、路径与来源，不把它拒绝或改写成 GPU 证据。',
    },
    staticHeading: '永久静态 Roofline 回退',
    staticIntro: '服务器永久渲染默认合成教学输入的原创 SVG、公式与语义表。禁用 JavaScript 时，图与全部数值仍然可读。',
    staticTableCaption: '默认声明输入与推导值',
    declaredInput: '声明输入',
    derivedModelValue: '推导模型值',
    parameter: '参数',
    value: '值',
    formula: 'ridge = Pcompute / Bpath；roof(I) = min(Pcompute, I × Bpath)',
    statusReady: 'Roofline 模型已就绪；当前显示合成默认输入。',
    statusApplied: '已应用声明输入并更新模型结果。',
    statusAboveRoof: '已应用；workload 点高于声明 roof，请审计单位、口径、路径与来源。',
    statusInvalid: '已拒绝输入；修正标记字段。模型结果和动态图已隐藏。',
    statusReset: '已恢复合成默认输入；焦点返回声明的计算上限。',
    parseIssues: {
      empty: '不能为空',
      'non-decimal': '必须是普通十进制数',
      nonpositive: '必须大于零',
      'out-of-range': '超出声明范围',
    },
    stateIssues: {
      'invalid-state': '拒绝：Roofline state 结构无效。',
      'invalid-action': '拒绝：control action 结构无效。',
      'unknown-input-key': '拒绝：input key 不在模型 contract 中。',
    },
    noEvidence: 'VIS13 不执行 CUDA、不查询设备，也不观察 workload。即使输入来自测量，录入浏览器也不会授予 Evidence Status；测量点必须进入符合要求的 LAB09 Environment Manifest。Compilation、runtime、expected-observation 与 recorded-observation arrays 均为空。',
  },
  en: {
    eyebrow: 'VIS13 · DECLARED ROOFLINE MODEL',
    title: 'Roofline Model: Declared Ceilings, Ridge, and Workload Point',
    summary: 'Derive one Roofline from four explicitly declared browser inputs. The defaults are synthetic teaching values, not device facts, measurements, or observations.',
    conceptualNotice: 'This deterministic model calculates only Pcompute / Bpath and min(Pcompute, I × Bpath). Bandwidth side, ridge, and compute side are regions of the declared model, not diagnoses of an actual workload.',
    controlsHeading: 'Declared model inputs',
    controlsHelp: 'Enter positive plain-decimal values within the shown bounds. Empty values, exponent notation, NaN, and Infinity are rejected. Units are fixed to Gop/s, decimal GB/s, and operations/byte.',
    inputs: {
      computeCeiling: {
        label: 'Declared compute ceiling (Gop/s)',
        shortLabel: 'Declared compute ceiling',
        unit: 'Gop/s',
        help: 'Synthetic teaching input, not a device peak.',
      },
      bandwidthCeiling: {
        label: 'Declared bandwidth ceiling (decimal GB/s)',
        shortLabel: 'Declared bandwidth ceiling',
        unit: 'decimal GB/s',
        help: '1 GB = 10^9 bytes; this is a declared path ceiling.',
      },
      arithmeticIntensity: {
        label: 'Arithmetic intensity (operations/byte)',
        shortLabel: 'Arithmetic intensity',
        unit: 'operations/byte',
        help: 'Declared work-to-traffic ratio for the workload.',
      },
      achievedRate: {
        label: 'Achieved workload rate (Gop/s)',
        shortLabel: 'Workload rate',
        unit: 'Gop/s',
        help: 'The browser plots the input; it does not validate its measurement source.',
      },
    },
    apply: 'Apply',
    reset: 'Reset',
    workbenchHeading: 'Model result for declared inputs',
    chartAriaLabel: 'Declared Roofline model chart: a sloped solid line is the bandwidth-side roof, a horizontal dashed line is the compute-side roof, a diamond is the ridge, and a crossed circle is the workload point.',
    xAxis: 'Arithmetic intensity (operations/byte, log-like scale)',
    yAxis: 'Workload rate (Gop/s, log-like scale)',
    bandwidthSegment: 'Bandwidth-side roof (sloped solid)',
    computeSegment: 'Compute-side roof (horizontal dashed)',
    ridgeLabel: 'Ridge',
    workloadPoint: 'Declared workload point',
    ridgeIntensity: 'Ridge intensity',
    workloadRoof: 'Workload roof',
    modelRegion: 'Model region',
    pointRelation: 'Point relation to declared roof',
    regions: {
      'bandwidth-side': 'Bandwidth-side model region',
      ridge: 'Model ridge',
      'compute-side': 'Compute-side model region',
    },
    relations: {
      'below-roof': 'Below declared roof',
      'on-roof': 'On declared roof',
      'above-declared-roof': 'Above declared roof',
    },
    relationNotes: {
      'below-roof': 'The input point is below the model roof created by these declared ceilings.',
      'on-roof': 'Within the numeric tolerance, the input point lies on the model roof created by these declared ceilings.',
      'above-declared-roof': 'The inputs disagree. Keep this state to audit units, counting rules, path, and provenance; do not reject it or rewrite it as GPU evidence.',
    },
    staticHeading: 'Permanent static Roofline fallback',
    staticIntro: 'The server permanently renders an original SVG, formula, and semantic table for the synthetic default inputs. The chart and every value remain readable without JavaScript.',
    staticTableCaption: 'Default declared inputs and derived values',
    declaredInput: 'Declared input',
    derivedModelValue: 'Derived model value',
    parameter: 'Parameter',
    value: 'Value',
    formula: 'ridge = Pcompute / Bpath; roof(I) = min(Pcompute, I × Bpath)',
    statusReady: 'Roofline model ready with the synthetic default inputs.',
    statusApplied: 'Applied the declared inputs and updated the model result.',
    statusAboveRoof: 'Applied. The workload point is above the declared roof; audit units, counting rules, path, and provenance.',
    statusInvalid: 'Rejected the inputs. Correct the marked fields; the model result and live chart are hidden.',
    statusReset: 'Restored the synthetic defaults; focus returned to Declared compute ceiling.',
    parseIssues: {
      empty: 'cannot be empty',
      'non-decimal': 'must be a plain decimal number',
      nonpositive: 'must be greater than zero',
      'out-of-range': 'is outside the declared range',
    },
    stateIssues: {
      'invalid-state': 'Rejected: the Roofline state shape is invalid.',
      'invalid-action': 'Rejected: the control action shape is invalid.',
      'unknown-input-key': 'Rejected: the input key is outside the model contract.',
    },
    noEvidence: 'VIS13 executes no CUDA, queries no device, and observes no workload. Entering measured values in the browser does not grant an Evidence Status; measured points belong in a qualifying LAB09 Environment Manifest. Compilation, runtime, expected-observation, and recorded-observation arrays are empty.',
  },
};
