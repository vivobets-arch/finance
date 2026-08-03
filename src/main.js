import './styles/main.css';
import { onAuthStateChange } from './services/auth.js';
import { loadUserData } from './services/bootstrap.js';
import { startRealtime, stopRealtime } from './services/realtime.js';
import { getState, setState, subscribe } from './state/store.js';
import { renderAuth } from './ui/auth.js';
import { renderApp } from './ui/app.js';
import { mountToast } from './ui/toast.js';

const app = document.querySelector('#app');
mountToast(document.body);

let paintedStatus = null;
let loadingUserId = null;

function paint(state) {
  if (state.status === paintedStatus) return;
  paintedStatus = state.status;

  if (state.status === 'boot' || state.status === 'loading') {
    app.innerHTML = `<div class="boot">Loading…</div>`;
    return;
  }
  if (state.status === 'auth') {
    renderAuth(app);
    return;
  }
  if (state.status === 'ready') {
    renderApp(app);
  }
}

subscribe(paint);

async function enterSession(session) {
  const user = session.user;
  if (loadingUserId === user.id && getState().status === 'loading') return;
  if (getState().user?.id === user.id && getState().status === 'ready') return;

  loadingUserId = user.id;
  paintedStatus = null;
  setState({ user, status: 'loading', error: null });
  try {
    const data = await loadUserData(user.id);
    paintedStatus = null;
    setState({
      cards: data.cards,
      categories: data.categories,
      transactions: data.transactions,
      selectedCardIndex: 0,
      selectedCategoryId: null,
      view: 'home',
      needsOnboarding: data.needsOnboarding,
      status: 'ready',
    });
    startRealtime(user.id);
  } catch (err) {
    console.error(err);
    paintedStatus = null;
    setState({
      status: 'auth',
      error: err.message,
      toast: { message: err.message || 'Failed to load data', type: 'error' },
    });
  } finally {
    loadingUserId = null;
  }
}

function boot() {
  setState({ status: 'boot' });

  onAuthStateChange(async (session) => {
    if (!session) {
      stopRealtime();
      paintedStatus = null;
      setState({
        user: null,
        cards: [],
        categories: [],
        transactions: [],
        status: 'auth',
      });
      return;
    }
    await enterSession(session);
  });
}

boot();
