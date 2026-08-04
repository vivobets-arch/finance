import { getState, setState, subscribe } from '../state/store.js';
import { addTransaction } from '../services/transactions.js';
import { categoryIconChoices, createCategory } from '../services/categories.js';
import { parseAmount } from '../utils/money.js';
import { openModal } from './modal.js';
import { showToast } from './toast.js';

let root;
let unsub = null;
/** Draft kept across re-renders; cleared after a successful add. */
let draft = { amount: '', description: '', txMode: 'expense' };

export function mountExpenseForm(parent) {
  if (unsub) unsub();
  root = document.createElement('section');
  root.className = 'expense-form';
  parent.appendChild(root);
  unsub = subscribe(render);
  render(getState());
}

function render(state) {
  if (!root) return;
  const categories = state.categories || [];
  const selectedId = state.selectedCategoryId;
  const noneSelected = selectedId == null;
  const isExpense = draft.txMode === 'expense';

  root.innerHTML = `
    <div class="form-mode-segmented">
      <button type="button" class="form-mode-btn ${isExpense ? 'is-active' : ''}" data-mode="expense">
        − Expense
      </button>
      <button type="button" class="form-mode-btn ${!isExpense ? 'is-active' : ''}" data-mode="money">
        + Add Money
      </button>
    </div>

    ${
      isExpense
        ? `<div class="category-row" role="listbox" aria-label="Category">
            <button type="button" class="category-chip ${noneSelected ? 'is-selected' : ''}" data-cat-none title="No category">
              <span class="category-chip__icon">—</span>
              <span class="category-chip__label">None</span>
            </button>
            ${categories
              .map(
                (c) => `
              <button type="button" class="category-chip ${c.id === selectedId ? 'is-selected' : ''}" data-cat="${c.id}" title="${escapeAttr(c.name)}">
                <span class="category-chip__icon">${c.icon}</span>
                <span class="category-chip__label">${escapeAttr(c.name)}</span>
              </button>`,
              )
              .join('')}
            <button type="button" class="category-chip category-chip--add" data-add-category title="Add category">
              <span class="category-chip__icon">➕</span>
              <span class="category-chip__label">New</span>
            </button>
          </div>`
        : ''
    }

    <form id="expense-form">
      <label class="field">
        <span>Description</span>
        <input class="input" name="description" maxlength="120" placeholder="${isExpense ? 'Optional' : 'e.g. Salary, ATM, Deposit'}" value="${escapeAttr(draft.description)}" />
      </label>
      <label class="field">
        <span>Amount (€)</span>
        <input class="input input--amount" name="amount" inputmode="decimal" placeholder="0.00" required value="${escapeAttr(draft.amount)}" />
      </label>
      <button class="btn ${isExpense ? 'btn--primary' : 'btn--income'} btn--lg btn--block" type="submit" id="add-expense">
        ${isExpense ? 'Add Expense' : 'Add Money (+)'}
      </button>
    </form>
  `;

  const form = root.querySelector('#expense-form');
  form.description.addEventListener('input', () => {
    draft.description = form.description.value;
  });
  form.amount.addEventListener('input', () => {
    draft.amount = form.amount.value;
  });

  root.querySelectorAll('[data-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      draft.txMode = btn.dataset.mode;
      render(getState());
    });
  });

  root.querySelector('[data-cat-none]')?.addEventListener('click', () => {
    setState({ selectedCategoryId: null });
  });

  root.querySelectorAll('[data-cat]').forEach((btn) => {
    btn.addEventListener('click', () => setState({ selectedCategoryId: btn.dataset.cat }));
  });

  root.querySelector('[data-add-category]')?.addEventListener('click', openAddCategory);

  form.addEventListener('submit', onSubmit);
}

function openAddCategory() {
  const icons = categoryIconChoices();
  openModal({
    title: 'New category',
    submitLabel: 'Add',
    bodyHtml: `
      <label class="field">
        <span>Name</span>
        <input class="input" name="name" required maxlength="40" placeholder="e.g. Pharmacy" />
      </label>
      <fieldset class="field">
        <span>Icon</span>
        <div class="icon-picker">
          ${icons
            .map(
              (icon, i) => `
            <label class="icon-picker__option">
              <input type="radio" name="icon" value="${icon}" ${i === 0 ? 'checked' : ''} />
              <span>${icon}</span>
            </label>`,
            )
            .join('')}
        </div>
      </fieldset>
    `,
    onSubmit: async (formData, close) => {
      try {
        const name = String(formData.get('name') || '').trim();
        const icon = String(formData.get('icon') || '📌');
        if (!name) throw new Error('Name is required');

        const state = getState();
        const category = await createCategory(state.user.id, { name, icon });
        setState({
          categories: [...state.categories, category].sort(
            (a, b) => a.sort_order - b.sort_order,
          ),
          selectedCategoryId: category.id,
        });
        showToast('Category added', 'success');
        close();
      } catch (err) {
        showToast(err.message || 'Could not add category', 'error');
        throw err;
      }
    },
  });
}

async function onSubmit(e) {
  e.preventDefault();
  const state = getState();
  const form = e.currentTarget;
  const submit = form.querySelector('#add-expense');
  const amount = parseAmount(form.amount.value);
  const description = String(form.description.value || '').trim();
  const card = state.cards[state.selectedCardIndex];
  const isExpense = draft.txMode === 'expense';
  const categoryId = isExpense ? state.selectedCategoryId || null : null;

  if (!card) {
    showToast('Select a card first', 'error');
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
      type: isExpense ? 'expense' : 'adjustment',
      direction: isExpense ? 'debit' : 'credit',
      amount,
      description: description || (isExpense ? '' : 'Cash deposit'),
    });
    draft = { amount: '', description: '', txMode: draft.txMode };
    setState({ transactions: [tx, ...getState().transactions.filter((t) => t.id !== tx.id)] });
    showToast(isExpense ? 'Expense added' : `+€${amount.toFixed(2)} added to ${card.name}`, 'success');
  } catch (err) {
    showToast(err.message || 'Could not add transaction', 'error');
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
