import { useState, useCallback, useMemo } from 'react'
import {
  getAllImages,
  putImage,
  deleteImage,
  clearImages,
  normalizeImageEntry,
} from '../utils/imageStore.js'

const BOOKMARKS_KEY = 'mln_bookmarks'
const NOTES_KEY = 'mln_notes'

// Blob → data URL（导出时把 IndexedDB 原图内嵌进 JSON）
function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

function loadJSON(key, fallback = {}) {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return fallback
    return parsed
  } catch {
    return fallback
  }
}

function saveJSON(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or unavailable — silently fail
  }
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

export default function useNotesAndBookmarks() {
  const [bookmarks, setBookmarks] = useState(() => loadJSON(BOOKMARKS_KEY))
  const [notes, setNotes] = useState(() => loadJSON(NOTES_KEY))

  const toggleBookmark = useCallback((id, title) => {
    setBookmarks((prev) => {
      const next = { ...prev }
      if (next[id]) {
        delete next[id]
      } else {
        next[id] = { title, addedAt: Date.now() }
      }
      saveJSON(BOOKMARKS_KEY, next)
      return next
    })
  }, [])

  const isBookmarked = useCallback((id) => {
    return !!bookmarks[id]
  }, [bookmarks])

  const saveNote = useCallback((
    notebookId,
    sectionId,
    sectionTitle,
    quote,
    text,
    noteId,
    anchor,
    options = {}
  ) => {
    const { images } = options
    setNotes((prev) => {
      const next = { ...prev }
      const list = [...(next[notebookId] || [])]
      if (noteId) {
        const idx = list.findIndex((n) => n.id === noteId)
        if (idx >= 0) {
          list[idx] = { ...list[idx], sectionTitle, quote, text, updatedAt: Date.now() }
          if (anchor) list[idx].anchor = anchor
          if (images !== undefined) list[idx].images = images
        } else {
          list.push({
            id: noteId,
            sectionId,
            sectionTitle,
            quote,
            text,
            ...(anchor ? { anchor } : {}),
            ...(images !== undefined ? { images } : {}),
            updatedAt: Date.now(),
          })
        }
      } else {
        // Create new
        list.push({
          id: makeId(),
          sectionId,
          sectionTitle,
          quote,
          text,
          ...(anchor ? { anchor } : {}),
          ...(images !== undefined ? { images } : {}),
          updatedAt: Date.now(),
        })
      }
      next[notebookId] = list
      saveJSON(NOTES_KEY, next)
      return next
    })
  }, [])

  const deleteNote = useCallback((notebookId, noteId) => {
    setNotes((prev) => {
      const next = { ...prev }
      const removed = (next[notebookId] || []).find((n) => n.id === noteId)
      const list = (next[notebookId] || []).filter((n) => n.id !== noteId)
      if (list.length === 0) {
        delete next[notebookId]
      } else {
        next[notebookId] = list
      }
      // 联动清理该笔记引用的 IndexedDB 原图（幂等，StrictMode 双调无害）
      if (removed?.images) {
        for (const img of removed.images) {
          const { id } = normalizeImageEntry(img)
          if (id) deleteImage(id).catch(() => {})
        }
      }
      saveJSON(NOTES_KEY, next)
      return next
    })
  }, [])

  // 仅更新笔记的 sectionId/sectionTitle，保留其他字段和 updatedAt
  // 用于历史子标题笔记的惰性迁移（修正 bug 前错位的 sectionId）
  const updateNoteSection = useCallback((notebookId, noteId, sectionId, sectionTitle) => {
    setNotes((prev) => {
      const list = prev[notebookId]
      if (!Array.isArray(list)) return prev
      const idx = list.findIndex((n) => n.id === noteId)
      if (idx < 0) return prev
      const next = { ...prev }
      const nextList = [...list]
      nextList[idx] = { ...nextList[idx], sectionId, sectionTitle }
      next[notebookId] = nextList
      saveJSON(NOTES_KEY, next)
      return next
    })
  }, [])

  const getSectionNotes = useCallback((notebookId) => {
    return (notes[notebookId] || []).slice().sort((a, b) => b.updatedAt - a.updatedAt)
  }, [notes])

  const notebooksWithNotes = useMemo(() => {
    const set = new Set()
    for (const [id, list] of Object.entries(notes)) {
      if (list.length > 0) set.add(id)
    }
    return set
  }, [notes])

  const exportData = useCallback(async () => {
    // 原图从 IndexedDB 读出并 base64 内嵌，保证备份可完整还原
    const images = {}
    try {
      const all = await getAllImages()
      for (const { id, blob } of all) {
        images[id] = await blobToDataUrl(blob)
      }
    } catch (err) {
      console.warn('[notes] 导出图片失败，将仅导出文本数据', err)
    }
    return JSON.stringify({ bookmarks, notes, images, exportedAt: new Date().toISOString() }, null, 2)
  }, [bookmarks, notes])

  const importData = useCallback(async (jsonString) => {
    try {
      const data = JSON.parse(jsonString)
      if (!data || typeof data !== 'object') throw new Error('Invalid format')
      const newBookmarks = data.bookmarks && typeof data.bookmarks === 'object' && !Array.isArray(data.bookmarks)
        ? data.bookmarks
        : {}
      const newNotes = data.notes && typeof data.notes === 'object' && !Array.isArray(data.notes)
        ? data.notes
        : {}
      // 还原 IndexedDB 原图（旧版导出文件无 images 字段则跳过）
      let imageCount = 0
      if (data.images && typeof data.images === 'object' && !Array.isArray(data.images)) {
        try {
          await clearImages()
          for (const [id, dataUrl] of Object.entries(data.images)) {
            const blob = await (await fetch(dataUrl)).blob()
            await putImage(id, blob)
            imageCount += 1
          }
        } catch (err) {
          console.warn('[notes] 导入图片失败，已仅还原文本数据', err)
        }
      }
      setBookmarks(newBookmarks)
      setNotes(newNotes)
      saveJSON(BOOKMARKS_KEY, newBookmarks)
      saveJSON(NOTES_KEY, newNotes)
      let noteCount = 0
      for (const list of Object.values(newNotes)) {
        if (Array.isArray(list)) noteCount += list.length
      }
      return { ok: true, bookmarkCount: Object.keys(newBookmarks).length, noteCount, imageCount }
    } catch {
      return { ok: false, error: 'Invalid import file' }
    }
  }, [])

  const importFile = useCallback((file) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = async () => {
        const result = await importData(reader.result)
        resolve(result)
      }
      reader.onerror = () => {
        resolve({ ok: false, error: 'Failed to read file' })
      }
      reader.readAsText(file)
    })
  }, [importData])

  const clearAll = useCallback(() => {
    setBookmarks({})
    setNotes({})
    saveJSON(BOOKMARKS_KEY, {})
    saveJSON(NOTES_KEY, {})
    clearImages().catch(() => {})
  }, [])

  const bookmarkCount = useMemo(() => Object.keys(bookmarks).length, [bookmarks])
  const noteCount = useMemo(() => {
    let count = 0
    for (const list of Object.values(notes)) {
      if (Array.isArray(list)) count += list.length
    }
    return count
  }, [notes])

  return {
    bookmarks,
    notes,
    notebooksWithNotes,
    toggleBookmark,
    isBookmarked,
    saveNote,
    deleteNote,
    updateNoteSection,
    getSectionNotes,
    exportData,
    importData,
    importFile,
    clearAll,
    bookmarkCount,
    noteCount,
  }
}
