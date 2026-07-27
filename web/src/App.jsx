import { useState, useEffect, useCallback, useRef } from 'react'
import { flushSync } from 'react-dom'
import { PanelLeftOpen } from 'lucide-react'
import Sidebar from './components/Sidebar.jsx'
import NotebookViewer from './components/NotebookViewer.jsx'
import NotesPanel from './components/NotesPanel.jsx'
import Welcome from './components/Welcome.jsx'
import GuidedTour from './components/GuidedTour.jsx'
import SettingsPanel from './components/SettingsPanel.jsx'
import ChangelogModal from './components/ChangelogModal.jsx'
import WalkingLabsModal from './components/WalkingLabsModal.jsx'
import { SettingsProvider } from './context/SettingsContext.jsx'
import useSettings from './hooks/useSettings.js'
import useTheme from './hooks/useTheme.js'
import useNotesAndBookmarks from './hooks/useNotesAndBookmarks.js'
import { getCatalog, getNotebook, getCachedNotebook, prefetchNotebook } from './data/notebooks.js'

const NOTES_SENTINEL = '__notes__'

const DEFAULT_LANG = 'zh'

const LEGACY_NOTEBOOK_IDS = {
  // embedding 历史: 03-embedding-position → 03-embedding
  '03-embedding-position': '03-embedding',

  // transformer-block: 04 → 05
  '04-transformer-block': '05-transformer-block',

  // mini-gpt: 04 → 05 → 06
  '04-mini-gpt': '06-mini-gpt',
  '05-mini-gpt': '06-mini-gpt',

  // gpt2-to-modern-models / 现代架构: 05 → 06 → 08
  '05-architecture-refinements': '08-gpt2-to-modern-models',
  '06-architecture-refinements': '08-gpt2-to-modern-models',
  '06-llama-architecture-upgrades': '08-gpt2-to-modern-models',
  '06-gpt2-to-modern-models': '08-gpt2-to-modern-models',

  // bert-encoder: 08 → 07
  '08-bert-encoder': '07-bert-encoder',

  // moe: 06 → 07 → 10
  '06-moe': '10-moe',
  '07-moe': '10-moe',

  // training-loss: 08 → 09 → 11
  '08-training-loss': '11-training-loss',
  '09-training-loss': '11-training-loss',

  // scaling-laws: 09 → 10 → 12
  '09-scaling-laws': '12-scaling-laws',
  '10-scaling-laws': '12-scaling-laws',

  // data-engineering: 10 → 11 → 13 → 14
  '10-data-engineering': '14-data-engineering',
  '11-data-engineering': '14-data-engineering',
  '13-data-engineering': '14-data-engineering',

  // lora: 11 → 12 → 14 → 15
  '11-lora': '15-lora',
  '12-lora': '15-lora',
  '14-lora': '15-lora',

  // function-calling / midtraining-cpt: 12 → 13 → 15 → 16
  '12-midtraining-cpt': '16-function-calling',
  '13-midtraining-cpt': '16-function-calling',
  '15-midtraining-cpt': '16-function-calling',

  // rlhf-alignment: 13 → 14 → 16 → 17
  '13-rlhf-alignment': '17-rlhf-alignment',
  '14-rlhf-alignment': '17-rlhf-alignment',
  '16-rlhf-alignment': '17-rlhf-alignment',

  // mla-kv-cache: 29 → 18
  '29-mla-kv-cache': '18-mla-kv-cache',

  // generation: 13 → 15 → 17 → 18 → 19
  '13-generation': '19-generation',
  '15-generation': '19-generation',
  '17-generation': '19-generation',
  '18-generation': '19-generation',

  // inference-acceleration: 14 → 16 → 18 → 19 → 20
  '14-inference-acceleration': '20-inference-acceleration',
  '16-inference-acceleration': '20-inference-acceleration',
  '18-inference-acceleration': '20-inference-acceleration',
  '19-inference-acceleration': '20-inference-acceleration',

  // quantization: 19 → 20 → 21
  '19-quantization': '21-quantization',
  '20-quantization': '21-quantization',

  // speculative-decoding: 15 → 17 → 19 → 21 → 22
  '15-speculative-decoding': '22-speculative-decoding',
  '17-speculative-decoding': '22-speculative-decoding',
  '19-speculative-decoding': '22-speculative-decoding',
  '21-speculative-decoding': '22-speculative-decoding',

  // inference-systems: 30 → 23
  '30-inference-systems': '23-inference-systems',

  // long-context: 16 → 18 → 20 → 22 → 24
  '16-long-context': '24-long-context',
  '18-long-context': '24-long-context',
  '20-long-context': '24-long-context',
  '22-long-context': '24-long-context',

  // cot-thinking: 17 → 19 → 21 → 23 → 25
  '17-cot-thinking': '25-cot-thinking',
  '19-cot-thinking': '25-cot-thinking',
  '21-cot-thinking': '25-cot-thinking',
  '23-cot-thinking': '25-cot-thinking',

  // vlm: 18 → 20 → 22 → 24 → 26
  '18-vlm': '26-vlm',
  '20-vlm': '26-vlm',
  '22-vlm': '26-vlm',
  '24-vlm': '26-vlm',

  // efficient-attention: 由 31-linear-attention + 32-sparse-attention 合并而来
  '31-linear-attention': '27-efficient-attention',
  '32-sparse-attention': '27-efficient-attention',

  // evaluation: 19 → 21 → 23 → 25 → 28
  '19-evaluation': '28-evaluation',
  '21-evaluation': '28-evaluation',
  '23-evaluation': '28-evaluation',
  '25-evaluation': '28-evaluation',

  // distillation: 20 → 22 → 24 → 26 → 29
  '20-distillation': '29-distillation',
  '22-distillation': '29-distillation',
  '24-distillation': '29-distillation',
  '26-distillation': '29-distillation',

  // opd: 21 → 23 → 25 → 27 → 30
  '21-opd': '30-opd',
  '23-opd': '30-opd',
  '25-opd': '30-opd',
  '27-opd': '30-opd',

  // llm-deployment: 26 → 28 → 31
  '26-llm-deployment': '31-llm-deployment',
  '28-llm-deployment': '31-llm-deployment',
}

