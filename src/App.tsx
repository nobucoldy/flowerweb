import { useState, useEffect, lazy, Suspense } from 'react'
import { Home } from './pages/Home'
import { useAuthStore } from './store/useAuthStore'
import { recordPageView } from './lib/analytics'
import { Loader2 } from 'lucide-react'

// Code-splitting các trang phụ và trang quản trị để trang chủ load cực nhanh
const Feedback = lazy(() => import('./pages/Feedback').then(m => ({ default: m.Feedback })))
const Showcase = lazy(() => import('./pages/Showcase').then(m => ({ default: m.Showcase })))
const AdminLogin = lazy(() => import('./pages/AdminLogin').then(m => ({ default: m.AdminLogin })))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })))

const PageLoader = () => (
  <div className="min-h-screen bg-stone-50 flex items-center justify-center text-stone-400 text-sm gap-2">
    <Loader2 className="animate-spin text-stone-850" size={24} />
    Đang tải trang...
  </div>
)

function App() {
  const [path, setPath] = useState(window.location.pathname)
  const { user, isLoading, initialize } = useAuthStore()

  // Khởi tạo Supabase Auth listener
  useEffect(() => {
    initialize()
  }, [initialize])

  // Trình điều hướng (Lightweight Router)
  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = (to: string) => {
    window.history.pushState({}, '', to)
    setPath(to)
  }

  const isAdminPath = path === '/admin' || path === '/admin/' || path.startsWith('/admin')

  // Ghi nhận lượt truy cập website cho khách hàng (không tính trang quản trị admin)
  useEffect(() => {
    if (!isAdminPath) {
      recordPageView()
    }
  }, [isAdminPath])

  // Chỉ chặn chờ auth khi người dùng truy cập trang quản trị admin
  if (isAdminPath && isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center text-stone-400 text-sm gap-2">
        <Loader2 className="animate-spin text-stone-850" size={24} />
        Đang xác thực quyền truy cập...
      </div>
    )
  }

  // Điều hướng trang quản trị
  if (isAdminPath) {
    return (
      <Suspense fallback={<PageLoader />}>
        {user ? (
          <AdminDashboard navigate={navigate} />
        ) : (
          <AdminLogin 
            onLoginSuccess={() => navigate('/admin')} 
            navigate={navigate} 
          />
        )}
      </Suspense>
    )
  }

  // Trang hòm thư góp ý ẩn danh
  if (path === '/feedback' || path === '/feedback/' || path === '/gop-y') {
    return (
      <Suspense fallback={<PageLoader />}>
        <Feedback />
      </Suspense>
    )
  }

  // Trang ảnh hoa thực tế & review của shop
  if (path === '/showcase' || path === '/showcase/' || path === '/reviews' || path === '/reviews/') {
    return (
      <Suspense fallback={<PageLoader />}>
        <Showcase />
      </Suspense>
    )
  }

  // Trang khách hàng mặc định (Tải ngay lập tức)
  return <Home />
}

export default App
