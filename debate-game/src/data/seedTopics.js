// supabase/seed/bronze_topics.sql 과 동일한 내용의 JS 버전.
// 코드 레벨 테스트 및 로컬 폴백(Supabase 미연결 시) 용도.
export const BRONZE_SEED_TOPICS = [
  {
    title: '민트초코는 맛있다',
    tier: 'bronze',
    description: '호불호가 갈리는 민트초코 취향에 대한 논쟁',
    interest_tags: ['음식/취향'],
    ai_intended_weakness: '개인 취향을 보편적 사실처럼 일반화',
  },
  {
    title: '여름이 겨울보다 낫다',
    tier: 'bronze',
    description: '선호 계절을 둘러싼 라이프스타일 논쟁',
    interest_tags: ['라이프스타일', '여행'],
    ai_intended_weakness: '자기 경험만으로 성급한 일반화',
  },
  {
    title: '아침형 인간이 저녁형 인간보다 생산적이다',
    tier: 'bronze',
    description: '생활 패턴과 생산성의 상관관계 논쟁',
    interest_tags: ['일/커리어', '라이프스타일'],
    ai_intended_weakness: '상관관계를 인과관계로 착각',
  },
  {
    title: '혼자 여행이 단체 여행보다 낫다',
    tier: 'bronze',
    description: '여행 스타일 선호에 대한 논쟁',
    interest_tags: ['여행', '인간관계'],
    ai_intended_weakness: '상대 주장을 왜곡하는 허수아비 공격',
  },
];
