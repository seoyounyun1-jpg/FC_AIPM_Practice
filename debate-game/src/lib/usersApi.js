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
