-- ========================================================
-- SCHEMA CHO CƠ SỞ DỮ LIỆU FLOWERWEB (SUPABASE) - ĐÃ VÁ BẢO MẬT
-- ========================================================

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

-- ========================================================
-- POLICIES BẢO MẬT CHO BẢNG SẢN PHẨM (products)
-- ========================================================
-- Khách vãng lai CHỈ được quyền xem sản phẩm
DROP POLICY IF EXISTS "Public all products" ON public.products;
DROP POLICY IF EXISTS "Public read products" ON public.products;
CREATE POLICY "Public read products" ON public.products
  FOR SELECT USING (true);

-- Chỉ Admin đã đăng nhập mới có quyền Thêm / Sửa / Xóa sản phẩm
DROP POLICY IF EXISTS "Admin manage products" ON public.products;
CREATE POLICY "Admin manage products" ON public.products
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ========================================================
-- POLICIES BẢO MẬT CHO BẢNG CÀI ĐẶT (settings)
-- ========================================================
-- Khách xem cấu hình cửa hàng (hotline, tên shop, zalo...)
DROP POLICY IF EXISTS "Public write settings" ON public.settings;
DROP POLICY IF EXISTS "Public read settings" ON public.settings;
CREATE POLICY "Public read settings" ON public.settings
  FOR SELECT USING (true);

-- Chỉ Admin đã đăng nhập mới có quyền cập nhật cấu hình shop
DROP POLICY IF EXISTS "Admin manage settings" ON public.settings;
CREATE POLICY "Admin manage settings" ON public.settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ========================================================
-- POLICIES BẢO MẬT CHO BẢNG ĐƠN HÀNG (orders)
-- ========================================================
-- Khách gửi đơn hàng (chỉ INSERT), KHÔNG ĐƯỢC XEM đơn của người khác
DROP POLICY IF EXISTS "Public read orders" ON public.orders;
DROP POLICY IF EXISTS "Public update orders" ON public.orders;
DROP POLICY IF EXISTS "Public create orders" ON public.orders;
CREATE POLICY "Public create orders" ON public.orders
  FOR INSERT WITH CHECK (true);

-- Chỉ Admin đã đăng nhập mới được xem và quản trị đơn hàng
DROP POLICY IF EXISTS "Admin manage orders" ON public.orders;
CREATE POLICY "Admin manage orders" ON public.orders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ========================================================
-- POLICIES BẢO MẬT CHO THỐNG KÊ (page_views)
-- ========================================================
DROP POLICY IF EXISTS "Public write page_views" ON public.page_views;
DROP POLICY IF EXISTS "Public read page_views" ON public.page_views;
CREATE POLICY "Public read page_views" ON public.page_views
  FOR SELECT USING (true);
CREATE POLICY "Public insert page_views" ON public.page_views
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update page_views" ON public.page_views
  FOR UPDATE USING (true);

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

-- Khách gửi góp ý ẩn danh (chỉ INSERT), KHÔNG ĐƯỢC XEM góp ý của người khác
DROP POLICY IF EXISTS "Public create feedback" ON public.anonymous_feedback;
DROP POLICY IF EXISTS "Public manage feedback" ON public.anonymous_feedback;
CREATE POLICY "Public create feedback" ON public.anonymous_feedback
  FOR INSERT WITH CHECK (true);

-- Chỉ Admin mới được xem và quản lý danh sách góp ý
CREATE POLICY "Admin manage feedback" ON public.anonymous_feedback
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

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

-- Khách chỉ được xem review và ảnh thật
DROP POLICY IF EXISTS "Public read showcase" ON public.shop_showcase;
DROP POLICY IF EXISTS "Public manage showcase" ON public.shop_showcase;
CREATE POLICY "Public read showcase" ON public.shop_showcase
  FOR SELECT USING (true);

-- Chỉ Admin mới được thêm/sửa/xóa ảnh thật & review
CREATE POLICY "Admin manage showcase" ON public.shop_showcase
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

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

-- Khách chỉ được xem banner
DROP POLICY IF EXISTS "Public read banners" ON public.shop_banners;
DROP POLICY IF EXISTS "Public manage banners" ON public.shop_banners;
CREATE POLICY "Public read banners" ON public.shop_banners
  FOR SELECT USING (true);

-- Chỉ Admin mới được cấu hình banner
CREATE POLICY "Admin manage banners" ON public.shop_banners
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ========================================================
-- 8. CẤU HÌNH SUPABASE STORAGE CHO BUCKET ẢNH ('products')
-- ========================================================
-- Khởi tạo bucket 'products' công khai (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Cho phép khách công khai xem ảnh
DROP POLICY IF EXISTS "Public read storage products" ON storage.objects;
CREATE POLICY "Public read storage products" ON storage.objects
  FOR SELECT USING (bucket_id = 'products');

-- Chỉ Admin đã đăng nhập mới được upload ảnh lên storage
DROP POLICY IF EXISTS "Admin upload storage products" ON storage.objects;
CREATE POLICY "Admin upload storage products" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'products');

-- Chỉ Admin đã đăng nhập mới được sửa ảnh trên storage
DROP POLICY IF EXISTS "Admin update storage products" ON storage.objects;
CREATE POLICY "Admin update storage products" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'products');

-- Chỉ Admin đã đăng nhập mới được xóa ảnh trên storage
DROP POLICY IF EXISTS "Admin delete storage products" ON storage.objects;
CREATE POLICY "Admin delete storage products" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'products');
