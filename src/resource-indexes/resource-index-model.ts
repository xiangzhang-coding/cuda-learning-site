// SPDX-License-Identifier: Apache-2.0
import {
  COMPILATION_EVIDENCE_STATUSES,
  RUNTIME_EVIDENCE_STATUSES,
  evidenceStatusIssues,
  parseIsoDate,
} from '../content-contract';

export const INDEX_GROUPS = ['labs', 'practice', 'visuals', 'glossary', 'sources'] as const;
export type IndexGroup = (typeof INDEX_GROUPS)[number];

export const INDEX_LOCALES = ['zh-CN', 'en'] as const;
export type IndexLocale = (typeof INDEX_LOCALES)[number];

export const RESOURCE_TYPES = [
  'guided-lab',
  'mental-model',
  'correctness-debugging',
  'concepts-implementation',
  'evidence-review',
  'execution-model',
  'indexing-model',
  'resource-vocabulary',
  'evidence-vocabulary',
  'environment-vocabulary',
  'kernel-vocabulary',
  'publishing-interface',
  'cuda-version-record',
  'cpp-language-record',
  'linux-tool-record',
  'architecture-record',
  'historical-record',
] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

export const INDEX_ROUTES: Readonly<Record<IndexGroup, Readonly<Record<IndexLocale, string>>>> = {
  labs: { 'zh-CN': '/labs/', en: '/en/labs/' },
  practice: { 'zh-CN': '/practice/', en: '/en/practice/' },
  visuals: { 'zh-CN': '/visuals/', en: '/en/visuals/' },
  glossary: { 'zh-CN': '/glossary/', en: '/en/glossary/' },
  sources: { 'zh-CN': '/sources-and-versions/', en: '/en/sources-and-versions/' },
};

export type LocalizedText = Readonly<Record<IndexLocale, string>>;

export type EvidenceProjection = Readonly<{
  compilation: readonly string[];
  runtime: readonly string[];
}>;

export type ResourceIndexRecord = Readonly<{
  planningId: string;
  group: IndexGroup;
  title: LocalizedText;
  href: LocalizedText;
  resourceType: ResourceType;
  prerequisites: readonly string[];
  relatedUnits: readonly string[];
  hardwareGate: LocalizedText;
  versionGate: LocalizedText;
  reviewedOn: string;
  difficulty?: 'foundational' | 'introductory' | 'intermediate' | 'advanced';
  evidence?: EvidenceProjection;
  sourceAccessDate?: string;
  keywords?: LocalizedText;
}>;

export type PublishedDestination = Readonly<{
  href: LocalizedText;
  title: LocalizedText;
  prerequisites: readonly string[];
  indexGroup?: 'labs' | 'visuals';
}>;

