import { getState, setState } from '../state/store.js';
import { signOut } from '../services/auth.js';
import { resetAllData } from '../services/reset.js';
import { stopRealtime } from '../services/realtime.js';
import { showToast } from './toast.js';
import { openOnboarding } from './card-editor.js';

export function mountSettings(parent) {
  const el = document.createElement('div');
  el.className = 'settings';
  el.innerHTML = `
    <button type="button" class="icon-btn settings__toggle" aria-label="Menu" title="Menu">⋮</button>
    <div class="settings__menu" hidden>
      <button type="button" data-action="reset">Reset all data</button>
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
          status: 'auth',
        });
      } catch (err) {
        showToast(err.message || 'Sign out failed', 'error');
      }
      return;
    }
    if (action === 'reset') {
      if (!confirm('Delete all cards and transactions for this account? This cannot be undone.')) {
        return;
      }
      try {
        const userId = getState().user.id;
        const data = await resetAllData(userId);
        setState({
          cards: data.cards,
          categories: data.categories,
          transactions: data.transactions,
          selectedCardIndex: 0,
          selectedCategoryId: data.categories[0]?.id || null,
          needsOnboarding: true,
        });
        showToast('Data reset', 'success');
        openOnboarding(data.cards);
      } catch (err) {
        showToast(err.message || 'Reset failed', 'error');
      }
    }
  });
}
