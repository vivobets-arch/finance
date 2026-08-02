import { APP_PIN, signInWithPin } from '../services/auth.js';
import { showToast } from './toast.js';

export function renderAuth(container) {
  container.innerHTML = `
    <section class="auth">
      <div class="auth__brand">FinanceTrack</div>
      <p class="auth__lead">Enter password to open the app.</p>
      <form class="auth__form" id="auth-form">
        <label class="field">
          <span>Password</span>
          <input
            class="input input--lg input--amount"
            type="password"
            name="pin"
            inputmode="numeric"
            autocomplete="current-password"
            required
            maxlength="12"
            placeholder="•••"
            value="${APP_PIN}"
          />
        </label>
        <button class="btn btn--primary btn--lg btn--block" type="submit" id="auth-submit">Sign in</button>
      </form>
    </section>
  `;

  const form = container.querySelector('#auth-form');
  const submit = container.querySelector('#auth-submit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pin = String(new FormData(form).get('pin') || '');
    submit.disabled = true;
    try {
      await signInWithPin(pin);
      showToast('Signed in', 'success');
    } catch (err) {
      showToast(err.message || 'Sign in failed', 'error');
    } finally {
      submit.disabled = false;
    }
  });
}
