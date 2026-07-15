// 브리프 섹션 2-2: 추천 로직 — 티어는 순차 진행, 주제 선택만 개인화한다.
// 현재 티어 내에서 topics.interest_tags와 user.interest_profile 교집합(가중치 합)이
// 높은 주제를 우선 노출하고, 동점이면 최신 등록 주제를 우선한다.

function scoreTopic(topic, tagWeightMap) {
  return (topic.interest_tags ?? []).reduce((sum, tag) => sum + (tagWeightMap.get(tag) ?? 0), 0);
}

function byRecommendationOrder(a, b) {
  if (b._score !== a._score) return b._score - a._score;
  return new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0);
}

/**
 * @param {Array} topics - 이미 특정 티어로 필터링된 주제 목록
 * @param {Array<{tag:string, weight:number}>} interestProfile
 * @param {{limit?: number}} options
 */
export function recommendTopics(topics, interestProfile, { limit = 4 } = {}) {
  const tagWeightMap = new Map((interestProfile ?? []).map((p) => [p.tag, p.weight]));

  const scored = (topics ?? []).map((t) => ({ ...t, _score: scoreTopic(t, tagWeightMap) }));
  const matched = scored.filter((t) => t._score > 0).sort(byRecommendationOrder);
  const unmatched = scored.filter((t) => t._score === 0).sort(byRecommendationOrder);

  return [...matched, ...unmatched].slice(0, limit).map(({ _score, ...topic }) => topic);
}

/** 관심사 태그별 탐색 섹션: 해당 태그를 포함하는 주제만 필터링 (최신순) */
export function filterTopicsByTag(topics, tag) {
  return (topics ?? [])
    .filter((t) => (t.interest_tags ?? []).includes(tag))
    .sort((a, b) => new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0));
}
