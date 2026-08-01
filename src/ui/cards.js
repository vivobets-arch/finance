import { getState, setState, subscribe } from '../state/store.js';
import { availableForCard, formatEUR } from '../utils/money.js';
import { openCardEditor } from './card-editor.js';

let root;
let startX = 0;

export function mountCards(parent) {
  root = document.createElement('section');
  root.className = 'cards-panel';
  parent.appendChild(root);
  subscribe(render);
  render(getState());
}

function render(state) {
  if (!root) return;
  const cards = state.cards || [];
  if (cards.length === 0) {
    root.innerHTML = `<p class="muted">No cards yet.</p>`;
    return;
  }

  const index = Math.min(state.selectedCardIndex || 0, cards.length - 1);
  const card = cards[index];
  const available = availableForCard(card.id, state.transactions);
  const negative = available < 0;

  root.innerHTML = `
    <div class="carousel" data-carousel>
      <article class="credit-card" data-edit-card>
        <div class="credit-card__top">
          <span class="credit-card__name">${escapeHtml(card.name)}</span>
          <span class="credit-card__pos">${index + 1} / ${cards.length}</span>
        </div>
        <div class="credit-card__balance ${negative ? 'is-negative' : ''}">${formatEUR(available)}</div>
        <div class="credit-card__meta">Limit ${formatEUR(card.credit_limit)} · tap to edit</div>
      </article>
      <div class="carousel__controls">
        <button type="button" class="icon-btn" data-prev aria-label="Previous card">‹</button>
        <div class="dots">
          ${cards.map((_, i) => `<span class="dot ${i === index ? 'is-active' : ''}"></span>`).join('')}
        </div>
        <button type="button" class="icon-btn" data-next aria-label="Next card">›</button>
      </div>
    </div>
  `;

  root.querySelector('[data-edit-card]')?.addEventListener('click', () => openCardEditor(card));
  root.querySelector('[data-prev]')?.addEventListener('click', () => shift(-1));
  root.querySelector('[data-next]')?.addEventListener('click', () => shift(1));

  const carousel = root.querySelector('[data-carousel]');
  carousel.addEventListener('touchstart', (e) => {
    startX = e.changedTouches[0].clientX;
  }, { passive: true });
  carousel.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) < 40) return;
    shift(dx < 0 ? 1 : -1);
  }, { passive: true });
}

function shift(delta) {
  const { cards, selectedCardIndex } = getState();
  if (!cards.length) return;
  const next = (selectedCardIndex + delta + cards.length) % cards.length;
  setState({ selectedCardIndex: next });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
