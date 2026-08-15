# Modern LLM Notebook 课程大纲

更新日期：2026-06-23

Part 总数：5
Notebook 总数：31

---

## Part 1 · Foundation（基础零件）

### 01-tokenizer-basics.ipynb — 文本与 Tokenizer


- 本节要点
- 1. Token 和 Tokenizer
- 2. 字符级 Tokenizer
- 3. 词级 Tokenizer
- 4. 子词级 Tokenizer
- 小结
- 作业


### 02-bpe-tokenizer.ipynb — BPE：子词词表学习


- 1. BPE 快速体验
- 2. 对比 GPT-2 的真实 Tokenizer
- 3. 工业级 BPE 的关键设计
- 4. 训练真实 Tokenizer
- 小结
- 作业
- 附录：一步步还原 BPE 原理


### 03-embedding.ipynb — Token Embedding 与分布式表示


- 1. 从编号到向量
- 2. Embedding 查表
- 3. 工业界的 Embedding 训练实践
- 小结
- 作业
- 参考资料


### 04-position-encoding.ipynb — 位置编码


- 1. 为什么需要位置信息
- 2. 正弦位置编码
- 3. 组装：Token Embedding + Position Encoding
- 附录：Embedding 的缩放惯例
- 附录：Batch 维度
- 小结
- 作业
- 参考资料
- 附录：正弦位置编码的外推能力


### 05-transformer-block.ipynb — Self-Attention 与 Transformer Block


- 本节要点
- 1. Attention 的直觉
- 2. Scaled Dot-Product Attention
- 3. 因果遮蔽
- 4. 多头注意力
- 5. FFN：看完上下文之后怎么加工信息
- 6. Transformer Block 的组装
- 小结
- 附录：RNN 与 Transformer 对比
- 作业
- 参考资料


### 06-mini-gpt.ipynb — 从零实现 GPT


- 从零实现 MiniGPT
- nanoGPT：从教学版到工程实现
- 小结
- 作业
- 参考资料


### 07-bert-encoder.ipynb — BERT 编码器


- 1. 原始 Transformer：Encoder + Decoder
- 2. Encoder 与 Decoder
- 3. BERT 的输入表示
- 4. MLM 预训练
- 5. MLM 训练演示
- 6. BERT 的微调范式
- 7. 真实 BERT 加载演示
- 8. BERT 与 GPT 对比
- 小结
- 作业

---


## Part 2 · Training（训练）

### 08-gpt2-to-modern-models.ipynb — 现代语言模型架构演进


- Decoder-Only 架构
- 教学版 Transformer Block
- 组件升级
- 旋转位置编码 RoPE
- 现代 LLaMA-style Block
- 多头注意力
- 三代 Block 演进
- 小结
- 作业


### 09-model-config.ipynb — 读懂大模型的配置文件


- 仓库文件地图：一张表看懂 HuggingFace 仓库
- config.json：把结构参数变成 PyTorch 模块
- tokenizer_config.json：控制文本怎么被翻译成数字
- generation_config.json：控制模型怎么说话
- 三张表串起来：一个请求的完整旅程
- 小结
- 作业
- 参考资料


### 10-training-loss.ipynb — 完成第一次预训练与微调


- 0. 先建立直觉：Trainer 到底帮你省了什么？
- 1. 一条文本样本如何变成训练样本？
- 2. Chat Template 为什么会影响 loss？
- 3. 手算 Cross-Entropy：loss 到底怎么算？
- 4. 一个 batch 进入模型后发生了什么？
- 5. 模型 forward：为什么 labels 可以直接传给 model？
- 6. 实现一个迷你 Trainer：工业库的核心骨架
- 7. 把迷你 Trainer 映射到 Hugging Face Transformers
- 8. 把同一条链路映射到 ModelScope ms-swift
- 9. 工业训练 loop 的完整流程图
- 10. 一个容易混淆的问题：模型内部 shift 还是数据里 shift？
- 11. 作业
- 小结（checklist）


### 11-mla-kv-cache.ipynb — KV Cache 及架构演进


