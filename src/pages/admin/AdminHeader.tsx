import React, { memo } from 'react'
import { LogOut, Sliders, Images, Mail } from 'lucide-react'
import { isDemoMode } from '../../lib/demoData'
import type { AdminTab } from './types'

interface AdminHeaderProps {
  userEmail?: string
  activeTab: AdminTab
  setActiveTab: (tab: AdminTab) => void
  onSignOut: () => void
  onNavigateHome: () => void
  counts: {
    products?: number
    banners?: number
    showcase?: number
    feedbackTotal?: number
    feedbackUnread?: number
    orders?: number
  }
}

export const AdminHeader: React.FC<AdminHeaderProps> = memo(({
  userEmail,
  activeTab,
  setActiveTab,
  onSignOut,
  onNavigateHome,
  counts
}) => {
  return (
    <>
      {/* Admin Navbar */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-serif text-xl font-medium tracking-wide text-stone-950">Que Anh Flower</span>
            <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-xs">
              Quản trị viên
            </span>
            {isDemoMode && (
              <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-medium px-2 py-0.5 rounded-xs hidden sm:inline">
                Chế độ Seed Demo
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={onNavigateHome}
              className="text-xs text-stone-500 hover:text-stone-950 transition-colors hidden sm:inline cursor-pointer"
            >
              ← Xem Cửa Hàng
            </button>
            <span className="text-xs text-stone-400 hidden md:inline">|</span>
            <span className="text-xs text-stone-500 hidden sm:inline">{userEmail || 'admin@queanhflower.com'}</span>
            <button 
              onClick={onSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-stone-200 rounded-sm hover:bg-stone-50 text-xs font-semibold tracking-wider text-stone-700 transition-colors duration-200 cursor-pointer"
            >
              <LogOut size={14} />
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* Admin Subnav tabs */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-6 flex gap-6 sm:gap-8 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('products')}
            className={`py-4 border-b-2 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'products' ? 'border-stone-950 text-stone-950' : 'border-transparent text-stone-400 hover:text-stone-700'
            }`}
          >
            Sản phẩm {counts.products !== undefined ? `(${counts.products})` : ''}
          </button>

          <button 
            onClick={() => setActiveTab('banners')}
            className={`py-4 border-b-2 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'banners' ? 'border-stone-950 text-stone-950' : 'border-transparent text-stone-400 hover:text-stone-700'
            }`}
          >
            <Sliders size={14} />
            Banner trang chủ {counts.banners !== undefined ? `(${counts.banners})` : ''}
          </button>

          <button 
            onClick={() => setActiveTab('showcase')}
            className={`py-4 border-b-2 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'showcase' ? 'border-stone-950 text-stone-950' : 'border-transparent text-stone-400 hover:text-stone-700'
            }`}
          >
            <Images size={14} />
            Ảnh hoa thực tế {counts.showcase !== undefined ? `(${counts.showcase})` : ''}
          </button>

          <button 
            onClick={() => setActiveTab('feedback')}
            className={`py-4 border-b-2 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'feedback' ? 'border-stone-950 text-stone-950' : 'border-transparent text-stone-400 hover:text-stone-700'
            }`}
          >
            <Mail size={14} />
            Hòm thư ẩn danh
            {(counts.feedbackUnread ?? 0) > 0 ? (
              <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5">
                {counts.feedbackUnread} mới
              </span>
            ) : counts.feedbackTotal !== undefined ? (
              <span className="text-stone-400 text-[10px]">({counts.feedbackTotal})</span>
            ) : null}
          </button>

          <button 
            onClick={() => setActiveTab('orders')}
            className={`py-4 border-b-2 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'orders' ? 'border-stone-950 text-stone-950' : 'border-transparent text-stone-400 hover:text-stone-700'
            }`}
          >
            Lịch sử Click đơn {counts.orders !== undefined ? `(${counts.orders})` : ''}
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`py-4 border-b-2 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'settings' ? 'border-stone-950 text-stone-950' : 'border-transparent text-stone-400 hover:text-stone-700'
            }`}
          >
            Cài đặt cửa hàng
          </button>
        </div>
      </div>
    </>
  )
})
