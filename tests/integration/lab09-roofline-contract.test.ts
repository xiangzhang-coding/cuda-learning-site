// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const docsRoot = path.resolve(import.meta.dirname, '../../src/content/docs');
const slug = 'build-original-roofline';
const reviewDate = '2026-09-01';
const sourceCommit = 'd69f7131acff7f8b1dfcd780b494426b5948735b';

function frontmatter(source: string) {
  return /^---\n([\s\S]*?)\n---/.exec(source)?.[1] ?? '';
}

function yamlList(metadata: string, field: string) {
  const match = new RegExp(`^${field}:\\n((?:  - .+\\n?)+)`, 'm').exec(metadata);
  return match?.[1].trim().split('\n').map((line) => line.replace(/^\s*-\s*/, '')) ?? [];
}

function evidenceList(metadata: string, field: string) {
  const match = new RegExp(`^  ${field}:\\n((?:    - .+\\n?)+)`, 'm').exec(metadata);
  return match?.[1].trim().split('\n').map((line) => line.replace(/^\s*-\s*/, '')) ?? [];
}

async function readPair() {
  return Promise.all([
    readFile(path.join(docsRoot, `labs/${slug}.mdx`), 'utf8'),
    readFile(path.join(docsRoot, `en/labs/${slug}.mdx`), 'utf8'),
  ]);
}

