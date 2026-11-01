import { createFileRoute } from '@tanstack/react-router';
import { PublishersPage } from '@/pages/PublishersPage';

export const Route = createFileRoute('/publishers/')({
  head: () => ({
    meta: [
      { title: 'Publishers — Cinema' },
      { name: 'description', content: 'Browse publishers.' },
      { property: 'og:title', content: 'Publishers — Cinema' },
      { property: 'og:description', content: 'Browse publishers.' },
    ],
  }),
  component: Page,
});

function Page() {
  return <PublishersPage />;
}
