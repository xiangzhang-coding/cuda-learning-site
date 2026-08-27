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