- 本节要点
- 1. 生成时到底在重复计算什么（代码验证历史 K 不变）
- 2. 第一代方案：少存几份 K/V（MQA 与 GQA）
- 3. 第二代方案：不存 K/V，存压缩向量（MLA）
- 4. 从零实现简化 MLA
- 5. 实验：三代方案放在一起比
- 6. 绕不开的麻烦：RoPE（decoupled RoPE）
- 7. 谁在用：MLA 的工程现状
- 小结
- 作业

---


### 12-distributed-training.ipynb — 分布式训练：工业界的标准工具链


- 1. 先算一笔账：单卡为什么不够
- 2. ZeRO：把冗余切到多卡
- 3. Accelerate：一份训练脚本，切换所有后端
- 4. ZeRO 的常用参数：显存不够时动哪几个旋钮
- 5. Megatron-LM：预训练大模型的重型武器
- 6. 微调时代的标配装备
- 小结
- 作业
- 参考资料


### 13-moe.ipynb — 从 dense 到 MoE 架构


- 1. 普通 Transformer 的 FFN 层
- 2. MoE 的核心思想
- 3. MoE 的参数 vs 计算量
- 4. MoE 的训练难题：负载均衡
- 5. MoE 的推理难题：所有专家都要加载
- 6. 著名的 MoE 模型
- 7. 为什么 MoE 有效：参数和计算的分离
- 8. MoE 的进阶话题
- 小结
- 作业> 可以让 AI 帮忙解释思路，但不建议直接让 AI "做完这道题"。


### 14-scaling-laws.ipynb — 缩放定律


- 上半场：缩放定律
- 1. 幂律分布
- 2. Kaplan 缩放定律（OpenAI, 2020）— 「优先增大模型」
- 3. Chinchilla 缩放定律（DeepMind, 2022）— 「模型和数据同样重要」
- 4. 后 Chinchilla 时代：过度训练反而更好
- 5. µP：最大更新参数化
- 下半场：资源估算
- 6. FLOPs 估算
- 7. 显存估算
- 8. 缩放定律三次范式转变总结
- 小结
- 作业> 可以让 AI 帮忙解释思路，但不建议直接让 AI "做完这道题"。


### 15-data-engineering.ipynb — LLM 数据工程


- 0. 数据 Pipeline 总览
- 1. 文本提取：从 HTML 里提取正文
- 2. 质量过滤
- 3. 去重
- 4. 数据混合
- 5. 完整 Pipeline 实战：为一个 1B 模型准备数据
- 6. 数据质量 > 数量
- 7. 工业案例和工具地图
- 8. 从 Tokenize 到训练流
- 9. 后训练数据：从真实标注到合成数据
- 小结
- 作业


### 16-lora.ipynb — LoRA 低秩微调


- 1. 全量微调的成本
- 2. 低秩权重更新
- 3. LoRA 的前向传播
- 4. LoraLinear 实现
- 5. LoRA 的验证
- 6. 接入 MiniGPT：给 Attention 装 LoRA
- 7. 训练演示：用 LoRA 做 SFT
- 8. 推理时合并权重
- 9. 实践要点总结
- 10. QLoRA
- 11. 模型合并
- 小结
- 作业> 可以让 AI 帮忙解释思路，但不建议直接让 AI "做完这道题"。


### 17-distillation.ipynb — 从大模型到小模型：知识蒸馏


- 1. 蒸馏的本质
- 2. 方法一：Logit 蒸馏（最经典）
- 3. 方法二：数据蒸馏（最容易落地）
- 4. 方法三：特征蒸馏（进阶）
- 5. 实战：蒸馏 7B 模型
- 6. 蒸馏与 OPD 对比
- 7. 蒸馏的常见问题
- 小结
- 作业


### 18-function-calling.ipynb — 从对话到工具：函数调用


- 本节要点
- 1. 为什么需要 Function Call
- 2. Function Call 的完整流程
- 3. 多工具场景
- 4. 训练一个支持 Function Call 的模型
- 5. 错误处理与失败模式
- 6. 现代实践：从 Function Call 到标准化工具调用
- 小结
- 作业


