import React, { memo } from 'react'
import { Calendar, Globe, Eye, ShoppingBag, DollarSign, Sparkles, Award } from 'lucide-react'
import type { AnalyticsSummary, TimeFilter } from './types'

interface AdminStatsBarProps {
  analytics: AnalyticsSummary
  timeFilter: TimeFilter
  setTimeFilter: (filter: TimeFilter) => void
}

export const AdminStatsBar: React.FC<AdminStatsBarProps> = memo(({
  analytics,
  timeFilter,
  setTimeFilter
}) => {
  const getTimeFilterLabel = () => {
    switch (timeFilter) {
      case 'today': return 'Hôm nay'
      case 'week': return '7 ngày qua'
      case 'month': return '30 ngày qua'
      case 'all': return 'Toàn thời gian'
    }
  }

  return (
    <>
      {/* 📅 BỘ LỌC THỜI GIAN: NGÀY / TUẦN / THÁNG / TẤT CẢ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-white p-3.5 rounded-md border border-stone-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
            <Calendar size={16} />
          </div>
          <div>
            <p className="text-xs font-bold text-stone-850">Lọc số liệu theo thời gian</p>
            <p className="text-[10px] text-stone-400">Đang hiển thị thống kê: <span className="font-semibold text-rose-600">{getTimeFilterLabel()}</span></p>
          </div>
        </div>

        <div className="inline-flex rounded-md p-1 bg-stone-100 text-xs self-start sm:self-auto border border-stone-200/50">
          <button
            onClick={() => setTimeFilter('today')}
            className={`px-3 py-1.5 rounded-sm font-medium transition-all cursor-pointer ${
              timeFilter === 'today'
                ? 'bg-white text-stone-950 font-bold shadow-xs'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Hôm nay
          </button>
          <button
            onClick={() => setTimeFilter('week')}
            className={`px-3 py-1.5 rounded-sm font-medium transition-all cursor-pointer ${
              timeFilter === 'week'
                ? 'bg-white text-stone-950 font-bold shadow-xs'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            7 ngày qua (Tuần)
          </button>
          <button
            onClick={() => setTimeFilter('month')}
            className={`px-3 py-1.5 rounded-sm font-medium transition-all cursor-pointer ${
              timeFilter === 'month'
                ? 'bg-white text-stone-950 font-bold shadow-xs'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            30 ngày qua (Tháng)
          </button>
          <button
            onClick={() => setTimeFilter('all')}
            className={`px-3 py-1.5 rounded-sm font-medium transition-all cursor-pointer ${
              timeFilter === 'all'
                ? 'bg-white text-stone-950 font-bold shadow-xs'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            Tất cả
          </button>
        </div>
      </div>

      {/* 📊 KHỐI THỐNG KÊ LƯỢT XEM VÀ CHỈ SỐ HOẠT ĐỘNG */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Card 1: Lượt truy cập web */}
        <div className="bg-white p-5 rounded-md border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
              Lượt xem Web ({getTimeFilterLabel()})
            </p>
            <h3 className="text-2xl font-bold text-stone-900 mt-1">{analytics.pageViews.toLocaleString()}</h3>
            <p className="text-[11px] text-emerald-600 mt-1 font-medium flex items-center gap-1">
              <span>+{analytics.todayPageViews} hôm nay</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <Globe size={22} />
          </div>
        </div>

        {/* Card 2: Lượt xem sản phẩm */}
        <div className="bg-white p-5 rounded-md border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
              Lượt xem Hoa ({getTimeFilterLabel()})
            </p>
            <h3 className="text-2xl font-bold text-stone-900 mt-1">{analytics.totalProductViews.toLocaleString()}</h3>
            <p className="text-[11px] text-stone-400 mt-1">Khách xem chi tiết ảnh</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
            <Eye size={22} />
          </div>
        </div>

        {/* Card 3: Lượt click đơn hàng */}
        <div className="bg-white p-5 rounded-md border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
              Click Gửi Đơn ({getTimeFilterLabel()})
            </p>
            <h3 className="text-2xl font-bold text-stone-900 mt-1">{analytics.ordersCount}</h3>
            <p className="text-[11px] text-stone-500 mt-1 font-medium flex items-center gap-1">
              <DollarSign size={12} className="text-emerald-600" />
              <span>{analytics.totalRevenue.toLocaleString('vi-VN')}đ</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
            <ShoppingBag size={22} />
          </div>
        </div>

        {/* Card 4: Sản phẩm Hot nhất */}
        <div className="bg-white p-5 rounded-md border border-stone-200 shadow-xs flex items-center justify-between">
          <div className="overflow-hidden pr-2">
            <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
              Mẫu hoa Hot ({getTimeFilterLabel()})
            </p>
            <h3 className="text-sm font-bold text-stone-900 mt-1 truncate max-w-[160px]" title={analytics.topProduct?.name || 'Chưa có'}>
              {analytics.topProduct?.name || 'Chưa có'}
            </h3>
            <p className="text-[11px] text-rose-600 mt-1 font-semibold flex items-center gap-1">
              <Sparkles size={12} />
              <span>{analytics.topProduct?.views || 0} lượt xem</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <Award size={22} />
          </div>
        </div>
      </section>
    </>
  )
})
