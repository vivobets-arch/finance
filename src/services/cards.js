import { supabase } from '../lib/supabase.js';
import { CARD_PRESETS, DEFAULT_MONTHLY_AVAILABLE } from '../constants.js';

export async function fetchCards() {
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function seedCards(userId) {
  const rows = CARD_PRESETS.map((preset) => ({
    user_id: userId,
    name: preset.name,
    credit_limit: DEFAULT_MONTHLY_AVAILABLE,
    sort_order: preset.sort_order,
  }));
  const { data, error } = await supabase.from('cards').insert(rows).select();
  if (error) throw error;
  return data;
}

/** Rename legacy Card 1/2 and add Cash if missing. */
export async function ensureCardPresets(userId, cards) {
  let list = [...cards].sort((a, b) => a.sort_order - b.sort_order);
  const renames = [
    { from: /^card\s*1$/i, to: 'Wizz Air', sort_order: 0 },
    { from: /^card\s*2$/i, to: 'Platinum', sort_order: 1 },
  ];

  for (const rule of renames) {
    const card = list.find((c) => rule.from.test(c.name));
    if (card) {
      const updated = await updateCard(card.id, {
        name: rule.to,
        sort_order: rule.sort_order,
      });
      list = list.map((c) => (c.id === updated.id ? updated : c));
    }
  }

  const names = new Set(list.map((c) => c.name.toLowerCase()));
  const missing = CARD_PRESETS.filter((p) => !names.has(p.name.toLowerCase()));

  if (missing.length) {
    const rows = missing.map((preset) => ({
      user_id: userId,
      name: preset.name,
      credit_limit: DEFAULT_MONTHLY_AVAILABLE,
      sort_order: preset.sort_order,
    }));
    const { data, error } = await supabase.from('cards').insert(rows).select();
    if (error) throw error;
    list = [...list, ...(data || [])];
  }

  return list.sort((a, b) => a.sort_order - b.sort_order);
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
  const { error } = await supabase
    .from('cards')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
}
