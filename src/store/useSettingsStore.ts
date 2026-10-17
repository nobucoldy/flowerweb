import { create } from 'zustand'
import { supabase } from '../lib/supabaseClient'

export const OFFICIAL_PHONE = '0363645261'
export const OFFICIAL_ADDRESS = 'Đình So, Hưng Đạo, Hà Nội'

const DEFAULT_SETTINGS: Record<string, string> = {
  zalo_phone: OFFICIAL_PHONE,
  hotline: OFFICIAL_PHONE,
  shop_name: 'Que Anh Flower',
  shop_address: OFFICIAL_ADDRESS,
  message_template: 'Chào Que Anh Flower, mình muốn đặt các mẫu hoa lụa sau:'
}

const SETTINGS_STORAGE_KEY = 'que_anh_settings'

const normalizeSettingValue = (key: string, value: string) => {
  if (key === 'zalo_phone' || key === 'hotline') {
    const cleaned = value.replace(/\D/g, '')
    // Tự động loại bỏ số giả lập 0900000000 cũ
    if (cleaned === '0900000000' || !cleaned) {
      return OFFICIAL_PHONE
    }
    return cleaned
  }

  return value
}

const getLocalSettings = () => {
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as Record<string, string>
      let hasChanges = false

      // Tự động thanh lọc và ghi đè số điện thoại cũ trong localStorage
      if (!parsed.zalo_phone || parsed.zalo_phone === '0900000000') {
        parsed.zalo_phone = OFFICIAL_PHONE
        hasChanges = true
      }
      if (!parsed.hotline || parsed.hotline === '0900000000') {
        parsed.hotline = OFFICIAL_PHONE
        hasChanges = true
      }

      // Tự động thanh lọc và ghi đè địa chỉ cũ trong localStorage
      if (!parsed.shop_address || parsed.shop_address.includes('Doãn Kế Thiện') || parsed.shop_address === 'Địa chỉ shop') {
        parsed.shop_address = OFFICIAL_ADDRESS
        hasChanges = true
      }

      if (hasChanges) {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(parsed))
      }

      return parsed
    }
  } catch {
    return {}
  }
  return {}
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
          let val = curr.value
          if ((curr.key === 'zalo_phone' || curr.key === 'hotline') && (val === '0900000000' || !val)) {
            val = OFFICIAL_PHONE
          }
          if (curr.key === 'shop_address' && (!val || val.includes('Doãn Kế Thiện') || val === 'Địa chỉ shop')) {
            val = OFFICIAL_ADDRESS
          }
          acc[curr.key] = val
          return acc
        }, {} as Record<string, string>)
        
        set((state) => ({
          settings: { ...state.settings, ...settingsMap }
        }))
        saveLocalSettings({ ...DEFAULT_SETTINGS, ...getLocalSettings(), ...settingsMap })
      }
    } catch {
      // Dùng settings local/default nếu không kết nối được Supabase
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
