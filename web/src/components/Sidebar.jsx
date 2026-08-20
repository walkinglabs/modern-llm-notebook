import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import {
  BookMarked,
  Code2,
  GitFork,
  Github,
  GraduationCap,
  History,
  Ellipsis,
  Settings,
  Star,
  StickyNote,
  Sun,
  Moon,
  PanelLeftClose,
} from 'lucide-react'
import { useSettingsContext } from '../context/SettingsContext.jsx'

const SECTION_KEYS = ['foundation', 'training', 'inference', 'frontiers', 'appendix-advanced']
const SECTION_LABELS = {
  foundation: { title: '基础', titleEn: 'FOUNDATION' },
  training: { title: '训练', titleEn: 'TRAINING' },
  inference: { title: '推理', titleEn: 'INFERENCE' },
  frontiers: { title: '前沿', titleEn: 'FRONTIERS' },
  'appendix-advanced': { title: '附录', titleEn: 'APPENDIX' },
}

function getSectionKey(partDir) {
  return String(partDir || '').replace(/^part\d+-/, '')
}

function getLessonNumber(id) {
  const str = String(id || '')
  const sublesson = str.match(/^(\d+)([a-z])(?=-)/i)
  if (sublesson) return `${sublesson[1]}${sublesson[2].toUpperCase()}`
  const digits = str.match(/^\d+/)?.[0]
  if (digits) return digits
  return str.match(/^[A-Z](?=-)/)?.[0] || ''
}

function buildSidebarSections(catalog) {
  const sections = new Map()
  for (const item of catalog) {
    const section = getSectionKey(item.partDir)
    if (!sections.has(section)) {
      sections.set(section, {
        ...(SECTION_LABELS[section] || { title: section, titleEn: section.toUpperCase() }),
        lessons: [],
      })
    }
    sections.get(section).lessons.push({
      id: item.id,
      num: getLessonNumber(item.id),
      title: item.title,
      section,
    })
  }
  return SECTION_KEYS
    .map(section => sections.get(section))
    .filter(Boolean)
}

const EXPAND_FOOTER_LESSONS_WITH_FULL = 9
const COMPACT_FOOTER_LESSONS_WITH_FULL = 6
const FALLBACK_LESSON_PITCH = 30
const FALLBACK_COMPACT_FOOTER_HEIGHT = 45
const FALLBACK_FULL_FOOTER_HEIGHT = 182

