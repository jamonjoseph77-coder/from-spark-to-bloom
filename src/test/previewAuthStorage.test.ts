import { afterEach, describe, expect, it } from 'vitest';
import { brokeredPreviewStorage } from '@/integrations/supabase/previewAuthStorage';

const originalDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage');

afterEach(() => {
  if (originalDescriptor) {
    Object.defineProperty(window, 'localStorage', originalDescriptor);
  }
});

describe('brokeredPreviewStorage', () => {
  it('keeps auth storage usable when browser localStorage is blocked', () => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('Storage access is blocked', 'SecurityError');
      },
    });

    const storage = brokeredPreviewStorage();
    expect(storage).toBeDefined();

    storage?.setItem('cinema-auth', 'session-token');
    expect(storage?.getItem('cinema-auth')).toBe('session-token');

    storage?.removeItem('cinema-auth');
    expect(storage?.getItem('cinema-auth')).toBeNull();
  });

  it('continues to use browser localStorage when it is available', () => {
    const values = new Map<string, string>();
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
      },
    });

    const storage = brokeredPreviewStorage();
    storage?.setItem('cinema-auth', 'session-token');
    expect(storage?.getItem('cinema-auth')).toBe('session-token');

    storage?.removeItem('cinema-auth');
    expect(storage?.getItem('cinema-auth')).toBeNull();
  });
});
