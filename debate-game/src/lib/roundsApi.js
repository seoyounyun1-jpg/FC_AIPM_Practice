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

export async function createRound({ userId, topicId, persona, tier }) {
  const { data, error } = await supabase
    .from('rounds')
    .insert({
      user_id: userId,
      topic_id: topicId,
      persona_type: persona,
      tier,
      status: 'in_progress',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function addTurn({ roundId, turnNumber, speaker, content }) {
  const { data, error } = await supabase
    .from('turns')
    .insert({ round_id: roundId, turn_number: turnNumber, speaker, content })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** 힌트는 라운드당 최대 2회, 페널티 없음 — 사용 횟수만 기록한다. */
export async function updateHintCount(roundId, hintCount) {
  const { error } = await supabase
    .from('rounds')
    .update({ hint_used_count: hintCount })
    .eq('id', roundId);

  if (error) throw error;
}

export async function completeRound(roundId) {
  const { error } = await supabase
    .from('rounds')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', roundId);

  if (error) throw error;
}
