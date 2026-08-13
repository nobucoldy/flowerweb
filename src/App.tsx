import { useState, useEffect } from 'react'
import { Home } from './pages/Home'
import { AdminLogin } from './pages/AdminLogin'
import { AdminDashboard } from './pages/AdminDashboard'
import { useAuthStore } from './store/useAuthStore'
import { Loader2 } from 'lucide-react'

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

  // Chờ kiểm tra trạng thái đăng nhập ban đầu
  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center text-stone-400 text-sm gap-2">
        <Loader2 className="animate-spin text-stone-850" size={24} />
        Đang khởi động hệ thống...
      </div>
    )
  }

  // Điều hướng trang quản trị
  if (path === '/admin' || path === '/admin/') {
    if (user) {
      return <AdminDashboard navigate={navigate} />
    } else {
      return (
        <AdminLogin 
          onLoginSuccess={() => navigate('/admin')} 
          navigate={navigate} 
        />
      )
    }
  }

  // Trang khách hàng mặc định
  return <Home />
}

export default App
