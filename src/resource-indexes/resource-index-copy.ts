// SPDX-License-Identifier: Apache-2.0
import type { IndexLocale, LocalizedText, ResourceType } from './resource-index-model';

export const RESOURCE_TYPE_LABELS: Readonly<Record<ResourceType, LocalizedText>> = {
  'guided-lab': { 'zh-CN': '引导式实验', en: 'Guided Lab' },
  'mental-model': { 'zh-CN': '核心心智模型', en: 'Core mental model' },
  'correctness-debugging': { 'zh-CN': '调试与正确性', en: 'Debugging and correctness' },
  'concepts-implementation': { 'zh-CN': '概念与实现', en: 'Concepts and implementation' },
  'evidence-review': { 'zh-CN': '证据审查与实验准备', en: 'Evidence review and Lab preparation' },
  'execution-model': { 'zh-CN': '执行路径模型', en: 'Execution-path model' },
  'indexing-model': { 'zh-CN': '索引模型', en: 'Indexing model' },
  'resource-vocabulary': { 'zh-CN': '资源词汇', en: 'Resource vocabulary' },
  'evidence-vocabulary': { 'zh-CN': '证据词汇', en: 'Evidence vocabulary' },
  'environment-vocabulary': { 'zh-CN': '环境与版本词汇', en: 'Environment and version vocabulary' },
  'kernel-vocabulary': { 'zh-CN': 'Kernel 基础词汇', en: 'Kernel foundations vocabulary' },
  'publishing-interface': { 'zh-CN': '发布接口', en: 'Publishing interface' },
  'cuda-version-record': { 'zh-CN': 'CUDA 版本记录', en: 'CUDA version record' },
  'cpp-language-record': { 'zh-CN': 'C++ 语言与工具记录', en: 'C++ language and tool record' },
  'linux-tool-record': { 'zh-CN': 'Linux 工具记录', en: 'Linux tool record' },
  'architecture-record': { 'zh-CN': '架构来源记录', en: 'Architecture source record' },
  'historical-record': { 'zh-CN': '历史主来源记录', en: 'Historical primary-source record' },
};

export const DIFFICULTY_LABELS = {
  foundational: { 'zh-CN': '基础', en: 'Foundational' },
  introductory: { 'zh-CN': '入门', en: 'Introductory' },
  intermediate: { 'zh-CN': '中级', en: 'Intermediate' },
  advanced: { 'zh-CN': '高级', en: 'Advanced' },
} as const;

type ResourceIndexCopy = Readonly<{
  controlsLabel: string;
  searchLabel: string;
  searchPlaceholder: string;
  typeLabel: string;
  allTypes: string;
  relationLabel: string;
  allRelations: string;
  reset: string;
  count: (visible: number, total: number) => string;
  noResults: string;
  planningId: string;
  resourceType: string;
  difficulty: string;
  prerequisites: string;
  relatedUnits: string;
  hardwareGate: string;
  versionGate: string;
  evidence: string;
  compilation: string;
  runtime: string;
  evidenceNotApplicable: string;
  reviewedOn: string;
  sourceAccessDate: string;
  none: string;
}>;

export const RESOURCE_INDEX_COPY: Readonly<Record<IndexLocale, ResourceIndexCopy>> = {
  'zh-CN': {
    controlsLabel: '资源索引筛选',
    searchLabel: '搜索已发布条目',
    searchPlaceholder: 'ID、标题、版本或硬件',
    typeLabel: '资源类型',
    allTypes: '全部类型',
    relationLabel: '相关资源',
    allRelations: '全部相关资源',
    reset: '重置筛选',
    count: (visible, total) => `显示 ${visible} / ${total} 个已发布条目`,
    noResults: '没有条目同时满足当前筛选。重置筛选可恢复完整静态索引。',
    planningId: '规划 ID',
    resourceType: '资源类型',
    difficulty: '难度',
    prerequisites: '先修条件',
    relatedUnits: '相关资源',
    hardwareGate: '硬件门槛',
    versionGate: '版本门槛',
    evidence: '证据状态',
    compilation: '编译',
    runtime: '运行',
    evidenceNotApplicable: '不适用；此浏览器模型不获得 CUDA Evidence Status。',
    reviewedOn: '最后复核',
    sourceAccessDate: '来源访问日期',
    none: '无',
  },
  en: {
    controlsLabel: 'Resource index filters',
    searchLabel: 'Search published entries',
    searchPlaceholder: 'ID, title, version, or hardware',
    typeLabel: 'Resource type',
    allTypes: 'All types',
    relationLabel: 'Related resource',
    allRelations: 'All related resources',
    reset: 'Reset filters',
    count: (visible, total) => `Showing ${visible} of ${total} published entries`,
    noResults: 'No entry matches all current filters. Reset filters to restore the complete static index.',
    planningId: 'Planning ID',
    resourceType: 'Resource type',
    difficulty: 'Difficulty',
    prerequisites: 'Prerequisites',
    relatedUnits: 'Related resources',
    hardwareGate: 'Hardware gate',
    versionGate: 'Version gate',
    evidence: 'Evidence Status',
    compilation: 'Compilation',
    runtime: 'Runtime',
    evidenceNotApplicable: 'Not applicable; this browser model receives no CUDA Evidence Status.',
    reviewedOn: 'Last reviewed',
    sourceAccessDate: 'Source access date',
    none: 'None',
  },
};
