# 小参数模型卡

[English](MODEL_CARD.md) · [返回首页](README-CN.md)

这张模型卡说明仓库里有哪些小参数语言模型、它们采用什么架构，以及已有实验取得了哪些结果。以下数字核对自当前代码、Notebook 保存的输出和实验报告，整理于 2026-09-30。

## 模型与实验一览

| 模型 / 实验 | 架构与规模 | 已有训练结果 | 当前入口与状态 |
|:---|:---|:---|:---|
| nanoGPT 字符级基线 | GPT-2 风格 Dense；2 层、64 hidden、2 个 Attention head；总参数 **108,352** | Tiny Shakespeare，500 步；最后记录的 train loss **2.2472**、val loss **2.2906** | [Mini-GPT Notebook](notebooks/part1-foundation/06-mini-gpt.ipynb)，已有训练输出 |
| FirstLLM 64M 级 Dense | 8 层、768 hidden、8Q / 4KV、FFN 2304；报告参数量 **约 61.55M** | mini 档 PT loss **8.93 → 2.74**；PT 验证集 PPL **18.30 / 18.03**；SFT loss **约 2.3 → 1.65** | [正式训练配置](llm_train/configs/firstllm_64m_exp24.yaml)与[报告](llm_train/reports/exp24_repro_mini_seed42_report.md)，已有 seed 42 结果 |
| 紧凑 Dense 短程实验 | 4 层、384 hidden、6Q / 2KV、FFN 1152；报告参数量 **约 9.34M** | PT 与 SFT 各 150 步；PT 10-step mean **7.4355 → 2.2707** | [历史实验报告](llm_train/reports/station2_pt_sft_report.md)，当前未提供独立训练配置 |
| MoE 教学实现 | Top-k 路由与专家 FFN；专家数量、激活数量可用于教学实验 | 尚无完整小参数 MoE 预训练结果 | [MoE Notebook](notebooks/part2-training/13-moe.ipynb)，完整模型配方与参数量待补齐 |

Dense 指每个 Token 都经过同一组网络参数；MoE 则为每个 Token 选择部分专家参与计算。MoE 教程中的示例参数预算不能视为本仓库已训练模型的参数量。

## FirstLLM：64M 级现代 Dense 基线

这是目前仓库提供正式配置、预训练脚本、SFT 脚本与评测报告的小模型主线。「64M」是规模档位名称，报告中的实际模型约为 **61.55M 参数**。`mini` 与 `full` 表示数据和训练预算档位，使用相同的模型架构。

### 架构

| 配置项 | 当前实现 / 配置 |
|:---|:---|
| 模型类型 | Decoder-only，自回归预测下一个 Token；从随机权重预训练 |
| Transformer 层数 / hidden size | 8 / 768 |
| Attention | GQA：8 个 Query head、4 个 KV head；每个 head 维度 96 |
| 位置编码 | RoPE，`theta = 10000` |
| 归一化 | Pre-Norm RMSNorm；Q / K 另做带可学习缩放的 RMSNorm |
| FFN | SwiGLU，中间维度 2304；三个投影均不带 bias |
| 词表 / 权重共享 | 6,400；Token Embedding 与输出 LM Head 共享权重 |
| 训练序列长度 / 精度 | 512 / BF16 |
| 推理缓存 | 当前 FirstLLM 实现 `use_cache=False`，生成时重算完整输入序列 |
| 实现来源 | [modeling_firstllm.py](llm_train/modeling_firstllm.py) · [YAML 配置](llm_train/configs/firstllm_64m_exp24.yaml) |

GQA 让多个 Query head 共享 K/V，SwiGLU 是带门控的前馈网络；RoPE 与归一化组件的具体数值过程见[现代架构教程](notebooks/part2-training/08-gpt2-to-modern-models.ipynb)。

### 预训练数据与预算

