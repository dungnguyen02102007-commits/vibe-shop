# MarketConnect — Hướng dẫn chạy & vận hành

Nền tảng kết nối **người bán** (đăng ảnh + mô tả + SĐT/Zalo) với **người mua** (xem hàng,
liên hệ trực tiếp). React + Vite + Tailwind v4 + Supabase, deploy trên Vercel.

---

## 1. Thiết lập Supabase (làm 1 lần, bắt buộc)

1. Vào <https://supabase.com/dashboard> → chọn project `qqtxodkpjbyndqtfezfd`.
2. Mở **SQL Editor** → **New query**.
3. Mở file `supabase/setup.sql` trong dự án này, copy toàn bộ, dán vào rồi bấm **Run**.

Script sẽ tự động:

- Tạo/bổ sung bảng `profiles` và `products` (kể cả cột `image_path` còn thiếu).
- Bật Row Level Security với quy tắc: ai cũng **xem** được hàng, nhưng chỉ chủ sở hữu
  mới **sửa/xoá** hàng của mình.
- Tạo bucket Storage `product-images` ở chế độ công khai + policy upload theo thư mục
  từng người bán.
- Tạo trigger tự sinh `profiles` khi có tài khoản mới.
- Bật Realtime cho bảng `products` (hàng mới hiện ngay, không cần F5).

### Tuỳ chọn: tắt xác nhận email khi đang thử nghiệm

**Authentication → Sign In / Providers → Email → tắt "Confirm email"**.
Bật lại trước khi mở cho người dùng thật.

---

## 2. Chạy trên máy

```bash
npm install
npm run dev
```

Mở <http://localhost:5173>.

Biến môi trường nằm trong `.env.local`:

```
VITE_SUPABASE_URL=https://qqtxodkpjbyndqtfezfd.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

> Lưu ý: `VITE_SUPABASE_URL` phải là URL gốc, **không** có đuôi `/rest/v1/`.

---

## 3. Deploy lên Vercel

Biến môi trường đã được commit sẵn trong file `.env` ở gốc dự án, nên Vercel tự đọc
lúc build — **không cần** vào Settings → Environment Variables nữa.

> `VITE_SUPABASE_ANON_KEY` là *publishable key*: nó vốn đã nằm trong bundle JavaScript
> gửi xuống trình duyệt, nên commit vào repo không làm lộ thêm gì. Thứ thực sự bảo vệ
> dữ liệu là Row Level Security trong `supabase/setup.sql`.
> Tuyệt đối **không** đặt `service_role` key vào `.env`.

Sau đó:

```bash
git add -A
git commit -m "Hoan thien trang seller & buyer"
git push
```

Vercel sẽ tự build và deploy. File `vercel.json` đã cấu hình rewrite để các đường dẫn
`/seller`, `/buyer` không bị lỗi 404 khi tải lại trang.

---

## 4. Luồng sử dụng

| Vai trò | Đường dẫn | Việc làm được |
|---|---|---|
| Khách vãng lai | `/buyer` | Xem toàn bộ sản phẩm, tìm kiếm, xem ảnh và mô tả |
| Người mua đã đăng nhập | `/buyer` | Thêm: xem SĐT và Zalo của người bán |
| Người bán | `/seller` | Đăng ký, cập nhật SĐT/Zalo, đăng và xoá sản phẩm |

Thông tin liên hệ bị khoá sau đăng nhập để hạn chế bot quét số điện thoại, đồng thời
vẫn giữ trang mở cho SEO và người dùng mới.

---

## 5. Cấu trúc thư mục

```
src/
  App.jsx              Định tuyến
  supabaseClient.js    Khởi tạo Supabase
  lib/profile.js       Đồng bộ profile, định dạng giá, xử lý link Zalo
  pages/
    LandingPage.jsx    Trang giới thiệu
    SellerPage.jsx     Đăng nhập + bảng điều khiển người bán
    BuyerPage.jsx      Chợ hàng + modal chi tiết và liên hệ
supabase/setup.sql     Toàn bộ thiết lập cơ sở dữ liệu
```

---

## 6. Việc nên làm tiếp

- Nút "Nhắn Zalo" gắn sẵn nội dung tin nhắn mẫu kèm tên sản phẩm.
- Phân loại danh mục và lọc theo khoảng giá.
- Trang chi tiết có đường dẫn riêng (`/product/:id`) để chia sẻ link và làm SEO.
- Đếm lượt xem, lượt bấm liên hệ để đo hiệu quả từng tin đăng.
- Kiểm duyệt tin đăng trước khi hiển thị công khai.
