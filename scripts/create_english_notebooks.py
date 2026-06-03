#!/usr/bin/env python3
"""Create the English notebook set from the Chinese source notebooks.

The English edition keeps the same executable code structure, clears stale
Chinese outputs, and replaces reader-facing prose with English teaching notes.
"""

import io
import json
import re
import tokenize
from pathlib import Path


REPO = Path(__file__).resolve().parent.parent
SOURCE_DIR = REPO / "notebooks"
TARGET_DIR = REPO / "notebooks-en"

PARTS = {
    "part1-foundation": "Foundation",
    "part2-training": "Training Systems",
    "part3-inference": "Inference",
    "part4-frontiers": "Frontiers",
    "part5-production": "Evaluation & Deployment",
}

PHRASE_MAP = {
    "助手": "assistant",
    "用户": "user",
    "老师": "teacher",
    "喜欢": "like",
    "讨厌": "dislike",
    "不知道": "do not know",
    "可以": "can",
    "不错": "nice",
    "谢谢": "thanks",
    "再见": "goodbye",
    "你好": "hello",
    "天气": "weather",
    "今天": "today",
    "星期": "weekday",
    "英语": "English",
    "数学": "math",
    "编程": "programming",
    "代码": "code",
    "答案": "answer",
    "动物": "animal",
    "动作": "action",
    "介词": "preposition",
    "冠词": "article",
    "物品": "object",
    "特殊": "special",
    "保守混合": "conservative mix",
    "均衡混合": "balanced mix",
    "激进混合": "aggressive mix",
    "不切换": "no switch",
    "巴黎": "Paris",
    "伦敦": "London",
    "柏林": "Berlin",
    "罗马": "Rome",
    "马德里": "Madrid",
    "苹果": "apple",
    "橘子": "orange",
    "吃": "eat",
    "推理": "reasoning",
    "过程": "process",
    "小明": "Ming",
    "小红": "Hong",
    "小刚": "Gang",
    "原文": "Original text",
    "结果": "Result",
    "输入": "Input",
    "输出": "Output",
    "模型": "Model",
    "说明": "Note",
    "正确": "correct",
    "错误": "wrong",
}

SUBSTRING_MAP = [
    ("词表大小", "Vocabulary size"),
    ("词表内容", "Vocabulary items"),
    ("Token 数量", "Number of tokens"),
    ("训练数据形状", "Training data shape"),
    ("训练完成", "Training finished"),
    ("定义完成", "Definition complete"),
    ("生成结果", "Generated result"),
    ("期望输出", "Expected output"),
    ("关键区别", "Key difference"),
    ("关键优势", "Key advantages"),
    ("关键问题", "Key problem"),
    ("关键洞察", "Key insight"),
    ("对比分析", "Comparison"),
    ("投票环节", "Voting step"),
    ("新增符号", "New symbols"),
    ("训练样本", "Training sample"),
    ("训练 ID", "Training IDs"),
    ("概率分布", "Probability distribution"),
    ("执行顺序", "Execution order"),
    ("完整实现", "Complete implementation"),
    ("策略 A", "Strategy A"),
    ("策略 B", "Strategy B"),
    ("策略 C", "Strategy C"),
    ("总结", "Summary"),
    ("实际训练中怎么选", "How to choose in real training"),
    ("未安装", "Not installed"),
    ("跳过", "skip"),
    ("安装", "install"),
    ("字符级 token", "Character-level token"),
    ("词级 token", "Word-level token"),
    ("子词级 token", "Subword token"),
    ("文本", "Text"),
    ("ID序列", "ID sequence"),
    ("按字符切", "split by character"),
    ("按空格切", "split by spaces"),
    ("查表给编号", "look up IDs"),
    ("查表", "lookup"),
    ("统计相邻 pair", "count adjacent pairs"),
    ("继续统计，继续合并", "keep counting and merging"),
    ("继续统计", "keep counting"),
    ("继续合并", "keep merging"),
    ("合并", "merge"),
    ("初始：每个字符一个 token", "Start: one token per character"),
    ("新 token", "new token"),
    ("出现很多次", "appears many times"),
    ("不在词表中", "is not in the vocabulary"),
    ("报错", "error"),
    ("原文", "Original"),
    ("解码回来", "Decoded back"),
    ("关键观察", "Key observation"),
    ("前情回顾", "Previous recap"),
    ("本 Part 目标", "Goal for this part"),
    ("本节目标", "Goal for this section"),
    ("这一节", "In this section"),
    ("这一 Part", "In this part"),
    ("先看", "First look at"),
    ("再看", "Then look at"),
    ("先说清楚", "First, clarify"),
    ("先建立直觉", "Build intuition first"),
    ("先从", "Start from"),
    ("先给一个", "Start with a"),
    ("先跑", "First run"),
    ("先用", "First use"),
    ("为什么", "Why"),
    ("怎么", "How"),
    ("为什么会", "Why does it"),
    ("你可以先把", "You can think of"),
    ("你可以", "You can"),
    ("你只需要", "You only need to"),
    ("你只需", "You only need to"),
    ("想成", "as"),
    ("搞清楚", "figure out"),
    ("发生了什么", "what happens"),
    ("读文字前发生了什么", "what happens before reading text"),
    ("把一句话切成了什么", "what a sentence is split into"),
    ("手写字符级、词级和子词级 tokenizer", "hand-build character-level, word-level, and subword tokenizers"),
    ("真实 tokenizer", "a real tokenizer"),
    ("大模型不会直接读取字符串", "A large model does not read strings directly"),
    ("大Model不会直接读取字符串", "A large model does not read strings directly"),
    ("大模型读文字前发生了什么", "what happens before a large model reads text"),
    ("大Model读文字前发生了什么", "what happens before a large model reads text"),
    ("文本变成 token ID", "text becomes token IDs"),
    ("也能把 ID 拼回文本", "and can turn IDs back into text"),
    ("序列会很长", "the sequence becomes long"),
    ("词表会爆炸", "the vocabulary explodes"),
    ("遇到 OOV", "run into OOV"),
    ("常见片段合起来", "common pieces merge together"),
    ("少见词拆开", "rare words are split apart"),
    ("下一节 BPE 的方向", "the direction of the next BPE section"),
    ("人手动约定的控制符号", "hand-designed control symbols"),
    ("表示序列开始", "marks the start of a sequence"),
    ("表示序列结束", "marks the end of a sequence"),
    ("表示这里是补齐出来的位置", "marks a padding position"),
    ("这个字符都变成一个 token", "each character becomes one token"),
    ("每个字符都是一个 token", "each character is one token"),
    ("每个单词都是一个 token", "each word is one token"),
    ("遇到新词怎么办", "what happens when you meet a new word"),
    ("遇生词容易崩溃", "a new word can make the system break"),
    ("这就是下一节 BPE 的方向", "that is the direction of the next BPE section"),
    ("这就是折中", "that is the compromise"),
    ("你会看到", "you will see"),
    ("这里先用英文", "We start with English here"),
    ("等你看懂原理", "once you understand the idea"),
    ("不是另一个世界", "it is not a different world"),
    ("模型不会直接读取字符串", "The model does not read raw strings directly"),
    ("输入的文本，会先被 tokenizer 切成 token，再映射成 token ID", "The input text is first split into tokens and then mapped to token IDs"),
    ("下面先跑一个真实 tokenizer，看模型入口到底长什么样", "Let's first run a real tokenizer and see what the model input looks like"),
    ("这里先用英文，因为空格边界很明显，适合观察", "We start with English because spaces make the boundaries easy to observe"),
    ("等你看懂原理，中文只是切分规则更麻烦，不是另一个世界", "Once you understand the idea, Chinese is only a harder segmentation rule, not a different world"),
    ("字符级 Tokenizer 的想法最朴素", "The character-level tokenizer is the simplest idea"),
    ("词级 Tokenizer 的想法是", "The word-level tokenizer idea is"),
    ("BPE Tokenizer", "BPE Tokenizer"),
    ("核心思想", "Core idea"),
    ("直觉", "Intuition"),
    ("手算验证", "Manual check"),
    ("代码实现", "Code implementation"),
    ("实验观察", "Experiment"),
    ("小结", "Summary"),
    ("学习地图", "Learning map"),
    ("关键概念速查", "Quick reference"),
    ("确认你已经懂了这些", "Make sure you understand these"),
    ("确认你已经搞懂了这些", "Make sure you have understood these"),
    ("这 3 题分成两类", "These 3 exercises fall into two groups"),
    ("现代用法", "Modern usage"),
    ("加上 special tokens", "Add special tokens"),
    ("padding 和 attention mask", "padding and attention masks"),
    ("核心必须记住", "The core thing to remember"),
    ("问题", "Problem"),
    ("答案", "Answer"),
    ("优点", "Pros"),
    ("缺点", "Cons"),
    ("一句话解释", "One-line explanation"),
    ("核心贡献", "Core contribution"),
    ("效果", "Result"),
    ("总结", "Summary"),
    ("练习", "Exercises"),
    ("挑战", "Challenge"),
    ("关键观察", "Key observation"),
    ("关键区别", "Key difference"),
    ("关键问题", "Key problem"),
    ("关键洞察", "Key insight"),
    ("注意", "Note"),
    ("其中", "Among them"),
    ("我们会", "We will"),
    ("我们先", "First, we"),
    ("我们再", "Then we"),
    ("我们来", "Let's"),
    ("所以", "So"),
    ("因此", "So"),
    ("如果", "If"),
    ("也就是说", "In other words"),
    ("比如", "For example"),
    ("例如", "For example"),
    ("同时", "at the same time"),
    ("最后", "Finally"),
    ("然后", "Then"),
    ("这里", "Here"),
    ("这个例子里", "In this example"),
    ("在这里", "Here"),
    ("不要", "Do not"),
    ("不要直接", "Do not directly"),
    ("可以", "can"),
    ("需要", "need"),
    ("知道", "know"),
    ("理解", "understand"),
    ("训练", "training"),
    ("推理", "inference"),
    ("评测", "evaluation"),
    ("数据", "data"),
    ("模型", "model"),
    ("输入", "input"),
    ("输出", "output"),
    ("词表", "vocabulary"),
    ("token", "token"),
    ("tokenizer", "tokenizer"),
    ("loss", "loss"),
    ("batch", "batch"),
    ("概率", "probability"),
    ("分布", "distribution"),
    ("结果", "result"),
    ("观察", "observe"),
    ("说明", "note"),
    ("完成", "complete"),
    ("定义", "define"),
    ("实现", "implement"),
    ("测试", "test"),
]

