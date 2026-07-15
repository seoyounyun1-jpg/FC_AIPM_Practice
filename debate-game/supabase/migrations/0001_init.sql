-- AI 논쟁 게임 초기 스키마
-- Supabase SQL Editor에서 실행하거나 `supabase db push`로 적용하세요.

create extension if not exists "pgcrypto";

-- ──────────────────────────────────────────────
-- users
-- ──────────────────────────────────────────────
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  nickname text not null,
  current_tier text not null default 'bronze'
    check (current_tier in ('bronze', 'silver', 'gold', 'platinum')),
  exp integer not null default 0,
  interest_profile jsonb not null default '[]'::jsonb, -- [{ tag: string, weight: number }]
  created_at timestamptz not null default now()
);

-- ──────────────────────────────────────────────
-- topics
-- ──────────────────────────────────────────────
create table if not exists topics (
  id uuid primary key default gen_random_uuid(),
  tier text not null check (tier in ('bronze', 'silver', 'gold', 'platinum')),
  title text not null,
  description text,
  interest_tags jsonb not null default '[]'::jsonb, -- string[]
  ai_intended_weakness text, -- 내부 설계용, 클라이언트에 노출 금지
  created_at timestamptz not null default now()
);

-- ──────────────────────────────────────────────
-- rounds
-- ──────────────────────────────────────────────
create table if not exists rounds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  topic_id uuid not null references topics(id) on delete restrict,
  persona_type text not null check (persona_type in ('직설형', '회유형', '데이터형')),
  tier text not null check (tier in ('bronze', 'silver', 'gold', 'platinum')),
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  hint_used_count integer not null default 0,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_rounds_user_id on rounds(user_id);
create index if not exists idx_rounds_topic_id on rounds(topic_id);

-- ──────────────────────────────────────────────
-- turns
-- ──────────────────────────────────────────────
create table if not exists turns (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id) on delete cascade,
  turn_number integer not null check (turn_number between 1 and 8),
  speaker text not null check (speaker in ('user', 'ai')),
  content text not null,
  created_at timestamptz not null default now(),
  unique (round_id, turn_number, speaker)
);

create index if not exists idx_turns_round_id on turns(round_id);

-- ──────────────────────────────────────────────
-- judgments
-- 브리프 섹션 6의 채점 JSON 스키마(논증_타당성/논점_대응력/설득력_전개/총평)를
-- raw_result에 그대로 보존하고, 조회/평균 계산용으로 점수만 별도 컬럼에 둔다.
-- ──────────────────────────────────────────────
create table if not exists judgments (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null unique references rounds(id) on delete cascade,
  validity_score integer not null check (validity_score between 0 and 100),        -- 논증_타당성
  responsiveness_score integer not null check (responsiveness_score between 0 and 100), -- 논점_대응력
  persuasion_score integer not null check (persuasion_score between 0 and 100),    -- 설득력_전개
  overall_comment text not null,                                                   -- 총평
  raw_result jsonb not null,                                                       -- LLM 원본 JSON 응답
  created_at timestamptz not null default now()
);

create index if not exists idx_judgments_round_id on judgments(round_id);
