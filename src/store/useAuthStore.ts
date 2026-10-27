import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  initialize: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.warn('Lỗi khi lấy Supabase session:', error.message)
      }
      set({ session: session ?? null, user: session?.user ?? null, isLoading: false })

      // Lắng nghe sự thay đổi trạng thái đăng nhập
      supabase.auth.onAuthStateChange((_event, session) => {
        set({ session: session ?? null, user: session?.user ?? null, isLoading: false })
      })
    } catch (e) {
      console.error('Không thể khởi tạo Supabase Auth', e)
      set({ session: null, user: null, isLoading: false })
    }
  },
  signIn: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      })

      if (error) {
        let msg = error.message
        if (msg.toLowerCase().includes('invalid login credentials')) {
          msg = 'Email hoặc mật khẩu không chính xác.'
        }
        return { success: false, error: msg }
      }

      set({ user: data.user, session: data.session })
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message || 'Lỗi đăng nhập hệ thống' }
    }
  },
  signOut: async () => {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.error('Error signing out', e)
    } finally {
      set({ user: null, session: null })
    }
  }
}))
