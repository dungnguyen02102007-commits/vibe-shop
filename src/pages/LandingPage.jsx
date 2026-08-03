import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Store, ArrowRight, ShieldCheck, Zap, Users } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* HEADER */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <ShoppingBag className="text-white w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                MarketConnect
              </span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link to="/seller" className="text-slate-600 hover:text-indigo-600 font-medium transition">Góc Người Bán</Link>
              <Link to="/buyer" className="text-slate-600 hover:text-indigo-600 font-medium transition">Góc Người Mua</Link>
            </nav>

            {/* Auth Buttons */}
            <div className="flex items-center gap-4">
              <Link to="/buyer" className="bg-indigo-600 text-white px-5 py-2 rounded-full font-medium hover:bg-indigo-700 transition shadow-sm shadow-indigo-200">
                Bắt đầu ngay
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-20">
        {/* HERO SECTION */}
        <section className="relative py-20 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-6 tracking-tight">
              Kết nối trực tiếp <br />
              <span className="text-indigo-600 italic">Người Bán & Người Mua</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-slate-600 mb-10 leading-relaxed">
              Nền tảng thương mại hiện đại giúp tối ưu hóa quy trình giao dịch. 
              Nhanh chóng, minh bạch và hoàn toàn miễn phí cho bước khởi đầu.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/seller" className="flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-xl font-semibold hover:bg-slate-800 transition transform hover:-translate-y-1">
                <Store size={20} />
                Tôi muốn Bán hàng
              </Link>
              <Link to="/buyer" className="flex items-center justify-center gap-2 bg-white text-slate-900 border-2 border-slate-200 px-8 py-4 rounded-xl font-semibold hover:border-indigo-600 hover:text-indigo-600 transition transform hover:-translate-y-1">
                <ShoppingBag size={20} />
                Tôi muốn Mua hàng
              </Link>
            </div>
          </div>
          
          {/* Background decoration */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 opacity-10 pointer-events-none">
            <div className="absolute top-10 left-1/4 w-72 h-72 bg-indigo-400 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-purple-400 rounded-full blur-3xl"></div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-12">
              <div className="text-center p-6">
                <div className="bg-indigo-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Zap className="text-indigo-600 w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">Nhanh chóng</h3>
                <p className="text-slate-500">Đăng tin bán hàng chỉ trong 30 giây với giao diện cực kỳ đơn giản.</p>
              </div>
              <div className="text-center p-6">
                <div className="bg-emerald-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck className="text-emerald-600 w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">An toàn</h3>
                <p className="text-slate-500">Xác thực người dùng qua hệ thống, đảm bảo tin cậy cho mỗi giao dịch.</p>
              </div>
              <div className="text-center p-6">
                <div className="bg-amber-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Users className="text-amber-600 w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">Kết nối Zalo</h3>
                <p className="text-slate-500">Tích hợp liên kết Zalo giúp người mua và người bán trao đổi tức thì.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CALL TO ACTION */}
        <section className="py-20 bg-indigo-600">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-indigo-700 rounded-3xl p-10 md:p-16 flex flex-col md:flex-row items-center justify-between shadow-2xl relative overflow-hidden">
              <div className="relative z-10 text-white">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Sẵn sàng trải nghiệm?</h2>
                <p className="text-indigo-100 text-lg opacity-90 mb-8 md:mb-0">
                  Lựa chọn vai trò của bạn để bắt đầu tham gia cộng đồng.
                </p>
              </div>
              <div className="relative z-10 flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                <Link to="/seller" className="group bg-white text-indigo-600 px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition shadow-lg">
                  Kênh Seller
                  <ArrowRight className="group-hover:translate-x-1 transition" size={18}/>
                </Link>
                <Link to="/buyer" className="group bg-indigo-500 text-white border border-indigo-400 px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-400 transition shadow-lg">
                  Kênh Buyer
                  <ArrowRight className="group-hover:translate-x-1 transition" size={18}/>
                </Link>
              </div>
              {/* Decorative circle */}
              <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-indigo-500 rounded-full opacity-30"></div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>© 2024 MarketConnect. Kết nối giao dịch bền vững.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
