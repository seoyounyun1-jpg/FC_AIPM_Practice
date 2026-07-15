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
