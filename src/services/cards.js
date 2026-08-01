import { supabase } from '../lib/supabase.js';

export async function fetchCards() {
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function seedCards(userId) {
  const rows = [
    { user_id: userId, name: 'Card 1', credit_limit: 0, sort_order: 0 },
    { user_id: userId, name: 'Card 2', credit_limit: 0, sort_order: 1 },
  ];
  const { data, error } = await supabase.from('cards').insert(rows).select();
  if (error) throw error;
  return data;
}

export async function updateCard(id, patch) {
  const { data, error } = await supabase
    .from('cards')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteAllCards() {
  const { error } = await supabase.from('cards').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
}