FULL_LINE_MAP = {
    "其中：": "Among them:",
    "输出": "Output",
    "## 学习地图": "## Learning Map",
    "## 小结": "## Summary",
    "## 关键概念速查": "## Quick Reference",
    "### 关键概念速查": "### Quick Reference",
    "## VLM 支线小结": "## VLM Side Summary",
    "## OPD 支线小结": "## OPD Side Summary",
    "### 1. 先从一个超级简单的例子开始": "### 1. Start with a super simple example",
    "### 2. 训练数据和标签：一次 forward 算出所有位置的 loss": "### 2. Training data and labels: compute loss for every position in one forward pass",
    "### 3. Loss 怎么算？— Cross-Entropy Loss": "### 3. How do we compute loss? - Cross-Entropy Loss",
    "### 4. 回答核心问题：是 Token 级别训练还是句子级别？": "### 4. Answer the core question: token-level training or sentence-level training?",
    "### 5. 一个 batch 里面多句话的训练": "### 5. Training multiple sentences in one batch",
    "### 6. 完整的训练循环": "### 6. The full training loop",
    "### 1. 先从一个超级简单的例子开始。": "### 1. Start with a super simple example.",
}

LESSONS = {
    "01-tokenizer-basics": {
        "title": "Tokenizer Basics: How Text Becomes Numbers",
        "previous": "This is the entry point, so we begin from the first question: why can a model not read raw text directly?",
        "goal": "Understand what Token, Tokenizer, vocab, encode, decode, special tokens, padding, and attention masks mean.",
        "sections": [
            ("Build the intuition", "A Tokenizer is the translator in front of the model. It turns text into token IDs, and it can turn token IDs back into text. The important idea is simple: neural networks work with numbers, so text must first become a sequence of integer IDs."),
            ("Try simple choices", "A character-level tokenizer is stable because every character can be represented, but it creates long sequences. A word-level tokenizer creates shorter sequences, but it breaks when it sees a word outside the vocabulary. Subword tokenization is the compromise: common pieces stay together, rare words are split into smaller pieces."),
            ("Hand-check the algorithm", "For a sentence such as 'the cat', character tokenization gives ['t', 'h', 'e', ' ', 'c', 'a', 't'], while word tokenization gives ['the', 'cat']. The numbers are just IDs, like name tags; ID 12 is not 'larger in meaning' than ID 3."),
            ("Exercises", "The exercises ask you to fill in encode, add BOS/EOS special tokens, and build padding plus an attention mask. Ask an AI for hints if you get stuck, but do not ask it to finish the blanks for you."),
        ],
        "checklist": ["Token means the smallest text unit a model processes.", "Tokenizer.encode maps text to IDs; decode maps IDs back to text.", "Character-level is robust but long; word-level is short but brittle; subword tokenization balances both."],
    },
    "02-bpe-tokenizer": {
        "title": "BPE Tokenizer: Growing a Vocabulary From Statistics",
        "previous": "Part 01 showed why raw text must become token IDs, and why character-level and word-level tokenization both have trade-offs.",
        "goal": "Implement Byte Pair Encoding (BPE) by counting frequent neighboring pairs and merging them step by step.",
        "sections": [
            ("Why BPE exists", "BPE solves the tension between tiny character vocabularies and huge word vocabularies. It starts with small pieces and lets frequent patterns become larger tokens."),
            ("Core action", "The whole algorithm repeats one move: count adjacent token pairs, find the most frequent pair, merge it into a new token, and record that merge rule."),
            ("Manual example", "If ('l', 'o') appears most often, BPE creates 'lo'. Later ('lo', 'w') might become 'low'. The vocabulary is not magic; it grows from repeated statistics."),
            ("Industrial difference", "Real tokenizers use byte-level handling, normalization rules, special tokens, and large corpora. This notebook keeps the algorithm small so every merge is visible."),
        ],
        "checklist": ["BPE begins from small units and repeatedly merges frequent adjacent pairs.", "Merge rules define how encoding works later.", "Subword tokenization avoids most OOV failures while keeping sequences shorter than character-level tokenization."],
    },
    "03-embedding": {
        "title": "Embedding: Turning IDs Into Vectors",
        "previous": "Parts 01-02 turned text into token IDs. Now the IDs need to become numbers a neural network can compute with.",
        "goal": "Build Token Embedding from scratch and understand how distributed representation captures word similarity.",
        "sections": [
            ("Why IDs are not enough", "A token ID is only a lookup number. The model needs a vector, because vectors can be added, multiplied, compared, and learned."),
            ("Distributed representation", "Instead of a single ID, each word is described by many continuous features. Words with similar contexts get similar vectors."),
            ("Token Embedding", "An Embedding table is like a dictionary from token ID to vector. If token 5 means 'cat', row 5 of the table is the vector the model receives for that token."),
            ("Industry practices", "Weight tying, no weight decay on embeddings, and proper initialization help training stability."),
        ],
        "checklist": ["Embedding maps token IDs to learnable vectors.", "Distributed hypothesis: words in similar contexts have similar meanings.", "nn.Embedding is a learnable lookup table."],
    },
    "04-position-encoding": {
        "title": "Position Encoding: Letting the Model Sense Word Order",
        "previous": "Part 03 turned token IDs into vectors. But the same token gets the same vector no matter where it appears.",
        "goal": "Implement sinusoidal position encoding and assemble the full input layer (Token Embedding + Position Encoding).",
        "sections": [
            ("Why position matters", "Without position, 'dog bites man' and 'man bites dog' contain the same tokens. The model needs to know where each token sits."),
            ("Sinusoidal position encoding", "Sin and cos waves of different frequencies give each position a unique vector. The encoding is bounded, extrapolatable, and encodes relative distance."),
            ("Assembly", "The final input is Token Embedding + Position Encoding (addition, not concatenation). Batch dimension lets the GPU process many sequences at once."),
        ],
        "checklist": ["Position Encoding tells the model token order.", "The model input is token embedding plus position information.", "Addition (not concatenation) combines token and position vectors."],
    },
    "05-transformer-block": {
        "title": "Attention and Transformer Block",
        "previous": "Parts 03-04 built token and position vectors. Now each token needs to read information from other tokens.",
        "goal": "Understand Self-Attention, Multi-Head Attention, residual connections, LayerNorm, and the Transformer Block.",
        "sections": [
            ("The problem Attention solves", "A token cannot be understood alone. In 'the bank by the river', the word 'bank' needs surrounding words to decide its meaning."),
            ("Q, K, V intuition", "Query asks 'what am I looking for?', Key says 'what do I contain?', and Value is the information passed forward. Attention scores decide how much each token reads from the others."),
            ("Manual calculation", "The notebook uses tiny matrices so you can compute score = QK^T, apply softmax, and multiply by V before trusting the code."),
            ("Block structure", "A Transformer Block wraps Attention with residual connections, normalization, and a feed-forward network. Each part stabilizes or enriches the signal."),
        ],
        "checklist": ["Self-Attention lets each token read other tokens.", "Multi-Head Attention reads several relationship patterns at once.", "A Transformer Block combines attention, feed-forward layers, residual paths, and normalization."],
    },
    "06-mini-gpt": {
        "title": "Build Your First Mini-GPT",
        "previous": "Parts 01-05 built tokenization, embeddings, position encoding, attention, and Transformer blocks.",
        "goal": "Assemble a small decoder-only GPT and understand how logits predict the next token.",
        "sections": [
            ("What GPT does", "GPT is an autoregressive model: given previous tokens, it predicts the next token. Repeating that prediction produces text."),
            ("Architecture path", "Token IDs go through token embedding, position embedding, several Transformer blocks, final normalization, and a language-model head."),
            ("Causal mask", "During training, token i must not peek at future tokens. The causal mask enforces the same rule the model will face at generation time."),
            ("Karpathy comparison", "The notebook points out how the small implementation lines up with minGPT/nanoGPT style code while staying readable."),
        ],
        "checklist": ["Decoder-only GPT predicts the next token.", "Causal masking prevents future-token leakage.", "The lm_head maps hidden states to vocabulary logits."],
    },
    "09-gpt2-to-modern-models": {
        "title": "From GPT-2 to Modern Models: RMSNorm, SwiGLU, RoPE, Pre-Norm",
        "previous": "Mini-GPT gave us a working decoder. Modern models refine the same skeleton for stability and efficiency.",
        "goal": "Implement common LLaMA-style refinements and see what problem each one solves.",
        "sections": [
            ("Why refine the block", "A basic Transformer works, but deep training needs stable normalization, expressive feed-forward layers, and position handling that extrapolates better."),
            ("RMSNorm", "RMSNorm normalizes by root mean square. It keeps the scale controlled with less machinery than LayerNorm."),
            ("SwiGLU", "SwiGLU gives the feed-forward layer a learned gate, so the model can choose which features pass through."),
            ("RoPE and Pre-Norm", "RoPE rotates query/key vectors to encode relative position. Pre-Norm places normalization before sublayers to improve training stability."),
        ],
        "checklist": ["RMSNorm controls scale.", "SwiGLU adds a gate to the feed-forward path.", "RoPE injects position into attention through rotations."],
    },
    "10-moe": {
        "title": "Mixture of Experts: Routing Tokens to Specialists",
        "previous": "Part 06 improved the dense Transformer block. MoE changes the feed-forward part so not every token uses the same expert.",
        "goal": "Implement a small MoE layer, top-k routing, and load-balancing intuition.",
        "sections": [
            ("Why MoE exists", "Dense models use all parameters for every token. MoE increases total parameters while activating only a few experts per token."),
            ("Router intuition", "A router scores experts for each token, chooses the top experts, and combines their outputs with gate weights."),
            ("Load balance", "If one expert receives all tokens, the system wastes capacity. Auxiliary losses encourage more even expert usage."),
            ("Trade-off", "MoE can increase model capacity efficiently, but it makes training, communication, batching, and serving more complex."),
        ],
        "checklist": ["The router chooses experts per token.", "Only selected experts run, so active compute stays smaller than total parameters.", "Load balancing prevents expert collapse."],
    },
    "08-bert-encoder": {
        "title": "BERT Encoder: Bidirectional Understanding",
        "previous": "GPT predicts the next token with a causal mask. BERT uses a different mask so tokens can read both directions.",
        "goal": "Build a small encoder-only model and understand Masked Language Modeling (MLM).",
        "sections": [
            ("Decoder vs encoder", "GPT is good at continuation because it reads left to right. BERT is good at understanding because every token can attend to both left and right context."),
            ("MLM task", "Instead of predicting the next token, BERT hides some tokens and asks the model to recover them from surrounding context."),
            ("Classification head", "Encoder representations can feed tasks such as classification because they summarize the whole input with bidirectional context."),
            ("Key distinction", "BERT is not a text generator in the same way GPT is; it is mainly an encoder for understanding tasks."),
        ],
        "checklist": ["BERT uses bidirectional attention.", "MLM trains the model to recover masked tokens.", "Encoder outputs are useful for understanding and classification tasks."],
    },
    "11-training-loss": {
        "title": "Training and Loss: How Prediction Becomes Learning",
        "previous": "Earlier parts built model components. Now we need to make parameters improve from data.",
        "goal": "Hand-calculate Cross-Entropy, build a training loop, and inspect loss, gradients, batching, and accumulation.",
        "sections": [
            ("Why loss exists", "A model outputs logits, not a lesson learned. Loss turns 'how wrong was the prediction?' into a number that gradient descent can reduce."),
            ("Cross-Entropy by hand", "Softmax turns logits into probabilities. Cross-Entropy punishes the model when it gives low probability to the correct token."),
            ("Training loop", "A basic loop does forward pass, loss calculation, backward pass, optimizer step, and metric logging."),
            ("Practical details", "Batching, gradient accumulation, learning rate, and data quality all shape whether training is stable and useful."),
        ],
        "checklist": ["Cross-Entropy rewards high probability on the correct next token.", "Backpropagation computes gradients.", "The optimizer updates parameters to reduce loss over many batches."],
    },
    "12-scaling-laws": {
        "title": "Scaling Laws: Parameters, Data, and Compute",
        "previous": "Part 09 showed how a model learns from loss. Scaling laws ask how model size, data size, and compute interact.",
        "goal": "Estimate compute, compare Kaplan and Chinchilla intuitions, and understand why more parameters are not always the best use of budget.",
        "sections": [
            ("The resource triangle", "Training quality depends on parameters, tokens, and compute. If one side is badly chosen, extra budget can be wasted."),
            ("Compute estimate", "A common rough estimate is C about 6 times parameters times tokens. It is not exact, but it gives useful scale intuition."),
            ("Chinchilla intuition", "For a fixed compute budget, many older models were too large and trained on too little data. More data can beat simply adding parameters."),
            ("Takeaway", "Scaling laws are planning tools, not magic laws. They help ask whether the next dollar should buy parameters, data, or training time."),
        ],
        "checklist": ["Training compute depends heavily on parameters and token count.", "Compute-optimal training balances model size and data.", "Scaling laws guide planning but do not replace experiments."],
    },
    "13-data-engineering": {
        "title": "Data Engineering: Cleaning the Fuel for Training",
        "previous": "Scaling laws showed data volume matters. This part asks what makes data usable.",
        "goal": "Understand extraction, language filtering, quality filtering, deduplication, and data mixing.",
        "sections": [
            ("Why data engineering matters", "A model learns patterns from its corpus. Messy, duplicated, or low-quality text teaches messy behavior."),
            ("Pipeline steps", "A typical pipeline extracts text, filters languages, removes low-quality documents, deduplicates near-copies, and mixes sources deliberately."),
            ("Quality filters", "Simple rules can catch extreme length, symbol noise, repeated text, or strange word statistics. Model-based scores can add another signal."),
            ("Deduplication", "Exact hashing catches identical documents; MinHash-style methods catch near duplicates."),
        ],
        "checklist": ["Data quality affects model behavior.", "Filtering and deduplication are core training infrastructure.", "Data mixing controls what the model sees often."],
    },
    "14-lora": {
        "title": "LoRA: Low-Rank Adaptation",
        "previous": "We have a trainable model, but full fine-tuning can be expensive.",
        "goal": "Implement LoRA, understand low-rank updates, and see how adapters can be merged for inference.",
        "sections": [
            ("Why LoRA exists", "A pretrained model already stores broad knowledge. For a new task, we often only need a small update rather than changing every weight."),
            ("Low-rank idea", "Instead of learning a full weight update matrix, LoRA learns two smaller matrices A and B whose product approximates the update."),
            ("Where to apply it", "LoRA is commonly attached to attention projections or other linear layers where small targeted changes are useful."),
            ("Merge for inference", "After training, the low-rank update can be folded into the base weight so inference stays simple."),
        ],
        "checklist": ["LoRA freezes the base weight and learns a low-rank update.", "A and B are much smaller than a full update matrix.", "LoRA can often be merged into the base model for inference."],
    },
    "15-midtraining-cpt": {
        "title": "Mid-Training and Continued Pretraining",
        "previous": "LoRA adapts a model with small trainable modules. Continued pretraining adapts by training on more domain text.",
        "goal": "Understand CPT, domain adaptation, data mixing, and how loss curves reveal learning or forgetting.",
        "sections": [
            ("Why continue pretraining", "A general model may not know a specific domain well. Continued pretraining exposes it to domain text before downstream tuning."),
            ("Data mix", "Pure domain data can improve specialization but may hurt general ability. Mixing general and domain data reduces forgetting."),
            ("Observation", "Loss curves tell whether the model is adapting, overfitting, or forgetting. The point is not just to train longer, but to train on the right mixture."),
            ("CPT vs fine-tuning", "CPT teaches language/domain distribution; instruction tuning teaches response behavior."),
        ],
        "checklist": ["CPT adapts a pretrained model to a domain.", "Data mixing controls specialization versus forgetting.", "Loss curves are diagnostic signals, not just scores."],
    },
    "16-rlhf-alignment": {
        "title": "RLHF Alignment: Turning Preferences Into Objectives",
        "previous": "Training predicts tokens, but useful assistants must optimize for helpful behavior.",
        "goal": "Understand Reward Models, Bradley-Terry preference loss, PPO clipping, KL penalty, and DPO intuition.",
        "sections": [
            ("The mismatch", "Pretraining teaches continuation. Users want helpful, honest, safe answers. Alignment methods turn preference data into training signals."),
            ("Reward model", "A reward model learns to score which response humans prefer. Pairwise comparisons become a supervised learning problem."),
            ("PPO and KL", "PPO updates the policy toward higher reward while clipping changes. KL penalty keeps the new model close to the reference model."),
            ("DPO", "DPO removes the explicit reward-model step and directly optimizes chosen responses over rejected responses."),
        ],
        "checklist": ["RLHF uses preference data.", "Reward models score responses.", "PPO and DPO are two ways to move a model toward preferred behavior."],
    },
    "17-generation": {
        "title": "Generation: From Logits to Text",
        "previous": "Mini-GPT outputs logits. Generation decides how to choose the next token from those logits.",
        "goal": "Compare greedy decoding, temperature sampling, top-k, top-p, and beam search.",
        "sections": [
            ("Why decoding matters", "The same model can sound deterministic, creative, repetitive, or diverse depending on the decoding rule."),
            ("Greedy and temperature", "Greedy picks the highest-probability token. Temperature changes how sharp or flat the probability distribution is."),
            ("Top-k and top-p", "Top-k keeps a fixed number of candidates. Top-p keeps enough candidates to cover a probability mass."),
            ("Beam search", "Beam search keeps several candidate sequences, which can help structured tasks but may reduce open-ended diversity."),
        ],
        "checklist": ["Decoding turns logits into token choices.", "Temperature controls randomness.", "Top-k, top-p, and beam search trade diversity, quality, and compute."],
    },
    "18-inference-acceleration": {
        "title": "Inference Acceleration: KV Cache and Serving Constraints",
        "previous": "Generation chooses tokens one by one. Now we ask why that loop is slow and how systems speed it up.",
        "goal": "Understand KV Cache, attention cost, batching, quantization, FlashAttention, and PagedAttention intuition.",
        "sections": [
            ("Why generation is slow", "Autoregressive models generate one token at a time. Recomputing all previous keys and values every step wastes work."),
            ("KV Cache", "The cache stores past keys and values so each new token only computes the new pieces it needs."),
            ("Memory pressure", "KV Cache saves compute but consumes memory. Serving systems must manage batch size, context length, and throughput."),
            ("System ideas", "FlashAttention improves attention IO efficiency; PagedAttention manages KV memory more flexibly for many requests."),
        ],
        "checklist": ["KV Cache avoids recomputing past keys and values.", "Inference speed is limited by both compute and memory.", "Serving systems optimize batching, memory layout, and attention kernels."],
    },
    "19-speculative-decoding": {
        "title": "Speculative Decoding: Let a Small Model Help a Large Model",
        "previous": "KV Cache speeds a single model. Speculative decoding uses a second model to reduce expensive target-model steps.",
        "goal": "Implement draft-then-verify acceptance and understand why the output distribution can remain correct.",
        "sections": [
            ("Core idea", "A small draft model proposes several tokens quickly. The large target model verifies them in parallel."),
            ("Acceptance", "If the target model agrees enough with the draft token, we accept it. If not, we correct and continue."),
            ("Why it helps", "The target model still guards quality, but one target forward pass can validate multiple proposed tokens."),
            ("Limits", "Speedup depends on draft quality, target cost, batch shape, and implementation overhead."),
        ],
        "checklist": ["Draft model proposes tokens.", "Target model verifies them.", "Accepted drafts reduce the number of expensive target-model steps."],
    },
    "20-long-context": {
        "title": "Long Context: Extending the Window",
        "previous": "Basic inference assumes a limited context window. Modern applications often need much longer inputs.",
        "goal": "Study RoPE frequency behavior, position interpolation, NTK-aware scaling, YaRN intuition, and needle-in-haystack tests.",
        "sections": [
            ("Why long context is hard", "Attention cost grows with sequence length, and position encodings may not extrapolate beyond training lengths."),
            ("RoPE lens", "RoPE represents positions through rotations at different frequencies. Long-context tricks adjust how those frequencies behave."),
            ("Scaling methods", "Position interpolation compresses positions; NTK-aware and YaRN-style methods adjust frequencies more carefully."),
            ("Evaluation", "Needle-in-haystack tests ask whether a model can retrieve a small fact buried in a long context."),
        ],
        "checklist": ["Long context stresses both compute and position encoding.", "RoPE scaling changes how positions are represented.", "Retrieval tests reveal whether long context is actually usable."],
    },
    "21-cot-thinking": {
        "title": "CoT and Thinking: Reasoning Traces as Training Signals",
        "previous": "The model can generate text. Now we look at why intermediate reasoning traces can change answers.",
        "goal": "Understand Chain-of-Thought, Self-Consistency, thinking tags, cold-start data, and reward design.",
        "sections": [
            ("Why reasoning traces help", "Some tasks need intermediate steps. A visible chain gives the model room to decompose the problem instead of jumping straight to an answer."),
            ("Self-Consistency", "Instead of trusting one reasoning path, sample multiple paths and choose the answer that appears most consistently."),
            ("Thinking tags", "Tags such as <think> are control markers. The model does not magically understand the word; training teaches how to use the region."),
            ("Training data", "Cold-start traces, reward functions, and language consistency all affect whether reasoning behavior is useful or messy."),
        ],
        "checklist": ["CoT gives the model intermediate reasoning space.", "Self-Consistency uses multiple sampled paths.", "Thinking behavior depends on data, rewards, and formatting."],
    },
    "22-vlm": {
        "title": "Vision-Language Models: Connecting Images to Text",
        "previous": "Text-only models read token sequences. VLMs add visual information to the same language-model pipeline.",
        "goal": "Understand patch embeddings, vision encoders, projectors, Cross-Attention, and Flamingo-style gated fusion.",
        "sections": [
            ("Why VLMs need a bridge", "Images are arrays of pixels; language models expect token-like vectors. A VLM must convert visual signals into representations the LLM can use."),
            ("Patch Embedding", "An image can be split into patches, and each patch can become a vector, similar to a visual token."),
            ("Projector and fusion", "A projector maps vision features into the language model dimension. Cross-Attention or gated blocks let text tokens read image features."),
            ("Training strategy", "Many VLMs freeze some parts at first so visual ability grows without immediately destroying language ability."),
        ],
        "checklist": ["Images become patch or vision features.", "A projector aligns visual features with the LLM hidden size.", "Cross-Attention lets language tokens read visual information."],
    },
    "23-evaluation": {
        "title": "Evaluation: Measuring Model Behavior",
        "previous": "Once a model can train and generate, we need evidence that it is actually better.",
        "goal": "Build small evaluation examples and understand accuracy, LLM-as-Judge, win rates, radar charts, and RAGAS-style metrics.",
        "sections": [
            ("Why evaluation is hard", "A single score rarely captures all behavior. Models can be good at one task and weak at another."),
            ("Benchmark types", "Multiple-choice tasks, open-ended judge tasks, safety checks, multilingual tests, and retrieval tasks measure different skills."),
            ("Pairwise comparison", "Win-rate matrices compare model outputs directly. This is often more informative than isolated scores."),
            ("RAG evaluation", "RAGAS-style metrics split the question into faithfulness, relevance, and context usage."),
        ],
        "checklist": ["Evaluation must match the behavior you care about.", "LLM-as-Judge needs careful prompts and calibration.", "Pairwise and composite metrics reveal different model trade-offs."],
    },
    "24-distillation": {
        "title": "Distillation: Moving Knowledge Into a Smaller Model",
        "previous": "Evaluation tells us what a model can do. Distillation asks how to transfer ability into a cheaper model.",
        "goal": "Understand hard labels, soft labels, temperature, logit distillation, data distillation, and feature distillation.",
        "sections": [
            ("Why distill", "Large models are expensive to serve. A smaller student can learn from a larger teacher to reduce cost or latency."),
            ("Soft labels", "Teacher probabilities contain more information than a single correct class. Temperature reveals these softer relationships."),
            ("Logit distillation", "The student learns to match the teacher's output distribution, not just the final answer."),
            ("Other forms", "Data distillation uses teacher-generated examples; feature distillation matches internal representations."),
        ],
        "checklist": ["Distillation trains a student from a teacher.", "Soft labels carry dark knowledge.", "Temperature changes how much distribution detail the student sees."],
    },
    "25-opd": {
        "title": "On-Policy Distillation",
        "previous": "Standard distillation often trains on teacher or dataset distributions. OPD focuses on the student's own generated distribution.",
        "goal": "Understand exposure bias, Forward/Reverse KL, k1/k2/k3 estimators, OPSD, and the paper taxonomy.",
        "sections": [
            ("Exposure bias", "A student may train on one distribution but generate from another. Errors compound when the model must continue from its own imperfect outputs."),
            ("On-policy idea", "On-policy distillation samples from the student's current behavior and teaches on the states it actually visits."),
            ("KL directions", "Forward KL and Reverse KL encourage different behavior: coverage versus mode-seeking. Estimators approximate these objectives from samples."),
            ("Taxonomy", "The notebook organizes recent OPD-related papers by objective, sampling strategy, and correction method."),
        ],
        "checklist": ["OPD trains on the student's own generated states.", "KL direction changes what behavior is encouraged.", "Estimator choice matters for stability and bias."],
    },
}


