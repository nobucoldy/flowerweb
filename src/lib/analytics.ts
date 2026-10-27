import { supabase } from './supabaseClient'
import type { TimeFilter } from '../pages/admin/types'

const SESSION_VIEW_KEY = 'que_anh_visited_session'

export const getDaysAgoDate = (days: number): string => {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

// Ghi nhận lượt truy cập Website (Mỗi phiên mở web tính 1 lần để tránh ảo số do F5 liên tục)
export const recordPageView = async (): Promise<void> => {
  try {
    const hasVisitedInSession = sessionStorage.getItem(SESSION_VIEW_KEY)
    if (hasVisitedInSession) {
      return
    }

    sessionStorage.setItem(SESSION_VIEW_KEY, 'true')

    // Gọi RPC function trên Supabase nếu có
    const { error } = await supabase.rpc('increment_page_view')
    if (error) {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabase
        .from('page_views')
        .select('views_count')
        .eq('view_date', today)
        .maybeSingle()

      if (data) {
        await supabase
          .from('page_views')
          .update({ views_count: (data.views_count || 0) + 1, updated_at: new Date().toISOString() })
          .eq('view_date', today)
      } else {
        await supabase
          .from('page_views')
          .insert({ view_date: today, views_count: 1 })
      }
    }
  } catch (e) {
    console.error('Failed to record page view:', e)
  }
}

// Ghi nhận lượt xem sản phẩm (Khi khách click xem ảnh hoặc chi tiết)
export const recordProductView = async (productId: string): Promise<number> => {
  try {
    // Gọi RPC function trên Supabase
    const { error } = await supabase.rpc('increment_product_view', { product_id: productId })
    if (error) {
      const { data } = await supabase
        .from('products')
        .select('views_count')
        .eq('id', productId)
        .maybeSingle()

      if (data) {
        const nextCount = (data.views_count || 0) + 1
        await supabase
          .from('products')
          .update({ views_count: nextCount })
          .eq('id', productId)
        return nextCount
      }
    }
    return 1
  } catch (e) {
    console.error('Failed to record product view:', e)
    return 0
  }
}

export interface AnalyticsSummary {
  pageViews: number
  todayPageViews: number
  totalProductViews: number
  ordersCount: number
  totalRevenue: number
  topProduct: { name: string; views: number } | null
}

// Kiểm tra xem một mốc thời gian (ISO Date String) có thuộc timeframe được chọn không
export const isWithinTimeframe = (dateStr: string, timeframe: TimeFilter): boolean => {
  if (timeframe === 'all') return true

  const targetDate = new Date(dateStr)
  const now = new Date()

  if (timeframe === 'today') {
    return targetDate.toDateString() === now.toDateString()
  }

  const diffTime = now.getTime() - targetDate.getTime()
  const diffDays = diffTime / (1000 * 60 * 60 * 24)

  if (timeframe === 'week') {
    return diffDays >= 0 && diffDays <= 7
  }

  if (timeframe === 'month') {
    return diffDays >= 0 && diffDays <= 30
  }

  return true
}

// Lấy số liệu thống kê tổng hợp hỗ trợ lọc Ngày / Tuần / Tháng / Tất cả
export const fetchAnalyticsSummary = async (
  products: Array<{ id: string; name: string; views_count?: number }>,
  orders: Array<{ id: string; total_price: number; created_at: string }>,
  timeframe: TimeFilter = 'all'
): Promise<AnalyticsSummary> => {
  let pageViews = 0
  let todayPageViews = 0

  try {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('page_views')
      .select('view_date, views_count')

    if (data && data.length > 0) {
      const todayRow = data.find((r) => r.view_date === today)
      todayPageViews = todayRow?.views_count || 0

      if (timeframe === 'today') {
        pageViews = todayPageViews
      } else if (timeframe === 'week') {
        const sevenDaysAgo = getDaysAgoDate(7)
        pageViews = data
          .filter((r) => r.view_date >= sevenDaysAgo)
          .reduce((sum, item) => sum + (item.views_count || 0), 0)
      } else if (timeframe === 'month') {
        const thirtyDaysAgo = getDaysAgoDate(30)
        pageViews = data
          .filter((r) => r.view_date >= thirtyDaysAgo)
          .reduce((sum, item) => sum + (item.views_count || 0), 0)
      } else {
        pageViews = data.reduce((sum, item) => sum + (item.views_count || 0), 0)
      }
    }
  } catch (err) {
    console.warn('Lỗi lấy thống kê page_views từ Supabase:', err)
  }

  // Lọc đơn hàng và tính doanh thu theo timeframe
  const filteredOrders = orders.filter((o) => isWithinTimeframe(o.created_at, timeframe))
  const ordersCount = filteredOrders.length
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.total_price || 0), 0)

  // Tính lượt xem sản phẩm
  let totalProductViews = 0
  let topProduct: { name: string; views: number } | null = null

  // Hệ số ước lượng view sản phẩm theo timeframe
  const multiplier = 
    timeframe === 'today' ? 0.08 :
    timeframe === 'week' ? 0.28 :
    timeframe === 'month' ? 0.75 : 1

  for (const p of products) {
    const rawViews = p.views_count || 0
    const computedViews = 
      timeframe === 'all' 
        ? rawViews 
        : (rawViews > 0 ? Math.max(1, Math.round(rawViews * multiplier)) : 0)
    totalProductViews += computedViews
    if (computedViews > 0 && (!topProduct || computedViews > topProduct.views)) {
      topProduct = { name: p.name, views: computedViews }
    }
  }

  return {
    pageViews,
    todayPageViews,
    totalProductViews,
    ordersCount,
    totalRevenue,
    topProduct
  }
}
