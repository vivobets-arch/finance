import { getState, setState, subscribe } from '../state/store.js';
import { addTransaction } from '../services/transactions.js';
import { categoryIconChoices, createCategory } from '../services/categories.js';
import { parseAmount } from '../utils/money.js';
import { openModal } from './modal.js';
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
  // null = no category (allowed). Do not auto-pick the first chip.
  const selectedId = state.selectedCategoryId;
  const noneSelected = selectedId == null;

  const prevAmount = root.querySelector('[name="amount"]')?.value ?? '';
  const prevDesc = root.querySelector('[name="description"]')?.value ?? '';

  root.innerHTML = `
    <div class="category-row" role="listbox" aria-label="Category">
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

  root.querySelector('[data-cat-none]')?.addEventListener('click', () => {
    setState({ selectedCategoryId: null });
  });

  root.querySelectorAll('[data-cat]').forEach((btn) => {
    btn.addEventListener('click', () => setState({ selectedCategoryId: btn.dataset.cat }));
  });

  root.querySelector('[data-add-category]')?.addEventListener('click', openAddCategory);

  root.querySelector('#expense-form').addEventListener('submit', onSubmit);
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
  const categoryId = state.selectedCategoryId || null;

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
