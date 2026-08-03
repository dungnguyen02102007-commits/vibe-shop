import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import { LogOut, Search, Phone, MessageSquare, ArrowLeft, X, ShoppingBag, User } from 'lucide-react';

export default function BuyerPage() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  // Form Auth
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Data người mua
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sellerProfile, setSellerProfile] = useState(null);
  const [loadingSeller, setLoadingSeller] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    fetchProducts();
    return () => subscription.unsubscribe();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setProducts(data || []);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert("Lỗi đăng ký: " + error.message);
      else alert("Đăng ký thành công! Hãy đăng nhập.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert("Lỗi đăng nhập: " + error.message);
    }
    setLoading(false);
  };

  // Mở Modal xem thông tin chi tiết & Profile Người bán
  const openProductModal = async (product) => {
    setSelectedProduct(product);
    setSellerProfile(null);
    setLoadingSeller(true);

    // Query lấy profile của người bán món hàng này
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', product.seller_id)
      .single();

    if (!error && data) {
      setSellerProfile(data);
    }
    setLoadingSeller(false);
  };

  const filteredProducts = products.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- NẾU CHƯA ĐĂNG NHẬP ---
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
          <Link to="/" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 mb-6 transition">
            <ArrowLeft className="w-4 h-4 mr-1" /> Trang chủ
          </Link>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            {isSignUp ? 'Đăng ký Người Mua' : 'Đăng nhập Người Mua'}
          </h2>
          <p className="text-slate-500 text-sm mb-6">Đăng nhập để xem thông tin và liên hệ người bán.</p>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="buyer@example.com" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
              <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="••••••••" />
            </div>

            <button disabled={loading} type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition shadow-lg shadow-blue-200">
              {loading ? 'Đang xử lý...' : isSignUp ? 'Tạo Tài Khoản' : 'Vào Chợ Xem Hàng'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-blue-600 font-medium hover:underline">
              {isSignUp ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký ngay'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- NẾU ĐÃ ĐĂNG NHẬP (GIAO DIỆN CHỢ HÀNG) ---
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <Link to="/" className="text-slate-400 hover:text-slate-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-blue-600" /> Sàn Mua Bán
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600 font-medium hidden sm:inline">{session.user.email}</span>
          <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-1 text-sm text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 transition">
            <LogOut className="w-4 h-4" /> Đăng xuất
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6">
        {/* Ô Tìm Kiếm */}
        <div className="mb-8 max-w-md mx-auto relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm"
          />
        </div>

        {/* Danh Sách Sản Phẩm */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              onClick={() => openProductModal(product)}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer flex flex-col group"
            >
              <div className="overflow-hidden h-48">
                <img src={product.image_url} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition">{product.title}</h3>
                  <p className="text-blue-600 font-bold text-lg mt-1">{product.price.toLocaleString()} VNĐ</p>
                </div>
                <button className="mt-4 w-full text-center text-sm font-medium bg-slate-100 hover:bg-blue-50 hover:text-blue-600 py-2 rounded-lg transition">
                  Xem chi tiết & Liên hệ
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* MODAL CHI TIẾT SẢN PHẨM & PROFILE NGƯỜI BÁN */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative shadow-2xl">
            <button onClick={() => setSelectedProduct(null)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1">
              <X className="w-6 h-6" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <img src={selectedProduct.image_url} alt={selectedProduct.title} className="w-full h-64 md:h-full object-cover rounded-xl" />

              <div className="flex flex-col justify-between space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">{selectedProduct.title}</h2>
                  <p className="text-2xl font-bold text-blue-600 mt-2">{selectedProduct.price.toLocaleString()} VNĐ</p>
                  <div className="mt-4 border-t pt-3">
                    <h4 className="text-sm font-semibold text-slate-700">Mô tả sản phẩm:</h4>
                    <p className="text-slate-600 text-sm mt-1 whitespace-pre-line">{selectedProduct.description || 'Không có mô tả.'}</p>
                  </div>
                </div>

                {/* THÔNG TIN PROFILE NGƯỜI BÁN */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-blue-600" /> Thông tin Người Bán
                  </h4>

                  {loadingSeller ? (
                    <p className="text-xs text-slate-400">Đang tải thông tin liên hệ...</p>
                  ) : sellerProfile ? (
                    <div className="space-y-2 text-sm">
                      <p className="font-semibold text-slate-800">{sellerProfile.full_name || 'Người bán bí ẩn'}</p>
                      
                      {sellerProfile.phone && (
                        <a href={`tel:${sellerProfile.phone}`} className="flex items-center gap-2 text-emerald-600 hover:underline font-medium">
                          <Phone className="w-4 h-4" /> SĐT: {sellerProfile.phone}
                        </a>
                      )}
                      
                      {sellerProfile.zalo && (
                        <a href={`https://zalo.me/${sellerProfile.zalo}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline font-medium">
                          <MessageSquare className="w-4 h-4" /> Zalo: {sellerProfile.zalo}
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Chưa cập nhật thông tin liên hệ.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}