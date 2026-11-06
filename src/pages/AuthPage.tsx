import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Clapperboard, KeyRound, LogIn, UserPlus, MailCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { BUTTON_PRIMARY, BUTTON_SECONDARY, CARD, INPUT, LABEL } from '@/components/ui/styles';
import { CinemaLogo } from '@/components/ui/CinemaLogo';
import { LoadingState } from '@/components/ui/StatusViews';
import { navigateTo } from '@/lib/router';

type AuthMode = 'sign-in' | 'sign-up' | 'forgot-password';
const PASSWORD_RESET_COOLDOWN_KEY = 'cinema:password-reset-next-request-at';
const PASSWORD_RESET_COOLDOWN_SECONDS = 60;

function readPasswordResetCooldown(): number {
  try {
    const nextRequestAt = Number(window.localStorage.getItem(PASSWORD_RESET_COOLDOWN_KEY));
    return Number.isFinite(nextRequestAt)
      ? Math.max(0, Math.ceil((nextRequestAt - Date.now()) / 1000))
      : 0;
  } catch {
    return 0;
  }
}

const COPY: Record<AuthMode, { title: string; subtitle: string; submit: string }> = {
  'sign-in': { title: 'Welcome Back', subtitle: 'Sign In To Your Cinema Account.', submit: 'Sign In' },
  'sign-up': { title: 'Create Your Account', subtitle: 'One Account For Your Cinema Experience.', submit: 'Create Account' },
  'forgot-password': { title: 'Reset Your Password', subtitle: 'Enter Your Email And We Will Send You A Reset Link.', submit: 'Send Reset Link' },
};

