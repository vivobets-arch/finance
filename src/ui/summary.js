import { getState, setState, subscribe } from '../state/store.js';
import { formatEUR } from '../utils/money.js';
import { buildMonthSummary } from '../utils/summary.js';

let root;
let unsub = null;

export function mountSummary(parent) {
  if (unsub) unsub();
  root = document.createElement('section');
  root.className = 'summary-page';
  parent.appendChild(root);
  unsub = subscribe(render);
  render(getState());
}

function render(state) {
  if (!root) return;

  const summary = buildMonthSummary({
    transactions: state.transactions,
    categories: state.categories,
    cards: state.cards,
  });

  root.innerHTML = `
    <header class="summary-page__head">
      <button type="button" class="btn btn--ghost summary-page__back" data-back>← Back</button>
      <div>
        <h1 class="summary-page__title">Month summary</h1>
        <p class="summary-page__subtitle">${escapeHtml(summary.label)}</p>
      </div>
    </header>

    <div class="summary-hero">
      <div class="summary-hero__label">Total spent</div>
      <div class="summary-hero__value">${formatEUR(summary.totalSpent)}</div>
      <div class="summary-hero__meta">${summary.expenseCount} expense${summary.expenseCount === 1 ? '' : 's'}</div>
    </div>

    <section class="summary-block">
      <h2>By category</h2>
      ${
        summary.byCategory.length === 0
          ? `<p class="muted">No expenses this month.</p>`
          : `<ul class="summary-bars">
              ${summary.byCategory
                .map(
                  (row) => `
                <li class="summary-bar">
                  <div class="summary-bar__top">
                    <span class="summary-bar__name">${row.icon} ${escapeHtml(row.name)}</span>
                    <span class="summary-bar__amount">${formatEUR(row.amount)}</span>
                  </div>
                  <div class="summary-bar__track">
                    <div class="summary-bar__fill" style="width:${Math.round(row.share * 100)}%"></div>
                  </div>
                  <div class="summary-bar__meta">${row.count} · ${Math.round(row.share * 100)}%</div>
                </li>`,
                )
                .join('')}
            </ul>`
      }
    </section>

    <section class="summary-block">
      <h2>By card</h2>
      <ul class="summary-cards">
        ${summary.byCard
          .map(
            (row) => `
          <li class="summary-card">
            <div class="summary-card__name">${escapeHtml(row.name)}</div>
            <div class="summary-card__spent">${formatEUR(row.spent)} spent</div>
            <div class="summary-card__meta">${row.count} expense${row.count === 1 ? '' : 's'} · available ${formatEUR(row.available)}</div>
            <div class="summary-bar__track">
              <div class="summary-bar__fill" style="width:${Math.round(row.share * 100)}%"></div>
            </div>
          </li>`,
          )
          .join('')}
      </ul>
    </section>
  `;

  root.querySelector('[data-back]')?.addEventListener('click', () => {
    setState({ view: 'home' });
  });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
