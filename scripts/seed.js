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
