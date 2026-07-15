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
