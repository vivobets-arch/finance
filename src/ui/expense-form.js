import { getState, setState, subscribe } from '../state/store.js';
import { addTransaction } from '../services/transactions.js';
import { parseAmount } from '../utils/money.js';
import { showToast } from './toast.js';

let root;

export function mountExpenseForm(parent) {
  root = document.createElement('section');
  root.className = 'expense-form';
  parent.appendChild(root);
  subscribe(render);
  render(getState());
}

function render(state) {
  if (!root) return;
  const categories = state.categories || [];
  const selectedId = state.selectedCategoryId || categories[0]?.id || null;

  const prevAmount = root.querySelector('[name="amount"]')?.value ?? '';
  const prevDesc = root.querySelector('[name="description"]')?.value ?? '';

  root.innerHTML = `
    <div class="category-row" role="listbox" aria-label="Category">
      ${categories
        .map(
          (c) => `
        <button type="button" class="category-chip ${c.id === selectedId ? 'is-selected' : ''}" data-cat="${c.id}" title="${escapeAttr(c.name)}">
          <span class="category-chip__icon">${c.icon}</span>
          <span class="category-chip__label">${escapeAttr(c.name)}</span>
        </button>`,
        )
        .join('')}
    </div>
    <form id="expense-form">
      <label class="field">
        <span>Description</span>
        <input class="input" name="description" maxlength="120" placeholder="Optional" value="${escapeAttr(prevDesc)}" />
      </label>
      <label class="field">
        <span>Amount (€)</span>
        <input class="input input--amount" name="amount" inputmode="decimal" placeholder="0.00" required value="${escapeAttr(prevAmount)}" />
      </label>
      <button class="btn btn--primary btn--lg btn--block" type="submit" id="add-expense">Add Expense</button>
    </form>
  `;

  root.querySelectorAll('[data-cat]').forEach((btn) => {
    btn.addEventListener('click', () => setState({ selectedCategoryId: btn.dataset.cat }));
  });

  root.querySelector('#expense-form').addEventListener('submit', onSubmit);
}

async function onSubmit(e) {
  e.preventDefault();
  const state = getState();
  const form = e.currentTarget;
  const submit = form.querySelector('#add-expense');
  const amount = parseAmount(form.amount.value);
  const description = String(form.description.value || '').trim();
  const card = state.cards[state.selectedCardIndex];
  const categoryId = state.selectedCategoryId || state.categories[0]?.id;

  if (!card) {
    showToast('Select a card first', 'error');
    return;
  }
  if (!categoryId) {
    showToast('Pick a category', 'error');
    return;
  }
  if (!amount) {
    showToast('Enter a valid amount', 'error');
    return;
  }

  submit.disabled = true;
  try {
    const tx = await addTransaction({
      userId: state.user.id,
      cardId: card.id,
      categoryId,
      type: 'expense',
      direction: 'debit',
      amount,
      description,
    });
    setState({ transactions: [tx, ...getState().transactions.filter((t) => t.id !== tx.id)] });
    form.amount.value = '';
    form.description.value = '';
    showToast('Expense added', 'success');
  } catch (err) {
    showToast(err.message || 'Could not add expense', 'error');
  } finally {
    submit.disabled = false;
  }
}

function escapeAttr(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}
