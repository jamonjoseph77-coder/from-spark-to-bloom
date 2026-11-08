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

const CINEMA_PRODUCTION_URL = 'https://from-spark-to-bloom.lovable.app';

function getAuthRedirectBaseUrl(): string {
  if (typeof window === 'undefined') return CINEMA_PRODUCTION_URL;
  const { origin, hostname } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
    return CINEMA_PRODUCTION_URL;
  }
  return origin;
}

function describeAuthError(error: AuthError): string {
  const message = error.message.toLowerCase();
  const code = (error as AuthError & { code?: string }).code?.toLowerCase() ?? '';

  if (code === 'email_address_not_authorized' || message.includes('email address not authorized')) {
    return 'Cinema could not send this email because the configured email service did not authorize the recipient. Please contact Cinema support.';
  }

  // Supabase uses a separate per-user frequency window for password recovery.
  // Its response includes the remaining wait time; distinguish it from the
  // project-wide hourly email quota even when both use HTTP 429.
  const userWait = message.match(/only request this after\s+(\d+)\s+seconds?/i);
  if (userWait) {
    const seconds = Math.max(1, Number(userWait[1]));
    return `For security, wait ${seconds} seconds before requesting another reset email.`;
  }

  if (
    message.includes('email rate limit exceeded') ||
    message.includes('email sending limit') ||
    message.includes('too many emails') ||
    (code === 'over_email_send_rate_limit' && !message.includes('only request this after'))
  ) {
    return 'Cinema’s email service has reached its project sending limit. No email was sent. Please avoid repeated attempts; the Supabase email configuration or sending quota needs to be checked.';
  }

  if (
    code === 'over_request_rate_limit' ||
    message.includes('too many requests') ||
    (error.status === 429 && !code)
  ) {
    return 'Cinema is temporarily limiting requests from this connection. Please wait a little before trying again.';
  }
  if (message.includes('invalid login credentials')) return 'Email or password is incorrect.';
  if (message.includes('already registered')) return 'An account with this email already exists. Try signing in instead.';
  if (message.includes('email not confirmed')) return 'Your email is not confirmed yet. Check your inbox or request a new confirmation email.';
  if (message.includes('password')) return error.message;
  if (message.includes('fetch') || message.includes('network')) return 'We could not reach Cinema. Check your connection and try again.';
  return error.message || 'Something went wrong. Please try again.';
}

function describeUnexpectedAuthError(error: unknown): string {
  if (error instanceof Error && (error.message.toLowerCase().includes('fetch') || error.message.toLowerCase().includes('network'))) {
    return 'We could not reach Cinema. Check your connection and try again.';
  }
  console.warn('Cinema authentication request failed unexpectedly.', error);
  return 'Cinema could not process this request right now. Please check your connection and try again later.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    let sessionRestoreSettled = false;
    let authEventReceived = false;

    // Never hold the entire Cinema interface behind an auth request that
    // stalls indefinitely on a weak or interrupted connection.
    const sessionRestoreTimeout = window.setTimeout(() => {
      if (!active || sessionRestoreSettled) return;
      sessionRestoreSettled = true;
      console.warn("Cinema session restore timed out. Continuing in signed-out mode.");
      setSession(null);
      setLoading(false);
    }, 10000);

    void supabase.auth.getSession()
      .then(({ data, error }) => {
        if (!active || sessionRestoreSettled) return;
        sessionRestoreSettled = true;
        if (error) console.warn("Cinema could not restore the saved session.", error.message);
        // An auth event is newer than the initial storage read. Never let a
        // delayed getSession response overwrite a sign-in/sign-out event.
        if (!authEventReceived) setSession(data.session ?? null);
      })
      .catch((error: unknown) => {
        if (!active || sessionRestoreSettled) return;
        sessionRestoreSettled = true;
        console.warn("Cinema could not restore the saved session.", error);
        if (!authEventReceived) setSession(null);
      })
      .finally(() => {
        window.clearTimeout(sessionRestoreTimeout);
        if (active) setLoading(false);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, nextSession) => {
      authEventReceived = true;
      sessionRestoreSettled = true;
      window.clearTimeout(sessionRestoreTimeout);
      setSession(nextSession);
      setLoading(false);
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true);
      if (event === 'SIGNED_OUT') setRecoveryMode(false);
    });
    return () => {
      active = false;
      window.clearTimeout(sessionRestoreTimeout);
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
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
      return error ? describeAuthError(error) : null;
    } catch (error: unknown) {
      return describeUnexpectedAuthError(error);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: { emailRedirectTo: getAuthRedirectBaseUrl() },
      });
      if (error) return { error: describeAuthError(error), needsConfirmation: false };
      return { error: null, needsConfirmation: !data.session };
    } catch (error: unknown) {
      return { error: describeUnexpectedAuthError(error), needsConfirmation: false };
    }
  }, []);

  const resendSignupConfirmation = useCallback(async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: normalizedEmail,
        options: { emailRedirectTo: getAuthRedirectBaseUrl() },
      });
      return error ? describeAuthError(error) : null;
    } catch (error: unknown) {
      return describeUnexpectedAuthError(error);
    }
  }, []);

  const signOut = useCallback(async () => { await supabase.auth.signOut(); }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${getAuthRedirectBaseUrl()}/reset-password`,
      });
      return error ? describeAuthError(error) : null;
    } catch (error: unknown) {
      return describeUnexpectedAuthError(error);
    }
  }, []);

  const completePasswordReset = useCallback(async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return describeAuthError(error);
      setRecoveryMode(false);
      return null;
    } catch (error: unknown) {
      return describeUnexpectedAuthError(error);
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user ?? null, isAdmin, loading, recoveryMode, refreshAdmin,
    signIn, signUp, resendSignupConfirmation, signOut, requestPasswordReset, completePasswordReset,
  }), [session, isAdmin, loading, recoveryMode, refreshAdmin, signIn, signUp, resendSignupConfirmation, signOut, requestPasswordReset, completePasswordReset]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
