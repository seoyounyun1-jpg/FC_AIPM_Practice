import { TOTAL_TURNS } from '../data/constants.js';

// 브리프 섹션 4: 고정 8턴, 유저가 먼저 시작해 유저/AI가 번갈아 진행한다.
export function nextTurnNumber(turnCount) {
  return turnCount + 1;
}

export function whoseTurn(turnCount) {
  return turnCount % 2 === 0 ? 'user' : 'ai';
}

export function isRoundComplete(turnCount) {
  return turnCount >= TOTAL_TURNS;
}
