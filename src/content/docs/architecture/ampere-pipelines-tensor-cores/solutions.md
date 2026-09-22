---
title: 'H02 解答：等待、发布、读取、释放'
description: 完整的三分块顺序账本及相互独立的回退决策。
pairId: h02-solutions
counterpart: /en/architecture/ampere-pipelines-tensor-cores/solutions/
factCheckDate: '2026-09-22'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, pipeline, gating, evidence]
resourceKind: solution-set
unitId: H02-SOLUTIONS
prerequisites: [H02-EXERCISES]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Ampere capability contracts', url: 'https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/compute-capabilities.html', version: '13.4.2', platform: 'Paper exercise', accessDate: '2026-09-22' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: h02-solutions } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-22' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,pipeline,gating,evidence' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: H02-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: H02-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/architecture/ampere-pipelines-tensor-cores/solutions/" lang="en">Read the English counterpart</a>

## 先修

精确先修：[H02-EXERCISES](/architecture/ampere-pipelines-tensor-cores/exercises/)。原创纸面解答，核对日期 **2026-09-22**；见 [SRC-CUDA-104](/sources-and-versions/#src-cuda-104)。

## 修复阶段与线程束义务

普通拷贝基线对每个分块依次执行全部参与线程的有界加载／存储、块级发布屏障、邻居读取、块级复用屏障，不需要异步拷贝功能，256 个线程始终参与。

异步版本先获取／拷贝／提交分块 0 到 S0、分块 1 到 S1。每线程使用线程作用域流水线（Pipeline）；等待最旧批次后，256 个线程先共同执行块屏障，再读取邻居。下面是顺序规范，不是已编译的 API 实现：

```text
submit tile 0 -> S0; submit tile 1 -> S1
wait oldest with 1 newer batch; block barrier
read tile 0 from S0; block barrier; release tile 0
acquire S0; submit tile 2 -> S0
wait oldest with 1 newer batch; block barrier
read tile 1 from S1; block barrier; release tile 1
wait oldest with 0 newer batches; block barrier
read tile 2 from S0; block barrier; release tile 2
```

线程流水线 API 中，前两次等待对应 `cuda::pipeline_consumer_wait_prior<1>(pipe)`，最后一次对应 `<0>`；每次 submit 包含 acquire、copy 和 commit。wait 后的块屏障把全部线程已完成的拷贝发布给邻居读取者；read 后的屏障防止下一次 acquire/copy 覆盖仍在使用的数据。最终分块不完整时，保留全部参与者，对有效拷贝加谓词，显式初始化缺失共享元素，并保持相同的 commit／屏障顺序。

若样例为 `input[256*t+i]=1000*t+i`，精确拷贝／重排期望值为 `output[256*t+i]=1000*t+((i+1)%256)`。分块 2 的通道 0、255 分别期望 2001、2000。这是代数值，不是已记录输出。预算仍为全局 6144 B、共享缓冲 2048 B，加上同步状态。

`arrive()` 不等于完成；依赖数据的读取必须放在绑定阶段的 wait 之后。屏障需要初始化并维护预期到达数。线程不按约定 drop 就退出，可能使阶段永远无法完成。保持 commit/arrive-on 汇合参与可避免线程束纠缠（Warp Entanglement）的额外批次更新；只对数据移动加谓词，不构成省略集体义务的理由。阶段计数正确仍然不能证明实际重叠。

## 独立处理各项门槛

| 方案 | 拒绝原因 | 显式回退 |
| --- | --- | --- |
| A | `base+1` 比对齐基址多 4 B，16 B 承诺无效 | 普通 FP32 加载／共享存储，有效边界及两个屏障，保留拷贝值 |
| B | 已核对表中 CC 8.6 没有原生 FP64 Tensor Core | 普通 FP64 SIMT，保留 FP64 存储／运算，验证归约顺序与容差 |
| C | 提前返回破坏完整线程束 WMMA 集合调用 | 保留完整参与者并补齐有效分块，或显式选择对转换后 BF16 值做 FP32 SIMT；仍需重新验证乘法／累加行为 |
| D | TF32 乘数违反调用方普通 FP32 要求 | 对原始 FP32 输入执行 FP32 SIMT，不做 TF32 转换 |

CC 8.0 满足 B 的原生能力门槛，但仍受兼容构建、WMMA 形状和其他条件约束。它不会重新对齐 A 的指针、恢复 C 缺失的通道或改变 D 的调用方要求。回退是明确选择并检查契约的算法，不是忽略任意 CUDA 错误的许可。

## 仍需补充的证据

全部架构执行和性能仍待硬件验证（Pending Hardware Verification）。需保留精确源码／编译器／目标及生成产物，在环境清单（Environment Manifest）中记录设备／平台／驱动／库和内存坐标，补充正确性比较、启动／完成检查、消毒器报告与一致计时边界。原生 Linux 是唯一受支持环境（Supported Environment）。来源核对和 VIS15 不产生编译、所选指令、运行、重叠或加速比观察。本原创解答采用 CC BY 4.0，权利方来源保留各自声明。
