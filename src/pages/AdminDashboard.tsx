import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { isDemoMode, getLocalProducts, saveLocalProducts, getLocalOrders } from '../lib/demoData'
import { useAuthStore } from '../store/useAuthStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { 
  LogOut, Plus, Edit, Trash2, Eye, EyeOff, 
  Upload, X, Loader2, Save, Search 
} from 'lucide-react'

interface Product {
  id: string
  name: string
  price: number
  image_url: string
  status: 'active' | 'inactive'
  created_at: string
}

interface DraftOrder {
  id: string
  items: Array<{
    product_id: string
    product_name: string
    price: number
    quantity: number
  }>
  total_price: number
  created_at: string
}

interface AdminDashboardProps {
  navigate: (path: string) => void
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ navigate }) => {
  const { signOut, user } = useAuthStore()
  const { settings, fetchSettings, updateSetting } = useSettingsStore()
  
  const [activeTab, setActiveTab] = useState<'products' | 'settings' | 'orders'>('products')
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<DraftOrder[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [loadingOrders, setLoadingOrders] = useState(false)
  
  // Trạng thái Form Sản phẩm
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [prodName, setProdName] = useState('')
  const [prodPrice, setProdPrice] = useState('')
  const [prodStatus, setProdStatus] = useState<'active' | 'inactive'>('active')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSavingProduct, setIsSavingProduct] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Trạng thái tìm kiếm
  const [searchTerm, setSearchTerm] = useState('')

  // Trạng thái Form Cài đặt
  const [zaloPhone, setZaloPhone] = useState('')
  const [shopName, setShopName] = useState('')
  const [messageTemplate, setMessageTemplate] = useState('')
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [settingsSuccess, setSettingsSuccess] = useState(false)

  useEffect(() => {
    fetchSettings()
    fetchProducts()
    fetchOrders()
  }, [])

  // Đồng bộ form cài đặt khi settings từ store thay đổi
  useEffect(() => {
    setZaloPhone(settings.zalo_phone || '')
    setShopName(settings.shop_name || '')
    setMessageTemplate(settings.message_template || '')
  }, [settings])

  const fetchProducts = async () => {
    setLoadingProducts(true)
    try {
      if (isDemoMode) {
        await new Promise(r => setTimeout(r, 300))
        setProducts(getLocalProducts() as any[])
      } else {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false })
        if (error) throw error
        if (data) setProducts(data as Product[])
      }
    } catch (e) {
      console.error('Lỗi khi tải sản phẩm:', e)
    } finally {
      setLoadingProducts(false)
    }
  }

  const fetchOrders = async () => {
    setLoadingOrders(true)
    try {
      if (isDemoMode) {
        await new Promise(r => setTimeout(r, 300))
        setOrders(getLocalOrders())
      } else {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
        if (error) throw error
        if (data) setOrders(data as DraftOrder[])
      }
    } catch (e) {
      console.error('Lỗi khi tải đơn hàng nháp:', e)
    } finally {
      setLoadingOrders(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/admin')
  }

  // Xử lý chọn file ảnh
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  // Mở modal thêm sản phẩm
  const handleOpenAddModal = () => {
    setEditingProduct(null)
    setProdName('')
    setProdPrice('')
    setProdStatus('active')
    setSelectedFile(null)
    setImagePreview(null)
    setIsModalOpen(true)
  }

  // Mở modal sửa sản phẩm
  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product)
    setProdName(product.name)
    setProdPrice(product.price.toString())
    setProdStatus(product.status)
    setSelectedFile(null)
    setImagePreview(product.image_url)
    setIsModalOpen(true)
  }

  // Upload ảnh lên Supabase Storage (hoặc dùng ObjectURL trong chế độ Demo)
  const uploadImage = async (file: File): Promise<string> => {
    setUploadProgress(true)
    try {
      if (isDemoMode) {
        await new Promise(r => setTimeout(r, 500))
        return URL.createObjectURL(file)
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`
      const filePath = `uploads/${fileName}`

      console.log('[Upload] Bắt đầu upload:', filePath, 'kích thước:', file.size)

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, { cacheControl: '3600', upsert: false })

      if (uploadError) {
        console.error('[Upload] Lỗi chi tiết từ Supabase:', uploadError)
        throw new Error(`Lỗi Storage: ${uploadError.message}`)
      }

      console.log('[Upload] Thành công:', uploadData)

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (e: any) {
      console.error('[Upload] Exception:', e)
      throw new Error(e.message || 'Không thể tải ảnh lên hệ thống lưu trữ.')

    } finally {
      setUploadProgress(false)
    }
  }

  // Lưu sản phẩm (Thêm mới hoặc Cập nhật)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prodName || !prodPrice) {
      alert('Vui lòng điền đầy đủ Tên và Giá.')
      return
    }

    setIsSavingProduct(true)
    try {
      let finalImageUrl = editingProduct?.image_url || ''

      // Nếu có chọn ảnh mới thì tiến hành upload
      if (selectedFile) {
        finalImageUrl = await uploadImage(selectedFile)
      } else if (!editingProduct) {
        alert('Vui lòng chọn ảnh cho sản phẩm mới.')
        setIsSavingProduct(false)
        return
      }

      const productPayload = {
        name: prodName,
        price: parseFloat(prodPrice),
        image_url: finalImageUrl,
        status: prodStatus,
      }

      if (isDemoMode) {
        const current = getLocalProducts()
        if (editingProduct) {
          const updated = current.map((p: any) =>
            p.id === editingProduct.id ? { ...p, ...productPayload } : p
          )
          saveLocalProducts(updated)
        } else {
          const newProd = {
            ...productPayload,
            id: 'demo-' + Date.now(),
            created_at: new Date().toISOString()
          }
          saveLocalProducts([newProd, ...current])
        }
      } else {
        if (editingProduct) {
          const { error } = await supabase
            .from('products')
            .update(productPayload)
            .eq('id', editingProduct.id)
          if (error) throw error
        } else {
          const { error } = await supabase
            .from('products')
            .insert([productPayload])
          if (error) throw error
        }
      }

      setIsModalOpen(false)
      fetchProducts()
    } catch (e: any) {
      alert(e.message || 'Lỗi khi lưu sản phẩm')
    } finally {
      setIsSavingProduct(false)
    }
  }

  // Xóa sản phẩm
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này không?')) return
    
    try {
      if (isDemoMode) {
        const current = getLocalProducts()
        saveLocalProducts(current.filter((p: any) => p.id !== id))
        fetchProducts()
      } else {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id)
        if (error) throw error
        fetchProducts()
      }
    } catch (e) {
      alert('Không thể xóa sản phẩm. Lỗi kết nối!')
    }
  }

  // Thay đổi nhanh trạng thái ẩn/hiện sản phẩm
  const toggleProductStatus = async (product: Product) => {
    const newStatus = product.status === 'active' ? 'inactive' : 'active'
    try {
      if (isDemoMode) {
        const current = getLocalProducts()
        const updated = current.map((p: any) =>
          p.id === product.id ? { ...p, status: newStatus } : p
        )
        saveLocalProducts(updated)
        setProducts(products.map(p => p.id === product.id ? { ...p, status: newStatus } : p))
      } else {
        const { error } = await supabase
          .from('products')
          .update({ status: newStatus })
          .eq('id', product.id)
        if (error) throw error
        setProducts(products.map(p => p.id === product.id ? { ...p, status: newStatus } : p))
      }
    } catch (e) {
      alert('Lỗi khi thay đổi trạng thái sản phẩm.')
    }
  }

  // Lưu cài đặt cửa hàng
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingSettings(true)
    setSettingsSuccess(false)

    try {
      const r1 = await updateSetting('zalo_phone', zaloPhone)
      const r2 = await updateSetting('shop_name', shopName)
      const r3 = await updateSetting('message_template', messageTemplate)

      if (r1 && r2 && r3) {
        setSettingsSuccess(true)
        setTimeout(() => setSettingsSuccess(false), 3000)
      } else {
        alert('Cập nhật thất bại một vài trường cấu hình.')
      }
    } catch (e) {
      alert('Lỗi lưu cấu hình.')
    } finally {
      setIsSavingSettings(false)
    }
  }

  // Bộ lọc sản phẩm
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans text-stone-900">
      {/* Admin Navbar */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-serif text-xl font-medium tracking-wide text-stone-950">Que Anh Flower</span>
            <span className="bg-stone-100 text-stone-600 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-xs">Admin</span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-xs text-stone-500 hidden sm:inline">{user?.email}</span>
            <button 
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-stone-200 rounded-sm hover:bg-stone-50 text-xs font-semibold tracking-wider text-stone-700 transition-colors duration-200 cursor-pointer"
            >
              <LogOut size={14} />
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* Admin Subnav tabs */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-6 flex gap-8">
          <button 
            onClick={() => setActiveTab('products')}
            className={`py-4 border-b-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'products' ? 'border-stone-950 text-stone-950' : 'border-transparent text-stone-400 hover:text-stone-700'
            }`}
          >
            Sản phẩm ({products.length})
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`py-4 border-b-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'settings' ? 'border-stone-950 text-stone-950' : 'border-transparent text-stone-400 hover:text-stone-700'
            }`}
          >
            Cài đặt cửa hàng
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`py-4 border-b-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'orders' ? 'border-stone-950 text-stone-950' : 'border-transparent text-stone-400 hover:text-stone-700'
            }`}
          >
            Lịch sử Click đơn ({orders.length})
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-6 py-10">
        
        {/* TAB 1: SẢN PHẨM */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Tìm kiếm */}
              <div className="relative max-w-xs w-full">
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs pl-8 pr-4 py-2.5 bg-white border border-stone-200 focus:border-stone-900 rounded-sm focus:outline-hidden"
                />
                <Search size={14} className="absolute left-2.5 top-3.5 text-stone-400" />
              </div>

              {/* Thêm mới */}
              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-stone-950 hover:bg-stone-850 text-stone-50 rounded-sm text-xs font-bold tracking-wider uppercase transition-colors duration-200 cursor-pointer w-fit"
              >
                <Plus size={14} />
                Thêm sản phẩm
              </button>
            </div>

            {loadingProducts ? (
              <div className="py-20 flex flex-col items-center justify-center text-stone-400 text-sm gap-2">
                <Loader2 className="animate-spin text-stone-800" size={24} />
                Đang tải danh sách sản phẩm...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-white border border-stone-100 rounded-sm">
                <p className="text-stone-400 text-sm font-serif italic">Không tìm thấy sản phẩm nào</p>
              </div>
            ) : (
              <div className="bg-white border border-stone-200 rounded-sm overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                        <th className="px-6 py-4 w-20">Ảnh</th>
                        <th className="px-6 py-4">Tên / Mã hoa</th>
                        <th className="px-6 py-4 w-32">Giá tiền</th>
                        <th className="px-6 py-4 w-32">Trạng thái</th>
                        <th className="px-6 py-4 w-28 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-stone-50/50 transition-colors">
                          <td className="px-6 py-3">
                            <img 
                              src={p.image_url} 
                              alt={p.name} 
                              className="w-10 h-12 object-cover rounded-sm border border-stone-200 bg-stone-100"
                            />
                          </td>
                          <td className="px-6 py-3 font-medium text-stone-900">{p.name}</td>
                          <td className="px-6 py-3 text-stone-700 font-medium">{p.price.toLocaleString('vi-VN')}đ</td>
                          <td className="px-6 py-3">
                            <button
                              onClick={() => toggleProductStatus(p)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold text-[10px] tracking-wider uppercase cursor-pointer ${
                                p.status === 'active'
                                  ? 'bg-green-50 text-green-700 border border-green-200/50'
                                  : 'bg-stone-100 text-stone-600 border border-stone-200'
                              }`}
                            >
                              {p.status === 'active' ? (
                                <>
                                  <Eye size={10} /> Đang bán
                                </>
                              ) : (
                                <>
                                  <EyeOff size={10} /> Ẩn bán
                                </>
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleOpenEditModal(p)}
                                className="p-1.5 text-stone-500 hover:text-stone-950 border border-stone-100 hover:border-stone-300 rounded-md bg-white transition-all cursor-pointer"
                                title="Sửa sản phẩm"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                className="p-1.5 text-stone-400 hover:text-red-600 border border-stone-100 hover:border-red-200 rounded-md bg-white transition-all cursor-pointer"
                                title="Xóa sản phẩm"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CÀI ĐẶT CỬA HÀNG */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl bg-white border border-stone-200 rounded-sm shadow-xs p-8">
            <h2 className="text-base font-medium font-serif tracking-wide text-stone-950 mb-6">Cấu hình thông tin Shop & Zalo</h2>

            {settingsSuccess && (
              <div className="mb-6 p-3 bg-green-50 border border-green-200/50 rounded-sm text-green-700 text-xs">
                Cập nhật cài đặt thành công!
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                  Tên cửa hàng (Shop Name)
                </label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full text-sm px-4 py-3 bg-stone-50 border border-stone-200 focus:border-stone-900 rounded-sm focus:outline-hidden transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                  Số điện thoại Zalo nhận đơn (Zalo Phone)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 0912345678"
                  value={zaloPhone}
                  onChange={(e) => setZaloPhone(e.target.value)}
                  className="w-full text-sm px-4 py-3 bg-stone-50 border border-stone-200 focus:border-stone-900 rounded-sm focus:outline-hidden transition-all duration-200"
                />
                <p className="mt-1.5 text-[10px] text-stone-400 leading-relaxed">
                  Nhập số điện thoại đăng ký Zalo của bạn (không chứa khoảng trắng). Khách hàng bấm gửi đơn sẽ được chuyển tới link: <span className="font-mono bg-stone-100 p-0.5 px-1 rounded-sm">https://zalo.me/&#123;Số_Zalo&#125;</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                  Mẫu lời chào đầu đơn hàng
                </label>
                <textarea
                  required
                  rows={3}
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  className="w-full text-sm px-4 py-3 bg-stone-50 border border-stone-200 focus:border-stone-900 rounded-sm focus:outline-hidden transition-all duration-200 resize-none"
                />
                <p className="mt-1.5 text-[10px] text-stone-400">
                  Dòng đầu tiên xuất hiện trong tin nhắn copy đơn hàng mà khách sẽ dán gửi cho bạn.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSavingSettings}
                className="flex items-center justify-center gap-1.5 py-3 px-6 bg-stone-950 hover:bg-stone-850 text-stone-50 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors duration-200 cursor-pointer disabled:opacity-50"
              >
                {isSavingSettings ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <>
                    <Save size={14} />
                    Lưu cấu hình
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: ĐƠN HÀNG NHÁP */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-medium font-serif tracking-wide text-stone-950">Lịch sử nhấp chuột đặt hàng của khách</h2>
              <button 
                onClick={fetchOrders}
                className="text-stone-500 hover:text-stone-950 text-xs flex items-center gap-1 cursor-pointer font-semibold uppercase tracking-wider"
              >
                Tải lại
              </button>
            </div>

            {loadingOrders ? (
              <div className="py-20 flex flex-col items-center justify-center text-stone-400 text-sm gap-2">
                <Loader2 className="animate-spin text-stone-850" size={24} />
                Đang tải lịch sử đơn...
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-20 bg-white border border-stone-100 rounded-sm">
                <p className="text-stone-400 text-sm font-serif italic">Chưa ghi nhận click đặt hàng nào của khách</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((o) => (
                  <div key={o.id} className="bg-white border border-stone-200 rounded-sm p-6 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 pb-3 mb-4 gap-2">
                      <div>
                        <span className="text-xs font-mono font-bold text-stone-850 uppercase tracking-wide">Mã ghi nhận: #{o.id.substring(0, 8)}</span>
                        <span className="text-[10px] text-stone-400 block sm:inline sm:ml-4">{new Date(o.created_at).toLocaleString('vi-VN')}</span>
                      </div>
                      <span className="text-sm font-bold text-stone-950">Tổng tiền: {o.total_price.toLocaleString('vi-VN')}đ</span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Chi tiết đơn hàng:</p>
                      {o.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-stone-600">
                          <span>{item.product_name} <span className="text-stone-400">x{item.quantity}</span></span>
                          <span className="font-medium text-stone-850">{(item.price * item.quantity).toLocaleString('vi-VN')}đ</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL THÊM / SỬA SẢN PHẨM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-md w-full max-w-lg shadow-xl overflow-hidden animate-slide-up">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between">
              <h3 className="text-base font-medium font-serif tracking-wide text-stone-950">
                {editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProduct} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                  Tên hoặc Mã sản phẩm
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hoa Hồng Lụa QAF01"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 bg-stone-50 border border-stone-200 focus:border-stone-900 rounded-sm focus:outline-hidden transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                  Giá bán (VND)
                </label>
                <input
                  type="number"
                  required
                  placeholder="Ví dụ: 350000"
                  value={prodPrice}
                  onChange={(e) => setProdPrice(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 bg-stone-50 border border-stone-200 focus:border-stone-900 rounded-sm focus:outline-hidden transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                  Trạng thái hiển thị
                </label>
                <select
                  value={prodStatus}
                  onChange={(e) => setProdStatus(e.target.value as 'active' | 'inactive')}
                  className="w-full text-sm px-4 py-2.5 bg-stone-50 border border-stone-200 focus:border-stone-900 rounded-sm focus:outline-hidden transition-all"
                >
                  <option value="active">Hiển thị bán (Active)</option>
                  <option value="inactive">Tạm ẩn (Inactive)</option>
                </select>
              </div>

              {/* Upload ảnh */}
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                  Hình ảnh sản phẩm (Tỉ lệ khuyến nghị 3:4 hoặc 1:1)
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-stone-200 hover:border-stone-400 bg-stone-50 hover:bg-stone-100/50 rounded-md p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group min-h-[160px]"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  {imagePreview ? (
                    <div className="relative w-28 h-36 border border-stone-200 rounded-sm overflow-hidden bg-white shadow-xs">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-stone-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Upload size={16} className="text-white" />
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload size={24} className="text-stone-400 group-hover:text-stone-600 transition-colors" />
                      <div className="text-stone-500 text-xs font-semibold">Bấm để tải ảnh lên</div>
                      <div className="text-[10px] text-stone-400">Định dạng hỗ trợ: JPG, PNG, WEBP</div>
                    </>
                  )}
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex justify-end gap-3 border-t border-stone-100 pt-5 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-4 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-sm text-xs font-semibold tracking-wider transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingProduct || uploadProgress}
                  className="flex items-center gap-1.5 py-2.5 px-5 bg-stone-950 hover:bg-stone-850 text-stone-50 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors duration-200 cursor-pointer disabled:opacity-50"
                >
                  {isSavingProduct || uploadProgress ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <Save size={12} />
                      {editingProduct ? 'Cập nhật' : 'Thêm mới'}
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  )
}