export const PUBLISHED_DESTINATIONS: Readonly<Record<string, PublishedDestination>> = {
  O01: {
    href: { 'zh-CN': '/start/using-the-learning-site/', en: '/en/start/using-the-learning-site/' },
    title: { 'zh-CN': 'O01：如何使用学习站', en: 'O01: Using the Learning Site' },
    prerequisites: [],
  },
  O02: {
    href: { 'zh-CN': '/start/evidence-status/', en: '/en/start/evidence-status/' },
    title: { 'zh-CN': 'O02：诚实记录证据状态', en: 'O02: Recording Evidence Honestly' },
    prerequisites: ['O01'],
  },
  O03: {
    href: { 'zh-CN': '/start/environment-manifest/', en: '/en/start/environment-manifest/' },
    title: { 'zh-CN': 'O03：读懂环境清单', en: 'O03: Reading an Environment Manifest' },
    prerequisites: ['O01'],
  },
  O04: {
    href: { 'zh-CN': '/start/cpp17-for-cuda/', en: '/en/start/cpp17-for-cuda/' },
    title: { 'zh-CN': 'O04：面向 CUDA 学习者的 C++17 复习', en: 'O04: C++17 Refresher for CUDA Learners' },
    prerequisites: ['O01'],
  },
  O05: {
    href: { 'zh-CN': '/start/linux-command-line/', en: '/en/start/linux-command-line/' },
    title: { 'zh-CN': 'O05：可复现的 Linux 命令行工作', en: 'O05: Reproducible Linux Command-Line Work' },
    prerequisites: ['O01'],
  },
  O06: {
    href: { 'zh-CN': '/start/architecture-refresher/', en: '/en/start/architecture-refresher/' },
    title: { 'zh-CN': 'O06：架构回顾：速率、延迟与数据移动', en: 'O06: Architecture Refresher: Rate, Delay, and Data Movement' },
    prerequisites: ['O01'],
  },
  O07: {
    href: { 'zh-CN': '/start/programmable-gpus/', en: '/en/start/programmable-gpus/' },
    title: { 'zh-CN': 'O07：GPU 为什么变得可编程', en: 'O07: Why GPUs Became Programmable' },
    prerequisites: ['O06'],
  },
  O08: {
    href: { 'zh-CN': '/start/reference-environment-candidate/', en: '/en/start/reference-environment-candidate/' },
    title: { 'zh-CN': 'O08：准备基准环境候选配置', en: 'O08: Preparing a Reference Environment Candidate' },
    prerequisites: ['O02', 'O03', 'O05'],
  },
  F01: {
    href: { 'zh-CN': '/foundations/first-cuda-kernel/', en: '/en/foundations/first-cuda-kernel/' },
    title: { 'zh-CN': 'F01：从预测到第一个 CUDA kernel', en: 'F01: From Prediction to a First CUDA Kernel' },
    prerequisites: ['O03'],
  },
  F02: {
    href: { 'zh-CN': '/foundations/execution-hierarchy/', en: '/en/foundations/execution-hierarchy/' },
    title: { 'zh-CN': 'F02：理解 CUDA 执行层次', en: 'F02: Understanding the CUDA Execution Hierarchy' },
    prerequisites: ['F01'],
  },
  F03: {
    href: { 'zh-CN': '/foundations/multidimensional-indexing/', en: '/en/foundations/multidimensional-indexing/' },
    title: { 'zh-CN': 'F03：把多维索引与边界写成正确性合同', en: 'F03: Make Multidimensional Indexing and Bounds a Correctness Contract' },
    prerequisites: ['F02'],
  },
  F04: {
    href: { 'zh-CN': '/foundations/host-device-lifecycle/', en: '/en/foundations/host-device-lifecycle/' },
    title: { 'zh-CN': 'F04：显式 host-device 资源生命周期', en: 'F04: The Explicit Host-Device Resource Lifecycle' },
    prerequisites: ['F01'],
  },
  F05: {
    href: { 'zh-CN': '/foundations/asynchronous-errors/', en: '/en/foundations/asynchronous-errors/' },
    title: { 'zh-CN': 'F05：CUDA 错误为何常常延后暴露', en: 'F05: CUDA Errors Are Often Asynchronous' },
    prerequisites: ['F04'],
  },
  F06: {
    href: { 'zh-CN': '/foundations/compute-capability/', en: '/en/foundations/compute-capability/' },
    title: { 'zh-CN': 'F06：Compute capability 是功能合同', en: 'F06: Compute Capability Is a Feature Contract' },
    prerequisites: ['F02', 'O03'],
  },
  F07: {
    href: { 'zh-CN': '/foundations/runtime-driver-api/', en: '/en/foundations/runtime-driver-api/' },
    title: { 'zh-CN': 'F07：区分 CUDA Runtime API 与 Driver API 的角色', en: 'F07: Distinguish CUDA Runtime API and Driver API Roles' },
    prerequisites: ['F04', 'F05'],
  },
  F08: {
    href: { 'zh-CN': '/foundations/launch-geometry/', en: '/en/foundations/launch-geometry/' },
    title: { 'zh-CN': 'F08：Launch geometry 是先于速度的正确性与资源决策', en: 'F08: Launch Geometry Is a Correctness and Resource Decision Before Speed' },
    prerequisites: ['F02', 'F03', 'F06'],
  },
  M01: {
    href: { 'zh-CN': '/memory/address-spaces/', en: '/en/memory/address-spaces/' },
    title: { 'zh-CN': 'M01：地址空间、所有权、作用域与生命周期', en: 'M01: Address spaces, ownership, scope, and lifetime' },
    prerequisites: ['F04', 'F06'],
  },
  M02: {
    href: { 'zh-CN': '/memory/coalescing-transactions/', en: '/en/memory/coalescing-transactions/' },
    title: { 'zh-CN': 'M02：把合并访问理解为事务塑形', en: 'M02: Coalescing as transaction shaping' },
    prerequisites: ['M01', 'F03'],
  },
  M03: {
    href: { 'zh-CN': '/memory/shared-memory-tiling/', en: '/en/memory/shared-memory-tiling/' },
    title: { 'zh-CN': 'M03：共享内存分块', en: 'M03: Shared-memory tiling' },
    prerequisites: ['M01', 'M02'],
  },
  M04: {
    href: { 'zh-CN': '/memory/bank-conflicts-layouts/', en: '/en/memory/bank-conflicts-layouts/' },
    title: { 'zh-CN': 'M04：Bank conflict 与布局变换', en: 'M04: Bank conflicts and layout transforms' },
    prerequisites: ['M03'],
  },
  M05: {
    href: { 'zh-CN': '/memory/synchronization-scopes/', en: '/en/memory/synchronization-scopes/' },
    title: { 'zh-CN': 'M05：同步作用域与内存可见性', en: 'M05: Synchronization scopes and memory visibility' },
    prerequisites: ['F02', 'M01'],
  },
  M06: {
    href: { 'zh-CN': '/memory/warp-divergence-reconvergence/', en: '/en/memory/warp-divergence-reconvergence/' },
    title: { 'zh-CN': 'M06：分支发散、重汇合与线程束安全推理', en: 'M06: Divergence, reconvergence, and warp-safe reasoning' },
    prerequisites: ['F02', 'M05'],
  },
  M07: {
    href: { 'zh-CN': '/memory/stream-ordering/', en: '/en/memory/stream-ordering/' },
    title: { 'zh-CN': 'M07：用流取代全局顺序心智模型', en: 'M07: Streams replace a global-order mental model' },
    prerequisites: ['F05', 'M01'],
  },
  M08: {
    href: { 'zh-CN': '/memory/event-dependencies-timing/', en: '/en/memory/event-dependencies-timing/' },
    title: { 'zh-CN': 'M08：用事件表达依赖并测量设备时间', en: 'M08: Events as dependencies and device-time measurements' },
    prerequisites: ['M07'],
  },
  M09: {
    href: { 'zh-CN': '/memory/pinned-memory-transfer-overlap/', en: '/en/memory/pinned-memory-transfer-overlap/' },
    title: { 'zh-CN': 'M09：页锁定内存与传输重叠', en: 'M09: Pinned Memory and Transfer Overlap' },
    prerequisites: ['M07', 'M08'],
  },
  M10: {
    href: { 'zh-CN': '/memory/unified-memory-page-migration/', en: '/en/memory/unified-memory-page-migration/' },
    title: { 'zh-CN': 'M10：统一内存与页面迁移', en: 'M10: Unified Memory and Page Migration' },
    prerequisites: ['M01', 'M02'],
  },
  M11: {
    href: { 'zh-CN': '/memory/stream-ordered-allocation-memory-pools/', en: '/en/memory/stream-ordered-allocation-memory-pools/' },
    title: { 'zh-CN': 'M11：流顺序分配与内存池', en: 'M11: Stream-Ordered Allocation and Memory Pools' },
    prerequisites: ['M07', 'M08'],
  },
  M12: {
    href: { 'zh-CN': '/memory/cooperative-groups/', en: '/en/memory/cooperative-groups/' },
    title: { 'zh-CN': 'M12：协作组与可组合同步', en: 'M12: Cooperative Groups and Composable Synchronization' },
    prerequisites: ['M05', 'M06'],
  },
  M13: {
    href: { 'zh-CN': '/memory/asynchronous-copy-pipelines/', en: '/en/memory/asynchronous-copy-pipelines/' },
    title: { 'zh-CN': 'M13：异步复制与分阶段流水线', en: 'M13: Asynchronous Copy and Staged Pipelines' },
    prerequisites: ['M03', 'M05', 'M08'],
  },
  M14: {
    href: { 'zh-CN': '/memory/cuda-graphs/', en: '/en/memory/cuda-graphs/' },
    title: { 'zh-CN': 'M14：CUDA 图与重复启动结构', en: 'M14: CUDA Graphs and Repeated Launch Structure' },
    prerequisites: ['M07', 'M08'],
  },
  M15: {
    href: { 'zh-CN': '/toolchain/nvcc-compilation-flow/', en: '/en/toolchain/nvcc-compilation-flow/' },
    title: { 'zh-CN': 'M15：NVCC 主机/设备编译流程', en: 'M15: NVCC Host/Device Compilation Flow' },
    prerequisites: ['F04', 'O04'],
  },
  M16: {
    href: { 'zh-CN': '/toolchain/ptx-cubin-fatbinary/', en: '/en/toolchain/ptx-cubin-fatbinary/' },
    title: { 'zh-CN': 'M16：PTX、cubin、SASS 与 fatbinary', en: 'M16: PTX, Cubins, SASS, and Fatbinaries' },
    prerequisites: ['M15', 'F06'],
  },
  M17: {
    href: { 'zh-CN': '/toolchain/compiler-architecture-targets/', en: '/en/toolchain/compiler-architecture-targets/' },
    title: { 'zh-CN': 'M17：选择编译器架构目标', en: 'M17: Choosing Compiler Architecture Targets' },
    prerequisites: ['M16', 'F06'],
  },
  M18: {
    href: { 'zh-CN': '/toolchain/separate-compilation-device-linking/', en: '/en/toolchain/separate-compilation-device-linking/' },
    title: { 'zh-CN': 'M18：分离编译与设备链接', en: 'M18: Separate Compilation and Device Linking' },
    prerequisites: ['M15', 'M16'],
  },
  M19: {
    href: { 'zh-CN': '/toolchain/cpp-dialect-boundaries/', en: '/en/toolchain/cpp-dialect-boundaries/' },
    title: { 'zh-CN': 'M19：CUDA C++17、C++20 与 C++23 方言边界', en: 'M19: CUDA C++17, C++20, and C++23 Dialect Boundaries' },
    prerequisites: ['O04', 'M15'],
  },
  A01: {
    href: { 'zh-CN': '/algorithms/elementwise-map/', en: '/en/algorithms/elementwise-map/' },
    title: { 'zh-CN': 'A01：逐元素映射与一元素一所有者', en: 'A01: Elementwise Map and One Owner per Element' },
    prerequisites: ['F03', 'F04', 'M02'],
  },
  A02: {
    href: { 'zh-CN': '/algorithms/multi-stage-reduction/', en: '/en/algorithms/multi-stage-reduction/' },
    title: { 'zh-CN': 'A02：多阶段归约、屏障与运算顺序', en: 'A02: Multi-Stage Reduction, Barriers, and Operation Order' },
    prerequisites: ['M03', 'M05', 'M06'],
  },
  A03: {
    href: { 'zh-CN': '/algorithms/inclusive-exclusive-scan/', en: '/en/algorithms/inclusive-exclusive-scan/' },
    title: { 'zh-CN': 'A03：包含式与排除式扫描（Inclusive and Exclusive Scan）', en: 'A03: Inclusive and Exclusive Scan' },
    prerequisites: ['A02', 'M05'],
  },
  A04: {
    href: { 'zh-CN': '/algorithms/privatized-histogram/', en: '/en/algorithms/privatized-histogram/' },
    title: { 'zh-CN': 'A04：私有化直方图（Privatized Histogram）', en: 'A04: Privatized Histogram' },
    prerequisites: ['M03', 'M05'],
  },
  Q01: {
    href: { 'zh-CN': '/correctness/cpu-references-tolerances-invariants/', en: '/en/correctness/cpu-references-tolerances-invariants/' },
    title: { 'zh-CN': 'Q01：CPU 参考实现、容差与不变量', en: 'Q01: CPU references, tolerances, and invariants' },
    prerequisites: ['F04', 'O04'],
  },
  Q02: {
    href: { 'zh-CN': '/correctness/floating-point-order-reproducibility/', en: '/en/correctness/floating-point-order-reproducibility/' },
    title: { 'zh-CN': 'Q02：浮点顺序、确定性与逐位可复现性', en: 'Q02: Floating-point order, determinism, and bitwise reproducibility' },
    prerequisites: ['Q01', 'A02'],
  },
  Q03: {
    href: { 'zh-CN': '/correctness/memcheck-invalid-memory-access/', en: '/en/correctness/memcheck-invalid-memory-access/' },
    title: { 'zh-CN': 'Q03：用 memcheck 定位非法内存访问', en: 'Q03: Memcheck and invalid memory access' },
    prerequisites: ['F05', 'Q01'],
  },
  Q04: {
    href: { 'zh-CN': '/correctness/racecheck-initcheck-synccheck/', en: '/en/correctness/racecheck-initcheck-synccheck/' },
    title: { 'zh-CN': 'Q04：用 racecheck、initcheck 与 synccheck 定位缺陷', en: 'Q04: Diagnose with racecheck, initcheck, and synccheck' },
    prerequisites: ['M05', 'M06', 'Q03'],
  },
  Q05: {
    href: { 'zh-CN': '/correctness/timing-asynchronous-gpu-work/', en: '/en/correctness/timing-asynchronous-gpu-work/' },
    title: { 'zh-CN': 'Q05：诚实计时异步 GPU 工作', en: 'Q05: Time asynchronous GPU work honestly' },
    prerequisites: ['M08', 'Q01'],
  },
  EX01: {
    href: { 'zh-CN': '/examples/environment-report/', en: '/en/examples/environment-report/' },
    title: { 'zh-CN': 'EX01：环境报告可运行示例', en: 'EX01: Environment Report Runnable Example' },
    prerequisites: [],
  },
  EX02: {
    href: { 'zh-CN': '/examples/vector-addition/', en: '/en/examples/vector-addition/' },
    title: { 'zh-CN': 'EX02：向量加法可运行示例', en: 'EX02: Vector Addition Runnable Example' },
    prerequisites: [],
  },
  EX03: {
    href: { 'zh-CN': '/examples/multidimensional-indexing/', en: '/en/examples/multidimensional-indexing/' },
    title: { 'zh-CN': 'EX03：多维索引可运行示例', en: 'EX03: Multidimensional Indexing Runnable Example' },
    prerequisites: ['F03'],
  },
  EX04: {
    href: { 'zh-CN': '/examples/error-handling-lifecycle/', en: '/en/examples/error-handling-lifecycle/' },
    title: { 'zh-CN': 'EX04：错误处理生命周期可运行示例', en: 'EX04: Error Handling Lifecycle Runnable Example' },
    prerequisites: ['F05'],
  },
  EX05: {
    href: { 'zh-CN': '/examples/coalesced-strided-access/', en: '/en/examples/coalesced-strided-access/' },
    title: { 'zh-CN': 'EX05：合并与跨步访问可运行示例', en: 'EX05: Coalesced and Strided Access Runnable Example' },
    prerequisites: ['M02'],
  },
  EX06: {
    href: { 'zh-CN': '/examples/shared-memory-tile-bank-padding/', en: '/en/examples/shared-memory-tile-bank-padding/' },
    title: { 'zh-CN': 'EX06：共享内存 tile bank padding 可运行示例', en: 'EX06: Shared-Memory Tile Bank Padding Runnable Example' },
    prerequisites: ['M03', 'M04'],
  },
  EX07: {
    href: { 'zh-CN': '/examples/streams-events-overlap/', en: '/en/examples/streams-events-overlap/' },
    title: { 'zh-CN': 'EX07：流、事件与重叠', en: 'EX07: Streams, Events, and Overlap' },
    prerequisites: ['M07', 'M08', 'M09'],
  },
  EX08: {
    href: { 'zh-CN': '/examples/unified-memory-migration/', en: '/en/examples/unified-memory-migration/' },
    title: { 'zh-CN': 'EX08：统一内存迁移', en: 'EX08: Unified Memory Migration' },
    prerequisites: ['M10'],
  },
  EX09: {
    href: { 'zh-CN': '/examples/graph-capture/', en: '/en/examples/graph-capture/' },
    title: { 'zh-CN': 'EX09：CUDA 图捕获', en: 'EX09: CUDA Graph Capture' },
    prerequisites: ['M14'],
  },
  EX10: {
    href: { 'zh-CN': '/examples/ptx-fatbinary-inspection/', en: '/en/examples/ptx-fatbinary-inspection/' },
    title: { 'zh-CN': 'EX10：PTX 与 Fatbinary 检查可运行示例', en: 'EX10: PTX and Fatbinary Inspection Runnable Example' },
    prerequisites: ['M15', 'M16'],
  },
  EX11: {
    href: { 'zh-CN': '/examples/multi-stage-reduction/', en: '/en/examples/multi-stage-reduction/' },
    title: { 'zh-CN': 'EX11：多阶段归约可运行示例', en: 'EX11: Multi-Stage Reduction Runnable Example' },
    prerequisites: ['A02', 'Q02'],
  },
  EX12: {
    href: { 'zh-CN': '/examples/inclusive-exclusive-scan/', en: '/en/examples/inclusive-exclusive-scan/' },
    title: { 'zh-CN': 'EX12：Inclusive 与 Exclusive Scan 可运行示例', en: 'EX12: Inclusive and Exclusive Scan Runnable Example' },
    prerequisites: ['A03'],
  },
  EX13: {
    href: { 'zh-CN': '/examples/privatized-histogram/', en: '/en/examples/privatized-histogram/' },
    title: { 'zh-CN': 'EX13：私有化 Histogram 可运行示例', en: 'EX13: Privatized Histogram Runnable Example' },
    prerequisites: ['A04'],
  },
  EX16: {
    href: { 'zh-CN': '/examples/sanitizer-defect-suite/', en: '/en/examples/sanitizer-defect-suite/' },
    title: { 'zh-CN': 'EX16：Compute Sanitizer 缺陷套件可运行示例', en: 'EX16: Compute Sanitizer Defect Suite Runnable Example' },
    prerequisites: ['Q03', 'Q04'],
  },
  LAB01: {
    href: { 'zh-CN': '/labs/record-cuda-environment/', en: '/en/labs/record-cuda-environment/' },
    title: { 'zh-CN': 'LAB01：记录并解读 CUDA 环境', en: 'LAB01: Record and Interpret a CUDA Environment' },
    prerequisites: ['O03', 'O08'],
    indexGroup: 'labs',
  },
  LAB02: {
    href: { 'zh-CN': '/labs/vector-addition/', en: '/en/labs/vector-addition/' },
    title: { 'zh-CN': 'LAB02：运行并验证向量加法', en: 'LAB02: Run and Verify Vector Addition' },
    prerequisites: ['O03', 'F01'],
    indexGroup: 'labs',
  },
  LAB03: {
    href: { 'zh-CN': '/labs/break-and-repair-indexing/', en: '/en/labs/break-and-repair-indexing/' },
    title: { 'zh-CN': 'LAB03：破坏并修复索引', en: 'LAB03: Break and Repair Indexing' },
    prerequisites: ['F03', 'F05'],
    indexGroup: 'labs',
  },
  LAB04: {
    href: { 'zh-CN': '/labs/observe-coalescing/', en: '/en/labs/observe-coalescing/' },
    title: { 'zh-CN': 'LAB04：观察合并访问', en: 'LAB04: Observe Coalescing' },
    prerequisites: ['M02', 'Q05'],
    indexGroup: 'labs',
  },
  LAB05: {
    href: { 'zh-CN': '/labs/remove-shared-memory-bank-conflicts/', en: '/en/labs/remove-shared-memory-bank-conflicts/' },
    title: { 'zh-CN': 'LAB05：消除共享内存存储体冲突', en: 'LAB05: Remove Shared-Memory Bank Conflicts' },
    prerequisites: ['M04', 'Q05'],
    indexGroup: 'labs',
  },
  LAB07: {
    href: { 'zh-CN': '/labs/diagnose-four-sanitizer-failures/', en: '/en/labs/diagnose-four-sanitizer-failures/' },
    title: { 'zh-CN': 'LAB07：诊断四类 Sanitizer 故障', en: 'LAB07: Diagnose Four Sanitizer Failures' },
    prerequisites: ['Q03', 'Q04'],
    indexGroup: 'labs',
  },
  VIS01: {
    href: { 'zh-CN': '/visuals/kernel-journey/', en: '/en/visuals/kernel-journey/' },
    title: { 'zh-CN': 'VIS01：Kernel 从 launch 到完成的路径', en: 'VIS01: A Kernel Journey from Launch to Completion' },
    prerequisites: [],
    indexGroup: 'visuals',
  },
  VIS02: {
    href: { 'zh-CN': '/visuals/indexing/', en: '/en/visuals/indexing/' },
    title: { 'zh-CN': 'VIS02：Grid、block 与 thread 索引', en: 'VIS02: Grid, Block, and Thread Indexing' },
    prerequisites: [],
    indexGroup: 'visuals',
  },
  VIS03: {
    href: { 'zh-CN': '/visuals/warp-divergence/', en: '/en/visuals/warp-divergence/' },
    title: { 'zh-CN': 'VIS03：Warp divergence 与逻辑汇合', en: 'VIS03: Warp Divergence and Logical Join' },
    prerequisites: [],
    indexGroup: 'visuals',
  },
  VIS04: {
    href: { 'zh-CN': '/visuals/memory-transactions/', en: '/en/visuals/memory-transactions/' },
    title: { 'zh-CN': 'VIS04：内存请求的 segment 分组', en: 'VIS04: Memory-request Segment Grouping' },
    prerequisites: [],
    indexGroup: 'visuals',
  },
  VIS05: {
    href: { 'zh-CN': '/visuals/shared-memory-banks/', en: '/en/visuals/shared-memory-banks/' },
    title: { 'zh-CN': 'VIS05：Shared-memory bank 映射', en: 'VIS05: Shared-memory Bank Mapping' },
    prerequisites: [],
    indexGroup: 'visuals',
  },
  VIS06: {
    href: { 'zh-CN': '/visuals/memory-hierarchy-lifetime/', en: '/en/visuals/memory-hierarchy-lifetime/' },
    title: { 'zh-CN': 'VIS06：Memory hierarchy、ownership 与 lifetime', en: 'VIS06: Memory Hierarchy, Ownership, and Lifetime' },
    prerequisites: [],
    indexGroup: 'visuals',
  },
  VIS07: {
    href: { 'zh-CN': '/visuals/stream-event-dependencies/', en: '/en/visuals/stream-event-dependencies/' },
    title: { 'zh-CN': 'VIS07：Stream 与 event dependency trace', en: 'VIS07: Stream and Event Dependency Traces' },
    prerequisites: [],
    indexGroup: 'visuals',
  },
  VIS08: {
    href: { 'zh-CN': '/visuals/page-migration/', en: '/en/visuals/page-migration/' },
    title: { 'zh-CN': 'VIS08：托管内存页面迁移', en: 'VIS08: Managed-Memory Page Migration' },
    prerequisites: ['M01', 'M02', 'M10'],
    indexGroup: 'visuals',
  },
  VIS09: {
    href: { 'zh-CN': '/visuals/artifact-pipeline/', en: '/en/visuals/artifact-pipeline/' },
    title: { 'zh-CN': 'NVCC 构建产物流水线', en: 'NVCC Artifact Pipeline' },
    prerequisites: ['M15', 'M16', 'M17'],
    indexGroup: 'visuals',
  },
  VIS10: {
    href: { 'zh-CN': '/visuals/reduction-stages/', en: '/en/visuals/reduction-stages/' },
    title: { 'zh-CN': 'Reduction tree 与非活动通道', en: 'Reduction Tree and Inactive Lanes' },
    prerequisites: ['A02'],
    indexGroup: 'visuals',
  },
  VIS19: {
    href: { 'zh-CN': '/foundations/asynchronous-errors/#vis19', en: '/en/foundations/asynchronous-errors/#vis19' },
    title: { 'zh-CN': 'VIS19：错误暴露时间线', en: 'VIS19: Error-Surfacing Timeline' },
    prerequisites: ['F04'],
    indexGroup: 'visuals',
  },
  VIS20: {
    href: { 'zh-CN': '/foundations/compute-capability/#vis20', en: '/en/foundations/compute-capability/#vis20' },
    title: { 'zh-CN': 'VIS20：计算能力合同筛选器', en: 'VIS20: Compute-Capability Contract Filter' },
    prerequisites: ['F02', 'O03'],
    indexGroup: 'visuals',
  },
  VIS21: {
    href: { 'zh-CN': '/foundations/runtime-driver-api/#vis21', en: '/en/foundations/runtime-driver-api/#vis21' },
    title: { 'zh-CN': 'VIS21：Runtime/Driver API 边界', en: 'VIS21: Runtime/Driver API Boundary' },
    prerequisites: ['F04', 'F05'],
    indexGroup: 'visuals',
  },
  VIS22: {
    href: { 'zh-CN': '/foundations/launch-geometry/#vis22', en: '/en/foundations/launch-geometry/#vis22' },
    title: { 'zh-CN': 'VIS22：线程块形状约束探索器', en: 'VIS22: Block-Shape Constraint Explorer' },
    prerequisites: ['F02', 'F03', 'F06'],
    indexGroup: 'visuals',
  },
};

