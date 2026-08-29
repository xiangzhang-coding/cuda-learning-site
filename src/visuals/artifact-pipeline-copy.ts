// SPDX-License-Identifier: Apache-2.0
import type {
  ArtifactPipelineBranch,
  ArtifactPipelineIssue,
  ArtifactPipelineMode,
  ArtifactPipelineStageId,
  ArtifactPipelineStageState,
  ArtifactPipelineTargetPlanId,
  ArtifactPipelineTargetScope,
} from './artifact-pipeline-model';

export type ArtifactPipelineLocale = 'zh-CN' | 'en';

type ArtifactPipelineCopy = Readonly<{
  eyebrow: string;
  title: string;
  summary: string;
  conceptualNotice: string;
  modelHeading: string;
  modelBoundaries: readonly string[];
  controlsHeading: string;
  laneLabel: string;
  targetPlanLabel: string;
  modeLabel: string;
  step: string;
  reset: string;
  modes: Readonly<Record<ArtifactPipelineMode, Readonly<{
    title: string;
    description: string;
  }>>>;
  targetPlans: Readonly<Record<ArtifactPipelineTargetPlanId, Readonly<{
    title: string;
    description: string;
  }>>>;
  targetScopes: Readonly<Record<ArtifactPipelineTargetScope, string>>;
  branchLabels: Readonly<Record<ArtifactPipelineBranch, string>>;
  stageStates: Readonly<Record<ArtifactPipelineStageState, string>>;
  workbenchHeading: string;
  selectionLabel: string;
  targetContractHeading: string;
  lane: string;
  pipelineMode: string;
  targetScope: string;
  virtualTarget: string;
  realTarget: string;
  ptxImage: string;
  cubinImage: string;
  flowHeading: string;
  artifactOutput: string;
  stages: Readonly<Record<ArtifactPipelineStageId, Readonly<{
    label: string;
    description: string;
    artifact: string;
  }>>>;
  modeStages: Readonly<Record<ArtifactPipelineMode, Readonly<Record<
    Extract<ArtifactPipelineStageId, 'optional-device-link' | 'final-link'>,
    Readonly<{ description: string; artifact: string }>
  >>>>;
  runtimeSelection: string;
  runtimeSelectionUnknown: string;
  runtimeSelectionBoundary: string;
  staticHeading: string;
  staticIntro: string;
  staticCardKicker: string;
  staticFlowHeading: string;
  statusReady: string;
  statusLane: string;
  statusTargetPlan: string;
  statusMode: string;
  statusStep: string;
  statusReset: string;
  sequenceComplete: string;
  issues: Readonly<Record<ArtifactPipelineIssue, string>>;
  noEvidence: string;
}>;

