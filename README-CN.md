# Modern LLM Notebook

<p align="center">
  <strong>用 27 篇可运行 Jupyter Notebook，从零实现现代 LLM 系统。</strong>
</p>

<p align="center">
  <a href="README.md"><strong>English</strong></a>
  ·
  <a href="README-CN.md"><strong>中文文档</strong></a>
  ·
  <a href="https://walkinglabs.github.io/modern-llm-notebook/"><strong>在线阅读</strong></a>
  ·
  <a href="https://colab.research.google.com/github/walkinglabs/modern-llm-notebook/blob/main/notebooks/part1-foundation/01-tokenizer-basics.ipynb"><strong>Colab 开始</strong></a>
  ·
  <a href="https://discord.gg/XU7DQmpqk"><strong>加入 Discord</strong></a>
</p>

<p align="center">
  <a href="https://github.com/walkinglabs/modern-llm-notebook/stargazers">
    <img alt="GitHub stars" src="https://img.shields.io/github/stars/walkinglabs/modern-llm-notebook?style=social">
  </a>
  <a href="https://github.com/walkinglabs/modern-llm-notebook/actions/workflows/quality.yml">
    <img alt="Quality checks" src="https://github.com/walkinglabs/modern-llm-notebook/actions/workflows/quality.yml/badge.svg">
  </a>
  <a href="https://github.com/walkinglabs/modern-llm-notebook/blob/main/LICENSE">
    <img alt="License" src="https://img.shields.io/badge/license-CC%20BY--NC--SA%204.0-blue">
  </a>
  <img alt="Python" src="https://img.shields.io/badge/Python-3.9%2B-3776AB">
  <img alt="PyTorch" src="https://img.shields.io/badge/PyTorch-2.0%2B-EE4C2C">
  <img alt="Notebooks" src="https://img.shields.io/badge/Notebooks-27-orange">
  <img alt="Languages" src="https://img.shields.io/badge/Languages-English%20%7C%20Chinese-2ea44f">
</p>

<p align="center">
  <a href="#项目概览">项目概览</a> ·
  <a href="#你会亲手做出什么">你会做出什么</a> ·
  <a href="#为什么做这个项目">为什么做这个项目</a> ·
  <a href="#包含什么">包含什么</a> ·
  <a href="#快速开始">快速开始</a> ·
  <a href="#项目状态">项目状态</a> ·
  <a href="#课程路线">课程路线</a> ·
  <a href="#质量标准">质量标准</a> ·
  <a href="#贡献">贡献</a>
</p>

---

## 项目概览

Modern LLM Notebook 是一套以 Jupyter Notebook 为主线的现代大语言模型课程。它不是把模型当成
黑盒调用，而是用 PyTorch 亲手实现核心组件：Tokenizer、Embedding、Attention、Transformer Block、
训练循环、MoE、LoRA、RLHF、解码、KV Cache、长上下文、VLM、评测、蒸馏和 On-Policy Distillation。

仓库现在同时维护中文与英文两套 Notebook。英文版位于 `notebooks-en/`，覆盖完整 26 章；
网页阅读器在首页和 Notebook 侧边栏都支持语言切换（也可以在 URL 里用 `?lang=en`），课程目录、Notebook 内容和运行输出都按语言展示。

这个项目的定位是**教学型参考实现**。它不是模型权重仓库，不是生产推理框架，也不是托管 API
的封装。它的目标是帮助工程师真正看懂 LLM 内部发生了什么，并且能从第一性原理解释关键设计。

每个 Notebook 都遵循同一个学习契约：

```text
直觉理解 -> 手算验证 -> 代码实现 -> 实验观察
```

这个契约很重要。读者不应该只知道“BPE 会合并高频字符对”或“KV Cache 会加速生成”，而应该能
追踪中间数字，写出最小代码，并解释为什么会出现这种行为。

## 你会亲手做出什么

学完整条路线后，你会拥有一套“小而全”的现代 LLM 系统实现：

| 阶段 | 你会实现 | 为什么重要 |
|:---|:---|:---|
| 文本到 token | 字符级、词级、BPE Tokenizer | 看清原始文本如何进入模型 |
| token 到向量 | Token Embedding、Position Encoding | 理解模型到底在计算什么 |
| Transformer 核心 | Self-Attention、Multi-Head Attention、Transformer Block、Mini-GPT | 亲手还原核心 forward pass |
| 训练系统 | Cross-Entropy、batch、梯度流动、Scaling Laws 直觉 | 把 loss 曲线和模型行为连接起来 |
| 适配与对齐 | LoRA、CPT、Reward Model、PPO/DPO 风格目标 | 理解 base model 如何变成 assistant |
| 推理系统 | Sampling、Beam Search、KV Cache、Speculative Decoding | 明白为什么推理是系统工程问题 |
| 前沿方向 | 长上下文、CoT 实验、VLM patch embedding 和 cross-attention | 把新论文拆成可运行的小实验 |
| 生产闭环 | 评测、胜率矩阵、蒸馏、OPD | 学会衡量、压缩和改进模型行为 |

