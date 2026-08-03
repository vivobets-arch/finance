import { getState, setState, subscribe } from '../state/store.js';
import { mountCards } from './cards.js';
import { mountExpenseForm } from './expense-form.js';
import { mountTransactionList } from './transaction-list.js';
import { mountSettings } from './settings.js';
import { mountSummary } from './summary.js';

let shell;
let lastView = null;
let unsubView = null;

export function renderApp(container) {
  if (unsubView) {
    unsubView();
    unsubView = null;
  }

  container.innerHTML = `
    <div class="app-shell">
      <header class="app-header">
        <div class="app-header__brand">FinanceTrack</div>
        <div class="app-header__actions" id="header-actions">
          <button type="button" class="nav-link" data-nav="summary" title="Month summary">Summary</button>
          <div id="settings-slot"></div>
        </div>
      </header>
      <main class="app-main" id="app-main"></main>
    </div>
  `;

  shell = container;
  mountSettings(container.querySelector('#settings-slot'));

  container.querySelector('[data-nav="summary"]')?.addEventListener('click', () => {
    setState({ view: 'summary' });
  });

  lastView = null;
  paintView(getState());
  unsubView = subscribe(paintView);
}

function paintView(state) {
  if (!shell) return;
  const main = shell.querySelector('#app-main');
  const nav = shell.querySelector('[data-nav="summary"]');
  if (!main) return;

  if (nav) {
    nav.hidden = state.view === 'summary';
  }

  if (state.view === lastView) return;
  lastView = state.view;
  main.innerHTML = '';

  if (state.view === 'summary') {
    mountSummary(main);
    return;
  }

  mountCards(main);
  mountExpenseForm(main);
  mountTransactionList(main);
}
