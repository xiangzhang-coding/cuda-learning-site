// SPDX-License-Identifier: Apache-2.0

export const API_BOUNDARY_MODEL_CONTRACT = {
  sourceFactIds: ['SRC-CUDA-015'],
  executesCuda: false,
  evidenceStatusEffect: 'none',
  apiMapping: 'not-one-to-one',
  scope: 'selected-lifecycle-roles',
} as const;

export const API_BOUNDARY_STAGES = [
  {
    id: 'initialize-device',
    runtime: {
      management: 'implicit-primary-context',
      apis: ['cudaSetDevice'],
      handles: ['device ordinal'],
    },
    driver: {
      management: 'explicit',
      apis: ['cuInit', 'cuDeviceGet'],
      handles: ['CUdevice'],
    },
    sharedLayer: 'cuda-driver-stack',
    mapping: 'role-comparison',
  },
  {
    id: 'context',
    runtime: {
      management: 'implicit-primary-context',
      apis: ['cudaSetDevice', 'cudaDeviceReset'],
      handles: ['current device', 'primary context (managed)'],
    },
    driver: {
      management: 'explicit',
      apis: ['cuDevicePrimaryCtxRetain', 'cuCtxCreate', 'cuCtxSetCurrent'],
      handles: ['CUcontext'],
    },
    sharedLayer: 'cuda-driver-stack',
    mapping: 'documented-context-rules',
  },
  {
    id: 'module-function',
    runtime: {
      management: 'implicit-module',
      apis: ['cudaLaunchKernel'],
      handles: ['registered kernel symbol'],
    },
    driver: {
      management: 'explicit',
      apis: ['cuModuleLoad', 'cuModuleGetFunction'],
      handles: ['CUmodule', 'CUfunction'],
    },
    sharedLayer: 'cuda-driver-stack',
    mapping: 'role-comparison',
  },
  {
    id: 'memory',
    runtime: {
      management: 'explicit-resource',
      apis: ['cudaMalloc', 'cudaMemcpy', 'cudaFree'],
      handles: ['device pointer'],
    },
    driver: {
      management: 'explicit',
      apis: ['cuMemAlloc', 'cuMemcpyHtoD', 'cuMemcpyDtoH', 'cuMemFree'],
      handles: ['CUdeviceptr'],
    },
    sharedLayer: 'cuda-driver-stack',
    mapping: 'role-comparison',
  },
  {
    id: 'launch',
    runtime: {
      management: 'higher-level-launch',
      apis: ['cudaLaunchKernel'],
      handles: ['kernel symbol', 'execution configuration'],
    },
    driver: {
      management: 'explicit',
      apis: ['cuLaunchKernel'],
      handles: ['CUfunction', 'kernel parameter array', 'execution configuration'],
    },
    sharedLayer: 'cuda-driver-stack',
    mapping: 'not-one-to-one',
  },
  {
    id: 'completion-errors',
    runtime: {
      management: 'explicit-boundary',
      apis: ['cudaGetLastError', 'cudaDeviceSynchronize'],
      handles: ['cudaError_t'],
    },
    driver: {
      management: 'explicit-boundary',
      apis: ['cuLaunchKernel', 'cuCtxSynchronize'],
      handles: ['CUresult'],
    },
    sharedLayer: 'cuda-driver-stack',
    mapping: 'asynchronous-boundary-persists',
  },
] as const;

export type ApiBoundaryStageId = (typeof API_BOUNDARY_STAGES)[number]['id'];
export type ApiBoundaryStage = (typeof API_BOUNDARY_STAGES)[number];

export type ApiBoundaryState = Readonly<{
  stageId: ApiBoundaryStageId;
}>;

export type ApiBoundaryAction =
  | { type: 'select'; stageId: ApiBoundaryStageId }
  | { type: 'next' }
  | { type: 'previous' }
  | { type: 'first' }
  | { type: 'last' }
  | { type: 'reset' };

const stageIds = API_BOUNDARY_STAGES.map(({ id }) => id);
const initialStageId = API_BOUNDARY_STAGES[0].id;

export function getApiBoundaryStage(stageId: ApiBoundaryStageId): ApiBoundaryStage {
  const stage = API_BOUNDARY_STAGES.find((candidate) => candidate.id === stageId);
  if (!stage) throw new Error(`Unknown API boundary stage: ${stageId}`);
  return stage;
}

export function createApiBoundaryState(stageId: ApiBoundaryStageId = initialStageId): ApiBoundaryState {
  getApiBoundaryStage(stageId);
  return { stageId };
}

export function reduceApiBoundary(state: ApiBoundaryState, action: ApiBoundaryAction): ApiBoundaryState {
  const currentIndex = stageIds.indexOf(state.stageId);
  if (currentIndex < 0) throw new Error(`Unknown API boundary stage: ${state.stageId}`);

  switch (action.type) {
    case 'select':
      return createApiBoundaryState(action.stageId);
    case 'next':
      return { stageId: stageIds[(currentIndex + 1) % stageIds.length] ?? initialStageId };
    case 'previous':
      return { stageId: stageIds[(currentIndex - 1 + stageIds.length) % stageIds.length] ?? initialStageId };
    case 'first':
    case 'reset':
      return createApiBoundaryState();
    case 'last':
      return { stageId: stageIds.at(-1) ?? initialStageId };
  }
}