```text
raw text -> tokens -> embeddings -> attention -> Transformer -> Mini-GPT
         -> training -> alignment -> inference -> evaluation -> distillation
```

## 为什么做这个项目

LLM 学习资料常见两个极端。

一类资料很严谨，但进入门槛高：公式和论文名先出现，读者还不知道这个概念到底在解决什么问题。
另一类资料很容易跑起来，但封装太重：关键过程藏在一个函数调用后面，读者很难建立真实的系统感。

Modern LLM Notebook 选择中间路线：把现代 LLM 当成一个可以拆解、测试、重建的系统。它不是要
替代论文或生产级框架，而是帮你建立足够扎实的心智模型，让你之后读论文、看源码、用框架时更有判断力。

这个项目适合你，如果你想：

- 从原始文本一路理解到 logits 的完整数据流。
- 不把 GPT 架构当黑盒，亲手搭一个小型 Decoder-only 模型。
- 看懂训练目标、数据质量、Scaling Laws 之间的关系。
- 理解为什么推理系统需要 KV Cache、批处理、显存规划和 Speculative Decoding。
- 把 MoE、长上下文、CoT、VLM、RLHF、DPO、蒸馏等新主题还原成可运行的小实验。

## 包含什么

| 领域 | 主题 | 参考实现 |
|:---|:---|:---|
| 基础组件 | Tokenization、BPE、Embedding、Position Encoding | `CharTokenizer`, `WordTokenizer`, `BPETokenizer`, `TokenEmbedding` |
| Transformer 核心 | Self-Attention、Multi-Head Attention、Transformer Block | `MultiHeadAttention`, `TransformerBlock`, `MiniGPT` |
| 架构优化 | RMSNorm、SwiGLU、RoPE、GQA、QK-Norm、MLA、MoE | `RMSNorm`, `SwiGLU`, `RoPE`, `GroupedQueryAttention`, `MultiHeadLatentAttention`, `MoELayer` |
| 训练 | Loss、优化、Scaling Laws、数据工程、MTP、FIM | 训练循环、梯度累积、MinHash 去重、Multi-Token Prediction、Fill-in-the-Middle |
| 适配与对齐 | LoRA、Reward Model、PPO、DPO | `LoraLinear`, Reward Model loss, PPO clip, DPO loss |
| 推理 | Sampling、Beam Search、KV Cache、Speculative Decoding | Top-k、Top-p、Beam Search、`AttentionWithKVCache` |
| 前沿能力 | 长上下文、推理链、VLM、Sliding Window Attention | RoPE 外推、Self-Consistency、Cross-Attention、Sliding Window mask |
| 生产概念 | 评测、蒸馏、On-Policy Distillation | 胜率矩阵、软标签、KL 估计器 |

## 这个项目不是什么

为了让学习路径保持清晰，这个仓库有意不做几件事：

- 它不是生产级 LLM 框架。
- 它不追求最大吞吐量或分布式训练性能。
- 它不提供预训练模型权重。
- 它不会用 `transformers` 跳过核心实现。
- 它不假设读者已经理解所有术语。

环境里可能会包含 `transformers`、`datasets` 等依赖，用于对照或辅助实验；但核心教学路径会尽量把
算法过程显式写出来。

## 快速开始

### Python Notebook

```bash
git clone https://github.com/walkinglabs/modern-llm-notebook.git
cd modern-llm-notebook

# 创建独立 Python 环境，避免把依赖直接装进系统 Python。
python3 -m venv .venv
source .venv/bin/activate

python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m ipykernel install --user \
  --name modern-llm-notebook \
  --display-name "Python (modern-llm-notebook)"

jupyter notebook notebooks/part1-foundation/01-tokenizer-basics.ipynb
```

如果出现 `jupyter: command not found`，通常是因为还没有激活虚拟环境。先运行：

```bash
source .venv/bin/activate
```

也可以直接调用虚拟环境里的 Jupyter：

```bash
.venv/bin/jupyter notebook notebooks/part1-foundation/01-tokenizer-basics.ipynb
```

语言说明：

- 中文版 Notebook：`notebooks/`
- 英文版 Notebook：`notebooks-en/`（26/26 全量覆盖；编号重排待同步）

推荐环境：

- Python 3.9+
- PyTorch 2.0+
- NumPy、Matplotlib、Jupyter
- 16GB RAM

大部分 Notebook 可以在 CPU 上运行。训练实验较重的章节建议使用 GPU。

### 网页阅读器

仓库里也包含一个 React / Vite 阅读器，可以用更接近课程网站的方式浏览 Notebook。
阅读器直接读取仓库中的 `.ipynb` 原文并在前端渲染，不维护额外的网页内容副本。

```bash
npm install
npm run dev
```

构建并预览静态网站：

```bash
npm run build
npm run preview
```

### 在受限环境中批量执行 Notebook（英文版）

有些沙箱/CI 环境会禁止打开本地 socket，这会导致标准的 Jupyter kernel 协议（以及 `nbclient`、
`nbconvert --execute`）执行失败。为这种场景仓库提供了一个“无 kernel 执行器”，用纯 Python 顺序执行
code cells，并把输出写回到英文版 notebook 文件：

```bash
python scripts/execute_notebooks_en_no_kernel.py
```

## 项目状态

| 模块 | 状态 |
|:---|:---|
| 中文 Notebook | 27/27 完整覆盖 |
| 英文 Notebook | 26/26 全量覆盖；编号重排待同步 |
| 网页阅读器 | React / Vite，支持首页和侧边栏语言切换 |
| 静态站点 | 通过 GitHub Pages 发布 |
| 质量检查 | 英文覆盖、语法、输出语言、网页构建 |
| 下一步重点 | 结合 CS336/CME295 深化内容、润色讲解、补齐可复现预训练流程、完善 eval benchmark |

### 近期路线图

1. 结合 CS336 和 CME295 补充内容，尤其是数据、训练、系统和评测部分。
2. 润色现有 Notebook 的内容流畅度，让讲解从直觉、手算到代码更自然。
3. 参考 SmolLM 的预训练过程，补一条从 0 到 1 可复现的小模型预训练流程。
4. 完善 eval benchmark 的细致程度，包括 benchmark 设计、指标、judge prompt、结果聚合和失败案例分析。

## 课程路线

课程分为 5 个部分，共 27 个自包含 Notebook。

```text
Modern LLM Notebook
│
├── Part 1: Foundation
│   ├── 文本与 Tokenizer
│   ├── BPE 子词词表
│   ├── Token Embedding 与分布式表示
│   ├── 位置编码
│   ├── Self-Attention 与 Transformer Block
│   ├── Mini-GPT
│   └── BERT Encoder
│
├── Part 2: Training
│   ├── 现代架构演进
│   ├── 模型配置
│   ├── 稀疏专家模型（MoE）
│   ├── 训练循环与损失函数
│   ├── 缩放定律
│   ├── 分布式训练
│   ├── 预训练数据工程
│   ├── LoRA
│   ├── 函数调用与工具使用
│   └── RLHF 与偏好对齐
│
├── Part 3: Inference
│   ├── 解码策略
│   ├── 推理加速
│   ├── 模型量化
│   └── 投机解码
│
├── Part 4: Frontiers
│   ├── 长上下文
│   ├── 推理链与 CoT
│   └── 视觉语言模型
│
└── Part 5: Production
    ├── 评测方法论
    ├── 知识蒸馏
    ├── 在线策略蒸馏（OPD）
    └── 模型部署
```

每个 Notebook 都尽量自包含。你可以顺序学习，也可以直接跳到感兴趣的主题，不依赖前面 Notebook
的运行时状态。

## Notebook 目录

### Part 1: Foundation

| # | Notebook | 核心问题 | 实现重点 |
|:---:|:---|:---|:---|
| 01 | [文本与 Tokenizer](notebooks/part1-foundation/01-tokenizer-basics.ipynb) | 模型为什么需要 Tokenizer？ | 字符级和词级 Tokenizer |
| 02 | [BPE：子词词表学习](notebooks/part1-foundation/02-bpe-tokenizer.ipynb) | BPE 如何从语料里学习词表？ | Merge rules、encode、decode |
| 03 | [Token Embedding 与分布式表示](notebooks/part1-foundation/03-embedding.ipynb) | Token ID 如何变成向量？ | Token Embedding、分布式表示 |
| 04 | [位置编码](notebooks/part1-foundation/04-position-encoding.ipynb) | 模型如何感知词的顺序？ | 正弦位置编码、输入组装 |
| 05 | [Self-Attention 与 Transformer Block](notebooks/part1-foundation/05-transformer-block.ipynb) | Attention 如何搬运上下文信息？ | MHA、残差、归一化 |
| 06 | [Mini-GPT](notebooks/part1-foundation/06-mini-gpt.ipynb) | GPT 风格模型如何组装起来？ | Decoder-only 模型、LM head |
| 07 | [BERT 编码器](notebooks/part1-foundation/07-bert-encoder.ipynb) | Encoder-only 模型为什么能双向读文本？ | MiniBERT、MLM head |

