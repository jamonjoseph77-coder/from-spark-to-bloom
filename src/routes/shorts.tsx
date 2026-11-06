import { createFileRoute } from '@tanstack/react-router';
import { ShortsPage } from '@/pages/ShortsPage';

export const Route = createFileRoute('/shorts')({
  head: () => ({
    meta: [
      { title: 'Shorts — Cinema' },
      { name: 'description', content: 'Discover playable short videos from Cinema creators and publishers.' },
    ],
  }),
  component: ShortsPage,
});
