import { supabase } from '../lib/supabase.js';
import { createId } from '../utils/id.js';

export async function fetchTransactions() {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .is('deleted_at', null)
    .order('occurred_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addTransaction({
  userId,
  cardId,
  categoryId,
  type,
  direction,
  amount,
  description,
  occurredAt,
}) {
  const row = {
    id: createId(),
    user_id: userId,
    card_id: cardId,
    category_id: categoryId || null,
    type,
    direction,
    amount,
    description: description || '',
    occurred_at: occurredAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from('transactions').insert(row).select().single();
  if (error) throw error;
  return data;
}

export async function updateTransaction(id, patch) {
  const { data, error } = await supabase
    .from('transactions')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function softDeleteTransaction(id) {
  return updateTransaction(id, { deleted_at: new Date().toISOString() });
}

export async function deleteAllTransactions() {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
}
