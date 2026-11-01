import { createFileRoute } from '@tanstack/react-router';
import { TmdbBrowsePage } from '@/pages/TmdbBrowsePage';

export const Route = createFileRoute('/movies')({
  head: () => ({
    meta: [
      { title: 'Movies — Cinema' },
      { name: 'description', content: 'Browse popular and trending movies.' },
      { property: 'og:title', content: 'Movies — Cinema' },
      { property: 'og:description', content: 'Browse popular and trending movies.' },
    ],
  }),
  component: Page,
});

function Page() {
  return <TmdbBrowsePage mediaType="movie" />;
}
