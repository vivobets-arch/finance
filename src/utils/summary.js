import { signedAmount } from './money.js';

/** Start/end of the calendar month containing `date` (local time). */
export function monthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { start, end };
}

export function formatMonthLabel(date = new Date()) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function inMonth(iso, start, end) {
  const t = new Date(iso).getTime();
  return t >= start.getTime() && t < end.getTime();
}

/**
 * Monthly expense summary from the ledger.
 * Expenses = type expense (debits). Adjustments are excluded from "spent".
 */
export function buildMonthSummary({ transactions, categories, cards, date = new Date() }) {
  const { start, end } = monthRange(date);
  const active = (transactions || []).filter((t) => !t.deleted_at);

  const expenses = active.filter(
    (t) => t.type === 'expense' && inMonth(t.occurred_at, start, end),
  );

  const totalSpent = expenses.reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const catMap = Object.fromEntries((categories || []).map((c) => [c.id, c]));
  const byCategoryMap = new Map();
  for (const t of expenses) {
    const key = t.category_id || '__none__';
    const prev = byCategoryMap.get(key) || { id: key, amount: 0, count: 0 };
    prev.amount += Number(t.amount || 0);
    prev.count += 1;
    byCategoryMap.set(key, prev);
  }

  const byCategory = [...byCategoryMap.values()]
    .map((row) => {
      const cat = catMap[row.id];
      return {
        id: row.id,
        name: cat?.name || 'None',
        icon: cat?.icon || '•',
        amount: row.amount,
        count: row.count,
        share: totalSpent > 0 ? row.amount / totalSpent : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  const byCard = (cards || [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((card) => {
      const cardExpenses = expenses.filter((t) => t.card_id === card.id);
      const spent = cardExpenses.reduce((sum, t) => sum + Number(t.amount || 0), 0);
      const available = active
        .filter((t) => t.card_id === card.id)
        .reduce((sum, t) => sum + signedAmount(t), 0);
      return {
        id: card.id,
        name: card.name,
        spent,
        available,
        count: cardExpenses.length,
        share: totalSpent > 0 ? spent / totalSpent : 0,
      };
    });

  return {
    label: formatMonthLabel(date),
    start,
    end,
    totalSpent,
    expenseCount: expenses.length,
    byCategory,
    byCard,
  };
}
