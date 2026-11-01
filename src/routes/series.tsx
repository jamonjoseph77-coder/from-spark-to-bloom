import { createFileRoute } from '@tanstack/react-router';
import { TmdbBrowsePage } from '@/pages/TmdbBrowsePage';

export const Route = createFileRoute('/series')({
  head: () => ({
    meta: [
      { title: 'Series — Cinema' },
      { name: 'description', content: 'Browse popular and trending series.' },
      { property: 'og:title', content: 'Series — Cinema' },
      { property: 'og:description', content: 'Browse popular and trending series.' },
    ],
  }),
  component: Page,
});

function Page() {
  return <TmdbBrowsePage mediaType="tv" />;
}
