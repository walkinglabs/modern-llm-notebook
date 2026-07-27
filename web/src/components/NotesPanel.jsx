import { useEffect, useRef, useState } from 'react'
import { Download, Upload, Star, StickyNote, ExternalLink, Trash2 } from 'lucide-react'
import ImageLightbox, { useImagePreview } from './ImageLightbox.jsx'
import { normalizeImageEntry } from '../utils/imageStore.js'

export default function NotesPanel({
  catalog, bookmarks, notes, notebooksWithNotes, getSectionNotes, exportData, importFile, onClearAll, onSelect, lang,
}) {
  const fileInputRef = useRef(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const { imagePreview, openEntry, close: closeImagePreview } = useImagePreview()

  // 灯箱打开时挂载 Escape 监听，关闭即卸载
  useEffect(() => {
    if (!imagePreview) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeImagePreview()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [imagePreview, closeImagePreview])

  const bookmarkList = Object.entries(bookmarks).sort((a, b) => b[1].addedAt - a[1].addedAt)

  // Collect all notes across all notebooks
  const allNotes = []
  for (const [notebookId, noteList] of Object.entries(notes)) {
    if (!Array.isArray(noteList)) continue
    for (const n of noteList) {
      if (!n || typeof n !== 'object') continue
      allNotes.push({ notebookId, ...n })
    }
  }
  allNotes.sort((a, b) => b.updatedAt - a.updatedAt)

  const findMeta = (id) => catalog.find((n) => n.id === id)

  const noteGroups = Object.entries(notes)
    .map(([notebookId, noteList]) => {
      const list = Array.isArray(noteList)
        ? noteList
          .filter((n) => n && typeof n === 'object')
          .slice()
          .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
        : []
      const meta = findMeta(notebookId)
      return {
        notebookId,
        meta,
        notes: list,
        latestAt: list[0]?.updatedAt || 0,
      }
    })
    .filter((group) => group.notes.length > 0)
    .sort((a, b) => b.latestAt - a.latestAt)

  const normalizeText = (text) => String(text || '').replace(/\s+/g, ' ').trim()

  const findQuoteTarget = (root, quote) => {
    const quoteText = normalizeText(quote)
    if (!quoteText) return null

    const searchText = quoteText.length > 80 ? quoteText.slice(0, 80) : quoteText
    const candidates = root.querySelectorAll(
      '.rendered_html p, .rendered_html li, .rendered_html td, .rendered_html th'
    )

    for (const el of candidates) {
      const candidateText = normalizeText(el.textContent)
      if (candidateText.includes(searchText) || quoteText.includes(candidateText)) {
        return el
      }
    }

    return null
  }

  const markJumpTarget = (el) => {
    el.classList.remove('note-jump-target')
    void el.offsetWidth
    el.classList.add('note-jump-target')
    window.setTimeout(() => {
      el.classList.remove('note-jump-target')
    }, 1800)
  }

  const handleExport = async () => {
    const json = await exportData()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mln-notes-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const result = await importFile(file)
    if (result.ok) {
      const imagePart = result.imageCount
        ? (lang === 'zh' ? `，${result.imageCount} 张图片` : `, ${result.imageCount} images`)
        : ''
      alert(lang === 'zh'
        ? `导入成功：${result.bookmarkCount} 个收藏，${result.noteCount} 条笔记${imagePart}`
        : `Imported: ${result.bookmarkCount} bookmarks, ${result.noteCount} notes${imagePart}`)
    } else {
      alert(lang === 'zh' ? `导入失败：${result.error}` : `Import failed: ${result.error}`)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleNoteClick = (notebookId, noteId, sectionId, quote = '') => {
    onSelect(notebookId)

    const tryScroll = (retries) => {
      const root = document.querySelector('.notebook-content')
      // 优先用笔记 anchor mark（笔记或高亮）精确定位，fallback 用 quote 文字搜索、再 fallback 到 section 标题
      const anchorMark = noteId && root
        ? root.querySelector(`mark.note-anchor[data-note-id="${noteId}"], mark.user-highlight[data-note-id="${noteId}"]`)
        : null
      const quoteTarget = !anchorMark && root ? findQuoteTarget(root, quote) : null
      const sectionTarget = !anchorMark && !quoteTarget && sectionId ? document.getElementById(sectionId) : null
      const target = anchorMark || quoteTarget || sectionTarget

      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' })
        markJumpTarget(target)
      } else if (retries > 0) {
        setTimeout(() => tryScroll(retries - 1), 100)
      }
    }
    setTimeout(() => tryScroll(20), 150)
  }

  const t = (zh, en) => lang === 'en' ? en : zh

  return (
    <div className="viewer">
      <div className="viewer-header visible">
        <h1 className="viewer-title">{t('笔记与收藏', 'Notes & Bookmarks')}</h1>
        <div className="viewer-launches" style={{ gap: 10 }}>
          <button onClick={handleExport} className="notes-action-btn"
            title={t('导出数据', 'Export data')}>
            <Download className="w-3.5 h-3.5" />
            <span>{t('导出', 'Export')}</span>
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="notes-action-btn"
            title={t('导入数据', 'Import data')}>
            <Upload className="w-3.5 h-3.5" />
            <span>{t('导入', 'Import')}</span>
          </button>
          {confirmClear ? (
            <button onClick={() => { onClearAll?.(); setConfirmClear(false) }}
              className="notes-action-btn" style={{ color: 'var(--accent-red, #ef4444)' }}
              title={t('确认清空', 'Confirm clear')}>
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('确认', 'Confirm')}</span>
            </button>
          ) : (
            <button onClick={() => setConfirmClear(true)} className="notes-action-btn"
              title={t('清空所有数据', 'Clear all data')}>
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('清空', 'Clear')}</span>
            </button>
          )}
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport}
            style={{ display: 'none' }} />
        </div>
      </div>

      <div className="viewer-body">
        <div className="notes-panel">
          {/* Bookmarks section */}
          <section className="notes-section">
            <h2 className="notes-section-title">
              <Star className="w-4 h-4" style={{ fill: '#f59e0b', stroke: '#f59e0b' }} />
              {t('收藏', 'Bookmarks')}
              <span className="notes-count">{bookmarkList.length}</span>
            </h2>
            {bookmarkList.length === 0 ? (
              <p className="notes-empty">{t('还没有收藏任何 Notebook。阅读时点击标题旁的星标即可收藏。', 'No bookmarks yet. Click the star next to a notebook title while reading.')}</p>
            ) : (
              <div className="notes-grid">
                {bookmarkList.map(([id, bm]) => {
                  const meta = findMeta(id)
                  return (
                    <button key={id} className="notes-card" onClick={() => onSelect(id)}>
                      <div className="notes-card-header">
                        <span className="notes-card-num">{id.match(/^\d+/)?.[0] || ''}</span>
                        <span className="notes-card-title">{bm.title}</span>
                      </div>
                      {meta && <div className="notes-card-part">{meta.part}</div>}
                    </button>
                  )
                })}
              </div>
            )}
          </section>

          {/* Notes section */}
          <section className="notes-section">
            <h2 className="notes-section-title">
              <StickyNote className="w-4 h-4" />
              {t('笔记', 'Notes')}
              <span className="notes-count">{allNotes.length}</span>
            </h2>
            {allNotes.length === 0 ? (
              <p className="notes-empty">{t('还没有笔记。阅读时选中文字，在弹出工具栏中选择"笔记"或"高亮"即可添加。', 'No notes yet. Select text while reading and choose "Note" or "Highlight" from the popup toolbar.')}</p>
            ) : (
              <div className="notes-article-list">
                {noteGroups.map((group) => (
                  <section key={group.notebookId} className="notes-article-group">
                    <button
                      className="notes-article-header"
                      onClick={() => onSelect(group.notebookId)}
                    >
                      <div className="notes-article-title-row">
                        <span className="notes-article-num">
                          {group.notebookId.match(/^\d+/)?.[0] || ''}
                        </span>
                        <span className="notes-article-title">
                          {group.meta?.title || group.notebookId}
                        </span>
                      </div>
                      <span className="notes-article-count">
                        {group.notes.length} {t('条', 'notes')}
                      </span>
                    </button>

                    <div className="notes-article-items">
                      {group.notes.map((n) => (
                        <div key={n.id}
                          role="button"
                          tabIndex={0}
                          className="notes-note-row"
                          onClick={() => handleNoteClick(group.notebookId, n.id, n.sectionId, n.quote)}
                          onKeyDown={(e) => {
                            if (e.key !== 'Enter' && e.key !== ' ') return
                            e.preventDefault()
                            handleNoteClick(group.notebookId, n.id, n.sectionId, n.quote)
                          }}>
                          <div className="notes-card-main">
                            <div className="notes-card-meta-row">
                              <span className="notes-card-section-label">{n.sectionTitle}</span>
                            </div>
                            {n.quote && (
                              <span
                                className="notes-card-quote notes-card-quote-link"
                                role="link"
                                tabIndex={0}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleNoteClick(group.notebookId, n.id, n.sectionId, n.quote)
                                }}
                                onKeyDown={(e) => {
                                  if (e.key !== 'Enter' && e.key !== ' ') return
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleNoteClick(group.notebookId, n.id, n.sectionId, n.quote)
                                }}
                              >
                                {String(n.quote).slice(0, 150)}{String(n.quote).length > 150 ? '…' : ''}
                              </span>
                            )}
                            {n.text && (
                              <span
                                className="notes-card-preview notes-card-preview-link"
                                role="link"
                                tabIndex={0}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleNoteClick(group.notebookId, n.id, n.sectionId, n.quote)
                                }}
                                onKeyDown={(e) => {
                                  if (e.key !== 'Enter' && e.key !== ' ') return
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleNoteClick(group.notebookId, n.id, n.sectionId, n.quote)
                                }}
                              >
                                {String(n.text).slice(0, 100)}{String(n.text).length > 100 ? '…' : ''}
                              </span>
                            )}
                            {n.images && n.images.length > 0 && (
                              <div className="notes-card-images">
                                {n.images.slice(0, 3).map((img, i) => {
                                  const entry = normalizeImageEntry(img)
                                  return (
                                    <img
                                      key={i}
                                      src={entry.thumb}
                                      alt=""
                                      className="notes-card-image-thumb"
                                      // 点开灯箱看原图，阻止冒泡避免触发笔记行跳转
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        openEntry(img, String(n.text || n.quote || 'note image').slice(0, 80))
                                      }}
                                    />
                                  )
                                })}
                                {n.images.length > 3 && (
                                  <span className="notes-card-image-more">+{n.images.length - 3}</span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="notes-card-meta">
                            <span className="notes-card-date">
                              {new Date(n.updatedAt || Date.now()).toLocaleDateString(lang === 'en' ? 'en-US' : 'zh-CN')}
                            </span>
                            <ExternalLink className="w-3 h-3 notes-card-icon" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {imagePreview && (
        <ImageLightbox
          src={imagePreview.src}
          alt={imagePreview.alt}
          lang={lang}
          onClose={closeImagePreview}
        />
      )}
    </div>
  )
}
