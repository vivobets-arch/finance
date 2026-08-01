import { mountCards } from './cards.js';
import { mountExpenseForm } from './expense-form.js';
import { mountTransactionList } from './transaction-list.js';
import { mountSettings } from './settings.js';
import { openOnboarding } from './card-editor.js';
import { getState } from '../state/store.js';

export function renderApp(container) {
  container.innerHTML = `
    <div class="app-shell">
      <header class="app-header">
        <div class="app-header__brand">FinanceTrack</div>
        <div class="app-header__actions" id="header-actions"></div>
      </header>
      <main class="app-main" id="app-main"></main>
    </div>
  `;

  const headerActions = container.querySelector('#header-actions');
  const main = container.querySelector('#app-main');
  mountSettings(headerActions);
  mountCards(main);
  mountExpenseForm(main);
  mountTransactionList(main);

  if (getState().needsOnboarding) {
    queueMicrotask(() => openOnboarding(getState().cards));
  }
}
