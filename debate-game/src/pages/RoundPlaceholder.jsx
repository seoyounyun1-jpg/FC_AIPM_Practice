import { useLocation, useNavigate, useParams } from 'react-router-dom';

// 4단계(대화 라운드 - AI 논객 연동)에서 정식 구현으로 교체될 임시 화면.
export default function RoundPlaceholder() {
  const { topicId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex min-h-svh max-w-xl flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
        라운드 화면은 4단계에서 구현됩니다
      </h1>
      <p className="text-sm text-neutral-500">
        주제 ID: {topicId} · 상대 페르소나: {state?.persona ?? '미지정'}
      </p>
      <button
        type="button"
        onClick={() => navigate('/home')}
        className="rounded bg-violet-600 px-4 py-2 text-sm font-medium text-white"
      >
        홈으로 돌아가기
      </button>
    </div>
  );
}
