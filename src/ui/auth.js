import { sendMagicLink } from '../services/auth.js';
import { showToast } from './toast.js';

export function renderAuth(container) {
  container.innerHTML = `
    <section class="auth">
      <div class="auth__brand">FinanceTrack</div>
      <p class="auth__lead">Sign in with a magic link. Same account syncs both phones.</p>
      <form class="auth__form" id="auth-form">
        <label class="field">
          <span>Email</span>
          <input class="input input--lg" type="email" name="email" autocomplete="email" required placeholder="you@example.com" />
        </label>
        <button class="btn btn--primary btn--lg" type="submit" id="auth-submit">Send magic link</button>
      </form>
      <p class="auth__hint" id="auth-hint" hidden>Check your email for the sign-in link.</p>
    </section>
  `;

  const form = container.querySelector('#auth-form');
  const hint = container.querySelector('#auth-hint');
  const submit = container.querySelector('#auth-submit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = new FormData(form).get('email');
    submit.disabled = true;
    try {
      await sendMagicLink(String(email));
      hint.hidden = false;
      showToast('Magic link sent', 'success');
    } catch (err) {
      showToast(err.message || 'Could not send link', 'error');
    } finally {
      submit.disabled = false;
    }
  });
}