export const MAX_REVIEW_AGE_DAYS = 180;
export const REVIEW_DATE_TIME_ZONE = 'Asia/Shanghai';

const MILLISECONDS_PER_DAY = 86_400_000;
const reviewDateFormatter = new Intl.DateTimeFormat('en', {
  timeZone: REVIEW_DATE_TIME_ZONE,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
});
const planningIdPatterns: Readonly<Record<IndexGroup, RegExp>> = {
  labs: /^LAB\d{2}$/,
  practice: /^PB-R\d+-\d{3}$/,
  visuals: /^VIS\d{2}$/,
  glossary: /^TERM-\d{3}$/,
  sources: /^SRC-(?:WEB|CUDA|CPP|LINUX|ARCH|HIST)-\d{3}$/,
};
const compilationStatuses = new Set<string>(COMPILATION_EVIDENCE_STATUSES);
const runtimeStatuses = new Set<string>(RUNTIME_EVIDENCE_STATUSES);

function internalCounterpart(href: string) {
  const url = new URL(href, 'https://resource-index.invalid');
  const path = url.pathname === '/' ? '/en/' : `/en${url.pathname}`;
  return `${path}${url.search}${url.hash}`;
}

function nonEmpty(value: string) {
  return value.trim().length > 0;
}

function duplicateValues(values: readonly string[]) {
  return values.filter((value, index) => values.indexOf(value) !== index);
}

