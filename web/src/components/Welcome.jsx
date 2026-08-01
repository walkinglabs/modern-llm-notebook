import { useEffect, useState } from 'react'
import {
  BookOpen, ArrowRight, Check, Layers, Cpu, Star,
  Monitor, Languages, ChevronRight, CodeXml, Rocket, Sparkles, Menu,
  Mail, X, ExternalLink,
} from 'lucide-react'
import { GITHUB_OWNER, GITHUB_REPO } from '../config.js'
import { PATH_STEPS, RUNNABLE_NOTEBOOKS } from '../data/sidebar.js'

const GITHUB_STARS_CACHE_KEY = `github-stars:${GITHUB_OWNER}/${GITHUB_REPO}`

function formatStarCount(count) {
  if (typeof count !== 'number') return '--'
  return count.toLocaleString('en-US')
}

const SECTION_STYLES = {
  foundation: { bg: 'from-[#dbeafe] to-[#e0f2fe]', tag: 'bg-blue-50 text-blue-600 border-blue-200/50', nameZh: '基础', nameEn: 'Foundation', accent: 'blue', iconBg: 'bg-blue-100 text-blue-600 border-blue-200/50', pathBorder: 'border-l-blue-400' },
  training: { bg: 'from-[#ede9fe] to-[#f5f3ff]', tag: 'bg-purple-50 text-purple-600 border-purple-200/50', nameZh: '训练', nameEn: 'Training', accent: 'purple', iconBg: 'bg-purple-100 text-purple-600 border-purple-200/50', pathBorder: 'border-l-purple-400' },
  inference: { bg: 'from-[#d1fae5] to-[#ecfdf5]', tag: 'bg-emerald-50 text-emerald-600 border-emerald-200/50', nameZh: '推理', nameEn: 'Inference', accent: 'emerald', iconBg: 'bg-emerald-100 text-emerald-600 border-emerald-200/50', pathBorder: 'border-l-emerald-400' },
  frontiers: { bg: 'from-[#fef3c7] to-[#fffbeb]', tag: 'bg-amber-50 text-amber-600 border-amber-200/50', nameZh: '前沿', nameEn: 'Frontiers', accent: 'amber', iconBg: 'bg-amber-100 text-amber-600 border-amber-200/50', pathBorder: 'border-l-amber-400' },
  production: { bg: 'from-[#fce7f3] to-[#fdf2f8]', tag: 'bg-rose-50 text-rose-600 border-rose-200/50', nameZh: '评测与部署', nameEn: 'Eval & Deploy', accent: 'rose', iconBg: 'bg-rose-100 text-rose-600 border-rose-200/50', pathBorder: 'border-l-rose-400' },
}

const PATH_STEP_STYLES = [
  { numBg: 'bg-[var(--bg-input)] text-[var(--text-secondary)]' },
  { numBg: 'bg-[var(--bg-input)] text-[var(--text-secondary)]' },
  { numBg: 'bg-[var(--bg-input)] text-[var(--text-secondary)]' },
  { numBg: 'bg-[var(--bg-input)] text-[var(--text-secondary)]' },
  { numBg: 'bg-[var(--bg-input)] text-[var(--text-secondary)]' },
]

const NOTEBOOK_BG = {
  'nb-1': 'from-[#eff6ff] to-[#dbeafe]',     // Tokenizer — soft blue gradient
  'nb-2': 'from-[#eef2ff] to-[#c7d2fe]',     // Attention — indigo-blue
  'nb-3': 'from-[#f5f3ff] to-[#ddd6fe]',     // MoE — lavender
  'nb-4': 'from-[#faf5ff] to-[#e9d5ff]',     // Training — violet
  'nb-5': 'from-[#dbeafe] to-[#93c5fd]',     // Mini-GPT — vivid blue
  'nb-6': 'from-[#fdf4ff] to-[#f0abfc]',     // LoRA — fuchsia
  'nb-7': 'from-[#ecfdf5] to-[#6ee7b7]',     // Generation — vivid emerald
  'nb-8': 'from-[#fffbeb] to-[#fcd34d]',     // CoT — golden amber
  'nb-9': 'from-[#ede9fe] to-[#a78bfa]',     // RLHF — deep purple
  'nb-10': 'from-[#fff1f2] to-[#fda4af]',    // Distillation — rose
}

