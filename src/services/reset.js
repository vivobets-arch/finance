import { fetchCards } from './cards.js';
import { fetchCategories } from './categories.js';
import { deleteAllTransactions } from './transactions.js';
import { seedOpeningBalances } from './balances.js';

/**
 * End-of-month reset: clear spending history and restore each card to €2600 available.
 * Keeps card names, credit limits, and categories.
 */
export async function resetMonth(userId) {
  let cards = await fetchCards();
  cards = [...cards].sort((a, b) => a.sort_order - b.sort_order);

  await deleteAllTransactions();
  const transactions = await seedOpeningBalances(userId, cards);
  const categories = await fetchCategories();

  return {
    cards,
    categories,
    transactions,
    needsOnboarding: false,
  };
}

/** @deprecated use resetMonth */
export async function resetAllData(userId) {
  return resetMonth(userId);
}
