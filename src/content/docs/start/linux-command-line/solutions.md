---
title: 'O05 参考解答：命令记录与复现包'
description: O05 两道练习的复核解答、推理、有效替代方案和常见错误。
pairId: o05-solutions
counterpart: /en/start/linux-command-line/solutions/
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

<a class="locale-pair" data-locale-counterpart href="/en/start/linux-command-line/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这是 [O05 练习（Exercise）](/start/linux-command-line/exercises/)的**参考解答**。先比较自己的失败模型，再看命令形式。文件名可以变化，但状态、通道和时间边界不能被合并到失去含义。本页命令未执行，下面没有示例输出。

## 解答 1：修复误导性的管道日志

最简单且最适合作为权威记录的修复是移除管道，分别保存两个通道，并在命令后立即复制状态：

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

### 推理

原命令中的管道默认返回最后一段 `tee` 的状态。随后 `printf` 虽然立即展开 `$?`，记录的仍可能只是 `tee` 成功。`2>&1` 又在管道前把 stderr 复制到 stdout 的目的地，因此 `build.log` 不能标明一行原来属于哪个通道。

修复方案让 `make` 自己成为被测简单命令。重定向打开失败或 `make` 失败都会产生非零状态，脚本在任何后续命令前保存它。完成时间在状态保存后采集，所以不会覆盖待记录的值。终端不再实时显示构建内容，这是为了让独立 stdout/stderr 成为无歧义的权威产物；需要实时显示时可采用后面的有效替代方案。

## 解答 2：设计可复现的构建与进程记录

一份合格记录包可以包含这些文件：

- `command.sh`：执行前固定的字面脚本，`argv.nul`：以 NUL 分隔的脚本名和参数。可选 `xtrace.log` 只能标为扩展后的诊断轨迹。
- `paths.txt`：阶段开始时的 `pwd -L`、`pwd -P` 和构建目录 `realpath -e`，连同各查询状态。
- `environment.allowlist`：空环境上显式加入的变量和值，并说明每个非基础变量的理由。
- `system.uname` 和 `tools.txt`：实际 `uname -srm`、Bash、Make、编译器及相关工具版本。
- `stages.tsv`：每阶段名称、工作目录、开始 UTC、结束 UTC、退出状态、stdout 和 stderr 文件名。
- `processes.before`、`processes.after` 和 `processes.errors`：固定列的 `ps` 快照、时间以及 procfs 拒绝或消失错误。
- `build.stdout`、`build.stderr` 和 `build.exit`：原始通道与实际阶段状态。
- `SHA256SUMS`：全部已关闭、不可再改的记录文件的 SHA-256，不包含清单自身。

### 推荐顺序

1. 在构建树之外建立记录目录，固定 `command.sh`，并保存 `argv.nul`。
2. 紧接阶段开始前记录逻辑路径、物理路径和解析成功状态。
3. 定义最小环境允许列表，先记录它，再用完全相同的 `env -i` 赋值执行阶段。
4. 记录 `uname -srm` 与实际工具版本，写入开始 UTC 时间。
5. 用固定列与 `LC_ALL=C` 采集开始进程快照，另存采集状态和错误。
6. 在明确工作目录运行该阶段，stdout 与 stderr 分开，立即保存退出状态，然后写结束 UTC 时间。
7. 采集结束进程快照。对已退出 PID、复用风险和权限拒绝只记录观察到的错误，不补值。
8. 关闭所有文件，核对清单，再从记录目录内计算 SHA-256。

允许列表和进程采集可以使用：

```bash
env -i PATH="$tool_path" LC_ALL=C TZ=UTC env \
  >"$record_dir/environment.allowlist"

uname -srm >"$record_dir/system.uname"

LC_ALL=C ps -eo pid=,ppid=,lstart=,stat=,comm= --sort=pid \
  >"$record_dir/processes.before"
process_status=$?
printf '%s\n' "$process_status" >"$record_dir/processes.before.exit"
```

### 推理

这套设计把输入、执行上下文、动态观察和封存分开。字面脚本回答“要求执行什么”，xtrace 只回答“展开后走过什么”。开始与结束快照限制进程结论，却不伪装成完整历史。错误文件让权限不足和 `/proc/PID` 消失保持可见。最后计算哈希可检测后续字节变化，但不会把未经观察的事实变成真相。

## 有效替代方案

如果必须实时显示，可以保留合并流，但同时保存每个阶段状态：

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

这个方案有效的前提是 `PIPESTATUS` 紧接管道复制，合并日志明确标成便利视图，而且 `tee` 的写入失败也使记录失败。若必须保留通道身份，仍应使用独立 stdout/stderr，而不是试图从合并文件恢复。

Make 配方可以使用同一行的 `cd build && command`，也可以优先用 `$(MAKE) -C build target`。`.ONESHELL` 也是有效选择，但必须声明 shell 政策并检查早期命令失败。

进程记录可以只用固定列 `ps`，也可以增加针对选定 PID 的 `/proc/PID/status` 与 `cwd`。后一种更详细，但必须同时保留读取时间、权限错误、进程退出和 PID 复用边界。SHA-256 或 SHA-512 都属于 SHA-2；记录必须声明所选算法并始终一致。

## 常见错误

- 把 `tee` 写出的日志文件存在当作上游命令成功。
- 在复制 `$?` 或 `PIPESTATUS` 前运行 `printf`、时间命令或其他简单命令。
- 把 `cmd 2>&1 >file` 误读为两个通道都进入 `file`。
- 把 xtrace 当作原始输入，并把展开后的凭据发布到日志。
- 在两行 Make recipe 中先 `cd`，再假定下一行仍在该目录。
- 把一次 `ps` 读取写成完整进程历史，或把权限拒绝写成“进程不存在”。
- 继承整个环境，再在公开记录中泄露令牌、代理或许可证变量。
- 在日志仍写入时计算哈希，或让 `SHA256SUMS` 哈希自身。

复核日期：**2026-08-26**。这些解答提供记录方法，没有执行构建、观察进程或生成硬件证据。