def has_cjk(text):
    return bool(re.search(r"[\u4e00-\u9fff]", text))


def lesson_markdown(stem, part_dir):
    lesson = LESSONS[stem]
    lines = [
        f"# 🧱 Part {stem[:2]}: {lesson['title']}",
        "",
        f"> **Previous context**: {lesson['previous']}",
        f"> **Goal for this part**: {lesson['goal']}",
        "",
        "Today we are solving one concrete confusion: what is the hidden mechanism behind this part of an LLM, and how can we rebuild it with small numbers before trusting a library?",
        "",
    ]
    for index, (title, body) in enumerate(lesson["sections"]):
        lines.extend([f"## {index}. {title}", "", body, ""])
    lines.extend([
        "## How to use the code cells",
        "",
        "Run the cells in order. The code is intentionally direct and small: each cell should expose one idea, print the key observation, and let you change a number to see what moves.",
        "",
        "## Exercises",
        "",
        "When a cell contains a TODO placeholder, fill it yourself and use the `assert` checks as feedback. You can ask an AI for hints, step-by-step reasoning, or a direction check, but avoid asking it to complete the exercise outright.",
        "",
        "## Summary Checklist",
        "",
    ])
    lines.extend([f"- [ ] {item}" for item in lesson["checklist"]])
    lines.extend([
        "",
        f"Next, continue through the code cells for the {PARTS[part_dir]} part and inspect the printed observations.",
        "",
    ])
    return "\n".join(lines)


