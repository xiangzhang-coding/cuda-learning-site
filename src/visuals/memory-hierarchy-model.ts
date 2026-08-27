// SPDX-License-Identifier: Apache-2.0

export type MemoryHierarchyRecordId = 'host' | 'global' | 'constant' | 'shared' | 'local' | 'register';
export type MemoryScopeFilter = 'all' | 'host' | 'grid' | 'block' | 'thread';
export type MemoryLifecycleFilter = 'all' | 'explicit-release' | 'context-end' | 'block-end' | 'thread-end';

export type MemoryHierarchyRecord = Readonly<{
  id: MemoryHierarchyRecordId;
  scope: Exclude<MemoryScopeFilter, 'all'>;
  lifecycleKind: Exclude<MemoryLifecycleFilter, 'all'>;
  physicalLayer: 'host-system' | 'device-memory' | 'streaming-multiprocessor';
  ownerAcquisition: string;
  accessibleScope: string;
  lifetime: string;
  releaseEnd: string;
  physicalAddressSpaceCaveat: string;
}>;

export const MEMORY_HIERARCHY_MODEL_CONTRACT = {
  catalog: 'host-global-constant-shared-local-register',
  cachesAreAddressSpaces: false,
  executesCuda: false,
  placementProbe: 'none',
  performanceInference: 'none',
  evidenceStatusEffect: 'none',
} as const;

export const MEMORY_SCOPE_FILTERS = ['all', 'host', 'grid', 'block', 'thread'] as const;
export const MEMORY_LIFECYCLE_FILTERS = [
  'all',
  'explicit-release',
  'context-end',
  'block-end',
  'thread-end',
] as const;

export const MEMORY_HIERARCHY_RECORDS = [
  {
    id: 'host',
    scope: 'host',
    lifecycleKind: 'explicit-release',
    physicalLayer: 'host-system',
    ownerAcquisition: 'The host application acquires a bounded host allocation through a language or Runtime host-memory API.',
    accessibleScope: 'Host code; device access requires a separately declared mapped or managed mechanism.',
    lifetime: 'The allocation or host object lifetime, independent of any single kernel launch.',
    releaseEnd: 'The matching host deallocation or unregister operation, or process termination.',
    physicalAddressSpaceCaveat: 'Host memory is not one of the kernel device address spaces; mapping does not erase host ownership.',
  },
  {
    id: 'global',
    scope: 'grid',
    lifecycleKind: 'explicit-release',
    physicalLayer: 'device-memory',
    ownerAcquisition: 'The host or device acquires device allocation storage, commonly through a CUDA allocation API.',
    accessibleScope: 'Threads with a valid pointer across grids; host code manages or copies it through CUDA APIs.',
    lifetime: 'Persists across kernel launches until the owning allocation is released or the CUDA context ends.',
    releaseEnd: 'The matching release operation such as cudaFree, device reset, or context/application termination.',
    physicalAddressSpaceCaveat: 'Global is a device address space. L1/L2 may serve accesses, but caches are not replacement address spaces.',
  },
  {
    id: 'constant',
    scope: 'grid',
    lifecycleKind: 'context-end',
    physicalLayer: 'device-memory',
    ownerAcquisition: 'A module/context owns a __constant__ symbol; host code initializes it through symbol APIs.',
    accessibleScope: 'Read-only to kernel threads in a grid; host-side Runtime APIs can address the symbol.',
    lifetime: 'The symbol persists with its module/context rather than being recreated per thread block.',
    releaseEnd: 'Module unload, context destruction, device reset, or application termination.',
    physicalAddressSpaceCaveat: 'Constant is a distinct device address space; its cache does not create a second object lifetime.',
  },
  {
    id: 'shared',
    scope: 'block',
    lifecycleKind: 'block-end',
    physicalLayer: 'streaming-multiprocessor',
    ownerAcquisition: 'Each thread block receives static declarations and/or dynamic launch-sized shared storage.',
    accessibleScope: 'Threads of the owning block, subject to the program\'s synchronization and ordering.',
    lifetime: 'Exists for the owning block during kernel execution.',
    releaseEnd: 'Ends when the owning block completes; the program does not cudaFree it.',
    physicalAddressSpaceCaveat: 'Shared is a programmer-managed address space on an SM; sharing a physical resource with L1 does not make it a cache.',
  },
  {
    id: 'local',
    scope: 'thread',
    lifecycleKind: 'thread-end',
    physicalLayer: 'device-memory',
    ownerAcquisition: 'The compiler gives each thread private local storage for selected automatic objects and spills.',
    accessibleScope: 'Only the owning thread through its private logical addresses.',
    lifetime: 'The owning thread\'s execution within the kernel.',
    releaseEnd: 'Ends when the owning thread/kernel execution ends; there is no host cudaFree for it.',
    physicalAddressSpaceCaveat: 'Local describes logical thread scope, not on-chip placement; local memory resides in device memory.',
  },
  {
    id: 'register',
    scope: 'thread',
    lifecycleKind: 'thread-end',
    physicalLayer: 'streaming-multiprocessor',
    ownerAcquisition: 'The compiler assigns per-thread values to registers when resources and code generation permit.',
    accessibleScope: 'Only the owning thread; registers are not a block-shared address space.',
    lifetime: 'The owning thread\'s execution within the kernel.',
    releaseEnd: 'Ends with the owning thread/kernel execution; allocation and release are compiler-managed.',
    physicalAddressSpaceCaveat: 'Registers are on-SM storage; pressure can spill values into the physically off-chip local address space.',
  },
] as const satisfies readonly MemoryHierarchyRecord[];

