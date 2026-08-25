// SPDX-License-Identifier: Apache-2.0

export const COMPILATION_EVIDENCE_STATUSES = ['Compile-Checked'] as const;
export const RUNTIME_EVIDENCE_STATUSES = [
  'Community-Observed',
  'Runtime-Verified',
  'Pending Hardware Verification',
  'Runtime-Not-Applicable',
] as const;

export function evidenceStatusIssues(compilation: readonly string[], runtime: readonly string[]) {
  const issues: string[] = [];
  if (new Set(compilation).size !== compilation.length || new Set(runtime).size !== runtime.length) {
    issues.push('Evidence Status values must not be duplicated.');
  }
  if (runtime.includes('Runtime-Not-Applicable') && runtime.length !== 1) {
    issues.push('Runtime-Not-Applicable cannot coexist with another runtime status.');
  }
  if (runtime.includes('Runtime-Verified') && runtime.includes('Pending Hardware Verification')) {
    issues.push('Runtime-Verified cannot remain Pending Hardware Verification.');
  }
  return issues;
}

export function parseIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const timestamp = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const date = new Date(timestamp);
  return date.toISOString().slice(0, 10) === value ? date : undefined;
}
