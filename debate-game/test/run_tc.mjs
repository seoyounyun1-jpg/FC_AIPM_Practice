/**
 * AI 논쟁 게임 - 1단계(스캐폴딩/DB 스키마/시드 데이터) 코드 레벨 테스트
 * 실행: node test/run_tc.mjs
 */
import { BRONZE_SEED_TOPICS } from '../src/data/seedTopics.js';
import {
  INTEREST_TAGS,
  MIN_INTERESTS,
  MAX_INTERESTS,
  TIERS,
  PERSONAS,
  TOTAL_TURNS,
  TURNS_PER_SIDE,
  MAX_HINTS_PER_ROUND,
  TIER_UP_MIN_AVG_SCORE,
  TIER_UP_MIN_ROUNDS,
} from '../src/data/constants.js';

let passed = 0;
let failed = 0;

function test(name, condition) {
  if (condition) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.log(`  ❌ ${name}`);
    failed++;
  }
}

console.log('\n[TC-1] 시드 데이터 — 브론즈 티어 (브리프 섹션 7)');
test('시드 주제가 4개다', BRONZE_SEED_TOPICS.length === 4);
test(
  '모든 시드 주제의 tier가 bronze다',
  BRONZE_SEED_TOPICS.every((t) => t.tier === 'bronze'),
);
test(
  '모든 시드 주제에 title/description/ai_intended_weakness가 문자열로 존재한다',
  BRONZE_SEED_TOPICS.every(
    (t) =>
      typeof t.title === 'string' &&
      t.title.length > 0 &&
      typeof t.description === 'string' &&
      t.description.length > 0 &&
      typeof t.ai_intended_weakness === 'string' &&
      t.ai_intended_weakness.length > 0,
  ),
);
test(
  '모든 시드 주제의 interest_tags가 배열이고 최소 1개 이상이다',
  BRONZE_SEED_TOPICS.every((t) => Array.isArray(t.interest_tags) && t.interest_tags.length > 0),
);
test(
  '시드 주제의 interest_tags가 전부 INTEREST_TAGS 후보 안에 속한다 (온보딩 태그와 정합)',
  BRONZE_SEED_TOPICS.every((t) => t.interest_tags.every((tag) => INTEREST_TAGS.includes(tag))),
);
test(
  '시드 주제 title이 모두 유일하다',
  new Set(BRONZE_SEED_TOPICS.map((t) => t.title)).size === BRONZE_SEED_TOPICS.length,
);

const expectedTitles = [
  '민트초코는 맛있다',
  '여름이 겨울보다 낫다',
  '아침형 인간이 저녁형 인간보다 생산적이다',
  '혼자 여행이 단체 여행보다 낫다',
];
test(
  '브리프 섹션 7과 title이 정확히 일치한다',
  JSON.stringify(BRONZE_SEED_TOPICS.map((t) => t.title).sort()) ===
    JSON.stringify([...expectedTitles].sort()),
);

console.log('\n[TC-2] 상수 정의 — 온보딩/게임 규칙 (브리프 섹션 2, 4)');
test('관심사 태그 후보가 8개다 (브리프 섹션 2-1)', INTEREST_TAGS.length === 8);
test('최소 관심사 선택 수는 2다', MIN_INTERESTS === 2);
test('최대 관심사 선택 수는 5다', MAX_INTERESTS === 5);
test('MIN_INTERESTS < MAX_INTERESTS', MIN_INTERESTS < MAX_INTERESTS);
test(
  '티어는 bronze/silver/gold/platinum 순서다',
  JSON.stringify(TIERS) === JSON.stringify(['bronze', 'silver', 'gold', 'platinum']),
);
test(
  '페르소나는 직설형/회유형/데이터형 3종이다 (브리프 섹션 5)',
  JSON.stringify(PERSONAS) === JSON.stringify(['직설형', '회유형', '데이터형']),
);
test('라운드는 고정 8턴이다 (브리프 섹션 4)', TOTAL_TURNS === 8);
test('턴이 유저/AI 각 4턴씩으로 균등 분배된다', TURNS_PER_SIDE === 4 && TURNS_PER_SIDE * 2 === TOTAL_TURNS);
test('힌트는 라운드당 최대 2회다', MAX_HINTS_PER_ROUND === 2);
test('티어 승급 기준 평균 점수는 70점이다', TIER_UP_MIN_AVG_SCORE === 70);
test('티어 승급 기준 라운드 수는 3이다', TIER_UP_MIN_ROUNDS === 3);

console.log(`\n총 ${passed + failed}개 중 ${passed}개 통과, ${failed}개 실패\n`);
process.exit(failed > 0 ? 1 : 0);