export default function Sidebar({
  catalog,
  currentId,
  lang,
  onLanguageChange,
  onSelect,
  onHome,
  onStartTour,
  onOpenNotes,
  onOpenSettings,
  onOpenChangelog,
  onOpenWalkingLabs,
  bookmarks = {},
  notes = {},
  notebooksWithNotes = new Set(),
  isOpen,
  onClose,
}) {
  const { resolvedTheme, toggleTheme } = useSettingsContext()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMode, setFilterMode] = useState('all')
  const listRef = useRef(null)
  const headerRef = useRef(null)
  const filterRef = useRef(null)
  const footerRef = useRef(null)
  const fullFooterMeasureRef = useRef(null)
  const compactFooterMeasureRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      const section = e.detail?.section
      if (!section || !listRef.current) return
      const idx = SECTION_KEYS.indexOf(section)
      if (idx < 0) return
      const sectionEls = listRef.current.querySelectorAll('[data-section-key]')
      const target = sectionEls[idx]
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' })
        target.classList.remove('sidebar-section-highlight')
        void target.offsetWidth
        target.classList.add('sidebar-section-highlight')
      }
    }
    window.addEventListener('sidebar-scroll-to', handler)
    return () => window.removeEventListener('sidebar-scroll-to', handler)
  }, [])

  const sidebarSections = buildSidebarSections(catalog)
  const filteredSections = sidebarSections.map(section => ({
    ...section,
    lessons: section.lessons.filter(lesson => {
      if (filterMode === 'bookmarked') return !!bookmarks[lesson.id]
      if (filterMode === 'noted') return notebooksWithNotes.has(lesson.id)
      if (!searchQuery) return true
      return lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lesson.num.includes(searchQuery)
    }),
  })).filter(section => section.lessons.length > 0)

  const inFilterMode = filterMode !== 'all'
  const hasBookmarks = Object.keys(bookmarks).length > 0
  const hasNotes = notebooksWithNotes.size > 0

  // Compact footer is based on the space the full footer would leave, so the
  // current footer mode cannot create a compact/full feedback loop.
  const asideRef = useRef(null)
  const [isCompactFooter, setIsCompactFooter] = useState(false)

  useLayoutEffect(() => {
    const aside = asideRef.current
    if (!aside) return

    let frameId = null

    const measure = () => {
      if (frameId) cancelAnimationFrame(frameId)
      frameId = requestAnimationFrame(() => {
        const firstLesson = listRef.current?.querySelector('[data-lesson-row]')
        const secondLesson = listRef.current?.querySelectorAll('[data-lesson-row]')?.[1]
        let lessonPitch = FALLBACK_LESSON_PITCH

        if (firstLesson && secondLesson) {
          lessonPitch = secondLesson.offsetTop - firstLesson.offsetTop
        } else if (firstLesson) {
          lessonPitch = firstLesson.offsetHeight || FALLBACK_LESSON_PITCH
        }

        const headerHeight = headerRef.current?.offsetHeight || 0
        const filterHeight = filterRef.current?.offsetHeight || 0
        const fullFooterHeight = fullFooterMeasureRef.current?.offsetHeight ||
          FALLBACK_FULL_FOOTER_HEIGHT
        const compactFooterHeight = compactFooterMeasureRef.current?.offsetHeight ||
          FALLBACK_COMPACT_FOOTER_HEIGHT

        const chromeWithoutFooter = headerHeight + filterHeight
        const lessonsWithFull = Math.floor(Math.max(
          0,
          aside.clientHeight - chromeWithoutFooter - fullFooterHeight
        ) / lessonPitch)
        const lessonsWithCompact = Math.floor(Math.max(
          0,
          aside.clientHeight - chromeWithoutFooter - compactFooterHeight
        ) / lessonPitch)

        setIsCompactFooter(current => {
          if (current) {
            return lessonsWithFull < EXPAND_FOOTER_LESSONS_WITH_FULL
          }
          return lessonsWithFull <= COMPACT_FOOTER_LESSONS_WITH_FULL &&
            lessonsWithCompact > lessonsWithFull
        })
      })
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(aside)
    if (headerRef.current) observer.observe(headerRef.current)
    if (filterRef.current) observer.observe(filterRef.current)
    if (footerRef.current) observer.observe(footerRef.current)
    if (listRef.current) observer.observe(listRef.current)
    if (fullFooterMeasureRef.current) observer.observe(fullFooterMeasureRef.current)
    if (compactFooterMeasureRef.current) observer.observe(compactFooterMeasureRef.current)
    window.addEventListener('resize', measure, { passive: true })

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
      if (frameId) cancelAnimationFrame(frameId)
    }
  }, [isCompactFooter, filteredSections.length])

  return (
    <aside ref={asideRef} className={`w-64 h-screen max-h-screen border-r flex flex-col justify-between shrink-0 z-30 transition-transform duration-300 ${
      isOpen
        ? 'translate-x-0 fixed inset-y-0 left-0 md:sticky md:top-0'
        : '-translate-x-full fixed inset-y-0 left-0 md:absolute'
    } bg-[var(--bg-sidebar)] border-[var(--border-light)]`}>

      {/* Header */}
      <div ref={headerRef} className="p-6 border-b shrink-0 flex flex-col gap-4 z-10 select-none border-[var(--border-light)]">
        <div className="flex items-center justify-between">
          <button onClick={onHome} className="brand-button" aria-label="Modern LLM Notebook">
            <span className="brand-logo" aria-hidden="true">
              <GitFork className="brand-logo-fork" />
              <Code2 className="brand-logo-code" />
            </span>
            <span className="brand-copy">
              <span className="brand-line brand-line-main">Modern LLM</span>
              <span className="brand-line brand-line-sub">Notebook</span>
            </span>
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onOpenWalkingLabs?.()}
              data-tour="walkinglabs"
              className="sidebar-header-icon"
              title={lang === 'zh' ? '更多' : 'More'}
              aria-label={
                lang === 'zh' ? '打开 WalkingLabs 介绍' : 'Open WalkingLabs intro'
              }
            >
              <Ellipsis className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="sidebar-header-icon"
              title={lang === 'zh' ? '收起侧栏' : 'Collapse sidebar'}
              aria-label={lang === 'zh' ? '收起侧栏' : 'Collapse sidebar'}
            >
              <PanelLeftClose className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Language toggle */}
        <div className="bg-[var(--bg-input)] p-1 rounded-full flex items-center w-36 border border-[var(--border-light)] select-none">
          <button
            onClick={() => onLanguageChange('zh')}
            className={`flex-1 py-1 rounded-full text-xs font-bold transition-all ${
              lang === 'zh'
                ? 'bg-[var(--bg-sidebar)] text-[var(--text-primary)] shadow-sm border border-[var(--border-light)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            中文
          </button>
          <button
            onClick={() => onLanguageChange('en')}
            className={`flex-1 py-1 rounded-full text-xs font-bold transition-all ${
              lang === 'en'
                ? 'bg-[var(--bg-sidebar)] text-[var(--text-primary)] shadow-sm border border-[var(--border-light)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            EN
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div ref={filterRef} className="px-4 pt-4 pb-0 flex items-center gap-1.5 select-none">
        <button
          onClick={() => setFilterMode('all')}
          className={`sidebar-filter-tab ${filterMode === 'all' ? 'active' : ''}`}
        >{lang === 'zh' ? '课程' : 'Courses'}</button>
        <button
          onClick={() => setFilterMode('bookmarked')}
          className={`sidebar-filter-tab sidebar-filter-tab-icon ${filterMode === 'bookmarked' ? 'active' : ''}`}
          disabled={!hasBookmarks}
          title={lang === 'zh' ? '已收藏' : 'Saved'}
        ><BookMarked className="w-3.5 h-3.5" /></button>
        <button
          onClick={() => setFilterMode('noted')}
          className={`sidebar-filter-tab sidebar-filter-tab-icon ${filterMode === 'noted' ? 'active' : ''}`}
          disabled={!hasNotes}
          title={lang === 'zh' ? '有笔记' : 'Noted'}
        ><StickyNote className="w-3.5 h-3.5" /></button>
      </div>

      <div
        className="absolute left-[-9999px] top-0 w-64 pointer-events-none opacity-0"
        aria-hidden="true"
        inert=""
      >
        <div ref={compactFooterMeasureRef} className="shrink-0 border-t flex items-center justify-around gap-1 border-[var(--border-light)] bg-[var(--bg-sidebar-footer)] px-2 py-2">
          <button className="p-1.5 rounded-lg"><GraduationCap className="w-4 h-4" /></button>
          <button className="p-1.5 rounded-lg"><BookMarked className="w-4 h-4" /></button>
          <button className="p-1.5 rounded-lg"><History className="w-4 h-4" /></button>
          <div className="w-px h-4 mx-1"></div>
          <button className="p-1.5 rounded-lg">{resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}</button>
          <button className="p-1.5 rounded-lg"><Settings className="w-4 h-4" /></button>
          <button className="p-1.5 rounded-lg"><Github className="w-4 h-4" /></button>
        </div>
        <div ref={fullFooterMeasureRef} className="shrink-0 border-t flex flex-col gap-2.5 border-[var(--border-light)] bg-[var(--bg-sidebar-footer)] p-4">
          <div className="space-y-1">
            <button className="w-full text-left flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{lang === 'zh' ? '新手引导' : 'Guided Tour'}</span>
            </button>
            <button className="w-full text-left flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold">
              <BookMarked className="w-3.5 h-3.5" />
              <span>{lang === 'zh' ? '笔记与收藏' : 'Notes & Saved'}</span>
            </button>
            <button className="w-full text-left flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold">
              <History className="w-3.5 h-3.5" />
              <span>{lang === 'zh' ? '更新日志' : 'Changelog'}</span>
            </button>
          </div>
          <div className="border-t border-[var(--border-light)] my-1"></div>
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1">
              <button className="p-1.5 rounded-lg">{resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}</button>
              <button className="p-1.5 rounded-lg"><Settings className="w-4 h-4" /></button>
            </div>
            <button className="p-1.5 rounded-lg"><Github className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* Lessons list */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-6 select-none">
        {filteredSections.length === 0 ? (
          <div className="text-xs text-[var(--text-muted)] text-center py-8">
            {inFilterMode
              ? (lang === 'zh' ? '没有匹配的章节' : 'No matching chapters')
              : (lang === 'zh' ? '未找到相关章节' : 'No chapters found')}
          </div>
        ) : (
          filteredSections.map((section, idx) => (
            <div key={idx} data-section-key={section.lessons[0]?.section} className="space-y-4 transition-all duration-500">
              <div className="flex items-center gap-1.5 px-2">
                <span className="text-xs font-bold text-[var(--text-primary)]">
                  {lang === 'zh' ? section.title : section.titleEn}
                </span>
                <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] tracking-wider">
                  {section.titleEn}
                </span>
              </div>

              <div className="space-y-3">
                {section.lessons.map((lesson) => {
                  const isSelected = currentId === lesson.id
                  const isBm = !!bookmarks[lesson.id]
                  const hasNote = notebooksWithNotes.has(lesson.id)
                  return (
                    <button
                      key={lesson.id}
                      data-lesson-row
                      onClick={() => onSelect(lesson.id)}
                      className={`group w-full text-left flex items-center justify-between px-2 py-1 rounded-lg text-xs leading-normal transition-all duration-150 cursor-pointer ${
                        isSelected ? 'bg-[var(--bg-active)] font-semibold' : 'hover:bg-[var(--bg-hover)]'
                      }`}
                    >
                      <div className="flex items-center gap-3 w-full min-w-0">
                        <div className={`w-8 h-5 rounded flex items-center justify-center font-mono text-[10px] font-medium shrink-0 ${
                          isSelected ? 'bg-[var(--border-light)] text-[var(--text-primary)]' : 'bg-[var(--bg-input)] text-[var(--text-muted)]'
                        }`}>
                          {lesson.num}
                        </div>
                        <span className={`truncate font-medium text-xs ${
                          isSelected ? 'text-[var(--text-primary)] font-bold' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
                        }`}>
                          {lesson.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        {isBm && <span className="sidebar-item-star" title={lang === 'zh' ? '已收藏' : 'Bookmarked'}>&#9733;</span>}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer — full version (vertical with text) when sidebar has room;
          compact version (horizontal icon-only) when sidebar is short */}
      {isCompactFooter ? (
        <div ref={footerRef} className="shrink-0 border-t flex items-center justify-around gap-1 border-[var(--border-light)] bg-[var(--bg-sidebar-footer)] px-2 py-2">
          <button
            onClick={() => { onStartTour?.() }}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
            title={lang === 'zh' ? '新手引导' : 'Guided Tour'}
            aria-label={lang === 'zh' ? '新手引导' : 'Guided Tour'}
          >
            <GraduationCap className="w-4 h-4" />
          </button>
          <button
            onClick={() => onOpenNotes?.()}
            data-tour="notes-saved"
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
            title={lang === 'zh' ? '笔记与收藏' : 'Notes & Saved'}
            aria-label={lang === 'zh' ? '笔记与收藏' : 'Notes & Saved'}
          >
            <BookMarked className="w-4 h-4" />
          </button>
          <button
            onClick={() => onOpenChangelog?.()}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
            title={lang === 'zh' ? '更新日志' : 'Changelog'}
            aria-label={lang === 'zh' ? '更新日志' : 'Changelog'}
          >
            <History className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-[var(--border-light)] mx-1"></div>
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
            title={resolvedTheme === 'dark' ? (lang === 'zh' ? '切换到浅色' : 'Light mode') : (lang === 'zh' ? '切换到深色' : 'Dark mode')}
          >
            {resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onOpenSettings?.()}
            data-tour="settings"
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
            title={lang === 'zh' ? '设置' : 'Settings'}
            aria-label={lang === 'zh' ? '设置' : 'Settings'}
          >
            <Settings className="w-4 h-4" />
          </button>
          <a href="https://github.com/walkinglabs/modern-llm-notebook" target="_blank" rel="noreferrer"
            className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors p-1.5"
            title="GitHub"
            aria-label="GitHub"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>
      ) : (
        <div ref={footerRef} className="shrink-0 border-t flex flex-col gap-2.5 border-[var(--border-light)] bg-[var(--bg-sidebar-footer)] p-4">
          <div className="space-y-1">
            <button
              onClick={() => { onStartTour?.() }}
              className="w-full text-left flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{lang === 'zh' ? '新手引导' : 'Guided Tour'}</span>
            </button>
            <button
              onClick={() => onOpenNotes?.()}
              data-tour="notes-saved"
              className="w-full text-left flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              <BookMarked className="w-3.5 h-3.5" />
              <span>{lang === 'zh' ? '笔记与收藏' : 'Notes & Saved'}</span>
            </button>
            <button
              onClick={() => onOpenChangelog?.()}
              className="w-full text-left flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              <History className="w-3.5 h-3.5" />
              <span>{lang === 'zh' ? '更新日志' : 'Changelog'}</span>
            </button>
          </div>

          <div className="border-t border-[var(--border-light)] my-1"></div>

          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1">
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                title={resolvedTheme === 'dark' ? (lang === 'zh' ? '切换到浅色' : 'Light mode') : (lang === 'zh' ? '切换到深色' : 'Dark mode')}
              >
                {resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                onClick={() => onOpenSettings?.()}
                data-tour="settings"
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                title={lang === 'zh' ? '设置' : 'Settings'}
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
            <a href="https://github.com/walkinglabs/modern-llm-notebook" target="_blank" rel="noreferrer"
              className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors p-1">
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
    </aside>
  )
}
