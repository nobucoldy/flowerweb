import type { AnalyticsSummary } from '../../lib/analytics'

export type TimeFilter = 'today' | 'week' | 'month' | 'all'

export interface AnonymousFeedback {
  id: string
  content: string
  sender_tag?: string
  rating?: number
  is_read: boolean
  created_at: string
}

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

export type { AnalyticsSummary }

export interface AdminProduct {
  id: string
  name: string
  price: number
  image_url: string
  status?: 'active' | 'inactive'
  views_count?: number
  category?: string
  created_at?: string
}

export interface DraftOrderItem {
  product_id: string
  product_name: string
  price: number
  quantity: number
}

export interface DraftOrder {
  id: string
  items: DraftOrderItem[]
  total_price: number
  created_at: string
}

export type AdminTab = 'products' | 'banners' | 'showcase' | 'feedback' | 'orders' | 'settings'
