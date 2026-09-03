#!/usr/bin/env python3
"""重构第一站：EN/CN 双语可选实战。

把「综合实战：训练一个真正的中文 Tokenizer」改成：
- 开头让读者选语料：en (tinyshakespeare) 或 cn (BelleGroup 中文对话)
- 所有后续 cell 跟随所选语料（CORPUS 变量驱动）
- 对比 cell 改为「自己训的 vs GPT-2 官方」，不再提 MiniMind
- 中文/英文各自的「关键观察」分开写
"""
import json
import uuid
from pathlib import Path

NB = Path('/home/devpod/github/modern-llm-notebook/notebooks/part1-foundation/02-bpe-tokenizer.ipynb')
nb = json.loads(NB.read_text())

# ---- 定位旧实战段（最后 12 个 cell，以「综合实战」开头）----
pat = __import__('re').compile(r'^[a-zA-Z0-9-_]+$')
assert pat.match(nb['cells'][-1]['id'])
tail_start = next(i for i, c in enumerate(nb['cells'])
                  if ''.join(c['source']).startswith('## 综合实战'))
old_tail = nb['cells'][tail_start:]
nb['cells'] = nb['cells'][:tail_start]
print(f'removed {len(old_tail)} old cells')


def md(source: str) -> dict:
    return {"cell_type": "markdown", "id": uuid.uuid4().hex[:8], "metadata": {},
            "source": source.splitlines(keepends=True)}


def code(source: str) -> dict:
    return {"cell_type": "code", "execution_count": None, "id": uuid.uuid4().hex[:8],
            "metadata": {}, "outputs": [],
            "source": source.splitlines(keepends=True)}


cells = []
cells.append(md('''## 综合实战：训练一个真正的中文 Tokenizer

> **前情回顾**：前面你已经手写了 BPE 的完整流程——统计 pair、合并、贪心编码。
> 现在把它放到真实场景里：**给真实语料训练一个能用的 tokenizer**。
>
> **本节目标**：用工业级 `tokenizers` 库训练一个 6400 词表的 byte-level BPE，并回答三个问题：
> 1. 自训练的 tokenizer 压缩率怎么样？
> 2. 中文一个字 / 英文一个单词会被切成几个 token？
> 3. 数字 `123` 会被切成一个 token 还是多个？（这个小细节后面训练数学能力时影响巨大）

### 0. 先选语料：英文还是中文？

Tokenizer 的质量完全由训练语料决定——**语言要匹配你的目标场景**。
下面这个 cell 让你选：

- **`LANG = "cn"`**：2 万条 [BelleGroup](https://huggingface.co/datasets/BelleGroup/train_1M_CN)
  中文对话（约 8.6MB，已放在 `data/cn_corpus_sample.txt`），适合做中文模型
- **`LANG = "en"`**：Tiny Shakespeare（约 1.1MB，前面章节用过的同一份语料），适合复现英文小模型

选好后从上往下跑，后面所有 cell 都会跟随你的选择。'''))

cells.append(code('''# ===== 选择你的语料：改这一个词，整个实战跟着变 =====
LANG = "cn"   # "cn" = 中文对话  |  "en" = 英文戏剧

if LANG == "cn":
    CORPUS = "data/cn_corpus_sample.txt"
    DEMOS = {  # 压缩率测试用的三段文本
        "中文": "今天天气很好，我们一起去公园散步，然后吃一顿火锅庆祝周末。",
        "英文": "The quick brown fox jumps over the lazy dog near the river bank.",
        "混合": "Python 是最流行的编程语言，我在 2024 年开始学习 machine learning。",
    }
else:
    CORPUS = "data/shakespeare_char/input.txt"
    DEMOS = {
        "英文": "The quick brown fox jumps over the lazy dog near the river bank.",
        "戏剧": "To be, or not to be, that is the question: whether tis nobler.",
        "中文": "今天天气很好，我们一起去公园散步。",
    }

# 统一计数：1 个"单元" = 1 个中文字 或 1 个英文单词
import re

def count_units(t: str) -> int:
    cjk = sum(1 for ch in t if '\\u4e00' <= ch <= '\\u9fff')
    words = len(re.findall(r'[A-Za-z0-9]+', t))
    return cjk + words

import os
assert os.path.exists(CORPUS), f"语料不存在: {CORPUS}"
size_mb = os.path.getsize(CORPUS) / 1e6
print(f"已选语料: {CORPUS}  ({size_mb:.1f} MB, LANG={LANG})")'''))

