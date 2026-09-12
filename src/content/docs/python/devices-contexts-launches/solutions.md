---
title: 'P02 解答：精确参数与失败安全的生命周期'
description: 推导 769 元素的启动覆盖和二进制标量类型，区分正常清理与异步完成失败。
pairId: p02-solutions
counterpart: /en/python/devices-contexts-launches/solutions/
factCheckDate: '2026-09-12'
license: CC-BY-4.0
provenance: original
structure: [review, solution-1, solution-2, valid-alternatives, common-errors]
resourceKind: solution-set
unitId: P02-SOLUTIONS
prerequisites: [P02-EXERCISES]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - title: 'Core Buffer ownership and copy implementation'
    url: 'https://github.com/NVIDIA/cuda-python/blob/53b43746e501f1a0b627f951604991636f77cd9c/cuda_core/cuda/core/_memory/_buffer.pyx'
    version: 'cuda-core 1.2.0'
    platform: 'Static buffer, copy, scalar and lifetime review'
    accessDate: '2026-09-12'
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p02-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/python/devices-contexts-launches/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-12' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,valid-alternatives,common-errors' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P02-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: P02-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: cuda-core-1.2.0 } }
---

<a class="locale-pair" data-locale-counterpart href="/en/python/devices-contexts-launches/solutions/" lang="en">Read the English counterpart</a>

## 参考解答

直接前置为 [P02-EXERCISES](/python/devices-contexts-launches/exercises/)。以下为原创推导与假设故障审查，四个证据数组均为空，不能理解为实际执行的 EX21 变体。

## 解答 1：分别修复表示与覆盖

每个数组需 `769*4=3076` 字节。设备载荷 `3*3076=9228` 字节，页锁定主机载荷另有 9228 主机字节；分配与库开销另计。即使 Python 视图声明有 769 个元素，原方案 769 字节的分配仍然不足。

三个设备 Buffer 作为指针，`ctypes.c_uint32(n)` 作为 32 位无符号计数，`ctypes.c_float(alpha)` 作为 32 位 float。在选定 x86-64 core 路径中，普通 Python int 按指针位宽封送，普通 float 按 double 封送。数值 0.5 可以精确表示，也修不好表示位宽不匹配。转换前拒绝非正计数和超出 uint32 的计数；即使计数可以表示，字节/内存预算及设备启动维度仍会给出额外限制。

grid 为 `(769+255)//256=4`，不是 3。块 0 到 2 覆盖索引 0 到 767；块 3 只有索引 768 的一个有效线程，其余 255 个不参与。共有 1024 个候选线程、769 次写入，且在访问前判断边界。本题要求正计数，因此拒绝 n=0；也可另行定义不做工作的合同，但绝不能启动零网格。负数或过大计数都不应回绕。

前五项输出为 `[2,0,-2,8,0]`，末项是 `0.25+0.5*(-0.5)=0`。这只是独立数学参考，不是全量结果判定。初始化显式页锁定输入，复制到等长设备 Buffer，启动，再用 `d_out.copy_to(h_out, stream=s)` 指定页锁定输出。只基于 `int(h_out.handle)` 创建 ctypes 视图，保留 h_out，在 `s.sync()` 后检查每个有限输出。省略目标的 `copy_to` 可能分配设备存储，不能因此把返回地址解释为 CPU 地址。

这份迁移解答保留同一请求的 C++ 责任，同时改变其主机表示：