const NOTEBOOK_SVGS = {
  'nb-1': ( // Tokenizer — text splitting into tokens
    <svg width="60" height="60" viewBox="0 0 60 60" className="opacity-80">
      <rect x="5" y="15" width="50" height="12" rx="3" fill="#3b82f6" opacity="0.25" />
      <text x="10" y="24" fontSize="8" fontFamily="monospace" fill="#3b82f6" opacity="0.7">Hello</text>
      <text x="35" y="24" fontSize="8" fontFamily="monospace" fill="#3b82f6" opacity="0.7">LLM</text>
      <line x1="10" y1="30" x2="10" y2="36" stroke="#93c5fd" strokeWidth="1" />
      <line x1="25" y1="30" x2="25" y2="36" stroke="#93c5fd" strokeWidth="1" />
      <line x1="35" y1="30" x2="35" y2="36" stroke="#93c5fd" strokeWidth="1" />
      <line x1="50" y1="30" x2="50" y2="36" stroke="#93c5fd" strokeWidth="1" />
      <rect x="4" y="36" width="14" height="10" rx="2" fill="#3b82f6" opacity="0.6" />
      <rect x="20" y="36" width="10" height="10" rx="2" fill="#3b82f6" opacity="0.5" />
      <rect x="33" y="36" width="14" height="10" rx="2" fill="#60a5fa" opacity="0.5" />
      <rect x="50" y="36" width="8" height="10" rx="2" fill="#60a5fa" opacity="0.4" />
      <text x="7" y="44" fontSize="7" fontFamily="monospace" fill="white" opacity="0.9">Hel</text>
      <text x="22" y="44" fontSize="7" fontFamily="monospace" fill="white" opacity="0.9">lo</text>
      <text x="35" y="44" fontSize="7" fontFamily="monospace" fill="white" opacity="0.9">LL</text>
      <text x="52" y="44" fontSize="7" fontFamily="monospace" fill="white" opacity="0.9">M</text>
    </svg>
  ),
  'nb-2': ( // Attention & Transformer — Q K V attention pattern
    <svg width="60" height="60" viewBox="0 0 60 60" className="opacity-80">
      <circle cx="12" cy="12" r="5" fill="#3b82f6" opacity="0.6" />
      <circle cx="30" cy="12" r="5" fill="#3b82f6" opacity="0.7" />
      <circle cx="48" cy="12" r="5" fill="#3b82f6" opacity="0.6" />
      <text x="10" y="14.5" fontSize="6" fill="white" fontWeight="bold">Q</text>
      <text x="28" y="14.5" fontSize="6" fill="white" fontWeight="bold">K</text>
      <text x="46" y="14.5" fontSize="6" fill="white" fontWeight="bold">V</text>
      <line x1="12" y1="17" x2="30" y2="26" stroke="#93c5fd" strokeWidth="1.5" opacity="0.5" />
      <line x1="30" y1="17" x2="30" y2="26" stroke="#3b82f6" strokeWidth="1.5" opacity="0.7" />
      <line x1="48" y1="17" x2="30" y2="26" stroke="#93c5fd" strokeWidth="1.5" opacity="0.5" />
      <rect x="18" y="26" width="24" height="10" rx="2" fill="#3b82f6" opacity="0.4" />
      <text x="22" y="34" fontSize="7" fill="#3b82f6" opacity="0.9">softmax</text>
      <line x1="30" y1="36" x2="30" y2="42" stroke="#3b82f6" strokeWidth="1.5" />
      <rect x="12" y="42" width="36" height="10" rx="3" fill="#3b82f6" opacity="0.6" />
      <text x="16" y="50" fontSize="7" fill="white" opacity="0.9">Attention</text>
    </svg>
  ),
  'nb-3': ( // MoE — multiple experts with router
    <svg width="60" height="60" viewBox="0 0 60 60" className="opacity-80">
      <circle cx="30" cy="10" r="5" fill="#7c3aed" opacity="0.7" />
      <text x="25" y="12.5" fontSize="6" fill="white" fontWeight="bold">R</text>
      <line x1="22" y1="15" x2="12" y2="28" stroke="#c4b5fd" strokeWidth="1.5" />
      <line x1="30" y1="15" x2="30" y2="28" stroke="#7c3aed" strokeWidth="1.5" />
      <line x1="38" y1="15" x2="48" y2="28" stroke="#c4b5fd" strokeWidth="1.5" />
      <rect x="4" y="28" width="16" height="10" rx="2" fill="#7c3aed" opacity="0.6" />
      <rect x="22" y="28" width="16" height="10" rx="2" fill="#7c3aed" opacity="0.8" />
      <rect x="40" y="28" width="16" height="10" rx="2" fill="#7c3aed" opacity="0.4" />
      <text x="8" y="36" fontSize="6" fill="white" opacity="0.8">E1</text>
      <text x="26" y="36" fontSize="6" fill="white" fontWeight="bold">E2</text>
      <text x="44" y="36" fontSize="6" fill="white" opacity="0.6">E3</text>
      <line x1="12" y1="38" x2="30" y2="48" stroke="#a78bfa" strokeWidth="1" opacity="0.5" />
      <line x1="30" y1="38" x2="30" y2="48" stroke="#7c3aed" strokeWidth="1.5" />
      <line x1="48" y1="38" x2="30" y2="48" stroke="#a78bfa" strokeWidth="1" opacity="0.5" />
      <rect x="22" y="48" width="16" height="8" rx="2" fill="#7c3aed" opacity="0.5" />
      <text x="26" y="54" fontSize="6" fill="white" opacity="0.9">out</text>
    </svg>
  ),
  'nb-4': ( // Training & Loss — loss curve going down
    <svg width="60" height="60" viewBox="0 0 60 60" className="opacity-80">
      <rect x="5" y="5" width="50" height="45" rx="2" fill="none" stroke="#7c3aed" strokeWidth="1" opacity="0.3" />
      <line x1="5" y1="15" x2="55" y2="15" stroke="#c4b5fd" strokeWidth="0.5" opacity="0.3" />
      <line x1="5" y1="25" x2="55" y2="25" stroke="#c4b5fd" strokeWidth="0.5" opacity="0.3" />
      <line x1="5" y1="35" x2="55" y2="35" stroke="#c4b5fd" strokeWidth="0.5" opacity="0.3" />
      <polyline points="8,12 14,18 20,22 26,27 32,33 38,37 44,40 50,42" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" />
      <circle cx="8" cy="12" r="2" fill="#7c3aed" opacity="0.6" />
      <circle cx="50" cy="42" r="2.5" fill="#7c3aed" opacity="0.9" />
      <text x="8" y="55" fontSize="6" fill="#7c3aed" opacity="0.6">step</text>
      <text x="1" y="10" fontSize="6" fill="#7c3aed" opacity="0.6">L</text>
    </svg>
  ),
  'nb-5': ( // Mini-GPT — stacked transformer blocks
    <svg width="60" height="60" viewBox="0 0 60 60" className="opacity-80">
      <rect x="10" y="4" width="40" height="10" rx="2" fill="#3b82f6" opacity="0.5" />
      <text x="22" y="12" fontSize="7" fill="white" opacity="0.9">Input</text>
      <line x1="30" y1="14" x2="30" y2="18" stroke="#93c5fd" strokeWidth="1" />
      <rect x="10" y="18" width="40" height="10" rx="2" fill="#3b82f6" opacity="0.6" />
      <text x="16" y="26" fontSize="6" fill="white" opacity="0.9">Block 1</text>
      <line x1="30" y1="28" x2="30" y2="32" stroke="#93c5fd" strokeWidth="1" />
      <rect x="10" y="32" width="40" height="10" rx="2" fill="#3b82f6" opacity="0.7" />
      <text x="16" y="40" fontSize="6" fill="white" opacity="0.9">Block 2</text>
      <line x1="30" y1="42" x2="30" y2="46" stroke="#93c5fd" strokeWidth="1" />
      <rect x="10" y="46" width="40" height="10" rx="2" fill="#3b82f6" opacity="0.8" />
      <text x="14" y="54" fontSize="6" fill="white" fontWeight="bold" opacity="0.9">LM Head</text>
    </svg>
  ),
  'nb-6': ( // LoRA — low-rank decomposition A×B
    <svg width="60" height="60" viewBox="0 0 60 60" className="opacity-80">
      <rect x="5" y="15" width="20" height="30" rx="2" fill="#7c3aed" opacity="0.3" stroke="#7c3aed" strokeWidth="1" strokeOpacity="0.5" />
      <text x="8" y="33" fontSize="7" fill="#7c3aed" opacity="0.7">W</text>
      <text x="28" y="33" fontSize="10" fill="#7c3aed" opacity="0.5">+</text>
      <rect x="35" y="8" width="8" height="28" rx="2" fill="#7c3aed" opacity="0.5" />
      <text x="37" y="26" fontSize="7" fill="white" opacity="0.9">A</text>
      <text x="42" y="28" fontSize="8" fill="#7c3aed" opacity="0.5">×</text>
      <rect x="46" y="20" width="8" height="28" rx="2" fill="#7c3aed" opacity="0.6" />
      <text x="48" y="38" fontSize="7" fill="white" opacity="0.9">B</text>
      <text x="5" y="55" fontSize="6" fill="#7c3aed" opacity="0.5">rank r ≪ d</text>
    </svg>
  ),
  'nb-7': ( // Generation strategies — branching paths (beam search tree)
    <svg width="60" height="60" viewBox="0 0 60 60" className="opacity-80">
      <circle cx="10" cy="30" r="4" fill="#059669" opacity="0.8" />
      <line x1="14" y1="28" x2="24" y2="18" stroke="#059669" strokeWidth="1.5" opacity="0.6" />
      <line x1="14" y1="30" x2="24" y2="30" stroke="#059669" strokeWidth="1.5" opacity="0.8" />
      <line x1="14" y1="32" x2="24" y2="42" stroke="#059669" strokeWidth="1.5" opacity="0.4" />
      <circle cx="27" cy="18" r="3" fill="#059669" opacity="0.5" />
      <circle cx="27" cy="30" r="3" fill="#059669" opacity="0.8" />
      <circle cx="27" cy="42" r="3" fill="#059669" opacity="0.4" />
      <line x1="30" y1="18" x2="40" y2="14" stroke="#6ee7b7" strokeWidth="1" opacity="0.4" />
      <line x1="30" y1="18" x2="40" y2="24" stroke="#6ee7b7" strokeWidth="1" opacity="0.5" />
      <line x1="30" y1="30" x2="40" y2="26" stroke="#059669" strokeWidth="1.5" opacity="0.8" />
      <line x1="30" y1="30" x2="40" y2="36" stroke="#059669" strokeWidth="1.5" opacity="0.6" />
      <circle cx="43" cy="14" r="2.5" fill="#059669" opacity="0.4" />
      <circle cx="43" cy="24" r="2.5" fill="#059669" opacity="0.5" />
      <circle cx="43" cy="26" r="2.5" fill="#059669" opacity="0.9" />
      <circle cx="43" cy="36" r="2.5" fill="#059669" opacity="0.5" />
      <line x1="45" y1="26" x2="54" y2="30" stroke="#059669" strokeWidth="2" opacity="0.9" />
      <circle cx="55" cy="30" r="3" fill="#059669" opacity="0.9" />
    </svg>
  ),
  'nb-8': ( // CoT — chain of thought bubbles
    <svg width="60" height="60" viewBox="0 0 60 60" className="opacity-80">
      <rect x="4" y="6" width="22" height="10" rx="5" fill="#d97706" opacity="0.3" />
      <text x="7" y="14" fontSize="7" fill="#d97706" opacity="0.7">step1</text>
      <line x1="26" y1="11" x2="30" y2="11" stroke="#fcd34d" strokeWidth="1" />
      <rect x="30" y="6" width="22" height="10" rx="5" fill="#d97706" opacity="0.4" />
      <text x="33" y="14" fontSize="7" fill="#d97706" opacity="0.8">step2</text>
      <line x1="30" y1="16" x2="30" y2="22" stroke="#d97706" strokeWidth="1" />
      <rect x="4" y="22" width="22" height="10" rx="5" fill="#d97706" opacity="0.5" />
      <text x="7" y="30" fontSize="7" fill="white" opacity="0.9">step3</text>
      <line x1="26" y1="27" x2="30" y2="27" stroke="#d97706" strokeWidth="1" />
      <rect x="30" y="22" width="22" height="10" rx="5" fill="#d97706" opacity="0.6" />
      <text x="33" y="30" fontSize="7" fill="white" opacity="0.9">step4</text>
      <line x1="30" y1="32" x2="30" y2="38" stroke="#d97706" strokeWidth="1.5" />
      <rect x="15" y="38" width="30" height="14" rx="4" fill="#d97706" opacity="0.7" />
      <text x="20" y="48" fontSize="8" fill="white" fontWeight="bold" opacity="0.9">Answer</text>
    </svg>
  ),
  'nb-9': ( // RLHF — reward model feedback loop
    <svg width="60" height="60" viewBox="0 0 60 60" className="opacity-80">
      <rect x="8" y="8" width="18" height="12" rx="2" fill="#7c3aed" opacity="0.5" />
      <text x="11" y="17" fontSize="6" fill="white" opacity="0.9">Prompt</text>
      <line x1="17" y1="20" x2="17" y2="26" stroke="#c4b5fd" strokeWidth="1" />
      <rect x="8" y="26" width="18" height="12" rx="2" fill="#7c3aed" opacity="0.6" />
      <text x="11" y="35" fontSize="6" fill="white" opacity="0.9">Model</text>
      <line x1="26" y1="32" x2="34" y2="32" stroke="#7c3aed" strokeWidth="1.5" />
      <rect x="34" y="26" width="20" height="12" rx="2" fill="#7c3aed" opacity="0.7" />
      <text x="36" y="35" fontSize="6" fill="white" opacity="0.9">Output</text>
      <line x1="44" y1="38" x2="44" y2="44" stroke="#c4b5fd" strokeWidth="1" />
      <rect x="34" y="44" width="20" height="12" rx="2" fill="#7c3aed" opacity="0.5" />
      <text x="36" y="53" fontSize="6" fill="white" opacity="0.9">Reward</text>
      <line x1="34" y1="50" x2="26" y2="50" stroke="#7c3aed" strokeWidth="1" />
      <line x1="26" y1="50" x2="17" y2="38" stroke="#7c3aed" strokeWidth="1.5" strokeDasharray="2 2" />
      <text x="3" y="50" fontSize="6" fill="#7c3aed" opacity="0.6">↻ RL</text>
    </svg>
  ),
  'nb-10': ( // Knowledge distillation — teacher → student
    <svg width="60" height="60" viewBox="0 0 60 60" className="opacity-80">
      <rect x="14" y="4" width="32" height="14" rx="3" fill="#e11d48" opacity="0.7" />
      <text x="18" y="14" fontSize="7" fill="white" fontWeight="bold" opacity="0.9">Teacher</text>
      <line x1="22" y1="18" x2="15" y2="36" stroke="#fda4af" strokeWidth="1.5" strokeDasharray="3 2" />
      <line x1="30" y1="18" x2="30" y2="36" stroke="#e11d48" strokeWidth="1.5" strokeDasharray="3 2" />
      <line x1="38" y1="18" x2="45" y2="36" stroke="#fda4af" strokeWidth="1.5" strokeDasharray="3 2" />
      <text x="24" y="29" fontSize="6" fill="#e11d48" opacity="0.7">logits</text>
      <rect x="14" y="36" width="32" height="14" rx="3" fill="#e11d48" opacity="0.4" />
      <text x="18" y="46" fontSize="7" fill="white" opacity="0.9">Student</text>
      <line x1="30" y1="50" x2="30" y2="54" stroke="#e11d48" strokeWidth="1" />
      <circle cx="30" cy="56" r="2" fill="#e11d48" opacity="0.6" />
    </svg>
  ),
}

