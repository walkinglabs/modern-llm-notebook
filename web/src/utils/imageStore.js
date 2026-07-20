// 笔记图片原图存储：IndexedDB 封装
// 设计：原图 Blob 存 IndexedDB（配额按磁盘算，GB 级），
// 笔记数据（localStorage）里只存 { id, thumb } 引用 + 320px 缩略图。
// localStorage 约 5MB 硬顶装不下原图（base64 还膨胀 33%），这是分流的根因。

import { compressImage } from './imageCompress.js'

const DB_NAME = 'mln-images'
const STORE_NAME = 'images'
const THUMB_MAX_SIDE = 320
const THUMB_QUALITY = 0.8

export const MAX_IMAGE_MB = 5

function makeImageId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

// 打开数据库（缓存 promise，全应用共享一个连接）
let dbPromise = null
function openDB() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1)
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE_NAME)) {
          req.result.createObjectStore(STORE_NAME)
        }
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  }
  return dbPromise
}

// 事务包装：fn 返回的 IDBRequest 完成时，把 request.result 作为结果返回
async function withStore(mode, fn) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode)
    const store = tx.objectStore(STORE_NAME)
    const req = fn(store)
    tx.oncomplete = () => resolve(req?.result)
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

export async function putImage(id, blob) {
  await withStore('readwrite', (store) => store.put(blob, id))
}

export async function getImage(id) {
  const blob = await withStore('readonly', (store) => store.get(id))
  return blob ?? null
}

export async function deleteImage(id) {
  await withStore('readwrite', (store) => store.delete(id))
}

export async function clearImages() {
  await withStore('readwrite', (store) => store.clear())
}

// 导出用：读出全部 { id, blob }
export async function getAllImages() {
  const blobs = (await withStore('readonly', (store) => store.getAll())) || []
  const ids = (await withStore('readonly', (store) => store.getAllKeys())) || []
  return ids.map((id, i) => ({ id, blob: blobs[i] }))
}

/**
 * 校验并预处理一张图片：生成 id 和缩略图，原图 file 暂存内存。
 * 注意：这里不写 IndexedDB——保存笔记时才 putImage，取消编辑则零痕迹。
 * @param {File} file - 图片文件
 * @returns {Promise<{id: string, thumb: string, file: File}>}
 *   id 供保存时 putImage 使用；thumb 为 320px data URL；file 为原图
 * @throws {Error} 'image-too-large' 单张超过 MAX_IMAGE_MB
 */
export async function prepareImage(file) {
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
    throw new Error('image-too-large')
  }
  const thumb = await compressImage(file, {
    maxSide: THUMB_MAX_SIDE,
    quality: THUMB_QUALITY,
  })
  return { id: makeImageId(), thumb, file }
}

/**
 * 归一化图片条目：旧格式是纯字符串 dataUrl（1200px 压缩图），
 * 新格式是 { id, thumb }。统一成 { id, thumb }，旧格式 id=null（灯箱回退展示 thumb）。
 */
export function normalizeImageEntry(img) {
  if (typeof img === 'string') return { id: null, thumb: img }
  if (img && typeof img === 'object') return { id: img.id || null, thumb: img.thumb || '' }
  return { id: null, thumb: '' }
}
