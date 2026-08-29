// SPDX-License-Identifier: Apache-2.0
import type {
  PageMigrationIssue,
  PageMigrationOperation,
  PageMigrationOrigin,
  PageMigrationScenarioId,
} from './page-migration-model';

export type PageMigrationLocale = 'zh-CN' | 'en';

type PageMigrationCopy = Readonly<{
  eyebrow: string;
  title: string;
  summary: string;
  conceptualNotice: string;
  assumptionsHeading: string;
  assumptions: readonly string[];
  controlsHeading: string;
  scenarioLabel: string;
  step: string;
  reset: string;
  scenarioCopy: Readonly<Record<PageMigrationScenarioId, Readonly<{ title: string; description: string }>>>;
  origins: Readonly<Record<PageMigrationOrigin, string>>;
  operations: Readonly<Record<PageMigrationOperation, string>>;
  workbenchHeading: string;
  railHeading: string;
  currentAccess: string;
  nextAccess: string;
  sequenceComplete: string;
  page: string;
  origin: string;
  operation: string;
  residency: string;
  residencyBefore: string;
  residencyAfter: string;
  transition: string;
  transitionYes: string;
  transitionNo: string;
  transitionCount: string;
  symbolicBytes: string;
  symbolicBytesBoundary: string;
  ledgerHeading: string;
  noCompletedAccesses: string;
  staticHeading: string;
  staticIntro: string;
  finalResidency: string;
  statusReady: string;
  statusScenario: string;
  statusStep: string;
  statusReset: string;
  issues: Readonly<Record<PageMigrationIssue, string>>;
  noEvidence: string;
}>;