// 从构建时注入的 git log 数据中读取
const CHANGELOG_COMMITS = typeof __CHANGELOG_COMMITS__ !== 'undefined' ? __CHANGELOG_COMMITS__ : []

function normalizeNotebookId(id) {
  return LEGACY_NOTEBOOK_IDS[id] || id
}

function normalizeLang(lang) {
  return lang === 'en' ? 'en' : DEFAULT_LANG
}

function getInitialLang() {
  const params = new URLSearchParams(window.location.search)
  return normalizeLang(params.get('lang') || window.localStorage.getItem('language'))
}

function writeLangToUrl(lang) {
  const params = new URLSearchParams(window.location.search)
  if (lang === DEFAULT_LANG) {
    params.delete('lang')
  } else {
    params.set('lang', lang)
  }
  const query = params.toString()
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`
  window.history.replaceState(null, '', nextUrl)
}

function replaceUrlWithHash(id, lang = DEFAULT_LANG) {
  const params = new URLSearchParams(window.location.search)
  if (lang === DEFAULT_LANG) {
    params.delete('lang')
  } else {
    params.set('lang', lang)
  }
  const query = params.toString()
  const hash = id ? `#${id}` : ''
  window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}${hash}`)
}

function getInitialNotebookId() {
  const hash = window.location.hash.replace(/^#\/?/, '')
  return hash ? normalizeNotebookId(hash) : null
}

function getInitialSidebarOpen() {
  return window.innerWidth >= 768
}

function AppContent() {
  const [lang, setLang] = useState(() => getInitialLang())
  const [catalog, setCatalog] = useState(() => getCatalog(lang))
  const [currentId, setCurrentId] = useState(() => getInitialNotebookId())
  const [notebook, setNotebook] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(() => getInitialSidebarOpen())
  const [tourActive, setTourActive] = useState(false)
  const [tourStepIndex, setTourStepIndex] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [changelogOpen, setChangelogOpen] = useState(false)
  const [walkingLabsOpen, setWalkingLabsOpen] = useState(false)

  const { settings, updateSettings } = useSettings()
  const { resolvedTheme, toggleTheme } = useTheme(settings.theme)
  const nbm = useNotesAndBookmarks()

  // catalog 走 ref,schedulePrefetch 的回调身份就能保持稳定,不会触发下游 effect 重跑
  const catalogRef = useRef(catalog)
  useEffect(() => {
    catalogRef.current = catalog
  }, [catalog])

  // 浏览器空闲时预取下一篇 notebook,点击下一篇时基本秒开
  const schedulePrefetch = useCallback((id, lng) => {
    const list = catalogRef.current
    const idx = list.findIndex(n => n.id === id)
    if (idx < 0) return
    const next = list[idx + 1]
    if (!next) return
    const run = () => prefetchNotebook(next.id, lng)
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(run, { timeout: 2000 })
    } else {
      setTimeout(run, 200)
    }
  }, [])

  // 同步字号到 CSS 变量
  useEffect(() => {
    const sizeMap = { small: '14.5px', default: '16.5px', large: '18.5px' }
    document.documentElement.style.setProperty('--font-size-notebook', sizeMap[settings.fontSize] || '16.5px')
  }, [settings.fontSize])

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 767px)')
    const syncSidebarForMobile = () => {
      if (mobileQuery.matches) setSidebarOpen(false)
    }

    syncSidebarForMobile()
    mobileQuery.addEventListener?.('change', syncSidebarForMobile)
    return () => mobileQuery.removeEventListener?.('change', syncSidebarForMobile)
  }, [])

  useEffect(() => {
    setCatalog(getCatalog(lang))
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN'
    window.localStorage.setItem('language', lang)
    writeLangToUrl(lang)
  }, [lang])

  useEffect(() => {
    let cancelled = false

    if (!currentId || currentId === NOTES_SENTINEL) {
      setNotebook(null)
      setLoading(false)
      return () => {
        cancelled = true
      }
    }

    // 缓存命中:同步 set,跳过 spinner,整次切换无 loading 态
    const cached = getCachedNotebook(currentId, lang)
    if (cached) {
      setNotebook(cached)
      setLoading(false)
      schedulePrefetch(currentId, lang)
      return () => {
        cancelled = true
      }
    }

    // 缓存未命中:第一次访问,只能走异步
    // 不清空旧 notebook —— 保留它直到新 notebook 就绪,避免全屏 spinner 闪一下
    setLoading(true)

    getNotebook(currentId, lang)
      .then((nextNotebook) => {
        if (!cancelled) {
          setNotebook(nextNotebook)
          schedulePrefetch(currentId, lang)
        }
      })
      .catch((error) => {
        console.error(`Failed to load notebook ${currentId}`, error)
        if (!cancelled) {
          setNotebook(null)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [currentId, lang])

  useEffect(() => {
    const syncFromHash = () => {
      const nextId = getInitialNotebookId()
      if (nextId === NOTES_SENTINEL) return
      setCurrentId((prev) => {
        if (prev === nextId) return prev
        return nextId
      })
      if (nextId && window.location.hash !== `#${nextId}`) {
        replaceUrlWithHash(nextId, lang)
      }
    }

    window.addEventListener('hashchange', syncFromHash)
    window.addEventListener('popstate', syncFromHash)
    syncFromHash()
    return () => {
      window.removeEventListener('hashchange', syncFromHash)
      window.removeEventListener('popstate', syncFromHash)
    }
  }, [lang])

  const handleSelect = useCallback((id) => {
    flushSync(() => setCurrentId(id))
    replaceUrlWithHash(id, lang)
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }, [lang])

  const handleLanguageChange = useCallback((nextLang) => {
    setLang(normalizeLang(nextLang))
  }, [])

  const handleHome = useCallback(() => {
    flushSync(() => setCurrentId(null))
    replaceUrlWithHash(null, lang)
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }, [lang])

  const handleOpenNotes = useCallback(() => {
    flushSync(() => setCurrentId(NOTES_SENTINEL))
    replaceUrlWithHash(null, lang)
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }, [lang])

  const currentMeta = catalog.find(n => n.id === currentId)
  const tourNotebookId = catalog.find(n => n.id === '01-tokenizer-basics')?.id || catalog[0]?.id
  const tourCopy = {
    zh: [
      {
        target: '.hero',
        title: '欢迎来到 Modern LLM Notebook',
        body: '这不是 API 调用教程，而是从零重建 LLM 核心系统的交互式课程。你会沿着模型真正运转的顺序，理解文本如何变成 token、参数如何训练、模型如何生成答案。',
      },
      {
        target: '.stats',
        title: '课程规模',
        body: '26 篇可运行 Notebook，覆盖 5 大学习路径、20+ 核心模块。每篇都是可执行代码，读完马上能改代码观察结果。',
      },
      {
        target: '[data-tour="features"]',
        title: '课程特色',
        body: '浏览器内直接渲染 Notebook，无需配置环境。中英双语支持，代码级图解帮助你直观理解模型结构。',
      },
      {
        target: '.parts',
        title: '5 大学习路径',
        body: '这里是整套课程的地图：基础、训练、推理、前沿、评测与部署。每张卡片概括一个阶段要解决的问题，点击后会定位到对应学习路径，方便你从全局选择下一步。',
      },
      {
        target: '[data-tour="notes-saved"]',
        title: '笔记与收藏',
        body: '点击这里可以打开笔记与收藏面板。阅读时你可以收藏 Notebook、选中文字添加笔记或高亮标记，所有内容统一管理，支持导出备份。',
        nextLabel: '打开看看',
        action: 'open-notes',
      },
      {
        target: '.notes-panel',
        title: '笔记与收藏面板',
        body: '这里展示了你所有的收藏和笔记。上方可以按收藏或笔记筛选，每条笔记都会标注出处章节。底部有导出和导入按钮，换浏览器也不怕丢数据。',
      },
      {
        target: '[data-tour="settings"]',
        title: '个性化设置',
        body: '点击齿轮图标打开设置面板，可以切换浅色/深色/跟随系统主题，还能调整正文字号大小。设置会自动保存。',
        nextLabel: '打开看看',
        action: 'open-settings',
      },
      {
        target: '.modal-card',
        title: '设置面板',
        body: '这里可以切换主题：浅色、深色或跟随系统自动切换。下方还能调整正文字号（小/中/大），选择后立即生效，阅读更舒适。',
      },
      {
        target: '[data-tour="walkinglabs"]',
        title: '扫码加入社群',
        body: '点击左上角的「...」按钮，可以打开 WalkingLabs 页面。WalkingLabs 是一个专注于 Agent 技术的开源实验室。',
        nextLabel: '打开看看',
        action: 'open-walkinglabs',
      },
      {
        target: '.modal-card',
        title: '社群与交流',
        body: 'WalkingLabs 专注于 Agent 相关基础建设与教程。扫码加入微信群，和其他开发者一起探讨 Agent 技术、分享实践经验。',
      },
      {
        target: '[data-tour="notebooks"]',
        title: '精选可运行 Notebook',
        body: '这里展示了 10 篇推荐 Notebook，每篇都有独特的可视化封面。点击即可进入阅读，支持一键打开到 ModelScope 或 Colab 运行。',
        nextLabel: '进入 01',
        action: 'open-notebook',
      },
      {
        target: '.viewer-launches',
        title: '一键运行',
        body: '顶部按钮可以把当前 Notebook 打开到 ModelScope 或 Colab，在线运行代码，无需本地配置。',
      },
      {
        target: '.bookmark-star',
        title: '收藏与笔记',
        body: '点击运行按钮左侧的星标可收藏当前 Notebook。所有收藏和笔记在左侧边栏「笔记与收藏」中统一管理，支持导出和导入备份。',
      },
      {
        target: '.viewer-body',
        title: '选中文字即可操作',
        body: '阅读时选中任意文字，会弹出工具栏：复制内容、添加笔记（引用原文 + 你的想法）、黄色高亮标记重点，还能生成精美的分享卡片。',
      },
      {
        target: '.toc',
        title: '右侧大纲导航',
        body: '右侧大纲对应每个学习环节，点击可快速跳转。大纲上的蓝色圆点表示该章节有笔记。推荐阅读顺序：先看直觉理解，再看手算验证，然后运行代码，最后观察输出。',
      },
      {
        target: '.code_cell',
        title: '代码和输出可展开',
        body: '每个核心算法都会落到代码。长代码和长输出默认折叠，点击可展开查看完整内容。右上角按钮可以复制代码。',
      },
      {
        target: '.viewer-header',
        title: '开始你的学习旅程',
        body: '从 01 Tokenizer 开始，一步步搭建你的 LLM 知识体系。每篇 Notebook 都是自包含的，可以按任意顺序阅读。',
      },
    ],
    en: [
      {
        target: '.hero',
        title: 'Welcome to Modern LLM Notebook',
        body: 'This is not an API tutorial. It rebuilds core LLM systems from scratch via interactive notebooks, following the path from text to tokens, training, and generation.',
      },
      {
        target: '.stats',
        title: 'Course Overview',
        body: '27 runnable notebooks across 5 learning paths and 20+ core modules. Every notebook is executable — read, modify, and observe results immediately.',
      },
      {
        target: '[data-tour="features"]',
        title: 'What Makes It Different',
        body: 'Notebooks render directly in your browser with zero setup. Bilingual support and code-level diagrams help you understand model internals intuitively.',
      },
      {
        target: '.parts',
        title: '5 Learning Paths',
        body: 'This is the course map: Foundation, Training, Inference, Frontiers, and Eval & Deploy. Each card summarizes one stage, and clicking a card takes you to that learning path so you can choose the next step from the full curriculum.',
      },
      {
        target: '[data-tour="notes-saved"]',
        title: 'Notes & Bookmarks',
        body: 'Click here to open the notes panel. Bookmark notebooks, highlight text, or add notes while reading. Everything is managed here with export and import support.',
        nextLabel: 'Take a look',
        action: 'open-notes',
      },
      {
        target: '.notes-panel',
        title: 'Notes Panel',
        body: 'All your bookmarks and notes are listed here. Filter by bookmarks or notes using the tabs above. Each note shows its source section. Export and import at the bottom.',
      },
      {
        target: '[data-tour="settings"]',
        title: 'Personalization',
        body: 'Click the gear icon to open settings. Switch between light, dark, and system themes, or adjust the reading font size. Preferences are saved automatically.',
        nextLabel: 'Take a look',
        action: 'open-settings',
      },
      {
        target: '.modal-card',
        title: 'Settings Panel',
        body: 'Switch themes here: light, dark, or follow your system. Below that, adjust the reading font size (S/M/L). Changes take effect immediately.',
      },
      {
        target: '[data-tour="walkinglabs"]',
        title: 'Join the Community',
        body: 'Click the "..." button in the top-left corner to open the WalkingLabs page. WalkingLabs is an open-source lab focused on Agent technology.',
        nextLabel: 'Take a look',
        action: 'open-walkinglabs',
      },
      {
        target: '.modal-card',
        title: 'Community & Discussion',
        body: 'WalkingLabs builds Agent infrastructure and tutorials. Scan the QR code to join the WeChat group and discuss Agent tech with fellow developers.',
      },
      {
        target: '[data-tour="notebooks"]',
        title: 'Runnable Notebooks',
        body: '10 recommended notebooks with unique visual covers. Click to start reading, or open in ModelScope or Google Colab to run code online.',
        nextLabel: 'Open 01',
        action: 'open-notebook',
      },
      {
        target: '.viewer-launches',
        title: 'One-Click Run',
        body: 'The top buttons open the current notebook in ModelScope or Google Colab. Run code online without any local setup.',
      },
      {
        target: '.bookmark-star',
        title: 'Bookmarks & Notes',
        body: 'Click the star to the left of the run buttons to bookmark. All bookmarks and notes are managed in the sidebar under "Notes & Saved", with export and import support.',
      },
      {
        target: '.viewer-body',
        title: 'Select Text to Annotate',
        body: 'Select any text while reading to bring up a toolbar: copy content, add a note (with quote + your thoughts), highlight key points in yellow, or generate a shareable card image.',
      },
      {
        target: '.toc',
        title: 'Table of Contents',
        body: 'The right sidebar outlines each section. Blue dots mark sections with notes. Recommended order: read the intuition first, then hand calculation, then run code, then observe outputs.',
      },
      {
        target: '.code_cell',
        title: 'Expandable Code & Output',
        body: 'Core algorithms land in code. Long code and output blocks are collapsed by default — click to expand. Use the copy button in the top-right corner.',
      },
      {
        target: '.viewer-header',
        title: 'Start Your Journey',
        body: 'Begin with 01 Tokenizer and build your LLM knowledge step by step. Each notebook is self-contained — read in any order.',
      },
    ],
  }
  const tourSteps = tourCopy[lang]

  const startTour = useCallback(() => {
    flushSync(() => {
      setCurrentId(null)
      setSidebarOpen(true)
      setTourStepIndex(0)
      setTourActive(true)
    })
    replaceUrlWithHash(null, lang)
  }, [lang])

  const stopTour = useCallback(() => {
    setTourActive(false)
    setSettingsOpen(false)
    setWalkingLabsOpen(false)
  }, [])

  const handleTourNext = useCallback(() => {
    const step = tourSteps[tourStepIndex]
    if (step?.action === 'open-notebook' && tourNotebookId) {
      flushSync(() => {
        setCurrentId(tourNotebookId)
        setSidebarOpen(true)
      })
      replaceUrlWithHash(tourNotebookId, lang)
    }
    if (step?.action === 'open-notes') {
      flushSync(() => {
        setSettingsOpen(false)
        setWalkingLabsOpen(false)
        setCurrentId(NOTES_SENTINEL)
      })
    }
    if (step?.action === 'open-settings') {
      flushSync(() => {
        setCurrentId(null)
        setWalkingLabsOpen(false)
        setSettingsOpen(true)
      })
    }
    if (step?.action === 'open-walkinglabs') {
      flushSync(() => {
        setCurrentId(null)
        setSettingsOpen(false)
        setWalkingLabsOpen(true)
      })
    }

    if (tourStepIndex >= tourSteps.length - 1) {
      setSettingsOpen(false)
      setWalkingLabsOpen(false)
      setTourActive(false)
      return
    }
    const nextStep = tourSteps[tourStepIndex + 1]
    if (!nextStep?.target?.startsWith('.notes-panel') && !nextStep?.target?.startsWith('.modal-card')) {
      setSettingsOpen(false)
      setWalkingLabsOpen(false)
    }
    setTourStepIndex(i => i + 1)
  }, [lang, tourNotebookId, tourStepIndex, tourSteps])

  const handleTourPrev = useCallback(() => {
    setSettingsOpen(false)
    setWalkingLabsOpen(false)
    setTourStepIndex(i => Math.max(0, i - 1))
  }, [])

  return (
    <div className="h-screen flex overflow-hidden bg-[var(--bg-app)] text-[var(--text-body)] font-sans antialiased">
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="sidebar-toggle-btn"
          aria-label={lang === 'zh' ? '展开左侧栏' : 'Expand sidebar'}
          title={lang === 'zh' ? '展开左侧栏' : 'Expand sidebar'}
        >
          <PanelLeftOpen className="w-5 h-5" />
        </button>
      )}

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-20 bg-black/20 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        catalog={catalog}
        currentId={currentId}
        lang={lang}
        onLanguageChange={handleLanguageChange}
        onSelect={handleSelect}
        onHome={handleHome}
        onStartTour={startTour}
        onOpenNotes={handleOpenNotes}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenChangelog={() => setChangelogOpen(true)}
        onOpenWalkingLabs={() => setWalkingLabsOpen(true)}
        bookmarks={nbm.bookmarks}
        notes={nbm.notes}
        notebooksWithNotes={nbm.notebooksWithNotes}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col h-screen min-w-0 overflow-y-auto">
        {currentId === NOTES_SENTINEL ? (
          <NotesPanel
            catalog={catalog}
            bookmarks={nbm.bookmarks}
            notes={nbm.notes}
            notebooksWithNotes={nbm.notebooksWithNotes}
            getSectionNotes={nbm.getSectionNotes}
            exportData={nbm.exportData}
            importFile={nbm.importFile}
            onClearAll={nbm.clearAll}
            onSelect={handleSelect}
            lang={lang}
          />
        ) : currentId ? (
          <NotebookViewer
            notebook={notebook}
            meta={currentMeta}
            loading={loading}
            isBookmarked={nbm.isBookmarked}
            toggleBookmark={nbm.toggleBookmark}
            notes={nbm.notes}
            saveNote={nbm.saveNote}
            deleteNote={nbm.deleteNote}
            updateNoteSection={nbm.updateNoteSection}
          />
        ) : (
          <Welcome
            catalog={catalog}
            lang={lang}
            onLanguageChange={handleLanguageChange}
            onSelect={handleSelect}
            onStartTour={startTour}
          />
        )}
      </main>

      <GuidedTour
        active={tourActive}
        step={tourSteps[tourStepIndex]}
        stepIndex={tourStepIndex}
        totalSteps={tourSteps.length}
        lang={lang}
        onNext={handleTourNext}
        onPrev={handleTourPrev}
        onClose={stopTour}
      />

      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        lang={lang}
      />

      <ChangelogModal
        isOpen={changelogOpen}
        onClose={() => setChangelogOpen(false)}
        lang={lang}
        commits={CHANGELOG_COMMITS}
      />

      <WalkingLabsModal
        isOpen={walkingLabsOpen}
        onClose={() => setWalkingLabsOpen(false)}
        lang={lang}
      />
    </div>
  )
}

export default function App() {
  const { settings, updateSettings } = useSettings()
  const { resolvedTheme, toggleTheme } = useTheme(settings.theme)

  return (
    <SettingsProvider settings={settings} updateSettings={updateSettings} resolvedTheme={resolvedTheme} toggleTheme={toggleTheme}>
      <AppContent />
    </SettingsProvider>
  )
}
