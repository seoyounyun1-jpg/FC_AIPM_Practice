// 브리프 섹션 8-7: 마이페이지 — 히스토리, 축별 평균 추이

/** 채점 완료된 라운드만 골라 시간순 추이 데이터로 변환한다(레이더 대신 3축 라인 차트용). */
export function buildTrendData(history) {
  return (history ?? [])
    .filter((r) => r.judgments?.[0])
    .map((r, idx) => {
      const j = r.judgments[0];
      return {
        index: idx + 1,
        논증_타당성: j.validity_score,
        논점_대응력: j.responsiveness_score,
        설득력_전개: j.persuasion_score,
      };
    });
}

/** 채점 완료된 라운드 기준 3축 전체 평균과 라운드 수를 계산한다. */
export function calcOverallAverages(history) {
  const scored = (history ?? []).filter((r) => r.judgments?.[0]);
  if (scored.length === 0) {
    return { avgValidity: null, avgResponsiveness: null, avgPersuasion: null, roundCount: 0 };
  }

  const sum = scored.reduce(
    (acc, r) => {
      const j = r.judgments[0];
      acc.validity += j.validity_score;
      acc.responsiveness += j.responsiveness_score;
      acc.persuasion += j.persuasion_score;
      return acc;
    },
    { validity: 0, responsiveness: 0, persuasion: 0 },
  );

  return {
    avgValidity: Math.round(sum.validity / scored.length),
    avgResponsiveness: Math.round(sum.responsiveness / scored.length),
    avgPersuasion: Math.round(sum.persuasion / scored.length),
    roundCount: scored.length,
  };
}