mini 档采用 `openbmb/Ultra-FineWeb` 的中文语料。报告记录的处理流程为：质量分数 ≥ 0.8 → Data-Juicer 1.5.5 清洗 HTML、修复 Unicode、整理空白 → 长度过滤 100–8,000 → 按真实 BPE Token 数截断 → 划分并打包。该管线依赖上游去重，跳过额外的 SimHash 去重。

| 项目 | mini 档已报告实验 | full 档当前配置 |
|:---|:---|:---|
| 文档数 | 255,023 | 未提供完成实验的统计 |
| 训练集 / 验证集 Token | 269,369,065 / 1,140,875 | 需由实际数据 manifest 确认 |
| PT 步数 / batch / block | 5,120 / 128 / 512 | 34,560 / 128 / 512 |
| PT 处理 Token 预算 | 335,544,320，约 0.336B | 配置预算 2,264,924,160，约 2.265B |
| 学习率 | 2e-3 | 1e-3 |
| 已发布训练指标 | 下表中的 seed 42 记录 | 尚无对应完成报告 |

「处理 Token 预算」按 `步数 × batch × block` 计算，包含重复采样；它不等于训练语料中不重复的 Token 数。mini 档采用 cosine 学习率调度、100 步 warmup、weight decay 0.1 和梯度裁剪 1.0。报告记录在 AMD MI300X 单卡上训练，环境为 PyTorch 2.10.0 + ROCm 7.13。

此次实验使用**已有的 MiniMind 6,400 词表 Tokenizer**。教程中的从零 BPE 训练是另一项实验；复现本表时，需要准备与报告一致的 Tokenizer、特殊 Token 和编码数据。报告与配置注释存在历史统计差异，这里采用报告记录的实际数据量；复现实验应同时保存自己的 manifest。

### PT 与 SFT 结果

| 阶段 / 指标 | 已报告结果 | 测量口径 |
|:---|:---|:---|
| PT loss | 8.93 → 2.74 | 预训练过程记录 |
| PT 验证集 PPL | 18.30 | 打包序列口径，允许跨文档上下文 |
| PT 验证集 PPL | 18.03 | 单文档独立评测口径；报告另列文档 PPL 均值 21.48 |
| SFT loss | 约 2.3 → 1.65 | 只计算 assistant 回答部分的 loss |
| SFT 数据 | BelleGroup `train_1M_CN`，917,424 条 | instruction / input / output 转换为对话 |
| SFT 预算 | 2 epochs，28,668 步 | batch 64、block 512、学习率 1e-4 |

PPL（困惑度）衡量模型在验证文本上的预测表现；只有 Tokenizer、数据和评测口径一致，数值才适合直接比较。上述数字来自 [mini 档 seed 42 报告](llm_train/reports/exp24_repro_mini_seed42_report.md)，不代表多 seed 的均值或标准差。

### SFT 后的 0-shot 评测

0-shot 表示不给模型额外的示范题。以下是同一报告中 **SFT checkpoint** 的结果，单位为百分比；`acc_norm` 是评测框架按答案长度归一化后的选择准确率。

| 任务 | acc (%) | acc_norm (%) |
|:---|---:|---:|
| CEval-valid | 25.78 | — |
| MMLU | 24.21 | — |
| ARC Easy | 25.51 | 26.77 |
| ARC Challenge | 19.97 | 21.76 |
| PIQA | 53.97 | 53.26 |
| OpenBookQA | 13.80 | 26.20 |
| HellaSwag | 26.95 | 27.73 |
| WinoGrande | 51.30 | — |

CMMLU 与 Social IQa 未运行，报告注明数据集脚本兼容问题；GSM8K 在生成阶段因 GPU 异常未完成。它们没有可填入的成绩，不能记为 0%。这些指标用于观察小模型的训练表现；报告中的生成记录仍包含语义混乱与重复输出。

### 复现入口与产物

