import React from 'react'
import { useSettingsStore } from '../store/useSettingsStore'

export const ChatBubbles: React.FC = () => {
  const zaloPhone = useSettingsStore((state) => state.settings.zalo_phone)

  return (
    <div className="fixed bottom-5 right-5 z-35 flex flex-col items-center gap-3">
      {zaloPhone && (
        <a
          href={`https://zalo.me/${zaloPhone}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-stone-200/70 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
          aria-label="Mở Zalo"
          title="Zalo"
        >
          <img
            src="/zalo.svg"
            alt=""
            className="h-8 w-8 object-contain"
            aria-hidden="true"
          />
        </a>
      )}

      <a
        href="https://www.facebook.com/khoi.que.35"
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-stone-200/70 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
        aria-label="Mở Facebook"
        title="Facebook"
      >
        <img
          src="/facebook-svgrepo-com.svg"
          alt=""
          className="h-8 w-8 object-contain"
          aria-hidden="true"
        />
      </a>
    </div>
  )
}
