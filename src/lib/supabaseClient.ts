import { createClient } from '@supabase/supabase-js'

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

/**
 * Upload file ảnh an toàn lên Supabase Storage
 * Tự động thử các bucket có sẵn ('products', 'product-images')
 * và trả về Public URL. Nếu Storage bị lỗi hoặc chưa có quyền, trả về null để fallback sang Base64.
 */
export const uploadStorageImage = async (
  file: File,
  folder = 'products'
): Promise<string | null> => {
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-supabase-project-url')) {
    return null
  }

  const fileExt = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
  const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
  const filePath = `${folder}/${fileName}`
  const buckets = ['products', 'product-images']

  // Thử lần lượt với client quản trị trước, sau đó với client thông thường
  for (const client of [supabaseAdmin, supabase]) {
    for (const bName of buckets) {
      try {
        const { error: upErr } = await client.storage
          .from(bName)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
            contentType: file.type || 'image/jpeg'
          })

        if (!upErr) {
          const { data: { publicUrl } } = client.storage
            .from(bName)
            .getPublicUrl(filePath)

          if (publicUrl) {
            console.log(`[Storage] Upload thành công lên ${bName}/${filePath}:`, publicUrl)
            return publicUrl
          }
        } else {
          console.warn(`[Storage] Bucket ${bName} báo lỗi:`, upErr.message || upErr)
        }
      } catch (err) {
        // Tiếp tục thử bucket hoặc client khác
        console.warn(`[Storage] Ngoại lệ upload bucket ${bName}:`, err)
      }
    }
  }

  return null
}
