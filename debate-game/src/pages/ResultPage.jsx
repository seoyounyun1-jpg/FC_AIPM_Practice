import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Radar,
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import { getRoundForResult } from '../lib/roundsApi.js';
import { TIER_LABELS } from '../data/constants.js';

const AXIS_LABELS = {
  논증_타당성: '논증 타당성',
  논점_대응력: '논점 대응력',
  설득력_전개: '설득력 전개',
};

export default function ResultPage() {
  const { roundId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const progression = state?.progression ?? null;
  const [round, setRound] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getRoundForResult(roundId)
      .then((data) => {
        if (!cancelled) setRound(data);
      })
      .catch((err) => {
        console.error('[ResultPage] 결과 로딩 실패', err);
        if (!cancelled) setError('결과를 불러오지 못했습니다. Supabase 연결 설정을 확인해주세요.');
      });
    return () => {
      cancelled = true;
    };
  }, [roundId]);

  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!round) return <div className="p-8 text-center text-neutral-500">결과를 불러오는 중...</div>;

  const judgment = round.judgments?.[0];
  if (!judgment) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <p className="text-neutral-600 dark:text-neutral-400">
          아직 채점 결과가 없습니다. 채점이 실패했을 수 있습니다.
        </p>
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

  const radarData = [
    { axis: '논증 타당성', score: judgment.validity_score },
    { axis: '논점 대응력', score: judgment.responsiveness_score },
    { axis: '설득력 전개', score: judgment.persuasion_score },
  ];
  const raw = judgment.raw_result ?? {};

  return (
    <div className="mx-auto max-w-2xl p-4 pb-12">
      <header className="mb-4 text-center">
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          {round.topics?.title}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {TIER_LABELS[round.tier]} · 상대: {round.persona_type} · 힌트 사용: {round.hint_used_count}회
        </p>
      </header>

      {progression && (
        <div className="mb-4 rounded-lg border border-violet-300 bg-violet-50 p-3 text-center dark:bg-violet-950">
          <p className="text-sm text-violet-700 dark:text-violet-300">
            경험치 +{progression.expGain} 획득
            {progression.shouldPromote && (
              <>
                {' '}
                · <span className="font-semibold">{TIER_LABELS[progression.promotedTier]} 티어로 승급!</span>
              </>
            )}
          </p>
          <p className="mt-1 text-xs text-violet-500">
            티어 승급 진행도: {progression.tierProgress.successCount}/{progression.tierProgress.required}
            (70점 이상 라운드 클리어)
          </p>
        </div>
      )}

      <div className="mb-4 h-72 rounded-lg border border-neutral-200 p-2 dark:border-neutral-800">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="axis" tick={{ fontSize: 12 }} />
            <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
            <Radar dataKey="score" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.4} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-2 text-center">
        {radarData.map((d) => (
          <div key={d.axis} className="rounded border border-neutral-200 p-2 dark:border-neutral-800">
            <p className="text-xs text-neutral-500">{d.axis}</p>
            <p className="text-lg font-semibold text-violet-600">{d.score}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
        <p className="mb-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">총평</p>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{judgment.overall_comment}</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          턴별 판정 로그
        </h2>
        {Object.entries(AXIS_LABELS).map(([axisKey, axisLabel]) => {
          const items = raw[axisKey]?.근거_목록 ?? [];
          return (
            <div key={axisKey}>
              <p className="mb-2 text-sm font-medium text-violet-600">{axisLabel}</p>
              {items.length === 0 ? (
                <p className="text-sm text-neutral-400">근거 없음</p>
              ) : (
                <ul className="space-y-2">
                  {items.map((item, idx) => (
                    <li
                      key={`${axisKey}-${idx}`}
                      className="rounded border border-neutral-200 p-2 text-sm dark:border-neutral-800"
                    >
                      <p className="text-xs text-neutral-500">
                        턴 {item.턴} · 영향 {item.영향}
                      </p>
                      <p className="mt-1 text-neutral-700 dark:text-neutral-300">{item.발언_요약}</p>
                      <p className="mt-0.5 text-neutral-500">{item.판단}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

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
