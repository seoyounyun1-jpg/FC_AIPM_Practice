import { supabase } from './supabaseClient.js';

export async function createJudgment({
  roundId,
  validityScore,
  responsivenessScore,
  persuasionScore,
  overallComment,
  rawResult,
}) {
  const { data, error } = await supabase
    .from('judgments')
    .insert({
      round_id: roundId,
      validity_score: validityScore,
      responsiveness_score: responsivenessScore,
      persuasion_score: persuasionScore,
      overall_comment: overallComment,
      raw_result: rawResult,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