function dateIssues(label: string, value: string, asOf: Date, maximumAgeDays: number) {
  const issues: string[] = [];
  const date = parseIsoDate(value);
  if (!date) return [`${label} must be a real ISO date.`];
  const parts = Object.fromEntries(
    reviewDateFormatter.formatToParts(asOf)
      .filter(({ type }) => type === 'year' || type === 'month' || type === 'day')
      .map(({ type, value: part }) => [type, Number(part)]),
  );
  const reviewDate = Date.UTC(parts.year, parts.month - 1, parts.day);
  const age = Math.floor((reviewDate - date.valueOf()) / MILLISECONDS_PER_DAY);
  if (age < 0) issues.push(`${label} must not be in the future.`);
  if (age > maximumAgeDays) issues.push(`${label} is stale (${age} days old; maximum ${maximumAgeDays}).`);
  return issues;
}

export type ResourceCatalogValidationOptions = Readonly<{
  asOf?: Date;
  maximumAgeDays?: number;
  destinations?: Readonly<Record<string, PublishedDestination>>;
  requiredGroups?: readonly IndexGroup[];
}>;

export function validateResourceCatalog(
  records: readonly ResourceIndexRecord[],
  {
    asOf = new Date(),
    maximumAgeDays = MAX_REVIEW_AGE_DAYS,
    destinations = PUBLISHED_DESTINATIONS,
    requiredGroups = INDEX_GROUPS,
  }: ResourceCatalogValidationOptions = {},
) {
  const issues: string[] = [];
  const seenIds = new Set<string>();
  const seenHrefs = new Set<string>();

  if (Number.isNaN(asOf.valueOf())) issues.push('The catalog validation date is invalid.');
  if (!Number.isInteger(maximumAgeDays) || maximumAgeDays < 0) {
    issues.push('The maximum review age must be a non-negative integer.');
  }

  for (const [unitId, destination] of Object.entries(destinations)) {
    for (const locale of INDEX_LOCALES) {
      if (!nonEmpty(destination.title[locale])) issues.push(`${unitId} has an empty ${locale} destination title.`);
      if (!destination.href[locale].startsWith('/')) issues.push(`${unitId} has a non-internal ${locale} destination.`);
    }
    if (internalCounterpart(destination.href['zh-CN']) !== destination.href.en) {
      issues.push(`${unitId} destination counterparts do not align.`);
    }
    for (const prerequisite of destination.prerequisites) {
      if (!destinations[prerequisite]) issues.push(`${unitId} has unknown prerequisite ${prerequisite}.`);
      if (prerequisite === unitId) issues.push(`${unitId} cannot require itself.`);
    }
    for (const duplicate of duplicateValues(destination.prerequisites)) {
      issues.push(`${unitId} repeats prerequisite ${duplicate}.`);
    }
  }

  const visited = new Set<string>();
  const active = new Set<string>();
  const visit = (unitId: string) => {
    if (active.has(unitId)) {
      issues.push(`The prerequisite graph contains a cycle through ${unitId}.`);
      return;
    }
    if (visited.has(unitId)) return;
    active.add(unitId);
    for (const prerequisite of destinations[unitId]?.prerequisites ?? []) visit(prerequisite);
    active.delete(unitId);
    visited.add(unitId);
  };
  for (const unitId of Object.keys(destinations)) visit(unitId);

  for (const record of records) {
    const prefix = record.planningId || '(missing planning ID)';
    if (!planningIdPatterns[record.group]?.test(record.planningId)) {
      issues.push(`${prefix} is not a valid planning ID for ${record.group}.`);
    }
    if (seenIds.has(record.planningId)) issues.push(`${prefix} is duplicated.`);
    seenIds.add(record.planningId);

    if (!RESOURCE_TYPES.includes(record.resourceType)) issues.push(`${prefix} has unknown resource type ${record.resourceType}.`);
    for (const locale of INDEX_LOCALES) {
      if (!nonEmpty(record.title[locale])) issues.push(`${prefix} has an empty ${locale} title.`);
      if (!nonEmpty(record.hardwareGate[locale])) issues.push(`${prefix} has an empty ${locale} hardware gate.`);
      if (!nonEmpty(record.versionGate[locale])) issues.push(`${prefix} has an empty ${locale} version gate.`);
      if (!record.href[locale].startsWith('/') || record.href[locale] === '/' || record.href[locale] === '#') {
        issues.push(`${prefix} has an empty or non-internal ${locale} destination.`);
      }
      const hrefKey = `${locale}:${record.href[locale]}`;
      if (seenHrefs.has(hrefKey)) issues.push(`${prefix} reuses destination ${record.href[locale]}.`);
      seenHrefs.add(hrefKey);
    }
    if (internalCounterpart(record.href['zh-CN']) !== record.href.en) {
      issues.push(`${prefix} is missing an aligned Publication Pair destination.`);
    }

    const destination = destinations[record.planningId];
    if (record.group === 'labs' || record.group === 'visuals') {
      if (!destination || destination.indexGroup !== record.group) {
        issues.push(`${prefix} has no published ${record.group} subject.`);
      } else if (INDEX_LOCALES.some((locale) => destination.href[locale] !== record.href[locale])) {
        issues.push(`${prefix} does not link to its published subject.`);
      }
      if (destination && record.prerequisites.join(',') !== destination.prerequisites.join(',')) {
        issues.push(`${prefix} prerequisites do not match its published subject.`);
      }
    } else {
      for (const locale of INDEX_LOCALES) {
        const url = new URL(record.href[locale], 'https://resource-index.invalid');
        if (url.pathname !== INDEX_ROUTES[record.group][locale] || !url.hash.slice(1)) {
          issues.push(`${prefix} must link to a non-empty destination within its ${record.group} index.`);
        }
      }
    }

    for (const relation of [...record.prerequisites, ...record.relatedUnits]) {
      if (!destinations[relation]) issues.push(`${prefix} links to unknown curriculum ID ${relation}.`);
      if (relation === record.planningId) issues.push(`${prefix} cannot relate to itself.`);
    }
    for (const duplicate of duplicateValues(record.prerequisites)) issues.push(`${prefix} repeats prerequisite ${duplicate}.`);
    for (const duplicate of duplicateValues(record.relatedUnits)) issues.push(`${prefix} repeats related unit ${duplicate}.`);
    const prerequisiteOrderComesFromDestination = record.group === 'labs' || record.group === 'visuals';
    if (!prerequisiteOrderComesFromDestination) {
      for (const [index, prerequisite] of record.prerequisites.entries()) {
        const requiredEarlier = new Set<string>();
        const collect = (unitId: string) => {
          for (const required of destinations[unitId]?.prerequisites ?? []) {
            if (requiredEarlier.has(required)) continue;
            requiredEarlier.add(required);
            collect(required);
          }
        };
        collect(prerequisite);
        for (const required of requiredEarlier) {
          const requiredIndex = record.prerequisites.indexOf(required);
          if (requiredIndex > index) issues.push(`${prefix} lists ${prerequisite} before its prerequisite ${required}.`);
        }
      }
    }

    if (record.group === 'labs' && !record.evidence) issues.push(`${prefix} must project its Evidence Status.`);
    if (record.group === 'visuals' && record.evidence) issues.push(`${prefix} must not receive CUDA Evidence Status.`);
    if (record.evidence) {
      for (const status of record.evidence.compilation) {
        if (!compilationStatuses.has(status)) issues.push(`${prefix} has unknown compilation status ${status}.`);
      }
      for (const status of record.evidence.runtime) {
        if (!runtimeStatuses.has(status)) issues.push(`${prefix} has unknown runtime status ${status}.`);
      }
      for (const message of evidenceStatusIssues(record.evidence.compilation, record.evidence.runtime)) {
        issues.push(`${prefix}: ${message}`);
      }
    }

    issues.push(...dateIssues(`${prefix} reviewedOn`, record.reviewedOn, asOf, maximumAgeDays));
    if (record.group === 'sources' && !record.sourceAccessDate) {
      issues.push(`${prefix} is missing a source access date.`);
    }
    if (record.sourceAccessDate) {
      issues.push(...dateIssues(`${prefix} sourceAccessDate`, record.sourceAccessDate, asOf, maximumAgeDays));
      const reviewed = parseIsoDate(record.reviewedOn);
      const accessed = parseIsoDate(record.sourceAccessDate);
      if (reviewed && accessed && accessed > reviewed) issues.push(`${prefix} was reviewed before its source was accessed.`);
    }
  }

  for (const group of requiredGroups) {
    if (!records.some((record) => record.group === group)) issues.push(`${group} has no eligible published entries.`);
  }
  for (const [unitId, destination] of Object.entries(destinations)) {
    if (!destination.indexGroup) continue;
    const matches = records.filter((record) => record.planningId === unitId && record.group === destination.indexGroup);
    if (matches.length !== 1) issues.push(`${unitId} is orphaned from the ${destination.indexGroup} index.`);
  }

  if (issues.length > 0) {
    throw new Error(`Resource index catalog validation failed:\n${issues.map((issue) => `- ${issue}`).join('\n')}`);
  }
}

