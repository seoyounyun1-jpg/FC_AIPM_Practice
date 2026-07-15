# 프로젝트 로그 — AI 논쟁 게임

## 2026-07-15 — 1단계: 프로젝트 스캐폴딩 + DB 스키마 + 시드 데이터

### 진행 배경

`CLAUDE_CODE_BRIEF.md`(AI 논쟁 게임)를 기반으로 구현을 시작. 기존 저장소에는 별개 제품인
`ai-pm-app`(AI PM 어시스턴트, React+Vite+Supabase)이 이미 존재하여, 사용자 확인 후 아래와 같이
결정하고 진행함.

- 프로젝트 위치: 별도 새 디렉터리 `debate-game/` (기존 `ai-pm-app`은 건드리지 않음)
- 기술 스택: `CLAUDE.md` 기존 규칙에 따라 React + Vite + Supabase + Vercel
  (브리프의 Next.js/SQLite/Prisma 제안 대신 채택)
- AI 논객/채점 호출: Anthropic API — 사용자가 `.env`에 키를 직접 등록하기로 함

### 완료 내용

1. **프로젝트 스캐폴딩**
   - Vite + React (JS/JSX, 기존 `ai-pm-app`과 동일 컨벤션) + Tailwind CSS v4
   - `react-router-dom`(라우팅), `recharts`(결과/마이페이지 차트), `@supabase/supabase-js`,
     `@anthropic-ai/sdk` 설치
   - 템플릿 보일러플레이트(로고/카운터 데모) 제거, 최소 상태 확인용 스캐폴딩 화면으로 교체

2. **DB 스키마** (`supabase/migrations/0001_init.sql`)
   - 브리프 섹션 3 데이터 모델을 Postgres DDL로 구현: `users`, `topics`, `rounds`, `turns`, `judgments`
   - `judgments` 테이블은 브리프의 한글 필드명(논증_타당성 등)을 그대로 컬럼명으로 쓰지 않고,
     조회/평균 계산용 영문 스코어 컬럼(`validity_score`/`responsiveness_score`/`persuasion_score`)
     + LLM 원본 JSON을 그대로 보존하는 `raw_result` jsonb로 설계 (Postgres 비-ASCII 식별자 quoting
     리스크 회피, 섹션 6 채점 스키마와의 데이터 정합성은 `raw_result`로 100% 보존)
   - 체크 제약: tier enum, persona_type enum, turn_number 1~8, 점수 0~100 범위
   - `judgments.round_id` UNIQUE (라운드당 채점 1회), `rounds→user/topic`, `turns/judgments→round`
     FK에 `on delete cascade` 적용
   - `supabase/migrations/0002_policies.sql`: 프로토타입 단계 개방형 RLS 정책
     (배포 전 실제 인증 연동 후 교체 필요 — 코드 주석에 명시)

3. **시드 데이터** (`supabase/seed/bronze_topics.sql` + `src/data/seedTopics.js`)
   - 브리프 섹션 7의 브론즈 티어 주제 4개 삽입, 재실행 시 중복 삽입 방지(`where not exists`)
   - 프런트엔드 코드 레벨 테스트용으로 동일 데이터의 JS 버전 병행 관리

4. **공용 상수** (`src/data/constants.js`)
   - 관심사 태그 8종(섹션 2-1), 최소/최대 선택 수(2/5), 티어 순서, 페르소나 3종,
     고정 8턴, 힌트 최대 2회, 티어 승급 기준(70점 이상 3라운드) 정의

### 테스트 결과

- **DB 스키마 실제 검증** (로컬 PostgreSQL 16, Supabase와 동일 엔진)
  - 마이그레이션 0001/0002 정상 적용
  - 시드 SQL 삽입 4건 확인 + 재실행 시 0건 삽입(멱등성) 확인
  - 잘못된 tier 값 삽입 시 체크 제약 위반으로 거부됨을 확인
  - turns 8턴 정상 삽입, turn_number=9 삽입 시 체크 제약으로 거부됨을 확인
  - judgments 정상 삽입, 동일 round_id 재삽입 시 UNIQUE 위반으로 거부됨을 확인
  - judgments 점수 150 삽입 시 체크 제약(0~100)으로 거부됨을 확인
  - round 삭제 시 연관 turns/judgments가 cascade로 함께 삭제됨을 확인
  - 검증 후 테스트 DB는 삭제, PostgreSQL 서비스는 중지함 (실 서비스는 Supabase 사용)
