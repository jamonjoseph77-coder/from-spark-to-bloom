import { createFileRoute } from '@tanstack/react-router';
import { AdminTitlePage } from '@/pages/AdminPage';

export const Route = createFileRoute('/admin/title/$id')({
  head: () => ({
    meta: [
      { title: 'Edit title — Cinema' },
      { name: 'description', content: 'Edit a title.' },
      { property: 'og:title', content: 'Edit title — Cinema' },
      { property: 'og:description', content: 'Edit a title.' },
    ],
  }),
  component: Page,
});

function Page() {
  return <AdminTitlePage titleId={Route.useParams().id} />;
}
