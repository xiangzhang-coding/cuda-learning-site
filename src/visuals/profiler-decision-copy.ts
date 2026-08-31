// SPDX-License-Identifier: Apache-2.0
import type {
  ProfilerDecisionIssue,
  ProfilerDecisionNextGate,
  ProfilerDecisionSymptom,
  ProfilerDecisionTool,
} from './profiler-decision-model';

export type ProfilerDecisionLocale = 'zh-CN' | 'en';

type ToolCopy = Readonly<{
  label: string;
  scope: string;
  artifact: string;
  use: string;
  boundary: string;
}>;

type SymptomCopy = Readonly<{
  label: string;
  why: string;
  inspect: string;
}>;

export type ProfilerDecisionCopy = Readonly<{
  eyebrow: string;
  title: string;
  summary: string;
  conceptualNotice: string;
  controlsHeading: string;
  symptomLabel: string;
  reset: string;
  workbenchHeading: string;
  selectedSymptom: string;
  recommendedTool: string;
  scope: string;
  artifact: string;
  why: string;
  inspect: string;
  next: string;
  boundary: string;
  recommended: string;
  tools: Readonly<Record<ProfilerDecisionTool, ToolCopy>>;
  symptoms: Readonly<Record<ProfilerDecisionSymptom, SymptomCopy>>;
  nextGates: Readonly<Record<ProfilerDecisionNextGate, string>>;
  staticHeading: string;
  staticIntro: string;
  treeStart: string;
  gateQuestion: string;
  systemsBranch: string;
  computeBranch: string;
  statusReady: string;
  statusSelected: string;
  statusReset: string;
  issues: Readonly<Record<ProfilerDecisionIssue, string>>;
  noEvidence: string;
}>;

