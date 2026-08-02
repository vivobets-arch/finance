import { supabase } from '../lib/supabase.js';

export const DEFAULT_CATEGORIES = [
  { name: 'Food', icon: '🍔', sort_order: 0 },
  { name: 'Fuel', icon: '⛽', sort_order: 1 },
  { name: 'Shopping', icon: '🛒', sort_order: 2 },
  { name: 'Coffee', icon: '☕', sort_order: 3 },
  { name: 'Entertainment', icon: '🎮', sort_order: 4 },
  { name: 'Bills', icon: '🏠', sort_order: 5 },
  { name: 'Other', icon: '📦', sort_order: 6 },
];

const ICON_CHOICES = ['📌', '🚗', '💊', '✈️', '🎁', '🐕', '💪', '📱', '🧾', '⭐'];

export function categoryIconChoices() {
  return ICON_CHOICES;
}

export async function fetchCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function seedCategories(userId) {
  const rows = DEFAULT_CATEGORIES.map((c) => ({ ...c, user_id: userId }));
  const { data, error } = await supabase.from('categories').insert(rows).select();
  if (error) throw error;
  return data;
}

export async function createCategory(userId, { name, icon }) {
  const existing = await fetchCategories();
  const sort_order =
    existing.reduce((max, c) => Math.max(max, Number(c.sort_order) || 0), -1) + 1;

  const { data, error } = await supabase
    .from('categories')
    .insert({
      user_id: userId,
      name: name.trim(),
      icon: icon || '📌',
      sort_order,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteAllCategories() {
  const { error } = await supabase
    .from('categories')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
}
