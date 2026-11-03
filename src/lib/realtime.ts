import { supabase } from '@/lib/supabase';

let channelSequence = 0;

/**
 * Give every mounted listener its own Realtime topic.
 *
 * Several Cinema screens can listen to the same table at once (for example,
 * Friends activity and the embedded Letterbox feed). Supabase channels must
 * have all postgres_changes handlers registered before subscribe(), and a
 * subscribed channel must never be reused to attach another handler.
 */
export function createRealtimeChannel(topic: string) {
  channelSequence += 1;
  return supabase.channel(`${topic}:${channelSequence}`);
}
