import { createFileRoute } from '@tanstack/react-router';
import { FreeContentPage } from '@/pages/FreeContentPage';

export const Route = createFileRoute('/free')({
  head: () => ({
    meta: [
      { title: 'Free Movies & Series — Cinema' },
      { name: 'description', content: 'Explore movies and series marked free to watch on Cinema.' },
    ],
  }),
  component: FreeContentPage,
});
