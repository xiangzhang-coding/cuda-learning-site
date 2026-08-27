// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import {
  API_BOUNDARY_MODEL_CONTRACT,
  API_BOUNDARY_STAGES,
  createApiBoundaryState,
  getApiBoundaryStage,
  reduceApiBoundary,
  type ApiBoundaryStageId,
} from '../../src/visuals/api-boundary-model';

describe('F07 API boundary model', () => {
  it('keeps the selected lifecycle stages in a deterministic teaching order', () => {
    expect(API_BOUNDARY_STAGES.map(({ id }) => id)).toEqual([
      'initialize-device',
      'context',
      'module-function',
      'memory',
      'launch',
      'completion-errors',
    ]);
  });

  it('uses Runtime cuda* names and Driver cu* names for the selected calls', () => {
    for (const stage of API_BOUNDARY_STAGES) {
      expect(stage.runtime.apis.every((name) => name.startsWith('cuda'))).toBe(true);
      expect(stage.driver.apis.every((name) => name.startsWith('cu') && !name.startsWith('cuda'))).toBe(true);
      expect(stage.sharedLayer).toBe('cuda-driver-stack');
    }
  });

  it('exposes the explicit Driver handle chain without hiding Runtime resource ownership', () => {
    expect(getApiBoundaryStage('initialize-device').driver.handles).toContain('CUdevice');
    expect(getApiBoundaryStage('context').driver.handles).toContain('CUcontext');
    expect(getApiBoundaryStage('module-function').driver.handles).toEqual(['CUmodule', 'CUfunction']);
    expect(getApiBoundaryStage('memory')).toMatchObject({
      runtime: { management: 'explicit-resource', handles: ['device pointer'] },
      driver: { management: 'explicit', handles: ['CUdeviceptr'] },
    });
  });

  it('records interoperability, non-equivalence, and asynchronous error boundaries explicitly', () => {
    expect(getApiBoundaryStage('context').mapping).toBe('documented-context-rules');
    expect(getApiBoundaryStage('launch').mapping).toBe('not-one-to-one');
    expect(getApiBoundaryStage('completion-errors').mapping).toBe('asynchronous-boundary-persists');
  });

  it('selects stages and supports wrapping keyboard-style navigation', () => {
    const initial = createApiBoundaryState();
    expect(initial).toEqual({ stageId: 'initialize-device' });
    expect(reduceApiBoundary(initial, { type: 'previous' })).toEqual({ stageId: 'completion-errors' });
    expect(reduceApiBoundary(initial, { type: 'next' })).toEqual({ stageId: 'context' });
    expect(reduceApiBoundary(initial, { type: 'last' })).toEqual({ stageId: 'completion-errors' });
    expect(reduceApiBoundary({ stageId: 'memory' }, { type: 'select', stageId: 'launch' })).toEqual({
      stageId: 'launch',
    });
    expect(reduceApiBoundary({ stageId: 'launch' }, { type: 'reset' })).toEqual(initial);
  });

  it('fails closed for an unknown stage', () => {
    expect(() => getApiBoundaryStage('unknown' as ApiBoundaryStageId)).toThrow('Unknown API boundary stage');
    expect(() => createApiBoundaryState('unknown' as ApiBoundaryStageId)).toThrow('Unknown API boundary stage');
  });

  it('declares the source and no-evidence contract for the browser model', () => {
    expect(API_BOUNDARY_MODEL_CONTRACT).toEqual({
      sourceFactIds: ['SRC-CUDA-015'],
      executesCuda: false,
      evidenceStatusEffect: 'none',
      apiMapping: 'not-one-to-one',
      scope: 'selected-lifecycle-roles',
    });
  });
});