def english_string_for(original, index):
    if original in PHRASE_MAP:
        return PHRASE_MAP[original]

    translated = original
    for zh, en in sorted(PHRASE_MAP.items(), key=lambda item: len(item[0]), reverse=True):
        translated = translated.replace(zh, en)
    for zh, en in SUBSTRING_MAP:
        translated = translated.replace(zh, en)
    if translated != original and not has_cjk(translated):
        return translated

    text = original.lower()
    if "todo" in text or "在这里" in original:
        return "TODO: replace this placeholder with your code"
    if "assert" in text or "请先" in original:
        return "Please replace the placeholder before running the assertion."
    if "真实 tokenizer" in original:
        return "Real tokenizer: GPT-2 byte-level BPE"
    if "未能加载" in original:
        return "Could not load tiktoken. Install tiktoken to run the real tokenizer demo."
    if "词表大小" in original:
        return "Vocabulary size: "
    if "语料库共" in original:
        return "Corpus size:"
    if "总字符数" in original:
        return "Total characters:"
    if "总词数" in original:
        return "Total words (split by spaces):"
    if "token 数" in original:
        return "Number of tokens: "
    if "当前词表" in original:
        return "Current vocabulary:"
    if "尝试编码" in original:
        return "Trying to encode:"
    if "结果" in original:
        return "Result:"
    if "词表里有" in original:
        return "in the vocabulary"
    if "不在词表中" in original:
        return "not in the vocabulary"
    if "字符级 Tokenizer 训练完成" in original:
        return "Character-level tokenizer training finished"
    if "词级 Tokenizer 训练完成" in original:
        return "Word-level tokenizer training finished"
    if "编码/解码测试" in original:
        return "Encode/decode test"
    if "原文" in original:
        return "Original text: "
    if "解码回来" in original:
        return "Decoded text: "
    if "每个字符都变成一个 token，没有压缩" in original:
        return "Each character becomes one token, so there is no compression."
    if "而在现实世界" in original:
        return "In the real world, you can never pre-load every possible word into the vocabulary."
    if "结论" in original:
        return "Conclusion"
    if "原因" in original:
        return "Reason"
    if "逐个 token" in original:
        return "Inspect each token:"
    if "OOV" in original:
        return "OOV (Out Of Vocabulary) demo"
    if "关键观察" in original:
        return "Key observation: inspect the values above and connect them to the idea in this cell."
    if "解释" in original:
        return "Explanation: the printed values show the main mechanism in this step."
    if "训练完成" in original:
        return "Training finished"
    if "词表" in original:
        return "Vocabulary"
    if "损失" in original or "loss" in text:
        return "Loss"
    if "通过" in original:
        return "Exercise passed: you have understood this step."
    return "Read the values printed above and connect them to the concept in this cell."


