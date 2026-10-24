/**
 * Helper thực thi truy vấn Supabase an toàn có cơ chế tự động Thử lại (Auto-Retry)
 * Giúp khắc phục triệt để tình trạng:
 * 1. Supabase Free Tier đang 'Cold Start' (thức dậy sau thời gian rảnh).
 * 2. Mạng quốc tế chập chờn làm rơi gói tin ('fetch failed').
 */
export async function withDbRetry<T = any>(
  operation: () => PromiseLike<{ data: T | null; error: any }>,
  maxRetries = 2,
  delayMs = 800
): Promise<{ data: T | null; error: any }> {
  let lastError: any = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation()
      
      // Nếu thành công hoặc lỗi không phải lỗi rớt mạng thì trả về kết quả
      if (!result.error) {
        return result
      }

      lastError = result.error
      const errMsg = (result.error.message || '').toLowerCase()
      const isNetworkError = 
        errMsg.includes('fetch failed') ||
        errMsg.includes('network') ||
        errMsg.includes('timeout') ||
        errMsg.includes('connection')

      // Nếu không phải lỗi mạng thì không cần retry (ví dụ lỗi sai cú pháp SQL, RLS)
      if (!isNetworkError && attempt > 0) {
        return result
      }
    } catch (err: any) {
      lastError = err
    }

    if (attempt < maxRetries) {
      // Chờ một khoảng thời gian trước khi thử lại
      await new Promise(r => setTimeout(r, delayMs * (attempt + 1)))
    }
  }

  return { data: null, error: lastError }
}