export const ARTIFACT_PIPELINE_COPY: Readonly<Record<ArtifactPipelineLocale, ArtifactPipelineCopy>> = {
  'zh-CN': {
    eyebrow: 'VIS09 · HOST/DEVICE BRANCHES · ARTIFACT PACKAGING',
    title: 'NVCC 构建产物流水线',
    summary: '在精确 Toolkit Lane、有界 target plan 与显式 compilation mode 中，逐步追踪 .cu source 如何形成 PTX、cubin/SASS、fatbinary、host object 与最终链接产物。',
    conceptualNotice: '这是基于公开 NVCC phase/trajectory 的确定性浏览器模型，不是一次 compiler trace。它不执行 nvcc、不检查生成文件，也不知道 runtime 最终选择 fatbinary 中的哪个 image。',
    modelHeading: '模型边界',
    modelBoundaries: [
      'Host 与 device path 是概念分支；模型不展开 Toolkit 可变的内部子命令。',
      'PTX image 与 native cubin/SASS 同时进入所选教学 fatbinary；这只是声明的 target plan。',
      'Target plan 与 compilation mode 是独立的显式选择；a/f target suffix 不会选择 whole-program 或 RDC。',
      'Separate device link 只在 relocatable device code 跨 translation unit 时按需出现；whole-program path 不虚构该阶段。',
      '最终 linked artifact 仍不能证明 build 成功、driver compatibility、GPU execution、correctness 或 performance。',
    ],
    controlsHeading: 'Artifact flow 控制',
    laneLabel: '已复核 Toolkit Lane',
    targetPlanLabel: '有界 target plan',
    modeLabel: 'Compilation / pipeline mode',
    step: '单步推进',
    reset: '重置 flow',
    modes: {
      'whole-program': {
        title: 'Whole-program（跳过 device link）',
        description: '默认 mode；device code 在一个 compilation unit 内解析，不产生独立 device-link object。',
      },
      'separate-compilation-rdc': {
        title: 'Separate compilation / RDC（执行 device link）',
        description: 'Relocatable device code 先经过独立 device link，再进入最终 host link。',
      },
    },
    targetPlans: {
      'baseline-75': {
        title: 'Baseline 7.5：sm_75 + compute_75 PTX',
        description: 'Baseline feature set；三个 reviewed lane 都明确包含该 selected pair。',
      },
      'exact-90a': {
        title: 'Exact 9.0：sm_90a + compute_90a PTX',
        description: 'Architecture-specific feature set；只适用于精确 compute capability 9.0 范围。',
      },
      'family-100f': {
        title: '10.x family：sm_100f + compute_100f PTX',
        description: 'Family-specific feature set；只适用于 current owner table 声明的同一 GPU family。',
      },
    },
    targetScopes: {
      baseline: 'baseline feature set',
      'exact-architecture': 'exact architecture-specific feature set',
      'same-family': 'same-family feature set',
    },
    branchLabels: {
      'host-and-device': 'HOST + DEVICE SPLIT',
      device: 'DEVICE PATH',
      package: 'PACKAGE',
      host: 'HOST PATH',
      conditional: 'CONDITIONAL LINK',
      link: 'FINAL LINK',
    },
    stageStates: {
      complete: '已完成',
      current: '下一阶段',
      pending: '待处理',
      skipped: '已跳过',
    },
    workbenchHeading: '当前 artifact build plan',
    selectionLabel: 'Selected lane / target / mode',
    targetContractHeading: 'Target 与 image 清单',
    lane: 'Toolkit Lane',
    pipelineMode: 'Compilation / pipeline mode',
    targetScope: 'Target scope',
    virtualTarget: 'Virtual target / PTX contract',
    realTarget: 'Real target / native code',
    ptxImage: 'PTX image candidate',
    cubinImage: 'cubin / SASS image',
    flowHeading: 'Host/device artifact flow',
    artifactOutput: '阶段产物',
    stages: {
      'source-split': {
        label: '分流 CUDA translation unit',
        description: 'NVCC 对 {source} 分别准备 device compilation 与 host compilation 路径；公开 phase 是稳定教学边界。',
        artifact: '{source} -> host path | device path',
      },
      'device-ptx': {
        label: '按 virtual target 生成 PTX',
        description: 'Device path 按 {virtual} feature assumption 产生 PTX intermediate code。',
        artifact: '{ptx}',
      },
      'device-cubin': {
        label: '组装 native cubin / SASS',
        description: 'Device assembler 为 real target {real} 产生包含 SASS 的 architecture-specific cubin image。',
        artifact: '{cubin} · SASS',
      },
      fatbinary: {
        label: '封装 fatbinary',
        description: '所选教学 plan 把 {real} native image 与 {virtual} PTX image candidate 放入同一个 fatbinary。',
        artifact: 'fatbinary[{real}, {virtual}]',
      },
      'host-object': {
        label: '生成带 embedded fatbinary 的 host object',
        description: 'Host path 再次预处理并合成 standard C++，随后 host compiler 生成包含 embedded fatbinary 的 object。',
        artifact: 'host object + embedded fatbinary',
      },
      'optional-device-link': {
        label: 'Separate device-link boundary',
        description: 'Compilation mode 明确决定这个 conditional boundary 是跳过还是执行。',
        artifact: 'mode-dependent device-link output',
      },
      'final-link': {
        label: '执行最终 host link',
        description: 'Host object、按需的 device-link output 与所需 library 汇合为最终 linked artifact；这里不运行该产物。',
        artifact: 'linked executable / shared library',
      },
    },
    modeStages: {
      'whole-program': {
        'optional-device-link': {
          description: 'Whole-program mode 跳过此阶段：device code 在一个 compilation unit 内解析，因此没有独立 device-link object 进入 host link。',
          artifact: '已跳过 · 不产生 device-link object',
        },
        'final-link': {
          description: 'Host object 与所需 library 直接汇合为最终 linked artifact；whole-program mode 没有独立 device-link output，这里也不运行产物。',
          artifact: 'linked executable / shared library',
        },
      },
      'separate-compilation-rdc': {
        'optional-device-link': {
          description: 'Separate compilation / RDC mode 在此解析跨 translation unit 的 device symbol，并产生可交给 host linker 的 device-link object。',
          artifact: 'a_dlink.o / a_dlink.obj（active）',
        },
        'final-link': {
          description: 'Host object、已生成的 device-link object 与所需 library 汇合为最终 linked artifact；这里不运行该产物。',
          artifact: 'linked executable / shared library',
        },
      },
    },
    runtimeSelection: 'Runtime image selection',
    runtimeSelectionUnknown: 'unknown',
    runtimeSelectionBoundary: '没有 selected GPU、loaded driver、device query 或 launch observation，因此不能从 fatbinary 内容推断 runtime 会选择 native cubin 还是 PTX path。',
    staticHeading: '无脚本 reviewed lane / target / mode plans',
    staticIntro: '全部十四个精确 lane/plan/mode 组合都由服务器渲染：每个 target plan 分别展示 whole-program 的 skipped device link 与 RDC 的 active device link；禁用 JavaScript 与打印时不依赖 live workbench。',
    staticCardKicker: '{lane} · {scope} · {mode}',
    staticFlowHeading: '完整静态 artifact flow',
    statusReady: '模型已在默认 whole-program mode 就绪；device-link stage 标记为已跳过，尚未推进 active artifact stage。',
    statusLane: '已选择 Toolkit Lane {lane}；target plan 重置为 {plan}，{mode} flow 回到 step 0。',
    statusTargetPlan: '已选择 {plan}；{mode} flow 回到 step 0。',
    statusMode: '已选择 {mode}；flow 回到 step 0。',
    statusStep: 'Step {current}/{total}：已完成 {stage}；{next}',
    statusReset: 'Artifact flow 已重置；焦点返回 Toolkit Lane select。',
    sequenceComplete: 'Active traversal 已完成；mode-skipped stage 保持跳过，runtime image selection 仍为 unknown。',
    issues: {
      'invalid-state': '拒绝：model state 无效；上一状态保持不变。',
      'invalid-action': '拒绝：control action 无效；上一状态保持不变。',
      'unknown-lane': '拒绝：Toolkit Lane 未复核；上一状态保持不变。',
      'unknown-target-plan': '拒绝：target plan 未复核；上一状态保持不变。',
      'unknown-mode': '拒绝：compilation mode 未复核；上一状态保持不变。',
      'unsupported-target-plan': '拒绝：所选 Toolkit Lane 不包含该 target plan；上一状态保持不变。',
      'sequence-complete': 'Artifact flow 已完成；请重置或选择另一个 reviewed plan。',
    },
    noEvidence: 'VIS09 不执行 compiler 或 CUDA、不检查 artifact、不查询 device，也不测量时间。声明的 flow、target pair 与 image 清单不会授予 Compile-Checked、Community-Observed、Runtime-Verified 或 performance evidence。',
  },
  en: {
    eyebrow: 'VIS09 · HOST/DEVICE BRANCHES · ARTIFACT PACKAGING',
    title: 'NVCC Artifact Pipeline',
    summary: 'Within an exact Toolkit Lane, bounded target plan, and explicit compilation mode, trace how a .cu source can become PTX, cubin/SASS, a fatbinary, a host object, and a final linked artifact.',
    conceptualNotice: 'This is a deterministic browser model of the documented NVCC phases and trajectory, not a compiler trace. It runs no nvcc, inspects no generated file, and does not know which image a runtime would select from the fatbinary.',
    modelHeading: 'Model boundaries',
    modelBoundaries: [
      'The host and device paths are conceptual branches; the model does not expose Toolkit-variable internal commands.',
      'A PTX image and native cubin/SASS enter the selected teaching fatbinary together; this is only a declared target plan.',
      'The target plan and compilation mode are independent explicit selections; an a/f target suffix does not select whole-program or RDC.',
      'A separate device link appears only when relocatable device code crosses translation units; the whole-program path does not invent that stage.',
      'A final linked artifact still proves no successful build, driver compatibility, GPU execution, correctness, or performance.',
    ],
    controlsHeading: 'Artifact flow controls',
    laneLabel: 'Reviewed Toolkit Lane',
    targetPlanLabel: 'Bounded target plan',
    modeLabel: 'Compilation / pipeline mode',
    step: 'Step forward',
    reset: 'Reset flow',
    modes: {
      'whole-program': {
        title: 'Whole-program (device link skipped)',
        description: 'The default mode; device code resolves within one compilation unit, so no separate device-link object is produced.',
      },
      'separate-compilation-rdc': {
        title: 'Separate compilation / RDC (device link active)',
        description: 'Relocatable device code passes through a separate device link before the final host link.',
      },
    },
    targetPlans: {
      'baseline-75': {
        title: 'Baseline 7.5: sm_75 + compute_75 PTX',
        description: 'Baseline feature set; all three reviewed lanes explicitly contain this selected pair.',
      },
      'exact-90a': {
        title: 'Exact 9.0: sm_90a + compute_90a PTX',
        description: 'Architecture-specific feature set, scoped only to exact compute capability 9.0.',
      },
      'family-100f': {
        title: '10.x family: sm_100f + compute_100f PTX',
        description: 'Family-specific feature set, scoped only to the GPU family declared by the current owner table.',
      },
    },
    targetScopes: {
      baseline: 'baseline feature set',
      'exact-architecture': 'exact architecture-specific feature set',
      'same-family': 'same-family feature set',
    },
    branchLabels: {
      'host-and-device': 'HOST + DEVICE SPLIT',
      device: 'DEVICE PATH',
      package: 'PACKAGE',
      host: 'HOST PATH',
      conditional: 'CONDITIONAL LINK',
      link: 'FINAL LINK',
    },
    stageStates: {
      complete: 'complete',
      current: 'next stage',
      pending: 'pending',
      skipped: 'skipped',
    },
    workbenchHeading: 'Current artifact build plan',
    selectionLabel: 'Selected lane / target / mode',
    targetContractHeading: 'Target and image manifest',
    lane: 'Toolkit Lane',
    pipelineMode: 'Compilation / pipeline mode',
    targetScope: 'Target scope',
    virtualTarget: 'Virtual target / PTX contract',
    realTarget: 'Real target / native code',
    ptxImage: 'PTX image candidate',
    cubinImage: 'cubin / SASS image',
    flowHeading: 'Host/device artifact flow',
    artifactOutput: 'Stage artifact',
    stages: {
      'source-split': {
        label: 'Split the CUDA translation unit',
        description: 'NVCC prepares device-compilation and host-compilation paths from {source}; documented phases are the durable teaching boundary.',
        artifact: '{source} -> host path | device path',
      },
      'device-ptx': {
        label: 'Generate PTX for the virtual target',
        description: 'The device path produces PTX intermediate code under the {virtual} feature assumptions.',
        artifact: '{ptx}',
      },
      'device-cubin': {
        label: 'Assemble native cubin / SASS',
        description: 'The device assembler produces an architecture-specific cubin image containing SASS for real target {real}.',
        artifact: '{cubin} · SASS',
      },
      fatbinary: {
        label: 'Package the fatbinary',
        description: 'The selected teaching plan places the {real} native image and {virtual} PTX image candidate into one fatbinary.',
        artifact: 'fatbinary[{real}, {virtual}]',
      },
      'host-object': {
        label: 'Create the host object with embedded fatbinary',
        description: 'The host path preprocesses again and synthesizes standard C++, then the host compiler creates an object containing the embedded fatbinary.',
        artifact: 'host object + embedded fatbinary',
      },
      'optional-device-link': {
        label: 'Separate device-link boundary',
        description: 'The explicit compilation mode determines whether this conditional boundary is skipped or traversed.',
        artifact: 'mode-dependent device-link output',
      },
      'final-link': {
        label: 'Perform the final host link',
        description: 'The host object, optional device-link output, and required libraries meet in the final linked artifact; this model does not run it.',
        artifact: 'linked executable / shared library',
      },
    },
    modeStages: {
      'whole-program': {
        'optional-device-link': {
          description: 'Whole-program mode skips this stage: device code resolves within one compilation unit, so no separate device-link object enters the host link.',
          artifact: 'skipped · no device-link object',
        },
        'final-link': {
          description: 'The host object and required libraries meet directly in the final linked artifact; whole-program mode has no separate device-link output, and this model does not run the artifact.',
          artifact: 'linked executable / shared library',
        },
      },
      'separate-compilation-rdc': {
        'optional-device-link': {
          description: 'Separate compilation / RDC resolves device symbols across translation units here and produces a device-link object for the host linker.',
          artifact: 'a_dlink.o / a_dlink.obj (active)',
        },
        'final-link': {
          description: 'The host object, completed device-link object, and required libraries meet in the final linked artifact; this model does not run it.',
          artifact: 'linked executable / shared library',
        },
      },
    },
    runtimeSelection: 'Runtime image selection',
    runtimeSelectionUnknown: 'unknown',
    runtimeSelectionBoundary: 'Without a selected GPU, loaded driver, device query, or launch observation, fatbinary contents cannot tell us whether a runtime would select the native cubin or a PTX path.',
    staticHeading: 'No-script reviewed lane / target / mode plans',
    staticIntro: 'All fourteen exact lane/plan/mode combinations are server-rendered: every target plan shows both the whole-program branch with a skipped device link and the RDC branch with an active device link; no JavaScript or live workbench is needed in print.',
    staticCardKicker: '{lane} · {scope} · {mode}',
    staticFlowHeading: 'Complete static artifact flow',
    statusReady: 'Model ready in the default whole-program mode; the device-link stage is marked skipped, and no active artifact stage has advanced.',
    statusLane: 'Selected Toolkit Lane {lane}; target plan reset to {plan}, and the {mode} flow returned to step 0.',
    statusTargetPlan: 'Selected {plan}; the {mode} flow returned to step 0.',
    statusMode: 'Selected {mode}; the flow returned to step 0.',
    statusStep: 'Step {current}/{total}: completed {stage}; {next}',
    statusReset: 'Artifact flow reset; focus returned to the Toolkit Lane select.',
    sequenceComplete: 'The active traversal is complete; any mode-skipped stage remains skipped, and runtime image selection remains unknown.',
    issues: {
      'invalid-state': 'Rejected: model state is invalid; the previous state is unchanged.',
      'invalid-action': 'Rejected: the control action is invalid; the previous state is unchanged.',
      'unknown-lane': 'Rejected: the Toolkit Lane is not reviewed; the previous state is unchanged.',
      'unknown-target-plan': 'Rejected: the target plan is not reviewed; the previous state is unchanged.',
      'unknown-mode': 'Rejected: the compilation mode is not reviewed; the previous state is unchanged.',
      'unsupported-target-plan': 'Rejected: the selected Toolkit Lane does not contain that target plan; the previous state is unchanged.',
      'sequence-complete': 'The artifact flow is complete; reset or choose another reviewed plan.',
    },
    noEvidence: 'VIS09 executes no compiler or CUDA, inspects no artifact, queries no device, and measures no time. Its declared flow, target pair, and image manifest grant no Compile-Checked, Community-Observed, Runtime-Verified, or performance evidence.',
  },
};

export function formatArtifactPipelineCopy(
  template: string,
  values: Readonly<Record<string, string>>,
): string {
  return Object.entries(values).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, value),
    template,
  );
}
