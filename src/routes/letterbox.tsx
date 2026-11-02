import { createFileRoute } from '@tanstack/react-router';
import { useEffect } from 'react';
import { navigateTo } from '@/lib/router';

export const Route = createFileRoute('/letterbox')({
  head: () => ({ meta: [{ title: 'Friends — Cinema' }, { name: 'description', content: 'Share entertainment messages with your Cinema friends.' }] }),
  component: Page,
});

function Page() {
  useEffect(() => { navigateTo('/friends'); }, []);
  return <div className="mx-auto max-w-3xl p-8 text-sm text-slate-400">Opening your friends experience…</div>;
}
