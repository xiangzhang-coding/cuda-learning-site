// SPDX-License-Identifier: Apache-2.0
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const LAB10_ATTEMPT_IDS = Object.freeze([
  '01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
]);
export const LAB10_STAGE_IDS = Object.freeze([
  'baseline-direct',
  'coalescing-direction',
  'shared-memory-tiling',
  'padded-bank-layout',
]);

const topLevelFields = [
  'schemaVersion',
  'attempts',
  'stages',
  'metrics',
  'csvColumnsByVersion',
];
const attemptFields = [
  'id',
  'reportPath',
  'reportSha256',
  'rawCsvPath',
  'rawCsvSha256',
];
const metricFields = ['name', 'unit'];
const columnRoles = ['kernel', 'metric', 'unit', 'value'];
const lowercaseSha256 = /^[0-9a-f]{64}$/;
const numericScalar = /^[+-]?(?:(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function compareText(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function requireRecord(value, label) {
  if (!isRecord(value)) throw new Error(`${label} must be an object.`);
}

function requireExactFields(value, fields, label) {
  requireRecord(value, label);
  const actualFields = Object.keys(value);
  const missing = fields.filter((field) => !actualFields.includes(field));
  const extra = actualFields.filter((field) => !fields.includes(field));
  if (missing.length > 0 || extra.length > 0) {
    const details = [
      missing.length > 0 ? `missing fields: ${missing.join(', ')}` : null,
      extra.length > 0 ? `extra fields: ${extra.join(', ')}` : null,
    ].filter(Boolean).join('; ');
    throw new Error(`${label} has an invalid schema (${details}).`);
  }
}

function requireNonemptyString(value, label) {
  if (typeof value !== 'string' || value.trim() === '' || value.includes('\0')) {
    throw new Error(`${label} must be a nonempty string without NUL characters.`);
  }
  return value;
}

function requireString(value, label) {
  if (typeof value !== 'string' || value.includes('\0')) {
    throw new Error(`${label} must be a string without NUL characters.`);
  }
  return value;
}

function duplicateValues(values) {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates].sort(compareText);
}

function validateAttemptIds(attempts) {
  const ids = attempts.map((attempt, index) => {
    requireExactFields(attempt, attemptFields, `Ledger attempt at index ${index}`);
    return requireNonemptyString(attempt.id, `Ledger attempt at index ${index} id`);
  });
  const duplicates = duplicateValues(ids);
  if (duplicates.length > 0) {
    throw new Error(`Ledger has duplicate attempt IDs: ${duplicates.join(', ')}.`);
  }
  const missing = LAB10_ATTEMPT_IDS.filter((id) => !ids.includes(id));
  if (missing.length > 0) throw new Error(`Ledger has missing attempt IDs: ${missing.join(', ')}.`);
  const extra = ids.filter((id) => !LAB10_ATTEMPT_IDS.includes(id));
  if (extra.length > 0) throw new Error(`Ledger has extra attempt IDs: ${extra.join(', ')}.`);
  if (ids.length !== LAB10_ATTEMPT_IDS.length) {
    throw new Error(`Ledger must define exactly ${LAB10_ATTEMPT_IDS.length} attempts.`);
  }
}

function validateAttempts(attempts, ledgerDirectory) {
  if (!Array.isArray(attempts)) throw new Error('Ledger attempts must be an array.');
  validateAttemptIds(attempts);

  const canonicalAttempts = attempts.map((attempt) => {
    const reportPath = requireNonemptyString(attempt.reportPath, `Attempt ${attempt.id} reportPath`);
    const rawCsvPath = requireNonemptyString(attempt.rawCsvPath, `Attempt ${attempt.id} rawCsvPath`);
    for (const [field, hash] of [
      ['reportSha256', attempt.reportSha256],
      ['rawCsvSha256', attempt.rawCsvSha256],
    ]) {
      if (typeof hash !== 'string' || !lowercaseSha256.test(hash)) {
        throw new Error(`Attempt ${attempt.id} ${field} must be lowercase 64-hex SHA-256.`);
      }
    }
    return {
      ...attempt,
      resolvedReportPath: path.resolve(ledgerDirectory, reportPath),
      resolvedRawCsvPath: path.resolve(ledgerDirectory, rawCsvPath),
    };
  });

  const sourcePaths = canonicalAttempts.flatMap((attempt) => [
    attempt.resolvedReportPath,
    attempt.resolvedRawCsvPath,
  ]);
  if (duplicateValues(sourcePaths).length > 0) {
    throw new Error('Ledger must use unique source paths for all reports and raw CSV files.');
  }
  const attemptsById = new Map(canonicalAttempts.map((attempt) => [attempt.id, attempt]));
  return LAB10_ATTEMPT_IDS.map((id) => attemptsById.get(id));
}

function validateStages(stages) {
  requireRecord(stages, 'Ledger stages');
  const actualIds = Object.keys(stages);
  const missing = LAB10_STAGE_IDS.filter((id) => !actualIds.includes(id));
  const extra = actualIds.filter((id) => !LAB10_STAGE_IDS.includes(id));
  if (missing.length > 0 || extra.length > 0 || actualIds.length !== LAB10_STAGE_IDS.length) {
    throw new Error(
      `Ledger stage IDs must be exactly ${LAB10_STAGE_IDS.join(', ')}`
      + `${missing.length > 0 ? `; missing: ${missing.join(', ')}` : ''}`
      + `${extra.length > 0 ? `; extra: ${extra.join(', ')}` : ''}.`,
    );
  }
  const canonicalStages = LAB10_STAGE_IDS.map((id) => ({
    id,
    kernelName: requireNonemptyString(stages[id], `Stage ${id} kernel name`),
  }));
  if (duplicateValues(canonicalStages.map(({ kernelName }) => kernelName)).length > 0) {
    throw new Error('Ledger stage kernel names must be unique.');
  }
  return canonicalStages;
}

function validateMetrics(metrics) {
  if (!Array.isArray(metrics) || metrics.length === 0) {
    throw new Error('Ledger must define one or more metrics.');
  }
  const canonicalMetrics = metrics.map((metric, index) => {
    requireExactFields(metric, metricFields, `Ledger metric at index ${index}`);
    return {
      name: requireNonemptyString(metric.name, `Ledger metric at index ${index} name`),
      unit: requireString(metric.unit, `Ledger metric at index ${index} unit`),
    };
  });
  if (duplicateValues(canonicalMetrics.map(({ name }) => name)).length > 0) {
    throw new Error('Ledger must define unique metric names so unlike units are never combined.');
  }
  return canonicalMetrics.sort((left, right) => compareText(left.name, right.name));
}

function validateCsvColumns(csvColumnsByVersion) {
  requireRecord(csvColumnsByVersion, 'Ledger csvColumnsByVersion');
  const versions = Object.keys(csvColumnsByVersion);
  if (versions.length !== 1) {
    throw new Error('Ledger csvColumnsByVersion must define exactly one profiler version for the batch.');
  }
  const version = requireNonemptyString(versions[0], 'Ledger profiler version');
  const mapping = csvColumnsByVersion[version];
  requireExactFields(mapping, columnRoles, `CSV column mapping for ${version}`);
  const columns = Object.fromEntries(columnRoles.map((role) => [
    role,
    requireNonemptyString(mapping[role], `CSV ${role} column for ${version}`),
  ]));
  if (duplicateValues(Object.values(columns)).length > 0) {
    throw new Error('Ledger must define distinct CSV column names for kernel, metric, unit, and value.');
  }
  return { columns, version };
}

function validateLedger(ledger, ledgerDirectory) {
  requireExactFields(ledger, topLevelFields, 'Ledger');
  if (ledger.schemaVersion !== 1) throw new Error('Ledger schemaVersion must be 1.');
  return {
    attempts: validateAttempts(ledger.attempts, ledgerDirectory),
    stages: validateStages(ledger.stages),
    metrics: validateMetrics(ledger.metrics),
    csvFormat: validateCsvColumns(ledger.csvColumnsByVersion),
  };
}

function finishCsvRecord(rows, row, field) {
  row.push(field);
  rows.push(row);
}

function parseCsv(source, label) {
  if (source.startsWith('\uFEFF')) source = source.slice(1);
  const rows = [];
  let row = [];
  let field = '';
  let state = 'start';
  let index = 0;

  const finishField = () => {
    row.push(field);
    field = '';
    state = 'start';
  };
  const finishRecord = () => {
    finishCsvRecord(rows, row, field);
    row = [];
    field = '';
    state = 'start';
  };
  const consumeRecordEnding = () => {
    if (source[index] === '\r' && source[index + 1] === '\n') index += 2;
    else index += 1;
    finishRecord();
  };

  while (index < source.length) {
    const character = source[index];

    if (state === 'quoted') {
      if (character === '"') {
        if (source[index + 1] === '"') {
          field += '"';
          index += 2;
        } else {
          state = 'after-quote';
          index += 1;
        }
      } else if (character === '\r' && source[index + 1] === '\n') {
        field += '\r\n';
        index += 2;
      } else {
        field += character;
        index += 1;
      }
      continue;
    }

    if (state === 'after-quote') {
      if (character === ',') {
        finishField();
        index += 1;
      } else if (character === '\r' || character === '\n') {
        consumeRecordEnding();
      } else {
        throw new Error(`${label} is malformed: unexpected character after a closing quote at offset ${index}.`);
      }
      continue;
    }

    if (character === '"') {
      if (state !== 'start' || field !== '') {
        throw new Error(`${label} is malformed: quote inside an unquoted field at offset ${index}.`);
      }
      state = 'quoted';
      index += 1;
    } else if (character === ',') {
      finishField();
      index += 1;
    } else if (character === '\r' || character === '\n') {
      consumeRecordEnding();
    } else {
      field += character;
      state = 'unquoted';
      index += 1;
    }
  }

  if (state === 'quoted') throw new Error(`${label} is malformed: unterminated quoted field.`);
  if (state === 'after-quote' || state === 'unquoted') finishRecord();
  else if (row.length > 0) finishRecord();
  return rows;
}

function columnIndexes(rows, columns, label) {
  if (rows.length === 0) throw new Error(`${label} is empty.`);
  const requiredColumns = columnRoles.map((role) => columns[role]);
  const headerIndexes = rows.flatMap((row, index) =>
    requiredColumns.every((column) => row.includes(column)) ? [index] : []);
  if (headerIndexes.length === 0) {
    throw new Error(`${label} has no row containing every mapped CSV header.`);
  }
  if (headerIndexes.length > 1) {
    throw new Error(`${label} has multiple rows containing every mapped CSV header.`);
  }

  const headerIndex = headerIndexes[0];
  const header = rows[headerIndex];
  const duplicateHeaders = duplicateValues(header);
  if (duplicateHeaders.length > 0) {
    throw new Error(`${label} has duplicate CSV headers: ${duplicateHeaders.join(', ')}.`);
  }
  const indexes = {};
  for (const role of columnRoles) {
    indexes[role] = header.indexOf(columns[role]);
    if (indexes[role] === -1) {
      throw new Error(`${label} is missing required CSV header ${columns[role]}.`);
    }
  }
  for (let rowIndex = headerIndex + 1; rowIndex < rows.length; rowIndex += 1) {
    if (rows[rowIndex].length !== header.length) {
      throw new Error(
        `${label} row ${rowIndex + 1} has ${rows[rowIndex].length} fields; expected ${header.length}.`,
      );
    }
  }
  return { headerIndex, indexes };
}

function parseScalar(source, context) {
  const scalar = source.trim();
  if (scalar === '') throw new Error(`${context} has a blank scalar value.`);
  if (/^(?:n\/?a|unavailable)$/i.test(scalar)) {
    throw new Error(`${context} has an unavailable scalar value.`);
  }
  if (!numericScalar.test(scalar)) throw new Error(`${context} has a nonnumeric scalar value.`);
  const value = Number(scalar.replaceAll(',', ''));
  if (!Number.isFinite(value)) throw new Error(`${context} has a nonfinite scalar value.`);
  return value;
}

function sampleKey(stageId, metricName) {
  return `${stageId}\0${metricName}`;
}

function mappedHeaderOffset(source, columns, label) {
  const requiredColumns = columnRoles.map((role) => columns[role]);
  const candidates = [];
  let offset = 0;
  while (offset < source.length) {
    const newline = source.indexOf('\n', offset);
    const nextOffset = newline === -1 ? source.length : newline + 1;
    const physicalLine = source.slice(offset, newline === -1 ? source.length : newline)
      .replace(/\r$/, '');
    try {
      const rows = parseCsv(physicalLine, `${label} header candidate`);
      if (rows.length === 1 && requiredColumns.every((column) => rows[0].includes(column))) {
        candidates.push(offset);
      }
    } catch {
      // Profiler and application preamble is not required to be valid CSV.
    }
    offset = nextOffset;
  }
  if (candidates.length === 0) {
    throw new Error(`${label} has no row containing every mapped CSV header.`);
  }
  if (candidates.length > 1) {
    throw new Error(`${label} has multiple rows containing every mapped CSV header.`);
  }
  return candidates[0];
}

function extractSamples(csvSource, attemptId, stages, metrics, columns) {
  const label = `Attempt ${attemptId} raw CSV`;
  const rows = parseCsv(csvSource.slice(mappedHeaderOffset(csvSource, columns, label)), label);
  const { headerIndex, indexes } = columnIndexes(rows, columns, label);
  const stageByKernel = new Map(stages.map(({ id, kernelName }) => [kernelName, id]));
  const metricByName = new Map(metrics.map((metric) => [metric.name, metric]));
  const samples = new Map();
  for (const { id } of stages) {
    for (const { name } of metrics) samples.set(sampleKey(id, name), []);
  }

  for (let rowIndex = headerIndex + 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const kernelName = row[indexes.kernel].trim();
    const stageId = stageByKernel.get(kernelName);
    if (kernelName !== '' && stageId === undefined) {
      throw new Error(`Attempt ${attemptId} contains unexpected kernel ${kernelName}.`);
    }
    if (stageId === undefined) continue;
    const metric = metricByName.get(row[indexes.metric]);
    if (metric === undefined) continue;
    const context = `Attempt ${attemptId}, stage ${stageId}, metric ${metric.name}`;
    if (row[indexes.unit] !== metric.unit) {
      throw new Error(`${context} has a unit mismatch; expected ${metric.unit}.`);
    }
    samples.get(sampleKey(stageId, metric.name)).push(parseScalar(row[indexes.value], context));
  }

  for (const { id } of stages) {
    for (const { name } of metrics) {
      const count = samples.get(sampleKey(id, name)).length;
      if (count === 0) {
        throw new Error(`Attempt ${attemptId} has a missing scalar row for stage ${id}, metric ${name}.`);
      }
      if (count > 1) {
        throw new Error(`Attempt ${attemptId} has a duplicate scalar row for stage ${id}, metric ${name}.`);
      }
    }
  }
  return samples;
}

function hashBuffer(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

async function loadValidatedAttempts(schema) {
  const loaded = [];
  for (const attempt of schema.attempts) {
    const [report, rawCsv] = await Promise.all([
      readFile(attempt.resolvedReportPath),
      readFile(attempt.resolvedRawCsvPath),
    ]);
    const actualReportSha256 = hashBuffer(report);
    const actualRawCsvSha256 = hashBuffer(rawCsv);
    if (actualReportSha256 !== attempt.reportSha256) {
      throw new Error(`Attempt ${attempt.id} report SHA-256 mismatch.`);
    }
    if (actualRawCsvSha256 !== attempt.rawCsvSha256) {
      throw new Error(`Attempt ${attempt.id} raw CSV SHA-256 mismatch.`);
    }
    loaded.push({
      ...attempt,
      samples: extractSamples(
        rawCsv.toString('utf8'),
        attempt.id,
        schema.stages,
        schema.metrics,
        schema.csvFormat.columns,
      ),
    });
  }
  return loaded;
}

function sourceHashChain(attempts) {
  let chain = '0'.repeat(64);
  for (const attempt of attempts) {
    chain = createHash('sha256').update([
      'lab10-report-csv-hash-chain-v1',
      chain,
      attempt.id,
      attempt.reportSha256,
      attempt.rawCsvSha256,
    ].join('\0')).digest('hex');
  }
  return chain;
}

function medianOfSorted(values) {
  const upperIndex = values.length / 2;
  const lower = values[upperIndex - 1];
  const upper = values[upperIndex];
  const sum = lower + upper;
  return Number.isFinite(sum) ? sum / 2 : lower / 2 + upper / 2;
}

function summarize(schema, attempts, hashChainSha256) {
  const rows = [];
  for (const { id: stageId } of schema.stages) {
    for (const metric of schema.metrics) {
      const key = sampleKey(stageId, metric.name);
      const values = attempts.map((attempt) => attempt.samples.get(key)[0]);
      const sorted = values.toSorted((left, right) => {
        if (left < right) return -1;
        if (left > right) return 1;
        return 0;
      });
      rows.push({
        stage: stageId,
        metric: metric.name,
        unit: metric.unit,
        count: LAB10_ATTEMPT_IDS.length,
        median: medianOfSorted(sorted),
        minimum: sorted[0],
        maximum: sorted.at(-1),
        hashChainSha256,
      });
    }
  }
  return rows;
}

function encodeCsvField(value) {
  const text = String(value);
  return /[",\r\n]|^\s|\s$/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function serializeSummary(rows) {
  const lines = ['stage,metric,unit,count,median,minimum,maximum,hash_chain_sha256'];
  for (const row of rows) {
    lines.push([
      row.stage,
      row.metric,
      row.unit,
      row.count,
      row.median,
      row.minimum,
      row.maximum,
      row.hashChainSha256,
    ].map(encodeCsvField).join(','));
  }
  return `${lines.join('\n')}\n`;
}

async function readLedger(ledgerPath) {
  let source;
  try {
    source = await readFile(ledgerPath, 'utf8');
  } catch (error) {
    throw new Error(`Could not read LAB10 ledger: ${error.message}`, { cause: error });
  }
  try {
    return JSON.parse(source);
  } catch (error) {
    throw new Error(`LAB10 ledger is not valid JSON: ${error.message}`, { cause: error });
  }
}

export async function reduceLab10Reports(ledgerPath, summaryPath) {
  const resolvedLedgerPath = path.resolve(requireNonemptyString(ledgerPath, 'Ledger path'));
  const resolvedSummaryPath = path.resolve(requireNonemptyString(summaryPath, 'Summary path'));
  const ledger = await readLedger(resolvedLedgerPath);
  const schema = validateLedger(ledger, path.dirname(resolvedLedgerPath));
  const sourcePaths = schema.attempts.flatMap((attempt) => [
    attempt.resolvedReportPath,
    attempt.resolvedRawCsvPath,
  ]);
  if (resolvedSummaryPath === resolvedLedgerPath || sourcePaths.includes(resolvedSummaryPath)) {
    throw new Error('Summary path must not overwrite the ledger or a source artifact.');
  }

  const attempts = await loadValidatedAttempts(schema);
  const hashChainSha256 = sourceHashChain(attempts);
  const rows = summarize(schema, attempts, hashChainSha256);
  await writeFile(resolvedSummaryPath, serializeSummary(rows));
  return { hashChainSha256, rowCount: rows.length };
}

function isCommandLineEntry() {
  return process.argv[1] !== undefined
    && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
}

if (isCommandLineEntry()) {
  const argumentsList = process.argv.slice(2);
  if (argumentsList.length !== 2) {
    console.error('Usage: node public/assets/exercise-solutions/lab10-report-reducer.mjs <ledger.json> <summary.csv>');
    process.exitCode = 1;
  } else {
    try {
      await reduceLab10Reports(argumentsList[0], argumentsList[1]);
    } catch (error) {
      console.error(error instanceof Error ? error.message : 'LAB10 report reduction failed.');
      process.exitCode = 1;
    }
  }
}
