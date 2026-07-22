import { useState, useCallback, useMemo } from 'react'

const BOOKMARKS_KEY = 'mln_bookmarks'
const NOTES_KEY = 'mln_notes'

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
    anchor
  ) => {
    setNotes((prev) => {
      const next = { ...prev }
      const list = [...(next[notebookId] || [])]
      if (noteId) {
        const idx = list.findIndex((n) => n.id === noteId)
        if (idx >= 0) {
          list[idx] = { ...list[idx], sectionTitle, quote, text, updatedAt: Date.now() }
          if (anchor) list[idx].anchor = anchor
        } else {
          list.push({
            id: noteId,
            sectionId,
            sectionTitle,
            quote,
            text,
            ...(anchor ? { anchor } : {}),
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
      const list = (next[notebookId] || []).filter((n) => n.id !== noteId)
      if (list.length === 0) {
        delete next[notebookId]
      } else {
        next[notebookId] = list
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

  const exportData = useCallback(() => {
    return JSON.stringify({ bookmarks, notes, exportedAt: new Date().toISOString() }, null, 2)
  }, [bookmarks, notes])

  const importData = useCallback((jsonString) => {
    try {
      const data = JSON.parse(jsonString)
      if (!data || typeof data !== 'object') throw new Error('Invalid format')
      const newBookmarks = data.bookmarks && typeof data.bookmarks === 'object' && !Array.isArray(data.bookmarks)
        ? data.bookmarks
        : {}
      const newNotes = data.notes && typeof data.notes === 'object' && !Array.isArray(data.notes)
        ? data.notes
        : {}
      setBookmarks(newBookmarks)
      setNotes(newNotes)
      saveJSON(BOOKMARKS_KEY, newBookmarks)
      saveJSON(NOTES_KEY, newNotes)
      let noteCount = 0
      for (const list of Object.values(newNotes)) {
        if (Array.isArray(list)) noteCount += list.length
      }
      return { ok: true, bookmarkCount: Object.keys(newBookmarks).length, noteCount }
    } catch {
      return { ok: false, error: 'Invalid import file' }
    }
  }, [])

  const importFile = useCallback((file) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = importData(reader.result)
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