### Part 2: Training

| # | Notebook | 核心问题 | 实现重点 |
|:---:|:---|:---|:---|
| 08 | [现代架构演进](notebooks/part2-training/08-gpt2-to-modern-models.ipynb) | GPT-2 之后，现代模型在架构上改了什么？ | RMSNorm、SwiGLU、RoPE、GQA、QK-Norm、MLA |
| 09 | [模型配置](notebooks/part2-training/09-model-config.ipynb) | 真实模型的 config.json 里每个字段是什么意思？ | vocab_size、hidden_size、layers、heads |
| 10 | [稀疏专家模型（MoE）](notebooks/part2-training/10-moe.ipynb) | 稀疏专家路由如何工作？ | Router gate、top-k experts、无辅助 loss 负载均衡 |
| 11 | [训练循环与损失函数](notebooks/part2-training/11-training-loss.ipynb) | 语言模型如何从预测错误中学习？ | 训练循环、loss、梯度、Multi-Token Prediction |
| 12 | [缩放定律](notebooks/part2-training/12-scaling-laws.ipynb) | 模型大小、数据量和算力如何权衡？ | FLOPs 估算、Chinchilla 直觉 |
| 13 | [分布式训练](notebooks/part2-training/13-distributed-training.ipynb) | 多卡如何切分显存与计算？ | DDP、ZeRO Stage 1/2/3、FSDP、DeepSpeed、Accelerate |
| 14 | [预训练数据工程](notebooks/part2-training/14-data-engineering.ipynb) | 为什么数据质量会主导模型行为？ | 清洗、过滤、MinHash、FIM |
| 15 | [LoRA](notebooks/part2-training/15-lora.ipynb) | 低秩适配为什么有效？ | `LoraLinear`、merge 推理 |
| 16 | [函数调用与工具使用](notebooks/part2-training/16-function-calling.ipynb) | 模型如何调用外部工具？ | 结构化输出、Tool 调用、训练数据构造 |
| 17 | [RLHF 与偏好对齐](notebooks/part2-training/17-rlhf-alignment.ipynb) | 偏好信号如何变成优化目标？ | Reward Model、PPO、DPO |

### Part 3: Inference

| # | Notebook | 核心问题 | 实现重点 |
|:---:|:---|:---|:---|
| 18 | [解码策略](notebooks/part3-inference/18-generation.ipynb) | 解码策略如何改变模型行为？ | Greedy、top-k、top-p、Beam Search |
| 19 | [推理加速](notebooks/part3-inference/19-inference-acceleration.ipynb) | 生成为什么常常受显存访问限制？ | KV Cache、FlashAttention、PagedAttention |
| 20 | [模型量化](notebooks/part3-inference/20-quantization.ipynb) | 4-bit 量化为什么能保持精度？ | 对称/非对称、per-channel/group、GPTQ、AWQ |
| 21 | [投机解码](notebooks/part3-inference/21-speculative-decoding.ipynb) | 小模型如何加速大模型？ | Draft-then-verify 接受率 |

### Part 4: Frontiers

| # | Notebook | 核心问题 | 实现重点 |
|:---:|:---|:---|:---|
| 22 | [长上下文](notebooks/part4-frontiers/22-long-context.ipynb) | 模型如何扩展到训练长度之外？ | RoPE 外推、YaRN、Sliding Window Attention |
| 23 | [推理链与 CoT](notebooks/part4-frontiers/23-cot-thinking.ipynb) | 推理链为什么能改善答案？ | Self-Consistency、reward 设计 |
| 24 | [视觉语言模型](notebooks/part4-frontiers/24-vlm.ipynb) | 图像信息如何进入语言模型？ | Patch Embedding、Cross-Attention |

### Part 5: Production

| # | Notebook | 核心问题 | 实现重点 |
|:---:|:---|:---|:---|
| 25 | [评测方法论](notebooks/part5-production/25-evaluation.ipynb) | 如何判断一个模型真的更好？ | 胜率矩阵、RAGAS、Judge 指标 |
| 26 | [知识蒸馏](notebooks/part5-production/26-distillation.ipynb) | 小模型如何学习大模型？ | 软标签、temperature、logit distillation |
| 27 | [在线策略蒸馏（OPD）](notebooks/part5-production/27-opd.ipynb) | 蒸馏如何减少 exposure bias？ | OPSD、KL 估计器分类 |
| 28 | [模型部署](notebooks/part5-production/28-llm-deployment.ipynb) | 训练好的模型如何变成可调用的服务？ | vLLM、SGLang、自定义架构注册 |

