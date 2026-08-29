// SPDX-License-Identifier: Apache-2.0

export const PAGE_MIGRATION_ORIGINS = ['cpu', 'gpu'] as const;
export const PAGE_MIGRATION_OPERATIONS = ['read', 'write'] as const;
export const PAGE_MIGRATION_PAGE_SIZE_BYTES = 65_536;
export const PAGE_MIGRATION_DEFAULT_SCENARIO_ID = 'gpu-linear-sweep';

export const PAGE_MIGRATION_MODEL_CONTRACT = {
  assumptionId: 'declared-software-coherent-single-residency',
  coherence: 'software-coherent',
  residency: 'one-declared-cpu-or-gpu-location-per-page',
  transitionRule: 'access-origin-differs-from-declared-residency',
  pageSizeBytes: PAGE_MIGRATION_PAGE_SIZE_BYTES,
  pageSizeMeaning: 'declared-teaching-symbol-not-detected-runtime-granularity',
  symbolicBytes: 'modeled-transition-count-times-declared-page-size',
  excludedMechanisms: [
    'hardware-coherent-direct-access',
    'remote-mapping',
    'prefetch',
    'memory-advice',
    'access-counters',
    'oversubscription',
    'multi-gpu-placement',
  ],
  observedPageFaults: false,
  observedMigrations: false,
  observedByteTransfers: false,
  measuredLatency: false,
  executesCuda: false,
  evidenceStatusEffect: 'none',
} as const;

export type PageMigrationOrigin = (typeof PAGE_MIGRATION_ORIGINS)[number];
export type PageMigrationOperation = (typeof PAGE_MIGRATION_OPERATIONS)[number];
export type PageMigrationScenarioId =
  | 'gpu-linear-sweep'
  | 'alternating-hot-page'
  | 'split-working-set';

export type PageMigrationPage = Readonly<{
  id: string;
  initialResidency: PageMigrationOrigin;
}>;

export type PageMigrationAccess = Readonly<{
  id: string;
  pageId: string;
  origin: PageMigrationOrigin;
  operation: PageMigrationOperation;
}>;

export type PageMigrationScenario = Readonly<{
  id: PageMigrationScenarioId;
  reviewed: true;
  assumptionId: typeof PAGE_MIGRATION_MODEL_CONTRACT.assumptionId;
  pageSizeBytes: typeof PAGE_MIGRATION_PAGE_SIZE_BYTES;
  pages: readonly PageMigrationPage[];
  accesses: readonly PageMigrationAccess[];
}>;

export const PAGE_MIGRATION_SCENARIOS = [
  {
    id: 'gpu-linear-sweep',
    reviewed: true,
    assumptionId: PAGE_MIGRATION_MODEL_CONTRACT.assumptionId,
    pageSizeBytes: PAGE_MIGRATION_PAGE_SIZE_BYTES,
    pages: [
      { id: 'page-00', initialResidency: 'cpu' },
      { id: 'page-01', initialResidency: 'cpu' },
      { id: 'page-02', initialResidency: 'cpu' },
      { id: 'page-03', initialResidency: 'cpu' },
    ],
    accesses: [
      { id: 'access-01', pageId: 'page-00', origin: 'gpu', operation: 'read' },
      { id: 'access-02', pageId: 'page-01', origin: 'gpu', operation: 'read' },
      { id: 'access-03', pageId: 'page-02', origin: 'gpu', operation: 'read' },
      { id: 'access-04', pageId: 'page-03', origin: 'gpu', operation: 'read' },
    ],
  },
  {
    id: 'alternating-hot-page',
    reviewed: true,
    assumptionId: PAGE_MIGRATION_MODEL_CONTRACT.assumptionId,
    pageSizeBytes: PAGE_MIGRATION_PAGE_SIZE_BYTES,
    pages: [
      { id: 'page-00', initialResidency: 'cpu' },
      { id: 'page-01', initialResidency: 'cpu' },
    ],
    accesses: [
      { id: 'access-01', pageId: 'page-00', origin: 'gpu', operation: 'write' },
      { id: 'access-02', pageId: 'page-00', origin: 'cpu', operation: 'read' },
      { id: 'access-03', pageId: 'page-00', origin: 'gpu', operation: 'read' },
      { id: 'access-04', pageId: 'page-01', origin: 'cpu', operation: 'read' },
    ],
  },
  {
    id: 'split-working-set',
    reviewed: true,
    assumptionId: PAGE_MIGRATION_MODEL_CONTRACT.assumptionId,
    pageSizeBytes: PAGE_MIGRATION_PAGE_SIZE_BYTES,
    pages: [
      { id: 'page-00', initialResidency: 'cpu' },
      { id: 'page-01', initialResidency: 'cpu' },
      { id: 'page-02', initialResidency: 'gpu' },
      { id: 'page-03', initialResidency: 'gpu' },
    ],
    accesses: [
      { id: 'access-01', pageId: 'page-00', origin: 'cpu', operation: 'read' },
      { id: 'access-02', pageId: 'page-02', origin: 'gpu', operation: 'read' },
      { id: 'access-03', pageId: 'page-01', origin: 'gpu', operation: 'write' },
      { id: 'access-04', pageId: 'page-02', origin: 'cpu', operation: 'write' },
    ],
  },
] as const satisfies readonly PageMigrationScenario[];

