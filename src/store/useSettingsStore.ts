import { create } from 'zustand'
import { supabase } from '../lib/supabaseClient'

interface SettingsState {
  settings: Record<string, string>
  isLoading: boolean
  fetchSettings: () => Promise<void>
  updateSetting: (key: string, value: string) => Promise<boolean>
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: {
    zalo_phone: '0900000000',
    shop_name: 'Que Anh Flower',
    message_template: 'Chào Que Anh Flower, mình muốn đặt các mẫu hoa lụa sau:'
  },
  isLoading: false,
  fetchSettings: async () => {
    set({ isLoading: true })
    try {
      const { data, error } = await supabase.from('settings').select('key, value')
      if (error) throw error
      if (data) {
        const settingsMap = data.reduce((acc, curr) => {
          acc[curr.key] = curr.value
          return acc
        }, {} as Record<string, string>)
        
        set((state) => ({
          settings: { ...state.settings, ...settingsMap }
        }))
      }
    } catch (e) {
      console.error('Failed to fetch settings from Supabase, using defaults.', e)
    } finally {
      set({ isLoading: false })
    }
  },
  updateSetting: async (key, value) => {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({ key, value, updated_at: new Date().toISOString() })
      
      if (error) throw error

      set((state) => ({
        settings: { ...state.settings, [key]: value }
      }))
      return true
    } catch (e) {
      console.error(`Failed to update setting ${key}`, e)
      return false
    }
  }
}))
