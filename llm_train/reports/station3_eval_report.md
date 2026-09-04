# From-0 实战线第 3/3 站完成报告

## 完成内容

已在 `notebooks/part5-production/28-evaluation.ipynb` 尾部追加 13 个 cell，原有 38 个 cell
的正文与代码保持不变。新增部分由 9 个 Markdown cell 和 4 个 code cell 组成，包含：

1. lm-eval 的正式定义、适用原因与结果可比条件
2. 随机小型 Llama 在 HellaSwag 1% 验证集上的真实框架冒烟测试
3. 六组 64M 教学模型完整 GSM8K JSON 的读取、核对、表格和图表
4. strict exact match、Wilson 置信区间与统计功效的衔接解释
5. 重复 trigram 比例和最长非重叠重复片段检测器
6. 9.34M 短训练输出与 64M 复读失败样例的量化对比
7. 三条实验结论、checklist 与 From-0 三站收官导航

Notebook 新增正文没有使用任务书禁止的模型名称。

## 第 2 站 checkpoint 核对

第 2 站在 Notebook 内存中完成了 9.34M 紧凑模型的 150-step PT 和 150-step SFT，没有调用
`torch.save`，仓库与临时实验目录中也没有对应 checkpoint。因此第 3 站按任务书允许的分支，
没有假装重新加载该模型，而是使用仓库已有的 64M 完整实验结果进行正式评测分析。

## lm-eval 真实冒烟测试

- 环境：`/home/devpod/llm_nb_venv/bin/python`
- lm-eval：0.4.12
- PyTorch：2.10.0+rocm7.13.0rc2
- 设备：`cuda:0`，对应 AMD ROCm GPU
- 模型：`hf-internal-testing/tiny-random-LlamaForCausalLM`
- 任务：HellaSwag validation
- 口径：0-shot，`limit=0.01`，seed 42
- 实际样本数：101
- `acc`：25.74%
- `acc_norm`：34.65%

该模型是随机权重，实验目的只是验证 lm-eval 的模型加载、数据读取、log-likelihood 请求和
指标聚合链路。Notebook 已明确提示 `limit` 结果不能当作正式模型能力成绩。

## 64M 教学模型 GSM8K 结果

代码真实读取 `llm_train/reports/eval_gsm8k_*.json` 六个文件，并核对每次运行都覆盖完整的
1,319 道测试题。六组结果均为：

- 答对题数：8
- `exact_match,strict-match`：0.006065200909780136，即 0.61%
- `exact_match,flexible-extract`：0.006065200909780136，即 0.61%
- 95% Wilson 置信区间：0.31%～1.19%

六组训练设置包括数学 scratchpad、Belle 与 scratchpad 混合、更长 CoT、仅 Belle、
`block_size=1024` 和 10B-token PT。Notebook 将「六组相同分数」解释为当前架构、数据和训练
流程下的 64M 容量门槛，同时保留统计限定：没有逐题记录时不能做 McNemar 配对检验，因此
结论是「没有测出配方差异」，不是「六个模型在所有输入上完全相同」。

## 生成质量诊断

检测器先把中文单字、英文单词、数字或标点切成单位，再计算重复 trigram 比例，并搜索至少
出现两次且互不重叠的最长片段。真实输出为：

| 样例 | 重复 trigram 比例 | 最长重复片段 | 长度 |
|:---|---:|:---|---:|
| 9.34M / 150-step SFT | 0.00% | `，` | 1 个单位 |
| 64M 复读失败 | 25.00% | `这颗金银财宝` | 6 个单位 |

Notebook 同时指出：紧凑模型没有形成局部循环，但回答仍然语义混乱，所以低重复率不能替代
正确性或语义质量评测。

## 执行与校验

为避免改动作业填空等原有 cell，新增 4 个 code cell 在一个干净 kernel 中按顺序真实执行；
所有输出与三张 matplotlib 图已经写回 Notebook。执行时使用了校验后删除的临时 runner，并设置：

```bash
HIP_VISIBLE_DEVICES=0 CUDA_VISIBLE_DEVICES=0 \
  /home/devpod/llm_nb_venv/bin/python scripts/_run_station3_cells.py
```

随后完成以下检查：

- 4 个新增 code cell 均有 execution count
- 新增 cell 没有 error output
- Notebook 通过 JSON 解析和 `nbformat.validate`
- 所有新增 code cell 通过 Python AST 语法解析
- 新增代码没有超过 100 字符的行
- 新增函数有中文 docstring，说明参数和返回值
- 新增图表的 title、axis label、legend 与 annotation 均为英文
- 六个 JSON 的样本数、答对数与 strict exact match 通过 assert 核对
- `npm run build` 通过

## 收官导航

Notebook 结尾已加入：

> 🔬 From-0 实战线 3/3 完成
>
> 02 BPE Tokenizer → 11 PT / SFT → 28 正式评测
