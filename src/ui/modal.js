export function openModal({ title, bodyHtml, onSubmit, submitLabel = 'Save' }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <header class="modal__header">
        <h2>${title}</h2>
        <button type="button" class="icon-btn" data-close aria-label="Close">✕</button>
      </header>
      <form class="modal__body" id="modal-form">
        ${bodyHtml}
        <div class="modal__actions">
          <button type="button" class="btn btn--ghost" data-close>Cancel</button>
          <button type="submit" class="btn btn--primary">${submitLabel}</button>
        </div>
      </form>
    </div>
  `;

  const close = () => overlay.remove();
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target.closest('[data-close]')) close();
  });

  overlay.querySelector('#modal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn.disabled = true;
    try {
      await onSubmit(new FormData(form), close);
    } catch (err) {
      submitBtn.disabled = false;
      throw err;
    }
  });

  document.body.appendChild(overlay);
  const first = overlay.querySelector('input, select, textarea');
  if (first) first.focus();
  return close;
}