export function AuthPage({ mode }: { mode: AuthMode }) {
  const { user, loading, signIn, signUp, resendSignupConfirmation, requestPasswordReset, signOut } = useAuth();
  const { notify } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmationPending, setConfirmationPending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [cooldownReady, setCooldownReady] = useState(false);
  const submittingRef = useRef(false);
  const copy = COPY[mode];

  useEffect(() => {
    setCooldownSeconds(readPasswordResetCooldown());
    setCooldownReady(true);
  }, []);

  useEffect(() => {
    if (!cooldownReady) return;
    if (cooldownSeconds <= 0) {
      try { window.localStorage.removeItem(PASSWORD_RESET_COOLDOWN_KEY); } catch { /* Storage may be unavailable. */ }
      return;
    }
    const timer = window.setTimeout(() => setCooldownSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldownSeconds, cooldownReady]);

  function startPasswordResetCooldown(seconds: number) {
    const safeSeconds = Math.max(1, Math.min(3600, Math.ceil(seconds)));
    const nextRequestAt = Date.now() + safeSeconds * 1000;
    try { window.localStorage.setItem(PASSWORD_RESET_COOLDOWN_KEY, String(nextRequestAt)); } catch { /* Storage may be unavailable. */ }
    setCooldownSeconds(safeSeconds);
  }

  if (loading) return <div className="mx-auto max-w-md px-4 py-16"><LoadingState /></div>;

  if (user && mode !== 'forgot-password') {
    return <div className="mx-auto max-w-md animate-rise-in px-4 py-16"><div className={`${CARD} space-y-5 text-center`}>
      <p className="text-lg font-extrabold text-white">You Are Signed In</p><p className="text-sm text-slate-400">{user.email}</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center"><a href="/my-cinema" className={BUTTON_PRIMARY}>Go To My Cinema</a><button type="button" onClick={() => void signOut()} className={BUTTON_SECONDARY}>Sign Out</button></div>
    </div></div>;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;
    setError(null); setNotice(null);
    if (mode === 'forgot-password' && cooldownSeconds > 0) {
      setError(`Please wait ${cooldownSeconds} seconds before requesting another reset email.`);
      return;
    }
    const trimmedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Enter A Valid Email Address.');
      return;
    }
    if (mode === 'sign-up') {
      if (password.length < 8) { setError('Your Password Must Be At Least 8 Characters.'); return; }
      if (password !== confirmPassword) { setError('Your Passwords Do Not Match.'); return; }
    }
    submittingRef.current = true;
    setBusy(true);
    try {
      if (mode === 'sign-in') {
        const failure = await signIn(trimmedEmail, password);
        if (failure) setError(failure);
        else { notify('Welcome Back To Cinema.'); navigateTo('/my-cinema'); }
      } else if (mode === 'sign-up') {
        const result = await signUp(trimmedEmail, password);
        if (result.error) setError(result.error);
        else if (result.needsConfirmation) {
          setConfirmationPending(true);
          setNotice(`Your account details have been accepted for ${trimmedEmail}. Check your inbox (and Spam/Promotions) for Cinema's confirmation email. Confirm your email, sign in, and complete your Cinema profile to finish setting up your account.`);
          notify('Account Created — Check Your Email To Finish.');
        } else {
          notify('Your Cinema Account Is Ready. Set Up Your Cinema Profile Next.');
          navigateTo('/profile');
        }
      } else {
        const failure = await requestPasswordReset(trimmedEmail);
        if (failure) {
          setError(failure);
          const waitMatch = failure.match(/wait\s+(\d+)\s+seconds?/i);
          if (waitMatch) startPasswordResetCooldown(Number(waitMatch[1]));
        } else {
          startPasswordResetCooldown(PASSWORD_RESET_COOLDOWN_SECONDS);
          setNotice('If An Account Exists For This Email, A Password Reset Link Is On Its Way. Check Your Inbox And Spam Folder.');
        }
      }
    } catch (unexpectedError) {
      console.warn('Cinema authentication form failed unexpectedly.', unexpectedError);
      setError('Cinema could not complete this request right now. Check your connection and try again later.');
    } finally {
      submittingRef.current = false;
      setBusy(false);
    }
  }

  async function handleResend() {
    if (submittingRef.current) return;
    setError(null);
    submittingRef.current = true;
    setBusy(true);
    try {
      const failure = await resendSignupConfirmation(email.trim());
      if (failure) setError(failure);
      else { setNotice('A New Confirmation Email Has Been Requested. Check Your Inbox And Spam/Promotions.'); notify('Confirmation Email Requested.'); }
    } catch (unexpectedError) {
      console.warn('Cinema confirmation resend failed unexpectedly.', unexpectedError);
      setError('Cinema could not send the confirmation email right now. Check your connection and try again later.');
    } finally {
      submittingRef.current = false;
      setBusy(false);
    }
  }

  const Icon = mode === 'sign-in' ? LogIn : mode === 'sign-up' ? UserPlus : KeyRound;

  return <div className="mx-auto w-full max-w-md animate-rise-in px-4 py-12 sm:py-16">
    <div className="mb-8 flex justify-center"><CinemaLogo /></div>
    <div className={`${CARD} space-y-6 p-6 sm:p-8`}>
      <div className="space-y-2 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-cinema-600/15 ring-1 ring-cinema-400/30"><Icon className="h-5 w-5 text-cinema-300" /></span>
        <h1 className="text-2xl font-extrabold text-white">{confirmationPending ? 'Check Your Email' : copy.title}</h1>
        <p className="text-sm leading-relaxed text-slate-400">{confirmationPending ? 'One More Step To Activate Your Cinema Account.' : copy.subtitle}</p>
      </div>

      {confirmationPending ? <div className="space-y-4 text-center">
        <div className="rounded-xl border border-white/12 bg-[#10151e] p-4 text-left text-sm leading-relaxed text-[#e5eaf0]" role="status">
          <MailCheck className="mb-2 h-6 w-6" />
          {notice}
        </div>
        <button type="button" disabled={busy} onClick={() => void handleResend()} className={`${BUTTON_PRIMARY} w-full`}>{busy ? 'Please Wait...' : 'Resend Confirmation Email'}</button>
        <button type="button" onClick={() => { setConfirmationPending(false); setNotice(null); }} className={`${BUTTON_SECONDARY} w-full`}>Back To Sign Up</button>
      </div> : <form onSubmit={handleSubmit} className="space-y-5">
        <div><label htmlFor="auth-email" className={LABEL}>Email Address</label><input id="auth-email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className={INPUT} placeholder="you@example.com" /></div>
        {mode !== 'forgot-password' && <div><label htmlFor="auth-password" className={LABEL}>Password</label><input id="auth-password" type="password" autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'} required value={password} onChange={e => setPassword(e.target.value)} className={INPUT} placeholder={mode === 'sign-up' ? 'At Least 8 Characters' : 'Your Password'} /></div>}
        {mode === 'sign-up' && <div><label htmlFor="auth-confirm-password" className={LABEL}>Confirm Password</label><input id="auth-confirm-password" type="password" autoComplete="new-password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={INPUT} placeholder="Enter Your Password Again" /></div>}
        {error && <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p>}
        {notice && <p role="status" className="rounded-xl border border-white/12 bg-[#10151e] px-4 py-3 text-sm text-[#e5eaf0]">{notice}</p>}
        {mode === 'forgot-password' && cooldownSeconds > 0 && <p role="status" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">For Account Security, You Can Request Another Reset Email In {cooldownSeconds} Seconds.</p>}
        <button type="submit" disabled={busy || (mode === 'forgot-password' && (!cooldownReady || cooldownSeconds > 0))} className={`${BUTTON_PRIMARY} w-full`}>{busy ? 'Please Wait...' : mode === 'forgot-password' && !cooldownReady ? 'Checking...' : mode === 'forgot-password' && cooldownSeconds > 0 ? `Try Again In ${cooldownSeconds}s` : copy.submit}</button>
      </form>}

      <div className="space-y-2 text-center text-sm text-slate-400">
        {mode === 'sign-in' && <><p>New To Cinema? <a href="/sign-up" className="font-semibold text-white underline decoration-white/25 underline-offset-4 hover:decoration-white/70">Create An Account</a></p><p><a href="/forgot-password" className="font-semibold text-cinema-300 hover:text-white">Forgot Your Password?</a></p></>}
        {mode === 'sign-up' && !confirmationPending && <p>Already Have An Account? <a href="/sign-in" className="font-semibold text-cinema-300 hover:text-white">Sign In</a></p>}
        {mode === 'forgot-password' && <p>Remembered It? <a href="/sign-in" className="font-semibold text-cinema-300 hover:text-white">Back To Sign In</a></p>}
        {confirmationPending && <p><a href="/sign-in" className="font-semibold text-cinema-300 hover:text-white">Go To Sign In</a></p>}
      </div>
    </div>
    <p className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500"><Clapperboard className="h-3.5 w-3.5" /> Secure Sign-In Powered By Cinema</p>
  </div>;
}
