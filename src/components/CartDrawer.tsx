import React, { useState, useEffect } from 'react'
import { X, Minus, Plus, Trash2, Copy, ExternalLink, Check } from 'lucide-react'
import { useCartStore } from '../store/useCartStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { supabase } from '../lib/supabaseClient'
import { isDemoMode, saveLocalOrder } from '../lib/demoData'

export const CartDrawer: React.FC = () => {
  const { items, isOpen, setIsOpen, updateQuantity, removeFromCart, getTotalPrice } = useCartStore()
  const { settings } = useSettingsStore()
  const [isCopied, setIsCopied] = useState(false)
  const [orderText, setOrderText] = useState('')
  const [showInstruction, setShowInstruction] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const zaloPhone = settings.zalo_phone || '0363645261'
  const shopName = settings.shop_name || 'Que Anh Flower'
  const messageTemplate = settings.message_template || 'Chào shop, mình muốn đặt đơn hàng hoa lụa:'

  // Tạo nội dung tin nhắn gửi qua Zalo
  useEffect(() => {
    if (items.length === 0) {
      setOrderText('')
      return
    }

    const orderId = Math.random().toString(36).substring(2, 7).toUpperCase()
    let text = `${messageTemplate}\n`
    text += `---------------------------------\n`
    items.forEach((item, idx) => {
      text += `${idx + 1}. ${item.product.name} (SL: ${item.quantity}) - ${(item.product.price * item.quantity).toLocaleString('vi-VN')}đ\n`
    })
    text += `---------------------------------\n`
    text += `Tổng cộng: ${getTotalPrice().toLocaleString('vi-VN')}đ\n`
    text += `Mã đơn nháp: #${orderId}\n`
    text += `(Nhờ shop liên hệ tư vấn giao hàng giúp mình nha!)`

    setOrderText(text)
  }, [items, messageTemplate, getTotalPrice])

  // Xử lý sao chép văn bản
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(orderText)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
      return true
    } catch (err) {
      console.error('Không thể sao chép văn bản', err)
      return false
    }
  }

  // Xử lý đặt hàng qua Zalo (Ghi đơn hàng ẩn + Copy + Chuyển hướng)
  const handleCheckout = async () => {
    setIsLoading(true)
    const successCopy = await handleCopy()

    if (successCopy) {
      // 1. Ghi đơn hàng nháp lên Supabase để làm phân tích chuyển đổi (Analytics)
      try {
        const orderData = items.map(item => ({
          product_id: item.product.id,
          product_name: item.product.name,
          price: item.product.price,
          quantity: item.quantity
        }))

        if (isDemoMode) {
          saveLocalOrder({
            id: Math.random().toString(36).substring(2, 10).toUpperCase(),
            items: orderData,
            total_price: getTotalPrice(),
            created_at: new Date().toISOString()
          })
        } else {
          await supabase.from('orders').insert({
            items: orderData,
            total_price: getTotalPrice(),
          })
        }
      } catch (error) {
        console.error('Không thể lưu đơn nháp', error)
      }

      // 2. Hiện popup hướng dẫn
      setShowInstruction(true)
    } else {
      alert('Không thể sao chép nội dung đơn hàng tự động. Bạn hãy copy thủ công từ ô text bên dưới!')
      window.open(`https://zalo.me/${zaloPhone}`, '_blank')
    }
    setIsLoading(false)
  }

  const handleGoToZalo = () => {
    setShowInstruction(false)
    window.open(`https://zalo.me/${zaloPhone}`, '_blank')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-40 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
        onClick={() => setIsOpen(false)}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        {/* Drawer Panel */}
        <div className="w-screen max-w-md transform bg-white shadow-xl flex flex-col animate-slide-in-right">
          {/* Header */}
          <div className="px-6 py-6 border-b border-stone-100 flex items-center justify-between">
            <h2 className="text-lg font-medium text-stone-950 font-serif tracking-wide">
              Giỏ hàng của bạn
            </h2>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto py-6 px-6 scrollbar-thin">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <p className="text-stone-400 text-sm mb-4 font-serif italic">Giỏ hàng đang trống</p>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-6 py-2.5 border border-stone-900 text-stone-950 hover:bg-stone-950 hover:text-stone-50 rounded-sm text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer"
                >
                  Tiếp tục xem hoa
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {items.map((item) => (
                  <div key={item.product.id} className="flex py-2 border-b border-stone-50 pb-4">
                    <img 
                      src={item.product.image_url} 
                      alt={item.product.name} 
                      className="h-16 w-12 object-cover rounded-sm bg-stone-50 flex-shrink-0"
                    />
                    <div className="ml-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-stone-900 line-clamp-1">{item.product.name}</h3>
                        <p className="mt-1 text-xs text-stone-500 font-semibold">{item.product.price.toLocaleString('vi-VN')}đ</p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        {/* Bộ điều chỉnh số lượng */}
                        <div className="flex items-center border border-stone-200 rounded-sm overflow-hidden bg-stone-50">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="p-1 hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="px-2.5 text-xs font-semibold text-stone-800 select-none">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="p-1 hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        {/* Nút Xóa */}
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-stone-400 hover:text-red-500 transition-colors cursor-pointer"
                          aria-label="Xóa sản phẩm"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer - Order summary & actions */}
          {items.length > 0 && (
            <div className="border-t border-stone-100 py-6 px-6 bg-stone-50/50">
              <div className="flex justify-between text-base font-medium text-stone-900 mb-4">
                <span>Tổng giá trị đơn hàng:</span>
                <span className="font-semibold text-stone-950">{getTotalPrice().toLocaleString('vi-VN')}đ</span>
              </div>

              {/* Text đơn hàng tự động */}
              <div className="mb-4">
                <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">
                  Tin nhắn đặt hàng (Được tạo tự động)
                </label>
                <div className="relative">
                  <textarea
                    readOnly
                    value={orderText}
                    rows={6}
                    className="w-full text-xs font-mono p-3 bg-stone-100 border border-stone-200 rounded-md text-stone-700 resize-none focus:outline-hidden"
                  />
                  <button
                    onClick={handleCopy}
                    className="absolute bottom-2.5 right-2.5 p-1.5 bg-white border border-stone-200 rounded-md text-stone-500 hover:text-stone-850 hover:shadow-xs transition-all cursor-pointer"
                    title="Copy tin nhắn"
                  >
                    {isCopied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {/* Hành động đặt hàng */}
              <div className="space-y-2">
                <button
                  onClick={handleCheckout}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-stone-950 hover:bg-stone-850 text-stone-50 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? 'Đang tạo đơn...' : 'Đặt hàng nhanh qua Zalo'}
                  <ExternalLink size={14} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full py-2.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-sm text-xs font-semibold tracking-wider transition-colors cursor-pointer"
                >
                  Mua thêm sản phẩm khác
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hướng dẫn gửi tin nhắn Modal */}
      {showInstruction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center shadow-xl animate-slide-up">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={24} />
            </div>
            <h3 className="text-base font-bold text-stone-900 mb-2">Đã sao chép tin nhắn thành công!</h3>
            <p className="text-stone-500 text-xs leading-relaxed mb-6">
              Hệ thống đã tự động sao chép danh sách đơn hàng của bạn vào khay nhớ tạm. Trình duyệt sẽ mở cuộc trò chuyện Zalo của shop **{shopName}**, bạn chỉ cần **dán tin nhắn (Ctrl + V hoặc Nhấn giữ &gt; Dán)** và gửi để đặt hàng ngay!
            </p>
            <button
              onClick={handleGoToZalo}
              className="w-full py-3 bg-brand-zalo hover:bg-blue-700 text-white rounded-md text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Mở cuộc trò chuyện Zalo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
