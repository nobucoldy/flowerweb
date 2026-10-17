-- ==========================================
-- SCHEMA CHO CƠ SỞ DỮ LIỆU FLOWERWEB (SUPABASE)
-- ==========================================

-- 1. BẢNG SẢN PHẨM (products)
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  image_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  views_count INTEGER NOT NULL DEFAULT 0,
  category TEXT DEFAULT 'Hoa lụa',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. BẢNG CÀI ĐẶT CỬA HÀNG (settings)
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. BẢNG ĐƠN HÀNG (orders)
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  items JSONB NOT NULL DEFAULT '[]'::JSONB,
  total_price NUMERIC NOT NULL DEFAULT 0,
  customer_name TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. BẢNG THỐNG KÊ LƯỢT TRUY CẬP (page_views)
CREATE TABLE IF NOT EXISTS public.page_views (
  id SERIAL PRIMARY KEY,
  view_date DATE NOT NULL DEFAULT CURRENT_DATE UNIQUE,
  views_count INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TẠO CHỈ MỤC TĂNG TỐC TRUY VẤN
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_views ON public.products(views_count DESC);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);

-- BẬT ROW LEVEL SECURITY (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- POLICIES CHO PHÉP ĐỌC CÔNG KHAI VÀ GHI DÀNH CHO KHÁCH / ADMIN
-- Cho phép mọi người xem sản phẩm active
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public all products" ON public.products FOR ALL USING (true);

-- Cho phép mọi người đọc cài đặt
CREATE POLICY "Public read settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Public write settings" ON public.settings FOR ALL USING (true);

-- Cho phép khách gửi đơn hàng
CREATE POLICY "Public create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Public update orders" ON public.orders FOR UPDATE USING (true);

-- Cho phép đọc và ghi lượt truy cập
CREATE POLICY "Public read page_views" ON public.page_views FOR SELECT USING (true);
CREATE POLICY "Public write page_views" ON public.page_views FOR ALL USING (true);

-- HÀM TĂNG LƯỢT XEM SẢN PHẨM (RPC Function)
CREATE OR REPLACE FUNCTION public.increment_product_view(product_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.products
  SET views_count = views_count + 1
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- HÀM TĂNG LƯỢT TRUY CẬP WEBSITE (RPC Function)
CREATE OR REPLACE FUNCTION public.increment_page_view()
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.page_views (view_date, views_count, updated_at)
  VALUES (CURRENT_DATE, 1, NOW())
  ON CONFLICT (view_date)
  DO UPDATE SET 
    views_count = public.page_views.views_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================================
-- 5. BẢNG HÒM THƯ GÓP Ý ẨN DANH (anonymous_feedback)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.anonymous_feedback (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  content TEXT NOT NULL,
  sender_tag TEXT DEFAULT 'Khách ẩn danh',
  rating INTEGER DEFAULT 5,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_created ON public.anonymous_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_read ON public.anonymous_feedback(is_read);

ALTER TABLE public.anonymous_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public create feedback" ON public.anonymous_feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Public manage feedback" ON public.anonymous_feedback FOR ALL USING (true);

-- ========================================================
-- 6. BẢNG ẢNH THẬT & REVIEW CỦA SHOP (shop_showcase)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.shop_showcase (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  image_url TEXT NOT NULL,
  title TEXT NOT NULL,
  customer_name TEXT DEFAULT 'Khách ẩn danh',
  review_text TEXT,
  rating INTEGER NOT NULL DEFAULT 5,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_showcase_pinned ON public.shop_showcase(is_pinned DESC, created_at DESC);

ALTER TABLE public.shop_showcase ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read showcase" ON public.shop_showcase FOR SELECT USING (true);
CREATE POLICY "Public manage showcase" ON public.shop_showcase FOR ALL USING (true);

-- ========================================================
-- 7. BẢNG BANNER TRANG CHỦ (shop_banners)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.shop_banners (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  image_url TEXT NOT NULL,
  title TEXT,
  sub_title TEXT,
  link_url TEXT DEFAULT '/showcase',
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_banners_order ON public.shop_banners(order_index ASC, created_at DESC);

ALTER TABLE public.shop_banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read banners" ON public.shop_banners FOR SELECT USING (true);
CREATE POLICY "Public manage banners" ON public.shop_banners FOR ALL USING (true);


