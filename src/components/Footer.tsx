import React from 'react'
import { useSettingsStore } from '../store/useSettingsStore'

export const Footer: React.FC = () => {
  const { settings } = useSettingsStore()
  const shopName = settings.shop_name || 'Que Anh Flower'

  return (
    <footer className="w-full bg-stone-50/50 border-t border-stone-100/60 py-12 px-6 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-stone-400 text-xs tracking-wider">
        <div>
          <p>© {new Date().getFullYear()} {shopName}. Thiết kế tối giản và tinh tế.</p>
        </div>
        <div className="flex items-center gap-6">
          <a 
            href={`https://zalo.me/${settings.zalo_phone || '0900000000'}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-stone-700 transition-colors duration-200"
          >
            ZALO SHOP
          </a>
          <a 
            href="/admin" 
            className="hover:text-stone-700 transition-colors duration-200 border-l border-stone-200 pl-6"
          >
            QUẢN TRỊ viên
          </a>
        </div>
      </div>
    </footer>
  )
}
