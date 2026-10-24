import React, { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { isDemoMode, getLocalBanners, type ShopBanner } from '../lib/demoData'

export const HeroBannerSlider: React.FC = () => {
  const [banners, setBanners] = useState<ShopBanner[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [bannerRatio, setBannerRatio] = useState<number | null>(null)
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    fetchBanners()
  }, [])

  // Tự động nhận diện tỉ lệ ảnh banner thực tế để scale khung vừa khít trên mọi kích thước màn hình
  useEffect(() => {
    if (banners.length > 0 && banners[0]?.image_url) {
      const img = new Image()
      img.onload = () => {
        const { naturalWidth, naturalHeight } = img
        if (naturalWidth && naturalHeight && naturalWidth > naturalHeight) {
          const ratio = naturalWidth / naturalHeight
          if (ratio >= 1.5 && ratio <= 3.2) {
            setBannerRatio(ratio)
          }
        }
      }
      img.src = banners[0].image_url
    }
  }, [banners])

  const fetchBanners = async () => {
    try {
      if (isDemoMode) {
        const local = getLocalBanners().filter(b => b.is_active)
        setBanners(local)
      } else {
        const { data, error } = await supabase
          .from('shop_banners')
          .select('*')
          .eq('is_active', true)
          .order('order_index', { ascending: true })
          .order('created_at', { ascending: false })
        
        if (error) throw error
        if (data && data.length > 0) {
          setBanners(data as ShopBanner[])
        } else {
          setBanners(getLocalBanners().filter(b => b.is_active))
        }
      }
    } catch {
      setBanners(getLocalBanners().filter(b => b.is_active))
    }
  }

  const nextSlide = useCallback(() => {
    if (banners.length <= 1) return
    setCurrentIndex(prev => (prev + 1) % banners.length)
  }, [banners.length])

  const prevSlide = useCallback(() => {
    if (banners.length <= 1) return
    setCurrentIndex(prev => (prev - 1 + banners.length) % banners.length)
  }, [banners.length])

  // Tự động chuyển slide sau mỗi 4.5 giây (tạm dừng khi hover hoặc touch)
  useEffect(() => {
    if (isPaused || banners.length <= 1) return
    const timer = setInterval(() => {
      nextSlide()
    }, 4500)
    return () => clearInterval(timer)
  }, [isPaused, banners.length, nextSlide])

  // Xử lý cử chỉ vuốt ngón tay trên điện thoại
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    setIsPaused(true)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartX.current - touchEndX

    if (diff > 50) {
      nextSlide() // Vuốt sang trái -> xem ảnh kế tiếp
    } else if (diff < -50) {
      prevSlide() // Vuốt sang phải -> xem ảnh trước đó
    }

    touchStartX.current = null
    setIsPaused(false)
  }

  if (banners.length === 0) return null

  return (
    <div 
      className="relative w-full max-w-6xl mx-auto mb-10 group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Khung chứa ảnh tỉ lệ ngang chuẩn landscape - Tự động nhận diện tỉ lệ ảnh để scale đúng kích thước trên cả điện thoại và máy tính */}
      <div 
        className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-[#f9e1e4]/70 shadow-xs aspect-[21/9] max-h-[380px] md:max-h-[420px] w-full bg-stone-100"
        style={bannerRatio ? { aspectRatio: `${bannerRatio}` } : undefined}
      >
        <div 
          className="flex h-full w-full transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {banners.map((banner, index) => (
            <div key={banner.id} className="min-w-full h-full relative flex-shrink-0 select-none">
              <img
                src={banner.image_url}
                alt={banner.title || `Banner Que Anh Flower ${index + 1}`}
                loading={index === 0 ? 'eager' : 'lazy'}
                fetchPriority={index === 0 ? 'high' : 'auto'}
                decoding="async"
                onLoad={(e) => {
                  if (index === 0 && !bannerRatio) {
                    const { naturalWidth, naturalHeight } = e.currentTarget
                    if (naturalWidth && naturalHeight && naturalWidth > naturalHeight) {
                      const ratio = naturalWidth / naturalHeight
                      if (ratio >= 1.5 && ratio <= 3.2) {
                        setBannerRatio(ratio)
                      }
                    }
                  }
                }}
                className="w-full h-full object-cover object-center block"
              />

              {/* Lớp phủ dải màu và chữ nghệ thuật nếu có */}
              {(banner.title || banner.sub_title) && (
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/75 via-stone-950/20 to-transparent flex flex-col justify-end p-3.5 sm:p-7 md:p-9 text-left">
                  {banner.title && (
                    <h3 className="text-white font-serif text-sm sm:text-2xl md:text-3xl font-light tracking-wide drop-shadow-xs">
                      {banner.title}
                    </h3>
                  )}
                  {banner.sub_title && (
                    <p className="text-stone-200 text-[11px] sm:text-sm font-light mt-0.5 sm:mt-1 max-w-xl line-clamp-2 drop-shadow-xs">
                      {banner.sub_title}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Nút chuyển ảnh Trước / Kế (hiển thị khi hover trên máy tính hoặc luôn sẵn sàng) */}
        {banners.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              aria-label="Ảnh trước"
              className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-white/80 hover:bg-white text-stone-800 backdrop-blur-xs flex items-center justify-center transition-all opacity-80 sm:opacity-0 sm:group-hover:opacity-100 shadow-sm cursor-pointer z-10"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={nextSlide}
              aria-label="Ảnh kế tiếp"
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-white/80 hover:bg-white text-stone-800 backdrop-blur-xs flex items-center justify-center transition-all opacity-80 sm:opacity-0 sm:group-hover:opacity-100 shadow-sm cursor-pointer z-10"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </>
        )}

        {/* Chấm tròn chỉ số slide (Dots) */}
        {banners.length > 1 && (
          <div className="absolute bottom-2 sm:bottom-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Chuyển đến banner ${idx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  currentIndex === idx
                    ? 'w-6 h-1.5 bg-white shadow-xs'
                    : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
