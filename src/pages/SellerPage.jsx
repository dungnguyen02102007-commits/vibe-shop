import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import { Upload, LogOut, Package, ArrowLeft, PlusCircle, User, Phone, MessageSquare } from 'lucide-react';

export default function SellerPage() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  // Form Auth
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [zalo, setZalo] = useState('');

  // Form Sản phẩm & Danh sách
  const [products, setProducts] = useState([]);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchMyProducts(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchMyProducts(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Đăng ký / Đăng nhập
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } }
      });

      if (error) {
        alert("Lỗi đăng ký: " + error.message);
      } else if (data?.user) {
        // Cập nhật profile thông tin điện thoại, zalo, role seller
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email,
          full_name: fullName,
          phone,
          zalo,
          role: 'seller'
        });
        alert("Đăng ký thành công!");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert("Lỗi đăng nhập: " + error.message);
    }
    setLoading(false);
  };

  // Lấy danh sách sản phẩm của tôi
  const fetchMyProducts = async (userId) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', userId)
      .order('created_at', { ascending: false });

    if (!error) setProducts(data || []);
  };

  // Đăng sản phẩm mới
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!imageFile) return alert("Vui lòng chọn 1 hình ảnh sản phẩm!");

    setUploading(true);
    try {
      // 1. Upload ảnh lên Supabase Storage
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      // Lấy URL công khai của ảnh
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      // 2. Lưu thông tin vào CSDL
      const { error: insertError } = await supabase.from('products').insert([
        {
          seller_id: session.user.id,
          title,
          price: Number(price),
          description,
          image_url: publicUrl
        }
      ]);

      if (insertError) throw insertError;

      alert("Đăng sản phẩm thành công!");
      setTitle('');
      setPrice('');
      setDescription('');
      setImageFile(null);
      fetchMyProducts(session.user.id);
    } catch (err) {
      alert("Lỗi đăng sản phẩm: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  // --- NẾU CHƯA ĐĂNG NHẬP ---
  if (!session) {
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
                  <input required type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Nguyễn Văn A" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
                  <input required type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="0901234567" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Link Zalo (hoặc SĐT Zalo)</label>
                  <input required type="text" value={zalo} onChange={e => setZalo(e.target.value)} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="0901234567" />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="seller@example.com" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
              <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="••••••••" />
            </div>

            <button disabled={loading} type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl transition shadow-lg shadow-emerald-200">
              {loading ? 'Đang xử lý...' : isSignUp ? 'Đăng Ký Người Bán' : 'Đăng Nhập'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-emerald-600 font-medium hover:underline">
              {isSignUp ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký ngay'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- NẾU ĐÃ ĐĂNG NHẬP ---
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

      <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Đăng Bài */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
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
              <input required type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="250000" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả sản phẩm</label>
              <textarea rows="3" value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Mô tả chi tiết về tình trạng, kích thước..."></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hình ảnh sản phẩm</label>
              <input required type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
            </div>

            <button disabled={uploading} type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg transition">
              {uploading ? 'Đang tải lên...' : 'Đăng Bài Ngay'}
            </button>
          </form>
        </div>

        {/* Danh Sách Đã Đăng */}
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
                  <img src={product.image_url} alt={product.title} className="w-full h-48 object-cover" />
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-slate-800 text-base line-clamp-1">{product.title}</h3>
                      <p className="text-emerald-600 font-semibold text-lg mt-1">{product.price.toLocaleString()} VNĐ</p>
                      <p className="text-slate-500 text-sm mt-2 line-clamp-2">{product.description}</p>
                    </div>
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