def replace_string_token(token_text, token_index):
    if not has_cjk(token_text):
        return token_text
    return repr(english_string_for(token_text, token_index))


def translate_code(source):
    if not has_cjk(source):
        return patch_translated_code(source)

    reader = io.StringIO(source).readline
    try:
        tokens = list(tokenize.generate_tokens(reader))
    except tokenize.TokenError:
        return re.sub(r"[\u4e00-\u9fff]+", "English note", source)

    line_offsets = []
    offset = 0
    for line in source.splitlines(keepends=True):
        line_offsets.append(offset)
        offset += len(line)
    if not line_offsets:
        line_offsets.append(0)

    replacements = []
    fstring_middle = getattr(tokenize, "FSTRING_MIDDLE", None)
    for index, tok in enumerate(tokens):
        tok_type, tok_text, start, end, line = tok
        if tok_type == tokenize.COMMENT and has_cjk(tok_text):
            replacement = "# Teaching note: follow this line to see the main step."
        elif tok_type == fstring_middle and has_cjk(tok_text):
            replacement = english_string_for(tok_text, index)
        elif tok_type == tokenize.STRING and has_cjk(tok_text):
            replacement = replace_string_token(tok_text, index)
        else:
            continue

        start_offset = line_offsets[start[0] - 1] + start[1]
        end_offset = line_offsets[end[0] - 1] + end[1]
        replacements.append((start_offset, end_offset, replacement))

    translated = source
    for start_offset, end_offset, replacement in reversed(replacements):
        translated = translated[:start_offset] + replacement + translated[end_offset:]
    translated = translated.replace("✅", "[ok]").replace("❌", "[x]")
    return patch_translated_code(translated)


