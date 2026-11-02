import { useCallback, useEffect, useState, type DependencyList } from 'react';

interface AsyncState<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

const REQUEST_TIMEOUT_MS = 15_000;

export function useAsyncData<T>(loader: () => Promise<T>, deps: DependencyList) {
  const [state, setState] = useState<AsyncState<T>>({ data: null, error: null, loading: true });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    setState((previous) => ({ ...previous, loading: true, error: null }));

    const request = Promise.resolve().then(loader);
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('This request is taking too long. Check your connection and try again.')), REQUEST_TIMEOUT_MS);
    });

    Promise.race([request, timeout])
      .then((data) => {
        if (active) setState({ data, error: null, loading: false });
      })
      .catch((reason: unknown) => {
        if (active) {
          setState((previous) => ({
            ...previous,
            error: reason instanceof Error ? reason : new Error('Request failed.'),
            loading: false,
          }));
        }
      })
      .finally(() => {
        if (timeoutId !== undefined) clearTimeout(timeoutId);
      });

    return () => {
      active = false;
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
    // The caller supplies the values that define this request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);

  const reload = useCallback(() => setVersion((current) => current + 1), []);

  return { ...state, reload };
}
