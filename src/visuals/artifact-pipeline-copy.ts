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

type ArtifactPipelineStageCopy = Readonly<{
  label: string;
  description: string;
  artifact: string;
}>;

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
  sourceInputs: string;
  hostObjects: string;
  deviceLinkObject: string;
  finalHostLinkInputs: string;
  flowHeading: string;
  artifactOutput: string;
  modeStages: Readonly<Record<
    ArtifactPipelineMode,
    Readonly<Record<ArtifactPipelineStageId, ArtifactPipelineStageCopy>>
  >>;
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
    summary: '在精确 Toolkit Lane、有界 target plan 与显式 compilation mode 中，对比单 translation unit 的 whole-program image path 与双 translation unit 的 RDC object/device-link path。',
    conceptualNotice: '这是基于公开 NVCC phase/trajectory 与 separate-compilation contract 的确定性浏览器模型，不是一次 compiler trace。它不执行 nvcc、不检查生成文件，也不知道 runtime 最终选择哪个 device image。',
    modelHeading: '模型边界',
    modelBoundaries: [
      'Host 与 device path 是概念分支；模型不展开 Toolkit 可变的内部子命令。',
      'Whole-program branch 声明 PTX 与 native cubin/SASS 的教学 fatbinary；RDC branch 不把这条 finalized-image path 复制到每个 translation unit。',
      'Target plan 与 compilation mode 是独立的显式选择；a/f target suffix 不会选择 whole-program 或 RDC。',
      'RDC branch 固定建模 caller.cu 与 device_math.cu、各自的 relocatable device code/host object，以及 required device link；whole-program path 不虚构该阶段。',
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
        description: 'caller.cu 与 device_math.cu 分别产生含 relocatable device code 的 host object；device link 再生成含 linked executable device code 的 device_link.o。',
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
    sourceInputs: 'CUDA source input',
    hostObjects: 'Host object / device-code identity',
    deviceLinkObject: 'Device-link object',
    finalHostLinkInputs: 'Final host-link object inputs',
    flowHeading: 'Host/device artifact flow',
    artifactOutput: '阶段产物',
    modeStages: {
      'whole-program': {
        'source-split': {
          label: '分流单个 CUDA translation unit',
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
          label: '封装 finalized device images',
          description: '所选教学 plan 把 {real} native image 与 {virtual} PTX image candidate 放入单 translation unit 的 fatbinary。',
          artifact: 'fatbinary[{real}, {virtual}]',
        },
        'host-object': {
          label: '生成带 embedded fatbinary 的 kernel.o',
          description: 'Host path 再次预处理并合成 standard C++，随后 host compiler 生成包含 embedded finalized device images 的 {hostObject}。',
          artifact: '{source} -> {hostObject} + embedded fatbinary',
        },
        'optional-device-link': {
          label: '跳过 separate device link',
          description: 'Whole-program mode 跳过此阶段：device code 在一个 compilation unit 内解析，因此没有独立 device-link object 进入 host link。',
          artifact: '已跳过 · 不产生 device-link object',
        },
        'final-link': {
          label: '执行最终 host link',
          description: '{finalInputs} 与所需 library 直接汇合为最终 linked artifact；whole-program mode 没有独立 device-link output，这里也不运行产物。',
          artifact: '{finalInputs} -> linked executable / shared library',
        },
      },
      'separate-compilation-rdc': {
        'source-split': {
          label: '声明两个 CUDA translation unit',
          description: 'RDC branch 明确使用 {callerSource} 与 {deviceMathSource}；它不是把单 kernel finalized-image path 再追加一个 node。',
          artifact: '{callerSource} + {deviceMathSource}',
        },
        'device-ptx': {
          label: '建立跨 translation unit 的 device edge',
          description: '{callerSource} 中的 kernel 保留对 {deviceMathSource} 中 external device definition 的 reference，因此两个 source 都必须进入 RDC compilation。',
          artifact: '{callerSource}::kernel -> {deviceMathSource}::__device__ definition',
        },
        'device-cubin': {
          label: '把 caller.cu 编译为 RDC object',
          description: '{callerSource} 独立产生 {callerObject}；该 host object 保留身份明确的 {callerRdc}，不在此阶段伪装成 finalized cubin/fatbinary。',
          artifact: '{callerSource} -> {callerObject} [{callerRdc}]',
        },
        fatbinary: {
          label: '把 device_math.cu 编译为 RDC object',
          description: '{deviceMathSource} 独立产生 {deviceMathObject}；该 host object 保留身份明确的 {deviceMathRdc}。',
          artifact: '{deviceMathSource} -> {deviceMathObject} [{deviceMathRdc}]',
        },
        'host-object': {
          label: '保留两个 original host object',
          description: '{callerObject} 与 {deviceMathObject} 同时携带各自 host code 与 relocatable device code；它们既是 device-link input，也必须保留给最终 host link。',
          artifact: '{callerObject} + {deviceMathObject}',
        },
        'optional-device-link': {
          label: '链接两份 relocatable device code',
          description: 'Device linker 读取 {callerRdc} 与 {deviceMathRdc}，解析跨 translation unit 的 device symbol，并生成含 linked executable device code 的 {deviceLinkObject}。',
          artifact: '{callerRdc} + {deviceMathRdc} -> {deviceLinkObject} [{linkedDeviceCode}]',
        },
        'final-link': {
          label: '消费三个 object 执行最终 host link',
          description: 'Final host linker 明确消费两个 original object 与 device-link object：{finalInputs}，再加所需 library；这里不运行产物。',
          artifact: '{finalInputs} -> linked executable / shared library',
        },
      },
    },
    runtimeSelection: 'Runtime image selection',
    runtimeSelectionUnknown: 'unknown',
    runtimeSelectionBoundary: '没有 selected GPU、loaded driver、device query 或 launch observation，因此不能从 whole-program image inventory 或 RDC linked device code 推断 runtime image path。',
    staticHeading: '无脚本 reviewed lane / target / mode plans',
    staticIntro: '全部十四个精确 lane/plan/mode 组合都由服务器渲染：whole-program 展示单 TU finalized-image path 与 skipped device link，RDC 展示 caller.cu/device_math.cu 的独立 object、active device_link.o 与三 object final host link；禁用 JavaScript 与打印时不依赖 live workbench。',
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
    summary: 'Within an exact Toolkit Lane, bounded target plan, and explicit compilation mode, compare a single-translation-unit whole-program image path with a two-translation-unit RDC object and device-link path.',
    conceptualNotice: 'This is a deterministic browser model of the documented NVCC phases, trajectory, and separate-compilation contract, not a compiler trace. It runs no nvcc, inspects no generated file, and does not know which device image a runtime would select.',
    modelHeading: 'Model boundaries',
    modelBoundaries: [
      'The host and device paths are conceptual branches; the model does not expose Toolkit-variable internal commands.',
      'The whole-program branch declares a teaching fatbinary containing PTX and native cubin/SASS; the RDC branch does not copy that finalized-image path onto each translation unit.',
      'The target plan and compilation mode are independent explicit selections; an a/f target suffix does not select whole-program or RDC.',
      'The RDC branch fixes caller.cu and device_math.cu, their per-TU relocatable device-code/host-object identities, and a required device link; the whole-program path does not invent that stage.',
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
        description: 'caller.cu and device_math.cu each produce a host object containing relocatable device code; device link then emits device_link.o with linked executable device code.',
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
    sourceInputs: 'CUDA source input(s)',
    hostObjects: 'Host object / device-code identity',
    deviceLinkObject: 'Device-link object',
    finalHostLinkInputs: 'Final host-link object inputs',
    flowHeading: 'Host/device artifact flow',
    artifactOutput: 'Stage artifact',
    modeStages: {
      'whole-program': {
        'source-split': {
          label: 'Split one CUDA translation unit',
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
          label: 'Package finalized device images',
          description: 'The selected teaching plan places the {real} native image and {virtual} PTX image candidate into the single translation unit fatbinary.',
          artifact: 'fatbinary[{real}, {virtual}]',
        },
        'host-object': {
          label: 'Create kernel.o with the embedded fatbinary',
          description: 'The host path preprocesses again and synthesizes standard C++, then the host compiler creates {hostObject} containing the embedded finalized device images.',
          artifact: '{source} -> {hostObject} + embedded fatbinary',
        },
        'optional-device-link': {
          label: 'Skip the separate device link',
          description: 'Whole-program mode skips this stage: device code resolves within one compilation unit, so no separate device-link object enters the host link.',
          artifact: 'skipped · no device-link object',
        },
        'final-link': {
          label: 'Perform the final host link',
          description: '{finalInputs} and required libraries meet directly in the final linked artifact; whole-program mode has no separate device-link output, and this model does not run the artifact.',
          artifact: '{finalInputs} -> linked executable / shared library',
        },
      },
      'separate-compilation-rdc': {
        'source-split': {
          label: 'Declare two CUDA translation units',
          description: 'The RDC branch explicitly uses {callerSource} and {deviceMathSource}; it is not a single-kernel finalized-image path with one node appended.',
          artifact: '{callerSource} + {deviceMathSource}',
        },
        'device-ptx': {
          label: 'Establish the cross-TU device edge',
          description: 'A kernel in {callerSource} retains a reference to an external device definition in {deviceMathSource}, so both sources must enter RDC compilation.',
          artifact: '{callerSource}::kernel -> {deviceMathSource}::__device__ definition',
        },
        'device-cubin': {
          label: 'Compile caller.cu to an RDC object',
          description: '{callerSource} independently produces {callerObject}; that host object retains the identified {callerRdc} instead of pretending to be a finalized cubin/fatbinary.',
          artifact: '{callerSource} -> {callerObject} [{callerRdc}]',
        },
        fatbinary: {
          label: 'Compile device_math.cu to an RDC object',
          description: '{deviceMathSource} independently produces {deviceMathObject}; that host object retains the identified {deviceMathRdc}.',
          artifact: '{deviceMathSource} -> {deviceMathObject} [{deviceMathRdc}]',
        },
        'host-object': {
          label: 'Retain both original host objects',
          description: '{callerObject} and {deviceMathObject} each carry host code and per-TU relocatable device code; both feed device link and remain required by the final host link.',
          artifact: '{callerObject} + {deviceMathObject}',
        },
        'optional-device-link': {
          label: 'Link both relocatable device-code inputs',
          description: 'The device linker reads {callerRdc} and {deviceMathRdc}, resolves cross-translation-unit device symbols, and emits {deviceLinkObject} containing linked executable device code.',
          artifact: '{callerRdc} + {deviceMathRdc} -> {deviceLinkObject} [{linkedDeviceCode}]',
        },
        'final-link': {
          label: 'Consume three objects in the final host link',
          description: 'The final host linker explicitly consumes both original objects plus the device-link object, {finalInputs}, along with required libraries; this model does not run the artifact.',
          artifact: '{finalInputs} -> linked executable / shared library',
        },
      },
    },
    runtimeSelection: 'Runtime image selection',
    runtimeSelectionUnknown: 'unknown',
    runtimeSelectionBoundary: 'Without a selected GPU, loaded driver, device query, or launch observation, neither the whole-program image inventory nor RDC linked device code determines a runtime image path.',
    staticHeading: 'No-script reviewed lane / target / mode plans',
    staticIntro: 'All fourteen exact lane/plan/mode combinations are server-rendered: whole-program shows the single-TU finalized-image path and skipped device link, while RDC shows separate caller.cu/device_math.cu objects, active device_link.o, and a three-object final host link; no JavaScript or live workbench is needed in print.',
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