先按 [README 环境说明](README-CN.md#python-notebook)安装依赖，按配置准备匹配的 Tokenizer 与 SFT JSONL，再通过[数据管线](llm_train/preprocess_ufw.py)生成 `train.bin` 和 `val.bin`。下列命令分别打印当前模型参数量、运行 mini 档 PT、接续 SFT：

```bash
python llm_train/modeling_firstllm.py info \
  --config llm_train/configs/firstllm_64m_exp24.yaml

python llm_train/train_pretrain.py \
  --config llm_train/configs/firstllm_64m_exp24.yaml --tier mini --seed 42

python llm_train/train_sft.py \
  --config llm_train/configs/firstllm_64m_exp24.yaml \
  --ckpt llm_train/checkpoints/firstllm_64m_exp24/mini_seed42.pt --seed 42 \
  --out-dir llm_train/checkpoints/firstllm_64m_exp24_sft
```

`info` 按当前实现统计去重后的参数量，共享权重只计一次；精确整数应以该命令输出为准。报告列出了 PT / SFT checkpoint、HF 导出与评测产物的本地路径，仓库目前提供的是代码和实验记录，没有公开权重下载入口。

## nanoGPT：字符级预训练入门

[Mini-GPT Notebook](notebooks/part1-foundation/06-mini-gpt.ipynb)通过 Tiny Shakespeare 演示完整的下一字符预测训练：65 字符词表、2 层、64 hidden、2 个 Attention head、GELU FFN、Pre-Norm LayerNorm、可学习位置 Embedding、输入输出权重共享。序列长度 64，batch 32，AdamW 学习率 1e-3、weight decay 0.1，seed 42，训练 500 步。

文本共 1,115,394 个字符，按 90% / 10% 划分。保存的输出记录：train loss **4.1917 → 2.2472**，抽样验证 loss **4.0207 → 2.2906**；验证时对 20 个随机 batch 求均值。

参数统计有两个口径：Notebook 的 `get_num_params()` 默认排除 4,096 个位置 Embedding 参数，打印 **104,256**；包含位置 Embedding 的总量为 **108,352**。实现来自仓库固定版本的 [nanoGPT 子模块](external/karpathy/nanoGPT)，并通过 [karpathy_models.py](notebooks/part1-foundation/karpathy_models.py)加载。它是字符级教学基线，loss 不宜与中文 BPE 模型直接比较。

## 历史短程 Dense 验证

[Station 2 报告](llm_train/reports/station2_pt_sft_report.md)记录了约 9.34M 参数的紧凑 Dense 模型：4 层、384 hidden、6Q / 2KV、FFN 1152，包含 RoPE、GQA、QK-Norm、RMSNorm 与 SwiGLU，使用 AMD MI300X VF 单卡。

- 数据：5,000 条 Belle 对话清洗后保留 4,991 条；编码为 8,797,887 个 Token，按长度 256 打包；SFT 有效对话 4,353 条。
- PT：150 步、batch 12；前 / 后 10 步平均 loss **7.4355 → 2.2707**。
- SFT：150 步、batch 12；前 / 后 10 步平均 loss **2.5253 → 2.1588**。最后单步 loss 高于第一步，不能把均值下降表述为每一步都下降。

这份报告引用的是历史 Notebook 路径与实验代码，当前课程已重排；仓库没有为该尺寸提供独立 YAML 配方。它证明短程训练链路曾运行过，不能当作当前默认模型或完整能力评测。

## 适用范围与待补齐项

这些模型用于学习架构、数据准备、训练与评测，生成质量仍有限。full 档的完整结果、第二个 seed 的独立记录、完整小参数 MoE 预训练与端到端 Tool Call SFT 尚未提供。MoE、工具调用、LoRA 合并与后训练目前可通过相应 Notebook 学习；教程覆盖范围不等于每个方向都有已训练 checkpoint。

代码与教程的使用条件见 [LICENSE](LICENSE)；外部数据与子模块另按各自来源的许可使用。
