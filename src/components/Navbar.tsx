import React from 'react'
import { ShoppingBag } from 'lucide-react'
import { useCartStore } from '../store/useCartStore'
import { useSettingsStore } from '../store/useSettingsStore'

export const Navbar: React.FC = () => {
  const { setIsOpen, getTotalItems } = useCartStore()
  const { settings } = useSettingsStore()
  const shopName = settings.shop_name || 'Que Anh Flower'
  const [firstName, ...restNameParts] = shopName.split(' ')
  const lightName = restNameParts.join(' ')
  const totalItems = getTotalItems()

  return (
    <header className="fixed top-0 left-0 z-35 w-full bg-[#fffafb]/75 backdrop-blur-md border-b border-[#f9e1e4]/70">
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo / Tên shop */}
        <a 
          href="/" 
          className="flex items-center gap-2.5 font-serif text-2xl md:text-3xl tracking-[0.08em] text-stone-900 hover:opacity-80 transition-opacity"
        >
          
          <span className="font-medium leading-none">{firstName}</span>
          {lightName && <span className="font-medium leading-none">{lightName}</span>}
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
