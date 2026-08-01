import { fetchCards, seedCards } from './cards.js';
import { fetchCategories, seedCategories } from './categories.js';
import { fetchTransactions } from './transactions.js';

export async function loadUserData(userId) {
  let cards = await fetchCards();
  let categories = await fetchCategories();
  let seeded = false;

  if (cards.length === 0) {
    cards = await seedCards(userId);
    seeded = true;
  }

  if (categories.length === 0) {
    categories = await seedCategories(userId);
  }

  // Ensure exactly two cards visually ordered
  cards = [...cards].sort((a, b) => a.sort_order - b.sort_order);

  const transactions = await fetchTransactions();

  return {
    cards,
    categories,
    transactions,
    needsOnboarding: seeded,
  };
}
