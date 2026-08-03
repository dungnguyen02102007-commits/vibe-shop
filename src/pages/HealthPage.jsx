import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase, supabaseUrl, isConfigured, configIssues } from '../supabaseClient';
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw, ArrowLeft, Loader2 } from 'lucide-react';

/**
 * Trang tự chẩn đoán kết nối. Mở /health trên bản live để biết chính xác
 * khâu nào đang hỏng: biến môi trường, cơ sở dữ liệu, storage hay auth.
 */
export default function HealthPage() {
  const [checks, setChecks] = useState([]);
  const [running, setRunning] = useState(true);

  const runChecks = useCallback(async () => {
    setRunning(true);
    const results = [];
    const add = (name, status, detail, fix) => results.push({ name, status, detail, fix });

    // 1. Biến môi trường
    if (isConfigured) {
      add('Biến môi trường', 'ok', supabaseUrl);
    } else {
      add('Biến môi trường', 'fail', configIssues.join(' | '),
        'Vercel > Settings > Environment Variables: thêm VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY, rồi Redeploy.');
      setChecks(results);
      setRunning(false);
      return;
    }

    // 2. Bảng products
    try {
      const { error } = await supabase.from('products').select('id').limit(1);
      if (error) throw error;
      add('Bảng products', 'ok', 'Đọc được, RLS cho phép xem công khai');
    } catch (e) {
      add('Bảng products', 'fail', e.message,
        'Chạy file supabase/setup.sql trong Supabase > SQL Editor.');
    }

    // 3. Cột image_path (dấu hiệu setup.sql đã chạy chưa)
    try {
      const { error } = await supabase.from('products').select('image_path').limit(1);
      if (error) throw error;
      add('Cột image_path', 'ok', 'setup.sql đã được chạy');
    } catch (e) {
      add('Cột image_path', 'fail', e.message,
        'Chưa chạy supabase/setup.sql. Đây là dấu hiệu rõ nhất. Mở Supabase > SQL Editor, dán toàn bộ file rồi Run.');
    }

    // 4. Bảng profiles
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      if (error) throw error;
      add('Bảng profiles', 'ok', 'Đọc được');
    } catch (e) {
      add('Bảng profiles', 'fail', e.message, 'Chạy supabase/setup.sql.');
    }

    // 5. Storage bucket
    try {
      const { error } = await supabase.storage.from('product-images').list('', { limit: 1 });
      if (error) throw error;
      add('Bucket product-images', 'ok', 'Tồn tại và đọc được');
    } catch (e) {
      add('Bucket product-images', 'fail', e.message,
        'Chạy supabase/setup.sql để tạo bucket công khai kèm policy upload.');
    }

    // 6. Cấu hình auth
    try {
      const res = await fetch(`${supabaseUrl}/auth/v1/settings?apikey=${import.meta.env.VITE_SUPABASE_ANON_KEY}`);
      const s = await res.json();
      if (s.disable_signup) {
        add('Đăng ký tài khoản', 'fail', 'Signup đang bị tắt',
          'Supabase > Authentication > Sign In / Providers: bật cho phép đăng ký.');
      } else if (!s.mailer_autoconfirm) {
        add('Xác nhận email', 'warn', 'Đang BẬT xác nhận email',
          'Khi thử nghiệm nên tắt: Authentication > Sign In / Providers > Email > tắt "Confirm email". Bản free bị giới hạn vài email/giờ nên rất dễ tưởng là lỗi.');
      } else {
        add('Xác nhận email', 'ok', 'Đã tắt — đăng ký xong dùng được ngay');
      }
    } catch (e) {
      add('Cấu hình auth', 'fail', e.message, 'Kiểm tra lại URL Supabase.');
    }

    // 7. Phiên đăng nhập hiện tại
    const { data: { session } } = await supabase.auth.getSession();
    add('Phiên đăng nhập', session ? 'ok' : 'warn',
      session ? session.user.email : 'Chưa đăng nhập (bình thường nếu bạn chưa thử)');

    setChecks(results);
    setRunning(false);
  }, []);

  useEffect(() => { runChecks(); }, [runChecks]);

  const failed = checks.filter(c => c.status === 'fail').length;
  const warned = checks.filter(c => c.status === 'warn').length;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" /> Trang chủ
        </Link>

        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Kiểm tra kết nối hệ thống</h1>
            <p className="text-slate-500 text-sm mt-1">
              Supabase · Vercel · biến môi trường. Mở trang này bất cứ lúc nào để biết khâu nào đang hỏng.
            </p>
          </div>
          <button
            onClick={runChecks}
            disabled={running}
            className="shrink-0 inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} /> Kiểm tra lại
          </button>
        </div>

        {!running && (
          <div className={`mb-6 rounded-xl px-4 py-3 text-sm font-medium ${
            failed ? 'bg-red-50 text-red-700 border border-red-200'
              : warned ? 'bg-amber-50 text-amber-800 border border-amber-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
            {failed
              ? `${failed} mục lỗi cần sửa trước khi web chạy được.`
              : warned
              ? `Kết nối đã thông. Còn ${warned} lưu ý nên xử lý.`
              : 'Tất cả đều tốt. Hệ thống sẵn sàng.'}
          </div>
        )}

        {running && checks.length === 0 ? (
          <div className="flex justify-center py-16 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {checks.map((c, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 flex gap-3">
                <div className="shrink-0 mt-0.5">
                  {c.status === 'ok' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                  {c.status === 'warn' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                  {c.status === 'fail' && <XCircle className="w-5 h-5 text-red-600" />}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800">{c.name}</p>
                  <p className="text-sm text-slate-600 mt-0.5 break-words">{c.detail}</p>
                  {c.fix && (
                    <p className="text-sm text-slate-500 mt-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                      <span className="font-medium text-slate-700">Cách sửa: </span>{c.fix}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
