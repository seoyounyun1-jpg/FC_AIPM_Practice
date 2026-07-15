import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getLocalUserId } from '../lib/localUser.js';
import { getUser } from '../lib/usersApi.js';
import { getUserRoundHistory } from '../lib/roundsApi.js';
import { buildTrendData, calcOverallAverages } from '../lib/historyStats.js';
import { computeStars } from '../lib/tierProgress.js';
import StarRating from '../components/StarRating.jsx';
import { TIER_LABELS } from '../data/constants.js';

export default function MyPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const userId = getLocalUserId();
    if (!userId) {
      navigate('/onboarding', { replace: true });
      return;
    }

    let cancelled = false;
    Promise.all([getUser(userId), getUserRoundHistory(userId)])
      .then(([userData, historyData]) => {
        if (cancelled) return;
        setUser(userData);
        setHistory(historyData);
      })
      .catch((err) => {
        console.error('[MyPage] 데이터 로딩 실패', err);
        if (!cancelled) setError('마이페이지 데이터를 불러오지 못했습니다. Supabase 연결 설정을 확인해주세요.');
      });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!user || !history) return <div className="p-8 text-center text-neutral-500">불러오는 중...</div>;

  const trendData = buildTrendData(history);
  const averages = calcOverallAverages(history);
  const overallStars = averages.roundCount > 0
    ? computeStars((averages.avgValidity + averages.avgResponsiveness + averages.avgPersuasion) / 3)
    : 0;

  return (
    <div className="mx-auto max-w-2xl p-4 pb-12">
      <header className="mb-4 rounded-lg bg-violet-600 p-5 text-white">
        <p className="text-sm opacity-80">{user.nickname}님의 기록</p>
        <div className="mt-1 flex items-baseline justify-between">
          <h1 className="text-2xl font-semibold">{TIER_LABELS[user.current_tier]} 티어</h1>
          <span className="text-sm opacity-90">경험치 {user.exp}</span>
        </div>
      </header>

      <div className="mb-6 grid grid-cols-4 gap-2 text-center">
        <div className="col-span-1 rounded border border-neutral-200 p-2 dark:border-neutral-800">
          <p className="text-xs text-neutral-500">완료 라운드</p>
          <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {averages.roundCount}
          </p>
        </div>
        <div className="col-span-1 rounded border border-neutral-200 p-2 dark:border-neutral-800">
          <p className="text-xs text-neutral-500">논증 타당성</p>
          <p className="text-lg font-semibold text-violet-600">{averages.avgValidity ?? '-'}</p>
        </div>
        <div className="col-span-1 rounded border border-neutral-200 p-2 dark:border-neutral-800">
          <p className="text-xs text-neutral-500">논점 대응력</p>
          <p className="text-lg font-semibold text-violet-600">{averages.avgResponsiveness ?? '-'}</p>
        </div>
        <div className="col-span-1 rounded border border-neutral-200 p-2 dark:border-neutral-800">
          <p className="text-xs text-neutral-500">설득력 전개</p>
          <p className="text-lg font-semibold text-violet-600">{averages.avgPersuasion ?? '-'}</p>
        </div>
      </div>
      {averages.roundCount > 0 && (
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="text-sm text-neutral-500">종합 평가</span>
          <StarRating stars={overallStars} attempted />
        </div>
      )}

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          축별 평균 추이
        </h2>
        {trendData.length < 2 ? (
          <p className="text-sm text-neutral-500">
            추이를 보려면 채점 완료된 라운드가 2개 이상 필요합니다.
          </p>
        ) : (
          <div className="h-64 rounded-lg border border-neutral-200 p-2 dark:border-neutral-800">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="index" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="논증_타당성" name="논증 타당성" stroke="#7c3aed" strokeWidth={2} />
                <Line type="monotone" dataKey="논점_대응력" name="논점 대응력" stroke="#0ea5e9" strokeWidth={2} />
                <Line type="monotone" dataKey="설득력_전개" name="설득력 전개" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          라운드 히스토리
        </h2>
        {history.length === 0 ? (
          <p className="text-sm text-neutral-500">아직 완료한 라운드가 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {[...history].reverse().map((round) => {
              const judgment = round.judgments?.[0];
              const avg = judgment
                ? (judgment.validity_score + judgment.responsiveness_score + judgment.persuasion_score) / 3
                : null;
              return (
                <li
                  key={round.id}
                  className="rounded border border-neutral-200 p-3 text-sm dark:border-neutral-800"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">
                      {round.topics?.title}
                    </p>
                    <StarRating stars={avg != null ? computeStars(avg) : 0} attempted={judgment != null} />
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    {TIER_LABELS[round.tier]} · 상대: {round.persona_type} ·{' '}
                    {new Date(round.completed_at).toLocaleDateString('ko-KR')}
                  </p>
                  {judgment && (
                    <p className="mt-1 text-xs text-neutral-400">
                      논증 {judgment.validity_score} · 대응 {judgment.responsiveness_score} · 설득{' '}
                      {judgment.persuasion_score}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <button
        type="button"
        onClick={() => navigate('/home')}
        className="mt-8 w-full rounded bg-violet-600 px-4 py-3 text-sm font-medium text-white"
      >
        홈으로 돌아가기
      </button>
    </div>
  );
}
