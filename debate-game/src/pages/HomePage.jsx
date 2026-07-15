import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser } from '../lib/usersApi.js';
import { getTopicsByTier } from '../lib/topicsApi.js';
import { getCompletedRoundsWithScores } from '../lib/roundsApi.js';
import { getLocalUserId } from '../lib/localUser.js';
import { recommendTopics, filterTopicsByTag } from '../lib/recommend.js';
import { buildTopicClearMap, countTierUpProgress } from '../lib/tierProgress.js';
import { assignPersonaForTopic } from '../lib/personaAssignment.js';
import { TIER_LABELS } from '../data/constants.js';
import TopicCard from '../components/TopicCard.jsx';
import TopicBottomSheet from '../components/TopicBottomSheet.jsx';

const RECOMMENDED_LIMIT = 4;

export default function HomePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [topics, setTopics] = useState([]);
  const [clearMap, setClearMap] = useState(new Map());
  const [tierProgress, setTierProgress] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = getLocalUserId();
    if (!userId) {
      navigate('/onboarding', { replace: true });
      return;
    }

    let cancelled = false;
    async function load() {
      try {
        const userData = await getUser(userId);
        const [topicData, completedRounds] = await Promise.all([
          getTopicsByTier(userData.current_tier),
          getCompletedRoundsWithScores(userId, userData.current_tier),
        ]);
        if (cancelled) return;
        setUser(userData);
        setTopics(topicData);
        setClearMap(buildTopicClearMap(completedRounds));
        setTierProgress(countTierUpProgress(completedRounds));
      } catch (err) {
        console.error('[HomePage] 데이터 로딩 실패', err);
        if (!cancelled) setError('홈 화면 데이터를 불러오지 못했습니다. Supabase 연결 설정을 확인해주세요.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const recommended = useMemo(
    () => recommendTopics(topics, user?.interest_profile ?? [], { limit: RECOMMENDED_LIMIT }),
    [topics, user],
  );

  const exploreByTag = useMemo(() => {
    const tags = (user?.interest_profile ?? []).map((p) => p.tag);
    return tags.map((tag) => ({ tag, topics: filterTopicsByTag(topics, tag) }));
  }, [topics, user]);

  if (loading) return <div className="p-8 text-center text-neutral-500">불러오는 중...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl p-6 pb-24">
      <header className="mb-6 rounded-lg bg-violet-600 p-5 text-white">
        <div className="flex items-center justify-between">
          <p className="text-sm opacity-80">{user.nickname}님</p>
          <button
            type="button"
            onClick={() => navigate('/mypage')}
            className="text-sm underline opacity-90"
          >
            마이페이지
          </button>
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <h1 className="text-2xl font-semibold">{TIER_LABELS[user.current_tier]} 티어</h1>
          <span className="text-sm opacity-90">경험치 {user.exp}</span>
        </div>
        {tierProgress && (
          <p className="mt-2 text-sm opacity-90">
            티어 승급까지 {tierProgress.successCount}/{tierProgress.required}
            (70점 이상 라운드 클리어)
          </p>
        )}
      </header>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          오늘의 추천 주제
        </h2>
        {recommended.length === 0 ? (
          <p className="text-sm text-neutral-500">추천할 주제가 없습니다.</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {recommended.map((topic) => (
              <div key={topic.id} className="w-56 shrink-0">
                <TopicCard
                  topic={topic}
                  persona={assignPersonaForTopic(topic.id)}
                  clearInfo={clearMap.get(topic.id)}
                  onClick={() => setSelectedTopic(topic)}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {exploreByTag.map(({ tag, topics: tagTopics }) => (
        <section key={tag} className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            #{tag}
          </h2>
          {tagTopics.length === 0 ? (
            <p className="text-sm text-neutral-500">아직 등록된 주제가 없습니다.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {tagTopics.map((topic) => (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  persona={assignPersonaForTopic(topic.id)}
                  clearInfo={clearMap.get(topic.id)}
                  onClick={() => setSelectedTopic(topic)}
                />
              ))}
            </div>
          )}
        </section>
      ))}

      {selectedTopic && (
        <TopicBottomSheet
          topic={selectedTopic}
          persona={assignPersonaForTopic(selectedTopic.id)}
          onClose={() => setSelectedTopic(null)}
        />
      )}
    </div>
  );
}
