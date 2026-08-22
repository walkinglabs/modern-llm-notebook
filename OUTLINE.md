# Modern LLM Notebook 课程大纲

更新日期：2026-08-22

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


### 10-training-loss.ipynb — 语言模型的预训练与微调


- 最小训练样本与右移一位的标签
- Token 级 Cross-Entropy Loss 与 Batch 训练
- MiniGPT 的完整训练循环与 loss 曲线
- 梯度、Gradient Clipping 与 Gradient Accumulation
- Chat Template、多轮对话与 Loss Mask
- Warmup、Muon 与 Multi-Token Prediction
- 小结与作业


### 10a-training-frameworks-and-optimizers.ipynb — 训练框架与优化器


- 训练样本、Chat Template、Batch 与 Padding
- 迷你 Trainer 与完整参数更新
- Adam、AdamW、Gradient Clipping 与 Muon
- Lion、Shampoo 与 SOAP
- Hugging Face Transformers 与 ModelScope SWIFT
- Perplexity、Entropy、KL Divergence 与标签偏移
- 小结与作业


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


- 1. 从 Logits 到概率
- 2. Greedy 解码
- 3. Temperature 与分布形状
- 4. Top-k 与 Top-p 截断
- 5. Repetition Penalty
- 6. Beam Search
- 7. 一次完整的采样流程
- 8. 常用生成参数
- 小结
- 作业

### 21-inference-acceleration.ipynb — LLM 推理的计算与显存开销


- 1. Prefill 与 Decode
- 2. 重复计算的问题
- 3. KV Cache 的原理
- 4. KV Cache 的显存开销
- 5. MHA、GQA 与 MQA
- 6. Decode 的带宽瓶颈
- 小结
- 作业

### 22-quantization.ipynb — 大语言模型低比特量化


- 1. 模型大小与精度
- 2. 从浮点到 INT4
- 3. 量化粒度
- 4. 权重与 Activation
- 5. GPTQ、AWQ 与 SmoothQuant
- 6. PTQ、QAT、FP8 与 KV Cache 量化
- 7. 量化方案的选择
- 小结
- 作业

### 23-speculative-decoding.ipynb — 投机解码


- 1. 自回归的串行瓶颈
- 2. 投机解码的基本流程
- 3. 接受与校正规则
- 4. 投机解码的完整实现
- 5. 加速比分析
- 6. 分布一致性实验
- 7. 投机解码的变体
- 小结
- 作业

### 24-inference-systems.ipynb — 现代 LLM 推理系统


- 1. 吞吐、TTFT 与 TPOT
- 2. 从 Static Batching 到 Continuous Batching
- 3. PagedAttention 与 KV Cache 分页
- 4. Prefix Caching 与 RadixAttention
- 5. Chunked Prefill
- 6. Prefill / Decode 分离
- 7. FlashAttention、FlashInfer 与 CUDA Graph
- 8. TP、PP、DP、EP 与 CP
- 9. 术语地图
- 小结
- 作业

### 25-evaluation.ipynb — 评测方法论


- 1. 评测流水线
- 2. 评测对象的分类
- 3. Benchmark 与 Metric
- 4. LLM-as-Judge 的偏差
- 5. 置信区间
- 6. 最小评测流水线实战
- 7. 评测工具地图
- 8. 上线前的最小对比
- 小结
- 作业

### 26-llm-deployment.ipynb — 模型部署与服务化


- 1. 从 Checkpoint 到 Serving Engine
- 2. vLLM 的最小启动
- 3. 健康检查与第一次请求
- 4. 流式输出
- 5. 测量 TTFT 与 TPOT
- 6. 用 SGLang 部署同一个模型
- 7. 启动参数与原理对照
- 8. 常见问题排查
- 9. 最小 Benchmark
- 10. 部署视角的 PD 分离
- 11. 招聘 JD 解读
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


### 28-cot-thinking.ipynb — 推理模型与推理时计算


- 1. 从语言模型到推理模型
- 2. R1-Zero：纯强化学习推理
- 3. Test-Time Scaling
- 4. Hybrid Thinking 与预算控制
- 5. 自适应思考
- 6. 推理链的展示与对齐
- 7. 实操：训练自己的 Thinking 模型
- 8. 推理时搜索：ToT、PRM 与自我修正
- 小结
- 作业> 可以让 AI 帮忙解释思路，但不建议直接让 AI "做完这道题"。
- 参考资料


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
