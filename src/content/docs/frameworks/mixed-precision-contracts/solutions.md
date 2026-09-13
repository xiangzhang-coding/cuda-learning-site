---
title: 'P06 解答：先定位误差，再批准精度'
description: 推导原值与存储输入参考，修正 autocast 例外，区分有限更新与跳过更新，并明确证据边界。
pairId: p06-solutions
counterpart: /en/frameworks/mixed-precision-contracts/solutions/
factCheckDate: '2026-09-12'
license: CC-BY-4.0
provenance: original
structure: [review, solution-1, solution-2, solution-3, valid-alternatives, common-errors]
resourceKind: solution-set
unitId: P06-SOLUTIONS
prerequisites: [P06-EXERCISES]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p06-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/frameworks/mixed-precision-contracts/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-12' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P06-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: P06-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/frameworks/mixed-precision-contracts/solutions/" lang="en">Read the English counterpart</a>

## 解答边界

先尝试 [P06 练习](/frameworks/mixed-precision-contracts/exercises/)，直接先修项为 `[P06-EXERCISES]`。源码合同固定为 PyTorch **2.11.0+cu128**，提交 `70d99e998b4955e0049d13a98d77ae1b14db1f45`，CPython **3.12.14**，原生 Linux x86_64。以下为原创推导，不是执行结果。全部证据数组为空；**依赖 GPU 的行为保持待硬件验证（Pending Hardware Verification）**。

## 解答 1：两份参考，两个误差位置

S 的首个操作数从 `1+2^-12` 舍入为 1。完整原值参考（full-original reference）的点积是 `1+2^-12-1/2 = 2049/4096 = 0.500244140625`。独立求得的存储输入参考（stored-input reference）为 `1/2`，模型最终转换不改变该值。这是输入表示误差，不是归约错误的证据。

R 的操作数均能用 FP16 精确表示。展开 `(1+2^-10)*(1+2^-10)-1`，得到 `2^-9+2^-20 = 2049/1048576 = 0.00195407867431640625`。这一结果附近的 FP16 间距是 `2^-19`。结果恰好位于 `1/512` 与更大邻值的中点，因此偶数优先选择 `1/512 = 0.001953125`。

| 行 | 完整原值参考 | 存储输入参考 | 模型输出 | 输出减完整原值 | 输出减存储输入 |
| --- | --- | --- | --- | --- | --- |
| S | `2049/4096` | `1/2` | `1/2` | `-2^-12` | `0` |
| R | `2049/1048576` | `2049/1048576` | `1/512` | `-2^-20` | `-2^-20` |

取绝对值得到相对两份参考向量的最大误差 **`2^-12`** 与 **`2^-20`**。完整原值向量等于模型向量乘以 `2049/2048`；误差向量则是完整原值向量的负值除以 2049。因此 `norm(y-r)/norm(r) = 1/2049`，约为 0.000488043。参考范数为零时，只有误差范数也为零才报告 0，否则报告无穷大；另外拒绝非有限比较输入。

混合容差 `atol=2^-21`、`rtol=2^-11` 让两行相对两份参考均通过。相对每个完整原值分量，仅相对容差部分就略大于该行误差。改为 `rtol=0` 后，S 的 `2^-12` 与 R 的 `2^-20` 均大于 `2^-21`，两份原值检查都失败。相对存储输入，S 的零误差通过，R 仍失败。政策决策不改变算术事实。

若提前把 R 的乘积舍入为 FP16，会得到 `1+2^-9`；再减去 1，同样是 `1/512`。所以这个数据集不能从终值识别累加精度。反向缩放无法恢复 S 已丢弃的输入小数部分。未来参考必须从窄化前保留的原值构造，不能扩大待评估路径的输入后就给它换个名称。

## 解答 2：替换统一 dtype 断言

| 情形 | 修复后的合同 |
| --- | --- |
| `mm`、`mse_loss` | 适用的非原地矩阵乘法采用低精度政策，适用的损失采用 FP32 |
| `addmm_`、`addmm` 指定 `out=` | 绕过 autocast，遵循原生输入/输出规则，而非非原地 autocast 预期 |
| `sum` 指定 `dtype=torch.float64` | 显式 dtype 优先 |
| `mean`、`std` | 未列出的归约不获得统一 FP32 autocast 政策 |
| 工作线程；禁用区域 | 在工作线程建立所需 autocast 上下文；需要时明确扩大已有 half 操作数 |
| `torch.cuda.is_bf16_supported`、`including_emulation=False` | 仅为原生能力门槛，运算/后端正确性与性能仍需观察 |
| `fp32_precision`、`allow_tf32` | 使用新接口族而不混入旧控制，输出存储不能证明乘法精度 |

