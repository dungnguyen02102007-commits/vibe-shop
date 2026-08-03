import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import SellerPage from './pages/SellerPage';
import BuyerPage from './pages/BuyerPage';
import HealthPage from './pages/HealthPage';
import { isConfigured, configIssues } from './supabaseClient';

/** Màn hình thay cho trang trắng khi Vercel chưa có biến môi trường. */
function ConfigError() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white border border-red-200 rounded-2xl p-8 max-w-lg shadow-sm">
        <h1 className="text-xl font-bold text-red-700 mb-2">Thiếu cấu hình Supabase</h1>
        <ul className="text-sm text-slate-700 list-disc pl-5 space-y-1 mb-4">
          {configIssues.map(issue => <li key={issue}>{issue}</li>)}
        </ul>
        <p className="text-sm text-slate-600">
          Vào Vercel → project → <strong>Settings → Environment Variables</strong>, thêm
          <code className="mx-1 px-1.5 py-0.5 bg-slate-100 rounded">VITE_SUPABASE_URL</code> và
          <code className="mx-1 px-1.5 py-0.5 bg-slate-100 rounded">VITE_SUPABASE_ANON_KEY</code>,
          rồi bấm <strong>Redeploy</strong>. Biến chỉ được nhúng vào lúc build nên bắt buộc phải deploy lại.
        </p>
      </div>
    </div>
  );
}

function App() {
  if (!isConfigured) return <ConfigError />;

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/seller" element={<SellerPage />} />
        <Route path="/buyer" element={<BuyerPage />} />
        <Route path="/health" element={<HealthPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
