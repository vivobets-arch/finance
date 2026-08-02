import { DEFAULT_MONTHLY_AVAILABLE } from '../constants.js';
import { addTransaction } from './transactions.js';

/** Credit each card with the monthly opening available amount. */
export async function seedOpeningBalances(userId, cards, amount = DEFAULT_MONTHLY_AVAILABLE) {
  const created = [];
  for (const card of cards) {
    const tx = await addTransaction({
      userId,
      cardId: card.id,
      categoryId: null,
      type: 'adjustment',
      direction: 'credit',
      amount,
      description: 'Monthly opening balance',
    });
    created.push(tx);
  }
  return created;
}
