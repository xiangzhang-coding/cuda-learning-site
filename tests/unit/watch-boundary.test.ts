// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';
import { curriculumIdSchema, toolkitLaneSchema, watchBoundaryIssues } from '../../src/content-metadata';

describe('Emerging Feature Watch dependency boundary', () => {
  it.each(['O', 'F', 'M', 'A', 'Q', 'L', 'P', 'T', 'G', 'H', 'LAB', 'EX'])('rejects a W prerequisite on %s resources', prefix => {
    expect(watchBoundaryIssues({ unitId: `${prefix}01`, prerequisites: ['F01', 'W06'] })).not.toEqual([]);
  });
  it('admits stable prerequisites for a watch without admitting the watch as a dependency', () => {
    const metadata = { unitId: 'W01', resourceKind: 'emerging-feature-watch', prerequisites: ['M17'] };
    expect(watchBoundaryIssues(metadata)).toEqual([]);
    expect(watchBoundaryIssues({ ...metadata, prerequisites: ['W02'] })).not.toEqual([]);
    expect(watchBoundaryIssues({ ...metadata, toolkitLanes: ['cuda-13.3'] })).not.toEqual([]);
    expect(watchBoundaryIssues({ ...metadata, resourceKind: 'learning-unit' })).not.toEqual([]);
    expect(watchBoundaryIssues({ ...metadata, unitId: 'H01' })).not.toEqual([]);
  });
  it.each(['cuda-13.4', 'cuda-13.4-preview', 'cuda-14.0', 'latest'])('does not admit unreviewed lane %s', lane => {
    expect(toolkitLaneSchema.safeParse(lane).success).toBe(false);
  });
  it.each(['cuda-11.8', 'cuda-12.9', 'cuda-13.3'])('retains admitted lane %s', lane => {
    expect(toolkitLaneSchema.safeParse(lane).success).toBe(true);
  });
  it.each(['W01', 'W06'])('accepts watch identifier %s', id => {
    expect(curriculumIdSchema.safeParse(id).success).toBe(true);
  });
  it.each(['W1', 'W001', 'w01', 'W01-EXERCISES'])('rejects malformed watch identifier %s', id => {
    expect(curriculumIdSchema.safeParse(id).success).toBe(false);
  });
});
