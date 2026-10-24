export type PriceFilterType = 'all' | 'under-100k' | '100k-300k' | '300k-500k' | 'above-500k'

export interface PriceFilterOption {
  key: PriceFilterType
  label: string
}

export const PRICE_FILTER_OPTIONS: PriceFilterOption[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'under-100k', label: 'Dưới 100k' },
  { key: '100k-300k', label: '100k - 300k' },
  { key: '300k-500k', label: '300k - 500k' },
  { key: 'above-500k', label: 'Trên 500k' },
]

/**
 * Hiển thị giá dưới dạng phân khúc (1xx, 2xx, 3xx...)
 * - 150.000 -> "1xx"
 * - 250.000 -> "2xx"
 * - 380.000 -> "3xx"
 * - 520.000 -> "5xx"
 * - 680.000 -> "6xx"
 * - 1.200.000 -> "1xxx"
 */
export const formatPriceDisplay = (price: number): string => {
  if (!price || isNaN(price) || price <= 0) return 'Liên hệ'

  // Chuẩn hóa nếu admin nhập dạng rút gọn (ví dụ 350 thay vì 350000)
  const normalized = price < 1000 ? price * 1000 : price

  if (normalized >= 1000000) {
    const millions = Math.floor(normalized / 1000000)
    return `${millions}xxx`
  }

  if (normalized >= 100000) {
    const hundredK = Math.floor(normalized / 100000)
    return `${hundredK}xx`
  }

  // Dưới 100k
  const tensK = Math.max(1, Math.floor(normalized / 10000))
  return `${tensK}x`
}

/**
 * Kiểm tra xem sản phẩm có thỏa mãn bộ lọc giá hay không
 * - Dưới 100k: các mẫu giá dưới 100.000đ (ví dụ 25k, 50k, 95k...)
 * - 100k - 300k: các mẫu giá từ 100.000đ đến dưới 300.000đ
 * - 300k - 500k: các mẫu giá từ 300.000đ đến 500.000đ
 * - Trên 500k: các mẫu giá trên 500.000đ (> 500.000đ)
 */
export const matchPriceFilter = (price: number, filter: PriceFilterType): boolean => {
  if (filter === 'all') return true
  if (!price || isNaN(price) || price <= 0) return false

  const normalized = price < 1000 ? price * 1000 : price

  if (filter === 'under-100k') {
    return normalized < 100000
  }

  if (filter === '100k-300k') {
    return normalized >= 100000 && normalized <= 300000
  }

  if (filter === '300k-500k') {
    return normalized >= 300000 && normalized <= 500000
  }

  if (filter === 'above-500k') {
    return normalized > 500000
  }

  return true
}

/**
 * Phân tích và chuyển đổi giá trị nhập từ ô input (hỗ trợ định dạng 350000, 350.000, 350,000, 350k, v.v.)
 * thành số nguyên dương chuẩn lưu vào database
 */
export const parsePriceInput = (val: string | number): number => {
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : Math.max(0, Math.round(val))
  }
  if (!val) return 0

  const str = val.toString().trim()
  if (!str) return 0

  // Bỏ mọi ký tự không phải số
  const cleaned = str.replace(/[^\d]/g, '')
  const num = parseInt(cleaned, 10) || 0

  // Nếu người dùng nhập dạng rút gọn ví dụ 350 hoặc 250 (nghĩa là 350.000đ)
  if (num > 0 && num < 1000) {
    return num * 1000
  }

  return Math.max(0, num)
}