def patch_translated_code(source):
    """Apply small compatibility fixes after code text translation."""
    source = source.replace(
        "official_ids = tokenizer.apply_chat_template(messages, tokenize=True)",
        "\n".join([
            "official_ids_raw = tokenizer.apply_chat_template(messages, tokenize=True)",
            "official_ids = (",
            '    official_ids_raw["input_ids"]',
            '    if hasattr(official_ids_raw, "keys") and "input_ids" in official_ids_raw',
            "    else official_ids_raw",
            ")",
        ]),
    )
    source = source.replace(
        r"numbers = re.findall(r'[\d.]+', reasoning)",
        r"numbers = re.findall(r'\d+(?:\.\d+)?', reasoning)",
    )
    source = source.replace(
        "for idx in top3:\n    print(",
        "for idx in top3:\n    idx = int(idx)\n    print(",
    )
    source = guard_large_qwen_demo(source)
    return source


def guard_large_qwen_demo(source):
    """Keep the Qwen3-8B demo opt-in so static notebook execution stays offline."""
    marker = 'QWEN3_MODEL = "Qwen/Qwen3-8B"'
    if marker not in source or 'RUN_LARGE_MODEL_DEMOS' in source:
        return source

    start_marker = (
        "# ----------------------------------------------------------\n"
        "# Teaching note: follow this line to see the main step.\n"
        "# ----------------------------------------------------------\n"
        f"{marker}"
    )
    end_marker = (
        "\n\n# ----------------------------------------------------------\n"
        "# Teaching note: follow this line to see the main step.\n"
        "# ----------------------------------------------------------\n"
        "anthropic_key"
    )
    start = source.find(start_marker)
    end = source.find(end_marker, start)
    if start == -1 or end == -1:
        return source

    replacement = "\n".join([
        "# ----------------------------------------------------------",
        "# Teaching note: follow this line to see the main step.",
        "# ----------------------------------------------------------",
        'QWEN3_MODEL = "Qwen/Qwen3-8B"',
        'run_large_model_demo = os.environ.get("RUN_LARGE_MODEL_DEMOS") == "1"',
        "",
        "if run_large_model_demo:",
        "    try:",
        "        from transformers import AutoModelForCausalLM, AutoTokenizer",
        "        import torch",
        "",
        '        print("Loading the Qwen3 thinking demo model. This can take a long time.")',
        "        tokenizer = AutoTokenizer.from_pretrained(QWEN3_MODEL)",
        "        model = AutoModelForCausalLM.from_pretrained(",
        "            QWEN3_MODEL,",
        '            torch_dtype="auto",',
        '            device_map="auto",',
        "        )",
        "",
        '        messages = [{"role": "user", "content": "357 x 289 = ?"}]',
        "        text_on = tokenizer.apply_chat_template(",
        "            messages,",
        "            tokenize=False,",
        "            enable_thinking=True,",
        "        )",
        '        inputs = tokenizer(text_on, return_tensors="pt").to(model.device)',
        "        with torch.no_grad():",
        "            outputs = model.generate(**inputs, max_new_tokens=1024)",
        "        result = tokenizer.decode(outputs[0], skip_special_tokens=False)",
        '        print("Thinking enabled output preview:")',
        "        print(result[:300])",
        "",
        "        text_off = tokenizer.apply_chat_template(",
        "            messages,",
        "            tokenize=False,",
        "            enable_thinking=False,",
        "        )",
        '        inputs = tokenizer(text_off, return_tensors="pt").to(model.device)',
        "        with torch.no_grad():",
        "            outputs = model.generate(**inputs, max_new_tokens=512)",
        "        result = tokenizer.decode(outputs[0], skip_special_tokens=False)",
        '        print("Thinking disabled output preview:")',
        "        print(result[:300])",
        "",
        "    except Exception as e:",
        '        print("The local Qwen3 demo did not run in this environment.")',
        '        print("Reason:", e)',
        '        print("To try it manually, install transformers/torch/accelerate and rerun with:")',
        '        print("  RUN_LARGE_MODEL_DEMOS=1")',
        "else:",
        '    print("Skipped the local Qwen3-8B demo during notebook execution.")',
        '    print("Why: this cell may download and run an 8B model, which is too heavy for static builds.")',
        '    print("To run it manually, set RUN_LARGE_MODEL_DEMOS=1 and execute this cell again.")',
    ])
    return source[:start] + replacement + source[end:]


