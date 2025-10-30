import { supabase } from './supabaseClient';

/**
 * Fetch single medical card for a user (returns { data, error })
 * uid: string (auth user id)
 */
export async function getCardForUser(uid) {
  if (!uid) return { data: null, error: new Error('No uid provided') };
  const { data, error } = await supabase
    .from('medical_cards')
    .select('*')
    .eq('user_id', uid)
    .limit(1)
    .maybeSingle();
  return { data, error };
}

/**
 * Upsert a medical card by user_id.
 * card must include user_id.
 * Returns { data, error }
 */
export async function upsertCardByUser(card) {
  if (!card || !card.user_id) return { data: null, error: new Error('card.user_id required') };
  const payload = { ...card, updated_at: new Date().toISOString() };
  const { data, error } = await supabase
    .from('medical_cards')
    .upsert(payload, { onConflict: 'user_id' })
    .select()
    .maybeSingle();
  return { data, error };
}