### 19-rlhf-alignment.ipynb — 从偏好到对齐：RLHF


- 1. 为什么需要对齐
- 2. 对齐全景图
- 3. Stage 1：SFT
- 4. Stage 2：Reward Model
- 5. Stage 3：PPO
- 6. DPO
- 7. RLHF vs DPO 对比
- 8. LLaMA 2 的完整对齐流程
- 9. 对齐的局限性与适用场景
- 小结
- 作业> 可以让 AI 帮忙解释思路，但不建议直接让 AI "做完这道题"。


## Part 3 · Inference（推理）

### 20-generation.ipynb — 解码策略


- 1. 推理和训练的根本区别
- 2. 训练一个能看到效果的模型
- 3. Greedy Decoding
- 4. Temperature：控制随机性
- 5. 采样截断：Top-k 和 Top-p
- 6. Beam Search
- 7. Repetition Penalty
- 8. 对话模板与 System Prompt
- 9. 完整生成 Pipeline
- 小结
- 作业
- 参考资料


### 21-inference-acceleration.ipynb — 推理加速


- 1. 推理慢的根源
- 2. KV Cache
- 3. KV Cache 的内存开销
- 4. MHA、MQA、GQA：少存一点 K/V
- 5. 模型量化：用更少的位存储权重
- 6. GGUF 格式详解
- 7. PagedAttention (vLLM)
- 8. FlashAttention
- 9. 推理的两阶段：Prefill vs Decode
- 10. Continuous Batching
- 11. 加速手段总结
- 小结
- 作业
- 参考资料


### 22-quantization.ipynb — 模型量化


- 1. 对称量化的回顾与局限
- 2. 非对称量化：引入 zero point
- 3. 量化粒度：per-tensor / per-channel / per-group
- 4. Activation 量化的难点：outlier channels
- 5. GPTQ 的直觉：用二阶信息补偿误差
- 6. AWQ 的直觉：保护重要通道
- 7. 主流量化方案对比
- 小结
- 作业
- 参考资料


### 23-speculative-decoding.ipynb — 投机解码机制


- 1. 自回归生成的串行瓶颈
- 2. 投机解码的完整流程
- 3. 接受与拒绝的判定
- 4. 多次实验：实际接受率
- 5. 实现 Draft 和 Target 模型
- 6. 投机解码的完整实现
- 7. 加速比分析
- 8. 加速比可视化
- 9. 投机解码的变体
- 10. 适用场景分析
- 小结
- 作业
- 参考资料


### 24-inference-systems.ipynb — 现代推理系统


- 1. 服务指标：吞吐、延迟、并发
- 2. KV Cache 碎片问题
- 3. PagedAttention：把 OS 分页搬到 KV Cache
- 4. Continuous batching：动态拼 batch
- 5. Prefix caching：相同前缀的 KV Cache 复用
- 6. Prefill / Decode 分离
- 7. 主流推理引擎横评
- 小结
- 作业

---


### 25-evaluation.ipynb — 评测方法论


- 1. 评测全景
- 2. 核心评测框架 & Repo 推荐
- 3. OpenAI-Compatible API 评测实战
- 4. LLM-as-Judge：用 强模型当裁判
- 5. 评测结果的汇总与对比
- 6. AlpacaEval 实战
- 7. 专项评测
- 8. LLM-as-Judge 的偏差与一致性
- 9. 评测指标体系
- 10. 常见坑与最佳实践
- 11. 实战速查
- 小结
- 作业


### 26-llm-deployment.ipynb — 模型部署与服务化


- 1. 为什么不直接用 HuggingFace transformers
- 2. PagedAttention 与 RadixAttention：两种 KV Cache 管理思路
- 3. 准备模型：Qwen2.5-0.6B
- 4. vLLM 离线推理：LLM 类
- 5. vLLM 启动 OpenAI 兼容服务
- 6. 用 SGLang 部署同一个模型
- 7. vLLM 与 SGLang 选型
- 8. 部署自训练模型：核心障碍
- 9. 路径 A：通过 transformers 注册
- 10. 路径 B：在 vLLM 内部直接注册
- 11. 自定义词表
- 12. 端到端：把 MiniGPT 部署起来
- 小结
- 作业

