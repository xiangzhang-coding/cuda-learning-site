// SPDX-License-Identifier: Apache-2.0
import type { KernelJourneyStageId } from './kernel-journey-model';

export type VisualLocale = 'zh-CN' | 'en';

type StageCopy = {
  title: string;
  signal: string;
  description: string;
  boundary: string;
};

type KernelJourneyCopy = {
  eyebrow: string;
  title: string;
  summary: string;
  conceptualNotice: string;
  controlsLabel: string;
  play: string;
  pause: string;
  step: string;
  reset: string;
  scrub: string;
  stepCounter: string;
  currentState: string;
  staticHeading: string;
  staticIntro: string;
  evidenceNotice: string;
  stages: Record<KernelJourneyStageId, StageCopy>;
};

export const KERNEL_JOURNEY_COPY = {
  'zh-CN': {
    eyebrow: 'VIS01 · 概念执行轨迹',
    title: '从 launch 到可观察完成',
    summary: '沿固定步骤观察一个 kernel，但不要把这条教学路径误读为硬件调度顺序。',
    conceptualNotice:
      '浏览器只展示一种允许的概念轨迹。真实 thread block 可以按任意顺序并行或串行执行；播放间隔、进度位置和高亮都不是测得的 GPU 时间。',
    controlsLabel: 'Kernel 轨迹控制',
    play: '播放',
    pause: '暂停',
    step: '单步',
    reset: '重置',
    scrub: '选择概念步骤',
    stepCounter: '步骤 {current} / {total}',
    currentState: '当前概念状态',
    staticHeading: '完整静态阶段序列',
    staticIntro: '不用播放也可以按顺序读取全部事实；当前步骤仅用“当前”文字和边框标记，不只依赖颜色。',
    evidenceNotice:
      '这个浏览器模型不会授予 Compile-Checked、Community-Observed 或 Runtime-Verified；它没有编译或运行 CUDA。',
    stages: {
      launch: {
        title: 'Launch 入队',
        signal: 'HOST → QUEUE',
        description: 'Host 把 kernel launch 放入 stream；异步 launch 调用可以在 device 工作完成前返回。',
        boundary: '此时只表达工作已提交，不表达 kernel 已开始或已完成。',
      },
      'grid-ready': {
        title: 'Grid 暴露可调度 block',
        signal: 'GRID READY',
        description: '执行配置给出 gridDim 和 blockDim，grid 中的 thread block 成为可调度工作。',
        boundary: 'CUDA 不保证不同 block 被分派或完成的顺序。',
      },
      'block-scheduled': {
        title: '示意 block 分派到 SM',
        signal: 'BLOCK → SM',
        description: '图中选择一个 block 放到一个 SM；同一 block 的 thread 在同一 SM 上执行。',
        boundary: '这是众多合法分派之一，不表示每个 block 独占一个 SM。',
      },
      'warps-formed': {
        title: 'Block 划分为 warp',
        signal: '32 LANES',
        description: 'Block 按连续、递增的局部 thread ID 划分为 32-thread warp；多维坐标按 x 最快线性化。',
        boundary: '不足 32 个 thread 的最后一个 warp 会留下未使用 lane。',
      },
      'warp-issued': {
        title: 'Ready warp 发射指令',
        signal: 'ISSUE',
        description: '示意 scheduler 从 ready warp 中选择一个并发射下一条指令。',
        boundary: 'Independent Thread Scheduling 下不能把图示高亮理解为所有 lane 在每条硬件指令上永久 lockstep。',
      },
      'memory-transactions': {
        title: '地址合并为内存事务',
        signal: '4 × 32 B',
        description: '限定示例中，32 个 lane 读取对齐、连续的 4-byte word，总共覆盖 128 B，由四个 32 B global-memory transaction 满足。',
        boundary: '这个数量只适用于所声明的宽度、对齐和地址分布，不能推广到 stride、错位或其他访问。',
      },
      'block-complete': {
        title: '示意 block 完成',
        signal: 'BLOCK DONE',
        description: '被跟踪的 block 完成；其他 block 可能早已完成、正在执行或尚未分派。',
        boundary: '一个 block 完成不等于整个 grid 完成。',
      },
      'synchronization-complete': {
        title: '同步边界观察到 grid 完成',
        signal: 'OBSERVABLE',
        description: '当全部 grid 工作完成并跨过声明的同步或依赖边界后，host 或后续工作才可安全观察结果。',
        boundary: '这里表示概念完成条件；浏览器没有调用 cudaDeviceSynchronize，也没有测量时间。',
      },
    },
  },
  en: {
    eyebrow: 'VIS01 · CONCEPTUAL EXECUTION TRACE',
    title: 'From launch to observable completion',
    summary: 'Follow one fixed teaching trace without mistaking it for a hardware scheduling order.',
    conceptualNotice:
      'The browser shows one permitted conceptual trace. Real thread blocks may execute in any order, in parallel, or in series. Playback intervals, scrub positions, and highlights are not measured GPU time.',
    controlsLabel: 'Kernel trace controls',
    play: 'Play',
    pause: 'Pause',
    step: 'Step',
    reset: 'Reset',
    scrub: 'Choose conceptual step',
    stepCounter: 'Step {current} of {total}',
    currentState: 'Current conceptual state',
    staticHeading: 'Complete static stage sequence',
    staticIntro:
      'Read every fact in order without playback. The current step is identified by text and a border, not by color alone.',
    evidenceNotice:
      'This browser model grants no Compile-Checked, Community-Observed, or Runtime-Verified status; it compiles and runs no CUDA.',
    stages: {
      launch: {
        title: 'Launch is enqueued',
        signal: 'HOST → QUEUE',
        description: 'The host enqueues a kernel launch in a stream; an asynchronous launch call may return before device work completes.',
        boundary: 'This state says only that work was submitted, not that the kernel started or completed.',
      },
      'grid-ready': {
        title: 'The grid exposes eligible blocks',
        signal: 'GRID READY',
        description: 'The execution configuration supplies gridDim and blockDim, making the grid’s thread blocks eligible work.',
        boundary: 'CUDA guarantees no dispatch or completion order among independent blocks.',
      },
      'block-scheduled': {
        title: 'An illustrative block is assigned to an SM',
        signal: 'BLOCK → SM',
        description: 'The visual places one selected block on one SM; every thread in that block executes on the same SM.',
        boundary: 'This is one of many legal assignments, not one dedicated SM per block.',
      },
      'warps-formed': {
        title: 'The block is partitioned into warps',
        signal: '32 LANES',
        description: 'The block is partitioned into 32-thread warps using consecutive increasing local thread IDs; x linearizes fastest.',
        boundary: 'A final warp with fewer than 32 threads leaves lanes unused.',
      },
      'warp-issued': {
        title: 'A ready warp issues an instruction',
        signal: 'ISSUE',
        description: 'The model shows a scheduler selecting one ready warp and issuing its next instruction.',
        boundary: 'With Independent Thread Scheduling, the highlight is not a claim of permanent hardware lockstep at every instruction.',
      },
      'memory-transactions': {
        title: 'Addresses become memory transactions',
        signal: '4 × 32 B',
        description: 'In the bounded example, 32 lanes read aligned consecutive 4-byte words spanning 128 B, satisfied by four 32 B global-memory transactions.',
        boundary: 'That count applies only to the stated width, alignment, and address distribution, not to strided, misaligned, or other accesses.',
      },
      'block-complete': {
        title: 'The illustrative block completes',
        signal: 'BLOCK DONE',
        description: 'The tracked block completes while other blocks may already be done, executing, or still waiting for assignment.',
        boundary: 'One completed block does not mean the whole grid is complete.',
      },
      'synchronization-complete': {
        title: 'A synchronization boundary observes grid completion',
        signal: 'OBSERVABLE',
        description: 'After all grid work completes and a declared synchronization or dependency boundary is crossed, the host or later work can safely observe results.',
        boundary: 'This is a conceptual completion condition; the browser calls no cudaDeviceSynchronize and measures no time.',
      },
    },
  },
} as const satisfies Record<VisualLocale, KernelJourneyCopy>;

