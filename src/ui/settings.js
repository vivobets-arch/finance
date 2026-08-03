import { getState, setState } from '../state/store.js';
import { signOut } from '../services/auth.js';
import { resetMonth } from '../services/reset.js';
import { stopRealtime } from '../services/realtime.js';
import { showToast } from './toast.js';
import { DEFAULT_MONTHLY_AVAILABLE } from '../constants.js';
import { formatEUR } from '../utils/money.js';

export function mountSettings(parent) {
  const el = document.createElement('div');
  el.className = 'settings';
  el.innerHTML = `
    <button type="button" class="icon-btn settings__toggle" aria-label="Menu" title="Menu">⋮</button>
    <div class="settings__menu" hidden>
      <button type="button" data-action="reset">Reset month (${formatEUR(DEFAULT_MONTHLY_AVAILABLE)})</button>
      <button type="button" data-action="signout">Sign out</button>
    </div>
  `;
  parent.appendChild(el);

  const menu = el.querySelector('.settings__menu');
  el.querySelector('.settings__toggle').addEventListener('click', () => {
    menu.hidden = !menu.hidden;
  });

  document.addEventListener('click', (e) => {
    if (!el.contains(e.target)) menu.hidden = true;
  });

  menu.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    menu.hidden = true;
    const action = btn.dataset.action;
    if (action === 'signout') {
      try {
        stopRealtime();
        await signOut();
        setState({
          user: null,
          cards: [],
          categories: [],
          transactions: [],
          view: 'home',
          status: 'auth',
        });
      } catch (err) {
        showToast(err.message || 'Sign out failed', 'error');
      }
      return;
    }
    if (action === 'reset') {
      if (
        !confirm(
          `Reset the month? All expenses will be cleared and all cards (Wizz, Platinum, Cash) go back to ${formatEUR(DEFAULT_MONTHLY_AVAILABLE)}.`,
        )
      ) {
        return;
      }
      try {
        const userId = getState().user.id;
        const data = await resetMonth(userId);
        setState({
          cards: data.cards,
          categories: data.categories,
          transactions: data.transactions,
          selectedCardIndex: 0,
          selectedCategoryId: null,
          needsOnboarding: false,
        });
        showToast(`Reset — all cards at ${formatEUR(DEFAULT_MONTHLY_AVAILABLE)}`, 'success');
      } catch (err) {
        showToast(err.message || 'Reset failed', 'error');
      }
    }
  });
}
