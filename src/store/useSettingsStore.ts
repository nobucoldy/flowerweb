import { create } from 'zustand'
import { supabase } from '../lib/supabaseClient'

const DEFAULT_SETTINGS: Record<string, string> = {
  zalo_phone: '0363645261',
  shop_name: 'Que Anh Flower',
  message_template: 'Chào Que Anh Flower, mình muốn đặt các mẫu hoa lụa sau:'
}

const SETTINGS_STORAGE_KEY = 'que_anh_settings'

const normalizeSettingValue = (key: string, value: string) => {
  if (key === 'zalo_phone') {
    return value.replace(/\D/g, '')
  }

  return value
}

const getLocalSettings = () => {
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY)
    return saved ? JSON.parse(saved) as Record<string, string> : {}
  } catch {
    return {}
  }
}

const saveLocalSettings = (settings: Record<string, string>) => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch (e) {
    console.error('Failed to save settings to localStorage', e)
  }
}

interface SettingsState {
  settings: Record<string, string>
  isLoading: boolean
  fetchSettings: () => Promise<void>
  updateSetting: (key: string, value: string) => Promise<boolean>
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: { ...DEFAULT_SETTINGS, ...getLocalSettings() },
  isLoading: false,
  fetchSettings: async () => {
    set({ isLoading: true })
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value, updated_at')
        .order('updated_at', { ascending: true })

      if (error) throw error
      if (data) {
        const settingsMap = data.reduce((acc, curr) => {
          acc[curr.key] = curr.value
          return acc
        }, {} as Record<string, string>)
        
        set((state) => ({
          settings: { ...state.settings, ...settingsMap }
        }))
        saveLocalSettings({ ...DEFAULT_SETTINGS, ...getLocalSettings(), ...settingsMap })
      }
    } catch (e) {
      console.error('Failed to fetch settings from Supabase, using defaults.', e)
    } finally {
      set({ isLoading: false })
    }
  },
  updateSetting: async (key, value) => {
    const normalizedValue = normalizeSettingValue(key, value)

    try {
      const updatedAt = new Date().toISOString()
      const { data, error } = await supabase
        .from('settings')
        .update({ value: normalizedValue, updated_at: updatedAt })
        .eq('key', key)
        .select('key')
      
      if (error) throw error

      if (!data || data.length === 0) {
        const { error: insertError } = await supabase
          .from('settings')
          .insert({ key, value: normalizedValue, updated_at: updatedAt })

        if (insertError) throw insertError
      }

      set((state) => ({
        settings: { ...state.settings, [key]: normalizedValue }
      }))
      saveLocalSettings({ ...getLocalSettings(), [key]: normalizedValue })
      return true
    } catch (e) {
      console.error(`Failed to update setting ${key}`, e)
      return false
    }
  }
}))
