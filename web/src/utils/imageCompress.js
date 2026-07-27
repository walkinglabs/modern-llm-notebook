// 图片压缩工具：把 File/Blob 压缩成 data URL
// 最长边 ≤ maxSide，JPEG quality，避免 localStorage 撑爆
// 单张 1200px JPEG 0.85 通常 80-300KB，5MB 限额约够 15-50 张

/**
 * 压缩图片文件为 data URL
 * @param {File|Blob} file - 图片文件
 * @param {{maxSide?: number, quality?: number}} options - 压缩参数
 * @returns {Promise<string>} data URL（image/jpeg）
 */
export function compressImage(file, options = {}) {
  const { maxSide = 1200, quality = 0.85 } = options
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        // 保持比例缩放，最长边不超过 maxSide
        if (width > maxSide || height > maxSide) {
          if (width >= height) {
            height = Math.round((height * maxSide) / width)
            width = maxSide
          } else {
            width = Math.round((width * maxSide) / height)
            height = maxSide
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = reader.result
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}
