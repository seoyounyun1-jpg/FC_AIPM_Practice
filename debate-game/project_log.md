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
