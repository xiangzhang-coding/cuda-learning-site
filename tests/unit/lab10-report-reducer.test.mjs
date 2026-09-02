// SPDX-License-Identifier: Apache-2.0
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

import { afterEach, describe, expect, it } from 'vitest';

import { reduceLab10Reports } from '../../public/assets/exercise-solutions/lab10-report-reducer.mjs';

const execFileAsync = promisify(execFile);
const projectRoot = path.resolve(import.meta.dirname, '../..');
const reducerPath = path.join(projectRoot, 'public/assets/exercise-solutions/lab10-report-reducer.mjs');
const attemptIds = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'];
const stages = [
  ['baseline-direct', 'synthetic_baseline_kernel'],
  ['coalescing-direction', 'synthetic_coalescing_kernel'],
  ['shared-memory-tiling', 'synthetic_tiling_kernel'],
  ['padded-bank-layout', 'synthetic_padding_kernel'],
];
const metrics = [
  { name: 'synthetic.metric.alpha', unit: 'synthetic-cycle' },
  { name: 'synthetic.metric.beta', unit: 'synthetic-byte' },
];
const columns = {
  kernel: 'Synthetic "Kernel", Name',
  metric: 'Synthetic Metric Name',
  unit: 'Synthetic Metric Unit',
  value: 'Synthetic Scalar Value',
};
const temporaryDirectories = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, {
    recursive: true,
    force: true,
  })));
});

function sha256(content) {
  return createHash('sha256').update(content).digest('hex');
}