export const PAGE_MIGRATION_COPY: Readonly<Record<PageMigrationLocale, PageMigrationCopy>> = {
  'zh-CN': {
    eyebrow: 'VIS08 · DECLARED RESIDENCY / SYMBOLIC TRANSITIONS',
    title: '托管内存页面迁移',
    summary: '沿固定 CPU/GPU access sequence 检查每个声明页面的 residency-before、residency-after、模型 transition count 与符号字节数。',
    conceptualNotice: '这是显式声明的软件一致性（software-coherent）教学假设，不是 profiler trace。每次 access 只应用页面下方列出的模型规则；页面没有检测 page size、page fault、data migration、byte transfer 或 latency。',
    assumptionsHeading: '声明的模型假设',
    assumptions: [
      '每个教学页面在每一步只有一个声明位置：CPU 或 GPU。',
      '当 access origin 与声明位置不同时，模型把该页的声明位置改为 access origin，并把 modeled transition count 加一。',
      '声明 page size 固定为 65,536 B；符号字节数只等于 transition count x 65,536 B。',
      '模型排除 hardware-coherent direct access、remote mapping、prefetch、memory advice、access counter、oversubscription 与 multi-GPU placement。',
    ],
    controlsHeading: 'Residency sequence 控制',
    scenarioLabel: '已复核场景',
    step: '单步 access',
    reset: '重置 sequence',
    scenarioCopy: {
      'gpu-linear-sweep': {
        title: 'GPU linear sweep',
        description: '四个页面初始声明位于 CPU；GPU 按 page-00 到 page-03 的固定顺序读取。',
      },
      'alternating-hot-page': {
        title: 'Alternating hot page',
        description: 'CPU 与 GPU 轮流访问 page-00，最后由 CPU 读取仍声明位于 CPU 的 page-01。',
      },
      'split-working-set': {
        title: 'Split working set',
        description: '两个页面初始声明位于 CPU，两个位于 GPU；前两次 access 保持位置，后两次跨越声明位置。',
      },
    },
    origins: { cpu: 'CPU', gpu: 'GPU' },
    operations: { read: 'read', write: 'write' },
    workbenchHeading: '确定性 page residency rail',
    railHeading: '当前声明 residency',
    currentAccess: 'Access cursor',
    nextAccess: '下一次 access',
    sequenceComplete: 'Sequence complete：没有下一次 access',
    page: '页面',
    origin: 'Access origin',
    operation: 'Operation',
    residency: '声明 residency',
    residencyBefore: 'Residency before',
    residencyAfter: 'Residency after',
    transition: 'Modeled transition',
    transitionYes: '是：声明位置改变',
    transitionNo: '否：声明位置不变',
    transitionCount: 'Modeled transition count',
    symbolicBytes: '符号字节数',
    symbolicBytesBoundary: '符号字节数来自声明 page size 的乘法，不是观察到的 transfer bytes。',
    ledgerHeading: 'Residency transition ledger',
    noCompletedAccesses: '尚未应用 access；ledger 为空。',
    staticHeading: '无脚本 residency sequence',
    staticIntro: '三个固定场景的初始条件、最终 rail 与每一条 before/after ledger row 都由服务器渲染；禁用 JavaScript 与打印时仍保持完整。',
    finalResidency: '完整 sequence 后的声明 residency',
    statusReady: '模型已就绪；尚未应用 access。',
    statusScenario: '已选择 {scenario}；sequence 已重置。',
    statusStep: 'Step {current}/{total}：{origin} {operation} {page}；{before} -> {after}；transition count {count}；{bytes}。',
    statusReset: 'Sequence 已重置；焦点返回场景选择器。',
    issues: {
      'invalid-state': '拒绝：模型 state 无效；上一状态保持不变。',
      'invalid-action': '拒绝：control action 无效；上一状态保持不变。',
      'unknown-scenario': '拒绝：场景 ID 未知；上一状态保持不变。',
      'sequence-complete': 'Sequence 已完成；请重置或选择另一个场景。',
    },
    noEvidence: 'VIS08 不编译或运行 CUDA，也不观察 page fault、data migration、transfer bytes 或 latency。Residency rail、transition count 与符号字节数不会授予 Compile-Checked、Community-Observed 或 Runtime-Verified Evidence Status。',
  },
  en: {
    eyebrow: 'VIS08 · DECLARED RESIDENCY / SYMBOLIC TRANSITIONS',
    title: 'Managed-Memory Page Migration',
    summary: 'Follow fixed CPU/GPU access sequences and inspect each declared page residency before and after, the modeled transition count, and symbolic bytes.',
    conceptualNotice: 'This is an explicitly declared software-coherent teaching assumption, not a profiler trace. Each access applies only the rule listed below; the page detects no page size, page fault, data migration, byte transfer, or latency.',
    assumptionsHeading: 'Declared model assumptions',
    assumptions: [
      'Each teaching page has exactly one declared location at each step: CPU or GPU.',
      'When an access origin differs from the declared location, the model changes that page declaration to the access origin and increments the modeled transition count.',
      'The declared page size is fixed at 65,536 B; symbolic bytes equal only transition count x 65,536 B.',
      'The model excludes hardware-coherent direct access, remote mapping, prefetch, memory advice, access counters, oversubscription, and multi-GPU placement.',
    ],
    controlsHeading: 'Residency sequence controls',
    scenarioLabel: 'Reviewed scenario',
    step: 'Step access',
    reset: 'Reset sequence',
    scenarioCopy: {
      'gpu-linear-sweep': {
        title: 'GPU linear sweep',
        description: 'Four pages begin declared at the CPU; the GPU reads page-00 through page-03 in fixed order.',
      },
      'alternating-hot-page': {
        title: 'Alternating hot page',
        description: 'CPU and GPU accesses alternate on page-00, then the CPU reads page-01 while it remains declared at the CPU.',
      },
      'split-working-set': {
        title: 'Split working set',
        description: 'Two pages begin declared at the CPU and two at the GPU; two matching-origin accesses precede two cross-location accesses.',
      },
    },
    origins: { cpu: 'CPU', gpu: 'GPU' },
    operations: { read: 'read', write: 'write' },
    workbenchHeading: 'Deterministic page residency rail',
    railHeading: 'Current declared residency',
    currentAccess: 'Access cursor',
    nextAccess: 'Next access',
    sequenceComplete: 'Sequence complete: no next access',
    page: 'Page',
    origin: 'Access origin',
    operation: 'Operation',
    residency: 'Declared residency',
    residencyBefore: 'Residency before',
    residencyAfter: 'Residency after',
    transition: 'Modeled transition',
    transitionYes: 'yes: declaration changed',
    transitionNo: 'no: declaration unchanged',
    transitionCount: 'Modeled transition count',
    symbolicBytes: 'Symbolic bytes',
    symbolicBytesBoundary: 'Symbolic bytes come from the declared page-size multiplication, not observed transfer bytes.',
    ledgerHeading: 'Residency transition ledger',
    noCompletedAccesses: 'No access has been applied; the ledger is empty.',
    staticHeading: 'No-script residency sequences',
    staticIntro: 'The initial conditions, final rail, and every before/after ledger row for all three fixed scenarios are server-rendered and remain complete without JavaScript and in print.',
    finalResidency: 'Declared residency after the complete sequence',
    statusReady: 'Model ready; no access has been applied.',
    statusScenario: 'Selected {scenario}; the sequence reset.',
    statusStep: 'Step {current}/{total}: {origin} {operation} {page}; {before} -> {after}; transition count {count}; {bytes}.',
    statusReset: 'Sequence reset; focus returned to the scenario selector.',
    issues: {
      'invalid-state': 'Rejected: model state is invalid; the previous state is unchanged.',
      'invalid-action': 'Rejected: control action is invalid; the previous state is unchanged.',
      'unknown-scenario': 'Rejected: scenario ID is unknown; the previous state is unchanged.',
      'sequence-complete': 'The sequence is complete; reset or select another scenario.',
    },
    noEvidence: 'VIS08 compiles and executes no CUDA and observes no page fault, data migration, transfer bytes, or latency. Its residency rail, transition count, and symbolic bytes grant no Compile-Checked, Community-Observed, or Runtime-Verified Evidence Status.',
  },
};
