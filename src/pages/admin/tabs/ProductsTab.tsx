import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Plus, Edit, Trash2, Eye, EyeOff, Upload, X, Loader2, Save, Search, RotateCcw, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase, supabaseAdmin, uploadStorageImage } from '../../../lib/supabaseClient'
import { withDbRetry } from '../../../lib/supabaseHelper'
import { isDemoMode, getLocalProducts, saveLocalProducts, saveLocalProduct, toggleProductStatusLocal, deleteLocalProduct, resetToSeedData } from '../../../lib/demoData'
import { compressImage, validateImageFile } from '../../../lib/imageUtils'
import { parsePriceInput } from '../../../lib/priceUtils'
import type { AdminProduct } from '../types'

interface ProductsTabProps {
  onProductsLoaded?: (products: AdminProduct[]) => void
}

const ITEMS_PER_PAGE = 20

export const ProductsTab: React.FC<ProductsTabProps> = ({ onProductsLoaded }) => {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  
  // Trạng thái tìm kiếm, lọc & phân trang
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'views_desc' | 'price_desc' | 'price_asc'>('views_desc')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [currentPage, setCurrentPage] = useState(1)

  // Trạng thái Form Sản phẩm
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null)
  const [prodName, setProdName] = useState('')
  const [prodPrice, setProdPrice] = useState('')
  const [prodCategory, setProdCategory] = useState('Hoa bó')
  const [prodStatus, setProdStatus] = useState<'active' | 'inactive'>('active')
  const [prodViews, setProdViews] = useState('0')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSavingProduct, setIsSavingProduct] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(false)
  const [togglingProductId, setTogglingProductId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Chỉ fetch dữ liệu khi mở tab
  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setLoadingProducts(true)
    try {
      if (isDemoMode) {
        await new Promise(r => setTimeout(r, 100))
        const local = getLocalProducts() as AdminProduct[]
        setProducts(local)
        onProductsLoaded?.(local)
      } else {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false })
        if (error) throw error
        if (data && data.length > 0) {
          const prods = data as AdminProduct[]
          setProducts(prods)
          saveLocalProducts(prods)
          onProductsLoaded?.(prods)
        } else {
          const local = getLocalProducts() as AdminProduct[]
          setProducts(local)
          onProductsLoaded?.(local)
        }
      }
    } catch (err) {
      console.warn('Lỗi khi tải sản phẩm từ Supabase, fallback sang dữ liệu bộ nhớ máy:', err)
      const local = getLocalProducts() as AdminProduct[]
      setProducts(local)
      onProductsLoaded?.(local)
    } finally {
      setLoadingProducts(false)
    }
  }

  // Khôi phục Seed Data mặc định
  const handleResetSeed = () => {
    if (window.confirm('Khôi phục toàn bộ danh mục sản phẩm về dữ liệu mẫu ban đầu?')) {
      const resetProds = resetToSeedData() as AdminProduct[]
      setProducts(resetProds)
      onProductsLoaded?.(resetProds)
      alert('Đã khôi phục sản phẩm mẫu thành công!')
    }
  }

  // Mở modal thêm sản phẩm mới
  const handleOpenAddModal = () => {
    setEditingProduct(null)
    setProdName('')
    setProdPrice('')
    setProdCategory('Hoa bó')
    setProdStatus('active')
    setProdViews('0')
    setSelectedFile(null)
    setImagePreview(null)
    setIsModalOpen(true)
  }

  // Mở modal sửa sản phẩm
  const handleOpenEditModal = (product: AdminProduct) => {
    setEditingProduct(product)
    setProdName(product.name)
    setProdPrice(product.price.toString())
    setProdCategory(product.category || 'Hoa bó')
    setProdStatus((product.status || 'active') as 'active' | 'inactive')
    setProdViews((product.views_count || 0).toString())
    setSelectedFile(null)
    setImagePreview(product.image_url)
    setIsModalOpen(true)
  }

  // Xử lý chọn file ảnh
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const validation = validateImageFile(file)
      if (!validation.valid) {
        alert(validation.error)
        e.target.value = ''
        return
      }

      setSelectedFile(file)
      try {
        const compressed = await compressImage(file, 1000, 1000, 0.8)
        setImagePreview(compressed)
      } catch {
        const reader = new FileReader()
        reader.onloadend = () => setImagePreview(reader.result as string)
        reader.readAsDataURL(file)
      }
    }
  }

  // Upload ảnh lên Storage
  const uploadImage = async (file: File): Promise<string> => {
    if (isDemoMode) {
      try {
        const compressed = await compressImage(file, 1000, 1000, 0.8)
        return compressed || URL.createObjectURL(file)
      } catch {
        return URL.createObjectURL(file)
      }
    }

    setUploadProgress(true)
    try {
      const storageUrl = await uploadStorageImage(file, 'products')
      if (storageUrl) return storageUrl

      const compressedBase64 = await compressImage(file, 1000, 1000, 0.8)
      if (compressedBase64) return compressedBase64

      return await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve((reader.result as string) || '')
        reader.readAsDataURL(file)
      })
    } catch {
      return ''
    } finally {
      setUploadProgress(false)
    }
  }

  // Lưu sản phẩm (Thêm mới hoặc Cập nhật) với Optimistic Update
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prodName.trim()) {
      alert('Vui lòng nhập tên hoặc mã hoa.')
      return
    }

    setIsSavingProduct(true)

    try {
      let finalImageUrl = imagePreview || ''
      if (selectedFile) {
        finalImageUrl = await uploadImage(selectedFile)
      }

      if (!finalImageUrl) {
        finalImageUrl = 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?q=80&w=600&auto=format&fit=crop'
      }

      const viewsCountNumber = Math.max(0, parseInt(prodViews) || 0)
      const finalPrice = parsePriceInput(prodPrice)

      const productPayload = {
        name: prodName.trim(),
        price: finalPrice,
        image_url: finalImageUrl,
        status: prodStatus,
        category: prodCategory.trim() || 'Hoa lụa',
        views_count: viewsCountNumber
      }

      let savedProduct: AdminProduct

      if (!isDemoMode) {
        if (editingProduct) {
          // Dùng upsert kèm id để nếu sản phẩm chưa có trong DB sẽ tự động được INSERT vào DB!
          const { data, error } = await withDbRetry<AdminProduct[]>(() =>
            supabaseAdmin
              .from('products')
              .upsert({ ...productPayload, id: editingProduct.id }, { onConflict: 'id' })
              .select()
          )

          if (error) {
            console.error('Lỗi Supabase khi cập nhật sản phẩm:', error)
            throw new Error(`Không thể lưu vào Database: ${error.message || 'Lỗi kết nối'}`)
          }

          savedProduct = (data && data[0]) ? data[0] : { ...editingProduct, ...productPayload }
        } else {
          const { data, error } = await withDbRetry<AdminProduct[]>(() =>
            supabaseAdmin
              .from('products')
              .insert(productPayload)
              .select()
          )

          if (error) {
            console.error('Lỗi Supabase khi thêm mới sản phẩm:', error)
            throw new Error(`Không thể lưu vào Database: ${error.message || 'Lỗi kết nối'}`)
          }

          if (data && data[0]) {
            savedProduct = data[0]
          } else {
            throw new Error('Không nhận được dữ liệu phản hồi từ Database.')
          }
        }
      } else {
        savedProduct = saveLocalProduct({
          ...productPayload,
          id: editingProduct?.id
        }) as AdminProduct
      }

      // Optimistic update state: cập nhật trực tiếp mà không kéo lại toàn bộ DB
      setProducts(prev => {
        let next: AdminProduct[]
        if (editingProduct) {
          next = prev.map(p => p.id === editingProduct.id ? { ...p, ...savedProduct } : p)
        } else {
          next = [savedProduct, ...prev]
        }
        saveLocalProducts(next as any)
        onProductsLoaded?.(next)
        return next
      })

      setIsModalOpen(false)
      alert(editingProduct ? 'Đã cập nhật sản phẩm thành công!' : 'Đã thêm sản phẩm mới thành công!')
    } catch (err: any) {
      alert(`Lỗi khi lưu sản phẩm: ${err.message || 'Vui lòng thử lại'}`)
    } finally {
      setIsSavingProduct(false)
    }
  }

  // Đổi trạng thái Ẩn / Hiện sản phẩm tức thì (Optimistic)
  const toggleProductStatus = async (product: AdminProduct) => {
    const newStatus: 'active' | 'inactive' = (product.status || 'active') === 'active' ? 'inactive' : 'active'
    setTogglingProductId(product.id)

    // Cập nhật UI ngay lập tức
    setProducts(prev => {
      const next = prev.map(p => p.id === product.id ? { ...p, status: newStatus } : p)
      saveLocalProducts(next as any)
      onProductsLoaded?.(next)
      return next
    })

    try {
      if (!isDemoMode) {
        const { error, data } = await supabaseAdmin
          .from('products')
          .update({ status: newStatus })
          .eq('id', product.id)
          .select('id')

        if (error) {
          console.error('Lỗi Supabase khi cập nhật trạng thái:', error)
          alert(`Không thể lưu trạng thái vào Database: ${error.message}`)
        } else if (!data || data.length === 0) {
          // Trường hợp ID chưa có trên Database (ví dụ từ seed data), tự động upsert bản ghi vào DB
          await supabaseAdmin.from('products').upsert({
            ...product,
            status: newStatus
          }, { onConflict: 'id' })
        }
      } else {
        toggleProductStatusLocal(product.id, newStatus)
      }
    } catch (err: any) {
      console.warn('Lỗi cập nhật trạng thái:', err)
      alert(`Lỗi: ${err.message || 'Không thể cập nhật'}`)
    } finally {
      setTogglingProductId(null)
    }
  }

  // Xóa sản phẩm
  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này? Thao tác không thể hoàn tác.')) return

    // Xóa ngay lập tức trên UI
    setProducts(prev => {
      const next = prev.filter(p => p.id !== id)
      saveLocalProducts(next as any)
      onProductsLoaded?.(next)
      return next
    })

    try {
      if (!isDemoMode) {
        const { error } = await supabaseAdmin.from('products').delete().eq('id', id)
        if (error) {
          console.error('Lỗi khi xóa khỏi Database:', error)
          alert(`Không thể xóa khỏi Database: ${error.message}`)
        }
      } else {
        deleteLocalProduct(id)
      }
    } catch (err) {
      console.error('Lỗi khi xóa sản phẩm:', err)
    }
  }

  // Lọc và sắp xếp sản phẩm (dùng useMemo để không tính lại khi gõ state khác)
  const filteredAndSortedProducts = useMemo(() => {
    return products
      .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(p => {
        if (statusFilter === 'all') return true
        const isActive = (p.status || 'active') === 'active'
        return statusFilter === 'active' ? isActive : !isActive
      })
      .sort((a, b) => {
        if (sortBy === 'views_desc') return (b.views_count || 0) - (a.views_count || 0)
        if (sortBy === 'price_desc') return b.price - a.price
        if (sortBy === 'price_asc') return a.price - b.price
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
        return dateB - dateA
      })
  }, [products, searchTerm, statusFilter, sortBy])

  // Phân trang
  const totalPages = Math.ceil(filteredAndSortedProducts.length / ITEMS_PER_PAGE) || 1
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredAndSortedProducts.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredAndSortedProducts, currentPage])

  // Reset về page 1 nếu filter thay đổi
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter, sortBy])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Tìm kiếm & Sắp xếp */}
        <div className="flex flex-wrap items-center gap-3 flex-grow">
          <div className="relative max-w-xs w-full">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-8 pr-4 py-2.5 bg-white border border-stone-200 focus:border-stone-900 rounded-sm focus:outline-hidden"
            />
            <Search size={14} className="absolute left-2.5 top-3.5 text-stone-400" />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <ArrowUpDown size={14} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-stone-200 text-stone-800 rounded-sm px-2.5 py-2 text-xs focus:outline-hidden cursor-pointer"
            >
              <option value="views_desc">🔥 Xem nhiều nhất (Hot)</option>
              <option value="newest">✨ Mới nhất</option>
              <option value="price_desc">💎 Giá: Cao đến Thấp</option>
              <option value="price_asc">💵 Giá: Thấp đến Cao</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-white border border-stone-200 text-stone-800 rounded-sm px-2.5 py-2 text-xs focus:outline-hidden cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">🟢 Đang bán ({products.filter(p => (p.status || 'active') === 'active').length})</option>
              <option value="inactive">🔴 Đã ẩn ({products.filter(p => (p.status || 'active') === 'inactive').length})</option>
            </select>
          </div>
        </div>

        {/* Các nút hành động */}
        <div className="flex items-center gap-2">
          {isDemoMode && (
            <button
              onClick={handleResetSeed}
              className="flex items-center gap-1.5 px-3 py-2.5 border border-stone-300 hover:bg-stone-100 text-stone-700 rounded-sm text-xs font-semibold tracking-wider transition-colors cursor-pointer"
              title="Khôi phục lại toàn bộ sản phẩm mẫu mặc định"
            >
              <RotateCcw size={13} />
              Reset Seed Data
            </button>
          )}

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-stone-950 hover:bg-stone-850 text-stone-50 rounded-sm text-xs font-bold tracking-wider uppercase transition-colors duration-200 cursor-pointer w-fit"
          >
            <Plus size={14} />
            Thêm sản phẩm
          </button>
        </div>
      </div>

      {loadingProducts ? (
        <div className="py-20 flex flex-col items-center justify-center text-stone-400 text-sm gap-2">
          <Loader2 className="animate-spin text-stone-800" size={24} />
          Đang tải danh sách sản phẩm...
        </div>
      ) : filteredAndSortedProducts.length === 0 ? (
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
                  <th className="px-6 py-4 w-32">Giá bán</th>
                  <th className="px-6 py-4 w-32 text-center">Lượt xem 👁️</th>
                  <th className="px-6 py-4 w-32">Trạng thái</th>
                  <th className="px-6 py-4 w-28 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {paginatedProducts.map((p) => {
                  const isActive = (p.status || 'active') === 'active'
                  const isToggling = togglingProductId === p.id
                  return (
                    <tr key={p.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-6 py-3">
                        <img 
                          src={p.image_url} 
                          alt={p.name} 
                          className="w-10 h-12 object-cover rounded-sm border border-stone-200 bg-stone-100"
                          loading="lazy"
                        />
                      </td>
                      <td className="px-6 py-3 font-semibold text-stone-900">
                        {p.name}
                      </td>
                      <td className="px-6 py-3 text-stone-800 font-semibold">{p.price.toLocaleString('vi-VN')}đ</td>
                      <td className="px-6 py-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-100 text-stone-800 rounded-full font-bold text-[11px]">
                          <Eye size={12} className="text-stone-500" />
                          {(p.views_count || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => toggleProductStatus(p)}
                          disabled={isToggling}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold text-[10px] tracking-wider uppercase cursor-pointer transition-all ${
                            isToggling ? 'opacity-60 cursor-wait' : ''
                          } ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-200/70 hover:bg-rose-100'
                          }`}
                          title={isActive ? 'Nhấn để ẩn sản phẩm khỏi cửa hàng' : 'Nhấn để hiển thị lại sản phẩm'}
                        >
                          {isToggling ? (
                            <>
                              <Loader2 size={11} className="animate-spin" /> Đang đổi...
                            </>
                          ) : isActive ? (
                            <>
                              <Eye size={11} /> Đang bán
                            </>
                          ) : (
                            <>
                              <EyeOff size={11} /> Đã ẩn
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
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-600">
              <span>
                Hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedProducts.length)} trên tổng số {filteredAndSortedProducts.length} sản phẩm
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="p-1.5 border border-stone-200 rounded bg-white hover:bg-stone-100 disabled:opacity-40 cursor-pointer"
                  title="Trang trước"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="px-2 font-medium">Trang {currentPage} / {totalPages}</span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="p-1.5 border border-stone-200 rounded bg-white hover:bg-stone-100 disabled:opacity-40 cursor-pointer"
                  title="Trang tiếp"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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
            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
                  Tên hoặc Mã hoa
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Bó hoa hồng lụa Rosy Premium"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 bg-stone-50 border border-stone-200 focus:border-stone-900 rounded-sm focus:outline-hidden transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
                    Giá bán (VND)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: 380000 hoặc 380k"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    className="w-full text-sm px-4 py-2.5 bg-stone-50 border border-stone-200 focus:border-stone-900 rounded-sm focus:outline-hidden transition-all"
                  />
                  {prodPrice ? (
                    <span className="text-[10px] text-stone-500 mt-1 block font-medium">
                      = {parsePriceInput(prodPrice).toLocaleString('vi-VN')}đ
                    </span>
                  ) : null}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
                    Phân loại hoa
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Hoa hồng, Tulip, Hoa cưới..."
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full text-sm px-4 py-2.5 bg-stone-50 border border-stone-200 focus:border-stone-900 rounded-sm focus:outline-hidden transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
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

                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
                    Lượt xem ban đầu
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={prodViews}
                    onChange={(e) => setProdViews(e.target.value)}
                    className="w-full text-sm px-4 py-2.5 bg-stone-50 border border-stone-200 focus:border-stone-900 rounded-sm focus:outline-hidden transition-all"
                  />
                </div>
              </div>

              {/* Upload ảnh */}
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
                  Hình ảnh hoa (Tỉ lệ khuyến nghị 3:4 hoặc 1:1)
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-stone-200 hover:border-stone-400 bg-stone-50 hover:bg-stone-100/50 rounded-md p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group min-h-[140px]"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    onClick={(e) => {
                      e.stopPropagation()
                      ;(e.target as HTMLInputElement).value = ''
                    }}
                    accept="image/*"
                    className="hidden"
                  />
                  {imagePreview ? (
                    <div className="relative w-24 h-32 border border-stone-200 rounded-sm overflow-hidden bg-white shadow-xs">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-stone-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Upload size={16} className="text-white" />
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload size={22} className="text-stone-400 group-hover:text-stone-600 transition-colors" />
                      <div className="text-stone-600 text-xs font-medium">Bấm để tải ảnh lên</div>
                      <div className="text-[10px] text-stone-400">JPG, PNG, WEBP</div>
                    </>
                  )}
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex justify-end gap-3 border-t border-stone-100 pt-4 mt-5">
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
                      Đang lưu...
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