type IndexingCopy = {
  eyebrow: string;
  title: string;
  summary: string;
  conceptualNotice: string;
  controlsLabel: string;
  dimensions: string;
  dimensionOptions: Record<'1' | '2' | '3', string>;
  gridDim: string;
  blockDim: string;
  extent: string;
  blockIdx: string;
  threadIdx: string;
  reset: string;
  selectedThread: string;
  threadStrip: string;
  threadStripNote: string;
  results: string;
  globalCoordinate: string;
  localThread: string;
  warpLane: string;
  linearBlock: string;
  dataLinear: string;
  axisBounds: string;
  axis: string;
  coordinate: string;
  predicate: string;
  inBounds: string;
  outOfBounds: string;
  invalidUpdate: string;
  browserLimit: string;
  staticHeading: string;
  staticIntro: string;
  staticLabels: Record<'1d' | '2d' | '3d', string>;
  evidenceNotice: string;
};

export const INDEXING_COPY = {
  'zh-CN': {
    eyebrow: 'VIS02 · 索引预测台',
    title: '从六个 CUDA 内建量推导数据位置',
    summary: '改变 1D、2D、3D 配置并选择 thread，分别计算坐标、局部线性编号和 row-major 数据索引。',
    conceptualNotice:
      '这里只计算 CUDA 索引方程和逻辑 bounds。输入上限用于保护浏览器渲染，不是 CUDA hardware limit；页面不会 launch kernel。',
    controlsLabel: '索引配置与 thread 选择',
    dimensions: '有效维数',
    dimensionOptions: { '1': '1D', '2': '2D', '3': '3D' },
    gridDim: 'Grid 尺寸 gridDim',
    blockDim: 'Block 尺寸 blockDim',
    extent: '逻辑数据范围 extent',
    blockIdx: '选择 blockIdx',
    threadIdx: '选择 threadIdx',
    reset: '重置索引配置',
    selectedThread: '已选择 thread',
    threadStrip: '当前 y/z 切片中的 threadIdx.x',
    threadStripNote: '最多显示围绕当前选择的 32 个 x 位置；数字输入仍可选择 block 内其他合法位置。',
    results: '索引结果',
    globalCoordinate: '全局坐标',
    localThread: 'Block 内局部线性 thread ID',
    warpLane: 'Warp / lane',
    linearBlock: 'Grid 内线性 block ID',
    dataLinear: 'x-fastest row-major 数据索引',
    axisBounds: '逐轴 bounds',
    axis: '轴',
    coordinate: '坐标 / extent',
    predicate: '判断',
    inBounds: 'IN BOUNDS：所有有效轴都小于对应 extent。',
    outOfBounds: 'OUT OF BOUNDS：至少一个有效轴达到或超过对应 extent；该 thread 必须跳过该数据访问。',
    invalidUpdate: '输入无效；保留上一份合法模型。请输入界面所示范围内的十进制整数，并保持坐标小于对应尺寸。',
    browserLimit: '浏览器模型限制：每轴最多 1,000,000，block 总 thread 数最多 1,024；这些是界面保护值，不是设备能力声明。',
    staticHeading: '原创建模的静态 1D / 2D / 3D 示例',
    staticIntro: '这些注释示例由同一纯索引模型生成，在无脚本和打印环境中保留全部方程与 bounds 结论。',
    staticLabels: { '1d': '1D 最后一个 partial block', '2d': '2D x-fastest row-major', '3d': '3D 坐标与线性编号' },
    evidenceNotice:
      '这个浏览器模型不会授予 Compile-Checked、Community-Observed 或 Runtime-Verified；索引结果是方程求值，不是 CUDA 运行观察。',
  },
  en: {
    eyebrow: 'VIS02 · INDEX PREDICTION DESK',
    title: 'Derive data positions from six CUDA built-ins',
    summary: 'Change a 1D, 2D, or 3D configuration and select a thread to compute coordinates, local linear IDs, and row-major data indices separately.',
    conceptualNotice:
      'This model evaluates CUDA indexing equations and logical bounds only. Input caps protect browser rendering; they are not CUDA hardware limits. The page launches no kernel.',
    controlsLabel: 'Index configuration and thread selection',
    dimensions: 'Active dimensions',
    dimensionOptions: { '1': '1D', '2': '2D', '3': '3D' },
    gridDim: 'Grid dimensions gridDim',
    blockDim: 'Block dimensions blockDim',
    extent: 'Logical data extents',
    blockIdx: 'Selected blockIdx',
    threadIdx: 'Selected threadIdx',
    reset: 'Reset indexing configuration',
    selectedThread: 'Selected thread',
    threadStrip: 'threadIdx.x in the current y/z slice',
    threadStripNote: 'Up to 32 x positions around the current selection are shown; number inputs can still select any other legal position in the block.',
    results: 'Indexing results',
    globalCoordinate: 'Global coordinate',
    localThread: 'Block-local linear thread ID',
    warpLane: 'Warp / lane',
    linearBlock: 'Grid-linear block ID',
    dataLinear: 'x-fastest row-major data index',
    axisBounds: 'Per-axis bounds',
    axis: 'Axis',
    coordinate: 'Coordinate / extent',
    predicate: 'Predicate',
    inBounds: 'IN BOUNDS: every active coordinate is smaller than its corresponding extent.',
    outOfBounds: 'OUT OF BOUNDS: at least one active coordinate reaches or exceeds its extent; this thread must skip that data access.',
    invalidUpdate: 'Invalid input; the last valid model remains active. Enter base-10 whole numbers in the displayed ranges and keep coordinates below their dimensions.',
    browserLimit: 'Browser-model limits: 1,000,000 per axis and 1,024 total threads per block. These protect the interface and make no device-capability claim.',
    staticHeading: 'Original static 1D / 2D / 3D worked examples',
    staticIntro: 'The same pure indexing model generates these annotated examples, preserving every equation and bounds result without scripts and in print.',
    staticLabels: { '1d': '1D final partial block', '2d': '2D x-fastest row-major layout', '3d': '3D coordinates and linear IDs' },
    evidenceNotice:
      'This browser model grants no Compile-Checked, Community-Observed, or Runtime-Verified status. Its indexing results are equation evaluations, not CUDA runtime observations.',
  },
} as const satisfies Record<VisualLocale, IndexingCopy>;
