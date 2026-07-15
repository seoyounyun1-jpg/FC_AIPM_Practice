import { supabase } from './supabaseClient.js';

export async function createUser({ nickname, interestProfile }) {
  const { data, error } = await supabase
    .from('users')
    .insert({
      nickname,
      interest_profile: interestProfile,
      current_tier: 'bronze',
      exp: 0,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUser(userId) {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();

  if (error) throw error;
  return data;
}

/** 라운드 종료 후 경험치 누적(+티어 승급 시 current_tier 갱신). 강등 없음. */
export async function applyUserProgress(userId, { expGain, currentExp, newTier }) {
  const update = { exp: currentExp + expGain };
  if (newTier) update.current_tier = newTier;

  const { data, error } = await supabase
    .from('users')
    .update(update)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