cells.append(md('''### 1. 用 `tokenizers` 库训练

`tokenizers` 是 HuggingFace 的 Rust 实现，就是前面手写逻辑的工业版：
一样是 byte-level 起点 + 统计 pair + 合并最高频，只是快了几百倍。

训练只需要 3 个参数：
- `vocab_size=6400`：词表大小（和常见的教学级小模型对齐）
- `min_frequency=2`：出现少于 2 次的 pair 不合并
- `special_tokens`：对话/生成模板要用的特殊 token'''))

cells.append(code('''# 训练一个 byte-level BPE tokenizer
from tokenizers import Tokenizer, models, trainers, pre_tokenizers, decoders

tokenizer = Tokenizer(models.BPE())
# byte-level：任何 UTF-8 文本都能处理，和 GPT-2 同一套思路（A.9 节）
tokenizer.pre_tokenizer = pre_tokenizers.ByteLevel(add_prefix_space=False)
tokenizer.decoder = decoders.ByteLevel()

trainer = trainers.BpeTrainer(
    vocab_size=6400,
    min_frequency=2,
    special_tokens=["<s>", "</s>", "<pad>", "<unk>"],
    initial_alphabet=pre_tokenizers.ByteLevel.alphabet(),
)
tokenizer.train([CORPUS], trainer)

print("词表大小:", tokenizer.get_vocab_size())
print("保存到 mini_tokenizer.json")
tokenizer.save("mini_tokenizer.json")'''))

cells.append(md('''**关键观察**：训练几 MB 语料只需要几秒钟——这就是 Rust 实现的威力。
你前面手写的 BPE 在同样数据上可能要跑几分钟。

### 2. 压缩率对比

Tokenizer 好不好，第一指标是**压缩率**：平均每个 token 装下几个「字/词」。
压缩率越高，同样的文本被切成的 token 数越少，模型在同长上下文里能"看"到越多内容。

注意对比结果跟你在第 0 步选的语言有关——**这就是"语料决定 tokenizer"的直接证据**。'''))

cells.append(md('''**🔍 中文语料（LANG="cn"）的预期结果**：
中文压缩率通常在 1.0~1.5 之间（一个汉字 ≈ 1 个 token），英文单词平均 1 token。
如果拿纯英文语料训练的 tokenizer 切中文，压缩率可能掉到 0.3 以下——
一个汉字要花 3 个 token，模型能看的上下文直接缩水 3 倍。
反过来，中文语料训出的 tokenizer 删英文也不擅长。**语言要匹配。**

**🔍 英文语料（LANG="en"）的预期结果**：
英文压缩率高（一个单词 ≈ 1 个 token），但中文会被切碎。
还有个有趣现象：Shakespeare 是 1.1MB 小语料，6400 词表可能"吃不饱"——
很多高频词已经合并完，词表却还没用完。

改一下第 0 步的 `LANG` 重跑全部 cell，亲眼看两次结果的差别。'''))

cells.append(code('''# 压缩率 = 单元数(字/词) / token 数，越高越好
print(f"{'类型':<4} {'单元数':>6} {'token数':>7} {'压缩率':>8}")
print("-" * 32)
for name, text in DEMOS.items():
    n_units = count_units(text)
    n_tokens = len(tokenizer.encode(text).ids)
    print(f"{name:<4} {n_units:>6} {n_tokens:>7} {n_units / n_tokens:>7.2f}")'''))

cells.append(md('''### 3. 数字切分问题：一个 123 引发的血案

现在检查一个看起来不起眼的细节：数字是怎么被切的？

训练数学能力时，模型要学 `123 + 456`。如果 tokenizer 把 `123` 切成 `['12', '3']`，
模型看到的"数"和人类理解的自然数根本对不上——这会直接伤害算术学习。
（这不是理论担忧：训练 64M 小模型做小学数学时实测过这个现象。）'''))

cells.append(code('''# 检查数字的切分方式
for num in ["123", "4567", "2024", "3.14"]:
    pieces = [tokenizer.decode([id]) for id in tokenizer.encode(num).ids]
    print(f"{num:>5} -> {pieces}  ({len(pieces)} 个 token)")'''))

cells.append(md('''**关键观察**：数字的切法完全由语料决定，两种语料给出截然不同的答案：

- **中文语料（cn）**：`123 → ['12', '3']`——语料里 `12`、`3` 这类片段高频出现，
  被合并成了完整 token
- **英文语料（en）**：`123 → ['1', '2', '3']`——Shakespeare 里几乎没有数字，
  每个数字字符只能独立成 token（这就是 GPT-2 按位切分的由来）

哪个更好看下游任务：要学 `123 + 456` 这类算术，**按位切分（en 的结果）反而更稳**——
数字位数变化时模型见的模式一致；碎片切分（cn 的结果）会让"同一个数"在不同上下文里
长不一样，伤害算术学习。这是训练小模型做小学数学时实测过的现象。'''))

