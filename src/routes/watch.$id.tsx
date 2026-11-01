import { createFileRoute } from '@tanstack/react-router';
import { WatchPage } from '@/pages/WatchPage';

export const Route = createFileRoute('/watch/$id')({
  validateSearch: (search: Record<string, unknown>): { ep?: string } => ({ ep: typeof search.ep === 'string' ? search.ep : undefined }),
  head: () => ({
    meta: [
      { title: 'Watch — Cinema' },
      { name: 'description', content: 'Watch on Cinema.' },
      { property: 'og:title', content: 'Watch — Cinema' },
      { property: 'og:description', content: 'Watch on Cinema.' },
    ],
  }),
  component: Page,
});

function Page() {
  return <WatchPage titleId={Route.useParams().id} episodeId={Route.useSearch().ep ?? null} />;
}
