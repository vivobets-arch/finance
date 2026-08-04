import { getState, setState } from '../state/store.js';
import { addTransaction } from '../services/transactions.js';
import { openModal } from './modal.js';
import { showToast } from './toast.js';
import { parseAmount } from '../utils/money.js';

export function openAddMoneyModal(card) {
  const state = getState();
  const presetAmounts = [10, 20, 50, 100, 200, 500];

  openModal({
    title: `Add Money to ${card.name}`,
    submitLabel: 'Add Money',
    bodyHtml: `
      <div class="quick-amounts-label">Quick Amounts</div>
      <div class="quick-amounts" aria-label="Quick amount shortcuts">
        ${presetAmounts
          .map(
            (amt) =>
              `<button type="button" class="quick-amount-chip" data-amt="${amt}">+€${amt}</button>`,
          )
          .join('')}
      </div>
      <label class="field">
        <span>Amount (€)</span>
        <input class="input input--amount" name="amount" inputmode="decimal" placeholder="0.00" required autofocus />
      </label>
      <label class="field">
        <span>Description</span>
        <input class="input" name="description" placeholder="e.g. ATM, Salary, Deposit" value="Cash deposit" />
      </label>
    `,
    onSubmit: async (formData, close) => {
      try {
        const amount = parseAmount(formData.get('amount'));
        const description = String(formData.get('description') || '').trim() || 'Cash deposit';
        if (!amount) throw new Error('Enter a valid amount');

        const tx = await addTransaction({
          userId: state.user.id,
          cardId: card.id,
          categoryId: null,
          type: 'adjustment',
          direction: 'credit',
          amount,
          description,
        });

        setState({
          transactions: [tx, ...getState().transactions.filter((t) => t.id !== tx.id)],
        });

        showToast(`+€${amount.toFixed(2)} added to ${card.name}`, 'success');
        close();
      } catch (err) {
        showToast(err.message || 'Could not add money', 'error');
        throw err;
      }
    },
  });

  // Attach event listeners for quick amount chips in modal
  queueMicrotask(() => {
    const overlay = document.querySelector('.modal-overlay');
    if (!overlay) return;
    const amountInput = overlay.querySelector('input[name="amount"]');
    overlay.querySelectorAll('[data-amt]').forEach((chip) => {
      chip.addEventListener('click', () => {
        const addAmt = Number(chip.dataset.amt);
        const current = parseAmount(amountInput.value) || 0;
        amountInput.value = (current + addAmt).toString();
      });
    });
  });
}
