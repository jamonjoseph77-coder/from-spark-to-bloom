import { useCallback, useEffect, useState, type DependencyList } from 'react';

interface AsyncState<T> { data: T | null; error: Error | null; loading: boolean; }
const REQUEST_TIMEOUT_MS = 12_000;
const MAX_ATTEMPTS = 3;

function normalizeAsyncError(reason: unknown): Error {
  if (reason instanceof Error) return reason;
  if (reason && typeof reason === 'object') {
    const value = reason as Record<string, unknown>;
    const parts = [value.message, value.details, value.hint].filter((part): part is string => typeof part === 'string' && part.trim().length > 0);
    const code = typeof value.code === 'string' ? value.code : '';
    const status = typeof value.status === 'number' ? value.status : undefined;
    const error = new Error(parts.join(' — ') || (status ? `Request failed with status ${status}.` : 'The request failed for an unknown reason.'));
    if (code) error.name = `SupabaseError(${code})`;
    return error;
  }
  return new Error(typeof reason === 'string' && reason.trim() ? reason : 'The request failed for an unknown reason.');
}

function shouldRetry(error: Error): boolean {
  const message = error.message.toLowerCase();
  return /fetch|network|timeout|timed out|temporar|connection|502|503|504|429/.test(message) || error.name === 'TypeError';
}

async function loadWithRetry<T>(loader: () => Promise<T>): Promise<T> {
  let lastError = new Error('The request could not be completed.');
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      const timeout = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('The request timed out.')), REQUEST_TIMEOUT_MS);
      });
      return await Promise.race([Promise.resolve().then(loader), timeout]);
    } catch (reason) {
      lastError = normalizeAsyncError(reason);
      if (attempt === MAX_ATTEMPTS || !shouldRetry(lastError)) throw lastError;
      await new Promise((resolve) => setTimeout(resolve, attempt * 600));
    } finally {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    }
  }
  throw lastError;
}

export function useAsyncData<T>(loader: () => Promise<T>, deps: DependencyList) {
  const [state, setState] = useState<AsyncState<T>>({ data: null, error: null, loading: true });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    setState((previous) => ({ ...previous, loading: true, error: null }));
    loadWithRetry(loader).then((data) => {
      if (active) setState({ data, error: null, loading: false });
    }).catch((reason: unknown) => {
      const error = normalizeAsyncError(reason);
      console.error('[Cinema] Data request failed after retries:', error);
      if (active) setState((previous) => ({ ...previous, error, loading: false }));
    });
    return () => { active = false; };
    // The caller supplies the values that define this request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);
  const reload = useCallback(() => setVersion((current) => current + 1), []);
  return { ...state, reload };
}
