import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  PlusCircle, 
  LogOut, 
  Package, 
  Image as ImageIcon, 
  Loader2, 
  LayoutDashboard,
  UploadCloud,
  Phone,
  User
} from 'lucide-react';

const SellerPage = () => {
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [products, setProducts] = useState([]);
  
  // Auth states
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  // Product form states
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    // Kiểm tra session hiện tại
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProducts(session.user.id);
    });

    // Lắng nghe thay đổi auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProducts(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProducts = async (userId) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) console.error('Lỗi lấy sản phẩm:', error);
    else setProducts(data);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegistering) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, phone: phone, role: 'seller' }
          }
        });
        if (error) throw error;
        alert('Đăng ký thành công! Vui lòng kiểm tra email (nếu có cấu hình) hoặc đăng nhập.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadProduct = async (e) => {
    e.preventDefault();
    if (!imageFile) return alert('Vui lòng chọn ảnh sản phẩm');

    setLoading(true);
    try {
      // 1. Upload ảnh lên Storage
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      // 2. Lấy URL công khai
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      // 3. Lưu thông tin vào Database
      const { error: insertError } = await supabase.from('products').insert([
        {
          seller_id: session.user.id,
          title,
          price: parseFloat(price),
          description,
          image_url: publicUrl
        }
      ]);

      if (insertError) throw insertError;

      alert('Đăng sản phẩm thành công!');
      // Reset form
      setTitle(''); setPrice(''); setDescription(''); setImageFile(null);
      fetchProducts(session.user.id);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- GIAO DIỆN CHƯA ĐĂNG NHẬP ---
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-800">Kênh Người Bán</h1>
            <p className="text-slate-500">{isRegistering ? 'Tạo tài khoản bán hàng mới' : 'Đăng nhập vào hệ thống quản lý'}</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {isRegistering && (
              <>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                  <input
                    type="text" placeholder="Họ và tên" required
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={fullName} onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                  <input
                    type="text" placeholder="Số điện thoại / Zalo" required
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={phone} onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </>
            )}
            <input
              type="email" placeholder="Email" required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password" placeholder="Mật khẩu" required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
            <button
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 transition flex justify-center items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : (isRegistering ? 'Đăng ký ngay' : 'Đăng nhập')}
            </button>
          </form>

          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="w-full mt-4 text-sm text-indigo-600 hover:underline"
          >
            {isRegistering ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký ngay'}
          </button>
        </div>
      </div>
    );
  }

  // --- GIAO DIỆN DASHBOARD (ĐÃ ĐĂNG NHẬP) ---
  return (
    <div className="min-h-screen bg-slate-100 pb-12">
      {/* Topbar */}
      <nav className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-indigo-600 text-xl">
            <LayoutDashboard /> Dashboard Seller
          </div>
          <button 
            onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-2 text-slate-600 hover:text-red-600 transition"
          >
            <LogOut size={20} /> <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cột trái: Form đăng bài */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <PlusCircle className="text-indigo-600" /> Đăng sản phẩm mới
            </h2>
            <form onSubmit={handleUploadProduct} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Tên sản phẩm</label>
                <input
                  type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Giá (VNĐ)</label>
                <input
                  type="number" required value={price} onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Mô tả</label>
                <textarea
                  rows="3" value={description} onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Hình ảnh</label>
                <div className="relative border-2 border-dashed border-slate-300 rounded-lg p-4 hover:border-indigo-500 transition text-center">
                  <input
                    type="file" accept="image/*" required
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => setImageFile(e.target.files[0])}
                  />
                  {imageFile ? (
                    <p className="text-xs text-emerald-600 font-medium">{imageFile.name}</p>
                  ) : (
                    <div className="flex flex-col items-center text-slate-400">
                      <UploadCloud size={30} />
                      <span className="text-xs mt-2">Nhấn để chọn ảnh</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                disabled={loading}
                className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-bold hover:bg-slate-800 transition flex justify-center items-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Đăng Sản Phẩm'}
              </button>
            </form>
          </div>
        </div>

        {/* Cột phải: Danh sách sản phẩm */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Package className="text-indigo-600" /> Sản phẩm của bạn ({products.length})
          </h2>
          {products.length === 0 ? (
            <div className="bg-white p-12 rounded-xl text-center border border-dashed border-slate-300">
              <ImageIcon className="mx-auto text-slate-300 mb-2" size={48} />
              <p className="text-slate-500">Bạn chưa có sản phẩm nào đang bán.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map((item) => (
                <div key={item.id} className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex gap-4">
                  <img 
                    src={item.image_url} 
                    alt={item.title} 
                    className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex flex-col justify-between overflow-hidden">
                    <div>
                      <h3 className="font-bold text-slate-800 truncate">{item.title}</h3>
                      <p className="text-indigo-600 font-bold text-sm">{parseFloat(item.price).toLocaleString()}đ</p>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SellerPage;