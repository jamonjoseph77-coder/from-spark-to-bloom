import { createFileRoute } from '@tanstack/react-router';
import { CreatorShortsPage } from '@/pages/CreatorShortsPage';

export const Route = createFileRoute('/creator/shorts')({
  head: () => ({
    meta: [
      { title: 'Submit A Short — Cinema' },
      { name: 'description', content: 'Share an original or authorised short video with Cinema.' },
    ],
  }),
  component: CreatorShortsPage,
});
