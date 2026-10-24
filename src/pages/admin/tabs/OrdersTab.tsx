import React, { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import { isDemoMode, getLocalOrders } from '../../../lib/demoData'
import { isWithinTimeframe } from '../../../lib/analytics'
import type { DraftOrder, TimeFilter } from '../types'

interface OrdersTabProps {
  timeFilter: TimeFilter
  setTimeFilter: (filter: TimeFilter) => void
  onOrdersLoaded?: (orders: DraftOrder[]) => void
}

export const OrdersTab: React.FC<OrdersTabProps> = ({
  timeFilter,
  setTimeFilter,
  onOrdersLoaded
}) => {
  const [orders, setOrders] = useState<DraftOrder[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoadingOrders(true)
    try {
      if (isDemoMode) {
        await new Promise(r => setTimeout(r, 100))
        const local = getLocalOrders()
        setOrders(local)
        onOrdersLoaded?.(local)
      } else {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
        if (error) throw error
        if (data) {
          const list = data as DraftOrder[]
          setOrders(list)
          onOrdersLoaded?.(list)
        }
      }
    } catch {
      const local = getLocalOrders()
      setOrders(local)
      onOrdersLoaded?.(local)
    } finally {
      setLoadingOrders(false)
    }
  }

  const getTimeFilterLabel = () => {
    switch (timeFilter) {
      case 'today': return 'Hôm nay'
      case 'week': return '7 ngày qua'
      case 'month': return '30 ngày qua'
      case 'all': return 'Toàn thời gian'
    }
  }

  const filteredOrders = orders.filter((o) => isWithinTimeframe(o.created_at, timeFilter))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-medium font-serif tracking-wide text-stone-950">
            Lịch sử nhấp chuột đặt hàng của khách
          </h2>
          <p className="text-xs text-stone-400">
            Hiển thị <span className="font-semibold text-stone-850">{filteredOrders.length}</span> đơn trong mốc <span className="text-rose-600 font-semibold">{getTimeFilterLabel()}</span> (Tổng: {filteredOrders.reduce((s, o) => s + (o.total_price || 0), 0).toLocaleString('vi-VN')}đ)
          </p>
        </div>

        <button 
          onClick={fetchOrders}
          className="text-stone-500 hover:text-stone-950 text-xs flex items-center gap-1 cursor-pointer font-semibold uppercase tracking-wider self-start sm:self-auto"
        >
          Tải lại
        </button>
      </div>

      {loadingOrders ? (
        <div className="py-20 flex flex-col items-center justify-center text-stone-400 text-sm gap-2">
          <Loader2 className="animate-spin text-stone-850" size={24} />
          Đang tải lịch sử đơn...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-white border border-stone-100 rounded-sm">
          <p className="text-stone-400 text-sm font-serif italic">
            Không có đơn hàng nào trong mốc {getTimeFilterLabel()}
          </p>
          <button
            onClick={() => setTimeFilter('all')}
            className="mt-3 text-xs text-stone-700 underline font-medium cursor-pointer"
          >
            Xem toàn bộ thời gian
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((o) => (
            <div key={o.id} className="bg-white border border-stone-200 rounded-sm p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 pb-3 mb-4 gap-2">
                <div>
                  <span className="text-xs font-mono font-bold text-stone-850 uppercase tracking-wide">
                    Mã ghi nhận: #{o.id.substring(0, 8)}
                  </span>
                  <span className="text-[10px] text-stone-400 block sm:inline sm:ml-4">
                    {new Date(o.created_at).toLocaleString('vi-VN')}
                  </span>
                </div>
                <span className="text-sm font-bold text-stone-950">
                  Tổng tiền: {o.total_price.toLocaleString('vi-VN')}đ
                </span>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                  Chi tiết sản phẩm đã chọn:
                </p>
                {o.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs text-stone-600">
                    <span>{item.product_name} <span className="text-stone-400">x{item.quantity}</span></span>
                    <span className="font-medium text-stone-850">{(item.price * item.quantity).toLocaleString('vi-VN')}đ</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