公开命名空间是 `torch.amp.autocast`（使用 `device_type`），以及 `torch.amp.GradScaler`（使用 `device`）。基础 AMP 分支保留 FP32 模型状态，反向放在前向/损失 autocast 区域外。新工作线程不会自动继承任意调用者的线程局部（thread-local）autocast 状态。禁用 autocast 也不会转换已创建的低 dtype 张量。

更严格的 FP32 比较应选择新 `"ieee"` 政策，保留全局/后端/运算设置，分别记录矩阵乘法与 cuDNN 卷积。记录 FP16/BF16 低精度归约、全 FP16 累加以及相关 split-K 政策。BF16 分支需要独立的原生能力与运算检查，从相同原始状态开始，并有自己的舍入/验收政策。它不会自动获得速度或收敛结论。

批准需要有限值、相对两份独立参考的误差、声明的容差以及逐分支梯度/更新检查。实际乘法/累加器字段应保持未知，除非有恰当后端与运行证据；dtype 表、核函数名称或接近的答案都不能填补这些字段。

## 解答 3：保持单位直到更新边界

尺度固定为 8 时，两份已归一化贡献变成 `8*(3/4)=6` 与 `8*(-1/4)=-2`，累积值为 4。一次反缩放得到 `4/8=1/2`，普通 SGD 预测 `p_new=2-(1/4)*(1/2)=15/8=1.875`，无需再平均一次。

| 纸面分支 | 已缩放总量 | 反缩放梯度 | 预测参数 | 尺度结论 |
| --- | --- | --- | --- | --- |
| 固定尺度 | `6-2=4` | `4/8=1/2` | `15/8=1.875` | 两份贡献期间均保持 `8` |
| 错误混合尺度 | `6-1=5` | `5/4` | `27/16=1.6875` | 把 `8` 改为 `4` 破坏权重 |
| 独立非有限注入 | 不是有限总和 | 更新前检测到非有限 | `2` 不变 | 回退后 `0.5*0.5=0.25` |

错误方案把第一份贡献的有效权重翻倍。正确生命周期保持梯度已缩放，在最后一份贡献之后反缩放一次，再检查/按需裁剪，最后 step 并更新 scaler。提前反缩放混合单位；反缩放两次无效。记录有限性检查后再改梯度会使检查失效，因此测试注入必须在检查之前。

非有限分支重置参数、优化器与 scaler 状态。它必须保持普通优化器参数不变，并预测下一尺度为 0.25。刻意选用的小初始尺度展示了没有 1 这个下限；它不展示下溢检测、真实模型失败或成功修复前向溢出。

未来运行验收应在对照分支保留有限损失、反缩放后有限梯度，以及预期的非零可表示参数变化；在注入分支保留非有限梯度检测、参数不变与尺度回退。`step` 返回值不足以判断，因为普通优化器即使执行了更新也可能不返回值。状态读取与参数比较放在计时外。缺少精确环境清单（Environment Manifest）与合格外部运行时，所有实测结果字段仍须保持未记录。

## 合法替代与取舍

精确有理数适合本纸面数据；独立主机 FP64 也能精确表示这些特定二进制分数及乘积。更大归约中，FP64 是更高精度参考，不自动等于精确实数算术。明确使用 IEEE 的 FP32 分支可以充当基线，但不能把原值参考换成已经量化的参考。

不需要裁剪或中间检查时，可以让 `step` 在有效批次边界执行反缩放/检查。显式反缩放适合按原始梯度单位检查或裁剪。两种方式都不允许在批次中途改变尺度。原生能力不足时拒绝 BF16 分支是合法结果；静默替换为模拟不能满足原生路径声明。

## 常见错误

- 把扩大后的 FP16 操作数视为未改变的完整原值参考，掩盖量化。
- 用 R 的相同终值证明 FP32 累加，忽略提前舍入的反例。
- 假设所有归约都是 FP32，把注册表误当成运算类别规则。
- 混用新旧 TF32 控制，留下不受支持的精度配置。
- 再平均一次已归一化的微批次贡献，改变预期目标。
- 把尺度钳制在 1，改变 scaler 的公开行为；低于 1 不代表下溢检测。
- 用有限损失、dtype 或源码审查充当 GPU 证据，跳过梯度与参数验收。

返回 [P06](/frameworks/mixed-precision-contracts/)与 [PB-R5-006](/practice/#pb-r5-006)。来源为 [SRC-CUDA-080](/sources-and-versions/#src-cuda-080)与 [SRC-CUDA-082](/sources-and-versions/#src-cuda-082)，复核于 **2026-09-12**。工作表不证明实际计时、加速路径或训练结果。
