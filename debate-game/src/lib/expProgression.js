import { TIERS } from '../data/constants.js';
import { countTierUpProgress } from './tierProgress.js';

// 브리프 섹션 4: "누적 경험치 + 티어 승급" — 경험치 산정 공식은 명시되어 있지 않아
// 클로드 코드가 결정. 라운드 평균 점수를 그대로 경험치로 환산한다(0~100점 -> 0~100exp).
export function calcExpGain(avgScore) {
  return Math.round(avgScore);
}

/** 다음 티어를 반환한다. 이미 최고 티어(platinum)면 null(승급 없음, 강등도 없음). */
export function nextTier(currentTier) {
  const idx = TIERS.indexOf(currentTier);
  if (idx === -1 || idx === TIERS.length - 1) return null;
  return TIERS[idx + 1];
}

/**
 * 라운드 종료 후 경험치/승급 여부를 계산한다.
 * @param {number} roundAvgScore - 방금 끝난 라운드의 3축 평균 점수
 * @param {Array<{avgScore:number|null}>} completedRoundsInCurrentTier - 방금 끝난 라운드를 포함한, 현재 티어 내 완료 라운드 전체
 * @param {string} currentTier
 */
export function evaluateProgression(roundAvgScore, completedRoundsInCurrentTier, currentTier) {
  const expGain = calcExpGain(roundAvgScore);
  const progress = countTierUpProgress(completedRoundsInCurrentTier);
  const promotedTier = progress.isEligible ? nextTier(currentTier) : null;

  return {
    expGain,
    tierProgress: progress,
    shouldPromote: promotedTier != null,
    promotedTier,
  };
}
