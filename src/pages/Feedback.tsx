import React, { useState } from 'react'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { CartDrawer } from '../components/CartDrawer'
import { ChatBubbles } from '../components/ChatBubbles'
import { supabase } from '../lib/supabaseClient'
import { isDemoMode, saveLocalFeedback } from '../lib/demoData'
import { navigateTo } from '../lib/navigation'
import { Send, CheckCircle2, ShieldCheck, Heart, Sparkles, Star } from 'lucide-react'

export const Feedback: React.FC = () => {
  const [content, setContent] = useState('')
  const [senderTag, setSenderTag] = useState('')
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) {
      setErrorMsg('Vui lòng nhập nội dung góp ý trước khi gửi.')
      return
    }

    setIsSubmitting(true)
    setErrorMsg(null)

    const finalTag = senderTag.trim() ? senderTag.trim() : 'Khách ẩn danh'


    try {
      if (isDemoMode) {
        // Lưu vào LocalStorage ở chế độ Demo
        await new Promise(resolve => setTimeout(resolve, 350))
        saveLocalFeedback({
          content: content.trim(),
          sender_tag: finalTag,
          rating
        })
      } else {
        // Lưu vào Supabase Database
        const { error } = await supabase
          .from('anonymous_feedback')
          .insert([
            {
              content: content.trim(),
              sender_tag: finalTag,
              rating,
              is_read: false
            }
          ])
        if (error) throw error
      }

      setIsSuccess(true)
      setContent('')
      setSenderTag('')
    } catch (err: any) {
      console.error('Lỗi gửi góp ý:', err)
      setErrorMsg('Có lỗi xảy ra khi gửi lời nhắn. Vui lòng thử lại sau giây lát.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fffafb] flex flex-col font-sans text-stone-850">
      <Navbar />

      <main className="flex-grow pt-28 pb-20 px-6 max-w-3xl mx-auto w-full">
        {/* Header giới thiệu */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200/60 rounded-full text-xs font-medium mb-3">
            <ShieldCheck size={14} />
            <span>Bảo mật 100% Ẩn danh</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-stone-900 tracking-tight mb-3">
            Hòm thư góp ý cho Que Anh Flower
          </h1>
          <p className="text-sm text-stone-500 max-w-xl mx-auto leading-relaxed">
            Mỗi chia sẻ thẳng thắn của bạn là món quà quý giá giúp shop ngày càng hoàn thiện hơn. Lời nhắn được chuyển trực tiếp vào hộp thư quản trị bí mật của chủ tiệm.
          </p>
        </div>

        {/* Nội dung form hoặc màn hình thành công */}
        {isSuccess ? (
          <div className="bg-white border border-rose-100/80 rounded-2xl p-8 sm:p-10 shadow-xs text-center max-w-lg mx-auto">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="font-serif text-2xl text-stone-900 mb-2">
              Đã gửi lời nhắn thành công!
            </h2>
            <p className="text-sm text-stone-500 mb-8 leading-relaxed">
              Cảm ơn bạn đã dành thời gian đóng góp ý kiến chân thành. Shop đã nhận được thông điệp và sẽ ghi nhận để phục vụ bạn chu đáo hơn.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setIsSuccess(false)}
                className="px-5 py-2.5 rounded-full border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
              >
                Gửi thêm lời nhắn khác
              </button>
              <button
                onClick={() => navigateTo('/')}
                className="px-6 py-2.5 rounded-full bg-stone-900 text-white hover:bg-stone-800 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-xs"
              >
                Xem các mẫu hoa của shop
              </button>
            </div>
          </div>
        ) : (
          <form 
            onSubmit={handleSubmit}
            className="bg-white border border-[#f9e1e4]/70 rounded-2xl p-6 sm:p-8 shadow-xs"
          >
            {/* Đánh giá độ hài lòng tổng quan */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                Mức độ hài lòng của bạn:
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-stone-300 hover:text-amber-400 transition-colors cursor-pointer"
                    aria-label={`${star} sao`}
                  >
                    <Star
                      size={24}
                      className={
                        (hoverRating || rating) >= star
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-stone-250'
                      }
                    />
                  </button>
                ))}
                <span className="text-xs text-stone-400 ml-2 font-medium">
                  {rating === 5 && 'Tuyệt vời'}
                  {rating === 4 && 'Hài lòng'}
                  {rating === 3 && 'Bình thường'}
                  {rating === 2 && 'Cần cải thiện'}
                  {rating === 1 && 'Chưa hài lòng'}
                </span>
              </div>
            </div>

            {/* Nội dung lời nhắn */}
            <div className="mb-6">
              <label 
                htmlFor="feedback-content"
                className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2"
              >
                Nội dung lời nhắn <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="feedback-content"
                rows={5}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Bạn hãy chia sẻ cảm nghĩ, điều bạn thích hoặc điều shop cần cải thiện nhé (ví dụ: độ mềm mại và tinh xảo của hoa lụa, độ bền màu, cách phối màu bó hoa, shipper giao hàng thế nào, hay bạn muốn shop cắm thêm mẫu hoa gì...)..."
                className="w-full px-4 py-3 text-sm bg-stone-50/50 border border-stone-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-stone-850 focus:bg-white transition-all resize-y"
              />
            </div>

            {/* Thông tin danh tính tuỳ chọn */}
            <div className="mb-8">
              <label 
                htmlFor="sender-tag"
                className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2"
              >
                Biệt danh hoặc Mã hoa bạn đã đặt (không bắt buộc):
              </label>
              <input
                id="sender-tag"
                type="text"
                value={senderTag}
                onChange={(e) => setSenderTag(e.target.value)}
                placeholder="Ví dụ: Khách quen Đình So, Mã #03, Bạn thích màu hồng..."
                className="w-full px-4 py-2.5 text-sm bg-stone-50/50 border border-stone-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-stone-850 focus:bg-white transition-all"
              />
              <p className="text-[11px] text-stone-400 mt-1.5 flex items-center gap-1">
                <ShieldCheck size={13} className="text-emerald-600 inline" />
                Nếu bạn để trống, hệ thống sẽ tự động hiển thị là <strong>Khách ẩn danh</strong>.
              </p>
            </div>

            {/* Thông báo lỗi nếu có */}
            {errorMsg && (
              <div className="mb-6 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {errorMsg}
              </div>
            )}

            {/* Nút gửi */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => navigateTo('/')}
                className="text-xs text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
              >
                ← Quay lại trang chủ
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !content.trim()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-full hover:bg-stone-800 disabled:opacity-50 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-xs"
              >
                {isSubmitting ? (
                  <>Đang gửi tin nhắn...</>
                ) : (
                  <>
                    <Send size={14} />
                    Gửi lời nhắn ẩn danh
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Cam kết của tiệm hoa */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-xl bg-white/70 border border-rose-100/60">
            <ShieldCheck size={20} className="mx-auto text-emerald-600 mb-2" />
            <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">Ẩn danh tuyệt đối</h3>
            <p className="text-[11px] text-stone-500 leading-normal">Không yêu cầu số điện thoại hay tài khoản đăng nhập.</p>
          </div>
          <div className="p-4 rounded-xl bg-white/70 border border-rose-100/60">
            <Heart size={20} className="mx-auto text-rose-500 mb-2" />
            <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">Lắng nghe chân thành</h3>
            <p className="text-[11px] text-stone-500 leading-normal">Mọi góp ý dù nhỏ nhất đều được đọc trực tiếp bởi chủ tiệm.</p>
          </div>
          <div className="p-4 rounded-xl bg-white/70 border border-rose-100/60">
            <Sparkles size={20} className="mx-auto text-amber-500 mb-2" />
            <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">Cải thiện liên tục</h3>
            <p className="text-[11px] text-stone-500 leading-normal">Không ngừng nâng niu từng cành hoa lụa cao cấp để đem đến vẻ đẹp bền lâu và sự hài lòng trọn vẹn.</p>
          </div>
        </div>
      </main>

      <Footer />
      <CartDrawer />
      <ChatBubbles />
    </div>
  )
}
