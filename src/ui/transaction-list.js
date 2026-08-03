import { getState, setState, subscribe } from '../state/store.js';
import { softDeleteTransaction } from '../services/transactions.js';
import { formatEUR, signedAmount } from '../utils/money.js';
import { openTransactionEditor } from './transaction-editor.js';
import { showToast } from './toast.js';

let root;
let unsub = null;

export function mountTransactionList(parent) {
  if (unsub) unsub();
  root = document.createElement('section');
  root.className = 'tx-list';
  parent.appendChild(root);
  unsub = subscribe(render);
  render(getState());
}

function render(state) {
  if (!root) return;
  const txs = (state.transactions || []).filter((t) => !t.deleted_at);
  const catMap = Object.fromEntries((state.categories || []).map((c) => [c.id, c]));
  const cardMap = Object.fromEntries((state.cards || []).map((c) => [c.id, c]));

  root.innerHTML = `
    <div class="section-head">
      <h2>Recent</h2>
    </div>
    ${
      txs.length === 0
        ? `<p class="muted">No transactions yet.</p>`
        : `<ul class="tx-items">
        ${txs
          .slice(0, 40)
          .map((t) => {
            const cat = catMap[t.category_id];
            const card = cardMap[t.card_id];
            const signed = signedAmount(t);
            const icon = t.type === 'adjustment' ? '↺' : cat?.icon || '•';
            const title =
              t.type === 'adjustment'
                ? t.description || 'Adjustment'
                : t.description || cat?.name || 'Expense';
            const when = formatWhen(t.occurred_at);
            return `
              <li class="tx-row">
                <button type="button" class="tx-item" data-id="${t.id}">
                  <span class="tx-item__icon">${icon}</span>
                  <span class="tx-item__body">
                    <span class="tx-item__title">${escapeHtml(title)}</span>
                    <span class="tx-item__meta">${escapeHtml(card?.name || 'Card')} · ${when}${
                      t.type === 'adjustment' ? ' · adj' : ''
                    }</span>
                  </span>
                  <span class="tx-item__amount ${signed >= 0 ? 'is-credit' : ''}">${
                    signed >= 0 ? '+' : ''
                  }${formatEUR(signed)}</span>
                </button>
                <button type="button" class="tx-delete" data-delete="${t.id}" aria-label="Delete" title="Delete">✕</button>
              </li>`;
          })
          .join('')}
      </ul>`
    }
  `;

  root.querySelectorAll('[data-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tx = getState().transactions.find((t) => t.id === btn.dataset.id);
      if (tx) openTransactionEditor(tx);
    });
  });

  root.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.dataset.delete;
      if (!confirm('Delete this transaction?')) return;
      btn.disabled = true;
      try {
        const updated = await softDeleteTransaction(id);
        setState({
          transactions: getState().transactions.filter((t) => t.id !== updated.id),
        });
        showToast('Transaction deleted', 'success');
      } catch (err) {
        showToast(err.message || 'Delete failed', 'error');
        btn.disabled = false;
      }
    });
  });
}

function formatWhen(iso) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
