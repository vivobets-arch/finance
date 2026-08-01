import { supabase } from '../lib/supabase.js';
import { fetchCards } from './cards.js';
import { fetchTransactions } from './transactions.js';
import { setState } from '../state/store.js';

let channel = null;

export function startRealtime(userId) {
  stopRealtime();

  channel = supabase
    .channel(`finance-${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'cards', filter: `user_id=eq.${userId}` },
      async () => {
        try {
          const cards = await fetchCards();
          setState({ cards: cards.sort((a, b) => a.sort_order - b.sort_order) });
        } catch (err) {
          console.error(err);
        }
      },
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` },
      async () => {
        try {
          const transactions = await fetchTransactions();
          setState({ transactions });
        } catch (err) {
          console.error(err);
        }
      },
    )
    .subscribe();
}

export function stopRealtime() {
  if (channel) {
    supabase.removeChannel(channel);
    channel = null;
  }
}
