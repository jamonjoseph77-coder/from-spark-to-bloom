import { createFileRoute } from '@tanstack/react-router';
import { TitlePage } from '@/pages/TitlePage';

export const Route = createFileRoute('/title/$id')({
  head: () => ({
    meta: [
      { title: 'Title — Cinema' },
      { name: 'description', content: 'Title details on Cinema.' },
      { property: 'og:title', content: 'Title — Cinema' },
      { property: 'og:description', content: 'Title details on Cinema.' },
    ],
  }),
  component: Page,
});

function Page() {
  return <TitlePage titleId={Route.useParams().id} />;
}
