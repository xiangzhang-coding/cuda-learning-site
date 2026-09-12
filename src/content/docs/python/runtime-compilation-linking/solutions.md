---
title: 'P03 解答：阶段身份与首个错误的保留'
description: 区分 PTX 编译、cubin 链接与延迟加载，分析状态返回和异常失败，不虚构日志。
pairId: p03-solutions
counterpart: /en/python/runtime-compilation-linking/solutions/
factCheckDate: '2026-09-12'
license: CC-BY-4.0
provenance: original
structure: [review, solution-1, solution-2, valid-alternatives, common-errors]
resourceKind: solution-set
unitId: P03-SOLUTIONS
prerequisites: [P03-EXERCISES]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - title: 'Stable NVRTC binding'
    url: 'https://github.com/NVIDIA/cuda-python/blob/0770ab6ced8931ae8b6c6e5f622f48cb07ea99fa/cuda_bindings/cuda/bindings/nvrtc.pyx'
    version: 'cuda-bindings 13.4.1'
    platform: 'Status-first compiler contract; static review'
    accessDate: '2026-09-12'
  - title: 'Stable nvJitLink binding'
    url: 'https://github.com/NVIDIA/cuda-python/blob/0770ab6ced8931ae8b6c6e5f622f48cb07ea99fa/cuda_bindings/cuda/bindings/nvjitlink.pyx'
    version: 'cuda-bindings 13.4.1'
    platform: 'Exception and writable-output linker contract; static review'
    accessDate: '2026-09-12'
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p03-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/python/runtime-compilation-linking/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-12' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,valid-alternatives,common-errors' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P03-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: P03-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '2' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: cuda-bindings-13.4.1 } }
---

<a class="locale-pair" data-locale-counterpart href="/en/python/runtime-compilation-linking/solutions/" lang="en">Read the English counterpart</a>

## 参考解答

先尝试唯一直接前置 [P03-EXERCISES](/python/runtime-compilation-linking/exercises/)。四个证据数组保持为空。下列状态来自题设场景，不是采集到的编译器或链接器输出。

## 解答 1：构建止于产物

| 阶段 | 修复后的合同 |
| --- | --- |
| 环境 | 使用选定解释器/Python 包与 native-profile.json：五项 Toolkit deb 包加固定驱动用户态。检查原生文件所属包及身份，再验证供 core 查询 cuDriverGetVersion 的真实 libcuda。不要求 Toolkit version.json，也不需要 Device 或 cuInit |
| 目标 | 读取显式 `--arch 75`，不枚举设备，推导 `compute_75` 与 `sm_75` |
| 编译 | Program 指定 C++17、虚拟目标和可重定位设备代码，`compile("ptx")` 得到 PTX 字节 |
| 链接 | `Linker(ptx, options=LinkerOptions(arch="sm_75"))`，要求 nvJitLink 后端，再 `link("cubin")` |
| 检查 | 保留非空产物身份、源码/选项/目标/后端、实际组件记录与阶段日志；不执行 |
| 仅限之后运行 | 选择设备并设置上下文，选择设备支持目标，延迟查找取得 Kernel，提交带类型启动与复制，同步并验证所有结果 |

拒绝 `Device(0).arch`，因为无需 GPU 的构建不需要设备推导目标。虚拟目标的 NVRTC 编译不直接提供 cubin，其 cubin 长度查询为零。没有公开 `ObjectCode.load()`。从 cubin 字节重建对象是可选步骤，不建立加载事实；`get_kernel` 才是延迟加载/查找点，应放在这个构建之外。

此 deb 配置用 `cuda-compiler-13-3=13.3.1-1`、`cuda-command-line-tools-13-3=13.3.1-1` 作为两个 Toolkit 级包坐标；组件记录为 `cuda-nvrtc-13-3=13.3.33-1`、`libnvjitlink-13-3=13.3.33-1`、`cuda-cuobjdump-13-3=13.3.73-1`。已安装记录缺失/版本错误或文件所属包不符才是真正失败。没有 `version.json` 不是失败；伪造文件只会隐藏安装布局假设错误，并未检查真实包。分别保留解析后 NVRTC/nvJitLink 补丁文件名、二进制哈希与 API 版本对，不声明未观察到的传递库身份。驱动用户态导入和构建成功仍须独立验证。

当前配置另行要求 `cuda-compat-13-3=610.43.02-1ubuntu1`。仅包检查可以检查其磁盘文件，但不证明能够加载或查询。类似地，`nvrtcBuiltins` 磁盘记录不是已加载记录：仅包检查不创建 `nativeLibraries` 对象，原生验证阶段将 `nativeLibraries.nvrtcBuiltins` 初始化为 null，直到编译后的映射/身份检查成功才填入观察。纸面表格和通过的仅包预检查都不提供该观察。

CLI 在导入 CUDA 前设置 `CUDA_CACHE_DISABLE=1`，ProgramOptions 和 LinkerOptions 也指定 `no_cache=True`。这排除了默认 NVRTC 缓存的初始化路径，否则首次编译会调用 `cuInit()`。源码记录 `cachePolicy: "disabled"`，只是配置依据，不证明编译或后续 builtins 映射检查成功。只依据未构造 Device 来论证没有初始化并不完整。

