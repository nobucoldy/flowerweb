export interface SeedProduct {
  id: string
  name: string
  price: number
  image_url: string
  status: 'active' | 'inactive'
  views_count: number
  category?: string
  created_at?: string
}

export const SEED_SETTINGS: Record<string, string> = {
  shop_name: 'Que Anh Flower',
  zalo_phone: '0363645261',
  hotline: '0363645261',
  shop_address: 'Đình So, Hưng Đạo, Hà Nội',
  message_template: 'Chào Que Anh Flower, mình muốn đặt các mẫu hoa lụa sau:'
}

export const SEED_PRODUCTS: SeedProduct[] = [
  {
    id: 'prod-01',
    name: 'Hoa mã #01',
    price: 380000,
    image_url: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?q=80&w=600&auto=format&fit=crop',
    status: 'active',
    views_count: 142
  },
  {
    id: 'prod-02',
    name: 'Hoa mã #02',
    price: 450000,
    image_url: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=600&auto=format&fit=crop',
    status: 'active',
    views_count: 98
  },
  {
    id: 'prod-03',
    name: 'Hoa mã #03',
    price: 290000,
    image_url: 'https://images.unsplash.com/photo-1520763185298-1b434c919102?q=80&w=600&auto=format&fit=crop',
    status: 'active',
    views_count: 215
  },
  {
    id: 'prod-04',
    name: 'Hoa mã #04',
    price: 320000,
    image_url: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?q=80&w=600&auto=format&fit=crop',
    status: 'active',
    views_count: 85
  },
  {
    id: 'prod-05',
    name: 'Hoa mã #05',
    price: 520000,
    image_url: 'https://images.unsplash.com/photo-1587556930799-8dca6aef3dc5?q=80&w=600&auto=format&fit=crop',
    status: 'active',
    views_count: 176
  },
  {
    id: 'prod-06',
    name: 'Hoa mã #06',
    price: 680000,
    image_url: 'https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?q=80&w=600&auto=format&fit=crop',
    status: 'active',
    views_count: 64
  },
  {
    id: 'prod-07',
    name: 'Hoa mã #07',
    price: 350000,
    image_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop',
    status: 'active',
    views_count: 129
  },
  {
    id: 'prod-08',
    name: 'Hoa mã #08',
    price: 250000,
    image_url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=600&auto=format&fit=crop',
    status: 'active',
    views_count: 110
  },
  {
    id: 'prod-09',
    name: 'Hoa mã #09',
    price: 850000,
    image_url: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=600&auto=format&fit=crop',
    status: 'active',
    views_count: 312
  },
  {
    id: 'prod-10',
    name: 'Hoa mã #10',
    price: 490000,
    image_url: 'https://images.unsplash.com/photo-1567696911980-2eed69a46042?q=80&w=600&auto=format&fit=crop',
    status: 'active',
    views_count: 93
  },
  {
    id: 'prod-11',
    name: 'Hoa mã #11',
    price: 420000,
    image_url: 'https://images.unsplash.com/photo-1508610048659-a06b669e3321?q=80&w=600&auto=format&fit=crop',
    status: 'active',
    views_count: 77
  },
  {
    id: 'prod-12',
    name: 'Hoa mã #12',
    price: 280000,
    image_url: 'https://images.unsplash.com/photo-1528722828814-77b9b83aafb2?q=80&w=600&auto=format&fit=crop',
    status: 'active',
    views_count: 155
  }
]
