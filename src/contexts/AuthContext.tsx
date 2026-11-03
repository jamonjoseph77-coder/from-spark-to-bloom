import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AuthError, Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { checkIsAdmin } from '@/lib/library';

export interface AuthContextValue {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  recoveryMode: boolean;
  refreshAdmin: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  resendSignupConfirmation: (email: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<string | null>;
  completePasswordReset: (password: string) => Promise<string | null>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

function describeAuthError(error: AuthError): string {
  const message = error.message.toLowerCase();
  const code = (error as AuthError & { code?: string }).code?.toLowerCase() ?? '';

  if (code === 'email_address_not_authorized' || message.includes('email address not authorized')) {
    return 'Cinema could not send the confirmation email. Supabase’s default email service only sends to project team members. Email delivery needs a configured email provider.';
  }
  if (code === 'over_email_send_rate_limit' || message.includes('email rate limit') || message.includes('too many emails')) {
    return 'Cinema has reached Supabase’s email sending limit. No confirmation email was sent. Please wait before requesting another email.';
  }
  if (code === 'over_request_rate_limit' || error.status === 429 || message.includes('rate limit') || message.includes('too many requests')) {
    return 'Too many sign-in or sign-up attempts were made from this connection. Please wait for the limit to reset before trying once more.';
  }
  if (message.includes('invalid login credentials')) return 'Email or password is incorrect.';
  if (message.includes('already registered')) return 'An account with this email already exists. Try signing in instead.';
  if (message.includes('email not confirmed')) return 'Your email is not confirmed yet. Check your inbox or request a new confirmation email.';
  if (message.includes('password')) return error.message;
  if (message.includes('fetch') || message.includes('network')) return 'We could not reach Cinema. Check your connection and try again.';
  return error.message || 'Something went wrong. Please try again.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true);
      if (event === 'SIGNED_OUT') setRecoveryMode(false);
    });
    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user.id ?? null;
  const refreshAdmin = useCallback(async () => {
    if (!userId) { setIsAdmin(false); return; }
    try { setIsAdmin(await checkIsAdmin()); } catch { setIsAdmin(false); }
  }, [userId]);

  useEffect(() => { void refreshAdmin(); }, [refreshAdmin]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? describeAuthError(error) : null;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) return { error: describeAuthError(error), needsConfirmation: false };
    return { error: null, needsConfirmation: !data.session };
  }, []);

  const resendSignupConfirmation = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    return error ? describeAuthError(error) : null;
  }, []);

  const signOut = useCallback(async () => { await supabase.auth.signOut(); }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return error ? describeAuthError(error) : null;
  }, []);

  const completePasswordReset = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return describeAuthError(error);
    setRecoveryMode(false);
    return null;
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user ?? null, isAdmin, loading, recoveryMode, refreshAdmin,
    signIn, signUp, resendSignupConfirmation, signOut, requestPasswordReset, completePasswordReset,
  }), [session, isAdmin, loading, recoveryMode, refreshAdmin, signIn, signUp, resendSignupConfirmation, signOut, requestPasswordReset, completePasswordReset]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
