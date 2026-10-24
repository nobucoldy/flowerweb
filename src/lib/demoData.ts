import type { Product } from '../store/useCartStore'
import { SEED_PRODUCTS, type SeedProduct } from '../data/seedProducts'

export const isDemoMode = 
  !import.meta.env.VITE_SUPABASE_URL || 
  import.meta.env.VITE_SUPABASE_URL.includes('your-supabase-project-url')

const DEMO_PRODUCTS_KEY = 'que_anh_demo_products'
const DEMO_ORDERS_KEY = 'que_anh_demo_orders'
const DEMO_PAGE_VIEWS_KEY = 'que_anh_demo_page_views'
const DEMO_PRODUCT_VIEWS_KEY = 'que_anh_demo_product_daily_views'
const DEMO_SEED_VERSION_KEY = 'que_anh_demo_seed_version'
const CURRENT_SEED_VERSION = '2026-10-24-prices-v1'

export type TimeFilter = 'today' | 'week' | 'month' | 'all'

export const getLocalProducts = (): Product[] => {
  try {
    const version = localStorage.getItem(DEMO_SEED_VERSION_KEY)
    if (version !== CURRENT_SEED_VERSION) {
      localStorage.setItem(DEMO_SEED_VERSION_KEY, CURRENT_SEED_VERSION)
      saveLocalProducts(SEED_PRODUCTS)
      return SEED_PRODUCTS
    }

    const saved = localStorage.getItem(DEMO_PRODUCTS_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch {}
  
  // Khởi tạo sản phẩm mẫu mặc định từ Seed Data
  saveLocalProducts(SEED_PRODUCTS)
  return SEED_PRODUCTS
}

export const saveLocalProducts = (products: (Product | SeedProduct)[]) => {
  try {
    localStorage.setItem(DEMO_PRODUCTS_KEY, JSON.stringify(products))
  } catch (e) {
    console.error('Error saving mock products', e)
  }
}

export const resetToSeedData = () => {
  try {
    localStorage.setItem(DEMO_SEED_VERSION_KEY, CURRENT_SEED_VERSION)
  } catch {}
  saveLocalProducts(SEED_PRODUCTS)
  return SEED_PRODUCTS
}

// Tăng lượt xem cho một sản phẩm trong LocalStorage (kèm ngày)
export const incrementLocalProductView = (productId: string): number => {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    // 1. Tăng tổng lượt xem của sản phẩm
    const products = getLocalProducts()
    let newCount = 1
    const updated = products.map((p) => {
      if (p.id === productId) {
        newCount = (p.views_count || 0) + 1
        return { ...p, views_count: newCount }
      }
      return p
    })
    saveLocalProducts(updated)

    // 2. Ghi nhận lượt xem theo ngày cho sản phẩm
    const dailySaved = localStorage.getItem(DEMO_PRODUCT_VIEWS_KEY)
    const dailyMap: Record<string, Record<string, number>> = dailySaved ? JSON.parse(dailySaved) : {}
    if (!dailyMap[productId]) dailyMap[productId] = {}
    dailyMap[productId][today] = (dailyMap[productId][today] || 0) + 1
    localStorage.setItem(DEMO_PRODUCT_VIEWS_KEY, JSON.stringify(dailyMap))

    return newCount
  } catch (e) {
    console.error('Error incrementing local product view', e)
    return 0
  }
}

// Helper tính số ngày chênh lệch so với hôm nay
export const getDaysAgoDate = (days: number): string => {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

// Khởi tạo danh sách đơn hàng mẫu nếu chưa có
const INITIAL_DEMO_ORDERS = [
  {
    id: 'ORD-9821',
    items: [
      { product_id: 'prod-01', product_name: 'Hoa mã #01', price: 380000, quantity: 1 }
    ],
    total_price: 380000,
    created_at: new Date().toISOString() // Hôm nay
  },
  {
    id: 'ORD-7612',
    items: [
      { product_id: 'prod-03', product_name: 'Hoa mã #03', price: 290000, quantity: 2 }
    ],
    total_price: 580000,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 ngày trước (Tuần)
  },
  {
    id: 'ORD-5419',
    items: [
      { product_id: 'prod-05', product_name: 'Hoa mã #05', price: 520000, quantity: 1 },
      { product_id: 'prod-08', product_name: 'Hoa mã #08', price: 250000, quantity: 1 }
    ],
    total_price: 770000,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 ngày trước (Tuần)
  },
  {
    id: 'ORD-3321',
    items: [
      { product_id: 'prod-09', product_name: 'Hoa mã #09', price: 850000, quantity: 1 }
    ],
    total_price: 850000,
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() // 14 ngày trước (Tháng)
  },
  {
    id: 'ORD-1205',
    items: [
      { product_id: 'prod-02', product_name: 'Hoa mã #02', price: 450000, quantity: 1 }
    ],
    total_price: 450000,
    created_at: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString() // 22 ngày trước (Tháng)
  }
]

export const getLocalOrders = () => {
  try {
    const saved = localStorage.getItem(DEMO_ORDERS_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {}

  // Khởi tạo các đơn mẫu phong phú
  localStorage.setItem(DEMO_ORDERS_KEY, JSON.stringify(INITIAL_DEMO_ORDERS))
  return INITIAL_DEMO_ORDERS
}

export const saveLocalOrder = (order: any) => {
  try {
    const current = getLocalOrders()
    const newOrders = [order, ...current]
    localStorage.setItem(DEMO_ORDERS_KEY, JSON.stringify(newOrders))
  } catch (e) {
    console.error('Error saving mock order', e)
  }
}

// Khởi tạo số liệu lượt xem theo ngày mẫu cho 30 ngày qua
const generateInitialPageViews = () => {
  const byDate: Record<string, number> = {}
  let total = 0
  const dailyCounts = [
    42, 38, 55, 61, 48, 72, 80, // 7 ngày gần nhất (~396 views)
    35, 40, 52, 45, 39, 60, 68,
    30, 44, 49, 53, 38, 45, 59,
    33, 42, 46, 51, 37, 43, 56, 40, 36 // 30 ngày (~1,350 views)
  ]

  dailyCounts.forEach((count, idx) => {
    const dateStr = getDaysAgoDate(idx)
    byDate[dateStr] = count
    total += count
  })

  return { total, byDate }
}

export const getLocalPageViewStats = (): { total: number; today: number; byDate: Record<string, number> } => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const saved = localStorage.getItem(DEMO_PAGE_VIEWS_KEY)
    if (saved) {
      const data = JSON.parse(saved)
      return {
        total: data.total || 0,
        today: data.byDate?.[today] || 0,
        byDate: data.byDate || {}
      }
    }
  } catch {}

  const initialData = generateInitialPageViews()
  try {
    localStorage.setItem(DEMO_PAGE_VIEWS_KEY, JSON.stringify(initialData))
  } catch {}

  const todayStr = new Date().toISOString().split('T')[0]
  return {
    total: initialData.total,
    today: initialData.byDate[todayStr] || 42,
    byDate: initialData.byDate
  }
}

export const recordLocalPageView = (): { total: number; today: number } => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const current = getLocalPageViewStats()
    const byDate = { ...current.byDate }
    byDate[today] = (byDate[today] || 0) + 1
    const total = current.total + 1

    localStorage.setItem(DEMO_PAGE_VIEWS_KEY, JSON.stringify({ total, byDate }))
    return { total, today: byDate[today] }
  } catch (e) {
    console.error('Error recording page view', e)
    return { total: 0, today: 0 }
  }
}

