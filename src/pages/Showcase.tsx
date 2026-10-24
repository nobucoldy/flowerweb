import React, { useEffect, useState, useMemo } from 'react'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { CartDrawer } from '../components/CartDrawer'
import { ChatBubbles } from '../components/ChatBubbles'
import { ImageLightbox } from '../components/ImageLightbox'
import { supabase } from '../lib/supabaseClient'
import { isDemoMode, getLocalShowcases, type ShopShowcase } from '../lib/demoData'
import { ZoomIn, Images } from 'lucide-react'

export const Showcase: React.FC = () => {
  const [showcases, setShowcases] = useState<ShopShowcase[]>([])
  const [loading, setLoading] = useState(true)
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null)

  // Xác định số lượng cột linh hoạt theo kích thước màn hình
  const getColCount = () => {
    if (typeof window === 'undefined') return 4
    const w = window.innerWidth
    if (w < 640) return 1
    if (w < 768) return 2
    if (w < 1024) return 3
    return 4 // Màn hình máy tính (>= 1024px) luôn hiển thị đầy đủ 4 cột
  }

  const [colCount, setColCount] = useState(getColCount)

  useEffect(() => {
    const handleResize = () => setColCount(getColCount())
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    fetchShowcaseData()
  }, [])

  const fetchShowcaseData = async () => {
    setLoading(true)
    try {
      if (isDemoMode) {
        await new Promise(r => setTimeout(r, 150))
        const data = getLocalShowcases()
        setShowcases(data)
      } else {
        const { data, error } = await supabase
          .from('shop_showcase')
          .select('*')
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false })
        if (error) throw error
        if (data) setShowcases(data as ShopShowcase[])
      }
    } catch (err) {
      console.error('Lỗi lấy danh sách ảnh thực tế:', err)
      setShowcases(getLocalShowcases())
    } finally {
      setLoading(false)
    }
  }

  // Phân bổ ảnh lần lượt vào các cột theo hàng ngang (Cột 1 -> Cột 2 -> Cột 3 -> Cột 4),
  // ảnh ở hàng sau sẽ tự động dồn sát lên mép dưới của ảnh hàng trước trong cùng cột.
  const columns = useMemo(() => {
    const cols: ShopShowcase[][] = Array.from({ length: colCount }, () => [])
    showcases.forEach((item, index) => {
      cols[index % colCount].push(item)
    })
    return cols
  }, [showcases, colCount])

  return (
    <div className="min-h-screen bg-[#fffafb] flex flex-col font-sans text-stone-850">
      <Navbar />

      <main className="flex-grow pt-24 pb-20 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        {loading ? (
          <div className="py-32 text-center text-stone-400 text-sm flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" />
            Đang tải ảnh...
          </div>
        ) : showcases.length === 0 ? (
          <div className="py-20 text-center bg-white border border-stone-200 rounded-xl p-8 max-w-md mx-auto shadow-xs">
            <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-3 text-stone-400">
              <Images size={24} />
            </div>
            <p className="text-stone-700 font-medium text-sm mb-1">Chưa có hình ảnh nào được tải lên</p>
            <p className="text-stone-400 text-xs">
              Các mẫu hoa lụa chụp thực tế sẽ sớm được cập nhật tại đây!
            </p>
          </div>
        ) : (
          /* Bố cục Masonry hàng ngang: Phân chia đều vào các cột, cột 4 luôn có ảnh, dồn sát hàng trên */
          <div className="flex gap-4 sm:gap-6 items-start">
            {columns.map((col, colIdx) => (
              <div key={colIdx} className="flex-1 flex flex-col gap-6 min-w-0">
                {col.map((item) => (
                  <div key={item.id} className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-shadow duration-300 p-3.5 flex flex-col w-full group">
                    {/* 1 đoạn mô tả nhỏ duy nhất ở ngay phía trên ảnh */}
                    {item.title && (
                      <div className="mb-2">
                        <p className="font-medium text-xs sm:text-[13px] text-stone-850 leading-snug">
                          {item.title}
                        </p>
                      </div>
                    )}

                    {/* Ảnh hiển thị đúng kích thước và tỉ lệ thật 100%, không bị cắt xén */}
                    <div 
                      onClick={() => setActiveLightboxImage(item.image_url)}
                      className="relative cursor-zoom-in overflow-hidden rounded-lg bg-stone-100 border border-stone-100"
                    >
                      <img
                        src={item.image_url}
                        alt={item.title || 'Ảnh hoa lụa thực tế'}
                        loading="lazy"
                        className="w-full h-auto block object-contain group-hover:scale-[1.015] transition-transform duration-300"
                      />
                      {/* Icon phóng to khi rê chuột vào ảnh */}
                      <div className="absolute inset-0 bg-stone-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="p-2 bg-white/95 text-stone-800 rounded-full shadow-xs">
                          <ZoomIn size={16} />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
      <CartDrawer />
      <ChatBubbles />

      {/* Lightbox xem ảnh lớn khi click vào bất kỳ ảnh nào */}
      <ImageLightbox
        imageUrl={activeLightboxImage}
        onClose={() => setActiveLightboxImage(null)}
      />
    </div>
  )
}
