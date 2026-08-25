---
title: 'O05 Reviewed Solutions: Command Records and Reproduction Packages'
description: Reviewed solutions, reasoning, valid alternatives, and common errors for the two O05 Exercises.
pairId: o05-solutions
counterpart: /start/linux-command-line/solutions/
factCheckDate: '2026-08-26'
license: CC-BY-4.0
provenance: original
structure:
  - review
  - solution-1
  - solution-2
  - valid-alternatives
  - common-errors
resourceKind: solution-set
unitId: O05-SOLUTIONS
prerequisites:
  - O05-EXERCISES
relatedUnits:
  - O05
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: o05-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: O05-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: O05-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: O05 }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:expected-observations', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/start/linux-command-line/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These are the **Reviewed solutions** for the [O05 Exercises](/en/start/linux-command-line/exercises/). Compare your failure model before comparing command forms. Filenames may vary, but status, channel, and time boundaries must not be merged until they lose meaning. No command on this page was executed, and no example output follows.

## Solution 1: Repair the misleading pipeline log

The simplest authoritative repair removes the pipeline, preserves both channels separately, and copies status immediately after the command:

```bash
export TZ=UTC
printf -v started_at '%(%Y-%m-%dT%H:%M:%SZ)T' -1
printf '%s\n' "$started_at" >"$record_dir/build.started-at"

make -C "$build_dir" "$target" \
  >"$record_dir/build.stdout" \
  2>"$record_dir/build.stderr"
build_status=$?

printf -v finished_at '%(%Y-%m-%dT%H:%M:%SZ)T' -1
printf '%s\n' "$finished_at" >"$record_dir/build.finished-at"
printf '%s\n' "$build_status" >"$record_dir/build.exit"

if (( build_status != 0 )); then
  exit "$build_status"
fi
```

### Reasoning

The original pipeline normally returns the final `tee` stage's status. Although the following `printf` expands `$?` immediately, it may record only a successful `tee`. `2>&1` also duplicates stderr onto stdout before the pipe, so `build.log` cannot identify which channel originally produced a line.

The repair makes `make` the simple command under test. A redirection-open failure or `make` failure produces a nonzero status, which the script saves before any later command. Finish time is collected only after status is safe. The terminal no longer displays build content live because separate stdout and stderr are the unambiguous authoritative artifacts. Use the valid alternative below if live display is required.

## Solution 2: Design the reproducible build and process record

A qualifying record package can contain:

- `command.sh` for the fixed literal script and `argv.nul` for NUL-separated script name and arguments. Optional `xtrace.log` is labeled only as an expanded diagnostic trace.
- `paths.txt` for stage-start `pwd -L`, `pwd -P`, build-directory `realpath -e`, and each query status.
- `environment.allowlist` for variables added explicitly to an empty environment, with a reason for every non-baseline entry.
- `system.uname` and `tools.txt` for actual `uname -srm`, Bash, Make, compiler, and relevant tool versions.
- `stages.tsv` for each stage's name, working directory, UTC start, UTC finish, exit status, stdout filename, and stderr filename.
- `processes.before`, `processes.after`, and `processes.errors` for fixed-column `ps` snapshots, collection times, and procfs denial or disappearance errors.
- `build.stdout`, `build.stderr`, and `build.exit` for original channels and the actual stage status.
- `SHA256SUMS` for every closed, immutable record file except the manifest itself.

### Recommended order

1. Create the record directory outside the build tree, fix `command.sh`, and save `argv.nul`.
2. Immediately before stage start, record logical path, physical path, and resolution status.
3. Define the minimal environment allowlist, record it, and run the stage with the same `env -i` assignments.
4. Record `uname -srm` and actual tool versions, then write the start UTC time.
5. Collect the starting process snapshot with fixed columns and `LC_ALL=C`; save collection status and errors separately.
6. Run the stage in its explicit working directory, separate stdout and stderr, save exit status immediately, and write finish UTC time.
7. Collect the finishing process snapshot. Record observed errors for exited PIDs, reuse risk, and permission denial without filling missing values.
8. Close every file, verify the inventory, then calculate SHA-256 from inside the record directory.

The allowlist and process collection can use:

```bash
env -i PATH="$tool_path" LC_ALL=C TZ=UTC env \
  >"$record_dir/environment.allowlist"

uname -srm >"$record_dir/system.uname"

LC_ALL=C ps -eo pid=,ppid=,lstart=,stat=,comm= --sort=pid \
  >"$record_dir/processes.before"
process_status=$?
printf '%s\n' "$process_status" >"$record_dir/processes.before.exit"
```

### Reasoning

This design separates input, execution context, dynamic observation, and sealing. The literal script answers what was requested. xtrace answers only which expanded path was taken. Start and finish snapshots bound process claims without impersonating full history. An error file keeps permission limits and disappearing `/proc/PID` entries visible. Final hashes detect later byte changes but do not turn unobserved facts into truth.

## Valid alternatives

If live display is mandatory, retain a merged stream while preserving every stage status:

```bash
set -o pipefail
make -C "$build_dir" "$target" 2>&1 | tee "$record_dir/build.combined"
pipeline_status=("${PIPESTATUS[@]}")
printf '%s\n' "${pipeline_status[0]}" >"$record_dir/make.exit"
printf '%s\n' "${pipeline_status[1]}" >"$record_dir/tee.exit"

if (( pipeline_status[0] != 0 )); then
  exit "${pipeline_status[0]}"
fi
if (( pipeline_status[1] != 0 )); then
  exit "${pipeline_status[1]}"
fi
```

This is valid only when `PIPESTATUS` is copied immediately after the pipeline, the combined log is labeled as a convenience view, and a `tee` write failure also fails the record. If channel identity is required, use separate stdout and stderr instead of trying to recover it from the merged file.

A Make recipe may use `cd build && command` on one line or, preferably for a sub-Make, `$(MAKE) -C build target`. `.ONESHELL` is also valid when its shell policy is declared and earlier command failures are checked.

Process records may use only fixed-column `ps`, or add `/proc/PID/status` and `cwd` for selected PIDs. The latter is more detailed but must retain read time, permission errors, process-exit races, and PID-reuse boundaries. SHA-256 and SHA-512 are both SHA-2 choices; the record declares one and uses it consistently.

## Common errors

- Treating the existence of a log written by `tee` as proof that the upstream command succeeded.
- Running `printf`, a timestamp command, or another simple command before copying `$?` or `PIPESTATUS`.
- Reading `cmd 2>&1 >file` as sending both channels to `file`.
- Treating xtrace as original input and publishing expanded credentials in the trace.
- Running `cd` on one Make recipe line and assuming the next line remains there.
- Calling one `ps` read complete process history or translating permission denial into “process absent.”
- Inheriting the full environment and leaking token, proxy, or license variables into a public record.
- Hashing while logs are still open or asking `SHA256SUMS` to hash itself.

Reviewed: **2026-08-26**. These solutions provide record methods and did not run a build, observe processes, or generate hardware evidence.
