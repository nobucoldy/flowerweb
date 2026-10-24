export type PriceFilterType = 'all' | 'under-3xx' | '3xx-5xx' | 'above-5xx'

export interface PriceFilterOption {
  key: PriceFilterType
  label: string
}

export const PRICE_FILTER_OPTIONS: PriceFilterOption[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'under-3xx', label: 'Dưới 3xx' },
  { key: '3xx-5xx', label: '3xx - 5xx' },
  { key: 'above-5xx', label: 'Trên 5xx' },
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
 * - Dưới 3xx: các mẫu giá 1xx, 2xx (dưới 300.000đ)
 * - 3xx - 5xx: các mẫu giá 3xx, 4xx, 5xx (từ 300.000đ đến dưới 600.000đ)
 * - Trên 5xx: các mẫu giá trên 5xx (từ 6xx trở lên, tức >= 600.000đ)
 */
export const matchPriceFilter = (price: number, filter: PriceFilterType): boolean => {
  if (filter === 'all') return true
  const normalized = price < 1000 ? price * 1000 : price

  if (filter === 'under-3xx') {
    return normalized < 300000
  }

  if (filter === '3xx-5xx') {
    return normalized >= 300000 && normalized < 600000
  }

  if (filter === 'above-5xx') {
    return normalized >= 600000
  }

  return true
}
