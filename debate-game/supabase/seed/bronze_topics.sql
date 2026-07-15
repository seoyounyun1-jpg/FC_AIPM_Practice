-- 브론즈 티어 초기 시드 데이터 (브리프 섹션 7)
-- 이미 존재하는 title은 건너뛴다 (재실행 안전).

insert into topics (tier, title, description, interest_tags, ai_intended_weakness)
select v.tier, v.title, v.description, v.interest_tags::jsonb, v.ai_intended_weakness
from (
  values
    ('bronze', '민트초코는 맛있다',
     '호불호가 갈리는 민트초코 취향에 대한 논쟁',
     '["음식/취향"]',
     '개인 취향을 보편적 사실처럼 일반화'),
    ('bronze', '여름이 겨울보다 낫다',
     '선호 계절을 둘러싼 라이프스타일 논쟁',
     '["라이프스타일", "여행"]',
     '자기 경험만으로 성급한 일반화'),
    ('bronze', '아침형 인간이 저녁형 인간보다 생산적이다',
     '생활 패턴과 생산성의 상관관계 논쟁',
     '["일/커리어", "라이프스타일"]',
     '상관관계를 인과관계로 착각'),
    ('bronze', '혼자 여행이 단체 여행보다 낫다',
     '여행 스타일 선호에 대한 논쟁',
     '["여행", "인간관계"]',
     '상대 주장을 왜곡하는 허수아비 공격')
) as v(tier, title, description, interest_tags, ai_intended_weakness)
where not exists (
  select 1 from topics t where t.title = v.title
);
