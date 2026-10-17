/**
 * Nén ảnh trước khi lưu vào localStorage hoặc tải lên Supabase
 * Giúp giảm dung lượng từ 3MB-10MB xuống còn ~60KB-120KB mà vẫn giữ độ nét cao,
 * tránh lỗi QuotaExceededError trên trình duyệt.
 */
export const compressImage = (
  file: File,
  maxWidth = 1600,
  maxHeight = 900,
  quality = 0.8
): Promise<string> => {
  return new Promise((resolve) => {
    // Nếu không phải ảnh thông thường hoặc là ảnh SVG
    if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        // Tính toán tỉ lệ co dãn giữ nguyên khung hình
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(e.target?.result as string)
          return
        }

        ctx.drawImage(img, 0, 0, width, height)
        // Nén ảnh sang định dạng JPEG chất lượng cao tối ưu dung lượng
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedBase64)
      }
      img.onerror = () => resolve(e.target?.result as string)
      img.src = e.target?.result as string
    }
    reader.onerror = () => resolve('')
    reader.readAsDataURL(file)
  })
}
