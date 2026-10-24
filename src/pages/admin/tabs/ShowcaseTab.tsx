import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Plus, Edit, Trash2, Upload, X, Loader2, Save, Images, Pin, PinOff } from 'lucide-react'
import { supabase, supabaseAdmin, uploadStorageImage } from '../../../lib/supabaseClient'
import { isDemoMode, getLocalShowcases, saveLocalShowcase, togglePinShowcase, deleteLocalShowcase, type ShopShowcase } from '../../../lib/demoData'
import { compressImage, validateImageFile } from '../../../lib/imageUtils'

interface ShowcaseTabProps {
  onShowcaseCountChange?: (count: number) => void
}

export const ShowcaseTab: React.FC<ShowcaseTabProps> = ({ onShowcaseCountChange }) => {
  const [showcases, setShowcases] = useState<ShopShowcase[]>([])
  const [loadingShowcases, setLoadingShowcases] = useState(false)
  const [isShowcaseModalOpen, setIsShowcaseModalOpen] = useState(false)
  const [editingShowcase, setEditingShowcase] = useState<ShopShowcase | null>(null)
  const [scTitle, setScTitle] = useState('')
  const [scIsPinned, setScIsPinned] = useState(false)
  const [scImagePreview, setScImagePreview] = useState<string | null>(null)
  const [scSelectedFile, setScSelectedFile] = useState<File | null>(null)
  const [isSavingShowcase, setIsSavingShowcase] = useState(false)
  const [pinningShowcaseId, setPinningShowcaseId] = useState<string | null>(null)
  const scFileInputRef = useRef<HTMLInputElement>(null)

  // Tính số cột hiển thị dạng Masonry
  const getColCount = () => {
    if (typeof window === 'undefined') return 4
    const w = window.innerWidth
    if (w < 640) return 1
    if (w < 768) return 2
    if (w < 1024) return 3
    return 4
  }

  const [colCount, setColCount] = useState(getColCount)

  useEffect(() => {
    const handleResize = () => setColCount(getColCount())
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    fetchShowcases()
  }, [])

  const fetchShowcases = async () => {
    setLoadingShowcases(true)
    try {
      if (isDemoMode) {
        const local = getLocalShowcases()
        setShowcases(local)
        onShowcaseCountChange?.(local.length)
      } else {
        const { data, error } = await supabase
          .from('shop_showcase')
          .select('*')
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false })
        if (error) throw error
        if (data) {
          const list = data as ShopShowcase[]
          setShowcases(list)
          onShowcaseCountChange?.(list.length)
        }
      }
    } catch {
      const local = getLocalShowcases()
      setShowcases(local)
      onShowcaseCountChange?.(local.length)
    } finally {
      setLoadingShowcases(false)
    }
  }

  const showcaseColumns = useMemo(() => {
    const cols: ShopShowcase[][] = Array.from({ length: colCount }, () => [])
    showcases.forEach((item, index) => {
      cols[index % colCount].push(item)
    })
    return cols
  }, [showcases, colCount])

  const handleOpenShowcaseModal = (item?: ShopShowcase) => {
    if (item) {
      setEditingShowcase(item)
      setScTitle(item.title)
      setScIsPinned(item.is_pinned || false)
      setScImagePreview(item.image_url)
      setScSelectedFile(null)
    } else {
      setEditingShowcase(null)
      setScTitle('')
      setScIsPinned(false)
      setScImagePreview(null)
      setScSelectedFile(null)
    }
    setIsShowcaseModalOpen(true)
  }

  const handleShowcaseImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const validation = validateImageFile(file)
      if (!validation.valid) {
        alert(validation.error)
        e.target.value = ''
        return
      }
      setScSelectedFile(file)
      try {
        const compressed = await compressImage(file, 1400, 1400, 0.8)
        setScImagePreview(compressed)
      } catch {
        const reader = new FileReader()
        reader.onloadend = () => setScImagePreview(reader.result as string)
        reader.readAsDataURL(file)
      }
    }
  }

  const handleSaveShowcase = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scImagePreview) {
      alert('Vui lòng chọn ảnh hoa thực tế.')
      return
    }

    setIsSavingShowcase(true)
    try {
      let finalImageUrl = scImagePreview

      if (scSelectedFile && !isDemoMode) {
        const upUrl = await uploadStorageImage(scSelectedFile, 'showcase')
        if (upUrl) {
          finalImageUrl = upUrl
        } else {
          finalImageUrl = await compressImage(scSelectedFile, 1200, 1200, 0.8)
        }
      }

      const showcasePayload = {
        title: scTitle.trim(),
        customer_name: '',
        review_text: '',
        rating: 5,
        is_pinned: scIsPinned,
        image_url: finalImageUrl
      }

      let savedItem: ShopShowcase

      if (!isDemoMode) {
        try {
          if (editingShowcase) {
            const { data } = await supabaseAdmin
              .from('shop_showcase')
              .update(showcasePayload)
              .eq('id', editingShowcase.id)
              .select()
            savedItem = (data && data[0]) ? (data[0] as ShopShowcase) : { ...editingShowcase, ...showcasePayload }
          } else {
            const { data } = await supabaseAdmin
              .from('shop_showcase')
              .insert([showcasePayload])
              .select()
            savedItem = (data && data[0]) ? (data[0] as ShopShowcase) : {
              ...showcasePayload,
              id: `sc-${Date.now()}`,
              created_at: new Date().toISOString()
            }
          }
        } catch {
          savedItem = {
            ...showcasePayload,
            id: editingShowcase?.id || `sc-${Date.now()}`,
            created_at: editingShowcase?.created_at || new Date().toISOString()
          }
        }
      } else {
        savedItem = saveLocalShowcase({
          ...showcasePayload,
          id: editingShowcase?.id
        })
      }

      // Optimistic update
      setShowcases(prev => {
        let next: ShopShowcase[]
        if (editingShowcase) {
          next = prev.map(s => s.id === editingShowcase.id ? { ...s, ...savedItem } : s)
        } else {
          next = [savedItem, ...prev]
        }
        onShowcaseCountChange?.(next.length)
        return next
      })

      setIsShowcaseModalOpen(false)
      alert(editingShowcase ? 'Đã cập nhật ảnh hoa thực tế thành công!' : 'Đã đăng ảnh hoa thực tế thành công!')
    } catch (err: any) {
      alert(`Lỗi khi lưu ảnh & review: ${err.message || 'Vui lòng thử lại'}`)
    } finally {
      setIsSavingShowcase(false)
    }
  }

  const handleTogglePinShowcase = async (id: string, currentPinStatus?: boolean) => {
    setPinningShowcaseId(id)

    // Optimistic UI update
    setShowcases(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, is_pinned: !currentPinStatus } : s)
      return updated.sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0))
    })

    try {
      if (!isDemoMode) {
        await supabaseAdmin
          .from('shop_showcase')
          .update({ is_pinned: !currentPinStatus })
          .eq('id', id)
      } else {
        togglePinShowcase(id)
      }
    } catch (err) {
      console.warn('Lỗi ghim showcase:', err)
    } finally {
      setPinningShowcaseId(null)
    }
  }

  const handleDeleteShowcase = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa ảnh hoa / review này?')) return

    // Optimistic UI update
    setShowcases(prev => {
      const next = prev.filter(sc => sc.id !== id)
      onShowcaseCountChange?.(next.length)
      return next
    })

    try {
      if (!isDemoMode) {
        await supabaseAdmin.from('shop_showcase').delete().eq('id', id)
      } else {
        deleteLocalShowcase(id)
      }
      alert('Đã xóa ảnh hoa thực tế thành công!')
    } catch (err) {
      console.error('Lỗi xóa showcase:', err)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-medium font-serif tracking-wide text-stone-950">
            Quản lý Ảnh hoa thực tế
          </h2>
          <p className="text-xs text-stone-400">
            Các hình ảnh này hiển thị trực tiếp cho khách xem trên trang <a href="/showcase" target="_blank" className="font-semibold text-rose-700 underline">Ảnh thực tế</a> theo kích thước thật kèm mô tả nhỏ phía trên.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={fetchShowcases}
            className="text-stone-500 hover:text-stone-950 text-xs font-semibold uppercase tracking-wider cursor-pointer"
          >
            Tải lại
          </button>
          <button
            onClick={() => handleOpenShowcaseModal()}
            className="flex items-center gap-1.5 px-4 py-2 bg-stone-950 hover:bg-stone-850 text-stone-50 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
          >
            <Plus size={14} /> Thêm ảnh mới
          </button>
        </div>
      </div>

      {loadingShowcases ? (
        <div className="py-20 flex flex-col items-center justify-center text-stone-400 text-sm gap-2">
          <Loader2 className="animate-spin text-stone-850" size={24} />
          Đang tải danh sách ảnh...
        </div>
      ) : showcases.length === 0 ? (
        <div className="text-center py-20 bg-white border border-stone-200 rounded-sm p-6">
          <Images size={32} className="mx-auto text-stone-300 mb-2" />
          <p className="text-stone-400 text-sm font-serif italic mb-4">
            Chưa có ảnh hoa thực tế nào được tải lên.
          </p>
          <button
            onClick={() => handleOpenShowcaseModal()}
            className="px-4 py-2 bg-stone-950 text-stone-50 rounded-sm text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            Thêm ảnh đầu tiên
          </button>
        </div>
      ) : (
        <div className="flex gap-4 sm:gap-6 items-start">
          {showcaseColumns.map((col, colIdx) => (
            <div key={colIdx} className="flex-1 flex flex-col gap-6 min-w-0">
              {col.map((sc) => (
                <div key={sc.id} className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs p-3.5 flex flex-col w-full">
                  <div className="mb-2">
                    <p className="font-medium text-xs text-stone-850 leading-snug">
                      {sc.title || '(Chưa có mô tả)'}
                    </p>
                  </div>

                  <div className="relative bg-stone-100 rounded-lg overflow-hidden border border-stone-100">
                    <img 
                      src={sc.image_url} 
                      alt={sc.title} 
                      className="w-full h-auto block object-contain mx-auto" 
                      loading="lazy"
                    />
                    {sc.is_pinned && (
                      <span className="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                        <Pin size={10} /> Ghim đầu
                      </span>
                    )}
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between mt-3 text-xs">
                    <button
                      disabled={pinningShowcaseId === sc.id}
                      onClick={() => handleTogglePinShowcase(sc.id, sc.is_pinned)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium cursor-pointer transition-colors disabled:opacity-60 ${
                        sc.is_pinned
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {pinningShowcaseId === sc.id ? (
                        <Loader2 size={12} className="animate-spin text-stone-600" />
                      ) : sc.is_pinned ? (
                        <PinOff size={12} />
                      ) : (
                        <Pin size={12} />
                      )}
                      {sc.is_pinned ? 'Bỏ ghim' : 'Ghim'}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenShowcaseModal(sc)}
                        className="p-1.5 text-stone-500 hover:text-stone-900 rounded cursor-pointer"
                        title="Sửa ảnh / mô tả"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteShowcase(sc.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 rounded cursor-pointer"
                        title="Xóa ảnh"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* MODAL THÊM / SỬA ẢNH HOA THỰC TẾ */}
      {isShowcaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-md w-full max-w-lg shadow-xl overflow-hidden animate-slide-up max-h-[90vh] flex flex-col">
            <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between">
              <h3 className="text-base font-medium font-serif tracking-wide text-stone-950">
                {editingShowcase ? 'Chỉnh sửa ảnh hoa thực tế' : 'Thêm ảnh hoa thực tế mới'}
              </h3>
              <button 
                onClick={() => setIsShowcaseModalOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveShowcase} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
                  Ảnh hoa thực tế <span className="text-rose-600">*</span>
                </label>
                <div 
                  onClick={() => scFileInputRef.current?.click()}
                  className="border-2 border-dashed border-stone-200 hover:border-stone-400 rounded-md p-4 text-center cursor-pointer transition-colors bg-stone-50"
                >
                  {scImagePreview ? (
                    <div className="relative max-h-60 mx-auto overflow-hidden rounded">
                      <img src={scImagePreview} alt="Preview" className="w-full h-auto max-h-60 object-contain mx-auto" />
                      <span className="absolute bottom-2 right-2 bg-stone-900/80 text-white text-[10px] px-2 py-0.5 rounded">
                        Bấm để chọn ảnh khác
                      </span>
                    </div>
                  ) : (
                    <div className="py-6 flex flex-col items-center text-stone-400">
                      <Upload size={24} className="mb-2" />
                      <p className="text-xs font-medium text-stone-600">Bấm để tải ảnh từ máy tính</p>
                      <p className="text-[10px] text-stone-400">JPG, PNG, WEBP (giữ nguyên kích thước gốc)</p>
                    </div>
                  )}
                  <input 
                    ref={scFileInputRef}
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleShowcaseImageChange}
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
                  value={scImagePreview && !scImagePreview.startsWith('data:') ? scImagePreview : ''}
                  onChange={(e) => {
                    setScImagePreview(e.target.value)
                    setScSelectedFile(null)
                  }}
                  className="w-full text-sm px-4 py-2.5 bg-stone-50 border border-stone-200 focus:border-stone-900 rounded-sm focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
                  Đoạn mô tả nhỏ ở phía trên ảnh <span className="text-stone-400 font-normal lowercase">(không bắt buộc)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Bó hoa hồng lụa Rosy Ohara sang trọng (hoặc để trống)"
                  value={scTitle}
                  onChange={(e) => setScTitle(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 bg-stone-50 border border-stone-200 focus:border-stone-900 rounded-sm focus:outline-hidden"
                />
                <p className="text-[10px] text-stone-400 mt-1">
                  Nếu có, đoạn mô tả này sẽ hiển thị ngay phía trên bức ảnh khi khách xem.
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={scIsPinned}
                  onChange={(e) => setScIsPinned(e.target.checked)}
                  className="rounded text-stone-900 focus:ring-0"
                />
                <span className="text-xs font-semibold text-stone-700">Ghim ảnh này lên vị trí đầu trang</span>
              </label>

              <div className="flex justify-end gap-3 border-t border-stone-100 pt-4 mt-4">
                <button
                  type="button"
                  onClick={() => setIsShowcaseModalOpen(false)}
                  className="py-2.5 px-4 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-sm text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingShowcase}
                  className="flex items-center gap-1.5 py-2.5 px-5 bg-stone-950 hover:bg-stone-850 text-stone-50 rounded-sm text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
                >
                  {isSavingShowcase ? (
                    <>
                      <Loader2 size={12} className="animate-spin" /> Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save size={12} /> {editingShowcase ? 'Cập nhật' : 'Đăng ảnh'}
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
