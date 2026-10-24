import React, { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { fetchAnalyticsSummary } from '../lib/analytics'
import { AdminHeader } from './admin/AdminHeader'
import { AdminStatsBar } from './admin/AdminStatsBar'
import { ProductsTab } from './admin/tabs/ProductsTab'
import { BannersTab } from './admin/tabs/BannersTab'
import { ShowcaseTab } from './admin/tabs/ShowcaseTab'
import { FeedbackTab } from './admin/tabs/FeedbackTab'
import { OrdersTab } from './admin/tabs/OrdersTab'
import { SettingsTab } from './admin/tabs/SettingsTab'
import type { AdminTab, TimeFilter, AnalyticsSummary, AdminProduct, DraftOrder } from './admin/types'

interface AdminDashboardProps {
  navigate: (path: string) => void
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ navigate }) => {
  const { signOut, user } = useAuthStore()

  // Xác định tab mặc định từ hash hoặc query param
  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '')
      if (['products', 'settings', 'orders', 'feedback', 'showcase', 'banners'].includes(hash)) {
        return hash as AdminTab
      }
      const searchParams = new URLSearchParams(window.location.search)
      const tabParam = searchParams.get('tab')
      if (tabParam && ['products', 'settings', 'orders', 'feedback', 'showcase', 'banners'].includes(tabParam)) {
        return tabParam as AdminTab
      }
    }
    return 'products'
  })

  // Đồng bộ tab lên Hash URL để reload không bị mất vị trí
  const handleSelectTab = (tab: AdminTab) => {
    setActiveTab(tab)
    if (typeof window !== 'undefined') {
      window.location.hash = tab
    }
  }

  // Quản lý bộ lọc thời gian & Thống kê
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week')
  const [cachedProducts, setCachedProducts] = useState<AdminProduct[]>([])
  const [cachedOrders, setCachedOrders] = useState<DraftOrder[]>([])
  const [counts, setCounts] = useState<{
    products?: number
    banners?: number
    showcase?: number
    feedbackTotal?: number
    feedbackUnread?: number
    orders?: number
  }>({})

  const [analytics, setAnalytics] = useState<AnalyticsSummary>({
    pageViews: 0,
    todayPageViews: 0,
    totalProductViews: 0,
    ordersCount: 0,
    totalRevenue: 0,
    topProduct: null
  })

  // Cập nhật thống kê khi có sản phẩm hoặc đổi mốc thời gian
  useEffect(() => {
    if (cachedProducts.length > 0) {
      fetchAnalyticsSummary(cachedProducts as any, cachedOrders, timeFilter).then(setAnalytics)
    }
  }, [cachedProducts, cachedOrders, timeFilter])

  // Callbacks nhận dữ liệu từ các sub-tabs một cách thụ động (không ép fetch trước)
  const handleProductsLoaded = useCallback((prods: AdminProduct[]) => {
    setCachedProducts(prods)
    setCounts(prev => ({ ...prev, products: prods.length }))
  }, [])

  const handleOrdersLoaded = useCallback((orders: DraftOrder[]) => {
    setCachedOrders(orders)
    setCounts(prev => ({ ...prev, orders: orders.length }))
  }, [])

  const handleBannersCountChange = useCallback((count: number) => {
    setCounts(prev => ({ ...prev, banners: count }))
  }, [])

  const handleShowcaseCountChange = useCallback((count: number) => {
    setCounts(prev => ({ ...prev, showcase: count }))
  }, [])

  const handleFeedbackCountsChange = useCallback((total: number, unread: number) => {
    setCounts(prev => ({ ...prev, feedbackTotal: total, feedbackUnread: unread }))
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/admin/login')
    } catch (err) {
      console.error('Lỗi khi đăng xuất:', err)
      navigate('/admin/login')
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans text-stone-900">
      {/* Navbar & Thanh Tabs Subnav */}
      <AdminHeader
        userEmail={user?.email}
        activeTab={activeTab}
        setActiveTab={handleSelectTab}
        onSignOut={handleSignOut}
        onNavigateHome={() => navigate('/')}
        counts={counts}
      />

      {/* Nội dung chính */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-6 py-8">
        {/* Thanh Thống Kê & Bộ Lọc Thời Gian */}
        <AdminStatsBar
          analytics={analytics}
          timeFilter={timeFilter}
          setTimeFilter={setTimeFilter}
        />

        {/* Lazy Render từng Tab độc lập - Không re-render chéo nhau */}
        {activeTab === 'products' && (
          <ProductsTab onProductsLoaded={handleProductsLoaded} />
        )}

        {activeTab === 'banners' && (
          <BannersTab onBannersCountChange={handleBannersCountChange} />
        )}

        {activeTab === 'showcase' && (
          <ShowcaseTab onShowcaseCountChange={handleShowcaseCountChange} />
        )}

        {activeTab === 'feedback' && (
          <FeedbackTab onFeedbackCountsChange={handleFeedbackCountsChange} />
        )}

        {activeTab === 'orders' && (
          <OrdersTab
            timeFilter={timeFilter}
            setTimeFilter={setTimeFilter}
            onOrdersLoaded={handleOrdersLoaded}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab />
        )}
      </main>
    </div>
  )
}
