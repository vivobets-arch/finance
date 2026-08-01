import { deleteAllCards, seedCards } from './cards.js';
import { deleteAllCategories, seedCategories } from './categories.js';
import { deleteAllTransactions } from './transactions.js';
import { loadUserData } from './bootstrap.js';

export async function resetAllData(userId) {
  await deleteAllTransactions();
  await deleteAllCards();
  await deleteAllCategories();
  await seedCards(userId);
  await seedCategories(userId);
  return loadUserData(userId);
}
