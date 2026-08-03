import { supabase } from '../supabaseClient';

/**
 * Đồng bộ bảng `profiles` với tài khoản đang đăng nhập.
 *
 * Lý do cần hàm này: lúc signUp, nếu Supabase bật xác nhận email thì chưa có
 * session -> ghi vào `profiles` sẽ bị RLS chặn và mất SĐT/Zalo. Nên ta nhét
 * thông tin vào user_metadata khi đăng ký, rồi upsert lại ở lần đầu tiên
 * user thực sự có session.
 */
export async function ensureProfile(user) {
  if (!user) return null;

  const meta = user.user_metadata || {};

  // Đã có profile đầy đủ thì thôi, khỏi ghi đè.
  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  const payload = {
    id: user.id,
    email: user.email,
    full_name: existing?.full_name || meta.full_name || '',
    phone: existing?.phone || meta.phone || '',
    zalo: existing?.zalo || meta.zalo || '',
    role: existing?.role || meta.role || 'buyer',
  };

  // Nếu user đăng ký lại ở kênh seller thì nâng vai trò lên seller.
  if (meta.role === 'seller') payload.role = 'seller';

  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Không đồng bộ được profile:', error.message);
    return existing || null;
  }
  return data;
}

/** Cập nhật thông tin liên hệ do người bán tự sửa. */
export async function updateContactInfo(userId, { full_name, phone, zalo }) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ full_name, phone, zalo })
    .eq('id', userId)
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** Định dạng giá an toàn, tránh crash khi price null. */
export function formatPrice(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 'Liên hệ';
  return n.toLocaleString('vi-VN') + ' ₫';
}

/** Chuẩn hoá link Zalo: chấp nhận cả số điện thoại lẫn URL đầy đủ. */
export function zaloHref(zalo) {
  if (!zalo) return null;
  const v = String(zalo).trim();
  if (v.startsWith('http://') || v.startsWith('https://')) return v;
  return `https://zalo.me/${v.replace(/[^0-9]/g, '')}`;
}
