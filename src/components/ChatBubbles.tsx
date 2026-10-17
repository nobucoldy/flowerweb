import React from 'react'
import { useSettingsStore } from '../store/useSettingsStore'

export const ChatBubbles: React.FC = () => {
  const { settings } = useSettingsStore()
  const zaloPhone = settings.zalo_phone || '0363645261'

  return (
    <div className="fixed bottom-5 right-5 z-35 flex flex-col items-center gap-3">
      {/* Nút Zalo */}
      {zaloPhone && (
        <a
          href={`https://zalo.me/${zaloPhone}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-stone-200/70 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
          aria-label="Mở Zalo"
          title={`Zalo: ${zaloPhone}`}
        >
          <img
            src="/zalo.svg"
            alt=""
            className="h-8 w-8 object-contain"
            aria-hidden="true"
          />
          <span className="pointer-events-none absolute right-14 whitespace-nowrap rounded-md bg-stone-900/90 px-2.5 py-1 text-[11px] font-medium text-white opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100">
            Chat Zalo: {zaloPhone}
          </span>
        </a>
      )}

      {/* Nút Facebook */}
      <a
        href="https://www.facebook.com/khoi.que.35"
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-stone-200/70 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
        aria-label="Mở Facebook"
        title="Facebook"
      >
        <img
          src="/facebook-svgrepo-com.svg"
          alt=""
          className="h-8 w-8 object-contain"
          aria-hidden="true"
        />
        <span className="pointer-events-none absolute right-14 whitespace-nowrap rounded-md bg-stone-900/90 px-2.5 py-1 text-[11px] font-medium text-white opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100">
          Facebook shop
        </span>
      </a>
    </div>
  )
}
