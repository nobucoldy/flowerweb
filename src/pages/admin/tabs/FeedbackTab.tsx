import React, { useState, useEffect } from 'react'
import { Mail, Star, Trash2, Loader2 } from 'lucide-react'
import { supabase, supabaseAdmin } from '../../../lib/supabaseClient'
import type { AnonymousFeedback } from '../types'

interface FeedbackTabProps {
  onFeedbackCountsChange?: (total: number, unread: number) => void
}

export const FeedbackTab: React.FC<FeedbackTabProps> = ({ onFeedbackCountsChange }) => {
  const [feedbacks, setFeedbacks] = useState<AnonymousFeedback[]>([])
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false)
  const [feedbackFilter, setFeedbackFilter] = useState<'all' | 'unread' | 'read'>('all')

  useEffect(() => {
    fetchFeedbacks()
  }, [])

  const updateCounts = (list: AnonymousFeedback[]) => {
    const unread = list.filter(f => !f.is_read).length
    onFeedbackCountsChange?.(list.length, unread)
  }

  const fetchFeedbacks = async () => {
    setLoadingFeedbacks(true)
    try {
      const { data, error } = await supabase
        .from('anonymous_feedback')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      if (data) {
        const list = data as AnonymousFeedback[]
        setFeedbacks(list)
        updateCounts(list)
      }
    } catch (err) {
      console.warn('Lỗi lấy danh sách góp ý từ Supabase:', err)
      setFeedbacks([])
      updateCounts([])
    } finally {
      setLoadingFeedbacks(false)
    }
  }

  const handleToggleFeedbackRead = async (id: string, currentStatus: boolean) => {
    // Optimistic UI update
    setFeedbacks(prev => {
      const next = prev.map(f => f.id === id ? { ...f, is_read: !currentStatus } : f)
      updateCounts(next)
      return next
    })

    try {
      const { error } = await supabaseAdmin
        .from('anonymous_feedback')
        .update({ is_read: !currentStatus })
        .eq('id', id)

      if (error) {
        console.error('Lỗi Supabase khi cập nhật trạng thái đọc feedback:', error)
        alert(`Không thể lưu trạng thái vào Database: ${error.message}`)
      }
    } catch (err: any) {
      console.warn('Lỗi cập nhật trạng thái đọc feedback:', err)
      alert(`Lỗi: ${err.message || 'Không thể cập nhật'}`)
    }
  }

  const handleDeleteFeedback = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tin nhắn góp ý này?')) return

    // Optimistic UI update
    setFeedbacks(prev => {
      const next = prev.filter(f => f.id !== id)
      updateCounts(next)
      return next
    })

    try {
      const { error } = await supabaseAdmin.from('anonymous_feedback').delete().eq('id', id)
      if (error) {
        console.error('Lỗi khi xóa feedback khỏi Database:', error)
        alert(`Không thể xóa khỏi Database: ${error.message}`)
      }
    } catch (err) {
      console.error('Lỗi xóa feedback:', err)
    }
  }

  const unreadFeedbackCount = feedbacks.filter(f => !f.is_read).length
  const filteredFeedbacks = feedbacks.filter(f => {
    if (feedbackFilter === 'unread') return !f.is_read
    if (feedbackFilter === 'read') return f.is_read
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-medium font-serif tracking-wide text-stone-950">
            Hòm thư góp ý ẩn danh từ khách hàng
          </h2>
          <p className="text-xs text-stone-400">
            Hiển thị <span className="font-semibold text-stone-850">{filteredFeedbacks.length}</span> / {feedbacks.length} lời nhắn ({unreadFeedbackCount} chưa đọc). Lời nhắn được bảo mật và chỉ xuất hiện tại đây.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md p-1 bg-stone-100 text-xs">
            <button
              onClick={() => setFeedbackFilter('all')}
              className={`px-3 py-1 rounded-sm font-medium transition-all cursor-pointer ${
                feedbackFilter === 'all' ? 'bg-white text-stone-900 font-bold shadow-xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Tất cả ({feedbacks.length})
            </button>
            <button
              onClick={() => setFeedbackFilter('unread')}
              className={`px-3 py-1 rounded-sm font-medium transition-all cursor-pointer ${
                feedbackFilter === 'unread' ? 'bg-white text-rose-700 font-bold shadow-xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Chưa đọc ({unreadFeedbackCount})
            </button>
            <button
              onClick={() => setFeedbackFilter('read')}
              className={`px-3 py-1 rounded-sm font-medium transition-all cursor-pointer ${
                feedbackFilter === 'read' ? 'bg-white text-stone-900 font-bold shadow-xs' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Đã đọc
            </button>
          </div>

          <button 
            onClick={fetchFeedbacks}
            className="text-stone-500 hover:text-stone-950 text-xs flex items-center gap-1 cursor-pointer font-semibold uppercase tracking-wider px-2 py-1"
          >
            Tải lại
          </button>
        </div>
      </div>

      {loadingFeedbacks ? (
        <div className="py-20 flex flex-col items-center justify-center text-stone-400 text-sm gap-2">
          <Loader2 className="animate-spin text-stone-850" size={24} />
          Đang tải hòm thư...
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <div className="text-center py-20 bg-white border border-stone-200 rounded-sm">
          <Mail size={32} className="mx-auto text-stone-300 mb-2" />
          <p className="text-stone-400 text-sm font-serif italic">
            Không có tin nhắn góp ý nào {feedbackFilter !== 'all' ? 'phù hợp bộ lọc' : 'trong hòm thư'}.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFeedbacks.map((fb) => (
            <div 
              key={fb.id}
              className={`bg-white border rounded-lg p-5 shadow-xs transition-all ${
                !fb.is_read ? 'border-rose-300 bg-rose-50/15' : 'border-stone-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-stone-100 gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {!fb.is_read && (
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" title="Tin nhắn chưa đọc" />
                  )}
                  <span className="font-semibold text-xs text-stone-900 bg-stone-100 px-2.5 py-0.5 rounded-full">
                    {fb.sender_tag || 'Khách ẩn danh'}
                  </span>
                  {fb.rating && (
                    <div className="flex items-center text-amber-400">
                      {[...Array(fb.rating)].map((_, i) => (
                        <Star key={i} size={12} className="fill-current" />
                      ))}
                    </div>
                  )}
                  <span className="text-[11px] text-stone-400">
                    {new Date(fb.created_at).toLocaleString('vi-VN')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleFeedbackRead(fb.id, fb.is_read)}
                    className={`px-3 py-1 rounded text-xs font-medium cursor-pointer transition-colors ${
                      fb.is_read
                        ? 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    {fb.is_read ? 'Đánh dấu chưa đọc' : '✓ Đánh dấu đã đọc'}
                  </button>
                  <button
                    onClick={() => handleDeleteFeedback(fb.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Xóa tin nhắn"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="text-sm text-stone-800 leading-relaxed bg-stone-50/70 p-3.5 rounded-md border border-stone-100/80">
                {fb.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
