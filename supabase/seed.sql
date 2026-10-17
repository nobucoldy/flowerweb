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

-- 2. NẠP DANH SÁCH 12 SẢN PHẨM HOA LỤA ĐÁNH MÃ TỪ #01 ĐẾN #12
INSERT INTO public.products (id, name, price, image_url, status, views_count, created_at) VALUES
  (
    'prod-01', 
    'Hoa mã #01', 
    380000, 
    'https://images.unsplash.com/photo-1561181286-d3fee7d55364?q=80&w=600&auto=format&fit=crop', 
    'active', 
    142, 
    NOW() - INTERVAL '10 days'
  ),
  (
    'prod-02', 
    'Hoa mã #02', 
    450000, 
    'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=600&auto=format&fit=crop', 
    'active', 
    98, 
    NOW() - INTERVAL '9 days'
  ),
  (
    'prod-03', 
    'Hoa mã #03', 
    290000, 
    'https://images.unsplash.com/photo-1520763185298-1b434c919102?q=80&w=600&auto=format&fit=crop', 
    'active', 
    215, 
    NOW() - INTERVAL '8 days'
  ),
  (
    'prod-04', 
    'Hoa mã #04', 
    320000, 
    'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?q=80&w=600&auto=format&fit=crop', 
    'active', 
    85, 
    NOW() - INTERVAL '7 days'
  ),
  (
    'prod-05', 
    'Hoa mã #05', 
    520000, 
    'https://images.unsplash.com/photo-1587556930799-8dca6aef3dc5?q=80&w=600&auto=format&fit=crop', 
    'active', 
    176, 
    NOW() - INTERVAL '6 days'
  ),
  (
    'prod-06', 
    'Hoa mã #06', 
    680000, 
    'https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?q=80&w=600&auto=format&fit=crop', 
    'active', 
    64, 
    NOW() - INTERVAL '5 days'
  ),
  (
    'prod-07', 
    'Hoa mã #07', 
    350000, 
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop', 
    'active', 
    129, 
    NOW() - INTERVAL '4 days'
  ),
  (
    'prod-08', 
    'Hoa mã #08', 
    250000, 
    'https://images.unsplash.com/photo-1563245372-f21724e3856d?q=80&w=600&auto=format&fit=crop', 
    'active', 
    110, 
    NOW() - INTERVAL '3 days'
  ),
  (
    'prod-09', 
    'Hoa mã #09', 
    850000, 
    'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=600&auto=format&fit=crop', 
    'active', 
    312, 
    NOW() - INTERVAL '2 days'
  ),
  (
    'prod-10', 
    'Hoa mã #10', 
    490000, 
    'https://images.unsplash.com/photo-1567696911980-2eed69a46042?q=80&w=600&auto=format&fit=crop', 
    'active', 
    93, 
    NOW() - INTERVAL '1 day'
  ),
  (
    'prod-11', 
    'Hoa mã #11', 
    420000, 
    'https://images.unsplash.com/photo-1508610048659-a06b669e3321?q=80&w=600&auto=format&fit=crop', 
    'active', 
    77, 
    NOW() - INTERVAL '12 hours'
  ),
  (
    'prod-12', 
    'Hoa mã #12', 
    280000, 
    'https://images.unsplash.com/photo-1528722828814-77b9b83aafb2?q=80&w=600&auto=format&fit=crop', 
    'active', 
    155, 
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  status = EXCLUDED.status;

-- 3. NẠP LƯỢT TRUY CẬP WEBSITE KHỞI TẠO
INSERT INTO public.page_views (view_date, views_count, updated_at) VALUES
  (CURRENT_DATE - INTERVAL '3 days', 45, NOW()),
  (CURRENT_DATE - INTERVAL '2 days', 68, NOW()),
  (CURRENT_DATE - INTERVAL '1 day', 82, NOW()),
  (CURRENT_DATE, 34, NOW())
ON CONFLICT (view_date) DO NOTHING;