export type PageMigrationState = Readonly<{
  scenarioId: PageMigrationScenarioId;
  stepIndex: number;
}>;

export type PageMigrationIssue =
  | 'invalid-state'
  | 'invalid-action'
  | 'unknown-scenario'
  | 'sequence-complete';

export type PageMigrationLedgerRow = Readonly<{
  sequence: number;
  accessId: string;
  pageId: string;
  origin: PageMigrationOrigin;
  operation: PageMigrationOperation;
  residencyBefore: PageMigrationOrigin;
  residencyAfter: PageMigrationOrigin;
  modeledTransition: boolean;
  transitionCountAfter: number;
  symbolicBytesAfter: number;
}>;

export type PageMigrationFrame = Readonly<{
  scenario: PageMigrationScenario;
  stepIndex: number;
  sequenceLength: number;
  sequenceComplete: boolean;
  nextAccess: PageMigrationAccess | null;
  residency: readonly Readonly<{ pageId: string; location: PageMigrationOrigin }>[];
  ledger: readonly PageMigrationLedgerRow[];
  transitionCount: number;
  symbolicBytes: Readonly<{
    pageSizeBytes: number;
    totalBytes: number;
    expression: string;
  }>;
  contract: typeof PAGE_MIGRATION_MODEL_CONTRACT;
}>;

export type PageMigrationStateUpdate =
  | Readonly<{ accepted: true; state: PageMigrationState }>
  | Readonly<{ accepted: false; state: PageMigrationState; issue: PageMigrationIssue }>;

export type PageMigrationFrameResult =
  | Readonly<{ accepted: true; frame: PageMigrationFrame }>
  | Readonly<{ accepted: false; issue: Extract<PageMigrationIssue, 'invalid-state' | 'unknown-scenario'> }>;

export type PageMigrationFramesResult =
  | Readonly<{ accepted: true; scenario: PageMigrationScenario; frames: readonly PageMigrationFrame[] }>
  | Readonly<{ accepted: false; issue: 'unknown-scenario' }>;

function findScenario(scenarioId: string) {
  return PAGE_MIGRATION_SCENARIOS.find(({ id }) => id === scenarioId);
}

function validateState(state: PageMigrationState) {
  const scenario = findScenario(state.scenarioId);
  if (!scenario) return { accepted: false, issue: 'unknown-scenario' } as const;
  if (!Number.isInteger(state.stepIndex) || state.stepIndex < 0 || state.stepIndex > scenario.accesses.length) {
    return { accepted: false, issue: 'invalid-state' } as const;
  }
  return { accepted: true, scenario } as const;
}