---


## Part 4 · Frontiers（前沿）

### 27-long-context.ipynb — 长上下文


- 1. 什么是外推
- 2. 位置编码回顾
- 3. 三种位置编码的外推能力
- 4. RoPE：用旋转编码相对位置
- 5. 从二维推广到 d 维
- 6. 直接外推为什么失败
- 7. 核心思想：控制角度范围
- 8. 方法一：Position Interpolation
- 9. 方法二：NTK-aware
- 10. 方法三：YaRN
- 11. 三大方法一句话总结
- 12. 长上下文的验证方法
- 13. 工程真相：长上下文不只是算法问题
- 14. 实战：4K 扩展到 32K
- 15. 实战：ModelScope + NTK 扩展
- 小结
- 作业> 可以让 AI 帮忙解释思路，但不建议直接让 AI "做完这道题"。


### 28-cot-thinking.ipynb — 推理链与 CoT


- 1. LLM 的推理缺陷
- 2. Chain-of-Thought（CoT）
- 3. 从 CoT 到 Thinking 模型
- 4. Thinking 模型的训练方法
- 5. 训练自己的 Thinking 模型
- 6. Thinking 模型的「啊哈时刻」
- 7. Thinking 模型的局限性
- 8. 主流 Thinking 模型对比
- 9. 实操：启动与切换 Thinking 模式
- 10. 实战：训练 Thinking 模型
- 11. 另一条路：不训练模型，只在推理时多花算力
- 小结
- 作业> 可以让 AI 帮忙解释思路，但不建议直接让 AI "做完这道题"。


### 29-vlm.ipynb — 视觉语言模型（VLM）


- 1. LLM 为什么不能直接读图片？
- 2. Patchify：先把图片切成小块
- 3. Patch Embedding：再把小块变成向量
- 4. 视觉 token 怎么和文本 token 融合？
- 5. 还差一个 Projector：把视觉空间翻译到语言空间
- 6. 三种主流 VLM 架构
- 7. 图片为什么很“贵”？
- 8. 训练 VLM：为什么要冻结？
- 9. 工程细节：特殊 token、位置编码、多分辨率
- 10. 极简 VLM 实现
- 小结
- 作业


### 30-efficient-attention.ipynb — 高效 Attention：O(N²) 问题的两条路线


- 1. $O(N^2)$ 瓶颈：手算 attention 计算量
- 2. 路线 A：Linear Attention（换计算顺序）
- 3. 路线 B：Sparse Attention（保留 softmax，少算对）
- 4. 两条路线的横向对比
- 5. Hybrid 架构：linear + softmax 混合
- 小结
- 作业

---


### 31-opd.ipynb — 在线策略蒸馏（OPD）


- 模型输出分布
- SFT：向外部数据分布模仿
- RL：在自身行为中筛选高价值方向
- OPD：在自身轨迹上接受教师纠偏
- 三者核心区别
- 1. 知识蒸馏回顾
- 2. 四种训练方式对比
- 3. 问题根源：Exposure Bias（暴露偏差）
- 4. OPD 的解决方案：在自己的轨迹上学习
- 5. 数学本质：Forward KL vs Reverse KL
- 6. OPSD：不需要外部 Teacher 的 OPD
- 7. 三种信号粒度：老师告诉你多少信息
- 8. 当只能用 sampled-token：KL 估计器
- 9. 完整 OPD 训练流程（串起来）
- 10. OPD 为什么现在才火
- 11. 论文速览（截至 2026-05）
- 12. 论文全景：怎么分类看 OPD
- 13. 分类维度：从两个角度理解 OPD 生态
- 14. OPD 的工业落地
- 15. 从训练到上线：模型格式与部署工具
- 小结
- 作业> 可以让 AI 帮忙解释思路，但不建议直接让 AI "做完这道题"。