export type MemoryHierarchyFilter = Readonly<{
  scope: MemoryScopeFilter;
  lifecycle: MemoryLifecycleFilter;
}>;

export type MemoryHierarchyFilterResult =
  | Readonly<{
      valid: false;
      issues: readonly ('scope-invalid' | 'lifecycle-invalid')[];
      filter: null;
      records: readonly [];
      contract: typeof MEMORY_HIERARCHY_MODEL_CONTRACT;
    }>
  | Readonly<{
      valid: true;
      issues: readonly [];
      filter: MemoryHierarchyFilter;
      records: readonly MemoryHierarchyRecord[];
      contract: typeof MEMORY_HIERARCHY_MODEL_CONTRACT;
    }>;

export function createDefaultMemoryHierarchyFilter(): MemoryHierarchyFilter {
  return { scope: 'all', lifecycle: 'all' };
}

export function isMemoryScopeFilter(value: string): value is MemoryScopeFilter {
  return MEMORY_SCOPE_FILTERS.some((filter) => filter === value);
}

export function isMemoryLifecycleFilter(value: string): value is MemoryLifecycleFilter {
  return MEMORY_LIFECYCLE_FILTERS.some((filter) => filter === value);
}

export function filterMemoryHierarchy(filter: MemoryHierarchyFilter): MemoryHierarchyFilterResult {
  const issues: ('scope-invalid' | 'lifecycle-invalid')[] = [];
  if (!isMemoryScopeFilter(filter.scope)) issues.push('scope-invalid');
  if (!isMemoryLifecycleFilter(filter.lifecycle)) issues.push('lifecycle-invalid');
  if (issues.length > 0 || !isMemoryScopeFilter(filter.scope) || !isMemoryLifecycleFilter(filter.lifecycle)) {
    return {
      valid: false,
      issues,
      filter: null,
      records: [],
      contract: MEMORY_HIERARCHY_MODEL_CONTRACT,
    };
  }

  return {
    valid: true,
    issues: [],
    filter,
    records: MEMORY_HIERARCHY_RECORDS.filter((record) =>
      (filter.scope === 'all' || record.scope === filter.scope)
      && (filter.lifecycle === 'all' || record.lifecycleKind === filter.lifecycle)),
    contract: MEMORY_HIERARCHY_MODEL_CONTRACT,
  };
}
