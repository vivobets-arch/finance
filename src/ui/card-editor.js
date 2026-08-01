import { getState, setState } from '../state/store.js';
import { updateCard } from '../services/cards.js';
import { addTransaction } from '../services/transactions.js';
import { availableForCard, formatEUR, parseAmount } from '../utils/money.js';
import { openModal } from './modal.js';
import { showToast } from './toast.js';

export function openCardEditor(card) {
  const state = getState();
  const current = availableForCard(card.id, state.transactions);

  openModal({
    title: 'Edit card',
    submitLabel: 'Save',
    bodyHtml: `
      <label class="field">
        <span>Name</span>
        <input class="input" name="name" required value="${escapeAttr(card.name)}" maxlength="40" />
      </label>
      <label class="field">
        <span>Credit limit (€)</span>
        <input class="input" name="credit_limit" inputmode="decimal" value="${escapeAttr(card.credit_limit)}" />
      </label>
      <label class="field">
        <span>Available balance (€)</span>
        <input class="input" name="available" inputmode="decimal" value="${escapeAttr(current.toFixed(2))}" />
        <small class="field__hint">Current: ${formatEUR(current)}. Changing this adds an adjustment to the ledger.</small>
      </label>
    `,
    onSubmit: async (formData, close) => {
      try {
        const name = String(formData.get('name') || '').trim();
        const limitRaw = String(formData.get('credit_limit') || '').trim().replace(',', '.');
        const limit = Number(limitRaw);
        if (!name) throw new Error('Name is required');
        if (!Number.isFinite(limit) || limit < 0) throw new Error('Invalid credit limit');

        const availableRaw = String(formData.get('available') || '').trim();
        const target = Number(availableRaw.replace(',', '.'));
        if (!Number.isFinite(target)) throw new Error('Invalid available balance');

        const updated = await updateCard(card.id, { name, credit_limit: limit });
        const cards = getState().cards.map((c) => (c.id === updated.id ? updated : c));
        setState({ cards });

        const latest = availableForCard(card.id, getState().transactions);
        const delta = Math.round((target - latest) * 100) / 100;
        if (delta !== 0) {
          const tx = await addTransaction({
            userId: state.user.id,
            cardId: card.id,
            categoryId: null,
            type: 'adjustment',
            direction: delta > 0 ? 'credit' : 'debit',
            amount: Math.abs(delta),
            description: delta > 0 ? 'Balance adjustment (credit)' : 'Balance adjustment (debit)',
          });
          setState({ transactions: [tx, ...getState().transactions] });
        }

        showToast('Card updated', 'success');
        close();
      } catch (err) {
        showToast(err.message || 'Could not update card', 'error');
        throw err;
      }
    },
  });
}

export function openOnboarding(cards) {
  if (!cards?.length) return;
  const card = cards[0];
  openModal({
    title: 'Set up your cards',
    submitLabel: 'Continue',
    bodyHtml: `
      <p class="muted">Set an opening available balance for <strong>${escapeAttr(card.name)}</strong>. You can edit both cards anytime by tapping them.</p>
      <label class="field">
        <span>Opening available (€)</span>
        <input class="input" name="available" inputmode="decimal" placeholder="0.00" />
      </label>
      <label class="field">
        <span>Credit limit (€)</span>
        <input class="input" name="credit_limit" inputmode="decimal" placeholder="0.00" value="0" />
      </label>
    `,
    onSubmit: async (formData, close) => {
      try {
        const state = getState();
        const limit = Number(String(formData.get('credit_limit') || '0').replace(',', '.')) || 0;
        const amount = parseAmount(formData.get('available'));
        const updated = await updateCard(card.id, { credit_limit: Math.max(0, limit) });
        setState({
          cards: state.cards.map((c) => (c.id === updated.id ? updated : c)),
          needsOnboarding: false,
        });
        if (amount) {
          const tx = await addTransaction({
            userId: state.user.id,
            cardId: card.id,
            categoryId: null,
            type: 'adjustment',
            direction: 'credit',
            amount,
            description: 'Opening balance',
          });
          setState({ transactions: [tx, ...getState().transactions] });
        }
        showToast('You are ready to track expenses', 'success');
        close();
      } catch (err) {
        showToast(err.message || 'Setup failed', 'error');
        throw err;
      }
    },
  });
}

function escapeAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}
