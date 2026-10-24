import React, { useEffect, useState, useMemo } from 'react'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { CartDrawer } from '../components/CartDrawer'
import { ChatBubbles } from '../components/ChatBubbles'
import { ProductCard } from '../components/ProductCard'
import { ImageLightbox } from '../components/ImageLightbox'
import { supabase } from '../lib/supabaseClient'
import { isDemoMode, getLocalProducts, saveLocalProducts } from '../lib/demoData'
import { recordPageView, recordProductView } from '../lib/analytics'
import type { Product } from '../store/useCartStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { HeroBannerSlider } from '../components/HeroBannerSlider'
import { Sparkles, SlidersHorizontal } from 'lucide-react'
import { PRICE_FILTER_OPTIONS, matchPriceFilter, type PriceFilterType } from '../lib/priceUtils'

export const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null)
  const [priceFilter, setPriceFilter] = useState<PriceFilterType>('all')
  const { fetchSettings } = useSettingsStore()

  useEffect(() => {
    fetchSettings()
    fetchProducts()
    recordPageView() // Tự động ghi nhận lượt truy cập trang web
  }, [fetchSettings])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      if (isDemoMode) {
        await new Promise(r => setTimeout(r, 200))
        const allProds = getLocalProducts()
        setProducts(allProds.filter(p => (p.status || 'active') === 'active'))
      } else {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false })
        if (error) throw error
        if (data && data.length > 0) {
          saveLocalProducts(data as Product[])
          setProducts((data as Product[]).filter(p => (p.status || 'active') === 'active'))
        } else {
          const allProds = getLocalProducts()
          setProducts(allProds.filter(p => (p.status || 'active') === 'active'))
        }
      }
    } catch (e) {
      console.warn('Lỗi khi lấy danh sách sản phẩm từ Supabase, fallback sang dữ liệu máy:', e)
      const allProds = getLocalProducts()
      setProducts(allProds.filter(p => (p.status || 'active') === 'active'))
    } finally {
      setLoading(false)
    }
  }

  // Xử lý khi khách bấm vào xem ảnh sản phẩm
  const handleProductImageClick = (product: Product) => {
    // 1. Tăng lượt xem sản phẩm (Analytics chạy ngầm, không hiện số lên UI)
    recordProductView(product.id)
    
    // Cập nhật số view trong state
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id ? { ...p, views_count: (p.views_count || 0) + 1 } : p
      )
    )

    // 2. Mở lightbox xem ảnh lớn
    setActiveLightboxImage(product.image_url)
  }

  // Thống kê số lượng sản phẩm theo từng mức giá
  const countsByFilter = useMemo(() => {
    const activeProds = products.filter((p) => (p.status || 'active') === 'active')
    return {
      all: activeProds.length,
      'under-3xx': activeProds.filter((p) => matchPriceFilter(p.price, 'under-3xx')).length,
      '3xx-5xx': activeProds.filter((p) => matchPriceFilter(p.price, '3xx-5xx')).length,
      'above-5xx': activeProds.filter((p) => matchPriceFilter(p.price, 'above-5xx')).length,
    }
  }, [products])

  // Lọc sản phẩm theo khoảng giá
  const filteredProducts = useMemo(() => {
    const list = products.filter((p) => (p.status || 'active') === 'active')

    if (priceFilter !== 'all') {
      return list.filter((p) => matchPriceFilter(p.price, priceFilter))
    }

    return list
  }, [products, priceFilter])

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-[#fffafb] flex flex-col">
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: '#fffafb',
          backgroundImage: `
            radial-gradient(
              circle at top right,
              rgba(249, 225, 228, 0.95),
              transparent 62%
            ),
            radial-gradient(
              circle at 12% 18%,
              rgba(255, 255, 255, 0.95),
              transparent 38%
            )
          `,
          filter: 'blur(70px)',
          backgroundRepeat: 'no-repeat',
        }}
      />

      <Navbar />

      <main className="relative z-10 flex-grow max-w-6xl w-full mx-auto px-6 pt-28 pb-12 md:pt-32">
        {/* Banner tiêu đề tối giản */}
        

        {/* Banner chạy ảnh tự động của shop */}
        <HeroBannerSlider />

        {/* Cảnh báo cấu hình dự phòng nếu chưa điền ENV */}
        

        {/* Thanh công cụ lọc khoảng giá: Dưới 3xx, 3xx-5xx, Trên 5xx */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-stone-200/60 pb-4">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-xs text-stone-500 font-medium mr-1 flex items-center gap-1">
              <SlidersHorizontal size={13} className="text-stone-400" />
              Mức giá:
            </span>
            {PRICE_FILTER_OPTIONS.map((option) => {
              const isActive = priceFilter === option.key
              const count = countsByFilter[option.key]
              return (
                <button
                  key={option.key}
                  onClick={() => setPriceFilter(option.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-stone-900 text-stone-50 shadow-xs'
                      : 'bg-white/80 hover:bg-stone-100 text-stone-600 border border-stone-200/80 hover:border-stone-300'
                  }`}
                >
                  <span>{option.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                      isActive
                        ? 'bg-stone-800 text-stone-200'
                        : 'bg-stone-100 text-stone-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Đếm số mẫu đang hiển thị */}
          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <Sparkles size={13} className="text-rose-500" />
            <span>{filteredProducts.length} mẫu hoa</span>
          </div>
        </div>

        {/* Lưới sản phẩm */}
        {loading ? (
          // Skeleton loading
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col animate-pulse">
                <div className="aspect-[3/4] bg-stone-200/60 rounded-sm mb-4" />
                <div className="h-4 bg-stone-200/60 rounded-xs w-3/4 mb-2" />
                <div className="h-3 bg-stone-200/60 rounded-xs w-1/4" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          // Empty State (Khi lọc không có kết quả hoặc chưa có sản phẩm)
          <div className="text-center py-16 bg-white/80 backdrop-blur-xs rounded-xl border border-stone-200/70 px-8 shadow-xs max-w-md mx-auto">
            <p className="text-stone-700 font-serif text-base mb-2">
              {priceFilter !== 'all' ? 'Không tìm thấy mẫu hoa phù hợp' : 'Hiện chưa có sản phẩm'}
            </p>
            <p className={`text-xs text-stone-500 leading-relaxed ${priceFilter !== 'all' ? 'mb-5' : ''}`}>
              {priceFilter !== 'all'
                ? 'Thử chọn khoảng giá khác để xem thêm nhiều mẫu hoa nhé.'
                : 'Cửa hàng hiện chưa có sản phẩm nào được hiển thị. Vui lòng quay lại sau nhé!'}
            </p>
            {priceFilter !== 'all' && (
              <button
                onClick={() => setPriceFilter('all')}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-stone-50 rounded-full text-xs font-medium transition-colors cursor-pointer"
              >
                Xem tất cả mẫu hoa
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 animate-fade-in">
            {filteredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onImageClick={handleProductImageClick}
              />
            ))}
          </div>
        )}
      </main>

      <div className="relative z-10">
        <Footer />
      </div>
      <ChatBubbles />
      <CartDrawer />
      
      {/* Lightbox xem ảnh kích thước lớn */}
      <ImageLightbox 
        imageUrl={activeLightboxImage} 
        onClose={() => setActiveLightboxImage(null)} 
      />
    </div>
  )
}
