-- ==========================================
-- DỮ LIỆU SEED SẢN PHẨM & CÀI ĐẶT CHO FLOWERWEB
-- ==========================================

-- 1. NẠP CÀI ĐẶT CỬA HÀNG MẶC ĐỊNH
INSERT INTO public.settings (key, value, updated_at) VALUES
  ('shop_name', 'Que Anh Flower', NOW()),
  ('zalo_phone', '0363645261', NOW()),
  ('hotline', '0363645261', NOW()),
  ('shop_address', 'Đình So, Hưng Đạo, Hà Nội', NOW()),
  ('message_template', 'Chào Que Anh Flower, mình muốn đặt các mẫu hoa lụa sau:', NOW())
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = NOW();

-- 2. NẠP DANH SÁCH 22 SẢN PHẨM HOA LỤA ĐÁNH MÃ TỪ #01 ĐẾN #22
INSERT INTO public.products (id, name, price, image_url, status, views_count, created_at) VALUES
  ('prod-01', 'Hoa mã #01', 95000, '/flower-image/ma(1).jpg', 'active', 0, NOW() - INTERVAL '21 days'),
  ('prod-02', 'Hoa mã #02', 380000, '/flower-image/ma(2).jpg', 'active', 0, NOW() - INTERVAL '20 days'),
  ('prod-03', 'Hoa mã #03', 250000, '/flower-image/ma(3).jpg', 'active', 0, NOW() - INTERVAL '19 days'),
  ('prod-04', 'Hoa mã #04', 280000, '/flower-image/ma(4).jpg', 'active', 0, NOW() - INTERVAL '18 days'),
  ('prod-05', 'Hoa mã #05', 300000, '/flower-image/ma(5).jpg', 'active', 0, NOW() - INTERVAL '17 days'),
  ('prod-06', 'Hoa mã #06', 25000, '/flower-image/ma(6).jpg', 'active', 0, NOW() - INTERVAL '16 days'),
  ('prod-07', 'Hoa mã #07', 480000, '/flower-image/ma(7).jpg', 'active', 0, NOW() - INTERVAL '15 days'),
  ('prod-08', 'Hoa mã #08', 350000, '/flower-image/ma(8).jpg', 'active', 0, NOW() - INTERVAL '14 days'),
  ('prod-10', 'Hoa mã #10', 250000, '/flower-image/ma(10).jpg', 'active', 0, NOW() - INTERVAL '12 days'),
  ('prod-12', 'Hoa mã #12', 450000, '/flower-image/ma(12).jpg', 'active', 0, NOW() - INTERVAL '10 days'),
  ('prod-13', 'Hoa mã #13', 290000, '/flower-image/ma(13).jpg', 'active', 0, NOW() - INTERVAL '9 days'),
  ('prod-14', 'Hoa mã #14', 380000, '/flower-image/ma(14).jpg', 'active', 0, NOW() - INTERVAL '8 days'),
  ('prod-15', 'Hoa mã #15', 400000, '/flower-image/ma(15).jpg', 'active', 0, NOW() - INTERVAL '7 days'),
  ('prod-16', 'Hoa mã #16', 300000, '/flower-image/ma(16).jpg', 'active', 0, NOW() - INTERVAL '6 days'),
  ('prod-17', 'Hoa mã #17', 300000, '/flower-image/ma(17).jpg', 'active', 0, NOW() - INTERVAL '5 days'),
  ('prod-18', 'Hoa mã #18', 200000, '/flower-image/ma(18).jpg', 'active', 0, NOW() - INTERVAL '4 days'),
  ('prod-19', 'Hoa mã #19', 420000, '/flower-image/ma(19).jpg', 'active', 0, NOW() - INTERVAL '3 days'),
  ('prod-20', 'Hoa mã #20', 500000, '/flower-image/ma(20).jpg', 'active', 0, NOW() - INTERVAL '2 days'),
  ('prod-21', 'Hoa mã #21', 420000, '/flower-image/ma(21).jpg', 'active', 0, NOW() - INTERVAL '1 day'),
  ('prod-22', 'Hoa mã #22', 300000, '/flower-image/ma(22).jpg', 'active', 0, NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  status = EXCLUDED.status,
  views_count = EXCLUDED.views_count;

-- 3. NẠP LƯỢT TRUY CẬP WEBSITE KHỞI TẠO
INSERT INTO public.page_views (view_date, views_count, updated_at) VALUES
  (CURRENT_DATE - INTERVAL '3 days', 45, NOW()),
  (CURRENT_DATE - INTERVAL '2 days', 68, NOW()),
  (CURRENT_DATE - INTERVAL '1 day', 82, NOW()),
  (CURRENT_DATE, 34, NOW())
ON CONFLICT (view_date) DO NOTHING;
