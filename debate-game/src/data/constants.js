// 브리프 섹션 2-1: 관심사 태그 후보
export const INTEREST_TAGS = [
  '음식/취향',
  '라이프스타일',
  '여행',
  '일/커리어',
  '인간관계',
  '사회이슈',
  '철학/윤리',
  '기술/미래',
];

export const MIN_INTERESTS = 2;
export const MAX_INTERESTS = 5;

export const TIERS = ['bronze', 'silver', 'gold', 'platinum'];

export const TIER_LABELS = {
  bronze: '브론즈',
  silver: '실버',
  gold: '골드',
  platinum: '플래티넘',
};

export const PERSONAS = ['직설형', '회유형', '데이터형'];

export const TOTAL_TURNS = 8; // 유저 4턴 + AI 4턴
export const TURNS_PER_SIDE = TOTAL_TURNS / 2;

export const MAX_HINTS_PER_ROUND = 2;

// 섹션 4: 티어 승급 조건
export const TIER_UP_MIN_AVG_SCORE = 70;
export const TIER_UP_MIN_ROUNDS = 3;