- **코드 레벨 테스트** (`node test/run_tc.mjs`, `npm test`): 18개 항목 전부 통과
  (시드 데이터 형태/정합성, 온보딩·게임 규칙 상수 검증)
- **빌드/린트**: `npm run build` 성공(Tailwind CSS 정상 포함), `npm run lint`(oxlint) 통과
- **로컬 구동 확인**: `npm run dev`로 기동 후 HTML/번들 응답 정상 확인, 이후 프로세스 종료

### 사용자가 직접 확인해야 할 항목

1. Supabase 프로젝트를 생성하고 `.env`에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`를 입력
2. Supabase SQL Editor에서 `supabase/migrations/0001_init.sql` → `0002_policies.sql` →
   `supabase/seed/bronze_topics.sql` 순서로 실행 (README 참고)
3. `.env`에 `VITE_ANTHROPIC_API_KEY` 입력 (다음 단계인 AI 논객 연동부터 필요)
4. `npm install && npm run dev`로 로컬 구동 후, 화면에 "Supabase 환경변수: 설정됨" /
   "Anthropic API 환경변수: 설정됨"이 뜨는지 확인

### 다음 단계

2단계(온보딩 화면 — 관심사 태그 선택)로 진행 예정. 진행 전 사용자 확인 예정.

---

## 2026-07-15 — 2단계: 온보딩 화면 (관심사 태그 선택)

### 완료 내용

1. **온보딩 검증 로직** (`src/lib/onboardingValidation.js`)
   - 닉네임 검증(공백/빈값/20자 초과 거부), 관심사 태그 검증(2~5개, 후보 외 태그 거부)
   - `buildInterestProfile`: 선택 태그를 `[{tag, weight:1}]` 형태로 변환 (DB `interest_profile` 저장 형식)
   - `toggleTagSelection`: 태그 선택/해제, 최대 5개 초과 시 추가 무시

2. **로컬 사용자 식별** (`src/lib/localUser.js`) — 별도 로그인 없이 `localStorage`에 생성된
   `users.id`를 저장해 재방문 시 온보딩을 건너뛰도록 함 (브리프에 인증 플로우가 정의되어 있지
   않아 프로토타입 단계에서 채택한 설계)

3. **Supabase 연동** (`src/lib/usersApi.js`): `createUser`, `getUser`

4. **화면** (`src/pages/OnboardingPage.jsx`)
   - 닉네임 입력 + 관심사 태그 칩 다중 선택(2~5개, 선택 개수 카운터 표시)
   - 유효성 미충족 시 제출 버튼 비활성화, 실패 시 에러 메시지 인라인 노출
   - Supabase 미설정 상태를 사전에 배너로 안내

5. **라우팅 재구성** (`src/App.jsx`): `/` 진입 시 로컬 사용자 존재 여부로
   `/onboarding` 또는 `/home`으로 리다이렉트. `/home`은 3단계에서 실제 홈 화면으로
   교체될 임시 화면(`HomePlaceholder.jsx`, 유저 닉네임/티어/경험치/관심사 표시)

### 버그 수정

- `src/lib/supabaseClient.js`: `VITE_SUPABASE_URL`이 비어있으면 `createClient('', '')`가
  즉시 예외를 던져 앱 전체가 부팅 시점에 크래시하는 문제 발견 (Playwright E2E 테스트 중 발견).
  더미 URL로 폴백하도록 수정하여, 실제 Supabase 미설정 시에도 앱은 정상 렌더링되고
  API 호출 시점에만 에러가 발생하도록 개선. `isSupabaseConfigured` 플래그를 노출해
  화면에서 사전 안내 배너를 띄울 수 있도록 함.

### 테스트 결과

- **코드 레벨 테스트** (`npm test`): 35개 항목 전부 통과 (기존 18개 + 온보딩 검증 로직 17개 추가)
- **DB 실동작 검증** (로컬 PostgreSQL): `buildInterestProfile` 산출물을 그대로 `users.interest_profile`에
  삽입해 정상 저장/조회 확인, `nickname` NOT NULL 및 `current_tier` CHECK 제약 정상 거부 확인
- **E2E 브라우저 테스트** (Playwright + 사전 설치된 Chromium, 임시 스크립트로 실행 후 삭제):
  - 최초 진입 시 `/onboarding` 자동 리다이렉트 확인
  - 관심사 미선택/1개 선택 시 제출 버튼 비활성화, 2개 이상 선택 시 활성화 확인
  - 5개 선택 후 6번째 태그 클릭이 무시됨(카운터 5/5 유지) 확인
  - 선택된 태그 재클릭 시 해제됨 확인
  - Supabase 미설정 상태에서 제출 시 앱이 죽지 않고 에러 메시지가 화면에 정상 노출됨 확인
    (이 과정에서 위 크래시 버그를 발견/수정함)
- **빌드/린트**: `npm run build`, `npm run lint`(oxlint) 통과

### 사용자가 직접 확인해야 할 항목

1. Supabase 프로젝트 연결(`.env` 설정 + 마이그레이션/시드 SQL 실행)이 아직이라면, 온보딩에서
   "시작하기"를 눌러도 저장은 실패합니다(에러 메시지로 안내됨). Supabase 연결 후 실제 저장이
   되는지 브라우저에서 직접 확인해주세요.
2. 온보딩 완료 후 `/home`(임시 화면)에 닉네임·티어·경험치·관심사가 올바르게 표시되는지 확인해주세요.
3. 브라우저 개발자 도구 > Application > Local Storage에서 `debate_game_user_id` 값이
   생성되는지, 새로고침 시 온보딩이 다시 뜨지 않는지 확인해주세요.

### 다음 단계

3단계(홈 화면 — 추천 카드 피드)로 진행 예정.

---

## 2026-07-15 — 3단계: 홈 화면 (추천 카드 피드)

### 완료 내용

1. **추천 로직** (`src/lib/recommend.js`)
   - `recommendTopics`: 현재 티어 주제 중 `interest_profile`과의 태그 교집합(가중치 합)이
     높은 순으로 정렬, 동점 시 최신 등록 주제 우선. limit 미달 시 관심사 밖 주제로 채움
   - `filterTopicsByTag`: 관심사 태그별 탐색 섹션용 필터(최신순)

2. **티어 진행도 / 별점 로직** (`src/lib/tierProgress.js`)
   - `calcRoundAverage`: judgments 3축 평균 계산
   - `computeStars`: 80점 이상 3성 / 70점대 2성 / 50점대 1성 / 미만 0성,
     완료했지만 0성인 경우와 "미도전"을 구분(`attempted` 플래그)
   - `buildTopicClearMap`: 같은 주제 재도전 시 최고 점수 기준으로 별점 반영
   - `countTierUpProgress`: 브리프 섹션 4의 승급 조건(70점 이상 3라운드)을 홈 화면
     상단 진행도 표시에 재사용

3. **페르소나 미리보기 배정** (`src/lib/personaAssignment.js`) — 주제 ID 해시 기반으로
   결정론적 배정(카드 재렌더링에도 동일 페르소나 유지). 실제 라운드 배정 로직은 4단계에서 별도 확정

4. **Supabase 연동**: `src/lib/topicsApi.js`(티어별 주제 조회, `ai_intended_weakness` 비노출),
   `src/lib/roundsApi.js`(완료 라운드 + judgments 임베디드 조회)

5. **화면**
   - `src/pages/HomePage.jsx`: 상단 티어/경험치/승급 진행도 바, 중단 "오늘의 추천" 가로 스크롤
     카드, 하단 관심사 태그별 탐색 그리드 섹션(그리드+캐러셀 혼합으로 결정 — 브리프에서
     클로드 코드 재량으로 명시된 구현 세부사항)
   - `src/components/TopicCard.jsx`, `StarRating.jsx`: 주제명/관심사 태그/상대 페르소나/별점 표시
   - `src/components/TopicBottomSheet.jsx`: 카드 클릭 시 주제 상세 + 페르소나 설명 + "대결 시작"
   - `src/pages/RoundPlaceholder.jsx`: "대결 시작" 클릭 시 이동하는 4단계 구현 전 임시 화면
   - `src/App.jsx`: `/home`을 임시 화면에서 실제 홈 화면으로 교체, `/round/:topicId` 라우트 추가

### 테스트 결과

- **코드 레벨 테스트** (`npm test`): 56개 항목 전부 통과 (기존 35개 + 추천/티어진행도/페르소나 로직 21개 추가)
- **DB 실동작 검증** (로컬 PostgreSQL): `rounds ⋈ judgments` 조인 쿼리(supabase-js의 임베디드
  select와 동등)를 실제 실행해, `calcRoundAverage`가 소비하는 필드 구조와 일치함을 확인
- **E2E 브라우저 테스트** (Playwright + Chromium, `.env`에 임시 더미 Supabase URL을 넣고
  `page.route`로 REST 요청을 가로채 고정 응답으로 대체 — 실제 Supabase 없이 화면 로직 전체를
  검증. 테스트 후 `.env`와 임시 스크립트는 삭제):
  - 티어/경험치("브론즈 티어", "경험치 120")·승급 진행도("1/3") 헤더 표시 확인
  - 관심사 교집합 기준 추천 순서가 실제 렌더링에서 기대값과 정확히 일치 확인
  - 완료 이력이 있는 주제는 별 3개(★★★), 나머지는 "미도전"으로 올바르게 구분 표시 확인
  - 카드 클릭 → 바텀시트(주제 설명 + 상대 페르소나) 오픈 → "대결 시작" → `/round/:id`로
    페르소나 정보와 함께 정상 이동 확인
- **빌드/린트**: `npm run build`, `npm run lint`(oxlint) 통과

### 사용자가 직접 확인해야 할 항목

1. Supabase 연결 후 실제 온보딩 → 홈 화면 흐름에서 추천 카드가 관심사에 맞게 뜨는지 확인해주세요.
2. 카드의 관심사 태그별 탐색 섹션(하단)이 선택한 관심사 개수만큼 나오는지 확인해주세요.
   (현재는 그리드 레이아웃 — 가로 스크롤 캐러셀이 더 나은지 사용성 피드백 주시면 조정 가능합니다.)
3. 아직 라운드/채점 기능이 없어 모든 카드가 "미도전"으로 보일 것입니다. 4~5단계 구현 후
   실제 클리어 시 별점이 반영되는지 다시 확인이 필요합니다.

### 다음 단계

4단계(대화 라운드 화면 — AI 논객 Anthropic API 연동)로 진행 예정.

---

## 2026-07-15 — 4단계: 대화(라운드) 화면 — AI 논객 Anthropic API 연동

### 완료 내용

1. **Anthropic API 연동** (`src/lib/anthropicClient.js`)
   - `@anthropic-ai/sdk`를 `dangerouslyAllowBrowser: true`로 브라우저에서 직접 호출
     (기존 `ai-pm-app`이 Google GenAI를 클라이언트에서 직접 호출하는 것과 동일한 로컬
     프로토타입 컨벤션 — 실제 배포 전 서버리스 함수로 이전 필요, README/`.env.example`에 명시)
   - 모델: `claude-opus-4-8` (Claude API 스킬 가이드에 따라 사용자가 다른 모델을 명시하지
     않는 한 기본값)

2. **AI 논객 시스템 프롬프트** (`src/prompts/debatePrompts.js`) — 브리프 섹션 5의
   공통 지시 + 페르소나별(직설형/회유형/데이터형) 지시를 **그대로** 사용.
   `buildOpponentSystemPrompt`가 주제/페르소나/`ai_intended_weakness`를 조립하는데,
   **AI가 주제를 옹호하는 입장, 유저가 반박하는 입장**으로 구도를 설계함(브리프에
   명시되지 않아 클로드 코드가 판단한 부분 — `ai_intended_weakness`가 "내부 설계용,
   유저 비노출"이라는 필드 목적상, AI가 주제를 옹호하며 은연중에 그 약점을 드러내고
   유저가 이를 공략하는 구조가 가장 자연스럽다고 판단). 약점 문구는 시스템 프롬프트에만
   포함되고 UI에는 절대 노출하지 않음.

3. **턴 진행 로직** (`src/lib/turnFlow.js`) — 고정 8턴, 유저가 먼저 시작해 유저/AI가
   번갈아 진행(유저 1,3,5,7턴 / AI 2,4,6,8턴). 논객 응답 생성과 채점(5단계)은 반드시
   별도 API 호출로 분리한다는 브리프 원칙을 지키기 위해, 이번 단계에서는 채점 로직을
   전혀 포함하지 않음.

4. **힌트 기능** — 라운드당 최대 2회, 페널티 없이 사용 횟수만 `rounds.hint_used_count`에
   기록(브리프 섹션 4). 힌트는 정답을 대신 써주지 않고 방향만 제시하도록 별도 시스템
   프롬프트로 생성(`getHint`) — 논객 응답 생성과 별개의 API 호출.

5. **Supabase 연동 확장**: `topicsApi.getTopicById`/`getTopicWeakness`,
   `roundsApi.createRound`/`addTurn`/`updateHintCount`/`completeRound`

6. **화면**: `src/hooks/useDebateRound.js`(상태 머신: loading → ready ↔ ai-thinking →
   completed/error) + `src/pages/RoundPage.jsx`(채팅 UI, 턴 카운터, 힌트 버튼, 완료 화면).
   `RoundPlaceholder.jsx`는 실제 구현으로 교체되어 삭제.

### 테스트 결과

- **코드 레벨 테스트** (`npm test`): 73개 항목 전부 통과 (기존 56개 + 턴 진행/프롬프트
  조립 로직 17개 추가) — 턴 순서(유저 선공, 8턴 종료), 시스템 프롬프트 조립(공통 지시/
  페르소나/주제/약점 포함 여부), 알 수 없는 페르소나 에러 처리, 힌트 프롬프트 검증
- **DB 실동작 검증** (로컬 PostgreSQL): 유저 생성 → 라운드 생성 → 8턴 삽입(유저 4/AI 4) →
  힌트 카운트 갱신(0→1→2) → 라운드 완료 처리까지 전체 플로우를 실제 SQL로 실행해 확인
- **E2E 브라우저 테스트** (Playwright + Chromium, `.env`에 더미 Supabase/Anthropic 값을
  넣고 `page.route`로 Supabase REST와 `https://api.anthropic.com/v1/messages` 요청을
  모두 가로채 고정 응답으로 대체 — 실제 API 키 없이, 그리고 사용자의 실제 API 크레딧을
  소비하지 않고 전체 로직을 검증. 테스트 후 `.env`와 임시 스크립트는 삭제):
  - 라운드 진입 시 주제명 정상 표시
  - 힌트 요청 → 힌트 텍스트 노출 + 카운터 1/2 갱신 확인
  - 유저 4턴 입력 → AI 4턴 응답까지 8턴 전체 진행 후 "라운드 완료!" 화면 전환 확인
  - 완료 화면에 힌트 사용 횟수(1회) 정확히 표시 확인
  - Anthropic API 호출 횟수(힌트 1회 + 논객 응답 4회 = 5회)와 DB에 저장된 턴 개수(8개),
    speaker 교대 순서(user,ai,user,ai...) 정확히 일치 확인
  - 실제 전송된 요청 바디를 캡처해 모델(`claude-opus-4-8`), 페르소나 지시문, 주제명,
    내부 약점 지침, 공통 지시가 시스템 프롬프트에 모두 포함됨을 직접 확인
