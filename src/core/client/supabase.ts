import { createClient } from '@supabase/supabase-js';

// 讀取環境變數 (加上 fallback 避免在 CI/CD 編譯階段因為找不到變數而報錯)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase 環境變數遺失！請確認已設定 .env.local 或 Cloudflare 環境變數。');
}

// 建立並匯出單一 Supabase 客戶端實體 (Singleton)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);