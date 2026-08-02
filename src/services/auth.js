import { supabase } from '../lib/supabase.js';

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

/** Sign in with email/password. If the user does not exist, try to sign up. */
export async function signInWithPassword(email, password) {
  const trimmed = email.trim();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: trimmed,
    password,
  });

  if (!error) return data.session;

  // User missing or wrong credentials — try create, then sign in again
  const { error: signUpError } = await supabase.auth.signUp({
    email: trimmed,
    password,
  });

  if (signUpError) {
    // Prefer the original sign-in error if sign-up also fails (e.g. already registered + wrong password)
    throw signUpError.message?.includes('already') || signUpError.message?.includes('registered')
      ? error
      : signUpError;
  }

  const retry = await supabase.auth.signInWithPassword({
    email: trimmed,
    password,
  });
  if (retry.error) throw retry.error;
  return retry.data.session;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