- **빌드/린트**: `npm run build`, `npm run lint`(oxlint) 통과 (번들 크기 경고 발생 —
  `@anthropic-ai/sdk` 포함으로 613KB, 기능상 문제는 없으나 추후 코드 스플리팅 고려 가능)

### 사용자가 직접 확인해야 할 항목

1. **`.env`에 실제 `VITE_ANTHROPIC_API_KEY`를 넣고 브라우저에서 직접 라운드를 진행해
   실제 Claude 응답 품질을 확인해주세요.** 특히:
   - 페르소나별 말투(직설형/회유형/데이터형)가 브리프 의도대로 구현되는지
   - 유저가 논리적으로 타당한 반박을 했을 때 AI가 실제로 "그 논점에서는 밀렸다"고
     인정하는지 (공통 지시 검증 — 섹션 9의 "채점 프롬프트 신뢰성 검증"과 별개로,
     논객 프롬프트 자체의 동작도 실제 대화로 확인 필요)
   - 데이터형 페르소나가 실제 통계를 지어내지 않는지 (브리프 섹션 7에서 별도 검증
     필요하다고 명시된 항목)
2. Anthropic API는 브라우저에서 직접 호출되므로(`dangerouslyAllowBrowser`), 브라우저
   개발자 도구 네트워크 탭에 API 키가 노출됩니다. 로컬 개발 단계에서는 문제없지만,
   실제 배포 전 반드시 서버리스 함수로 이전해야 합니다(README에 명시).
