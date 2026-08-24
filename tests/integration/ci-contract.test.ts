// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '../..');

async function readProjectFile(relativePath: string) {
  return readFile(path.join(projectRoot, relativePath), 'utf8');
}

describe('GitHub Actions quality contract', () => {
  it('uses safe triggers, least privilege, exact action SHAs, and the pinned runner', async () => {
    const workflow = await readProjectFile('.github/workflows/web-quality.yml');

    expect(workflow).toContain('name: Web Quality');
    expect(workflow).toMatch(/push:\s*\n\s+branches:\s*\[main\]/);
    expect(workflow).toMatch(/pull_request:\s*\n\s+branches:\s*\[main\]/);
    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).not.toContain('pull_request_target');
    expect(workflow).toMatch(/permissions:\s*\n\s+contents: read/);
    expect(workflow).toContain('runs-on: ubuntu-24.04');

    const actionPins = [...workflow.matchAll(/uses:\s+actions\/[^@\s]+@([0-9a-f]{40})/g)].map((match) => match[1]);
    expect(new Set(actionPins)).toEqual(
      new Set([
        '3d3c42e5aac5ba805825da76410c181273ba90b1',
        '820762786026740c76f36085b0efc47a31fe5020',
        '043fb46d1a93c77aae656e7c1c64a875d1fc6a0a',
        '3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c',
      ]),
    );
    expect(workflow).not.toMatch(/uses:\s+[^\s]+@(?![0-9a-f]{40}(?:\s|$))/);
    expect(workflow.match(/persist-credentials: false/g)).toHaveLength(5);
  });

  it('runs every applicable quality surface and gates retained artifacts', async () => {
    const workflow = await readProjectFile('.github/workflows/web-quality.yml');

    for (const job of [
      'static-and-integration',
      'e2e-chromium',
      'e2e-cross-browser',
      'accessibility-automated',
      'artifact-policy',
      'web-quality',
    ]) {
      expect(workflow).toMatch(new RegExp(`^  ${job}:`, 'm'));
    }

    for (const command of [
      'npm ci',
      'npm run quality:source',
      'npm run quality:dependencies',
      'npm run quality:licenses',
      'npm run quality:canonical-imports',
      'npm run test:unit',
      'npm run check',
      'npm run build',
      'npm run test:integration',
      'npm run quality:dist',
      'npm run test:e2e:chromium',
      'npm run test:e2e:cross-browser',
      'npm run test:e2e:accessibility',
      'npm run test:e2e:visual',
    ]) {
      expect(workflow).toContain(command);
    }

    expect(workflow).toContain('include-hidden-files: false');
    expect(workflow).toContain('retention-days: 7');
    expect(workflow).toContain('ImageVersion');
    expect(workflow).toContain('RUNNER_ARCH');
    expect(workflow).toContain('Web quality does not grant CUDA evidence status');
  });
});

describe('public feedback metadata', () => {
  it('provides Pull Request and Issue entry points that enforce the contribution contract', async () => {
    const [pullRequestTemplate, issueConfig] = await Promise.all([
      readProjectFile('.github/PULL_REQUEST_TEMPLATE.md'),
      readProjectFile('.github/ISSUE_TEMPLATE/config.yml'),
    ]);

    expect(pullRequestTemplate).toContain('Publication Pair');
    expect(pullRequestTemplate).toContain('Source and license review');
    expect(pullRequestTemplate).toContain('Evidence Status impact');
    expect(issueConfig).toContain('blank_issues_enabled: true');
    expect(issueConfig).toContain('/issues');
  });
});
