export const PATH_STEPS = [
  { num: "01", title: "基础", titleEn: "Foundation", desc: "理解 LLM 的基本概念与核心组件", descEn: "Core concepts and building blocks of LLMs", section: "foundation" },
  { num: "02", title: "训练", titleEn: "Training", desc: "架构、训练系统、蒸馏与对齐方法", descEn: "Architectures, training systems, distillation, and alignment", section: "training" },
  { num: "03", title: "推理", titleEn: "Inference", desc: "生成、加速、评测与部署", descEn: "Generation, acceleration, evaluation, and deployment", section: "inference" },
  { num: "04", title: "前沿", titleEn: "Frontiers", desc: "长上下文、CoT、VLM 与高效注意力", descEn: "Long context, CoT, VLM, and efficient attention", section: "frontiers" },
]

export const RUNNABLE_NOTEBOOKS = [
  { id: "nb-1", lessonId: "01-tokenizer-basics", title: "Tokenizer 基础", titleEn: "Tokenizer Basics", desc: "了解分词原理与实现", descEn: "Understand tokenization principles", section: "foundation", duration: 12 },
  { id: "nb-2", lessonId: "05-transformer-block", title: "Attention 与 Transformer", titleEn: "Attention & Transformer", desc: "从零实现注意力机制", descEn: "Build attention from scratch", section: "foundation", duration: 18 },
  { id: "nb-3", lessonId: "13-moe", title: "从 dense 到 MoE 架构", titleEn: "From Dense to MoE Architectures", desc: "稀疏激活与专家路由", descEn: "Sparse activation and expert routing", section: "training", duration: 20 },
  { id: "nb-4", lessonId: "10-training-loss", title: "语言模型的预训练与微调", titleEn: "Language Model Pretraining & Fine-tuning", desc: "完成 MiniGPT 的完整训练", descEn: "Train MiniGPT end to end", section: "training", duration: 45 },
  { id: "nb-5", lessonId: "06-mini-gpt", title: "实现自己的第一个 LLM", titleEn: "Build Your First LLM", desc: "从零搭建 Mini-GPT", descEn: "Build Mini-GPT from scratch", section: "foundation", duration: 45 },
  { id: "nb-6", lessonId: "16-lora", title: "LoRA 低秩微调", titleEn: "LoRA", desc: "参数高效微调方法", descEn: "Parameter-efficient fine-tuning", section: "training", duration: 20 },
  { id: "nb-7", lessonId: "20-generation", title: "生成策略", titleEn: "Generation Strategies", desc: "贪心、采样与束搜索", descEn: "Greedy, sampling, and beam search", section: "inference", duration: 18 },
  { id: "nb-8", lessonId: "28-cot-thinking", title: "CoT 思维链", titleEn: "Chain-of-Thought", desc: "链式推理的机制", descEn: "Mechanics of chain reasoning", section: "frontiers", duration: 16 },
  { id: "nb-9", lessonId: "19-rlhf-alignment", title: "从偏好到对齐：RLHF", titleEn: "From Preferences to Alignment: RLHF", desc: "人类反馈强化学习", descEn: "Reinforcement learning from human feedback", section: "training", duration: 36 },
  { id: "nb-10", lessonId: "17-distillation", title: "从大模型到小模型：知识蒸馏", titleEn: "From Large to Small: Knowledge Distillation", desc: "模型压缩与传递", descEn: "Model compression and knowledge transfer", section: "training", duration: 20 },
  { id: "nb-11", lessonId: "26-llm-deployment", title: "vLLM 与 SGLang 部署", titleEn: "vLLM & SGLang Deployment", desc: "从现成模型到自训练模型的部署", descEn: "Deploy off-the-shelf and custom-trained models", section: "inference", duration: 35 },
]
