import React, { useEffect, useState } from 'react'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { CartDrawer } from '../components/CartDrawer'
import { ProductCard } from '../components/ProductCard'
import { ImageLightbox } from '../components/ImageLightbox'
import { supabase } from '../lib/supabaseClient'
import { isDemoMode, getLocalProducts } from '../lib/demoData'
import type { Product } from '../store/useCartStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { Info } from 'lucide-react'

export const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null)
  const { fetchSettings, settings } = useSettingsStore()

  useEffect(() => {
    fetchSettings()
    fetchProducts()
  }, [fetchSettings])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      if (isDemoMode) {
        await new Promise(r => setTimeout(r, 400)) // Giả lập độ trễ mạng
        setProducts(getLocalProducts())
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

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-6xl w-full mx-auto px-6 py-12">
        {/* Banner tiêu đề tối giản */}
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="font-serif text-4xl md:text-5xl font-light text-stone-900 tracking-wider mb-3">
            {settings.shop_name || 'Que Anh Flower'}
          </h1>
          <p className="text-stone-400 text-[10px] md:text-xs tracking-widest uppercase font-light">
            Hoa lụa - Hoa sáp
          </p>
        </div>

        {/* Cảnh báo cấu hình dự phòng nếu chưa điền ENV */}
        {(!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('your-supabase-project-url')) && (
          <div className="mb-10 p-4 bg-amber-50/80 border border-amber-200/60 rounded-sm text-stone-700 text-xs flex items-start gap-3">
            <Info size={16} className="mt-0.5 flex-shrink-0 text-amber-600" />
            <div>
              <p className="font-bold text-amber-800 mb-1">Chế độ xem thử nghiệm (Demo Mode)</p>
              <p className="leading-relaxed">
                Ứng dụng chưa được kết nối với cơ sở dữ liệu Supabase của bạn. Bạn vẫn có thể xem giao diện mẫu. Để chạy thực tế, vui lòng tạo file cấu hình `.env`, chạy tập lệnh SQL cài đặt cơ sở dữ liệu và thêm sản phẩm.
              </p>
            </div>
          </div>
        )}

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
        ) : products.length === 0 ? (
          // Empty State
          <div className="text-center py-20 bg-white rounded-md border border-stone-100 py-16 px-8 shadow-xs max-w-lg mx-auto">
            <p className="text-stone-400 font-serif italic mb-4">Cửa hàng hiện chưa có sản phẩm nào được hiển thị</p>
            <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
              Vui lòng truy cập trang <a href="/admin" className="underline text-stone-950 font-bold hover:text-stone-700">Quản trị viên</a> để đăng nhập và thêm mới các sản phẩm hoa lụa đầu tiên.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 animate-fade-in">
            {products.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onImageClick={setActiveLightboxImage}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
      <CartDrawer />
      
      {/* Lightbox xem ảnh kích thước lớn */}
      <ImageLightbox 
        imageUrl={activeLightboxImage} 
        onClose={() => setActiveLightboxImage(null)} 
      />
    </div>
  )
}
