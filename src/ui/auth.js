import { signInWithPassword } from '../services/auth.js';
import { showToast } from './toast.js';

export function renderAuth(container) {
  container.innerHTML = `
    <section class="auth">
      <div class="auth__brand">FinanceTrack</div>
      <p class="auth__lead">Sign in with email and password. Same account syncs both phones.</p>
      <form class="auth__form" id="auth-form">
        <label class="field">
          <span>Email</span>
          <input class="input input--lg" type="email" name="email" autocomplete="email" required placeholder="you@example.com" value="freshproxy@gmail.com" />
        </label>
        <label class="field">
          <span>Password</span>
          <input class="input input--lg" type="password" name="password" autocomplete="current-password" required value="123" />
        </label>
        <button class="btn btn--primary btn--lg" type="submit" id="auth-submit">Sign in</button>
      </form>
    </section>
  `;

  const form = container.querySelector('#auth-form');
  const submit = container.querySelector('#auth-submit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const email = String(data.get('email') || '');
    const password = String(data.get('password') || '');
    submit.disabled = true;
    try {
      await signInWithPassword(email, password);
      showToast('Signed in', 'success');
    } catch (err) {
      showToast(err.message || 'Sign in failed', 'error');
    } finally {
      submit.disabled = false;
    }
  });
}
