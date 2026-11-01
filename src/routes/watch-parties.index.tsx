import { createFileRoute } from '@tanstack/react-router';
import { WatchPartiesPage } from '@/pages/WatchPartiesPage';

export const Route = createFileRoute('/watch-parties/')({
  head: () => ({
    meta: [
      { title: 'Watch Parties — Cinema' },
      { name: 'description', content: 'Watch together with friends.' },
      { property: 'og:title', content: 'Watch Parties — Cinema' },
      { property: 'og:description', content: 'Watch together with friends.' },
    ],
  }),
  component: Page,
});

function Page() {
  return <WatchPartiesPage />;
}