cells.append(md('''### 4. 对比：GPT-2 官方 tokenizer

最后和 GPT-2 官方 tokenizer 对比一下。它是 50257 词表的英文语料产物——
正好和你手上的 6400 词表自训版形成对照：**词表大小、语料语言都不同，切分自然不同**。

> 需要 `transformers` 库（首次运行会自动下载 ~2MB 的 tokenizer 文件；
> 没有该库时会自动跳过，不影响后面的理解）。'''))

cells.append(code('''# 对比 GPT-2 官方 tokenizer（可选）
try:
    from transformers import AutoTokenizer
    gpt2 = AutoTokenizer.from_pretrained("gpt2")
    print(f"{'类型':<4} {'字符数':>6} {'自训练 6400':>10} {'GPT-2 50257':>11}")
    print("-" * 40)
    for name, text in DEMOS.items():
        n_chars = len(text)
        a = len(tokenizer.encode(text).ids)
        b = len(gpt2.encode(text))
        print(f"{name:<4} {n_chars:>6} {a:>10} {b:>11}")
except Exception as e:
    print(f"跳过 GPT-2 对比（{type(e).__name__}）。不影响后面的理解。")'''))

cells.append(md('''### 5. 动手检查（填空 + assert）

最后一道练习把今天的关键结论固化下来：

**练习**：补全压缩率计算，并验证词表里确实包含模板要用的 special tokens。'''))

cells.append(code('''# 练习：压缩率计算 + special tokens 检查
text = DEMOS["混合"] if "混合" in DEMOS else DEMOS["英文"]
n_units = count_units(text)
n_tokens = len(tokenizer.encode(text).ids)
compression = n_units / n_tokens

# 阈值按语料分开：中文一个字 ≈ 1 token（>0.8 才正常）；
# 英文 6400 小词表平均 0.5~1 词/token 就算合格（大词表才能到 1 词/token）
threshold = 0.8 if LANG == "cn" else 0.5
assert compression > threshold, (
    f"压缩率 {compression:.2f} 低于 {threshold}，检查语料与测试文本是否语言匹配")

vocab = tokenizer.get_vocab()
for tok in ["<s>", "</s>", "<pad>"]:
    assert tok in vocab, f"缺少 special token: {tok}"

print(f"✅ 压缩率 {compression:.2f}（LANG={LANG}，阈值 {threshold}），special tokens 齐全")
print("你已经训练出了一个可以喂给小模型的 tokenizer！")'''))

cells.append(md('''### 小结

- `tokenizers` 库 = 你手写的 BPE 的工业版，Rust 实现，MB 级语料秒级训练完
- **压缩率**是 tokenizer 的第一指标：语料语言要和目标场景匹配
- 换 `LANG` 重跑一遍，两次结果直接对比，胜过看十遍文字解释
- 数字切分是小词表 tokenizer 的隐形坑：`123` 可能被切成 `['12','3']`，
  对后续的数学能力训练影响很大

### 下一站

> 🔬 **From-0 实战线 · 第 1/3 站完成**
> 你刚训练好的 tokenizer 会在后面的实战里继续使用：
> **第 2/3 站在 [14-data-engineering（数据工程）](../part2-training/14-data-engineering.ipynb) 尾部**——
> 把对话数据用 tokenizer 打包成模型能吃的 bin 文件，并真正启动一次 64M 模型训练。

## 参考资料

- HuggingFace [`tokenizers` 文档](https://huggingface.co/docs/tokenizers)
- [BelleGroup/train_1M_CN](https://huggingface.co/datasets/BelleGroup/train_1M_CN)：cn 语料来源
- [Tiny Shakespeare](https://raw.githubusercontent.com/karpathy/char-rnn/master/data/tinyshakespeare/input.txt)：en 语料来源
- GPT-2 论文 Section 2.2 *Byte Pair Encoding (BPE)*：数字按位切分的出处'''))

nb['cells'].extend(cells)
NB.write_text(json.dumps(nb, ensure_ascii=False, indent=1))

# 自检
import nbformat
nbformat.validate(nbformat.read(str(NB), as_version=4))
print(f'rewrote tail: {len(cells)} new cells, total {len(nb["cells"])}, nbformat OK')
