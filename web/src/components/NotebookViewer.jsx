import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  Copy,
  Download,
  Highlighter,
  ImagePlus,
  PanelRightClose,
  PanelRightOpen,
  Pencil,
  Share2,
  Star,
  Trash2,
} from 'lucide-react'
import { getNotebookLaunchLinks } from '../config.js'
import { prepareImage, putImage, deleteImage, normalizeImageEntry, MAX_IMAGE_MB } from '../utils/imageStore.js'
import ImageLightbox, { useImagePreview } from './ImageLightbox.jsx'

function extractToc(html) {
  const temp = document.createElement('div')
  temp.innerHTML = html
  const headings = temp.querySelectorAll('h2, h3')
  const toc = []
  headings.forEach((h) => {
    const clone = h.cloneNode(true)
    clone.querySelectorAll('.anchor-link').forEach((link) => link.remove())
    const text = clone.textContent.trim()
    if (!text) return
    const level = h.tagName === 'H3' ? 3 : 2
    toc.push({ id: h.id, text, level })
  })
  return toc
}

const TEXT_HIGHLIGHT_BLOCK_SELECTOR = [
  '.rendered_html p',
  '.rendered_html li',
  '.rendered_html td',
  '.rendered_html th',
].join(', ')

const DISALLOWED_HIGHLIGHT_ANCESTOR_SELECTOR = [
  '.code_cell',
  '.input_area',
  '.output_area',
  'pre',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'a',
  'img',
  'svg',
  'canvas',
  '.katex',
  '.MathJax',
].join(', ')

const DISALLOWED_HIGHLIGHT_CONTENT_SELECTOR = [
  'p',
  'li',
  'div',
  'pre',
  'a',
  'table',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'img',
  'svg',
  'canvas',
  '.katex',
  '.code_cell',
  '.input_area',
  '.output_area',
  '.MathJax',
].join(', ')

const EMPTY_NOTE_LIST = Object.freeze([])

function getInitialTocOpen() {
  return window.innerWidth >= 1024
}

function elementFromNode(node) {
  if (!node) return null
  return node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement
}

function getTextHighlightBlock(root, range) {
  if (!root || !range || !range.toString().trim()) return null
  if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return null

  const startElement = elementFromNode(range.startContainer)
  const endElement = elementFromNode(range.endContainer)
  if (!startElement || !endElement) return null
  if (startElement.closest(DISALLOWED_HIGHLIGHT_ANCESTOR_SELECTOR)) return null
  if (endElement.closest(DISALLOWED_HIGHLIGHT_ANCESTOR_SELECTOR)) return null

  const startBlock = startElement.closest(TEXT_HIGHLIGHT_BLOCK_SELECTOR)
  const endBlock = endElement.closest(TEXT_HIGHLIGHT_BLOCK_SELECTOR)
  if (!startBlock || startBlock !== endBlock) return null

  const fragment = range.cloneContents()
  if (fragment.querySelector(DISALLOWED_HIGHLIGHT_CONTENT_SELECTOR)) return null

  return startBlock
}

function isAllowedHighlightElement(element) {
  return !!element &&
    !element.closest(DISALLOWED_HIGHLIGHT_ANCESTOR_SELECTOR) &&
    !element.closest('mark.user-highlight')
}

function getHighlightBlockRanges(root, range) {
  if (!root || !range || !range.toString().trim()) return []
  if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return []

  const startElement = elementFromNode(range.startContainer)
  const endElement = elementFromNode(range.endContainer)
  if (!isAllowedHighlightElement(startElement) || !isAllowedHighlightElement(endElement)) {
    return []
  }

  const blocks = getHighlightBlocks(root).filter((block) => range.intersectsNode(block))
  const ranges = []

  for (const block of blocks) {
    const blockRange = document.createRange()
    blockRange.selectNodeContents(block)

    if (block.contains(range.startContainer)) {
      blockRange.setStart(range.startContainer, range.startOffset)
    }
    if (block.contains(range.endContainer)) {
      blockRange.setEnd(range.endContainer, range.endOffset)
    }

    if (!blockRange.toString().trim()) continue
    if (!getTextHighlightBlock(root, blockRange)) return []
    ranges.push({ block, range: blockRange })
  }

  return ranges
}

function canHighlightTextRange(root, range) {
  return getHighlightBlockRanges(root, range).length > 0
}

function getBlockRangesText(blockRanges) {
  return blockRanges
    .map(({ range }) => range.toString().trim())
    .filter(Boolean)
    .join('\n')
}

