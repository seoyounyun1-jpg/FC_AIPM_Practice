import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured) {
  console.warn(
    '[supabaseClient] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY가 설정되지 않았습니다. .env를 확인하세요.',
  );
}

// createClient는 유효한 URL 형식이 아니면 즉시 예외를 던지므로, 환경변수가
// 없을 때도 앱이 죽지 않도록 더미 URL로 초기화한다. 실제 요청은 네트워크
// 단계에서 실패하며, 각 API 함수의 에러 핸들링에서 사용자에게 안내한다.
export const supabase = createClient(url || 'https://placeholder.supabase.co', anonKey || 'placeholder-anon-key');