export const PROFILER_DECISION_COPY: Readonly<Record<ProfilerDecisionLocale, ProfilerDecisionCopy>> = {
  'zh-CN': {
    eyebrow: 'VIS14 · PROFILER DECISION PATH',
    title: 'Nsight Systems versus Nsight Compute：从症状选择下一份证据',
    summary: '从六种可观察症状出发，先决定需要 application timeline，还是已经具备 selected kernel 加具体问题的 kernel-level gate。',
    conceptualNotice: '这是确定性的浏览器决策模型，不会启动 profiler，也不会分析 report。它只推荐下一种证据来源，不会识别 bottleneck，也不会发布 metric、timing、throughput 或 speedup 结论。Nsight Systems 与 Nsight Compute 的能力存在重叠；这些分支表达本站课程的证据顺序，不是完整功能对照表。',
    controlsHeading: 'Profiler evidence 控制',
    symptomLabel: '可观察症状',
    reset: '重置',
    workbenchHeading: '下一份证据',
    selectedSymptom: '已选症状',
    recommendedTool: '推荐工具',
    scope: '分析范围',
    artifact: '预期 artifact',
    why: '为什么',
    inspect: '先检查',
    next: '下一道 gate',
    boundary: '边界',
    recommended: '推荐的下一份证据',
    tools: {
      'nsight-systems': {
        label: 'Nsight Systems',
        scope: 'Application timeline',
        artifact: '.nsys-rep',
        use: '关联 CPU threads、CUDA API、kernels、copies、streams、dependencies、gaps 与 overlap，定位工作并选择后续问题。',
        boundary: 'Timeline 可以定位工作并选定 kernel instance，但不会自动回答详细 kernel metric 问题。',
      },
      'nsight-compute': {
        label: 'Nsight Compute',
        scope: 'Selected kernel',
        artifact: '.ncu-rep',
        use: '只在选定精确 kernel instance 与具体问题后，查询当前 GPU/tool 的 section 或 metric 可用性并收集最小证据。',
        boundary: 'Collection 可能 replay 或序列化工作；必须记录 permission、version 与 replay，且不能替代 application timeline 诊断。',
      },
    },
    symptoms: {
      'whole-workload-slow': {
        label: '端到端 workload 变慢，但我不知道时间花在哪里。',
        why: '问题范围仍是完整 application，尚未建立 kernel-level hypothesis。',
        inspect: '先看 CPU/GPU activity、CUDA API、copies、kernels、gaps 与 dependencies 的时间关系。',
      },
      'cpu-or-launch-gaps': {
        label: 'GPU bursts 之间有空隙，或 CPU/CUDA launch overhead 可能重要。',
        why: 'CPU 与 GPU 的跨域因果关系需要 application timeline。',
        inspect: '检查 CPU threads、CUDA API duration、launch cadence 与 GPU idle gaps。',
      },
      'copy-overlap-unclear': {
        label: 'Copy 与 kernel 似乎没有 overlap，或 stream/dependency 顺序不清楚。',
        why: 'Overlap 是 exact timeline observation，不是 capability field 或 source ordering 推断。',
        inspect: '检查 copies、kernels、streams、events 与 dependency edges 的时间区间。',
      },
      'kernel-not-selected': {
        label: '运行了多个 kernels；我尚未选定要调查的精确 kernel instance。',
        why: 'Nsight Compute 需要明确 target；先用 timeline 确定 application context 与 instance。',
        inspect: '按 phase、kernel identity、invocation 与 stream 选择一个候选，再写具体问题。',
      },
      'selected-kernel-memory-question': {
        label: '已选定一个 kernel instance，并提出了具体的 memory-traffic 或 throughput 问题。',
        why: 'Kernel 与问题都已确定，可以收集问题所需的最小 section/metric 集。',
        inspect: '先查询当前 GPU/tool 上相关 metric/section 的名称、单位与 availability。',
      },
      'selected-kernel-execution-question': {
        label: '已选定一个 kernel instance，并提出了具体的 launch、occupancy、scheduler、instruction 或 source 问题。',
        why: '问题属于 selected kernel，但 metric domain 仍必须明确且受版本与架构约束。',
        inspect: '查询对应 section/metric，固定 kernel filter，并记录 replay 与 counter permission。',
      },
    },
    nextGates: {
      'form-timeline-hypothesis': '从 representative timeline 写出一个可证伪的 application-level hypothesis。',
      'select-kernel-and-question': '选定一个精确 kernel instance，并把症状改写成一个 kernel-level question。',
      'test-kernel-hypothesis': '只收集回答当前 question 所需的 sections/metrics，再回到完整 application 验证。',
    },
    staticHeading: '完整静态 decision tree',
    staticIntro: '六个 symptoms 永久映射到同一条 gate。四个分支先到 Nsight Systems，两个分支只有在 kernel 与 question 均已选择后才到 Nsight Compute。',
    treeStart: '从一个可观察症状开始；不要从喜欢的工具或一长串 metrics 开始。',
    gateQuestion: '代表性 timeline 是否已经选定一个精确 kernel instance，而且当前问题是否属于 kernel level？',
    systemsBranch: '否 → 先使用 Nsight Systems',
    computeBranch: '是 → 下一步使用 Nsight Compute',
    statusReady: 'Decision path 已就绪：先使用 Nsight Systems。',
    statusSelected: '已更新下一份证据。',
    statusReset: 'Decision path 已重置；焦点返回症状选择。',
    issues: {
      'invalid-state': '拒绝：decision state 无效；上一状态保持不变。',
      'invalid-action': '拒绝：control action 无效；上一状态保持不变。',
      'unknown-symptom': '拒绝：symptom 不在 reviewed choices 中。',
    },
    noEvidence: 'VIS14 不启动 `nsys` 或 `ncu`，不打开 profiler report，不查询 GPU 或 performance counter，也不发布 timeline、metric、timing、bottleneck 或 speedup observation。它不授予 Compile-Checked、Community-Observed 或 Runtime-Verified Evidence Status。',
  },
  en: {
    eyebrow: 'VIS14 · PROFILER DECISION PATH',
    title: 'Nsight Systems versus Nsight Compute: Choose the Next Evidence from the Symptom',
    summary: 'Start from six observable symptoms and decide whether the next evidence is an application timeline or a selected-kernel investigation with a specific question.',
    conceptualNotice: 'This is a deterministic browser decision model. It launches no profiler and analyzes no report. It recommends the next evidence source; it does not identify a bottleneck or publish a metric, timing, throughput, or speedup conclusion. Nsight Systems and Nsight Compute have overlapping capabilities; these branches encode this curriculum\'s evidence order, not a complete feature crosswalk.',
    controlsHeading: 'Profiler evidence controls',
    symptomLabel: 'Observable symptom',
    reset: 'Reset',
    workbenchHeading: 'Next evidence',
    selectedSymptom: 'Selected symptom',
    recommendedTool: 'Recommended tool',
    scope: 'Analysis scope',
    artifact: 'Expected artifact',
    why: 'Why',
    inspect: 'Inspect first',
    next: 'Next gate',
    boundary: 'Boundary',
    recommended: 'Recommended next evidence',
    tools: {
      'nsight-systems': {
        label: 'Nsight Systems',
        scope: 'Application timeline',
        artifact: '.nsys-rep',
        use: 'Correlate CPU threads, CUDA API activity, kernels, copies, streams, dependencies, gaps, and overlap to locate work and select the next question.',
        boundary: 'A timeline can locate work and select a kernel instance, but it does not automatically answer a detailed kernel-metric question.',
      },
      'nsight-compute': {
        label: 'Nsight Compute',
        scope: 'Selected kernel',
        artifact: '.ncu-rep',
        use: 'After selecting one exact kernel instance and question, query section or metric availability on the current GPU and tool, then collect the minimum evidence.',
        boundary: 'Collection can replay or serialize work. Record permission, version, and replay, and do not replace application-timeline diagnosis.',
      },
    },
    symptoms: {
      'whole-workload-slow': {
        label: 'The end-to-end workload is slow, but I do not know where time goes.',
        why: 'The scope is still the complete application; no kernel-level hypothesis exists yet.',
        inspect: 'Inspect the timing relationship among CPU/GPU activity, CUDA APIs, copies, kernels, gaps, and dependencies.',
      },
      'cpu-or-launch-gaps': {
        label: 'The GPU has gaps between bursts, or CPU/CUDA launch overhead may matter.',
        why: 'Cross-domain causality between CPU and GPU work requires an application timeline.',
        inspect: 'Inspect CPU threads, CUDA API duration, launch cadence, and GPU idle gaps.',
      },
      'copy-overlap-unclear': {
        label: 'Copies and kernels do not appear to overlap, or stream/dependency order is unclear.',
        why: 'Overlap is an exact timeline observation, not an inference from capability fields or source order.',
        inspect: 'Inspect intervals and dependency edges for copies, kernels, streams, and events.',
      },
      'kernel-not-selected': {
        label: 'Several kernels run; I have not selected the exact kernel instance to investigate.',
        why: 'Nsight Compute needs a target; use the timeline to establish application context and invocation first.',
        inspect: 'Select one candidate by phase, kernel identity, invocation, and stream, then state one question.',
      },
      'selected-kernel-memory-question': {
        label: 'One kernel instance is selected, with a specific memory-traffic or throughput question.',
        why: 'Both kernel and question are fixed, so a minimum question-specific section or metric set can be collected.',
        inspect: 'Query the exact metric or section name, unit, and availability on this GPU and tool.',
      },
      'selected-kernel-execution-question': {
        label: 'One kernel instance is selected, with a specific launch, occupancy, scheduler, instruction, or source question.',
        why: 'The question is kernel-level, but its metric domain remains explicit and version- and architecture-gated.',
        inspect: 'Query the relevant section or metric, freeze the kernel filter, and record replay and counter permission.',
      },
    },
    nextGates: {
      'form-timeline-hypothesis': 'Write one falsifiable application-level hypothesis from a representative timeline.',
      'select-kernel-and-question': 'Select one exact kernel instance and rewrite the symptom as a kernel-level question.',
      'test-kernel-hypothesis': 'Collect only sections or metrics needed for the question, then validate in the complete application.',
    },
    staticHeading: 'Complete static decision tree',
    staticIntro: 'All six symptoms permanently map through one gate. Four branches go to Nsight Systems first; two reach Nsight Compute only after a kernel and question are selected.',
    treeStart: 'Start from an observable symptom, not a favorite tool or a long metric list.',
    gateQuestion: 'Has a representative timeline selected one exact kernel instance, and is the current question kernel-level?',
    systemsBranch: 'No → Nsight Systems first',
    computeBranch: 'Yes → Nsight Compute next',
    statusReady: 'Decision path ready: use Nsight Systems first.',
    statusSelected: 'Updated the next evidence source.',
    statusReset: 'Decision path reset; focus returned to Observable symptom.',
    issues: {
      'invalid-state': 'Rejected: decision state is invalid; the previous state is unchanged.',
      'invalid-action': 'Rejected: the control action is invalid; the previous state is unchanged.',
      'unknown-symptom': 'Rejected: the symptom is outside the reviewed choices.',
    },
    noEvidence: 'VIS14 launches neither `nsys` nor `ncu`, opens no profiler report, queries no GPU or performance counter, and publishes no timeline, metric, timing, bottleneck, or speedup observation. It grants no Compile-Checked, Community-Observed, or Runtime-Verified Evidence Status.',
  },
};
