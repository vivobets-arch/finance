import { getState, setState } from '../state/store.js';
import { updateTransaction, softDeleteTransaction } from '../services/transactions.js';
import { parseAmount } from '../utils/money.js';
import { openModal } from './modal.js';
import { showToast } from './toast.js';

export function openTransactionEditor(tx) {
  const state = getState();
  const isAdjustment = tx.type === 'adjustment';

  const categoryOptions = (state.categories || [])
    .map(
      (c) =>
        `<option value="${c.id}" ${c.id === tx.category_id ? 'selected' : ''}>${c.icon} ${escapeAttr(c.name)}</option>`,
    )
    .join('');

  const cardOptions = (state.cards || [])
    .map(
      (c) =>
        `<option value="${c.id}" ${c.id === tx.card_id ? 'selected' : ''}>${escapeAttr(c.name)}</option>`,
    )
    .join('');

  openModal({
    title: isAdjustment ? 'Edit adjustment' : 'Edit expense',
    submitLabel: 'Save',
    bodyHtml: `
      ${
        isAdjustment
          ? ''
          : `<label class="field"><span>Category</span>
              <select class="input" name="category_id" required>${categoryOptions}</select>
            </label>`
      }
      <label class="field">
        <span>Card</span>
        <select class="input" name="card_id" required>${cardOptions}</select>
      </label>
      <label class="field">
        <span>Description</span>
        <input class="input" name="description" value="${escapeAttr(tx.description || '')}" ${
          isAdjustment ? 'required' : ''
        } />
      </label>
      <label class="field">
        <span>Amount (€)</span>
        <input class="input" name="amount" inputmode="decimal" required value="${escapeAttr(tx.amount)}" />
      </label>
      ${
        isAdjustment
          ? `<label class="field"><span>Direction</span>
              <select class="input" name="direction">
                <option value="credit" ${tx.direction === 'credit' ? 'selected' : ''}>Credit (+)</option>
                <option value="debit" ${tx.direction === 'debit' ? 'selected' : ''}>Debit (−)</option>
              </select>
            </label>`
          : ''
      }
      <button type="button" class="btn btn--danger btn--block" id="delete-tx">Delete</button>
    `,
    onSubmit: async (formData, close) => {
      try {
        const amount = parseAmount(formData.get('amount'));
        if (!amount) throw new Error('Invalid amount');
        const patch = {
          amount,
          description: String(formData.get('description') || '').trim(),
          card_id: String(formData.get('card_id')),
        };
        if (!isAdjustment) {
          patch.category_id = String(formData.get('category_id'));
        } else {
          patch.direction = String(formData.get('direction'));
          if (!patch.description) throw new Error('Description required');
        }
        const updated = await updateTransaction(tx.id, patch);
        setState({
          transactions: getState().transactions.map((t) => (t.id === updated.id ? updated : t)),
        });
        showToast('Transaction updated', 'success');
        close();
      } catch (err) {
        showToast(err.message || 'Update failed', 'error');
        throw err;
      }
    },
  });

  // Wire delete after modal mounts
  queueMicrotask(() => {
    const btn = document.getElementById('delete-tx');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this transaction?')) return;
      try {
        const updated = await softDeleteTransaction(tx.id);
        setState({
          transactions: getState().transactions.filter((t) => t.id !== updated.id),
        });
        showToast('Transaction deleted', 'success');
        document.querySelector('.modal-overlay')?.remove();
      } catch (err) {
        showToast(err.message || 'Delete failed', 'error');
      }
    });
  });
}

function escapeAttr(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}
