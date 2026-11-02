import { createFileRoute } from '@tanstack/react-router';
import { AdminClipsPage } from '@/pages/AdminClipsPage';

export const Route = createFileRoute('/admin/clips')({
  head: () => ({
    meta: [
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { title: 'Publisher videos — Cinema' },
      { name: 'description', content: 'Manage Publisher videos.' },
      { property: 'og:title', content: 'Publisher videos — Cinema' },
      { property: 'og:description', content: 'Manage Publisher videos.' },
    ],
  }),
  component: Page,
});

function Page() {
  return <AdminClipsPage />;
}