3. 8턴 완료 후 "채점 및 결과 화면은 5단계에서 구현됩니다"라는 임시 문구가 나옵니다 —
   정상입니다.

### 다음 단계

5단계(채점 API + 결과 화면)로 진행 예정.

---

## 2026-07-15 — 5단계: 채점 API + 결과 화면

### 완료 내용

1. **채점 시스템 프롬프트/스키마** (`src/prompts/judgePrompt.js`) — 브리프 섹션 6의
   채점 프롬프트를 **그대로** 사용. 근거 나열(1단계) → 점수 산정(2단계) 순서 강제,
   애매한 경우 50점 중립 처리 규칙 포함. 프롬프트의 JSON 출력 형식을 Anthropic
   `output_config.format`(json_schema)으로도 이중 강제해 파싱 실패 리스크를 낮춤
   (모든 객체에 `additionalProperties:false` 지정 — 구조화 출력 제약사항 준수).

2. **채점 API 호출** (`src/lib/judgingApi.js`) — 라운드 종료 후 전체 대화를 1회
   호출로 3축 동시 채점(Listwise). **논객 응답 생성(4단계)과 완전히 분리된 별도
   API 호출**로 구현해 자기선호 편향 방지 원칙을 지킴.

3. **점수 정규화** (`src/lib/judgmentScoring.js`) — 브리프 섹션 4의 "최종 0~100
   클램프" 규칙을 클라이언트에서 방어적으로 적용(`clampScore`). JSON Schema 자체는
   숫자 범위 제약을 걸 수 없으므로(Anthropic 구조화 출력 제약) 이 클램프가
   실질적인 안전장치.

