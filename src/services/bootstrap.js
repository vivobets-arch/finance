import { DEFAULT_MONTHLY_AVAILABLE } from '../constants.js';
import { ensureCardPresets, fetchCards, seedCards, updateCard } from './cards.js';
import { fetchCategories, seedCategories } from './categories.js';
import { fetchTransactions } from './transactions.js';
import { seedOpeningBalances } from './balances.js';

export async function loadUserData(userId) {
  let cards = await fetchCards();
  let categories = await fetchCategories();
  let justSeeded = false;

  if (cards.length === 0) {
    cards = await seedCards(userId);
    justSeeded = true;
  } else {
    cards = await ensureCardPresets(userId, cards);
  }

  if (categories.length === 0) {
    categories = await seedCategories(userId);
  }

  cards = [...cards].sort((a, b) => a.sort_order - b.sort_order);

  let transactions = await fetchTransactions();

  for (const card of cards) {
    if (Number(card.credit_limit) === 0) {
      const updated = await updateCard(card.id, {
        credit_limit: DEFAULT_MONTHLY_AVAILABLE,
      });
      cards = cards.map((c) => (c.id === updated.id ? updated : c));
    }
  }

  // Cards with no ledger rows yet (new account or newly added Cash) get €2600
  const cardsNeedingOpen = cards.filter(
    (c) => !transactions.some((t) => t.card_id === c.id),
  );
  if (justSeeded || cardsNeedingOpen.length) {
    const targets = justSeeded && transactions.length === 0 ? cards : cardsNeedingOpen;
    if (targets.length) {
      const extra = await seedOpeningBalances(userId, targets);
      transactions = [...extra, ...transactions];
    }
  }

  return {
    cards,
    categories,
    transactions,
    needsOnboarding: false,
  };
}
