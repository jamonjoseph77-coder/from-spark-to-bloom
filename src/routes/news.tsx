import { createFileRoute } from '@tanstack/react-router';
import { BrowsePage } from '@/pages/BrowsePage';

export const Route = createFileRoute('/news')({
  head: () => ({
    meta: [
      { title: 'News — Cinema' },
      { name: 'description', content: 'The latest news on Cinema.' },
      { property: 'og:title', content: 'News — Cinema' },
      { property: 'og:description', content: 'The latest news on Cinema.' },
    ],
  }),
  component: Page,
});

function Page() {
  return <BrowsePage kind="news" />;
}