4. **DB 저장** (`src/lib/judgmentsApi.js`) — `judgments` 테이블에 3축 점수 +
   총평 + LLM 원본 응답(`raw_result`) 그대로 저장. `raw_result`는 섹션 9의
   "채점 프롬프트 신뢰성 검증"을 나중에 실제 대화 로그로 재검토할 때 그대로 활용 가능.

5. **라운드 완료 → 채점 자동 트리거** (`src/hooks/useDebateRound.js`) — 상태 머신에
   `judging` 단계 추가(ready ↔ ai-thinking → judging → completed). 8턴 완료 시
   자동으로 채점 API를 호출하고, 실패해도 라운드 자체는 저장된 상태로 유지(채점만
   재시도 가능하도록 에러를 결과 화면에서 안내).

6. **결과 화면** (`src/pages/ResultPage.jsx`) — `recharts`의 `RadarChart`로 3축
   레이더 차트 + 축별 점수 카드 + 총평 + 턴별 판정 로그(축별로 턴 번호/발언 요약/
   판단/영향 표시). `RoundPage`는 8턴 완료 시 `/result/:roundId`로 자동 이동.

### 테스트 결과

- **코드 레벨 테스트** (`npm test`): 85개 항목 전부 통과 (기존 73개 + 채점 프롬프트/
  스키마/점수 클램프 로직 12개 추가)