实际目标的直接 `Program(...).compile("cubin")` 是另一条合法生成路径，不证明显式 Linker 运行过。EX21 刻意保留 PTX 再 nvJitLink。链接器必须支持编译器输入；固定原生组件对避免了新编译器/旧链接器不匹配，但不承诺任意输入兼容。

假设缓存键必须区分源码字节/内容哈希、包含语言/目标/RDC 的编译选项、编译器身份、链接选项/目标、链接器身份与后端。还应保留产物完整性和来源，并重新检查部署兼容性。保持 `ex21_vector_add` 名称却改变函数体，会改变源码身份，因此只用函数名的键不安全。这是设计约束，不是已经实现的缓存或实测收益。

EX21 的验收包括 GPU 输出。无需 GPU 的构建模式不会把这个主体改成无需运行验证（Runtime-Not-Applicable）。合格编译证据与合格运行证据独立；纸面方案不产生任何证据。

## 解答 2：两种错误合同，一条保留原则

NVRTC 创建调用为 `nvrtc.nvrtcCreateProgram(src_bytes, name_bytes, 0, [], [])`，返回 `(status, program)`。编译返回 `(status,)`，长度查询返回 `(status, size)`，提取/销毁返回单元素状态元组。使用输出前检查每个状态。即使只在 NVRTC 内部，也不能假设通用的双元素解包覆盖所有函数。

nvJitLink 创建为 `nvjitlink.create(1, ["-arch=sm_75"])`，返回整数句柄。`version()` 返回无状态的主/次版本；`add_data`、`complete`、输出提取与 `destroy` 成功时返回 None。原生错误抛 `nvjitlink.nvJitLinkError`。成功路径先查询 cubin 长度、分配精确长度 `bytearray`、提取，写完后才转换成不可变字节。销毁已取得的句柄前查询并读取 error/info 日志。

| 场景 | 主要诊断 | 次要诊断与所有权规则 |
| --- | --- | --- |
| A | compile 的 `NVRTC_ERROR_COMPILATION` | 另记日志长度查询失败；该失败不能提供可信长度或存储。成功取得的程序只销毁一次并检查状态，不继续提取产物或链接 |
| B | nvJitLink create 异常 | 没有已返回的句柄，不查句柄日志、不 destroy；保留所给选项与加载器/异常信息，不虚构日志 |
| C | complete 异常 | 句柄有效时读入 `bytearray(17)`，解码且只移除尾部 NUL；finally 中尝试一次 destroy，其失败为次要诊断，不能替换 complete 失败 |

17 是题设长度，不是已知消息。不能编造内容，也不能用宽泛 strip 删除有意义空白。错误报告本身失败时，补充该诊断并保留原始异常。缺失库或 Python `ValueError`/`TypeError` 不是原生状态元组，可能发生在取得任何资源之前。

core Program 的成功 `logs=` 输出与失败异常诊断不同。日志流在编译成功后写入；编译抛异常时，应检查保留的类型/消息/日志注释，不能把空 StringIO 当作无错证明。core 实现中的错误类是私有的，独立 CLI 无需导入它们也能报告异常。core Linker 成功日志可以缓存，但失败链接日志应在 close 前读取，不应假设之后仍可用。

EX21 在显式 `cleanup_step` 动作周围捕获 Python stderr 与原生 FD 2，包括 Program/Linker 关闭和代码引用放弃。任何非空捕获 stderr 都保留在 `cleanupWarnings` 并阻止成功；异常/捕获失败另记为 `cleanupErrors`，不替换原始失败。每动作载荷的 16,384 字节/字符边界会标明截断，不限制临时文件磁盘使用，也不观察延迟析构。之后的 GC、动作结束后才刷出的原生输出及判定后的解释器关闭，都不属于该次判定。上述纸面情景不证明真实原生清理，助手也不是通用的并发安全库设施。

## 合法替代与取舍

可以在验证真实合同后，分别为状态返回 API 和异常 API 写小型适配器，统一报告格式，但不能消除阶段身份或所有权差异。不需要显式链接时，直接 cubin 编译合理；相应构建描述与验收也必须如实表述。一个独立的仅编译主体可按自己的验收标准设为无需运行验证；EX21 不是该主体。

## 常见错误

- 把非空 cubin 字节等同于库已加载、符号已找到、核函数已完成或向量正确。
- 编译失败后，仅因为函数名缓存条目存在就复用旧代码。
- 把 nvJitLink 主版本当成成功状态，或把整数句柄当元组。
- 向不可变 bytes 写入、destroy 后查询日志，或清理尚未取得的句柄。
- 让 finally 异常抹掉首个编译器/链接器错误。
- 打印虚构诊断文本，或从纸面失败场景授予证据状态。

返回 [P03](/python/runtime-compilation-linking/)和 [EX21](/examples/cuda-python-launch/)。来源：[SRC-CUDA-077](/sources-and-versions/#src-cuda-077)、[SRC-CUDA-078](/sources-and-versions/#src-cuda-078)与 [SRC-CUDA-079](/sources-and-versions/#src-cuda-079)，核对于 **2026-09-12**。
