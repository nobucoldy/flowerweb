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
    price: 95000,
    image_url: '/flower-image/ma(1).jpg',
    status: 'active',
    views_count: 0
  },
  {
    id: 'prod-02',
    name: 'Hoa mã #02',
    price: 380000,
    image_url: '/flower-image/ma(2).jpg',
    status: 'active',
    views_count: 0
  },
  {
    id: 'prod-03',
    name: 'Hoa mã #03',
    price: 250000,
    image_url: '/flower-image/ma(3).jpg',
    status: 'active',
    views_count: 0
  },
  {
    id: 'prod-04',
    name: 'Hoa mã #04',
    price: 280000,
    image_url: '/flower-image/ma(4).jpg',
    status: 'active',
    views_count: 0
  },
  {
    id: 'prod-05',
    name: 'Hoa mã #05',
    price: 300000,
    image_url: '/flower-image/ma(5).jpg',
    status: 'active',
    views_count: 0
  },
  {
    id: 'prod-06',
    name: 'Hoa mã #06',
    price: 25000,
    image_url: '/flower-image/ma(6).jpg',
    status: 'active',
    views_count: 0
  },
  {
    id: 'prod-07',
    name: 'Hoa mã #07',
    price: 480000,
    image_url: '/flower-image/ma(7).jpg',
    status: 'active',
    views_count: 0
  },
  {
    id: 'prod-08',
    name: 'Hoa mã #08',
    price: 350000,
    image_url: '/flower-image/ma(8).jpg',
    status: 'active',
    views_count: 0
  },
  {
    id: 'prod-09',
    name: 'Hoa mã #09',
    price: 0,
    image_url: '/flower-image/ma(9).jpg',
    status: 'active',
    views_count: 0
  },
  {
    id: 'prod-10',
    name: 'Hoa mã #10',
    price: 250000,
    image_url: '/flower-image/ma(10).jpg',
    status: 'active',
    views_count: 0
  },
  {
    id: 'prod-11',
    name: 'Hoa mã #11',
    price: 0,
    image_url: '/flower-image/ma(11).jpg',
    status: 'active',
    views_count: 0
  },
  {
    id: 'prod-12',
    name: 'Hoa mã #12',
    price: 450000,
    image_url: '/flower-image/ma(12).jpg',
    status: 'active',
    views_count: 0
  },
  {
    id: 'prod-13',
    name: 'Hoa mã #13',
    price: 290000,
    image_url: '/flower-image/ma(13).jpg',
    status: 'active',
    views_count: 0
  },
  {
    id: 'prod-14',
    name: 'Hoa mã #14',
    price: 380000,
    image_url: '/flower-image/ma(14).jpg',
    status: 'active',
    views_count: 0
  },
  {
    id: 'prod-15',
    name: 'Hoa mã #15',
    price: 400000,
    image_url: '/flower-image/ma(15).jpg',
    status: 'active',
    views_count: 0
  },
  {
    id: 'prod-16',
    name: 'Hoa mã #16',
    price: 300000,
    image_url: '/flower-image/ma(16).jpg',
    status: 'active',
    views_count: 0
  },
  {
    id: 'prod-17',
    name: 'Hoa mã #17',
    price: 300000,
    image_url: '/flower-image/ma(17).jpg',
    status: 'active',
    views_count: 0
  },
  {
    id: 'prod-18',
    name: 'Hoa mã #18',
    price: 200000,
    image_url: '/flower-image/ma(18).jpg',
    status: 'active',
    views_count: 0
  },
  {
    id: 'prod-19',
    name: 'Hoa mã #19',
    price: 420000,
    image_url: '/flower-image/ma(19).jpg',
    status: 'active',
    views_count: 0
  },
  {
    id: 'prod-20',
    name: 'Hoa mã #20',
    price: 500000,
    image_url: '/flower-image/ma(20).jpg',
    status: 'active',
    views_count: 0
  },
  {
    id: 'prod-21',
    name: 'Hoa mã #21',
    price: 420000,
    image_url: '/flower-image/ma(21).jpg',
    status: 'active',
    views_count: 0
  },
  {
    id: 'prod-22',
    name: 'Hoa mã #22',
    price: 300000,
    image_url: '/flower-image/ma(22).jpg',
    status: 'active',
    views_count: 0
  }
]