// ========================================================
// 1. DỮ LIỆU GÓP Ý ẨN DANH (ANONYMOUS FEEDBACK)
// ========================================================
export interface AnonymousFeedback {
  id: string
  content: string
  sender_tag?: string
  rating?: number
  is_read: boolean
  created_at: string
}

const DEMO_FEEDBACK_KEY = 'que_anh_demo_feedback'

const INITIAL_FEEDBACKS: AnonymousFeedback[] = [
  {
    id: 'fb-01',
    content: 'Shop có thể mở thêm dịch vụ viết thiệp tay thư pháp được không ạ? Mình mua tặng mẹ rất thích thiệp viết tay nắn nót.',
    sender_tag: 'Khách quen',
    rating: 5,
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() // 3 giờ trước
  },
  {
    id: 'fb-02',
    content: 'Hôm qua bạn shipper giao hoa rất lịch sự, mang hoa cẩn thận không bị dập nát cánh nào. Cảm ơn tiệm nhiều nhé!',
    sender_tag: 'Khách ẩn danh',
    rating: 5,
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 ngày trước
  },
  {
    id: 'fb-03',
    content: 'Hoa lụa của tiệm nhìn tự nhiên như hoa thật, để bàn làm việc ngắm mãi không chán. Mong shop ra thêm nhiều mẫu hoa lụa tone tím hoặc pastel nhẹ nhàng.',
    sender_tag: 'Góp ý mẫu hoa',
    rating: 5,
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() // 2 ngày trước
  }
]

