import { beforeEach, describe, expect, it, vi } from 'vitest';

const { channel } = vi.hoisted(() => ({
  channel: vi.fn((topic: string) => ({ topic })),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: { channel },
}));

import { createRealtimeChannel } from '@/lib/realtime';

describe('Cinema Realtime channels', () => {
  beforeEach(() => channel.mockClear());

  it('creates a fresh topic for every mounted listener, even when the base topic is shared', () => {
    const first = createRealtimeChannel('cinema-letterbox-feed');
    const second = createRealtimeChannel('cinema-letterbox-feed');

    expect(first).not.toBe(second);
    expect(channel).toHaveBeenCalledTimes(2);
    expect(channel.mock.calls[0][0]).toMatch(/^cinema-letterbox-feed:\d+:\d+$/);
    expect(channel.mock.calls[1][0]).toMatch(/^cinema-letterbox-feed:\d+:\d+$/);
    expect(channel.mock.calls[0][0]).not.toBe(channel.mock.calls[1][0]);
  });
});