function makeHighlightNoteId() {
  return `hl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

function setHighlightMarkData(mark, data) {
  mark.className = 'user-highlight'
  mark.dataset.noteId = data.noteId || ''
  mark.dataset.sectionId = data.sectionId || ''
  mark.dataset.sectionTitle = data.sectionTitle || ''
  mark.dataset.noteQuote = data.quote || ''
}

function isHighlightNote(note) {
  return !!note &&
    typeof note === 'object' &&
    String(note.id || '').startsWith('hl_') &&
    String(note.quote || '').trim()
}

function getHighlightBlocks(root) {
  return root ? [...root.querySelectorAll(TEXT_HIGHLIGHT_BLOCK_SELECTOR)] : []
}

function makeHighlightAnchor(root, block, startOffset, endOffset) {
  const blockIndex = getHighlightBlocks(root).indexOf(block)
  if (blockIndex < 0 || endOffset <= startOffset) return null
  return {
    kind: 'text-offset-v1',
    blockIndex,
    startOffset,
    endOffset,
  }
}

function makeMultiHighlightAnchor(root, blockRanges) {
  const ranges = blockRanges
    .map(({ block, range }) => {
      const blockIndex = getHighlightBlocks(root).indexOf(block)
      const startOffset = getAbsoluteOffset(block, range.startContainer, range.startOffset)
      const endOffset = getAbsoluteOffset(block, range.endContainer, range.endOffset)
      if (blockIndex < 0 || endOffset <= startOffset) return null
      return { blockIndex, startOffset, endOffset }
    })
    .filter(Boolean)

  if (ranges.length === 0) return null
  if (ranges.length === 1) {
    return { kind: 'text-offset-v1', ...ranges[0] }
  }
  return { kind: 'text-ranges-v1', ranges }
}

function getRangeAnchor(root, block, range) {
  if (!root || !block || !range) return null
  const startOffset = getAbsoluteOffset(block, range.startContainer, range.startOffset)
  const endOffset = getAbsoluteOffset(block, range.endContainer, range.endOffset)
  return makeHighlightAnchor(root, block, startOffset, endOffset)
}

function applyTextHighlight(root, sourceRange, data) {
  const range = sourceRange?.cloneRange()
  const blockRanges = getHighlightBlockRanges(root, range)
  if (blockRanges.length === 0) return null

  const selectedText = getBlockRangesText(blockRanges)
  const anchor = makeMultiHighlightAnchor(root, blockRanges)
  const marks = []

  try {
    for (const item of [...blockRanges].reverse()) {
      const mark = document.createElement('mark')
      setHighlightMarkData(mark, { ...data, quote: selectedText.slice(0, 160) })
      mark.appendChild(item.range.extractContents())
      item.range.insertNode(mark)
      item.block.normalize()
      marks.unshift(mark)
    }
    return { mark: marks[0], marks, selectedText, anchor }
  } catch {
    return null
  }
}

function getAllowedTextPieces(block) {
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT)
  const pieces = []
  let text = ''
  let node = walker.nextNode()

  while (node) {
    const element = elementFromNode(node)
    if (
      !element?.closest(DISALLOWED_HIGHLIGHT_ANCESTOR_SELECTOR) &&
      !element?.closest('mark.user-highlight')
    ) {
      pieces.push({ node, start: text.length, text: node.textContent })
      text += node.textContent
    }
    node = walker.nextNode()
  }

  return { text, pieces }
}

function rangeFromPieces(pieces, start, end) {
  const range = document.createRange()
  let startSet = false

  for (const piece of pieces) {
    const pieceEnd = piece.start + piece.text.length
    if (!startSet && start <= pieceEnd) {
      range.setStart(piece.node, Math.max(0, start - piece.start))
      startSet = true
    }
    if (startSet && end <= pieceEnd) {
      range.setEnd(piece.node, Math.max(0, end - piece.start))
      return range
    }
  }

  return null
}

function findAnchoredTextRange(root, note) {
  const anchor = note?.anchor
  const target = String(note?.quote || '').trim()
  if (!anchor || anchor.kind !== 'text-offset-v1') return null

  const { blockIndex, startOffset, endOffset } = anchor
  if (![blockIndex, startOffset, endOffset].every(Number.isFinite)) return null

  const block = getHighlightBlocks(root)[blockIndex]
  if (!block) return null

  const range = rangeFromOffsets(block, startOffset, endOffset)
  if (!range || !getTextHighlightBlock(root, range)) return null
  if (target && range.toString().trim() !== target) return null
  return range
}

function findAnchoredTextRanges(root, note) {
  const anchor = note?.anchor
  if (!anchor || anchor.kind !== 'text-ranges-v1' || !Array.isArray(anchor.ranges)) return null

  const blocks = getHighlightBlocks(root)
  const ranges = []

  for (const item of anchor.ranges) {
    const { blockIndex, startOffset, endOffset } = item || {}
    if (![blockIndex, startOffset, endOffset].every(Number.isFinite)) return null

    const block = blocks[blockIndex]
    if (!block) return null

    const range = rangeFromOffsets(block, startOffset, endOffset)
    if (!range || !getTextHighlightBlock(root, range)) return null
    ranges.push(range)
  }

  return ranges.length > 0 ? ranges : null
}

function findPlainTextRange(root, quote) {
  const target = String(quote || '').trim()
  if (!target) return null

  const blocks = getHighlightBlocks(root)
  for (const block of blocks) {
    const { text, pieces } = getAllowedTextPieces(block)
    const start = text.indexOf(target)
    if (start < 0) continue

    const range = rangeFromPieces(pieces, start, start + target.length)
    if (range && getTextHighlightBlock(root, range)) return range
  }

  return null
}

function findSavedHighlightRanges(root, note) {
  const anchoredRanges = findAnchoredTextRanges(root, note)
  if (anchoredRanges) return anchoredRanges

  const anchoredRange = findAnchoredTextRange(root, note)
  if (anchoredRange) return [anchoredRange]

  const plainRange = findPlainTextRange(root, note.quote)
  return plainRange ? [plainRange] : null
}

function renderHighlightMark(range, note) {
  const mark = document.createElement('mark')
  setHighlightMarkData(mark, {
    noteId: note.id,
    sectionId: note.sectionId,
    sectionTitle: note.sectionTitle,
    quote: note.quote,
  })
  mark.appendChild(range.extractContents())
  range.insertNode(mark)
  return mark
}

function renderHighlightMarks(ranges, note) {
  const marks = []
  for (const range of [...ranges].reverse()) {
    marks.unshift(renderHighlightMark(range, note))
  }
  return marks
}

function getHighlightQuote(root, noteId) {
  return [...root.querySelectorAll(`mark.user-highlight[data-note-id="${noteId}"]`)]
    .map((mark) => mark.textContent)
    .join('\n')
    .trim()
}

function getHighlightMarks(root, noteId) {
  if (!root || !noteId) return []
  return [...root.querySelectorAll(`mark.user-highlight[data-note-id="${noteId}"]`)]
}

function syncSavedHighlights(root, noteList) {
  const highlightNotes = new Map()
  for (const note of noteList) {
    if (!isHighlightNote(note)) continue
    highlightNotes.set(note.id, note)
  }

  root.querySelectorAll('mark.user-highlight').forEach((mark) => {
    const note = highlightNotes.get(mark.dataset.noteId || '')
    if (note && getHighlightQuote(root, note.id) === String(note.quote || '').trim()) {
      setHighlightMarkData(mark, {
        noteId: note.id,
        sectionId: note.sectionId,
        sectionTitle: note.sectionTitle,
        quote: note.quote,
      })
      return
    }
    unwrapHighlight(mark)
  })

  for (const note of highlightNotes.values()) {
    const existing = root.querySelector(`mark.user-highlight[data-note-id="${note.id}"]`)
    if (existing) continue

    const ranges = findSavedHighlightRanges(root, note)
    if (ranges) renderHighlightMarks(ranges, note)
  }
}

// 普通笔记：不带 hl_ 前缀，且 quote 非空（quote 是定位原文锚点的依据）
function isPlainNote(note) {
  if (!note || typeof note !== 'object') return false
  if (String(note.id || '').startsWith('hl_')) return false
  return String(note.quote || '').trim().length > 0
}

function setNoteAnchorMarkData(mark, data) {
  mark.className = 'note-anchor'
  mark.dataset.noteId = data.noteId || ''
  mark.dataset.sectionId = data.sectionId || ''
  mark.dataset.sectionTitle = data.sectionTitle || ''
  mark.dataset.noteQuote = data.quote || ''
}

function renderNoteAnchorMark(range, note) {
  const mark = document.createElement('mark')
  setNoteAnchorMarkData(mark, {
    noteId: note.id,
    sectionId: note.sectionId,
    sectionTitle: note.sectionTitle,
    quote: note.quote,
  })
  mark.appendChild(range.extractContents())
  range.insertNode(mark)
  return mark
}

function renderNoteAnchorMarks(ranges, note) {
  const marks = []
  for (const range of [...ranges].reverse()) {
    marks.unshift(renderNoteAnchorMark(range, note))
  }
  return marks
}

function getNoteAnchorMarkQuote(root, noteId) {
  return [...root.querySelectorAll(`mark.note-anchor[data-note-id="${noteId}"]`)]
    .map((mark) => mark.textContent)
    .join('\n')
    .trim()
}

// 镜像 syncSavedHighlights 的结构：清理失效 mark、为新笔记渲染虚线下划线锚点
function syncSavedNotes(root, noteList) {
  const plainNotes = new Map()
  for (const note of noteList) {
    if (!isPlainNote(note)) continue
    plainNotes.set(note.id, note)
  }

  root.querySelectorAll('mark.note-anchor').forEach((mark) => {
    const note = plainNotes.get(mark.dataset.noteId || '')
    if (note && getNoteAnchorMarkQuote(root, note.id) === String(note.quote || '').trim()) {
      setNoteAnchorMarkData(mark, {
        noteId: note.id,
        sectionId: note.sectionId,
        sectionTitle: note.sectionTitle,
        quote: note.quote,
      })
      return
    }
    unwrapHighlight(mark)
  })

  for (const note of plainNotes.values()) {
    const existing = root.querySelector(`mark.note-anchor[data-note-id="${note.id}"]`)
    if (existing) continue
    const ranges = findSavedHighlightRanges(root, note)
    if (ranges) renderNoteAnchorMarks(ranges, note)
  }
}

// 从一个 Range 算出 anchor（不写 DOM），新建笔记时用
function computeAnchorFromRange(root, range) {
  if (!root || !range) return null
  const blockRanges = getHighlightBlockRanges(root, range)
  if (blockRanges.length === 0) return null
  return makeMultiHighlightAnchor(root, blockRanges)
}

function getAbsoluteOffset(block, node, offset) {
  const range = document.createRange()
  range.selectNodeContents(block)
  range.setEnd(node, offset)
  return range.toString().length
}

function getHighlightOffsets(block, mark) {
  const before = document.createRange()
  before.selectNodeContents(block)
  before.setEndBefore(mark)
  const start = before.toString().length
  return { start, end: start + mark.textContent.length }
}

function rangeFromOffsets(block, start, end) {
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT)
  const range = document.createRange()
  let seen = 0
  let startSet = false
  let node = walker.nextNode()

  while (node) {
    const nextSeen = seen + node.textContent.length
    if (!startSet && start <= nextSeen) {
      range.setStart(node, Math.max(0, start - seen))
      startSet = true
    }
    if (startSet && end <= nextSeen) {
      range.setEnd(node, Math.max(0, end - seen))
      return range
    }
    seen = nextSeen
    node = walker.nextNode()
  }

  return null
}

function unwrapHighlight(mark) {
  const block = mark.closest(TEXT_HIGHLIGHT_BLOCK_SELECTOR)
  mark.replaceWith(...mark.childNodes)
  block?.normalize()
  return block
}

function replaceHighlightByOffsets(block, currentMark, start, end, data) {
  if (!block || !currentMark || end <= start) return null

  const root = block.closest('.notebook-content')
  const previewRange = rangeFromOffsets(block, start, end)
  if (!previewRange || !previewRange.toString().trim()) return null
  if (!getTextHighlightBlock(root, previewRange)) return null

  unwrapHighlight(currentMark)
  const range = rangeFromOffsets(block, start, end)
  if (!range || !range.toString().trim()) return null

  const mark = document.createElement('mark')
  const quote = range.toString().trim()
  setHighlightMarkData(mark, { ...data, quote: quote.slice(0, 160) })
  mark.appendChild(range.extractContents())
  range.insertNode(mark)
  return { mark, anchor: makeHighlightAnchor(root, block, start, end) }
}

function getCaretOffsetInBlock(block, x, y) {
  const handles = [...document.querySelectorAll('.highlight-drag-handle')]
  const previousPointerEvents = handles.map((handle) => handle.style.pointerEvents)

  handles.forEach((handle) => {
    handle.style.pointerEvents = 'none'
  })

  let range = null
  let position = null
  try {
    range = document.caretRangeFromPoint?.(x, y)
    position = !range && document.caretPositionFromPoint?.(x, y)
  } finally {
    handles.forEach((handle, index) => {
      handle.style.pointerEvents = previousPointerEvents[index] || ''
    })
  }

  const node = range?.startContainer || position?.offsetNode
  const offset = range?.startOffset ?? position?.offset
  if (!node || offset === undefined || !block.contains(node)) return null
  if (elementFromNode(node)?.closest(DISALLOWED_HIGHLIGHT_ANCESTOR_SELECTOR)) return null
  return getAbsoluteOffset(block, node, offset)
}

function getHighlightEditorPosition(mark) {
  const rects = [...mark.getClientRects()]
    .filter((rect) => rect.width > 1 && rect.height > 1)
  const first = rects[0]
  const last = rects[rects.length - 1] || first
  if (!first) return null

  const overlayRoot = mark.closest('.viewer-body')
  const origin = overlayRoot?.getBoundingClientRect() || { top: 0, left: 0 }

  return {
    startTop: first.top - origin.top,
    endTop: last.top - origin.top,
    startHeight: Math.max(first.height, 20),
    endHeight: Math.max(last.height, 20),
    startLeft: first.left - origin.left - 3,
    endLeft: last.right - origin.left - 3,
    deleteTop: Math.max(first.top - origin.top - 36, 8),
    deleteLeft: Math.max((first.left + last.right) / 2 - origin.left - 14, 8),
  }
}

function getHighlightSideCenterY(mark, side) {
  const rects = [...mark.getClientRects()]
    .filter((rect) => rect.width > 1 && rect.height > 1)
  const rect = side === 'start' ? rects[0] : rects[rects.length - 1]
  return rect ? rect.top + rect.height / 2 : null
}

function NotebookViewer({ notebook, meta, loading, isBookmarked, toggleBookmark, notes, saveNote, deleteNote }) {
  const contentRef = useRef(null)
  const notebookContentRef = useRef(null)
  const revealFrameRef = useRef(null)
  const tocScrollFrameRef = useRef(null)
  const scrollSpyFrameRef = useRef(null)
  const [toc, setToc] = useState([])
  const [activeHeading, setActiveHeading] = useState(null)
  const [tocOpen, setTocOpen] = useState(() => getInitialTocOpen())
  const [tocHasMore, setTocHasMore] = useState(false)
  const tocScrollRef = useRef(null)
  const [visibleNotebookId, setVisibleNotebookId] = useState(null)
  const { imagePreview, openEntry, openBlob, openSrc, close: closeImagePreview } = useImagePreview()
  const [noteEditor, setNoteEditor] = useState(null)
  const [selectionToolbar, setSelectionToolbar] = useState(null)
  const [highlightEditor, setHighlightEditor] = useState(null)
  const [sharePreview, setSharePreview] = useState(null)
  const shareCanvasRef = useRef(null)
  const savedRangeRef = useRef(null)
  // 新建笔记时携带的选区 range，保存时用来计算 anchor；编辑模式下为 null
  const noteAnchorRangeRef = useRef(null)
  const activeHighlightRef = useRef(null)
  const highlightDragRef = useRef(null)
  const previousHighlightSyncRef = useRef(null)
  // 笔记编辑器的图片文件选择 input
  const imageInputRef = useRef(null)
  const lang = meta?.lang === 'en' ? 'en' : 'zh'
  const notebookHtml = useMemo(() => ({ __html: notebook?.html || '' }), [notebook?.html])
  const currentNotebookNotes = useMemo(() => {
    const noteList = notebook?.id ? notes?.[notebook.id] : null
    return Array.isArray(noteList) ? noteList : EMPTY_NOTE_LIST
  }, [notebook?.id, notes])
  const currentHighlightNotes = useMemo(() => {
    return currentNotebookNotes.filter(isHighlightNote)
  }, [currentNotebookNotes])

  const showHighlightEditor = (mark) => {
    const root = notebookContentRef.current
    const noteId = mark.dataset.noteId || ''
    const marks = getHighlightMarks(root, noteId)
    const position = getHighlightEditorPosition(mark)
    if (!position) return
    activeHighlightRef.current = mark
    setHighlightEditor({
      ...position,
      noteId: mark.dataset.noteId || '',
      sectionId: mark.dataset.sectionId || '',
      sectionTitle: mark.dataset.sectionTitle || '',
      quote: noteId ? getHighlightQuote(root, noteId) : mark.textContent.trim(),
      canResize: marks.length <= 1,
    })
  }

  const updateHighlightEditorPosition = () => {
    const mark = activeHighlightRef.current
    if (!mark || !notebookContentRef.current?.contains(mark)) {
      setHighlightEditor(null)
      activeHighlightRef.current = null
      return
    }

    const noteId = mark.dataset.noteId || ''
    const marks = getHighlightMarks(notebookContentRef.current, noteId)
    const position = getHighlightEditorPosition(mark)
    if (!position) return
    setHighlightEditor((prev) => prev ? {
      ...prev,
      ...position,
      quote: noteId ? getHighlightQuote(notebookContentRef.current, noteId) : mark.textContent.trim(),
      canResize: marks.length <= 1,
    } : prev)
  }

  const deleteActiveHighlight = () => {
    const mark = activeHighlightRef.current
    if (!mark) return
    const noteId = mark.dataset.noteId
    if (noteId) deleteNote?.(notebook.id, noteId)
    getHighlightMarks(notebookContentRef.current, noteId).forEach(unwrapHighlight)
    activeHighlightRef.current = null
    setHighlightEditor(null)
  }

  const startHighlightDrag = (event, side) => {
    event.preventDefault()
    event.stopPropagation()

    const mark = activeHighlightRef.current
    const block = mark?.closest(TEXT_HIGHLIGHT_BLOCK_SELECTOR)
    if (!mark || !block) return
    if (getHighlightMarks(notebookContentRef.current, mark.dataset.noteId || '').length > 1) return

    highlightDragRef.current = {
      side,
      mark,
      block,
      ...getHighlightOffsets(block, mark),
      originX: event.clientX,
      originY: event.clientY,
      rowCenterY: getHighlightSideCenterY(mark, side),
      hasMoved: false,
      noteId: mark.dataset.noteId || '',
      sectionId: mark.dataset.sectionId || '',
      sectionTitle: mark.dataset.sectionTitle || '',
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const commitSelectionHighlight = () => {
    if (!selectionToolbar?.canHighlight) return false

    const root = notebookContentRef.current
    if (!root) return false
    const sel = window.getSelection()
    const liveRange = sel && !sel.isCollapsed ? sel.getRangeAt(0) : null
    const range = savedRangeRef.current || liveRange
    if (!range) return false

    const noteId = makeHighlightNoteId()
    const result = applyTextHighlight(root, range, {
      noteId,
      sectionId: selectionToolbar.sectionId,
      sectionTitle: selectionToolbar.sectionTitle,
    })
    if (!result) return false

    sel?.removeAllRanges()
    savedRangeRef.current = null
    saveNote?.(
      notebook.id,
      selectionToolbar.sectionId,
      selectionToolbar.sectionTitle,
      result.selectedText,
      '',
      noteId,
      result.anchor
    )
    setSelectionToolbar(null)
    showHighlightEditor(result.mark)
    return true
  }

  // 笔记编辑器：从 File 列表预处理并追加图片
  // 单张 >5MB 拒绝并收集后一次提示；原图 file 暂存内存，保存笔记时才写 IndexedDB
  const addImagesFromFiles = async (fileList) => {
    const files = [...fileList].filter((f) => f.type.startsWith('image/'))
    if (files.length === 0) return
    const prepared = []
    const skipped = []
    for (const f of files) {
      try {
        prepared.push(await prepareImage(f))
      } catch (err) {
        if (err.message === 'image-too-large') {
          skipped.push(f.name || (lang === 'en' ? 'pasted image' : '粘贴的图片'))
        } else {
          console.warn('[notes] 图片预处理失败', err)
        }
      }
    }
    if (skipped.length > 0) {
      alert(lang === 'en'
        ? `Skipped images over ${MAX_IMAGE_MB}MB: ${skipped.join(', ')}`
        : `以下图片超过 ${MAX_IMAGE_MB}MB 已跳过：${skipped.join('、')}`)
    }
    if (prepared.length === 0) return
    setNoteEditor((prev) => prev ? {
      ...prev,
      images: [...(prev.images || []), ...prepared]
    } : prev)
  }

  // 笔记编辑器：粘贴图片（Ctrl/Cmd+V）
  const handleNoteEditorPaste = (e) => {
    const items = e.clipboardData?.items
    if (!items) return
    const files = [...items]
      .filter((it) => it.kind === 'file' && it.type.startsWith('image/'))
      .map((it) => it.getAsFile())
      .filter(Boolean)
    if (files.length === 0) return
    e.preventDefault()
    addImagesFromFiles(files)
  }

  // 笔记编辑器：文件选择器选图
  const handleImageInputChange = (e) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    addImagesFromFiles(files)
    e.target.value = ''
  }

  const findNearestHeading = (content, range) => {
    // 找选区上方最近的标题
    const selTop = range.getBoundingClientRect().top
    const headings = [...content.querySelectorAll('h2, h3')]
    let nearest = null
    let minDist = Infinity
    for (const h of headings) {
      const dist = selTop - h.getBoundingClientRect().bottom
      if (dist >= 0 && dist < minDist) {
        minDist = dist
        nearest = h
      }
    }
    return nearest
  }

  // Draw share card when sharePreview changes
  useEffect(() => {
    if (!sharePreview || !shareCanvasRef.current) return
    const canvas = drawShareCard(sharePreview.quote, sharePreview.notebookTitle)
    const target = shareCanvasRef.current
    target.width = canvas.width
    target.height = canvas.height
    const ctx = target.getContext('2d')
    ctx.drawImage(canvas, 0, 0)
  }, [sharePreview])

  const handleNotebookMouseUp = () => {
    setTimeout(() => {
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        setSelectionToolbar(null)
        return
      }
      const content = notebookContentRef.current
      if (!content) return
      const range = selection.getRangeAt(0)
      if (!content.contains(range.commonAncestorContainer)) return

      const rect = range.getBoundingClientRect()
      const selectedText = selection.toString().trim()
      const h = findNearestHeading(content, range)

      savedRangeRef.current = range.cloneRange()

      let top = rect.top - 44
      if (top < 60) top = rect.bottom + 8
      const left = Math.min(Math.max(rect.left + rect.width / 2, 120), window.innerWidth - 120)

      setSelectionToolbar({
        selectedText,
        sectionId: h?.id || '',
        sectionTitle: h?.textContent.replace(/[#\n\r]/g, '').trim() || '',
        canHighlight: canHighlightTextRange(content, range),
        top,
        left,
      })
    }, 10)
  }

  const drawShareCard = (quote, notebookTitle) => {
    const canvas = document.createElement('canvas')
    const W = 600, H = 400, P = 42
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')

    // ── Background: soft blue-white gradient like the hero banner ──
    const bg = ctx.createLinearGradient(0, 0, W, H)
    bg.addColorStop(0, '#f0f5ff')
    bg.addColorStop(0.5, '#f5f8ff')
    bg.addColorStop(1, '#f8faff')
    ctx.fillStyle = bg
    ctx.beginPath()
    ctx.roundRect(0, 0, W, H, 20)
    ctx.fill()

    // ── Subtle dot grid pattern ──
    ctx.fillStyle = 'rgba(148, 163, 184, 0.07)'
    for (let x = 0; x < W; x += 18) {
      for (let y = 0; y < H; y += 18) {
        ctx.beginPath()
        ctx.arc(x, y, 0.7, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // ── Top accent bar ──
    const accentGrad = ctx.createLinearGradient(0, 0, W, 0)
    accentGrad.addColorStop(0, '#1d6bf3')
    accentGrad.addColorStop(1, 'rgba(20, 184, 166, 0.6)')
    ctx.fillStyle = accentGrad
    ctx.beginPath()
    ctx.roundRect(0, 0, W, 4, 2)
    ctx.fill()

    // ── Border ──
    ctx.strokeStyle = 'rgba(29, 107, 243, 0.12)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.roundRect(0.5, 0.5, W - 1, H - 1, 20)
    ctx.stroke()

    // ── Brand section ──
    // Logo mark: a refined geometric icon
    const logoX = P, logoY = P + 10
    // Rounded square background for logo
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.1)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.roundRect(logoX, logoY, 38, 38, 9)
    ctx.fill()
    ctx.stroke()
    // Inner dashed border (like the brand-logo::before)
    ctx.strokeStyle = 'rgba(29, 107, 243, 0.18)'
    ctx.setLineDash([3, 2])
    ctx.beginPath()
    ctx.roundRect(logoX + 5, logoY + 5, 28, 28, 5)
    ctx.stroke()
    ctx.setLineDash([])
    // Gradient overlay
    const logoGrad = ctx.createLinearGradient(logoX, logoY, logoX + 38, logoY + 38)
    logoGrad.addColorStop(0, 'rgba(29, 107, 243, 0.12)')
    logoGrad.addColorStop(1, 'rgba(20, 184, 166, 0.12)')
    ctx.fillStyle = logoGrad
    ctx.beginPath()
    ctx.roundRect(logoX, logoY, 38, 38, 9)
    ctx.fill()
    // "M" monogram in the center
    ctx.font = 'bold 19px "Plus Jakarta Sans", -apple-system, sans-serif'
    ctx.fillStyle = '#1d6bf3'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('M', logoX + 19, logoY + 20)

    // Brand text next to logo
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.font = 'bold 15px "Plus Jakarta Sans", -apple-system, sans-serif'
    ctx.fillStyle = '#172033'
    ctx.fillText('Modern LLM', logoX + 52, logoY + 16)
    ctx.font = '600 12px "Plus Jakarta Sans", -apple-system, sans-serif'
    ctx.fillStyle = '#86868b'
    ctx.fillText('Notebook', logoX + 52, logoY + 32)

    // ── Divider line ──
    const divY = logoY + 62
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(P, divY)
    ctx.lineTo(W - P, divY)
    ctx.stroke()

    // ── Quote section ──
    const quoteStartY = divY + 34
    // Large decorative quote mark
    ctx.font = '72px Georgia, "Times New Roman", serif'
    ctx.fillStyle = 'rgba(29, 107, 243, 0.10)'
    ctx.fillText('"', P - 2, quoteStartY + 6)

    // Quote body
    ctx.font = '15px "Plus Jakarta Sans", -apple-system, sans-serif'
    ctx.fillStyle = '#1d1d1f'
    const maxW = W - P * 2
    const lineH = 25
    const lines = []
    let cur = ''
    for (const ch of quote) {
      const test = cur + ch
      if (ctx.measureText(test).width > maxW && cur.length > 0) {
        lines.push(cur)
        cur = ch
      } else { cur = test }
    }
    if (cur) lines.push(cur)

    const maxQuoteLines = 6
    const displayLines = lines.slice(0, maxQuoteLines)
    for (let i = 0; i < displayLines.length; i++) {
      ctx.fillText(displayLines[i], P, quoteStartY + i * lineH)
    }
    if (lines.length > maxQuoteLines) {
      ctx.fillStyle = '#86868b'
      ctx.fillText('…', P, quoteStartY + maxQuoteLines * lineH)
    }

    // ── Source attribution ──
    const sourceY = quoteStartY + (Math.min(lines.length, maxQuoteLines) + 1) * lineH + 4
    if (notebookTitle) {
      // Small blue dash before the title
      ctx.strokeStyle = 'rgba(29, 107, 243, 0.4)'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(P, sourceY - 5)
      ctx.lineTo(P + 18, sourceY - 5)
      ctx.stroke()
      ctx.font = '12px "Plus Jakarta Sans", -apple-system, sans-serif'
      ctx.fillStyle = '#86868b'
      ctx.fillText(`来自《${notebookTitle}》`, P + 26, sourceY)
    }

    // ── Footer ──
    const footY = H - P + 6
    // Thin separator near bottom
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(P, footY - 8)
    ctx.lineTo(W - P, footY - 8)
    ctx.stroke()

    ctx.font = '11px "Plus Jakarta Sans", -apple-system, sans-serif'
    ctx.fillStyle = '#a1a1a6'
    ctx.fillText('modern-llm-notebook.github.io', P, footY + 4)

    // Right side: small "Share" label
    ctx.textAlign = 'right'
    ctx.fillText('Made with Modern LLM Notebook', W - P, footY + 4)
    ctx.textAlign = 'left'

    return canvas
  }

  const shouldReduceMotion = () => {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  }

  const updateActiveHeading = () => {
    const scroller = contentRef.current
    const content = notebookContentRef.current
    const headings = content ? [...content.querySelectorAll('h2, h3')] : []
    if (!scroller || headings.length === 0) return

    if (scroller.scrollTop < 24) {
      const firstId = headings[0]?.id || null
      const tocButtons = scroller.querySelectorAll('.toc-item')
      tocButtons.forEach((button) => {
        button.classList.toggle('active', button.dataset.tocId === firstId)
      })
      setActiveHeading((prev) => prev === firstId ? prev : firstId)
      return
    }

    const scrollerRect = scroller.getBoundingClientRect()
    const readingLine = scrollerRect.top + Math.min(scroller.clientHeight * 0.34, 240)
    let current = headings[0]

    for (const heading of headings) {
      if (heading.getBoundingClientRect().top <= readingLine) {
        current = heading
      } else {
        break
      }
    }

    const nextId = current?.id || null
    const tocButtons = scroller.querySelectorAll('.toc-item')
    tocButtons.forEach((button) => {
      button.classList.toggle('active', button.dataset.tocId === nextId)
    })
    setActiveHeading((prev) => prev === nextId ? prev : nextId)
  }

  const requestActiveHeadingUpdate = () => {
    if (scrollSpyFrameRef.current) return
    scrollSpyFrameRef.current = requestAnimationFrame(() => {
      scrollSpyFrameRef.current = null
      updateActiveHeading()
    })
  }

  // Extract TOC from notebook HTML
  useEffect(() => {
    if (!notebook?.html) {
      setToc([])
      return
    }
    const items = extractToc(notebook.html)
    setToc(items)
  }, [notebook?.html])

  // Detect whether the TOC still has hidden content below the current scroll position.
  useEffect(() => {
    const el = tocScrollRef.current
    if (!el) { setTocHasMore(false); return }

    const check = () => {
      const remaining = el.scrollHeight - el.scrollTop - el.clientHeight
      setTocHasMore(remaining > 2)
    }

    check()
    el.addEventListener('scroll', check, { passive: true })
    const observer = new ResizeObserver(check)
    observer.observe(el)
    if (el.firstElementChild) observer.observe(el.firstElementChild)

    return () => {
      el.removeEventListener('scroll', check)
      observer.disconnect()
    }
  }, [toc, tocOpen])

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 1023px)')
    const syncTocForMobile = () => {
      if (mobileQuery.matches) setTocOpen(false)
    }

    syncTocForMobile()
    mobileQuery.addEventListener?.('change', syncTocForMobile)
    return () => mobileQuery.removeEventListener?.('change', syncTocForMobile)
  }, [])

  useLayoutEffect(() => {
    const content = notebookContentRef.current
    if (!notebook?.html || !content) {
      return
    }

    const typesetMath = () => {
      if (!window.MathJax?.typesetPromise) return
      window.MathJax.typesetPromise([content])
        .then(requestActiveHeadingUpdate)
        .catch((error) => {
          console.warn('MathJax typeset failed', error)
        })
    }

    if (window.MathJax?.startup?.promise) {
      window.MathJax.startup.promise.then(typesetMath).catch((error) => {
        console.warn('MathJax startup failed', error)
      })
    } else {
      typesetMath()
    }

    requestActiveHeadingUpdate()
    const imageLoadCleanups = []
    content.querySelectorAll('.output_area img, .rendered_html img').forEach((img) => {
      img.setAttribute('tabindex', '0')
      img.setAttribute('role', 'button')
      img.setAttribute('title', lang === 'en' ? 'Click to zoom' : '点击放大')
      if (!img.complete) {
        img.addEventListener('load', requestActiveHeadingUpdate, { once: true })
        imageLoadCleanups.push(() => {
          img.removeEventListener('load', requestActiveHeadingUpdate)
        })
      }
    })
    window.addEventListener('resize', requestActiveHeadingUpdate)

    return () => {
      imageLoadCleanups.forEach((cleanup) => cleanup())
      window.removeEventListener('resize', requestActiveHeadingUpdate)
      if (scrollSpyFrameRef.current) {
        cancelAnimationFrame(scrollSpyFrameRef.current)
        scrollSpyFrameRef.current = null
      }
    }
  }, [notebook?.id, notebook?.html, toc.length])

  useLayoutEffect(() => {
    const content = notebookContentRef.current
    if (!notebook?.id || !content) return

    const notesSyncKey = JSON.stringify(currentNotebookNotes.map((note) => [
      note.id,
      note.updatedAt || 0,
      note.sectionId || '',
      note.sectionTitle || '',
      note.quote || '',
      note.text || '',
      note.anchor?.kind || '',
      note.anchor?.blockIndex ?? null,
      note.anchor?.startOffset ?? null,
      note.anchor?.endOffset ?? null,
      ...(note.anchor?.ranges || []).flatMap((item) => [
        item.blockIndex ?? null,
        item.startOffset ?? null,
        item.endOffset ?? null,
      ]),
    ]))
    const previousSync = previousHighlightSyncRef.current
    if (
      previousSync?.notebookId === notebook.id &&
      previousSync?.html === notebook.html &&
      previousSync?.notesSyncKey === notesSyncKey
    ) {
      return
    }
    previousHighlightSyncRef.current = {
      notebookId: notebook.id,
      html: notebook.html,
      notesSyncKey,
    }

    const activeNoteId = activeHighlightRef.current?.dataset.noteId || ''

    syncSavedHighlights(content, currentNotebookNotes)
    syncSavedNotes(content, currentNotebookNotes)

    if (activeNoteId) {
      const nextActive = content.querySelector(`mark.user-highlight[data-note-id="${activeNoteId}"]`)
      if (nextActive) {
        activeHighlightRef.current = nextActive
        showHighlightEditor(nextActive)
      }
    }
  }, [notebook?.id, notebook?.html, currentNotebookNotes])

  // noteEditor 关闭（任意路径）后清掉暂存的选区 range，避免污染下次新建笔记
  useEffect(() => {
    if (!noteEditor) noteAnchorRangeRef.current = null
  }, [noteEditor])

  useEffect(() => {
    if (!imagePreview && !noteEditor && !selectionToolbar && !highlightEditor) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        // 灯箱在最上层：只关灯箱，不连带关编辑器（避免丢失未保存输入）
        if (imagePreview) {
          closeImagePreview()
          return
        }
        if (noteEditor) setNoteEditor(null)
        if (highlightEditor) {
          setHighlightEditor(null)
          activeHighlightRef.current = null
        }
        if (selectionToolbar) {
          setSelectionToolbar(null)
          window.getSelection()?.removeAllRanges()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [imagePreview, noteEditor, selectionToolbar, highlightEditor, closeImagePreview])

  useEffect(() => {
    if (!highlightEditor) return undefined

    const handlePointerDown = (event) => {
      const target = elementFromNode(event.target)
      if (!target) return

      if (
        target.closest('mark.user-highlight') ||
        target.closest('.highlight-delete-btn') ||
        target.closest('.highlight-drag-handle')
      ) {
        return
      }

      setHighlightEditor(null)
      activeHighlightRef.current = null
    }

    document.addEventListener('pointerdown', handlePointerDown, true)
    return () => document.removeEventListener('pointerdown', handlePointerDown, true)
  }, [highlightEditor])

  useEffect(() => {
    const handlePointerMove = (event) => {
      const drag = highlightDragRef.current
      if (!drag) return

      const moveX = event.clientX - drag.originX
      const moveY = event.clientY - drag.originY
      if (!drag.hasMoved && Math.hypot(moveX, moveY) < 4) return

      const pointerY = Math.abs(moveY) < 10 && drag.rowCenterY !== null
        ? drag.rowCenterY
        : event.clientY
      const offset = getCaretOffsetInBlock(drag.block, event.clientX, pointerY)
      if (offset === null) return

      const maxOffset = drag.block.textContent.length
      const nextStart = drag.side === 'start'
        ? Math.min(Math.max(offset, 0), drag.end - 1)
        : drag.start
      const nextEnd = drag.side === 'end'
        ? Math.max(Math.min(offset, maxOffset), drag.start + 1)
        : drag.end

      const result = replaceHighlightByOffsets(drag.block, drag.mark, nextStart, nextEnd, {
        noteId: drag.noteId,
        sectionId: drag.sectionId,
        sectionTitle: drag.sectionTitle,
      })
      if (!result) return

      activeHighlightRef.current = result.mark
      highlightDragRef.current = {
        ...drag,
        mark: result.mark,
        start: nextStart,
        end: nextEnd,
        anchor: result.anchor,
        rowCenterY: getHighlightSideCenterY(result.mark, drag.side) ?? drag.rowCenterY,
        hasMoved: true,
      }
      showHighlightEditor(result.mark)
    }

    const handlePointerUp = () => {
      const drag = highlightDragRef.current
      if (!drag) return

      const mark = activeHighlightRef.current
      const noteId = drag.noteId
      const quote = noteId
        ? getHighlightQuote(notebookContentRef.current, noteId)
        : mark?.textContent.trim() || ''
      if (mark && noteId && quote) {
        saveNote?.(
          notebook.id,
          drag.sectionId,
          drag.sectionTitle,
          quote,
          '',
          noteId,
          drag.anchor
        )
      }
      highlightDragRef.current = null
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [notebook?.id, saveNote])

  // Reset scroll before paint, then fade the new notebook in.
  useLayoutEffect(() => {
    previousHighlightSyncRef.current = null
    activeHighlightRef.current = null
    highlightDragRef.current = null
    setHighlightEditor(null)
    setVisibleNotebookId(null)
    const scroller = contentRef.current
    if (!scroller) return

    if (revealFrameRef.current) cancelAnimationFrame(revealFrameRef.current)
    if (tocScrollFrameRef.current) cancelAnimationFrame(tocScrollFrameRef.current)
    if (scrollSpyFrameRef.current) {
      cancelAnimationFrame(scrollSpyFrameRef.current)
      scrollSpyFrameRef.current = null
    }

    setActiveHeading(null)
    setTocHasMore(false)
    scroller.scrollTop = 0

    if (shouldReduceMotion()) {
      setVisibleNotebookId(notebook?.id || null)
      return
    }

    revealFrameRef.current = requestAnimationFrame(() => {
      revealFrameRef.current = requestAnimationFrame(() => {
        setVisibleNotebookId(notebook?.id || null)
      })
    })

    return () => {
      if (revealFrameRef.current) cancelAnimationFrame(revealFrameRef.current)
    }
  }, [notebook?.id])

  const handleTocClick = (id) => {
    const scroller = contentRef.current
    if (!scroller) return

    const safeId = typeof CSS !== 'undefined' && CSS.escape
      ? CSS.escape(id)
      : id.replace(/(["'\\!#$%&()*+,./:;<=>?@[\]^`{|}~])/g, '\\$1')
    const el = scroller.querySelector(`#${safeId}`)
    if (!el) return

    setActiveHeading(id)

    const scrollerRect = scroller.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    const offset = elRect.top - scrollerRect.top
    const maxScroll = scroller.scrollHeight - scroller.clientHeight
    const target = Math.min(Math.max(scroller.scrollTop + offset - 32, 0), maxScroll)

    const start = scroller.scrollTop
    const delta = target - start
    if (Math.abs(delta) < 1) return

    if (tocScrollFrameRef.current) {
      cancelAnimationFrame(tocScrollFrameRef.current)
    }

    if (shouldReduceMotion()) {
      scroller.scrollTop = target
      return
    }

    const distance = Math.abs(delta)
    const duration = Math.min(Math.max(300 + distance * 0.055, 380), 960)

    let startTime = null
    const easeAppleOut = (t) => {
      return 1 - Math.pow(1 - t, 3)
    }

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeAppleOut(progress)
      scroller.scrollTop = start + delta * eased
      if (progress < 1) {
        tocScrollFrameRef.current = requestAnimationFrame(animate)
      } else {
        tocScrollFrameRef.current = null
      }
    }

    tocScrollFrameRef.current = requestAnimationFrame(animate)
  }

  const handleViewerScroll = () => {
    requestActiveHeadingUpdate()
    if (highlightEditor) updateHighlightEditorPosition()
  }

  const handleNotebookClick = (event) => {
    const highlight = event.target.closest('mark.user-highlight')
    if (highlight && notebookContentRef.current?.contains(highlight)) {
      event.preventDefault()
      event.stopPropagation()
      setSelectionToolbar(null)
      window.getSelection()?.removeAllRanges()
      showHighlightEditor(highlight)
      return
    }

    const noteAnchor = event.target.closest('mark.note-anchor')
    if (noteAnchor && notebookContentRef.current?.contains(noteAnchor)) {
      event.preventDefault()
      event.stopPropagation()
      setSelectionToolbar(null)
      window.getSelection()?.removeAllRanges()
      const noteId = noteAnchor.dataset.noteId || null
      const matchedNote = noteId ? currentNotebookNotes.find((n) => n.id === noteId) : null
      const rect = noteAnchor.getBoundingClientRect()
      setNoteEditor({
        noteId,
        sectionId: noteAnchor.dataset.sectionId || '',
        sectionTitle: noteAnchor.dataset.sectionTitle || '',
        quote: noteAnchor.dataset.noteQuote || noteAnchor.textContent,
        text: matchedNote?.text || '',
        images: matchedNote?.images || [],
        removedImages: [],
        top: Math.max(80, rect.top - 20),
        left: Math.min(Math.max(rect.left, 80), window.innerWidth - 360),
      })
      return
    }

    const image = event.target.closest('.output_area img, .rendered_html img')
    if (image && notebookContentRef.current?.contains(image)) {
      event.preventDefault()
      event.stopPropagation()
      openSrc(image.currentSrc || image.src, image.alt || 'notebook output')
      return
    }

    const copyButton = event.target.closest('.code-copy-button')
    if (copyButton && notebookContentRef.current?.contains(copyButton)) {
      event.preventDefault()
      event.stopPropagation()

      const codeCell = copyButton.closest('.code_cell')
      const pre = codeCell?.querySelector('.input_area pre')
      const code = pre?.innerText || ''
      if (!code) return

      const markCopied = () => {
        copyButton.classList.add('copied')
        copyButton.setAttribute('aria-label', 'Copied code')
        copyButton.setAttribute('title', 'Copied')
        window.setTimeout(() => {
          copyButton.classList.remove('copied')
          copyButton.setAttribute('aria-label', 'Copy code')
          copyButton.setAttribute('title', 'Copy code')
        }, 1200)
      }

      const fallbackCopy = () => {
        const textarea = document.createElement('textarea')
        textarea.value = code
        textarea.setAttribute('readonly', '')
        textarea.style.position = 'fixed'
        textarea.style.left = '-9999px'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }

      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(code).then(markCopied).catch(() => {
          fallbackCopy()
          markCopied()
        })
      } else {
        fallbackCopy()
        markCopied()
      }
      return
    }

    const input = event.target.closest('.code-input-expandable')
    if (input && notebookContentRef.current?.contains(input)) {
      const selection = window.getSelection()
      if (selection && !selection.isCollapsed) return

      const toggle = input.querySelector('.code-expand-toggle')
      if (!toggle) return
      toggle.checked = !toggle.checked
      return
    }

    if (highlightEditor) {
      setHighlightEditor(null)
      activeHighlightRef.current = null
    }

    const output = event.target.closest('.output-expandable')
    if (!output || !notebookContentRef.current?.contains(output)) return

    const selection = window.getSelection()
    if (selection && !selection.isCollapsed) return

    const toggle = output.querySelector('.output-expand-toggle')
    if (!toggle) return
    toggle.checked = !toggle.checked
  }

  const handleNotebookKeyDown = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return

    const image = event.target.closest?.('.output_area img, .rendered_html img')
    if (!image || !notebookContentRef.current?.contains(image)) return

    event.preventDefault()
    openSrc(image.currentSrc || image.src, image.alt || 'notebook output')
  }

  // 只有"既没 notebook 又在 loading"(首次进入应用还没加载过任何 notebook)才用全屏 spinner
  // 切换时保留旧 notebook 显示,新 notebook 就绪后无缝替换,避免每次切换都看到 spinner
  if (loading && !notebook) {
    return (
      <div className="viewer" ref={contentRef}>
        <div className="loading">
          <div className="spinner" />
          <span>{lang === 'en' ? 'Loading...' : '加载中...'}</span>
        </div>
      </div>
    )
  }

  if (!notebook) {
    return (
      <div className="viewer" ref={contentRef}>
        <div className="loading">
          <span>{lang === 'en' ? 'Choose a notebook to start learning' : '选择一个 Notebook 开始学习'}</span>
        </div>
      </div>
    )
  }

  const isVisible = visibleNotebookId === notebook.id
  const launchLinks = getNotebookLaunchLinks(meta, notebook.id)

  return (
    <div className="viewer" ref={contentRef} onScroll={handleViewerScroll}>
      <div className={`viewer-header${isVisible ? ' visible' : ''}`}>
        <div className="viewer-part">{meta?.part}</div>
        <h1 className="viewer-title">{meta?.title}</h1>
        <div className="viewer-launches">
          {notebook?.id && (
            <button
              className={`bookmark-star ${isBookmarked?.(notebook.id) ? 'active' : ''}`}
              onClick={() => {
                toggleBookmark?.(notebook.id, meta?.title || '')
              }}
              title={isBookmarked?.(notebook.id)
                ? (lang === 'en' ? 'Remove bookmark' : '取消收藏')
                : (lang === 'en' ? 'Bookmark' : '收藏')}
            >
              <Star className="w-5 h-5" />
            </button>
          )}
          {launchLinks.map((link) => {
            const content = (
              <>
              <span className="viewer-launch-icon" aria-hidden="true">
                {link.id === 'modelscope' && 'MS'}
                {link.id === 'colab' && (
                  <svg width="18" height="11" viewBox="0.17 5.07 23.67 13.87" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.54,9.46,2.19,7.1a6.93,6.93,0,0,0,0,9.79l2.36-2.36A3.59,3.59,0,0,1,4.54,9.46Z" fill="#E8710A"/>
                    <path d="M2.19,7.1,4.54,9.46a3.59,3.59,0,0,1,5.08,0l1.71-2.93h0l-.1-.08h0A6.93,6.93,0,0,0,2.19,7.1Z" fill="#F9AB00"/>
                    <path d="M11.34,17.46h0L9.62,14.54a3.59,3.59,0,0,1-5.08,0L2.19,16.9a6.93,6.93,0,0,0,9,.65l.11-.09" fill="#F9AB00"/>
                    <path d="M12,7.1a6.93,6.93,0,0,0,0,9.79l2.36-2.36a3.59,3.59,0,1,1,5.08-5.08L21.81,7.1A6.93,6.93,0,0,0,12,7.1Z" fill="#F9AB00"/>
                    <path d="M21.81,7.1,19.46,9.46a3.59,3.59,0,0,1-5.08,5.08L12,16.9A6.93,6.93,0,0,0,21.81,7.1Z" fill="#E8710A"/>
                  </svg>
                )}
              </span>
              {link.label}
              </>
            )

            if (link.disabled) {
              return (
                <span
                  key={link.id}
                  className={`viewer-launch viewer-launch-${link.id} disabled`}
                  aria-disabled="true"
                  title="Coming soon"
                >
                  {content}
                </span>
              )
            }

            return (
              <a
                key={link.id}
                className={`viewer-launch viewer-launch-${link.id}`}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {content}
              </a>
            )
          })}
        </div>
      </div>

      {toc.length > 0 && (
        <button
          type="button"
          className={`toc-toggle${tocOpen ? ' active' : ''}`}
          onClick={() => setTocOpen((open) => !open)}
          title={tocOpen
            ? (lang === 'en' ? 'Hide outline' : '收起大纲')
            : (lang === 'en' ? 'Show outline' : '展开大纲')}
          aria-label={tocOpen
            ? (lang === 'en' ? 'Hide outline' : '收起大纲')
            : (lang === 'en' ? 'Show outline' : '展开大纲')}
        >
          {tocOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          <span>{lang === 'en' ? 'Outline' : '大纲'}</span>
        </button>
      )}

      <div className={`viewer-body${tocOpen ? '' : ' toc-collapsed'}`}>
        <div
          key={notebook.id}
          className={`notebook-content${isVisible ? ' visible' : ''}`}
          ref={notebookContentRef}
          onClick={handleNotebookClick}
          onMouseUp={handleNotebookMouseUp}
          onKeyDown={handleNotebookKeyDown}
          dangerouslySetInnerHTML={notebookHtml}
        />

        {imagePreview && (
          <ImageLightbox
            src={imagePreview.src}
            alt={imagePreview.alt}
            lang={lang}
            onClose={closeImagePreview}
          />
        )}

        {noteEditor && (
          <div
            className="note-editor-backdrop"
            onClick={() => setNoteEditor(null)}
          >
            <div
              className="note-editor-popup"
              style={{ top: noteEditor.top, left: noteEditor.left }}
              onClick={(e) => e.stopPropagation()}
              onPaste={handleNoteEditorPaste}
            >
              <div className="note-editor-header">
                <span className="note-editor-section">{noteEditor.sectionTitle}</span>
                <button
                  className="note-editor-close"
                  onClick={() => setNoteEditor(null)}
                >&times;</button>
              </div>
              {noteEditor.quote && (
                <blockquote className="note-editor-quote">{noteEditor.quote}</blockquote>
              )}
              {noteEditor.images && noteEditor.images.length > 0 && (
                <div className="note-editor-images">
                  {noteEditor.images.map((img, i) => {
                    const entry = normalizeImageEntry(img)
                    return (
                      <div key={i} className="note-editor-image-item">
                        <img
                          src={entry.thumb}
                          alt=""
                          onClick={() => {
                            // 新加的图片原图还在内存（file），直接用；已保存的从 IndexedDB 取
                            if (img.file) {
                              openBlob(img.file, `note image ${i + 1}`)
                            } else {
                              openEntry(img, `note image ${i + 1}`)
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="note-editor-image-remove"
                          onClick={(e) => {
                            e.stopPropagation()
                            // 删除延迟生效：移入 removedImages，保存时才清 IndexedDB（取消则原图保留）
                            setNoteEditor({
                              ...noteEditor,
                              images: noteEditor.images.filter((_, idx) => idx !== i),
                              removedImages: [...(noteEditor.removedImages || []), img],
                            })
                          }}
                        >&times;</button>
                      </div>
                    )
                  })}
                </div>
              )}
              <textarea
                className="note-editor-textarea"
                value={noteEditor.text}
                onChange={(e) => setNoteEditor({ ...noteEditor, text: e.target.value })}
                placeholder={lang === 'en' ? 'Write your note...' : '写下你的笔记...'}
                rows={4}
                autoFocus
              />
              <div className="note-editor-toolbar">
                <button
                  type="button"
                  className="note-editor-btn note-editor-add-image"
                  onClick={() => imageInputRef.current?.click()}
                  title={lang === 'en' ? 'Insert image' : '插入图片'}
                >
                  <ImagePlus className="w-3.5 h-3.5" />
                  <span>{lang === 'en' ? 'Image' : '图片'}</span>
                </button>
                <span className="note-editor-paste-hint">
                  {lang === 'en' ? 'Paste image: Ctrl/Cmd+V' : '可粘贴图片 Ctrl/Cmd+V'}
                </span>
              </div>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handleImageInputChange}
              />
              <div className="note-editor-actions">
                {noteEditor.noteId && (
                  <button
                    className="note-editor-btn note-editor-delete"
                    onClick={() => {
                      deleteNote?.(notebook.id, noteEditor.noteId)
                      setNoteEditor(null)
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{lang === 'en' ? 'Delete' : '删除'}</span>
                  </button>
                )}
                <div className="note-editor-spacer" />
                <button
                  className="note-editor-btn note-editor-cancel"
                  onClick={() => setNoteEditor(null)}
                >
                  {lang === 'en' ? 'Cancel' : '取消'}
                </button>
                <button
                  className="note-editor-btn note-editor-save"
                  onClick={async () => {
                    const root = notebookContentRef.current
                    // 新建笔记时从暂存选区算 anchor；编辑模式下不传，保留原 anchor
                    const anchor = (!noteEditor.noteId && root && noteAnchorRangeRef.current)
                      ? computeAnchorFromRange(root, noteAnchorRangeRef.current)
                      : undefined
                    const images = noteEditor.images || []
                    // 新图片（带 file）保存时才写 IndexedDB；本次删除的图片同步清理
                    try {
                      await Promise.all(images
                        .filter((img) => img?.file && img?.id)
                        .map((img) => putImage(img.id, img.file)))
                      await Promise.all((noteEditor.removedImages || [])
                        .filter((img) => img?.id)
                        .map((img) => deleteImage(img.id)))
                    } catch (err) {
                      // IDB 不可用（如隐私模式）时降级：笔记照存，原图缺失时灯箱回退缩略图
                      console.warn('[notes] 图片落库失败，将仅保留缩略图', err)
                    }
                    saveNote?.(
                      notebook.id,
                      noteEditor.sectionId,
                      noteEditor.sectionTitle,
                      noteEditor.quote || '',
                      noteEditor.text,
                      noteEditor.noteId || undefined,
                      anchor,
                      {
                        // 剥离 file，只把 { id, thumb } 引用存进笔记数据
                        images: images.map((img) => {
                          const e = normalizeImageEntry(img)
                          return { id: e.id, thumb: e.thumb }
                        })
                      }
                    )
                    noteAnchorRangeRef.current = null
                    setNoteEditor(null)
                  }}
                  disabled={!noteEditor.text.trim() && !noteEditor.quote && (!noteEditor.images || noteEditor.images.length === 0)}
                >
                  {lang === 'en' ? 'Save' : '保存'}
                </button>
              </div>
            </div>
          </div>
        )}

        {sharePreview && (
          <div className="modal-overlay" onClick={() => setSharePreview(null)}>
            <div className="modal-backdrop" />
            <div className="modal-card share-card-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{lang === 'en' ? 'Share Card' : '分享卡片'}</h2>
                <button className="modal-close" onClick={() => setSharePreview(null)}>&times;</button>
              </div>
              <div className="modal-body share-card-body">
                <canvas ref={shareCanvasRef} className="share-canvas" />
              </div>
              <div className="modal-footer share-card-footer">
                <button
                  className="notes-action-btn"
                  onClick={() => {
                    const canvas = shareCanvasRef.current
                    if (!canvas) return
                    canvas.toBlob((blob) => {
                      if (!blob) return
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `mln-share-${new Date().toISOString().slice(0, 10)}.png`
                      a.click()
                      URL.revokeObjectURL(url)
                    }, 'image/png')
                  }}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{lang === 'en' ? 'Download' : '下载'}</span>
                </button>
                <button
                  className="notes-action-btn"
                  onClick={async () => {
                    const canvas = shareCanvasRef.current
                    if (!canvas) return
                    try {
                      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
                      if (blob && navigator.clipboard?.write) {
                        await navigator.clipboard.write([
                          new ClipboardItem({ 'image/png': blob })
                        ])
                      }
                    } catch (_) {
                      // Fallback: open in new tab for manual copy
                      const url = canvas.toDataURL('image/png')
                      window.open(url, '_blank')
                    }
                  }}
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{lang === 'en' ? 'Copy' : '复制图片'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {highlightEditor && (
          <>
            <button
              type="button"
              className="highlight-delete-btn"
              title={lang === 'en' ? 'Remove highlight' : '删除高亮'}
              style={{ top: highlightEditor.deleteTop, left: highlightEditor.deleteLeft }}
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                deleteActiveHighlight()
              }}
            >
              ×
            </button>
            {highlightEditor.canResize && (
              <>
                <span
                  role="presentation"
                  className="highlight-drag-handle highlight-drag-handle-start"
                  title={lang === 'en' ? 'Drag to adjust start' : '拖动调整起点'}
                  style={{
                    top: highlightEditor.startTop,
                    left: highlightEditor.startLeft,
                    height: highlightEditor.startHeight,
                  }}
                  onPointerDown={(e) => startHighlightDrag(e, 'start')}
                />
                <span
                  role="presentation"
                  className="highlight-drag-handle highlight-drag-handle-end"
                  title={lang === 'en' ? 'Drag to adjust end' : '拖动调整终点'}
                  style={{
                    top: highlightEditor.endTop,
                    left: highlightEditor.endLeft,
                    height: highlightEditor.endHeight,
                  }}
                  onPointerDown={(e) => startHighlightDrag(e, 'end')}
                />
              </>
            )}
          </>
        )}

        {selectionToolbar && (
          <div className="selection-toolbar" style={{ top: selectionToolbar.top, left: selectionToolbar.left }}>
            <button
              className="selection-toolbar-btn"
              title={lang === 'en' ? 'Copy' : '复制'}
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation() }}
              onMouseUp={(e) => { e.preventDefault(); e.stopPropagation() }}
              onClick={(e) => {
                e.preventDefault(); e.stopPropagation()
                const txt = window.getSelection()?.toString().trim() || selectionToolbar.selectedText
                if (navigator.clipboard?.writeText) {
                  navigator.clipboard.writeText(txt)
                } else {
                  const ta = document.createElement('textarea')
                  ta.value = txt
                  ta.style.position = 'fixed'
                  ta.style.left = '-9999px'
                  document.body.appendChild(ta)
                  ta.select()
                  document.execCommand('copy')
                  document.body.removeChild(ta)
                }
                window.getSelection()?.removeAllRanges()
                setSelectionToolbar(null)
              }}
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              className="selection-toolbar-btn"
              title={lang === 'en' ? 'Note' : '笔记'}
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation() }}
              onMouseUp={(e) => { e.preventDefault(); e.stopPropagation() }}
              onClick={(e) => {
                e.preventDefault(); e.stopPropagation()
                // 暂存选区 range，保存时用来计算笔记 anchor
                noteAnchorRangeRef.current = savedRangeRef.current?.cloneRange() || null
                savedRangeRef.current = null
                setNoteEditor({
                  noteId: null,
                  sectionId: selectionToolbar.sectionId,
                  sectionTitle: selectionToolbar.sectionTitle,
                  quote: selectionToolbar.selectedText,
                  text: '',
                  images: [],
                  removedImages: [],
                  top: selectionToolbar.top - 20,
                  left: Math.min(selectionToolbar.left, window.innerWidth - 360),
                })
                setSelectionToolbar(null)
                window.getSelection()?.removeAllRanges()
              }}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              className="selection-toolbar-btn"
              title={selectionToolbar.canHighlight
                ? (lang === 'en' ? 'Highlight' : '高亮')
                : (lang === 'en'
                  ? 'Only body text can be highlighted'
                  : '只能高亮正文文字')}
              disabled={!selectionToolbar.canHighlight}
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                commitSelectionHighlight()
              }}
              onMouseUp={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                commitSelectionHighlight()
              }}
            >
              <Highlighter className="w-3.5 h-3.5" />
            </button>
            <button
              className="selection-toolbar-btn"
              title={lang === 'en' ? 'Share as card' : '分享卡片'}
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation() }}
              onMouseUp={(e) => { e.preventDefault(); e.stopPropagation() }}
              onClick={(e) => {
                e.preventDefault(); e.stopPropagation()
                setSharePreview({
                  quote: selectionToolbar.selectedText,
                  notebookTitle: meta?.title || '',
                })
                setSelectionToolbar(null)
                window.getSelection()?.removeAllRanges()
              }}
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {toc.length > 0 && tocOpen && (
          <aside className={`toc${isVisible ? ' visible' : ''}`}>
            <div className={`toc-sticky${tocHasMore ? ' toc-has-more' : ''}`}>
              <div className="toc-scroll" ref={tocScrollRef}>
                <div className="toc-title">{lang === 'en' ? 'Outline' : '大纲'}</div>
                <nav className="toc-nav">
                  {toc.map((item) => {
                    const hasTocNote = currentNotebookNotes.some((n) => n.sectionId === item.id)
                    return (
                      <button
                        key={item.id}
                        data-toc-id={item.id}
                        className={[
                          'toc-item',
                          activeHeading === item.id ? 'active' : '',
                          `toc-level-${item.level}`,
                        ].join(' ')}
                        onClick={() => handleTocClick(item.id)}
                      >
                        <span className="toc-item-text">{item.text}</span>
                        {hasTocNote && <span className="toc-item-note-dot" title={lang === 'en' ? 'Has note' : '有笔记'} />}
                      </button>
                    )
                  })}
                </nav>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}

export default NotebookViewer
