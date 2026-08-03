import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import {
  LogOut, Package, ArrowLeft, PlusCircle, Trash2, Phone,
  MessageSquare, Save, AlertTriangle, Loader2,
} from 'lucide-react';
import { ensureProfile, updateContactInfo, formatPrice } from '../lib/profile';

export default function SellerPage() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async (session) => {
      if (!mounted) return;
      setSession(session);
      if (session?.user) {
        const p = await ensureProfile(session.user);
        if (mounted) setProfile(p);
      } else {
        setProfile(null);
      }
      if (mounted) setBooting(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => load(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => load(session));

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  if (booting) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!session) return <SellerAuth />;

  return <SellerDashboard session={session} profile={profile} setProfile={setProfile} />;
}

/* ---------- Đăng nhập / Đăng ký người bán ---------- */
function SellerAuth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [zalo, setZalo] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (isSignUp) {
      // Nhét thông tin liên hệ vào user_metadata -> ensureProfile sẽ ghi vào
      // bảng profiles ngay khi có session đầu tiên (kể cả sau khi xác nhận email).
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, phone, zalo, role: 'seller' } },
      });

      if (error) setMessage({ type: 'error', text: 'Lỗi đăng ký: ' + error.message });
      else if (!data.session) setMessage({ type: 'ok', text: 'Đã gửi email xác nhận. Xác nhận xong hãy quay lại đăng nhập.' });
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage({ type: 'error', text: 'Lỗi đăng nhập: ' + error.message });
    }
    setLoading(false);
  };

  const inputCls = 'w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        <Link to="/" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 mb-6 transition">
          <ArrowLeft className="w-4 h-4 mr-1" /> Trang chủ
        </Link>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          {isSignUp ? 'Đăng ký Tài khoản Người Bán' : 'Đăng nhập Người Bán'}
        </h2>
        <p className="text-slate-500 text-sm mb-6">Quản lý gian hàng và tải sản phẩm lên hệ thống.</p>

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Họ và Tên</label>
                <input required type="text" value={fullName} onChange={e => setFullName(e.target.value)} className={inputCls} placeholder="Nguyễn Văn A" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
                <input required type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} placeholder="0901234567" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Zalo (số hoặc link)</label>
                <input required type="text" value={zalo} onChange={e => setZalo(e.target.value)} className={inputCls} placeholder="0901234567" />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} placeholder="seller@example.com" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
            <input required type="password" minLength={6} value={password} onChange={e => setPassword(e.target.value)} className={inputCls} placeholder="Tối thiểu 6 ký tự" />
          </div>

          {message && (
            <p className={`text-sm rounded-lg px-3 py-2 ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
              {message.text}
            </p>
          )}

          <button disabled={loading} type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-medium py-3 rounded-xl transition shadow-lg shadow-emerald-200">
            {loading ? 'Đang xử lý...' : isSignUp ? 'Đăng Ký Người Bán' : 'Đăng Nhập'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <button onClick={() => { setIsSignUp(!isSignUp); setMessage(null); }} className="text-emerald-600 font-medium hover:underline">
            {isSignUp ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký ngay'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Khu quản trị của người bán ---------- */
function SellerDashboard({ session, profile, setProfile }) {
  const userId = session.user.id;

  const [products, setProducts] = useState([]);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState(null);

  const fetchMyProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', userId)
      .order('created_at', { ascending: false });

    if (!error) setProducts(data || []);
  }, [userId]);

  useEffect(() => { fetchMyProducts(); }, [fetchMyProducts]);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!imageFile) return setNotice({ type: 'error', text: 'Vui lòng chọn 1 hình ảnh sản phẩm.' });

    setUploading(true);
    setNotice(null);
    try {
      const fileExt = (imageFile.name.split('.').pop() || 'jpg').toLowerCase();
      // Đặt ảnh trong thư mục theo user id -> khớp với Storage policy.
      const filePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, imageFile, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase.from('products').insert([{
        seller_id: userId,
        title,
        price: Number(price),
        description,
        image_url: publicUrl,
        image_path: filePath,
      }]);
      if (insertError) throw insertError;

      setNotice({ type: 'ok', text: 'Đăng sản phẩm thành công.' });
      setTitle(''); setPrice(''); setDescription(''); setImageFile(null);
      e.target.reset();
      fetchMyProducts();
    } catch (err) {
      setNotice({ type: 'error', text: 'Lỗi đăng sản phẩm: ' + err.message });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Xoá sản phẩm "${product.title}"?`)) return;

    const { error } = await supabase.from('products').delete().eq('id', product.id);
    if (error) return setNotice({ type: 'error', text: 'Không xoá được: ' + error.message });

    if (product.image_path) {
      await supabase.storage.from('product-images').remove([product.image_path]);
    }
    fetchMyProducts();
  };

  const missingContact = !profile?.phone && !profile?.zalo;

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <Link to="/" className="text-slate-400 hover:text-slate-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-600" /> Kênh Người Bán
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600 font-medium hidden sm:inline">{session.user.email}</span>
          <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-1 text-sm text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 transition">
            <LogOut className="w-4 h-4" /> Đăng xuất
          </button>
        </div>
      </nav>

      {missingContact && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 text-sm text-amber-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Bạn chưa có SĐT/Zalo. Người mua sẽ không liên hệ được — hãy điền ở ô "Thông tin liên hệ" bên dưới.
        </div>
      )}

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <ContactCard userId={userId} profile={profile} setProfile={setProfile} />

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-emerald-600" /> Đăng Sản Phẩm Mới
            </h2>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên Sản Phẩm</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Ví dụ: Áo sơ mi nam Linen" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Giá (VNĐ)</label>
                <input required type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="250000" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả sản phẩm</label>
                <textarea rows="3" value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Mô tả chi tiết về tình trạng, kích thước..."></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Hình ảnh sản phẩm</label>
                <input required type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
              </div>

              {notice && (
                <p className={`text-sm rounded-lg px-3 py-2 ${notice.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
                  {notice.text}
                </p>
              )}

              <button disabled={uploading} type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition">
                {uploading ? 'Đang tải lên...' : 'Đăng Bài Ngay'}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Sản Phẩm Đã Đăng ({products.length})</h2>
          {products.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300 text-slate-400">
              Bạn chưa có sản phẩm nào. Hãy đăng sản phẩm đầu tiên!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {products.map(product => (
                <div key={product.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
                  <img src={product.image_url} alt={product.title} className="w-full h-48 object-cover bg-slate-100" />
                  <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-800 text-base line-clamp-1">{product.title}</h3>
                      <p className="text-emerald-600 font-semibold text-lg mt-1">{formatPrice(product.price)}</p>
                      <p className="text-slate-500 text-sm mt-2 line-clamp-2">{product.description}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(product)}
                      className="self-start inline-flex items-center gap-1.5 text-sm text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 transition"
                    >
                      <Trash2 className="w-4 h-4" /> Xoá
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/* ---------- Thẻ cập nhật thông tin liên hệ ---------- */
function ContactCard({ userId, profile, setProfile }) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [zalo, setZalo] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name || '');
    setPhone(profile?.phone || '');
    setZalo(profile?.zalo || '');
  }, [profile]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const updated = await updateContactInfo(userId, { full_name: fullName, phone, zalo });
      setProfile(updated);
      setSaved(true);
    } catch (err) {
      alert('Lỗi lưu thông tin: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm';

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <h2 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
        <Phone className="w-5 h-5 text-emerald-600" /> Thông tin liên hệ
      </h2>
      <p className="text-xs text-slate-500 mb-4">Đây là thông tin người mua sẽ nhìn thấy.</p>

      <form onSubmit={handleSave} className="space-y-3">
        <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className={inputCls} placeholder="Tên hiển thị" />
        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} placeholder="Số điện thoại" />
        <div className="relative">
          <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input type="text" value={zalo} onChange={e => setZalo(e.target.value)} className={inputCls + ' pl-9'} placeholder="Zalo (số hoặc link)" />
        </div>
        <button disabled={saving} type="submit" className="w-full inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg transition">
          <Save className="w-4 h-4" /> {saving ? 'Đang lưu...' : saved ? 'Đã lưu' : 'Lưu thông tin'}
        </button>
      </form>
    </div>
  );
}