function ReaderLetterModal({ isOpen, onClose, lang }) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const isZh = lang === 'zh'
  const title = isZh ? '给读者的一封信' : 'A Letter to Readers'
  const eyebrow = isZh ? '开始之前，先看清这条路会带你去哪' : 'Before you start, see where this path leads'
  const intro = isZh
    ? '亲爱的读者：你好。在正式开始之前，我想简单聊聊，做这套教程的初衷。'
    : 'This tutorial answers one concrete question: how does a large model grow from data, code, and training instead of mysterious terminology?'
  const sections = isZh ? [
    {
      heading: null,
      items: [
        '现在想学大模型的人越来越多，大家每天都会接触到各式各样的名词：Token、Transformer、RLHF、MoE。看得多、搜得多，但大多只是零散的碎片，心里始终差一条完整的主线。市面上的开源内容与教程，大多只截取片段环节，要么只讲理论、要么只有零散代码，几乎没有一套能覆盖从底层原理、完整训练到落地部署的全流程详细指南，更少有兼顾现代前沿架构与工程落地的系统性教程。',
      ],
    },
    {
      heading: null,
      items: [
        '这也让很多人卡在同一个尴尬的状态：会跑代码、会调开源模型，却始终搞不懂，大模型究竟如何从零搭建、训练迭代、一步步进化成型。',
      ],
    },
    {
      heading: null,
      items: [
        '我会和你一起走过一条完整的大模型知识链路：既吃透底层基础，也看懂当下前沿。从 Token、Embedding、Transformer 核心结构，再到 RoPE、GQA、SwiGLU、KV Cache 等现代 GPT 进阶组件，吃透 MoE 稀疏路由、负载均衡逻辑，掌握多词预测推理加速与 OPD 蒸馏。不求速成，只求通透。',
      ],
    },
    {
      heading: null,
      items: [
        '学完这套内容，你不再只是被人说“只会套用模型”的菜鸟。你比你想象的更强：仅需一张 24G 显卡，你就能独立完成数据清洗、PT、SFT，训练 Dense 和 MoE 架构模型，在同等参数量下跑出不错的效果，真正拥有属于自己的完整大模型。',
      ],
    },
    {
      heading: null,
      items: [
        '非常感谢你愿意翻开这篇前言，愿意沉下心深耕底层、吃透原理。也许，未来预测出下一代模型架构的人会是你，探索出 AI 全新落地可能的人会是你，让机器真正拥有拟人思考能力的突破，也终将由你带来。',
      ],
    },
    {
      heading: null,
      items: [
        '大语言模型终将重塑人类的生活与思考方式，站在这场技术变革的浪潮里，在历史的面前，比起害怕，不如鼓起勇气尽情享受，祝你与我在探索的路途上好运！',
      ],
    },
  ] : [
    {
      heading: 'What you will walk through',
      items: [
        'Start from Token, Tokenizer, BPE, and Embedding: how text becomes numbers a model can compute.',
        'Hand-build Position Encoding, Self-Attention, Transformer Blocks, Mini-GPT, and a BERT Encoder.',
        'Upgrade toward modern GPT architecture: RMSNorm, RoPE, GQA, SwiGLU, KV Cache, MLA, and more.',
        'Understand model configs, training loss, scaling laws, data engineering, distributed training, LoRA, function calling, and RLHF.',
        'Implement MoE routers, experts, and load-balancing loss to see why sparse models can grow stronger under similar compute.',
        'Move into inference: generation, acceleration, quantization, speculative decoding, and inference systems.',
        'Then study long context, CoT, VLM, efficient attention, evaluation, distillation, deployment, and online OPD.',
      ],
    },
    {
      heading: 'What you will have at the end',
      items: [
        'A complete from-zero model path: clean data yourself, then run PT and SFT training yourself.',
        'Working dense and MoE model implementations, with an understanding of why each module exists.',
        'A practical sense of how to train models near the advanced level for the same parameter scale, beyond toy demos.',
        'A mental map for new papers and systems: whether they change data, architecture, optimization, inference, or evaluation.',
        'After this, foundational questions should no longer block you from learning deeper LLM internals.',
      ],
    },
    {
      heading: 'How to study it',
      items: [
        'Read the intuition first, verify with small numbers, then run the code and inspect the output.',
        'When stuck, ask what problem the component solves and what shapes flow in and out.',
        'Use AI for hints and direction checks, but still edit code, run experiments, and observe behavior yourself.',
      ],
    },
  ]

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card" style={{ maxWidth: 760, maxHeight: '86vh' }}>
        <div className="modal-header">
          <div className="min-w-0">
            <div className="text-[10px] sm:text-[11px] font-extrabold tracking-[0.12em] uppercase text-blue-600 mb-1">
              {eyebrow}
            </div>
            <h2>{title}</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label={isZh ? '关闭' : 'Close'}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="modal-body">
          <div className="space-y-6 text-[13px] sm:text-sm leading-7 text-[var(--text-secondary)]">
            <p className="text-base sm:text-lg leading-8 font-bold text-[var(--text-primary)]">
              {intro}
            </p>

            {sections.map((section, idx) => (
              <section key={section.heading || idx} className="space-y-3">
                {section.heading && (
                  <h3 className="text-[15px] sm:text-base font-extrabold text-[var(--text-primary)]">
                    {section.heading}
                  </h3>
                )}
                <div className="space-y-2.5">
                  {section.items.map((item) => (
                    <div key={item} className="flex gap-2.5">
                      {section.heading && <Check className="w-4 h-4 mt-1 text-blue-600 shrink-0" />}
                      <p>{item}</p>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {!isZh && (
              <div className="rounded-2xl border border-blue-200/70 bg-blue-50/80 p-4 text-blue-900">
                <p className="font-bold">
                  In one sentence: this is not an API tour, but a path to open up, modify, train, and evaluate an LLM system from the inside.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Welcome({ catalog, lang, onLanguageChange, onSelect, onStartTour }) {
  const [starCount, setStarCount] = useState(null)
  const [isLetterOpen, setIsLetterOpen] = useState(false)
  const catalogById = new Map(catalog.map(item => [item.id, item]))

  useEffect(() => {
    let cancelled = false

    const cachedCount = window.localStorage.getItem(GITHUB_STARS_CACHE_KEY)
    if (cachedCount !== null) {
      const parsedCount = Number(cachedCount)
      if (Number.isFinite(parsedCount)) {
        setStarCount(parsedCount)
      }
    }

    fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`GitHub API status: ${response.status}`)
        }
        return response.json()
      })
      .then((repo) => {
        if (cancelled || typeof repo.stargazers_count !== 'number') return
        setStarCount(repo.stargazers_count)
        window.localStorage.setItem(GITHUB_STARS_CACHE_KEY, String(repo.stargazers_count))
      })
      .catch(() => {
        // GitHub API 偶尔会被限流；页面保留缓存或占位即可。
      })

    return () => {
      cancelled = true
    }
  }, [])

  const t = lang === 'zh' ? {
    bannerBadge: '面向未来的 LLM 学习方式',
    bannerTitleLine1: '动手实践大模型，',
    bannerTitleLine2: '从原理到应用。',
    bannerDesc: 'Modern LLM Notebook 通过交互式 Notebook，带你深入理解 LLM 的核心技术与前沿应用。',
    startBtn: '开始学习',
    browsePath: '浏览学习路径',
    readerLetter: '给读者的一封信',
    readerLetterDesc: '给读者们的一封信',
    runHintTitle: '每篇 Notebook 都可以直接运行',
    runHintDesc: '进入章节后，点击顶部按钮即可在 ModelScope 或 Colab 中打开，无需本地配置。',
    check1: '交互式 Notebook', check2: '逐步构建知识', check3: '代码即文档', check4: '实验即理解',
    learningPathTitle: '学习路径',
    learningPathSub: '科学规划，逐步深入',
    viewAllPaths: '查看全部路径',
    runnableNotebooksTitle: '可运行的 Notebook',
    runnableNotebooksSub: '精选推荐，点击即可开始学习',
    allNotebooksLink: '全部 Notebook',
    footerQuote: '"构建是最好的学习方式。" — Modern LLM Notebook',
    feature1: '可运行 Notebook', feature1d: '浏览器中渲染，无需配置',
    feature2: '从原理到实践', feature2d: '由浅入深，循序渐进',
    feature3: '模型结构可视化', feature3d: '代码级图解，直观易懂',
    feature4: '中英双语支持', feature4d: '专业术语对照，双语切换',
    feature5: '面向未来', feature5d: '紧跟前沿，持续更新',
    sponsorsTitle: '合作方',
    sponsorsSub: '本项目由以下合作方提供计算资源与技术支持',
    amdDesc: 'GPU 计算资源支持',
    modelscopeDesc: '模型托管与开源支持',
  } : {
    bannerBadge: 'Future-Ready LLM Learning Method',
    bannerTitleLine1: 'Practice Large Models,',
    bannerTitleLine2: 'From Theory to App.',
    bannerDesc: 'Modern LLM Notebook guides you deep into core LLM concepts and breakthrough applications via interactive Notebooks.',
    startBtn: 'Start Learning',
    browsePath: 'Browse Pathways',
    readerLetter: 'A Letter to Readers',
    readerLetterDesc: 'See the full route, final builds, and skills you will gain',
    runHintTitle: 'Run every Notebook online',
    runHintDesc: 'Open a chapter, then use the top buttons to launch it in ModelScope or Colab. No local setup needed.',
    check1: 'Interactive Notebook', check2: 'Step-by-step Knowledge', check3: 'Code as Document', check4: 'Understand via Experiments',
    learningPathTitle: 'Learning Paths',
    learningPathSub: 'Structured curriculum, progress step-by-step',
    viewAllPaths: 'View All Paths',
    runnableNotebooksTitle: 'Runnable Notebooks',
    runnableNotebooksSub: 'Selected recommendations, click to start learning',
    allNotebooksLink: 'All Notebooks',
    footerQuote: '"The best way to learn is to build." — Modern LLM Notebook',
    feature1: 'Runnable Notebooks', feature1d: 'Rendered in browser, no setup needed',
    feature2: 'Theory to Practice', feature2d: 'Step-by-step progress',
    feature3: 'Structure Visuals', feature3d: 'Code-level diagrams, intuitive',
    feature4: 'Bilingual Support', feature4d: 'Bilingual toggle & index',
    feature5: 'Future Oriented', feature5d: 'Up-to-date documentation',
    sponsorsTitle: 'Partners',
    sponsorsSub: 'Compute resources and technical support provided by our partners',
    amdDesc: 'GPU Compute Resources',
    modelscopeDesc: 'Model Hub & Open Source',
  }

  const scrollToPath = () => {
    const el = document.getElementById('learning-path-section')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 max-w-7xl w-full mx-auto">

        {/* HERO BANNER */}
        <section className="hero rounded-3xl p-6 md:p-10 relative overflow-hidden shadow-sm border bg-gradient-to-br from-[#ebf3fe]/90 via-[#f1f6ff] to-[#f8faff] border-blue-100/50">
          <div className="absolute top-[-20%] right-[-10%] w-[350px] h-[350px] rounded-full bg-blue-400/10 blur-[80px] pointer-events-none"></div>
          <div className="absolute bottom-[-10%] left-[20%] w-[250px] h-[250px] rounded-full bg-indigo-300/10 blur-[60px] pointer-events-none"></div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#edf4ff] text-blue-600 border border-blue-200/50 shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
                <span>{t.bannerBadge}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-[46px] font-extrabold tracking-tight text-slate-900 leading-[1.2]">
                {t.bannerTitleLine1}
                <br className="hidden md:inline" />
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {t.bannerTitleLine2}
                </span>
              </h1>

              <p className="text-xs sm:text-sm md:text-base leading-relaxed text-[var(--text-muted)] max-w-xl">
                {t.bannerDesc}
              </p>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2">
                <button
                  onClick={() => onSelect('01-tokenizer-basics')}
                  className="h-10 sm:h-12 px-5 sm:px-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center gap-2"
                >
                  <span>{t.startBtn}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={scrollToPath}
                  className="h-10 sm:h-12 px-5 sm:px-6 rounded-full bg-white hover:bg-[var(--bg-input)] text-slate-700 border border-[var(--border-light)]/90 font-bold text-xs sm:text-sm active:scale-[0.98] transition-all"
                >
                  {t.browsePath}
                </button>
                <button
                  onClick={() => setIsLetterOpen(true)}
                  className="group h-10 sm:h-12 px-3 sm:px-4 rounded-xl border border-blue-200/80 bg-white/85 hover:bg-white shadow-sm hover:shadow-md transition-all active:scale-[0.99] flex items-center gap-2"
                >
                  <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 whitespace-nowrap">
                    {t.readerLetter}
                  </span>
                  <ChevronRight className="w-4 h-4 text-blue-600 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </button>
              </div>

              <div className="flex items-start gap-3 max-w-xl rounded-2xl border border-blue-200/80 bg-white/75 px-3.5 py-3 shadow-sm">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <ExternalLink className="h-4 w-4" strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug">
                    {t.runHintTitle}
                  </p>
                  <p className="mt-1 text-[10px] sm:text-xs leading-relaxed text-[var(--text-muted)]">
                    {t.runHintDesc}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-2 sm:gap-y-3 border-t border-[var(--border-light)]/50 pt-4 sm:pt-5 max-w-lg select-none">
                {[t.check1, t.check2, t.check3, t.check4].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-[var(--text-muted)]">
                    <div className="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                      <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[2.5]" />
                    </div>
                    <span className="truncate">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column: floating glass windows — hidden on small screens to prevent overflow */}
            <div className="hidden lg:flex lg:col-span-5 relative min-h-[300px] items-center justify-center select-none">
              <div className="absolute w-[280px] h-[190px] rounded-2xl glass-effect shadow-xl p-4 border border-white/60 left-[5%] top-[10%] animate-float-1 z-10 overflow-hidden">
                <div className="flex items-center justify-between mb-3 border-b border-[var(--border-light)]/40 pb-1.5">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">inference.py</span>
                </div>
                <pre className="font-mono text-[10px] text-[var(--text-secondary)] space-y-0.5">
                  <div><span className="text-purple-600 font-bold">import</span> torch</div>
                  <div className="text-slate-300"># autoregressive search</div>
                  <div><span className="text-blue-600 font-bold">def</span> <span className="text-indigo-600 font-bold">generate</span>(inputs, max_len=50):</div>
                  <div>  <span className="text-blue-600 font-bold">for</span> _ <span className="text-blue-600 font-bold">in</span> <span className="text-purple-600">range</span>(max_len):</div>
                  <div>    logits = model(inputs)</div>
                  <div>    next_tok = torch.argmax(logits[-1], -1)</div>
                  <div>    inputs = torch.cat([inputs, next_tok])</div>
                  <div>  <span className="text-blue-600 font-bold">return</span> inputs</div>
                </pre>
              </div>

              <div className="absolute w-[260px] h-[170px] rounded-2xl glass-effect shadow-lg p-3.5 border border-white/60 right-0 bottom-[5%] animate-float-2 z-0">
                <div className="flex justify-between items-center text-[9px] font-semibold text-[var(--text-muted)] mb-2">
                  <span className="font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-500" />
                    Attention Map
                  </span>
                  <span>Head 1</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                  {[
                    "bg-blue-600/30 border border-blue-600/10", "bg-purple-600/70 border border-purple-600/10", "bg-indigo-600/10 border border-indigo-600/10", "bg-blue-600/20 border border-blue-600/10",
                    "bg-blue-600/10 border border-blue-600/10", "bg-indigo-600/40 border border-indigo-600/10", "bg-purple-600/90 border border-purple-600/10", "bg-purple-600/15 border border-purple-600/10",
                    "bg-indigo-600/60 border border-indigo-600/10", "bg-purple-600/20 border border-purple-600/10", "bg-blue-600/10 border border-blue-600/10", "bg-indigo-600/80 border border-indigo-600/10",
                    "bg-purple-600/15", "bg-indigo-600/10", "bg-blue-600/50", "bg-purple-600/40"
                  ].map((cls, j) => (
                    <div key={j} className={`h-5 rounded-md ${cls}`}></div>
                  ))}
                </div>
              </div>

              <div className="absolute top-[5%] right-[25%] bg-white/80 p-2.5 rounded-full shadow-md animate-float-3 border border-white/50 z-10">
                <CodeXml className="w-4.5 h-4.5 text-blue-600" />
              </div>
              <div className="absolute bottom-[20%] left-[20%] bg-white/85 p-2 rounded-xl shadow-md animate-float-1 border border-white/50 z-20">
                <Rocket className="w-4 h-4 text-purple-600" />
              </div>
            </div>
          </div>
        </section>

        {/* STATS BAR */}
        <section className="stats grid grid-cols-[repeat(auto-fit,minmax(min(100%,190px),1fr))] bg-[var(--bg-sidebar)] rounded-2xl border border-black/10 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 md:p-6 flex items-center gap-3 sm:gap-4 hover:bg-[var(--bg-input)]/45 transition-colors">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[var(--bg-input)] text-[var(--text-muted)] flex items-center justify-center border border-[var(--border-light)]/50 shrink-0">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.5]" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--text-primary)] tracking-tight leading-none">23+</div>
              <div className="text-[10px] sm:text-[11px] font-medium text-[var(--text-label)] leading-snug break-words">{lang === 'zh' ? '可运行 Notebook' : 'Runnable Notebooks'}</div>
            </div>
          </div>
          <div className="p-4 sm:p-5 md:p-6 flex items-center gap-3 sm:gap-4 hover:bg-[var(--bg-input)]/45 transition-colors">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[var(--bg-input)] text-[var(--text-muted)] flex items-center justify-center border border-[var(--border-light)]/50 shrink-0">
              <Layers className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.5]" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--text-primary)] tracking-tight leading-none">5</div>
              <div className="text-[10px] sm:text-[11px] font-medium text-[var(--text-label)] leading-snug break-words">{lang === 'zh' ? '学习路径' : 'Learning Paths'}</div>
            </div>
          </div>
          <div className="p-4 sm:p-5 md:p-6 flex items-center gap-3 sm:gap-4 hover:bg-[var(--bg-input)]/45 transition-colors">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[var(--bg-input)] text-[var(--text-muted)] flex items-center justify-center border border-[var(--border-light)]/50 shrink-0">
              <Cpu className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.5]" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--text-primary)] tracking-tight leading-none">20+</div>
              <div className="text-[10px] sm:text-[11px] font-medium text-[var(--text-label)] leading-snug break-words">{lang === 'zh' ? '核心模块' : 'Core Modules'}</div>
            </div>
          </div>
          <div className="p-4 sm:p-5 md:p-6 flex items-center gap-3 sm:gap-4 hover:bg-[var(--bg-input)]/45 transition-colors">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[var(--bg-input)] text-[var(--text-muted)] flex items-center justify-center border border-[var(--border-light)]/50 shrink-0">
              <Star className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.5]" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--text-primary)] tracking-tight leading-none">{formatStarCount(starCount)}</div>
              <div className="text-[10px] sm:text-[11px] font-medium text-[var(--text-label)] leading-snug break-words">{lang === 'zh' ? '开源社区支持' : 'Open Source Community'}</div>
            </div>
          </div>
        </section>

        {/* FEATURES STRIP */}
        <section data-tour="features" className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,180px),1fr))] bg-[var(--bg-sidebar)] rounded-2xl border border-black/10 shadow-sm p-3 sm:p-4 gap-3 sm:gap-4">
          {[
            { icon: <Monitor className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2]" />, title: t.feature1, desc: t.feature1d },
            { icon: <ArrowRight className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />, title: t.feature2, desc: t.feature2d },
            { icon: <Layers className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2]" />, title: t.feature3, desc: t.feature3d },
            { icon: <Languages className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2]" />, title: t.feature4, desc: t.feature4d },
            { icon: <Rocket className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2]" />, title: t.feature5, desc: t.feature5d },
          ].map((f, i) => (
            <div key={i} className="p-1.5 sm:p-2 flex items-start gap-2.5 sm:gap-3.5">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border shrink-0 bg-[var(--bg-input)] text-[var(--text-muted)] border-[var(--border-light)]/50">{f.icon}</div>
              <div className="space-y-0.5 min-w-0">
                <h3 className="text-[11px] sm:text-[13px] font-bold text-[var(--text-primary)] leading-snug break-words">{f.title}</h3>
                <p className="text-[10px] sm:text-[11px] text-[var(--text-label)] font-medium leading-normal break-words">{f.desc}</p>
              </div>
            </div>
          ))}
        </section>

        {/* LEARNING PATH */}
        <section id="learning-path-section" className="parts bg-[var(--bg-sidebar)] rounded-2xl border border-black/10 shadow-sm p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-[18px] md:text-[20px] font-bold text-[var(--text-primary)]">{t.learningPathTitle}</h2>
              <p className="text-xs text-[var(--text-muted)] font-medium">{t.learningPathSub}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 relative">
            {PATH_STEPS.map((step, idx) => {
              const ps = PATH_STEP_STYLES[idx]
              return (
              <div key={idx} className="relative flex items-center w-full">
                <div
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('sidebar-scroll-to', { detail: { section: step.section } }))
                  }}
                  className="w-full bg-white rounded-[10px] p-3 sm:p-4 border border-black/10 flex flex-col justify-between shadow-sm relative hover:bg-slate-50 transition-colors duration-200 cursor-pointer group overflow-hidden"
                >
                  <span className={`text-[11px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded ${ps.numBg} w-fit`}>{step.num}</span>
                  <div className="space-y-1 mt-2 sm:mt-3">
                    <h3 className="text-[12px] sm:text-[13px] font-semibold text-slate-700 group-hover:text-[#1d6bf3] transition-colors">{lang === 'zh' ? step.title : step.titleEn}</h3>
                    <p className="text-[10px] sm:text-[11px] text-[var(--text-muted)] leading-normal line-clamp-2">{lang === 'zh' ? step.desc : step.descEn}</p>
                  </div>
                </div>

                {idx < PATH_STEPS.length - 1 && (
                  <div className="hidden lg:flex absolute right-[-14px] top-1/2 -translate-y-1/2 z-10 pointer-events-none items-center justify-center text-slate-200 w-6">
                    <div className="w-full border-t-2 border-dashed border-[var(--border-light)]/80"></div>
                    <div className="w-2.5 h-2.5 rounded-full border-2 border-[var(--border-light)] bg-white absolute"></div>
                  </div>
                )}
              </div>
              )
            })}
          </div>
        </section>

        {/* RUNNABLE NOTEBOOKS */}
        <section data-tour="notebooks" className="bg-[var(--bg-sidebar)] rounded-2xl border border-black/10 shadow-sm p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-[18px] md:text-[20px] font-bold text-[var(--text-primary)]">{t.runnableNotebooksTitle}</h2>
              <p className="text-xs text-[var(--text-muted)] font-medium">{t.runnableNotebooksSub}</p>
            </div>
          </div>

          <div className="flex gap-3.5 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin">
            {RUNNABLE_NOTEBOOKS.map((nb) => {
              const style = SECTION_STYLES[nb.section] || SECTION_STYLES.foundation
              const notebookMeta = catalogById.get(nb.lessonId)
              const notebookTitle = notebookMeta?.title || (lang === 'zh' ? nb.title : nb.titleEn)
              return (
                <div
                  key={nb.id}
                  onClick={() => onSelect(nb.lessonId)}
                  className="shrink-0 w-[180px] sm:w-[200px] border border-black/10 rounded-[10px] overflow-hidden cursor-pointer bg-white relative hover:bg-slate-50 transition-colors duration-200 group flex flex-col snap-start"
                >
                  <div className={`h-[90px] flex items-center justify-center relative overflow-hidden bg-gradient-to-br ${NOTEBOOK_BG[nb.id] || style.bg}`}>
                    {NOTEBOOK_SVGS[nb.id] || NOTEBOOK_SVGS['nb-1']}
                  </div>
                  <div className="p-3 bg-white flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-[12px] font-semibold text-[var(--text-primary)] group-hover:text-[#1d6bf3] transition-colors mb-1 line-clamp-1">{notebookTitle}</h4>
                      <p className="text-[11px] text-[var(--text-label)] line-clamp-1 leading-relaxed">{lang === 'zh' ? nb.desc : nb.descEn}</p>
                    </div>
                    <div className="flex items-center justify-between text-[10px] mt-2">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${style.tag}`}>
                        {lang === 'zh' ? style.nameZh : style.nameEn}
                      </span>
                      <span className="text-[var(--text-label)] font-medium">{nb.duration}{lang === 'zh' ? '分钟' : 'm'}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* SPONSORS */}
        <section className="bg-[var(--bg-sidebar)] rounded-2xl border border-black/10 shadow-sm p-5 md:p-6 space-y-4">
          <div className="space-y-0.5">
            <h2 className="text-[18px] md:text-[20px] font-bold text-[var(--text-primary)]">{t.sponsorsTitle}</h2>
            <p className="text-xs text-[var(--text-muted)] font-medium">{t.sponsorsSub}</p>
          </div>

          <div className="flex flex-wrap items-stretch gap-3">
            <a
              href="https://www.amd.com/en/products/accelerators/instinct.html"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 px-4 sm:px-5 py-3 sm:py-3.5 bg-white rounded-xl border border-black/10 hover:border-black/20 hover:shadow-md transition-all"
            >
              <svg width="84" height="20" viewBox="0 0 512 123" className="shrink-0 text-[var(--text-primary)]" aria-hidden="true" fill="currentColor">
                <path d="M120.415 114.002H91.868L83.184 93.04H35.839L27.923 114H0L42.654 8.172h30.562zM58.522 33.383L42.838 74.61h32.577zM223.386 8.172h22.976v105.83h-26.384v-65.96l-28.546 33.2h-4.03l-28.547-33.347v65.96H132.47V8.172h22.976l33.97 39.356zm89.816 0c38.624 0 58.632 24.039 58.632 53.061c0 30.415-19.239 52.769-61.453 52.769h-43.9V8.172zm-20.337 86.445h17.223c26.53 0 34.446-17.993 34.446-33.53c0-18.323-9.785-33.53-34.74-33.53h-16.93zm131.261-54.674v47.931h47.931l-34.226 34.263H389.9V74.169zM512 0v121.11l-33.273-33.273V33.273h-54.564L390.926 0z" />
              </svg>
              <div className="border-l border-[var(--border-light)] pl-3 sm:pl-4 hidden sm:block">
                <div className="text-[11px] font-bold text-[var(--text-primary)] leading-tight">AMD Instinct™</div>
                <div className="text-[10px] text-[var(--text-muted)] mt-0.5 leading-tight">{t.amdDesc}</div>
              </div>
            </a>

            <a
              href="https://modelscope.cn"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-3.5 bg-white rounded-xl border border-black/10 hover:border-black/20 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-2 text-[var(--text-primary)]">
                <svg width="22" height="22" viewBox="0 0 24 24" className="shrink-0" aria-hidden="true" fill="currentColor">
                  <path d="M2.667 5.3H8v2.667H5.333v2.666H2.667V8.467H.5v2.166h2.167V13.3H0V7.967h2.667V5.3zM2.667 13.3h2.666v2.667H8v2.666H2.667V13.3zM8 10.633h2.667V13.3H8v-2.667zM13.333 13.3v2.667h-2.666V13.3h2.666zM13.333 13.3v-2.667H16V13.3h-2.667z" />
                  <path fillRule="evenodd" clipRule="evenodd" d="M21.333 13.3v-2.667h-2.666V7.967H16V5.3h5.333v2.667H24V13.3h-2.667zm0-2.667H23.5V8.467h-2.167v2.166z" />
                  <path d="M21.333 13.3v5.333H16v-2.666h2.667V13.3h2.666z" />
                </svg>
                <span className="text-base font-bold tracking-tight leading-none">ModelScope</span>
              </div>
              <div className="border-l border-[var(--border-light)] pl-3 sm:pl-4 hidden sm:block">
                <div className="text-[11px] font-bold text-[var(--text-primary)] leading-tight">{lang === 'zh' ? '魔搭社区' : 'Community'}</div>
                <div className="text-[10px] text-[var(--text-muted)] mt-0.5 leading-tight">{t.modelscopeDesc}</div>
              </div>
            </a>
          </div>
        </section>

        {/* FOOTER */}
        <div className="w-full flex items-center justify-center pt-2 pb-6 select-none">
          <span className="text-xs text-[var(--text-label)] tracking-wide">{t.footerQuote}</span>
        </div>
        <ReaderLetterModal
          isOpen={isLetterOpen}
          onClose={() => setIsLetterOpen(false)}
          lang={lang}
        />
    </div>
  )
}
