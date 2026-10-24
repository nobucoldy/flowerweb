import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

// 1. Đọc biến môi trường từ .env
const envPath = path.join(projectRoot, '.env')
let supabaseUrl = process.env.VITE_SUPABASE_URL
let supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const [key, ...vals] = trimmed.split('=')
    const val = vals.join('=').trim().replace(/^["']|["']$/g, '')
    if (key.trim() === 'VITE_SUPABASE_URL' && val) supabaseUrl = val
    if (key.trim() === 'VITE_SUPABASE_ANON_KEY' && val) supabaseAnonKey = val
  }
}

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-supabase-project-url')) {
  console.log('\n❌ Chưa cấu hình thông tin Supabase hợp lệ trong file .env!')
  console.log('👉 Vui lòng điền VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY trong file .env trước khi chạy seed.\n')
  process.exit(1)
}

console.log(`\n🌱 Đang kết nối tới Supabase: ${supabaseUrl}`)
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 2. Dữ liệu seed
const SEED_SETTINGS = [
  { key: 'shop_name', value: 'Que Anh Flower' },
  { key: 'zalo_phone', value: '0363645261' },
  { key: 'hotline', value: '0363645261' },
  { key: 'shop_address', value: 'Đình So, Hưng Đạo, Hà Nội' },
  { key: 'message_template', value: 'Chào Que Anh Flower, mình muốn đặt các mẫu hoa lụa sau:' }
]

const SEED_PRODUCTS = [
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
    id: 'prod-10',
    name: 'Hoa mã #10',
    price: 250000,
    image_url: '/flower-image/ma(10).jpg',
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

async function runSeed() {
  try {
    console.log('📌 1. Nạp cài đặt mặc định (Settings)...')
    for (const setting of SEED_SETTINGS) {
      const { error } = await supabase
        .from('settings')
        .upsert({ ...setting, updated_at: new Date().toISOString() })
      if (error) console.warn(`   ⚠️ Lỗi cài đặt ${setting.key}:`, error.message)
      else console.log(`   ✓ Cài đặt: ${setting.key} = ${setting.value}`)
    }

    console.log('\n📌 2. Nạp danh sách sản phẩm mẫu (Products)...')
    for (const product of SEED_PRODUCTS) {
      const { error } = await supabase
        .from('products')
        .upsert(product)
      if (error) console.warn(`   ⚠️ Lỗi sản phẩm ${product.name}:`, error.message)
      else console.log(`   ✓ Sản phẩm: ${product.name} (${product.price.toLocaleString('vi-VN')}đ)`)
    }

    console.log('\n🎉 Nạp dữ liệu Seed thành công lên Supabase!\n')
  } catch (err) {
    console.error('\n❌ Có lỗi xảy ra trong quá trình seed:', err)
  }
}

runSeed()
