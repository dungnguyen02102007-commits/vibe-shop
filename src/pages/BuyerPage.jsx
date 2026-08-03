import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import {
  LogOut, Search, Phone, MessageSquare, ArrowLeft, X,
  ShoppingBag, User, Lock, Loader2, PackageOpen,
} from 'lucide-react';
import { ensureProfile, formatPrice, zaloHref } from '../lib/profile';

export default function BuyerPage() {
  const [session, setSession] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sellerProfile, setSellerProfile] = useState(null);
  const [loadingSeller, setLoadingSeller] = useState(false);

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error('Lỗi tải sản phẩm:', error.message);
    else setProducts(data || []);
    setLoadingProducts(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) ensureProfile(session.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        ensureProfile(session.user);
        setAuthOpen(false);
      }
    });

    fetchProducts();

    // Live: sản phẩm mới xuất hiện ngay không cần F5
    const channel = supabase
      .channel('public:products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchProducts)
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [fetchProducts]);

  // Khi đã đăng nhập và đang mở 1 sản phẩm -> nạp thông tin liên hệ người bán
  useEffect(() => {
    if (!selectedProduct || !session) {
      setSellerProfile(null);
      return;
    }
    let cancelled = false;
    setLoadingSeller(true);

    supabase
      .from('profiles')
      .select('full_name, phone, zalo')
      .eq('id', selectedProduct.seller_id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) {
          setSellerProfile(data || null);
          setLoadingSeller(false);
        }
      });

    return () => { cancelled = true; };
  }, [selectedProduct, session]);

  const filteredProducts = products.filter(p => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (p.title || '').toLowerCase().includes(q)
      || (p.description || '').toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center space-x-3">
          <Link to="/" className="text-slate-400 hover:text-slate-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-blue-600" /> Sàn Mua Bán
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {session ? (
            <>
              <span className="text-sm text-slate-600 font-medium hidden sm:inline">{session.user.email}</span>
              <button
                onClick={() => supabase.auth.signOut()}
                className="flex items-center gap-1 text-sm text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 transition"
              >
                <LogOut className="w-4 h-4" /> Đăng xuất
              </button>
            </>
          ) : (
            <button
              onClick={() => setAuthOpen(true)}
              className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
            >
              Đăng nhập
            </button>
          )}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6">
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

        {loadingProducts ? (
          <div className="flex justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white p-16 text-center rounded-2xl border border-dashed border-slate-300 text-slate-400">
            <PackageOpen className="w-10 h-10 mx-auto mb-3 opacity-60" />
            {searchTerm ? 'Không tìm thấy sản phẩm nào phù hợp.' : 'Chưa có sản phẩm nào được đăng.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition cursor-pointer flex flex-col group"
              >
                <div className="overflow-hidden h-48 bg-slate-100">
                  <img
                    src={product.image_url}
                    alt={product.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition">{product.title}</h3>
                    <p className="text-blue-600 font-bold text-lg mt-1">{formatPrice(product.price)}</p>
                  </div>
                  <button className="mt-4 w-full text-center text-sm font-medium bg-slate-100 hover:bg-blue-50 hover:text-blue-600 py-2 rounded-lg transition">
                    Xem chi tiết & Liên hệ
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL CHI TIẾT SẢN PHẨM */}
      {selectedProduct && (
        <div
          className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <img
                src={selectedProduct.image_url}
                alt={selectedProduct.title}
                className="w-full h-64 md:h-full object-cover rounded-xl bg-slate-100"
              />

              <div className="flex flex-col justify-between space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 pr-8">{selectedProduct.title}</h2>
                  <p className="text-2xl font-bold text-blue-600 mt-2">{formatPrice(selectedProduct.price)}</p>
                  <div className="mt-4 border-t pt-3">
                    <h4 className="text-sm font-semibold text-slate-700">Mô tả sản phẩm:</h4>
                    <p className="text-slate-600 text-sm mt-1 whitespace-pre-line">
                      {selectedProduct.description || 'Không có mô tả.'}
                    </p>
                  </div>
                </div>

                {/* KHU VỰC LIÊN HỆ - CHỈ MỞ KHI ĐÃ ĐĂNG NHẬP */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-blue-600" /> Thông tin Người Bán
                  </h4>

                  {!session ? (
                    <div className="space-y-3 pt-1">
                      <p className="text-sm text-slate-500 flex items-start gap-2">
                        <Lock className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
                        Đăng nhập để xem số điện thoại và Zalo của người bán.
                      </p>
                      <button
                        onClick={() => setAuthOpen(true)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-lg transition"
                      >
                        Đăng nhập để liên hệ
                      </button>
                    </div>
                  ) : loadingSeller ? (
                    <p className="text-xs text-slate-400">Đang tải thông tin liên hệ...</p>
                  ) : sellerProfile ? (
                    <div className="space-y-2 text-sm">
                      <p className="font-semibold text-slate-800">{sellerProfile.full_name || 'Người bán'}</p>

                      {sellerProfile.phone ? (
                        <a href={`tel:${sellerProfile.phone}`} className="flex items-center gap-2 text-emerald-600 hover:underline font-medium">
                          <Phone className="w-4 h-4" /> SĐT: {sellerProfile.phone}
                        </a>
                      ) : null}

                      {zaloHref(sellerProfile.zalo) ? (
                        <a
                          href={zaloHref(sellerProfile.zalo)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 text-blue-600 hover:underline font-medium"
                        >
                          <MessageSquare className="w-4 h-4" /> Zalo: {sellerProfile.zalo}
                        </a>
                      ) : null}

                      {!sellerProfile.phone && !sellerProfile.zalo && (
                        <p className="text-xs text-slate-400">Người bán chưa cập nhật thông tin liên hệ.</p>
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

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </div>
  );
}

/* ---------- Modal đăng nhập / đăng ký người mua ---------- */
function AuthModal({ onClose }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, role: 'buyer' } },
      });
      if (error) setMessage({ type: 'error', text: error.message });
      else if (!data.session) setMessage({ type: 'ok', text: 'Đã gửi email xác nhận. Vui lòng kiểm tra hộp thư rồi đăng nhập.' });
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage({ type: 'error', text: error.message });
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100 relative"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          {isSignUp ? 'Đăng ký Người Mua' : 'Đăng nhập'}
        </h2>
        <p className="text-slate-500 text-sm mb-6">Cần tài khoản để xem thông tin liên hệ của người bán.</p>

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Họ và Tên</label>
              <input
                required type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Nguyễn Văn A"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              required type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="buyer@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
            <input
              required type="password" minLength={6} value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Tối thiểu 6 ký tự"
            />
          </div>

          {message && (
            <p className={`text-sm rounded-lg px-3 py-2 ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
              {message.text}
            </p>
          )}

          <button
            disabled={loading} type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-3 rounded-xl transition shadow-lg shadow-blue-200"
          >
            {loading ? 'Đang xử lý...' : isSignUp ? 'Tạo Tài Khoản' : 'Đăng Nhập'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <button
            onClick={() => { setIsSignUp(!isSignUp); setMessage(null); }}
            className="text-blue-600 font-medium hover:underline"
          >
            {isSignUp ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký ngay'}
          </button>
        </div>
      </div>
    </div>
  );
}