| 本请求的 C++ 责任 | Python 方案与语义边界 |
| --- | --- |
| `cudaSetDevice(0)` 选择并初始化 Runtime 主上下文路径；显式 Driver 持有者则保留 CUcontext 并设为当前 | `Device(0)` 加 `dev.set_current()` 选择 core 的共享主上下文。查看 `dev.context`，不使用 None 返回值；没有取得独占重置权限。 |
| `cudaStreamCreateWithFlags` 搭配 `cudaStreamNonBlocking` 创建本请求队列 | `dev.create_stream(options=StreamOptions(nonblocking=True))` 提供全程使用的自有 s。移除旧式 NULL 流排序不证明重叠。 |
| `cudaMalloc` 或 `cudaMallocAsync` 取得每个 3076 字节设备数组；`cudaMallocHost` 取得各主机数组 | 三个 `dev.allocate(3076, stream=s)` Buffer 与三个旧式页锁定 3076 字节 Buffer，保持每种位置 9228 字节载荷。core 资源选择可能是同步的；ctypes 只借用主机存储。 |
| `cudaMemcpyAsync` 指定端点和方向，提交 3076 字节 H2D/D2H | 使用 `d_a.copy_from(h_a, stream=s)`、对应的 b 复制，以及核函数后的 `d_out.copy_to(h_out, stream=s)`。每对容量相等；主机内容在传输期间稳定，持有者活过传输。 |
| 已注册 Runtime 符号，或由 `cuModuleGetFunction` 返回的 CUfunction，标识所需核函数 | 为题设五参数签名取得 Kernel。core ObjectCode 通过共享引用持有 CUlibrary，不是调用者拥有的旧式 CUmodule。未修改的 EX21 核函数没有 alpha，不能直接多传第五个参数。 |
| `kernel<<<4, 256, 0, stream>>>(...)` 或 `cuLaunchKernel` 提供精确参数表示 | `LaunchConfig(grid=4, block=256)` 与 `launch` 使用三个 Buffer、`ctypes.c_uint32(769)`、`ctypes.c_float(0.5)`。769 元素边界保护与正确标量位宽缺一不可。这是方案，不是新实现。 |
| `cudaStreamSynchronize(stream)` 在 C++ 主机比较前完成异步 D2H | `s.sync()` 必须成功后才能比较全部 769 个有限结果。复制指针值或启动成功返回均不够；任何失败都阻止有效输出判定。 |

这不是 API 文本改名。C++ 在带类型的调用边界固定标量表示，Python 主机需明确这些位宽。Runtime 复制调用暴露字节数与方向，这些 core 调用则复制容量相等的完整 Buffer。数学参考、最后使用证明与全量比较在两种变化下都保留。

## 解答 2：等待失败仍然是操作失败

默认主上下文路径的 `dev.set_current()` 返回 None，应另查 `dev.context`。主上下文（Primary Context）是由 core 管理的共享状态，不是这个辅助函数独占的资源。Buffer 与显式流（stream）属于自有资源，主机视图与暴露的句柄属于借用。Kernel/ObjectCode 共享 CUDA 库所有权，Kernel 会持有库。

正常成功顺序为 `D2H -> s.sync() -> 比较 -> 停止使用并释放主机视图引用 -> buffer.close(stream=s) -> s.sync() -> s.close()`。持有者跨过最后一次使用，流跨过排队释放。独立输出字节已取得时，Program/Linker 可提前关闭。ObjectCode/Kernel 没有公开 close；工作完成后释放引用，但不保证立即清理。

题设失败中，D2H 异常是首次观察到的错误，其原因可能是此前的异步启动。保留其阶段、类型/消息和 traceback，另保留后续同步失败。停止新提交，只对实际取得的资源尝试清理，在尝试等待期间保留持有者。致命异步故障也可能使清理失败。不能将输出当成有效、声明状态健康或打印成功；应保留次要诊断并非零终止。

先关闭 s 会失去预期的释放流。原始地址释放可能与 core 所有权造成重复释放。`ObjectCode.handle` 是 CUlibrary，因此 `cuModuleUnload` 同时弄错了句柄类型和所有权。重置主上下文可能使其他使用者失效；关闭当前 Context 会被拒绝。Device、Kernel 和 ObjectCode 都没有方案中假设的公开 close 步骤。清理诊断可能通过异常、Python 警告或原生 stderr 到达；只用 Python catch 或警告处理器并不完整。EX21 的显式 `cleanup_step` 同时重定向 Python stderr 与 FD 2，恢复两者，将异常/捕获失败写入 `cleanupErrors`，并把全部非空捕获 stderr 载荷保留于 `cleanupWarnings`。题设失败轨迹仍是纸面练习，不是观察到的清理运行。

每动作最多保留 16,384 字节载荷，另读一字节检测截断；解码文本限制为 16,384 字符，再加标签/标记。这不限制临时文件的磁盘增长，也不限制全部动作的消息总量。捕获/回放错误同样使清理失败，但不能替换原操作错误或跳过尚未尝试的释放。显式代码引用放弃会被捕获，其他持有引用、后续 GC、延迟原生输出与解释器关闭析构则可能在范围外发生，不属于已经给出的干净判定；JSON 之外仍要保留外部进程 stderr。该助手会改变全局状态，不是通用的安全并发支持。

| C++ 持有者的责任 | 修复后的 core 清理如何承接 |
| --- | --- |
| 用 `cudaFree` 释放自己的 `cudaMalloc` 存储，或为按流分配正确排序 `cudaFreeAsync` | 最后使用后以 `buffer.close(stream=s)` 关闭自有设备 Buffer，由内存资源控制原生释放。不再对 core 拥有的地址调用第二次原生 free。 |
| 让 `cudaMallocHost` 存储活过传输与 CPU 读取，再 `cudaFreeHost` | 关闭页锁定 Buffer 前停止使用并放弃 ctypes 视图引用。视图仍在作用域中不代表所有权，核函数完成也不一定代表 D2H 完成。 |
| 依赖输出前检查流完成，使用结束后 `cudaStreamDestroy` | 检查 `s.sync()`，释放 Buffer，等待排队释放完成，再 `s.close()`。两种主机路径中，销毁本身都不是经检查的完成。 |
| 用 `cuDevicePrimaryCtxRelease` 平衡自己的 `cuDevicePrimaryCtxRetain`，同时单独管理当前线程绑定 | retain 由 core 拥有；查看 `dev.context` 的调用者不能替 core 释放。retain/release 与设为当前/解除绑定是不同操作，都不授权重置共享上下文。 |
| 若拥有 Driver CUmodule，保留到使用结束后再 `cuModuleUnload`；传统 Runtime 模块管理不是该所有权合同 | core Kernel/ObjectCode 共享持有 CUlibrary。使用结束后放弃引用，不虚构公开 close，也不手动卸载借用的库句柄。 |

两种语言都必须让首个观察到的错误在清理后保留。C++ 状态检查或 RAII，以及 Python finally/close 语法，都只是控制流程工具，不证明释放成功。即使后续释放看似成功，等待失败仍然意味着操作失败。

## 合法替代与取舍

改变 block 大小是合法选择，但应重新推导向上取整覆盖并检查设备限制；没有测量就不是性能改进。`dev.sync()` 可以建立比流同步更广的完成边界，但可能等待无关工作，也必须检查结果。可嵌入库需要保留调用者上下文；不能把独立程序解法推广为通用上下文切换合同。

## 常见错误

- 混淆元素数与字节容量，或把视图声明长度当成实际分配。
- 因为数值小就使用普通 Python 标量，忽略 ABI 位宽。
- 向下取整丢失末元素；只保护写入，却在判断前读取输入。
- 从变量名或省略目标的复制推断主机存储。
- 通过借用句柄释放共享上下文或 core 拥有的库。
- 将 CPU 参考通过或清理尝试当成 GPU 已成功完成。

返回 [P02](/python/devices-contexts-launches/)和 [EX21](/examples/cuda-python-launch/)。来源：[SRC-CUDA-077](/sources-and-versions/#src-cuda-077)，核对于 **2026-09-12**；EX21 保持待硬件验证（Pending Hardware Verification）。