describe('LAB09 original roofline contract', () => {
  it('publishes one aligned bilingual LAB09 pair with the frozen curriculum graph', async () => {
    const [zh, en] = await readPair();
    const zhMetadata = frontmatter(zh);
    const enMetadata = frontmatter(en);

    expect(zhMetadata).toContain('pairId: lab09');
    expect(enMetadata).toContain('pairId: lab09');
    expect(zhMetadata).toContain('counterpart: /en/labs/build-original-roofline/');
    expect(enMetadata).toContain('counterpart: /labs/build-original-roofline/');
    expect(zh).toContain('href="/en/labs/build-original-roofline/"');
    expect(en).toContain('href="/labs/build-original-roofline/"');

    for (const source of [zh, en]) {
      const metadata = frontmatter(source);
      expect(metadata).toContain('unitId: LAB09');
      expect(metadata).toContain('resourceKind: lab');
      expect(metadata).toContain(`factCheckDate: '${reviewDate}'`);
      expect(metadata).toContain('license: CC-BY-4.0');
      expect(metadata).toContain('provenance: original');
      expect(yamlList(metadata, 'prerequisites')).toEqual(['Q10']);
      expect(yamlList(metadata, 'relatedUnits')).toEqual(['Q09', 'A14', 'EX02', 'VIS13']);
      expect(yamlList(metadata, 'exampleIds')).toEqual(['EX02']);
      expect(yamlList(metadata, 'canonicalRanges')).toEqual(['error-checking', 'kernel', 'cpu-reference']);
      expect(yamlList(metadata, 'toolkitLanes')).toEqual(['cuda-11.8', 'cuda-12.9', 'cuda-13.3']);
      expect(metadata).toContain('canonicalExample: EX02');
      expect(metadata).toContain("minimumComputeCapability: '7.5'");
      expect(metadata).toContain('maximumProblemMemoryBytes: 201326592');
      expect(metadata).toContain('gpuCount: 1');
      expect(metadata).toContain('estimatedMinutes: 180');
      expect(metadata).toContain('difficulty: advanced');
      expect(metadata).toMatch(/compilation: \[\][\s\S]*runtime:\n    - Pending Hardware Verification/);
      expect(evidenceList(metadata, 'expectedObservations').length).toBeGreaterThanOrEqual(5);
      expect(evidenceList(metadata, 'expectedObservations')[0]).toMatch(/CUDA boundar(?:y|ies)/i);
      expect(metadata).toContain('recordedObservations: []');
      expect(source).toContain(sourceCommit);
      expect(source).toContain('CanonicalCode exampleId="EX02" range="error-checking"');
      expect(source).toContain('CanonicalCode exampleId="EX02" range="kernel"');
      expect(source).toContain('CanonicalCode exampleId="EX02" range="cpu-reference"');
    }

    expect(yamlList(zhMetadata, 'structure')).toEqual(yamlList(enMetadata, 'structure'));
    expect(yamlList(zhMetadata, 'prerequisites')).toEqual(yamlList(enMetadata, 'prerequisites'));
    expect(yamlList(zhMetadata, 'relatedUnits')).toEqual(yamlList(enMetadata, 'relatedUnits'));
    expect(yamlList(zhMetadata, 'canonicalRanges')).toEqual(yamlList(enMetadata, 'canonicalRanges'));
  });

  it('freezes the workload model and a complete performance Environment Manifest', async () => {
    const pair = await readPair();
    const frozenCoordinates = [
      'element_count: 16777216',
      'bytes_per_device_vector: 67108864',
      'maximum_device_allocation_bytes: 201326592',
      'algorithmic_fp32_additions: 16777216',
      'algorithmic_requested_bytes: 201326592',
      'algorithmic_intensity_operations_per_byte: 1/12 (~0.083333)',
    ];
    const manifestFields = [
      'source_commit:',
      'acquisition_method:',
      'checkout_and_worktree_state:',
      'date_utc:',
      'observer:',
      'family: Native Linux',
      'distribution:',
      'architecture:',
      'gpu:',
      'identity:',
      'selected_device_ordinal:',
      'compute_capability:',
      'compute_capability_query:',
      'visible_count:',
      'used_count: 1',
      'driver:',
      'exact_version:',
      'lane:',
      'exact_toolkit_version:',
      'exact_component_versions:',
      'nvcc_version_output:',
      'host_compiler_version_output:',
      'ncu_path:',
      'ncu_version_output:',
      'ncu_config_file_policy: disabled with --config-file off',
      'ncu_config_file_control_result:',
      'ncu_help_log_and_sha256:',
      'ncu_list_sections_log_and_sha256:',
      'ncu_query_metrics_log_and_sha256:',
      'cupti_version:',
      'cupti_observation_method:',
      'cupti_library_path_and_sha256:',
      'compatibility_result:',
      'cxx_dialect: c++17',
      'build_type_and_optimization:',
      'architecture_targets:',
      'debug_lineinfo_lto_flags:',
      'exact_ordered_commands_and_expanded_argv:',
      'binary_sha256:',
      'generation_definition:',
      'vector_count: 3',
      'bytes_per_vector: 67108864',
      'canonical_application_device_bytes: 201326592',
      'selected_kernel: vector_add',
      'block_threads: 256',
      'grid_blocks: 65536',
      'device_access_result:',
      'administrator_policy_owner:',
      'non_admin_counter_approval_record:',
      'actual_counter_access_result:',
      'privilege_escalation: prohibited; no sudo or bypass',
      'cuda_visible_devices:',
      'bare_metal_vm_container:',
      'container_image_and_digest:',
      'mig_state:',
      'mps_state:',
      'concurrent_gpu_and_cpu_load:',
      'clocks_and_persistence_policy:',
      'power_limit_and_policy:',
      'thermal_state_before_and_after:',
      'profiler_queries:',
      'direct_process_warm_up:',
      'profiler_attempts:',
      'oracle: independent canonical CPU reference',
      'absolute_tolerance: 1e-5',
      'relative_tolerance: 1e-5',
      'all_elements_checked:',
      'all_cuda_boundaries:',
      'canonical_explicit_cudaDeviceSynchronize: required',
      'kernel_duration_scope:',
      'excluded_from_retained_samples: true',
      'independent_profiler_attempts: 10',
      'acquisition_order: [01, 02, 03, 04, 05, 06, 07, 08, 09, 10]',
      'raw_sample_retention: all attempts, no deletion',
      'statistic: median',
      'spread: min and max',
      'outlier_policy:',
      'invalid_batch_policy:',
      'exact_reported_name:',
      'kernel_name_basis:',
      'selected_section:',
      'selected_metrics:',
      'exact_metric_names:',
      'metric_definitions:',
      'metric_units:',
      'metric_scopes:',
      'metric_filters:',
      'traffic_memory_level_and_path:',
      'traffic_metric_and_definition:',
      'duration_metric_and_definition:',
      'requested_mode:',
      'actual_mode:',
      'pass_count_per_attempt:',
      'save_restore_and_cache_control:',
      'clock_control_and_serialization:',
      'measured_perturbation_boundary:',
      'ceilings:',
      'compute:',
      'bandwidth:',
      'named_memory_path:',
      'provenance_class:',
      'benchmark_source_commit_binary_hash:',
      'correctness_qualification_method:',
      'method_commands_repetitions_raw_samples_statistic:',
      'exact_owner_or_report_provenance:',
      'alignment_audit:',
      'profiler_attributed_traffic_bytes:',
      'duration_seconds:',
      'achieved_gops:',
      'ridge_operations_per_byte:',
      'roof_gops:',
      'report_paths_and_sha256:',
      'raw_stdout_stderr_paths_and_sha256:',
      'exit_statuses:',
      'acquisition_ledger:',
      'csv_path_and_sha256:',
      'table_path_and_sha256:',
      'original_chart_path_and_sha256:',
      'chart_source_or_generation_command_and_sha256:',
      'private_original_directory:',
      'observer_and_transfer_history:',
      'report_log_manifest_artifact_hash_ledger:',
      'derived_exports_and_parent_hashes:',
      'retention_and_access_policy:',
      'sanitization:',
      'reviewer_and_date:',
      'removed_coordinates:',
      'transformations:',
      'original_to_derivative_hash_mapping:',
    ];

    for (const source of pair) {
      for (const coordinate of frozenCoordinates) expect(source).toContain(coordinate);
      for (const field of manifestFields) expect(source).toContain(field);
      expect(source).toContain('16,777,216 x (4 + 4 + 4) = 201,326,592');
      expect(source).toMatch(/read\/read\/write|两次 4-byte read 与一次 4-byte write/i);
      expect(source).toMatch(/algorithmic requested-byte model/i);
      expect(source).toMatch(/not a measurement of DRAM|不是 DRAM[\s\S]{0,160}测量值/i);
      expect(source).toMatch(/allocation bytes equal transferred bytes|allocation bytes 等于 transferred bytes/i);
      expect(source).toMatch(/independent CPU reference|独立 CPU reference/i);
      expect(source).toContain('cudaDeviceSynchronize');
      expect(source).toMatch(/Any failure blocks every|任何 failure 都会阻断所有/i);
    }
  });

  it('enforces gates, ten-attempt statistics, ceiling provenance, report custody, and original output', async () => {
    const pair = await readPair();
    const requiredSourceCoordinates = [
      'https://docs.nvidia.com/cuda/archive/11.8.0/cuda-toolkit-release-notes/index.html',
      'https://docs.nvidia.com/cuda/archive/12.9.1/cuda-toolkit-release-notes/index.html',
      'https://docs.nvidia.com/cuda/cuda-toolkit-release-notes/index.html',
      'https://docs.nvidia.com/nsight-compute/ProfilingGuide/index.html',
      'https://docs.nvidia.com/nsight-compute/NsightComputeCli/index.html',
      'https://docs.nvidia.com/nsight-compute/NsightCompute/index.html',
      'https://docs.nvidia.com/cuda/cuda-c-best-practices-guide/index.html#bandwidth',
      'https://docs.nvidia.com/cuda/cuda-programming-guide/index.html',
      'https://docs.nvidia.com/cupti/main/main.html',
      'https://doi.org/10.1145/1498765.1498785',
    ];

    for (const source of pair) {
      expect(source).toContain('ncu --config-file off --version');
      expect(source).toContain('ncu --config-file off --help');
      expect(source).toContain('ncu --config-file off --list-sections');
      expect(source).toContain('ncu --config-file off --devices 0 --query-metrics --query-metrics-mode all');
      expect(source).toContain('config.ncu-cfg');
      expect(source).toContain('$HOME/.config/NVIDIA Corporation');
      expect(source).toMatch(/every version, help, list, query, and ten-attempt `ncu` argv|version\/help\/list\/query 和十次采集的每条 `ncu` argv/i);
      expect(source).toMatch(/Do not copy architecture metric names|禁止[\s\S]{0,100}architecture metric names/i);
      expect(source).toContain('ERR_NVGPUCTRPERM');
      expect(source).toMatch(/unavailable[\s\S]{0,100}`n\/a`[\s\S]{0,180}blocker/i);
      expect(source).toMatch(/missing `?\.ncu-rep`?|缺失 `\.ncu-rep`/i);
      expect(source).toMatch(/never numeric zero|绝不是 numeric zero/i);
      expect(source).toMatch(/no `sudo`|不得使用 `sudo`/i);

      expect(source).toMatch(/exactly one additional direct, unprofiled process|额外直接启动恰好一次不带 profiler 的 process/i);
      expect(source).toContain('count: 1');
      expect(source).toContain('excluded_from_retained_samples: true');
      expect(source).toContain('for attempt in 01 02 03 04 05 06 07 08 09 10');
      expect(source).toMatch(/exactly ten attempted invocations|恰好十次 invocations/i);
      expect(source).toMatch(/fresh `ncu` invocation|新的 `ncu` invocation/i);
      expect(source).toMatch(/never overwrite or delete|不得覆盖或删除/i);
      expect(source).toMatch(/entire batch is invalid|整个 batch 无效/i);
      expect(source).toMatch(/new uniquely named full batch|具有新名称的完整十次 batch/i);
      expect(source).toMatch(/median and the min\/max|median 与 min\/max/i);
      expect(source).toMatch(/no deletion|不得删除 sample/i);

      expect(source).toContain('--kernel-name "$kernel_filter"');
      expect(source).toContain("kernel_filter='vector_add'");
      expect(source).toContain('  ncu --config-file off');
      expect(source).toMatch(/one minimal queried section|一个 minimal queried section/i);
      expect(source).toMatch(/minimal queried metrics/i);
      expect(source).toContain('.ncu-rep');
      expect(source).toMatch(/report SHA-256/i);
      expect(source).toMatch(/replay pass|replay passes/i);
      expect(source).toMatch(/save and restore|保存和恢复/i);
      expect(source).toMatch(/perturbation boundary/i);

      expect(source).toMatch(/Calibrated measured ceiling/i);
      expect(source).toMatch(/Modeled, theoretical, or tool-reported ceiling|Modeled、theoretical 或 tool-reported ceiling/i);
      expect(source).toMatch(/Never silently call|不得静默把/i);
      expect(source).toMatch(/unlike provenance classes|provenance class[\s\S]{0,180}不同/i);
      expect(source).toMatch(/named memory path|精确名称的 memory path/i);
      expect(source).toMatch(/hybrid roof/i);
      expect(source).toContain('compute_ceiling_Gop/s / bandwidth_ceiling_GB/s');
      expect(source).toContain('min(compute_ceiling_Gop/s, intensity x bandwidth_ceiling_GB/s)');

      expect(source).toContain('lab09-roofline.csv');
      expect(source).toContain('lab09-roofline-table.md');
      expect(source).toContain('lab09-roofline-chart.svg');
      expect(source).toContain('chart-generation-source');
      expect(source).toMatch(/VIS13[\s\S]{0,240}(?:neither|不是)[\s\S]{0,120}(?:evidence|original observed chart)/i);
      expect(source).toMatch(/point above the roof triggers a mismatch audit|点高于 roof 时启动 mismatch audit/i);
      expect(source).toMatch(/Occupancy, stall reasons, and throughput are three distinct|Occupancy、stall reasons 与 throughput 是三类不同/i);
      expect(source).toMatch(/maximizing occupancy is not an automatic target|maximum occupancy 不是自动优化目标/i);
      expect(source).toMatch(/does not automatically diagnose a bottleneck|不会自动诊断 bottleneck/i);
      expect(source).toMatch(/does not automatically identify root cause|不会自动指出 root cause/i);

      for (const coordinate of requiredSourceCoordinates) expect(source).toContain(coordinate);
      expect(source).toContain('/websites/nvidia_cuda');
      expect(source).toContain('/websites/nvidia_nsight-compute_nsightcompute');
      expect(source).toMatch(/owner documentation[\s\S]{0,160}(?:authoritative|权威)/i);
    }
  });

  it('keeps expected and recorded evidence separate and claims no measured result or speedup', async () => {
    const pair = await readPair();
    const numericMeasurementClaim = /\b(?:measured|observed|achieved)\s+(?:compute ceiling|bandwidth ceiling|traffic|duration|rate|Gop\/s|intensity|roof|occupancy|throughput)\s*(?:is|was|=|:)\s*\d/i;
    const numericSpeedupClaim = /(?:\b\d+(?:\.\d+)?x\s+speedup\b|\bspeedup\s+(?:of|is|=|:)\s*\d|加速比[^。\n]{0,30}(?:为|是|=)\s*\d)/i;

    for (const source of pair) {
      const metadata = frontmatter(source);
      expect(metadata).toContain('recordedObservations: []');
      expect(metadata).toMatch(/compilation: \[\][\s\S]*Pending Hardware Verification/);
      expect(source).toMatch(/Expected observations, not recorded results|预期观察，不是已记录结果/i);
      expect(source).toMatch(/publishes no measured ceiling|没有发布 measured ceiling/i);
      expect(source).toMatch(/learner run[\s\S]{0,240}Community-Observed/i);
      expect(source).toMatch(/not Runtime-Verified|不是 Runtime-Verified/i);
      expect(source).not.toMatch(numericMeasurementClaim);
      expect(source).not.toMatch(numericSpeedupClaim);
      expect(source).not.toMatch(/Runtime-Verified["'`]?\s*(?:status|runtime)?\s*(?:is|:)?\s*(?:granted|true|yes)/i);
    }
  });
});