export const getLocalFeedbacks = (): AnonymousFeedback[] => {
  try {
    const saved = localStorage.getItem(DEMO_FEEDBACK_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Tự động làm mới dữ liệu nếu còn lưu nội dung hoa tươi cũ
        const hasLegacy = parsed.some((f: any) => f.content && f.content.includes('giữ tươi'))
        if (hasLegacy) {
          localStorage.setItem(DEMO_FEEDBACK_KEY, JSON.stringify(INITIAL_FEEDBACKS))
          return INITIAL_FEEDBACKS
        }
        return parsed
      }
    }
  } catch {}
  
  try {
    localStorage.setItem(DEMO_FEEDBACK_KEY, JSON.stringify(INITIAL_FEEDBACKS))
  } catch {}
  return INITIAL_FEEDBACKS
}

export const saveLocalFeedback = (item: { content: string; sender_tag?: string; rating?: number }): AnonymousFeedback => {
  const current = getLocalFeedbacks()
  const newFeedback: AnonymousFeedback = {
    id: `fb-${Date.now()}`,
    content: item.content,
    sender_tag: item.sender_tag || 'Khách ẩn danh',
    rating: item.rating || 5,
    is_read: false,
    created_at: new Date().toISOString()
  }
  const updated = [newFeedback, ...current]
  try {
    localStorage.setItem(DEMO_FEEDBACK_KEY, JSON.stringify(updated))
  } catch (e) {
    console.error('Error saving feedback', e)
  }
  return newFeedback
}

export const toggleFeedbackReadStatus = (id: string): AnonymousFeedback[] => {
  const current = getLocalFeedbacks()
  const updated = current.map(fb => fb.id === id ? { ...fb, is_read: !fb.is_read } : fb)
  try {
    localStorage.setItem(DEMO_FEEDBACK_KEY, JSON.stringify(updated))
  } catch {}
  return updated
}

export const deleteLocalFeedback = (id: string): AnonymousFeedback[] => {
  const current = getLocalFeedbacks()
  const updated = current.filter(fb => fb.id !== id)
  try {
    localStorage.setItem(DEMO_FEEDBACK_KEY, JSON.stringify(updated))
  } catch {}
  return updated
}

// ========================================================
// 2. DỮ LIỆU ẢNH HOA THỰC TẾ & REVIEW CỦA SHOP (SHOWCASE)
// ========================================================
export interface ShopShowcase {
  id: string
  image_url: string
  title: string
  customer_name?: string
  review_text?: string
  rating: number
  is_pinned?: boolean
  created_at: string
}

const DEMO_SHOWCASE_KEY = 'que_anh_demo_showcase'

