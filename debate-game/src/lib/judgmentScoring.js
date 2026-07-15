// 브리프 섹션 4: 배점 규칙 — 최종 0~100 클램프.
// 구조화 출력 스키마 자체는 정수 범위를 강제할 수 없으므로(JSON Schema 제약) 클라이언트에서 방어적으로 클램프한다.
export function clampScore(score) {
  const n = Math.round(Number(score));
  if (Number.isNaN(n)) return 50; // 판단 불가 시 중립값
  return Math.min(100, Math.max(0, n));
}

/** LLM이 반환한 채점 JSON(raw)을 DB 저장/화면 표시용 형태로 정규화한다. */
export function parseJudgmentResult(raw) {
  return {
    validityScore: clampScore(raw.논증_타당성.점수),
    responsivenessScore: clampScore(raw.논점_대응력.점수),
    persuasionScore: clampScore(raw.설득력_전개.점수),
    overallComment: raw.총평,
  };
}
