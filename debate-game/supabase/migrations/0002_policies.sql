-- 프로토타입 단계 RLS 정책
-- 브리프에 별도 로그인/인증 플로우가 정의되어 있지 않아, 로컬 개발 단계에서는
-- anon key로 자유롭게 CRUD 가능하도록 개방한다.
-- 배포(Vercel) 전 반드시 실제 인증 연동 후 사용자 소유권 기반 정책으로 교체할 것.

alter table users enable row level security;
alter table topics enable row level security;
alter table rounds enable row level security;
alter table turns enable row level security;
alter table judgments enable row level security;

create policy "dev_all_users" on users for all using (true) with check (true);
create policy "dev_all_topics" on topics for all using (true) with check (true);
create policy "dev_all_rounds" on rounds for all using (true) with check (true);
create policy "dev_all_turns" on turns for all using (true) with check (true);
create policy "dev_all_judgments" on judgments for all using (true) with check (true);
