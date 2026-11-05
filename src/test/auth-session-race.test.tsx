import { act, render, screen, waitFor } from '@testing-library/react';
import { useContext } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session } from '@supabase/supabase-js';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  checkIsAdmin: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: mocks.getSession,
      onAuthStateChange: mocks.onAuthStateChange,
    },
  },
}));

vi.mock('@/lib/library', () => ({
  checkIsAdmin: mocks.checkIsAdmin,
}));

import { AuthContext, AuthProvider } from '@/contexts/AuthContext';

function AuthProbe() {
  const auth = useContext(AuthContext);
  return <output data-testid="auth-user">{auth?.user?.id ?? 'signed-out'}</output>;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

describe('AuthProvider session restoration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.checkIsAdmin.mockResolvedValue(false);
    mocks.onAuthStateChange.mockImplementation(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    }));
  });

  it('does not let a late initial session read overwrite a newer sign-in event', async () => {
    const initialRead = deferred<{ data: { session: Session | null }; error: null }>();
    mocks.getSession.mockReturnValue(initialRead.promise);

    let authListener: ((event: string, session: Session | null) => void) | undefined;
    mocks.onAuthStateChange.mockImplementation((listener: (event: string, session: Session | null) => void) => {
      authListener = listener;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    render(<AuthProvider><AuthProbe /></AuthProvider>);

    const signedInSession = {
      user: { id: 'cinema-test-user' },
    } as Session;

    act(() => authListener?.('SIGNED_IN', signedInSession));
    expect(screen.getByTestId('auth-user')).toHaveTextContent('cinema-test-user');

    await act(async () => {
      initialRead.resolve({ data: { session: null }, error: null });
      await initialRead.promise;
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-user')).toHaveTextContent('cinema-test-user');
    });
  });
});
