import React, { useState, useEffect } from 'react'
import { Save, Loader2 } from 'lucide-react'
import { useSettingsStore } from '../../../store/useSettingsStore'

export const SettingsTab: React.FC = () => {
  const { settings, fetchSettings, updateSetting } = useSettingsStore()

  const [zaloPhone, setZaloPhone] = useState('')
  const [hotline, setHotline] = useState('')
  const [shopName, setShopName] = useState('')
  const [shopAddress, setShopAddress] = useState('')
  const [messageTemplate, setMessageTemplate] = useState('')
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [settingsSuccess, setSettingsSuccess] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  useEffect(() => {
    const rawZalo = settings.zalo_phone
    const finalZalo = (!rawZalo || rawZalo === '0900000000') ? '0363645261' : rawZalo
    const rawHotline = settings.hotline
    const finalHotline = (!rawHotline || rawHotline === '0900000000') ? '0363645261' : rawHotline

    setZaloPhone(finalZalo)
    setHotline(finalHotline)
    setShopName(settings.shop_name || 'Que Anh Flower')
    setShopAddress(
      settings.shop_address && !settings.shop_address.includes('Doãn Kế Thiện') && settings.shop_address !== 'Địa chỉ shop'
        ? settings.shop_address 
        : 'Đình So, Hưng Đạo, Hà Nội'
    )
    setMessageTemplate(settings.message_template || '')
  }, [settings])

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingSettings(true)
    setSettingsSuccess(false)

    try {
      await Promise.all([
        updateSetting('zalo_phone', zaloPhone.trim()),
        updateSetting('hotline', hotline.trim()),
        updateSetting('shop_name', shopName.trim()),
        updateSetting('shop_address', shopAddress.trim()),
        updateSetting('message_template', messageTemplate.trim())
      ])
      setSettingsSuccess(true)
      setTimeout(() => setSettingsSuccess(false), 4000)
    } catch (err) {
      console.error('Lỗi khi lưu cài đặt:', err)
      alert('Có lỗi xảy ra khi lưu cài đặt. Vui lòng thử lại.')
    } finally {
      setIsSavingSettings(false)
    }
  }

  return (
    <div className="max-w-2xl bg-white border border-stone-200 rounded-sm shadow-xs p-8">
      <h2 className="text-base font-medium font-serif tracking-wide text-stone-950 mb-6">
        Cấu hình thông tin Shop & Số điện thoại
      </h2>

      {settingsSuccess && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200/50 rounded-sm text-green-700 text-xs">
          Cập nhật cài đặt thành công!
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div>
          <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
            Tên cửa hàng (Shop Name)
          </label>
          <input
            type="text"
            required
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            className="w-full text-sm px-4 py-3 bg-stone-50 border border-stone-200 focus:border-stone-900 rounded-sm focus:outline-hidden transition-all duration-200"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
              Số điện thoại Zalo nhận đơn
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: 0363645261"
              value={zaloPhone}
              onChange={(e) => setZaloPhone(e.target.value)}
              className="w-full text-sm px-4 py-3 bg-stone-50 border border-stone-200 focus:border-stone-900 rounded-sm focus:outline-hidden transition-all duration-200"
            />
            <p className="mt-1 text-[10px] text-stone-400">
              Khách gửi đơn sẽ mở: <span className="font-mono">zalo.me/{zaloPhone}</span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
              Số điện thoại Hotline gọi trực tiếp
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: 0363645261"
              value={hotline}
              onChange={(e) => setHotline(e.target.value)}
              className="w-full text-sm px-4 py-3 bg-stone-50 border border-stone-200 focus:border-stone-900 rounded-sm focus:outline-hidden transition-all duration-200"
            />
            <p className="mt-1 text-[10px] text-stone-400">
              Nút gọi nổi & trên thanh Header
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
            Địa chỉ cửa hàng
          </label>
          <input
            type="text"
            required
            value={shopAddress}
            onChange={(e) => setShopAddress(e.target.value)}
            className="w-full text-sm px-4 py-3 bg-stone-50 border border-stone-200 focus:border-stone-900 rounded-sm focus:outline-hidden transition-all duration-200"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
            Mẫu lời chào đầu đơn hàng
          </label>
          <textarea
            required
            rows={3}
            value={messageTemplate}
            onChange={(e) => setMessageTemplate(e.target.value)}
            className="w-full text-sm px-4 py-3 bg-stone-50 border border-stone-200 focus:border-stone-900 rounded-sm focus:outline-hidden transition-all duration-200 resize-none"
          />
          <p className="mt-1 text-[10px] text-stone-400">
            Dòng đầu tiên xuất hiện trong tin nhắn copy đơn hàng mà khách sẽ dán gửi cho bạn.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSavingSettings}
          className="flex items-center justify-center gap-1.5 py-3 px-6 bg-stone-950 hover:bg-stone-850 text-stone-50 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors duration-200 cursor-pointer disabled:opacity-50"
        >
          {isSavingSettings ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <>
              <Save size={14} />
              Lưu cấu hình
            </>
          )}
        </button>
      </form>
    </div>
  )
}
