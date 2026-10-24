import React from 'react'
import { MapPin, Phone } from 'lucide-react'
import { useSettingsStore } from '../store/useSettingsStore'
import { navigateTo } from '../lib/navigation'



export const Footer: React.FC = () => {
  const { settings } = useSettingsStore()
  const hotline = settings.hotline || settings.zalo_phone || '0363645261'
  const shopAddress = settings.shop_address && !settings.shop_address.includes('Doãn Kế Thiện') && settings.shop_address !== 'Địa chỉ shop'
    ? settings.shop_address 
    : 'Đình So, Hưng Đạo, Hà Nội'
  const shopName = settings.shop_name || 'Que Anh Flower'
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shopAddress)}`

  return (
    <footer className="w-full bg-[#fffafb]/60 border-t border-[#f9e1e4]/70 py-10 px-6 mt-auto backdrop-blur-sm">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs tracking-wider text-stone-500">
        <div className="flex flex-col items-center md:items-start gap-1">
          <div 
            onClick={() => navigateTo('/')}
            className="font-serif text-lg tracking-[0.1em] text-stone-900 md:text-xl cursor-pointer hover:opacity-80 transition-opacity"
          >
            {shopName}
          </div>
          <span className="text-[11px] tracking-[0.25em] sm:tracking-[0.32em] text-[#d98f9a] font-light text-right self-end mt-0.5">
            Hoa xinh Quốc Oai
          </span>
        </div>

        <div className="flex flex-col items-center gap-2 md:flex-row md:items-center md:gap-6">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 transition-colors duration-200 hover:text-stone-800"
            title="Xem vị trí shop trên Google Maps"
          >
            <MapPin size={16} className="text-[#d98f9a]" />
            <span>{shopAddress}</span>
          </a>

          <a
            href={`tel:${hotline}`}
            className="flex items-center gap-2 transition-colors duration-200 hover:text-stone-800"
          >
            <Phone size={16} className="text-[#d98f9a]" />
            <span>Hotline / Zalo: {hotline}</span>
          </a>
        </div>
      </div>
    </footer>
  )
}

