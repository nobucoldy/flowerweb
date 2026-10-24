import React, { useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import { useSettingsStore } from '../store/useSettingsStore'

export const ChatBubbles: React.FC = () => {
  const { settings } = useSettingsStore()
  const [isBubbleDismissed, setIsBubbleDismissed] = useState(false)
  const zaloPhone = settings.zalo_phone || '0363645261'

  return (
    <div className="fixed bottom-5 right-4 sm:right-5 z-35 flex flex-col items-end gap-3">
      {/* Nút Zalo kèm bong bóng chỉ dẫn */}
      {zaloPhone && (
        <div className="relative flex items-center">
          {/* Bong bóng chỉ dẫn: Đặt hoa theo yêu cầu */}
          {!isBubbleDismissed && (
            <div className="relative mr-3 flex items-center animate-subtle-bounce-x">
              <a
                href={`https://zalo.me/${zaloPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group/bubble flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#fff5f6] via-white to-white py-2 pl-3 pr-2 shadow-lg ring-1 ring-[#f8cdd3] backdrop-blur-md transition-all duration-200 hover:shadow-xl hover:ring-[#d98f9a] hover:scale-[1.02] active:scale-95 select-none"
                title="Bấm để chat Zalo đặt hoa theo yêu cầu"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#fde8eb] text-[#c76b79] group-hover/bubble:bg-[#c76b79] group-hover/bubble:text-white transition-colors duration-200 shadow-xs">
                  <Sparkles size={13} className="animate-spin-slow" />
                </div>

                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-bold text-stone-900 tracking-tight whitespace-nowrap">
                      Đặt hoa theo yêu cầu
                    </span>
                    <span className="inline-flex items-center rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] font-semibold text-rose-700 leading-none">
                      Tư vấn
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-500 whitespace-nowrap group-hover/bubble:text-[#c76b79] transition-colors flex items-center gap-0.5 mt-0.5">
                    Bấm chat Zalo gửi mẫu ↗
                  </span>
                </div>

                {/* Nút đóng nhỏ nếu muốn ẩn */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsBubbleDismissed(true)
                  }}
                  className="ml-1 rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
                  title="Tạm ẩn gợi ý"
                  aria-label="Đóng gợi ý"
                >
                  <X size={12} />
                </button>
              </a>

              {/* Mũi tên đuôi bong bóng trỏ thẳng vào nút Zalo */}
              <div 
                className="absolute -right-2 top-1/2 -translate-y-1/2 w-0 h-0 border-y-[6px] border-y-transparent border-l-[8px] border-l-[#f8cdd3] pointer-events-none"
                aria-hidden="true"
              />
              <div 
                className="absolute -right-[7px] top-1/2 -translate-y-1/2 w-0 h-0 border-y-[5px] border-y-transparent border-l-[7px] border-l-white pointer-events-none"
                aria-hidden="true"
              />
            </div>
          )}

          {/* Nút tròn Zalo */}
          <a
            href={`https://zalo.me/${zaloPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-stone-200/70 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:ring-blue-300"
            aria-label="Mở Zalo"
            title={`Zalo: ${zaloPhone}`}
          >
            {/* Chấm xanh báo hiệu online */}
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white"></span>
            </span>

            <img
              src="/zalo.svg"
              alt="Zalo"
              className="h-8 w-8 object-contain transition-transform duration-200 group-hover:scale-110"
              aria-hidden="true"
            />
            {isBubbleDismissed && (
              <span className="pointer-events-none absolute right-14 whitespace-nowrap rounded-md bg-stone-900/90 px-2.5 py-1 text-[11px] font-medium text-white opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100">
                Chat Zalo: {zaloPhone}
              </span>
            )}
          </a>
        </div>
      )}

      {/* Nút Facebook */}
      <a
        href="https://www.facebook.com/khoi.que.35"
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-stone-200/70 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:ring-blue-200"
        aria-label="Mở Facebook"
        title="Facebook"
      >
        <img
          src="/facebook-svgrepo-com.svg"
          alt=""
          className="h-8 w-8 object-contain transition-transform duration-200 group-hover:scale-110"
          aria-hidden="true"
        />
        <span className="pointer-events-none absolute right-14 whitespace-nowrap rounded-md bg-stone-900/90 px-2.5 py-1 text-[11px] font-medium text-white opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100">
          Facebook shop
        </span>
      </a>
    </div>
  )
}
