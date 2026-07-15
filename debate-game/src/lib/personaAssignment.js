import { PERSONAS } from '../data/constants.js';

// 카드 미리보기용 예상 페르소나를 주제 ID 기반으로 결정론적으로 배정한다.
// (라운드 시작 시 실제 배정과는 별개 — 4단계에서 라운드 생성 로직과 함께 확정)
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function assignPersonaForTopic(topicId) {
  const index = hashString(String(topicId)) % PERSONAS.length;
  return PERSONAS[index];
}
