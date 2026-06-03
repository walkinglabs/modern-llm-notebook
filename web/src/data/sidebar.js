export const PATH_STEPS = [
  { num: "01", title: "基础", titleEn: "Foundation", desc: "理解 LLM 的基本概念与核心组件", descEn: "Core concepts and building blocks of LLMs", section: "foundation" },
  { num: "02", title: "训练", titleEn: "Training", desc: "深入训练系统、对齐与优化方法", descEn: "Training systems, alignment, and optimization", section: "training" },
  { num: "03", title: "推理", titleEn: "Inference", desc: "生成策略、推理加速与投机解码", descEn: "Decoding strategies, acceleration, and speculative decoding", section: "inference" },
  { num: "04", title: "前沿", titleEn: "Frontiers", desc: "长上下文、CoT 思维链与 VLM", descEn: "Long context, chain-of-thought, and VLM", section: "frontiers" },
  { num: "05", title: "评测与部署", titleEn: "Eval & Deploy", desc: "模型评测、蒸馏与生产部署", descEn: "Evaluation, distillation, and production deployment", section: "production" },
]

export const RUNNABLE_NOTEBOOKS = [
  { id: "nb-1", lessonId: "01-tokenizer-basics", title: "Tokenizer 基础", titleEn: "Tokenizer Basics", desc: "了解分词原理与实现", descEn: "Understand tokenization principles", section: "foundation", duration: 12 },
  { id: "nb-2", lessonId: "05-transformer-block", title: "Attention 与 Transformer", titleEn: "Attention & Transformer", desc: "从零实现注意力机制", descEn: "Build attention from scratch", section: "foundation", duration: 18 },
  { id: "nb-3", lessonId: "10-moe", title: "MoE 混合专家", titleEn: "Mixture of Experts", desc: "稀疏激活与专家路由", descEn: "Sparse activation and expert routing", section: "training", duration: 20 },
  { id: "nb-4", lessonId: "11-training-loss", title: "训练与 Loss", titleEn: "Training & Loss", desc: "理解训练循环与优化", descEn: "Training loops and optimization", section: "training", duration: 25 },
  { id: "nb-5", lessonId: "06-mini-gpt", title: "实现自己的第一个 LLM", titleEn: "Build Your First LLM", desc: "从零搭建 Mini-GPT", descEn: "Build Mini-GPT from scratch", section: "foundation", duration: 45 },
  { id: "nb-6", lessonId: "14-lora", title: "LoRA", titleEn: "LoRA", desc: "参数高效微调方法", descEn: "Parameter-efficient fine-tuning", section: "training", duration: 20 },
  { id: "nb-7", lessonId: "17-generation", title: "生成策略", titleEn: "Generation Strategies", desc: "贪心、采样与束搜索", descEn: "Greedy, sampling, and beam search", section: "inference", duration: 18 },
  { id: "nb-8", lessonId: "21-cot-thinking", title: "CoT 思维链", titleEn: "Chain-of-Thought", desc: "链式推理的机制", descEn: "Mechanics of chain reasoning", section: "frontiers", duration: 16 },
  { id: "nb-9", lessonId: "16-rlhf-alignment", title: "RLHF 对齐", titleEn: "RLHF Alignment", desc: "人类反馈强化学习", descEn: "Reinforcement learning from human feedback", section: "training", duration: 36 },
  { id: "nb-10", lessonId: "24-distillation", title: "知识蒸馏", titleEn: "Knowledge Distillation", desc: "模型压缩与传递", descEn: "Model compression and knowledge transfer", section: "production", duration: 20 },
  { id: "nb-11", lessonId: "26-rag", title: "RAG 检索增强生成", titleEn: "Retrieval-Augmented Generation", desc: "从零实现检索增强生成", descEn: "Build RAG from scratch", section: "production", duration: 25 },
]
