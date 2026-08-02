import { supabase } from '../lib/supabase.js';

/** Hidden account used for both phones (Supabase still requires email). */
const APP_EMAIL = 'freshproxy@gmail.com';
/** Real Supabase password (min 6 chars). UI PIN "123" maps to this. */
const APP_PASSWORD = '123456';
/** What the user types on the login screen. */
export const APP_PIN = '123';

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export function onAuthStateChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return () => data.subscription.unsubscribe();
}

/** Unlock with PIN only — email/password stay in the app, not on screen. */
export async function signInWithPin(pin) {
  if (String(pin).trim() !== APP_PIN) {
    throw new Error('Wrong password');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: APP_EMAIL,
    password: APP_PASSWORD,
  });

  if (!error) return data.session;

  const { error: signUpError } = await supabase.auth.signUp({
    email: APP_EMAIL,
    password: APP_PASSWORD,
  });

  if (signUpError) {
    const already =
      signUpError.message?.includes('already') ||
      signUpError.message?.includes('registered');
    throw already ? error : signUpError;
  }

  const retry = await supabase.auth.signInWithPassword({
    email: APP_EMAIL,
    password: APP_PASSWORD,
  });
  if (retry.error) throw retry.error;
  return retry.data.session;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
