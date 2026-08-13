import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

const isDemoMode = 
  !import.meta.env.VITE_SUPABASE_URL || 
  import.meta.env.VITE_SUPABASE_URL.includes('your-supabase-project-url')

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  isDemo: boolean
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  isDemo: isDemoMode,
  initialize: async () => {
    if (isDemoMode) {
      try {
        const isLogged = localStorage.getItem('que_anh_demo_session') === 'true'
        if (isLogged) {
          const mockUser = { id: 'mock-admin-id', email: 'admin@queanhflower.com' } as any
          set({ user: mockUser, session: {} as any, isLoading: false })
        } else {
          set({ user: null, session: null, isLoading: false })
        }
      } catch {
        set({ user: null, session: null, isLoading: false })
      }
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      set({ session, user: session?.user ?? null, isLoading: false })

      // Lắng nghe sự thay đổi trạng thái đăng nhập
      supabase.auth.onAuthStateChange((_event, session) => {
        set({ session, user: session?.user ?? null, isLoading: false })
      })
    } catch (e) {
      console.error('Failed to initialize Supabase Auth', e)
      set({ isLoading: false })
    }
  },
  signIn: async (email, password) => {
    if (isDemoMode) {
      if (email === 'admin@queanhflower.com' && password === 'admin123') {
        const mockUser = { id: 'mock-admin-id', email: 'admin@queanhflower.com' } as any
        set({ user: mockUser, session: {} as any })
        localStorage.setItem('que_anh_demo_session', 'true')
        return { success: true }
      } else {
        return { 
          success: false, 
          error: 'Sai tài khoản. (Mẹo Demo: đăng nhập bằng admin@queanhflower.com / admin123)' 
        }
      }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return { success: false, error: error.message }
      }

      set({ user: data.user, session: data.session })
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message || 'Lỗi đăng nhập hệ thống' }
    }
  },
  signOut: async () => {
    if (isDemoMode) {
      localStorage.removeItem('que_anh_demo_session')
      set({ user: null, session: null })
      return
    }

    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.error('Error signing out', e)
    } finally {
      set({ user: null, session: null })
    }
  }
}))
