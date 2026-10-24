export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
export const MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024 // 15MB

/**
 * Kiểm tra tính hợp lệ của file tải lên (chống tải file độc hại, file thực thi)
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  if (!file) {
    return { valid: false, error: 'Không tìm thấy file tải lên.' }
  }

  // Chặn file có định dạng không nằm trong danh sách cho phép
  if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: 'Định dạng file không an toàn! Vui lòng chỉ chọn ảnh JPG, PNG, WEBP hoặc GIF.'
    }
  }

  // Chặn file kích thước quá lớn (> 15MB)
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'Dung lượng ảnh vượt quá 15MB. Vui lòng chọn ảnh nhẹ hơn!'
    }
  }

  return { valid: true }
}

/**
 * Nén và resize file ảnh thành một đối tượng File siêu nhẹ (chỉ còn khoảng 80KB - 180KB)
 * ngay trên trình duyệt (client-side) trước khi gửi qua mạng.
 * Giúp tăng tốc độ tải lên Storage gấp 10-30 lần, hạn chế nghẽn băng thông.
 */
export const compressImageToFile = async (
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.82
): Promise<File> => {
  // Bỏ qua nén nếu là file SVG hoặc file đã rất nhẹ (< 150KB)
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.size < 150 * 1024) {
    return file
  }

  return new Promise((resolve) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      let { width, height } = img

      // Tính toán kích thước giữ nguyên tỉ lệ khung hình
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(file)
        return
      }

      // Vẽ ảnh lên canvas với chất lượng tốt nhất
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, width, height)

      // Chuyển sang định dạng JPEG nén
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            // Nếu nén xong không nhẹ hơn thì giữ file gốc
            resolve(file)
            return
          }

          const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || 'photo'
          const compressedFile = new File([blob], `${baseName}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          })
          resolve(compressedFile)
        },
        'image/jpeg',
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(file)
    }

    img.src = objectUrl
  })
}

/**
 * Nén ảnh thành chuỗi Base64 trước khi lưu vào localStorage
 * Giúp giảm dung lượng từ 3MB-10MB xuống còn ~60KB-120KB mà vẫn giữ độ nét cao,
 * tránh lỗi QuotaExceededError trên trình duyệt.
 */
export const compressImage = (
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.8
): Promise<string> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
      return
    }

    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
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
        resolve('')
        return
      }

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, width, height)
      // Nén ảnh sang định dạng JPEG chất lượng cao tối ưu dung lượng
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality)
      resolve(compressedBase64)
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve('')
    }

    img.src = objectUrl
  })
}
