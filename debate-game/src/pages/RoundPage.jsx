import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useDebateRound } from '../hooks/useDebateRound.js';
import { TOTAL_TURNS, MAX_HINTS_PER_ROUND } from '../data/constants.js';

export default function RoundPage() {
  const { topicId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [draft, setDraft] = useState('');

  const {
    status,
    topic,
    persona,
    turns,
    hintsUsed,
    hintText,
    error,
    submitUserTurn,
    requestHint,
  } = useDebateRound(topicId, state?.persona);

  if (status === 'loading') {
    return <div className="p-8 text-center text-neutral-500">라운드를 준비하는 중...</div>;
  }
  if (status === 'error') {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <p className="text-red-600">{error}</p>
        <button
          type="button"
          onClick={() => navigate('/home')}
          className="mt-4 rounded bg-violet-600 px-4 py-2 text-sm font-medium text-white"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    submitUserTurn(draft);
    setDraft('');
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-xl flex-col p-4">
      <header className="mb-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
        <h1 className="font-semibold text-neutral-900 dark:text-neutral-100">{topic?.title}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          상대: {persona} · {turns.length}/{TOTAL_TURNS}턴
        </p>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto pb-4">
        {turns.map((turn) => (
          <div
            key={turn.id}
            className={`flex ${turn.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={
                'max-w-[80%] rounded-lg px-3 py-2 text-sm ' +
                (turn.speaker === 'user'
                  ? 'bg-violet-600 text-white'
                  : 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100')
              }
            >
              {turn.speaker === 'ai' && (
                <p className="mb-0.5 text-xs font-medium opacity-70">{persona}</p>
              )}
              {turn.content}
            </div>
          </div>
        ))}
        {status === 'ai-thinking' && (
          <p className="text-sm text-neutral-400">{persona}이(가) 답변을 작성하는 중...</p>
        )}
        {error && status !== 'error' && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {status === 'completed' ? (
        <div className="rounded-lg border border-neutral-200 p-4 text-center dark:border-neutral-800">
          <p className="font-medium text-neutral-900 dark:text-neutral-100">라운드 완료!</p>
          <p className="mt-1 text-sm text-neutral-500">
            사용한 힌트: {hintsUsed}회 · 채점 및 결과 화면은 5단계에서 구현됩니다.
          </p>
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="mt-3 rounded bg-violet-600 px-4 py-2 text-sm font-medium text-white"
          >
            홈으로 돌아가기
          </button>
        </div>
      ) : (
        <>
          {hintText && (
            <div className="mb-2 rounded border border-amber-300 bg-amber-50 p-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              힌트: {hintText}
            </div>
          )}
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={requestHint}
              disabled={status !== 'ready' || hintsUsed >= MAX_HINTS_PER_ROUND}
              className="text-sm text-violet-600 underline disabled:cursor-not-allowed disabled:text-neutral-400 disabled:no-underline"
            >
              힌트 받기 ({hintsUsed}/{MAX_HINTS_PER_ROUND})
            </button>
          </div>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={status !== 'ready'}
              placeholder="반박을 입력하세요"
              className="flex-1 rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-violet-500 disabled:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:disabled:bg-neutral-800"
            />
            <button
              type="submit"
              disabled={status !== 'ready' || !draft.trim()}
              className="rounded bg-violet-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              전송
            </button>
          </form>
        </>
      )}
    </div>
  );
}