function csvCell(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function groupedInteger(value) {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function syntheticRows(attemptId) {
  const attempt = Number(attemptId);
  return stages.flatMap(([stageId, kernel], stageIndex) => metrics.map((metric, metricIndex) => {
    const unscaledValue = stageIndex * 10 + attempt;
    const value = metricIndex === 0
      ? (attempt === 1 ? `${unscaledValue}e0` : String(unscaledValue))
      : groupedInteger(unscaledValue * 1000);
    return { stageId, kernel, metric: metric.name, unit: metric.unit, value };
  }));
}

function serializeCsv(rows, header = columns) {
  return [
    Object.values(header),
    ...rows.map((row) => [row.kernel, row.metric, row.unit, row.value]),
  ].map((record) => record.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

async function createSyntheticFixture({ mutateRows, mutateCsv, mutateLedger } = {}) {
  const root = await mkdtemp(path.join(tmpdir(), 'lab10-report-reducer-synthetic-'));
  temporaryDirectories.push(root);
  const attempts = [];

  for (const attemptId of attemptIds) {
    const reportPath = `attempt-${attemptId}.synthetic.ncu-rep`;
    const rawCsvPath = `attempt-${attemptId}.synthetic.csv`;
    const report = `SYNTHETIC TEST REPORT ${attemptId}; NOT GPU EVIDENCE OR AN OBSERVATION\n`;
    let rows = syntheticRows(attemptId);
    rows = mutateRows?.(attemptId, rows) ?? rows;
    let csv = serializeCsv(rows);
    csv = mutateCsv?.(attemptId, csv) ?? csv;

    await Promise.all([
      writeFile(path.join(root, reportPath), report),
      writeFile(path.join(root, rawCsvPath), csv),
    ]);
    attempts.push({
      id: attemptId,
      reportPath,
      reportSha256: sha256(report),
      rawCsvPath,
      rawCsvSha256: sha256(csv),
    });
  }

  const ledger = {
    schemaVersion: 1,
    attempts,
    stages: Object.fromEntries(stages),
    metrics: structuredClone(metrics),
    csvColumnsByVersion: {
      'synthetic-profiler-0.0': { ...columns },
    },
  };
  mutateLedger?.(ledger);
  const ledgerPath = path.join(root, 'synthetic-ledger.json');
  const summaryPath = path.join(root, 'synthetic-summary.csv');
  await writeFile(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`);
  return { attempts, ledger, ledgerPath, root, summaryPath };
}

function expectedHashChain(attempts) {
  const attemptsById = new Map(attempts.map((attempt) => [attempt.id, attempt]));
  let chain = '0'.repeat(64);
  for (const attemptId of attemptIds) {
    const attempt = attemptsById.get(attemptId);
    chain = sha256([
      'lab10-report-csv-hash-chain-v1',
      chain,
      attemptId,
      attempt.reportSha256,
      attempt.rawCsvSha256,
    ].join('\0'));
  }
  return chain;
}

function expectedSummary(hashChain) {
  const rows = ['stage,metric,unit,count,median,minimum,maximum,hash_chain_sha256'];
  for (const [stageId] of stages) {
    const stageIndex = stages.findIndex(([candidate]) => candidate === stageId);
    const minimum = stageIndex * 10 + 1;
    const maximum = stageIndex * 10 + 10;
    rows.push(`${stageId},synthetic.metric.alpha,synthetic-cycle,10,${minimum + 4.5},${minimum},${maximum},${hashChain}`);
    rows.push(`${stageId},synthetic.metric.beta,synthetic-byte,10,${(minimum + 4.5) * 1000},${minimum * 1000},${maximum * 1000},${hashChain}`);
  }
  return `${rows.join('\n')}\n`;
}

function selectedRow(rows) {
  return rows.find((row) => row.stageId === 'baseline-direct' && row.metric === 'synthetic.metric.alpha');
}

describe('LAB10 report reducer', () => {
  it('writes exact deterministic statistics through the module and CLI', async () => {
    const fixture = await createSyntheticFixture();
    const expectedChain = expectedHashChain(fixture.attempts);
    const expected = expectedSummary(expectedChain);

    await expect(reduceLab10Reports(fixture.ledgerPath, fixture.summaryPath)).resolves.toEqual({
      hashChainSha256: expectedChain,
      rowCount: 8,
    });
    expect(await readFile(fixture.summaryPath, 'utf8')).toBe(expected);

    const cliSummaryPath = path.join(fixture.root, 'synthetic-cli-summary.csv');
    await expect(execFileAsync(process.execPath, [reducerPath, fixture.ledgerPath, cliSummaryPath]))
      .resolves.toMatchObject({ stderr: '', stdout: '' });
    expect(await readFile(cliSummaryPath, 'utf8')).toBe(expected);
  });

  it('locates the exact mapped header after profiler and application preamble rows', async () => {
    const fixture = await createSyntheticFixture({
      mutateCsv: (_attemptId, csv) =>
        `==PROF== Profiling "synthetic_kernel"\napplication said "hello"; not evidence\n${csv}`,
    });
    await expect(reduceLab10Reports(fixture.ledgerPath, fixture.summaryPath)).resolves.toMatchObject({
      rowCount: 8,
    });
  });

  it('accepts an exact version-specific alternate header mapping', async () => {
    const alternate = {
      kernel: 'Kernel Function',
      metric: 'Metric Identifier',
      unit: 'Reported Unit',
      value: 'Reported Scalar',
    };
    const fixture = await createSyntheticFixture({
      mutateCsv: (_attemptId, csv) => csv.replace(
        Object.values(columns).map(csvCell).join(','),
        Object.values(alternate).map(csvCell).join(','),
      ),
      mutateLedger(ledger) {
        ledger.csvColumnsByVersion['synthetic-profiler-0.0'] = alternate;
      },
    });
    await expect(reduceLab10Reports(fixture.ledgerPath, fixture.summaryPath)).resolves.toMatchObject({
      rowCount: 8,
    });
  });

  it('preserves an exact empty metric unit when the retained NCU row has no unit', async () => {
    const fixture = await createSyntheticFixture({
      mutateRows: (_attemptId, rows) => rows.map((row) =>
        row.metric === 'synthetic.metric.beta' ? { ...row, unit: '' } : row),
      mutateLedger(ledger) {
        ledger.metrics[1].unit = '';
      },
    });
    await expect(reduceLab10Reports(fixture.ledgerPath, fixture.summaryPath)).resolves.toMatchObject({
      rowCount: 8,
    });
    expect(await readFile(fixture.summaryPath, 'utf8')).toContain(
      'synthetic.metric.beta,,10,',
    );
  });

  it.each([
    ['an incorrect lowercase hash', (ledger) => { ledger.attempts[0].reportSha256 = 'f'.repeat(64); }, /SHA-256 mismatch/i],
    ['an uppercase hash', (ledger) => { ledger.attempts[0].reportSha256 = ledger.attempts[0].reportSha256.toUpperCase(); }, /lowercase 64-hex/i],
  ])('rejects %s', async (_description, mutateLedger, expectedError) => {
    const fixture = await createSyntheticFixture({ mutateLedger });
    await expect(reduceLab10Reports(fixture.ledgerPath, fixture.summaryPath)).rejects.toThrow(expectedError);
  });

  it.each([
    ['a missing attempt', (ledger) => { ledger.attempts.pop(); }, /missing attempt IDs: 10/i],
    ['a duplicate attempt', (ledger) => { ledger.attempts.at(-1).id = '09'; }, /duplicate attempt IDs: 09/i],
  ])('rejects %s', async (_description, mutateLedger, expectedError) => {
    const fixture = await createSyntheticFixture({ mutateLedger });
    await expect(reduceLab10Reports(fixture.ledgerPath, fixture.summaryPath)).rejects.toThrow(expectedError);
  });

  it.each([
    ['a missing scalar row', (attemptId, rows) => attemptId === '04'
      ? rows.filter((row) => row !== selectedRow(rows))
      : rows, /missing scalar row/i],
    ['a duplicate scalar row', (attemptId, rows) => attemptId === '04'
      ? [...rows, { ...selectedRow(rows) }]
      : rows, /duplicate scalar row/i],
  ])('rejects %s', async (_description, mutateRows, expectedError) => {
    const fixture = await createSyntheticFixture({ mutateRows });
    await expect(reduceLab10Reports(fixture.ledgerPath, fixture.summaryPath)).rejects.toThrow(expectedError);
  });

  it('rejects an n/a scalar', async () => {
    const fixture = await createSyntheticFixture({
      mutateRows(attemptId, rows) {
        if (attemptId === '05') selectedRow(rows).value = 'N/A';
      },
    });
    await expect(reduceLab10Reports(fixture.ledgerPath, fixture.summaryPath)).rejects.toThrow(/unavailable scalar/i);
  });

  it('rejects a metric unit mismatch', async () => {
    const fixture = await createSyntheticFixture({
      mutateRows(attemptId, rows) {
        if (attemptId === '05') selectedRow(rows).unit = 'synthetic-wrong-unit';
      },
    });
    await expect(reduceLab10Reports(fixture.ledgerPath, fixture.summaryPath)).rejects.toThrow(/unit mismatch/i);
  });

  it('rejects a numeric scalar that becomes nonfinite', async () => {
    const fixture = await createSyntheticFixture({
      mutateRows(attemptId, rows) {
        if (attemptId === '05') selectedRow(rows).value = '1e309';
      },
    });
    await expect(reduceLab10Reports(fixture.ledgerPath, fixture.summaryPath)).rejects.toThrow(/nonfinite scalar/i);
  });

  it('rejects the wrong exact stage set', async () => {
    const fixture = await createSyntheticFixture({
      mutateLedger(ledger) {
        ledger.stages['synthetic-unreviewed-stage'] = ledger.stages['padded-bank-layout'];
        delete ledger.stages['padded-bank-layout'];
      },
    });
    await expect(reduceLab10Reports(fixture.ledgerPath, fixture.summaryPath)).rejects.toThrow(/stage IDs/i);
  });

  it('rejects malformed quoted CSV', async () => {
    const fixture = await createSyntheticFixture({
      mutateCsv: (attemptId, csv) => attemptId === '06' ? `${csv}"unterminated` : csv,
    });
    await expect(reduceLab10Reports(fixture.ledgerPath, fixture.summaryPath)).rejects.toThrow(/unterminated quoted field/i);
  });

  it('rejects an extra kernel row even when it carries a selected metric', async () => {
    const fixture = await createSyntheticFixture({
      mutateRows(attemptId, rows) {
        return attemptId === '06'
          ? [...rows, { ...selectedRow(rows), kernel: 'synthetic_unexpected_kernel' }]
          : rows;
      },
    });
    await expect(reduceLab10Reports(fixture.ledgerPath, fixture.summaryPath)).rejects.toThrow(
      /unexpected kernel synthetic_unexpected_kernel/i,
    );
  });

  it('rejects multiple rows that each look like the mapped header', async () => {
    const fixture = await createSyntheticFixture({
      mutateCsv: (attemptId, csv) => attemptId === '06'
        ? `${csv}${Object.values(columns).map(csvCell).join(',')}\r\n`
        : csv,
    });
    await expect(reduceLab10Reports(fixture.ledgerPath, fixture.summaryPath)).rejects.toThrow(
      /multiple rows containing every mapped CSV header/i,
    );
  });

  it('prints the public reducer path in CLI usage', async () => {
    await expect(execFileAsync(process.execPath, [reducerPath])).rejects.toMatchObject({
      stderr: expect.stringContaining(
        'node public/assets/exercise-solutions/lab10-report-reducer.mjs <ledger.json> <summary.csv>',
      ),
    });
  });

  it.each([
    ['no metrics', (ledger) => { ledger.metrics = []; }, /one or more metrics/i],
    ['duplicate metric names', (ledger) => { ledger.metrics.push({ ...ledger.metrics[0] }); }, /unique metric names/i],
    ['duplicate source paths', (ledger) => { ledger.attempts[1].rawCsvPath = ledger.attempts[0].reportPath; }, /unique source paths/i],
    ['non-distinct column mappings', (ledger) => { ledger.csvColumnsByVersion['synthetic-profiler-0.0'].value = columns.unit; }, /distinct CSV column names/i],
  ])('rejects a ledger with %s', async (_description, mutateLedger, expectedError) => {
    const fixture = await createSyntheticFixture({ mutateLedger });
    await expect(reduceLab10Reports(fixture.ledgerPath, fixture.summaryPath)).rejects.toThrow(expectedError);
  });

  it('accepts byte-identical raw CSV observations when paths and custody hashes remain valid', async () => {
    const fixture = await createSyntheticFixture({
      mutateRows: () => syntheticRows('01'),
    });
    await expect(reduceLab10Reports(fixture.ledgerPath, fixture.summaryPath)).resolves.toMatchObject({
      rowCount: 8,
    });
  });

  it('rejects a CSV missing a required mapped header', async () => {
    const fixture = await createSyntheticFixture({
      mutateCsv(attemptId, csv) {
        return attemptId === '07'
          ? csv.replace(csvCell(columns.value), csvCell('Synthetic Unmapped Value'))
          : csv;
      },
    });
    await expect(reduceLab10Reports(fixture.ledgerPath, fixture.summaryPath)).rejects.toThrow(
      /no row containing every mapped CSV header|missing required CSV header/i,
    );
  });
});
