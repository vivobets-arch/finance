import { getState, setState, subscribe } from '../state/store.js';

let root;

export function mountToast(parent) {
  root = document.createElement('div');
  root.className = 'toast-host';
  root.setAttribute('aria-live', 'polite');
  parent.appendChild(root);

  subscribe(render);
  render(getState());
}

function render(state) {
  if (!root) return;
  if (!state.toast) {
    root.innerHTML = '';
    return;
  }
  root.innerHTML = `<div class="toast toast--${state.toast.type || 'info'}">${escapeHtml(state.toast.message)}</div>`;
}

export function showToast(message, type = 'info', ms = 3200) {
  setState({ toast: { message, type } });
  window.clearTimeout(showToast._t);
  showToast._t = window.setTimeout(() => {
    if (getState().toast?.message === message) setState({ toast: null });
  }, ms);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
