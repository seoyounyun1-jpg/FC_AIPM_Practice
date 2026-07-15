import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser } from '../lib/usersApi.js';
import { getLocalUserId, clearLocalUserId } from '../lib/localUser.js';
import { TIER_LABELS } from '../data/constants.js';

// 3단계(홈 화면 - 추천 카드 피드)에서 정식 구현으로 교체될 임시 화면.
export default function HomePlaceholder() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const userId = getLocalUserId();
    if (!userId) {
      navigate('/onboarding', { replace: true });
      return;
    }
    getUser(userId)
      .then(setUser)
      .catch((err) => {
        console.error('[HomePlaceholder] getUser 실패', err);
        setError('사용자 정보를 불러오지 못했습니다.');
      });
  }, [navigate]);

  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }
  if (!user) {
    return <div className="p-8 text-center text-neutral-500">불러오는 중...</div>;
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-xl flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
        {user.nickname}님, 환영합니다
      </h1>
      <p className="text-neutral-600 dark:text-neutral-400">
        현재 티어: {TIER_LABELS[user.current_tier]} · 경험치: {user.exp}
      </p>
      <p className="text-sm text-neutral-500">
        관심사: {user.interest_profile.map((p) => p.tag).join(', ')}
      </p>
      <p className="mt-4 text-sm text-neutral-400">
        추천 카드 피드는 3단계에서 구현됩니다.
      </p>
      <button
        type="button"
        onClick={() => {
          clearLocalUserId();
          navigate('/onboarding', { replace: true });
        }}
        className="text-sm text-neutral-400 underline"
      >
        온보딩 다시하기 (개발용)
      </button>
    </div>
  );
}
