# AI 논쟁 게임

AI 논객과 1:1 논쟁을 벌이며 논리적 사고력을 기르는 게임형 웹앱. (`CLAUDE_CODE_BRIEF.md` 기준 구현)

## 기술 스택

- Frontend: React + Vite, Tailwind CSS
- 라우팅: react-router-dom
- 차트: recharts (결과/마이페이지 레이더 차트)
- DB/Auth: Supabase (Postgres)
- AI 논객/채점: Anthropic API (Claude) — 논객 응답과 채점은 반드시 별도 API 호출로 분리

## 로컬 개발 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

```bash
cp .env.example .env
```

`.env`에 아래 값을 채워주세요.

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`: Supabase 프로젝트 설정 > API
- `VITE_ANTHROPIC_API_KEY`: https://console.anthropic.com 에서 발급

> 주의: 현재 구조는 Anthropic API를 브라우저에서 직접 호출합니다(로컬 프로토타입 전제).
> 실제 배포 전에는 반드시 서버리스 함수 등으로 키를 서버 사이드로 옮겨야 합니다.

### 3. DB 스키마 적용 (Supabase)

Supabase 프로젝트의 SQL Editor에서 아래 순서로 실행하세요.

1. `supabase/migrations/0001_init.sql` — 테이블 생성 (users/topics/rounds/turns/judgments)
2. `supabase/migrations/0002_policies.sql` — 프로토타입용 RLS 정책 (개방형, 배포 전 교체 필요)
3. `supabase/seed/bronze_topics.sql` — 브론즈 티어 초기 주제 4개 삽입 (재실행해도 중복 삽입되지 않음)

### 4. 개발 서버 실행

```bash
npm run dev
```

## 테스트

```bash
node test/run_tc.mjs
```

시드 데이터/상수 정의에 대한 코드 레벨 테스트입니다. 새 기능 구현 시 이 파일에 TC를 추가합니다.

## 디렉터리 구조

```
src/
  data/        상수, 시드 데이터 JS 버전
  lib/         Supabase 클라이언트, 도메인 로직(추천/티어/채점 등)
  prompts/     AI 논객/채점 시스템 프롬프트
  pages/       화면 단위 컴포넌트
  components/  재사용 UI 컴포넌트
  hooks/       커스텀 훅
supabase/
  migrations/  DB 스키마
  seed/        초기 시드 데이터 SQL
test/          코드 레벨 테스트 (node test/run_tc.mjs)
```
