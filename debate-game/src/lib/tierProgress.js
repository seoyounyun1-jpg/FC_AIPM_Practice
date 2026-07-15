import { TIER_UP_MIN_AVG_SCORE, TIER_UP_MIN_ROUNDS } from '../data/constants.js';

export function calcRoundAverage(judgment) {
  if (!judgment) return null;
  const { validity_score, responsiveness_score, persuasion_score } = judgment;
  return (validity_score + responsiveness_score + persuasion_score) / 3;
}

// 카드 별점: 완료했지만 미달(50점 미만)이어도 "미도전"과는 구분되도록 0성으로 표기한다.
export function computeStars(avgScore) {
  if (avgScore == null) return 0;
  if (avgScore >= 80) return 3;
  if (avgScore >= 70) return 2;
  if (avgScore >= 50) return 1;
  return 0;
}

/**
 * @param {Array<{topic_id:string, avgScore:number|null}>} completedRounds
 * @returns {Map<string, {attempted:boolean, bestAvgScore:number|null, stars:number}>}
 */
export function buildTopicClearMap(completedRounds) {
  const map = new Map();
  for (const round of completedRounds ?? []) {
    const prev = map.get(round.topic_id);
    const isBetter = prev == null || (round.avgScore ?? -1) > (prev.bestAvgScore ?? -1);
    if (isBetter) {
      map.set(round.topic_id, {
        attempted: true,
        bestAvgScore: round.avgScore,
        stars: computeStars(round.avgScore),
      });
    }
  }
  return map;
}

/** 브리프 섹션 4: 해당 티어 평균 70점 이상 3라운드 클리어 시 승급 */
export function countTierUpProgress(
  completedRounds,
  { threshold = TIER_UP_MIN_AVG_SCORE, required = TIER_UP_MIN_ROUNDS } = {},
) {
  const successCount = (completedRounds ?? []).filter(
    (r) => r.avgScore != null && r.avgScore >= threshold,
  ).length;
  return {
    successCount: Math.min(successCount, required),
    required,
    isEligible: successCount >= required,
  };
}
