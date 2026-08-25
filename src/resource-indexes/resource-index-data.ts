// SPDX-License-Identifier: Apache-2.0
import {
  PUBLISHED_DESTINATIONS,
  type LocalizedText,
  type ResourceIndexRecord,
  type ResourceType,
} from './resource-index-model';

const localized = (zh: string, en: string): LocalizedText => ({ 'zh-CN': zh, en });
const same = (value: string): LocalizedText => localized(value, value);
const noHardware = localized('无；仅浏览静态记录。', 'None; static record lookup only.');

function glossaryRecord(
  planningId: string,
  title: string,
  resourceType: ResourceType,
  relatedUnits: readonly string[],
  versionZh: string,
  versionEn: string,
): ResourceIndexRecord {
  const anchor = planningId.toLowerCase();
  return {
    planningId,
    group: 'glossary',
    title: same(title),
    href: localized(`/glossary/#${anchor}`, `/en/glossary/#${anchor}`),
    resourceType,
    prerequisites: [],
    relatedUnits,
    hardwareGate: noHardware,
    versionGate: localized(versionZh, versionEn),
    reviewedOn: '2026-08-25',
  };
}

function sourceRecord(
  planningId: string,
  title: LocalizedText,
  resourceType: 'publishing-interface' | 'cuda-version-record',
  relatedUnits: readonly string[],
  versionGate: LocalizedText,
  reviewedOn = '2026-08-24',
  sourceAccessDate = '2026-08-24',
): ResourceIndexRecord {
  const anchor = planningId.toLowerCase();
  return {
    planningId,
    group: 'sources',
    title,
    href: localized(`/sources-and-versions/#${anchor}`, `/en/sources-and-versions/#${anchor}`),
    resourceType,
    prerequisites: [],
    relatedUnits,
    hardwareGate: noHardware,
    versionGate,
    reviewedOn,
    sourceAccessDate,
  };
}

const lab02Destination = PUBLISHED_DESTINATIONS.LAB02;
const vis01Destination = PUBLISHED_DESTINATIONS.VIS01;
const vis02Destination = PUBLISHED_DESTINATIONS.VIS02;

const labs: readonly ResourceIndexRecord[] = [
  {
    planningId: 'LAB02',
    group: 'labs',
    title: lab02Destination.title,
    href: lab02Destination.href,
    resourceType: 'guided-lab',
    difficulty: 'introductory',
    prerequisites: lab02Destination.prerequisites,
    relatedUnits: ['O02', 'EX02', 'VIS01', 'VIS02'],
    hardwareGate: localized(
      '原生 Linux；1 个 compute capability 7.5 或更新的 CUDA GPU；工作负载低于 8 GB。',
      'Native Linux; one CUDA GPU with compute capability 7.5 or newer; workload below 8 GB.',
    ),
    versionGate: localized(
      'CUDA Toolkit Lane 11.8.0、12.9.2 或 13.3.1；C++17。',
      'CUDA Toolkit Lane 11.8.0, 12.9.2, or 13.3.1; C++17.',
    ),
    evidence: {
      compilation: ['Compile-Checked'],
      runtime: ['Pending Hardware Verification'],
    },
    reviewedOn: '2026-08-24',
    keywords: localized('向量加法 manifest CPU reference 容差', 'vector addition manifest CPU reference tolerance'),
  },
];

