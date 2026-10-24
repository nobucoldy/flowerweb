import { createClient } from '@supabase/supabase-js'
import { compressImageToFile } from './imageUtils'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-supabase-project-url')) {
  console.warn(
    'Supabase credentials are missing or using placeholders. Please update your .env file with actual credentials.'
  )
}

// Client chính thức duy trì Auth Session cho người dùng
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
)

// Client quản trị độc lập (không bị ghi đè Auth Token khi sign-in),
// sử dụng trực tiếp service key từ .env để thực hiện các quyền upload Storage và Admin operations an toàn
export const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${supabaseAnonKey || 'placeholder'}`
      }
    }
  }
)

let lastWorkingBucket: string | null = null
let lastWorkingClient: 'admin' | 'anon' | null = null

// Helper giới hạn thời gian chờ upload (timeout sau 6 giây để không làm đơ giao diện)
const uploadWithTimeout = async (promise: Promise<any>, timeoutMs = 6000) => {
  let timer: any
  const timeoutPromise = new Promise<{ error: any }>((resolve) => {
    timer = setTimeout(() => resolve({ error: new Error('Upload storage timeout') }), timeoutMs)
  })
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer))
}

/**
 * Upload file ảnh an toàn lên Supabase Storage
 * Tự động thử các bucket có sẵn ('products', 'product-images')
 * Có timeout 6s và ghi nhớ bucket thành công để các lần sau chạy tức thì.
 */
export const uploadStorageImage = async (
  file: File,
  folder = 'products'
): Promise<string | null> => {
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-supabase-project-url')) {
    return null
  }

  // Tự động nén và resize ảnh trước khi truyền qua mạng
  const maxDim = folder === 'banners' ? 1600 : 1200
  const optimizedFile = await compressImageToFile(file, maxDim, maxDim, 0.82)

  const fileExt = (optimizedFile.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
  const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
  const filePath = `${folder}/${fileName}`
  
  // Sắp xếp bucket và client theo thứ tự ưu tiên (ưu tiên cấu hình đã thành công trước đó)
  const buckets = lastWorkingBucket 
    ? [lastWorkingBucket, ...['products', 'product-images'].filter(b => b !== lastWorkingBucket)]
    : ['products', 'product-images']

  const clients = lastWorkingClient === 'anon'
    ? [{ type: 'anon', client: supabase }, { type: 'admin', client: supabaseAdmin }]
    : [{ type: 'admin', client: supabaseAdmin }, { type: 'anon', client: supabase }]

  for (const { type, client } of clients) {
    for (const bName of buckets) {
      try {
        const { error: upErr } = await uploadWithTimeout(
          client.storage
            .from(bName)
            .upload(filePath, optimizedFile, {
              cacheControl: '31536000',
              upsert: true,
              contentType: optimizedFile.type || 'image/jpeg'
            }),
          6000
        )

        if (!upErr) {
          const { data: { publicUrl } } = client.storage
            .from(bName)
            .getPublicUrl(filePath)

          if (publicUrl) {
            lastWorkingBucket = bName
            lastWorkingClient = type as any
            console.log(`[Storage] Upload thành công lên ${bName}/${filePath}:`, publicUrl)
            return publicUrl
          }
        }
      } catch (err) {
        // Tiếp tục thử bucket hoặc client khác
      }
    }
  }

  return null
}
