import { useCallback, useState } from 'react'
import { getImage, normalizeImageEntry } from '../utils/imageStore.js'

/**
 * 共用图片灯箱：毛玻璃背板全屏预览，点背景/关闭按钮关闭。
 * 结构与类名和 NotebookViewer 原内联实现完全一致（CSS 复用 .image-lightbox*）。
 */
export default function ImageLightbox({ src, alt, lang, onClose }) {
  return (
    <div
      className="image-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={lang === 'en' ? 'Image preview' : '图片预览'}
      onClick={onClose}
    >
      <button
        className="image-lightbox-close"
        type="button"
        aria-label={lang === 'en' ? 'Close image preview' : '关闭图片预览'}
        onClick={onClose}
      >
        ×
      </button>
      <div className="image-lightbox-scroll">
        <img src={src} alt={alt} onClick={(event) => event.stopPropagation()} />
      </div>
    </div>
  )
}

/**
 * 图片预览状态管理：封装"笔记图片条目 → 灯箱 src"的异步解析。
 * - openEntry：笔记图片（{ id, thumb }），有 id 时从 IndexedDB 取原图转 objectURL
 * - openSrc：直接给 src（正文图片等无需解析的场景）
 * - close：关闭并 revoke objectURL，防内存泄漏
 */
export function useImagePreview() {
  const [imagePreview, setImagePreview] = useState(null)

  const close = useCallback(() => {
    setImagePreview((prev) => {
      if (prev?.isBlobUrl) URL.revokeObjectURL(prev.src)
      return null
    })
  }, [])

  const openBlob = useCallback((blob, alt) => {
    setImagePreview({ src: URL.createObjectURL(blob), alt, isBlobUrl: true })
  }, [])

  const openEntry = useCallback(async (entry, alt) => {
    const { id, thumb } = normalizeImageEntry(entry)
    if (id) {
      try {
        const blob = await getImage(id)
        if (blob) {
          openBlob(blob, alt)
          return
        }
      } catch {
        // IndexedDB 读取失败时回退展示缩略图
      }
    }
    setImagePreview({ src: thumb, alt, isBlobUrl: false })
  }, [openBlob])

  const openSrc = useCallback((src, alt) => {
    setImagePreview({ src, alt, isBlobUrl: false })
  }, [])

  return { imagePreview, openEntry, openBlob, openSrc, close }
}