const practice: readonly ResourceIndexRecord[] = [
  {
    planningId: 'PB-R0-001',
    group: 'practice',
    title: localized('修复 Evidence Status 记录', 'Repair an Evidence Status record'),
    href: localized('/practice/#pb-r0-001', '/en/practice/#pb-r0-001'),
    resourceType: 'mental-model',
    difficulty: 'foundational',
    prerequisites: ['O02'],
    relatedUnits: ['O02'],
    hardwareGate: localized('无；只分析文本记录。', 'None; analyse a text record only.'),
    versionGate: localized('O02 证据合同；NVCC 13.3.1 编译与运行阶段。', 'O02 evidence contract; NVCC 13.3.1 compile and run phases.'),
    reviewedOn: '2026-08-25',
  },
  {
    planningId: 'PB-R0-002',
    group: 'practice',
    title: localized('补全 manifest 并修复支持边界', 'Complete a manifest and repair a support claim'),
    href: localized('/practice/#pb-r0-002', '/en/practice/#pb-r0-002'),
    resourceType: 'correctness-debugging',
    difficulty: 'foundational',
    prerequisites: ['O03'],
    relatedUnits: ['O03'],
    hardwareGate: localized('无；使用假设记录，不运行 CUDA。', 'None; use a hypothetical record and run no CUDA.'),
    versionGate: localized('O03 支持合同；CUDA 11+ 组件版本与兼容性边界。', 'O03 support contract; CUDA 11+ component versioning and compatibility boundaries.'),
    reviewedOn: '2026-08-25',
  },
  {
    planningId: 'PB-R0-003',
    group: 'practice',
    title: localized('在运行前审查索引预测', 'Review an indexing prediction before execution'),
    href: localized('/practice/#pb-r0-003', '/en/practice/#pb-r0-003'),
    resourceType: 'concepts-implementation',
    difficulty: 'foundational',
    prerequisites: ['F01'],
    relatedUnits: ['F01', 'VIS02'],
    hardwareGate: localized('无；只做静态推理。', 'None; use static reasoning only.'),
    versionGate: localized('CUDA Programming Guide v13.3 索引模型。', 'CUDA Programming Guide v13.3 indexing model.'),
    reviewedOn: '2026-08-25',
  },
  {
    planningId: 'PB-R0-004',
    group: 'practice',
    title: localized('修复不完整的错误与正确性边界', 'Repair incomplete error and correctness boundaries'),
    href: localized('/practice/#pb-r0-004', '/en/practice/#pb-r0-004'),
    resourceType: 'correctness-debugging',
    difficulty: 'foundational',
    prerequisites: ['F01'],
    relatedUnits: ['F01', 'O02', 'EX02'],
    hardwareGate: localized('无；审查假设执行流程。', 'None; review a hypothetical execution flow.'),
    versionGate: localized('EX02 正确性合同；CUDA Runtime API 13.3.1。', 'EX02 correctness contract; CUDA Runtime API 13.3.1.'),
    reviewedOn: '2026-08-25',
  },
  {
    planningId: 'PB-R0-005',
    group: 'practice',
    title: localized('审查一份 LAB02 证据申请', 'Review a LAB02 evidence request'),
    href: localized('/practice/#pb-r0-005', '/en/practice/#pb-r0-005'),
    resourceType: 'evidence-review',
    difficulty: 'foundational',
    prerequisites: ['O02', 'O03', 'F01'],
    relatedUnits: ['F01', 'O02', 'O03', 'LAB02'],
    hardwareGate: localized('无；审查文本记录，不运行 CUDA。', 'None; review a text record and run no CUDA.'),
    versionGate: localized('LAB02 的 CUDA 11.8、12.9 与 13.3 Toolkit Lane。', 'LAB02 CUDA 11.8, 12.9, and 13.3 Toolkit Lanes.'),
    reviewedOn: '2026-08-25',
  },
];

const visuals: readonly ResourceIndexRecord[] = [
  {
    planningId: 'VIS01',
    group: 'visuals',
    title: vis01Destination.title,
    href: vis01Destination.href,
    resourceType: 'execution-model',
    prerequisites: vis01Destination.prerequisites,
    relatedUnits: ['O01', 'O02', 'F01'],
    hardwareGate: localized('无；确定性浏览器模型，不需要 CUDA-capable system。', 'None; deterministic browser model with no CUDA-capable system required.'),
    versionGate: localized('CUDA Programming Guide v13.3；概念模型不承诺固定硬件调度。', 'CUDA Programming Guide v13.3; the conceptual model promises no fixed hardware schedule.'),
    reviewedOn: '2026-08-24',
    keywords: localized('launch grid block warp 内存事务 同步', 'launch grid block warp memory transaction synchronization'),
  },
  {
    planningId: 'VIS02',
    group: 'visuals',
    title: vis02Destination.title,
    href: vis02Destination.href,
    resourceType: 'indexing-model',
    prerequisites: vis02Destination.prerequisites,
    relatedUnits: ['O01', 'O02', 'F01'],
    hardwareGate: localized('无；确定性浏览器模型，不需要 CUDA-capable system。', 'None; deterministic browser model with no CUDA-capable system required.'),
    versionGate: localized('CUDA Programming Guide v13.3；1D/2D/3D 索引与本站声明的 row-major extent。', 'CUDA Programming Guide v13.3; 1D/2D/3D indexing with site-declared row-major extents.'),
    reviewedOn: '2026-08-24',
    keywords: localized('gridDim blockDim blockIdx threadIdx bounds row-major', 'gridDim blockDim blockIdx threadIdx bounds row-major'),
  },
];

