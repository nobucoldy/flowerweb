import React, { useEffect } from 'react'
import { useSettingsStore } from '../store/useSettingsStore'

export const Footer: React.FC = () => {
  const { settings, fetchSettings } = useSettingsStore()
  const shopName = settings.shop_name || 'Que Anh Flower'
  const zaloPhone = settings.zalo_phone

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  return (
    <footer className="w-full bg-[#fffafb]/45 border-t border-[#f9e1e4]/70 py-12 px-6 mt-auto backdrop-blur-sm">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-stone-400 text-xs tracking-wider">
        <div>
          <p>© {new Date().getFullYear()} {shopName}</p>
        </div>
        <div className="flex items-center gap-6">
          {zaloPhone && (
            <a 
              href={`https://zalo.me/${zaloPhone}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-stone-700 transition-colors duration-200"
            >
              ZALO 
            </a>
          )}
          <a 
            href="https://www.facebook.com/khoi.que.35" 
            className={`${zaloPhone ? 'border-l border-stone-200 pl-6' : ''} hover:text-stone-700 transition-colors duration-200`}
          >
            FACEBOOK
          </a>
        </div>
      </div>
    </footer>
  )
}