export type ResourceIndexRelation = Readonly<{
  id: string;
  href: string;
  title: string;
}>;

export type ResourceIndexViewItem = Readonly<{
  planningId: string;
  title: string;
  href: string;
  counterpart: string;
  resourceType: ResourceType;
  prerequisites: readonly ResourceIndexRelation[];
  relatedUnits: readonly ResourceIndexRelation[];
  hardwareGate: string;
  versionGate: string;
  reviewedOn: string;
  difficulty?: ResourceIndexRecord['difficulty'];
  evidence?: EvidenceProjection;
  sourceAccessDate?: string;
  searchText: string;
}>;

export function projectResourceIndex(
  records: readonly ResourceIndexRecord[],
  group: IndexGroup,
  locale: IndexLocale,
  options: ResourceCatalogValidationOptions = {},
) {
  const destinations = options.destinations ?? PUBLISHED_DESTINATIONS;
  validateResourceCatalog(records, options);
  const otherLocale: IndexLocale = locale === 'zh-CN' ? 'en' : 'zh-CN';
  const relationFor = (unitId: string): ResourceIndexRelation => ({
    id: unitId,
    href: destinations[unitId]?.href[locale] ?? '',
    title: destinations[unitId]?.title[locale] ?? unitId,
  });

  return records
    .filter((record) => record.group === group)
    .map<ResourceIndexViewItem>((record) => {
      const prerequisites = record.prerequisites.map(relationFor);
      const relatedUnits = record.relatedUnits.map(relationFor);
      const searchText = [
        record.planningId,
        record.title[locale],
        record.resourceType,
        record.difficulty ?? '',
        record.hardwareGate[locale],
        record.versionGate[locale],
        record.keywords?.[locale] ?? '',
        ...prerequisites.flatMap(({ id, title }) => [id, title]),
        ...relatedUnits.flatMap(({ id, title }) => [id, title]),
        ...(record.evidence?.compilation ?? []),
        ...(record.evidence?.runtime ?? []),
      ].join(' ');

      return {
        planningId: record.planningId,
        title: record.title[locale],
        href: record.href[locale],
        counterpart: record.href[otherLocale],
        resourceType: record.resourceType,
        prerequisites,
        relatedUnits,
        hardwareGate: record.hardwareGate[locale],
        versionGate: record.versionGate[locale],
        reviewedOn: record.reviewedOn,
        difficulty: record.difficulty,
        evidence: record.evidence,
        sourceAccessDate: record.sourceAccessDate,
        searchText,
      };
    })
    .sort((left, right) => left.planningId.localeCompare(right.planningId, 'en', { numeric: true }));
}