const glossary: readonly ResourceIndexRecord[] = [
  glossaryRecord('TERM-001', 'Learning Site · 学习站', 'resource-vocabulary', ['O01'], '不受特定 Toolkit 版本约束。', 'Not tied to a Toolkit version.'),
  glossaryRecord('TERM-002', 'Stable Curriculum · 稳定课程', 'resource-vocabulary', ['O01'], '持续维护，不按 Toolkit 复制课程。', 'Maintained continuously rather than copied per Toolkit.'),
  glossaryRecord('TERM-003', 'Learning Unit · 学习单元', 'resource-vocabulary', ['O01'], '资源类型本身不受版本约束。', 'The resource type is version-independent.'),
  glossaryRecord('TERM-004', 'Publication Pair · 双语发布对', 'resource-vocabulary', ['O01'], '适用于每次发布。', 'Applies to every release.'),
  glossaryRecord('TERM-005', 'Runnable Example · 可运行示例', 'resource-vocabulary', ['O01', 'F01'], '每个项目单独声明版本边界。', 'Each project declares its own version boundary.'),
  glossaryRecord('TERM-006', 'Lab · 实验', 'resource-vocabulary', ['O01', 'LAB02'], '每个 Lab 单独声明环境要求。', 'Each Lab declares its environment requirements.'),
  glossaryRecord('TERM-007', 'Exercise · 练习', 'resource-vocabulary', ['O01'], '资源类型本身不受版本约束。', 'The resource type is version-independent.'),
  glossaryRecord('TERM-008', 'Practice Bank · 练习题库', 'resource-vocabulary', ['O01'], '具体条目按需声明版本边界。', 'Individual entries declare version boundaries as needed.'),
  glossaryRecord('TERM-009', 'Visual Explainer · 可视化讲解', 'resource-vocabulary', ['O01', 'VIS01', 'VIS02'], '概念模型与硬件行为必须分开。', 'Conceptual models remain separate from hardware behavior.'),
  glossaryRecord('TERM-010', 'Glossary · 术语表', 'resource-vocabulary', ['O01'], '随课程复核，不暗示接口兼容性。', 'Reviewed with the curriculum without implying interface compatibility.'),
  glossaryRecord('TERM-011', 'Evidence Status · 证据状态', 'evidence-vocabulary', ['O02'], '状态绑定对象、环境、标准和日期。', 'Status is scoped to a subject, environment, criteria, and date.'),
  glossaryRecord('TERM-012', 'Compile-Checked · 编译已检查', 'evidence-vocabulary', ['O02', 'O03'], '每项声明绑定精确 Toolkit Lane。', 'Every claim binds to an exact Toolkit Lane.'),
  glossaryRecord('TERM-013', 'Community-Observed · 社区已观察', 'evidence-vocabulary', ['O02', 'O03'], '可与 Pending Hardware Verification 并存。', 'May coexist with Pending Hardware Verification.'),
  glossaryRecord('TERM-014', 'Runtime-Verified · 运行已验证', 'evidence-vocabulary', ['O02', 'O03'], '只覆盖记录的环境与方法坐标。', 'Covers only the recorded environment and method coordinates.'),
  glossaryRecord('TERM-015', 'Pending Hardware Verification · 待硬件验证', 'evidence-vocabulary', ['O02'], '编译或社区观察不会自动移除。', 'Compilation or community observation does not remove it automatically.'),
  glossaryRecord('TERM-016', 'Runtime-Not-Applicable · 无需运行验证', 'evidence-vocabulary', ['O02'], '只能用于不要求 GPU 行为的验收。', 'Only for acceptance that requires no GPU behavior.'),
  glossaryRecord('TERM-017', 'Environment Manifest · 环境清单', 'environment-vocabulary', ['O03'], '新证据必须记录新坐标和日期。', 'New evidence records new coordinates and a date.'),
  glossaryRecord('TERM-018', 'Supported Environment · 受支持环境', 'environment-vocabulary', ['O03'], '上游支持不会自动扩大本站责任。', 'Upstream support does not expand site responsibility automatically.'),
  glossaryRecord('TERM-019', 'Reference Environment · 基准环境', 'environment-vocabulary', ['O03'], '当前尚未声明 Reference Environment。', 'No Reference Environment is currently declared.'),
  glossaryRecord('TERM-020', 'Toolkit Lane · 工具包通道', 'environment-vocabulary', ['O03'], 'Lane 是编译证据目标，不是课程副本。', 'A Lane is a compile-evidence target, not a curriculum copy.'),
  glossaryRecord('TERM-021', 'GPU Capability Tier · GPU 能力层级', 'environment-vocabulary', ['O03'], '型号或显存不能单独决定层级。', 'A model name or memory size cannot select a tier alone.'),
  glossaryRecord('TERM-022', 'Baseline GPU Capability Tier · 基础 GPU 能力层级', 'environment-vocabulary', ['O03'], 'Compute capability 7.5+；问题规模可放入 8 GB。', 'Compute capability 7.5+ with problem sizes that fit within 8 GB.'),
  glossaryRecord('TERM-023', 'Modern Single-GPU Capability Tier · 现代单 GPU 能力层级', 'environment-vocabulary', ['O03'], 'Compute capability 8.0+ 且至少 8 GB。', 'Compute capability 8.0+ and at least 8 GB.'),
  glossaryRecord('TERM-024', 'CUDA Toolkit · CUDA 工具包', 'environment-vocabulary', ['O03'], 'Toolkit Lane 使用精确 X.Y.Z 坐标。', 'Toolkit Lanes use exact X.Y.Z coordinates.'),
  glossaryRecord('TERM-025', 'compute capability · 计算能力', 'environment-vocabulary', ['O03'], '型号映射和特性表按当前 NVIDIA 文档复核。', 'Model mappings and feature tables require current NVIDIA documentation.'),
  glossaryRecord('TERM-026', 'kernel · 核函数', 'kernel-vocabulary', ['F01', 'LAB02'], 'F01 使用 CUDA Programming Guide v13.3。', 'F01 uses CUDA Programming Guide v13.3.'),
  glossaryRecord('TERM-027', 'execution configuration · 执行配置', 'kernel-vocabulary', ['F01', 'VIS02'], '执行配置不自动定义逻辑数据范围。', 'Execution configuration does not define logical data extent automatically.'),
  glossaryRecord('TERM-028', 'grid · 网格', 'kernel-vocabulary', ['F01', 'VIS01', 'VIS02'], 'Grid 坐标不保证 block 调度顺序。', 'Grid coordinates do not guarantee block scheduling order.'),
  glossaryRecord('TERM-029', 'thread block · 线程块', 'kernel-vocabulary', ['F01', 'VIS01', 'VIS02'], 'F01 使用一维 block；VIS02 覆盖多维关系。', 'F01 uses 1D blocks; VIS02 covers multidimensional relationships.'),
  glossaryRecord('TERM-030', 'thread · 线程', 'kernel-vocabulary', ['F01', 'VIS02'], 'Launch thread 可超出逻辑 extent。', 'A launched thread may lie beyond logical extent.'),
  glossaryRecord('TERM-031', 'host and device · 主机与设备', 'kernel-vocabulary', ['F01', 'LAB02'], 'LAB02 覆盖 Runtime API 11.8.0、12.9.2 与 13.3.1。', 'LAB02 covers Runtime API 11.8.0, 12.9.2, and 13.3.1.'),
  glossaryRecord('TERM-032', 'bounds check · 边界判断', 'kernel-vocabulary', ['F01', 'VIS02', 'LAB02', 'EX02'], 'EX02 的一维条件是 index < element_count。', 'EX02 uses index < element_count in one dimension.'),
  glossaryRecord('TERM-033', 'CPU reference · CPU 参考实现', 'kernel-vocabulary', ['F01', 'LAB02', 'EX02'], 'Host-only test 不授予 GPU runtime evidence。', 'A host-only test grants no GPU runtime evidence.'),
  glossaryRecord('TERM-034', 'tolerance · 容差', 'kernel-vocabulary', ['F01', 'LAB02', 'EX02'], 'EX02 使用绝对或相对 1e-5 接受规则。', 'EX02 uses an absolute-or-relative 1e-5 acceptance rule.'),
];

