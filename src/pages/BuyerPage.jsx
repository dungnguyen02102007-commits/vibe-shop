    import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Search, 
  ShoppingBag, 
  LogOut, 
  User, 
  Phone, 
  MessageCircle, 
  X, 
  Loader2,
  ExternalLink
} from 'lucide-react';

const BuyerPage = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null); // Lưu sản phẩm đang xem chi tiết

  // Auth states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
    setLoading(true);
    // Kỹ thuật Join: Lấy sản phẩm kèm thông tin profile của seller_id
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        profiles:seller_id (
          full_name,
          phone,
          zalo,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) console.error('Lỗi lấy sản phẩm:', error);
    else setProducts(data);
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    setLoading(false);
  };

  // Lọc sản phẩm theo ô tìm kiếm
  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- GIAO DIỆN ĐĂNG NHẬP ---
  if (!session) {
    return (
      <div className="min-h-screen bg-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
          <div className="flex justify-center mb-6">
            <div className="bg-indigo-600 p-3 rounded-full text-white">
              <ShoppingBag size={32} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">Chào mừng Người Mua</h1>
          <p className="text-center text-slate-500 mb-8">Đăng nhập để khám phá thị trường</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email" placeholder="Email của bạn" required
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password" placeholder="Mật khẩu" required
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
            <button
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition flex justify-center items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Đăng nhập ngay'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- GIAO DIỆN CHÍNH ---
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header & Search */}
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-indigo-600 text-xl flex-shrink-0">
            <ShoppingBag /> Market
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm sản phẩm bạn cần..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full focus:ring-2 focus:ring-indigo-500 transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button 
            onClick={() => supabase.auth.signOut()}
            className="p-2 text-slate-500 hover:text-red-500 transition"
            title="Đăng xuất"
          >
            <LogOut size={24} />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Sản phẩm mới nhất</h2>
        
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div 
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer group"
              >
                <div className="aspect-square overflow-hidden">
                  <img 
                    src={product.image_url} 
                    alt={product.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-slate-800 line-clamp-1">{product.title}</h3>
                  <p className="text-indigo-600 font-extrabold text-lg mt-1">
                    {parseFloat(product.price).toLocaleString()}đ
                  </p>
                  <div className="flex items-center gap-1 mt-3 text-xs text-slate-400">
                    <User size={14} />
                    <span>{product.profiles?.full_name || 'Người bán'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredProducts.length === 0 && !loading && (
          <div className="text-center py-20 text-slate-500">Không tìm thấy sản phẩm nào.</div>
        )}
      </main>

      {/* --- MODAL CHI TIẾT SẢN PHẨM --- */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative">
            <button 
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-white/80 rounded-full hover:bg-white transition"
            >
              <X size={24} />
            </button>

            {/* Ảnh bên trái */}
            <div className="md:w-1/2 h-64 md:h-auto bg-slate-100">
              <img 
                src={selectedProduct.image_url} 
                alt={selectedProduct.title}
                className="w-full h-full object-contain md:object-cover"
              />
            </div>

            {/* Nội dung bên phải */}
            <div className="md:w-1/2 p-6 md:p-10 overflow-y-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">{selectedProduct.title}</h2>
              <p className="text-3xl font-black text-indigo-600 mb-6">
                {parseFloat(selectedProduct.price).toLocaleString()}đ
              </p>
              
              <div className="mb-8">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Mô tả sản phẩm</h4>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {selectedProduct.description || 'Không có mô tả cho sản phẩm này.'}
                </p>
              </div>

              {/* Thông tin người bán */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <User className="text-indigo-600" size={18} /> Thông tin người bán
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-sm">Họ tên:</span>
                    <span className="font-medium">{selectedProduct.profiles?.full_name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-sm">Điện thoại:</span>
                    <span className="font-medium flex items-center gap-1">
                      <Phone size={14} /> {selectedProduct.profiles?.phone}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-6">
                  {/* Nút gọi điện */}
                  <a 
                    href={`tel:${selectedProduct.profiles?.phone}`}
                    className="flex items-center justify-center gap-2 bg-white border border-slate-200 py-3 rounded-xl font-bold hover:bg-slate-100 transition"
                  >
                    <Phone size={18} /> Gọi điện
                  </a>
                  {/* Nút Zalo */}
                  <a 
                    href={`https://zalo.me/${selectedProduct.profiles?.zalo || selectedProduct.profiles?.phone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 bg-blue-500 text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition"
                  >
                    <MessageCircle size={18} /> Chat Zalo
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerPage;