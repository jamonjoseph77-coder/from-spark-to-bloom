import { createFileRoute } from '@tanstack/react-router';
import { AdminListPage } from '@/pages/AdminPage';

export const Route = createFileRoute('/admin/')({
  head: () => ({
    meta: [
      { title: 'Admin — Cinema' },
      { name: 'description', content: 'Manage Cinema content.' },
      { property: 'og:title', content: 'Admin — Cinema' },
      { property: 'og:description', content: 'Manage Cinema content.' },
    ],
  }),
  component: Page,
});

function Page() {
  return <AdminListPage />;
}