- **DB 실동작 검증** (로컬 PostgreSQL): 라운드 생성 → 8턴 → judgments 삽입(한글 키
  포함 `raw_result` JSONB) → `ResultPage`가 사용하는 것과 동등한 조인 조회로 축별
  근거_목록까지 정확히 조회됨을 확인. 동일 라운드에 채점 중복 삽입 시 UNIQUE 제약으로
  거부됨(라운드당 채점 1회 규칙) 확인
- **E2E 브라우저 테스트** (Playwright + Chromium, `.env`에 더미 값 + Supabase REST와
  Anthropic API를 모두 스텁 처리 — API 크레딧 소비 없이 검증. 테스트 후 `.env`와
  임시 스크립트 삭제):
  - 유저 4턴 입력 후 AI 응답 4턴 + 자동 채점을 거쳐 `/result/:roundId`로 자동 이동 확인
  - 결과 화면에 주제명, 총평, 3축 점수(72/68/81), 턴별 판정 로그(턴 3/5/7, 영향
    +10/+12/+18)가 모두 정확히 표시됨을 확인
  - 레이더 차트(recharts SVG)가 실제로 렌더링됨을 확인
  - Anthropic API 총 호출 횟수(논객 응답 4회 + 채점 1회 = 5회)가 기대값과 정확히
    일치함을 확인 — 논객 응답과 채점이 실제로 분리된 별도 호출임을 실증