function symbolicBytes(transitionCount: number, pageSizeBytes: number) {
  const totalBytes = transitionCount * pageSizeBytes;
  return {
    pageSizeBytes,
    totalBytes,
    expression: `${transitionCount} x ${pageSizeBytes} B = ${totalBytes} B`,
  } as const;
}

function buildFrame(scenario: PageMigrationScenario, stepIndex: number): PageMigrationFrame {
  const locations = new Map(scenario.pages.map(({ id, initialResidency }) => [id, initialResidency]));
  const ledger: PageMigrationLedgerRow[] = [];
  let transitionCount = 0;

  for (const [index, access] of scenario.accesses.slice(0, stepIndex).entries()) {
    const residencyBefore = locations.get(access.pageId) as PageMigrationOrigin;
    const modeledTransition = residencyBefore !== access.origin;
    const residencyAfter = modeledTransition ? access.origin : residencyBefore;
    if (modeledTransition) transitionCount += 1;
    locations.set(access.pageId, residencyAfter);
    ledger.push({
      sequence: index + 1,
      accessId: access.id,
      pageId: access.pageId,
      origin: access.origin,
      operation: access.operation,
      residencyBefore,
      residencyAfter,
      modeledTransition,
      transitionCountAfter: transitionCount,
      symbolicBytesAfter: transitionCount * scenario.pageSizeBytes,
    });
  }

  return {
    scenario,
    stepIndex,
    sequenceLength: scenario.accesses.length,
    sequenceComplete: stepIndex === scenario.accesses.length,
    nextAccess: scenario.accesses[stepIndex] ?? null,
    residency: scenario.pages.map(({ id }) => ({ pageId: id, location: locations.get(id) as PageMigrationOrigin })),
    ledger,
    transitionCount,
    symbolicBytes: symbolicBytes(transitionCount, scenario.pageSizeBytes),
    contract: PAGE_MIGRATION_MODEL_CONTRACT,
  };
}

export function createPageMigrationState(): PageMigrationState {
  return { scenarioId: PAGE_MIGRATION_DEFAULT_SCENARIO_ID, stepIndex: 0 };
}

export function derivePageMigrationFrame(state: PageMigrationState): PageMigrationFrameResult {
  const validation = validateState(state);
  if (!validation.accepted) return validation;
  return { accepted: true, frame: buildFrame(validation.scenario, state.stepIndex) };
}

export function derivePageMigrationFrames(scenarioId: string): PageMigrationFramesResult {
  const scenario = findScenario(scenarioId);
  if (!scenario) return { accepted: false, issue: 'unknown-scenario' };
  return {
    accepted: true,
    scenario,
    frames: Array.from(
      { length: scenario.accesses.length + 1 },
      (_, stepIndex) => buildFrame(scenario, stepIndex),
    ),
  };
}

export function reducePageMigrationState(
  state: PageMigrationState,
  action: unknown,
): PageMigrationStateUpdate {
  const validation = validateState(state);
  if (!validation.accepted) return { accepted: false, state, issue: validation.issue };
  if (!action || typeof action !== 'object' || !('type' in action) || typeof action.type !== 'string') {
    return { accepted: false, state, issue: 'invalid-action' };
  }

  if (action.type === 'step') {
    if (state.stepIndex === validation.scenario.accesses.length) {
      return { accepted: false, state, issue: 'sequence-complete' };
    }
    return { accepted: true, state: { ...state, stepIndex: state.stepIndex + 1 } };
  }

  if (action.type === 'reset') {
    return { accepted: true, state: { ...state, stepIndex: 0 } };
  }

  if (action.type === 'select-scenario') {
    if (!('scenarioId' in action) || typeof action.scenarioId !== 'string') {
      return { accepted: false, state, issue: 'invalid-action' };
    }
    const scenario = findScenario(action.scenarioId);
    if (!scenario) return { accepted: false, state, issue: 'unknown-scenario' };
    return { accepted: true, state: { scenarioId: scenario.id, stepIndex: 0 } };
  }

  return { accepted: false, state, issue: 'invalid-action' };
}
