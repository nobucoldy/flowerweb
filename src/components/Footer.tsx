import React from 'react'
import { MapPin, Phone, ArrowUpRight } from 'lucide-react'
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
    <footer className="w-full bg-[#fffafb]/80 border-t border-[#f9e1e4]/70 py-8 px-4 sm:px-6 mt-auto backdrop-blur-sm">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
        {/* Logo / Tên tiệm */}
        <div className="flex flex-col items-center md:items-start gap-0.5">
          <div 
            onClick={() => navigateTo('/')}
            className="font-serif text-lg tracking-[0.1em] text-stone-900 md:text-xl cursor-pointer hover:opacity-80 transition-opacity"
          >
            {shopName}
          </div>
          <span className="text-[11px] tracking-[0.25em] sm:tracking-[0.32em] text-[#d98f9a] font-light text-right self-end">
            Hoa xinh Quốc Oai
          </span>
        </div>

        {/* Khung viền mỏng thanh thoát (Clean Outline Pill) */}
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-2.5">
          {/* Nút Địa chỉ */}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 rounded-full border border-[#edd5d9] bg-white/70 px-3.5 py-1.5 text-xs text-stone-700 backdrop-blur-xs transition-all duration-200 hover:border-[#d98f9a] hover:bg-white hover:text-stone-900 hover:shadow-xs active:scale-[0.98]"
            title="Xem vị trí shop trên Google Maps"
          >
            <MapPin size={13} className="text-[#d98f9a] shrink-0" />
            <span className="font-normal">{shopAddress}</span>
            <ArrowUpRight size={13} className="text-stone-400 transition-transform duration-200 group-hover:text-[#d98f9a] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0" />
          </a>

          {/* Nút Hotline / Zalo */}
          <a
            href={`tel:${hotline}`}
            className="group inline-flex items-center gap-2 rounded-full border border-[#edd5d9] bg-white/70 px-3.5 py-1.5 text-xs text-stone-700 backdrop-blur-xs transition-all duration-200 hover:border-[#d98f9a] hover:bg-white hover:text-stone-900 hover:shadow-xs active:scale-[0.98]"
            title={`Gọi hotline: ${hotline}`}
          >
            <Phone size={13} className="text-[#d98f9a] shrink-0" />
            <span className="font-normal">
              Hotline / Zalo: <span className="font-medium text-stone-800 group-hover:text-stone-900">{hotline}</span>
            </span>
            <ArrowUpRight size={13} className="text-stone-400 transition-transform duration-200 group-hover:text-[#d98f9a] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0" />
          </a>
        </div>
      </div>
    </footer>
  )
}