def translate_text_blob(text):
    if not has_cjk(text):
        return text

    translated = text
    for source, target in sorted(FULL_LINE_MAP.items(), key=lambda item: len(item[0]), reverse=True):
        translated = translated.replace(source, target)
    for source, target in sorted(PHRASE_MAP.items(), key=lambda item: len(item[0]), reverse=True):
        translated = translated.replace(source, target)
    for source, target in sorted(SUBSTRING_MAP, key=lambda item: len(item[0]), reverse=True):
        translated = translated.replace(source, target)

    translated = translated.replace("：", ": ")
    translated = translated.replace("；", "; ")
    translated = translated.replace("（", "(").replace("）", ")")
    translated = translated.replace("【", "[").replace("】", "]")
    translated = translated.replace("，", ", ")
    translated = translated.replace("。", ". ")
    translated = translated.replace("！", "! ")
    translated = translated.replace("？", "? ")
    translated = translated.replace("《", "\"").replace("》", "\"")
    translated = re.sub(r"(?<=[A-Za-z0-9])(?=[\u4e00-\u9fff])", " ", translated)
    translated = re.sub(r"(?<=[\u4e00-\u9fff])(?=[A-Za-z0-9])", " ", translated)
    translated = re.sub(r"\s+", " ", translated).strip()
    translated = re.sub(r"\s+([.,!?;:])", r"\1", translated)
    translated = re.sub(r"\s+\)", ")", translated)
    translated = re.sub(r"\(\s+", "(", translated)
    if has_cjk(translated):
        return english_string_for(translated, 0)
    return translated


