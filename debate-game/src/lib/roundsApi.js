import { supabase } from './supabaseClient.js';
import { calcRoundAverage } from './tierProgress.js';

/** 특정 유저가 특정 티어에서 완료한 라운드 + 채점 결과를 조회한다. */
export async function getCompletedRoundsWithScores(userId, tier) {
  const { data, error } = await supabase
    .from('rounds')
    .select('id, topic_id, judgments(validity_score, responsiveness_score, persuasion_score)')
    .eq('user_id', userId)
    .eq('tier', tier)
    .eq('status', 'completed');

  if (error) throw error;

  return (data ?? []).map((round) => ({
    id: round.id,
    topic_id: round.topic_id,
    avgScore: calcRoundAverage(round.judgments?.[0] ?? null),
  }));
}
