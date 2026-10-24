import type { TimeFilter, AnonymousFeedback, ShopShowcase, ShopBanner } from '../../lib/demoData'
import type { AnalyticsSummary } from '../../lib/analytics'

export type { TimeFilter, AnonymousFeedback, ShopShowcase, ShopBanner, AnalyticsSummary }

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