const sources: readonly ResourceIndexRecord[] = [
  sourceRecord('SRC-WEB-001', same('Astro'), 'publishing-interface', ['O01'], same('Astro 7.2.4'), '2026-08-25'),
  sourceRecord('SRC-WEB-002', same('Starlight'), 'publishing-interface', ['O01'], same('Starlight 0.41.7'), '2026-08-25'),
  sourceRecord('SRC-WEB-003', same('Pagefind'), 'publishing-interface', ['O01'], same('Pagefind 1.5.2'), '2026-08-25'),
  sourceRecord(
    'SRC-WEB-004',
    localized('Cloudflare 静态发布', 'Cloudflare static release'),
    'publishing-interface',
    ['O01'],
    localized('Wrangler 4.125.0；compatibility date 2026-08-24', 'Wrangler 4.125.0; compatibility date 2026-08-24'),
  ),
  sourceRecord(
    'SRC-WEB-005',
    localized('Playwright 与 axe', 'Playwright and axe'),
    'publishing-interface',
    ['O01'],
    same('Playwright 1.62.1; @axe-core/playwright 4.13.0'),
  ),
  sourceRecord(
    'SRC-WEB-006',
    localized('浏览器接口与 CSS 媒体', 'Browser APIs and CSS media'),
    'publishing-interface',
    ['O01', 'VIS01', 'VIS02'],
    localized('WHATWG Living Standard、WCAG 2.2 技术与当前 CSS 规范', 'WHATWG Living Standard, WCAG 2.2 techniques, and current CSS specifications'),
  ),
  sourceRecord(
    'SRC-WEB-007',
    localized('Docker Engine 与 Buildx', 'Docker Engine and Buildx'),
    'publishing-interface',
    ['EX02'],
    localized('每条编译记录保存 runner 实际版本', 'Each compile record captures the runner-provided versions'),
  ),
  sourceRecord(
    'SRC-CUDA-001',
    localized('CUDA 11.8 Lane 来源', 'CUDA 11.8 Lane sources'),
    'cuda-version-record',
    ['O03', 'EX02', 'LAB02'],
    localized('Toolkit 11.8.0；Ubuntu 22.04 x86-64；C++17', 'Toolkit 11.8.0; Ubuntu 22.04 x86-64; C++17'),
  ),
  sourceRecord(
    'SRC-CUDA-002',
    localized('CUDA 12.9 Lane 来源', 'CUDA 12.9 Lane sources'),
    'cuda-version-record',
    ['O03', 'EX02', 'LAB02'],
    localized('Toolkit 12.9.2；Ubuntu 24.04 x86-64；C++17/C++20', 'Toolkit 12.9.2; Ubuntu 24.04 x86-64; C++17/C++20'),
  ),
  sourceRecord(
    'SRC-CUDA-003',
    localized('CUDA 13.3 Lane 来源', 'CUDA 13.3 Lane sources'),
    'cuda-version-record',
    ['O03', 'EX02', 'LAB02'],
    localized('Toolkit 13.3.1；Ubuntu 24.04 x86-64；C++17/C++20 与 C++23 probe', 'Toolkit 13.3.1; Ubuntu 24.04 x86-64; C++17/C++20 plus a C++23 probe'),
  ),
  sourceRecord(
    'SRC-CUDA-004',
    localized('编译与运行阶段', 'Compilation and running phases'),
    'cuda-version-record',
    ['O02'],
    same('NVCC 13.3.1'),
  ),
  sourceRecord(
    'SRC-CUDA-005',
    same('compute capability'),
    'cuda-version-record',
    ['O03'],
    same('CUDA Programming Guide 13.3.1'),
  ),
  sourceRecord(
    'SRC-CUDA-006',
    localized('VIS01 execution model', 'VIS01 execution model'),
    'cuda-version-record',
    ['VIS01'],
    localized('CUDA Programming Guide v13.3；2026-05-27 更新', 'CUDA Programming Guide v13.3; updated 2026-05-27'),
  ),
  sourceRecord(
    'SRC-CUDA-007',
    localized('VIS02 indexing model', 'VIS02 indexing model'),
    'cuda-version-record',
    ['VIS02'],
    localized('CUDA Programming Guide v13.3；2026-05-27 更新', 'CUDA Programming Guide v13.3; updated 2026-05-27'),
  ),
  sourceRecord(
    'SRC-CUDA-008',
    localized('F01 first-kernel model', 'F01 first-kernel model'),
    'cuda-version-record',
    ['F01'],
    localized('CUDA Programming Guide v13.3；CUDA Runtime API 13.3.1', 'CUDA Programming Guide v13.3; CUDA Runtime API 13.3.1'),
  ),
  sourceRecord(
    'SRC-CUDA-009',
    localized('LAB02 runtime contract', 'LAB02 runtime contract'),
    'cuda-version-record',
    ['LAB02', 'EX02'],
    localized('Runtime API 11.8.0、12.9.2/页面标签 12.9.1、13.3.1', 'Runtime API 11.8.0, 12.9.2/page label 12.9.1, and 13.3.1'),
  ),
  sourceRecord(
    'SRC-CUDA-010',
    localized('容器身份', 'Container identities'),
    'cuda-version-record',
    ['EX02'],
    same('11.8.0-devel-ubuntu22.04; 12.9.2-devel-ubuntu24.04; 13.3.1-devel-ubuntu24.04'),
  ),
];

export const RESOURCE_INDEX_RECORDS: readonly ResourceIndexRecord[] = [
  ...labs,
  ...practice,
  ...visuals,
  ...glossary,
  ...sources,
];
