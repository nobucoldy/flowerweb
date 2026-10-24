import React, { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { 
  isDemoMode, getLocalProducts, saveLocalProducts, getLocalOrders, resetToSeedData, 
  getLocalFeedbacks, toggleFeedbackReadStatus, deleteLocalFeedback,
  getLocalShowcases, saveLocalShowcase, togglePinShowcase, deleteLocalShowcase,
  getLocalBanners, saveLocalBanner, toggleBannerActiveStatus, deleteLocalBanner,
  type TimeFilter, type AnonymousFeedback, type ShopShowcase, type ShopBanner
} from '../lib/demoData'
import { fetchAnalyticsSummary, isWithinTimeframe, type AnalyticsSummary } from '../lib/analytics'
import { compressImage, validateImageFile } from '../lib/imageUtils'
import { useAuthStore } from '../store/useAuthStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { 
  LogOut, Plus, Edit, Trash2, Eye, EyeOff, 
  Upload, X, Loader2, Save, Search, 
  Globe, ShoppingBag, Award, RotateCcw, ArrowUpDown, 
  Sparkles, Calendar, DollarSign,
  Mail, Images, Star, Pin, PinOff, Sliders
} from 'lucide-react'


interface Product {
  id: string
  name: string
  price: number
  image_url: string
  status: 'active' | 'inactive'
  views_count?: number
  category?: string
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
  
  const [activeTab, setActiveTab] = useState<'products' | 'settings' | 'orders' | 'feedback' | 'showcase' | 'banners'>('products')
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<DraftOrder[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [loadingOrders, setLoadingOrders] = useState(false)

  // Trạng thái Hòm thư góp ý ẩn danh
  const [feedbacks, setFeedbacks] = useState<AnonymousFeedback[]>([])
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false)
  const [feedbackFilter, setFeedbackFilter] = useState<'all' | 'unread' | 'read'>('all')

  // Trạng thái Ảnh hoa thực tế (Showcase)
  const [showcases, setShowcases] = useState<ShopShowcase[]>([])
  const [loadingShowcases, setLoadingShowcases] = useState(false)
  const [isShowcaseModalOpen, setIsShowcaseModalOpen] = useState(false)
  const [editingShowcase, setEditingShowcase] = useState<ShopShowcase | null>(null)
  const [scTitle, setScTitle] = useState('')
  const [scIsPinned, setScIsPinned] = useState(false)
  const [scImagePreview, setScImagePreview] = useState<string | null>(null)
  const [scSelectedFile, setScSelectedFile] = useState<File | null>(null)
  const [isSavingShowcase, setIsSavingShowcase] = useState(false)
  const scFileInputRef = useRef<HTMLInputElement>(null)

  // Trạng thái Banner trang chủ (Hero Banners)
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
  
  // Trạng thái Lọc Thời Gian (Ngày / Tuần / Tháng / Tất cả)
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week')

  // Trạng thái Thống kê Analytics
  const [analytics, setAnalytics] = useState<AnalyticsSummary>({
    pageViews: 0,
    todayPageViews: 0,
    totalProductViews: 0,
    ordersCount: 0,
    totalRevenue: 0,
    topProduct: null
  })

