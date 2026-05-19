import { supabase } from './supabaseClient';


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