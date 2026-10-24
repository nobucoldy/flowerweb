import React, { useEffect, useState, useMemo } from 'react'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { CartDrawer } from '../components/CartDrawer'
import { ChatBubbles } from '../components/ChatBubbles'
import { ImageLightbox } from '../components/ImageLightbox'
import { supabase } from '../lib/supabaseClient'
import { isDemoMode, getLocalShowcases, type ShopShowcase } from '../lib/demoData'
import { ZoomIn, Images, Pin } from 'lucide-react'

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

  const pinnedShowcases = useMemo(() => showcases.filter(s => s.is_pinned), [showcases])
  const regularShowcases = useMemo(() => showcases.filter(s => !s.is_pinned), [showcases])

  // Phân bổ các ảnh còn lại lần lượt vào các cột theo hàng ngang
  const columns = useMemo(() => {
    const cols: ShopShowcase[][] = Array.from({ length: colCount }, () => [])
    regularShowcases.forEach((item, index) => {
      cols[index % colCount].push(item)
    })
    return cols
  }, [regularShowcases, colCount])

  return (
    <div className="min-h-screen bg-[#fffafb] flex flex-col font-sans text-stone-850">
      <Navbar />

      <main className="flex-grow pt-24 pb-20 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        {/* Tiêu đề giới thiệu trang Showcase */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-[11px] uppercase tracking-widest text-rose-600 font-bold bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
            Ảnh Chụp Tại Xưởng
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl text-stone-900 font-normal mt-3 mb-2">
            Ảnh Hoa Thực Tế & Phản Hồi
          </h1>
          <p className="text-stone-500 text-xs sm:text-sm">
            Hình ảnh thực tế các mẫu hoa lụa do Que Anh Flower thực hiện và hoàn thiện tại xưởng.
          </p>
        </div>

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
          <div className="space-y-12">
            {/* ======================================================== */}
            {/* 1. KHU VỰC ẢNH ĐƯỢC GHIM LÊN ĐẦU TRANG (NỔI BẬT NHẤT) */}
            {/* ======================================================== */}
            {pinnedShowcases.length > 0 && (
              <section className="bg-gradient-to-b from-rose-50/60 to-transparent p-5 sm:p-7 rounded-2xl border border-rose-100/80">
                <div className="flex items-center gap-2 mb-5">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-rose-600 text-white shadow-xs">
                    <Pin size={13} className="rotate-45" />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-stone-900">
                      Mẫu hoa nổi bật được ghim đầu trang
                    </h2>
                    <p className="text-[11px] text-stone-500">
                      Những hình ảnh hoa thực tế tiêu biểu và được yêu thích nhất của shop
                    </p>
                  </div>
                </div>

                {/* Lưới ảnh ghim: Cỡ lớn, nổi bật ở trên cùng */}
                <div className={`grid gap-6 ${
                  pinnedShowcases.length === 1 
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-3xl' 
                    : pinnedShowcases.length === 2 
                      ? 'grid-cols-1 sm:grid-cols-2 max-w-4xl' 
                      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                }`}>
                  {pinnedShowcases.map((item) => (
                    <div 
                      key={item.id} 
                      className="bg-white border-2 border-rose-300/80 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 p-4 flex flex-col w-full relative ring-4 ring-rose-100/50"
                    >
                      {item.title && (
                        <div className="mb-2">
                          <p className="font-semibold text-xs sm:text-[13px] text-stone-900 leading-snug">
                            {item.title}
                          </p>
                        </div>
                      )}

                      <div 
                        onClick={() => setActiveLightboxImage(item.image_url)}
                        className="relative cursor-zoom-in overflow-hidden rounded-lg bg-stone-100 border border-stone-100 group"
                      >
                        <img
                          src={item.image_url}
                          alt={item.title || 'Ảnh hoa thực tế ghim nổi bật'}
                          loading="lazy"
                          className="w-full h-auto block object-contain group-hover:scale-[1.02] transition-transform duration-300"
                        />
                        <span className="absolute top-2.5 left-2.5 z-10 bg-rose-600 text-white text-[10px] font-bold uppercase px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 tracking-wider">
                          <Pin size={10} className="rotate-45" /> Đã ghim
                        </span>
                        <div className="absolute inset-0 bg-stone-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="p-2 bg-white/95 text-stone-800 rounded-full shadow-xs">
                            <ZoomIn size={16} />
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ======================================================== */}
            {/* 2. KHU VỰC CÁC ẢNH THỰC TẾ CÒN LẠI */}
            {/* ======================================================== */}
            {regularShowcases.length > 0 && (
              <section>
                {pinnedShowcases.length > 0 && (
                  <div className="flex items-center gap-2 mb-5">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-stone-100 text-stone-600">
                      <Images size={13} />
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-stone-700">
                      Bộ sưu tập ảnh hoa thực tế khác ({regularShowcases.length})
                    </h3>
                  </div>
                )}

                {/* Bố cục Masonry hàng ngang: Phân chia đều vào các cột */}
                <div className="flex gap-4 sm:gap-6 items-start">
                  {columns.map((col, colIdx) => (
                    <div key={colIdx} className="flex-1 flex flex-col gap-6 min-w-0">
                      {col.map((item) => (
                        <div key={item.id} className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-shadow duration-300 p-3.5 flex flex-col w-full group">
                          {item.title && (
                            <div className="mb-2">
                              <p className="font-medium text-xs sm:text-[13px] text-stone-850 leading-snug">
                                {item.title}
                              </p>
                            </div>
                          )}

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
              </section>
            )}
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
