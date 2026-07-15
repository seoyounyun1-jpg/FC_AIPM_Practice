/**
 * AI 논쟁 게임 - 코드 레벨 테스트 (단계별로 누적 추가)
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
import {
  validateNickname,
  validateInterestSelection,
  buildInterestProfile,
  toggleTagSelection,
} from '../src/lib/onboardingValidation.js';
import { recommendTopics, filterTopicsByTag } from '../src/lib/recommend.js';
import {
  calcRoundAverage,
  computeStars,
  buildTopicClearMap,
  countTierUpProgress,
} from '../src/lib/tierProgress.js';
import { assignPersonaForTopic } from '../src/lib/personaAssignment.js';
import { nextTurnNumber, whoseTurn, isRoundComplete } from '../src/lib/turnFlow.js';
import { clampScore, parseJudgmentResult } from '../src/lib/judgmentScoring.js';
import { JUDGE_SYSTEM_PROMPT, JUDGMENT_JSON_SCHEMA } from '../src/prompts/judgePrompt.js';
import {
  COMMON_INSTRUCTION,
  PERSONA_SYSTEM_PROMPTS,
  buildOpponentSystemPrompt,
  buildHintSystemPrompt,
} from '../src/prompts/debatePrompts.js';

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

console.log('\n[TC-3] 온보딩 검증 로직 (브리프 섹션 2-1)');
test('닉네임 미입력은 무효 처리된다', validateNickname('').valid === false);
test('공백만 입력한 닉네임은 무효 처리된다', validateNickname('   ').valid === false);
test('정상 닉네임은 유효 처리된다', validateNickname('논리왕').valid === true);
test('21자 닉네임은 무효 처리된다', validateNickname('가'.repeat(21)).valid === false);
test('20자 닉네임은 유효 처리된다', validateNickname('가'.repeat(20)).valid === true);

test('관심사 0개 선택은 무효 처리된다', validateInterestSelection([]).valid === false);
test('관심사 1개 선택은 무효 처리된다 (최소 2개)', validateInterestSelection(['여행']).valid === false);
test(
  '관심사 2개 선택은 유효 처리된다 (최소 기준)',
  validateInterestSelection(['여행', '음식/취향']).valid === true,
);
test(
  '관심사 5개 선택은 유효 처리된다 (최대 기준)',
  validateInterestSelection(['여행', '음식/취향', '라이프스타일', '일/커리어', '인간관계']).valid ===
    true,
);
test(
  '관심사 6개 선택은 무효 처리된다 (최대 초과)',
  validateInterestSelection(['여행', '음식/취향', '라이프스타일', '일/커리어', '인간관계', '사회이슈'])
    .valid === false,
);
test(
  '알 수 없는 태그가 섞이면 무효 처리된다',
  validateInterestSelection(['여행', '음식/취향', '없는태그']).valid === false,
);
test(
  '중복 선택은 1개로 카운트된다 (2개 미만이면 무효)',
  validateInterestSelection(['여행', '여행']).valid === false,
);

test(
  'buildInterestProfile은 태그별 weight 1인 객체 배열을 만든다',
  JSON.stringify(buildInterestProfile(['여행', '음식/취향'])) ===
    JSON.stringify([
      { tag: '여행', weight: 1 },
      { tag: '음식/취향', weight: 1 },
    ]),
);
test(
  'buildInterestProfile은 중복 태그를 제거한다',
  buildInterestProfile(['여행', '여행', '음식/취향']).length === 2,
);

test(
  'toggleTagSelection은 미선택 태그를 추가한다',
  JSON.stringify(toggleTagSelection(['여행'], '음식/취향')) === JSON.stringify(['여행', '음식/취향']),
);
test(
  'toggleTagSelection은 이미 선택된 태그를 제거한다',
  JSON.stringify(toggleTagSelection(['여행', '음식/취향'], '여행')) === JSON.stringify(['음식/취향']),
);
test(
  'toggleTagSelection은 5개 선택된 상태에서 새 태그 추가를 무시한다 (최대 제한)',
  toggleTagSelection(['여행', '음식/취향', '라이프스타일', '일/커리어', '인간관계'], '사회이슈')
    .length === 5,
);

console.log('\n[TC-4] 추천 로직 (브리프 섹션 2-2)');
const t1 = { id: 't1', interest_tags: ['여행'], created_at: '2024-01-01T00:00:00Z' };
const t2 = { id: 't2', interest_tags: ['음식/취향'], created_at: '2024-01-02T00:00:00Z' };
const t3 = { id: 't3', interest_tags: ['여행', '음식/취향'], created_at: '2024-01-03T00:00:00Z' };
const t4 = { id: 't4', interest_tags: ['철학/윤리'], created_at: '2024-01-04T00:00:00Z' };
const profile = [
  { tag: '여행', weight: 1 },
  { tag: '음식/취향', weight: 1 },
];

test(
  '관심사 교집합이 많은 주제가 먼저 추천된다',
  recommendTopics([t1, t2, t3, t4], profile, { limit: 4 })[0].id === 't3',
);
test(
  '교집합 개수가 같으면 최신 등록 주제가 우선한다',
  recommendTopics([t1, t2], profile, { limit: 2 })[0].id === 't2',
);
test(
  '추천 개수가 limit에 못 미치면 관심사 밖 주제로 채워진다',
  recommendTopics([t1, t2, t3, t4], profile, { limit: 4 }).length === 4,
);
test(
  '관심사 밖 주제는 교집합 주제보다 뒤에 온다',
  recommendTopics([t1, t2, t3, t4], profile, { limit: 4 }).at(-1).id === 't4',
);
test(
  'limit을 초과하는 개수는 반환하지 않는다',
  recommendTopics([t1, t2, t3, t4], profile, { limit: 2 }).length === 2,
);
test(
  'filterTopicsByTag는 해당 태그를 포함한 주제만, 최신순으로 반환한다',
  JSON.stringify(filterTopicsByTag([t1, t2, t3], '여행').map((t) => t.id)) ===
    JSON.stringify(['t3', 't1']),
);

console.log('\n[TC-5] 티어 진행도 / 별점 로직 (브리프 섹션 2-3, 4)');
test(
  'calcRoundAverage는 3축 평균을 계산한다',
  calcRoundAverage({ validity_score: 60, responsiveness_score: 70, persuasion_score: 80 }) === 70,
);
test('judgments가 없으면 calcRoundAverage는 null이다', calcRoundAverage(null) === null);

test('80점 이상은 3성이다', computeStars(85) === 3);
test('70~79점은 2성이다', computeStars(72) === 2);
test('50~69점은 1성이다', computeStars(55) === 1);
test('50점 미만은 0성이다', computeStars(30) === 0);
test('미도전(null)은 0성이다', computeStars(null) === 0);

const completedRounds = [
  { topic_id: 't1', avgScore: 40 },
  { topic_id: 't1', avgScore: 85 }, // 같은 주제 재도전 시 최고 점수만 반영
  { topic_id: 't2', avgScore: 72 },
];
const clearMap = buildTopicClearMap(completedRounds);
test('같은 주제를 여러 번 도전하면 최고 점수 기준으로 별점이 매겨진다', clearMap.get('t1').stars === 3);
test('도전한 주제는 attempted가 true다', clearMap.get('t1').attempted === true);
test('도전하지 않은 주제는 clearMap에 없다', clearMap.get('t3') === undefined);

test(
  '티어 승급 진행도: 70점 이상 라운드만 카운트된다 (40점 제외, 85/72점만 반영)',
  countTierUpProgress(completedRounds).successCount === 2,
);
test(
  '티어 승급 진행도: 3라운드 이상이어도 required로 캡핑된다',
  countTierUpProgress([
    { topic_id: 'a', avgScore: 90 },
    { topic_id: 'b', avgScore: 90 },
    { topic_id: 'c', avgScore: 90 },
    { topic_id: 'd', avgScore: 90 },
  ]).successCount === 3,
);
test(
  '티어 승급 진행도: 3라운드 달성 시 isEligible이 true다',
  countTierUpProgress([
    { topic_id: 'a', avgScore: 90 },
    { topic_id: 'b', avgScore: 90 },
    { topic_id: 'c', avgScore: 90 },
  ]).isEligible === true,
);

console.log('\n[TC-6] 페르소나 배정 (브리프 섹션 2-3)');
test(
  '같은 주제 ID는 항상 같은 페르소나로 배정된다 (결정론적)',
  assignPersonaForTopic('topic-abc') === assignPersonaForTopic('topic-abc'),
);
test(
  '배정된 페르소나는 항상 PERSONAS 목록 안에 있다',
  ['직설형', '회유형', '데이터형'].includes(assignPersonaForTopic('topic-xyz')),
);

console.log('\n[TC-7] 턴 진행 로직 (브리프 섹션 4 — 고정 8턴, 유저 선공)');
test('0턴 상태에서 다음 턴 번호는 1이다', nextTurnNumber(0) === 1);
test('7턴 진행된 상태에서 다음 턴 번호는 8이다', nextTurnNumber(7) === 8);
test('0턴(라운드 시작)은 유저 차례다', whoseTurn(0) === 'user');
test('1턴 진행 후(유저 1턴 완료)는 AI 차례다', whoseTurn(1) === 'ai');
test('2턴 진행 후는 다시 유저 차례다', whoseTurn(2) === 'user');
test('7턴 진행 후(마지막 유저 턴 전)는 AI 차례다', whoseTurn(7) === 'ai');
test('7턴까지는 라운드가 끝나지 않는다', isRoundComplete(7) === false);
test('8턴이 되면 라운드가 종료된다', isRoundComplete(8) === true);

console.log('\n[TC-8] AI 논객/힌트 시스템 프롬프트 (브리프 섹션 5)');
test(
  '공통 지시에 "논리적으로\\n밀렸음을 인정" 문구가 포함된다',
  COMMON_INSTRUCTION.includes('밀렸음을 인정'),
);
test(
  '페르소나 시스템 프롬프트가 직설형/회유형/데이터형 3종 모두 정의되어 있다',
  ['직설형', '회유형', '데이터형'].every((p) => typeof PERSONA_SYSTEM_PROMPTS[p] === 'string'),
);
test(
  '데이터형 프롬프트는 통계 지어내기 금지 문구를 포함한다',
  PERSONA_SYSTEM_PROMPTS.데이터형.includes('지어내지'),
);

const builtPrompt = buildOpponentSystemPrompt({
  topicTitle: '민트초코는 맛있다',
  topicDescription: '테스트 설명',
  persona: '직설형',
  weakness: '개인 취향을 보편적 사실처럼 일반화',
});
test('조립된 시스템 프롬프트에 공통 지시가 포함된다', builtPrompt.includes(COMMON_INSTRUCTION));
test('조립된 시스템 프롬프트에 페르소나 지시가 포함된다', builtPrompt.includes(PERSONA_SYSTEM_PROMPTS.직설형));
test('조립된 시스템 프롬프트에 주제명이 포함된다', builtPrompt.includes('민트초코는 맛있다'));
test('조립된 시스템 프롬프트에 내부 약점 지침이 포함된다', builtPrompt.includes('개인 취향을 보편적 사실처럼 일반화'));
test(
  '알 수 없는 페르소나로 조립 시 에러를 던진다',
  (() => {
    try {
      buildOpponentSystemPrompt({ topicTitle: 't', persona: '존재안함', weakness: 'x' });
      return false;
    } catch {
      return true;
    }
  })(),
);
test('힌트 시스템 프롬프트는 정답을 대신 쓰지 말라는 지침을 포함한다', buildHintSystemPrompt().includes('대신 작성하지'));

console.log('\n[TC-9] 채점 시스템 프롬프트/스키마/점수 파싱 (브리프 섹션 6)');
test(
  '채점 시스템 프롬프트에 1단계(근거 나열) -> 2단계(점수 산정) 순서 강제 문구가 포함된다',
  JUDGE_SYSTEM_PROMPT.includes('1단계') && JUDGE_SYSTEM_PROMPT.includes('2단계'),
);
test(
  '채점 시스템 프롬프트에 애매한 경우 50점 중립 처리 규칙이 포함된다',
  JUDGE_SYSTEM_PROMPT.includes('50점 중립'),
);
test(
  'JSON 스키마에 3축 + 총평이 모두 required로 포함된다',
  JSON.stringify(JUDGMENT_JSON_SCHEMA.required.sort()) ===
    JSON.stringify(['논점_대응력', '논증_타당성', '설득력_전개', '총평'].sort()),
);
test(
  '축별 스키마에 additionalProperties: false가 설정되어 있다 (구조화 출력 요구사항)',
  JUDGMENT_JSON_SCHEMA.properties.논증_타당성.additionalProperties === false,
);

test('0~100 사이 점수는 그대로 반올림된다', clampScore(72.4) === 72);
test('100점을 초과하는 점수는 100으로 클램프된다', clampScore(150) === 100);
test('0점 미만(음수) 점수는 0으로 클램프된다', clampScore(-10) === 0);
test('숫자가 아닌 값은 50점 중립으로 처리된다', clampScore('알수없음') === 50);

const sampleRaw = {
  논증_타당성: { 점수: 65.6, 근거_목록: [] },
  논점_대응력: { 점수: 120, 근거_목록: [] },
  설득력_전개: { 점수: -5, 근거_목록: [] },
  총평: '테스트 총평입니다.',
};
const parsed = parseJudgmentResult(sampleRaw);
test('parseJudgmentResult가 논증_타당성 점수를 validityScore로 매핑하고 클램프한다', parsed.validityScore === 66);
test('parseJudgmentResult가 논점_대응력 점수를 100으로 클램프한다', parsed.responsivenessScore === 100);
test('parseJudgmentResult가 설득력_전개 점수를 0으로 클램프한다', parsed.persuasionScore === 0);
test('parseJudgmentResult가 총평을 그대로 전달한다', parsed.overallComment === '테스트 총평입니다.');

console.log(`\n총 ${passed + failed}개 중 ${passed}개 통과, ${failed}개 실패\n`);
process.exit(failed > 0 ? 1 : 0);
