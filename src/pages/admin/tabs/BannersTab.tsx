import React, { useState, useEffect, useRef } from 'react'
import { Plus, Edit, Trash2, Eye, EyeOff, Upload, X, Loader2, Save, Sliders } from 'lucide-react'
import { supabase, supabaseAdmin, uploadStorageImage } from '../../../lib/supabaseClient'
import type { ShopBanner } from '../types'
import { compressImage, validateImageFile } from '../../../lib/imageUtils'

interface BannersTabProps {
  onBannersCountChange?: (count: number) => void
}

export const BannersTab: React.FC<BannersTabProps> = ({ onBannersCountChange }) => {
  const [banners, setBanners] = useState<ShopBanner[]>([])
  const [loadingBanners, setLoadingBanners] = useState(false)
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<ShopBanner | null>(null)
  const [bnTitle, setBnTitle] = useState('')
  const [bnSubTitle, setBnSubTitle] = useState('')
  const [bnIsActive, setBnIsActive] = useState(true)
  const [bnImagePreview, setBnImagePreview] = useState<string | null>(null)
  const [bnSelectedFile, setBnSelectedFile] = useState<File | null>(null)
  const [isSavingBanner, setIsSavingBanner] = useState(false)
  const [isProcessingBannerImg, setIsProcessingBannerImg] = useState(false)
  const bnFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    setLoadingBanners(true)
    try {
      const { data, error } = await supabase
        .from('shop_banners')
        .select('*')
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false })
      if (error) throw error
      if (data) {
        const list = data as ShopBanner[]
        setBanners(list)
        onBannersCountChange?.(list.length)
      }
    } catch (err) {
      console.warn('Lỗi lấy danh sách banner từ Supabase:', err)
      setBanners([])
      onBannersCountChange?.(0)
    } finally {
      setLoadingBanners(false)
    }
  }

  const handleOpenBannerModal = (banner?: ShopBanner) => {
    if (banner) {
      setEditingBanner(banner)
      setBnTitle(banner.title || '')
      setBnSubTitle(banner.sub_title || '')
      setBnIsActive(banner.is_active ?? true)
      setBnImagePreview(banner.image_url)
      setBnSelectedFile(null)
    } else {
      setEditingBanner(null)
      setBnTitle('')
      setBnSubTitle('')
      setBnIsActive(true)
      setBnImagePreview(null)
      setBnSelectedFile(null)
    }
    setIsBannerModalOpen(true)
  }

  const handleBannerImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const validation = validateImageFile(file)
      if (!validation.valid) {
        alert(validation.error)
        e.target.value = ''
        return
      }
      setBnSelectedFile(file)
      setIsProcessingBannerImg(true)
      try {
        const compressed = await compressImage(file, 1600, 900, 0.85)
        setBnImagePreview(compressed)
      } catch {
        const reader = new FileReader()
        reader.onloadend = () => setBnImagePreview(reader.result as string)
        reader.readAsDataURL(file)
      } finally {
        setIsProcessingBannerImg(false)
      }
    }
  }

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bnImagePreview) {
      alert('Vui lòng chọn ảnh banner.')
      return
    }

    setIsSavingBanner(true)
    try {
      let finalImageUrl = bnImagePreview

      if (bnSelectedFile) {
        const upUrl = await uploadStorageImage(bnSelectedFile, 'banners')
        if (upUrl) {
          finalImageUrl = upUrl
        } else {
          finalImageUrl = await compressImage(bnSelectedFile, 1600, 900, 0.82)
        }
      }

      const bannerPayload = {
        title: bnTitle.trim(),
        sub_title: bnSubTitle.trim(),
        is_active: bnIsActive,
        image_url: finalImageUrl,
        order_index: editingBanner?.order_index ?? banners.length
      }

      let savedItem: ShopBanner
      if (editingBanner) {
        const { data, error } = await supabaseAdmin
          .from('shop_banners')
          .upsert({ ...bannerPayload, id: editingBanner.id }, { onConflict: 'id' })
          .select()

        if (error) {
          console.error('Lỗi Supabase khi cập nhật banner:', error)
          throw new Error(error.message)
        }

        savedItem = (data && data[0]) ? (data[0] as ShopBanner) : { ...editingBanner, ...bannerPayload }
      } else {
        const { data, error } = await supabaseAdmin
          .from('shop_banners')
          .insert([bannerPayload])
          .select()

        if (error) {
          console.error('Lỗi Supabase khi thêm mới banner:', error)
          throw new Error(error.message)
        }

        if (data && data[0]) {
          savedItem = data[0] as ShopBanner
        } else {
          throw new Error('Không nhận được dữ liệu phản hồi từ Database.')
        }
      }

      setBanners(prev => {
        let next: ShopBanner[]
        if (editingBanner) {
          next = prev.map(b => b.id === editingBanner.id ? { ...b, ...savedItem } : b)
        } else {
          next = [savedItem, ...prev]
        }
        onBannersCountChange?.(next.length)
        return next
      })

      setIsBannerModalOpen(false)
      alert(editingBanner ? 'Đã cập nhật banner thành công!' : 'Đã đăng banner thành công!')
    } catch (err: any) {
      alert(`Lỗi khi lưu banner: ${err.message || 'Vui lòng thử lại'}`)
    } finally {
      setIsSavingBanner(false)
    }
  }

  const handleToggleBannerStatus = async (id: string, currentStatus: boolean) => {
    // Optimistic UI update
    setBanners(prev => prev.map(b => b.id === id ? { ...b, is_active: !currentStatus } : b))

    try {
      const { error } = await supabaseAdmin
        .from('shop_banners')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) {
        console.error('Lỗi Supabase khi đổi trạng thái banner:', error)
        alert(`Không thể lưu trạng thái vào Database: ${error.message}`)
      }
    } catch (err: any) {
      console.warn('Lỗi đổi trạng thái banner:', err)
      alert(`Lỗi: ${err.message || 'Không thể cập nhật'}`)
    }
  }

  const handleDeleteBanner = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa banner này?')) return

    // Optimistic UI update
    setBanners(prev => {
      const next = prev.filter(b => b.id !== id)
      onBannersCountChange?.(next.length)
      return next
    })

    try {
      const { error } = await supabaseAdmin.from('shop_banners').delete().eq('id', id)
      if (error) {
        console.error('Lỗi khi xóa banner khỏi Database:', error)
        alert(`Không thể xóa khỏi Database: ${error.message}`)
      } else {
        alert('Đã xóa banner thành công!')
      }
    } catch (err) {
      console.error('Lỗi xóa banner:', err)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-medium font-serif tracking-wide text-stone-950">
            Quản lý Banner trang chủ
          </h2>
          <p className="text-xs text-stone-400">
            Các hình ảnh banner ngang (tỉ lệ 16:9 hoặc 21:9) tự động trượt chạy ở phần đầu trang chủ của shop.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={fetchBanners}
            className="text-stone-500 hover:text-stone-950 text-xs font-semibold uppercase tracking-wider cursor-pointer"
          >
            Tải lại
          </button>
          <button
            onClick={() => handleOpenBannerModal()}
            className="flex items-center gap-1.5 px-4 py-2 bg-stone-950 hover:bg-stone-850 text-stone-50 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
          >
            <Plus size={14} /> Thêm banner mới
          </button>
        </div>
      </div>

      {loadingBanners ? (
        <div className="py-20 flex flex-col items-center justify-center text-stone-400 text-sm gap-2">
          <Loader2 className="animate-spin text-stone-850" size={24} />
          Đang tải danh sách banner...
        </div>
      ) : banners.length === 0 ? (
        <div className="text-center py-20 bg-white border border-stone-200 rounded-sm p-6">
          <Sliders size={32} className="mx-auto text-stone-300 mb-2" />
          <p className="text-stone-400 text-sm font-serif italic mb-4">
            Chưa có ảnh banner trang chủ nào.
          </p>
          <button
            onClick={() => handleOpenBannerModal()}
            className="px-4 py-2 bg-stone-950 text-stone-50 rounded-sm text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            Thêm banner đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {banners.map((bn, idx) => (
            <div key={bn.id} className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs flex flex-col">
              <div className="relative aspect-[16/9] bg-stone-100 overflow-hidden group">
                <img 
                  src={bn.image_url} 
                  alt={bn.title || 'Banner'} 
                  className={`w-full h-full object-cover object-center transition-all ${!bn.is_active ? 'opacity-40 grayscale' : ''}`}
                  loading="lazy"
                />
                <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                  <span className="bg-stone-950/80 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                    #{idx + 1}
                  </span>
                  {bn.is_active ? (
                    <span className="bg-emerald-600 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow-xs flex items-center gap-1">
                      <Eye size={10} /> Đang hiển thị
                    </span>
                  ) : (
                    <span className="bg-stone-600 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded shadow-xs flex items-center gap-1">
                      <EyeOff size={10} /> Đã tạm ẩn
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 flex-grow flex flex-col justify-between">
                <div>
                  <h4 className="font-serif text-sm font-medium text-stone-900 leading-snug">
                    {bn.title || <span className="text-stone-400 italic text-xs font-sans">(Chưa đặt tiêu đề)</span>}
                  </h4>
                  {bn.sub_title && (
                    <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                      {bn.sub_title}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between mt-3 text-xs">
                  <button
                    onClick={() => handleToggleBannerStatus(bn.id, bn.is_active)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium cursor-pointer transition-colors ${
                      bn.is_active
                        ? 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    {bn.is_active ? <EyeOff size={12} /> : <Eye size={12} />}
                    {bn.is_active ? 'Tạm ẩn' : 'Bật hiển thị'}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenBannerModal(bn)}
                      className="p-1.5 text-stone-500 hover:text-stone-900 rounded cursor-pointer"
                      title="Sửa banner"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteBanner(bn.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded cursor-pointer"
                      title="Xóa banner"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL THÊM / SỬA BANNER TRANG CHỦ */}
      {isBannerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-md w-full max-w-lg shadow-xl overflow-hidden animate-slide-up max-h-[90vh] flex flex-col">
            <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between">
              <h3 className="text-base font-medium font-serif tracking-wide text-stone-950">
                {editingBanner ? 'Chỉnh sửa banner trang chủ' : 'Thêm banner trang chủ mới'}
              </h3>
              <button 
                onClick={() => setIsBannerModalOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
                  Ảnh banner khổ ngang (tỉ lệ 16:9 hoặc 21:9) <span className="text-rose-600">*</span>
                </label>
                <div 
                  onClick={() => bnFileInputRef.current?.click()}
                  className="border-2 border-dashed border-stone-200 hover:border-stone-400 rounded-md p-4 text-center cursor-pointer transition-colors bg-stone-50"
                >
                  {isProcessingBannerImg ? (
                    <div className="py-8 flex flex-col items-center justify-center text-stone-500 gap-2">
                      <Loader2 size={24} className="animate-spin text-stone-700" />
                      <p className="text-xs font-medium text-stone-600">Đang tối ưu dung lượng ảnh...</p>
                    </div>
                  ) : bnImagePreview ? (
                    <div className="relative aspect-[16/9] mx-auto overflow-hidden rounded">
                      <img src={bnImagePreview} alt="Preview" className="w-full h-full object-cover object-center" />
                      <span className="absolute bottom-2 right-2 bg-stone-900/80 text-white text-[10px] px-2 py-0.5 rounded">
                        Bấm để chọn ảnh khác
                      </span>
                    </div>
                  ) : (
                    <div className="py-6 flex flex-col items-center text-stone-400">
                      <Upload size={24} className="mb-2" />
                      <p className="text-xs font-medium text-stone-600">Bấm để tải ảnh banner từ máy tính</p>
                      <p className="text-[10px] text-stone-400">Khuyến nghị ảnh khổ ngang sắc nét, độ phân giải cao</p>
                    </div>
                  )}
                  <input 
                    ref={bnFileInputRef}
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleBannerImageChange}
                    onClick={(e) => {
                      e.stopPropagation()
                      ;(e.target as HTMLInputElement).value = ''
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
                  Hoặc dán URL ảnh trực tiếp
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={bnImagePreview && !bnImagePreview.startsWith('data:') ? bnImagePreview : ''}
                  onChange={(e) => {
                    setBnImagePreview(e.target.value)
                    setBnSelectedFile(null)
                  }}
                  className="w-full text-sm px-4 py-2.5 bg-stone-50 border border-stone-200 focus:border-stone-900 rounded-sm focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
                  Tiêu đề banner <span className="text-stone-400 font-normal lowercase">(không bắt buộc)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nghệ Thuật Hoa Lụa Cao Cấp"
                  value={bnTitle}
                  onChange={(e) => setBnTitle(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 bg-stone-50 border border-stone-200 focus:border-stone-900 rounded-sm focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
                  Dòng mô tả phụ <span className="text-stone-400 font-normal lowercase">(không bắt buộc)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Tinh tế trong từng đường nét • Thiết kế theo yêu cầu"
                  value={bnSubTitle}
                  onChange={(e) => setBnSubTitle(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 bg-stone-50 border border-stone-200 focus:border-stone-900 rounded-sm focus:outline-hidden"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={bnIsActive}
                  onChange={(e) => setBnIsActive(e.target.checked)}
                  className="rounded text-stone-900 focus:ring-0"
                />
                <span className="text-xs font-semibold text-stone-700">Kích hoạt hiển thị ngay trên trang chủ</span>
              </label>

              <div className="flex justify-end gap-3 border-t border-stone-100 pt-4 mt-4">
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  className="py-2.5 px-4 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-sm text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingBanner || isProcessingBannerImg}
                  className="flex items-center gap-1.5 py-2.5 px-5 bg-stone-950 hover:bg-stone-850 text-stone-50 rounded-sm text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
                >
                  {isSavingBanner ? (
                    <>
                      <Loader2 size={12} className="animate-spin" /> Đang lưu...
                    </>
                  ) : isProcessingBannerImg ? (
                    <>
                      <Loader2 size={12} className="animate-spin" /> Đang xử lý ảnh...
                    </>
                  ) : (
                    <>
                      <Save size={12} /> {editingBanner ? 'Cập nhật' : 'Đăng banner'}
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
