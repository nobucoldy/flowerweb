import React, { useState } from 'react'
import { LogIn, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'

interface AdminLoginProps {
  onLoginSuccess: () => void
  navigate: (path: string) => void
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, navigate }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const signIn = useAuthStore((state) => state.signIn)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await signIn(email, password)
      if (res.success) {
        onLoginSuccess()
      } else {
        setError(res.error || 'Đã xảy ra lỗi đăng nhập.')
      }
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi đăng nhập.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-stone-100 rounded-sm shadow-xs p-8 animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="font-serif text-2xl font-light text-stone-900 tracking-wider inline-block mb-3">
            Que Anh Flower
          </span>
          <h2 className="text-xs font-bold text-stone-400 uppercase tracking-widest">
            Hệ thống Quản trị viên
          </h2>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200/50 rounded-sm text-red-700 text-xs leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
              Email đăng nhập
            </label>
            <input
              type="email"
              required
              placeholder="admin@queanhflower.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-sm px-4 py-3 bg-stone-50 border border-stone-200 focus:border-stone-900 rounded-sm focus:outline-hidden transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-sm px-4 py-3 bg-stone-50 border border-stone-200 focus:border-stone-900 rounded-sm focus:outline-hidden transition-all duration-200 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-stone-950 hover:bg-stone-850 text-stone-50 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors duration-200 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin text-stone-50" />
            ) : (
              <>
                <LogIn size={16} />
                Đăng nhập
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-stone-400 hover:text-stone-950 text-xs transition-colors duration-200 cursor-pointer"
          >
            ← Quay lại cửa hàng
          </button>
        </div>
      </div>
    </div>
  )
}
