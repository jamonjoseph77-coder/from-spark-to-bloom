import { createFileRoute } from '@tanstack/react-router';
import { SportsPage } from '@/pages/SportsPage';

export const Route = createFileRoute('/sports')({
  head: () => ({
    meta: [
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { title: 'Sports — Cinema' },
      { name: 'description', content: 'Live sports coverage, upcoming events, highlights and replays.' },
      { property: 'og:title', content: 'Sports — Cinema' },
      { property: 'og:description', content: 'Live sports coverage, upcoming events, highlights and replays.' },
    ],
  }),
  component: SportsPage,
});