const INITIAL_SHOWCASES: ShopShowcase[] = [
  {
    id: 'sc-01',
    image_url: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=1200&q=80',
    title: 'Bó hoa hồng lụa Rosy Ohara sang trọng',
    customer_name: 'Chị Thu Hà (Đình So)',
    review_text: 'Hoa lụa cao cấp đẹp mềm mại như hoa thật, shop bọc giấy rất sang và cẩn thận. Mình tặng sinh nhật mẹ, mẹ thích lắm!',
    rating: 5,
    is_pinned: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
  },
  {
    id: 'sc-02',
    image_url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1200&q=80',
    title: 'Giỏ hoa lụa tone cam pastel mừng khai trương',
    customer_name: 'Anh Hoàng Nam (Hà Nội)',
    review_text: 'Cắm hoa lụa có tâm dã man, phối màu xuất sắc! Phom dáng bó hoa đứng chuẩn chỉnh, giao đúng giờ hẹn.',
    rating: 5,
    is_pinned: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString()
  },
  {
    id: 'sc-03',
    image_url: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=1200&q=80',
    title: 'Bó hoa lụa baby trắng tinh khôi kỷ niệm ngày cưới',
    customer_name: 'Bạn Ngọc Trâm',
    review_text: 'Bó hoa baby to đùng, cầm lên chụp ảnh sống ảo siêu đỉnh. Shop tư vấn nhiệt tình, 10/10 điểm phục vụ!',
    rating: 5,
    is_pinned: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString()
  },
  {
    id: 'sc-04',
    image_url: 'https://images.unsplash.com/photo-1520763185298-1b434c919102?auto=format&fit=crop&w=1200&q=80',
    title: 'Bình hoa lụa tulip trắng để bàn làm việc',
    customer_name: 'Khách ẩn danh',
    review_text: 'Bình hoa lụa để bàn làm việc rất sang, cánh hoa sờ mịn màng và bền đẹp mãi theo năm tháng. Sẽ ủng hộ shop dài dài.',
    rating: 5,
    is_pinned: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString()
  },
  {
    id: 'sc-05',
    image_url: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?auto=format&fit=crop&w=1200&q=80',
    title: 'Bó hướng dương lụa rạng rỡ tặng tốt nghiệp',
    customer_name: 'Anh Tuấn Anh',
    review_text: 'Cành hướng dương lụa làm tỉ mỉ từng chi tiết, màu vàng rực rỡ và giữ màu lâu. Cảm ơn shop đã hoàn thành gấp giúp mình!',
    rating: 5,
    is_pinned: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 168).toISOString()
  },
  {
    id: 'sc-06',
    image_url: 'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?auto=format&fit=crop&w=1200&q=80',
    title: 'Bình hoa mẫu đơn lụa pastel cao cấp trang trí phòng khách',
    customer_name: 'Chị Mai Linh',
    review_text: 'Hoa lụa tone pastel mềm mại, để phòng khách ai đến cũng khen.',
    rating: 5,
    is_pinned: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 200).toISOString()
  },
  {
    id: 'sc-07',
    image_url: 'https://images.unsplash.com/photo-1508610048659-a06b669e3321?auto=format&fit=crop&w=1200&q=80',
    title: 'Chậu hoa lan hồ điệp lụa trắng 5 cành sang trọng',
    customer_name: 'Khách công ty',
    review_text: 'Chậu lan lụa rất sang, cánh hoa dày dặn y như thật.',
    rating: 5,
    is_pinned: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 240).toISOString()
  },
  {
    id: 'sc-08',
    image_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    title: 'Hộp hoa hồng lụa vĩnh cửu quà tặng kỷ niệm tình yêu',
    customer_name: 'Anh Minh Trí',
    review_text: 'Hộp hoa lụa tinh tế, người yêu nhận được rất hạnh phúc.',
    rating: 5,
    is_pinned: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 280).toISOString()
  }
]

export const getLocalShowcases = (): ShopShowcase[] => {
  try {
    const saved = localStorage.getItem(DEMO_SHOWCASE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Tự động làm mới dữ liệu nếu còn lưu review hoa tươi cũ
        const hasLegacy = parsed.some((s: any) => s.review_text && (s.review_text.includes('Hoa tươi đẹp') || s.review_text.includes('hoa tươi rói') || s.review_text.includes('giữ tươi')))
        const isLegacyFive = parsed.length <= 5 && parsed.every((s: any) => ['sc-01', 'sc-02', 'sc-03', 'sc-04', 'sc-05'].includes(s.id))
        if (hasLegacy || isLegacyFive) {
          localStorage.setItem(DEMO_SHOWCASE_KEY, JSON.stringify(INITIAL_SHOWCASES))
          return INITIAL_SHOWCASES
        }
        return parsed
      }
    }
  } catch {}

  try {
    localStorage.setItem(DEMO_SHOWCASE_KEY, JSON.stringify(INITIAL_SHOWCASES))
  } catch {}
  return INITIAL_SHOWCASES
}

export const saveLocalShowcase = (item: Omit<ShopShowcase, 'id' | 'created_at'> & { id?: string }): ShopShowcase => {
  const current = getLocalShowcases()
  let result: ShopShowcase
  let updated: ShopShowcase[]

  if (item.id) {
    // Chỉnh sửa bài viết
    result = {
      ...(current.find(c => c.id === item.id) || { id: item.id, created_at: new Date().toISOString() }),
      ...item,
      id: item.id
    }
    updated = current.map(c => c.id === item.id ? result : c)
  } else {
    // Tạo mới bài viết
    result = {
      ...item,
      id: `sc-${Date.now()}`,
      created_at: new Date().toISOString()
    }
    updated = [result, ...current]
  }

  try {
    localStorage.setItem(DEMO_SHOWCASE_KEY, JSON.stringify(updated))
  } catch (e) {
    console.error('Error saving showcase', e)
  }
  return result
}

