import React from 'react'
import { MapPin, Phone } from 'lucide-react'
import { useSettingsStore } from '../store/useSettingsStore'

export const Footer: React.FC = () => {
  const { settings } = useSettingsStore()
  const zaloPhone = settings.zalo_phone || '0363645261'
  const shopAddress = settings.shop_address || 'Địa chỉ shop'
  const shopName = settings.shop_name || 'Que Anh Flower'
  const mapsUrl = 'https://maps.app.goo.gl/7x6fjVLGxUXwTkTx7'

  return (
    <footer className="w-full bg-[#fffafb]/45 border-t border-[#f9e1e4]/70 py-12 px-6 mt-auto backdrop-blur-sm">
      <div className="max-w-6xl mx-auto flex flex-col items-center justify-between gap-4 text-xs tracking-wider text-stone-500 md:flex-row md:items-center">
        <div className="font-serif text-lg tracking-[0.1em] text-stone-900 md:text-xl">
          {shopName}
        </div>

        <div className="flex flex-col items-center gap-2 md:flex-row md:items-center md:gap-6">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 transition-colors duration-200 hover:text-stone-800"
          >
            <MapPin size={16} className="text-[#d98f9a]" />
            <span>{shopAddress}</span>
          </a>

          <a
            href={`tel:${zaloPhone}`}
            className="flex items-center gap-2 transition-colors duration-200 hover:text-stone-800"
          >
            <Phone size={16} className="text-[#d98f9a]" />
            <span>{zaloPhone}</span>
          </a>
        </div>
      </div>
    </footer>
  )
}