- **빌드/린트**: `npm run build`, `npm run lint`(oxlint) 통과 (번들 크기 경고 계속
  증가 중 — `recharts` 추가로 905KB. 기능상 문제는 없으나 코드 스플리팅 고려 필요)

### 사용자가 직접 확인해야 할 항목

1. **실제 API 키로 전체 라운드를 플레이해 채점 결과의 실제 신뢰성을 확인해주세요**
   (브리프 섹션 9에서 별도로 다뤄야 한다고 명시된 항목):
   - 같은 대화를 반복 채점했을 때 점수 편차가 얼마나 되는지
   - 명백히 강한 논증과 약한 논증을 구분해내는지(변별력)
   - 근거_목록의 턴 번호/발언 요약이 실제 대화 내용과 일치하는지
2. 채점 API 응답이 JSON Schema를 따르더라도 `raw_result`의 `총평`이나 `판단` 필드
   내용이 실제로 유용한 피드백인지 확인해주세요.
3. 채점이 실패하는 경우(네트워크 오류 등) 결과 화면에서 "아직 채점 결과가 없습니다"
   메시지가 뜨는지 확인해주세요 — 이 경우 라운드 자체는 DB에 저장되어 있으므로
   데이터 손실은 없습니다.

### 다음 단계

6단계(경험치/티어 승급 로직)로 진행 예정.

---

## 2026-07-15 — 6단계: 경험치/티어 승급 로직

### 완료 내용

1. **경험치/승급 판정 로직** (`src/lib/expProgression.js`)
   - `calcExpGain`: 브리프에 경험치 산정 공식이 명시되어 있지 않아 클로드 코드가 결정 —
     라운드 3축 평균 점수를 그대로 경험치로 환산(0~100점 → 0~100exp). 별도로
     검증이 필요하면 조정 가능함을 project_log에 명시.
   - `nextTier`: bronze→silver→gold→platinum 순차 승급, 플래티넘에서는 `null`
     반환(승급 상한, 강등 없음 — 브리프 확정 원칙)
   - `evaluateProgression`: 3단계(홈 화면)에서 이미 구현한 `countTierUpProgress`
     (70점 이상 3라운드)를 재사용해 승급 여부 판정 — 로직 중복 없이 홈 화면
     진행도 표시와 실제 승급 판정이 동일한 기준을 공유

2. **유저 갱신** (`src/lib/usersApi.js`) — `applyUserProgress`: exp 누적(+티어
   승급 시 `current_tier` 갱신). 강등 로직은 존재하지 않음.

