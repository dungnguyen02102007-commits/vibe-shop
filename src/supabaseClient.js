import { createClient } from '@supabase/supabase-js'

const rawUrl = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** Bỏ dấu / thừa và đuôi /rest/v1 nếu lỡ dán nhầm từ dashboard. */
function normalizeUrl(url) {
  if (!url) return url
  return url.trim().replace(/\/+$/, '').replace(/\/rest\/v1$/, '')
}

export const supabaseUrl = normalizeUrl(rawUrl)
export const supabaseAnonKey = anonKey

/** false khi thiếu biến môi trường (hay gặp nhất: quên set trên Vercel). */
export const isConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const configIssues = [
  !rawUrl && 'Thiếu biến VITE_SUPABASE_URL',
  !anonKey && 'Thiếu biến VITE_SUPABASE_ANON_KEY',
].filter(Boolean)

if (!isConfigured) {
  console.error('[Supabase] Thiếu cấu hình:', configIssues.join(' | '))
}

// Dùng URL giả khi thiếu cấu hình để createClient không ném lỗi lúc import
// (nếu ném, toàn bộ app trắng trang và không ai biết vì sao).
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)
