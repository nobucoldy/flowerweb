import React, { useEffect, useState, useMemo } from 'react'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { CartDrawer } from '../components/CartDrawer'
import { ChatBubbles } from '../components/ChatBubbles'
import { ProductCard } from '../components/ProductCard'
import { ImageLightbox } from '../components/ImageLightbox'
import { supabase } from '../lib/supabaseClient'
import { isDemoMode, getLocalProducts } from '../lib/demoData'
import { recordPageView, recordProductView } from '../lib/analytics'
import type { Product } from '../store/useCartStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { HeroBannerSlider } from '../components/HeroBannerSlider'
import { Sparkles } from 'lucide-react'

export const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'featured' | 'views' | 'price_asc' | 'price_desc'>('featured')
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
          .eq('status', 'active')
          .order('created_at', { ascending: false })
        if (error) throw error
        if (data) setProducts(data as Product[])
      }
    } catch (e) {
      console.error('Lỗi khi lấy danh sách sản phẩm:', e)
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

  // Lọc sản phẩm active và sắp xếp
  const filteredProducts = useMemo(() => {
    const list = products.filter((p) => (p.status || 'active') === 'active')

    if (sortBy === 'views') {
      list.sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
    } else if (sortBy === 'price_asc') {
      list.sort((a, b) => a.price - b.price)
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => b.price - a.price)
    }

    return list
  }, [products, sortBy])

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
        

        {/* Thanh công cụ danh sách sản phẩm (Bỏ lọc loại hoa, chỉ giữ sắp xếp) */}
        <div className="mb-8 flex items-center justify-between border-b border-stone-200/60 pb-3">
          <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
            <Sparkles size={14} className="text-rose-500" />
            <span>Bộ sưu tập hoa ({filteredProducts.length} mẫu)</span>
          </div>

          {/* Sắp xếp */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-stone-400">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-stone-200 text-stone-800 rounded-sm px-2.5 py-1 text-xs focus:outline-hidden cursor-pointer"
            >
              <option value="featured">✨ Mới nhất</option>
              <option value="views">🔥 Phổ biến nhất</option>
              <option value="price_asc">💵 Giá: Thấp đến Cao</option>
              <option value="price_desc">💎 Giá: Cao đến Thấp</option>
            </select>
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
          // Empty State
          <div className="text-center py-20 bg-white rounded-md border border-stone-100 px-8 shadow-xs max-w-lg mx-auto">
            <p className="text-stone-400 font-serif italic mb-4">Cửa hàng hiện chưa có sản phẩm nào được hiển thị</p>
            <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
              Vui lòng truy cập trang <a href="/admin" className="underline text-stone-950 font-bold hover:text-stone-700">Quản trị viên</a> để bật trạng thái hiển thị cho các sản phẩm hoa.
            </p>
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