3. **자동 트리거** (`src/hooks/useDebateRound.js`) — 채점(5단계) 성공 직후,
   해당 라운드가 속한 티어의 완료 라운드 전체(방금 끝난 라운드 포함)를 다시
   조회해 승급 여부를 판정하고 `users` 테이블에 반영. 경험치/승급 처리가
   실패해도 라운드·채점 결과는 이미 저장된 상태이므로 데이터 손실 없이
   콘솔 에러만 남김(사용자 플레이 경험을 막지 않음).
   - 라운드는 `user.current_tier`를 기록해 생성되므로(3단계부터 구현됨),
     승급 후 새로 시작하는 라운드는 자동으로 새 티어로 기록되고 과거 라운드는
     원래 티어로 남아 "해당 티어 내 3라운드" 판정이 티어 전환 시 자연스럽게
     리셋됨(별도 리셋 로직 불필요 — 스키마 설계로 해결).

4. **결과 화면 반영** (`src/pages/ResultPage.jsx`, `RoundPage.jsx`) — 라운드
   완료 시 계산된 `progression`(경험치 획득량, 승급 여부, 승급 티어, 진행도)을
   라우터 state로 결과 화면에 전달해 "경험치 +N 획득" / "OO 티어로 승급!"
   배너와 티어 승급 진행도(n/3)를 표시. 결과 화면을 새로고침하는 등 state가
   없는 경우에는 배너 없이 채점 결과만 표시(경험치/티어는 이미 DB에 반영되어
   있으므로 데이터 정합성에는 문제 없음).

### 테스트 결과

- **코드 레벨 테스트** (`npm test`): 95개 항목 전부 통과 (기존 85개 + 경험치/
  승급 로직 10개 추가) — 경험치 반올림, 티어 순차 승급, 플래티넘 상한, 3라운드
  미달 시 미승급, 3라운드 달성 시 승급 등 검증
- **DB 실동작 검증** (로컬 PostgreSQL): 유저 생성(exp=0, bronze) → 70점 이상
  라운드 3개(80/80/72점) 생성 및 채점 → exp 누적(232) + 티어 실버 승급까지
  실제 SQL로 시뮬레이션해 확인. 승급 후에도 과거 라운드는 tier='bronze'로
  유지됨을 확인(향후 마이페이지 티어별 통계 정확성의 전제)
- **E2E 브라우저 테스트** (Playwright + Chromium, Supabase REST + Anthropic API
  스텁. 테스트 후 `.env`와 임시 스크립트 삭제): 기존 브론즈 70점 이상 라운드
  2회 완료 상태(exp=100)에서 3번째 라운드를 85점으로 마쳤을 때
  - 결과 화면에 "경험치 +85 획득" 배너 정확히 표시
  - "실버 티어로 승급!" 안내 정확히 표시
  - 티어 승급 진행도 "3/3" 정확히 표시
  - `users` 테이블에 대한 PATCH 요청 body가 `exp: 185`(100+85),
    `current_tier: 'silver'`로 정확히 전송됨을 확인
- **빌드/린트**: `npm run build`, `npm run lint`(oxlint) 통과

### 사용자가 직접 확인해야 할 항목

1. **경험치 산정 공식**(라운드 평균 점수 = 경험치)이 게임 밸런스상 적절한지
   확인해주세요. 브리프에 공식이 명시되어 있지 않아 클로드 코드가 임의로
   결정한 부분이라, 실제 플레이 후 너무 빠르거나 느리게 승급된다면 조정이
   필요합니다(브리프 섹션 4의 "확인 필요" 항목인 밸런스 이슈와 연결됨).
2. 홈 화면(3단계)의 "티어 승급까지 n/3" 표시와 실제 승급 시점이 일치하는지
   실제 플레이로 확인해주세요.
3. 승급 직후 홈 화면으로 돌아갔을 때 새 티어의 주제가 노출되는지 확인해주세요
   (홈 화면은 `user.current_tier` 기준으로 주제를 필터링하므로 이론상 자동
   반영되어야 하나, 실제 확인이 필요합니다).

### 다음 단계

7단계(마이페이지 — 히스토리, 축별 평균 추이)로 진행 예정.
