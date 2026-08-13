import React from 'react'
import { ShoppingBag } from 'lucide-react'
import { useCartStore } from '../store/useCartStore'
import { useSettingsStore } from '../store/useSettingsStore'

export const Navbar: React.FC = () => {
  const { setIsOpen, getTotalItems } = useCartStore()
  const { settings } = useSettingsStore()
  const shopName = settings.shop_name || 'Que Anh Flower'
  const totalItems = getTotalItems()

  return (
    <header className="sticky top-0 z-35 w-full bg-stone-50/80 backdrop-blur-md border-b border-stone-100/60">
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo / Tên shop */}
        <a 
          href="/" 
          className="font-serif text-2xl md:text-3xl font-medium tracking-wider text-stone-900 hover:opacity-80 transition-opacity"
        >
          {shopName}
        </a>

        {/* Giỏ hàng icon */}
        <div className="flex items-center">
          <button 
            onClick={() => setIsOpen(true)}
            className="relative p-2 text-stone-800 hover:text-stone-950 rounded-full transition-all duration-200 cursor-pointer"
            aria-label="Xem giỏ hàng"
          >
            <ShoppingBag size={22} strokeWidth={1.5} />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-stone-950 text-stone-50 text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border border-stone-50">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
