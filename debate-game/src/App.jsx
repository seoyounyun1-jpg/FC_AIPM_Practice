import { Routes, Route } from 'react-router-dom';

function ScaffoldStatus() {
  const hasSupabaseEnv = Boolean(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY,
  );
  const hasAnthropicEnv = Boolean(import.meta.env.VITE_ANTHROPIC_API_KEY);

  return (
    <div className="mx-auto flex min-h-svh max-w-xl flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
        AI 논쟁 게임 — 스캐폴딩 완료
      </h1>
      <p className="text-neutral-600 dark:text-neutral-400">
        온보딩 / 홈 / 라운드 / 결과 화면은 다음 단계에서 구현됩니다.
      </p>
      <ul className="w-full space-y-2 text-left text-sm">
        <li className="flex items-center justify-between rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700">
          <span>Supabase 환경변수</span>
          <span className={hasSupabaseEnv ? 'text-green-600' : 'text-red-600'}>
            {hasSupabaseEnv ? '설정됨' : '미설정'}
          </span>
        </li>
        <li className="flex items-center justify-between rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700">
          <span>Anthropic API 환경변수</span>
          <span className={hasAnthropicEnv ? 'text-green-600' : 'text-red-600'}>
            {hasAnthropicEnv ? '설정됨' : '미설정'}
          </span>
        </li>
      </ul>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ScaffoldStatus />} />
    </Routes>
  );
}