def translate_markdown_line(line):
    if not line.strip():
        return line

    if line.startswith("```"):
        return line

    if line.lstrip().startswith("|"):
        cells = line.split("|")
        translated_cells = [translate_text_blob(cell) for cell in cells]
        return "|".join(translated_cells)

    prefix_match = re.match(r"^(\s*(?:#{1,6}\s*|>\s*|[-*]\s+|\d+\.\s+))(.+)$", line)
    if prefix_match:
        prefix, body = prefix_match.groups()
        return prefix + translate_text_blob(body)

    return translate_text_blob(line)


def translate_markdown(source):
    if isinstance(source, list):
        source = "".join(source)
    if not has_cjk(source):
        return source

    lines = source.splitlines(keepends=True)
    translated_lines = []
    for line in lines:
        translated_lines.append(translate_markdown_line(line))
    return "".join(translated_lines)


def translate_output_text(text):
    if isinstance(text, list):
        text = "".join(text)
    if not has_cjk(text):
        return text
    return "".join(translate_markdown_line(line) for line in text.splitlines(keepends=True))


def translate_output(output):
    if output.get("output_type") == "stream" and "text" in output:
        translated = dict(output)
        translated["text"] = translate_output_text(output.get("text", ""))
        return translated

    if output.get("output_type") in {"execute_result", "display_data"}:
        translated = dict(output)
        data = dict(output.get("data", {}))
        if "text/plain" in data:
            data["text/plain"] = translate_output_text(data["text/plain"])
        if "text/html" in data and has_cjk(data["text/html"]):
            data["text/html"] = translate_output_text(data["text/html"])
        translated["data"] = data
        return translated

    return output


def translate_markdown_cell(cell):
    translated = dict(cell)
    source = cell.get("source", "")
    if isinstance(source, list):
        source = "".join(source)
    translated["source"] = translate_markdown(source).splitlines(keepends=True)
    return translated


def translate_code_cell(cell):
    translated = dict(cell)
    source = "".join(cell.get("source", []))
    translated["source"] = translate_code(source).splitlines(keepends=True)
    translated["outputs"] = [translate_output(output) for output in cell.get("outputs", [])]
    return translated


def build_english_notebook(source_path):
    part_dir = source_path.parent.name
    stem = source_path.stem
    notebook = json.loads(source_path.read_text(encoding="utf-8"))
    translated_cells = []
    first_markdown_replaced = False
    for cell in notebook["cells"]:
        if cell.get("cell_type") == "markdown":
            if not first_markdown_replaced:
                intro_cell = {
                    "cell_type": "markdown",
                    "metadata": cell.get("metadata", {}),
                    "source": lesson_markdown(stem, part_dir).splitlines(keepends=True),
                }
                translated_cells.append(intro_cell)
                first_markdown_replaced = True
            else:
                translated_cells.append(translate_markdown_cell(cell))
        elif cell.get("cell_type") == "code":
            translated_cells.append(translate_code_cell(cell))
        else:
            translated_cells.append(cell)
    notebook["cells"] = translated_cells
    return notebook


def main():
    for source_path in sorted(SOURCE_DIR.glob("**/*.ipynb")):
        if ".ipynb_checkpoints" in str(source_path):
            continue
        target_path = TARGET_DIR / source_path.relative_to(SOURCE_DIR)
        target_path.parent.mkdir(parents=True, exist_ok=True)
        notebook = build_english_notebook(source_path)
        target_path.write_text(
            json.dumps(notebook, ensure_ascii=False, indent=1) + "\n",
            encoding="utf-8",
        )
        print(f"wrote {target_path.relative_to(REPO)}")


if __name__ == "__main__":
    main()
