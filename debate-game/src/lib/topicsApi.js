import { supabase } from './supabaseClient.js';

// ai_intended_weakness는 내부 설계용으로 유저에게 노출하지 않는다.
const PUBLIC_TOPIC_COLUMNS = 'id, tier, title, description, interest_tags, created_at';

export async function getTopicsByTier(tier) {
  const { data, error } = await supabase
    .from('topics')
    .select(PUBLIC_TOPIC_COLUMNS)
    .eq('tier', tier);

  if (error) throw error;
  return data;
}

export async function getTopicById(topicId) {
  const { data, error } = await supabase
    .from('topics')
    .select(PUBLIC_TOPIC_COLUMNS)
    .eq('id', topicId)
    .single();

  if (error) throw error;
  return data;
}

/** 논객 시스템 프롬프트 조립에만 사용 — UI에는 절대 렌더링하지 않는다. */
export async function getTopicWeakness(topicId) {
  const { data, error } = await supabase
    .from('topics')
    .select('ai_intended_weakness')
    .eq('id', topicId)
    .single();

  if (error) throw error;
  return data.ai_intended_weakness;
}
