import type { Product } from '../store/useCartStore'

export const isDemoMode = 
  !import.meta.env.VITE_SUPABASE_URL || 
  import.meta.env.VITE_SUPABASE_URL.includes('your-supabase-project-url')

const MOCK_PRODUCTS: Product[] = [
  {
    id: 'demo-1',
    name: 'Bó hoa hồng lụa Rosy Premium',
    price: 380000,
    image_url: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: 'demo-2',
    name: 'Giỏ hoa cẩm tú cầu trắng tinh khôi',
    price: 450000,
    image_url: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: 'demo-3',
    name: 'Bình hoa Tulip vàng cao cấp',
    price: 290000,
    image_url: 'https://images.unsplash.com/photo-1520763185298-1b434c919102?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: 'demo-4',
    name: 'Bó hoa cưới hướng dương rạng rỡ',
    price: 320000,
    image_url: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?q=80&w=600&auto=format&fit=crop'
  }
]

export const getLocalProducts = (): Product[] => {
  try {
    const saved = localStorage.getItem('que_anh_demo_products')
    if (saved) return JSON.parse(saved)
  } catch {}
  
  // Khởi tạo sản phẩm mẫu mặc định
  saveLocalProducts(MOCK_PRODUCTS)
  return MOCK_PRODUCTS
}

export const saveLocalProducts = (products: any[]) => {
  try {
    localStorage.setItem('que_anh_demo_products', JSON.stringify(products))
  } catch (e) {
    console.error('Error saving mock products', e)
  }
}

export const getLocalOrders = () => {
  try {
    const saved = localStorage.getItem('que_anh_demo_orders')
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

export const saveLocalOrder = (order: any) => {
  try {
    const current = getLocalOrders()
    const newOrders = [order, ...current]
    localStorage.setItem('que_anh_demo_orders', JSON.stringify(newOrders))
  } catch (e) {
    console.error('Error saving mock order', e)
  }
}