## 质量标准

这个仓库遵循一组简单标准，确保 Notebook 真正适合作为学习材料：

- 概念先讲动机，再进入符号和公式。
- 新术语先定义，再大量使用。
- 核心算法至少包含一个具体手算例子或 toy example。
- 代码 cell 尽量短小，运行后能看到关键观察。
- 随机实验在合适位置固定 seed。
- 每个 Notebook 自包含，不依赖其他 Notebook 的变量状态。
- Markdown 面向有耐心的初学者，代码仍然贴近真实算法结构。

## 论文与系统

课程会把这些论文和系统中的关键设计拆成可运行的小实验：

| 论文或系统 | 覆盖概念 |
|:---|:---|
| Attention Is All You Need | Multi-Head Attention、Position Encoding |
| BERT | Encoder-only、Masked Language Modeling |
| LLaMA | RMSNorm、SwiGLU、RoPE、Pre-Norm |
| DeepSeek-V2 / DeepSeek-V3 | MLA、Multi-Token Prediction、无辅助 loss MoE 负载均衡 |
| Mixtral / Qwen3 | Sliding Window Attention、带共享专家的 MoE |
| Scaling Laws / Chinchilla | 参数、数据、算力权衡 |
| LoRA | Low-Rank Adaptation |
| RLHF / PPO / DPO | 偏好对齐 |
| Code Llama / DeepSeek-Coder | Fill-in-the-Middle（FIM） |
| FlashAttention / vLLM | 推理加速与显存管理 |
| Speculative Decoding | Draft-then-verify 生成 |
| RoPE / YaRN | 长上下文外推 |
| Chain-of-Thought | 推理链与 Self-Consistency |
| Flamingo / LLaVA | Vision-Language Models |
| Knowledge Distillation / OPD | 压缩与蒸馏 |

## 项目结构

```text
modern-llm-notebook/
├── notebooks/           # 中文源 Notebook
│   ├── part1-foundation/
│   ├── part2-training/
│   ├── part3-inference/
│   ├── part4-frontiers/
│   └── part5-production/
├── notebooks-en/        # 英文镜像 Notebook
│   ├── part1-foundation/
│   ├── part2-training/
│   ├── part3-inference/
│   ├── part4-frontiers/
│   └── part5-production/
├── web/                 # React / Vite 网页阅读器
├── docs/                # 静态网站构建产物
├── scripts/             # Notebook 转换脚本
├── requirements.txt
├── package.json
├── README.md
└── README-CN.md
```

## 贡献

欢迎贡献，尤其是能提升清晰度、正确性或覆盖面的改动。

适合贡献的内容包括：

- 修复解释错误、损坏的 cell 或过时 API。
- 改进手算过程和可视化。
- 增加带 assert 的小练习。
- 改进中英文文档。
- 为重要模型结构或训练方法提出新的 Notebook。

提交 PR 前请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

## Star History

<a href="https://www.star-history.com/#walkinglabs/modern-llm-notebook&Date">
  <picture>
    <source
      media="(prefers-color-scheme: dark)"
      srcset="https://api.star-history.com/svg?repos=walkinglabs/modern-llm-notebook&type=Date&theme=dark"
    >
    <source
      media="(prefers-color-scheme: light)"
      srcset="https://api.star-history.com/svg?repos=walkinglabs/modern-llm-notebook&type=Date"
    >
    <img
      alt="Star history chart"
      src="https://api.star-history.com/svg?repos=walkinglabs/modern-llm-notebook&type=Date"
    >
  </picture>
</a>

## 引用

如果 Modern LLM Notebook 对您的研究或工作有所帮助，欢迎引用：

```bibtex
@misc{modern-llm-notebook,
  title   = {Modern LLM Notebook: Build Modern LLMs from Scratch},
  author  = {WalkingLabs},
  year    = {2025},
  url     = {https://github.com/walkinglabs/modern-llm-notebook},
  note    = {GitHub repository, accessed 2026}
}
```

## 许可证

本项目采用
[Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License](LICENSE)
协议发布。

---

<p align="center">
  <sub>
    为想从内部理解 LLM 系统的工程师而构建。
    <br>
    由 <a href="https://github.com/walkinglabs">walkinglabs</a> 维护。
  </sub>
</p>