  // Trạng thái Form Sản phẩm
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [prodName, setProdName] = useState('')
  const [prodPrice, setProdPrice] = useState('')
  const [prodCategory, setProdCategory] = useState('Hoa bó')
  const [prodStatus, setProdStatus] = useState<'active' | 'inactive'>('active')
  const [prodViews, setProdViews] = useState('0')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSavingProduct, setIsSavingProduct] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Trạng thái tìm kiếm & sắp xếp sản phẩm
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'views_desc' | 'price_desc' | 'price_asc'>('views_desc')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  // Trạng thái Form Cài đặt
  const [zaloPhone, setZaloPhone] = useState('')
  const [hotline, setHotline] = useState('')
  const [shopName, setShopName] = useState('')
  const [shopAddress, setShopAddress] = useState('')
  const [messageTemplate, setMessageTemplate] = useState('')
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [settingsSuccess, setSettingsSuccess] = useState(false)

  useEffect(() => {
    fetchSettings()
    fetchProducts()
    fetchOrders()
    fetchFeedbacks()
    fetchShowcases()
    fetchBanners()
  }, [fetchSettings])

  // Đồng bộ form cài đặt khi settings từ store thay đổi
  useEffect(() => {
    const rawZalo = settings.zalo_phone
    const finalZalo = (!rawZalo || rawZalo === '0900000000') ? '0363645261' : rawZalo
    const rawHotline = settings.hotline
    const finalHotline = (!rawHotline || rawHotline === '0900000000') ? '0363645261' : rawHotline

    setZaloPhone(finalZalo)
    setHotline(finalHotline)
    setShopAddress(
      settings.shop_address && !settings.shop_address.includes('Doãn Kế Thiện') && settings.shop_address !== 'Địa chỉ shop'
        ? settings.shop_address 
        : 'Đình So, Hưng Đạo, Hà Nội'
    )
    setMessageTemplate(settings.message_template || '')
  }, [settings])

  // Cập nhật thống kê khi danh sách sản phẩm, đơn hàng hoặc mốc thời gian thay đổi
  useEffect(() => {
    if (products.length > 0) {
      fetchAnalyticsSummary(products, orders, timeFilter).then(setAnalytics)
    }
  }, [products, orders, timeFilter])

  // Xác định số cột cho Showcase trong Admin
  const getShowcaseColCount = () => {
    if (typeof window === 'undefined') return 4
    const w = window.innerWidth
    if (w < 640) return 1
    if (w < 768) return 2
    if (w < 1024) return 3
    return 4 // Máy tính >= 1024px luôn là 4 cột
  }

  const [showcaseColCount, setShowcaseColCount] = useState(getShowcaseColCount)

  useEffect(() => {
    const handleResize = () => setShowcaseColCount(getShowcaseColCount())
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const showcaseColumns = useMemo(() => {
    const cols: ShopShowcase[][] = Array.from({ length: showcaseColCount }, () => [])
    showcases.forEach((item, index) => {
      cols[index % showcaseColCount].push(item)
    })
    return cols
  }, [showcases, showcaseColCount])

  const fetchProducts = async () => {
    setLoadingProducts(true)
    try {
      if (isDemoMode) {
        await new Promise(r => setTimeout(r, 200))
        const local = getLocalProducts() as Product[]
        setProducts(local)
      } else {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false })
        if (error) throw error
        if (data) setProducts(data as Product[])
      }
    } catch {
      console.error('Lỗi khi tải sản phẩm')
    } finally {
      setLoadingProducts(false)
    }
  }

  const fetchOrders = async () => {
    setLoadingOrders(true)
    try {
      if (isDemoMode) {
        await new Promise(r => setTimeout(r, 200))
        setOrders(getLocalOrders())
      } else {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
        if (error) throw error
        if (data) setOrders(data as DraftOrder[])
      }
    } catch {
      console.error('Lỗi khi tải đơn hàng nháp')
    } finally {
      setLoadingOrders(false)
    }
  }

  // ==========================================
  // HÀNH ĐỘNG: HÒM THƯ GÓP Ý ẨN DANH
  // ==========================================
  const fetchFeedbacks = async () => {
    setLoadingFeedbacks(true)
    try {
      if (isDemoMode) {
        setFeedbacks(getLocalFeedbacks())
      } else {
        const { data, error } = await supabase
          .from('anonymous_feedback')
          .select('*')
          .order('created_at', { ascending: false })
        if (error) throw error
        if (data) setFeedbacks(data as AnonymousFeedback[])
      }
    } catch (err) {
      console.error('Lỗi tải hòm thư góp ý:', err)
      setFeedbacks(getLocalFeedbacks())
    } finally {
      setLoadingFeedbacks(false)
    }
  }

  const handleToggleFeedbackRead = async (id: string, currentStatus: boolean) => {
    try {
      if (isDemoMode) {
        const updated = toggleFeedbackReadStatus(id)
        setFeedbacks(updated)
      } else {
        const { error } = await supabase
          .from('anonymous_feedback')
          .update({ is_read: !currentStatus })
          .eq('id', id)
        if (error) throw error
        setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, is_read: !currentStatus } : f))
      }
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái đọc:', err)
    }
  }

  const handleDeleteFeedback = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tin nhắn góp ý này?')) return
    try {
      if (isDemoMode) {
        const updated = deleteLocalFeedback(id)
        setFeedbacks(updated)
      } else {
        const { error } = await supabase
          .from('anonymous_feedback')
          .delete()
          .eq('id', id)
        if (error) throw error
        setFeedbacks(prev => prev.filter(f => f.id !== id))
      }
    } catch (err) {
      console.error('Lỗi xóa feedback:', err)
    }
  }

  // ==========================================
  // HÀNH ĐỘNG: ẢNH THẬT & REVIEW (SHOWCASE)
  // ==========================================
  const fetchShowcases = async () => {
    setLoadingShowcases(true)
    try {
      if (isDemoMode) {
        setShowcases(getLocalShowcases())
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
      console.error('Lỗi tải ảnh thật showcase:', err)
      setShowcases(getLocalShowcases())
    } finally {
      setLoadingShowcases(false)
    }
  }

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
        reader.onloadend = () => {
          setScImagePreview(reader.result as string)
        }
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

      // Nếu có chọn file mới và Supabase đang hoạt động, upload lên Storage
      if (scSelectedFile && !isDemoMode) {
        const fileExt = scSelectedFile.name.split('.').pop()
        const fileName = `showcase-${Date.now()}.${fileExt}`
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('products')
          .upload(`showcase/${fileName}`, scSelectedFile)
        if (!uploadErr && uploadData) {
          const { data: urlData } = supabase.storage
            .from('products')
            .getPublicUrl(`showcase/${fileName}`)
          if (urlData?.publicUrl) finalImageUrl = urlData.publicUrl
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

      if (isDemoMode) {
        saveLocalShowcase({
          ...showcasePayload,
          id: editingShowcase?.id
        })
        setShowcases(getLocalShowcases())
      } else {
        if (editingShowcase) {
          const { error } = await supabase
            .from('shop_showcase')
            .update(showcasePayload)
            .eq('id', editingShowcase.id)
          if (error) throw error
        } else {
          const { error } = await supabase
            .from('shop_showcase')
            .insert([showcasePayload])
          if (error) throw error
        }
        await fetchShowcases()
      }

      setIsShowcaseModalOpen(false)
    } catch (err) {
      console.error('Lỗi lưu showcase:', err)
      alert('Có lỗi khi lưu ảnh & review. Vui lòng thử lại.')
    } finally {
      setIsSavingShowcase(false)
    }
  }

  const handleDeleteShowcase = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa ảnh hoa / review này?')) return
    try {
      if (isDemoMode) {
        const updated = deleteLocalShowcase(id)
        setShowcases(updated)
      } else {
        const { error } = await supabase
          .from('shop_showcase')
          .delete()
          .eq('id', id)
        if (error) throw error
        setShowcases(prev => prev.filter(sc => sc.id !== id))
      }
    } catch (err) {
      console.error('Lỗi xóa showcase:', err)
    }
  }

  const handleTogglePinShowcase = async (id: string, currentPin?: boolean) => {
    try {
      if (isDemoMode) {
        const updated = togglePinShowcase(id)
        setShowcases(updated)
      } else {
        const { error } = await supabase
          .from('shop_showcase')
          .update({ is_pinned: !currentPin })
          .eq('id', id)
        if (error) throw error
        setShowcases(prev => prev.map(sc => sc.id === id ? { ...sc, is_pinned: !currentPin } : sc))
      }
    } catch (err) {
      console.error('Lỗi toggle ghim showcase:', err)
    }
  }

  // ==========================================
  // HÀNH ĐỘNG: BANNER TRANG CHỦ (HERO BANNERS)
  // ==========================================
  const fetchBanners = async () => {
    setLoadingBanners(true)
    try {
      if (isDemoMode) {
        setBanners(getLocalBanners())
      } else {
        const { data, error } = await supabase
          .from('shop_banners')
          .select('*')
          .order('order_index', { ascending: true })
          .order('created_at', { ascending: false })
        if (error) throw error
        if (data) setBanners(data as ShopBanner[])
      }
    } catch (err) {
      console.error('Lỗi tải danh sách banner:', err)
      setBanners(getLocalBanners())
    } finally {
      setLoadingBanners(false)
    }
  }

  const handleOpenBannerModal = (item?: ShopBanner) => {
    if (item) {
      setEditingBanner(item)
      setBnTitle(item.title || '')
      setBnSubTitle(item.sub_title || '')
      setBnIsActive(item.is_active)
      setBnImagePreview(item.image_url)
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
        const compressed = await compressImage(file, 1600, 900, 0.8)
        setBnImagePreview(compressed)
      } catch {
        const reader = new FileReader()
        reader.onloadend = () => {
          setBnImagePreview(reader.result as string)
        }
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

      if (bnSelectedFile && !isDemoMode) {
        const fileExt = bnSelectedFile.name.split('.').pop()
        const fileName = `banner-${Date.now()}.${fileExt}`
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('products')
          .upload(`banners/${fileName}`, bnSelectedFile)
        if (!uploadErr && uploadData) {
          const { data: urlData } = supabase.storage
            .from('products')
            .getPublicUrl(`banners/${fileName}`)
          if (urlData?.publicUrl) finalImageUrl = urlData.publicUrl
        }
      }

      const bannerPayload = {
        title: bnTitle.trim(),
        sub_title: bnSubTitle.trim(),
        is_active: bnIsActive,
        image_url: finalImageUrl,
        order_index: editingBanner ? editingBanner.order_index : 0,
        link_url: '/showcase'
      }

      if (isDemoMode) {
        const updated = saveLocalBanner({
          ...bannerPayload,
          id: editingBanner?.id
        })
        setBanners(updated)
        alert(editingBanner ? 'Đã cập nhật banner thành công!' : 'Đã thêm banner trang chủ thành công!')
      } else {
        if (editingBanner) {
          const { error } = await supabase
            .from('shop_banners')
            .update(bannerPayload)
            .eq('id', editingBanner.id)
          if (error) throw error
        } else {
          const { error } = await supabase
            .from('shop_banners')
            .insert(bannerPayload)
          if (error) throw error
        }
        await fetchBanners()
        alert(editingBanner ? 'Đã cập nhật banner thành công!' : 'Đã thêm banner trang chủ thành công!')
      }

      setIsBannerModalOpen(false)
    } catch (err: any) {
      alert(`Lỗi khi lưu banner: ${err.message || 'Vui lòng thử lại'}`)
    } finally {
      setIsSavingBanner(false)
    }
  }

  const handleToggleBannerStatus = async (id: string, currentStatus: boolean) => {
    try {
      if (isDemoMode) {
        const updated = toggleBannerActiveStatus(id)
        setBanners(updated)
      } else {
        const { error } = await supabase
          .from('shop_banners')
          .update({ is_active: !currentStatus })
          .eq('id', id)
        if (error) throw error
        setBanners(prev => prev.map(b => b.id === id ? { ...b, is_active: !currentStatus } : b))
      }
    } catch {
      alert('Lỗi khi thay đổi trạng thái banner.')
    }
  }

  const handleDeleteBanner = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa ảnh banner này không?')) return
    try {
      if (isDemoMode) {
        const updated = deleteLocalBanner(id)
        setBanners(updated)
      } else {
        const { error } = await supabase
          .from('shop_banners')
          .delete()
          .eq('id', id)
        if (error) throw error
        setBanners(prev => prev.filter(b => b.id !== id))
      }
    } catch {
      alert('Lỗi khi xóa banner.')
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/admin')
  }

  // Khôi phục dữ liệu mẫu (Seed)
  const handleResetSeed = () => {
    if (window.confirm('Bạn có chắc muốn khôi phục lại toàn bộ sản phẩm mẫu (Seed Data) không?')) {
      const resetProds = resetToSeedData()
      setProducts(resetProds as Product[])
      alert('Đã khôi phục dữ liệu mẫu thành công!')
    }
  }

  // Xử lý chọn file ảnh
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const validation = validateImageFile(file)
      if (!validation.valid) {
        alert(validation.error)
        e.target.value = ''
        return
      }
      setSelectedFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  // Mở modal thêm sản phẩm
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
  const handleOpenEditModal = (product: Product) => {
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

  // Upload ảnh lên Supabase Storage hoặc dùng ObjectURL demo
  const uploadImage = async (file: File): Promise<string> => {
    if (isDemoMode) {
      return URL.createObjectURL(file)
    }

    setUploadProgress(true)
    try {
      const fileExt = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
      const filePath = `products/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath)

      return publicUrl
    } finally {
      setUploadProgress(false)
    }
  }

  // Lưu sản phẩm (Thêm mới hoặc Cập nhật)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingProduct(true)

    try {
      let finalImageUrl = imagePreview || ''

      if (selectedFile) {
        finalImageUrl = await uploadImage(selectedFile)
      }

      if (!finalImageUrl) {
        finalImageUrl = 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?q=80&w=600&auto=format&fit=crop'
      }

      const viewsCountNumber = parseInt(prodViews) || 0

      if (isDemoMode) {
        if (editingProduct) {
          const updated = products.map((p) => {
            if (p.id === editingProduct.id) {
              return {
                ...p,
                name: prodName,
                price: Number(prodPrice),
                image_url: finalImageUrl,
                status: prodStatus,
                category: prodCategory,
                views_count: viewsCountNumber
              }
            }
            return p
          })
          setProducts(updated)
          saveLocalProducts(updated)
        } else {
          const newProd: Product = {
            id: `prod-${Date.now()}`,
            name: prodName,
            price: Number(prodPrice),
            image_url: finalImageUrl,
            status: prodStatus,
            category: prodCategory,
            views_count: viewsCountNumber,
            created_at: new Date().toISOString()
          }
          const updated = [newProd, ...products]
          setProducts(updated)
          saveLocalProducts(updated)
        }
      } else {
        if (editingProduct) {
          const { error } = await supabase
            .from('products')
            .update({
              name: prodName,
              price: Number(prodPrice),
              image_url: finalImageUrl,
              status: prodStatus,
              category: prodCategory,
              views_count: viewsCountNumber
            })
            .eq('id', editingProduct.id)

          if (error) throw error
        } else {
          const { error } = await supabase
            .from('products')
            .insert({
              name: prodName,
              price: Number(prodPrice),
              image_url: finalImageUrl,
              status: prodStatus,
              category: prodCategory,
              views_count: viewsCountNumber
            })

          if (error) throw error
        }
        await fetchProducts()
      }

      setIsModalOpen(false)
    } catch (err: any) {
      alert(`Lỗi khi lưu sản phẩm: ${err.message || 'Vui lòng thử lại'}`)
    } finally {
      setIsSavingProduct(false)
    }
  }

  // Xóa sản phẩm
  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) return

    try {
      if (isDemoMode) {
        const updated = products.filter(p => p.id !== productId)
        setProducts(updated)
        saveLocalProducts(updated)
      } else {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', productId)
        if (error) throw error
        setProducts(products.filter(p => p.id !== productId))
      }
    } catch {
      alert('Lỗi khi xóa sản phẩm.')
    }
  }

  // Bật/tắt trạng thái hiển thị
  const toggleProductStatus = async (product: Product) => {
    const currentStatus = (product.status || 'active') === 'active' ? 'active' : 'inactive'
    const newStatus: 'active' | 'inactive' = currentStatus === 'active' ? 'inactive' : 'active'
    try {
      if (isDemoMode) {
        const updated = products.map(p => p.id === product.id ? { ...p, status: newStatus } : p)
        setProducts(updated)
        saveLocalProducts(updated)
      } else {
        const { error } = await supabase
          .from('products')
          .update({ status: newStatus })
          .eq('id', product.id)
        if (error) throw error
        setProducts(products.map(p => p.id === product.id ? { ...p, status: newStatus } : p))
      }
    } catch {
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
      const r2 = await updateSetting('hotline', hotline)
      const r3 = await updateSetting('shop_name', shopName)
      const r4 = await updateSetting('shop_address', shopAddress)
      const r5 = await updateSetting('message_template', messageTemplate)

      if (r1 && r2 && r3 && r4 && r5) {
        setSettingsSuccess(true)
        setTimeout(() => setSettingsSuccess(false), 3000)
      } else {
        alert('Cập nhật thất bại một vài trường cấu hình.')
      }
    } catch {
      alert('Lỗi lưu cấu hình.')
    } finally {
      setIsSavingSettings(false)
    }
  }

  // Lọc và sắp xếp sản phẩm
  const filteredAndSortedProducts = products
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
      return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
    })

  // Đơn hàng được lọc theo mốc thời gian
  const filteredOrders = orders.filter((o) => isWithinTimeframe(o.created_at, timeFilter))

  // Lọc danh sách góp ý ẩn danh
  const unreadFeedbackCount = feedbacks.filter(f => !f.is_read).length
  const filteredFeedbacks = feedbacks.filter(f => {
    if (feedbackFilter === 'unread') return !f.is_read
    if (feedbackFilter === 'read') return f.is_read
    return true
  })

  // Nhãn thời gian hiển thị thân thiện
  const getTimeFilterLabel = () => {
    switch (timeFilter) {
      case 'today': return 'Hôm nay'
      case 'week': return '7 ngày qua'
      case 'month': return '30 ngày qua'
      case 'all': return 'Toàn thời gian'
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans text-stone-900">
      {/* Admin Navbar */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-serif text-xl font-medium tracking-wide text-stone-950">Que Anh Flower</span>
            <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-xs">
              Quản trị viên
            </span>
            {isDemoMode && (
              <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-medium px-2 py-0.5 rounded-xs hidden sm:inline">
                Chế độ Seed Demo
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="text-xs text-stone-500 hover:text-stone-950 transition-colors hidden sm:inline cursor-pointer"
            >
              ← Xem Cửa Hàng
            </button>
            <span className="text-xs text-stone-400 hidden md:inline">|</span>
            <span className="text-xs text-stone-500 hidden sm:inline">{user?.email || 'admin@queanhflower.com'}</span>
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
        <div className="max-w-6xl mx-auto px-6 flex gap-6 sm:gap-8 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('products')}
            className={`py-4 border-b-2 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'products' ? 'border-stone-950 text-stone-950' : 'border-transparent text-stone-400 hover:text-stone-700'
            }`}
          >
            Sản phẩm ({products.length})
          </button>
          <button 
            onClick={() => setActiveTab('banners')}
            className={`py-4 border-b-2 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'banners' ? 'border-stone-950 text-stone-950' : 'border-transparent text-stone-400 hover:text-stone-700'
            }`}
          >
            <Sliders size={14} />
            Banner trang chủ ({banners.length})
          </button>
          <button 
            onClick={() => setActiveTab('showcase')}
            className={`py-4 border-b-2 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'showcase' ? 'border-stone-950 text-stone-950' : 'border-transparent text-stone-400 hover:text-stone-700'
            }`}
          >
            <Images size={14} />
            Ảnh hoa thực tế ({showcases.length})
          </button>
          <button 
            onClick={() => setActiveTab('feedback')}
            className={`py-4 border-b-2 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'feedback' ? 'border-stone-950 text-stone-950' : 'border-transparent text-stone-400 hover:text-stone-700'
            }`}
          >
            <Mail size={14} />
            Hòm thư ẩn danh
            {unreadFeedbackCount > 0 ? (
              <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5">
                {unreadFeedbackCount} mới
              </span>
            ) : (
              <span className="text-stone-400 text-[10px]">({feedbacks.length})</span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`py-4 border-b-2 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'orders' ? 'border-stone-950 text-stone-950' : 'border-transparent text-stone-400 hover:text-stone-700'
            }`}
          >
            Lịch sử Click đơn ({orders.length})
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`py-4 border-b-2 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'settings' ? 'border-stone-950 text-stone-950' : 'border-transparent text-stone-400 hover:text-stone-700'
            }`}
          >
            Cài đặt cửa hàng
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-6 py-8">
        
        {/* 📅 BỘ LỌC THỜI GIAN: NGÀY / TUẦN / THÁNG / TẤT CẢ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-white p-3.5 rounded-md border border-stone-200 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <Calendar size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-850">Lọc số liệu theo thời gian</p>
              <p className="text-[10px] text-stone-400">Đang hiển thị thống kê: <span className="font-semibold text-rose-600">{getTimeFilterLabel()}</span></p>
            </div>
          </div>

          <div className="inline-flex rounded-md p-1 bg-stone-100 text-xs self-start sm:self-auto border border-stone-200/50">
            <button
              onClick={() => setTimeFilter('today')}
              className={`px-3 py-1.5 rounded-sm font-medium transition-all cursor-pointer ${
                timeFilter === 'today'
                  ? 'bg-white text-stone-950 font-bold shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Hôm nay
            </button>
            <button
              onClick={() => setTimeFilter('week')}
              className={`px-3 py-1.5 rounded-sm font-medium transition-all cursor-pointer ${
                timeFilter === 'week'
                  ? 'bg-white text-stone-950 font-bold shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              7 ngày qua (Tuần)
            </button>
            <button
              onClick={() => setTimeFilter('month')}
              className={`px-3 py-1.5 rounded-sm font-medium transition-all cursor-pointer ${
                timeFilter === 'month'
                  ? 'bg-white text-stone-950 font-bold shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              30 ngày qua (Tháng)
            </button>
            <button
              onClick={() => setTimeFilter('all')}
              className={`px-3 py-1.5 rounded-sm font-medium transition-all cursor-pointer ${
                timeFilter === 'all'
                  ? 'bg-white text-stone-950 font-bold shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Tất cả
            </button>
          </div>
        </div>

        {/* 📊 KHỐI THỐNG KÊ LƯỢT XEM VÀ CHỈ SỐ HOẠT ĐỘNG */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card 1: Lượt truy cập web */}
          <div className="bg-white p-5 rounded-md border border-stone-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                Lượt xem Web ({getTimeFilterLabel()})
              </p>
              <h3 className="text-2xl font-bold text-stone-900 mt-1">{analytics.pageViews.toLocaleString()}</h3>
              <p className="text-[11px] text-emerald-600 mt-1 font-medium flex items-center gap-1">
                <span>+{analytics.todayPageViews} hôm nay</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Globe size={22} />
            </div>
          </div>

          {/* Card 2: Lượt xem sản phẩm */}
          <div className="bg-white p-5 rounded-md border border-stone-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                Lượt xem Hoa ({getTimeFilterLabel()})
              </p>
              <h3 className="text-2xl font-bold text-stone-900 mt-1">{analytics.totalProductViews.toLocaleString()}</h3>
              <p className="text-[11px] text-stone-400 mt-1">Khách xem chi tiết ảnh</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <Eye size={22} />
            </div>
          </div>

          {/* Card 3: Lượt click đơn hàng */}
          <div className="bg-white p-5 rounded-md border border-stone-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                Click Gửi Đơn ({getTimeFilterLabel()})
              </p>
              <h3 className="text-2xl font-bold text-stone-900 mt-1">{analytics.ordersCount}</h3>
              <p className="text-[11px] text-stone-500 mt-1 font-medium flex items-center gap-1">
                <DollarSign size={12} className="text-emerald-600" />
                <span>{analytics.totalRevenue.toLocaleString('vi-VN')}đ</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShoppingBag size={22} />
            </div>
          </div>

          {/* Card 4: Sản phẩm Hot nhất */}
          <div className="bg-white p-5 rounded-md border border-stone-200 shadow-xs flex items-center justify-between">
            <div className="overflow-hidden pr-2">
              <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                Mẫu hoa Hot ({getTimeFilterLabel()})
              </p>
              <h3 className="text-sm font-bold text-stone-900 mt-1 truncate max-w-[160px]" title={analytics.topProduct?.name || 'Chưa có'}>
                {analytics.topProduct?.name || 'Chưa có'}
              </h3>
              <p className="text-[11px] text-rose-600 mt-1 font-semibold flex items-center gap-1">
                <Sparkles size={12} />
                <span>{analytics.topProduct?.views || 0} lượt xem</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
              <Award size={22} />
            </div>
          </div>
        </section>

        {/* TAB 1: SẢN PHẨM */}
        {activeTab === 'products' && (
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
                      {filteredAndSortedProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-stone-50/50 transition-colors">
                          <td className="px-6 py-3">
                            <img 
                              src={p.image_url} 
                              alt={p.name} 
                              className="w-10 h-12 object-cover rounded-sm border border-stone-200 bg-stone-100"
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
                            {(() => {
                              const isActive = (p.status || 'active') === 'active'
                              return (
                                <button
                                  onClick={() => toggleProductStatus(p)}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold text-[10px] tracking-wider uppercase cursor-pointer transition-all ${
                                    isActive
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70 hover:bg-emerald-100'
                                      : 'bg-rose-50 text-rose-700 border border-rose-200/70 hover:bg-rose-100'
                                  }`}
                                  title={isActive ? 'Nhấn để ẩn sản phẩm khỏi cửa hàng' : 'Nhấn để hiển thị lại sản phẩm'}
                                >
                                  {isActive ? (
                                    <>
                                      <Eye size={11} /> Đang bán
                                    </>
                                  ) : (
                                    <>
                                      <EyeOff size={11} /> Đã ẩn
                                    </>
                                  )}
                                </button>
                              )
                            })()}
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
            <h2 className="text-base font-medium font-serif tracking-wide text-stone-950 mb-6">
              Cấu hình thông tin Shop & Số điện thoại
            </h2>

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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                    Số điện thoại Zalo nhận đơn
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: 0363645261"
                    value={zaloPhone}
                    onChange={(e) => setZaloPhone(e.target.value)}
                    className="w-full text-sm px-4 py-3 bg-stone-50 border border-stone-200 focus:border-stone-900 rounded-sm focus:outline-hidden transition-all duration-200"
                  />
                  <p className="mt-1 text-[10px] text-stone-400">
                    Khách gửi đơn sẽ mở: <span className="font-mono">zalo.me/{zaloPhone}</span>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                    Số điện thoại Hotline gọi trực tiếp
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: 0363645261"
                    value={hotline}
                    onChange={(e) => setHotline(e.target.value)}
                    className="w-full text-sm px-4 py-3 bg-stone-50 border border-stone-200 focus:border-stone-900 rounded-sm focus:outline-hidden transition-all duration-200"
                  />
                  <p className="mt-1 text-[10px] text-stone-400">
                    Nút gọi nổi & trên thanh Header
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                  Địa chỉ cửa hàng
                </label>
                <input
                  type="text"
                  required
                  value={shopAddress}
                  onChange={(e) => setShopAddress(e.target.value)}
                  className="w-full text-sm px-4 py-3 bg-stone-50 border border-stone-200 focus:border-stone-900 rounded-sm focus:outline-hidden transition-all duration-200"
                />
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
                <p className="mt-1 text-[10px] text-stone-400">
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-medium font-serif tracking-wide text-stone-950">
                  Lịch sử nhấp chuột đặt hàng của khách
                </h2>
                <p className="text-xs text-stone-400">
                  Hiển thị <span className="font-semibold text-stone-800">{filteredOrders.length}</span> đơn trong mốc <span className="text-rose-600 font-semibold">{getTimeFilterLabel()}</span> (Tổng: {filteredOrders.reduce((s, o) => s + (o.total_price || 0), 0).toLocaleString('vi-VN')}đ)
                </p>
              </div>

              <button 
                onClick={fetchOrders}
                className="text-stone-500 hover:text-stone-950 text-xs flex items-center gap-1 cursor-pointer font-semibold uppercase tracking-wider self-start sm:self-auto"
              >
                Tải lại
              </button>
            </div>

            {loadingOrders ? (
              <div className="py-20 flex flex-col items-center justify-center text-stone-400 text-sm gap-2">
                <Loader2 className="animate-spin text-stone-850" size={24} />
                Đang tải lịch sử đơn...
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-20 bg-white border border-stone-100 rounded-sm">
                <p className="text-stone-400 text-sm font-serif italic">
                  Không có đơn hàng nào trong mốc {getTimeFilterLabel()}
                </p>
                <button
                  onClick={() => setTimeFilter('all')}
                  className="mt-3 text-xs text-stone-700 underline font-medium cursor-pointer"
                >
                  Xem toàn bộ thời gian
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((o) => (
                  <div key={o.id} className="bg-white border border-stone-200 rounded-sm p-6 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 pb-3 mb-4 gap-2">
                      <div>
                        <span className="text-xs font-mono font-bold text-stone-850 uppercase tracking-wide">
                          Mã ghi nhận: #{o.id.substring(0, 8)}
                        </span>
                        <span className="text-[10px] text-stone-400 block sm:inline sm:ml-4">
                          {new Date(o.created_at).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-stone-950">
                        Tổng tiền: {o.total_price.toLocaleString('vi-VN')}đ
                      </span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                        Chi tiết sản phẩm đã chọn:
                      </p>
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

        {/* TAB 4: HÒM THƯ ẨN DANH */}
        {activeTab === 'feedback' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-medium font-serif tracking-wide text-stone-950">
                  Hòm thư góp ý ẩn danh từ khách hàng
                </h2>
                <p className="text-xs text-stone-400">
                  Hiển thị <span className="font-semibold text-stone-850">{filteredFeedbacks.length}</span> / {feedbacks.length} lời nhắn ({unreadFeedbackCount} chưa đọc). Lời nhắn được bảo mật và chỉ xuất hiện tại đây.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-md p-1 bg-stone-100 text-xs">
                  <button
                    onClick={() => setFeedbackFilter('all')}
                    className={`px-3 py-1 rounded-sm font-medium transition-all cursor-pointer ${
                      feedbackFilter === 'all' ? 'bg-white text-stone-900 font-bold shadow-xs' : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    Tất cả ({feedbacks.length})
                  </button>
                  <button
                    onClick={() => setFeedbackFilter('unread')}
                    className={`px-3 py-1 rounded-sm font-medium transition-all cursor-pointer ${
                      feedbackFilter === 'unread' ? 'bg-white text-rose-700 font-bold shadow-xs' : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    Chưa đọc ({unreadFeedbackCount})
                  </button>
                  <button
                    onClick={() => setFeedbackFilter('read')}
                    className={`px-3 py-1 rounded-sm font-medium transition-all cursor-pointer ${
                      feedbackFilter === 'read' ? 'bg-white text-stone-900 font-bold shadow-xs' : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    Đã đọc
                  </button>
                </div>

                <button 
                  onClick={fetchFeedbacks}
                  className="text-stone-500 hover:text-stone-950 text-xs flex items-center gap-1 cursor-pointer font-semibold uppercase tracking-wider px-2 py-1"
                >
                  Tải lại
                </button>
              </div>
            </div>

            {loadingFeedbacks ? (
              <div className="py-20 flex flex-col items-center justify-center text-stone-400 text-sm gap-2">
                <Loader2 className="animate-spin text-stone-850" size={24} />
                Đang tải hòm thư...
              </div>
            ) : filteredFeedbacks.length === 0 ? (
              <div className="text-center py-20 bg-white border border-stone-200 rounded-sm">
                <Mail size={32} className="mx-auto text-stone-300 mb-2" />
                <p className="text-stone-400 text-sm font-serif italic">
                  Không có tin nhắn góp ý nào {feedbackFilter !== 'all' ? 'phù hợp bộ lọc' : 'trong hòm thư'}.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFeedbacks.map((fb) => (
                  <div 
                    key={fb.id}
                    className={`bg-white border rounded-lg p-5 shadow-xs transition-all ${
                      !fb.is_read ? 'border-rose-300 bg-rose-50/15' : 'border-stone-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-stone-100 gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {!fb.is_read && (
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" title="Tin nhắn chưa đọc" />
                        )}
                        <span className="font-semibold text-xs text-stone-900 bg-stone-100 px-2.5 py-0.5 rounded-full">
                          {fb.sender_tag || 'Khách ẩn danh'}
                        </span>
                        {fb.rating && (
                          <div className="flex items-center text-amber-400">
                            {[...Array(fb.rating)].map((_, i) => (
                              <Star key={i} size={12} className="fill-current" />
                            ))}
                          </div>
                        )}
                        <span className="text-[11px] text-stone-400">
                          {new Date(fb.created_at).toLocaleString('vi-VN')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleFeedbackRead(fb.id, fb.is_read)}
                          className={`px-3 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                            fb.is_read
                              ? 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          {fb.is_read ? 'Đánh dấu chưa đọc' : '✓ Đánh dấu đã đọc'}
                        </button>
                        <button
                          onClick={() => handleDeleteFeedback(fb.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Xóa tin nhắn"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <div className="text-sm text-stone-800 leading-relaxed bg-stone-50/70 p-3.5 rounded-md border border-stone-100/80">
                      {fb.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: ẢNH HOA THỰC TẾ (SHOWCASE) */}
        {activeTab === 'showcase' && (
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
                        {/* Mô tả nhỏ ở phía trên ảnh */}
                        <div className="mb-2">
                          <p className="font-medium text-xs text-stone-850 leading-snug">
                            {sc.title || '(Chưa có mô tả)'}
                          </p>
                        </div>

                        {/* Ảnh hiển thị đúng tỉ lệ thật, dồn sát hàng trên */}
                        <div className="relative bg-stone-100 rounded-lg overflow-hidden border border-stone-100">
                          <img 
                            src={sc.image_url} 
                            alt={sc.title} 
                            className="w-full h-auto block object-contain mx-auto" 
                          />
                          {sc.is_pinned && (
                            <span className="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                              <Pin size={10} /> Ghim đầu
                            </span>
                          )}
                        </div>

                        {/* Thanh thao tác quản lý */}
                        <div className="pt-3 border-t border-stone-100 flex items-center justify-between mt-3 text-xs">
                          <button
                            onClick={() => handleTogglePinShowcase(sc.id, sc.is_pinned)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium cursor-pointer transition-colors ${
                              sc.is_pinned
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            }`}
                          >
                            {sc.is_pinned ? <PinOff size={12} /> : <Pin size={12} />}
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
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: QUẢN LÝ BANNER TRANG CHỦ (HERO BANNERS) */}
        {/* ========================================================= */}
        {activeTab === 'banners' && (
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
                    {/* Ảnh Preview Banner 16:9 */}
                    <div className="relative aspect-[16/9] bg-stone-100 overflow-hidden group">
                      <img 
                        src={bn.image_url} 
                        alt={bn.title || 'Banner'} 
                        className={`w-full h-full object-cover object-center transition-all ${!bn.is_active ? 'opacity-40 grayscale' : ''}`}
                      />
                      {/* Huy hiệu thứ tự & trạng thái */}
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

                    {/* Tiêu đề & phụ đề */}
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

                      {/* Thao tác */}
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
                    type="number"
                    required
                    placeholder="Ví dụ: 380000"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    className="w-full text-sm px-4 py-2.5 bg-stone-50 border border-stone-200 focus:border-stone-900 rounded-sm focus:outline-hidden transition-all"
                  />
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

      {/* MODAL THÊM / SỬA ẢNH HOA THỰC TẾ */}
      {isShowcaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-md w-full max-w-lg shadow-xl overflow-hidden animate-slide-up max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
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

            {/* Modal Form */}
            <form onSubmit={handleSaveShowcase} className="p-6 space-y-4 overflow-y-auto">
              {/* Chọn Ảnh */}
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
                  />
                </div>
              </div>

              {/* Dán link ảnh */}
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

              {/* Đoạn mô tả nhỏ ở phía trên ảnh */}
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

              {/* Ghim bài viết */}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={scIsPinned}
                  onChange={(e) => setScIsPinned(e.target.checked)}
                  className="rounded text-stone-900 focus:ring-0"
                />
                <span className="text-xs font-semibold text-stone-700">Ghim ảnh này lên vị trí đầu trang</span>
              </label>

              {/* Modal Footer Actions */}
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

      {/* MODAL THÊM / SỬA BANNER TRANG CHỦ */}
      {isBannerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-md w-full max-w-lg shadow-xl overflow-hidden animate-slide-up max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
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

            {/* Modal Form */}
            <form onSubmit={handleSaveBanner} className="p-6 space-y-4 overflow-y-auto">
              {/* Chọn Ảnh Banner */}
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
                  />
                </div>
              </div>

              {/* Dán link ảnh */}
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

              {/* Tiêu đề banner */}
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

              {/* Phụ đề banner */}
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

              {/* Trạng thái hiển thị */}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={bnIsActive}
                  onChange={(e) => setBnIsActive(e.target.checked)}
                  className="rounded text-stone-900 focus:ring-0"
                />
                <span className="text-xs font-semibold text-stone-700">Kích hoạt hiển thị ngay trên trang chủ</span>
              </label>

              {/* Modal Footer Actions */}
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