export const togglePinShowcase = (id: string): ShopShowcase[] => {
  const current = getLocalShowcases()
  const updated = current
    .map(sc => sc.id === id ? { ...sc, is_pinned: !sc.is_pinned } : sc)
    .sort((a, b) => {
      const pinA = a.is_pinned ? 1 : 0
      const pinB = b.is_pinned ? 1 : 0
      if (pinB !== pinA) return pinB - pinA
      return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
    })
  try {
    localStorage.setItem(DEMO_SHOWCASE_KEY, JSON.stringify(updated))
  } catch {}
  return updated
}

export const deleteLocalShowcase = (id: string): ShopShowcase[] => {
  const current = getLocalShowcases()
  const updated = current.filter(sc => sc.id !== id)
  try {
    localStorage.setItem(DEMO_SHOWCASE_KEY, JSON.stringify(updated))
  } catch {}
  return updated
}

// ========================================================
// 3. DỮ LIỆU BANNER TRANG CHỦ (HERO BANNERS)
// ========================================================
export interface ShopBanner {
  id: string
  image_url: string
  title?: string
  sub_title?: string
  link_url?: string
  is_active: boolean
  order_index: number
  created_at: string
}

const DEMO_BANNER_KEY = 'que_anh_demo_banners'

const INITIAL_BANNERS: ShopBanner[] = [
  {
    id: 'bn-01',
    image_url: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=2000&q=85',
    title: 'Nghệ Thuật Hoa Lụa Cao Cấp',
    sub_title: 'Tinh tế trong từng đường nét • Bền đẹp mãi với thời gian',
    link_url: '/showcase',
    is_active: true,
    order_index: 0,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
  },
  {
    id: 'bn-02',
    image_url: 'https://images.unsplash.com/photo-1508610048659-a06b669e3321?auto=format&fit=crop&w=2000&q=85',
    title: 'Thiết Kế Cắm Hoa Theo Yêu Cầu',
    sub_title: 'Bình hoa trang trí sang trọng cho không gian sống',
    link_url: '/showcase',
    is_active: true,
    order_index: 1,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString()
  },
  {
    id: 'bn-03',
    image_url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=2000&q=85',
    title: 'Đa dạng các loại hoa',
    sub_title: 'Trẻ trung, lịch thiệp, xu hướng',
    link_url: '/showcase',
    is_active: true,
    order_index: 2,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
  }
]

export const getLocalBanners = (): ShopBanner[] => {
  try {
    const saved = localStorage.getItem(DEMO_BANNER_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
      }
    }
  } catch {}

  try {
    localStorage.setItem(DEMO_BANNER_KEY, JSON.stringify(INITIAL_BANNERS))
  } catch {}
  return INITIAL_BANNERS
}

export const saveLocalBanner = (item: Omit<ShopBanner, 'id' | 'created_at'> & { id?: string }): ShopBanner[] => {
  const current = getLocalBanners()
  let result: ShopBanner
  let updated: ShopBanner[]

  if (item.id) {
    result = {
      ...(current.find(b => b.id === item.id) || { id: item.id, created_at: new Date().toISOString() }),
      ...item,
      id: item.id
    }
    updated = current.map(b => b.id === item.id ? result : b)
  } else {
    result = {
      ...item,
      id: `bn-${Date.now()}`,
      order_index: 0,
      created_at: new Date().toISOString()
    }
    const shifted = current.map(b => ({ ...b, order_index: (b.order_index ?? 0) + 1 }))
    updated = [result, ...shifted]
  }

  try {
    localStorage.setItem(DEMO_BANNER_KEY, JSON.stringify(updated))
  } catch (e) {
    console.warn('LocalStorage quota reached, attempting storage with cleanup', e)
    try {
      localStorage.removeItem(DEMO_PAGE_VIEWS_KEY)
      localStorage.removeItem(DEMO_PRODUCT_VIEWS_KEY)
      localStorage.setItem(DEMO_BANNER_KEY, JSON.stringify(updated))
    } catch {
      console.error('Could not save banner to localStorage', e)
    }
  }
  return updated
}

export const toggleBannerActiveStatus = (id: string): ShopBanner[] => {
  const current = getLocalBanners()
  const updated = current.map(b => b.id === id ? { ...b, is_active: !b.is_active } : b)
  try {
    localStorage.setItem(DEMO_BANNER_KEY, JSON.stringify(updated))
  } catch {}
  return updated
}

export const deleteLocalBanner = (id: string): ShopBanner[] => {
  const current = getLocalBanners()
  const updated = current.filter(b => b.id !== id)
  try {
    localStorage.setItem(DEMO_BANNER_KEY, JSON.stringify(updated))
  } catch {}
  return updated
}

