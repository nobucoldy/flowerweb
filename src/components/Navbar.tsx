import React, { useState, useEffect } from 'react'
import { ShoppingBag, Mail, Images } from 'lucide-react'
import { useCartStore } from '../store/useCartStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { navigateTo } from '../lib/navigation'

export const Navbar: React.FC = () => {
  const { setIsOpen, getTotalItems } = useCartStore()
  const { settings } = useSettingsStore()
  const shopName = settings.shop_name || 'Que Anh Flower'
  const [firstName, ...restNameParts] = shopName.split(' ')
  const lightName = restNameParts.join(' ')
  const totalItems = getTotalItems()
  const [currentPath, setCurrentPath] = useState(window.location.pathname)

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  return (
    <header className="fixed top-0 left-0 z-35 w-full bg-[#fffafb]/80 backdrop-blur-md border-b border-[#f9e1e4]/70">
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo / Tên shop */}
        <a 
          href="/" 
          onClick={(e) => {
            e.preventDefault()
            navigateTo('/')
          }}
          className="flex items-center gap-2.5 font-serif text-2xl md:text-3xl tracking-[0.08em] text-stone-900 hover:opacity-80 transition-opacity"
        >
          <span className="font-medium leading-none">{firstName}</span>
          {lightName && <span className="font-medium leading-none">{lightName}</span>}
        </a>

        {/* Cụm Action Buttons: Ảnh thực tế, Góp ý ẩn danh, Giỏ hàng */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* 1. Icon Biểu tượng hình ảnh (Xem ảnh thực tế shop upload) */}
          <div className="relative group">
            <button
              onClick={() => navigateTo('/showcase')}
              className={`p-2.5 rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center ${
                currentPath === '/showcase'
                  ? 'bg-rose-100/70 text-rose-800 shadow-xs'
                  : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100/70'
              }`}
              aria-label="Xem ảnh thực tế & Đánh giá"
              title="Xem ảnh thực tế & Đánh giá"
            >
              <Images size={20} strokeWidth={1.75} />
            </button>
            {/* Tooltip khi đưa chuột vào */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1 text-[11px] font-medium text-white bg-stone-900/90 backdrop-blur-xs rounded-md shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50">
              Xem ảnh thực tế & Đánh giá
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-stone-900/90" />
            </div>
          </div>

          {/* 2. Icon Lá thư (Góp ý ẩn danh cho shop) */}
          <div className="relative group">
            <button
              onClick={() => navigateTo('/feedback')}
              className={`p-2.5 rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center ${
                currentPath === '/feedback'
                  ? 'bg-rose-100/70 text-rose-800 shadow-xs'
                  : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100/70'
              }`}
              aria-label="Góp ý ẩn danh cho shop"
              title="Góp ý ẩn danh cho shop"
            >
              <Mail size={20} strokeWidth={1.75} />
            </button>
            {/* Tooltip khi đưa chuột vào */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1 text-[11px] font-medium text-white bg-stone-900/90 backdrop-blur-xs rounded-md shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50">
              Góp ý ẩn danh cho shop
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-stone-900/90" />
            </div>
          </div>

          {/* 3. Icon Giỏ hàng */}
          <div className="relative group">
            <button 
              onClick={() => setIsOpen(true)}
              className="relative p-2.5 text-stone-800 hover:text-stone-950 hover:bg-stone-100/70 rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center"
              aria-label="Xem giỏ hàng"
              title="Xem giỏ hàng"
            >
              <ShoppingBag size={20} strokeWidth={1.75} />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-stone-950 text-stone-50 text-[10px] font-bold w-4.5 h-4.5 flex items-center justify-center rounded-full border border-stone-50">
                  {totalItems}
                </span>
              )}
            </button>
            {/* Tooltip giỏ hàng */}
            <div className="absolute top-full right-0 mt-2 px-2.5 py-1 text-[11px] font-medium text-white bg-stone-900/90 backdrop-blur-xs rounded-md shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50">
              Giỏ hàng ({totalItems})
              <div className="absolute -top-1 right-3 border-4 border-transparent border-b-stone-900/90" />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

