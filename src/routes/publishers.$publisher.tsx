import { createFileRoute } from '@tanstack/react-router';
import { PublisherPage } from '@/pages/PublisherPage';

export const Route = createFileRoute('/publishers/$publisher')({
  head: () => ({
    meta: [
      { title: 'Publisher — Cinema' },
      { name: 'description', content: 'Publisher catalogue.' },
      { property: 'og:title', content: 'Publisher — Cinema' },
      { property: 'og:description', content: 'Publisher catalogue.' },
    ],
  }),
  component: Page,
});

function Page() {
  return <PublisherPage publisher={Route.useParams().publisher} />;
}
